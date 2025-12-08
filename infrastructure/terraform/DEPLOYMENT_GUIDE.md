# JobPilot Infrastructure Deployment Guide

This guide provides step-by-step instructions for deploying the JobPilot AI Platform infrastructure to Azure using Terraform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Deployment](#development-deployment)
4. [Staging Deployment](#staging-deployment)
5. [Production Deployment](#production-deployment)
6. [Post-Deployment](#post-deployment)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Tools Installation

1. **Install Terraform (v1.5.0+)**

   **Windows (PowerShell)**:
   ```powershell
   # Using Chocolatey
   choco install terraform

   # Or download from https://www.terraform.io/downloads
   ```

   **macOS**:
   ```bash
   brew install terraform
   ```

   **Linux**:
   ```bash
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

   Verify installation:
   ```bash
   terraform version
   ```

2. **Install Azure CLI (v2.50.0+)**

   **Windows**:
   ```powershell
   # Download installer from:
   # https://aka.ms/installazurecliwindows
   ```

   **macOS**:
   ```bash
   brew install azure-cli
   ```

   **Linux**:
   ```bash
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
   ```

   Verify installation:
   ```bash
   az version
   ```

3. **Install kubectl (for AKS management)**

   ```bash
   az aks install-cli
   ```

### Azure Setup

1. **Azure Subscription**

   Ensure you have:
   - An active Azure subscription
   - Contributor or Owner role on the subscription
   - Sufficient quota for resources (especially VMs and Public IPs)

   Check current quota:
   ```bash
   az vm list-usage --location eastus -o table
   ```

2. **Azure Authentication**

   **Option 1: Azure CLI Login (Recommended for local development)**
   ```bash
   # Login to Azure
   az login

   # Set the subscription
   az account set --subscription "<subscription-id-or-name>"

   # Verify
   az account show
   ```

   **Option 2: Service Principal (Recommended for CI/CD)**
   ```bash
   # Create service principal
   az ad sp create-for-rbac \
     --name "terraform-jobpilot" \
     --role="Contributor" \
     --scopes="/subscriptions/<subscription-id>"

   # Output will include:
   # - appId (Client ID)
   # - password (Client Secret)
   # - tenant (Tenant ID)

   # Set environment variables
   export ARM_CLIENT_ID="<appId>"
   export ARM_CLIENT_SECRET="<password>"
   export ARM_SUBSCRIPTION_ID="<subscription-id>"
   export ARM_TENANT_ID="<tenant-id>"
   ```

3. **Register Resource Providers**

   ```bash
   # Run this script to register all required providers
   az provider register --namespace Microsoft.Compute
   az provider register --namespace Microsoft.Network
   az provider register --namespace Microsoft.ContainerService
   az provider register --namespace Microsoft.ContainerRegistry
   az provider register --namespace Microsoft.KeyVault
   az provider register --namespace Microsoft.Sql
   az provider register --namespace Microsoft.Cache
   az provider register --namespace Microsoft.ServiceBus
   az provider register --namespace Microsoft.OperationalInsights
   az provider register --namespace Microsoft.Insights
   az provider register --namespace Microsoft.Storage
   az provider register --namespace Microsoft.Web

   # Check registration status
   az provider show --namespace Microsoft.ContainerService --query "registrationState"
   ```

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd infrastructure/terraform
```

### 2. Create Terraform State Backend

Terraform state must be stored remotely for collaboration and consistency.

```bash
# Set variables
LOCATION="eastus"
STORAGE_ACCOUNT_NAME="jobpilottfstate"  # Must be globally unique
RESOURCE_GROUP_NAME="tfstate-rg"
CONTAINER_NAME="tfstate"

# Create resource group
az group create \
  --name $RESOURCE_GROUP_NAME \
  --location $LOCATION

# Create storage account
az storage account create \
  --name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --location $LOCATION \
  --sku Standard_LRS \
  --encryption-services blob \
  --allow-blob-public-access false \
  --min-tls-version TLS1_2

# Create blob container
az storage container create \
  --name $CONTAINER_NAME \
  --account-name $STORAGE_ACCOUNT_NAME \
  --auth-mode login

# Enable versioning (recommended)
az storage account blob-service-properties update \
  --account-name $STORAGE_ACCOUNT_NAME \
  --resource-group $RESOURCE_GROUP_NAME \
  --enable-versioning true

# Enable soft delete (recommended)
az storage blob service-properties delete-policy update \
  --account-name $STORAGE_ACCOUNT_NAME \
  --enable true \
  --days-retained 30

echo "Backend storage created successfully!"
echo "Storage Account: $STORAGE_ACCOUNT_NAME"
echo "Container: $CONTAINER_NAME"
```

### 3. Configure Backend

Edit `backend.tf` and uncomment the backend configuration:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate-rg"
    storage_account_name = "jobpilottfstate"
    container_name       = "tfstate"
    key                  = "jobpilot-dev.tfstate"  # Change per environment
  }
}
```

Or provide backend configuration at runtime (recommended):

```bash
terraform init \
  -backend-config="resource_group_name=tfstate-rg" \
  -backend-config="storage_account_name=jobpilottfstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=jobpilot-dev.tfstate"
```

## Development Deployment

Development environment is optimized for cost and rapid iteration.

### 1. Create Variables File

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Minimal required configuration**:

```hcl
environment  = "dev"
location     = "eastus"
project_name = "jobpilot"

# IMPORTANT: Use strong passwords!
sql_admin_username = "sqladmin"
sql_admin_password = "YourSecurePassword123!@#"

# Optional: Add your IP for access
allowed_ip_addresses = [
  "203.0.113.0/32"  # Your public IP
]

tags = {
  Environment = "Development"
  Project     = "JobPilot"
  Owner       = "DevOps Team"
}
```

### 2. Initialize Terraform

```bash
# Initialize with dev backend
terraform init \
  -backend-config="key=jobpilot-dev.tfstate"
```

### 3. Validate Configuration

```bash
# Validate syntax
terraform validate

# Format code
terraform fmt -recursive

# Check for issues
terraform plan -var-file="environments/dev.tfvars"
```

### 4. Deploy Infrastructure

```bash
# Create execution plan
terraform plan \
  -var-file="environments/dev.tfvars" \
  -out=dev.tfplan

# Review plan
terraform show dev.tfplan

# Apply (with approval)
terraform apply dev.tfplan

# Or apply directly with auto-approve (use with caution)
terraform apply \
  -var-file="environments/dev.tfvars" \
  -auto-approve
```

### 5. Verify Deployment

```bash
# View outputs
terraform output

# Specific outputs
terraform output web_app_url
terraform output sql_server_fqdn
terraform output container_registry_login_server

# View in Azure Portal
az resource list --resource-group jobpilot-dev-rg --output table
```

**Expected deployment time**: 15-20 minutes

### 6. Access Resources

```bash
# Get web app URL
WEB_APP_URL=$(terraform output -raw web_app_url)
echo "Web App: $WEB_APP_URL"

# Test web app
curl -I $WEB_APP_URL

# Login to container registry
ACR_NAME=$(terraform output -raw container_registry_name)
az acr login --name $ACR_NAME

# View Key Vault
KV_NAME=$(terraform output -raw key_vault_name)
az keyvault secret list --vault-name $KV_NAME
```

## Staging Deployment

Staging environment mirrors production but with reduced resources.

### 1. Initialize Staging Backend

```bash
# Reconfigure backend for staging
terraform init \
  -backend-config="key=jobpilot-staging.tfstate" \
  -reconfigure
```

### 2. Deploy Staging

```bash
# Plan
terraform plan \
  -var-file="environments/staging.tfvars" \
  -out=staging.tfplan

# Apply
terraform apply staging.tfplan
```

### 3. Configure AKS (if enabled)

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group jobpilot-staging-rg \
  --name jobpilot-staging-aks \
  --overwrite-existing

# Verify connection
kubectl get nodes
kubectl get namespaces

# View cluster info
kubectl cluster-info
```

**Expected deployment time**: 25-30 minutes (with AKS)

## Production Deployment

Production deployment requires careful planning and validation.

### Pre-Deployment Checklist

- [ ] Review and approve infrastructure changes
- [ ] Notify team of deployment window
- [ ] Backup existing production state (if updating)
- [ ] Verify quota limits
- [ ] Configure DNS records (if using custom domains)
- [ ] SSL certificates ready (if using custom domains)
- [ ] Security team approval (if required)
- [ ] Change management ticket created

### 1. Initialize Production Backend

```bash
# Reconfigure backend for production
terraform init \
  -backend-config="key=jobpilot-prod.tfstate" \
  -reconfigure
```

### 2. Review Production Configuration

```bash
# Review prod.tfvars
cat environments/prod.tfvars

# Verify variables
terraform console
> var.environment
> var.enable_defender
> var.enable_private_endpoints
```

### 3. Create Execution Plan

```bash
# Generate detailed plan
terraform plan \
  -var-file="environments/prod.tfvars" \
  -out=prod.tfplan

# Save plan output for review
terraform show -json prod.tfplan > prod-plan.json
terraform show prod.tfplan > prod-plan.txt
```

### 4. Review Plan

**Critical items to verify**:
- No unexpected resource deletions
- Correct SKUs (Premium for production)
- Private endpoints enabled
- Azure Defender enabled
- Auto-scaling configured
- Backup retention periods
- Network configuration

```bash
# Count resources to be created
grep "will be created" prod-plan.txt | wc -l

# Check for deletions (should be zero for new deployment)
grep "will be destroyed" prod-plan.txt
```

### 5. Deploy Production

```bash
# Apply with manual approval
terraform apply prod.tfplan

# Monitor progress
# Deployment typically takes 30-40 minutes
```

### 6. Post-Deployment Validation

```bash
# Verify all resources created
terraform state list | wc -l

# Check resource health
az resource list \
  --resource-group jobpilot-prod-rg \
  --query "[?provisioningState!='Succeeded'].{Name:name, State:provisioningState}" \
  --output table

# Test endpoints
WEB_APP_URL=$(terraform output -raw web_app_url)
AUTH_URL=$(terraform output -raw auth_service_url)
AI_URL=$(terraform output -raw ai_service_url)

curl -I $WEB_APP_URL
curl -I $AUTH_URL/health
curl -I $AI_URL/health

# If AKS enabled
if [ "$(terraform output -raw aks_cluster_enabled)" == "true" ]; then
  az aks get-credentials \
    --resource-group jobpilot-prod-rg \
    --name jobpilot-prod-aks

  kubectl get nodes
  kubectl get namespaces
fi
```

**Expected deployment time**: 30-40 minutes (with AKS and all features)

## Post-Deployment

### 1. Configure DNS (if using custom domains)

```bash
# Get Application Gateway public IP (if enabled)
APPGW_IP=$(terraform output -raw application_gateway_public_ip)

# Get Front Door endpoint (if enabled)
FD_ENDPOINT=$(terraform output -raw front_door_endpoint_host_name)

# Create DNS records in your DNS provider
# Example for Application Gateway:
# A record: app.yourdomain.com -> $APPGW_IP
# CNAME record: www.yourdomain.com -> app.yourdomain.com
```

### 2. Upload SSL Certificates

```bash
# For Application Gateway
KV_NAME=$(terraform output -raw key_vault_name)

# Upload certificate to Key Vault
az keyvault certificate import \
  --vault-name $KV_NAME \
  --name ssl-certificate \
  --file /path/to/certificate.pfx \
  --password <certificate-password>

# Update Application Gateway to use certificate
# This requires re-running Terraform with updated variables
```

### 3. Configure Monitoring

```bash
# Get Application Insights details
APPINSIGHTS_KEY=$(terraform output -raw app_insights_instrumentation_key)
APPINSIGHTS_CONN=$(terraform output -raw app_insights_connection_string)

# Configure application to use Application Insights
# Set environment variables in App Services:
az webapp config appsettings set \
  --resource-group jobpilot-prod-rg \
  --name jobpilot-prod-webapp \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY \
              APPLICATIONINSIGHTS_CONNECTION_STRING=$APPINSIGHTS_CONN
```

### 4. Set Up Alerts

```bash
# Verify action group created
az monitor action-group list \
  --resource-group jobpilot-prod-rg \
  --output table

# List configured alerts
az monitor metrics alert list \
  --resource-group jobpilot-prod-rg \
  --output table

# Test alert (send test notification)
az monitor action-group test-notifications create \
  --action-group-name jobpilot-prod-action-group \
  --resource-group jobpilot-prod-rg \
  --notification-type Email \
  --receiver email-receiver
```

### 5. Configure Backups

Backups are automated, but verify configuration:

```bash
# SQL Database backup policy
az sql db show \
  --resource-group jobpilot-prod-rg \
  --server jobpilot-prod-sql-* \
  --name jobpilot-prod-db \
  --query "[retentionPolicyDays,earliestRestoreDate]"

# List available restore points
az sql db list-restorable-dropped-database \
  --resource-group jobpilot-prod-rg \
  --server jobpilot-prod-sql-*
```

### 6. Document Deployment

Create deployment record:

```bash
# Generate deployment summary
cat > DEPLOYMENT_RECORD.md <<EOF
# Production Deployment - $(date)

## Deployment Details
- **Environment**: Production
- **Terraform Version**: $(terraform version | head -n1)
- **Deployed By**: $(az account show --query user.name -o tsv)
- **Deployment Date**: $(date)
- **Git Commit**: $(git rev-parse HEAD)

## Resources Created
$(terraform state list | wc -l) resources

## Key Outputs
- Web App: $(terraform output -raw web_app_url)
- Container Registry: $(terraform output -raw container_registry_login_server)
- SQL Server: $(terraform output -raw sql_server_fqdn)

## Validation
- [x] All resources provisioned successfully
- [x] Health checks passing
- [x] Monitoring configured
- [x] Alerts tested
- [x] Backup policy verified

## Notes
Add any deployment-specific notes here...
EOF

cat DEPLOYMENT_RECORD.md
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/terraform.yml`:

```yaml
name: Terraform Deployment

on:
  push:
    branches: [main]
    paths:
      - 'infrastructure/terraform/**'
  pull_request:
    branches: [main]

env:
  ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
  ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
  ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
  ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0

      - name: Terraform Init
        working-directory: infrastructure/terraform
        run: |
          terraform init \
            -backend-config="key=jobpilot-${{ github.ref_name }}.tfstate"

      - name: Terraform Plan
        working-directory: infrastructure/terraform
        run: |
          terraform plan \
            -var-file="environments/${{ github.ref_name }}.tfvars" \
            -out=tfplan

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        working-directory: infrastructure/terraform
        run: terraform apply -auto-approve tfplan
```

### Azure DevOps

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - infrastructure/terraform/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: terraform-secrets  # Variable group with Azure credentials

stages:
  - stage: Plan
    jobs:
      - job: TerraformPlan
        steps:
          - task: TerraformInstaller@0
            inputs:
              terraformVersion: '1.6.0'

          - task: TerraformTaskV2@2
            displayName: 'Terraform Init'
            inputs:
              provider: 'azurerm'
              command: 'init'
              workingDirectory: '$(System.DefaultWorkingDirectory)/infrastructure/terraform'
              backendServiceArm: 'Azure-Subscription'
              backendAzureRmResourceGroupName: 'tfstate-rg'
              backendAzureRmStorageAccountName: 'jobpilottfstate'
              backendAzureRmContainerName: 'tfstate'
              backendAzureRmKey: 'jobpilot-prod.tfstate'

          - task: TerraformTaskV2@2
            displayName: 'Terraform Plan'
            inputs:
              provider: 'azurerm'
              command: 'plan'
              workingDirectory: '$(System.DefaultWorkingDirectory)/infrastructure/terraform'
              commandOptions: '-var-file="environments/prod.tfvars" -out=tfplan'
              environmentServiceNameAzureRM: 'Azure-Subscription'

  - stage: Apply
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: TerraformApply
        environment: 'Production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: TerraformTaskV2@2
                  displayName: 'Terraform Apply'
                  inputs:
                    provider: 'azurerm'
                    command: 'apply'
                    workingDirectory: '$(System.DefaultWorkingDirectory)/infrastructure/terraform'
                    commandOptions: 'tfplan'
                    environmentServiceNameAzureRM: 'Azure-Subscription'
```

## Troubleshooting

### Common Issues

#### Backend Access Denied

**Error**:
```
Error: Failed to get existing workspaces: storage: service returned error: StatusCode=403
```

**Solution**:
```bash
# Grant current user Storage Blob Data Contributor role
CURRENT_USER=$(az ad signed-in-user show --query objectId -o tsv)
STORAGE_ACCOUNT_ID=$(az storage account show \
  --name jobpilottfstate \
  --resource-group tfstate-rg \
  --query id -o tsv)

az role assignment create \
  --assignee $CURRENT_USER \
  --role "Storage Blob Data Contributor" \
  --scope $STORAGE_ACCOUNT_ID
```

#### Quota Exceeded

**Error**:
```
Code="QuotaExceeded" Message="Operation could not be completed as it results in exceeding approved cores quota"
```

**Solution**:
```bash
# Check current quota
az vm list-usage --location eastus --output table

# Request quota increase via Azure Portal:
# Support > New Support Request > Service and subscription limits (quotas)
# Select: Compute-VM (cores-vCPUs) subscription limit increases
```

#### Resource Already Exists

**Error**:
```
Error: A resource with the ID "/subscriptions/.../resourceGroups/..." already exists
```

**Solution**:
```bash
# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/<sub-id>/resourceGroups/<rg-name>

# Or delete existing resource (use with caution!)
az group delete --name <rg-name> --yes
```

### Debug Mode

Enable detailed logging:

```bash
# Set log level
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform-debug.log

# Run terraform command
terraform apply

# Review debug log
less terraform-debug.log
```

### State Recovery

If state becomes corrupted:

```bash
# Pull current state
terraform state pull > backup-state.json

# Fix issue and push state back
terraform state push backup-state.json

# Or restore from Azure Storage versioning
az storage blob download \
  --account-name jobpilottfstate \
  --container-name tfstate \
  --name jobpilot-prod.tfstate \
  --file restored-state.tfstate \
  --version-id <version-id>
```

## Support

For deployment issues:
- GitHub Issues: [Project Repository](https://github.com/yourorg/jobpilot/issues)
- Slack: #infrastructure channel
- Email: devops@yourcompany.com

## Next Steps

After successful deployment:

1. [Configure Application Deployments](../../docs/deployment/application-deployment.md)
2. [Set Up Monitoring](../../docs/operations/monitoring.md)
3. [Configure Security](../../docs/security/security-configuration.md)
4. [Disaster Recovery Planning](../../docs/operations/disaster-recovery.md)
