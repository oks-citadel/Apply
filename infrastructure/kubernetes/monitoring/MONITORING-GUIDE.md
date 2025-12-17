# ApplyForUs Platform Monitoring and Observability Guide

This guide covers the monitoring and observability setup for the ApplyForUs platform.

## Overview

The monitoring stack includes:

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notification
- **OpenTelemetry**: Distributed tracing
- **Azure Application Insights**: Cloud-native APM (optional)

## Architecture

```
                                    +------------------+
                                    |    Grafana       |
                                    |   (Dashboards)   |
                                    +--------+---------+
                                             |
                                             v
+------------------+              +------------------+              +------------------+
|    Services      |  /metrics   |    Prometheus    |   alerts     |  Alertmanager    |
| (auth, job, etc) +------------->   (Collection)   +------------->  (Routing)        |
+------------------+              +--------+---------+              +--------+---------+
        |                                                                    |
        | traces                                                             | notifications
        v                                                                    v
+------------------+                                                +------------------+
| Azure App        |                                                | Slack/PagerDuty  |
| Insights         |                                                | Email            |
+------------------+                                                +------------------+
```

## Deployment

### Prerequisites

1. Kubernetes cluster with kubectl configured
2. Storage class `managed-premium` available (for Azure AKS)
3. Network access between monitoring and applyforus namespaces

### Deploy Monitoring Stack

```bash
# Deploy all monitoring components
cd infrastructure/kubernetes/monitoring
chmod +x deploy-monitoring.sh
./deploy-monitoring.sh
```

Or manually:

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Deploy Prometheus
kubectl apply -f prometheus-configmap.yaml
kubectl apply -f prometheus-rules.yaml
kubectl apply -f prometheus-deployment.yaml

# Deploy Alertmanager
kubectl apply -f alertmanager-deployment.yaml

# Deploy Grafana
kubectl apply -f grafana-dashboards.yaml
kubectl apply -f grafana-deployment.yaml
```

### Access Services Locally

```bash
# Prometheus
kubectl port-forward -n monitoring svc/prometheus 9090:9090

# Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Alertmanager
kubectl port-forward -n monitoring svc/alertmanager 9093:9093
```

## Service Integration

### 1. Add Prometheus Annotations

Each service deployment should have Prometheus scrape annotations:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "8001"
    prometheus.io/path: "/metrics"
```

### 2. Integrate TelemetryModule

In your NestJS service's `app.module.ts`:

```typescript
import { TelemetryModule } from '@applyforus/telemetry';

@Module({
  imports: [
    TelemetryModule.forRoot({
      serviceName: 'your-service-name',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      enablePrometheus: true,
      enableDefaultMetrics: true,
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Initialize Telemetry in main.ts

```typescript
import { initTelemetry } from '@applyforus/telemetry';

async function bootstrap() {
  // Initialize BEFORE importing other modules
  await initTelemetry({
    serviceName: 'your-service-name',
    serviceVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  });

  // Then import and start your application
  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module');
  // ...
}
```

### 4. Add Health Checks

```typescript
import { HealthCheckService, createDatabaseCheck, createRedisCheck } from '@applyforus/telemetry';

@Injectable()
export class AppHealthService implements OnModuleInit {
  constructor(
    private healthCheckService: HealthCheckService,
    private dataSource: DataSource,
    private redisClient: Redis,
  ) {}

  onModuleInit() {
    this.healthCheckService.registerCheck(
      createDatabaseCheck('postgresql', () => this.dataSource.query('SELECT 1'))
    );
    this.healthCheckService.registerCheck(
      createRedisCheck('redis', () => this.redisClient)
    );
  }
}
```

### 5. Use Metrics Decorators

```typescript
import { Trace, TraceDatabase, TraceHttp } from '@applyforus/telemetry';

@Injectable()
export class UserService {
  @Trace({ name: 'user.create' })
  async createUser(data: CreateUserDto) {
    // Automatically traced
  }

  @TraceDatabase('SELECT', 'users')
  async findUser(id: string) {
    // Traced as database operation
  }
}
```

### 6. Use Business Metrics

```typescript
import { PrometheusMetricsService } from '@applyforus/telemetry';

@Injectable()
export class JobApplicationService {
  constructor(private metricsService: PrometheusMetricsService) {}

  async applyForJob(jobId: string, userId: string) {
    try {
      // Application logic
      this.metricsService.incrementJobApplications('success');
    } catch (error) {
      this.metricsService.incrementJobApplications('failed');
      throw error;
    }
  }
}
```

## Available Metrics

### HTTP Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_request_duration_seconds` | Histogram | Request latency |
| `http_requests_total` | Counter | Total requests |
| `http_requests_in_flight` | Gauge | Active requests |
| `http_request_size_bytes` | Histogram | Request body size |
| `http_response_size_bytes` | Histogram | Response body size |

### Business Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `job_applications_total` | Counter | Job applications count |
| `resume_generation_total` | Counter | Resume generations |
| `ai_service_rate_limited_total` | Counter | AI rate limit events |
| `payment_transactions_total` | Counter | Payment transactions |
| `user_active_total` | Gauge | Active users |
| `api_quota_exhausted_total` | Counter | API quota exhaustions |

### Database Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `db_connection_pool_size` | Gauge | Pool size |
| `db_connection_pool_used` | Gauge | Used connections |
| `db_query_duration_seconds` | Histogram | Query latency |
| `db_queries_total` | Counter | Total queries |

### Queue Metrics (Bull)

| Metric | Type | Description |
|--------|------|-------------|
| `bull_queue_waiting` | Gauge | Jobs waiting |
| `bull_queue_active` | Gauge | Jobs processing |
| `bull_queue_completed_total` | Counter | Completed jobs |
| `bull_queue_failed_total` | Counter | Failed jobs |

### Cache Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `cache_hits_total` | Counter | Cache hits |
| `cache_misses_total` | Counter | Cache misses |

## Alert Rules

### Severity Levels

- **Critical**: Immediate action required (pages on-call)
- **Warning**: Needs attention within business hours
- **Info**: For awareness, no action required

### Key Alerts

| Alert | Severity | Description |
|-------|----------|-------------|
| `ServiceDown` | Critical | Service not responding |
| `HighErrorRate` | Critical | Error rate > 5% |
| `HighLatencyP99` | Warning | P99 latency > 2s |
| `HighCPUUsage` | Warning | CPU > 90% |
| `HighMemoryUsage` | Warning | Memory > 90% |
| `DBConnectionPoolExhausted` | Critical | DB pool > 90% used |
| `SLABreachAvailability` | Critical | Availability < 99.9% |
| `PaymentFailures` | Critical | Payment processing errors |

## Grafana Dashboards

### Pre-configured Dashboards

1. **ApplyForUs Platform Overview**
   - Platform availability
   - Request rate
   - Error rate
   - P95 latency
   - Business metrics

2. **ApplyForUs Service Details**
   - Per-service metrics
   - Latency percentiles
   - Memory usage
   - Error rates by service

### Creating Custom Dashboards

1. Access Grafana at http://localhost:3000
2. Login with admin credentials
3. Create > Dashboard
4. Add panels using Prometheus datasource

## Structured Logging

### Log Format

All logs are JSON formatted with correlation:

```json
{
  "level": "INFO",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "auth-service",
  "traceId": "abc123",
  "spanId": "def456",
  "correlationId": "req-789",
  "message": "User authenticated successfully",
  "userId": "user-123"
}
```

### Using StructuredLogger

```typescript
import { StructuredLogger } from '@applyforus/telemetry';

@Injectable()
export class UserService {
  constructor(private logger: StructuredLogger) {}

  async createUser(data: CreateUserDto) {
    this.logger.info('Creating user', { email: data.email });
    // ...
    this.logger.info('User created', { userId: user.id });
  }
}
```

## Distributed Tracing

### W3C Trace Context

Traces propagate automatically using W3C Trace Context headers:
- `traceparent`
- `tracestate`

### Azure Application Insights

For Azure deployments, traces are exported to Application Insights:

1. Set `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable
2. Telemetry is automatically sent to Azure Monitor
3. View traces in Azure Portal > Application Insights > Transaction Search

## Troubleshooting

### Common Issues

1. **Metrics not appearing in Prometheus**
   - Check pod annotations
   - Verify service is exposing /metrics endpoint
   - Check Prometheus targets: http://prometheus:9090/targets

2. **Alerts not firing**
   - Check alert rules in Prometheus: http://prometheus:9090/alerts
   - Verify Alertmanager configuration
   - Check Alertmanager status: http://alertmanager:9093

3. **Traces not appearing in Application Insights**
   - Verify connection string is set
   - Check telemetry initialization in main.ts
   - Look for telemetry initialization logs

### Useful Commands

```bash
# Check Prometheus targets
kubectl exec -n monitoring deploy/prometheus -- wget -qO- localhost:9090/api/v1/targets

# Check Alertmanager status
kubectl exec -n monitoring deploy/alertmanager -- wget -qO- localhost:9093/api/v1/status

# View service logs
kubectl logs -n applyforus -l app=auth-service -f

# Check metrics endpoint directly
kubectl exec -n applyforus deploy/auth-service -- wget -qO- localhost:8001/metrics
```

## Production Checklist

- [ ] Update Grafana admin password
- [ ] Configure Alertmanager secrets (Slack, PagerDuty)
- [ ] Set up ingress for Grafana (with authentication)
- [ ] Configure Azure Application Insights connection string
- [ ] Review and customize alert thresholds
- [ ] Set up alert notification channels
- [ ] Configure retention policies for Prometheus
- [ ] Set up backup for Grafana dashboards
