# Data source for current Azure client configuration
data "azurerm_client_config" "current" {}

# Azure Key Vault
resource "azurerm_key_vault" "main" {
  name                = "kv-${var.project_name}-${var.environment}-${var.unique_suffix}"
  location            = var.location
  resource_group_name = var.resource_group_name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Soft delete and purge protection
  soft_delete_retention_days = 90
  purge_protection_enabled   = var.environment == "prod" ? true : false

  # Enable Key Vault for Azure services
  enabled_for_deployment          = true
  enabled_for_disk_encryption     = true
  enabled_for_template_deployment = true

  # Public network access (can be disabled if using private endpoints)
  public_network_access_enabled = var.enable_private_endpoint ? false : true

  # Network ACLs
  network_acls {
    default_action = length(var.allowed_ip_addresses) > 0 || length(var.virtual_network_rules) > 0 ? "Deny" : "Allow"
    bypass         = "AzureServices"

    # Allowed IP addresses
    ip_rules = var.allowed_ip_addresses

    # Virtual network subnet IDs
    virtual_network_subnet_ids = var.virtual_network_rules
  }

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "key-vault"
    }
  )
}

# Access policy for Terraform service principal
resource "azurerm_key_vault_access_policy" "terraform_sp" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  # Key permissions
  key_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Update",
    "Recover",
    "Purge",
    "GetRotationPolicy",
    "SetRotationPolicy"
  ]

  # Secret permissions
  secret_permissions = [
    "Get",
    "List",
    "Set",
    "Delete",
    "Recover",
    "Purge"
  ]

  # Certificate permissions
  certificate_permissions = [
    "Get",
    "List",
    "Create",
    "Delete",
    "Update",
    "Recover",
    "Purge"
  ]
}

# Diagnostic settings for Key Vault
resource "azurerm_monitor_diagnostic_setting" "key_vault" {
  count = var.enable_diagnostics ? 1 : 0

  name                       = "diag-${azurerm_key_vault.main.name}"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  # Logs
  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  # Metrics
  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
