#!/bin/bash
# ============================================================================
# Azure DevOps Pipeline Setup Script
# ============================================================================
# This script sets up the Azure DevOps pipelines for JobPilot AI Platform
#
# Prerequisites:
# - Azure CLI installed and logged in
# - Azure DevOps CLI extension installed
# - Appropriate permissions in Azure DevOps organization
# ============================================================================

set -e

# Configuration
ORGANIZATION="https://dev.azure.com/citadelcloudmanagement"
PROJECT="ApplyPlatform"
REPO="ApplyPlatform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Azure DevOps Pipeline Setup${NC}"
echo -e "${BLUE}  Project: ${PROJECT}${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Error: Azure CLI is not installed${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}Please login to Azure CLI...${NC}"
    az login
fi

# Install Azure DevOps extension if not present
if ! az extension show --name azure-devops &> /dev/null; then
    echo -e "${YELLOW}Installing Azure DevOps CLI extension...${NC}"
    az extension add --name azure-devops
fi

# Configure defaults
echo -e "${GREEN}Configuring Azure DevOps defaults...${NC}"
az devops configure --defaults organization=$ORGANIZATION project=$PROJECT

# ============================================================================
# Create Variable Groups
# ============================================================================
echo -e "${BLUE}Creating variable groups...${NC}"

# Function to create variable group if it doesn't exist
create_variable_group() {
    local name=$1
    local description=$2

    if az pipelines variable-group list --query "[?name=='$name']" -o tsv | grep -q .; then
        echo -e "${YELLOW}Variable group '$name' already exists${NC}"
    else
        echo -e "${GREEN}Creating variable group: $name${NC}"
        az pipelines variable-group create \
            --name "$name" \
            --description "$description" \
            --authorize true \
            --variables placeholder=true
    fi
}

# Common secrets (shared across environments)
create_variable_group "common-secrets" "Common secrets shared across all environments"

# Development environment
create_variable_group "dev-secrets" "Development environment secrets"
create_variable_group "terraform-dev" "Terraform variables for development"

# Staging environment
create_variable_group "staging-secrets" "Staging environment secrets"
create_variable_group "terraform-staging" "Terraform variables for staging"

# Production environment
create_variable_group "prod-secrets" "Production environment secrets"
create_variable_group "terraform-prod" "Terraform variables for production"

# ============================================================================
# Create Environments
# ============================================================================
echo -e "${BLUE}Creating environments...${NC}"

create_environment() {
    local name=$1
    local description=$2

    echo -e "${GREEN}Creating environment: $name${NC}"
    az devops invoke \
        --area distributedtask \
        --resource environments \
        --route-parameters project=$PROJECT \
        --http-method POST \
        --api-version 6.0-preview.1 \
        --in-file <(echo "{\"name\": \"$name\", \"description\": \"$description\"}") \
        2>/dev/null || echo -e "${YELLOW}Environment '$name' may already exist${NC}"
}

create_environment "jobpilot-dev" "Development environment"
create_environment "jobpilot-staging" "Staging environment"
create_environment "jobpilot-prod" "Production environment (requires approval)"
create_environment "jobpilot-destroy" "Destroy environment (requires approval)"

# ============================================================================
# Create Pipelines
# ============================================================================
echo -e "${BLUE}Creating pipelines...${NC}"

create_pipeline() {
    local name=$1
    local yaml_path=$2
    local folder=$3

    if az pipelines show --name "$name" &> /dev/null; then
        echo -e "${YELLOW}Pipeline '$name' already exists${NC}"
    else
        echo -e "${GREEN}Creating pipeline: $name${NC}"
        az pipelines create \
            --name "$name" \
            --repository $REPO \
            --repository-type tfsgit \
            --branch main \
            --yml-path "$yaml_path" \
            --folder-path "$folder" \
            --skip-first-run true
    fi
}

# Create main CI/CD pipeline
create_pipeline "CI-CD-Pipeline" "azure-pipelines.yml" "\\Build"

# Create Terraform pipeline
create_pipeline "Terraform-Infrastructure" "azure-pipelines-terraform.yml" "\\Infrastructure"

# ============================================================================
# Set up Service Connections
# ============================================================================
echo -e "${BLUE}Checking service connections...${NC}"

# Check if Azure service connection exists
if az devops service-endpoint list --query "[?name=='azure-service-connection']" -o tsv | grep -q .; then
    echo -e "${GREEN}Azure service connection exists${NC}"
else
    echo -e "${YELLOW}Azure service connection 'azure-service-connection' not found${NC}"
    echo -e "${YELLOW}Please create it manually in Azure DevOps:${NC}"
    echo -e "  1. Go to Project Settings > Service connections"
    echo -e "  2. Create new Azure Resource Manager connection"
    echo -e "  3. Name it 'azure-service-connection'"
    echo -e "  4. Grant access to all pipelines"
fi

# Check if Docker Hub service connection exists
if az devops service-endpoint list --query "[?name=='dockerhub-connection']" -o tsv | grep -q .; then
    echo -e "${GREEN}Docker Hub service connection exists${NC}"
else
    echo -e "${YELLOW}Docker Hub service connection 'dockerhub-connection' not found${NC}"
    echo -e "${YELLOW}Please create it manually if needed for container deployments${NC}"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Pipelines created:"
echo -e "  - CI-CD-Pipeline (azure-pipelines.yml)"
echo -e "  - Terraform-Infrastructure (azure-pipelines-terraform.yml)"
echo ""
echo -e "Variable groups created:"
echo -e "  - common-secrets"
echo -e "  - dev-secrets, terraform-dev"
echo -e "  - staging-secrets, terraform-staging"
echo -e "  - prod-secrets, terraform-prod"
echo ""
echo -e "Environments created:"
echo -e "  - jobpilot-dev"
echo -e "  - jobpilot-staging"
echo -e "  - jobpilot-prod (requires approval)"
echo -e "  - jobpilot-destroy (requires approval)"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Configure variable group values in Azure DevOps"
echo -e "2. Create/verify 'azure-service-connection' service connection"
echo -e "3. Set up approval gates for production environment"
echo -e "4. Add Terraform state backend variables to terraform-* groups:"
echo -e "   - TF_STATE_RG (resource group for state storage)"
echo -e "   - TF_STATE_STORAGE (storage account name)"
echo -e "   - TF_STATE_CONTAINER (container name)"
echo -e "   - ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_SUBSCRIPTION_ID, ARM_TENANT_ID"
echo ""
echo -e "Pipeline URLs:"
echo -e "  ${ORGANIZATION}/${PROJECT}/_build"
echo ""
