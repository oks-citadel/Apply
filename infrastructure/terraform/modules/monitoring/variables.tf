# Monitoring Module - Variables
# JobPilot AI Platform - Azure Monitor Configuration

# ============================================================================
# REQUIRED VARIABLES
# ============================================================================

variable "resource_group_name" {
  description = "Name of the resource group where monitoring resources will be created"
  type        = string
}

variable "location" {
  description = "Azure region where monitoring resources will be deployed"
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
# RESOURCE IDS
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

variable "sql_server_id" {
  description = "Resource ID of the SQL Server to monitor"
  type        = string
  default     = null
}

variable "redis_cache_id" {
  description = "Resource ID of the Redis Cache to monitor"
  type        = string
  default     = null
}

variable "aks_cluster_id" {
  description = "Resource ID of the AKS cluster to monitor"
  type        = string
  default     = null
}

variable "web_app_ids" {
  description = "Map of web app names to their resource IDs"
  type        = map(string)
  default     = {}
}

variable "web_app_urls" {
  description = "Map of web app names to their URLs for availability testing"
  type        = map(string)
  default     = {}
}

# ============================================================================
# ALERT CONFIGURATION
# ============================================================================

variable "alert_email_addresses" {
  description = "List of email addresses to receive alert notifications"
  type        = list(string)
}

variable "webhook_url" {
  description = "Optional webhook URL for alert notifications (e.g., Slack, Teams, PagerDuty)"
  type        = string
  default     = null
  sensitive   = true
}

# ============================================================================
# METRIC THRESHOLDS - App Service
# ============================================================================

variable "cpu_threshold_percent" {
  description = "CPU usage percentage threshold for App Service alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.cpu_threshold_percent > 0 && var.cpu_threshold_percent <= 100
    error_message = "CPU threshold must be between 0 and 100."
  }
}

variable "memory_threshold_percent" {
  description = "Memory usage percentage threshold for App Service alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.memory_threshold_percent > 0 && var.memory_threshold_percent <= 100
    error_message = "Memory threshold must be between 0 and 100."
  }
}

variable "http_5xx_threshold" {
  description = "Number of HTTP 5xx errors threshold for alerts"
  type        = number
  default     = 10
}

variable "response_time_threshold_seconds" {
  description = "Response time threshold in seconds for alerts"
  type        = number
  default     = 5
}

variable "failed_requests_threshold" {
  description = "Number of failed requests (4xx) threshold per evaluation window"
  type        = number
  default     = 50
}

# ============================================================================
# METRIC THRESHOLDS - Database
# ============================================================================

variable "database_dtu_threshold_percent" {
  description = "Database DTU usage percentage threshold for alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.database_dtu_threshold_percent > 0 && var.database_dtu_threshold_percent <= 100
    error_message = "Database DTU threshold must be between 0 and 100."
  }
}

# ============================================================================
# METRIC THRESHOLDS - Redis Cache
# ============================================================================

variable "redis_memory_threshold_percent" {
  description = "Redis cache memory usage percentage threshold for alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.redis_memory_threshold_percent > 0 && var.redis_memory_threshold_percent <= 100
    error_message = "Redis memory threshold must be between 0 and 100."
  }
}

variable "redis_server_load_threshold_percent" {
  description = "Redis server load percentage threshold for alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.redis_server_load_threshold_percent > 0 && var.redis_server_load_threshold_percent <= 100
    error_message = "Redis server load threshold must be between 0 and 100."
  }
}

# ============================================================================
# METRIC THRESHOLDS - AKS
# ============================================================================

variable "aks_cpu_threshold_percent" {
  description = "AKS node CPU usage percentage threshold for alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.aks_cpu_threshold_percent > 0 && var.aks_cpu_threshold_percent <= 100
    error_message = "AKS CPU threshold must be between 0 and 100."
  }
}

variable "aks_memory_threshold_percent" {
  description = "AKS node memory usage percentage threshold for alerts"
  type        = number
  default     = 80
  validation {
    condition     = var.aks_memory_threshold_percent > 0 && var.aks_memory_threshold_percent <= 100
    error_message = "AKS memory threshold must be between 0 and 100."
  }
}

# ============================================================================
# AVAILABILITY TEST CONFIGURATION
# ============================================================================

variable "availability_test_locations" {
  description = "List of Azure Application Insights geo-locations for availability tests (see: https://learn.microsoft.com/en-us/azure/azure-monitor/app/monitor-web-app-availability)"
  type        = list(string)
  default = [
    "us-va-ash-azr",
    "us-ca-sjc-azr",
    "emea-nl-ams-azr",
    "apac-sg-sin-azr"
  ]
}

# ============================================================================
# LOG QUERY ALERT THRESHOLDS
# ============================================================================

variable "error_spike_threshold" {
  description = "Number of errors in a 5-minute window to trigger error spike alert"
  type        = number
  default     = 50
}

variable "failed_auth_threshold" {
  description = "Number of failed authentication attempts in a 5-minute window to trigger alert"
  type        = number
  default     = 10
}

# ============================================================================
# EXPLICIT ENABLE FLAGS
# ============================================================================
# These flags explicitly enable monitoring resources to avoid plan-time count errors

variable "enable_sql_monitoring" {
  description = "Enable SQL Server monitoring alerts"
  type        = bool
  default     = true
}

variable "enable_redis_monitoring" {
  description = "Enable Redis Cache monitoring alerts"
  type        = bool
  default     = true
}

variable "enable_log_query_alerts" {
  description = "Enable Log Analytics query-based alerts"
  type        = bool
  default     = true
}

variable "enable_aks_monitoring" {
  description = "Enable AKS cluster monitoring alerts"
  type        = bool
  default     = false
}

# ============================================================================
# TAGS
# ============================================================================

variable "tags" {
  description = "Common tags to apply to all monitoring resources"
  type        = map(string)
  default     = {}
}
