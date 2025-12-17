# Deployment Environments Quick Reference

## Overview

The ApplyForUs platform supports two distinct environments with **different infrastructure requirements**.

---

## Local Development (Optional Docker Desktop)

### Purpose
Rapid development and testing on your local machine without cloud dependencies.

### Infrastructure
All services run in **Docker containers** on your local machine:

```
┌─────────────────────────────────────────┐
│      Your Computer (Docker Desktop)     │
├─────────────────────────────────────────┤
│ PostgreSQL      → localhost:5432        │
│ Redis           → localhost:6379        │
│ Elasticsearch   → localhost:9200        │
│ RabbitMQ        → localhost:5672        │
│ Services        → localhost:800X        │
└─────────────────────────────────────────┘
```

### Setup

```bash
# 1. Start local infrastructure
pnpm docker:up
# OR
docker-compose up -d

# 2. Create local environment
cp .env.example .env.local

# 3. Edit .env.local - uncomment localhost sections
# Example:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
# REDIS_HOST=localhost
# RABBITMQ_URL=amqp://guest:guest@localhost:5672

# 4. Run services
pnpm dev
```

### When to Use
- ✅ Writing new features
- ✅ Testing changes locally
- ✅ Debugging issues
- ✅ Running integration tests
- ✅ Working offline

### What's Included
- PostgreSQL database
- Redis cache
- Elasticsearch search
- RabbitMQ message queue
- PgAdmin (database UI)
- Mailhog (email testing)

---

## Production (Azure Cloud - NO Docker Desktop)

### Purpose
Run the platform at scale for real users with high availability and security.

### Infrastructure
All services run on **Azure managed services** - NO local containers:

```
┌─────────────────────────────────────────────────────────┐
│              Azure Cloud Platform                        │
├─────────────────────────────────────────────────────────┤
│ Azure Kubernetes Service    → Container orchestration   │
│ PostgreSQL Flexible Server  → applyforus-postgres...    │
│ Azure Cache for Redis       → applyforus-redis...:6380  │
│ Azure Service Bus           → Message queue             │
│ Azure Blob Storage          → File storage              │
│ Application Insights        → Monitoring                │
│ Azure Key Vault             → Secrets                   │
└─────────────────────────────────────────────────────────┘
```

### Deployment Process

```bash
# Step 1: Push code to GitHub
git push origin main

# Step 2: GitHub Actions automatically:
# - Builds Docker images
# - Pushes to Azure Container Registry (ACR)
# - Deploys to Azure Kubernetes Service (AKS)
# - Runs health checks

# NO MANUAL STEPS REQUIRED
```

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.production.example` | Production environment variables template |
| `infrastructure/kubernetes/production/*.yaml` | Kubernetes deployment manifests |
| `infrastructure/terraform/*.tf` | Azure infrastructure as code |

### Key Differences from Local

| Component | Local Dev | Production |
|-----------|-----------|------------|
| **Database** | Docker PostgreSQL<br>`localhost:5432` | Azure PostgreSQL<br>`applyforus-postgres.postgres.database.azure.com:5432` |
| **Cache** | Docker Redis<br>`localhost:6379` | Azure Redis<br>`applyforus-redis.redis.cache.windows.net:6380` |
| **Messages** | Docker RabbitMQ<br>`localhost:5672` | Azure Service Bus<br>`applyforus-servicebus.servicebus.windows.net` |
| **Storage** | Local files<br>`./uploads/` | Azure Blob Storage<br>`applyforusstorage.blob.core.windows.net` |
| **Secrets** | `.env.local` file | Azure Key Vault + K8s Secrets |
| **SSL/TLS** | Disabled or self-signed | Required (Let's Encrypt) |
| **Scaling** | Single instance | Auto-scaling (2-10 pods) |

### When to Use
- ✅ Deploying to users
- ✅ Running load tests
- ✅ Demonstrating to stakeholders
- ✅ Production workloads

### What's NOT Included
- ❌ Docker Desktop
- ❌ docker-compose commands
- ❌ localhost references
- ❌ Local file storage

---

## Common Mistakes to Avoid

### ❌ WRONG: Using Docker Compose in Production

```bash
# NEVER DO THIS IN PRODUCTION
ssh production-server
docker-compose -f docker-compose.prod.yml up -d  # ❌ WRONG
```

**Why it's wrong:**
- No high availability
- No automatic scaling
- Data loss on container restart
- No managed backups
- Manual disaster recovery

### ✅ CORRECT: Deploy via GitHub Actions

```bash
# Push to GitHub - CI/CD handles the rest
git push origin main

# Or use kubectl for manual updates
kubectl set image deployment/auth-service \
  auth-service=applyforusacr.azurecr.io/applyai-auth-service:v1.2.3 \
  -n applyforus
```

---

## Environment Variables Guide

### Local Development (.env.local)

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/applyforus
DB_HOST=localhost
DB_PORT=5432

# Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Message Queue
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Services
AUTH_SERVICE_URL=http://localhost:8001
USER_SERVICE_URL=http://localhost:8002
```

### Production (.env.production or K8s ConfigMap)

```bash
# Database
DATABASE_URL=postgresql://applyforusadmin@applyforus-postgres:${DB_PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require
DB_HOST=applyforus-postgres.postgres.database.azure.com
DB_PORT=5432
DB_SSL=true

# Cache
REDIS_HOST=applyforus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_TLS=true
REDIS_PASSWORD=${REDIS_ACCESS_KEY}  # From Key Vault

# Message Queue
AZURE_SERVICE_BUS_CONNECTION_STRING=${SERVICE_BUS_CONNECTION_STRING}  # From Key Vault

# Services (Kubernetes internal DNS)
AUTH_SERVICE_URL=http://auth-service.applyforus.svc.cluster.local:8001
USER_SERVICE_URL=http://user-service.applyforus.svc.cluster.local:8002
```

---

## Troubleshooting

### "Connection refused to localhost" in Production

**Problem:** Service trying to connect to localhost in production pod.

**Solution:**
```bash
# Check pod environment
kubectl exec -it deployment/auth-service -n applyforus -- env | grep HOST

# Should show:
# DB_HOST=applyforus-postgres.postgres.database.azure.com
# NOT: DB_HOST=localhost

# If wrong, update ConfigMap
kubectl edit configmap applyforus-config -n applyforus
```

### "Database SSL required" Error

**Problem:** Connecting to Azure PostgreSQL without SSL.

**Solution:**
```bash
# Ensure these are set in production:
POSTGRES_SSL=true
DATABASE_URL=postgresql://...?sslmode=require
```

### Local Development Not Working

**Problem:** Services can't connect to local infrastructure.

**Solution:**
```bash
# 1. Check Docker is running
docker ps

# 2. Restart infrastructure
docker-compose down
docker-compose up -d

# 3. Verify .env.local uses localhost
grep "HOST" .env.local
# Should show: DB_HOST=localhost
```

---

## Quick Commands Reference

### Local Development

```bash
# Start infrastructure
pnpm docker:up

# Stop infrastructure
pnpm docker:down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Rebuild services
docker-compose build

# Clean up everything
docker-compose down -v  # WARNING: Deletes data
```

### Production

```bash
# Login to Azure
az login
az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-aks

# View deployments
kubectl get deployments -n applyforus

# View pods
kubectl get pods -n applyforus

# View logs
kubectl logs deployment/auth-service -n applyforus --tail=100 -f

# Scale deployment
kubectl scale deployment/auth-service --replicas=5 -n applyforus

# Update image
kubectl set image deployment/auth-service \
  auth-service=applyforusacr.azurecr.io/applyai-auth-service:latest \
  -n applyforus

# Rollback
kubectl rollout undo deployment/auth-service -n applyforus
```

---

## Summary

### Local Development
- **Uses:** Docker Desktop (optional)
- **Purpose:** Development and testing
- **Infrastructure:** Containers on your machine
- **Configuration:** `.env.local` with localhost
- **Commands:** `docker-compose`, `pnpm dev`

### Production
- **Uses:** Azure Cloud Services
- **Purpose:** Real users at scale
- **Infrastructure:** AKS + managed services
- **Configuration:** Kubernetes ConfigMap + Key Vault
- **Commands:** `kubectl`, GitHub Actions
- **NEVER:** Docker Compose, localhost

---

**For more details, see:**
- `ops/docs/docker-desktop-elimination-checklist.md` - Comprehensive audit
- `ops/docs/RUNTIME_MIGRATION_REPORT.md` - Migration analysis
- `README.md` - Getting started guide
- `infrastructure/terraform/README.md` - Infrastructure setup
