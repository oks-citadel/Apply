#!/bin/bash

# ============================================================================
# SSL/TLS Certificate Validation Script
# ============================================================================
# This script validates SSL/TLS certificates for the applyforus.com domain.
# It checks certificate validity, expiration, issuer, and configuration.
#
# Usage:
#   ./validate-ssl.sh [domain] [options]
#
# Options:
#   --check-k8s    Check Kubernetes certificate resources
#   --verbose      Show detailed output
#
# Examples:
#   ./validate-ssl.sh applyforus.com
#   ./validate-ssl.sh applyforus.com --check-k8s --verbose
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN="${1:-applyforus.com}"
CHECK_K8S=false
VERBOSE=false
EXIT_CODE=0

# Parse arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --check-k8s) CHECK_K8S=true; shift ;;
        --verbose) VERBOSE=true; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; EXIT_CODE=1; }
print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_info() { if [ "$VERBOSE" = true ]; then echo -e "${BLUE}ℹ${NC} $1"; fi; }

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 command not found. Please install it."
        exit 1
    fi
}

# ============================================================================
# Prerequisites
# ============================================================================

print_header "Prerequisites Check"
check_command "openssl"
check_command "curl"
if [ "$CHECK_K8S" = true ]; then
    check_command "kubectl"
fi
print_success "All required commands are available"

# ============================================================================
# SSL Certificate Validation
# ============================================================================

validate_cert() {
    local hostname=$1
    local port=${2:-443}

    print_header "SSL Certificate Validation: $hostname"

    # Connect to server and get certificate
    if ! timeout 10 bash -c "echo -n | openssl s_client -connect $hostname:$port -servername $hostname 2>/dev/null" > /tmp/ssl_cert_$$ 2>&1; then
        print_error "Cannot connect to $hostname:$port"
        return 1
    fi

    # Extract certificate details
    local issuer=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=//')
    local subject=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -subject 2>/dev/null | sed 's/subject=//')
    local not_before=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -startdate 2>/dev/null | sed 's/notBefore=//')
    local not_after=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
    local serial=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -serial 2>/dev/null | sed 's/serial=//')
    local fingerprint=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -fingerprint -sha256 2>/dev/null | sed 's/SHA256 Fingerprint=//')

    # Calculate days until expiration
    local expiry_epoch=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null)
    local current_epoch=$(date +%s)
    local days_left=$(( ($expiry_epoch - $current_epoch) / 86400 ))

    # Check issuer
    echo "Issuer:"
    if echo "$issuer" | grep -qi "let's encrypt"; then
        print_success "Let's Encrypt (trusted CA)"
        print_info "  $issuer"
    elif echo "$issuer" | grep -qi "fake"; then
        print_warning "Staging/Fake certificate (Let's Encrypt Staging)"
        print_info "  $issuer"
    else
        print_warning "Certificate from: $issuer"
    fi

    # Check subject
    echo ""
    echo "Subject:"
    print_info "  $subject"

    # Check validity period
    echo ""
    echo "Validity Period:"
    print_info "  Valid from: $not_before"
    print_info "  Valid until: $not_after"

    if [ $days_left -gt 30 ]; then
        print_success "Certificate valid for $days_left days"
    elif [ $days_left -gt 7 ]; then
        print_warning "Certificate expires in $days_left days (renewal recommended)"
    elif [ $days_left -gt 0 ]; then
        print_error "Certificate expires in $days_left days (urgent renewal needed)"
    else
        print_error "Certificate has EXPIRED!"
    fi

    # Check Subject Alternative Names
    echo ""
    echo "Subject Alternative Names (SAN):"
    local san=$(cat /tmp/ssl_cert_$$ | openssl x509 -noout -text 2>/dev/null | grep -A1 "Subject Alternative Name" | tail -1 | sed 's/DNS://g')
    if [ ! -z "$san" ]; then
        print_success "Certificate covers multiple domains:"
        echo "$san" | tr ',' '\n' | while read domain; do
            print_info "  • $(echo $domain | xargs)"
        done
    fi

    # Certificate details
    if [ "$VERBOSE" = true ]; then
        echo ""
        echo "Certificate Details:"
        print_info "  Serial: $serial"
        print_info "  Fingerprint: $fingerprint"
    fi

    # Check certificate chain
    echo ""
    echo "Certificate Chain:"
    local chain_valid=$(cat /tmp/ssl_cert_$$ | openssl s_client -showcerts -connect $hostname:$port -servername $hostname 2>&1 | grep -c "Verify return code: 0")
    if [ "$chain_valid" -gt 0 ]; then
        print_success "Certificate chain is valid"
    else
        print_error "Certificate chain validation failed"
    fi

    rm -f /tmp/ssl_cert_$$
}

# ============================================================================
# Protocol and Cipher Check
# ============================================================================

check_protocols() {
    local hostname=$1

    print_header "TLS Protocol and Cipher Support"

    # Check TLS 1.2
    if timeout 5 openssl s_client -connect $hostname:443 -tls1_2 -servername $hostname </dev/null 2>&1 | grep -q "Protocol.*TLSv1.2"; then
        print_success "TLS 1.2 supported"
    else
        print_warning "TLS 1.2 not supported or failed"
    fi

    # Check TLS 1.3
    if timeout 5 openssl s_client -connect $hostname:443 -tls1_3 -servername $hostname </dev/null 2>&1 | grep -q "Protocol.*TLSv1.3"; then
        print_success "TLS 1.3 supported (recommended)"
    else
        print_info "TLS 1.3 not supported (optional)"
    fi

    # Check for insecure protocols
    echo ""
    echo "Insecure Protocol Check:"
    if timeout 5 openssl s_client -connect $hostname:443 -ssl3 -servername $hostname </dev/null 2>&1 | grep -q "Protocol.*SSLv3"; then
        print_error "SSLv3 enabled (insecure - should be disabled)"
    else
        print_success "SSLv3 disabled (good)"
    fi

    if timeout 5 openssl s_client -connect $hostname:443 -tls1 -servername $hostname </dev/null 2>&1 | grep -q "Protocol.*TLSv1 "; then
        print_error "TLS 1.0 enabled (insecure - should be disabled)"
    else
        print_success "TLS 1.0 disabled (good)"
    fi

    if timeout 5 openssl s_client -connect $hostname:443 -tls1_1 -servername $hostname </dev/null 2>&1 | grep -q "Protocol.*TLSv1.1"; then
        print_error "TLS 1.1 enabled (insecure - should be disabled)"
    else
        print_success "TLS 1.1 disabled (good)"
    fi
}

# ============================================================================
# HTTPS Configuration Check
# ============================================================================

check_https_config() {
    local hostname=$1

    print_header "HTTPS Configuration Check"

    # Check HTTP redirect
    echo "HTTP to HTTPS Redirect:"
    local redirect=$(curl -s -o /dev/null -w "%{http_code}" http://$hostname 2>/dev/null)
    if [ "$redirect" = "301" ] || [ "$redirect" = "308" ]; then
        print_success "HTTP redirects to HTTPS (code: $redirect)"
    else
        print_warning "HTTP does not redirect to HTTPS (code: $redirect)"
    fi

    # Check HSTS
    echo ""
    echo "Security Headers:"
    local headers=$(curl -s -I https://$hostname 2>/dev/null)

    if echo "$headers" | grep -qi "strict-transport-security"; then
        print_success "HSTS (HTTP Strict Transport Security) enabled"
        local hsts=$(echo "$headers" | grep -i "strict-transport-security" | head -1)
        print_info "  $hsts"
    else
        print_warning "HSTS not enabled (recommended for production)"
    fi

    # Check other security headers
    if echo "$headers" | grep -qi "x-frame-options"; then
        print_success "X-Frame-Options header set"
    else
        print_warning "X-Frame-Options not set"
    fi

    if echo "$headers" | grep -qi "x-content-type-options"; then
        print_success "X-Content-Type-Options header set"
    else
        print_warning "X-Content-Type-Options not set"
    fi
}

# ============================================================================
# Kubernetes Certificate Check
# ============================================================================

check_k8s_certs() {
    print_header "Kubernetes Certificate Resources"

    # Check if kubectl is configured
    if ! kubectl cluster-info &> /dev/null; then
        print_warning "kubectl not configured or cluster not accessible"
        return 1
    fi

    # List certificates
    echo "Certificates in jobpilot namespace:"
    kubectl get certificate -n jobpilot -o wide 2>/dev/null || {
        print_warning "No certificates found or namespace doesn't exist"
        return 1
    }

    echo ""

    # Check each certificate
    for cert in $(kubectl get certificate -n jobpilot -o jsonpath='{.items[*].metadata.name}' 2>/dev/null); do
        echo "Certificate: $cert"

        local ready=$(kubectl get certificate $cert -n jobpilot -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)
        local reason=$(kubectl get certificate $cert -n jobpilot -o jsonpath='{.status.conditions[?(@.type=="Ready")].message}' 2>/dev/null)

        if [ "$ready" = "True" ]; then
            print_success "Certificate ready"
        else
            print_error "Certificate not ready: $reason"
        fi

        # Expiration
        local not_after=$(kubectl get certificate $cert -n jobpilot -o jsonpath='{.status.notAfter}' 2>/dev/null)
        if [ ! -z "$not_after" ]; then
            print_info "  Expires: $not_after"
        fi

        # Renewal time
        local renewal=$(kubectl get certificate $cert -n jobpilot -o jsonpath='{.status.renewalTime}' 2>/dev/null)
        if [ ! -z "$renewal" ]; then
            print_info "  Renewal at: $renewal"
        fi

        echo ""
    done

    # Check ClusterIssuers
    echo "ClusterIssuers:"
    kubectl get clusterissuer 2>/dev/null || {
        print_warning "No ClusterIssuers found"
    }

    # Check cert-manager
    echo ""
    echo "cert-manager Status:"
    local cm_pods=$(kubectl get pods -n cert-manager -l app=cert-manager -o jsonpath='{.items[*].status.phase}' 2>/dev/null)
    if echo "$cm_pods" | grep -q "Running"; then
        print_success "cert-manager is running"
    else
        print_error "cert-manager is not running properly"
    fi
}

# ============================================================================
# Main Execution
# ============================================================================

# Validate primary domain
validate_cert $DOMAIN

# Validate subdomains
for subdomain in www api staging; do
    echo ""
    if timeout 2 bash -c "curl -s -o /dev/null -w '' https://$subdomain.$DOMAIN 2>/dev/null"; then
        validate_cert "$subdomain.$DOMAIN"
    else
        print_info "Skipping $subdomain.$DOMAIN (not accessible)"
    fi
done

# Protocol and cipher checks
echo ""
check_protocols $DOMAIN

# HTTPS configuration
echo ""
check_https_config $DOMAIN

# Kubernetes checks
if [ "$CHECK_K8S" = true ]; then
    echo ""
    check_k8s_certs
fi

# ============================================================================
# Summary
# ============================================================================

print_header "Validation Summary"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ All SSL/TLS checks passed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ Some SSL/TLS checks failed. Please review the output.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "For detailed SSL analysis, visit:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""

exit $EXIT_CODE
