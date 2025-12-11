# ApplyForUs Observability, Alerts & Runbooks

**Version**: 1.0.0
**Last Updated**: 2025-12-10

---

## 1. OBSERVABILITY ARCHITECTURE

### 1.1 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Metrics | Azure Monitor + Prometheus | System and app metrics |
| Logs | Azure Log Analytics | Centralized logging |
| Traces | OpenTelemetry + Azure App Insights | Distributed tracing |
| Dashboards | Azure Workbooks + Grafana | Visualization |
| Alerting | Azure Monitor Alerts | Incident detection |

### 1.2 Data Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         Applications                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ web-app  │ │auth-svc  │ │ job-svc  │ │ ai-svc   │  ...        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘             │
│       │            │            │            │                     │
│       └────────────┴─────┬──────┴────────────┘                     │
│                          │                                         │
│              ┌───────────▼───────────┐                            │
│              │  OpenTelemetry SDK    │                            │
│              │  (@jobpilot/telemetry)│                            │
│              └───────────┬───────────┘                            │
└──────────────────────────┼─────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐ ┌─────▼────┐ ┌──────▼──────┐
    │Azure Monitor │ │Container │ │ Prometheus  │
    │App Insights  │ │ Logs     │ │  Metrics    │
    └───────┬──────┘ └─────┬────┘ └──────┬──────┘
            │              │              │
            └──────────────┼──────────────┘
                           │
               ┌───────────▼───────────┐
               │   Log Analytics       │
               │   Workspace           │
               └───────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    ┌───────▼──────┐ ┌─────▼────┐ ┌──────▼──────┐
    │   Grafana    │ │  Azure   │ │   Alert     │
    │  Dashboards  │ │Workbooks │ │   Rules     │
    └──────────────┘ └──────────┘ └─────────────┘
```

---

## 2. LOGGING CONFIGURATION

### 2.1 Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| ERROR | Errors requiring attention | DB connection failure |
| WARN | Potential issues | High memory usage |
| INFO | Normal operations | Request completed |
| DEBUG | Development debugging | Query parameters |
| TRACE | Detailed debugging | Full request body |

### 2.2 Structured Log Format

```typescript
// packages/logging/src/logger.ts
interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  service: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}
```

### 2.3 Log Queries (Kusto)

```kusto
// Recent errors by service
ContainerLog
| where LogEntry contains "error"
| extend parsed = parse_json(LogEntry)
| summarize ErrorCount = count() by tostring(parsed.service), bin(TimeGenerated, 1h)
| order by ErrorCount desc

// Slow requests (>1s)
ContainerLog
| where LogEntry contains "request completed"
| extend parsed = parse_json(LogEntry)
| where todouble(parsed.durationMs) > 1000
| project TimeGenerated, Service=tostring(parsed.service),
          Path=tostring(parsed.path), Duration=todouble(parsed.durationMs)

// User activity trace
ContainerLog
| extend parsed = parse_json(LogEntry)
| where tostring(parsed.userId) == "user-123"
| project TimeGenerated, Service=tostring(parsed.service),
          Message=tostring(parsed.message)
| order by TimeGenerated desc
```

---

## 3. METRICS

### 3.1 Application Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_request_size_bytes` | Histogram | Request body size |
| `http_response_size_bytes` | Histogram | Response body size |
| `active_connections` | Gauge | Current connections |
| `db_pool_connections` | Gauge | Database pool status |
| `queue_messages_total` | Counter | Queue message count |

### 3.2 Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `job_applications_total` | Counter | Job applications submitted |
| `ai_cover_letters_generated` | Counter | AI cover letters created |
| `subscriptions_created` | Counter | New subscriptions |
| `payments_processed_total` | Counter | Payment transactions |
| `coins_spent_total` | Counter | Virtual coins spent |
| `user_registrations_total` | Counter | New user signups |

### 3.3 Infrastructure Metrics

```yaml
# Prometheus scrape config for AKS
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: applyforus-services
  namespace: applyforus
spec:
  selector:
    matchLabels:
      app.kubernetes.io/part-of: applyforus
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

---

## 4. DISTRIBUTED TRACING

### 4.1 Trace Context Propagation

```typescript
// packages/telemetry/src/tracer.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { AzureMonitorTraceExporter } from '@azure/monitor-opentelemetry-exporter';

const sdk = new NodeSDK({
  traceExporter: new AzureMonitorTraceExporter({
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          span.setAttribute('user.id', request.headers['x-user-id']);
        },
      },
    }),
  ],
});
```

### 4.2 Span Attributes

| Attribute | Description |
|-----------|-------------|
| `service.name` | Service identifier |
| `user.id` | User identifier |
| `subscription.tier` | User subscription tier |
| `http.method` | HTTP method |
| `http.status_code` | Response status |
| `db.statement` | Database query |
| `error` | Error flag |

---

## 5. ALERT RULES

### 5.1 Critical Alerts (Page Immediately)

| Alert | Condition | Action |
|-------|-----------|--------|
| Service Down | `up == 0` for 2m | Page on-call |
| High Error Rate | Error rate > 5% for 5m | Page on-call |
| Database Unavailable | DB connection fails 3x | Page on-call |
| Payment Gateway Error | Payment success < 90% for 5m | Page on-call |
| SSL Certificate Expiry | < 7 days | Page on-call |

### 5.2 Warning Alerts (Slack Notification)

| Alert | Condition | Action |
|-------|-----------|--------|
| High Latency | P99 > 2s for 5m | Slack #ops |
| Memory Pressure | Memory > 85% for 10m | Slack #ops |
| CPU Spike | CPU > 80% for 10m | Slack #ops |
| Queue Backup | Queue depth > 1000 for 5m | Slack #ops |
| Disk Usage | Disk > 80% | Slack #ops |

### 5.3 Azure Monitor Alert Rules

```hcl
# Terraform for alert rules
resource "azurerm_monitor_metric_alert" "high_error_rate" {
  name                = "high-error-rate"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when error rate exceeds 5%"
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/failed"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 5
  }

  action {
    action_group_id = azurerm_monitor_action_group.pagerduty.id
  }
}

resource "azurerm_monitor_metric_alert" "service_unavailable" {
  name                = "service-unavailable"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  description         = "Alert when pods are not running"
  severity            = 0
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "kube_pod_status_ready"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1
  }

  action {
    action_group_id = azurerm_monitor_action_group.pagerduty.id
  }
}
```

---

## 6. DASHBOARDS

### 6.1 Executive Dashboard

**Metrics displayed:**
- Daily Active Users (DAU)
- Job Applications (last 24h)
- Revenue (MTD)
- Subscription conversions
- System health score

### 6.2 Operations Dashboard

**Panels:**
1. Service Health Matrix (all services)
2. Request Rate (by service)
3. Error Rate (by service)
4. Latency P50/P95/P99
5. Active Users
6. Database Connections
7. Queue Depth
8. Memory/CPU Usage

### 6.3 Service-Specific Dashboard

```json
// Grafana dashboard JSON snippet
{
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(http_requests_total{service=\"$service\"}[5m])",
          "legendFormat": "{{method}} {{path}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{service=\"$service\",status=~\"5..\"}[5m])) / sum(rate(http_requests_total{service=\"$service\"}[5m])) * 100"
        }
      ],
      "thresholds": [
        { "value": 1, "color": "green" },
        { "value": 3, "color": "yellow" },
        { "value": 5, "color": "red" }
      ]
    }
  ]
}
```

---

## 7. RUNBOOKS

### 7.1 High Error Rate

**Symptoms:**
- Error rate > 5%
- Alert: `HighErrorRate`

**Steps:**
1. Check recent deployments: `kubectl rollout history deployment/<service> -n applyforus`
2. Check logs: `kubectl logs -l app=<service> -n applyforus --tail=100`
3. Check dependencies (DB, Redis, external APIs)
4. If recent deployment: `kubectl rollout undo deployment/<service> -n applyforus`
5. Scale up if load-related: `kubectl scale deployment/<service> --replicas=5 -n applyforus`

**Escalation:** If unresolved in 15 minutes, escalate to tech lead.

---

### 7.2 Service Unavailable

**Symptoms:**
- Pods not running
- Health checks failing
- Alert: `ServiceUnavailable`

**Steps:**
1. Check pod status: `kubectl get pods -n applyforus -l app=<service>`
2. Check pod events: `kubectl describe pod <pod-name> -n applyforus`
3. Check node status: `kubectl get nodes`
4. If ImagePullBackOff:
   - Verify image exists: `az acr repository show-tags --name applyforusacr --repository applyai-<service>`
   - Check ACR connectivity: `az aks check-acr --name applyforus-aks --resource-group applyforus-prod-rg --acr applyforusacr`
5. If CrashLoopBackOff:
   - Check logs: `kubectl logs <pod-name> -n applyforus --previous`
   - Check resource limits
6. If Pending:
   - Check resource availability: `kubectl describe node`
   - Scale node pool if needed

**Escalation:** If unresolved in 10 minutes, escalate to platform team.

---

### 7.3 Database Connection Issues

**Symptoms:**
- Connection timeout errors
- `ECONNREFUSED` errors
- Alert: `DatabaseUnavailable`

**Steps:**
1. Check PostgreSQL status: `az postgres flexible-server show --resource-group applyforus-prod-rg --name applyforus-db`
2. Check connection pooler (PgBouncer)
3. Verify network connectivity from pods
4. Check connection limits: `SELECT count(*) FROM pg_stat_activity;`
5. If connection exhaustion:
   - Restart affected service pods
   - Increase pool size if needed
6. Check for long-running queries: `SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';`

**Escalation:** If database is down, escalate to DBA immediately.

---

### 7.4 Payment Processing Failures

**Symptoms:**
- Payment success rate < 90%
- Webhook delivery failures
- Alert: `PaymentGatewayError`

**Steps:**
1. Check Stripe dashboard for outages
2. Check payment service logs: `kubectl logs -l app=payment-service -n applyforus --tail=100`
3. Verify webhook signatures
4. Check for rate limiting
5. Test payment flow manually in test mode
6. If Stripe issue: Monitor status.stripe.com
7. If our issue: Check recent deployments

**Escalation:** Critical - notify finance team and tech lead immediately.

---

### 7.5 High Latency

**Symptoms:**
- P99 latency > 2s
- Slow page loads
- Alert: `HighLatency`

**Steps:**
1. Check which service is slow: Use distributed tracing
2. Check database query performance
3. Check Redis cache hit rate
4. Check external API latency (AI, payment)
5. Profile slow endpoints
6. Scale up if load-related
7. Enable/adjust caching

**Resolution:** Target P99 < 500ms for API calls.

---

### 7.6 Memory Leak / OOM

**Symptoms:**
- Memory usage trending up
- OOMKilled events
- Alert: `HighMemoryUsage`

**Steps:**
1. Identify affected pods: `kubectl top pods -n applyforus`
2. Check memory trends in monitoring
3. Take heap dump if possible
4. Restart affected pods (temporary fix)
5. Check for recent code changes
6. Increase memory limit if justified
7. Profile memory usage in dev

**Prevention:** Regular load testing and memory profiling.

---

### 7.7 SSL Certificate Expiry

**Symptoms:**
- Certificate expires in < 7 days
- Alert: `SSLCertExpiring`

**Steps:**
1. Check certificate status: `kubectl get certificate -n applyforus`
2. Check cert-manager logs: `kubectl logs -n cert-manager -l app=cert-manager`
3. Force renewal: `kubectl delete certificate applyforus-tls -n applyforus`
4. Verify DNS is correct for ACME challenge
5. Check Let's Encrypt rate limits

**Prevention:** Monitor certificate expiry in dashboard.

---

## 8. INCIDENT RESPONSE

### 8.1 Severity Levels

| Severity | Description | Response Time | Example |
|----------|-------------|---------------|---------|
| SEV1 | Complete outage | 15 min | All services down |
| SEV2 | Major degradation | 30 min | Payment failing |
| SEV3 | Minor degradation | 2 hours | Slow responses |
| SEV4 | Low impact | Next business day | UI bug |

### 8.2 Incident Commander Checklist

1. **Assess** - Understand scope and impact
2. **Communicate** - Update status page
3. **Assign** - Delegate tasks to team
4. **Mitigate** - Apply quick fixes
5. **Resolve** - Implement permanent fix
6. **Review** - Post-incident analysis

### 8.3 Communication Templates

**Status Page - Investigating:**
```
We are currently investigating reports of [ISSUE].
Some users may experience [IMPACT].
Our team is working to resolve this as quickly as possible.
Next update in 15 minutes.
```

**Status Page - Identified:**
```
We have identified the cause of [ISSUE] as [ROOT CAUSE].
We are implementing a fix.
Expected resolution time: [TIME].
```

**Status Page - Resolved:**
```
The issue affecting [SERVICE] has been resolved.
All systems are now operating normally.
We apologize for any inconvenience caused.
A detailed post-incident report will follow.
```

---

## 9. POST-INCIDENT REVIEW

### 9.1 Template

```markdown
# Incident Report: [TITLE]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV[1-4]
**Impact:** [Description of user impact]

## Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Systems normal

## Root Cause
[Technical explanation]

## Resolution
[What was done to fix it]

## Action Items
- [ ] Prevent similar issues (owner, due date)
- [ ] Improve detection (owner, due date)
- [ ] Update runbook (owner, due date)

## Lessons Learned
- What went well
- What could be improved
```

---

## 10. SLO/SLI DEFINITIONS

### 10.1 Service Level Indicators (SLIs)

| SLI | Calculation | Target |
|-----|-------------|--------|
| Availability | Successful requests / Total requests | 99.9% |
| Latency | P99 request duration | < 500ms |
| Error Rate | 5xx errors / Total requests | < 0.1% |
| Throughput | Requests per second | > 100 RPS |

### 10.2 Service Level Objectives (SLOs)

| Service | Availability | Latency P99 | Error Budget |
|---------|--------------|-------------|--------------|
| Web App | 99.9% | 500ms | 43.8 min/month |
| Auth | 99.95% | 200ms | 21.9 min/month |
| Payment | 99.99% | 1000ms | 4.4 min/month |
| AI | 99.5% | 5000ms | 3.6 hr/month |

### 10.3 Error Budget Policy

- If error budget is < 25%: Feature freeze, focus on reliability
- If error budget is < 10%: Only critical fixes deployed
- If error budget is 0%: All deployments halted except hotfixes

---

*This document should be reviewed quarterly and updated based on operational learnings.*
