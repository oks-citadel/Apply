#!/bin/bash

###############################################################################
# Deployment Verification Script for ApplyForUs Platform
# Verifies health checks, pod status, and service availability
###############################################################################

set -e

NAMESPACE="${NAMESPACE:-applyforus}"
SERVICE="${1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Services to verify
SERVICES=(
  "auth-service"
  "user-service"
  "job-service"
  "ai-service"
  "resume-service"
  "analytics-service"
  "notification-service"
  "auto-apply-service"
  "orchestrator-service"
  "web-app"
)

# Health check ports
declare -A SERVICE_PORTS=(
  ["auth-service"]="8081"
  ["user-service"]="8082"
  ["job-service"]="8084"
  ["ai-service"]="8089"
  ["resume-service"]="8083"
  ["analytics-service"]="8086"
  ["notification-service"]="8087"
  ["auto-apply-service"]="8085"
  ["orchestrator-service"]="8090"
  ["web-app"]="3000"
)

# Health check paths
declare -A HEALTH_PATHS=(
  ["auth-service"]="/api/v1/health/ready"
  ["user-service"]="/api/v1/health/ready"
  ["job-service"]="/api/v1/health/ready"
  ["ai-service"]="/api/v1/health/ready"
  ["resume-service"]="/api/v1/health/ready"
  ["analytics-service"]="/api/v1/health/ready"
  ["notification-service"]="/api/v1/health/ready"
  ["auto-apply-service"]="/api/v1/health/ready"
  ["orchestrator-service"]="/api/v1/health/ready"
  ["web-app"]="/"
)

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

###############################################################################
# Verification Functions
###############################################################################

check_namespace() {
  print_header "Checking Namespace"

  if kubectl get namespace "$NAMESPACE" &>/dev/null; then
    print_success "Namespace $NAMESPACE exists"
    return 0
  else
    print_error "Namespace $NAMESPACE not found"
    return 1
  fi
}

verify_deployment() {
  local service=$1
  local deployment=$service

  echo ""
  echo "Verifying deployment: $service"
  echo "-------------------------------------------------------------------"

  # Check if deployment exists
  if ! kubectl get deployment "$deployment" -n "$NAMESPACE" &>/dev/null; then
    print_error "Deployment $deployment not found"
    return 1
  fi

  # Check deployment status
  local desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}')
  local ready=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
  local available=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.availableReplicas}')

  echo "  Desired replicas: $desired"
  echo "  Ready replicas: ${ready:-0}"
  echo "  Available replicas: ${available:-0}"

  if [ "${ready:-0}" -eq "$desired" ] && [ "${available:-0}" -eq "$desired" ]; then
    print_success "Deployment is healthy: $ready/$desired pods ready"
  else
    print_error "Deployment is unhealthy: ${ready:-0}/$desired pods ready"
    return 1
  fi
}

verify_pods() {
  local service=$1

  echo ""
  echo "Checking pods for: $service"

  # Get pod status
  local pods=$(kubectl get pods -n "$NAMESPACE" -l app="$service" --no-headers)

  if [ -z "$pods" ]; then
    print_error "No pods found for $service"
    return 1
  fi

  local total_pods=0
  local running_pods=0
  local ready_pods=0

  while IFS= read -r line; do
    total_pods=$((total_pods + 1))
    local status=$(echo "$line" | awk '{print $3}')
    local ready=$(echo "$line" | awk '{print $2}' | cut -d'/' -f1)
    local total=$(echo "$line" | awk '{print $2}' | cut -d'/' -f2)

    if [ "$status" == "Running" ]; then
      running_pods=$((running_pods + 1))
    fi

    if [ "$ready" == "$total" ]; then
      ready_pods=$((ready_pods + 1))
    fi
  done <<< "$pods"

  echo "  Total pods: $total_pods"
  echo "  Running: $running_pods"
  echo "  Ready: $ready_pods"

  if [ "$running_pods" -eq "$total_pods" ] && [ "$ready_pods" -eq "$total_pods" ]; then
    print_success "All pods are running and ready"
  else
    print_error "Some pods are not ready"
    kubectl get pods -n "$NAMESPACE" -l app="$service"
    return 1
  fi
}

verify_health_check() {
  local service=$1
  local port=${SERVICE_PORTS[$service]}
  local path=${HEALTH_PATHS[$service]}

  echo ""
  echo "Testing health check: $service"

  # Get first pod
  local pod=$(kubectl get pods -n "$NAMESPACE" -l app="$service" -o jsonpath='{.items[0].metadata.name}')

  if [ -z "$pod" ]; then
    print_error "No pods found for $service"
    return 1
  fi

  echo "  Pod: $pod"
  echo "  Endpoint: http://localhost:$port$path"

  # Execute health check inside pod
  local response=$(kubectl exec -n "$NAMESPACE" "$pod" -- curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" 2>/dev/null || echo "000")

  if [ "$response" == "200" ]; then
    print_success "Health check passed (HTTP $response)"
  else
    print_error "Health check failed (HTTP $response)"
    return 1
  fi
}

verify_service() {
  local service=$1
  local svc_name=$service

  echo ""
  echo "Verifying service: $service"

  if ! kubectl get service "$svc_name" -n "$NAMESPACE" &>/dev/null; then
    print_error "Service $svc_name not found"
    return 1
  fi

  # Check endpoints
  local endpoints=$(kubectl get endpoints "$svc_name" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' | wc -w)

  echo "  Endpoints: $endpoints"

  if [ "$endpoints" -gt 0 ]; then
    print_success "Service has $endpoints endpoint(s)"
  else
    print_error "Service has no endpoints"
    return 1
  fi
}

verify_hpa() {
  local service=$1
  local hpa_name="${service}-hpa"

  echo ""
  echo "Checking HPA: $service"

  if ! kubectl get hpa "$hpa_name" -n "$NAMESPACE" &>/dev/null; then
    print_warning "HPA $hpa_name not found (may not be deployed yet)"
    return 0
  fi

  local current=$(kubectl get hpa "$hpa_name" -n "$NAMESPACE" -o jsonpath='{.status.currentReplicas}')
  local desired=$(kubectl get hpa "$hpa_name" -n "$NAMESPACE" -o jsonpath='{.status.desiredReplicas}')

  echo "  Current replicas: ${current:-0}"
  echo "  Desired replicas: ${desired:-0}"

  print_success "HPA is configured"
}

verify_pdb() {
  local service=$1
  local pdb_name="${service}-pdb"

  echo ""
  echo "Checking PDB: $service"

  if ! kubectl get pdb "$pdb_name" -n "$NAMESPACE" &>/dev/null; then
    print_warning "PDB $pdb_name not found (may not be deployed yet)"
    return 0
  fi

  local min_available=$(kubectl get pdb "$pdb_name" -n "$NAMESPACE" -o jsonpath='{.spec.minAvailable}')
  local allowed=$(kubectl get pdb "$pdb_name" -n "$NAMESPACE" -o jsonpath='{.status.disruptionsAllowed}')

  echo "  Min available: ${min_available:-0}"
  echo "  Disruptions allowed: ${allowed:-0}"

  print_success "PDB is enforced"
}

check_recent_events() {
  local service=$1

  echo ""
  echo "Recent events for: $service"

  local events=$(kubectl get events -n "$NAMESPACE" --field-selector involvedObject.name="$service" --sort-by='.lastTimestamp' | tail -5)

  if [ -n "$events" ]; then
    echo "$events"
  else
    print_warning "No recent events found"
  fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
  print_header "ApplyForUs Deployment Verification"
  echo "Namespace: $NAMESPACE"

  if [ -n "$SERVICE" ]; then
    echo "Service: $SERVICE"
    SERVICES=("$SERVICE")
  else
    echo "Verifying all services"
  fi

  # Check namespace exists
  if ! check_namespace; then
    exit 1
  fi

  # Verify each service
  local failed_services=()

  for service in "${SERVICES[@]}"; do
    print_header "Service: $service"

    local service_failed=0

    verify_deployment "$service" || service_failed=1
    verify_pods "$service" || service_failed=1
    verify_health_check "$service" || service_failed=1
    verify_service "$service" || service_failed=1
    verify_hpa "$service" || true  # Non-critical
    verify_pdb "$service" || true  # Non-critical
    check_recent_events "$service" || true  # Informational

    if [ $service_failed -eq 1 ]; then
      failed_services+=("$service")
    fi
  done

  # Summary
  print_header "Verification Summary"

  if [ ${#failed_services[@]} -eq 0 ]; then
    print_success "All services verified successfully!"
    echo ""
    echo "Total services checked: ${#SERVICES[@]}"
    exit 0
  else
    print_error "Verification failed for the following services:"
    for failed in "${failed_services[@]}"; do
      echo "  - $failed"
    done
    echo ""
    echo "Total services: ${#SERVICES[@]}"
    echo "Failed: ${#failed_services[@]}"
    exit 1
  fi
}

# Run main function
main
