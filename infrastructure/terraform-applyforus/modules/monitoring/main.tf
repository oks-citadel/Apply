# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.resource_prefix}-law"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = var.retention_days
  tags                = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.resource_prefix}-ai"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  retention_in_days   = var.retention_days
  sampling_percentage = var.sampling_percentage
  tags                = var.tags
}

# Action Group for alerts
resource "azurerm_monitor_action_group" "main" {
  name                = "${var.resource_prefix}-action-group"
  resource_group_name = var.resource_group_name
  short_name          = "ApplyForUs"

  email_receiver {
    name                    = "admin-email"
    email_address           = var.alert_email_address
    use_common_alert_schema = true
  }

  # Webhook receiver for Slack/Teams (optional)
  dynamic "webhook_receiver" {
    for_each = var.webhook_url != null ? [1] : []
    content {
      name                    = "webhook"
      service_uri             = var.webhook_url
      use_common_alert_schema = true
    }
  }

  tags = var.tags
}

# Metric Alerts

# AKS CPU alert
resource "azurerm_monitor_metric_alert" "aks_cpu" {
  count               = var.aks_cluster_id != null ? 1 : 0
  name                = "${var.resource_prefix}-aks-cpu-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS CPU exceeds threshold"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# AKS Memory alert
resource "azurerm_monitor_metric_alert" "aks_memory" {
  count               = var.aks_cluster_id != null ? 1 : 0
  name                = "${var.resource_prefix}-aks-memory-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS memory exceeds threshold"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_working_set_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Application Gateway 5xx errors
resource "azurerm_monitor_metric_alert" "app_gateway_5xx" {
  count               = var.app_gateway_id != null ? 1 : 0
  name                = "${var.resource_prefix}-appgw-5xx-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.app_gateway_id]
  description         = "Alert when Application Gateway returns 5xx errors"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Network/applicationGateways"
    metric_name      = "ResponseStatus"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10

    dimension {
      name     = "HttpStatusGroup"
      operator = "Include"
      values   = ["5xx"]
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Application Insights availability alert
resource "azurerm_monitor_metric_alert" "app_insights_availability" {
  name                = "${var.resource_prefix}-availability-alert"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when application availability drops"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "availabilityResults/availabilityPercentage"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 95
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Application Insights response time alert
resource "azurerm_monitor_metric_alert" "app_insights_response_time" {
  name                = "${var.resource_prefix}-response-time-alert"
  resource_group_name = var.resource_group_name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when response time is too high"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 3000 # 3 seconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Budget alert
resource "azurerm_consumption_budget_resource_group" "main" {
  count             = var.enable_budget_alerts ? 1 : 0
  name              = "${var.resource_prefix}-budget"
  resource_group_id = var.resource_group_id

  amount     = var.monthly_budget_amount
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  notification {
    enabled   = true
    threshold = 80
    operator  = "GreaterThan"

    contact_emails = [
      var.alert_email_address
    ]
  }

  notification {
    enabled   = true
    threshold = 100
    operator  = "GreaterThan"

    contact_emails = [
      var.alert_email_address
    ]
  }
}
