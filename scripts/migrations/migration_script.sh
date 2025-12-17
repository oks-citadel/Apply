#!/bin/bash

################################################################################
# ApplyforUs Rebranding Migration Script
#
# This script automates the rebranding from "JobPilot" to "ApplyforUs"
#
# Usage: ./migration_script.sh [--dry-run] [--backup-only]
#
# Options:
#   --dry-run      Show what would be changed without making changes
#   --backup-only  Only create backups without making changes
#
# IMPORTANT: Review this script before running!
#            Always run with --dry-run first!
#            Create backups before running!
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKUP_DIR="$PROJECT_ROOT/backups/migration-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$PROJECT_ROOT/migration-log-$(date +%Y%m%d-%H%M%S).txt"

# Flags
DRY_RUN=false
BACKUP_ONLY=false
ERRORS=0
CHANGES=0

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[$(date +%Y-%m-%d\ %H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    ((ERRORS++))
}

log_change() {
    log "$1"
    ((CHANGES++))
}

################################################################################
# Backup Functions
################################################################################

create_backup() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"

    log "Backing up critical files..."

    # Backup package.json files
    log "Backing up package.json files..."
    find "$PROJECT_ROOT" -name "package.json" -not -path "*/node_modules/*" \
        -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || true

    # Backup docker-compose files
    log "Backing up docker-compose files..."
    find "$PROJECT_ROOT" -name "docker-compose*.yml" \
        -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || true

    # Backup kubernetes manifests
    log "Backing up Kubernetes manifests..."
    if [ -d "$PROJECT_ROOT/infrastructure/kubernetes" ]; then
        cp -r "$PROJECT_ROOT/infrastructure/kubernetes" "$BACKUP_DIR/" 2>/dev/null || true
    fi

    # Backup .env files
    log "Backing up environment files..."
    find "$PROJECT_ROOT" -name ".env*" -not -path "*/node_modules/*" \
        -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || true

    # Backup configuration files
    log "Backing up configuration files..."
    find "$PROJECT_ROOT" -name "*.config.*" -not -path "*/node_modules/*" \
        -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || true

    # Backup documentation
    log "Backing up documentation..."
    if [ -d "$PROJECT_ROOT/docs" ]; then
        cp -r "$PROJECT_ROOT/docs" "$BACKUP_DIR/" 2>/dev/null || true
    fi

    # Create manifest
    log "Creating backup manifest..."
    find "$BACKUP_DIR" -type f > "$BACKUP_DIR/manifest.txt"

    log_success "Backup created at: $BACKUP_DIR"
    log_success "Backup manifest: $BACKUP_DIR/manifest.txt"
}

################################################################################
# Text Replacement Functions
################################################################################

replace_in_file() {
    local file="$1"
    local search="$2"
    local replace="$3"

    if [ "$DRY_RUN" = true ]; then
        if grep -q "$search" "$file" 2>/dev/null; then
            log_change "Would replace '$search' with '$replace' in: $file"
        fi
    else
        if grep -q "$search" "$file" 2>/dev/null; then
            sed -i "s|$search|$replace|g" "$file"
            log_change "Replaced '$search' with '$replace' in: $file"
        fi
    fi
}

replace_in_files() {
    local pattern="$1"
    local search="$2"
    local replace="$3"

    log "Replacing '$search' with '$replace' in files matching: $pattern"

    find "$PROJECT_ROOT" -name "$pattern" \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        -not -path "*/.next/*" \
        -not -path "*/backups/*" \
        -type f | while read -r file; do
        replace_in_file "$file" "$search" "$replace"
    done
}

################################################################################
# Migration Steps
################################################################################

step1_package_names() {
    log "=== Step 1: Updating Package Names ==="

    # Update package.json files
    log "Updating package.json files..."

    # Root package
    replace_in_files "package.json" '"name": "jobpilot-platform"' '"name": "applyforus-platform"'

    # Scoped packages
    replace_in_files "package.json" '"name": "@jobpilot/' '"name": "@applyforus/'
    replace_in_files "package.json" '"name": "@job-apply-platform/' '"name": "@applyforus/'

    # Service packages
    replace_in_files "package.json" '"name": "jobpilot-' '"name": "applyforus-'

    # Dependencies
    replace_in_files "package.json" '"@jobpilot/' '"@applyforus/'

    # Descriptions and authors
    replace_in_files "package.json" 'JobPilot' 'ApplyforUs'
    replace_in_files "package.json" 'JobPilot Team' 'ApplyforUs Team'

    log_success "Package names updated"
}

step2_docker_compose() {
    log "=== Step 2: Updating Docker Compose Files ==="

    # Container names
    replace_in_files "docker-compose*.yml" 'jobpilot-' 'applyforus-'

    # Network names
    replace_in_files "docker-compose*.yml" 'jobpilot-network' 'applyforus-network'
    replace_in_files "docker-compose*.yml" 'jobpilot-monitoring' 'applyforus-monitoring'

    # Database names
    replace_in_files "docker-compose*.yml" 'POSTGRES_DB: jobpilot' 'POSTGRES_DB: applyforus'
    replace_in_files "docker-compose*.yml" '/jobpilot?' '/applyforus?'
    replace_in_files "docker-compose*.yml" ':5432/jobpilot' ':5432/applyforus'

    # Email addresses
    replace_in_files "docker-compose*.yml" '@jobpilot.ai' '@applyforus.com'

    # Volume names
    replace_in_files "docker-compose*.yml" 'name: jobpilot-' 'name: applyforus-'

    log_success "Docker Compose files updated"
}

step3_kubernetes() {
    log "=== Step 3: Updating Kubernetes Manifests ==="

    # Namespace
    replace_in_files "*.yaml" 'namespace: jobpilot' 'namespace: applyforus'
    replace_in_files "*.yaml" 'name: jobpilot' 'name: applyforus'

    # ConfigMap and Secret names
    replace_in_files "*.yaml" 'jobpilot-config' 'applyforus-config'
    replace_in_files "*.yaml" 'jobpilot-secrets' 'applyforus-secrets'
    replace_in_files "*.yaml" 'jobpilot-service-account' 'applyforus-service-account'

    # Service URLs
    replace_in_files "*.yaml" '.jobpilot.svc.cluster.local' '.applyforus.svc.cluster.local'

    # Azure resource names
    replace_in_files "*.yaml" 'jobpilot-postgres.postgres.database.azure.com' 'applyforus-postgres.postgres.database.azure.com'
    replace_in_files "*.yaml" 'jobpilot-redis.redis.cache.windows.net' 'applyforus-redis.redis.cache.windows.net'
    replace_in_files "*.yaml" 'jobpilotstorage' 'applyforusstorage'
    replace_in_files "*.yaml" 'jobpilot-openai.openai.azure.com' 'applyforus-openai.openai.azure.com'

    # Domains
    replace_in_files "*.yaml" 'jobpilot.com' 'applyforus.com'
    replace_in_files "*.yaml" 'jobpilot.ai' 'applyforus.com'

    # Labels
    replace_in_files "*.yaml" 'app: jobpilot-platform' 'app: applyforus-platform'

    log_success "Kubernetes manifests updated"
}

step4_environment_files() {
    log "=== Step 4: Updating Environment Files ==="

    # Database URLs
    replace_in_files ".env*" '/jobpilot?' '/applyforus?'
    replace_in_files ".env*" ':5432/jobpilot' ':5432/applyforus'
    replace_in_files ".env*" 'POSTGRES_DB=jobpilot' 'POSTGRES_DB=applyforus'
    replace_in_files ".env*" 'POSTGRES_DB: jobpilot' 'POSTGRES_DB: applyforus'

    # App names
    replace_in_files ".env*" 'APP_NAME=JobPilot' 'APP_NAME=ApplyforUs'
    replace_in_files ".env*" 'APP_NAME="JobPilot' 'APP_NAME="ApplyforUs'

    # Service names
    replace_in_files ".env*" 'SERVICE_NAME=jobpilot-' 'SERVICE_NAME=applyforus-'

    # URLs
    replace_in_files ".env*" 'jobpilot.com' 'applyforus.com'
    replace_in_files ".env*" 'jobpilot.ai' 'applyforus.com'

    # Email
    replace_in_files ".env*" '@jobpilot.ai' '@applyforus.com'

    log_success "Environment files updated"
}

step5_typescript_config() {
    log "=== Step 5: Updating TypeScript Configuration ==="

    # Path mappings
    replace_in_files "tsconfig*.json" '"@jobpilot/' '"@applyforus/'

    log_success "TypeScript configuration updated"
}

step6_documentation() {
    log "=== Step 6: Updating Documentation ==="

    # Markdown files
    replace_in_files "*.md" 'JobPilot' 'ApplyforUs'
    replace_in_files "*.md" 'jobpilot' 'applyforus'
    replace_in_files "*.md" 'Job-Apply-Platform' 'ApplyforUs-Platform'
    replace_in_files "*.md" 'job-apply-platform' 'applyforus'

    # URLs
    replace_in_files "*.md" 'jobpilot.ai' 'applyforus.com'
    replace_in_files "*.md" 'jobpilot.com' 'applyforus.com'

    # Email addresses
    replace_in_files "*.md" '@jobpilot.ai' '@applyforus.com'
    replace_in_files "*.md" '@jobpilot.com' '@applyforus.com'

    log_success "Documentation updated"
}

step7_ci_cd_pipelines() {
    log "=== Step 7: Updating CI/CD Pipelines ==="

    # GitHub Actions
    if [ -d ".github/workflows" ]; then
        replace_in_files "*.yml" 'JobPilot' 'ApplyforUs'
        replace_in_files "*.yml" 'jobpilot' 'applyforus'
        replace_in_files "*.yml" 'jobpilotacr' 'applyforusacr'
    fi

    # Azure Pipelines
    replace_in_files "azure-pipelines*.yml" 'JobPilot' 'ApplyforUs'
    replace_in_files "azure-pipelines*.yml" 'jobpilot' 'applyforus'
    replace_in_files "azure-pipelines*.yml" 'jobpilotacr' 'applyforusacr'

    log_success "CI/CD pipelines updated"
}

step8_source_code() {
    log "=== Step 8: Updating Source Code ==="

    # TypeScript/JavaScript imports
    replace_in_files "*.ts" '@jobpilot/' '@applyforus/'
    replace_in_files "*.tsx" '@jobpilot/' '@applyforus/'
    replace_in_files "*.js" '@jobpilot/' '@applyforus/'
    replace_in_files "*.jsx" '@jobpilot/' '@applyforus/'

    # Comments and strings (be careful with these)
    replace_in_files "*.ts" 'JobPilot' 'ApplyforUs'
    replace_in_files "*.tsx" 'JobPilot' 'ApplyforUs'
    replace_in_files "*.js" 'JobPilot' 'ApplyforUs'
    replace_in_files "*.jsx" 'JobPilot' 'ApplyforUs'

    # Python files
    replace_in_files "*.py" 'JobPilot' 'ApplyforUs'
    replace_in_files "*.py" 'jobpilot' 'applyforus'

    log_success "Source code updated"
}

step9_config_files() {
    log "=== Step 9: Updating Configuration Files ==="

    # Next.js config
    replace_in_files "next.config.*" 'JobPilot' 'ApplyforUs'
    replace_in_files "next.config.*" 'jobpilot' 'applyforus'

    # Tailwind config
    replace_in_files "tailwind.config.*" 'jobpilot-' 'applyforus-'
    replace_in_files "tailwind.config.*" 'jp-' 'afu-'

    # Jest config
    replace_in_files "jest.config.*" 'JobPilot' 'ApplyforUs'
    replace_in_files "jest.config.*" '@jobpilot/' '@applyforus/'

    # Vitest config
    replace_in_files "vitest.config.*" 'JobPilot' 'ApplyforUs'

    log_success "Configuration files updated"
}

step10_terraform() {
    log "=== Step 10: Updating Terraform Files ==="

    if [ -d "infrastructure/terraform" ]; then
        replace_in_files "*.tf" 'jobpilot' 'applyforus'
        replace_in_files "*.tfvars" 'jobpilot' 'applyforus'
        replace_in_files "*.tf" 'JobPilot' 'ApplyforUs'
    fi

    log_success "Terraform files updated"
}

################################################################################
# File Rename Operations
################################################################################

rename_files() {
    log "=== Renaming Files with Old Branding ==="

    # Rename Postman collection
    if [ -f "docs/api/JobPilot-API.postman_collection.json" ]; then
        if [ "$DRY_RUN" = true ]; then
            log_change "Would rename: docs/api/JobPilot-API.postman_collection.json -> docs/api/ApplyforUs-API.postman_collection.json"
        else
            mv "docs/api/JobPilot-API.postman_collection.json" "docs/api/ApplyforUs-API.postman_collection.json"
            log_change "Renamed: JobPilot-API.postman_collection.json -> ApplyforUs-API.postman_collection.json"
        fi
    fi

    log_success "File renaming complete"
}

################################################################################
# Verification
################################################################################

verify_changes() {
    log "=== Verifying Changes ==="

    # Check for remaining references
    log "Checking for remaining 'JobPilot' references..."
    local remaining=$(find "$PROJECT_ROOT" \
        -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/dist/*" \
        -not -path "*/build/*" \
        -not -path "*/.next/*" \
        -not -path "*/backups/*" \
        -not -path "*/migration-log-*" \
        -exec grep -l "JobPilot\|jobpilot" {} \; 2>/dev/null | wc -l)

    if [ "$remaining" -gt 0 ]; then
        log_warning "Found $remaining files with remaining 'jobpilot' references"
        log_warning "Run: grep -r 'jobpilot' --exclude-dir=node_modules . to find them"
    else
        log_success "No remaining 'jobpilot' references found"
    fi

    log_success "Verification complete"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║         ApplyforUs Rebranding Migration Script v1.0           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    # Parse arguments
    for arg in "$@"; do
        case $arg in
            --dry-run)
                DRY_RUN=true
                log_warning "DRY RUN MODE - No changes will be made"
                ;;
            --backup-only)
                BACKUP_ONLY=true
                log "BACKUP ONLY MODE"
                ;;
        esac
    done

    # Create backup
    create_backup

    if [ "$BACKUP_ONLY" = true ]; then
        log_success "Backup complete. Exiting."
        exit 0
    fi

    # Execute migration steps
    log "Starting migration process..."
    log "Working directory: $PROJECT_ROOT"
    echo ""

    step1_package_names
    step2_docker_compose
    step3_kubernetes
    step4_environment_files
    step5_typescript_config
    step6_documentation
    step7_ci_cd_pipelines
    step8_source_code
    step9_config_files
    step10_terraform
    rename_files

    # Verify
    verify_changes

    # Summary
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                     Migration Summary                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    log_success "Migration process completed!"
    log "Total changes: $CHANGES"
    log "Errors encountered: $ERRORS"
    log "Backup location: $BACKUP_DIR"
    log "Log file: $LOG_FILE"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_warning "This was a DRY RUN - no actual changes were made"
        log "To perform the migration, run: ./migration_script.sh"
    else
        log "Next steps:"
        log "1. Review changes: git diff"
        log "2. Run tests: pnpm test"
        log "3. Reinstall dependencies: pnpm install"
        log "4. Build: pnpm build"
        log "5. Commit changes: git add . && git commit -m 'Rebrand to ApplyforUs'"
    fi
    echo ""

    if [ "$ERRORS" -gt 0 ]; then
        log_error "Migration completed with $ERRORS errors!"
        exit 1
    fi
}

# Run main function
main "$@"
