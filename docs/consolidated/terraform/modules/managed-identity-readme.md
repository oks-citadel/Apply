# Managed Identity Terraform Module

This module creates Azure User Assigned Managed Identities for the JobPilot AI Platform.

## Purpose

Creates three managed identities:
1. **CI/CD Identity** - For GitHub Actions/Azure DevOps pipeline authentication
2. **Workload Identity** - For AKS application pods
3. **AKS Kubelet Identity** - For AKS nodes to pull container images

## Features

- User Assigned Managed Identities for different purposes
- Consistent naming convention
- Environment-based resource tagging
- Input validation for all variables

## Usage

```hcl
module "managed_identity" {
  source = "./modules/managed-identity"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "dev"

  tags = {
    Project     = "JobPilot AI"
    Team        = "Platform"
    CostCenter  = "Engineering"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| resource_group_name | Name of the Azure Resource Group | `string` | n/a | yes |
| location | Azure region for resources | `string` | n/a | yes |
| project_name | Project name for resource naming | `string` | `"jobpilot"` | no |
| environment | Environment name (dev/staging/prod) | `string` | n/a | yes |
| tags | Common tags for resources | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| cicd_identity_id | Full resource ID of CI/CD identity |
| cicd_identity_client_id | Client ID of CI/CD identity |
| cicd_identity_principal_id | Principal ID of CI/CD identity |
| workload_identity_id | Full resource ID of workload identity |
| workload_identity_client_id | Client ID of workload identity |
| workload_identity_principal_id | Principal ID of workload identity |
| aks_kubelet_identity_id | Full resource ID of AKS kubelet identity |
| aks_kubelet_identity_client_id | Client ID of AKS kubelet identity |
| aks_kubelet_identity_principal_id | Principal ID of AKS kubelet identity |

## Resource Naming

Resources follow this naming convention:
- `{project_name}-{environment}-cicd-identity`
- `{project_name}-{environment}-workload-identity`
- `{project_name}-{environment}-aks-kubelet-identity`

## Examples

### Development Environment
```hcl
module "managed_identity" {
  source = "./modules/managed-identity"

  resource_group_name = "jobpilot-dev-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"

  tags = {
    Environment = "Development"
  }
}
```

### Production Environment
```hcl
module "managed_identity" {
  source = "./modules/managed-identity"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  tags = {
    Environment = "Production"
    Compliance  = "Required"
  }
}
```

## Requirements

- Terraform >= 1.0
- Azure Provider >= 3.0
- Appropriate Azure permissions to create managed identities

## Security Considerations

- Managed identities use Azure AD authentication (no passwords/keys)
- Each identity has a specific purpose and limited scope
- Principal IDs should be used for role assignments
- Regular audit of identity assignments recommended
