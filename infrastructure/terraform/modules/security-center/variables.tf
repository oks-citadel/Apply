variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name for alerts"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "defender_tier" {
  description = "Microsoft Defender for Cloud tier (Free or Standard)"
  type        = string
  default     = "Standard"
  validation {
    condition     = contains(["Free", "Standard"], var.defender_tier)
    error_message = "Defender tier must be Free or Standard."
  }
}

variable "security_contact_email" {
  description = "Email for security alerts"
  type        = string
}

variable "security_contact_phone" {
  description = "Phone number for security alerts"
  type        = string
  default     = ""
}

variable "enable_auto_provisioning" {
  description = "Enable auto-provisioning of monitoring agents"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for security logs"
  type        = string
  default     = null
}

variable "action_group_id" {
  description = "Action group ID for security alerts"
  type        = string
  default     = null
}

variable "enable_security_benchmark" {
  description = "Enable Azure Security Benchmark policy assignment"
  type        = bool
  default     = true
}

variable "security_alerts" {
  description = "Map of security activity log alerts"
  type = map(object({
    name           = string
    description    = string
    category       = string
    operation_name = string
    level          = string
  }))
  default = {
    policy_assignment = {
      name           = "policy-assignment-alert"
      description    = "Alert on policy assignments"
      category       = "Policy"
      operation_name = "Microsoft.Authorization/policyAssignments/write"
      level          = "Informational"
    }
    security_solution = {
      name           = "security-solution-alert"
      description    = "Alert on security solution changes"
      category       = "Security"
      operation_name = "Microsoft.Security/securitySolutions/write"
      level          = "Informational"
    }
    role_assignment = {
      name           = "role-assignment-alert"
      description    = "Alert on role assignments"
      category       = "Administrative"
      operation_name = "Microsoft.Authorization/roleAssignments/write"
      level          = "Informational"
    }
  }
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
