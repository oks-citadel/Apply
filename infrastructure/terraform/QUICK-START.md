# Quick Start Guide - Azure DevOps Terraform Pipeline

This is a quick reference guide to get the Terraform pipeline up and running.

## 5-Minute Setup

### Step 1: Create Azure Backend (One-time setup)

```bash
# Set variables
RESOURCE_GROUP="jobpilot-terraform-backend"
STORAGE_ACCOUNT="jobpilotterraform"
CONTAINER_NAME="tfstate"
LOCATION="eastus"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS

# Create container
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT
```

### Step 2: Create Service Principal

```bash
# Create service principal
az ad sp create-for-rbac \
  --name jobpilot-terraform-sp \
  --role Contributor \
  --scopes /subscriptions/{YOUR-SUBSCRIPTION-ID}

# Save the output:
# {
#   "appId": "...",       # ARM_CLIENT_ID
#   "password": "...",    # ARM_CLIENT_SECRET
#   "tenant": "..."       # ARM_TENANT_ID
# }
```

### Step 3: Configure Azure DevOps

1. **Create Variable Groups**

   Navigate to: `Pipelines` → `Library` → `+ Variable group`

   **Group 1: `terraform-backend`**
   - BACKEND_STORAGE_ACCOUNT: `jobpilotterraform`
   - BACKEND_CONTAINER_NAME: `tfstate`
   - BACKEND_RESOURCE_GROUP: `jobpilot-terraform-backend`

   **Group 2: `terraform-credentials`** (Lock all variables)
   - ARM_CLIENT_ID: `<from-sp-output>`
   - ARM_CLIENT_SECRET: `<from-sp-output>` ⚠️ Secret
   - ARM_SUBSCRIPTION_ID: `<your-subscription-id>`
   - ARM_TENANT_ID: `<from-sp-output>`
   - SQL_ADMIN_USERNAME: `jobpilotadmin`
   - SQL_ADMIN_PASSWORD_DEV: `<strong-password>` ⚠️ Secret
   - SQL_ADMIN_PASSWORD_STAGING: `<strong-password>` ⚠️ Secret
   - SQL_ADMIN_PASSWORD_PROD: `<strong-password>` ⚠️ Secret

2. **Create Environments**

   Navigate to: `Pipelines` → `Environments` → `New environment`

   - **dev** (No approvals)
   - **staging** (Optional approvals)
   - **prod** (Required approvals)

   For **prod** environment:
   - Click `prod` → `Approvals and checks` → `Approvals`
   - Add approvers
   - Set timeout: 24 hours

3. **Create Pipeline**

   - Go to `Pipelines` → `New pipeline`
   - Choose `Azure Repos Git` (or your repo type)
   - Select your repository
   - Choose `Existing Azure Pipelines YAML file`
   - Path: `/infrastructure/terraform/azure-pipelines-terraform.yml`
   - Save and run

### Step 4: First Deployment

```bash
# Option 1: Via Git push (recommended)
git checkout develop
git add infrastructure/terraform/
git commit -m "Add Terraform pipeline configuration"
git push origin develop

# Option 2: Manual pipeline run
# In Azure DevOps → Pipelines → Select pipeline → Run pipeline
```

## Environment Variables Cheat Sheet

### Required for All Environments

```bash
# Azure Authentication
ARM_CLIENT_ID="<service-principal-app-id>"
ARM_CLIENT_SECRET="<service-principal-password>"
ARM_SUBSCRIPTION_ID="<azure-subscription-id>"
ARM_TENANT_ID="<azure-tenant-id>"

# Backend Configuration
BACKEND_STORAGE_ACCOUNT="jobpilotterraform"
BACKEND_CONTAINER_NAME="tfstate"
BACKEND_RESOURCE_GROUP="jobpilot-terraform-backend"

# Database Credentials
SQL_ADMIN_USERNAME="jobpilotadmin"
SQL_ADMIN_PASSWORD_DEV="<dev-password>"
SQL_ADMIN_PASSWORD_STAGING="<staging-password>"
SQL_ADMIN_PASSWORD_PROD="<prod-password>"
```

## Local Testing

### Prerequisites

```bash
# Install Terraform
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Install tfsec
curl -s https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash

# Install Checkov
pip install checkov
```

### Run Locally

```bash
cd infrastructure/terraform

# Export credentials
export ARM_CLIENT_ID="..."
export ARM_CLIENT_SECRET="..."
export ARM_SUBSCRIPTION_ID="..."
export ARM_TENANT_ID="..."
export TF_VAR_sql_admin_username="..."
export TF_VAR_sql_admin_password="..."

# Initialize
bash scripts/terraform-init.sh dev

# Validate
terraform fmt -check -recursive
terraform validate

# Security scan
tfsec .
checkov -d . --config-file .checkov.yaml

# Plan
bash scripts/terraform-plan.sh dev

# Review
terraform show tfplan-dev

# Apply (optional)
bash scripts/terraform-apply.sh dev
```

## Common Commands

### Pipeline Management

```bash
# Trigger pipeline via Git
git push origin develop      # Deploy to dev
git push origin main         # Deploy to staging → prod

# Check pipeline status
az pipelines runs list --org https://dev.azure.com/{org} --project {project}

# Show pipeline details
az pipelines show --id {pipeline-id}
```

### Terraform Operations

```bash
# Format code
terraform fmt -recursive

# Validate configuration
terraform validate

# Show current state
terraform show

# List resources
terraform state list

# Show specific resource
terraform state show azurerm_resource_group.main

# Refresh state
terraform refresh

# View outputs
terraform output
```

### Debugging

```bash
# Enable debug logging
export TF_LOG=DEBUG
export TF_LOG_PATH=terraform-debug.log

# View plan in detail
terraform show -json tfplan-dev | jq

# Check state file
terraform state pull > current-state.json
```

## Deployment Checklist

### Before Deploying

- [ ] Review Terraform changes in PR
- [ ] Security scans passed (tfsec, Checkov)
- [ ] Format check passed
- [ ] Validation passed
- [ ] Plan reviewed and approved
- [ ] All tests passed
- [ ] Documentation updated
- [ ] Team notified

### For Production

- [ ] Staging deployment successful
- [ ] Smoke tests passed in staging
- [ ] Performance tests passed
- [ ] Security review completed
- [ ] Change request approved
- [ ] Rollback plan prepared
- [ ] On-call engineer available
- [ ] Monitoring dashboard ready
- [ ] Stakeholders notified

### After Deploying

- [ ] Deployment successful
- [ ] Health checks passing
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Post-deployment tests passed

## Troubleshooting Quick Fixes

### Problem: Pipeline fails at Init stage

```bash
# Solution: Check backend configuration
az storage account show --name jobpilotterraform
az storage container show --name tfstate --account-name jobpilotterraform
```

### Problem: Authentication errors

```bash
# Solution: Verify service principal
az login --service-principal \
  --username $ARM_CLIENT_ID \
  --password $ARM_CLIENT_SECRET \
  --tenant $ARM_TENANT_ID

# Reset credentials if needed
az ad sp credential reset --id $ARM_CLIENT_ID
```

### Problem: Security scan failures

```bash
# Solution: Run locally and fix issues
cd infrastructure/terraform
tfsec . --config-file .tfsec.yml
checkov -d . --config-file .checkov.yaml

# Fix issues or add to skip list
```

### Problem: State lock

```bash
# Solution: Wait or force unlock
terraform force-unlock <lock-id>
```

### Problem: Plan shows unexpected changes

```bash
# Solution: Refresh state
terraform refresh
terraform plan

# Check for drift
terraform plan -detailed-exitcode
```

## Resource Links

- [Full Documentation](./PIPELINE-README.md)
- [Terraform Docs](https://www.terraform.io/docs)
- [Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [tfsec Rules](https://aquasecurity.github.io/tfsec/)
- [Checkov Policies](https://www.checkov.io/5.Policy%20Index/all.html)

## Support Contacts

- **DevOps Team**: devops@jobpilot.com
- **On-Call**: +1-XXX-XXX-XXXX
- **Slack**: #infrastructure-support

## Cost Estimates

| Environment | Monthly Cost | Annual Cost |
|-------------|--------------|-------------|
| Dev         | ~$150-200    | ~$1,800-2,400 |
| Staging     | ~$600-800    | ~$7,200-9,600 |
| Prod        | ~$2,000-3,500 | ~$24,000-42,000 |
| **Total**   | ~$2,750-4,500 | ~$33,000-54,000 |

*Costs vary based on usage, region, and features enabled*

## Next Steps

1. ✅ Complete Azure setup
2. ✅ Configure Azure DevOps
3. ✅ Test pipeline in dev
4. ✅ Deploy to staging
5. ✅ Validate in staging
6. ✅ Deploy to production
7. ✅ Monitor and optimize

---

**Last Updated**: 2025-12-04
**Version**: 1.0.0
**Maintained By**: DevOps Team
