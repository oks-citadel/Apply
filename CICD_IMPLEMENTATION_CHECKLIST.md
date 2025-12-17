# CI/CD Hardening Implementation Checklist

## Pre-Implementation Checklist

### Prerequisites
- [ ] Azure subscription with Owner/Contributor access
- [ ] GitHub repository admin access: `oks-citadel/Apply`
- [ ] Azure CLI installed: `az --version`
- [ ] GitHub CLI installed (optional): `gh --version`
- [ ] kubectl configured for AKS clusters

### Backup Current Configuration
- [ ] Export current GitHub secrets
- [ ] Document current deployment process
- [ ] Backup existing workflow files
- [ ] Test rollback procedures

## Phase 1: Azure OIDC Setup

### Azure AD Application
- [ ] Create Azure AD application: `applyforus-github-actions`
- [ ] Record Application (Client) ID
- [ ] Record Tenant ID
- [ ] Record Subscription ID
- [ ] Create Service Principal

### Federated Credentials
- [ ] Configure credential for `main` branch (production)
- [ ] Configure credential for `develop` branch (dev)
- [ ] Configure credential for `prod` environment
- [ ] Configure credential for `staging` environment
- [ ] Configure credential for `dev` environment
- [ ] Verify all 5 federated credentials created

### Azure Role Assignments
- [ ] Assign Contributor role (subscription level)
- [ ] Assign User Access Administrator role (subscription level)
- [ ] Assign AcrPush role (ACR: applyforusacr)
- [ ] Assign AcrPull role (ACR: applyforusacr)
- [ ] Assign AKS Cluster Admin role (production AKS)
- [ ] Assign AKS Cluster Admin role (staging AKS)
- [ ] Assign Key Vault Secrets User role (Key Vault)

### GitHub Secrets Configuration
- [ ] Add `AZURE_CLIENT_ID` secret
- [ ] Add `AZURE_TENANT_ID` secret
- [ ] Add `AZURE_SUBSCRIPTION_ID` secret
- [ ] Verify secrets are accessible in all environments

## Phase 2: GitHub Environments Setup

### Dev Environment
- [ ] Create environment: `dev`
- [ ] Configure: No approval required
- [ ] Configure: No wait timer
- [ ] Verify environment protection rules

### Staging Environment
- [ ] Create environment: `staging`
- [ ] Configure: 1-2 required reviewers
- [ ] Add reviewer: [Name 1]
- [ ] Add reviewer: [Name 2]
- [ ] Configure: 0 minute wait timer
- [ ] Allow self-review: Yes
- [ ] Verify environment protection rules

### Production Environment
- [ ] Create environment: `prod`
- [ ] Configure: 2+ required reviewers
- [ ] Add reviewer: [Senior Engineer 1]
- [ ] Add reviewer: [Senior Engineer 2]
- [ ] Add reviewer: [Senior Engineer 3]
- [ ] Configure: 5 minute wait timer
- [ ] Enable: Prevent self-review
- [ ] Limit deployments to: `main` branch
- [ ] Verify environment protection rules

## Phase 3: Workflow Deployment

### Backup Old Workflows
```bash
mkdir -p .github/workflows-backup
cp .github/workflows/build-images.yml .github/workflows-backup/
cp .github/workflows/cd-dev.yml .github/workflows-backup/
cp .github/workflows/cd-staging.yml .github/workflows-backup/
cp .github/workflows/cd-prod.yml .github/workflows-backup/
git add .github/workflows-backup/
git commit -m "backup: Archive old workflow files before hardening"
```

### Deploy New Workflows
- [ ] Review `build-and-scan.yml` (already updated)
- [ ] Review `cd-dev.yml` (already updated)
- [ ] Rename `cd-staging-hardened.yml` → `cd-staging.yml`
- [ ] Rename `cd-prod-hardened.yml` → `cd-prod.yml`
- [ ] Commit workflow changes to feature branch
- [ ] Create Pull Request
- [ ] Review PR for correctness
- [ ] Merge to `develop` branch

### Verify Workflows Appear in GitHub
- [ ] Navigate to: Actions tab
- [ ] Verify workflow: `Build and Security Scan`
- [ ] Verify workflow: `CD - Deploy to Development`
- [ ] Verify workflow: `CD - Deploy to Staging`
- [ ] Verify workflow: `CD - Deploy to Production`

## Phase 4: Testing & Validation

### Test Build Workflow
- [ ] Push commit to `develop` branch
- [ ] Monitor: `Build and Security Scan` workflow
- [ ] Verify: OIDC authentication succeeds
- [ ] Verify: Images build successfully
- [ ] Verify: Security scans complete
- [ ] Verify: Digests captured in artifacts
- [ ] Verify: Deployment manifest created
- [ ] Download: deployment-manifest artifact

### Test Dev Deployment
- [ ] Verify: `CD - Deploy to Development` auto-triggers
- [ ] Monitor: Deployment workflow
- [ ] Verify: OIDC authentication succeeds
- [ ] Verify: Manifest downloaded correctly
- [ ] Verify: Digest-based deployment succeeds
- [ ] Verify: Health checks pass
- [ ] Verify: Pods running in `applyforus-dev` namespace
- [ ] Test: Application functionality in dev

### Test Staging Deployment
- [ ] Navigate to: Actions → `CD - Deploy to Staging`
- [ ] Click: Run workflow
- [ ] Input: Image tag from successful dev build
- [ ] Submit: Workflow
- [ ] Verify: Approval request appears
- [ ] Approve: Deployment (as reviewer)
- [ ] Monitor: Deployment workflow
- [ ] Verify: Backup created
- [ ] Verify: Digest-based deployment succeeds
- [ ] Verify: Smoke tests pass
- [ ] Test: Application functionality in staging

### Test Production Deployment
- [ ] Navigate to: Actions → `CD - Deploy to Production`
- [ ] Click: Run workflow
- [ ] Input: Image tag from successful staging deployment
- [ ] Submit: Workflow
- [ ] Verify: Staging health check passes
- [ ] Verify: Security gate validation passes
- [ ] Verify: Approval requests sent to 2+ reviewers
- [ ] Wait: 5-minute cooling-off period
- [ ] Approve: Deployment (as 2+ reviewers)
- [ ] Monitor: Deployment workflow
- [ ] Verify: Production backup created
- [ ] Verify: DIGEST-ONLY deployment (no tags)
- [ ] Verify: All services deployed successfully
- [ ] Verify: Smoke tests pass
- [ ] Verify: 10-minute monitoring completes
- [ ] Test: Application functionality in production

## Phase 5: Security Validation

### Verify OIDC Authentication
- [ ] Check workflow logs for OIDC login success
- [ ] Verify no static credentials in logs
- [ ] Test ACR authentication without username/password
- [ ] Verify AKS access without client secret

### Verify Digest-Based Deployment
```bash
# Production verification
kubectl get deployments -n applyforus -o json | \
  jq -r '.items[].spec.template.spec.containers[].image'

# All images should have @sha256: format
```
- [ ] All production images use digest references
- [ ] No tag-based references (`:latest`, `:v1.0.0`) in production
- [ ] Deployment annotations include digest metadata

### Verify Security Scanning
- [ ] Check: GitHub Security tab for Trivy results
- [ ] Verify: Pipelines fail on HIGH/CRITICAL vulnerabilities
- [ ] Download: SBOM artifacts for all services
- [ ] Verify: SBOM format is valid CycloneDX JSON

### Verify Approval Gates
- [ ] Dev: No approval required (auto-deploy)
- [ ] Staging: 1-2 approvals required
- [ ] Production: 2+ approvals required
- [ ] Production: 5-minute wait timer enforced
- [ ] Production: Self-review blocked

## Phase 6: Cleanup & Documentation

### Remove Old Secrets
**⚠️ Only after validating OIDC works!**
```bash
# Remove deprecated secrets
gh secret delete ACR_USERNAME
gh secret delete ACR_PASSWORD
gh secret delete AZURE_CREDENTIALS

# Or via GitHub UI:
# Settings → Secrets and variables → Actions → Delete old secrets
```
- [ ] Confirm OIDC works in all environments first
- [ ] Delete `ACR_USERNAME` secret
- [ ] Delete `ACR_PASSWORD` secret
- [ ] Delete `AZURE_CREDENTIALS` secret
- [ ] Document secret removal date

### Archive Old Workflows
- [ ] Disable old workflow: `build-images.yml`
- [ ] Archive to: `.github/workflows-archive/`
- [ ] Commit archive changes
- [ ] Update workflow documentation

### Team Training
- [ ] Share `AZURE_OIDC_SETUP.md` with team
- [ ] Share `DIGEST_BASED_DEPLOYMENT_GUIDE.md` with team
- [ ] Conduct walkthrough of new deployment process
- [ ] Document common troubleshooting scenarios
- [ ] Update runbooks with new procedures

### Update Documentation
- [ ] Update README with new deployment instructions
- [ ] Update CONTRIBUTING with new CI/CD process
- [ ] Create deployment runbook
- [ ] Document rollback procedures
- [ ] Create incident response guide

## Phase 7: Monitoring & Maintenance

### Setup Monitoring
- [ ] Configure Azure AD sign-in logs monitoring
- [ ] Setup alerts for failed OIDC authentications
- [ ] Monitor GitHub Actions usage/minutes
- [ ] Setup alerts for failed deployments
- [ ] Configure Application Insights for runtime monitoring

### Regular Maintenance
- [ ] Weekly: Review security scan results
- [ ] Weekly: Check for pending Dependabot PRs
- [ ] Monthly: Review and rotate non-OIDC secrets
- [ ] Monthly: Test rollback procedures
- [ ] Quarterly: Review and update approval lists
- [ ] Quarterly: Audit OIDC federated credentials

## Rollback Plan

### If Issues Arise During Implementation

#### Rollback OIDC
```bash
# 1. Restore old secrets
gh secret set ACR_USERNAME --body "<old-username>"
gh secret set ACR_PASSWORD --body "<old-password>"
gh secret set AZURE_CREDENTIALS --body "<old-json>"

# 2. Restore old workflow files
git checkout main -- .github/workflows-backup/
cp .github/workflows-backup/* .github/workflows/
git add .github/workflows/
git commit -m "rollback: Restore old workflow files"
git push
```

#### Rollback Workflows
```bash
# Revert to previous workflow version
git revert <commit-sha>
git push

# Or restore from backup
git restore --source=<commit-before-changes> .github/workflows/
```

### Emergency Procedures
- [ ] Document primary contact for OIDC issues: [Name]
- [ ] Document secondary contact: [Name]
- [ ] Document Azure admin contact: [Name]
- [ ] Document escalation path
- [ ] Test emergency rollback procedure

## Success Criteria

### Technical Validation
- [x] All workflows use OIDC (no static Azure credentials)
- [x] Images built once and promoted by digest
- [x] Security scans fail pipelines on HIGH/CRITICAL vulnerabilities
- [x] Dev deploys automatically (no approval)
- [x] Staging requires 1-2 approvals
- [x] Production requires 2+ approvals with 5-minute wait
- [x] All production deployments use immutable digest references
- [x] SBOMs generated for all images
- [x] Deployment manifests archived (90+ days for prod)

### Operational Validation
- [ ] Team can deploy to dev without manual intervention
- [ ] Team can promote to staging with approval
- [ ] Team can deploy to production with multi-approval
- [ ] Rollback procedures tested and documented
- [ ] Security alerts reviewed and triaged
- [ ] Deployment process documented and understood

### Security Validation
- [ ] No static credentials in GitHub secrets (except DB, API keys)
- [ ] All images scanned before deployment
- [ ] Audit trail complete for all deployments
- [ ] Approval gates enforced for production
- [ ] Digest-only deployments in production verified

## Post-Implementation Review

### Review Meeting
- [ ] Schedule: Post-implementation review meeting
- [ ] Attendees: DevOps team, Security team, Developers
- [ ] Review: What went well
- [ ] Review: What could be improved
- [ ] Document: Lessons learned
- [ ] Update: Implementation checklist for future use

### Metrics to Track
- [ ] Deployment frequency (before vs after)
- [ ] Mean time to deployment (MTTD)
- [ ] Change failure rate
- [ ] Mean time to recovery (MTTR)
- [ ] Security vulnerabilities detected/blocked
- [ ] OIDC authentication success rate

## Quick Reference

### Key Commands

**Trigger Dev Deployment:**
```bash
git push origin develop
# Auto-deploys after successful build
```

**Trigger Staging Deployment:**
```bash
# GitHub UI: Actions → CD - Deploy to Staging → Run workflow
# Input: Image tag from dev deployment
```

**Trigger Production Deployment:**
```bash
# GitHub UI: Actions → CD - Deploy to Production → Run workflow
# Input: Image tag from staging deployment
# Wait for: 2+ approvals + 5 minute timer
```

**Verify Deployment:**
```bash
# Check digest references
kubectl get deployments -n applyforus -o json | \
  jq -r '.items[].spec.template.spec.containers[].image'

# Check deployment metadata
kubectl get deployment <service> -n applyforus -o json | \
  jq '.metadata.annotations | with_entries(select(.key | startswith("deploy.applyforus.com")))'
```

### Support Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | [Name] | [Email/Slack] |
| Security Lead | [Name] | [Email/Slack] |
| Azure Admin | [Name] | [Email/Slack] |
| Platform Owner | [Name] | [Email/Slack] |

## Completion Sign-Off

- [ ] DevOps Lead: _____________________ Date: _____
- [ ] Security Lead: _____________________ Date: _____
- [ ] Platform Owner: _____________________ Date: _____

**CI/CD Pipeline Hardening Complete!**
