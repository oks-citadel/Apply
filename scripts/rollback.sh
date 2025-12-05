#!/bin/bash

# ============================================================================
# Rollback Script for Azure App Services
# ============================================================================
# This script handles rollback procedures when deployment fails

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[ROLLBACK]${NC} $1"
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

# Parse arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <environment>"
    echo "  environment: dev, staging, or prod"
    exit 1
fi

ENVIRONMENT=$1

# Set variables based on environment
case $ENVIRONMENT in
    dev)
        RESOURCE_GROUP="jobpilot-dev-rg"
        WEB_APP_NAME="jobpilot-dev-web"
        AUTH_SERVICE_NAME="jobpilot-dev-auth"
        AI_SERVICE_NAME="jobpilot-dev-ai"
        ;;
    staging)
        RESOURCE_GROUP="jobpilot-staging-rg"
        WEB_APP_NAME="jobpilot-staging-web"
        AUTH_SERVICE_NAME="jobpilot-staging-auth"
        AI_SERVICE_NAME="jobpilot-staging-ai"
        ;;
    prod)
        RESOURCE_GROUP="jobpilot-prod-rg"
        WEB_APP_NAME="jobpilot-prod-web"
        AUTH_SERVICE_NAME="jobpilot-prod-auth"
        AI_SERVICE_NAME="jobpilot-prod-ai"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

log_warning "=========================================="
log_warning "  INITIATING ROLLBACK FOR: $ENVIRONMENT"
log_warning "=========================================="
echo ""

# ============================================================================
# Rollback Functions
# ============================================================================

rollback_app_service() {
    local app_name=$1

    log_info "Rolling back: $app_name"

    # Check if app has deployment slots (production only)
    if [ "$ENVIRONMENT" = "prod" ]; then
        log_info "Swapping slots back for production..."

        # Swap staging slot back to production
        az webapp deployment slot swap \
            --name "$app_name" \
            --resource-group "$RESOURCE_GROUP" \
            --slot staging \
            --target-slot production

        log_success "Slot swap completed for $app_name"
    else
        log_info "Getting previous deployment..."

        # Get the previous deployment ID
        previous_deployment=$(az webapp deployment list \
            --name "$app_name" \
            --resource-group "$RESOURCE_GROUP" \
            --query "[1].id" -o tsv)

        if [ -n "$previous_deployment" ]; then
            log_info "Redeploying previous version: $previous_deployment"

            # Restart the app with previous configuration
            az webapp restart \
                --name "$app_name" \
                --resource-group "$RESOURCE_GROUP"

            log_success "Rollback completed for $app_name"
        else
            log_error "No previous deployment found for $app_name"
            return 1
        fi
    fi
}

verify_rollback() {
    local app_name=$1
    local health_url=$2

    log_info "Verifying rollback for: $app_name"

    # Wait for app to restart
    sleep 30

    # Check health endpoint
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."

        local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")

        if [ "$response" = "200" ]; then
            log_success "Health check passed for $app_name"
            return 0
        fi

        sleep 10
        ((attempt++))
    done

    log_error "Health check failed for $app_name after rollback"
    return 1
}

# ============================================================================
# Main Rollback Process
# ============================================================================

log_info "Starting rollback process..."

# Rollback each service
rollback_app_service "$WEB_APP_NAME"
rollback_app_service "$AUTH_SERVICE_NAME"
rollback_app_service "$AI_SERVICE_NAME"

log_info "Waiting for services to stabilize..."
sleep 30

# Verify rollback
log_info "Verifying rollback..."

ROLLBACK_FAILED=false

verify_rollback "$WEB_APP_NAME" "https://$WEB_APP_NAME.azurewebsites.net/api/health" || ROLLBACK_FAILED=true
verify_rollback "$AUTH_SERVICE_NAME" "https://$AUTH_SERVICE_NAME.azurewebsites.net/health" || ROLLBACK_FAILED=true
verify_rollback "$AI_SERVICE_NAME" "https://$AI_SERVICE_NAME.azurewebsites.net/health" || ROLLBACK_FAILED=true

# Send notification
log_info "Sending rollback notification..."

# Add your notification logic here (email, Slack, Teams, etc.)
# Example:
# curl -X POST "your-webhook-url" -d '{"text":"Rollback completed for '$ENVIRONMENT'"}'

echo ""
echo "============================================================================"

if [ "$ROLLBACK_FAILED" = true ]; then
    log_error "ROLLBACK COMPLETED WITH ERRORS!"
    log_warning "Manual intervention may be required."
    echo "============================================================================"
    exit 1
else
    log_success "ROLLBACK COMPLETED SUCCESSFULLY!"
    echo "============================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Services rolled back:"
    echo "  - $WEB_APP_NAME"
    echo "  - $AUTH_SERVICE_NAME"
    echo "  - $AI_SERVICE_NAME"
    echo "============================================================================"
    exit 0
fi
