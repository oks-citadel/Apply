#!/bin/bash

################################################################################
# Azure Deployment Verification Script
################################################################################
# This script verifies that the deployment is properly configured for Azure
# and has NO Docker Desktop dependencies for production.
#
# Usage: ./scripts/verify-azure-deployment.sh [--fix]
#        --fix: Attempt to fix common issues (not implemented yet)
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Azure Deployment Verification Script                 ║${NC}"
echo -e "${BLUE}║         Ensuring Zero Docker Desktop Dependencies            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section header
section_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

# Function to check for localhost references in files
check_localhost_references() {
    section_header "Checking for localhost references in production configs"

    local files_to_check=(
        "infrastructure/kubernetes/base/configmap.yaml"
        "infrastructure/kubernetes/production/*.yaml"
    )

    local localhost_found=0

    for pattern in "${files_to_check[@]}"; do
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

                # Check for localhost or 127.0.0.1
                if grep -q -E "(localhost|127\.0\.0\.1)" "$file"; then
                    echo -e "${RED}✗ FAIL${NC}: Found localhost reference in: $file"
                    grep -n -E "(localhost|127\.0\.0\.1)" "$file" | head -5
                    FAILED_CHECKS=$((FAILED_CHECKS + 1))
                    localhost_found=1
                else
                    echo -e "${GREEN}✓ PASS${NC}: No localhost references in: $file"
                    PASSED_CHECKS=$((PASSED_CHECKS + 1))
                fi
            fi
        done < <(find . -path "./$pattern" 2>/dev/null)
    done

    if [ $localhost_found -eq 0 ]; then
        echo -e "${GREEN}All production configs are clean!${NC}"
    fi
}

# Function to verify Azure PostgreSQL configuration
check_azure_postgres() {
    section_header "Verifying Azure PostgreSQL Configuration"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "applyforus-postgres.postgres.database.azure.com" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Azure PostgreSQL endpoint configured correctly"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Azure PostgreSQL endpoint not found in ConfigMap"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Check for SSL/TLS configuration
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if grep -q 'POSTGRES_SSL.*true' infrastructure/kubernetes/base/configmap.yaml || \
       grep -q 'DB_SSL.*true' infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: PostgreSQL SSL/TLS enabled"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: PostgreSQL SSL/TLS not explicitly enabled"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Function to verify Azure Redis configuration
check_azure_redis() {
    section_header "Verifying Azure Redis Cache Configuration"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "applyforus-redis.redis.cache.windows.net" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Azure Redis Cache endpoint configured correctly"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Azure Redis Cache endpoint not found in ConfigMap"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Check for TLS configuration
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if grep -q 'REDIS_TLS.*true' infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Redis TLS enabled"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Redis TLS not enabled (required for Azure Redis Cache)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Check for port 6380 (Azure Redis SSL port)
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if grep -q 'REDIS_PORT.*6380' infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Redis port set to 6380 (SSL port)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Redis port should be 6380 for Azure Redis Cache with SSL"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Function to verify Kubernetes internal service URLs
check_k8s_service_urls() {
    section_header "Verifying Kubernetes Internal Service URLs"

    local services=("auth" "user" "job" "ai" "resume" "analytics" "notification" "auto-apply")

    for service in "${services[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

        if grep -q "${service}-service.applyforus.svc.cluster.local" infrastructure/kubernetes/base/configmap.yaml; then
            echo -e "${GREEN}✓ PASS${NC}: ${service}-service using Kubernetes DNS"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${RED}✗ FAIL${NC}: ${service}-service not using Kubernetes DNS"
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
        fi
    done
}

# Function to verify Azure Storage configuration
check_azure_storage() {
    section_header "Verifying Azure Blob Storage Configuration"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "AZURE_STORAGE_ACCOUNT_NAME.*applyforusstorage" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Azure Storage Account configured"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: Azure Storage Account not configured in ConfigMap"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Check for blob containers
    local containers=("resumes" "documents" "user-uploads" "profile-photos")
    for container in "${containers[@]}"; do
        TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
        if grep -q "AZURE_BLOB_CONTAINER.*$container" infrastructure/kubernetes/base/configmap.yaml; then
            echo -e "${GREEN}✓ PASS${NC}: Azure Blob container '$container' configured"
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
        else
            echo -e "${YELLOW}⚠ WARNING${NC}: Azure Blob container '$container' not found"
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
        fi
    done
}

# Function to verify CORS configuration
check_cors_config() {
    section_header "Verifying CORS Configuration for Production"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "CORS_ORIGIN.*applyforus.com" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: CORS configured for production domain"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: CORS not configured for production domain"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi

    # Check for localhost in CORS (should NOT be present in production)
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if grep -q "CORS.*localhost" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${RED}✗ FAIL${NC}: Localhost found in CORS configuration (production should not have localhost)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        echo -e "${GREEN}✓ PASS${NC}: No localhost in CORS configuration"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi
}

# Function to check environment files
check_env_files() {
    section_header "Verifying .env.example Files"

    local env_files=(
        ".env.example"
        "services/auth-service/.env.example"
        "services/user-service/.env.example"
        "services/job-service/.env.example"
        "services/ai-service/.env.example"
        "services/resume-service/.env.example"
        "services/notification-service/.env.example"
        "services/auto-apply-service/.env.example"
        "services/analytics-service/.env.example"
    )

    for env_file in "${env_files[@]}"; do
        if [ -f "$env_file" ]; then
            TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

            # Check if Azure endpoints are documented
            if grep -q "applyforus-postgres.postgres.database.azure.com\|applyforus-redis.redis.cache.windows.net" "$env_file"; then
                echo -e "${GREEN}✓ PASS${NC}: Azure endpoints documented in: $env_file"
                PASSED_CHECKS=$((PASSED_CHECKS + 1))
            else
                echo -e "${YELLOW}⚠ WARNING${NC}: Azure endpoints not found in: $env_file"
                WARNING_CHECKS=$((WARNING_CHECKS + 1))
            fi
        fi
    done
}

# Function to verify no Docker Compose dependencies in production files
check_docker_compose_prod() {
    section_header "Verifying Docker Compose Not Used in Production Paths"

    # Check that docker-compose files exist (for local dev) but aren't referenced in production K8s
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if find infrastructure/kubernetes/production -type f -name "*.yaml" -exec grep -l "docker-compose" {} \; 2>/dev/null | grep -q .; then
        echo -e "${RED}✗ FAIL${NC}: docker-compose referenced in production Kubernetes configs"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    else
        echo -e "${GREEN}✓ PASS${NC}: No docker-compose references in production K8s configs"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    fi

    # Verify docker-compose files still exist for local dev
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "docker-compose.yml" ] && [ -f "docker-compose.dev.yml" ]; then
        echo -e "${GREEN}✓ PASS${NC}: Docker Compose files present for local development"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Docker Compose files missing (needed for local dev)"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Function to check Elasticsearch configuration
check_elasticsearch() {
    section_header "Verifying Elasticsearch Configuration"

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if grep -q "applyforus-elasticsearch" infrastructure/kubernetes/base/configmap.yaml; then
        echo -e "${GREEN}✓ PASS${NC}: Azure Elasticsearch endpoint configured"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: Azure Elasticsearch endpoint not found (may not be deployed yet)"
        WARNING_CHECKS=$((WARNING_CHECKS + 1))
    fi
}

# Function to generate summary
generate_summary() {
    section_header "Verification Summary"

    echo ""
    echo -e "Total Checks:    ${BLUE}${TOTAL_CHECKS}${NC}"
    echo -e "Passed:          ${GREEN}${PASSED_CHECKS}${NC}"
    echo -e "Failed:          ${RED}${FAILED_CHECKS}${NC}"
    echo -e "Warnings:        ${YELLOW}${WARNING_CHECKS}${NC}"
    echo ""

    local pass_rate=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        pass_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    fi

    echo -e "Pass Rate:       ${pass_rate}%"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                     ✓ ALL CHECKS PASSED                       ║${NC}"
        echo -e "${GREEN}║     Deployment is properly configured for Azure!              ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"

        if [ $WARNING_CHECKS -gt 0 ]; then
            echo -e "${YELLOW}Note: There are ${WARNING_CHECKS} warnings that should be reviewed.${NC}"
        fi

        exit 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                     ✗ CHECKS FAILED                           ║${NC}"
        echo -e "${RED}║     Please fix the issues above before deploying!            ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
        exit 1
    fi
}

# Main execution
main() {
    check_localhost_references
    check_azure_postgres
    check_azure_redis
    check_k8s_service_urls
    check_azure_storage
    check_cors_config
    check_env_files
    check_docker_compose_prod
    check_elasticsearch
    generate_summary
}

# Run main function
main
