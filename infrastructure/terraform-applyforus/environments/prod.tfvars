# Production Environment Configuration
# Premium SKUs, 3+ nodes, full HA, geo-replication

environment = "prod"
location    = "eastus"
location_secondary = "westus2"

# Tags
tags = {
  Environment = "Production"
  CostCenter  = "Operations"
  Owner       = "Platform Team"
  Compliance  = "Required"
}

# Networking
vnet_address_space                      = ["10.0.0.0/16"]
subnet_aks_address_prefix               = "10.0.1.0/23"
subnet_app_gateway_address_prefix       = "10.0.3.0/24"
subnet_private_endpoints_address_prefix = "10.0.4.0/24"
subnet_management_address_prefix        = "10.0.5.0/24"

# AKS Configuration - Production with zone redundancy
aks_kubernetes_version  = "1.28.3"
aks_system_node_count   = 3
aks_system_node_vm_size = "Standard_D4s_v3"
aks_user_node_count     = 3
aks_user_node_vm_size   = "Standard_D8s_v3"
aks_enable_auto_scaling = true
aks_min_count           = 3
aks_max_count           = 10

# ACR Configuration - Premium with geo-replication
acr_sku                    = "Premium"
acr_enable_geo_replication = true

# Key Vault Configuration - With purge protection
key_vault_sku                       = "standard"
key_vault_enable_purge_protection   = true
key_vault_soft_delete_retention_days = 90

# Application Gateway - WAF v2 with auto-scaling
app_gateway_sku_name            = "WAF_v2"
app_gateway_sku_tier            = "WAF_v2"
app_gateway_capacity            = 2
app_gateway_enable_auto_scaling = true
app_gateway_min_capacity        = 2
app_gateway_max_capacity        = 10

# DNS Configuration - Production domain
dns_zone_name = "applyforus.com"

# Monitoring Configuration - Extended retention
log_analytics_retention_days = 90

# Storage Configuration - Geo-redundant
storage_account_tier            = "Standard"
storage_account_replication_type = "GZRS"

# Security Configuration
allowed_ip_ranges       = [] # Add your office/VPN IPs here
enable_private_endpoints = true

# Cost Management
enable_cost_alerts     = true
monthly_budget_amount  = 3000
