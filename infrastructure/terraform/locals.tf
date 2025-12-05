# ============================================================================
# Local Values
# ============================================================================
# This file defines local values used throughout the Terraform configuration.
# Locals help avoid repetition and make configurations more maintainable.

locals {
  # ============================================================================
  # Resource Naming
  # ============================================================================

  resource_group_name = "${var.project_name}-${var.environment}-rg"

  # Generate a unique suffix based on subscription ID and resource group name
  # This ensures globally unique names for resources like Storage Accounts
  unique_suffix = substr(md5("${data.azurerm_subscription.current.subscription_id}-${local.resource_group_name}"), 0, 6)

  # ============================================================================
  # Environment-Specific Configurations
  # ============================================================================

  environment_configs = {
    dev = {
      # App Service Plan configuration
      app_service_plan_sku = {
        name     = "B2"
        tier     = "Basic"
        capacity = 1
      }

      # SQL Database configuration
      sql_database_sku = {
        name     = "Basic"
        tier     = "Basic"
        capacity = 5
      }

      # Redis Cache configuration
      redis_cache_sku = {
        name     = "Basic"
        family   = "C"
        capacity = 0
      }

      # Auto-scaling configuration
      enable_auto_scaling = false
      min_replicas        = 1
      max_replicas        = 2

      # Service Bus SKU
      service_bus_sku = "Standard"
    }

    staging = {
      # App Service Plan configuration
      app_service_plan_sku = {
        name     = "S1"
        tier     = "Standard"
        capacity = 2
      }

      # SQL Database configuration
      sql_database_sku = {
        name     = "S1"
        tier     = "Standard"
        capacity = 20
      }

      # Redis Cache configuration
      redis_cache_sku = {
        name     = "Standard"
        family   = "C"
        capacity = 1
      }

      # Auto-scaling configuration
      enable_auto_scaling = true
      min_replicas        = 2
      max_replicas        = 5

      # Service Bus SKU
      service_bus_sku = "Standard"
    }

    prod = {
      # App Service Plan configuration
      app_service_plan_sku = {
        name     = "P1v3"
        tier     = "PremiumV3"
        capacity = 3
      }

      # SQL Database configuration
      sql_database_sku = {
        name     = "S3"
        tier     = "Standard"
        capacity = 100
      }

      # Redis Cache configuration
      redis_cache_sku = {
        name     = "Premium"
        family   = "P"
        capacity = 1
      }

      # Auto-scaling configuration
      enable_auto_scaling = true
      min_replicas        = 3
      max_replicas        = 10

      # Service Bus SKU
      service_bus_sku = "Premium"
    }
  }

  # Select configuration based on current environment
  config = local.environment_configs[var.environment]

  # ============================================================================
  # Override Configurations
  # ============================================================================
  # Allow variable overrides for auto-scaling settings

  enable_auto_scaling = var.enable_auto_scaling != null ? var.enable_auto_scaling : local.config.enable_auto_scaling
  min_replicas        = var.min_replicas != null ? var.min_replicas : local.config.min_replicas
  max_replicas        = var.max_replicas != null ? var.max_replicas : local.config.max_replicas

  # ============================================================================
  # Common Tags
  # ============================================================================

  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      DeployedAt  = timestamp()
    }
  )

  # ============================================================================
  # Networking Configuration
  # ============================================================================

  vnet_name = "${var.project_name}-${var.environment}-vnet"

  # Subnet configurations
  subnets = {
    app_service = {
      name             = "app-service-subnet"
      address_prefixes = ["10.0.1.0/24"]
    }
    aks = {
      name             = "aks-subnet"
      address_prefixes = ["10.0.2.0/23"]
    }
    database = {
      name             = "database-subnet"
      address_prefixes = ["10.0.4.0/24"]
    }
    cache = {
      name             = "cache-subnet"
      address_prefixes = ["10.0.5.0/24"]
    }
    private_endpoints = {
      name             = "private-endpoints-subnet"
      address_prefixes = ["10.0.6.0/24"]
    }
    app_gateway = {
      name             = "app-gateway-subnet"
      address_prefixes = ["10.0.7.0/24"]
    }
  }

  # ============================================================================
  # Service Names
  # ============================================================================

  # Container Registry name (alphanumeric only, globally unique)
  acr_name = "${var.project_name}${var.environment}acr${local.unique_suffix}"

  # Key Vault name (must be globally unique, 3-24 characters)
  key_vault_name = "${var.project_name}-${var.environment}-kv-${local.unique_suffix}"

  # Application Insights name
  app_insights_name = "${var.project_name}-${var.environment}-appi"

  # Log Analytics Workspace name
  log_analytics_name = "${var.project_name}-${var.environment}-law"

  # SQL Server name (globally unique)
  sql_server_name = "${var.project_name}-${var.environment}-sql-${local.unique_suffix}"

  # SQL Database name
  sql_database_name = "${var.project_name}-${var.environment}-db"

  # Redis Cache name (globally unique)
  redis_cache_name = "${var.project_name}-${var.environment}-redis-${local.unique_suffix}"

  # Service Bus namespace (globally unique)
  service_bus_name = "${var.project_name}-${var.environment}-sb-${local.unique_suffix}"

  # App Service Plan name
  app_service_plan_name = "${var.project_name}-${var.environment}-asp"

  # App Services names
  web_app_name      = "${var.project_name}-${var.environment}-webapp"
  auth_service_name = "${var.project_name}-${var.environment}-auth"
  ai_service_name   = "${var.project_name}-${var.environment}-ai"

  # AKS cluster name
  aks_cluster_name = "${var.project_name}-${var.environment}-aks"

  # Application Gateway name
  app_gateway_name = "${var.project_name}-${var.environment}-appgw"

  # Front Door name (globally unique)
  front_door_name = "${var.project_name}-${var.environment}-fd-${local.unique_suffix}"

  # Managed Identity names
  cicd_identity_name     = "${var.project_name}-${var.environment}-cicd-identity"
  workload_identity_name = "${var.project_name}-${var.environment}-workload-identity"
  aks_identity_name      = "${var.project_name}-${var.environment}-aks-identity"

  # ============================================================================
  # Feature Flags and Conditional Logic
  # ============================================================================

  # Determine if we should create networking resources
  create_networking = true

  # Determine if we should create monitoring resources
  create_monitoring = true

  # Validate that only one WAF solution is enabled
  waf_conflict = var.enable_application_gateway && var.enable_front_door

  # ============================================================================
  # Service Bus Queue and Topic Names
  # ============================================================================

  service_bus_queues = [
    "job-applications",
    "resume-processing",
    "ai-analysis",
    "notifications"
  ]

  service_bus_topics = [
    "application-events",
    "system-events"
  ]
}

# ============================================================================
# Data Sources
# ============================================================================

data "azurerm_subscription" "current" {}

data "azurerm_client_config" "current" {}
