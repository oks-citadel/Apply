# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.project_name}-vnet-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  address_space = [
    var.environment == "dev" ? "10.0.0.0/16" :
    var.environment == "staging" ? "10.1.0.0/16" :
    "10.2.0.0/16"
  ]

  tags = merge(
    var.tags,
    {
      Component = "Networking"
    }
  )
}

# Subnets
resource "azurerm_subnet" "app_services" {
  name                 = "${var.project_name}-subnet-app-${var.environment}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes = [
    var.environment == "dev" ? "10.0.1.0/24" :
    var.environment == "staging" ? "10.1.1.0/24" :
    "10.2.1.0/24"
  ]

  delegation {
    name = "app-service-delegation"

    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
}

resource "azurerm_subnet" "database" {
  name                 = "${var.project_name}-subnet-db-${var.environment}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes = [
    var.environment == "dev" ? "10.0.2.0/24" :
    var.environment == "staging" ? "10.1.2.0/24" :
    "10.2.2.0/24"
  ]

  service_endpoints = ["Microsoft.Sql"]
}

resource "azurerm_subnet" "cache" {
  name                 = "${var.project_name}-subnet-cache-${var.environment}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes = [
    var.environment == "dev" ? "10.0.3.0/24" :
    var.environment == "staging" ? "10.1.3.0/24" :
    "10.2.3.0/24"
  ]

  service_endpoints = ["Microsoft.Storage"]
}

resource "azurerm_subnet" "private_endpoints" {
  name                 = "${var.project_name}-subnet-pe-${var.environment}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes = [
    var.environment == "dev" ? "10.0.4.0/24" :
    var.environment == "staging" ? "10.1.4.0/24" :
    "10.2.4.0/24"
  ]

  private_endpoint_network_policies_enabled = false
}

resource "azurerm_subnet" "aks" {
  count                = var.enable_aks ? 1 : 0
  name                 = "${var.project_name}-subnet-aks-${var.environment}"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  # Using /23 subnets aligned to proper CIDR boundaries
  address_prefixes = [
    var.environment == "dev" ? "10.0.8.0/23" :
    var.environment == "staging" ? "10.1.8.0/23" :
    "10.2.8.0/23"
  ]

  service_endpoints = [
    "Microsoft.ContainerRegistry",
    "Microsoft.KeyVault",
    "Microsoft.Storage"
  ]
}

# Network Security Groups
resource "azurerm_network_security_group" "app_services" {
  name                = "${var.project_name}-nsg-app-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAppServiceManagement"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  tags = merge(
    var.tags,
    {
      Component = "Networking"
      Subnet    = "AppServices"
    }
  )
}

resource "azurerm_network_security_group" "database" {
  name                = "${var.project_name}-nsg-db-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowAppServiceToSQL"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "1433"
    source_address_prefix      = azurerm_subnet.app_services.address_prefixes[0]
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAKSToSQL"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "1433"
    source_address_prefix      = var.enable_aks ? azurerm_subnet.aks[0].address_prefixes[0] : "0.0.0.0/32"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge(
    var.tags,
    {
      Component = "Networking"
      Subnet    = "Database"
    }
  )
}

resource "azurerm_network_security_group" "cache" {
  name                = "${var.project_name}-nsg-cache-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowAppServiceToRedis"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["6379", "6380"]
    source_address_prefix      = azurerm_subnet.app_services.address_prefixes[0]
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAKSToRedis"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["6379", "6380"]
    source_address_prefix      = var.enable_aks ? azurerm_subnet.aks[0].address_prefixes[0] : "0.0.0.0/32"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAzureLoadBalancer"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge(
    var.tags,
    {
      Component = "Networking"
      Subnet    = "Cache"
    }
  )
}

resource "azurerm_network_security_group" "private_endpoints" {
  name                = "${var.project_name}-nsg-pe-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowVNetInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = merge(
    var.tags,
    {
      Component = "Networking"
      Subnet    = "PrivateEndpoints"
    }
  )
}

resource "azurerm_network_security_group" "aks" {
  count               = var.enable_aks ? 1 : 0
  name                = "${var.project_name}-nsg-aks-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name

  security_rule {
    name                       = "AllowHTTPSFromInternet"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTPFromInternet"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowAKSManagement"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_ranges    = ["9000", "22"]
    source_address_prefix      = "AzureCloud"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowLoadBalancer"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowVNetOutbound"
    priority                   = 100
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "VirtualNetwork"
    destination_address_prefix = "VirtualNetwork"
  }

  security_rule {
    name                       = "AllowInternetOutbound"
    priority                   = 110
    direction                  = "Outbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "Internet"
  }

  tags = merge(
    var.tags,
    {
      Component = "Networking"
      Subnet    = "AKS"
    }
  )
}

# Subnet-NSG Associations
resource "azurerm_subnet_network_security_group_association" "app_services" {
  subnet_id                 = azurerm_subnet.app_services.id
  network_security_group_id = azurerm_network_security_group.app_services.id
}

resource "azurerm_subnet_network_security_group_association" "database" {
  subnet_id                 = azurerm_subnet.database.id
  network_security_group_id = azurerm_network_security_group.database.id
}

resource "azurerm_subnet_network_security_group_association" "cache" {
  subnet_id                 = azurerm_subnet.cache.id
  network_security_group_id = azurerm_network_security_group.cache.id
}

resource "azurerm_subnet_network_security_group_association" "private_endpoints" {
  subnet_id                 = azurerm_subnet.private_endpoints.id
  network_security_group_id = azurerm_network_security_group.private_endpoints.id
}

resource "azurerm_subnet_network_security_group_association" "aks" {
  count                     = var.enable_aks ? 1 : 0
  subnet_id                 = azurerm_subnet.aks[0].id
  network_security_group_id = azurerm_network_security_group.aks[0].id
}
