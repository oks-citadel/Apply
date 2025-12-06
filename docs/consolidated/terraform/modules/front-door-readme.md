# Azure Front Door Module

This module creates an Azure Front Door (Standard or Premium) profile with support for custom domains, WAF policies, caching, rules engine, and private link origins.

## Features

- Premium SKU for advanced features (Private Link, advanced WAF)
- Multiple endpoints and origin groups
- Custom domain support with managed certificates
- Web Application Firewall with managed and custom rules
- Advanced caching with compression
- Rules engine for request/response manipulation
- Private Link support for private origins
- Health probes and load balancing
- SSL/TLS termination
- Diagnostic logging integration

## Usage

```hcl
module "front_door" {
  source = "./modules/front-door"

  resource_group_name = azurerm_resource_group.main.name
  project_name        = var.project_name
  environment         = var.environment

  # SKU Configuration
  sku_name = "Premium_AzureFrontDoor"

  # Endpoints
  endpoints = {
    main = {
      enabled = true
    }
  }

  # Origin Groups
  origin_groups = {
    api = {
      health_probe = {
        path     = "/health"
        protocol = "Https"
      }
      load_balancing = {
        sample_size                 = 4
        successful_samples_required = 3
      }
    }
    web = {
      health_probe = {
        path     = "/health"
        protocol = "Https"
      }
      load_balancing = {}
    }
  }

  # Origins
  origins = {
    api-primary = {
      origin_group_key = "api"
      host_name        = "api.example.com"
      priority         = 1
      weight           = 1000
    }
    web-primary = {
      origin_group_key = "web"
      host_name        = "web.example.com"
      priority         = 1
      weight           = 1000
    }
  }

  # Custom Domains
  custom_domains = {
    "www-jobpilot-com" = {
      host_name = "www.jobpilot.com"
      tls = {
        certificate_type    = "ManagedCertificate"
        minimum_tls_version = "TLS12"
      }
    }
    "api-jobpilot-com" = {
      host_name = "api.jobpilot.com"
      tls = {
        certificate_type    = "ManagedCertificate"
        minimum_tls_version = "TLS12"
      }
    }
  }

  # Routes
  routes = {
    api = {
      endpoint_key         = "main"
      origin_group_key     = "api"
      origin_keys          = ["api-primary"]
      patterns_to_match    = ["/api/*"]
      custom_domain_keys   = ["api-jobpilot-com"]
      cache = {
        query_string_caching_behavior = "IgnoreQueryString"
        compression_enabled           = true
      }
    }
    web = {
      endpoint_key       = "main"
      origin_group_key   = "web"
      origin_keys        = ["web-primary"]
      patterns_to_match  = ["/*"]
      custom_domain_keys = ["www-jobpilot-com"]
      cache = {
        query_string_caching_behavior = "UseQueryString"
        compression_enabled           = true
      }
    }
  }

  # WAF Configuration
  enable_waf       = true
  waf_mode         = "Prevention"
  waf_endpoint_key = "main"

  # Managed Rules
  waf_managed_rules = [
    {
      type    = "Microsoft_DefaultRuleSet"
      version = "2.1"
      action  = "Block"
    },
    {
      type    = "Microsoft_BotManagerRuleSet"
      version = "1.0"
      action  = "Block"
    }
  ]

  # Caching
  enable_caching = true

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
| project_name | Project name for naming | `string` | n/a | yes |
| environment | Environment (dev/staging/prod) | `string` | n/a | yes |
| sku_name | SKU name (Standard/Premium) | `string` | `"Premium_AzureFrontDoor"` | no |
| endpoints | Map of endpoints | `map(object)` | `{main = {}}` | no |
| enable_waf | Enable WAF | `bool` | `true` | no |
| enable_caching | Enable caching | `bool` | `true` | no |

See [variables.tf](./variables.tf) for complete list of inputs.

## Outputs

| Name | Description |
|------|-------------|
| profile_id | Front Door profile resource ID |
| endpoint_host_names | Map of endpoint host names |
| front_door_url | Primary Front Door URL |
| waf_policy_id | WAF policy resource ID |

See [outputs.tf](./outputs.tf) for complete list of outputs.

## Notes

- Premium SKU is recommended for production workloads
- Managed certificates are automatically provisioned for custom domains
- WAF is enabled by default with Microsoft Default Rule Set 2.1
- Caching with compression is enabled by default
- Private Link support requires Premium SKU
