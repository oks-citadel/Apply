# MFA Enforcement Module for Azure AD B2C
#
# This module configures MFA policies for the platform:
# - Conditional access policies
# - MFA registration enforcement
# - Risk-based authentication
# - Session management

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = ">= 2.0.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0.0"
    }
  }
}

# ==================== Conditional Access Policies ====================

# Require MFA for all users accessing sensitive resources
resource "azuread_conditional_access_policy" "require_mfa_all_users" {
  display_name = "Require MFA for All Users"
  state        = var.enforce_mfa ? "enabled" : "disabled"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users  = ["All"]
      excluded_users  = var.mfa_excluded_users
      excluded_groups = var.mfa_excluded_groups
    }

    locations {
      included_locations = ["All"]
      excluded_locations = var.trusted_locations
    }

    platforms {
      included_platforms = ["all"]
    }
  }

  grant_controls {
    operator                          = "OR"
    built_in_controls                 = ["mfa"]
    authentication_strength_policy_id = null
  }

  session_controls {
    sign_in_frequency        = var.session_lifetime_hours
    sign_in_frequency_period = "hours"
    persistent_browser_mode  = "never"
  }
}

# Require MFA for high-risk sign-ins
resource "azuread_conditional_access_policy" "require_mfa_high_risk" {
  display_name = "Require MFA for High-Risk Sign-ins"
  state        = var.enable_risk_based_mfa ? "enabled" : "disabled"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users = ["All"]
    }

    sign_in_risk_levels = ["high", "medium"]
  }

  grant_controls {
    operator          = "AND"
    built_in_controls = ["mfa", "passwordChange"]
  }

  session_controls {
    sign_in_frequency        = 1
    sign_in_frequency_period = "hours"
  }
}

# Block legacy authentication
resource "azuread_conditional_access_policy" "block_legacy_auth" {
  display_name = "Block Legacy Authentication"
  state        = "enabled"

  conditions {
    client_app_types = ["exchangeActiveSync", "other"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users = ["All"]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["block"]
  }
}

# Require MFA for admin roles
resource "azuread_conditional_access_policy" "require_mfa_admins" {
  display_name = "Require MFA for Administrators"
  state        = "enabled"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_roles = var.admin_roles
    }
  }

  grant_controls {
    operator          = "AND"
    built_in_controls = ["mfa"]
  }

  session_controls {
    sign_in_frequency        = 4
    sign_in_frequency_period = "hours"
    persistent_browser_mode  = "never"
  }
}

# Require MFA for payment/billing operations
resource "azuread_conditional_access_policy" "require_mfa_billing" {
  display_name = "Require MFA for Billing Operations"
  state        = var.enforce_mfa_billing ? "enabled" : "disabled"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = var.billing_app_ids
    }

    users {
      included_users = ["All"]
    }
  }

  grant_controls {
    operator          = "AND"
    built_in_controls = ["mfa"]
  }
}

# ==================== Named Locations ====================

# Define trusted corporate locations
resource "azuread_named_location" "corporate_offices" {
  count        = length(var.corporate_ip_ranges) > 0 ? 1 : 0
  display_name = "Corporate Offices"

  ip {
    ip_ranges = var.corporate_ip_ranges
    trusted   = true
  }
}

# Define blocked countries
resource "azuread_named_location" "blocked_countries" {
  count        = length(var.blocked_countries) > 0 ? 1 : 0
  display_name = "Blocked Countries"

  country {
    countries_and_regions                 = var.blocked_countries
    include_unknown_countries_and_regions = false
  }
}

# Block access from high-risk countries
resource "azuread_conditional_access_policy" "block_risky_locations" {
  count        = length(var.blocked_countries) > 0 ? 1 : 0
  display_name = "Block Access from High-Risk Countries"
  state        = "enabled"

  conditions {
    client_app_types = ["all"]

    applications {
      included_applications = ["All"]
    }

    users {
      included_users = ["All"]
    }

    locations {
      included_locations = [azuread_named_location.blocked_countries[0].id]
    }
  }

  grant_controls {
    operator          = "OR"
    built_in_controls = ["block"]
  }
}

# ==================== Authentication Methods ====================

# Configure available authentication methods
resource "azuread_authentication_strength_policy" "mfa_strong" {
  display_name = "Strong MFA Methods"
  description  = "Requires phishing-resistant authentication"

  allowed_combinations = [
    "fido2",
    "x509CertificateMultiFactor",
    "microsoftAuthenticatorPush,federatedMultiFactor",
    "microsoftAuthenticatorPush,fido2",
    "windowsHelloForBusiness",
  ]
}

# ==================== Diagnostic Logging ====================

resource "azurerm_monitor_diagnostic_setting" "aad_signin_logs" {
  count                      = var.log_analytics_workspace_id != "" ? 1 : 0
  name                       = "aad-signin-logs"
  target_resource_id         = "/tenants/${var.tenant_id}/providers/Microsoft.aadiam"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "SignInLogs"
  }

  enabled_log {
    category = "AuditLogs"
  }

  enabled_log {
    category = "NonInteractiveUserSignInLogs"
  }

  enabled_log {
    category = "ServicePrincipalSignInLogs"
  }

  enabled_log {
    category = "RiskyUsers"
  }

  enabled_log {
    category = "UserRiskEvents"
  }
}

# ==================== Alerts ====================

resource "azurerm_monitor_scheduled_query_rules_alert_v2" "mfa_failures" {
  count               = var.enable_mfa_alerts ? 1 : 0
  name                = "mfa-failure-alert"
  resource_group_name = var.resource_group_name
  location            = var.location

  evaluation_frequency = "PT5M"
  window_duration      = "PT5M"
  scopes               = [var.log_analytics_workspace_id]
  severity             = 2

  criteria {
    query = <<-EOT
      SigninLogs
      | where ResultType != 0
      | where AuthenticationRequirement == "multiFactorAuthentication"
      | where TimeGenerated > ago(5m)
      | summarize FailedAttempts = count() by UserPrincipalName
      | where FailedAttempts > 5
    EOT

    time_aggregation_method = "Count"
    threshold               = 1
    operator                = "GreaterThan"
  }

  action {
    action_groups = var.alert_action_group_ids
  }

  description = "Alert when MFA failures exceed threshold"
  enabled     = true
}
