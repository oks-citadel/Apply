# ApplyforUs Azure Infrastructure
# Main Terraform configuration file

# Data sources
data "azurerm_client_config" "current" {}

# Resource Group
module "resource_group" {
  source = "./modules/resource-group"

  environment     = var.environment
  location        = var.location
  resource_prefix = local.resource_prefix
  tags            = local.common_tags
}

# Networking
module "networking" {
  source = "./modules/networking"

  environment                             = var.environment
  location                                = var.location
  resource_group_name                     = module.resource_group.resource_group_name
  resource_prefix                         = local.resource_prefix
  vnet_address_space                      = var.vnet_address_space
  subnet_aks_address_prefix               = var.subnet_aks_address_prefix
  subnet_app_gateway_address_prefix       = var.subnet_app_gateway_address_prefix
  subnet_private_endpoints_address_prefix = var.subnet_private_endpoints_address_prefix
  subnet_management_address_prefix        = var.subnet_management_address_prefix
  tags                                    = local.common_tags

  depends_on = [module.resource_group]
}

# Azure Container Registry
module "acr" {
  source = "./modules/acr"

  environment                = var.environment
  location                   = var.location
  location_secondary         = var.location_secondary
  resource_group_name        = module.resource_group.resource_group_name
  resource_prefix            = local.resource_prefix
  sku                        = local.acr_config[var.environment].sku
  enable_geo_replication     = local.acr_config[var.environment].enable_geo_replication
  admin_enabled              = local.acr_config[var.environment].admin_enabled
  private_endpoint_subnet_id = module.networking.private_endpoints_subnet_id
  enable_private_endpoint    = var.enable_private_endpoints
  tags                       = local.common_tags

  depends_on = [module.resource_group, module.networking]
}

# Key Vault
module "keyvault" {
  source = "./modules/keyvault"

  environment                     = var.environment
  location                        = var.location
  resource_group_name             = module.resource_group.resource_group_name
  resource_prefix                 = local.resource_prefix
  sku_name                        = var.key_vault_sku
  enable_purge_protection         = local.is_production ? true : var.key_vault_enable_purge_protection
  soft_delete_retention_days      = var.key_vault_soft_delete_retention_days
  tenant_id                       = data.azurerm_client_config.current.tenant_id
  private_endpoint_subnet_id      = module.networking.private_endpoints_subnet_id
  enable_private_endpoint         = var.enable_private_endpoints
  allowed_ip_ranges               = var.allowed_ip_ranges
  tags                            = local.common_tags

  depends_on = [module.resource_group, module.networking]
}

# Monitoring (Log Analytics & Application Insights)
module "monitoring" {
  source = "./modules/monitoring"

  environment         = var.environment
  location            = var.location
  resource_group_name = module.resource_group.resource_group_name
  resource_prefix     = local.resource_prefix
  retention_days      = var.log_analytics_retention_days
  tags                = local.common_tags

  depends_on = [module.resource_group]
}

# Azure Kubernetes Service
module "aks" {
  source = "./modules/aks"

  environment                    = var.environment
  location                       = var.location
  resource_group_name            = module.resource_group.resource_group_name
  resource_prefix                = local.resource_prefix
  kubernetes_version             = var.aks_kubernetes_version
  vnet_subnet_id                 = module.networking.aks_subnet_id
  system_node_count              = local.aks_config[var.environment].node_count
  system_node_vm_size            = local.aks_config[var.environment].vm_size
  user_node_count                = local.aks_config[var.environment].node_count
  user_node_vm_size              = local.aks_config[var.environment].vm_size
  enable_auto_scaling            = var.aks_enable_auto_scaling
  min_count                      = local.aks_config[var.environment].min_count
  max_count                      = local.aks_config[var.environment].max_count
  log_analytics_workspace_id     = module.monitoring.log_analytics_workspace_id
  acr_id                         = module.acr.acr_id
  enable_zones                   = local.aks_config[var.environment].enable_zones
  network_policy                 = local.aks_config[var.environment].network_policy
  tags                           = local.common_tags

  depends_on = [
    module.resource_group,
    module.networking,
    module.monitoring,
    module.acr
  ]
}

# Application Gateway
module "app_gateway" {
  source = "./modules/app-gateway"

  environment         = var.environment
  location            = var.location
  resource_group_name = module.resource_group.resource_group_name
  resource_prefix     = local.resource_prefix
  sku_name            = local.app_gateway_config[var.environment].sku_name
  sku_tier            = local.app_gateway_config[var.environment].sku_tier
  capacity            = local.app_gateway_config[var.environment].capacity
  subnet_id           = module.networking.app_gateway_subnet_id
  enable_auto_scaling = var.app_gateway_enable_auto_scaling
  min_capacity        = local.app_gateway_config[var.environment].min_capacity
  max_capacity        = local.app_gateway_config[var.environment].max_capacity
  backend_fqdn        = module.aks.cluster_fqdn
  tags                = local.common_tags

  depends_on = [
    module.resource_group,
    module.networking,
    module.aks
  ]
}

# DNS Zone
module "dns_zone" {
  source = "./modules/dns-zone"

  environment                 = var.environment
  resource_group_name         = module.resource_group.resource_group_name
  dns_zone_name               = var.dns_zone_name
  app_gateway_public_ip       = module.app_gateway.public_ip_address
  tags                        = local.common_tags

  depends_on = [
    module.resource_group,
    module.app_gateway
  ]
}

# Storage Account for backups and logs
module "storage" {
  source = "./modules/storage"

  environment                = var.environment
  location                   = var.location
  resource_group_name        = module.resource_group.resource_group_name
  resource_prefix            = local.resource_prefix
  account_tier               = local.storage_config[var.environment].tier
  replication_type           = local.storage_config[var.environment].replication_type
  backup_retention_days      = local.storage_config[var.environment].backup_retention
  private_endpoint_subnet_id = module.networking.private_endpoints_subnet_id
  enable_private_endpoint    = var.enable_private_endpoints
  allowed_ip_ranges          = var.allowed_ip_ranges
  tags                       = local.common_tags

  depends_on = [module.resource_group, module.networking]
}
