# General Configuration
variable "environment" {
  description = "Environment name (dev, test, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "Environment must be dev, test, or prod."
  }
}

variable "location" {
  description = "Azure region for primary resources"
  type        = string
  default     = "eastus"
}

variable "location_secondary" {
  description = "Azure region for secondary/replicated resources"
  type        = string
  default     = "westus2"
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "applyforus"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Networking Configuration
variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_aks_address_prefix" {
  description = "Address prefix for AKS subnet"
  type        = string
  default     = "10.0.1.0/23"
}

variable "subnet_app_gateway_address_prefix" {
  description = "Address prefix for Application Gateway subnet"
  type        = string
  default     = "10.0.3.0/24"
}

variable "subnet_private_endpoints_address_prefix" {
  description = "Address prefix for private endpoints subnet"
  type        = string
  default     = "10.0.4.0/24"
}

variable "subnet_management_address_prefix" {
  description = "Address prefix for management subnet"
  type        = string
  default     = "10.0.5.0/24"
}

# AKS Configuration
variable "aks_kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28.3"
}

variable "aks_system_node_count" {
  description = "Number of nodes in the system node pool"
  type        = number
  default     = 2
}

variable "aks_system_node_vm_size" {
  description = "VM size for system node pool"
  type        = string
  default     = "Standard_D2s_v3"
}

variable "aks_user_node_count" {
  description = "Number of nodes in the user node pool"
  type        = number
  default     = 3
}

variable "aks_user_node_vm_size" {
  description = "VM size for user node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "aks_enable_auto_scaling" {
  description = "Enable auto-scaling for AKS node pools"
  type        = bool
  default     = true
}

variable "aks_min_count" {
  description = "Minimum number of nodes when auto-scaling is enabled"
  type        = number
  default     = 2
}

variable "aks_max_count" {
  description = "Maximum number of nodes when auto-scaling is enabled"
  type        = number
  default     = 10
}

# ACR Configuration
variable "acr_sku" {
  description = "SKU for Azure Container Registry (Basic, Standard, Premium)"
  type        = string
  default     = "Premium"
}

variable "acr_enable_geo_replication" {
  description = "Enable geo-replication for ACR (Premium SKU only)"
  type        = bool
  default     = false
}

# Key Vault Configuration
variable "key_vault_sku" {
  description = "SKU for Key Vault (standard, premium)"
  type        = string
  default     = "standard"
}

variable "key_vault_enable_purge_protection" {
  description = "Enable purge protection for Key Vault"
  type        = bool
  default     = false
}

variable "key_vault_soft_delete_retention_days" {
  description = "Soft delete retention days for Key Vault"
  type        = number
  default     = 7
}

# Application Gateway Configuration
variable "app_gateway_sku_name" {
  description = "SKU name for Application Gateway"
  type        = string
  default     = "WAF_v2"
}

variable "app_gateway_sku_tier" {
  description = "SKU tier for Application Gateway"
  type        = string
  default     = "WAF_v2"
}

variable "app_gateway_capacity" {
  description = "Capacity units for Application Gateway"
  type        = number
  default     = 2
}

variable "app_gateway_enable_auto_scaling" {
  description = "Enable auto-scaling for Application Gateway"
  type        = bool
  default     = true
}

variable "app_gateway_min_capacity" {
  description = "Minimum capacity units when auto-scaling"
  type        = number
  default     = 2
}

variable "app_gateway_max_capacity" {
  description = "Maximum capacity units when auto-scaling"
  type        = number
  default     = 10
}

# DNS Configuration
variable "dns_zone_name" {
  description = "DNS zone name"
  type        = string
  default     = "applyforus.com"
}

# Monitoring Configuration
variable "log_analytics_retention_days" {
  description = "Retention days for Log Analytics workspace"
  type        = number
  default     = 30
}

# Storage Configuration
variable "storage_account_tier" {
  description = "Storage account tier (Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "storage_account_replication_type" {
  description = "Storage account replication type"
  type        = string
  default     = "LRS"
}

# Security Configuration
variable "allowed_ip_ranges" {
  description = "Allowed IP ranges for management access"
  type        = list(string)
  default     = []
}

variable "enable_private_endpoints" {
  description = "Enable private endpoints for PaaS services"
  type        = bool
  default     = false
}

# Cost Management
variable "enable_cost_alerts" {
  description = "Enable cost management alerts"
  type        = bool
  default     = true
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 1000
}
