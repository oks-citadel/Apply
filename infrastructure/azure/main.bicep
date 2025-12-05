// ============================================================================
// Azure Bicep Template for JobPilot AI Platform Infrastructure
// ============================================================================
// This template deploys a complete Azure infrastructure for the Job-Apply-Platform
// including App Services, Container Registry, SQL Database, Redis Cache, Key Vault,
// Application Insights, Service Bus, and networking components.

targetScope = 'subscription'

// ============================================================================
// Parameters
// ============================================================================

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Primary Azure region for resources')
param location string = 'eastus'

@description('Project name prefix for resource naming')
param projectName string = 'jobpilot'

@description('SQL Administrator username')
@secure()
param sqlAdminUsername string

@description('SQL Administrator password')
@secure()
param sqlAdminPassword string

@description('Tags to apply to all resources')
param tags object = {
  Project: 'JobPilot'
  ManagedBy: 'AzureDevOps'
  CostCenter: 'Engineering'
}

@description('Enable Azure Defender for enhanced security')
param enableDefender bool = false

@description('Application Insights sampling percentage')
param appInsightsSamplingPercentage int = 100

@description('Enable diagnostic logs')
param enableDiagnostics bool = true

@description('Enable private endpoints for production networking')
param enablePrivateEndpoints bool = false

@description('Allowed IP addresses for Key Vault and SQL access (CIDR notation)')
param allowedIpAddresses array = []

@description('Enable Application Gateway with WAF')
param enableApplicationGateway bool = false

@description('Enable Azure Front Door with WAF (alternative to App Gateway)')
param enableFrontDoor bool = false

@description('WAF Mode (Detection or Prevention)')
@allowed(['Detection', 'Prevention'])
param wafMode string = 'Detection'

@description('Enable AKS cluster deployment')
param enableAKS bool = false

@description('AKS Kubernetes version')
param aksKubernetesVersion string = '1.28.3'

// ============================================================================
// Variables
// ============================================================================

var resourceGroupName = '${projectName}-${environment}-rg'
var uniqueSuffix = substring(uniqueString(subscription().subscriptionId, resourceGroupName), 0, 6)
var environmentConfig = {
  dev: {
    appServicePlanSku: {
      name: 'B2'
      tier: 'Basic'
      capacity: 1
    }
    sqlDatabaseSku: {
      name: 'Basic'
      tier: 'Basic'
      capacity: 5
    }
    redisCacheSku: {
      name: 'Basic'
      family: 'C'
      capacity: 0
    }
    enableAutoScaling: false
    minReplicas: 1
    maxReplicas: 2
  }
  staging: {
    appServicePlanSku: {
      name: 'S1'
      tier: 'Standard'
      capacity: 2
    }
    sqlDatabaseSku: {
      name: 'S1'
      tier: 'Standard'
      capacity: 20
    }
    redisCacheSku: {
      name: 'Standard'
      family: 'C'
      capacity: 1
    }
    enableAutoScaling: true
    minReplicas: 2
    maxReplicas: 5
  }
  prod: {
    appServicePlanSku: {
      name: 'P1v3'
      tier: 'PremiumV3'
      capacity: 3
    }
    sqlDatabaseSku: {
      name: 'S3'
      tier: 'Standard'
      capacity: 100
    }
    redisCacheSku: {
      name: 'Premium'
      family: 'P'
      capacity: 1
    }
    enableAutoScaling: true
    minReplicas: 3
    maxReplicas: 10
  }
}

var config = environmentConfig[environment]
var allTags = union(tags, {
  Environment: environment
  DeployedAt: utcNow()
})

// ============================================================================
// Resource Group
// ============================================================================

resource resourceGroup 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
  tags: allTags
}

// ============================================================================
// Module: Networking
// ============================================================================

module networking 'modules/networking.bicep' = {
  name: 'networking-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
  }
}

// ============================================================================
// Module: Managed Identities
// ============================================================================

module managedIdentities 'modules/managed-identity.bicep' = {
  name: 'managed-identities-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
  }
}

// ============================================================================
// Module: Container Registry
// ============================================================================

module containerRegistry 'modules/container-registry.bicep' = {
  name: 'acr-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    uniqueSuffix: uniqueSuffix
    tags: allTags
    enableDefender: enableDefender
    cicdManagedIdentityPrincipalId: managedIdentities.outputs.cicdManagedIdentityPrincipalId
    aksManagedIdentityPrincipalId: enableAKS ? managedIdentities.outputs.aksKubeletManagedIdentityPrincipalId : ''
    workloadManagedIdentityPrincipalId: managedIdentities.outputs.workloadManagedIdentityPrincipalId
  }
  dependsOn: [
    managedIdentities
  ]
}

// ============================================================================
// Module: Key Vault
// ============================================================================

module keyVault 'modules/key-vault.bicep' = {
  name: 'keyvault-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    uniqueSuffix: uniqueSuffix
    tags: allTags
    enableDiagnostics: enableDiagnostics
    enablePrivateEndpoint: enablePrivateEndpoints
    allowedIpAddresses: allowedIpAddresses
    virtualNetworkRules: []
  }
}

// ============================================================================
// Module: Application Insights
// ============================================================================

module appInsights 'modules/app-insights.bicep' = {
  name: 'appinsights-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    samplingPercentage: appInsightsSamplingPercentage
  }
}

// ============================================================================
// Module: SQL Database
// ============================================================================

module sqlDatabase 'modules/sql-database.bicep' = {
  name: 'sqldb-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    uniqueSuffix: uniqueSuffix
    sqlAdminUsername: sqlAdminUsername
    sqlAdminPassword: sqlAdminPassword
    databaseSku: config.sqlDatabaseSku
    tags: allTags
    enableDefender: enableDefender
    subnetId: networking.outputs.databaseSubnetId
    enablePrivateEndpoint: enablePrivateEndpoints
    allowedIpAddresses: allowedIpAddresses
  }
}

// ============================================================================
// Module: Redis Cache
// ============================================================================

module redisCache 'modules/redis-cache.bicep' = {
  name: 'redis-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    uniqueSuffix: uniqueSuffix
    cacheSku: config.redisCacheSku
    tags: allTags
    subnetId: networking.outputs.cacheSubnetId
    enablePrivateEndpoint: enablePrivateEndpoints
  }
}

// ============================================================================
// Module: Service Bus
// ============================================================================

module serviceBus 'modules/service-bus.bicep' = {
  name: 'servicebus-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    uniqueSuffix: uniqueSuffix
    tags: allTags
    sku: environment == 'prod' ? 'Premium' : 'Standard'
  }
}

// ============================================================================
// Module: Private Endpoints
// ============================================================================

module privateEndpoints 'modules/private-endpoints.bicep' = if (enablePrivateEndpoints) {
  name: 'private-endpoints-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    vnetId: networking.outputs.vnetId
    privateEndpointsSubnetId: networking.outputs.privateEndpointsSubnetId
    keyVaultId: keyVault.outputs.keyVaultId
    sqlServerId: sqlDatabase.outputs.sqlServerId
    redisCacheId: redisCache.outputs.redisCacheId
    storageAccountId: '' // Can be added when storage account is implemented
  }
  dependsOn: [
    keyVault
    sqlDatabase
    redisCache
    networking
  ]
}

// ============================================================================
// Module: App Service Plan
// ============================================================================

module appServicePlan 'modules/app-service-plan.bicep' = {
  name: 'appserviceplan-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    planSku: config.appServicePlanSku
    tags: allTags
    enableAutoScaling: config.enableAutoScaling
    minReplicas: config.minReplicas
    maxReplicas: config.maxReplicas
  }
}

// ============================================================================
// Module: App Services
// ============================================================================

module appServices 'modules/app-services.bicep' = {
  name: 'appservices-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    appServicePlanId: appServicePlan.outputs.appServicePlanId
    containerRegistryName: containerRegistry.outputs.containerRegistryName
    containerRegistryUrl: containerRegistry.outputs.containerRegistryLoginServer
    keyVaultName: keyVault.outputs.keyVaultName
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    appInsightsConnectionString: appInsights.outputs.connectionString
    subnetId: networking.outputs.appServiceSubnetId
    tags: allTags
  }
}

// ============================================================================
// Module: AKS Cluster (Optional)
// ============================================================================

module aksCluster 'modules/aks.bicep' = if (enableAKS) {
  name: 'aks-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    kubernetesVersion: aksKubernetesVersion
    subnetId: networking.outputs.aksSubnetId
    logAnalyticsWorkspaceId: appInsights.outputs.logAnalyticsWorkspaceId
    kubeletManagedIdentityId: managedIdentities.outputs.aksKubeletManagedIdentityId
    enableAzurePolicy: true
    enableMonitoring: true
    enablePrivateCluster: enablePrivateEndpoints
  }
  dependsOn: [
    networking
    appInsights
    managedIdentities
    containerRegistry
  ]
}

// ============================================================================
// Module: Store Secrets in Key Vault
// ============================================================================

module secrets 'modules/key-vault-secrets.bicep' = {
  name: 'secrets-deployment'
  scope: resourceGroup
  params: {
    keyVaultName: keyVault.outputs.keyVaultName
    sqlConnectionString: sqlDatabase.outputs.connectionString
    redisConnectionString: redisCache.outputs.connectionString
    serviceBusConnectionString: serviceBus.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    containerRegistryUsername: '' // Admin user disabled - using managed identity
    containerRegistryPassword: '' // Admin password disabled - using managed identity
  }
  dependsOn: [
    sqlDatabase
    redisCache
    serviceBus
    containerRegistry
    keyVault
  ]
}

// ============================================================================
// Module: Application Gateway with WAF (Optional)
// ============================================================================

module applicationGateway 'modules/application-gateway.bicep' = if (enableApplicationGateway) {
  name: 'appgateway-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    vnetName: networking.outputs.vnetName
    backendAppServices: {
      webAppFqdn: replace(replace(appServices.outputs.webAppUrl, 'https://', ''), 'http://', '')
      authServiceFqdn: replace(replace(appServices.outputs.authServiceUrl, 'https://', ''), 'http://', '')
      aiServiceFqdn: replace(replace(appServices.outputs.aiServiceUrl, 'https://', ''), 'http://', '')
    }
    enableWaf: true
    wafMode: wafMode
  }
  dependsOn: [
    networking
    appServices
  ]
}

// ============================================================================
// Module: Azure Front Door with WAF (Optional - Alternative to App Gateway)
// ============================================================================

module frontDoor 'modules/front-door.bicep' = if (enableFrontDoor) {
  name: 'frontdoor-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    backendAppServices: {
      webAppFqdn: replace(replace(appServices.outputs.webAppUrl, 'https://', ''), 'http://', '')
      authServiceFqdn: replace(replace(appServices.outputs.authServiceUrl, 'https://', ''), 'http://', '')
      aiServiceFqdn: replace(replace(appServices.outputs.aiServiceUrl, 'https://', ''), 'http://', '')
    }
    enableWaf: true
    wafMode: wafMode
    enableCaching: true
  }
  dependsOn: [
    appServices
  ]
}

// ============================================================================
// Module: Monitoring and Alerts
// ============================================================================

module monitoring 'modules/monitoring.bicep' = {
  name: 'monitoring-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    appInsightsId: appInsights.outputs.appInsightsId
    logAnalyticsWorkspaceId: appInsights.outputs.logAnalyticsWorkspaceId
    sqlServerId: sqlDatabase.outputs.sqlServerId
    redisCacheId: redisCache.outputs.redisCacheId
    webAppIds: appServices.outputs.appServiceIds
    webAppUrls: {
      webAppUrl: appServices.outputs.webAppUrl
      authServiceUrl: appServices.outputs.authServiceUrl
      aiServiceUrl: appServices.outputs.aiServiceUrl
    }
  }
}

// ============================================================================
// Module: Dashboards
// ============================================================================

module dashboards 'modules/dashboards.bicep' = {
  name: 'dashboards-deployment'
  scope: resourceGroup
  params: {
    location: location
    projectName: projectName
    environment: environment
    tags: allTags
    appInsightsId: appInsights.outputs.appInsightsId
    logAnalyticsWorkspaceId: appInsights.outputs.logAnalyticsWorkspaceId
    webAppIds: appServices.outputs.appServiceIds
    sqlServerId: sqlDatabase.outputs.sqlServerId
    redisCacheId: redisCache.outputs.redisCacheId
    applicationGatewayId: enableApplicationGateway ? applicationGateway.outputs.applicationGatewayId : ''
    frontDoorId: enableFrontDoor ? frontDoor.outputs.frontDoorId : ''
  }
  dependsOn: [
    monitoring
  ]
}

// ============================================================================
// Outputs
// ============================================================================

output resourceGroupName string = resourceGroup.name
output containerRegistryName string = containerRegistry.outputs.containerRegistryName
output containerRegistryLoginServer string = containerRegistry.outputs.containerRegistryLoginServer
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output appInsightsConnectionString string = appInsights.outputs.connectionString
output sqlServerFqdn string = sqlDatabase.outputs.sqlServerFqdn
output sqlDatabaseName string = sqlDatabase.outputs.databaseName
output redisCacheName string = redisCache.outputs.redisCacheName
output redisHostName string = redisCache.outputs.redisHostName
output serviceBusNamespace string = serviceBus.outputs.namespaceName
output webAppUrl string = appServices.outputs.webAppUrl
output authServiceUrl string = appServices.outputs.authServiceUrl
output aiServiceUrl string = appServices.outputs.aiServiceUrl
output vnetId string = networking.outputs.vnetId

// Managed Identity outputs
output cicdManagedIdentityClientId string = managedIdentities.outputs.cicdManagedIdentityClientId
output cicdManagedIdentityPrincipalId string = managedIdentities.outputs.cicdManagedIdentityPrincipalId
output workloadManagedIdentityClientId string = managedIdentities.outputs.workloadManagedIdentityClientId
output workloadManagedIdentityPrincipalId string = managedIdentities.outputs.workloadManagedIdentityPrincipalId
output aksKubeletManagedIdentityClientId string = managedIdentities.outputs.aksKubeletManagedIdentityClientId
output aksKubeletManagedIdentityPrincipalId string = managedIdentities.outputs.aksKubeletManagedIdentityPrincipalId

// AKS outputs (only when enabled)
output aksClusterEnabled bool = enableAKS
output aksClusterName string = enableAKS ? aksCluster.outputs.aksClusterName : ''
output aksClusterFqdn string = enableAKS ? aksCluster.outputs.aksClusterFqdn : ''
output aksOidcIssuerUrl string = enableAKS ? aksCluster.outputs.aksOidcIssuerUrl : ''
output aksNodeResourceGroup string = enableAKS ? aksCluster.outputs.aksNodeResourceGroup : ''

// Private Endpoint outputs (only when enabled)
output privateEndpointsEnabled bool = enablePrivateEndpoints
output keyVaultPrivateEndpointIp string = enablePrivateEndpoints ? privateEndpoints.outputs.keyVaultPrivateEndpointIp : ''
output sqlPrivateEndpointIp string = enablePrivateEndpoints ? privateEndpoints.outputs.sqlPrivateEndpointIp : ''
output redisPrivateEndpointIp string = enablePrivateEndpoints ? privateEndpoints.outputs.redisPrivateEndpointIp : ''

// WAF and Load Balancing outputs
output applicationGatewayEnabled bool = enableApplicationGateway
output applicationGatewayPublicIp string = enableApplicationGateway ? applicationGateway.outputs.publicIpAddress : ''
output applicationGatewayFqdn string = enableApplicationGateway ? applicationGateway.outputs.appGatewayFqdn : ''
output frontDoorEnabled bool = enableFrontDoor
output frontDoorUrl string = enableFrontDoor ? frontDoor.outputs.frontDoorUrl : ''
output frontDoorEndpointHostName string = enableFrontDoor ? frontDoor.outputs.frontDoorEndpointHostName : ''

// Monitoring outputs
output monitoringDashboardId string = dashboards.outputs.dashboardId
output actionGroupId string = monitoring.outputs.actionGroupId
