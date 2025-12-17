# ============================================================================
# Key Vault Secrets Module Variables
# ============================================================================

variable "key_vault_id" {
  description = "ID of the Azure Key Vault"
  type        = string
}

# ============================================================================
# Database Secrets
# ============================================================================

variable "postgres_connection_string" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
  default     = ""
}

variable "postgres_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  sensitive   = true
  default     = ""
}

variable "postgres_admin_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "sql_connection_string" {
  description = "SQL Database connection string (legacy)"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Cache and Messaging
# ============================================================================

variable "redis_connection_string" {
  description = "Redis Cache connection string"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis Cache password"
  type        = string
  sensitive   = true
}

variable "servicebus_connection_string" {
  description = "Azure Service Bus connection string"
  type        = string
  sensitive   = true
}

# ============================================================================
# Authentication and Security
# ============================================================================

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Session encryption secret"
  type        = string
  sensitive   = true
}

variable "encryption_key" {
  description = "Application data encryption key"
  type        = string
  sensitive   = true
}

# ============================================================================
# OAuth Providers
# ============================================================================

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "linkedin_client_id" {
  description = "LinkedIn OAuth client ID"
  type        = string
  default     = ""
}

variable "linkedin_client_secret" {
  description = "LinkedIn OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_client_id" {
  description = "GitHub OAuth client ID"
  type        = string
  default     = ""
}

variable "github_client_secret" {
  description = "GitHub OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Cloud Storage
# ============================================================================

variable "azure_storage_connection_string" {
  description = "Azure Storage connection string"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_storage_account_key" {
  description = "Azure Storage account key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_access_key_id" {
  description = "AWS access key ID for S3"
  type        = string
  sensitive   = true
  default     = ""
}

variable "aws_secret_access_key" {
  description = "AWS secret access key for S3"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# AI Services
# ============================================================================

variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "anthropic_api_key" {
  description = "Anthropic Claude API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "azure_openai_api_key" {
  description = "Azure OpenAI API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "pinecone_api_key" {
  description = "Pinecone vector database API key"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Email and Notifications
# ============================================================================

variable "sendgrid_api_key" {
  description = "SendGrid API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
  default     = ""
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "firebase_private_key" {
  description = "Firebase Cloud Messaging private key"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Payment Providers
# ============================================================================

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Job Board APIs
# ============================================================================

variable "indeed_api_key" {
  description = "Indeed API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "linkedin_api_key" {
  description = "LinkedIn API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "glassdoor_api_key" {
  description = "Glassdoor API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ziprecruiter_api_key" {
  description = "ZipRecruiter API key"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Monitoring
# ============================================================================

variable "app_insights_key" {
  description = "Application Insights instrumentation key"
  type        = string
  sensitive   = true
}

variable "app_insights_connection_string" {
  description = "Application Insights connection string"
  type        = string
  sensitive   = true
}

variable "sentry_dsn" {
  description = "Sentry DSN for error tracking"
  type        = string
  sensitive   = true
  default     = ""
}

# ============================================================================
# Search Services
# ============================================================================

variable "elasticsearch_password" {
  description = "Elasticsearch password"
  type        = string
  sensitive   = true
  default     = ""
}
