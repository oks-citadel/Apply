# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages directory for shared dependencies
COPY packages ./packages

# Copy service package.json
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY services/notification-service/ ./services/notification-service/
WORKDIR /app/services/notification-service
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/notification-service/node_modules ./node_modules

USER nodejs

ENV NODE_ENV=production
ENV PORT=4005

EXPOSE 4005

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:4005/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
