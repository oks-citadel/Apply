output "gateway_id" {
  description = "Application Gateway resource ID"
  value       = azurerm_application_gateway.main.id
}

output "gateway_name" {
  description = "Application Gateway name"
  value       = azurerm_application_gateway.main.name
}

output "public_ip_address" {
  description = "Public IP address of the Application Gateway"
  value       = azurerm_public_ip.main.ip_address
}

output "public_ip_id" {
  description = "Public IP resource ID"
  value       = azurerm_public_ip.main.id
}

output "fqdn" {
  description = "FQDN of the Application Gateway public IP"
  value       = azurerm_public_ip.main.fqdn
}

output "frontend_ip_configuration" {
  description = "Frontend IP configuration details"
  value = {
    name                 = azurerm_application_gateway.main.frontend_ip_configuration[0].name
    private_ip_address   = azurerm_application_gateway.main.frontend_ip_configuration[0].private_ip_address
    public_ip_address_id = azurerm_application_gateway.main.frontend_ip_configuration[0].public_ip_address_id
  }
}

output "backend_address_pools" {
  description = "Backend address pool details"
  value = [
    for pool in azurerm_application_gateway.main.backend_address_pool : {
      name  = pool.name
      id    = pool.id
      fqdns = pool.fqdns
    }
  ]
}

output "backend_http_settings" {
  description = "Backend HTTP settings details"
  value = [
    for settings in azurerm_application_gateway.main.backend_http_settings : {
      name     = settings.name
      id       = settings.id
      port     = settings.port
      protocol = settings.protocol
    }
  ]
}

output "http_listeners" {
  description = "HTTP listener details"
  value = [
    for listener in azurerm_application_gateway.main.http_listener : {
      name     = listener.name
      id       = listener.id
      protocol = listener.protocol
    }
  ]
}

output "request_routing_rules" {
  description = "Request routing rule details"
  value = [
    for rule in azurerm_application_gateway.main.request_routing_rule : {
      name      = rule.name
      id        = rule.id
      rule_type = rule.rule_type
      priority  = rule.priority
    }
  ]
}

output "probes" {
  description = "Health probe details"
  value = [
    for probe in azurerm_application_gateway.main.probe : {
      name     = probe.name
      id       = probe.id
      protocol = probe.protocol
      path     = probe.path
    }
  ]
}

output "identity_principal_id" {
  description = "Principal ID of the managed identity"
  value       = azurerm_user_assigned_identity.appgw.principal_id
}

output "identity_client_id" {
  description = "Client ID of the managed identity"
  value       = azurerm_user_assigned_identity.appgw.client_id
}

output "identity_id" {
  description = "Resource ID of the managed identity"
  value       = azurerm_user_assigned_identity.appgw.id
}

output "waf_enabled" {
  description = "Whether WAF is enabled"
  value       = var.enable_waf
}

output "waf_mode" {
  description = "WAF operational mode"
  value       = var.enable_waf ? var.waf_mode : null
}
