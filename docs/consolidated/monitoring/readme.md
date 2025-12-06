# JobPilot AI Platform - Monitoring & Logging Infrastructure

This directory contains the complete monitoring, logging, and alerting infrastructure for the JobPilot AI Platform.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Dashboards](#dashboards)
- [Alerting](#alerting)
- [Custom Metrics](#custom-metrics)
- [Troubleshooting](#troubleshooting)

## Overview

The JobPilot monitoring stack provides:

- **Centralized Logging** with correlation IDs for request tracing
- **Metrics Collection** via Prometheus
- **Visualization** through Grafana dashboards
- **Alerting** for critical issues
- **Health Checks** for all microservices
- **Infrastructure Monitoring** for system resources

## Components

### 1. Prometheus (Port 9090)
- Metrics collection and storage
- 30-day retention period
- Scrapes all services every 15 seconds
- Evaluates alerting rules

### 2. Grafana (Port 3001)
- Visualization platform
- Pre-configured dashboards
- Default credentials: admin/admin (change on first login)

### 3. AlertManager (Port 9093)
- Alert aggregation and routing
- Email and Slack notifications
- Alert inhibition rules

### 4. Exporters
- **Node Exporter** (9100) - System metrics
- **cAdvisor** (8080) - Container metrics
- **Redis Exporter** (9121) - Redis metrics
- **PostgreSQL Exporter** (9187) - Database metrics

## Quick Start

### 1. Environment Setup

Copy the environment template:

```bash
cp .env.monitoring.example .env.monitoring
```

Edit `.env.monitoring` and configure:
- Grafana admin credentials
- SMTP settings for email alerts
- Slack webhook URL (optional)
- Database credentials

### 2. Start the Monitoring Stack

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Access the Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **AlertManager**: http://localhost:9093
- **cAdvisor**: http://localhost:8080

### 4. Import Dashboards

Dashboards are automatically provisioned from `infrastructure/monitoring/dashboards/`:

- **Service Overview** - Request rates, error rates, latency
- **Infrastructure Metrics** - CPU, memory, disk, network

## Configuration

### Prometheus Configuration

Located in `infrastructure/monitoring/prometheus/prometheus.yml`

**Scrape Targets:**
- All microservices (auth, user, job, resume, etc.)
- Infrastructure exporters
- Custom application metrics

**Global Settings:**
```yaml
scrape_interval: 15s
evaluation_interval: 15s
scrape_timeout: 10s
```

### Grafana Provisioning

**Datasources:** `infrastructure/monitoring/grafana/provisioning/datasources/`
- Prometheus datasource configured automatically

**Dashboards:** `infrastructure/monitoring/grafana/provisioning/dashboards/`
- Dashboard provisioning from JSON files

### AlertManager Configuration

Located in `infrastructure/monitoring/alertmanager/alertmanager.yml`

**Alert Routing:**
- Critical alerts → Email + Slack + PagerDuty
- Warning alerts → Email + Slack
- Info alerts → Slack only

**Grouping:**
- Alerts grouped by: alertname, cluster, service
- Group wait: 30s (10s for critical)
- Repeat interval: 4h (1h for critical)

## Dashboards

### Service Overview Dashboard

**Panels:**
1. Request Rate by Service
2. Error Rate by Service (Gauge)
3. Request Latency (p50, p95, p99)
4. Queue Sizes
5. Service Health Status

**Use Cases:**
- Monitor service performance
- Identify high-error services
- Track latency trends
- Monitor queue backlogs

### Infrastructure Metrics Dashboard

**Panels:**
1. CPU Usage
2. Memory Usage
3. Disk Usage
4. Network I/O
5. Container Memory Usage
6. Container CPU Usage

**Use Cases:**
- Monitor resource utilization
- Identify resource bottlenecks
- Plan capacity
- Debug performance issues

## Alerting

### Alert Severity Levels

1. **Critical** - Immediate action required
2. **Warning** - Attention needed soon
3. **Info** - Informational only

### Service Alerts

Located in `infrastructure/monitoring/alerts/service-alerts.yml`

**Key Alerts:**

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| ServiceDown | up == 0 | 1m | critical |
| HighErrorRate | > 5% | 5m | warning |
| CriticalErrorRate | > 10% | 2m | critical |
| HighLatencyP99 | > 2s | 5m | warning |
| VeryHighLatencyP99 | > 5s | 2m | critical |
| QueueSizeTooLarge | > 1000 jobs | 10m | warning |
| DatabasePoolExhaustion | > 90% | 5m | critical |

### Infrastructure Alerts

Located in `infrastructure/monitoring/alerts/infrastructure-alerts.yml`

**Key Alerts:**

| Alert | Threshold | Duration | Severity |
|-------|-----------|----------|----------|
| HighCPUUsage | > 80% | 10m | warning |
| CriticalCPUUsage | > 95% | 5m | critical |
| HighMemoryUsage | > 80% | 10m | warning |
| CriticalMemoryUsage | > 95% | 5m | critical |
| LowDiskSpace | > 75% | 15m | warning |
| CriticalDiskSpace | > 90% | 5m | critical |
| RedisDown | up == 0 | 1m | critical |
| PostgreSQLDown | up == 0 | 1m | critical |

### Alert Notification Channels

Configure in `.env.monitoring`:

**Email:**
```bash
SMTP_HOST=smtp.gmail.com:587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Slack:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Custom Metrics

### Using the Shared Package

Install the shared monitoring package in your service:

```bash
npm install @jobpilot/shared
```

### Logger Usage

```typescript
import { Logger, createLoggerInstance } from '@jobpilot/shared';

const logger = createLoggerInstance({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV || 'development',
  logLevel: 'info',
  usePino: false, // Use Winston (or true for Pino)
});

// Set correlation context
logger.setContext({
  correlationId: req.headers['x-correlation-id'],
  userId: req.user?.id,
});

// Log with automatic context enrichment
logger.info('User logged in', { userId: user.id });
logger.error('Failed to process request', error, { orderId: 123 });
```

### Metrics Usage

```typescript
import { PrometheusMetrics, createPrometheusMetrics } from '@jobpilot/shared';

const metrics = createPrometheusMetrics({
  serviceName: 'my-service',
  environment: process.env.NODE_ENV || 'development',
  enableDefaultMetrics: true,
});

// Use middleware for automatic HTTP metrics
app.use(metrics.middleware());

// Track custom operations
const start = Date.now();
try {
  await processOrder(orderId);
  metrics.trackOperation('process_order', 'business', Date.now() - start, true);
} catch (error) {
  metrics.trackOperation('process_order', 'business', Date.now() - start, false, 'validation_error');
}

// Track queue metrics
metrics.updateQueueSize('email-queue', 'waiting', 150);
metrics.trackQueueJob('email-queue', 'send-welcome', 500, true);

// Track cache metrics
metrics.recordCacheHit('user-cache', 'profile');
metrics.recordCacheMiss('user-cache', 'settings');
```

### Health Checks

```typescript
import { HealthService, HealthController } from '@jobpilot/shared';

// Configure health checks
const healthService = new HealthService(
  terminusHealth,
  logger,
  {
    serviceName: 'my-service',
    version: '1.0.0',
    dependencies: {
      database: true,
      redis: true,
      externalServices: [
        { name: 'auth-service', url: 'http://auth-service:3000/health' },
      ],
    },
  }
);

// Endpoints automatically created:
// GET /health - Basic health
// GET /health/live - Liveness probe
// GET /health/ready - Readiness probe
```

### Exposing Metrics Endpoint

Add to your NestJS service:

```typescript
import { MetricsController } from '@jobpilot/shared';

@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: PrometheusMetrics,
      useFactory: () => createPrometheusMetrics({
        serviceName: 'my-service',
        environment: process.env.NODE_ENV,
      }),
    },
  ],
})
export class AppModule {}
```

This exposes:
- `GET /metrics` - Prometheus format
- `GET /metrics/json` - JSON format

## Logging Best Practices

### 1. Always Use Correlation IDs

```typescript
// In middleware
logger.setContext({
  correlationId: req.headers['x-correlation-id'] || uuidv4(),
  requestId: uuidv4(),
  userId: req.user?.id,
});
```

### 2. Log Levels

- **error** - Errors that need immediate attention
- **warn** - Potential issues that should be investigated
- **info** - Important business events
- **debug** - Detailed diagnostic information
- **http** - HTTP request/response logs

### 3. Structured Logging

```typescript
// Good
logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  items: order.items.length,
});

// Bad
logger.info(`Order ${order.id} created by user ${user.id} for $${order.total}`);
```

### 4. Error Logging

```typescript
try {
  await processPayment(orderId);
} catch (error) {
  logger.error('Payment processing failed', error, {
    orderId,
    userId: user.id,
    paymentMethod: payment.method,
  });
  throw error;
}
```

## Troubleshooting

### Prometheus Not Scraping Targets

1. Check service is running: `docker ps`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify network connectivity: `docker network ls`
4. Check service exposes `/metrics` endpoint

### Grafana Dashboard Not Loading Data

1. Verify Prometheus datasource: Grafana → Configuration → Data Sources
2. Test connection to Prometheus
3. Check time range in dashboard
4. Verify metrics exist in Prometheus: http://localhost:9090/graph

### Alerts Not Firing

1. Check alert rules: http://localhost:9090/alerts
2. Verify AlertManager config: http://localhost:9093
3. Check AlertManager logs: `docker logs jobpilot-alertmanager`
4. Verify notification channels (email, Slack) are configured

### High Memory Usage

1. Reduce Prometheus retention: Edit `prometheus.yml`
2. Adjust scrape intervals for less critical services
3. Scale container resources in `docker-compose.monitoring.yml`

### Missing Metrics

1. Verify service is instrumented with metrics
2. Check service logs for errors
3. Verify metric names match Prometheus queries
4. Check if metric labels are correct

## Maintenance

### Backing Up Dashboards

Export dashboards from Grafana UI or backup the volume:

```bash
docker cp jobpilot-grafana:/var/lib/grafana ./grafana-backup
```

### Updating Alert Rules

1. Edit files in `infrastructure/monitoring/alerts/`
2. Reload Prometheus configuration:

```bash
curl -X POST http://localhost:9090/-/reload
```

Or restart Prometheus:

```bash
docker-compose -f docker-compose.monitoring.yml restart prometheus
```

### Cleaning Up Old Metrics

Prometheus automatically retains data for 30 days. To change:

Edit `docker-compose.monitoring.yml`:
```yaml
command:
  - '--storage.tsdb.retention.time=15d'  # Change to 15 days
```

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [AlertManager Configuration](https://prometheus.io/docs/alerting/latest/configuration/)

## Support

For issues or questions:
- Create an issue in the repository
- Contact the DevOps team
- Check the runbook: https://docs.jobpilot.ai/runbooks/
