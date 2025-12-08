# Variable Groups Configuration - ApplyforUs Platform

This document describes all the variable groups required for the Azure DevOps pipelines.

## Overview

Variable groups store values and secrets that you want to share across multiple pipelines. Create these variable groups in Azure DevOps before running the pipelines.

## How to Create Variable Groups

1. Navigate to **Pipelines** > **Library** in Azure DevOps
2. Click **+ Variable group**
3. Enter the group name
4. Add variables as described below
5. For sensitive values, click the lock icon to mark as secret
6. Save the variable group
7. Grant pipeline access to the variable group

---

## 1. applyforus-common

**Description:** Common variables shared across all environments

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `projectName` | Plain | Project name | `applyforus` |
| `containerRegistryName` | Plain | ACR name | `applyforusacr` |
| `containerRegistryUrl` | Plain | ACR URL | `applyforusacr.azurecr.io` |
| `containerRegistryUsername` | Secret | ACR username | From ACR admin credentials |
| `containerRegistryPassword` | Secret | ACR password | From ACR admin credentials |
| `azureServiceConnection` | Plain | Service connection name | `ApplyforUs-Azure-ServiceConnection` |
| `AZURE_SUBSCRIPTION_ID` | Secret | Azure subscription ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `AZURE_TENANT_ID` | Secret | Azure tenant ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `nodeVersion` | Plain | Node.js version | `20.x` |
| `pythonVersion` | Plain | Python version | `3.11` |

---

## 2. applyforus-dev

**Description:** Development environment variables

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `environment` | Plain | Environment name | `dev` |
| `aksResourceGroup` | Plain | AKS resource group | `applyforus-dev-rg` |
| `aksClusterName` | Plain | AKS cluster name | `applyforus-dev-aks` |
| `aksServiceConnection` | Plain | AKS service connection | `ApplyforUs-AKS-dev` |
| `namespace` | Plain | Kubernetes namespace | `applyforus-dev` |
| `DATABASE_URL` | Secret | Database connection string | `postgresql://...` |
| `REDIS_URL` | Secret | Redis connection string | `redis://...` |
| `JWT_SECRET` | Secret | JWT signing secret | Generate with `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Secret | Data encryption key | Generate with `openssl rand -hex 32` |
| `AZURE_OPENAI_API_KEY` | Secret | OpenAI API key | From Azure OpenAI service |
| `AZURE_OPENAI_ENDPOINT` | Plain | OpenAI endpoint | `https://applyforus-dev-openai.openai.azure.com/` |
| `SENDGRID_API_KEY` | Secret | SendGrid API key | From SendGrid |
| `STORAGE_ACCOUNT_NAME` | Plain | Storage account name | `applyforusdevstorage` |
| `STORAGE_ACCOUNT_KEY` | Secret | Storage account key | From Azure Storage |
| `APPLICATION_INSIGHTS_KEY` | Secret | App Insights key | From Azure App Insights |

---

## 3. applyforus-test

**Description:** Test environment variables

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `environment` | Plain | Environment name | `test` |
| `aksResourceGroup` | Plain | AKS resource group | `applyforus-test-rg` |
| `aksClusterName` | Plain | AKS cluster name | `applyforus-test-aks` |
| `aksServiceConnection` | Plain | AKS service connection | `ApplyforUs-AKS-test` |
| `namespace` | Plain | Kubernetes namespace | `applyforus-test` |
| `DATABASE_URL` | Secret | Database connection string | `postgresql://...` |
| `REDIS_URL` | Secret | Redis connection string | `redis://...` |
| `JWT_SECRET` | Secret | JWT signing secret | Generate with `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Secret | Data encryption key | Generate with `openssl rand -hex 32` |
| `AZURE_OPENAI_API_KEY` | Secret | OpenAI API key | From Azure OpenAI service |
| `AZURE_OPENAI_ENDPOINT` | Plain | OpenAI endpoint | `https://applyforus-test-openai.openai.azure.com/` |
| `SENDGRID_API_KEY` | Secret | SendGrid API key | From SendGrid |
| `STORAGE_ACCOUNT_NAME` | Plain | Storage account name | `applyforusteststorage` |
| `STORAGE_ACCOUNT_KEY` | Secret | Storage account key | From Azure Storage |
| `APPLICATION_INSIGHTS_KEY` | Secret | App Insights key | From Azure App Insights |

---

## 4. applyforus-prod

**Description:** Production environment variables

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `environment` | Plain | Environment name | `prod` |
| `aksResourceGroup` | Plain | AKS resource group | `applyforus-prod-rg` |
| `aksClusterName` | Plain | AKS cluster name | `applyforus-prod-aks` |
| `aksServiceConnection` | Plain | AKS service connection | `ApplyforUs-AKS-prod` |
| `namespace` | Plain | Kubernetes namespace | `applyforus-prod` |
| `DATABASE_URL` | Secret | Database connection string | `postgresql://...` |
| `REDIS_URL` | Secret | Redis connection string | `redis://...` |
| `JWT_SECRET` | Secret | JWT signing secret | Generate with `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | Secret | Data encryption key | Generate with `openssl rand -hex 32` |
| `AZURE_OPENAI_API_KEY` | Secret | OpenAI API key | From Azure OpenAI service |
| `AZURE_OPENAI_ENDPOINT` | Plain | OpenAI endpoint | `https://applyforus-prod-openai.openai.azure.com/` |
| `SENDGRID_API_KEY` | Secret | SendGrid API key | From SendGrid |
| `STORAGE_ACCOUNT_NAME` | Plain | Storage account name | `applyforusprodstorage` |
| `STORAGE_ACCOUNT_KEY` | Secret | Storage account key | From Azure Storage |
| `APPLICATION_INSIGHTS_KEY` | Secret | App Insights key | From Azure App Insights |
| `CDN_ENDPOINT` | Plain | CDN endpoint | `https://cdn.applyforus.com` |
| `CUSTOM_DOMAIN` | Plain | Custom domain | `applyforus.com` |

---

## 5. applyforus-terraform

**Description:** Terraform-specific variables

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `backendResourceGroup` | Plain | TF state resource group | `applyforus-terraform-state-rg` |
| `backendStorageAccount` | Plain | TF state storage account | `applyforustfstate` |
| `backendContainerName` | Plain | TF state container | `tfstate` |
| `TF_VAR_sql_admin_username` | Secret | SQL admin username | `sqladmin` |
| `TF_VAR_sql_admin_password` | Secret | SQL admin password | Strong password |
| `servicePrincipalId` | Secret | Service principal app ID | From Azure AD |
| `servicePrincipalKey` | Secret | Service principal secret | From Azure AD |
| `ARM_CLIENT_ID` | Secret | ARM client ID | Same as servicePrincipalId |
| `ARM_CLIENT_SECRET` | Secret | ARM client secret | Same as servicePrincipalKey |
| `ARM_SUBSCRIPTION_ID` | Secret | ARM subscription ID | Azure subscription ID |
| `ARM_TENANT_ID` | Secret | ARM tenant ID | Azure tenant ID |

---

## 6. applyforus-security

**Description:** Security scanning configuration

### Variables

| Variable Name | Type | Description | Example Value |
|--------------|------|-------------|---------------|
| `failOnHighSeverity` | Plain | Fail on high severity | `false` |
| `failOnCriticalSeverity` | Plain | Fail on critical severity | `true` |
| `SNYK_TOKEN` | Secret | Snyk API token (optional) | From Snyk dashboard |
| `SONARQUBE_TOKEN` | Secret | SonarQube token (optional) | From SonarQube |
| `SONARQUBE_URL` | Plain | SonarQube URL (optional) | `https://sonarqube.yourorg.com` |

---

## Security Best Practices

1. **Never commit secrets to source control**
   - Always use variable groups for sensitive data
   - Mark sensitive variables as "secret" in Azure DevOps

2. **Rotate secrets regularly**
   - Database passwords
   - API keys
   - Service principal credentials
   - JWT secrets

3. **Use Azure Key Vault integration**
   - Link variable groups to Azure Key Vault for enhanced security
   - Enable automatic secret refresh

4. **Limit access**
   - Grant pipeline access only to necessary variable groups
   - Use separate variable groups per environment
   - Implement RBAC for variable group management

5. **Audit and monitor**
   - Enable audit logging for variable group changes
   - Monitor access patterns
   - Review and update variables quarterly

---

## Setting Up Key Vault Integration (Recommended)

For production environments, integrate variable groups with Azure Key Vault:

1. Create Azure Key Vault for each environment
2. Store secrets in Key Vault
3. In Azure DevOps, create variable group
4. Select "Link secrets from an Azure key vault"
5. Choose your Key Vault
6. Select secrets to include
7. Save the variable group

This approach provides:
- Centralized secret management
- Automatic rotation capabilities
- Enhanced audit logging
- Better compliance

---

## Generating Secure Values

### JWT Secret
```bash
openssl rand -hex 32
```

### Encryption Key
```bash
openssl rand -base64 32
```

### Strong Password
```bash
openssl rand -base64 24
```

---

## Quick Setup Script

Run this script to help generate secure values:

```bash
#!/bin/bash

echo "ApplyforUs Variable Group Setup Helper"
echo "======================================"
echo ""

echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "DB_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "Save these values in your variable groups"
echo "Remember to mark them as secrets!"
```

---

## Troubleshooting

### Pipeline can't access variable group
- Verify the variable group exists
- Check pipeline has access to the variable group
- Ensure variable group is referenced in the pipeline YAML

### Variables not expanding
- Check variable syntax: `$(variableName)`
- Verify variable group is included in the stage/job
- Secret variables must be explicitly passed to tasks

### Key Vault integration issues
- Verify service connection has access to Key Vault
- Check Key Vault access policies
- Ensure secrets exist in Key Vault

---

## Support

For questions about variable groups:
- Contact: DevOps Team
- Documentation: [Azure DevOps Variable Groups](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)
