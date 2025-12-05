// ============================================================================
// App Services Module - Web App, Auth Service, AI Service
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('App Service Plan ID')
param appServicePlanId string

@description('Container Registry Name')
param containerRegistryName string

@description('Container Registry URL')
param containerRegistryUrl string

@description('Key Vault Name')
param keyVaultName string

@description('Application Insights Instrumentation Key')
@secure()
param appInsightsInstrumentationKey string

@description('Application Insights Connection String')
@secure()
param appInsightsConnectionString string

@description('App Service Subnet ID')
param subnetId string

@description('Resource tags')
param tags object

// ============================================================================
// Variables
// ============================================================================

var webAppName = '${projectName}-${environment}-web'
var authServiceName = '${projectName}-${environment}-auth'
var aiServiceName = '${projectName}-${environment}-ai'

// Common app settings
var commonAppSettings = [
  {
    name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
    value: appInsightsConnectionString
  }
  {
    name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
    value: '~3'
  }
  {
    name: 'XDT_MicrosoftApplicationInsights_Mode'
    value: 'recommended'
  }
  {
    name: 'DOCKER_REGISTRY_SERVER_URL'
    value: 'https://${containerRegistryUrl}'
  }
  {
    name: 'DOCKER_ENABLE_CI'
    value: 'true'
  }
  {
    name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
    value: 'false'
  }
  {
    name: 'NODE_ENV'
    value: environment == 'prod' ? 'production' : environment
  }
  {
    name: 'KEY_VAULT_NAME'
    value: keyVaultName
  }
]

// ============================================================================
// Web App (Next.js Frontend)
// ============================================================================

resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: subnetId
    vnetRouteAllEnabled: true
    vnetImagePullEnabled: true
    vnetContentShareEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistryUrl}/web-app:latest'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/api/health'
      numberOfWorkers: 1
      appSettings: concat(commonAppSettings, [
        {
          name: 'NEXT_PUBLIC_API_URL'
          value: 'https://${authServiceName}.azurewebsites.net'
        }
        {
          name: 'NEXT_PUBLIC_AI_SERVICE_URL'
          value: 'https://${aiServiceName}.azurewebsites.net'
        }
      ])
    }
  }
}

// ============================================================================
// Auth Service (Node.js API)
// ============================================================================

resource authService 'Microsoft.Web/sites@2023-01-01' = {
  name: authServiceName
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: subnetId
    vnetRouteAllEnabled: true
    vnetImagePullEnabled: true
    vnetContentShareEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistryUrl}/auth-service:latest'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      numberOfWorkers: 1
      cors: {
        allowedOrigins: [
          'https://${webAppName}.azurewebsites.net'
        ]
        supportCredentials: true
      }
      appSettings: concat(commonAppSettings, [
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'DATABASE_URL'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/DATABASE-URL/)'
        }
        {
          name: 'REDIS_URL'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/REDIS-URL/)'
        }
        {
          name: 'JWT_SECRET'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/JWT-SECRET/)'
        }
        {
          name: 'SERVICE_BUS_CONNECTION_STRING'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/SERVICE-BUS-CONNECTION-STRING/)'
        }
      ])
    }
  }
}

// ============================================================================
// AI Service (Python FastAPI)
// ============================================================================

resource aiService 'Microsoft.Web/sites@2023-01-01' = {
  name: aiServiceName
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    virtualNetworkSubnetId: subnetId
    vnetRouteAllEnabled: true
    vnetImagePullEnabled: true
    vnetContentShareEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistryUrl}/ai-service:latest'
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'Disabled'
      healthCheckPath: '/health'
      numberOfWorkers: 1
      cors: {
        allowedOrigins: [
          'https://${webAppName}.azurewebsites.net'
          'https://${authServiceName}.azurewebsites.net'
        ]
        supportCredentials: true
      }
      appSettings: concat(commonAppSettings, [
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'OPENAI_API_KEY'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/OPENAI-API-KEY/)'
        }
        {
          name: 'REDIS_URL'
          value: '@Microsoft.KeyVault(SecretUri=https://${keyVaultName}.vault.azure.net/secrets/REDIS-URL/)'
        }
      ])
    }
  }
}

// ============================================================================
// Deployment Slots (Production Only)
// ============================================================================

resource webAppSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (environment == 'prod') {
  parent: webApp
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: webApp.properties.siteConfig
  }
}

resource authServiceSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (environment == 'prod') {
  parent: authService
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: authService.properties.siteConfig
  }
}

resource aiServiceSlot 'Microsoft.Web/sites/slots@2023-01-01' = if (environment == 'prod') {
  parent: aiService
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    siteConfig: aiService.properties.siteConfig
  }
}

// ============================================================================
// Outputs
// ============================================================================

output webAppId string = webApp.id
output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output webAppPrincipalId string = webApp.identity.principalId

output authServiceId string = authService.id
output authServiceName string = authService.name
output authServiceUrl string = 'https://${authService.properties.defaultHostName}'
output authServicePrincipalId string = authService.identity.principalId

output aiServiceId string = aiService.id
output aiServiceName string = aiService.name
output aiServiceUrl string = 'https://${aiService.properties.defaultHostName}'
output aiServicePrincipalId string = aiService.identity.principalId

output appServiceIds array = [
  webApp.id
  authService.id
  aiService.id
]
