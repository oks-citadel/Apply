# EKS Module Variables

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
}

variable "cluster_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for EKS"
  type        = list(string)
}

variable "enable_public_access" {
  description = "Enable public API endpoint"
  type        = bool
  default     = true
}

variable "enabled_log_types" {
  description = "EKS cluster log types to enable"
  type        = list(string)
  default     = ["api", "audit", "authenticator"]
}

variable "kms_key_arn" {
  description = "KMS key ARN for secrets encryption"
  type        = string
  default     = null
}

variable "node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    capacity_type  = string
    ami_type       = optional(string, "AL2023_ARM_64_STANDARD") # Default to ARM for Graviton
    min_size       = number
    max_size       = number
    desired_size   = number
    disk_size      = number
    labels         = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
}

variable "enable_karpenter" {
  description = "Enable Karpenter for autoscaling"
  type        = bool
  default     = true
}

variable "enable_container_insights" {
  description = "Enable CloudWatch Container Insights"
  type        = bool
  default     = true
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed EC2 monitoring"
  type        = bool
  default     = false
}

# Addon versions
variable "vpc_cni_version" {
  description = "VPC CNI addon version"
  type        = string
  default     = null
}

variable "kube_proxy_version" {
  description = "kube-proxy addon version"
  type        = string
  default     = null
}

variable "coredns_version" {
  description = "CoreDNS addon version"
  type        = string
  default     = null
}

variable "ebs_csi_version" {
  description = "EBS CSI driver addon version"
  type        = string
  default     = null
}
