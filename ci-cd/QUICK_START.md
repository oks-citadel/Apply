# Azure DevOps CI/CD Quick Start Guide

Fast-track guide to get the ApplyPlatform CI/CD pipeline up and running.

## Prerequisites Checklist

- [ ] Azure subscription with Contributor access
- [ ] Azure DevOps organization: `citadelcloudmanagement`
- [ ] Azure CLI installed and configured
- [ ] kubectl installed
- [ ] Access to project repository

## 5-Minute Setup

### Step 1: Create Azure Resources (5 min)

```bash
# Set variables
export RESOURCE_GROUP="applyforus-prod-rg"
export LOCATION="eastus"
export ACR_NAME="applyforusacr"
export AKS_NAME="applyforus-prod-aks"

# Create everything in one go
az group create --name $RESOURCE_GROUP --location $LOCATION

az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Standard --admin-enabled true

az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 3 \
  --enable-managed-identity \
  --attach-acr $ACR_NAME \
  --generate-ssh-keys

az keyvault create \
  --name applyforus-secrets \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 2: Create Service Principal (2 min)

```bash
# Create SP
az ad sp create-for-rbac \
  --name "ApplyPlatform-CI-CD" \
  --role Contributor \
  --scopes /subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP

# Save the output - you'll need:
# - appId
# - password
# - tenant
```

### Step 3: Configure Azure DevOps (10 min)

#### 3.1 Create Service Connection

1. Go to: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform
2. Navigate: **Project Settings** → **Service connections** → **New service connection**
3. Select: **Azure Resource Manager**
4. Choose: **Service principal (manual)**
5. Fill in details from Step 2
6. Name it: `ApplyPlatform-Azure-Connection`
7. Repeat for Docker Registry connection: `applyforus-acr`

#### 3.2 Create Variable Groups

Quick script to create all variable groups:

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Set organization and project
az devops configure --defaults organization=https://dev.azure.com/citadelcloudmanagement project=ApplyPlatform

# Create variable groups
az pipelines variable-group create --name "ApplyPlatform-Common" \
  --variables NODE_VERSION=20.x PNPM_VERSION=8.15.0 PYTHON_VERSION=3.11

az pipelines variable-group create --name "ApplyPlatform-Dev" \
  --variables ENVIRONMENT=dev AKS_CLUSTER_NAME=applyforus-dev-aks

az pipelines variable-group create --name "ApplyPlatform-Staging" \
  --variables ENVIRONMENT=staging AKS_CLUSTER_NAME=applyforus-staging-aks

az pipelines variable-group create --name "ApplyPlatform-Production" \
  --variables ENVIRONMENT=production AKS_CLUSTER_NAME=applyforus-prod-aks

az pipelines variable-group create --name "ApplyPlatform-Secrets" \
  --variables JWT_SECRET=changeme DATABASE_PASSWORD=changeme
```

Or create manually:
1. **Pipelines** → **Library** → **+ Variable group**
2. Create 5 groups: Common, Dev, Staging, Production, Secrets
3. Add variables from [variable-groups.yml](./azure-pipelines/variable-groups.yml)

#### 3.3 Store Secrets in Key Vault

```bash
# Add critical secrets
az keyvault secret set --vault-name applyforus-secrets --name DATABASE-PASSWORD --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name applyforus-secrets --name JWT-SECRET --value "$(openssl rand -base64 32)"
az keyvault secret set --vault-name applyforus-secrets --name REDIS-PASSWORD --value "$(openssl rand -base64 32)"

# Add API keys (replace with real values)
az keyvault secret set --vault-name applyforus-secrets --name SENDGRID-API-KEY --value "your-key"
az keyvault secret set --vault-name applyforus-secrets --name OPENAI-API-KEY --value "your-key"
```

### Step 4: Create Pipeline (3 min)

1. Go to: **Pipelines** → **New pipeline**
2. Select: **Azure Repos Git**
3. Select: **ApplyPlatform** repository
4. Select: **Existing Azure Pipelines YAML file**
5. Path: `/ci-cd/azure-pipelines/main-pipeline.yml`
6. Click: **Run**

### Step 5: Set Up Environments (5 min)

1. **Pipelines** → **Environments** → **New environment**
2. Create 3 environments:
   - `ApplyPlatform-dev` (no approvals)
   - `ApplyPlatform-staging` (no approvals)
   - `ApplyPlatform-production` (add approvers)

## Verify Setup

### Check Pipeline Status

```bash
# Check pipeline status
az pipelines runs list --project ApplyPlatform --top 5

# Watch specific run
az pipelines runs show --id <run-id> --open
```

### Verify AKS Deployment

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME

# Check deployments
kubectl get deployments -n applyforus

# Check pods
kubectl get pods -n applyforus

# Check services
kubectl get services -n applyforus
```

### Test Application

```bash
# Get ingress IP
kubectl get ingress -n applyforus

# Test health endpoint
curl http://<ingress-ip>/api/health
```

## Common Commands

### Trigger Manual Build

```bash
# Trigger pipeline
az pipelines run --name "ApplyPlatform-CI-CD" --branch develop
```

### Check Build Logs

```bash
# List recent runs
az pipelines runs list --top 5

# Show logs
az pipelines runs show --id <run-id>
```

### Update Variable Group

```bash
# Update variable
az pipelines variable-group variable update \
  --group-id <group-id> \
  --name NODE_VERSION \
  --value 20.x
```

### Deploy Specific Version

Manually trigger deployment:
1. Go to pipeline run
2. Click: **Run pipeline**
3. Select branch/tag
4. Override variables if needed

## Troubleshooting Quick Fixes

### Build Fails

```bash
# Clear cache and rebuild
az pipelines runs list --status failed --top 1
# Delete cache in pipeline artifacts
# Re-run pipeline
```

### Deployment Fails

```bash
# Check AKS cluster
kubectl get nodes
kubectl get events -n applyforus --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs <pod-name> -n applyforus

# Restart deployment
kubectl rollout restart deployment/<deployment-name> -n applyforus
```

### Service Connection Issues

```bash
# Refresh service principal credentials
az ad sp credential reset --id <sp-id>
# Update in Azure DevOps service connection
```

## Next Steps

1. Configure monitoring and alerts
2. Set up branch policies
3. Configure notifications
4. Add custom smoke tests
5. Implement blue-green deployments

## Resources

- [Full Setup Guide](./CI-CD_SETUP.md)
- [Service Connections](./azure-pipelines/service-connections.md)
- [Variable Groups](./azure-pipelines/variable-groups.yml)
- [Azure DevOps Docs](https://docs.microsoft.com/azure/devops/)

## Support

- DevOps Team: devops@applyforus.com
- Emergency: PagerDuty
- Documentation: [CI-CD_SETUP.md](./CI-CD_SETUP.md)

---

**Total Setup Time: ~25 minutes**
