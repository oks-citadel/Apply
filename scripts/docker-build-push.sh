#!/bin/bash
# ============================================================================
# Docker Build and Push Script
# ============================================================================
# This script builds all services and pushes to Docker Hub
# Usage: ./scripts/docker-build-push.sh [--push]
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOCKER_REGISTRY="citadelplatforms"
IMAGE_NAME="applyai"
VERSION="${VERSION:-latest}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   ApplyAI - Docker Build & Push${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if --push flag is provided
PUSH_IMAGES=false
if [ "$1" == "--push" ]; then
    PUSH_IMAGES=true
    echo -e "${YELLOW}Push mode enabled - images will be pushed to Docker Hub${NC}"
fi

# Services to build
SERVICES=(
    "web:apps/web/Dockerfile:."
    "auth-service:services/auth-service/Dockerfile:."
    "ai-service:services/ai-service/Dockerfile:services/ai-service"
    "resume-service:services/resume-service/Dockerfile:."
    "job-service:services/job-service/Dockerfile:."
    "auto-apply-service:services/auto-apply-service/Dockerfile:."
    "user-service:services/user-service/Dockerfile:."
    "notification-service:services/notification-service/Dockerfile:."
)

# Build each service
for SERVICE_CONFIG in "${SERVICES[@]}"; do
    IFS=':' read -r SERVICE DOCKERFILE CONTEXT <<< "$SERVICE_CONFIG"

    IMAGE_TAG="${DOCKER_REGISTRY}/${IMAGE_NAME}:${SERVICE}-${VERSION}"

    echo -e "${YELLOW}Building ${SERVICE}...${NC}"
    echo "  Dockerfile: ${DOCKERFILE}"
    echo "  Context: ${CONTEXT}"
    echo "  Image: ${IMAGE_TAG}"

    if docker build -t "${IMAGE_TAG}" -f "${DOCKERFILE}" "${CONTEXT}"; then
        echo -e "${GREEN}✓ ${SERVICE} built successfully${NC}"

        # Also tag as latest
        docker tag "${IMAGE_TAG}" "${DOCKER_REGISTRY}/${IMAGE_NAME}:${SERVICE}-latest"

        if [ "$PUSH_IMAGES" = true ]; then
            echo -e "${YELLOW}Pushing ${SERVICE}...${NC}"
            docker push "${IMAGE_TAG}"
            docker push "${DOCKER_REGISTRY}/${IMAGE_NAME}:${SERVICE}-latest"
            echo -e "${GREEN}✓ ${SERVICE} pushed successfully${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to build ${SERVICE}${NC}"
        exit 1
    fi

    echo ""
done

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   All services built successfully!${NC}"
echo -e "${GREEN}============================================${NC}"

if [ "$PUSH_IMAGES" = true ]; then
    echo -e "${GREEN}All images pushed to Docker Hub${NC}"
else
    echo ""
    echo -e "${YELLOW}To push images to Docker Hub, run:${NC}"
    echo "  ./scripts/docker-build-push.sh --push"
fi

echo ""
echo -e "${BLUE}Built Images:${NC}"
for SERVICE_CONFIG in "${SERVICES[@]}"; do
    IFS=':' read -r SERVICE _ _ <<< "$SERVICE_CONFIG"
    echo "  - ${DOCKER_REGISTRY}/${IMAGE_NAME}:${SERVICE}-${VERSION}"
done
