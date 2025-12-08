# Runbook: ServiceDown Alert

## Alert Description
**Alert Name:** ServiceDown
**Severity:** Critical
**Category:** Availability

This alert fires when a service in the JobPilot platform is completely down and not responding to health checks.

## Symptoms
- Service pods are not responding to HTTP requests
- Health check endpoints returning errors or timing out
- Users unable to access specific features
- Dependent services may show cascading failures

## Impact
**User Impact:** High - Users cannot access the affected service's functionality
**Business Impact:** Critical - May prevent core platform operations

## Diagnosis

### Step 1: Check Pod Status
```bash
# Check if pods are running
kubectl get pods -n jobpilot -l app=<service-name>

# Get detailed pod status
kubectl describe pod <pod-name> -n jobpilot

# Check pod logs
kubectl logs <pod-name> -n jobpilot --tail=100
```

### Step 2: Check Recent Events
```bash
# Check recent Kubernetes events
kubectl get events -n jobpilot --sort-by='.lastTimestamp' | grep <service-name>
```

### Step 3: Check Resource Usage
```bash
# Check if pods are being killed due to resource limits
kubectl top pods -n jobpilot -l app=<service-name>
```

### Step 4: Check Application Logs
```bash
# Stream application logs
kubectl logs -f <pod-name> -n jobpilot

# Check for errors in Loki (if available)
# Go to Grafana -> Explore -> Loki
# Query: {namespace="jobpilot", pod=~"<service-name>.*"} |= "error"
```

## Resolution

### Quick Fix: Restart Service
```bash
# Restart the deployment
kubectl rollout restart deployment/<service-name> -n jobpilot

# Watch the rollout status
kubectl rollout status deployment/<service-name> -n jobpilot
```

### If Restart Doesn't Work

#### Check Configuration
```bash
# Verify ConfigMaps
kubectl get configmap -n jobpilot | grep <service-name>
kubectl describe configmap <config-name> -n jobpilot

# Verify Secrets
kubectl get secrets -n jobpilot | grep <service-name>
```

#### Check Dependencies
- Verify database connectivity
- Check Redis/cache availability
- Verify message queue connectivity
- Check external API availability

#### Scale Up Replicas (if needed)
```bash
# Temporarily increase replicas
kubectl scale deployment/<service-name> --replicas=3 -n jobpilot
```

#### Rollback to Previous Version
```bash
# Check rollout history
kubectl rollout history deployment/<service-name> -n jobpilot

# Rollback to previous version
kubectl rollout undo deployment/<service-name> -n jobpilot
```

## Root Cause Analysis

Common causes:
1. **Application Crash**
   - Check logs for unhandled exceptions
   - Review recent code deployments
   - Check for memory leaks

2. **Configuration Issues**
   - Verify environment variables
   - Check database connection strings
   - Validate API keys and credentials

3. **Resource Exhaustion**
   - Check CPU and memory limits
   - Review resource requests
   - Check for memory leaks

4. **Network Issues**
   - Verify service connectivity
   - Check DNS resolution
   - Review network policies

5. **Dependency Failures**
   - Database unavailable
   - Cache unavailable
   - External API failures

## Prevention

1. **Implement Circuit Breakers**
   - Add retry logic with exponential backoff
   - Implement timeout handling
   - Use fallback mechanisms

2. **Resource Management**
   - Set appropriate resource limits
   - Monitor resource usage trends
   - Implement auto-scaling

3. **Health Checks**
   - Ensure health checks are comprehensive
   - Include dependency checks in health endpoints
   - Set appropriate timeout values

4. **Deployment Safety**
   - Use rolling deployments
   - Implement readiness probes
   - Add pre-deployment validation

## Escalation

- **Level 1:** On-call engineer (immediate)
- **Level 2:** Service owner/team lead (if not resolved in 15 minutes)
- **Level 3:** Engineering manager (if not resolved in 30 minutes)

## Related Alerts
- HighErrorRate
- HighLatency
- PodCrashLooping
- DeploymentReplicaMismatch

## Additional Resources
- [Kubernetes Troubleshooting Guide](https://kubernetes.io/docs/tasks/debug/)
- [Service Architecture Documentation](../../docs/architecture.md)
- [Deployment Guide](../../docs/deployment/README.md)

## Recent Incidents
<!-- Log incidents here for reference -->
- None

## Notes
- Always check Grafana dashboards for service health metrics
- Review Loki logs for detailed error messages
- Document any new resolution steps discovered
