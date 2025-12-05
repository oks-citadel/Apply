#!/bin/bash
# ============================================================================
# Terraform Init Script
# ============================================================================
# This script initializes Terraform with the appropriate backend configuration
# for the specified environment.
#
# Usage:
#   ./terraform-init.sh <environment>
#
# Arguments:
#   environment - Target environment (dev, staging, prod, validation)
#
# Environment Variables Required:
#   ARM_CLIENT_ID       - Azure Service Principal Client ID
#   ARM_CLIENT_SECRET   - Azure Service Principal Client Secret
#   ARM_SUBSCRIPTION_ID - Azure Subscription ID
#   ARM_TENANT_ID       - Azure Tenant ID
#
# Backend Configuration:
#   Backend configuration is stored in Azure Storage Account
#   Each environment has its own state file for isolation
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
  environment    Target environment (dev, staging, prod, validation)

Example:
  $0 dev
  $0 staging
  $0 prod
  $0 validation

Environment Variables Required:
  ARM_CLIENT_ID       - Azure Service Principal Client ID
  ARM_CLIENT_SECRET   - Azure Service Principal Client Secret
  ARM_SUBSCRIPTION_ID - Azure Subscription ID
  ARM_TENANT_ID       - Azure Tenant ID

EOF
}

validate_environment() {
    local env="$1"
    case "$env" in
        dev|staging|prod|validation)
            return 0
            ;;
        *)
            log_error "Invalid environment: $env"
            log_error "Valid environments: dev, staging, prod, validation"
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

get_backend_config() {
    local env="$1"

    # Backend configuration
    # These values should match your Azure Storage Account backend
    # Update these values according to your actual backend configuration

    case "$env" in
        validation)
            # Validation uses a minimal backend for syntax checks
            echo "validation"
            ;;
        dev)
            echo "dev"
            ;;
        staging)
            echo "staging"
            ;;
        prod)
            echo "prod"
            ;;
    esac
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    log_info "============================================================================"
    log_info "Terraform Init - JobPilot AI Platform"
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

    # Get backend configuration
    BACKEND_KEY=$(get_backend_config "$ENVIRONMENT")
    log_info "Backend state file: terraform-${BACKEND_KEY}.tfstate"

    # Change to Terraform directory
    cd "$TERRAFORM_DIR"
    log_info "Working directory: $(pwd)"

    # Backend configuration from environment variables or Azure DevOps variable groups
    # These should be set in your pipeline or environment
    BACKEND_STORAGE_ACCOUNT="${BACKEND_STORAGE_ACCOUNT:-jobpilotterraform}"
    BACKEND_CONTAINER_NAME="${BACKEND_CONTAINER_NAME:-tfstate}"
    BACKEND_RESOURCE_GROUP="${BACKEND_RESOURCE_GROUP:-jobpilot-terraform-backend}"

    log_info "Backend Configuration:"
    log_info "  Storage Account: $BACKEND_STORAGE_ACCOUNT"
    log_info "  Container: $BACKEND_CONTAINER_NAME"
    log_info "  Resource Group: $BACKEND_RESOURCE_GROUP"
    log_info "  State File: terraform-${BACKEND_KEY}.tfstate"

    # Initialize Terraform with backend configuration
    log_info "Initializing Terraform..."

    if terraform init \
        -backend-config="storage_account_name=${BACKEND_STORAGE_ACCOUNT}" \
        -backend-config="container_name=${BACKEND_CONTAINER_NAME}" \
        -backend-config="key=terraform-${BACKEND_KEY}.tfstate" \
        -backend-config="resource_group_name=${BACKEND_RESOURCE_GROUP}" \
        -backend-config="subscription_id=${ARM_SUBSCRIPTION_ID}" \
        -backend-config="tenant_id=${ARM_TENANT_ID}" \
        -backend-config="client_id=${ARM_CLIENT_ID}" \
        -backend-config="client_secret=${ARM_CLIENT_SECRET}" \
        -upgrade \
        -reconfigure; then

        log_success "Terraform initialized successfully"

        # Display Terraform version
        log_info "Terraform version:"
        terraform version

        log_info "============================================================================"
        log_success "Initialization complete for environment: $ENVIRONMENT"
        log_info "============================================================================"

        exit 0
    else
        log_error "Terraform initialization failed"
        exit 1
    fi
}

# Run main function
main "$@"
