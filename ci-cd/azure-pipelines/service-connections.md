# Azure DevOps Service Connections Setup

This document provides instructions for setting up all required service connections for the ApplyPlatform CI/CD pipeline.

## Overview

Service connections in Azure DevOps enable the pipeline to securely authenticate with external services like Azure, Docker registries, and third-party tools.

## Required Service Connections

### 1. Azure Resource Manager Service Connection

**Name:** `ApplyPlatform-Azure-Connection`

**Type:** Azure Resource Manager (Service Principal)

**Purpose:** Deploy to Azure Kubernetes Service (AKS), access Azure resources

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `Azure Resource Manager`
3. Authentication method: `Service principal (automatic)`
4. Scope level: `Subscription`
5. Configure:
   - Subscription: Select your Azure subscription
   - Resource group: Leave empty (or select specific RG)
   - Service connection name: `ApplyPlatform-Azure-Connection`
   - Grant access permission to all pipelines: ✓
6. Click `Save`

**Required Permissions:**
- Contributor role on the subscription or resource groups
- AKS Cluster Admin role for AKS deployments
- Key Vault Secrets Officer (if using Key Vault)

**Alternative: Manual Service Principal Creation:**

```bash
# Create service principal
az ad sp create-for-rbac \
  --name "ApplyPlatform-CI-CD" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/applyforus-prod-rg

# Note the output:
# {
#   "appId": "xxx",
#   "displayName": "ApplyPlatform-CI-CD",
#   "password": "xxx",
#   "tenant": "xxx"
# }

# Grant AKS access
az role assignment create \
  --assignee {appId} \
  --role "Azure Kubernetes Service Cluster Admin Role" \
  --scope /subscriptions/{subscription-id}/resourceGroups/applyforus-prod-rg/providers/Microsoft.ContainerService/managedClusters/applyforus-prod-aks

# Then create service connection manually with these credentials
```

---

### 2. Azure Container Registry (ACR) Service Connection

**Name:** `applyforus-acr`

**Type:** Docker Registry

**Purpose:** Push/pull Docker images to/from Azure Container Registry

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `Docker Registry`
3. Registry type: `Azure Container Registry`
4. Authentication type: `Service Principal`
5. Configure:
   - Azure subscription: Select your subscription
   - Azure container registry: `applyforusacr`
   - Service connection name: `applyforus-acr`
   - Grant access permission to all pipelines: ✓
6. Click `Save`

**Alternative: Using Access Keys:**

```bash
# Get ACR credentials
az acr credential show --name applyforusacr

# Use admin username and password in Docker Registry service connection
```

**Registry Details:**
- Registry URL: `applyforusacr.azurecr.io`
- Login server: `applyforusacr.azurecr.io`

---

### 3. GitHub Service Connection (Optional)

**Name:** `GitHub-ApplyPlatform`

**Type:** GitHub

**Purpose:** Access GitHub APIs for advanced integrations, releases

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `GitHub`
3. Authentication method: `Personal Access Token` or `OAuth`
4. Configure:
   - GitHub URL: `https://github.com`
   - Personal Access Token: Generate from GitHub settings
   - Service connection name: `GitHub-ApplyPlatform`
   - Grant access permission to all pipelines: ✓
5. Click `Save`

**GitHub PAT Scopes Required:**
- `repo` (Full control of private repositories)
- `read:org` (Read org and team membership)
- `workflow` (Update GitHub Action workflows)

---

### 4. Snyk Service Connection (Optional)

**Name:** `Snyk`

**Type:** Snyk

**Purpose:** Vulnerability scanning of dependencies and containers

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `Snyk Authentication`
3. Configure:
   - Server URL: `https://snyk.io`
   - Snyk API Token: Get from https://app.snyk.io/account
   - Service connection name: `Snyk`
   - Grant access permission to all pipelines: ✓
4. Click `Save`

**Get Snyk Token:**
1. Log in to https://app.snyk.io
2. Go to Account Settings > API Token
3. Click "Generate token"
4. Copy and use in service connection

---

### 5. SonarCloud Service Connection (Optional)

**Name:** `SonarCloud`

**Type:** SonarCloud

**Purpose:** Static code analysis and quality gate checks

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `SonarCloud`
3. Configure:
   - SonarCloud Token: Get from SonarCloud account
   - Service connection name: `SonarCloud`
   - Grant access permission to all pipelines: ✓
4. Click `Save`

**Get SonarCloud Token:**
1. Log in to https://sonarcloud.io
2. Go to: My Account > Security
3. Generate a token for "Azure DevOps"
4. Copy and use in service connection

**SonarCloud Organization:**
- Organization: `citadelcloudmanagement`
- Project Key: `ApplyPlatform`

---

### 6. Azure Key Vault Service Connection (Recommended)

**Name:** `ApplyPlatform-KeyVault`

**Type:** Azure Key Vault

**Purpose:** Securely retrieve secrets during pipeline execution

**Setup Instructions:**

1. Navigate to: `Project Settings > Service connections > New service connection`
2. Select: `Azure Resource Manager`
3. Follow the same steps as Azure RM connection
4. Ensure the service principal has these Key Vault permissions:
   - Get (secrets)
   - List (secrets)

**Grant Permissions to Key Vault:**

```bash
# Get service principal ID
SP_OBJECT_ID=$(az ad sp show --id {appId} --query id -o tsv)

# Grant Key Vault permissions
az keyvault set-policy \
  --name applyforus-secrets \
  --object-id $SP_OBJECT_ID \
  --secret-permissions get list
```

---

## Service Connection Security Best Practices

### 1. Use Service Principals (Not Personal Accounts)

Always use service principals or managed identities, never personal user accounts.

### 2. Principle of Least Privilege

Grant only the minimum permissions required:
- Read-only where possible
- Scoped to specific resource groups
- Time-limited credentials (rotate regularly)

### 3. Secrets Management

- Store secrets in Azure Key Vault
- Never commit secrets to code
- Use secret variables in pipelines
- Enable audit logging

### 4. Access Control

- Limit pipeline access to service connections
- Use separate service principals per environment
- Enable approvals for production deployments

### 5. Monitoring and Auditing

```bash
# Enable diagnostic logs for service principal
az monitor diagnostic-settings create \
  --resource {service-principal-id} \
  --name "audit-logs" \
  --logs '[{"category": "AuditLogs", "enabled": true}]' \
  --workspace {log-analytics-workspace-id}
```

---

## Verification Checklist

Use this checklist to verify all service connections are properly configured:

- [ ] Azure Resource Manager connection created and tested
- [ ] ACR service connection can push/pull images
- [ ] Service principal has AKS cluster admin role
- [ ] Service principal has Key Vault get/list permissions
- [ ] Variable groups are linked to Key Vault (if applicable)
- [ ] All service connections granted pipeline access
- [ ] Optional tools (Snyk, SonarCloud) configured if needed
- [ ] Secrets are stored securely (not in code or plain text)
- [ ] Audit logging enabled on service principals
- [ ] Service connection permissions reviewed and minimized

---

## Testing Service Connections

### Test Azure RM Connection

```yaml
# test-azure-connection.yml
steps:
  - task: AzureCLI@2
    displayName: 'Test Azure connection'
    inputs:
      azureSubscription: 'ApplyPlatform-Azure-Connection'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az account show
        az aks list -o table
```

### Test ACR Connection

```yaml
# test-acr-connection.yml
steps:
  - task: Docker@2
    displayName: 'Test ACR login'
    inputs:
      command: 'login'
      containerRegistry: 'applyforus-acr'
```

### Test Key Vault Access

```bash
# Test Key Vault access
az keyvault secret list --vault-name applyforus-secrets

# Test retrieving a secret
az keyvault secret show \
  --vault-name applyforus-secrets \
  --name DATABASE-PASSWORD
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Service principal not found"

**Solution:**
```bash
# Check if service principal exists
az ad sp list --display-name "ApplyPlatform-CI-CD"

# Recreate if needed
az ad sp create-for-rbac --name "ApplyPlatform-CI-CD" --role Contributor
```

#### Issue 2: "Insufficient permissions to access AKS"

**Solution:**
```bash
# Grant AKS access
az role assignment create \
  --assignee {service-principal-id} \
  --role "Azure Kubernetes Service Cluster Admin Role" \
  --scope {aks-resource-id}
```

#### Issue 3: "Cannot push to ACR"

**Solution:**
```bash
# Grant ACR push permissions
az role assignment create \
  --assignee {service-principal-id} \
  --role AcrPush \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg}/providers/Microsoft.ContainerRegistry/registries/applyforusacr
```

#### Issue 4: "Key Vault access denied"

**Solution:**
```bash
# Set Key Vault access policy
az keyvault set-policy \
  --name applyforus-secrets \
  --spn {service-principal-id} \
  --secret-permissions get list
```

---

## Service Principal Rotation

Service principals should be rotated regularly (every 90 days recommended):

```bash
# Reset service principal credentials
az ad sp credential reset \
  --id {service-principal-id} \
  --display-name "ApplyPlatform-CI-CD"

# Update service connection with new credentials in Azure DevOps
```

---

## Contact and Support

For issues with service connections:
1. Check Azure DevOps service connection test results
2. Verify Azure RBAC permissions
3. Review service principal audit logs
4. Contact Azure DevOps administrators
5. Escalate to Azure support if needed

---

## Additional Resources

- [Azure DevOps Service Connections Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- [Azure Service Principal Best Practices](https://learn.microsoft.com/en-us/azure/active-directory/develop/howto-create-service-principal-portal)
- [Azure Key Vault Integration](https://learn.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml#link-secrets-from-an-azure-key-vault)
