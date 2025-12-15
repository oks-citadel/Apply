# ============================================================================
# PostgreSQL Flexible Server Module Outputs
# ============================================================================
# This file defines all output values from the PostgreSQL Flexible Server module.
# These outputs provide connection information and identifiers needed by
# other modules and services to connect to the PostgreSQL databases.
# ============================================================================

# ============================================================================
# Server Information
# ============================================================================

output "server_id" {
  description = "ID of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "server_name" {
  description = "Name of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "server_fqdn" {
  description = "Fully qualified domain name of the PostgreSQL Flexible Server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "server_public_network_access_enabled" {
  description = "Whether public network access is enabled"
  value       = azurerm_postgresql_flexible_server.main.public_network_access_enabled
}

# ============================================================================
# Database IDs
# ============================================================================

output "database_ids" {
  description = "Map of database IDs for all microservices"
  value = {
    auth_service         = azurerm_postgresql_flexible_server_database.auth_service.id
    user_service         = azurerm_postgresql_flexible_server_database.user_service.id
    job_service          = azurerm_postgresql_flexible_server_database.job_service.id
    resume_service       = azurerm_postgresql_flexible_server_database.resume_service.id
    notification_service = azurerm_postgresql_flexible_server_database.notification_service.id
    analytics_service    = azurerm_postgresql_flexible_server_database.analytics_service.id
    auto_apply_service   = azurerm_postgresql_flexible_server_database.auto_apply_service.id
    payment_service      = azurerm_postgresql_flexible_server_database.payment_service.id
  }
}

output "database_names" {
  description = "Map of database names for all microservices"
  value = {
    auth_service         = azurerm_postgresql_flexible_server_database.auth_service.name
    user_service         = azurerm_postgresql_flexible_server_database.user_service.name
    job_service          = azurerm_postgresql_flexible_server_database.job_service.name
    resume_service       = azurerm_postgresql_flexible_server_database.resume_service.name
    notification_service = azurerm_postgresql_flexible_server_database.notification_service.name
    analytics_service    = azurerm_postgresql_flexible_server_database.analytics_service.name
    auto_apply_service   = azurerm_postgresql_flexible_server_database.auto_apply_service.name
    payment_service      = azurerm_postgresql_flexible_server_database.payment_service.name
  }
}

# ============================================================================
# Common Connection Parameters (Shared by All Services)
# ============================================================================

output "db_host" {
  description = "Database host (FQDN) - shared by all services"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "db_port" {
  description = "Database port - shared by all services"
  value       = "5432"
}

output "db_username" {
  description = "Database administrator username - shared by all services"
  value       = var.postgres_admin_username
  sensitive   = true
}

output "db_password" {
  description = "Database administrator password - shared by all services"
  value       = var.postgres_admin_password
  sensitive   = true
}

# ============================================================================
# Service-Specific Connection Information
# ============================================================================

# Auth Service
output "auth_service_db_name" {
  description = "Database name for auth service"
  value       = azurerm_postgresql_flexible_server_database.auth_service.name
}

output "auth_service_connection_string" {
  description = "PostgreSQL connection string for auth service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.auth_service.name}?sslmode=require"
  sensitive   = true
}

# User Service
output "user_service_db_name" {
  description = "Database name for user service"
  value       = azurerm_postgresql_flexible_server_database.user_service.name
}

output "user_service_connection_string" {
  description = "PostgreSQL connection string for user service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.user_service.name}?sslmode=require"
  sensitive   = true
}

# Job Service
output "job_service_db_name" {
  description = "Database name for job service"
  value       = azurerm_postgresql_flexible_server_database.job_service.name
}

output "job_service_connection_string" {
  description = "PostgreSQL connection string for job service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.job_service.name}?sslmode=require"
  sensitive   = true
}

# Resume Service
output "resume_service_db_name" {
  description = "Database name for resume service"
  value       = azurerm_postgresql_flexible_server_database.resume_service.name
}

output "resume_service_connection_string" {
  description = "PostgreSQL connection string for resume service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.resume_service.name}?sslmode=require"
  sensitive   = true
}

# Notification Service
output "notification_service_db_name" {
  description = "Database name for notification service"
  value       = azurerm_postgresql_flexible_server_database.notification_service.name
}

output "notification_service_connection_string" {
  description = "PostgreSQL connection string for notification service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.notification_service.name}?sslmode=require"
  sensitive   = true
}

# Analytics Service
output "analytics_service_db_name" {
  description = "Database name for analytics service"
  value       = azurerm_postgresql_flexible_server_database.analytics_service.name
}

output "analytics_service_connection_string" {
  description = "PostgreSQL connection string for analytics service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.analytics_service.name}?sslmode=require"
  sensitive   = true
}

# Auto-Apply Service
output "auto_apply_service_db_name" {
  description = "Database name for auto-apply service"
  value       = azurerm_postgresql_flexible_server_database.auto_apply_service.name
}

output "auto_apply_service_connection_string" {
  description = "PostgreSQL connection string for auto-apply service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.auto_apply_service.name}?sslmode=require"
  sensitive   = true
}

# Payment Service
output "payment_service_db_name" {
  description = "Database name for payment service"
  value       = azurerm_postgresql_flexible_server_database.payment_service.name
}

output "payment_service_connection_string" {
  description = "PostgreSQL connection string for payment service"
  value       = "postgresql://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.payment_service.name}?sslmode=require"
  sensitive   = true
}

# ============================================================================
# Environment Variable Format Outputs
# ============================================================================

output "env_vars_auth_service" {
  description = "Environment variables for auth service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.auth_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_user_service" {
  description = "Environment variables for user service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.user_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_job_service" {
  description = "Environment variables for job service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.job_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_resume_service" {
  description = "Environment variables for resume service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.resume_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_notification_service" {
  description = "Environment variables for notification service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.notification_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_analytics_service" {
  description = "Environment variables for analytics service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.analytics_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_auto_apply_service" {
  description = "Environment variables for auto-apply service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.auto_apply_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

output "env_vars_payment_service" {
  description = "Environment variables for payment service in .env format"
  value = {
    DB_HOST     = azurerm_postgresql_flexible_server.main.fqdn
    DB_PORT     = "5432"
    DB_USERNAME = var.postgres_admin_username
    DB_PASSWORD = var.postgres_admin_password
    DB_DATABASE = azurerm_postgresql_flexible_server_database.payment_service.name
    DB_SSL      = "true"
  }
  sensitive = true
}

# ============================================================================
# TypeORM Connection String Format (for NestJS services)
# ============================================================================

output "typeorm_connection_strings" {
  description = "Map of TypeORM-compatible connection strings for all services"
  value = {
    auth_service         = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.auth_service.name}?ssl=true"
    user_service         = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.user_service.name}?ssl=true"
    job_service          = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.job_service.name}?ssl=true"
    resume_service       = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.resume_service.name}?ssl=true"
    notification_service = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.notification_service.name}?ssl=true"
    analytics_service    = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.analytics_service.name}?ssl=true"
    auto_apply_service   = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.auto_apply_service.name}?ssl=true"
    payment_service      = "postgres://${var.postgres_admin_username}:${var.postgres_admin_password}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.payment_service.name}?ssl=true"
  }
  sensitive = true
}
