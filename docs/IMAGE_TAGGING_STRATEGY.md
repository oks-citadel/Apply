# Container Image Tagging Strategy - ApplyForUs Platform

## Executive Summary

ApplyForUs platform implements **immutable image tagging** to ensure:
- **Supply Chain Security**: Pinned base images with SHA256 digests
- **Deployment Consistency**: One build = One digest = One release across all environments
- **Traceability**: Every image traceable to exact Git commit
- **Rollback Safety**: Guaranteed reproducible deployments

---

## Image Tagging Rules

### 🚫 PROHIBITED: Mutable Tags

The following tags are **NEVER** used in production:

```bash
# ❌ NEVER USE THESE
:latest
:stable
:prod
:dev-latest
:develop-latest
```

**Rationale**: Mutable tags break the "one build, one release" principle. The same tag can point to different image digests across environments, creating deployment drift.

### ✅ REQUIRED: Immutable Tags

All images MUST be tagged with **two immutable tags**:

#### 1. Primary Tag: SHA-based (Deployment Reference)
```bash
Format: sha-<full-git-sha>
Example: sha-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

**Purpose**: Primary deployment reference. Guarantees exact traceability to source code.

#### 2. Secondary Tag: Semantic Version (Human-Readable Alias)
```bash
Format: vX.Y.Z-<short-sha>
Example: v1.0.123-a1b2c3d4
```

**Purpose**: Human-readable version for tracking and auditing.

---

## Base Image Pinning

### Node.js Services

All Node.js services use **pinned Alpine images** with SHA256 digests:

```dockerfile
# ✅ CORRECT: Pinned with digest
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS builder

# ❌ INCORRECT: Mutable tag
FROM node:20-alpine AS builder
```

**Update Schedule**: Digest updated monthly or upon security advisories.

**Update Command**:
```bash
docker pull node:20-alpine
docker inspect node:20-alpine | jq -r '.[0].RepoDigests[0]'
```

### Python Services (AI Service)

```dockerfile
# ✅ CORRECT: Pinned with digest
FROM python:3.11-slim@sha256:ad4db0df957c2f83f87f5babc957e1d7c2ab821b6fcc1bbef4b8ff8cf1f2e13f AS builder

# ❌ INCORRECT: Mutable tag
FROM python:3.11-slim AS builder
```

---

## Image Naming Convention

### ACR Repository Structure

```
applyforusacr.azurecr.io/
├── applyai-auth-service
├── applyai-user-service
├── applyai-job-service
├── applyai-resume-service
├── applyai-notification-service
├── applyai-auto-apply-service
├── applyai-analytics-service
├── applyai-ai-service
├── applyai-orchestrator-service
├── applyai-payment-service
└── applyai-web
```

### Full Image Reference Examples

```bash
# Development Build (tagged)
applyforusacr.azurecr.io/applyai-auth-service:sha-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
applyforusacr.azurecr.io/applyai-auth-service:v1.0.123-a1b2c3d4

# Production Deployment (digest-based - REQUIRED)
applyforusacr.azurecr.io/applyai-auth-service@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## CI/CD Workflow Integration

### Build Phase (GitHub Actions)

```yaml
- name: Generate Immutable Version Tags
  id: version
  run: |
    VERSION="1.0.$(git rev-list --count HEAD)"
    SHORT_SHA="${GITHUB_SHA:0:8}"
    IMAGE_TAG_SHA="sha-${GITHUB_SHA}"
    IMAGE_TAG_VERSION="${VERSION}-${SHORT_SHA}"

    echo "image_tag_sha=$IMAGE_TAG_SHA" >> $GITHUB_OUTPUT
    echo "image_tag_version=$IMAGE_TAG_VERSION" >> $GITHUB_OUTPUT

- name: Build and push image (immutable tags only)
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: |
      ${{ env.ACR_LOGIN_SERVER }}/applyai-auth-service:${{ steps.version.outputs.image_tag_sha }}
      ${{ env.ACR_LOGIN_SERVER }}/applyai-auth-service:${{ steps.version.outputs.image_tag_version }}
    # ❌ NO 'latest' tag
```

### Deploy Phase (Digest-Based Promotion)

```yaml
- name: Deploy services using image digests
  run: |
    IMAGE_DIGEST="sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    IMAGE_REF="applyforusacr.azurecr.io/applyai-auth-service@${IMAGE_DIGEST}"

    kubectl set image deployment/auth-service \
      auth-service=${IMAGE_REF} \
      -n applyforus
```

---

## Kubernetes Deployment Configuration

### Production Manifests

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: applyforus
spec:
  template:
    spec:
      containers:
        - name: auth-service
          # ✅ CORRECT: Digest-based reference (immutable)
          image: applyforusacr.azurecr.io/applyai-auth-service@sha256:abcdef1234567890...
          imagePullPolicy: Always

          # Alternative for manual deployment (still immutable)
          # image: applyforusacr.azurecr.io/applyai-auth-service:sha-a1b2c3d4e5f6a7b8...
```

### Image Pull Policy

```yaml
# ✅ REQUIRED: Always pull by digest to verify integrity
imagePullPolicy: Always

# ❌ PROHIBITED: IfNotPresent breaks digest verification
imagePullPolicy: IfNotPresent  # DO NOT USE with digests
```

---

## Deployment Verification

### Verify Image Digest Consistency

```bash
# Get digest for dev environment
DEV_DIGEST=$(kubectl get deployment auth-service -n applyforus-dev \
  -o jsonpath='{.spec.template.spec.containers[0].image}' | grep -oP 'sha256:\w+')

# Get digest for staging environment
STAGING_DIGEST=$(kubectl get deployment auth-service -n applyforus-staging \
  -o jsonpath='{.spec.template.spec.containers[0].image}' | grep -oP 'sha256:\w+')

# Get digest for production environment
PROD_DIGEST=$(kubectl get deployment auth-service -n applyforus \
  -o jsonpath='{.spec.template.spec.containers[0].image}' | grep -oP 'sha256:\w+')

# Verify all environments use identical digest
if [[ "$DEV_DIGEST" == "$STAGING_DIGEST" ]] && [[ "$STAGING_DIGEST" == "$PROD_DIGEST" ]]; then
  echo "✅ VERIFIED: Same image digest across all environments"
  echo "   Digest: $PROD_DIGEST"
else
  echo "❌ FAILED: Image digest mismatch detected!"
  echo "   Dev:     $DEV_DIGEST"
  echo "   Staging: $STAGING_DIGEST"
  echo "   Prod:    $PROD_DIGEST"
  exit 1
fi
```

---

## Image Lifecycle

### 1. Build (CI)
```
git commit → GitHub Actions → Docker build → ACR push
                                      ↓
                        Tags: sha-<gitsha>, vX.Y.Z-<shortsha>
                        Digest: sha256:abcdef...
```

### 2. Dev Deployment (Automatic)
```
ACR push event → Deploy to dev-namespace using digest
```

### 3. Staging Deployment (Manual Approval)
```
Approve → Promote same digest to staging-namespace
```

### 4. Production Deployment (Manual Approval + Verification)
```
Approve → Verify digest signature → Promote to production-namespace
```

**Key Principle**: The **SAME digest** is deployed across all environments. No rebuilding per environment.

---

## Rollback Procedure

### Using Digest References

```bash
# Get previous deployment digest
PREVIOUS_DIGEST=$(kubectl rollout history deployment/auth-service -n applyforus --revision=5 \
  -o jsonpath='{.spec.template.spec.containers[0].image}' | grep -oP 'sha256:\w+')

# Rollback to previous digest
kubectl set image deployment/auth-service \
  auth-service=applyforusacr.azurecr.io/applyai-auth-service@${PREVIOUS_DIGEST} \
  -n applyforus

# Verify rollback
kubectl rollout status deployment/auth-service -n applyforus
```

---

## Security Benefits

### Supply Chain Attack Prevention

1. **Pinned Base Images**: SHA256 digests prevent base image substitution attacks
2. **Immutable Tags**: Prevents tag poisoning (pushing malicious image to existing tag)
3. **Image Signing**: Cosign signatures verify image authenticity
4. **Digest Verification**: Kubernetes verifies digest before deployment

### Compliance

- **SOC 2**: Immutable artifacts ensure audit trail
- **ISO 27001**: Controlled change management with traceable deployments
- **PCI-DSS**: Reproducible builds for security compliance

---

## Troubleshooting

### Issue: "ImagePullBackOff" with digest reference

**Cause**: Digest doesn't exist in ACR (image was deleted or never built)

**Resolution**:
```bash
# List available digests for image
az acr repository show-manifests \
  --name applyforusacr \
  --repository applyai-auth-service \
  --orderby time_desc

# Find the correct digest and update deployment
```

### Issue: Different digests across environments

**Cause**: Image was rebuilt per environment (anti-pattern)

**Resolution**:
1. Identify the correct build digest from CI/CD logs
2. Update all environments to use the same digest
3. Fix CI/CD workflow to prevent rebuilding

---

## Quick Reference Card

| Scenario | Command/Config |
|----------|---------------|
| **Build image** | `docker build --build-arg VCS_REF=$GITHUB_SHA -t applyai-auth-service:sha-$GITHUB_SHA .` |
| **Tag for ACR** | `docker tag applyai-auth-service:sha-$GITHUB_SHA applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA` |
| **Push to ACR** | `docker push applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA` |
| **Get digest** | `docker inspect applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA \| jq -r '.[0].RepoDigests[0]'` |
| **Deploy by digest** | `kubectl set image deployment/auth-service auth-service=applyforusacr.azurecr.io/applyai-auth-service@sha256:xxx` |
| **Verify deployment** | `kubectl get deployment auth-service -o jsonpath='{.spec.template.spec.containers[0].image}'` |

---

## Enforcement Checklist

- [ ] All Dockerfiles use pinned base images with SHA256 digests
- [ ] CI/CD workflows build images with immutable tags only (no `:latest`)
- [ ] Kubernetes manifests reference images by digest (preferred) or SHA-based tags
- [ ] `imagePullPolicy: Always` set for all production deployments
- [ ] Deployment verification script confirms digest consistency across environments
- [ ] Image signing enabled for main branch builds
- [ ] SBOM generated for all images
- [ ] Digest references stored in deployment manifests/artifacts

---

## Contact & Support

For questions or issues related to image tagging:
- **Platform Team**: platform-team@applyforus.com
- **Documentation**: https://docs.applyforus.com/container-strategy
- **Runbook**: `docs/runbooks/container-deployment.md`

---

**Last Updated**: 2025-12-15
**Owner**: Platform Engineering Team
**Review Cycle**: Monthly or upon security advisory
