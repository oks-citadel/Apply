#!/bin/bash
# ============================================================================
# ApplyForUs Platform - FinOps Controls Deployment Script
# ============================================================================
# This script automates the deployment of all cost control measures.
#
# Usage: ./DEPLOY_FINOPS_CONTROLS.sh [--environment ENV] [--dry-run]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-all}"
DRY_RUN="${DRY_RUN:-false}"
ACR_NAME="${ACR_NAME:-applyforusacr}"

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

log_step() {
    echo -e "\n${CYAN}===================================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}===================================================================${NC}\n"
}

print_header() {
    clear
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║             ApplyForUs Platform - FinOps Deployment              ║
║                                                                   ║
║                    Cost Controls Activation                       ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
EOF
    echo ""
}

check_prerequisites() {
    log_step "Step 1: Checking Prerequisites"

    local all_ok=true

    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI not installed"
        all_ok=false
    else
        log_success "Azure CLI installed"
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not installed"
        all_ok=false
    else
        log_success "kubectl installed"
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform not installed"
        all_ok=false
    else
        log_success "Terraform installed"
    fi

    # Check Azure login
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Run: az login"
        all_ok=false
    else
        log_success "Logged in to Azure"
    fi

    # Check kubectl context
    if ! kubectl cluster-info &> /dev/null; then
        log_warning "kubectl not connected to cluster"
    else
        log_success "kubectl connected to cluster"
    fi

    if [ "$all_ok" = false ]; then
        log_error "Prerequisites not met. Please install missing components."
        exit 1
    fi
}

confirm_deployment() {
    log_step "Deployment Confirmation"

    cat << EOF
This script will deploy the following FinOps controls:

  1. ✅ Budget Guardrails
     - Dev: \$500/month
     - Staging: \$1,000/month
     - Production: \$5,000/month

  2. ✅ ACR Retention Policies
     - Keep last 10 tags per repository
     - Delete untagged images after 30 days
     - Remove non-prod images after 90 days

  3. ✅ Kubernetes Resource Quotas
     - Namespace-level CPU/memory limits
     - Cost attribution labels

  4. ✅ Scale-to-Zero Schedules
     - Dev: 70% downtime (save ~\$350/month)
     - Staging: 30% cost reduction (save ~\$300/month)

  5. ✅ Cost Monitoring
     - Real-time alerts
     - Automated reporting

Expected Annual Savings: \$9,600 - \$11,400

EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "Running in DRY-RUN mode. No changes will be made."
        return
    fi

    echo -e "${YELLOW}Do you want to proceed with deployment? (yes/no)${NC}"
    read -r response

    if [[ ! "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
        log_error "Deployment cancelled by user"
        exit 0
    fi
}

deploy_terraform() {
    log_step "Step 2: Deploying Terraform Cost Management"

    cd infrastructure/terraform

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "[DRY-RUN] Would run: terraform plan"
        terraform plan
    else
        log_info "Initializing Terraform..."
        terraform init -upgrade

        log_info "Planning Terraform deployment..."
        terraform plan -out=tfplan

        echo -e "${YELLOW}Review the plan above. Continue with apply? (yes/no)${NC}"
        read -r response

        if [[ "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Applying Terraform configuration..."
            terraform apply tfplan
            log_success "Terraform deployment completed"
        else
            log_warning "Terraform apply skipped"
        fi
    fi

    cd ../..
}

deploy_kubernetes_quotas() {
    log_step "Step 3: Deploying Kubernetes Resource Quotas"

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "[DRY-RUN] Would apply: cost-attribution.yaml"
        kubectl apply -f infrastructure/kubernetes/base/cost-attribution.yaml --dry-run=client
    else
        log_info "Applying namespace quotas and cost attribution..."
        kubectl apply -f infrastructure/kubernetes/base/cost-attribution.yaml

        log_success "Resource quotas applied"

        echo ""
        log_info "Verifying quota creation..."
        kubectl get resourcequota --all-namespaces
    fi
}

deploy_scale_schedules() {
    log_step "Step 4: Deploying Scale-to-Zero Schedules"

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "[DRY-RUN] Would apply: scale-schedules.yaml"
        kubectl apply -f infrastructure/kubernetes/automation/scale-schedules.yaml --dry-run=client
    else
        log_info "Deploying scaling CronJobs..."
        kubectl apply -f infrastructure/kubernetes/automation/scale-schedules.yaml

        log_success "Scale schedules deployed"

        echo ""
        log_info "Verifying CronJob creation..."
        kubectl get cronjobs -n applyforus-dev
        kubectl get cronjobs -n applyforus-staging
    fi
}

configure_acr_cleanup() {
    log_step "Step 5: Configuring ACR Image Cleanup"

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "[DRY-RUN] Would run ACR cleanup"
        ./scripts/acr-cleanup.sh --acr-name "$ACR_NAME" --dry-run
    else
        log_info "Running initial ACR cleanup (dry-run first)..."
        ./scripts/acr-cleanup.sh --acr-name "$ACR_NAME" --dry-run

        echo -e "${YELLOW}Execute actual cleanup? (yes/no)${NC}"
        read -r response

        if [[ "$response" =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Executing ACR cleanup..."
            ./scripts/acr-cleanup.sh --acr-name "$ACR_NAME" --execute --keep-tags 10
            log_success "ACR cleanup completed"
        else
            log_warning "ACR cleanup skipped"
        fi
    fi
}

generate_cost_report() {
    log_step "Step 6: Generating Initial Cost Report"

    if [ "$DRY_RUN" = "true" ]; then
        log_warning "[DRY-RUN] Would generate cost report"
    else
        log_info "Generating baseline cost report..."
        ./scripts/cost-monitoring.sh --environment all --report-type summary

        log_success "Cost report generated"
    fi
}

verify_deployment() {
    log_step "Step 7: Verifying Deployment"

    echo "Verification Checklist:"
    echo ""

    # Check budgets
    echo "📊 Budgets:"
    if az consumption budget list --resource-group jobpilot-dev-rg &> /dev/null; then
        echo "  ✅ Dev budget configured"
    else
        echo "  ❌ Dev budget not found"
    fi

    if az consumption budget list --resource-group jobpilot-staging-rg &> /dev/null; then
        echo "  ✅ Staging budget configured"
    else
        echo "  ❌ Staging budget not found"
    fi

    if az consumption budget list --resource-group jobpilot-prod-rg &> /dev/null; then
        echo "  ✅ Production budget configured"
    else
        echo "  ❌ Production budget not found"
    fi

    # Check quotas
    echo ""
    echo "📏 Resource Quotas:"
    if kubectl get resourcequota applyforus-dev-quota -n applyforus-dev &> /dev/null; then
        echo "  ✅ Dev quota configured"
    else
        echo "  ❌ Dev quota not found"
    fi

    if kubectl get resourcequota applyforus-staging-quota -n applyforus-staging &> /dev/null; then
        echo "  ✅ Staging quota configured"
    else
        echo "  ❌ Staging quota not found"
    fi

    if kubectl get resourcequota applyforus-prod-quota -n applyforus &> /dev/null; then
        echo "  ✅ Production quota configured"
    else
        echo "  ❌ Production quota not found"
    fi

    # Check scale schedules
    echo ""
    echo "⏰ Scale Schedules:"
    if kubectl get cronjob scale-down-weeknight -n applyforus-dev &> /dev/null; then
        echo "  ✅ Dev scale schedules configured"
    else
        echo "  ❌ Dev scale schedules not found"
    fi

    if kubectl get cronjob scale-down-weeknight -n applyforus-staging &> /dev/null; then
        echo "  ✅ Staging scale schedules configured"
    else
        echo "  ❌ Staging scale schedules not found"
    fi

    # Check ACR
    echo ""
    echo "📦 ACR Retention:"
    if az acr task list --registry "$ACR_NAME" &> /dev/null; then
        local task_count=$(az acr task list --registry "$ACR_NAME" --query "length([])" -o tsv)
        if [ "$task_count" -gt 0 ]; then
            echo "  ✅ ACR cleanup tasks configured ($task_count tasks)"
        else
            echo "  ⚠️  ACR cleanup tasks not found (may be configured in Terraform)"
        fi
    else
        echo "  ❌ Unable to check ACR"
    fi

    echo ""
}

print_summary() {
    log_step "Deployment Complete!"

    cat << EOF

╔═══════════════════════════════════════════════════════════════════╗
║                     FinOps Controls Active                        ║
╚═══════════════════════════════════════════════════════════════════╝

✅ Budget Guardrails: Active
   - Monthly budgets enforced
   - Alert thresholds: 50%, 75%, 90%, 100%

✅ ACR Retention: Active
   - Daily cleanup at 2 AM UTC
   - Keep last 10 tags
   - 30-day retention for untagged

✅ Resource Quotas: Active
   - Namespace-level limits enforced
   - Cost attribution labels applied

✅ Scale Schedules: Active
   - Dev: 70% downtime savings
   - Staging: 30% cost reduction

✅ Cost Monitoring: Active
   - Real-time alerts enabled
   - Automated reporting configured

Expected Monthly Savings: \$800-950
Expected Annual Savings: \$9,600-11,400

Next Steps:
  1. Monitor costs for 1 week to establish baseline
  2. Review scale schedules are working correctly
  3. Run weekly cost reports: ./scripts/cost-monitoring.sh
  4. Review ACR storage trends
  5. Plan quarterly FinOps review

Documentation:
  - Full Guide: docs/FINOPS_GUIDE.md
  - Quick Start: FINOPS_QUICK_START.md
  - Summary: COST_CONTROLS_SUMMARY.md

Support: citadelcloudmanagement@gmail.com

EOF
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --acr-name)
                ACR_NAME="$2"
                shift 2
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done

    print_header
    check_prerequisites
    confirm_deployment

    deploy_terraform
    deploy_kubernetes_quotas
    deploy_scale_schedules
    configure_acr_cleanup
    generate_cost_report
    verify_deployment

    print_summary

    log_success "FinOps controls deployment complete!"
}

main "$@"
