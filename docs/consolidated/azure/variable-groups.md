# Azure DevOps Variable Groups Configuration

This document describes the required variable groups for the JobPilot Platform CI/CD pipelines.

## Overview

Variable groups are used to store configuration and secrets that are environment-specific. They are linked to Azure Key Vault for secure secret management.

## Setup Instructions

### 1. Create Variable Groups in Azure DevOps

Navigate to: **Pipelines > Library > Variable groups**

### 2. Link to Azure Key Vault

For each variable group, enable "Link secrets from an Azure key vault as variables" and select the appropriate Key Vault for each environment.

## Variable Groups

### `dev-secrets` (Development Environment)

**Description:** Development environment secrets and configuration

**Key Vault:** `jobpilot-dev-kv-{suffix}`

**Azure Subscription:** JobPilot-Azure-Subscription

#### Variables

| Variable Name | Type | Source | Description |
|--------------|------|--------|-------------|
| `ACR_NAME` | Variable | Manual | Azure Container Registry name (e.g., `jobpilotdevacr123456`) |
| `ACR_LOGIN_SERVER` | Variable | Manual | ACR login server (e.g., `jobpilotdevacr123456.azurecr.io`) |
| `ACR_SERVICE_CONNECTION` | Variable | Manual | Azure DevOps service connection name for ACR |
| `AZURE_SUBSCRIPTION` | Variable | Manual | Azure subscription service connection name |
| `RESOURCE_GROUP` | Variable | Manual | Resource group name (e.g., `jobpilot-dev-rg`) |
| `WEB_APP_NAME` | Variable | Manual | Web app name (e.g., `jobpilot-dev-web`) |
| `AUTH_SERVICE_NAME` | Variable | Manual | Auth service name (e.g., `jobpilot-dev-auth`) |
| `AI_SERVICE_NAME` | Variable | Manual | AI service name (e.g., `jobpilot-dev-ai`) |
| `DATABASE-URL` | Secret | Key Vault | PostgreSQL connection string |
| `REDIS-URL` | Secret | Key Vault | Redis connection string |
| `JWT-SECRET` | Secret | Key Vault | JWT signing secret |
| `OPENAI-API-KEY` | Secret | Key Vault | OpenAI API key |
| `SESSION-SECRET` | Secret | Key Vault | Session encryption secret |
| `SERVICE-BUS-CONNECTION-STRING` | Secret | Key Vault | Azure Service Bus connection string |
| `APPINSIGHTS-INSTRUMENTATION-KEY` | Secret | Key Vault | Application Insights instrumentation key |

---

### `staging-secrets` (Staging Environment)

**Description:** Staging environment secrets and configuration

**Key Vault:** `jobpilot-staging-kv-{suffix}`

**Azure Subscription:** JobPilot-Azure-Subscription

#### Variables

| Variable Name | Type | Source | Description |
|--------------|------|--------|-------------|
| `ACR_NAME` | Variable | Manual | Azure Container Registry name |
| `ACR_LOGIN_SERVER` | Variable | Manual | ACR login server |
| `ACR_SERVICE_CONNECTION` | Variable | Manual | Azure DevOps service connection name for ACR |
| `AZURE_SUBSCRIPTION` | Variable | Manual | Azure subscription service connection name |
| `RESOURCE_GROUP` | Variable | Manual | Resource group name (e.g., `jobpilot-staging-rg`) |
| `WEB_APP_NAME` | Variable | Manual | Web app name (e.g., `jobpilot-staging-web`) |
| `AUTH_SERVICE_NAME` | Variable | Manual | Auth service name (e.g., `jobpilot-staging-auth`) |
| `AI_SERVICE_NAME` | Variable | Manual | AI service name (e.g., `jobpilot-staging-ai`) |
| `DATABASE-URL` | Secret | Key Vault | PostgreSQL connection string |
| `REDIS-URL` | Secret | Key Vault | Redis connection string |
| `JWT-SECRET` | Secret | Key Vault | JWT signing secret |
| `OPENAI-API-KEY` | Secret | Key Vault | OpenAI API key |
| `SESSION-SECRET` | Secret | Key Vault | Session encryption secret |
| `SERVICE-BUS-CONNECTION-STRING` | Secret | Key Vault | Azure Service Bus connection string |
| `APPINSIGHTS-INSTRUMENTATION-KEY` | Secret | Key Vault | Application Insights instrumentation key |

---

### `prod-secrets` (Production Environment)

**Description:** Production environment secrets and configuration

**Key Vault:** `jobpilot-prod-kv-{suffix}`

**Azure Subscription:** JobPilot-Azure-Subscription

#### Variables

| Variable Name | Type | Source | Description |
|--------------|------|--------|-------------|
| `ACR_NAME` | Variable | Manual | Azure Container Registry name |
| `ACR_LOGIN_SERVER` | Variable | Manual | ACR login server |
| `ACR_SERVICE_CONNECTION` | Variable | Manual | Azure DevOps service connection name for ACR |
| `AZURE_SUBSCRIPTION` | Variable | Manual | Azure subscription service connection name |
| `RESOURCE_GROUP` | Variable | Manual | Resource group name (e.g., `jobpilot-prod-rg`) |
| `WEB_APP_NAME` | Variable | Manual | Web app name (e.g., `jobpilot-prod-web`) |
| `AUTH_SERVICE_NAME` | Variable | Manual | Auth service name (e.g., `jobpilot-prod-auth`) |
| `AI_SERVICE_NAME` | Variable | Manual | AI service name (e.g., `jobpilot-prod-ai`) |
| `APPINSIGHTS_APP_ID` | Variable | Manual | Application Insights Application ID |
| `DATABASE-URL` | Secret | Key Vault | PostgreSQL connection string |
| `REDIS-URL` | Secret | Key Vault | Redis connection string |
| `JWT-SECRET` | Secret | Key Vault | JWT signing secret (high entropy) |
| `REFRESH-TOKEN-SECRET` | Secret | Key Vault | Refresh token signing secret |
| `OPENAI-API-KEY` | Secret | Key Vault | OpenAI API key |
| `SESSION-SECRET` | Secret | Key Vault | Session encryption secret |
| `ENCRYPTION-KEY` | Secret | Key Vault | Data encryption key |
| `SERVICE-BUS-CONNECTION-STRING` | Secret | Key Vault | Azure Service Bus connection string |
| `APPINSIGHTS-INSTRUMENTATION-KEY` | Secret | Key Vault | Application Insights instrumentation key |

---

## Creating Variable Groups via Azure CLI

You can also create variable groups programmatically:

```bash
# Install Azure DevOps CLI extension
az extension add --name azure-devops

# Set organization and project
az devops configure --defaults organization=https://dev.azure.com/citadelcloudmanagement project=ApplyPlatform

# Create dev-secrets variable group
az pipelines variable-group create \
  --name dev-secrets \
  --description "Development environment secrets" \
  --variables \
    ACR_NAME=jobpilotdevacr123456 \
    ACR_LOGIN_SERVER=jobpilotdevacr123456.azurecr.io \
    RESOURCE_GROUP=jobpilot-dev-rg \
    WEB_APP_NAME=jobpilot-dev-web \
    AUTH_SERVICE_NAME=jobpilot-dev-auth \
    AI_SERVICE_NAME=jobpilot-dev-ai

# Link to Key Vault (manual step in Azure DevOps Portal)
```

## Permissions

### Required Permissions for Service Connections

1. **Azure Resource Manager Service Connection**
   - Role: Contributor on the subscription or resource group
   - Used for: Deploying infrastructure and applications

2. **Azure Container Registry Service Connection**
   - Role: AcrPush on the ACR
   - Used for: Pushing Docker images

3. **Key Vault Access**
   - Access Policy: Get, List secrets
   - Used for: Reading secrets in pipelines

### Setting up Service Principal

```bash
# Create service principal for Azure DevOps
az ad sp create-for-rbac \
  --name "JobPilot-DevOps-SP" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}

# Grant Key Vault access
az keyvault set-policy \
  --name jobpilot-dev-kv-{suffix} \
  --spn {service-principal-id} \
  --secret-permissions get list
```

## Security Best Practices

1. **Rotate Secrets Regularly**
   - JWT secrets: Every 90 days
   - API keys: Every 90 days
   - Database passwords: Every 180 days

2. **Use Different Secrets Per Environment**
   - Never reuse production secrets in development/staging

3. **Limit Access**
   - Only grant access to variable groups to users who need them
   - Use Azure AD groups for management

4. **Enable Auditing**
   - Monitor Key Vault access logs
   - Review variable group access logs in Azure DevOps

5. **Use Managed Identities**
   - Prefer managed identities over service principals when possible
   - App Services should use managed identity to access Key Vault

## Troubleshooting

### Issue: Pipeline cannot access Key Vault secrets

**Solution:**
1. Verify the service connection has the correct permissions
2. Check Key Vault access policies
3. Ensure the variable group is linked to the correct Key Vault
4. Verify the pipeline is authorized to use the variable group

### Issue: Variables not resolving in pipeline

**Solution:**
1. Check variable group name matches exactly in pipeline YAML
2. Verify secrets are properly synced from Key Vault
3. Check for typos in variable names (case-sensitive)

### Issue: Deployment fails with "unauthorized" error

**Solution:**
1. Verify ACR service connection credentials
2. Check Azure subscription service connection
3. Ensure proper RBAC roles are assigned

## References

- [Azure DevOps Variable Groups Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)
- [Azure Key Vault Integration](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml#link-secrets-from-an-azure-key-vault)
- [Service Connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
