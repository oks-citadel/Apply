# Troubleshooting Guide

Comprehensive troubleshooting guide for Terraform deployment issues on Azure DevOps, covering common problems, solutions, and debugging techniques.

## Table of Contents

- [Quick Reference](#quick-reference)
- [State File Issues](#state-file-issues)
- [Authentication Problems](#authentication-problems)
- [Resource Deployment Errors](#resource-deployment-errors)
- [Pipeline Failures](#pipeline-failures)
- [Network and Connectivity](#network-and-connectivity)
- [Permission and Access Issues](#permission-and-access-issues)
- [Performance Problems](#performance-problems)
- [Azure DevOps Specific](#azure-devops-specific)
- [Debugging Techniques](#debugging-techniques)

## Quick Reference

### Common Error Codes

| Error Code | Description | Quick Fix |
|------------|-------------|-----------|
| `Error: Failed to get existing workspaces` | State backend issue | Check storage account access |
| `Error: Error acquiring the state lock` | Concurrent execution | Wait or break lock |
| `Error: Insufficient permissions` | RBAC issue | Grant required role |
| `Error: timeout while waiting` | Resource provisioning slow | Increase timeout |
| `Error: Provider registry.terraform.io` | Provider download failed | Check network/mirror |
| `Error: Backend initialization required` | State not initialized | Run `terraform init` |

### Emergency Commands

```bash
# Force unlock state
terraform force-unlock <LOCK_ID>

# Refresh state
terraform refresh

# Import existing resource
terraform import <resource_type>.<name> <azure_resource_id>

# Destroy specific resource
terraform destroy -target=<resource_type>.<name>

# Show current state
terraform show

# Validate configuration
terraform validate

# View plan in detail
terraform plan -out=plan.tfplan
terraform show -json plan.tfplan | jq
```

## State File Issues

### Issue 1: State Lock Timeout

**Error:**
```
Error: Error acquiring the state lock

Lock Info:
  ID:        abc123-def456-ghi789
  Path:      tfstate/dev.tfstate
  Operation: OperationTypeApply
  Who:       user@hostname
  Version:   1.5.0
  Created:   2025-12-04 10:30:00
```

**Cause:**
- Previous pipeline run crashed without releasing lock
- Concurrent Terraform runs
- Network interruption during apply

**Solution 1: Wait for Lock Release (Recommended)**
```bash
# Lock usually releases after 10-15 minutes
# Wait and retry pipeline
```

**Solution 2: Force Unlock (Use with Caution)**
```bash
# Get lock ID from error message
LOCK_ID="abc123-def456-ghi789"

# Force unlock
terraform force-unlock ${LOCK_ID}

# Or via Azure CLI
az storage blob lease break \
  --blob-name dev.tfstate \
  --container-name tfstate \
  --account-name jobpilottfstate
```

**Prevention:**
```yaml
# In pipeline - automatic unlock on failure
- script: |
    terraform apply -auto-approve || {
      terraform force-unlock -force $(terraform force-unlock 2>&1 | grep -oP 'ID:\s+\K\S+')
      exit 1
    }
  displayName: 'Terraform Apply with Auto-Unlock'
```

### Issue 2: State File Corrupted

**Error:**
```
Error: Failed to load state: state snapshot was created by Terraform v1.6.0,
which is newer than current v1.5.0; upgrade to Terraform v1.6.0 or greater
```

**Cause:**
- Version mismatch
- Interrupted write operation
- Manual state file modification

**Solution 1: Restore from Backup**
```bash
# List available backups
az storage blob list \
  --account-name jobpilottfstate \
  --container-name tfstate \
  --prefix dev.tfstate \
  --include snapshots

# Download backup
az storage blob download \
  --account-name jobpilottfstate \
  --container-name tfstate \
  --name dev.tfstate \
  --version-id <version-id> \
  --file dev.tfstate.backup

# Replace current state
az storage blob upload \
  --account-name jobpilottfstate \
  --container-name tfstate \
  --name dev.tfstate \
  --file dev.tfstate.backup \
  --overwrite
```

**Solution 2: Upgrade Terraform Version**
```yaml
# In pipeline
- task: TerraformInstaller@0
  inputs:
    terraformVersion: '1.6.0'  # Match state version
```

**Solution 3: Recover State**
```bash
# Create new state from existing resources
terraform init

# Import all resources
# (requires manual listing of resources)
terraform import azurerm_resource_group.main /subscriptions/.../resourceGroups/jobpilot-dev-rg
terraform import azurerm_kubernetes_cluster.main /subscriptions/.../managedClusters/jobpilot-dev-aks
# ... repeat for all resources
```

### Issue 3: State Drift Detected

**Error:**
```
Note: Objects have changed outside of Terraform
Terraform detected the following changes made outside of Terraform...
```

**Cause:**
- Manual changes via Azure Portal
- Changes by other tools/scripts
- Resource auto-scaling

**Solution 1: Accept Changes**
```bash
# Update state to match reality
terraform refresh

# Verify changes
terraform plan
```

**Solution 2: Revert Manual Changes**
```bash
# Re-apply Terraform configuration
terraform apply -auto-approve
```

**Solution 3: Ignore Specific Attributes**
```hcl
# In resource configuration
resource "azurerm_kubernetes_cluster" "main" {
  # ...

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,  # Ignore autoscaler changes
      tags["last_modified"]
    ]
  }
}
```

### Issue 4: State File Not Found

**Error:**
```
Error: Failed to get existing workspaces: containers.Client#GetProperties:
Failure responding to request: StatusCode=404
```

**Cause:**
- Storage account deleted
- Container doesn't exist
- Incorrect backend configuration
- Network/firewall blocking access

**Solution:**
```bash
# Verify storage account exists
az storage account show \
  --name jobpilottfstate \
  --resource-group jobpilot-terraform-state-rg

# Verify container exists
az storage container show \
  --name tfstate \
  --account-name jobpilottfstate

# If missing, recreate
az storage container create \
  --name tfstate \
  --account-name jobpilottfstate

# Re-initialize backend
terraform init -reconfigure
```

## Authentication Problems

### Issue 1: Service Principal Authentication Failed

**Error:**
```
Error: building account: could not acquire access token to parse claims:
clientID and clientSecret must be specified
```

**Cause:**
- Missing environment variables
- Expired credentials
- Incorrect credentials

**Solution:**
```bash
# Verify environment variables are set
echo "ARM_CLIENT_ID: ${ARM_CLIENT_ID}"
echo "ARM_TENANT_ID: ${ARM_TENANT_ID}"
# Don't echo SECRET!

# Test authentication
az login --service-principal \
  -u ${ARM_CLIENT_ID} \
  -p ${ARM_CLIENT_SECRET} \
  --tenant ${ARM_TENANT_ID}

# If expired, reset credential
az ad sp credential reset \
  --name "jobpilot-terraform-sp"

# Update in Azure DevOps variable group
```

**Pipeline Fix:**
```yaml
# Ensure variables are passed correctly
variables:
  - group: terraform-backend

steps:
  - script: |
      terraform init
      terraform plan
    displayName: 'Terraform Plan'
    env:
      ARM_CLIENT_ID: $(ARM_CLIENT_ID)
      ARM_CLIENT_SECRET: $(ARM_CLIENT_SECRET)
      ARM_SUBSCRIPTION_ID: $(ARM_SUBSCRIPTION_ID)
      ARM_TENANT_ID: $(ARM_TENANT_ID)
```

### Issue 2: Service Principal Permissions Insufficient

**Error:**
```
Error: authorization.RoleAssignmentsClient#Create: Failure sending request:
StatusCode=403 -- Original Error: Code="AuthorizationFailed"
Message="The client '...' does not have authorization to perform action
'Microsoft.Authorization/roleAssignments/write'"
```

**Cause:**
- Service Principal missing required role
- Role not propagated yet

**Solution:**
```bash
# Get Service Principal Object ID
SP_ID=$(az ad sp list --display-name "jobpilot-terraform-sp" --query "[0].id" -o tsv)

# Grant User Access Administrator role
az role assignment create \
  --assignee ${SP_ID} \
  --role "User Access Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}

# Wait for propagation (up to 5 minutes)
sleep 300

# Verify assignments
az role assignment list --assignee ${SP_ID} --output table
```

### Issue 3: Subscription Not Found

**Error:**
```
Error: Error building AzureRM Client: Obtaining subscription metadata from Azure:
<subscription-id> is not associated with account
```

**Cause:**
- Wrong subscription ID
- Service Principal doesn't have access
- Subscription disabled

**Solution:**
```bash
# Verify subscription ID
az account list --output table

# Check Service Principal access
az login --service-principal \
  -u ${ARM_CLIENT_ID} \
  -p ${ARM_CLIENT_SECRET} \
  --tenant ${ARM_TENANT_ID}

az account list --output table

# Grant access if missing
az role assignment create \
  --assignee ${SP_ID} \
  --role Contributor \
  --subscription ${SUBSCRIPTION_ID}
```

## Resource Deployment Errors

### Issue 1: Resource Already Exists

**Error:**
```
Error: A resource with the ID
"/subscriptions/.../resourceGroups/jobpilot-dev-rg" already exists
```

**Cause:**
- Resource created outside Terraform
- Previous partial deployment
- State file doesn't track resource

**Solution 1: Import Existing Resource**
```bash
# Import into state
terraform import azurerm_resource_group.main /subscriptions/${SUB}/resourceGroups/jobpilot-dev-rg

# Verify import
terraform plan  # Should show no changes
```

**Solution 2: Remove and Recreate**
```bash
# Delete existing resource
az group delete --name jobpilot-dev-rg --yes --no-wait

# Wait for deletion
az group wait --name jobpilot-dev-rg --deleted

# Re-run Terraform
terraform apply
```

**Solution 3: Use Different Name**
```hcl
# Update configuration
resource "azurerm_resource_group" "main" {
  name     = "jobpilot-dev-v2-rg"  # New name
  location = "eastus"
}
```

### Issue 2: Quota Exceeded

**Error:**
```
Error: creating Kubernetes Cluster: containerservice.ManagedClustersClient#CreateOrUpdate:
Failure sending request: StatusCode=400 -- Original Error: Code="QuotaExceeded"
Message="Operation could not be completed as it results in exceeding approved
Total Regional Cores quota"
```

**Cause:**
- Subscription quota limits
- Too many resources in region
- Wrong VM size selection

**Solution 1: Request Quota Increase**
```bash
# Check current quota
az vm list-usage --location eastus --output table

# Request increase via Azure Portal
# Support → New support request → Service and subscription limits (quotas)
```

**Solution 2: Use Different Region**
```hcl
# Change to less-utilized region
resource "azurerm_resource_group" "main" {
  name     = "jobpilot-dev-rg"
  location = "westus2"  # Try different region
}
```

**Solution 3: Use Smaller VM Size**
```hcl
# Use smaller instances
resource "azurerm_kubernetes_cluster_node_pool" "main" {
  vm_size    = "Standard_D2s_v3"  # Smaller than D8s_v3
  node_count = 2
  # ...
}
```

### Issue 3: Resource Name Conflict

**Error:**
```
Error: checking for presence of existing Storage Account "jobpilotsa":
storage.AccountsClient#GetProperties: Failure responding to request:
StatusCode=409 -- Original Error: Code="StorageAccountAlreadyTaken"
Message="The storage account named jobpilotsa is already taken."
```

**Cause:**
- Storage account names are globally unique
- Name taken by another subscription
- Previous deployment not cleaned up

**Solution:**
```hcl
# Generate unique name
resource "azurerm_storage_account" "main" {
  name                     = "jobpilot${var.environment}${random_string.unique.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "random_string" "unique" {
  length  = 8
  special = false
  upper   = false
}
```

### Issue 4: Timeout Waiting for Resource

**Error:**
```
Error: waiting for creation of Kubernetes Cluster:
Code="CreateVMSSAgentPoolFailed" Message="VMSSAgentPoolReconciler retry failed:
[...] Timeout expired while waiting for operation to complete"
```

**Cause:**
- Azure API slow response
- Complex resource creation
- Network/connectivity issues

**Solution 1: Increase Timeout**
```hcl
resource "azurerm_kubernetes_cluster" "main" {
  # ...

  timeouts {
    create = "60m"  # Increase from default 30m
    update = "60m"
    delete = "60m"
  }
}
```

**Solution 2: Retry**
```bash
# Simply retry the operation
terraform apply -auto-approve
```

**Solution 3: Check Azure Status**
```bash
# Check for Azure service issues
az rest --method get \
  --uri "https://status.azure.com/api/status"
```

## Pipeline Failures

### Issue 1: Pipeline Cannot Find Terraform

**Error:**
```
terraform: command not found
```

**Cause:**
- Terraform not installed on agent
- Wrong PATH configuration
- Using self-hosted agent without Terraform

**Solution:**
```yaml
# Add Terraform installer task
steps:
  - task: TerraformInstaller@0
    displayName: 'Install Terraform'
    inputs:
      terraformVersion: '1.6.0'

  - script: terraform --version
    displayName: 'Verify Terraform'

  - script: terraform init
    displayName: 'Terraform Init'
```

### Issue 2: Variable Group Not Accessible

**Error:**
```
Variable group 'terraform-backend' could not be found
```

**Cause:**
- Variable group doesn't exist
- Pipeline doesn't have permission
- Wrong variable group name

**Solution:**
```bash
# Verify variable group exists
az pipelines variable-group list \
  --organization https://dev.azure.com/your-org \
  --project your-project

# Grant pipeline access
# Go to: Library → Variable groups → terraform-backend
# → Pipeline permissions → Add specific pipeline
```

**Pipeline Fix:**
```yaml
# Verify exact name
variables:
  - group: terraform-backend  # Must match exactly (case-sensitive)
```

### Issue 3: Environment Approval Timeout

**Error:**
```
Job/Stage was abandoned because 'prod' environment approval timed out
```

**Cause:**
- No approver responded
- Approvers unavailable
- Timeout too short

**Solution 1: Extend Timeout**
```
Environment → Approvals and checks → Edit approval
Timeout: 72 hours (from 24 hours)
```

**Solution 2: Add Alternative Approvers**
```
Approvers:
  - Primary: Tech Lead
  - Backup: Engineering Manager
  - Backup: Senior DevOps Engineer
Type: Any one user
```

**Solution 3: Resume Failed Run**
```
# In Azure DevOps
Pipeline run → More actions → Retry failed stages
```

### Issue 4: Pipeline Out of Memory

**Error:**
```
##[error]The task has been canceled.
Process terminated with exit code 137 (out of memory)
```

**Cause:**
- Large Terraform state
- Complex plan generation
- Insufficient agent resources

**Solution 1: Use Better Agent**
```yaml
pool:
  vmImage: 'ubuntu-latest'  # Or
  # Self-hosted with more memory
  name: 'high-memory-pool'
```

**Solution 2: Optimize Terraform**
```hcl
# Split into smaller modules
module "networking" {
  source = "./modules/networking"
}

module "compute" {
  source = "./modules/compute"
}

# Deploy separately
```

**Solution 3: Increase Timeouts**
```yaml
jobs:
  - job: TerraformApply
    timeoutInMinutes: 120  # 2 hours
    cancelTimeoutInMinutes: 5
```

### Issue 5: Artifacts Not Found

**Error:**
```
##[error]No files were found with the provided path: terraform.tfplan
```

**Cause:**
- Artifact not published in previous stage
- Wrong artifact path
- Plan generation failed

**Solution:**
```yaml
# Stage 1: Plan
- stage: Plan
  jobs:
    - job: TerraformPlan
      steps:
        - script: terraform plan -out=terraform.tfplan
          displayName: 'Generate Plan'

        # Publish artifact
        - task: PublishPipelineArtifact@1
          inputs:
            targetPath: 'infrastructure/terraform/terraform.tfplan'
            artifact: 'terraform-plan'
            publishLocation: 'pipeline'

# Stage 2: Apply
- stage: Apply
  jobs:
    - job: TerraformApply
      steps:
        # Download artifact
        - task: DownloadPipelineArtifact@2
          inputs:
            artifact: 'terraform-plan'
            path: '$(System.DefaultWorkingDirectory)/infrastructure/terraform'

        - script: terraform apply terraform.tfplan
          displayName: 'Apply Plan'
```

## Network and Connectivity

### Issue 1: Cannot Reach Storage Account

**Error:**
```
Error: Error retrieving keys for Storage Account "jobpilottfstate":
storage.AccountsClient#ListKeys: Failure sending request:
StatusCode=0 -- Original Error: Get https://management.azure.com/...:
dial tcp: lookup management.azure.com: no such host
```

**Cause:**
- Network connectivity issues
- Firewall blocking Azure endpoints
- DNS resolution failure

**Solution 1: Check Network**
```bash
# Test connectivity
ping management.azure.com
curl -I https://management.azure.com

# Test storage account
nslookup jobpilottfstate.blob.core.windows.net
```

**Solution 2: Configure Firewall**
```bash
# Allow Azure Management endpoints
# Add to firewall allowlist:
# - *.azure.com
# - *.microsoft.com
# - management.azure.com
# - *.blob.core.windows.net
```

**Solution 3: Use Service Endpoints**
```yaml
# If using self-hosted agent
# Configure virtual network service endpoints
az network vnet subnet update \
  --resource-group agent-rg \
  --vnet-name agent-vnet \
  --name agent-subnet \
  --service-endpoints Microsoft.Storage Microsoft.KeyVault
```

### Issue 2: Private Endpoint Resolution

**Error:**
```
Error: Error making Read request on Azure Storage Account:
dial tcp: lookup jobpilottfstate.privatelink.blob.core.windows.net: no such host
```

**Cause:**
- Private DNS not configured
- Agent not in VNet with private endpoint
- DNS resolution not working

**Solution:**
```bash
# Add private DNS zone
az network private-dns zone create \
  --resource-group shared-rg \
  --name privatelink.blob.core.windows.net

# Link to VNet
az network private-dns link vnet create \
  --resource-group shared-rg \
  --zone-name privatelink.blob.core.windows.net \
  --name storage-dns-link \
  --virtual-network agent-vnet \
  --registration-enabled false

# Add DNS record for private endpoint
az network private-dns record-set a add-record \
  --resource-group shared-rg \
  --zone-name privatelink.blob.core.windows.net \
  --record-set-name jobpilottfstate \
  --ipv4-address <private-ip>
```

## Permission and Access Issues

### Issue 1: Cannot Access Key Vault Secrets

**Error:**
```
Error: Error retrieving Secret "db-password" from Key Vault:
keyvault.BaseClient#GetSecret: Failure responding to request:
StatusCode=403 -- Original Error: Code="Forbidden"
```

**Cause:**
- Service Principal lacks Key Vault permissions
- Access policies not configured
- RBAC not granted

**Solution:**
```bash
# Grant access policy
az keyvault set-policy \
  --name jobpilot-dev-kv \
  --object-id ${SP_OBJECT_ID} \
  --secret-permissions get list

# Or use RBAC
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/${SUB}/resourceGroups/${RG}/providers/Microsoft.KeyVault/vaults/${KV}
```

### Issue 2: Cannot Create Role Assignments

**Error:**
```
Error: authorization.RoleAssignmentsClient#Create: Failure sending request:
StatusCode=403 -- Original Error: Code="AuthorizationFailed"
Message="The client does not have authorization to perform action
'Microsoft.Authorization/roleAssignments/write'"
```

**Cause:**
- Service Principal not User Access Administrator
- Trying to grant higher privileges than owned

**Solution:**
```bash
# Grant User Access Administrator
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "User Access Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}

# Note: Requires subscription Owner or existing UAA role
```

## Performance Problems

### Issue 1: Terraform Plan/Apply Very Slow

**Symptoms:**
- Plan takes > 10 minutes
- Apply takes > 30 minutes
- Pipeline frequently times out

**Causes:**
- Large number of resources
- Complex dependencies
- Inefficient configuration

**Solutions:**

**1. Use Parallelism**
```bash
# Increase parallel operations
terraform apply -parallelism=20  # Default is 10
```

**2. Split Configuration**
```hcl
# Separate into modules
# Deploy independently
./networking/     → Deploy first
./storage/        → Deploy second
./compute/        → Deploy third
./applications/   → Deploy last
```

**3. Use Targeted Applies**
```bash
# Apply only changed resources
terraform apply -target=module.aks
```

**4. Optimize Providers**
```hcl
# Pin provider versions (faster downloads)
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "= 3.85.0"  # Exact version
    }
  }
}
```

**5. Use State Refresh Less Frequently**
```bash
# Skip refresh in plan
terraform plan -refresh=false
```

### Issue 2: State Operations Slow

**Symptoms:**
- `terraform init` takes > 5 minutes
- State locking delays
- Frequent timeouts

**Solutions:**

```bash
# Use local state for testing
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

# Or use faster storage tier
az storage account update \
  --name jobpilottfstate \
  --sku Premium_LRS  # Faster than Standard_LRS
```

## Azure DevOps Specific

### Issue 1: Service Connection Not Verified

**Error:**
```
Failed to authorize the service connection to use the selected Azure subscription
```

**Cause:**
- Service Principal credentials incorrect
- Subscription access revoked
- Service Principal deleted

**Solution:**
```bash
# Test credentials manually
az login --service-principal \
  -u ${CLIENT_ID} \
  -p ${CLIENT_SECRET} \
  --tenant ${TENANT_ID}

# If failed, recreate Service Principal
az ad sp create-for-rbac \
  --name "jobpilot-terraform-sp" \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID}

# Update service connection in Azure DevOps
# Settings → Service connections → Edit → Update credentials
```

### Issue 2: Pipeline Cannot Access Repository

**Error:**
```
remote: Repository not found.
fatal: repository 'https://dev.azure.com/org/project/_git/repo/' not found
```

**Cause:**
- Build service account lacks permissions
- Repository moved/deleted
- Project permissions changed

**Solution:**
```bash
# Grant permissions to Build Service
# Project Settings → Repositories → Select repo
# → Security → Add:
# - [Project] Build Service (org)
# - Grant: Read, Contribute
```

## Debugging Techniques

### Enable Detailed Logging

```bash
# Terraform debug logs
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform-debug.log

terraform plan
terraform apply

# Azure CLI debug
az account show --debug
```

### Use Plan File Inspection

```bash
# Generate plan
terraform plan -out=plan.tfplan

# Inspect in detail
terraform show plan.tfplan

# Convert to JSON for analysis
terraform show -json plan.tfplan | jq '.' > plan.json

# Check specific resource
terraform show -json plan.tfplan | jq '.resource_changes[] | select(.address == "azurerm_kubernetes_cluster.main")'
```

### State Inspection

```bash
# List all resources
terraform state list

# Show specific resource
terraform state show azurerm_resource_group.main

# Pull state locally
terraform state pull > state.json

# Analyze state
cat state.json | jq '.resources[] | {type:.type, name:.name, id:.instances[0].attributes.id}'
```

### Network Debugging

```bash
# Test connectivity from pipeline
- script: |
    echo "Testing Azure connectivity..."
    curl -I https://management.azure.com
    curl -I https://login.microsoftonline.com
    nslookup management.azure.com
    nslookup ${STORAGE_ACCOUNT}.blob.core.windows.net
  displayName: 'Network Diagnostics'
```

### Resource Graph Queries

```bash
# Query Azure resources
az graph query -q "Resources | where type =~ 'Microsoft.ContainerService/managedClusters' | project name, location, resourceGroup"

# Find orphaned resources
az graph query -q "Resources | where tags['ManagedBy'] == 'terraform' and tags['Environment'] == 'dev' | project name, type, resourceGroup"
```

## Getting Help

### Support Channels

1. **Documentation**
   - [Main Setup Guide](./AZURE-DEVOPS-SETUP.md)
   - [Terraform Azure Provider Docs](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
   - [Azure DevOps Pipelines Docs](https://docs.microsoft.com/en-us/azure/devops/pipelines/)

2. **Community Support**
   - [Terraform Community Forum](https://discuss.hashicorp.com/c/terraform-core)
   - [Azure DevOps Community](https://developercommunity.visualstudio.com/spaces/21/index.html)
   - [Stack Overflow - terraform-azure](https://stackoverflow.com/questions/tagged/terraform+azure)

3. **Internal Support**
   - DevOps Team Slack: #devops-support
   - Email: devops@jobpilot.ai
   - Create issue in repository

### Creating Support Tickets

**Include the following:**

1. **Error Message** (complete, unredacted except secrets)
2. **Steps to Reproduce**
3. **Expected vs Actual Behavior**
4. **Environment Details**:
   - Terraform version
   - Azure Provider version
   - Azure DevOps agent type
   - Region
5. **Relevant Configuration** (sanitized)
6. **Debug Logs** (if available)

**Example:**

```markdown
## Issue: Terraform Apply Fails with Permission Error

**Error Message:**
```
Error: authorization.RoleAssignmentsClient#Create: Failure sending request:
StatusCode=403 Code="AuthorizationFailed"
```

**Steps to Reproduce:**
1. Run pipeline: terraform-infrastructure-pipeline
2. Stage: Apply to Dev
3. Step: Terraform Apply

**Expected:** Resources deployed successfully
**Actual:** Permission error

**Environment:**
- Terraform: 1.6.0
- Azure Provider: 3.85.0
- Agent: Microsoft-hosted ubuntu-latest
- Region: eastus

**Configuration:**
[Attach relevant .tf files]

**Debug Logs:**
[Attach TF_LOG=DEBUG output]
```

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** DevOps Team
