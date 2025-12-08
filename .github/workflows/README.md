# GitHub Actions Workflows

This directory contains all GitHub Actions workflows for the Job-Apply-Platform CI/CD pipeline.

## Workflows Overview

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI Pipeline | `ci.yml` | Push/PR to main/develop | Linting, testing, building |
| Deployment | `deploy.yml` | Push to main, tags | Deploy to staging/production |
| Container Security | `container-security-scan.yml` | Push, PR, daily schedule | Security scanning |
| Build & Scan | `build-and-scan.yml` | Called by other workflows | Reusable build workflow |
| Integration Tests | `integration-tests.yml` | Push/PR, daily schedule | End-to-end integration testing |
| Smoke Tests | `smoke-tests.yml` | Called after deployment | Post-deployment verification |
| Rollback | `rollback.yml` | Manual trigger only | Emergency rollback |

## Workflow Details

### ci.yml - Continuous Integration

**Purpose**: Automated testing and validation on every code change

**When it runs**:
- Every push to `main` or `develop`
- Every pull request to `main` or `develop`
- Manual trigger via workflow_dispatch

**What it does**:
1. **Lint & Type Check** (~3 mins)
   - ESLint for code quality
   - Prettier for formatting
   - TypeScript type checking

2. **Unit Tests** (~10 mins)
   - Runs tests for web app and all services
   - Enforces 80% code coverage threshold
   - Uploads coverage to Codecov

3. **Build Verification** (~5 mins)
   - Builds web application
   - Verifies Docker images build successfully

4. **E2E Tests** (~15 mins)
   - Playwright browser tests
   - Tests critical user journeys

5. **Security Scanning** (~10 mins)
   - CodeQL analysis
   - npm audit
   - Snyk vulnerability scanning

**Total Runtime**: ~45 minutes

**Required Secrets**:
- `CODECOV_TOKEN` (optional)
- `SNYK_TOKEN` (optional)

### deploy.yml - Deployment Pipeline

**Purpose**: Build and deploy services to staging and production

**When it runs**:
- Push to `main` → Deploy to staging
- Git tag `v*.*.*` → Deploy to production
- Manual trigger with environment selection

**What it does**:

#### Build & Push Stage (~20 mins)
- Builds Docker images for all 8 services
- Tags with git SHA and version
- Pushes to Azure Container Registry
- Runs in parallel for faster builds

#### Staging Deployment (~15 mins)
- Creates backup of current deployment
- Deploys all services with rolling update
- Runs comprehensive smoke tests
- **Automatic rollback** on failure
- Posts status to Slack

#### Production Deployment (~20 mins)
- **Requires manual approval** in GitHub environment
- Creates backup (90-day retention)
- Blue/Green deployment for web app
- Rolling update for backend services
- Comprehensive smoke tests
- Monitors metrics post-deployment
- **Automatic rollback** on failure
- Creates deployment record
- Posts status to Slack

**Required Secrets**:
- `AZURE_CREDENTIALS`
- `ACR_USERNAME`
- `ACR_PASSWORD`
- `SLACK_WEBHOOK_URL`

**Required Environments**:
- `staging` (no approval)
- `production` (approval required)

### container-security-scan.yml

**Purpose**: Regular security scanning of containers and Kubernetes manifests

**When it runs**:
- Push/PR with changes to Docker files or K8s manifests
- Daily at 2:00 AM UTC
- Manual trigger

**What it scans**:
1. **Container Images**
   - Trivy: OS and library vulnerabilities
   - Snyk: Container security issues

2. **Kubernetes Manifests**
   - Trivy: Configuration issues
   - Checkov: Best practices and security

3. **Dockerfiles**
   - Hadolint: Dockerfile best practices

**Results**: Uploaded to GitHub Security tab

### build-and-scan.yml

**Purpose**: Reusable workflow for building and scanning individual services

**Type**: Reusable workflow (called by other workflows)

**Inputs**:
- `service-name`: Name of service to build
- `version`: Version to tag the image

**What it does**:
1. Auto-detects service path (apps/ or services/)
2. Builds Docker image without pushing
3. Scans with Trivy for vulnerabilities
4. Fails on HIGH/CRITICAL vulnerabilities
5. Scans with Snyk (optional)
6. Builds and pushes to ACR
7. Generates SBOM
8. Signs image with Cosign

### integration-tests.yml

**Purpose**: Test integration between services

**When it runs**:
- Push/PR to `main` or `develop`
- Daily at 3:00 AM UTC
- Manual trigger

**Test Suites**:
1. Auth Service Integration
2. Job Application Flow
3. AI Services Integration
4. Notification Flow
5. End-to-End Integration

**Runtime**: ~45 minutes

**Infrastructure**: Spins up PostgreSQL and Redis for testing

### smoke-tests.yml

**Purpose**: Quick verification that deployed services are working

**Type**: Reusable workflow (called after deployments)

**Inputs**:
- `environment`: staging or production
- `base-url`: Web application URL
- `api-url`: API gateway URL

**Test Categories**:
1. **Health Checks** (~2 mins)
   - All service health endpoints

2. **API Tests** (~3 mins)
   - Public endpoints
   - API documentation
   - CORS headers

3. **Web Tests** (~3 mins)
   - Homepage, login, registration
   - Static assets
   - Response times

4. **Performance Tests** (~5 mins)
   - Response times
   - Concurrent requests
   - Rate limiting

5. **Security Tests** (~3 mins)
   - Security headers
   - HTTPS redirect
   - SQL injection protection

**Total Runtime**: ~15 minutes

### rollback.yml

**Purpose**: Emergency rollback of failed deployments

**When it runs**: Manual trigger ONLY

**Inputs**:
- `environment`: staging or production (required)
- `target-sha`: Git SHA to rollback to (optional, defaults to previous)
- `service`: Specific service or all (required)
- `reason`: Justification for rollback (required)

**What it does**:
1. Validates rollback request
2. Creates backup of current state
3. Performs rollback to target version
4. Verifies rollback success
5. Runs smoke tests
6. Creates incident record
7. Posts to Slack

**Approval**: Production rollbacks require manual approval

**Runtime**: ~10-15 minutes

## Setup Instructions

### 1. Required Secrets

Add these secrets in GitHub Settings → Secrets and variables → Actions:

```yaml
# Azure
AZURE_CREDENTIALS      # JSON from: az ad sp create-for-rbac
ACR_USERNAME          # Azure Container Registry username
ACR_PASSWORD          # Azure Container Registry password

# Third-party
SLACK_WEBHOOK_URL     # Slack incoming webhook URL
SNYK_TOKEN           # Snyk API token (optional)
CODECOV_TOKEN        # Codecov upload token (optional)

# Testing (optional)
OPENAI_API_KEY_TEST  # Test API key for AI service
TEST_USER_EMAIL      # Test user credentials
TEST_USER_PASSWORD   # Test user credentials
```

### 2. GitHub Environments

Create environments in GitHub Settings → Environments:

#### preview
- No protection rules
- Used for PR preview deployments

#### staging
- No protection rules
- Automatically deploys from `main` branch
- Environment URL: https://staging.jobpilot.ai

#### production
- **Protection rules**:
  - Required reviewers: DevOps team
  - Wait timer: 5 minutes
  - Deployment branches: main only
- Environment URL: https://jobpilot.ai

#### production-rollback
- **Protection rules**:
  - Required reviewers: DevOps lead
  - Used only for rollbacks

### 3. Azure Resources

Ensure these Azure resources exist:

**Staging**:
- Resource Group: `jobpilot-staging-rg`
- AKS Cluster: `jobpilot-staging-aks`
- Namespace: `jobpilot`

**Production**:
- Resource Group: `jobpilot-prod-rg`
- AKS Cluster: `jobpilot-prod-aks`
- Namespace: `jobpilot`

**Shared**:
- Container Registry: `jobpilotacr.azurecr.io`

### 4. Kubernetes Prerequisites

Each environment needs:

```bash
# Image pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=jobpilotacr.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  -n jobpilot

# Blue/Green deployments for web (production only)
kubectl create -f k8s/web-blue-deployment.yaml
kubectl create -f k8s/web-green-deployment.yaml
kubectl create -f k8s/web-service.yaml
```

### 5. Slack Integration

1. Create incoming webhook in Slack
2. Add webhook URL to GitHub secrets as `SLACK_WEBHOOK_URL`
3. Invite workflow bot to `#deployments` channel

## Usage Examples

### Deploy to Staging

```bash
# Merge to main branch
git checkout main
git merge develop
git push origin main

# Workflow triggers automatically
```

### Deploy to Production

```bash
# Create and push tag
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# Go to GitHub Actions
# Approve deployment in production environment
```

### Run Integration Tests Manually

```bash
# Using GitHub CLI
gh workflow run integration-tests.yml

# Or via web UI:
# Actions → Integration Tests → Run workflow
```

### Emergency Rollback

```bash
# Go to GitHub Actions
# Workflows → Rollback Deployment → Run workflow

# Fill in:
# - Environment: production
# - Service: all
# - Target SHA: (leave empty for previous)
# - Reason: "Critical bug in authentication"

# Approve in production-rollback environment
```

### Run Smoke Tests Manually

```bash
gh workflow run smoke-tests.yml \
  -f environment=staging \
  -f base-url=https://staging.jobpilot.ai \
  -f api-url=https://staging-api.jobpilot.ai
```

## Monitoring Workflows

### GitHub Actions UI

- **All Workflows**: https://github.com/yourorg/Job-Apply-Platform/actions
- **Specific Workflow**: Actions → Select workflow from left sidebar
- **Workflow Run**: Click on any run to see details

### Slack Notifications

Notifications are posted to `#deployments` for:
- Deployment start/success/failure
- Rollback events
- Integration test results
- Security scan alerts

### Email Notifications

Configure in GitHub Settings → Notifications:
- Workflow failures
- Deployment approvals needed
- Security alerts

## Troubleshooting

### Workflow Not Triggering

**Check**:
1. Branch names match trigger patterns
2. File paths match (if using path filters)
3. Workflow file is valid YAML
4. No workflow_run dependencies blocking

### Workflow Failing

**Steps**:
1. Click on failed run
2. Expand failed job
3. Review logs
4. Download artifacts if available
5. Check [Troubleshooting Guide](../../docs/deployment/cicd-pipeline.md#troubleshooting)

### Secrets Not Working

**Verify**:
1. Secret exists in GitHub settings
2. Secret name matches exactly (case-sensitive)
3. Environment is correct (if using environment secrets)
4. Permissions are correct

### Deployment Stuck

**Actions**:
1. Check AKS cluster status
2. Review pod events: `kubectl describe pod <name> -n jobpilot`
3. Check resource availability
4. Consider canceling and re-running

## Best Practices

1. **Always test in staging first** before production
2. **Review security scan results** before approving production
3. **Monitor deployments** for at least 15 minutes after
4. **Use meaningful commit messages** for better tracking
5. **Tag releases semantically** (v1.2.3)
6. **Document breaking changes** in release notes
7. **Keep workflows DRY** using reusable workflows
8. **Set timeouts** on all jobs to prevent hanging
9. **Use concurrency** to prevent duplicate runs
10. **Cache dependencies** to speed up workflows

## Workflow Optimization

### Current Performance

| Workflow | Average Runtime |
|----------|----------------|
| CI Pipeline | ~45 minutes |
| Staging Deploy | ~35 minutes |
| Production Deploy | ~40 minutes |
| Integration Tests | ~45 minutes |
| Smoke Tests | ~15 minutes |

### Optimization Tips

1. **Parallel Jobs**: Use job dependencies wisely
2. **Build Caching**: Leverage GitHub Actions cache
3. **Matrix Strategy**: Run tests in parallel
4. **Artifact Sharing**: Share between jobs instead of rebuilding
5. **Conditional Steps**: Skip unnecessary steps

## Contributing

When adding new workflows:

1. Follow naming convention: `kebab-case.yml`
2. Add documentation to this README
3. Include comments in workflow file
4. Test thoroughly in a feature branch
5. Add to monitoring and alerting

## Support

- **Documentation**: [CI/CD Pipeline Docs](../../docs/deployment/cicd-pipeline.md)
- **Deployment Guide**: [Quick Reference](../../docs/deployment/DEPLOYMENT_GUIDE.md)
- **Issues**: GitHub Issues
- **Slack**: #devops channel
