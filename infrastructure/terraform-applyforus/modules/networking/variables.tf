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

variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
}

variable "subnet_aks_address_prefix" {
  description = "Address prefix for AKS subnet"
  type        = string
}

variable "subnet_app_gateway_address_prefix" {
  description = "Address prefix for Application Gateway subnet"
  type        = string
}

variable "subnet_private_endpoints_address_prefix" {
  description = "Address prefix for private endpoints subnet"
  type        = string
}

variable "subnet_management_address_prefix" {
  description = "Address prefix for management subnet"
  type        = string
}

variable "allowed_management_ips" {
  description = "Allowed IP addresses for management access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
