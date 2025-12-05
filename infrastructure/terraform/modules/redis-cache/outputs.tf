# Redis Cache Module Outputs

output "cache_id" {
  description = "ID of the Redis Cache"
  value       = azurerm_redis_cache.main.id
}

output "cache_name" {
  description = "Name of the Redis Cache"
  value       = azurerm_redis_cache.main.name
}

output "cache_hostname" {
  description = "Hostname of the Redis Cache"
  value       = azurerm_redis_cache.main.hostname
}

output "cache_fqdn" {
  description = "Fully qualified domain name of the Redis Cache"
  value       = "${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}"
}

output "primary_connection_string" {
  description = "Primary connection string for Redis Cache"
  value       = azurerm_redis_cache.main.primary_connection_string
  sensitive   = true
}

output "secondary_connection_string" {
  description = "Secondary connection string for Redis Cache"
  value       = azurerm_redis_cache.main.secondary_connection_string
  sensitive   = true
}

output "primary_access_key" {
  description = "Primary access key for Redis Cache"
  value       = azurerm_redis_cache.main.primary_access_key
  sensitive   = true
}

output "secondary_access_key" {
  description = "Secondary access key for Redis Cache"
  value       = azurerm_redis_cache.main.secondary_access_key
  sensitive   = true
}

output "ssl_port" {
  description = "SSL port for Redis Cache"
  value       = azurerm_redis_cache.main.ssl_port
}

output "port" {
  description = "Non-SSL port for Redis Cache (disabled by default)"
  value       = azurerm_redis_cache.main.port
}

output "redis_version" {
  description = "Redis version"
  value       = azurerm_redis_cache.main.redis_version
}

output "sku_name" {
  description = "SKU name of the Redis Cache"
  value       = azurerm_redis_cache.main.sku_name
}

output "family" {
  description = "SKU family of the Redis Cache"
  value       = azurerm_redis_cache.main.family
}

output "capacity" {
  description = "Capacity of the Redis Cache"
  value       = azurerm_redis_cache.main.capacity
}

output "private_endpoint_id" {
  description = "ID of the private endpoint (if enabled)"
  value       = var.enable_private_endpoint && var.private_endpoint_subnet_id != null ? azurerm_private_endpoint.redis[0].id : null
}

output "private_endpoint_ip_address" {
  description = "Private IP address of the Redis Cache (if private endpoint enabled)"
  value       = var.enable_private_endpoint && var.private_endpoint_subnet_id != null ? azurerm_private_endpoint.redis[0].private_service_connection[0].private_ip_address : null
}

output "identity_principal_id" {
  description = "Principal ID of the managed identity (if enabled)"
  value       = var.enable_managed_identity ? azurerm_redis_cache.main.identity[0].principal_id : null
}

output "identity_tenant_id" {
  description = "Tenant ID of the managed identity (if enabled)"
  value       = var.enable_managed_identity ? azurerm_redis_cache.main.identity[0].tenant_id : null
}
