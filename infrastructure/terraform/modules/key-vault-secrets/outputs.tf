output "secret_ids" {
  description = "Map of secret names to their IDs"
  value = {
    sql_connection_string           = azurerm_key_vault_secret.sql_connection_string.id
    redis_connection_string         = azurerm_key_vault_secret.redis_connection_string.id
    servicebus_connection_string    = azurerm_key_vault_secret.servicebus_connection_string.id
    appinsights_instrumentation_key = azurerm_key_vault_secret.appinsights_instrumentation_key.id
    appinsights_connection_string   = azurerm_key_vault_secret.appinsights_connection_string.id
  }
}
