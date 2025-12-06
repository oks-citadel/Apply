# Monitoring Quick Reference

## Quick Commands

### Start Monitoring Stack
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### Stop Monitoring Stack
```bash
docker-compose -f docker-compose.monitoring.yml down
```

### View Logs
```bash
# Prometheus
docker logs -f jobpilot-prometheus

# Grafana
docker logs -f jobpilot-grafana

# AlertManager
docker logs -f jobpilot-alertmanager
```

### Reload Configuration
```bash
# Reload Prometheus config without restart
curl -X POST http://localhost:9090/-/reload

# Restart specific service
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

## Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Prometheus | http://localhost:9090 | None |
| Grafana | http://localhost:3001 | admin/admin |
| AlertManager | http://localhost:9093 | None |
| cAdvisor | http://localhost:8080 | None |
| Node Exporter | http://localhost:9100/metrics | None |

## Common PromQL Queries

### HTTP Metrics
```promql
# Request rate
sum(rate(http_requests_total[5m])) by (service)

# Error rate
sum(rate(http_request_errors_total[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))

# Requests in flight
sum(http_requests_in_flight) by (service)
```

### Queue Metrics
```promql
# Queue size
sum(queue_size{status="waiting"}) by (queue_name)

# Queue processing rate
rate(queue_jobs_total[5m])

# Queue error rate
rate(queue_job_errors_total[5m]) / rate(queue_jobs_total[5m])
```

### Infrastructure Metrics
```promql
# CPU usage
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory usage
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk usage
100 - ((node_filesystem_avail_bytes{mountpoint="/"} * 100) / node_filesystem_size_bytes{mountpoint="/"})
```

### Database Metrics
```promql
# Connection pool usage
db_connection_pool_active / db_connection_pool_size

# Query duration P99
histogram_quantile(0.99, rate(db_query_duration_seconds_bucket[5m]))
```

## Service Integration Checklist

- [ ] Install `@jobpilot/shared` package
- [ ] Add logger to main.ts
- [ ] Add metrics middleware
- [ ] Create health check endpoints
- [ ] Expose /metrics endpoint
- [ ] Update Kubernetes manifests (liveness/readiness)
- [ ] Add service to prometheus.yml
- [ ] Test all endpoints
- [ ] Verify in Prometheus targets
- [ ] Check Grafana dashboard

## Code Snippets

### Basic Logger Setup
```typescript
import { createLoggerInstance } from '@jobpilot/shared';

const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV,
  logLevel: 'info',
});

logger.info('Service started', { port: 3000 });
```

### Basic Metrics Setup
```typescript
import { createPrometheusMetrics } from '@jobpilot/shared';

const metrics = createPrometheusMetrics({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV,
});

app.use(metrics.middleware());
```

### Track Operation
```typescript
const start = Date.now();
try {
  await doWork();
  metrics.trackOperation('work', 'business', Date.now() - start, true);
} catch (error) {
  metrics.trackOperation('work', 'business', Date.now() - start, false, 'error');
}
```

### Log with Context
```typescript
logger.setContext({
  correlationId: req.headers['x-correlation-id'],
  userId: req.user?.id,
});

logger.info('Processing order', { orderId: order.id });
```

## Alert Severity Guide

| Severity | Response Time | Examples |
|----------|--------------|----------|
| **Critical** | Immediate | Service down, 95% CPU, disk full |
| **Warning** | Within 1 hour | 80% CPU, high latency, error rate >5% |
| **Info** | Review next day | High traffic, cache miss rate |

## Debugging Checklist

### Service Not Appearing in Prometheus

1. Check service is running: `docker ps`
2. Check /metrics endpoint: `curl http://service:port/metrics`
3. Check Prometheus targets: http://localhost:9090/targets
4. Check network: `docker network inspect jobpilot-network`
5. Check Prometheus logs: `docker logs jobpilot-prometheus`

### Metrics Not Showing in Grafana

1. Check Prometheus datasource in Grafana
2. Test query in Prometheus first
3. Check time range in dashboard
4. Verify metric name and labels
5. Check for typos in query

### Alerts Not Firing

1. Check alert rules: http://localhost:9090/alerts
2. Verify alert expression returns data
3. Check AlertManager config: http://localhost:9093
4. Check notification channel config
5. Test notification channel manually

### Correlation IDs Not Working

1. Verify middleware is installed
2. Check header name (X-Correlation-ID)
3. Verify context is set before logging
4. Check logger.getContext() returns data
5. Ensure middleware runs before controllers

## Metric Naming Conventions

```
{namespace}_{subsystem}_{name}_{unit}

Examples:
http_requests_total
http_request_duration_seconds
queue_jobs_total
db_query_duration_seconds
cache_hits_total
```

## Log Levels Usage

| Level | When to Use | Example |
|-------|-------------|---------|
| **ERROR** | System errors, exceptions | Database connection failed |
| **WARN** | Potential issues | High memory usage, slow query |
| **INFO** | Important events | User login, order created |
| **HTTP** | Request/response | GET /api/users 200 150ms |
| **DEBUG** | Diagnostic info | Cache lookup, query params |

## Common Patterns

### Correlation ID Propagation
```typescript
// Receive
const correlationId = req.headers['x-correlation-id'] || uuidv4();

// Set context
logger.setContext({ correlationId });

// Propagate
axios.get(url, {
  headers: { 'X-Correlation-ID': correlationId }
});
```

### Operation Tracking
```typescript
const opId = logger.startOperation('user_signup', { email });
try {
  await signup(data);
  logger.endOperation(opId, 'user_signup', true);
} catch (error) {
  logger.error('Signup failed', error, { opId });
  logger.endOperation(opId, 'user_signup', false);
}
```

### Queue Monitoring
```typescript
// Update queue size
setInterval(async () => {
  const size = await queue.getWaitingCount();
  metrics.updateQueueSize('email', 'waiting', size);
}, 10000);

// Track job
const start = Date.now();
try {
  await processJob(job);
  metrics.trackQueueJob('email', 'send', Date.now() - start, true);
} catch (error) {
  metrics.trackQueueJob('email', 'send', Date.now() - start, false, error.name);
}
```

## Environment Variables

```bash
# Logging
LOG_LEVEL=info|debug|warn|error
NODE_ENV=development|production|test
SERVICE_VERSION=1.0.0

# Metrics
ENABLE_DEFAULT_METRICS=true|false
METRICS_PREFIX=jobpilot

# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme

# SMTP
SMTP_HOST=smtp.gmail.com:587
SMTP_USERNAME=alerts@example.com
SMTP_PASSWORD=app-password

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=jobpilot
```

## Grafana Dashboard Tips

### Variables
```
# Service selector
label_values(http_requests_total, service)

# Time range
$__range

# Rate interval
$__rate_interval
```

### Queries
```promql
# Dynamic service filter
sum(rate(http_requests_total{service="$service"}[5m]))

# Template variable in legend
{{service}} - {{status_code}}
```

### Thresholds
- Green: 0-70% (OK)
- Yellow: 70-90% (Warning)
- Red: 90-100% (Critical)

## File Locations

```
packages/shared/
  ├── src/logging/logger.ts          # Logger implementation
  ├── src/metrics/prometheus.ts      # Metrics collector
  └── src/health/health.service.ts   # Health checks

infrastructure/monitoring/
  ├── prometheus/prometheus.yml      # Prometheus config
  ├── alerts/service-alerts.yml      # Service alerts
  ├── alerts/infrastructure-alerts.yml # Infra alerts
  ├── alertmanager/alertmanager.yml  # Alert routing
  ├── dashboards/service-overview.json # Service dashboard
  └── dashboards/infrastructure-metrics.json # Infra dashboard

docker-compose.monitoring.yml        # Monitoring stack
.env.monitoring.example              # Environment template
```

## Support Resources

- **Main Docs**: infrastructure/monitoring/README.md
- **Setup Guide**: infrastructure/monitoring/SETUP_GUIDE.md
- **Package Docs**: packages/shared/README.md
- **Summary**: MONITORING_INFRASTRUCTURE_SUMMARY.md

## Quick Health Check

```bash
# Check all services
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Check specific service
curl http://localhost:3000/health | jq

# Check metrics exposed
curl http://localhost:3000/metrics | grep -v "^#" | head -20

# Test alert
curl -X POST http://localhost:9090/api/v1/admin/tsdb/delete_series?match[]={job="test"}
```

## Performance Tuning

```yaml
# Reduce scrape frequency
scrape_interval: 30s  # Default: 15s

# Reduce retention
--storage.tsdb.retention.time=15d  # Default: 30d

# Limit memory
--storage.tsdb.max-block-duration=2h

# Reduce series
--storage.tsdb.min-block-duration=2h
```

## Common Issues

| Issue | Solution |
|-------|----------|
| High cardinality | Reduce label values, use label_replace |
| Slow queries | Add recording rules, optimize queries |
| Disk space | Reduce retention, delete old data |
| Missing data | Check scrape errors, increase timeout |
| Alert spam | Adjust thresholds, add inhibition rules |

## Metric Types

| Type | Use Case | Example |
|------|----------|---------|
| **Counter** | Cumulative count | Requests, errors, jobs |
| **Gauge** | Point-in-time value | Memory, CPU, queue size |
| **Histogram** | Distribution | Request duration, size |
| **Summary** | Client-side quantiles | Response time percentiles |
