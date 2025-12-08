# CI/CD Pipeline Setup Checklist

Use this checklist to configure and verify the CI/CD pipeline for the Job-Apply-Platform.

## Prerequisites

### Azure Resources
- [ ] Azure subscription is active
- [ ] Azure Container Registry created (`jobpilotacr.azurecr.io`)
- [ ] AKS cluster for staging created (`jobpilot-staging-aks`)
- [ ] AKS cluster for production created (`jobpilot-prod-aks`)
- [ ] Resource groups created
  - [ ] `jobpilot-staging-rg`
  - [ ] `jobpilot-prod-rg`
- [ ] Service principal created for GitHub Actions
- [ ] Namespace `jobpilot` created in both AKS clusters

### GitHub Repository
- [ ] Repository access configured
- [ ] Branch protection rules set for `main` and `develop`
- [ ] Team members have appropriate permissions

## Step 1: Configure GitHub Secrets

### Required Secrets (GitHub Settings → Secrets and variables → Actions)

#### Azure Secrets
- [ ] `AZURE_CREDENTIALS`
  ```bash
  az ad sp create-for-rbac --name "github-actions-jobpilot" \
    --role contributor \
    --scopes /subscriptions/{subscription-id}/resourceGroups/jobpilot-staging-rg \
    --scopes /subscriptions/{subscription-id}/resourceGroups/jobpilot-prod-rg \
    --sdk-auth
  ```
  Copy the JSON output to this secret

- [ ] `ACR_USERNAME`
  ```bash
  az acr credential show --name jobpilotacr --query username -o tsv
  ```

- [ ] `ACR_PASSWORD`
  ```bash
  az acr credential show --name jobpilotacr --query passwords[0].value -o tsv
  ```

#### Third-Party Service Secrets
- [ ] `SLACK_WEBHOOK_URL`
  1. Go to https://api.slack.com/apps
  2. Create new app or select existing
  3. Enable Incoming Webhooks
  4. Create webhook for #deployments channel
  5. Copy webhook URL

- [ ] `SNYK_TOKEN` (Optional but recommended)
  1. Sign up at https://snyk.io
  2. Go to Account Settings → API Token
  3. Copy token

- [ ] `CODECOV_TOKEN` (Optional but recommended)
  1. Sign up at https://codecov.io
  2. Add your repository
  3. Copy upload token

#### Test Secrets (Optional)
- [ ] `OPENAI_API_KEY_TEST` - For AI service testing
- [ ] `TEST_USER_EMAIL` - For E2E testing
- [ ] `TEST_USER_PASSWORD` - For E2E testing

## Step 2: Configure GitHub Environments

### Environment: preview
- [ ] Create environment named `preview`
- [ ] No protection rules needed
- [ ] Set environment URL: `https://preview-{pr-number}.jobpilot.ai` (optional)

### Environment: staging
- [ ] Create environment named `staging`
- [ ] No protection rules (auto-deploy)
- [ ] Set environment URL: `https://staging.jobpilot.ai`
- [ ] Add environment secrets if needed

### Environment: production
- [ ] Create environment named `production`
- [ ] Configure protection rules:
  - [ ] Required reviewers (add DevOps team members)
  - [ ] Wait timer: 5 minutes
  - [ ] Allowed branches: `main` only
- [ ] Set environment URL: `https://jobpilot.ai`
- [ ] Add environment-specific secrets if needed

### Environment: production-rollback
- [ ] Create environment named `production-rollback`
- [ ] Configure protection rules:
  - [ ] Required reviewers (add DevOps lead)
  - [ ] Wait timer: 0 minutes
- [ ] Used only for emergency rollbacks

## Step 3: Configure Kubernetes

### Staging Cluster

```bash
# Connect to staging cluster
az aks get-credentials \
  --resource-group jobpilot-staging-rg \
  --name jobpilot-staging-aks

# Create namespace
kubectl create namespace jobpilot

# Create image pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=jobpilotacr.azurecr.io \
  --docker-username=$(az acr credential show --name jobpilotacr --query username -o tsv) \
  --docker-password=$(az acr credential show --name jobpilotacr --query passwords[0].value -o tsv) \
  -n jobpilot
```

- [ ] Namespace created
- [ ] Image pull secret created
- [ ] All service deployments created
- [ ] All services created
- [ ] Ingress configured

### Production Cluster

```bash
# Connect to production cluster
az aks get-credentials \
  --resource-group jobpilot-prod-rg \
  --name jobpilot-prod-aks

# Create namespace
kubectl create namespace jobpilot

# Create image pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=jobpilotacr.azurecr.io \
  --docker-username=$(az acr credential show --name jobpilotacr --query username -o tsv) \
  --docker-password=$(az acr credential show --name jobpilotacr --query passwords[0].value -o tsv) \
  -n jobpilot
```

- [ ] Namespace created
- [ ] Image pull secret created
- [ ] Blue deployment for web created
- [ ] Green deployment for web created
- [ ] Web service created (with selector for blue/green)
- [ ] All backend service deployments created
- [ ] All backend services created
- [ ] Ingress configured

## Step 4: Configure Slack

- [ ] Create #deployments channel
- [ ] Invite team members
- [ ] Add incoming webhook integration
- [ ] Test webhook with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test from CI/CD setup"}' \
    YOUR_WEBHOOK_URL
  ```

## Step 5: Configure External Services

### Codecov (Optional)
- [ ] Sign up at https://codecov.io
- [ ] Connect GitHub repository
- [ ] Copy upload token to `CODECOV_TOKEN` secret
- [ ] Configure coverage threshold in codecov.yml

### Snyk (Optional)
- [ ] Sign up at https://snyk.io
- [ ] Connect GitHub repository
- [ ] Copy API token to `SNYK_TOKEN` secret
- [ ] Configure organization settings

## Step 6: Test Workflows

### Test CI Pipeline
```bash
# Create test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "test: CI pipeline"
git push origin test/ci-pipeline

# Create PR
gh pr create --title "Test CI Pipeline" --body "Testing CI/CD setup"
```

- [ ] Lint & Type Check job passes
- [ ] Unit tests pass for all services
- [ ] E2E tests pass
- [ ] Security scans complete
- [ ] Coverage meets 80% threshold
- [ ] Artifacts uploaded successfully

### Test Staging Deployment
```bash
# Merge test PR to main
gh pr merge --merge

# Or push directly to main
git checkout main
git merge test/ci-pipeline
git push origin main
```

- [ ] Build & Push job completes
- [ ] Docker images pushed to ACR
- [ ] Staging deployment succeeds
- [ ] Smoke tests pass
- [ ] Slack notification received
- [ ] Application accessible at staging URL

### Test Production Deployment
```bash
# Create release tag
git tag -a v0.1.0 -m "Test release v0.1.0"
git push origin v0.1.0
```

- [ ] Workflow triggered
- [ ] Approval request sent
- [ ] Approve deployment in GitHub
- [ ] Production deployment succeeds
- [ ] Blue/Green switch works
- [ ] Smoke tests pass
- [ ] Slack notification received
- [ ] Application accessible at production URL

### Test Integration Tests
```bash
# Manual trigger
gh workflow run integration-tests.yml
```

- [ ] All integration test suites pass
- [ ] Test results uploaded
- [ ] Slack notification received

### Test Rollback
```bash
# Trigger rollback workflow
gh workflow run rollback.yml \
  -f environment=staging \
  -f service=all \
  -f reason="Testing rollback procedure"
```

- [ ] Rollback workflow runs
- [ ] Backup created
- [ ] Services rolled back
- [ ] Smoke tests pass
- [ ] Slack notification received

## Step 7: Configure Branch Protection

### Main Branch
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass:
  - [ ] Lint & Type Check
  - [ ] Test Web App
  - [ ] Test Services (all matrix jobs)
  - [ ] Security Scan
- [ ] Require branches to be up to date
- [ ] Require conversation resolution
- [ ] Do not allow bypassing (except for admins)

### Develop Branch
- [ ] Require pull request reviews before merging
- [ ] Require status checks to pass:
  - [ ] Lint & Type Check
  - [ ] Test Web App
  - [ ] Test Services (all matrix jobs)
- [ ] Allow merge commits

## Step 8: Documentation Review

- [ ] Review CI/CD Pipeline Documentation (`docs/deployment/cicd-pipeline.md`)
- [ ] Review Deployment Guide (`docs/deployment/DEPLOYMENT_GUIDE.md`)
- [ ] Review Workflow README (`.github/workflows/README.md`)
- [ ] Share documentation with team
- [ ] Conduct team walkthrough

## Step 9: Monitoring Setup

### Azure Monitor
- [ ] Enable Container Insights for AKS
- [ ] Create dashboard for key metrics
- [ ] Set up alert rules:
  - [ ] Pod failures
  - [ ] High CPU/Memory
  - [ ] Deployment failures
  - [ ] Node issues

### GitHub
- [ ] Enable workflow notifications
- [ ] Configure email alerts for failures
- [ ] Set up status badge in README

### Slack
- [ ] Test all notification types
- [ ] Configure alert keywords
- [ ] Set up notification preferences

## Step 10: Team Training

- [ ] Schedule training session
- [ ] Walk through deployment process
- [ ] Practice rollback procedure
- [ ] Review troubleshooting guide
- [ ] Q&A session
- [ ] Document team feedback

## Step 11: Establish On-Call Rotation

- [ ] Define on-call schedule
- [ ] Set up PagerDuty or similar (optional)
- [ ] Document escalation path
- [ ] Create incident response runbook
- [ ] Schedule practice incident

## Step 12: Final Verification

### CI/CD Pipeline
- [ ] All workflows have run successfully at least once
- [ ] No failing workflows in history
- [ ] All secrets configured correctly
- [ ] All environments set up properly

### Deployments
- [ ] Staging deployment working
- [ ] Production deployment working
- [ ] Rollback tested successfully
- [ ] Smoke tests passing

### Security
- [ ] Security scans running
- [ ] No critical vulnerabilities
- [ ] SBOM generation working
- [ ] Image signing configured (optional)

### Monitoring
- [ ] Slack notifications working
- [ ] Azure Monitor configured
- [ ] Alerts tested
- [ ] Team has access to dashboards

### Documentation
- [ ] All documentation complete
- [ ] Team has reviewed docs
- [ ] Runbooks accessible
- [ ] Contact information updated

## Post-Setup Tasks

### Week 1
- [ ] Monitor first production deployments closely
- [ ] Collect team feedback
- [ ] Address any issues discovered
- [ ] Update documentation based on feedback

### Week 2
- [ ] Review pipeline metrics
- [ ] Optimize slow jobs if needed
- [ ] Conduct first incident drill
- [ ] Update on-call procedures

### Month 1
- [ ] Review deployment frequency
- [ ] Analyze failure rates
- [ ] Optimize workflows based on data
- [ ] Plan improvements

### Ongoing
- [ ] Monthly pipeline review
- [ ] Quarterly security audit
- [ ] Regular dependency updates
- [ ] Continuous documentation updates

## Troubleshooting Common Setup Issues

### Issue: Workflows not triggering
**Check:**
- [ ] Workflow files are in `.github/workflows/`
- [ ] YAML syntax is valid
- [ ] Branch names match triggers
- [ ] Repository permissions are correct

### Issue: Deployment failures
**Check:**
- [ ] Azure credentials are valid
- [ ] AKS cluster is accessible
- [ ] ACR credentials are correct
- [ ] Kubernetes resources exist

### Issue: Test failures
**Check:**
- [ ] Database connectivity
- [ ] Redis connectivity
- [ ] Environment variables
- [ ] Test dependencies installed

### Issue: Security scan failures
**Check:**
- [ ] Snyk token is valid
- [ ] Permissions are correct
- [ ] Critical vulnerabilities exist
- [ ] Scan configuration

## Support Contacts

- **DevOps Lead**: _________________
- **Backend Lead**: _________________
- **Frontend Lead**: _________________
- **Security Lead**: _________________

## Sign-off

- [ ] DevOps Lead reviewed and approved
- [ ] Team lead reviewed and approved
- [ ] All setup tasks completed
- [ ] Pipeline is production-ready

**Completed By**: _________________ **Date**: _________________

**Approved By**: _________________ **Date**: _________________

---

## Next Steps After Setup

1. Schedule regular deployment windows
2. Establish deployment approval process
3. Create incident response plan
4. Set up regular pipeline reviews
5. Plan for continuous improvement

**Setup Status**: [ ] Complete

**Notes**:
_______________________________________
_______________________________________
_______________________________________
