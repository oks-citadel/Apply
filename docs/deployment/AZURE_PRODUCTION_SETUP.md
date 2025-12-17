# Azure Production Environment Setup

## Overview

This document provides comprehensive instructions for setting up the ApplyForUs AI Platform on Azure with **ZERO Docker Desktop dependencies** for production deployments.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Azure Services Required](#azure-services-required)
- [Environment Variables](#environment-variables)
- [Deployment Process](#deployment-process)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Production Infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Azure Kubernetes Service (AKS)                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Microservices (All communicate via K8s DNS)             │   │
│  │  - auth-service.applyforus.svc.cluster.local:8001        │   │
│  │  - user-service.applyforus.svc.cluster.local:8002        │   │
│  │  - resume-service.applyforus.svc.cluster.local:8003      │   │
│  │  - job-service.applyforus.svc.cluster.local:8004         │   │
│  │  - auto-apply-service.applyforus.svc.cluster.local:8005  │   │
│  │  - analytics-service.applyforus.svc.cluster.local:8006   │   │
│  │  - notification-service.applyforus.svc.cluster.local:8007│   │
│  │  - ai-service.applyforus.svc.cluster.local:8000          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Connects to Azure Services
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌──────────────────┐                  ┌──────────────────┐
│ Azure PostgreSQL │                  │ Azure Redis Cache│
│ applyforus-      │                  │ applyforus-redis.│
│ postgres.        │                  │ redis.cache.     │
│ postgres.        │                  │ windows.net:6380 │
│ database.        │                  │ (SSL/TLS)        │
│ azure.com:5432   │                  └──────────────────┘
│ (SSL required)   │
└──────────────────┘                  ┌──────────────────┐
                                      │ Azure Blob       │
                                      │ Storage          │
                                      │ applyforusstorage│
                                      └──────────────────┘
```

### Key Points

- **NO localhost** references in production
- **NO Docker Compose** used in production (only for local dev)
- **NO Docker Desktop** required on production servers
- All services run in **Azure Kubernetes Service (AKS)**
- All infrastructure is **Azure-native**

---

## Azure Services Required

### 1. Azure Database for PostgreSQL

**Service Name:** `applyforus-postgres`
**Endpoint:** `applyforus-postgres.postgres.database.azure.com:5432`

**Configuration:**
- SSL/TLS: **Required**
- Admin User: `applyforusadmin@applyforus-postgres`
- Database Name: `applyforus`
- Tier: General Purpose or higher
- vCores: 2-4 minimum
- Storage: 100GB minimum

**Setup Commands:**
```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group applyforus-rg \
  --name applyforus-postgres \
  --location eastus \
  --admin-user applyforusadmin \
  --admin-password <secure-password> \
  --sku-name GP_Gen5_2 \
  --version 14

# Create database
az postgres db create \
  --resource-group applyforus-rg \
  --server-name applyforus-postgres \
  --name applyforus

# Configure firewall for Azure services
az postgres server firewall-rule create \
  --resource-group applyforus-rg \
  --server-name applyforus-postgres \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

### 2. Azure Cache for Redis

**Service Name:** `applyforus-redis`
**Endpoint:** `applyforus-redis.redis.cache.windows.net:6380`

**Configuration:**
- SSL/TLS: **Required** (Port 6380)
- Non-SSL Port: **Disabled**
- Tier: Standard or Premium
- Size: C1 (1GB) minimum

**Setup Commands:**
```bash
# Create Redis Cache
az redis create \
  --resource-group applyforus-rg \
  --name applyforus-redis \
  --location eastus \
  --sku Standard \
  --vm-size c1 \
  --enable-non-ssl-port false

# Get access keys
az redis list-keys \
  --resource-group applyforus-rg \
  --name applyforus-redis
```

### 3. Azure Blob Storage

**Storage Account Name:** `applyforusstorage`
**Endpoint:** `https://applyforusstorage.blob.core.windows.net/`

**Containers:**
- `resumes` - User resume files
- `parsed-resumes` - Parsed resume data
- `generated-resumes` - AI-generated resumes
- `user-uploads` - General user uploads
- `profile-photos` - User profile pictures
- `documents` - General documents

**Setup Commands:**
```bash
# Create storage account
az storage account create \
  --name applyforusstorage \
  --resource-group applyforus-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# Get connection string
az storage account show-connection-string \
  --name applyforusstorage \
  --resource-group applyforus-rg

# Create containers
for container in resumes parsed-resumes generated-resumes user-uploads profile-photos documents; do
  az storage container create \
    --name $container \
    --account-name applyforusstorage
done
```

### 4. Azure Kubernetes Service (AKS)

**Cluster Name:** `applyforus-aks`
**Node Pool:** 2-3 nodes minimum

**Setup Commands:**
```bash
# Create AKS cluster
az aks create \
  --resource-group applyforus-rg \
  --name applyforus-aks \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group applyforus-rg \
  --name applyforus-aks

# Create namespace
kubectl create namespace applyforus
```

### 5. Azure Service Bus (Optional - replaces RabbitMQ)

**Namespace:** `applyforus-servicebus`
**Queue:** `applyforus-queue`

**Setup Commands:**
```bash
# Create Service Bus namespace
az servicebus namespace create \
  --resource-group applyforus-rg \
  --name applyforus-servicebus \
  --location eastus \
  --sku Standard

# Create queue
az servicebus queue create \
  --resource-group applyforus-rg \
  --namespace-name applyforus-servicebus \
  --name applyforus-queue

# Get connection string
az servicebus namespace authorization-rule keys list \
  --resource-group applyforus-rg \
  --namespace-name applyforus-servicebus \
  --name RootManageSharedAccessKey
```

### 6. Azure Container Registry (ACR)

**Registry Name:** `applyforusacr`

**Setup Commands:**
```bash
# Create ACR
az acr create \
  --resource-group applyforus-rg \
  --name applyforusacr \
  --sku Standard

# Attach ACR to AKS
az aks update \
  --resource-group applyforus-rg \
  --name applyforus-aks \
  --attach-acr applyforusacr
```

### 7. Elasticsearch (Optional)

**Options:**
1. **Elastic Cloud** (recommended for production)
2. **Azure Container Instance** with Elasticsearch
3. **Self-hosted on AKS**

For Azure Container Instance:
```bash
az container create \
  --resource-group applyforus-rg \
  --name applyforus-elasticsearch \
  --image docker.elastic.co/elasticsearch/elasticsearch:8.11.0 \
  --dns-name-label applyforus-elasticsearch \
  --ports 9200 9300 \
  --cpu 2 \
  --memory 4 \
  --environment-variables \
    "discovery.type=single-node" \
    "ES_JAVA_OPTS=-Xms2g -Xmx2g"
```

---

## Environment Variables

### Required Kubernetes Secrets

Create secrets for sensitive data:

```bash
# PostgreSQL password
kubectl create secret generic postgres-credentials \
  --from-literal=password=<your-postgres-password> \
  --namespace applyforus

# Redis access key
kubectl create secret generic redis-credentials \
  --from-literal=password=<your-redis-access-key> \
  --namespace applyforus

# Azure Storage connection string
kubectl create secret generic storage-credentials \
  --from-literal=connection-string='<your-connection-string>' \
  --namespace applyforus

# JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=jwt-secret=<your-jwt-secret> \
  --from-literal=jwt-refresh-secret=<your-jwt-refresh-secret> \
  --namespace applyforus

# Azure Service Bus (if using)
kubectl create secret generic servicebus-credentials \
  --from-literal=connection-string='<your-servicebus-connection-string>' \
  --namespace applyforus

# Email/SendGrid API key
kubectl create secret generic email-credentials \
  --from-literal=sendgrid-api-key=<your-sendgrid-api-key> \
  --namespace applyforus

# OpenAI API key
kubectl create secret generic ai-credentials \
  --from-literal=openai-api-key=<your-openai-api-key> \
  --from-literal=anthropic-api-key=<your-anthropic-api-key> \
  --namespace applyforus
```

### ConfigMap Values

The ConfigMap at `infrastructure/kubernetes/base/configmap.yaml` contains all non-sensitive configuration. It includes:

- **Database endpoints** (Azure PostgreSQL)
- **Redis endpoints** (Azure Cache for Redis)
- **Service URLs** (Kubernetes internal DNS)
- **Azure Storage account names**
- **CORS settings**
- **Feature flags**
- **Application settings**

---

## Deployment Process

### 1. Build and Push Docker Images

```bash
# Login to ACR
az acr login --name applyforusacr

# Build and push all service images
services=(auth-service user-service job-service ai-service resume-service \
          auto-apply-service analytics-service notification-service orchestrator-service)

for service in "${services[@]}"; do
  docker build -t applyforusacr.azurecr.io/$service:latest ./services/$service
  docker push applyforusacr.azurecr.io/$service:latest
done

# Build and push web app
docker build -t applyforusacr.azurecr.io/web-app:latest ./apps/web
docker push applyforusacr.azurecr.io/web-app:latest
```

### 2. Apply Kubernetes Configurations

```bash
# Apply ConfigMap
kubectl apply -f infrastructure/kubernetes/base/configmap.yaml

# Apply all secrets (created above)
# Secrets should be created via kubectl create secret commands

# Apply production deployments
kubectl apply -f infrastructure/kubernetes/production/
```

### 3. Verify Deployment

```bash
# Check all pods are running
kubectl get pods -n applyforus

# Check services
kubectl get services -n applyforus

# Check ConfigMap
kubectl get configmap applyforus-config -n applyforus -o yaml

# Run verification script
./scripts/verify-azure-deployment.sh
```

---

## Verification

### Automated Verification Script

Run the comprehensive verification script:

```bash
chmod +x scripts/verify-azure-deployment.sh
./scripts/verify-azure-deployment.sh
```

This script checks:
- ✓ No localhost references in production configs
- ✓ Azure PostgreSQL endpoint configured
- ✓ Azure Redis Cache endpoint configured
- ✓ Kubernetes internal DNS for services
- ✓ Azure Blob Storage configured
- ✓ CORS configured for production domain
- ✓ SSL/TLS enabled for databases
- ✓ No Docker Compose in production paths

### Manual Verification

1. **Check Pod Status:**
   ```bash
   kubectl get pods -n applyforus
   # All pods should be in "Running" status
   ```

2. **Check Service Connectivity:**
   ```bash
   # Test database connection
   kubectl run -it --rm debug --image=postgres:14 --restart=Never -- \
     psql "postgresql://applyforusadmin@applyforus-postgres:<password>@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require"

   # Test Redis connection
   kubectl run -it --rm debug --image=redis:7 --restart=Never -- \
     redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls ping
   ```

3. **Check Logs:**
   ```bash
   # View logs for a specific service
   kubectl logs -n applyforus deployment/auth-service
   ```

4. **Test API Endpoints:**
   ```bash
   # Get external IP of API gateway
   kubectl get service -n applyforus

   # Test health endpoint
   curl https://api.applyforus.com/health
   ```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting - Database Connection Issues

**Symptom:** Pods crash with database connection errors

**Solution:**
```bash
# Check if firewall allows AKS cluster
az postgres server firewall-rule list \
  --resource-group applyforus-rg \
  --server-name applyforus-postgres

# Check secret exists
kubectl get secret postgres-credentials -n applyforus

# Verify connection string
kubectl run -it --rm debug --image=postgres:14 --restart=Never -- \
  psql "postgresql://applyforusadmin@applyforus-postgres:<password>@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require"
```

#### 2. Redis Connection Failures

**Symptom:** Services can't connect to Redis

**Solution:**
```bash
# Verify Redis is using SSL port 6380
kubectl get configmap applyforus-config -n applyforus -o yaml | grep REDIS_PORT

# Check Redis access key
az redis list-keys --resource-group applyforus-rg --name applyforus-redis

# Test Redis connection
kubectl run -it --rm debug --image=redis:7 --restart=Never -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls --pass <access-key> ping
```

#### 3. Inter-Service Communication Issues

**Symptom:** Services can't communicate with each other

**Solution:**
```bash
# Check all services are running
kubectl get services -n applyforus

# Verify DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup auth-service.applyforus.svc.cluster.local

# Check service endpoints
kubectl get endpoints -n applyforus
```

#### 4. Azure Blob Storage Access Issues

**Symptom:** File uploads fail

**Solution:**
```bash
# Verify storage account exists
az storage account show --name applyforusstorage --resource-group applyforus-rg

# Check containers exist
az storage container list --account-name applyforusstorage

# Verify secret
kubectl get secret storage-credentials -n applyforus -o yaml
```

#### 5. Localhost References Still Present

**Symptom:** Verification script fails with localhost references

**Solution:**
```bash
# Find all localhost references
grep -r "localhost" infrastructure/kubernetes/production/

# Update ConfigMap
kubectl edit configmap applyforus-config -n applyforus

# Restart affected pods
kubectl rollout restart deployment <deployment-name> -n applyforus
```

---

## Local Development vs Production

### Local Development

For local development, developers can use:

- **Docker Compose** for infrastructure (PostgreSQL, Redis, RabbitMQ)
- **localhost URLs** for services
- **.env.local** files to override production defaults

Example `.env.local`:
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SSL=false

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TLS=false

CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Production

Production uses:

- **Azure-native services** (PostgreSQL, Redis Cache, Blob Storage)
- **Kubernetes internal DNS** for service-to-service communication
- **Azure Service Bus** instead of RabbitMQ
- **SSL/TLS** for all connections
- **Environment variables** from ConfigMaps and Secrets

---

## Next Steps

1. **Set up monitoring:**
   - Enable Application Insights
   - Configure log aggregation
   - Set up alerts

2. **Configure CI/CD:**
   - Set up Azure DevOps or GitHub Actions
   - Automate deployments to AKS
   - Run verification script in pipeline

3. **Security hardening:**
   - Enable Azure AD authentication for AKS
   - Set up network policies
   - Configure Azure Key Vault for secrets

4. **Performance optimization:**
   - Configure autoscaling for AKS
   - Set up Azure CDN for static assets
   - Optimize database queries

---

## Support

For issues or questions:

1. Run the verification script: `./scripts/verify-azure-deployment.sh`
2. Check logs: `kubectl logs -n applyforus <pod-name>`
3. Review this documentation
4. Contact the DevOps team

---

## References

- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Azure Cache for Redis Documentation](https://docs.microsoft.com/en-us/azure/azure-cache-for-redis/)
- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Azure Blob Storage Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
