# Application Gateway Module

This module creates an Azure Application Gateway with Web Application Firewall (WAF) v2, supporting SSL termination, path-based routing, health probes, and auto-scaling.

## Features

- WAF v2 SKU with OWASP 3.2 rule set
- Auto-scaling configuration
- Zone redundancy support
- Multiple backend pools and routing rules
- SSL/TLS termination with Key Vault integration
- Health probes for backend health monitoring
- HTTP to HTTPS redirection
- Path-based routing support
- Connection draining
- Diagnostic logging integration
- User-assigned managed identity

## Usage

```hcl
module "application_gateway" {
  source = "./modules/application-gateway"

  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment

  # Network Configuration
  subnet_id = azurerm_subnet.appgw.id

  # Backend Configuration
  backend_fqdns = {
    api     = ["api.example.com"]
    web     = ["web.example.com"]
    admin   = ["admin.example.com"]
  }

  backend_http_settings = {
    api = {
      port     = 443
      protocol = "Https"
    }
    web = {
      port     = 443
      protocol = "Https"
    }
  }

  # Listeners
  http_listeners = {
    api = {
      protocol  = "Https"
      host_name = "api.jobpilot.com"
    }
    web = {
      protocol  = "Https"
      host_name = "www.jobpilot.com"
    }
  }

  # Health Probes
  health_probes = {
    api = {
      path = "/health"
    }
    web = {
      path = "/health"
    }
  }

  # Routing Rules
  routing_rules = {
    api = {
      rule_type                 = "Basic"
      http_listener_key         = "api"
      backend_address_pool_key  = "api"
      backend_http_settings_key = "api"
      priority                  = 100
    }
    web = {
      rule_type                 = "Basic"
      http_listener_key         = "web"
      backend_address_pool_key  = "web"
      backend_http_settings_key = "web"
      priority                  = 200
    }
  }

  # SSL Configuration
  ssl_certificate_key_vault_secret_id = azurerm_key_vault_secret.ssl_cert.id

  # WAF Configuration
  enable_waf           = true
  waf_mode             = "Prevention"
  waf_rule_set_version = "3.2"

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = var.tags
}
```

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
| subnet_id | Subnet ID for Application Gateway | `string` | n/a | yes |
| backend_fqdns | Map of backend FQDNs | `map(list(string))` | `{}` | no |
| enable_waf | Enable WAF | `bool` | `true` | no |
| waf_mode | WAF mode (Detection/Prevention) | `string` | `"Prevention"` | no |

See [variables.tf](./variables.tf) for complete list of inputs.

## Outputs

| Name | Description |
|------|-------------|
| gateway_id | Application Gateway resource ID |
| public_ip_address | Public IP address |
| fqdn | FQDN of the public IP |

See [outputs.tf](./outputs.tf) for complete list of outputs.

## Notes

- SSL certificates can be provided via Key Vault or directly as base64-encoded PFX
- WAF is enabled by default with Prevention mode
- The gateway supports zone redundancy across 3 availability zones
- Auto-scaling is configured with min 2 and max 10 instances by default
