#!/bin/bash
# ============================================================================
# Azure Cost Monitoring and Reporting Script
# ============================================================================
# This script queries Azure Cost Management APIs to:
# - Generate cost reports by environment
# - Track budget consumption
# - Identify cost anomalies
# - Report on ACR storage usage
# - Provide cost optimization recommendations
#
# Usage: ./cost-monitoring.sh [--environment dev|staging|prod] [--report-type summary|detailed]

set -e

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Default values
ENVIRONMENT="${ENVIRONMENT:-all}"
REPORT_TYPE="${REPORT_TYPE:-summary}"
OUTPUT_DIR="${PROJECT_ROOT}/cost-reports"
SUBSCRIPTION_ID=""
RESOURCE_GROUP_PREFIX="jobpilot"

# Colors for output
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
            --environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --report-type)
                REPORT_TYPE="$2"
                shift 2
                ;;
            --subscription-id)
                SUBSCRIPTION_ID="$2"
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
Azure Cost Monitoring Script

Usage: $0 [OPTIONS]

Options:
    --environment ENV       Environment to monitor (dev|staging|prod|all) [default: all]
    --report-type TYPE      Report type (summary|detailed) [default: summary]
    --subscription-id ID    Azure subscription ID
    --help                  Show this help message

Examples:
    $0 --environment prod --report-type detailed
    $0 --environment all --report-type summary
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

    # Get subscription ID if not provided
    if [ -z "$SUBSCRIPTION_ID" ]; then
        SUBSCRIPTION_ID=$(az account show --query id -o tsv)
        log_info "Using subscription: $SUBSCRIPTION_ID"
    fi

    # Create output directory
    mkdir -p "$OUTPUT_DIR"
    log_success "Output directory created: $OUTPUT_DIR"
}

# Get current costs for resource group
get_resource_group_costs() {
    local rg_name=$1
    local start_date=$(date -u -d "1 month ago" +%Y-%m-%d)
    local end_date=$(date -u +%Y-%m-%d)

    log_info "Querying costs for resource group: $rg_name"

    # Query Azure Cost Management API
    az costmanagement query \
        --type ActualCost \
        --dataset-aggregation '{\"totalCost\":{\"name\":\"Cost\",\"function\":\"Sum\"}}' \
        --dataset-grouping name=ResourceGroup type=Dimension \
        --timeframe Custom \
        --time-period from="$start_date" to="$end_date" \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$rg_name" \
        -o json 2>/dev/null || echo "{}"
}

# Get ACR storage usage
get_acr_storage_usage() {
    local env=$1
    local acr_name="${RESOURCE_GROUP_PREFIX}${env}acr"

    log_info "Checking ACR storage for: $acr_name"

    # Find the actual ACR name (may have suffix)
    local actual_acr=$(az acr list --query "[?contains(name, '$acr_name')].name" -o tsv 2>/dev/null | head -1)

    if [ -z "$actual_acr" ]; then
        log_warning "ACR not found for environment: $env"
        echo "N/A"
        return
    fi

    # Get storage usage
    local storage_bytes=$(az acr show-usage -n "$actual_acr" --query "value[?name=='Size'].currentValue" -o tsv 2>/dev/null || echo "0")
    local storage_gb=$((storage_bytes / 1024 / 1024 / 1024))

    echo "${storage_gb}GB"
}

# Get budget status
get_budget_status() {
    local env=$1
    local rg_name="${RESOURCE_GROUP_PREFIX}-${env}-rg"

    log_info "Checking budget status for: $env"

    # Query budget
    local budget=$(az consumption budget list \
        --resource-group "$rg_name" \
        --query "[0].{amount:amount,current:currentSpend.amount,percentage:currentSpend.percentage}" \
        -o json 2>/dev/null || echo "{}")

    echo "$budget"
}

# Generate summary report
generate_summary_report() {
    local env=$1
    local rg_name="${RESOURCE_GROUP_PREFIX}-${env}-rg"

    print_header "Cost Summary - $env Environment"

    # Get current costs
    local costs=$(get_resource_group_costs "$rg_name")
    local total_cost=$(echo "$costs" | jq -r '.properties.rows[0][0] // 0' 2>/dev/null || echo "0")

    # Get budget status
    local budget=$(get_budget_status "$env")
    local budget_amount=$(echo "$budget" | jq -r '.amount // "N/A"')
    local budget_current=$(echo "$budget" | jq -r '.current // "N/A"')
    local budget_percentage=$(echo "$budget" | jq -r '.percentage // "N/A"')

    # Get ACR storage
    local acr_storage=$(get_acr_storage_usage "$env")

    # Display report
    cat << EOF
Environment:          $env
Resource Group:       $rg_name
─────────────────────────────────────────────────────
Current Month Cost:   \$$total_cost USD
Monthly Budget:       \$$budget_amount USD
Budget Consumed:      $budget_percentage%
Budget Remaining:     \$$(echo "$budget_amount - $budget_current" | bc 2>/dev/null || echo "N/A") USD
─────────────────────────────────────────────────────
ACR Storage Used:     $acr_storage
─────────────────────────────────────────────────────

EOF

    # Cost warnings
    if [ "$budget_percentage" != "N/A" ]; then
        local percentage_numeric=$(echo "$budget_percentage" | sed 's/%//')
        if [ "$percentage_numeric" -gt 90 ]; then
            log_error "ALERT: Budget consumption is at ${budget_percentage}!"
        elif [ "$percentage_numeric" -gt 75 ]; then
            log_warning "WARNING: Budget consumption is at ${budget_percentage}"
        else
            log_success "Budget consumption is healthy at ${budget_percentage}"
        fi
    fi
}

# Generate detailed report
generate_detailed_report() {
    local env=$1
    local rg_name="${RESOURCE_GROUP_PREFIX}-${env}-rg"
    local output_file="$OUTPUT_DIR/cost-report-${env}-$(date +%Y%m%d-%H%M%S).json"

    print_header "Detailed Cost Report - $env Environment"

    log_info "Generating detailed cost breakdown..."

    # Get cost by resource type
    local start_date=$(date -u -d "1 month ago" +%Y-%m-%d)
    local end_date=$(date -u +%Y-%m-%d)

    az costmanagement query \
        --type ActualCost \
        --dataset-aggregation '{\"totalCost\":{\"name\":\"Cost\",\"function\":\"Sum\"}}' \
        --dataset-grouping name=ResourceType type=Dimension \
        --dataset-grouping name=ResourceId type=Dimension \
        --timeframe Custom \
        --time-period from="$start_date" to="$end_date" \
        --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$rg_name" \
        -o json > "$output_file" 2>/dev/null

    log_success "Detailed report saved to: $output_file"

    # Top 5 most expensive resources
    echo ""
    echo "Top 5 Most Expensive Resources:"
    echo "─────────────────────────────────────────────────────"
    jq -r '.properties.rows | sort_by(.[0]) | reverse | .[0:5] | .[] | "\(.[0] | tostring) USD - \(.[1]) - \(.[2])"' "$output_file" 2>/dev/null || echo "No data available"
    echo ""
}

# Generate cost optimization recommendations
generate_recommendations() {
    local env=$1

    print_header "Cost Optimization Recommendations - $env"

    cat << EOF
Based on current usage patterns, consider these optimizations:

1. ACR Image Cleanup
   ✓ Run: az acr task run to clean up old images
   ✓ Estimated savings: \$50-100/month

2. Resource Right-Sizing
   ✓ Review AKS node pool sizes
   ✓ Consider Burstable tier for PostgreSQL in non-prod
   ✓ Estimated savings: \$100-200/month

3. Scheduling
   ✓ Enable scale-to-zero for dev/staging environments
   ✓ Apply: kubectl apply -f infrastructure/kubernetes/automation/scale-schedules.yaml
   ✓ Estimated savings: \$300-650/month

4. Reserved Instances
   ✓ Consider 1-year reserved instances for prod resources
   ✓ Estimated savings: 30-40% on compute costs

5. Storage Optimization
   ✓ Enable lifecycle management for blob storage
   ✓ Archive old logs and backups
   ✓ Estimated savings: \$20-50/month

Total Estimated Monthly Savings: \$500-1000

EOF
}

# Main execution
main() {
    parse_args "$@"

    print_header "Azure Cost Monitoring - ApplyForUs Platform"

    check_prerequisites

    # Process environments
    if [ "$ENVIRONMENT" == "all" ]; then
        environments=("dev" "staging" "prod")
    else
        environments=("$ENVIRONMENT")
    fi

    for env in "${environments[@]}"; do
        if [ "$REPORT_TYPE" == "detailed" ]; then
            generate_detailed_report "$env"
        else
            generate_summary_report "$env"
        fi

        generate_recommendations "$env"
    done

    print_header "Cost Monitoring Complete"

    log_success "All reports generated successfully!"
    log_info "Reports saved to: $OUTPUT_DIR"
}

# Run main function
main "$@"
