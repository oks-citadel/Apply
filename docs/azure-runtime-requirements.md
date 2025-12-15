# Azure Runtime Requirements - ApplyForUs Platform

## Overview

This document details the runtime architecture for the ApplyForUs AI Platform, ensuring **ZERO** production dependencies on Docker Desktop. All production workloads run exclusively in Azure using managed services and Azure Kubernetes Service (AKS).

## Environment Separation

### Production Environment (Azure Only)
- **Runtime Platform**: Azure Kubernetes Service (AKS)
- **Container Registry**: Azure Container Registry (ACR)
- **No Docker Desktop**: All services use Azure managed equivalents

### Development Environment (Local/Docker)
- **Runtime Platform**: Docker Desktop + Docker Compose
- **Purpose**: Local development and testing only
- **Not for Production**: Never deploy local Docker containers to production

## Service Mapping: Docker to Azure

### 1. PostgreSQL Database

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **Azure PostgreSQL Flexible Server** | `applyforus-postgres.postgres.database.azure.com:5432` |
| Development | Docker Compose | `localhost:5432` |

**Terraform Provisioned:**
```hcl
# infrastructure/terraform/main.tf:201-262
module "postgresql" {
  source = "./modules/postgresql-flexible"

  # Production Configuration
  sku_name       = "GP_Standard_D2s_v3"  # General Purpose, 2 vCores
  storage_mb     = 32768                  # 32 GB
  postgres_version = "16"

  # High Availability (Production only)
  enable_high_availability = true
  high_availability_mode   = "ZoneRedundant"

  # Backup and Recovery
  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  # Network Security
  allow_azure_services = true
  allowed_ip_addresses = []  # Managed via firewall rules
}
```

**Production Configuration:**
- Connection: SSL/TLS required (`sslmode=require`)
- Authentication: Azure AD + SQL authentication
- Endpoint: `applyforus-postgres.postgres.database.azure.com`
- Port: `5432`
- High Availability: Zone-redundant with automatic failover

**Environment Variables (Production):**
```bash
DATABASE_URL=postgresql://applyforusadmin@applyforus-postgres:${POSTGRES_PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require
POSTGRES_HOST=applyforus-postgres.postgres.database.azure.com
POSTGRES_PORT=5432
POSTGRES_SSL=true
```

**Kubernetes ConfigMap Reference:**
```yaml
# infrastructure/kubernetes/base/configmap.yaml:19-30
POSTGRES_HOST: "applyforus-postgres.postgres.database.azure.com"
POSTGRES_PORT: "5432"
POSTGRES_SSL: "true"
```

### 2. Redis Cache

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **Azure Cache for Redis** | `applyforus-redis.redis.cache.windows.net:6380` |
| Development | Docker Compose | `localhost:6379` |

**Terraform Provisioned:**
```hcl
# infrastructure/terraform/main.tf:268-283
module "redis_cache" {
  source = "./modules/redis-cache"

  # Production Configuration
  cache_sku = "Premium_P1"  # Premium tier for production

  # Network Integration
  subnet_id               = module.networking.cache_subnet_id
  enable_private_endpoint = true
}
```

**Production Configuration:**
- Connection: TLS/SSL required (port 6380)
- Tier: Premium (with persistence and clustering)
- Endpoint: `applyforus-redis.redis.cache.windows.net`
- Port: `6380` (SSL)

**Environment Variables (Production):**
```bash
REDIS_URL=rediss://:${REDIS_PASSWORD}@applyforus-redis.redis.cache.windows.net:6380/0
REDIS_HOST=applyforus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_TLS=true
REDIS_SSL=true
```

**Kubernetes ConfigMap Reference:**
```yaml
# infrastructure/kubernetes/base/configmap.yaml:32-37
REDIS_HOST: "applyforus-redis.redis.cache.windows.net"
REDIS_PORT: "6380"
REDIS_TLS: "true"
REDIS_SSL: "true"
```

### 3. Message Queue (RabbitMQ → Azure Service Bus)

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **Azure Service Bus** | `applyforus-servicebus.servicebus.windows.net` |
| Development | RabbitMQ (Docker) | `localhost:5672` |

**Terraform Provisioned:**
```hcl
# infrastructure/terraform/main.tf:289-300
module "service_bus" {
  source = "./modules/service-bus"

  # Production Configuration
  sku = "Standard"  # or "Premium" for production
}
```

**Production Configuration:**
- Protocol: AMQP 1.0 over TLS
- Endpoint: `applyforus-servicebus.servicebus.windows.net`
- Features: Message queues, topics, subscriptions
- Authentication: Shared Access Signature (SAS) or Managed Identity

**Environment Variables (Production):**
```bash
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://applyforus-servicebus.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=${KEY}
AZURE_SERVICE_BUS_QUEUE_NAME=applyforus-queue
```

**Migration Notes:**
- **RabbitMQ is LOCAL ONLY**: Never use `RABBITMQ_URL` in production
- Production services use Azure Service Bus SDK instead of RabbitMQ clients
- Connection strings stored in Azure Key Vault

### 4. Elasticsearch (Search & Indexing)

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **Azure-hosted Elasticsearch** or **Azure Cognitive Search** | `applyforus-elasticsearch.azurewebsites.net:9200` |
| Development | Elasticsearch (Docker) | `localhost:9200` |

**Production Options:**

**Option A: Self-Hosted in AKS**
- Deploy Elasticsearch cluster in AKS
- Use StatefulSets for data persistence
- Managed via Kubernetes manifests

**Option B: Azure Cognitive Search (Recommended)**
- Fully managed search service
- No infrastructure management required
- Built-in AI capabilities

**Production Configuration:**
```bash
ELASTICSEARCH_URL=https://applyforus-elasticsearch.azurewebsites.net:9200
ELASTICSEARCH_NODE=https://applyforus-elasticsearch.azurewebsites.net:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_SSL=true
```

**Kubernetes ConfigMap Reference:**
```yaml
# infrastructure/kubernetes/base/configmap.yaml:39-43
ELASTICSEARCH_NODE: "https://applyforus-elasticsearch.azurewebsites.net:9200"
ELASTICSEARCH_URL: "https://applyforus-elasticsearch.azurewebsites.net:9200"
ELASTICSEARCH_SSL: "true"
```

### 5. Email Service (MailHog → SendGrid)

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **SendGrid** or **Azure Communication Services** | `smtp.sendgrid.net:587` |
| Development | MailHog (Docker) | `localhost:1025` |

**Production Configuration:**
```bash
# SendGrid (Recommended)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_FROM=noreply@applyforus.com
SENDGRID_API_KEY=${KEY_FROM_VAULT}

# Azure Communication Services (Alternative)
# Fully managed email service
```

**Kubernetes ConfigMap Reference:**
```yaml
# infrastructure/kubernetes/base/configmap.yaml:74-79
SMTP_HOST: "smtp.sendgrid.net"
SMTP_PORT: "587"
SMTP_SECURE: "false"
EMAIL_FROM: "noreply@applyforus.com"
```

### 6. Container Registry

| Environment | Runtime | Configuration |
|-------------|---------|---------------|
| **Production** | **Azure Container Registry (ACR)** | `applyforusacr.azurecr.io` |
| Development | Docker Hub | `docker.io` or local images |

**Terraform Provisioned:**
```hcl
# infrastructure/terraform/main.tf:113-129
module "container_registry" {
  source = "./modules/container-registry"

  # Production Configuration
  enable_defender = true

  # Access Control
  cicd_identity_principal_id     = module.managed_identity.cicd_identity_principal_id
  aks_identity_principal_id      = module.managed_identity.aks_kubelet_identity_principal_id
}
```

**Production Configuration:**
- Registry: `applyforusacr.azurecr.io`
- Authentication: Azure AD Managed Identity (for AKS)
- Security: Azure Defender enabled, image scanning

**Kubernetes Deployment Reference:**
```yaml
# infrastructure/kubernetes/production/auth-service-deployment.yaml:22
image: applyforusacr.azurecr.io/applyai-auth-service:latest
```

## Production Architecture

### Kubernetes (AKS) Configuration

All production services run in Azure Kubernetes Service with the following architecture:

```
Azure Kubernetes Service (AKS)
├── Namespace: applyforus
├── Deployments (Microservices)
│   ├── auth-service (2 replicas)
│   ├── user-service (2 replicas)
│   ├── job-service (2 replicas)
│   ├── resume-service (2 replicas)
│   ├── ai-service (2 replicas)
│   ├── auto-apply-service (2 replicas)
│   ├── notification-service (2 replicas)
│   ├── analytics-service (2 replicas)
│   └── orchestrator-service (2 replicas)
├── Services (Internal Load Balancing)
│   └── ClusterIP services for inter-service communication
├── ConfigMaps
│   ├── applyforus-config (non-sensitive configuration)
│   └── database-config (database endpoints)
└── Secrets (Azure Key Vault Integration)
    └── applyforus-secrets (synced from Azure Key Vault)
```

### Service Communication

**Internal (within AKS):**
```bash
# Services communicate via Kubernetes DNS
AUTH_SERVICE_URL=http://auth-service.applyforus.svc.cluster.local:8001
USER_SERVICE_URL=http://user-service.applyforus.svc.cluster.local:8002
JOB_SERVICE_URL=http://job-service.applyforus.svc.cluster.local:8004
```

**External (Azure Services):**
```bash
# PostgreSQL
POSTGRES_HOST=applyforus-postgres.postgres.database.azure.com

# Redis
REDIS_HOST=applyforus-redis.redis.cache.windows.net

# Service Bus
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://applyforus-servicebus.servicebus.windows.net/...
```

### Secrets Management

All production secrets are stored in **Azure Key Vault** and synchronized to Kubernetes using the **Azure Key Vault Provider for Secrets Store CSI Driver**.

**SecretProviderClass Configuration:**
```yaml
# infrastructure/kubernetes/base/secrets.yaml:46-157
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: applyforus-azure-keyvault
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    keyvaultName: "jobpilot-keyvault"
    objects: |
      array:
        - objectName: postgres-password
          objectType: secret
        - objectName: redis-password
          objectType: secret
        - objectName: jwt-secret
          objectType: secret
        # ... additional secrets
```

**Secrets Synced from Key Vault:**
- `postgres-user`, `postgres-password`
- `redis-password`
- `jwt-secret`, `jwt-refresh-secret`
- `azure-storage-connection-string`
- `azure-openai-api-key`
- `smtp-username`, `smtp-password`
- `google-client-id`, `google-client-secret`
- `linkedin-client-id`, `linkedin-client-secret`
- `encryption-key`
- `sendgrid-api-key`

## Environment Configuration Matrix

| Service | Local Dev | Production (Azure) |
|---------|-----------|-------------------|
| **PostgreSQL** | `localhost:5432` | `applyforus-postgres.postgres.database.azure.com:5432` |
| **Redis** | `localhost:6379` | `applyforus-redis.redis.cache.windows.net:6380` |
| **Message Queue** | `localhost:5672` (RabbitMQ) | Azure Service Bus (AMQP over TLS) |
| **Elasticsearch** | `localhost:9200` | `applyforus-elasticsearch.azurewebsites.net:9200` |
| **Email** | `localhost:1025` (MailHog) | `smtp.sendgrid.net:587` |
| **Storage** | Local filesystem | Azure Blob Storage |
| **Container Registry** | Docker Hub / Local | `applyforusacr.azurecr.io` |
| **Secrets** | `.env` files | Azure Key Vault |

## Docker Compose Files (Development Only)

The following Docker Compose files exist for **LOCAL DEVELOPMENT ONLY**:

| File | Purpose | Production Use |
|------|---------|---------------|
| `docker-compose.yml` | Base infrastructure services | NO - Dev only |
| `docker-compose.dev.yml` | Development environment with app services | NO - Dev only |
| `docker-compose.local.yml` | Complete local stack | NO - Dev only |
| `docker-compose.prod.yml` | Production-like local testing | NO - Local testing only |
| `docker-compose.test.yml` | Testing environment | NO - CI/CD only |
| `docker-compose.monitoring.yml` | Local monitoring stack | NO - Dev only |

**Important:** These files define:
- PostgreSQL (port 5432)
- Redis (port 6379)
- RabbitMQ (ports 5672, 15672)
- Elasticsearch (port 9200)
- MailHog (ports 1025, 8025)
- PgAdmin (port 5050) - Dev tool only

**Production Equivalent:** All these services are replaced by Azure managed services in production.

## Deployment Checklist

### Before Production Deployment

1. **Terraform Apply**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform plan -var-file="production.tfvars"
   terraform apply -var-file="production.tfvars"
   ```

2. **Verify Azure Resources**
   - Azure PostgreSQL Flexible Server: Running and accessible
   - Azure Cache for Redis: Provisioned and connected
   - Azure Service Bus: Namespace and queues created
   - Azure Key Vault: Secrets populated
   - Azure Container Registry: Images pushed
   - AKS Cluster: Running and healthy

3. **Configure Kubernetes**
   ```bash
   # Get AKS credentials
   az aks get-credentials --resource-group jobpilot-prod-rg --name jobpilot-prod-aks

   # Deploy base manifests
   kubectl apply -f infrastructure/kubernetes/base/

   # Deploy production manifests
   kubectl apply -f infrastructure/kubernetes/production/
   ```

4. **Verify Connectivity**
   ```bash
   # Test PostgreSQL connection
   kubectl exec -it deployment/auth-service -n applyforus -- \
     psql postgresql://applyforusadmin@applyforus-postgres:${PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require

   # Test Redis connection
   kubectl exec -it deployment/auth-service -n applyforus -- \
     redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls ping
   ```

5. **Verify Secrets Sync**
   ```bash
   # Check secrets are loaded from Key Vault
   kubectl get secret applyforus-secrets -n applyforus -o yaml
   kubectl describe secretproviderclass applyforus-azure-keyvault -n applyforus
   ```

### Production Validation

**Environment Variable Validation:**
```bash
# Ensure NO localhost references in production pods
kubectl exec -it deployment/auth-service -n applyforus -- env | grep -i localhost
# Expected: No results

# Verify Azure service endpoints
kubectl exec -it deployment/auth-service -n applyforus -- env | grep POSTGRES_HOST
# Expected: applyforus-postgres.postgres.database.azure.com

kubectl exec -it deployment/auth-service -n applyforus -- env | grep REDIS_HOST
# Expected: applyforus-redis.redis.cache.windows.net
```

## Migration from Docker to Azure

### Step 1: Stop Using Docker Compose for Production
- **Never** use `docker-compose.prod.yml` for actual production deployments
- Docker Compose is for **local development only**

### Step 2: Provision Azure Infrastructure
```bash
cd infrastructure/terraform
terraform apply -var-file="production.tfvars"
```

### Step 3: Update Environment Variables
Replace all localhost references with Azure service endpoints:

**Before (Local):**
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**After (Production):**
```bash
DATABASE_URL=postgresql://applyforusadmin@applyforus-postgres:${PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require
REDIS_URL=rediss://:${PASSWORD}@applyforus-redis.redis.cache.windows.net:6380/0
AZURE_SERVICE_BUS_CONNECTION_STRING=Endpoint=sb://applyforus-servicebus.servicebus.windows.net/...
```

### Step 4: Deploy to AKS
```bash
# Build and push images to ACR
docker build -t applyforusacr.azurecr.io/applyai-auth-service:latest services/auth-service
docker push applyforusacr.azurecr.io/applyai-auth-service:latest

# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/production/
```

### Step 5: Verify Production Deployment
```bash
# Check all pods are running
kubectl get pods -n applyforus

# Check services are healthy
kubectl get svc -n applyforus

# Verify no localhost connections
kubectl logs -n applyforus deployment/auth-service | grep localhost
```

## Terraform Modules Used

| Module | Purpose | Resources Created |
|--------|---------|------------------|
| `networking` | VNet, Subnets | Virtual Network, Subnets for AKS, DB, Cache |
| `postgresql-flexible` | Database | Azure PostgreSQL Flexible Server |
| `redis-cache` | Caching | Azure Cache for Redis (Premium) |
| `service-bus` | Messaging | Azure Service Bus Namespace, Queues |
| `container-registry` | Container Images | Azure Container Registry |
| `key-vault` | Secrets Management | Azure Key Vault |
| `aks` | Kubernetes | Azure Kubernetes Service |
| `app-insights` | Monitoring | Application Insights, Log Analytics |
| `monitoring` | Alerts & Metrics | Alert Rules, Action Groups |

## Summary

### What Runs in Azure (Production)
- Azure Kubernetes Service (AKS) - All microservices
- Azure PostgreSQL Flexible Server - Database
- Azure Cache for Redis - Caching
- Azure Service Bus - Message queue
- Azure Container Registry - Container images
- Azure Key Vault - Secrets management
- Azure Blob Storage - File storage
- Azure Application Insights - Monitoring
- SendGrid or Azure Communication Services - Email

### What Runs Locally (Development Only)
- Docker Compose - Infrastructure services
- PostgreSQL (Docker) - Local database
- Redis (Docker) - Local cache
- RabbitMQ (Docker) - Local message queue
- Elasticsearch (Docker) - Local search
- MailHog (Docker) - Email testing

### Critical Rules
1. **NEVER** use Docker Desktop for production
2. **NEVER** use localhost in production environment variables
3. **ALWAYS** use Azure managed services for production
4. **ALWAYS** store secrets in Azure Key Vault
5. **ALWAYS** use Kubernetes manifests for production deployments
6. **ALWAYS** use Azure Container Registry for production images

## Contact & Support

For questions about Azure runtime requirements:
- Review Terraform configurations in `infrastructure/terraform/`
- Check Kubernetes manifests in `infrastructure/kubernetes/production/`
- Verify Azure service endpoints in `infrastructure/kubernetes/base/configmap.yaml`
- Ensure secrets sync from Azure Key Vault in `infrastructure/kubernetes/base/secrets.yaml`

---

**Last Updated**: 2025-12-15
**Version**: 2.0.0
**Status**: Production Ready
