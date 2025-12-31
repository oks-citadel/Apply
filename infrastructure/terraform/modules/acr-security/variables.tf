# ACR Security Module Variables

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
}

variable "acr_id" {
  description = "Resource ID of the Azure Container Registry"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "defender_tier" {
  description = "Microsoft Defender tier (Free or Standard)"
  type        = string
  default     = "Standard"
}

variable "enable_content_trust" {
  description = "Enable Docker Content Trust for image signing"
  type        = bool
  default     = true
}

variable "enable_retention_policy" {
  description = "Enable automatic deletion of untagged manifests"
  type        = bool
  default     = true
}

variable "retention_days" {
  description = "Number of days to retain untagged manifests"
  type        = number
  default     = 7
}

variable "enable_quarantine" {
  description = "Enable quarantine policy for new images"
  type        = bool
  default     = true
}

variable "enable_private_endpoint" {
  description = "Create private endpoint for ACR"
  type        = bool
  default     = false
}

variable "subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = ""
}

variable "vnet_id" {
  description = "Virtual Network ID for private DNS zone link"
  type        = string
  default     = ""
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for diagnostics"
  type        = string
}

variable "security_webhook_url" {
  description = "Webhook URL for security event notifications"
  type        = string
  default     = ""
}

variable "enforce_signed_images" {
  description = "Enforce that only signed images can be deployed"
  type        = bool
  default     = true
}

variable "aks_cluster_id" {
  description = "AKS cluster resource ID for policy assignment"
  type        = string
  default     = ""
}

variable "generate_signing_script" {
  description = "Generate helper script for image signing"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "acr-security"
  }
}

variable "allowed_image_patterns" {
  description = "Allowed image patterns for policy enforcement"
  type        = list(string)
  default     = []
}
