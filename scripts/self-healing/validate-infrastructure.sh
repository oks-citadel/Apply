#!/bin/bash
# ============================================================================
# ApplyForUs Platform - Infrastructure Validation Script
# ============================================================================
# This script validates the infrastructure state and provides self-healing
# recommendations. Run this periodically or before deployments.
#
# Usage:
#   ./validate-infrastructure.sh [--fix] [--env dev|staging|prod]
#
# Options:
#   --fix       Attempt to auto-fix detected issues
#   --env       Target environment (default: dev)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-applyforus.com}"
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
        --env)
            ENVIRONMENT="$2"
            shift 2
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
echo "  ApplyForUs Infrastructure Validation"
echo "  Environment: $ENVIRONMENT"
echo "  Domain: $DOMAIN"
echo "  Fix Mode: $FIX_MODE"
echo "============================================================================"
echo ""

# ============================================================================
# 1. DNS Validation
# ============================================================================
log_info "Validating DNS configuration..."

check_dns_record() {
    local record=$1
    local expected_type=$2

    if host -t $expected_type $record > /dev/null 2>&1; then
        log_success "DNS $expected_type record exists: $record"
        return 0
    else
        log_error "DNS $expected_type record missing: $record"
        return 1
    fi
}

# Check main domain
if [ "$ENVIRONMENT" = "prod" ]; then
    check_dns_record "$DOMAIN" "A" || true
    check_dns_record "www.$DOMAIN" "CNAME" || true
    check_dns_record "api.$DOMAIN" "CNAME" || true
else
    check_dns_record "$ENVIRONMENT.$DOMAIN" "A" || true
    check_dns_record "api-$ENVIRONMENT.$DOMAIN" "CNAME" || true
fi

echo ""

# ============================================================================
# 2. TLS/SSL Validation
# ============================================================================
log_info "Validating TLS certificates..."

check_tls_certificate() {
    local domain=$1
    local result

    result=$(echo | timeout 5 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

    if [ $? -eq 0 ]; then
        local expiry
        expiry=$(echo "$result" | grep 'notAfter' | cut -d= -f2)
        local expiry_epoch
        expiry_epoch=$(date -d "$expiry" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$expiry" +%s 2>/dev/null)
        local now_epoch
        now_epoch=$(date +%s)
        local days_left
        days_left=$(( (expiry_epoch - now_epoch) / 86400 ))

        if [ $days_left -lt 7 ]; then
            log_error "TLS certificate expires in $days_left days: $domain"
        elif [ $days_left -lt 30 ]; then
            log_warning "TLS certificate expires in $days_left days: $domain"
        else
            log_success "TLS certificate valid ($days_left days): $domain"
        fi
    else
        log_error "Cannot validate TLS certificate: $domain"
    fi
}

if [ "$ENVIRONMENT" = "prod" ]; then
    check_tls_certificate "$DOMAIN" || true
    check_tls_certificate "api.$DOMAIN" || true
else
    check_tls_certificate "$ENVIRONMENT.$DOMAIN" || true
fi

echo ""

# ============================================================================
# 3. Azure Resource Validation
# ============================================================================
log_info "Validating Azure resources..."

# Check if Azure CLI is available and logged in
if command -v az &> /dev/null; then
    if az account show > /dev/null 2>&1; then
        log_success "Azure CLI authenticated"

        # Check resource group
        RG_NAME="applyforus-$ENVIRONMENT-rg"
        if az group show --name "$RG_NAME" > /dev/null 2>&1; then
            log_success "Resource group exists: $RG_NAME"
        else
            log_error "Resource group not found: $RG_NAME"
        fi

        # Check AKS cluster
        AKS_NAME="applyforus-$ENVIRONMENT-aks"
        if az aks show --name "$AKS_NAME" --resource-group "$RG_NAME" > /dev/null 2>&1; then
            log_success "AKS cluster exists: $AKS_NAME"

            # Check node pool health
            NODES_READY=$(az aks show --name "$AKS_NAME" --resource-group "$RG_NAME" --query 'powerState.code' -o tsv 2>/dev/null)
            if [ "$NODES_READY" = "Running" ]; then
                log_success "AKS cluster is running"
            else
                log_error "AKS cluster not running: $NODES_READY"
            fi
        else
            log_warning "AKS cluster not found: $AKS_NAME"
        fi

        # Check Container Registry
        ACR_NAME="applyforusacr"
        if az acr show --name "$ACR_NAME" > /dev/null 2>&1; then
            log_success "Container Registry exists: $ACR_NAME"
        else
            log_error "Container Registry not found: $ACR_NAME"
        fi

        # Check PostgreSQL
        PG_NAME="applyforus-postgres"
        if az postgres flexible-server show --name "$PG_NAME" --resource-group "$RG_NAME" > /dev/null 2>&1; then
            log_success "PostgreSQL server exists: $PG_NAME"
        else
            log_warning "PostgreSQL server not found: $PG_NAME (may use different naming)"
        fi

    else
        log_warning "Azure CLI not authenticated - skipping Azure resource checks"
    fi
else
    log_warning "Azure CLI not installed - skipping Azure resource checks"
fi

echo ""

# ============================================================================
# 4. Kubernetes Validation
# ============================================================================
log_info "Validating Kubernetes resources..."

if command -v kubectl &> /dev/null; then
    if kubectl cluster-info > /dev/null 2>&1; then
        log_success "Kubernetes cluster accessible"

        # Check namespace
        NAMESPACE="applyforus"
        if kubectl get namespace "$NAMESPACE" > /dev/null 2>&1; then
            log_success "Namespace exists: $NAMESPACE"
        else
            log_error "Namespace not found: $NAMESPACE"
            if [ "$FIX_MODE" = true ]; then
                log_info "Creating namespace: $NAMESPACE"
                kubectl create namespace "$NAMESPACE"
            fi
        fi

        # Check critical deployments
        CRITICAL_DEPLOYMENTS=("web-app" "auth-service" "user-service" "job-service" "api-gateway")
        for deploy in "${CRITICAL_DEPLOYMENTS[@]}"; do
            if kubectl get deployment "$deploy" -n "$NAMESPACE" > /dev/null 2>&1; then
                READY=$(kubectl get deployment "$deploy" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
                DESIRED=$(kubectl get deployment "$deploy" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
                if [ "$READY" = "$DESIRED" ]; then
                    log_success "Deployment healthy: $deploy ($READY/$DESIRED)"
                else
                    log_warning "Deployment unhealthy: $deploy ($READY/$DESIRED ready)"
                    if [ "$FIX_MODE" = true ]; then
                        log_info "Restarting deployment: $deploy"
                        kubectl rollout restart deployment "$deploy" -n "$NAMESPACE"
                    fi
                fi
            else
                log_warning "Deployment not found: $deploy"
            fi
        done

        # Check pod status
        FAILING_PODS=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded -o name 2>/dev/null | wc -l)
        if [ "$FAILING_PODS" -eq 0 ]; then
            log_success "All pods running or completed"
        else
            log_warning "$FAILING_PODS pod(s) not in Running/Succeeded state"
            if [ "$FIX_MODE" = true ]; then
                log_info "Showing failing pods:"
                kubectl get pods -n "$NAMESPACE" --field-selector=status.phase!=Running,status.phase!=Succeeded
            fi
        fi

        # Check ingress
        if kubectl get ingress -n "$NAMESPACE" > /dev/null 2>&1; then
            INGRESS_COUNT=$(kubectl get ingress -n "$NAMESPACE" -o name 2>/dev/null | wc -l)
            log_success "Ingress resources found: $INGRESS_COUNT"
        else
            log_warning "No ingress resources found"
        fi

    else
        log_warning "Kubernetes cluster not accessible - skipping K8s checks"
    fi
else
    log_warning "kubectl not installed - skipping Kubernetes checks"
fi

echo ""

# ============================================================================
# 5. Service Health Checks
# ============================================================================
log_info "Validating service health endpoints..."

check_health_endpoint() {
    local name=$1
    local url=$2

    local response
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)

    if [ "$response" = "200" ]; then
        log_success "Health check passed: $name"
        return 0
    else
        log_error "Health check failed: $name (HTTP $response)"
        return 1
    fi
}

if [ "$ENVIRONMENT" = "prod" ]; then
    BASE_URL="https://$DOMAIN"
    API_URL="https://api.$DOMAIN"
else
    BASE_URL="https://$ENVIRONMENT.$DOMAIN"
    API_URL="https://api-$ENVIRONMENT.$DOMAIN"
fi

check_health_endpoint "Web App" "$BASE_URL/api/health" || true
check_health_endpoint "Auth Service" "$API_URL/auth/health" || true
check_health_endpoint "User Service" "$API_URL/users/health" || true
check_health_endpoint "Job Service" "$API_URL/jobs/health" || true

echo ""

# ============================================================================
# Summary
# ============================================================================
echo "============================================================================"
if [ "$VALIDATION_FAILED" = true ]; then
    log_error "Validation completed with failures"
    echo -e "${RED}Some checks failed. Review the output above.${NC}"
    if [ "$FIX_MODE" = false ]; then
        echo -e "Run with ${YELLOW}--fix${NC} to attempt auto-remediation."
    fi
    exit 1
else
    log_success "All validation checks passed"
    exit 0
fi
