# Kubernetes Rollout and Rollback Strategy Guide

## Overview

This document outlines production-safe deployment strategies, rollout procedures, and rollback mechanisms for the ApplyForUs platform running on Azure Kubernetes Service (AKS).

**Namespace:** `applyforus`

---

## Table of Contents

1. [Health Check Architecture](#health-check-architecture)
2. [Rolling Update Strategy](#rolling-update-strategy)
3. [Canary Deployment Strategy](#canary-deployment-strategy)
4. [Pod Disruption Budgets](#pod-disruption-budgets)
5. [Horizontal Pod Autoscaling](#horizontal-pod-autoscaling)
6. [Rollout Procedures](#rollout-procedures)
7. [Rollback Procedures](#rollback-procedures)
8. [Network Isolation & Security](#network-isolation--security)
9. [Monitoring & Alerts](#monitoring--alerts)
10. [Troubleshooting](#troubleshooting)

---

## Health Check Architecture

All microservices implement three distinct health check endpoints:

### Health Endpoint Matrix

| Endpoint | Purpose | K8s Probe | Checks Dependencies | Timeout |
|----------|---------|-----------|-------------------|---------|
| `/api/v1/health/live` | Liveness check | livenessProbe | No | Fast |
| `/api/v1/health/ready` | Readiness check | readinessProbe | Yes (DB, Redis) | Medium |
| `/api/v1/health` | Basic health | N/A | Minimal | Fast |

### Probe Configuration

#### Standard Services (Auth, User, Job, Resume, Notification, Analytics)

```yaml
startupProbe:
  httpGet:
    path: /api/v1/health/live
    port: <service-port>
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 12  # 60s max startup time

readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: <service-port>
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

livenessProbe:
  httpGet:
    path: /api/v1/health/live
    port: <service-port>
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

#### Slow-Starting Services (AI, Auto-Apply, Orchestrator)

```yaml
startupProbe:
  initialDelaySeconds: 15-20
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 18  # 180s max startup time

readinessProbe:
  # Same as standard

livenessProbe:
  initialDelaySeconds: 45-60
  periodSeconds: 15
  timeoutSeconds: 5
```

### Lifecycle Hooks

All services implement graceful shutdown:

```yaml
lifecycle:
  preStop:
    exec:
      command: ["/bin/sh", "-c", "sleep 15"]
```

This provides:
- 15 seconds for in-flight requests to complete
- Clean connection draining
- Proper cleanup of resources

---

## Rolling Update Strategy

### Configuration

All deployments enforce zero-downtime rolling updates:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1          # Only 1 pod above desired count
    maxUnavailable: 0    # Never allow pods to be unavailable
revisionHistoryLimit: 10  # Keep 10 previous ReplicaSets
```

### Benefits

- **Zero Downtime**: At least minReplicas always available
- **Safe Rollouts**: New pods must pass health checks before old pods terminate
- **Quick Rollback**: Previous 10 ReplicaSets retained
- **Predictable Behavior**: Only one pod updated at a time

### Rollout Process

1. **New Pod Created**: k8s creates 1 new pod (maxSurge: 1)
2. **Startup Probe**: New pod enters startup phase (up to 60-180s)
3. **Readiness Check**: Checks database, Redis, dependencies
4. **Traffic Routing**: Only after readiness passes
5. **Old Pod Termination**: preStop hook executed (15s drain)
6. **Repeat**: Process continues for next pod

---

## Canary Deployment Strategy

### Flagger Integration

Canary deployments use Flagger for automated progressive delivery with automatic rollback on failure.

### Canary Configuration Overview

| Service | Max Weight | Step Weight | Interval | Threshold |
|---------|------------|-------------|----------|-----------|
| Auth | 50% | 10% | 1m | 5 |
| User | 50% | 10% | 1m | 5 |
| Job | 50% | 10% | 1m | 5 |
| AI | 30% | 5% | 2m | 5 |
| Auto-Apply | 40% | 10% | 2m | 5 |
| Orchestrator | 40% | 10% | 2m | 5 |
| Resume | 50% | 10% | 1m | 5 |
| Notification | 50% | 10% | 1m | 5 |
| Analytics | 50% | 10% | 1m | 5 |
| Web App | 50% | 10% | 1m | 5 |

### Metrics & Thresholds

All canary deployments monitor:

**Success Rate Threshold**
- Standard Services: 99% minimum
- AI Service: 98% minimum (allows for higher latency tolerance)

**Response Time Threshold**
- Standard Services: 500ms maximum
- Auto-Apply/Orchestrator: 1000ms maximum
- AI Service: 2000ms maximum
- Web App: 1000ms maximum

### Automatic Rollback Triggers

Canary deployments automatically rollback if:

1. **Health Check Failure**: `/api/v1/health/ready` returns non-200
2. **Success Rate**: Falls below threshold for 5 consecutive intervals
3. **Response Time**: Exceeds threshold for 5 consecutive intervals
4. **Load Test Failure**: Automated load test fails

### Canary Deployment Flow

```
1. Initial Deployment (100% stable)
   ↓
2. Canary Created (0% traffic)
   ↓
3. Traffic Split: 10% → canary
   ↓ (1-2 min analysis)
4. Metrics Check: ✓ PASS
   ↓
5. Traffic Split: 20% → canary
   ↓ (1-2 min analysis)
6. Metrics Check: ✓ PASS
   ↓
7. Continue incrementing by stepWeight
   ↓
8. Traffic Split: 50% → canary (maxWeight)
   ↓ (1-2 min analysis)
9. Final Metrics Check: ✓ PASS
   ↓
10. Promote Canary (100% new version)
    ↓
11. Cleanup Old Version

If ANY check fails → AUTOMATIC ROLLBACK
```

---

## Pod Disruption Budgets

### Configuration

All services have PodDisruptionBudgets enforcing minimum availability:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: <service>-pdb
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: <service>
```

### Protection During

- **Cluster Upgrades**: AKS node pool updates
- **Node Draining**: Maintenance operations
- **Evictions**: Resource pressure, preemption
- **Rolling Updates**: Combined with deployment strategy

### PDB Enforcement

With `minAvailable: 1` and rolling update `maxUnavailable: 0`:

- Kubernetes **guarantees** 1 pod always running
- Voluntary disruptions are blocked if they violate PDB
- Forced evictions still possible (node failure, OOM)

---

## Horizontal Pod Autoscaling

### HPA Configuration

All services scale automatically based on CPU and memory metrics:

```yaml
metrics:
- type: Resource
  resource:
    name: cpu
    target:
      type: Utilization
      averageUtilization: 70
- type: Resource
  resource:
    name: memory
    target:
      type: Utilization
      averageUtilization: 80
```

### Replica Ranges

| Service | Min Replicas | Max Replicas | Reason |
|---------|--------------|--------------|--------|
| Auth | 2 | 10 | High request volume |
| User | 2 | 10 | High request volume |
| Job | 2 | 8 | Moderate load |
| AI | 2 | 6 | Resource-intensive |
| Auto-Apply | 2 | 10 | Batch processing |
| Orchestrator | 2 | 8 | Workflow coordination |
| Resume | 2 | 8 | Document processing |
| Notification | 2 | 8 | Event-driven |
| Analytics | 2 | 6 | Query processing |
| Web App | 2 | 12 | User-facing |

### Scaling Behavior

**Scale Up (Fast)**
- Stabilization: 0 seconds
- Max increase: 100% or 2-3 pods per 30 seconds
- Trigger: CPU/Memory > threshold

**Scale Down (Conservative)**
- Stabilization: 300 seconds (5 minutes)
- Max decrease: 50% or 1 pod per 60 seconds
- Prevents flapping

---

## Rollout Procedures

### Pre-Deployment Checklist

- [ ] Verify health endpoints are implemented
- [ ] Test health checks locally/staging
- [ ] Review resource requests/limits
- [ ] Check PDB and HPA configurations
- [ ] Verify network policies allow traffic
- [ ] Review canary thresholds (if applicable)
- [ ] Backup critical data

### Standard Rolling Update Deployment

```bash
# 1. Apply new deployment manifest
kubectl apply -f infrastructure/kubernetes/production/<service>-deployment.yaml -n applyforus

# 2. Watch rollout status
kubectl rollout status deployment/<service> -n applyforus

# 3. Monitor pod events
kubectl get events -n applyforus --sort-by='.lastTimestamp' | grep <service>

# 4. Check pod health
kubectl get pods -n applyforus -l app=<service> -w

# 5. Verify readiness
kubectl get pods -n applyforus -l app=<service> -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}'

# 6. Test service endpoint
kubectl port-forward -n applyforus svc/<service> 8080:<port>
curl http://localhost:8080/api/v1/health/ready
```

### Canary Deployment

```bash
# 1. Ensure Flagger is installed
kubectl get canaries -n applyforus

# 2. Apply canary configuration
kubectl apply -f infrastructure/kubernetes/production/canary-deployments.yaml -n applyforus

# 3. Update deployment (Flagger takes over)
kubectl apply -f infrastructure/kubernetes/production/<service>-deployment.yaml -n applyforus

# 4. Monitor canary progress
kubectl describe canary/<service> -n applyforus

# 5. Watch Flagger events
kubectl get events -n applyforus --field-selector involvedObject.name=<service>

# 6. Check canary metrics
kubectl logs -n applyforus -l app=flagger -f | grep <service>
```

### Monitoring During Rollout

```bash
# Watch all pods in namespace
kubectl get pods -n applyforus -w

# Stream deployment events
kubectl get events -n applyforus --watch

# Check HPA scaling
kubectl get hpa -n applyforus

# Verify PDB status
kubectl get pdb -n applyforus

# Monitor resource usage
kubectl top pods -n applyforus -l app=<service>
```

---

## Rollback Procedures

### Automatic Rollback (Canary)

Flagger automatically rolls back if:
- Health checks fail
- Error rate exceeds threshold
- Response time degrades
- Load test fails

**No manual intervention required** - Flagger reverts to stable version.

### Manual Rollback (Rolling Update)

#### Quick Rollback to Previous Version

```bash
# Rollback to previous revision
kubectl rollout undo deployment/<service> -n applyforus

# Verify rollback
kubectl rollout status deployment/<service> -n applyforus
```

#### Rollback to Specific Revision

```bash
# View rollout history
kubectl rollout history deployment/<service> -n applyforus

# Example output:
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         Updated health checks
# 3         Increased resources

# Rollback to specific revision
kubectl rollout undo deployment/<service> --to-revision=2 -n applyforus

# Confirm version
kubectl describe deployment/<service> -n applyforus | grep Image:
```

#### Pause Rollout (Emergency)

```bash
# Pause ongoing rollout
kubectl rollout pause deployment/<service> -n applyforus

# Investigate issues
kubectl logs -n applyforus -l app=<service> --tail=100

# Resume or undo
kubectl rollout resume deployment/<service> -n applyforus
# OR
kubectl rollout undo deployment/<service> -n applyforus
```

### Rollback Verification

```bash
# 1. Check pod status
kubectl get pods -n applyforus -l app=<service>

# 2. Verify all pods ready
kubectl wait --for=condition=ready pod -l app=<service> -n applyforus --timeout=300s

# 3. Test health endpoint
POD=$(kubectl get pod -n applyforus -l app=<service> -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n applyforus $POD -- curl -s http://localhost:<port>/api/v1/health/ready

# 4. Check logs for errors
kubectl logs -n applyforus -l app=<service> --tail=50 | grep -i error

# 5. Verify service endpoints
kubectl get endpoints -n applyforus <service>
```

### Rollback Decision Matrix

| Scenario | Action | Command |
|----------|--------|---------|
| Health checks failing | Immediate rollback | `kubectl rollout undo deployment/<service> -n applyforus` |
| High error rate | Pause and investigate | `kubectl rollout pause deployment/<service> -n applyforus` |
| Slow rollout | Monitor, check resources | `kubectl top pods -n applyforus` |
| Database errors | Rollback, check migrations | `kubectl rollout undo ...` + DB check |
| Memory leaks | Rollback immediately | `kubectl rollout undo deployment/<service> -n applyforus` |
| Config errors | Fix config, reapply | `kubectl apply -f ...` |

---

## Network Isolation & Security

### Network Policy Enforcement

All services have network policies enforcing:

1. **Default Deny**: No traffic allowed unless explicitly permitted
2. **Ingress Rules**: Only from Ingress Controller and authorized pods
3. **Egress Rules**: Only to required services (DB, Redis, external APIs)

### Verification

```bash
# Check network policies
kubectl get networkpolicies -n applyforus

# Describe specific policy
kubectl describe networkpolicy <service>-policy -n applyforus

# Test connectivity (should fail if not allowed)
kubectl run -it --rm debug --image=nicolaka/netshoot -n applyforus -- bash
# Inside pod:
curl http://<service>:port/api/v1/health
```

### Namespace Isolation

The `applyforus` namespace is isolated from:
- Other application namespaces
- System namespaces (except DNS)

**Allowed traffic:**
- DNS resolution to `kube-system`
- Ingress from `ingress-nginx` namespace
- Inter-service communication within `applyforus`
- Egress to Azure services (PostgreSQL, Redis, Storage)

---

## Monitoring & Alerts

### Key Metrics to Monitor

**Pod Health**
```bash
kubectl get pods -n applyforus -o wide
kubectl top pods -n applyforus
```

**Deployment Status**
```bash
kubectl get deployments -n applyforus
kubectl rollout status deployment/<service> -n applyforus
```

**HPA Metrics**
```bash
kubectl get hpa -n applyforus -w
```

**PDB Status**
```bash
kubectl get pdb -n applyforus
```

**Events**
```bash
kubectl get events -n applyforus --sort-by='.lastTimestamp' | tail -20
```

### Prometheus Metrics

All services expose metrics at `/metrics` endpoint:

```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "<port>"
  prometheus.io/path: "/metrics"
```

### Critical Alerts

1. **Pod CrashLoopBackOff**: Automatic alert + investigation
2. **Readiness Probe Failures**: Check dependencies (DB, Redis)
3. **High Memory Usage**: Scale or optimize
4. **PDB Violations**: Deployment blocked, needs intervention
5. **Canary Rollback**: Review logs and metrics

---

## Troubleshooting

### Common Issues

#### Pods Stuck in Pending

```bash
# Check node resources
kubectl describe node

# Check pod events
kubectl describe pod <pod-name> -n applyforus

# Common causes:
# - Insufficient CPU/memory on nodes
# - PVC not bound
# - Image pull errors
```

#### Readiness Probe Failing

```bash
# Check pod logs
kubectl logs <pod-name> -n applyforus

# Exec into pod and test health endpoint
kubectl exec -it <pod-name> -n applyforus -- curl http://localhost:<port>/api/v1/health/ready

# Common causes:
# - Database connection failure
# - Redis connection failure
# - Service initialization not complete
# - Incorrect health check path
```

#### Rollout Stuck

```bash
# Check rollout status
kubectl rollout status deployment/<service> -n applyforus

# Describe deployment
kubectl describe deployment/<service> -n applyforus

# Check events
kubectl get events -n applyforus | grep <service>

# Common causes:
# - Readiness probe failures
# - Image pull errors
# - Resource constraints
# - PDB blocking progress
```

#### Canary Deployment Not Progressing

```bash
# Check canary status
kubectl describe canary/<service> -n applyforus

# Check Flagger logs
kubectl logs -n applyforus -l app=flagger | grep <service>

# Common causes:
# - Metrics not available
# - Thresholds not met
# - Load test failing
# - Health check failures
```

#### High Pod Restarts

```bash
# Check pod restart count
kubectl get pods -n applyforus -l app=<service>

# View logs from previous pod
kubectl logs <pod-name> -n applyforus --previous

# Common causes:
# - OOM kills (memory limit too low)
# - Liveness probe failures
# - Application crashes
# - Database connection pool exhaustion
```

### Debug Commands

```bash
# Get comprehensive pod information
kubectl get pods -n applyforus -o wide

# Describe pod with events
kubectl describe pod <pod-name> -n applyforus

# View logs (last 100 lines)
kubectl logs <pod-name> -n applyforus --tail=100

# View logs from all pods of a service
kubectl logs -n applyforus -l app=<service> --tail=50

# Follow logs in real-time
kubectl logs -f <pod-name> -n applyforus

# Execute command in pod
kubectl exec -it <pod-name> -n applyforus -- /bin/sh

# Port forward for local testing
kubectl port-forward -n applyforus <pod-name> 8080:<port>

# Check resource usage
kubectl top pods -n applyforus -l app=<service>

# Get events sorted by time
kubectl get events -n applyforus --sort-by='.lastTimestamp'
```

### Emergency Procedures

#### Scale Down Failing Service

```bash
kubectl scale deployment/<service> --replicas=0 -n applyforus
# Investigate, fix, then scale back up
kubectl scale deployment/<service> --replicas=2 -n applyforus
```

#### Force Delete Stuck Pod

```bash
kubectl delete pod <pod-name> -n applyforus --force --grace-period=0
```

#### Bypass PDB (Use with Caution)

```bash
# Only in emergencies - can cause downtime
kubectl delete pdb <service>-pdb -n applyforus
# Perform maintenance
# Recreate PDB
kubectl apply -f infrastructure/kubernetes/base/poddisruptionbudget.yaml
```

---

## Deployment Verification Checklist

After any deployment or rollback:

- [ ] All pods in Running state
- [ ] All pods pass readiness checks
- [ ] Services have endpoints
- [ ] HPA is functioning
- [ ] PDB is enforced
- [ ] Network policies allow required traffic
- [ ] No error logs in application
- [ ] Metrics are being collected
- [ ] External health checks pass
- [ ] User-facing functionality works

---

## Contacts & Escalation

- **Platform Team**: Immediate response for cluster issues
- **SRE On-Call**: 24/7 support for production incidents
- **Development Teams**: Application-specific issues

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-15 | Initial production-ready rollout strategy |

---

## References

- [Kubernetes Rolling Updates](https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/)
- [Pod Disruption Budgets](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Flagger Canary Deployments](https://docs.flagger.app/)
- [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
