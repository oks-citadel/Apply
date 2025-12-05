# Integration Guide: Managed Identity & Container Registry Modules

This guide demonstrates how to integrate the Managed Identity and Container Registry modules in the JobPilot AI Platform.

## Overview

The Managed Identity and Container Registry modules work together to provide secure, identity-based authentication for container operations:

1. **Managed Identity Module** creates three identities:
   - CI/CD Identity (for pushing images)
   - Workload Identity (for application pods)
   - AKS Kubelet Identity (for pulling images)

2. **Container Registry Module** creates ACR and assigns roles:
   - AcrPush → CI/CD Identity
   - AcrPull → AKS Kubelet Identity
   - AcrPull → Workload Identity

## Integration Pattern

```hcl
# Step 1: Create Managed Identities
module "managed_identity" {
  source = "./modules/managed-identity"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = var.environment

  tags = var.common_tags
}

# Step 2: Generate Unique Suffix for ACR
resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

# Step 3: Create Container Registry with Identity References
module "container_registry" {
  source = "./modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = var.environment
  unique_suffix       = random_string.acr_suffix.result

  # Pass identity principal IDs from managed identity module
  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = var.environment == "prod"

  tags = var.common_tags

  depends_on = [module.managed_identity]
}
```

## Environment-Specific Configurations

### Development Environment

```hcl
# environments/dev/main.tf

locals {
  environment = "dev"
  location    = "eastus"
  project     = "jobpilot"
}

resource "azurerm_resource_group" "main" {
  name     = "${local.project}-${local.environment}-rg"
  location = local.location
}

module "managed_identity" {
  source = "../../modules/managed-identity"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = local.project
  environment         = local.environment

  tags = {
    Environment = "Development"
    ManagedBy   = "Terraform"
  }
}

resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

module "container_registry" {
  source = "../../modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = local.project
  environment         = local.environment
  unique_suffix       = random_string.acr_suffix.result

  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = false

  tags = {
    Environment = "Development"
    ManagedBy   = "Terraform"
  }

  depends_on = [module.managed_identity]
}
```

### Production Environment

```hcl
# environments/prod/main.tf

locals {
  environment = "prod"
  location    = "eastus"
  project     = "jobpilot"
}

resource "azurerm_resource_group" "main" {
  name     = "${local.project}-${local.environment}-rg"
  location = local.location
}

module "managed_identity" {
  source = "../../modules/managed-identity"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = local.project
  environment         = local.environment

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Compliance  = "Required"
    Criticality = "High"
  }
}

resource "random_string" "acr_suffix" {
  length  = 6
  special = false
  upper   = false
}

module "container_registry" {
  source = "../../modules/container-registry"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = local.project
  environment         = local.environment
  unique_suffix       = random_string.acr_suffix.result

  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  enable_defender = true

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
    Compliance  = "Required"
    Criticality = "High"
  }

  depends_on = [module.managed_identity]
}
```

## Using with AKS

When integrating with AKS, use the kubelet identity:

```hcl
module "aks" {
  source = "./modules/aks"

  # ... other configurations ...

  # Use the kubelet identity for ACR pull
  kubelet_identity = {
    client_id                 = module.managed_identity.aks_kubelet_identity_client_id
    object_id                 = module.managed_identity.aks_kubelet_identity_principal_id
    user_assigned_identity_id = module.managed_identity.aks_kubelet_identity_id
  }
}
```

## Using in CI/CD Pipelines

### GitHub Actions

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Azure Login with Managed Identity
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.CICD_IDENTITY_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Build and Push to ACR
        run: |
          az acr build \
            --registry ${{ secrets.ACR_NAME }} \
            --image jobpilot/api:${{ github.sha }} \
            .
```

### Azure DevOps

```yaml
trigger:
  - main

pool:
  vmImage: 'ubuntu-latest'

variables:
  acrName: $(ACR_NAME)
  imageRepository: 'jobpilot/api'
  imageTag: $(Build.BuildId)

steps:
  - task: AzureCLI@2
    displayName: 'Build and Push to ACR'
    inputs:
      azureSubscription: 'Azure-CI-CD-Identity-Connection'
      scriptType: 'bash'
      scriptLocation: 'inlineScript'
      inlineScript: |
        az acr build \
          --registry $(acrName) \
          --image $(imageRepository):$(imageTag) \
          .
```

## Outputs Reference

After deploying both modules, you'll have access to these outputs:

```hcl
# Managed Identity Outputs
output "identity_details" {
  value = {
    cicd = {
      id           = module.managed_identity.cicd_identity_id
      client_id    = module.managed_identity.cicd_identity_client_id
      principal_id = module.managed_identity.cicd_identity_principal_id
    }
    workload = {
      id           = module.managed_identity.workload_identity_id
      client_id    = module.managed_identity.workload_identity_client_id
      principal_id = module.managed_identity.workload_identity_principal_id
    }
    aks_kubelet = {
      id           = module.managed_identity.aks_kubelet_identity_id
      client_id    = module.managed_identity.aks_kubelet_identity_client_id
      principal_id = module.managed_identity.aks_kubelet_identity_principal_id
    }
  }
}

# Container Registry Outputs
output "registry_details" {
  value = {
    id           = module.container_registry.registry_id
    name         = module.container_registry.registry_name
    login_server = module.container_registry.registry_login_server
    sku          = module.container_registry.registry_sku
  }
}
```

## Deployment Steps

1. **Initialize Terraform**
   ```bash
   terraform init
   ```

2. **Plan Deployment**
   ```bash
   terraform plan -var-file="environments/dev/terraform.tfvars"
   ```

3. **Apply Configuration**
   ```bash
   terraform apply -var-file="environments/dev/terraform.tfvars"
   ```

4. **Verify Role Assignments**
   ```bash
   # Check role assignments
   az role assignment list --scope <acr-resource-id>
   ```

5. **Test Image Push (CI/CD Identity)**
   ```bash
   # Login with CI/CD identity
   az login --identity --username <cicd-identity-client-id>

   # Push test image
   docker tag myapp:latest <acr-name>.azurecr.io/myapp:latest
   az acr login --name <acr-name>
   docker push <acr-name>.azurecr.io/myapp:latest
   ```

6. **Test Image Pull (AKS)**
   ```bash
   # Deploy to AKS
   kubectl apply -f deployment.yaml

   # Check pod status
   kubectl get pods
   kubectl describe pod <pod-name>
   ```

## Troubleshooting

### Role Assignment Propagation Delay

Role assignments can take 5-10 minutes to propagate. If you encounter permission errors immediately after deployment:

```bash
# Wait for propagation
sleep 300

# Verify role assignments
az role assignment list \
  --assignee <identity-principal-id> \
  --scope <acr-resource-id>
```

### Image Pull Failures

If AKS pods fail to pull images:

```bash
# Check kubelet identity assignment
az aks show -g <rg-name> -n <aks-name> --query "identityProfile.kubeletidentity"

# Verify ACR role assignment
az role assignment list \
  --assignee <kubelet-identity-principal-id> \
  --scope <acr-resource-id>

# Check pod events
kubectl describe pod <pod-name>
```

### CI/CD Push Failures

If CI/CD pipeline fails to push images:

```bash
# Verify identity authentication
az account show

# Check ACR permissions
az acr show-usage -n <acr-name>

# Test push manually
az acr build --registry <acr-name> --image test:latest .
```

## Security Best Practices

1. **Never Enable Admin User**: The modules disable admin user by default
2. **Use Managed Identities Only**: All authentication via Azure AD
3. **Enable Defender in Production**: Set `enable_defender = true`
4. **Regular Access Reviews**: Audit role assignments quarterly
5. **Principle of Least Privilege**: Only grant necessary permissions
6. **Monitor ACR Access**: Enable diagnostic logs and alerts

## Cost Optimization

| Environment | SKU | Monthly Cost | Features |
|------------|-----|--------------|----------|
| Dev | Basic | ~$5 | Basic registry, 10 GB storage |
| Staging | Standard | ~$20 | 100 GB storage, webhooks |
| Prod | Premium | ~$50+ | Geo-replication, 500 GB storage |

Enable retention policies to automatically clean up old images and reduce storage costs.

## Next Steps

1. Integrate with AKS module for complete Kubernetes setup
2. Configure Key Vault to store ACR credentials (if needed for external access)
3. Set up monitoring and alerting for registry operations
4. Implement image scanning policies
5. Configure private endpoints for production environments
