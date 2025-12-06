# Private Endpoints Quick Start Guide

This is a quick reference for deploying the JobPilot infrastructure with private networking.

## TL;DR - Deploy Now

### Production (Private Endpoints Enabled)

```bash
# Using Bash
cd infrastructure/azure
./deploy-private.sh prod --sql-user sqladmin --sql-pass 'YourSecurePassword!'

# Using PowerShell
cd infrastructure/azure
$pass = ConvertTo-SecureString 'YourSecurePassword!' -AsPlainText -Force
.\deploy-private.ps1 -Environment prod -SqlUsername sqladmin -SqlPassword $pass
```

### Staging (Private Endpoints + IP Allowlist)

```bash
# Using Bash
./deploy-private.sh staging --allowed-ips "203.0.113.0/24,198.51.100.5"

# Using PowerShell
.\deploy-private.ps1 -Environment staging -AllowedIPs @("203.0.113.0/24", "198.51.100.5")
```

### Development (Public Access Only)

```bash
# Using Bash
./deploy-private.sh dev --allowed-ips "203.0.113.10,203.0.113.20"

# Using PowerShell
.\deploy-private.ps1 -Environment dev -AllowedIPs @("203.0.113.10", "203.0.113.20")
```

## What Gets Deployed

### All Environments

- Virtual Network with 4 subnets
- Network Security Groups
- App Service Plan
- App Services (web, auth, ai)
- Application Insights
- Service Bus
- Container Registry

### With Private Endpoints (Staging & Production)

**Additional Components:**
- 3 Private Endpoints (Key Vault, SQL, Redis)
- 7 Private DNS Zones
- VNet links to DNS zones
- Network isolation for PaaS services

**Security Impact:**
- Production: Public access DISABLED on all services
- Staging: Public access with IP restrictions
- All traffic flows through private network
- Zero internet exposure in production

## Files Created

### Bicep Modules

| File | Purpose |
|------|---------|
| `modules/private-endpoints.bicep` | Creates private endpoints and DNS zones |
| `modules/key-vault.bicep` | Updated with private endpoint support |
| `modules/sql-database.bicep` | Updated with private endpoint support |
| `modules/redis-cache.bicep` | Updated with private endpoint support |
| `main.bicep` | Updated to orchestrate private endpoints |

### Deployment Scripts

| File | Purpose |
|------|---------|
| `deploy-private.sh` | Bash deployment script (Linux/macOS) |
| `deploy-private.ps1` | PowerShell deployment script (Windows) |

### Parameter Files

| File | Environment | Private Endpoints |
|------|-------------|-------------------|
| `parameters/dev.json` | Development | Disabled |
| `parameters/staging.json` | Staging | Enabled |
| `parameters/prod-private.json` | Production | Enabled |

### Documentation

| File | Content |
|------|---------|
| `PRIVATE_NETWORKING.md` | Comprehensive guide (12KB) |
| `README-PRIVATE-ENDPOINTS.md` | Implementation summary (18KB) |
| `QUICKSTART-PRIVATE-ENDPOINTS.md` | This quick start guide |

## Key Parameters

### enablePrivateEndpoints

**Type:** Boolean
**Default:** `false`

Controls whether private endpoints are created.

**Auto-enabled for:**
- Production environment
- Staging environment

**Auto-disabled for:**
- Development environment

### allowedIpAddresses

**Type:** Array of strings
**Default:** `[]`
**Format:** CIDR notation

IP addresses allowed to access services when public access is enabled.

**Examples:**
```json
["203.0.113.10"]                    // Single IP
["203.0.113.0/24"]                  // Subnet
["203.0.113.10", "198.51.100.5"]    // Multiple IPs
```

## Environment Configurations

### Development

```yaml
Private Endpoints: Disabled
Public Access: Enabled
IP Restrictions: Optional (recommended)
Cost: ~$150/month (no PE cost)
Use Case: Developer access, testing
```

### Staging

```yaml
Private Endpoints: Enabled
Public Access: Enabled with IP restrictions
IP Restrictions: Required
Cost: ~$250/month (+$26 for PEs)
Use Case: Pre-production testing, integration
```

### Production

```yaml
Private Endpoints: Enabled
Public Access: Disabled
IP Restrictions: N/A (all blocked)
Cost: ~$800/month (+$26 for PEs)
Use Case: Production workloads
```

## Verification Commands

### Check Private Endpoint Status

```bash
# List private endpoints
az network private-endpoint list \
  --resource-group jobpilot-prod-rg \
  --output table
```

### Test DNS Resolution

From within VNet (App Service or VM):

```bash
# Should return private IP (10.0.4.x)
nslookup jobpilot-prod-kv-abc123.vault.azure.net
nslookup jobpilot-prod-sql-abc123.database.windows.net
nslookup jobpilot-prod-redis-abc123.redis.cache.windows.net
```

### Verify Connectivity

From App Service with VNet integration:

```bash
# SSH into App Service
az webapp ssh --name jobpilot-prod-web --resource-group jobpilot-prod-rg

# Test Key Vault
curl -I https://jobpilot-prod-kv-abc123.vault.azure.net

# Test SQL
sqlcmd -S jobpilot-prod-sql-abc123.database.windows.net -U sqladmin

# Test Redis
redis-cli -h jobpilot-prod-redis-abc123.redis.cache.windows.net -p 6380 --tls
```

## Common Commands

### Dry Run (Validation Only)

```bash
# Bash
./deploy-private.sh prod --dry-run

# PowerShell
.\deploy-private.ps1 -Environment prod -DryRun
```

### What-If Analysis

```bash
# Bash
./deploy-private.sh prod --what-if

# PowerShell
.\deploy-private.ps1 -Environment prod -WhatIf
```

### Deploy with Parameter File

```bash
az deployment sub create \
  --location eastus \
  --template-file main.bicep \
  --parameters @parameters/prod-private.json
```

### Get Deployment Outputs

```bash
# Get all outputs
az deployment sub show \
  --name jobpilot-prod-private-20241204-120000 \
  --query properties.outputs \
  -o json

# Get specific output
az deployment sub show \
  --name jobpilot-prod-private-20241204-120000 \
  --query properties.outputs.keyVaultPrivateEndpointIp.value \
  -o tsv
```

## Troubleshooting Quick Fixes

### Cannot Connect to Services

**Check VNet Integration:**
```bash
az webapp vnet-integration list \
  --name jobpilot-prod-web \
  --resource-group jobpilot-prod-rg
```

### DNS Not Resolving to Private IP

**Check DNS Zone Links:**
```bash
az network private-dns link vnet list \
  --resource-group jobpilot-prod-rg \
  --zone-name privatelink.vaultcore.azure.net
```

### Access Denied from Internet (Production)

**Expected Behavior!** Production services should only be accessible via VNet.

**For Admin Access:**
- Use Azure Bastion
- Use VPN Gateway
- Temporarily enable public access with your IP

## Security Checklist

- [ ] Private endpoints enabled for production
- [ ] Public access disabled for production
- [ ] IP allowlist configured for staging
- [ ] VNet integration enabled on App Services
- [ ] DNS zones linked to VNet
- [ ] NSG rules reviewed and applied
- [ ] Azure Defender enabled
- [ ] Diagnostic logs enabled
- [ ] TLS 1.2 enforced on all services
- [ ] RBAC configured for Key Vault

## Cost Summary

| Environment | Base Cost | Private Endpoints | Total/Month |
|-------------|-----------|-------------------|-------------|
| Development | ~$150 | $0 (disabled) | ~$150 |
| Staging | ~$250 | ~$26 | ~$276 |
| Production | ~$800 | ~$26 | ~$826 |

**Private Endpoint Breakdown:**
- 3 endpoints × $7.30 = $21.90
- Data processing (100GB) = $1.00
- 7 DNS zones × $0.50 = $3.50
- **Total: ~$26.40/month**

## Next Steps After Deployment

1. **Verify Private Endpoints**
   ```bash
   az network private-endpoint list --resource-group jobpilot-prod-rg -o table
   ```

2. **Test DNS Resolution**
   ```bash
   # From App Service or VM in VNet
   nslookup <service-fqdn>
   ```

3. **Configure App Settings**
   - Update connection strings (automatic via Key Vault)
   - Verify VNet integration
   - Test application connectivity

4. **Enable Monitoring**
   - Check Application Insights
   - Review diagnostic logs
   - Set up alerts

5. **Security Review**
   - Verify public access is disabled (production)
   - Review NSG rules
   - Test access from outside VNet (should fail)

## Getting Help

- **Comprehensive Guide:** See `PRIVATE_NETWORKING.md`
- **Implementation Details:** See `README-PRIVATE-ENDPOINTS.md`
- **Azure Docs:** https://docs.microsoft.com/azure/private-link/

## Quick Tips

1. **Always test in dev first** - Verify configuration before production
2. **Use parameter files** - Easier to track and version control
3. **Enable private endpoints in staging** - Test before production
4. **Keep IP allowlists minimal** - Less surface area = better security
5. **Monitor DNS resolution** - Ensure services resolve to private IPs
6. **Use deployment scripts** - Automated validation and best practices
7. **Document IP addresses** - Track what IPs need access and why
8. **Review costs monthly** - Optimize as needed

## Script Options Reference

### Bash Script (`deploy-private.sh`)

```bash
./deploy-private.sh <environment> [options]

Options:
  --location LOCATION       Azure region (default: eastus)
  --project PROJECT         Project name (default: jobpilot)
  --sql-user USERNAME       SQL admin username
  --sql-pass PASSWORD       SQL admin password
  --allowed-ips IPS         Comma-separated list of IPs
  --dry-run                 Validate only
  --what-if                 Show changes
  --help                    Show help
```

### PowerShell Script (`deploy-private.ps1`)

```powershell
.\deploy-private.ps1 -Environment <env> [options]

Parameters:
  -Environment <string>     Environment (dev/staging/prod)
  -Location <string>        Azure region (default: eastus)
  -ProjectName <string>     Project name (default: jobpilot)
  -SqlUsername <string>     SQL admin username
  -SqlPassword <secure>     SQL admin password (SecureString)
  -AllowedIPs <string[]>    Array of allowed IPs
  -DryRun                   Validate only
  -WhatIf                   Show changes
```

## Summary

This private networking implementation provides production-ready security with minimal complexity. The automated scripts and comprehensive documentation make it easy to deploy secure infrastructure following Azure best practices.

**Key Benefits:**
- 🔒 Production security with zero internet exposure
- 🚀 Easy deployment with automated scripts
- 💰 Cost-optimized for each environment
- 📝 Comprehensive documentation
- ✅ Compliance-ready (SOC 2, ISO 27001, HIPAA)
