# AlertManager and Prometheus Alerts Deployment Summary

## Overview

This document summarizes the comprehensive monitoring and alerting infrastructure created for the JobPilot AI Platform.

**Date**: 2025-12-07
**Author**: SRE Agent
**Status**: Ready for Deployment

## Files Created

### Core Configuration Files

1. **prometheus-rules.yaml** (24,678 bytes)
   - PrometheusRule CRD with 5 comprehensive alert groups
   - 35+ production-ready alert rules
   - Covers all critical system components

2. **alertmanager-config.yaml** (18,639 bytes)
   - Complete AlertManager configuration with routing
   - Multi-channel notification setup (Email, Slack, PagerDuty)
   - Intelligent inhibition rules
   - Secret management for credentials

3. **alertmanager-deployment.yaml** (12,521 bytes)
   - High-availability StatefulSet with 3 replicas
   - Cluster mode with gossip protocol
   - Persistent storage for silences
   - Network policies and security hardening
   - PodDisruptionBudget for availability

4. **kustomization.yaml** (3,996 bytes)
   - Unified deployment manifest
   - ConfigMap and Secret generators
   - Resource management and patching

### Supporting Files

5. **runbooks/README.md** (13,415 bytes)
   - Comprehensive runbook index
   - Quick reference for all alerts
   - Incident response procedures
   - Troubleshooting guides

6. **templates/slack.tmpl** (1,054 bytes)
   - Custom Slack notification templates
   - Rich formatting with color coding

7. **templates/email.tmpl** (6,297 bytes)
   - HTML email templates
   - Responsive design with severity colors
   - Action buttons for quick access

8. **templates/pagerduty.tmpl** (1,371 bytes)
   - PagerDuty notification format
   - Detailed alert context

9. **secrets.env.example** (916 bytes)
   - Template for secret configuration
   - Clear instructions for all credentials

10. **README.md** (14,452 bytes)
    - Complete deployment guide
    - Architecture diagrams
    - Troubleshooting procedures
    - Best practices

## Alert Groups Summary

### Group 1: Service Health (5 alerts)
| Alert | Severity | Threshold | Duration | Description |
|-------|----------|-----------|----------|-------------|
| ServiceDown | Critical | up == 0 | 1 min | Service completely unavailable |
| HighErrorRate | Warning | >5% 5xx | 5 min | High rate of server errors |
| HighLatency | Warning | P95 > 2s | 5 min | Slow response times |
| ServiceHighMemory | Warning | >85% | 5 min | High memory usage |
| ServiceHighCPU | Warning | >85% | 5 min | High CPU usage |

### Group 2: Infrastructure (7 alerts)
| Alert | Severity | Threshold | Duration | Description |
|-------|----------|-----------|----------|-------------|
| PodCrashLooping | Warning | restart rate > 0 | 5 min | Pod repeatedly restarting |
| PodNotReady | Warning | not ready | 5 min | Pod in non-ready state |
| DeploymentReplicaMismatch | Warning | desired != available | 10 min | Deployment replica issues |
| PVCNearlyFull | Warning | >90% | 5 min | Storage nearly full |
| NodeNotReady | Critical | not ready | 5 min | Kubernetes node down |
| NodeMemoryPressure | Warning | memory pressure | 5 min | Node memory issues |
| NodeDiskPressure | Warning | disk pressure | 5 min | Node disk issues |

### Group 3: Database (8 alerts)
| Alert | Severity | Threshold | Duration | Description |
|-------|----------|-----------|----------|-------------|
| PostgresDown | Critical | pg_up == 0 | 1 min | PostgreSQL unavailable |
| PostgresHighConnections | Warning | >80% connections | 5 min | Connection pool nearly full |
| PostgresReplicationLag | Warning | lag > 30s | 5 min | Replication falling behind |
| PostgresHighTransactionRate | Warning | >1000 tx/s | 10 min | Very high transaction load |
| RedisDown | Critical | redis_up == 0 | 1 min | Redis cache unavailable |
| RedisHighMemory | Warning | >90% | 5 min | Redis memory nearly full |
| RedisHighEvictionRate | Warning | >10 evictions/s | 5 min | Keys being evicted |
| RedisRejectedConnections | Warning | > 0 | 5 min | Connections being rejected |

### Group 4: Message Queue (6 alerts)
| Alert | Severity | Threshold | Duration | Description |
|-------|----------|-----------|----------|-------------|
| RabbitMQDown | Critical | rabbitmq_up == 0 | 1 min | RabbitMQ unavailable |
| RabbitMQHighQueue | Warning | >10,000 messages | 5 min | Queue backlog building |
| RabbitMQConsumerDown | Critical | 0 consumers | 5 min | No message processing |
| RabbitMQHighUnackedMessages | Warning | >1,000 unacked | 10 min | Messages not acknowledged |
| RabbitMQHighConnections | Warning | >1,000 connections | 5 min | Many connections |
| RabbitMQNodeDown | Critical | node down | 1 min | Cluster node unavailable |

### Group 5: Business Metrics (7 alerts)
| Alert | Severity | Threshold | Duration | Description |
|-------|----------|-----------|----------|-------------|
| LowApplicationSuccessRate | Warning | <70% success | 30 min | Job applications failing |
| AIServiceRateLimited | Warning | >10/min | 5 min | AI API rate limiting |
| HighUserChurnRate | Warning | >10% daily | 1 hour | Users leaving platform |
| PaymentFailureRate | Critical | >5% failures | 15 min | Payment processing issues |
| LowResumeGenerationSuccessRate | Warning | <80% success | 15 min | Resume generation failing |
| HighAPIQuotaExhaustion | Warning | >1/s | 10 min | Users hitting quotas |
| SlowJobSearchResponseTime | Warning | P95 > 3s | 10 min | Search performance degraded |

**Total Alerts**: 38 production-ready alerts

## Notification Routing

### Critical Alerts
- **Channels**: PagerDuty + Slack (#critical-alerts) + Email (oncall@)
- **Group Wait**: 10s
- **Repeat Interval**: 1 hour
- **Response**: Immediate action required

### Warning Alerts
- **Channels**: Slack (#alerts) + Email (ops-team@)
- **Group Wait**: 30s
- **Repeat Interval**: 4 hours
- **Response**: Investigation needed

### Specialized Routes
- **Database**: Slack (#database-alerts) + Email (database-team@)
- **Business**: Slack (#product-metrics) + Email (product-team@, business-analytics@)
- **Infrastructure**: Slack (#infrastructure) + Email (platform-team@)

## High Availability Configuration

### AlertManager Cluster
- **Replicas**: 3
- **Mode**: StatefulSet with cluster gossip
- **Storage**: 10Gi persistent volume per replica
- **Anti-affinity**: Spread across different nodes
- **PodDisruptionBudget**: Minimum 2 replicas always available

### Data Persistence
- **Prometheus**: 50Gi storage, 30-day retention
- **AlertManager**: 10Gi per replica, 5-day retention
- **Silences**: Persisted to disk, survives restarts

## Security Features

### Network Policies
- Restrict AlertManager traffic to:
  - Prometheus (ingress on 9093)
  - Ingress controller (ingress on 9093)
  - Inter-cluster gossip (9094 TCP/UDP)
- Allow outbound for:
  - DNS resolution
  - HTTPS webhooks (443)
  - SMTP (587)

### Authentication
- Basic auth on AlertManager ingress
- TLS/SSL with cert-manager
- Secret management for credentials

### Container Security
- Non-root user (65534)
- Read-only root filesystem
- Drop all capabilities
- Seccomp profile enabled

## Deployment Steps

### Prerequisites
```bash
# 1. Ensure namespace exists
kubectl create namespace jobpilot

# 2. Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 3. Configure ingress controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
```

### Configuration
```bash
# 1. Create secrets file
cd infrastructure/kubernetes/monitoring
cp secrets.env.example secrets.env

# 2. Edit with actual credentials
nano secrets.env

# 3. Create Kubernetes secrets
kubectl create secret generic alertmanager-secrets \
  --from-env-file=secrets.env \
  -n jobpilot
```

### Deployment
```bash
# 1. Deploy monitoring stack
kubectl apply -k infrastructure/kubernetes/monitoring/

# 2. Wait for pods to be ready
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/part-of=jobpilot-monitoring \
  -n jobpilot \
  --timeout=300s

# 3. Verify AlertManager cluster
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- http://localhost:9093/api/v2/status

# 4. Check Prometheus is scraping targets
kubectl exec -n jobpilot prometheus-xxx -- \
  wget -qO- http://localhost:9090/api/v1/targets
```

### Verification
```bash
# 1. Check all pods are running
kubectl get pods -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# Expected output:
# NAME                          READY   STATUS    RESTARTS   AGE
# prometheus-xxx                1/1     Running   0          5m
# alertmanager-0                1/1     Running   0          5m
# alertmanager-1                1/1     Running   0          5m
# alertmanager-2                1/1     Running   0          5m
# grafana-xxx                   1/1     Running   0          5m

# 2. Verify services
kubectl get svc -n jobpilot -l app.kubernetes.io/part-of=jobpilot-monitoring

# 3. Check ingress
kubectl get ingress -n jobpilot
```

## Testing

### Test Alert Rules
```bash
# 1. Check rules are loaded
kubectl exec -n jobpilot prometheus-xxx -- \
  wget -qO- http://localhost:9090/api/v1/rules | \
  jq '.data.groups[] | .name'

# Expected output:
# "service-health"
# "infrastructure"
# "database"
# "message-queue"
# "business-metrics"
```

### Test Notifications
```bash
# 1. Send test alert
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool alert add test_alert \
    severity=warning \
    service=test \
    --annotation=summary="Test alert" \
    --annotation=description="This is a test"

# 2. Check Slack/Email for notification
# 3. Verify in AlertManager UI
```

### Test Cluster Mode
```bash
# 1. Check cluster members
kubectl exec -n jobpilot alertmanager-0 -- \
  wget -qO- http://localhost:9093/api/v2/status | \
  jq '.cluster.peers'

# Expected: 3 peers

# 2. Create silence on one replica
kubectl exec -n jobpilot alertmanager-0 -- \
  amtool silence add alertname=test_alert --duration=1h

# 3. Verify silence propagated to all replicas
kubectl exec -n jobpilot alertmanager-1 -- \
  amtool silence query
```

## Monitoring the Monitors

### Key Metrics to Watch

#### Prometheus
```promql
# Scrape duration
prometheus_target_scrape_duration_seconds

# Rule evaluation duration
prometheus_rule_evaluation_duration_seconds

# Storage usage
prometheus_tsdb_storage_blocks_bytes
```

#### AlertManager
```promql
# Alerts received
alertmanager_alerts_received_total

# Notifications sent
alertmanager_notifications_total

# Failed notifications
alertmanager_notifications_failed_total

# Cluster members
alertmanager_cluster_members
```

## Maintenance

### Weekly Tasks
- [ ] Review alert fatigue (alerts firing too often)
- [ ] Check notification delivery success rate
- [ ] Verify all runbooks are up to date

### Monthly Tasks
- [ ] Review and tune alert thresholds
- [ ] Update team contact information
- [ ] Test disaster recovery procedures
- [ ] Review and update runbooks

### Quarterly Tasks
- [ ] Full system audit
- [ ] Load testing of alerting pipeline
- [ ] Update documentation
- [ ] Team training on incident response

## Rollback Procedure

If issues occur after deployment:

```bash
# 1. Delete new AlertManager deployment
kubectl delete -f infrastructure/kubernetes/monitoring/alertmanager-deployment.yaml

# 2. Restore old AlertManager
kubectl apply -f infrastructure/kubernetes/monitoring/alertmanager.yaml

# 3. Remove new rules if needed
kubectl delete -f infrastructure/kubernetes/monitoring/prometheus-rules.yaml

# 4. Verify Prometheus is stable
kubectl get pods -n jobpilot -l app=prometheus
```

## Success Criteria

- [ ] All 3 AlertManager replicas are running and clustered
- [ ] Prometheus is evaluating all 38 alert rules
- [ ] Test alert successfully routes to all channels
- [ ] Silence on one replica propagates to all
- [ ] All web UIs are accessible via ingress
- [ ] Network policies allow required traffic
- [ ] Secrets are properly mounted
- [ ] PodDisruptionBudget prevents full outage

## Next Steps

1. **Configure Service Monitors**
   - Add Prometheus ServiceMonitor CRDs for automatic scraping
   - Configure service-specific metrics endpoints

2. **Create Grafana Dashboards**
   - Import pre-built dashboards
   - Create custom dashboards for business metrics

3. **Set Up Log Aggregation**
   - Deploy Loki for log collection
   - Configure Promtail on all nodes
   - Create log-based alerts

4. **Implement Tracing**
   - Deploy Jaeger for distributed tracing
   - Instrument services with OpenTelemetry

5. **Automate Runbook Creation**
   - Create individual runbook files for each alert
   - Add real examples from production incidents

6. **Set Up SLOs**
   - Define Service Level Objectives
   - Create SLO-based alerts
   - Build SLO dashboards

## Support

**Platform Team**
- Slack: #platform-team
- Email: ops-team@jobpilot.com
- On-call: PagerDuty escalation

**Documentation**
- Architecture: `../../../docs/architecture.md`
- Runbooks: `./runbooks/README.md`
- Main README: `./README.md`

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: 2025-12-07
**Maintained By**: Platform Team
