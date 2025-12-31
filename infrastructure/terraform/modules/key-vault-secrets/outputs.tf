output "secret_ids" {
  description = "Map of secret names to their IDs"
  value = {
    sql_connection_string           = length(azurerm_key_vault_secret.sql_connection_string) > 0 ? azurerm_key_vault_secret.sql_connection_string[0].id : null
    redis_connection_string         = azurerm_key_vault_secret.redis_connection_string.id
    redis_password                  = azurerm_key_vault_secret.redis_password.id
    servicebus_connection_string    = azurerm_key_vault_secret.servicebus_connection_string.id
    jwt_secret                      = azurerm_key_vault_secret.jwt_secret.id
    jwt_refresh_secret              = azurerm_key_vault_secret.jwt_refresh_secret.id
    session_secret                  = azurerm_key_vault_secret.session_secret.id
    encryption_key                  = azurerm_key_vault_secret.encryption_key.id
    appinsights_instrumentation_key = azurerm_key_vault_secret.appinsights_instrumentation_key.id
    appinsights_connection_string   = azurerm_key_vault_secret.appinsights_connection_string.id
  }
}
