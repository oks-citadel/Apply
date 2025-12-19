# ============================================================================
# DNS Module Outputs
# ============================================================================

output "dns_zone_id" {
  description = "Azure DNS Zone resource ID"
  value       = azurerm_dns_zone.main.id
}

output "dns_zone_name" {
  description = "DNS Zone name"
  value       = azurerm_dns_zone.main.name
}

output "nameservers" {
  description = "DNS nameservers to configure at domain registrar"
  value       = azurerm_dns_zone.main.name_servers
}

output "root_domain_ip" {
  description = "IP address configured for root domain"
  value       = var.ingress_public_ip
}

output "api_subdomain_ip" {
  description = "IP address configured for API subdomain"
  value       = var.ingress_public_ip
}

output "staging_subdomain_ip" {
  description = "IP address configured for staging subdomain"
  value       = var.enable_staging ? var.staging_public_ip : null
}

output "dns_configuration_summary" {
  description = "Summary of DNS configuration for documentation"
  value = {
    domain             = var.domain_name
    nameservers        = azurerm_dns_zone.main.name_servers
    root_domain        = var.ingress_public_ip
    www_subdomain      = "CNAME to ${var.domain_name}"
    api_subdomain      = var.ingress_public_ip
    staging_subdomain  = var.enable_staging ? var.staging_public_ip : "Not configured"
    mx_records_enabled = var.enable_mx_records
    acme_dns_enabled   = var.enable_acme_dns_validation
  }
}
