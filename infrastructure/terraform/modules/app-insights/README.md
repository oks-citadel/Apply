# Azure Application Insights Module

This Terraform module creates Azure Application Insights with an integrated Log Analytics workspace for comprehensive application monitoring.

## Features

- Log Analytics workspace with environment-based retention policies
- Application Insights with workspace-based architecture
- Configurable sampling percentage
- Environment-specific configurations
- Daily quota controls for non-production environments

## Retention Policies

- **Development**: 30 days
- **Staging**: 60 days
- **Production**: 90 days

## Usage

```hcl
module "app_insights" {
  source = "./modules/app-insights"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "prod"
  sampling_percentage = 100

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
| tags | Resource tags | map(string) | {} | no |
| sampling_percentage | Sampling percentage (0-100) | number | 100 | no |

## Outputs

| Name | Description | Sensitive |
|------|-------------|-----------|
| workspace_id | Log Analytics workspace ID | no |
| app_insights_id | Application Insights ID | no |
| instrumentation_key | Instrumentation key | yes |
| connection_string | Connection string | yes |

## Configuration Details

### Log Analytics Workspace

- **SKU**: PerGB2018 (pay-as-you-go)
- **Daily Quota**: Unlimited for prod, 5GB for dev/staging
- **Retention**: Environment-based (30/60/90 days)

### Application Insights

- **Type**: web
- **Workspace Integration**: Enabled
- **Internet Access**: Enabled for ingestion and query
- **IP Masking**: Disabled in development only

## Monitoring Best Practices

1. Use sampling in high-traffic production environments to control costs
2. Configure alerts on the Log Analytics workspace
3. Review retention policies based on compliance requirements
4. Monitor daily quota usage in non-production environments
