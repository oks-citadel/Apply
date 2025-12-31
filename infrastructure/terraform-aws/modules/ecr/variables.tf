# ECR Module Variables

variable "repositories" {
  description = "List of ECR repository names"
  type        = list(string)
}

variable "image_tag_mutability" {
  description = "Image tag mutability setting"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "image_retention_count" {
  description = "Number of tagged images to retain"
  type        = number
  default     = 30
}

variable "untagged_image_expiry_days" {
  description = "Days to keep untagged images"
  type        = number
  default     = 7
}

variable "dev_image_expiry_days" {
  description = "Days to keep dev/feature/PR images"
  type        = number
  default     = 14
}

variable "enable_cross_account_access" {
  description = "Enable cross-account image pull"
  type        = bool
  default     = false
}

variable "cross_account_arns" {
  description = "ARNs allowed to pull images"
  type        = list(string)
  default     = []
}

variable "enable_replication" {
  description = "Enable cross-region replication"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "Target region for replication"
  type        = string
  default     = "us-west-2"
}

variable "replication_registry_id" {
  description = "Target registry ID for replication"
  type        = string
  default     = ""
}

variable "enable_pull_through_cache" {
  description = "Enable pull-through cache for public registries"
  type        = bool
  default     = false
}
