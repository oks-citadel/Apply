terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Azure Front Door Profile (Premium SKU for advanced features)
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${var.project_name}-afd-${var.environment}"
  resource_group_name = var.resource_group_name
  sku_name            = var.sku_name

  response_timeout_seconds = var.response_timeout_seconds

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "ManagedBy"   = "Terraform"
      "Component"   = "FrontDoor"
    }
  )
}

# Front Door Endpoint
resource "azurerm_cdn_frontdoor_endpoint" "main" {
  for_each = var.endpoints

  name                     = "${var.project_name}-afd-endpoint-${each.key}-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  enabled                  = lookup(each.value, "enabled", true)

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Endpoint"    = each.key
    }
  )
}

# Origin Groups
resource "azurerm_cdn_frontdoor_origin_group" "main" {
  for_each = var.origin_groups

  name                     = "${var.project_name}-afd-og-${each.key}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  session_affinity_enabled = lookup(each.value, "session_affinity_enabled", false)

  restore_traffic_time_to_healed_or_new_endpoint_in_minutes = lookup(
    each.value,
    "restore_traffic_time_minutes",
    10
  )

  health_probe {
    interval_in_seconds = lookup(each.value.health_probe, "interval_in_seconds", 30)
    path                = lookup(each.value.health_probe, "path", "/health")
    protocol            = lookup(each.value.health_probe, "protocol", "Https")
    request_type        = lookup(each.value.health_probe, "request_type", "GET")
  }

  load_balancing {
    additional_latency_in_milliseconds = lookup(
      each.value.load_balancing,
      "additional_latency_in_milliseconds",
      50
    )
    sample_size                        = lookup(each.value.load_balancing, "sample_size", 4)
    successful_samples_required        = lookup(each.value.load_balancing, "successful_samples_required", 3)
  }
}

# Origins
resource "azurerm_cdn_frontdoor_origin" "main" {
  for_each = var.origins

  name                          = "${var.project_name}-afd-origin-${each.key}"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main[each.value.origin_group_key].id
  enabled                       = lookup(each.value, "enabled", true)

  certificate_name_check_enabled = lookup(each.value, "certificate_name_check_enabled", true)
  host_name                      = each.value.host_name
  http_port                      = lookup(each.value, "http_port", 80)
  https_port                     = lookup(each.value, "https_port", 443)
  origin_host_header             = lookup(each.value, "origin_host_header", each.value.host_name)
  priority                       = lookup(each.value, "priority", 1)
  weight                         = lookup(each.value, "weight", 1000)

  dynamic "private_link" {
    for_each = lookup(each.value, "private_link", null) != null ? [each.value.private_link] : []
    content {
      request_message        = lookup(private_link.value, "request_message", "Private link request from Front Door")
      target_type            = private_link.value.target_type
      location               = private_link.value.location
      private_link_target_id = private_link.value.private_link_target_id
    }
  }
}

# Custom Domains
resource "azurerm_cdn_frontdoor_custom_domain" "main" {
  for_each = var.custom_domains

  name                     = replace("${var.project_name}-afd-domain-${each.key}", ".", "-")
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
  dns_zone_id              = lookup(each.value, "dns_zone_id", null)
  host_name                = each.value.host_name

  tls {
    certificate_type    = lookup(each.value.tls, "certificate_type", "ManagedCertificate")
    minimum_tls_version = lookup(each.value.tls, "minimum_tls_version", "TLS12")
    cdn_frontdoor_secret_id = lookup(each.value.tls, "certificate_type", "ManagedCertificate") == "CustomerCertificate" ? lookup(each.value.tls, "cdn_frontdoor_secret_id", null) : null
  }
}

# Routes
resource "azurerm_cdn_frontdoor_route" "main" {
  for_each = var.routes

  name                          = "${var.project_name}-afd-route-${each.key}"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main[each.value.endpoint_key].id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.main[each.value.origin_group_key].id
  cdn_frontdoor_origin_ids = [
    for origin_key in each.value.origin_keys :
    azurerm_cdn_frontdoor_origin.main[origin_key].id
  ]

  enabled                = lookup(each.value, "enabled", true)
  forwarding_protocol    = lookup(each.value, "forwarding_protocol", "HttpsOnly")
  https_redirect_enabled = lookup(each.value, "https_redirect_enabled", true)
  patterns_to_match      = lookup(each.value, "patterns_to_match", ["/*"])
  supported_protocols    = lookup(each.value, "supported_protocols", ["Http", "Https"])

  cdn_frontdoor_custom_domain_ids = lookup(each.value, "custom_domain_keys", null) != null ? [
    for domain_key in each.value.custom_domain_keys :
    azurerm_cdn_frontdoor_custom_domain.main[domain_key].id
  ] : []

  link_to_default_domain = lookup(each.value, "link_to_default_domain", true)

  dynamic "cache" {
    for_each = var.enable_caching && lookup(each.value, "cache", null) != null ? [each.value.cache] : []
    content {
      query_string_caching_behavior = lookup(cache.value, "query_string_caching_behavior", "IgnoreQueryString")
      query_strings                 = lookup(cache.value, "query_strings", null)
      compression_enabled           = lookup(cache.value, "compression_enabled", true)
      content_types_to_compress     = lookup(cache.value, "content_types_to_compress", [
        "application/eot",
        "application/font",
        "application/font-sfnt",
        "application/javascript",
        "application/json",
        "application/opentype",
        "application/otf",
        "application/pkcs7-mime",
        "application/truetype",
        "application/ttf",
        "application/vnd.ms-fontobject",
        "application/xhtml+xml",
        "application/xml",
        "application/xml+rss",
        "application/x-font-opentype",
        "application/x-font-truetype",
        "application/x-font-ttf",
        "application/x-httpd-cgi",
        "application/x-javascript",
        "application/x-mpegurl",
        "application/x-opentype",
        "application/x-otf",
        "application/x-perl",
        "application/x-ttf",
        "font/eot",
        "font/ttf",
        "font/otf",
        "font/opentype",
        "image/svg+xml",
        "text/css",
        "text/csv",
        "text/html",
        "text/javascript",
        "text/js",
        "text/plain",
        "text/richtext",
        "text/tab-separated-values",
        "text/xml",
        "text/x-script",
        "text/x-component",
        "text/x-java-source"
      ])
    }
  }

  cdn_frontdoor_rule_set_ids = lookup(each.value, "rule_set_keys", null) != null ? [
    for rule_set_key in each.value.rule_set_keys :
    azurerm_cdn_frontdoor_rule_set.main[rule_set_key].id
  ] : []
}

# Rule Sets
resource "azurerm_cdn_frontdoor_rule_set" "main" {
  for_each = var.rule_sets

  name                     = replace("${var.project_name}-afd-ruleset-${each.key}", "_", "-")
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
}

# Rules
resource "azurerm_cdn_frontdoor_rule" "main" {
  for_each = var.rules

  name                      = replace("${var.project_name}-afd-rule-${each.key}", "_", "-")
  cdn_frontdoor_rule_set_id = azurerm_cdn_frontdoor_rule_set.main[each.value.rule_set_key].id
  order                     = each.value.order
  behavior_on_match         = lookup(each.value, "behavior_on_match", "Continue")

  dynamic "conditions" {
    for_each = lookup(each.value, "conditions", [])
    content {
      dynamic "request_uri_condition" {
        for_each = lookup(conditions.value, "request_uri", null) != null ? [conditions.value.request_uri] : []
        content {
          operator         = request_uri_condition.value.operator
          negate_condition = lookup(request_uri_condition.value, "negate_condition", false)
          match_values     = lookup(request_uri_condition.value, "match_values", [])
          transforms       = lookup(request_uri_condition.value, "transforms", [])
        }
      }

      dynamic "request_method_condition" {
        for_each = lookup(conditions.value, "request_method", null) != null ? [conditions.value.request_method] : []
        content {
          operator         = "Equal"
          negate_condition = lookup(request_method_condition.value, "negate_condition", false)
          match_values     = request_method_condition.value.match_values
        }
      }
    }
  }

  dynamic "actions" {
    for_each = [each.value.actions]
    content {
      dynamic "url_rewrite_action" {
        for_each = lookup(actions.value, "url_rewrite", null) != null ? [actions.value.url_rewrite] : []
        content {
          source_pattern          = url_rewrite_action.value.source_pattern
          destination             = url_rewrite_action.value.destination
          preserve_unmatched_path = lookup(url_rewrite_action.value, "preserve_unmatched_path", true)
        }
      }

      dynamic "route_configuration_override_action" {
        for_each = lookup(actions.value, "route_configuration_override", null) != null ? [actions.value.route_configuration_override] : []
        content {
          cache_duration                = lookup(route_configuration_override_action.value, "cache_duration", null)
          cdn_frontdoor_origin_group_id = lookup(route_configuration_override_action.value, "origin_group_key", null) != null ? azurerm_cdn_frontdoor_origin_group.main[route_configuration_override_action.value.origin_group_key].id : null
          forwarding_protocol           = lookup(route_configuration_override_action.value, "forwarding_protocol", null)
          query_string_caching_behavior = lookup(route_configuration_override_action.value, "query_string_caching_behavior", null)
          compression_enabled           = lookup(route_configuration_override_action.value, "compression_enabled", null)
          cache_behavior                = lookup(route_configuration_override_action.value, "cache_behavior", null)
        }
      }

      dynamic "response_header_action" {
        for_each = lookup(actions.value, "response_headers", [])
        content {
          header_action = response_header_action.value.header_action
          header_name   = response_header_action.value.header_name
          value         = lookup(response_header_action.value, "value", null)
        }
      }

      dynamic "request_header_action" {
        for_each = lookup(actions.value, "request_headers", [])
        content {
          header_action = request_header_action.value.header_action
          header_name   = request_header_action.value.header_name
          value         = lookup(request_header_action.value, "value", null)
        }
      }
    }
  }
}

# WAF Policy
resource "azurerm_cdn_frontdoor_firewall_policy" "main" {
  count = var.enable_waf ? 1 : 0

  name                              = replace("${var.project_name}afdwaf${var.environment}", "-", "")
  resource_group_name               = var.resource_group_name
  sku_name                          = azurerm_cdn_frontdoor_profile.main.sku_name
  enabled                           = true
  mode                              = var.waf_mode
  redirect_url                      = var.waf_redirect_url
  custom_block_response_status_code = var.waf_custom_block_response_status_code
  custom_block_response_body        = var.waf_custom_block_response_body

  # Custom rules
  dynamic "custom_rule" {
    for_each = var.waf_custom_rules
    content {
      name                           = custom_rule.value.name
      enabled                        = lookup(custom_rule.value, "enabled", true)
      priority                       = custom_rule.value.priority
      rate_limit_duration_in_minutes = lookup(custom_rule.value, "rate_limit_duration_in_minutes", 1)
      rate_limit_threshold           = lookup(custom_rule.value, "rate_limit_threshold", 100)
      type                           = custom_rule.value.type
      action                         = custom_rule.value.action

      dynamic "match_condition" {
        for_each = custom_rule.value.match_conditions
        content {
          match_variable     = match_condition.value.match_variable
          operator           = match_condition.value.operator
          negation_condition = lookup(match_condition.value, "negation_condition", false)
          match_values       = match_condition.value.match_values
          transforms         = lookup(match_condition.value, "transforms", [])
        }
      }
    }
  }

  # Managed rules
  dynamic "managed_rule" {
    for_each = var.waf_managed_rules
    content {
      type    = managed_rule.value.type
      version = managed_rule.value.version
      action  = managed_rule.value.action

      dynamic "exclusion" {
        for_each = lookup(managed_rule.value, "exclusions", [])
        content {
          match_variable = exclusion.value.match_variable
          operator       = exclusion.value.operator
          selector       = exclusion.value.selector
        }
      }

      dynamic "override" {
        for_each = lookup(managed_rule.value, "overrides", [])
        content {
          rule_group_name = override.value.rule_group_name

          dynamic "rule" {
            for_each = lookup(override.value, "rules", [])
            content {
              rule_id = rule.value.rule_id
              enabled = rule.value.enabled
              action  = rule.value.action
            }
          }
        }
      }
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
    }
  )
}

# Security Policy
resource "azurerm_cdn_frontdoor_security_policy" "main" {
  count = var.enable_waf ? 1 : 0

  name                     = "${var.project_name}-afd-secpolicy-${var.environment}"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.main[0].id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.main[var.waf_endpoint_key].id
        }
        patterns_to_match = var.waf_patterns_to_match
      }
    }
  }
}

# Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "main" {
  count = var.enable_diagnostics ? 1 : 0

  name                       = "${var.project_name}-afd-diag-${var.environment}"
  target_resource_id         = azurerm_cdn_frontdoor_profile.main.id
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
