terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.117"
    }
  }
}

# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project_name}-aks-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project_name}-aks-${var.environment}"
  kubernetes_version  = var.kubernetes_version

  # Enable OIDC and Workload Identity for modern authentication
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # Enable private cluster if specified
  private_cluster_enabled = var.enable_private_cluster

  # Enable Azure Policy
  azure_policy_enabled = var.enable_azure_policy

  # Default node pool (system workloads)
  default_node_pool {
    name                = "system"
    vm_size             = var.system_node_pool_vm_size
    node_count          = var.system_node_pool_count
    min_count           = var.system_node_pool_min_count
    max_count           = var.system_node_pool_max_count
    enable_auto_scaling = var.system_node_pool_enable_auto_scaling
    vnet_subnet_id      = var.subnet_id
    os_disk_size_gb     = var.system_node_pool_os_disk_size
    os_disk_type        = "Managed"
    max_pods            = var.max_pods_per_node
    type                = "VirtualMachineScaleSets"
    zones               = var.availability_zones

    node_labels = {
      "nodepool-type" = "system"
      "environment"   = var.environment
      "project"       = var.project_name
    }

    tags = merge(
      var.tags,
      {
        "NodePoolType" = "system"
      }
    )
  }

  # Identity configuration - UserAssigned for kubelet
  identity {
    type         = "UserAssigned"
    identity_ids = [var.kubelet_identity_id]
  }

  # Kubelet identity configuration
  kubelet_identity {
    client_id                 = var.kubelet_client_id
    object_id                 = var.kubelet_object_id
    user_assigned_identity_id = var.kubelet_identity_id
  }

  # Network configuration - Azure CNI
  network_profile {
    network_plugin    = "azure"
    network_policy    = "azure"
    dns_service_ip    = var.dns_service_ip
    service_cidr      = var.service_cidr
    load_balancer_sku = "standard"
    outbound_type     = var.outbound_type

    load_balancer_profile {
      managed_outbound_ip_count = var.load_balancer_outbound_ip_count
    }
  }

  # Azure Monitor integration
  dynamic "oms_agent" {
    for_each = var.enable_monitoring ? [1] : []
    content {
      log_analytics_workspace_id = var.log_analytics_workspace_id
    }
  }

  # Automatic channel upgrades
  automatic_channel_upgrade = var.automatic_channel_upgrade

  # Maintenance window
  dynamic "maintenance_window" {
    for_each = var.maintenance_window_enabled ? [1] : []
    content {
      allowed {
        day   = var.maintenance_window_day
        hours = var.maintenance_window_hours
      }
    }
  }

  # Azure Active Directory integration
  dynamic "azure_active_directory_role_based_access_control" {
    for_each = var.enable_azure_ad_rbac ? [1] : []
    content {
      managed                = true
      admin_group_object_ids = var.azure_ad_admin_group_object_ids
      azure_rbac_enabled     = true
    }
  }

  # Key Vault secrets provider
  dynamic "key_vault_secrets_provider" {
    for_each = var.enable_secret_store_csi ? [1] : []
    content {
      secret_rotation_enabled  = true
      secret_rotation_interval = "2m"
    }
  }

  # Microsoft Defender for Cloud
  dynamic "microsoft_defender" {
    for_each = var.enable_microsoft_defender ? [1] : []
    content {
      log_analytics_workspace_id = var.log_analytics_workspace_id
    }
  }

  # HTTP application routing (disabled for production)
  http_application_routing_enabled = false

  # Local account disabled for production
  local_account_disabled = var.disable_local_accounts

  # Node resource group
  node_resource_group = "${var.resource_group_name}-aks-nodes-${var.environment}"

  # SKU tier
  sku_tier = var.aks_sku_tier

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "ManagedBy"   = "Terraform"
    }
  )

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count
    ]
  }
}

# User node pool for application workloads
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  count                 = var.enable_user_node_pool ? 1 : 0
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.user_node_pool_vm_size
  node_count            = var.user_node_pool_count
  min_count             = var.user_node_pool_min_count
  max_count             = var.user_node_pool_max_count
  enable_auto_scaling   = var.user_node_pool_enable_auto_scaling
  vnet_subnet_id        = var.subnet_id
  os_disk_size_gb       = var.user_node_pool_os_disk_size
  os_disk_type          = "Managed"
  max_pods              = var.max_pods_per_node
  zones                 = var.availability_zones
  mode                  = "User"

  node_labels = {
    "nodepool-type" = "user"
    "environment"   = var.environment
    "project"       = var.project_name
  }

  node_taints = var.user_node_pool_taints

  tags = merge(
    var.tags,
    {
      "NodePoolType" = "user"
    }
  )

  lifecycle {
    ignore_changes = [
      node_count
    ]
  }
}

# Additional node pool for GPU workloads (optional)
resource "azurerm_kubernetes_cluster_node_pool" "gpu" {
  count                 = var.enable_gpu_node_pool ? 1 : 0
  name                  = "gpu"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.gpu_node_pool_vm_size
  node_count            = var.gpu_node_pool_count
  min_count             = var.gpu_node_pool_min_count
  max_count             = var.gpu_node_pool_max_count
  enable_auto_scaling   = var.gpu_node_pool_enable_auto_scaling
  vnet_subnet_id        = var.subnet_id
  os_disk_size_gb       = var.gpu_node_pool_os_disk_size
  os_disk_type          = "Managed"
  max_pods              = var.max_pods_per_node
  zones                 = var.availability_zones
  mode                  = "User"

  node_labels = {
    "nodepool-type" = "gpu"
    "environment"   = var.environment
    "project"       = var.project_name
    "accelerator"   = "nvidia-gpu"
  }

  node_taints = concat(
    ["nvidia.com/gpu=true:NoSchedule"],
    var.gpu_node_pool_taints
  )

  tags = merge(
    var.tags,
    {
      "NodePoolType" = "gpu"
      "Workload"     = "ai-ml"
    }
  )

  lifecycle {
    ignore_changes = [
      node_count
    ]
  }
}
