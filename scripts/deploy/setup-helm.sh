#!/bin/bash

# ============================================================================
# HELM SETUP AND DEPENDENCY MANAGEMENT SCRIPT
# ============================================================================
# Sets up Helm repositories, installs dependencies, and manages releases
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
HELM_DIR="$PROJECT_ROOT/infrastructure/helm"

# Default values
NAMESPACE="${NAMESPACE:-applyforus}"
ENVIRONMENT="${ENVIRONMENT:-prod}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================================
# HELM REPOSITORIES
# ============================================================================

declare -A HELM_REPOS=(
    ["bitnami"]="https://charts.bitnami.com/bitnami"
    ["ingress-nginx"]="https://kubernetes.github.io/ingress-nginx"
    ["jetstack"]="https://charts.jetstack.io"
    ["prometheus-community"]="https://prometheus-community.github.io/helm-charts"
    ["grafana"]="https://grafana.github.io/helm-charts"
    ["azure-workload-identity"]="https://azure.github.io/azure-workload-identity/charts"
    ["kedacore"]="https://kedacore.github.io/charts"
    ["external-secrets"]="https://charts.external-secrets.io"
    ["cert-manager"]="https://charts.jetstack.io"
)

# ============================================================================
# SETUP REPOSITORIES
# ============================================================================

setup_repositories() {
    log_info "Setting up Helm repositories..."

    for REPO_NAME in "${!HELM_REPOS[@]}"; do
        REPO_URL="${HELM_REPOS[$REPO_NAME]}"
        log_info "Adding repository: $REPO_NAME"

        if helm repo list | grep -q "^${REPO_NAME}"; then
            log_info "Repository $REPO_NAME already exists, updating..."
            helm repo update "$REPO_NAME"
        else
            helm repo add "$REPO_NAME" "$REPO_URL"
        fi
    done

    log_info "Updating all repositories..."
    helm repo update

    log_success "Helm repositories configured!"
}

# ============================================================================
# INSTALL CERT-MANAGER
# ============================================================================

install_cert_manager() {
    log_info "Installing cert-manager..."

    # Check if already installed
    if helm status cert-manager -n cert-manager &>/dev/null; then
        log_info "cert-manager already installed, upgrading..."
    fi

    # Install CRDs first
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.crds.yaml

    # Install cert-manager
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.0 \
        --set installCRDs=false \
        --set prometheus.enabled=true \
        --set webhook.timeoutSeconds=30 \
        --wait

    # Wait for cert-manager to be ready
    log_info "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=Available deployment/cert-manager -n cert-manager --timeout=120s
    kubectl wait --for=condition=Available deployment/cert-manager-webhook -n cert-manager --timeout=120s

    log_success "cert-manager installed!"
}

# ============================================================================
# CREATE CLUSTER ISSUER
# ============================================================================

create_cluster_issuer() {
    local EMAIL="${1:-admin@applyforus.com}"

    log_info "Creating ClusterIssuer for Let's Encrypt..."

    cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
    - http01:
        ingress:
          class: nginx
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ${EMAIL}
    privateKeySecretRef:
      name: letsencrypt-staging-account-key
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

    log_success "ClusterIssuers created!"
}

# ============================================================================
# INSTALL EXTERNAL SECRETS OPERATOR
# ============================================================================

install_external_secrets() {
    log_info "Installing External Secrets Operator..."

    helm upgrade --install external-secrets external-secrets/external-secrets \
        --namespace external-secrets \
        --create-namespace \
        --set installCRDs=true \
        --set webhook.port=9443 \
        --wait

    log_success "External Secrets Operator installed!"
}

# ============================================================================
# INSTALL PROMETHEUS STACK
# ============================================================================

install_prometheus_stack() {
    log_info "Installing Prometheus Stack (Prometheus, Grafana, AlertManager)..."

    local VALUES_FILE="$HELM_DIR/monitoring/prometheus-values.yaml"

    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        ${VALUES_FILE:+--values "$VALUES_FILE"} \
        --set prometheus.prometheusSpec.retention=30d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.adminPassword="${GRAFANA_PASSWORD:-$(openssl rand -base64 12)}" \
        --set grafana.persistence.enabled=true \
        --set grafana.persistence.size=10Gi \
        --set alertmanager.alertmanagerSpec.retention=120h \
        --wait \
        --timeout 10m

    log_success "Prometheus Stack installed!"

    # Print Grafana credentials
    echo ""
    log_info "Grafana Credentials:"
    echo "  Username: admin"
    echo "  Password: $(kubectl get secret prometheus-grafana -n monitoring -o jsonpath='{.data.admin-password}' | base64 -d)"
    echo ""
}

# ============================================================================
# INSTALL KEDA
# ============================================================================

install_keda() {
    log_info "Installing KEDA (Kubernetes Event-driven Autoscaling)..."

    helm upgrade --install keda kedacore/keda \
        --namespace keda \
        --create-namespace \
        --set prometheus.metricServer.enabled=true \
        --wait

    log_success "KEDA installed!"
}

# ============================================================================
# BUILD CHART DEPENDENCIES
# ============================================================================

build_dependencies() {
    log_info "Building Helm chart dependencies..."

    # Build app chart dependencies
    if [ -f "$HELM_DIR/app/Chart.yaml" ]; then
        log_info "Building dependencies for app chart..."
        cd "$HELM_DIR/app"
        helm dependency update
        helm dependency build
        cd "$PROJECT_ROOT"
    fi

    log_success "Dependencies built!"
}

# ============================================================================
# LINT CHARTS
# ============================================================================

lint_charts() {
    log_info "Linting Helm charts..."

    local FAILED=0

    for chart_dir in "$HELM_DIR"/*/; do
        if [ -f "${chart_dir}Chart.yaml" ]; then
            chart_name=$(basename "$chart_dir")
            log_info "Linting $chart_name..."

            if helm lint "$chart_dir" --strict; then
                log_success "$chart_name passed linting"
            else
                log_error "$chart_name failed linting"
                FAILED=$((FAILED + 1))
            fi
        fi
    done

    if [ $FAILED -gt 0 ]; then
        log_error "$FAILED charts failed linting"
        return 1
    fi

    log_success "All charts passed linting!"
}

# ============================================================================
# TEMPLATE CHARTS
# ============================================================================

template_charts() {
    log_info "Generating chart templates..."

    local OUTPUT_DIR="${1:-/tmp/helm-templates}"
    mkdir -p "$OUTPUT_DIR"

    for chart_dir in "$HELM_DIR"/*/; do
        if [ -f "${chart_dir}Chart.yaml" ]; then
            chart_name=$(basename "$chart_dir")
            log_info "Templating $chart_name..."

            helm template "$chart_name" "$chart_dir" \
                --namespace "$NAMESPACE" \
                --set global.environment="$ENVIRONMENT" \
                > "$OUTPUT_DIR/${chart_name}.yaml"

            log_success "$chart_name templated to $OUTPUT_DIR/${chart_name}.yaml"
        fi
    done

    log_success "Templates generated in $OUTPUT_DIR"
}

# ============================================================================
# LIST RELEASES
# ============================================================================

list_releases() {
    log_info "Listing Helm releases..."

    echo ""
    echo "=== Releases in $NAMESPACE ==="
    helm list -n "$NAMESPACE"

    echo ""
    echo "=== All Releases ==="
    helm list -A
}

# ============================================================================
# SHOW RELEASE HISTORY
# ============================================================================

show_history() {
    local RELEASE_NAME=$1

    log_info "Showing history for release: $RELEASE_NAME"

    helm history "$RELEASE_NAME" -n "$NAMESPACE"
}

# ============================================================================
# ROLLBACK RELEASE
# ============================================================================

rollback_release() {
    local RELEASE_NAME=$1
    local REVISION=${2:-}

    if [ -z "$REVISION" ]; then
        log_info "Rolling back $RELEASE_NAME to previous revision..."
        helm rollback "$RELEASE_NAME" -n "$NAMESPACE"
    else
        log_info "Rolling back $RELEASE_NAME to revision $REVISION..."
        helm rollback "$RELEASE_NAME" "$REVISION" -n "$NAMESPACE"
    fi

    log_success "Rollback complete!"
}

# ============================================================================
# UNINSTALL RELEASE
# ============================================================================

uninstall_release() {
    local RELEASE_NAME=$1

    log_warning "Uninstalling release: $RELEASE_NAME"

    read -p "Are you sure you want to uninstall $RELEASE_NAME? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        helm uninstall "$RELEASE_NAME" -n "$NAMESPACE"
        log_success "Release $RELEASE_NAME uninstalled"
    else
        log_info "Uninstall cancelled"
    fi
}

# ============================================================================
# EXPORT VALUES
# ============================================================================

export_values() {
    local RELEASE_NAME=$1
    local OUTPUT_FILE="${2:-${RELEASE_NAME}-values.yaml}"

    log_info "Exporting values for $RELEASE_NAME to $OUTPUT_FILE"

    helm get values "$RELEASE_NAME" -n "$NAMESPACE" -o yaml > "$OUTPUT_FILE"

    log_success "Values exported to $OUTPUT_FILE"
}

# ============================================================================
# USAGE
# ============================================================================

usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND [ARGS]

Commands:
  repos               Setup Helm repositories
  deps                Build chart dependencies
  lint                Lint all charts
  template            Generate chart templates
  cert-manager        Install cert-manager
  issuer [email]      Create ClusterIssuer for Let's Encrypt
  external-secrets    Install External Secrets Operator
  prometheus          Install Prometheus Stack
  keda                Install KEDA
  list                List all releases
  history <release>   Show release history
  rollback <release> [rev]  Rollback release
  uninstall <release> Uninstall release
  export <release>    Export release values
  all                 Install all infrastructure components

Options:
  -n, --namespace     Kubernetes namespace [default: applyforus]
  -e, --environment   Environment [default: prod]
  -h, --help          Show this help

Examples:
  $0 repos                    # Setup all repositories
  $0 all                      # Install all components
  $0 lint                     # Lint all charts
  $0 rollback applyforus      # Rollback to previous
  $0 rollback applyforus 3    # Rollback to revision 3

EOF
    exit 0
}

# ============================================================================
# MAIN
# ============================================================================

COMMAND=""
ARGS=()

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        repos|deps|lint|template|cert-manager|issuer|external-secrets|prometheus|keda|list|history|rollback|uninstall|export|all)
            COMMAND="$1"
            shift
            ARGS=("$@")
            break
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -z "$COMMAND" ]; then
    log_error "No command specified"
    usage
fi

case $COMMAND in
    repos)
        setup_repositories
        ;;
    deps)
        build_dependencies
        ;;
    lint)
        lint_charts
        ;;
    template)
        template_charts "${ARGS[0]:-}"
        ;;
    cert-manager)
        install_cert_manager
        ;;
    issuer)
        create_cluster_issuer "${ARGS[0]:-admin@applyforus.com}"
        ;;
    external-secrets)
        install_external_secrets
        ;;
    prometheus)
        install_prometheus_stack
        ;;
    keda)
        install_keda
        ;;
    list)
        list_releases
        ;;
    history)
        if [ ${#ARGS[@]} -lt 1 ]; then
            log_error "Release name required"
            exit 1
        fi
        show_history "${ARGS[0]}"
        ;;
    rollback)
        if [ ${#ARGS[@]} -lt 1 ]; then
            log_error "Release name required"
            exit 1
        fi
        rollback_release "${ARGS[0]}" "${ARGS[1]:-}"
        ;;
    uninstall)
        if [ ${#ARGS[@]} -lt 1 ]; then
            log_error "Release name required"
            exit 1
        fi
        uninstall_release "${ARGS[0]}"
        ;;
    export)
        if [ ${#ARGS[@]} -lt 1 ]; then
            log_error "Release name required"
            exit 1
        fi
        export_values "${ARGS[0]}" "${ARGS[1]:-}"
        ;;
    all)
        setup_repositories
        build_dependencies
        lint_charts
        install_cert_manager
        create_cluster_issuer
        install_external_secrets
        install_keda
        log_success "All infrastructure components installed!"
        ;;
esac
