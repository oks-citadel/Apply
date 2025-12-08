# Azure DevOps Pipelines Setup Guide
## JobPilot AI Platform

**Organization:** citadelcloudmanagement
**Project:** ApplyPlatform
**Build URL:** https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build

---

## Overview

This guide covers setting up the Azure DevOps CI/CD pipelines for the JobPilot AI Platform, including:

1. **CI/CD Pipeline** - Application build, test, and deployment
2. **Terraform Pipeline** - Infrastructure as Code deployment

---

## Prerequisites

### 1. Azure CLI Setup
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Install Azure DevOps extension
az extension add --name azure-devops

# Configure defaults
az devops configure --defaults \
  organization=https://dev.azure.com/citadelcloudmanagement \
  project=ApplyPlatform
```

### 2. Required Permissions
- **Azure DevOps:** Project Administrator or Build Administrator
- **Azure Subscription:** Contributor role for service principal

---

## Quick Setup

Run the automated setup script:

```bash
chmod +x scripts/setup-azure-pipelines.sh
./scripts/setup-azure-pipelines.sh
```

This will create:
- Variable groups for all environments
- Pipeline definitions
- Environments with approval gates

---

## Manual Setup

### Step 1: Create Service Connection

1. Navigate to: **Project Settings** → **Service connections**
2. Click **New service connection** → **Azure Resource Manager**
3. Select **Service principal (automatic)** or **Service principal (manual)**
4. Configure:
   - **Connection name:** `azure-service-connection`
   - **Subscription:** Select your Azure subscription
   - **Resource group:** (leave empty for subscription-level access)
5. Check **Grant access permission to all pipelines**
6. Click **Save**

### Step 2: Create Variable Groups

Navigate to: **Pipelines** → **Library** → **Variable groups**

#### Common Secrets
| Variable | Description | Secret |
|----------|-------------|--------|
| `DOCKER_USERNAME` | Docker Hub username | No |
| `DOCKER_PASSWORD` | Docker Hub password | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |

#### Terraform Dev (`terraform-dev`)
| Variable | Description | Secret |
|----------|-------------|--------|
| `TF_STATE_RG` | Resource group for state | No |
| `TF_STATE_STORAGE` | Storage account name | No |
| `TF_STATE_CONTAINER` | Container name | No |
| `ARM_CLIENT_ID` | Service principal ID | No |
| `ARM_CLIENT_SECRET` | Service principal secret | Yes |
| `ARM_SUBSCRIPTION_ID` | Azure subscription ID | No |
| `ARM_TENANT_ID` | Azure tenant ID | No |

Create similar groups for `terraform-staging` and `terraform-prod`.

### Step 3: Create Environments

Navigate to: **Pipelines** → **Environments**

Create the following environments:

| Environment | Approvals | Description |
|-------------|-----------|-------------|
| `jobpilot-dev` | None | Development deployment |
| `jobpilot-staging` | Optional | Staging deployment |
| `jobpilot-prod` | Required | Production deployment |
| `jobpilot-destroy` | Required | Infrastructure destruction |

#### Configure Production Approval:
1. Click on `jobpilot-prod`
2. Click **Approvals and checks**
3. Add **Approvals**
4. Configure approvers and timeout

### Step 4: Create Pipelines

Navigate to: **Pipelines** → **New pipeline**

#### CI/CD Pipeline
1. Select **Azure Repos Git**
2. Select **ApplyPlatform** repository
3. Select **Existing Azure Pipelines YAML file**
4. Path: `/azure-pipelines.yml`
5. Click **Continue** → **Save**

#### Terraform Pipeline
1. Create new pipeline
2. Select **Azure Repos Git** → **ApplyPlatform**
3. Select **Existing Azure Pipelines YAML file**
4. Path: `/azure-pipelines-terraform.yml`
5. Click **Continue** → **Save**

---

## Pipeline Descriptions

### CI/CD Pipeline (`azure-pipelines.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Excludes: `docs/**`, `*.md`, `infrastructure/terraform/**`

**Stages:**
1. **Build & Validate** - Install dependencies, lint, type-check
2. **Unit Tests** - Run Jest tests with coverage
3. **Integration Tests** - Run integration test suite
4. **E2E Tests** - Run Playwright E2E tests
5. **Build Docker Images** - Build and push to Docker Hub
6. **Deploy Dev** - Deploy to development (auto on develop branch)
7. **Deploy Staging** - Deploy to staging
8. **Deploy Production** - Deploy to production (manual approval)

### Terraform Pipeline (`azure-pipelines-terraform.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Only for changes in `infrastructure/terraform/**`

**Stages:**
1. **Validate** - fmt check, validate, tflint, checkov
2. **Plan Dev** - Create Terraform plan for dev
3. **Apply Dev** - Apply to development
4. **Plan Staging** - Create Terraform plan for staging
5. **Apply Staging** - Apply to staging
6. **Plan Prod** - Create Terraform plan for production
7. **Apply Prod** - Apply to production (manual approval)
8. **Destroy** - Destroy infrastructure (manual trigger only)

---

## Terraform State Backend

Before running the Terraform pipeline, set up the state backend:

```bash
# Create resource group
az group create \
  --name applyplatform-tfstate-rg \
  --location eastus

# Create storage account
az storage account create \
  --name applyplatformtfstate \
  --resource-group applyplatform-tfstate-rg \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name applyplatformtfstate

# Get storage account key
az storage account keys list \
  --account-name applyplatformtfstate \
  --resource-group applyplatform-tfstate-rg \
  --query '[0].value' -o tsv
```

Add these values to the `terraform-*` variable groups.

---

## Service Principal Setup

Create a service principal for Terraform:

```bash
# Create service principal with Contributor role
az ad sp create-for-rbac \
  --name "jobpilot-terraform-sp" \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID> \
  --sdk-auth

# Output will include:
# - clientId (ARM_CLIENT_ID)
# - clientSecret (ARM_CLIENT_SECRET)
# - subscriptionId (ARM_SUBSCRIPTION_ID)
# - tenantId (ARM_TENANT_ID)
```

Add these values to the variable groups.

---

## Running Pipelines

### Trigger CI/CD Pipeline
```bash
# Push to develop branch
git push origin develop

# Or manually trigger
az pipelines run --name "CI-CD-Pipeline" --branch develop
```

### Trigger Terraform Pipeline
```bash
# Make changes to infrastructure/terraform/
git add infrastructure/terraform/
git commit -m "Update infrastructure"
git push origin develop

# Or manually trigger
az pipelines run --name "Terraform-Infrastructure" --branch develop
```

### Manual Destroy (Emergency Only)
```bash
az pipelines run \
  --name "Terraform-Infrastructure" \
  --branch main \
  --variables DESTROY_INFRASTRUCTURE=true DESTROY_ENVIRONMENT=dev
```

---

## Monitoring Pipelines

### View Pipeline Status
```bash
# List recent runs
az pipelines runs list --top 10

# View specific run
az pipelines runs show --id <RUN_ID>
```

### Pipeline URLs
- **All Builds:** https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build
- **CI/CD Pipeline:** https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build?definitionId=<CI_CD_ID>
- **Terraform Pipeline:** https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build?definitionId=<TF_ID>

---

## Troubleshooting

### Common Issues

#### 1. Service Connection Fails
```
Error: Could not acquire access token
```
**Solution:** Verify service principal credentials in variable group.

#### 2. Terraform State Lock
```
Error: Error locking state
```
**Solution:**
```bash
az storage blob lease break \
  --blob-name dev.terraform.tfstate \
  --container-name tfstate \
  --account-name applyplatformtfstate
```

#### 3. Pipeline Permission Denied
```
Error: Pipeline does not have permission
```
**Solution:** Grant pipeline access to variable groups and service connections.

#### 4. Docker Push Fails
```
Error: unauthorized: authentication required
```
**Solution:** Verify Docker Hub credentials in `common-secrets` variable group.

---

## Security Best Practices

1. **Variable Groups:** Mark sensitive variables as secrets
2. **Service Connections:** Use service principal with minimum required permissions
3. **Approvals:** Require approvals for production deployments
4. **Branch Policies:** Protect main branch with required reviews
5. **Audit Logs:** Enable audit logging for pipeline changes

---

## Next Steps

1. ✅ Create service connection
2. ✅ Configure variable groups with actual values
3. ✅ Set up Terraform state backend
4. ✅ Configure production approval gates
5. ✅ Run first pipeline to validate setup
6. ✅ Monitor and tune pipeline performance

---

*Document generated for JobPilot AI Platform*
*Azure DevOps Organization: citadelcloudmanagement*
