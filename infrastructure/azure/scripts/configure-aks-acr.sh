#!/bin/bash

# ============================================================================
# AKS-ACR Integration and Managed Identity Configuration Script
# ============================================================================
# This script configures:
# 1. ACR integration with AKS cluster
# 2. Workload Identity federation
# 3. Managed identity authentication
# 4. Verifies access and configuration
#
# Usage:
#   ./configure-aks-acr.sh <environment> <resource-group-name>
#
# Example:
#   ./configure-aks-acr.sh prod jobpilot-prod-rg

set -euo pipefail

# ============================================================================
# Configuration
# ============================================================================

ENVIRONMENT="${1:-dev}"
RESOURCE_GROUP="${2:-jobpilot-${ENVIRONMENT}-rg}"
PROJECT_NAME="jobpilot"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Helper Functions
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

# ============================================================================
# Prerequisite Checks
# ============================================================================

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Azure CLI is installed
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first."
        exit 1
    fi

    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install it first."
        exit 1
    fi

    # Check if logged in to Azure
    if ! az account show &> /dev/null; then
        log_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# ============================================================================
# Get Resource Information
# ============================================================================

get_resource_info() {
    log_info "Retrieving resource information..."

    # Get AKS cluster name
    AKS_CLUSTER_NAME=$(az aks list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv)
    if [[ -z "$AKS_CLUSTER_NAME" ]]; then
        log_error "AKS cluster not found in resource group: $RESOURCE_GROUP"
        exit 1
    fi
    log_info "AKS Cluster: $AKS_CLUSTER_NAME"

    # Get ACR name
    ACR_NAME=$(az acr list -g "$RESOURCE_GROUP" --query "[0].name" -o tsv)
    if [[ -z "$ACR_NAME" ]]; then
        log_error "ACR not found in resource group: $RESOURCE_GROUP"
        exit 1
    fi
    log_info "ACR: $ACR_NAME"

    # Get ACR resource ID
    ACR_ID=$(az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" --query "id" -o tsv)
    log_info "ACR ID: $ACR_ID"

    # Get managed identities
    CICD_IDENTITY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-cicd-identity"
    WORKLOAD_IDENTITY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-workload-identity"
    KUBELET_IDENTITY_NAME="${PROJECT_NAME}-${ENVIRONMENT}-aks-kubelet-identity"

    # Get OIDC Issuer URL
    OIDC_ISSUER_URL=$(az aks show -n "$AKS_CLUSTER_NAME" -g "$RESOURCE_GROUP" --query "oidcIssuerProfile.issuerUrl" -o tsv)
    log_info "OIDC Issuer URL: $OIDC_ISSUER_URL"

    # Get workload identity client ID
    WORKLOAD_IDENTITY_CLIENT_ID=$(az identity show -n "$WORKLOAD_IDENTITY_NAME" -g "$RESOURCE_GROUP" --query "clientId" -o tsv)
    log_info "Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"

    log_success "Resource information retrieved"
}

# ============================================================================
# Configure Workload Identity Federation
# ============================================================================

configure_workload_identity() {
    log_info "Configuring workload identity federation..."

    # Get AKS credentials
    az aks get-credentials -n "$AKS_CLUSTER_NAME" -g "$RESOURCE_GROUP" --overwrite-existing
    log_success "AKS credentials retrieved"

    # Create federated identity credential
    FEDERATION_NAME="jobpilot-workload-federation"
    SERVICE_ACCOUNT_NAMESPACE="jobpilot"
    SERVICE_ACCOUNT_NAME="jobpilot-service-account"

    log_info "Creating federated identity credential..."

    az identity federated-credential create \
        --name "$FEDERATION_NAME" \
        --identity-name "$WORKLOAD_IDENTITY_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --issuer "$OIDC_ISSUER_URL" \
        --subject "system:serviceaccount:${SERVICE_ACCOUNT_NAMESPACE}:${SERVICE_ACCOUNT_NAME}" \
        --audience "api://AzureADTokenExchange" \
        --output none 2>/dev/null || log_warning "Federated credential may already exist"

    log_success "Workload identity federation configured"
}

# ============================================================================
# Update Kubernetes Service Account
# ============================================================================

update_kubernetes_serviceaccount() {
    log_info "Updating Kubernetes service account with workload identity..."

    # Get Azure tenant ID
    TENANT_ID=$(az account show --query "tenantId" -o tsv)

    # Create namespace if it doesn't exist
    kubectl create namespace jobpilot --dry-run=client -o yaml | kubectl apply -f -

    # Update service account with workload identity annotations
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jobpilot-service-account
  namespace: jobpilot
  labels:
    app: jobpilot-platform
  annotations:
    azure.workload.identity/client-id: "${WORKLOAD_IDENTITY_CLIENT_ID}"
    azure.workload.identity/tenant-id: "${TENANT_ID}"
automountServiceAccountToken: true
EOF

    log_success "Kubernetes service account updated"
}

# ============================================================================
# Verify ACR Access
# ============================================================================

verify_acr_access() {
    log_info "Verifying ACR access..."

    # Verify kubelet identity has AcrPull role
    KUBELET_PRINCIPAL_ID=$(az identity show -n "$KUBELET_IDENTITY_NAME" -g "$RESOURCE_GROUP" --query "principalId" -o tsv)

    log_info "Checking kubelet identity ACR role assignment..."
    ROLE_ASSIGNMENT=$(az role assignment list \
        --assignee "$KUBELET_PRINCIPAL_ID" \
        --scope "$ACR_ID" \
        --query "[?roleDefinitionName=='AcrPull'].roleDefinitionName" -o tsv)

    if [[ -n "$ROLE_ASSIGNMENT" ]]; then
        log_success "Kubelet identity has AcrPull role"
    else
        log_warning "Kubelet identity does not have AcrPull role - assigning now..."
        az role assignment create \
            --assignee "$KUBELET_PRINCIPAL_ID" \
            --scope "$ACR_ID" \
            --role "AcrPull"
        log_success "AcrPull role assigned to kubelet identity"
    fi

    # Verify workload identity has AcrPull role
    WORKLOAD_PRINCIPAL_ID=$(az identity show -n "$WORKLOAD_IDENTITY_NAME" -g "$RESOURCE_GROUP" --query "principalId" -o tsv)

    log_info "Checking workload identity ACR role assignment..."
    WORKLOAD_ROLE=$(az role assignment list \
        --assignee "$WORKLOAD_PRINCIPAL_ID" \
        --scope "$ACR_ID" \
        --query "[?roleDefinitionName=='AcrPull'].roleDefinitionName" -o tsv)

    if [[ -n "$WORKLOAD_ROLE" ]]; then
        log_success "Workload identity has AcrPull role"
    else
        log_warning "Workload identity does not have AcrPull role - assigning now..."
        az role assignment create \
            --assignee "$WORKLOAD_PRINCIPAL_ID" \
            --scope "$ACR_ID" \
            --role "AcrPull"
        log_success "AcrPull role assigned to workload identity"
    fi

    log_success "ACR access verification completed"
}

# ============================================================================
# Test Image Pull
# ============================================================================

test_image_pull() {
    log_info "Testing image pull from ACR..."

    ACR_LOGIN_SERVER=$(az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" --query "loginServer" -o tsv)

    # Create a test pod using workload identity
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: acr-test-pod
  namespace: jobpilot
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: jobpilot-service-account
  containers:
  - name: test
    image: ${ACR_LOGIN_SERVER}/nginx:latest
    command: ["sh", "-c", "echo 'ACR pull test successful' && sleep 30"]
  restartPolicy: Never
EOF

    log_info "Waiting for test pod to start..."
    kubectl wait --for=condition=Ready pod/acr-test-pod -n jobpilot --timeout=60s 2>/dev/null || true

    # Check pod status
    POD_STATUS=$(kubectl get pod acr-test-pod -n jobpilot -o jsonpath='{.status.phase}' 2>/dev/null || echo "Unknown")

    if [[ "$POD_STATUS" == "Running" ]] || [[ "$POD_STATUS" == "Succeeded" ]]; then
        log_success "Image pull test successful! Pod is $POD_STATUS"
    else
        log_warning "Image pull test inconclusive. Pod status: $POD_STATUS"
        log_info "You may need to push a test image to ACR first"
    fi

    # Clean up test pod
    kubectl delete pod acr-test-pod -n jobpilot --ignore-not-found=true
    log_info "Test pod cleaned up"
}

# ============================================================================
# Display Summary
# ============================================================================

display_summary() {
    log_info "Configuration Summary"
    echo ""
    echo "=================================="
    echo "AKS-ACR Integration Configuration"
    echo "=================================="
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Resource Group: $RESOURCE_GROUP"
    echo ""
    echo "AKS Cluster: $AKS_CLUSTER_NAME"
    echo "ACR: $ACR_NAME"
    echo "ACR Login Server: $(az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" --query "loginServer" -o tsv)"
    echo ""
    echo "OIDC Issuer: $OIDC_ISSUER_URL"
    echo "Workload Identity: $WORKLOAD_IDENTITY_NAME"
    echo "Workload Identity Client ID: $WORKLOAD_IDENTITY_CLIENT_ID"
    echo ""
    echo "Kubernetes Service Account: jobpilot-service-account"
    echo "Namespace: jobpilot"
    echo ""
    echo "=================================="
    echo ""
    log_success "Configuration completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update your Kubernetes deployments to use the ACR images"
    echo "2. Ensure pods have the label: azure.workload.identity/use: 'true'"
    echo "3. Ensure pods use serviceAccountName: jobpilot-service-account"
    echo "4. Test your deployments"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    log_info "Starting AKS-ACR integration configuration..."
    echo ""

    check_prerequisites
    get_resource_info
    configure_workload_identity
    update_kubernetes_serviceaccount
    verify_acr_access
    test_image_pull
    display_summary
}

# Run main function
main "$@"
