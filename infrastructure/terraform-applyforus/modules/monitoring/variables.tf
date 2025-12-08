variable "environment" {
  description = "Environment name"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "resource_group_id" {
  description = "ID of the resource group"
  type        = string
  default     = null
}

variable "resource_prefix" {
  description = "Prefix for resource naming"
  type        = string
}

variable "retention_days" {
  description = "Retention days for logs and metrics"
  type        = number
  default     = 30
}

variable "sampling_percentage" {
  description = "Sampling percentage for Application Insights"
  type        = number
  default     = 100
}

variable "alert_email_address" {
  description = "Email address for alerts"
  type        = string
  default     = "admin@applyforus.com"
}

variable "webhook_url" {
  description = "Webhook URL for alerts (Slack, Teams, etc.)"
  type        = string
  default     = null
}

variable "aks_cluster_id" {
  description = "ID of the AKS cluster for monitoring"
  type        = string
  default     = null
}

variable "app_gateway_id" {
  description = "ID of the Application Gateway for monitoring"
  type        = string
  default     = null
}

variable "enable_budget_alerts" {
  description = "Enable budget alerts"
  type        = bool
  default     = true
}

variable "monthly_budget_amount" {
  description = "Monthly budget amount in USD"
  type        = number
  default     = 1000
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
