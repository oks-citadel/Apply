# ApplyPlatform CI/CD Setup Guide

Complete guide for setting up the Azure DevOps CI/CD pipeline for the ApplyPlatform monorepo.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Setup Instructions](#setup-instructions)
5. [Pipeline Configuration](#pipeline-configuration)
6. [Variable Groups](#variable-groups)
7. [Service Connections](#service-connections)
8. [Deployment Environments](#deployment-environments)
9. [Testing Strategy](#testing-strategy)
10. [Security Scanning](#security-scanning)
11. [Monitoring and Alerts](#monitoring-and-alerts)
12. [Troubleshooting](#troubleshooting)
13. [Best Practices](#best-practices)

---

## Overview

The ApplyPlatform CI/CD pipeline is a comprehensive, multi-stage pipeline that automates:

- **Build**: Compiles all frontend and backend services
- **Test**: Runs unit, integration, and E2E tests
- **Security**: Performs vulnerability scanning and SAST
- **Package**: Builds and pushes Docker images to ACR
- **Deploy**: Deploys to AKS across dev, staging, and production

### Pipeline Characteristics

- **Monorepo-friendly**: Leverages Turbo and pnpm workspaces
- **Multi-environment**: Supports dev, staging, and production
- **Parallel execution**: Jobs run concurrently where possible
- **Comprehensive testing**: Unit, integration, and E2E tests
- **Security-first**: Multiple security scanning layers
- **Production-ready**: Approval gates and rollback capabilities

---

## Prerequisites

### Azure Resources Required

1. **Azure DevOps Organization**
   - Organization: `citadelcloudmanagement`
   - Project: `ApplyPlatform`
   - Repository: `ApplyPlatform`

2. **Azure Subscription**
   - Active Azure subscription with sufficient credits
   - Contributor access or higher

3. **Azure Container Registry (ACR)**
   - Name: `applyforusacr`
   - SKU: Standard or Premium
   - Location: East US

4. **Azure Kubernetes Service (AKS) Clusters**
   - Dev: `applyforus-dev-aks`
   - Staging: `applyforus-staging-aks`
   - Production: `applyforus-prod-aks`

5. **Azure Key Vault**
   - Name: `applyforus-secrets`
   - For storing sensitive secrets

6. **Azure Database for PostgreSQL**
   - Separate instances for dev, staging, production

7. **Azure Cache for Redis**
   - Separate instances for dev, staging, production

### Required Tools and Permissions

- Azure DevOps Administrator access
- Azure Subscription Contributor role
- Azure CLI installed locally (for setup)
- kubectl installed locally (for verification)

### Third-Party Accounts (Optional but Recommended)

- Snyk account for vulnerability scanning
- SonarCloud account for code quality
- SendGrid account for email notifications
- OpenAI API key for AI features

---

## Architecture

### Pipeline Stages Flow

```
┌─────────────┐
│   Trigger   │ (Push to main/develop, PR)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Build    │ (Restore deps, Build apps, Lint, Type-check)
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐
│  Test   │    │Security │    │ Package │
│ (Unit)  │    │  Scan   │    │ (Docker)│
└────┬────┘    └────┬────┘    └────┬────┘
     │              │              │
     ├──────────────┴──────────────┤
     ▼
┌──────────────┐
│  Deploy Dev  │ (Auto on develop branch)
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Deploy Staging   │ (Auto on main branch)
└──────┬───────────┘
       │
       ▼
┌──────────────────────┐
│ Deploy Production    │ (Manual approval required)
└──────┬───────────────┘
       │
       ▼
┌──────────────────┐
│  Smoke Tests     │
└──────────────────┘
```

### Service Architecture

```
┌─────────────────────────────────────────────────────┐
│                 Azure DevOps Pipeline               │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│   ACR Push   │ │  Tests   │ │   Scanning   │
└──────┬───────┘ └──────────┘ └──────────────┘
       │
       ▼
┌────────────────────────────────────────────────────┐
│           Azure Kubernetes Service (AKS)           │
├────────────────────────────────────────────────────┤
│  Frontend: Web App, Admin Dashboard               │
│  Backend: 9 Microservices (NestJS + Python)       │
│  Data: PostgreSQL, Redis, Blob Storage            │
└────────────────────────────────────────────────────┘
```

---

## Setup Instructions

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://dev.azure.com/citadelcloudmanagement/ApplyPlatform/_git/ApplyPlatform
cd ApplyPlatform

# Verify pipeline files exist
ls -la ci-cd/azure-pipelines/
```

### Step 2: Create Azure Resources

```bash
# Set variables
RESOURCE_GROUP="applyforus-prod-rg"
LOCATION="eastus"
ACR_NAME="applyforusacr"
AKS_NAME="applyforus-prod-aks"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Azure Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Standard \
  --admin-enabled true

# Create AKS cluster
az aks create \
  --resource-group $RESOURCE_GROUP \
  --name $AKS_NAME \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-managed-identity \
  --attach-acr $ACR_NAME \
  --enable-addons monitoring \
  --generate-ssh-keys

# Create Key Vault for secrets
az keyvault create \
  --name applyforus-secrets \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --enable-rbac-authorization false
```

### Step 3: Create Service Principal

```bash
# Create service principal for Azure DevOps
SP_NAME="ApplyPlatform-CI-CD"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name $SP_NAME \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP

# Save the output (appId, password, tenant) - you'll need these!

# Grant additional permissions
SP_APP_ID="<appId-from-previous-command>"

# Grant AKS access
az role assignment create \
  --assignee $SP_APP_ID \
  --role "Azure Kubernetes Service Cluster Admin Role" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerService/managedClusters/$AKS_NAME

# Grant ACR access
az role assignment create \
  --assignee $SP_APP_ID \
  --role "AcrPush" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerRegistry/registries/$ACR_NAME

# Grant Key Vault access
az keyvault set-policy \
  --name applyforus-secrets \
  --spn $SP_APP_ID \
  --secret-permissions get list
```

### Step 4: Configure Azure DevOps

#### 4.1 Create Service Connections

1. Navigate to Azure DevOps: https://dev.azure.com/citadelcloudmanagement/ApplyPlatform
2. Go to: **Project Settings** > **Service connections**
3. Create the following connections:

**Azure Resource Manager Connection:**
- Name: `ApplyPlatform-Azure-Connection`
- Type: Azure Resource Manager
- Use the service principal created in Step 3

**Docker Registry Connection:**
- Name: `applyforus-acr`
- Type: Docker Registry
- Registry type: Azure Container Registry
- Registry: `applyforusacr.azurecr.io`

See [service-connections.md](./azure-pipelines/service-connections.md) for detailed instructions.

#### 4.2 Create Variable Groups

1. Go to: **Pipelines** > **Library** > **+ Variable group**
2. Create the following variable groups:

- `ApplyPlatform-Common`
- `ApplyPlatform-Dev`
- `ApplyPlatform-Staging`
- `ApplyPlatform-Production`
- `ApplyPlatform-Secrets`

See [variable-groups.yml](./azure-pipelines/variable-groups.yml) for all required variables.

#### 4.3 Link Azure Key Vault to Variable Groups

1. Edit `ApplyPlatform-Secrets` variable group
2. Toggle: **Link secrets from an Azure key vault as variables**
3. Select:
   - Azure subscription: Your subscription
   - Key vault name: `applyforus-secrets`
4. Add variables by selecting secrets from Key Vault

#### 4.4 Store Secrets in Key Vault

```bash
# Add secrets to Key Vault
az keyvault secret set --vault-name applyforus-secrets \
  --name DATABASE-PASSWORD --value "your-db-password"

az keyvault secret set --vault-name applyforus-secrets \
  --name JWT-SECRET --value "$(openssl rand -base64 32)"

az keyvault secret set --vault-name applyforus-secrets \
  --name REDIS-PASSWORD --value "your-redis-password"

az keyvault secret set --vault-name applyforus-secrets \
  --name SENDGRID-API-KEY --value "your-sendgrid-key"

az keyvault secret set --vault-name applyforus-secrets \
  --name OPENAI-API-KEY --value "your-openai-key"

# Continue for all required secrets...
```

### Step 5: Create Deployment Environments

1. Go to: **Pipelines** > **Environments** > **New environment**
2. Create three environments:

**Development Environment:**
- Name: `ApplyPlatform-dev`
- Resource type: Kubernetes
- Cluster: `applyforus-dev-aks`
- Namespace: `applyforus-dev`
- Approvals: None

**Staging Environment:**
- Name: `ApplyPlatform-staging`
- Resource type: Kubernetes
- Cluster: `applyforus-staging-aks`
- Namespace: `applyforus-staging`
- Approvals: None

**Production Environment:**
- Name: `ApplyPlatform-production`
- Resource type: Kubernetes
- Cluster: `applyforus-prod-aks`
- Namespace: `applyforus`
- Approvals: **Required** (add reviewers)

### Step 6: Create Pipeline

1. Go to: **Pipelines** > **New pipeline**
2. Select: **Azure Repos Git**
3. Select repository: `ApplyPlatform`
4. Select: **Existing Azure Pipelines YAML file**
5. Path: `/ci-cd/azure-pipelines/main-pipeline.yml`
6. Click: **Continue** > **Run**

---

## Pipeline Configuration

### Main Pipeline

Location: `ci-cd/azure-pipelines/main-pipeline.yml`

**Key Features:**
- Multi-stage pipeline with 8 stages
- Parallel job execution
- Environment-specific deployments
- Approval gates for production
- Comprehensive testing and security scanning

### Pipeline Templates

#### Security Scan Template

Location: `ci-cd/azure-pipelines/templates/security-scan.yml`

**Includes:**
- npm audit (Node.js dependencies)
- safety (Python dependencies)
- Semgrep (SAST)
- TruffleHog & GitLeaks (secret scanning)
- OWASP Dependency Check
- Optional: Snyk, SonarCloud

#### Build Images Template

Location: `ci-cd/azure-pipelines/templates/build-images.yml`

**Features:**
- Parallel Docker image builds
- Multi-platform support (Node.js, Python)
- Image tagging strategy (git SHA + semantic version)
- Trivy vulnerability scanning
- Image manifest generation

#### Deploy Template

Location: `ci-cd/azure-pipelines/templates/deploy.yml`

**Capabilities:**
- AKS deployment using kubectl
- Kubernetes manifest updates
- Secret management
- Database migrations
- Health checks and smoke tests
- Deployment reports

---

## Variable Groups

### ApplyPlatform-Common

Shared variables across all environments:
- Build tool versions (Node, pnpm, Python)
- Container registry details
- Feature flags

### ApplyPlatform-Dev

Development environment variables:
- AKS cluster: `applyforus-dev-aks`
- Namespace: `applyforus-dev`
- Domain: `dev.applyforus.com`
- Relaxed rate limits for testing

### ApplyPlatform-Staging

Staging environment variables:
- AKS cluster: `applyforus-staging-aks`
- Namespace: `applyforus-staging`
- Domain: `staging.applyforus.com`
- Production-like configuration

### ApplyPlatform-Production

Production environment variables:
- AKS cluster: `applyforus-prod-aks`
- Namespace: `applyforus`
- Domain: `applyforus.com`
- Strict rate limits and monitoring

### ApplyPlatform-Secrets

Sensitive secrets (linked from Azure Key Vault):
- Database credentials
- Redis credentials
- JWT secrets
- API keys (SendGrid, OpenAI, etc.)
- OAuth client secrets
- Storage account keys

See [variable-groups.yml](./azure-pipelines/variable-groups.yml) for complete list.

---

## Service Connections

### Required Connections

1. **ApplyPlatform-Azure-Connection**
   - Type: Azure Resource Manager
   - Purpose: Deploy to AKS, access Azure resources

2. **applyforus-acr**
   - Type: Docker Registry
   - Purpose: Push/pull container images

### Optional Connections

3. **Snyk** - Vulnerability scanning
4. **SonarCloud** - Code quality analysis
5. **GitHub-ApplyPlatform** - GitHub integration

See [service-connections.md](./azure-pipelines/service-connections.md) for setup instructions.

---

## Deployment Environments

### Environment Strategy

```
develop branch → Dev Environment (auto)
     ↓
main branch → Staging Environment (auto)
     ↓
Manual approval → Production Environment
```

### Dev Environment

- **Purpose**: Development and feature testing
- **Deployment**: Automatic on push to `develop`
- **Approval**: None required
- **Resources**: Minimal (cost-effective)
- **Data**: Test data only

### Staging Environment

- **Purpose**: Pre-production validation
- **Deployment**: Automatic on push to `main`
- **Approval**: None required
- **Resources**: Production-like
- **Data**: Sanitized production data

### Production Environment

- **Purpose**: Live user-facing application
- **Deployment**: Manual trigger after staging validation
- **Approval**: **Required** (multiple reviewers)
- **Resources**: Optimized for scale
- **Data**: Real user data
- **Monitoring**: Enhanced with alerts

---

## Testing Strategy

### Unit Tests

- **Framework**: Jest, Vitest
- **Coverage**: 80% minimum
- **Execution**: Every build
- **Location**: Each service

```bash
pnpm run test
```

### Integration Tests

- **Framework**: Jest with test containers
- **Dependencies**: PostgreSQL, Redis (Docker)
- **Execution**: After unit tests
- **Scope**: API endpoints, database interactions

```bash
pnpm run test:integration
```

### E2E Tests

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Execution**: On develop/main branches
- **Scope**: Critical user journeys

```bash
pnpm run test:e2e
```

### Smoke Tests

- **Type**: Post-deployment validation
- **Execution**: After each deployment
- **Checks**: Health endpoints, critical APIs

---

## Security Scanning

### Dependency Scanning

**Tools:**
- npm audit (Node.js)
- safety (Python)
- Snyk (comprehensive)

**Schedule:** Every build

**Thresholds:**
- Critical: Fail build
- High: Warning
- Medium/Low: Informational

### SAST (Static Application Security Testing)

**Tools:**
- ESLint with security plugin
- Semgrep (open source)
- SonarCloud (optional)

**Checks:**
- SQL injection patterns
- XSS vulnerabilities
- Insecure cryptography
- Hardcoded secrets

### Secret Scanning

**Tools:**
- TruffleHog
- GitLeaks

**Scope:**
- Full repository history
- All branches
- Commit messages

**Action:** Fail build if secrets detected

### Container Scanning

**Tool:** Trivy

**Scope:**
- All Docker images
- OS packages
- Application dependencies

**Reporting:** JSON reports in artifacts

---

## Monitoring and Alerts

### Pipeline Monitoring

- Build success/failure rates
- Build duration trends
- Test pass rates
- Deployment frequency

### Application Monitoring (Post-Deployment)

**Recommended Tools:**
- Azure Monitor
- Application Insights
- Prometheus + Grafana (already configured)

**Key Metrics:**
- Request latency
- Error rates
- Resource utilization
- Database performance

### Alerting

**Alert Channels:**
- Azure DevOps notifications
- Email
- Slack/Teams (via webhooks)
- PagerDuty (production)

**Alert Conditions:**
- Build failures
- Test failures
- Security vulnerabilities found
- Deployment failures
- High error rates post-deployment

---

## Troubleshooting

### Common Issues

#### Issue 1: Pipeline fails at build stage

**Symptoms:** npm install or pnpm install fails

**Solutions:**
```bash
# Clear cache
az pipelines runs artifact download --artifact-name pnpm-cache --path .

# Update lockfile
pnpm install --no-frozen-lockfile
git commit -am "Update lockfile"
```

#### Issue 2: Docker image build fails

**Symptoms:** Dockerfile build errors

**Solutions:**
```bash
# Test locally
docker build -f apps/web/Dockerfile .

# Check for missing files
git ls-files apps/web/

# Verify .dockerignore
cat .dockerignore
```

#### Issue 3: AKS deployment fails

**Symptoms:** kubectl apply fails

**Solutions:**
```bash
# Get AKS credentials locally
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Check cluster status
kubectl get nodes
kubectl get pods -n applyforus

# Verify image pull
kubectl describe pod <pod-name> -n applyforus

# Check secrets
kubectl get secrets -n applyforus
```

#### Issue 4: Tests fail intermittently

**Symptoms:** Flaky tests in CI

**Solutions:**
```bash
# Increase timeout
# In test file:
jest.setTimeout(30000)

# Run tests with retries
npx jest --maxWorkers=1 --retry 3

# Check for race conditions
# Add proper async/await
```

#### Issue 5: Service connection authentication fails

**Symptoms:** "Could not authenticate" errors

**Solutions:**
```bash
# Refresh service principal credentials
az ad sp credential reset --id <sp-id>

# Update service connection in Azure DevOps
# Project Settings > Service connections > Edit

# Verify permissions
az role assignment list --assignee <sp-id>
```

### Debug Mode

Enable verbose logging in pipeline:

```yaml
variables:
  system.debug: true
```

### Pipeline Logs

Access logs:
1. Go to pipeline run
2. Click on failed stage/job
3. Review detailed logs
4. Download logs for offline analysis

---

## Best Practices

### 1. Branch Strategy

```
main
 ├── develop
 │    ├── feature/new-feature
 │    └── bugfix/fix-issue
 └── hotfix/critical-fix
```

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### 2. Commit Messages

Follow conventional commits:

```
feat: add user profile editing
fix: resolve authentication token expiry
chore: update dependencies
docs: improve API documentation
test: add integration tests for job service
```

### 3. Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Create PR to `develop`
4. Wait for CI checks to pass
5. Request code review
6. Merge after approval

### 4. Deployment Strategy

**Dev Environment:**
- Deploy frequently (multiple times per day)
- Test new features
- Experiment with changes

**Staging Environment:**
- Deploy after feature completion
- Run full test suite
- Validate with stakeholders

**Production Environment:**
- Deploy during maintenance windows
- Monitor closely post-deployment
- Have rollback plan ready

### 5. Secret Management

- Never commit secrets to code
- Use Azure Key Vault for all secrets
- Rotate secrets regularly (90 days)
- Use separate secrets per environment
- Audit secret access

### 6. Performance Optimization

**Build Optimization:**
```yaml
# Use caching
- task: Cache@2
  inputs:
    key: 'pnpm | "$(Agent.OS)" | pnpm-lock.yaml'
    path: $(pnpmCacheFolder)

# Parallel jobs
strategy:
  parallel: 4
```

**Docker Build Optimization:**
```dockerfile
# Multi-stage builds
FROM node:20-alpine AS builder
# ... build steps

FROM node:20-alpine AS runner
COPY --from=builder /app/dist ./dist
```

### 7. Security Best Practices

- Enable secret scanning
- Require code reviews
- Use branch protection rules
- Implement RBAC in AKS
- Enable audit logging
- Regular security updates

### 8. Monitoring and Observability

- Implement structured logging
- Add distributed tracing
- Monitor key metrics
- Set up alerts
- Regular log review

---

## Maintenance

### Regular Tasks

#### Daily
- [ ] Monitor pipeline success rates
- [ ] Review failed builds
- [ ] Check security alerts

#### Weekly
- [ ] Review and merge dependency updates
- [ ] Clean up old branches
- [ ] Review pipeline performance

#### Monthly
- [ ] Update pipeline templates
- [ ] Review and update variable groups
- [ ] Rotate non-Key Vault secrets
- [ ] Pipeline optimization review

#### Quarterly
- [ ] Rotate service principal credentials
- [ ] Review and update security policies
- [ ] Audit access permissions
- [ ] Major version updates

---

## Additional Resources

### Documentation

- [Azure DevOps Pipelines Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [Azure Kubernetes Service Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

### Internal Documentation

- [Service Connections Setup](./azure-pipelines/service-connections.md)
- [Variable Groups Configuration](./azure-pipelines/variable-groups.yml)
- [Kubernetes Manifests](../../infrastructure/kubernetes/)
- [Terraform Configuration](../../infrastructure/terraform/)

### Support

- **DevOps Team**: devops@applyforus.com
- **Azure Support**: Via Azure Portal
- **Emergency**: Use PagerDuty for production issues

---

## Changelog

### Version 1.0.0 (2025-01-08)

- Initial CI/CD pipeline setup
- Multi-stage pipeline with 8 stages
- Comprehensive security scanning
- Multi-environment deployment
- Docker image building and scanning
- Integration with Azure services

---

## License

Internal use only - ApplyForUs Platform
Copyright © 2025 Citadel Cloud Management

---

## Appendix

### A. Pipeline YAML Structure

```
ci-cd/
├── azure-pipelines/
│   ├── main-pipeline.yml          # Main pipeline
│   ├── templates/
│   │   ├── security-scan.yml      # Security scanning jobs
│   │   ├── build-images.yml       # Docker image builds
│   │   └── deploy.yml             # Deployment jobs
│   ├── variable-groups.yml        # Variable group definitions
│   └── service-connections.md     # Service connection docs
└── CI-CD_SETUP.md                 # This file
```

### B. Environment Variables Reference

See [variable-groups.yml](./azure-pipelines/variable-groups.yml) for complete list.

### C. Kubernetes Resources

All Kubernetes manifests are in: `infrastructure/kubernetes/`

### D. Container Images

All images are tagged with:
- Git SHA: `$(Build.SourceVersion)`
- Semantic version: `1.0.$(Build.BuildId)`
- Latest: `latest`

Format: `applyforusacr.azurecr.io/applyforus-<service>:<tag>`

### E. Service Ports

| Service | Port | Protocol |
|---------|------|----------|
| Web App | 3000 | HTTP |
| Auth Service | 4000 | HTTP |
| User Service | 4001 | HTTP |
| Job Service | 4002 | HTTP |
| Resume Service | 4003 | HTTP |
| Notification Service | 4004 | HTTP |
| Auto Apply Service | 4005 | HTTP |
| Analytics Service | 4006 | HTTP |
| Orchestrator Service | 4007 | HTTP |
| AI Service | 5000 | HTTP |

---

**End of CI/CD Setup Guide**
