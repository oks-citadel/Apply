# Public IP for Application Gateway
resource "azurerm_public_ip" "app_gateway" {
  name                = "${var.resource_prefix}-appgw-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = "${var.resource_prefix}-appgw"
  zones               = var.enable_zones ? ["1", "2", "3"] : null
  tags                = var.tags
}

# Application Gateway
resource "azurerm_application_gateway" "main" {
  name                = "${var.resource_prefix}-appgw"
  location            = var.location
  resource_group_name = var.resource_group_name
  zones               = var.enable_zones ? ["1", "2", "3"] : null
  enable_http2        = true

  sku {
    name     = var.sku_name
    tier     = var.sku_tier
    capacity = var.enable_auto_scaling ? null : var.capacity
  }

  # Auto-scaling configuration
  dynamic "autoscale_configuration" {
    for_each = var.enable_auto_scaling ? [1] : []
    content {
      min_capacity = var.min_capacity
      max_capacity = var.max_capacity
    }
  }

  # Gateway IP configuration
  gateway_ip_configuration {
    name      = "${var.resource_prefix}-appgw-ip-config"
    subnet_id = var.subnet_id
  }

  # Frontend port for HTTP
  frontend_port {
    name = "${var.resource_prefix}-appgw-http-port"
    port = 80
  }

  # Frontend port for HTTPS
  frontend_port {
    name = "${var.resource_prefix}-appgw-https-port"
    port = 443
  }

  # Frontend IP configuration
  frontend_ip_configuration {
    name                 = "${var.resource_prefix}-appgw-frontend-ip"
    public_ip_address_id = azurerm_public_ip.app_gateway.id
  }

  # Backend address pool - AKS Ingress Controller
  backend_address_pool {
    name  = "${var.resource_prefix}-aks-backend-pool"
    fqdns = var.backend_fqdn != null ? [var.backend_fqdn] : null
  }

  # Backend HTTP settings
  backend_http_settings {
    name                  = "${var.resource_prefix}-http-settings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
    probe_name            = "${var.resource_prefix}-health-probe"

    connection_draining {
      enabled           = true
      drain_timeout_sec = 30
    }
  }

  # Backend HTTPS settings
  backend_http_settings {
    name                  = "${var.resource_prefix}-https-settings"
    cookie_based_affinity = "Disabled"
    port                  = 443
    protocol              = "Https"
    request_timeout       = 60
    probe_name            = "${var.resource_prefix}-https-health-probe"
    pick_host_name_from_backend_address = true

    connection_draining {
      enabled           = true
      drain_timeout_sec = 30
    }
  }

  # Health probe for HTTP
  probe {
    name                                      = "${var.resource_prefix}-health-probe"
    protocol                                  = "Http"
    path                                      = "/health"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true
  }

  # Health probe for HTTPS
  probe {
    name                                      = "${var.resource_prefix}-https-health-probe"
    protocol                                  = "Https"
    path                                      = "/health"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true
  }

  # HTTP listener
  http_listener {
    name                           = "${var.resource_prefix}-http-listener"
    frontend_ip_configuration_name = "${var.resource_prefix}-appgw-frontend-ip"
    frontend_port_name             = "${var.resource_prefix}-appgw-http-port"
    protocol                       = "Http"
  }

  # HTTPS listener (placeholder - requires SSL certificate)
  http_listener {
    name                           = "${var.resource_prefix}-https-listener"
    frontend_ip_configuration_name = "${var.resource_prefix}-appgw-frontend-ip"
    frontend_port_name             = "${var.resource_prefix}-appgw-https-port"
    protocol                       = "Http" # Will be updated to HTTPS when certificate is added
  }

  # Request routing rule - HTTP to HTTPS redirect
  request_routing_rule {
    name               = "${var.resource_prefix}-http-redirect-rule"
    priority           = 100
    rule_type          = "Basic"
    http_listener_name = "${var.resource_prefix}-http-listener"
    redirect_configuration_name = "${var.resource_prefix}-http-to-https-redirect"
  }

  # Request routing rule - HTTPS to backend
  request_routing_rule {
    name                       = "${var.resource_prefix}-https-routing-rule"
    priority                   = 200
    rule_type                  = "Basic"
    http_listener_name         = "${var.resource_prefix}-https-listener"
    backend_address_pool_name  = "${var.resource_prefix}-aks-backend-pool"
    backend_http_settings_name = "${var.resource_prefix}-http-settings"
  }

  # Redirect configuration - HTTP to HTTPS
  redirect_configuration {
    name                 = "${var.resource_prefix}-http-to-https-redirect"
    redirect_type        = "Permanent"
    target_listener_name = "${var.resource_prefix}-https-listener"
    include_path         = true
    include_query_string = true
  }

  # WAF configuration
  dynamic "waf_configuration" {
    for_each = var.sku_tier == "WAF_v2" ? [1] : []
    content {
      enabled                  = true
      firewall_mode            = var.waf_mode
      rule_set_type            = "OWASP"
      rule_set_version         = "3.2"
      file_upload_limit_mb     = 100
      request_body_check       = true
      max_request_body_size_kb = 128

      disabled_rule_group {
        rule_group_name = "REQUEST-942-APPLICATION-ATTACK-SQLI"
        rules           = []
      }
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      tags["CreatedDate"]
    ]
  }
}

# Diagnostic settings for Application Gateway
resource "azurerm_monitor_diagnostic_setting" "app_gateway" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "${var.resource_prefix}-appgw-diag"
  target_resource_id         = azurerm_application_gateway.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ApplicationGatewayAccessLog"
  }

  enabled_log {
    category = "ApplicationGatewayPerformanceLog"
  }

  enabled_log {
    category = "ApplicationGatewayFirewallLog"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
