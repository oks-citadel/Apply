# Azure Infrastructure Documentation

This directory contains the Azure infrastructure-as-code (IaC) using Bicep templates for the JobPilot Platform.

## Overview

The infrastructure is designed with the following principles:
- **Security First**: All secrets managed in Azure Key Vault, managed identities, network isolation
- **High Availability**: Zone redundancy, auto-scaling, health checks
- **Cost Optimization**: Environment-specific SKUs, auto-scaling policies
- **Observability**: Application Insights, diagnostic logs, alerts
- **Disaster Recovery**: Automated backups, geo-redundancy for production

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Azure Subscription                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Resource Group (per environment)               │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Web App    │  │ Auth Service │  │  AI Service  │     │ │
│  │  │  (Next.js)   │  │  (Node.js)   │  │  (Python)    │     │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │ │
│  │         │                  │                  │              │ │
│  │         └──────────────────┴──────────────────┘              │ │
│  │                            │                                 │ │
│  │                    ┌───────▼────────┐                       │ │
│  │                    │ App Service    │                       │ │
│  │                    │     Plan       │                       │ │
│  │                    └────────────────┘                       │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │ SQL Database │  │ Redis Cache  │  │ Service Bus  │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │  Key Vault   │  │ App Insights │  │     ACR      │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                              │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │        Virtual Network (with subnets)                │   │ │
│  │  │  • App Service Subnet                                │   │ │
│  │  │  • Database Subnet                                    │   │ │
│  │  │  • Cache Subnet                                       │   │ │
│  │  │  • Private Endpoints Subnet                           │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
infrastructure/azure/
├── main.bicep                      # Main orchestration template
├── parameters.dev.json             # Development parameters
├── parameters.staging.json         # Staging parameters
├── parameters.prod.json            # Production parameters
├── keyvault-secrets.md            # Secret documentation
├── README.md                       # This file
└── modules/
    ├── networking.bicep            # VNet, subnets, NSGs
    ├── container-registry.bicep    # Azure Container Registry
    ├── key-vault.bicep            # Azure Key Vault
    ├── app-insights.bicep         # Application Insights
    ├── sql-database.bicep         # Azure SQL Database
    ├── redis-cache.bicep          # Azure Cache for Redis
    ├── service-bus.bicep          # Azure Service Bus
    ├── app-service-plan.bicep     # App Service Plan with auto-scaling
    ├── app-services.bicep         # App Services (Web, Auth, AI)
    ├── key-vault-secrets.bicep    # Secret provisioning
    └── monitoring.bicep           # Alerts and action groups
```

## Prerequisites

1. **Azure CLI** (version 2.50.0 or later)
   ```bash
   az --version
   az upgrade
   ```

2. **Bicep CLI** (installed via Azure CLI)
   ```bash
   az bicep install
   az bicep version
   ```

3. **Azure Subscription** with sufficient permissions
   - Contributor role at subscription level (or specific resource groups)
   - User Access Administrator (for role assignments)

4. **Service Principal** for automated deployments
   ```bash
   az ad sp create-for-rbac --name "JobPilot-DevOps-SP" \
     --role Contributor \
     --scopes /subscriptions/{subscription-id}
   ```

## Environment-Specific Configurations

### Development Environment

- **Purpose**: Active development and testing
- **SKU**: Basic/Standard tier resources
- **Cost**: ~$200-300/month
- **Features**:
  - Single instance (no auto-scaling)
  - Basic monitoring
  - 7-day soft delete retention
  - Local redundancy only

### Staging Environment

- **Purpose**: Pre-production testing and validation
- **SKU**: Standard tier resources
- **Cost**: ~$400-600/month
- **Features**:
  - 2-5 instances with auto-scaling
  - Full monitoring and alerts
  - 30-day soft delete retention
  - Zone redundancy for critical services

### Production Environment

- **Purpose**: Live production workload
- **SKU**: Premium tier resources
- **Cost**: ~$800-1200/month
- **Features**:
  - 3-10 instances with auto-scaling
  - Full monitoring, alerts, and diagnostics
  - 90-day soft delete retention
  - Zone redundancy and geo-redundancy
  - Blue-green deployment support
  - Enhanced security (Defender, TDE, etc.)

## Deployment

### Initial Deployment

1. **Prepare Shared Resources** (one-time setup)

   Create a shared Key Vault for SQL admin credentials:

   ```bash
   # Create shared resource group
   az group create \
     --name jobpilot-shared-rg \
     --location eastus

   # Create shared Key Vault
   az keyvault create \
     --name jobpilot-shared-kv \
     --resource-group jobpilot-shared-rg \
     --location eastus

   # Store SQL admin credentials
   az keyvault secret set \
     --vault-name jobpilot-shared-kv \
     --name sql-admin-username \
     --value "sqladmin"

   az keyvault secret set \
     --vault-name jobpilot-shared-kv \
     --name sql-admin-password \
     --value "YourSecurePassword123!"
   ```

2. **Update Parameter Files**

   Edit `parameters.*.json` files and replace:
   - `{subscription-id}` with your Azure subscription ID
   - Adjust resource names if needed

3. **Validate Templates**

   ```bash
   # Lint Bicep files
   az bicep lint --file main.bicep

   # Build to ARM template (optional)
   az bicep build --file main.bicep
   ```

4. **Deploy to Development**

   ```bash
   az deployment sub create \
     --name jobpilot-dev-$(date +%Y%m%d-%H%M%S) \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.dev.json
   ```

5. **Deploy to Staging**

   ```bash
   az deployment sub create \
     --name jobpilot-staging-$(date +%Y%m%d-%H%M%S) \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.staging.json
   ```

6. **Deploy to Production**

   ```bash
   # Run What-If analysis first
   az deployment sub what-if \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.prod.json

   # Deploy after review
   az deployment sub create \
     --name jobpilot-prod-$(date +%Y%m%d-%H%M%S) \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.prod.json
   ```

### Update Existing Infrastructure

```bash
# Always run what-if first for production
az deployment sub what-if \
  --location eastus \
  --template-file main.bicep \
  --parameters parameters.prod.json

# Apply changes
az deployment sub create \
  --name jobpilot-prod-update-$(date +%Y%m%d-%H%M%S) \
  --location eastus \
  --template-file main.bicep \
  --parameters parameters.prod.json
```

### View Deployment Outputs

```bash
# Get deployment outputs
az deployment sub show \
  --name jobpilot-prod-20250101-120000 \
  --query properties.outputs

# Get specific output value
az deployment sub show \
  --name jobpilot-prod-20250101-120000 \
  --query properties.outputs.webAppUrl.value -o tsv
```

## Post-Deployment Configuration

### 1. Update Key Vault Secrets

Follow the instructions in [keyvault-secrets.md](./keyvault-secrets.md) to:
- Generate and store JWT secrets
- Add OpenAI API key
- Configure other application-specific secrets

### 2. Configure App Service Managed Identity

```bash
# Enable managed identity (already done by Bicep)
# Grant Key Vault access
az keyvault set-policy \
  --name jobpilot-prod-kv-abc123 \
  --object-id $(az webapp identity show --name jobpilot-prod-web --resource-group jobpilot-prod-rg --query principalId -o tsv) \
  --secret-permissions get list
```

### 3. Configure Deployment Slots (Production Only)

Deployment slots are created automatically by Bicep for production. Configure slot-specific settings:

```bash
# Configure slot settings
az webapp config appsettings set \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --slot staging \
  --settings NODE_ENV=staging
```

### 4. Set Up Custom Domains (Production)

```bash
# Add custom domain
az webapp config hostname add \
  --webapp-name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --hostname www.jobpilot.ai

# Bind SSL certificate
az webapp config ssl bind \
  --certificate-thumbprint {thumbprint} \
  --ssl-type SNI \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg
```

### 5. Configure Alerts

Alerts are created automatically by the monitoring module. Customize as needed:

```bash
# List all alerts
az monitor metrics alert list \
  --resource-group jobpilot-prod-rg

# Update alert threshold
az monitor metrics alert update \
  --name jobpilot-prod-cpu-alert-0 \
  --resource-group jobpilot-prod-rg \
  --set criteria.allOf[0].threshold=90
```

## Monitoring and Operations

### View Application Insights

```bash
# Get Application Insights resource
az monitor app-insights component show \
  --app jobpilot-prod-appinsights \
  --resource-group jobpilot-prod-rg

# Query for exceptions
az monitor app-insights query \
  --app jobpilot-prod-appinsights \
  --analytics-query "exceptions | where timestamp > ago(1h) | summarize count() by type"
```

### Database Operations

```bash
# List databases
az sql db list \
  --server jobpilot-prod-sql-abc123 \
  --resource-group jobpilot-prod-rg

# Create backup
az sql db export \
  --name jobpilot_prod \
  --server jobpilot-prod-sql-abc123 \
  --resource-group jobpilot-prod-rg \
  --admin-user sqladmin \
  --admin-password {password} \
  --storage-key-type StorageAccessKey \
  --storage-key {storage-key} \
  --storage-uri https://{storage-account}.blob.core.windows.net/backups/backup-{date}.bacpac
```

### Redis Cache Operations

```bash
# View cache metrics
az redis show \
  --name jobpilot-prod-redis-abc123 \
  --resource-group jobpilot-prod-rg

# Flush cache (use with caution!)
az redis force-reboot \
  --name jobpilot-prod-redis-abc123 \
  --resource-group jobpilot-prod-rg \
  --reboot-type AllNodes
```

## Cost Management

### View Current Costs

```bash
# Get resource group costs
az consumption usage list \
  --start-date 2025-01-01 \
  --end-date 2025-01-31 \
  --query "[?contains(instanceId, 'jobpilot-prod-rg')]" \
  --output table
```

### Cost Optimization Tips

1. **Auto-scaling**: Configured by default, ensure it's tuned to your traffic patterns
2. **Reserved Instances**: Consider for production workloads (40-60% savings)
3. **Development**: Stop dev resources outside business hours
4. **Database**: Use appropriate SKU (avoid over-provisioning)
5. **Storage**: Enable lifecycle policies for old backups

## Disaster Recovery

### Backup Strategy

- **SQL Database**: Automated backups (7-35 days retention based on environment)
- **Redis Cache**: Persistence enabled with AOF
- **Application Code**: Stored in Git and ACR
- **Infrastructure**: Infrastructure-as-Code in this repository

### Recovery Procedures

1. **App Service Restore**
   ```bash
   # Swap back to previous deployment slot
   az webapp deployment slot swap \
     --name jobpilot-prod-web \
     --resource-group jobpilot-prod-rg \
     --slot staging \
     --target-slot production
   ```

2. **Database Restore**
   ```bash
   # Restore from backup
   az sql db restore \
     --dest-name jobpilot_prod_restored \
     --name jobpilot_prod \
     --resource-group jobpilot-prod-rg \
     --server jobpilot-prod-sql-abc123 \
     --time "2025-01-01T12:00:00Z"
   ```

3. **Complete Environment Rebuild**
   ```bash
   # Redeploy infrastructure
   az deployment sub create \
     --name jobpilot-prod-disaster-recovery \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.prod.json
   ```

## Security

### Security Best Practices Implemented

- ✅ All secrets in Azure Key Vault
- ✅ Managed identities for service-to-service auth
- ✅ Network isolation with VNets
- ✅ TLS 1.2+ enforced
- ✅ SQL Transparent Data Encryption
- ✅ Diagnostic logging enabled
- ✅ Azure Defender (optional, configurable)
- ✅ Soft delete for Key Vault
- ✅ RBAC for resource access

### Security Checklist

- [ ] Review and customize NSG rules
- [ ] Configure custom domain with valid SSL
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable Advanced Threat Protection
- [ ] Configure backup retention policies
- [ ] Set up security alerts
- [ ] Regular security audits
- [ ] Penetration testing (annual)

## Troubleshooting

### Common Issues

**Issue: Deployment fails with "Conflict" error**
```
Solution: Resource name already exists. Check parameter files for uniqueness.
```

**Issue: App Service can't access Key Vault**
```bash
# Check managed identity
az webapp identity show --name {app-name} --resource-group {rg-name}

# Check Key Vault access policy
az keyvault show --name {kv-name} --query properties.accessPolicies
```

**Issue: Database connection timeout**
```
Solution: Check firewall rules and VNet integration
az sql server firewall-rule list --server {server-name} --resource-group {rg-name}
```

### Debugging Bicep Templates

```bash
# Validate syntax
az bicep lint --file main.bicep

# Build to see compiled ARM template
az bicep build --file main.bicep --outfile compiled.json

# Use what-if to preview changes
az deployment sub what-if \
  --location eastus \
  --template-file main.bicep \
  --parameters parameters.dev.json
```

## Support and Maintenance

### Regular Maintenance Tasks

- **Weekly**: Review Application Insights for errors
- **Monthly**: Review costs and optimize resources
- **Quarterly**: Secret rotation, security patches
- **Annually**: DR testing, architecture review

### Getting Help

- **Azure Documentation**: https://docs.microsoft.com/azure
- **Bicep Reference**: https://docs.microsoft.com/azure/azure-resource-manager/bicep
- **Team Support**: Contact DevOps team

## References

- [Azure Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep)
- [Azure App Service Best Practices](https://docs.microsoft.com/azure/app-service/app-service-best-practices)
- [Azure SQL Database Best Practices](https://docs.microsoft.com/azure/sql-database/sql-database-best-practices)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/azure/key-vault/general/best-practices)
- [Azure Well-Architected Framework](https://docs.microsoft.com/azure/architecture/framework)
