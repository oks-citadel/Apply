# Build stage - Standalone service build (no monorepo context)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only the service's package files
COPY services/user-service/package.json ./

# Install dependencies directly (no workspace)
RUN npm install

# Copy service source code
COPY services/user-service/ ./

# Build NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init and curl for healthchecks
RUN apk add --no-cache dumb-init curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

ENV NODE_ENV=production
ENV PORT=8002

EXPOSE 8002

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8002/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
