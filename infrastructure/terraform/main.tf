# ============================================================================
# Main Terraform Configuration - JobPilot AI Platform
# ============================================================================
# This is the main orchestration file that calls all infrastructure modules
# to deploy the complete JobPilot AI Platform on Azure.
#
# Architecture Overview:
# - Resource Group for logical organization
# - Virtual Network with multiple subnets for service isolation
# - Managed Identities for secure service-to-service authentication
# - Container Registry for Docker images
# - Key Vault for secrets management
# - Application Insights for monitoring and telemetry
# - SQL Database for persistent storage
# - Redis Cache for session and data caching
# - Service Bus for asynchronous messaging
# - App Service Plan and App Services for hosting applications
# - Optional: AKS cluster for container orchestration
# - Optional: Private Endpoints for secure networking
# - Optional: Application Gateway or Front Door for WAF and load balancing
# - Monitoring and alerting infrastructure
# - Azure Dashboards for visualization

# ============================================================================
# Provider Configuration
# ============================================================================

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }

    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    cognitive_account {
      purge_soft_delete_on_destroy = false
    }

    virtual_machine {
      delete_os_disk_on_deletion     = true
      graceful_shutdown              = false
      skip_shutdown_and_force_delete = false
    }
  }
}

provider "azuread" {
  # Azure AD provider configuration
}

# ============================================================================
# Validation: Ensure only one WAF solution is enabled
# ============================================================================

resource "null_resource" "validate_waf_config" {
  count = local.waf_conflict ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: Cannot enable both Application Gateway and Front Door. Choose one.' && exit 1"
  }
}

# ============================================================================
# Resource Group
# ============================================================================

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# ============================================================================
# Module: Networking
# ============================================================================

module "networking" {
  source = "./modules/networking"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  vnet_name          = local.vnet_name
  vnet_address_space = var.vnet_address_space
  subnets            = local.subnets

  enable_application_gateway = var.enable_application_gateway
}

# ============================================================================
# Module: Managed Identities
# ============================================================================

module "managed_identity" {
  source = "./modules/managed-identity"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  cicd_identity_name     = local.cicd_identity_name
  workload_identity_name = local.workload_identity_name
  aks_identity_name      = local.aks_identity_name

  enable_aks = var.enable_aks
}

# ============================================================================
# Module: Container Registry
# ============================================================================

module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  acr_name                               = local.acr_name
  enable_defender                        = var.enable_defender
  cicd_managed_identity_principal_id     = module.managed_identity.cicd_principal_id
  aks_managed_identity_principal_id      = var.enable_aks ? module.managed_identity.aks_kubelet_principal_id : null
  workload_managed_identity_principal_id = module.managed_identity.workload_principal_id

  depends_on = [module.managed_identity]
}

# ============================================================================
# Module: Key Vault
# ============================================================================

module "key_vault" {
  source = "./modules/key-vault"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  key_vault_name          = local.key_vault_name
  enable_diagnostics      = var.enable_diagnostics
  enable_private_endpoint = var.enable_private_endpoints
  allowed_ip_addresses    = var.allowed_ip_addresses
  tenant_id               = data.azurerm_client_config.current.tenant_id

  # Grant access to managed identities
  workload_identity_principal_id = module.managed_identity.workload_principal_id
  cicd_identity_principal_id     = module.managed_identity.cicd_principal_id

  depends_on = [module.managed_identity]
}

# ============================================================================
# Module: Application Insights and Log Analytics
# ============================================================================

module "app_insights" {
  source = "./modules/app-insights"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_insights_name   = local.app_insights_name
  log_analytics_name  = local.log_analytics_name
  sampling_percentage = var.app_insights_sampling_percentage
}

# ============================================================================
# Module: SQL Database
# ============================================================================

module "sql_database" {
  source = "./modules/sql-database"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  sql_server_name         = local.sql_server_name
  sql_database_name       = local.sql_database_name
  sql_admin_username      = var.sql_admin_username
  sql_admin_password      = var.sql_admin_password
  database_sku            = local.config.sql_database_sku
  enable_defender         = var.enable_defender
  subnet_id               = module.networking.database_subnet_id
  enable_private_endpoint = var.enable_private_endpoints
  allowed_ip_addresses    = var.allowed_ip_addresses

  depends_on = [module.networking]
}

# ============================================================================
# Module: Redis Cache
# ============================================================================

module "redis_cache" {
  source = "./modules/redis-cache"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  redis_cache_name        = local.redis_cache_name
  cache_sku               = local.config.redis_cache_sku
  subnet_id               = module.networking.cache_subnet_id
  enable_private_endpoint = var.enable_private_endpoints

  depends_on = [module.networking]
}

# ============================================================================
# Module: Service Bus
# ============================================================================

module "service_bus" {
  source = "./modules/service-bus"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  unique_suffix = local.unique_suffix
  sku           = local.config.service_bus_sku
}

# ============================================================================
# Module: App Service Plan
# ============================================================================

module "app_service_plan" {
  source = "./modules/app-service-plan"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_service_plan_name = local.app_service_plan_name
  plan_sku              = local.config.app_service_plan_sku
  enable_auto_scaling   = local.enable_auto_scaling
  min_replicas          = local.min_replicas
  max_replicas          = local.max_replicas
}

# ============================================================================
# Module: App Services
# ============================================================================

module "app_services" {
  source = "./modules/app-services"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_service_plan_id = module.app_service_plan.app_service_plan_id
  web_app_name        = local.web_app_name
  auth_service_name   = local.auth_service_name
  ai_service_name     = local.ai_service_name

  container_registry_name          = module.container_registry.container_registry_name
  container_registry_url           = module.container_registry.container_registry_login_server
  key_vault_name                   = module.key_vault.key_vault_name
  app_insights_instrumentation_key = module.app_insights.instrumentation_key
  app_insights_connection_string   = module.app_insights.connection_string
  subnet_id                        = module.networking.app_service_subnet_id

  workload_identity_client_id = module.managed_identity.workload_client_id

  depends_on = [
    module.app_service_plan,
    module.container_registry,
    module.key_vault,
    module.app_insights,
    module.networking
  ]
}

# ============================================================================
# Module: Private Endpoints (Optional)
# ============================================================================

module "private_endpoints" {
  count  = var.enable_private_endpoints ? 1 : 0
  source = "./modules/private-endpoints"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  vnet_id                     = module.networking.vnet_id
  private_endpoints_subnet_id = module.networking.private_endpoints_subnet_id

  key_vault_id   = module.key_vault.key_vault_id
  sql_server_id  = module.sql_database.sql_server_id
  redis_cache_id = module.redis_cache.redis_cache_id

  depends_on = [
    module.key_vault,
    module.sql_database,
    module.redis_cache,
    module.networking
  ]
}

# ============================================================================
# Module: AKS Cluster (Optional)
# ============================================================================

module "aks" {
  count  = var.enable_aks ? 1 : 0
  source = "./modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  aks_cluster_name            = local.aks_cluster_name
  kubernetes_version          = var.aks_kubernetes_version
  subnet_id                   = module.networking.aks_subnet_id
  log_analytics_workspace_id  = module.app_insights.log_analytics_workspace_id
  kubelet_managed_identity_id = module.managed_identity.aks_kubelet_identity_id

  enable_azure_policy    = true
  enable_monitoring      = true
  enable_private_cluster = var.enable_private_endpoints

  depends_on = [
    module.networking,
    module.app_insights,
    module.managed_identity,
    module.container_registry
  ]
}

# ============================================================================
# Module: Application Gateway with WAF (Optional)
# ============================================================================

module "application_gateway" {
  count  = var.enable_application_gateway ? 1 : 0
  source = "./modules/application-gateway"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_gateway_name      = local.app_gateway_name
  vnet_name             = module.networking.vnet_name
  app_gateway_subnet_id = module.networking.app_gateway_subnet_id

  backend_app_services = {
    web_app_fqdn      = replace(replace(module.app_services.web_app_url, "https://", ""), "http://", "")
    auth_service_fqdn = replace(replace(module.app_services.auth_service_url, "https://", ""), "http://", "")
    ai_service_fqdn   = replace(replace(module.app_services.ai_service_url, "https://", ""), "http://", "")
  }

  enable_waf = true
  waf_mode   = var.waf_mode

  depends_on = [
    module.networking,
    module.app_services
  ]
}

# ============================================================================
# Module: Azure Front Door with WAF (Optional)
# ============================================================================

module "front_door" {
  count  = var.enable_front_door ? 1 : 0
  source = "./modules/front-door"

  resource_group_name = azurerm_resource_group.main.name
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  front_door_name = local.front_door_name

  backend_app_services = {
    web_app_fqdn      = replace(replace(module.app_services.web_app_url, "https://", ""), "http://", "")
    auth_service_fqdn = replace(replace(module.app_services.auth_service_url, "https://", ""), "http://", "")
    ai_service_fqdn   = replace(replace(module.app_services.ai_service_url, "https://", ""), "http://", "")
  }

  enable_waf     = true
  waf_mode       = var.waf_mode
  enable_caching = true

  depends_on = [module.app_services]
}

# ============================================================================
# Module: Key Vault Secrets
# ============================================================================

module "key_vault_secrets" {
  source = "./modules/key-vault-secrets"

  key_vault_id = module.key_vault.key_vault_id

  secrets = {
    sql-connection-string           = module.sql_database.connection_string
    redis-connection-string         = module.redis_cache.connection_string
    servicebus-connection-string    = module.service_bus.connection_string
    appinsights-instrumentation-key = module.app_insights.instrumentation_key
    appinsights-connection-string   = module.app_insights.connection_string
  }

  depends_on = [
    module.sql_database,
    module.redis_cache,
    module.service_bus,
    module.container_registry,
    module.key_vault
  ]
}

# ============================================================================
# Module: Monitoring and Alerts
# ============================================================================

module "monitoring" {
  source = "./modules/monitoring"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_insights_id            = module.app_insights.app_insights_id
  log_analytics_workspace_id = module.app_insights.log_analytics_workspace_id

  sql_server_id  = module.sql_database.sql_server_id
  redis_cache_id = module.redis_cache.redis_cache_id

  web_app_ids = module.app_services.app_service_ids
  web_app_urls = {
    web_app_url      = module.app_services.web_app_url
    auth_service_url = module.app_services.auth_service_url
    ai_service_url   = module.app_services.ai_service_url
  }

  depends_on = [
    module.app_insights,
    module.sql_database,
    module.redis_cache,
    module.app_services
  ]
}

# ============================================================================
# Module: Dashboards
# ============================================================================

module "dashboards" {
  source = "./modules/dashboards"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  app_insights_id            = module.app_insights.app_insights_id
  log_analytics_workspace_id = module.app_insights.log_analytics_workspace_id

  web_app_ids    = module.app_services.app_service_ids
  sql_server_id  = module.sql_database.sql_server_id
  redis_cache_id = module.redis_cache.redis_cache_id

  application_gateway_id = var.enable_application_gateway ? module.application_gateway[0].application_gateway_id : null
  front_door_id          = var.enable_front_door ? module.front_door[0].front_door_id : null

  depends_on = [module.monitoring]
}
