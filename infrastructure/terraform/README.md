# JobPilot AI Platform - Terraform Infrastructure

This directory contains the Terraform infrastructure-as-code (IaC) configuration for deploying the complete JobPilot AI Platform on Microsoft Azure.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Modules](#modules)
- [Environments](#environments)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Cost Optimization](#cost-optimization)

## Overview

The JobPilot platform infrastructure is designed for enterprise-grade reliability, security, and scalability. It leverages Azure's PaaS and IaaS services to provide:

- **High Availability**: Multi-zone deployment with automatic failover
- **Security**: Private endpoints, managed identities, and Azure Defender integration
- **Scalability**: Auto-scaling for compute resources based on demand
- **Observability**: Comprehensive monitoring with Application Insights and Log Analytics
- **Cost Optimization**: Environment-specific SKU sizing and resource configurations

### Key Features

- Modular architecture with reusable Terraform modules
- Multi-environment support (dev, staging, production)
- Azure Kubernetes Service (AKS) for container orchestration
- Application Gateway with Web Application Firewall (WAF)
- Private endpoints for secure networking
- Managed identities for passwordless authentication
- Comprehensive monitoring and alerting

## Architecture

### Infrastructure Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Azure Cloud Platform                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐        ┌──────────────────┐           │
│  │  Application     │        │   Azure Front    │           │
│  │  Gateway + WAF   │   OR   │   Door + WAF     │           │
│  └────────┬─────────┘        └────────┬─────────┘           │
│           │                           │                      │
│           └───────────┬───────────────┘                      │
│                       │                                      │
│           ┌───────────▼───────────┐                          │
│           │   Virtual Network     │                          │
│           │   (10.0.0.0/16)       │                          │
│           ├───────────────────────┤                          │
│           │                       │                          │
│           │  ┌─────────────────┐  │                          │
│           │  │  AKS Cluster    │  │                          │
│           │  │  - System Pool  │  │                          │
│           │  │  - User Pool    │  │                          │
│           │  │  - GPU Pool     │  │                          │
│           │  └─────────────────┘  │                          │
│           │                       │                          │
│           │  ┌─────────────────┐  │                          │
│           │  │  App Services   │  │                          │
│           │  │  - Web App      │  │                          │
│           │  │  - Auth Service │  │                          │
│           │  │  - AI Service   │  │                          │
│           │  └─────────────────┘  │                          │
│           │                       │                          │
│           │  ┌─────────────────┐  │                          │
│           │  │  Data Layer     │  │                          │
│           │  │  - SQL Database │  │                          │
│           │  │  - Redis Cache  │  │                          │
│           │  │  - Service Bus  │  │                          │
│           │  └─────────────────┘  │                          │
│           │                       │                          │
│           └───────────────────────┘                          │
│                                                               │
│  ┌───────────────────────────────────────────────┐           │
│  │  Security & Identity                          │           │
│  │  - Key Vault (secrets, certificates)          │           │
│  │  - Managed Identities (CICD, Workload, AKS)   │           │
│  │  - Private Endpoints (secure connectivity)    │           │
│  │  - Azure Defender (threat protection)         │           │
│  └───────────────────────────────────────────────┘           │
│                                                               │
│  ┌───────────────────────────────────────────────┐           │
│  │  Monitoring & Operations                      │           │
│  │  - Application Insights (APM)                 │           │
│  │  - Log Analytics (centralized logging)        │           │
│  │  - Azure Monitor (alerts & dashboards)        │           │
│  │  - Container Registry (ACR)                   │           │
│  └───────────────────────────────────────────────┘           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Network Topology

The infrastructure uses a hub-spoke network architecture:

| Subnet | CIDR | Purpose |
|--------|------|---------|
| App Service | 10.0.1.0/24 | Azure App Services integration |
| AKS | 10.0.2.0/23 | Kubernetes cluster nodes |
| Database | 10.0.4.0/24 | SQL Database private endpoint |
| Cache | 10.0.5.0/24 | Redis Cache private endpoint |
| Private Endpoints | 10.0.6.0/24 | General private endpoint subnet |
| Application Gateway | 10.0.7.0/24 | Application Gateway frontend |

## Prerequisites

### Required Tools

1. **Terraform** >= 1.5.0
   ```bash
   # Download from https://www.terraform.io/downloads
   terraform version
   ```

2. **Azure CLI** >= 2.50.0
   ```bash
   # Install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   az version
   ```

3. **Git** (for version control)
   ```bash
   git --version
   ```

### Azure Prerequisites

1. **Azure Subscription**
   - Active Azure subscription with Contributor or Owner role
   - Sufficient quota for required resources (VMs, Public IPs, etc.)

2. **Service Principal or Managed Identity**
   ```bash
   # Create a service principal for Terraform
   az ad sp create-for-rbac --name "terraform-jobpilot" \
     --role="Contributor" \
     --scopes="/subscriptions/<SUBSCRIPTION_ID>"
   ```

3. **Resource Providers**
   ```bash
   # Register required Azure resource providers
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
   ```

### Azure Authentication

Configure Azure CLI authentication:

```bash
# Login to Azure
az login

# Set the subscription
az account set --subscription "<SUBSCRIPTION_ID>"

# Verify authentication
az account show
```

Alternatively, use environment variables:

```bash
export ARM_CLIENT_ID="<service_principal_appid>"
export ARM_CLIENT_SECRET="<service_principal_password>"
export ARM_SUBSCRIPTION_ID="<subscription_id>"
export ARM_TENANT_ID="<tenant_id>"
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd infrastructure/terraform
```

### 2. Create Backend Storage

Terraform state must be stored remotely for team collaboration:

```bash
# Create resource group for state storage
az group create --name tfstate-rg --location eastus

# Create storage account (name must be globally unique)
az storage account create \
  --name jobpilottfstate \
  --resource-group tfstate-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create blob container
az storage container create \
  --name tfstate \
  --account-name jobpilottfstate
```

### 3. Configure Variables

```bash
# Copy example variables file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Important**: Set these required variables:
- `sql_admin_username`: SQL Server admin username
- `sql_admin_password`: Strong password (min 12 characters)
- `allowed_ip_addresses`: Your office/VPN IP addresses

### 4. Initialize Terraform

```bash
# Initialize backend and download providers
terraform init \
  -backend-config="storage_account_name=jobpilottfstate" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=jobpilot-dev.tfstate"
```

### 5. Review Execution Plan

```bash
# Create execution plan
terraform plan -out=tfplan

# Review the plan
terraform show tfplan
```

### 6. Deploy Infrastructure

```bash
# Apply the configuration
terraform apply tfplan

# Or combine plan and apply
terraform apply -auto-approve
```

### 7. View Outputs

```bash
# Display all outputs
terraform output

# Display specific output
terraform output web_app_url
```

## Configuration

### Main Configuration Files

| File | Purpose |
|------|---------|
| `main.tf` | Main orchestration file, module calls |
| `variables.tf` | Input variable definitions |
| `locals.tf` | Local values and computed variables |
| `outputs.tf` | Output values |
| `versions.tf` | Provider version constraints |
| `backend.tf` | Remote state backend configuration |
| `terraform.tfvars` | Variable values (not in git) |
| `terraform.tfvars.example` | Example variable values |

### Environment Files

Environment-specific configurations are stored in the `environments/` directory:

- `environments/dev.tfvars` - Development environment
- `environments/staging.tfvars` - Staging environment
- `environments/prod.tfvars` - Production environment

## Modules

The infrastructure is organized into reusable Terraform modules:

### Core Infrastructure Modules

#### Networking Module
**Path**: `modules/networking`
**Purpose**: Virtual network, subnets, and network security groups

**Resources**:
- Virtual Network (VNet)
- Subnets (App Service, AKS, Database, Cache, etc.)
- Network Security Groups (NSGs)
- Route Tables

**Key Outputs**:
- VNet ID and name
- Subnet IDs for each tier
- NSG IDs

#### Managed Identity Module
**Path**: `modules/managed-identity`
**Purpose**: User-assigned managed identities for passwordless authentication

**Resources**:
- CI/CD Pipeline Identity
- Workload Identity (for app pods)
- AKS Kubelet Identity (for container image pull)

**Key Outputs**:
- Identity Client IDs
- Identity Principal IDs
- Identity Resource IDs

#### Container Registry Module
**Path**: `modules/container-registry`
**Purpose**: Azure Container Registry for Docker images

**Features**:
- Environment-specific SKU (Basic/Standard/Premium)
- Geo-replication (Premium only)
- Content trust and quarantine policies
- RBAC role assignments for identities
- Image retention policies

**Key Outputs**:
- Registry login server URL
- Registry name and ID

#### Key Vault Module
**Path**: `modules/key-vault`
**Purpose**: Secure storage for secrets, keys, and certificates

**Features**:
- Soft delete with 90-day retention
- Purge protection (production)
- Network ACLs and private endpoints
- Access policies for managed identities
- Diagnostic logging

**Key Outputs**:
- Key Vault URI
- Key Vault ID

### Compute Modules

#### AKS Module
**Path**: `modules/aks`
**Purpose**: Azure Kubernetes Service cluster

**Features**:
- Multi-node pools (system, user, GPU)
- Workload identity and OIDC issuer
- Azure CNI networking
- Azure Monitor for containers
- Auto-scaling enabled
- Azure Policy integration
- Key Vault Secrets Provider CSI
- Microsoft Defender for Cloud

**Key Outputs**:
- Cluster FQDN
- OIDC issuer URL
- Kube config (sensitive)

#### App Service Plan Module
**Path**: `modules/app-service-plan`
**Purpose**: App Service hosting plan

**Features**:
- Environment-specific SKU
- Auto-scaling configuration
- Zone redundancy (Premium)

#### App Services Module
**Path**: `modules/app-services`
**Purpose**: Web applications and API services

**Resources**:
- Web App (Next.js frontend)
- Auth Service (NestJS)
- AI Service (FastAPI)

**Features**:
- Managed identity integration
- VNet integration
- Application Insights instrumentation
- Key Vault references
- Container deployment from ACR

### Data Modules

#### SQL Database Module
**Path**: `modules/sql-database`
**Purpose**: Azure SQL Database

**Features**:
- Azure AD authentication
- Transparent Data Encryption (TDE)
- Automated backups (short-term and long-term)
- Threat detection
- Vulnerability assessment
- Private endpoints
- Firewall rules
- VNet service endpoints

**Key Outputs**:
- SQL Server FQDN
- Connection string (sensitive)

#### Redis Cache Module
**Path**: `modules/redis-cache`
**Purpose**: Azure Cache for Redis

**Features**:
- Environment-specific SKU
- Data persistence (Premium)
- AOF backups (Premium)
- Private endpoints
- SSL/TLS enforcement
- Firewall rules

**Key Outputs**:
- Redis hostname
- Connection string (sensitive)

#### Service Bus Module
**Path**: `modules/service-bus`
**Purpose**: Message queuing and pub/sub

**Resources**:
- Service Bus namespace
- Queues (job-applications, resume-processing, ai-analysis, notifications)
- Topics (application-events, system-events)

**Features**:
- Premium SKU for production
- Message sessions
- Duplicate detection
- Dead-letter queues

### Security Modules

#### Private Endpoints Module
**Path**: `modules/private-endpoints`
**Purpose**: Private network connectivity to Azure PaaS services

**Features**:
- Private DNS zones
- VNet links
- Private endpoints for:
  - Key Vault
  - SQL Server
  - Redis Cache
  - Storage Account
  - Container Registry
  - Cosmos DB (if used)
  - OpenAI (if used)

**Key Outputs**:
- Private endpoint IPs
- Private DNS zone IDs

### Load Balancing Modules

#### Application Gateway Module
**Path**: `modules/application-gateway`
**Purpose**: Layer 7 load balancer with WAF

**Features**:
- WAF v2 with OWASP rule sets
- Auto-scaling (min/max capacity)
- SSL/TLS termination
- Path-based routing
- Health probes
- Zone redundancy
- HTTP to HTTPS redirect

**Key Outputs**:
- Public IP address
- Frontend FQDN

#### Front Door Module
**Path**: `modules/front-door`
**Purpose**: Global load balancer and CDN with WAF

**Features**:
- WAF with custom rules
- Global load balancing
- SSL/TLS offloading
- Caching and compression
- Health probes
- Custom domains

### Monitoring Modules

#### App Insights Module
**Path**: `modules/app-insights`
**Purpose**: Application Performance Management (APM)

**Resources**:
- Application Insights instance
- Log Analytics workspace

**Features**:
- Distributed tracing
- Performance metrics
- Log aggregation
- Availability tests
- Smart detection

**Key Outputs**:
- Instrumentation key (sensitive)
- Connection string (sensitive)

#### Monitoring Module
**Path**: `modules/monitoring`
**Purpose**: Alerts and monitoring rules

**Features**:
- Action groups (email, webhook)
- Metric alerts (CPU, memory, HTTP errors)
- Availability tests
- Log Analytics query alerts
- AKS-specific alerts

**Key Outputs**:
- Action group ID
- Alert rule IDs

#### Dashboards Module
**Path**: `modules/dashboards`
**Purpose**: Azure Portal dashboards

**Features**:
- Application overview dashboard
- Infrastructure health dashboard
- Database performance dashboard
- Cost analysis dashboard

## Environments

### Development Environment

**Configuration**: `environments/dev.tfvars`

**Characteristics**:
- Basic/Standard SKUs for cost optimization
- Single instance deployment (no auto-scaling)
- No private endpoints (simplified networking)
- No AKS cluster (App Services only)
- No Application Gateway/WAF
- Full telemetry sampling
- Short backup retention

**Estimated Monthly Cost**: $150-200 USD

**Use Cases**:
- Feature development
- Integration testing
- Developer experimentation

### Staging Environment

**Configuration**: `environments/staging.tfvars`

**Characteristics**:
- Standard/Premium SKUs
- Auto-scaling enabled (2-5 instances)
- Private endpoints enabled
- Optional AKS cluster
- Application Gateway with WAF
- Reduced telemetry sampling
- Medium backup retention

**Estimated Monthly Cost**: $800-1200 USD

**Use Cases**:
- Pre-production testing
- Load testing
- UAT (User Acceptance Testing)
- Demo environment

### Production Environment

**Configuration**: `environments/prod.tfvars`

**Characteristics**:
- Premium SKUs with zone redundancy
- Auto-scaling enabled (3-10 instances)
- Private endpoints for all PaaS services
- AKS cluster with multiple node pools
- Application Gateway or Front Door with WAF
- Azure Defender enabled
- Long-term backup retention
- Geo-replication (selected services)

**Estimated Monthly Cost**: $2000-4000 USD

**Use Cases**:
- Production workloads
- Customer-facing applications
- Business-critical operations

## Deployment

### Deploy to Development

```bash
# Initialize with dev backend
terraform init \
  -backend-config="key=jobpilot-dev.tfstate"

# Plan with dev variables
terraform plan \
  -var-file="environments/dev.tfvars" \
  -out=dev.tfplan

# Apply
terraform apply dev.tfplan
```

### Deploy to Staging

```bash
# Initialize with staging backend
terraform init \
  -backend-config="key=jobpilot-staging.tfstate" \
  -reconfigure

# Plan with staging variables
terraform plan \
  -var-file="environments/staging.tfvars" \
  -out=staging.tfplan

# Apply
terraform apply staging.tfplan
```

### Deploy to Production

```bash
# Initialize with prod backend
terraform init \
  -backend-config="key=jobpilot-prod.tfstate" \
  -reconfigure

# Plan with prod variables
terraform plan \
  -var-file="environments/prod.tfvars" \
  -out=prod.tfplan

# Review plan carefully!
terraform show prod.tfplan

# Apply with approval
terraform apply prod.tfplan
```

### Workspace-Based Deployment (Alternative)

```bash
# Create workspaces
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# Switch to workspace
terraform workspace select dev

# Deploy (workspace name determines environment)
terraform apply -var="environment=$(terraform workspace show)"
```

## Security

### Managed Identities

The infrastructure uses Azure Managed Identities for passwordless authentication:

1. **CI/CD Identity**: Used by deployment pipelines
   - ACR Push (Container Registry)
   - Key Vault read/write access

2. **Workload Identity**: Used by application pods
   - Key Vault secret access
   - ACR pull (if needed)
   - Service Bus access
   - SQL Database access

3. **AKS Kubelet Identity**: Used by AKS nodes
   - ACR pull (container images)
   - Managed disk operations

### RBAC Assignments

| Identity | Resource | Role | Purpose |
|----------|----------|------|---------|
| CI/CD | Container Registry | AcrPush | Push images |
| AKS Kubelet | Container Registry | AcrPull | Pull images |
| Workload | Container Registry | AcrPull | Pull images |
| CI/CD | Key Vault | Key Vault Administrator | Manage secrets |
| Workload | Key Vault | Key Vault Secrets User | Read secrets |

### Network Security

1. **Network Segmentation**: Separate subnets for each tier
2. **NSG Rules**: Restricted traffic between subnets
3. **Private Endpoints**: PaaS services accessible only from VNet
4. **Application Gateway WAF**: Layer 7 protection
5. **DDoS Protection**: Standard tier (optional upgrade to Premium)

### Secrets Management

```bash
# Store SQL password in Key Vault
az keyvault secret set \
  --vault-name <key-vault-name> \
  --name sql-admin-password \
  --value "<secure-password>"

# Reference in applications
@Microsoft.KeyVault(SecretUri=https://<vault-name>.vault.azure.net/secrets/sql-admin-password/)
```

### Security Best Practices

1. **Enable Azure Defender** for production environments
2. **Use private endpoints** for all PaaS services
3. **Rotate credentials** regularly (90-day policy)
4. **Enable audit logging** for compliance
5. **Implement least privilege** access with RBAC
6. **Enable multi-factor authentication** for admin access
7. **Use Azure Policy** for governance
8. **Enable soft delete** for Key Vault
9. **Restrict network access** with NSGs and firewalls
10. **Monitor security events** with Azure Sentinel

## Monitoring

### Application Insights

Access Application Insights in Azure Portal:
- Navigate to Resource Group > Application Insights
- View application map, performance metrics, failures
- Set up availability tests for uptime monitoring
- Configure alerts for performance degradation

### Log Analytics Queries

Useful KQL (Kusto Query Language) queries:

```kql
// Failed requests in last 24 hours
requests
| where timestamp > ago(24h)
| where success == false
| summarize count() by resultCode, bin(timestamp, 1h)
| render timechart

// High-latency requests
requests
| where timestamp > ago(1h)
| where duration > 5000  // 5 seconds
| project timestamp, name, duration, resultCode
| order by duration desc

// Exception analysis
exceptions
| where timestamp > ago(24h)
| summarize count() by type, outerMessage
| order by count_ desc

// AKS pod restarts
KubePodInventory
| where TimeGenerated > ago(24h)
| where PodStatus == "Failed"
| summarize count() by Name, Namespace
```

### Alerts

Pre-configured alerts monitor:
- **Application Health**: HTTP 5xx errors, failed requests
- **Performance**: High CPU, memory usage, slow response times
- **Infrastructure**: Database DTU, Redis memory, AKS node resources
- **Security**: Failed authentication attempts, unusual traffic patterns
- **Availability**: Endpoint uptime, health probe failures

### Dashboards

Azure Dashboards provide real-time visibility:
1. **Application Overview**: Request rate, response time, failures
2. **Infrastructure Health**: CPU, memory, disk, network
3. **Database Performance**: DTU usage, connections, query stats
4. **Cost Analysis**: Daily spend, forecast, budget alerts

## Troubleshooting

### Common Issues

#### Issue: Terraform Init Fails

```bash
Error: Failed to get existing workspaces: containers.Client#ListBlobs: Failure responding to request
```

**Solution**: Verify backend configuration and Azure credentials
```bash
az storage account show --name jobpilottfstate --resource-group tfstate-rg
az login --tenant <tenant-id>
```

#### Issue: Insufficient Quota

```bash
Error: creating Kubernetes Cluster: Code="QuotaExceeded" Message="Operation could not be completed as it results in exceeding approved Total Regional Cores quota"
```

**Solution**: Request quota increase
```bash
# View current quota
az vm list-usage --location eastus --output table

# Request quota increase via Azure Portal
# Support > New Support Request > Service and subscription limits (quotas)
```

#### Issue: Name Already Exists

```bash
Error: A resource with the ID already exists
```

**Solution**: Import existing resource or change name
```bash
# Import existing resource
terraform import azurerm_resource_group.main /subscriptions/<sub-id>/resourceGroups/<rg-name>

# Or use unique suffix
project_name = "jobpilot-v2"
```

#### Issue: Private Endpoint Connection Failed

```bash
Error: waiting for creation of Private Endpoint: Code="PrivateEndpointNotAllowed"
```

**Solution**: Verify network configuration and subnet delegation
```bash
# Check subnet configuration
az network vnet subnet show \
  --resource-group <rg-name> \
  --vnet-name <vnet-name> \
  --name <subnet-name>

# Ensure service endpoints are enabled
az network vnet subnet update \
  --resource-group <rg-name> \
  --vnet-name <vnet-name> \
  --name <subnet-name> \
  --service-endpoints Microsoft.Sql Microsoft.KeyVault
```

### Debugging

Enable detailed Terraform logging:

```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform-debug.log
terraform apply
```

View Azure activity logs:

```bash
az monitor activity-log list \
  --resource-group <rg-name> \
  --start-time 2024-01-01T00:00:00Z \
  --offset 1h
```

### State Management

#### View State

```bash
# List resources in state
terraform state list

# Show specific resource
terraform state show azurerm_kubernetes_cluster.main
```

#### Move Resources

```bash
# Move resource to different state
terraform state mv azurerm_resource_group.old azurerm_resource_group.new
```

#### Remove from State

```bash
# Remove resource from state (doesn't delete resource)
terraform state rm azurerm_resource_group.example
```

#### Refresh State

```bash
# Update state with real infrastructure
terraform refresh
```

## Cost Optimization

### Cost by Environment

| Environment | Monthly Estimate | Key Drivers |
|-------------|-----------------|-------------|
| Development | $150-200 | Basic SKUs, single instances |
| Staging | $800-1200 | Standard SKUs, limited scaling |
| Production | $2000-4000 | Premium SKUs, HA, auto-scaling |

### Cost Reduction Strategies

1. **Use appropriate SKUs**
   - Dev: Basic/Standard
   - Staging: Standard
   - Prod: Premium only when needed

2. **Enable auto-scaling with appropriate limits**
   - Scale down during off-hours
   - Use reserved instances for predictable workloads

3. **Use Azure Hybrid Benefit**
   - Bring existing Windows Server licenses
   - Save up to 40% on VMs

4. **Stop non-production resources**
   ```bash
   # Stop AKS cluster (dev environment)
   az aks stop --name jobpilot-dev-aks --resource-group jobpilot-dev-rg

   # Start when needed
   az aks start --name jobpilot-dev-aks --resource-group jobpilot-dev-rg
   ```

5. **Use burstable VM SKUs** (B-series) for dev/staging

6. **Enable Azure Advisor** cost recommendations
   ```bash
   az advisor recommendation list --category Cost
   ```

7. **Set up budget alerts**
   ```bash
   az consumption budget create \
     --name monthly-budget \
     --amount 500 \
     --category Cost \
     --time-grain Monthly
   ```

### Cost Monitoring

View current costs:

```bash
# Current month costs by resource group
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31

# Cost analysis in Azure Portal
# Navigate to: Cost Management + Billing > Cost Analysis
```

## Maintenance

### Updating Kubernetes Version

```bash
# Check available versions
az aks get-versions --location eastus --output table

# Update variable
aks_kubernetes_version = "1.29.0"

# Plan upgrade
terraform plan -var-file="environments/prod.tfvars"

# Apply upgrade (production: during maintenance window)
terraform apply
```

### Rotating Secrets

```bash
# Update SQL password in Key Vault
az keyvault secret set \
  --vault-name <vault-name> \
  --name sql-admin-password \
  --value "<new-password>"

# Update Terraform variable (if managed by Terraform)
sql_admin_password = "<new-password>"
terraform apply
```

### Backup and Disaster Recovery

1. **Terraform State Backup**
   ```bash
   # Export current state
   terraform state pull > backup-$(date +%Y%m%d).tfstate
   ```

2. **Database Backups**
   - Automated backups: 7-35 days (configured)
   - Long-term retention: Weekly, monthly, yearly

3. **Container Registry Geo-replication**
   - Enabled for production (Premium SKU)
   - Replicas in: East US, West Europe

4. **Disaster Recovery Testing**
   - Quarterly DR drills
   - Document recovery procedures
   - Test backup restoration

## Additional Resources

### Documentation

- [Azure Terraform Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices)
- [Azure Architecture Center](https://docs.microsoft.com/en-us/azure/architecture/)
- [Azure Security Best Practices](https://docs.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns)

### Support

- GitHub Issues: [Project Issues](https://github.com/yourorg/jobpilot/issues)
- Slack Channel: #infrastructure
- Email: devops@yourcompany.com

### License

Copyright © 2024 JobPilot. All rights reserved.
