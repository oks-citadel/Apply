output "key_vault_private_endpoint_id" {
  description = "Key Vault private endpoint resource ID"
  value       = var.key_vault_id != null && var.enable_key_vault_private_endpoint ? azurerm_private_endpoint.key_vault[0].id : null
}

output "key_vault_private_ip" {
  description = "Key Vault private endpoint IP address"
  value       = var.key_vault_id != null && var.enable_key_vault_private_endpoint ? azurerm_private_endpoint.key_vault[0].private_service_connection[0].private_ip_address : null
}

output "key_vault_private_dns_zone_id" {
  description = "Key Vault private DNS zone ID"
  value       = var.key_vault_id != null && var.enable_key_vault_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.key_vault[0].id : null
}

output "sql_private_endpoint_id" {
  description = "SQL Server private endpoint resource ID"
  value       = var.sql_server_id != null && var.enable_sql_private_endpoint ? azurerm_private_endpoint.sql_server[0].id : null
}

output "sql_private_ip" {
  description = "SQL Server private endpoint IP address"
  value       = var.sql_server_id != null && var.enable_sql_private_endpoint ? azurerm_private_endpoint.sql_server[0].private_service_connection[0].private_ip_address : null
}

output "sql_private_dns_zone_id" {
  description = "SQL Server private DNS zone ID"
  value       = var.sql_server_id != null && var.enable_sql_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.sql_server[0].id : null
}

output "redis_private_endpoint_id" {
  description = "Redis Cache private endpoint resource ID"
  value       = var.redis_cache_id != null && var.enable_redis_private_endpoint ? azurerm_private_endpoint.redis_cache[0].id : null
}

output "redis_private_ip" {
  description = "Redis Cache private endpoint IP address"
  value       = var.redis_cache_id != null && var.enable_redis_private_endpoint ? azurerm_private_endpoint.redis_cache[0].private_service_connection[0].private_ip_address : null
}

output "redis_private_dns_zone_id" {
  description = "Redis Cache private DNS zone ID"
  value       = var.redis_cache_id != null && var.enable_redis_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.redis_cache[0].id : null
}

output "storage_blob_private_endpoint_id" {
  description = "Storage Account (Blob) private endpoint resource ID"
  value       = var.storage_account_id != null && var.enable_storage_private_endpoint ? azurerm_private_endpoint.storage_blob[0].id : null
}

output "storage_blob_private_ip" {
  description = "Storage Account (Blob) private endpoint IP address"
  value       = var.storage_account_id != null && var.enable_storage_private_endpoint ? azurerm_private_endpoint.storage_blob[0].private_service_connection[0].private_ip_address : null
}

output "storage_blob_private_dns_zone_id" {
  description = "Storage Account (Blob) private DNS zone ID"
  value       = var.storage_account_id != null && var.enable_storage_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.storage_blob[0].id : null
}

output "cosmos_db_private_endpoint_id" {
  description = "Cosmos DB private endpoint resource ID"
  value       = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint ? azurerm_private_endpoint.cosmos_db[0].id : null
}

output "cosmos_db_private_ip" {
  description = "Cosmos DB private endpoint IP address"
  value       = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint ? azurerm_private_endpoint.cosmos_db[0].private_service_connection[0].private_ip_address : null
}

output "cosmos_db_private_dns_zone_id" {
  description = "Cosmos DB private DNS zone ID"
  value       = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.cosmos_db[0].id : null
}

output "container_registry_private_endpoint_id" {
  description = "Container Registry private endpoint resource ID"
  value       = var.container_registry_id != null && var.enable_container_registry_private_endpoint ? azurerm_private_endpoint.container_registry[0].id : null
}

output "container_registry_private_ip" {
  description = "Container Registry private endpoint IP address"
  value       = var.container_registry_id != null && var.enable_container_registry_private_endpoint ? azurerm_private_endpoint.container_registry[0].private_service_connection[0].private_ip_address : null
}

output "container_registry_private_dns_zone_id" {
  description = "Container Registry private DNS zone ID"
  value       = var.container_registry_id != null && var.enable_container_registry_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.container_registry[0].id : null
}

output "openai_private_endpoint_id" {
  description = "OpenAI private endpoint resource ID"
  value       = var.openai_id != null && var.enable_openai_private_endpoint ? azurerm_private_endpoint.openai[0].id : null
}

output "openai_private_ip" {
  description = "OpenAI private endpoint IP address"
  value       = var.openai_id != null && var.enable_openai_private_endpoint ? azurerm_private_endpoint.openai[0].private_service_connection[0].private_ip_address : null
}

output "openai_private_dns_zone_id" {
  description = "OpenAI private DNS zone ID"
  value       = var.openai_id != null && var.enable_openai_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.openai[0].id : null
}

output "all_private_endpoints" {
  description = "Map of all private endpoint configurations"
  value = {
    key_vault = var.key_vault_id != null && var.enable_key_vault_private_endpoint ? {
      id         = azurerm_private_endpoint.key_vault[0].id
      private_ip = azurerm_private_endpoint.key_vault[0].private_service_connection[0].private_ip_address
    } : null

    sql_server = var.sql_server_id != null && var.enable_sql_private_endpoint ? {
      id         = azurerm_private_endpoint.sql_server[0].id
      private_ip = azurerm_private_endpoint.sql_server[0].private_service_connection[0].private_ip_address
    } : null

    redis_cache = var.redis_cache_id != null && var.enable_redis_private_endpoint ? {
      id         = azurerm_private_endpoint.redis_cache[0].id
      private_ip = azurerm_private_endpoint.redis_cache[0].private_service_connection[0].private_ip_address
    } : null

    storage_blob = var.storage_account_id != null && var.enable_storage_private_endpoint ? {
      id         = azurerm_private_endpoint.storage_blob[0].id
      private_ip = azurerm_private_endpoint.storage_blob[0].private_service_connection[0].private_ip_address
    } : null

    cosmos_db = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint ? {
      id         = azurerm_private_endpoint.cosmos_db[0].id
      private_ip = azurerm_private_endpoint.cosmos_db[0].private_service_connection[0].private_ip_address
    } : null

    container_registry = var.container_registry_id != null && var.enable_container_registry_private_endpoint ? {
      id         = azurerm_private_endpoint.container_registry[0].id
      private_ip = azurerm_private_endpoint.container_registry[0].private_service_connection[0].private_ip_address
    } : null

    openai = var.openai_id != null && var.enable_openai_private_endpoint ? {
      id         = azurerm_private_endpoint.openai[0].id
      private_ip = azurerm_private_endpoint.openai[0].private_service_connection[0].private_ip_address
    } : null
  }
}

output "private_dns_zones" {
  description = "Map of private DNS zone IDs"
  value = {
    key_vault          = var.key_vault_id != null && var.enable_key_vault_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.key_vault[0].id : null
    sql_server         = var.sql_server_id != null && var.enable_sql_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.sql_server[0].id : null
    redis_cache        = var.redis_cache_id != null && var.enable_redis_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.redis_cache[0].id : null
    storage_blob       = var.storage_account_id != null && var.enable_storage_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.storage_blob[0].id : null
    cosmos_db          = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.cosmos_db[0].id : null
    container_registry = var.container_registry_id != null && var.enable_container_registry_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.container_registry[0].id : null
    openai             = var.openai_id != null && var.enable_openai_private_endpoint && var.create_private_dns_zones ? azurerm_private_dns_zone.openai[0].id : null
  }
}
