// ============================================================================
// Azure Service Bus Module
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

@description('Service Bus SKU')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string

// ============================================================================
// Variables
// ============================================================================

var namespaceName = '${projectName}-${environment}-sb-${uniqueSuffix}'

// Queues configuration
var queues = [
  {
    name: 'job-applications'
    maxDeliveryCount: 10
    lockDuration: 'PT5M'
    requiresDuplicateDetection: true
  }
  {
    name: 'resume-parsing'
    maxDeliveryCount: 5
    lockDuration: 'PT10M'
    requiresDuplicateDetection: false
  }
  {
    name: 'cover-letter-generation'
    maxDeliveryCount: 5
    lockDuration: 'PT10M'
    requiresDuplicateDetection: false
  }
  {
    name: 'notifications'
    maxDeliveryCount: 3
    lockDuration: 'PT1M'
    requiresDuplicateDetection: false
  }
  {
    name: 'dead-letter'
    maxDeliveryCount: 1
    lockDuration: 'PT5M'
    requiresDuplicateDetection: false
  }
]

// Topics configuration
var topics = [
  {
    name: 'application-events'
    requiresDuplicateDetection: true
    subscriptions: [
      'analytics'
      'notifications'
      'audit'
    ]
  }
  {
    name: 'user-events'
    requiresDuplicateDetection: false
    subscriptions: [
      'profile-updates'
      'activity-tracking'
    ]
  }
]

// ============================================================================
// Service Bus Namespace
// ============================================================================

resource serviceBusNamespace 'Microsoft.ServiceBus/namespaces@2023-01-01-preview' = {
  name: namespaceName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
    capacity: sku == 'Premium' ? 1 : null
  }
  properties: {
    minimumTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
    disableLocalAuth: false
    zoneRedundant: sku == 'Premium' && environment == 'prod' ? true : false
    premiumMessagingPartitions: sku == 'Premium' ? 1 : null
  }
}

// ============================================================================
// Queues
// ============================================================================

resource serviceBusQueues 'Microsoft.ServiceBus/namespaces/queues@2023-01-01-preview' = [for queue in queues: {
  parent: serviceBusNamespace
  name: queue.name
  properties: {
    lockDuration: queue.lockDuration
    maxSizeInMegabytes: sku == 'Premium' ? 81920 : 1024
    requiresDuplicateDetection: queue.requiresDuplicateDetection
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    maxDeliveryCount: queue.maxDeliveryCount
    enableBatchedOperations: true
    enablePartitioning: sku != 'Premium'
    enableExpress: false
  }
}]

// ============================================================================
// Topics and Subscriptions
// ============================================================================

resource serviceBusTopics 'Microsoft.ServiceBus/namespaces/topics@2023-01-01-preview' = [for topic in topics: {
  parent: serviceBusNamespace
  name: topic.name
  properties: {
    defaultMessageTimeToLive: 'P14D'
    maxSizeInMegabytes: sku == 'Premium' ? 81920 : 1024
    requiresDuplicateDetection: topic.requiresDuplicateDetection
    duplicateDetectionHistoryTimeWindow: 'PT10M'
    enableBatchedOperations: true
    enablePartitioning: sku != 'Premium'
    enableExpress: false
    supportOrdering: true
  }
}]

resource serviceBusSubscriptions 'Microsoft.ServiceBus/namespaces/topics/subscriptions@2023-01-01-preview' = [for (topic, i) in topics: {
  parent: serviceBusTopics[i]
  name: topic.subscriptions[0]
  properties: {
    lockDuration: 'PT5M'
    requiresSession: false
    defaultMessageTimeToLive: 'P14D'
    deadLetteringOnMessageExpiration: true
    maxDeliveryCount: 10
    enableBatchedOperations: true
  }
}]

// ============================================================================
// Authorization Rules
// ============================================================================

resource sendListenRule 'Microsoft.ServiceBus/namespaces/authorizationRules@2023-01-01-preview' = {
  parent: serviceBusNamespace
  name: 'SendListenPolicy'
  properties: {
    rights: [
      'Send'
      'Listen'
    ]
  }
}

resource manageRule 'Microsoft.ServiceBus/namespaces/authorizationRules@2023-01-01-preview' = {
  parent: serviceBusNamespace
  name: 'ManagePolicy'
  properties: {
    rights: [
      'Manage'
      'Send'
      'Listen'
    ]
  }
}

// ============================================================================
// Diagnostic Settings
// ============================================================================

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: '${namespaceName}-diagnostics'
  scope: serviceBusNamespace
  properties: {
    logs: [
      {
        category: 'OperationalLogs'
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
// Outputs
// ============================================================================

output serviceBusId string = serviceBusNamespace.id
output namespaceName string = serviceBusNamespace.name
output serviceBusEndpoint string = serviceBusNamespace.properties.serviceBusEndpoint
output connectionString string = listKeys(sendListenRule.id, sendListenRule.apiVersion).primaryConnectionString
output manageConnectionString string = listKeys(manageRule.id, manageRule.apiVersion).primaryConnectionString
