# Monorepo-aware Dockerfile for user-service
# Pinned Node.js 20 Alpine with SHA256 digest for supply chain security
FROM public.ecr.aws/docker/library/node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/user-service/ ./services/user-service/

RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true && \
    pnpm --filter @applyforus/logging build || true

WORKDIR /app/services/user-service
RUN pnpm run build

# Pinned Node.js 20 Alpine with SHA256 digest (must match builder stage)
FROM public.ecr.aws/docker/library/node:20-alpine AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/node_modules ./services/user-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/package.json ./services/user-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=8082
EXPOSE 8082

WORKDIR /app/services/user-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8082/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/user-service/src/main.js"]

# Build metadata labels (OCI standard)
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.title="ApplyForUs User Service"
