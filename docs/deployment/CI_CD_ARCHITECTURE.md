# CI/CD Architecture - ApplyForUs Platform

## Overview

This document describes the comprehensive CI/CD pipeline architecture for the ApplyForUs job application platform. The pipeline implements industry best practices for continuous integration, deployment, security, and reliability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Developer Workflow                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GitHub Pull Request                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Terraform CI (Format, Validate, Plan, Security)       │  │
│  │  - Unit Tests (All Services)                             │  │
│  │  - Integration Tests (API Contracts)                     │  │
│  │  - Linting & Type Checking                               │  │
│  │  - Security Scans (CodeQL, Snyk, npm audit)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Merge to develop branch                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CD-Dev Workflow (Automated)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PRE-DEPLOYMENT GATES                                    │  │
│  │  1. Unit Tests (MUST PASS)                               │  │
│  │  2. Integration Tests (MUST PASS)                        │  │
│  │  3. Terraform Validation (MUST PASS)                     │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  BUILD & SCAN                                            │  │
│  │  1. Build Docker Images (parallel, max 3)               │  │
│  │  2. Push to ACR                                          │  │
│  │  3. Trivy Security Scan (CRITICAL vulnerabilities fail)  │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  DEPLOYMENT                                              │  │
│  │  1. Create Rollback Point                               │  │
│  │  2. Deploy to AKS Development                           │  │
│  │  3. Wait for Rollouts (10min timeout)                   │  │
│  │  4. Auto-Rollback on Failure                            │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  POST-DEPLOYMENT VERIFICATION                            │  │
│  │  1. Health Checks (all pods)                            │  │
│  │  2. Smoke Tests (critical endpoints)                    │  │
│  │  3. Performance Checks                                   │  │
│  │  4. Security Headers Validation                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Merge to staging/main                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Production Deployment (Manual Approval)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  - Same gates as Dev                                     │  │
│  │  - Blue/Green Deployment                                 │  │
│  │  - Canary Release (10% → 50% → 100%)                    │  │
│  │  - Extended Health Checks                               │  │
│  │  - Auto-Rollback on Failure                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Workflow Files

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Purpose:** Runs on every push and pull request to validate code quality.

**Jobs:**
- `lint-and-typecheck`: ESLint, Prettier, TypeScript validation
- `test-web`: Web app unit tests with coverage
- `test-services`: Backend service tests (matrix strategy)
- `build-web`: Production build verification
- `e2e-tests`: Playwright end-to-end tests
- `security-scan`: CodeQL, npm audit, Snyk
- `deploy-preview`: Preview deployments for PRs

**Gates:**
- Coverage threshold: 80%
- All tests must pass
- No critical security vulnerabilities
- Code formatting must pass

### 2. Terraform CI (`.github/workflows/terraform-ci.yml`) ⭐ NEW

**Purpose:** Validates infrastructure code on every terraform change.

**Jobs:**
- `terraform-format`: Ensures consistent formatting
- `terraform-validate`: Validates syntax and configuration
- `terraform-plan`: Generates execution plan for review
- `tfsec-scan`: Security scanning with TFSec
- `checkov-scan`: Policy-as-code validation
- `terraform-docs`: Auto-generates documentation
- `terraform-cost-estimate`: Estimates infrastructure costs (Infracost)

**Security Scans:**
```yaml
Tools:
  - TFSec: Infrastructure security scanning
  - Checkov: Policy compliance checking
  - Infracost: Cost estimation
```

**Gates:**
- Format must be correct
- Validation must pass
- No HIGH/CRITICAL security issues
- Plan must be reviewed (on PR)

### 3. CD-Dev Workflow (`.github/workflows/cd-dev.yml`) ⭐ ENHANCED

**Purpose:** Automated deployment to development environment.

**Improvements:**
1. **Timeouts:** All jobs have explicit timeouts
2. **Pre-deployment Gates:**
   - Unit tests (timeout: 20min)
   - Integration tests (timeout: 30min)
   - Terraform validation (timeout: 15min)
3. **Build Improvements:**
   - Parallel builds with max-parallel: 3
   - Docker BuildKit caching
   - Multi-tag strategy
   - Timeout: 45min per service
4. **Security Scanning:**
   - Trivy vulnerability scan (CRITICAL/HIGH)
   - SARIF upload to GitHub Security
   - Critical vulnerabilities fail build
5. **Deployment Safety:**
   - Creates rollback point before deployment
   - Automatic rollback on failure
   - Deployment timeout: 10 minutes
   - Health check timeout: 5 minutes
6. **Post-deployment:**
   - Pod readiness checks
   - Crash loop detection
   - Service health endpoint testing
   - Smoke tests

**Critical Features:**
```yaml
Concurrency:
  cancel-in-progress: false  # Prevents mid-deployment cancellations

Rollback Mechanism:
  - Automatic on deployment failure
  - Backs up all deployments before update
  - Restores from backup on failure

Error Handling:
  - Detailed diagnostics on failure
  - Pod logs captured
  - Events logged
  - Failed services identified
```

### 4. Integration Tests (`.github/workflows/integration-tests.yml`) ⭐ EXISTING

**Purpose:** Comprehensive integration testing across services.

**Jobs:**
- `integration-test-auth-flow`: Authentication flow testing
- `integration-test-job-application-flow`: Job application end-to-end
- `integration-test-ai-services`: AI service integration
- `integration-test-notification-flow`: Notification system
- `integration-test-end-to-end`: Full system integration

**Infrastructure:**
- PostgreSQL 15
- Redis 7
- Test databases per service
- Service mocking when needed

### 5. Rollback Workflow (`.github/workflows/rollback.yml`) ⭐ EXISTING

**Purpose:** Manual rollback to previous deployments.

**Features:**
- Manual trigger only
- Environment selection (staging/production)
- Service-specific or all-services rollback
- Mandatory rollback reason
- Backup creation before rollback
- Health verification after rollback
- Slack notifications
- Incident record creation

**Safety Measures:**
```yaml
- Creates backup before rollback
- Validates target SHA exists
- Waits for rollout completion
- Runs health checks post-rollback
- Monitors metrics for 2 minutes
- Creates incident annotations
```

### 6. Deployment Verification (`.github/workflows/deployment-verification.yml`) ⭐ NEW

**Purpose:** Comprehensive post-deployment verification.

**Can be called from other workflows or run standalone.**

**Jobs:**

1. **health-checks**: Tests all service health endpoints
   - Web application health
   - API health
   - Auth service health
   - User service health
   - Job service health
   - Retry logic: 5 attempts with 10s delay

2. **smoke-tests**: Critical functionality testing
   - User registration endpoint
   - Login endpoint
   - Job search endpoint
   - Static assets loading

3. **performance-checks**: Performance validation
   - Apache Bench load testing
   - 100 requests, 10 concurrent
   - Response time analysis
   - Throughput metrics

4. **security-checks**: Security validation
   - SSL/TLS configuration
   - Security headers (HSTS, X-Frame-Options, etc.)
   - HTTPS enforcement

5. **verification-summary**: Results aggregation
   - Generates summary report
   - Determines if rollback needed
   - Slack notifications
   - Fails workflow if critical issues found

## Deployment Gates Summary

### Pre-Deployment Gates

```yaml
Required to Pass:
  ✓ Unit Tests (all services)
  ✓ Integration Tests
  ✓ Terraform Validation
  ✓ Linting & Type Checking
  ✓ Docker Build Success

Optional (Warning Only):
  ! Code Coverage >= 80%
  ! No lint warnings
```

### Build Gates

```yaml
Required to Pass:
  ✓ Docker build completes
  ✓ Image pushed to ACR
  ✓ Trivy scan completes

Fail on:
  ✗ CRITICAL vulnerabilities

Warn on:
  ! HIGH vulnerabilities
```

### Deployment Gates

```yaml
Required to Pass:
  ✓ Kubernetes namespace exists
  ✓ Secrets synced
  ✓ Rollback point created
  ✓ Image pull successful
  ✓ Rollout completes (10min timeout)
  ✓ All pods ready

Auto-Rollback on:
  ✗ Rollout timeout
  ✗ Pod crash loops
  ✗ Health check failures
```

### Post-Deployment Gates

```yaml
Required to Pass:
  ✓ Pod readiness checks
  ✓ Health endpoints respond
  ✓ Smoke tests pass
  ✓ No crash loops detected

Recommended:
  ! Performance within SLA
  ! Security headers present
```

## Rollback Mechanisms

### Automatic Rollback

Triggered automatically when:
1. Deployment rollout times out (>10 minutes)
2. Pod crash loops detected (>3 restarts)
3. Health checks fail post-deployment
4. Smoke tests fail

**Process:**
```bash
1. Detect failure
2. Restore from backup YAML
3. Apply backup configuration
4. Wait for rollout
5. Verify health
6. Notify team
```

### Manual Rollback

Via `.github/workflows/rollback.yml`:

```bash
# Inputs Required:
- Environment (staging/production)
- Target SHA (or previous deployment)
- Service (all or specific)
- Reason for rollback

# Process:
1. Validate rollback request
2. Checkout target SHA
3. Create backup of current state
4. Update deployments
5. Wait for rollouts
6. Run health checks
7. Monitor metrics
8. Create incident record
9. Notify team
```

## Security Scanning

### Infrastructure Security

**TFSec:**
- Scans Terraform for misconfigurations
- Checks Azure security best practices
- Uploads results to GitHub Security tab

**Checkov:**
- Policy-as-code validation
- Compliance checking
- CIS benchmarks
- SARIF output

### Container Security

**Trivy:**
- Vulnerability scanning (OS & application packages)
- Secret detection
- License scanning
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW
- Fails build on CRITICAL vulnerabilities

### Application Security

**CodeQL:**
- Static application security testing (SAST)
- JavaScript, TypeScript, Python analysis
- Automated vulnerability detection

**Snyk:**
- Dependency vulnerability scanning
- License compliance
- Automated PRs for fixes

**npm audit:**
- npm package vulnerability checking
- Production dependencies only
- Moderate severity threshold

## Monitoring & Notifications

### Slack Notifications

**Sent for:**
- Deployment start
- Deployment success
- Deployment failure
- Rollback initiation
- Rollback completion
- Health check failures
- Security scan results

**Webhook Configuration:**
```yaml
SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### GitHub Notifications

**Automated:**
- PR comments with test results
- PR comments with Terraform plans
- Security alerts in Security tab
- Workflow run summaries
- Deployment status badges

### Metrics & Logging

**Captured:**
- Deployment duration
- Rollout time per service
- Health check results
- Performance metrics
- Error logs
- Pod restart counts

## Environment Strategy

### Development (dev)
- **Trigger:** Auto on push to `develop`
- **Approval:** None required
- **Gates:** Unit tests, Integration tests, Terraform validation
- **Rollback:** Automatic on failure
- **Monitoring:** Basic health checks

### Staging
- **Trigger:** Auto on push to `staging` or manual
- **Approval:** Optional (can be configured)
- **Gates:** All dev gates + extended smoke tests
- **Rollback:** Automatic + manual option
- **Monitoring:** Extended health checks

### Production
- **Trigger:** Manual only
- **Approval:** Required (configured in GitHub Environment)
- **Gates:** All staging gates + additional security scans
- **Deployment:** Blue/Green with canary
- **Rollback:** Automatic + manual option
- **Monitoring:** Comprehensive with alerting

## Best Practices Implemented

### 1. Fail Fast
- Early validation (format, lint, type-check)
- Pre-deployment gates prevent bad deployments
- Quick feedback loops

### 2. Defense in Depth
- Multiple security scanning tools
- Validation at every stage
- Secrets management
- Least privilege access

### 3. Observability
- Comprehensive logging
- Health check monitoring
- Performance metrics
- Deployment tracking

### 4. Safety
- Automatic rollback on failure
- Manual rollback capability
- Rollback point creation
- Deployment verification

### 5. Efficiency
- Parallel builds (max 3)
- Docker layer caching
- Dependency caching (pnpm, npm, pip)
- Smart change detection

### 6. Compliance
- Audit logs
- Deployment annotations
- Incident records
- Cost estimation

## Troubleshooting

### Common Issues

#### 1. Workflow Fails in Seconds
**Cause:** Usually configuration or secrets issue
**Fix:**
```yaml
- Check required secrets are set
- Verify workflow syntax
- Check job dependencies
```

#### 2. Docker Build Timeout
**Cause:** Large context or slow network
**Fix:**
```yaml
- Increase timeout (current: 30min)
- Optimize Dockerfile
- Use .dockerignore
- Check BuildKit cache
```

#### 3. Deployment Timeout
**Cause:** Image pull issues or insufficient resources
**Fix:**
```yaml
- Check ACR credentials
- Verify image exists
- Check cluster resources
- Increase timeout if needed
```

#### 4. Health Checks Fail
**Cause:** Service not ready or misconfigured
**Fix:**
```yaml
- Check pod logs
- Verify health endpoint exists
- Check database connectivity
- Verify secrets are correct
```

### Debug Mode

Enable debug logging:
```yaml
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## Metrics & KPIs

### Pipeline Performance
- **Median Build Time:** Target < 15 minutes
- **Deployment Time:** Target < 10 minutes
- **Test Execution:** Target < 20 minutes

### Reliability
- **Deployment Success Rate:** Target > 95%
- **Rollback Rate:** Target < 5%
- **MTTR (Mean Time To Recovery):** Target < 15 minutes

### Quality
- **Code Coverage:** Target >= 80%
- **Critical Vulnerabilities:** Target = 0
- **Failed Deployments:** Target < 5%

## Future Enhancements

### Planned Improvements

1. **Progressive Delivery**
   - Feature flags integration
   - Canary deployments with metrics
   - Automated rollback based on error rates

2. **Advanced Testing**
   - Visual regression testing
   - Load testing in pipeline
   - Chaos engineering tests

3. **Enhanced Security**
   - Runtime security scanning
   - Dependency graph analysis
   - SBOM generation

4. **Better Observability**
   - Distributed tracing integration
   - Custom metrics dashboard
   - Deployment analytics

5. **AI/ML Integration**
   - Predictive rollback
   - Anomaly detection
   - Auto-scaling based on load

## Secrets Management

### Required Secrets

```yaml
# Azure
AZURE_CREDENTIALS        # Service Principal credentials
ARM_CLIENT_ID           # Terraform authentication
ARM_CLIENT_SECRET       # Terraform authentication
ARM_SUBSCRIPTION_ID     # Azure subscription
ARM_TENANT_ID          # Azure tenant

# Container Registry
ACR_USERNAME           # Azure Container Registry username
ACR_PASSWORD           # Azure Container Registry password

# Application
JWT_SECRET             # JWT signing secret
DATABASE_URL_DEV       # Development database connection
REDIS_URL_DEV         # Development Redis connection
STRIPE_SECRET_KEY_DEV # Stripe API key (dev)

# External Services
SLACK_WEBHOOK_URL      # Slack notifications
SNYK_TOKEN            # Snyk security scanning
INFRACOST_API_KEY     # Cost estimation
OPENAI_API_KEY_TEST   # AI service testing

# URLs
API_URL_DEV           # Development API URL
```

### Secrets Rotation

**Recommended Schedule:**
- JWT_SECRET: Every 90 days
- API Keys: Every 90 days
- Service Principals: Every 180 days
- Container Registry: Every 180 days

## Conclusion

This CI/CD architecture provides:

✅ **Comprehensive Testing:** Unit, integration, E2E, smoke tests
✅ **Security First:** Multiple scanning tools at every stage
✅ **Reliable Deployments:** Gates, rollback, verification
✅ **Infrastructure as Code:** Terraform validation and security
✅ **Fast Feedback:** Parallel builds, efficient caching
✅ **Production Ready:** Blue/green, canary, monitoring
✅ **Developer Friendly:** Clear errors, good documentation

The pipeline ensures that only high-quality, secure, and tested code reaches production, while providing safety mechanisms to quickly recover from any issues.

---

**Last Updated:** 2025-12-15
**Version:** 2.0
**Maintained By:** DevOps Team
