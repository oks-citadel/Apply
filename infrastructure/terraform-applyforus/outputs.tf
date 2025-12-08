# Resource Group Outputs
output "resource_group_name" {
  description = "Name of the resource group"
  value       = module.resource_group.resource_group_name
}

output "resource_group_id" {
  description = "ID of the resource group"
  value       = module.resource_group.resource_group_id
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = module.resource_group.location
}

# Networking Outputs
output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.networking.vnet_id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.networking.vnet_name
}

output "aks_subnet_id" {
  description = "ID of the AKS subnet"
  value       = module.networking.aks_subnet_id
}

output "app_gateway_subnet_id" {
  description = "ID of the Application Gateway subnet"
  value       = module.networking.app_gateway_subnet_id
}

# AKS Outputs
output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = module.aks.cluster_name
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = module.aks.cluster_id
}

output "aks_cluster_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = module.aks.cluster_fqdn
}

output "aks_kube_config" {
  description = "Kubeconfig for the AKS cluster"
  value       = module.aks.kube_config
  sensitive   = true
}

output "aks_identity_principal_id" {
  description = "Principal ID of the AKS cluster identity"
  value       = module.aks.identity_principal_id
}

output "aks_oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = module.aks.oidc_issuer_url
}

# ACR Outputs
output "acr_login_server" {
  description = "Login server URL for the Azure Container Registry"
  value       = module.acr.acr_login_server
}

output "acr_name" {
  description = "Name of the Azure Container Registry"
  value       = module.acr.acr_name
}

output "acr_id" {
  description = "ID of the Azure Container Registry"
  value       = module.acr.acr_id
}

output "acr_admin_username" {
  description = "Admin username for ACR (if admin is enabled)"
  value       = module.acr.acr_admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "Admin password for ACR (if admin is enabled)"
  value       = module.acr.acr_admin_password
  sensitive   = true
}

# Key Vault Outputs
output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = module.keyvault.key_vault_id
}

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.keyvault.key_vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.keyvault.key_vault_uri
}

# Application Gateway Outputs
output "app_gateway_id" {
  description = "ID of the Application Gateway"
  value       = module.app_gateway.app_gateway_id
}

output "app_gateway_public_ip" {
  description = "Public IP address of the Application Gateway"
  value       = module.app_gateway.public_ip_address
}

output "app_gateway_public_ip_fqdn" {
  description = "FQDN of the Application Gateway public IP"
  value       = module.app_gateway.public_ip_fqdn
}

# DNS Outputs
output "dns_zone_id" {
  description = "ID of the DNS zone"
  value       = module.dns_zone.dns_zone_id
}

output "dns_zone_name" {
  description = "Name of the DNS zone"
  value       = module.dns_zone.dns_zone_name
}

output "dns_zone_nameservers" {
  description = "Nameservers for the DNS zone (configure these in GoDaddy)"
  value       = module.dns_zone.dns_zone_nameservers
}

# Monitoring Outputs
output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_id
}

output "log_analytics_workspace_name" {
  description = "Name of the Log Analytics workspace"
  value       = module.monitoring.log_analytics_workspace_name
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = module.monitoring.application_insights_instrumentation_key
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Connection string for Application Insights"
  value       = module.monitoring.application_insights_connection_string
  sensitive   = true
}

# Storage Outputs
output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_account_id" {
  description = "ID of the storage account"
  value       = module.storage.storage_account_id
}

output "storage_primary_connection_string" {
  description = "Primary connection string for the storage account"
  value       = module.storage.storage_primary_connection_string
  sensitive   = true
}

# Summary Output
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment          = var.environment
    location             = var.location
    resource_group       = module.resource_group.resource_group_name
    aks_cluster          = module.aks.cluster_name
    acr_login_server     = module.acr.acr_login_server
    app_gateway_ip       = module.app_gateway.public_ip_address
    dns_zone             = module.dns_zone.dns_zone_name
    key_vault            = module.keyvault.key_vault_name
  }
}

# Next Steps Output
output "next_steps" {
  description = "Next steps after infrastructure deployment"
  value = <<-EOT

  ========================================
  ApplyforUs Infrastructure Deployed Successfully!
  ========================================

  Next Steps:

  1. Configure DNS in GoDaddy:
     - Update nameservers to: ${join(", ", module.dns_zone.dns_zone_nameservers)}
     - See: azure_nameservers.md for detailed instructions

  2. Get AKS credentials:
     $ az aks get-credentials --resource-group ${module.resource_group.resource_group_name} --name ${module.aks.cluster_name}

  3. Login to ACR:
     $ az acr login --name ${module.acr.acr_name}

  4. Build and push container images:
     $ docker build -t ${module.acr.acr_login_server}/web-app:latest ./apps/web
     $ docker push ${module.acr.acr_login_server}/web-app:latest

  5. Deploy Kubernetes manifests:
     $ kubectl apply -f infrastructure/kubernetes/

  6. Access Application Insights:
     - Navigate to: Azure Portal > ${module.monitoring.application_insights_name}

  7. Configure SSL Certificate:
     - See: ssl_configuration.md for cert-manager setup

  ========================================
  Important Resources:
  ========================================

  Application Gateway IP: ${module.app_gateway.public_ip_address}
  DNS Zone: ${module.dns_zone.dns_zone_name}
  AKS Cluster: ${module.aks.cluster_name}
  Container Registry: ${module.acr.acr_login_server}
  Key Vault: ${module.keyvault.key_vault_name}

  EOT
}
