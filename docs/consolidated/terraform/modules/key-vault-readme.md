# Azure Key Vault Module

This Terraform module creates an Azure Key Vault with security best practices and optional diagnostic settings.

## Features

- Standard SKU Key Vault with configurable soft delete and purge protection
- Automatic enablement of Azure service integrations (deployment, disk encryption, template deployment)
- Configurable network ACLs with IP allowlisting and VNet integration
- Access policy for Terraform service principal
- Optional diagnostic settings integration with Log Analytics
- Support for private endpoints

## Usage

```hcl
module "key_vault" {
  source = "./modules/key-vault"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "abc123"

  enable_diagnostics         = true
  enable_private_endpoint    = false
  allowed_ip_addresses       = ["203.0.113.0/24"]
  virtual_network_rules      = [azurerm_subnet.app.id]
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Project = "JobPilot AI"
    Team    = "Platform"
  }
}
```

## Requirements

- Terraform >= 1.0
- AzureRM Provider >= 3.0

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | string | - | yes |
| location | Azure region | string | - | yes |
| project_name | Project name for naming | string | - | yes |
| environment | Environment (dev/staging/prod) | string | - | yes |
| unique_suffix | Unique suffix for global naming | string | - | yes |
| tags | Resource tags | map(string) | {} | no |
| enable_diagnostics | Enable diagnostic settings | bool | true | no |
| enable_private_endpoint | Enable private endpoint | bool | false | no |
| allowed_ip_addresses | Allowed IP addresses/CIDRs | list(string) | [] | no |
| virtual_network_rules | Allowed subnet IDs | list(string) | [] | no |
| log_analytics_workspace_id | Log Analytics workspace ID | string | null | no |

## Outputs

| Name | Description |
|------|-------------|
| vault_id | Key Vault resource ID |
| vault_name | Key Vault name |
| vault_uri | Key Vault URI |

## Notes

- Purge protection is automatically enabled for production environments
- Soft delete retention is set to 90 days
- Network ACLs default to "Allow" unless IP rules or VNet rules are specified
