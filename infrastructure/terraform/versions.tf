# ============================================================================
# Terraform Version Constraints
# ============================================================================
# This file defines the minimum required versions for Terraform and providers
# used in the JobPilot AI Platform infrastructure deployment.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.80.0"
    }

    azuread = {
      source  = "hashicorp/azuread"
      version = ">= 2.45.0"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.5.0"
    }
  }
}
