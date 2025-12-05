#!/bin/bash
# ============================================================================
# Terraform Plan Script
# ============================================================================
# This script runs terraform plan with the appropriate configuration
# for the specified environment and outputs a plan file.
#
# Usage:
#   ./terraform-plan.sh <environment>
#
# Arguments:
#   environment - Target environment (dev, staging, prod)
#
# Environment Variables Required:
#   ARM_CLIENT_ID       - Azure Service Principal Client ID
#   ARM_CLIENT_SECRET   - Azure Service Principal Client Secret
#   ARM_SUBSCRIPTION_ID - Azure Subscription ID
#   ARM_TENANT_ID       - Azure Tenant ID
#   TF_VAR_sql_admin_username - SQL Server admin username
#   TF_VAR_sql_admin_password - SQL Server admin password
#
# Output:
#   Creates tfplan-<environment> file containing the execution plan
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
  ARM_CLIENT_ID              - Azure Service Principal Client ID
  ARM_CLIENT_SECRET          - Azure Service Principal Client Secret
  ARM_SUBSCRIPTION_ID        - Azure Subscription ID
  ARM_TENANT_ID              - Azure Tenant ID
  TF_VAR_sql_admin_username  - SQL Server admin username
  TF_VAR_sql_admin_password  - SQL Server admin password

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

    if [ -z "${TF_VAR_sql_admin_username:-}" ]; then
        missing_vars+=("TF_VAR_sql_admin_username")
    fi

    if [ -z "${TF_VAR_sql_admin_password:-}" ]; then
        missing_vars+=("TF_VAR_sql_admin_password")
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

get_tfvars_file() {
    local env="$1"
    echo "environments/${env}.tfvars"
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    log_info "============================================================================"
    log_info "Terraform Plan - JobPilot AI Platform"
    log_info "============================================================================"

    # Validate arguments
    if [ -z "$ENVIRONMENT" ]; then
        log_error "Environment argument is required"
        print_usage
        exit 1
    fi

    log_info "Environment: $ENVIRONMENT"

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

    # Get tfvars file
    TFVARS_FILE=$(get_tfvars_file "$ENVIRONMENT")

    if [ ! -f "$TFVARS_FILE" ]; then
        log_error "tfvars file not found: $TFVARS_FILE"
        exit 1
    fi

    log_info "Using tfvars file: $TFVARS_FILE"
    log_info "Output plan file: $PLAN_FILE"

    # Remove old plan file if exists
    if [ -f "$PLAN_FILE" ]; then
        log_warning "Removing old plan file: $PLAN_FILE"
        rm -f "$PLAN_FILE"
    fi

    # Run terraform plan
    log_info "Generating Terraform execution plan..."
    log_info "This may take several minutes..."

    if terraform plan \
        -var-file="$TFVARS_FILE" \
        -out="$PLAN_FILE" \
        -input=false \
        -detailed-exitcode; then

        PLAN_EXIT_CODE=$?
        case $PLAN_EXIT_CODE in
            0)
                log_info "No changes detected"
                log_success "Plan completed successfully - No changes needed"
                ;;
            2)
                log_warning "Changes detected"
                log_success "Plan completed successfully - Changes will be applied"
                ;;
        esac
    else
        PLAN_EXIT_CODE=$?
        if [ $PLAN_EXIT_CODE -eq 1 ]; then
            log_error "Terraform plan failed with errors"
            exit 1
        elif [ $PLAN_EXIT_CODE -eq 0 ]; then
            log_info "No changes detected"
            log_success "Plan completed successfully"
        elif [ $PLAN_EXIT_CODE -eq 2 ]; then
            log_warning "Changes detected"
            log_success "Plan completed successfully"
        fi
    fi

    # Display plan summary
    log_info "============================================================================"
    log_info "Plan Summary:"
    log_info "============================================================================"

    terraform show "$PLAN_FILE" | head -50

    log_info "..."
    log_info "(Plan truncated for display. Full plan saved to: $PLAN_FILE)"

    # Save plan in human-readable format
    log_info "Saving human-readable plan..."
    terraform show -no-color "$PLAN_FILE" > "${PLAN_FILE}.txt"

    log_info "============================================================================"
    log_success "Plan generation complete for environment: $ENVIRONMENT"
    log_info "Plan file: $PLAN_FILE"
    log_info "Readable plan: ${PLAN_FILE}.txt"
    log_info "============================================================================"

    exit 0
}

# Run main function
main "$@"
