# DevOps Quick Reference Card

Quick reference for common Azure DevOps operations on the JobPilot Platform.

---

## Emergency Contacts

- **DevOps Lead**: devops@jobpilot.ai
- **On-Call**: +1-XXX-XXX-XXXX
- **Azure Support**: https://portal.azure.com → Help + Support

---

## Quick Commands

### Health Checks

```bash
# Check all environments
for env in dev staging prod; do
  echo "=== $env ==="
  curl -s "https://jobpilot-$env-web.azurewebsites.net/api/health"
done

# Detailed health with smoke tests
./scripts/smoke-tests.sh prod
```

### Deployment

```bash
# Deploy to development
git push origin develop

# Deploy to production
git push origin main
# (Requires approval in Azure DevOps)

# Manual deployment
./scripts/deploy.sh prod $(date +%Y%m%d%H%M%S)
```

### Rollback

```bash
# Automatic rollback script
./scripts/rollback.sh prod

# Manual slot swap (blue-green)
az webapp deployment slot swap \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --slot staging \
  --target-slot production
```

### Logs

```bash
# Tail application logs
az webapp log tail \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg

# Download logs
az webapp log download \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --log-file logs.zip

# Query Application Insights
az monitor app-insights query \
  --app jobpilot-prod-appinsights \
  --analytics-query "exceptions | where timestamp > ago(1h) | take 10"
```

### Database

```bash
# Run migrations
./scripts/migrate-database.sh prod $DATABASE_URL

# Backup database
az sql db export \
  --name jobpilot_prod \
  --server jobpilot-prod-sql-{suffix} \
  --resource-group jobpilot-prod-rg \
  --admin-user sqladmin \
  --admin-password {password} \
  --storage-uri {blob-url}

# Restore database
az sql db restore \
  --dest-name jobpilot_prod_restored \
  --name jobpilot_prod \
  --resource-group jobpilot-prod-rg \
  --server jobpilot-prod-sql-{suffix} \
  --time "2025-01-01T12:00:00Z"
```

### Secrets

```bash
# View secret (not the value)
az keyvault secret show \
  --vault-name jobpilot-prod-kv-{suffix} \
  --name JWT-SECRET

# Set secret
az keyvault secret set \
  --vault-name jobpilot-prod-kv-{suffix} \
  --name JWT-SECRET \
  --value "new-secret-value"

# List all secrets
az keyvault secret list \
  --vault-name jobpilot-prod-kv-{suffix} \
  --output table
```

### Scaling

```bash
# Manual scale
az appservice plan update \
  --name jobpilot-prod-asp \
  --resource-group jobpilot-prod-rg \
  --number-of-workers 5

# View current scale
az appservice plan show \
  --name jobpilot-prod-asp \
  --resource-group jobpilot-prod-rg \
  --query sku
```

---

## Pipeline Troubleshooting

### Build Failures

**Linting errors**
```bash
# Run locally
pnpm run lint
pnpm run format:check
pnpm run type-check
```

**Docker build fails**
```bash
# Test Docker build locally
docker build -f docker/Dockerfile.node -t test .

# Check ACR connection
az acr login --name {acr-name}
```

### Deployment Failures

**Health check fails**
```bash
# Check app status
az webapp show \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg \
  --query state

# Check recent logs
az webapp log tail \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg
```

**Can't access Key Vault**
```bash
# Check managed identity
az webapp identity show \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg

# Check Key Vault policy
az keyvault show \
  --name jobpilot-prod-kv-{suffix} \
  --query properties.accessPolicies
```

---

## Monitoring

### Application Insights Queries

**Recent errors**
```kusto
exceptions
| where timestamp > ago(1h)
| summarize count() by type
| order by count_ desc
```

**Slow requests**
```kusto
requests
| where timestamp > ago(1h)
| where duration > 3000
| project timestamp, name, url, duration
| order by duration desc
```

**Failed dependencies**
```kusto
dependencies
| where timestamp > ago(1h)
| where success == false
| summarize count() by name, type
```

### Alerts

**View active alerts**
```bash
az monitor metrics alert list \
  --resource-group jobpilot-prod-rg \
  --output table
```

**Silence alert (temporarily)**
```bash
az monitor metrics alert update \
  --name {alert-name} \
  --resource-group jobpilot-prod-rg \
  --enabled false
```

---

## Cost Management

### View Costs

```bash
# Current month
az consumption usage list \
  --start-date $(date -d "1 month ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceId, 'jobpilot')]" \
  --output table

# By resource
az consumption usage list \
  --start-date $(date -d "1 month ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceId, 'jobpilot')] | [].{Resource:instanceName, Cost:pretaxCost}" \
  --output table
```

### Stop/Start Resources (Dev Only)

```bash
# Stop dev App Services (save costs)
az webapp stop --name jobpilot-dev-web --resource-group jobpilot-dev-rg
az webapp stop --name jobpilot-dev-auth --resource-group jobpilot-dev-rg
az webapp stop --name jobpilot-dev-ai --resource-group jobpilot-dev-rg

# Start dev App Services
az webapp start --name jobpilot-dev-web --resource-group jobpilot-dev-rg
az webapp start --name jobpilot-dev-auth --resource-group jobpilot-dev-rg
az webapp start --name jobpilot-dev-ai --resource-group jobpilot-dev-rg
```

---

## Infrastructure Updates

### Deploy Infrastructure Changes

```bash
# What-If (production)
az deployment sub what-if \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters.prod.json

# Apply changes
az deployment sub create \
  --name jobpilot-prod-update-$(date +%Y%m%d-%H%M%S) \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters infrastructure/azure/parameters.prod.json
```

### Validate Bicep

```bash
# Lint all templates
az bicep lint --file infrastructure/azure/main.bicep

for file in infrastructure/azure/modules/*.bicep; do
  az bicep lint --file "$file"
done

# Build to ARM
az bicep build --file infrastructure/azure/main.bicep
```

---

## Security

### Rotate Secrets

```bash
# Generate new JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)

# Update in Key Vault
az keyvault secret set \
  --vault-name jobpilot-prod-kv-{suffix} \
  --name JWT-SECRET \
  --value "$NEW_JWT_SECRET"

# Restart app services to pick up new secret
az webapp restart --name jobpilot-prod-web --resource-group jobpilot-prod-rg
az webapp restart --name jobpilot-prod-auth --resource-group jobpilot-prod-rg
az webapp restart --name jobpilot-prod-ai --resource-group jobpilot-prod-rg
```

### Audit Access

```bash
# Key Vault access logs
az monitor diagnostic-settings show \
  --resource-id /subscriptions/{sub-id}/resourceGroups/jobpilot-prod-rg/providers/Microsoft.KeyVault/vaults/jobpilot-prod-kv-{suffix} \
  --name {diagnostic-name}
```

---

## Common Issues

### Issue: 503 Service Unavailable

**Cause**: App not started or crashed
**Fix**:
```bash
az webapp restart --name {app-name} --resource-group {rg-name}
az webapp log tail --name {app-name} --resource-group {rg-name}
```

### Issue: Database Connection Timeout

**Cause**: Firewall or VNet issue
**Fix**:
```bash
# Add your IP to firewall
az sql server firewall-rule create \
  --resource-group {rg-name} \
  --server {server-name} \
  --name AllowMyIP \
  --start-ip-address {your-ip} \
  --end-ip-address {your-ip}
```

### Issue: High Response Times

**Cause**: Need to scale up
**Fix**:
```bash
# Scale up temporarily
az appservice plan update \
  --name jobpilot-prod-asp \
  --resource-group jobpilot-prod-rg \
  --sku P2v3

# Or increase workers
az appservice plan update \
  --name jobpilot-prod-asp \
  --resource-group jobpilot-prod-rg \
  --number-of-workers 10
```

### Issue: Out of Memory

**Cause**: Memory leak or insufficient resources
**Fix**:
```bash
# Restart app
az webapp restart --name {app-name} --resource-group {rg-name}

# Scale up if recurring
az appservice plan update \
  --name jobpilot-prod-asp \
  --resource-group jobpilot-prod-rg \
  --sku P2v3
```

---

## Useful URLs

### Azure Portal
- **Resource Groups**: https://portal.azure.com/#view/HubsExtension/BrowseResourceGroups
- **App Services**: https://portal.azure.com/#view/WebsitesExtension/HubsExtension/ResourceType/Microsoft.Web%2Fsites
- **SQL Databases**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.Sql%2Fservers%2Fdatabases
- **Key Vault**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/Microsoft.KeyVault%2Fvaults
- **Application Insights**: https://portal.azure.com/#view/HubsExtension/BrowseResource/resourceType/microsoft.insights%2Fcomponents

### Azure DevOps
- **Pipelines**: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_build
- **Environments**: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_environments
- **Variable Groups**: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_library?itemType=VariableGroups

---

## Resource Names Reference

### Development
- Resource Group: `jobpilot-dev-rg`
- Web App: `jobpilot-dev-web`
- Auth Service: `jobpilot-dev-auth`
- AI Service: `jobpilot-dev-ai`
- App Service Plan: `jobpilot-dev-asp`
- Key Vault: `jobpilot-dev-kv-{suffix}`
- SQL Server: `jobpilot-dev-sql-{suffix}`
- ACR: `jobpilotdevacr{suffix}`

### Staging
- Resource Group: `jobpilot-staging-rg`
- Web App: `jobpilot-staging-web`
- Auth Service: `jobpilot-staging-auth`
- AI Service: `jobpilot-staging-ai`
- App Service Plan: `jobpilot-staging-asp`
- Key Vault: `jobpilot-staging-kv-{suffix}`
- SQL Server: `jobpilot-staging-sql-{suffix}`
- ACR: `jobpilotstagingacr{suffix}`

### Production
- Resource Group: `jobpilot-prod-rg`
- Web App: `jobpilot-prod-web`
- Auth Service: `jobpilot-prod-auth`
- AI Service: `jobpilot-prod-ai`
- App Service Plan: `jobpilot-prod-asp`
- Key Vault: `jobpilot-prod-kv-{suffix}`
- SQL Server: `jobpilot-prod-sql-{suffix}`
- ACR: `jobpilotprodacr{suffix}`

---

**Last Updated**: 2025-01-04
**Maintained By**: DevOps Team
**Print and keep handy for quick reference!**
