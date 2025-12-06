# Azure DevOps CI/CD Pipeline Configuration

## Overview

This document describes the complete Azure DevOps CI/CD pipeline configuration for the JobPilot AI Platform. The pipeline is designed to automate building, testing, and deploying the entire microservices platform to multiple environments.

## Pipeline File

**Location**: `azure-pipelines.yml`

## Pipeline Architecture

The pipeline consists of 8 stages:

1. **Build & Validate** - Code quality checks
2. **Unit Tests** - Run unit tests for all services
3. **Integration Tests** - Test service interactions
4. **E2E Tests** - End-to-end testing
5. **Build Docker Images** - Build and push all service images
6. **Deploy to Development** - Auto-deploy on develop branch
7. **Deploy to Staging** - Auto-deploy on main branch
8. **Deploy to Production** - Manual approval required

## Stages Details

### Stage 1: Build & Validate

**Jobs:**
- Setup Dependencies
- Lint Code (ESLint + Prettier)
- TypeScript Type Check

**What it does:**
- Installs Node.js 20.x and pnpm 8.15.0
- Caches dependencies for faster builds
- Runs linting on all services
- Performs TypeScript type checking

### Stage 2: Unit Tests

**Jobs:**
- Unit Tests - Node.js Services
- Unit Tests - Python AI Service

**What it does:**
- Spins up PostgreSQL and Redis containers
- Runs unit tests for all Node.js services
- Runs Python tests for AI service
- Publishes test results and code coverage

### Stage 3: Integration Tests

**Jobs:**
- Integration Tests

**What it does:**
- Spins up PostgreSQL, Redis, and Elasticsearch
- Runs integration tests
- Publishes test results

### Stage 4: E2E Tests

**Jobs:**
- E2E Tests

**What it does:**
- Installs Playwright browsers
- Runs end-to-end tests
- Publishes Playwright reports

### Stage 5: Build Docker Images

**Jobs (all run in parallel):**
- Build Web App
- Build Auth Service
- Build User Service
- Build Job Service
- Build Resume Service
- Build Notification Service
- Build Auto-Apply Service
- Build AI Service
- Build Analytics Service

**What it does:**
- Builds Docker images for all services
- Pushes images to Docker Hub (citadelplatforms/applyai)
- Tags images with:
  - Build ID
  - `latest`
  - Branch name + Build ID

**Docker Registry**: `citadelplatforms`
**Image Naming**: `applyai-<service-name>:<tag>`

### Stage 6: Deploy to Development

**Trigger**: Auto-deploy on `develop` branch
**Environment**: development
**Namespace**: jobpilot-dev

**What it does:**
- Deploys to Kubernetes cluster
- Updates all service deployments
- Waits for rollout completion
- Runs smoke tests

### Stage 7: Deploy to Staging

**Trigger**: Auto-deploy on `main` branch
**Environment**: staging
**Namespace**: jobpilot-staging

**What it does:**
- Deploys to Kubernetes cluster
- Updates all service deployments
- Waits for rollout completion
- Runs smoke tests

### Stage 8: Deploy to Production

**Trigger**: Manual approval required on `main` branch
**Environment**: production
**Namespace**: jobpilot-prod

**What it does:**
- Displays deployment summary
- Deploys to Kubernetes cluster using rolling update strategy
- Updates all service deployments
- Waits for rollout completion (10 min timeout)
- Runs production smoke tests
- Monitors deployment for 5 minutes

## Configuration Requirements

### 1. Service Connections

You need to configure these service connections in Azure DevOps:

#### Docker Hub Connection
- **Name**: `DockerHub-ServiceConnection`
- **Type**: Docker Registry
- **Registry**: Docker Hub
- **Username**: Your Docker Hub username
- **Password**: Your Docker Hub password or access token

#### Kubernetes Connections
- **Name**: `K8s-Dev-ServiceConnection`
- **Type**: Kubernetes
- **Cluster**: Development cluster

- **Name**: `K8s-Staging-ServiceConnection`
- **Type**: Kubernetes
- **Cluster**: Staging cluster

- **Name**: `K8s-Prod-ServiceConnection`
- **Type**: Kubernetes
- **Cluster**: Production cluster

### 2. Variable Groups

Configure these variable groups in Azure DevOps Library:

#### common-secrets
Common variables used across all environments:
```yaml
# Add common secrets here
```

#### dev-secrets
Development environment variables:
```yaml
DATABASE_URL: postgresql://...
REDIS_URL: redis://...
JWT_SECRET: ...
# Add other dev-specific secrets
```

#### staging-secrets
Staging environment variables:
```yaml
DATABASE_URL: postgresql://...
REDIS_URL: redis://...
JWT_SECRET: ...
# Add other staging-specific secrets
```

#### prod-secrets
Production environment variables:
```yaml
DATABASE_URL: postgresql://...
REDIS_URL: redis://...
JWT_SECRET: ...
# Add other production-specific secrets
```

### 3. Environments

Configure these environments in Azure DevOps with appropriate approval gates:

#### development
- **Approvers**: None (auto-deploy)
- **Checks**: None

#### staging
- **Approvers**: Team leads (optional)
- **Checks**: Pre-deployment approvals (optional)

#### production
- **Approvers**: Required - Engineering Manager, Product Owner
- **Checks**:
  - Pre-deployment approvals (mandatory)
  - Post-deployment checks
  - Business hours only (optional)

## Docker Images

All services are built and pushed to Docker Hub:

| Service | Docker Image |
|---------|-------------|
| Web App | `citadelplatforms/applyai-web:latest` |
| Auth Service | `citadelplatforms/applyai-auth-service:latest` |
| User Service | `citadelplatforms/applyai-user-service:latest` |
| Job Service | `citadelplatforms/applyai-job-service:latest` |
| Resume Service | `citadelplatforms/applyai-resume-service:latest` |
| Notification Service | `citadelplatforms/applyai-notification-service:latest` |
| Auto-Apply Service | `citadelplatforms/applyai-auto-apply-service:latest` |
| AI Service | `citadelplatforms/applyai-ai-service:latest` |
| Analytics Service | `citadelplatforms/applyai-analytics-service:latest` |

## Deployment Strategy

### Development (develop branch)
- **Strategy**: Rolling update
- **Trigger**: Automatic on push to develop
- **Approval**: None required

### Staging (main branch)
- **Strategy**: Rolling update
- **Trigger**: Automatic on push to main
- **Approval**: Optional (configurable)

### Production (main branch)
- **Strategy**: Rolling update with extended timeouts
- **Trigger**: After staging deployment
- **Approval**: **REQUIRED** - Must be configured in Azure DevOps Environments
- **Monitoring**: 5-minute post-deployment monitoring

## Environment Variables

The pipeline uses these predefined variables:

| Variable | Value | Description |
|----------|-------|-------------|
| NODE_VERSION | 20 | Node.js version |
| PNPM_VERSION | 8.15.0 | pnpm package manager version |
| PYTHON_VERSION | 3.11 | Python version for AI service |
| DOCKER_BUILDKIT | 1 | Enable Docker BuildKit |
| DOCKER_REGISTRY | citadelplatforms | Docker Hub organization |
| DOCKER_IMAGE_PREFIX | applyai | Prefix for all images |

## Branch Strategy

- **develop**: Development environment
  - Auto-deploy to dev environment
  - No manual approval required

- **main**: Production path
  - Auto-deploy to staging
  - Manual approval for production
  - All tests must pass

## Setting Up the Pipeline

### Step 1: Create Service Connections

1. Go to Azure DevOps Project Settings → Service connections
2. Create Docker Hub connection:
   - Click "New service connection"
   - Select "Docker Registry"
   - Choose "Docker Hub"
   - Enter credentials
   - Name it `DockerHub-ServiceConnection`

3. Create Kubernetes connections:
   - Click "New service connection"
   - Select "Kubernetes"
   - Configure for each cluster (dev, staging, prod)
   - Name them appropriately

### Step 2: Create Variable Groups

1. Go to Pipelines → Library
2. Click "+ Variable group"
3. Create the following groups:
   - `common-secrets`
   - `dev-secrets`
   - `staging-secrets`
   - `prod-secrets`
4. Add variables to each group

### Step 3: Create Environments

1. Go to Pipelines → Environments
2. Create three environments:
   - `development`
   - `staging`
   - `production`
3. Configure approvals for `production`:
   - Click on the environment
   - Go to "Approvals and checks"
   - Add "Approvals"
   - Add required approvers

### Step 4: Create the Pipeline

1. Go to Pipelines → Pipelines
2. Click "New pipeline"
3. Select your repository
4. Choose "Existing Azure Pipelines YAML file"
5. Select `azure-pipelines.yml`
6. Click "Run"

## Test Coverage

The pipeline generates and publishes:
- Unit test results (JUnit format)
- Integration test results
- E2E test results (Playwright)
- Code coverage reports (Cobertura)

Reports are available in:
- Azure DevOps → Pipelines → Tests
- Azure DevOps → Pipelines → Code Coverage

## Monitoring and Notifications

### Build Status
Check build status at:
- Azure DevOps → Pipelines → Recent runs

### Failed Builds
Failed builds will:
- Show in the pipeline runs view
- Send email notifications (if configured)
- Block deployments to subsequent stages

### Production Monitoring
After production deployment:
- 5-minute monitoring period
- Check Application Insights
- Review logs for errors

## Troubleshooting

### Common Issues

#### 1. Docker Hub authentication fails
**Solution**: Verify DockerHub-ServiceConnection credentials

#### 2. Kubernetes deployment fails
**Solution**:
- Check service connection permissions
- Verify cluster access
- Check namespace exists

#### 3. Tests fail
**Solution**:
- Review test results in Azure DevOps
- Check service containers are running
- Verify database connectivity

#### 4. Build takes too long
**Solution**:
- Check pnpm cache is working
- Verify parallel job execution
- Consider using self-hosted agents

## Performance Optimization

- **Caching**: pnpm dependencies are cached
- **Parallel Builds**: All Docker images build in parallel
- **Artifact Reuse**: Source code published once, reused in all jobs
- **Incremental Builds**: Docker layer caching enabled

## Security Best Practices

1. **Secrets Management**: All secrets stored in Azure Key Vault or Variable Groups
2. **Image Scanning**: Consider adding Trivy or similar scanning
3. **Approval Gates**: Production requires manual approval
4. **Service Connections**: Use managed identities where possible
5. **Access Control**: Limit pipeline edit permissions

## Kubernetes Deployment

The pipeline uses Kubernetes manifests from:
```
infrastructure/kubernetes/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── ingress.yaml
└── services/
    ├── web-app.yaml
    ├── auth-service.yaml
    ├── user-service.yaml
    ├── job-service.yaml
    ├── resume-service.yaml
    ├── notification-service.yaml
    ├── auto-apply-service.yaml
    ├── ai-service.yaml
    └── analytics-service.yaml
```

## Next Steps

1. Configure all service connections
2. Set up variable groups with actual secrets
3. Configure production environment approvals
4. Test the pipeline on develop branch
5. Monitor first few deployments closely
6. Set up additional monitoring and alerting

## Support

For issues or questions:
- Review Azure DevOps pipeline logs
- Check Kubernetes pod logs
- Contact DevOps team

## Additional Resources

- [Azure DevOps Pipelines Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
