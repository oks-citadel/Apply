# SQL Database Connection String
resource "azurerm_key_vault_secret" "sql_connection_string" {
  name         = "sql-connection-string"
  value        = var.sql_connection_string
  key_vault_id = var.key_vault_id

  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Database"
  }
}

# Redis Cache Connection String
resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = var.redis_connection_string
  key_vault_id = var.key_vault_id

  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Cache"
  }
}

# Service Bus Connection String
resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "servicebus-connection-string"
  value        = var.servicebus_connection_string
  key_vault_id = var.key_vault_id

  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Messaging"
  }
}

# Application Insights Instrumentation Key
resource "azurerm_key_vault_secret" "appinsights_instrumentation_key" {
  name         = "appinsights-instrumentation-key"
  value        = var.app_insights_key
  key_vault_id = var.key_vault_id

  content_type = "instrumentation-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Monitoring"
  }
}

# Application Insights Connection String
resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "appinsights-connection-string"
  value        = var.app_insights_connection_string
  key_vault_id = var.key_vault_id

  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Monitoring"
  }
}
