# AKS (Azure Kubernetes Service) Module

This module creates a production-ready Azure Kubernetes Service (AKS) cluster with support for multiple node pools, OIDC workload identity, Azure Policy, and comprehensive monitoring.

## Features

- Azure CNI networking for full integration with Azure Virtual Networks
- OIDC issuer and workload identity for modern authentication
- Private cluster support for enhanced security
- Multiple node pools (system, user, GPU)
- Auto-scaling configuration for all node pools
- Azure Policy integration
- Azure Monitor integration with Log Analytics
- Key Vault secrets provider (CSI driver)
- Microsoft Defender for Cloud integration
- Azure AD RBAC integration
- Maintenance window configuration
- Zone redundancy support

## Usage

```hcl
module "aks" {
  source = "./modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment

  # Network Configuration
  subnet_id       = azurerm_subnet.aks.id
  dns_service_ip  = "10.0.0.10"
  service_cidr    = "10.0.0.0/16"

  # Kubernetes Version
  kubernetes_version = "1.28.3"

  # Monitoring
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Identity Configuration
  kubelet_identity_id = azurerm_user_assigned_identity.aks_kubelet.id
  kubelet_client_id   = azurerm_user_assigned_identity.aks_kubelet.client_id
  kubelet_object_id   = azurerm_user_assigned_identity.aks_kubelet.principal_id

  # Security
  enable_private_cluster  = true
  enable_azure_policy     = true
  enable_azure_ad_rbac    = true
  disable_local_accounts  = true

  # System Node Pool
  system_node_pool_vm_size            = "Standard_D4s_v3"
  system_node_pool_min_count          = 3
  system_node_pool_max_count          = 10
  system_node_pool_enable_auto_scaling = true

  # User Node Pool
  enable_user_node_pool               = true
  user_node_pool_vm_size              = "Standard_D8s_v3"
  user_node_pool_min_count            = 3
  user_node_pool_max_count            = 20
  user_node_pool_enable_auto_scaling  = true

  # GPU Node Pool (optional)
  enable_gpu_node_pool = false

  tags = var.tags
}
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| azurerm | ~> 3.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| resource_group_name | Name of the resource group | `string` | n/a | yes |
| location | Azure region | `string` | n/a | yes |
| project_name | Project name for naming | `string` | n/a | yes |
| environment | Environment (dev/staging/prod) | `string` | n/a | yes |
| subnet_id | Subnet ID for AKS nodes | `string` | n/a | yes |
| kubernetes_version | Kubernetes version | `string` | `"1.28.3"` | no |
| enable_private_cluster | Enable private cluster | `bool` | `true` | no |

See [variables.tf](./variables.tf) for complete list of inputs.

## Outputs

| Name | Description |
|------|-------------|
| cluster_id | AKS cluster resource ID |
| cluster_name | AKS cluster name |
| oidc_issuer_url | OIDC issuer URL for workload identity |
| kube_config | Kubernetes configuration (sensitive) |

See [outputs.tf](./outputs.tf) for complete list of outputs.

## Notes

- The module creates a private AKS cluster by default for enhanced security
- Workload identity is enabled for modern authentication patterns
- Auto-scaling is configured for all node pools
- The cluster uses Azure CNI for full VNet integration
- Local accounts are disabled by default in production
