# Dashboards Module

This Terraform module creates comprehensive Azure Portal dashboards for the JobPilot AI Platform, providing real-time visibility into application performance, infrastructure health, and user activity.

## Features

### Application Performance Tiles
- **Average Response Time**: Line chart showing response time trends over 24 hours
- **Request Throughput**: Requests per hour visualization
- **Response Time Percentiles**: P95 and P99 response times for the last hour

### Error and Exception Tiles
- **Error Rate**: Time series of exceptions and errors
- **Top Exceptions**: Most frequent exception types and messages

### Database Metrics Tiles (when SQL Server configured)
- **Database DTU Usage**: DTU consumption percentage over time
- **Database Connections**: Active connection count
- **Database Deadlocks**: Deadlock occurrence tracking

### Redis Cache Tiles (when Redis configured)
- **Cache Hit Rate**: Cache hits vs misses
- **Memory Usage**: Used memory percentage
- **Server Load**: Redis server load percentage

### Infrastructure Health Tiles
- **App Service CPU Usage**: CPU consumption for web apps
- **App Service Memory Usage**: Memory consumption for web apps

### User Activity Tiles
- **Active Users**: Unique users per hour
- **Active Sessions**: Concurrent session count
- **Total Events**: Page views and custom events in the last hour

### Request Volume Tiles
- **Request Volume by Endpoint**: Top 10 endpoints by request count
- **Success Rate**: Percentage of successful requests (2xx responses)

### Dependency Performance Tiles
- **Dependency Performance**: Average duration for external dependencies
- **Failed Dependencies**: Failed dependency calls with error codes

## Usage

```hcl
module "dashboard" {
  source = "./modules/dashboards"

  # Required variables
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment

  # Resource IDs for dashboard tiles
  app_insights_id            = azurerm_application_insights.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Web apps to display
  web_app_ids = {
    frontend = azurerm_linux_web_app.frontend.id
    backend  = azurerm_linux_web_app.backend.id
    auth     = azurerm_linux_web_app.auth.id
  }

  # Optional: Database and cache resources
  sql_server_id  = azurerm_mssql_database.main.id
  redis_cache_id = azurerm_redis_cache.main.id

  # Optional: Networking resources
  application_gateway_id = azurerm_application_gateway.main.id
  front_door_id          = azurerm_cdn_frontdoor_profile.main.id

  # Optional: Container resources
  aks_cluster_id = azurerm_kubernetes_cluster.main.id

  # Dashboard configuration
  dashboard_time_range    = 24  # Default time range in hours
  enable_database_tiles   = true
  enable_cache_tiles      = true
  enable_networking_tiles = false
  enable_container_tiles  = false

  tags = var.common_tags
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Resource group name | string | - | yes |
| location | Azure region | string | - | yes |
| project_name | Project name | string | - | yes |
| environment | Environment (dev/staging/prod) | string | - | yes |
| app_insights_id | Application Insights resource ID | string | - | yes |
| log_analytics_workspace_id | Log Analytics workspace ID | string | null | no |
| web_app_ids | Map of web app names to resource IDs | map(string) | {} | no |
| sql_server_id | SQL Server resource ID | string | null | no |
| redis_cache_id | Redis Cache resource ID | string | null | no |
| application_gateway_id | Application Gateway resource ID | string | null | no |
| front_door_id | Azure Front Door resource ID | string | null | no |
| aks_cluster_id | AKS cluster resource ID | string | null | no |
| storage_account_id | Storage Account resource ID | string | null | no |
| key_vault_id | Key Vault resource ID | string | null | no |
| dashboard_time_range | Default time range in hours | number | 24 | no |
| enable_database_tiles | Enable database tiles | bool | true | no |
| enable_cache_tiles | Enable cache tiles | bool | true | no |
| enable_networking_tiles | Enable networking tiles | bool | false | no |
| enable_container_tiles | Enable container tiles | bool | false | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| dashboard_id | Dashboard resource ID |
| dashboard_name | Dashboard name |
| dashboard_url | Direct URL to access dashboard in Azure Portal |
| dashboard_summary | Configuration summary |
| resource_group_name | Resource group name |
| location | Azure region |
| tags | Applied tags |

## Dashboard Layout

The dashboard is organized into logical sections:

### Row 1: Application Performance (Y: 0-4)
- Response Time Chart (X: 0-6)
- Request Throughput (X: 6-12)
- Response Time Percentiles (X: 12-16)

### Row 2: Errors and Exceptions (Y: 4-8)
- Error Rate Chart (X: 0-8)
- Top Exceptions Grid (X: 8-16)

### Row 3: Database Metrics (Y: 8-12, if enabled)
- DTU Usage (X: 0-5)
- Connections (X: 5-10)
- Deadlocks (X: 10-16)

### Row 4: Redis Cache Metrics (Y: 12-16, if enabled)
- Cache Hits (X: 0-5)
- Memory Usage (X: 5-10)
- Server Load (X: 10-16)

### Row 5: Infrastructure Health (Y: 16-20)
- CPU Usage (X: 0-8)
- Memory Usage (X: 8-16)

### Row 6: User Activity (Y: 20-24)
- Active Users (X: 0-6)
- Active Sessions (X: 6-12)
- Total Events (X: 12-16)

### Row 7: Request Volume (Y: 24-28)
- Request Volume by Endpoint (X: 0-12)
- Success Rate (X: 12-16)

### Row 8: Dependencies (Y: 28-32)
- Dependency Performance (X: 0-8)
- Failed Dependencies (X: 8-16)

## Customization

### Modifying Time Ranges

To change the default time range for all dashboard tiles:

```hcl
module "dashboard" {
  source = "./modules/dashboards"
  # ... other variables
  dashboard_time_range = 48  # 48 hours instead of 24
}
```

### Adding Custom Tiles

To add custom tiles, modify the `main.tf` file and add new tile definitions to the appropriate section (e.g., `local.application_performance_tiles`).

Example custom tile:

```hcl
"20" = {
  position = {
    x       = 0
    y       = 32
    colSpan = 8
    rowSpan = 4
  }
  metadata = {
    inputs = [
      {
        name      = "ComponentId"
        value     = var.app_insights_id
        isOptional = true
      },
      {
        name      = "Query"
        value     = <<-QUERY
          customMetrics
          | where timestamp > ago(24h)
          | where name == "JobApplicationsSubmitted"
          | summarize Total = sum(value) by bin(timestamp, 1h)
          | render timechart
        QUERY
        isOptional = true
      }
    ]
    type = "Extension/AppInsightsExtension/PartType/AnalyticsLineChartPart"
    settings = {
      content = {
        PartTitle    = "Job Applications Submitted"
        PartSubTitle = "Applications per hour"
      }
    }
  }
}
```

## KQL Query Examples

The dashboard uses Kusto Query Language (KQL) for Log Analytics queries. Here are some useful examples:

### Custom User Metrics
```kql
customEvents
| where timestamp > ago(24h)
| where name == "JobApplicationCompleted"
| summarize count() by bin(timestamp, 1h), tostring(customDimensions.Industry)
| render timechart
```

### Performance by Geographic Region
```kql
requests
| where timestamp > ago(24h)
| extend region = tostring(client_City)
| summarize AvgDuration = avg(duration), Count = count() by region
| order by Count desc
```

### Failed Authentication Analysis
```kql
traces
| where timestamp > ago(24h)
| where message contains "authentication failed"
| extend ClientIP = tostring(customDimensions.ClientIP)
| summarize FailedAttempts = count() by ClientIP
| where FailedAttempts > 5
| order by FailedAttempts desc
```

## Best Practices

1. **Dashboard Organization**: Group related metrics together for easier analysis
2. **Time Ranges**: Use appropriate time ranges for different metrics (shorter for real-time, longer for trends)
3. **Tile Sizing**: Larger tiles for critical metrics, smaller for supporting data
4. **Color Coding**: Use consistent colors across related tiles
5. **Refresh Rate**: Dashboard auto-refreshes every 5 minutes
6. **Sharing**: Share dashboard with team members via Azure Portal
7. **Environment Separation**: Create separate dashboards for dev, staging, and production

## Accessing the Dashboard

After deployment, access the dashboard through:

1. **Azure Portal**: Navigate to Dashboards section
2. **Direct URL**: Use the `dashboard_url` output value
3. **Terraform Output**: Run `terraform output dashboard_url`

Example:
```bash
terraform output -raw dashboard_url
# Output: https://portal.azure.com/#@/dashboard/arm/subscriptions/.../resourceGroups/.../providers/Microsoft.Portal/dashboards/jobpilot-prod-dashboard
```

## Troubleshooting

### Tiles Not Displaying Data

1. **Check Resource IDs**: Ensure all resource IDs are correct
2. **Verify Permissions**: User must have read access to all resources
3. **Application Insights**: Confirm telemetry is being sent
4. **Time Range**: Adjust time range if no recent data

### Query Errors

1. **Validate KQL**: Test queries in Log Analytics query editor
2. **Check Schema**: Ensure table and column names match your schema
3. **Time Filters**: Verify timestamp filters are correct

### Dashboard Not Visible

1. **Resource Group**: Ensure dashboard is in the correct resource group
2. **Permissions**: User needs Reader role on the dashboard resource
3. **Sharing**: Dashboard may need to be explicitly shared

## Maintenance

- Review dashboard layout quarterly
- Update queries as application schema changes
- Add tiles for new services as they're deployed
- Remove tiles for deprecated features
- Optimize slow-running queries
