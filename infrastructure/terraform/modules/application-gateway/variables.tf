variable "resource_group_name" {
  description = "Name of the resource group where Application Gateway will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region for Application Gateway"
  type        = string
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

variable "subnet_id" {
  description = "Subnet ID where Application Gateway will be deployed"
  type        = string
}

variable "availability_zones" {
  description = "Availability zones for Application Gateway"
  type        = list(string)
  default     = ["1", "2", "3"]
}

# SKU Configuration
variable "sku_name" {
  description = "SKU name for Application Gateway"
  type        = string
  default     = "WAF_v2"
  validation {
    condition     = contains(["Standard_v2", "WAF_v2"], var.sku_name)
    error_message = "SKU name must be Standard_v2 or WAF_v2."
  }
}

variable "sku_tier" {
  description = "SKU tier for Application Gateway"
  type        = string
  default     = "WAF_v2"
  validation {
    condition     = contains(["Standard_v2", "WAF_v2"], var.sku_tier)
    error_message = "SKU tier must be Standard_v2 or WAF_v2."
  }
}

# Autoscaling Configuration
variable "autoscale_min_capacity" {
  description = "Minimum autoscale capacity"
  type        = number
  default     = 2
}

variable "autoscale_max_capacity" {
  description = "Maximum autoscale capacity"
  type        = number
  default     = 10
}

# Backend Configuration
variable "backend_fqdns" {
  description = "Map of backend pool names to their FQDNs"
  type        = map(list(string))
  default = {
    default = []
  }
}

variable "backend_http_settings" {
  description = "Map of backend HTTP settings configurations"
  type = map(object({
    cookie_based_affinity               = optional(string, "Disabled")
    port                                = optional(number, 443)
    protocol                            = optional(string, "Https")
    request_timeout                     = optional(number, 60)
    pick_host_name_from_backend_address = optional(bool, true)
    connection_draining_timeout         = optional(number)
  }))
  default = {
    default = {}
  }
}

# HTTP Listeners Configuration
variable "http_listeners" {
  description = "Map of HTTP listener configurations"
  type = map(object({
    protocol  = optional(string, "Https")
    host_name = optional(string)
  }))
  default = {
    default = {
      protocol = "Https"
    }
  }
}

# Health Probes Configuration
variable "health_probes" {
  description = "Map of health probe configurations"
  type = map(object({
    protocol                                  = optional(string, "Https")
    path                                      = optional(string, "/health")
    interval                                  = optional(number, 30)
    timeout                                   = optional(number, 30)
    unhealthy_threshold                       = optional(number, 3)
    pick_host_name_from_backend_http_settings = optional(bool, true)
    match = optional(object({
      status_code = list(string)
    }), { status_code = ["200-399"] })
  }))
  default = {
    default = {
      path = "/health"
    }
  }
}

# Routing Rules Configuration
variable "routing_rules" {
  description = "Map of request routing rule configurations"
  type = map(object({
    rule_type                 = string
    http_listener_key         = string
    backend_address_pool_key  = optional(string)
    backend_http_settings_key = optional(string)
    url_path_map_key          = optional(string)
    priority                  = number
  }))
  default = {
    default = {
      rule_type                 = "Basic"
      http_listener_key         = "default"
      backend_address_pool_key  = "default"
      backend_http_settings_key = "default"
      priority                  = 100
    }
  }
}

# URL Path Maps Configuration
variable "url_path_maps" {
  description = "Map of URL path map configurations for path-based routing"
  type = map(object({
    default_backend_address_pool_key  = string
    default_backend_http_settings_key = string
    path_rules = list(object({
      name                      = string
      paths                     = list(string)
      backend_address_pool_key  = string
      backend_http_settings_key = string
    }))
  }))
  default = {}
}

# Redirect Configurations
variable "redirect_configurations" {
  description = "Map of redirect configurations"
  type = map(object({
    redirect_type        = string
    target_listener_key  = optional(string)
    target_url           = optional(string)
    include_path         = optional(bool, true)
    include_query_string = optional(bool, true)
  }))
  default = {}
}

# SSL Configuration
variable "ssl_certificate_data" {
  description = "Base64 encoded PFX certificate data"
  type        = string
  default     = null
  sensitive   = true
}

variable "ssl_certificate_password" {
  description = "Password for the PFX certificate"
  type        = string
  default     = null
  sensitive   = true
}

variable "ssl_certificate_key_vault_secret_id" {
  description = "Key Vault secret ID containing the SSL certificate"
  type        = string
  default     = null
}

variable "ssl_policy_type" {
  description = "SSL policy type (Predefined, Custom, CustomV2)"
  type        = string
  default     = "Predefined"
}

variable "ssl_policy_name" {
  description = "SSL policy name (AppGwSslPolicy20220101, etc.)"
  type        = string
  default     = "AppGwSslPolicy20220101"
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

variable "waf_rule_set_version" {
  description = "OWASP rule set version"
  type        = string
  default     = "3.2"
}

variable "waf_file_upload_limit_mb" {
  description = "File upload limit in MB for WAF"
  type        = number
  default     = 100
}

variable "waf_max_request_body_size_kb" {
  description = "Maximum request body size in KB for WAF"
  type        = number
  default     = 128
}

variable "waf_disabled_rule_groups" {
  description = "List of WAF rule groups to disable"
  type = list(object({
    rule_group_name = string
    rules           = list(string)
  }))
  default = []
}

# Additional Features
variable "enable_http2" {
  description = "Enable HTTP/2 support"
  type        = bool
  default     = true
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
    "ApplicationGatewayAccessLog",
    "ApplicationGatewayPerformanceLog",
    "ApplicationGatewayFirewallLog"
  ]
}

variable "diagnostic_metric_categories" {
  description = "List of metric categories to enable"
  type        = list(string)
  default = [
    "AllMetrics"
  ]
}
