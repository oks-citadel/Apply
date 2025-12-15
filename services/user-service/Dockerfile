# Monorepo-aware Dockerfile for user-service
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY services/user-service/ ./services/user-service/

RUN pnpm install --no-frozen-lockfile

WORKDIR /app/services/user-service
RUN pnpm run build

FROM node:20-alpine AS production
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
ENV PORT=8002
EXPOSE 8002

WORKDIR /app/services/user-service

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/services/user-service/src/main.js"]
