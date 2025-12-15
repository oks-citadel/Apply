# Monorepo-aware Dockerfile for orchestrator-service
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/orchestrator-service/ ./services/orchestrator-service/

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/services/orchestrator-service
RUN pnpm exec nest build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/dist ./services/orchestrator-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/node_modules ./services/orchestrator-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/package.json ./services/orchestrator-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=8010
EXPOSE 8010

WORKDIR /app/services/orchestrator-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8010/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/orchestrator-service/src/main.js"]
