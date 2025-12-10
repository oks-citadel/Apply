# ============================================================================
# Orchestrator Service Dockerfile
# Master controller for JobPilot AI multi-agent system
# ============================================================================

# Build stage - Standalone service build (no monorepo context)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only the service's package files
COPY services/orchestrator-service/package.json ./

# Install dependencies directly (no workspace)
RUN npm install

# Copy service source code
COPY services/orchestrator-service/ ./

# Build NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Switch to non-root user
USER nodejs

# Environment configuration
ENV NODE_ENV=production
ENV PORT=8010

# Expose the service port
EXPOSE 8010

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8010/health || exit 1

# Use dumb-init as entrypoint for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
