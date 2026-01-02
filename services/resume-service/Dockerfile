# Monorepo-aware Dockerfile for resume-service
FROM public.ecr.aws/docker/library/node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/resume-service/ ./services/resume-service/

RUN pnpm install --no-frozen-lockfile

# Build workspace packages first
WORKDIR /app
RUN pnpm --filter @applyforus/types build || true && \
    pnpm --filter @applyforus/security build || true && \
    pnpm --filter @applyforus/shared build || true && \
    pnpm --filter @applyforus/telemetry build || true && \
    pnpm --filter @applyforus/logging build || true

WORKDIR /app/services/resume-service
RUN pnpm run build

FROM public.ecr.aws/docker/library/node:20-alpine@sha256:c13b26e7e602ef2f1074aef304ce6e9b7dd284c419b35d89fcf3cc8e44a8def9 AS production
RUN apk add --no-cache dumb-init curl
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/services/resume-service/dist ./services/resume-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/resume-service/node_modules ./services/resume-service/node_modules
COPY --from=builder --chown=nodejs:nodejs /app/services/resume-service/package.json ./services/resume-service/

USER nodejs
ENV NODE_ENV=production
ENV PORT=8083
ENV NODE_PATH=/app/node_modules
EXPOSE 8083

WORKDIR /app/services/resume-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8083/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
