variable "resource_group_name" {
  description = "Name of the resource group where Key Vault will be created"
  type        = string
}

variable "location" {
  description = "Azure region where Key Vault will be deployed"
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

variable "unique_suffix" {
  description = "Unique suffix to ensure globally unique Key Vault name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "enable_diagnostics" {
  description = "Enable diagnostic settings for Key Vault"
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint and disable public network access"
  type        = bool
  default     = false
}

variable "allowed_ip_addresses" {
  description = "List of IP addresses or CIDR ranges allowed to access Key Vault"
  type        = list(string)
  default     = []
}

variable "virtual_network_rules" {
  description = "List of virtual network subnet IDs allowed to access Key Vault"
  type        = list(string)
  default     = []
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID for diagnostic settings"
  type        = string
  default     = null
}
