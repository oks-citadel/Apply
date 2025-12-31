terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Microsoft Defender for Cloud - equivalent to AWS GuardDuty + Security Hub
resource "azurerm_security_center_subscription_pricing" "defender_servers" {
  tier          = var.defender_tier
  resource_type = "VirtualMachines"
}

resource "azurerm_security_center_subscription_pricing" "defender_containers" {
  tier          = var.defender_tier
  resource_type = "Containers"
}

resource "azurerm_security_center_subscription_pricing" "defender_keyvault" {
  tier          = var.defender_tier
  resource_type = "KeyVaults"
}

resource "azurerm_security_center_subscription_pricing" "defender_storage" {
  tier          = var.defender_tier
  resource_type = "StorageAccounts"
}

resource "azurerm_security_center_subscription_pricing" "defender_appservice" {
  tier          = var.defender_tier
  resource_type = "AppServices"
}

resource "azurerm_security_center_subscription_pricing" "defender_sql" {
  tier          = var.defender_tier
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "defender_arm" {
  tier          = var.defender_tier
  resource_type = "Arm"
}

resource "azurerm_security_center_subscription_pricing" "defender_dns" {
  tier          = var.defender_tier
  resource_type = "Dns"
}

# Security Center Contact - for alerts (equivalent to GuardDuty notifications)
resource "azurerm_security_center_contact" "security_contact" {
  name                = "security-contact"
  email               = var.security_contact_email
  phone               = var.security_contact_phone
  alert_notifications = true
  alerts_to_admins    = true
}

# Auto-provisioning of Log Analytics agent (equivalent to CloudTrail)
resource "azurerm_security_center_auto_provisioning" "auto_provisioning" {
  auto_provision = var.enable_auto_provisioning ? "On" : "Off"
}

# Security Center Workspace - for centralized logging
resource "azurerm_security_center_workspace" "security_workspace" {
  count        = var.log_analytics_workspace_id != null ? 1 : 0
  scope        = "/subscriptions/${var.subscription_id}"
  workspace_id = var.log_analytics_workspace_id
}

# Activity Log Alert for security events (equivalent to CloudTrail alerts)
resource "azurerm_monitor_activity_log_alert" "security_alert" {
  for_each            = var.security_alerts
  name                = each.value.name
  resource_group_name = var.resource_group_name
  scopes              = ["/subscriptions/${var.subscription_id}"]
  description         = each.value.description

  criteria {
    category       = each.value.category
    operation_name = each.value.operation_name
    level          = each.value.level
  }

  action {
    action_group_id = var.action_group_id
  }

  tags = var.tags
}

# Policy Assignment for security compliance
resource "azurerm_subscription_policy_assignment" "security_benchmark" {
  count                = var.enable_security_benchmark ? 1 : 0
  name                 = "azure-security-benchmark"
  subscription_id      = "/subscriptions/${var.subscription_id}"
  policy_definition_id = "/providers/Microsoft.Authorization/policySetDefinitions/1f3afdf9-d0c9-4c3d-847f-89da613e70a8"
  description          = "Azure Security Benchmark - Security controls for cloud workloads"
  display_name         = "Azure Security Benchmark"

  identity {
    type = "SystemAssigned"
  }

  location = var.location
}

# Diagnostic Settings for Activity Log (equivalent to CloudTrail)
resource "azurerm_monitor_diagnostic_setting" "activity_log" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "activity-log-diagnostics"
  target_resource_id         = "/subscriptions/${var.subscription_id}"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "Administrative"
  }

  enabled_log {
    category = "Security"
  }

  enabled_log {
    category = "Alert"
  }

  enabled_log {
    category = "Policy"
  }

  enabled_log {
    category = "Autoscale"
  }

  enabled_log {
    category = "ResourceHealth"
  }
}
