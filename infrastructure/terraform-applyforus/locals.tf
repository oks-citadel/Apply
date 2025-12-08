locals {
  # Resource naming convention
  resource_prefix = "${var.project_name}-${var.environment}"

  # Common tags applied to all resources
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedDate = timestamp()
    }
  )

  # Environment-specific configurations
  is_production  = var.environment == "prod"
  is_development = var.environment == "dev"
  is_test        = var.environment == "test"

  # AKS configuration based on environment
  aks_config = {
    dev = {
      node_count     = 1
      min_count      = 1
      max_count      = 3
      vm_size        = "Standard_D2s_v3"
      enable_zones   = false
      network_policy = "azure"
    }
    test = {
      node_count     = 2
      min_count      = 2
      max_count      = 5
      vm_size        = "Standard_D4s_v3"
      enable_zones   = true
      network_policy = "azure"
    }
    prod = {
      node_count     = 3
      min_count      = 3
      max_count      = 10
      vm_size        = "Standard_D4s_v3"
      enable_zones   = true
      network_policy = "azure"
    }
  }

  # ACR configuration based on environment
  acr_config = {
    dev = {
      sku                    = "Basic"
      enable_geo_replication = false
      admin_enabled          = true
    }
    test = {
      sku                    = "Standard"
      enable_geo_replication = false
      admin_enabled          = false
    }
    prod = {
      sku                    = "Premium"
      enable_geo_replication = true
      admin_enabled          = false
    }
  }

  # Storage configuration based on environment
  storage_config = {
    dev = {
      tier              = "Standard"
      replication_type  = "LRS"
      backup_retention  = 7
    }
    test = {
      tier              = "Standard"
      replication_type  = "GRS"
      backup_retention  = 14
    }
    prod = {
      tier              = "Standard"
      replication_type  = "GZRS"
      backup_retention  = 30
    }
  }

  # Application Gateway configuration
  app_gateway_config = {
    dev = {
      sku_name     = "Standard_v2"
      sku_tier     = "Standard_v2"
      capacity     = 1
      min_capacity = 1
      max_capacity = 2
    }
    test = {
      sku_name     = "WAF_v2"
      sku_tier     = "WAF_v2"
      capacity     = 2
      min_capacity = 2
      max_capacity = 5
    }
    prod = {
      sku_name     = "WAF_v2"
      sku_tier     = "WAF_v2"
      capacity     = 2
      min_capacity = 2
      max_capacity = 10
    }
  }

  # Network configuration
  network_config = {
    vnet_address_space                    = var.vnet_address_space
    subnet_aks_address_prefix             = var.subnet_aks_address_prefix
    subnet_app_gateway_address_prefix     = var.subnet_app_gateway_address_prefix
    subnet_private_endpoints_address_prefix = var.subnet_private_endpoints_address_prefix
    subnet_management_address_prefix      = var.subnet_management_address_prefix
  }

  # DNS records for the application
  dns_records = {
    web = {
      name = "@"
      type = "A"
    }
    api = {
      name = "api"
      type = "A"
    }
    www = {
      name = "www"
      type = "CNAME"
    }
  }
}
