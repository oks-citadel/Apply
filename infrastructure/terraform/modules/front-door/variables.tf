variable "resource_group_name" {
  description = "Name of the resource group where Front Door will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region (note: Front Door is a global service)"
  type        = string
  default     = "Global"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Front Door Profile Configuration
variable "sku_name" {
  description = "SKU name for Front Door (Standard_AzureFrontDoor, Premium_AzureFrontDoor)"
  type        = string
  default     = "Premium_AzureFrontDoor"
  validation {
    condition     = contains(["Standard_AzureFrontDoor", "Premium_AzureFrontDoor"], var.sku_name)
    error_message = "SKU name must be Standard_AzureFrontDoor or Premium_AzureFrontDoor."
  }
}

variable "response_timeout_seconds" {
  description = "Response timeout in seconds (16-240)"
  type        = number
  default     = 120
  validation {
    condition     = var.response_timeout_seconds >= 16 && var.response_timeout_seconds <= 240
    error_message = "Response timeout must be between 16 and 240 seconds."
  }
}

# Endpoints Configuration
variable "endpoints" {
  description = "Map of endpoint configurations"
  type = map(object({
    enabled = optional(bool, true)
  }))
  default = {
    main = {
      enabled = true
    }
  }
}

# Origin Groups Configuration
variable "origin_groups" {
  description = "Map of origin group configurations"
  type = map(object({
    session_affinity_enabled     = optional(bool, false)
    restore_traffic_time_minutes = optional(number, 10)
    health_probe = object({
      interval_in_seconds = optional(number, 30)
      path                = optional(string, "/health")
      protocol            = optional(string, "Https")
      request_type        = optional(string, "GET")
    })
    load_balancing = object({
      additional_latency_in_milliseconds = optional(number, 50)
      sample_size                        = optional(number, 4)
      successful_samples_required        = optional(number, 3)
    })
  }))
  default = {
    default = {
      health_probe = {
        path = "/health"
      }
      load_balancing = {}
    }
  }
}

# Origins Configuration
variable "origins" {
  description = "Map of origin configurations"
  type = map(object({
    origin_group_key               = string
    host_name                      = string
    enabled                        = optional(bool, true)
    certificate_name_check_enabled = optional(bool, true)
    http_port                      = optional(number, 80)
    https_port                     = optional(number, 443)
    origin_host_header             = optional(string)
    priority                       = optional(number, 1)
    weight                         = optional(number, 1000)
    private_link = optional(object({
      request_message        = optional(string)
      target_type            = string
      location               = string
      private_link_target_id = string
    }))
  }))
  default = {}
}

# Custom Domains Configuration
variable "custom_domains" {
  description = "Map of custom domain configurations"
  type = map(object({
    host_name   = string
    dns_zone_id = optional(string)
    tls = object({
      certificate_type        = optional(string, "ManagedCertificate")
      minimum_tls_version     = optional(string, "TLS12")
      cdn_frontdoor_secret_id = optional(string)
    })
  }))
  default = {}
}

# Routes Configuration
variable "routes" {
  description = "Map of route configurations"
  type = map(object({
    endpoint_key           = string
    origin_group_key       = string
    origin_keys            = list(string)
    enabled                = optional(bool, true)
    forwarding_protocol    = optional(string, "HttpsOnly")
    https_redirect_enabled = optional(bool, true)
    patterns_to_match      = optional(list(string), ["/*"])
    supported_protocols    = optional(list(string), ["Http", "Https"])
    custom_domain_keys     = optional(list(string))
    link_to_default_domain = optional(bool, true)
    rule_set_keys          = optional(list(string))
    cache = optional(object({
      query_string_caching_behavior = optional(string, "IgnoreQueryString")
      query_strings                 = optional(list(string))
      compression_enabled           = optional(bool, true)
      content_types_to_compress     = optional(list(string))
    }))
  }))
  default = {}
}

# Rule Sets and Rules
variable "rule_sets" {
  description = "Map of rule set names"
  type        = map(object({}))
  default     = {}
}

variable "rules" {
  description = "Map of rule configurations"
  type = map(object({
    rule_set_key      = string
    order             = number
    behavior_on_match = optional(string, "Continue")
    conditions        = optional(list(any), [])
    actions = object({
      url_rewrite = optional(object({
        source_pattern          = string
        destination             = string
        preserve_unmatched_path = optional(bool, true)
      }))
      route_configuration_override = optional(object({
        cache_duration                = optional(string)
        origin_group_key              = optional(string)
        forwarding_protocol           = optional(string)
        query_string_caching_behavior = optional(string)
        compression_enabled           = optional(bool)
        cache_behavior                = optional(string)
      }))
      response_headers = optional(list(object({
        header_action = string
        header_name   = string
        value         = optional(string)
      })), [])
      request_headers = optional(list(object({
        header_action = string
        header_name   = string
        value         = optional(string)
      })), [])
    })
  }))
  default = {}
}

# Caching Configuration
variable "enable_caching" {
  description = "Enable caching for routes"
  type        = bool
  default     = true
}

# Backend FQDNs (for backward compatibility and simplified configuration)
variable "backend_fqdns" {
  description = "Map of service names to backend FQDNs"
  type        = map(list(string))
  default     = {}
}

# WAF Configuration
variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "waf_mode" {
  description = "WAF mode (Detection, Prevention)"
  type        = string
  default     = "Prevention"
  validation {
    condition     = contains(["Detection", "Prevention"], var.waf_mode)
    error_message = "WAF mode must be Detection or Prevention."
  }
}

variable "waf_endpoint_key" {
  description = "Endpoint key to apply WAF policy"
  type        = string
  default     = "main"
}

variable "waf_patterns_to_match" {
  description = "Patterns to match for WAF policy"
  type        = list(string)
  default     = ["/*"]
}

variable "waf_redirect_url" {
  description = "Redirect URL for WAF blocks"
  type        = string
  default     = null
}

variable "waf_custom_block_response_status_code" {
  description = "Custom block response status code"
  type        = number
  default     = 403
}

variable "waf_custom_block_response_body" {
  description = "Custom block response body (base64 encoded)"
  type        = string
  default     = null
}

# WAF Custom Rules
variable "waf_custom_rules" {
  description = "List of custom WAF rules"
  type = list(object({
    name                           = string
    enabled                        = optional(bool, true)
    priority                       = number
    rate_limit_duration_in_minutes = optional(number, 1)
    rate_limit_threshold           = optional(number, 100)
    type                           = string
    action                         = string
    match_conditions = list(object({
      match_variable     = string
      operator           = string
      negation_condition = optional(bool, false)
      match_values       = list(string)
      transforms         = optional(list(string), [])
    }))
  }))
  default = []
}

# WAF Managed Rules
variable "waf_managed_rules" {
  description = "List of managed WAF rule sets"
  type = list(object({
    type    = string
    version = string
    action  = string
    exclusions = optional(list(object({
      match_variable = string
      operator       = string
      selector       = string
    })), [])
    overrides = optional(list(object({
      rule_group_name = string
      rules = optional(list(object({
        rule_id = string
        enabled = bool
        action  = string
      })), [])
    })), [])
  }))
  default = [
    {
      type    = "Microsoft_DefaultRuleSet"
      version = "2.1"
      action  = "Block"
    },
    {
      type    = "Microsoft_BotManagerRuleSet"
      version = "1.0"
      action  = "Block"
    }
  ]
}

# Monitoring Configuration
variable "enable_diagnostics" {
  description = "Enable diagnostic settings"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
  default     = null
}

variable "diagnostic_log_categories" {
  description = "List of log categories to enable"
  type        = list(string)
  default = [
    "FrontDoorAccessLog",
    "FrontDoorHealthProbeLog",
    "FrontDoorWebApplicationFirewallLog"
  ]
}

variable "diagnostic_metric_categories" {
  description = "List of metric categories to enable"
  type        = list(string)
  default = [
    "AllMetrics"
  ]
}
