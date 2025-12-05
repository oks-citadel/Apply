variable "key_vault_id" {
  description = "ID of the Key Vault where secrets will be stored"
  type        = string
}

variable "sql_connection_string" {
  description = "SQL Database connection string"
  type        = string
  sensitive   = true
}

variable "redis_connection_string" {
  description = "Redis Cache connection string"
  type        = string
  sensitive   = true
}

variable "servicebus_connection_string" {
  description = "Service Bus connection string"
  type        = string
  sensitive   = true
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
