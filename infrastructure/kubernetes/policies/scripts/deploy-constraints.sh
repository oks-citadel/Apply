#!/bin/bash
set -euo pipefail

# Deploy Gatekeeper Constraints
# This script deploys all constraints to enforce policies

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONSTRAINTS_DIR="$SCRIPT_DIR/../gatekeeper/constraints"
DRY_RUN="${DRY_RUN:-false}"

echo "========================================="
echo "Deploying Gatekeeper Constraints"
echo "========================================="
echo "Dry Run Mode: $DRY_RUN"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl is not installed"
    exit 1
fi

# Check if constraints directory exists
if [ ! -d "$CONSTRAINTS_DIR" ]; then
    echo "ERROR: Constraints directory not found: $CONSTRAINTS_DIR"
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

# Verify constraint templates are installed
echo "Verifying constraint templates are installed..."
REQUIRED_TEMPLATES=(
    "k8sallowedrepos"
    "k8sblocklatesttag"
    "k8spspnoprivileged"
    "k8spsprequirerunasnonroot"
    "k8srequireresources"
)

MISSING_TEMPLATES=()
for template in "${REQUIRED_TEMPLATES[@]}"; do
    if ! kubectl get constrainttemplate "$template" &> /dev/null; then
        MISSING_TEMPLATES+=("$template")
    fi
done

if [ ${#MISSING_TEMPLATES[@]} -gt 0 ]; then
    echo "ERROR: Missing constraint templates:"
    for template in "${MISSING_TEMPLATES[@]}"; do
        echo "  - $template"
    done
    echo ""
    echo "Please run ./deploy-constraint-templates.sh first"
    exit 1
fi

echo "✅ All required constraint templates are installed"
echo ""

# Deploy constraints
echo "Deploying constraints from: $CONSTRAINTS_DIR"
echo ""

CONSTRAINT_COUNT=0
FAILED_COUNT=0

for constraint_file in "$CONSTRAINTS_DIR"/*.yaml; do
    if [ -f "$constraint_file" ]; then
        constraint_name=$(basename "$constraint_file")
        echo "Deploying: $constraint_name"

        if [ "$DRY_RUN" = "true" ]; then
            echo "DRY RUN: Would deploy $constraint_name"
            kubectl apply -f "$constraint_file" --dry-run=client
        else
            if kubectl apply -f "$constraint_file"; then
                echo "✅ $constraint_name deployed successfully"
                ((CONSTRAINT_COUNT++))
            else
                echo "❌ Failed to deploy $constraint_name"
                ((FAILED_COUNT++))
            fi
        fi
        echo ""
    fi
done

echo "========================================="
echo "Deployment Summary"
echo "========================================="
echo "Constraints deployed: $CONSTRAINT_COUNT"
echo "Failed deployments: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -gt 0 ]; then
    echo "⚠️  Some constraints failed to deploy"
    exit 1
fi

# Wait for constraints to be ready
if [ "$DRY_RUN" != "true" ]; then
    echo "Waiting for constraints to be established..."
    sleep 5

    # List all constraints
    echo ""
    echo "Installed Constraints:"
    kubectl get constraints --all-namespaces
    echo ""
fi

echo "========================================="
echo "Constraints Deployed Successfully"
echo "========================================="
echo ""
echo "Next step: Verify policies with ./verify-policies.sh"
echo ""

if [ "$DRY_RUN" != "true" ]; then
    echo "⚠️  WARNING: Policies are now enforced!"
    echo "Deployments that violate policies will be rejected."
    echo ""
    echo "To temporarily disable enforcement, set enforcementAction to 'dryrun':"
    echo "  kubectl patch constraint <constraint-name> --type=merge -p '{\"spec\":{\"enforcementAction\":\"dryrun\"}}'"
    echo ""
fi
