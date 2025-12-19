# ============================================================================
# PostgreSQL Security Configurations
# ============================================================================
# This file contains additional security configurations for PostgreSQL
# Flexible Server to enhance security posture for public access.
# ============================================================================

# ============================================================================
# PostgreSQL Configuration - Log Connections
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ============================================================================
# PostgreSQL Configuration - Log Disconnections
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "log_disconnections" {
  name      = "log_disconnections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ============================================================================
# PostgreSQL Configuration - Log Duration
# ============================================================================
# Log the duration of completed statements

resource "azurerm_postgresql_flexible_server_configuration" "log_duration" {
  name      = "log_duration"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ============================================================================
# PostgreSQL Configuration - Log Checkpoints
# ============================================================================

resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# ============================================================================
# PostgreSQL Configuration - Connection Lifetime
# ============================================================================
# Close idle connections after 30 minutes (in milliseconds)

resource "azurerm_postgresql_flexible_server_configuration" "idle_in_transaction_session_timeout" {
  name      = "idle_in_transaction_session_timeout"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "1800000" # 30 minutes
}

# ============================================================================
# PostgreSQL Configuration - Statement Timeout
# ============================================================================
# Conditional configuration based on variable
# Default: disabled (0), can be set via variable

resource "azurerm_postgresql_flexible_server_configuration" "statement_timeout" {
  count = var.statement_timeout != "0" ? 1 : 0

  name      = "statement_timeout"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.statement_timeout
}

# ============================================================================
# PostgreSQL Configuration - Log Slow Queries
# ============================================================================
# Log queries that take longer than specified duration

resource "azurerm_postgresql_flexible_server_configuration" "log_min_duration_statement" {
  count = var.log_min_duration_statement != "-1" ? 1 : 0

  name      = "log_min_duration_statement"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.log_min_duration_statement
}

# ============================================================================
# PostgreSQL Configuration - Password Encryption
# ============================================================================
# Use SCRAM-SHA-256 for password encryption (PostgreSQL 13+)

resource "azurerm_postgresql_flexible_server_configuration" "password_encryption" {
  name      = "password_encryption"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "scram-sha-256"
}

# ============================================================================
# SECURITY NOTES
# ============================================================================
# 1. SSL/TLS is REQUIRED - enforced via require_secure_transport = on
# 2. Firewall rules restrict access to approved IPs only
# 3. No VNET integration - public access with security controls
# 4. All connections are logged for audit purposes
# 5. Idle transactions are terminated after 30 minutes
# 6. Use strong passwords with SCRAM-SHA-256 encryption
# 7. Review diagnostic logs regularly in Log Analytics
# ============================================================================
