# CI/CD Quick Reference Guide

## Quick Commands

### Running Manual Workflows

#### Deploy to Development
```bash
# Via GitHub UI:
Actions → CD - Deploy to Development → Run workflow
Options:
  - skip_tests: false (recommended)
  - force_deploy_all: true
```

#### Rollback Deployment
```bash
# Via GitHub UI:
Actions → Rollback Deployment → Run workflow
Required Inputs:
  - Environment: staging | production
  - Service: all | specific service
  - Reason: "Description of why rollback is needed"
Optional:
  - Target SHA: Leave empty for previous deployment
```

#### Run Terraform CI
```bash
# Automatically runs on PR to main/develop with terraform changes
# Or run manually:
Actions → Terraform CI → Run workflow
```

#### Deployment Verification
```bash
# Via GitHub UI:
Actions → Deployment Verification → Run workflow
Inputs:
  - Environment: development | staging | production
  - Base URL: https://your-app.com
  - API URL: https://api.your-app.com
```

## Workflow Status Checks

### CI Pipeline (on PR)
```
✅ Lint & Type Check      - Must pass
✅ Unit Tests             - Must pass
✅ Integration Tests      - Must pass
✅ Security Scan          - Must pass
✅ Build                  - Must pass
```

### Terraform CI (on Terraform changes)
```
✅ Format Check           - Must pass
✅ Validation             - Must pass
✅ TFSec Scan            - Must pass
✅ Checkov Scan          - Must pass
📋 Plan (on PR)          - For review
💰 Cost Estimate (on PR) - For review
```

### CD-Dev (on push to develop)
```
Gate 1: Pre-deployment
  ✅ Unit Tests
  ✅ Integration Tests
  ✅ Terraform Validation

Gate 2: Build
  ✅ Docker Build
  ✅ Trivy Scan
  ⚠️  Critical Vulns = Fail

Gate 3: Deploy
  ✅ Rollback Point Created
  ✅ Deployment Success
  ✅ Rollout Complete (10min)

Gate 4: Verification
  ✅ Health Checks
  ✅ Smoke Tests
  ✅ No Crash Loops
```

## Troubleshooting Guide

### Problem: Workflow fails immediately (< 10 seconds)

**Likely Causes:**
1. Missing secrets
2. Syntax error in workflow
3. Invalid inputs

**Quick Fix:**
```bash
1. Check Settings → Secrets → Actions
2. Verify all required secrets are set
3. Check workflow YAML syntax
4. Review workflow run logs for specific error
```

### Problem: Docker build fails

**Likely Causes:**
1. Dockerfile syntax error
2. Missing files in build context
3. Network timeout
4. BuildKit cache issues

**Quick Fix:**
```bash
1. Test build locally:
   docker build -f apps/web/Dockerfile .

2. Check .dockerignore file

3. Clear cache and retry:
   Actions → Re-run jobs → Re-run failed jobs

4. Increase timeout if needed
```

### Problem: Deployment timeout

**Likely Causes:**
1. Image pull failure
2. Insufficient cluster resources
3. Pod crashes on startup
4. Health checks failing

**Quick Fix:**
```bash
1. Check pod status:
   kubectl get pods -n applyforus

2. View pod logs:
   kubectl logs deployment/[service-name] -n applyforus

3. Describe deployment:
   kubectl describe deployment/[service-name] -n applyforus

4. Check events:
   kubectl get events -n applyforus --sort-by='.lastTimestamp'
```

### Problem: Health checks fail

**Likely Causes:**
1. Service not ready
2. Health endpoint missing
3. Wrong endpoint URL
4. Database connection issues

**Quick Fix:**
```bash
1. Verify health endpoint exists:
   curl https://your-api.com/health

2. Check pod readiness:
   kubectl get pods -n applyforus

3. View application logs:
   kubectl logs [pod-name] -n applyforus

4. Port-forward to test locally:
   kubectl port-forward service/[service] 8080:80 -n applyforus
   curl http://localhost:8080/health
```

### Problem: Tests failing

**Likely Causes:**
1. Flaky tests
2. Database connection issues
3. Missing environment variables
4. Dependency issues

**Quick Fix:**
```bash
1. Run tests locally:
   pnpm test

2. Check test output in workflow logs

3. Run specific test:
   pnpm test --testNamePattern="test name"

4. Check for timing issues or race conditions
```

## Common Workflows

### 1. Deploy Feature to Development

```bash
1. Create feature branch:
   git checkout -b feature/my-feature

2. Make changes and commit:
   git add .
   git commit -m "feat: add my feature"

3. Push to trigger CI:
   git push origin feature/my-feature

4. Create PR to develop
   → CI runs automatically
   → Review Terraform plan if infrastructure changed
   → Request reviews

5. Merge PR to develop
   → CD-Dev workflow runs automatically
   → Monitors deployment
   → Checks health

6. Verify deployment:
   → Check deployment summary in workflow
   → Test on dev.applyforus.com
   → Review logs if needed
```

### 2. Rollback Failed Deployment

```bash
1. Identify issue:
   → Check workflow logs
   → Review pod status
   → Check application logs

2. Trigger rollback:
   Actions → Rollback Deployment → Run workflow

3. Fill in details:
   Environment: [staging/production]
   Service: [all or specific]
   Reason: "Describe the issue"
   Target SHA: [leave empty for previous] or [specific commit]

4. Monitor rollback:
   → Watch workflow execution
   → Verify health checks pass
   → Confirm application works

5. Investigate root cause:
   → Review failed deployment logs
   → Fix issues
   → Test thoroughly before redeploying
```

### 3. Update Infrastructure

```bash
1. Update Terraform files:
   cd infrastructure/terraform
   vim main.tf

2. Format and validate locally:
   terraform fmt -recursive
   terraform validate

3. Commit and push:
   git add .
   git commit -m "infra: update infrastructure"
   git push

4. Create PR:
   → Terraform CI runs automatically
   → Review plan in PR comments
   → Check cost estimate
   → Review security scan results

5. Address any issues:
   → Fix formatting errors
   → Resolve security warnings
   → Adjust resources if cost too high

6. Merge when approved:
   → Apply manually or via workflow
```

### 4. Emergency Hotfix to Production

```bash
1. Create hotfix branch from main:
   git checkout main
   git pull
   git checkout -b hotfix/critical-fix

2. Make minimal changes:
   → Fix only the critical issue
   → Add test if possible
   → Keep changes small

3. Test thoroughly:
   pnpm test
   pnpm run lint

4. Create PR to main:
   → Mark as urgent
   → Get quick review
   → Ensure all checks pass

5. Merge to main:
   → CI runs on main
   → All gates must pass

6. Trigger production deployment:
   Actions → CD-Prod → Run workflow
   → Requires manual approval
   → Monitors deployment carefully

7. Verify in production:
   → Run deployment verification
   → Monitor metrics
   → Keep rollback ready

8. Backport to develop:
   git checkout develop
   git merge hotfix/critical-fix
   git push
```

## Secrets Configuration Checklist

### Azure Secrets
```
☐ AZURE_CREDENTIALS
  Format: {"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}

☐ ARM_CLIENT_ID
☐ ARM_CLIENT_SECRET
☐ ARM_SUBSCRIPTION_ID
☐ ARM_TENANT_ID
```

### Container Registry
```
☐ ACR_USERNAME
☐ ACR_PASSWORD
```

### Application Secrets
```
☐ JWT_SECRET
☐ DATABASE_URL_DEV
☐ DATABASE_URL_STAGING
☐ DATABASE_URL_PROD
☐ REDIS_URL_DEV
☐ REDIS_URL_STAGING
☐ REDIS_URL_PROD
☐ STRIPE_SECRET_KEY_DEV
☐ STRIPE_SECRET_KEY_PROD
```

### Third-Party Services
```
☐ SLACK_WEBHOOK_URL
☐ SNYK_TOKEN (optional)
☐ INFRACOST_API_KEY (optional)
☐ OPENAI_API_KEY_TEST
```

### URLs
```
☐ API_URL_DEV
☐ API_URL_STAGING
☐ API_URL_PROD
```

## Monitoring Dashboards

### GitHub Actions
```
Repository → Actions
  → View all workflow runs
  → Filter by workflow, branch, status
  → Download logs
  → Re-run failed jobs
```

### Azure Kubernetes
```
Azure Portal → AKS Cluster
  → Workloads → View deployments
  → Services and ingresses
  → Logs
  → Metrics
```

### Security Alerts
```
Repository → Security → Code scanning alerts
  → View all security findings
  → Filter by severity
  → Create issues for tracking
```

## Performance Benchmarks

### Typical Workflow Times

| Workflow | Expected Duration | Timeout |
|----------|------------------|---------|
| CI Pipeline | 10-15 minutes | 30 min |
| Terraform CI | 5-10 minutes | 20 min |
| CD-Dev | 15-25 minutes | 60 min |
| Integration Tests | 15-20 minutes | 40 min |
| Security Scan | 5-10 minutes | 20 min |
| Deployment Verification | 5-10 minutes | 20 min |
| Rollback | 5-10 minutes | 20 min |

### Red Flags

⚠️ **Immediate attention needed if:**
- Any workflow takes > 2x expected time
- Health checks fail > 2 times consecutively
- Critical vulnerabilities detected
- Deployment success rate < 90%
- Rollback rate > 10%

## Contact & Escalation

### Workflow Issues
1. Check workflow logs
2. Review this guide
3. Check CI_CD_ARCHITECTURE.md for details
4. Contact DevOps team via Slack

### Security Issues
1. Don't ignore security scan failures
2. Review security scan results
3. Create issues for tracking
4. Escalate CRITICAL findings immediately

### Production Issues
1. Monitor deployment carefully
2. Have rollback ready
3. Notify team in Slack
4. Create incident record
5. Follow incident response plan

## Best Practices

### DO ✅
- Run tests locally before pushing
- Keep commits small and focused
- Write meaningful commit messages
- Review Terraform plans before merging
- Monitor deployments actively
- Document rollback reasons
- Rotate secrets regularly
- Keep dependencies updated

### DON'T ❌
- Skip tests (unless emergency)
- Ignore security warnings
- Force push to main/develop
- Deploy without reviewing changes
- Ignore failed health checks
- Deploy large changes to production directly
- Hardcode secrets in code
- Merge without reviews

## Emergency Contacts

```
DevOps Team: #devops-alerts (Slack)
On-Call Engineer: Check PagerDuty
Security Team: security@applyforus.com
Infrastructure Issues: #infrastructure (Slack)
```

## Additional Resources

- [CI/CD Architecture](./CI_CD_ARCHITECTURE.md) - Detailed architecture docs
- [Terraform Docs](./infrastructure/terraform/README.md) - Infrastructure docs
- [Kubernetes Manifests](./infrastructure/kubernetes/README.md) - K8s configuration
- [Security Policies](./SECURITY_AUDIT_2025_COMPREHENSIVE.md) - Security guidelines

---

**Version:** 1.0
**Last Updated:** 2025-12-15
**Quick Link:** Bookmark this page for quick reference!
