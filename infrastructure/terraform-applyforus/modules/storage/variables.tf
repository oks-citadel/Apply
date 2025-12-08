variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "resource_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "account_tier" {
  description = "Storage account tier (Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
}

variable "backup_retention_days" {
  description = "Retention days for soft deleted blobs"
  type        = number
  default     = 7
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for storage"
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  description = "ID of the subnet for private endpoint"
  type        = string
  default     = null
}

variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for storage access"
  type        = list(string)
  default     = []
}

variable "enable_threat_protection" {
  description = "Enable Advanced Threat Protection"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace for diagnostics"
  type        = string
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
