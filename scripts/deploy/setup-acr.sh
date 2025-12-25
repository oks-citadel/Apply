#!/bin/bash

# ============================================================================
# ACR SETUP AND IMAGE BUILD SCRIPT
# ============================================================================
# Sets up Azure Container Registry and builds/pushes all service images
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Default values
ACR_NAME="${ACR_NAME:-applyforusacr}"
RESOURCE_GROUP="${RESOURCE_GROUP:-applyforus-prod-rg}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-ba233460-2dbe-4603-a594-68f93ec9deb3}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"
PARALLEL_BUILDS="${PARALLEL_BUILDS:-4}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================================================
# SERVICE DEFINITIONS
# ============================================================================

declare -A SERVICES=(
    ["web"]="apps/web"
    ["auth-service"]="services/auth-service"
    ["user-service"]="services/user-service"
    ["job-service"]="services/job-service"
    ["resume-service"]="services/resume-service"
    ["ai-service"]="services/ai-service"
    ["analytics-service"]="services/analytics-service"
    ["notification-service"]="services/notification-service"
    ["orchestrator-service"]="services/orchestrator-service"
    ["payment-service"]="services/payment-service"
    ["auto-apply-service"]="services/auto-apply-service"
)

# ============================================================================
# ACR SETUP
# ============================================================================

setup_acr() {
    log_info "Setting up Azure Container Registry..."

    # Set subscription
    az account set --subscription "$SUBSCRIPTION_ID"

    # Check if ACR exists
    if az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        log_info "ACR '$ACR_NAME' already exists"
    else
        log_info "Creating ACR '$ACR_NAME'..."
        az acr create \
            --name "$ACR_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --sku Premium \
            --admin-enabled false \
            --public-network-enabled true

        log_success "ACR created successfully!"
    fi

    # Enable vulnerability scanning
    log_info "Enabling container scanning..."
    az acr update \
        --name "$ACR_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --anonymous-pull-enabled false

    # Login to ACR
    log_info "Logging in to ACR..."
    az acr login --name "$ACR_NAME"

    # Get login server
    ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)
    export ACR_LOGIN_SERVER

    log_success "ACR setup complete: $ACR_LOGIN_SERVER"
}

# ============================================================================
# ATTACH ACR TO AKS
# ============================================================================

attach_acr_to_aks() {
    local AKS_CLUSTER="${1:-applyforus-aks}"

    log_info "Attaching ACR to AKS cluster: $AKS_CLUSTER..."

    az aks update \
        --name "$AKS_CLUSTER" \
        --resource-group "$RESOURCE_GROUP" \
        --attach-acr "$ACR_NAME" \
        2>/dev/null || log_warning "ACR already attached or AKS not found"

    log_success "ACR attached to AKS!"
}

# ============================================================================
# BUILD SINGLE IMAGE
# ============================================================================

build_image() {
    local SERVICE_NAME=$1
    local SERVICE_PATH=$2
    local ACR_LOGIN_SERVER=$3
    local TAG=$4

    local IMAGE_NAME="applyai-${SERVICE_NAME}"
    local FULL_IMAGE="$ACR_LOGIN_SERVER/$IMAGE_NAME"
    local DOCKERFILE="$PROJECT_ROOT/$SERVICE_PATH/Dockerfile"

    # Check for Dockerfile
    if [ ! -f "$DOCKERFILE" ]; then
        log_warning "No Dockerfile found for $SERVICE_NAME at $DOCKERFILE"
        return 1
    fi

    log_info "Building $SERVICE_NAME..."

    # Build with BuildKit
    DOCKER_BUILDKIT=1 docker build \
        --file "$DOCKERFILE" \
        --tag "$FULL_IMAGE:$TAG" \
        --tag "$FULL_IMAGE:latest" \
        --build-arg NODE_ENV=production \
        --build-arg BUILD_DATE="$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
        --build-arg VCS_REF="$TAG" \
        --cache-from "$FULL_IMAGE:latest" \
        --progress=plain \
        "$PROJECT_ROOT"

    log_success "Built $SERVICE_NAME"
}

# ============================================================================
# PUSH SINGLE IMAGE
# ============================================================================

push_image() {
    local SERVICE_NAME=$1
    local ACR_LOGIN_SERVER=$2
    local TAG=$3

    local IMAGE_NAME="applyai-${SERVICE_NAME}"
    local FULL_IMAGE="$ACR_LOGIN_SERVER/$IMAGE_NAME"

    log_info "Pushing $SERVICE_NAME to ACR..."

    docker push "$FULL_IMAGE:$TAG"
    docker push "$FULL_IMAGE:latest"

    log_success "Pushed $SERVICE_NAME"
}

# ============================================================================
# BUILD ALL IMAGES
# ============================================================================

build_all_images() {
    log_info "Building all service images..."

    local ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-${ACR_NAME}.azurecr.io}"
    local FAILED=0

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        SERVICE_PATH="${SERVICES[$SERVICE_NAME]}"

        if ! build_image "$SERVICE_NAME" "$SERVICE_PATH" "$ACR_LOGIN_SERVER" "$IMAGE_TAG"; then
            log_error "Failed to build $SERVICE_NAME"
            FAILED=$((FAILED + 1))
        fi
    done

    if [ $FAILED -gt 0 ]; then
        log_error "$FAILED services failed to build"
        return 1
    fi

    log_success "All images built successfully!"
}

# ============================================================================
# PUSH ALL IMAGES
# ============================================================================

push_all_images() {
    log_info "Pushing all images to ACR..."

    local ACR_LOGIN_SERVER="${ACR_LOGIN_SERVER:-${ACR_NAME}.azurecr.io}"
    local FAILED=0

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        if ! push_image "$SERVICE_NAME" "$ACR_LOGIN_SERVER" "$IMAGE_TAG"; then
            log_error "Failed to push $SERVICE_NAME"
            FAILED=$((FAILED + 1))
        fi
    done

    if [ $FAILED -gt 0 ]; then
        log_error "$FAILED services failed to push"
        return 1
    fi

    log_success "All images pushed successfully!"
}

# ============================================================================
# BUILD WITH ACR TASKS
# ============================================================================

build_with_acr_tasks() {
    log_info "Building images with ACR Tasks (cloud build)..."

    local ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query loginServer -o tsv)

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        SERVICE_PATH="${SERVICES[$SERVICE_NAME]}"
        local DOCKERFILE="$SERVICE_PATH/Dockerfile"
        local IMAGE_NAME="applyai-${SERVICE_NAME}"

        if [ -f "$PROJECT_ROOT/$DOCKERFILE" ]; then
            log_info "Building $SERVICE_NAME with ACR Tasks..."

            az acr build \
                --registry "$ACR_NAME" \
                --image "$IMAGE_NAME:$IMAGE_TAG" \
                --image "$IMAGE_NAME:latest" \
                --file "$DOCKERFILE" \
                --build-arg NODE_ENV=production \
                "$PROJECT_ROOT" &
        fi
    done

    # Wait for all builds
    wait

    log_success "ACR Tasks builds completed!"
}

# ============================================================================
# LIST IMAGES
# ============================================================================

list_images() {
    log_info "Listing images in ACR..."

    az acr repository list --name "$ACR_NAME" -o table

    echo ""
    log_info "Image tags:"

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        local IMAGE_NAME="applyai-${SERVICE_NAME}"
        echo ""
        echo "=== $IMAGE_NAME ==="
        az acr repository show-tags --name "$ACR_NAME" --repository "$IMAGE_NAME" --orderby time_desc --top 5 -o table 2>/dev/null || echo "  (no images)"
    done
}

# ============================================================================
# SCAN IMAGES
# ============================================================================

scan_images() {
    log_info "Scanning images for vulnerabilities..."

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        local IMAGE_NAME="applyai-${SERVICE_NAME}"
        log_info "Scanning $IMAGE_NAME..."

        az acr repository show \
            --name "$ACR_NAME" \
            --image "$IMAGE_NAME:$IMAGE_TAG" \
            --query 'changeableAttributes' \
            -o json 2>/dev/null || log_warning "Image not found: $IMAGE_NAME:$IMAGE_TAG"
    done

    log_success "Scan complete!"
}

# ============================================================================
# CLEANUP OLD IMAGES
# ============================================================================

cleanup_old_images() {
    local KEEP_COUNT="${1:-10}"

    log_info "Cleaning up old images (keeping last $KEEP_COUNT)..."

    for SERVICE_NAME in "${!SERVICES[@]}"; do
        local IMAGE_NAME="applyai-${SERVICE_NAME}"

        log_info "Cleaning $IMAGE_NAME..."

        # Get all tags except 'latest'
        local TAGS=$(az acr repository show-tags \
            --name "$ACR_NAME" \
            --repository "$IMAGE_NAME" \
            --orderby time_desc \
            -o tsv 2>/dev/null | grep -v "^latest$" | tail -n +$((KEEP_COUNT + 1)))

        for TAG in $TAGS; do
            log_info "Deleting $IMAGE_NAME:$TAG..."
            az acr repository delete \
                --name "$ACR_NAME" \
                --image "$IMAGE_NAME:$TAG" \
                --yes 2>/dev/null || true
        done
    done

    # Run ACR purge
    log_info "Running ACR purge..."
    az acr run \
        --registry "$ACR_NAME" \
        --cmd "acr purge --filter '.*:.*' --untagged --ago 30d" \
        /dev/null 2>/dev/null || true

    log_success "Cleanup complete!"
}

# ============================================================================
# USAGE
# ============================================================================

usage() {
    cat << EOF
Usage: $0 [OPTIONS] COMMAND

Commands:
  setup           Setup ACR (create if needed, enable features)
  attach          Attach ACR to AKS cluster
  build           Build all Docker images locally
  push            Push all images to ACR
  build-push      Build and push all images
  acr-build       Build images using ACR Tasks (cloud)
  list            List all images in ACR
  scan            Scan images for vulnerabilities
  cleanup         Clean up old images (keep last N)

Options:
  -a, --acr-name       ACR name [default: applyforusacr]
  -r, --resource-group Resource group [default: applyforus-prod-rg]
  -t, --tag            Image tag [default: git short SHA]
  -k, --keep           Number of images to keep during cleanup [default: 10]
  --aks-cluster        AKS cluster name for attach [default: applyforus-aks]
  -h, --help           Show this help

Examples:
  $0 setup                        # Setup ACR
  $0 build-push                   # Build and push all images
  $0 -t v1.0.0 build-push         # Build with specific tag
  $0 list                         # List all images
  $0 cleanup -k 5                 # Keep only last 5 images

EOF
    exit 0
}

# ============================================================================
# MAIN
# ============================================================================

COMMAND=""
AKS_CLUSTER="applyforus-aks"
KEEP_COUNT=10

while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--acr-name)
            ACR_NAME="$2"
            shift 2
            ;;
        -r|--resource-group)
            RESOURCE_GROUP="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -k|--keep)
            KEEP_COUNT="$2"
            shift 2
            ;;
        --aks-cluster)
            AKS_CLUSTER="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        setup|attach|build|push|build-push|acr-build|list|scan|cleanup)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

if [ -z "$COMMAND" ]; then
    log_error "No command specified"
    usage
fi

cd "$PROJECT_ROOT"

case $COMMAND in
    setup)
        setup_acr
        ;;
    attach)
        attach_acr_to_aks "$AKS_CLUSTER"
        ;;
    build)
        setup_acr
        build_all_images
        ;;
    push)
        setup_acr
        push_all_images
        ;;
    build-push)
        setup_acr
        build_all_images
        push_all_images
        ;;
    acr-build)
        build_with_acr_tasks
        ;;
    list)
        list_images
        ;;
    scan)
        scan_images
        ;;
    cleanup)
        cleanup_old_images "$KEEP_COUNT"
        ;;
esac

log_success "Done!"
