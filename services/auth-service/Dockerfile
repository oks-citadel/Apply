# Monorepo-aware Dockerfile for auth-service
FROM node:20-alpine AS builder
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

# Build workspace packages first (types, security, shared, telemetry)
WORKDIR /app
RUN pnpm --filter @jobpilot/types build || true && \
    pnpm --filter @jobpilot/security build || true && \
    pnpm --filter @jobpilot/shared build || true && \
    pnpm --filter @jobpilot/telemetry build || true

# Build the service
WORKDIR /app/services/auth-service
RUN pnpm run build

# Stage 2: Production - preserve monorepo structure for pnpm symlinks
FROM node:20-alpine AS production

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
    CMD curl -f http://localhost:4000/api/v1/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/auth-service/src/main.js"]
