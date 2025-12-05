// ============================================================================
// Azure Key Vault Module
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

@description('Enable diagnostic logs')
param enableDiagnostics bool

@description('Enable private endpoint access (disables public access for production)')
param enablePrivateEndpoint bool = false

@description('Allowed IP addresses for Key Vault access (CIDR notation)')
param allowedIpAddresses array = []

@description('Virtual Network rules for Key Vault access')
param virtualNetworkRules array = []

// ============================================================================
// Variables
// ============================================================================

var keyVaultName = '${projectName}-${environment}-kv-${uniqueSuffix}'

// For production with private endpoints, disable public access
// For non-production or without private endpoints, allow public access
var publicNetworkAccess = (environment == 'prod' && enablePrivateEndpoint) ? 'Disabled' : 'Enabled'

// Network ACL default action
// - Production with private endpoints: Deny all by default
// - Other environments: Allow Azure services but require IP allowlist if specified
var networkAclDefaultAction = (environment == 'prod' && enablePrivateEndpoint) ? 'Deny' : (empty(allowedIpAddresses) ? 'Allow' : 'Deny')

// Convert allowed IP addresses to Key Vault IP rules format
var ipRules = [for ip in allowedIpAddresses: {
  value: ip
}]

// ============================================================================
// Key Vault
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: environment == 'prod' ? 'premium' : 'standard'
    }
    tenantId: subscription().tenantId
    enabledForDeployment: true
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: environment == 'prod' ? 90 : 7
    enableRbacAuthorization: true
    enablePurgeProtection: environment == 'prod' ? true : null
    publicNetworkAccess: publicNetworkAccess
    networkAcls: {
      defaultAction: networkAclDefaultAction
      bypass: 'AzureServices'
      ipRules: ipRules
      virtualNetworkRules: virtualNetworkRules
    }
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableDiagnostics) {
  name: '${keyVaultName}-diagnostics'
  scope: keyVault
  properties: {
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
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
// Outputs
// ============================================================================

output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
