# Azure DevOps Pipeline - Terraform Deployment

This directory contains a comprehensive Azure DevOps Pipeline configuration for deploying the JobPilot AI Platform infrastructure using Terraform.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Pipeline Configuration](#pipeline-configuration)
- [Environment Setup](#environment-setup)
- [Security Scanning](#security-scanning)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## Overview

The pipeline provides a complete CI/CD solution for infrastructure deployment with:

- **Multi-stage deployment**: Validate → Plan → Apply
- **Environment isolation**: Separate state files for dev, staging, and prod
- **Security scanning**: Integrated tfsec and Checkov
- **Manual approval gates**: Required for staging and production
- **Artifact management**: Plan files stored for audit trail
- **Automated testing**: Format checks and validation

## Architecture

### Pipeline Stages

```
┌─────────────┐
│  Validate   │  - Format check
│             │  - Syntax validation
│             │  - Security scanning (tfsec, Checkov)
└─────┬───────┘
      │
      ├─────────────────────────┬─────────────────────────┐
      │                         │                         │
┌─────▼────────┐          ┌────▼─────────┐         ┌────▼──────────┐
│  Plan Dev    │          │ Plan Staging │         │  Plan Prod    │
│              │          │              │         │               │
└─────┬────────┘          └────┬─────────┘         └────┬──────────┘
      │                        │                        │
┌─────▼────────┐          ┌────▼─────────┐         ┌────▼──────────┐
│  Apply Dev   │          │Apply Staging │         │  Apply Prod   │
│              │          │   (Approval) │         │  (Approval)   │
└──────────────┘          └──────────────┘         └───────────────┘
```

### File Structure

```
infrastructure/terraform/
├── azure-pipelines-terraform.yml    # Main pipeline configuration
├── environments/
│   ├── dev.tfvars                   # Development variables
│   ├── staging.tfvars               # Staging variables
│   └── prod.tfvars                  # Production variables
├── scripts/
│   ├── terraform-init.sh            # Initialize Terraform
│   ├── terraform-plan.sh            # Generate execution plan
│   └── terraform-apply.sh           # Apply infrastructure changes
├── .tfsec.yml                       # Security scanning config (tfsec)
├── .checkov.yaml                    # Security scanning config (Checkov)
└── PIPELINE-README.md               # This file
```

## Prerequisites

### Azure Resources

1. **Azure Storage Account** for Terraform backend:
   ```bash
   # Create resource group
   az group create \
     --name jobpilot-terraform-backend \
     --location eastus

   # Create storage account
   az storage account create \
     --name jobpilotterraform \
     --resource-group jobpilot-terraform-backend \
     --location eastus \
     --sku Standard_LRS \
     --encryption-services blob

   # Create container
   az storage container create \
     --name tfstate \
     --account-name jobpilotterraform
   ```

2. **Azure Service Principal** for authentication:
   ```bash
   # Create service principal
   az ad sp create-for-rbac \
     --name jobpilot-terraform-sp \
     --role Contributor \
     --scopes /subscriptions/{subscription-id}

   # Save the output:
   # - appId (ARM_CLIENT_ID)
   # - password (ARM_CLIENT_SECRET)
   # - tenant (ARM_TENANT_ID)
   ```

### Azure DevOps Setup

1. **Variable Groups**

   Create two variable groups in Azure DevOps:

   **Variable Group: `terraform-backend`**
   ```yaml
   BACKEND_STORAGE_ACCOUNT: jobpilotterraform
   BACKEND_CONTAINER_NAME: tfstate
   BACKEND_RESOURCE_GROUP: jobpilot-terraform-backend
   ```

   **Variable Group: `terraform-credentials`** (Mark as secret)
   ```yaml
   ARM_CLIENT_ID: <service-principal-app-id>
   ARM_CLIENT_SECRET: <service-principal-password>  # Secret
   ARM_SUBSCRIPTION_ID: <azure-subscription-id>
   ARM_TENANT_ID: <azure-tenant-id>
   SQL_ADMIN_USERNAME: <sql-admin-username>         # Secret
   SQL_ADMIN_PASSWORD_DEV: <dev-sql-password>       # Secret
   SQL_ADMIN_PASSWORD_STAGING: <staging-password>   # Secret
   SQL_ADMIN_PASSWORD_PROD: <prod-password>         # Secret
   ```

2. **Environments**

   Create three environments in Azure DevOps:

   - **dev**: No approvals required
   - **staging**: Optional approvals
   - **prod**: Mandatory approvals required

   Configure approvals:
   ```
   Azure DevOps → Pipelines → Environments → prod → Approvals and checks
   - Add "Approvals" check
   - Add required approvers
   - Set timeout (24 hours recommended)
   ```

3. **Service Connections**

   - Azure Resource Manager service connection
   - Ensure it has Contributor access to the subscription

## Pipeline Configuration

### Triggers

The pipeline triggers on:

- **Branches**: `main` and `develop`
- **Paths**: Any changes to `infrastructure/terraform/**`
- **Pull Requests**: To `main` or `develop` branches

### Branch Strategy

- **develop**: Deploys to dev environment
- **main**: Deploys to staging → production (with approvals)

### Environment Mapping

| Branch  | Environment | Auto-Deploy | Approval Required |
|---------|-------------|-------------|-------------------|
| develop | dev         | Yes         | No                |
| main    | staging     | Yes         | Optional          |
| main    | prod        | Yes         | **Required**      |

## Environment Setup

### Development Environment

**Characteristics:**
- Cost-optimized with basic SKUs
- No private endpoints
- No AKS cluster
- Single instance (no auto-scaling)
- Public access allowed for testing

**Variables:** `environments/dev.tfvars`

**Estimated Cost:** ~$150-200/month

### Staging Environment

**Characteristics:**
- Production-like configuration
- AKS cluster enabled
- Application Gateway with WAF
- Auto-scaling enabled (2-5 instances)
- Standard SKUs

**Variables:** `environments/staging.tfvars`

**Estimated Cost:** ~$600-800/month

### Production Environment

**Characteristics:**
- Premium SKUs for performance
- AKS with multi-zone deployment
- Private endpoints for all services
- Application Gateway with WAF (Prevention mode)
- Aggressive auto-scaling (3-10 instances)
- Azure Defender enabled
- Comprehensive security

**Variables:** `environments/prod.tfvars`

**Estimated Cost:** ~$2,000-3,500/month

## Security Scanning

### tfsec

Static analysis tool for Terraform security issues.

**Configuration:** `.tfsec.yml`

**Key Features:**
- Identifies security misconfigurations
- Checks Azure best practices
- Custom severity levels
- JUnit output for Azure DevOps

**Example Checks:**
- Storage account HTTPS enforcement
- SQL Server threat detection
- Key Vault network restrictions
- App Service authentication

### Checkov

Comprehensive security and compliance scanner.

**Configuration:** `.checkov.yaml`

**Key Features:**
- 1000+ built-in policies
- CIS Azure Foundations Benchmark
- Secrets detection
- Custom policy support

**Example Checks:**
- CKV_AZURE_23: SQL Server auditing
- CKV_AZURE_109: Key Vault firewall
- CKV_AZURE_113: SQL Server AD admin
- CKV_AZURE_137: Container Registry security

### Security Scan Results

Both tools generate JUnit XML output published to Azure DevOps:
- View in "Tests" tab of pipeline run
- Track security improvements over time
- Fail builds on critical issues (configurable)

## Usage

### Running the Pipeline

1. **Commit changes** to Terraform code
2. **Push to branch**:
   ```bash
   git add .
   git commit -m "Update infrastructure configuration"
   git push origin develop  # For dev deployment
   git push origin main     # For staging/prod deployment
   ```
3. **Monitor pipeline** in Azure DevOps
4. **Review plan** before approval (staging/prod)
5. **Approve deployment** (if required)

### Manual Pipeline Trigger

```bash
# In Azure DevOps
Pipelines → Select pipeline → Run pipeline
- Select branch
- Optionally override variables
- Run
```

### Local Testing

Before committing, test locally:

```bash
# Initialize Terraform
cd infrastructure/terraform
bash scripts/terraform-init.sh dev

# Run security scans
tfsec .
checkov -d . --config-file .checkov.yaml

# Format check
terraform fmt -check -recursive

# Validate syntax
terraform validate

# Generate plan
bash scripts/terraform-plan.sh dev

# Review plan
terraform show tfplan-dev
```

## Troubleshooting

### Common Issues

#### 1. "Backend initialization failed"

**Cause:** Missing or incorrect backend configuration

**Solution:**
```bash
# Verify storage account exists
az storage account show \
  --name jobpilotterraform \
  --resource-group jobpilot-terraform-backend

# Verify container exists
az storage container show \
  --name tfstate \
  --account-name jobpilotterraform

# Check service principal permissions
az role assignment list \
  --assignee <service-principal-app-id> \
  --subscription <subscription-id>
```

#### 2. "Authentication failed"

**Cause:** Invalid or expired service principal credentials

**Solution:**
```bash
# Test authentication
az login --service-principal \
  --username $ARM_CLIENT_ID \
  --password $ARM_CLIENT_SECRET \
  --tenant $ARM_TENANT_ID

# Reset service principal password if needed
az ad sp credential reset \
  --id <service-principal-app-id>
```

#### 3. "Plan file not found"

**Cause:** Plan stage failed or artifact not published

**Solution:**
- Check Plan stage logs for errors
- Verify artifact was published successfully
- Re-run Plan stage if needed

#### 4. "Security scan failures"

**Cause:** Code doesn't meet security standards

**Solution:**
- Review tfsec/Checkov output
- Fix critical and high severity issues
- Update `.tfsec.yml` or `.checkov.yaml` to exclude non-critical checks
- Document exceptions in code comments

#### 5. "Approval timeout"

**Cause:** Deployment approval not provided within timeout period

**Solution:**
- Extend approval timeout in environment settings
- Notify approvers via Teams/email
- Re-run pipeline after timeout

### Debug Mode

Enable detailed logging:

```yaml
# Add to pipeline variables
variables:
  - name: TF_LOG
    value: DEBUG
  - name: system.debug
    value: true
```

### State Lock Issues

If state is locked:

```bash
# Force unlock (use with caution)
terraform force-unlock <lock-id>

# Or wait for lock to expire (usually 20 minutes)
```

### Rollback Procedure

If deployment fails:

1. **Review error logs** in Azure DevOps
2. **Identify failed resources** in Terraform output
3. **Manual rollback** (if needed):
   ```bash
   # Revert code changes
   git revert <commit-hash>
   git push

   # Or manually fix in Azure Portal
   # Then import into Terraform state
   terraform import <resource> <azure-resource-id>
   ```

## Best Practices

1. **Always review plan** before approving
2. **Test in dev** before promoting to staging/prod
3. **Use pull requests** for infrastructure changes
4. **Document exceptions** for security scan exclusions
5. **Rotate credentials** regularly
6. **Monitor costs** in Azure Cost Management
7. **Enable logging** for all resources
8. **Use managed identities** where possible
9. **Keep Terraform version** consistent
10. **Back up state files** regularly

## Monitoring

### Pipeline Metrics

Monitor in Azure DevOps:
- Pipeline success rate
- Deployment frequency
- Mean time to recovery (MTTR)
- Security scan trends

### Infrastructure Metrics

Monitor in Azure:
- Resource costs
- Performance metrics
- Security alerts
- Compliance status

## Support

For issues or questions:

1. Check this README
2. Review pipeline logs
3. Consult Terraform documentation
4. Contact DevOps team

## References

- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure DevOps Pipelines](https://docs.microsoft.com/azure/devops/pipelines/)
- [tfsec Documentation](https://aquasecurity.github.io/tfsec/)
- [Checkov Documentation](https://www.checkov.io/)
- [Azure Security Best Practices](https://docs.microsoft.com/azure/security/fundamentals/best-practices-and-patterns)
