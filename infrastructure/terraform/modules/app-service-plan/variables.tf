# App Service Plan Module Variables

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "plan_sku" {
  description = "SKU for the App Service Plan (e.g., B2, S1, P1v3)"
  type        = string
  default     = "B2"
  validation {
    condition     = can(regex("^(B[1-3]|S[1-3]|P[1-3]v[2-3]|P[0-3]v3)$", var.plan_sku))
    error_message = "SKU must be a valid App Service Plan SKU (B1-B3, S1-S3, P1v3-P3v3, etc.)."
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "enable_autoscaling" {
  description = "Enable autoscaling for the App Service Plan"
  type        = bool
  default     = false
}

variable "min_capacity" {
  description = "Minimum number of instances for autoscaling"
  type        = number
  default     = 1
  validation {
    condition     = var.min_capacity >= 1 && var.min_capacity <= 30
    error_message = "Minimum capacity must be between 1 and 30."
  }
}

variable "max_capacity" {
  description = "Maximum number of instances for autoscaling"
  type        = number
  default     = 3
  validation {
    condition     = var.max_capacity >= 1 && var.max_capacity <= 30
    error_message = "Maximum capacity must be between 1 and 30."
  }
}
