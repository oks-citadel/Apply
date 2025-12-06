# JobPilot AI Platform - Terraform Infrastructure

Infrastructure as Code (IaC) for the JobPilot AI Platform using Terraform on Azure with Azure DevOps CI/CD pipelines.

## Overview

This directory contains Terraform configurations for deploying and managing the complete Azure infrastructure for the JobPilot AI Platform, including:

- **Azure Kubernetes Service (AKS)** - Container orchestration
- **Azure Container Registry (ACR)** - Private container images
- **Azure Cosmos DB** - NoSQL database for document storage
- **Azure PostgreSQL** - Relational database
- **Azure Storage** - Blob storage for files and logs
- **Azure Key Vault** - Secrets management
- **Azure Monitor** - Logging and monitoring
- **Virtual Networks** - Network isolation and security
- **Application Gateway** - Load balancing and WAF

## Quick Start

### Prerequisites

- Azure subscription (with Owner or Contributor role)
- Azure DevOps organization and project
- Azure CLI installed (`az --version`)
- Terraform >= 1.5.0 installed (`terraform --version`)
- Git for version control

### Local Development Setup

1. **Clone Repository**
   ```bash
   git clone https://dev.azure.com/your-org/JobPilot/_git/Job-Apply-Platform
   cd Job-Apply-Platform/infrastructure/terraform
   ```

2. **Configure Azure Authentication**
   ```bash
   # Login to Azure
   az login

   # Set subscription
   az account set --subscription "YOUR_SUBSCRIPTION_NAME"

   # Verify
   az account show
   ```

3. **Set Environment Variables**
   ```bash
   # Create .env file (DO NOT commit!)
   cat > .env <<EOF
   export ARM_CLIENT_ID="your-service-principal-id"
   export ARM_CLIENT_SECRET="your-service-principal-secret"
   export ARM_SUBSCRIPTION_ID="your-subscription-id"
   export ARM_TENANT_ID="your-tenant-id"
   export TF_VAR_environment="dev"
   EOF

   # Load variables
   source .env
   ```

4. **Initialize Terraform**
   ```bash
   # Initialize with remote backend
   terraform init \
     -backend-config="storage_account_name=jobpilottfstate" \
     -backend-config="container_name=tfstate" \
     -backend-config="key=dev.tfstate"
   ```

5. **Review and Apply**
   ```bash
   # Select workspace
   terraform workspace select dev || terraform workspace new dev

   # Review plan
   terraform plan -var-file="environments/dev/terraform.tfvars"

   # Apply changes
   terraform apply -var-file="environments/dev/terraform.tfvars"
   ```

### Azure DevOps CI/CD Setup

For production deployments, use Azure DevOps pipelines instead of local deployment.

**Complete setup guide:** [Azure DevOps Setup Guide](./docs/AZURE-DEVOPS-SETUP.md)

**Quick setup steps:**
1. Create Service Principal
2. Configure backend storage
3. Create variable groups
4. Set up service connections
5. Configure environments (dev/staging/prod)
6. Import pipeline

See the [Azure DevOps Setup Guide](./docs/AZURE-DEVOPS-SETUP.md) for detailed instructions.

## Project Structure

```
infrastructure/terraform/
├── README.md                    # This file
├── main.tf                      # Main infrastructure resources
├── variables.tf                 # Input variable definitions
├── outputs.tf                   # Output value definitions
├── locals.tf                    # Local values and computed variables
├── backend.tf                   # Remote state configuration
├── versions.tf                  # Provider version constraints
│
├── environments/                # Environment-specific configurations
│   ├── dev/
│   │   └── terraform.tfvars     # Development environment values
│   ├── staging/
│   │   └── terraform.tfvars     # Staging environment values
│   └── prod/
│       └── terraform.tfvars     # Production environment values
│
├── modules/                     # Reusable Terraform modules
│   ├── aks/                     # Azure Kubernetes Service
│   ├── networking/              # Virtual networks and subnets
│   ├── storage/                 # Storage accounts
│   ├── database/                # Cosmos DB and PostgreSQL
│   ├── monitoring/              # Application Insights, Log Analytics
│   └── security/                # Key Vault, NSGs
│
└── docs/                        # Comprehensive documentation
    ├── AZURE-DEVOPS-SETUP.md    # Azure DevOps setup guide
    ├── VARIABLE-GROUPS.md       # Variable groups configuration
    ├── SERVICE-CONNECTIONS.md   # Service connections guide
    ├── ENVIRONMENTS.md          # Environment configuration
    ├── SECURITY-BEST-PRACTICES.md # Security guidelines
    └── TROUBLESHOOTING.md       # Common issues and solutions
```

## Environments

The infrastructure supports three environments with progressive security controls:

### Development (dev)
- **Purpose**: Active development and feature testing
- **Resources**: Minimal/cost-optimized
- **Deployment**: Automatic on push to develop branch
- **Approvals**: None
- **Access**: All developers

### Staging (staging)
- **Purpose**: Pre-production validation and testing
- **Resources**: Production-like sizing
- **Deployment**: Manual trigger or PR to main
- **Approvals**: 1 technical reviewer
- **Access**: Senior developers and DevOps team

### Production (prod)
- **Purpose**: Live customer environment
- **Resources**: Full HA, multi-AZ, auto-scaling
- **Deployment**: Manual trigger only
- **Approvals**: 2 approvals (technical + business)
- **Access**: DevOps team only
- **Additional Controls**: Business hours only, incident check, backup verification

## Key Features

### Infrastructure as Code
- **Declarative Configuration**: Define desired state, Terraform handles implementation
- **Version Control**: All changes tracked in Git
- **Peer Review**: Pull request workflow for changes
- **Automated Testing**: Validation and security scanning in pipeline

### Security
- **State Encryption**: Customer-managed keys (CMK) for state files
- **Secret Management**: Azure Key Vault integration (no secrets in code)
- **Network Isolation**: Private endpoints and VNet integration
- **RBAC**: Least privilege access control
- **Compliance**: Security scanning with TFSec and Checkov

### High Availability
- **Multi-AZ Deployment**: Resources distributed across availability zones
- **Auto-Scaling**: Dynamic scaling based on load
- **Load Balancing**: Application Gateway with WAF
- **Database Replication**: Geo-redundant storage and replicas
- **Disaster Recovery**: Automated backups and recovery procedures

### Monitoring and Observability
- **Application Insights**: Application performance monitoring
- **Log Analytics**: Centralized log aggregation
- **Azure Monitor**: Metrics and alerting
- **Diagnostic Logging**: Audit trail for all resources

## Documentation

Comprehensive documentation is available in the [docs/](./docs/) directory:

| Document | Description |
|----------|-------------|
| [Azure DevOps Setup](./docs/AZURE-DEVOPS-SETUP.md) | Complete guide for Azure DevOps CI/CD setup |
| [Variable Groups](./docs/VARIABLE-GROUPS.md) | Configuration and management of variable groups |
| [Service Connections](./docs/SERVICE-CONNECTIONS.md) | Service principal and connection setup |
| [Environments](./docs/ENVIRONMENTS.md) | Environment configuration and approval gates |
| [Security Best Practices](./docs/SECURITY-BEST-PRACTICES.md) | Security guidelines and compliance |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues and solutions |

## Common Tasks

### Deploy to Development

```bash
# Select development workspace
terraform workspace select dev

# Plan changes
terraform plan -var-file="environments/dev/terraform.tfvars" -out=dev.tfplan

# Review plan
terraform show dev.tfplan

# Apply changes
terraform apply dev.tfplan
```

### Deploy to Production

**Production deployments should ALWAYS use Azure DevOps pipelines.**

1. Create pull request with infrastructure changes
2. Pipeline runs validation and security scans
3. Terraform plan runs and outputs attached to PR
4. Code review and approval
5. Merge to main branch
6. Pipeline triggers production deployment
7. Manual approval required (2 approvers)
8. Terraform apply executes
9. Post-deployment verification

### Add New Resource

1. **Create/Update Terraform Configuration**
   ```hcl
   # main.tf or appropriate module
   resource "azurerm_storage_account" "new_storage" {
     name                     = "jobpilotnewstorage"
     resource_group_name      = azurerm_resource_group.main.name
     location                 = var.location
     account_tier             = "Standard"
     account_replication_type = "GRS"

     tags = local.common_tags
   }
   ```

2. **Add Variables (if needed)**
   ```hcl
   # variables.tf
   variable "new_storage_tier" {
     description = "Storage account tier"
     type        = string
     default     = "Standard"
   }
   ```

3. **Add Outputs (if needed)**
   ```hcl
   # outputs.tf
   output "new_storage_id" {
     description = "ID of the new storage account"
     value       = azurerm_storage_account.new_storage.id
   }
   ```

4. **Test Locally**
   ```bash
   terraform validate
   terraform plan -var-file="environments/dev/terraform.tfvars"
   ```

5. **Commit and Push**
   ```bash
   git checkout -b feature/add-new-storage
   git add .
   git commit -m "Add new storage account for feature X"
   git push origin feature/add-new-storage
   ```

6. **Create Pull Request**
   - Pipeline runs validation
   - Review plan output
   - Get approval
   - Merge

### Import Existing Resource

```bash
# Import resource into state
terraform import azurerm_resource_group.existing /subscriptions/{sub-id}/resourceGroups/{rg-name}

# Verify import
terraform plan  # Should show no changes

# If changes detected, update configuration to match
```

### Destroy Resources

**Use with extreme caution!**

```bash
# Development only (production requires special approval)
terraform workspace select dev

# Destroy specific resource
terraform destroy -target=azurerm_storage_account.example

# Destroy entire environment (DANGEROUS!)
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

## Terraform Commands Reference

### Initialization and Planning

```bash
# Initialize working directory
terraform init

# Initialize and reconfigure backend
terraform init -reconfigure

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Create execution plan
terraform plan

# Plan with specific variables
terraform plan -var-file="environments/prod/terraform.tfvars"

# Save plan to file
terraform plan -out=plan.tfplan
```

### Apply and Destroy

```bash
# Apply changes (interactive)
terraform apply

# Apply saved plan
terraform apply plan.tfplan

# Apply without confirmation (use in pipelines)
terraform apply -auto-approve

# Destroy resources (interactive)
terraform destroy

# Destroy without confirmation
terraform destroy -auto-approve

# Apply/destroy specific resource
terraform apply -target=azurerm_kubernetes_cluster.main
```

### State Management

```bash
# List resources in state
terraform state list

# Show resource details
terraform state show azurerm_resource_group.main

# Remove resource from state
terraform state rm azurerm_storage_account.old

# Move resource in state
terraform state mv azurerm_storage_account.old azurerm_storage_account.new

# Pull state to local file
terraform state pull > state.json

# Push state from local file (DANGEROUS)
terraform state push state.json
```

### Workspace Management

```bash
# List workspaces
terraform workspace list

# Show current workspace
terraform workspace show

# Create new workspace
terraform workspace new staging

# Select workspace
terraform workspace select prod

# Delete workspace
terraform workspace delete dev
```

### Output and Inspection

```bash
# Show all outputs
terraform output

# Show specific output
terraform output aks_cluster_name

# Show in JSON format
terraform output -json

# Show plan in JSON
terraform show -json plan.tfplan

# Show current state
terraform show
```

## Cost Management

### Estimated Monthly Costs by Environment

| Environment | Monthly Cost (USD) | Notes |
|-------------|-------------------|-------|
| Development | $300 - $500 | Minimal resources, Basic SKUs |
| Staging | $800 - $1,200 | Production-like, Standard SKUs |
| Production | $3,000 - $5,000 | Full HA, Premium SKUs, auto-scaling |

**Major cost drivers:**
- AKS cluster nodes (compute)
- Azure Application Gateway
- Cosmos DB throughput (RU/s)
- Bandwidth/egress
- Storage (Premium SSD)

### Cost Optimization Tips

1. **Use Appropriate SKUs**
   - Dev: Basic/Standard
   - Staging: Standard
   - Prod: Standard/Premium

2. **Auto-Scaling**
   - Scale down during off-hours
   - Use spot instances for non-critical workloads

3. **Reserved Instances**
   - 1-year commitment: ~30% savings
   - 3-year commitment: ~50% savings

4. **Monitor and Optimize**
   ```bash
   # View cost by resource
   az consumption usage list --start-date 2025-12-01 --end-date 2025-12-31
   ```

## Security

### Security Scanning

All code is automatically scanned for security issues:

- **TFSec**: Terraform security scanner
- **Checkov**: Policy-as-code security scanning
- **Gitleaks**: Secret detection
- **Trivy**: Vulnerability scanning

### Security Best Practices

1. **Never commit secrets**
   - Use Azure Key Vault
   - Reference secrets via data sources
   - Use .gitignore for sensitive files

2. **Use least privilege**
   - Minimal RBAC assignments
   - Service Principal per environment
   - Just-in-time access

3. **Enable audit logging**
   - All resources log to Log Analytics
   - 90-day retention minimum
   - Alerts for suspicious activity

4. **Network security**
   - Private endpoints for PaaS services
   - Network Security Groups (NSGs)
   - Azure Firewall for egress control

See [Security Best Practices](./docs/SECURITY-BEST-PRACTICES.md) for complete guidelines.

## Troubleshooting

### Common Issues

**Issue**: State lock error
```bash
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

**Issue**: Authentication failed
```bash
# Verify environment variables
echo $ARM_CLIENT_ID
echo $ARM_TENANT_ID

# Test authentication
az login --service-principal -u $ARM_CLIENT_ID -p $ARM_CLIENT_SECRET --tenant $ARM_TENANT_ID
```

**Issue**: Resource already exists
```bash
# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/{sub}/resourceGroups/{name}
```

See [Troubleshooting Guide](./docs/TROUBLESHOOTING.md) for comprehensive solutions.

## Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/description
   ```

2. **Make Changes**
   - Update Terraform configuration
   - Update documentation
   - Add/update tests

3. **Validate Locally**
   ```bash
   terraform fmt -recursive
   terraform validate
   terraform plan
   ```

4. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: add new resource for feature X"
   git push origin feature/description
   ```

5. **Create Pull Request**
   - Pipeline runs automatically
   - Address review comments
   - Get approval
   - Merge

### Code Standards

- **Formatting**: Use `terraform fmt`
- **Naming**: Use consistent naming conventions
- **Comments**: Document complex logic
- **Modules**: Keep modules focused and reusable
- **Variables**: Provide descriptions and defaults
- **Outputs**: Export useful values

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting changes
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example:**
```
feat(aks): add node auto-scaling configuration

Added cluster autoscaler configuration to AKS module
to support dynamic scaling based on workload demands.

Min nodes: 3
Max nodes: 10

Closes #123
```

## Support

### Getting Help

1. **Documentation**: Check [docs/](./docs/) directory
2. **Troubleshooting**: See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
3. **Team Chat**: Slack #devops-support
4. **Email**: devops@jobpilot.ai
5. **Issues**: Create issue in Azure DevOps

### Reporting Issues

Include:
- Environment (dev/staging/prod)
- Terraform version
- Error message (full)
- Steps to reproduce
- Expected vs actual behavior

## Additional Resources

### Official Documentation

- [Terraform Documentation](https://www.terraform.io/docs)
- [Azure Provider Documentation](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure DevOps Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Azure Architecture Center](https://docs.microsoft.com/en-us/azure/architecture/)

### Learning Resources

- [Terraform Azure Tutorial](https://learn.hashicorp.com/collections/terraform/azure-get-started)
- [Azure Well-Architected Framework](https://docs.microsoft.com/en-us/azure/architecture/framework/)
- [Infrastructure as Code Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)

## License

Copyright (c) 2025 JobPilot AI Platform. All rights reserved.

## Changelog

### Version 1.0.0 (2025-12-04)
- Initial infrastructure setup
- Azure Kubernetes Service (AKS) cluster
- Azure Container Registry (ACR)
- Cosmos DB and PostgreSQL databases
- Virtual network and security configuration
- Application Gateway with WAF
- Monitoring and logging
- Complete CI/CD pipeline integration

---

**Maintained By**: DevOps Team
**Last Updated**: 2025-12-04
**Version**: 1.0.0

For questions or issues, contact: devops@jobpilot.ai
