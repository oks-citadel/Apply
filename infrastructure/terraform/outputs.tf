# ============================================================================
# Terraform Outputs
# ============================================================================
# This file defines all outputs from the JobPilot AI Platform infrastructure.
# Outputs can be used by other Terraform configurations or consumed by CI/CD pipelines.

# ============================================================================
# Resource Group Outputs
# ============================================================================

output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_id" {
  description = "ID of the resource group"
  value       = azurerm_resource_group.main.id
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

# ============================================================================
# Networking Outputs
# ============================================================================

output "vnet_id" {
  description = "ID of the virtual network"
  value       = module.networking.vnet_id
}

output "vnet_name" {
  description = "Name of the virtual network"
  value       = module.networking.vnet_name
}

output "subnet_ids" {
  description = "Map of subnet IDs"
  value = {
    app_service       = module.networking.app_service_subnet_id
    aks               = module.networking.aks_subnet_id
    database          = module.networking.database_subnet_id
    cache             = module.networking.cache_subnet_id
    private_endpoints = module.networking.private_endpoints_subnet_id
  }
}

# ============================================================================
# Managed Identity Outputs
# ============================================================================

output "cicd_managed_identity_client_id" {
  description = "Client ID of the CI/CD managed identity"
  value       = module.managed_identity.cicd_identity_client_id
}

output "cicd_managed_identity_principal_id" {
  description = "Principal ID of the CI/CD managed identity"
  value       = module.managed_identity.cicd_identity_principal_id
}

output "workload_managed_identity_client_id" {
  description = "Client ID of the workload managed identity"
  value       = module.managed_identity.workload_identity_client_id
}

output "workload_managed_identity_principal_id" {
  description = "Principal ID of the workload managed identity"
  value       = module.managed_identity.workload_identity_principal_id
}

output "aks_kubelet_managed_identity_client_id" {
  description = "Client ID of the AKS kubelet managed identity"
  value       = var.enable_aks ? module.managed_identity.aks_kubelet_identity_client_id : null
}

output "aks_kubelet_managed_identity_principal_id" {
  description = "Principal ID of the AKS kubelet managed identity"
  value       = var.enable_aks ? module.managed_identity.aks_kubelet_identity_principal_id : null
}

# ============================================================================
# Container Registry Outputs
# ============================================================================

output "container_registry_name" {
  description = "Name of the container registry"
  value       = module.container_registry.registry_name
}

output "container_registry_login_server" {
  description = "Login server URL of the container registry"
  value       = module.container_registry.registry_login_server
}

output "container_registry_id" {
  description = "ID of the container registry"
  value       = module.container_registry.registry_id
}

# ============================================================================
# Key Vault Outputs
# ============================================================================

output "key_vault_name" {
  description = "Name of the Key Vault"
  value       = module.key_vault.vault_name
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = module.key_vault.vault_uri
}

output "key_vault_id" {
  description = "ID of the Key Vault"
  value       = module.key_vault.vault_id
}

# ============================================================================
# Application Insights Outputs
# ============================================================================

output "app_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = module.app_insights.instrumentation_key
  sensitive   = true
}

output "app_insights_connection_string" {
  description = "Application Insights connection string"
  value       = module.app_insights.connection_string
  sensitive   = true
}

output "app_insights_id" {
  description = "ID of Application Insights"
  value       = module.app_insights.app_insights_id
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics workspace"
  value       = module.app_insights.workspace_id
}

# ============================================================================
# SQL Database Outputs (conditional - only when SQL is enabled)
# ============================================================================

output "sql_server_name" {
  description = "Name of the SQL Server"
  value       = var.enable_sql_database ? module.sql_database[0].server_name : null
}

output "sql_server_fqdn" {
  description = "Fully qualified domain name of the SQL Server"
  value       = var.enable_sql_database ? module.sql_database[0].server_fqdn : null
}

output "sql_database_name" {
  description = "Name of the SQL Database"
  value       = var.enable_sql_database ? module.sql_database[0].database_name : null
}

output "sql_server_id" {
  description = "ID of the SQL Server"
  value       = var.enable_sql_database ? module.sql_database[0].server_id : null
}

output "sql_database_id" {
  description = "ID of the SQL Database"
  value       = var.enable_sql_database ? module.sql_database[0].database_id : null
}

output "sql_connection_string" {
  description = "SQL Server connection string"
  value       = var.enable_sql_database ? module.sql_database[0].connection_string : null
  sensitive   = true
}

# ============================================================================
# Redis Cache Outputs
# ============================================================================

output "redis_cache_name" {
  description = "Name of the Redis Cache"
  value       = module.redis_cache.cache_name
}

output "redis_host_name" {
  description = "Hostname of the Redis Cache"
  value       = module.redis_cache.cache_hostname
}

output "redis_port" {
  description = "Port of the Redis Cache"
  value       = module.redis_cache.port
}

output "redis_ssl_port" {
  description = "SSL port of the Redis Cache"
  value       = module.redis_cache.ssl_port
}

output "redis_cache_id" {
  description = "ID of the Redis Cache"
  value       = module.redis_cache.cache_id
}

output "redis_primary_access_key" {
  description = "Primary access key for Redis Cache"
  value       = module.redis_cache.primary_access_key
  sensitive   = true
}

output "redis_connection_string" {
  description = "Redis Cache connection string"
  value       = module.redis_cache.primary_connection_string
  sensitive   = true
}

# ============================================================================
# Service Bus Outputs
# ============================================================================

output "service_bus_namespace" {
  description = "Name of the Service Bus namespace"
  value       = module.service_bus.namespace_name
}

output "service_bus_namespace_id" {
  description = "ID of the Service Bus namespace"
  value       = module.service_bus.namespace_id
}

output "service_bus_connection_string" {
  description = "Service Bus connection string"
  value       = module.service_bus.connection_string
  sensitive   = true
}

output "service_bus_queues" {
  description = "Map of Service Bus queue names to IDs"
  value       = module.service_bus.queues
}

output "service_bus_topics" {
  description = "Map of Service Bus topic names to IDs"
  value       = module.service_bus.topics
}

# ============================================================================
# App Service Plan Outputs
# ============================================================================

output "app_service_plan_id" {
  description = "ID of the App Service Plan"
  value       = module.app_service_plan.plan_id
}

output "app_service_plan_name" {
  description = "Name of the App Service Plan"
  value       = module.app_service_plan.plan_name
}

# ============================================================================
# App Services Outputs
# ============================================================================

output "web_app_url" {
  description = "URL of the web application"
  value       = module.app_services.web_app_url
}

output "auth_service_url" {
  description = "URL of the authentication service"
  value       = module.app_services.auth_service_url
}

output "ai_service_url" {
  description = "URL of the AI service"
  value       = module.app_services.ai_service_url
}

output "app_service_ids" {
  description = "Map of all App Service IDs"
  value       = module.app_services.app_service_ids
}

output "all_service_urls" {
  description = "Map of all service URLs"
  value       = module.app_services.all_service_urls
}

# ============================================================================
# AKS Outputs (Conditional)
# ============================================================================

output "aks_cluster_enabled" {
  description = "Whether AKS cluster is enabled"
  value       = var.enable_aks
}

output "aks_cluster_name" {
  description = "Name of the AKS cluster"
  value       = var.enable_aks ? module.aks[0].cluster_name : null
}

output "aks_cluster_fqdn" {
  description = "FQDN of the AKS cluster"
  value       = var.enable_aks ? module.aks[0].cluster_fqdn : null
}

output "aks_cluster_id" {
  description = "ID of the AKS cluster"
  value       = var.enable_aks ? module.aks[0].cluster_id : null
}

output "aks_oidc_issuer_url" {
  description = "OIDC issuer URL for the AKS cluster"
  value       = var.enable_aks ? module.aks[0].oidc_issuer_url : null
}

output "aks_node_resource_group" {
  description = "Resource group containing AKS node resources"
  value       = var.enable_aks ? module.aks[0].node_resource_group : null
}

output "aks_kube_config" {
  description = "Kubernetes configuration for the AKS cluster"
  value       = var.enable_aks ? module.aks[0].kube_config : null
  sensitive   = true
}

# ============================================================================
# Private Endpoints Outputs (Conditional)
# ============================================================================

output "private_endpoints_enabled" {
  description = "Whether private endpoints are enabled"
  value       = var.enable_private_endpoints
}

output "key_vault_private_endpoint_ip" {
  description = "Private IP address of the Key Vault private endpoint"
  value       = var.enable_private_endpoints ? module.private_endpoints[0].key_vault_private_ip : null
}

output "sql_private_endpoint_ip" {
  description = "Private IP address of the SQL Server private endpoint"
  value       = var.enable_private_endpoints ? module.private_endpoints[0].sql_server_private_ip : null
}

output "redis_private_endpoint_ip" {
  description = "Private IP address of the Redis Cache private endpoint"
  value       = var.enable_private_endpoints ? module.private_endpoints[0].redis_private_ip : null
}

# ============================================================================
# Application Gateway Outputs (Conditional)
# ============================================================================

output "application_gateway_enabled" {
  description = "Whether Application Gateway is enabled"
  value       = var.enable_application_gateway
}

output "application_gateway_id" {
  description = "ID of the Application Gateway"
  value       = var.enable_application_gateway ? module.application_gateway[0].gateway_id : null
}

output "application_gateway_public_ip" {
  description = "Public IP address of the Application Gateway"
  value       = var.enable_application_gateway ? module.application_gateway[0].public_ip_address : null
}

output "application_gateway_fqdn" {
  description = "FQDN of the Application Gateway"
  value       = var.enable_application_gateway ? module.application_gateway[0].fqdn : null
}

# ============================================================================
# Front Door Outputs (Conditional)
# ============================================================================

output "front_door_enabled" {
  description = "Whether Azure Front Door is enabled"
  value       = var.enable_front_door
}

output "front_door_id" {
  description = "ID of the Front Door"
  value       = var.enable_front_door ? module.front_door[0].front_door_id : null
}

output "front_door_url" {
  description = "URL of the Front Door"
  value       = var.enable_front_door ? module.front_door[0].front_door_url : null
}

output "front_door_endpoint_host_name" {
  description = "Endpoint hostname of the Front Door"
  value       = var.enable_front_door ? module.front_door[0].endpoint_hostname : null
}

# ============================================================================
# Monitoring Outputs
# ============================================================================

output "action_group_id" {
  description = "ID of the monitoring action group"
  value       = module.monitoring.action_group_id
}

output "monitoring_dashboard_id" {
  description = "ID of the Azure Dashboard"
  value       = module.dashboards.dashboard_id
}

output "monitoring_dashboard_name" {
  description = "Name of the Azure Dashboard"
  value       = module.dashboards.dashboard_name
}

# ============================================================================
# Summary Output
# ============================================================================

output "deployment_summary" {
  description = "Summary of deployed infrastructure"
  value = {
    environment       = var.environment
    location          = var.location
    resource_group    = azurerm_resource_group.main.name
    web_app_url       = module.app_services.web_app_url
    auth_service_url  = module.app_services.auth_service_url
    ai_service_url    = module.app_services.ai_service_url
    aks_enabled       = var.enable_aks
    private_endpoints = var.enable_private_endpoints
    waf_enabled       = var.enable_application_gateway || var.enable_front_door
    waf_type          = var.enable_application_gateway ? "Application Gateway" : (var.enable_front_door ? "Front Door" : "None")
  }
}
