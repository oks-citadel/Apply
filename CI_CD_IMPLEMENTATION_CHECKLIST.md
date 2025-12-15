# CI/CD Implementation Checklist

## Pre-Implementation Checklist

### 1. Review Documentation
- [ ] Read [CI_CD_ARCHITECTURE.md](./CI_CD_ARCHITECTURE.md)
- [ ] Read [CI_CD_QUICK_REFERENCE.md](./CI_CD_QUICK_REFERENCE.md)
- [ ] Read [CI_CD_HARDENING_SUMMARY.md](./CI_CD_HARDENING_SUMMARY.md)
- [ ] Understand workflow dependencies
- [ ] Review security requirements

### 2. Verify Repository Settings

#### Secrets Configuration
Navigate to: Settings → Secrets and variables → Actions

**Azure Secrets:**
- [ ] `AZURE_CREDENTIALS` - Service Principal JSON
- [ ] `ARM_CLIENT_ID` - Azure Client ID
- [ ] `ARM_CLIENT_SECRET` - Azure Client Secret
- [ ] `ARM_SUBSCRIPTION_ID` - Azure Subscription ID
- [ ] `ARM_TENANT_ID` - Azure Tenant ID

**Container Registry:**
- [ ] `ACR_USERNAME` - Azure Container Registry username
- [ ] `ACR_PASSWORD` - Azure Container Registry password

**Application Secrets (Development):**
- [ ] `JWT_SECRET` - JWT signing secret
- [ ] `DATABASE_URL_DEV` - Development database URL
- [ ] `REDIS_URL_DEV` - Development Redis URL
- [ ] `STRIPE_SECRET_KEY_DEV` - Stripe API key (dev)
- [ ] `API_URL_DEV` - Development API URL

**Optional but Recommended:**
- [ ] `SLACK_WEBHOOK_URL` - Slack notifications
- [ ] `SNYK_TOKEN` - Snyk security scanning
- [ ] `INFRACOST_API_KEY` - Infrastructure cost estimation
- [ ] `OPENAI_API_KEY_TEST` - AI service testing

#### Branch Protection Rules
Navigate to: Settings → Branches → Add rule

**For `main` branch:**
- [ ] Require pull request reviews before merging (1-2 reviewers)
- [ ] Require status checks to pass before merging
  - [ ] Check: `lint-and-typecheck`
  - [ ] Check: `test-web`
  - [ ] Check: `test-services`
  - [ ] Check: `security-scan`
  - [ ] Check: `terraform-format` (if Terraform changes)
  - [ ] Check: `terraform-validate` (if Terraform changes)
- [ ] Require conversation resolution before merging
- [ ] Do not allow bypassing the above settings

**For `develop` branch:**
- [ ] Require pull request reviews before merging (1 reviewer)
- [ ] Require status checks to pass before merging
  - [ ] Check: `lint-and-typecheck`
  - [ ] Check: `test-web`
  - [ ] Check: `test-services`
- [ ] Allow force pushes (for emergency fixes only)

#### Environment Configuration
Navigate to: Settings → Environments

**Development Environment:**
- [ ] Create environment: `development`
- [ ] No deployment branches restrictions
- [ ] No required reviewers
- [ ] Environment URL: `https://dev.applyforus.com`

**Staging Environment:**
- [ ] Create environment: `staging`
- [ ] Deployment branches: `staging` branch only
- [ ] Required reviewers: 1 person
- [ ] Environment URL: `https://staging.applyforus.com`

**Production Environment:**
- [ ] Create environment: `production`
- [ ] Deployment branches: `main` branch only
- [ ] Required reviewers: 2 people (include DevOps lead)
- [ ] Deployment protection rules: Manual approval required
- [ ] Environment URL: `https://applyforus.com`

### 3. Verify Workflow Files

- [ ] `.github/workflows/ci.yml` exists and valid
- [ ] `.github/workflows/cd-dev.yml` exists and valid
- [ ] `.github/workflows/terraform-ci.yml` exists and valid ⭐ NEW
- [ ] `.github/workflows/deployment-verification.yml` exists and valid ⭐ NEW
- [ ] `.github/workflows/integration-tests.yml` exists and valid
- [ ] `.github/workflows/rollback.yml` exists and valid

**Validate syntax:**
```bash
# Install actionlint
brew install actionlint  # macOS
# or
sudo apt-get install actionlint  # Linux

# Validate all workflows
cd .github/workflows
for file in *.yml; do
  echo "Checking $file..."
  actionlint "$file"
done
```

### 4. Infrastructure Verification

**Azure Resources:**
- [ ] AKS cluster exists: `applyforus-aks`
- [ ] Resource group exists: `applyforus-prod-rg`
- [ ] ACR exists: `applyforusacr.azurecr.io`
- [ ] Namespace exists in AKS: `applyforus`
- [ ] Key Vault configured (optional)

**Kubernetes Resources:**
```bash
# Connect to AKS
az login
az account set --subscription <subscription-id>
az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-aks

# Verify namespace
kubectl get namespace applyforus

# Verify deployments exist
kubectl get deployments -n applyforus

# Check services
kubectl get services -n applyforus
```

- [ ] All expected deployments exist
- [ ] Services are configured
- [ ] Ingress/Load balancer configured
- [ ] Health endpoints accessible

### 5. Local Testing

**Test Terraform:**
```bash
cd infrastructure/terraform

# Format check
terraform fmt -check -recursive

# Initialize
terraform init

# Validate
terraform validate
```
- [ ] Terraform format is correct
- [ ] Terraform validates successfully
- [ ] No obvious errors

**Test Docker Builds:**
```bash
# Test web app build
docker build -f apps/web/Dockerfile .

# Test a service build
docker build -f services/auth-service/Dockerfile .
```
- [ ] Docker builds complete successfully
- [ ] No build errors
- [ ] Images are reasonable size

**Test Unit Tests:**
```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run linting
pnpm run lint
```
- [ ] All tests pass
- [ ] Linting passes
- [ ] No critical warnings

## Implementation Steps

### Phase 1: Dry Run (Day 1)

#### Morning
1. **Review with team**
   - [ ] Schedule team meeting
   - [ ] Walk through new workflows
   - [ ] Explain new gates and processes
   - [ ] Answer questions
   - [ ] Get buy-in from team

2. **Configure secrets**
   - [ ] Add all required secrets to GitHub
   - [ ] Verify secret values are correct
   - [ ] Test secret access in workflow

#### Afternoon
3. **Test Terraform CI**
   - [ ] Create test PR with Terraform change
   - [ ] Watch Terraform CI workflow run
   - [ ] Verify format check works
   - [ ] Verify validation works
   - [ ] Check that plan is commented on PR
   - [ ] Review security scan results
   - [ ] Merge if successful

4. **Test deployment verification**
   - [ ] Manually trigger deployment verification workflow
   - [ ] Provide development environment URLs
   - [ ] Watch health checks run
   - [ ] Verify smoke tests work
   - [ ] Check performance tests
   - [ ] Review security checks
   - [ ] Confirm all pass/fail correctly

### Phase 2: Development Environment (Days 2-3)

5. **First deployment test**
   - [ ] Create feature branch
   - [ ] Make small, safe change
   - [ ] Create PR to develop
   - [ ] Watch CI workflow run
   - [ ] Verify all checks pass
   - [ ] Merge to develop
   - [ ] Watch CD-Dev workflow trigger

6. **Monitor deployment**
   - [ ] Track pre-deployment gates
     - [ ] Unit tests complete
     - [ ] Integration tests complete
     - [ ] Terraform validation complete
   - [ ] Track build phase
     - [ ] All images build successfully
     - [ ] Trivy scans complete
     - [ ] No critical vulnerabilities
   - [ ] Track deployment
     - [ ] Rollback point created
     - [ ] Deployments updated
     - [ ] Rollouts complete
   - [ ] Track verification
     - [ ] Health checks pass
     - [ ] Smoke tests pass
     - [ ] No crash loops

7. **Verify deployment**
   ```bash
   # Check pods
   kubectl get pods -n applyforus

   # Check deployments
   kubectl get deployments -n applyforus

   # Check events
   kubectl get events -n applyforus --sort-by='.lastTimestamp' | tail -20

   # Test health endpoints
   curl https://dev.applyforus.com/health
   ```
   - [ ] All pods are running
   - [ ] No errors in logs
   - [ ] Application accessible
   - [ ] Health endpoints working

### Phase 3: Test Rollback (Day 4)

8. **Trigger intentional failure**
   - [ ] Create branch with breaking change
   - [ ] Deploy to development
   - [ ] Watch deployment fail
   - [ ] Verify automatic rollback triggers
   - [ ] Confirm rollback completes
   - [ ] Verify application still works

9. **Test manual rollback**
   - [ ] Navigate to Actions → Rollback Deployment
   - [ ] Select development environment
   - [ ] Choose specific service or all
   - [ ] Provide rollback reason
   - [ ] Trigger workflow
   - [ ] Monitor rollback process
   - [ ] Verify health checks pass
   - [ ] Confirm Slack notification sent

10. **Document findings**
    - [ ] Note any issues encountered
    - [ ] Record timeout values (too long/short?)
    - [ ] List any unclear error messages
    - [ ] Identify needed improvements

### Phase 4: Fine-Tuning (Days 5-7)

11. **Optimize based on findings**
    - [ ] Adjust timeouts if needed
    - [ ] Improve error messages
    - [ ] Fix any bugs found
    - [ ] Update documentation

12. **Multiple deployment cycles**
    - [ ] Deploy 5-10 times over the week
    - [ ] Mix of successful and failed deployments
    - [ ] Test different scenarios
    - [ ] Build team confidence

13. **Collect metrics**
    - [ ] Average deployment time
    - [ ] Success rate
    - [ ] Time to detect failures
    - [ ] Time to rollback
    - [ ] Build cache hit rate

### Phase 5: Team Training (Week 2)

14. **Documentation review**
    - [ ] Share documentation with team
    - [ ] Create internal wiki pages
    - [ ] Record training video (optional)
    - [ ] Create FAQ document

15. **Hands-on training**
    - [ ] Each team member deploys a change
    - [ ] Each team member triggers a rollback
    - [ ] Practice emergency scenarios
    - [ ] Review logs and debugging

16. **Establish on-call rotation**
    - [ ] Create on-call schedule
    - [ ] Define escalation paths
    - [ ] Set up alerts
    - [ ] Document runbooks

### Phase 6: Staging Rollout (Week 3)

17. **Prepare staging**
    - [ ] Verify staging secrets configured
    - [ ] Create staging branch if needed
    - [ ] Update CD-Staging workflow
    - [ ] Test deployment to staging

18. **First staging deployment**
    - [ ] Deploy known-good code
    - [ ] Monitor closely
    - [ ] Run full test suite
    - [ ] Verify all services

19. **Staging validation period**
    - [ ] Deploy regularly to staging for 1 week
    - [ ] Monitor stability
    - [ ] Gather feedback
    - [ ] Address any issues

### Phase 7: Production Planning (Week 4)

20. **Production preparation**
    - [ ] Document production deployment process
    - [ ] Create production runbook
    - [ ] Set up production monitoring
    - [ ] Configure production alerts
    - [ ] Schedule production deployment window

21. **Pre-production checklist**
    - [ ] All tests passing
    - [ ] Security scans clean
    - [ ] Performance benchmarks met
    - [ ] Staging deployed successfully
    - [ ] Team trained and ready
    - [ ] Rollback plan documented
    - [ ] Communication plan ready
    - [ ] Stakeholders notified

22. **Production deployment** (When ready)
    - [ ] Follow production runbook
    - [ ] Monitor deployment closely
    - [ ] Verify all health checks
    - [ ] Run smoke tests
    - [ ] Monitor for 24 hours
    - [ ] Document any issues

## Post-Implementation

### Week 1 After Production

- [ ] Daily check-ins on deployment status
- [ ] Monitor all metrics
- [ ] Address any issues immediately
- [ ] Collect team feedback
- [ ] Document lessons learned

### Month 1 After Production

- [ ] Weekly metrics review
- [ ] Identify optimization opportunities
- [ ] Plan improvements
- [ ] Update documentation
- [ ] Share successes with organization

### Ongoing

- [ ] Monthly metrics review
- [ ] Quarterly process improvement
- [ ] Keep documentation updated
- [ ] Stay current with best practices
- [ ] Continuous learning and improvement

## Success Criteria

### Must Have (Blocking)
- [ ] All workflows run without syntax errors
- [ ] Pre-deployment gates work correctly
- [ ] Deployments complete successfully
- [ ] Automatic rollback works
- [ ] Health checks pass
- [ ] Security scans run
- [ ] No critical vulnerabilities deployed

### Should Have (Important)
- [ ] Deployment time < 25 minutes
- [ ] Success rate > 90%
- [ ] Terraform CI validates all changes
- [ ] Notifications sent to Slack
- [ ] Rollback time < 15 minutes
- [ ] Clear error messages

### Nice to Have (Optional)
- [ ] Cost estimation on PRs
- [ ] Performance benchmarks
- [ ] Custom metrics dashboard
- [ ] Automated changelog
- [ ] Deployment analytics

## Rollback Plan

If critical issues are found:

1. **Immediate Actions**
   - [ ] Stop all deployments
   - [ ] Notify team via Slack
   - [ ] Document the issue

2. **Assessment**
   - [ ] Identify root cause
   - [ ] Determine severity
   - [ ] Decide on fix vs rollback

3. **Temporary Fix**
   - [ ] Disable problematic workflow
   - [ ] Revert to previous version
   - [ ] Use manual deployment if needed

4. **Resolution**
   - [ ] Fix the issue
   - [ ] Test thoroughly
   - [ ] Re-enable workflow
   - [ ] Monitor closely

## Contacts & Support

**DevOps Lead:** [Name]
**Infrastructure Team:** #infrastructure (Slack)
**On-Call Engineer:** Check PagerDuty
**Emergency Contact:** [Phone/Email]

## Notes & Observations

Use this section to track issues, ideas, and feedback during implementation:

```
Date | Issue/Observation | Resolution | Follow-up
-----|-------------------|------------|----------
     |                   |            |
     |                   |            |
     |                   |            |
```

---

**Checklist Version:** 1.0
**Last Updated:** 2025-12-15
**Next Review:** After production deployment

Remember: It's okay to slow down and test thoroughly. Quality over speed!
