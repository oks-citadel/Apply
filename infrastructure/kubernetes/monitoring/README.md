# JobPilot Monitoring Stack

Comprehensive monitoring, alerting, and observability stack for the JobPilot AI Platform.

## Overview

This monitoring stack provides:
- **Prometheus**: Metrics collection and alerting
- **AlertManager**: Alert routing and notification management
- **Grafana**: Visualization and dashboards
- **Loki**: Log aggregation (configured separately)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    JobPilot Services                        │
│  (web-app, auth, job-service, ai-service, etc.)            │
└─────────────────┬───────────────────────────────────────────┘
                  │ Metrics (Prometheus format)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                      Prometheus                             │
│  - Scrapes metrics from services                            │
│  - Evaluates alert rules                                    │
│  - Stores time-series data                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │ Alerts
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                   AlertManager (HA Cluster)                 │
│  - Routes alerts to appropriate channels                    │
│  - Groups and deduplicates alerts                          │
│  - Manages silences                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │ Notifications
                  │
        ┌─────────┼─────────┬──────────┐
        │         │         │          │
┌───────▼────┐ ┌──▼─────┐ ┌▼────────┐ ┌▼──────┐
│   Email    │ │ Slack  │ │PagerDuty│ │Webhook│
└────────────┘ └────────┘ └─────────┘ └───────┘
```

## Components

### 1. Prometheus (prometheus.yaml, prometheus-rules.yaml)

**Purpose**: Metrics collection, storage, and alerting

**Key Features**:
- Automatic service discovery for Kubernetes pods and services
- 30-day data retention
- Alert rule evaluation every 15 seconds
- 5 comprehensive alert groups (Service Health, Infrastructure, Database, Message Queue, Business Metrics)

**Access**: `https://prometheus.jobpilot.com`

### 2. AlertManager (alertmanager-*.yaml)

**Purpose**: Alert routing, grouping, and notification

**Key Features**:
- High availability with 3 replicas
- Cluster mode with gossip protocol
- Multi-channel notifications (Email, Slack, PagerDuty)
- Intelligent alert grouping and deduplication
- Silence management with persistent storage

**Access**: `https://alertmanager.jobpilot.com`

### 3. Grafana (grafana.yaml)

**Purpose**: Metrics visualization and dashboards

**Key Features**:
- Pre-configured Prometheus datasource
- Custom dashboards for all services
- User authentication and RBAC
- Alerting integration

**Access**: `https://grafana.jobpilot.com`

## Alert Groups

### Group 1: Service Health
- **ServiceDown**: Service completely unavailable (Critical)
- **HighErrorRate**: >5% 5xx errors (Warning)
- **HighLatency**: P95 > 2s (Warning)
- **ServiceHighMemory**: >85% memory usage (Warning)
- **ServiceHighCPU**: >85% CPU usage (Warning)

### Group 2: Infrastructure
- **PodCrashLooping**: Container restart rate > 0 (Warning)
- **PodNotReady**: Pod not ready for 5 minutes (Warning)
- **DeploymentReplicaMismatch**: Desired != Available replicas (Warning)
- **PVCNearlyFull**: >90% storage usage (Warning)
- **NodeNotReady**: Node unavailable (Critical)

### Group 3: Database
- **PostgresDown**: PostgreSQL unavailable (Critical)
- **PostgresHighConnections**: >80% connections used (Warning)
- **PostgresReplicationLag**: Lag > 30s (Warning)
- **RedisDown**: Redis unavailable (Critical)
- **RedisHighMemory**: >90% memory usage (Warning)

### Group 4: Message Queue
- **RabbitMQDown**: RabbitMQ unavailable (Critical)
- **RabbitMQHighQueue**: >10,000 messages pending (Warning)
- **RabbitMQConsumerDown**: No active consumers (Critical)

### Group 5: Business Metrics
- **LowApplicationSuccessRate**: <70% success rate (Warning)
- **AIServiceRateLimited**: >10 rate-limited requests/min (Warning)
- **HighUserChurnRate**: >10% daily churn (Warning)
- **PaymentFailureRate**: >5% payment failures (Critical)

## Notification Channels

### Email (SendGrid)
- **Default Receiver**: ops-team@jobpilot.com
- **Critical Alerts**: oncall@jobpilot.com
- **Database Alerts**: database-team@jobpilot.com
- **Business Alerts**: product-team@jobpilot.com, business-analytics@jobpilot.com

### Slack
- **#critical-alerts**: Critical severity alerts
- **#alerts**: Warning severity alerts
- **#database-alerts**: Database and cache issues
- **#product-metrics**: Business metrics
- **#infrastructure**: Infrastructure issues

### PagerDuty
- **Critical Alerts Only**: Pages on-call engineer
- **Escalation**: Automatic escalation after 15 minutes

## Installation

### Prerequisites

1. Kubernetes cluster (1.24+)
2. kubectl configured
3. Kustomize 4.0+ (included in kubectl 1.14+)
4. Cert-manager for TLS certificates
5. Ingress controller (nginx)

### Step 1: Create Namespace

```bash
kubectl create namespace jobpilot
```

### Step 2: Configure Secrets

```bash
# Copy the example file
cp secrets.env.example secrets.env

# Edit with your actual credentials
nano secrets.env

# Create the secrets in Kubernetes
kubectl create secret generic alertmanager-secrets \
  --from-env-file=secrets.env \
  -n jobpilot
```

### Step 3: Deploy Monitoring Stack

```bash
# Apply all monitoring resources
kubectl apply -k infrastructure/kubernetes/monitoring/

# Verify deployment
kubectl get pods -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# Check services
kubectl get svc -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring
```

### Step 4: Verify AlertManager Cluster

```bash
# Check AlertManager cluster status
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- http://localhost:9093/api/v2/status | jq .

# Verify all 3 replicas are in the cluster
kubectl logs -n jobpilot alertmanager-0 | grep "cluster members"
```

### Step 5: Access Web UIs

```bash
# Port forward Prometheus
kubectl port-forward -n jobpilot svc/prometheus 9090:9090

# Port forward AlertManager
kubectl port-forward -n jobpilot svc/alertmanager 9093:9093

# Port forward Grafana
kubectl port-forward -n jobpilot svc/grafana 3000:3000
```

Then access:
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093
- Grafana: http://localhost:3000

## Configuration

### Adding New Alert Rules

1. Edit `prometheus-rules.yaml`
2. Add your rule to the appropriate group
3. Apply changes:
   ```bash
   kubectl apply -f infrastructure/kubernetes/monitoring/prometheus-rules.yaml
   ```
4. Verify rule is loaded:
   ```bash
   curl http://prometheus:9090/api/v1/rules | jq '.data.groups[] | select(.name=="your-group")'
   ```

### Modifying Notification Routes

1. Edit `alertmanager-config.yaml`
2. Update the `route` section
3. Apply changes:
   ```bash
   kubectl apply -f infrastructure/kubernetes/monitoring/alertmanager-config.yaml
   ```
4. Reload configuration:
   ```bash
   kubectl exec -n jobpilot alertmanager-0 -- \
     wget --post-data='' http://localhost:9093/-/reload
   ```

### Adding New Notification Channels

1. Add receiver configuration in `alertmanager-config.yaml`
2. Add route to match alerts to the receiver
3. Update secrets if credentials are needed
4. Apply changes and reload

## Testing

### Test Alert Rules

```bash
# Trigger a test alert manually
kubectl run test-alert --image=busybox --restart=Never -- \
  wget --post-data='[{"labels":{"alertname":"TestAlert","severity":"warning"}}]' \
  http://prometheus:9090/api/v1/alerts

# Check if alert fires
curl http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.alertname=="TestAlert")'
```

### Test Notifications

```bash
# Send test notification to AlertManager
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool alert add test_alert \
    severity=warning \
    service=test \
    --annotation=summary="Test alert" \
    --annotation=description="This is a test alert"

# Check notification was sent
kubectl logs -n jobpilot alertmanager-0 | grep "test_alert"
```

### Verify Email Configuration

```bash
# Test SMTP connection
kubectl run smtp-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -v --url 'smtp://smtp.sendgrid.net:587' \
  --mail-from 'alerts@jobpilot.com' \
  --mail-rcpt 'test@example.com' \
  --user 'apikey:YOUR_SENDGRID_API_KEY'
```

## Troubleshooting

### Prometheus Not Scraping Metrics

```bash
# Check service discovery
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health!="up")'

# Check pod annotations
kubectl get pods -n jobpilot -o json | jq '.items[] | select(.metadata.annotations."prometheus.io/scrape"=="true")'

# Verify network connectivity
kubectl exec -n jobpilot prometheus-xxx -- \
  wget -O- http://service-name:port/metrics
```

### AlertManager Not Receiving Alerts

```bash
# Check Prometheus alerting configuration
curl http://prometheus:9090/api/v1/alertmanagers | jq .

# Verify AlertManager is reachable
kubectl exec -n jobpilot prometheus-xxx -- \
  wget -O- http://alertmanager:9093/-/healthy

# Check alert queue
curl http://prometheus:9090/api/v1/alerts | jq '.data.alerts | length'
```

### Notifications Not Sending

```bash
# Check AlertManager logs
kubectl logs -n jobpilot alertmanager-0 | grep -i "error\|fail"

# Verify receiver configuration
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool config routes show

# Test notification channel directly
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool alert add test --annotation=summary="Test" --alertmanager.url=http://localhost:9093
```

### AlertManager Cluster Issues

```bash
# Check cluster status
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- http://localhost:9093/api/v2/status | jq '.cluster'

# Verify gossip protocol
kubectl logs -n jobpilot alertmanager-0 | grep "memberlist"

# Check peer connectivity
kubectl exec -n jobpilot alertmanager-0 -- \
  nc -zv alertmanager-1.alertmanager-headless.jobpilot.svc.cluster.local 9094
```

## Maintenance

### Backup Alert Silences

```bash
# Export silences
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool silence query -o json > alertmanager-silences-backup.json

# Restore silences
kubectl exec -n jobpilot alertmanager-0 -i -- \
  amtool silence import < alertmanager-silences-backup.json
```

### Upgrade Components

```bash
# Update image versions in kustomization.yaml
nano infrastructure/kubernetes/monitoring/kustomization.yaml

# Apply changes
kubectl apply -k infrastructure/kubernetes/monitoring/

# Watch rollout
kubectl rollout status deployment/prometheus -n jobpilot
kubectl rollout status statefulset/alertmanager -n jobpilot
```

### Cleanup Old Data

```bash
# Prometheus data is automatically cleaned based on retention (30d)
# To manually clean:
kubectl exec -n jobpilot prometheus-xxx -- \
  rm -rf /prometheus/wal/*

# AlertManager silences older than retention are auto-removed
# To manually clean:
kubectl exec -n jobpilot alertmanager-0 -- \
  rm -rf /alertmanager/nflog
```

## Best Practices

### Alert Design
1. **Actionable**: Every alert should have a clear action
2. **Meaningful**: Alert on symptoms, not causes
3. **Timely**: Alert before issues impact users
4. **Documented**: Every alert needs a runbook

### Notification Strategy
1. **Critical → PagerDuty + Slack + Email**: Immediate response needed
2. **Warning → Slack + Email**: Investigation needed
3. **Info → Email only**: Informational, no action needed

### Alert Fatigue Prevention
1. Use appropriate thresholds
2. Implement proper inhibition rules
3. Group related alerts
4. Set reasonable repeat intervals
5. Regular review and tuning

## Monitoring Metrics

### Prometheus
- **prometheus_tsdb_symbol_table_size_bytes**: Memory usage
- **prometheus_tsdb_storage_blocks_bytes**: Disk usage
- **prometheus_rule_evaluation_duration_seconds**: Rule evaluation time
- **prometheus_target_scrape_duration_seconds**: Scrape duration

### AlertManager
- **alertmanager_alerts**: Total alerts
- **alertmanager_alerts_received_total**: Alerts received
- **alertmanager_alerts_invalid_total**: Invalid alerts
- **alertmanager_notifications_total**: Notifications sent
- **alertmanager_notifications_failed_total**: Failed notifications

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Runbooks](./runbooks/README.md)
- [Alert Templates](./templates/)

## Support

- **Slack**: #platform-team
- **Email**: ops-team@jobpilot.com
- **On-call**: PagerDuty escalation

---

**Last Updated**: 2025-12-07
**Maintained By**: Platform Team
**Review Cycle**: Monthly
