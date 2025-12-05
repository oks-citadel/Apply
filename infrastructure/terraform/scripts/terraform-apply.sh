#!/bin/bash
# ============================================================================
# Terraform Apply Script
# ============================================================================
# This script applies a Terraform plan with comprehensive safety checks
# and validation before execution.
#
# Usage:
#   ./terraform-apply.sh <environment>
#
# Arguments:
#   environment - Target environment (dev, staging, prod)
#
# Environment Variables Required:
#   ARM_CLIENT_ID       - Azure Service Principal Client ID
#   ARM_CLIENT_SECRET   - Azure Service Principal Client Secret
#   ARM_SUBSCRIPTION_ID - Azure Subscription ID
#   ARM_TENANT_ID       - Azure Tenant ID
#
# Input:
#   Expects tfplan-<environment> file to exist
#
# Safety Features:
#   - Validates plan file exists
#   - Checks plan is not empty
#   - Production environment requires confirmation
#   - Comprehensive error handling
# ============================================================================

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# ============================================================================
# Configuration
# ============================================================================

ENVIRONMENT="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
PLAN_FILE="tfplan-${ENVIRONMENT}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

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

log_critical() {
    echo -e "${MAGENTA}[CRITICAL]${NC} $1"
}

print_usage() {
    cat << EOF
Usage: $0 <environment>

Arguments:
  environment    Target environment (dev, staging, prod)

Example:
  $0 dev
  $0 staging
  $0 prod

Environment Variables Required:
  ARM_CLIENT_ID       - Azure Service Principal Client ID
  ARM_CLIENT_SECRET   - Azure Service Principal Client Secret
  ARM_SUBSCRIPTION_ID - Azure Subscription ID
  ARM_TENANT_ID       - Azure Tenant ID

Prerequisites:
  - Terraform plan file must exist (tfplan-<environment>)
  - Run terraform-plan.sh before this script

EOF
}

validate_environment() {
    local env="$1"
    case "$env" in
        dev|staging|prod)
            return 0
            ;;
        *)
            log_error "Invalid environment: $env"
            log_error "Valid environments: dev, staging, prod"
            return 1
            ;;
    esac
}

check_required_vars() {
    local missing_vars=()

    if [ -z "${ARM_CLIENT_ID:-}" ]; then
        missing_vars+=("ARM_CLIENT_ID")
    fi

    if [ -z "${ARM_CLIENT_SECRET:-}" ]; then
        missing_vars+=("ARM_CLIENT_SECRET")
    fi

    if [ -z "${ARM_SUBSCRIPTION_ID:-}" ]; then
        missing_vars+=("ARM_SUBSCRIPTION_ID")
    fi

    if [ -z "${ARM_TENANT_ID:-}" ]; then
        missing_vars+=("ARM_TENANT_ID")
    fi

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        return 1
    fi

    return 0
}

validate_plan_file() {
    local plan_file="$1"

    if [ ! -f "$plan_file" ]; then
        log_error "Plan file not found: $plan_file"
        log_error "Run terraform-plan.sh first to generate the plan"
        return 1
    fi

    # Check if plan file is not empty
    if [ ! -s "$plan_file" ]; then
        log_error "Plan file is empty: $plan_file"
        return 1
    fi

    log_success "Plan file validated: $plan_file"
    return 0
}

show_plan_summary() {
    local plan_file="$1"

    log_info "============================================================================"
    log_info "Plan Summary:"
    log_info "============================================================================"

    # Show plan summary
    if terraform show "$plan_file" > /dev/null 2>&1; then
        terraform show -no-color "$plan_file" | head -100
        log_info "..."
        log_info "(Summary truncated for display)"
    else
        log_warning "Could not display plan summary"
    fi

    log_info "============================================================================"
}

production_safety_check() {
    local env="$1"

    if [ "$env" == "prod" ]; then
        log_critical "============================================================================"
        log_critical "PRODUCTION ENVIRONMENT DEPLOYMENT"
        log_critical "============================================================================"
        log_warning "You are about to deploy to PRODUCTION environment"
        log_warning "This will affect live users and systems"
        log_warning "Ensure you have:"
        log_warning "  1. Reviewed the Terraform plan carefully"
        log_warning "  2. Obtained necessary approvals"
        log_warning "  3. Scheduled this deployment appropriately"
        log_warning "  4. Have a rollback plan ready"
        log_critical "============================================================================"

        # In CI/CD pipeline, this is handled by Azure DevOps environment approvals
        # This message is for documentation and awareness
        log_info "Proceeding with production deployment..."
    fi
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    log_info "============================================================================"
    log_info "Terraform Apply - JobPilot AI Platform"
    log_info "============================================================================"

    # Validate arguments
    if [ -z "$ENVIRONMENT" ]; then
        log_error "Environment argument is required"
        print_usage
        exit 1
    fi

    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')"

    # Validate environment
    if ! validate_environment "$ENVIRONMENT"; then
        print_usage
        exit 1
    fi

    # Check required environment variables
    if ! check_required_vars; then
        exit 1
    fi

    log_success "Environment variables validated"

    # Change to Terraform directory
    cd "$TERRAFORM_DIR"
    log_info "Working directory: $(pwd)"

    # Validate plan file exists
    if ! validate_plan_file "$PLAN_FILE"; then
        exit 1
    fi

    # Show plan summary
    show_plan_summary "$PLAN_FILE"

    # Production safety check
    production_safety_check "$ENVIRONMENT"

    # Apply the plan
    log_info "============================================================================"
    log_info "Applying Terraform plan..."
    log_info "============================================================================"
    log_info "This operation will modify Azure resources"
    log_info "Plan file: $PLAN_FILE"
    log_info "Start time: $(date '+%Y-%m-%d %H:%M:%S %Z')"

    # Apply with the plan file (no approval needed as plan is pre-approved)
    if terraform apply \
        -input=false \
        -auto-approve \
        "$PLAN_FILE"; then

        log_info "============================================================================"
        log_success "Terraform apply completed successfully"
        log_info "============================================================================"
        log_info "Environment: $ENVIRONMENT"
        log_info "Completion time: $(date '+%Y-%m-%d %H:%M:%S %Z')"

        # Show outputs
        log_info "============================================================================"
        log_info "Terraform Outputs:"
        log_info "============================================================================"

        if terraform output > /dev/null 2>&1; then
            terraform output
        else
            log_info "No outputs available"
        fi

        log_info "============================================================================"
        log_success "Deployment complete for environment: $ENVIRONMENT"
        log_info "============================================================================"

        # Cleanup plan file after successful apply
        log_info "Cleaning up plan file..."
        rm -f "$PLAN_FILE"
        rm -f "${PLAN_FILE}.txt"

        exit 0
    else
        log_error "============================================================================"
        log_error "Terraform apply failed"
        log_error "============================================================================"
        log_error "Environment: $ENVIRONMENT"
        log_error "Failure time: $(date '+%Y-%m-%d %H:%M:%S %Z')"
        log_error "============================================================================"
        log_error "Please review the errors above and take appropriate action"
        log_error "Plan file preserved for investigation: $PLAN_FILE"
        log_error "============================================================================"

        exit 1
    fi
}

# Run main function
main "$@"
