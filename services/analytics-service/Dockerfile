# Monorepo-aware Dockerfile for analytics-service
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/analytics-service/package.json ./services/analytics-service/
COPY packages/telemetry/package.json ./packages/telemetry/
COPY packages/logging/package.json ./packages/logging/
COPY packages/security/package.json ./packages/security/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-lock.yaml ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/analytics-service/ ./services/analytics-service/

RUN cd packages/types && pnpm build || true
RUN cd packages/utils && pnpm build || true
RUN cd packages/shared && pnpm build || true
RUN cd packages/logging && pnpm build || true
RUN cd packages/telemetry && pnpm build || true
RUN cd packages/security && pnpm build || true

WORKDIR /app/services/analytics-service
ENV PATH="/app/node_modules/.bin:$PATH"
RUN pnpm exec nest build

FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/analytics-service/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/@jobpilot ./node_modules/@jobpilot

USER nodejs
ENV NODE_ENV=production
ENV PORT=8007
EXPOSE 8007

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8007/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
