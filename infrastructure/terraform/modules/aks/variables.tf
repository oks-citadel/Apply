variable "resource_group_name" {
  description = "Name of the resource group where AKS will be deployed"
  type        = string
}

variable "location" {
  description = "Azure region for AKS cluster"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the AKS cluster"
  type        = string
  default     = "1.28.3"
}

variable "subnet_id" {
  description = "Subnet ID where AKS nodes will be deployed"
  type        = string
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring"
  type        = string
}

variable "kubelet_identity_id" {
  description = "User-assigned managed identity ID for kubelet"
  type        = string
}

variable "kubelet_client_id" {
  description = "Client ID of the kubelet managed identity"
  type        = string
}

variable "kubelet_object_id" {
  description = "Object ID of the kubelet managed identity"
  type        = string
}

variable "enable_azure_policy" {
  description = "Enable Azure Policy for AKS"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable Azure Monitor for containers"
  type        = bool
  default     = true
}

variable "enable_private_cluster" {
  description = "Enable private cluster (API server not publicly accessible)"
  type        = bool
  default     = true
}

variable "enable_azure_ad_rbac" {
  description = "Enable Azure AD RBAC for AKS"
  type        = bool
  default     = true
}

variable "azure_ad_admin_group_object_ids" {
  description = "Azure AD group object IDs for cluster admin access"
  type        = list(string)
  default     = []
}

variable "enable_secret_store_csi" {
  description = "Enable Key Vault secrets provider CSI driver"
  type        = bool
  default     = true
}

variable "enable_microsoft_defender" {
  description = "Enable Microsoft Defender for Cloud for AKS"
  type        = bool
  default     = true
}

variable "disable_local_accounts" {
  description = "Disable local accounts for production security"
  type        = bool
  default     = true
}

variable "aks_sku_tier" {
  description = "AKS SKU tier (Free, Standard, Premium)"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Free", "Standard", "Premium"], var.aks_sku_tier)
    error_message = "SKU tier must be Free, Standard, or Premium."
  }
}

# System Node Pool Configuration
variable "system_node_pool_vm_size" {
  description = "VM size for system node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "system_node_pool_count" {
  description = "Initial node count for system node pool"
  type        = number
  default     = 3
}

variable "system_node_pool_min_count" {
  description = "Minimum node count for system node pool auto-scaling"
  type        = number
  default     = 3
}

variable "system_node_pool_max_count" {
  description = "Maximum node count for system node pool auto-scaling"
  type        = number
  default     = 10
}

variable "system_node_pool_enable_auto_scaling" {
  description = "Enable auto-scaling for system node pool"
  type        = bool
  default     = true
}

variable "system_node_pool_os_disk_size" {
  description = "OS disk size in GB for system node pool"
  type        = number
  default     = 128
}

# User Node Pool Configuration
variable "enable_user_node_pool" {
  description = "Enable dedicated user node pool"
  type        = bool
  default     = true
}

variable "user_node_pool_vm_size" {
  description = "VM size for user node pool"
  type        = string
  default     = "Standard_D8s_v3"
}

variable "user_node_pool_count" {
  description = "Initial node count for user node pool"
  type        = number
  default     = 3
}

variable "user_node_pool_min_count" {
  description = "Minimum node count for user node pool auto-scaling"
  type        = number
  default     = 3
}

variable "user_node_pool_max_count" {
  description = "Maximum node count for user node pool auto-scaling"
  type        = number
  default     = 20
}

variable "user_node_pool_enable_auto_scaling" {
  description = "Enable auto-scaling for user node pool"
  type        = bool
  default     = true
}

variable "user_node_pool_os_disk_size" {
  description = "OS disk size in GB for user node pool"
  type        = number
  default     = 256
}

variable "user_node_pool_taints" {
  description = "Taints to apply to user node pool"
  type        = list(string)
  default     = []
}

# GPU Node Pool Configuration
variable "enable_gpu_node_pool" {
  description = "Enable GPU node pool for AI/ML workloads"
  type        = bool
  default     = false
}

variable "gpu_node_pool_vm_size" {
  description = "VM size for GPU node pool (e.g., Standard_NC6s_v3)"
  type        = string
  default     = "Standard_NC6s_v3"
}

variable "gpu_node_pool_count" {
  description = "Initial node count for GPU node pool"
  type        = number
  default     = 0
}

variable "gpu_node_pool_min_count" {
  description = "Minimum node count for GPU node pool auto-scaling"
  type        = number
  default     = 0
}

variable "gpu_node_pool_max_count" {
  description = "Maximum node count for GPU node pool auto-scaling"
  type        = number
  default     = 5
}

variable "gpu_node_pool_enable_auto_scaling" {
  description = "Enable auto-scaling for GPU node pool"
  type        = bool
  default     = true
}

variable "gpu_node_pool_os_disk_size" {
  description = "OS disk size in GB for GPU node pool"
  type        = number
  default     = 512
}

variable "gpu_node_pool_taints" {
  description = "Additional taints for GPU node pool"
  type        = list(string)
  default     = []
}

# Network Configuration
variable "dns_service_ip" {
  description = "DNS service IP address for Kubernetes"
  type        = string
  default     = "10.0.0.10"
}

variable "service_cidr" {
  description = "CIDR for Kubernetes services"
  type        = string
  default     = "10.0.0.0/16"
}

variable "max_pods_per_node" {
  description = "Maximum number of pods per node"
  type        = number
  default     = 110
}

variable "outbound_type" {
  description = "Outbound routing method (loadBalancer, userDefinedRouting)"
  type        = string
  default     = "loadBalancer"
  validation {
    condition     = contains(["loadBalancer", "userDefinedRouting", "managedNATGateway", "userAssignedNATGateway"], var.outbound_type)
    error_message = "Outbound type must be loadBalancer, userDefinedRouting, managedNATGateway, or userAssignedNATGateway."
  }
}

variable "load_balancer_outbound_ip_count" {
  description = "Number of outbound IPs for load balancer"
  type        = number
  default     = 2
}

variable "availability_zones" {
  description = "Availability zones for node pools (eastus supports zones 1 and 2)"
  type        = list(string)
  default     = ["1", "2"]
}

# Maintenance Configuration
variable "automatic_channel_upgrade" {
  description = "Automatic channel upgrade (patch, rapid, node-image, stable, none)"
  type        = string
  default     = "stable"
  validation {
    condition     = contains(["patch", "rapid", "node-image", "stable", "none"], var.automatic_channel_upgrade)
    error_message = "Automatic channel upgrade must be patch, rapid, node-image, stable, or none."
  }
}

variable "maintenance_window_enabled" {
  description = "Enable maintenance window configuration"
  type        = bool
  default     = true
}

variable "maintenance_window_day" {
  description = "Day of the week for maintenance (Sunday, Monday, etc.)"
  type        = string
  default     = "Sunday"
}

variable "maintenance_window_hours" {
  description = "Hours for maintenance window"
  type        = list(number)
  default     = [0, 1, 2, 3, 4, 5]
}
