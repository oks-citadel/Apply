# Monorepo-aware Dockerfile for auth-service
# Pinned Node.js 20 Alpine with SHA256 digest for supply chain security
# Update digest: docker pull node:20-alpine && docker inspect node:20-alpine | jq -r '.[0].RepoDigests[0]'
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy all source code first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/auth-service/ ./services/auth-service/

# Install all dependencies (--no-frozen-lockfile needed due to workspace package renames)
RUN pnpm install --no-frozen-lockfile

# Build workspace packages first (types, security, shared, telemetry, logging)
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true && \
    pnpm --filter @applyforus/logging build || true

# Build the service
WORKDIR /app/services/auth-service
RUN pnpm run build

# Stage 2: Production - preserve monorepo structure for pnpm symlinks
# Pinned Node.js 20 Alpine with SHA256 digest (must match builder stage)
FROM node:20-alpine@sha256:2d5e8a8a51bc341fd5f2eed6d91455c3a3d147e91a14298fc564b5dc519c1666 AS production

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy root node_modules (contains .pnpm store with actual packages)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy packages (workspace dependencies)
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Copy auth-service with its node_modules (has symlinks to root .pnpm)
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/dist ./services/auth-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/node_modules ./services/auth-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/package.json ./services/auth-service/

USER nodejs

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

WORKDIR /app/services/auth-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Build metadata labels (OCI standard)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.authors="ApplyForUs Platform Team" \
      org.opencontainers.image.url="https://applyforus.com" \
      org.opencontainers.image.source="https://github.com/applyforus/platform" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="ApplyForUs" \
      org.opencontainers.image.title="ApplyForUs Auth Service" \
      org.opencontainers.image.description="Production-hardened authentication service"
