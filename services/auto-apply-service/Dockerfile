# Monorepo-aware Dockerfile for auto-apply-service
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/auto-apply-service/ ./services/auto-apply-service/

RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true

WORKDIR /app/services/auto-apply-service
RUN pnpm run build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl chromium
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/auto-apply-service/dist ./services/auto-apply-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/auto-apply-service/node_modules ./services/auto-apply-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/auto-apply-service/package.json ./services/auto-apply-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=8006
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
EXPOSE 8006

WORKDIR /app/services/auto-apply-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8006/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/auto-apply-service/src/main.js"]
