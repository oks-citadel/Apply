#!/bin/bash

################################################################################
# Deploy JobPilot Infrastructure with Private Endpoints
################################################################################
# This script deploys the Azure infrastructure with private networking enabled
# for secure, production-grade deployments.
#
# Usage:
#   ./deploy-private.sh <environment> [options]
#
# Arguments:
#   environment    - Environment to deploy (dev, staging, prod)
#
# Options:
#   --location     - Azure region (default: eastus)
#   --project      - Project name (default: jobpilot)
#   --sql-user     - SQL admin username
#   --sql-pass     - SQL admin password
#   --allowed-ips  - Comma-separated list of allowed IPs (optional)
#   --dry-run      - Validate only, don't deploy
#   --what-if      - Show what would change without deploying
#
# Examples:
#   # Deploy to production with private endpoints
#   ./deploy-private.sh prod --sql-user sqladmin --sql-pass 'SecurePass123!'
#
#   # Deploy to staging with IP allowlist
#   ./deploy-private.sh staging --allowed-ips "203.0.113.0/24,198.51.100.5"
#
#   # Dry run for production
#   ./deploy-private.sh prod --dry-run
################################################################################

set -e

# Default values
LOCATION="eastus"
PROJECT_NAME="jobpilot"
DRY_RUN=false
WHAT_IF=false
ALLOWED_IPS=""
SQL_USERNAME=""
SQL_PASSWORD=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to display usage
usage() {
    cat << EOF
Usage: $0 <environment> [options]

Arguments:
  environment    - Environment to deploy (dev, staging, prod)

Options:
  --location LOCATION        Azure region (default: eastus)
  --project PROJECT          Project name (default: jobpilot)
  --sql-user USERNAME        SQL admin username (required)
  --sql-pass PASSWORD        SQL admin password (required)
  --allowed-ips IPS          Comma-separated list of allowed IPs
  --dry-run                  Validate only, don't deploy
  --what-if                  Show what would change without deploying
  --help                     Display this help message

Examples:
  $0 prod --sql-user sqladmin --sql-pass 'SecurePass123!'
  $0 staging --allowed-ips "203.0.113.0/24"
  $0 dev --dry-run

EOF
    exit 1
}

# Parse arguments
if [ $# -eq 0 ]; then
    usage
fi

ENVIRONMENT=$1
shift

while [[ $# -gt 0 ]]; do
    case $1 in
        --location)
            LOCATION="$2"
            shift 2
            ;;
        --project)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --sql-user)
            SQL_USERNAME="$2"
            shift 2
            ;;
        --sql-pass)
            SQL_PASSWORD="$2"
            shift 2
            ;;
        --allowed-ips)
            ALLOWED_IPS="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --what-if)
            WHAT_IF=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT (must be dev, staging, or prod)"
    exit 1
fi

print_info "Deploying JobPilot infrastructure to $ENVIRONMENT environment"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Get subscription info
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

print_info "Using Azure subscription: $SUBSCRIPTION_NAME ($SUBSCRIPTION_ID)"

# Validate SQL credentials if not using parameter file
PARAM_FILE="parameters/${ENVIRONMENT}.json"
if [ ! -f "$PARAM_FILE" ]; then
    if [ -z "$SQL_USERNAME" ] || [ -z "$SQL_PASSWORD" ]; then
        print_error "SQL credentials are required. Use --sql-user and --sql-pass"
        exit 1
    fi
fi

# Determine if private endpoints should be enabled
ENABLE_PRIVATE_ENDPOINTS="false"
if [ "$ENVIRONMENT" == "prod" ]; then
    ENABLE_PRIVATE_ENDPOINTS="true"
    print_info "Private endpoints: ENABLED (production environment)"
elif [ "$ENVIRONMENT" == "staging" ]; then
    ENABLE_PRIVATE_ENDPOINTS="true"
    print_info "Private endpoints: ENABLED (staging environment)"
else
    ENABLE_PRIVATE_ENDPOINTS="false"
    print_info "Private endpoints: DISABLED (development environment)"
fi

# Build allowed IPs parameter
ALLOWED_IPS_PARAM="[]"
if [ -n "$ALLOWED_IPS" ]; then
    # Convert comma-separated list to JSON array
    IFS=',' read -ra IP_ARRAY <<< "$ALLOWED_IPS"
    ALLOWED_IPS_PARAM="["
    for i in "${!IP_ARRAY[@]}"; do
        if [ $i -gt 0 ]; then
            ALLOWED_IPS_PARAM+=","
        fi
        ALLOWED_IPS_PARAM+="\"${IP_ARRAY[$i]}\""
    done
    ALLOWED_IPS_PARAM+="]"
    print_info "Allowed IP addresses: $ALLOWED_IPS"
fi

# Generate deployment name
DEPLOYMENT_NAME="${PROJECT_NAME}-${ENVIRONMENT}-private-$(date +%Y%m%d-%H%M%S)"

# Build deployment command
DEPLOY_CMD="az deployment sub create \
    --name $DEPLOYMENT_NAME \
    --location $LOCATION \
    --template-file main.bicep"

# Add parameters
if [ -f "$PARAM_FILE" ]; then
    print_info "Using parameter file: $PARAM_FILE"
    DEPLOY_CMD+=" --parameters @$PARAM_FILE"

    # Override specific parameters
    DEPLOY_CMD+=" enablePrivateEndpoints=$ENABLE_PRIVATE_ENDPOINTS"

    if [ -n "$ALLOWED_IPS" ]; then
        DEPLOY_CMD+=" allowedIpAddresses=$ALLOWED_IPS_PARAM"
    fi
else
    # Use command-line parameters
    DEPLOY_CMD+=" --parameters \
        environment=$ENVIRONMENT \
        location=$LOCATION \
        projectName=$PROJECT_NAME \
        sqlAdminUsername='$SQL_USERNAME' \
        sqlAdminPassword='$SQL_PASSWORD' \
        enablePrivateEndpoints=$ENABLE_PRIVATE_ENDPOINTS \
        allowedIpAddresses='$ALLOWED_IPS_PARAM'"
fi

# Add what-if or validation flag
if [ "$WHAT_IF" = true ]; then
    DEPLOY_CMD+=" --what-if"
    print_info "Running what-if analysis..."
elif [ "$DRY_RUN" = true ]; then
    DEPLOY_CMD+=" --validate-only"
    print_info "Running validation only (dry run)..."
fi

# Display deployment configuration
echo ""
print_info "Deployment Configuration:"
echo "  Environment:          $ENVIRONMENT"
echo "  Location:             $LOCATION"
echo "  Project:              $PROJECT_NAME"
echo "  Private Endpoints:    $ENABLE_PRIVATE_ENDPOINTS"
echo "  Allowed IPs:          ${ALLOWED_IPS:-None}"
echo "  Deployment Name:      $DEPLOYMENT_NAME"
echo ""

# Confirm deployment
if [ "$DRY_RUN" = false ] && [ "$WHAT_IF" = false ]; then
    read -p "Proceed with deployment? (yes/no): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy](es)?$ ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
fi

# Execute deployment
print_info "Starting deployment..."
echo ""

if eval "$DEPLOY_CMD"; then
    print_success "Deployment completed successfully!"

    if [ "$DRY_RUN" = false ] && [ "$WHAT_IF" = false ]; then
        # Get deployment outputs
        RESOURCE_GROUP="${PROJECT_NAME}-${ENVIRONMENT}-rg"

        print_info "Deployment Outputs:"
        az deployment sub show \
            --name "$DEPLOYMENT_NAME" \
            --query properties.outputs \
            -o json | jq .

        # Display next steps
        echo ""
        print_success "Next Steps:"
        echo "  1. Verify private endpoint connectivity:"
        echo "     az network private-endpoint list --resource-group $RESOURCE_GROUP"
        echo ""
        echo "  2. Test DNS resolution from App Service:"
        echo "     az webapp ssh --name ${PROJECT_NAME}-${ENVIRONMENT}-web --resource-group $RESOURCE_GROUP"
        echo ""
        echo "  3. Verify Key Vault access:"
        echo "     az keyvault show --name \$(az deployment sub show --name $DEPLOYMENT_NAME --query properties.outputs.keyVaultName.value -o tsv)"
        echo ""

        if [ "$ENABLE_PRIVATE_ENDPOINTS" = "true" ]; then
            print_warning "Private endpoints are enabled. Services are only accessible from within the VNet."
            echo "  Use Azure Bastion or VPN Gateway for administrative access."
        fi
    fi
else
    print_error "Deployment failed!"
    exit 1
fi
