# Digest-Based Deployment Guide

## Overview

This guide documents the hardened CI/CD pipeline for the ApplyForUs platform, featuring digest-based image promotion, OIDC authentication, and environment-specific approval gates.

## Architecture

### Build Once, Promote Everywhere

```
┌─────────────────────────────────────────────────────────────────────┐
│  Build & Security Scan Workflow                                     │
│  ═══════════════════════════════════════════════════════════════   │
│                                                                      │
│  1. Build images for all services                                   │
│  2. Capture image digests (immutable SHA256)                        │
│  3. Run security scans (fail on HIGH/CRITICAL)                      │
│  4. Generate SBOMs                                                   │
│  5. Create deployment manifest with digests                          │
│  6. Store artifacts (90 days)                                        │
│                                                                      │
│  Output: deployment-manifest-<version>.json                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ├──────────────────┬──────────────────┐
                              ▼                  ▼                  ▼
                    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
                    │  DEV            │ │  STAGING        │ │  PRODUCTION     │
                    │  ═══            │ │  ═══════        │ │  ══════════     │
                    │                 │ │                 │ │                 │
                    │  Auto-deploy    │ │  Manual trigger │ │  Manual trigger │
                    │  No approval    │ │  1-2 approvals  │ │  2+ approvals   │
                    │  Digest-based   │ │  Digest-based   │ │  DIGEST-ONLY    │
                    │                 │ │                 │ │  5min wait      │
                    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Workflow Files

| Workflow | File | Purpose |
|----------|------|---------|
| Build & Scan | `build-and-scan.yml` | Build images, capture digests, security scan |
| Deploy Dev | `cd-dev.yml` | Auto-deploy to dev environment |
| Deploy Staging | `cd-staging-hardened.yml` | Manual promotion to staging with approval |
| Deploy Production | `cd-prod-hardened.yml` | Manual promotion to prod with multi-approval |

## Key Features

### 1. Immutable Image References

**Before (tag-based):**
```yaml
image: applyforusacr.azurecr.io/applyai-web:latest  # ❌ Mutable
image: applyforusacr.azurecr.io/applyai-web:1.0.0   # ❌ Can be overwritten
```

**After (digest-based):**
```yaml
image: applyforusacr.azurecr.io/applyai-web@sha256:abc123...  # ✅ Immutable
```

**Benefits:**
- Cannot be tampered with
- Identical image across all environments
- Cryptographic verification
- Supply chain security

### 2. Security Gate Enforcement

**Build Stage:**
```
1. Build image
2. Run Trivy scan
3. Check for HIGH/CRITICAL vulnerabilities
   ├─ Found: ❌ FAIL pipeline (exit code 1)
   └─ None:  ✅ PASS - proceed to push
4. Push image with digest
5. Generate SBOM
```

**Deployment Stage:**
- Verify SBOM artifacts exist
- Verify digest references are valid
- Verify all images passed security scans

### 3. OIDC Authentication

**No Static Credentials Required:**
```yaml
- name: Azure Login with OIDC
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}         # App ID
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}         # Tenant ID
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}  # Subscription ID
  # No password or client secret needed!
```

**Token Flow:**
1. GitHub issues OIDC token
2. Azure AD validates token
3. Azure grants temporary access token
4. Access token expires after job completes

### 4. Environment Approval Gates

| Environment | Approval Required | Wait Timer | Can Self-Approve |
|-------------|------------------|------------|------------------|
| `dev`       | ❌ No            | 0 min      | N/A              |
| `staging`   | ✅ 1-2 reviewers | 0 min      | ✅ Yes           |
| `prod`      | ✅ 2+ reviewers  | 5 min      | ❌ No            |

## Deployment Manifest Format

```json
{
  "version": "1.0.245",
  "image_tag": "1.0.245-a3f8c92d",
  "short_sha": "a3f8c92d",
  "build_date": "2025-12-15T14:30:00Z",
  "git_ref": "refs/heads/main",
  "git_sha": "a3f8c92d1234567890abcdef",
  "images": {
    "web": {
      "digest": "sha256:abc123...",
      "image": "applyforusacr.azurecr.io/applyai-web@sha256:abc123..."
    },
    "auth-service": {
      "digest": "sha256:def456...",
      "image": "applyforusacr.azurecr.io/applyai-auth-service@sha256:def456..."
    },
    ...
  }
}
```

## Deployment Flow

### Development Environment

**Trigger:** Automatic on `develop` branch push

```bash
# Workflow: build-and-scan.yml runs on develop push
# ├─ Builds all images
# ├─ Captures digests
# ├─ Runs security scans
# └─ Creates deployment manifest

# Workflow: cd-dev.yml triggered by build completion
# ├─ Downloads deployment manifest
# ├─ Authenticates with OIDC
# ├─ Deploys using digest references
# └─ Runs health checks
```

**No manual intervention required.**

### Staging Environment

**Trigger:** Manual via GitHub Actions UI

1. Go to: Actions → `CD - Deploy to Staging`
2. Click "Run workflow"
3. Provide image tag (e.g., `1.0.245-a3f8c92d`)
4. Submit workflow
5. **Wait for approval** (1-2 reviewers)
6. Deployment proceeds with digest-based promotion

**Example:**
```bash
# GitHub Actions UI:
Image tag: 1.0.245-a3f8c92d  # ← From successful build

# Workflow:
# ├─ Validates manifest exists
# ├─ Verifies all service digests
# ├─ Waits for approval
# ├─ Creates backup
# ├─ Deploys using digests
# └─ Runs smoke tests
```

### Production Environment

**Trigger:** Manual via GitHub Actions UI (strict requirements)

1. Go to: Actions → `CD - Deploy to Production`
2. Click "Run workflow"
3. Provide image tag **from staging** (e.g., `1.0.245-a3f8c92d`)
4. Submit workflow
5. **Verify staging is healthy** (automated check)
6. **Security gate validation** (SBOMs, digests)
7. **Wait for 2+ approvals**
8. **5-minute cooling-off period**
9. Creates production backup
10. Deployment proceeds with **DIGEST-ONLY** references
11. **10-minute post-deployment monitoring**

**Emergency Deployment (bypass staging check):**
```bash
# GitHub Actions UI:
Image tag: 1.0.245-a3f8c92d
Skip staging check: ✅ true
Emergency justification: "Critical security patch for CVE-2025-XXXX"

# Still requires:
# - 2+ approvals
# - 5-minute wait
# - DIGEST-ONLY deployment
```

## Security Scan Enforcement

### Trivy Scan Configuration

**Build Workflow:**
```yaml
- name: Run Trivy scan (Fail on HIGH/CRITICAL)
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.ACR }}/${{ service }}@${{ digest }}
    format: 'table'
    severity: 'CRITICAL,HIGH'
    exit-code: '1'           # ← FAIL pipeline
    ignore-unfixed: false    # ← Include all vulnerabilities
    timeout: '10m'
```

**Pipeline Behavior:**
- ✅ **No HIGH/CRITICAL vulnerabilities**: Deployment proceeds
- ❌ **HIGH/CRITICAL found**: Pipeline fails immediately
- 📊 **Results uploaded to GitHub Security tab**
- 📦 **SBOM generated for supply chain tracking**

### Vulnerability Report Location

1. **GitHub Security Tab**: `Security` → `Code scanning alerts`
2. **Workflow Logs**: Build job → Trivy scan step
3. **SBOM Artifacts**: Download from workflow run

## Common Operations

### Deploy to Dev (Automatic)

```bash
# 1. Push to develop branch
git checkout develop
git push origin develop

# 2. Monitor build
# Go to: Actions → Build and Security Scan

# 3. If build succeeds, dev deployment auto-triggers
# Go to: Actions → CD - Deploy to Development
```

### Deploy to Staging (Manual)

```bash
# 1. Get image tag from successful dev deployment
IMAGE_TAG="1.0.245-a3f8c92d"

# 2. Trigger staging deployment
# Go to: Actions → CD - Deploy to Staging
# Click: Run workflow
# Enter: Image tag = 1.0.245-a3f8c92d

# 3. Approve deployment (if you're a reviewer)

# 4. Monitor deployment
# Workflow will:
# - Validate manifest
# - Run security checks
# - Create backup
# - Deploy with digests
# - Run smoke tests
```

### Deploy to Production (Manual)

```bash
# 1. Verify staging is healthy
curl https://staging.applyforus.com/health

# 2. Get image tag from successful staging deployment
IMAGE_TAG="1.0.245-a3f8c92d"  # Same tag as staging!

# 3. Trigger production deployment
# Go to: Actions → CD - Deploy to Production
# Click: Run workflow
# Enter: Image tag = 1.0.245-a3f8c92d

# 4. Wait for 2+ approvals
# Required reviewers must approve

# 5. Wait for 5-minute cooling-off period

# 6. Monitor deployment
# - Creates backup
# - Deploys backend services
# - Deploys frontend
# - Runs smoke tests
# - 10-minute monitoring period
```

### Rollback

```bash
# Option 1: Deploy previous version
# 1. Find previous deployment manifest
# Go to: Actions → Build and Security Scan → Previous successful run
# Download: deployment-manifest-<old-version>.json

# 2. Deploy old version
# Trigger production deployment with old image tag

# Option 2: Use backup artifact
# 1. Download backup artifact from failed deployment
# 2. Restore manually using kubectl

# Option 3: Kubernetes rollback
kubectl rollout undo deployment/<service> -n applyforus
```

## Monitoring & Verification

### Verify Digest Deployment

```bash
# Check deployed image has digest reference
kubectl get deployment web -n applyforus -o json | \
  jq -r '.spec.template.spec.containers[].image'

# Expected output:
applyforusacr.azurecr.io/applyai-web@sha256:abc123...

# ❌ NOT expected:
applyforusacr.azurecr.io/applyai-web:latest
applyforusacr.azurecr.io/applyai-web:1.0.0
```

### Verify Deployment Annotations

```bash
# Check deployment metadata
kubectl get deployment web -n applyforus -o json | \
  jq -r '.metadata.annotations |
  with_entries(select(.key | startswith("deploy.applyforus.com")))'

# Expected output:
{
  "deploy.applyforus.com/image-digest": "sha256:abc123...",
  "deploy.applyforus.com/deployed-at": "2025-12-15T14:30:00Z",
  "deploy.applyforus.com/deployed-by": "username",
  "deploy.applyforus.com/version": "1.0.245",
  "deploy.applyforus.com/environment": "production"
}
```

### Download Deployment Artifacts

```bash
# Using GitHub CLI
gh run list --workflow="Build and Security Scan" --limit 5

# Download specific run artifacts
gh run download <run-id>

# Artifacts include:
# - deployment-manifest-<version>.json
# - digest-<service>.txt
# - sbom-<service>.json
```

## Troubleshooting

### "No deployment manifest found"

**Cause:** Build workflow didn't complete successfully.

**Solution:**
```bash
# 1. Check build workflow status
# Go to: Actions → Build and Security Scan

# 2. If failed, fix issues and re-run

# 3. If succeeded, verify artifact exists
# Click on workflow run → Artifacts → deployment-manifest-<version>
```

### "Security scan failed - HIGH/CRITICAL vulnerabilities"

**Cause:** Image contains known vulnerabilities.

**Solution:**
```bash
# 1. View vulnerability report
# Go to: Security → Code scanning alerts → Trivy

# 2. Fix vulnerabilities in code/dependencies

# 3. Re-run build workflow

# 4. If vulnerabilities are false positives:
#    - Document in security team
#    - Create exception (not recommended for prod)
```

### "Approval required but no reviewers available"

**Cause:** Required reviewers not configured or unavailable.

**Solution:**
```bash
# 1. Check environment settings
# Go to: Settings → Environments → prod → Required reviewers

# 2. Add additional reviewers

# 3. Ensure at least 2 reviewers are available during deployment windows
```

### "Digest validation failed"

**Cause:** Digest format invalid or missing.

**Solution:**
```bash
# 1. Verify deployment manifest
curl <artifact-url> | jq '.images'

# 2. Ensure all digests match format:
#    sha256:[64 hex characters]

# 3. Re-run build workflow if manifest corrupted
```

## Best Practices

### 1. Always Promote from Lower Environments

```
✅ CORRECT:
develop → build → dev → staging → prod

❌ INCORRECT:
develop → build → prod (skipping staging)
```

### 2. Use Semantic Versioning for Production

```bash
# Tag releases with semantic versions
git tag v1.0.0
git push origin v1.0.0

# Build workflow creates:
# - deployment-manifest-1.0.0-a3f8c92d.json
```

### 3. Monitor Security Alerts

```bash
# Weekly security review
# 1. Check: Security → Code scanning alerts
# 2. Review: Dependabot alerts
# 3. Update: Dependencies with vulnerabilities
```

### 4. Keep Deployment Manifests

```bash
# Deployment manifests are stored for:
# - Dev: 7 days
# - Staging: 30 days
# - Production: 365 days

# Download critical production manifests for long-term storage
```

### 5. Test Rollback Procedures

```bash
# Quarterly rollback drill
# 1. Deploy known-good version to staging
# 2. Deploy new version
# 3. Practice rollback to previous version
# 4. Verify rollback completes within SLA
```

## Compliance & Audit

### Audit Trail

Every deployment creates an immutable audit trail:

1. **Git commit SHA** - Source code version
2. **Image digest** - Exact container image deployed
3. **Deployment timestamp** - When deployed
4. **Deployer identity** - Who triggered deployment
5. **Approver identities** - Who approved (staging/prod)
6. **SBOM** - Bill of materials for supply chain
7. **Security scan results** - Vulnerability assessment

### Retrieving Audit Information

```bash
# What's running in production?
kubectl get deployments -n applyforus -o json | \
  jq -r '.items[] | {
    name: .metadata.name,
    image: .spec.template.spec.containers[].image,
    deployed_at: .metadata.annotations["deploy.applyforus.com/deployed-at"],
    deployed_by: .metadata.annotations["deploy.applyforus.com/deployed-by"],
    version: .metadata.annotations["deploy.applyforus.com/version"]
  }'

# What vulnerabilities were present at deploy time?
# Download SBOM from deployment run artifacts
```

## Summary

### Security Improvements

- ✅ **No static Azure credentials** - OIDC authentication only
- ✅ **Immutable deployments** - Digest-based image references
- ✅ **Security gates enforced** - Pipelines fail on HIGH/CRITICAL vulns
- ✅ **Supply chain security** - SBOMs generated for all images
- ✅ **Approval gates** - Multi-approver requirement for production
- ✅ **Audit trail** - Complete deployment history with approvers

### Operational Improvements

- ✅ **Build once, promote everywhere** - No rebuilds between environments
- ✅ **Faster deployments** - Digest-based promotion is instant
- ✅ **Reliable rollbacks** - Digest references ensure consistency
- ✅ **Environment parity** - Identical images across all environments
- ✅ **Automated dev deployments** - Faster development cycles

### Next Steps

1. ✅ Complete OIDC setup (see `AZURE_OIDC_SETUP.md`)
2. ✅ Configure GitHub Environments with reviewers
3. ✅ Test deployment flow in dev
4. ✅ Validate staging promotion
5. ✅ Perform production deployment with approvals
6. ✅ Remove old static credential secrets
7. ✅ Train team on new deployment process

**Your platform now has enterprise-grade CI/CD security!**
