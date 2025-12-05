#!/bin/bash
# ============================================================================
# Deployment Script for Azure Infrastructure with WAF and Enhanced Monitoring
# ============================================================================
#
# Usage:
#   ./deploy-with-waf.sh <environment> <waf-option> <waf-mode>
#
# Arguments:
#   environment: dev, staging, or prod
#   waf-option: none, appgw, or frontdoor
#   waf-mode: Detection or Prevention
#
# Examples:
#   ./deploy-with-waf.sh dev none Detection
#   ./deploy-with-waf.sh staging appgw Detection
#   ./deploy-with-waf.sh prod frontdoor Prevention
#
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Input Validation
# ============================================================================

ENVIRONMENT=${1:-dev}
WAF_OPTION=${2:-none}
WAF_MODE=${3:-Detection}

if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be dev, staging, or prod${NC}"
    exit 1
fi

if [[ ! "$WAF_OPTION" =~ ^(none|appgw|frontdoor)$ ]]; then
    echo -e "${RED}Error: WAF option must be none, appgw, or frontdoor${NC}"
    exit 1
fi

if [[ ! "$WAF_MODE" =~ ^(Detection|Prevention)$ ]]; then
    echo -e "${RED}Error: WAF mode must be Detection or Prevention${NC}"
    exit 1
fi

# ============================================================================
# Configuration
# ============================================================================

LOCATION="eastus"
PROJECT_NAME="jobpilot"
SUBSCRIPTION_NAME="JobPilot-Production" # Update this
TEMPLATE_FILE="infrastructure/azure/main.bicep"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  JobPilot Azure Infrastructure Deployment with WAF          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Configuration:${NC}"
echo -e "  Environment:        ${YELLOW}$ENVIRONMENT${NC}"
echo -e "  Location:           ${YELLOW}$LOCATION${NC}"
echo -e "  WAF Option:         ${YELLOW}$WAF_OPTION${NC}"
echo -e "  WAF Mode:           ${YELLOW}$WAF_MODE${NC}"
echo -e "  Project Name:       ${YELLOW}$PROJECT_NAME${NC}"
echo ""

# ============================================================================
# Set WAF Parameters
# ============================================================================

ENABLE_APP_GATEWAY="false"
ENABLE_FRONT_DOOR="false"

case $WAF_OPTION in
    appgw)
        ENABLE_APP_GATEWAY="true"
        echo -e "${GREEN}✓ Application Gateway with WAF will be deployed${NC}"
        ;;
    frontdoor)
        ENABLE_FRONT_DOOR="true"
        echo -e "${GREEN}✓ Azure Front Door with WAF will be deployed${NC}"
        ;;
    none)
        echo -e "${YELLOW}⚠ No WAF will be deployed (direct App Service access)${NC}"
        ;;
esac

# ============================================================================
# Get Credentials
# ============================================================================

echo ""
echo -e "${BLUE}Please provide SQL Administrator credentials:${NC}"
read -p "SQL Admin Username: " SQL_ADMIN_USERNAME
read -sp "SQL Admin Password: " SQL_ADMIN_PASSWORD
echo ""

# Validate password complexity
if [[ ${#SQL_ADMIN_PASSWORD} -lt 12 ]]; then
    echo -e "${RED}Error: Password must be at least 12 characters${NC}"
    exit 1
fi

# ============================================================================
# Azure Login
# ============================================================================

echo ""
echo -e "${BLUE}Checking Azure login status...${NC}"

if ! az account show > /dev/null 2>&1; then
    echo -e "${YELLOW}Not logged in. Initiating login...${NC}"
    az login
fi

# ============================================================================
# Set Subscription
# ============================================================================

echo -e "${BLUE}Setting active subscription...${NC}"
SUBSCRIPTION_ID=$(az account list --query "[?name=='$SUBSCRIPTION_NAME'].id" -o tsv)

if [ -z "$SUBSCRIPTION_ID" ]; then
    echo -e "${YELLOW}Subscription '$SUBSCRIPTION_NAME' not found. Available subscriptions:${NC}"
    az account list --query "[].{Name:name, ID:id}" -o table
    read -p "Enter subscription ID to use: " SUBSCRIPTION_ID
fi

az account set --subscription "$SUBSCRIPTION_ID"
echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION_ID${NC}"

# ============================================================================
# Validate Template
# ============================================================================

echo ""
echo -e "${BLUE}Validating Bicep template...${NC}"

VALIDATION_OUTPUT=$(az deployment sub validate \
    --location "$LOCATION" \
    --template-file "$TEMPLATE_FILE" \
    --parameters \
        environment="$ENVIRONMENT" \
        location="$LOCATION" \
        projectName="$PROJECT_NAME" \
        sqlAdminUsername="$SQL_ADMIN_USERNAME" \
        sqlAdminPassword="$SQL_ADMIN_PASSWORD" \
        enableApplicationGateway="$ENABLE_APP_GATEWAY" \
        enableFrontDoor="$ENABLE_FRONT_DOOR" \
        wafMode="$WAF_MODE" \
        enableDefender=$([[ "$ENVIRONMENT" == "prod" ]] && echo "true" || echo "false") \
        enablePrivateEndpoints=$([[ "$ENVIRONMENT" == "prod" ]] && echo "true" || echo "false") \
    --output json)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Template validation successful${NC}"
else
    echo -e "${RED}✗ Template validation failed${NC}"
    echo "$VALIDATION_OUTPUT"
    exit 1
fi

# ============================================================================
# Cost Estimation
# ============================================================================

echo ""
echo -e "${BLUE}Estimated Monthly Costs:${NC}"

case $ENVIRONMENT in
    dev)
        BASE_COST=150
        ;;
    staging)
        BASE_COST=400
        ;;
    prod)
        BASE_COST=800
        ;;
esac

WAF_COST=0
case $WAF_OPTION in
    appgw)
        WAF_COST=380
        ;;
    frontdoor)
        WAF_COST=405
        ;;
esac

MONITORING_COST=27
TOTAL_COST=$((BASE_COST + WAF_COST + MONITORING_COST))

echo -e "  Base Infrastructure:  ${YELLOW}\$$BASE_COST${NC}"
echo -e "  WAF (${WAF_OPTION}):           ${YELLOW}\$$WAF_COST${NC}"
echo -e "  Enhanced Monitoring:  ${YELLOW}\$$MONITORING_COST${NC}"
echo -e "  ${GREEN}Total Estimated:      \$$TOTAL_COST/month${NC}"

# ============================================================================
# Deployment Confirmation
# ============================================================================

echo ""
echo -e "${YELLOW}⚠ This will deploy Azure resources that will incur costs${NC}"
read -p "Do you want to proceed with deployment? (yes/no): " CONFIRM

if [[ ! "$CONFIRM" =~ ^(yes|YES|y|Y)$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

# ============================================================================
# Deploy Infrastructure
# ============================================================================

echo ""
echo -e "${BLUE}Starting deployment...${NC}"
echo -e "${YELLOW}This may take 15-30 minutes...${NC}"

DEPLOYMENT_NAME="${PROJECT_NAME}-${ENVIRONMENT}-$(date +%Y%m%d-%H%M%S)"

az deployment sub create \
    --name "$DEPLOYMENT_NAME" \
    --location "$LOCATION" \
    --template-file "$TEMPLATE_FILE" \
    --parameters \
        environment="$ENVIRONMENT" \
        location="$LOCATION" \
        projectName="$PROJECT_NAME" \
        sqlAdminUsername="$SQL_ADMIN_USERNAME" \
        sqlAdminPassword="$SQL_ADMIN_PASSWORD" \
        enableApplicationGateway="$ENABLE_APP_GATEWAY" \
        enableFrontDoor="$ENABLE_FRONT_DOOR" \
        wafMode="$WAF_MODE" \
        enableDefender=$([[ "$ENVIRONMENT" == "prod" ]] && echo "true" || echo "false") \
        enablePrivateEndpoints=$([[ "$ENVIRONMENT" == "prod" ]] && echo "true" || echo "false") \
    --output json > deployment-output.json

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
else
    echo -e "${RED}✗ Deployment failed${NC}"
    cat deployment-output.json
    exit 1
fi

# ============================================================================
# Extract Outputs
# ============================================================================

echo ""
echo -e "${BLUE}Deployment Outputs:${NC}"

RESOURCE_GROUP=$(jq -r '.properties.outputs.resourceGroupName.value' deployment-output.json)
WEB_APP_URL=$(jq -r '.properties.outputs.webAppUrl.value' deployment-output.json)
AUTH_SERVICE_URL=$(jq -r '.properties.outputs.authServiceUrl.value' deployment-output.json)
AI_SERVICE_URL=$(jq -r '.properties.outputs.aiServiceUrl.value' deployment-output.json)
DASHBOARD_ID=$(jq -r '.properties.outputs.monitoringDashboardId.value' deployment-output.json)

echo -e "  Resource Group:      ${GREEN}$RESOURCE_GROUP${NC}"
echo -e "  Web App URL:         ${GREEN}$WEB_APP_URL${NC}"
echo -e "  Auth Service URL:    ${GREEN}$AUTH_SERVICE_URL${NC}"
echo -e "  AI Service URL:      ${GREEN}$AI_SERVICE_URL${NC}"

if [ "$ENABLE_APP_GATEWAY" == "true" ]; then
    APP_GW_IP=$(jq -r '.properties.outputs.applicationGatewayPublicIp.value' deployment-output.json)
    APP_GW_FQDN=$(jq -r '.properties.outputs.applicationGatewayFqdn.value' deployment-output.json)
    echo -e "  App Gateway IP:      ${GREEN}$APP_GW_IP${NC}"
    echo -e "  App Gateway FQDN:    ${GREEN}$APP_GW_FQDN${NC}"
fi

if [ "$ENABLE_FRONT_DOOR" == "true" ]; then
    FD_URL=$(jq -r '.properties.outputs.frontDoorUrl.value' deployment-output.json)
    echo -e "  Front Door URL:      ${GREEN}$FD_URL${NC}"
fi

# ============================================================================
# Post-Deployment Steps
# ============================================================================

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Post-Deployment Steps                                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}1. View Monitoring Dashboard:${NC}"
echo -e "   az portal dashboard show --resource-group $RESOURCE_GROUP --name ${PROJECT_NAME}-${ENVIRONMENT}-dashboard"
echo ""
echo -e "${GREEN}2. Check WAF Logs (if enabled):${NC}"
if [ "$ENABLE_APP_GATEWAY" == "true" ]; then
    echo -e "   az network application-gateway waf-policy show --resource-group $RESOURCE_GROUP --name ${PROJECT_NAME}-${ENVIRONMENT}-waf-policy"
fi
if [ "$ENABLE_FRONT_DOOR" == "true" ]; then
    echo -e "   az network front-door waf-policy show --resource-group $RESOURCE_GROUP --name ${PROJECT_NAME}${ENVIRONMENT}wafpolicy"
fi
echo ""
echo -e "${GREEN}3. Configure Container Images:${NC}"
echo -e "   Update App Service deployment to use your container images"
echo ""
echo -e "${GREEN}4. Set Up Custom Domains (if needed):${NC}"
echo -e "   Configure DNS and SSL certificates for your domain"
echo ""
echo -e "${GREEN}5. Review and Tune Alerts:${NC}"
echo -e "   Monitor for false positives over the next week and adjust thresholds"
echo ""

# Save outputs to file
echo -e "${BLUE}Saving deployment outputs to 'deployment-outputs.txt'...${NC}"
cat > deployment-outputs.txt <<EOF
JobPilot Azure Deployment - $ENVIRONMENT
Deployment Time: $(date)
Deployment Name: $DEPLOYMENT_NAME

=== URLs ===
Web App:         $WEB_APP_URL
Auth Service:    $AUTH_SERVICE_URL
AI Service:      $AI_SERVICE_URL

=== Azure Resources ===
Resource Group:  $RESOURCE_GROUP
Subscription:    $SUBSCRIPTION_ID

=== Monitoring ===
Dashboard ID:    $DASHBOARD_ID

=== WAF Configuration ===
WAF Option:      $WAF_OPTION
WAF Mode:        $WAF_MODE

EOF

if [ "$ENABLE_APP_GATEWAY" == "true" ]; then
    cat >> deployment-outputs.txt <<EOF
App Gateway IP:  $APP_GW_IP
App Gateway FQDN: $APP_GW_FQDN
EOF
fi

if [ "$ENABLE_FRONT_DOOR" == "true" ]; then
    cat >> deployment-outputs.txt <<EOF
Front Door URL:  $FD_URL
EOF
fi

echo -e "${GREEN}✓ Deployment outputs saved to 'deployment-outputs.txt'${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment Complete! 🎉                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
