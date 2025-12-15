# PostgreSQL Public Connectivity Guide

## Overview

This document describes the Azure PostgreSQL Flexible Server configuration for the ApplyForUs platform. The database is configured with **PUBLIC network access** (no VNET integration) with security controls including SSL enforcement and IP-based firewall rules.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Security Configuration](#security-configuration)
- [Firewall Rules](#firewall-rules)
- [Connection Strings](#connection-strings)
- [SSL/TLS Requirements](#ssltls-requirements)
- [Adding IP Allowlists](#adding-ip-allowlists)
- [Database Management](#database-management)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Configuration Summary

- **Service Type**: Azure Database for PostgreSQL - Flexible Server
- **Network Mode**: Public Access (NO VNET Integration)
- **PostgreSQL Version**: 16
- **Public Network Access**: **ENABLED** (`public_network_access_enabled = true`)
- **SSL/TLS Enforcement**: **REQUIRED** (all connections must use SSL)
- **Firewall Protection**: IP-based allowlist (default deny all)
- **Authentication**: SCRAM-SHA-256 password encryption

### Why Public Access?

Public access with proper security controls provides:
- ✅ Simplified connectivity from AKS pods without complex VNET peering
- ✅ Easy access for CI/CD pipelines and admin tools
- ✅ Reduced Azure networking costs
- ✅ Straightforward debugging and troubleshooting
- ✅ Compatible with multi-cloud or hybrid deployments

### Security Layers

```
┌─────────────────────────────────────────────┐
│  Internet / AKS Cluster / Admin Workstation │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │ Firewall Rules │ ◄── IP Allowlist (Layer 1)
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │   SSL/TLS      │ ◄── Encrypted Transport (Layer 2)
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │ Authentication │ ◄── Strong Passwords (Layer 3)
          └────────┬───────┘
                   │
                   ▼
          ┌────────────────┐
          │   PostgreSQL   │
          │ Flexible Server│
          └────────────────┘
```

---

## Security Configuration

### 1. Public Network Access

**Location**: `infrastructure/terraform/modules/postgresql-flexible/main.tf` (Line 35)

```hcl
resource "azurerm_postgresql_flexible_server" "main" {
  # ... other configuration ...
  public_network_access_enabled = true  # ✅ Enabled for public access
  # ... other configuration ...
}
```

**Status**: ✅ **Configured correctly** - Public access is enabled.

### 2. SSL/TLS Enforcement

**Location**: `infrastructure/terraform/modules/postgresql-flexible/main.tf` (Lines 67-71)

```hcl
resource "azurerm_postgresql_flexible_server_configuration" "ssl_enforcement" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"  # ✅ SSL required for all connections
}
```

**Status**: ✅ **Configured correctly** - All connections MUST use SSL/TLS.

### 3. Additional Security Settings

**Location**: `infrastructure/terraform/modules/postgresql-flexible/security-configs.tf`

- **Connection Logging**: All connections and disconnections are logged
- **Query Duration Logging**: Slow queries are logged for performance monitoring
- **Idle Connection Timeout**: 30 minutes (prevents abandoned connections)
- **Password Encryption**: SCRAM-SHA-256 (stronger than MD5)
- **Checkpoint Logging**: Database checkpoint events are logged

---

## Firewall Rules

### Overview

PostgreSQL Flexible Server uses **default deny** - only explicitly allowed IP addresses can connect.

### Current Firewall Rules

#### 1. Azure Services Rule

**Location**: `infrastructure/terraform/modules/postgresql-flexible/main.tf` (Lines 97-104)

```hcl
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}
```

**Purpose**: Allows Azure services (including AKS pods) to connect to the database.

**Status**: ✅ **Enabled** - Required for AKS connectivity.

#### 2. Individual IP Addresses

**Location**: `infrastructure/terraform/modules/postgresql-flexible/main.tf` (Lines 110-117)

```hcl
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each = toset(var.allowed_ip_addresses)

  name             = "allow-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}
```

**Purpose**: Allow specific IP addresses (admin workstations, monitoring tools, etc.)

**Configuration**: Set via `allowed_ip_addresses` variable in `terraform.tfvars`.

#### 3. IP Ranges

**Location**: `infrastructure/terraform/modules/postgresql-flexible/firewall-rules-enhanced.tf`

```hcl
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ip_ranges" {
  for_each = var.allowed_ip_ranges

  name             = each.key
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value.start_ip
  end_ip_address   = each.value.end_ip
}
```

**Purpose**: Allow IP ranges (office networks, AKS node pools, etc.)

**Configuration**: Set via `allowed_ip_ranges` variable in `terraform.tfvars`.

### Firewall Rule Priority

1. **Default**: Deny all connections
2. **Azure Services Rule** (0.0.0.0): Allow Azure internal services
3. **IP Allowlist**: Allow specific IPs and ranges
4. **SSL Verification**: All allowed connections must use SSL

---

## Connection Strings

### Format

PostgreSQL uses the following connection string formats:

#### Standard PostgreSQL Format

```
postgresql://username:password@host:port/database?sslmode=require
```

#### TypeORM/NestJS Format (Used by Services)

```
postgres://username:password@host:port/database?ssl=true
```

### Environment Variables

Each microservice uses these environment variables:

```bash
# Database Host Configuration
DB_HOST=<server-name>.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=<admin-username>
DB_PASSWORD=<admin-password>
DB_DATABASE=<service-specific-database>
DB_SSL=true

# Or as a connection string:
DATABASE_URL=postgresql://<username>:<password>@<host>:5432/<database>?sslmode=require
```

### Per-Service Database Names

Each microservice has its own dedicated database:

| Service | Database Name | Environment Variable |
|---------|--------------|---------------------|
| Auth Service | `auth_service_db` | `DB_DATABASE=auth_service_db` |
| User Service | `user_service_db` | `DB_DATABASE=user_service_db` |
| Job Service | `job_service_db` | `DB_DATABASE=job_service_db` |
| Resume Service | `resume_service_db` | `DB_DATABASE=resume_service_db` |
| Notification Service | `notification_service_db` | `DB_DATABASE=notification_service_db` |
| Analytics Service | `analytics_service_db` | `DB_DATABASE=analytics_service_db` |
| Auto-Apply Service | `auto_apply_service_db` | `DB_DATABASE=auto_apply_service_db` |
| Payment Service | `payment_service_db` | `DB_DATABASE=payment_service_db` |

### Terraform Outputs

Connection strings are available as Terraform outputs:

```bash
# View connection string for a specific service
terraform output -raw postgresql_connection_strings | jq -r '.auth_service'

# View environment variables for a service
terraform output postgresql_env_vars_auth_service
```

**Note**: Connection strings contain sensitive credentials and are marked as `sensitive = true`.

---

## SSL/TLS Requirements

### Why SSL is Required

- **Encryption in Transit**: Protects credentials and data from interception
- **Man-in-the-Middle Protection**: Validates server identity
- **Compliance**: Required for many security standards (PCI-DSS, HIPAA, etc.)

### SSL Configuration

#### Connection String Parameters

**PostgreSQL Standard**: Use `sslmode=require`
```
postgresql://user:pass@host:5432/db?sslmode=require
```

**TypeORM/NestJS**: Use `ssl=true`
```
postgres://user:pass@host:5432/db?ssl=true
```

#### SSL Modes

| Mode | Description | Recommended |
|------|-------------|-------------|
| `disable` | ❌ No SSL (blocked by server) | Never use |
| `allow` | ❌ SSL if available (blocked by server) | Never use |
| `prefer` | ❌ Prefer SSL but allow plaintext | Never use |
| `require` | ✅ **Require SSL encryption** | **Default** |
| `verify-ca` | ✅ Require SSL + verify CA cert | Advanced |
| `verify-full` | ✅ Require SSL + verify hostname | Most secure |

**Current Configuration**: `require` (SSL encryption required, certificate validation optional)

### Certificate Validation (Optional)

For enhanced security, you can validate the server certificate:

1. Download the Azure PostgreSQL CA certificate:
   ```bash
   curl -o DigiCertGlobalRootCA.crt.pem https://dl.cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem
   ```

2. Use `sslmode=verify-ca` or `sslmode=verify-full`:
   ```
   postgresql://user:pass@host:5432/db?sslmode=verify-full&sslrootcert=/path/to/DigiCertGlobalRootCA.crt.pem
   ```

---

## Adding IP Allowlists

### Prerequisites

Before adding IPs to the allowlist, you need:

1. **AKS Egress IPs**: The public IPs used by your AKS cluster for outbound traffic
2. **Admin IPs**: Your workstation or VPN public IP addresses
3. **CI/CD IPs**: Public IPs of your CI/CD pipeline runners
4. **Monitoring IPs**: IPs of monitoring and observability tools

### Step 1: Get AKS Egress IP

After deploying your AKS cluster, get the egress IP:

```bash
# Get the public IP of the AKS load balancer
kubectl get svc -n kube-system

# Look for a service with EXTERNAL-IP
# OR, get the public IP from Azure CLI
az network public-ip list \
  --resource-group <aks-node-resource-group> \
  --query "[?contains(name, 'kubernetes')].{Name:name, IP:ipAddress}" \
  --output table
```

### Step 2: Update Terraform Configuration

Edit `infrastructure/terraform/terraform.tfvars` or create environment-specific `.tfvars` file:

#### For Individual IPs

```hcl
# terraform.tfvars (or dev.tfvars, prod.tfvars, etc.)

allowed_ip_addresses = [
  "52.x.x.x",      # AKS cluster egress IP
  "203.0.113.45",  # Admin workstation 1
  "203.0.113.46",  # Admin workstation 2
  "198.51.100.10", # CI/CD runner IP
]
```

#### For IP Ranges

```hcl
# terraform.tfvars

allowed_ip_ranges = {
  aks_cluster = {
    start_ip = "52.x.x.x"
    end_ip   = "52.x.x.x"
  }

  office_network = {
    start_ip = "203.0.113.0"
    end_ip   = "203.0.113.255"
  }

  vpn_gateway = {
    start_ip = "198.51.100.0"
    end_ip   = "198.51.100.63"
  }
}
```

### Step 3: Apply Changes

```bash
cd infrastructure/terraform

# Review changes
terraform plan -var-file="prod.tfvars"

# Apply changes
terraform apply -var-file="prod.tfvars"
```

### Step 4: Verify Connectivity

Test the connection from the newly allowed IP:

```bash
# Using psql
psql "postgresql://username@server-name:password@server-name.postgres.database.azure.com:5432/database?sslmode=require"

# Using environment variables
export PGHOST=server-name.postgres.database.azure.com
export PGPORT=5432
export PGUSER=username
export PGPASSWORD=password
export PGDATABASE=database
export PGSSLMODE=require

psql
```

---

## Database Management

### Accessing PostgreSQL

#### From AKS Pods (Internal)

AKS pods can connect directly using the Kubernetes ConfigMap:

```yaml
# ConfigMap already configured at:
# infrastructure/kubernetes/base/database-config.yaml

apiVersion: v1
kind: ConfigMap
metadata:
  name: database-config
data:
  DB_HOST: "applyforus-postgres.postgres.database.azure.com"
  DB_PORT: "5432"
  DB_SSL: "true"
```

#### From Admin Workstation (External)

1. Ensure your IP is in the allowlist
2. Connect using psql or pgAdmin:

```bash
psql "host=server-name.postgres.database.azure.com \
      port=5432 \
      dbname=auth_service_db \
      user=applyforusadmin \
      password=<password> \
      sslmode=require"
```

### Database Users and Permissions

#### Current Setup

**Admin User**: `applyforusadmin` (configured via Terraform)
- **Type**: PostgreSQL native authentication
- **Privileges**: Full administrative privileges
- **Usage**: Initial setup, migrations, administration

#### Best Practices for Production

1. **Create service-specific users** (instead of using admin for all services):

```sql
-- Create dedicated user for auth service
CREATE USER auth_service_user WITH PASSWORD 'strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO auth_service_user;

-- Create dedicated user for user service
CREATE USER user_service_user WITH PASSWORD 'strong-password-here';
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO user_service_user;

-- Repeat for other services...
```

2. **Use least-privilege principle**:

```sql
-- For read-only reporting user
CREATE USER reporting_user WITH PASSWORD 'strong-password-here';
GRANT CONNECT ON DATABASE auth_service_db TO reporting_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO reporting_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO reporting_user;
```

3. **Rotate passwords regularly**:
   - Update passwords in Azure Key Vault
   - Update Kubernetes secrets
   - Restart affected pods

### Running Migrations

#### From CI/CD Pipeline

```bash
# Ensure CI/CD IP is in allowlist
# Then run migrations using connection string from Terraform output

export DATABASE_URL=$(terraform output -raw postgresql_connection_strings | jq -r '.auth_service')

# Run migrations (example with TypeORM)
npm run migration:run
```

#### From Kubernetes Job

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: auth-service-migration
spec:
  template:
    spec:
      containers:
      - name: migration
        image: your-registry.azurecr.io/auth-service:latest
        command: ["npm", "run", "migration:run"]
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: DB_HOST
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
      restartPolicy: Never
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Refused / Timeout

**Symptoms**:
```
Error: connect ETIMEDOUT
psql: error: connection to server at "xxx.postgres.database.azure.com" (x.x.x.x), port 5432 failed: timeout
```

**Cause**: Your IP address is not in the firewall allowlist.

**Solution**:
1. Check your current public IP: `curl ifconfig.me`
2. Add it to `allowed_ip_addresses` in Terraform
3. Apply: `terraform apply`

#### 2. SSL Connection Required

**Symptoms**:
```
Error: SSL connection is required. Please specify SSL options and retry.
```

**Cause**: Attempting to connect without SSL when `require_secure_transport = on`.

**Solution**:
Always include SSL parameters in connection string:
- PostgreSQL: `?sslmode=require`
- TypeORM: `?ssl=true`

#### 3. Authentication Failed

**Symptoms**:
```
psql: error: connection to server failed: FATAL: password authentication failed for user "username"
```

**Cause**: Incorrect username or password.

**Solution**:
1. Verify credentials in Azure Key Vault
2. Ensure username format is correct:
   - ✅ Correct: `applyforusadmin`
   - ❌ Incorrect: `applyforusadmin@servername` (legacy format, not needed for Flexible Server)

#### 4. Database Does Not Exist

**Symptoms**:
```
FATAL: database "database_name" does not exist
```

**Cause**: Connecting to wrong database or database not created.

**Solution**:
1. Verify Terraform applied successfully: `terraform state list | grep postgresql_database`
2. Check database names: `terraform output postgresql_database_names`
3. Connect to `postgres` database first, then check: `\l`

### Verification Commands

#### Check Server Status

```bash
# Using Azure CLI
az postgres flexible-server show \
  --resource-group <resource-group> \
  --name <server-name>

# Check if public access is enabled
az postgres flexible-server show \
  --resource-group <resource-group> \
  --name <server-name> \
  --query "network.publicNetworkAccess" \
  --output tsv
```

#### List Firewall Rules

```bash
az postgres flexible-server firewall-rule list \
  --resource-group <resource-group> \
  --name <server-name> \
  --output table
```

#### Test Connection

```bash
# Quick connection test
pg_isready -h server-name.postgres.database.azure.com -p 5432

# Full connection test
psql "postgresql://user:pass@server-name.postgres.database.azure.com:5432/postgres?sslmode=require" -c "SELECT version();"
```

### Monitoring and Logs

#### View Connection Logs

Connection attempts are logged to Azure Monitor / Log Analytics:

```kusto
// Query connection logs in Azure Monitor
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
| where Category == "PostgreSQLLogs"
| where Message contains "connection"
| order by TimeGenerated desc
| take 100
```

#### Check Slow Queries

```kusto
// Query slow queries
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
| where Category == "PostgreSQLLogs"
| where Message contains "duration"
| parse Message with * "duration: " duration " ms" *
| where todouble(duration) > 1000
| order by TimeGenerated desc
```

---

## Security Best Practices

### ✅ DO

1. **Always use SSL/TLS** - Never disable SSL for connections
2. **Use strong passwords** - Minimum 16 characters, mixed case, numbers, symbols
3. **Rotate credentials** - Change passwords quarterly
4. **Monitor logs** - Review connection logs regularly
5. **Use least privilege** - Create service-specific database users
6. **Keep allowlist minimal** - Only add necessary IPs
7. **Enable diagnostics** - Send logs to Log Analytics
8. **Use Key Vault** - Store credentials in Azure Key Vault
9. **Test connections** - Verify connectivity after firewall changes
10. **Document IPs** - Maintain a record of allowed IPs and their purpose

### ❌ DON'T

1. **Don't use weak passwords** - Avoid common patterns or dictionary words
2. **Don't share credentials** - Each service should have its own user
3. **Don't disable SSL** - This is blocked by server configuration anyway
4. **Don't allow 0.0.0.0/0** - Never open to all internet IPs
5. **Don't use admin user in production** - Create service-specific users
6. **Don't hardcode credentials** - Use secrets management
7. **Don't ignore logs** - Monitor for suspicious activity
8. **Don't skip backups** - Ensure automated backups are enabled
9. **Don't test in production** - Use dev/staging environments
10. **Don't bypass firewall** - Security exists for a reason

---

## Quick Reference

### Connection String Templates

```bash
# Development (local)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/database?sslmode=disable

# Production (Azure)
DATABASE_URL=postgresql://applyforusadmin:<password>@<server>.postgres.database.azure.com:5432/<database>?sslmode=require
```

### Common psql Commands

```sql
\l              -- List databases
\c database     -- Connect to database
\dt             -- List tables
\du             -- List users
\dn             -- List schemas
\q              -- Quit
```

### Terraform Commands

```bash
# View PostgreSQL outputs
terraform output postgresql_server_fqdn
terraform output postgresql_database_names
terraform output -raw postgresql_connection_strings

# Add IP to allowlist
terraform apply -var='allowed_ip_addresses=["1.2.3.4","5.6.7.8"]'

# View current firewall rules
terraform state show module.postgresql[0].azurerm_postgresql_flexible_server_firewall_rule.azure_services
```

---

## Support and Resources

### Documentation

- [Azure PostgreSQL Flexible Server Docs](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [PostgreSQL Official Docs](https://www.postgresql.org/docs/)
- [TypeORM PostgreSQL Driver](https://typeorm.io/#/connection-options/postgres-connection-options)

### Terraform Resources

- Module Path: `/infrastructure/terraform/modules/postgresql-flexible/`
- Main Configuration: `main.tf`
- Security Configs: `security-configs.tf`
- Firewall Rules: `firewall-rules-enhanced.tf`
- Variables: `variables.tf`, `variables-enhanced.tf`
- Outputs: `outputs.tf`

### Contact

For issues or questions:
- Create an issue in the repository
- Contact DevOps team
- Review Azure Portal for service health

---

**Last Updated**: 2025-12-15
**Version**: 1.0
**Maintained By**: DevOps Team
