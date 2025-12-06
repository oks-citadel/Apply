# JobPilot Kubernetes Quick Start Guide

## Quick Deploy (Production)

```bash
# 1. Login to Azure and get AKS credentials
az login
az aks get-credentials --resource-group jobpilot-rg --name jobpilot-aks

# 2. Update configuration files with your values
# - base/configmap.yaml (database hosts, Redis hosts, domains)
# - base/secrets.yaml (Azure tenant ID, managed identity)
# - base/ingress.yaml (domain names, email)

# 3. Run the deployment script
chmod +x deploy.sh
./deploy.sh
```

## Quick Commands

### View Status
```bash
# All pods
kubectl get pods -n jobpilot

# All services
kubectl get svc -n jobpilot

# All deployments
kubectl get deployments -n jobpilot

# Ingress
kubectl get ingress -n jobpilot

# HPA status
kubectl get hpa -n jobpilot
```

### View Logs
```bash
# Logs for a service (all pods)
kubectl logs -n jobpilot -l app=auth-service --tail=100 -f

# Logs for specific pod
kubectl logs -n jobpilot <pod-name> -f

# Logs from previous container (if crashed)
kubectl logs -n jobpilot <pod-name> --previous
```

### Scale Services
```bash
# Manual scaling
kubectl scale deployment auth-service -n jobpilot --replicas=5

# Check HPA status
kubectl describe hpa auth-service-hpa -n jobpilot
```

### Update Deployment
```bash
# Update image
kubectl set image deployment/auth-service \
  auth-service=jobpilotacr.azurecr.io/auth-service:v1.1.0 \
  -n jobpilot

# Check rollout status
kubectl rollout status deployment/auth-service -n jobpilot

# Restart deployment (useful after config changes)
kubectl rollout restart deployment/auth-service -n jobpilot
```

### Rollback
```bash
# View rollout history
kubectl rollout history deployment/auth-service -n jobpilot

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n jobpilot

# Rollback to specific revision
kubectl rollout undo deployment/auth-service -n jobpilot --to-revision=2

# Or use the rollback script
chmod +x rollback.sh
./rollback.sh rollback auth-service
```

### Debugging
```bash
# Describe pod (view events)
kubectl describe pod <pod-name> -n jobpilot

# Execute command in pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/sh

# Port forward to local machine
kubectl port-forward -n jobpilot service/auth-service 3001:3001

# View events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods -n jobpilot
kubectl top nodes
```

### Configuration Updates
```bash
# Update ConfigMap
kubectl edit configmap jobpilot-config -n jobpilot
# Then restart deployments to pick up changes
kubectl rollout restart deployment --all -n jobpilot

# Update Secrets (if not using Key Vault)
kubectl edit secret jobpilot-secrets -n jobpilot
# Then restart deployments
kubectl rollout restart deployment --all -n jobpilot
```

### Network Troubleshooting
```bash
# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n jobpilot \
  -- wget -O- http://auth-service:3001/health

# Check network policies
kubectl get networkpolicies -n jobpilot

# Describe network policy
kubectl describe networkpolicy auth-service-policy -n jobpilot
```

### Certificate Issues
```bash
# Check certificate status
kubectl describe certificate jobpilot-tls-cert -n jobpilot

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Manually trigger certificate renewal
kubectl delete certificate jobpilot-tls-cert -n jobpilot
kubectl apply -f base/ingress.yaml
```

## Service-Specific Commands

### Auth Service
```bash
kubectl logs -n jobpilot -l app=auth-service --tail=50
kubectl describe deployment auth-service -n jobpilot
kubectl get pods -n jobpilot -l app=auth-service
```

### AI Service
```bash
kubectl logs -n jobpilot -l app=ai-service --tail=50
kubectl top pods -n jobpilot -l app=ai-service
```

### Web App
```bash
kubectl logs -n jobpilot -l app=web-app --tail=50
kubectl port-forward -n jobpilot service/web-app 3000:3000
```

## Using Kustomize

```bash
# Deploy using kustomize
kubectl apply -k .

# View what will be applied
kubectl kustomize .

# Delete using kustomize
kubectl delete -k .
```

## Emergency Procedures

### Complete Rollback
```bash
# Rollback all services
./rollback.sh rollback-all
```

### Scale Down Everything
```bash
kubectl scale deployment --all -n jobpilot --replicas=0
```

### Scale Up Everything
```bash
kubectl scale deployment --all -n jobpilot --replicas=2
```

### Restart All Services
```bash
kubectl rollout restart deployment --all -n jobpilot
```

### Delete and Redeploy
```bash
# Delete all resources
kubectl delete namespace jobpilot

# Redeploy
./deploy.sh
```

## Monitoring Queries

### Find Failing Pods
```bash
kubectl get pods -n jobpilot --field-selector=status.phase!=Running
```

### Find Pods with Restarts
```bash
kubectl get pods -n jobpilot --sort-by='.status.containerStatuses[0].restartCount'
```

### Resource Usage by Service
```bash
kubectl top pods -n jobpilot --sort-by=memory
kubectl top pods -n jobpilot --sort-by=cpu
```

## Common Issues

### Pod Won't Start
```bash
# Check pod events
kubectl describe pod <pod-name> -n jobpilot

# Check if image exists
kubectl get pod <pod-name> -n jobpilot -o jsonpath='{.status.containerStatuses[*].image}'

# Check if secrets/configmaps exist
kubectl get configmap jobpilot-config -n jobpilot
kubectl get secret jobpilot-secrets -n jobpilot
```

### Service Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n jobpilot

# Check if pods are ready
kubectl get pods -n jobpilot -l app=auth-service

# Test service internally
kubectl run -it --rm debug --image=busybox --restart=Never -n jobpilot \
  -- wget -O- http://auth-service:3001/health
```

### Ingress Not Working
```bash
# Check ingress status
kubectl describe ingress jobpilot-ingress -n jobpilot

# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx --tail=100
```

### High Memory/CPU
```bash
# Check resource usage
kubectl top pods -n jobpilot

# Check HPA status (will auto-scale)
kubectl get hpa -n jobpilot

# Manually scale if needed
kubectl scale deployment <service-name> -n jobpilot --replicas=5
```

## Useful Aliases

Add these to your `~/.bashrc` or `~/.zshrc`:

```bash
# Kubernetes namespace shortcut
alias kn='kubectl -n jobpilot'

# Common commands
alias kgp='kubectl get pods -n jobpilot'
alias kgs='kubectl get svc -n jobpilot'
alias kgd='kubectl get deployments -n jobpilot'
alias kgi='kubectl get ingress -n jobpilot'
alias kl='kubectl logs -n jobpilot'
alias kd='kubectl describe -n jobpilot'
alias ke='kubectl exec -it -n jobpilot'
alias kdel='kubectl delete -n jobpilot'

# Watch pods
alias kwp='watch kubectl get pods -n jobpilot'
```

## Additional Resources

- Full documentation: [README.md](./README.md)
- Kubernetes docs: https://kubernetes.io/docs/
- Azure AKS docs: https://docs.microsoft.com/en-us/azure/aks/
