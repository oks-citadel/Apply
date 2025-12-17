#!/bin/bash
##############################################################################
# Image Digest Verification Script - ApplyForUs Platform
##############################################################################
# Purpose: Verify that all services use identical image digests across
#          dev, staging, and production environments
# Usage: ./verify-image-digests.sh
# Requirements: kubectl configured with access to all namespaces
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Namespaces
DEV_NAMESPACE="applyforus-dev"
STAGING_NAMESPACE="applyforus-staging"
PROD_NAMESPACE="applyforus"

# Services to check
SERVICES=(
  "auth-service"
  "user-service"
  "job-service"
  "resume-service"
  "notification-service"
  "auto-apply-service"
  "analytics-service"
  "orchestrator-service"
  "payment-service"
  "ai-service"
  "web-app"
)

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Image Digest Verification - ApplyForUs Platform            ║${NC}"
echo -e "${BLUE}║  Verifying: One Build = One Digest = One Release            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Summary counters
TOTAL_SERVICES=0
PASSED_SERVICES=0
FAILED_SERVICES=0
MISSING_SERVICES=0

# Function to extract digest from image reference
extract_digest() {
  local image_ref=$1
  if [[ $image_ref =~ @(sha256:[a-f0-9]{64}) ]]; then
    echo "${BASH_REMATCH[1]}"
  elif [[ $image_ref =~ :(sha-[a-f0-9]{40}) ]]; then
    # Tag-based reference (fallback for dev/staging)
    echo "tag:${BASH_REMATCH[1]}"
  else
    echo "UNKNOWN"
  fi
}

# Function to get deployment image
get_deployment_image() {
  local service=$1
  local namespace=$2

  kubectl get deployment "$service" -n "$namespace" \
    -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "NOT_FOUND"
}

# Create results array
declare -A results

echo -e "${YELLOW}Scanning deployments across environments...${NC}"
echo ""

# Check each service
for service in "${SERVICES[@]}"; do
  TOTAL_SERVICES=$((TOTAL_SERVICES + 1))

  echo -e "${BLUE}═══ $service ═══${NC}"

  # Get image references
  DEV_IMAGE=$(get_deployment_image "$service" "$DEV_NAMESPACE")
  STAGING_IMAGE=$(get_deployment_image "$service" "$STAGING_NAMESPACE")
  PROD_IMAGE=$(get_deployment_image "$service" "$PROD_NAMESPACE")

  # Extract digests
  DEV_DIGEST=$(extract_digest "$DEV_IMAGE")
  STAGING_DIGEST=$(extract_digest "$STAGING_IMAGE")
  PROD_DIGEST=$(extract_digest "$PROD_IMAGE")

  # Display results
  echo "  Dev:     $DEV_IMAGE"
  echo "           Digest: $DEV_DIGEST"
  echo "  Staging: $STAGING_IMAGE"
  echo "           Digest: $STAGING_DIGEST"
  echo "  Prod:    $PROD_IMAGE"
  echo "           Digest: $PROD_DIGEST"

  # Check consistency
  if [[ "$DEV_IMAGE" == "NOT_FOUND" ]] || [[ "$STAGING_IMAGE" == "NOT_FOUND" ]] || [[ "$PROD_IMAGE" == "NOT_FOUND" ]]; then
    echo -e "  ${YELLOW}⚠️  STATUS: MISSING - Deployment not found in one or more environments${NC}"
    MISSING_SERVICES=$((MISSING_SERVICES + 1))
  elif [[ "$DEV_DIGEST" == "$STAGING_DIGEST" ]] && [[ "$STAGING_DIGEST" == "$PROD_DIGEST" ]] && [[ "$PROD_DIGEST" != "UNKNOWN" ]]; then
    echo -e "  ${GREEN}✅ STATUS: PASS - Identical digest across all environments${NC}"
    PASSED_SERVICES=$((PASSED_SERVICES + 1))
  else
    echo -e "  ${RED}❌ STATUS: FAIL - Digest mismatch detected!${NC}"
    FAILED_SERVICES=$((FAILED_SERVICES + 1))

    # Detailed mismatch info
    if [[ "$DEV_DIGEST" != "$STAGING_DIGEST" ]]; then
      echo -e "     ${RED}├─ Dev ≠ Staging${NC}"
    fi
    if [[ "$STAGING_DIGEST" != "$PROD_DIGEST" ]]; then
      echo -e "     ${RED}├─ Staging ≠ Prod${NC}"
    fi
    if [[ "$DEV_DIGEST" != "$PROD_DIGEST" ]]; then
      echo -e "     ${RED}└─ Dev ≠ Prod${NC}"
    fi
  fi

  echo ""
done

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Verification Summary                                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Total Services Checked: $TOTAL_SERVICES"
echo -e "  ${GREEN}✅ Passed: $PASSED_SERVICES${NC}"
echo -e "  ${RED}❌ Failed: $FAILED_SERVICES${NC}"
echo -e "  ${YELLOW}⚠️  Missing: $MISSING_SERVICES${NC}"
echo ""

# Calculate success rate
if [ $TOTAL_SERVICES -gt 0 ]; then
  SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_SERVICES / $TOTAL_SERVICES) * 100}")
  echo "  Success Rate: ${SUCCESS_RATE}%"
  echo ""
fi

# Final verdict
if [ $FAILED_SERVICES -eq 0 ] && [ $MISSING_SERVICES -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ VERIFICATION PASSED                                      ║${NC}"
  echo -e "${GREEN}║  All services use identical digests across environments      ║${NC}"
  echo -e "${GREEN}║  One Build = One Digest = One Release ✓                     ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
  exit 0
elif [ $FAILED_SERVICES -gt 0 ]; then
  echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ VERIFICATION FAILED                                      ║${NC}"
  echo -e "${RED}║  Image digest mismatches detected!                           ║${NC}"
  echo -e "${RED}║  Action Required: Investigate and fix deployment drift       ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Recommended Actions:${NC}"
  echo "  1. Check CI/CD logs for the correct image digest"
  echo "  2. Verify no manual deployments bypassed CI/CD"
  echo "  3. Re-deploy affected services using digest-based references"
  echo "  4. Run: kubectl set image deployment/<service> <container>=<image>@sha256:xxx"
  exit 1
else
  echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${YELLOW}║  ⚠️  VERIFICATION INCOMPLETE                                 ║${NC}"
  echo -e "${YELLOW}║  Some services are missing in one or more environments       ║${NC}"
  echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${YELLOW}Recommended Actions:${NC}"
  echo "  1. Deploy missing services to all environments"
  echo "  2. Verify namespace names are correct"
  echo "  3. Check kubectl context and permissions"
  exit 1
fi
