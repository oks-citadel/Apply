# ============================================================================
# Terraform Backend Configuration
# ============================================================================
# This file configures the Azure Storage backend for Terraform state management.
# State files are stored remotely in Azure Blob Storage for team collaboration
# and state locking capabilities.

# ============================================================================
# IMPORTANT: Backend Configuration Instructions
# ============================================================================
#
# Before using this backend configuration, you must:
#
# 1. Create an Azure Storage Account for Terraform state:
#    az group create --name tfstate-rg --location eastus
#    az storage account create \
#      --name jobpilottfstate \
#      --resource-group tfstate-rg \
#      --location eastus \
#      --sku Standard_LRS \
#      --encryption-services blob
#
# 2. Create a blob container for state files:
#    az storage container create \
#      --name tfstate \
#      --account-name jobpilottfstate
#
# 3. Uncomment the backend configuration below
#
# 4. Initialize Terraform with backend configuration:
#    terraform init \
#      -backend-config="storage_account_name=jobpilottfstate" \
#      -backend-config="container_name=tfstate" \
#      -backend-config="key=jobpilot-{environment}.tfstate"
#
# ============================================================================

# Uncomment this block after creating the storage account
# terraform {
#   backend "azurerm" {
#     resource_group_name  = "tfstate-rg"
#     storage_account_name = "jobpilottfstate"  # Must be globally unique
#     container_name       = "tfstate"
#     key                  = "jobpilot-dev.tfstate"  # Change based on environment
#
#     # Optional: Enable state locking and consistency checking
#     use_azuread_auth     = true
#
#     # Optional: Encryption settings
#     # encryption_key       = "<key>"  # Customer-managed key for encryption
#   }
# }

# ============================================================================
# Alternative: Backend Configuration via CLI
# ============================================================================
# You can also provide backend configuration at runtime:
#
# terraform init \
#   -backend-config="resource_group_name=tfstate-rg" \
#   -backend-config="storage_account_name=jobpilottfstate" \
#   -backend-config="container_name=tfstate" \
#   -backend-config="key=jobpilot-${var.environment}.tfstate" \
#   -backend-config="use_azuread_auth=true"
#
# ============================================================================

# ============================================================================
# Best Practices
# ============================================================================
#
# 1. Use separate state files per environment (dev, staging, prod)
# 2. Enable soft delete on the storage account for state recovery
# 3. Use Azure AD authentication instead of storage keys
# 4. Enable versioning on the blob container
# 5. Restrict access using Azure RBAC
# 6. Consider using customer-managed encryption keys for compliance
# 7. Enable diagnostic logging for the storage account
#
# ============================================================================
