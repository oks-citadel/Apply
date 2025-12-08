# Random suffix for globally unique storage account name
resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = "${replace(var.resource_prefix, "-", "")}st${random_string.storage_suffix.result}"
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.replication_type
  account_kind             = "StorageV2"
  access_tier              = "Hot"
  enable_https_traffic_only = true
  min_tls_version          = "TLS1_2"

  # Enable versioning and soft delete
  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = var.backup_retention_days
    }

    container_delete_retention_policy {
      days = var.backup_retention_days
    }

    # Enable blob lifecycle management
    last_access_time_enabled = true
  }

  # Network rules
  network_rules {
    default_action             = var.enable_private_endpoint ? "Deny" : "Allow"
    bypass                     = ["AzureServices"]
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = []
  }

  # Advanced threat protection
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Storage Containers
resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Storage Management Policy (Lifecycle Management)
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  # Rule for logs - delete after 90 days
  rule {
    name    = "delete-old-logs"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 90
      }

      snapshot {
        delete_after_days_since_creation_greater_than = 90
      }
    }
  }

  # Rule for backups - move to cool tier after 30 days, delete after 365 days
  rule {
    name    = "backup-lifecycle"
    enabled = true

    filters {
      prefix_match = ["backups/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than = 365
      }

      snapshot {
        tier_to_cold_after_days_since_creation_greater_than = 30
        delete_after_days_since_creation_greater_than = 90
      }
    }
  }

  # Rule for temporary uploads - delete after 7 days
  rule {
    name    = "delete-old-uploads"
    enabled = true

    filters {
      prefix_match = ["uploads/temp/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 7
      }
    }
  }
}

# Private endpoint for Blob storage
resource "azurerm_private_endpoint" "blob" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "${var.resource_prefix}-blob-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.resource_prefix}-blob-psc"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  tags = var.tags
}

# Advanced Threat Protection
resource "azurerm_advanced_threat_protection" "storage" {
  target_resource_id = azurerm_storage_account.main.id
  enabled            = var.enable_threat_protection
}

# Diagnostic settings for Storage Account
resource "azurerm_monitor_diagnostic_setting" "storage" {
  count                      = var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "${var.resource_prefix}-storage-diag"
  target_resource_id         = "${azurerm_storage_account.main.id}/blobServices/default/"
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
    enabled  = true
  }
}
