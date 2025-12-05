terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Public IP for Application Gateway
resource "azurerm_public_ip" "main" {
  name                = "${var.project_name}-appgw-pip-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = var.availability_zones

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "ManagedBy"   = "Terraform"
      "Component"   = "ApplicationGateway"
    }
  )
}

# User-assigned managed identity for Application Gateway
resource "azurerm_user_assigned_identity" "appgw" {
  name                = "${var.project_name}-appgw-identity-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
    }
  )
}

# Local variables for configuration
locals {
  gateway_ip_configuration_name = "${var.project_name}-appgw-ip-config"
  frontend_ip_configuration_name = "${var.project_name}-appgw-feip"
  frontend_port_name_http        = "${var.project_name}-appgw-feport-http"
  frontend_port_name_https       = "${var.project_name}-appgw-feport-https"

  # Backend pools
  backend_address_pools = {
    for key, value in var.backend_fqdns : key => {
      name  = "${var.project_name}-appgw-beap-${key}"
      fqdns = value
    }
  }

  # Backend HTTP settings
  backend_http_settings = {
    for key, config in var.backend_http_settings : key => merge({
      name                  = "${var.project_name}-appgw-be-htst-${key}"
      cookie_based_affinity = "Disabled"
      port                  = 443
      protocol              = "Https"
      request_timeout       = 60
      probe_name            = "${var.project_name}-appgw-probe-${key}"
      pick_host_name_from_backend_address = true
    }, config)
  }

  # HTTP listeners
  http_listeners = {
    for key, config in var.http_listeners : key => merge({
      name                           = "${var.project_name}-appgw-httplstn-${key}"
      frontend_ip_configuration_name = local.frontend_ip_configuration_name
      frontend_port_name             = config.protocol == "Https" ? local.frontend_port_name_https : local.frontend_port_name_http
      protocol                       = "Https"
      ssl_certificate_name           = config.protocol == "Https" ? "${var.project_name}-ssl-cert" : null
      require_sni                    = config.protocol == "Https" ? true : false
    }, config)
  }

  # Probes
  health_probes = {
    for key, config in var.health_probes : key => merge({
      name                                      = "${var.project_name}-appgw-probe-${key}"
      protocol                                  = "Https"
      path                                      = "/health"
      interval                                  = 30
      timeout                                   = 30
      unhealthy_threshold                       = 3
      pick_host_name_from_backend_http_settings = true
      match = {
        status_code = ["200-399"]
      }
    }, config)
  }
}

# Application Gateway
resource "azurerm_application_gateway" "main" {
  name                = "${var.project_name}-appgw-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  zones               = var.availability_zones

  # SKU Configuration - WAF_v2 for production
  sku {
    name = var.sku_name
    tier = var.sku_tier
  }

  # Autoscaling configuration
  autoscale_configuration {
    min_capacity = var.autoscale_min_capacity
    max_capacity = var.autoscale_max_capacity
  }

  # Managed identity
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.appgw.id]
  }

  # Gateway IP configuration
  gateway_ip_configuration {
    name      = local.gateway_ip_configuration_name
    subnet_id = var.subnet_id
  }

  # Frontend IP configuration
  frontend_ip_configuration {
    name                 = local.frontend_ip_configuration_name
    public_ip_address_id = azurerm_public_ip.main.id
  }

  # Frontend ports
  frontend_port {
    name = local.frontend_port_name_http
    port = 80
  }

  frontend_port {
    name = local.frontend_port_name_https
    port = 443
  }

  # SSL certificate (if provided)
  dynamic "ssl_certificate" {
    for_each = var.ssl_certificate_data != null ? [1] : []
    content {
      name     = "${var.project_name}-ssl-cert"
      data     = var.ssl_certificate_data
      password = var.ssl_certificate_password
    }
  }

  # SSL certificate from Key Vault
  dynamic "ssl_certificate" {
    for_each = var.ssl_certificate_key_vault_secret_id != null ? [1] : []
    content {
      name                = "${var.project_name}-ssl-cert"
      key_vault_secret_id = var.ssl_certificate_key_vault_secret_id
    }
  }

  # Backend address pools
  dynamic "backend_address_pool" {
    for_each = local.backend_address_pools
    content {
      name  = backend_address_pool.value.name
      fqdns = backend_address_pool.value.fqdns
    }
  }

  # Backend HTTP settings
  dynamic "backend_http_settings" {
    for_each = local.backend_http_settings
    content {
      name                                = backend_http_settings.value.name
      cookie_based_affinity               = backend_http_settings.value.cookie_based_affinity
      port                                = backend_http_settings.value.port
      protocol                            = backend_http_settings.value.protocol
      request_timeout                     = backend_http_settings.value.request_timeout
      probe_name                          = backend_http_settings.value.probe_name
      pick_host_name_from_backend_address = backend_http_settings.value.pick_host_name_from_backend_address

      dynamic "connection_draining" {
        for_each = lookup(backend_http_settings.value, "connection_draining_timeout", null) != null ? [1] : []
        content {
          enabled           = true
          drain_timeout_sec = backend_http_settings.value.connection_draining_timeout
        }
      }
    }
  }

  # Health probes
  dynamic "probe" {
    for_each = local.health_probes
    content {
      name                                      = probe.value.name
      protocol                                  = probe.value.protocol
      path                                      = probe.value.path
      interval                                  = probe.value.interval
      timeout                                   = probe.value.timeout
      unhealthy_threshold                       = probe.value.unhealthy_threshold
      pick_host_name_from_backend_http_settings = probe.value.pick_host_name_from_backend_http_settings

      match {
        status_code = probe.value.match.status_code
      }
    }
  }

  # HTTP listeners
  dynamic "http_listener" {
    for_each = local.http_listeners
    content {
      name                           = http_listener.value.name
      frontend_ip_configuration_name = http_listener.value.frontend_ip_configuration_name
      frontend_port_name             = http_listener.value.frontend_port_name
      protocol                       = http_listener.value.protocol
      ssl_certificate_name           = http_listener.value.ssl_certificate_name
      require_sni                    = http_listener.value.require_sni
      host_name                      = lookup(http_listener.value, "host_name", null)
    }
  }

  # Request routing rules
  dynamic "request_routing_rule" {
    for_each = var.routing_rules
    content {
      name                       = "${var.project_name}-appgw-rqrt-${request_routing_rule.key}"
      rule_type                  = request_routing_rule.value.rule_type
      http_listener_name         = "${var.project_name}-appgw-httplstn-${request_routing_rule.value.http_listener_key}"
      backend_address_pool_name  = request_routing_rule.value.rule_type == "Basic" ? "${var.project_name}-appgw-beap-${request_routing_rule.value.backend_address_pool_key}" : null
      backend_http_settings_name = request_routing_rule.value.rule_type == "Basic" ? "${var.project_name}-appgw-be-htst-${request_routing_rule.value.backend_http_settings_key}" : null
      url_path_map_name          = request_routing_rule.value.rule_type == "PathBasedRouting" ? "${var.project_name}-appgw-urlpath-${request_routing_rule.value.url_path_map_key}" : null
      priority                   = request_routing_rule.value.priority
    }
  }

  # URL path maps for path-based routing
  dynamic "url_path_map" {
    for_each = var.url_path_maps
    content {
      name                               = "${var.project_name}-appgw-urlpath-${url_path_map.key}"
      default_backend_address_pool_name  = "${var.project_name}-appgw-beap-${url_path_map.value.default_backend_address_pool_key}"
      default_backend_http_settings_name = "${var.project_name}-appgw-be-htst-${url_path_map.value.default_backend_http_settings_key}"

      dynamic "path_rule" {
        for_each = url_path_map.value.path_rules
        content {
          name                       = path_rule.value.name
          paths                      = path_rule.value.paths
          backend_address_pool_name  = "${var.project_name}-appgw-beap-${path_rule.value.backend_address_pool_key}"
          backend_http_settings_name = "${var.project_name}-appgw-be-htst-${path_rule.value.backend_http_settings_key}"
        }
      }
    }
  }

  # WAF configuration
  dynamic "waf_configuration" {
    for_each = var.enable_waf ? [1] : []
    content {
      enabled                  = true
      firewall_mode            = var.waf_mode
      rule_set_type            = "OWASP"
      rule_set_version         = var.waf_rule_set_version
      file_upload_limit_mb     = var.waf_file_upload_limit_mb
      request_body_check       = true
      max_request_body_size_kb = var.waf_max_request_body_size_kb

      dynamic "disabled_rule_group" {
        for_each = var.waf_disabled_rule_groups
        content {
          rule_group_name = disabled_rule_group.value.rule_group_name
          rules           = disabled_rule_group.value.rules
        }
      }
    }
  }

  # Redirect configurations (HTTP to HTTPS)
  dynamic "redirect_configuration" {
    for_each = var.redirect_configurations
    content {
      name                 = "${var.project_name}-appgw-redirect-${redirect_configuration.key}"
      redirect_type        = redirect_configuration.value.redirect_type
      target_listener_name = lookup(redirect_configuration.value, "target_listener_key", null) != null ? "${var.project_name}-appgw-httplstn-${redirect_configuration.value.target_listener_key}" : null
      target_url           = lookup(redirect_configuration.value, "target_url", null)
      include_path         = redirect_configuration.value.include_path
      include_query_string = redirect_configuration.value.include_query_string
    }
  }

  # SSL policy
  ssl_policy {
    policy_type = var.ssl_policy_type
    policy_name = var.ssl_policy_name
  }

  # Enable HTTP2
  enable_http2 = var.enable_http2

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "ManagedBy"   = "Terraform"
    }
  )

  lifecycle {
    ignore_changes = [
      tags["LastModified"]
    ]
  }
}

# Diagnostic settings for Application Gateway
resource "azurerm_monitor_diagnostic_setting" "appgw" {
  count                      = var.enable_diagnostics ? 1 : 0
  name                       = "${var.project_name}-appgw-diag-${var.environment}"
  target_resource_id         = azurerm_application_gateway.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  dynamic "enabled_log" {
    for_each = var.diagnostic_log_categories
    content {
      category = enabled_log.value
    }
  }

  dynamic "metric" {
    for_each = var.diagnostic_metric_categories
    content {
      category = metric.value
      enabled  = true
    }
  }
}
