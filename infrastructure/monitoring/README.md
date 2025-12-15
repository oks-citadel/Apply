# Observability & Monitoring Infrastructure

## Overview

This directory contains the complete observability stack for the ApplyForUs AI Platform, including:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **AlertManager**: Alert routing and notification
- **Azure Application Insights**: Distributed tracing (via OpenTelemetry)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Microservices                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐     │
│  │  Auth   │  │  User   │  │  Job    │  │  Resume  │ ... │
│  │ Service │  │ Service │  │ Service │  │  Service │     │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬─────┘     │
│       │            │            │            │             │
│       └────────────┴────────────┴────────────┘             │
│                    │                                        │
└────────────────────┼────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼─────┐            ┌─────▼──────┐
   │Prometheus│            │  Azure     │
   │  :9090   │            │App Insights│
   └────┬─────┘            └────────────┘
        │
   ┌────▼─────┐
   │ Grafana  │
   │  :3001   │
   └────┬─────┘
        │
   ┌────▼─────────┐
   │ AlertManager │
   │    :9093     │
   └──────────────┘
```

## Quick Start

### 1. Start Monitoring Stack

```bash
# From project root
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services are running
docker-compose -f docker-compose.monitoring.yml ps
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin` (change on first login)

- **Prometheus**: http://localhost:9090
  - Targets: http://localhost:9090/targets
  - Alerts: http://localhost:9090/alerts

- **AlertManager**: http://localhost:9093

### 3. Start Application Services

```bash
docker-compose up -d
```

All services will automatically expose `/metrics` endpoints for Prometheus scraping.

## Metrics Exposed

### HTTP Metrics
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration histogram
- `http_requests_in_progress`: Current active requests

### Database Metrics
- `db_connection_pool_size`: Total connection pool size
- `db_connection_pool_used`: Active connections
- `db_query_duration_seconds`: Query duration histogram
- `db_queries_total`: Total queries executed
- `db_query_errors_total`: Query errors

### Redis Metrics
- `redis_connections_active`: Active Redis connections
- `redis_command_duration_seconds`: Command duration
- `redis_command_errors_total`: Command errors
- `cache_hits_total`: Cache hits
- `cache_misses_total`: Cache misses

### Business Metrics
- `job_applications_total`: Job applications submitted
- `resume_generations_total`: Resumes generated
- `ai_requests_total`: AI API requests
- `ai_request_duration_seconds`: AI request duration
- `payment_transactions_total`: Payment transactions
- `user_active_total`: Currently active users

### Circuit Breaker Metrics
- `circuit_breaker_state`: Current state (0=closed, 1=open, 2=half-open)
- `circuit_breaker_failures_total`: Total failures

### Queue Metrics (Bull)
- `bull_queue_waiting`: Jobs waiting in queue
- `bull_queue_active`: Jobs being processed
- `bull_queue_delayed`: Delayed jobs
- `bull_queue_completed_total`: Completed jobs
- `bull_queue_failed_total`: Failed jobs
- `bull_queue_job_duration_seconds`: Job processing duration

## Grafana Dashboards

### 1. Service Overview Dashboard
**File**: `dashboards/service-overview.json`

Displays:
- Service availability status
- Request rates per service
- Error rates
- Response time percentiles (P50, P95, P99)
- CPU and memory usage
- Active request count

**Use For**: Overall system health monitoring

### 2. Database Metrics Dashboard
**File**: `dashboards/database-metrics.json`

Displays:
- Connection pool utilization
- Query duration percentiles
- Query rates by operation
- Query error rates
- PostgreSQL-specific metrics
- Cache hit ratios

**Use For**: Database performance optimization

### 3. Business Metrics Dashboard
**File**: `dashboards/business-metrics.json`

Displays:
- Job applications (total and rate)
- Resume generations
- AI service usage and performance
- Active users
- Payment transactions
- Queue health

**Use For**: Business KPI monitoring

## Alerting

### Alert Configuration

Alerts are defined in `prometheus/alerts/service-alerts.yml` and organized by category:

#### Service Availability
- **ServiceDown**: Service unavailable for > 1 minute
- **ServiceHighRestartRate**: Frequent service restarts

#### HTTP Performance
- **HighErrorRate**: > 5% error rate for 5 minutes
- **SlowResponseTime**: P95 latency > 2s for 5 minutes
- **VerySlowResponseTime**: P95 latency > 5s for 2 minutes

#### Database
- **DatabaseConnectionPoolExhausted**: > 90% pool usage
- **SlowDatabaseQueries**: P95 query time > 1s
- **HighDatabaseErrorRate**: > 1% query error rate

#### Redis/Cache
- **RedisDown**: Redis unavailable
- **LowCacheHitRate**: < 50% cache hit rate
- **HighRedisMemoryUsage**: > 90% memory usage

#### System Resources
- **HighCPUUsage**: > 80% CPU usage
- **HighMemoryUsage**: > 90% memory usage
- **HighDiskUsage**: > 90% disk usage

#### Circuit Breakers
- **CircuitBreakerOpen**: Circuit breaker open for > 1 minute
- **HighCircuitBreakerFailureRate**: > 10 failures/sec

#### Business Metrics
- **LowJobApplicationRate**: < 0.1 applications/sec for 30 minutes
- **HighAIServiceFailureRate**: > 10% AI failure rate
- **SlowAIRequests**: AI P95 > 30s

#### Queues
- **HighQueueBacklog**: > 1000 jobs waiting
- **HighQueueFailureRate**: > 5% job failure rate
- **QueueProcessingStalled**: No completions with waiting jobs

### Alert Routing

Configured in `alertmanager/alertmanager.yml`:

1. **Critical Alerts** → PagerDuty + Slack (#alerts-critical)
2. **Warning Alerts** → Slack (#alerts-warnings)
3. **Database Alerts** → Database team + Email
4. **Business Alerts** → Slack (#team-business)
5. **Performance Alerts** → Slack (#team-performance)

### Setting Up Notifications

#### Slack Integration

1. Create Slack webhook:
   - Go to https://api.slack.com/apps
   - Create new app → Incoming Webhooks
   - Copy webhook URL

2. Set environment variable:
   ```bash
   export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
   ```

3. Restart AlertManager:
   ```bash
   docker-compose -f docker-compose.monitoring.yml restart alertmanager
   ```

#### PagerDuty Integration

1. Get PagerDuty service key from your PagerDuty account

2. Set environment variable:
   ```bash
   export PAGERDUTY_SERVICE_KEY="your-service-key"
   ```

3. Restart AlertManager

## Azure Application Insights Integration

### Setup

1. Create Application Insights resource in Azure Portal

2. Copy connection string

3. Set environment variables in all services:
   ```bash
   APPLICATIONINSIGHTS_CONNECTION_STRING="InstrumentationKey=xxx;IngestionEndpoint=xxx"
   ```

4. Restart services - telemetry will automatically start

### Features Enabled

- **Distributed Tracing**: Track requests across microservices
- **Dependency Tracking**: Monitor database, Redis, HTTP calls
- **Exception Tracking**: Automatic error capture
- **Performance Monitoring**: Request/response times
- **Custom Events**: Business metrics tracking

## Prometheus Queries

### Useful Queries

```promql
# Overall request rate
sum(rate(http_requests_total[5m])) by (service)

# Error rate percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (service)
  / sum(rate(http_requests_total[5m])) by (service) * 100

# P95 latency
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
)

# Database connection pool usage
db_connection_pool_used / db_connection_pool_size * 100

# Cache hit rate
sum(rate(cache_hits_total[5m]))
  / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100

# Top 5 slowest endpoints
topk(5,
  histogram_quantile(0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
  )
)

# Circuit breaker status
circuit_breaker_state
```

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check target status: http://localhost:9090/targets
2. Verify service is exposing `/metrics`:
   ```bash
   curl http://localhost:3001/metrics
   ```
3. Check Prometheus logs:
   ```bash
   docker-compose -f docker-compose.monitoring.yml logs prometheus
   ```

### Grafana Dashboard Not Loading Data

1. Verify Prometheus datasource configured correctly
2. Check time range (ensure data exists for selected range)
3. Test query in Prometheus UI first

### Alerts Not Firing

1. Check alert rules loaded:
   ```bash
   curl http://localhost:9090/api/v1/rules
   ```
2. Verify AlertManager is receiving alerts:
   ```bash
   curl http://localhost:9093/api/v1/alerts
   ```
3. Check AlertManager logs for routing issues

### High Memory Usage

1. Adjust Prometheus retention:
   ```yaml
   # In docker-compose.monitoring.yml
   command:
     - '--storage.tsdb.retention.time=15d'  # Reduce from 30d
   ```

2. Reduce scrape frequency for non-critical metrics

## Maintenance

### Backup Prometheus Data

```bash
docker run --rm -v applyforus-prometheus-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/prometheus-backup.tar.gz /data
```

### Backup Grafana Dashboards

```bash
docker run --rm -v applyforus-grafana-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/grafana-backup.tar.gz /data
```

### Update Dashboards

1. Edit JSON files in `dashboards/` directory
2. Dashboards will auto-reload (provisioning enabled)
3. Or import manually via Grafana UI

### Update Alert Rules

1. Edit `prometheus/alerts/service-alerts.yml`
2. Reload Prometheus:
   ```bash
   curl -X POST http://localhost:9090/-/reload
   ```

## Best Practices

1. **Set Appropriate Thresholds**: Tune based on actual baseline performance
2. **Use Labels Wisely**: Don't create high-cardinality labels
3. **Monitor the Monitors**: Set up alerts for Prometheus/Grafana itself
4. **Regular Reviews**: Weekly review of dashboards and alerts
5. **Document Runbooks**: Link alerts to resolution procedures
6. **Test Alerts**: Regularly test alert routing works correctly

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
