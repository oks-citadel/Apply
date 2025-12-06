# Key Vault and Application Insights Module Usage Example

This document demonstrates how to use the Key Vault, Key Vault Secrets, and Application Insights modules together in a production deployment.

## Example Configuration

```hcl
# Variables
variable "project_name" {
  default = "jobpilot"
}

variable "environment" {
  default = "prod"
}

variable "location" {
  default = "eastus"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${var.project_name}-${var.environment}"
  location = var.location
}

# Generate unique suffix for globally unique resources
resource "random_string" "unique_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Application Insights Module
module "app_insights" {
  source = "./modules/app-insights"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  sampling_percentage = var.environment == "prod" ? 100 : 50

  tags = {
    Project     = "JobPilot AI Platform"
    Team        = "Platform Engineering"
    CostCenter  = "Engineering"
    Environment = var.environment
  }
}

# Key Vault Module
module "key_vault" {
  source = "./modules/key-vault"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  unique_suffix       = random_string.unique_suffix.result

  # Enable diagnostics and send to Application Insights Log Analytics workspace
  enable_diagnostics         = true
  log_analytics_workspace_id = module.app_insights.workspace_id

  # Network security (example)
  enable_private_endpoint = var.environment == "prod" ? true : false
  allowed_ip_addresses    = var.environment == "dev" ? ["0.0.0.0/0"] : []
  virtual_network_rules   = var.environment != "dev" ? [azurerm_subnet.app.id] : []

  tags = {
    Project     = "JobPilot AI Platform"
    Team        = "Platform Engineering"
    CostCenter  = "Engineering"
    Environment = var.environment
  }

  depends_on = [module.app_insights]
}

# Example: SQL Database (required for secrets module)
resource "azurerm_mssql_server" "main" {
  name                         = "sql-${var.project_name}-${var.environment}-${random_string.unique_suffix.result}"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = random_password.sql_admin.result
}

resource "azurerm_mssql_database" "main" {
  name      = "db-${var.project_name}-${var.environment}"
  server_id = azurerm_mssql_server.main.id
  sku_name  = "S0"
}

# Example: Redis Cache (required for secrets module)
resource "azurerm_redis_cache" "main" {
  name                = "redis-${var.project_name}-${var.environment}-${random_string.unique_suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
}

# Example: Service Bus (required for secrets module)
resource "azurerm_servicebus_namespace" "main" {
  name                = "sb-${var.project_name}-${var.environment}-${random_string.unique_suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
}

# Key Vault Secrets Module
module "key_vault_secrets" {
  source = "./modules/key-vault-secrets"

  key_vault_id = module.key_vault.vault_id

  # SQL Database connection string
  sql_connection_string = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${azurerm_mssql_server.main.administrator_login};Password=${random_password.sql_admin.result};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

  # Redis connection string
  redis_connection_string = azurerm_redis_cache.main.primary_connection_string

  # Service Bus connection string
  servicebus_connection_string = azurerm_servicebus_namespace.main.default_primary_connection_string

  # Application Insights keys
  app_insights_key               = module.app_insights.instrumentation_key
  app_insights_connection_string = module.app_insights.connection_string

  depends_on = [
    module.key_vault,
    azurerm_mssql_database.main,
    azurerm_redis_cache.main,
    azurerm_servicebus_namespace.main
  ]
}

# Random password for SQL admin
resource "random_password" "sql_admin" {
  length  = 24
  special = true
}

# Outputs
output "key_vault_uri" {
  description = "The URI of the Key Vault"
  value       = module.key_vault.vault_uri
}

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = module.app_insights.instrumentation_key
  sensitive   = true
}

output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = module.app_insights.workspace_id
}

output "secret_references" {
  description = "Map of secret IDs for reference in application configuration"
  value       = module.key_vault_secrets.secret_ids
}
```

## Environment-Specific Configurations

### Development Environment

```hcl
environment         = "dev"
sampling_percentage = 50
enable_private_endpoint = false
allowed_ip_addresses = ["0.0.0.0/0"] # Allow all (dev only)
```

### Staging Environment

```hcl
environment         = "staging"
sampling_percentage = 75
enable_private_endpoint = false
allowed_ip_addresses = ["<office-ip>/32"]
```

### Production Environment

```hcl
environment         = "prod"
sampling_percentage = 100
enable_private_endpoint = true
allowed_ip_addresses = []
virtual_network_rules = [azurerm_subnet.app.id]
```

## Integration with App Services

To reference Key Vault secrets in Azure App Service:

```hcl
resource "azurerm_linux_web_app" "api" {
  name                = "app-api-${var.project_name}-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  app_settings = {
    # Application Insights
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = "@Microsoft.KeyVault(SecretUri=${module.key_vault.vault_uri}secrets/appinsights-instrumentation-key/)"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${module.key_vault.vault_uri}secrets/appinsights-connection-string/)"

    # Database
    "DATABASE_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${module.key_vault.vault_uri}secrets/sql-connection-string/)"

    # Cache
    "REDIS_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${module.key_vault.vault_uri}secrets/redis-connection-string/)"

    # Messaging
    "SERVICEBUS_CONNECTION_STRING" = "@Microsoft.KeyVault(SecretUri=${module.key_vault.vault_uri}secrets/servicebus-connection-string/)"
  }

  identity {
    type = "SystemAssigned"
  }
}

# Grant App Service access to Key Vault
resource "azurerm_key_vault_access_policy" "app_service" {
  key_vault_id = module.key_vault.vault_id
  tenant_id    = azurerm_linux_web_app.api.identity[0].tenant_id
  object_id    = azurerm_linux_web_app.api.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}
```

## Best Practices

1. **Always use depends_on** to ensure proper resource creation order
2. **Enable diagnostics** in all environments for audit and troubleshooting
3. **Use private endpoints** in production for enhanced security
4. **Implement network ACLs** to restrict Key Vault access
5. **Use managed identities** instead of connection strings where possible
6. **Set appropriate sampling** in Application Insights based on traffic volume
7. **Review retention policies** based on compliance requirements
8. **Use unique suffixes** to ensure globally unique resource names
9. **Tag all resources** consistently for cost tracking and management
10. **Separate secrets module** from Key Vault to manage dependencies properly

## Security Checklist

- [ ] Purge protection enabled for production Key Vault
- [ ] Network ACLs configured to restrict access
- [ ] Private endpoints enabled for production
- [ ] Diagnostic settings enabled and monitored
- [ ] Managed identities used for application access
- [ ] Least privilege access policies implemented
- [ ] All secrets marked as sensitive in outputs
- [ ] Regular access policy reviews scheduled
- [ ] Monitoring alerts configured on Key Vault operations
- [ ] Backup and disaster recovery plan documented
