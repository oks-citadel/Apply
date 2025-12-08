# ============================================================================
# DNS Module Variables
# ============================================================================

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the DNS zone (e.g., applyforus.com)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]*\\.[a-z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format"
  }
}

variable "tags" {
  description = "Tags to apply to DNS resources"
  type        = map(string)
  default     = {}
}

# ============================================================================
# IP Address Configuration
# ============================================================================

variable "ingress_public_ip" {
  description = "Public IP address of the ingress controller/Application Gateway"
  type        = string
  default     = null
}

variable "staging_public_ip" {
  description = "Public IP address for staging environment"
  type        = string
  default     = null
}

variable "enable_staging" {
  description = "Enable staging subdomain DNS record"
  type        = bool
  default     = false
}

# ============================================================================
# Azure Container Registry Configuration
# ============================================================================

variable "enable_acr_subdomain" {
  description = "Enable ACR subdomain CNAME record"
  type        = bool
  default     = false
}

variable "acr_login_server" {
  description = "Azure Container Registry login server FQDN"
  type        = string
  default     = null
}

# ============================================================================
# Domain Verification
# ============================================================================

variable "verification_records" {
  description = "List of TXT records for domain verification"
  type        = list(string)
  default     = []
}

# ============================================================================
# ACME/Let's Encrypt Configuration
# ============================================================================

variable "enable_acme_dns_validation" {
  description = "Enable ACME DNS challenge validation record"
  type        = bool
  default     = false
}

# ============================================================================
# Email Configuration (MX Records)
# ============================================================================

variable "enable_mx_records" {
  description = "Enable MX records for email"
  type        = bool
  default     = false
}

variable "mx_records" {
  description = "List of MX records for email"
  type = list(object({
    preference = number
    exchange   = string
  }))
  default = []
}

variable "spf_record" {
  description = "SPF record for email authentication"
  type        = string
  default     = null
}

variable "dmarc_record" {
  description = "DMARC record for email security"
  type        = string
  default     = null
}

# ============================================================================
# Custom DNS Records
# ============================================================================

variable "custom_a_records" {
  description = "Custom A records to create"
  type        = map(list(string))
  default     = {}
}

variable "custom_cname_records" {
  description = "Custom CNAME records to create"
  type        = map(string)
  default     = {}
}

# ============================================================================
# Monitoring Configuration
# ============================================================================

variable "enable_diagnostics" {
  description = "Enable diagnostic logs for DNS zone"
  type        = bool
  default     = true
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for DNS diagnostics"
  type        = string
  default     = null
}
