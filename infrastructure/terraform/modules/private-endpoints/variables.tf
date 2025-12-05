variable "resource_group_name" {
  description = "Name of the resource group where private endpoints will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region for private endpoints"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
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

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vnet_id" {
  description = "Virtual Network ID for private DNS zone links"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID where private endpoints will be deployed"
  type        = string
}

# DNS Configuration
variable "create_private_dns_zones" {
  description = "Create private DNS zones (set to false if using existing zones)"
  type        = bool
  default     = true
}

# Key Vault Configuration
variable "key_vault_id" {
  description = "Key Vault resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_key_vault_private_endpoint" {
  description = "Enable private endpoint for Key Vault"
  type        = bool
  default     = true
}

# SQL Server Configuration
variable "sql_server_id" {
  description = "SQL Server resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_sql_private_endpoint" {
  description = "Enable private endpoint for SQL Server"
  type        = bool
  default     = true
}

# Redis Cache Configuration
variable "redis_cache_id" {
  description = "Redis Cache resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_redis_private_endpoint" {
  description = "Enable private endpoint for Redis Cache"
  type        = bool
  default     = true
}

# Storage Account Configuration
variable "storage_account_id" {
  description = "Storage Account resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_storage_private_endpoint" {
  description = "Enable private endpoint for Storage Account"
  type        = bool
  default     = false
}

variable "storage_private_endpoint_subresources" {
  description = "Storage subresources for private endpoints (blob, file, queue, table)"
  type        = list(string)
  default     = ["blob"]
  validation {
    condition = alltrue([
      for subresource in var.storage_private_endpoint_subresources :
      contains(["blob", "file", "queue", "table", "dfs"], subresource)
    ])
    error_message = "Storage subresources must be one of: blob, file, queue, table, dfs."
  }
}

# Cosmos DB Configuration
variable "cosmos_db_id" {
  description = "Cosmos DB resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_cosmos_db_private_endpoint" {
  description = "Enable private endpoint for Cosmos DB"
  type        = bool
  default     = false
}

variable "cosmos_db_subresource" {
  description = "Cosmos DB subresource type (Sql, MongoDB, Cassandra, Gremlin, Table)"
  type        = string
  default     = "Sql"
  validation {
    condition     = contains(["Sql", "MongoDB", "Cassandra", "Gremlin", "Table"], var.cosmos_db_subresource)
    error_message = "Cosmos DB subresource must be one of: Sql, MongoDB, Cassandra, Gremlin, Table."
  }
}

# Service Bus Configuration
variable "service_bus_id" {
  description = "Service Bus namespace resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_service_bus_private_endpoint" {
  description = "Enable private endpoint for Service Bus"
  type        = bool
  default     = false
}

# Event Hub Configuration
variable "event_hub_id" {
  description = "Event Hub namespace resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_event_hub_private_endpoint" {
  description = "Enable private endpoint for Event Hub"
  type        = bool
  default     = false
}

# Container Registry Configuration
variable "container_registry_id" {
  description = "Container Registry resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_container_registry_private_endpoint" {
  description = "Enable private endpoint for Container Registry"
  type        = bool
  default     = false
}

# App Service Configuration
variable "app_service_id" {
  description = "App Service resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_app_service_private_endpoint" {
  description = "Enable private endpoint for App Service"
  type        = bool
  default     = false
}

# Cognitive Services Configuration
variable "cognitive_services_id" {
  description = "Cognitive Services resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_cognitive_services_private_endpoint" {
  description = "Enable private endpoint for Cognitive Services"
  type        = bool
  default     = false
}

# OpenAI Configuration
variable "openai_id" {
  description = "OpenAI resource ID for private endpoint"
  type        = string
  default     = null
}

variable "enable_openai_private_endpoint" {
  description = "Enable private endpoint for OpenAI"
  type        = bool
  default     = false
}

# Additional Custom Private Endpoints
variable "custom_private_endpoints" {
  description = "Map of custom private endpoint configurations"
  type = map(object({
    resource_id       = string
    subresource_names = list(string)
    dns_zone_name     = optional(string)
  }))
  default = {}
}
