// ============================================================================
// Azure Monitor Dashboards Module
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

@description('Log Analytics Workspace ID')
param logAnalyticsWorkspaceId string

@description('Web App IDs')
param webAppIds array

@description('SQL Server ID')
param sqlServerId string

@description('Redis Cache ID')
param redisCacheId string

@description('Application Gateway ID (optional)')
param applicationGatewayId string = ''

@description('Front Door ID (optional)')
param frontDoorId string = ''

// ============================================================================
// Variables
// ============================================================================

var dashboardName = '${projectName}-${environment}-dashboard'

// Extract resource IDs components
var subscriptionId = subscription().subscriptionId
var resourceGroupName = resourceGroup().name

// ============================================================================
// Main Monitoring Dashboard
// ============================================================================

resource monitoringDashboard 'Microsoft.Portal/dashboards@2020-09-01-preview' = {
  name: dashboardName
  location: location
  tags: union(tags, {
    'hidden-title': '${projectName} ${environment} - Monitoring Dashboard'
  })
  properties: {
    lenses: [
      {
        order: 0
        parts: [
          // ============================================================================
          // Service Health Overview
          // ============================================================================
          {
            position: {
              x: 0
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 86400000 // 24 hours
                    createdTime: '2024-01-01T00:00:00.000Z'
                    isInitialTime: false
                  }
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AppMapGalPt'
              settings: {
                content: {
                  title: 'Application Map - Service Health'
                }
              }
            }
          }
          // ============================================================================
          // Request Rate
          // ============================================================================
          {
            position: {
              x: 6
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'resourceTypeMode'
                  value: 'components'
                }
                {
                  name: 'ComponentId'
                  value: {
                    SubscriptionId: subscriptionId
                    ResourceGroup: resourceGroupName
                    Name: split(appInsightsId, '/')[8]
                  }
                }
                {
                  name: 'DataModel'
                  value: {
                    version: '1.0.0'
                    timeContext: {
                      durationMs: 3600000 // 1 hour
                    }
                  }
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/MetricsChartPt'
              settings: {
                content: {
                  title: 'Request Rate (requests/sec)'
                  metrics: [
                    {
                      resourceMetadata: {
                        id: appInsightsId
                      }
                      name: 'requests/count'
                      aggregationType: 4 // Sum
                      namespace: 'microsoft.insights/components/kusto'
                      metricVisualization: {
                        displayName: 'Server requests'
                      }
                    }
                  ]
                }
              }
            }
          }
          // ============================================================================
          // Response Time Trends
          // ============================================================================
          {
            position: {
              x: 0
              y: 4
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'requests\n| summarize avg(duration), percentile(duration, 50), percentile(duration, 95), percentile(duration, 99) by bin(timestamp, 5m)\n| render timechart'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsLineChartPt'
              settings: {
                content: {
                  title: 'Response Time Trends (P50, P95, P99)'
                }
              }
            }
          }
          // ============================================================================
          // Error Rate by Service
          // ============================================================================
          {
            position: {
              x: 6
              y: 4
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'requests\n| where success == false\n| summarize ErrorCount = count() by cloud_RoleName, resultCode\n| order by ErrorCount desc\n| render columnchart'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsBarChartPt'
              settings: {
                content: {
                  title: 'Error Rate by Service'
                }
              }
            }
          }
          // ============================================================================
          // CPU Usage - Web Apps
          // ============================================================================
          {
            position: {
              x: 0
              y: 8
              colSpan: 4
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceIds'
                  value: webAppIds
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'App Service CPU %'
                  metrics: [
                    {
                      name: 'CpuPercentage'
                      aggregationType: 4 // Average
                      namespace: 'microsoft.web/sites'
                      metricVisualization: {
                        displayName: 'CPU Percentage'
                      }
                    }
                  ]
                }
              }
            }
          }
          // ============================================================================
          // Memory Usage - Web Apps
          // ============================================================================
          {
            position: {
              x: 4
              y: 8
              colSpan: 4
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceIds'
                  value: webAppIds
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'App Service Memory %'
                  metrics: [
                    {
                      name: 'MemoryPercentage'
                      aggregationType: 4 // Average
                      namespace: 'microsoft.web/sites'
                      metricVisualization: {
                        displayName: 'Memory Percentage'
                      }
                    }
                  ]
                }
              }
            }
          }
          // ============================================================================
          // HTTP Status Codes Distribution
          // ============================================================================
          {
            position: {
              x: 8
              y: 8
              colSpan: 4
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'requests\n| summarize count() by resultCode\n| order by count_ desc\n| render piechart'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsPieChartPt'
              settings: {
                content: {
                  title: 'HTTP Status Code Distribution'
                }
              }
            }
          }
          // ============================================================================
          // SQL Database DTU Usage
          // ============================================================================
          {
            position: {
              x: 0
              y: 12
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceId'
                  value: sqlServerId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'SQL Database DTU Usage'
                  metrics: [
                    {
                      name: 'dtu_consumption_percent'
                      aggregationType: 4 // Average
                      namespace: 'microsoft.sql/servers/databases'
                      metricVisualization: {
                        displayName: 'DTU Percentage'
                      }
                    }
                  ]
                }
              }
            }
          }
          // ============================================================================
          // Redis Cache Performance
          // ============================================================================
          {
            position: {
              x: 6
              y: 12
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceId'
                  value: redisCacheId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'Redis Cache - CPU & Memory'
                  metrics: [
                    {
                      name: 'percentProcessorTime'
                      aggregationType: 4 // Average
                      namespace: 'microsoft.cache/redis'
                      metricVisualization: {
                        displayName: 'CPU'
                      }
                    }
                    {
                      name: 'usedmemorypercentage'
                      aggregationType: 4 // Average
                      namespace: 'microsoft.cache/redis'
                      metricVisualization: {
                        displayName: 'Memory'
                      }
                    }
                  ]
                }
              }
            }
          }
          // ============================================================================
          // Active Alerts Summary
          // ============================================================================
          {
            position: {
              x: 0
              y: 16
              colSpan: 12
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceGroup'
                  value: resourceGroupName
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/AlertsManagementSummaryPart'
              settings: {
                content: {
                  title: 'Active Alerts'
                }
              }
            }
          }
          // ============================================================================
          // Top 10 Slowest Requests
          // ============================================================================
          {
            position: {
              x: 0
              y: 20
              colSpan: 12
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'requests\n| top 10 by duration desc\n| project timestamp, name, duration, resultCode, cloud_RoleName\n| order by duration desc'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsGridPt'
              settings: {
                content: {
                  title: 'Top 10 Slowest Requests (Last Hour)'
                }
              }
            }
          }
          // ============================================================================
          // Dependency Performance
          // ============================================================================
          {
            position: {
              x: 0
              y: 24
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'dependencies\n| summarize avg(duration), count() by type, target\n| order by avg_duration desc'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsGridPt'
              settings: {
                content: {
                  title: 'Dependency Performance'
                }
              }
            }
          }
          // ============================================================================
          // Exception Trends
          // ============================================================================
          {
            position: {
              x: 6
              y: 24
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ComponentId'
                  value: appInsightsId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
                {
                  name: 'Query'
                  value: 'exceptions\n| summarize count() by type, cloud_RoleName, bin(timestamp, 5m)\n| render timechart'
                }
              ]
              type: 'Extension/AppInsightsExtension/PartType/AnalyticsLineChartPt'
              settings: {
                content: {
                  title: 'Exception Trends by Service'
                }
              }
            }
          }
        ]
      }
    ]
    metadata: {
      model: {
        timeRange: {
          value: {
            relative: {
              duration: 24
              timeUnit: 1
            }
          }
          type: 'MsPortalFx.Composition.Configuration.ValueTypes.TimeRange'
        }
        filterLocale: {
          value: 'en-us'
        }
        filters: {
          value: {
            MsPortalFx_TimeRange: {
              model: {
                format: 'utc'
                granularity: 'auto'
                relative: '24h'
              }
              displayCache: {
                name: 'UTC Time'
                value: 'Past 24 hours'
              }
              filteredPartIds: []
            }
          }
        }
      }
    }
  }
}

// ============================================================================
// WAF Dashboard (if Application Gateway or Front Door exists)
// ============================================================================

resource wafDashboard 'Microsoft.Portal/dashboards@2020-09-01-preview' = if (!empty(applicationGatewayId) || !empty(frontDoorId)) {
  name: '${dashboardName}-waf'
  location: location
  tags: union(tags, {
    'hidden-title': '${projectName} ${environment} - WAF Dashboard'
  })
  properties: {
    lenses: [
      {
        order: 0
        parts: [
          // WAF Blocked Requests
          {
            position: {
              x: 0
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceId'
                  value: !empty(applicationGatewayId) ? applicationGatewayId : frontDoorId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'WAF Blocked Requests'
                }
              }
            }
          }
          // WAF Rule Triggers
          {
            position: {
              x: 6
              y: 0
              colSpan: 6
              rowSpan: 4
            }
            metadata: {
              inputs: [
                {
                  name: 'ResourceId'
                  value: !empty(applicationGatewayId) ? applicationGatewayId : frontDoorId
                }
                {
                  name: 'TimeContext'
                  value: {
                    durationMs: 3600000 // 1 hour
                  }
                }
              ]
              type: 'Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart'
              settings: {
                content: {
                  title: 'WAF Rule Triggers by Type'
                }
              }
            }
          }
        ]
      }
    ]
  }
}

// ============================================================================
// Outputs
// ============================================================================

output dashboardId string = monitoringDashboard.id
output dashboardName string = monitoringDashboard.name
output wafDashboardId string = !empty(applicationGatewayId) || !empty(frontDoorId) ? wafDashboard.id : ''
