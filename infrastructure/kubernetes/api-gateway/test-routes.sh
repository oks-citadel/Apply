#!/bin/bash

# Kong API Gateway Route Testing Script
# This script tests all configured routes in Kong

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NAMESPACE="kong"

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

# Get Kong proxy URL
get_kong_url() {
    # Try to get LoadBalancer IP
    KONG_IP=$(kubectl get svc -n $NAMESPACE kong-proxy -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

    if [ -n "$KONG_IP" ]; then
        KONG_URL="http://$KONG_IP"
        print_message "$GREEN" "Using Kong LoadBalancer IP: $KONG_IP"
    else
        # Fallback to port-forward
        print_message "$YELLOW" "LoadBalancer IP not available, using port-forward"
        print_message "$YELLOW" "Run in another terminal: kubectl port-forward -n $NAMESPACE svc/kong-proxy 8000:80"
        KONG_URL="http://localhost:8000"
    fi
}

# Test route
test_route() {
    local path=$1
    local method=${2:-GET}
    local expected_status=${3:-200}

    print_message "$YELLOW" "Testing: $method $path"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$KONG_URL$path" 2>/dev/null)

    # Accept any 2xx, 4xx status (service may return 401, 404, etc.)
    if [[ "$HTTP_CODE" =~ ^[24] ]]; then
        print_message "$GREEN" "  ✓ Route accessible (HTTP $HTTP_CODE)"

        # Check rate limit headers
        HEADERS=$(curl -s -I -X $method "$KONG_URL$path" 2>/dev/null)
        if echo "$HEADERS" | grep -q "X-RateLimit-Limit"; then
            LIMIT=$(echo "$HEADERS" | grep "X-RateLimit-Limit" | awk '{print $2}' | tr -d '\r')
            REMAINING=$(echo "$HEADERS" | grep "X-RateLimit-Remaining" | awk '{print $2}' | tr -d '\r')
            print_message "$GREEN" "  Rate Limit: $REMAINING/$LIMIT remaining"
        fi
    else
        print_message "$RED" "  ✗ Route error (HTTP $HTTP_CODE)"
    fi
}

# Test all routes
test_all_routes() {
    print_header "Testing Kong Routes"

    # Auth Service
    print_message "$YELLOW" "Auth Service:"
    test_route "/api/v1/auth/health" "GET"
    test_route "/api/v1/auth/login" "POST"

    # User Service
    print_message "$YELLOW" "User Service:"
    test_route "/api/v1/users/health" "GET"
    test_route "/api/v1/profiles/health" "GET"

    # Resume Service
    print_message "$YELLOW" "Resume Service:"
    test_route "/api/v1/resumes/health" "GET"

    # Job Service
    print_message "$YELLOW" "Job Service:"
    test_route "/api/v1/jobs/health" "GET"
    test_route "/api/v1/companies/health" "GET"

    # Auto Apply Service
    print_message "$YELLOW" "Auto Apply Service:"
    test_route "/api/v1/applications/health" "GET"
    test_route "/api/v1/auto-apply/health" "GET"

    # Analytics Service
    print_message "$YELLOW" "Analytics Service:"
    test_route "/api/v1/analytics/health" "GET"

    # Notification Service
    print_message "$YELLOW" "Notification Service:"
    test_route "/api/v1/notifications/health" "GET"

    # AI Service
    print_message "$YELLOW" "AI Service:"
    test_route "/api/v1/ai/health" "GET"

    # Orchestrator Service
    print_message "$YELLOW" "Orchestrator Service:"
    test_route "/api/v1/orchestrator/health" "GET"
}

# Test rate limiting
test_rate_limiting() {
    print_header "Testing Rate Limiting"

    print_message "$YELLOW" "Sending 10 requests to test rate limiting..."

    for i in {1..10}; do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$KONG_URL/api/v1/auth/health" 2>/dev/null)
        REMAINING=$(curl -s -I "$KONG_URL/api/v1/auth/health" 2>/dev/null | grep "X-RateLimit-Remaining" | awk '{print $2}' | tr -d '\r')

        print_message "$GREEN" "Request $i: HTTP $HTTP_CODE, Remaining: $REMAINING"
        sleep 0.5
    done
}

# Test CORS
test_cors() {
    print_header "Testing CORS"

    print_message "$YELLOW" "Testing CORS preflight request..."

    CORS_HEADERS=$(curl -s -I -X OPTIONS \
        -H "Origin: http://example.com" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        "$KONG_URL/api/v1/auth/health" 2>/dev/null)

    if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
        print_message "$GREEN" "✓ CORS is enabled"
        echo "$CORS_HEADERS" | grep "Access-Control"
    else
        print_message "$RED" "✗ CORS headers not found"
    fi
}

# Test admin API
test_admin_api() {
    print_header "Testing Kong Admin API"

    print_message "$YELLOW" "Port-forwarding to admin API..."
    print_message "$YELLOW" "Run in another terminal: kubectl port-forward -n $NAMESPACE svc/kong-admin 8001:8001"

    # Wait a bit for user to set up port-forward
    sleep 2

    if curl -s http://localhost:8001/status &> /dev/null; then
        print_message "$GREEN" "✓ Admin API accessible"

        # Get services
        SERVICES=$(curl -s http://localhost:8001/services 2>/dev/null | grep -o '"name":' | wc -l)
        print_message "$GREEN" "  Services configured: $SERVICES"

        # Get routes
        ROUTES=$(curl -s http://localhost:8001/routes 2>/dev/null | grep -o '"name":' | wc -l)
        print_message "$GREEN" "  Routes configured: $ROUTES"

        # Get plugins
        PLUGINS=$(curl -s http://localhost:8001/plugins 2>/dev/null | grep -o '"name":' | wc -l)
        print_message "$GREEN" "  Plugins enabled: $PLUGINS"
    else
        print_message "$YELLOW" "⚠ Admin API not accessible (ensure port-forward is running)"
    fi
}

# Main execution
main() {
    print_header "Kong API Gateway Route Testing"

    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_message "$RED" "ERROR: Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check if Kong is deployed
    if ! kubectl get deployment -n $NAMESPACE kong &> /dev/null; then
        print_message "$RED" "ERROR: Kong deployment not found"
        exit 1
    fi

    # Get Kong URL
    get_kong_url

    # Run tests
    test_all_routes
    test_rate_limiting
    test_cors
    # test_admin_api  # Uncomment if port-forward is set up

    print_header "Testing Complete"
    print_message "$GREEN" "All route tests completed!"
}

# Run main function
main
