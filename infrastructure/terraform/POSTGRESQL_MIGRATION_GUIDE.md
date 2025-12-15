# PostgreSQL Flexible Server Migration Guide

## Overview

This guide documents the new PostgreSQL Flexible Server infrastructure module created for the JobPilot platform. The module provides a production-ready PostgreSQL database with PUBLIC network access, replacing the need for complex VNET integration while maintaining security through firewall rules and SSL enforcement.

## What's New

### New Terraform Module: `postgresql-flexible`

Location: `infrastructure/terraform/modules/postgresql-flexible/`

**Key Files:**
- `main.tf` - PostgreSQL server and database resources
- `variables.tf` - All configurable parameters
- `outputs.tf` - Connection strings and environment variables
- `README.md` - Comprehensive documentation

### Architecture Changes

#### Before (SQL Server/MSSQL)
- Azure SQL Database (MSSQL)
- VNET integration causing connectivity issues
- Single database for all services
- Complex networking requirements

#### After (PostgreSQL Flexible Server)
- PostgreSQL 16 (latest stable)
- PUBLIC network access with firewall rules
- Separate database per microservice (8 databases)
- Simplified connectivity

## Database Architecture

### Microservice Database Isolation

Each service gets its own PostgreSQL database:

| Service | Database Name | Purpose |
|---------|---------------|---------|
| Auth Service | `auth_service_db` | User authentication, JWT tokens, sessions |
| User Service | `user_service_db` | User profiles, preferences, settings |
| Job Service | `job_service_db` | Job listings, applications, tracking |
| Resume Service | `resume_service_db` | Resume storage, parsing, versions |
| Notification Service | `notification_service_db` | Notifications, preferences, history |
| Analytics Service | `analytics_service_db` | Analytics data, metrics, reports |
| Auto-Apply Service | `auto_apply_service_db` | Automation rules, job matching |
| Payment Service | `payment_service_db` | Subscriptions, transactions, billing |

### Benefits of Separate Databases

1. **Security Isolation**: Each service can only access its own data
2. **Independent Scaling**: Scale databases independently based on load
3. **Easier Maintenance**: Update/backup databases independently
4. **Clear Boundaries**: Enforces microservice architecture principles
5. **Reduced Blast Radius**: Issues in one service don't affect others

## Network Configuration

### PUBLIC Access (No VNET Integration)

**Configuration:**
```hcl
public_network_access_enabled = true
```

**Security Measures:**
1. **Firewall Rules**: Restrict access to specific IPs
2. **Azure Services**: Allow trusted Azure services
3. **SSL/TLS Required**: All connections must use encryption
4. **Strong Authentication**: Secure admin credentials

**Firewall Rules:**
```hcl
# Allow Azure services
allow_azure_services = true

# Allow specific IPs (add your IPs here)
allowed_ip_addresses = [
  "1.2.3.4",    # Corporate VPN
  "5.6.7.8",    # CI/CD System
]
```

### Why Public Access?

1. **Simplified Connectivity**: No VNET configuration needed
2. **Easier Development**: Developers can connect from local machines
3. **CI/CD Integration**: Build systems can access without VPN
4. **Cost Effective**: No private endpoint costs
5. **Still Secure**: Firewall + SSL + strong passwords

## Configuration by Environment

### Development Environment

```hcl
# Small, cost-effective configuration
sku_name                     = "B_Standard_B1ms"     # 1 vCore, 2 GB RAM
storage_mb                   = 32768                 # 32 GB
postgres_version             = "16"
backup_retention_days        = 7
geo_redundant_backup_enabled = false
enable_high_availability     = false
max_connections              = "100"

# Estimated cost: $15-25/month
```

### Staging Environment

```hcl
# Medium configuration for testing
sku_name                     = "GP_Standard_D2s_v3"  # 2 vCores, 8 GB RAM
storage_mb                   = 65536                 # 64 GB
postgres_version             = "16"
backup_retention_days        = 14
geo_redundant_backup_enabled = false
enable_high_availability     = false
max_connections              = "100"

# Estimated cost: $100-150/month
```

### Production Environment

```hcl
# High-availability production configuration
sku_name                     = "GP_Standard_D4s_v3"  # 4 vCores, 16 GB RAM
storage_mb                   = 131072                # 128 GB
postgres_version             = "16"
backup_retention_days        = 35
geo_redundant_backup_enabled = true
enable_high_availability     = true
high_availability_mode       = "ZoneRedundant"
standby_availability_zone    = "2"
max_connections              = "200"

# Maintenance window: Sunday 2 AM UTC
maintenance_window = {
  day_of_week  = 0
  start_hour   = 2
  start_minute = 0
}

# Estimated cost: $400-600/month
```

## Connection Information

### Server Details

**Server Name Format:**
```
psql-{project_name}-{environment}-{unique_suffix}
```

**Example:**
```
psql-jobpilot-prod-a1b2c3.postgres.database.azure.com
```

**Port:** 5432 (standard PostgreSQL)

**Admin Username:** `applyforusadmin` (configurable)

### Connection Strings

The module outputs connection strings in multiple formats:

#### Standard PostgreSQL Format
```
postgresql://username:password@host:5432/database?sslmode=require
```

#### TypeORM/NestJS Format
```
postgres://username:password@host:5432/database?ssl=true
```

#### Environment Variables Format
```bash
DB_HOST=psql-jobpilot-prod-a1b2c3.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=<secret>
DB_DATABASE=auth_service_db
DB_SSL=true
```

## Terraform Usage

### Enabling PostgreSQL

Add to your `terraform.tfvars`:

```hcl
# Enable PostgreSQL (recommended)
enable_postgresql = true

# Optional: Disable SQL Server
enable_sql_database = false
```

### Setting Credentials

**Option 1: Environment Variables (Recommended)**
```bash
export TF_VAR_postgres_admin_username="applyforusadmin"
export TF_VAR_postgres_admin_password="your-secure-password-here"
```

**Option 2: Azure Key Vault**
Store credentials in Key Vault and reference them in Terraform.

**Option 3: CI/CD Pipeline Variables**
Set as secure pipeline variables in Azure DevOps or GitHub Actions.

### Deploying the Infrastructure

```bash
# Initialize Terraform
terraform init

# Plan the changes
terraform plan -var-file=environments/prod.tfvars

# Apply the changes
terraform apply -var-file=environments/prod.tfvars
```

## Accessing Outputs

### View Connection Strings

```bash
# View all PostgreSQL outputs
terraform output -json | jq '.postgresql_connection_strings'

# View specific service environment variables
terraform output postgresql_env_vars_auth_service
```

### Using in CI/CD

The outputs can be used to configure application environment variables:

```yaml
# Azure DevOps Pipeline example
- task: AzureCLI@2
  inputs:
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      # Get PostgreSQL connection info from Terraform outputs
      DB_HOST=$(terraform output -raw postgresql_db_host)
      DB_PORT=$(terraform output -raw postgresql_db_port)

      # Set as pipeline variables
      echo "##vso[task.setvariable variable=DB_HOST]$DB_HOST"
      echo "##vso[task.setvariable variable=DB_PORT]$DB_PORT"
```

## Service Configuration Updates

### NestJS Services (TypeORM)

Update your `data-source.ts` or `typeorm.config.ts`:

```typescript
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',  // Changed from 'mssql'
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: true,  // Required for Azure PostgreSQL
  synchronize: false,  // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/**/*{.ts,.js}'],
});
```

### Environment Configuration

Update your `.env.example`:

```bash
# PostgreSQL Database Configuration
DB_HOST=psql-jobpilot-prod-a1b2c3.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=your-secure-password-here
DB_DATABASE=auth_service_db
DB_SSL=true

# Alternative: Use connection string
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require
```

## Migration Steps

### Phase 1: Provision PostgreSQL (Week 1)

1. **Deploy Infrastructure**
   ```bash
   terraform apply -var-file=environments/prod.tfvars
   ```

2. **Verify Connectivity**
   ```bash
   psql "host=<fqdn> port=5432 dbname=auth_service_db user=admin password=<pass> sslmode=require"
   ```

3. **Document Connection Strings**
   Save all connection strings securely in Key Vault

### Phase 2: Migrate Data (Week 2-3)

1. **Schema Migration**
   - Export SQL Server schemas
   - Convert to PostgreSQL format
   - Apply to new databases

2. **Data Migration**
   - Use AWS Database Migration Service or similar
   - Or write custom migration scripts
   - Verify data integrity

3. **Test Thoroughly**
   - Run all unit tests
   - Run integration tests
   - Perform load testing

### Phase 3: Update Services (Week 4)

1. **Update Dependencies**
   ```json
   {
     "dependencies": {
       "pg": "^8.11.0",
       "@types/pg": "^8.10.0"
     }
   }
   ```

2. **Update TypeORM Configuration**
   Change from `mssql` to `postgres`

3. **Update Queries**
   - Review SQL queries for PostgreSQL compatibility
   - Update any MSSQL-specific syntax

4. **Deploy to Staging**
   Test all functionality

### Phase 4: Production Cutover (Week 5)

1. **Maintenance Window**
   Schedule during low-traffic period

2. **Final Data Sync**
   Sync any new data since initial migration

3. **Switch Services**
   Update environment variables to point to PostgreSQL

4. **Monitor Closely**
   Watch for errors, performance issues

5. **Rollback Plan**
   Keep SQL Server running for quick rollback if needed

### Phase 5: Cleanup (Week 6)

1. **Verify Stability**
   Run for 1-2 weeks on PostgreSQL

2. **Disable SQL Server**
   ```hcl
   enable_sql_database = false
   ```

3. **Archive SQL Data**
   Export and archive SQL Server data

4. **Delete SQL Resources**
   Remove SQL Server to stop charges

## Security Considerations

### Password Requirements

- Minimum 12 characters (recommended 16+)
- Mix of uppercase, lowercase, numbers, symbols
- Rotate quarterly in production
- Store in Azure Key Vault
- Never commit to source control

### Firewall Configuration

**Development:**
```hcl
allowed_ip_addresses = ["0.0.0.0/0"]  # Allow all (dev only!)
```

**Production:**
```hcl
allowed_ip_addresses = [
  "10.0.0.5",   # Specific IP addresses only
  "20.0.0.10",
]
```

### SSL/TLS Configuration

SSL is REQUIRED for all connections:

```typescript
// Connection options
{
  ssl: true,  // or ssl: { rejectUnauthorized: true }
}
```

### Azure AD Authentication (Optional)

Can be configured for enhanced security:
- No passwords to manage
- Centralized access control
- Automatic rotation
- Audit logging

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Performance**
   - CPU utilization (< 80%)
   - Memory usage (< 80%)
   - Storage used (< 80%)
   - Connection count

2. **Availability**
   - Server status
   - Failover events
   - Backup success rate

3. **Security**
   - Failed login attempts
   - Firewall blocked connections
   - SSL connection rate

### Setting Up Alerts

```hcl
# Example alert rule
resource "azurerm_monitor_metric_alert" "postgres_cpu" {
  name                = "postgres-high-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_postgresql_flexible_server.main.id]
  description         = "Alert when CPU usage exceeds 80%"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
}
```

## Cost Management

### Cost Breakdown

**Development Environment (~$20/month):**
- Compute: $12/month (B1ms)
- Storage: $5/month (32 GB)
- Backup: $3/month (7 days)

**Production Environment (~$500/month):**
- Compute: $350/month (D4s_v3)
- Storage: $50/month (128 GB)
- High Availability: $70/month (standby)
- Backup: $30/month (35 days + geo-redundant)

### Cost Optimization Tips

1. **Right-size SKUs**: Start small, scale up as needed
2. **Disable HA in non-prod**: Save 50% in dev/staging
3. **Reduce retention**: 7 days vs 35 days saves 75%
4. **Reserved instances**: Save up to 40% with 1-3 year commitment
5. **Monitor usage**: Scale down during off-hours if possible

## Troubleshooting

### Common Issues

#### Cannot Connect from Local Machine

**Problem:** Connection timeout or refused

**Solution:**
1. Add your public IP to firewall rules
2. Verify SSL is enabled in connection string
3. Check server is running: `az postgres flexible-server show`

#### SSL Connection Error

**Problem:** "SSL connection required"

**Solution:**
Add SSL to connection string:
```
?sslmode=require
```
or
```
?ssl=true
```

#### Too Many Connections

**Problem:** "remaining connection slots are reserved"

**Solution:**
1. Increase `max_connections` parameter
2. Implement connection pooling in application
3. Scale up to larger SKU

#### Slow Queries

**Problem:** Poor database performance

**Solution:**
1. Enable slow query log
2. Review and optimize queries
3. Add appropriate indexes
4. Consider scaling up SKU

## Support and Documentation

### Official Documentation
- [Azure PostgreSQL Flexible Server](https://docs.microsoft.com/azure/postgresql/flexible-server/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)

### Module Documentation
- `infrastructure/terraform/modules/postgresql-flexible/README.md`

### Getting Help
1. Check module README
2. Review Azure PostgreSQL documentation
3. Check Terraform Azure provider docs
4. Open issue in project repository

## Conclusion

The new PostgreSQL Flexible Server module provides a production-ready, secure, and scalable database solution for the JobPilot platform. With public network access and proper firewall configuration, it offers simplified connectivity without sacrificing security.

**Key Benefits:**
- Separate database per microservice
- Public access with firewall protection
- SSL/TLS encryption required
- High availability option
- Automated backups
- Easy to connect and use

**Next Steps:**
1. Review configuration for your environment
2. Deploy to development first
3. Test thoroughly
4. Plan production migration
5. Monitor and optimize
