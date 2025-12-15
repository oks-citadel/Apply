# ============================================================================
# Enhanced Variables for PostgreSQL Flexible Server
# ============================================================================
# This file contains additional variable definitions for enhanced security
# and access control configurations.
# ============================================================================

# ============================================================================
# IP Range Configuration
# ============================================================================

variable "allowed_ip_ranges" {
  description = <<-EOT
    Map of allowed IP ranges for firewall rules.

    Example:
    allowed_ip_ranges = {
      aks_cluster = {
        start_ip = "52.x.x.x"
        end_ip   = "52.x.x.x"
      }
      office_network = {
        start_ip = "203.0.113.0"
        end_ip   = "203.0.113.255"
      }
    }

    Common use cases:
    - AKS cluster egress IP ranges
    - Office/corporate network ranges
    - VPN gateway IP ranges
    - Data center IP ranges
  EOT

  type = map(object({
    start_ip = string
    end_ip   = string
  }))

  default = {}

  validation {
    condition = alltrue([
      for range_name, range_config in var.allowed_ip_ranges :
      can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", range_config.start_ip)) &&
      can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", range_config.end_ip))
    ])
    error_message = "All IP addresses in ranges must be in valid IPv4 format (e.g., 1.2.3.4)"
  }
}

# ============================================================================
# Security Configuration
# ============================================================================

variable "enable_threat_detection" {
  description = "Enable threat detection for PostgreSQL (requires Security Center)"
  type        = bool
  default     = false
}

variable "enable_query_store" {
  description = "Enable Query Store for query performance insights"
  type        = bool
  default     = true
}

variable "query_store_retention_days" {
  description = "Number of days to retain Query Store data"
  type        = number
  default     = 7

  validation {
    condition     = var.query_store_retention_days >= 1 && var.query_store_retention_days <= 30
    error_message = "Query Store retention days must be between 1 and 30"
  }
}

# ============================================================================
# Performance Configuration
# ============================================================================

variable "statement_timeout" {
  description = "Maximum allowed duration of any statement in milliseconds (0 = disabled)"
  type        = string
  default     = "0"
}

variable "log_min_duration_statement" {
  description = "Log queries that take longer than this value in milliseconds (-1 = disabled)"
  type        = string
  default     = "1000"
}
