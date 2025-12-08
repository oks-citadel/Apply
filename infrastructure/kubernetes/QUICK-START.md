# Kubernetes Quick Start Guide

## Quick Command Reference

### Validation

```bash
# Validate all manifests
./validate-manifests.sh

# Validate specific file
kubectl apply --dry-run=client -f services/auth-service.yaml

# Build and validate kustomization
kustomize build overlays/dev | kubectl apply --dry-run=client -f -
```

### Local Testing

```bash
# Full local deployment (Docker Desktop/Minikube/Kind)
./test-local.sh

# Check status
./test-local.sh status

# Cleanup
./test-local.sh cleanup
```

### Deployment

```bash
# Development
kustomize build overlays/dev | kubectl apply -f -

# Staging
kustomize build overlays/staging | kubectl apply -f -

# Production
kustomize build overlays/production | kubectl apply -f -

# Or using kubectl with kustomize
kubectl apply -k overlays/dev
kubectl apply -k overlays/staging
kubectl apply -k overlays/production
```

### Monitoring

```bash
# Check deployment status
kubectl get pods -n jobpilot -w

# View logs
kubectl logs -f deployment/auth-service -n jobpilot

# Check all resources
kubectl get all -n jobpilot

# Describe resource
kubectl describe pod <pod-name> -n jobpilot

# View events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'
```

### Port Forwarding

```bash
# Web App
kubectl port-forward -n jobpilot svc/web-app 3000:3000

# Auth Service
kubectl port-forward -n jobpilot svc/auth-service 3001:3001

# Prometheus
kubectl port-forward -n jobpilot svc/prometheus 9090:9090

# Grafana
kubectl port-forward -n jobpilot svc/grafana 3000:3000
```

### Debugging

```bash
# Get shell in pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/sh

# Run debug container
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n jobpilot

# Check resource usage
kubectl top pods -n jobpilot
kubectl top nodes

# View pod logs (previous instance)
kubectl logs <pod-name> -n jobpilot --previous
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=5 -n jobpilot

# View HPA status
kubectl get hpa -n jobpilot

# Check autoscaling events
kubectl describe hpa auth-service-hpa -n jobpilot
```

### Updates

```bash
# Update image tag
kubectl set image deployment/auth-service auth-service=jobpilotacr.azurecr.io/auth-service:v1.0.1 -n jobpilot

# Rollout status
kubectl rollout status deployment/auth-service -n jobpilot

# Rollback
kubectl rollout undo deployment/auth-service -n jobpilot

# View rollout history
kubectl rollout history deployment/auth-service -n jobpilot
```

### Cleanup

```bash
# Delete specific service
kubectl delete -f services/auth-service.yaml -n jobpilot

# Delete all services
kustomize build overlays/dev | kubectl delete -f -

# Delete namespace (deletes everything)
kubectl delete namespace jobpilot-dev
```

## File Structure

```
infrastructure/kubernetes/
├── base/                          # Base configurations
│   ├── namespace.yaml            # Namespace definition
│   ├── configmap.yaml            # Application config
│   ├── secrets.yaml              # Secret management
│   ├── ingress.yaml              # Ingress + TLS
│   ├── networkpolicy.yaml        # Network policies
│   ├── poddisruptionbudget.yaml  # High availability
│   ├── resourcequota.yaml        # Resource limits
│   └── serviceaccount.yaml       # RBAC
│
├── services/                      # Service deployments
│   ├── auth-service.yaml         # Authentication
│   ├── user-service.yaml         # User management
│   ├── job-service.yaml          # Job listings
│   ├── ai-service.yaml           # AI features
│   ├── resume-service.yaml       # Resume processing
│   ├── analytics-service.yaml    # Analytics
│   ├── notification-service.yaml # Notifications
│   ├── auto-apply-service.yaml   # Auto-apply
│   ├── orchestrator-service.yaml # Orchestration
│   └── web-app.yaml             # Frontend
│
├── monitoring/                    # Monitoring stack
│   ├── prometheus.yaml           # Metrics collection
│   ├── grafana.yaml              # Dashboards
│   └── alertmanager.yaml         # Alerting
│
├── overlays/                      # Environment configs
│   ├── dev/                      # Development
│   ├── staging/                  # Staging
│   └── production/               # Production
│
├── kustomization.yaml            # Root kustomization
├── validate-manifests.sh         # Validation script
├── test-local.sh                 # Local testing script
├── TESTING-GUIDE.md              # Full testing guide
├── VALIDATION-REPORT.md          # Validation results
└── QUICK-START.md                # This file
```

## Service Ports

| Service | Port | Health Check |
|---------|------|--------------|
| web-app | 3000 | /api/health |
| auth-service | 3001 | /health |
| user-service | 3002 | /health |
| job-service | 3003 | /health |
| ai-service | 3004 | /health |
| resume-service | 3005 | /health |
| analytics-service | 3006 | /health |
| notification-service | 3007 | /health |
| auto-apply-service | 3008 | /health |
| orchestrator-service | 3009 | /health/live |

## Common Issues

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n jobpilot

# Check logs
kubectl logs <pod-name> -n jobpilot

# Check events
kubectl get events -n jobpilot
```

### Image Pull Errors

```bash
# Check image pull secrets
kubectl get secrets -n jobpilot

# Verify ACR access
az acr login --name jobpilotacr
```

### Service Not Accessible

```bash
# Check endpoints
kubectl get endpoints <service-name> -n jobpilot

# Test from another pod
kubectl run -it --rm debug --image=busybox --restart=Never -n jobpilot -- wget -O- http://<service-name>:port/health
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pods -n jobpilot -l app=postgres

# Check connection from service
kubectl exec -it deployment/auth-service -n jobpilot -- env | grep POSTGRES
```

## Environment Variables

### Required in ConfigMap

- `NODE_ENV`: production/staging/development
- `LOG_LEVEL`: debug/info/warn/error
- `POSTGRES_HOST`: Database host
- `POSTGRES_PORT`: Database port (5432)
- `POSTGRES_DB`: Database name
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port (6379/6380)
- Service URLs (AUTH_SERVICE_URL, etc.)

### Required in Secrets

- `POSTGRES_USER`: Database username
- `POSTGRES_PASSWORD`: Database password
- `REDIS_PASSWORD`: Redis password
- `JWT_SECRET`: JWT signing key
- `JWT_REFRESH_SECRET`: Refresh token key
- `AZURE_STORAGE_CONNECTION_STRING`: Azure Storage
- `AZURE_OPENAI_API_KEY`: OpenAI API key
- OAuth credentials (Google, LinkedIn)
- Email credentials (SMTP)

## Next Steps

1. ✅ **Validate:** Run `./validate-manifests.sh`
2. ✅ **Test Locally:** Run `./test-local.sh`
3. ⚠️ **Build Images:** Build and push to ACR
4. ⚠️ **Configure Secrets:** Set up Azure Key Vault
5. ⚠️ **Deploy:** Use appropriate overlay for environment
6. ⚠️ **Monitor:** Check Prometheus/Grafana
7. ⚠️ **Verify:** Run smoke tests

## Resources

- Full Guide: [TESTING-GUIDE.md](TESTING-GUIDE.md)
- Validation Report: [VALIDATION-REPORT.md](VALIDATION-REPORT.md)
- Kubernetes Docs: https://kubernetes.io/docs/
- Kustomize Docs: https://kustomize.io/
