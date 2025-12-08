# Monitoring and Observability Setup

Comprehensive monitoring and observability solution for the Job-Apply-Platform using Azure Application Insights, OpenTelemetry, Prometheus, Grafana, and AlertManager.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Components](#components)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Accessing Dashboards](#accessing-dashboards)
- [Alert Configuration](#alert-configuration)
- [Troubleshooting](#troubleshooting)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Services Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │   User   │ │   Job    │ │   AI     │ ...       │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                   │
│       │ Metrics    │ Traces     │ Logs       │                  │
│       └────────────┴────────────┴────────────┘                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Prometheus  │   │     Azure    │   │     Loki     │
│   (Metrics)  │   │ App Insights │   │    (Logs)    │
│              │   │   (Traces)   │   │              │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Grafana    │
                   │ (Dashboards) │
                   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ AlertManager │
                   │   (Alerts)   │
                   └──────────────┘
```

## Components

### 1. Azure Application Insights
- **Purpose**: Cloud-native APM and distributed tracing
- **Features**:
  - Automatic dependency tracking
  - Application map visualization
  - Performance profiling
  - Advanced analytics with KQL

### 2. OpenTelemetry
- **Purpose**: Vendor-neutral instrumentation
- **Features**:
  - Automatic instrumentation for HTTP, database, cache
  - Context propagation across services
  - Custom spans and attributes
  - Multiple exporters (Azure, Jaeger, OTLP)

### 3. Prometheus
- **Purpose**: Time-series metrics collection
- **Features**:
  - Pull-based metrics scraping
  - Service discovery for Kubernetes
  - Recording rules for aggregations
  - Alert rule evaluation

### 4. Grafana
- **Purpose**: Visualization and dashboards
- **Features**:
  - Multiple data source support
  - Pre-built dashboards
  - Custom dashboard creation
  - Alert visualization

### 5. AlertManager
- **Purpose**: Alert routing and notification
- **Features**:
  - Alert grouping and deduplication
  - Multiple notification channels
  - Silencing and inhibition rules
  - Escalation policies

### 6. Loki (Optional)
- **Purpose**: Log aggregation
- **Features**:
  - Indexed metadata, not full-text
  - Native Grafana integration
  - LogQL query language
  - Cost-effective storage

## Quick Start

### Local Development with Docker Compose

1. **Start monitoring stack**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **Verify services are running**:
   ```bash
   docker-compose -f docker-compose.monitoring.yml ps
   ```

3. **Access dashboards**:
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - AlertManager: http://localhost:9093

### Kubernetes Deployment

1. **Deploy monitoring stack**:
   ```bash
   kubectl apply -f infrastructure/kubernetes/monitoring-stack.yaml
   ```

2. **Verify deployment**:
   ```bash
   kubectl get pods -n monitoring
   kubectl get services -n monitoring
   ```

3. **Access via port-forward** (for testing):
   ```bash
   # Grafana
   kubectl port-forward -n monitoring svc/grafana 3000:3000

   # Prometheus
   kubectl port-forward -n monitoring svc/prometheus 9090:9090
   ```

## Configuration

### Environment Variables

Add these to each service's `.env` file:

```env
# Azure Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=xxx;IngestionEndpoint=https://xxx.applicationinsights.azure.com/
APPLICATIONINSIGHTS_ENABLED=true

# OpenTelemetry
OTEL_SERVICE_NAME=your-service-name
OTEL_SERVICE_VERSION=1.0.0
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Prometheus
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
NODE_ENV=production
```

### Service Integration

#### NestJS Services

1. **Install telemetry package**:
   ```bash
   npm install @jobpilot/telemetry
   ```

2. **Update `main.ts`**:
   ```typescript
   import { initTelemetry } from '@jobpilot/telemetry';

   async function bootstrap() {
     await initTelemetry({
       serviceName: 'your-service',
       serviceVersion: '1.0.0',
       environment: process.env.NODE_ENV,
       azureMonitorConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
     });

     const { NestFactory } = await import('@nestjs/core');
     const { AppModule } = await import('./app.module');
     const app = await NestFactory.create(AppModule);
     await app.listen(3000);
   }
   bootstrap();
   ```

3. **Configure `app.module.ts`**:
   ```typescript
   import { TelemetryModule } from '@jobpilot/telemetry';

   @Module({
     imports: [
       TelemetryModule.forRoot({
         serviceName: 'your-service',
         enablePrometheus: true,
         prometheusPath: '/metrics',
       }),
     ],
   })
   export class AppModule {}
   ```

#### Python Services

1. **Install dependencies**:
   ```bash
   pip install azure-monitor-opentelemetry prometheus-client
   ```

2. **Configure in `main.py`**:
   ```python
   from azure.monitor.opentelemetry import configure_azure_monitor

   configure_azure_monitor(
       connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
   )
   ```

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed examples.

## Deployment

### Production Deployment Checklist

- [ ] Configure Azure Application Insights resource
- [ ] Set up persistent storage for Prometheus data
- [ ] Configure Grafana with proper authentication
- [ ] Set up alert notification channels
- [ ] Configure backup for Grafana dashboards
- [ ] Set appropriate resource limits
- [ ] Configure ingress/load balancers
- [ ] Set up SSL certificates
- [ ] Configure log retention policies
- [ ] Test alert delivery

### Kubernetes Deployment

1. **Create monitoring namespace**:
   ```bash
   kubectl create namespace monitoring
   ```

2. **Create secrets**:
   ```bash
   # Azure credentials
   kubectl create secret generic azure-credentials \
     --from-literal=subscription-id=$AZURE_SUBSCRIPTION_ID \
     --from-literal=tenant-id=$AZURE_TENANT_ID \
     --from-literal=client-secret=$AZURE_CLIENT_SECRET \
     -n monitoring

   # Grafana admin password
   kubectl create secret generic grafana-secrets \
     --from-literal=admin-password=$GRAFANA_ADMIN_PASSWORD \
     -n monitoring
   ```

3. **Deploy monitoring stack**:
   ```bash
   kubectl apply -f infrastructure/kubernetes/monitoring-stack.yaml
   ```

4. **Verify deployment**:
   ```bash
   kubectl get all -n monitoring
   ```

### Service Annotations for Prometheus

Add these annotations to your service deployments:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-service
spec:
  template:
    metadata:
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
```

## Accessing Dashboards

### Grafana

**URL**: https://grafana.your-domain.com or http://localhost:3001

**Default Credentials**: admin/admin (change immediately)

**Pre-built Dashboards**:
- **Platform Overview**: Overall system health and metrics
- **Service Details**: Per-service deep dive
- **Database Performance**: PostgreSQL metrics
- **Redis Performance**: Cache metrics
- **Business Metrics**: Application-specific KPIs
- **Infrastructure**: Node and container metrics

**Creating Custom Dashboards**:
1. Click "+" → "Dashboard"
2. Add panels with PromQL queries
3. Configure visualization type
4. Save dashboard

### Prometheus

**URL**: http://prometheus.your-domain.com or http://localhost:9090

**Useful Queries**:

```promql
# Request rate by service
sum(rate(http_requests_total[5m])) by (service)

# Error rate percentage
sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# P95 latency
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (service, le))

# Memory usage in GB
sum(process_resident_memory_bytes) by (service) / (1024*1024*1024)

# Database query duration
histogram_quantile(0.95, sum(rate(database_query_duration_seconds_bucket[5m])) by (operation, le))
```

### Azure Application Insights

**Access via Azure Portal**:
1. Navigate to your Application Insights resource
2. View Application Map for service dependencies
3. Use Transaction Search for distributed traces
4. Create custom queries with KQL

**Example KQL Queries**:

```kql
// Failed requests in last hour
requests
| where timestamp > ago(1h)
| where success == false
| summarize count() by name, resultCode

// Slow dependencies
dependencies
| where timestamp > ago(1h)
| where duration > 1000
| project name, duration, resultCode, operation_Name

// Custom events
customEvents
| where name == "JobApplicationSubmitted"
| summarize count() by tostring(customDimensions.status)
```

## Alert Configuration

### AlertManager Configuration

Edit `infrastructure/monitoring/alertmanager/alertmanager.yml`:

```yaml
receivers:
  - name: 'critical-alerts'
    email_configs:
      - to: 'oncall@your-domain.com'
    slack_configs:
      - channel: '#alerts-critical'
        webhook_url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
```

### Custom Alert Rules

Create alert rules in `infrastructure/monitoring/alerts/`:

```yaml
groups:
  - name: custom_alerts
    rules:
      - alert: HighJobApplicationFailureRate
        expr: |
          sum(rate(job_applications_total{status="failed"}[5m]))
          /
          sum(rate(job_applications_total[5m]))
          > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High job application failure rate"
          description: "Failure rate is {{ $value | humanizePercentage }}"
```

### Notification Channels

Supported channels:
- Email (SMTP)
- Slack
- Microsoft Teams
- PagerDuty
- Webhook (custom integrations)

## Monitoring Best Practices

### 1. Metrics

- **Use labels wisely**: High cardinality can impact performance
- **Set appropriate retention**: Balance storage costs and data needs
- **Create recording rules**: Pre-aggregate expensive queries
- **Monitor your monitoring**: Alert on Prometheus/Grafana health

### 2. Tracing

- **Sample appropriately**: 100% sampling in production is expensive
- **Add business context**: Include user IDs, tenant IDs, etc.
- **Use spans effectively**: One span per logical operation
- **Set span attributes**: Add metadata for debugging

### 3. Logging

- **Use structured logging**: JSON format for easy parsing
- **Include correlation IDs**: Link logs to traces
- **Set appropriate log levels**: Don't log everything in production
- **Avoid logging sensitive data**: PII, passwords, tokens

### 4. Alerts

- **Alert on symptoms, not causes**: Focus on user impact
- **Avoid alert fatigue**: Set appropriate thresholds
- **Include runbooks**: Help on-call engineers respond
- **Test alerts**: Verify notification delivery

## Troubleshooting

### Services Not Showing in Prometheus

1. **Check service annotations**:
   ```bash
   kubectl describe pod <pod-name> -n job-apply-platform
   ```

2. **Verify metrics endpoint**:
   ```bash
   kubectl port-forward <pod-name> 3000:3000
   curl http://localhost:3000/metrics
   ```

3. **Check Prometheus targets**:
   Visit http://prometheus/targets and look for errors

### Traces Not Appearing in Azure

1. **Verify connection string**:
   ```bash
   echo $APPLICATIONINSIGHTS_CONNECTION_STRING
   ```

2. **Check telemetry initialization**:
   - Ensure `initTelemetry()` is called first in main.ts
   - Check console for initialization logs

3. **Verify network connectivity**:
   ```bash
   curl https://your-region.applicationinsights.azure.com/v2/track
   ```

### High Memory Usage in Prometheus

1. **Reduce retention period**:
   ```yaml
   --storage.tsdb.retention.time=15d
   ```

2. **Implement recording rules**: Pre-aggregate expensive queries

3. **Reduce scrape frequency**: Increase scrape_interval

### Grafana Dashboard Not Loading

1. **Check datasource connection**:
   - Go to Configuration → Data Sources
   - Test connection to Prometheus

2. **Verify query syntax**: Check for PromQL errors

3. **Check time range**: Ensure data exists for selected time period

## Maintenance

### Backup Grafana Dashboards

```bash
# Export all dashboards
kubectl exec -n monitoring grafana-xxx -- \
  grafana-cli admin export > dashboards-backup.json
```

### Prometheus Data Backup

```bash
# Create snapshot
kubectl exec -n monitoring prometheus-xxx -- \
  promtool tsdb create-blocks-from snapshot /prometheus
```

### Updating Alert Rules

1. Edit alert rules in `infrastructure/monitoring/alerts/`
2. Reload Prometheus configuration:
   ```bash
   curl -X POST http://prometheus:9090/-/reload
   ```

## Resources

- [Integration Guide](./INTEGRATION_GUIDE.md) - Detailed service integration
- [Alert Rules](../../infrastructure/monitoring/alerts/) - Pre-configured alerts
- [Dashboards](../../infrastructure/monitoring/dashboards/) - Grafana dashboards
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Azure Application Insights](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

## Support

For issues or questions:
1. Check existing documentation
2. Search closed issues in repository
3. Create new issue with monitoring label
4. Contact platform team in #platform-support
