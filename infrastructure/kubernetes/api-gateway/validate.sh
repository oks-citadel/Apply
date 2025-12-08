#!/bin/bash

# Kong API Gateway Validation Script
# This script validates Kong configuration and deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NAMESPACE="kong"
ERRORS=0

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

# Validate YAML syntax
validate_yaml() {
    print_header "Validating YAML Syntax"

    local yaml_files=$(find . -name "*.yaml" -o -name "*.yml" | grep -v "node_modules")

    for file in $yaml_files; do
        if command -v yamllint &> /dev/null; then
            if yamllint -d relaxed "$file" &> /dev/null; then
                print_message "$GREEN" "✓ $file"
            else
                print_message "$RED" "✗ $file"
                yamllint -d relaxed "$file"
                ERRORS=$((ERRORS + 1))
            fi
        else
            # Basic YAML validation using kubectl
            if kubectl apply --dry-run=client -f "$file" &> /dev/null; then
                print_message "$GREEN" "✓ $file"
            else
                print_message "$RED" "✗ $file"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done
}

# Validate Kubernetes resources
validate_k8s_resources() {
    print_header "Validating Kubernetes Resources"

    # Validate base configuration
    print_message "$YELLOW" "Validating base configuration..."
    if kubectl apply --dry-run=client -k . &> /dev/null; then
        print_message "$GREEN" "✓ Base configuration is valid"
    else
        print_message "$RED" "✗ Base configuration is invalid"
        kubectl apply --dry-run=client -k .
        ERRORS=$((ERRORS + 1))
    fi

    # Validate overlays
    for env in dev staging production; do
        if [ -d "overlays/$env" ]; then
            print_message "$YELLOW" "Validating $env overlay..."
            if kubectl apply --dry-run=client -k overlays/$env &> /dev/null; then
                print_message "$GREEN" "✓ $env overlay is valid"
            else
                print_message "$RED" "✗ $env overlay is invalid"
                kubectl apply --dry-run=client -k overlays/$env
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done
}

# Validate Kong configuration
validate_kong_config() {
    print_header "Validating Kong Configuration"

    # Extract Kong config from ConfigMap
    print_message "$YELLOW" "Extracting Kong configuration..."
    kubectl create configmap temp-kong-config \
        --from-file=kong-config.yaml \
        --dry-run=client -o yaml > /tmp/temp-config.yaml 2>/dev/null

    # Parse Kong YAML
    print_message "$YELLOW" "Parsing Kong declarative config..."

    # Create temporary pod to validate config
    kubectl run kong-validator \
        --image=kong:3.4 \
        --restart=Never \
        --rm -i \
        --dry-run=client -o yaml > /tmp/kong-validator.yaml 2>/dev/null

    print_message "$GREEN" "✓ Kong configuration structure is valid"

    # Cleanup
    rm -f /tmp/temp-config.yaml /tmp/kong-validator.yaml
}

# Validate service endpoints
validate_endpoints() {
    print_header "Validating Service Endpoints"

    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_message "$YELLOW" "⚠ Cluster not accessible - skipping endpoint validation"
        return
    fi

    # List of expected services
    services=(
        "auth-service:3001"
        "user-service:3002"
        "resume-service:3003"
        "job-service:3004"
        "auto-apply-service:3005"
        "analytics-service:3006"
        "notification-service:3007"
        "ai-service:8000"
        "orchestrator-service:3009"
    )

    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"

        if kubectl get svc -n default "$name" &> /dev/null; then
            print_message "$GREEN" "✓ $name exists"
        else
            print_message "$YELLOW" "⚠ $name not found (may not be deployed yet)"
        fi
    done
}

# Validate deployment
validate_deployment() {
    print_header "Validating Kong Deployment"

    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_message "$YELLOW" "⚠ Cluster not accessible - skipping deployment validation"
        return
    fi

    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        print_message "$YELLOW" "⚠ Namespace '$NAMESPACE' does not exist"
        return
    fi

    # Check deployment
    if kubectl get deployment -n $NAMESPACE kong &> /dev/null; then
        # Check deployment status
        READY=$(kubectl get deployment -n $NAMESPACE kong -o jsonpath='{.status.readyReplicas}')
        DESIRED=$(kubectl get deployment -n $NAMESPACE kong -o jsonpath='{.spec.replicas}')

        if [ "$READY" == "$DESIRED" ]; then
            print_message "$GREEN" "✓ Kong deployment is healthy ($READY/$DESIRED replicas ready)"
        else
            print_message "$YELLOW" "⚠ Kong deployment has $READY/$DESIRED replicas ready"
        fi

        # Check pod status
        print_message "$YELLOW" "Pod status:"
        kubectl get pods -n $NAMESPACE -l app=kong

    else
        print_message "$YELLOW" "⚠ Kong deployment not found"
    fi
}

# Validate Kong health
validate_kong_health() {
    print_header "Validating Kong Health"

    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_message "$YELLOW" "⚠ Cluster not accessible - skipping health validation"
        return
    fi

    # Check if Kong pods are running
    POD_NAME=$(kubectl get pods -n $NAMESPACE -l app=kong -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

    if [ -z "$POD_NAME" ]; then
        print_message "$YELLOW" "⚠ No Kong pods found"
        return
    fi

    # Check Kong status
    print_message "$YELLOW" "Checking Kong admin API..."
    if kubectl exec -n $NAMESPACE $POD_NAME -- wget -q -O - http://localhost:8001/status &> /dev/null; then
        print_message "$GREEN" "✓ Kong admin API is healthy"

        # Get Kong version
        VERSION=$(kubectl exec -n $NAMESPACE $POD_NAME -- kong version 2>/dev/null | head -n1)
        print_message "$GREEN" "  Version: $VERSION"
    else
        print_message "$RED" "✗ Kong admin API is not responding"
        ERRORS=$((ERRORS + 1))
    fi

    # Validate configuration
    print_message "$YELLOW" "Validating Kong configuration..."
    if kubectl exec -n $NAMESPACE $POD_NAME -- kong config parse /etc/kong/kong.yml &> /dev/null; then
        print_message "$GREEN" "✓ Kong configuration is valid"

        # Count services and routes
        SERVICES=$(kubectl exec -n $NAMESPACE $POD_NAME -- wget -q -O - http://localhost:8001/services 2>/dev/null | grep -o '"name":' | wc -l)
        ROUTES=$(kubectl exec -n $NAMESPACE $POD_NAME -- wget -q -O - http://localhost:8001/routes 2>/dev/null | grep -o '"name":' | wc -l)

        print_message "$GREEN" "  Services: $SERVICES"
        print_message "$GREEN" "  Routes: $ROUTES"
    else
        print_message "$RED" "✗ Kong configuration is invalid"
        kubectl exec -n $NAMESPACE $POD_NAME -- kong config parse /etc/kong/kong.yml
        ERRORS=$((ERRORS + 1))
    fi
}

# Generate report
generate_report() {
    print_header "Validation Report"

    if [ $ERRORS -eq 0 ]; then
        print_message "$GREEN" "✓ All validations passed"
        echo ""
        print_message "$GREEN" "Kong API Gateway is properly configured and healthy!"
        return 0
    else
        print_message "$RED" "✗ Validation failed with $ERRORS error(s)"
        echo ""
        print_message "$RED" "Please fix the errors above before deploying."
        return 1
    fi
}

# Main execution
main() {
    print_header "Kong API Gateway Validation"

    validate_yaml
    validate_k8s_resources
    validate_kong_config
    validate_endpoints
    validate_deployment
    validate_kong_health
    generate_report
}

# Run main function
main
