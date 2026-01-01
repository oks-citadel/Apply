# AWS Infrastructure Main Configuration
# ApplyForUs Platform - Migrated from Azure
# Organization: o-14wy6xb785

#-------------------------------------------------------------------------------
# Local Variables
#-------------------------------------------------------------------------------

locals {
  cluster_name = "applyforus-${var.environment}"

  common_tags = {
    Environment = var.environment
    Application = "ApplyForUs"
    ManagedBy   = "terraform"
    CostCenter  = var.cost_center
    Owner       = var.owner
  }
}

#-------------------------------------------------------------------------------
# VPC Module
#-------------------------------------------------------------------------------

module "vpc" {
  source = "./modules/vpc"

  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  aws_region         = var.aws_region
  cluster_name       = local.cluster_name

  enable_nat_gateway   = var.enable_nat_gateway
  single_nat_gateway   = var.single_nat_gateway
  enable_vpc_endpoints = var.environment == "prod" ? true : false
  enable_flow_logs     = var.environment == "prod" ? true : false
}

#-------------------------------------------------------------------------------
# EKS Module
#-------------------------------------------------------------------------------

module "eks" {
  source = "./modules/eks"

  cluster_name       = local.cluster_name
  cluster_version    = var.eks_cluster_version
  vpc_id             = module.vpc.vpc_id
  vpc_cidr           = module.vpc.vpc_cidr
  private_subnet_ids = module.vpc.private_subnet_ids
  kms_key_arn        = aws_kms_key.main.arn

  node_groups               = var.eks_node_groups
  enable_karpenter          = var.enable_karpenter
  enable_container_insights = var.enable_container_insights
  enable_public_access      = var.environment != "prod" ? true : false
}

#-------------------------------------------------------------------------------
# ECR Module
#-------------------------------------------------------------------------------

module "ecr" {
  source = "./modules/ecr"

  repositories = var.ecr_repositories

  image_retention_count      = var.ecr_image_retention_count
  untagged_image_expiry_days = var.environment == "prod" ? 30 : 7
  dev_image_expiry_days      = var.environment == "prod" ? 30 : 14

  enable_replication = var.environment == "prod" ? true : false
  replication_region = var.dr_region
}

#-------------------------------------------------------------------------------
# RDS PostgreSQL Module
#-------------------------------------------------------------------------------

module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  database_subnet_ids     = module.vpc.database_subnet_ids
  allowed_security_groups = [module.eks.node_security_group_id]
  kms_key_arn             = aws_kms_key.main.arn

  # Database Configuration
  database_name   = "applyforus"
  master_username = "applyforusadmin"
  master_password = var.db_master_password

  # Instance Configuration (cost-optimized per environment)
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage

  # High Availability
  multi_az              = var.environment == "prod" ? true : false
  create_aurora_cluster = var.environment == "prod" && var.use_aurora
  aurora_serverless_v2  = var.environment == "prod" && var.use_aurora_serverless

  # Backup & Monitoring
  backup_retention_days        = var.environment == "prod" ? 30 : 7
  enable_performance_insights  = var.environment != "dev"
  enhanced_monitoring_interval = var.environment == "prod" ? 60 : 0

  cost_center = var.cost_center
  tags        = local.common_tags
}

#-------------------------------------------------------------------------------
# ElastiCache Redis Module
#-------------------------------------------------------------------------------

module "elasticache" {
  source = "./modules/elasticache"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  allowed_security_groups = [module.eks.node_security_group_id]
  kms_key_arn             = aws_kms_key.main.arn

  # Redis Configuration (cost-optimized per environment)
  use_serverless                 = var.elasticache_use_serverless
  serverless_max_data_storage_gb = var.elasticache_serverless_max_gb
  serverless_max_ecpu            = var.elasticache_serverless_max_ecpu

  # Traditional Configuration (if not serverless)
  node_type          = var.elasticache_node_type
  num_cache_clusters = var.environment == "prod" ? 2 : 1

  # Security
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token

  # Backup
  snapshot_retention_days = var.environment == "prod" ? 7 : 1

  cost_center = var.cost_center
  tags        = local.common_tags
}

#-------------------------------------------------------------------------------
# Cost Management Module
#-------------------------------------------------------------------------------

module "cost_management" {
  source = "./modules/cost-management"

  environment           = var.environment
  monthly_budget_limit  = var.monthly_budget_limit
  compute_budget_limit  = var.monthly_budget_limit * 0.5
  database_budget_limit = var.monthly_budget_limit * 0.2

  budget_alert_emails = var.budget_alert_emails
  finops_email        = var.budget_alert_emails[0]
  monitored_regions   = [var.aws_region, var.dr_region]

  # Anomaly monitor disabled - AWS account already has one at limit
  # Cost anomaly detection is handled by existing monitors
  create_anomaly_monitor = false

  enable_auto_shutdown = var.auto_shutdown == "true" ? true : false
  shutdown_schedule    = var.shutdown_schedule
  startup_schedule     = var.startup_schedule
}

#-------------------------------------------------------------------------------
# KMS Key for Encryption
#-------------------------------------------------------------------------------

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} environment"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "${var.environment}-kms-key"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/applyforus-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

#-------------------------------------------------------------------------------
# Secrets Manager (Placeholder for migration from Key Vault)
#-------------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "database" {
  name        = "${var.environment}/applyforus/database"
  description = "Database credentials for ${var.environment}"
  kms_key_id  = aws_kms_key.main.arn

  tags = {
    Name = "${var.environment}-database-secret"
  }
}

resource "aws_secretsmanager_secret" "redis" {
  name        = "${var.environment}/applyforus/redis"
  description = "Redis credentials for ${var.environment}"
  kms_key_id  = aws_kms_key.main.arn

  tags = {
    Name = "${var.environment}-redis-secret"
  }
}

resource "aws_secretsmanager_secret" "jwt" {
  name        = "${var.environment}/applyforus/jwt"
  description = "JWT secrets for ${var.environment}"
  kms_key_id  = aws_kms_key.main.arn

  tags = {
    Name = "${var.environment}-jwt-secret"
  }
}

#-------------------------------------------------------------------------------
# CloudWatch Log Groups
#-------------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/applyforus/${var.environment}/application"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = {
    Name = "${var.environment}-application-logs"
  }
}

resource "aws_cloudwatch_log_group" "eks" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = {
    Name = "${var.environment}-eks-logs"
  }
}
