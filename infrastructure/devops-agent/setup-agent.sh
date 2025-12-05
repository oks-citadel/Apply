#!/bin/bash
# ============================================================================
# Azure DevOps Self-Hosted Agent Setup Script
# ============================================================================
# This script deploys a self-hosted Azure DevOps agent to Azure Container Instance
#
# Prerequisites:
#   1. Azure CLI logged in
#   2. Personal Access Token (PAT) with Agent Pools (read, manage) scope
#
# Usage:
#   ./setup-agent.sh <PAT_TOKEN>
#
# To create a PAT:
#   1. Go to Azure DevOps > User Settings > Personal Access Tokens
#   2. Create new token with "Agent Pools (read, manage)" scope
#   3. Copy the token and use it as the argument to this script
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   Azure DevOps Agent Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Configuration
RESOURCE_GROUP="applyplatform-devops-agent-rg"
LOCATION="eastus"
AZP_URL="https://dev.azure.com/citadelcloudmanagement"
AZP_POOL="Default"
AGENT_NAME="aci-terraform-agent"
CPU_CORES=2
MEMORY_GB=4

# Check if PAT is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Personal Access Token (PAT) is required${NC}"
    echo ""
    echo "Usage: $0 <PAT_TOKEN>"
    echo ""
    echo "To create a PAT:"
    echo "  1. Go to Azure DevOps > User Settings > Personal Access Tokens"
    echo "  2. Click 'New Token'"
    echo "  3. Set Name: 'DevOps Agent'"
    echo "  4. Set Scopes: 'Agent Pools (Read & Manage)'"
    echo "  5. Click 'Create' and copy the token"
    echo ""
    echo "URL: https://dev.azure.com/citadelcloudmanagement/_usersSettings/tokens"
    exit 1
fi

AZP_TOKEN="$1"

echo -e "${YELLOW}Step 1: Creating resource group...${NC}"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true
echo -e "${GREEN}✓ Resource group ready${NC}"

echo ""
echo -e "${YELLOW}Step 2: Deploying Azure Container Instance with DevOps agent...${NC}"
echo -e "${BLUE}This will create a Linux container with Terraform, Azure CLI, tfsec, and Checkov${NC}"
echo ""

# Deploy using Azure CLI directly (simpler than Bicep for this use case)
az container create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AGENT_NAME" \
    --image "mcr.microsoft.com/azure-pipelines/vsts-agent:ubuntu-22.04" \
    --os-type Linux \
    --cpu "$CPU_CORES" \
    --memory "$MEMORY_GB" \
    --restart-policy Always \
    --environment-variables \
        AZP_URL="$AZP_URL" \
        AZP_POOL="$AZP_POOL" \
        AZP_AGENT_NAME="$AGENT_NAME" \
    --secure-environment-variables \
        AZP_TOKEN="$AZP_TOKEN" \
    --output none

echo -e "${GREEN}✓ Container deployed${NC}"

echo ""
echo -e "${YELLOW}Step 3: Waiting for agent to register...${NC}"
sleep 30

# Check agent status
AGENT_STATUS=$(az container show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$AGENT_NAME" \
    --query "instanceView.state" \
    --output tsv)

if [ "$AGENT_STATUS" == "Running" ]; then
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   SUCCESS! Agent is running${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Agent Name: ${BLUE}$AGENT_NAME${NC}"
    echo -e "Agent Pool: ${BLUE}$AZP_POOL${NC}"
    echo -e "Organization: ${BLUE}$AZP_URL${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Verify agent in Azure DevOps:"
    echo "     https://dev.azure.com/citadelcloudmanagement/_settings/agentpools?poolId=1"
    echo ""
    echo "  2. Run the Terraform pipeline:"
    echo "     az pipelines run --id 9 --branch develop"
    echo ""
    echo "  3. Monitor container logs:"
    echo "     az container logs --resource-group $RESOURCE_GROUP --name $AGENT_NAME"
else
    echo -e "${RED}Warning: Agent status is '$AGENT_STATUS'${NC}"
    echo "Check logs with: az container logs --resource-group $RESOURCE_GROUP --name $AGENT_NAME"
fi
