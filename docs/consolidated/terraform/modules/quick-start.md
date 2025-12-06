# Quick Start Guide - Terraform Modules

This guide provides quick examples for deploying the JobPilot AI Platform infrastructure using the Terraform modules.

## Prerequisites

1. Azure subscription with appropriate permissions
2. Terraform 1.0+ installed
3. Azure CLI installed and authenticated
4. Existing resource group and virtual network

## Module 1: AKS Cluster

### Minimal Configuration

```hcl
module "aks" {
  source = "../../modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  # Network
  subnet_id      = azurerm_subnet.aks.id
  dns_service_ip = "10.0.0.10"
  service_cidr   = "10.0.0.0/16"

  # Monitoring
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Identity (create these first)
  kubelet_identity_id = azurerm_user_assigned_identity.kubelet.id
  kubelet_client_id   = azurerm_user_assigned_identity.kubelet.client_id
  kubelet_object_id   = azurerm_user_assigned_identity.kubelet.principal_id

  tags = {
    Environment = "Production"
    Project     = "JobPilot"
  }
}
```

### Production Configuration

```hcl
module "aks" {
  source = "../../modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  # Kubernetes Configuration
  kubernetes_version = "1.28.3"
  aks_sku_tier       = "Standard"

  # Network Configuration
  subnet_id                       = azurerm_subnet.aks.id
  dns_service_ip                  = "10.0.0.10"
  service_cidr                    = "10.0.0.0/16"
  max_pods_per_node               = 110
  outbound_type                   = "loadBalancer"
  load_balancer_outbound_ip_count = 2

  # Identity Configuration
  kubelet_identity_id = azurerm_user_assigned_identity.kubelet.id
  kubelet_client_id   = azurerm_user_assigned_identity.kubelet.client_id
  kubelet_object_id   = azurerm_user_assigned_identity.kubelet.principal_id

  # Security Features
  enable_private_cluster  = true
  enable_azure_policy     = true
  enable_azure_ad_rbac    = true
  disable_local_accounts  = true
  enable_secret_store_csi = true

  # System Node Pool
  system_node_pool_vm_size            = "Standard_D4s_v3"
  system_node_pool_min_count          = 3
  system_node_pool_max_count          = 10
  system_node_pool_enable_auto_scaling = true
  system_node_pool_os_disk_size       = 128

  # User Node Pool
  enable_user_node_pool              = true
  user_node_pool_vm_size             = "Standard_D8s_v3"
  user_node_pool_min_count           = 3
  user_node_pool_max_count           = 20
  user_node_pool_enable_auto_scaling = true
  user_node_pool_os_disk_size        = 256

  # Monitoring
  enable_monitoring              = true
  enable_microsoft_defender      = true
  log_analytics_workspace_id     = azurerm_log_analytics_workspace.main.id

  # Availability
  availability_zones = ["1", "2", "3"]

  tags = var.common_tags
}
```

## Module 2: Application Gateway

### Minimal Configuration

```hcl
module "application_gateway" {
  source = "../../modules/application-gateway"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  subnet_id = azurerm_subnet.appgw.id

  # Backend pools
  backend_fqdns = {
    api = ["api-backend.example.com"]
  }

  tags = var.common_tags
}
```

### Production Configuration

```hcl
module "application_gateway" {
  source = "../../modules/application-gateway"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  subnet_id = azurerm_subnet.appgw.id

  # SKU and Scaling
  sku_name             = "WAF_v2"
  sku_tier             = "WAF_v2"
  autoscale_min_capacity = 2
  autoscale_max_capacity = 10

  # Backend Configuration
  backend_fqdns = {
    api   = ["api-backend.jobpilot.com"]
    web   = ["web-backend.jobpilot.com"]
    admin = ["admin-backend.jobpilot.com"]
  }

  backend_http_settings = {
    api = {
      port                                = 443
      protocol                            = "Https"
      cookie_based_affinity               = "Disabled"
      request_timeout                     = 60
      pick_host_name_from_backend_address = true
      connection_draining_timeout         = 300
    }
    web = {
      port                                = 443
      protocol                            = "Https"
      pick_host_name_from_backend_address = true
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
      protocol        = "Https"
      path            = "/health"
      interval        = 30
      timeout         = 30
      unhealthy_threshold = 3
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

  # SSL Certificate from Key Vault
  ssl_certificate_key_vault_secret_id = azurerm_key_vault_secret.ssl_cert.id

  # WAF Configuration
  enable_waf           = true
  waf_mode             = "Prevention"
  waf_rule_set_version = "3.2"

  # SSL Policy
  ssl_policy_type = "Predefined"
  ssl_policy_name = "AppGwSslPolicy20220101"

  # Additional Features
  enable_http2 = true

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  availability_zones = ["1", "2", "3"]

  tags = var.common_tags
}
```

## Module 3: Front Door

### Minimal Configuration

```hcl
module "front_door" {
  source = "../../modules/front-door"

  resource_group_name = azurerm_resource_group.main.name
  project_name        = "jobpilot"
  environment         = "prod"

  sku_name = "Premium_AzureFrontDoor"

  endpoints = {
    main = {}
  }

  origin_groups = {
    default = {
      health_probe   = { path = "/health" }
      load_balancing = {}
    }
  }

  origins = {
    primary = {
      origin_group_key = "default"
      host_name        = "backend.example.com"
    }
  }

  routes = {
    default = {
      endpoint_key     = "main"
      origin_group_key = "default"
      origin_keys      = ["primary"]
    }
  }

  tags = var.common_tags
}
```

### Production Configuration

```hcl
module "front_door" {
  source = "../../modules/front-door"

  resource_group_name = azurerm_resource_group.main.name
  project_name        = "jobpilot"
  environment         = "prod"

  sku_name                 = "Premium_AzureFrontDoor"
  response_timeout_seconds = 120

  # Endpoints
  endpoints = {
    main = { enabled = true }
  }

  # Origin Groups
  origin_groups = {
    api = {
      session_affinity_enabled = false
      health_probe = {
        interval_in_seconds = 30
        path                = "/health"
        protocol            = "Https"
        request_type        = "GET"
      }
      load_balancing = {
        additional_latency_in_milliseconds = 50
        sample_size                        = 4
        successful_samples_required        = 3
      }
    }
    web = {
      health_probe   = { path = "/health" }
      load_balancing = {}
    }
  }

  # Origins
  origins = {
    api-eastus = {
      origin_group_key = "api"
      host_name        = "api-eastus.jobpilot.com"
      priority         = 1
      weight           = 1000
    }
    api-westus = {
      origin_group_key = "api"
      host_name        = "api-westus.jobpilot.com"
      priority         = 2
      weight           = 1000
    }
    web-primary = {
      origin_group_key = "web"
      host_name        = "web.jobpilot.com"
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
      origin_keys          = ["api-eastus", "api-westus"]
      patterns_to_match    = ["/api/*"]
      custom_domain_keys   = ["api-jobpilot-com"]
      forwarding_protocol  = "HttpsOnly"
      https_redirect_enabled = true
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

  # Custom WAF Rule - Rate Limiting
  waf_custom_rules = [
    {
      name     = "RateLimitRule"
      priority = 100
      type     = "RateLimitRule"
      action   = "Block"
      rate_limit_threshold           = 100
      rate_limit_duration_in_minutes = 1
      match_conditions = [
        {
          match_variable = "RemoteAddr"
          operator       = "IPMatch"
          match_values   = ["0.0.0.0/0"]
        }
      ]
    }
  ]

  # Caching
  enable_caching = true

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = var.common_tags
}
```

## Module 4: Private Endpoints

### Minimal Configuration

```hcl
module "private_endpoints" {
  source = "../../modules/private-endpoints"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  vnet_id   = azurerm_virtual_network.main.id
  subnet_id = azurerm_subnet.private_endpoints.id

  # Key Vault
  key_vault_id = azurerm_key_vault.main.id

  # SQL Server
  sql_server_id = azurerm_mssql_server.main.id

  # Redis Cache
  redis_cache_id = azurerm_redis_cache.main.id

  tags = var.common_tags
}
```

### Production Configuration

```hcl
module "private_endpoints" {
  source = "../../modules/private-endpoints"

  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  # Network Configuration
  vnet_id   = azurerm_virtual_network.main.id
  subnet_id = azurerm_subnet.private_endpoints.id

  # DNS Configuration
  create_private_dns_zones = true

  # Key Vault
  key_vault_id                      = azurerm_key_vault.main.id
  enable_key_vault_private_endpoint = true

  # SQL Server
  sql_server_id               = azurerm_mssql_server.main.id
  enable_sql_private_endpoint = true

  # Redis Cache
  redis_cache_id                = azurerm_redis_cache.main.id
  enable_redis_private_endpoint = true

  # Storage Account
  storage_account_id                    = azurerm_storage_account.main.id
  enable_storage_private_endpoint       = true
  storage_private_endpoint_subresources = ["blob", "file"]

  # Container Registry
  container_registry_id                      = azurerm_container_registry.main.id
  enable_container_registry_private_endpoint = true

  # OpenAI
  openai_id                      = azurerm_cognitive_account.openai.id
  enable_openai_private_endpoint = true

  # Cosmos DB
  cosmos_db_id                      = azurerm_cosmosdb_account.main.id
  enable_cosmos_db_private_endpoint = true
  cosmos_db_subresource             = "Sql"

  tags = var.common_tags
}
```

## Complete Infrastructure Example

```hcl
# main.tf in environments/prod/

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "jobpilot-prod-rg"
  location = "eastus"
  tags     = local.common_tags
}

# Networking
module "networking" {
  source = "../../modules/networking"
  # ... networking configuration
}

# Monitoring
module "monitoring" {
  source = "../../modules/monitoring"
  # ... monitoring configuration
}

# Managed Identities
module "managed_identity" {
  source = "../../modules/managed-identity"
  # ... identity configuration
}

# AKS Cluster
module "aks" {
  source = "../../modules/aks"
  # ... see production configuration above
  depends_on = [module.networking, module.monitoring, module.managed_identity]
}

# Application Gateway
module "application_gateway" {
  source = "../../modules/application-gateway"
  # ... see production configuration above
  depends_on = [module.networking, module.monitoring]
}

# Front Door
module "front_door" {
  source = "../../modules/front-door"
  # ... see production configuration above
  depends_on = [module.application_gateway]
}

# Private Endpoints
module "private_endpoints" {
  source = "../../modules/private-endpoints"
  # ... see production configuration above
  depends_on = [module.networking]
}
```

## Deployment Commands

```bash
# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt -recursive

# Plan deployment
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Show outputs
terraform output

# Destroy (use with caution)
terraform destroy
```

## Common Variables Pattern

Create a `locals.tf` file:

```hcl
locals {
  project_name = "jobpilot"
  environment  = "prod"
  location     = "eastus"

  common_tags = {
    Project     = "JobPilot"
    Environment = "Production"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
    Owner       = "DevOps Team"
  }
}
```

## Next Steps

1. Review each module's README.md for detailed documentation
2. Customize variables for your environment
3. Set up remote state backend (Azure Storage)
4. Configure CI/CD pipeline for automated deployments
5. Implement monitoring and alerting
6. Set up backup and disaster recovery

## Support

For issues or questions:
- Review module README files
- Check Azure documentation
- Review Terraform logs
- Validate network connectivity
- Verify Azure permissions

---

**Remember**: Always review the plan output before applying changes to production!
