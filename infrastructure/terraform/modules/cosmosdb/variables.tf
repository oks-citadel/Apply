# ============================================================================
# COSMOSDB MODULE - Variables
# ============================================================================

# ============================================================================
# Required Variables
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
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "unique_suffix" {
  description = "Unique suffix for globally unique resource names"
  type        = string
}

# ============================================================================
# Account Configuration
# ============================================================================

variable "consistency_level" {
  description = "Consistency level for Cosmos DB (Strong, BoundedStaleness, Session, ConsistentPrefix, Eventual)"
  type        = string
  default     = "Session"

  validation {
    condition     = contains(["Strong", "BoundedStaleness", "Session", "ConsistentPrefix", "Eventual"], var.consistency_level)
    error_message = "Consistency level must be one of: Strong, BoundedStaleness, Session, ConsistentPrefix, Eventual"
  }
}

variable "max_interval_in_seconds" {
  description = "Max interval in seconds for BoundedStaleness consistency (5-86400)"
  type        = number
  default     = 10
}

variable "max_staleness_prefix" {
  description = "Max staleness prefix for BoundedStaleness consistency (10-2147483647)"
  type        = number
  default     = 200
}

variable "zone_redundant" {
  description = "Enable zone redundancy for primary region"
  type        = bool
  default     = true
}

variable "geo_locations" {
  description = "Additional geo locations for multi-region distribution"
  type = list(object({
    location          = string
    failover_priority = number
    zone_redundant    = bool
  }))
  default = []
}

variable "capabilities" {
  description = "List of Cosmos DB capabilities to enable"
  type        = list(string)
  default     = []
  # Common capabilities:
  # - EnableServerless (for serverless mode)
  # - EnableAggregationPipeline
  # - MongoDBv3.4, MongoDBv4.0, MongoDBv4.2
  # - DisableRateLimitingResponses
  # - EnableMongo
  # - EnableCassandra
  # - EnableGremlin
  # - EnableTable
}

# ============================================================================
# Security Configuration
# ============================================================================

variable "public_network_access_enabled" {
  description = "Enable public network access"
  type        = bool
  default     = false
}

variable "enable_vnet_filter" {
  description = "Enable virtual network filtering"
  type        = bool
  default     = true
}

variable "virtual_network_subnet_ids" {
  description = "List of subnet IDs for VNet access rules"
  type        = list(string)
  default     = []
}

variable "disable_local_auth" {
  description = "Disable local authentication (key-based), require Azure AD"
  type        = bool
  default     = false
}

variable "enable_ip_filter" {
  description = "Enable IP range filtering"
  type        = bool
  default     = false
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges (CIDR notation)"
  type        = list(string)
  default     = []
}

variable "enable_rbac_data_plane" {
  description = "Enable RBAC for data plane operations"
  type        = bool
  default     = true
}

variable "workload_identity_principal_id" {
  description = "Principal ID of workload identity for RBAC assignment"
  type        = string
  default     = null
}

# ============================================================================
# Private Endpoint Configuration
# ============================================================================

variable "enable_private_endpoint" {
  description = "Enable private endpoint for Cosmos DB"
  type        = bool
  default     = true
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = null
}

variable "private_endpoint_vnet_id" {
  description = "VNet ID for private DNS zone link"
  type        = string
  default     = null
}

variable "create_private_dns_zone" {
  description = "Create new private DNS zone or use existing"
  type        = bool
  default     = true
}

variable "existing_private_dns_zone_id" {
  description = "ID of existing private DNS zone (if not creating new)"
  type        = string
  default     = null
}

# ============================================================================
# Backup Configuration
# ============================================================================

variable "backup_type" {
  description = "Backup type (Periodic or Continuous)"
  type        = string
  default     = "Periodic"

  validation {
    condition     = contains(["Periodic", "Continuous"], var.backup_type)
    error_message = "Backup type must be Periodic or Continuous"
  }
}

variable "backup_interval_minutes" {
  description = "Backup interval in minutes (60-1440) for Periodic backup"
  type        = number
  default     = 240
}

variable "backup_retention_hours" {
  description = "Backup retention in hours (8-720) for Periodic backup"
  type        = number
  default     = 8
}

variable "backup_storage_redundancy" {
  description = "Backup storage redundancy (Geo, Local, Zone)"
  type        = string
  default     = "Geo"

  validation {
    condition     = contains(["Geo", "Local", "Zone"], var.backup_storage_redundancy)
    error_message = "Backup storage redundancy must be Geo, Local, or Zone"
  }
}

# ============================================================================
# Database Configuration
# ============================================================================

variable "database_name" {
  description = "Name of the Cosmos DB SQL database"
  type        = string
  default     = "applyforus"
}

variable "enable_autoscale" {
  description = "Enable autoscale for database throughput"
  type        = bool
  default     = true
}

variable "max_throughput" {
  description = "Maximum throughput for autoscale (1000-1000000 RU/s)"
  type        = number
  default     = 4000
}

variable "manual_throughput" {
  description = "Manual throughput if autoscale is disabled (400-1000000 RU/s)"
  type        = number
  default     = 400
}

# ============================================================================
# Container Configuration
# ============================================================================

variable "enable_container_autoscale" {
  description = "Enable autoscale for containers"
  type        = bool
  default     = true
}

variable "container_max_throughput" {
  description = "Maximum throughput for container autoscale"
  type        = number
  default     = 4000
}

variable "container_throughput" {
  description = "Manual throughput for containers if autoscale is disabled"
  type        = number
  default     = 400
}

# TTL Settings (in seconds, -1 for no TTL)
variable "jobs_ttl_seconds" {
  description = "TTL for jobs container items (seconds, -1 for no TTL)"
  type        = number
  default     = 7776000 # 90 days
}

variable "activity_ttl_seconds" {
  description = "TTL for user activity items (seconds, -1 for no TTL)"
  type        = number
  default     = 2592000 # 30 days
}

variable "analytics_ttl_seconds" {
  description = "TTL for analytics events (seconds, -1 for no TTL)"
  type        = number
  default     = 7776000 # 90 days
}

variable "audit_ttl_seconds" {
  description = "TTL for audit logs (seconds, -1 for no TTL)"
  type        = number
  default     = 31536000 # 365 days
}

# ============================================================================
# Analytics Configuration
# ============================================================================

variable "enable_analytical_storage" {
  description = "Enable analytical storage for Azure Synapse Link"
  type        = bool
  default     = false
}

# ============================================================================
# CORS Configuration
# ============================================================================

variable "enable_cors" {
  description = "Enable CORS configuration"
  type        = bool
  default     = false
}

variable "cors_allowed_origins" {
  description = "CORS allowed origins"
  type        = list(string)
  default     = ["https://applyforus.com"]
}

variable "cors_allowed_methods" {
  description = "CORS allowed methods"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allowed_headers" {
  description = "CORS allowed headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_exposed_headers" {
  description = "CORS exposed headers"
  type        = list(string)
  default     = ["*"]
}

variable "cors_max_age" {
  description = "CORS preflight cache max age in seconds"
  type        = number
  default     = 86400
}

# ============================================================================
# Diagnostics Configuration
# ============================================================================

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
