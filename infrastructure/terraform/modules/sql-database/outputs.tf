# SQL Database Module Outputs

output "server_id" {
  description = "ID of the SQL Server"
  value       = azurerm_mssql_server.main.id
}

output "server_fqdn" {
  description = "Fully qualified domain name of the SQL Server"
  value       = azurerm_mssql_server.main.fully_qualified_domain_name
}

output "server_name" {
  description = "Name of the SQL Server"
  value       = azurerm_mssql_server.main.name
}

output "database_id" {
  description = "ID of the SQL Database"
  value       = azurerm_mssql_database.main.id
}

output "database_name" {
  description = "Name of the SQL Database"
  value       = azurerm_mssql_database.main.name
}

output "connection_string" {
  description = "SQL Database connection string"
  value       = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;User ID=${var.sql_admin_username};Password=${var.sql_admin_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  sensitive   = true
}

output "connection_string_template" {
  description = "SQL Database connection string template (without credentials)"
  value       = "Server=tcp:${azurerm_mssql_server.main.fully_qualified_domain_name},1433;Initial Catalog=${azurerm_mssql_database.main.name};Persist Security Info=False;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}

output "server_identity_principal_id" {
  description = "Principal ID of the server's managed identity"
  value       = azurerm_mssql_server.main.identity[0].principal_id
}

output "server_identity_tenant_id" {
  description = "Tenant ID of the server's managed identity"
  value       = azurerm_mssql_server.main.identity[0].tenant_id
}

output "private_endpoint_id" {
  description = "ID of the private endpoint (if enabled)"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.sql[0].id : null
}

output "private_endpoint_ip_address" {
  description = "Private IP address of the SQL Server (if private endpoint enabled)"
  value       = var.enable_private_endpoint ? azurerm_private_endpoint.sql[0].private_service_connection[0].private_ip_address : null
}
