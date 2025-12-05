// ============================================================================
// Networking Module - Virtual Network and Subnets
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

// ============================================================================
// Variables
// ============================================================================

var vnetName = '${projectName}-${environment}-vnet'
var nsgName = '${projectName}-${environment}-nsg'
var addressPrefix = environment == 'prod' ? '10.0.0.0/16' : environment == 'staging' ? '10.1.0.0/16' : '10.2.0.0/16'

var subnets = [
  {
    name: 'app-service-subnet'
    addressPrefix: environment == 'prod' ? '10.0.1.0/24' : environment == 'staging' ? '10.1.1.0/24' : '10.2.1.0/24'
    delegation: 'Microsoft.Web/serverFarms'
    serviceEndpoints: ['Microsoft.Sql', 'Microsoft.KeyVault', 'Microsoft.Storage']
  }
  {
    name: 'database-subnet'
    addressPrefix: environment == 'prod' ? '10.0.2.0/24' : environment == 'staging' ? '10.1.2.0/24' : '10.2.2.0/24'
    delegation: null
    serviceEndpoints: ['Microsoft.Sql']
  }
  {
    name: 'cache-subnet'
    addressPrefix: environment == 'prod' ? '10.0.3.0/24' : environment == 'staging' ? '10.1.3.0/24' : '10.2.3.0/24'
    delegation: null
    serviceEndpoints: []
  }
  {
    name: 'private-endpoints-subnet'
    addressPrefix: environment == 'prod' ? '10.0.4.0/24' : environment == 'staging' ? '10.1.4.0/24' : '10.2.4.0/24'
    delegation: null
    serviceEndpoints: ['Microsoft.KeyVault', 'Microsoft.Storage']
  }
  {
    name: 'aks-subnet'
    addressPrefix: environment == 'prod' ? '10.0.5.0/23' : environment == 'staging' ? '10.1.5.0/23' : '10.2.5.0/23'
    delegation: null
    serviceEndpoints: ['Microsoft.ContainerRegistry', 'Microsoft.KeyVault', 'Microsoft.Storage']
  }
]

// ============================================================================
// Network Security Group
// ============================================================================

resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgName
  location: location
  tags: tags
  properties: {
    securityRules: [
      {
        name: 'AllowHTTPS'
        properties: {
          priority: 100
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'AllowHTTP'
        properties: {
          priority: 110
          direction: 'Inbound'
          access: 'Allow'
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: 'Internet'
          destinationAddressPrefix: '*'
        }
      }
      {
        name: 'DenyAllInbound'
        properties: {
          priority: 4096
          direction: 'Inbound'
          access: 'Deny'
          protocol: '*'
          sourcePortRange: '*'
          destinationPortRange: '*'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
        }
      }
    ]
  }
}

// ============================================================================
// Virtual Network
// ============================================================================

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        addressPrefix
      ]
    }
    subnets: [for subnet in subnets: {
      name: subnet.name
      properties: {
        addressPrefix: subnet.addressPrefix
        networkSecurityGroup: {
          id: nsg.id
        }
        serviceEndpoints: [for endpoint in subnet.serviceEndpoints: {
          service: endpoint
        }]
        delegations: subnet.delegation != null ? [
          {
            name: '${subnet.delegation}-delegation'
            properties: {
              serviceName: subnet.delegation
            }
          }
        ] : []
        privateEndpointNetworkPolicies: 'Disabled'
        privateLinkServiceNetworkPolicies: 'Disabled'
      }
    }]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output vnetId string = vnet.id
output vnetName string = vnet.name
output appServiceSubnetId string = vnet.properties.subnets[0].id
output databaseSubnetId string = vnet.properties.subnets[1].id
output cacheSubnetId string = vnet.properties.subnets[2].id
output privateEndpointsSubnetId string = vnet.properties.subnets[3].id
output aksSubnetId string = vnet.properties.subnets[4].id
