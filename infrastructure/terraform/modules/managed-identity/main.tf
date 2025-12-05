###########################################
# Managed Identity Module - Main Configuration
# JobPilot AI Platform
###########################################

# User Assigned Identity for CI/CD Pipeline
# This identity is used by GitHub Actions/Azure DevOps for deployment operations
resource "azurerm_user_assigned_identity" "cicd" {
  name                = "${var.project_name}-${var.environment}-cicd-identity"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = merge(
    var.tags,
    {
      Purpose     = "CI/CD Pipeline Authentication"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )
}

# User Assigned Identity for AKS Workloads
# This identity is used by application pods running in AKS
resource "azurerm_user_assigned_identity" "workload" {
  name                = "${var.project_name}-${var.environment}-workload-identity"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = merge(
    var.tags,
    {
      Purpose     = "AKS Workload Identity"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )
}

# User Assigned Identity for AKS Kubelet
# This identity is used by AKS nodes for pulling container images
resource "azurerm_user_assigned_identity" "aks_kubelet" {
  name                = "${var.project_name}-${var.environment}-aks-kubelet-identity"
  resource_group_name = var.resource_group_name
  location            = var.location

  tags = merge(
    var.tags,
    {
      Purpose     = "AKS Kubelet Identity for Container Image Pull"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )
}
