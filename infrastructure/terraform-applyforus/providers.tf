provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }

    key_vault {
      purge_soft_delete_on_destroy    = var.environment != "prod"
      recover_soft_deleted_key_vaults = true
    }

    api_management {
      purge_soft_delete_on_destroy = var.environment != "prod"
      recover_soft_delete          = true
    }

    log_analytics_workspace {
      permanently_delete_on_destroy = var.environment != "prod"
    }

    application_insights {
      disable_generated_rule = false
    }

    virtual_machine {
      delete_os_disk_on_deletion     = true
      graceful_shutdown_for_stateful = true
    }
  }

  # Optionally configure using environment variables:
  # ARM_SUBSCRIPTION_ID
  # ARM_TENANT_ID
  # ARM_CLIENT_ID
  # ARM_CLIENT_SECRET
}

provider "azuread" {
  # Optionally configure using environment variables:
  # ARM_TENANT_ID
  # ARM_CLIENT_ID
  # ARM_CLIENT_SECRET
}
