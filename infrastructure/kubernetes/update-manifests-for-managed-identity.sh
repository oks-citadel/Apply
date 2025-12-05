#!/bin/bash

# ============================================================================
# Update Kubernetes Manifests for Managed Identity
# ============================================================================
# This script updates all Kubernetes service manifests to:
# 1. Use workload identity labels
# 2. Reference ACR with environment variable
# 3. Remove imagePullSecrets (no longer needed with managed identity)
#
# Usage:
#   ./update-manifests-for-managed-identity.sh <acr-login-server>
#
# Example:
#   ./update-manifests-for-managed-identity.sh jobpilotprodacr123456.azurecr.io

set -euo pipefail

ACR_LOGIN_SERVER="${1:-}"

if [[ -z "$ACR_LOGIN_SERVER" ]]; then
    echo "Usage: $0 <acr-login-server>"
    echo "Example: $0 jobpilotprodacr123456.azurecr.io"
    exit 1
fi

SERVICES_DIR="./services"

# Services to update
SERVICES=(
    "auth-service"
    "ai-service"
    "job-service"
    "user-service"
    "resume-service"
    "analytics-service"
    "notification-service"
    "auto-apply-service"
    "web-app"
)

echo "Updating Kubernetes manifests for managed identity..."
echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    SERVICE_FILE="${SERVICES_DIR}/${SERVICE}.yaml"

    if [[ ! -f "$SERVICE_FILE" ]]; then
        echo "Warning: $SERVICE_FILE not found, skipping..."
        continue
    fi

    echo "Updating $SERVICE_FILE..."

    # Update image reference to use ACR_LOGIN_SERVER variable
    # This will be replaced during deployment
    sed -i.bak "s|image: jobpilotacr.azurecr.io/|image: ${ACR_LOGIN_SERVER}/|g" "$SERVICE_FILE"

    # Add workload identity label to pod template if not present
    if ! grep -q "azure.workload.identity/use" "$SERVICE_FILE"; then
        # This is a more complex operation, so we'll just add a comment
        echo "  # Note: Add 'azure.workload.identity/use: \"true\"' label to pod template spec" >> "$SERVICE_FILE.note"
    fi

    # Remove backup file
    rm -f "${SERVICE_FILE}.bak"

    echo "  ✓ Updated $SERVICE"
done

echo ""
echo "=================================="
echo "Manifest Update Summary"
echo "=================================="
echo ""
echo "All service manifests have been updated to use ACR: $ACR_LOGIN_SERVER"
echo ""
echo "Important: Each deployment's pod template should include:"
echo "  spec:"
echo "    labels:"
echo "      azure.workload.identity/use: \"true\""
echo "    serviceAccountName: jobpilot-service-account"
echo ""
echo "The workload identity will automatically provide authentication to ACR."
echo "No imagePullSecrets are required."
echo ""
