# Organization Module Outputs

output "organization_id" {
  description = "AWS Organization ID"
  value       = data.aws_organizations_organization.current.id
}

output "security_ou_id" {
  description = "Security OU ID"
  value       = aws_organizations_organizational_unit.security.id
}

output "shared_services_ou_id" {
  description = "Shared Services OU ID"
  value       = aws_organizations_organizational_unit.shared_services.id
}

output "workloads_ou_id" {
  description = "Workloads OU ID"
  value       = aws_organizations_organizational_unit.workloads.id
}

output "workloads_dev_ou_id" {
  description = "Workloads Dev OU ID"
  value       = aws_organizations_organizational_unit.workloads_dev.id
}

output "workloads_staging_ou_id" {
  description = "Workloads Staging OU ID"
  value       = aws_organizations_organizational_unit.workloads_staging.id
}

output "workloads_prod_ou_id" {
  description = "Workloads Prod OU ID"
  value       = aws_organizations_organizational_unit.workloads_prod.id
}

output "scp_ids" {
  description = "Map of SCP IDs"
  value = {
    deny_root_usage            = aws_organizations_policy.deny_root_usage.id
    deny_organizations_changes = aws_organizations_policy.deny_organizations_changes.id
    protect_audit_logs         = aws_organizations_policy.protect_audit_logs.id
    protect_production_deletes = aws_organizations_policy.protect_production_deletes.id
    deny_expensive_services    = aws_organizations_policy.deny_expensive_services.id
    enforce_region_restriction = aws_organizations_policy.enforce_region_restriction.id
    enforce_tagging            = aws_organizations_policy.enforce_tagging.id
  }
}
