# Deployment Guide

This guide covers deploying the JobPilot AI Platform to production environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Platform Guides](#cloud-platform-guides)
- [Database Setup](#database-setup)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Disaster Recovery](#backup--disaster-recovery)
- [Post-Deployment](#post-deployment)

## Overview

JobPilot AI Platform supports multiple deployment strategies:

1. **Docker Compose** - Simple deployment for small-scale production
2. **Kubernetes** - Scalable deployment for production workloads
3. **Cloud Managed Services** - Fully managed deployment on Azure/AWS/GCP

## Prerequisites

Before deploying to production, ensure you have:

- [ ] Domain name configured (e.g., jobpilot.ai)
- [ ] SSL/TLS certificates
- [ ] Cloud provider account (Azure/AWS/GCP)
- [ ] Container registry (ACR/ECR/GCR)
- [ ] Database credentials
- [ ] API keys for external services
- [ ] Email service configured (SendGrid)
- [ ] Monitoring tools set up

## Deployment Options

### Option 1: Docker Compose (Small Scale)

**Best for**:
- Development/Staging environments
- Small teams (< 100 users)
- Single server deployments

**Pros**: Simple, easy to set up
**Cons**: Limited scalability, single point of failure

### Option 2: Kubernetes (Production Scale)

**Best for**:
- Production environments
- Large teams (> 100 users)
- High availability requirements
- Auto-scaling needs

**Pros**: Scalable, resilient, cloud-native
**Cons**: More complex to set up and manage

### Option 3: Cloud Managed Services

**Best for**:
- Enterprise deployments
- Teams wanting managed infrastructure
- Multi-region deployments

**Pros**: Fully managed, highly available, automatic updates
**Cons**: Higher cost, vendor lock-in

## Environment Configuration

### 1. Production Environment Variables

Create a `.env.production` file with production values:

```bash
# Environment
NODE_ENV=production

# URLs
FRONTEND_URL=https://jobpilot.ai
API_URL=https://api.jobpilot.ai

# Database (Use managed database in production)
DATABASE_URL=postgresql://username:password@db-host:5432/jobpilot
POSTGRES_HOST=db-host.database.azure.com
POSTGRES_PORT=5432
POSTGRES_DB=jobpilot
POSTGRES_USER=adminuser
POSTGRES_PASSWORD=<strong-password>
POSTGRES_SSL=true

# Redis (Use managed Redis in production)
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=<redis-password>
REDIS_SSL=true

# RabbitMQ (Use managed service)
RABBITMQ_URL=amqps://user:pass@rabbitmq-host:5671
RABBITMQ_SSL=true

# JWT Secrets (Generate strong random values)
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
SESSION_SECRET=<64-char-random-string>

# OpenAI
OPENAI_API_KEY=sk-prod-your-openai-key

# AWS
AWS_ACCESS_KEY_ID=<access-key>
AWS_SECRET_ACCESS_KEY=<secret-key>
AWS_S3_BUCKET=jobpilot-production

# SendGrid
SENDGRID_API_KEY=SG.your-production-key
EMAIL_FROM=noreply@jobpilot.ai

# Stripe
STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key

# Security
CORS_ORIGINS=https://jobpilot.ai,https://www.jobpilot.ai
RATE_LIMIT_MAX=60
```

### 2. Generate Secure Secrets

```bash
# Generate random secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET
openssl rand -hex 32  # For SESSION_SECRET
```

### 3. Environment Variable Management

Use secure secret management:

**Azure**:
```bash
# Store secrets in Azure Key Vault
az keyvault secret set --vault-name jobpilot-vault --name jwt-secret --value "your-secret"
```

**AWS**:
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret --name jobpilot/jwt-secret --secret-string "your-secret"
```

**Kubernetes**:
```bash
# Create Kubernetes secrets
kubectl create secret generic jobpilot-secrets \
  --from-literal=jwt-secret=your-secret \
  --from-literal=database-password=your-password
```

## Docker Deployment

### 1. Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t jobpilot/auth-service:latest -f services/auth-service/Dockerfile .
docker build -t jobpilot/user-service:latest -f services/user-service/Dockerfile .
docker build -t jobpilot/web-app:latest -f apps/web/Dockerfile .
```

### 2. Push to Container Registry

**Azure Container Registry**:
```bash
# Login
az acr login --name jobpilotacr

# Tag images
docker tag jobpilot/auth-service:latest jobpilotacr.azurecr.io/auth-service:latest

# Push
docker push jobpilotacr.azurecr.io/auth-service:latest
```

**Docker Hub**:
```bash
docker login
docker push jobpilot/auth-service:latest
```

### 3. Deploy with Docker Compose

```bash
# Pull images
docker-compose -f docker-compose.prod.yml pull

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 4. Docker Compose Production File

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  web:
    image: jobpilotacr.azurecr.io/web-app:${VERSION:-latest}
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=${API_URL}
    depends_on:
      - auth-service
      - user-service

  auth-service:
    image: jobpilotacr.azurecr.io/auth-service:${VERSION:-latest}
    restart: always
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Additional services...
```

## Kubernetes Deployment

### 1. Prerequisites

- Kubernetes cluster (AKS/EKS/GKE)
- kubectl configured
- Helm (optional, recommended)

### 2. Create Namespace

```bash
kubectl create namespace jobpilot-prod
kubectl config set-context --current --namespace=jobpilot-prod
```

### 3. Deploy Secrets

```bash
# Create secrets from .env file
kubectl create secret generic jobpilot-env \
  --from-env-file=.env.production

# Or from literals
kubectl create secret generic jobpilot-secrets \
  --from-literal=jwt-secret=${JWT_SECRET} \
  --from-literal=db-password=${DB_PASSWORD}
```

### 4. Deploy Services

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/

# Or use Kustomize
kubectl apply -k infrastructure/kubernetes/overlays/production/

# Check deployment status
kubectl get deployments
kubectl get pods
kubectl get services
```

### 5. Kubernetes Manifests

See `infrastructure/kubernetes/services/` for service manifests.

Example deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: jobpilot-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: jobpilotacr.azurecr.io/auth-service:latest
        ports:
        - containerPort: 8001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jobpilot-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8001
          initialDelaySeconds: 10
          periodSeconds: 5
```

### 6. Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jobpilot-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.jobpilot.ai
    secretName: jobpilot-tls
  rules:
  - host: api.jobpilot.ai
    http:
      paths:
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 8001
```

### 7. Auto-Scaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Cloud Platform Guides

### Azure Deployment

See [azure-deployment.md](azure-deployment.md) for detailed Azure deployment guide.

**Quick Steps**:
1. Create Azure Kubernetes Service (AKS)
2. Create Azure Container Registry (ACR)
3. Create Azure Database for PostgreSQL
4. Create Azure Cache for Redis
5. Deploy services to AKS

### AWS Deployment

See [aws-deployment.md](aws-deployment.md) for detailed AWS deployment guide.

**Quick Steps**:
1. Create Amazon EKS cluster
2. Create Amazon ECR
3. Create Amazon RDS (PostgreSQL)
4. Create Amazon ElastiCache (Redis)
5. Deploy services to EKS

### GCP Deployment

See [gcp-deployment.md](gcp-deployment.md) for detailed GCP deployment guide.

**Quick Steps**:
1. Create Google Kubernetes Engine (GKE)
2. Create Google Container Registry (GCR)
3. Create Cloud SQL (PostgreSQL)
4. Create Memorystore (Redis)
5. Deploy services to GKE

## Database Setup

### 1. Create Production Database

**Azure**:
```bash
az postgres flexible-server create \
  --name jobpilot-db \
  --resource-group jobpilot-rg \
  --location eastus \
  --admin-user adminuser \
  --admin-password <password> \
  --sku-name Standard_D2s_v3 \
  --version 15
```

**AWS**:
```bash
aws rds create-db-instance \
  --db-instance-identifier jobpilot-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username adminuser \
  --master-user-password <password> \
  --allocated-storage 100
```

### 2. Configure SSL/TLS

```bash
# Download SSL certificate
wget https://your-db-host/certificate.pem

# Update connection string
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require&sslrootcert=certificate.pem
```

### 3. Run Migrations

```bash
# Set production database URL
export DATABASE_URL="postgresql://..."

# Run migrations
pnpm db:migrate

# Verify
psql $DATABASE_URL -c "\dt"
```

### 4. Database Backup

```bash
# Automated backups (Azure)
az postgres flexible-server backup create \
  --name jobpilot-db \
  --resource-group jobpilot-rg \
  --backup-name daily-backup

# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20240101.sql
```

## SSL/TLS Configuration

### 1. Obtain SSL Certificates

**Let's Encrypt** (Free):
```bash
# Install cert-manager in Kubernetes
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuer.yaml
```

**Commercial Certificate**:
- Purchase from certificate authority
- Upload to cloud provider
- Configure in ingress/load balancer

### 2. Configure HTTPS

**NGINX**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.jobpilot.ai;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Monitoring & Logging

### 1. Application Insights (Azure)

```bash
# Set connection string
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...

# Metrics automatically collected
```

### 2. CloudWatch (AWS)

```bash
# Install CloudWatch agent
kubectl apply -f aws-cloudwatch-metrics.yaml
```

### 3. Prometheus + Grafana

```bash
# Install Prometheus
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80
```

### 4. Centralized Logging

**ELK Stack**:
```bash
# Install Elasticsearch, Logstash, Kibana
helm repo add elastic https://helm.elastic.co
helm install elasticsearch elastic/elasticsearch
helm install kibana elastic/kibana
helm install filebeat elastic/filebeat
```

## Backup & Disaster Recovery

### 1. Database Backups

- Automated daily backups
- Point-in-time recovery enabled
- Cross-region replication for critical data

### 2. Application Backups

```bash
# Backup Kubernetes resources
kubectl get all --all-namespaces -o yaml > cluster-backup.yaml

# Backup using Velero
velero backup create jobpilot-backup --include-namespaces jobpilot-prod
```

### 3. Disaster Recovery Plan

1. **RTO (Recovery Time Objective)**: 4 hours
2. **RPO (Recovery Point Objective)**: 1 hour
3. **Backup Schedule**: Daily at 2 AM UTC
4. **Backup Retention**: 30 days
5. **DR Testing**: Quarterly

## Post-Deployment

### 1. Verify Deployment

```bash
# Check all services are running
kubectl get pods -n jobpilot-prod

# Test health endpoints
curl https://api.jobpilot.ai/health

# Test authentication
curl -X POST https://api.jobpilot.ai/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Performance Testing

```bash
# Run load tests
k6 run tests/load-tests/auth-service.js
```

### 3. Security Scan

```bash
# Scan Docker images
trivy image jobpilotacr.azurecr.io/auth-service:latest

# Scan Kubernetes cluster
kube-bench
```

### 4. Enable Monitoring

- Configure alerts for critical metrics
- Set up PagerDuty/OpsGenie for on-call
- Create runbooks for common issues

### 5. Documentation

- Update deployment documentation
- Document configuration changes
- Create runbooks for operations team

## Rollback Procedure

If deployment fails:

```bash
# Kubernetes rollback
kubectl rollout undo deployment/auth-service

# Docker Compose rollback
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

## Troubleshooting

See [troubleshooting.md](../troubleshooting.md) for common deployment issues.

## Additional Resources

- [Azure Deployment Guide](azure-deployment.md)
- [AWS Deployment Guide](aws-deployment.md)
- [GCP Deployment Guide](gcp-deployment.md)
- [CI/CD Pipeline](cicd.md)
- [Security Best Practices](security.md)

---

For deployment support, contact: devops@jobpilot.ai
