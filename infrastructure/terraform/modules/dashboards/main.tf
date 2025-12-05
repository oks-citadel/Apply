# Dashboards Module - Main Configuration
# JobPilot AI Platform - Azure Portal Dashboard Configuration

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Local variables for resource naming and configuration
locals {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"
  common_tags = merge(
    var.tags,
    {
      Module      = "dashboards"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )

  # Extract resource IDs for dashboard tiles
  web_app_ids_list = values(var.web_app_ids)

  # Dashboard properties JSON structure
  dashboard_properties = {
    lenses = {
      "0" = {
        order = 0
        parts = merge(
          # Application Performance Tiles
          local.application_performance_tiles,
          # Error and Exception Tiles
          local.error_exception_tiles,
          # Database Metrics Tiles
          var.sql_server_id != null ? local.database_tiles : {},
          # Redis Cache Tiles
          var.redis_cache_id != null ? local.redis_tiles : {},
          # Infrastructure Health Tiles
          local.infrastructure_tiles,
          # User Activity Tiles
          local.user_activity_tiles,
          # Request Volume Tiles
          local.request_volume_tiles,
          # Dependency Performance Tiles
          local.dependency_tiles
        )
      }
    }
    metadata = {
      model = {
        timeRange = {
          value = {
            relative = {
              duration = 24
              timeUnit = 1
            }
          }
          type = "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange"
        }
        filterLocale = {
          value = "en-us"
        }
        filters = {
          value = {
            MsPortalFx_TimeRange = {
              model = {
                format      = "local"
                granularity = "auto"
                relative    = "24h"
              }
              displayCache = {
                name  = "Local Time"
                value = "Past 24 hours"
              }
            }
          }
        }
      }
    }
  }

  # =========================================================================
  # APPLICATION PERFORMANCE TILES
  # =========================================================================
  application_performance_tiles = {
    "0" = {
      position = {
        x       = 0
        y       = 0
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "TimeContext"
            isOptional = true
          },
          {
            name       = "ResourceIds"
            value      = [var.app_insights_id]
            isOptional = true
          },
          {
            name       = "ConfigurationId"
            value      = "Community-Workbooks/Performance/Performance Counter Analysis"
            isOptional = true
          },
          {
            name       = "Type"
            value      = "server-response-time"
            isOptional = true
          },
          {
            name = "Dimensions"
            value = {
              xAxis = {
                name = "timestamp"
                type = "datetime"
              }
              yAxis = [
                {
                  name = "avg(duration)"
                  type = "real"
                }
              ]
              splitBy     = []
              aggregation = "avg"
            }
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
        settings = {
          content = {
            PartTitle    = "Average Response Time"
            PartSubTitle = var.project_name
          }
        }
      }
    }

    "1" = {
      position = {
        x       = 6
        y       = 0
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              requests
              | where timestamp > ago(24h)
              | summarize RequestCount = count() by bin(timestamp, 1h)
              | render timechart
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
        settings = {
          content = {
            PartTitle    = "Request Throughput"
            PartSubTitle = "Requests per hour"
          }
        }
      }
    }

    "2" = {
      position = {
        x       = 12
        y       = 0
        colSpan = 4
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              requests
              | where timestamp > ago(1h)
              | summarize P95 = percentile(duration, 95), P99 = percentile(duration, 99)
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsNumberPart"
        settings = {
          content = {
            PartTitle    = "Response Time Percentiles"
            PartSubTitle = "P95 and P99 (last hour)"
          }
        }
      }
    }
  }

  # =========================================================================
  # ERROR AND EXCEPTION TILES
  # =========================================================================
  error_exception_tiles = {
    "3" = {
      position = {
        x       = 0
        y       = 4
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              union exceptions, traces
              | where timestamp > ago(24h)
              | where severityLevel >= 3
              | summarize ErrorCount = count() by bin(timestamp, 1h), type = itemType
              | render timechart
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
        settings = {
          content = {
            PartTitle    = "Error Rate"
            PartSubTitle = "Exceptions and errors over time"
          }
        }
      }
    }

    "4" = {
      position = {
        x       = 8
        y       = 4
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              exceptions
              | where timestamp > ago(24h)
              | summarize Count = count() by type, outerMessage
              | order by Count desc
              | take 10
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
        settings = {
          content = {
            PartTitle    = "Top Exceptions"
            PartSubTitle = "Most frequent exceptions (last 24h)"
          }
        }
      }
    }
  }

  # =========================================================================
  # DATABASE METRICS TILES
  # =========================================================================
  database_tiles = {
    "5" = {
      position = {
        x       = 0
        y       = 8
        colSpan = 5
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.sql_server_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Sql/servers/databases"
          },
          {
            name  = "MetricName"
            value = "dtu_consumption_percent"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Database DTU Usage"
            PartSubTitle = "DTU consumption percentage"
          }
        }
      }
    }

    "6" = {
      position = {
        x       = 5
        y       = 8
        colSpan = 5
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.sql_server_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Sql/servers/databases"
          },
          {
            name  = "MetricName"
            value = "connection_successful"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Database Connections"
            PartSubTitle = "Active connections"
          }
        }
      }
    }

    "7" = {
      position = {
        x       = 10
        y       = 8
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.sql_server_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Sql/servers/databases"
          },
          {
            name  = "MetricName"
            value = "deadlock"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Database Deadlocks"
            PartSubTitle = "Deadlock occurrences"
          }
        }
      }
    }
  }

  # =========================================================================
  # REDIS CACHE TILES
  # =========================================================================
  redis_tiles = {
    "8" = {
      position = {
        x       = 0
        y       = 12
        colSpan = 5
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.redis_cache_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Cache/redis"
          },
          {
            name  = "MetricName"
            value = "cachehits"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Redis Cache Hits"
            PartSubTitle = "Cache hit rate"
          }
        }
      }
    }

    "9" = {
      position = {
        x       = 5
        y       = 12
        colSpan = 5
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.redis_cache_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Cache/redis"
          },
          {
            name  = "MetricName"
            value = "usedmemorypercentage"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Redis Memory Usage"
            PartSubTitle = "Used memory percentage"
          }
        }
      }
    }

    "10" = {
      position = {
        x       = 10
        y       = 12
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name  = "ResourceId"
            value = var.redis_cache_id
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Cache/redis"
          },
          {
            name  = "MetricName"
            value = "serverLoad"
          }
        ]
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "Redis Server Load"
            PartSubTitle = "Server load percentage"
          }
        }
      }
    }
  }

  # =========================================================================
  # INFRASTRUCTURE HEALTH TILES
  # =========================================================================
  infrastructure_tiles = {
    "11" = {
      position = {
        x       = 0
        y       = 16
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = length(local.web_app_ids_list) > 0 ? [
          {
            name  = "ResourceId"
            value = local.web_app_ids_list[0]
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Web/sites"
          },
          {
            name  = "MetricName"
            value = "CpuPercentage"
          }
        ] : []
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "App Service CPU Usage"
            PartSubTitle = "CPU percentage"
          }
        }
      }
    }

    "12" = {
      position = {
        x       = 8
        y       = 16
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = length(local.web_app_ids_list) > 0 ? [
          {
            name  = "ResourceId"
            value = local.web_app_ids_list[0]
          },
          {
            name  = "MetricNamespace"
            value = "Microsoft.Web/sites"
          },
          {
            name  = "MetricName"
            value = "MemoryPercentage"
          }
        ] : []
        type = "Extension/Microsoft_Azure_Monitoring/PartType/MetricsChartPart"
        settings = {
          content = {
            PartTitle    = "App Service Memory Usage"
            PartSubTitle = "Memory percentage"
          }
        }
      }
    }
  }

  # =========================================================================
  # USER ACTIVITY TILES
  # =========================================================================
  user_activity_tiles = {
    "13" = {
      position = {
        x       = 0
        y       = 20
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              pageViews
              | union customEvents
              | where timestamp > ago(24h)
              | summarize Users = dcount(user_Id) by bin(timestamp, 1h)
              | render timechart
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
        settings = {
          content = {
            PartTitle    = "Active Users"
            PartSubTitle = "Unique users per hour"
          }
        }
      }
    }

    "14" = {
      position = {
        x       = 6
        y       = 20
        colSpan = 6
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              customEvents
              | where timestamp > ago(24h)
              | where name == "UserSession"
              | summarize Sessions = dcount(session_Id) by bin(timestamp, 1h)
              | render timechart
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
        settings = {
          content = {
            PartTitle    = "Active Sessions"
            PartSubTitle = "Concurrent sessions"
          }
        }
      }
    }

    "15" = {
      position = {
        x       = 12
        y       = 20
        colSpan = 4
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              pageViews
              | union customEvents
              | where timestamp > ago(1h)
              | summarize Count = count()
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsNumberPart"
        settings = {
          content = {
            PartTitle    = "Total Events (1h)"
            PartSubTitle = "Page views and custom events"
          }
        }
      }
    }
  }

  # =========================================================================
  # REQUEST VOLUME TILES
  # =========================================================================
  request_volume_tiles = {
    "16" = {
      position = {
        x       = 0
        y       = 24
        colSpan = 12
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              requests
              | where timestamp > ago(24h)
              | summarize RequestCount = count() by bin(timestamp, 1h), url = tostring(url)
              | order by RequestCount desc
              | take 10
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
        settings = {
          content = {
            PartTitle    = "Request Volume by Endpoint"
            PartSubTitle = "Top 10 endpoints by request count"
          }
        }
      }
    }

    "17" = {
      position = {
        x       = 12
        y       = 24
        colSpan = 4
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              requests
              | where timestamp > ago(24h)
              | where resultCode startswith "2"
              | summarize SuccessRate = (count() * 100.0) / toscalar(requests | where timestamp > ago(24h) | count())
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsNumberPart"
        settings = {
          content = {
            PartTitle    = "Success Rate"
            PartSubTitle = "Percentage of successful requests"
          }
        }
      }
    }
  }

  # =========================================================================
  # DEPENDENCY PERFORMANCE TILES
  # =========================================================================
  dependency_tiles = {
    "18" = {
      position = {
        x       = 0
        y       = 28
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              dependencies
              | where timestamp > ago(24h)
              | summarize AvgDuration = avg(duration), Count = count() by name, type
              | order by AvgDuration desc
              | take 10
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
        settings = {
          content = {
            PartTitle    = "Dependency Performance"
            PartSubTitle = "Average duration by dependency"
          }
        }
      }
    }

    "19" = {
      position = {
        x       = 8
        y       = 28
        colSpan = 8
        rowSpan = 4
      }
      metadata = {
        inputs = [
          {
            name       = "ComponentId"
            value      = var.app_insights_id
            isOptional = true
          },
          {
            name       = "Query"
            value      = <<-QUERY
              dependencies
              | where timestamp > ago(24h)
              | where success == false
              | summarize FailedCalls = count() by name, resultCode
              | order by FailedCalls desc
            QUERY
            isOptional = true
          }
        ]
        type = "Extension/AppInsightsExtension/PartType/AnalyticsGridPart"
        settings = {
          content = {
            PartTitle    = "Failed Dependencies"
            PartSubTitle = "Failed dependency calls"
          }
        }
      }
    }
  }
}

# ============================================================================
# AZURE PORTAL DASHBOARD
# ============================================================================

resource "azurerm_portal_dashboard" "main" {
  name                = local.dashboard_name
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = local.common_tags

  dashboard_properties = jsonencode(local.dashboard_properties)
}
