# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages directory for shared dependencies
COPY packages ./packages

# Copy service package.json
COPY services/auth-service/package.json ./services/auth-service/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY services/auth-service/ ./services/auth-service/
WORKDIR /app/services/auth-service
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/auth-service/node_modules ./node_modules

USER nodejs

ENV NODE_ENV=production
ENV PORT=8001

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
