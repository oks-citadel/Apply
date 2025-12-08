# Monitoring Module - Main Configuration
# JobPilot AI Platform - Azure Monitor Configuration

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Local variables for resource naming
locals {
  action_group_name = "${var.project_name}-${var.environment}-action-group"
  common_tags = merge(
    var.tags,
    {
      Module      = "monitoring"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )
}

# ============================================================================
# ACTION GROUP - Central notification hub for all alerts
# ============================================================================

resource "azurerm_monitor_action_group" "main" {
  name                = local.action_group_name
  resource_group_name = var.resource_group_name
  short_name          = substr("${var.project_name}-${var.environment}", 0, 12)

  # Email receivers for alert notifications
  dynamic "email_receiver" {
    for_each = var.alert_email_addresses
    content {
      name                    = "email-${email_receiver.key}"
      email_address           = email_receiver.value
      use_common_alert_schema = true
    }
  }

  # Optional webhook receiver for integration with external systems
  dynamic "webhook_receiver" {
    for_each = var.webhook_url != null ? [1] : []
    content {
      name                    = "webhook-receiver"
      service_uri             = var.webhook_url
      use_common_alert_schema = true
    }
  }

  tags = local.common_tags
}

# ============================================================================
# METRIC ALERTS - Infrastructure and Application Monitoring
# ============================================================================

# High CPU Alert for App Services
resource "azurerm_monitor_metric_alert" "app_service_cpu" {
  for_each = var.web_app_ids

  name                = "${var.project_name}-${var.environment}-${each.key}-high-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [each.value]
  description         = "Alert when CPU percentage is high for ${each.key}"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.cpu_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# High Memory Alert for App Services
resource "azurerm_monitor_metric_alert" "app_service_memory" {
  for_each = var.web_app_ids

  name                = "${var.project_name}-${var.environment}-${each.key}-high-memory"
  resource_group_name = var.resource_group_name
  scopes              = [each.value]
  description         = "Alert when memory percentage is high for ${each.key}"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "MemoryPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.memory_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# HTTP 5xx Error Alert for App Services
resource "azurerm_monitor_metric_alert" "app_service_http_5xx" {
  for_each = var.web_app_ids

  name                = "${var.project_name}-${var.environment}-${each.key}-http-5xx"
  resource_group_name = var.resource_group_name
  scopes              = [each.value]
  description         = "Alert when HTTP 5xx errors are detected for ${each.key}"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = var.http_5xx_threshold
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Response Time Alert for App Services
resource "azurerm_monitor_metric_alert" "app_service_response_time" {
  for_each = var.web_app_ids

  name                = "${var.project_name}-${var.environment}-${each.key}-slow-response"
  resource_group_name = var.resource_group_name
  scopes              = [each.value]
  description         = "Alert when response time exceeds threshold for ${each.key}"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "HttpResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.response_time_threshold_seconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Database DTU Alert
resource "azurerm_monitor_metric_alert" "sql_server_dtu" {
  count = var.enable_sql_monitoring ? 1 : 0

  name                = "${var.project_name}-${var.environment}-sql-high-dtu"
  resource_group_name = var.resource_group_name
  scopes              = [var.sql_server_id]
  description         = "Alert when SQL Database DTU usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Sql/servers/databases"
    metric_name      = "dtu_consumption_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.database_dtu_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Redis Cache Memory Alert
resource "azurerm_monitor_metric_alert" "redis_memory" {
  count = var.enable_redis_monitoring ? 1 : 0

  name                = "${var.project_name}-${var.environment}-redis-high-memory"
  resource_group_name = var.resource_group_name
  scopes              = [var.redis_cache_id]
  description         = "Alert when Redis cache memory usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "usedmemorypercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.redis_memory_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Redis Server Load Alert
resource "azurerm_monitor_metric_alert" "redis_server_load" {
  count = var.enable_redis_monitoring ? 1 : 0

  name                = "${var.project_name}-${var.environment}-redis-high-load"
  resource_group_name = var.resource_group_name
  scopes              = [var.redis_cache_id]
  description         = "Alert when Redis server load is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "serverLoad"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.redis_server_load_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# Failed Requests Alert for App Services
resource "azurerm_monitor_metric_alert" "app_service_failed_requests" {
  for_each = var.web_app_ids

  name                = "${var.project_name}-${var.environment}-${each.key}-failed-requests"
  resource_group_name = var.resource_group_name
  scopes              = [each.value]
  description         = "Alert when failed requests exceed threshold for ${each.key}"
  severity            = 2
  frequency           = "PT1M"
  window_size         = "PT5M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http4xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = var.failed_requests_threshold
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# ============================================================================
# APPLICATION INSIGHTS WEB TESTS - Availability Monitoring
# ============================================================================

# Web App Availability Test
resource "azurerm_application_insights_standard_web_test" "web_app" {
  for_each = var.web_app_urls

  name                    = "${var.project_name}-${var.environment}-${each.key}-availability"
  resource_group_name     = var.resource_group_name
  location                = var.location
  application_insights_id = var.app_insights_id
  description             = "Availability test for ${each.key}"
  frequency               = 300
  timeout                 = 30
  enabled                 = true
  geo_locations           = var.availability_test_locations

  request {
    url                              = each.value
    http_verb                        = "GET"
    parse_dependent_requests_enabled = false
  }

  validation_rules {
    expected_status_code        = 200
    ssl_cert_remaining_lifetime = 7
    ssl_check_enabled           = true
  }

  tags = local.common_tags
}

# ============================================================================
# LOG ANALYTICS QUERY ALERTS - Advanced Detection
# ============================================================================

# Error Rate Spike Detection
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "error_rate_spike" {
  count = var.enable_log_query_alerts ? 1 : 0

  name                 = "${var.project_name}-${var.environment}-error-rate-spike"
  resource_group_name  = var.resource_group_name
  location             = var.location
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"
  scopes               = [var.log_analytics_workspace_id]
  severity             = 1
  description          = "Alert when error rate spikes above normal baseline"
  enabled              = true

  criteria {
    query                   = <<-QUERY
      AppExceptions
      | where TimeGenerated > ago(15m)
      | summarize ErrorCount = count() by bin(TimeGenerated, 5m)
      | where ErrorCount > ${var.error_spike_threshold}
    QUERY
    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.main.id]
  }

  auto_mitigation_enabled = true
  skip_query_validation   = false

  tags = local.common_tags
}

# Failed Authentication Attempts Detection
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "failed_auth" {
  count = var.enable_log_query_alerts ? 1 : 0

  name                 = "${var.project_name}-${var.environment}-failed-auth-attempts"
  resource_group_name  = var.resource_group_name
  location             = var.location
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"
  scopes               = [var.log_analytics_workspace_id]
  severity             = 1
  description          = "Alert when multiple failed authentication attempts are detected"
  enabled              = true

  criteria {
    query                   = <<-QUERY
      AppTraces
      | where TimeGenerated > ago(15m)
      | where Message contains "authentication failed" or Message contains "login failed"
      | summarize FailedAttempts = count() by bin(TimeGenerated, 5m), ClientIP = tostring(Properties.ClientIP)
      | where FailedAttempts > ${var.failed_auth_threshold}
    QUERY
    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.main.id]
  }

  auto_mitigation_enabled = true
  skip_query_validation   = false

  tags = local.common_tags
}

# AKS Node CPU Alert (if AKS cluster ID provided)
resource "azurerm_monitor_metric_alert" "aks_node_cpu" {
  count = var.enable_aks_monitoring ? 1 : 0

  name                = "${var.project_name}-${var.environment}-aks-node-high-cpu"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS node CPU usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.aks_cpu_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}

# AKS Node Memory Alert (if AKS cluster ID provided)
resource "azurerm_monitor_metric_alert" "aks_node_memory" {
  count = var.enable_aks_monitoring ? 1 : 0

  name                = "${var.project_name}-${var.environment}-aks-node-high-memory"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS node memory usage is high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  enabled             = true

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_working_set_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.aks_memory_threshold_percent
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.common_tags
}
