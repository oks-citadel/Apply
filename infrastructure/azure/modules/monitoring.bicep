// ============================================================================
// Monitoring and Alerts Module
// ============================================================================

@description('Azure region')
param location string

@description('Project name')
param projectName string

@description('Environment name')
param environment string

@description('Resource tags')
param tags object

@description('Application Insights ID')
param appInsightsId string

@description('SQL Server ID')
param sqlServerId string

@description('Redis Cache ID')
param redisCacheId string

@description('Web App IDs')
param webAppIds array

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Web App URLs for availability tests')
param webAppUrls object

// ============================================================================
// Variables
// ============================================================================

var actionGroupName = '${projectName}-${environment}-alerts'
var availabilityTestLocations = [
  'us-va-ash-azr' // East US
  'us-il-ch1-azr' // Central US
  'us-ca-sjc-azr' // West US
  'emea-nl-ams-azr' // West Europe
  'apac-sg-sin-azr' // Southeast Asia
]

// ============================================================================
// Action Group for Notifications
// ============================================================================

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    groupShortName: substring('${projectName}-${environment}', 0, 12)
    enabled: true
    emailReceivers: [
      {
        name: 'DevOps Team'
        emailAddress: 'devops@jobpilot.ai'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: []
    webhookReceivers: []
    azureAppPushReceivers: []
    armRoleReceivers: [
      {
        name: 'Monitoring Contributor'
        roleId: '749f88d5-cbae-40b8-bcfc-e573ddc772fa'
        useCommonAlertSchema: true
      }
    ]
  }
}

// ============================================================================
// Metric Alerts - CPU Usage
// ============================================================================

resource cpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for (appId, i) in webAppIds: {
  name: '${projectName}-${environment}-cpu-alert-${i}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      appId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CPU Percentage'
          metricName: 'CpuPercentage'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// ============================================================================
// Metric Alerts - Memory Usage
// ============================================================================

resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for (appId, i) in webAppIds: {
  name: '${projectName}-${environment}-memory-alert-${i}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when memory usage exceeds 85%'
    severity: 2
    enabled: true
    scopes: [
      appId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Memory Percentage'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// ============================================================================
// Metric Alerts - HTTP Server Errors
// ============================================================================

resource http5xxAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for (appId, i) in webAppIds: {
  name: '${projectName}-${environment}-http5xx-alert-${i}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when HTTP 5xx errors exceed threshold'
    severity: 1
    enabled: true
    scopes: [
      appId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HTTP 5xx Errors'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// ============================================================================
// Metric Alerts - Response Time
// ============================================================================

resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for (appId, i) in webAppIds: {
  name: '${projectName}-${environment}-response-time-alert-${i}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when response time exceeds 3 seconds'
    severity: 2
    enabled: true
    scopes: [
      appId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Response Time'
          metricName: 'AverageResponseTime'
          operator: 'GreaterThan'
          threshold: 3
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// ============================================================================
// Metric Alerts - SQL DTU Usage
// ============================================================================

resource sqlDtuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-sql-dtu-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when SQL Database DTU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      sqlServerId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'DTU Percentage'
          metricName: 'dtu_consumption_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ============================================================================
// Metric Alerts - Redis Cache CPU
// ============================================================================

resource redisCpuAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-redis-cpu-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when Redis CPU usage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      redisCacheId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CPU Percentage'
          metricName: 'percentProcessorTime'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ============================================================================
// Activity Log Alert - Resource Health
// ============================================================================

resource resourceHealthAlert 'Microsoft.Insights/activityLogAlerts@2020-10-01' = {
  name: '${projectName}-${environment}-resource-health-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when resource health is degraded'
    enabled: true
    scopes: [
      subscription().id
    ]
    condition: {
      allOf: [
        {
          field: 'category'
          equals: 'ResourceHealth'
        }
        {
          field: 'properties.currentHealthStatus'
          equals: 'Degraded'
        }
      ]
    }
    actions: {
      actionGroups: [
        {
          actionGroupId: actionGroup.id
        }
      ]
    }
  }
}

// ============================================================================
// Metric Alerts - HTTP 4xx Client Errors
// ============================================================================

resource http4xxAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = [for (appId, i) in webAppIds: {
  name: '${projectName}-${environment}-http4xx-alert-${i}'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when HTTP 4xx errors exceed threshold'
    severity: 3
    enabled: true
    scopes: [
      appId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'HTTP 4xx Errors'
          metricName: 'Http4xx'
          operator: 'GreaterThan'
          threshold: 50
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}]

// ============================================================================
// Metric Alerts - Connections (Redis)
// ============================================================================

resource redisConnectionsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-redis-connections-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when Redis connected clients exceed threshold'
    severity: 2
    enabled: true
    scopes: [
      redisCacheId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Connected Clients'
          metricName: 'connectedclients'
          operator: 'GreaterThan'
          threshold: 250
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ============================================================================
// Metric Alerts - SQL Storage
// ============================================================================

resource sqlStorageAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-sql-storage-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when SQL Database storage exceeds 80%'
    severity: 2
    enabled: true
    scopes: [
      sqlServerId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'Storage Percentage'
          metricName: 'storage_percent'
          operator: 'GreaterThan'
          threshold: 80
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ============================================================================
// Availability Tests
// ============================================================================

resource webAppAvailabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${projectName}-${environment}-webapp-availability'
  location: location
  tags: union(tags, {
    'hidden-link:${appInsightsId}': 'Resource'
  })
  kind: 'standard'
  properties: {
    enabled: true
    frequency: 300 // 5 minutes
    timeout: 30
    kind: 'standard'
    retryEnabled: true
    locations: [for loc in availabilityTestLocations: {
      Id: loc
    }]
    configuration: {
      webTest: '<WebTest Name="${projectName}-webapp" Id="${guid(projectName, 'webapp')}" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale=""><Items><Request Method="GET" Guid="${guid(projectName, 'webapp', 'request')}" Version="1.1" Url="${webAppUrls.webAppUrl}" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" /></Items></WebTest>'
    }
    syntheticMonitorId: '${projectName}-${environment}-webapp-availability'
  }
}

resource authServiceAvailabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${projectName}-${environment}-auth-availability'
  location: location
  tags: union(tags, {
    'hidden-link:${appInsightsId}': 'Resource'
  })
  kind: 'standard'
  properties: {
    enabled: true
    frequency: 300 // 5 minutes
    timeout: 30
    kind: 'standard'
    retryEnabled: true
    locations: [for loc in availabilityTestLocations: {
      Id: loc
    }]
    configuration: {
      webTest: '<WebTest Name="${projectName}-auth" Id="${guid(projectName, 'auth')}" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale=""><Items><Request Method="GET" Guid="${guid(projectName, 'auth', 'request')}" Version="1.1" Url="${webAppUrls.authServiceUrl}/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" /></Items></WebTest>'
    }
    syntheticMonitorId: '${projectName}-${environment}-auth-availability'
  }
}

resource aiServiceAvailabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: '${projectName}-${environment}-ai-availability'
  location: location
  tags: union(tags, {
    'hidden-link:${appInsightsId}': 'Resource'
  })
  kind: 'standard'
  properties: {
    enabled: true
    frequency: 300 // 5 minutes
    timeout: 30
    kind: 'standard'
    retryEnabled: true
    locations: [for loc in availabilityTestLocations: {
      Id: loc
    }]
    configuration: {
      webTest: '<WebTest Name="${projectName}-ai" Id="${guid(projectName, 'ai')}" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="30" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale=""><Items><Request Method="GET" Guid="${guid(projectName, 'ai', 'request')}" Version="1.1" Url="${webAppUrls.aiServiceUrl}/health" ThinkTime="0" Timeout="30" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" /></Items></WebTest>'
    }
    syntheticMonitorId: '${projectName}-${environment}-ai-availability'
  }
}

// ============================================================================
// Availability Test Alerts
// ============================================================================

resource webAppAvailabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-webapp-availability-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when web app availability drops below 90%'
    severity: 1
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: webAppAvailabilityTest.id
      componentId: appInsightsId
      failedLocationCount: 2
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource authServiceAvailabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-auth-availability-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when auth service availability drops below 90%'
    severity: 1
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: authServiceAvailabilityTest.id
      componentId: appInsightsId
      failedLocationCount: 2
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

resource aiServiceAvailabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${projectName}-${environment}-ai-availability-alert'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when AI service availability drops below 90%'
    severity: 1
    enabled: true
    scopes: [
      appInsightsId
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: aiServiceAvailabilityTest.id
      componentId: appInsightsId
      failedLocationCount: 2
    }
    autoMitigate: true
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// ============================================================================
// Log Analytics Saved Queries for Dashboards
// ============================================================================

resource savedQueries 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/high-error-rate-query'
  properties: {
    category: 'Performance'
    displayName: 'High Error Rate Detection'
    query: '''
      requests
      | where timestamp > ago(1h)
      | summarize
          TotalRequests = count(),
          FailedRequests = countif(success == false),
          ErrorRate = 100.0 * countif(success == false) / count()
          by bin(timestamp, 5m), cloud_RoleName
      | where ErrorRate > 5
      | order by timestamp desc
    '''
    version: 2
  }
}

resource slowRequestsQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/slow-requests-query'
  properties: {
    category: 'Performance'
    displayName: 'Slow Requests (P95 > 3s)'
    query: '''
      requests
      | where timestamp > ago(1h)
      | summarize
          RequestCount = count(),
          AvgDuration = avg(duration),
          P95Duration = percentile(duration, 95),
          P99Duration = percentile(duration, 99)
          by bin(timestamp, 5m), name, cloud_RoleName
      | where P95Duration > 3000
      | order by P95Duration desc
    '''
    version: 2
  }
}

resource dependencyFailuresQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/dependency-failures-query'
  properties: {
    category: 'Reliability'
    displayName: 'Dependency Failures'
    query: '''
      dependencies
      | where timestamp > ago(1h)
      | where success == false
      | summarize
          FailureCount = count(),
          FailureRate = 100.0 * count() / toscalar(dependencies | where timestamp > ago(1h) | count())
          by bin(timestamp, 5m), type, target, resultCode
      | order by FailureCount desc
    '''
    version: 2
  }
}

resource businessMetricsQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/business-metrics-query'
  properties: {
    category: 'Business KPIs'
    displayName: 'Business Metrics Dashboard'
    query: '''
      customEvents
      | where timestamp > ago(24h)
      | where name in ("UserSignup", "JobApplication", "ResumeGenerated", "CoverLetterGenerated")
      | summarize Count = count() by bin(timestamp, 1h), name
      | render timechart
    '''
    version: 2
  }
}

resource userJourneyQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/user-journey-query'
  properties: {
    category: 'User Analytics'
    displayName: 'User Journey Analysis'
    query: '''
      pageViews
      | where timestamp > ago(24h)
      | summarize
          Sessions = dcount(session_Id),
          PageViews = count(),
          UniqueUsers = dcount(user_Id)
          by bin(timestamp, 1h), name
      | order by timestamp desc
    '''
    version: 2
  }
}

resource errorAnalysisQuery 'Microsoft.OperationalInsights/workspaces/savedSearches@2020-08-01' = {
  name: '${split(logAnalyticsWorkspaceId, '/')[8]}/error-analysis-query'
  properties: {
    category: 'Troubleshooting'
    displayName: 'Error Analysis with Stack Traces'
    query: '''
      exceptions
      | where timestamp > ago(24h)
      | summarize
          Count = count(),
          SampleMessage = any(outerMessage),
          SampleStackTrace = any(details[0].parsedStack)
          by type, problemId
      | order by Count desc
      | take 20
    '''
    version: 2
  }
}

// ============================================================================
// Smart Detection Anomaly Alerts
// ============================================================================

resource smartDetectionFailureAnomalies 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: '${projectName}-${environment}-smart-detection'
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'SmartDetect'
    enabled: true
    emailReceivers: [
      {
        name: 'Smart Detection Email'
        emailAddress: 'devops@jobpilot.ai'
        useCommonAlertSchema: true
      }
    ]
  }
}

// ============================================================================
// Scheduled Query Alerts for Custom Metrics
// ============================================================================

resource highErrorRateAlert 'Microsoft.Insights/scheduledQueryRules@2022-08-01-preview' = {
  name: '${projectName}-${environment}-high-error-rate'
  location: location
  tags: tags
  properties: {
    displayName: 'High Error Rate Alert'
    description: 'Alert when error rate exceeds 5% over 5 minutes'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [
      appInsightsId
    ]
    targetResourceTypes: [
      'microsoft.insights/components'
    ]
    windowSize: 'PT5M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where timestamp > ago(5m)
            | summarize
                TotalRequests = count(),
                FailedRequests = countif(success == false)
            | extend ErrorRate = 100.0 * FailedRequests / TotalRequests
            | where ErrorRate > 5
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    autoMitigate: true
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

resource unusualTrafficAlert 'Microsoft.Insights/scheduledQueryRules@2022-08-01-preview' = {
  name: '${projectName}-${environment}-unusual-traffic'
  location: location
  tags: tags
  properties: {
    displayName: 'Unusual Traffic Pattern Alert'
    description: 'Alert when request volume deviates significantly from baseline'
    severity: 3
    enabled: true
    evaluationFrequency: 'PT15M'
    scopes: [
      appInsightsId
    ]
    targetResourceTypes: [
      'microsoft.insights/components'
    ]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            let baseline = requests
                | where timestamp between(ago(7d) .. ago(1d))
                | summarize AvgRequests = avg(itemCount) by bin(timestamp, 15m)
                | summarize BaselineAvg = avg(AvgRequests);
            requests
            | where timestamp > ago(15m)
            | summarize CurrentRequests = count()
            | extend Baseline = toscalar(baseline)
            | extend DeviationPercent = abs(CurrentRequests - Baseline) * 100.0 / Baseline
            | where DeviationPercent > 200
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    autoMitigate: true
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// ============================================================================
// Outputs
// ============================================================================

output actionGroupId string = actionGroup.id
output actionGroupName string = actionGroup.name
output availabilityTestIds array = [
  webAppAvailabilityTest.id
  authServiceAvailabilityTest.id
  aiServiceAvailabilityTest.id
]
