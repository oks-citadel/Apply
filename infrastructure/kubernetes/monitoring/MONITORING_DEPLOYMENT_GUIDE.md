# JobPilot Monitoring Stack - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying and configuring the complete monitoring stack for the JobPilot AI Platform.

### Stack Components

- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation
- **Promtail**: Log shipping agent
- **AlertManager**: Alert routing and notification

## Prerequisites

### Required Tools
- kubectl (v1.24+)
- Helm (v3.0+) - optional
- Access to Kubernetes cluster
- Appropriate RBAC permissions

### Required Resources
```yaml
Minimum Cluster Requirements:
- Nodes: 3+
- Total CPU: 8 cores
- Total Memory: 16GB
- Storage: 200GB+ (for metrics and logs)
```

### Required Secrets
Before deployment, prepare the following:
- SendGrid API key (for email alerts)
- Slack webhook URL (for Slack notifications)
- PagerDuty integration key (for on-call alerts)

## Quick Start

### 1. Create Namespace
```bash
kubectl create namespace jobpilot
```

### 2. Create Secrets
```bash
# Copy the example secrets file
cp secrets.env.example secrets.env

# Edit with your actual values
nano secrets.env

# Create the secret
kubectl create secret generic monitoring-secrets \
  --from-env-file=secrets.env \
  -n jobpilot
```

Example `secrets.env`:
```bash
SENDGRID_API_KEY=SG.your_actual_key_here
SLACK_API_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_INTEGRATION_KEY=your_pagerduty_key_here
```

### 3. Deploy Monitoring Stack
```bash
# Deploy using kustomize
kubectl apply -k .

# Or deploy individual components
kubectl apply -f prometheus.yaml
kubectl apply -f prometheus-rules.yaml
kubectl apply -f alertmanager-config.yaml
kubectl apply -f alertmanager-deployment.yaml
kubectl apply -f grafana.yaml
kubectl apply -f loki.yaml
```

### 4. Verify Deployment
```bash
# Check all pods are running
kubectl get pods -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# Check services
kubectl get svc -n jobpilot | grep -E 'prometheus|grafana|alertmanager|loki'
```

Expected output:
```
NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
prometheus      ClusterIP   10.0.45.123     <none>        9090/TCP   5m
grafana         ClusterIP   10.0.45.124     <none>        3000/TCP   5m
alertmanager    ClusterIP   10.0.45.125     <none>        9093/TCP   5m
loki            ClusterIP   10.0.45.126     <none>        3100/TCP   5m
```

## Detailed Configuration

### Prometheus Configuration

#### Scrape Configurations
Prometheus is configured to scrape metrics from:
- Kubernetes API server
- Kubernetes nodes
- All pods with annotation `prometheus.io/scrape: "true"`
- All services with annotation `prometheus.io/scrape: "true"`

#### Adding Custom Scrape Targets
Edit `prometheus.yaml` ConfigMap:
```yaml
scrape_configs:
- job_name: 'my-custom-service'
  static_configs:
  - targets: ['my-service:9090']
    labels:
      service: 'my-custom-service'
```

#### Retention Configuration
Default retention: 30 days
To change:
```bash
kubectl edit deployment prometheus -n jobpilot
# Add to args: --storage.tsdb.retention.time=60d
```

### Grafana Configuration

#### Access Grafana
```bash
# Port forward to access locally
kubectl port-forward svc/grafana -n jobpilot 3000:3000

# Visit http://localhost:3000
# Default credentials: admin / changeme-in-production
```

#### Change Admin Password
```bash
# Update the secret
kubectl edit secret grafana-credentials -n jobpilot

# Or recreate
kubectl delete secret grafana-credentials -n jobpilot
kubectl create secret generic grafana-credentials \
  --from-literal=admin-user=admin \
  --from-literal=admin-password=your-strong-password \
  -n jobpilot

# Restart Grafana
kubectl rollout restart deployment/grafana -n jobpilot
```

#### Import Dashboards
Dashboards are automatically loaded from the `dashboards/` directory.

Available dashboards:
1. **Service Health Overview** - Overall platform health
2. **Database & Cache Metrics** - PostgreSQL and Redis metrics
3. **Queue Metrics** - RabbitMQ and Bull queue metrics

To add custom dashboards:
1. Create JSON file in `dashboards/` directory
2. Create ConfigMap: `kubectl create configmap dashboard-<name> --from-file=<file>.json -n jobpilot`
3. Restart Grafana

### AlertManager Configuration

#### Alert Routing
Alerts are routed based on severity and category:

- **Critical alerts** → PagerDuty, Slack, Email
- **Warning alerts** → Slack, Email
- **Database alerts** → Database team Slack channel
- **Business alerts** → Product team

#### Customize Alert Routes
Edit `alertmanager-config.yaml`:
```yaml
routes:
- match:
    severity: critical
    team: your-team
  receiver: 'your-team-pagerduty'
```

#### Silence Alerts
```bash
# Access AlertManager UI
kubectl port-forward svc/alertmanager -n jobpilot 9093:9093

# Visit http://localhost:9093
# Navigate to Silences → Create Silence
```

### Loki Configuration

#### Log Retention
Default retention: 14 days

To change:
```bash
kubectl edit configmap loki-config -n jobpilot
# Update: retention_period: 336h  # hours
```

#### Query Logs
Access Grafana → Explore → Select Loki datasource

Example queries:
```logql
# All errors in last hour
{namespace="jobpilot"} |= "error"

# Errors by service
{namespace="jobpilot", service="auth-service"} |= "error"

# Structured log query
{namespace="jobpilot"} | json | level="error"
```

## Service Instrumentation

### NestJS Services

#### 1. Add Telemetry Package
```bash
cd services/<your-service>
npm install @jobpilot/telemetry prom-client
```

#### 2. Configure in AppModule
```typescript
import { TelemetryModule, PrometheusInterceptor } from '@jobpilot/telemetry';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    TelemetryModule.forRoot({
      serviceName: 'your-service-name',
      serviceVersion: '1.0.0',
      environment: process.env.NODE_ENV,
      enablePrometheus: true,
      enableDefaultMetrics: true,
    }),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
})
export class AppModule {}
```

#### 3. Add Annotations to Deployment
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

#### 4. Use Custom Metrics
```typescript
import { PrometheusMetricsService } from '@jobpilot/telemetry';

@Injectable()
export class YourService {
  constructor(
    private readonly metrics: PrometheusMetricsService,
  ) {}

  async processJob() {
    const startTime = Date.now();
    try {
      // Your business logic
      this.metrics.incrementJobApplications('success');
    } catch (error) {
      this.metrics.incrementJobApplications('failed');
      throw error;
    } finally {
      const duration = (Date.now() - startTime) / 1000;
      this.metrics.observeJobSearchDuration(duration);
    }
  }
}
```

### Python AI Service

#### 1. Add Prometheus Client
```bash
cd services/ai-service
pip install prometheus-client
```

#### 2. Add Middleware
```python
# In main.py
from middleware.prometheus_middleware import PrometheusMiddleware

app = FastAPI()
app.add_middleware(PrometheusMiddleware)
```

#### 3. Add Metrics Endpoint
```python
from middleware.prometheus_middleware import get_metrics, get_metrics_content_type
from fastapi.responses import Response

@app.get("/metrics")
async def metrics():
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type(),
    )
```

#### 4. Use Decorators
```python
from middleware.prometheus_middleware import track_inference, track_vector_search

@track_inference(model_name="gpt-4", model_type="openai")
async def generate_resume(data):
    # Your AI logic
    return result

@track_vector_search(index_name="jobs")
async def search_jobs(query):
    # Vector search logic
    return results
```

## Monitoring Best Practices

### 1. Alert Fatigue Prevention
- Set appropriate thresholds
- Use inhibition rules
- Implement proper grouping
- Regular review of alert usefulness

### 2. Dashboard Organization
- Create role-specific dashboards
- Use consistent naming conventions
- Add documentation to panels
- Include relevant links

### 3. Log Management
- Structure your logs (JSON format)
- Include correlation IDs
- Add appropriate labels
- Set retention policies

### 4. Metrics Naming
Follow Prometheus naming conventions:
- Use snake_case
- Include unit suffix (_seconds, _bytes, _total)
- Use consistent labels

Example:
```
http_request_duration_seconds{method="GET", endpoint="/api/users", status="200"}
```

## Troubleshooting

### Prometheus Not Scraping Targets

**Problem**: Targets show as "DOWN" in Prometheus
```bash
# Check service annotations
kubectl get svc <service-name> -n jobpilot -o yaml | grep prometheus

# Verify metrics endpoint
kubectl port-forward svc/<service-name> -n jobpilot 3000:3000
curl http://localhost:3000/metrics

# Check Prometheus logs
kubectl logs deployment/prometheus -n jobpilot
```

### Grafana Dashboards Not Loading

**Problem**: Dashboards show "No data"
```bash
# Check Prometheus datasource
kubectl port-forward svc/grafana -n jobpilot 3000:3000
# Visit: Configuration → Data Sources → Prometheus
# Click "Test" button

# Verify Prometheus is collecting metrics
kubectl port-forward svc/prometheus -n jobpilot 9090:9090
# Visit: http://localhost:9090/targets
```

### High Memory Usage

**Problem**: Prometheus/Loki using too much memory
```bash
# Check resource usage
kubectl top pod -n jobpilot | grep -E 'prometheus|loki'

# Reduce retention period
kubectl edit configmap prometheus-config -n jobpilot
# Update: --storage.tsdb.retention.time=15d

# Increase resource limits
kubectl set resources deployment/prometheus \
  --limits=memory=4Gi \
  -n jobpilot
```

### Alerts Not Firing

**Problem**: Expected alerts not appearing
```bash
# Check AlertManager status
kubectl port-forward svc/alertmanager -n jobpilot 9093:9093
# Visit: http://localhost:9093

# Check Prometheus rules
kubectl logs deployment/prometheus -n jobpilot | grep "rule"

# Verify alert rules loaded
kubectl port-forward svc/prometheus -n jobpilot 9090:9090
# Visit: http://localhost:9090/rules
```

## Scaling

### Horizontal Scaling

#### Prometheus (Federation)
For large-scale deployments, implement Prometheus federation:
```yaml
# Create shard Prometheus instances
# Configure central Prometheus to federate from shards
```

#### Grafana
```bash
# Scale Grafana horizontally
kubectl scale deployment/grafana --replicas=3 -n jobpilot
```

#### Loki
Use Loki in microservices mode for scale:
```yaml
# Deploy separate components:
# - loki-distributor
# - loki-ingester
# - loki-querier
```

### Vertical Scaling

```bash
# Increase Prometheus resources
kubectl set resources deployment/prometheus \
  --requests=cpu=2000m,memory=4Gi \
  --limits=cpu=4000m,memory=8Gi \
  -n jobpilot
```

## Backup and Recovery

### Prometheus Backup
```bash
# Create snapshot
kubectl exec -it prometheus-0 -n jobpilot -- \
  promtool tsdb create-blocks-from backup /prometheus

# Copy to external storage
kubectl cp prometheus-0:/prometheus/backup ./prometheus-backup -n jobpilot
```

### Grafana Backup
```bash
# Export dashboards
kubectl port-forward svc/grafana -n jobpilot 3000:3000

# Use Grafana API to export all dashboards
# Script available in: scripts/backup-grafana.sh
```

### Restore
```bash
# Restore Prometheus data
kubectl cp ./prometheus-backup prometheus-0:/prometheus/ -n jobpilot

# Import Grafana dashboards
# Use Grafana UI or API
```

## Maintenance

### Regular Tasks

#### Weekly
- Review alert effectiveness
- Check disk usage
- Verify backup completion

#### Monthly
- Update dashboards
- Review retention policies
- Audit alert rules
- Update runbooks

#### Quarterly
- Upgrade monitoring stack
- Capacity planning review
- Security audit

### Upgrades

```bash
# Update image versions in kustomization.yaml
nano kustomization.yaml

# Apply updates
kubectl apply -k .

# Verify rollout
kubectl rollout status deployment/prometheus -n jobpilot
kubectl rollout status deployment/grafana -n jobpilot
```

## Security

### Network Policies
```yaml
# Restrict access to monitoring services
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: monitoring-network-policy
  namespace: jobpilot
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/part-of: jobpilot-monitoring
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: jobpilot
```

### RBAC
Already configured in deployment files. Review permissions:
```bash
kubectl get clusterrole prometheus -o yaml
kubectl get clusterrolebinding prometheus -o yaml
```

### TLS/HTTPS
For production, enable TLS:
```yaml
# Update Grafana ingress
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - grafana.jobpilot.com
    secretName: grafana-tls
```

## Support

### Getting Help
- Slack: #platform-monitoring
- Email: platform-team@jobpilot.com
- Runbooks: /runbooks/

### Useful Links
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)

## Appendix

### Available Metrics

#### HTTP Metrics
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `http_requests_in_flight` - Current requests

#### Business Metrics
- `job_applications_total` - Job applications
- `resume_generation_total` - Resume generations
- `ai_service_rate_limited_total` - AI rate limits

#### Database Metrics
- `db_connection_pool_size` - Pool size
- `db_connection_pool_used` - Connections in use
- `db_query_duration_seconds` - Query latency

#### Queue Metrics
- `bull_queue_waiting` - Jobs waiting
- `bull_queue_active` - Jobs processing
- `bull_queue_completed_total` - Completed jobs

### Available Dashboards
1. Service Health Overview
2. Database & Cache Metrics
3. Queue Metrics
4. (Add custom dashboards as needed)

### Available Alerts
See `prometheus-rules.yaml` for complete list of alerts.

Key alerts:
- ServiceDown
- HighErrorRate
- HighLatency
- PostgresDown
- RedisDown
- RabbitMQHighQueue
