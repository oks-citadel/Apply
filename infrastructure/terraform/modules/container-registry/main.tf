###########################################
# Container Registry Module - Main Configuration
# JobPilot AI Platform
###########################################

locals {
  # Define SKU based on environment
  sku_map = {
    dev     = "Basic"
    staging = "Standard"
    prod    = "Premium"
  }

  # Registry name must be globally unique and alphanumeric only
  registry_name = "${var.project_name}${var.environment}acr${var.unique_suffix}"

  # Geo-replication is only available for Premium SKU
  enable_georeplications = var.environment == "prod"

  # Geo-replication locations for production
  geo_replication_locations = var.environment == "prod" ? [
    "East US 2",
    "West Europe"
  ] : []
}

# Azure Container Registry
resource "azurerm_container_registry" "acr" {
  name                = local.registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = local.sku_map[var.environment]

  # Disable admin user for security - use managed identities instead
  admin_enabled = false

  # Enable system-assigned managed identity
  identity {
    type = "SystemAssigned"
  }

  # Public network access configuration
  public_network_access_enabled = true

  # Zone redundancy (Premium SKU only)
  zone_redundancy_enabled = var.environment == "prod"

  # Network rule set for Basic and Standard SKUs
  dynamic "network_rule_set" {
    for_each = var.environment != "prod" ? [1] : []
    content {
      default_action = "Allow"
    }
  }

  # Retention policy for untagged manifests (Standard and Premium)
  dynamic "retention_policy" {
    for_each = var.environment != "dev" ? [1] : []
    content {
      days    = var.environment == "prod" ? 30 : 7
      enabled = true
    }
  }

  # Trust policy (Premium only)
  dynamic "trust_policy" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      enabled = true
    }
  }

  # Quarantine policy (Premium only)
  dynamic "quarantine_policy" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      enabled = true
    }
  }

  # Geo-replication for Premium SKU
  dynamic "georeplications" {
    for_each = local.enable_georeplications ? local.geo_replication_locations : []
    content {
      location                = georeplications.value
      zone_redundancy_enabled = true
      tags                    = var.tags
    }
  }

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Purpose     = "Container Image Registry"
    }
  )
}

# Role Assignment: AcrPush for CI/CD Identity
# Allows CI/CD pipeline to push images to the registry
resource "azurerm_role_assignment" "cicd_acr_push" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPush"
  principal_id         = var.cicd_identity_principal_id

  depends_on = [azurerm_container_registry.acr]
}

# Role Assignment: AcrPull for AKS Kubelet Identity
# Allows AKS nodes to pull images from the registry
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = var.aks_identity_principal_id

  depends_on = [azurerm_container_registry.acr]
}

# Role Assignment: AcrPull for Workload Identity
# Allows application workloads to pull images if needed
resource "azurerm_role_assignment" "workload_acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = var.workload_identity_principal_id

  depends_on = [azurerm_container_registry.acr]
}

# Microsoft Defender for Container Registries
resource "azurerm_security_center_subscription_pricing" "container_registry" {
  count = var.enable_defender ? 1 : 0

  tier          = "Standard"
  resource_type = "ContainerRegistry"
}
