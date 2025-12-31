#-------------------------------------------------------------------------------
# ElastiCache Module Variables
#-------------------------------------------------------------------------------

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "application_name" {
  description = "Application name"
  type        = string
  default     = "applyforus"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access Redis"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

#-------------------------------------------------------------------------------
# Serverless Configuration (Cost-optimized for variable workloads)
#-------------------------------------------------------------------------------

variable "use_serverless" {
  description = "Use ElastiCache Serverless (recommended for variable workloads)"
  type        = bool
  default     = false
}

variable "serverless_max_data_storage_gb" {
  description = "Maximum data storage for serverless in GB"
  type        = number
  default     = 5
}

variable "serverless_max_ecpu" {
  description = "Maximum ECPUs per second for serverless"
  type        = number
  default     = 5000
}

#-------------------------------------------------------------------------------
# Traditional Configuration
#-------------------------------------------------------------------------------

variable "redis_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro" # Graviton for cost savings
}

variable "num_cache_clusters" {
  description = "Number of cache clusters (nodes). Use 2 for HA in prod"
  type        = number
  default     = 1
}

variable "maxmemory_policy" {
  description = "Redis maxmemory eviction policy"
  type        = string
  default     = "volatile-lru"
}

variable "enable_persistence" {
  description = "Enable Redis persistence (AOF)"
  type        = bool
  default     = false
}

#-------------------------------------------------------------------------------
# Security
#-------------------------------------------------------------------------------

variable "transit_encryption_enabled" {
  description = "Enable TLS for transit encryption"
  type        = bool
  default     = true
}

variable "auth_token" {
  description = "Redis AUTH token (password) - required if transit_encryption_enabled"
  type        = string
  sensitive   = true
  default     = null
}

#-------------------------------------------------------------------------------
# Maintenance & Backup
#-------------------------------------------------------------------------------

variable "maintenance_window" {
  description = "Weekly maintenance window"
  type        = string
  default     = "sun:05:00-sun:06:00"
}

variable "snapshot_window" {
  description = "Daily snapshot window"
  type        = string
  default     = "04:00-05:00"
}

variable "snapshot_retention_days" {
  description = "Number of days to retain snapshots"
  type        = number
  default     = 7
}

#-------------------------------------------------------------------------------
# Monitoring
#-------------------------------------------------------------------------------

variable "alarm_sns_topic_arns" {
  description = "SNS topic ARNs for CloudWatch alarms"
  type        = list(string)
  default     = []
}

variable "notification_topic_arn" {
  description = "SNS topic ARN for ElastiCache notifications"
  type        = string
  default     = null
}

#-------------------------------------------------------------------------------
# Cost Tags
#-------------------------------------------------------------------------------

variable "cost_center" {
  description = "Cost center for billing"
  type        = string
  default     = "PLATFORM"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
