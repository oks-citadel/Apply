#!/bin/bash

# ============================================================================
# Azure Deployment Script for JobPilot Platform
# ============================================================================
# This script handles the complete deployment process including:
# - Building Docker images
# - Pushing to Azure Container Registry
# - Running database migrations
# - Deploying to Azure App Services
# - Running health checks

set -e  # Exit on error
set -u  # Exit on undefined variable

# ============================================================================
# Configuration
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_banner() {
    echo "============================================================================"
    echo "  JobPilot Platform - Azure Deployment Script"
    echo "============================================================================"
    echo ""
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    log_success "All prerequisites met!"
}

load_environment() {
    local ENV=$1
    log_info "Loading environment: $ENV"

    if [ ! -f "$PROJECT_ROOT/.env.$ENV" ]; then
        log_error "Environment file .env.$ENV not found!"
        exit 1
    fi

    # Load environment variables
    set -a
    source "$PROJECT_ROOT/.env.$ENV"
    set +a

    log_success "Environment loaded: $ENV"
}

build_docker_images() {
    log_info "Building Docker images..."

    cd "$PROJECT_ROOT"

    # Build Web App
    log_info "Building Web App image..."
    docker build \
        -f docker/Dockerfile.node \
        -t "$ACR_LOGIN_SERVER/web-app:$IMAGE_TAG" \
        -t "$ACR_LOGIN_SERVER/web-app:latest" \
        --build-arg SERVICE=apps/web \
        --build-arg NODE_ENV=production \
        .

    # Build Auth Service
    log_info "Building Auth Service image..."
    docker build \
        -f docker/Dockerfile.node \
        -t "$ACR_LOGIN_SERVER/auth-service:$IMAGE_TAG" \
        -t "$ACR_LOGIN_SERVER/auth-service:latest" \
        --build-arg SERVICE=services/auth-service \
        --build-arg NODE_ENV=production \
        .

    # Build AI Service
    log_info "Building AI Service image..."
    docker build \
        -f docker/Dockerfile.python \
        -t "$ACR_LOGIN_SERVER/ai-service:$IMAGE_TAG" \
        -t "$ACR_LOGIN_SERVER/ai-service:latest" \
        .

    log_success "All Docker images built successfully!"
}

push_to_acr() {
    log_info "Pushing images to Azure Container Registry..."

    # Login to ACR
    log_info "Logging in to ACR: $ACR_LOGIN_SERVER"
    az acr login --name "$ACR_NAME"

    # Push images
    log_info "Pushing web-app..."
    docker push "$ACR_LOGIN_SERVER/web-app:$IMAGE_TAG"
    docker push "$ACR_LOGIN_SERVER/web-app:latest"

    log_info "Pushing auth-service..."
    docker push "$ACR_LOGIN_SERVER/auth-service:$IMAGE_TAG"
    docker push "$ACR_LOGIN_SERVER/auth-service:latest"

    log_info "Pushing ai-service..."
    docker push "$ACR_LOGIN_SERVER/ai-service:$IMAGE_TAG"
    docker push "$ACR_LOGIN_SERVER/ai-service:latest"

    log_success "All images pushed to ACR successfully!"
}

run_database_migrations() {
    log_info "Running database migrations..."

    # This assumes you have a migration script
    # Adjust based on your actual migration setup (Prisma, TypeORM, etc.)

    if [ -f "$SCRIPT_DIR/migrate-database.sh" ]; then
        bash "$SCRIPT_DIR/migrate-database.sh" "$ENVIRONMENT" "$DATABASE_URL"
    else
        log_warning "Migration script not found. Skipping migrations."
    fi

    log_success "Database migrations completed!"
}

deploy_to_azure() {
    log_info "Deploying to Azure App Services..."

    local RESOURCE_GROUP=$1
    local WEB_APP_NAME=$2
    local AUTH_SERVICE_NAME=$3
    local AI_SERVICE_NAME=$4

    # Deploy Web App
    log_info "Deploying Web App: $WEB_APP_NAME"
    az webapp config container set \
        --name "$WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$ACR_LOGIN_SERVER/web-app:$IMAGE_TAG" \
        --docker-registry-server-url "https://$ACR_LOGIN_SERVER"

    az webapp restart \
        --name "$WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP"

    # Deploy Auth Service
    log_info "Deploying Auth Service: $AUTH_SERVICE_NAME"
    az webapp config container set \
        --name "$AUTH_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$ACR_LOGIN_SERVER/auth-service:$IMAGE_TAG" \
        --docker-registry-server-url "https://$ACR_LOGIN_SERVER"

    az webapp restart \
        --name "$AUTH_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP"

    # Deploy AI Service
    log_info "Deploying AI Service: $AI_SERVICE_NAME"
    az webapp config container set \
        --name "$AI_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --docker-custom-image-name "$ACR_LOGIN_SERVER/ai-service:$IMAGE_TAG" \
        --docker-registry-server-url "https://$ACR_LOGIN_SERVER"

    az webapp restart \
        --name "$AI_SERVICE_NAME" \
        --resource-group "$RESOURCE_GROUP"

    log_success "All services deployed to Azure!"
}

wait_for_deployment() {
    log_info "Waiting for services to start..."

    local TIMEOUT=300  # 5 minutes
    local INTERVAL=10
    local ELAPSED=0

    while [ $ELAPSED -lt $TIMEOUT ]; do
        log_info "Checking service health... ($ELAPSED/$TIMEOUT seconds)"

        # Check if all services are running
        local all_running=true

        for app in "$WEB_APP_NAME" "$AUTH_SERVICE_NAME" "$AI_SERVICE_NAME"; do
            local state=$(az webapp show \
                --name "$app" \
                --resource-group "$RESOURCE_GROUP" \
                --query state -o tsv)

            if [ "$state" != "Running" ]; then
                all_running=false
                log_warning "Service $app is not running yet (state: $state)"
            fi
        done

        if [ "$all_running" = true ]; then
            log_success "All services are running!"
            return 0
        fi

        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
    done

    log_error "Timeout waiting for services to start!"
    return 1
}

run_health_checks() {
    log_info "Running health checks..."

    local HEALTH_ENDPOINTS=(
        "https://$WEB_APP_NAME.azurewebsites.net/api/health"
        "https://$AUTH_SERVICE_NAME.azurewebsites.net/health"
        "https://$AI_SERVICE_NAME.azurewebsites.net/health"
    )

    local all_healthy=true

    for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
        log_info "Checking: $endpoint"

        local response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint" || echo "000")

        if [ "$response" = "200" ]; then
            log_success "Health check passed: $endpoint"
        else
            log_error "Health check failed: $endpoint (HTTP $response)"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        log_success "All health checks passed!"
        return 0
    else
        log_error "Some health checks failed!"
        return 1
    fi
}

display_deployment_info() {
    echo ""
    echo "============================================================================"
    echo "  Deployment Information"
    echo "============================================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Image Tag: $IMAGE_TAG"
    echo "Resource Group: $RESOURCE_GROUP"
    echo ""
    echo "Application URLs:"
    echo "  Web App: https://$WEB_APP_NAME.azurewebsites.net"
    echo "  Auth Service: https://$AUTH_SERVICE_NAME.azurewebsites.net"
    echo "  AI Service: https://$AI_SERVICE_NAME.azurewebsites.net"
    echo "============================================================================"
    echo ""
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    print_banner

    # Parse arguments
    if [ $# -lt 1 ]; then
        echo "Usage: $0 <environment> [image-tag]"
        echo "  environment: dev, staging, or prod"
        echo "  image-tag: Docker image tag (default: current timestamp)"
        exit 1
    fi

    ENVIRONMENT=$1
    IMAGE_TAG=${2:-$(date +%Y%m%d%H%M%S)}

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        echo "Valid environments: dev, staging, prod"
        exit 1
    fi

    # Check prerequisites
    check_prerequisites

    # Load environment variables
    load_environment "$ENVIRONMENT"

    # Build Docker images
    build_docker_images

    # Push to ACR
    push_to_acr

    # Run database migrations
    run_database_migrations

    # Deploy to Azure
    deploy_to_azure "$RESOURCE_GROUP" "$WEB_APP_NAME" "$AUTH_SERVICE_NAME" "$AI_SERVICE_NAME"

    # Wait for deployment to complete
    wait_for_deployment

    # Run health checks
    if run_health_checks; then
        log_success "Deployment completed successfully!"
        display_deployment_info
        exit 0
    else
        log_error "Deployment completed with errors!"
        exit 1
    fi
}

# Run main function
main "$@"
