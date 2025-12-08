# Random suffix for globally unique ACR name
resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${replace(var.resource_prefix, "-", "")}acr${random_string.acr_suffix.result}"
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = var.sku
  admin_enabled       = var.admin_enabled

  # Premium features
  public_network_access_enabled = var.enable_private_endpoint ? false : true

  dynamic "georeplications" {
    for_each = var.enable_geo_replication && var.sku == "Premium" ? [var.location_secondary] : []
    content {
      location                = georeplications.value
      zone_redundancy_enabled = true
      tags                    = var.tags
    }
  }

  # Network rule set (Premium SKU)
  dynamic "network_rule_set" {
    for_each = var.sku == "Premium" ? [1] : []
    content {
      default_action = var.enable_private_endpoint ? "Deny" : "Allow"
    }
  }

  # Enable vulnerability scanning
  dynamic "identity" {
    for_each = var.sku == "Premium" ? [1] : []
    content {
      type = "SystemAssigned"
    }
  }

  # Retention policy (Premium SKU only)
  dynamic "retention_policy" {
    for_each = var.sku == "Premium" ? [1] : []
    content {
      days    = var.retention_days
      enabled = true
    }
  }

  # Trust policy (Premium SKU)
  dynamic "trust_policy" {
    for_each = var.sku == "Premium" && var.enable_content_trust ? [1] : []
    content {
      enabled = true
    }
  }

  tags = var.tags
}

# Private endpoint for ACR
resource "azurerm_private_endpoint" "acr" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "${var.resource_prefix}-acr-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.resource_prefix}-acr-psc"
    private_connection_resource_id = azurerm_container_registry.main.id
    is_manual_connection           = false
    subresource_names              = ["registry"]
  }

  tags = var.tags
}

# Diagnostic settings for ACR
resource "azurerm_monitor_diagnostic_setting" "acr" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "${var.resource_prefix}-acr-diag"
  target_resource_id         = azurerm_container_registry.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ContainerRegistryRepositoryEvents"
  }

  enabled_log {
    category = "ContainerRegistryLoginEvents"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
