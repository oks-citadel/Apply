# AWS Infrastructure Variables for ApplyForUs Platform
# Cost-optimized configuration migrated from Azure

#-------------------------------------------------------------------------------
# Project Configuration
#-------------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "applyai"
}

#-------------------------------------------------------------------------------
# Environment & Region Configuration
#-------------------------------------------------------------------------------

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "dr_region" {
  description = "Disaster recovery region (prod only)"
  type        = string
  default     = "us-west-2"
}

variable "assume_role_arn" {
  description = "IAM role ARN to assume for cross-account access"
  type        = string
  default     = ""
}

#-------------------------------------------------------------------------------
# Cost Allocation Tags (MANDATORY - enforced by SCP)
#-------------------------------------------------------------------------------

variable "owner" {
  description = "Team or individual responsible for resources"
  type        = string
  default     = "platform-team@applyforus.com"
}

variable "cost_center" {
  description = "Business unit cost center code"
  type        = string
  default     = "PLATFORM-001"
}

variable "auto_shutdown" {
  description = "Enable auto-shutdown for non-production environments"
  type        = string
  default     = "false"
}

variable "expiration_date" {
  description = "Resource expiration date (YYYY-MM-DD) for temporary resources"
  type        = string
  default     = ""
}

#-------------------------------------------------------------------------------
# Networking Configuration
#-------------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (single for dev, HA for prod)"
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Use single NAT Gateway (cost optimization for non-prod)"
  type        = bool
  default     = true
}

#-------------------------------------------------------------------------------
# EKS Configuration (Cost-Optimized)
#-------------------------------------------------------------------------------

variable "eks_cluster_version" {
  description = "Kubernetes version for EKS"
  type        = string
  default     = "1.30"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string # ON_DEMAND or SPOT
    ami_type       = optional(string, "AL2023_ARM_64_STANDARD") # ARM for Graviton instances
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = number
    labels         = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    # Cost-optimized defaults - Graviton (ARM64) instances
    system = {
      instance_types = ["m6g.medium", "m6g.large"]
      capacity_type  = "ON_DEMAND"
      ami_type       = "AL2023_ARM_64_STANDARD" # ARM for Graviton
      min_size       = 1
      max_size       = 3
      desired_size   = 2
      disk_size      = 50
      labels         = { "node-type" = "system" }
      taints         = []
    }
    application = {
      instance_types = ["m6g.large", "m6g.xlarge", "m7g.large"]
      capacity_type  = "SPOT" # 70% cost savings
      ami_type       = "AL2023_ARM_64_STANDARD" # ARM for Graviton
      min_size       = 0
      max_size       = 10
      desired_size   = 2
      disk_size      = 100
      labels         = { "node-type" = "application" }
      taints         = []
    }
  }
}

variable "enable_karpenter" {
  description = "Enable Karpenter for dynamic node provisioning"
  type        = bool
  default     = true
}

#-------------------------------------------------------------------------------
# RDS Configuration (PostgreSQL)
#-------------------------------------------------------------------------------

variable "rds_instance_class" {
  description = "RDS instance class (Graviton for cost savings)"
  type        = string
  default     = "db.t4g.medium"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 50
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage for autoscaling"
  type        = number
  default     = 200
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}

variable "rds_backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "rds_databases" {
  description = "List of databases to create"
  type        = list(string)
  default = [
    "auth_service_db",
    "user_service_db",
    "job_service_db",
    "resume_service_db",
    "notification_service_db",
    "analytics_service_db",
    "auto_apply_service_db",
    "payment_service_db"
  ]
}

variable "db_master_password" {
  description = "Master password for RDS (should be stored in Secrets Manager)"
  type        = string
  sensitive   = true
}

variable "use_aurora" {
  description = "Use Aurora PostgreSQL instead of RDS (production recommendation)"
  type        = bool
  default     = false
}

variable "use_aurora_serverless" {
  description = "Use Aurora Serverless v2 for cost-optimized scaling"
  type        = bool
  default     = false
}

#-------------------------------------------------------------------------------
# ElastiCache Configuration (Redis)
#-------------------------------------------------------------------------------

variable "elasticache_node_type" {
  description = "ElastiCache node type (Graviton for cost savings)"
  type        = string
  default     = "cache.t4g.micro"
}

variable "elasticache_num_cache_nodes" {
  description = "Number of cache nodes"
  type        = number
  default     = 1
}

variable "elasticache_parameter_group_family" {
  description = "ElastiCache parameter group family"
  type        = string
  default     = "redis7"
}

variable "redis_auth_token" {
  description = "Redis AUTH token (password) for TLS-enabled connections"
  type        = string
  sensitive   = true
  default     = null
}

variable "elasticache_use_serverless" {
  description = "Use ElastiCache Serverless for cost-optimized variable workloads"
  type        = bool
  default     = false
}

variable "elasticache_serverless_max_gb" {
  description = "Maximum data storage for ElastiCache Serverless in GB"
  type        = number
  default     = 5
}

variable "elasticache_serverless_max_ecpu" {
  description = "Maximum ECPUs per second for ElastiCache Serverless"
  type        = number
  default     = 5000
}

#-------------------------------------------------------------------------------
# OpenSearch Configuration
#-------------------------------------------------------------------------------

variable "opensearch_instance_type" {
  description = "OpenSearch instance type (Graviton for cost savings)"
  type        = string
  default     = "t3.small.search"
}

variable "opensearch_instance_count" {
  description = "Number of OpenSearch instances"
  type        = number
  default     = 1
}

variable "opensearch_volume_size" {
  description = "OpenSearch EBS volume size in GB"
  type        = number
  default     = 20
}

#-------------------------------------------------------------------------------
# ECR Configuration
#-------------------------------------------------------------------------------

variable "ecr_repositories" {
  description = "List of ECR repositories to create"
  type        = list(string)
  default = [
    "applyai-web",
    "applyai-auth-service",
    "applyai-user-service",
    "applyai-job-service",
    "applyai-resume-service",
    "applyai-notification-service",
    "applyai-auto-apply-service",
    "applyai-analytics-service",
    "applyai-ai-service",
    "applyai-orchestrator-service",
    "applyai-payment-service"
  ]
}

variable "ecr_image_retention_count" {
  description = "Number of images to retain per repository"
  type        = number
  default     = 30
}

#-------------------------------------------------------------------------------
# Cost Management Configuration
#-------------------------------------------------------------------------------

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 5000
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = ["platform-team@applyforus.com"]
}

variable "enable_cost_anomaly_detection" {
  description = "Enable AWS Cost Anomaly Detection"
  type        = bool
  default     = true
}

#-------------------------------------------------------------------------------
# Monitoring Configuration
#-------------------------------------------------------------------------------

variable "cloudwatch_log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights for EKS"
  type        = bool
  default     = true
}

#-------------------------------------------------------------------------------
# Auto-Shutdown Configuration (Non-Production)
#-------------------------------------------------------------------------------

variable "shutdown_schedule" {
  description = "Cron expression for auto-shutdown (UTC)"
  type        = string
  default     = "cron(0 19 ? * MON-FRI *)" # 7 PM weekdays
}

variable "startup_schedule" {
  description = "Cron expression for auto-startup (UTC)"
  type        = string
  default     = "cron(0 7 ? * MON-FRI *)" # 7 AM weekdays
}
