# ============================================================================
# PostgreSQL Flexible Server Module Variables
# ============================================================================
# This file defines all input variables for the PostgreSQL Flexible Server module.
# These variables allow customization of the PostgreSQL server configuration
# for different environments and use cases.
# ============================================================================

# ============================================================================
# Core Resource Variables
# ============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "unique_suffix" {
  description = "Unique suffix for globally unique resource names"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# PostgreSQL Server Configuration
# ============================================================================

variable "postgres_admin_username" {
  description = "PostgreSQL Server administrator username"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{2,63}$", var.postgres_admin_username))
    error_message = "PostgreSQL admin username must be 3-64 characters, start with a letter, and contain only alphanumeric characters and underscores."
  }
}

variable "postgres_admin_password" {
  description = "PostgreSQL Server administrator password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.postgres_admin_password) >= 12
    error_message = "PostgreSQL admin password must be at least 12 characters long."
  }
}

variable "postgres_version" {
  description = "PostgreSQL version (11, 12, 13, 14, 15, 16)"
  type        = string
  default     = "16"

  validation {
    condition     = contains(["11", "12", "13", "14", "15", "16"], var.postgres_version)
    error_message = "PostgreSQL version must be one of: 11, 12, 13, 14, 15, 16"
  }
}

variable "sku_name" {
  description = "SKU name for PostgreSQL Flexible Server (e.g., GP_Standard_D2s_v3, B_Standard_B1ms)"
  type        = string
  default     = "GP_Standard_D2s_v3"

  validation {
    condition     = can(regex("^(B_Standard_|GP_Standard_|MO_Standard_)", var.sku_name))
    error_message = "SKU name must start with B_Standard_ (Burstable), GP_Standard_ (General Purpose), or MO_Standard_ (Memory Optimized)"
  }
}

variable "storage_mb" {
  description = "Storage size in MB (32768 = 32GB minimum)"
  type        = number
  default     = 32768

  validation {
    condition     = var.storage_mb >= 32768 && var.storage_mb <= 16777216
    error_message = "Storage must be between 32GB (32768 MB) and 16TB (16777216 MB)"
  }
}

variable "zone" {
  description = "Availability zone for the server (1, 2, 3, or null for no preference)"
  type        = string
  default     = null

  validation {
    condition     = var.zone == null || contains(["1", "2", "3"], var.zone)
    error_message = "Zone must be 1, 2, 3, or null"
  }
}

# ============================================================================
# Backup Configuration
# ============================================================================

variable "backup_retention_days" {
  description = "Backup retention period in days (7-35)"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_days >= 7 && var.backup_retention_days <= 35
    error_message = "Backup retention days must be between 7 and 35"
  }
}

variable "geo_redundant_backup_enabled" {
  description = "Enable geo-redundant backups (increases cost)"
  type        = bool
  default     = false
}

# ============================================================================
# High Availability Configuration
# ============================================================================

variable "enable_high_availability" {
  description = "Enable high availability configuration"
  type        = bool
  default     = false
}

variable "high_availability_mode" {
  description = "High availability mode (ZoneRedundant or SameZone)"
  type        = string
  default     = "ZoneRedundant"

  validation {
    condition     = contains(["ZoneRedundant", "SameZone"], var.high_availability_mode)
    error_message = "High availability mode must be ZoneRedundant or SameZone"
  }
}

variable "standby_availability_zone" {
  description = "Availability zone for standby server (1, 2, or 3)"
  type        = string
  default     = "2"

  validation {
    condition     = contains(["1", "2", "3"], var.standby_availability_zone)
    error_message = "Standby availability zone must be 1, 2, or 3"
  }
}

# ============================================================================
# Networking and Security Configuration
# ============================================================================

variable "allowed_ip_addresses" {
  description = "List of allowed IP addresses for firewall rules (e.g., ['1.2.3.4', '5.6.7.8'])"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for ip in var.allowed_ip_addresses :
      can(regex("^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$", ip))
    ])
    error_message = "All IP addresses must be in valid IPv4 format (e.g., 1.2.3.4)"
  }
}

variable "allow_azure_services" {
  description = "Allow Azure services to access the PostgreSQL server"
  type        = bool
  default     = true
}

# ============================================================================
# Database Names Configuration
# ============================================================================

variable "database_names" {
  description = "Map of database names for each microservice"
  type = object({
    auth_service         = string
    user_service         = string
    job_service          = string
    resume_service       = string
    notification_service = string
    analytics_service    = string
    auto_apply_service   = string
    payment_service      = string
  })
  default = {
    auth_service         = "auth_service_db"
    user_service         = "user_service_db"
    job_service          = "job_service_db"
    resume_service       = "resume_service_db"
    notification_service = "notification_service_db"
    analytics_service    = "analytics_service_db"
    auto_apply_service   = "auto_apply_service_db"
    payment_service      = "payment_service_db"
  }
}

# ============================================================================
# PostgreSQL Configuration Parameters
# ============================================================================

variable "max_connections" {
  description = "Maximum number of concurrent connections"
  type        = string
  default     = "200"
}

variable "timezone" {
  description = "Server timezone"
  type        = string
  default     = "UTC"
}

# ============================================================================
# Maintenance Window Configuration
# ============================================================================

variable "maintenance_window" {
  description = "Maintenance window configuration"
  type = object({
    day_of_week  = number
    start_hour   = number
    start_minute = number
  })
  default = null

  validation {
    condition = var.maintenance_window == null || (
      var.maintenance_window.day_of_week >= 0 &&
      var.maintenance_window.day_of_week <= 6 &&
      var.maintenance_window.start_hour >= 0 &&
      var.maintenance_window.start_hour <= 23 &&
      var.maintenance_window.start_minute >= 0 &&
      var.maintenance_window.start_minute <= 59
    )
    error_message = "Maintenance window must have valid day_of_week (0-6), start_hour (0-23), and start_minute (0-59)"
  }
}

# ============================================================================
# Monitoring and Diagnostics
# ============================================================================

variable "enable_diagnostics" {
  description = "Enable diagnostic settings"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID for diagnostics"
  type        = string
  default     = null
}

variable "diagnostic_retention_days" {
  description = "Number of days to retain diagnostic logs"
  type        = number
  default     = 30

  validation {
    condition     = var.diagnostic_retention_days >= 0 && var.diagnostic_retention_days <= 365
    error_message = "Diagnostic retention days must be between 0 and 365"
  }
}
