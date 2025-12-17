#!/bin/bash

###############################################################################
# Deployment Rollback Script for ApplyForUs Platform
# Safely rolls back deployments with verification
###############################################################################

set -e

NAMESPACE="${NAMESPACE:-applyforus}"
SERVICE="${1}"
REVISION="${2}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Helper Functions
###############################################################################

print_header() {
  echo ""
  echo "======================================================================="
  echo "$1"
  echo "======================================================================="
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

usage() {
  cat <<EOF
Usage: $0 <service-name> [revision]

Safely rollback a deployment in the ApplyForUs platform.

Arguments:
  service-name    Name of the service to rollback (required)
  revision        Specific revision to rollback to (optional)
                  If not provided, rolls back to previous revision

Examples:
  # Rollback to previous revision
  $0 auth-service

  # Rollback to specific revision
  $0 auth-service 3

Available services:
  - auth-service
  - user-service
  - job-service
  - ai-service
  - resume-service
  - analytics-service
  - notification-service
  - auto-apply-service
  - orchestrator-service
  - web-app

EOF
  exit 1
}

###############################################################################
# Validation Functions
###############################################################################

validate_service() {
  local service=$1

  if ! kubectl get deployment "$service" -n "$NAMESPACE" &>/dev/null; then
    print_error "Deployment $service not found in namespace $NAMESPACE"
    exit 1
  fi

  print_success "Service $service found"
}

show_rollout_history() {
  local service=$1

  print_header "Rollout History for $service"

  kubectl rollout history deployment/"$service" -n "$NAMESPACE"

  echo ""
}

get_current_revision() {
  local service=$1

  local revision=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')

  echo "$revision"
}

confirm_rollback() {
  local service=$1
  local current_revision=$2
  local target_revision=$3

  print_warning "You are about to rollback $service"
  echo "  Current revision: $current_revision"

  if [ -n "$target_revision" ]; then
    echo "  Target revision: $target_revision"
  else
    echo "  Target: Previous revision"
  fi

  echo ""
  read -p "Continue with rollback? (yes/no): " confirm

  if [ "$confirm" != "yes" ]; then
    print_info "Rollback cancelled"
    exit 0
  fi
}

###############################################################################
# Rollback Functions
###############################################################################

perform_rollback() {
  local service=$1
  local revision=$2

  print_header "Performing Rollback"

  if [ -n "$revision" ]; then
    print_info "Rolling back $service to revision $revision..."
    kubectl rollout undo deployment/"$service" --to-revision="$revision" -n "$NAMESPACE"
  else
    print_info "Rolling back $service to previous revision..."
    kubectl rollout undo deployment/"$service" -n "$NAMESPACE"
  fi

  print_success "Rollback initiated"
}

wait_for_rollback() {
  local service=$1

  print_header "Waiting for Rollback to Complete"

  print_info "Monitoring rollout status..."

  if kubectl rollout status deployment/"$service" -n "$NAMESPACE" --timeout=600s; then
    print_success "Rollback completed successfully"
  else
    print_error "Rollback failed or timed out"
    exit 1
  fi
}

verify_rollback() {
  local service=$1

  print_header "Verifying Rollback"

  # Check deployment status
  local desired=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
  local ready=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
  local available=$(kubectl get deployment "$service" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')

  echo "Deployment status:"
  echo "  Desired: $desired"
  echo "  Ready: ${ready:-0}"
  echo "  Available: ${available:-0}"

  if [ "${ready:-0}" -eq "$desired" ] && [ "${available:-0}" -eq "$desired" ]; then
    print_success "All replicas are ready"
  else
    print_error "Not all replicas are ready"
    return 1
  fi

  # Check pod status
  echo ""
  echo "Pod status:"
  kubectl get pods -n "$NAMESPACE" -l app="$service"

  local running=$(kubectl get pods -n "$NAMESPACE" -l app="$service" --field-selector=status.phase=Running --no-headers | wc -l)
  local total=$(kubectl get pods -n "$NAMESPACE" -l app="$service" --no-headers | wc -l)

  echo ""
  echo "Running pods: $running/$total"

  if [ "$running" -eq "$total" ]; then
    print_success "All pods are running"
  else
    print_error "Some pods are not running"
    return 1
  fi

  # Check for recent errors in logs
  echo ""
  print_info "Checking recent logs for errors..."

  local error_count=$(kubectl logs -n "$NAMESPACE" -l app="$service" --tail=50 --since=2m | grep -i "error\|exception\|fatal" | wc -l)

  if [ "$error_count" -gt 0 ]; then
    print_warning "Found $error_count error lines in recent logs"
    echo "Review logs with: kubectl logs -n $NAMESPACE -l app=$service --tail=100"
  else
    print_success "No errors found in recent logs"
  fi
}

check_service_health() {
  local service=$1

  print_header "Checking Service Health"

  # Get pod name
  local pod=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}')

  if [ -z "$pod" ]; then
    print_error "No pods found for $service"
    return 1
  fi

  # Determine health check path and port
  local port=""
  local path="/api/v1/health/ready"

  case $service in
    auth-service) port="4000" ;;
    user-service) port="4004" ;;
    job-service) port="4002" ;;
    ai-service) port="5000" ;;
    resume-service) port="4001" ;;
    analytics-service) port="3007" ;;
    notification-service) port="4005" ;;
    auto-apply-service) port="4003" ;;
    orchestrator-service) port="3009" ;;
    web-app) port="3000"; path="/" ;;
  esac

  if [ -n "$port" ]; then
    print_info "Testing health endpoint: http://localhost:$port$path"

    local response=$(kubectl exec -n "$NAMESPACE" "$pod" -- curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" 2>/dev/null || echo "000")

    if [ "$response" == "200" ]; then
      print_success "Health check passed (HTTP $response)"
    else
      print_error "Health check failed (HTTP $response)"
      return 1
    fi
  else
    print_warning "Health check skipped (port not configured)"
  fi
}

show_recent_events() {
  local service=$1

  print_header "Recent Events"

  kubectl get events -n "$NAMESPACE" \
    --sort-by='.lastTimestamp' \
    --field-selector involvedObject.name="$service" \
    | tail -10
}

###############################################################################
# Main Execution
###############################################################################

main() {
  print_header "ApplyForUs Deployment Rollback Tool"

  # Validate arguments
  if [ -z "$SERVICE" ]; then
    print_error "Service name is required"
    usage
  fi

  echo "Namespace: $NAMESPACE"
  echo "Service: $SERVICE"

  if [ -n "$REVISION" ]; then
    echo "Target Revision: $REVISION"
  fi

  echo ""

  # Validate service exists
  validate_service "$SERVICE"

  # Show rollout history
  show_rollout_history "$SERVICE"

  # Get current revision
  local current_revision=$(get_current_revision "$SERVICE")
  print_info "Current revision: $current_revision"

  # Confirm rollback
  confirm_rollback "$SERVICE" "$current_revision" "$REVISION"

  # Perform rollback
  perform_rollback "$SERVICE" "$REVISION"

  # Wait for completion
  wait_for_rollback "$SERVICE"

  # Verify rollback
  if verify_rollback "$SERVICE"; then
    print_success "Rollback verification passed"
  else
    print_error "Rollback verification failed"
    print_warning "Manual investigation required"
    exit 1
  fi

  # Check service health
  if check_service_health "$SERVICE"; then
    print_success "Service health check passed"
  else
    print_error "Service health check failed"
    print_warning "Service may not be fully functional"
  fi

  # Show recent events
  show_recent_events "$SERVICE"

  # Final summary
  print_header "Rollback Complete"

  local new_revision=$(get_current_revision "$SERVICE")

  echo "Service: $SERVICE"
  echo "Previous revision: $current_revision"
  echo "Current revision: $new_revision"

  print_success "Rollback completed successfully!"

  echo ""
  echo "Next steps:"
  echo "  1. Monitor service metrics and logs"
  echo "  2. Verify user-facing functionality"
  echo "  3. Review logs: kubectl logs -n $NAMESPACE -l app=$SERVICE --tail=100"
  echo "  4. Check events: kubectl get events -n $NAMESPACE | grep $SERVICE"
}

# Run main function
main
