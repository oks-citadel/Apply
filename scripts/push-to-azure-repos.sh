#!/bin/bash
# ============================================================================
# Push to Azure Repos Script
# ============================================================================
# This script configures and pushes the JobPilot AI Platform to Azure Repos
#
# Usage:
#   ./scripts/push-to-azure-repos.sh <azure-repos-url>
#
# Example:
#   ./scripts/push-to-azure-repos.sh https://dev.azure.com/your-org/JobPilot/_git/JobPilot
#
# Prerequisites:
#   1. Azure DevOps account with a project created
#   2. Git credentials configured (PAT or SSH)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   JobPilot - Push to Azure Repos${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Azure Repos URL is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Azure Repos URL is required${NC}"
    echo ""
    echo "Usage: $0 <azure-repos-url>"
    echo ""
    echo "Example:"
    echo "  $0 https://dev.azure.com/your-org/JobPilot/_git/JobPilot"
    echo ""
    echo "To get your Azure Repos URL:"
    echo "  1. Go to Azure DevOps: https://dev.azure.com"
    echo "  2. Create or select your project"
    echo "  3. Go to Repos > Files"
    echo "  4. Click 'Clone' and copy the HTTPS URL"
    exit 1
fi

AZURE_REPOS_URL="$1"

echo -e "${YELLOW}Step 1: Verifying git repository...${NC}"
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: Not a git repository. Please run from project root.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git repository found${NC}"

echo ""
echo -e "${YELLOW}Step 2: Checking current status...${NC}"
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
echo -e "${GREEN}✓ Repository has $COMMIT_COUNT commit(s)${NC}"

echo ""
echo -e "${YELLOW}Step 3: Adding Azure Repos remote...${NC}"
# Remove existing origin if it exists
git remote remove origin 2>/dev/null || true
git remote add origin "$AZURE_REPOS_URL"
echo -e "${GREEN}✓ Remote 'origin' added: $AZURE_REPOS_URL${NC}"

echo ""
echo -e "${YELLOW}Step 4: Renaming branch to 'main' (if needed)...${NC}"
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git branch -M main
    echo -e "${GREEN}✓ Branch renamed to 'main'${NC}"
else
    echo -e "${GREEN}✓ Already on 'main' branch${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Pushing to Azure Repos...${NC}"
echo -e "${BLUE}This may prompt for credentials (use PAT as password)${NC}"
echo ""

if git push -u origin main; then
    echo ""
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}   SUCCESS! Code pushed to Azure Repos${NC}"
    echo -e "${GREEN}============================================${NC}"
    echo ""
    echo -e "Repository URL: ${BLUE}$AZURE_REPOS_URL${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "  1. Create 'develop' branch in Azure Repos"
    echo "  2. Set up branch policies"
    echo "  3. Import the Terraform pipeline:"
    echo "     - Go to Pipelines > New Pipeline"
    echo "     - Select Azure Repos Git"
    echo "     - Select your repository"
    echo "     - Choose 'Existing Azure Pipelines YAML file'"
    echo "     - Select: /infrastructure/terraform/azure-pipelines-terraform.yml"
    echo ""
    echo "  4. Create Variable Groups (see docs/VARIABLE-GROUPS.md):"
    echo "     - terraform-backend"
    echo "     - terraform-credentials"
    echo ""
    echo "  5. Create Environments with approvals:"
    echo "     - dev (no approval)"
    echo "     - staging (1 approval)"
    echo "     - prod (2 approvals)"
    echo ""
    echo -e "${BLUE}Full setup guide: infrastructure/terraform/docs/AZURE-DEVOPS-SETUP.md${NC}"
else
    echo ""
    echo -e "${RED}============================================${NC}"
    echo -e "${RED}   FAILED to push to Azure Repos${NC}"
    echo -e "${RED}============================================${NC}"
    echo ""
    echo "Common issues:"
    echo "  1. Invalid credentials - Generate a PAT with 'Code (Read & Write)' scope"
    echo "  2. Repository doesn't exist - Create it in Azure DevOps first"
    echo "  3. Permission denied - Ensure you have Contributor access"
    echo ""
    echo "To generate a PAT:"
    echo "  1. Go to Azure DevOps > User Settings > Personal Access Tokens"
    echo "  2. Create new token with 'Code (Read & Write)' scope"
    echo "  3. Use your email as username and PAT as password"
    exit 1
fi
