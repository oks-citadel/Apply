output "cluster_id" {
  description = "AKS cluster resource ID"
  value       = azurerm_kubernetes_cluster.main.id
}

output "cluster_name" {
  description = "AKS cluster name"
  value       = azurerm_kubernetes_cluster.main.name
}

output "cluster_fqdn" {
  description = "AKS cluster FQDN"
  value       = azurerm_kubernetes_cluster.main.fqdn
}

output "cluster_private_fqdn" {
  description = "AKS cluster private FQDN (for private clusters)"
  value       = azurerm_kubernetes_cluster.main.private_fqdn
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for workload identity"
  value       = azurerm_kubernetes_cluster.main.oidc_issuer_url
}

output "node_resource_group" {
  description = "Resource group for AKS node resources"
  value       = azurerm_kubernetes_cluster.main.node_resource_group
}

output "kube_config" {
  description = "Kubernetes configuration file content"
  value       = azurerm_kubernetes_cluster.main.kube_config_raw
  sensitive   = true
}

output "kube_admin_config" {
  description = "Kubernetes admin configuration file content"
  value       = azurerm_kubernetes_cluster.main.kube_admin_config_raw
  sensitive   = true
}

output "kubelet_identity" {
  description = "Kubelet managed identity configuration"
  value = {
    client_id                 = azurerm_kubernetes_cluster.main.kubelet_identity[0].client_id
    object_id                 = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
    user_assigned_identity_id = azurerm_kubernetes_cluster.main.kubelet_identity[0].user_assigned_identity_id
  }
}

output "cluster_identity" {
  description = "AKS cluster managed identity"
  value = {
    type         = azurerm_kubernetes_cluster.main.identity[0].type
    principal_id = azurerm_kubernetes_cluster.main.identity[0].principal_id
    tenant_id    = azurerm_kubernetes_cluster.main.identity[0].tenant_id
  }
}

output "system_node_pool_id" {
  description = "System node pool ID"
  value       = azurerm_kubernetes_cluster.main.default_node_pool[0].id
}

output "user_node_pool_id" {
  description = "User node pool ID"
  value       = var.enable_user_node_pool ? azurerm_kubernetes_cluster_node_pool.user[0].id : null
}

output "gpu_node_pool_id" {
  description = "GPU node pool ID"
  value       = var.enable_gpu_node_pool ? azurerm_kubernetes_cluster_node_pool.gpu[0].id : null
}

output "key_vault_secrets_provider_identity" {
  description = "Key Vault secrets provider identity details"
  value = var.enable_secret_store_csi ? {
    client_id = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].client_id
    object_id = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].object_id
  } : null
}

output "portal_fqdn" {
  description = "Portal FQDN for AKS cluster"
  value       = azurerm_kubernetes_cluster.main.portal_fqdn
}

output "http_application_routing_zone_name" {
  description = "HTTP application routing zone name (deprecated, should be null)"
  value       = azurerm_kubernetes_cluster.main.http_application_routing_zone_name
}

output "kubernetes_version" {
  description = "Current Kubernetes version"
  value       = azurerm_kubernetes_cluster.main.kubernetes_version
}

output "current_kubernetes_version" {
  description = "Current Kubernetes version running on the cluster"
  value       = azurerm_kubernetes_cluster.main.current_kubernetes_version
}
