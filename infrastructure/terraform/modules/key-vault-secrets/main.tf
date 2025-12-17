# ============================================================================
# Key Vault Secrets Module
# ============================================================================
# This module manages all application secrets in Azure Key Vault
# Secrets are categorized by type for better organization and access control
# ============================================================================

# ============================================================================
# Database Secrets
# ============================================================================

# PostgreSQL Connection String
resource "azurerm_key_vault_secret" "postgres_connection_string" {
  count        = var.postgres_connection_string != "" ? 1 : 0
  name         = "postgres-connection-string"
  value        = var.postgres_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Database"
    Category  = "PostgreSQL"
  }
}

# PostgreSQL Admin Username
resource "azurerm_key_vault_secret" "postgres_user" {
  count        = var.postgres_admin_username != "" ? 1 : 0
  name         = "postgres-user"
  value        = var.postgres_admin_username
  key_vault_id = var.key_vault_id
  content_type = "username"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Database"
    Category  = "PostgreSQL"
  }
}

# PostgreSQL Admin Password
resource "azurerm_key_vault_secret" "postgres_password" {
  count        = var.postgres_admin_password != "" ? 1 : 0
  name         = "postgres-password"
  value        = var.postgres_admin_password
  key_vault_id = var.key_vault_id
  content_type = "password"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Database"
    Category  = "PostgreSQL"
  }
}

# SQL Database Connection String (Legacy - for backward compatibility)
resource "azurerm_key_vault_secret" "sql_connection_string" {
  count        = var.sql_connection_string != "" ? 1 : 0
  name         = "sql-connection-string"
  value        = var.sql_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Database"
    Category  = "SQL"
  }
}

# ============================================================================
# Cache and Messaging Secrets
# ============================================================================

# Redis Cache Connection String
resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = var.redis_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Cache"
    Category  = "Redis"
  }
}

# Redis Password
resource "azurerm_key_vault_secret" "redis_password" {
  name         = "redis-password"
  value        = var.redis_password
  key_vault_id = var.key_vault_id
  content_type = "password"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Cache"
    Category  = "Redis"
  }
}

# Service Bus Connection String
resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "servicebus-connection-string"
  value        = var.servicebus_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Messaging"
    Category  = "ServiceBus"
  }
}

# ============================================================================
# Authentication and Security Secrets
# ============================================================================

# JWT Secret
resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = var.key_vault_id
  content_type = "secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Authentication"
    Category  = "JWT"
  }
}

# JWT Refresh Secret
resource "azurerm_key_vault_secret" "jwt_refresh_secret" {
  name         = "jwt-refresh-secret"
  value        = var.jwt_refresh_secret
  key_vault_id = var.key_vault_id
  content_type = "secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Authentication"
    Category  = "JWT"
  }
}

# Session Secret
resource "azurerm_key_vault_secret" "session_secret" {
  name         = "session-secret"
  value        = var.session_secret
  key_vault_id = var.key_vault_id
  content_type = "secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Authentication"
    Category  = "Session"
  }
}

# Encryption Key
resource "azurerm_key_vault_secret" "encryption_key" {
  name         = "encryption-key"
  value        = var.encryption_key
  key_vault_id = var.key_vault_id
  content_type = "encryption-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Security"
    Category  = "Encryption"
  }
}

# ============================================================================
# OAuth Provider Secrets
# ============================================================================

# Google OAuth Client ID
resource "azurerm_key_vault_secret" "google_client_id" {
  count        = var.google_client_id != "" ? 1 : 0
  name         = "google-client-id"
  value        = var.google_client_id
  key_vault_id = var.key_vault_id
  content_type = "client-id"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "Google"
  }
}

# Google OAuth Client Secret
resource "azurerm_key_vault_secret" "google_client_secret" {
  count        = var.google_client_secret != "" ? 1 : 0
  name         = "google-client-secret"
  value        = var.google_client_secret
  key_vault_id = var.key_vault_id
  content_type = "client-secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "Google"
  }
}

# LinkedIn OAuth Client ID
resource "azurerm_key_vault_secret" "linkedin_client_id" {
  count        = var.linkedin_client_id != "" ? 1 : 0
  name         = "linkedin-client-id"
  value        = var.linkedin_client_id
  key_vault_id = var.key_vault_id
  content_type = "client-id"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "LinkedIn"
  }
}

# LinkedIn OAuth Client Secret
resource "azurerm_key_vault_secret" "linkedin_client_secret" {
  count        = var.linkedin_client_secret != "" ? 1 : 0
  name         = "linkedin-client-secret"
  value        = var.linkedin_client_secret
  key_vault_id = var.key_vault_id
  content_type = "client-secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "LinkedIn"
  }
}

# GitHub OAuth Client ID
resource "azurerm_key_vault_secret" "github_client_id" {
  count        = var.github_client_id != "" ? 1 : 0
  name         = "github-client-id"
  value        = var.github_client_id
  key_vault_id = var.key_vault_id
  content_type = "client-id"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "GitHub"
  }
}

# GitHub OAuth Client Secret
resource "azurerm_key_vault_secret" "github_client_secret" {
  count        = var.github_client_secret != "" ? 1 : 0
  name         = "github-client-secret"
  value        = var.github_client_secret
  key_vault_id = var.key_vault_id
  content_type = "client-secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "OAuth"
    Category  = "GitHub"
  }
}

# ============================================================================
# Cloud Storage Secrets
# ============================================================================

# Azure Storage Connection String
resource "azurerm_key_vault_secret" "azure_storage_connection_string" {
  count        = var.azure_storage_connection_string != "" ? 1 : 0
  name         = "azure-storage-connection-string"
  value        = var.azure_storage_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Storage"
    Category  = "Azure"
  }
}

# Azure Storage Account Key
resource "azurerm_key_vault_secret" "azure_storage_account_key" {
  count        = var.azure_storage_account_key != "" ? 1 : 0
  name         = "azure-storage-account-key"
  value        = var.azure_storage_account_key
  key_vault_id = var.key_vault_id
  content_type = "access-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Storage"
    Category  = "Azure"
  }
}

# AWS Access Key ID
resource "azurerm_key_vault_secret" "aws_access_key_id" {
  count        = var.aws_access_key_id != "" ? 1 : 0
  name         = "aws-access-key-id"
  value        = var.aws_access_key_id
  key_vault_id = var.key_vault_id
  content_type = "access-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Storage"
    Category  = "AWS"
  }
}

# AWS Secret Access Key
resource "azurerm_key_vault_secret" "aws_secret_access_key" {
  count        = var.aws_secret_access_key != "" ? 1 : 0
  name         = "aws-secret-access-key"
  value        = var.aws_secret_access_key
  key_vault_id = var.key_vault_id
  content_type = "secret-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Storage"
    Category  = "AWS"
  }
}

# ============================================================================
# AI Service API Keys
# ============================================================================

# OpenAI API Key
resource "azurerm_key_vault_secret" "openai_api_key" {
  count        = var.openai_api_key != "" ? 1 : 0
  name         = "openai-api-key"
  value        = var.openai_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "AI"
    Category  = "OpenAI"
  }
}

# Anthropic API Key
resource "azurerm_key_vault_secret" "anthropic_api_key" {
  count        = var.anthropic_api_key != "" ? 1 : 0
  name         = "anthropic-api-key"
  value        = var.anthropic_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "AI"
    Category  = "Anthropic"
  }
}

# Azure OpenAI API Key
resource "azurerm_key_vault_secret" "azure_openai_api_key" {
  count        = var.azure_openai_api_key != "" ? 1 : 0
  name         = "azure-openai-api-key"
  value        = var.azure_openai_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "AI"
    Category  = "AzureOpenAI"
  }
}

# Pinecone API Key
resource "azurerm_key_vault_secret" "pinecone_api_key" {
  count        = var.pinecone_api_key != "" ? 1 : 0
  name         = "pinecone-api-key"
  value        = var.pinecone_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "AI"
    Category  = "Pinecone"
  }
}

# ============================================================================
# Email and Notification Secrets
# ============================================================================

# SendGrid API Key
resource "azurerm_key_vault_secret" "sendgrid_api_key" {
  count        = var.sendgrid_api_key != "" ? 1 : 0
  name         = "sendgrid-api-key"
  value        = var.sendgrid_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Email"
    Category  = "SendGrid"
  }
}

# SMTP Username
resource "azurerm_key_vault_secret" "smtp_username" {
  count        = var.smtp_username != "" ? 1 : 0
  name         = "smtp-username"
  value        = var.smtp_username
  key_vault_id = var.key_vault_id
  content_type = "username"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Email"
    Category  = "SMTP"
  }
}

# SMTP Password
resource "azurerm_key_vault_secret" "smtp_password" {
  count        = var.smtp_password != "" ? 1 : 0
  name         = "smtp-password"
  value        = var.smtp_password
  key_vault_id = var.key_vault_id
  content_type = "password"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Email"
    Category  = "SMTP"
  }
}

# Firebase Private Key
resource "azurerm_key_vault_secret" "firebase_private_key" {
  count        = var.firebase_private_key != "" ? 1 : 0
  name         = "firebase-private-key"
  value        = var.firebase_private_key
  key_vault_id = var.key_vault_id
  content_type = "private-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Notification"
    Category  = "Firebase"
  }
}

# ============================================================================
# Payment Provider Secrets
# ============================================================================

# Stripe Secret Key
resource "azurerm_key_vault_secret" "stripe_secret_key" {
  count        = var.stripe_secret_key != "" ? 1 : 0
  name         = "stripe-secret-key"
  value        = var.stripe_secret_key
  key_vault_id = var.key_vault_id
  content_type = "secret-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Payment"
    Category  = "Stripe"
  }
}

# Stripe Webhook Secret
resource "azurerm_key_vault_secret" "stripe_webhook_secret" {
  count        = var.stripe_webhook_secret != "" ? 1 : 0
  name         = "stripe-webhook-secret"
  value        = var.stripe_webhook_secret
  key_vault_id = var.key_vault_id
  content_type = "webhook-secret"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Payment"
    Category  = "Stripe"
  }
}

# ============================================================================
# Job Board API Keys
# ============================================================================

# Indeed API Key
resource "azurerm_key_vault_secret" "indeed_api_key" {
  count        = var.indeed_api_key != "" ? 1 : 0
  name         = "indeed-api-key"
  value        = var.indeed_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "JobBoard"
    Category  = "Indeed"
  }
}

# LinkedIn API Key
resource "azurerm_key_vault_secret" "linkedin_api_key" {
  count        = var.linkedin_api_key != "" ? 1 : 0
  name         = "linkedin-api-key"
  value        = var.linkedin_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "JobBoard"
    Category  = "LinkedIn"
  }
}

# Glassdoor API Key
resource "azurerm_key_vault_secret" "glassdoor_api_key" {
  count        = var.glassdoor_api_key != "" ? 1 : 0
  name         = "glassdoor-api-key"
  value        = var.glassdoor_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "JobBoard"
    Category  = "Glassdoor"
  }
}

# ZipRecruiter API Key
resource "azurerm_key_vault_secret" "ziprecruiter_api_key" {
  count        = var.ziprecruiter_api_key != "" ? 1 : 0
  name         = "ziprecruiter-api-key"
  value        = var.ziprecruiter_api_key
  key_vault_id = var.key_vault_id
  content_type = "api-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "JobBoard"
    Category  = "ZipRecruiter"
  }
}

# ============================================================================
# Monitoring Secrets
# ============================================================================

# Application Insights Instrumentation Key
resource "azurerm_key_vault_secret" "appinsights_instrumentation_key" {
  name         = "appinsights-instrumentation-key"
  value        = var.app_insights_key
  key_vault_id = var.key_vault_id
  content_type = "instrumentation-key"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Monitoring"
    Category  = "ApplicationInsights"
  }
}

# Application Insights Connection String
resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "appinsights-connection-string"
  value        = var.app_insights_connection_string
  key_vault_id = var.key_vault_id
  content_type = "connection-string"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Monitoring"
    Category  = "ApplicationInsights"
  }
}

# Sentry DSN
resource "azurerm_key_vault_secret" "sentry_dsn" {
  count        = var.sentry_dsn != "" ? 1 : 0
  name         = "sentry-dsn"
  value        = var.sentry_dsn
  key_vault_id = var.key_vault_id
  content_type = "dsn"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Monitoring"
    Category  = "Sentry"
  }
}

# ============================================================================
# Search Service Secrets
# ============================================================================

# Elasticsearch Password
resource "azurerm_key_vault_secret" "elasticsearch_password" {
  count        = var.elasticsearch_password != "" ? 1 : 0
  name         = "elasticsearch-password"
  value        = var.elasticsearch_password
  key_vault_id = var.key_vault_id
  content_type = "password"

  tags = {
    ManagedBy = "Terraform"
    Type      = "Search"
    Category  = "Elasticsearch"
  }
}
