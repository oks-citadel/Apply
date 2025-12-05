output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = azurerm_virtual_network.main.name
}

output "app_service_subnet_id" {
  description = "ID of the App Service subnet"
  value       = azurerm_subnet.app_services.id
}

output "database_subnet_id" {
  description = "ID of the database subnet"
  value       = azurerm_subnet.database.id
}

output "cache_subnet_id" {
  description = "ID of the cache subnet"
  value       = azurerm_subnet.cache.id
}

output "private_endpoints_subnet_id" {
  description = "ID of the private endpoints subnet"
  value       = azurerm_subnet.private_endpoints.id
}

output "aks_subnet_id" {
  description = "ID of the AKS subnet (empty if AKS is not enabled)"
  value       = var.enable_aks ? azurerm_subnet.aks[0].id : null
}
