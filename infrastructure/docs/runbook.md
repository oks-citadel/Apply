# ApplyForUs Operations Runbook

## Quick Reference

### Essential Commands

```bash
# Get cluster credentials
az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-aks

# Check pod status
kubectl get pods -n applyforus

# Check service status
kubectl get svc -n applyforus

# View logs
kubectl logs -n applyforus -l app.kubernetes.io/name=<service-name> --tail=100

# Describe pod for debugging
kubectl describe pod <pod-name> -n applyforus

# Execute shell in pod
kubectl exec -it <pod-name> -n applyforus -- /bin/sh

# Port forward for debugging
kubectl port-forward svc/<service-name> 8080:8000 -n applyforus
```

### Helm Commands

```bash
# List releases
helm list -n applyforus

# Check release history
helm history applyforus -n applyforus

# Rollback to previous
helm rollback applyforus -n applyforus

# Upgrade/deploy
helm upgrade --install applyforus ./infrastructure/helm/app -n applyforus
```

## Common Operations

### 1. Scaling Services

#### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment web-app --replicas=5 -n applyforus

# Scale all deployments
kubectl scale deployment --all --replicas=3 -n applyforus
```

#### HPA Configuration

```bash
# Check HPA status
kubectl get hpa -n applyforus

# Describe HPA
kubectl describe hpa web-app -n applyforus

# Adjust HPA limits
kubectl patch hpa web-app -n applyforus --patch '{"spec":{"maxReplicas":10}}'
```

### 2. Restarting Services

```bash
# Rolling restart (zero downtime)
kubectl rollout restart deployment/<service-name> -n applyforus

# Restart all deployments
kubectl rollout restart deployment -n applyforus

# Check rollout status
kubectl rollout status deployment/<service-name> -n applyforus

# Rollback if issues
kubectl rollout undo deployment/<service-name> -n applyforus
```

### 3. Updating Configuration

#### ConfigMap Updates

```bash
# Edit configmap
kubectl edit configmap applyforus-config -n applyforus

# Apply from file
kubectl apply -f infrastructure/kubernetes/configmaps/app-config.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment -n applyforus
```

#### Secret Updates

```bash
# Create/update secret from literal
kubectl create secret generic app-secrets \
  --from-literal=key=value \
  -n applyforus \
  --dry-run=client -o yaml | kubectl apply -f -

# Sync from Key Vault (if using External Secrets)
kubectl annotate externalsecret app-secrets \
  force-sync=$(date +%s) -n applyforus
```

### 4. Database Operations

#### PostgreSQL

```bash
# Connect to PostgreSQL
kubectl exec -it postgresql-0 -n applyforus -- \
  psql -U applyforusadmin -d applyforus

# Check replication status
kubectl exec -it postgresql-0 -n applyforus -- \
  psql -U applyforusadmin -c "SELECT * FROM pg_stat_replication;"

# Backup database
kubectl exec -it postgresql-0 -n applyforus -- \
  pg_dump -U applyforusadmin applyforus > backup.sql
```

#### Redis

```bash
# Connect to Redis
kubectl exec -it redis-master-0 -n applyforus -- redis-cli

# Check Sentinel status
kubectl exec -it redis-node-0 -n applyforus -- \
  redis-cli -p 26379 SENTINEL masters

# Flush cache (caution!)
kubectl exec -it redis-master-0 -n applyforus -- \
  redis-cli FLUSHDB
```

## Incident Response

### Service Down (Single Service)

1. **Identify the issue**:
   ```bash
   kubectl get pods -n applyforus | grep <service>
   kubectl describe pod <pod-name> -n applyforus
   kubectl logs <pod-name> -n applyforus --tail=200
   ```

2. **Quick restart**:
   ```bash
   kubectl rollout restart deployment/<service-name> -n applyforus
   ```

3. **If restart fails, check resources**:
   ```bash
   kubectl top pods -n applyforus
   kubectl describe node <node-name>
   ```

4. **Rollback if recent deployment**:
   ```bash
   kubectl rollout undo deployment/<service-name> -n applyforus
   ```

### Complete Outage

1. **Check cluster health**:
   ```bash
   kubectl cluster-info
   kubectl get nodes
   kubectl get pods -n kube-system
   ```

2. **Check ingress**:
   ```bash
   kubectl get pods -n ingress-nginx
   kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
   ```

3. **Check database connectivity**:
   ```bash
   kubectl exec -it <any-pod> -n applyforus -- nc -zv postgresql 5432
   kubectl exec -it <any-pod> -n applyforus -- nc -zv redis-master 6379
   ```

4. **Verify network policies**:
   ```bash
   kubectl get networkpolicies -n applyforus
   kubectl describe networkpolicy default-deny -n applyforus
   ```

### High Latency

1. **Check service metrics**:
   ```bash
   kubectl top pods -n applyforus
   ```

2. **Check database performance**:
   ```bash
   # PostgreSQL slow queries
   kubectl exec -it postgresql-0 -n applyforus -- \
     psql -U applyforusadmin -c \
     "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

3. **Check Redis**:
   ```bash
   kubectl exec -it redis-master-0 -n applyforus -- \
     redis-cli INFO stats
   ```

4. **Scale if needed**:
   ```bash
   kubectl scale deployment/<service-name> --replicas=5 -n applyforus
   ```

### Database Connection Exhaustion

1. **Check current connections**:
   ```bash
   kubectl exec -it postgresql-0 -n applyforus -- \
     psql -U applyforusadmin -c \
     "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **Terminate idle connections**:
   ```bash
   kubectl exec -it postgresql-0 -n applyforus -- \
     psql -U applyforusadmin -c \
     "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '30 minutes';"
   ```

3. **Restart services to reset pools**:
   ```bash
   kubectl rollout restart deployment -n applyforus
   ```

## Deployment Procedures

### Standard Deployment

```bash
# 1. Build and push images
./scripts/deploy/setup-acr.sh build-push

# 2. Deploy application
./scripts/deploy/aks-deploy.sh -e prod app

# 3. Verify deployment
kubectl get pods -n applyforus
kubectl rollout status deployment -n applyforus
```

### Rollback Procedure

```bash
# 1. Check history
helm history applyforus -n applyforus

# 2. Rollback to specific revision
helm rollback applyforus <revision> -n applyforus

# 3. Verify
kubectl get pods -n applyforus
```

### Emergency Hotfix

```bash
# 1. Build specific service
./scripts/deploy/setup-acr.sh build -t hotfix-123

# 2. Update only affected service
kubectl set image deployment/<service-name> \
  <container-name>=applyforusacr.azurecr.io/applyai-<service>:hotfix-123 \
  -n applyforus

# 3. Monitor rollout
kubectl rollout status deployment/<service-name> -n applyforus
```

## Maintenance Tasks

### Certificate Renewal

```bash
# Check certificate status
kubectl get certificates -n applyforus
kubectl describe certificate applyforus-tls -n applyforus

# Force renewal (if needed)
kubectl delete secret applyforus-tls -n applyforus
```

### Node Maintenance

```bash
# Cordon node
kubectl cordon <node-name>

# Drain node
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# After maintenance, uncordon
kubectl uncordon <node-name>
```

### Log Collection

```bash
# Get logs from all pods
for pod in $(kubectl get pods -n applyforus -o name); do
  kubectl logs $pod -n applyforus --all-containers > "logs/${pod}.log"
done

# Get events
kubectl get events -n applyforus --sort-by='.lastTimestamp' > events.log
```

## Monitoring Alerts

### Critical Alerts Response

| Alert | Response |
|-------|----------|
| PodCrashLooping | Check logs, restart, or rollback |
| HighMemoryUsage | Scale up or check for memory leaks |
| DatabaseConnectionErrors | Check DB health, restart connection pools |
| HighErrorRate | Check logs, scale up, or rollback |
| IngressDown | Check ingress-nginx pods, DNS |
| CertificateExpiring | Renew certificates |

### Health Check URLs

| Service | Health Endpoint |
|---------|-----------------|
| Web | /api/health |
| Auth | /health |
| Job | /health |
| User | /health |
| AI | /health |

## Contact Information

| Role | Contact |
|------|---------|
| Platform Team | platform@applyforus.com |
| On-call | PagerDuty: applyforus-oncall |
| Azure Support | azure.microsoft.com/support |

## Escalation Matrix

| Severity | Response Time | Escalation |
|----------|---------------|------------|
| P1 (Critical) | 15 minutes | Immediate on-call |
| P2 (High) | 1 hour | Engineering lead |
| P3 (Medium) | 4 hours | Team channel |
| P4 (Low) | Next business day | Ticket queue |
