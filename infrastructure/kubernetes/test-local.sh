#!/bin/bash

#############################################
# Local Kubernetes Testing Script
# Tests JobPilot deployment on local Kubernetes
# Supports: Docker Desktop, Minikube, Kind
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE="jobpilot-local"
ENVIRONMENT="dev"
TIMEOUT=300  # 5 minutes timeout for deployments

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_header() { echo -e "${BLUE}========== $1 ==========${NC}"; }

# Function to detect local Kubernetes environment
detect_k8s_environment() {
    print_info "Detecting Kubernetes environment..."

    if kubectl config current-context | grep -q "docker-desktop"; then
        print_success "Detected: Docker Desktop"
        export K8S_ENV="docker-desktop"
    elif kubectl config current-context | grep -q "minikube"; then
        print_success "Detected: Minikube"
        export K8S_ENV="minikube"
    elif kubectl config current-context | grep -q "kind"; then
        print_success "Detected: Kind"
        export K8S_ENV="kind"
    else
        print_warning "Unknown Kubernetes environment: $(kubectl config current-context)"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        export K8S_ENV="unknown"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing_tools=()

    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    else
        print_success "kubectl: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
    fi

    if ! command -v kustomize &> /dev/null; then
        missing_tools+=("kustomize")
    else
        print_success "kustomize: $(kustomize version --short 2>/dev/null || kustomize version)"
    fi

    if ! command -v helm &> /dev/null; then
        print_warning "helm not found - some features may not work"
    else
        print_success "helm: $(helm version --short)"
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    # Check kubectl connectivity
    if ! kubectl cluster-info > /dev/null 2>&1; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    print_success "Connected to Kubernetes cluster"
    echo ""
}

# Function to create namespace
create_namespace() {
    print_header "Setting up Namespace"

    if kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
        print_warning "Namespace $NAMESPACE already exists"
        read -p "Delete and recreate? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kubectl delete namespace "$NAMESPACE" --grace-period=30 --timeout=60s
            print_success "Deleted namespace $NAMESPACE"
        fi
    fi

    if ! kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
        kubectl create namespace "$NAMESPACE"
        print_success "Created namespace: $NAMESPACE"
    fi

    kubectl label namespace "$NAMESPACE" environment=local --overwrite
    echo ""
}

# Function to create local secrets
create_local_secrets() {
    print_header "Creating Local Secrets"

    # Create a temporary secrets file for local development
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: jobpilot-secrets
  namespace: $NAMESPACE
type: Opaque
stringData:
  POSTGRES_USER: "jobpilot"
  POSTGRES_PASSWORD: "local_dev_password"
  REDIS_PASSWORD: "local_redis_password"
  JWT_SECRET: "local_jwt_secret_change_in_production"
  JWT_REFRESH_SECRET: "local_jwt_refresh_secret_change_in_production"
  AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true"
  AZURE_STORAGE_ACCOUNT_KEY: "local_storage_key"
  AZURE_OPENAI_API_KEY: "local_openai_key"
  SMTP_USERNAME: "local_smtp_user"
  SMTP_PASSWORD: "local_smtp_password"
  GOOGLE_CLIENT_ID: "local_google_client_id"
  GOOGLE_CLIENT_SECRET: "local_google_client_secret"
  LINKEDIN_CLIENT_ID: "local_linkedin_client_id"
  LINKEDIN_CLIENT_SECRET: "local_linkedin_client_secret"
  ENCRYPTION_KEY: "local_encryption_key_32_characters"
  SENDGRID_API_KEY: "local_sendgrid_key"
EOF

    print_success "Created local secrets"
    echo ""
}

# Function to create local configmap
create_local_configmap() {
    print_header "Creating Local ConfigMap"

    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: jobpilot-config
  namespace: $NAMESPACE
data:
  NODE_ENV: "development"
  LOG_LEVEL: "debug"
  POSTGRES_HOST: "postgres"
  POSTGRES_PORT: "5432"
  POSTGRES_DB: "jobpilot"
  REDIS_HOST: "redis"
  REDIS_PORT: "6379"
  REDIS_TLS: "false"
  AUTH_SERVICE_URL: "http://auth-service.$NAMESPACE.svc.cluster.local:3001"
  USER_SERVICE_URL: "http://user-service.$NAMESPACE.svc.cluster.local:3002"
  JOB_SERVICE_URL: "http://job-service.$NAMESPACE.svc.cluster.local:3003"
  AI_SERVICE_URL: "http://ai-service.$NAMESPACE.svc.cluster.local:3004"
  RESUME_SERVICE_URL: "http://resume-service.$NAMESPACE.svc.cluster.local:3005"
  ANALYTICS_SERVICE_URL: "http://analytics-service.$NAMESPACE.svc.cluster.local:3006"
  NOTIFICATION_SERVICE_URL: "http://notification-service.$NAMESPACE.svc.cluster.local:3007"
  AUTO_APPLY_SERVICE_URL: "http://auto-apply-service.$NAMESPACE.svc.cluster.local:3008"
  CORS_ORIGIN: "http://localhost:3000"
  API_RATE_LIMIT: "1000"
  API_RATE_WINDOW: "15"
  SESSION_TIMEOUT: "3600"
  FEATURE_AUTO_APPLY: "true"
  FEATURE_AI_RESUME: "true"
  FEATURE_ANALYTICS: "true"
  FEATURE_NOTIFICATIONS: "true"
EOF

    print_success "Created local ConfigMap"
    echo ""
}

# Function to deploy PostgreSQL
deploy_postgres() {
    print_header "Deploying PostgreSQL"

    if command -v helm &> /dev/null; then
        print_info "Using Helm to deploy PostgreSQL..."
        helm repo add bitnami https://charts.bitnami.com/bitnami 2>/dev/null || true
        helm repo update

        helm upgrade --install postgres bitnami/postgresql \
            --namespace "$NAMESPACE" \
            --set auth.username=jobpilot \
            --set auth.password=local_dev_password \
            --set auth.database=jobpilot \
            --set primary.persistence.size=1Gi \
            --wait --timeout=5m

        print_success "PostgreSQL deployed via Helm"
    else
        print_warning "Helm not available, skipping PostgreSQL deployment"
        print_info "You'll need to set up PostgreSQL manually or install Helm"
    fi
    echo ""
}

# Function to deploy Redis
deploy_redis() {
    print_header "Deploying Redis"

    if command -v helm &> /dev/null; then
        print_info "Using Helm to deploy Redis..."
        helm upgrade --install redis bitnami/redis \
            --namespace "$NAMESPACE" \
            --set auth.password=local_redis_password \
            --set master.persistence.size=1Gi \
            --set replica.replicaCount=1 \
            --wait --timeout=5m

        print_success "Redis deployed via Helm"
    else
        print_warning "Helm not available, skipping Redis deployment"
        print_info "You'll need to set up Redis manually or install Helm"
    fi
    echo ""
}

# Function to deploy services
deploy_services() {
    print_header "Deploying JobPilot Services"

    print_info "Building manifests with kustomize..."

    # Create a temporary kustomization for local testing
    cat > /tmp/kustomization-local.yaml <<EOF
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: $NAMESPACE

resources:
- services/auth-service.yaml
- services/user-service.yaml
- services/job-service.yaml
- services/ai-service.yaml
- services/resume-service.yaml
- services/analytics-service.yaml
- services/notification-service.yaml
- services/auto-apply-service.yaml
- services/web-app.yaml

commonLabels:
  environment: local

# Override replicas for local testing
replicas:
- name: auth-service
  count: 1
- name: user-service
  count: 1
- name: job-service
  count: 1
- name: ai-service
  count: 1
- name: resume-service
  count: 1
- name: analytics-service
  count: 1
- name: notification-service
  count: 1
- name: auto-apply-service
  count: 1
- name: web-app
  count: 1

images:
- name: jobpilotacr.azurecr.io/auth-service
  newName: jobpilotacr.azurecr.io/auth-service
  newTag: latest
- name: jobpilotacr.azurecr.io/user-service
  newName: jobpilotacr.azurecr.io/user-service
  newTag: latest
- name: jobpilotacr.azurecr.io/job-service
  newName: jobpilotacr.azurecr.io/job-service
  newTag: latest
- name: jobpilotacr.azurecr.io/ai-service
  newName: jobpilotacr.azurecr.io/ai-service
  newTag: latest
- name: jobpilotacr.azurecr.io/resume-service
  newName: jobpilotacr.azurecr.io/resume-service
  newTag: latest
- name: jobpilotacr.azurecr.io/analytics-service
  newName: jobpilotacr.azurecr.io/analytics-service
  newTag: latest
- name: jobpilotacr.azurecr.io/notification-service
  newName: jobpilotacr.azurecr.io/notification-service
  newTag: latest
- name: jobpilotacr.azurecr.io/auto-apply-service
  newName: jobpilotacr.azurecr.io/auto-apply-service
  newTag: latest
- name: jobpilotacr.azurecr.io/web-app
  newName: jobpilotacr.azurecr.io/web-app
  newTag: latest
EOF

    cd "$(dirname "$0")"
    kustomize build . --load-restrictor LoadRestrictionsNone | kubectl apply -f -

    print_success "Services deployed"
    echo ""
}

# Function to wait for deployments
wait_for_deployments() {
    print_header "Waiting for Deployments"

    local deployments=(
        "auth-service"
        "user-service"
        "job-service"
        "ai-service"
        "resume-service"
        "analytics-service"
        "notification-service"
        "auto-apply-service"
        "web-app"
    )

    for deployment in "${deployments[@]}"; do
        print_info "Waiting for $deployment..."
        if kubectl wait --for=condition=available \
            --timeout=${TIMEOUT}s \
            deployment/$deployment \
            -n "$NAMESPACE" 2>/dev/null; then
            print_success "$deployment is ready"
        else
            print_warning "$deployment is not ready (continuing anyway)"
        fi
    done
    echo ""
}

# Function to display service status
show_status() {
    print_header "Service Status"

    echo ""
    echo "Deployments:"
    kubectl get deployments -n "$NAMESPACE" -o wide

    echo ""
    echo "Pods:"
    kubectl get pods -n "$NAMESPACE" -o wide

    echo ""
    echo "Services:"
    kubectl get services -n "$NAMESPACE" -o wide
    echo ""
}

# Function to setup port forwarding
setup_port_forwarding() {
    print_header "Port Forwarding Setup"

    cat <<EOF

To access services locally, run these commands in separate terminals:

# Web App
kubectl port-forward -n $NAMESPACE svc/web-app 3000:3000

# Auth Service
kubectl port-forward -n $NAMESPACE svc/auth-service 3001:3001

# User Service
kubectl port-forward -n $NAMESPACE svc/user-service 3002:3002

# Job Service
kubectl port-forward -n $NAMESPACE svc/job-service 3003:3003

# AI Service
kubectl port-forward -n $NAMESPACE svc/ai-service 3004:3004

# Resume Service
kubectl port-forward -n $NAMESPACE svc/resume-service 3005:3005

# PostgreSQL
kubectl port-forward -n $NAMESPACE svc/postgres-postgresql 5432:5432

# Redis
kubectl port-forward -n $NAMESPACE svc/redis-master 6379:6379

EOF
}

# Function to run smoke tests
run_smoke_tests() {
    print_header "Running Smoke Tests"

    local failed_tests=0

    # Test 1: Check if all pods are running
    print_info "Test 1: Checking pod status..."
    local not_running=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running --no-headers 2>/dev/null | wc -l)
    if [ "$not_running" -eq 0 ]; then
        print_success "All pods are running"
    else
        print_error "$not_running pods are not running"
        failed_tests=$((failed_tests + 1))
    fi

    # Test 2: Check if all services have endpoints
    print_info "Test 2: Checking service endpoints..."
    local services=$(kubectl get svc -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}')
    for svc in $services; do
        local endpoints=$(kubectl get endpoints "$svc" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null)
        if [ -n "$endpoints" ]; then
            print_success "Service $svc has endpoints"
        else
            print_warning "Service $svc has no endpoints"
        fi
    done

    echo ""
    if [ $failed_tests -eq 0 ]; then
        print_success "All smoke tests passed!"
    else
        print_error "$failed_tests smoke test(s) failed"
    fi
    echo ""
}

# Function to cleanup
cleanup() {
    print_header "Cleanup"

    read -p "Delete namespace $NAMESPACE and all resources? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete namespace "$NAMESPACE" --grace-period=30 --timeout=60s
        print_success "Cleanup complete"
    else
        print_info "Cleanup skipped"
    fi
}

# Main execution
main() {
    print_header "JobPilot Local Kubernetes Testing"
    echo ""

    detect_k8s_environment
    check_prerequisites
    create_namespace
    create_local_secrets
    create_local_configmap
    deploy_postgres
    deploy_redis
    deploy_services
    wait_for_deployments
    show_status
    run_smoke_tests
    setup_port_forwarding

    print_success "Local deployment complete!"
    echo ""

    read -p "Run cleanup? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cleanup
    fi
}

# Handle script arguments
case "${1:-}" in
    cleanup)
        NAMESPACE="${2:-$NAMESPACE}"
        cleanup
        ;;
    status)
        NAMESPACE="${2:-$NAMESPACE}"
        show_status
        ;;
    *)
        main
        ;;
esac
