# Kubernetes Deployment Testing Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Validation](#validation)
3. [Local Testing](#local-testing)
4. [Environment-Specific Deployments](#environment-specific-deployments)
5. [Monitoring Setup](#monitoring-setup)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Prerequisites

### Required Tools

1. **kubectl** (v1.25+)
   ```bash
   # Install kubectl
   # macOS
   brew install kubectl

   # Linux
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

   # Windows
   choco install kubernetes-cli
   ```

2. **kustomize** (v5.0+)
   ```bash
   # Install kustomize
   # macOS
   brew install kustomize

   # Linux
   curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash

   # Windows
   choco install kustomize
   ```

3. **kubeval** (optional, for enhanced validation)
   ```bash
   # Install kubeval
   # macOS
   brew install kubeval

   # Linux
   wget https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz
   tar xf kubeval-linux-amd64.tar.gz
   sudo mv kubeval /usr/local/bin
   ```

4. **helm** (v3.0+, for local testing)
   ```bash
   # Install helm
   # macOS
   brew install helm

   # Linux
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

   # Windows
   choco install kubernetes-helm
   ```

### Local Kubernetes Options

Choose one of the following for local testing:

1. **Docker Desktop** (Recommended for Windows/macOS)
   - Enable Kubernetes in Docker Desktop settings
   - Allocate at least 8GB RAM and 4 CPUs

2. **Minikube**
   ```bash
   # Install minikube
   brew install minikube  # macOS

   # Start with sufficient resources
   minikube start --cpus=4 --memory=8192 --disk-size=50g
   ```

3. **Kind** (Kubernetes in Docker)
   ```bash
   # Install kind
   brew install kind  # macOS

   # Create cluster
   kind create cluster --name jobpilot-test
   ```

## Validation

### 1. Validate YAML Syntax

Run the validation script to check all manifests:

```bash
cd infrastructure/kubernetes
chmod +x validate-manifests.sh
./validate-manifests.sh
```

The script checks for:
- YAML syntax errors
- Kubernetes API compatibility
- Missing resource limits
- Missing health probes
- Potential security issues

### 2. Manual Validation

Validate individual files:

```bash
# Validate a single file
kubectl apply --dry-run=client -f base/configmap.yaml

# Validate with kubeval
kubeval --strict base/configmap.yaml

# Validate kustomization build
kustomize build overlays/dev | kubectl apply --dry-run=client -f -
```

### 3. Validation Checklist

- [ ] All YAML files have valid syntax
- [ ] All Deployments have resource requests and limits
- [ ] All Deployments have liveness and readiness probes
- [ ] All Services have matching selectors with Deployments
- [ ] All ConfigMaps and Secrets are referenced correctly
- [ ] All images have valid registry paths and tags
- [ ] Network policies allow required traffic
- [ ] Ingress rules are correctly configured
- [ ] PodDisruptionBudgets match deployment replicas
- [ ] HorizontalPodAutoscalers reference valid deployments

## Local Testing

### Quick Start

Run the local testing script:

```bash
cd infrastructure/kubernetes
chmod +x test-local.sh
./test-local.sh
```

This script will:
1. Detect your local Kubernetes environment
2. Create a test namespace
3. Deploy PostgreSQL and Redis
4. Deploy all JobPilot services
5. Run smoke tests
6. Display access instructions

### Manual Local Deployment

#### 1. Create Namespace

```bash
kubectl create namespace jobpilot-local
kubectl config set-context --current --namespace=jobpilot-local
```

#### 2. Create Secrets

```bash
# Create local secrets (for testing only!)
kubectl create secret generic jobpilot-secrets \
  --from-literal=POSTGRES_USER=jobpilot \
  --from-literal=POSTGRES_PASSWORD=local_dev_password \
  --from-literal=REDIS_PASSWORD=local_redis_password \
  --from-literal=JWT_SECRET=local_jwt_secret \
  --from-literal=JWT_REFRESH_SECRET=local_jwt_refresh_secret \
  -n jobpilot-local
```

#### 3. Deploy Dependencies

```bash
# Deploy PostgreSQL
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --set auth.username=jobpilot \
  --set auth.password=local_dev_password \
  --set auth.database=jobpilot \
  -n jobpilot-local

# Deploy Redis
helm install redis bitnami/redis \
  --set auth.password=local_redis_password \
  -n jobpilot-local
```

#### 4. Deploy Services

```bash
# Using kustomize overlay
kustomize build overlays/dev | kubectl apply -f -

# Or apply individual services
kubectl apply -f services/auth-service.yaml -n jobpilot-local
kubectl apply -f services/user-service.yaml -n jobpilot-local
# ... repeat for all services
```

#### 5. Verify Deployment

```bash
# Check pod status
kubectl get pods -n jobpilot-local

# Check services
kubectl get svc -n jobpilot-local

# Check logs
kubectl logs -f deployment/auth-service -n jobpilot-local

# Describe pod for troubleshooting
kubectl describe pod <pod-name> -n jobpilot-local
```

#### 6. Access Services

```bash
# Port forward to access services locally
kubectl port-forward -n jobpilot-local svc/web-app 3000:3000
kubectl port-forward -n jobpilot-local svc/auth-service 3001:3001
kubectl port-forward -n jobpilot-local svc/postgres-postgresql 5432:5432
kubectl port-forward -n jobpilot-local svc/redis-master 6379:6379
```

Then access:
- Web App: http://localhost:3000
- Auth API: http://localhost:3001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Running Tests

```bash
# Smoke tests
kubectl get pods -n jobpilot-local --field-selector=status.phase=Running

# Health check
kubectl exec -it deployment/auth-service -n jobpilot-local -- curl http://localhost:3001/health

# Database connection
kubectl exec -it deployment/auth-service -n jobpilot-local -- env | grep POSTGRES
```

### Cleanup

```bash
# Delete namespace and all resources
kubectl delete namespace jobpilot-local

# Or use the script
./test-local.sh cleanup jobpilot-local
```

## Environment-Specific Deployments

### Development Environment

```bash
# Build and preview
kustomize build overlays/dev

# Deploy
kustomize build overlays/dev | kubectl apply -f -

# Verify
kubectl get all -n jobpilot-dev
```

Features:
- Single replica for most services
- Reduced resource limits
- Debug logging enabled
- Relaxed security for easier development

### Staging Environment

```bash
# Build and preview
kustomize build overlays/staging

# Deploy
kustomize build overlays/staging | kubectl apply -f -

# Verify
kubectl get all -n jobpilot-staging
```

Features:
- 2 replicas for critical services
- Production-like configuration
- Info-level logging
- Full security enabled

### Production Environment

```bash
# Build and preview
kustomize build overlays/production

# Deploy (use with caution!)
kustomize build overlays/production | kubectl apply -f -

# Verify
kubectl get all -n jobpilot
```

Features:
- High availability (3+ replicas)
- Full resource limits
- Production logging
- Complete monitoring
- Network policies enforced
- PodDisruptionBudgets configured

## Monitoring Setup

### Deploy Monitoring Stack

```bash
# Deploy Prometheus
kubectl apply -f monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana.yaml

# Deploy Alertmanager
kubectl apply -f monitoring/alertmanager.yaml

# Verify monitoring services
kubectl get all -n jobpilot -l app=prometheus
kubectl get all -n jobpilot -l app=grafana
kubectl get all -n jobpilot -l app=alertmanager
```

### Access Monitoring Tools

```bash
# Port forward Prometheus
kubectl port-forward -n jobpilot svc/prometheus 9090:9090

# Port forward Grafana
kubectl port-forward -n jobpilot svc/grafana 3000:3000

# Port forward Alertmanager
kubectl port-forward -n jobpilot svc/alertmanager 9093:9093
```

Access:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000 (admin/changeme-in-production)
- Alertmanager: http://localhost:9093

### Configure Alerts

Edit `monitoring/prometheus.yaml` to customize alert rules:

```yaml
# Example: Add custom alert
- alert: HighDatabaseConnections
  expr: pg_stat_database_numbackends > 100
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High database connection count"
    description: "Database has {{ $value }} active connections"
```

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n jobpilot

# Check events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Describe pod
kubectl describe pod <pod-name> -n jobpilot

# Check logs
kubectl logs <pod-name> -n jobpilot
kubectl logs <pod-name> -n jobpilot --previous  # Previous instance
```

Common causes:
- Image pull errors (check registry access)
- Resource constraints (check node resources)
- ConfigMap/Secret not found
- Invalid environment variables

#### 2. Service Not Accessible

```bash
# Check service endpoints
kubectl get endpoints <service-name> -n jobpilot

# Check service configuration
kubectl describe svc <service-name> -n jobpilot

# Test service from another pod
kubectl run -it --rm debug --image=busybox --restart=Never -n jobpilot -- wget -O- http://<service-name>:port/health
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pods -n jobpilot -l app=postgres

# Test connection from service pod
kubectl exec -it deployment/auth-service -n jobpilot -- env | grep POSTGRES
kubectl exec -it deployment/auth-service -n jobpilot -- nc -zv postgres 5432
```

#### 4. High Resource Usage

```bash
# Check resource usage
kubectl top pods -n jobpilot
kubectl top nodes

# Check resource limits
kubectl describe pod <pod-name> -n jobpilot | grep -A 5 Limits
```

### Debug Commands

```bash
# Get shell in running pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/sh

# Run temporary debug pod
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -n jobpilot

# Check DNS resolution
kubectl exec -it <pod-name> -n jobpilot -- nslookup auth-service

# Check network connectivity
kubectl exec -it <pod-name> -n jobpilot -- curl http://auth-service:3001/health

# View all resources in namespace
kubectl get all -n jobpilot

# Export resource for inspection
kubectl get deployment auth-service -n jobpilot -o yaml > auth-service-current.yaml
```

## Best Practices

### 1. Resource Management

- Always set resource requests and limits
- Use HorizontalPodAutoscaler for scalability
- Monitor resource usage regularly
- Set appropriate PodDisruptionBudgets

### 2. Security

- Use secrets for sensitive data
- Enable Pod Security Standards
- Implement Network Policies
- Run containers as non-root
- Use read-only root filesystems
- Drop all capabilities

### 3. Health Checks

- Configure liveness probes (detect crashed containers)
- Configure readiness probes (detect if ready to serve traffic)
- Use appropriate timeouts and thresholds
- Test health endpoints separately

### 4. Logging and Monitoring

- Implement structured logging
- Use consistent log levels
- Export metrics in Prometheus format
- Set up alerts for critical issues
- Monitor resource usage trends

### 5. Deployment Strategy

- Use rolling updates
- Test in dev/staging before production
- Keep rollback capability
- Use version tags (not 'latest')
- Implement gradual rollouts

### 6. Configuration Management

- Use kustomize for environment variations
- Never hardcode secrets
- Use ConfigMaps for configuration
- Document all configuration options
- Version control all manifests

### 7. Disaster Recovery

- Regular backup of persistent data
- Document recovery procedures
- Test backup restoration
- Maintain disaster recovery runbooks
- Keep configuration in version control

## Additional Resources

- [Kubernetes Official Documentation](https://kubernetes.io/docs/)
- [Kustomize Documentation](https://kustomize.io/)
- [Helm Documentation](https://helm.sh/docs/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

## Support

For issues or questions:
1. Check logs: `kubectl logs <pod-name> -n jobpilot`
2. Review events: `kubectl get events -n jobpilot`
3. Consult this guide's troubleshooting section
4. Contact the DevOps team
