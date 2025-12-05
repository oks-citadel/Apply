# Dashboards Module - Variables
# JobPilot AI Platform - Azure Portal Dashboard Configuration

# ============================================================================
# REQUIRED VARIABLES
# ============================================================================

variable "resource_group_name" {
  description = "Name of the resource group where the dashboard will be created"
  type        = string
}

variable "location" {
  description = "Azure region where the dashboard will be deployed"
  type        = string
}

variable "project_name" {
  description = "Name of the project (used for resource naming)"
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

# ============================================================================
# RESOURCE IDS FOR DASHBOARD TILES
# ============================================================================

variable "app_insights_id" {
  description = "Resource ID of the Application Insights instance"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Resource ID of the Log Analytics workspace"
  type        = string
  default     = null
}

variable "web_app_ids" {
  description = "Map of web app names to their resource IDs for dashboard tiles"
  type        = map(string)
  default     = {}
}

variable "sql_server_id" {
  description = "Resource ID of the SQL Server for database metrics tiles"
  type        = string
  default     = null
}

variable "redis_cache_id" {
  description = "Resource ID of the Redis Cache for cache metrics tiles"
  type        = string
  default     = null
}

variable "application_gateway_id" {
  description = "Resource ID of the Application Gateway for network metrics tiles"
  type        = string
  default     = null
}

variable "front_door_id" {
  description = "Resource ID of Azure Front Door for CDN metrics tiles"
  type        = string
  default     = null
}

variable "aks_cluster_id" {
  description = "Resource ID of the AKS cluster for container metrics tiles"
  type        = string
  default     = null
}

variable "storage_account_id" {
  description = "Resource ID of the Storage Account for storage metrics tiles"
  type        = string
  default     = null
}

variable "key_vault_id" {
  description = "Resource ID of the Key Vault for security metrics tiles"
  type        = string
  default     = null
}

# ============================================================================
# DASHBOARD CONFIGURATION
# ============================================================================

variable "dashboard_time_range" {
  description = "Default time range for dashboard metrics (in hours)"
  type        = number
  default     = 24
  validation {
    condition     = var.dashboard_time_range > 0 && var.dashboard_time_range <= 720
    error_message = "Dashboard time range must be between 1 hour and 30 days (720 hours)."
  }
}

variable "enable_database_tiles" {
  description = "Enable database-specific tiles on the dashboard"
  type        = bool
  default     = true
}

variable "enable_cache_tiles" {
  description = "Enable Redis cache tiles on the dashboard"
  type        = bool
  default     = true
}

variable "enable_networking_tiles" {
  description = "Enable networking (App Gateway, Front Door) tiles on the dashboard"
  type        = bool
  default     = false
}

variable "enable_container_tiles" {
  description = "Enable AKS container tiles on the dashboard"
  type        = bool
  default     = false
}

# ============================================================================
# TAGS
# ============================================================================

variable "tags" {
  description = "Common tags to apply to all dashboard resources"
  type        = map(string)
  default     = {}
}
