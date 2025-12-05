#!/bin/bash

# JobPilot Kubernetes Rollback Script
# This script rolls back deployments to previous versions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

NAMESPACE="jobpilot"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

list_deployments() {
    log_info "Available deployments in namespace $NAMESPACE:"
    kubectl get deployments -n "$NAMESPACE" -o custom-columns=NAME:.metadata.name,REPLICAS:.status.replicas,AVAILABLE:.status.availableReplicas,AGE:.metadata.creationTimestamp
}

show_rollout_history() {
    local deployment=$1
    log_info "Rollout history for $deployment:"
    kubectl rollout history deployment/"$deployment" -n "$NAMESPACE"
}

rollback_deployment() {
    local deployment=$1
    local revision=$2

    if [ -z "$revision" ]; then
        log_info "Rolling back $deployment to previous version..."
        kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE"
    else
        log_info "Rolling back $deployment to revision $revision..."
        kubectl rollout undo deployment/"$deployment" -n "$NAMESPACE" --to-revision="$revision"
    fi

    log_info "Waiting for rollout to complete..."
    kubectl rollout status deployment/"$deployment" -n "$NAMESPACE"

    log_info "Rollback completed for $deployment"
}

rollback_all() {
    log_warn "This will rollback ALL deployments to their previous versions."
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi

    deployments=(
        "auth-service"
        "user-service"
        "job-service"
        "ai-service"
        "resume-service"
        "analytics-service"
        "notification-service"
        "auto-apply-service"
        "web-app"
    )

    for deployment in "${deployments[@]}"; do
        log_info "Rolling back $deployment..."
        rollback_deployment "$deployment"
    done

    log_info "All deployments rolled back successfully!"
}

show_deployment_status() {
    local deployment=$1
    log_info "Status for $deployment:"
    kubectl describe deployment/"$deployment" -n "$NAMESPACE"
}

main() {
    case "${1:-}" in
        list)
            list_deployments
            ;;
        history)
            if [ -z "$2" ]; then
                log_error "Please specify a deployment name."
                log_info "Usage: $0 history <deployment-name>"
                exit 1
            fi
            show_rollout_history "$2"
            ;;
        rollback)
            if [ -z "$2" ]; then
                log_error "Please specify a deployment name."
                log_info "Usage: $0 rollback <deployment-name> [revision]"
                exit 1
            fi
            rollback_deployment "$2" "$3"
            ;;
        rollback-all)
            rollback_all
            ;;
        status)
            if [ -z "$2" ]; then
                log_error "Please specify a deployment name."
                log_info "Usage: $0 status <deployment-name>"
                exit 1
            fi
            show_deployment_status "$2"
            ;;
        *)
            echo "JobPilot Kubernetes Rollback Tool"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  list                          List all deployments"
            echo "  history <deployment>          Show rollout history for a deployment"
            echo "  rollback <deployment> [rev]   Rollback a deployment (to specific revision if provided)"
            echo "  rollback-all                  Rollback all deployments to previous version"
            echo "  status <deployment>           Show deployment status"
            echo ""
            echo "Examples:"
            echo "  $0 list"
            echo "  $0 history auth-service"
            echo "  $0 rollback auth-service"
            echo "  $0 rollback auth-service 3"
            echo "  $0 rollback-all"
            echo "  $0 status auth-service"
            exit 1
            ;;
    esac
}

main "$@"
