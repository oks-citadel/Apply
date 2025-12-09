# ============================================================================
# Orchestrator Service Dockerfile
# Master controller for JobPilot AI multi-agent system
# ============================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace configuration files from root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages directory for shared dependencies
COPY packages ./packages

# Copy service package.json
COPY services/orchestrator-service/package.json ./services/orchestrator-service/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY services/orchestrator-service/ ./services/orchestrator-service/
WORKDIR /app/services/orchestrator-service
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/orchestrator-service/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Environment configuration
ENV NODE_ENV=production
ENV PORT=3009

# Expose the service port
EXPOSE 3009

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3009/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
