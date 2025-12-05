###########################################
# Managed Identity Module - Outputs
# JobPilot AI Platform
###########################################

# CI/CD Identity Outputs
output "cicd_identity_id" {
  description = "The full resource ID of the CI/CD managed identity"
  value       = azurerm_user_assigned_identity.cicd.id
}

output "cicd_identity_client_id" {
  description = "The client ID (application ID) of the CI/CD managed identity"
  value       = azurerm_user_assigned_identity.cicd.client_id
}

output "cicd_identity_principal_id" {
  description = "The principal ID (object ID) of the CI/CD managed identity"
  value       = azurerm_user_assigned_identity.cicd.principal_id
}

output "cicd_identity_name" {
  description = "The name of the CI/CD managed identity"
  value       = azurerm_user_assigned_identity.cicd.name
}

# Workload Identity Outputs
output "workload_identity_id" {
  description = "The full resource ID of the workload managed identity"
  value       = azurerm_user_assigned_identity.workload.id
}

output "workload_identity_client_id" {
  description = "The client ID (application ID) of the workload managed identity"
  value       = azurerm_user_assigned_identity.workload.client_id
}

output "workload_identity_principal_id" {
  description = "The principal ID (object ID) of the workload managed identity"
  value       = azurerm_user_assigned_identity.workload.principal_id
}

output "workload_identity_name" {
  description = "The name of the workload managed identity"
  value       = azurerm_user_assigned_identity.workload.name
}

# AKS Kubelet Identity Outputs
output "aks_kubelet_identity_id" {
  description = "The full resource ID of the AKS kubelet managed identity"
  value       = azurerm_user_assigned_identity.aks_kubelet.id
}

output "aks_kubelet_identity_client_id" {
  description = "The client ID (application ID) of the AKS kubelet managed identity"
  value       = azurerm_user_assigned_identity.aks_kubelet.client_id
}

output "aks_kubelet_identity_principal_id" {
  description = "The principal ID (object ID) of the AKS kubelet managed identity"
  value       = azurerm_user_assigned_identity.aks_kubelet.principal_id
}

output "aks_kubelet_identity_name" {
  description = "The name of the AKS kubelet managed identity"
  value       = azurerm_user_assigned_identity.aks_kubelet.name
}
