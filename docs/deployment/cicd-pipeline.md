# CI/CD Pipeline Documentation

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Workflows](#workflows)
4. [Configuration](#configuration)
5. [Deployment Strategies](#deployment-strategies)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Troubleshooting](#troubleshooting)

## Overview

The Job-Apply-Platform uses a comprehensive CI/CD pipeline built with GitHub Actions to automate testing, building, security scanning, and deployment of all microservices and applications.

### Key Features

- **Automated Testing**: Unit tests, integration tests, E2E tests with 80% code coverage requirement
- **Security Scanning**: CodeQL, Trivy, Snyk, and container security scanning
- **Multi-Environment Deployments**: Development, Staging, and Production environments
- **Blue/Green Deployments**: Zero-downtime deployments for production
- **Automated Rollback**: Automatic rollback on deployment failures
- **Smoke Tests**: Comprehensive post-deployment verification
- **Manual Approval Gates**: Required approval for production deployments

## Pipeline Architecture

### Workflow Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                       Pull Request                           │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              CI Pipeline (ci.yml)                     │  │
│  │  • Lint & Type Check                                  │  │
│  │  • Unit Tests (80% coverage)                          │  │
│  │  • Integration Tests                                  │  │
│  │  • Security Scanning                                  │  │
│  │  • E2E Tests                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│                    Merge to develop                          │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    Deploy to Dev/Staging                     │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Deploy Pipeline (deploy.yml)                  │  │
│  │  • Build Docker Images                                │  │
│  │  • Push to ACR                                        │  │
│  │  • Deploy to AKS (Staging)                            │  │
│  │  • Smoke Tests                                        │  │
│  │  • Rollback on Failure                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│                  Tag Release (v*.*.*)                        │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                  Deploy to Production                        │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │    Production Deployment (deploy.yml)                 │  │
│  │  • Manual Approval Required                           │  │
│  │  • Blue/Green Deployment (Web)                        │  │
│  │  • Rolling Update (Services)                          │  │
│  │  • Comprehensive Smoke Tests                          │  │
│  │  • Automated Rollback on Failure                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Trigger**: Push/Pull Request to `main` or `develop`

#### Jobs

##### Lint and Type Check
- Runs ESLint on all TypeScript/JavaScript code
- Runs Prettier format check
- Performs TypeScript type checking
- Uploads lint results as artifacts

##### Unit Tests
- **Web App**: Jest tests with coverage reporting
- **Services**: NestJS/Jest tests with coverage
- **AI Service**: Pytest with coverage
- **Coverage Threshold**: 80% required for all services
- Coverage reports uploaded to Codecov

##### Integration Tests
- Tests service-to-service communication
- Database integration tests
- Redis cache integration tests
- Message queue integration tests

##### E2E Tests
- Playwright browser tests
- Tests critical user flows
- Runs on built application
- Upload test reports and screenshots

##### Security Scanning
- **CodeQL**: JavaScript, TypeScript, Python analysis
- **npm audit**: Dependency vulnerability scanning
- **Snyk**: Third-party security analysis
- Results uploaded to GitHub Security tab

##### Build Verification
- Builds web application
- Verifies Docker images can be built
- Uploads build artifacts

### 2. Deployment Pipeline (`deploy.yml`)

**Trigger**:
- Push to `main` branch
- Git tags matching `v*.*.*`
- Manual workflow dispatch

#### Jobs

##### Build and Push
- Builds Docker images for all services
- Tags with git SHA and semantic version
- Pushes to Azure Container Registry
- Generates SBOM (Software Bill of Materials)

##### Deploy to Staging
- **Trigger**: Push to `main` or manual dispatch
- **Environment**: staging
- **Strategy**: Rolling update
- **Steps**:
  1. Create backup of current deployment
  2. Deploy new images progressively
  3. Wait for rollout completion
  4. Run comprehensive smoke tests
  5. Automatic rollback on failure
  6. Slack notifications

##### Deploy to Production
- **Trigger**: Git tags `v*.*.*` or manual dispatch with approval
- **Environment**: production
- **Strategy**: Blue/Green for web, Rolling for services
- **Approval Gate**: Manual approval required
- **Steps**:
  1. Create production backup (90-day retention)
  2. Deploy backend services with rolling update
  3. Blue/Green deployment for web application
  4. Run comprehensive smoke tests
  5. Monitor deployment metrics
  6. Automatic rollback on failure
  7. Create deployment record
  8. Slack notifications

### 3. Container Security Scanning (`container-security-scan.yml`)

**Trigger**:
- Push/PR with Docker changes
- Daily scheduled scan at 2 AM UTC
- Manual workflow dispatch

#### Scans
- **Trivy**: OS and library vulnerability scanning
- **Snyk**: Container security analysis
- **Hadolint**: Dockerfile best practices
- **Checkov**: Kubernetes manifest security
- Results uploaded to GitHub Security tab

### 4. Build and Scan Workflow (`build-and-scan.yml`)

**Type**: Reusable workflow

**Usage**: Called by other workflows to build and scan container images

**Features**:
- Service path auto-detection (apps/ or services/)
- Multi-stage scanning before push
- SBOM generation
- Image signing with Cosign
- Build cache optimization

### 5. Integration Tests (`integration-tests.yml`)

**Trigger**:
- Push/PR to `main` or `develop`
- Daily scheduled run at 3 AM UTC
- Manual workflow dispatch

#### Test Suites
1. **Auth Service Integration**
   - User registration and login flows
   - OAuth integration
   - Session management
   - MFA flows

2. **Job Application Flow**
   - Job search and filtering
   - Application submission
   - Auto-apply functionality
   - Application tracking

3. **AI Services Integration**
   - Resume parsing
   - Cover letter generation
   - Job matching
   - Interview preparation

4. **Notification Flow**
   - Email notifications
   - Push notifications
   - Notification preferences
   - Template rendering

5. **End-to-End Integration**
   - Complete user journeys
   - Cross-service workflows
   - Data consistency tests

### 6. Smoke Tests (`smoke-tests.yml`)

**Type**: Reusable workflow

**Called After**: Each deployment

#### Test Categories

##### Health Checks
- All service health endpoints
- API gateway health
- Database connectivity
- Redis connectivity

##### API Smoke Tests
- API documentation accessibility
- Public endpoints functionality
- CORS configuration
- Response format validation

##### Web Smoke Tests
- Homepage loading
- Authentication pages
- Critical user pages
- Static asset loading
- Response time verification

##### Performance Tests
- API response times
- Concurrent request handling
- Rate limiting verification

##### Security Tests
- Security headers verification
- HTTPS redirect
- SQL injection protection
- XSS protection

### 7. Rollback Workflow (`rollback.yml`)

**Trigger**: Manual workflow dispatch only

**Inputs**:
- `environment`: staging or production
- `target-sha`: Git SHA to rollback to (optional)
- `service`: Specific service or all services
- `reason`: Required justification for rollback

#### Process

1. **Validation**
   - Validate rollback request
   - Verify target SHA exists
   - Post initiation to Slack

2. **Backup**
   - Create backup of current state
   - Upload to artifacts (90-365 day retention)
   - Document rollback in annotations

3. **Rollback Execution**
   - Progressive service rollback
   - Blue/Green handling for web
   - Rollout status verification

4. **Verification**
   - Comprehensive health checks
   - Pod status monitoring
   - Smoke tests execution

5. **Notification**
   - Success/failure notifications
   - Incident record creation
   - Post-rollback tests

## Configuration

### Required Secrets

#### GitHub Secrets

```yaml
# Azure Credentials
AZURE_CREDENTIALS          # Azure service principal credentials
ACR_USERNAME              # Azure Container Registry username
ACR_PASSWORD              # Azure Container Registry password

# Third-party Services
SNYK_TOKEN                # Snyk security scanning token
SLACK_WEBHOOK_URL         # Slack notifications webhook
CODECOV_TOKEN             # Codecov upload token (optional)

# Test Credentials
OPENAI_API_KEY_TEST       # OpenAI API key for testing (optional)
TEST_USER_EMAIL           # Test user for E2E tests (optional)
TEST_USER_PASSWORD        # Test user password (optional)
```

#### GitHub Environments

1. **preview**
   - No approval required
   - Used for PR previews
   - Auto-deploys on PR

2. **staging**
   - No approval required
   - Auto-deploys from `main` branch
   - URL: https://staging.jobpilot.ai

3. **production**
   - **Manual approval required**
   - Deploys from tags only
   - URL: https://jobpilot.ai

4. **production-rollback**
   - **Manual approval required**
   - Used for production rollbacks
   - Requires justification

### Environment Variables

```yaml
# CI Pipeline
NODE_VERSION: '20'
PYTHON_VERSION: '3.11'
COVERAGE_THRESHOLD: 80

# CD Pipeline
REGISTRY: jobpilotacr.azurecr.io
```

## Deployment Strategies

### Staging Environment

**Strategy**: Rolling Update

**Process**:
1. Deploy all services simultaneously
2. Progressive health checks
3. Automatic rollback on any failure
4. No downtime acceptable (non-production)

**Rollout Time**: ~10-15 minutes

### Production Environment

#### Backend Services

**Strategy**: Rolling Update

**Process**:
1. Deploy services sequentially
2. Wait for each service to be healthy
3. 10-second pause between services
4. Automatic rollback on failure

**Rollout Time**: ~15-20 minutes

#### Web Application

**Strategy**: Blue/Green Deployment

**Process**:
1. Identify current active deployment (blue/green)
2. Deploy to inactive deployment
3. Wait for new deployment to be healthy
4. Run smoke tests on new deployment
5. Switch traffic to new deployment
6. Keep old deployment for instant rollback

**Rollout Time**: ~5-10 minutes

**Benefits**:
- Zero downtime
- Instant rollback capability
- Safe traffic switching
- Full verification before cutover

## Rollback Procedures

### Automatic Rollback

Automatic rollback is triggered when:
- Deployment fails to complete within timeout (10 minutes)
- Health checks fail after deployment
- Smoke tests fail post-deployment
- Pod fails to start or crashes

**Process**:
1. Detect failure condition
2. Restore previous deployment from backup
3. Verify rollback success
4. Send critical alerts
5. Create incident record

### Manual Rollback

**When to Use**:
- Application bugs discovered in production
- Performance degradation
- Data inconsistencies
- Security issues

**How to Execute**:

1. **Navigate to Actions**:
   ```
   GitHub → Actions → Rollback Deployment
   ```

2. **Fill Required Information**:
   - Environment: staging or production
   - Service: specific service or all
   - Target SHA: leave empty for previous deployment
   - Reason: detailed justification

3. **Approve** (production only)

4. **Monitor**: Watch workflow execution

**Rollback Time**:
- Staging: ~5-10 minutes
- Production: ~10-15 minutes

### Rollback Validation

After rollback:
1. Automated smoke tests run
2. Health checks verified
3. Pod status monitored
4. Incident record created
5. Team notified via Slack

## Monitoring and Alerts

### Slack Notifications

Notifications are sent for:
- Deployment start (staging/production)
- Deployment success
- Deployment failure
- Rollback initiation
- Rollback completion
- Integration test results
- Smoke test results

**Channel**: `#deployments` (configure in Slack)

### GitHub Notifications

- Workflow run status
- Security alerts
- Dependency updates
- Failed test notifications

### Azure Monitor

Integration with Azure Monitor for:
- Container metrics
- Pod health
- Resource utilization
- Application insights

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom**: Docker build fails

**Solutions**:
- Check Dockerfile syntax
- Verify base image availability
- Check build context paths
- Review build logs in workflow

#### 2. Test Failures

**Symptom**: Unit or integration tests fail

**Solutions**:
- Check test logs in workflow artifacts
- Verify database migrations
- Check environment variables
- Review coverage reports

#### 3. Deployment Timeout

**Symptom**: Deployment exceeds 10-minute timeout

**Solutions**:
- Check pod events: `kubectl describe pod <pod-name> -n jobpilot`
- Review container logs: `kubectl logs <pod-name> -n jobpilot`
- Verify resource limits
- Check image pull status

#### 4. Failed Health Checks

**Symptom**: Health endpoint returns non-200 status

**Solutions**:
- Check application logs
- Verify database connectivity
- Check Redis connectivity
- Review environment variables
- Verify secrets are mounted

#### 5. Rollback Fails

**Symptom**: Automatic rollback doesn't restore service

**Solutions**:
- Download rollback backup from artifacts
- Manually apply backup: `kubectl apply -f backup.yaml`
- Contact DevOps team
- Check Kubernetes events

### Debug Commands

```bash
# Check deployment status
kubectl get deployments -n jobpilot

# Check pod status
kubectl get pods -n jobpilot

# View pod logs
kubectl logs -f <pod-name> -n jobpilot

# Describe pod for events
kubectl describe pod <pod-name> -n jobpilot

# Check rollout status
kubectl rollout status deployment/<service> -n jobpilot

# View rollout history
kubectl rollout history deployment/<service> -n jobpilot

# Manual rollback to previous revision
kubectl rollout undo deployment/<service> -n jobpilot
```

### Getting Help

1. **Check Workflow Logs**: Review detailed logs in GitHub Actions
2. **Review Artifacts**: Download and inspect test reports, coverage, logs
3. **Check Slack**: Review deployment notifications
4. **Azure Portal**: Check AKS cluster health
5. **Contact DevOps Team**: For critical production issues

## Best Practices

### Development

1. **Write Tests First**: Ensure 80%+ coverage before PR
2. **Run Locally**: Test locally before pushing
3. **Small PRs**: Keep changes focused and reviewable
4. **Meaningful Commits**: Use conventional commit messages

### Deployment

1. **Deploy to Staging First**: Always test in staging
2. **Monitor After Deploy**: Watch metrics for 15+ minutes
3. **Deploy During Low Traffic**: Schedule production deploys
4. **Have Rollback Plan**: Know how to rollback quickly

### Security

1. **Keep Dependencies Updated**: Regular security patches
2. **Review Security Scans**: Address critical/high vulnerabilities
3. **Rotate Secrets**: Regular secret rotation
4. **Principle of Least Privilege**: Minimal permissions

### Monitoring

1. **Set Up Alerts**: Configure Slack/email alerts
2. **Regular Reviews**: Weekly pipeline performance reviews
3. **Track Metrics**: Monitor deployment frequency, lead time, MTTR
4. **Incident Retrospectives**: Learn from failures

## Pipeline Metrics

Track these key metrics:

- **Deployment Frequency**: How often we deploy to production
- **Lead Time**: Time from commit to production
- **Change Failure Rate**: % of deployments causing failures
- **Mean Time to Recovery (MTTR)**: Time to recover from failures
- **Test Coverage**: Maintain 80%+ across all services
- **Build Time**: Keep under 15 minutes
- **Deployment Time**: Keep under 20 minutes

## Changelog

### Version 2.0 (Current)
- Added integration tests workflow
- Enhanced smoke tests with performance and security checks
- Implemented rollback workflow
- Added 80% coverage threshold enforcement
- Enhanced security scanning with multiple tools
- Improved deployment strategies (Blue/Green for production)
- Added comprehensive monitoring and notifications

### Version 1.0
- Initial CI/CD pipeline setup
- Basic testing and deployment workflows
- Container security scanning
