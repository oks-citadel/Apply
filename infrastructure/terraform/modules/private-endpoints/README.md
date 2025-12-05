# Private Endpoints Module

This module creates Azure Private Endpoints for various Azure services, along with associated Private DNS Zones and Virtual Network links. This enables private connectivity to Azure PaaS services from within your Virtual Network.

## Features

- Private endpoints for multiple Azure services
- Automatic Private DNS Zone creation and configuration
- Virtual Network links for DNS resolution
- Support for:
  - Azure Key Vault
  - Azure SQL Server
  - Azure Redis Cache
  - Azure Storage (Blob, File, Queue, Table)
  - Azure Cosmos DB
  - Azure Container Registry
  - Azure OpenAI
  - Azure Cognitive Services
  - Azure Service Bus
  - Azure Event Hub
  - Azure App Service

## Usage

```hcl
module "private_endpoints" {
  source = "./modules/private-endpoints"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment

  # Network Configuration
  vnet_id   = azurerm_virtual_network.main.id
  subnet_id = azurerm_subnet.private_endpoints.id

  # DNS Configuration
  create_private_dns_zones = true

  # Key Vault
  key_vault_id                       = azurerm_key_vault.main.id
  enable_key_vault_private_endpoint  = true

  # SQL Server
  sql_server_id                   = azurerm_mssql_server.main.id
  enable_sql_private_endpoint     = true

  # Redis Cache
  redis_cache_id                  = azurerm_redis_cache.main.id
  enable_redis_private_endpoint   = true

  # Storage Account
  storage_account_id                = azurerm_storage_account.main.id
  enable_storage_private_endpoint   = true
  storage_private_endpoint_subresources = ["blob", "file"]

  # Container Registry
  container_registry_id                       = azurerm_container_registry.main.id
  enable_container_registry_private_endpoint  = true

  # OpenAI
  openai_id                       = azurerm_cognitive_account.openai.id
  enable_openai_private_endpoint  = true

  tags = var.tags
}
```

## Private Endpoint Subnet Requirements

The subnet used for private endpoints should:

1. Have network policies disabled for private endpoints:
```hcl
resource "azurerm_subnet" "private_endpoints" {
  name                 = "private-endpoints-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.10.0/24"]

  private_endpoint_network_policies_enabled = false
}
```

2. Have sufficient IP address space for all private endpoints

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.0 |
| azurerm | ~> 3.0 |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:--------:|
| resource_group_name | Name of the resource group | `string` | n/a | yes |
| location | Azure region | `string` | n/a | yes |
| project_name | Project name for naming | `string` | n/a | yes |
| environment | Environment (dev/staging/prod) | `string` | n/a | yes |
| vnet_id | Virtual Network ID | `string` | n/a | yes |
| subnet_id | Subnet ID for private endpoints | `string` | n/a | yes |
| create_private_dns_zones | Create private DNS zones | `bool` | `true` | no |
| key_vault_id | Key Vault resource ID | `string` | `null` | no |
| sql_server_id | SQL Server resource ID | `string` | `null` | no |
| redis_cache_id | Redis Cache resource ID | `string` | `null` | no |

See [variables.tf](./variables.tf) for complete list of inputs.

## Outputs

| Name | Description |
|------|-------------|
| key_vault_private_ip | Key Vault private IP address |
| sql_private_ip | SQL Server private IP address |
| redis_private_ip | Redis Cache private IP address |
| all_private_endpoints | Map of all private endpoint configurations |
| private_dns_zones | Map of private DNS zone IDs |

See [outputs.tf](./outputs.tf) for complete list of outputs.

## Private DNS Zone Names

The module automatically creates and manages the following Private DNS Zones:

| Service | DNS Zone |
|---------|----------|
| Key Vault | privatelink.vaultcore.azure.net |
| SQL Server | privatelink.database.windows.net |
| Redis Cache | privatelink.redis.cache.windows.net |
| Storage Blob | privatelink.blob.core.windows.net |
| Storage File | privatelink.file.core.windows.net |
| Cosmos DB | privatelink.documents.azure.com |
| Container Registry | privatelink.azurecr.io |
| OpenAI | privatelink.openai.azure.com |

## Notes

- Private endpoints provide private IP addresses from your VNet to Azure services
- DNS resolution is handled automatically through Private DNS Zones
- Private endpoints eliminate data exfiltration risks
- Services with private endpoints can disable public network access
- Each private endpoint consumes one IP address from the subnet
- Private DNS Zones are automatically linked to your Virtual Network
