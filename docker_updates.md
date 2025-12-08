# Docker Updates for ApplyforUs Rebranding

This document details all Docker-related updates required for the rebranding from JobPilot to ApplyforUs.

---

## Summary

- **Docker Compose files:** 7
- **Dockerfiles:** 11
- **Container names:** 15+
- **Network names:** 2
- **Volume names:** 10+
- **Image names:** 12

---

## 1. Docker Compose Files

### 1.1 Main Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.yml`

#### Current Container Names and Networks:
```yaml
services:
  postgres:
    container_name: jobpilot-postgres
    environment:
      POSTGRES_DB: jobpilot
    networks:
      - jobpilot-network

  redis:
    container_name: jobpilot-redis
    networks:
      - jobpilot-network

  elasticsearch:
    container_name: jobpilot-elasticsearch
    networks:
      - jobpilot-network

  rabbitmq:
    container_name: jobpilot-rabbitmq
    networks:
      - jobpilot-network

  pgadmin:
    container_name: jobpilot-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@jobpilot.ai
    networks:
      - jobpilot-network

  mailhog:
    container_name: jobpilot-mailhog
    networks:
      - jobpilot-network

networks:
  jobpilot-network:
    driver: bridge
```

#### Updated Configuration:
```yaml
services:
  postgres:
    container_name: applyforus-postgres
    environment:
      POSTGRES_DB: applyforus
    networks:
      - applyforus-network

  redis:
    container_name: applyforus-redis
    networks:
      - applyforus-network

  elasticsearch:
    container_name: applyforus-elasticsearch
    networks:
      - applyforus-network

  rabbitmq:
    container_name: applyforus-rabbitmq
    networks:
      - applyforus-network

  pgadmin:
    container_name: applyforus-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@applyforus.com
    networks:
      - applyforus-network

  mailhog:
    container_name: applyforus-mailhog
    networks:
      - applyforus-network

networks:
  applyforus-network:
    driver: bridge
```

#### Changes:
- ✓ All container names: `jobpilot-*` → `applyforus-*`
- ✓ Database name: `POSTGRES_DB: jobpilot` → `POSTGRES_DB: applyforus`
- ✓ Network name: `jobpilot-network` → `applyforus-network`
- ✓ Email: `admin@jobpilot.ai` → `admin@applyforus.com`

---

### 1.2 Development Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.dev.yml`

#### Updates Required:
```yaml
services:
  web:
    container_name: applyforus-web
    networks:
      - applyforus-network

  postgres:
    container_name: applyforus-postgres
    environment:
      POSTGRES_DB: applyforus
    networks:
      - applyforus-network

  redis:
    container_name: applyforus-redis
    networks:
      - applyforus-network

  rabbitmq:
    container_name: applyforus-rabbitmq
    networks:
      - applyforus-network

  mailhog:
    container_name: applyforus-mailhog
    networks:
      - applyforus-network

networks:
  applyforus-network:
    driver: bridge
```

---

### 1.3 Local Development Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.local.yml`

#### Database Connection Strings:
```yaml
# OLD
DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/jobpilot

# NEW
DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/applyforus
```

#### All Services Environment Variables:
- Update all `DATABASE_URL` references
- Update `POSTGRES_DB` to `applyforus`
- Update container names
- Update network names

---

### 1.4 Production Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.prod.yml`

#### Changes:
- ✓ All container names
- ✓ All network names
- ✓ All volume names
- ✓ Database names
- ✓ Connection strings

---

### 1.5 Build Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.build.yml`

#### Image Names:
```yaml
# OLD
services:
  auth-service:
    image: jobpilot/auth-service:latest

  user-service:
    image: jobpilot/user-service:latest

  job-service:
    image: jobpilot/job-service:latest

# NEW
services:
  auth-service:
    image: applyforus/auth-service:latest

  user-service:
    image: applyforus/user-service:latest

  job-service:
    image: applyforus/job-service:latest
```

---

### 1.6 Monitoring Docker Compose

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.monitoring.yml`

#### Current Configuration:
```yaml
version: '3.9'
name: jobpilot-monitoring

services:
  prometheus:
    container_name: jobpilot-prometheus
    networks:
      - jobpilot-monitoring
      - jobpilot-network

  grafana:
    container_name: jobpilot-grafana
    networks:
      - jobpilot-monitoring
      - jobpilot-network

  node-exporter:
    container_name: jobpilot-node-exporter

  redis-exporter:
    container_name: jobpilot-redis-exporter
    networks:
      - jobpilot-network

  postgres-exporter:
    container_name: jobpilot-postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:postgres@postgres:5432/jobpilot?sslmode=disable
    networks:
      - jobpilot-network

  cadvisor:
    container_name: jobpilot-cadvisor

  alertmanager:
    container_name: jobpilot-alertmanager

  redis:
    container_name: jobpilot-redis
    networks:
      - jobpilot-network

  postgres:
    container_name: jobpilot-postgres
    environment:
      - POSTGRES_DB=jobpilot
    networks:
      - jobpilot-network

networks:
  jobpilot-monitoring:
    name: jobpilot-monitoring
  jobpilot-network:
    external: true
    name: jobpilot-network

volumes:
  prometheus-data:
    name: jobpilot-prometheus-data
  grafana-data:
    name: jobpilot-grafana-data
  alertmanager-data:
    name: jobpilot-alertmanager-data
  redis-data:
    name: jobpilot-redis-data
  postgres-data:
    name: jobpilot-postgres-data
```

#### Updated Configuration:
```yaml
version: '3.9'
name: applyforus-monitoring

services:
  prometheus:
    container_name: applyforus-prometheus
    networks:
      - applyforus-monitoring
      - applyforus-network

  grafana:
    container_name: applyforus-grafana
    networks:
      - applyforus-monitoring
      - applyforus-network

  node-exporter:
    container_name: applyforus-node-exporter

  redis-exporter:
    container_name: applyforus-redis-exporter
    networks:
      - applyforus-network

  postgres-exporter:
    container_name: applyforus-postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:postgres@postgres:5432/applyforus?sslmode=disable
    networks:
      - applyforus-network

  cadvisor:
    container_name: applyforus-cadvisor

  alertmanager:
    container_name: applyforus-alertmanager

  redis:
    container_name: applyforus-redis
    networks:
      - applyforus-network

  postgres:
    container_name: applyforus-postgres
    environment:
      - POSTGRES_DB=applyforus
    networks:
      - applyforus-network

networks:
  applyforus-monitoring:
    name: applyforus-monitoring
  applyforus-network:
    external: true
    name: applyforus-network

volumes:
  prometheus-data:
    name: applyforus-prometheus-data
  grafana-data:
    name: applyforus-grafana-data
  alertmanager-data:
    name: applyforus-alertmanager-data
  redis-data:
    name: applyforus-redis-data
  postgres-data:
    name: applyforus-postgres-data
```

#### Changes:
- ✓ Project name: `jobpilot-monitoring` → `applyforus-monitoring`
- ✓ All container names
- ✓ All network names
- ✓ All volume names
- ✓ Database name in connection string
- ✓ Postgres environment variable

---

## 2. Dockerfile Updates

### 2.1 Web Application

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\web\Dockerfile`

#### No brand-specific changes required
(Unless there are comments or labels with JobPilot references)

#### Add/Update Labels:
```dockerfile
LABEL org.opencontainers.image.title="ApplyforUs Web Application"
LABEL org.opencontainers.image.description="ApplyforUs AI Platform Web Interface"
LABEL org.opencontainers.image.vendor="ApplyforUs"
LABEL org.opencontainers.image.url="https://applyforus.com"
```

---

### 2.2 Admin Application

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\admin\Dockerfile`

#### Update Labels:
```dockerfile
LABEL org.opencontainers.image.title="ApplyforUs Admin Dashboard"
LABEL org.opencontainers.image.description="ApplyforUs AI Platform Admin Interface"
LABEL org.opencontainers.image.vendor="ApplyforUs"
```

---

### 2.3 Service Dockerfiles

For all service Dockerfiles:
- `services/auth-service/Dockerfile`
- `services/user-service/Dockerfile`
- `services/job-service/Dockerfile`
- `services/resume-service/Dockerfile`
- `services/auto-apply-service/Dockerfile`
- `services/analytics-service/Dockerfile`
- `services/notification-service/Dockerfile`
- `services/orchestrator-service/Dockerfile`

#### Update Labels in Each:
```dockerfile
LABEL org.opencontainers.image.title="ApplyforUs [Service Name]"
LABEL org.opencontainers.image.description="ApplyforUs AI Platform [Service Description]"
LABEL org.opencontainers.image.vendor="ApplyforUs"
LABEL org.opencontainers.image.url="https://applyforus.com"
```

---

### 2.4 AI Service (Python)

#### File: `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\ai-service\Dockerfile`

#### Update Labels:
```dockerfile
LABEL org.opencontainers.image.title="ApplyforUs AI Service"
LABEL org.opencontainers.image.description="ApplyforUs AI/ML Operations Service"
LABEL org.opencontainers.image.vendor="ApplyforUs"
```

---

## 3. Docker Image Naming Convention

### 3.1 Azure Container Registry

#### Registry Name:
```
applyforusacr.azurecr.io
```

#### Full Image Names:
```
applyforusacr.azurecr.io/web:v1.0.0
applyforusacr.azurecr.io/admin:v1.0.0
applyforusacr.azurecr.io/auth-service:v1.0.0
applyforusacr.azurecr.io/user-service:v1.0.0
applyforusacr.azurecr.io/job-service:v1.0.0
applyforusacr.azurecr.io/resume-service:v1.0.0
applyforusacr.azurecr.io/auto-apply-service:v1.0.0
applyforusacr.azurecr.io/analytics-service:v1.0.0
applyforusacr.azurecr.io/notification-service:v1.0.0
applyforusacr.azurecr.io/orchestrator-service:v1.0.0
applyforusacr.azurecr.io/ai-service:v1.0.0
```

---

### 3.2 Docker Hub

#### Organization:
```
applyforus
```

#### Image Names:
```
applyforus/web:latest
applyforus/admin:latest
applyforus/auth-service:latest
applyforus/user-service:latest
applyforus/job-service:latest
applyforus/resume-service:latest
applyforus/auto-apply-service:latest
applyforus/analytics-service:latest
applyforus/notification-service:latest
applyforus/orchestrator-service:latest
applyforus/ai-service:latest
```

---

## 4. Docker Network Configuration

### 4.1 Network Names

#### Old Networks:
```
jobpilot-network
jobpilot-monitoring
```

#### New Networks:
```
applyforus-network
applyforus-monitoring
```

---

### 4.2 Network Commands

#### Create Networks:
```bash
# Remove old networks
docker network rm jobpilot-network
docker network rm jobpilot-monitoring

# Create new networks
docker network create applyforus-network
docker network create applyforus-monitoring
```

---

## 5. Docker Volume Configuration

### 5.1 Volume Names

#### Old Volumes:
```
jobpilot-postgres-data
jobpilot-redis-data
jobpilot-elasticsearch-data
jobpilot-rabbitmq-data
jobpilot-rabbitmq-logs
jobpilot-pgadmin-data
jobpilot-prometheus-data
jobpilot-grafana-data
jobpilot-alertmanager-data
```

#### New Volumes:
```
applyforus-postgres-data
applyforus-redis-data
applyforus-elasticsearch-data
applyforus-rabbitmq-data
applyforus-rabbitmq-logs
applyforus-pgadmin-data
applyforus-prometheus-data
applyforus-grafana-data
applyforus-alertmanager-data
```

---

### 5.2 Volume Migration

#### Option 1: Fresh Start (Recommended for Dev)
```bash
# Remove old volumes (CAUTION: Data will be lost)
docker volume rm jobpilot-postgres-data
docker volume rm jobpilot-redis-data
# ... etc

# New volumes will be created automatically
docker-compose up -d
```

#### Option 2: Data Migration (For Production)
```bash
# Create new volumes
docker volume create applyforus-postgres-data
docker volume create applyforus-redis-data

# Copy data from old to new
docker run --rm -v jobpilot-postgres-data:/from -v applyforus-postgres-data:/to alpine sh -c "cd /from && cp -av . /to"
docker run --rm -v jobpilot-redis-data:/from -v applyforus-redis-data:/to alpine sh -c "cd /from && cp -av . /to"
```

---

## 6. Docker Build Commands

### 6.1 Build Script Updates

#### Old Build Command:
```bash
docker build -t jobpilot/auth-service:latest -f services/auth-service/Dockerfile .
```

#### New Build Command:
```bash
docker build -t applyforus/auth-service:latest -f services/auth-service/Dockerfile .
```

---

### 6.2 Build All Services Script

#### File: `scripts/build-docker-images.sh`

```bash
#!/bin/bash

# Build all Docker images for ApplyforUs platform

# Applications
docker build -t applyforus/web:latest -f apps/web/Dockerfile .
docker build -t applyforus/admin:latest -f apps/admin/Dockerfile .

# Services
docker build -t applyforus/auth-service:latest -f services/auth-service/Dockerfile .
docker build -t applyforus/user-service:latest -f services/user-service/Dockerfile .
docker build -t applyforus/job-service:latest -f services/job-service/Dockerfile .
docker build -t applyforus/resume-service:latest -f services/resume-service/Dockerfile .
docker build -t applyforus/auto-apply-service:latest -f services/auto-apply-service/Dockerfile .
docker build -t applyforus/analytics-service:latest -f services/analytics-service/Dockerfile .
docker build -t applyforus/notification-service:latest -f services/notification-service/Dockerfile .
docker build -t applyforus/orchestrator-service:latest -f services/orchestrator-service/Dockerfile .
docker build -t applyforus/ai-service:latest -f services/ai-service/Dockerfile .

echo "All images built successfully!"
```

---

## 7. Docker Push Commands

### 7.1 Push to Azure Container Registry

```bash
# Login to ACR
az acr login --name applyforusacr

# Tag images
docker tag applyforus/auth-service:latest applyforusacr.azurecr.io/auth-service:v1.0.0

# Push images
docker push applyforusacr.azurecr.io/auth-service:v1.0.0
```

---

### 7.2 Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Images are already tagged with applyforus/* prefix
docker push applyforus/auth-service:latest
```

---

## 8. Docker Compose Commands

### 8.1 Start Services

```bash
# OLD
docker-compose -p jobpilot up -d

# NEW
docker-compose -p applyforus up -d
```

---

### 8.2 Stop Services

```bash
# OLD
docker-compose -p jobpilot down

# NEW
docker-compose -p applyforus down
```

---

### 8.3 View Logs

```bash
# OLD
docker-compose -p jobpilot logs -f

# NEW
docker-compose -p applyforus logs -f
```

---

## 9. Environment Variables in Docker Compose

### Update in All Docker Compose Files:

```yaml
environment:
  # Database
  - POSTGRES_DB=applyforus
  - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/applyforus

  # Service URLs
  - AUTH_SERVICE_URL=http://auth-service:4001
  - USER_SERVICE_URL=http://user-service:4002

  # Application
  - APP_NAME=ApplyforUs
  - API_URL=https://api.applyforus.com
```

---

## 10. .dockerignore Files

#### Review and update if necessary:
- `apps/web/.dockerignore`
- `apps/admin/.dockerignore`
- `services/*/.dockerignore`

(Typically no brand-specific content, but check for comments)

---

## 11. Docker Health Checks

### Update Health Check URLs (if any):

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## 12. Cleanup Script

### File: `scripts/docker-cleanup.sh`

```bash
#!/bin/bash

echo "Cleaning up old JobPilot Docker resources..."

# Stop and remove old containers
docker stop $(docker ps -aq --filter name=jobpilot)
docker rm $(docker ps -aq --filter name=jobpilot)

# Remove old images
docker rmi $(docker images --filter=reference='jobpilot/*' -q)
docker rmi $(docker images --filter=reference='*jobpilot*' -q)

# Remove old networks
docker network rm jobpilot-network
docker network rm jobpilot-monitoring

# Remove old volumes (CAUTION: This will delete data!)
# Uncomment if you want to remove volumes
# docker volume rm $(docker volume ls -q --filter name=jobpilot)

echo "Cleanup complete!"
```

---

## 13. Testing

### Test Docker Setup:

```bash
# Test build
docker-compose build

# Test startup
docker-compose up -d

# Test health
docker ps
docker logs applyforus-web
docker logs applyforus-postgres

# Test connectivity
docker exec applyforus-web curl http://auth-service:4001/health

# Test database
docker exec applyforus-postgres psql -U postgres -d applyforus -c "SELECT 1;"

# Cleanup
docker-compose down
```

---

## 14. CI/CD Pipeline Updates

### Update Docker build steps in:
- `.github/workflows/build-and-scan.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `azure-pipelines.yml`

```yaml
# OLD
- name: Build Docker Image
  run: docker build -t jobpilot/auth-service:${{ github.sha }} .

# NEW
- name: Build Docker Image
  run: docker build -t applyforus/auth-service:${{ github.sha }} .
```

---

## 15. Complete Update Checklist

- [ ] Update all docker-compose.yml files
- [ ] Update all Dockerfile labels
- [ ] Update container names
- [ ] Update network names
- [ ] Update volume names
- [ ] Update image names
- [ ] Update database names
- [ ] Update connection strings
- [ ] Update build scripts
- [ ] Update push scripts
- [ ] Update CI/CD pipelines
- [ ] Test local Docker setup
- [ ] Test Docker build
- [ ] Test Docker compose up
- [ ] Verify all services start correctly
- [ ] Update documentation

---

## 16. Rollback Plan

If issues occur:

```bash
# Restore docker-compose files from git
git checkout -- docker-compose*.yml

# Or use backup
cp docker-compose.yml.backup docker-compose.yml

# Restart with old configuration
docker-compose up -d
```

---

**Generated:** 2025-12-08
**Status:** Ready for execution
**Priority:** HIGH - Must be done after package updates
