#!/bin/bash

# ============================================================================
# Database Migration Script
# ============================================================================
# Runs database migrations for the specified environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[MIGRATION]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <environment> <database-url>"
    exit 1
fi

ENVIRONMENT=$1
DATABASE_URL=$2

log_info "Running database migrations for environment: $ENVIRONMENT"
log_info "Database URL: ${DATABASE_URL:0:20}..." # Only show first 20 chars for security

# Change to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Check if using Prisma, TypeORM, or other migration tool
if [ -f "prisma/schema.prisma" ]; then
    log_info "Detected Prisma - running Prisma migrations"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        pnpm install --frozen-lockfile
    fi

    # Run Prisma migrations
    export DATABASE_URL="$DATABASE_URL"

    log_info "Running Prisma migrate deploy..."
    pnpm exec prisma migrate deploy

    log_info "Generating Prisma Client..."
    pnpm exec prisma generate

    log_success "Prisma migrations completed!"

elif [ -d "migrations" ]; then
    log_info "Detected custom migrations directory"

    # Run custom migration logic here
    # This is a placeholder - adjust based on your migration tool

    log_info "Running migrations from migrations/ directory..."

    # Example for node-pg-migrate or similar
    export DATABASE_URL="$DATABASE_URL"

    if command -v node-pg-migrate &> /dev/null; then
        node-pg-migrate up
        log_success "Migrations completed!"
    else
        log_error "Migration tool not found!"
        exit 1
    fi

else
    log_error "No migration configuration found!"
    log_info "Looking for:"
    log_info "  - prisma/schema.prisma (Prisma)"
    log_info "  - migrations/ directory (node-pg-migrate or similar)"
    exit 1
fi

# Create backup after migration
log_info "Creating post-migration backup..."

BACKUP_DIR="$PROJECT_ROOT/backups/migrations"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${ENVIRONMENT}_${TIMESTAMP}.sql"

# Extract connection details from DATABASE_URL
# This is a simplified example - adjust based on your URL format
if command -v pg_dump &> /dev/null; then
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null && \
        log_success "Backup created: $BACKUP_FILE" || \
        log_error "Backup failed (pg_dump not available or connection failed)"
fi

log_success "Migration process completed for $ENVIRONMENT!"
