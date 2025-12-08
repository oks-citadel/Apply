# ApplyforUs Platform - Azure Infrastructure

Comprehensive Terraform infrastructure-as-code for deploying the ApplyforUs job application platform on Microsoft Azure.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Module Documentation](#module-documentation)
- [Environment Configuration](#environment-configuration)
- [Deployment Guide](#deployment-guide)
- [DNS and SSL Configuration](#dns-and-ssl-configuration)
- [Cost Estimates](#cost-estimates)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Overview

This Terraform configuration deploys a production-ready, highly available infrastructure for the ApplyforUs platform on Azure. It includes:

- **Azure Kubernetes Service (AKS)** - Container orchestration with auto-scaling
- **Azure Container Registry (ACR)** - Private Docker image registry
- **Application Gateway with WAF** - Layer 7 load balancer with Web Application Firewall
- **Azure DNS** - Managed DNS service for applyforus.com
- **Key Vault** - Secure secrets management
- **Log Analytics & Application Insights** - Comprehensive monitoring and observability
- **Virtual Network** - Isolated network with multiple subnets
- **Storage Account** - Blob storage for backups and files

### Key Features

- Multi-environment support (dev, test, prod)
- Modular, reusable Terraform modules
- High availability with zone redundancy
- Automatic scaling and self-healing
- Comprehensive security with private endpoints
- Cost-optimized configurations per environment
- Infrastructure monitoring and alerting

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Azure Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐         ┌──────────────────┐               │
│  │  GoDaddy DNS    │────────▶│   Azure DNS      │               │
│  │  Nameservers    │         │  applyforus.com  │               │
│  └─────────────────┘         └──────────────────┘               │
│                                      │                            │
│                                      ▼                            │
│                          ┌───────────────────────┐               │
│                          │ Application Gateway   │               │
│                          │ + WAF v2              │               │
│                          │ SSL Termination       │               │
│                          └───────────┬───────────┘               │
│                                      │                            │
│                    ┌─────────────────┼─────────────────┐         │
│                    │   Virtual Network (10.0.0.0/16)   │         │
│                    │                                   │         │
│                    │  ┌──────────────────────────┐    │         │
│                    │  │  AKS Cluster             │    │         │
│                    │  │  ┌────────────────────┐  │    │         │
│                    │  │  │  System Node Pool  │  │    │         │
│                    │  │  │  (3 nodes)         │  │    │         │
│                    │  │  └────────────────────┘  │    │         │
│                    │  │  ┌────────────────────┐  │    │         │
│                    │  │  │  User Node Pool    │  │    │         │
│                    │  │  │  (3-10 nodes)      │  │    │         │
│                    │  │  └────────────────────┘  │    │         │
│                    │  │                          │    │         │
│                    │  │  Services:               │    │         │
│                    │  │  - Web App (Next.js)     │    │         │
│                    │  │  - Auth Service (NestJS) │    │         │
│                    │  │  - AI Service (Python)   │    │         │
│                    │  │  - Job Service (NestJS)  │    │         │
│                    │  │  - User Service          │    │         │
│                    │  │  - Resume Service        │    │         │
│                    │  └──────────────────────────┘    │         │
│                    │                                   │         │
│                    │  ┌──────────────────────────┐    │         │
│                    │  │  Private Endpoints       │    │         │
│                    │  │  - Key Vault             │    │         │
│                    │  │  - ACR                   │    │         │
│                    │  │  - Storage Account       │    │         │
│                    │  └──────────────────────────┘    │         │
│                    └───────────────────────────────────┘         │
│                                                                   │
│  ┌───────────────────────────────────────────────────┐           │
│  │  Supporting Services                              │           │
│  │  - Azure Container Registry (ACR)                 │           │
│  │  - Key Vault (secrets, certs)                     │           │
│  │  - Log Analytics Workspace                        │           │
│  │  - Application Insights                           │           │
│  │  - Storage Account (backups)                      │           │
│  └───────────────────────────────────────────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

### Required Tools

1. **Terraform** >= 1.5.0
   ```bash
   terraform version
   ```

2. **Azure CLI** >= 2.50.0
   ```bash
   az version
   ```

3. **kubectl** (for AKS management)
   ```bash
   kubectl version --client
   ```

4. **Helm** (for Kubernetes package management)
   ```bash
   helm version
   ```

### Azure Requirements

1. **Active Azure Subscription** with appropriate permissions
2. **Service Principal or Managed Identity** for Terraform authentication
3. **Sufficient quotas** for resources (vCPUs, Public IPs, etc.)

### Domain Requirements

1. **Domain registered** in GoDaddy (applyforus.com)
2. **Access to domain management** in GoDaddy account

## Quick Start

### 1. Clone Repository

```bash
cd C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform
cd infrastructure\terraform-applyforus
```

### 2. Configure Azure Authentication

```bash
# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-ID"

# Create service principal for Terraform (if needed)
az ad sp create-for-rbac --name "terraform-applyforus" \
  --role="Contributor" \
  --scopes="/subscriptions/YOUR_SUBSCRIPTION_ID"
```

### 3. Create Backend Storage for Terraform State

```bash
# Create resource group for Terraform state
az group create \
  --name applyforus-tfstate-rg \
  --location eastus

# Create storage account (name must be globally unique)
az storage account create \
  --name applyforustfstate \
  --resource-group applyforus-tfstate-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create blob container
az storage container create \
  --name tfstate \
  --account-name applyforustfstate
```

### 4. Initialize Terraform

```bash
# Initialize with remote state backend
terraform init
```

### 5. Deploy Infrastructure

```bash
# Deploy development environment
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"

# Deploy production environment
terraform plan -var-file="environments/prod.tfvars"
terraform apply -var-file="environments/prod.tfvars"
```

### 6. Configure DNS

After deployment, configure nameservers in GoDaddy:

```bash
# Get nameservers from Terraform output
terraform output dns_zone_nameservers
```

See [godaddy_setup_steps.md](./godaddy_setup_steps.md) for detailed instructions.

### 7. Access AKS Cluster

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Verify connection
kubectl get nodes
```

## Module Documentation

### Resource Group Module
- **Path**: `modules/resource-group/`
- **Purpose**: Creates environment-specific resource group with tags

### Networking Module
- **Path**: `modules/networking/`
- **Purpose**: VNet, subnets, NSGs, private DNS zones
- **Subnets**:
  - AKS: 10.0.1.0/23
  - App Gateway: 10.0.3.0/24
  - Private Endpoints: 10.0.4.0/24
  - Management: 10.0.5.0/24

### AKS Module
- **Path**: `modules/aks/`
- **Purpose**: Kubernetes cluster with system and user node pools
- **Features**:
  - Azure CNI networking
  - Workload identity enabled
  - Auto-scaling
  - Azure Monitor integration
  - Key Vault CSI driver

### ACR Module
- **Path**: `modules/acr/`
- **Purpose**: Container registry for Docker images
- **Features**:
  - Premium SKU for production
  - Geo-replication support
  - Private endpoints
  - Image retention policies

### Key Vault Module
- **Path**: `modules/keyvault/`
- **Purpose**: Secure secrets and certificate storage
- **Features**:
  - RBAC authorization
  - Soft delete protection
  - Private endpoints
  - Audit logging

### Application Gateway Module
- **Path**: `modules/app-gateway/`
- **Purpose**: Layer 7 load balancer with WAF
- **Features**:
  - WAF v2 with OWASP rules
  - Auto-scaling
  - SSL termination
  - Health probes

### DNS Zone Module
- **Path**: `modules/dns-zone/`
- **Purpose**: Azure DNS zone for applyforus.com
- **Records**:
  - A records (root, www, api)
  - CAA records (SSL authorization)
  - TXT records (verification)

### Monitoring Module
- **Path**: `modules/monitoring/`
- **Purpose**: Observability and alerting
- **Components**:
  - Log Analytics Workspace
  - Application Insights
  - Metric alerts
  - Budget alerts

### Storage Module
- **Path**: `modules/storage/`
- **Purpose**: Blob storage for backups and files
- **Features**:
  - Lifecycle management
  - Soft delete
  - Private endpoints
  - Threat protection

## Environment Configuration

### Development Environment

**File**: `environments/dev.tfvars`

**Characteristics**:
- Small SKUs (cost-optimized)
- Single node deployment
- No high availability
- No private endpoints
- Basic monitoring

**Monthly Cost**: ~$150-200

### Test Environment

**File**: `environments/test.tfvars`

**Characteristics**:
- Medium SKUs
- 2 nodes with auto-scaling
- Basic HA setup
- WAF enabled
- Standard monitoring

**Monthly Cost**: ~$800-1,200

### Production Environment

**File**: `environments/prod.tfvars`

**Characteristics**:
- Premium SKUs
- 3+ nodes with zone redundancy
- Full HA with geo-replication
- Private endpoints enabled
- Comprehensive monitoring
- Extended log retention

**Monthly Cost**: ~$2,000-3,000

## Deployment Guide

### Complete Deployment Process

#### 1. Pre-Deployment

```bash
# Verify Azure authentication
az account show

# Check Terraform version
terraform version

# Validate configuration
terraform fmt -recursive
terraform validate
```

#### 2. Plan Deployment

```bash
# Create execution plan
terraform plan \
  -var-file="environments/prod.tfvars" \
  -out=prod.tfplan

# Review plan
terraform show prod.tfplan
```

#### 3. Deploy Infrastructure

```bash
# Apply configuration
terraform apply prod.tfplan

# Monitor deployment
# Expected time: 30-45 minutes for full deployment
```

#### 4. Verify Deployment

```bash
# Check all resources created
terraform state list

# Verify outputs
terraform output

# Test AKS connectivity
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

kubectl get nodes
```

### Multi-Environment Deployment

Using Terraform workspaces:

```bash
# Create workspaces
terraform workspace new dev
terraform workspace new test
terraform workspace new prod

# Deploy to specific environment
terraform workspace select prod
terraform apply -var-file="environments/prod.tfvars"
```

### Incremental Updates

```bash
# Update specific module
terraform plan -target=module.aks
terraform apply -target=module.aks

# Update all
terraform plan
terraform apply
```

## DNS and SSL Configuration

### DNS Setup Process

1. **Deploy Infrastructure**
   ```bash
   terraform apply -var-file="environments/prod.tfvars"
   ```

2. **Retrieve Nameservers**
   ```bash
   terraform output dns_zone_nameservers
   ```

3. **Configure in GoDaddy**
   - See detailed guide: [godaddy_setup_steps.md](./godaddy_setup_steps.md)

4. **Wait for Propagation**
   - Time required: 24-48 hours
   - Check status: https://www.whatsmydns.net/

5. **Verify DNS**
   ```bash
   nslookup applyforus.com
   ```

### SSL Certificate Setup

Follow the comprehensive guide: [ssl_configuration.md](./ssl_configuration.md)

Quick start:
```bash
# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --set installCRDs=true

# Create certificate
kubectl apply -f letsencrypt-issuer.yaml
kubectl apply -f certificate.yaml
```

### DNS Records

See complete list: [dns_records_production.md](./dns_records_production.md)

Key records:
- **A Record**: @ → Application Gateway IP
- **A Record**: www → Application Gateway IP
- **A Record**: api → Application Gateway IP
- **CAA Record**: Allow letsencrypt.org

## Cost Estimates

### Monthly Cost Breakdown

#### Development Environment (~$150-200/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| AKS | 1 node, Standard_D2s_v3 | $70 |
| ACR | Basic SKU | $5 |
| Application Gateway | Standard_v2, 1 instance | $30 |
| Key Vault | Standard | $1 |
| Storage | LRS, 100GB | $2 |
| Monitoring | 7-day retention | $20 |
| Networking | VNet, Public IP | $20 |
| **Total** | | **~$150** |

#### Test Environment (~$800-1,200/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| AKS | 2 nodes, Standard_D4s_v3 | $280 |
| ACR | Standard SKU | $20 |
| Application Gateway | WAF_v2, 2 instances | $300 |
| Key Vault | Standard | $1 |
| Storage | GRS, 500GB | $25 |
| Monitoring | 30-day retention | $50 |
| Networking | VNet, Public IPs | $30 |
| **Total** | | **~$700-1,200** |

#### Production Environment (~$2,000-3,000/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| AKS | 3-10 nodes, Standard_D8s_v3 | $840-2,800 |
| ACR | Premium with geo-replication | $100 |
| Application Gateway | WAF_v2, 2-10 instances | $300-1,500 |
| Key Vault | Standard + operations | $5 |
| Storage | GZRS, 2TB | $200 |
| Monitoring | 90-day retention | $150 |
| Networking | VNet, Public IPs, Bandwidth | $50 |
| Private Endpoints | Multiple services | $50 |
| **Total** | | **~$1,700-4,800** |

### Cost Optimization Tips

1. **Use Reserved Instances** for predictable workloads (save up to 72%)
2. **Stop dev/test environments** during non-business hours
3. **Use Azure Hybrid Benefit** if you have Windows licenses
4. **Enable auto-scaling** to scale down during low traffic
5. **Use spot instances** for non-critical workloads
6. **Configure lifecycle policies** for old data
7. **Set up budget alerts** to monitor spending

## Troubleshooting

### Common Issues

#### Issue: Terraform Init Fails

```bash
Error: Failed to get existing workspaces
```

**Solution**:
```bash
# Verify backend configuration
az storage account show --name applyforustfstate

# Check authentication
az account show

# Reinitialize
terraform init -reconfigure
```

#### Issue: AKS Deployment Timeout

```bash
Error: waiting for creation of Kubernetes Cluster: Code="QuotaExceeded"
```

**Solution**:
```bash
# Check quotas
az vm list-usage --location eastus --output table

# Request quota increase via Azure Portal
# Support > New Support Request > Service and subscription limits
```

#### Issue: DNS Not Resolving

**Solution**:
```bash
# Verify nameservers propagated
nslookup -type=NS applyforus.com

# Check Azure DNS zone
az network dns zone show \
  --name applyforus.com \
  --resource-group applyforus-prod-rg

# Clear DNS cache
ipconfig /flushdns  # Windows
```

#### Issue: Application Gateway Backend Unhealthy

**Solution**:
```bash
# Check AKS ingress controller
kubectl get pods -n ingress-nginx

# Verify service endpoints
kubectl get endpoints -n jobpilot

# Check Application Gateway backend health
az network application-gateway show-backend-health \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-appgw
```

#### Issue: Certificate Request Fails

**Solution**:
```bash
# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager

# Verify DNS challenge
kubectl describe challenge -n jobpilot

# Check Azure DNS permissions
az role assignment list \
  --scope /subscriptions/{subscription-id}/resourceGroups/applyforus-prod-rg
```

### Getting Help

1. **Check Terraform State**
   ```bash
   terraform state list
   terraform state show <resource>
   ```

2. **Enable Debug Logging**
   ```bash
   export TF_LOG=DEBUG
   export TF_LOG_PATH=terraform-debug.log
   terraform apply
   ```

3. **View Azure Activity Logs**
   ```bash
   az monitor activity-log list \
     --resource-group applyforus-prod-rg \
     --offset 1h
   ```

4. **Check Resource Status**
   ```bash
   az resource list \
     --resource-group applyforus-prod-rg \
     --output table
   ```

## Maintenance

### Weekly Tasks

- [ ] Review monitoring dashboards
- [ ] Check for security alerts
- [ ] Verify backup jobs completed
- [ ] Monitor cost trends

### Monthly Tasks

- [ ] Review and optimize costs
- [ ] Check certificate expiration dates
- [ ] Update Terraform providers
- [ ] Review access controls
- [ ] Audit security configurations

### Quarterly Tasks

- [ ] Update AKS version
- [ ] Review disaster recovery procedures
- [ ] Test backup restoration
- [ ] Update documentation
- [ ] Conduct security audit

### Updating Infrastructure

```bash
# Pull latest changes
git pull origin main

# Review changes
terraform plan -var-file="environments/prod.tfvars"

# Apply updates during maintenance window
terraform apply -var-file="environments/prod.tfvars"

# Verify updates
kubectl get nodes
kubectl get pods --all-namespaces
```

### Disaster Recovery

1. **Backup Terraform State**
   ```bash
   terraform state pull > backup-$(date +%Y%m%d).tfstate
   ```

2. **Export DNS Records**
   ```bash
   az network dns record-set list \
     --resource-group applyforus-prod-rg \
     --zone-name applyforus.com \
     --output json > dns-backup.json
   ```

3. **Backup AKS Configuration**
   ```bash
   kubectl get all --all-namespaces -o yaml > k8s-backup.yaml
   ```

## Additional Resources

### Documentation

- [Azure DNS Nameservers](./azure_nameservers.md)
- [GoDaddy Setup Steps](./godaddy_setup_steps.md)
- [DNS Records Production](./dns_records_production.md)
- [SSL Configuration](./ssl_configuration.md)

### Official Documentation

- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Azure DNS Documentation](https://docs.microsoft.com/en-us/azure/dns/)
- [Application Gateway Documentation](https://docs.microsoft.com/en-us/azure/application-gateway/)

### Support

- **GitHub Issues**: Create an issue in the repository
- **Azure Support**: https://portal.azure.com/#blade/Microsoft_Azure_Support/HelpAndSupportBlade
- **Terraform Community**: https://discuss.hashicorp.com/

## License

Copyright © 2024 ApplyforUs. All rights reserved.

---

**Last Updated**: 2024-12-08
**Terraform Version**: 1.5.0+
**Azure Provider Version**: 3.85.0+
