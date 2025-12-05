###########################################
# Container Registry Module - Outputs
# JobPilot AI Platform
###########################################

output "registry_id" {
  description = "The full resource ID of the Azure Container Registry"
  value       = azurerm_container_registry.acr.id
}

output "registry_name" {
  description = "The name of the Azure Container Registry"
  value       = azurerm_container_registry.acr.name
}

output "registry_login_server" {
  description = "The login server URL for the Azure Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "registry_sku" {
  description = "The SKU tier of the Azure Container Registry"
  value       = azurerm_container_registry.acr.sku
}

output "registry_admin_enabled" {
  description = "Indicates whether the admin user is enabled"
  value       = azurerm_container_registry.acr.admin_enabled
}

output "registry_identity_principal_id" {
  description = "The principal ID of the system-assigned managed identity"
  value       = azurerm_container_registry.acr.identity[0].principal_id
}

output "registry_identity_tenant_id" {
  description = "The tenant ID of the system-assigned managed identity"
  value       = azurerm_container_registry.acr.identity[0].tenant_id
}

output "cicd_role_assignment_id" {
  description = "The ID of the CI/CD AcrPush role assignment"
  value       = azurerm_role_assignment.cicd_acr_push.id
}

output "aks_role_assignment_id" {
  description = "The ID of the AKS AcrPull role assignment"
  value       = azurerm_role_assignment.aks_acr_pull.id
}

output "workload_role_assignment_id" {
  description = "The ID of the workload AcrPull role assignment"
  value       = azurerm_role_assignment.workload_acr_pull.id
}
