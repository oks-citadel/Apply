# Deployment Guide - JobPilot AI Platform

This guide covers deployment strategies, configurations, and best practices for deploying the JobPilot AI Platform to various environments.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Deployment Environments](#deployment-environments)
3. [Deployment Options](#deployment-options)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Quick Deployment](#quick-deployment)
6. [Production Deployment](#production-deployment)
7. [Health Checks & Monitoring](#health-checks--monitoring)
8. [Rollback Strategy](#rollback-strategy)

## Deployment Overview

JobPilot AI Platform supports multiple deployment strategies:

- **Docker Compose**: Local development and staging
- **Kubernetes**: Production deployment with orchestration
- **Azure Container Apps**: Managed container deployment
- **Traditional VMs**: Legacy deployment option

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Production                           │
│                   (Kubernetes/AKS)                       │
│                                                          │
│  ├─> Multiple availability zones                        │
│  ├─> Auto-scaling (HPA)                                │
│  ├─> Load balancing                                     │
│  └─> High availability databases                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      Staging                             │
│                 (Docker Compose/AKS)                     │
│                                                          │
│  ├─> Production-like configuration                      │
│  ├─> Smaller resource allocation                        │
│  └─> Integration testing environment                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Development                           │
│                  (Docker Compose)                        │
│                                                          │
│  ├─> Local development environment                      │
│  ├─> Hot module reloading                               │
│  └─> Debug mode enabled                                 │
└─────────────────────────────────────────────────────────┘
```

## Deployment Environments

### Development Environment

**Purpose**: Local development and testing

**Characteristics**:
- Docker Compose for infrastructure services
- Hot module reloading
- Debug logging enabled
- Mock external services
- Relaxed security settings

**Access**:
- Web: http://localhost:3000
- API: http://localhost:8001-8008
- Services: localhost ports

### Staging Environment

**Purpose**: Pre-production testing and QA

**Characteristics**:
- Production-like configuration
- Full integration with external services
- Performance testing
- Security testing
- User acceptance testing (UAT)

**Access**:
- Web: https://staging.jobpilot.ai
- API: https://api-staging.jobpilot.ai

### Production Environment

**Purpose**: Live production system

**Characteristics**:
- High availability (99.9% uptime SLA)
- Multi-region deployment
- Auto-scaling
- Comprehensive monitoring
- Disaster recovery

**Access**:
- Web: https://jobpilot.ai
- API: https://api.jobpilot.ai

## Deployment Options

### Option 1: Docker Compose

**Best for**: Development, staging, small-scale deployments

**Pros**:
- Simple setup
- Quick deployment
- Easy to debug
- Good for testing

**Cons**:
- Limited scaling
- Single host deployment
- No automatic failover

See: [Docker Compose Deployment Guide](./docker-compose.md)

### Option 2: Kubernetes

**Best for**: Production, large-scale deployments

**Pros**:
- Auto-scaling
- Self-healing
- Rolling updates
- High availability
- Multi-cloud support

**Cons**:
- Complex setup
- Requires expertise
- Higher resource overhead

See: [Kubernetes Deployment Guide](./kubernetes.md)

### Option 3: Azure Container Apps

**Best for**: Managed container deployment on Azure

**Pros**:
- Fully managed
- Serverless scaling
- Built-in ingress
- Easy integration with Azure services

**Cons**:
- Azure-specific
- Less control
- Potential vendor lock-in

See: [Azure Deployment Guide](./azure.md)

## Pre-Deployment Checklist

### Infrastructure Checklist

- [ ] Cloud provider account set up
- [ ] Container registry configured
- [ ] DNS records configured
- [ ] SSL/TLS certificates obtained
- [ ] Network security configured
- [ ] Firewall rules set up
- [ ] Load balancer configured

### Database Checklist

- [ ] PostgreSQL cluster provisioned
- [ ] Database backups configured
- [ ] Read replicas set up (production)
- [ ] Connection pooling configured
- [ ] Database migrations tested
- [ ] Database monitoring enabled

### Application Checklist

- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] API keys validated
- [ ] External service integrations tested
- [ ] Docker images built and pushed
- [ ] Health check endpoints verified

### Security Checklist

- [ ] SSL/TLS certificates installed
- [ ] Security scanning completed
- [ ] Vulnerability assessment done
- [ ] Secrets rotation configured
- [ ] RBAC policies defined
- [ ] Network policies configured
- [ ] DDoS protection enabled

### Monitoring Checklist

- [ ] Application monitoring configured
- [ ] Infrastructure monitoring set up
- [ ] Log aggregation enabled
- [ ] Alerting rules configured
- [ ] Distributed tracing enabled
- [ ] Performance monitoring active
- [ ] Error tracking configured

## Quick Deployment

### Docker Compose Deployment

```bash
# Clone repository
git clone https://github.com/jobpilot/Job-Apply-Platform.git
cd Job-Apply-Platform

# Configure environment
cp .env.example .env
# Edit .env with production values

# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose exec auth-service pnpm migration:run
docker-compose exec user-service pnpm migration:run
docker-compose exec resume-service pnpm migration:run
docker-compose exec job-service pnpm migration:run

# Verify deployment
docker-compose ps
curl http://localhost:8001/health
```

### Kubernetes Quick Deploy

```bash
# Set up kubectl context
kubectl config use-context production

# Create namespace
kubectl create namespace jobpilot

# Create secrets
kubectl create secret generic jobpilot-secrets \
  --from-env-file=.env.production \
  --namespace=jobpilot

# Deploy infrastructure
kubectl apply -k infrastructure/kubernetes/base/

# Deploy services
kubectl apply -k infrastructure/kubernetes/services/

# Verify deployment
kubectl get pods -n jobpilot
kubectl get services -n jobpilot
kubectl get ingress -n jobpilot
```

## Production Deployment

### Step 1: Prepare Infrastructure

```bash
# 1. Provision cloud resources with Terraform
cd infrastructure/terraform/environments/production
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 2. Configure kubectl
az aks get-credentials --resource-group jobpilot-rg --name jobpilot-aks
# or
aws eks update-kubeconfig --name jobpilot-eks --region us-east-1
```

### Step 2: Build and Push Images

```bash
# 1. Authenticate to container registry
docker login jobpilot.azurecr.io
# or
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# 2. Build all images
./scripts/build-images.sh

# 3. Tag images
./scripts/tag-images.sh v2.0.0

# 4. Push to registry
./scripts/push-images.sh v2.0.0
```

### Step 3: Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl create namespace jobpilot-prod

# 2. Create ConfigMaps
kubectl create configmap app-config \
  --from-file=infrastructure/kubernetes/config/ \
  --namespace=jobpilot-prod

# 3. Create Secrets
kubectl create secret generic db-credentials \
  --from-literal=username=dbuser \
  --from-literal=password='<secure-password>' \
  --namespace=jobpilot-prod

kubectl create secret generic jwt-secrets \
  --from-literal=jwt-secret='<jwt-secret>' \
  --from-literal=jwt-refresh-secret='<refresh-secret>' \
  --namespace=jobpilot-prod

# 4. Deploy PostgreSQL (if using in-cluster)
helm install postgresql bitnami/postgresql \
  --namespace=jobpilot-prod \
  --values infrastructure/kubernetes/helm/postgresql-values.yaml

# 5. Deploy Redis
helm install redis bitnami/redis \
  --namespace=jobpilot-prod \
  --values infrastructure/kubernetes/helm/redis-values.yaml

# 6. Deploy application services
kubectl apply -k infrastructure/kubernetes/overlays/production/

# 7. Verify deployment
kubectl get all -n jobpilot-prod
kubectl rollout status deployment/auth-service -n jobpilot-prod
kubectl rollout status deployment/user-service -n jobpilot-prod
```

### Step 4: Configure Ingress

```bash
# 1. Install NGINX Ingress Controller
helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace=ingress-nginx \
  --create-namespace

# 2. Apply ingress rules
kubectl apply -f infrastructure/kubernetes/ingress/production-ingress.yaml

# 3. Get external IP
kubectl get ingress -n jobpilot-prod
```

### Step 5: Configure SSL/TLS

```bash
# Using cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace=cert-manager \
  --create-namespace \
  --set installCRDs=true

# Apply certificate issuer
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuer.yaml

# Certificate will be auto-provisioned via ingress annotations
```

### Step 6: Run Database Migrations

```bash
# Create migration job
kubectl apply -f infrastructure/kubernetes/jobs/migration-job.yaml

# Monitor migration
kubectl logs -f job/database-migration -n jobpilot-prod

# Verify migration completed
kubectl get job database-migration -n jobpilot-prod
```

### Step 7: Verify Deployment

```bash
# Check pod status
kubectl get pods -n jobpilot-prod

# Check service endpoints
kubectl get services -n jobpilot-prod

# Check ingress
kubectl get ingress -n jobpilot-prod

# Test health endpoints
curl https://api.jobpilot.ai/auth/health
curl https://api.jobpilot.ai/users/health
curl https://api.jobpilot.ai/resumes/health

# Check logs
kubectl logs -l app=auth-service -n jobpilot-prod --tail=100
```

## Health Checks & Monitoring

### Health Check Endpoints

Each service exposes health check endpoints:

```
/health          - Basic health check
/health/ready    - Readiness probe
/health/live     - Liveness probe
```

### Kubernetes Health Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Monitoring Stack

```bash
# Deploy Prometheus & Grafana
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace=monitoring \
  --create-namespace

# Deploy ELK Stack for logging
helm install elasticsearch elastic/elasticsearch \
  --namespace=logging \
  --create-namespace

helm install kibana elastic/kibana \
  --namespace=logging

helm install filebeat elastic/filebeat \
  --namespace=logging
```

## Rollback Strategy

### Kubernetes Rollback

```bash
# View rollout history
kubectl rollout history deployment/auth-service -n jobpilot-prod

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n jobpilot-prod

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=3 -n jobpilot-prod

# Monitor rollback
kubectl rollout status deployment/auth-service -n jobpilot-prod
```

### Database Rollback

```bash
# Rollback last migration
kubectl exec -it <auth-service-pod> -n jobpilot-prod -- pnpm migration:revert

# Restore from backup
./scripts/restore-database.sh <backup-timestamp>
```

### Emergency Rollback

```bash
# Scale down problematic service
kubectl scale deployment/auth-service --replicas=0 -n jobpilot-prod

# Deploy previous version
kubectl set image deployment/auth-service \
  auth-service=jobpilot.azurecr.io/auth-service:v1.9.0 \
  -n jobpilot-prod

# Scale back up
kubectl scale deployment/auth-service --replicas=3 -n jobpilot-prod
```

## Post-Deployment

### Smoke Tests

```bash
# Run smoke test suite
./scripts/smoke-tests.sh production

# Test critical paths
curl -X POST https://api.jobpilot.ai/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@jobpilot.ai","password":"test123"}'

# Test job search
curl https://api.jobpilot.ai/jobs?q=software+engineer&limit=10
```

### Performance Testing

```bash
# Run load tests
k6 run tests/load/api-load-test.js

# Monitor performance
kubectl top pods -n jobpilot-prod
kubectl top nodes
```

### Documentation Updates

- [ ] Update deployment log
- [ ] Document any issues encountered
- [ ] Update runbook if needed
- [ ] Notify team of deployment
- [ ] Update status page

## Related Documentation

- [Docker Compose Deployment](./docker-compose.md)
- [Kubernetes Deployment](./kubernetes.md)
- [Azure Deployment](./azure.md)
- [Environment Variables](./environment-variables.md)
- [CI/CD Pipeline](./ci-cd.md)
- [Monitoring & Logging](./monitoring.md)
- [Disaster Recovery](./disaster-recovery.md)

## Support

For deployment issues:
- Check [Troubleshooting Guide](../operations/troubleshooting.md)
- Review [Operations Runbook](../operations/runbooks.md)
- Contact DevOps team: devops@jobpilot.ai

---

**Last Updated**: 2025-12-05
