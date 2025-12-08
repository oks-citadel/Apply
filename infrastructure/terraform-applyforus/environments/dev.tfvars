# Development Environment Configuration
# Small SKUs, single node, no HA, minimal costs

environment = "dev"
location    = "eastus"
location_secondary = "westus2"

# Tags
tags = {
  Environment = "Development"
  CostCenter  = "Engineering"
  Owner       = "DevOps Team"
}

# Networking
vnet_address_space                      = ["10.0.0.0/16"]
subnet_aks_address_prefix               = "10.0.1.0/23"
subnet_app_gateway_address_prefix       = "10.0.3.0/24"
subnet_private_endpoints_address_prefix = "10.0.4.0/24"
subnet_management_address_prefix        = "10.0.5.0/24"

# AKS Configuration - Small for development
aks_kubernetes_version  = "1.28.3"
aks_system_node_count   = 1
aks_system_node_vm_size = "Standard_D2s_v3"
aks_user_node_count     = 1
aks_user_node_vm_size   = "Standard_D2s_v3"
aks_enable_auto_scaling = false
aks_min_count           = 1
aks_max_count           = 3

# ACR Configuration - Basic SKU
acr_sku                    = "Basic"
acr_enable_geo_replication = false

# Key Vault Configuration
key_vault_sku                       = "standard"
key_vault_enable_purge_protection   = false
key_vault_soft_delete_retention_days = 7

# Application Gateway - Standard v2 (no WAF)
app_gateway_sku_name            = "Standard_v2"
app_gateway_sku_tier            = "Standard_v2"
app_gateway_capacity            = 1
app_gateway_enable_auto_scaling = false
app_gateway_min_capacity        = 1
app_gateway_max_capacity        = 2

# DNS Configuration
dns_zone_name = "dev.applyforus.com"

# Monitoring Configuration
log_analytics_retention_days = 30

# Storage Configuration
storage_account_tier            = "Standard"
storage_account_replication_type = "LRS"

# Security Configuration
allowed_ip_ranges       = [] # Add your IPs here
enable_private_endpoints = false

# Cost Management
enable_cost_alerts     = true
monthly_budget_amount  = 200
