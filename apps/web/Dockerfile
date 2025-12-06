# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Build the app
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @jobpilot/web build

# Ensure public folder exists for standalone output
RUN mkdir -p /app/apps/web/public

# Stage 3: Runner
FROM node:20-alpine AS runner

# Set workdir to match the monorepo structure for pnpm symlinks to resolve correctly
WORKDIR /app/apps/web/.next/standalone

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the entire standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy public folder
COPY --from=builder /app/apps/web/public ./apps/web/public

# For pnpm monorepos, standalone symlinks point to ../../../node_modules/.pnpm/...
# From /app/apps/web/.next/standalone/node_modules, that's /app/apps/web/node_modules/.pnpm
# We need to copy the pnpm store to the correct relative location
# Note: COPY paths are relative to workdir, so we need to use absolute path or correct relative
RUN mkdir -p /app/apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm /app/apps/web/node_modules/.pnpm

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use node for healthcheck since wget might not be available
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Run the standalone server
CMD ["node", "server.js"]
