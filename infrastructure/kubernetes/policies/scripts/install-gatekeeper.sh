#!/bin/bash
set -euo pipefail

# Install Gatekeeper (OPA) on AKS cluster
# This script installs OPA Gatekeeper for policy enforcement

GATEKEEPER_VERSION="${GATEKEEPER_VERSION:-v3.15.0}"
NAMESPACE="${NAMESPACE:-gatekeeper-system}"

echo "========================================="
echo "Installing OPA Gatekeeper on AKS"
echo "========================================="
echo "Version: $GATEKEEPER_VERSION"
echo "Namespace: $NAMESPACE"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    exit 1
fi

# Check cluster connectivity
echo "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    echo "Please ensure you are connected to the AKS cluster"
    exit 1
fi

echo "✅ Connected to cluster"
echo ""

# Install Gatekeeper using kubectl
echo "Installing Gatekeeper $GATEKEEPER_VERSION..."
kubectl apply -f "https://raw.githubusercontent.com/open-policy-agent/gatekeeper/${GATEKEEPER_VERSION}/deploy/gatekeeper.yaml"

echo ""
echo "Waiting for Gatekeeper to be ready..."
kubectl wait --for=condition=available --timeout=300s \
    deployment/gatekeeper-controller-manager \
    -n gatekeeper-system

kubectl wait --for=condition=available --timeout=300s \
    deployment/gatekeeper-audit \
    -n gatekeeper-system

echo ""
echo "✅ Gatekeeper installed successfully"
echo ""

# Verify installation
echo "Verifying Gatekeeper installation..."
kubectl get pods -n gatekeeper-system
echo ""

# Check CRDs
echo "Checking installed CRDs..."
kubectl get crd | grep gatekeeper
echo ""

echo "========================================="
echo "Gatekeeper Installation Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Deploy constraint templates: ./deploy-constraint-templates.sh"
echo "2. Deploy constraints: ./deploy-constraints.sh"
echo "3. Verify policies: ./verify-policies.sh"
echo ""
