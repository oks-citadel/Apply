# Azure DevOps Setup Guide

Complete guide for setting up Azure DevOps CI/CD pipelines for Terraform infrastructure deployment for the JobPilot AI Platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step 1: Create Azure Service Principal](#step-1-create-azure-service-principal)
- [Step 2: Create Terraform Backend Storage](#step-2-create-terraform-backend-storage)
- [Step 3: Create Azure Key Vault](#step-3-create-azure-key-vault)
- [Step 4: Create Variable Groups](#step-4-create-variable-groups)
- [Step 5: Create Service Connections](#step-5-create-service-connections)
- [Step 6: Create Environments](#step-6-create-environments)
- [Step 7: Configure Branch Policies](#step-7-configure-branch-policies)
- [Step 8: Import Pipeline](#step-8-import-pipeline)
- [Step 9: Verify Setup](#step-9-verify-setup)
- [Maintenance](#maintenance)

## Prerequisites

Before starting, ensure you have:

- **Azure Subscription**: Active Azure subscription with Owner or Contributor role
- **Azure DevOps Organization**: Organization created at `dev.azure.com/{your-org}`
- **Azure CLI**: Installed and configured (`az --version`)
- **Terraform**: Version >= 1.5.0 installed locally for testing
- **Git**: For repository management
- **Permissions**:
  - Azure AD: Application Administrator or Global Administrator
  - Azure Subscription: Owner or User Access Administrator
  - Azure DevOps: Project Administrator

## Architecture Overview

```
Azure DevOps Pipeline
├── Service Principal (Authentication)
├── Backend Storage (State Management)
├── Key Vault (Secret Storage)
├── Variable Groups (Configuration)
├── Service Connections (Azure Access)
├── Environments (Approval Gates)
└── Branch Policies (Quality Gates)
```

## Step 1: Create Azure Service Principal

### 1.1 Login to Azure

```bash
# Login to Azure
az login

# Set the subscription
az account set --subscription "YOUR_SUBSCRIPTION_NAME_OR_ID"

# Verify current subscription
az account show
```

### 1.2 Create Service Principal

```bash
# Get your subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal for Terraform
az ad sp create-for-rbac \
  --name "jobpilot-terraform-sp" \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID} \
  --sdk-auth

# Save the output - you'll need these values:
# {
#   "clientId": "xxxx",
#   "clientSecret": "xxxx",
#   "subscriptionId": "xxxx",
#   "tenantId": "xxxx"
# }
```

### 1.3 Grant Additional Permissions

For complete infrastructure management, grant additional roles:

```bash
# Get Service Principal Object ID
SP_OBJECT_ID=$(az ad sp list --display-name "jobpilot-terraform-sp" --query "[0].id" -o tsv)

# Grant User Access Administrator (for RBAC assignments)
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "User Access Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}

# Grant Key Vault Administrator (for Key Vault management)
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "Key Vault Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}
```

### 1.4 Verify Service Principal

```bash
# List role assignments
az role assignment list --assignee ${SP_OBJECT_ID} --output table
```

## Step 2: Create Terraform Backend Storage

Terraform requires remote state storage for team collaboration and consistency.

### 2.1 Set Variables

```bash
# Define variables
RESOURCE_GROUP="jobpilot-terraform-state-rg"
STORAGE_ACCOUNT="jobpilottfstate$(date +%s)"  # Must be globally unique
CONTAINER_NAME="tfstate"
LOCATION="eastus"
```

### 2.2 Create Resource Group

```bash
az group create \
  --name ${RESOURCE_GROUP} \
  --location ${LOCATION} \
  --tags \
    Environment=shared \
    Purpose=terraform-state \
    ManagedBy=devops
```

### 2.3 Create Storage Account

```bash
az storage account create \
  --name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --location ${LOCATION} \
  --sku Standard_LRS \
  --kind StorageV2 \
  --encryption-services blob \
  --https-only true \
  --min-tls-version TLS1_2 \
  --allow-blob-public-access false \
  --tags \
    Environment=shared \
    Purpose=terraform-state \
    ManagedBy=devops
```

### 2.4 Create Blob Container

```bash
# Get storage account key
ACCOUNT_KEY=$(az storage account keys list \
  --resource-group ${RESOURCE_GROUP} \
  --account-name ${STORAGE_ACCOUNT} \
  --query "[0].value" -o tsv)

# Create container
az storage container create \
  --name ${CONTAINER_NAME} \
  --account-name ${STORAGE_ACCOUNT} \
  --account-key ${ACCOUNT_KEY} \
  --public-access off
```

### 2.5 Enable Advanced Security Features

```bash
# Enable versioning
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --enable-versioning true

# Enable soft delete (30 days retention)
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --enable-delete-retention true \
  --delete-retention-days 30

# Enable container soft delete
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --enable-container-delete-retention true \
  --container-delete-retention-days 30

# Enable point-in-time restore
az storage account blob-service-properties update \
  --account-name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --enable-restore-policy true \
  --restore-days 29
```

### 2.6 Configure Network Security

```bash
# Deny all network access by default
az storage account update \
  --name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --default-action Deny

# Allow Azure services
az storage account update \
  --name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --bypass AzureServices

# Add your IP for management (optional)
MY_IP=$(curl -s https://api.ipify.org)
az storage account network-rule add \
  --account-name ${STORAGE_ACCOUNT} \
  --resource-group ${RESOURCE_GROUP} \
  --ip-address ${MY_IP}
```

### 2.7 Lock Resource Group

```bash
# Prevent accidental deletion
az lock create \
  --name "prevent-deletion" \
  --resource-group ${RESOURCE_GROUP} \
  --lock-type CanNotDelete \
  --notes "Prevents deletion of Terraform state storage"
```

### 2.8 Save Backend Configuration

```bash
echo "Storage Account: ${STORAGE_ACCOUNT}"
echo "Resource Group: ${RESOURCE_GROUP}"
echo "Container: ${CONTAINER_NAME}"
echo "Access Key: ${ACCOUNT_KEY}"

# Save to secure location (DO NOT commit to Git)
```

## Step 3: Create Azure Key Vault

Store sensitive credentials securely in Azure Key Vault.

### 3.1 Create Key Vault

```bash
KEY_VAULT_NAME="jobpilot-kv-$(date +%s)"

az keyvault create \
  --name ${KEY_VAULT_NAME} \
  --resource-group ${RESOURCE_GROUP} \
  --location ${LOCATION} \
  --enable-rbac-authorization false \
  --enabled-for-deployment true \
  --enabled-for-template-deployment true \
  --enable-soft-delete true \
  --soft-delete-retention-days 90 \
  --enable-purge-protection true
```

### 3.2 Store Service Principal Credentials

```bash
# Store secrets (use values from Step 1.2)
az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "ARM-CLIENT-ID" --value "YOUR_CLIENT_ID"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "ARM-CLIENT-SECRET" --value "YOUR_CLIENT_SECRET"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "ARM-SUBSCRIPTION-ID" --value "${SUBSCRIPTION_ID}"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "ARM-TENANT-ID" --value "YOUR_TENANT_ID"

# Store backend configuration
az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "TF-STATE-STORAGE-ACCOUNT" --value "${STORAGE_ACCOUNT}"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "TF-STATE-CONTAINER" --value "${CONTAINER_NAME}"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "TF-STATE-RESOURCE-GROUP" --value "${RESOURCE_GROUP}"

az keyvault secret set --vault-name ${KEY_VAULT_NAME} \
  --name "TF-STATE-ACCESS-KEY" --value "${ACCOUNT_KEY}"
```

### 3.3 Grant Service Principal Access

```bash
# Grant Key Vault access to Service Principal
az keyvault set-policy \
  --name ${KEY_VAULT_NAME} \
  --object-id ${SP_OBJECT_ID} \
  --secret-permissions get list
```

## Step 4: Create Variable Groups

Navigate to Azure DevOps: `https://dev.azure.com/{organization}/{project}/_library?itemType=VariableGroups`

### 4.1 Create `terraform-backend` Variable Group

**Option A: Link to Key Vault (Recommended)**

1. Click **+ Variable group**
2. Name: `terraform-backend`
3. Enable **Link secrets from an Azure key vault as variables**
4. Select your Azure subscription
5. Select Key Vault: `${KEY_VAULT_NAME}`
6. Authorize the connection
7. Add secrets:
   - `ARM_CLIENT_ID` → ARM-CLIENT-ID
   - `ARM_CLIENT_SECRET` → ARM-CLIENT-SECRET
   - `ARM_SUBSCRIPTION_ID` → ARM-SUBSCRIPTION-ID
   - `ARM_TENANT_ID` → ARM-TENANT-ID
   - `TF_STATE_STORAGE_ACCOUNT` → TF-STATE-STORAGE-ACCOUNT
   - `TF_STATE_CONTAINER` → TF-STATE-CONTAINER
   - `TF_STATE_RESOURCE_GROUP` → TF-STATE-RESOURCE-GROUP
   - `TF_STATE_ACCESS_KEY` → TF-STATE-ACCESS-KEY

**Option B: Manual Entry**

If not using Key Vault integration:

| Variable Name | Value | Secret? |
|---------------|-------|---------|
| ARM_CLIENT_ID | (from Step 1.2) | No |
| ARM_CLIENT_SECRET | (from Step 1.2) | Yes |
| ARM_SUBSCRIPTION_ID | (from Step 1.2) | No |
| ARM_TENANT_ID | (from Step 1.2) | No |
| TF_STATE_STORAGE_ACCOUNT | (from Step 2) | No |
| TF_STATE_CONTAINER | tfstate | No |
| TF_STATE_RESOURCE_GROUP | (from Step 2) | No |
| TF_STATE_ACCESS_KEY | (from Step 2) | Yes |

### 4.2 Create `terraform-dev` Variable Group

| Variable Name | Value | Description |
|---------------|-------|-------------|
| TF_ENVIRONMENT | dev | Environment name |
| TF_WORKSPACE | dev | Terraform workspace |
| AZURE_LOCATION | eastus | Primary Azure region |
| RESOURCE_GROUP_PREFIX | jobpilot-dev | Resource naming prefix |
| AKS_NODE_COUNT | 2 | Development cluster size |
| AKS_NODE_VM_SIZE | Standard_D2s_v3 | Development VM size |
| ACR_SKU | Basic | Container registry SKU |
| APP_INSIGHTS_ENABLED | true | Enable monitoring |

### 4.3 Create `terraform-staging` Variable Group

| Variable Name | Value | Description |
|---------------|-------|-------------|
| TF_ENVIRONMENT | staging | Environment name |
| TF_WORKSPACE | staging | Terraform workspace |
| AZURE_LOCATION | eastus | Primary Azure region |
| RESOURCE_GROUP_PREFIX | jobpilot-staging | Resource naming prefix |
| AKS_NODE_COUNT | 3 | Staging cluster size |
| AKS_NODE_VM_SIZE | Standard_D4s_v3 | Staging VM size |
| ACR_SKU | Standard | Container registry SKU |
| APP_INSIGHTS_ENABLED | true | Enable monitoring |

### 4.4 Create `terraform-prod` Variable Group

| Variable Name | Value | Description |
|---------------|-------|-------------|
| TF_ENVIRONMENT | prod | Environment name |
| TF_WORKSPACE | prod | Terraform workspace |
| AZURE_LOCATION | eastus | Primary Azure region |
| RESOURCE_GROUP_PREFIX | jobpilot-prod | Resource naming prefix |
| AKS_NODE_COUNT | 5 | Production cluster size |
| AKS_NODE_VM_SIZE | Standard_D8s_v3 | Production VM size |
| ACR_SKU | Premium | Container registry SKU |
| APP_INSIGHTS_ENABLED | true | Enable monitoring |
| ENABLE_AUTO_SCALING | true | Enable autoscaling |
| MIN_NODE_COUNT | 3 | Minimum nodes |
| MAX_NODE_COUNT | 10 | Maximum nodes |

## Step 5: Create Service Connections

Navigate to: `https://dev.azure.com/{organization}/{project}/_settings/adminservices`

### 5.1 Create Azure Resource Manager Service Connection

1. Click **New service connection**
2. Select **Azure Resource Manager**
3. Select **Service principal (manual)**
4. Fill in details:
   - **Subscription ID**: (from Step 1.2)
   - **Subscription Name**: Your subscription name
   - **Service Principal ID**: (clientId from Step 1.2)
   - **Service Principal Key**: (clientSecret from Step 1.2)
   - **Tenant ID**: (from Step 1.2)
5. Service connection name: `azure-terraform-connection`
6. Description: `Service connection for Terraform infrastructure deployment`
7. Check **Grant access permission to all pipelines** (or manage per pipeline)
8. Click **Verify and save**

### 5.2 Create Environment-Specific Connections (Optional)

For enhanced security, create separate connections per environment:

- `azure-terraform-dev`
- `azure-terraform-staging`
- `azure-terraform-prod`

Each with appropriate scope restrictions.

## Step 6: Create Environments

Navigate to: `https://dev.azure.com/{organization}/{project}/_environments`

### 6.1 Create Development Environment

1. Click **Create environment**
2. Name: `dev`
3. Description: `Development environment - no approvals required`
4. Resources: None
5. Click **Create**

**No approval gates required for dev**

### 6.2 Create Staging Environment

1. Click **Create environment**
2. Name: `staging`
3. Description: `Staging environment - requires 1 approval`
4. Click **Create**

**Configure Approvals:**
1. Click the environment → **Approvals and checks**
2. Click **+** → **Approvals**
3. Approvers: Select team lead or senior developers
4. Minimum approvers: 1
5. Timeout: 24 hours
6. Instructions: "Review Terraform plan before approving"
7. Click **Create**

### 6.3 Create Production Environment

1. Click **Create environment**
2. Name: `prod`
3. Description: `Production environment - requires 2 approvals and business hours`
4. Click **Create**

**Configure Approvals:**
1. Click **Approvals and checks**
2. Add **Approvals**:
   - Approvers: Project manager, Tech lead
   - Minimum approvers: 2
   - Timeout: 72 hours
   - Instructions: "Verify all testing completed and review production plan"

**Add Business Hours Check:**
1. Click **+** → **Business hours**
2. Time zone: Your timezone
3. Days: Monday - Friday
4. Start time: 09:00
5. End time: 17:00
6. Message: "Production deployments only during business hours"

**Add Required Template Check (Optional):**
1. Click **+** → **Required template**
2. Select approval template
3. This ensures consistent approval process

## Step 7: Configure Branch Policies

Navigate to: `https://dev.azure.com/{organization}/{project}/_settings/repositories`

### 7.1 Main Branch Protection

Select `main` branch → **Branch policies**:

**Require Pull Request:**
- ✓ Require a minimum number of reviewers: 2
- ✓ Allow requestors to approve their own changes: NO
- ✓ Prohibit the most recent pusher from approving: YES
- ✓ Require at least one approval on the last iteration: YES
- ✓ Reset all approval votes when new changes are pushed: YES

**Build Validation:**
- Add build policy: Select Terraform pipeline
- Trigger: Automatic
- Policy requirement: Required
- Build expiration: 12 hours
- Display name: "Terraform Validate & Plan"

**Status Checks:**
- ✓ Require all status checks to pass
- Add status checks:
  - Terraform Format Check
  - Security Scan
  - License Check

**Automatically included reviewers:**
- Add: Infrastructure team
- Required: YES

**Limit merge types:**
- ✓ Squash merge only (recommended)

### 7.2 Develop Branch Protection (Optional)

Similar settings with reduced requirements:
- Minimum reviewers: 1
- Allow self-approval: YES

## Step 8: Import Pipeline

### 8.1 Create Pipeline

1. Navigate to: `https://dev.azure.com/{organization}/{project}/_build`
2. Click **New pipeline**
3. Select **Azure Repos Git**
4. Select your repository
5. Select **Existing Azure Pipelines YAML file**
6. Branch: `main`
7. Path: `/infrastructure/azure-pipelines-terraform.yml`
8. Click **Continue**

### 8.2 Configure Pipeline

1. Review the YAML
2. Click **Variables** → **Variable groups**
3. Link variable groups:
   - `terraform-backend`
   - `terraform-dev`
   - `terraform-staging`
   - `terraform-prod`
4. Click **Save** (don't run yet)

### 8.3 Pipeline Permissions

1. Go to pipeline **Settings**
2. **Security** tab
3. Grant permissions:
   - Build Service account: Contributor on repository
   - Grant access to all environments (or configure per environment)

### 8.4 Create Pipeline Triggers

Edit the pipeline YAML or configure triggers:

**CI Trigger:**
```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - infrastructure/terraform/**
```

**PR Trigger:**
```yaml
pr:
  branches:
    include:
      - main
  paths:
    include:
      - infrastructure/terraform/**
```

## Step 9: Verify Setup

### 9.1 Test Service Principal

```bash
# Login as service principal
az login --service-principal \
  -u ${ARM_CLIENT_ID} \
  -p ${ARM_CLIENT_SECRET} \
  --tenant ${ARM_TENANT_ID}

# Verify access
az account show
az group list
```

### 9.2 Test Backend Storage

```bash
# Initialize Terraform with backend
cd infrastructure/terraform

terraform init \
  -backend-config="storage_account_name=${STORAGE_ACCOUNT}" \
  -backend-config="container_name=${CONTAINER_NAME}" \
  -backend-config="key=dev.tfstate" \
  -backend-config="resource_group_name=${RESOURCE_GROUP}"
```

### 9.3 Run Test Pipeline

1. Create a feature branch
2. Make a small change to Terraform
3. Push and create PR
4. Verify:
   - Pipeline triggers automatically
   - Validation passes
   - Plan succeeds
   - Required approvals appear

### 9.4 Verify Variable Groups

```bash
# Using Azure DevOps CLI
az devops login

# List variable groups
az pipelines variable-group list \
  --organization https://dev.azure.com/{your-org} \
  --project {your-project}
```

## Maintenance

### Regular Tasks

**Weekly:**
- Review pipeline execution logs
- Check for failed deployments
- Verify service principal expiration dates

**Monthly:**
- Rotate service principal secrets
- Review and update variable groups
- Check storage account costs and usage
- Review Key Vault access logs

**Quarterly:**
- Audit environment approvers
- Review branch policies
- Update Terraform version
- Security assessment

### Backup State Files

```bash
# Download current state
az storage blob download \
  --account-name ${STORAGE_ACCOUNT} \
  --container-name ${CONTAINER_NAME} \
  --name dev.tfstate \
  --file backup-dev-$(date +%Y%m%d).tfstate
```

### Rotate Service Principal Secret

```bash
# Create new credential
az ad sp credential reset \
  --name "jobpilot-terraform-sp" \
  --append

# Update Key Vault
az keyvault secret set \
  --vault-name ${KEY_VAULT_NAME} \
  --name "ARM-CLIENT-SECRET" \
  --value "NEW_SECRET"

# Test new credential
# Remove old credential after verification
```

### Monitoring and Alerts

Set up Azure Monitor alerts for:
- Failed pipeline runs
- State file modifications
- Service principal authentication failures
- Storage account access anomalies

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## Security Best Practices

See [SECURITY-BEST-PRACTICES.md](./SECURITY-BEST-PRACTICES.md) for detailed security guidelines.

## Additional Resources

- [Variable Groups Documentation](./VARIABLE-GROUPS.md)
- [Service Connections Guide](./SERVICE-CONNECTIONS.md)
- [Environments Configuration](./ENVIRONMENTS.md)
- [Terraform Backend Configuration](../backend.tf)

## Support

For issues or questions:
1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review Azure DevOps pipeline logs
3. Contact DevOps team
4. Create issue in repository

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** DevOps Team
