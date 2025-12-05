# Monitoring Module

This Terraform module creates comprehensive monitoring and alerting infrastructure for the JobPilot AI Platform using Azure Monitor.

## Features

### Action Groups
- Centralized notification hub for all alerts
- Email notifications to multiple recipients
- Optional webhook integration (Slack, Teams, PagerDuty, etc.)
- Common alert schema for consistent notification format

### Metric Alerts

#### App Service Monitoring
- **High CPU Usage**: Alerts when CPU percentage exceeds threshold (default: 80%)
- **High Memory Usage**: Alerts when memory percentage exceeds threshold (default: 80%)
- **HTTP 5xx Errors**: Alerts on server errors (default: >10 errors)
- **Slow Response Time**: Alerts when response time exceeds threshold (default: >5 seconds)
- **Failed Requests**: Alerts on high HTTP 4xx error rate (default: >50 per 5 minutes)

#### Database Monitoring
- **High DTU Usage**: Alerts when database DTU consumption exceeds threshold (default: 80%)

#### Redis Cache Monitoring
- **High Memory Usage**: Alerts when cache memory usage exceeds threshold (default: 80%)
- **High Server Load**: Alerts when server load exceeds threshold (default: 80%)

#### AKS Monitoring (Optional)
- **High Node CPU**: Alerts when AKS node CPU usage is high
- **High Node Memory**: Alerts when AKS node memory usage is high

### Availability Tests
- Standard web tests for application availability
- Multi-region testing (US East, US West, EU West, APAC Southeast)
- SSL certificate validation
- Configurable test frequency (default: 5 minutes)

### Log Analytics Query Alerts
- **Error Rate Spike**: Detects sudden increases in error rates
- **Failed Authentication**: Detects brute force or credential stuffing attacks

## Usage

```hcl
module "monitoring" {
  source = "./modules/monitoring"

  # Required variables
  resource_group_name = azurerm_resource_group.main.name
  location            = var.location
  project_name        = var.project_name
  environment         = var.environment

  # Resource IDs
  app_insights_id            = azurerm_application_insights.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  sql_server_id              = azurerm_mssql_database.main.id
  redis_cache_id             = azurerm_redis_cache.main.id

  # Web apps to monitor
  web_app_ids = {
    frontend = azurerm_linux_web_app.frontend.id
    backend  = azurerm_linux_web_app.backend.id
    auth     = azurerm_linux_web_app.auth.id
  }

  web_app_urls = {
    frontend = "https://app.jobpilot.ai"
    backend  = "https://api.jobpilot.ai/health"
    auth     = "https://auth.jobpilot.ai/health"
  }

  # Alert notifications
  alert_email_addresses = [
    "ops@jobpilot.ai",
    "devops@jobpilot.ai"
  ]

  # Optional webhook for Slack/Teams
  webhook_url = var.slack_webhook_url

  # Custom thresholds (optional)
  cpu_threshold_percent              = 85
  memory_threshold_percent           = 85
  response_time_threshold_seconds    = 3
  database_dtu_threshold_percent     = 75
  redis_memory_threshold_percent     = 75

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
| sql_server_id | SQL Server resource ID | string | null | no |
| redis_cache_id | Redis Cache resource ID | string | null | no |
| aks_cluster_id | AKS cluster resource ID | string | null | no |
| web_app_ids | Map of web app names to resource IDs | map(string) | {} | no |
| web_app_urls | Map of web app names to URLs | map(string) | {} | no |
| alert_email_addresses | List of email addresses for alerts | list(string) | - | yes |
| webhook_url | Webhook URL for alert integration | string | null | no |
| cpu_threshold_percent | CPU usage alert threshold | number | 80 | no |
| memory_threshold_percent | Memory usage alert threshold | number | 80 | no |
| http_5xx_threshold | HTTP 5xx error threshold | number | 10 | no |
| response_time_threshold_seconds | Response time threshold | number | 5 | no |
| database_dtu_threshold_percent | Database DTU threshold | number | 80 | no |
| redis_memory_threshold_percent | Redis memory threshold | number | 80 | no |
| redis_server_load_threshold_percent | Redis server load threshold | number | 80 | no |
| failed_requests_threshold | Failed requests threshold | number | 50 | no |
| error_spike_threshold | Error spike detection threshold | number | 50 | no |
| failed_auth_threshold | Failed auth attempts threshold | number | 10 | no |
| tags | Resource tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| action_group_id | Action group resource ID |
| action_group_name | Action group name |
| alert_rule_ids | List of all alert rule IDs |
| all_alert_names | List of all alert rule names |
| web_test_ids | Map of availability test IDs |
| monitoring_summary | Summary of monitoring resources |

## Alert Severity Levels

- **Severity 0 (Critical)**: Not currently used
- **Severity 1 (Error)**: HTTP 5xx errors, error rate spikes, failed authentication
- **Severity 2 (Warning)**: High CPU, high memory, slow response times, high DTU/cache usage
- **Severity 3 (Informational)**: Not currently used
- **Severity 4 (Verbose)**: Not currently used

## Alert Evaluation Windows

- **Metric Alerts**: 15-minute window, 5-minute frequency (except HTTP errors: 5-minute window, 1-minute frequency)
- **Availability Tests**: 5-minute frequency
- **Log Query Alerts**: 15-minute window, 5-minute evaluation frequency

## Best Practices

1. **Email Distribution**: Use distribution lists rather than individual emails
2. **Webhook Integration**: Configure webhook for real-time notifications to Slack/Teams
3. **Threshold Tuning**: Start with default thresholds and adjust based on baseline metrics
4. **Alert Fatigue**: Review and disable noisy alerts that don't require action
5. **Escalation**: Use severity levels to determine appropriate response times
6. **Testing**: Verify alert notifications work before going to production

## Example Alert Notifications

### Email Format
```
Alert: jobpilot-prod-frontend-high-cpu
Severity: Warning
Time: 2025-12-04 10:30:00 UTC
Description: Alert when CPU percentage is high for frontend
Resource: /subscriptions/.../providers/Microsoft.Web/sites/jobpilot-prod-frontend
Condition: CpuPercentage Average > 80
Actual Value: 87.5%
```

### Slack Webhook Payload
The module sends alerts using the common alert schema, which includes:
- Alert context and severity
- Resource information
- Metric details and threshold values
- Direct link to Azure Portal

## Maintenance

- Review alert thresholds quarterly
- Update email distribution lists as team changes
- Test availability tests after infrastructure changes
- Monitor alert effectiveness and adjust as needed
