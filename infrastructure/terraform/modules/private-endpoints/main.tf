terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Local variables for Private DNS Zone names
locals {
  private_dns_zones = {
    key_vault              = "privatelink.vaultcore.azure.net"
    sql_server             = "privatelink.database.windows.net"
    redis_cache            = "privatelink.redis.cache.windows.net"
    storage_blob           = "privatelink.blob.core.windows.net"
    storage_file           = "privatelink.file.core.windows.net"
    storage_queue          = "privatelink.queue.core.windows.net"
    storage_table          = "privatelink.table.core.windows.net"
    cosmos_db              = "privatelink.documents.azure.com"
    service_bus            = "privatelink.servicebus.windows.net"
    event_hub              = "privatelink.servicebus.windows.net"
    container_registry     = "privatelink.azurecr.io"
    app_service            = "privatelink.azurewebsites.net"
    cognitive_services     = "privatelink.cognitiveservices.azure.com"
    openai                 = "privatelink.openai.azure.com"
  }

  # Filter enabled resources
  enabled_resources = {
    key_vault          = var.key_vault_id != null && var.enable_key_vault_private_endpoint
    sql_server         = var.sql_server_id != null && var.enable_sql_private_endpoint
    redis_cache        = var.redis_cache_id != null && var.enable_redis_private_endpoint
    storage_account    = var.storage_account_id != null && var.enable_storage_private_endpoint
    cosmos_db          = var.cosmos_db_id != null && var.enable_cosmos_db_private_endpoint
    service_bus        = var.service_bus_id != null && var.enable_service_bus_private_endpoint
    event_hub          = var.event_hub_id != null && var.enable_event_hub_private_endpoint
    container_registry = var.container_registry_id != null && var.enable_container_registry_private_endpoint
    app_service        = var.app_service_id != null && var.enable_app_service_private_endpoint
    cognitive_services = var.cognitive_services_id != null && var.enable_cognitive_services_private_endpoint
    openai             = var.openai_id != null && var.enable_openai_private_endpoint
  }
}

# Private DNS Zones
resource "azurerm_private_dns_zone" "key_vault" {
  count               = local.enabled_resources.key_vault && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.key_vault
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "KeyVault"
    }
  )
}

resource "azurerm_private_dns_zone" "sql_server" {
  count               = local.enabled_resources.sql_server && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.sql_server
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "SQLServer"
    }
  )
}

resource "azurerm_private_dns_zone" "redis_cache" {
  count               = local.enabled_resources.redis_cache && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.redis_cache
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "RedisCache"
    }
  )
}

resource "azurerm_private_dns_zone" "storage_blob" {
  count               = local.enabled_resources.storage_account && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.storage_blob
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "StorageBlob"
    }
  )
}

resource "azurerm_private_dns_zone" "cosmos_db" {
  count               = local.enabled_resources.cosmos_db && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.cosmos_db
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "CosmosDB"
    }
  )
}

resource "azurerm_private_dns_zone" "container_registry" {
  count               = local.enabled_resources.container_registry && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.container_registry
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "ContainerRegistry"
    }
  )
}

resource "azurerm_private_dns_zone" "openai" {
  count               = local.enabled_resources.openai && var.create_private_dns_zones ? 1 : 0
  name                = local.private_dns_zones.openai
  resource_group_name = var.resource_group_name

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "OpenAI"
    }
  )
}

# Virtual Network Links for Private DNS Zones
resource "azurerm_private_dns_zone_virtual_network_link" "key_vault" {
  count                 = local.enabled_resources.key_vault && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-kv-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.key_vault[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "sql_server" {
  count                 = local.enabled_resources.sql_server && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-sql-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.sql_server[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "redis_cache" {
  count                 = local.enabled_resources.redis_cache && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-redis-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.redis_cache[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_blob" {
  count                 = local.enabled_resources.storage_account && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-storage-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.storage_blob[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "cosmos_db" {
  count                 = local.enabled_resources.cosmos_db && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-cosmos-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.cosmos_db[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "container_registry" {
  count                 = local.enabled_resources.container_registry && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-acr-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.container_registry[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "openai" {
  count                 = local.enabled_resources.openai && var.create_private_dns_zones ? 1 : 0
  name                  = "${var.project_name}-openai-vnet-link-${var.environment}"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.openai[0].name
  virtual_network_id    = var.vnet_id
  registration_enabled  = false

  tags = var.tags
}

# Private Endpoint for Key Vault
resource "azurerm_private_endpoint" "key_vault" {
  count               = local.enabled_resources.key_vault ? 1 : 0
  name                = "${var.project_name}-kv-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-kv-psc-${var.environment}"
    private_connection_resource_id = var.key_vault_id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.key_vault[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "KeyVault"
    }
  )
}

# Private Endpoint for SQL Server
resource "azurerm_private_endpoint" "sql_server" {
  count               = local.enabled_resources.sql_server ? 1 : 0
  name                = "${var.project_name}-sql-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-sql-psc-${var.environment}"
    private_connection_resource_id = var.sql_server_id
    is_manual_connection           = false
    subresource_names              = ["sqlServer"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.sql_server[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "SQLServer"
    }
  )
}

# Private Endpoint for Redis Cache
resource "azurerm_private_endpoint" "redis_cache" {
  count               = local.enabled_resources.redis_cache ? 1 : 0
  name                = "${var.project_name}-redis-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-redis-psc-${var.environment}"
    private_connection_resource_id = var.redis_cache_id
    is_manual_connection           = false
    subresource_names              = ["redisCache"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.redis_cache[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "RedisCache"
    }
  )
}

# Private Endpoint for Storage Account (Blob)
resource "azurerm_private_endpoint" "storage_blob" {
  count               = local.enabled_resources.storage_account ? 1 : 0
  name                = "${var.project_name}-storage-blob-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-storage-blob-psc-${var.environment}"
    private_connection_resource_id = var.storage_account_id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.storage_blob[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "StorageBlob"
    }
  )
}

# Private Endpoint for Cosmos DB
resource "azurerm_private_endpoint" "cosmos_db" {
  count               = local.enabled_resources.cosmos_db ? 1 : 0
  name                = "${var.project_name}-cosmos-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-cosmos-psc-${var.environment}"
    private_connection_resource_id = var.cosmos_db_id
    is_manual_connection           = false
    subresource_names              = ["Sql"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.cosmos_db[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "CosmosDB"
    }
  )
}

# Private Endpoint for Container Registry
resource "azurerm_private_endpoint" "container_registry" {
  count               = local.enabled_resources.container_registry ? 1 : 0
  name                = "${var.project_name}-acr-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-acr-psc-${var.environment}"
    private_connection_resource_id = var.container_registry_id
    is_manual_connection           = false
    subresource_names              = ["registry"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.container_registry[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "ContainerRegistry"
    }
  )
}

# Private Endpoint for OpenAI
resource "azurerm_private_endpoint" "openai" {
  count               = local.enabled_resources.openai ? 1 : 0
  name                = "${var.project_name}-openai-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.project_name}-openai-psc-${var.environment}"
    private_connection_resource_id = var.openai_id
    is_manual_connection           = false
    subresource_names              = ["account"]
  }

  dynamic "private_dns_zone_group" {
    for_each = var.create_private_dns_zones ? [1] : []
    content {
      name                 = "default"
      private_dns_zone_ids = [azurerm_private_dns_zone.openai[0].id]
    }
  }

  tags = merge(
    var.tags,
    {
      "Environment" = var.environment
      "Project"     = var.project_name
      "Service"     = "OpenAI"
    }
  )
}
