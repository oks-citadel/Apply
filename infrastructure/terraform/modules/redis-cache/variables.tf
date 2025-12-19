# Redis Cache Module Variables

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

variable "cache_sku" {
  description = "Redis Cache SKU (Basic_C0, Standard_C1, Premium_P1, etc.)"
  type        = string
  default     = null

  validation {
    condition     = var.cache_sku == null || can(regex("^(Basic|Standard|Premium)_(C[0-6]|P[1-5])$", var.cache_sku))
    error_message = "Invalid cache SKU. Format: Basic_C0-C6, Standard_C0-C6, or Premium_P1-P5."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "subnet_id" {
  description = "Subnet ID for Redis Cache (Premium SKU only, for VNet injection)"
  type        = string
  default     = null
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for Redis Cache"
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = null
}

variable "private_static_ip_address" {
  description = "Static IP address for Redis in the subnet (Premium SKU only)"
  type        = string
  default     = null
}

variable "shard_count" {
  description = "Number of shards for Premium Redis Cache"
  type        = number
  default     = 1

  validation {
    condition     = var.shard_count >= 1 && var.shard_count <= 10
    error_message = "Shard count must be between 1 and 10."
  }
}

variable "zones" {
  description = "Availability zones for Redis Cache (Premium SKU only)"
  type        = list(string)
  default     = null
}

# Redis Configuration Variables

variable "maxmemory_reserved" {
  description = "Memory reserved for non-cache operations (MB)"
  type        = number
  default     = null
}

variable "maxmemory_delta" {
  description = "Memory delta for non-cache operations (MB)"
  type        = number
  default     = null
}

variable "maxmemory_policy" {
  description = "Eviction policy when max memory is reached"
  type        = string
  default     = "volatile-lru"

  validation {
    condition = contains([
      "volatile-lru", "allkeys-lru", "volatile-lfu", "allkeys-lfu",
      "volatile-random", "allkeys-random", "volatile-ttl", "noeviction"
    ], var.maxmemory_policy)
    error_message = "Invalid maxmemory_policy. Must be one of: volatile-lru, allkeys-lru, volatile-lfu, allkeys-lfu, volatile-random, allkeys-random, volatile-ttl, noeviction."
  }
}

variable "notify_keyspace_events" {
  description = "Keyspace notifications configuration"
  type        = string
  default     = ""
}

# Persistence Configuration (Premium only)

variable "enable_persistence" {
  description = "Enable RDB persistence (Premium SKU only)"
  type        = bool
  default     = false
}

variable "rdb_backup_frequency" {
  description = "RDB backup frequency in minutes (15, 30, 60, 360, 720, 1440)"
  type        = number
  default     = 60

  validation {
    condition     = contains([15, 30, 60, 360, 720, 1440], var.rdb_backup_frequency)
    error_message = "RDB backup frequency must be 15, 30, 60, 360, 720, or 1440 minutes."
  }
}

variable "rdb_backup_max_snapshot_count" {
  description = "Maximum number of RDB snapshots to retain"
  type        = number
  default     = 1
}

variable "rdb_storage_connection_string" {
  description = "Storage account connection string for RDB backups"
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_aof_backup" {
  description = "Enable AOF (Append Only File) persistence (Premium SKU only)"
  type        = bool
  default     = false
}

variable "aof_storage_connection_string_0" {
  description = "Primary storage account connection string for AOF backups"
  type        = string
  sensitive   = true
  default     = null
}

variable "aof_storage_connection_string_1" {
  description = "Secondary storage account connection string for AOF backups"
  type        = string
  sensitive   = true
  default     = null
}

# Patch Schedule Variables

variable "patch_day_of_week" {
  description = "Day of week for patch schedule"
  type        = string
  default     = "Saturday"

  validation {
    condition = contains([
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ], var.patch_day_of_week)
    error_message = "Invalid day of week."
  }
}

variable "patch_start_hour_utc" {
  description = "Start hour (UTC) for patch schedule (0-23)"
  type        = number
  default     = 2

  validation {
    condition     = var.patch_start_hour_utc >= 0 && var.patch_start_hour_utc <= 23
    error_message = "Start hour must be between 0 and 23."
  }
}

variable "patch_maintenance_window" {
  description = "Maintenance window duration in ISO 8601 format (e.g., PT5H)"
  type        = string
  default     = "PT5H"
}

# Firewall Configuration

variable "allowed_ip_ranges" {
  description = "Map of allowed IP ranges for firewall rules (Standard/Premium only)"
  type = map(object({
    start_ip = string
    end_ip   = string
  }))
  default = {}
}

# Monitoring Configuration

variable "enable_diagnostics" {
  description = "Enable diagnostic settings"
  type        = bool
  default     = false
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
  default     = null
}

variable "enable_managed_identity" {
  description = "Enable system-assigned managed identity"
  type        = bool
  default     = false
}
