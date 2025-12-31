# ============================================================================
# IDENTITY MODULE - Variables
# ApplyForUs SaaS Platform
# ============================================================================

# ============================================================================
# CORE CONFIGURATION
# ============================================================================

variable "project_name" {
  description = "Project name prefix for resource naming (lowercase, no spaces)"
  type        = string
  default     = "applyforus"

  validation {
    condition     = can(regex("^[a-z0-9-]{3,20}$", var.project_name))
    error_message = "Project name must be 3-20 characters, lowercase alphanumeric and hyphens only."
  }
}

variable "project_display_name" {
  description = "Display name for the project (used in descriptions)"
  type        = string
  default     = "ApplyForUs"
}

variable "environment" {
  description = "Environment name"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "domain_name" {
  description = "Primary domain name for the platform"
  type        = string
  default     = "applyforus.com"
}

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = list(string)
  default     = []
}

# ============================================================================
# APP REGISTRATION CONFIGURATION
# ============================================================================

variable "sign_in_audience" {
  description = "Who can sign in to the application"
  type        = string
  default     = "AzureADandPersonalMicrosoftAccount"

  validation {
    condition = contains([
      "AzureADMyOrg",
      "AzureADMultipleOrgs",
      "AzureADandPersonalMicrosoftAccount",
      "PersonalMicrosoftAccount"
    ], var.sign_in_audience)
    error_message = "Sign in audience must be a valid Azure AD audience type."
  }
}

variable "api_identifier_uri" {
  description = "Identifier URI for the API application"
  type        = string
  default     = "api://applyforus-api"
}

variable "create_client_secrets" {
  description = "Whether to create client secrets for applications"
  type        = bool
  default     = true
}

variable "client_secret_expiry" {
  description = "Expiry duration for client secrets (e.g., '8760h' for 1 year)"
  type        = string
  default     = "17520h" # 2 years
}

variable "automation_secret_expiry" {
  description = "Expiry duration for automation app secret"
  type        = string
  default     = "8760h" # 1 year
}

# ============================================================================
# REDIRECT URIs
# ============================================================================

variable "web_homepage_url" {
  description = "Homepage URL for the web application"
  type        = string
  default     = "https://applyforus.com"
}

variable "web_logout_url" {
  description = "Logout URL for the web application"
  type        = string
  default     = "https://applyforus.com/auth/logout"
}

variable "web_redirect_uris" {
  description = "Redirect URIs for web application"
  type        = list(string)
  default = [
    "https://applyforus.com/auth/callback",
    "https://applyforus.com/api/auth/callback/azure-ad",
    "https://www.applyforus.com/auth/callback",
  ]
}

variable "spa_redirect_uris" {
  description = "Redirect URIs for Single Page Application"
  type        = list(string)
  default = [
    "https://applyforus.com/",
    "https://www.applyforus.com/",
    "http://localhost:3000/",
    "http://localhost:3000/auth/callback",
  ]
}

variable "mobile_redirect_uris" {
  description = "Redirect URIs for mobile/native applications"
  type        = list(string)
  default = [
    "applyforus://auth/callback",
    "com.applyforus.app://callback",
    "msauth.com.applyforus.app://auth",
  ]
}

# ============================================================================
# SUBSCRIPTION TIERS
# ============================================================================

variable "subscription_tiers" {
  description = "List of subscription tier names (lowercase)"
  type        = list(string)
  default = [
    "freemium",
    "starter",
    "basic",
    "professional",
    "advanced_career",
    "executive_elite"
  ]

  validation {
    condition     = length(var.subscription_tiers) > 0
    error_message = "At least one subscription tier must be defined."
  }
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

variable "create_security_groups" {
  description = "Whether to create security groups for subscription tiers"
  type        = bool
  default     = true
}

variable "enable_dynamic_membership" {
  description = "Enable dynamic group membership (requires Azure AD P1/P2)"
  type        = bool
  default     = false
}

# ============================================================================
# CLAIMS AND PERMISSIONS
# ============================================================================

variable "enable_group_claims" {
  description = "Include group claims in access tokens"
  type        = bool
  default     = true
}

variable "enable_graph_permissions" {
  description = "Enable Graph API permissions for automation app"
  type        = bool
  default     = true
}

variable "grant_admin_consent" {
  description = "Automatically grant admin consent for Graph permissions"
  type        = bool
  default     = false
}

# ============================================================================
# B2C SPECIFIC (Optional)
# ============================================================================

variable "b2c_tenant_id" {
  description = "Azure AD B2C tenant ID (if using B2C)"
  type        = string
  default     = ""
}

variable "b2c_tenant_name" {
  description = "Azure AD B2C tenant name (e.g., 'applyforusb2c')"
  type        = string
  default     = ""
}

variable "b2c_policy_names" {
  description = "B2C user flow/policy names"
  type = object({
    sign_up_sign_in = string
    password_reset  = string
    profile_edit    = string
  })
  default = {
    sign_up_sign_in = "B2C_1_SignUpSignIn"
    password_reset  = "B2C_1_PasswordReset"
    profile_edit    = "B2C_1_ProfileEdit"
  }
}

# ============================================================================
# TAGGING
# ============================================================================

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
