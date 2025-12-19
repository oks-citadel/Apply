# ============================================================================
# Azure Cost Management - Budgets and Guardrails
# ============================================================================
# This configuration implements cost control measures including:
# - Monthly budgets per environment
# - Cost anomaly alerts
# - Budget threshold notifications
# - Cost allocation tags

# ============================================================================
# Data Sources
# ============================================================================

data "azurerm_subscription" "cost_management" {}

# ============================================================================
# Environment-Specific Budget Thresholds (USD per month)
# ============================================================================

locals {
  budget_limits = {
    dev = {
      amount             = 500 # $500/month for dev
      alert_thresholds   = [50, 75, 90, 100]
      forecast_threshold = 100
    }
    staging = {
      amount             = 1000 # $1000/month for staging
      alert_thresholds   = [50, 75, 90, 100]
      forecast_threshold = 100
    }
    prod = {
      amount             = 5000 # $5000/month for production
      alert_thresholds   = [50, 75, 90, 100, 110]
      forecast_threshold = 100
    }
  }

  current_budget = local.budget_limits[var.environment]

  # Cost allocation tags for tracking
  cost_tags = merge(
    local.common_tags,
    {
      CostCenter   = "Engineering"
      BusinessUnit = "Product"
      CostOwner    = "Platform Team"
      BudgetCode   = "PLATFORM-${upper(var.environment)}"
      Criticality  = var.environment == "prod" ? "High" : var.environment == "staging" ? "Medium" : "Low"
    }
  )
}

# ============================================================================
# Resource Group Budget
# ============================================================================

resource "azurerm_consumption_budget_resource_group" "environment_budget" {
  name              = "${var.project_name}-${var.environment}-budget"
  resource_group_id = azurerm_resource_group.main.id

  amount     = local.current_budget.amount
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
    # No end date - budget recurs monthly
  }

  # Budget filter to include only resources with our tags
  filter {
    tag {
      name   = "Environment"
      values = [var.environment]
    }
  }

  # Alert notifications at multiple thresholds
  dynamic "notification" {
    for_each = local.current_budget.alert_thresholds
    content {
      enabled   = true
      threshold = notification.value
      operator  = "GreaterThan"

      contact_emails = [
        "citadelcloudmanagement@gmail.com",
      ]

      contact_roles = [
        "Owner",
        "Contributor",
      ]

      # Threshold type: Actual or Forecasted
      threshold_type = notification.value >= 100 ? "Forecasted" : "Actual"
    }
  }

  # Forecasted spending notification
  notification {
    enabled        = true
    threshold      = local.current_budget.forecast_threshold
    operator       = "GreaterThan"
    threshold_type = "Forecasted"

    contact_emails = [
      "citadelcloudmanagement@gmail.com",
    ]
  }
}

# ============================================================================
# Subscription-Level Budget (Overall Cap)
# ============================================================================

resource "azurerm_consumption_budget_subscription" "subscription_budget" {
  name            = "${var.project_name}-subscription-budget"
  subscription_id = data.azurerm_subscription.cost_management.id

  # Total subscription budget across all environments
  amount     = 10000 # $10,000/month total cap
  time_grain = "Monthly"

  time_period {
    start_date = formatdate("YYYY-MM-01'T'00:00:00Z", timestamp())
  }

  # Critical alerts at 90% and 100%
  notification {
    enabled   = true
    threshold = 90
    operator  = "GreaterThan"

    contact_emails = [
      "citadelcloudmanagement@gmail.com",
    ]

    contact_roles = [
      "Owner",
    ]
  }

  notification {
    enabled   = true
    threshold = 100
    operator  = "GreaterThan"

    contact_emails = [
      "citadelcloudmanagement@gmail.com",
    ]

    contact_roles = [
      "Owner",
    ]
  }
}

# ============================================================================
# Cost Anomaly Alert (using Azure Monitor)
# ============================================================================

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "cost_anomaly_alert" {
  name                = "${var.project_name}-${var.environment}-cost-anomaly"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  evaluation_frequency = "PT1H"
  window_duration      = "PT1H"
  scopes               = [module.app_insights.workspace_id]
  severity             = var.environment == "prod" ? 1 : 2

  criteria {
    query = <<-QUERY
      AzureMetrics
      | where ResourceProvider == "MICROSOFT.CONTAINERREGISTRY"
         or ResourceProvider == "MICROSOFT.CONTAINERSERVICE"
         or ResourceProvider == "MICROSOFT.CACHE"
         or ResourceProvider == "MICROSOFT.DBFORPOSTGRESQL"
      | where MetricName == "StorageUsed" or MetricName == "NetworkBytes"
      | summarize AggregatedValue = avg(Total) by Resource, bin(TimeGenerated, 1h)
      | where AggregatedValue > 1000000000
    QUERY

    time_aggregation_method = "Average"
    threshold               = 1
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  auto_mitigation_enabled = false
  description             = "Alert when resource costs show anomalous patterns"
  display_name            = "${var.project_name}-${var.environment} Cost Anomaly"
  enabled                 = true
  skip_query_validation   = false

  action {
    action_groups = [module.monitoring.action_group_id]
  }

  tags = local.cost_tags
}

# ============================================================================
# Resource-Specific Cost Guardrails
# ============================================================================

# Alert for expensive AKS node pools
resource "azurerm_monitor_metric_alert" "aks_node_count" {
  count               = var.enable_aks ? 1 : 0
  name                = "${var.project_name}-${var.environment}-aks-node-count-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.aks[0].cluster_id]
  description         = "Alert when AKS node count exceeds expected threshold"
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "kube_node_status_allocatable_cpu_cores"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = var.environment == "prod" ? 20 : var.environment == "staging" ? 10 : 5
  }

  action {
    action_group_id = module.monitoring.action_group_id
  }

  frequency   = "PT15M"
  window_size = "PT15M"

  tags = local.cost_tags
}

# Alert for Redis Cache memory usage (to prevent scale-up)
resource "azurerm_monitor_metric_alert" "redis_memory_alert" {
  name                = "${var.project_name}-${var.environment}-redis-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.redis_cache.cache_id]
  description         = "Alert when Redis memory usage is high (may trigger expensive scale-up)"
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "usedmemorypercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = module.monitoring.action_group_id
  }

  frequency   = "PT5M"
  window_size = "PT15M"

  tags = local.cost_tags
}

# Alert for PostgreSQL storage usage
resource "azurerm_monitor_metric_alert" "postgres_storage_alert" {
  count               = var.enable_postgresql ? 1 : 0
  name                = "${var.project_name}-${var.environment}-postgres-storage-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.postgresql[0].server_id]
  description         = "Alert when PostgreSQL storage usage is high"
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "storage_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = module.monitoring.action_group_id
  }

  frequency   = "PT15M"
  window_size = "PT30M"

  tags = local.cost_tags
}

# ============================================================================
# ACR Storage Cost Alert
# ============================================================================

resource "azurerm_monitor_metric_alert" "acr_storage_alert" {
  name                = "${var.project_name}-${var.environment}-acr-storage-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [module.container_registry.registry_id]
  description         = "Alert when ACR storage grows beyond expected threshold"
  severity            = 2

  criteria {
    metric_namespace = "Microsoft.ContainerRegistry/registries"
    metric_name      = "StorageUsed"
    aggregation      = "Average"
    operator         = "GreaterThan"
    # Threshold in bytes: 100GB for dev, 500GB for staging, 1TB for prod
    threshold = var.environment == "prod" ? 1099511627776 : var.environment == "staging" ? 536870912000 : 107374182400
  }

  action {
    action_group_id = module.monitoring.action_group_id
  }

  frequency   = "PT1H"
  window_size = "PT6H"

  tags = local.cost_tags
}

# ============================================================================
# Outputs
# ============================================================================

output "resource_group_budget_id" {
  description = "ID of the resource group budget"
  value       = azurerm_consumption_budget_resource_group.environment_budget.id
}

output "subscription_budget_id" {
  description = "ID of the subscription budget"
  value       = azurerm_consumption_budget_subscription.subscription_budget.id
}

output "budget_amount" {
  description = "Monthly budget amount for this environment"
  value       = local.current_budget.amount
}

output "cost_allocation_tags" {
  description = "Cost allocation tags for resource tracking"
  value       = local.cost_tags
}
