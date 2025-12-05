# ACR Managed Identity - Quick Start Guide

## Overview

This guide provides quick commands to deploy and configure ACR with managed identity authentication.

## Prerequisites

- Azure CLI installed and logged in
- kubectl installed
- Appropriate permissions in Azure subscription
- Azure DevOps access

## Quick Deployment

### 1. Deploy Infrastructure (5 minutes)

```bash
# Set environment variables
export ENVIRONMENT="dev"  # or staging, prod
export LOCATION="eastus"
export SQL_ADMIN_USER="sqladmin"
export SQL_ADMIN_PASSWORD="YourSecurePassword123!"

# Deploy infrastructure with AKS enabled
az deployment sub create \
  --location $LOCATION \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters/parameters.aks-enabled.json \
  --parameters sqlAdminUsername=$SQL_ADMIN_USER \
  --parameters sqlAdminPassword=$SQL_ADMIN_PASSWORD \
  --parameters environment=$ENVIRONMENT \
  --name "jobpilot-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"
```

### 2. Configure AKS-ACR Integration (3 minutes)

```bash
# Run configuration script
cd infrastructure/azure/scripts
chmod +x configure-aks-acr.sh
./configure-aks-acr.sh $ENVIRONMENT jobpilot-${ENVIRONMENT}-rg
```

### 3. Get Deployment Outputs

```bash
# Get resource group name
export RG_NAME="jobpilot-${ENVIRONMENT}-rg"

# Get ACR login server
export ACR_LOGIN_SERVER=$(az acr show \
  --name $(az acr list -g $RG_NAME --query "[0].name" -o tsv) \
  --query loginServer -o tsv)

# Get workload identity client ID
export WORKLOAD_IDENTITY_CLIENT_ID=$(az identity show \
  -n jobpilot-${ENVIRONMENT}-workload-identity \
  -g $RG_NAME \
  --query clientId -o tsv)

# Get tenant ID
export TENANT_ID=$(az account show --query tenantId -o tsv)

# Get AKS cluster name
export AKS_CLUSTER_NAME=$(az aks list -g $RG_NAME --query "[0].name" -o tsv)

# Display values
echo "=================================="
echo "Deployment Information"
echo "=================================="
echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo "Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"
echo "Tenant ID: $TENANT_ID"
echo "AKS Cluster: $AKS_CLUSTER_NAME"
echo "=================================="
```

### 4. Update Kubernetes Manifests (2 minutes)

```bash
cd infrastructure/kubernetes

# Update service account with actual values
sed -i "s/\${WORKLOAD_IDENTITY_CLIENT_ID}/${WORKLOAD_IDENTITY_CLIENT_ID}/g" base/serviceaccount.yaml
sed -i "s/\${AZURE_TENANT_ID}/${TENANT_ID}/g" base/serviceaccount.yaml

# Update all service manifests with ACR server
find services -name "*.yaml" -exec sed -i "s/\${ACR_LOGIN_SERVER}/${ACR_LOGIN_SERVER}/g" {} \;

# Verify changes
grep -r "azure.workload.identity" base/serviceaccount.yaml
```

### 5. Deploy to Kubernetes (2 minutes)

```bash
# Get AKS credentials
az aks get-credentials -n $AKS_CLUSTER_NAME -g $RG_NAME --overwrite-existing

# Deploy base resources
kubectl apply -f base/namespace.yaml
kubectl apply -f base/serviceaccount.yaml
kubectl apply -f base/configmap.yaml

# Deploy services
kubectl apply -f services/

# Check deployment status
kubectl get pods -n jobpilot
```

### 6. Configure Azure DevOps (5 minutes)

#### Option A: Using Azure Portal

1. Go to Azure DevOps → Project Settings → Service Connections
2. Create new service connection:
   - Type: Azure Resource Manager
   - Authentication: Managed Identity or Service Principal
   - Scope: Subscription
   - Name: `JobPilot-ServiceConnection`
3. Grant CI/CD managed identity access

#### Option B: Using Azure CLI

```bash
# Get CI/CD managed identity details
export CICD_IDENTITY_ID=$(az identity show \
  -n jobpilot-${ENVIRONMENT}-cicd-identity \
  -g $RG_NAME \
  --query principalId -o tsv)

# Get subscription ID
export SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Assign Contributor role to CI/CD identity (if needed for deployments)
az role assignment create \
  --assignee $CICD_IDENTITY_ID \
  --role "Contributor" \
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RG_NAME}"

echo "CI/CD Identity configured"
echo "Configure service connection in Azure DevOps with this identity"
```

### 7. Test the Setup

#### Test ACR Access from AKS

```bash
# Create test pod
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: acr-auth-test
  namespace: jobpilot
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: jobpilot-service-account
  containers:
  - name: test
    image: mcr.microsoft.com/azure-cli
    command:
      - sh
      - -c
      - |
        echo "Testing Azure authentication..."
        az login --identity
        echo "Logged in successfully!"

        echo "Testing ACR access..."
        az acr list

        echo "All tests passed!"
        sleep 300
EOF

# Check test pod logs
kubectl logs acr-auth-test -n jobpilot -f

# Clean up
kubectl delete pod acr-auth-test -n jobpilot
```

#### Test Docker Push from Local Machine

```bash
# Login to ACR
az acr login --name $(az acr list -g $RG_NAME --query "[0].name" -o tsv)

# Tag and push a test image
docker pull nginx:alpine
docker tag nginx:alpine ${ACR_LOGIN_SERVER}/nginx:test
docker push ${ACR_LOGIN_SERVER}/nginx:test

# Verify image in ACR
az acr repository list --name $(az acr list -g $RG_NAME --query "[0].name" -o tsv)
```

## Common Commands

### View Managed Identities

```bash
az identity list -g $RG_NAME -o table
```

### View Role Assignments

```bash
# ACR role assignments
ACR_ID=$(az acr show -n $(az acr list -g $RG_NAME --query "[0].name" -o tsv) --query id -o tsv)
az role assignment list --scope $ACR_ID -o table
```

### View AKS Configuration

```bash
# OIDC issuer
az aks show -n $AKS_CLUSTER_NAME -g $RG_NAME --query oidcIssuerProfile

# Identity profile
az aks show -n $AKS_CLUSTER_NAME -g $RG_NAME --query identityProfile

# Workload identity status
az aks show -n $AKS_CLUSTER_NAME -g $RG_NAME --query securityProfile.workloadIdentity
```

### View Federated Credentials

```bash
az identity federated-credential list \
  --identity-name jobpilot-${ENVIRONMENT}-workload-identity \
  -g $RG_NAME -o table
```

### Kubernetes Service Account

```bash
# View service account
kubectl get serviceaccount jobpilot-service-account -n jobpilot -o yaml

# View pods using service account
kubectl get pods -n jobpilot -o custom-columns=NAME:.metadata.name,SA:.spec.serviceAccountName
```

## Troubleshooting Quick Fixes

### Issue: ImagePullBackOff

```bash
# Check kubelet identity role
KUBELET_ID=$(az identity show -n jobpilot-${ENVIRONMENT}-aks-kubelet-identity -g $RG_NAME --query principalId -o tsv)
ACR_ID=$(az acr show -n $(az acr list -g $RG_NAME --query "[0].name" -o tsv) --query id -o tsv)

# List current roles
az role assignment list --assignee $KUBELET_ID --scope $ACR_ID

# Assign AcrPull if missing
az role assignment create --assignee $KUBELET_ID --scope $ACR_ID --role AcrPull
```

### Issue: Workload Identity Not Working

```bash
# Verify pod labels
kubectl get pod <pod-name> -n jobpilot -o jsonpath='{.metadata.labels}'

# Should include: "azure.workload.identity/use": "true"

# Verify service account
kubectl get pod <pod-name> -n jobpilot -o jsonpath='{.spec.serviceAccountName}'

# Should be: jobpilot-service-account
```

### Issue: Azure DevOps Can't Push

```bash
# Check CI/CD identity permissions
CICD_ID=$(az identity show -n jobpilot-${ENVIRONMENT}-cicd-identity -g $RG_NAME --query principalId -o tsv)
ACR_ID=$(az acr show -n $(az acr list -g $RG_NAME --query "[0].name" -o tsv) --query id -o tsv)

# List roles
az role assignment list --assignee $CICD_ID --scope $ACR_ID

# Assign AcrPush if missing
az role assignment create --assignee $CICD_ID --scope $ACR_ID --role AcrPush
az role assignment create --assignee $CICD_ID --scope $ACR_ID --role AcrPull
```

## Clean Up

```bash
# Delete test resources
kubectl delete namespace jobpilot

# Delete resource group (WARNING: This deletes everything!)
az group delete -n $RG_NAME --yes --no-wait
```

## Next Steps

1. Review the comprehensive migration guide: `ACR-MANAGED-IDENTITY-MIGRATION.md`
2. Configure Azure DevOps pipeline variables
3. Test CI/CD pipeline with a sample deployment
4. Configure production environment
5. Set up monitoring and alerts

## Support

For detailed documentation, see:
- `ACR-MANAGED-IDENTITY-MIGRATION.md` - Complete migration guide
- `infrastructure/azure/README.md` - Infrastructure documentation
- `infrastructure/kubernetes/README.md` - Kubernetes deployment guide
