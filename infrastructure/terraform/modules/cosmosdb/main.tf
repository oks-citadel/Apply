# ============================================================================
# COSMOSDB MODULE
# Azure Cosmos DB Account with SQL API for ApplyForUs Platform
# ============================================================================
# Provides globally distributed NoSQL database for:
# - Job catalogs and search indexes
# - User activity feeds and analytics events
# - Session data and user preferences
# - Event sourcing and audit logs
# ============================================================================

# ============================================================================
# Cosmos DB Account
# ============================================================================

resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${var.project_name}-${var.environment}-${var.unique_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  # Security settings - Zero Trust principles
  enable_automatic_failover         = true
  public_network_access_enabled     = var.public_network_access_enabled
  is_virtual_network_filter_enabled = var.enable_vnet_filter
  local_authentication_disabled     = var.disable_local_auth
  network_acl_bypass_for_azure_services = true
  network_acl_bypass_ids            = []

  # Consistency policy - configurable per environment
  consistency_policy {
    consistency_level       = var.consistency_level
    max_interval_in_seconds = var.max_interval_in_seconds
    max_staleness_prefix    = var.max_staleness_prefix
  }

  # Primary region with zone redundancy
  geo_location {
    location          = var.location
    failover_priority = 0
    zone_redundant    = var.zone_redundant
  }

  # Secondary region(s) for geo-distribution
  dynamic "geo_location" {
    for_each = var.geo_locations
    content {
      location          = geo_location.value.location
      failover_priority = geo_location.value.failover_priority
      zone_redundant    = geo_location.value.zone_redundant
    }
  }

  # Virtual network rules for private access
  dynamic "virtual_network_rule" {
    for_each = var.enable_vnet_filter ? var.virtual_network_subnet_ids : []
    content {
      id                                   = virtual_network_rule.value
      ignore_missing_vnet_service_endpoint = false
    }
  }

  # IP range filter for allowed access
  ip_range_filter = var.enable_ip_filter ? join(",", var.allowed_ip_ranges) : null

  # Backup policy
  backup {
    type                = var.backup_type
    interval_in_minutes = var.backup_type == "Periodic" ? var.backup_interval_minutes : null
    retention_in_hours  = var.backup_type == "Periodic" ? var.backup_retention_hours : null
    storage_redundancy  = var.backup_storage_redundancy
  }

  # Analytical storage for Azure Synapse Link
  analytical_storage_enabled = var.enable_analytical_storage

  # Capabilities
  dynamic "capabilities" {
    for_each = var.capabilities
    content {
      name = capabilities.value
    }
  }

  # CORS configuration
  dynamic "cors_rule" {
    for_each = var.enable_cors ? [1] : []
    content {
      allowed_origins    = var.cors_allowed_origins
      allowed_methods    = var.cors_allowed_methods
      allowed_headers    = var.cors_allowed_headers
      exposed_headers    = var.cors_exposed_headers
      max_age_in_seconds = var.cors_max_age
    }
  }

  # Identity for Azure AD integration
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      tags["CreatedDate"]
    ]
  }
}

# ============================================================================
# Private Endpoint (for secure VNet access)
# ============================================================================

resource "azurerm_private_endpoint" "cosmos" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "pe-cosmos-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "cosmos-privateserviceconnection"
    private_connection_resource_id = azurerm_cosmosdb_account.main.id
    subresource_names              = ["Sql"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "cosmos-dns-zone-group"
    private_dns_zone_ids = var.create_private_dns_zone ? [azurerm_private_dns_zone.cosmos[0].id] : [var.existing_private_dns_zone_id]
  }

  tags = var.tags
}

# ============================================================================
# Private DNS Zone
# ============================================================================

resource "azurerm_private_dns_zone" "cosmos" {
  count               = var.enable_private_endpoint && var.create_private_dns_zone ? 1 : 0
  name                = "privatelink.documents.azure.com"
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "cosmos" {
  count                 = var.enable_private_endpoint && var.create_private_dns_zone ? 1 : 0
  name                  = "cosmos-dns-vnet-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.cosmos[0].name
  virtual_network_id    = var.private_endpoint_vnet_id
  registration_enabled  = false
  tags                  = var.tags
}

# ============================================================================
# SQL Database - Main Application Database
# ============================================================================

resource "azurerm_cosmosdb_sql_database" "main" {
  name                = var.database_name
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name

  # Throughput configuration - autoscale for production
  dynamic "autoscale_settings" {
    for_each = var.enable_autoscale ? [1] : []
    content {
      max_throughput = var.max_throughput
    }
  }

  # Manual throughput for non-autoscale
  throughput = var.enable_autoscale ? null : var.manual_throughput
}

# ============================================================================
# SQL Containers - Application Collections
# ============================================================================

# Jobs Container - Job listings and search
resource "azurerm_cosmosdb_sql_container" "jobs" {
  name                  = "jobs"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/location"
  partition_key_version = 2

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/description/?"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }

    # Composite indexes for efficient queries
    composite_index {
      index {
        path  = "/category"
        order = "Ascending"
      }
      index {
        path  = "/postedDate"
        order = "Descending"
      }
    }

    composite_index {
      index {
        path  = "/company"
        order = "Ascending"
      }
      index {
        path  = "/salary"
        order = "Descending"
      }
    }
  }

  default_ttl = var.jobs_ttl_seconds

  dynamic "autoscale_settings" {
    for_each = var.enable_container_autoscale ? [1] : []
    content {
      max_throughput = var.container_max_throughput
    }
  }

  throughput = var.enable_container_autoscale ? null : var.container_throughput
}

# User Activity Container - Activity feeds and events
resource "azurerm_cosmosdb_sql_container" "user_activity" {
  name                  = "userActivity"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/userId"
  partition_key_version = 2

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }

    composite_index {
      index {
        path  = "/activityType"
        order = "Ascending"
      }
      index {
        path  = "/timestamp"
        order = "Descending"
      }
    }
  }

  default_ttl = var.activity_ttl_seconds

  dynamic "autoscale_settings" {
    for_each = var.enable_container_autoscale ? [1] : []
    content {
      max_throughput = var.container_max_throughput
    }
  }

  throughput = var.enable_container_autoscale ? null : var.container_throughput
}

# Applications Container - Job applications tracking
resource "azurerm_cosmosdb_sql_container" "applications" {
  name                  = "applications"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/userId"
  partition_key_version = 2

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/coverLetter/?"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }

    composite_index {
      index {
        path  = "/status"
        order = "Ascending"
      }
      index {
        path  = "/appliedDate"
        order = "Descending"
      }
    }
  }

  default_ttl = -1 # No TTL for applications

  dynamic "autoscale_settings" {
    for_each = var.enable_container_autoscale ? [1] : []
    content {
      max_throughput = var.container_max_throughput
    }
  }

  throughput = var.enable_container_autoscale ? null : var.container_throughput
}

# Analytics Events Container - Analytics and metrics
resource "azurerm_cosmosdb_sql_container" "analytics_events" {
  name                  = "analyticsEvents"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/eventType"
  partition_key_version = 2

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/payload/?"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }

    composite_index {
      index {
        path  = "/userId"
        order = "Ascending"
      }
      index {
        path  = "/timestamp"
        order = "Descending"
      }
    }
  }

  default_ttl = var.analytics_ttl_seconds

  dynamic "autoscale_settings" {
    for_each = var.enable_container_autoscale ? [1] : []
    content {
      max_throughput = var.container_max_throughput
    }
  }

  throughput = var.enable_container_autoscale ? null : var.container_throughput
}

# Audit Logs Container - Security and compliance
resource "azurerm_cosmosdb_sql_container" "audit_logs" {
  name                  = "auditLogs"
  resource_group_name   = var.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.main.name
  partition_key_path    = "/resourceType"
  partition_key_version = 2

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }

    excluded_path {
      path = "/\"_etag\"/?"
    }

    composite_index {
      index {
        path  = "/userId"
        order = "Ascending"
      }
      index {
        path  = "/timestamp"
        order = "Descending"
      }
    }

    composite_index {
      index {
        path  = "/action"
        order = "Ascending"
      }
      index {
        path  = "/timestamp"
        order = "Descending"
      }
    }
  }

  default_ttl = var.audit_ttl_seconds

  dynamic "autoscale_settings" {
    for_each = var.enable_container_autoscale ? [1] : []
    content {
      max_throughput = var.container_max_throughput
    }
  }

  throughput = var.enable_container_autoscale ? null : var.container_throughput
}

# ============================================================================
# Diagnostic Settings
# ============================================================================

resource "azurerm_monitor_diagnostic_setting" "cosmos" {
  count                      = var.enable_diagnostics ? 1 : 0
  name                       = "cosmos-diagnostics"
  target_resource_id         = azurerm_cosmosdb_account.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "DataPlaneRequests"
  }

  enabled_log {
    category = "QueryRuntimeStatistics"
  }

  enabled_log {
    category = "PartitionKeyStatistics"
  }

  enabled_log {
    category = "PartitionKeyRUConsumption"
  }

  enabled_log {
    category = "ControlPlaneRequests"
  }

  metric {
    category = "Requests"
    enabled  = true
  }
}

# ============================================================================
# Role Assignments for Managed Identity Access
# ============================================================================

resource "azurerm_cosmosdb_sql_role_definition" "data_contributor" {
  count               = var.enable_rbac_data_plane ? 1 : 0
  name                = "CosmosDB Data Contributor - ${var.project_name}"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  assignable_scopes   = [azurerm_cosmosdb_account.main.id]
  type                = "CustomRole"

  permissions {
    data_actions = [
      "Microsoft.DocumentDB/databaseAccounts/readMetadata",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/items/*",
      "Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers/*"
    ]
  }
}

resource "azurerm_cosmosdb_sql_role_assignment" "workload_identity" {
  count               = var.enable_rbac_data_plane && var.workload_identity_principal_id != null ? 1 : 0
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = azurerm_cosmosdb_sql_role_definition.data_contributor[0].id
  principal_id        = var.workload_identity_principal_id
  scope               = azurerm_cosmosdb_account.main.id
}
