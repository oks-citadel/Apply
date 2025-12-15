# CI/CD Pipeline Guide

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [Workflow Structure](#workflow-structure)
4. [Pipeline Gates and Safeguards](#pipeline-gates-and-safeguards)
5. [Deployment Stages](#deployment-stages)
6. [Rollback Procedures](#rollback-procedures)
7. [Adding New Services](#adding-new-services)
8. [Security and Compliance](#security-and-compliance)
9. [Monitoring and Alerts](#monitoring-and-alerts)
10. [Troubleshooting](#troubleshooting)

## Overview

The ApplyForUs platform uses GitHub Actions for continuous integration and deployment. Our CI/CD pipeline implements multiple gates, automated testing, security scanning, and safe deployment practices across development, staging, and production environments.

### Key Principles

- **Safety First**: Multiple gates prevent bad code from reaching production
- **Automated Testing**: Comprehensive unit, integration, and E2E tests
- **Security by Default**: Automated security scanning at every stage
- **Fast Feedback**: Parallel execution where possible
- **Rollback Ready**: Every deployment has a rollback mechanism
- **Infrastructure as Code**: All infrastructure changes go through review and approval

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Code Push/PR                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐       ┌───────▼────────┐
         │   CI Pipeline│       │ Terraform CI   │
         │   (ci.yml)   │       │(terraform-ci.yml)│
         └──────┬───────┘       └───────┬────────┘
                │                       │
         ┌──────▼────────────────────┬──┘
         │                           │
    ┌────▼─────┐              ┌─────▼──────┐
    │Lint/Test │              │ TF Validate│
    │Coverage  │              │ Security   │
    └────┬─────┘              │ Cost Est   │
         │                    └─────┬──────┘
    ┌────▼────────┐                 │
    │Security Scan│                 │
    │SAST/SCA     │                 │
    └────┬────────┘                 │
         │                          │
    ┌────▼────────┐           ┌─────▼──────┐
    │Build & Push │           │ PR Comment │
    │   Images    │           │ with Plan  │
    └────┬────────┘           └────────────┘
         │
         │ (Merge to main)
         │
    ┌────▼────────┐
    │Deploy to    │
    │Staging      │
    │(cd-staging) │
    └────┬────────┘
         │
    ┌────▼────────┐
    │Smoke Tests  │
    │Integration  │
    └────┬────────┘
         │
         │ (Manual trigger with tag)
         │
    ┌────▼────────┐
    │Approval Gate│
    │(Production) │
    └────┬────────┘
         │
    ┌────▼────────┐
    │Deploy to    │
    │Production   │
    │(cd-prod)    │
    └────┬────────┘
         │
    ┌────▼────────┐
    │Smoke Tests  │
    │Monitoring   │
    └─────────────┘
```

## Workflow Structure

### Core Workflows

| Workflow | Trigger | Purpose | Gates |
|----------|---------|---------|-------|
| `ci.yml` | Push/PR to main/develop | Run tests, linting, build checks | Lint, Unit Tests, Coverage, Security Scan |
| `terraform-ci.yml` | PR with Terraform changes | Validate IaC changes | Format, Validate, Security (tfsec/Checkov), Cost Estimate |
| `terraform-apply.yml` | Push to main or manual | Apply infrastructure changes | Approval (staging/prod), State backup |
| `cd-staging.yml` | Push to main | Deploy to staging environment | Security gate, Backup, Health checks |
| `cd-prod.yml` | Version tag (v*.*.*) | Deploy to production | Staging verification, Security gate, Approval, Backup |
| `rollback.yml` | Manual trigger | Rollback failed deployments | Validation, Backup, Health verification |
| `integration-tests.yml` | Push/PR/Schedule | Run integration tests | DB setup, Service health |
| `security-scan.yml` | Push/PR/Schedule | Comprehensive security scans | SAST, SCA, Container, Secrets, IaC |

### Workflow Dependencies

```yaml
# Example: Production deployment chain
1. security-gate (SAST, SCA, Container scan)
   ↓
2. validate (Version, Staging health check)
   ↓
3. create-backup (Full K8s backup)
   ↓
4. build-and-push (Build all service images)
   ↓
5. deploy (Rolling update with health checks)
   ↓
6. smoke-tests (Functional validation)
   ↓
7. monitor (5-minute observation period)
   ↓
8. notify (Slack/Email notifications)
```

## Pipeline Gates and Safeguards

### Gate 1: Code Quality and Linting

**Location**: `ci.yml` - `lint-and-typecheck` job

**Checks**:
- Prettier formatting
- ESLint rules
- TypeScript type checking
- No compilation errors

**Failure Action**: PR cannot be merged

```yaml
- name: Run ESLint
  run: npm run lint --workspaces --if-present
  # Must pass - no continue-on-error
```

### Gate 2: Unit and Integration Tests

**Location**: `ci.yml` - `test-*` jobs

**Checks**:
- All unit tests pass
- Code coverage meets 80% threshold
- Integration tests pass for critical flows

**Failure Action**: PR blocked, deployment cancelled

```yaml
- name: Check coverage threshold
  run: |
    coverage=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    if (( $(echo "$coverage < 80" | bc -l) )); then
      echo "Coverage $coverage% is below threshold 80%"
      exit 1
    fi
```

### Gate 3: Security Scanning

**Location**: `ci.yml` - `security-scan` job, `security-scan.yml`

**Checks**:
- SAST: CodeQL, Semgrep
- SCA: npm audit, Snyk
- Container: Trivy, Grype
- Secrets: Gitleaks, TruffleHog
- IaC: Checkov, tfsec

**Failure Action**: High/Critical issues block deployment

```yaml
- name: Run Snyk security scan
  uses: snyk/actions/node@master
  with:
    args: --severity-threshold=high
  # Fails on high/critical vulnerabilities
```

### Gate 4: Terraform Validation

**Location**: `terraform-ci.yml`

**Checks**:
- `terraform fmt -check`
- `terraform validate`
- tfsec security scan (minimum: MEDIUM)
- Checkov policy compliance
- Cost estimation (Infracost)

**Failure Action**: PR blocked, plan must be regenerated

```yaml
- name: Run tfsec
  uses: aquasecurity/tfsec-action@v1.0.3
  with:
    soft_fail: false
    additional_args: --minimum-severity MEDIUM
```

### Gate 5: Manual Approval (Staging/Production)

**Location**: `terraform-apply-enhanced.yml`, `cd-prod.yml`

**Checks**:
- Terraform plan reviewed
- Cost estimate acceptable
- Staging health verified (for prod deployments)
- Change request approved (for prod)

**Failure Action**: Deployment pauses until approval

```yaml
environment:
  name: production-terraform-approval
  # Requires manual approval in GitHub UI
```

### Gate 6: Deployment Health Checks

**Location**: All deployment workflows

**Checks**:
- Kubernetes rollout status
- Pod health (all running)
- Service endpoints responding
- No container crashes

**Failure Action**: Automatic rollback triggered

```yaml
- name: Wait for rollout
  run: |
    if ! kubectl rollout status deployment/$service -n $NS --timeout=600s; then
      echo "::error::Rollout failed for $service"
      exit 1
    fi
```

### Gate 7: Smoke Tests

**Location**: `cd-staging.yml`, `cd-prod.yml`

**Checks**:
- Web application loads
- API health endpoints respond
- Critical user flows work
- Authentication functional

**Failure Action**: Deployment marked as failed, rollback recommended

```yaml
- name: Test web application
  run: |
    for i in {1..10}; do
      if curl -sf "https://applyforus.com/health"; then
        echo "✅ Health check passed"
        break
      fi
      if [ $i -eq 10 ]; then
        exit 1
      fi
      sleep 15
    done
```

## Deployment Stages

### Development Environment

**Trigger**: Push to `develop` branch
**Approval**: None required
**Deployment Strategy**: Rolling update
**Rollback**: Manual

**Steps**:
1. Run CI pipeline (all gates)
2. Build and push images with `dev-latest` tag
3. Deploy to dev namespace
4. Run smoke tests

### Staging Environment

**Trigger**: Push to `main` branch or RC tag (`v*-rc*`)
**Approval**: Required for infrastructure changes
**Deployment Strategy**: Progressive deployment
**Rollback**: Automated on failure, manual trigger available

**Steps**:
1. Run full CI pipeline
2. Security gate validation
3. Create deployment backup
4. Build and push images with version tag
5. Deploy infrastructure services first
6. Deploy application services
7. Deploy frontend
8. Run smoke tests
9. Run integration tests
10. Post deployment summary

**Progressive Deployment**:
```yaml
# Deploy in order: infrastructure → apps → frontend
INFRA_SERVICES="auth-service,user-service"
APP_SERVICES="job-service,resume-service,..."
FRONTEND="web"
```

### Production Environment

**Trigger**: Version tag (`v*.*.*`) or manual dispatch
**Approval**: Required (manual gate)
**Deployment Strategy**: Blue-Green for frontend, Rolling for backend
**Rollback**: Automated on failure, manual trigger available

**Steps**:
1. Validate version format (semver)
2. Verify staging is healthy
3. Run security gate
4. Create full production backup
5. Build production images
6. Scan images for vulnerabilities
7. **APPROVAL GATE** - Wait for manual approval
8. Deploy backend services (rolling update)
9. Deploy frontend (blue-green switch)
10. Verify deployment
11. Run comprehensive smoke tests
12. Monitor for 5 minutes
13. Create deployment record
14. Send notifications

**Blue-Green Deployment (Frontend)**:
```yaml
# Determine current and new deployment
CURRENT=$(kubectl get service web -n applyforus -o jsonpath='{.spec.selector.version}')
NEW=$([ "$CURRENT" = "blue" ] && echo "green" || echo "blue")

# Deploy to inactive environment
kubectl set image deployment/web-$NEW web=$IMAGE

# Wait for ready
kubectl rollout status deployment/web-$NEW

# Switch traffic
kubectl patch service web -p "{\"spec\":{\"selector\":{\"version\":\"$NEW\"}}}"
```

## Rollback Procedures

### Automated Rollback

Triggered when:
- Deployment rollout fails
- Health checks fail after deployment
- Smoke tests fail

### Manual Rollback

**Workflow**: `rollback.yml`

**Usage**:
```bash
# Trigger via GitHub UI or CLI
gh workflow run rollback.yml \
  -f environment=production \
  -f service=web \
  -f reason="Critical bug in v2.1.0"
```

**Parameters**:
- `environment`: staging | production
- `service`: Service to rollback or 'all'
- `target-sha`: Git SHA to rollback to (optional, defaults to previous)
- `reason`: Required explanation for audit trail

**Process**:
1. Validate rollback request
2. Create backup of current state
3. Checkout target version
4. Set image tags to target SHA
5. Wait for rollout completion
6. Verify with health checks
7. Run smoke tests
8. Create incident record
9. Notify team

**Rollback Verification**:
```bash
# After rollback, verify:
kubectl get deployments -n applyforus
kubectl get pods -n applyforus
curl https://applyforus.com/health
```

### Database Rollback

**IMPORTANT**: Database migrations must be reversible!

**Best Practices**:
1. Always create `up` and `down` migrations
2. Test rollback in dev/staging first
3. Backup database before production deployment
4. Never delete columns in `up` migration
5. Use additive migrations when possible

**Example Reversible Migration**:
```typescript
// up migration
export async function up(db: Database) {
  await db.schema.createTable('new_feature', (table) => {
    table.increments('id');
    table.string('name');
  });
}

// down migration
export async function down(db: Database) {
  await db.schema.dropTable('new_feature');
}
```

**Rollback Database**:
```bash
# Connect to pod
kubectl exec -it deployment/auth-service -n applyforus -- sh

# Run migrations down
npm run migrate:down
```

## Adding New Services

### Step 1: Create Service Structure

```bash
# Create service directory
mkdir -p services/new-service

# Add package.json, Dockerfile, etc.
```

### Step 2: Add to CI Pipeline

**File**: `.github/workflows/ci.yml`

```yaml
# Add to test matrix
strategy:
  matrix:
    service:
      - auth-service
      - user-service
      - new-service  # Add here
```

### Step 3: Add Docker Build

**File**: `.github/workflows/build-images.yml`

```yaml
strategy:
  matrix:
    service:
      - web
      - auth-service
      - new-service  # Add here
```

### Step 4: Add to Deployment Workflows

**File**: `.github/workflows/cd-staging.yml`

```yaml
env:
  SERVICES: 'web,auth-service,...,new-service'  # Add here
```

**File**: `.github/workflows/cd-prod.yml`

```yaml
strategy:
  matrix:
    service: [..., new-service]  # Add here
```

### Step 5: Create Kubernetes Manifests

**Directory**: `infrastructure/kubernetes/services/new-service/`

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: new-service
  namespace: applyforus
spec:
  replicas: 2
  selector:
    matchLabels:
      app: new-service
  template:
    metadata:
      labels:
        app: new-service
    spec:
      containers:
      - name: new-service
        image: applyforusacr.azurecr.io/applyai-new-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: new-service
  namespace: applyforus
spec:
  selector:
    app: new-service
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### Step 6: Add Integration Tests

**File**: `.github/workflows/integration-tests.yml`

```yaml
integration-test-new-service:
  name: New Service Integration Tests
  runs-on: ubuntu-latest
  services:
    postgres: ...
    redis: ...
  steps:
    - name: Run tests
      run: npm run test:e2e --workspace=services/new-service
```

### Step 7: Update Documentation

1. Add service to architecture diagram
2. Document API endpoints
3. Add to service dependency matrix
4. Update deployment runbook

## Security and Compliance

### Security Scanning Schedule

| Scan Type | Frequency | Tool | Severity Threshold |
|-----------|-----------|------|-------------------|
| SAST | Every PR/Push | CodeQL, Semgrep | High |
| SCA | Every PR/Push | Snyk, npm audit | High |
| Container | Every build | Trivy, Grype | Critical |
| Secrets | Every commit | Gitleaks, TruffleHog | Any |
| IaC | Every Terraform change | Checkov, tfsec | Medium |
| DAST | Weekly | OWASP ZAP | Medium |

### Compliance Requirements

**GDPR**:
- Data encryption at rest and in transit
- Audit logging enabled
- Personal data handling reviewed

**SOC 2**:
- Access control via GitHub environments
- Change approval for production
- Audit trail of all deployments

**Best Practices**:
- Secrets stored in Azure Key Vault
- No secrets in code or logs
- Least privilege access
- Regular security reviews

### Secret Management

**GitHub Secrets** (for CI/CD):
```
AZURE_CREDENTIALS
ACR_USERNAME
ACR_PASSWORD
DATABASE_URL_PROD
DATABASE_URL_STAGING
JWT_SECRET
STRIPE_SECRET_KEY_PROD
OPENAI_API_KEY
SNYK_TOKEN
INFRACOST_API_KEY
```

**Azure Key Vault** (for runtime):
```
# Accessed by services via managed identity
database-url
jwt-secret
stripe-secret-key
sendgrid-api-key
openai-api-key
```

**Rotation Schedule**:
- Database credentials: 90 days
- API keys: 180 days
- JWT secrets: 365 days
- Service principals: 90 days

## Monitoring and Alerts

### Deployment Monitoring

**Metrics Tracked**:
- Deployment duration
- Rollout success rate
- Test pass rate
- Build time
- Security scan findings

**Alerts Configured**:
- Deployment failure → Slack #deployments
- Security scan critical findings → Slack #security
- Production rollback → Slack #incidents + PagerDuty
- Integration test failures → Slack #ci-cd

### GitHub Actions Monitoring

**Workflow Status**:
```bash
# View recent workflow runs
gh run list --workflow=ci.yml --limit 10

# View specific run
gh run view 12345 --log

# Rerun failed jobs
gh run rerun 12345 --failed
```

**Key Metrics**:
- Average build time: < 15 minutes
- Test pass rate: > 95%
- Deployment success rate: > 98%
- Time to production: < 1 hour (from merge)

### Post-Deployment Monitoring

**5-Minute Observation** (Production):
```yaml
- name: Monitor for 5 minutes
  run: |
    for i in {1..5}; do
      # Check pod health
      kubectl get pods -n applyforus

      # Check for restarts
      RESTARTS=$(kubectl get pods -n applyforus -o jsonpath='{.items[*].status.containerStatuses[*].restartCount}')
      echo "Container restarts: $RESTARTS"

      # Health check
      curl -sf https://applyforus.com/health

      sleep 60
    done
```

## Troubleshooting

### Common Issues

#### Issue: CI Pipeline Fails on Lint

**Symptoms**: ESLint or Prettier errors
**Solution**:
```bash
# Fix formatting
npm run format

# Fix lint issues
npm run lint --fix

# Commit fixes
git add .
git commit -m "fix: Resolve linting issues"
```

#### Issue: Test Coverage Below Threshold

**Symptoms**: Coverage gate fails
**Solution**:
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html

# Add tests for uncovered lines
# Aim for 80%+ coverage
```

#### Issue: Terraform Apply Fails

**Symptoms**: Infrastructure deployment fails
**Solution**:
```bash
# Check Terraform logs in GitHub Actions

# Validate locally
cd infrastructure/terraform
terraform init
terraform validate
terraform plan -var-file=environments/dev.tfvars

# Fix issues, commit, push
```

#### Issue: Docker Build Fails

**Symptoms**: Image build fails in pipeline
**Solution**:
```bash
# Build locally to debug
docker build -t test-image -f services/auth-service/Dockerfile .

# Check for:
# - Missing dependencies in package.json
# - Incorrect COPY paths
# - Base image issues

# Test the image
docker run -it test-image sh
```

#### Issue: Deployment Rollout Timeout

**Symptoms**: Kubernetes rollout doesn't complete
**Solution**:
```bash
# Check pod status
kubectl get pods -n applyforus

# Describe failing pod
kubectl describe pod <pod-name> -n applyforus

# Check logs
kubectl logs <pod-name> -n applyforus

# Common causes:
# - Image pull errors
# - Resource limits
# - Health check failures
# - Missing secrets/configmaps
```

#### Issue: Health Checks Failing

**Symptoms**: Smoke tests fail after deployment
**Solution**:
```bash
# Check service is running
kubectl get svc -n applyforus

# Test health endpoint
kubectl port-forward svc/web 8080:80 -n applyforus
curl http://localhost:8080/health

# Check logs
kubectl logs deployment/web -n applyforus

# Verify environment variables
kubectl exec deployment/web -n applyforus -- env | grep DATABASE
```

### Getting Help

**Documentation**:
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Kubernetes Docs](https://kubernetes.io/docs/)
- [Terraform Docs](https://www.terraform.io/docs/)

**Internal Resources**:
- Architecture Diagrams: `/docs/architecture/`
- API Documentation: `/docs/api/`
- Runbooks: `/docs/runbooks/`

**Escalation**:
1. Check workflow logs
2. Search previous issues in GitHub
3. Ask in #engineering Slack channel
4. Create incident if production impacted
5. Page on-call if critical

## Best Practices

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Write tests first**: TDD approach
3. **Run tests locally**: `npm test`
4. **Commit frequently**: Small, focused commits
5. **Push to remote**: Trigger CI checks
6. **Create PR**: Get code review
7. **Address feedback**: Iterate on PR
8. **Merge to main**: Triggers staging deployment
9. **Monitor staging**: Verify changes work
10. **Tag for production**: Create version tag

### Deployment Checklist

**Before Deployment**:
- [ ] All tests passing
- [ ] Security scans clean
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Feature flags configured
- [ ] Rollback plan documented

**During Deployment**:
- [ ] Monitor deployment progress
- [ ] Watch for error logs
- [ ] Verify health checks
- [ ] Run smoke tests
- [ ] Check metrics dashboard

**After Deployment**:
- [ ] Verify functionality
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document any issues

### Pipeline Optimization

**Speed Improvements**:
- Use workflow concurrency groups
- Parallelize independent jobs
- Cache dependencies (npm, Docker layers)
- Use matrix strategy for multi-service builds
- Skip unnecessary steps with path filters

**Cost Optimization**:
- Use appropriate runner sizes
- Cancel in-progress runs on new commits
- Clean up old artifacts
- Use self-hosted runners for heavy workloads

**Reliability**:
- Set appropriate timeouts
- Use `continue-on-error` judiciously
- Implement retry logic for flaky tests
- Monitor workflow success rates
- Regular maintenance and updates

## Appendix

### Environment Variables

**Required for CI**:
```bash
NODE_VERSION=20
PYTHON_VERSION=3.11
COVERAGE_THRESHOLD=80
TF_VERSION=1.6.0
```

**Required Secrets**:
See [Secret Management](#secret-management) section

### Workflow Triggers

```yaml
# Common trigger patterns

# On push to specific branches
on:
  push:
    branches: [main, develop]

# On PR to specific branches
on:
  pull_request:
    branches: [main]

# On path changes
on:
  push:
    paths:
      - 'services/**'
      - 'infrastructure/**'

# On tag creation
on:
  push:
    tags:
      - 'v*.*.*'

# Manual trigger
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, staging, prod]

# Scheduled
on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM
```

### Useful Commands

```bash
# GitHub CLI workflow commands
gh workflow list
gh workflow run ci.yml
gh workflow view ci.yml
gh run list
gh run view <run-id>
gh run watch <run-id>

# Kubernetes commands
kubectl get deployments -n applyforus
kubectl rollout status deployment/web -n applyforus
kubectl rollout history deployment/web -n applyforus
kubectl rollout undo deployment/web -n applyforus

# Terraform commands
terraform workspace list
terraform workspace select staging
terraform plan -out=tfplan
terraform show tfplan
terraform apply tfplan
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-15
**Maintained By**: DevOps Team
