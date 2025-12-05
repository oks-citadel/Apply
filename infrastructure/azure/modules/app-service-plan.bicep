// ============================================================================
// App Service Plan Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('App Service Plan SKU')
param planSku object

@description('Resource tags')
param tags object

@description('Enable auto-scaling')
param enableAutoScaling bool

@description('Minimum replicas for auto-scaling')
param minReplicas int

@description('Maximum replicas for auto-scaling')
param maxReplicas int

// ============================================================================
// Variables
// ============================================================================

var appServicePlanName = '${projectName}-${environment}-asp'

// ============================================================================
// App Service Plan
// ============================================================================

resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: planSku.name
    tier: planSku.tier
    capacity: planSku.capacity
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
    zoneRedundant: environment == 'prod' ? true : false
    perSiteScaling: false
    elasticScaleEnabled: false
    maximumElasticWorkerCount: maxReplicas
    isSpot: false
    targetWorkerCount: planSku.capacity
    targetWorkerSizeId: 0
  }
}

// ============================================================================
// Auto-scaling Settings
// ============================================================================

resource autoScaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = if (enableAutoScaling) {
  name: '${appServicePlanName}-autoscale'
  location: location
  tags: tags
  properties: {
    enabled: true
    targetResourceUri: appServicePlan.id
    profiles: [
      {
        name: 'Default autoscale condition'
        capacity: {
          minimum: string(minReplicas)
          maximum: string(maxReplicas)
          default: string(planSku.capacity)
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 70
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'LessThan'
              threshold: 30
            }
            scaleAction: {
              direction: 'Decrease'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'MemoryPercentage'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 80
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '1'
              cooldown: 'PT5M'
            }
          }
          {
            metricTrigger: {
              metricName: 'HttpQueueLength'
              metricResourceUri: appServicePlan.id
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
              timeAggregation: 'Average'
              operator: 'GreaterThan'
              threshold: 100
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '2'
              cooldown: 'PT5M'
            }
          }
        ]
      }
      {
        name: 'Weekend scale down'
        capacity: {
          minimum: string(minReplicas)
          maximum: string(maxReplicas)
          default: string(minReplicas)
        }
        rules: []
        recurrence: {
          frequency: 'Week'
          schedule: {
            timeZone: 'Eastern Standard Time'
            days: [
              'Saturday'
              'Sunday'
            ]
            hours: [
              0
            ]
            minutes: [
              0
            ]
          }
        }
      }
    ]
    notifications: [
      {
        operation: 'Scale'
        email: {
          sendToSubscriptionAdministrator: true
          sendToSubscriptionCoAdministrators: true
          customEmails: []
        }
        webhooks: []
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output appServicePlanId string = appServicePlan.id
output appServicePlanName string = appServicePlan.name
