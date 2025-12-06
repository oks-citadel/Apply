# DevOps Deployment Guide - JobPilot Platform

## Overview

This guide provides a comprehensive walkthrough for deploying the JobPilot Platform to Azure using Azure DevOps pipelines.

## Architecture Summary

The JobPilot Platform uses a modern microservices architecture deployed on Azure:

- **Frontend**: Next.js web application
- **Backend Services**:
  - Auth Service (Node.js/Express)
  - AI Service (Python/FastAPI)
- **Data Layer**:
  - Azure SQL Database (PostgreSQL-compatible)
  - Azure Cache for Redis
  - Azure Service Bus
- **Infrastructure**:
  - Azure App Services (with deployment slots)
  - Azure Container Registry
  - Azure Key Vault
  - Application Insights
  - Virtual Network with subnets

## Quick Start

### Prerequisites Checklist

- [ ] Azure subscription with Contributor access
- [ ] Azure DevOps organization and project
- [ ] Git repository connected to Azure DevOps
- [ ] Azure CLI installed locally (for initial setup)
- [ ] Docker Desktop installed (for local testing)

### Step 1: Azure DevOps Setup

1. **Create Service Connections**

   Navigate to: Project Settings > Service Connections

   a. **Azure Resource Manager**
   ```
   Name: JobPilot-Azure-Subscription
   Scope: Subscription
   Authentication: Service Principal (automatic)
   ```

   b. **Azure Container Registry**
   ```
   Name: JobPilot-ACR-Connection
   Registry: Will be created by infrastructure deployment
   ```

2. **Create Environments**

   Navigate to: Pipelines > Environments

   Create the following environments with approval gates:

   - `development` - No approvals
   - `development-infrastructure` - No approvals
   - `staging` - Optional: require 1 approval
   - `staging-infrastructure` - Require 1 approval
   - `production` - **Require 2 approvals from different users**
   - `production-infrastructure` - **Require 2 approvals from different users**

3. **Configure Variable Groups**

   Follow [.azure/variable-groups.md](.azure/variable-groups.md) to create:
   - `dev-secrets`
   - `staging-secrets`
   - `prod-secrets`

### Step 2: Infrastructure Deployment

1. **Deploy Infrastructure for Dev Environment**

   ```bash
   # Option A: Using Azure CLI locally
   cd infrastructure/azure
   az deployment sub create \
     --name jobpilot-dev-initial \
     --location eastus \
     --template-file main.bicep \
     --parameters parameters.dev.json

   # Option B: Using Azure DevOps Pipeline
   # Push infrastructure code to 'develop' branch
   # Pipeline .azure/azure-pipelines-infra.yml will run automatically
   ```

2. **Capture Deployment Outputs**

   ```bash
   # Get important values from deployment
   az deployment sub show \
     --name jobpilot-dev-initial \
     --query properties.outputs > deployment-outputs.json
   ```

3. **Update Variable Groups**

   Add the following values from deployment outputs to variable groups:

   ```
   ACR_NAME: <from containerRegistryName output>
   ACR_LOGIN_SERVER: <from containerRegistryLoginServer output>
   RESOURCE_GROUP: <from resourceGroupName output>
   WEB_APP_NAME: <from webAppName output>
   AUTH_SERVICE_NAME: <from authServiceName output>
   AI_SERVICE_NAME: <from aiServiceName output>
   ```

4. **Configure Secrets in Key Vault**

   Follow [infrastructure/azure/keyvault-secrets.md](infrastructure/azure/keyvault-secrets.md):

   ```bash
   # Generate JWT secret
   JWT_SECRET=$(openssl rand -base64 64)

   # Store in Key Vault
   az keyvault secret set \
     --vault-name <your-keyvault-name> \
     --name JWT-SECRET \
     --value "$JWT_SECRET"

   # Repeat for other secrets:
   # - OPENAI-API-KEY (from OpenAI dashboard)
   # - SESSION-SECRET
   # - ENCRYPTION-KEY
   # etc.
   ```

### Step 3: Application Deployment

1. **Configure CI/CD Pipeline**

   The main pipeline is defined in `azure-pipelines-enhanced.yml`.

   **Option A: Use Enhanced Pipeline (Recommended)**
   ```bash
   # Rename enhanced pipeline to be the main one
   mv azure-pipelines.yml azure-pipelines.old.yml
   mv azure-pipelines-enhanced.yml azure-pipelines.yml
   git add .
   git commit -m "Switch to enhanced CI/CD pipeline"
   git push
   ```

   **Option B: Keep Both Pipelines**
   - Configure both pipelines in Azure DevOps
   - Use enhanced pipeline for production deployments
   - Use simple pipeline for quick validation

2. **First Application Deployment**

   ```bash
   # Commit and push to develop branch
   git checkout develop
   git add .
   git commit -m "Initial application deployment"
   git push origin develop

   # Pipeline will automatically:
   # 1. Run tests
   # 2. Build Docker images
   # 3. Push to ACR
   # 4. Deploy to dev environment
   ```

3. **Monitor Deployment**

   - Navigate to Azure DevOps > Pipelines
   - Watch build and deployment stages
   - Check logs for any errors

4. **Verify Deployment**

   ```bash
   # Run smoke tests
   ./scripts/smoke-tests.sh dev

   # Or manually check endpoints
   curl https://jobpilot-dev-web.azurewebsites.net/api/health
   curl https://jobpilot-dev-auth.azurewebsites.net/health
   curl https://jobpilot-dev-ai.azurewebsites.net/health
   ```

### Step 4: Production Deployment

1. **Deploy Infrastructure to Production**

   ```bash
   # Merge develop to main
   git checkout main
   git merge develop
   git push origin main

   # Infrastructure pipeline will:
   # 1. Deploy to staging (automatic)
   # 2. Wait for approval
   # 3. Deploy to production (after approval)
   ```

2. **Configure Production Secrets**

   Generate **new, different** secrets for production:

   ```bash
   # Generate production secrets (different from dev!)
   PROD_JWT_SECRET=$(openssl rand -base64 64)
   PROD_SESSION_SECRET=$(openssl rand -hex 32)
   PROD_ENCRYPTION_KEY=$(openssl rand -base64 32)

   # Store in production Key Vault
   az keyvault secret set --vault-name jobpilot-prod-kv-{suffix} --name JWT-SECRET --value "$PROD_JWT_SECRET"
   az keyvault secret set --vault-name jobpilot-prod-kv-{suffix} --name SESSION-SECRET --value "$PROD_SESSION_SECRET"
   az keyvault secret set --vault-name jobpilot-prod-kv-{suffix} --name ENCRYPTION-KEY --value "$PROD_ENCRYPTION_KEY"
   az keyvault secret set --vault-name jobpilot-prod-kv-{suffix} --name OPENAI-API-KEY --value "sk-your-production-key"
   ```

3. **Deploy Application to Production**

   The pipeline will automatically:
   1. Build and test on main branch
   2. Deploy to staging slot
   3. Run smoke tests on staging slot
   4. **Wait for manual approval**
   5. Perform blue-green swap
   6. Monitor for issues
   7. Auto-rollback if health checks fail

4. **Post-Deployment Verification**

   ```bash
   # Run comprehensive smoke tests
   ./scripts/smoke-tests.sh prod

   # Monitor Application Insights
   az monitor app-insights query \
     --app jobpilot-prod-appinsights \
     --analytics-query "requests | where timestamp > ago(10m) | summarize count() by resultCode"
   ```

## Deployment Workflows

### Development Workflow

```
Developer pushes to 'develop' branch
    ↓
Azure DevOps Pipeline triggers
    ↓
[Build Stage]
├── Install dependencies
├── Run linters
├── Type check
└── Security audit
    ↓
[Test Stage]
├── Unit tests
├── Integration tests
└── Code coverage
    ↓
[Build Docker Images]
├── Web App image
├── Auth Service image
└── AI Service image
    ↓
[Deploy to Dev]
├── Run database migrations
├── Deploy containers to App Services
├── Run smoke tests
└── Send notification
```

### Production Workflow

```
Developer merges to 'main' branch
    ↓
Azure DevOps Pipeline triggers
    ↓
[Build & Test] (same as dev)
    ↓
[Build Docker Images]
    ↓
[Deploy to Staging Slot]
├── Deploy to staging slot
├── Run smoke tests on staging
└── Wait for approval ⏸️
    ↓
[Production Deployment]
├── Backup current state
├── Run database migrations
├── Perform blue-green swap
├── Run production smoke tests
└── Monitor health for 5 minutes
    ↓
[Post-Deployment]
├── Send success notification
└── Update deployment documentation
```

## Blue-Green Deployment

Production uses blue-green deployment strategy:

1. **Blue (Current Production)**: Currently serving live traffic
2. **Green (New Version)**: Deployed to staging slot
3. **Validation**: Tests run against green slot
4. **Swap**: Green becomes blue (instant switchover)
5. **Monitoring**: Watch for issues
6. **Rollback**: Swap back if needed (one command)

### Manual Blue-Green Swap

```bash
# Swap staging slot to production
az webapp deployment slot swap \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --slot staging

# If issues occur, swap back
az webapp deployment slot swap \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --slot staging \
  --target-slot production
```

## Rollback Procedures

### Automatic Rollback

The pipeline includes automatic rollback on:
- Health check failures
- Smoke test failures
- High error rates

### Manual Rollback

```bash
# Option 1: Use rollback script
./scripts/rollback.sh prod

# Option 2: Azure CLI
az webapp deployment slot swap \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --slot staging \
  --target-slot production

# Option 3: Redeploy previous version
az webapp deployment list-publishing-credentials \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg
```

## Database Migrations

### Migration Strategy

1. **Backward Compatible Migrations**: All migrations must be backward compatible
2. **Testing**: Test migrations in dev and staging first
3. **Backup**: Automatic backup before production migrations
4. **Monitoring**: Watch for errors after migration

### Running Migrations

```bash
# Automatic (via pipeline)
# Migrations run automatically during deployment

# Manual (if needed)
./scripts/migrate-database.sh prod $DATABASE_URL
```

### Migration Rollback

```bash
# If using Prisma
pnpm exec prisma migrate resolve --rolled-back {migration-name}

# Restore database from backup
az sql db restore \
  --dest-name jobpilot_prod_restored \
  --name jobpilot_prod \
  --resource-group jobpilot-prod-rg \
  --server jobpilot-prod-sql-{suffix} \
  --time "2025-01-01T12:00:00Z"
```

## Monitoring and Alerts

### Application Insights Dashboards

Access dashboards at:
```
https://portal.azure.com > Application Insights > jobpilot-{env}-appinsights
```

Key metrics to monitor:
- Request rate and response times
- Failed requests and exceptions
- Dependency failures
- Custom events

### Configured Alerts

The infrastructure automatically creates alerts for:

1. **CPU Usage** > 80% (5-minute average)
2. **Memory Usage** > 85% (5-minute average)
3. **HTTP 5xx Errors** > 10 in 5 minutes
4. **Response Time** > 3 seconds (average)
5. **Database DTU** > 80%
6. **Redis CPU** > 80%

### Setting Up Custom Alerts

```bash
# Example: Alert on high exception rate
az monitor metrics alert create \
  --name high-exception-rate \
  --resource-group jobpilot-prod-rg \
  --scopes /subscriptions/{sub-id}/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Insights/components/jobpilot-prod-appinsights \
  --condition "count exceptions > 50" \
  --window-size 5m \
  --evaluation-frequency 1m
```

## Security Considerations

### Secrets Management

- ✅ All secrets stored in Azure Key Vault
- ✅ Secrets referenced via App Service configuration
- ✅ Managed identities for service authentication
- ✅ No secrets in source code or pipeline logs

### Network Security

- ✅ VNet integration for App Services
- ✅ Service endpoints for Azure services
- ✅ Network Security Groups (NSGs)
- ✅ Private endpoints for sensitive resources

### Compliance

- ✅ Audit logging enabled
- ✅ Diagnostic logs retained
- ✅ TLS 1.2+ enforced
- ✅ SQL Transparent Data Encryption
- ✅ Regular security scans

## Cost Management

### Monthly Cost Estimates

| Environment | Estimated Cost | Notes |
|------------|---------------|-------|
| Development | $200-300 | Basic/Standard SKUs |
| Staging | $400-600 | Standard SKUs, limited scaling |
| Production | $800-1200 | Premium SKUs, full features |

### Cost Optimization Tips

1. **Auto-scaling**: Properly configured to scale down during low traffic
2. **Dev Shutdown**: Consider stopping dev resources outside business hours
3. **Reserved Instances**: Save 40-60% on production workloads
4. **Right-sizing**: Monitor usage and adjust SKUs
5. **Lifecycle Policies**: Auto-delete old backups

### Monitor Costs

```bash
# View current month costs
az consumption usage list \
  --start-date $(date -d "1 month ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --output table

# Set up cost alerts in Azure Portal
# Portal > Cost Management + Billing > Cost alerts
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Pipeline Fails at "Build Docker Images"

**Symptoms**: Docker build fails with authentication error

**Solution**:
```bash
# Check ACR service connection
az acr show --name {acr-name} --query loginServer

# Verify service connection in Azure DevOps
# Pipelines > Library > Service Connections
```

#### 2. App Service Shows "503 Service Unavailable"

**Symptoms**: Application not starting, health check failing

**Solution**:
```bash
# Check application logs
az webapp log tail --name {app-name} --resource-group {rg-name}

# Common causes:
# - Missing environment variables
# - Key Vault access denied
# - Database connection failure
```

#### 3. Database Migration Fails

**Symptoms**: Migration step fails in pipeline

**Solution**:
```bash
# Check database firewall rules
az sql server firewall-rule list \
  --server {server-name} \
  --resource-group {rg-name}

# Verify connection string in Key Vault
az keyvault secret show \
  --vault-name {kv-name} \
  --name DATABASE-URL \
  --query value -o tsv
```

#### 4. Slow Response Times

**Symptoms**: Application Insights shows high response times

**Solution**:
```bash
# Check App Service Plan scaling
az appservice plan show \
  --name {plan-name} \
  --resource-group {rg-name} \
  --query sku

# Review auto-scaling rules
az monitor autoscale show \
  --resource-group {rg-name} \
  --name {autoscale-name}
```

## Maintenance Tasks

### Daily
- Review Application Insights for errors
- Check pipeline execution results

### Weekly
- Review and merge dependabot PRs
- Update npm/pip packages
- Check cost trends

### Monthly
- Review and optimize auto-scaling rules
- Analyze performance metrics
- Update documentation

### Quarterly
- Rotate secrets (JWT, API keys)
- Security audit
- Disaster recovery drill
- Review and optimize costs

### Annually
- Major version upgrades
- Architecture review
- Penetration testing
- Compliance audit

## Support and Resources

### Documentation
- [Infrastructure README](infrastructure/azure/README.md)
- [Variable Groups Guide](.azure/variable-groups.md)
- [Key Vault Secrets Guide](infrastructure/azure/keyvault-secrets.md)

### Azure Documentation
- [App Service](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure DevOps Pipelines](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Bicep](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

### Getting Help
- DevOps Team: devops@jobpilot.ai
- Azure Support: https://portal.azure.com > Help + Support
- Stack Overflow: [azure-devops] tag

## Appendix

### A. Environment Variables Reference

See [.env.example](.env.example) for complete list of environment variables.

### B. Pipeline Variables Reference

See [.azure/variable-groups.md](.azure/variable-groups.md) for complete list.

### C. Azure Resources by Environment

| Resource Type | Development | Staging | Production |
|--------------|-------------|---------|------------|
| App Service Plan | B2 | S1 | P1v3 |
| SQL Database | Basic | S1 | S3 |
| Redis Cache | Basic C0 | Standard C1 | Premium P1 |
| ACR | Standard | Standard | Premium |
| Key Vault | Standard | Standard | Premium |

### D. Useful Commands

```bash
# Quick health check all environments
for env in dev staging prod; do
  echo "=== $env ==="
  curl -s "https://jobpilot-$env-web.azurewebsites.net/api/health" | jq
done

# View all deployments
az deployment sub list --output table

# Export infrastructure to ARM template
az bicep build --file infrastructure/azure/main.bicep

# Generate deployment diagram
# Use Azure Portal > Resource Group > Deployments > Visualize
```

---

**Version**: 1.0
**Last Updated**: 2025-01-04
**Maintained By**: DevOps Team
