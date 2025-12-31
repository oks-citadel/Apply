# MFA Enforcement Module Outputs

output "mfa_policy_id" {
  description = "ID of the main MFA policy"
  value       = azuread_conditional_access_policy.require_mfa_all_users.id
}

output "high_risk_policy_id" {
  description = "ID of the high-risk sign-in policy"
  value       = var.enable_risk_based_mfa ? azuread_conditional_access_policy.require_mfa_high_risk.id : null
}

output "admin_mfa_policy_id" {
  description = "ID of the admin MFA policy"
  value       = azuread_conditional_access_policy.require_mfa_admins.id
}

output "legacy_auth_block_policy_id" {
  description = "ID of the legacy auth blocking policy"
  value       = azuread_conditional_access_policy.block_legacy_auth.id
}

output "policies_enabled" {
  description = "Summary of enabled MFA policies"
  value = {
    require_mfa_all_users = var.enforce_mfa
    require_mfa_high_risk = var.enable_risk_based_mfa
    require_mfa_admins    = true
    block_legacy_auth     = true
    require_mfa_billing   = var.enforce_mfa_billing
    block_risky_locations = length(var.blocked_countries) > 0
  }
}

output "mfa_configuration_summary" {
  description = "Summary of MFA configuration"
  value       = <<-EOT
    MFA Enforcement Configuration:
    ==============================
    - All Users MFA: ${var.enforce_mfa ? "ENABLED" : "DISABLED"}
    - Risk-based MFA: ${var.enable_risk_based_mfa ? "ENABLED" : "DISABLED"}
    - Admin MFA: ENABLED (always on for admin roles)
    - Billing MFA: ${var.enforce_mfa_billing ? "ENABLED" : "DISABLED"}
    - Legacy Auth: BLOCKED (security requirement)
    - Session Lifetime: ${var.session_lifetime_hours} hours
    - Excluded Users: ${length(var.mfa_excluded_users)}
    - Blocked Countries: ${length(var.blocked_countries)}

    Recommended Actions:
    1. Ensure all users register for MFA
    2. Configure backup authentication methods
    3. Review excluded users regularly
    4. Monitor MFA failure alerts
  EOT
}
