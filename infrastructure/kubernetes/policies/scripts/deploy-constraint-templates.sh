#!/bin/bash
set -euo pipefail

# Deploy Gatekeeper Constraint Templates
# This script deploys all constraint templates to the AKS cluster

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../gatekeeper/constraint-templates"

echo "========================================="
echo "Deploying Gatekeeper Constraint Templates"
echo "========================================="
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    exit 1
fi

# Check if templates directory exists
if [ ! -d "$TEMPLATES_DIR" ]; then
    echo "ERROR: Templates directory not found: $TEMPLATES_DIR"
    exit 1
fi

# Check cluster connectivity
echo "Checking cluster connectivity..."
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✅ Connected to cluster"
echo ""

# Deploy each constraint template
echo "Deploying constraint templates from: $TEMPLATES_DIR"
echo ""

TEMPLATE_COUNT=0
FAILED_COUNT=0

for template_file in "$TEMPLATES_DIR"/*.yaml; do
    if [ -f "$template_file" ]; then
        template_name=$(basename "$template_file")
        echo "Deploying: $template_name"

        if kubectl apply -f "$template_file"; then
            echo "✅ $template_name deployed successfully"
            ((TEMPLATE_COUNT++))
        else
            echo "❌ Failed to deploy $template_name"
            ((FAILED_COUNT++))
        fi
        echo ""
    fi
done

echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo "Templates deployed: $TEMPLATE_COUNT"
echo "Failed deployments: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
    echo "⚠️  Some templates failed to deploy"
    exit 1
fi

# Wait for templates to be established
echo "Waiting for constraint templates to be established..."
sleep 5

# List all constraint templates
echo ""
echo "Installed Constraint Templates:"
kubectl get constrainttemplates
echo ""

echo "========================================="
echo "Constraint Templates Deployed Successfully"
echo "========================================="
echo ""
echo "Next step: Deploy constraints with ./deploy-constraints.sh"
echo ""
