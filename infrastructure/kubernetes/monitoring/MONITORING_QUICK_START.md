# Monitoring Stack - Quick Start Guide

Get the JobPilot monitoring stack up and running in 10 minutes!

## Prerequisites

- kubectl configured
- Access to JobPilot Kubernetes cluster
- Namespace `jobpilot` created

## Step 1: Deploy Monitoring Stack (2 minutes)

```bash
# Navigate to monitoring directory
cd infrastructure/kubernetes/monitoring

# Create secrets
cp secrets.env.example secrets.env
# Edit secrets.env with your actual credentials

# Deploy everything
kubectl apply -k .

# Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/part-of=jobpilot-monitoring \
  -n jobpilot \
  --timeout=300s
```

## Step 2: Access Grafana (1 minute)

```bash
# Port forward Grafana
kubectl port-forward svc/grafana -n jobpilot 3000:3000 &

# Open browser
open http://localhost:3000

# Login
# Username: admin
# Password: changeme-in-production
```

## Step 3: View Dashboards (1 minute)

In Grafana:
1. Click "Dashboards" → "Browse"
2. Select "JobPilot - Service Health Overview"
3. You should see metrics appearing!

## Step 4: Configure Your Services (3 minutes)

### For NestJS Services

Add to your deployment YAML:
```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

Add to your code:
```typescript
import { TelemetryModule } from '@jobpilot/telemetry';

@Module({
  imports: [
    TelemetryModule.forRoot({
      serviceName: 'your-service',
      enablePrometheus: true,
    }),
  ],
})
export class AppModule {}
```

### For Python AI Service

Already configured! Just ensure the service is deployed.

## Step 5: Test Alerts (2 minutes)

```bash
# View active alerts
kubectl port-forward svc/prometheus -n jobpilot 9090:9090 &
open http://localhost:9090/alerts

# View AlertManager
kubectl port-forward svc/alertmanager -n jobpilot 9093:9093 &
open http://localhost:9093
```

## Step 6: View Logs (1 minute)

In Grafana:
1. Click "Explore"
2. Select "Loki" datasource
3. Query: `{namespace="jobpilot"}`
4. See aggregated logs from all services!

## Verification Checklist

- [ ] All monitoring pods running
- [ ] Grafana accessible
- [ ] Dashboards showing data
- [ ] Prometheus scraping targets
- [ ] AlertManager receiving alerts
- [ ] Loki collecting logs

## Common Issues

### No metrics in Grafana?
```bash
# Check Prometheus targets
kubectl port-forward svc/prometheus -n jobpilot 9090:9090
# Visit: http://localhost:9090/targets
# Ensure your services are listed and UP
```

### Services not appearing?
Add annotations to your service deployments:
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
```

### Need help?
See [MONITORING_DEPLOYMENT_GUIDE.md](./MONITORING_DEPLOYMENT_GUIDE.md) for detailed instructions.

## Next Steps

1. **Customize Alerts**: Edit `prometheus-rules.yaml`
2. **Add Dashboards**: Create custom Grafana dashboards
3. **Configure Notifications**: Set up Slack/Email in AlertManager
4. **Review Runbooks**: Check `/runbooks` directory

## Useful Commands

```bash
# View all monitoring pods
kubectl get pods -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# Check Prometheus config
kubectl get configmap prometheus-config -n jobpilot -o yaml

# View Grafana logs
kubectl logs deployment/grafana -n jobpilot

# Restart monitoring stack
kubectl rollout restart deployment/prometheus -n jobpilot
kubectl rollout restart deployment/grafana -n jobpilot
kubectl rollout restart deployment/alertmanager -n jobpilot
```

## Success! 🎉

Your monitoring stack is now running! You can:
- View real-time metrics in Grafana
- Get alerted on issues via AlertManager
- Search logs in Loki
- Track service health and performance

Happy monitoring!
