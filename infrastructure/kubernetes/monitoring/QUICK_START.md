# Quick Start Guide - JobPilot Monitoring & Alerting

## TL;DR - Deploy in 5 Minutes

```bash
# 1. Create namespace
kubectl create namespace jobpilot

# 2. Configure secrets
cd infrastructure/kubernetes/monitoring
cp secrets.env.example secrets.env
# Edit secrets.env with your credentials

# 3. Create secrets in Kubernetes
kubectl create secret generic alertmanager-secrets \
  --from-env-file=secrets.env \
  -n jobpilot

# 4. Deploy everything
kubectl apply -k .

# 5. Verify deployment
kubectl get pods -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# 6. Access UIs (port-forward)
kubectl port-forward -n jobpilot svc/prometheus 9090:9090 &
kubectl port-forward -n jobpilot svc/alertmanager 9093:9093 &
kubectl port-forward -n jobpilot svc/grafana 3000:3000 &
```

Open:
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093
- Grafana: http://localhost:3000

## What You Get

### 38 Production-Ready Alerts

**Critical (10 alerts)**
- ServiceDown
- NodeNotReady
- PostgresDown
- RedisDown
- RabbitMQDown
- RabbitMQConsumerDown
- PaymentFailureRate
- RabbitMQNodeDown

**Warning (28 alerts)**
- High error rates, latency, resource usage
- Pod crashes, storage issues
- Database connection/replication issues
- Message queue backlogs
- Business metric degradation

### Multi-Channel Notifications

**Critical Alerts →**
- PagerDuty (pages on-call)
- Slack (#critical-alerts)
- Email (oncall@jobpilot.com)

**Warning Alerts →**
- Slack (#alerts)
- Email (ops-team@jobpilot.com)

### High Availability

- **AlertManager**: 3 replicas in cluster mode
- **Prometheus**: Persistent storage, 30-day retention
- **Network Policies**: Secure by default
- **PodDisruptionBudget**: Always 2+ replicas

## File Structure

```
monitoring/
├── prometheus.yaml                    # Prometheus deployment
├── prometheus-rules.yaml              # ⭐ 38 alert rules (5 groups)
├── alertmanager.yaml                  # Original AlertManager (legacy)
├── alertmanager-config.yaml           # ⭐ Routing & receivers
├── alertmanager-deployment.yaml       # ⭐ HA cluster deployment
├── grafana.yaml                       # Grafana deployment
├── kustomization.yaml                 # ⭐ Unified deployment
├── secrets.env.example                # ⭐ Secret template
├── README.md                          # Full documentation
├── DEPLOYMENT_SUMMARY.md              # Detailed summary
├── QUICK_START.md                     # This file
├── templates/
│   ├── slack.tmpl                     # ⭐ Slack formatting
│   ├── email.tmpl                     # ⭐ Email HTML
│   └── pagerduty.tmpl                 # ⭐ PagerDuty format
└── runbooks/
    └── README.md                       # ⭐ Alert runbooks

⭐ = New files created
```

## Configuration Required

Edit `secrets.env` with:

```bash
# SendGrid for emails
SENDGRID_API_KEY=SG.your_key_here

# Slack for chat notifications
SLACK_API_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty for on-call
PAGERDUTY_INTEGRATION_KEY=your_integration_key_here

# UI passwords
GRAFANA_ADMIN_PASSWORD=strong_password_here
PROMETHEUS_ADMIN_PASSWORD=strong_password_here
ALERTMANAGER_ADMIN_PASSWORD=strong_password_here
```

## Quick Validation

```bash
# ✅ Check AlertManager cluster
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- http://localhost:9093/api/v2/status | jq .cluster.peers

# Should show 3 peers

# ✅ Check alert rules loaded
kubectl exec -n jobpilot prometheus-xxx -- \
  wget -qO- http://localhost:9090/api/v1/rules | \
  jq '.data.groups[] | .name'

# Should show: service-health, infrastructure, database, message-queue, business-metrics

# ✅ Send test alert
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool alert add test_alert severity=warning service=test

# Check Slack/Email for notification
```

## Common Issues

### Pods Not Starting

```bash
# Check events
kubectl get events -n jobpilot --sort-by='.lastTimestamp' | tail -20

# Check logs
kubectl logs -n jobpilot <pod-name>

# Describe pod
kubectl describe pod -n jobpilot <pod-name>
```

### Secrets Not Found

```bash
# Verify secret exists
kubectl get secret alertmanager-secrets -n jobpilot

# Check secret data
kubectl get secret alertmanager-secrets -n jobpilot -o yaml

# Recreate if needed
kubectl delete secret alertmanager-secrets -n jobpilot
kubectl create secret generic alertmanager-secrets \
  --from-env-file=secrets.env \
  -n jobpilot
```

### AlertManager Not Clustering

```bash
# Check pod IPs
kubectl get pods -n jobpilot -l app=alertmanager -o wide

# Check headless service
kubectl get svc alertmanager-headless -n jobpilot

# Check logs for cluster formation
kubectl logs -n jobpilot alertmanager-0 | grep "cluster"

# Verify gossip port is open
kubectl exec -n jobpilot alertmanager-0 -- \
  nc -zv alertmanager-1.alertmanager-headless.jobpilot.svc.cluster.local 9094
```

### Notifications Not Sending

```bash
# Check AlertManager logs
kubectl logs -n jobpilot alertmanager-0 | grep -i "notif\|error"

# Verify webhook URLs
kubectl get configmap alertmanager-config -n jobpilot -o yaml | grep -A5 "slack\|pagerduty"

# Test SMTP
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- --post-data='test' smtp://smtp.sendgrid.net:587
```

## Quick Commands

```bash
# View all alerts
curl http://prometheus:9090/api/v1/alerts | jq .

# View firing alerts only
curl http://prometheus:9090/api/v1/alerts | jq '.data.alerts[] | select(.state=="firing")'

# List alert rules
curl http://prometheus:9090/api/v1/rules | jq '.data.groups[].name'

# Check targets
curl http://prometheus:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health!="up")'

# AlertManager status
curl http://alertmanager:9093/api/v2/status | jq .

# List silences
kubectl exec -n jobpilot alertmanager-0 -- amtool silence query

# Create silence
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool silence add alertname=TestAlert --duration=1h --comment="Testing"

# Remove silence
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool silence expire <silence-id>
```

## Alert Groups

| Group | Alerts | Focus |
|-------|--------|-------|
| service-health | 5 | Service availability, errors, latency, resources |
| infrastructure | 7 | Pods, nodes, deployments, storage |
| database | 8 | PostgreSQL, Redis health and performance |
| message-queue | 6 | RabbitMQ queues and consumers |
| business-metrics | 7 | Application success rates, user metrics, payments |

## Notification Matrix

| Severity | PagerDuty | Slack | Email | Repeat |
|----------|-----------|-------|-------|--------|
| Critical | ✅ | #critical-alerts | oncall@ | 1h |
| Warning | ❌ | #alerts | ops-team@ | 4h |

## Access URLs

**Production** (requires ingress setup):
- Prometheus: https://prometheus.jobpilot.com
- AlertManager: https://alertmanager.jobpilot.com
- Grafana: https://grafana.jobpilot.com

**Local** (via port-forward):
- Prometheus: http://localhost:9090
- AlertManager: http://localhost:9093
- Grafana: http://localhost:3000

## Next Steps

1. **Review Alerts**: Check `prometheus-rules.yaml` and adjust thresholds
2. **Configure Teams**: Update email addresses in `alertmanager-config.yaml`
3. **Create Runbooks**: Add detailed runbooks for each alert
4. **Set Up Dashboards**: Import Grafana dashboards
5. **Test Incident Response**: Run through a simulated incident

## Need Help?

- 📚 Full Docs: `./README.md`
- 📋 Deployment Details: `./DEPLOYMENT_SUMMARY.md`
- 📖 Runbooks: `./runbooks/README.md`
- 💬 Slack: #platform-team
- 📧 Email: ops-team@jobpilot.com

---

**Ready to Deploy!** Follow the TL;DR section above to get started.
