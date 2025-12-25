#!/bin/bash

# ============================================================================
# APPLYFORUS AKS DEPLOYMENT SCRIPT
# ============================================================================
# Unified deployment script for Azure Kubernetes Service
# Supports: Terraform infrastructure, Helm charts, and application deployment
# ============================================================================

set -euo pipefail

# ============================================================================
# CONFIGURATION
# ============================================================================

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
LOCATION="${LOCATION:-eastus}"
ACR_NAME="${ACR_NAME:-applyforusacr}"
AKS_CLUSTER_NAME="${AKS_CLUSTER_NAME:-applyforus-aks}"
NAMESPACE="${NAMESPACE:-applyforus}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

# Helm release names
POSTGRESQL_RELEASE="postgresql"
REDIS_RELEASE="redis"
INGRESS_RELEASE="ingress-nginx"
APP_RELEASE="applyforus"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() { echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') $1"; }

print_banner() {
    echo ""
    echo "============================================================================"
    echo "  ApplyForUs Platform - AKS Deployment Script"
    echo "============================================================================"
    echo "  Environment: $ENVIRONMENT"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  AKS Cluster: $AKS_CLUSTER_NAME"
    echo "  Image Tag: $IMAGE_TAG"
    echo "============================================================================"
    echo ""
}

# ============================================================================
# PREREQUISITE CHECKS
# ============================================================================

check_prerequisites() {
    log_step "Checking prerequisites..."

    local missing_deps=()

    # Required tools
    command -v az &>/dev/null || missing_deps+=("az (Azure CLI)")
    command -v kubectl &>/dev/null || missing_deps+=("kubectl")
    command -v helm &>/dev/null || missing_deps+=("helm")
    command -v terraform &>/dev/null || missing_deps+=("terraform")
    command -v docker &>/dev/null || missing_deps+=("docker")
    command -v jq &>/dev/null || missing_deps+=("jq")

    if [ ${#missing_deps[@]} -gt 0 ]; then
        log_error "Missing required tools:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi

    # Check Azure CLI login
    if ! az account show &>/dev/null; then
        log_error "Not logged in to Azure. Run 'az login' first."
        exit 1
    fi

    # Set subscription
    log_info "Setting Azure subscription: $SUBSCRIPTION_ID"
    az account set --subscription "$SUBSCRIPTION_ID"

    # Check Docker daemon
    if ! docker info &>/dev/null; then
        log_error "Docker daemon is not running."
        exit 1
    fi

    log_success "All prerequisites met!"
}

# ============================================================================
# TERRAFORM DEPLOYMENT
# ============================================================================

deploy_terraform() {
    log_step "Deploying infrastructure with Terraform..."

    cd "$TERRAFORM_DIR"

    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init -upgrade

    # Select or create workspace
    terraform workspace select "$ENVIRONMENT" 2>/dev/null || terraform workspace new "$ENVIRONMENT"

    # Plan
    log_info "Planning Terraform changes..."
    terraform plan \
        -var="environment=$ENVIRONMENT" \
        -var="resource_group_name=$RESOURCE_GROUP" \
        -var="location=$LOCATION" \
        -var="subscription_id=$SUBSCRIPTION_ID" \
        -out=tfplan

    # Apply (with auto-approve for CI/CD)
    if [ "${AUTO_APPROVE:-false}" = "true" ]; then
        log_info "Applying Terraform changes (auto-approved)..."
        terraform apply -auto-approve tfplan
    else
        log_info "Applying Terraform changes..."
        terraform apply tfplan
    fi

    # Export outputs
    export ACR_LOGIN_SERVER=$(terraform output -raw acr_login_server 2>/dev/null || echo "${ACR_NAME}.azurecr.io")
    export AKS_CLUSTER_NAME=$(terraform output -raw aks_cluster_name 2>/dev/null || echo "$AKS_CLUSTER_NAME")

    log_success "Infrastructure deployed successfully!"
    cd "$PROJECT_ROOT"
}

# ============================================================================
# KUBECTL CONFIGURATION
# ============================================================================

configure_kubectl() {
    log_step "Configuring kubectl for AKS cluster..."

    az aks get-credentials \
        --resource-group "$RESOURCE_GROUP" \
        --name "$AKS_CLUSTER_NAME" \
        --overwrite-existing

    # Verify connection
    if kubectl cluster-info &>/dev/null; then
        log_success "kubectl configured successfully!"
        kubectl cluster-info
    else
        log_error "Failed to connect to AKS cluster!"
        exit 1
    fi
}

# ============================================================================
# HELM SETUP
# ============================================================================

setup_helm_repos() {
    log_step "Setting up Helm repositories..."

    # Add required repos
    helm repo add bitnami https://charts.bitnami.com/bitnami
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo add jetstack https://charts.jetstack.io
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

    # Update repos
    helm repo update

    log_success "Helm repositories configured!"
}

# ============================================================================
# NAMESPACE SETUP
# ============================================================================

setup_namespace() {
    log_step "Setting up namespace: $NAMESPACE"

    # Create namespace if it doesn't exist
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

    # Apply Pod Security Standards
    if [ -f "$K8S_DIR/pod-security/pod-security-standards.yaml" ]; then
        log_info "Applying Pod Security Standards..."
        kubectl apply -f "$K8S_DIR/pod-security/pod-security-standards.yaml"
    fi

    # Apply RBAC
    if [ -d "$K8S_DIR/rbac" ]; then
        log_info "Applying RBAC manifests..."
        kubectl apply -f "$K8S_DIR/rbac/"
    fi

    # Apply Network Policies
    if [ -d "$K8S_DIR/network-policies" ]; then
        log_info "Applying Network Policies..."
        kubectl apply -f "$K8S_DIR/network-policies/"
    fi

    log_success "Namespace configured!"
}

# ============================================================================
# DATABASE DEPLOYMENTS
# ============================================================================

deploy_postgresql() {
    log_step "Deploying PostgreSQL..."

    local VALUES_FILE="$HELM_DIR/postgresql/values.yaml"

    if [ ! -f "$VALUES_FILE" ]; then
        log_warning "PostgreSQL values file not found, using defaults"
        VALUES_FILE=""
    fi

    helm upgrade --install "$POSTGRESQL_RELEASE" bitnami/postgresql \
        --namespace "$NAMESPACE" \
        --create-namespace \
        ${VALUES_FILE:+--values "$VALUES_FILE"} \
        --set auth.postgresPassword="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}" \
        --set auth.database=applyforus \
        --wait \
        --timeout 10m

    log_success "PostgreSQL deployed!"
}

deploy_redis() {
    log_step "Deploying Redis..."

    local VALUES_FILE="$HELM_DIR/redis/values.yaml"

    if [ ! -f "$VALUES_FILE" ]; then
        log_warning "Redis values file not found, using defaults"
        VALUES_FILE=""
    fi

    helm upgrade --install "$REDIS_RELEASE" bitnami/redis \
        --namespace "$NAMESPACE" \
        --create-namespace \
        ${VALUES_FILE:+--values "$VALUES_FILE"} \
        --set auth.password="${REDIS_PASSWORD:-$(openssl rand -base64 32)}" \
        --wait \
        --timeout 10m

    log_success "Redis deployed!"
}

# ============================================================================
# INGRESS DEPLOYMENT
# ============================================================================

deploy_ingress() {
    log_step "Deploying NGINX Ingress Controller..."

    local VALUES_FILE="$HELM_DIR/ingress-nginx/values.yaml"

    helm upgrade --install "$INGRESS_RELEASE" ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        ${VALUES_FILE:+--values "$VALUES_FILE"} \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz \
        --wait \
        --timeout 10m

    # Wait for external IP
    log_info "Waiting for external IP assignment..."
    local EXTERNAL_IP=""
    local ATTEMPTS=0
    local MAX_ATTEMPTS=30

    while [ -z "$EXTERNAL_IP" ] && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
        EXTERNAL_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || true)
        if [ -z "$EXTERNAL_IP" ]; then
            sleep 10
            ATTEMPTS=$((ATTEMPTS + 1))
            log_info "Waiting for external IP... ($ATTEMPTS/$MAX_ATTEMPTS)"
        fi
    done

    if [ -n "$EXTERNAL_IP" ]; then
        log_success "Ingress deployed with external IP: $EXTERNAL_IP"
        export INGRESS_IP="$EXTERNAL_IP"
    else
        log_warning "External IP not yet assigned. Check later with: kubectl get svc -n ingress-nginx"
    fi
}

# ============================================================================
# APPLICATION DEPLOYMENT
# ============================================================================

deploy_application() {
    log_step "Deploying ApplyForUs application..."

    local VALUES_FILE="$HELM_DIR/app/values.yaml"
    local ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-${ACR_NAME}.azurecr.io}"

    # Create image pull secret if needed
    log_info "Setting up ACR authentication..."
    local ACR_TOKEN=$(az acr login --name "$ACR_NAME" --expose-token --output tsv --query accessToken 2>/dev/null || true)

    if [ -n "$ACR_TOKEN" ]; then
        kubectl create secret docker-registry acr-secret \
            --namespace "$NAMESPACE" \
            --docker-server="$ACR_LOGIN_SERVER" \
            --docker-username="00000000-0000-0000-0000-000000000000" \
            --docker-password="$ACR_TOKEN" \
            --dry-run=client -o yaml | kubectl apply -f -
    fi

    # Deploy application
    helm upgrade --install "$APP_RELEASE" "$HELM_DIR/app" \
        --namespace "$NAMESPACE" \
        --create-namespace \
        --values "$VALUES_FILE" \
        --set global.image.registry="$ACR_LOGIN_SERVER" \
        --set global.image.tag="$IMAGE_TAG" \
        --set global.environment="$ENVIRONMENT" \
        --set web.ingress.hosts[0].host="applyforus.com" \
        --set web.ingress.hosts[0].paths[0].path="/" \
        --set web.ingress.hosts[0].paths[0].pathType="Prefix" \
        --wait \
        --timeout 15m

    log_success "Application deployed!"
}

# ============================================================================
# VERIFICATION
# ============================================================================

verify_deployment() {
    log_step "Verifying deployment..."

    local FAILED=0

    # Check pods
    log_info "Checking pod status..."
    local NOT_READY=$(kubectl get pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -v "Running\|Completed" | wc -l)

    if [ "$NOT_READY" -gt 0 ]; then
        log_warning "$NOT_READY pods are not in Running state:"
        kubectl get pods -n "$NAMESPACE" --no-headers | grep -v "Running\|Completed"
        FAILED=1
    else
        log_success "All pods are running!"
    fi

    # Check services
    log_info "Checking services..."
    kubectl get svc -n "$NAMESPACE"

    # Check ingress
    log_info "Checking ingress..."
    kubectl get ingress -n "$NAMESPACE"

    # Run health checks
    log_info "Running health checks..."

    local SERVICES=("web" "auth-service" "user-service" "job-service")

    for svc in "${SERVICES[@]}"; do
        local POD=$(kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name="$svc" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
        if [ -n "$POD" ]; then
            if kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:3000/health &>/dev/null || \
               kubectl exec -n "$NAMESPACE" "$POD" -- curl -sf http://localhost:8000/health &>/dev/null; then
                log_success "Health check passed: $svc"
            else
                log_warning "Health check failed or not available: $svc"
            fi
        fi
    done

    return $FAILED
}

# ============================================================================
# DISPLAY DEPLOYMENT INFO
# ============================================================================

display_deployment_info() {
    echo ""
    echo "============================================================================"
    echo "  DEPLOYMENT SUMMARY"
    echo "============================================================================"
    echo ""
    echo "  Environment: $ENVIRONMENT"
    echo "  Resource Group: $RESOURCE_GROUP"
    echo "  AKS Cluster: $AKS_CLUSTER_NAME"
    echo "  Namespace: $NAMESPACE"
    echo "  Image Tag: $IMAGE_TAG"
    echo ""
    echo "  ACR: ${ACR_LOGIN_SERVER:-$ACR_NAME.azurecr.io}"
    echo ""

    if [ -n "${INGRESS_IP:-}" ]; then
        echo "  Ingress IP: $INGRESS_IP"
        echo ""
        echo "  URLs (after DNS configuration):"
        echo "    - https://applyforus.com"
        echo "    - https://api.applyforus.com"
        echo "    - https://www.applyforus.com"
    fi

    echo ""
    echo "  Useful commands:"
    echo "    kubectl get pods -n $NAMESPACE"
    echo "    kubectl logs -n $NAMESPACE -l app.kubernetes.io/part-of=applyforus"
    echo "    helm list -n $NAMESPACE"
    echo ""
    echo "============================================================================"
}

# ============================================================================
# CLEANUP FUNCTION
# ============================================================================

cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code: $exit_code"
        log_info "Check logs above for details"
    fi
    exit $exit_code
}

trap cleanup EXIT

# ============================================================================
# USAGE
# ============================================================================

usage() {
    cat << EOF
Usage: $0 [OPTIONS] [COMMAND]

Commands:
  all             Deploy everything (default)
  infra           Deploy only Terraform infrastructure
  databases       Deploy only PostgreSQL and Redis
  ingress         Deploy only ingress controller
  app             Deploy only the application
  verify          Verify deployment status

Options:
  -e, --environment    Environment (dev|staging|prod) [default: prod]
  -r, --resource-group Resource group name
  -t, --tag            Docker image tag
  -n, --namespace      Kubernetes namespace
  --auto-approve       Auto-approve Terraform changes
  -h, --help           Show this help message

Examples:
  $0 all                           # Full deployment with defaults
  $0 -e dev -t v1.0.0 all          # Deploy to dev with specific tag
  $0 app                           # Deploy only the application
  $0 --auto-approve infra          # Deploy infra with auto-approve

EOF
    exit 0
}

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

COMMAND="all"

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
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --auto-approve)
            AUTO_APPROVE="true"
            shift
            ;;
        -h|--help)
            usage
            ;;
        all|infra|databases|ingress|app|verify)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    print_banner
    check_prerequisites

    case $COMMAND in
        all)
            deploy_terraform
            configure_kubectl
            setup_helm_repos
            setup_namespace
            deploy_postgresql
            deploy_redis
            deploy_ingress
            deploy_application
            verify_deployment
            ;;
        infra)
            deploy_terraform
            configure_kubectl
            ;;
        databases)
            configure_kubectl
            setup_helm_repos
            setup_namespace
            deploy_postgresql
            deploy_redis
            ;;
        ingress)
            configure_kubectl
            setup_helm_repos
            deploy_ingress
            ;;
        app)
            configure_kubectl
            setup_namespace
            deploy_application
            verify_deployment
            ;;
        verify)
            configure_kubectl
            verify_deployment
            ;;
    esac

    display_deployment_info
    log_success "Deployment completed!"
}

main
