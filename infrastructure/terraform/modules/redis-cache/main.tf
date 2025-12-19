# Azure Redis Cache Module
# This module provisions Azure Redis Cache with environment-specific configurations

locals {
  # Parse SKU into family and capacity
  sku_map = {
    "Basic_C0"    = { family = "C", capacity = 0 }
    "Basic_C1"    = { family = "C", capacity = 1 }
    "Basic_C2"    = { family = "C", capacity = 2 }
    "Standard_C0" = { family = "C", capacity = 0 }
    "Standard_C1" = { family = "C", capacity = 1 }
    "Standard_C2" = { family = "C", capacity = 2 }
    "Standard_C3" = { family = "C", capacity = 3 }
    "Standard_C4" = { family = "C", capacity = 4 }
    "Premium_P1"  = { family = "P", capacity = 1 }
    "Premium_P2"  = { family = "P", capacity = 2 }
    "Premium_P3"  = { family = "P", capacity = 3 }
    "Premium_P4"  = { family = "P", capacity = 4 }
  }

  parsed_sku = local.sku_map[var.cache_sku]
  sku_tier   = split("_", var.cache_sku)[0]
  is_premium = local.sku_tier == "Premium"
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                 = "redis-${var.project_name}-${var.environment}-${var.unique_suffix}"
  location             = var.location
  resource_group_name  = var.resource_group_name
  capacity             = local.parsed_sku.capacity
  family               = local.parsed_sku.family
  sku_name             = local.sku_tier
  non_ssl_port_enabled = false
  minimum_tls_version  = "1.2"

  # Premium features
  shard_count                   = local.is_premium ? var.shard_count : null
  subnet_id                     = local.is_premium && var.subnet_id != null ? var.subnet_id : null
  private_static_ip_address     = local.is_premium && var.private_static_ip_address != null ? var.private_static_ip_address : null
  public_network_access_enabled = var.enable_private_endpoint ? false : true
  zones                         = local.is_premium && var.environment == "prod" ? var.zones : null

  redis_configuration {
    # Authentication
    authentication_enabled = true

    # Memory management
    maxmemory_reserved = var.maxmemory_reserved
    maxmemory_delta    = var.maxmemory_delta
    maxmemory_policy   = var.maxmemory_policy

    # Data persistence (Premium only)
    rdb_backup_enabled            = local.is_premium && var.enable_persistence ? true : null
    rdb_backup_frequency          = local.is_premium && var.enable_persistence ? var.rdb_backup_frequency : null
    rdb_backup_max_snapshot_count = local.is_premium && var.enable_persistence ? var.rdb_backup_max_snapshot_count : null
    rdb_storage_connection_string = local.is_premium && var.enable_persistence ? var.rdb_storage_connection_string : null

    # AOF persistence (Premium only)
    aof_backup_enabled              = local.is_premium && var.enable_aof_backup ? true : null
    aof_storage_connection_string_0 = local.is_premium && var.enable_aof_backup ? var.aof_storage_connection_string_0 : null
    aof_storage_connection_string_1 = local.is_premium && var.enable_aof_backup ? var.aof_storage_connection_string_1 : null

    # Notifications
    notify_keyspace_events = var.notify_keyspace_events
  }

  # Patch schedule (Production only, Premium/Standard only)
  dynamic "patch_schedule" {
    for_each = var.environment == "prod" && !startswith(var.cache_sku, "Basic") ? [1] : []
    content {
      day_of_week        = var.patch_day_of_week
      start_hour_utc     = var.patch_start_hour_utc
      maintenance_window = var.patch_maintenance_window
    }
  }

  # Identity for managed identity scenarios
  dynamic "identity" {
    for_each = var.enable_managed_identity ? [1] : []
    content {
      type = "SystemAssigned"
    }
  }

  tags = var.tags
}

# Private Endpoint (if enabled)
resource "azurerm_private_endpoint" "redis" {
  count = var.enable_private_endpoint && var.private_endpoint_subnet_id != null ? 1 : 0

  name                = "pe-redis-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-redis-${var.project_name}-${var.environment}"
    private_connection_resource_id = azurerm_redis_cache.main.id
    is_manual_connection           = false
    subresource_names              = ["redisCache"]
  }

  tags = var.tags
}

# Firewall Rules (Standard/Premium only)
resource "azurerm_redis_firewall_rule" "allowed_ips" {
  for_each = !startswith(var.cache_sku, "Basic") ? var.allowed_ip_ranges : {}

  name                = each.key
  redis_cache_name    = azurerm_redis_cache.main.name
  resource_group_name = var.resource_group_name
  start_ip            = each.value.start_ip
  end_ip              = each.value.end_ip
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "redis" {
  count = var.enable_diagnostics && var.log_analytics_workspace_id != null ? 1 : 0

  name                       = "diag-redis-${var.project_name}-${var.environment}"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  # Metrics
  metric {
    category = "AllMetrics"
    enabled  = true

    retention_policy {
      enabled = true
      days    = var.environment == "prod" ? 90 : 30
    }
  }
}
