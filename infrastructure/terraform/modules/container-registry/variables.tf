###########################################
# Container Registry Module - Variables
# JobPilot AI Platform
###########################################

variable "resource_group_name" {
  description = "Name of the Azure Resource Group where the container registry will be created"
  type        = string

  validation {
    condition     = length(var.resource_group_name) > 0
    error_message = "Resource group name must not be empty."
  }
}

variable "location" {
  description = "Azure region where the container registry will be created"
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
    condition     = can(regex("^[a-z0-9]+$", var.project_name))
    error_message = "Project name must contain only lowercase alphanumeric characters for ACR naming."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod) - determines SKU and features"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "unique_suffix" {
  description = "Unique suffix to ensure globally unique ACR name (e.g., random string or identifier)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]{4,10}$", var.unique_suffix))
    error_message = "Unique suffix must be 4-10 lowercase alphanumeric characters."
  }
}

variable "tags" {
  description = "Common tags to apply to all container registry resources"
  type        = map(string)
  default     = {}
}

variable "enable_defender" {
  description = "Enable Microsoft Defender for Container Registries (recommended for production)"
  type        = bool
  default     = false
}

variable "cicd_identity_principal_id" {
  description = "Principal ID of the CI/CD managed identity (for AcrPush role assignment)"
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9-]{36}$", var.cicd_identity_principal_id))
    error_message = "CI/CD identity principal ID must be a valid GUID."
  }
}

variable "aks_identity_principal_id" {
  description = "Principal ID of the AKS kubelet managed identity (for AcrPull role assignment)"
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9-]{36}$", var.aks_identity_principal_id))
    error_message = "AKS identity principal ID must be a valid GUID."
  }
}

variable "workload_identity_principal_id" {
  description = "Principal ID of the workload managed identity (for AcrPull role assignment)"
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9-]{36}$", var.workload_identity_principal_id))
    error_message = "Workload identity principal ID must be a valid GUID."
  }
}

variable "geo_replication_locations" {
  description = "Additional Azure regions for geo-replication (Premium SKU only, production environment)"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.geo_replication_locations) <= 5
    error_message = "Maximum of 5 geo-replication locations allowed."
  }
}

variable "retention_policy_days" {
  description = "Number of days to retain untagged manifests (Standard and Premium SKUs only)"
  type        = number
  default     = null

  validation {
    condition     = var.retention_policy_days == null || (var.retention_policy_days >= 0 && var.retention_policy_days <= 365)
    error_message = "Retention policy days must be between 0 and 365."
  }
}

# ============================================================================
# ACR Cleanup and Retention Variables
# ============================================================================

variable "enable_initial_cleanup" {
  description = "Enable initial cleanup run when ACR is created"
  type        = bool
  default     = false
}

variable "enable_cleanup_notifications" {
  description = "Enable webhook notifications for cleanup events"
  type        = bool
  default     = false
}

variable "cleanup_webhook_url" {
  description = "Webhook URL for cleanup notifications"
  type        = string
  default     = ""
}

variable "enable_cache_rules" {
  description = "Enable cache rules for frequently used base images"
  type        = bool
  default     = true
}
