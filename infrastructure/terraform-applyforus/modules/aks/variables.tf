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

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
}

variable "vnet_subnet_id" {
  description = "ID of the VNet subnet for AKS"
  type        = string
}

variable "system_node_count" {
  description = "Number of system nodes"
  type        = number
}

variable "system_node_vm_size" {
  description = "VM size for system nodes"
  type        = string
}

variable "user_node_count" {
  description = "Number of user nodes"
  type        = number
}

variable "user_node_vm_size" {
  description = "VM size for user nodes"
  type        = string
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling"
  type        = bool
  default     = true
}

variable "min_count" {
  description = "Minimum node count when auto-scaling"
  type        = number
  default     = 2
}

variable "max_count" {
  description = "Maximum node count when auto-scaling"
  type        = number
  default     = 10
}

variable "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  type        = string
}

variable "acr_id" {
  description = "ID of the Azure Container Registry"
  type        = string
}

variable "enable_zones" {
  description = "Enable availability zones"
  type        = bool
  default     = false
}

variable "network_policy" {
  description = "Network policy to use (azure, calico, none)"
  type        = string
  default     = "azure"
}

variable "admin_group_object_ids" {
  description = "Azure AD group object IDs for cluster admin access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
