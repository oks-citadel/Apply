// ============================================================================
// Private Endpoints Module
// ============================================================================
// This module creates private endpoints for all platform services:
// - Key Vault
// - SQL Database
// - Redis Cache
// - Storage Account (if applicable)
// It also creates and configures Private DNS zones for service resolution

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('VNet ID for DNS zone links')
param vnetId string

@description('Private endpoints subnet ID')
param privateEndpointsSubnetId string

@description('Key Vault resource ID')
param keyVaultId string

@description('SQL Server resource ID')
param sqlServerId string

@description('Redis Cache resource ID')
param redisCacheId string

@description('Storage Account resource ID (optional)')
param storageAccountId string = ''

// ============================================================================
// Variables
// ============================================================================

var privateEndpointPrefix = '${projectName}-${environment}-pe'

// Private DNS Zone names
var privateDnsZones = {
  keyVault: 'privatelink.vaultcore.azure.net'
  sqlDatabase: 'privatelink${az.environment().suffixes.sqlServerHostname}'
  redisCache: 'privatelink.redis.cache.windows.net'
  storageBlob: 'privatelink.blob.${az.environment().suffixes.storage}'
  storageFile: 'privatelink.file.${az.environment().suffixes.storage}'
  storageQueue: 'privatelink.queue.${az.environment().suffixes.storage}'
  storageTable: 'privatelink.table.${az.environment().suffixes.storage}'
}

// ============================================================================
// Private DNS Zones
// ============================================================================

// Key Vault Private DNS Zone
resource keyVaultPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.keyVault
  location: 'global'
  tags: tags
}

resource keyVaultPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: keyVaultPrivateDnsZone
  name: '${projectName}-${environment}-kv-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// SQL Database Private DNS Zone
resource sqlPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.sqlDatabase
  location: 'global'
  tags: tags
}

resource sqlPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: sqlPrivateDnsZone
  name: '${projectName}-${environment}-sql-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// Redis Cache Private DNS Zone
resource redisPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.redisCache
  location: 'global'
  tags: tags
}

resource redisPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: redisPrivateDnsZone
  name: '${projectName}-${environment}-redis-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// Storage Account Private DNS Zones (created even if storage not used yet)
resource storageBlobPrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.storageBlob
  location: 'global'
  tags: tags
}

resource storageBlobPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: storageBlobPrivateDnsZone
  name: '${projectName}-${environment}-storage-blob-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

resource storageFilePrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.storageFile
  location: 'global'
  tags: tags
}

resource storageFilePrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: storageFilePrivateDnsZone
  name: '${projectName}-${environment}-storage-file-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

resource storageQueuePrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.storageQueue
  location: 'global'
  tags: tags
}

resource storageQueuePrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: storageQueuePrivateDnsZone
  name: '${projectName}-${environment}-storage-queue-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

resource storageTablePrivateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZones.storageTable
  location: 'global'
  tags: tags
}

resource storageTablePrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: storageTablePrivateDnsZone
  name: '${projectName}-${environment}-storage-table-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// ============================================================================
// Private Endpoints
// ============================================================================

// Key Vault Private Endpoint
resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: '${privateEndpointPrefix}-keyvault'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointPrefix}-keyvault-connection'
        properties: {
          privateLinkServiceId: keyVaultId
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
}

resource keyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: keyVaultPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: keyVaultPrivateDnsZone.id
        }
      }
    ]
  }
}

// SQL Database Private Endpoint
resource sqlPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: '${privateEndpointPrefix}-sql'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointPrefix}-sql-connection'
        properties: {
          privateLinkServiceId: sqlServerId
          groupIds: [
            'sqlServer'
          ]
        }
      }
    ]
  }
}

resource sqlPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: sqlPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: sqlPrivateDnsZone.id
        }
      }
    ]
  }
}

// Redis Cache Private Endpoint
resource redisPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: '${privateEndpointPrefix}-redis'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointPrefix}-redis-connection'
        properties: {
          privateLinkServiceId: redisCacheId
          groupIds: [
            'redisCache'
          ]
        }
      }
    ]
  }
}

resource redisPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: redisPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: redisPrivateDnsZone.id
        }
      }
    ]
  }
}

// Storage Account Private Endpoint (Blob) - Only created if storage account exists
resource storageBlobPrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = if (!empty(storageAccountId)) {
  name: '${privateEndpointPrefix}-storage-blob'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointPrefix}-storage-blob-connection'
        properties: {
          privateLinkServiceId: storageAccountId
          groupIds: [
            'blob'
          ]
        }
      }
    ]
  }
}

resource storageBlobPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = if (!empty(storageAccountId)) {
  parent: storageBlobPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: storageBlobPrivateDnsZone.id
        }
      }
    ]
  }
}

// Storage Account Private Endpoint (File) - Only created if storage account exists
resource storageFilePrivateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = if (!empty(storageAccountId)) {
  name: '${privateEndpointPrefix}-storage-file'
  location: location
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointPrefix}-storage-file-connection'
        properties: {
          privateLinkServiceId: storageAccountId
          groupIds: [
            'file'
          ]
        }
      }
    ]
  }
}

resource storageFilePrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = if (!empty(storageAccountId)) {
  parent: storageFilePrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'config1'
        properties: {
          privateDnsZoneId: storageFilePrivateDnsZone.id
        }
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output keyVaultPrivateEndpointId string = keyVaultPrivateEndpoint.id
output keyVaultPrivateEndpointIp string = keyVaultPrivateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]

output sqlPrivateEndpointId string = sqlPrivateEndpoint.id
output sqlPrivateEndpointIp string = sqlPrivateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]

output redisPrivateEndpointId string = redisPrivateEndpoint.id
output redisPrivateEndpointIp string = redisPrivateEndpoint.properties.customDnsConfigs[0].ipAddresses[0]

output storageBlobPrivateEndpointId string = !empty(storageAccountId) ? storageBlobPrivateEndpoint.id : ''
output storageBlobPrivateEndpointIp string = !empty(storageAccountId) ? storageBlobPrivateEndpoint.properties.customDnsConfigs[0].ipAddresses[0] : ''

output storageFilePrivateEndpointId string = !empty(storageAccountId) ? storageFilePrivateEndpoint.id : ''
output storageFilePrivateEndpointIp string = !empty(storageAccountId) ? storageFilePrivateEndpoint.properties.customDnsConfigs[0].ipAddresses[0] : ''

// DNS Zone outputs
output keyVaultPrivateDnsZoneId string = keyVaultPrivateDnsZone.id
output sqlPrivateDnsZoneId string = sqlPrivateDnsZone.id
output redisPrivateDnsZoneId string = redisPrivateDnsZone.id
output storageBlobPrivateDnsZoneId string = storageBlobPrivateDnsZone.id
output storageFilePrivateDnsZoneId string = storageFilePrivateDnsZone.id
output storageQueuePrivateDnsZoneId string = storageQueuePrivateDnsZone.id
output storageTablePrivateDnsZoneId string = storageTablePrivateDnsZone.id
