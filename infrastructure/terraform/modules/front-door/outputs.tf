output "profile_id" {
  description = "Front Door profile resource ID"
  value       = azurerm_cdn_frontdoor_profile.main.id
}

output "profile_name" {
  description = "Front Door profile name"
  value       = azurerm_cdn_frontdoor_profile.main.name
}

output "resource_guid" {
  description = "Front Door resource GUID"
  value       = azurerm_cdn_frontdoor_profile.main.resource_guid
}

output "endpoint_host_names" {
  description = "Map of endpoint keys to their host names"
  value = {
    for key, endpoint in azurerm_cdn_frontdoor_endpoint.main :
    key => endpoint.host_name
  }
}

output "endpoint_ids" {
  description = "Map of endpoint keys to their resource IDs"
  value = {
    for key, endpoint in azurerm_cdn_frontdoor_endpoint.main :
    key => endpoint.id
  }
}

output "front_door_url" {
  description = "Primary Front Door endpoint URL (main endpoint)"
  value       = lookup(azurerm_cdn_frontdoor_endpoint.main, "main", null) != null ? "https://${azurerm_cdn_frontdoor_endpoint.main["main"].host_name}" : null
}

output "all_endpoint_urls" {
  description = "Map of all Front Door endpoint URLs"
  value = {
    for key, endpoint in azurerm_cdn_frontdoor_endpoint.main :
    key => "https://${endpoint.host_name}"
  }
}

output "origin_group_ids" {
  description = "Map of origin group keys to their resource IDs"
  value = {
    for key, group in azurerm_cdn_frontdoor_origin_group.main :
    key => group.id
  }
}

output "origin_ids" {
  description = "Map of origin keys to their resource IDs"
  value = {
    for key, origin in azurerm_cdn_frontdoor_origin.main :
    key => origin.id
  }
}

output "custom_domain_ids" {
  description = "Map of custom domain keys to their resource IDs"
  value = {
    for key, domain in azurerm_cdn_frontdoor_custom_domain.main :
    key => domain.id
  }
}

output "custom_domain_validation_tokens" {
  description = "Map of custom domain keys to their validation tokens"
  value = {
    for key, domain in azurerm_cdn_frontdoor_custom_domain.main :
    key => domain.validation_token
  }
  sensitive = true
}

output "route_ids" {
  description = "Map of route keys to their resource IDs"
  value = {
    for key, route in azurerm_cdn_frontdoor_route.main :
    key => route.id
  }
}

output "rule_set_ids" {
  description = "Map of rule set keys to their resource IDs"
  value = {
    for key, ruleset in azurerm_cdn_frontdoor_rule_set.main :
    key => ruleset.id
  }
}

output "waf_policy_id" {
  description = "WAF policy resource ID"
  value       = var.enable_waf ? azurerm_cdn_frontdoor_firewall_policy.main[0].id : null
}

output "waf_policy_name" {
  description = "WAF policy name"
  value       = var.enable_waf ? azurerm_cdn_frontdoor_firewall_policy.main[0].name : null
}

output "security_policy_id" {
  description = "Security policy resource ID"
  value       = var.enable_waf ? azurerm_cdn_frontdoor_security_policy.main[0].id : null
}

output "sku_name" {
  description = "Front Door SKU name"
  value       = azurerm_cdn_frontdoor_profile.main.sku_name
}

output "front_door_id" {
  description = "Front Door ID for use in DNS records"
  value       = azurerm_cdn_frontdoor_profile.main.resource_guid
}
