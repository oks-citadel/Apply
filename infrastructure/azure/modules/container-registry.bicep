// ============================================================================
// Azure Container Registry Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Unique suffix')
param uniqueSuffix string

@description('Resource tags')
param tags object

@description('Enable Azure Defender')
param enableDefender bool

@description('CI/CD Managed Identity Principal ID for ACR access')
param cicdManagedIdentityPrincipalId string = ''

@description('AKS Managed Identity Principal ID for ACR pull access')
param aksManagedIdentityPrincipalId string = ''

@description('Workload Managed Identity Principal ID for ACR access')
param workloadManagedIdentityPrincipalId string = ''

// ============================================================================
// Variables
// ============================================================================

var acrName = '${projectName}${environment}acr${uniqueSuffix}'
var acrSku = environment == 'prod' ? 'Premium' : 'Standard'

// Azure RBAC Role Definition IDs
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
var acrPushRoleId = '8311e382-0749-4cb8-b61a-304f252e45ec' // AcrPush

// ============================================================================
// Container Registry
// ============================================================================

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  tags: tags
  sku: {
    name: acrSku
  }
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    adminUserEnabled: false // Disabled - use managed identity instead
    publicNetworkAccess: 'Enabled'
    networkRuleBypassOptions: 'AzureServices'
    policies: {
      quarantinePolicy: {
        status: 'enabled'
      }
      retentionPolicy: {
        status: 'enabled'
        days: environment == 'prod' ? 30 : 7
      }
      trustPolicy: {
        status: environment == 'prod' ? 'enabled' : 'disabled'
        type: 'Notary'
      }
    }
    encryption: {
      status: 'disabled'
    }
    dataEndpointEnabled: false
    anonymousPullEnabled: false
    zoneRedundancy: environment == 'prod' ? 'Enabled' : 'Disabled'
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${acrName}-diagnostics'
  scope: containerRegistry
  properties: {
    logs: [
      {
        category: 'ContainerRegistryRepositoryEvents'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'ContainerRegistryLoginEvents'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
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
// Role Assignments for Managed Identities
// ============================================================================

// CI/CD Managed Identity - AcrPush (build and push images)
resource cicdAcrPushRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(cicdManagedIdentityPrincipalId)) {
  name: guid(containerRegistry.id, cicdManagedIdentityPrincipalId, acrPushRoleId)
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPushRoleId)
    principalId: cicdManagedIdentityPrincipalId
    principalType: 'ServicePrincipal'
    description: 'Allows CI/CD pipeline to push images to ACR'
  }
}

// CI/CD Managed Identity - AcrPull (for scanning and validation)
resource cicdAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(cicdManagedIdentityPrincipalId)) {
  name: guid(containerRegistry.id, cicdManagedIdentityPrincipalId, acrPullRoleId)
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: cicdManagedIdentityPrincipalId
    principalType: 'ServicePrincipal'
    description: 'Allows CI/CD pipeline to pull images from ACR'
  }
}

// AKS Managed Identity - AcrPull (pull images for deployment)
resource aksAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(aksManagedIdentityPrincipalId)) {
  name: guid(containerRegistry.id, aksManagedIdentityPrincipalId, acrPullRoleId)
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: aksManagedIdentityPrincipalId
    principalType: 'ServicePrincipal'
    description: 'Allows AKS cluster to pull images from ACR'
  }
}

// Workload Managed Identity - AcrPull (for workload identity scenarios)
resource workloadAcrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(workloadManagedIdentityPrincipalId)) {
  name: guid(containerRegistry.id, workloadManagedIdentityPrincipalId, acrPullRoleId)
  scope: containerRegistry
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: workloadManagedIdentityPrincipalId
    principalType: 'ServicePrincipal'
    description: 'Allows workloads to pull images from ACR'
  }
}

// ============================================================================
// Outputs
// ============================================================================

output containerRegistryId string = containerRegistry.id
output containerRegistryName string = containerRegistry.name
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output containerRegistryPrincipalId string = containerRegistry.identity.principalId
output containerRegistryTenantId string = containerRegistry.identity.tenantId
