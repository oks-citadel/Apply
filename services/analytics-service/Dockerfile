# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy package files
COPY services/analytics-service/package.json ./

# Install dependencies
RUN pnpm install

# Copy source and build
COPY services/analytics-service/ ./
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
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

USER nodejs

ENV NODE_ENV=production
ENV PORT=8006

EXPOSE 8006

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8006/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
