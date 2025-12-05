# Example Usage - Dashboards Module
# JobPilot AI Platform

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# ============================================================================
# Example: Basic Dashboard Setup
# ============================================================================

module "dashboard_basic" {
  source = "../"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  app_insights_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/microsoft.insights/components/jobpilot-prod-appinsights"

  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend"
  }

  tags = {
    Project     = "JobPilot"
    Environment = "Production"
  }
}

# ============================================================================
# Example: Full Dashboard with All Features
# ============================================================================

module "dashboard_full" {
  source = "../"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  # Application Insights and Log Analytics
  app_insights_id            = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/microsoft.insights/components/jobpilot-prod-appinsights"
  log_analytics_workspace_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.OperationalInsights/workspaces/jobpilot-prod-logs"

  # Web Applications
  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend"
    backend  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-backend"
    auth     = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-auth"
    ai       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-ai"
  }

  # Database and Cache
  sql_server_id  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Sql/servers/jobpilot-prod-sql/databases/jobpilot-db"
  redis_cache_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Cache/Redis/jobpilot-prod-redis"

  # Networking
  application_gateway_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Network/applicationGateways/jobpilot-prod-appgw"
  front_door_id          = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Network/frontDoors/jobpilot-prod-fd"

  # Containers
  aks_cluster_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.ContainerService/managedClusters/jobpilot-prod-aks"

  # Storage and Security
  storage_account_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Storage/storageAccounts/jobpilotprodstorage"
  key_vault_id       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.KeyVault/vaults/jobpilot-prod-kv"

  # Dashboard Configuration
  dashboard_time_range    = 24
  enable_database_tiles   = true
  enable_cache_tiles      = true
  enable_networking_tiles = true
  enable_container_tiles  = true

  tags = {
    Project     = "JobPilot"
    Environment = "Production"
    CostCenter  = "Engineering"
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Example: Minimal Dashboard for Development
# ============================================================================

module "dashboard_dev" {
  source = "../"

  resource_group_name = "jobpilot-dev-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"

  app_insights_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-dev-rg/providers/microsoft.insights/components/jobpilot-dev-appinsights"

  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-dev-rg/providers/Microsoft.Web/sites/jobpilot-dev-frontend"
    backend  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-dev-rg/providers/Microsoft.Web/sites/jobpilot-dev-backend"
  }

  # No database or cache tiles for dev environment
  enable_database_tiles = false
  enable_cache_tiles    = false

  # Longer time range for development (48 hours)
  dashboard_time_range = 48

  tags = {
    Project     = "JobPilot"
    Environment = "Development"
  }
}

# ============================================================================
# Example: Multi-Region Dashboard
# ============================================================================

module "dashboard_multi_region" {
  source = "../"

  resource_group_name = "jobpilot-global-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  app_insights_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-global-rg/providers/microsoft.insights/components/jobpilot-global-appinsights"

  # Web apps across multiple regions
  web_app_ids = {
    frontend_east = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend-east"
    frontend_west = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend-west"
    backend_east  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-backend-east"
    backend_west  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-backend-west"
  }

  sql_server_id  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Sql/servers/jobpilot-prod-sql/databases/jobpilot-db"
  redis_cache_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Cache/Redis/jobpilot-prod-redis"

  # Enable all features for global monitoring
  enable_database_tiles   = true
  enable_cache_tiles      = true
  enable_networking_tiles = true

  tags = {
    Project     = "JobPilot"
    Environment = "Production"
    Scope       = "Global"
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "full_dashboard_url" {
  description = "URL to access the full production dashboard"
  value       = module.dashboard_full.dashboard_url
}

output "dev_dashboard_url" {
  description = "URL to access the development dashboard"
  value       = module.dashboard_dev.dashboard_url
}

output "dashboard_summary" {
  description = "Summary of the full dashboard configuration"
  value       = module.dashboard_full.dashboard_summary
}

output "dashboard_id" {
  description = "Dashboard resource ID"
  value       = module.dashboard_full.dashboard_id
}
