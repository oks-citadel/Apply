# ACR Managed Identity Migration Guide

## Overview

This guide covers the migration from ACR admin credentials to managed identity authentication for the JobPilot AI Platform. This change improves security by eliminating the need to manage and rotate admin credentials.

## What Changed

### 1. Azure Container Registry (ACR)

**Before:**
- `adminUserEnabled: true`
- Admin username and password stored in Key Vault
- Credentials used by CI/CD and AKS

**After:**
- `adminUserEnabled: false`
- User Assigned Managed Identities for authentication
- Role-based access control (RBAC) for ACR access

### 2. Managed Identities Created

Three User Assigned Managed Identities are now created:

1. **CI/CD Identity** (`jobpilot-{env}-cicd-identity`)
   - Used by Azure DevOps pipelines
   - Has `AcrPush` and `AcrPull` roles

2. **Workload Identity** (`jobpilot-{env}-workload-identity`)
   - Used by Kubernetes pods via workload identity federation
   - Has `AcrPull` role

3. **AKS Kubelet Identity** (`jobpilot-{env}-aks-kubelet-identity`)
   - Used by AKS nodes to pull images
   - Has `AcrPull` role

### 3. AKS Cluster Configuration

**New Features Enabled:**
- Workload Identity
- OIDC Issuer
- Managed Identity for kubelet
- Azure AD integration with RBAC

### 4. Kubernetes Manifests

**Changes:**
- Service account annotated with workload identity client ID
- Pod templates labeled with `azure.workload.identity/use: "true"`
- No `imagePullSecrets` required
- Image references updated to use ACR login server

### 5. Azure DevOps Pipeline

**Changes:**
- Uses `AzureCLI@2` task with service connection
- Authenticates to ACR with `az acr login` (no credentials)
- Builds and pushes images using managed identity

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure DevOps Pipeline                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ CI/CD Managed Identity                                    │  │
│  │  - AcrPush role                                           │  │
│  │  - AcrPull role                                           │  │
│  └────────────────┬──────────────────────────────────────────┘  │
└─────────────────┬─┴──────────────────────────────────────────────┘
                  │
                  │ Push/Pull Images
                  ▼
     ┌────────────────────────────────┐
     │  Azure Container Registry      │
     │  (Admin credentials disabled)  │
     └────────────┬───────────────────┘
                  │
                  │ Pull Images
                  ▼
     ┌────────────────────────────────┐
     │        AKS Cluster             │
     │  ┌──────────────────────────┐  │
     │  │ Kubelet Identity         │  │
     │  │  - AcrPull role          │  │
     │  └──────────────────────────┘  │
     │                                 │
     │  ┌──────────────────────────┐  │
     │  │ Workload Identity        │  │
     │  │  - Federated to SA       │  │
     │  │  - OIDC token exchange   │  │
     │  │  - AcrPull role          │  │
     │  └──────────────────────────┘  │
     │                                 │
     │  ┌──────────────────────────┐  │
     │  │ Pods                     │  │
     │  │  - Use service account   │  │
     │  │  - Workload identity     │  │
     │  │  - No imagePullSecrets   │  │
     │  └──────────────────────────┘  │
     └─────────────────────────────────┘
```

## Deployment Steps

### Step 1: Update Infrastructure

Deploy the updated Bicep templates:

```bash
# Set environment
ENVIRONMENT="dev"  # or staging, prod

# Deploy infrastructure
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters.${ENVIRONMENT}.json \
  --parameters enableAKS=true \
  --name "jobpilot-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
```

### Step 2: Configure AKS-ACR Integration

Run the configuration script:

```bash
cd infrastructure/azure/scripts

# Make script executable (if not already)
chmod +x configure-aks-acr.sh

# Run configuration
./configure-aks-acr.sh ${ENVIRONMENT} jobpilot-${ENVIRONMENT}-rg
```

This script will:
- Retrieve AKS and ACR information
- Configure workload identity federation
- Update Kubernetes service account
- Verify ACR access permissions
- Test image pull capability

### Step 3: Update Azure DevOps Service Connection

1. Navigate to Azure DevOps Project Settings
2. Go to Service Connections
3. Create or update service connection:
   - Type: Azure Resource Manager
   - Authentication: Managed Identity or Service Principal
   - Name: `JobPilot-ServiceConnection`
   - Assign the CI/CD managed identity

### Step 4: Update Kubernetes Manifests

Get ACR login server:

```bash
ACR_LOGIN_SERVER=$(az acr show \
  --name $(az acr list -g jobpilot-${ENVIRONMENT}-rg --query "[0].name" -o tsv) \
  --query loginServer -o tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"
```

Update manifests:

```bash
cd infrastructure/kubernetes

# Update all service manifests
./update-manifests-for-managed-identity.sh $ACR_LOGIN_SERVER
```

Or manually update each service YAML:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    metadata:
      labels:
        azure.workload.identity/use: "true"  # Add this label
    spec:
      serviceAccountName: jobpilot-service-account
      containers:
      - name: auth-service
        image: ${ACR_LOGIN_SERVER}/auth-service:latest  # Update image reference
```

### Step 5: Update Service Account with Actual Values

Get managed identity details:

```bash
# Get workload identity client ID
WORKLOAD_IDENTITY_CLIENT_ID=$(az identity show \
  -n jobpilot-${ENVIRONMENT}-workload-identity \
  -g jobpilot-${ENVIRONMENT}-rg \
  --query clientId -o tsv)

# Get tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)

echo "Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"
echo "Tenant ID: $TENANT_ID"
```

Update `infrastructure/kubernetes/base/serviceaccount.yaml`:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jobpilot-service-account
  namespace: jobpilot
  annotations:
    azure.workload.identity/client-id: "<WORKLOAD_IDENTITY_CLIENT_ID>"
    azure.workload.identity/tenant-id: "<TENANT_ID>"
```

### Step 6: Deploy to Kubernetes

```bash
# Apply namespace and service account
kubectl apply -f infrastructure/kubernetes/base/namespace.yaml
kubectl apply -f infrastructure/kubernetes/base/serviceaccount.yaml

# Deploy services
kubectl apply -f infrastructure/kubernetes/services/
```

### Step 7: Verify Deployment

Check pod status:

```bash
kubectl get pods -n jobpilot

# Check for image pull errors
kubectl describe pod <pod-name> -n jobpilot

# Check service account
kubectl get serviceaccount jobpilot-service-account -n jobpilot -o yaml
```

Test workload identity:

```bash
# Create test pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: workload-identity-test
  namespace: jobpilot
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: jobpilot-service-account
  containers:
  - name: test
    image: mcr.microsoft.com/azure-cli
    command: ["sh", "-c", "az login --identity && az acr list && sleep 3600"]
EOF

# Check logs
kubectl logs workload-identity-test -n jobpilot
```

## Verification Checklist

- [ ] ACR admin user is disabled
- [ ] Managed identities are created
- [ ] AKS cluster has OIDC issuer enabled
- [ ] Workload identity federation is configured
- [ ] Service account has correct annotations
- [ ] Pods have workload identity label
- [ ] Images can be pulled from ACR
- [ ] Azure DevOps pipeline can push to ACR
- [ ] No imagePullSecrets in manifests

## Troubleshooting

### Issue: Pods fail to pull images

**Symptom:**
```
Failed to pull image "xxx.azurecr.io/auth-service:latest":
rpc error: code = Unknown desc = failed to pull and unpack image
```

**Solution:**
1. Verify kubelet identity has AcrPull role:
   ```bash
   az role assignment list \
     --assignee $(az identity show -n jobpilot-${ENVIRONMENT}-aks-kubelet-identity -g jobpilot-${ENVIRONMENT}-rg --query principalId -o tsv) \
     --scope $(az acr show -n <acr-name> -g jobpilot-${ENVIRONMENT}-rg --query id -o tsv)
   ```

2. Check AKS identity configuration:
   ```bash
   az aks show -n jobpilot-${ENVIRONMENT}-aks -g jobpilot-${ENVIRONMENT}-rg --query identityProfile
   ```

### Issue: Azure DevOps pipeline fails to push images

**Symptom:**
```
unauthorized: authentication required
```

**Solution:**
1. Verify service connection has correct managed identity
2. Check CI/CD identity has AcrPush role:
   ```bash
   az role assignment list \
     --assignee $(az identity show -n jobpilot-${ENVIRONMENT}-cicd-identity -g jobpilot-${ENVIRONMENT}-rg --query principalId -o tsv) \
     --scope $(az acr show -n <acr-name> -g jobpilot-${ENVIRONMENT}-rg --query id -o tsv)
   ```

### Issue: Workload identity not working

**Symptom:**
Pods cannot authenticate to Azure resources

**Solution:**
1. Verify OIDC issuer is enabled:
   ```bash
   az aks show -n jobpilot-${ENVIRONMENT}-aks -g jobpilot-${ENVIRONMENT}-rg --query oidcIssuerProfile
   ```

2. Check federated credential:
   ```bash
   az identity federated-credential list \
     --identity-name jobpilot-${ENVIRONMENT}-workload-identity \
     -g jobpilot-${ENVIRONMENT}-rg
   ```

3. Verify pod has correct labels and service account:
   ```bash
   kubectl get pod <pod-name> -n jobpilot -o yaml | grep -A 5 "labels:\|serviceAccountName:"
   ```

## Rollback Plan

If issues occur, you can temporarily re-enable admin credentials:

```bash
# Re-enable admin user (temporary)
az acr update -n <acr-name> --admin-enabled true

# Get credentials
az acr credential show -n <acr-name>

# Create imagePullSecret in Kubernetes
kubectl create secret docker-registry acr-secret \
  --docker-server=<acr-login-server> \
  --docker-username=<admin-username> \
  --docker-password=<admin-password> \
  -n jobpilot

# Add imagePullSecrets to deployments
kubectl patch deployment auth-service -n jobpilot \
  -p '{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"acr-secret"}]}}}}'
```

## Security Benefits

1. **No Credential Storage**: Admin credentials no longer stored in Key Vault
2. **Automatic Rotation**: Managed identity tokens are automatically rotated
3. **Least Privilege**: Fine-grained RBAC controls (AcrPull vs AcrPush)
4. **Audit Trail**: All access is logged via Azure AD
5. **No Credential Leakage**: No credentials in code or configuration
6. **Federation**: Workload identity uses OIDC token exchange (no secrets)

## Additional Resources

- [Azure Workload Identity Documentation](https://azure.github.io/azure-workload-identity/)
- [AKS Managed Identity Documentation](https://learn.microsoft.com/en-us/azure/aks/use-managed-identity)
- [ACR Authentication with Managed Identity](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-authentication-managed-identity)
- [Azure DevOps Service Connections](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)

## Support

For issues or questions, contact the platform team or create an issue in the repository.
