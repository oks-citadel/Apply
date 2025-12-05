# Container Registry Terraform Module

This module creates an Azure Container Registry (ACR) with appropriate role assignments for the JobPilot AI Platform.

## Purpose

Creates an Azure Container Registry with:
- Environment-specific SKU (Basic/Standard/Premium)
- Managed identity-based authentication
- Role assignments for CI/CD and AKS
- Production features (geo-replication, retention policies)

## Features

- **Environment-based SKU**: Basic (dev), Standard (staging), Premium (prod)
- **Security**: Admin user disabled, managed identity authentication only
- **Role Assignments**: Automatic AcrPush/AcrPull assignments
- **Geo-replication**: Multi-region replication for production
- **Retention Policies**: Automatic cleanup of untagged images
- **Microsoft Defender**: Optional security scanning
- **Trust & Quarantine Policies**: Content trust for production

## Usage

```hcl
module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "dev"
  unique_suffix       = "abc123"

  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = true

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
| unique_suffix | Unique suffix for ACR name | `string` | n/a | yes |
| tags | Common tags for resources | `map(string)` | `{}` | no |
| enable_defender | Enable Microsoft Defender | `bool` | `false` | no |
| cicd_identity_principal_id | Principal ID of CI/CD identity | `string` | n/a | yes |
| aks_identity_principal_id | Principal ID of AKS kubelet identity | `string` | n/a | yes |
| workload_identity_principal_id | Principal ID of workload identity | `string` | n/a | yes |
| geo_replication_locations | Additional geo-replication regions | `list(string)` | `[]` | no |
| retention_policy_days | Days to retain untagged manifests | `number` | `null` | no |

## Outputs

| Name | Description |
|------|-------------|
| registry_id | Full resource ID of ACR |
| registry_name | Name of the ACR |
| registry_login_server | Login server URL |
| registry_sku | SKU tier of the ACR |
| registry_identity_principal_id | Principal ID of system-assigned identity |
| cicd_role_assignment_id | ID of CI/CD role assignment |
| aks_role_assignment_id | ID of AKS role assignment |
| workload_role_assignment_id | ID of workload role assignment |

## SKU Configuration

| Environment | SKU | Features |
|------------|-----|----------|
| dev | Basic | Standard registry, no geo-replication |
| staging | Standard | Retention policies, enhanced performance |
| prod | Premium | Geo-replication, zone redundancy, trust policies |

## Geo-Replication

Production deployments automatically replicate to:
- Primary: Specified location
- Secondary: East US 2
- Tertiary: West Europe

## Role Assignments

The module automatically creates these role assignments:

1. **AcrPush** → CI/CD Identity
   - Allows pushing images to registry
   - Used by GitHub Actions/Azure DevOps

2. **AcrPull** → AKS Kubelet Identity
   - Allows AKS nodes to pull images
   - Required for pod deployment

3. **AcrPull** → Workload Identity
   - Allows application pods to pull images
   - Used for advanced scenarios

## Examples

### Development Environment
```hcl
module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = "jobpilot-dev-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"
  unique_suffix       = "dev001"

  cicd_identity_principal_id     = "12345678-1234-1234-1234-123456789012"
  aks_identity_principal_id      = "87654321-4321-4321-4321-210987654321"
  workload_identity_principal_id = "11111111-2222-3333-4444-555555555555"

  tags = {
    Environment = "Development"
  }
}
```

### Production Environment
```hcl
module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "prod001"

  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = true

  tags = {
    Environment = "Production"
    Compliance  = "Required"
    Criticality = "High"
  }
}
```

## Resource Naming

ACR name format: `{project_name}{environment}acr{unique_suffix}`

Example: `jobpilotdevacrabc123`

**Note**: ACR names must be globally unique and contain only alphanumeric characters.

## Requirements

- Terraform >= 1.0
- Azure Provider >= 3.0
- Managed identities must exist before creating ACR
- Appropriate Azure permissions for ACR and role assignments

## Security Considerations

- Admin user is disabled by default (recommended)
- All authentication via managed identities
- Premium SKU includes content trust and quarantine policies
- Microsoft Defender provides vulnerability scanning
- Regular review of role assignments recommended
- Use private endpoints in production (not included in this module)

## Cost Optimization

- **Dev**: Basic SKU (~$5/month) - minimal features
- **Staging**: Standard SKU (~$20/month) - better performance
- **Prod**: Premium SKU (~$50/month) - full features, geo-replication

Enable `retention_policy` to automatically clean up old images and reduce storage costs.

## Troubleshooting

### Image Pull Errors
- Verify AKS kubelet identity has AcrPull role
- Check role assignment propagation (can take 5-10 minutes)
- Ensure ACR and AKS are in same Azure tenant

### Push Failures
- Verify CI/CD identity has AcrPush role
- Check identity is authenticated to Azure
- Verify ACR name is correct in push commands

### Geo-replication Issues
- Geo-replication only works with Premium SKU
- Check regional availability
- Verify network connectivity to replica regions
