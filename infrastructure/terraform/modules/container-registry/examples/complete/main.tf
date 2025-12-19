###########################################
# Container Registry Module - Complete Example
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

# Create Managed Identities
module "managed_identity" {
  source = "../../../managed-identity"

  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  project_name        = "jobpilot"
  environment         = "dev"

  tags = {
    Project = "JobPilot AI"
    Team    = "Platform"
    Example = "true"
  }
}

# Generate random suffix for globally unique ACR name
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# Create Container Registry
module "container_registry" {
  source = "../../"

  resource_group_name = azurerm_resource_group.example.name
  location            = azurerm_resource_group.example.location
  project_name        = "jobpilot"
  environment         = "dev"
  unique_suffix       = random_string.suffix.result

  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = false

  tags = {
    Project    = "JobPilot AI"
    Team       = "Platform"
    CostCenter = "Engineering"
    Example    = "true"
  }

  depends_on = [module.managed_identity]
}

# Outputs
output "registry_details" {
  description = "Container Registry Details"
  value = {
    id           = module.container_registry.registry_id
    name         = module.container_registry.registry_name
    login_server = module.container_registry.registry_login_server
    sku          = module.container_registry.registry_sku
  }
}

output "identity_details" {
  description = "Managed Identity Details"
  value = {
    cicd_identity = {
      id           = module.managed_identity.cicd_identity_id
      client_id    = module.managed_identity.cicd_identity_client_id
      principal_id = module.managed_identity.cicd_identity_principal_id
    }
    workload_identity = {
      id           = module.managed_identity.workload_identity_id
      client_id    = module.managed_identity.workload_identity_client_id
      principal_id = module.managed_identity.workload_identity_principal_id
    }
    aks_kubelet_identity = {
      id           = module.managed_identity.aks_kubelet_identity_id
      client_id    = module.managed_identity.aks_kubelet_identity_client_id
      principal_id = module.managed_identity.aks_kubelet_identity_principal_id
    }
  }
}

output "role_assignments" {
  description = "ACR Role Assignment IDs"
  value = {
    cicd_push     = module.container_registry.cicd_role_assignment_id
    aks_pull      = module.container_registry.aks_role_assignment_id
    workload_pull = module.container_registry.workload_role_assignment_id
  }
}
