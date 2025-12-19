#!/bin/bash
# Build all Docker images for ApplyForUs Platform
# This script builds all services and frontend applications with proper tagging
# DO NOT push to ACR - this is for local build verification only

set -e

# Configuration
REGISTRY="applyforusacr.azurecr.io"
VERSION="v3.0.0"
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track build results
declare -A BUILD_RESULTS
TOTAL_BUILDS=0
SUCCESS_BUILDS=0
FAILED_BUILDS=0

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to build a Docker image
build_image() {
    local service_name=$1
    local dockerfile_path=$2
    local context_path=$3
    local image_tag="${REGISTRY}/${service_name}"

    TOTAL_BUILDS=$((TOTAL_BUILDS + 1))

    print_status "$BLUE" "\n=========================================="
    print_status "$BLUE" "Building: ${service_name}"
    print_status "$BLUE" "Dockerfile: ${dockerfile_path}"
    print_status "$BLUE" "Context: ${context_path}"
    print_status "$BLUE" "==========================================\n"

    # Build with both tags
    if docker build \
        --file "${dockerfile_path}" \
        --tag "${image_tag}:${VERSION}" \
        --tag "${image_tag}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --build-arg VERSION="${VERSION}" \
        "${context_path}"; then

        SUCCESS_BUILDS=$((SUCCESS_BUILDS + 1))
        BUILD_RESULTS["${service_name}"]="SUCCESS"
        print_status "$GREEN" "✓ Successfully built ${service_name}"

        # Show image info
        docker images | grep "${REGISTRY}/${service_name}" | head -2
    else
        FAILED_BUILDS=$((FAILED_BUILDS + 1))
        BUILD_RESULTS["${service_name}"]="FAILED"
        print_status "$RED" "✗ Failed to build ${service_name}"
        return 1
    fi
}

# Function to build Next.js apps with specific environment variables
build_nextjs_app() {
    local app_name=$1
    local dockerfile_path=$2
    local context_path=$3
    local port=$4
    local image_tag="${REGISTRY}/${app_name}"

    TOTAL_BUILDS=$((TOTAL_BUILDS + 1))

    print_status "$BLUE" "\n=========================================="
    print_status "$BLUE" "Building Next.js App: ${app_name}"
    print_status "$BLUE" "Dockerfile: ${dockerfile_path}"
    print_status "$BLUE" "Context: ${context_path}"
    print_status "$BLUE" "==========================================\n"

    # Build with both tags and Next.js specific args
    if docker build \
        --file "${dockerfile_path}" \
        --tag "${image_tag}:${VERSION}" \
        --tag "${image_tag}:latest" \
        --build-arg BUILD_DATE="${BUILD_DATE}" \
        --build-arg VCS_REF="${VCS_REF}" \
        --build-arg VERSION="${VERSION}" \
        --build-arg DOCKER_BUILD="1" \
        --build-arg NEXT_PUBLIC_API_URL="https://api.applyforus.com" \
        --build-arg NEXT_PUBLIC_AUTH_API_URL="https://api.applyforus.com" \
        "${context_path}"; then

        SUCCESS_BUILDS=$((SUCCESS_BUILDS + 1))
        BUILD_RESULTS["${app_name}"]="SUCCESS"
        print_status "$GREEN" "✓ Successfully built ${app_name}"

        # Show image info
        docker images | grep "${REGISTRY}/${app_name}" | head -2
    else
        FAILED_BUILDS=$((FAILED_BUILDS + 1))
        BUILD_RESULTS["${app_name}"]="FAILED"
        print_status "$RED" "✗ Failed to build ${app_name}"
        return 1
    fi
}

# Get project root directory (parent of scripts directory)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

print_status "$YELLOW" "=========================================="
print_status "$YELLOW" "ApplyForUs Platform - Docker Image Builder"
print_status "$YELLOW" "=========================================="
print_status "$YELLOW" "Registry: ${REGISTRY}"
print_status "$YELLOW" "Version: ${VERSION}"
print_status "$YELLOW" "Build Date: ${BUILD_DATE}"
print_status "$YELLOW" "VCS Ref: ${VCS_REF}"
print_status "$YELLOW" "Project Root: ${PROJECT_ROOT}"
print_status "$YELLOW" "==========================================\n"

# Build Backend Services
print_status "$YELLOW" "\n##########################################"
print_status "$YELLOW" "# Building Backend Services"
print_status "$YELLOW" "##########################################\n"

build_image "api-gateway" \
    "${PROJECT_ROOT}/services/api-gateway/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "auth-service" \
    "${PROJECT_ROOT}/services/auth-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "user-service" \
    "${PROJECT_ROOT}/services/user-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "job-service" \
    "${PROJECT_ROOT}/services/job-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "resume-service" \
    "${PROJECT_ROOT}/services/resume-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "auto-apply-service" \
    "${PROJECT_ROOT}/services/auto-apply-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "analytics-service" \
    "${PROJECT_ROOT}/services/analytics-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "notification-service" \
    "${PROJECT_ROOT}/services/notification-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "payment-service" \
    "${PROJECT_ROOT}/services/payment-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "orchestrator-service" \
    "${PROJECT_ROOT}/services/orchestrator-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

build_image "ai-service" \
    "${PROJECT_ROOT}/services/ai-service/Dockerfile" \
    "${PROJECT_ROOT}" || true

# Build Frontend Applications
print_status "$YELLOW" "\n##########################################"
print_status "$YELLOW" "# Building Frontend Applications"
print_status "$YELLOW" "##########################################\n"

build_nextjs_app "web" \
    "${PROJECT_ROOT}/apps/web/Dockerfile" \
    "${PROJECT_ROOT}" \
    "3000" || true

build_nextjs_app "admin" \
    "${PROJECT_ROOT}/apps/admin/Dockerfile" \
    "${PROJECT_ROOT}" \
    "3001" || true

build_nextjs_app "employer" \
    "${PROJECT_ROOT}/apps/employer/Dockerfile" \
    "${PROJECT_ROOT}" \
    "3002" || true

# Print Build Summary
print_status "$YELLOW" "\n=========================================="
print_status "$YELLOW" "Build Summary"
print_status "$YELLOW" "=========================================="
print_status "$YELLOW" "Total Builds: ${TOTAL_BUILDS}"
print_status "$GREEN" "Successful: ${SUCCESS_BUILDS}"
print_status "$RED" "Failed: ${FAILED_BUILDS}"
print_status "$YELLOW" "==========================================\n"

# Print detailed results
print_status "$YELLOW" "Detailed Results:"
for service in "${!BUILD_RESULTS[@]}"; do
    status="${BUILD_RESULTS[$service]}"
    if [ "$status" = "SUCCESS" ]; then
        print_status "$GREEN" "  ✓ ${service}: ${status}"
    else
        print_status "$RED" "  ✗ ${service}: ${status}"
    fi
done

print_status "$YELLOW" "\n=========================================="
print_status "$YELLOW" "All Built Images:"
print_status "$YELLOW" "==========================================\n"
docker images | grep "${REGISTRY}" | sort

if [ $FAILED_BUILDS -eq 0 ]; then
    print_status "$GREEN" "\n=========================================="
    print_status "$GREEN" "All builds completed successfully!"
    print_status "$GREEN" "=========================================="
    print_status "$YELLOW" "\nTo push images to ACR, run:"
    print_status "$BLUE" "  az acr login --name applyforusacr"
    print_status "$BLUE" "  docker push ${REGISTRY}/api-gateway:${VERSION}"
    print_status "$BLUE" "  docker push ${REGISTRY}/api-gateway:latest"
    print_status "$BLUE" "  # ... repeat for other images\n"
    exit 0
else
    print_status "$RED" "\n=========================================="
    print_status "$RED" "Some builds failed! Check the output above."
    print_status "$RED" "=========================================="
    exit 1
fi
