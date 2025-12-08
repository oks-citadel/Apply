# ============================================================================
# Terraform Input Variables
# ============================================================================
# This file defines all input variables for the JobPilot AI Platform infrastructure.
# Variables can be set via:
# - terraform.tfvars file
# - -var command line flag
# - TF_VAR_ environment variables
# - Variable definitions (.tfvars) files

# ============================================================================
# Core Configuration Variables
# ============================================================================

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "location" {
  description = "Primary Azure region for resources"
  type        = string
  default     = "eastus"

  validation {
    condition = contains([
      "eastus", "eastus2", "westus", "westus2", "westus3",
      "centralus", "northcentralus", "southcentralus",
      "westcentralus", "canadacentral", "canadaeast",
      "brazilsouth", "northeurope", "westeurope",
      "uksouth", "ukwest", "francecentral", "germanywestcentral",
      "norwayeast", "switzerlandnorth", "swedencentral",
      "southeastasia", "eastasia", "australiaeast",
      "australiasoutheast", "japaneast", "japanwest",
      "koreacentral", "koreasouth", "southindia",
      "centralindia", "westindia", "uaenorth", "southafricanorth"
    ], var.location)
    error_message = "Location must be a valid Azure region"
  }
}

variable "project_name" {
  description = "Project name prefix for resource naming"
  type        = string
  default     = "jobpilot"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,20}$", var.project_name))
    error_message = "Project name must be 3-20 characters, lowercase alphanumeric and hyphens only"
  }
}

# ============================================================================
# Database Configuration Variables
# ============================================================================

variable "enable_sql_database" {
  description = "Enable Azure SQL Database deployment"
  type        = bool
  default     = true
}

variable "sql_admin_username" {
  description = "SQL Server administrator username"
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{3,127}$", var.sql_admin_username))
    error_message = "SQL admin username must be 4-128 characters, start with a letter, and contain only alphanumeric characters and underscores"
  }
}

variable "sql_admin_password" {
  description = "SQL Server administrator password"
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.sql_admin_password) >= 12
    error_message = "SQL admin password must be at least 12 characters long"
  }
}

# ============================================================================
# Resource Tagging
# ============================================================================

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project    = "JobPilot"
    ManagedBy  = "Terraform"
    CostCenter = "Engineering"
  }
}

# ============================================================================
# Security and Compliance Variables
# ============================================================================

variable "enable_defender" {
  description = "Enable Azure Defender for enhanced security monitoring"
  type        = bool
  default     = false
}

variable "enable_diagnostics" {
  description = "Enable diagnostic logs for resources"
  type        = bool
  default     = true
}

variable "enable_private_endpoints" {
  description = "Enable private endpoints for production networking"
  type        = bool
  default     = false
}

variable "allowed_ip_addresses" {
  description = "Allowed IP addresses for Key Vault and SQL access (CIDR notation)"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for ip in var.allowed_ip_addresses :
      can(cidrhost(ip, 0))
    ])
    error_message = "All IP addresses must be in valid CIDR notation (e.g., 1.2.3.4/32)"
  }
}

# ============================================================================
# Application Gateway and WAF Variables
# ============================================================================

variable "enable_application_gateway" {
  description = "Enable Application Gateway with WAF for load balancing"
  type        = bool
  default     = false
}

variable "enable_front_door" {
  description = "Enable Azure Front Door with WAF (alternative to Application Gateway)"
  type        = bool
  default     = false
}

variable "waf_mode" {
  description = "WAF mode (Detection or Prevention)"
  type        = string
  default     = "Detection"

  validation {
    condition     = contains(["Detection", "Prevention"], var.waf_mode)
    error_message = "WAF mode must be either 'Detection' or 'Prevention'"
  }
}

# ============================================================================
# Kubernetes Variables
# ============================================================================

variable "enable_aks" {
  description = "Enable AKS cluster deployment"
  type        = bool
  default     = false
}

variable "aks_kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28.3"

  validation {
    condition     = can(regex("^\\d+\\.\\d+\\.\\d+$", var.aks_kubernetes_version))
    error_message = "Kubernetes version must be in semantic version format (e.g., 1.28.3)"
  }
}

# ============================================================================
# Application Insights Variables
# ============================================================================

variable "app_insights_sampling_percentage" {
  description = "Application Insights sampling percentage (0-100)"
  type        = number
  default     = 100

  validation {
    condition     = var.app_insights_sampling_percentage >= 0 && var.app_insights_sampling_percentage <= 100
    error_message = "Sampling percentage must be between 0 and 100"
  }
}

# ============================================================================
# Advanced Networking Variables
# ============================================================================

variable "vnet_address_space" {
  description = "Virtual network address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]

  validation {
    condition = alltrue([
      for cidr in var.vnet_address_space :
      can(cidrhost(cidr, 0))
    ])
    error_message = "All address spaces must be in valid CIDR notation"
  }
}

# ============================================================================
# Auto-scaling Variables
# ============================================================================

variable "enable_auto_scaling" {
  description = "Override auto-scaling settings (null to use environment defaults)"
  type        = bool
  default     = null
}

variable "min_replicas" {
  description = "Override minimum number of replicas (null to use environment defaults)"
  type        = number
  default     = null

  validation {
    condition     = var.min_replicas == null || (var.min_replicas >= 1 && var.min_replicas <= 100)
    error_message = "Minimum replicas must be between 1 and 100"
  }
}

variable "max_replicas" {
  description = "Override maximum number of replicas (null to use environment defaults)"
  type        = number
  default     = null

  validation {
    condition     = var.max_replicas == null || (var.max_replicas >= 1 && var.max_replicas <= 100)
    error_message = "Maximum replicas must be between 1 and 100"
  }
}
