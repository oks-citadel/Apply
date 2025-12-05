# Variable Groups Configuration

Comprehensive guide for configuring and managing Azure DevOps Variable Groups for Terraform deployments.

## Table of Contents

- [Overview](#overview)
- [Variable Groups Structure](#variable-groups-structure)
- [terraform-backend Group](#terraform-backend-group)
- [Environment-Specific Groups](#environment-specific-groups)
- [Application Configuration Groups](#application-configuration-groups)
- [Secret Management](#secret-management)
- [Variable Naming Conventions](#variable-naming-conventions)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Variable Groups in Azure DevOps centralize configuration management across pipelines. They provide:

- **Centralized Management**: Single source of truth for configuration
- **Environment Isolation**: Separate configs for dev/staging/prod
- **Secret Protection**: Secure storage with encryption
- **Reusability**: Share variables across multiple pipelines
- **Version Control**: Track changes to configuration
- **Key Vault Integration**: Link directly to Azure Key Vault secrets

## Variable Groups Structure

```
Variable Groups
├── terraform-backend (Global)
│   ├── Azure credentials
│   └── Backend storage config
├── terraform-dev
│   ├── Environment: dev
│   └── Dev-specific config
├── terraform-staging
│   ├── Environment: staging
│   └── Staging-specific config
├── terraform-prod
│   ├── Environment: prod
│   └── Production-specific config
├── application-secrets (Optional)
│   └── Application credentials
└── feature-flags (Optional)
    └── Feature toggles
```

## terraform-backend Group

**Purpose**: Authentication and state management for Terraform

**Scope**: Global - used by all environments

### Variables

| Variable Name | Type | Description | Example Value |
|---------------|------|-------------|---------------|
| `ARM_CLIENT_ID` | Secret | Service Principal Application ID | `12345678-1234-1234-1234-123456789abc` |
| `ARM_CLIENT_SECRET` | Secret | Service Principal Password | `xxx~xxxxxxxxxxxxxxxxxxxxxxxxx` |
| `ARM_SUBSCRIPTION_ID` | Plain | Azure Subscription ID | `87654321-4321-4321-4321-cba987654321` |
| `ARM_TENANT_ID` | Plain | Azure Active Directory Tenant ID | `abcdef12-3456-7890-abcd-ef1234567890` |
| `TF_STATE_STORAGE_ACCOUNT` | Plain | Storage account for state files | `jobpilottfstate1234567` |
| `TF_STATE_CONTAINER` | Plain | Blob container name | `tfstate` |
| `TF_STATE_RESOURCE_GROUP` | Plain | Resource group for state storage | `jobpilot-terraform-state-rg` |
| `TF_STATE_ACCESS_KEY` | Secret | Storage account access key | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

### Setup Methods

#### Method 1: Link to Azure Key Vault (Recommended)

```bash
# Prerequisites: Key Vault created with secrets
KEY_VAULT_NAME="jobpilot-kv-12345"

# Secrets should be named in Key Vault:
# - ARM-CLIENT-ID
# - ARM-CLIENT-SECRET
# - ARM-SUBSCRIPTION-ID
# - ARM-TENANT-ID
# - TF-STATE-STORAGE-ACCOUNT
# - TF-STATE-CONTAINER
# - TF-STATE-RESOURCE-GROUP
# - TF-STATE-ACCESS-KEY
```

**In Azure DevOps:**
1. Navigate to Pipelines → Library → Variable groups
2. Click **+ Variable group**
3. Name: `terraform-backend`
4. Description: `Terraform authentication and backend configuration`
5. Toggle **Link secrets from an Azure key vault as variables**
6. Select subscription and authorize
7. Select Key Vault: `jobpilot-kv-12345`
8. Click **+ Add** and map each variable:
   - Variable name: `ARM_CLIENT_ID` → Key Vault secret: `ARM-CLIENT-ID`
   - Variable name: `ARM_CLIENT_SECRET` → Key Vault secret: `ARM-CLIENT-SECRET`
   - (Continue for all variables)
9. Save

**Advantages:**
- Automatic secret rotation
- Centralized secret management
- Audit logging
- Access control via Key Vault policies

#### Method 2: Manual Entry

**In Azure DevOps:**
1. Navigate to Pipelines → Library → Variable groups
2. Click **+ Variable group**
3. Name: `terraform-backend`
4. Add each variable manually
5. Click lock icon for sensitive values
6. Save

**Disadvantages:**
- Manual rotation required
- Less audit visibility
- Secrets stored in Azure DevOps database

### Usage in Pipeline

```yaml
variables:
  - group: terraform-backend

steps:
  - script: |
      terraform init \
        -backend-config="storage_account_name=$(TF_STATE_STORAGE_ACCOUNT)" \
        -backend-config="container_name=$(TF_STATE_CONTAINER)" \
        -backend-config="key=$(TF_ENVIRONMENT).tfstate" \
        -backend-config="resource_group_name=$(TF_STATE_RESOURCE_GROUP)" \
        -backend-config="access_key=$(TF_STATE_ACCESS_KEY)"
    displayName: 'Terraform Init'
    env:
      ARM_CLIENT_ID: $(ARM_CLIENT_ID)
      ARM_CLIENT_SECRET: $(ARM_CLIENT_SECRET)
      ARM_SUBSCRIPTION_ID: $(ARM_SUBSCRIPTION_ID)
      ARM_TENANT_ID: $(ARM_TENANT_ID)
```

## Environment-Specific Groups

### terraform-dev

**Purpose**: Development environment configuration

**Scope**: Development deployments only

#### Infrastructure Variables

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `TF_ENVIRONMENT` | `dev` | Plain | Environment identifier |
| `TF_WORKSPACE` | `dev` | Plain | Terraform workspace name |
| `AZURE_LOCATION` | `eastus` | Plain | Primary Azure region |
| `AZURE_LOCATION_SECONDARY` | `westus` | Plain | Secondary region (DR) |
| `RESOURCE_GROUP_PREFIX` | `jobpilot-dev` | Plain | Resource naming prefix |

#### Compute Variables

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `AKS_NODE_COUNT` | `2` | Plain | Initial node count |
| `AKS_NODE_VM_SIZE` | `Standard_D2s_v3` | Plain | VM size for nodes |
| `AKS_MIN_NODE_COUNT` | `1` | Plain | Min nodes (autoscaling) |
| `AKS_MAX_NODE_COUNT` | `5` | Plain | Max nodes (autoscaling) |
| `ENABLE_AUTO_SCALING` | `true` | Plain | Enable cluster autoscaler |

#### Storage Variables

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `ACR_SKU` | `Basic` | Plain | Container Registry SKU |
| `STORAGE_ACCOUNT_TIER` | `Standard` | Plain | Storage performance tier |
| `STORAGE_REPLICATION` | `LRS` | Plain | Replication strategy |

#### Database Variables

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `COSMOS_THROUGHPUT` | `400` | Plain | RU/s for Cosmos DB |
| `COSMOS_CONSISTENCY` | `Session` | Plain | Consistency level |
| `POSTGRES_SKU` | `B_Gen5_1` | Plain | PostgreSQL SKU |
| `POSTGRES_STORAGE_MB` | `51200` | Plain | Storage size (50GB) |

#### Monitoring Variables

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `APP_INSIGHTS_ENABLED` | `true` | Plain | Enable Application Insights |
| `LOG_ANALYTICS_RETENTION` | `30` | Plain | Log retention days |
| `ENABLE_DIAGNOSTIC_LOGS` | `true` | Plain | Enable diagnostics |

#### Cost Optimization

| Variable Name | Value | Type | Description |
|---------------|-------|------|-------------|
| `ENABLE_COST_ALERTS` | `true` | Plain | Enable budget alerts |
| `MONTHLY_BUDGET_USD` | `500` | Plain | Monthly budget limit |
| `AUTO_SHUTDOWN_VMS` | `true` | Plain | Auto-shutdown after hours |

### terraform-staging

**Purpose**: Staging environment configuration

**Scope**: Pre-production testing

#### Key Differences from Dev

| Variable | Dev Value | Staging Value | Reason |
|----------|-----------|---------------|--------|
| `TF_ENVIRONMENT` | `dev` | `staging` | Environment ID |
| `AKS_NODE_COUNT` | `2` | `3` | Higher availability |
| `AKS_NODE_VM_SIZE` | `Standard_D2s_v3` | `Standard_D4s_v3` | Production-like sizing |
| `ACR_SKU` | `Basic` | `Standard` | Geo-replication support |
| `COSMOS_THROUGHPUT` | `400` | `1000` | Performance testing |
| `POSTGRES_SKU` | `B_Gen5_1` | `GP_Gen5_2` | Production parity |
| `STORAGE_REPLICATION` | `LRS` | `GRS` | Geographic redundancy |
| `MONTHLY_BUDGET_USD` | `500` | `1500` | Higher capacity |

#### Complete Variable List

```yaml
# terraform-staging variable group
TF_ENVIRONMENT: staging
TF_WORKSPACE: staging
AZURE_LOCATION: eastus
AZURE_LOCATION_SECONDARY: westus
RESOURCE_GROUP_PREFIX: jobpilot-staging

# Compute
AKS_NODE_COUNT: 3
AKS_NODE_VM_SIZE: Standard_D4s_v3
AKS_MIN_NODE_COUNT: 2
AKS_MAX_NODE_COUNT: 8
ENABLE_AUTO_SCALING: true

# Storage
ACR_SKU: Standard
STORAGE_ACCOUNT_TIER: Standard
STORAGE_REPLICATION: GRS

# Database
COSMOS_THROUGHPUT: 1000
COSMOS_CONSISTENCY: Session
POSTGRES_SKU: GP_Gen5_2
POSTGRES_STORAGE_MB: 102400

# Monitoring
APP_INSIGHTS_ENABLED: true
LOG_ANALYTICS_RETENTION: 60
ENABLE_DIAGNOSTIC_LOGS: true

# Cost
MONTHLY_BUDGET_USD: 1500
ENABLE_COST_ALERTS: true
```

### terraform-prod

**Purpose**: Production environment configuration

**Scope**: Production deployments

#### Production-Specific Variables

| Variable | Value | Type | Description |
|----------|-------|------|-------------|
| `TF_ENVIRONMENT` | `prod` | Plain | Environment ID |
| `TF_WORKSPACE` | `prod` | Plain | Workspace name |
| `AZURE_LOCATION` | `eastus` | Plain | Primary region |
| `AZURE_LOCATION_SECONDARY` | `westus2` | Plain | DR region |
| `ENABLE_MULTI_REGION` | `true` | Plain | Multi-region deployment |

#### High Availability Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `AKS_NODE_COUNT` | `5` | Production node count |
| `AKS_NODE_VM_SIZE` | `Standard_D8s_v3` | Production VM size |
| `AKS_MIN_NODE_COUNT` | `3` | Minimum for HA |
| `AKS_MAX_NODE_COUNT` | `20` | Peak capacity |
| `ENABLE_AUTO_SCALING` | `true` | Autoscaling enabled |
| `ENABLE_AVAILABILITY_ZONES` | `true` | Zone redundancy |
| `ZONES` | `["1","2","3"]` | All availability zones |

#### Premium Resources

| Variable | Value | Description |
|----------|-------|-------------|
| `ACR_SKU` | `Premium` | Premium registry |
| `STORAGE_REPLICATION` | `GZRS` | Geo-zone redundant |
| `COSMOS_THROUGHPUT` | `10000` | Production throughput |
| `COSMOS_CONSISTENCY` | `Strong` | Strong consistency |
| `POSTGRES_SKU` | `MO_Gen5_4` | Memory-optimized |
| `POSTGRES_STORAGE_MB` | `512000` | 500GB storage |
| `ENABLE_POSTGRES_REPLICA` | `true` | Read replicas |

#### Security & Compliance

| Variable | Value | Description |
|----------|-------|-------------|
| `ENABLE_PRIVATE_ENDPOINTS` | `true` | Private connectivity |
| `ENABLE_NETWORK_POLICIES` | `true` | Network segmentation |
| `ENABLE_DEFENDER` | `true` | Azure Defender |
| `ENABLE_BACKUP` | `true` | Automated backups |
| `BACKUP_RETENTION_DAYS` | `35` | Backup retention |
| `ENABLE_ENCRYPTION_AT_REST` | `true` | Data encryption |
| `ENABLE_TLS_ONLY` | `true` | Force TLS 1.2+ |

#### Monitoring & Alerting

| Variable | Value | Description |
|----------|-------|-------------|
| `LOG_ANALYTICS_RETENTION` | `90` | 90-day retention |
| `ENABLE_ADVANCED_MONITORING` | `true` | Enhanced monitoring |
| `ALERT_EMAIL` | `ops@jobpilot.ai` | Alert recipients |
| `ENABLE_PAGER_DUTY` | `true` | PagerDuty integration |

#### Cost Management

| Variable | Value | Description |
|----------|-------|-------------|
| `MONTHLY_BUDGET_USD` | `10000` | Production budget |
| `ENABLE_COST_ALERTS` | `true` | Budget alerts |
| `COST_ALERT_THRESHOLDS` | `[50,75,90,100]` | Alert percentages |

## Application Configuration Groups

### application-secrets (Optional)

**Purpose**: Application-level secrets and credentials

**Scope**: All environments (with environment-specific values)

| Variable | Type | Description |
|----------|------|-------------|
| `OPENAI_API_KEY` | Secret | OpenAI API key |
| `JWT_SECRET` | Secret | JWT signing secret |
| `DATABASE_PASSWORD` | Secret | Database password |
| `REDIS_PASSWORD` | Secret | Redis password |
| `SMTP_PASSWORD` | Secret | Email service password |
| `STRIPE_SECRET_KEY` | Secret | Payment gateway key |

**Best Practice**: Create separate groups per environment:
- `application-secrets-dev`
- `application-secrets-staging`
- `application-secrets-prod`

### feature-flags (Optional)

**Purpose**: Feature toggle management

| Variable | Dev | Staging | Prod | Description |
|----------|-----|---------|------|-------------|
| `FEATURE_AI_RESUME_PARSER` | `true` | `true` | `true` | AI resume parsing |
| `FEATURE_BETA_JOB_MATCHING` | `true` | `true` | `false` | Beta algorithm |
| `FEATURE_ADVANCED_ANALYTICS` | `true` | `false` | `false` | Analytics dashboard |
| `FEATURE_PREMIUM_TIER` | `false` | `true` | `true` | Premium features |

## Secret Management

### Key Vault Integration

**Setup:**

1. Create Azure Key Vault per environment:
```bash
# Dev Key Vault
az keyvault create \
  --name jobpilot-kv-dev \
  --resource-group jobpilot-dev-rg \
  --location eastus

# Add secrets
az keyvault secret set \
  --vault-name jobpilot-kv-dev \
  --name "DATABASE-PASSWORD" \
  --value "secure-password"
```

2. Grant Azure DevOps access:
```bash
# Get service principal object ID
SP_ID=$(az ad sp list --display-name "azure-terraform-connection" --query "[0].objectId" -o tsv)

# Grant permissions
az keyvault set-policy \
  --name jobpilot-kv-dev \
  --object-id ${SP_ID} \
  --secret-permissions get list
```

3. Link in Variable Group:
- Variable name in Azure DevOps: `DATABASE_PASSWORD`
- Key Vault secret name: `DATABASE-PASSWORD`

### Secret Rotation

**Quarterly Rotation Schedule:**

| Secret | Rotation Frequency | Owner |
|--------|-------------------|-------|
| Service Principal | Every 6 months | DevOps Team |
| Database Passwords | Every 90 days | DBA Team |
| API Keys | Every 90 days | Dev Team |
| Certificates | Before expiration | Security Team |

**Rotation Process:**

1. Create new secret in Key Vault
2. Test with staging environment
3. Update production
4. Verify all services
5. Remove old secret after 7 days

### Secret Naming Conventions

**Key Vault Secrets** (kebab-case):
- `ARM-CLIENT-SECRET`
- `DATABASE-PASSWORD-DEV`
- `OPENAI-API-KEY-PROD`

**Variable Group Variables** (UPPER_SNAKE_CASE):
- `ARM_CLIENT_SECRET`
- `DATABASE_PASSWORD`
- `OPENAI_API_KEY`

## Variable Naming Conventions

### Prefixes

| Prefix | Purpose | Example |
|--------|---------|---------|
| `TF_` | Terraform-specific | `TF_ENVIRONMENT`, `TF_WORKSPACE` |
| `AZURE_` | Azure resources | `AZURE_LOCATION`, `AZURE_SUBSCRIPTION` |
| `ARM_` | Azure Resource Manager | `ARM_CLIENT_ID`, `ARM_TENANT_ID` |
| `AKS_` | Kubernetes cluster | `AKS_NODE_COUNT`, `AKS_VERSION` |
| `ACR_` | Container registry | `ACR_SKU`, `ACR_NAME` |
| `ENABLE_` | Feature flags | `ENABLE_AUTO_SCALING`, `ENABLE_BACKUP` |

### Format Standards

- **Plain text variables**: `UPPER_SNAKE_CASE`
- **Boolean values**: `true` / `false` (lowercase)
- **Numbers**: No quotes (`2` not `"2"`)
- **Lists**: JSON array format (`["1","2","3"]`)
- **Objects**: JSON object format

## Best Practices

### 1. Environment Isolation

- Never share variable groups between environments
- Use separate Key Vaults per environment
- Implement strict access controls

### 2. Least Privilege

```yaml
# Grant minimal permissions
Developers → Read access to dev variable groups
DevOps Team → Administrator access to all groups
Production Approvers → Read access to prod groups
```

### 3. Audit Logging

Enable audit logs for variable group changes:
- Who made changes
- What was changed
- When changes occurred
- Pipeline execution logs

### 4. Version Control

Document changes in Git:

```bash
# Create documentation for variable changes
docs/variable-groups/
├── CHANGELOG.md
├── current-values.md
└── migration-guides/
```

### 5. Validation

Add validation in pipeline:

```yaml
- script: |
    # Verify required variables exist
    if [ -z "$(TF_ENVIRONMENT)" ]; then
      echo "ERROR: TF_ENVIRONMENT not set"
      exit 1
    fi
  displayName: 'Validate Variables'
```

### 6. Documentation

Maintain variable documentation:

```markdown
# Variable: AKS_NODE_COUNT
- **Purpose**: Initial node count for AKS cluster
- **Type**: Integer
- **Valid Range**: 1-100
- **Default**: 3
- **Environment Values**:
  - Dev: 2
  - Staging: 3
  - Prod: 5
```

### 7. Change Management

**For Production Variables:**
1. Create change request
2. Document impact analysis
3. Get approval
4. Update during maintenance window
5. Monitor post-change

### 8. Backup

Export variable groups regularly:

```bash
# Using Azure DevOps CLI
az pipelines variable-group list \
  --organization https://dev.azure.com/your-org \
  --project your-project \
  --output json > variable-groups-backup.json
```

## Troubleshooting

### Issue: Variables Not Available in Pipeline

**Solution:**
1. Verify variable group is linked in pipeline YAML
2. Check variable group permissions
3. Confirm variable names match exactly (case-sensitive)

```yaml
# Correct
variables:
  - group: terraform-backend

# Wrong
variables:
  - group: Terraform-Backend  # Case mismatch
```

### Issue: Key Vault Secrets Not Syncing

**Solution:**
1. Verify service connection has Key Vault permissions
2. Check secret names match exactly
3. Refresh variable group

```bash
# Grant permissions
az keyvault set-policy \
  --name your-keyvault \
  --object-id ${SP_ID} \
  --secret-permissions get list
```

### Issue: Variable Override Not Working

**Pipeline variables override order:**
1. Runtime parameters (highest)
2. Pipeline variables
3. Variable group variables
4. System variables (lowest)

### Issue: Secret Values Visible in Logs

**Solution:**
1. Ensure variable is marked as secret
2. Add `##vso[task.setvariable variable=name;issecret=true]value`
3. Avoid echoing secret variables

```yaml
# Bad - exposes secret
- script: echo $(ARM_CLIENT_SECRET)

# Good - secret hidden
- script: |
    echo "##vso[task.setvariable variable=MY_SECRET;issecret=true]$(ARM_CLIENT_SECRET)"
```

## Additional Resources

- [Azure DevOps Variable Groups Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups)
- [Azure Key Vault Integration](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups#link-secrets)
- [Main Setup Guide](./AZURE-DEVOPS-SETUP.md)
- [Security Best Practices](./SECURITY-BEST-PRACTICES.md)

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** DevOps Team
