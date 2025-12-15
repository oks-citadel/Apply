#!/bin/bash

###############################################################################
# ApplyForUs AI Platform - System Validation Script
#
# Purpose: Validate system readiness and health before/after deployment
# Usage: ./scripts/validate-system.sh [environment]
#
# This script:
# - Checks all health endpoints
# - Verifies metrics are being collected
# - Runs smoke tests of critical flows
# - Reports overall system readiness
###############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-local}"
TIMEOUT=10
FAILED_CHECKS=0
TOTAL_CHECKS=0

# Service URLs based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    BASE_URL="${PRODUCTION_BASE_URL:-https://api.applyforus.com}"
elif [ "$ENVIRONMENT" = "staging" ]; then
    BASE_URL="${STAGING_BASE_URL:-https://api-staging.applyforus.com}"
else
    BASE_URL="${LOCAL_BASE_URL:-http://localhost}"
fi

# Service ports for local development
AUTH_PORT="${AUTH_PORT:-3001}"
USER_PORT="${USER_PORT:-8002}"
RESUME_PORT="${RESUME_PORT:-8003}"
JOB_PORT="${JOB_PORT:-8004}"
AUTO_APPLY_PORT="${AUTO_APPLY_PORT:-8005}"
ANALYTICS_PORT="${ANALYTICS_PORT:-8006}"
NOTIFICATION_PORT="${NOTIFICATION_PORT:-8007}"
AI_PORT="${AI_PORT:-8008}"

###############################################################################
# Helper Functions
###############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_service_health() {
    local service_name=$1
    local health_url=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking $service_name health... "

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$health_url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        print_success "$service_name is healthy"

        # Parse health check details if available
        if command -v jq &> /dev/null; then
            status=$(echo "$body" | jq -r '.status // empty' 2>/dev/null)
            if [ ! -z "$status" ]; then
                echo "  Status: $status"

                # Check dependencies
                deps=$(echo "$body" | jq -r '.details // empty' 2>/dev/null)
                if [ ! -z "$deps" ] && [ "$deps" != "null" ]; then
                    echo "$deps" | jq -r 'to_entries[] | "    \(.key): \(.value.status)"' 2>/dev/null
                fi
            fi
        fi
        return 0
    else
        print_error "$service_name is unhealthy (HTTP $http_code)"
        return 1
    fi
}

check_metrics_endpoint() {
    local service_name=$1
    local metrics_url=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    echo -n "Checking $service_name metrics... "

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$metrics_url" 2>/dev/null || echo "000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        # Count metrics
        metric_count=$(echo "$body" | grep -c "^[a-z]" || echo 0)
        print_success "$service_name metrics exposed ($metric_count metrics)"
        return 0
    else
        print_error "$service_name metrics not accessible (HTTP $http_code)"
        return 1
    fi
}

verify_critical_metrics() {
    local metrics_url=$1
    local service_name=$2

    echo -n "Verifying critical metrics for $service_name... "

    response=$(curl -s --max-time $TIMEOUT "$metrics_url" 2>/dev/null || echo "")

    # Check for key metrics
    local has_http_metrics=$(echo "$response" | grep -c "http_request_duration_seconds" || echo 0)
    local has_db_metrics=$(echo "$response" | grep -c "database_query_duration_seconds" || echo 0)

    if [ "$has_http_metrics" -gt 0 ]; then
        print_success "HTTP metrics present"
    else
        print_warning "HTTP metrics missing"
    fi

    if [ "$has_db_metrics" -gt 0 ]; then
        print_info "Database metrics present"
    fi
}

test_authentication() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    print_header "Testing Authentication Flow"

    local auth_url="$1/api/v1/auth"

    # Test login
    echo -n "Testing login endpoint... "

    login_response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
        -X POST "$auth_url/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@applyforus.com",
            "password": "Test123!@#"
        }' 2>/dev/null || echo "000")

    http_code=$(echo "$login_response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_success "Login endpoint working"

        # Extract token
        if command -v jq &> /dev/null; then
            token=$(echo "$login_response" | head -n-1 | jq -r '.accessToken // .access_token // empty' 2>/dev/null)
            if [ ! -z "$token" ]; then
                print_info "Access token received"
                echo "$token" > /tmp/applyforus-token.txt
                return 0
            fi
        fi
    elif [ "$http_code" = "401" ] || [ "$http_code" = "400" ]; then
        print_warning "Login endpoint accessible but credentials invalid (expected for test user)"
        return 0
    else
        print_error "Login endpoint failed (HTTP $http_code)"
        return 1
    fi
}

test_job_search() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    print_header "Testing Job Search Flow"

    local job_url="$1/api/v1/jobs"
    local token=""

    if [ -f /tmp/applyforus-token.txt ]; then
        token=$(cat /tmp/applyforus-token.txt)
    fi

    echo -n "Testing job search endpoint... "

    if [ ! -z "$token" ]; then
        search_response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            -H "Authorization: Bearer $token" \
            "$job_url?page=1&limit=10" 2>/dev/null || echo "000")
    else
        search_response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
            "$job_url?page=1&limit=10" 2>/dev/null || echo "000")
    fi

    http_code=$(echo "$search_response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "Job search working"

        if command -v jq &> /dev/null; then
            body=$(echo "$search_response" | head -n-1)
            job_count=$(echo "$body" | jq '.data | length // 0' 2>/dev/null || echo "0")
            print_info "Found $job_count jobs"
        fi
        return 0
    elif [ "$http_code" = "401" ]; then
        print_warning "Job search requires authentication"
        return 0
    else
        print_error "Job search failed (HTTP $http_code)"
        return 1
    fi
}

check_prometheus() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    print_header "Checking Prometheus Metrics Collection"

    local prometheus_url="${PROMETHEUS_URL:-http://localhost:9090}"

    echo -n "Checking Prometheus availability... "

    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT \
        "$prometheus_url/-/healthy" 2>/dev/null || echo "000")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ]; then
        print_success "Prometheus is running"

        # Check targets
        echo -n "Checking Prometheus targets... "
        targets_response=$(curl -s --max-time $TIMEOUT \
            "$prometheus_url/api/v1/targets" 2>/dev/null || echo "")

        if [ ! -z "$targets_response" ]; then
            if command -v jq &> /dev/null; then
                active_targets=$(echo "$targets_response" | jq '.data.activeTargets | length // 0' 2>/dev/null || echo "0")
                print_info "$active_targets active targets"

                # Show target health
                echo "$targets_response" | jq -r '.data.activeTargets[] | "\(.labels.job): \(.health)"' 2>/dev/null | while read line; do
                    echo "    $line"
                done
            fi
        fi
        return 0
    else
        print_warning "Prometheus not accessible (may be running separately)"
        return 0
    fi
}

check_gateway_metrics() {
    print_header "Verifying Gateway Reliability Metrics"

    local auth_metrics="$1/metrics"

    echo "Checking for gateway-specific metrics..."

    response=$(curl -s --max-time $TIMEOUT "$auth_metrics" 2>/dev/null || echo "")

    # Check for required metrics
    metrics_to_check=(
        "gateway_rate_limit_total"
        "gateway_rate_limit_degraded_total"
        "redis_operation_duration_seconds"
        "circuit_breaker_state"
        "http_request_duration_by_route_seconds"
    )

    for metric in "${metrics_to_check[@]}"; do
        if echo "$response" | grep -q "$metric"; then
            print_success "$metric metric exists"
        else
            print_warning "$metric metric not found"
        fi
    done
}

###############################################################################
# Main Validation Flow
###############################################################################

main() {
    print_header "ApplyForUs AI Platform - System Validation"
    echo "Environment: $ENVIRONMENT"
    echo "Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"

    # Phase 1: Health Checks
    print_header "Phase 1: Service Health Checks"

    if [ "$ENVIRONMENT" = "local" ]; then
        check_service_health "Auth Service" "http://localhost:$AUTH_PORT/health"
        check_service_health "User Service" "http://localhost:$USER_PORT/health"
        check_service_health "Resume Service" "http://localhost:$RESUME_PORT/health"
        check_service_health "Job Service" "http://localhost:$JOB_PORT/health"
        check_service_health "Auto-Apply Service" "http://localhost:$AUTO_APPLY_PORT/health"
        check_service_health "Analytics Service" "http://localhost:$ANALYTICS_PORT/health"
        check_service_health "Notification Service" "http://localhost:$NOTIFICATION_PORT/health"
        check_service_health "AI Service" "http://localhost:$AI_PORT/health"
    else
        check_service_health "API Gateway" "$BASE_URL/health"
    fi

    # Phase 2: Metrics Verification
    print_header "Phase 2: Metrics Verification"

    if [ "$ENVIRONMENT" = "local" ]; then
        check_metrics_endpoint "Auth Service" "http://localhost:$AUTH_PORT/metrics"
        check_metrics_endpoint "User Service" "http://localhost:$USER_PORT/metrics"
        check_metrics_endpoint "Job Service" "http://localhost:$JOB_PORT/metrics"

        verify_critical_metrics "http://localhost:$AUTH_PORT/metrics" "Auth Service"
        check_gateway_metrics "http://localhost:$AUTH_PORT"
    fi

    # Phase 3: Functional Smoke Tests
    print_header "Phase 3: Functional Smoke Tests"

    if [ "$ENVIRONMENT" = "local" ]; then
        test_authentication "http://localhost:$AUTH_PORT"
        test_job_search "http://localhost:$JOB_PORT"
    else
        test_authentication "$BASE_URL"
        test_job_search "$BASE_URL"
    fi

    # Phase 4: Monitoring Stack
    if [ "$ENVIRONMENT" = "local" ]; then
        check_prometheus
    fi

    # Final Report
    print_header "Validation Summary"

    echo "Total Checks: $TOTAL_CHECKS"
    echo "Failed Checks: $FAILED_CHECKS"
    echo "Success Rate: $(( (TOTAL_CHECKS - FAILED_CHECKS) * 100 / TOTAL_CHECKS ))%"

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "\n${GREEN}✓ All validation checks passed!${NC}"
        echo -e "${GREEN}✓ System is ready for use.${NC}\n"
        exit 0
    elif [ $FAILED_CHECKS -le 2 ]; then
        echo -e "\n${YELLOW}⚠ Some validation checks failed${NC}"
        echo -e "${YELLOW}⚠ System may be partially operational${NC}\n"
        exit 1
    else
        echo -e "\n${RED}✗ Multiple validation checks failed${NC}"
        echo -e "${RED}✗ System is NOT ready${NC}\n"
        exit 2
    fi
}

# Cleanup on exit
cleanup() {
    rm -f /tmp/applyforus-token.txt
}

trap cleanup EXIT

# Run main validation
main "$@"
