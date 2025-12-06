# Azure Key Vault Secrets Module

This Terraform module manages application secrets in Azure Key Vault for the JobPilot AI platform.

## Features

- Centralized secret management for all platform services
- Secure storage of connection strings and instrumentation keys
- Proper tagging and content type metadata
- Sensitive value handling

## Secrets Managed

1. **sql-connection-string** - SQL Database connection string
2. **redis-connection-string** - Redis Cache connection string
3. **servicebus-connection-string** - Service Bus connection string
4. **appinsights-instrumentation-key** - Application Insights instrumentation key
5. **appinsights-connection-string** - Application Insights connection string

## Usage

```hcl
module "key_vault_secrets" {
  source = "./modules/key-vault-secrets"

  key_vault_id                   = module.key_vault.vault_id
  sql_connection_string          = azurerm_mssql_database.main.connection_string
  redis_connection_string        = azurerm_redis_cache.main.primary_connection_string
  servicebus_connection_string   = azurerm_servicebus_namespace.main.default_primary_connection_string
  app_insights_key               = module.app_insights.instrumentation_key
  app_insights_connection_string = module.app_insights.connection_string
}
```

## Requirements

- Terraform >= 1.0
- AzureRM Provider >= 3.0
- Key Vault must exist with appropriate access policies

## Inputs

| Name | Description | Type | Required |
|------|-------------|------|----------|
| key_vault_id | Key Vault resource ID | string | yes |
| sql_connection_string | SQL connection string | string (sensitive) | yes |
| redis_connection_string | Redis connection string | string (sensitive) | yes |
| servicebus_connection_string | Service Bus connection string | string (sensitive) | yes |
| app_insights_key | App Insights instrumentation key | string (sensitive) | yes |
| app_insights_connection_string | App Insights connection string | string (sensitive) | yes |

## Outputs

| Name | Description |
|------|-------------|
| secret_ids | Map of secret names to resource IDs |

## Security Notes

- All secret values are marked as sensitive
- Secrets include content type metadata for easier identification
- Access to secrets requires appropriate Key Vault access policies
