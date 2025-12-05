# Azure WAF and Enhanced Monitoring Guide

This guide covers the Web Application Firewall (WAF) and enhanced monitoring features added to the JobPilot Azure infrastructure.

## Overview

The infrastructure now includes:

1. **Application Gateway with WAF v2** - Layer 7 load balancer with OWASP 3.2 protection
2. **Azure Front Door Premium** - Global load balancer with CDN and WAF (alternative option)
3. **Enhanced Monitoring** - Comprehensive alerts, availability tests, and dashboards
4. **Azure Monitor Dashboards** - Pre-configured dashboards for operations monitoring

## Table of Contents

- [WAF Solutions](#waf-solutions)
  - [Application Gateway](#application-gateway)
  - [Azure Front Door](#azure-front-door)
- [Monitoring Features](#monitoring-features)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Dashboards](#dashboards)
- [Alerts](#alerts)
- [Cost Considerations](#cost-considerations)

---

## WAF Solutions

### Application Gateway

**File:** `infrastructure/azure/modules/application-gateway.bicep`

#### Features:

- **WAF_v2 SKU** with autoscaling (1-10 instances based on environment)
- **OWASP 3.2 Ruleset** for protection against common web vulnerabilities
- **Bot Manager Ruleset 1.0** for bot detection and blocking
- **Custom WAF Rules:**
  - Rate limiting (100 requests/minute per IP)
  - SQL injection pattern blocking
  - Malicious IP blocking
  - Geographic filtering (configurable by country)

#### Backend Configuration:

- Separate backend pools for each service (Web, Auth, AI)
- HTTPS backend connections
- Health probes for each service:
  - Web App: `/api/health`
  - Auth Service: `/health`
  - AI Service: `/health`
- Connection draining (60 seconds)
- 30-second request timeout (60s for AI service)

#### Network Configuration:

- Dedicated subnet (`application-gateway-subnet`)
- Static public IP with DNS label
- HTTP/2 enabled
- Automatic HTTPS redirect (when SSL configured)

#### When to Use:

- Single-region deployments
- Need L7 load balancing within Azure region
- Integration with Azure VNet is required
- Cost-effective for single region

---

### Azure Front Door

**File:** `infrastructure/azure/modules/front-door.bicep`

#### Features:

- **Premium SKU** with global distribution
- **Microsoft Default Ruleset 2.1** for comprehensive protection
- **Bot Manager Ruleset 1.0**
- **CDN Caching** for static content (configurable)
- **Custom WAF Rules:**
  - Rate limiting (100 requests/minute)
  - Malicious user agent blocking
  - Path traversal protection
  - Geographic filtering
  - IP-based blocking

#### Routing Configuration:

- **Web App Route:** `/*` (with caching)
- **Auth Service Route:** `/api/*`, `/auth/*` (no caching)
- **AI Service Route:** `/ai/*`, `/generate/*` (no caching)

#### Performance Features:

- Global load balancing with latency-based routing
- Compression for text/JSON/JS/CSS
- HTTP/2 and HTTPS-only connections
- Health probes every 30 seconds
- DDoS protection (built-in with Premium)

#### When to Use:

- Multi-region deployments
- Global user base requiring low latency
- Need CDN for static content
- Require advanced DDoS protection
- Traffic patterns justify higher cost

---

## Monitoring Features

### Enhanced Alerts

**File:** `infrastructure/azure/modules/monitoring.bicep`

#### Metric Alerts:

1. **CPU Usage** - Alerts when > 80% for 5 minutes
2. **Memory Usage** - Alerts when > 85% for 5 minutes
3. **HTTP 5xx Errors** - Alerts when > 10 errors in 5 minutes
4. **HTTP 4xx Errors** - Alerts when > 50 errors in 15 minutes
5. **Response Time** - Alerts when average > 3 seconds
6. **SQL DTU Usage** - Alerts when > 80%
7. **SQL Storage** - Alerts when > 80%
8. **Redis CPU** - Alerts when > 80%
9. **Redis Connections** - Alerts when > 250 connections

#### Availability Tests:

- **Frequency:** Every 5 minutes
- **Locations:** 5 geo-distributed test locations
  - East US
  - Central US
  - West US
  - West Europe
  - Southeast Asia
- **Tests:**
  - Web App availability
  - Auth Service health endpoint
  - AI Service health endpoint
- **Alert Threshold:** Triggers when 2+ locations fail

#### Scheduled Query Alerts:

1. **High Error Rate Alert**
   - Triggers when error rate > 5% over 5 minutes
   - Severity: 2 (Warning)

2. **Unusual Traffic Pattern Alert**
   - Detects traffic deviating > 200% from 7-day baseline
   - Severity: 3 (Informational)

### Log Analytics Saved Queries

Pre-configured queries for dashboard and troubleshooting:

1. **High Error Rate Detection** - Identifies services with >5% error rate
2. **Slow Requests** - Finds requests with P95 > 3 seconds
3. **Dependency Failures** - Tracks external dependency issues
4. **Business Metrics** - Custom events tracking (signups, applications, etc.)
5. **User Journey Analysis** - Page views and session tracking
6. **Error Analysis** - Exception tracking with stack traces

---

## Deployment

### Basic Deployment (No WAF)

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters environment=dev \
               sqlAdminUsername=sqladmin \
               sqlAdminPassword='YourSecurePassword123!'
```

### With Application Gateway + WAF

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters environment=prod \
               sqlAdminUsername=sqladmin \
               sqlAdminPassword='YourSecurePassword123!' \
               enableApplicationGateway=true \
               wafMode=Prevention
```

### With Azure Front Door + WAF

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters environment=prod \
               sqlAdminUsername=sqladmin \
               sqlAdminPassword='YourSecurePassword123!' \
               enableFrontDoor=true \
               wafMode=Prevention
```

### Parameter File Example

Create `infrastructure/azure/parameters.prod.json`:

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "value": "prod"
    },
    "location": {
      "value": "eastus"
    },
    "sqlAdminUsername": {
      "value": "sqladmin"
    },
    "sqlAdminPassword": {
      "reference": {
        "keyVault": {
          "id": "/subscriptions/{sub-id}/resourceGroups/{rg}/providers/Microsoft.KeyVault/vaults/{vault-name}"
        },
        "secretName": "sql-admin-password"
      }
    },
    "enableApplicationGateway": {
      "value": true
    },
    "wafMode": {
      "value": "Prevention"
    },
    "enableDefender": {
      "value": true
    }
  }
}
```

Then deploy:

```bash
az deployment sub create \
  --location eastus \
  --template-file infrastructure/azure/main.bicep \
  --parameters @infrastructure/azure/parameters.prod.json
```

---

## Configuration

### WAF Mode Selection

The `wafMode` parameter controls WAF behavior:

- **Detection Mode:** Logs threats but doesn't block
  - Use for: Testing, staging environments
  - Allows you to tune rules before blocking

- **Prevention Mode:** Actively blocks threats
  - Use for: Production environments
  - Blocks malicious requests based on rules

### Customizing WAF Rules

#### Application Gateway WAF

Edit `infrastructure/azure/modules/application-gateway.bicep`:

```bicep
// Adjust rate limiting threshold
{
  name: 'RateLimitRule'
  priority: 1
  ruleType: 'RateLimitRule'
  rateLimitDuration: 'OneMin'
  rateLimitThreshold: 200  // Changed from 100
  // ...
}

// Add allowed countries for geo-filtering
{
  name: 'GeoBlockingRule'
  priority: 4
  matchConditions: [{
    operator: 'GeoMatch'
    negationConditon: true
    matchValues: [
      'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR'  // Add more
    ]
  }]
  // ...
}
```

#### Front Door WAF

Edit `infrastructure/azure/modules/front-door.bicep` similarly.

### Alert Thresholds

Adjust alert sensitivity in `infrastructure/azure/modules/monitoring.bicep`:

```bicep
// CPU Alert - increase threshold
{
  name: 'CPU Percentage'
  metricName: 'CpuPercentage'
  operator: 'GreaterThan'
  threshold: 90  // Changed from 80
  // ...
}

// Response Time - make more/less strict
{
  name: 'Response Time'
  metricName: 'AverageResponseTime'
  operator: 'GreaterThan'
  threshold: 5  // Changed from 3 seconds
  // ...
}
```

### Notification Configuration

Update email addresses in `infrastructure/azure/modules/monitoring.bicep`:

```bicep
emailReceivers: [
  {
    name: 'DevOps Team'
    emailAddress: 'devops@yourcompany.com'  // Update this
    useCommonAlertSchema: true
  }
  {
    name: 'On-Call Team'
    emailAddress: 'oncall@yourcompany.com'  // Add more receivers
    useCommonAlertSchema: true
  }
]
```

---

## Dashboards

### Main Monitoring Dashboard

Access via Azure Portal:

1. Navigate to: **Azure Portal** > **Dashboard**
2. Find: `jobpilot-{environment}-dashboard`

#### Dashboard Sections:

1. **Service Health Overview** - Application map showing service dependencies
2. **Request Rate** - Real-time request volume
3. **Response Time Trends** - P50, P95, P99 percentiles
4. **Error Rate by Service** - HTTP errors breakdown
5. **Resource Utilization:**
   - App Service CPU/Memory
   - SQL Database DTU
   - Redis Cache performance
6. **HTTP Status Codes** - Distribution chart
7. **Active Alerts** - Current firing alerts
8. **Top 10 Slowest Requests** - Performance bottlenecks
9. **Dependency Performance** - External service calls
10. **Exception Trends** - Application errors over time

### WAF Dashboard

If Application Gateway or Front Door is enabled:

1. Navigate to: **Azure Portal** > **Dashboard**
2. Find: `jobpilot-{environment}-dashboard-waf`

#### WAF Dashboard Shows:

- Blocked requests over time
- WAF rule trigger distribution
- Geographic distribution of blocked traffic
- Most common attack patterns

### Custom Dashboard Queries

Access saved queries in Log Analytics:

1. **Azure Portal** > **Log Analytics Workspace** > `jobpilot-{environment}-logs`
2. **Logs** > **Queries** > **Saved Queries**

Example custom query for business metrics:

```kql
customEvents
| where timestamp > ago(7d)
| where name == "UserSignup"
| summarize Signups = count() by bin(timestamp, 1d)
| render timechart
```

---

## Alerts

### Alert Severity Levels

- **Severity 0 (Critical):** Service completely down
- **Severity 1 (Error):** Availability drops, high error rates
- **Severity 2 (Warning):** Resource usage high, performance degraded
- **Severity 3 (Informational):** Unusual patterns, potential issues

### Alert Response

When you receive an alert:

1. **Check Dashboard** - Verify current state
2. **Review Logs** - Use saved queries to investigate
3. **Check Dependencies** - Review dependency performance
4. **Validate WAF** - If traffic-related, check WAF logs
5. **Scale if Needed** - Manually scale or wait for autoscale

### Alert Tuning

After initial deployment:

1. Monitor for false positives over 1-2 weeks
2. Adjust thresholds based on actual usage patterns
3. Fine-tune WAF rules in Detection mode
4. Switch to Prevention mode after validation

### Disable Alerts (Testing Only)

```bash
# Disable all alerts in a resource group
az monitor metrics alert update \
  --resource-group jobpilot-dev-rg \
  --name jobpilot-dev-cpu-alert-0 \
  --enabled false
```

---

## Cost Considerations

### Application Gateway Pricing

**Components:**
- Fixed fee per hour
- Capacity units (autoscaling)
- Data processing

**Estimated Monthly Cost (Production):**
- Fixed: ~$140/month
- Capacity Units (avg 3): ~$200/month
- Data Processing (500 GB): ~$40/month
- **Total: ~$380/month**

### Azure Front Door Premium Pricing

**Components:**
- Base fee
- Requests
- Data transfer out
- WAF policy

**Estimated Monthly Cost (Production):**
- Base Fee: ~$330/month
- Requests (10M): ~$35/month
- Data Transfer (500 GB): ~$40/month
- WAF: Included
- **Total: ~$405/month**

### Monitoring Pricing

**Components:**
- Log Analytics ingestion
- Availability tests
- Alerts

**Estimated Monthly Cost:**
- Log Analytics (5 GB): ~$12/month
- Availability Tests (3 tests × 5 locations): ~$15/month
- Alerts: First 5 free, then $0.10/alert
- **Total: ~$27/month**

### Cost Optimization Tips

1. **Use Application Gateway for single-region** - Cheaper than Front Door
2. **Adjust availability test frequency** - Change from 5min to 15min
3. **Reduce log retention** - 30 days instead of 90 for dev/staging
4. **Disable WAF in dev** - Only enable in staging/prod
5. **Use Detection mode initially** - Switch to Prevention after tuning

---

## Security Best Practices

### WAF Configuration

1. **Start in Detection Mode** - Monitor for false positives
2. **Review Logs Daily** - Check blocked requests
3. **Whitelist Known IPs** - Add your office/CI/CD IPs
4. **Enable Geo-Filtering** - Block countries you don't serve
5. **Regular Rule Updates** - Keep OWASP ruleset current

### Monitoring Security

1. **Protect Alert Emails** - Use distribution lists
2. **Secure Dashboards** - Use RBAC for access
3. **Audit Alert Changes** - Track modifications
4. **Test Alerts** - Verify notification delivery
5. **Review Logs Regularly** - Look for security patterns

### Compliance

- **OWASP Top 10** - Covered by WAF rulesets
- **PCI DSS** - WAF requirement satisfied
- **SOC 2** - Monitoring and alerting in place
- **GDPR** - Log retention configurable

---

## Troubleshooting

### WAF Blocking Legitimate Traffic

**Symptoms:** Users reporting access denied (403 errors)

**Solution:**
1. Check WAF logs in Application Gateway/Front Door
2. Identify the rule triggering the block
3. Add exception to WAF policy:

```bicep
exclusions: [
  {
    matchVariable: 'RequestHeaderNames'
    selectorMatchOperator: 'Equals'
    selector: 'User-Agent'
  }
]
```

### Alerts Not Firing

**Symptoms:** Expected alerts not received

**Checklist:**
1. Verify alert is enabled
2. Check evaluation frequency matches issue window
3. Confirm action group email addresses
4. Test action group manually
5. Review alert conditions match actual metrics

### Dashboard Not Loading

**Symptoms:** Dashboard shows errors or empty tiles

**Solution:**
1. Verify Log Analytics workspace is accessible
2. Check Application Insights is receiving data
3. Confirm RBAC permissions for dashboard viewer
4. Refresh browser cache

### High Costs

**Symptoms:** Unexpected Azure bill

**Investigation:**
1. Review Application Gateway capacity units usage
2. Check Front Door request volume
3. Analyze Log Analytics ingestion (top tables)
4. Review availability test frequency

---

## Next Steps

1. **Deploy to Dev** - Test with `enableApplicationGateway=true` and `wafMode=Detection`
2. **Monitor for 1 Week** - Review WAF logs and tune rules
3. **Update to Prevention** - Switch WAF mode after validation
4. **Configure Custom Domains** - Add SSL certificates to App Gateway/Front Door
5. **Set Up Custom Metrics** - Add business KPI tracking
6. **Integrate with Incident Management** - Connect alerts to PagerDuty/ServiceNow

---

## Additional Resources

- [Azure Application Gateway Documentation](https://docs.microsoft.com/azure/application-gateway/)
- [Azure Front Door Documentation](https://docs.microsoft.com/azure/frontdoor/)
- [Azure Monitor Documentation](https://docs.microsoft.com/azure/azure-monitor/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [WAF Best Practices](https://docs.microsoft.com/azure/web-application-firewall/best-practices)

---

## Support

For issues or questions:
- Check Azure Service Health
- Review Application Insights logs
- Contact: devops@jobpilot.ai
