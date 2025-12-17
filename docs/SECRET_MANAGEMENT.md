# Secret Management Guide

## Overview

The ApplyForUs platform implements a comprehensive secret management solution using **Azure Key Vault** integrated with **Azure Kubernetes Service (AKS)** via the **Secrets Store CSI Driver**. This architecture ensures that:

1. **No secrets are stored in source code, Docker images, or CI/CD logs**
2. **Secrets are centrally managed** in Azure Key Vault
3. **The same Docker image runs in all environments** (dev, staging, production)
4. **Configuration is environment-specific** via Kubernetes ConfigMaps
5. **Secret rotation is seamless** without requiring application rebuilds

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                      Azure Key Vault                            │
│  - All secrets stored securely                                  │
│  - Access controlled via Managed Identity                       │
│  - Audit logs for all access                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ CSI Driver Integration
                     │
┌────────────────────▼────────────────────────────────────────────┐
│           AKS Cluster (applyforus namespace)                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SecretProviderClass: applyforus-azure-keyvault          │  │
│  │  - Maps Key Vault secrets to K8s secrets                 │  │
│  │  - Automatic sync on pod creation                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ConfigMaps (per environment)                            │  │
│  │  - applyforus-config-dev                                 │  │
│  │  - applyforus-config-staging                             │  │
│  │  - applyforus-config-production                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Service Pods                                            │  │
│  │  - Mount CSI volume for secrets                          │  │
│  │  - Load ConfigMap for environment config                 │  │
│  │  - NO secrets in env vars from deployment YAML          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Secret Categories

Secrets are organized in Azure Key Vault by category:

| Category | Examples | Key Vault Names |
|----------|----------|-----------------|
| **Database** | PostgreSQL credentials | `postgres-user`, `postgres-password`, `postgres-connection-string` |
| **Cache** | Redis passwords | `redis-password`, `redis-connection-string` |
| **Authentication** | JWT secrets | `jwt-secret`, `jwt-refresh-secret`, `session-secret`, `encryption-key` |
| **OAuth** | Google, LinkedIn, GitHub | `google-client-id`, `google-client-secret`, `linkedin-client-id`, etc. |
| **Storage** | Azure Storage, AWS S3 | `azure-storage-connection-string`, `aws-access-key-id`, etc. |
| **AI Services** | OpenAI, Anthropic | `openai-api-key`, `anthropic-api-key`, `azure-openai-api-key`, `pinecone-api-key` |
| **Email** | SendGrid, SMTP | `sendgrid-api-key`, `smtp-username`, `smtp-password` |
| **Payment** | Stripe | `stripe-secret-key`, `stripe-webhook-secret` |
| **Job Boards** | Indeed, LinkedIn | `indeed-api-key`, `linkedin-api-key`, `glassdoor-api-key`, etc. |
| **Monitoring** | Application Insights, Sentry | `appinsights-instrumentation-key`, `sentry-dsn` |
| **Search** | Elasticsearch | `elasticsearch-password` |

---

## Configuration vs Secrets

### ConfigMaps (Non-Sensitive Configuration)

ConfigMaps contain **non-sensitive, environment-specific configuration**:

- API URLs
- Service discovery endpoints
- Feature flags
- Processing limits
- Timeouts
- Port numbers
- Public configuration

**Example:** `infrastructure/kubernetes/base/configmap-production.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: applyforus-config
  namespace: applyforus
data:
  NODE_ENV: "production"
  API_BASE_URL: "https://api.applyforus.com"
  POSTGRES_HOST: "applyforus-postgres.postgres.database.azure.com"
  POSTGRES_PORT: "5432"
  REDIS_HOST: "applyforus-redis.redis.cache.windows.net"
  # ... more non-sensitive config
```

### Secrets (Sensitive Data)

Secrets contain **sensitive data** and are managed in Azure Key Vault:

- Database passwords
- API keys
- OAuth client secrets
- Encryption keys
- Connection strings with credentials

**Secrets are NEVER stored in:**
- Source code
- Docker images
- Kubernetes YAML files
- CI/CD logs
- Git repository

---

## Setup and Prerequisites

### 1. Azure Key Vault Setup

The Key Vault is provisioned via Terraform:

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

**Terraform provisions:**
- Azure Key Vault with soft delete enabled
- Access policies for Managed Identity
- All secrets from Terraform variables
- Diagnostic settings for audit logs

### 2. AKS Cluster Configuration

**Install Azure Key Vault CSI Driver:**

```bash
# Install via Helm
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm repo update

helm install csi-secrets-store-provider-azure/csi-secrets-store-provider-azure \
  --generate-name \
  --namespace kube-system \
  --set secrets-store-csi-driver.syncSecret.enabled=true \
  --set secrets-store-csi-driver.enableSecretRotation=true \
  --set secrets-store-csi-driver.rotationPollInterval=2m
```

**Enable Workload Identity on AKS:**

```bash
# Already configured via Terraform
az aks update \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks \
  --enable-workload-identity \
  --enable-oidc-issuer
```

### 3. Managed Identity Configuration

The Managed Identity is created via Terraform and has:
- Reader access to the Key Vault
- Get and List permissions on secrets
- Federated credentials for Workload Identity

**Retrieve the Managed Identity Client ID:**

```bash
cd infrastructure/terraform
terraform output workload_identity_client_id
terraform output key_vault_name
terraform output azure_tenant_id
```

### 4. Update SecretProviderClass

Update `infrastructure/kubernetes/base/secrets.yaml` with Terraform outputs:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: applyforus-azure-keyvault
  namespace: applyforus
spec:
  provider: azure
  parameters:
    userAssignedIdentityID: "<FROM_TERRAFORM_OUTPUT>"
    keyvaultName: "<FROM_TERRAFORM_OUTPUT>"
    tenantId: "<FROM_TERRAFORM_OUTPUT>"
    # ... rest of configuration
```

---

## Deployment Workflow

### Step 1: Deploy Infrastructure

```bash
# Provision all Azure resources including Key Vault
cd infrastructure/terraform
terraform apply
```

### Step 2: Populate Secrets in Key Vault

Terraform automatically populates secrets from `terraform.tfvars`. To update secrets:

```bash
# Update secrets in terraform.tfvars (NEVER commit this file!)
# Then apply:
terraform apply -target=module.key_vault_secrets
```

**Manual secret update (for sensitive operations):**

```bash
# Update a specific secret
az keyvault secret set \
  --vault-name <KEY_VAULT_NAME> \
  --name jwt-secret \
  --value "<NEW_SECRET_VALUE>"
```

### Step 3: Deploy SecretProviderClass

```bash
# Apply the SecretProviderClass
kubectl apply -f infrastructure/kubernetes/base/secrets.yaml
```

### Step 4: Deploy ConfigMaps

```bash
# For production
kubectl apply -f infrastructure/kubernetes/base/configmap-production.yaml

# For staging
kubectl apply -f infrastructure/kubernetes/base/configmap-staging.yaml

# For dev
kubectl apply -f infrastructure/kubernetes/base/configmap-dev.yaml
```

### Step 5: Deploy Services

Service deployments reference both ConfigMap and SecretProviderClass:

```yaml
spec:
  serviceAccountName: applyforus-workload-identity
  containers:
    - name: auth-service
      envFrom:
        - configMapRef:
            name: applyforus-config
        - secretRef:
            name: applyforus-secrets
      volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets-store"
          readOnly: true
  volumes:
    - name: secrets-store
      csi:
        driver: secrets-store.csi.k8s.io
        volumeAttributes:
          secretProviderClass: "applyforus-azure-keyvault"
```

---

## Secret Rotation

### Automatic Rotation (Recommended)

The CSI Driver supports automatic secret rotation:

1. **Update secret in Azure Key Vault:**
   ```bash
   az keyvault secret set \
     --vault-name applyforus-kv \
     --name jwt-secret \
     --value "<NEW_VALUE>"
   ```

2. **CSI Driver automatically syncs** within 2 minutes (configured via `rotationPollInterval`)

3. **Application reads new secret** from mounted volume

4. **Restart pods for immediate effect:**
   ```bash
   kubectl rollout restart deployment/auth-service -n applyforus
   ```

### Manual Rotation Workflow

For critical secrets requiring immediate rotation:

```bash
# 1. Generate new secret value
NEW_SECRET=$(openssl rand -base64 32)

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name applyforus-kv \
  --name jwt-secret \
  --value "$NEW_SECRET"

# 3. Force immediate sync by restarting pods
kubectl rollout restart deployment -l tier=backend -n applyforus

# 4. Verify pods are running
kubectl get pods -n applyforus -w

# 5. Verify secret sync
kubectl describe secretproviderclass applyforus-azure-keyvault -n applyforus
```

**NO REBUILD REQUIRED!** The same Docker image continues to run.

---

## Environment-Specific Configuration

### Same Image, Different Environments

The platform uses **environment-specific ConfigMaps** to configure the same Docker image for different environments:

```bash
# Production
kubectl apply -f infrastructure/kubernetes/base/configmap-production.yaml

# Staging
kubectl apply -f infrastructure/kubernetes/base/configmap-staging.yaml

# Development
kubectl apply -f infrastructure/kubernetes/base/configmap-dev.yaml
```

### Environment Variables in Pods

Pods receive configuration from two sources:

1. **ConfigMap** (non-sensitive):
   - `API_BASE_URL`
   - `POSTGRES_HOST`
   - `REDIS_HOST`
   - Feature flags
   - Timeouts

2. **Secret (from Key Vault)**:
   - `POSTGRES_PASSWORD`
   - `REDIS_PASSWORD`
   - `JWT_SECRET`
   - API keys

**Inside a pod:**

```bash
# Non-sensitive config from ConfigMap
echo $API_BASE_URL
# https://api.applyforus.com

# Sensitive secret from Key Vault
echo $JWT_SECRET
# <actual secret from Key Vault>

# Secrets also available as files
cat /mnt/secrets-store/JWT_SECRET
```

---

## Security Best Practices

### ✅ DO

- **Store all secrets in Azure Key Vault**
- **Use Managed Identities** for authentication
- **Enable secret rotation** via CSI Driver
- **Use different secrets** for each environment
- **Audit Key Vault access** via Azure Monitor
- **Restrict Key Vault access** to specific managed identities
- **Use ConfigMaps** for non-sensitive configuration
- **Review Key Vault audit logs** regularly

### ❌ DON'T

- **Never commit secrets** to Git
- **Never hardcode secrets** in Dockerfiles
- **Never log secrets** in application code
- **Never echo secrets** in CI/CD pipelines
- **Never store secrets** in environment variables in Kubernetes deployment YAML
- **Never use the same secrets** across all environments
- **Never disable Key Vault audit logging**

---

## Troubleshooting

### Secrets not syncing to pods

**Check CSI Driver installation:**

```bash
kubectl get pods -n kube-system -l app=secrets-store-csi-driver
```

**Check SecretProviderClass:**

```bash
kubectl describe secretproviderclass applyforus-azure-keyvault -n applyforus
```

**Check pod events:**

```bash
kubectl describe pod <POD_NAME> -n applyforus | grep -A 10 Events
```

### Pod cannot access Key Vault

**Verify Managed Identity:**

```bash
# Check identity client ID in ServiceAccount
kubectl get serviceaccount applyforus-workload-identity -n applyforus -o yaml

# Check pod identity
kubectl describe pod <POD_NAME> -n applyforus | grep azure.workload.identity
```

**Verify Key Vault access policies:**

```bash
az keyvault show \
  --name applyforus-kv \
  --query properties.accessPolicies
```

### Secret values are outdated

**Force secret refresh:**

```bash
# Restart deployment to force re-mount
kubectl rollout restart deployment/<SERVICE_NAME> -n applyforus

# Check sync status
kubectl get secretproviderclasspodstatus -n applyforus
```

---

## Terraform Secret Management

### Providing Secrets to Terraform

**Option 1: Environment Variables (Recommended for CI/CD)**

```bash
export TF_VAR_jwt_secret="<SECRET_VALUE>"
export TF_VAR_postgres_admin_password="<PASSWORD>"
terraform apply
```

**Option 2: terraform.tfvars (Local Development)**

Create `infrastructure/terraform/terraform.tfvars` (NEVER commit to Git!):

```hcl
# NEVER COMMIT THIS FILE!
jwt_secret              = "<your-jwt-secret>"
jwt_refresh_secret      = "<your-jwt-refresh-secret>"
postgres_admin_password = "<your-postgres-password>"
redis_password          = "<your-redis-password>"
# ... other secrets
```

Add to `.gitignore`:

```
**/terraform.tfvars
**/*.tfvars
!*.tfvars.example
```

**Option 3: Secret Management Tools**

```bash
# Use Azure CLI to inject secrets
JWT_SECRET=$(az keyvault secret show --vault-name applyforus-kv --name jwt-secret --query value -o tsv)
terraform apply -var="jwt_secret=$JWT_SECRET"
```

### Terraform State Security

**Terraform state contains secrets!** Protect it:

```hcl
# backend.tf
terraform {
  backend "azurerm" {
    resource_group_name  = "terraform-state-rg"
    storage_account_name = "tfstateapplyforus"
    container_name       = "tfstate"
    key                  = "applyforus.tfstate"

    # Enable encryption
    use_azuread_auth = true
  }
}
```

---

## CI/CD Integration

### GitHub Actions (No Secret Injection)

The updated workflow does NOT inject secrets:

```yaml
- name: Verify Azure Key Vault CSI Driver
  run: |
    echo "Verifying Azure Key Vault CSI Driver is installed..."
    kubectl get pods -n kube-system -l app=secrets-store-csi-driver

    echo "Verifying SecretProviderClass exists..."
    kubectl get secretproviderclass -n applyforus applyforus-azure-keyvault

    echo "Note: All secrets are managed in Azure Key Vault"
    echo "Services will automatically sync secrets via CSI Driver"
```

**What changed:**
- ❌ Removed `kubectl create secret` commands
- ❌ Removed GitHub Actions secrets for application secrets
- ✅ Secrets managed entirely in Azure Key Vault
- ✅ CSI Driver handles secret synchronization
- ✅ Same image deployed to all environments

---

## Monitoring and Auditing

### Key Vault Audit Logs

Monitor all Key Vault access:

```bash
# View recent access logs
az monitor activity-log list \
  --resource-group applyforus-prod-rg \
  --resource-type Microsoft.KeyVault/vaults \
  --start-time 2025-12-15T00:00:00Z

# Query specific secret access
az monitor diagnostic-settings create \
  --resource <KEY_VAULT_ID> \
  --name KeyVaultAudit \
  --workspace <LOG_ANALYTICS_WORKSPACE_ID> \
  --logs '[{"category": "AuditEvent", "enabled": true}]'
```

### Secret Rotation Alerts

Set up alerts for secrets approaching expiration:

```bash
# Azure Monitor alert for secrets not rotated in 90 days
az monitor metrics alert create \
  --name secrets-rotation-alert \
  --resource-group applyforus-prod-rg \
  --scopes <KEY_VAULT_ID> \
  --condition "count SecretNearExpiry > 0" \
  --window-size 1h \
  --evaluation-frequency 1h
```

---

## Migration from Legacy Secret Management

If migrating from hardcoded secrets:

### Step 1: Audit Current Secrets

```bash
# Find hardcoded secrets in code
grep -r "password\s*=" services/
grep -r "api.*key" services/
grep -r "secret.*=" services/
```

### Step 2: Move Secrets to Key Vault

```bash
# For each secret found, add to Key Vault
az keyvault secret set \
  --vault-name applyforus-kv \
  --name <secret-name> \
  --value "<secret-value>"
```

### Step 3: Update Application Code

Replace:
```javascript
const dbPassword = process.env.POSTGRES_PASSWORD || 'hardcoded-password';
```

With:
```javascript
const dbPassword = process.env.POSTGRES_PASSWORD; // From Key Vault via CSI Driver
```

### Step 4: Remove Hardcoded Secrets

```bash
# Remove hardcoded values
# Rebuild Docker images
# Deploy with new configuration
```

---

## Quick Reference

### Key Commands

```bash
# List all secrets in Key Vault
az keyvault secret list --vault-name applyforus-kv

# Get a specific secret
az keyvault secret show --vault-name applyforus-kv --name jwt-secret

# Update a secret
az keyvault secret set --vault-name applyforus-kv --name jwt-secret --value "new-value"

# Verify SecretProviderClass
kubectl get secretproviderclass -n applyforus

# Check secret sync status
kubectl get secretproviderclasspodstatus -n applyforus

# Restart services to pick up new secrets
kubectl rollout restart deployment -l tier=backend -n applyforus
```

### File Locations

- Terraform Key Vault module: `infrastructure/terraform/modules/key-vault/`
- Secret definitions: `infrastructure/terraform/modules/key-vault-secrets/`
- SecretProviderClass: `infrastructure/kubernetes/base/secrets.yaml`
- ConfigMaps: `infrastructure/kubernetes/base/configmap-*.yaml`
- Example deployment: `infrastructure/kubernetes/base/deployment-example.yaml`

---

## Support and Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Secrets Store CSI Driver](https://secrets-store-csi-driver.sigs.k8s.io/)
- [Azure Key Vault Provider](https://azure.github.io/secrets-store-csi-driver-provider-azure/)
- [AKS Workload Identity](https://docs.microsoft.com/en-us/azure/aks/workload-identity-overview)
