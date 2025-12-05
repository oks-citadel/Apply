// ============================================================================
// Azure Cache for Redis Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Unique suffix')
param uniqueSuffix string

@description('Cache SKU')
param cacheSku object

@description('Resource tags')
param tags object

@description('Cache subnet ID')
param subnetId string

@description('Enable private endpoint access (disables public access for production)')
param enablePrivateEndpoint bool = false

// ============================================================================
// Variables
// ============================================================================

var redisCacheName = '${projectName}-${environment}-redis-${uniqueSuffix}'

// For production with private endpoints, disable public access
// For non-production or without private endpoints, allow public access
// Note: Public network access control is only available for Premium SKU
var publicNetworkAccess = (environment == 'prod' && enablePrivateEndpoint && cacheSku.name == 'Premium') ? 'Disabled' : 'Enabled'

// ============================================================================
// Redis Cache
// ============================================================================

resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  location: location
  tags: tags
  properties: {
    sku: {
      name: cacheSku.name
      family: cacheSku.family
      capacity: cacheSku.capacity
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
    publicNetworkAccess: publicNetworkAccess
    redisConfiguration: {
      'maxmemory-policy': 'allkeys-lru'
      'maxmemory-reserved': '50'
      'maxfragmentationmemory-reserved': '50'
    }
    redisVersion: '6'
    replicasPerMaster: environment == 'prod' ? 1 : 0
    replicasPerPrimary: environment == 'prod' ? 1 : 0
    shardCount: cacheSku.name == 'Premium' ? 1 : null
    staticIP: null
    // Use subnet injection only for Premium SKU when not using private endpoints
    // Private endpoints handle network connectivity separately
    subnetId: (cacheSku.name == 'Premium' && !enablePrivateEndpoint) ? subnetId : null
    tenantSettings: {}
    updateChannel: 'Stable'
  }
  zones: environment == 'prod' ? ['1', '2', '3'] : null
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${redisCacheName}-diagnostics'
  scope: redisCache
  properties: {
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output redisCacheId string = redisCache.id
output redisCacheName string = redisCache.name
output redisHostName string = redisCache.properties.hostName
output redisSslPort int = redisCache.properties.sslPort
output redisPort int = redisCache.properties.port
output connectionString string = '${redisCache.properties.hostName}:${redisCache.properties.sslPort},password=${redisCache.listKeys().primaryKey},ssl=True,abortConnect=False'
