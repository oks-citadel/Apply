# ApplyforUs Rebrand Monitoring Setup

Version 1.0 | Last Updated: December 2025

## Overview

This guide covers monitoring configuration for the ApplyforUs rebrand, including Application Insights setup, Log Analytics queries, alert rules, and dashboard creation.

## Application Insights Setup

### Configuration

**Environment Variables:**

```bash
# .env
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx
APPLICATIONINSIGHTS_ROLE_NAME=ApplyforUs-Web
APPINSIGHTS_INSTRUMENTATIONKEY=your-key-here
```

**NestJS Implementation:**

```typescript
// src/main.ts
import * as appInsights from 'applicationinsights';

appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
  .setAutoDependencyCorrelation(true)
  .setAutoCollectRequests(true)
  .setAutoCollectPerformance(true, true)
  .setAutoCollectExceptions(true)
  .setAutoCollectDependencies(true)
  .setAutoCollectConsole(true)
  .setUseDiskRetryCaching(true)
  .setSendLiveMetrics(true)
  .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'ApplyforUs-Web';
appInsights.start();
```

### Custom Metrics

```typescript
// Track rebrand metrics
const client = appInsights.defaultClient;

// Track page views with new branding
client.trackPageView({
  name: 'Homepage',
  properties: {
    brand: 'ApplyforUs',
    version: '1.0.0',
  },
});

// Track events
client.trackEvent({
  name: 'RebrandDeployment',
  properties: {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  },
});
```

## Log Analytics Queries

### Deployment Verification Queries

**1. Error Rate After Deployment**

```kusto
requests
| where timestamp > ago(1h)
| where cloud_RoleName == "ApplyforUs-Web"
| summarize
    TotalRequests = count(),
    FailedRequests = countif(success == false),
    ErrorRate = 100.0 * countif(success == false) / count()
  by bin(timestamp, 5m)
| project timestamp, TotalRequests, FailedRequests, ErrorRate
| render timechart
```

**2. Response Time Comparison**

```kusto
requests
| where timestamp > ago(7d)
| where cloud_RoleName == "ApplyforUs-Web"
| summarize
    p50 = percentile(duration, 50),
    p95 = percentile(duration, 95),
    p99 = percentile(duration, 99)
  by bin(timestamp, 1h)
| render timechart
```

**3. Exception Tracking**

```kusto
exceptions
| where timestamp > ago(24h)
| where cloud_RoleName == "ApplyforUs-Web"
| summarize count() by problemId, outerMessage
| order by count_ desc
| take 20
```

**4. Page Load Performance**

```kusto
pageViews
| where timestamp > ago(24h)
| where name contains "ApplyforUs"
| summarize
    AvgDuration = avg(duration),
    p95Duration = percentile(duration, 95)
  by name
| order by AvgDuration desc
```

**5. User Activity**

```kusto
customEvents
| where timestamp > ago(24h)
| where customDimensions.brand == "ApplyforUs"
| summarize count() by name, bin(timestamp, 1h)
| render timechart
```

## Alert Rules

### Critical Alerts

**1. High Error Rate**

```json
{
  "name": "ApplyforUs-HighErrorRate",
  "description": "Alert when error rate exceeds 5%",
  "severity": 1,
  "evaluationFrequency": "PT5M",
  "windowSize": "PT15M",
  "criteria": {
    "allOf": [{
      "query": "requests | where cloud_RoleName == 'ApplyforUs-Web' | summarize ErrorRate = 100.0 * countif(success == false) / count()",
      "threshold": 5,
      "operator": "GreaterThan"
    }]
  },
  "actions": [{
    "actionGroupId": "/subscriptions/xxx/resourceGroups/xxx/providers/microsoft.insights/actionGroups/CriticalAlerts"
  }]
}
```

**2. Service Availability**

```json
{
  "name": "ApplyforUs-ServiceDown",
  "description": "Alert when service is unreachable",
  "severity": 0,
  "evaluationFrequency": "PT1M",
  "windowSize": "PT5M",
  "criteria": {
    "allOf": [{
      "metricName": "availabilityResults/availabilityPercentage",
      "threshold": 95,
      "operator": "LessThan"
    }]
  }
}
```

**3. Slow Response Time**

```json
{
  "name": "ApplyforUs-SlowResponse",
  "description": "Alert when p95 response time exceeds 2 seconds",
  "severity": 2,
  "evaluationFrequency": "PT5M",
  "windowSize": "PT15M",
  "criteria": {
    "allOf": [{
      "query": "requests | where cloud_RoleName == 'ApplyforUs-Web' | summarize p95 = percentile(duration, 95)",
      "threshold": 2000,
      "operator": "GreaterThan"
    }]
  }
}
```

### Warning Alerts

**4. Increased Memory Usage**

```json
{
  "name": "ApplyforUs-HighMemory",
  "description": "Alert when memory usage exceeds 80%",
  "severity": 3,
  "evaluationFrequency": "PT5M",
  "windowSize": "PT15M",
  "criteria": {
    "allOf": [{
      "metricName": "performanceCounters/memoryAvailableBytes",
      "threshold": 20,
      "operator": "LessThan"
    }]
  }
}
```

**5. Failed Dependencies**

```json
{
  "name": "ApplyforUs-DependencyFailures",
  "description": "Alert on dependency failures",
  "severity": 2,
  "evaluationFrequency": "PT5M",
  "windowSize": "PT15M",
  "criteria": {
    "allOf": [{
      "query": "dependencies | where success == false | summarize count()",
      "threshold": 10,
      "operator": "GreaterThan"
    }]
  }
}
```

## Dashboard Creation

### Main Dashboard (JSON)

```json
{
  "name": "ApplyforUs Platform Overview",
  "tiles": [
    {
      "title": "Request Rate",
      "query": "requests | where cloud_RoleName startswith 'ApplyforUs' | summarize count() by bin(timestamp, 5m) | render timechart"
    },
    {
      "title": "Error Rate",
      "query": "requests | where cloud_RoleName startswith 'ApplyforUs' | summarize ErrorRate = 100.0 * countif(success == false) / count() by bin(timestamp, 5m) | render timechart"
    },
    {
      "title": "Response Time (p95)",
      "query": "requests | where cloud_RoleName startswith 'ApplyforUs' | summarize p95 = percentile(duration, 95) by bin(timestamp, 5m) | render timechart"
    },
    {
      "title": "Active Users",
      "query": "pageViews | where timestamp > ago(1h) | summarize dcount(user_Id) by bin(timestamp, 5m) | render timechart"
    },
    {
      "title": "Top Pages",
      "query": "pageViews | where timestamp > ago(24h) | summarize count() by name | order by count_ desc | take 10"
    },
    {
      "title": "Exception Count",
      "query": "exceptions | where timestamp > ago(24h) | summarize count() by bin(timestamp, 1h) | render timechart"
    }
  ]
}
```

### Deployment Dashboard

```json
{
  "name": "ApplyforUs Rebrand Deployment",
  "tiles": [
    {
      "title": "Deployment Success Rate",
      "query": "customEvents | where name == 'DeploymentComplete' | summarize SuccessRate = 100.0 * countif(customDimensions.status == 'success') / count()"
    },
    {
      "title": "Version Distribution",
      "query": "requests | where timestamp > ago(1h) | summarize count() by tostring(customDimensions.version)"
    },
    {
      "title": "Error Comparison (Pre/Post Rebrand)",
      "query": "requests | where timestamp > ago(7d) | extend IsNewBrand = customDimensions.brand == 'ApplyforUs' | summarize ErrorRate = 100.0 * countif(success == false) / count() by IsNewBrand, bin(timestamp, 1h)"
    }
  ]
}
```

## Performance Baselines

### Pre-Rebrand Baselines

```kusto
// Capture baseline metrics before deployment
requests
| where timestamp between (datetime(2025-12-01) .. datetime(2025-12-07))
| where cloud_RoleName == "JobPilot-Web"
| summarize
    BaselineP50 = percentile(duration, 50),
    BaselineP95 = percentile(duration, 95),
    BaselineP99 = percentile(duration, 99),
    BaselineErrorRate = 100.0 * countif(success == false) / count(),
    BaselineRequestRate = count() / (7.0 * 24.0)  // Requests per hour
```

### Post-Rebrand Comparison

```kusto
// Compare post-rebrand metrics to baseline
let baseline = requests
| where timestamp between (datetime(2025-12-01) .. datetime(2025-12-07))
| summarize
    BaselineP95 = percentile(duration, 95),
    BaselineErrorRate = 100.0 * countif(success == false) / count();
let current = requests
| where timestamp > ago(24h)
| where cloud_RoleName == "ApplyforUs-Web"
| summarize
    CurrentP95 = percentile(duration, 95),
    CurrentErrorRate = 100.0 * countif(success == false) / count();
baseline
| extend
    P95Change = (current.CurrentP95 - BaselineP95) / BaselineP95 * 100,
    ErrorRateChange = (current.CurrentErrorRate - BaselineErrorRate) / BaselineErrorRate * 100
| project P95Change, ErrorRateChange
```

## Kubernetes Monitoring

### Pod Metrics

```bash
# Monitor pod resource usage
kubectl top pods -n production -l app=applyforus-web

# Watch pod status
kubectl get pods -n production -w

# Monitor events
kubectl get events -n production --sort-by='.lastTimestamp'
```

### Service Monitoring

```bash
# Check service endpoints
kubectl get endpoints -n production

# Monitor ingress
kubectl get ingress -n production

# Check HPA status
kubectl get hpa -n production
```

## Custom Monitoring Endpoints

### Health Check Endpoint

```typescript
// src/health/health.controller.ts
@Get('health')
async getHealth() {
  return {
    status: 'healthy',
    brand: 'ApplyforUs',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dependencies: {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      queue: await this.checkQueue(),
    },
  };
}
```

### Metrics Endpoint

```typescript
// src/metrics/metrics.controller.ts
@Get('metrics')
async getMetrics() {
  const client = appInsights.defaultClient;

  return {
    requests: {
      total: await this.getTotalRequests(),
      successful: await this.getSuccessfulRequests(),
      failed: await this.getFailedRequests(),
    },
    performance: {
      p50: await this.getP50ResponseTime(),
      p95: await this.getP95ResponseTime(),
      p99: await this.getP99ResponseTime(),
    },
    users: {
      active: await this.getActiveUsers(),
      new: await this.getNewUsers(),
    },
  };
}
```

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Contact:** devops@applyforus.com
