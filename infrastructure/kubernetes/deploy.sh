#!/bin/bash

# JobPilot Kubernetes Deployment Script
# This script deploys the JobPilot platform to Azure Kubernetes Service (AKS)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-jobpilot-rg}"
AKS_CLUSTER="${AKS_CLUSTER:-jobpilot-aks}"
ACR_NAME="${ACR_NAME:-jobpilotacr}"
NAMESPACE="jobpilot"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install Azure CLI first."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    log_info "All prerequisites met."
}

get_aks_credentials() {
    log_info "Getting AKS credentials..."
    az aks get-credentials --resource-group "$RESOURCE_GROUP" --name "$AKS_CLUSTER" --overwrite-existing
    log_info "AKS credentials configured."
}

install_addons() {
    log_info "Installing required Kubernetes add-ons..."

    # Check if NGINX Ingress Controller is installed
    if ! kubectl get namespace ingress-nginx &> /dev/null; then
        log_info "Installing NGINX Ingress Controller..."
        kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml
        log_info "Waiting for NGINX Ingress Controller to be ready..."
        kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=120s
    else
        log_info "NGINX Ingress Controller already installed."
    fi

    # Check if cert-manager is installed
    if ! kubectl get namespace cert-manager &> /dev/null; then
        log_info "Installing cert-manager..."
        kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
        log_info "Waiting for cert-manager to be ready..."
        kubectl wait --namespace cert-manager \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/instance=cert-manager \
            --timeout=120s
    else
        log_info "cert-manager already installed."
    fi

    log_info "Add-ons installation complete."
}

attach_acr() {
    log_info "Attaching ACR to AKS..."
    az aks update --resource-group "$RESOURCE_GROUP" --name "$AKS_CLUSTER" --attach-acr "$ACR_NAME"
    log_info "ACR attached to AKS."
}

deploy_base_resources() {
    log_info "Deploying base resources..."

    kubectl apply -f base/namespace.yaml
    kubectl apply -f base/serviceaccount.yaml
    kubectl apply -f base/resourcequota.yaml
    kubectl apply -f base/configmap.yaml
    kubectl apply -f base/secrets.yaml

    log_info "Base resources deployed."
}

deploy_services() {
    log_info "Deploying services..."

    kubectl apply -f services/

    log_info "Services deployed."
}

deploy_network_policies() {
    log_info "Deploying network policies..."

    kubectl apply -f base/networkpolicy.yaml
    kubectl apply -f base/poddisruptionbudget.yaml

    log_info "Network policies deployed."
}

deploy_ingress() {
    log_info "Deploying ingress..."

    kubectl apply -f base/ingress.yaml

    log_info "Ingress deployed."
}

wait_for_deployments() {
    log_info "Waiting for deployments to be ready..."

    kubectl wait --for=condition=available --timeout=300s \
        deployment/auth-service \
        deployment/user-service \
        deployment/job-service \
        deployment/ai-service \
        deployment/resume-service \
        deployment/analytics-service \
        deployment/notification-service \
        deployment/auto-apply-service \
        deployment/web-app \
        -n "$NAMESPACE"

    log_info "All deployments are ready."
}

show_status() {
    log_info "Deployment Status:"
    echo ""

    log_info "Pods:"
    kubectl get pods -n "$NAMESPACE"
    echo ""

    log_info "Services:"
    kubectl get svc -n "$NAMESPACE"
    echo ""

    log_info "Ingress:"
    kubectl get ingress -n "$NAMESPACE"
    echo ""

    log_info "HPA:"
    kubectl get hpa -n "$NAMESPACE"
    echo ""
}

get_ingress_ip() {
    log_info "Getting ingress IP address..."

    INGRESS_IP=$(kubectl get ingress jobpilot-ingress -n "$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

    if [ -z "$INGRESS_IP" ]; then
        log_warn "Ingress IP not yet assigned. Please wait a few minutes and check again."
    else
        log_info "Ingress IP: $INGRESS_IP"
        log_info "Configure your DNS to point to this IP address:"
        echo "  - jobpilot.com -> $INGRESS_IP"
        echo "  - www.jobpilot.com -> $INGRESS_IP"
        echo "  - api.jobpilot.com -> $INGRESS_IP"
    fi
}

main() {
    log_info "Starting JobPilot deployment to AKS..."
    echo ""

    check_prerequisites
    get_aks_credentials
    install_addons
    attach_acr
    deploy_base_resources
    deploy_services
    deploy_network_policies
    deploy_ingress
    wait_for_deployments
    show_status
    get_ingress_ip

    echo ""
    log_info "Deployment completed successfully!"
    log_info "Use 'kubectl get pods -n $NAMESPACE' to check pod status."
    log_info "Use 'kubectl logs -n $NAMESPACE -l app=<service-name>' to view logs."
}

# Run main function
main "$@"
