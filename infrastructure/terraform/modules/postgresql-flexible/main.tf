# ============================================================================
# Azure PostgreSQL Flexible Server Module
# ============================================================================
# This module provisions Azure PostgreSQL Flexible Server with configurable
# network access (public or private) and comprehensive security configurations.
#
# Key Features:
# - Configurable network access: public or private endpoints
# - Private endpoint support for staging and production environments
# - SSL/TLS enforcement for secure connections
# - Firewall rules for Azure services and specific IPs (public access mode)
# - Multiple databases for microservices architecture
# - High availability configuration options
# - Automated backups with configurable retention
# - Performance monitoring and diagnostics
# - Private DNS zone integration for private endpoints
# ============================================================================

# ============================================================================
# PostgreSQL Flexible Server
# ============================================================================

resource "azurerm_postgresql_flexible_server" "main" {
  name                = "psql-${var.project_name}-${var.environment}-${var.unique_suffix}"
  resource_group_name = var.resource_group_name
  location            = var.location

  # Administrator credentials
  administrator_login    = var.postgres_admin_username
  administrator_password = var.postgres_admin_password

  # Server configuration
  version                       = var.postgres_version
  storage_mb                    = var.storage_mb
  sku_name                      = var.sku_name
  zone                          = var.zone
  public_network_access_enabled = var.public_network_access_enabled

  # Backup configuration
  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup_enabled

  # High availability configuration
  dynamic "high_availability" {
    for_each = var.enable_high_availability ? [1] : []
    content {
      mode                      = var.high_availability_mode
      standby_availability_zone = var.standby_availability_zone
    }
  }

  # Maintenance window configuration
  dynamic "maintenance_window" {
    for_each = var.maintenance_window != null ? [var.maintenance_window] : []
    content {
      day_of_week  = maintenance_window.value.day_of_week
      start_hour   = maintenance_window.value.start_hour
      start_minute = maintenance_window.value.start_minute
    }
  }

  tags = var.tags
}

# ============================================================================
# PostgreSQL Configuration - SSL Enforcement
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "ssl_enforcement" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ============================================================================
# PostgreSQL Configuration - Connection Limits
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.max_connections
}

# ============================================================================
# PostgreSQL Configuration - Timezone
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "timezone" {
  name      = "timezone"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.timezone
}

# ============================================================================
# Firewall Rule - Allow Azure Services
# ============================================================================

resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  count = var.allow_azure_services ? 1 : 0

  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ============================================================================
# Firewall Rules - Allow Specific IP Addresses
# ============================================================================

resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each = toset(var.allowed_ip_addresses)

  name             = "allow-${replace(each.value, ".", "-")}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}

# ============================================================================
# PostgreSQL Databases - One per Microservice
# ============================================================================

# Auth Service Database
resource "azurerm_postgresql_flexible_server_database" "auth_service" {
  name      = var.database_names.auth_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# User Service Database
resource "azurerm_postgresql_flexible_server_database" "user_service" {
  name      = var.database_names.user_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Job Service Database
resource "azurerm_postgresql_flexible_server_database" "job_service" {
  name      = var.database_names.job_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Resume Service Database
resource "azurerm_postgresql_flexible_server_database" "resume_service" {
  name      = var.database_names.resume_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Notification Service Database
resource "azurerm_postgresql_flexible_server_database" "notification_service" {
  name      = var.database_names.notification_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Analytics Service Database
resource "azurerm_postgresql_flexible_server_database" "analytics_service" {
  name      = var.database_names.analytics_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Auto-Apply Service Database
resource "azurerm_postgresql_flexible_server_database" "auto_apply_service" {
  name      = var.database_names.auto_apply_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Payment Service Database
resource "azurerm_postgresql_flexible_server_database" "payment_service" {
  name      = var.database_names.payment_service
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# ============================================================================
# Diagnostic Settings (Optional)
# ============================================================================

resource "azurerm_monitor_diagnostic_setting" "postgres" {
  count = var.enable_diagnostics ? 1 : 0

  name                       = "psql-diagnostics-${var.environment}"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  # Metrics
  metric {
    category = "AllMetrics"
    enabled  = true

    retention_policy {
      enabled = true
      days    = var.diagnostic_retention_days
    }
  }

  # Logs
  enabled_log {
    category = "PostgreSQLLogs"

    retention_policy {
      enabled = true
      days    = var.diagnostic_retention_days
    }
  }
}

# ============================================================================
# Private Endpoint Configuration
# ============================================================================

# Private DNS Zone for PostgreSQL Flexible Server
resource "azurerm_private_dns_zone" "postgresql" {
  count               = var.enable_private_endpoint && var.create_private_dns_zone ? 1 : 0
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "PostgreSQL"
    }
  )
}

# Virtual Network Link for Private DNS Zone
resource "azurerm_private_dns_zone_virtual_network_link" "postgresql" {
  count                 = var.enable_private_endpoint && var.create_private_dns_zone ? 1 : 0
  name                  = "${var.project_name}-psql-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.postgresql[0].name
  virtual_network_id    = var.private_endpoint_vnet_id
  registration_enabled  = false

  tags = var.tags
}

# Private Endpoint for PostgreSQL Flexible Server
resource "azurerm_private_endpoint" "postgresql" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "pe-${var.project_name}-psql-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-${var.project_name}-psql-${var.environment}"
    private_connection_resource_id = azurerm_postgresql_flexible_server.main.id
    is_manual_connection           = false
    subresource_names              = ["postgresqlServer"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zone || var.existing_private_dns_zone_id != null ? [1] : []
    content {
      name = "default"
      private_dns_zone_ids = var.create_private_dns_zone ? [
        azurerm_private_dns_zone.postgresql[0].id
      ] : [var.existing_private_dns_zone_id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "PostgreSQL"
    }
  )

  depends_on = [
    azurerm_postgresql_flexible_server.main
  ]
}
