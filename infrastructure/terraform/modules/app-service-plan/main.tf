# App Service Plan Module
# Creates a Linux-based App Service Plan with optional autoscaling

resource "azurerm_service_plan" "main" {
  name                = "${var.project_name}-asp-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  os_type             = "Linux"
  sku_name            = var.plan_sku

  tags = merge(
    var.tags,
    {
      Component = "App Service Plan"
      ManagedBy = "Terraform"
    }
  )
}

# Autoscaling configuration (only created if enabled)
resource "azurerm_monitor_autoscale_setting" "main" {
  count               = var.enable_autoscaling ? 1 : 0
  name                = "${var.project_name}-asp-autoscale-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location
  target_resource_id  = azurerm_service_plan.main.id

  # Default profile - base capacity
  profile {
    name = "DefaultProfile"

    capacity {
      default = var.min_capacity
      minimum = var.min_capacity
      maximum = var.max_capacity
    }
  }

  # Scale out profile - increase instances when CPU is high
  profile {
    name = "ScaleOutProfile"

    capacity {
      default = var.min_capacity
      minimum = var.min_capacity
      maximum = var.max_capacity
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 75
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "MemoryPercentage"
        metric_resource_id = azurerm_service_plan.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 80
      }

      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }

  # Scale in profile - decrease instances when CPU is low
  profile {
    name = "ScaleInProfile"

    capacity {
      default = var.min_capacity
      minimum = var.min_capacity
      maximum = var.max_capacity
    }

    rule {
      metric_trigger {
        metric_name        = "CpuPercentage"
        metric_resource_id = azurerm_service_plan.main.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT10M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 25
      }

      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT10M"
      }
    }
  }

  tags = merge(
    var.tags,
    {
      Component = "Autoscaling"
      ManagedBy = "Terraform"
    }
  )
}
