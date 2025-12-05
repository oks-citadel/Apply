# SQL Database Module Variables

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "unique_suffix" {
  description = "Unique suffix for globally unique resource names"
  type        = string
}

variable "sql_admin_username" {
  description = "SQL Server administrator username"
  type        = string
  sensitive   = true
}

variable "sql_admin_password" {
  description = "SQL Server administrator password"
  type        = string
  sensitive   = true
  validation {
    condition     = length(var.sql_admin_password) >= 8
    error_message = "Password must be at least 8 characters long."
  }
}

variable "azuread_admin_login" {
  description = "Azure AD administrator login name"
  type        = string
}

variable "azuread_admin_object_id" {
  description = "Azure AD administrator object ID"
  type        = string
}

variable "azuread_admin_tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
  default     = null
}

variable "database_sku" {
  description = "Database SKU (e.g., Basic, S1, S3, P1)"
  type        = string
  default     = null

  validation {
    condition = var.database_sku == null || can(regex("^(Basic|S[0-9]|P[0-9]|GP_|BC_|HS_)", var.database_sku))
    error_message = "Invalid database SKU. Must be Basic, Standard (S0-S12), Premium (P1-P15), or vCore-based (GP_, BC_, HS_)."
  }
}

variable "max_size_gb" {
  description = "Maximum size of the database in gigabytes"
  type        = number
  default     = 2
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "enable_defender" {
  description = "Enable Microsoft Defender for SQL"
  type        = bool
  default     = false
}

variable "subnet_id" {
  description = "Subnet ID for virtual network rule"
  type        = string
  default     = null
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for SQL Server"
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = null
}

variable "allowed_ip_addresses" {
  description = "List of allowed IP addresses for firewall rules"
  type        = list(string)
  default     = []
}

variable "allow_azure_services" {
  description = "Allow Azure services to access the SQL Server"
  type        = bool
  default     = true
}

variable "security_alert_emails" {
  description = "Email addresses for security alerts"
  type        = list(string)
  default     = []
}

variable "security_storage_endpoint" {
  description = "Storage endpoint for security logs"
  type        = string
  default     = null
}

variable "security_storage_account_key" {
  description = "Storage account access key for security logs"
  type        = string
  sensitive   = true
  default     = null
}

variable "audit_storage_endpoint" {
  description = "Storage endpoint for audit logs"
  type        = string
  default     = null
}

variable "audit_storage_account_key" {
  description = "Storage account access key for audit logs"
  type        = string
  sensitive   = true
  default     = null
}
