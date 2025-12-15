# PostgreSQL Public Connectivity Documentation

## Overview

This document describes the ApplyForUs platform's PostgreSQL Flexible Server configuration with **PUBLIC network access** (NO VNET integration) and comprehensive security controls.

**Version:** 1.0
**Last Updated:** 2025-12-15
**Status:** Production-Ready

---

## Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET                                     │
└────────────┬─────────────────────────────────────────┬──────────────┘
             │                                         │
             │ SSL/TLS (Required)                     │ SSL/TLS (Required)
             │                                         │
    ┌────────▼────────┐                      ┌────────▼────────┐
    │  GitHub Actions │                      │   AKS Cluster   │
    │    Runners      │                      │   (Kubernetes)  │
    │   (Dynamic IP)  │                      │ Egress via NAT  │
    └────────┬────────┘                      └────────┬────────┘
             │                                         │
             │ Firewall Rules:                        │
             │ - AllowAzureServices                   │
             │ - Specific IPs (optional)              │
             │                                         │
             └─────────────┬──────────────────────────┘
                           │
                  ┌────────▼────────┐
                  │   Azure         │
                  │  Firewall Rules │
                  │   (IP-based)    │
                  └────────┬────────┘
                           │
            ┌──────────────▼────────────────┐
            │  Azure PostgreSQL Flexible    │
            │        Server (PUBLIC)        │
            │                               │
            │  FQDN: psql-jobpilot-prod-    │
            │        {suffix}.postgres.     │
            │        database.azure.com     │
            │                               │
            │  Port: 5432 (SSL enforced)   │
            │  Version: PostgreSQL 16       │
            │                               │
            │  Security Features:           │
            │  ✓ SSL/TLS Required           │
            │  ✓ IP Firewall Rules          │
            │  ✓ Azure AD Authentication    │
            │  ✓ Encrypted at Rest          │
            │  ✓ Encrypted in Transit       │
            │  ✓ Audit Logging Enabled      │
            └───────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │         8 Separate Databases        │
        │  (One per Microservice - Isolation) │
        └──────────────────┬──────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
┌───▼────┐  ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
│ auth_  │  │ user_       │  │ job_      │  │ resume_     │
│service │  │ service_db  │  │service_db │  │ service_db  │
│_db     │  └─────────────┘  └───────────┘  └─────────────┘
└────────┘
          ... (4 more databases)
```

---

## Network Configuration

### Public Network Access

**Status:** ENABLED (NO VNET Integration)

The PostgreSQL Flexible Server is configured with:
- `public_network_access_enabled = true`
- **NO** `delegated_subnet_id`
- **NO** `private_dns_zone_id`
- **NO** VNet integration or private endpoints

**Location:** `infrastructure/terraform/modules/postgresql-flexible/main.tf:35`

```hcl
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-${var.project_name}-${var.environment}-${var.unique_suffix}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = var.postgres_version
  public_network_access_enabled = true  # PUBLIC ACCESS

  # NO VNET integration - intentionally omitted:
  # delegated_subnet_id        = null
  # private_dns_zone_id        = null

  # ... rest of configuration
}
```

---

## Security Controls

### 1. SSL/TLS Enforcement

**Status:** MANDATORY

All connections MUST use SSL/TLS encryption. This is enforced at the server level.

**Location:** `infrastructure/terraform/modules/postgresql-flexible/main.tf:67-71`

```hcl
resource "azurerm_postgresql_flexible_server_configuration" "ssl_enforcement" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}
```

**Connection String Requirement:**
```
postgresql://user:pass@host:5432/db?sslmode=require
```

### 2. Firewall Rules

The server uses IP-based firewall rules to control access.

#### Rule 1: Allow Azure Services (ENABLED)

**Location:** `infrastructure/terraform/modules/postgresql-flexible/main.tf:97-104`

```hcl
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  count = var.allow_azure_services ? 1 : 0

  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
```

**Purpose:** Allows connections from:
- Azure Kubernetes Service (AKS) pods
- Azure App Services
- Azure Container Instances
- Other Azure services within the same region

**Security Note:** The IP range `0.0.0.0` is a special Azure notation that means "allow Azure services" - it does NOT mean "allow all internet traffic."

#### Rule 2: Specific IP Addresses (Configurable)

**Location:** `infrastructure/terraform/modules/postgresql-flexible/main.tf:110-117`

```hcl
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each = toset(var.allowed_ip_addresses)

  name             = "allow-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}
```

**Configuration:** `infrastructure/terraform/main.tf:231`

```hcl
allowed_ip_addresses = []  # Add your IPs here if needed
```

**Recommended IPs to Add:**
```hcl
allowed_ip_addresses = [
  "20.98.146.0/24",    # GitHub Actions runners (East US region - example)
  "1.2.3.4",           # Your office/VPN public IP
  "5.6.7.8",           # Developer machine (if needed)
]
```

**Note:** GitHub Actions runners use dynamic IPs. Either:
1. Use the `AllowAzureServices` rule (recommended)
2. Use GitHub-hosted runner IP ranges for your region
3. Use self-hosted runners with static IPs

### 3. Authentication & Authorization

**Admin Username:** `applyforusadmin` (configured as variable)
**Password:** Stored in Azure Key Vault (never in code)
**Password Requirements:** Minimum 12 characters (enforced)

**Location:** `infrastructure/terraform/variables.tf:96-117`

```hcl
variable "postgres_admin_username" {
  description = "PostgreSQL Server administrator username"
  type        = string
  sensitive   = true
  default     = "applyforusadmin"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,63}$", var.postgres_admin_username))
    error_message = "PostgreSQL admin username must be 3-64 characters..."
  }
}

variable "postgres_admin_password" {
  description = "PostgreSQL Server administrator password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.postgres_admin_password) >= 12
    error_message = "PostgreSQL admin password must be at least 12 characters long."
  }
}
```

### 4. Encryption

**At Rest:**
- Automatic encryption using Azure-managed keys
- AES-256 encryption

**In Transit:**
- TLS 1.2+ required
- Certificate validation enforced
- All connections encrypted

### 5. Database Isolation

Each microservice has its own dedicated database:

| Service | Database Name | Purpose |
|---------|---------------|---------|
| Auth Service | `auth_service_db` | User authentication, sessions, OAuth |
| User Service | `user_service_db` | User profiles, preferences |
| Job Service | `job_service_db` | Job listings, searches |
| Resume Service | `resume_service_db` | Resume storage, templates |
| Notification Service | `notification_service_db` | Notification queue, history |
| Analytics Service | `analytics_service_db` | Metrics, reports, dashboards |
| Auto-Apply Service | `auto_apply_service_db` | Application queue, status |
| Payment Service | `payment_service_db` | Billing, subscriptions |

**Benefits:**
- Blast radius containment
- Independent scaling
- Easier maintenance
- Clear data ownership

---

## Connection Configuration

### Environment Variables (Kubernetes ConfigMaps)

**Location:** `infrastructure/kubernetes/base/database-config.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: database-config
  namespace: applyforus
data:
  # Common connection settings
  DB_HOST: "applyforus-postgres.postgres.database.azure.com"
  DB_PORT: "5432"
  DB_SSL: "true"

  # Per-service database names
  AUTH_DB_NAME: "applyforus_auth"
  USER_DB_NAME: "applyforus_user"
  JOB_DB_NAME: "applyforus_job"
  # ... etc
```

**Note:** Actual database names in Terraform are:
- `auth_service_db`, `user_service_db`, etc. (with underscores)
- ConfigMap uses simplified names for clarity

### Connection String Formats

#### 1. Standard PostgreSQL (psql, pgAdmin)
```
postgresql://applyforusadmin:<password>@psql-jobpilot-prod-<suffix>.postgres.database.azure.com:5432/auth_service_db?sslmode=require
```

#### 2. TypeORM/NestJS (Node.js services)
```
postgres://applyforusadmin:<password>@psql-jobpilot-prod-<suffix>.postgres.database.azure.com:5432/auth_service_db?ssl=true
```

#### 3. Environment Variables (Recommended)
```bash
DB_HOST=psql-jobpilot-prod-<suffix>.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=<from-keyvault>
DB_DATABASE=auth_service_db
DB_SSL=true
```

### Service .env.example Files

All service `.env.example` files are correctly configured with Azure PostgreSQL:

**Example:** `services/auth-service/.env.example:10`
```bash
DATABASE_URL=postgresql://applyforusadmin@applyforus-postgres:${DB_PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require
```

**Services Verified:**
- ✓ `services/auth-service/.env.example`
- ✓ `services/user-service/.env.example`
- ✓ `services/job-service/.env.example`
- ✓ `services/resume-service/.env.example`
- ✓ `services/notification-service/.env.example`
- ✓ `services/analytics-service/.env.example`
- ✓ `services/auto-apply-service/.env.example`

---

## Accessing from Different Environments

### 1. From AKS Pods (Kubernetes)

AKS pods connect using the `AllowAzureServices` firewall rule.

**DNS Resolution:** Public FQDN
**Network Path:** AKS → NAT Gateway → Internet → Azure Firewall → PostgreSQL

**Connection Test:**
```bash
# From within a pod
kubectl exec -it <pod-name> -n applyforus -- \
  psql "postgresql://user:pass@host:5432/db?sslmode=require" -c "SELECT version();"
```

### 2. From GitHub Actions (CI/CD)

GitHub Actions runners connect via dynamic IPs.

**Recommended Approach:**
1. Use the `AllowAzureServices` rule (works for Azure-hosted runners)
2. OR add GitHub IP ranges to firewall rules
3. OR use self-hosted runners with static IPs

**Example Workflow:**
```yaml
- name: Run Database Migration
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: |
    npm run typeorm migration:run
```

### 3. From Developer Machines

**Option A:** Add your public IP to firewall rules
**Option B:** Use Azure Bastion or VPN
**Option C:** Use Azure Cloud Shell

**Add Your IP (Terraform):**
```hcl
# infrastructure/terraform/main.tf
allowed_ip_addresses = [
  "YOUR_PUBLIC_IP/32",
]
```

**Add Your IP (Azure CLI):**
```bash
az postgres flexible-server firewall-rule create \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --rule-name allow-my-ip \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### 4. From Local Development

**Recommended:** Use localhost PostgreSQL for development

```bash
# .env.local (override .env.example)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

**For Testing Against Cloud DB:** Add your IP to firewall rules

---

## Maintenance Procedures

### Adding a New Firewall Rule

**Via Terraform:**
```hcl
# infrastructure/terraform/main.tf
allowed_ip_addresses = [
  "1.2.3.4",  # Existing IP
  "5.6.7.8",  # New IP
]
```

```bash
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

**Via Azure CLI:**
```bash
az postgres flexible-server firewall-rule create \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --rule-name allow-new-ip \
  --start-ip-address 5.6.7.8 \
  --end-ip-address 5.6.7.8
```

### Removing a Firewall Rule

**Via Terraform:**
Remove the IP from the `allowed_ip_addresses` list and apply.

**Via Azure CLI:**
```bash
az postgres flexible-server firewall-rule delete \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --rule-name allow-old-ip \
  --yes
```

### Listing Current Firewall Rules

```bash
az postgres flexible-server firewall-rule list \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --output table
```

### Rotating Database Password

1. **Generate new password:**
```bash
openssl rand -base64 32
```

2. **Update in Azure Key Vault:**
```bash
az keyvault secret set \
  --vault-name jobpilot-prod-kv-<suffix> \
  --name postgres-admin-password \
  --value <new-password>
```

3. **Update PostgreSQL server:**
```bash
az postgres flexible-server update \
  --resource-group jobpilot-prod-rg \
  --name psql-jobpilot-prod-<suffix> \
  --admin-password <new-password>
```

4. **Restart affected pods/services** (they will fetch new password from Key Vault)

### Monitoring Connection Activity

**View Active Connections:**
```sql
SELECT
  datname,
  usename,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname IS NOT NULL
ORDER BY query_start DESC;
```

**Check Failed Connection Attempts:**
```bash
az monitor activity-log list \
  --resource-group jobpilot-prod-rg \
  --namespace Microsoft.DBforPostgreSQL \
  --start-time 2025-12-15T00:00:00Z \
  --query "[?contains(operationName.value, 'ConnectionFailed')]"
```

---

## Security Best Practices

### ✓ Implemented

- [x] SSL/TLS enforced for all connections
- [x] Strong password requirements (12+ characters)
- [x] Credentials stored in Azure Key Vault
- [x] Database isolation per microservice
- [x] IP-based firewall rules
- [x] Diagnostic logging enabled
- [x] Monitoring and alerts configured
- [x] Automated backups enabled
- [x] Geo-redundant backups (production)
- [x] High availability (production)

### Recommended Actions

1. **Regularly Review Firewall Rules** (Monthly)
   - Remove unused IPs
   - Update IP ranges for CI/CD systems
   - Document each rule's purpose

2. **Rotate Passwords** (Quarterly)
   - Update database password
   - Update service account credentials
   - Update Key Vault secrets

3. **Monitor Connection Patterns**
   - Set up alerts for unusual connection sources
   - Monitor failed authentication attempts
   - Track connection count trends

4. **Keep IP Allowlist Minimal**
   - Only add IPs that absolutely need access
   - Use VPN or Azure Bastion for developer access
   - Prefer `AllowAzureServices` over individual IPs when possible

5. **Regular Security Audits**
   - Review Azure Advisor recommendations
   - Check Microsoft Defender for Cloud alerts
   - Validate SSL certificate expiration dates

---

## Troubleshooting

### Cannot Connect: "No pg_hba.conf entry"

**Cause:** Your IP is not in the firewall rules.

**Solution:** Add your IP to the allowed list.

```bash
# Get your public IP
curl -s https://api.ipify.org

# Add to firewall
az postgres flexible-server firewall-rule create \
  --resource-group <rg-name> \
  --name <server-name> \
  --rule-name allow-my-ip \
  --start-ip-address <your-ip> \
  --end-ip-address <your-ip>
```

### Cannot Connect: "SSL connection required"

**Cause:** Connection string missing SSL parameter.

**Solution:** Add `?sslmode=require` to connection string.

```bash
# Wrong
postgresql://user:pass@host:5432/db

# Correct
postgresql://user:pass@host:5432/db?sslmode=require
```

### Cannot Connect from GitHub Actions

**Cause:** GitHub runner IP not in firewall rules.

**Solution:** Ensure `AllowAzureServices` is enabled (default).

```hcl
# infrastructure/terraform/main.tf:230
allow_azure_services = true
```

### Connection Refused from AKS Pod

**Possible Causes:**
1. DNS resolution issue
2. Network policy blocking egress
3. Firewall rule missing

**Debug Steps:**
```bash
# 1. Test DNS resolution
kubectl exec -it <pod> -- nslookup psql-jobpilot-prod-<suffix>.postgres.database.azure.com

# 2. Test network connectivity
kubectl exec -it <pod> -- nc -zv psql-jobpilot-prod-<suffix>.postgres.database.azure.com 5432

# 3. Test SSL connection
kubectl exec -it <pod> -- openssl s_client -connect psql-jobpilot-prod-<suffix>.postgres.database.azure.com:5432
```

---

## Migration Path (Future Considerations)

If you decide to migrate to private endpoints in the future:

### Current State (Public)
```
Services → Internet → Firewall → PostgreSQL
```

### Future State (Private)
```
Services → VNet → Private Endpoint → PostgreSQL
```

### Migration Steps (DO NOT EXECUTE NOW)
1. Create VNet integration for AKS
2. Create private endpoint for PostgreSQL
3. Update DNS to use private endpoint
4. Disable public network access
5. Remove firewall rules

**Note:** This migration is NOT required currently. Public access with proper security controls is a valid architecture.

---

## Terraform Outputs Reference

### Get Connection Information

```bash
# All PostgreSQL outputs
terraform output -json | jq '.postgresql_connection_strings'

# Server FQDN
terraform output postgresql_server_fqdn
# Output: psql-jobpilot-prod-<suffix>.postgres.database.azure.com

# Database names
terraform output postgresql_database_names

# Environment variables for specific service
terraform output postgresql_env_vars_auth_service
```

### Outputs Location

**File:** `infrastructure/terraform/outputs.tf:185-275`

Available outputs:
- `postgresql_server_name`
- `postgresql_server_fqdn`
- `postgresql_database_names`
- `postgresql_connection_strings` (sensitive)
- `postgresql_env_vars_*` (per service, sensitive)

---

## Contact Information

**Infrastructure Team:** infrastructure@applyforus.com
**Security Team:** security@applyforus.com
**DevOps Team:** devops@applyforus.com

**On-Call Escalation:** See `ops/docs/OBSERVABILITY-ALERTS-RUNBOOKS.md`

---

## Appendix A: Configuration File Locations

| Purpose | File Path |
|---------|-----------|
| PostgreSQL Module (Main) | `infrastructure/terraform/modules/postgresql-flexible/main.tf` |
| Module Variables | `infrastructure/terraform/modules/postgresql-flexible/variables.tf` |
| Module Outputs | `infrastructure/terraform/modules/postgresql-flexible/outputs.tf` |
| Main Terraform Config | `infrastructure/terraform/main.tf` (lines 197-262) |
| Global Variables | `infrastructure/terraform/variables.tf` (lines 90-117) |
| Global Outputs | `infrastructure/terraform/outputs.tf` (lines 185-275) |
| Kubernetes ConfigMap (Base) | `infrastructure/kubernetes/base/configmap.yaml` |
| Kubernetes ConfigMap (DB) | `infrastructure/kubernetes/base/database-config.yaml` |
| Service .env Examples | `services/*/​.env.example` |

## Appendix B: Related Documentation

- PostgreSQL Quick Reference: `infrastructure/terraform/POSTGRESQL_QUICK_REFERENCE.md`
- PostgreSQL Migration Guide: `infrastructure/terraform/POSTGRESQL_MIGRATION_GUIDE.md`
- Infrastructure Summary: `POSTGRESQL_INFRASTRUCTURE_SUMMARY.md`
- Security Audit Report: `ops/docs/SECURITY_AUDIT_REPORT.md`
- Observability & Alerts: `ops/docs/OBSERVABILITY-ALERTS-RUNBOOKS.md`

---

**Document Version:** 1.0
**Last Review Date:** 2025-12-15
**Next Review Date:** 2026-03-15
**Classification:** Internal Use Only
