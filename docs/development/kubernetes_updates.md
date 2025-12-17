# Kubernetes Updates for ApplyforUs Rebranding

This document details all Kubernetes manifest updates required for the rebranding from JobPilot to ApplyforUs.

---

## Summary

- **Kubernetes manifest files:** 45+
- **Namespace updates:** 1 (but used in all resources)
- **ConfigMap updates:** Multiple
- **Secret updates:** Multiple
- **Service updates:** 10
- **Deployment updates:** 10
- **Ingress updates:** Multiple

---

## 1. Namespace Configuration

### File: `infrastructure/kubernetes/base/namespace.yaml`

#### Current:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jobpilot
  labels:
    name: jobpilot
    environment: production
    app: jobpilot-platform
```

#### Updated:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: applyforus
  labels:
    name: applyforus
    environment: production
    app: applyforus-platform
```

#### Changes:
- ✓ Namespace name: `jobpilot` → `applyforus`
- ✓ Label: `name: jobpilot` → `name: applyforus`
- ✓ Label: `app: jobpilot-platform` → `app: applyforus-platform`

---

## 2. ConfigMap Updates

### File: `infrastructure/kubernetes/base/configmap.yaml`

#### Current Configuration (Critical Sections):
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jobpilot-config
  namespace: jobpilot
  labels:
    app: jobpilot-platform
data:
  # Database Configuration
  POSTGRES_HOST: "jobpilot-postgres.postgres.database.azure.com"
  POSTGRES_DB: "jobpilot"

  # Redis Configuration
  REDIS_HOST: "jobpilot-redis.redis.cache.windows.net"

  # Service URLs (Internal)
  AUTH_SERVICE_URL: "http://auth-service.jobpilot.svc.cluster.local:3001"
  USER_SERVICE_URL: "http://user-service.jobpilot.svc.cluster.local:3002"
  JOB_SERVICE_URL: "http://job-service.jobpilot.svc.cluster.local:3003"
  AI_SERVICE_URL: "http://ai-service.jobpilot.svc.cluster.local:3004"
  RESUME_SERVICE_URL: "http://resume-service.jobpilot.svc.cluster.local:3005"
  ANALYTICS_SERVICE_URL: "http://analytics-service.jobpilot.svc.cluster.local:3006"
  NOTIFICATION_SERVICE_URL: "http://notification-service.jobpilot.svc.cluster.local:3007"
  AUTO_APPLY_SERVICE_URL: "http://auto-apply-service.jobpilot.svc.cluster.local:3008"

  # Azure Configuration
  AZURE_STORAGE_ACCOUNT_NAME: "jobpilotstorage"
  AZURE_OPENAI_ENDPOINT: "https://jobpilot-openai.openai.azure.com/"

  # Email Configuration
  EMAIL_FROM: "noreply@jobpilot.com"

  # CORS Configuration
  CORS_ORIGIN: "https://jobpilot.com,https://www.jobpilot.com"
```

#### Updated Configuration:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: applyforus-config
  namespace: applyforus
  labels:
    app: applyforus-platform
data:
  # Database Configuration
  POSTGRES_HOST: "applyforus-postgres.postgres.database.azure.com"
  POSTGRES_DB: "applyforus"

  # Redis Configuration
  REDIS_HOST: "applyforus-redis.redis.cache.windows.net"

  # Service URLs (Internal)
  AUTH_SERVICE_URL: "http://auth-service.applyforus.svc.cluster.local:4001"
  USER_SERVICE_URL: "http://user-service.applyforus.svc.cluster.local:4002"
  JOB_SERVICE_URL: "http://job-service.applyforus.svc.cluster.local:4003"
  AI_SERVICE_URL: "http://ai-service.applyforus.svc.cluster.local:4004"
  RESUME_SERVICE_URL: "http://resume-service.applyforus.svc.cluster.local:4005"
  ANALYTICS_SERVICE_URL: "http://analytics-service.applyforus.svc.cluster.local:4006"
  NOTIFICATION_SERVICE_URL: "http://notification-service.applyforus.svc.cluster.local:4007"
  AUTO_APPLY_SERVICE_URL: "http://auto-apply-service.applyforus.svc.cluster.local:4008"

  # Azure Configuration
  AZURE_STORAGE_ACCOUNT_NAME: "applyforusstorage"
  AZURE_OPENAI_ENDPOINT: "https://applyforus-openai.openai.azure.com/"

  # Email Configuration
  EMAIL_FROM: "noreply@applyforus.com"

  # CORS Configuration
  CORS_ORIGIN: "https://applyforus.com,https://www.applyforus.com"
```

#### Changes:
- ✓ ConfigMap name: `jobpilot-config` → `applyforus-config`
- ✓ Namespace: `jobpilot` → `applyforus`
- ✓ All service URLs: `.jobpilot.svc.cluster.local` → `.applyforus.svc.cluster.local`
- ✓ Azure resources: `jobpilot-*` → `applyforus-*`
- ✓ Domains: `jobpilot.com` → `applyforus.com`

---

## 3. Secrets Updates

### File: `infrastructure/kubernetes/base/secrets.yaml`

#### Updates:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: applyforus-secrets
  namespace: applyforus
  labels:
    app: applyforus-platform
type: Opaque
data:
  # Base64 encoded secrets
  # Note: Actual secrets should be regenerated
```

#### Changes:
- ✓ Secret name: `jobpilot-secrets` → `applyforus-secrets`
- ✓ Namespace: `jobpilot` → `applyforus`
- ✓ Label: `jobpilot-platform` → `applyforus-platform`

---

## 4. Service Account Updates

### File: `infrastructure/kubernetes/base/serviceaccount.yaml`

#### Current:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jobpilot-service-account
  namespace: jobpilot
  labels:
    app: jobpilot-platform
```

#### Updated:
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: applyforus-service-account
  namespace: applyforus
  labels:
    app: applyforus-platform
```

#### Changes:
- ✓ ServiceAccount name: `jobpilot-service-account` → `applyforus-service-account`
- ✓ Namespace: `jobpilot` → `applyforus`

---

## 5. Ingress Updates

### File: `infrastructure/kubernetes/base/ingress.yaml`

#### Current:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobpilot-ingress
  namespace: jobpilot
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: jobpilot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 3000
  - host: api.jobpilot.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8000
  tls:
  - hosts:
    - jobpilot.com
    - api.jobpilot.com
    secretName: jobpilot-tls
```

#### Updated:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: applyforus-ingress
  namespace: applyforus
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  rules:
  - host: applyforus.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 3000
  - host: api.applyforus.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 8000
  tls:
  - hosts:
    - applyforus.com
    - api.applyforus.com
    secretName: applyforus-tls
```

#### Changes:
- ✓ Ingress name: `jobpilot-ingress` → `applyforus-ingress`
- ✓ Hosts: `jobpilot.com` → `applyforus.com`
- ✓ TLS secret: `jobpilot-tls` → `applyforus-tls`

---

## 6. Service Deployments

### Template for All Services

Each service file follows this pattern. Update all service files in `infrastructure/kubernetes/services/`:

- auth-service.yaml
- user-service.yaml
- job-service.yaml
- resume-service.yaml
- auto-apply-service.yaml
- analytics-service.yaml
- notification-service.yaml
- orchestrator-service.yaml
- ai-service.yaml
- web-app.yaml

### Example: Auth Service

#### File: `infrastructure/kubernetes/services/auth-service.yaml`

#### Current:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: jobpilot
  labels:
    app: auth-service
spec:
  template:
    spec:
      serviceAccountName: jobpilot-service-account
      containers:
      - name: auth-service
        image: ${ACR_LOGIN_SERVER}/auth-service:${VERSION:-v1.0.0}
        envFrom:
        - configMapRef:
            name: jobpilot-config
        - secretRef:
            name: jobpilot-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: jobpilot
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: jobpilot
```

#### Updated:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: applyforus
  labels:
    app: auth-service
spec:
  template:
    spec:
      serviceAccountName: applyforus-service-account
      containers:
      - name: auth-service
        image: ${ACR_LOGIN_SERVER}/auth-service:${VERSION:-v1.0.0}
        envFrom:
        - configMapRef:
            name: applyforus-config
        - secretRef:
            name: applyforus-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: applyforus
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: applyforus
```

#### Changes for Each Service:
- ✓ Namespace: `jobpilot` → `applyforus`
- ✓ ServiceAccount: `jobpilot-service-account` → `applyforus-service-account`
- ✓ ConfigMap ref: `jobpilot-config` → `applyforus-config`
- ✓ Secret ref: `jobpilot-secrets` → `applyforus-secrets`

---

## 7. Monitoring Stack

### File: `infrastructure/kubernetes/monitoring-stack.yaml`

#### Update All Resources:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: applyforus-monitoring
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: applyforus-monitoring
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: applyforus-monitoring
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: applyforus-monitoring
```

---

### File: `infrastructure/kubernetes/monitoring/kustomization.yaml`

#### Current:
```yaml
namespace: jobpilot
```

#### Updated:
```yaml
namespace: applyforus
```

---

### File: `infrastructure/kubernetes/monitoring/prometheus-rules.yaml`

#### Update Alert Labels and Descriptions:
```yaml
groups:
- name: applyforus-alerts
  rules:
  - alert: ApplyforUsHighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    labels:
      severity: critical
      service: applyforus
    annotations:
      summary: "High error rate in ApplyforUs platform"
```

---

### File: `infrastructure/kubernetes/monitoring/alertmanager-config.yaml`

#### Update Email Receivers:
```yaml
receivers:
- name: 'ops-team'
  email_configs:
  - to: 'ops-team@applyforus.com'
    from: 'alerts@applyforus.com'
- name: 'on-call'
  email_configs:
  - to: 'oncall@applyforus.com'
    from: 'alerts@applyforus.com'
```

---

## 8. API Gateway (Kong)

### File: `infrastructure/kubernetes/api-gateway/namespace.yaml`

#### Current:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jobpilot-gateway
```

#### Updated:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: applyforus-gateway
```

---

### File: `infrastructure/kubernetes/api-gateway/kong-config.yaml`

#### Update Service Routes:
```yaml
_format_version: "2.1"

services:
- name: auth-service
  url: http://auth-service.applyforus.svc.cluster.local:4001
  routes:
  - name: auth-route
    paths:
    - /api/auth

- name: user-service
  url: http://user-service.applyforus.svc.cluster.local:4002
  routes:
  - name: user-route
    paths:
    - /api/users
```

---

## 9. Kustomization Files

### File: `infrastructure/kubernetes/kustomization.yaml`

#### Current:
```yaml
namespace: jobpilot

resources:
  - base/namespace.yaml
  - base/configmap.yaml
  - base/secrets.yaml
  # ...

configMapGenerator:
  - name: jobpilot-config
    files:
      - configs/app.properties
```

#### Updated:
```yaml
namespace: applyforus

resources:
  - base/namespace.yaml
  - base/configmap.yaml
  - base/secrets.yaml
  # ...

configMapGenerator:
  - name: applyforus-config
    files:
      - configs/app.properties
```

---

### Overlay Kustomizations

Update all overlay kustomization files:
- `infrastructure/kubernetes/overlays/dev/kustomization.yaml`
- `infrastructure/kubernetes/overlays/staging/kustomization.yaml`
- `infrastructure/kubernetes/overlays/production/kustomization.yaml`

```yaml
namespace: applyforus

bases:
  - ../../base

patchesStrategicMerge:
  - deployment-patch.yaml
```

---

## 10. Network Policies

### File: `infrastructure/kubernetes/base/networkpolicy.yaml`

#### Update Namespace Selectors:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: applyforus-network-policy
  namespace: applyforus
spec:
  podSelector:
    matchLabels:
      app: applyforus-platform
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: applyforus
```

---

## 11. Resource Quotas

### File: `infrastructure/kubernetes/base/resourcequota.yaml`

#### Current:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: jobpilot-quota
  namespace: jobpilot
```

#### Updated:
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: applyforus-quota
  namespace: applyforus
```

---

## 12. Pod Disruption Budgets

### File: `infrastructure/kubernetes/base/poddisruptionbudget.yaml`

#### Current:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: auth-service-pdb
  namespace: jobpilot
```

#### Updated:
```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: auth-service-pdb
  namespace: applyforus
```

---

## 13. Deployment Commands

### Apply Manifests

#### Old Commands:
```bash
kubectl apply -f infrastructure/kubernetes/ -n jobpilot
kubectl get pods -n jobpilot
kubectl logs -f deployment/auth-service -n jobpilot
```

#### New Commands:
```bash
kubectl apply -f infrastructure/kubernetes/ -n applyforus
kubectl get pods -n applyforus
kubectl logs -f deployment/auth-service -n applyforus
```

---

### Create Namespace First

```bash
# Create namespace
kubectl create namespace applyforus

# Or apply from file
kubectl apply -f infrastructure/kubernetes/base/namespace.yaml
```

---

## 14. Helm Charts (if used)

### File: `infrastructure/helm/applyforus/Chart.yaml`

```yaml
apiVersion: v2
name: applyforus
description: ApplyforUs AI Platform Helm Chart
version: 1.0.0
appVersion: "1.0.0"
```

### File: `infrastructure/helm/applyforus/values.yaml`

```yaml
global:
  namespace: applyforus
  platform: applyforus

image:
  registry: applyforusacr.azurecr.io
  pullPolicy: IfNotPresent

configMap:
  name: applyforus-config

secrets:
  name: applyforus-secrets
```

---

## 15. Scripts Updates

### File: `infrastructure/kubernetes/validate-manifests.sh`

Update references:
```bash
#!/bin/bash

NAMESPACE="applyforus"

# Validate manifests
kubectl apply --dry-run=client -f base/ -n $NAMESPACE
kubectl apply --dry-run=client -f services/ -n $NAMESPACE

echo "Validation complete for ApplyforUs manifests"
```

---

### File: `infrastructure/kubernetes/test-local.sh`

```bash
#!/bin/bash

# Test local Kubernetes setup
kubectl config use-context docker-desktop

# Create namespace
kubectl create namespace applyforus --dry-run=client -o yaml | kubectl apply -f -

# Apply manifests
kubectl apply -f base/ -n applyforus
kubectl apply -f services/ -n applyforus

# Wait for pods
kubectl wait --for=condition=ready pod -l app=applyforus-platform -n applyforus --timeout=300s

# Check status
kubectl get all -n applyforus

echo "Local test complete"
```

---

## 16. Azure Kubernetes Service (AKS) Resource Names

### Update in Terraform or Azure CLI scripts:

```bash
# OLD
az aks create \
  --resource-group jobpilot-prod-rg \
  --name jobpilot-prod-aks

# NEW
az aks create \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks
```

---

## 17. Update Checklist

- [ ] Update namespace.yaml
- [ ] Update all resources to use new namespace
- [ ] Update configmap.yaml (all service URLs and Azure resources)
- [ ] Update secrets.yaml
- [ ] Update serviceaccount.yaml
- [ ] Update ingress.yaml (all domains)
- [ ] Update all 10 service manifests
- [ ] Update monitoring stack manifests
- [ ] Update API gateway manifests
- [ ] Update all kustomization.yaml files
- [ ] Update network policies
- [ ] Update resource quotas
- [ ] Update pod disruption budgets
- [ ] Update all scripts
- [ ] Update Helm charts (if applicable)
- [ ] Test dry-run: `kubectl apply --dry-run=client -f .`
- [ ] Apply to dev cluster first
- [ ] Verify all pods are running
- [ ] Test service connectivity
- [ ] Update staging
- [ ] Update production

---

## 18. Migration Strategy

### Zero-Downtime Migration (Recommended for Production)

```bash
# 1. Create new namespace
kubectl create namespace applyforus

# 2. Apply new manifests to new namespace
kubectl apply -f infrastructure/kubernetes/ -n applyforus

# 3. Wait for all pods to be ready
kubectl wait --for=condition=ready pod --all -n applyforus --timeout=600s

# 4. Update ingress to point to new services
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# 5. Monitor traffic and errors
kubectl logs -f -n applyforus --all-containers=true

# 6. After verification, scale down old namespace
kubectl scale deployment --all --replicas=0 -n jobpilot

# 7. Delete old namespace after grace period
kubectl delete namespace jobpilot
```

---

## 19. Rollback Plan

```bash
# If issues occur, rollback:

# 1. Switch ingress back to old namespace
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml.backup

# 2. Scale up old services
kubectl scale deployment --all --replicas=3 -n jobpilot

# 3. Delete new namespace
kubectl delete namespace applyforus
```

---

## 20. Verification Commands

```bash
# Check namespace
kubectl get namespace applyforus

# Check all resources
kubectl get all -n applyforus

# Check configmap
kubectl describe configmap applyforus-config -n applyforus

# Check secrets
kubectl get secrets -n applyforus

# Check service endpoints
kubectl get endpoints -n applyforus

# Test service connectivity
kubectl run test-pod --image=curlimages/curl --rm -it --restart=Never -n applyforus -- curl http://auth-service:4001/health

# Check logs
kubectl logs -l app=auth-service -n applyforus --tail=100
```

---

**Generated:** 2025-12-08
**Status:** Ready for execution
**Priority:** CRITICAL - Must be coordinated with Docker updates
**Estimated Time:** 2-3 hours for full migration
