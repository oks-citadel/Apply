# Monitoring Module - Outputs
# JobPilot AI Platform - Azure Monitor Configuration

# ============================================================================
# ACTION GROUP OUTPUTS
# ============================================================================

output "action_group_id" {
  description = "Resource ID of the Azure Monitor Action Group"
  value       = azurerm_monitor_action_group.main.id
}

output "action_group_name" {
  description = "Name of the Azure Monitor Action Group"
  value       = azurerm_monitor_action_group.main.name
}

# ============================================================================
# METRIC ALERT OUTPUTS
# ============================================================================

output "app_service_cpu_alert_ids" {
  description = "Map of App Service names to their CPU alert rule IDs"
  value       = { for k, v in azurerm_monitor_metric_alert.app_service_cpu : k => v.id }
}

output "app_service_memory_alert_ids" {
  description = "Map of App Service names to their memory alert rule IDs"
  value       = { for k, v in azurerm_monitor_metric_alert.app_service_memory : k => v.id }
}

output "app_service_http_5xx_alert_ids" {
  description = "Map of App Service names to their HTTP 5xx alert rule IDs"
  value       = { for k, v in azurerm_monitor_metric_alert.app_service_http_5xx : k => v.id }
}

output "app_service_response_time_alert_ids" {
  description = "Map of App Service names to their response time alert rule IDs"
  value       = { for k, v in azurerm_monitor_metric_alert.app_service_response_time : k => v.id }
}

output "app_service_failed_requests_alert_ids" {
  description = "Map of App Service names to their failed requests alert rule IDs"
  value       = { for k, v in azurerm_monitor_metric_alert.app_service_failed_requests : k => v.id }
}

output "sql_server_dtu_alert_id" {
  description = "Resource ID of the SQL Server DTU alert rule"
  value       = var.sql_server_id != null ? azurerm_monitor_metric_alert.sql_server_dtu[0].id : null
}

output "redis_memory_alert_id" {
  description = "Resource ID of the Redis cache memory alert rule"
  value       = var.redis_cache_id != null ? azurerm_monitor_metric_alert.redis_memory[0].id : null
}

output "redis_server_load_alert_id" {
  description = "Resource ID of the Redis server load alert rule"
  value       = var.redis_cache_id != null ? azurerm_monitor_metric_alert.redis_server_load[0].id : null
}

output "aks_node_cpu_alert_id" {
  description = "Resource ID of the AKS node CPU alert rule"
  value       = var.aks_cluster_id != null ? azurerm_monitor_metric_alert.aks_node_cpu[0].id : null
}

output "aks_node_memory_alert_id" {
  description = "Resource ID of the AKS node memory alert rule"
  value       = var.aks_cluster_id != null ? azurerm_monitor_metric_alert.aks_node_memory[0].id : null
}

# ============================================================================
# AVAILABILITY TEST OUTPUTS
# ============================================================================

output "web_test_ids" {
  description = "Map of web app names to their availability test IDs"
  value       = { for k, v in azurerm_application_insights_standard_web_test.web_app : k => v.id }
}

output "web_test_names" {
  description = "Map of web app names to their availability test names"
  value       = { for k, v in azurerm_application_insights_standard_web_test.web_app : k => v.name }
}

# ============================================================================
# LOG QUERY ALERT OUTPUTS
# ============================================================================

output "error_rate_spike_alert_id" {
  description = "Resource ID of the error rate spike alert rule"
  value       = var.log_analytics_workspace_id != null ? azurerm_monitor_scheduled_query_rules_alert_v2.error_rate_spike[0].id : null
}

output "failed_auth_alert_id" {
  description = "Resource ID of the failed authentication attempts alert rule"
  value       = var.log_analytics_workspace_id != null ? azurerm_monitor_scheduled_query_rules_alert_v2.failed_auth[0].id : null
}

# ============================================================================
# CONSOLIDATED OUTPUTS
# ============================================================================

output "alert_rule_ids" {
  description = "List of all alert rule IDs created by this module"
  value = concat(
    values({ for k, v in azurerm_monitor_metric_alert.app_service_cpu : k => v.id }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_memory : k => v.id }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_http_5xx : k => v.id }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_response_time : k => v.id }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_failed_requests : k => v.id }),
    var.sql_server_id != null ? [azurerm_monitor_metric_alert.sql_server_dtu[0].id] : [],
    var.redis_cache_id != null ? [azurerm_monitor_metric_alert.redis_memory[0].id] : [],
    var.redis_cache_id != null ? [azurerm_monitor_metric_alert.redis_server_load[0].id] : [],
    var.aks_cluster_id != null ? [azurerm_monitor_metric_alert.aks_node_cpu[0].id] : [],
    var.aks_cluster_id != null ? [azurerm_monitor_metric_alert.aks_node_memory[0].id] : [],
    var.log_analytics_workspace_id != null ? [azurerm_monitor_scheduled_query_rules_alert_v2.error_rate_spike[0].id] : [],
    var.log_analytics_workspace_id != null ? [azurerm_monitor_scheduled_query_rules_alert_v2.failed_auth[0].id] : []
  )
}

output "all_alert_names" {
  description = "List of all alert rule names created by this module"
  value = concat(
    values({ for k, v in azurerm_monitor_metric_alert.app_service_cpu : k => v.name }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_memory : k => v.name }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_http_5xx : k => v.name }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_response_time : k => v.name }),
    values({ for k, v in azurerm_monitor_metric_alert.app_service_failed_requests : k => v.name }),
    var.sql_server_id != null ? [azurerm_monitor_metric_alert.sql_server_dtu[0].name] : [],
    var.redis_cache_id != null ? [azurerm_monitor_metric_alert.redis_memory[0].name] : [],
    var.redis_cache_id != null ? [azurerm_monitor_metric_alert.redis_server_load[0].name] : [],
    var.aks_cluster_id != null ? [azurerm_monitor_metric_alert.aks_node_cpu[0].name] : [],
    var.aks_cluster_id != null ? [azurerm_monitor_metric_alert.aks_node_memory[0].name] : []
  )
}

# ============================================================================
# MONITORING SUMMARY
# ============================================================================

output "monitoring_summary" {
  description = "Summary of all monitoring resources created"
  value = {
    action_group = {
      id   = azurerm_monitor_action_group.main.id
      name = azurerm_monitor_action_group.main.name
    }
    metric_alerts_count      = length(values({ for k, v in azurerm_monitor_metric_alert.app_service_cpu : k => v.id })) * 5 + (var.sql_server_id != null ? 1 : 0) + (var.redis_cache_id != null ? 2 : 0) + (var.aks_cluster_id != null ? 2 : 0)
    availability_tests_count = length(values({ for k, v in azurerm_application_insights_standard_web_test.web_app : k => v.id }))
    log_query_alerts_count   = var.log_analytics_workspace_id != null ? 2 : 0
    total_alerts             = length(values({ for k, v in azurerm_monitor_metric_alert.app_service_cpu : k => v.id })) * 5 + (var.sql_server_id != null ? 1 : 0) + (var.redis_cache_id != null ? 2 : 0) + (var.aks_cluster_id != null ? 2 : 0) + (var.log_analytics_workspace_id != null ? 2 : 0)
  }
}
