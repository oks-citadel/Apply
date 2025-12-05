# App Service Plan Module Outputs

output "plan_id" {
  description = "ID of the App Service Plan"
  value       = azurerm_service_plan.main.id
}

output "plan_name" {
  description = "Name of the App Service Plan"
  value       = azurerm_service_plan.main.name
}
