# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the ApplyForUs Platform CI/CD pipeline.

> **Note**: This project has migrated from Azure DevOps to GitHub Actions for CI/CD. The Azure DevOps pipeline at `.azuredevops/pipelines/` is deprecated.

## Primary Workflow

### ci-cd.yml - Unified CI/CD Pipeline (RECOMMENDED)

**Purpose**: Complete CI/CD pipeline that replaces Azure DevOps

**File**: `ci-cd.yml`

**When it runs**:
- Push to `main` -> Tests + Build + Deploy to Staging
- Push to `develop` -> Tests + Build + Deploy to Dev
- Push to `release/*` -> Tests + Build + Deploy to Staging
- Pull requests -> Tests + Build (no deploy)
- Manual trigger with environment selection

**Pipeline Stages**:

| Stage | Description | Duration |
|-------|-------------|----------|
| 1. Setup | Generate metadata, determine deployment target | ~1 min |
| 2. Lint & Type Check | ESLint, Prettier, TypeScript | ~5 min |
| 3. Security Scan | Dependency audit, secrets detection | ~3 min |
| 4. Unit Tests | Web app + all services (parallel) | ~10 min |
| 5. Build Images | Docker build + push to ACR (parallel) | ~15 min |
| 6. Create Manifest | Deployment manifest with digests | ~1 min |
| 7. Deploy Dev | Auto-deploy from develop branch | ~5 min |
| 8. Deploy Staging | Auto-deploy from main/release | ~5 min |
| 9. Deploy Production | Manual approval required | ~10 min |
| 10. Notify | Slack notifications, summary | ~1 min |

**Total Runtime**: ~35-45 minutes (depending on parallelization)

## Required Secrets

### Azure OIDC Authentication (Recommended)

```yaml
# Azure AD App Registration for OIDC
AZURE_CLIENT_ID        # Azure AD App client ID
AZURE_TENANT_ID        # Azure AD tenant ID
AZURE_SUBSCRIPTION_ID  # Azure subscription ID
```

### Legacy Authentication (Fallback)

```yaml
# Service Principal JSON
AZURE_CREDENTIALS      # JSON from: az ad sp create-for-rbac --sdk-auth

# ACR Direct Access
ACR_USERNAME          # Azure Container Registry username
ACR_PASSWORD          # Azure Container Registry password
```

### Environment Secrets

```yaml
# Development Environment
DATABASE_URL_DEV           # PostgreSQL connection string for dev
REDIS_URL_DEV              # Redis connection string for dev
STRIPE_SECRET_KEY_DEV      # Stripe API key for dev

# Staging Environment
DATABASE_URL_STAGING       # PostgreSQL connection string for staging
REDIS_URL_STAGING          # Redis connection string for staging
STRIPE_SECRET_KEY_STAGING  # Stripe API key for staging

# Production Environment
DATABASE_URL_PROD          # PostgreSQL connection string for production
REDIS_URL_PROD             # Redis connection string for production
STRIPE_SECRET_KEY_PROD     # Stripe API key for production

# Shared Secrets
JWT_SECRET                 # JWT signing secret
OPENAI_API_KEY            # OpenAI API key for AI services
SENDGRID_API_KEY          # SendGrid for email notifications
```

### Notifications

```yaml
SLACK_WEBHOOK_URL     # Slack incoming webhook URL
```

## GitHub Environments

Create these environments in **Settings > Environments**:

### dev
- **URL**: https://dev.applyforus.com
- **Protection rules**: None
- **Secrets**: DATABASE_URL_DEV, REDIS_URL_DEV, STRIPE_SECRET_KEY_DEV

### staging
- **URL**: https://staging.applyforus.com
- **Protection rules**: None (auto-deploys from main)
- **Secrets**: DATABASE_URL_STAGING, REDIS_URL_STAGING, STRIPE_SECRET_KEY_STAGING

### production
- **URL**: https://applyforus.com
- **Protection rules**:
  - Required reviewers: DevOps team
  - Wait timer: 5 minutes
  - Deployment branches: main only
- **Secrets**: DATABASE_URL_PROD, REDIS_URL_PROD, STRIPE_SECRET_KEY_PROD

## Azure Resources

### Container Registry

| Resource | Value |
|----------|-------|
| Name | applyforusacr |
| Login Server | applyforusacr.azurecr.io |
| Image Prefix | applyai |

### Kubernetes Clusters

| Environment | Resource Group | Cluster Name | Namespace |
|-------------|----------------|--------------|-----------|
| Dev | applyforus-prod-rg | applyforus-aks | applyforus-dev |
| Staging | applyforus-staging-rg | applyforus-staging-aks | applyforus-staging |
| Production | applyforus-prod-rg | applyforus-prod-aks | applyforus |

### Key Vault

| Resource | Value |
|----------|-------|
| Name | applyforus-kv |
| Purpose | Secrets management for AKS |

## Services Built and Deployed

The pipeline builds and deploys these 11 services:

| Service | Type | Dockerfile Location |
|---------|------|---------------------|
| web | Frontend | apps/web/Dockerfile |
| auth-service | Backend | services/auth-service/Dockerfile |
| user-service | Backend | services/user-service/Dockerfile |
| job-service | Backend | services/job-service/Dockerfile |
| resume-service | Backend | services/resume-service/Dockerfile |
| notification-service | Backend | services/notification-service/Dockerfile |
| auto-apply-service | Backend | services/auto-apply-service/Dockerfile |
| analytics-service | Backend | services/analytics-service/Dockerfile |
| ai-service | Backend | services/ai-service/Dockerfile |
| orchestrator-service | Backend | services/orchestrator-service/Dockerfile |
| payment-service | Backend | services/payment-service/Dockerfile |

## Other Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| CI Pipeline | `ci.yml` | Legacy CI (tests only) |
| Build and Scan | `build-and-scan.yml` | Build with security scanning |
| CD - Dev | `cd-dev.yml` | Deploy to dev (triggered by build-and-scan) |
| CD - Staging | `cd-staging.yml` | Deploy to staging |
| CD - Prod | `cd-prod.yml` | Deploy to production |
| Container Security | `container-security-scan.yml` | Daily security scans |
| Integration Tests | `integration-tests.yml` | E2E integration testing |
| Smoke Tests | `smoke-tests.yml` | Post-deployment verification |
| Rollback | `rollback.yml` | Emergency rollback |
| E2E Tests | `e2e-tests.yml` | Playwright E2E tests |

## Usage Examples

### Deploy to Development (Auto)

```bash
# Push to develop branch
git checkout develop
git push origin develop
# Pipeline auto-deploys to dev
```

### Deploy to Staging (Auto)

```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main
# Pipeline auto-deploys to staging
```

### Deploy to Production (Manual)

```bash
# Option 1: Manual workflow dispatch
gh workflow run ci-cd.yml \
  -f deploy_environment=production

# Option 2: Approve pending deployment in GitHub UI
# Go to Actions > CI/CD Pipeline > [Run] > Review deployments
```

### Emergency Deployment (Skip Tests)

```bash
gh workflow run ci-cd.yml \
  -f deploy_environment=staging \
  -f skip_tests=true
```

### Emergency Rollback

```bash
gh workflow run rollback.yml \
  -f environment=production \
  -f service=all \
  -f reason="Critical bug in auth service"
```

## Deployment Features

### Digest-Based Deployments

All images are deployed using immutable SHA digests, ensuring:
- Exact same image across environments
- No tag-based vulnerabilities
- Full traceability

### Deployment Manifest

Each build creates a `deployment-manifest.json` artifact containing:
- Version information
- Image digests for all services
- Git reference and SHA
- Build timestamp

### Blue-Green Deployment (Production)

For the web frontend in production:
1. Deploy to inactive slot (blue or green)
2. Verify health checks
3. Switch traffic
4. Keep old version for quick rollback

### Rolling Updates (All Environments)

For backend services:
- maxSurge: 25%
- maxUnavailable: 0 (zero-downtime)
- Automatic rollback on failure

### Automatic Rollback

Deployments automatically rollback if:
- Rollout times out
- Health checks fail
- Smoke tests fail

## Monitoring and Troubleshooting

### View Pipeline Status

```bash
# List recent runs
gh run list --workflow=ci-cd.yml

# View specific run
gh run view <run-id>

# Watch live
gh run watch
```

### Check Deployment Status

```bash
# Get AKS credentials
az aks get-credentials -g applyforus-prod-rg -n applyforus-aks

# Check deployments
kubectl get deployments -n applyforus-dev
kubectl get pods -n applyforus-dev

# View logs
kubectl logs deployment/auth-service -n applyforus-dev
```

### Common Issues

**Pipeline not triggering**:
- Check branch name matches trigger pattern
- Verify path filters don't exclude your changes
- Ensure workflow file is valid YAML

**ACR authentication failing**:
- Verify AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID secrets
- Check Azure AD app has AcrPush role on ACR
- Ensure federated credentials are configured for GitHub

**Deployment failing**:
- Check AKS cluster is accessible
- Verify namespace exists
- Review pod events: `kubectl describe pod <name> -n <namespace>`
- Check resource quotas

**Image not found**:
- Verify image was built successfully
- Check ACR for the image tag
- Ensure AKS has permission to pull from ACR

## Migration from Azure DevOps

The Azure DevOps pipeline at `.azuredevops/pipelines/main.yml` is deprecated. Key differences:

| Feature | Azure DevOps | GitHub Actions |
|---------|--------------|----------------|
| Agent | Self-hosted pool | GitHub-hosted runners |
| Auth | Service connections | OIDC federation |
| Caching | Pipeline Cache | GitHub Actions Cache |
| Artifacts | Pipeline Artifacts | Actions Artifacts |
| Environments | Environment approvals | Environment protection |
| Templates | YAML templates | Composite actions (future) |

### Migrated Features

- [x] Lint and type checking
- [x] Unit tests with service containers
- [x] Security scanning
- [x] Docker image building
- [x] ACR push with digests
- [x] AKS deployment (dev/staging/prod)
- [x] Health checks and smoke tests
- [x] Automatic rollback
- [x] Slack notifications
- [x] Deployment manifest generation

## Best Practices

1. **Always merge to develop first** - Dev environment validates changes
2. **Review security scan results** - Check GitHub Security tab
3. **Monitor deployments** - Watch for pod restarts after deployment
4. **Use semantic versioning** - For production releases
5. **Keep secrets in Key Vault** - Not in GitHub secrets for production
6. **Test rollback procedures** - Before needing them in emergencies

## Support

- **Documentation**: [Deployment Guide](../../docs/deployment/DEPLOYMENT_GUIDE.md)
- **Issues**: GitHub Issues
- **Slack**: #devops channel
