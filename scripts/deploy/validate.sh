#!/bin/bash

# ============================================================================
# PRE-DEPLOYMENT VALIDATION SCRIPT
# ============================================================================
# Validates infrastructure, configurations, and readiness before deployment
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
INFRASTRUCTURE_DIR="$PROJECT_ROOT/infrastructure"
TERRAFORM_DIR="$INFRASTRUCTURE_DIR/terraform"
HELM_DIR="$INFRASTRUCTURE_DIR/helm"
K8S_DIR="$INFRASTRUCTURE_DIR/kubernetes"

# Default values
ENVIRONMENT="${ENVIRONMENT:-prod}"
RESOURCE_GROUP="${RESOURCE_GROUP:-applyforus-prod-rg}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-ba233460-2dbe-4603-a594-68f93ec9deb3}"
ACR_NAME="${ACR_NAME:-applyforusacr}"
AKS_CLUSTER_NAME="${AKS_CLUSTER_NAME:-applyforus-aks}"
NAMESPACE="${NAMESPACE:-applyforus}"

# Validation results
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; ERRORS=$((ERRORS + 1)); }
log_section() { echo -e "\n${CYAN}=== $1 ===${NC}"; }

# ============================================================================
# TOOL VALIDATION
# ============================================================================

validate_tools() {
    log_section "Validating Required Tools"

    local REQUIRED_TOOLS=("az" "kubectl" "helm" "terraform" "docker" "jq" "git" "curl")

    for tool in "${REQUIRED_TOOLS[@]}"; do
        if command -v "$tool" &>/dev/null; then
            local version=$($tool --version 2>&1 | head -n 1 || echo "unknown")
            log_success "$tool: $version"
        else
            log_error "$tool is not installed"
        fi
    done

    # Check tool versions
    log_info "Checking minimum versions..."

    # Terraform >= 1.5
    if command -v terraform &>/dev/null; then
        local tf_version=$(terraform version -json | jq -r '.terraform_version' 2>/dev/null || echo "0.0.0")
        if [[ "$(printf '%s\n' "1.5.0" "$tf_version" | sort -V | head -n1)" == "1.5.0" ]]; then
            log_success "Terraform version $tf_version >= 1.5.0"
        else
            log_warning "Terraform version $tf_version < 1.5.0 (recommended: >= 1.5.0)"
        fi
    fi

    # Helm >= 3.12
    if command -v helm &>/dev/null; then
        local helm_version=$(helm version --short | grep -oE 'v[0-9]+\.[0-9]+' | tr -d 'v')
        if [[ "$(printf '%s\n' "3.12" "$helm_version" | sort -V | head -n1)" == "3.12" ]]; then
            log_success "Helm version $helm_version >= 3.12"
        else
            log_warning "Helm version $helm_version < 3.12 (recommended: >= 3.12)"
        fi
    fi

    # kubectl >= 1.28
    if command -v kubectl &>/dev/null; then
        local kubectl_version=$(kubectl version --client -o json 2>/dev/null | jq -r '.clientVersion.minor' || echo "0")
        if [ "$kubectl_version" -ge 28 ]; then
            log_success "kubectl version 1.$kubectl_version >= 1.28"
        else
            log_warning "kubectl version 1.$kubectl_version < 1.28 (recommended: >= 1.28)"
        fi
    fi
}

# ============================================================================
# AZURE VALIDATION
# ============================================================================

validate_azure() {
    log_section "Validating Azure Configuration"

    # Check Azure login
    if az account show &>/dev/null; then
        local current_sub=$(az account show --query name -o tsv)
        log_success "Logged in to Azure: $current_sub"
    else
        log_error "Not logged in to Azure"
        return
    fi

    # Set and verify subscription
    az account set --subscription "$SUBSCRIPTION_ID" 2>/dev/null
    local active_sub=$(az account show --query id -o tsv)
    if [ "$active_sub" == "$SUBSCRIPTION_ID" ]; then
        log_success "Subscription set: $SUBSCRIPTION_ID"
    else
        log_error "Failed to set subscription: $SUBSCRIPTION_ID"
    fi

    # Check resource group
    if az group show --name "$RESOURCE_GROUP" &>/dev/null; then
        local location=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
        log_success "Resource group exists: $RESOURCE_GROUP ($location)"
    else
        log_warning "Resource group does not exist: $RESOURCE_GROUP (will be created)"
    fi

    # Check ACR
    if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        local acr_login=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
        log_success "ACR exists: $acr_login"
    else
        log_warning "ACR does not exist: $ACR_NAME (will be created)"
    fi

    # Check AKS
    if az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        local aks_version=$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" --query kubernetesVersion -o tsv)
        local aks_state=$(az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" --query provisioningState -o tsv)
        log_success "AKS exists: $AKS_CLUSTER_NAME (k8s: $aks_version, state: $aks_state)"
    else
        log_warning "AKS does not exist: $AKS_CLUSTER_NAME (will be created)"
    fi

    # Check quotas
    log_info "Checking Azure quotas..."
    local cpu_usage=$(az vm list-usage --location eastus --query "[?name.value=='cores'].currentValue" -o tsv 2>/dev/null || echo "0")
    local cpu_limit=$(az vm list-usage --location eastus --query "[?name.value=='cores'].limit" -o tsv 2>/dev/null || echo "0")
    if [ -n "$cpu_usage" ] && [ -n "$cpu_limit" ]; then
        log_info "CPU quota: $cpu_usage / $cpu_limit cores"
        if [ "$cpu_usage" -gt $((cpu_limit * 80 / 100)) ]; then
            log_warning "CPU quota usage is above 80%"
        fi
    fi
}

# ============================================================================
# KUBERNETES VALIDATION
# ============================================================================

validate_kubernetes() {
    log_section "Validating Kubernetes Configuration"

    # Try to get credentials
    if az aks show --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        az aks get-credentials --name "$AKS_CLUSTER_NAME" --resource-group "$RESOURCE_GROUP" --overwrite-existing 2>/dev/null
    fi

    # Check cluster connectivity
    if kubectl cluster-info &>/dev/null; then
        log_success "Cluster is reachable"
        kubectl cluster-info | head -n 2
    else
        log_warning "Cannot connect to cluster (may not exist yet)"
        return
    fi

    # Check nodes
    local ready_nodes=$(kubectl get nodes --no-headers 2>/dev/null | grep -c "Ready" || echo "0")
    local total_nodes=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo "0")
    if [ "$ready_nodes" -eq "$total_nodes" ] && [ "$total_nodes" -gt 0 ]; then
        log_success "All nodes are ready: $ready_nodes/$total_nodes"
    else
        log_warning "Some nodes are not ready: $ready_nodes/$total_nodes"
    fi

    # Check namespace
    if kubectl get namespace "$NAMESPACE" &>/dev/null; then
        log_success "Namespace exists: $NAMESPACE"
    else
        log_info "Namespace does not exist: $NAMESPACE (will be created)"
    fi

    # Check for conflicting resources
    if kubectl get all -n "$NAMESPACE" --no-headers 2>/dev/null | grep -v "No resources" | head -n 5; then
        log_info "Existing resources found in namespace $NAMESPACE"
    fi

    # Check cluster resources
    log_info "Cluster resource availability:"
    kubectl top nodes 2>/dev/null || log_info "Metrics server not available"
}

# ============================================================================
# TERRAFORM VALIDATION
# ============================================================================

validate_terraform() {
    log_section "Validating Terraform Configuration"

    if [ ! -d "$TERRAFORM_DIR" ]; then
        log_error "Terraform directory not found: $TERRAFORM_DIR"
        return
    fi

    cd "$TERRAFORM_DIR"

    # Check terraform files exist
    if ls *.tf &>/dev/null; then
        log_success "Terraform files found"
    else
        log_error "No Terraform files found in $TERRAFORM_DIR"
        cd "$PROJECT_ROOT"
        return
    fi

    # Initialize terraform
    log_info "Initializing Terraform..."
    if terraform init -backend=false &>/dev/null; then
        log_success "Terraform initialized successfully"
    else
        log_error "Terraform init failed"
        cd "$PROJECT_ROOT"
        return
    fi

    # Validate terraform
    log_info "Validating Terraform configuration..."
    if terraform validate; then
        log_success "Terraform configuration is valid"
    else
        log_error "Terraform validation failed"
    fi

    # Check for security issues
    log_info "Checking for security issues..."
    if command -v tfsec &>/dev/null; then
        tfsec . --soft-fail 2>/dev/null || log_info "tfsec check complete"
    else
        log_info "tfsec not installed (optional security scanner)"
    fi

    cd "$PROJECT_ROOT"
}

# ============================================================================
# HELM VALIDATION
# ============================================================================

validate_helm() {
    log_section "Validating Helm Charts"

    if [ ! -d "$HELM_DIR" ]; then
        log_error "Helm directory not found: $HELM_DIR"
        return
    fi

    # Check each chart
    for chart_dir in "$HELM_DIR"/*/; do
        if [ -f "${chart_dir}Chart.yaml" ]; then
            chart_name=$(basename "$chart_dir")
            log_info "Validating chart: $chart_name"

            # Lint chart
            if helm lint "$chart_dir" --strict &>/dev/null; then
                log_success "$chart_name: lint passed"
            else
                log_error "$chart_name: lint failed"
            fi

            # Template chart
            if helm template "$chart_name" "$chart_dir" --namespace "$NAMESPACE" &>/dev/null; then
                log_success "$chart_name: template generation passed"
            else
                log_error "$chart_name: template generation failed"
            fi

            # Check for required values
            if [ -f "${chart_dir}values.yaml" ]; then
                log_success "$chart_name: values.yaml exists"
            else
                log_warning "$chart_name: no values.yaml found"
            fi
        fi
    done
}

# ============================================================================
# KUBERNETES MANIFESTS VALIDATION
# ============================================================================

validate_k8s_manifests() {
    log_section "Validating Kubernetes Manifests"

    if [ ! -d "$K8S_DIR" ]; then
        log_warning "Kubernetes manifests directory not found: $K8S_DIR"
        return
    fi

    local total_files=0
    local valid_files=0

    # Find all YAML files
    while IFS= read -r -d '' manifest; do
        total_files=$((total_files + 1))

        # Validate YAML syntax
        if python3 -c "import yaml; yaml.safe_load(open('$manifest'))" 2>/dev/null || \
           python -c "import yaml; yaml.safe_load(open('$manifest'))" 2>/dev/null; then
            # Dry-run apply
            if kubectl apply --dry-run=client -f "$manifest" &>/dev/null; then
                valid_files=$((valid_files + 1))
            else
                log_error "Invalid manifest: $manifest"
            fi
        else
            log_error "Invalid YAML: $manifest"
        fi
    done < <(find "$K8S_DIR" -name "*.yaml" -o -name "*.yml" -print0 2>/dev/null)

    if [ "$total_files" -eq "$valid_files" ]; then
        log_success "All $total_files Kubernetes manifests are valid"
    else
        log_warning "$valid_files/$total_files manifests are valid"
    fi
}

# ============================================================================
# DOCKER VALIDATION
# ============================================================================

validate_docker() {
    log_section "Validating Docker Configuration"

    # Check Docker daemon
    if docker info &>/dev/null; then
        log_success "Docker daemon is running"
    else
        log_error "Docker daemon is not running"
        return
    fi

    # Check Dockerfiles exist
    local dockerfile_count=$(find "$PROJECT_ROOT" -name "Dockerfile" -not -path "*/node_modules/*" | wc -l)
    log_info "Found $dockerfile_count Dockerfiles"

    # Validate Dockerfiles (basic syntax)
    while IFS= read -r dockerfile; do
        local dir=$(dirname "$dockerfile")
        local service=$(basename "$dir")

        if docker build --file "$dockerfile" --target=validator "$dir" &>/dev/null 2>&1 || \
           head -n 1 "$dockerfile" | grep -qE '^FROM|^ARG'; then
            log_success "Dockerfile valid: $service"
        else
            log_warning "Could not validate: $dockerfile"
        fi
    done < <(find "$PROJECT_ROOT" -name "Dockerfile" -not -path "*/node_modules/*" | head -n 10)
}

# ============================================================================
# SECRETS VALIDATION
# ============================================================================

validate_secrets() {
    log_section "Validating Secrets and Credentials"

    # Check for exposed secrets in code
    log_info "Scanning for exposed secrets..."

    local secret_patterns=(
        'password\s*=\s*["\047][^"\047]+["\047]'
        'api_key\s*=\s*["\047][^"\047]+["\047]'
        'secret\s*=\s*["\047][^"\047]+["\047]'
        'POSTGRES_PASSWORD\s*=\s*[^\s]+'
    )

    local found_secrets=0
    for pattern in "${secret_patterns[@]}"; do
        if grep -rE "$pattern" "$PROJECT_ROOT" \
            --include="*.tf" \
            --include="*.yaml" \
            --include="*.yml" \
            --include="*.json" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            2>/dev/null | grep -v 'var\.' | head -n 5; then
            found_secrets=$((found_secrets + 1))
        fi
    done

    if [ $found_secrets -gt 0 ]; then
        log_warning "Potential hardcoded secrets found - review manually"
    else
        log_success "No obvious hardcoded secrets detected"
    fi

    # Check .env files
    if find "$PROJECT_ROOT" -name ".env*" -not -name ".env.example" -not -name ".env.template" | grep -q .; then
        log_info "Environment files found (ensure they're in .gitignore)"
    fi

    # Check gitignore for sensitive files
    if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        for pattern in ".env" "*.pem" "*.key" "credentials" "secrets"; do
            if grep -q "$pattern" "$PROJECT_ROOT/.gitignore"; then
                log_success ".gitignore includes: $pattern"
            else
                log_warning ".gitignore missing: $pattern"
            fi
        done
    fi
}

# ============================================================================
# NETWORK VALIDATION
# ============================================================================

validate_network() {
    log_section "Validating Network Connectivity"

    # Check Azure endpoints
    local endpoints=(
        "https://management.azure.com"
        "https://login.microsoftonline.com"
        "https://${ACR_NAME}.azurecr.io"
    )

    for endpoint in "${endpoints[@]}"; do
        if curl -sf --connect-timeout 5 "$endpoint" &>/dev/null || \
           curl -sf --connect-timeout 5 -o /dev/null -w "%{http_code}" "$endpoint" 2>/dev/null | grep -qE '^[234]'; then
            log_success "Reachable: $endpoint"
        else
            log_warning "Cannot reach: $endpoint"
        fi
    done

    # Check DNS resolution
    for domain in "applyforus.com" "management.azure.com"; do
        if nslookup "$domain" &>/dev/null || host "$domain" &>/dev/null; then
            log_success "DNS resolution: $domain"
        else
            log_warning "DNS resolution failed: $domain"
        fi
    done
}

# ============================================================================
# SUMMARY
# ============================================================================

print_summary() {
    log_section "Validation Summary"

    echo ""
    echo "  Environment: $ENVIRONMENT"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  AKS Cluster: $AKS_CLUSTER_NAME"
    echo "  Namespace: $NAMESPACE"
    echo ""

    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        echo -e "  ${GREEN}Status: ALL CHECKS PASSED${NC}"
        echo ""
        echo "  The infrastructure is ready for deployment!"
    elif [ $ERRORS -eq 0 ]; then
        echo -e "  ${YELLOW}Status: PASSED WITH WARNINGS${NC}"
        echo ""
        echo "  Errors: 0"
        echo "  Warnings: $WARNINGS"
        echo ""
        echo "  Review warnings before proceeding with deployment."
    else
        echo -e "  ${RED}Status: VALIDATION FAILED${NC}"
        echo ""
        echo "  Errors: $ERRORS"
        echo "  Warnings: $WARNINGS"
        echo ""
        echo "  Fix errors before proceeding with deployment."
    fi

    echo ""
    return $ERRORS
}

# ============================================================================
# USAGE
# ============================================================================

usage() {
    cat << EOF
Usage: $0 [OPTIONS] [CHECKS...]

Checks (default: all):
  tools         Validate required CLI tools
  azure         Validate Azure configuration
  kubernetes    Validate Kubernetes cluster
  terraform     Validate Terraform configuration
  helm          Validate Helm charts
  manifests     Validate Kubernetes manifests
  docker        Validate Dockerfiles
  secrets       Check for exposed secrets
  network       Validate network connectivity
  all           Run all validations (default)

Options:
  -e, --environment     Environment [default: prod]
  -r, --resource-group  Resource group [default: applyforus-prod-rg]
  -n, --namespace       Namespace [default: applyforus]
  --aks-cluster         AKS cluster name [default: applyforus-aks]
  -h, --help            Show this help

Examples:
  $0                    # Run all validations
  $0 tools azure        # Validate tools and Azure only
  $0 -e dev terraform   # Validate Terraform for dev environment

EOF
    exit 0
}

# ============================================================================
# MAIN
# ============================================================================

CHECKS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --aks-cluster)
            AKS_CLUSTER_NAME="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        tools|azure|kubernetes|terraform|helm|manifests|docker|secrets|network|all)
            CHECKS+=("$1")
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Default to all checks
if [ ${#CHECKS[@]} -eq 0 ]; then
    CHECKS=("all")
fi

echo ""
echo "============================================================================"
echo "  ApplyForUs Infrastructure Validation"
echo "============================================================================"
echo "  Environment: $ENVIRONMENT"
echo "  Checks: ${CHECKS[*]}"
echo "============================================================================"

for check in "${CHECKS[@]}"; do
    case $check in
        tools)
            validate_tools
            ;;
        azure)
            validate_azure
            ;;
        kubernetes)
            validate_kubernetes
            ;;
        terraform)
            validate_terraform
            ;;
        helm)
            validate_helm
            ;;
        manifests)
            validate_k8s_manifests
            ;;
        docker)
            validate_docker
            ;;
        secrets)
            validate_secrets
            ;;
        network)
            validate_network
            ;;
        all)
            validate_tools
            validate_azure
            validate_kubernetes
            validate_terraform
            validate_helm
            validate_k8s_manifests
            validate_docker
            validate_secrets
            validate_network
            ;;
    esac
done

print_summary
