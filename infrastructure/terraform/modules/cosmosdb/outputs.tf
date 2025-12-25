# ============================================================================
# COSMOSDB MODULE - Outputs
# ============================================================================

output "account_id" {
  description = "The ID of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.id
}

output "account_name" {
  description = "The name of the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.name
}

output "endpoint" {
  description = "The endpoint URL for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "read_endpoints" {
  description = "List of read endpoints for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.read_endpoints
}

output "write_endpoints" {
  description = "List of write endpoints for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.write_endpoints
}

output "primary_key" {
  description = "Primary access key for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "secondary_key" {
  description = "Secondary access key for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.secondary_key
  sensitive   = true
}

output "primary_readonly_key" {
  description = "Primary read-only access key"
  value       = azurerm_cosmosdb_account.main.primary_readonly_key
  sensitive   = true
}

output "secondary_readonly_key" {
  description = "Secondary read-only access key"
  value       = azurerm_cosmosdb_account.main.secondary_readonly_key
  sensitive   = true
}

output "connection_strings" {
  description = "Connection strings for the Cosmos DB account"
  value       = azurerm_cosmosdb_account.main.connection_strings
  sensitive   = true
}

output "primary_sql_connection_string" {
  description = "Primary SQL connection string"
  value       = azurerm_cosmosdb_account.main.primary_sql_connection_string
  sensitive   = true
}

output "secondary_sql_connection_string" {
  description = "Secondary SQL connection string"
  value       = azurerm_cosmosdb_account.main.secondary_sql_connection_string
  sensitive   = true
}

output "database_id" {
  description = "The ID of the SQL database"
  value       = azurerm_cosmosdb_sql_database.main.id
}

output "database_name" {
  description = "The name of the SQL database"
  value       = azurerm_cosmosdb_sql_database.main.name
}

output "container_ids" {
  description = "Map of container names to their IDs"
  value = {
    jobs            = azurerm_cosmosdb_sql_container.jobs.id
    user_activity   = azurerm_cosmosdb_sql_container.user_activity.id
    applications    = azurerm_cosmosdb_sql_container.applications.id
    analytics_events = azurerm_cosmosdb_sql_container.analytics_events.id
    audit_logs      = azurerm_cosmosdb_sql_container.audit_logs.id
  }
}

output "identity_principal_id" {
  description = "Principal ID of the Cosmos DB managed identity"
  value       = azurerm_cosmosdb_account.main.identity[0].principal_id
}

output "identity_tenant_id" {
  description = "Tenant ID of the Cosmos DB managed identity"
  value       = azurerm_cosmosdb_account.main.identity[0].tenant_id
}

output "private_endpoint_id" {
  description = "ID of the private endpoint (if enabled)"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.cosmos[0].id : null
}

output "private_endpoint_ip" {
  description = "Private IP address of the private endpoint"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.cosmos[0].private_service_connection[0].private_ip_address : null
}

output "private_dns_zone_id" {
  description = "ID of the private DNS zone (if created)"
  value       = var.enable_private_endpoint && var.create_private_dns_zone ? azurerm_private_dns_zone.cosmos[0].id : null
}
