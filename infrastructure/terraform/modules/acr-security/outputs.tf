# ACR Security Module Outputs

output "content_trust_enabled" {
  description = "Whether Docker Content Trust is enabled"
  value       = var.enable_content_trust
}

output "retention_policy_enabled" {
  description = "Whether retention policy is enabled"
  value       = var.enable_retention_policy
}

output "quarantine_enabled" {
  description = "Whether quarantine policy is enabled"
  value       = var.enable_quarantine
}

output "private_endpoint_id" {
  description = "ID of the private endpoint (if created)"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.acr[0].id : null
}

output "private_dns_zone_id" {
  description = "ID of the private DNS zone (if created)"
  value       = var.enable_private_endpoint ? azurerm_private_dns_zone.acr[0].id : null
}

output "security_features" {
  description = "Summary of enabled security features"
  value = {
    content_trust        = var.enable_content_trust
    retention_policy     = var.enable_retention_policy
    quarantine           = var.enable_quarantine
    private_endpoint     = var.enable_private_endpoint
    defender_enabled     = var.defender_tier == "Standard"
    signed_images_policy = var.enforce_signed_images
  }
}

output "immutable_tag_policy" {
  description = "Instructions for using immutable tags"
  value       = <<-EOT
    To ensure immutable container deployments:
    1. Always push images with unique tags (e.g., git SHA)
    2. Use digest references in Kubernetes manifests
    3. Example: image: ${var.acr_name}.azurecr.io/myapp@sha256:abc123...

    The :latest tag should only be used for development.
    Production deployments must use digest-based references.
  EOT
}
