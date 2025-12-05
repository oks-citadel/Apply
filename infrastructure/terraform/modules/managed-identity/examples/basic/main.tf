###########################################
# Managed Identity Module - Basic Example
# JobPilot AI Platform
###########################################

# Create Resource Group
resource "azurerm_resource_group" "example" {
  name     = "jobpilot-dev-example-rg"
  location = "eastus"

  tags = {
    Environment = "Development"
    Purpose     = "Example"
  }
}

# Use Managed Identity Module
module "managed_identity" {
  source = "../../"

  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  project_name        = "jobpilot"
  environment         = "dev"

  tags = {
    Project    = "JobPilot AI"
    Team       = "Platform"
    CostCenter = "Engineering"
    Example    = "true"
  }
}

# Output the identity details
output "cicd_identity" {
  description = "CI/CD Identity Details"
  value = {
    id           = module.managed_identity.cicd_identity_id
    client_id    = module.managed_identity.cicd_identity_client_id
    principal_id = module.managed_identity.cicd_identity_principal_id
  }
}

output "workload_identity" {
  description = "Workload Identity Details"
  value = {
    id           = module.managed_identity.workload_identity_id
    client_id    = module.managed_identity.workload_identity_client_id
    principal_id = module.managed_identity.workload_identity_principal_id
  }
}

output "aks_kubelet_identity" {
  description = "AKS Kubelet Identity Details"
  value = {
    id           = module.managed_identity.aks_kubelet_identity_id
    client_id    = module.managed_identity.aks_kubelet_identity_client_id
    principal_id = module.managed_identity.aks_kubelet_identity_principal_id
  }
}
