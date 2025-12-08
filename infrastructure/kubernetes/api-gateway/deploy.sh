#!/bin/bash

# Kong API Gateway Deployment Script
# This script deploys Kong API Gateway to Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-base}
NAMESPACE="kong"
WAIT_TIMEOUT=300

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Print section header
print_header() {
    echo ""
    print_message "$YELLOW" "============================================"
    print_message "$YELLOW" "$1"
    print_message "$YELLOW" "============================================"
}

# Check if kubectl is installed
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_message "$RED" "ERROR: kubectl is not installed"
        exit 1
    fi
    print_message "$GREEN" "✓ kubectl is installed"
}

# Check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_message "$RED" "ERROR: Cannot connect to Kubernetes cluster"
        exit 1
    fi
    print_message "$GREEN" "✓ Connected to Kubernetes cluster"
}

# Validate Kubernetes manifests
validate_manifests() {
    print_header "Validating Kubernetes Manifests"

    if [ "$ENVIRONMENT" == "base" ]; then
        kubectl apply --dry-run=client -k . > /dev/null 2>&1
    else
        kubectl apply --dry-run=client -k overlays/$ENVIRONMENT > /dev/null 2>&1
    fi

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✓ Manifests are valid"
    else
        print_message "$RED" "✗ Manifest validation failed"
        exit 1
    fi
}

# Deploy Kong
deploy_kong() {
    print_header "Deploying Kong API Gateway ($ENVIRONMENT)"

    if [ "$ENVIRONMENT" == "base" ]; then
        kubectl apply -k .
    else
        kubectl apply -k overlays/$ENVIRONMENT
    fi

    print_message "$GREEN" "✓ Kong resources deployed"
}

# Wait for Kong to be ready
wait_for_kong() {
    print_header "Waiting for Kong to be Ready"

    print_message "$YELLOW" "Waiting for Kong deployment to be ready (timeout: ${WAIT_TIMEOUT}s)..."

    if kubectl wait --for=condition=available --timeout=${WAIT_TIMEOUT}s \
        deployment/kong -n $NAMESPACE &> /dev/null; then
        print_message "$GREEN" "✓ Kong deployment is ready"
    else
        print_message "$RED" "✗ Kong deployment failed to become ready"
        print_message "$YELLOW" "Checking pod status..."
        kubectl get pods -n $NAMESPACE
        print_message "$YELLOW" "Checking logs..."
        kubectl logs -n $NAMESPACE -l app=kong --tail=50
        exit 1
    fi
}

# Verify Kong is healthy
verify_kong() {
    print_header "Verifying Kong Health"

    # Check pod status
    print_message "$YELLOW" "Checking pod status..."
    kubectl get pods -n $NAMESPACE

    # Get pod name
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=kong -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$POD_NAME" ]; then
        print_message "$RED" "✗ No Kong pods found"
        exit 1
    fi

    # Check Kong status via admin API
    print_message "$YELLOW" "Checking Kong admin API..."
    if kubectl exec -n $NAMESPACE $POD_NAME -- wget -q -O - http://localhost:8001/status &> /dev/null; then
        print_message "$GREEN" "✓ Kong admin API is healthy"
    else
        print_message "$RED" "✗ Kong admin API is not responding"
        exit 1
    fi

    # Validate configuration
    print_message "$YELLOW" "Validating Kong configuration..."
    if kubectl exec -n $NAMESPACE $POD_NAME -- kong config parse /etc/kong/kong.yml &> /dev/null; then
        print_message "$GREEN" "✓ Kong configuration is valid"
    else
        print_message "$RED" "✗ Kong configuration is invalid"
        kubectl exec -n $NAMESPACE $POD_NAME -- kong config parse /etc/kong/kong.yml
        exit 1
    fi
}

# Get service information
get_service_info() {
    print_header "Kong Service Information"

    # Get LoadBalancer IP
    print_message "$YELLOW" "Waiting for LoadBalancer IP assignment..."

    local retries=0
    local max_retries=30
    local lb_ip=""

    while [ $retries -lt $max_retries ]; do
        lb_ip=$(kubectl get svc -n $NAMESPACE kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

        if [ -n "$lb_ip" ]; then
            break
        fi

        retries=$((retries + 1))
        sleep 5
    done

    if [ -n "$lb_ip" ]; then
        print_message "$GREEN" "✓ LoadBalancer IP: $lb_ip"
        echo ""
        print_message "$GREEN" "Kong is accessible at:"
        print_message "$GREEN" "  HTTP:  http://$lb_ip"
        print_message "$GREEN" "  HTTPS: https://$lb_ip"
    else
        print_message "$YELLOW" "⚠ LoadBalancer IP not yet assigned"
        print_message "$YELLOW" "  Run: kubectl get svc -n $NAMESPACE kong-proxy"
    fi

    echo ""
    print_message "$YELLOW" "Service endpoints:"
    kubectl get svc -n $NAMESPACE
}

# Print usage information
print_usage() {
    print_header "Kong API Gateway Deployed Successfully"

    echo ""
    print_message "$GREEN" "Next steps:"
    echo ""
    echo "1. Check Kong status:"
    echo "   kubectl get all -n $NAMESPACE"
    echo ""
    echo "2. View Kong logs:"
    echo "   kubectl logs -n $NAMESPACE -l app=kong -f"
    echo ""
    echo "3. Access Kong Admin API (port-forward):"
    echo "   kubectl port-forward -n $NAMESPACE svc/kong-admin 8001:8001"
    echo "   curl http://localhost:8001/status"
    echo ""
    echo "4. Test Kong proxy:"
    echo "   KONG_IP=\$(kubectl get svc -n $NAMESPACE kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}')"
    echo "   curl http://\$KONG_IP/api/v1/auth/health"
    echo ""
    echo "5. View Prometheus metrics:"
    echo "   curl http://localhost:8001/metrics"
    echo ""
}

# Main execution
main() {
    print_header "Kong API Gateway Deployment"

    # Validate environment parameter
    if [ "$ENVIRONMENT" != "base" ] && [ "$ENVIRONMENT" != "dev" ] && \
       [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
        print_message "$RED" "ERROR: Invalid environment. Use: base, dev, staging, or production"
        exit 1
    fi

    print_message "$YELLOW" "Environment: $ENVIRONMENT"
    print_message "$YELLOW" "Namespace: $NAMESPACE"

    # Run deployment steps
    check_kubectl
    check_cluster
    validate_manifests
    deploy_kong
    wait_for_kong
    verify_kong
    get_service_info
    print_usage

    print_message "$GREEN" "✓ Deployment completed successfully"
}

# Run main function
main
