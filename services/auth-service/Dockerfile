# Monorepo-aware Dockerfile for auth-service
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for workspace resolution
COPY services/auth-service/package.json ./services/auth-service/
COPY packages/telemetry/package.json ./packages/telemetry/
COPY packages/logging/package.json ./packages/logging/
COPY packages/security/package.json ./packages/security/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy from deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/pnpm-workspace.yaml ./

# Copy packages source (for workspace deps)
COPY packages/ ./packages/

# Copy service source
COPY services/auth-service/ ./services/auth-service/

# Build packages first
RUN cd packages/types && pnpm build || true
RUN cd packages/utils && pnpm build || true
RUN cd packages/shared && pnpm build || true
RUN cd packages/logging && pnpm build || true
RUN cd packages/telemetry && pnpm build || true
RUN cd packages/security && pnpm build || true

# Build the service
WORKDIR /app/services/auth-service
ENV PATH="/app/node_modules/.bin:$PATH"
RUN pnpm exec nest build

# Stage 3: Production
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built service
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/node_modules ./node_modules

# Copy built packages
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@jobpilot ./node_modules/@jobpilot

USER nodejs

ENV NODE_ENV=production
ENV PORT=8001

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
