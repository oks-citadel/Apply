# Container Platform Quick Reference Card

## Image Tagging Strategy

### ✅ APPROVED Tags
```bash
# SHA-based (primary - deployment reference)
applyforusacr.azurecr.io/applyai-auth-service:sha-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0

# Semantic version (secondary - human-readable)
applyforusacr.azurecr.io/applyai-auth-service:v1.0.123-a1b2c3d4

# Digest-based (production - REQUIRED)
applyforusacr.azurecr.io/applyai-auth-service@sha256:abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

### ❌ PROHIBITED Tags
```bash
:latest
:stable
:prod
:dev-latest
:develop-latest
```

---

## Pinned Base Images

```dockerfile
# Node.js (all services + Next.js apps)
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666

# Python (AI service)
FROM python:3.11-slim@sha256:ad4db0df957c2f83f87f5babc957e1d7c2ab821b6fcc1bbef4b8ff8cf1f2e13f
```

**Update**: Monthly or upon security advisory

---

## Common Commands

### Build Image
```bash
docker build \
  --build-arg BUILD_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --build-arg VCS_REF=$GITHUB_SHA \
  --build-arg VERSION=1.0.123 \
  -t applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA \
  -f services/auth-service/Dockerfile \
  .
```

### Push to ACR
```bash
docker push applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA
```

### Get Image Digest
```bash
docker inspect applyforusacr.azurecr.io/applyai-auth-service:sha-$GITHUB_SHA \
  | jq -r '.[0].RepoDigests[0]'
```

### Deploy by Digest
```bash
kubectl set image deployment/auth-service \
  auth-service=applyforusacr.azurecr.io/applyai-auth-service@sha256:xxx \
  -n applyforus
```

### Verify Digest Consistency
```bash
./scripts/verify-image-digests.sh
```

### Check Current Deployment
```bash
kubectl get deployment auth-service -n applyforus \
  -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Rollback to Previous Digest
```bash
# Get previous digest
PREV_DIGEST=$(kubectl rollout history deployment/auth-service -n applyforus --revision=5 \
  -o jsonpath='{.spec.template.spec.containers[0].image}' | grep -oP 'sha256:\w+')

# Rollback
kubectl set image deployment/auth-service \
  auth-service=applyforusacr.azurecr.io/applyai-auth-service@${PREV_DIGEST} \
  -n applyforus
```

---

## Dockerfile Template (Node.js Service)

```dockerfile
# Builder stage
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/SERVICE_NAME/ ./services/SERVICE_NAME/
RUN pnpm install --no-frozen-lockfile
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true
WORKDIR /app/services/SERVICE_NAME
RUN pnpm run build

# Production stage
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/SERVICE_NAME/dist ./services/SERVICE_NAME/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/SERVICE_NAME/node_modules ./services/SERVICE_NAME/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/SERVICE_NAME/package.json ./services/SERVICE_NAME/
USER nodejs
ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000
WORKDIR /app/services/SERVICE_NAME
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/SERVICE_NAME/src/main.js"]

# OCI Labels
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.title="ApplyForUs SERVICE_NAME"
```

---

## Kubernetes Deployment Template

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: applyforus
  labels:
    app: auth-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          # Production: MUST use digest reference
          image: applyforusacr.azurecr.io/applyai-auth-service@sha256:xxx
          # Dev/Staging: SHA tag acceptable
          # image: applyforusacr.azurecr.io/applyai-auth-service:sha-xxx
          imagePullPolicy: Always
          ports:
            - containerPort: 4000
          env:
            - name: NODE_ENV
              value: "production"
          envFrom:
            - secretRef:
                name: applyforus-secrets
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "300m"
          livenessProbe:
            httpGet:
              path: /api/v1/health/live
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/v1/health/ready
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## CI/CD Workflow Snippet

```yaml
- name: Generate Immutable Tags
  id: version
  run: |
    VERSION="1.0.$(git rev-list --count HEAD)"
    IMAGE_TAG_SHA="sha-${GITHUB_SHA}"
    IMAGE_TAG_VERSION="${VERSION}-${GITHUB_SHA:0:8}"
    echo "image_tag_sha=$IMAGE_TAG_SHA" >> $GITHUB_OUTPUT
    echo "image_tag_version=$IMAGE_TAG_VERSION" >> $GITHUB_OUTPUT

- name: Build and Push
  id: build
  uses: docker/build-push-action@v5
  with:
    push: true
    tags: |
      applyforusacr.azurecr.io/applyai-auth-service:${{ steps.version.outputs.image_tag_sha }}
      applyforusacr.azurecr.io/applyai-auth-service:${{ steps.version.outputs.image_tag_version }}
    labels: |
      org.opencontainers.image.revision=${{ github.sha }}
      org.opencontainers.image.version=${{ steps.version.outputs.version }}
    build-args: |
      BUILD_DATE=${{ github.event.head_commit.timestamp }}
      VCS_REF=${{ github.sha }}
      VERSION=${{ steps.version.outputs.version }}
    provenance: true
    sbom: true

- name: Save Digest
  run: |
    echo "${{ steps.build.outputs.digest }}" > digest.txt
    echo "applyforusacr.azurecr.io/applyai-auth-service@${{ steps.build.outputs.digest }}" > image-ref.txt
```

---

## Troubleshooting

### ImagePullBackOff with Digest
**Cause**: Digest doesn't exist in ACR

**Fix**:
```bash
# List available digests
az acr repository show-manifests \
  --name applyforusacr \
  --repository applyai-auth-service \
  --orderby time_desc
```

### Digest Mismatch Across Environments
**Cause**: Per-environment rebuilds (anti-pattern)

**Fix**:
```bash
# Run verification script
./scripts/verify-image-digests.sh

# Get correct digest from CI/CD
CORRECT_DIGEST="sha256:xxx"

# Update all environments
for ns in applyforus-dev applyforus-staging applyforus; do
  kubectl set image deployment/auth-service \
    auth-service=applyforusacr.azurecr.io/applyai-auth-service@${CORRECT_DIGEST} \
    -n $ns
done
```

### Pod Not Starting (Permission Denied)
**Cause**: Missing non-root user in Dockerfile

**Fix**: Add to Dockerfile:
```dockerfile
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

---

## Verification Checklist

### Pre-Deploy
- [ ] Base image pinned with SHA256 digest
- [ ] No `:latest` tags in Dockerfile or workflows
- [ ] Multi-stage build with separate builder and runtime
- [ ] Non-root user configured
- [ ] Health check defined
- [ ] OCI labels added

### Post-Build
- [ ] Two immutable tags created (`sha-xxx`, `vX.Y.Z-xxx`)
- [ ] Image digest captured
- [ ] SBOM generated
- [ ] Vulnerability scan passed
- [ ] Image signed (main branch)

### Post-Deploy
- [ ] Digest consistency verified across environments
- [ ] `imagePullPolicy: Always` set
- [ ] Deployment annotations updated
- [ ] Rollback tested

---

## Service Ports

| Service | Port |
|---------|------|
| auth-service | 4000 |
| user-service | 8002 |
| job-service | 8003 |
| resume-service | 8004 |
| notification-service | 8005 |
| auto-apply-service | 8006 |
| analytics-service | 8007 |
| ai-service | 8008 |
| payment-service | 8009 |
| orchestrator-service | 8010 |
| web-app | 3000 |

---

## Key Files

| File | Purpose |
|------|---------|
| `docs/IMAGE_TAGGING_STRATEGY.md` | Full tagging documentation |
| `CONTAINER_HARDENING_SUMMARY.md` | Implementation report |
| `scripts/verify-image-digests.sh` | Digest verification script |
| `docker/Dockerfile.node-service.template` | Node.js service template |
| `docker/Dockerfile.python-service.template` | Python service template |

---

## Contacts

- **Platform Team**: platform-team@applyforus.com
- **Security**: security@applyforus.com
- **SRE On-Call**: sre-oncall@applyforus.com

---

**Last Updated**: 2025-12-15
**Version**: 1.0
