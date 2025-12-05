# Dashboards Module - Outputs
# JobPilot AI Platform - Azure Portal Dashboard Configuration

# ============================================================================
# DASHBOARD OUTPUTS
# ============================================================================

output "dashboard_id" {
  description = "Resource ID of the Azure Portal Dashboard"
  value       = azurerm_portal_dashboard.main.id
}

output "dashboard_name" {
  description = "Name of the Azure Portal Dashboard"
  value       = azurerm_portal_dashboard.main.name
}

output "dashboard_url" {
  description = "URL to access the dashboard in Azure Portal"
  value       = "https://portal.azure.com/#@/dashboard/arm${azurerm_portal_dashboard.main.id}"
}

# ============================================================================
# DASHBOARD CONFIGURATION SUMMARY
# ============================================================================

output "dashboard_summary" {
  description = "Summary of the dashboard configuration"
  value = {
    name           = azurerm_portal_dashboard.main.name
    location       = azurerm_portal_dashboard.main.location
    resource_group = azurerm_portal_dashboard.main.resource_group_name

    enabled_features = {
      application_insights = var.app_insights_id != null
      log_analytics        = var.log_analytics_workspace_id != null
      sql_database         = var.sql_server_id != null
      redis_cache          = var.redis_cache_id != null
      application_gateway  = var.application_gateway_id != null
      front_door           = var.front_door_id != null
      aks_cluster          = var.aks_cluster_id != null
      storage_account      = var.storage_account_id != null
      key_vault            = var.key_vault_id != null
    }

    web_apps_count = length(var.web_app_ids)
    time_range     = "${var.dashboard_time_range} hours"
  }
}

# ============================================================================
# RESOURCE GROUP INFORMATION
# ============================================================================

output "resource_group_name" {
  description = "Name of the resource group containing the dashboard"
  value       = azurerm_portal_dashboard.main.resource_group_name
}

output "location" {
  description = "Azure region where the dashboard is deployed"
  value       = azurerm_portal_dashboard.main.location
}

# ============================================================================
# TAGS
# ============================================================================

output "tags" {
  description = "Tags applied to the dashboard"
  value       = azurerm_portal_dashboard.main.tags
}
