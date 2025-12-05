# App Services Module Variables

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
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

variable "app_service_plan_id" {
  description = "ID of the App Service Plan to deploy services to"
  type        = string
}

variable "container_registry_name" {
  description = "Name of the Azure Container Registry"
  type        = string
}

variable "container_registry_url" {
  description = "URL of the Azure Container Registry"
  type        = string
}

variable "key_vault_name" {
  description = "Name of the Azure Key Vault for secrets"
  type        = string
}

variable "app_insights_key" {
  description = "Application Insights instrumentation key"
  type        = string
  sensitive   = true
}

variable "app_insights_connection_string" {
  description = "Application Insights connection string"
  type        = string
  sensitive   = true
}

variable "subnet_id" {
  description = "ID of the subnet for VNet integration"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
