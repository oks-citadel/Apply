# Azure PostgreSQL Flexible Server Module

This Terraform module provisions an Azure PostgreSQL Flexible Server with PUBLIC network access, creating separate databases for each microservice in the JobPilot platform.

## Features

- **Public Network Access**: Configured for public access with firewall rules (NO VNET integration)
- **SSL/TLS Enforcement**: All connections require secure transport
- **Multiple Databases**: Separate database for each microservice (8 databases total)
- **High Availability**: Optional zone-redundant HA configuration
- **Automated Backups**: Configurable retention period (7-35 days)
- **Performance Monitoring**: Integrated with Azure Monitor and Log Analytics
- **Flexible SKUs**: Support for Burstable, General Purpose, and Memory Optimized tiers

## Architecture

### Public Access Configuration
- **Public Network Access**: Enabled
- **Firewall Rules**: Azure services + specific IP addresses
- **SSL Required**: All connections must use SSL/TLS
- **No VNET Integration**: Simplified networking for easier connectivity

### Database Structure
Each microservice gets its own isolated database:
- `auth_service_db` - Authentication and authorization
- `user_service_db` - User profiles and management
- `job_service_db` - Job listings and applications
- `resume_service_db` - Resume storage and processing
- `notification_service_db` - Notification management
- `analytics_service_db` - Analytics and reporting
- `auto_apply_service_db` - Automated job applications
- `payment_service_db` - Payment processing

## Usage

### Basic Usage

```hcl
module "postgresql" {
  source = "./modules/postgresql-flexible"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "myproject"
  environment         = "prod"
  unique_suffix       = "abc123"

  postgres_admin_username = var.postgres_admin_username
  postgres_admin_password = var.postgres_admin_password

  # Server configuration
  sku_name         = "GP_Standard_D2s_v3"
  storage_mb       = 32768
  postgres_version = "16"

  # Public access with firewall rules
  allow_azure_services = true
  allowed_ip_addresses = ["1.2.3.4", "5.6.7.8"]

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

### Production Configuration

```hcl
module "postgresql" {
  source = "./modules/postgresql-flexible"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "abc123"

  postgres_admin_username = var.postgres_admin_username
  postgres_admin_password = var.postgres_admin_password

  # Production-grade SKU
  sku_name         = "GP_Standard_D4s_v3"
  storage_mb       = 131072  # 128 GB
  postgres_version = "16"

  # High availability
  enable_high_availability = true
  high_availability_mode   = "ZoneRedundant"
  standby_availability_zone = "2"

  # Backup configuration
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  # Network security
  allow_azure_services = true
  allowed_ip_addresses = ["10.0.0.0", "20.0.0.0"]

  # Performance tuning
  max_connections = "200"
  timezone        = "UTC"

  # Maintenance window (Sunday 2 AM)
  maintenance_window = {
    day_of_week  = 0
    start_hour   = 2
    start_minute = 0
  }

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  diagnostic_retention_days  = 90

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Critical    = "High"
  }
}
```

## Outputs

### Server Information
- `server_id` - Resource ID of the PostgreSQL server
- `server_name` - Name of the PostgreSQL server
- `server_fqdn` - Fully qualified domain name (e.g., `psql-jobpilot-prod-abc123.postgres.database.azure.com`)

### Connection Parameters
- `db_host` - Server hostname (FQDN)
- `db_port` - Server port (5432)
- `db_username` - Administrator username (sensitive)
- `db_password` - Administrator password (sensitive)

### Per-Service Outputs
For each service (auth, user, job, resume, notification, analytics, auto_apply, payment):
- `<service>_db_name` - Database name
- `<service>_connection_string` - Full connection string (sensitive)
- `env_vars_<service>` - Environment variables map

### Connection String Formats

**PostgreSQL Standard Format:**
```
postgresql://username:password@host:5432/database?sslmode=require
```

**TypeORM/NestJS Format:**
```
postgres://username:password@host:5432/database?ssl=true
```

## Environment Variables

Each service gets environment variables in this format:

```bash
DB_HOST=psql-jobpilot-prod-abc123.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=<secret>
DB_DATABASE=auth_service_db
DB_SSL=true
```

## SKU Options

### Burstable Tier (Development/Testing)
- `B_Standard_B1ms` - 1 vCore, 2 GiB RAM
- `B_Standard_B2s` - 2 vCores, 4 GiB RAM

### General Purpose Tier (Production)
- `GP_Standard_D2s_v3` - 2 vCores, 8 GiB RAM
- `GP_Standard_D4s_v3` - 4 vCores, 16 GiB RAM
- `GP_Standard_D8s_v3` - 8 vCores, 32 GiB RAM
- `GP_Standard_D16s_v3` - 16 vCores, 64 GiB RAM

### Memory Optimized Tier (High-Performance)
- `MO_Standard_E2s_v3` - 2 vCores, 16 GiB RAM
- `MO_Standard_E4s_v3` - 4 vCores, 32 GiB RAM
- `MO_Standard_E8s_v3` - 8 vCores, 64 GiB RAM

## Storage Configuration

- **Minimum**: 32 GB (32768 MB)
- **Maximum**: 16 TB (16777216 MB)
- **Auto-growth**: Enabled by default
- **Performance**: Scales with storage size

## High Availability

When enabled, PostgreSQL Flexible Server provides:
- **Zone-Redundant HA**: Standby replica in different availability zone
- **Same-Zone HA**: Standby replica in same availability zone
- **Automatic Failover**: Sub-60 second failover time
- **Zero Data Loss**: Synchronous replication

## Backup and Recovery

### Automated Backups
- **Retention**: 7-35 days
- **Frequency**: Continuous
- **Geo-Redundancy**: Optional (increases cost)
- **Point-in-Time Restore**: To any second within retention period

### Backup Strategy
- **Development**: 7 days retention, no geo-redundancy
- **Staging**: 14 days retention, no geo-redundancy
- **Production**: 35 days retention, geo-redundancy enabled

## Security Features

### Network Security
- **Public Access**: Enabled for easy connectivity
- **Firewall Rules**: Restrict access to specific IPs
- **Azure Services**: Allow trusted Azure services
- **SSL/TLS**: Required for all connections

### Authentication
- **Admin Account**: PostgreSQL native authentication
- **Azure AD**: Can be configured separately
- **Password Policy**: Minimum 12 characters

### Data Protection
- **Encryption at Rest**: Enabled by default
- **Encryption in Transit**: SSL/TLS required
- **Transparent Data Encryption**: Automatic

## Monitoring and Diagnostics

### Metrics Available
- CPU percentage
- Memory percentage
- Storage used
- Active connections
- IOPS
- Network throughput

### Logs Available
- PostgreSQL server logs
- Query performance insights
- Slow query logs
- Error logs

### Integration
- Azure Monitor
- Log Analytics Workspace
- Application Insights
- Azure Dashboard

## Cost Optimization

### Development Environment
```hcl
sku_name                     = "B_Standard_B1ms"
storage_mb                   = 32768
backup_retention_days        = 7
geo_redundant_backup_enabled = false
enable_high_availability     = false
```
**Estimated Cost**: ~$15-25/month

### Staging Environment
```hcl
sku_name                     = "GP_Standard_D2s_v3"
storage_mb                   = 65536
backup_retention_days        = 14
geo_redundant_backup_enabled = false
enable_high_availability     = false
```
**Estimated Cost**: ~$100-150/month

### Production Environment
```hcl
sku_name                     = "GP_Standard_D4s_v3"
storage_mb                   = 131072
backup_retention_days        = 35
geo_redundant_backup_enabled = true
enable_high_availability     = true
```
**Estimated Cost**: ~$400-600/month

## Connecting to the Database

### From Azure Services
No additional configuration needed - firewall allows Azure services by default.

### From Local Development
Add your public IP to `allowed_ip_addresses`:
```hcl
allowed_ip_addresses = ["1.2.3.4"]
```

### Connection String Examples

**TypeORM (NestJS):**
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';

TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: true,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: false,
});
```

**Prisma:**
```
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

**psql CLI:**
```bash
psql "host=psql-server.postgres.database.azure.com port=5432 dbname=mydb user=admin password=pass sslmode=require"
```

## Migration from SQL Server

This module is designed to replace the existing SQL Server (MSSQL) module with PostgreSQL:

1. **Deploy PostgreSQL**: Enable `enable_postgresql = true`
2. **Migrate Data**: Use migration tools to move data
3. **Update Connection Strings**: Services need PostgreSQL drivers
4. **Test Thoroughly**: Verify all queries work with PostgreSQL
5. **Disable SQL Server**: Set `enable_sql_database = false`

## Troubleshooting

### Connection Issues
1. Verify firewall rules include your IP
2. Check SSL is enabled in connection string
3. Ensure server is in running state
4. Verify credentials are correct

### Performance Issues
1. Check connection pool settings
2. Review slow query logs
3. Consider scaling up SKU
4. Enable connection pooling

### High Availability Issues
1. Verify zone availability in region
2. Check standby zone configuration
3. Review failover logs

## Requirements

- Terraform >= 1.0
- Azure Provider >= 3.0
- Azure subscription with PostgreSQL quota

## Limitations

- PostgreSQL versions: 11, 12, 13, 14, 15, 16
- Storage: 32 GB minimum, 16 TB maximum
- Backup retention: 7-35 days
- High availability: Not available in all regions

## References

- [Azure PostgreSQL Flexible Server Documentation](https://docs.microsoft.com/azure/postgresql/flexible-server/)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
