#!/bin/bash

# ============================================================================
# APPLYFORUS QUICK START DEPLOYMENT
# ============================================================================
# One-command deployment for ApplyForUs platform to Azure AKS
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

print_banner() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                           ║"
    echo "║     ██████╗ ██████╗ ██████╗ ██╗  ██╗   ██╗███████╗ ██████╗ ██████╗        ║"
    echo "║    ██╔══██╗██╔══██╗██╔══██╗██║  ╚██╗ ██╔╝██╔════╝██╔═══██╗██╔══██╗       ║"
    echo "║    ███████║██████╔╝██████╔╝██║   ╚████╔╝ █████╗  ██║   ██║██████╔╝       ║"
    echo "║    ██╔══██║██╔═══╝ ██╔═══╝ ██║    ╚██╔╝  ██╔══╝  ██║   ██║██╔══██╗       ║"
    echo "║    ██║  ██║██║     ██║     ███████╗██║   ██║     ╚██████╔╝██║  ██║       ║"
    echo "║    ╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═╝   ╚═╝      ╚═════╝ ╚═╝  ╚═╝       ║"
    echo "║                                                                           ║"
    echo "║                    Quick Start Deployment Script                          ║"
    echo "║                                                                           ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Default configuration
ENVIRONMENT="${ENVIRONMENT:-prod}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
SKIP_INFRA="${SKIP_INFRA:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Quick start deployment for ApplyForUs platform to Azure AKS.

Options:
  -e, --environment    Environment (dev|staging|prod) [default: prod]
  --skip-validation    Skip pre-deployment validation
  --skip-build         Skip Docker image build
  --skip-infra         Skip Terraform infrastructure deployment
  --auto-approve       Auto-approve all prompts
  -h, --help           Show this help

Environment Variables:
  RESOURCE_GROUP       Azure resource group [default: applyforus-prod-rg]
  SUBSCRIPTION_ID      Azure subscription ID
  ACR_NAME            Azure Container Registry name [default: applyforusacr]
  AKS_CLUSTER_NAME    AKS cluster name [default: applyforus-aks]
  IMAGE_TAG           Docker image tag [default: git SHA]

Examples:
  $0                          # Full production deployment
  $0 -e dev                   # Deploy to development
  $0 --skip-infra             # Skip infrastructure, deploy app only
  $0 --auto-approve           # Non-interactive deployment

EOF
    exit 0
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --skip-validation)
            SKIP_VALIDATION="true"
            shift
            ;;
        --skip-build)
            SKIP_BUILD="true"
            shift
            ;;
        --skip-infra)
            SKIP_INFRA="true"
            shift
            ;;
        --auto-approve)
            AUTO_APPROVE="true"
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# ============================================================================
# MAIN DEPLOYMENT
# ============================================================================

main() {
    print_banner

    echo "Configuration:"
    echo "  Environment: $ENVIRONMENT"
    echo "  Skip Validation: $SKIP_VALIDATION"
    echo "  Skip Build: $SKIP_BUILD"
    echo "  Skip Infra: $SKIP_INFRA"
    echo "  Auto Approve: $AUTO_APPROVE"
    echo ""

    # Confirmation
    if [ "$AUTO_APPROVE" != "true" ]; then
        read -p "Proceed with deployment? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi

    local START_TIME=$(date +%s)

    # Step 1: Validation
    if [ "$SKIP_VALIDATION" != "true" ]; then
        log_step "Step 1/5: Running pre-deployment validation..."
        if "$SCRIPT_DIR/validate.sh" -e "$ENVIRONMENT"; then
            log_success "Validation passed!"
        else
            log_error "Validation failed!"
            if [ "$AUTO_APPROVE" != "true" ]; then
                read -p "Continue anyway? (y/N) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
        fi
    else
        log_warning "Step 1/5: Skipping validation"
    fi

    # Step 2: Setup Helm
    log_step "Step 2/5: Setting up Helm repositories..."
    "$SCRIPT_DIR/setup-helm.sh" repos

    # Step 3: Build and Push Images
    if [ "$SKIP_BUILD" != "true" ]; then
        log_step "Step 3/5: Building and pushing Docker images..."
        "$SCRIPT_DIR/setup-acr.sh" build-push
    else
        log_warning "Step 3/5: Skipping Docker build"
    fi

    # Step 4: Deploy Infrastructure
    if [ "$SKIP_INFRA" != "true" ]; then
        log_step "Step 4/5: Deploying infrastructure with Terraform..."
        if [ "$AUTO_APPROVE" == "true" ]; then
            AUTO_APPROVE=true "$SCRIPT_DIR/aks-deploy.sh" -e "$ENVIRONMENT" infra
        else
            "$SCRIPT_DIR/aks-deploy.sh" -e "$ENVIRONMENT" infra
        fi
    else
        log_warning "Step 4/5: Skipping infrastructure deployment"
    fi

    # Step 5: Deploy Application
    log_step "Step 5/5: Deploying application to AKS..."
    "$SCRIPT_DIR/aks-deploy.sh" -e "$ENVIRONMENT" app

    # Summary
    local END_TIME=$(date +%s)
    local DURATION=$((END_TIME - START_TIME))
    local MINUTES=$((DURATION / 60))
    local SECONDS=$((DURATION % 60))

    echo ""
    echo "╔═══════════════════════════════════════════════════════════════════════════╗"
    echo "║                        DEPLOYMENT COMPLETE                                ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "  Environment: $ENVIRONMENT"
    echo "  Duration: ${MINUTES}m ${SECONDS}s"
    echo ""
    echo "  Next Steps:"
    echo "    1. Configure DNS to point to the ingress IP"
    echo "    2. Verify SSL certificates are issued"
    echo "    3. Run smoke tests: $SCRIPT_DIR/../smoke-tests.sh"
    echo ""
    echo "  Useful Commands:"
    echo "    kubectl get pods -n applyforus"
    echo "    kubectl logs -n applyforus -l app.kubernetes.io/part-of=applyforus"
    echo "    helm list -n applyforus"
    echo ""

    log_success "Deployment completed successfully!"
}

main
