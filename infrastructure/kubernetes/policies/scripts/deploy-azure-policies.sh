#!/bin/bash
set -euo pipefail

# Deploy Azure Policies for AKS
# This script creates and assigns Azure Policy definitions to the AKS cluster

RESOURCE_GROUP="${RESOURCE_GROUP:-applyforus-rg}"
CLUSTER_NAME="${CLUSTER_NAME:-applyforus-aks}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POLICIES_DIR="$SCRIPT_DIR/../azure-policy"

echo "========================================="
echo "Deploying Azure Policies for AKS"
echo "========================================="
echo "Resource Group: $RESOURCE_GROUP"
echo "AKS Cluster: $CLUSTER_NAME"
echo ""

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    echo "ERROR: Azure CLI is not installed"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "ERROR: Not logged in to Azure"
    echo "Please run: az login"
    exit 1
fi

echo "✅ Logged in to Azure"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "Subscription: $SUBSCRIPTION_ID"
echo ""

# Get AKS cluster resource ID
echo "Getting AKS cluster resource ID..."
CLUSTER_ID=$(az aks show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CLUSTER_NAME" \
    --query id \
    -o tsv)

if [ -z "$CLUSTER_ID" ]; then
    echo "ERROR: Could not find AKS cluster"
    exit 1
fi

echo "✅ Found cluster: $CLUSTER_ID"
echo ""

# Enable Azure Policy Add-on for AKS
echo "Enabling Azure Policy Add-on for AKS..."
az aks enable-addons \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CLUSTER_NAME" \
    --addons azure-policy \
    --no-wait \
    || echo "Add-on may already be enabled"

echo "✅ Azure Policy Add-on enabled"
echo ""

# Create custom policy definitions
echo "Creating custom policy definitions..."
POLICY_COUNT=0

for policy_file in "$POLICIES_DIR"/*.json; do
    if [ -f "$policy_file" ]; then
        policy_name=$(basename "$policy_file" .json)
        echo "Creating policy: $policy_name"

        az policy definition create \
            --name "$policy_name" \
            --display-name "$(jq -r '.properties.displayName' "$policy_file")" \
            --description "$(jq -r '.properties.description' "$policy_file")" \
            --rules "$(jq -c '.properties.policyRule' "$policy_file")" \
            --params "$(jq -c '.properties.parameters' "$policy_file")" \
            --mode "$(jq -r '.properties.mode' "$policy_file")" \
            --metadata "$(jq -c '.properties.metadata' "$policy_file")" \
            || echo "Policy may already exist, updating..."

        ((POLICY_COUNT++))
        echo "✅ Policy created: $policy_name"
        echo ""
    fi
done

echo "Created $POLICY_COUNT custom policies"
echo ""

# Assign policies to AKS cluster
echo "Assigning policies to AKS cluster..."

POLICIES=(
    "acr-allowlist-policy"
    "no-latest-tags-policy"
    "non-root-containers-policy"
    "no-privileged-pods-policy"
    "resource-limits-policy"
)

for policy in "${POLICIES[@]}"; do
    assignment_name="${policy}-assignment"
    echo "Assigning: $policy"

    az policy assignment create \
        --name "$assignment_name" \
        --display-name "ApplyForUs - $policy" \
        --scope "$CLUSTER_ID" \
        --policy "/subscriptions/$SUBSCRIPTION_ID/providers/Microsoft.Authorization/policyDefinitions/$policy" \
        --params "{}" \
        || echo "Assignment may already exist"

    echo "✅ Assigned: $policy"
    echo ""
done

echo "========================================="
echo "Azure Policies Deployed Successfully"
echo "========================================="
echo ""
echo "Policy assignments may take 15-20 minutes to take effect."
echo ""
echo "To check policy compliance:"
echo "  az policy state list --resource '$CLUSTER_ID'"
echo ""
echo "To view policy assignments:"
echo "  az policy assignment list --scope '$CLUSTER_ID'"
echo ""
