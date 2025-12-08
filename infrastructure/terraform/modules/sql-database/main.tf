# Azure SQL Database Module
# This module provisions Azure SQL Server and Database with security configurations

# SQL Server
resource "azurerm_mssql_server" "main" {
  name                          = "sql-${var.project_name}-${var.environment}-${var.unique_suffix}"
  resource_group_name           = var.resource_group_name
  location                      = var.location
  version                       = "12.0"
  administrator_login           = var.sql_admin_username
  administrator_login_password  = var.sql_admin_password
  minimum_tls_version           = "1.2"
  public_network_access_enabled = var.enable_private_endpoint ? false : true

  azuread_administrator {
    login_username = var.azuread_admin_login
    object_id      = var.azuread_admin_object_id
    tenant_id      = var.azuread_admin_tenant_id
  }

  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# SQL Database
resource "azurerm_mssql_database" "main" {
  name           = "sqldb-${var.project_name}-${var.environment}"
  server_id      = azurerm_mssql_server.main.id
  collation      = "SQL_Latin1_General_CP1_CI_AS"
  license_type   = "LicenseIncluded"
  max_size_gb    = var.max_size_gb
  read_scale     = var.environment == "prod" ? true : false
  sku_name       = var.database_sku
  zone_redundant = var.environment == "prod" ? true : false

  short_term_retention_policy {
    retention_days           = var.environment == "prod" ? 35 : 7
    backup_interval_in_hours = 24
  }

  dynamic "long_term_retention_policy" {
    for_each = var.environment == "prod" ? [1] : []
    content {
      weekly_retention  = "P4W"
      monthly_retention = "P12M"
      yearly_retention  = "P5Y"
      week_of_year      = 1
    }
  }

  dynamic "threat_detection_policy" {
    for_each = var.enable_defender ? [1] : []
    content {
      state                      = "Enabled"
      email_account_admins       = "Enabled"
      email_addresses            = var.security_alert_emails
      retention_days             = 30
      storage_endpoint           = var.security_storage_endpoint
      storage_account_access_key = var.security_storage_account_key
    }
  }

  tags = var.tags
}

# Firewall Rules for allowed IP addresses
resource "azurerm_mssql_firewall_rule" "allowed_ips" {
  for_each = toset(var.allowed_ip_addresses)

  name             = "allow-${replace(each.value, ".", "-")}"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = each.value
  end_ip_address   = each.value
}

# Allow Azure Services
resource "azurerm_mssql_firewall_rule" "azure_services" {
  count = var.allow_azure_services ? 1 : 0

  name             = "AllowAzureServices"
  server_id        = azurerm_mssql_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Virtual Network Rule for subnet access
resource "azurerm_mssql_virtual_network_rule" "main" {
  count = var.enable_vnet_rule ? 1 : 0

  name      = "vnet-rule-${var.environment}"
  server_id = azurerm_mssql_server.main.id
  subnet_id = var.subnet_id
}

# Private Endpoint (if enabled)
resource "azurerm_private_endpoint" "sql" {
  count = var.enable_private_endpoint ? 1 : 0

  name                = "pe-sql-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-sql-${var.project_name}-${var.environment}"
    private_connection_resource_id = azurerm_mssql_server.main.id
    is_manual_connection           = false
    subresource_names              = ["sqlServer"]
  }

  tags = var.tags
}

# Advanced Threat Protection (Microsoft Defender for SQL)
resource "azurerm_mssql_server_security_alert_policy" "main" {
  count = var.enable_defender ? 1 : 0

  resource_group_name = var.resource_group_name
  server_name         = azurerm_mssql_server.main.name
  state               = "Enabled"
  email_account_admins = true
  email_addresses      = var.security_alert_emails
  retention_days       = 30
}

# Vulnerability Assessment
resource "azurerm_mssql_server_vulnerability_assessment" "main" {
  count = var.enable_defender && var.security_storage_endpoint != null ? 1 : 0

  server_security_alert_policy_id = azurerm_mssql_server_security_alert_policy.main[0].id
  storage_container_path          = "${var.security_storage_endpoint}vulnerability-assessment/"
  storage_account_access_key      = var.security_storage_account_key

  recurring_scans {
    enabled                   = true
    email_subscription_admins = true
    emails                    = var.security_alert_emails
  }
}

# Transparent Data Encryption (enabled by default, but explicitly configured)
resource "azurerm_mssql_database_extended_auditing_policy" "main" {
  database_id                             = azurerm_mssql_database.main.id
  storage_endpoint                        = var.audit_storage_endpoint
  storage_account_access_key              = var.audit_storage_account_key
  storage_account_access_key_is_secondary = false
  retention_in_days                       = var.environment == "prod" ? 90 : 30
  log_monitoring_enabled                  = true
}
