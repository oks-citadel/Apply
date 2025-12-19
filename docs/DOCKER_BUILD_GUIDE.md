# Docker Build Guide - ApplyForUs Platform

This guide explains how to build all Docker images for the ApplyForUs platform locally.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Build Script Usage](#build-script-usage)
- [Service Details](#service-details)
- [Troubleshooting](#troubleshooting)
- [Manual Build Instructions](#manual-build-instructions)

## Prerequisites

Before building Docker images, ensure you have:

1. **Docker Desktop** installed and running
   - Version 20.10 or higher recommended
   - Verify with: `docker --version`

2. **Git** installed
   - For VCS reference tagging
   - Verify with: `git --version`

3. **Sufficient disk space**
   - At least 50GB free space recommended
   - Images range from 300MB (frontends) to 1.7GB (auto-apply-service)

4. **Memory requirements**
   - Minimum 8GB RAM
   - 16GB recommended for building all images concurrently

## Quick Start

Build all images with a single command:

```bash
# From project root
./scripts/build-all-images.sh
```

This will:
- Build all 14 Docker images (11 backend services + 3 frontend apps)
- Tag each image with both `:latest` and `:v3.0.0`
- Use `applyforusacr.azurecr.io` as the registry prefix
- Display a comprehensive build summary

## Build Script Usage

### Location
```
scripts/build-all-images.sh
```

### Features

- **Automated building**: Builds all services sequentially
- **Dual tagging**: Creates both `:latest` and `:v3.0.0` tags
- **Build tracking**: Shows success/failure for each service
- **Colored output**: Easy to read build progress
- **Error handling**: Continues building even if individual services fail
- **Image listing**: Shows all built images at completion

### Configuration

The script uses these default values:

```bash
REGISTRY="applyforusacr.azurecr.io"
VERSION="v3.0.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD)
```

To use different values, edit the script or set environment variables before running:

```bash
export VERSION="v3.1.0"
./scripts/build-all-images.sh
```

### Build Order

The script builds services in this order:

#### Backend Services (11 total)
1. api-gateway
2. auth-service
3. user-service
4. job-service
5. resume-service
6. auto-apply-service
7. analytics-service
8. notification-service
9. payment-service
10. orchestrator-service
11. ai-service

#### Frontend Applications (3 total)
1. web (Job Seeker Portal)
2. admin (Admin Dashboard)
3. employer (Employer Portal)

## Service Details

### Backend Services

All backend services are NestJS-based and share similar characteristics:

- **Base Image**: `node:20-alpine`
- **Build Type**: Multi-stage (builder + production)
- **Package Manager**: pnpm 8.15.0
- **Security**: Non-root user (nodejs:1001)
- **Health Checks**: Included via curl
- **Size Range**: 880MB - 1.7GB

#### Special Notes:

**job-service**
- Largest service (931MB)
- Includes job aggregator functionality
- Redis integration for caching

**auto-apply-service**
- Largest image (1.72GB from previous builds)
- Includes AI processing dependencies
- Puppeteer for browser automation

**ai-service**
- Machine learning dependencies
- OpenAI integration
- Resume parsing capabilities

### Frontend Applications

All frontend apps are Next.js-based:

- **Base Image**: `node:20-alpine`
- **Build Type**: Multi-stage (builder + runner)
- **Output Mode**: Standalone (for Docker)
- **Package Manager**: pnpm 8.15.0
- **Size**: ~300MB each
- **Security**: Non-root user (nextjs:1001)

#### Port Assignments:
- **web**: 3000 (Job Seeker Portal)
- **admin**: 3001 (Admin Dashboard)
- **employer**: 3002 (Employer Portal)

#### Environment Variables:

Frontend builds require:
```bash
DOCKER_BUILD=1  # Triggers standalone output mode
NEXT_PUBLIC_API_URL=https://api.applyforus.com
NEXT_PUBLIC_AUTH_API_URL=https://api.applyforus.com
```

## Troubleshooting

### Common Issues

#### 1. Docker daemon not running
```
Error: Cannot connect to the Docker daemon
```

**Solution**: Start Docker Desktop

#### 2. Insufficient disk space
```
Error: no space left on device
```

**Solution**: Clean up old images
```bash
# Remove dangling images
docker image prune -f

# Remove all unused images
docker image prune -a
```

#### 3. Out of memory during build
```
Error: signal: killed
```

**Solution**: Increase Docker memory in Docker Desktop settings (Preferences → Resources)

#### 4. Next.js standalone output missing
```
Error: "/app/apps/web/.next/standalone": not found
```

**Solution**: Ensure `DOCKER_BUILD=1` is set in the Dockerfile (already fixed in v3.0.0)

#### 5. pnpm workspace resolution errors
```
Error: No projects found with pattern '@applyforus/types'
```

**Solution**: Ensure all workspace packages are copied before building
```dockerfile
COPY packages/ ./packages/
COPY services/SERVICE_NAME/ ./services/SERVICE_NAME/
```

### Build Performance Tips

1. **Layer Caching**: Docker caches layers, so rebuilds are faster
2. **Parallel Builds**: Build multiple services in parallel:
   ```bash
   # Build backend services in parallel (requires adequate resources)
   docker build ... api-gateway &
   docker build ... auth-service &
   wait
   ```

3. **BuildKit**: Enable BuildKit for faster builds:
   ```bash
   export DOCKER_BUILDKIT=1
   ./scripts/build-all-images.sh
   ```

## Manual Build Instructions

If you need to build a single service manually:

### Backend Service Example (api-gateway)

```bash
cd /path/to/Job-Apply-Platform

docker build \
  --file services/api-gateway/Dockerfile \
  --tag applyforusacr.azurecr.io/api-gateway:v3.0.0 \
  --tag applyforusacr.azurecr.io/api-gateway:latest \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
  --build-arg VERSION="v3.0.0" \
  .
```

### Frontend App Example (web)

```bash
cd /path/to/Job-Apply-Platform

docker build \
  --file apps/web/Dockerfile \
  --tag applyforusacr.azurecr.io/web:v3.0.0 \
  --tag applyforusacr.azurecr.io/web:latest \
  --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
  --build-arg VERSION="v3.0.0" \
  --build-arg DOCKER_BUILD="1" \
  --build-arg NEXT_PUBLIC_API_URL="https://api.applyforus.com" \
  --build-arg NEXT_PUBLIC_AUTH_API_URL="https://api.applyforus.com" \
  .
```

**Important**: Always run builds from the project root (`.` as context) because Dockerfiles reference monorepo packages.

## Verifying Builds

### List Built Images

```bash
# Show all ApplyForUs images
docker images applyforusacr.azurecr.io/*

# Show with formatting
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}" \
  --filter "reference=applyforusacr.azurecr.io/*"
```

### Inspect an Image

```bash
# View image details
docker inspect applyforusacr.azurecr.io/api-gateway:v3.0.0

# View image labels
docker inspect --format='{{json .Config.Labels}}' \
  applyforusacr.azurecr.io/api-gateway:v3.0.0 | jq
```

### Test an Image Locally

```bash
# Run a backend service
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e REDIS_URL="redis://..." \
  applyforusacr.azurecr.io/api-gateway:v3.0.0

# Run a frontend app
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL="http://localhost:8080" \
  applyforusacr.azurecr.io/web:v3.0.0
```

### Health Check

```bash
# Check if service is healthy
docker run -d --name test-api-gateway \
  applyforusacr.azurecr.io/api-gateway:v3.0.0

# Wait for health check
sleep 30

# View health status
docker inspect test-api-gateway | jq '.[0].State.Health'

# Cleanup
docker rm -f test-api-gateway
```

## Pushing to Azure Container Registry

**Note**: The build script does NOT push images automatically. This is intentional for safety.

### Login to ACR

```bash
# Using Azure CLI
az acr login --name applyforusacr

# Or using Docker login directly
docker login applyforusacr.azurecr.io \
  --username <service-principal-id> \
  --password <service-principal-password>
```

### Push Images

```bash
# Push a single image (both tags)
docker push applyforusacr.azurecr.io/api-gateway:v3.0.0
docker push applyforusacr.azurecr.io/api-gateway:latest

# Push all images with a specific tag
for service in api-gateway auth-service user-service job-service \
               resume-service auto-apply-service analytics-service \
               notification-service payment-service orchestrator-service \
               ai-service web admin employer; do
  echo "Pushing $service..."
  docker push applyforusacr.azurecr.io/$service:v3.0.0
  docker push applyforusacr.azurecr.io/$service:latest
done
```

### Automated Push Script

Create a push script for convenience:

```bash
#!/bin/bash
# scripts/push-all-images.sh

VERSION="v3.0.0"
REGISTRY="applyforusacr.azurecr.io"

SERVICES=(
  "api-gateway"
  "auth-service"
  "user-service"
  "job-service"
  "resume-service"
  "auto-apply-service"
  "analytics-service"
  "notification-service"
  "payment-service"
  "orchestrator-service"
  "ai-service"
  "web"
  "admin"
  "employer"
)

echo "Logging into ACR..."
az acr login --name applyforusacr

for service in "${SERVICES[@]}"; do
  echo "Pushing $service:$VERSION..."
  docker push "$REGISTRY/$service:$VERSION"
  docker push "$REGISTRY/$service:latest"
done

echo "All images pushed successfully!"
```

## Image Size Optimization

Current image sizes and optimization opportunities:

### Backend Services (~900MB each)
- **Opportunities**:
  - Use Alpine Linux (already implemented)
  - Multi-stage builds (already implemented)
  - Remove dev dependencies in production
  - Use `.dockerignore` effectively

### Frontend Apps (~300MB each)
- **Opportunities**:
  - Standalone output mode (already implemented)
  - Static asset optimization
  - Remove source maps in production (already implemented)
  - Image optimization in next.config.js

### Best Practices Applied

1. **Multi-stage builds**: Separate build and runtime stages
2. **Alpine Linux**: Minimal base images
3. **Non-root users**: Security best practice
4. **Health checks**: Container orchestration ready
5. **Layer caching**: Optimized COPY order
6. **Build arguments**: Flexible configuration
7. **Pinned base images**: Using SHA256 digests for security

## CI/CD Integration

### Azure DevOps Pipeline Example

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: docker-build-vars
  - name: imageTag
    value: '$(Build.BuildId)'

steps:
- task: Docker@2
  displayName: 'Build and Push Images'
  inputs:
    containerRegistry: 'applyforusacr'
    repository: '$(imageName)'
    command: 'buildAndPush'
    Dockerfile: '$(dockerfilePath)'
    tags: |
      $(imageTag)
      latest
    arguments: |
      --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
      --build-arg VCS_REF="$(Build.SourceVersion)"
      --build-arg VERSION="$(imageTag)"
```

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [api-gateway, auth-service, job-service, web]

    steps:
      - uses: actions/checkout@v4

      - name: Login to ACR
        uses: azure/docker-login@v1
        with:
          login-server: applyforusacr.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}

      - name: Build and push
        run: |
          docker build \
            --file services/${{ matrix.service }}/Dockerfile \
            --tag applyforusacr.azurecr.io/${{ matrix.service }}:${{ github.sha }} \
            --tag applyforusacr.azurecr.io/${{ matrix.service }}:latest \
            .
          docker push applyforusacr.azurecr.io/${{ matrix.service }}:${{ github.sha }}
          docker push applyforusacr.azurecr.io/${{ matrix.service }}:latest
```

## Maintenance

### Cleaning Up Old Images

```bash
# Remove images older than 7 days
docker image prune --all --filter "until=168h"

# Remove specific version
docker rmi applyforusacr.azurecr.io/api-gateway:v2.0.0

# Remove all untagged images
docker image prune -f
```

### Updating Base Images

To update Node.js base images:

1. Pull latest Node 20 Alpine:
   ```bash
   docker pull node:20-alpine
   ```

2. Get new SHA256 digest:
   ```bash
   docker inspect node:20-alpine | jq -r '.[0].RepoDigests[0]'
   ```

3. Update Dockerfiles with new digest:
   ```dockerfile
   FROM node:20-alpine@sha256:NEW_DIGEST_HERE AS builder
   ```

## Support

For issues or questions:

- **Documentation**: Check this guide first
- **Docker Issues**: Verify Docker Desktop is running and updated
- **Build Failures**: Check logs in the build output
- **Platform Issues**: Contact the platform team

## Version History

- **v3.0.0** (Current): Production-ready with all 14 services
- **v2.x.x**: Previous versions with gradual service additions
- **v1.0.0**: Initial Docker implementation

---

**Last Updated**: 2025-12-19
**Maintained By**: ApplyForUs Platform Team
