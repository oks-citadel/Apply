# Health Check Quick Reference Guide

## Service Health Check Endpoints

| Service | Port | Basic Health | Liveness | Readiness |
|---------|------|-------------|----------|-----------|
| auth-service | 4000 | `/health` | `/health/live` | `/health/ready` |
| user-service | 4004 | `/health` | `/health/live` | `/health/ready` |
| job-service | 4002 | `/health` | `/health/live` | `/health/ready` |
| resume-service | 4001 | `/health` | `/health/live` | `/health/ready` |
| ai-service | 5000 | `/health` | `/health/live` | `/health/ready` |
| notification-service | 4005 | `/health` | `/health/live` | `/health/ready` |
| auto-apply-service | 4003 | `/health` | `/health/live` | `/health/ready` |
| analytics-service | 3007 | `/health` | `/health/live` | `/health/ready` |
| orchestrator-service | 3009 | `/health` | `/health/live` | `/health/ready` |
| web-app | 3000 | `/api/health` | `/api/health/live` | `/api/health/ready` |

## Quick Test Commands

### Test All Services Locally
```bash
# Auth Service
curl http://localhost:4000/health/ready

# User Service
curl http://localhost:4004/health/ready

# Job Service
curl http://localhost:4002/health/ready

# Resume Service
curl http://localhost:4001/health/ready

# AI Service
curl http://localhost:5000/health/ready

# Notification Service
curl http://localhost:4005/health/ready

# Auto Apply Service
curl http://localhost:4003/health/ready

# Analytics Service
curl http://localhost:3007/health/ready

# Orchestrator Service
curl http://localhost:3009/health/ready

# Web App
curl http://localhost:3000/api/health/ready
```

### Test in Kubernetes
```bash
# Check all pods
kubectl get pods -n jobpilot

# Check specific service
kubectl describe pod <pod-name> -n jobpilot

# Port forward and test
kubectl port-forward -n jobpilot svc/auth-service 4000:4000
curl http://localhost:4000/health/ready
```

## Implementation Status

### ✅ Fully Implemented (4)
- auth-service
- user-service
- job-service
- orchestrator-service

### ✅ Newly Implemented (3)
- resume-service
- analytics-service
- web-app

### ✅ Enhanced (3)
- notification-service
- auto-apply-service
- ai-service

## Dependencies Checked

| Service | Database | Redis | Elasticsearch | Other |
|---------|----------|-------|---------------|-------|
| auth-service | ✅ | ❌ | ❌ | - |
| user-service | ✅ | ❌ | ❌ | - |
| job-service | ✅ | ✅ | ✅ | - |
| resume-service | ✅ | ❌ | ❌ | - |
| ai-service | ❌ | ❌ | ❌ | LLM, Embeddings, Vector Store |
| notification-service | ✅ | ✅ | ❌ | - |
| auto-apply-service | ✅ | ✅ | ❌ | - |
| analytics-service | ✅ | ❌ | ❌ | - |
| orchestrator-service | ❌ | ❌ | ❌ | Memory, Disk |
| web-app | ❌ | ❌ | ❌ | Environment, Memory |

## Common Issues & Solutions

### Issue: Readiness Probe Failing
```bash
# Check pod status
kubectl describe pod <pod-name> -n jobpilot

# View logs
kubectl logs <pod-name> -n jobpilot

# Test endpoint directly
kubectl port-forward <pod-name> 8080:<port>
curl http://localhost:8080/health/ready
```

**Common Causes:**
- Database not connected
- Redis not available
- Service not fully initialized

### Issue: Pod Restarting (Liveness Failing)
```bash
# Check events
kubectl get events -n jobpilot --field-selector involvedObject.name=<pod-name>

# View previous logs
kubectl logs <pod-name> -n jobpilot --previous
```

**Common Causes:**
- Application crash
- Memory limit exceeded
- Deadlock

## Files Modified/Created

### Notification Service
- ✅ Created: `services/notification-service/src/health/health.service.ts`
- ✅ Updated: `services/notification-service/src/health/health.controller.ts`
- ✅ Updated: `services/notification-service/src/health/health.module.ts`

### Auto Apply Service
- ✅ Created: `services/auto-apply-service/src/health/health.service.ts`
- ✅ Created: `services/auto-apply-service/src/health/health.module.ts`
- ✅ Updated: `services/auto-apply-service/src/health.controller.ts`
- ✅ Updated: `services/auto-apply-service/src/app.module.ts`

### Resume Service
- ✅ Created: `services/resume-service/src/health/health.controller.ts`
- ✅ Created: `services/resume-service/src/health/health.service.ts`
- ✅ Created: `services/resume-service/src/health/health.module.ts`
- ✅ Updated: `services/resume-service/src/app.module.ts`

### Analytics Service
- ✅ Created: `services/analytics-service/src/health/health.controller.ts`
- ✅ Created: `services/analytics-service/src/health/health.service.ts`
- ✅ Created: `services/analytics-service/src/health/health.module.ts`
- ✅ Updated: `services/analytics-service/src/app.module.ts`

### AI Service
- ✅ Updated: `services/ai-service/src/main.py`

### Web App
- ✅ Created: `apps/web/src/app/api/health/route.ts`
- ✅ Created: `apps/web/src/app/api/health/live/route.ts`
- ✅ Created: `apps/web/src/app/api/health/ready/route.ts`
- ✅ Created: `apps/web/src/app/api/ready/route.ts`

### Kubernetes Manifests (All Updated)
- ✅ `infrastructure/kubernetes/services/auth-service.yaml`
- ✅ `infrastructure/kubernetes/services/user-service.yaml`
- ✅ `infrastructure/kubernetes/services/job-service.yaml`
- ✅ `infrastructure/kubernetes/services/resume-service.yaml`
- ✅ `infrastructure/kubernetes/services/ai-service.yaml`
- ✅ `infrastructure/kubernetes/services/notification-service.yaml`
- ✅ `infrastructure/kubernetes/services/auto-apply-service.yaml`
- ✅ `infrastructure/kubernetes/services/analytics-service.yaml`
- ✅ `infrastructure/kubernetes/services/web-app.yaml`
- ✅ `infrastructure/kubernetes/services/orchestrator-service.yaml` (already compliant)

## Next Steps

1. **Deploy to Development**
   ```bash
   kubectl apply -f infrastructure/kubernetes/services/
   ```

2. **Verify Health Checks**
   ```bash
   kubectl get pods -n jobpilot
   kubectl describe pods -n jobpilot | grep -A 5 "Liveness\|Readiness"
   ```

3. **Monitor for Issues**
   ```bash
   kubectl get events -n jobpilot --watch
   ```

4. **Set Up Alerts**
   - Configure Prometheus alerts for health check failures
   - Set up Grafana dashboards for health metrics

## Documentation

For detailed information, see:
- `HEALTH_CHECK_IMPLEMENTATION_SUMMARY.md` - Comprehensive implementation details
- Service-specific README files in each service directory
- Kubernetes manifests in `infrastructure/kubernetes/services/`
