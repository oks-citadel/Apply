# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages directory for shared dependencies
COPY packages ./packages

# Copy service package.json
COPY services/user-service/package.json ./services/user-service/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY services/user-service/ ./services/user-service/
WORKDIR /app/services/user-service
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/user-service/node_modules ./node_modules

USER nodejs

ENV NODE_ENV=production
ENV PORT=8002

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
