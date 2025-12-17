#!/bin/bash
# ============================================================================
# ACR Image Cleanup Script
# ============================================================================
# This script performs manual ACR cleanup operations:
# - Remove untagged images
# - Delete old image versions (keep last N tags)
# - Remove images older than X days
# - Generate cleanup reports
#
# Usage: ./acr-cleanup.sh [--acr-name NAME] [--dry-run] [--keep-tags N] [--older-than DAYS]

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ACR_NAME="${ACR_NAME:-applyforusacr}"
DRY_RUN="${DRY_RUN:-true}"
KEEP_TAGS="${KEEP_TAGS:-10}"
OLDER_THAN_DAYS="${OLDER_THAN_DAYS:-30}"
OUTPUT_DIR="${PROJECT_ROOT}/acr-cleanup-reports"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================================
# Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo "============================================================"
    echo " $1"
    echo "============================================================"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --acr-name)
                ACR_NAME="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --execute)
                DRY_RUN="false"
                shift
                ;;
            --keep-tags)
                KEEP_TAGS="$2"
                shift 2
                ;;
            --older-than)
                OLDER_THAN_DAYS="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

show_help() {
    cat << EOF
ACR Image Cleanup Script

Usage: $0 [OPTIONS]

Options:
    --acr-name NAME       ACR registry name [default: applyforusacr]
    --dry-run             Run in dry-run mode (no deletions) [default]
    --execute             Execute deletions (disable dry-run)
    --keep-tags N         Keep last N tags per repository [default: 10]
    --older-than DAYS     Delete images older than N days [default: 30]
    --help                Show this help message

Examples:
    # Dry run (preview only)
    $0 --acr-name applyforusacr --dry-run

    # Execute cleanup, keep last 10 tags
    $0 --acr-name applyforusacr --execute --keep-tags 10

    # Delete images older than 60 days
    $0 --acr-name applyforusacr --execute --older-than 60
EOF
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi
    log_success "Azure CLI is installed"

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    log_success "Logged in to Azure"

    # Check if ACR exists
    if ! az acr show --name "$ACR_NAME" &> /dev/null; then
        log_error "ACR not found: $ACR_NAME"
        exit 1
    fi
    log_success "ACR found: $ACR_NAME"

    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    log_success "Output directory created: $OUTPUT_DIR"
}

# Get ACR storage usage
get_storage_usage() {
    print_header "Current ACR Storage Usage"

    log_info "Fetching storage statistics for: $ACR_NAME"

    local storage_usage=$(az acr show-usage -n "$ACR_NAME" -o json)
    local size_bytes=$(echo "$storage_usage" | jq -r '.value[] | select(.name=="Size") | .currentValue')
    local size_gb=$((size_bytes / 1024 / 1024 / 1024))
    local size_limit_gb=$(($(echo "$storage_usage" | jq -r '.value[] | select(.name=="Size") | .limit') / 1024 / 1024 / 1024))

    echo ""
    echo "Storage Used:     ${size_gb}GB / ${size_limit_gb}GB"
    echo "Percentage:       $((size_gb * 100 / size_limit_gb))%"
    echo ""

    # Repository count
    local repo_count=$(az acr repository list -n "$ACR_NAME" --output tsv | wc -l)
    echo "Repositories:     $repo_count"
    echo ""
}

# List all repositories
list_repositories() {
    log_info "Listing all repositories in: $ACR_NAME"

    az acr repository list -n "$ACR_NAME" --output table
}

# Clean up untagged manifests
cleanup_untagged() {
    print_header "Cleaning Up Untagged Manifests"

    local repos=$(az acr repository list -n "$ACR_NAME" --output tsv)
    local cleanup_count=0

    for repo in $repos; do
        log_info "Processing repository: $repo"

        if [ "$DRY_RUN" == "true" ]; then
            log_warning "[DRY RUN] Would delete untagged manifests older than ${OLDER_THAN_DAYS} days"
            az acr repository show-manifests \
                --name "$ACR_NAME" \
                --repository "$repo" \
                --query "[?tags==null].[digest,lastUpdateTime]" \
                --output table || true
        else
            log_info "Deleting untagged manifests older than ${OLDER_THAN_DAYS} days..."
            # Using ACR purge command
            az acr run \
                --registry "$ACR_NAME" \
                --cmd "acr purge --filter '$repo:.*' --ago ${OLDER_THAN_DAYS}d --untagged" \
                /dev/null || true
            ((cleanup_count++))
        fi
    done

    if [ "$DRY_RUN" == "false" ]; then
        log_success "Cleaned up untagged manifests from $cleanup_count repositories"
    fi
}

# Clean up old tags (keep last N)
cleanup_old_tags() {
    print_header "Cleaning Up Old Tags (Keep Last $KEEP_TAGS)"

    local repos=$(az acr repository list -n "$ACR_NAME" --output tsv)

    for repo in $repos; do
        log_info "Processing repository: $repo"

        # Get all tags sorted by creation time
        local tags=$(az acr repository show-tags \
            --name "$ACR_NAME" \
            --repository "$repo" \
            --orderby time_desc \
            --output tsv)

        local tag_count=$(echo "$tags" | wc -l)

        if [ "$tag_count" -le "$KEEP_TAGS" ]; then
            log_info "Repository has $tag_count tags (within limit of $KEEP_TAGS). Skipping."
            continue
        fi

        local to_delete=$((tag_count - KEEP_TAGS))
        log_warning "Repository has $tag_count tags. Will delete $to_delete old tags."

        if [ "$DRY_RUN" == "true" ]; then
            log_warning "[DRY RUN] Would delete these tags:"
            echo "$tags" | tail -n "$to_delete"
        else
            # Delete old tags
            echo "$tags" | tail -n "$to_delete" | while read -r tag; do
                log_info "Deleting tag: $repo:$tag"
                az acr repository delete \
                    --name "$ACR_NAME" \
                    --image "$repo:$tag" \
                    --yes || true
            done
        fi
    done
}

# Clean up dev/staging images
cleanup_non_prod_images() {
    print_header "Cleaning Up Non-Production Images"

    if [ "$DRY_RUN" == "true" ]; then
        log_warning "[DRY RUN] Would delete dev/staging/test images older than 90 days"
        az acr run \
            --registry "$ACR_NAME" \
            --cmd "acr purge --filter '.*:(dev|staging|test)-.*' --ago 90d --dry-run" \
            /dev/null || true
    else
        log_info "Deleting non-production images older than 90 days..."
        az acr run \
            --registry "$ACR_NAME" \
            --cmd "acr purge --filter '.*:(dev|staging|test)-.*' --ago 90d" \
            /dev/null || true
    fi
}

# Generate cleanup report
generate_report() {
    local report_file="$OUTPUT_DIR/cleanup-report-$(date +%Y%m%d-%H%M%S).txt"

    print_header "Generating Cleanup Report"

    cat > "$report_file" << EOF
ACR Cleanup Report
Generated: $(date)
ACR Name: $ACR_NAME
Mode: $([ "$DRY_RUN" == "true" ] && echo "DRY RUN" || echo "EXECUTE")

Configuration:
- Keep last tags: $KEEP_TAGS
- Delete older than: $OLDER_THAN_DAYS days

Repositories:
EOF

    # List all repositories with tag counts
    local repos=$(az acr repository list -n "$ACR_NAME" --output tsv)

    for repo in $repos; do
        local tag_count=$(az acr repository show-tags --name "$ACR_NAME" --repository "$repo" --output tsv | wc -l)
        echo "  - $repo: $tag_count tags" >> "$report_file"
    done

    cat >> "$report_file" << EOF

Storage Before Cleanup:
EOF

    az acr show-usage -n "$ACR_NAME" -o table >> "$report_file"

    log_success "Report saved to: $report_file"
}

# Main execution
main() {
    parse_args "$@"

    print_header "ACR Image Cleanup - ApplyForUs Platform"

    if [ "$DRY_RUN" == "true" ]; then
        log_warning "Running in DRY-RUN mode. No changes will be made."
        log_info "Use --execute to perform actual deletions."
    else
        log_error "EXECUTE mode enabled. Images will be permanently deleted!"
        log_warning "Press Ctrl+C to cancel, or Enter to continue..."
        read -r
    fi

    check_prerequisites
    get_storage_usage
    list_repositories

    cleanup_untagged
    cleanup_old_tags
    cleanup_non_prod_images

    get_storage_usage
    generate_report

    print_header "Cleanup Complete"

    if [ "$DRY_RUN" == "true" ]; then
        log_info "This was a dry run. No changes were made."
        log_info "Run with --execute to perform actual cleanup."
    else
        log_success "Cleanup completed successfully!"
        log_info "Check the report for details: $OUTPUT_DIR"
    fi
}

# Run main function
main "$@"
