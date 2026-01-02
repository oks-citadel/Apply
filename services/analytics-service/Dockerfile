# Monorepo-aware Dockerfile for analytics-service
FROM public.ecr.aws/docker/library/node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy all source code first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/analytics-service/ ./services/analytics-service/

# Install all dependencies (--no-frozen-lockfile needed due to workspace package renames)
RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true && \
    pnpm --filter @applyforus/logging build || true

# Build the service
WORKDIR /app/services/analytics-service
RUN echo "=== Starting analytics-service build ===" && \
    echo "Node version:" && node -v && \
    echo "=== Running NestJS build ===" && \
    pnpm run build && \
    echo "=== Build completed ===" && \
    echo "=== Exploring dist structure ===" && \
    find dist -name "main.js" -type f 2>/dev/null && \
    ls -laR dist/ | head -50

# Stage 2: Production - preserve monorepo structure for pnpm symlinks
FROM public.ecr.aws/docker/library/node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS production

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy root node_modules (contains .pnpm store with actual packages)
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy packages (workspace dependencies)
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

# Copy analytics-service with its node_modules (has symlinks to root .pnpm)
COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/dist ./services/analytics-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/node_modules ./services/analytics-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/package.json ./services/analytics-service/

USER nodejs

ENV NODE_ENV=production
ENV PORT=8086

EXPOSE 8086

WORKDIR /app/services/analytics-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8086/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
