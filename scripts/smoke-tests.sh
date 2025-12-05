#!/bin/bash

# ============================================================================
# Smoke Tests Script
# ============================================================================
# Runs smoke tests against deployed services to verify basic functionality

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Parse arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <environment>"
    echo "  environment: dev, staging, prod, or prod-staging"
    exit 1
fi

ENVIRONMENT=$1

# Set base URLs based on environment
case $ENVIRONMENT in
    dev)
        WEB_URL="https://jobpilot-dev-web.azurewebsites.net"
        AUTH_URL="https://jobpilot-dev-auth.azurewebsites.net"
        AI_URL="https://jobpilot-dev-ai.azurewebsites.net"
        ;;
    staging)
        WEB_URL="https://jobpilot-staging-web.azurewebsites.net"
        AUTH_URL="https://jobpilot-staging-auth.azurewebsites.net"
        AI_URL="https://jobpilot-staging-ai.azurewebsites.net"
        ;;
    prod)
        WEB_URL="https://jobpilot-prod-web.azurewebsites.net"
        AUTH_URL="https://jobpilot-prod-auth.azurewebsites.net"
        AI_URL="https://jobpilot-prod-ai.azurewebsites.net"
        ;;
    prod-staging)
        WEB_URL="https://jobpilot-prod-web-staging.azurewebsites.net"
        AUTH_URL="https://jobpilot-prod-auth-staging.azurewebsites.net"
        AI_URL="https://jobpilot-prod-ai-staging.azurewebsites.net"
        ;;
    *)
        log_error "Invalid environment: $ENVIRONMENT"
        exit 1
        ;;
esac

log_info "Running smoke tests for environment: $ENVIRONMENT"
echo ""

FAILED_TESTS=0
PASSED_TESTS=0

# ============================================================================
# Test Functions
# ============================================================================

test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    log_info "Testing: $name"
    log_info "  URL: $url"

    local response_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" 2>/dev/null || echo "000")

    if [ "$response_code" = "$expected_code" ]; then
        log_success "$name - HTTP $response_code"
        ((PASSED_TESTS++))
        return 0
    else
        log_error "$name - Expected HTTP $expected_code, got HTTP $response_code"
        ((FAILED_TESTS++))
        return 1
    fi
}

test_json_response() {
    local name=$1
    local url=$2
    local expected_field=$3

    log_info "Testing: $name"
    log_info "  URL: $url"

    local response=$(curl -s -m 10 "$url" 2>/dev/null || echo "{}")

    if echo "$response" | grep -q "$expected_field"; then
        log_success "$name - Response contains '$expected_field'"
        ((PASSED_TESTS++))
        return 0
    else
        log_error "$name - Response missing '$expected_field'"
        log_info "  Response: $response"
        ((FAILED_TESTS++))
        return 1
    fi
}

# ============================================================================
# Run Tests
# ============================================================================

echo "============================================================================"
echo "  Web Application Tests"
echo "============================================================================"

test_endpoint "Web App - Home Page" "$WEB_URL" 200
test_endpoint "Web App - Health Check" "$WEB_URL/api/health" 200

echo ""
echo "============================================================================"
echo "  Auth Service Tests"
echo "============================================================================"

test_endpoint "Auth Service - Health Check" "$AUTH_URL/health" 200
test_json_response "Auth Service - Status" "$AUTH_URL/health" "status"

# Test auth endpoints (should return 401 without credentials)
test_endpoint "Auth Service - Protected Route (Unauthorized)" "$AUTH_URL/api/user/profile" 401

echo ""
echo "============================================================================"
echo "  AI Service Tests"
echo "============================================================================"

test_endpoint "AI Service - Health Check" "$AI_URL/health" 200
test_json_response "AI Service - Status" "$AI_URL/health" "status"

# Test API docs are accessible
test_endpoint "AI Service - API Docs" "$AI_URL/docs" 200

echo ""
echo "============================================================================"
echo "  Integration Tests"
echo "============================================================================"

# Test CORS headers
log_info "Testing CORS configuration..."
cors_header=$(curl -s -I -H "Origin: $WEB_URL" "$AUTH_URL/health" | grep -i "access-control-allow-origin" || echo "")
if [ -n "$cors_header" ]; then
    log_success "CORS headers present"
    ((PASSED_TESTS++))
else
    log_error "CORS headers missing"
    ((FAILED_TESTS++))
fi

# Test SSL/TLS
log_info "Testing SSL/TLS certificates..."
for url in "$WEB_URL" "$AUTH_URL" "$AI_URL"; do
    if curl -s --head "$url" | grep -q "HTTP/2\|HTTP/1.1"; then
        log_success "SSL working for: $url"
        ((PASSED_TESTS++))
    else
        log_error "SSL issue for: $url"
        ((FAILED_TESTS++))
    fi
done

# ============================================================================
# Results
# ============================================================================

echo ""
echo "============================================================================"
echo "  Test Results"
echo "============================================================================"
echo "Environment: $ENVIRONMENT"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Total: $((PASSED_TESTS + FAILED_TESTS))"
echo "============================================================================"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    log_success "All smoke tests passed!"
    exit 0
else
    log_error "$FAILED_TESTS test(s) failed!"
    exit 1
fi
