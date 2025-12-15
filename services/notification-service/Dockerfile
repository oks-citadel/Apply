# Monorepo-aware Dockerfile for notification-service
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/notification-service/ ./services/notification-service/

RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @jobpilot/types build || true && \
    pnpm --filter @jobpilot/security build || true && \
    pnpm --filter @jobpilot/shared build || true && \
    pnpm --filter @jobpilot/telemetry build || true

WORKDIR /app/services/notification-service
RUN pnpm run build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/node_modules ./services/notification-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/package.json ./services/notification-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=8005
EXPOSE 8005

WORKDIR /app/services/notification-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/notification-service/src/main.js"]
