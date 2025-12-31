# AWS Infrastructure Outputs

#-------------------------------------------------------------------------------
# VPC Outputs
#-------------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

#-------------------------------------------------------------------------------
# EKS Outputs
#-------------------------------------------------------------------------------

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_certificate_authority" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN"
  value       = module.eks.oidc_provider_arn
}

#-------------------------------------------------------------------------------
# ECR Outputs
#-------------------------------------------------------------------------------

output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

output "ecr_registry_url" {
  description = "ECR registry URL"
  value       = module.ecr.registry_url
}

#-------------------------------------------------------------------------------
# RDS Outputs
#-------------------------------------------------------------------------------

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
}

output "rds_reader_endpoint" {
  description = "RDS reader endpoint (Aurora only)"
  value       = module.rds.reader_endpoint
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.database_name
}

output "rds_connection_string" {
  description = "RDS connection string format"
  value       = module.rds.connection_string
  sensitive   = true
}

#-------------------------------------------------------------------------------
# ElastiCache Outputs
#-------------------------------------------------------------------------------

output "elasticache_primary_endpoint" {
  description = "ElastiCache primary endpoint"
  value       = module.elasticache.primary_endpoint
}

output "elasticache_reader_endpoint" {
  description = "ElastiCache reader endpoint"
  value       = module.elasticache.reader_endpoint
}

output "elasticache_port" {
  description = "ElastiCache port"
  value       = module.elasticache.port
}

output "elasticache_connection_url" {
  description = "ElastiCache connection URL"
  value       = module.elasticache.connection_url
}

#-------------------------------------------------------------------------------
# Cost Management Outputs
#-------------------------------------------------------------------------------

output "monthly_budget_id" {
  description = "Monthly budget ID"
  value       = module.cost_management.monthly_budget_id
}

#-------------------------------------------------------------------------------
# Secrets Manager Outputs
#-------------------------------------------------------------------------------

output "secrets_arns" {
  description = "Secrets Manager ARNs"
  value = {
    database = aws_secretsmanager_secret.database.arn
    redis    = aws_secretsmanager_secret.redis.arn
    jwt      = aws_secretsmanager_secret.jwt.arn
  }
}

#-------------------------------------------------------------------------------
# KMS Outputs
#-------------------------------------------------------------------------------

output "kms_key_arn" {
  description = "KMS key ARN"
  value       = aws_kms_key.main.arn
}

#-------------------------------------------------------------------------------
# Kubectl Configuration Command
#-------------------------------------------------------------------------------

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}
