variable "resource_group_name" {
  description = "Name of the resource group where networking resources will be created"
  type        = string
}

variable "location" {
  description = "Azure region where networking resources will be deployed"
  type        = string
}

variable "project_name" {
  description = "Name of the project, used for resource naming"
  type        = string
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
  description = "Common tags to apply to all networking resources"
  type        = map(string)
  default     = {}
}

variable "enable_aks" {
  description = "Enable Azure Kubernetes Service subnet and related resources"
  type        = bool
  default     = false
}
