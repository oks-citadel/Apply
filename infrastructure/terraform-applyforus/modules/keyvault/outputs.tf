output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = azurerm_key_vault.main.id
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = azurerm_key_vault.main.name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "db_admin_password_secret_id" {
  description = "ID of the database admin password secret"
  value       = azurerm_key_vault_secret.db_admin_password.id
}

output "db_admin_password_value" {
  description = "Value of the database admin password"
  value       = azurerm_key_vault_secret.db_admin_password.value
  sensitive   = true
}
