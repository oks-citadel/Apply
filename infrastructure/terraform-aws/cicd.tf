# CI/CD Infrastructure for ApplyForUs Platform
# GitHub → CodePipeline → CodeBuild → ECR → EKS

# ============================================================================
# S3 Bucket for Artifacts (shared between CodePipeline and CodeBuild)
# ============================================================================

resource "aws_s3_bucket" "cicd_artifacts" {
  bucket = "${var.project_name}-cicd-artifacts-${var.environment}"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "cicd_artifacts" {
  bucket = aws_s3_bucket.cicd_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cicd_artifacts" {
  bucket = aws_s3_bucket.cicd_artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cicd_artifacts" {
  bucket = aws_s3_bucket.cicd_artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cicd_artifacts" {
  bucket = aws_s3_bucket.cicd_artifacts.id

  rule {
    id     = "cleanup-old-artifacts"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.environment == "prod" ? 90 : 30
    }
  }
}

# ============================================================================
# CodeBuild Projects (created first - no dependencies on CodePipeline)
# ============================================================================

module "codebuild" {
  source = "./modules/codebuild"

  project_name         = var.project_name
  environment          = var.environment
  artifact_bucket_arn  = aws_s3_bucket.cicd_artifacts.arn
  eks_cluster_name     = module.eks.cluster_name
  kubernetes_namespace = var.kubernetes_namespace

  # VPC configuration (disabled - requires ec2:DescribeSecurityGroups IAM permission)
  # Enable this when IAM user has full EC2 permissions
  enable_vpc_config    = false
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids

  # Build configuration
  build_timeout    = var.codebuild_timeout
  compute_type     = var.environment == "prod" ? "BUILD_GENERAL1_LARGE" : "BUILD_GENERAL1_MEDIUM"
  buildspec_build  = "buildspec.yml"
  buildspec_deploy = "buildspec-deploy.yml"

  # Logging
  log_retention_days = var.environment == "prod" ? 90 : 30

  tags = local.common_tags
}

# ============================================================================
# CodePipeline (depends on CodeBuild)
# ============================================================================

module "codepipeline" {
  source = "./modules/codepipeline"

  project_name      = var.project_name
  environment       = var.environment
  github_repository = var.github_repository
  github_branch     = var.github_branch

  # CodeBuild integration
  codebuild_build_project_name  = module.codebuild.build_project_name
  codebuild_build_project_arn   = module.codebuild.build_project_arn
  codebuild_deploy_project_name = module.codebuild.deploy_project_name
  codebuild_deploy_project_arn  = module.codebuild.deploy_project_arn

  # Approval gate for production
  require_manual_approval = var.environment == "prod"

  # Artifact retention
  artifact_retention_days = var.environment == "prod" ? 90 : 30

  tags = local.common_tags

  depends_on = [module.codebuild]
}

# ============================================================================
# ECR Repositories (if not already defined)
# ============================================================================

# Note: ECR is defined in modules/ecr/
# This ensures all services have repositories

# ============================================================================
# Variables for CI/CD
# ============================================================================

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
  default     = "oks-citadel/Apply"
}

variable "github_branch" {
  description = "GitHub branch to track for deployments"
  type        = string
  default     = "main"
}

variable "codebuild_timeout" {
  description = "CodeBuild timeout in minutes"
  type        = number
  default     = 60
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for deployments"
  type        = string
  default     = "applyforus"
}

# ============================================================================
# Outputs
# ============================================================================

output "pipeline_name" {
  description = "Name of the CodePipeline"
  value       = module.codepipeline.pipeline_name
}

output "pipeline_arn" {
  description = "ARN of the CodePipeline"
  value       = module.codepipeline.pipeline_arn
}

output "github_connection_arn" {
  description = "ARN of the GitHub connection (must be activated in AWS Console)"
  value       = module.codepipeline.github_connection_arn
}

output "github_connection_status" {
  description = "Status of the GitHub connection"
  value       = module.codepipeline.github_connection_status
}

output "artifact_bucket" {
  description = "S3 bucket for pipeline artifacts"
  value       = module.codepipeline.artifact_bucket_name
}

output "codebuild_build_project" {
  description = "CodeBuild project for building images"
  value       = module.codebuild.build_project_name
}

output "codebuild_deploy_project" {
  description = "CodeBuild project for deploying to EKS"
  value       = module.codebuild.deploy_project_name
}

output "pipeline_notifications_topic" {
  description = "SNS topic for pipeline notifications"
  value       = module.codepipeline.sns_topic_arn
}
