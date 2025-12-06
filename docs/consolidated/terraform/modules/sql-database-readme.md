# Azure SQL Database Terraform Module

This module provisions an Azure SQL Server and Database with enterprise-grade security configurations for the JobPilot AI Platform.

## Features

- **SQL Server 12.0** with minimum TLS 1.2
- **Azure AD Authentication** with administrator configuration
- **Managed Identity** (SystemAssigned) for secure resource access
- **Environment-specific configurations**:
  - **Dev**: Basic SKU, 7-day retention
  - **Staging**: S1 SKU, 7-day retention
  - **Production**: S3+ SKU, 35-day retention, zone redundancy, long-term backups
- **Security features**:
  - Transparent Data Encryption (enabled by default)
  - Advanced Threat Protection (Microsoft Defender for SQL)
  - Vulnerability Assessment
  - Firewall rules and VNet integration
  - Private endpoint support
- **Backup & Recovery**:
  - Short-term retention (7-35 days)
  - Long-term retention for production (weekly, monthly, yearly)
- **Auditing** with configurable retention periods

## Usage

### Basic Example (Development)

```hcl
module "sql_database" {
  source = "./modules/sql-database"

  resource_group_name = "rg-jobpilot-dev"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"
  unique_suffix       = "abc123"

  sql_admin_username = "sqladmin"
  sql_admin_password = var.sql_admin_password

  azuread_admin_login     = "admin@example.com"
  azuread_admin_object_id = "00000000-0000-0000-0000-000000000000"

  database_sku = "Basic"
  max_size_gb  = 2

  allowed_ip_addresses = ["203.0.113.0"]
  allow_azure_services = true

  tags = {
    Environment = "dev"
    Project     = "JobPilot"
  }
}
```

### Production Example with Security

```hcl
module "sql_database" {
  source = "./modules/sql-database"

  resource_group_name = "rg-jobpilot-prod"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "xyz789"

  sql_admin_username = "sqladmin"
  sql_admin_password = var.sql_admin_password

  azuread_admin_login     = "admin@example.com"
  azuread_admin_object_id = "00000000-0000-0000-0000-000000000000"

  database_sku = "S3"
  max_size_gb  = 100

  # Security
  enable_defender         = true
  security_alert_emails   = ["security@example.com"]
  security_storage_endpoint = azurerm_storage_account.security.primary_blob_endpoint
  security_storage_account_key = azurerm_storage_account.security.primary_access_key

  # Auditing
  audit_storage_endpoint = azurerm_storage_account.audit.primary_blob_endpoint
  audit_storage_account_key = azurerm_storage_account.audit.primary_access_key

  # Network
  subnet_id               = azurerm_subnet.database.id
  enable_private_endpoint = true
  private_endpoint_subnet_id = azurerm_subnet.private_endpoints.id

  allowed_ip_addresses = []
  allow_azure_services = true

  tags = {
    Environment = "prod"
    Project     = "JobPilot"
    Criticality = "High"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | `string` | - | yes |
| location | Azure region for resources | `string` | - | yes |
| project_name | Project name for resource naming | `string` | - | yes |
| environment | Environment (dev, staging, prod) | `string` | - | yes |
| unique_suffix | Unique suffix for globally unique names | `string` | - | yes |
| sql_admin_username | SQL Server administrator username | `string` | - | yes |
| sql_admin_password | SQL Server administrator password | `string` | - | yes |
| azuread_admin_login | Azure AD administrator login name | `string` | - | yes |
| azuread_admin_object_id | Azure AD administrator object ID | `string` | - | yes |
| azuread_admin_tenant_id | Azure AD tenant ID | `string` | `null` | no |
| database_sku | Database SKU | `string` | `null` | no |
| max_size_gb | Maximum database size in GB | `number` | `2` | no |
| tags | Tags to apply to resources | `map(string)` | `{}` | no |
| enable_defender | Enable Microsoft Defender for SQL | `bool` | `false` | no |
| subnet_id | Subnet ID for virtual network rule | `string` | `null` | no |
| enable_private_endpoint | Enable private endpoint | `bool` | `false` | no |
| private_endpoint_subnet_id | Subnet ID for private endpoint | `string` | `null` | no |
| allowed_ip_addresses | List of allowed IP addresses | `list(string)` | `[]` | no |
| allow_azure_services | Allow Azure services access | `bool` | `true` | no |

## Outputs

| Name | Description | Sensitive |
|------|-------------|-----------|
| server_id | ID of the SQL Server | no |
| server_fqdn | Fully qualified domain name | no |
| server_name | Name of the SQL Server | no |
| database_id | ID of the SQL Database | no |
| database_name | Name of the SQL Database | no |
| connection_string | Full connection string | yes |
| connection_string_template | Connection string template | no |
| server_identity_principal_id | Managed identity principal ID | no |
| private_endpoint_id | Private endpoint ID | no |

## Environment-Specific SKU Recommendations

- **Development**: `Basic` or `S0` (£3.80 - £11.40/month)
- **Staging**: `S1` (£22.80/month)
- **Production**: `S3` (£114/month) or `P1` (£366/month) for high performance

## Security Best Practices

1. **Always enable Azure AD authentication** for better identity management
2. **Use private endpoints** for production environments
3. **Enable Microsoft Defender** for advanced threat protection
4. **Configure firewall rules** to restrict access
5. **Use VNet integration** for internal applications
6. **Enable auditing** and store logs in separate storage account
7. **Rotate credentials regularly** using Azure Key Vault
8. **Use managed identities** for application access

## Notes

- Public network access is automatically disabled when private endpoint is enabled
- Zone redundancy is enabled by default for production environments
- Long-term retention is only available for production
- Transparent Data Encryption (TDE) is enabled by default
- All connections require TLS 1.2 or higher
