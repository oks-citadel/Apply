# Deployment Quick Reference Card

## TL;DR - Deployment Commands

### Deploy to Dev (Automatic)
```bash
git push origin develop
# ✅ Build runs automatically
# ✅ Dev deploys automatically
# ❌ No approval needed
```

### Deploy to Staging (Manual + Approval)
```bash
# 1. Get image tag from dev
IMAGE_TAG="1.0.245-a3f8c92d"

# 2. GitHub UI:
#    Actions → "CD - Deploy to Staging" → Run workflow
#    Input: Image tag = 1.0.245-a3f8c92d

# 3. Approve deployment (1-2 reviewers)
```

### Deploy to Production (Manual + Multi-Approval)
```bash
# 1. Get image tag from staging
IMAGE_TAG="1.0.245-a3f8c92d"  # Same as staging

# 2. GitHub UI:
#    Actions → "CD - Deploy to Production" → Run workflow
#    Input: Image tag = 1.0.245-a3f8c92d

# 3. Wait for 2+ approvals + 5 minute timer
```

---

## Workflow Architecture

```
┌──────────────────┐
│  Push to develop │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Build & Security Scan                    │
│ • Build all images                       │
│ • Capture digests (immutable SHA256)     │
│ • Security scan (fail on HIGH/CRITICAL)  │
│ • Generate deployment manifest           │
└────────┬─────────────────────────────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌────────────┐
    │   DEV   │      │ STAGING  │      │    PROD    │
    │ Auto ✅ │      │ Manual ⚠️│      │ Manual 🔒  │
    │ 0 approvals    │ 1-2 approvals   │ 2+ approvals│
    └─────────┘      └──────────┘      └────────────┘
```

---

## Key Principles

### ✅ Build Once, Promote Everywhere
- Images built **once** in `build-and-scan.yml`
- **Same image** promoted to dev → staging → prod
- **Digest-based** references (immutable)

### ✅ Security Gate Enforcement
- **HIGH/CRITICAL** vulnerabilities = pipeline FAILS
- **SBOMs** generated for all images
- **Digest-only** deployments to production

### ✅ OIDC Authentication
- **No static credentials** in GitHub
- **Temporary tokens** via Azure OIDC
- **Auto-rotation** built-in

---

## Environment Configuration

| Environment | Branch | Approval | Wait Time | Auto-Deploy | Digest-Only |
|-------------|--------|----------|-----------|-------------|-------------|
| Dev         | develop| 0        | 0 min     | ✅ Yes      | ✅ Yes      |
| Staging     | manual | 1-2      | 0 min     | ❌ No       | ✅ Yes      |
| Production  | manual | 2+       | 5 min     | ❌ No       | ✅ YES      |

---

## GitHub Secrets Required

### OIDC Secrets (Repository-level)
```
AZURE_CLIENT_ID          # App Registration Client ID
AZURE_TENANT_ID          # Azure AD Tenant ID
AZURE_SUBSCRIPTION_ID    # Azure Subscription ID
```

### Application Secrets (Environment-specific)
```
DATABASE_URL_DEV         # Dev database connection
DATABASE_URL_STAGING     # Staging database connection
DATABASE_URL_PROD        # Production database connection

REDIS_URL_DEV
REDIS_URL_STAGING
REDIS_URL_PROD

STRIPE_SECRET_KEY_DEV
STRIPE_SECRET_KEY_STAGING
STRIPE_SECRET_KEY_PROD

... (other environment-specific secrets)
```

---

## Common Operations

### Get Image Tag from Successful Build
```bash
# Method 1: GitHub UI
# Go to: Actions → Build and Security Scan → Latest run
# Check: Summary → "Build and Security Scan Summary"
# Copy: Image tag (e.g., 1.0.245-a3f8c92d)

# Method 2: Download deployment manifest
gh run list --workflow="Build and Security Scan" --limit 1
gh run download <run-id>
jq -r '.image_tag' deployment-manifest-*.json
```

### Verify Deployment
```bash
# Check namespace
kubectl get deployments -n applyforus-dev      # Dev
kubectl get deployments -n applyforus-staging  # Staging
kubectl get deployments -n applyforus          # Prod

# Check pod status
kubectl get pods -n applyforus

# Check image references (should have @sha256:)
kubectl get deployment web -n applyforus -o json | \
  jq -r '.spec.template.spec.containers[].image'

# Expected: applyforusacr.azurecr.io/applyai-web@sha256:abc123...
# ❌ NOT:   applyforusacr.azurecr.io/applyai-web:latest
```

### Check Deployment Metadata
```bash
kubectl get deployment web -n applyforus -o json | \
  jq -r '.metadata.annotations |
  with_entries(select(.key | startswith("deploy.applyforus.com")))'

# Expected output:
# {
#   "deploy.applyforus.com/image-digest": "sha256:abc123...",
#   "deploy.applyforus.com/deployed-at": "2025-12-15T14:30:00Z",
#   "deploy.applyforus.com/deployed-by": "username",
#   "deploy.applyforus.com/version": "1.0.245",
#   "deploy.applyforus.com/environment": "production"
# }
```

### Rollback to Previous Version
```bash
# Method 1: Kubernetes rollout undo
kubectl rollout undo deployment/web -n applyforus
kubectl rollout status deployment/web -n applyforus

# Method 2: Deploy previous manifest
# 1. Find previous deployment manifest
# 2. Trigger deployment with old image tag

# Method 3: Restore from backup artifact
# 1. Download backup artifact from GitHub Actions
# 2. Apply backup YAML files with kubectl
```

---

## Troubleshooting

### Build Failed: "Security scan failed"
```bash
# Cause: HIGH/CRITICAL vulnerabilities detected

# Solution:
# 1. Check Security tab for details:
#    GitHub → Security → Code scanning alerts → Trivy

# 2. Fix vulnerabilities in code/dependencies

# 3. Re-run build workflow
```

### Deployment Failed: "No deployment manifest found"
```bash
# Cause: Build workflow didn't complete successfully

# Solution:
# 1. Check build workflow status
# 2. Verify artifact exists in successful run
# 3. Re-run build workflow if needed
```

### Deployment Failed: "OIDC authentication failed"
```bash
# Cause: Federated credentials not configured correctly

# Solution:
# 1. Verify AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID
# 2. Check federated credentials in Azure AD:
#    az ad app federated-credential list --id <app-id>
# 3. Ensure subject matches:
#    - Branch: repo:oks-citadel/Apply:ref:refs/heads/<branch>
#    - Environment: repo:oks-citadel/Apply:environment:<env>
```

### Deployment Blocked: "Waiting for approval"
```bash
# Cause: Approval required but reviewers haven't approved

# Solution:
# 1. Notify reviewers via Slack/email
# 2. Ensure 2+ reviewers for production
# 3. Check Environment settings if reviewers not configured:
#    Settings → Environments → prod → Required reviewers
```

---

## Security Checklists

### Pre-Deployment Security Checklist
- [ ] ✅ Build passed security scans (no HIGH/CRITICAL)
- [ ] ✅ Deployment manifest exists
- [ ] ✅ SBOMs generated for all services
- [ ] ✅ Image digests captured
- [ ] ✅ Staging deployment successful (for prod)
- [ ] ✅ Required approvals obtained

### Post-Deployment Security Checklist
- [ ] ✅ All pods running healthy
- [ ] ✅ Images use digest references (@sha256:)
- [ ] ✅ Deployment annotations include metadata
- [ ] ✅ Health checks passing
- [ ] ✅ Application functionality verified
- [ ] ✅ Monitoring/alerts active

---

## Emergency Procedures

### Emergency Production Hotfix
```bash
# 1. Create hotfix branch
git checkout main
git checkout -b hotfix/critical-security-fix

# 2. Make changes and push
git commit -m "hotfix: Critical security patch"
git push origin hotfix/critical-security-fix

# 3. Merge to main (via PR or direct push in emergency)
git checkout main
git merge hotfix/critical-security-fix
git push origin main

# 4. Tag release
git tag v1.0.1
git push origin v1.0.1

# 5. Wait for build to complete

# 6. Deploy to production (emergency flag)
# GitHub UI:
#   Actions → CD - Deploy to Production → Run workflow
#   Image tag: 1.0.246-xyz123
#   Skip staging check: ✅ (EMERGENCY ONLY)
#   Emergency justification: "Critical security patch for CVE-2025-XXXX"

# 7. Still requires 2+ approvals + 5 minute wait
```

### Emergency Rollback
```bash
# Option 1: Quick rollback (Kubernetes)
kubectl rollout undo deployment/<service> -n applyforus
kubectl rollout status deployment/<service> -n applyforus

# Option 2: Deploy previous version
# Use image tag from previous successful deployment

# Option 3: Restore from backup
# Download backup artifact from GitHub Actions
# Apply backup YAML files
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
- **Deployment frequency**: Deployments per day/week
- **Lead time**: Commit to production time
- **Change failure rate**: % of deployments requiring rollback
- **MTTR**: Mean time to recovery
- **Security findings**: HIGH/CRITICAL vulnerabilities blocked

### Where to Find Logs
- **Build logs**: Actions → Build and Security Scan → Workflow run
- **Deployment logs**: Actions → CD - Deploy to <env> → Workflow run
- **Security scans**: Security → Code scanning alerts
- **Pod logs**: `kubectl logs <pod> -n applyforus`
- **Azure AD logs**: Azure Portal → Azure AD → Sign-in logs

---

## Quick Links

### GitHub
- **Actions**: https://github.com/oks-citadel/Apply/actions
- **Security**: https://github.com/oks-citadel/Apply/security
- **Environments**: https://github.com/oks-citadel/Apply/settings/environments

### Azure
- **ACR**: https://portal.azure.com → Container registries → applyforusacr
- **AKS Prod**: https://portal.azure.com → Kubernetes services → applyforus-prod-aks
- **AKS Staging**: https://portal.azure.com → Kubernetes services → applyforus-staging-aks
- **Key Vault**: https://portal.azure.com → Key vaults → applyforus-kv

### Documentation
- **OIDC Setup**: `docs/AZURE_OIDC_SETUP.md`
- **Deployment Guide**: `docs/DIGEST_BASED_DEPLOYMENT_GUIDE.md`
- **Implementation Checklist**: `CICD_IMPLEMENTATION_CHECKLIST.md`

---

## Support

### Primary Contacts
| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | [Name] | [Email/Slack] |
| Security Lead | [Name] | [Email/Slack] |
| Platform Owner | [Name] | [Email/Slack] |

### Escalation Path
1. **L1**: DevOps team member
2. **L2**: DevOps Lead
3. **L3**: Engineering Manager + Security Lead
4. **L4**: CTO

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2025-12-15 | Digest-based deployment, OIDC auth, approval gates |
| 1.0.0 | 2024-XX-XX | Original tag-based deployment |

---

**Keep this reference card handy for quick deployment operations!**
