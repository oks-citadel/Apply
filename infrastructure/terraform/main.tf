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

  enable_aks = var.enable_aks
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

  unique_suffix                  = local.unique_suffix
  enable_defender                = var.enable_defender
  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = var.enable_aks ? module.managed_identity.aks_kubelet_identity_principal_id : module.managed_identity.workload_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

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

  unique_suffix              = local.unique_suffix
  enable_diagnostics         = var.enable_diagnostics
  enable_private_endpoint    = var.enable_private_endpoints
  allowed_ip_addresses       = var.allowed_ip_addresses
  log_analytics_workspace_id = module.app_insights.workspace_id

  depends_on = [module.managed_identity, module.app_insights]
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

  unique_suffix           = local.unique_suffix
  sql_admin_username      = var.sql_admin_username
  sql_admin_password      = var.sql_admin_password
  azuread_admin_login     = "citadelcloudmanagement@gmail.com"
  azuread_admin_object_id = data.azurerm_client_config.current.object_id
  database_sku            = local.config.sql_database_sku.name
  enable_defender         = var.enable_defender
  subnet_id               = module.networking.database_subnet_id
  enable_vnet_rule        = true
  enable_private_endpoint = var.enable_private_endpoints

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

  unique_suffix           = local.unique_suffix
  cache_sku               = "${local.config.redis_cache_sku.name}_${local.config.redis_cache_sku.family}${local.config.redis_cache_sku.capacity}"
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

  plan_sku           = local.config.app_service_plan_sku.name
  enable_autoscaling = local.enable_auto_scaling
  min_capacity       = local.min_replicas
  max_capacity       = local.max_replicas
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

  app_service_plan_id = module.app_service_plan.plan_id

  container_registry_name        = module.container_registry.registry_name
  container_registry_url         = module.container_registry.registry_login_server
  key_vault_name                 = module.key_vault.vault_name
  app_insights_key               = module.app_insights.instrumentation_key
  app_insights_connection_string = module.app_insights.connection_string
  subnet_id                      = module.networking.app_service_subnet_id

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

  vnet_id   = module.networking.vnet_id
  subnet_id = module.networking.private_endpoints_subnet_id

  key_vault_id   = module.key_vault.vault_id
  sql_server_id  = module.sql_database.server_id
  redis_cache_id = module.redis_cache.cache_id

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

  kubernetes_version         = var.aks_kubernetes_version
  subnet_id                  = module.networking.aks_subnet_id
  log_analytics_workspace_id = module.app_insights.workspace_id

  # Kubelet identity from managed-identity module
  kubelet_identity_id = module.managed_identity.aks_kubelet_identity_id
  kubelet_client_id   = module.managed_identity.aks_kubelet_identity_client_id
  kubelet_object_id   = module.managed_identity.aks_kubelet_identity_principal_id

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

  # Note: Application Gateway requires a dedicated subnet that should be added to networking module
  # For now, use the private_endpoints subnet (should be changed when app_gateway_subnet is available)
  subnet_id = module.networking.private_endpoints_subnet_id

  backend_fqdns = {
    web_app      = [replace(replace(module.app_services.web_app_url, "https://", ""), "http://", "")]
    auth_service = [replace(replace(module.app_services.auth_service_url, "https://", ""), "http://", "")]
    ai_service   = [replace(replace(module.app_services.ai_service_url, "https://", ""), "http://", "")]
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

  enable_waf     = true
  waf_mode       = var.waf_mode
  enable_caching = true

  # Backend origins are configured through variables
  backend_fqdns = {
    web_app      = [replace(replace(module.app_services.web_app_url, "https://", ""), "http://", "")]
    auth_service = [replace(replace(module.app_services.auth_service_url, "https://", ""), "http://", "")]
    ai_service   = [replace(replace(module.app_services.ai_service_url, "https://", ""), "http://", "")]
  }

  depends_on = [module.app_services]
}

# ============================================================================
# Module: Key Vault Secrets
# ============================================================================

module "key_vault_secrets" {
  source = "./modules/key-vault-secrets"

  key_vault_id = module.key_vault.vault_id

  sql_connection_string           = module.sql_database.connection_string
  redis_connection_string         = module.redis_cache.primary_connection_string
  servicebus_connection_string    = module.service_bus.connection_string
  app_insights_key                = module.app_insights.instrumentation_key
  app_insights_connection_string  = module.app_insights.connection_string

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
  log_analytics_workspace_id = module.app_insights.workspace_id

  sql_server_id  = module.sql_database.server_id
  redis_cache_id = module.redis_cache.cache_id

  web_app_ids = module.app_services.app_service_ids
  web_app_urls = {
    web_app_url      = module.app_services.web_app_url
    auth_service_url = module.app_services.auth_service_url
    ai_service_url   = module.app_services.ai_service_url
  }

  # Alert notification recipients
  alert_email_addresses = ["citadelcloudmanagement@gmail.com"]

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
  log_analytics_workspace_id = module.app_insights.workspace_id

  web_app_ids    = module.app_services.app_service_ids
  sql_server_id  = module.sql_database.server_id
  redis_cache_id = module.redis_cache.cache_id

  application_gateway_id = var.enable_application_gateway ? module.application_gateway[0].application_gateway_id : null
  front_door_id          = var.enable_front_door ? module.front_door[0].front_door_id : null

  depends_on = [module.monitoring]
}
