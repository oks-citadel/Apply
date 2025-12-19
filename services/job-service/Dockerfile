# Monorepo-aware Dockerfile for job-service
FROM node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/job-service/ ./services/job-service/

RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @applyforus/types build || echo "types build skipped" && \
    pnpm --filter @applyforus/security build || echo "security build skipped" && \
    pnpm --filter @applyforus/shared build || echo "shared build skipped" && \
    pnpm --filter @applyforus/telemetry build || echo "telemetry build skipped" && \
    pnpm --filter @applyforus/logging build || echo "logging build skipped"

WORKDIR /app/services/job-service
RUN pnpm run build && ls -la dist/ && test -f dist/main.js

FROM node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/job-service/dist ./services/job-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/job-service/node_modules ./services/job-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/job-service/package.json ./services/job-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=4002
EXPOSE 4002

WORKDIR /app/services/job-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:4002/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
