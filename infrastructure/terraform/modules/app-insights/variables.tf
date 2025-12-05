variable "resource_group_name" {
  description = "Name of the resource group where Application Insights will be created"
  type        = string
}

variable "location" {
  description = "Azure region where Application Insights will be deployed"
  type        = string
}

variable "project_name" {
  description = "Name of the project (used in resource naming)"
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "sampling_percentage" {
  description = "Sampling percentage for Application Insights (0-100)"
  type        = number
  default     = 100

  validation {
    condition     = var.sampling_percentage >= 0 && var.sampling_percentage <= 100
    error_message = "Sampling percentage must be between 0 and 100."
  }
}
