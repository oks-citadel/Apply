# PostgreSQL Flexible Server - Quick Reference

## Server Configuration

### Server Details
```
Server Name: psql-{project}-{env}-{suffix}
Example: psql-jobpilot-prod-a1b2c3.postgres.database.azure.com
Port: 5432
Admin User: applyforusadmin
SSL Required: YES
```

## Database List

| Service | Database Name |
|---------|---------------|
| Auth Service | `auth_service_db` |
| User Service | `user_service_db` |
| Job Service | `job_service_db` |
| Resume Service | `resume_service_db` |
| Notification Service | `notification_service_db` |
| Analytics Service | `analytics_service_db` |
| Auto-Apply Service | `auto_apply_service_db` |
| Payment Service | `payment_service_db` |

## Environment Variables (Per Service)

```bash
DB_HOST=psql-jobpilot-prod-a1b2c3.postgres.database.azure.com
DB_PORT=5432
DB_USERNAME=applyforusadmin
DB_PASSWORD=<your-secure-password>
DB_DATABASE=<service>_db
DB_SSL=true
```

## Connection Strings

### Standard PostgreSQL
```
postgresql://username:password@host:5432/database?sslmode=require
```

### TypeORM/NestJS
```
postgres://username:password@host:5432/database?ssl=true
```

### URL Encoded (for ENV)
```
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

## TypeORM Configuration

```typescript
// src/config/data-source.ts
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: true,
  synchronize: false,
  logging: false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});
```

## NestJS Configuration

```typescript
// app.module.ts
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      ssl: true,
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
})
export class AppModule {}
```

## CLI Access

### psql Command
```bash
psql "host=psql-jobpilot-prod-a1b2c3.postgres.database.azure.com \
      port=5432 \
      dbname=auth_service_db \
      user=applyforusadmin \
      password=<password> \
      sslmode=require"
```

### Connection String Format
```bash
psql "postgresql://applyforusadmin:<password>@psql-jobpilot-prod-a1b2c3.postgres.database.azure.com:5432/auth_service_db?sslmode=require"
```

## Terraform Commands

### Deploy
```bash
terraform init
terraform plan -var-file=environments/prod.tfvars
terraform apply -var-file=environments/prod.tfvars
```

### Get Outputs
```bash
# All PostgreSQL outputs
terraform output -json | jq '.postgresql_connection_strings'

# Specific service connection
terraform output postgresql_env_vars_auth_service

# Server FQDN
terraform output postgresql_server_fqdn
```

## SKU Reference

### Development
```hcl
sku_name   = "B_Standard_B1ms"  # 1 vCore, 2 GB RAM
storage_mb = 32768              # 32 GB
# Cost: ~$20/month
```

### Staging
```hcl
sku_name   = "GP_Standard_D2s_v3"  # 2 vCores, 8 GB RAM
storage_mb = 65536                 # 64 GB
# Cost: ~$100-150/month
```

### Production
```hcl
sku_name   = "GP_Standard_D4s_v3"  # 4 vCores, 16 GB RAM
storage_mb = 131072                # 128 GB
# Cost: ~$400-600/month
```

## Security Checklist

- [ ] Use strong password (16+ characters)
- [ ] Store credentials in Azure Key Vault
- [ ] Add only necessary IPs to firewall
- [ ] Enable SSL/TLS in all connections
- [ ] Rotate passwords quarterly
- [ ] Enable diagnostic logging
- [ ] Set up monitoring alerts
- [ ] Configure backup retention
- [ ] Test restore procedure

## Firewall Configuration

### Allow Azure Services
```hcl
allow_azure_services = true
```

### Allow Specific IPs
```hcl
allowed_ip_addresses = [
  "1.2.3.4",     # Corporate VPN
  "5.6.7.8",     # CI/CD System
  "9.10.11.12",  # Developer Machine
]
```

## Monitoring Metrics

### Key Metrics
- CPU Percentage (target: < 80%)
- Memory Percentage (target: < 80%)
- Storage Used (target: < 80%)
- Active Connections
- IOPS
- Network Throughput

### Alert Thresholds
- CPU > 80% for 5 minutes
- Memory > 80% for 5 minutes
- Storage > 80%
- Connection count > 90% of max
- Failed connections > 10/minute

## Backup Configuration

### Development
```hcl
backup_retention_days        = 7
geo_redundant_backup_enabled = false
```

### Production
```hcl
backup_retention_days        = 35
geo_redundant_backup_enabled = true
```

## High Availability

### Production HA Configuration
```hcl
enable_high_availability  = true
high_availability_mode    = "ZoneRedundant"
standby_availability_zone = "2"
```

### Benefits
- Sub-60 second failover
- Zero data loss
- Automatic failover
- 99.99% SLA

## Common Tasks

### Add Firewall Rule
```bash
az postgres flexible-server firewall-rule create \
  --resource-group <rg-name> \
  --name <server-name> \
  --rule-name allow-office \
  --start-ip-address 1.2.3.4 \
  --end-ip-address 1.2.3.4
```

### List Databases
```bash
az postgres flexible-server db list \
  --resource-group <rg-name> \
  --server-name <server-name>
```

### Show Server Details
```bash
az postgres flexible-server show \
  --resource-group <rg-name> \
  --name <server-name>
```

### Restart Server
```bash
az postgres flexible-server restart \
  --resource-group <rg-name> \
  --name <server-name>
```

## Troubleshooting

### Cannot Connect
1. Check firewall rules
2. Verify SSL is enabled
3. Check server status
4. Verify credentials

### SSL Error
Add to connection string:
```
?sslmode=require
```

### Too Many Connections
1. Implement connection pooling
2. Increase max_connections
3. Scale up SKU

### Slow Performance
1. Check query performance
2. Review indexes
3. Monitor metrics
4. Consider scaling up

## Package Dependencies

### Node.js/TypeScript
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    "@types/pg": "^8.10.0",
    "typeorm": "^0.3.17",
    "@nestjs/typeorm": "^10.0.0"
  }
}
```

### Python
```
psycopg2-binary==2.9.9
SQLAlchemy==2.0.23
```

## Important Links

- Module: `infrastructure/terraform/modules/postgresql-flexible/`
- Main Config: `infrastructure/terraform/main.tf` (lines 197-262)
- Variables: `infrastructure/terraform/variables.tf` (lines 90-117)
- Migration Guide: `infrastructure/terraform/POSTGRESQL_MIGRATION_GUIDE.md`

## Support Contacts

- Infrastructure Team: infrastructure@jobpilot.ai
- DBA Team: dba@jobpilot.ai
- DevOps: devops@jobpilot.ai

## Quick Checks

### Test Connection
```bash
# Using psql
psql "postgresql://user:pass@host:5432/db?sslmode=require" -c "SELECT version();"

# Using node
node -e "const {Client}=require('pg');const c=new Client({host:'HOST',port:5432,user:'USER',password:'PASS',database:'DB',ssl:true});c.connect().then(()=>console.log('Connected!')).catch(console.error);"
```

### Verify SSL
```bash
psql "postgresql://user:pass@host:5432/db?sslmode=require" -c "SHOW ssl;"
```

### Check Connection Count
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('auth_service_db'));
```
