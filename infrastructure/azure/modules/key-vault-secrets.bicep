// ============================================================================
// Key Vault Secrets Module
// ============================================================================

@description('Key Vault Name')
param keyVaultName string

@description('SQL Connection String')
@secure()
param sqlConnectionString string

@description('Redis Connection String')
@secure()
param redisConnectionString string

@description('Service Bus Connection String')
@secure()
param serviceBusConnectionString string

@description('Application Insights Instrumentation Key')
@secure()
param appInsightsInstrumentationKey string

@description('Container Registry Username')
@secure()
param containerRegistryUsername string

@description('Container Registry Password')
@secure()
param containerRegistryPassword string

// ============================================================================
// Reference to existing Key Vault
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// ============================================================================
// Database Secrets
// ============================================================================

resource databaseUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'DATABASE-URL'
  properties: {
    value: sqlConnectionString
    contentType: 'text/plain'
  }
}

// ============================================================================
// Redis Secrets
// ============================================================================

resource redisUrlSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'REDIS-URL'
  properties: {
    value: redisConnectionString
    contentType: 'text/plain'
  }
}

// ============================================================================
// Service Bus Secrets
// ============================================================================

resource serviceBusConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SERVICE-BUS-CONNECTION-STRING'
  properties: {
    value: serviceBusConnectionString
    contentType: 'text/plain'
  }
}

// ============================================================================
// Application Insights Secrets
// ============================================================================

resource appInsightsKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'APPINSIGHTS-INSTRUMENTATION-KEY'
  properties: {
    value: appInsightsInstrumentationKey
    contentType: 'text/plain'
  }
}

// ============================================================================
// Container Registry Secrets
// ============================================================================

resource acrUsernameSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ACR-USERNAME'
  properties: {
    value: containerRegistryUsername
    contentType: 'text/plain'
  }
}

resource acrPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ACR-PASSWORD'
  properties: {
    value: containerRegistryPassword
    contentType: 'text/plain'
  }
}

// ============================================================================
// Placeholder Secrets (to be updated manually or via pipeline)
// ============================================================================

resource jwtSecretPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: 'PLACEHOLDER-UPDATE-IN-AZURE-DEVOPS-VARIABLE-GROUP'
    contentType: 'text/plain'
  }
}

resource openaiApiKeyPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'OPENAI-API-KEY'
  properties: {
    value: 'PLACEHOLDER-UPDATE-IN-AZURE-DEVOPS-VARIABLE-GROUP'
    contentType: 'text/plain'
  }
}

resource sessionSecretPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'SESSION-SECRET'
  properties: {
    value: 'PLACEHOLDER-UPDATE-IN-AZURE-DEVOPS-VARIABLE-GROUP'
    contentType: 'text/plain'
  }
}

resource encryptionKeyPlaceholder 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'ENCRYPTION-KEY'
  properties: {
    value: 'PLACEHOLDER-UPDATE-IN-AZURE-DEVOPS-VARIABLE-GROUP'
    contentType: 'text/plain'
  }
}

// ============================================================================
// Outputs
// ============================================================================

output secretsCreated array = [
  databaseUrlSecret.name
  redisUrlSecret.name
  serviceBusConnectionStringSecret.name
  appInsightsKeySecret.name
  acrUsernameSecret.name
  acrPasswordSecret.name
  jwtSecretPlaceholder.name
  openaiApiKeyPlaceholder.name
  sessionSecretPlaceholder.name
  encryptionKeyPlaceholder.name
]
