# ============================================================================
# IDENTITY MODULE - Outputs
# ApplyForUs SaaS Platform
# ============================================================================

# ============================================================================
# WEB APPLICATION OUTPUTS
# ============================================================================

output "web_app_client_id" {
  description = "Client ID of the web application"
  value       = azuread_application.web.client_id
}

output "web_app_object_id" {
  description = "Object ID of the web application"
  value       = azuread_application.web.object_id
}

output "web_app_client_secret" {
  description = "Client secret of the web application"
  value       = var.create_client_secrets ? azuread_application_password.web[0].value : null
  sensitive   = true
}

# ============================================================================
# API APPLICATION OUTPUTS
# ============================================================================

output "api_app_client_id" {
  description = "Client ID of the API application"
  value       = azuread_application.api.client_id
}

output "api_app_object_id" {
  description = "Object ID of the API application"
  value       = azuread_application.api.object_id
}

output "api_service_principal_id" {
  description = "Service principal ID of the API application"
  value       = azuread_service_principal.api.object_id
}

output "api_identifier_uri" {
  description = "Identifier URI of the API application"
  value       = var.api_identifier_uri
}

# API OAuth2 Scope IDs
output "api_scope_ids" {
  description = "OAuth2 scope IDs for the API"
  value = {
    user_impersonation   = random_uuid.user_impersonation.result
    profile_read         = random_uuid.profile_read.result
    profile_write        = random_uuid.profile_write.result
    jobs_read            = random_uuid.jobs_read.result
    jobs_apply           = random_uuid.jobs_apply.result
    resume_manage        = random_uuid.resume_manage.result
    subscription_manage  = random_uuid.subscription_manage.result
  }
}

# API App Role IDs
output "api_role_ids" {
  description = "App role IDs for the API"
  value = {
    user        = random_uuid.role_user.result
    verified    = random_uuid.role_verified.result
    support     = random_uuid.role_support.result
    admin       = random_uuid.role_admin.result
    super_admin = random_uuid.role_super_admin.result
  }
}

# ============================================================================
# AUTOMATION APPLICATION OUTPUTS
# ============================================================================

output "automation_app_client_id" {
  description = "Client ID of the automation application"
  value       = azuread_application.automation.client_id
}

output "automation_app_object_id" {
  description = "Object ID of the automation application"
  value       = azuread_application.automation.object_id
}

output "automation_service_principal_id" {
  description = "Service principal ID of the automation application"
  value       = azuread_service_principal.automation.object_id
}

output "automation_app_secret" {
  description = "Client secret of the automation application"
  value       = azuread_application_password.automation.value
  sensitive   = true
}

# ============================================================================
# SECURITY GROUP OUTPUTS
# ============================================================================

output "subscription_tier_group_ids" {
  description = "Object IDs of subscription tier security groups"
  value = var.create_security_groups ? {
    for tier in var.subscription_tiers : tier => azuread_group.subscription_tiers[tier].object_id
  } : {}
}

output "special_group_ids" {
  description = "Object IDs of special security groups"
  value = var.create_security_groups ? {
    verified    = azuread_group.verified[0].object_id
    support     = azuread_group.support[0].object_id
    admin       = azuread_group.admin[0].object_id
    super_admin = azuread_group.super_admin[0].object_id
    suspended   = azuread_group.suspended[0].object_id
  } : {}
}

output "all_group_ids" {
  description = "All security group IDs in a flat map"
  value = var.create_security_groups ? merge(
    { for tier in var.subscription_tiers : tier => azuread_group.subscription_tiers[tier].object_id },
    {
      verified    = azuread_group.verified[0].object_id
      support     = azuread_group.support[0].object_id
      admin       = azuread_group.admin[0].object_id
      super_admin = azuread_group.super_admin[0].object_id
      suspended   = azuread_group.suspended[0].object_id
    }
  ) : {}
}

# ============================================================================
# CONFIGURATION OUTPUTS (For Backend Services)
# ============================================================================

output "backend_config" {
  description = "Configuration values for backend services"
  value = {
    # OAuth/OIDC configuration
    oauth = {
      authority        = var.b2c_tenant_name != "" ? "https://${var.b2c_tenant_name}.b2clogin.com/${var.b2c_tenant_name}.onmicrosoft.com/${var.b2c_policy_names.sign_up_sign_in}/v2.0" : "https://login.microsoftonline.com/common/v2.0"
      client_id        = azuread_application.api.client_id
      audience         = var.api_identifier_uri
      issuer           = var.b2c_tenant_name != "" ? "https://${var.b2c_tenant_name}.b2clogin.com/${var.b2c_tenant_id}/v2.0/" : null
    }

    # Group IDs for authorization
    groups = var.create_security_groups ? merge(
      { for tier in var.subscription_tiers : "GROUP_ID_${upper(tier)}" => azuread_group.subscription_tiers[tier].object_id },
      {
        GROUP_ID_VERIFIED    = azuread_group.verified[0].object_id
        GROUP_ID_SUPPORT     = azuread_group.support[0].object_id
        GROUP_ID_ADMIN       = azuread_group.admin[0].object_id
        GROUP_ID_SUPER_ADMIN = azuread_group.super_admin[0].object_id
        GROUP_ID_SUSPENDED   = azuread_group.suspended[0].object_id
      }
    ) : {}

    # Automation service credentials
    automation = {
      client_id     = azuread_application.automation.client_id
      tenant_id     = data.azuread_client_config.current.tenant_id
      # Secret should be stored in Key Vault, not exposed directly
    }
  }
  sensitive = false
}

output "environment_variables" {
  description = "Environment variables for backend services (for reference)"
  value = <<-EOT
    # Azure AD / B2C Configuration
    AZURE_AD_CLIENT_ID=${azuread_application.api.client_id}
    AZURE_AD_AUDIENCE=${var.api_identifier_uri}
    ${var.b2c_tenant_name != "" ? "AZURE_AD_AUTHORITY=https://${var.b2c_tenant_name}.b2clogin.com/${var.b2c_tenant_name}.onmicrosoft.com/${var.b2c_policy_names.sign_up_sign_in}/v2.0" : "# B2C not configured"}

    # Security Group IDs
    ${var.create_security_groups ? join("\n    ", [
      for tier in var.subscription_tiers : "GROUP_ID_${upper(tier)}=${azuread_group.subscription_tiers[tier].object_id}"
    ]) : "# Groups not created"}
    ${var.create_security_groups ? "GROUP_ID_VERIFIED=${azuread_group.verified[0].object_id}" : ""}
    ${var.create_security_groups ? "GROUP_ID_SUPPORT=${azuread_group.support[0].object_id}" : ""}
    ${var.create_security_groups ? "GROUP_ID_ADMIN=${azuread_group.admin[0].object_id}" : ""}
    ${var.create_security_groups ? "GROUP_ID_SUPER_ADMIN=${azuread_group.super_admin[0].object_id}" : ""}
    ${var.create_security_groups ? "GROUP_ID_SUSPENDED=${azuread_group.suspended[0].object_id}" : ""}

    # Automation App (for group sync)
    AUTOMATION_CLIENT_ID=${azuread_application.automation.client_id}
    AUTOMATION_TENANT_ID=${data.azuread_client_config.current.tenant_id}
    # AUTOMATION_CLIENT_SECRET=<stored in Key Vault>
  EOT
}

# ============================================================================
# JWKS AND OPENID CONFIGURATION
# ============================================================================

output "openid_config_url" {
  description = "OpenID Connect configuration URL"
  value = var.b2c_tenant_name != "" ? "https://${var.b2c_tenant_name}.b2clogin.com/${var.b2c_tenant_name}.onmicrosoft.com/${var.b2c_policy_names.sign_up_sign_in}/v2.0/.well-known/openid-configuration" : "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}/v2.0/.well-known/openid-configuration"
}

output "jwks_uri" {
  description = "JSON Web Key Set URI for token validation"
  value = var.b2c_tenant_name != "" ? "https://${var.b2c_tenant_name}.b2clogin.com/${var.b2c_tenant_name}.onmicrosoft.com/${var.b2c_policy_names.sign_up_sign_in}/discovery/v2.0/keys" : "https://login.microsoftonline.com/${data.azuread_client_config.current.tenant_id}/discovery/v2.0/keys"
}
