#!/bin/bash

#############################################
# Kubernetes Manifest Validation Script
# This script validates all Kubernetes YAML manifests
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_FILES=0
PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Kubernetes Manifest Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_info "Checking prerequisites..."

    local missing_tools=()

    # Check for kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi

    # Check for kubeval (optional but recommended)
    if ! command -v kubeval &> /dev/null; then
        print_warning "kubeval is not installed. Install it for enhanced validation: https://kubeval.instrumenta.dev/"
    fi

    # Check for kustomize
    if ! command -v kustomize &> /dev/null; then
        print_warning "kustomize is not installed. Install it for overlay validation: https://kustomize.io/"
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi

    print_success "All required tools are installed"
    echo ""
}

# Function to validate YAML syntax
validate_yaml_syntax() {
    local file=$1
    TOTAL_FILES=$((TOTAL_FILES + 1))

    # Use kubectl to dry-run validate
    if kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1; then
        print_success "YAML syntax valid: $file"
        PASSED=$((PASSED + 1))
        return 0
    else
        print_error "YAML syntax error: $file"
        kubectl apply --dry-run=client -f "$file" 2>&1 | sed 's/^/  /'
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Function to validate with kubeval if available
validate_with_kubeval() {
    local file=$1

    if command -v kubeval &> /dev/null; then
        if kubeval --strict "$file" > /dev/null 2>&1; then
            return 0
        else
            print_warning "kubeval warnings for: $file"
            kubeval --strict "$file" 2>&1 | sed 's/^/  /'
            WARNINGS=$((WARNINGS + 1))
            return 1
        fi
    fi
    return 0
}

# Function to check for common issues
check_common_issues() {
    local file=$1
    local issues_found=0

    # Check for missing resource limits
    if grep -q "kind: Deployment" "$file" || grep -q "kind: StatefulSet" "$file"; then
        if ! grep -q "resources:" "$file"; then
            print_warning "Missing resource limits in: $file"
            issues_found=1
        fi
    fi

    # Check for missing liveness/readiness probes
    if grep -q "kind: Deployment" "$file" || grep -q "kind: StatefulSet" "$file"; then
        if ! grep -q "livenessProbe:" "$file"; then
            print_warning "Missing livenessProbe in: $file"
            issues_found=1
        fi
        if ! grep -q "readinessProbe:" "$file"; then
            print_warning "Missing readinessProbe in: $file"
            issues_found=1
        fi
    fi

    # Check for hardcoded secrets (potential security issue)
    if grep -q "password:" "$file" || grep -q "apiKey:" "$file"; then
        if ! grep -q "valueFrom:" "$file"; then
            print_warning "Potential hardcoded secrets in: $file"
            issues_found=1
        fi
    fi

    return $issues_found
}

# Validate base manifests
echo -e "${BLUE}Validating base manifests...${NC}"
echo ""
for file in base/*.yaml; do
    if [ -f "$file" ]; then
        validate_yaml_syntax "$file"
        validate_with_kubeval "$file"
        check_common_issues "$file"
        echo ""
    fi
done

# Validate service manifests
echo -e "${BLUE}Validating service manifests...${NC}"
echo ""
for file in services/*.yaml; do
    if [ -f "$file" ]; then
        # Skip backup files
        if [[ "$file" == *.backup ]] || [[ "$file" == *.bak ]]; then
            continue
        fi
        validate_yaml_syntax "$file"
        validate_with_kubeval "$file"
        check_common_issues "$file"
        echo ""
    fi
done

# Validate monitoring manifests if they exist
if [ -d "monitoring" ]; then
    echo -e "${BLUE}Validating monitoring manifests...${NC}"
    echo ""
    for file in monitoring/*.yaml; do
        if [ -f "$file" ]; then
            validate_yaml_syntax "$file"
            validate_with_kubeval "$file"
            check_common_issues "$file"
            echo ""
        fi
    done
fi

# Validate kustomization files
echo -e "${BLUE}Validating kustomization files...${NC}"
echo ""

# Validate root kustomization
if [ -f "kustomization.yaml" ]; then
    print_info "Validating root kustomization.yaml..."
    if command -v kustomize &> /dev/null; then
        if kustomize build . > /dev/null 2>&1; then
            print_success "Root kustomization is valid"
        else
            print_error "Root kustomization has errors"
            kustomize build . 2>&1 | sed 's/^/  /'
            FAILED=$((FAILED + 1))
        fi
    fi
    echo ""
fi

# Validate environment overlays
for env in dev staging production; do
    if [ -d "overlays/$env" ]; then
        print_info "Validating $env overlay..."
        if command -v kustomize &> /dev/null; then
            if kustomize build "overlays/$env" > /dev/null 2>&1; then
                print_success "$env overlay is valid"
            else
                print_error "$env overlay has errors"
                kustomize build "overlays/$env" 2>&1 | sed 's/^/  /'
                FAILED=$((FAILED + 1))
            fi
        fi
        echo ""
    fi
done

# Print summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Total files validated: $TOTAL_FILES"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    print_success "All validations passed!"
    exit 0
else
    print_error "Validation failed with $FAILED error(s)"
    exit 1
fi
