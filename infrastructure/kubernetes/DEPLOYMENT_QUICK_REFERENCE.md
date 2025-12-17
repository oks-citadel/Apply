# Kubernetes Deployment Quick Reference

## Quick Command Reference for ApplyForUs Platform

**Namespace:** `applyforus`

---

## Essential Commands

### Check Overall Status

```bash
# All deployments
kubectl get deployments -n applyforus

# All pods with status
kubectl get pods -n applyforus -o wide

# All services
kubectl get svc -n applyforus

# HPA status
kubectl get hpa -n applyforus

# PDB status
kubectl get pdb -n applyforus
```

### Service Health Checks

```bash
# Run verification script for all services
./infrastructure/kubernetes/scripts/verify-deployment.sh

# Verify specific service
./infrastructure/kubernetes/scripts/verify-deployment.sh auth-service

# Manual health check
POD=$(kubectl get pod -n applyforus -l app=auth-service -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n applyforus $POD -- curl http://localhost:4000/api/v1/health/ready
```

### Deployment Operations

```bash
# Apply deployment
kubectl apply -f infrastructure/kubernetes/production/auth-service-deployment.yaml -n applyforus

# Watch rollout
kubectl rollout status deployment/auth-service -n applyforus

# Check rollout history
kubectl rollout history deployment/auth-service -n applyforus

# Pause rollout
kubectl rollout pause deployment/auth-service -n applyforus

# Resume rollout
kubectl rollout resume deployment/auth-service -n applyforus
```

### Rollback Operations

```bash
# Quick rollback using script
./infrastructure/kubernetes/scripts/rollback-deployment.sh auth-service

# Manual rollback to previous version
kubectl rollout undo deployment/auth-service -n applyforus

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=3 -n applyforus
```

### Logs & Debugging

```bash
# View logs from all pods of a service
kubectl logs -n applyforus -l app=auth-service --tail=50

# Follow logs
kubectl logs -f -n applyforus -l app=auth-service

# View logs from previous pod (after crash)
kubectl logs -n applyforus <pod-name> --previous

# Get events
kubectl get events -n applyforus --sort-by='.lastTimestamp' | grep auth-service
```

### Scaling

```bash
# Manual scale
kubectl scale deployment/auth-service --replicas=3 -n applyforus

# View HPA metrics
kubectl get hpa auth-service-hpa -n applyforus -w

# Describe HPA
kubectl describe hpa auth-service-hpa -n applyforus
```

### Network & Security

```bash
# View network policies
kubectl get networkpolicies -n applyforus

# Describe specific policy
kubectl describe networkpolicy auth-service-policy -n applyforus

# Test connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot -n applyforus -- bash
# Inside pod: curl http://auth-service:4000/api/v1/health
```

---

## Service Matrix

| Service | Port | Health Path | Min Replicas | Max Replicas |
|---------|------|-------------|--------------|--------------|
| auth-service | 4000 | /api/v1/health/ready | 2 | 10 |
| user-service | 4004 | /api/v1/health/ready | 2 | 10 |
| job-service | 4002 | /api/v1/health/ready | 2 | 8 |
| ai-service | 5000 | /api/v1/health/ready | 2 | 6 |
| resume-service | 4001 | /api/v1/health/ready | 2 | 8 |
| analytics-service | 3007 | /api/v1/health/ready | 2 | 6 |
| notification-service | 4005 | /api/v1/health/ready | 2 | 8 |
| auto-apply-service | 4003 | /api/v1/health/ready | 2 | 10 |
| orchestrator-service | 3009 | /api/v1/health/ready | 2 | 8 |
| web-app | 3000 | / | 2 | 12 |

---

## Common Scenarios

### Deploy New Version

```bash
# 1. Apply changes
kubectl apply -f infrastructure/kubernetes/production/auth-service-deployment.yaml -n applyforus

# 2. Watch progress
kubectl rollout status deployment/auth-service -n applyforus

# 3. Verify health
./infrastructure/kubernetes/scripts/verify-deployment.sh auth-service
```

### Emergency Rollback

```bash
# Quick rollback
kubectl rollout undo deployment/auth-service -n applyforus

# Verify rollback
./infrastructure/kubernetes/scripts/verify-deployment.sh auth-service
```

### Debug Failing Pods

```bash
# Check pod status
kubectl get pods -n applyforus -l app=auth-service

# Describe pod
kubectl describe pod <pod-name> -n applyforus

# Check logs
kubectl logs <pod-name> -n applyforus --tail=100

# Execute shell
kubectl exec -it <pod-name> -n applyforus -- /bin/sh
```

### Scale for High Traffic

```bash
# Immediate scale
kubectl scale deployment/auth-service --replicas=5 -n applyforus

# HPA will scale down when traffic decreases
```

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods -n applyforus

# Node resource usage
kubectl top nodes

# Detailed pod metrics
kubectl top pods -n applyforus -l app=auth-service --containers
```

---

## Canary Deployments

### Monitor Canary

```bash
# Check canary status
kubectl describe canary/auth-service -n applyforus

# Watch canary events
kubectl get events -n applyforus --watch | grep canary

# Flagger logs
kubectl logs -n applyforus -l app=flagger -f | grep auth-service
```

### Manual Canary Control

```bash
# Promote canary manually
kubectl patch canary/auth-service -n applyforus --type merge -p '{"spec":{"analysis":{"threshold":0}}}'

# Rollback canary manually
kubectl patch canary/auth-service -n applyforus --type merge -p '{"spec":{"revertOnDeletion":true}}'
kubectl delete canary/auth-service -n applyforus
```

---

## Troubleshooting Guide

### Pod Stuck in Pending

```bash
kubectl describe pod <pod-name> -n applyforus
# Look for: resource constraints, image pull errors, PVC issues
```

### Readiness Probe Failing

```bash
# Check pod logs
kubectl logs <pod-name> -n applyforus

# Test health endpoint
kubectl exec <pod-name> -n applyforus -- curl http://localhost:4000/api/v1/health/ready

# Common causes: DB connection, Redis connection, initialization delay
```

### High CPU/Memory

```bash
# Check resource usage
kubectl top pods -n applyforus -l app=auth-service

# Check limits
kubectl describe deployment auth-service -n applyforus | grep -A 5 Limits

# Scale up or increase limits
```

### CrashLoopBackOff

```bash
# View logs from crashed pod
kubectl logs <pod-name> -n applyforus --previous

# Common causes: OOM kill, application error, config error
```

---

## Safety Checklist

Before any deployment:

- [ ] Review changes in staging
- [ ] Check health endpoints are working
- [ ] Verify resource limits are appropriate
- [ ] Confirm PDB and HPA are configured
- [ ] Review recent metrics for baseline
- [ ] Have rollback plan ready

After deployment:

- [ ] All pods running
- [ ] Health checks passing
- [ ] No errors in logs
- [ ] Metrics look normal
- [ ] User-facing functionality works

---

## Emergency Contacts

- **Platform Team**: Cluster issues
- **SRE On-Call**: Production incidents (24/7)
- **Dev Teams**: Application-specific issues

---

## Related Documentation

- Full guide: `infrastructure/kubernetes/ROLLOUT_ROLLBACK_STRATEGY.md`
- Scripts: `infrastructure/kubernetes/scripts/`
- Manifests: `infrastructure/kubernetes/production/`

---

## Script Usage

### Verify Deployment

```bash
# All services
./infrastructure/kubernetes/scripts/verify-deployment.sh

# Specific service
./infrastructure/kubernetes/scripts/verify-deployment.sh auth-service
```

### Rollback Deployment

```bash
# To previous version
./infrastructure/kubernetes/scripts/rollback-deployment.sh auth-service

# To specific revision
./infrastructure/kubernetes/scripts/rollback-deployment.sh auth-service 3
```

---

**Last Updated:** 2025-12-15
