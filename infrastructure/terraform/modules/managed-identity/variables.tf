###########################################
# Managed Identity Module - Variables
# JobPilot AI Platform
###########################################

variable "resource_group_name" {
  description = "Name of the Azure Resource Group where managed identities will be created"
  type        = string

  validation {
    condition     = length(var.resource_group_name) > 0
    error_message = "Resource group name must not be empty."
  }
}

variable "location" {
  description = "Azure region where the managed identities will be created"
  type        = string

  validation {
    condition     = length(var.location) > 0
    error_message = "Location must not be empty."
  }
}

variable "project_name" {
  description = "Name of the project, used for resource naming convention"
  type        = string
  default     = "jobpilot"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "tags" {
  description = "Common tags to apply to all managed identity resources"
  type        = map(string)
  default     = {}
}
