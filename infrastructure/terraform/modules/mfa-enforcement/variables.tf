# MFA Enforcement Module Variables

variable "tenant_id" {
  description = "Azure AD tenant ID"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name for alerting resources"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "enforce_mfa" {
  description = "Enforce MFA for all users"
  type        = bool
  default     = true
}

variable "enable_risk_based_mfa" {
  description = "Enable risk-based MFA policies"
  type        = bool
  default     = true
}

variable "enforce_mfa_billing" {
  description = "Enforce MFA specifically for billing operations"
  type        = bool
  default     = true
}

variable "mfa_excluded_users" {
  description = "User IDs to exclude from MFA requirement"
  type        = list(string)
  default     = []
}

variable "mfa_excluded_groups" {
  description = "Group IDs to exclude from MFA requirement"
  type        = list(string)
  default     = []
}

variable "trusted_locations" {
  description = "Named location IDs to exclude from MFA (trusted networks)"
  type        = list(string)
  default     = []
}

variable "session_lifetime_hours" {
  description = "Session lifetime in hours before re-authentication"
  type        = number
  default     = 12
}

variable "admin_roles" {
  description = "Admin role IDs that require MFA"
  type        = list(string)
  default = [
    "62e90394-69f5-4237-9190-012177145e10", # Global Administrator
    "194ae4cb-b126-40b2-bd5b-6091b380977d", # Security Administrator
    "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3", # Application Administrator
    "7be44c8a-adaf-4e2a-84d6-ab2649e08a13", # Privileged Authentication Administrator
    "e8611ab8-c189-46e8-94e1-60213ab1f814", # Privileged Role Administrator
  ]
}

variable "billing_app_ids" {
  description = "Application IDs for billing/payment apps requiring MFA"
  type        = list(string)
  default     = []
}

variable "corporate_ip_ranges" {
  description = "Corporate IP ranges to mark as trusted"
  type        = list(string)
  default     = []
}

variable "blocked_countries" {
  description = "ISO 3166-1 alpha-2 country codes to block"
  type        = list(string)
  default     = []
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for sign-in logging"
  type        = string
  default     = ""
}

variable "enable_mfa_alerts" {
  description = "Enable alerting for MFA failures"
  type        = bool
  default     = true
}

variable "alert_action_group_ids" {
  description = "Action group IDs for MFA alerts"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default = {
    Environment = "production"
    ManagedBy   = "terraform"
    Purpose     = "mfa-enforcement"
  }
}
