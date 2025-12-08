# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.resource_prefix}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.resource_prefix}-aks"
  kubernetes_version  = var.kubernetes_version

  # Automatic upgrade channel
  automatic_channel_upgrade = var.environment == "prod" ? "stable" : "patch"

  # Enable workload identity and OIDC issuer
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # System node pool
  default_node_pool {
    name                = "system"
    node_count          = var.enable_auto_scaling ? null : var.system_node_count
    vm_size             = var.system_node_vm_size
    vnet_subnet_id      = var.vnet_subnet_id
    enable_auto_scaling = var.enable_auto_scaling
    min_count           = var.enable_auto_scaling ? var.min_count : null
    max_count           = var.enable_auto_scaling ? var.max_count : null
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"
    max_pods            = 110
    type                = "VirtualMachineScaleSets"
    zones               = var.enable_zones ? ["1", "2", "3"] : null

    upgrade_settings {
      max_surge = "33%"
    }

    node_labels = {
      "nodepool" = "system"
      "role"     = "system"
    }

    tags = var.tags
  }

  # Managed identity
  identity {
    type = "SystemAssigned"
  }

  # Network profile
  network_profile {
    network_plugin    = "azure"
    network_policy    = var.network_policy
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"
    service_cidr      = "172.16.0.0/16"
    dns_service_ip    = "172.16.0.10"
  }

  # Azure AD integration
  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = var.admin_group_object_ids
  }

  # Azure Monitor for containers
  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  # Azure Key Vault Secrets Provider
  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  # Microsoft Defender for Cloud
  microsoft_defender {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  # Maintenance window
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4]
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
      kubernetes_version
    ]
  }
}

# User node pool for application workloads
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.user_node_vm_size
  node_count            = var.enable_auto_scaling ? null : var.user_node_count
  vnet_subnet_id        = var.vnet_subnet_id
  enable_auto_scaling   = var.enable_auto_scaling
  min_count             = var.enable_auto_scaling ? var.min_count : null
  max_count             = var.enable_auto_scaling ? var.max_count : null
  os_disk_size_gb       = 128
  os_disk_type          = "Managed"
  max_pods              = 110
  zones                 = var.enable_zones ? ["1", "2", "3"] : null
  mode                  = "User"

  upgrade_settings {
    max_surge = "33%"
  }

  node_labels = {
    "nodepool" = "user"
    "role"     = "application"
  }

  node_taints = []

  tags = var.tags

  lifecycle {
    ignore_changes = [
      node_count
    ]
  }
}

# ACR pull role assignment for AKS
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = var.acr_id
  skip_service_principal_aad_check = true
}

# Network Contributor role for AKS on subnet
resource "azurerm_role_assignment" "aks_network_contributor" {
  principal_id                     = azurerm_kubernetes_cluster.main.identity[0].principal_id
  role_definition_name             = "Network Contributor"
  scope                            = var.vnet_subnet_id
  skip_service_principal_aad_check = true
}
