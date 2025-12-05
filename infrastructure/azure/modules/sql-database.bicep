// ============================================================================
// Azure SQL Database Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Unique suffix')
param uniqueSuffix string

@description('SQL Admin Username')
@secure()
param sqlAdminUsername string

@description('SQL Admin Password')
@secure()
param sqlAdminPassword string

@description('Database SKU')
param databaseSku object

@description('Resource tags')
param tags object

@description('Enable Azure Defender')
param enableDefender bool

@description('Database subnet ID')
param subnetId string

@description('Enable private endpoint access (disables public access for production)')
param enablePrivateEndpoint bool = false

@description('Allowed IP addresses for SQL Server access (for development/staging)')
param allowedIpAddresses array = []

// ============================================================================
// Variables
// ============================================================================

var sqlServerName = '${projectName}-${environment}-sql-${uniqueSuffix}'
var databaseName = '${projectName}_${environment}'

// For production with private endpoints, disable public access
// For non-production or without private endpoints, allow public access
var publicNetworkAccess = (environment == 'prod' && enablePrivateEndpoint) ? 'Disabled' : 'Enabled'

// ============================================================================
// SQL Server
// ============================================================================

resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdminUsername
    administratorLoginPassword: sqlAdminPassword
    version: '12.0'
    minimalTlsVersion: '1.2'
    publicNetworkAccess: publicNetworkAccess
    restrictOutboundNetworkAccess: 'Disabled'
  }
}

// ============================================================================
// SQL Database
// ============================================================================

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: databaseName
  location: location
  tags: tags
  sku: {
    name: databaseSku.name
    tier: databaseSku.tier
    capacity: databaseSku.capacity
  }
  properties: {
    collation: 'SQL_Latin1_General_CP1_CI_AS'
    maxSizeBytes: environment == 'prod' ? 268435456000 : 2147483648 // 250GB for prod, 2GB for others
    catalogCollation: 'SQL_Latin1_General_CP1_CI_AS'
    zoneRedundant: environment == 'prod' ? true : false
    readScale: environment == 'prod' ? 'Enabled' : 'Disabled'
    requestedBackupStorageRedundancy: environment == 'prod' ? 'Geo' : 'Local'
    isLedgerOn: false
  }
}

// ============================================================================
// Firewall Rules
// ============================================================================

// Allow Azure Services (only when public access is enabled)
resource firewallRuleAzureServices 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = if (publicNetworkAccess == 'Enabled') {
  parent: sqlServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Custom IP address firewall rules (for development/staging access)
resource firewallRules 'Microsoft.Sql/servers/firewallRules@2023-05-01-preview' = [for (ipAddress, i) in allowedIpAddresses: if (publicNetworkAccess == 'Enabled') {
  parent: sqlServer
  name: 'AllowedIP-${i}'
  properties: {
    startIpAddress: ipAddress
    endIpAddress: ipAddress
  }
}]

// ============================================================================
// Virtual Network Rule
// ============================================================================

// Virtual network rule (only when not using private endpoints)
resource virtualNetworkRule 'Microsoft.Sql/servers/virtualNetworkRules@2023-05-01-preview' = if (!enablePrivateEndpoint) {
  parent: sqlServer
  name: 'database-subnet-rule'
  properties: {
    virtualNetworkSubnetId: subnetId
    ignoreMissingVnetServiceEndpoint: false
  }
}

// ============================================================================
// Transparent Data Encryption
// ============================================================================

resource transparentDataEncryption 'Microsoft.Sql/servers/databases/transparentDataEncryption@2023-05-01-preview' = {
  parent: sqlDatabase
  name: 'current'
  properties: {
    state: 'Enabled'
  }
}

// ============================================================================
// Azure Defender for SQL
// ============================================================================

resource securityAlertPolicies 'Microsoft.Sql/servers/securityAlertPolicies@2023-05-01-preview' = if (enableDefender) {
  parent: sqlServer
  name: 'Default'
  properties: {
    state: 'Enabled'
    emailAccountAdmins: true
    emailAddresses: []
    disabledAlerts: []
    retentionDays: 30
  }
}

resource vulnerabilityAssessments 'Microsoft.Sql/servers/vulnerabilityAssessments@2023-05-01-preview' = if (enableDefender) {
  parent: sqlServer
  name: 'Default'
  properties: {
    recurringScans: {
      isEnabled: true
      emailSubscriptionAdmins: true
      emails: []
    }
  }
  dependsOn: [
    securityAlertPolicies
  ]
}

// ============================================================================
// Outputs
// ============================================================================

output sqlServerId string = sqlServer.id
output sqlServerName string = sqlServer.name
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output databaseId string = sqlDatabase.id
output databaseName string = sqlDatabase.name
output connectionString string = 'Server=tcp:${sqlServer.properties.fullyQualifiedDomainName},1433;Initial Catalog=${databaseName};Persist Security Info=False;User ID=${sqlAdminUsername};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
