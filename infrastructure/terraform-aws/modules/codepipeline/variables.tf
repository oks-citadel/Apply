# CodePipeline Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "applyai"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository in format 'owner/repo'"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch to track"
  type        = string
  default     = "main"
}

variable "github_webhook_secret" {
  description = "Secret for GitHub webhook authentication"
  type        = string
  default     = ""
  sensitive   = true
}

variable "use_webhook" {
  description = "Whether to use webhook instead of polling"
  type        = bool
  default     = false
}

variable "codebuild_build_project_name" {
  description = "Name of the CodeBuild build project"
  type        = string
}

variable "codebuild_build_project_arn" {
  description = "ARN of the CodeBuild build project"
  type        = string
}

variable "codebuild_deploy_project_name" {
  description = "Name of the CodeBuild deploy project"
  type        = string
}

variable "codebuild_deploy_project_arn" {
  description = "ARN of the CodeBuild deploy project"
  type        = string
}

variable "require_manual_approval" {
  description = "Whether to require manual approval before deployment"
  type        = bool
  default     = false
}

variable "artifact_retention_days" {
  description = "Number of days to retain artifacts"
  type        = number
  default     = 30
}

variable "notification_email" {
  description = "Email address for pipeline notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
