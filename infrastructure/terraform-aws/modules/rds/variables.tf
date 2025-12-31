#-------------------------------------------------------------------------------
# RDS Module Variables
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

variable "database_subnet_ids" {
  description = "List of database subnet IDs"
  type        = list(string)
}

variable "allowed_security_groups" {
  description = "Security groups allowed to access RDS"
  type        = list(string)
}

variable "kms_key_arn" {
  description = "KMS key ARN for encryption"
  type        = string
}

#-------------------------------------------------------------------------------
# Database Configuration
#-------------------------------------------------------------------------------

variable "database_name" {
  description = "Name of the default database"
  type        = string
  default     = "applyforus"
}

variable "master_username" {
  description = "Master username"
  type        = string
  default     = "applyforusadmin"
  sensitive   = true
}

variable "master_password" {
  description = "Master password"
  type        = string
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "15.4"
}

#-------------------------------------------------------------------------------
# Instance Configuration
#-------------------------------------------------------------------------------

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.medium" # Graviton for cost savings
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage for autoscaling in GB"
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "Storage type (gp3, io1)"
  type        = string
  default     = "gp3" # gp3 is more cost-effective than gp2
}

variable "max_connections" {
  description = "Maximum database connections"
  type        = string
  default     = "200"
}

#-------------------------------------------------------------------------------
# High Availability
#-------------------------------------------------------------------------------

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "create_aurora_cluster" {
  description = "Create Aurora cluster instead of RDS instance"
  type        = bool
  default     = false
}

variable "aurora_serverless_v2" {
  description = "Use Aurora Serverless v2 (cost-optimized for variable workloads)"
  type        = bool
  default     = false
}

variable "aurora_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU capacity"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU capacity"
  type        = number
  default     = 4
}

variable "aurora_instance_count" {
  description = "Number of Aurora instances"
  type        = number
  default     = 2
}

#-------------------------------------------------------------------------------
# Backup & Maintenance
#-------------------------------------------------------------------------------

variable "backup_retention_days" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

#-------------------------------------------------------------------------------
# Monitoring
#-------------------------------------------------------------------------------

variable "enable_performance_insights" {
  description = "Enable Performance Insights"
  type        = bool
  default     = true
}

variable "enhanced_monitoring_interval" {
  description = "Enhanced monitoring interval (0 to disable, 1, 5, 10, 15, 30, 60)"
  type        = number
  default     = 60
}

variable "alarm_sns_topic_arns" {
  description = "SNS topic ARNs for CloudWatch alarms"
  type        = list(string)
  default     = []
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
