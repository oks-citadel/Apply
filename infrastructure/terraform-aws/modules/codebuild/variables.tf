# CodeBuild Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "applyai"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "build_timeout" {
  description = "Build timeout in minutes"
  type        = number
  default     = 60
}

variable "deploy_timeout" {
  description = "Deploy timeout in minutes"
  type        = number
  default     = 30
}

variable "compute_type" {
  description = "CodeBuild compute type"
  type        = string
  default     = "BUILD_GENERAL1_MEDIUM"
}

variable "build_image" {
  description = "Docker image to use for builds"
  type        = string
  default     = "aws/codebuild/amazonlinux2-x86_64-standard:5.0"
}

variable "buildspec_build" {
  description = "Path to buildspec file for build stage"
  type        = string
  default     = "buildspec.yml"
}

variable "buildspec_deploy" {
  description = "Path to buildspec file for deploy stage"
  type        = string
  default     = "buildspec-deploy.yml"
}

variable "artifact_bucket_arn" {
  description = "ARN of the S3 bucket for artifacts"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for CodeBuild projects"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "eks_cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "applyai-eks-cluster"
}

variable "kubernetes_namespace" {
  description = "Kubernetes namespace for deployments"
  type        = string
  default     = "applyforus"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
