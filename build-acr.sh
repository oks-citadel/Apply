#!/bin/bash
# Build script for Azure Container Registry
# This script builds all service images and pushes them to ACR

set -e

# Configuration
REGISTRY="applyforusacr"
VERSION="v3.0.0"
PROJECT_ROOT="/c/Users/kogun/OneDrive/Documents/Job-Apply-Platform"

# Temporarily move problematic directories
echo "Preparing build context..."
cd "$PROJECT_ROOT"

# Create temporary backup of apps with node_modules issues
if [ -d "apps/mobile/node_modules" ]; then
  echo "Removing apps/mobile/node_modules to avoid path length issues..."
  rm -rf apps/mobile/node_modules
fi

if [ -d "apps/admin/node_modules" ]; then
  echo "Removing apps/admin/node_modules..."
  rm -rf apps/admin/node_modules
fi

if [ -d "apps/employer/node_modules" ]; then
  echo "Removing apps/employer/node_modules..."
  rm -rf apps/employer/node_modules
fi

if [ -d "apps/extension/node_modules" ]; then
  echo "Removing apps/extension/node_modules..."
  rm -rf apps/extension/node_modules
fi

# Services to build
declare -a services=(
  "web:apps/web/Dockerfile"
  "auth-service:services/auth-service/Dockerfile"
  "user-service:services/user-service/Dockerfile"
  "job-service:services/job-service/Dockerfile"
  "analytics-service:services/analytics-service/Dockerfile"
  "api-gateway:services/api-gateway/Dockerfile"
)

# Build each service
for service_config in "${services[@]}"; do
  IFS=':' read -r service_name dockerfile_path <<< "$service_config"

  echo "============================================"
  echo "Building $service_name..."
  echo "============================================"

  az acr build \
    --registry "$REGISTRY" \
    --image "applyai-${service_name}:${VERSION}" \
    --image "applyai-${service_name}:latest" \
    --file "$dockerfile_path" \
    .

  if [ $? -eq 0 ]; then
    echo "Successfully built $service_name"
  else
    echo "Failed to build $service_name"
  fi
done

echo "============================================"
echo "Build process complete!"
echo "============================================"

# List images in ACR
echo "Images in registry:"
az acr repository list --name "$REGISTRY" --output table
