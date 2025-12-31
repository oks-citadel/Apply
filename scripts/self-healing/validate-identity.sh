#!/bin/bash
# ============================================================================
# ApplyForUs Platform - Identity/B2C Validation Script
# ============================================================================
# This script validates the Entra ID / B2C identity configuration.
#
# Usage:
#   ./validate-identity.sh [--fix]
#
# Prerequisites:
#   - Azure CLI installed and authenticated
#   - Appropriate Azure AD permissions (Global Reader or higher)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${ENVIRONMENT:-dev}"
FIX_MODE=false
VALIDATION_FAILED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix)
            FIX_MODE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; VALIDATION_FAILED=true; }

echo "============================================================================"
echo "  ApplyForUs Identity Validation"
echo "  Environment: $ENVIRONMENT"
echo "============================================================================"
echo ""

# ============================================================================
# Prerequisites Check
# ============================================================================
log_info "Checking prerequisites..."

if ! command -v az &> /dev/null; then
    log_error "Azure CLI not installed"
    exit 1
fi

if ! az account show > /dev/null 2>&1; then
    log_error "Azure CLI not authenticated. Run: az login"
    exit 1
fi

log_success "Azure CLI authenticated"

# Get current tenant info
TENANT_ID=$(az account show --query 'tenantId' -o tsv)
log_info "Tenant ID: $TENANT_ID"

echo ""

# ============================================================================
# 1. App Registration Validation
# ============================================================================
log_info "Validating App Registrations..."

check_app_registration() {
    local display_name=$1
    local expected_name="applyforus-$ENVIRONMENT-$display_name"

    local app_info
    app_info=$(az ad app list --display-name "$expected_name" --query '[0]' -o json 2>/dev/null)

    if [ "$app_info" != "null" ] && [ -n "$app_info" ]; then
        local app_id
        app_id=$(echo "$app_info" | jq -r '.appId')
        log_success "App registration exists: $expected_name (ID: $app_id)"

        # Check for client secrets
        local secret_count
        secret_count=$(az ad app credential list --id "$app_id" --query 'length(@)' -o tsv 2>/dev/null || echo "0")
        if [ "$secret_count" -gt 0 ]; then
            log_success "  - Has $secret_count client secret(s)"
        else
            log_warning "  - No client secrets configured"
        fi

        return 0
    else
        log_error "App registration not found: $expected_name"
        return 1
    fi
}

# Check required app registrations
check_app_registration "web" || true
check_app_registration "api" || true
check_app_registration "automation" || true

echo ""

# ============================================================================
# 2. Security Groups Validation
# ============================================================================
log_info "Validating Security Groups..."

SUBSCRIPTION_TIERS=("freemium" "starter" "basic" "professional" "advanced_career" "executive_elite")
SPECIAL_GROUPS=("verified" "support" "admin" "super_admin" "suspended")

check_security_group() {
    local group_type=$1
    local group_name="applyforus-$group_type-$ENVIRONMENT"

    local group_info
    group_info=$(az ad group list --display-name "$group_name" --query '[0]' -o json 2>/dev/null)

    if [ "$group_info" != "null" ] && [ -n "$group_info" ]; then
        local group_id
        group_id=$(echo "$group_info" | jq -r '.id')
        local member_count
        member_count=$(az ad group member list --group "$group_id" --query 'length(@)' -o tsv 2>/dev/null || echo "0")
        log_success "Group exists: $group_name (ID: $group_id, Members: $member_count)"
        return 0
    else
        log_error "Group not found: $group_name"
        return 1
    fi
}

# Check subscription tier groups
log_info "Checking subscription tier groups..."
for tier in "${SUBSCRIPTION_TIERS[@]}"; do
    check_security_group "$tier" || true
done

echo ""

# Check special groups
log_info "Checking special groups..."
for group in "${SPECIAL_GROUPS[@]}"; do
    check_security_group "$group" || true
done

echo ""

# ============================================================================
# 3. Service Principal Validation
# ============================================================================
log_info "Validating Service Principals..."

check_service_principal() {
    local app_name=$1
    local expected_name="applyforus-$ENVIRONMENT-$app_name"

    local sp_info
    sp_info=$(az ad sp list --display-name "$expected_name" --query '[0]' -o json 2>/dev/null)

    if [ "$sp_info" != "null" ] && [ -n "$sp_info" ]; then
        local sp_id
        sp_id=$(echo "$sp_info" | jq -r '.appId')
        log_success "Service principal exists: $expected_name"
        return 0
    else
        log_error "Service principal not found: $expected_name"
        return 1
    fi
}

check_service_principal "api" || true
check_service_principal "automation" || true

echo ""

# ============================================================================
# 4. Graph API Permissions Validation
# ============================================================================
log_info "Validating Graph API Permissions (for automation app)..."

AUTOMATION_APP_NAME="applyforus-$ENVIRONMENT-automation"
AUTOMATION_APP_ID=$(az ad app list --display-name "$AUTOMATION_APP_NAME" --query '[0].appId' -o tsv 2>/dev/null)

if [ -n "$AUTOMATION_APP_ID" ] && [ "$AUTOMATION_APP_ID" != "null" ]; then
    # Get required resource access
    REQUIRED_PERMISSIONS=$(az ad app show --id "$AUTOMATION_APP_ID" --query 'requiredResourceAccess' -o json 2>/dev/null)

    if [ "$REQUIRED_PERMISSIONS" != "[]" ]; then
        log_success "Graph API permissions configured"

        # Check for admin consent
        SP_ID=$(az ad sp list --display-name "$AUTOMATION_APP_NAME" --query '[0].id' -o tsv 2>/dev/null)
        if [ -n "$SP_ID" ]; then
            CONSENT_STATUS=$(az ad app permission list-grants --id "$AUTOMATION_APP_ID" --query 'length(@)' -o tsv 2>/dev/null || echo "0")
            if [ "$CONSENT_STATUS" -gt 0 ]; then
                log_success "Admin consent granted"
            else
                log_warning "Admin consent may not be granted - verify in Azure Portal"
            fi
        fi
    else
        log_warning "No Graph API permissions configured for automation app"
    fi
else
    log_warning "Automation app not found - skipping permission check"
fi

echo ""

# ============================================================================
# 5. Environment Variable Validation
# ============================================================================
log_info "Validating required environment variables..."

check_env_var() {
    local var_name=$1
    local var_value="${!var_name}"

    if [ -n "$var_value" ]; then
        # Mask the value for security
        local masked="${var_value:0:4}****"
        log_success "Environment variable set: $var_name ($masked)"
        return 0
    else
        log_warning "Environment variable not set: $var_name"
        return 1
    fi
}

REQUIRED_VARS=(
    "AZURE_AD_CLIENT_ID"
    "AZURE_AD_AUDIENCE"
    "AUTOMATION_CLIENT_ID"
    "AUTOMATION_TENANT_ID"
    "GROUP_ID_FREEMIUM"
    "GROUP_ID_SUSPENDED"
)

for var in "${REQUIRED_VARS[@]}"; do
    check_env_var "$var" || true
done

echo ""

# ============================================================================
# 6. Token Endpoint Validation
# ============================================================================
log_info "Validating OAuth token endpoints..."

check_token_endpoint() {
    local url=$1
    local name=$2

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)

    if [ "$response" = "200" ]; then
        log_success "Token endpoint accessible: $name"
        return 0
    else
        log_error "Token endpoint not accessible: $name (HTTP $response)"
        return 1
    fi
}

# Check OpenID configuration endpoint
OPENID_CONFIG_URL="https://login.microsoftonline.com/$TENANT_ID/v2.0/.well-known/openid-configuration"
check_token_endpoint "$OPENID_CONFIG_URL" "OpenID Configuration" || true

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "============================================================================"
if [ "$VALIDATION_FAILED" = true ]; then
    log_error "Identity validation completed with failures"
    echo -e "${RED}Some checks failed. Review the output above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  1. Run 'terraform apply' in infrastructure/terraform/modules/identity"
    echo "  2. Grant admin consent for Graph API permissions in Azure Portal"
    echo "  3. Set required environment variables from Terraform outputs"
    exit 1
else
    log_success "All identity validation checks passed"
    exit 0
fi
