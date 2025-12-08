#!/bin/bash

# ============================================================================
# DNS Validation Script - ApplyforUs Platform
# ============================================================================
# This script validates DNS configuration for the applyforus.com domain.
# It checks:
# - DNS record existence and correctness
# - SSL certificate validity
# - DNS propagation status
# - Application health endpoints
#
# Usage:
#   ./validate-dns.sh [domain] [options]
#
# Options:
#   --azure-ns    Test against Azure nameservers directly
#   --verbose     Show detailed output
#   --check-ssl   Validate SSL certificates
#   --check-app   Test application endpoints
#
# Examples:
#   ./validate-dns.sh applyforus.com
#   ./validate-dns.sh applyforus.com --azure-ns --verbose
#   ./validate-dns.sh applyforus.com --check-ssl --check-app
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
DOMAIN="${1:-applyforus.com}"
USE_AZURE_NS=false
VERBOSE=false
CHECK_SSL=false
CHECK_APP=false
EXIT_CODE=0

# Azure DNS nameservers (will be detected if not set)
AZURE_NS=""

# Parse command line arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --azure-ns)
            USE_AZURE_NS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --check-ssl)
            CHECK_SSL=true
            shift
            ;;
        --check-app)
            CHECK_APP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    EXIT_CODE=1
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}ℹ${NC} $1"
    fi
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 command not found. Please install it."
        exit 1
    fi
}

get_azure_nameserver() {
    # Try to get Azure nameserver from Azure DNS zone
    if command -v az &> /dev/null; then
        local ns=$(az network dns zone show \
            --name $DOMAIN \
            --resource-group $(az network dns zone list --query "[?name=='$DOMAIN'].resourceGroup" -o tsv 2>/dev/null) \
            --query "nameServers[0]" -o tsv 2>/dev/null)

        if [ ! -z "$ns" ]; then
            echo "$ns"
            return 0
        fi
    fi

    # Fallback: query current NS records
    local ns=$(dig NS $DOMAIN +short | grep azure-dns | head -1)
    if [ ! -z "$ns" ]; then
        echo "$ns"
        return 0
    fi

    return 1
}

dns_query() {
    local record_type=$1
    local hostname=$2
    local nameserver=$3

    if [ -z "$nameserver" ]; then
        dig $hostname $record_type +short
    else
        dig @$nameserver $hostname $record_type +short
    fi
}

# ============================================================================
# Prerequisite Checks
# ============================================================================

print_header "Prerequisites Check"

check_command "dig"
check_command "curl"

if [ "$CHECK_SSL" = true ]; then
    check_command "openssl"
fi

print_success "All required commands are available"

# ============================================================================
# DNS Configuration
# ============================================================================

print_header "DNS Configuration for $DOMAIN"

# Determine which nameserver to use
NS_ARG=""
if [ "$USE_AZURE_NS" = true ]; then
    AZURE_NS=$(get_azure_nameserver)
    if [ -z "$AZURE_NS" ]; then
        print_error "Could not determine Azure nameserver"
        exit 1
    fi
    NS_ARG=$AZURE_NS
    print_info "Using Azure nameserver: $AZURE_NS"
else
    print_info "Using system DNS resolver"
fi

# ============================================================================
# Nameserver Check
# ============================================================================

print_header "Nameserver Configuration"

NS_RECORDS=$(dns_query NS $DOMAIN "$NS_ARG")

if [ -z "$NS_RECORDS" ]; then
    print_error "No nameserver records found for $DOMAIN"
else
    if echo "$NS_RECORDS" | grep -q "azure-dns"; then
        print_success "Domain is using Azure DNS"
        echo "$NS_RECORDS" | while read ns; do
            print_info "  • $ns"
        done
    else
        print_warning "Domain is not using Azure DNS yet"
        echo "$NS_RECORDS" | while read ns; do
            print_info "  • $ns"
        done
    fi
fi

# ============================================================================
# A Record Checks
# ============================================================================

print_header "A Record Validation"

# Root domain
ROOT_IP=$(dns_query A $DOMAIN "$NS_ARG")
if [ -z "$ROOT_IP" ]; then
    print_error "No A record found for $DOMAIN"
else
    print_success "$DOMAIN → $ROOT_IP"
fi

# WWW subdomain (should be CNAME or A record)
WWW_RESULT=$(dns_query A www.$DOMAIN "$NS_ARG")
if [ -z "$WWW_RESULT" ]; then
    print_error "No A record resolution for www.$DOMAIN"
else
    print_success "www.$DOMAIN → $WWW_RESULT"
    if [ "$WWW_RESULT" = "$ROOT_IP" ]; then
        print_info "  WWW correctly points to same IP as root domain"
    fi
fi

# API subdomain
API_IP=$(dns_query A api.$DOMAIN "$NS_ARG")
if [ -z "$API_IP" ]; then
    print_error "No A record found for api.$DOMAIN"
else
    print_success "api.$DOMAIN → $API_IP"
    if [ "$API_IP" = "$ROOT_IP" ]; then
        print_info "  API using same IP as root domain (expected for shared ingress)"
    fi
fi

# Staging subdomain
STAGING_IP=$(dns_query A staging.$DOMAIN "$NS_ARG")
if [ -z "$STAGING_IP" ]; then
    print_warning "No A record found for staging.$DOMAIN (may not be configured)"
else
    print_success "staging.$DOMAIN → $STAGING_IP"
fi

# ============================================================================
# CNAME Record Checks
# ============================================================================

print_header "CNAME Record Validation"

WWW_CNAME=$(dns_query CNAME www.$DOMAIN "$NS_ARG")
if [ -z "$WWW_CNAME" ]; then
    print_info "www.$DOMAIN uses A record instead of CNAME (acceptable)"
else
    if [ "$WWW_CNAME" = "$DOMAIN." ] || [ "$WWW_CNAME" = "$DOMAIN" ]; then
        print_success "www.$DOMAIN → $WWW_CNAME (CNAME)"
    else
        print_warning "www.$DOMAIN → $WWW_CNAME (unexpected target)"
    fi
fi

# ============================================================================
# TXT Record Checks
# ============================================================================

print_header "TXT Record Validation"

TXT_RECORDS=$(dns_query TXT $DOMAIN "$NS_ARG")
if [ -z "$TXT_RECORDS" ]; then
    print_warning "No TXT records found (may not be needed)"
else
    print_success "TXT records found:"
    echo "$TXT_RECORDS" | while read txt; do
        print_info "  • $txt"
    done
fi

# Check ACME challenge record
ACME_TXT=$(dns_query TXT _acme-challenge.$DOMAIN "$NS_ARG")
if [ ! -z "$ACME_TXT" ]; then
    print_success "ACME challenge TXT record exists"
    print_info "  • $ACME_TXT"
fi

# ============================================================================
# CAA Record Checks
# ============================================================================

print_header "CAA Record Validation (Certificate Authority Authorization)"

CAA_RECORDS=$(dns_query CAA $DOMAIN "$NS_ARG")
if [ -z "$CAA_RECORDS" ]; then
    print_warning "No CAA records found (recommended for security)"
else
    if echo "$CAA_RECORDS" | grep -q "letsencrypt"; then
        print_success "CAA records permit Let's Encrypt certificates"
        echo "$CAA_RECORDS" | while read caa; do
            print_info "  • $caa"
        done
    else
        print_warning "CAA records found but may not include Let's Encrypt"
        echo "$CAA_RECORDS" | while read caa; do
            print_info "  • $caa"
        done
    fi
fi

# ============================================================================
# MX Record Checks
# ============================================================================

print_header "MX Record Validation (Email)"

MX_RECORDS=$(dns_query MX $DOMAIN "$NS_ARG")
if [ -z "$MX_RECORDS" ]; then
    print_info "No MX records found (email not configured)"
else
    print_success "MX records found:"
    echo "$MX_RECORDS" | while read mx; do
        print_info "  • $mx"
    done
fi

# ============================================================================
# DNS Propagation Check
# ============================================================================

if [ "$USE_AZURE_NS" = false ]; then
    print_header "DNS Propagation Check (Multiple Resolvers)"

    # Test with different public DNS servers
    declare -A DNS_SERVERS=(
        ["Google"]="8.8.8.8"
        ["Cloudflare"]="1.1.1.1"
        ["OpenDNS"]="208.67.222.222"
        ["Quad9"]="9.9.9.9"
    )

    for name in "${!DNS_SERVERS[@]}"; do
        server=${DNS_SERVERS[$name]}
        result=$(dig @$server $DOMAIN +short 2>/dev/null | head -1)

        if [ -z "$result" ]; then
            print_warning "$name DNS ($server): No result"
        elif [ "$result" = "$ROOT_IP" ]; then
            print_success "$name DNS ($server): $result ✓"
        else
            print_warning "$name DNS ($server): $result (differs from expected $ROOT_IP)"
        fi
    done
fi

# ============================================================================
# SSL Certificate Validation
# ============================================================================

if [ "$CHECK_SSL" = true ]; then
    print_header "SSL Certificate Validation"

    check_ssl_cert() {
        local hostname=$1
        local port=${2:-443}

        if ! timeout 5 bash -c "echo -n | openssl s_client -connect $hostname:$port -servername $hostname 2>/dev/null" > /tmp/ssl_check_$$ 2>&1; then
            print_error "Cannot connect to $hostname:$port"
            return 1
        fi

        # Extract certificate info
        local issuer=$(cat /tmp/ssl_check_$$ | openssl x509 -noout -issuer 2>/dev/null | sed 's/issuer=//')
        local subject=$(cat /tmp/ssl_check_$$ | openssl x509 -noout -subject 2>/dev/null | sed 's/subject=//')
        local not_after=$(cat /tmp/ssl_check_$$ | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
        local days_left=$(cat /tmp/ssl_check_$$ | openssl x509 -noout -checkend 0 2>/dev/null && echo "Valid" || echo "Expired")

        rm -f /tmp/ssl_check_$$

        if echo "$issuer" | grep -qi "let's encrypt"; then
            print_success "$hostname has valid Let's Encrypt certificate"
            print_info "  Subject: $subject"
            print_info "  Expires: $not_after"
        else
            print_warning "$hostname has certificate from: $issuer"
            print_info "  Subject: $subject"
            print_info "  Expires: $not_after"
        fi
    }

    # Check certificates for all domains
    if [ ! -z "$ROOT_IP" ]; then
        check_ssl_cert $DOMAIN
        check_ssl_cert www.$DOMAIN
        check_ssl_cert api.$DOMAIN

        if [ ! -z "$STAGING_IP" ]; then
            check_ssl_cert staging.$DOMAIN
        fi
    else
        print_warning "Skipping SSL checks - no IP addresses resolved"
    fi
fi

# ============================================================================
# Application Health Checks
# ============================================================================

if [ "$CHECK_APP" = true ]; then
    print_header "Application Health Check"

    check_endpoint() {
        local url=$1
        local expected_code=${2:-200}

        local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)

        if [ "$response" = "$expected_code" ]; then
            print_success "$url → HTTP $response ✓"
        elif [ -z "$response" ]; then
            print_error "$url → Connection failed"
        else
            print_warning "$url → HTTP $response (expected $expected_code)"
        fi
    }

    # Check main website
    check_endpoint "https://$DOMAIN" 200
    check_endpoint "https://www.$DOMAIN" 200

    # Check API health endpoints
    check_endpoint "https://api.$DOMAIN/api/health" 200
    check_endpoint "https://api.$DOMAIN/api/auth/health" 200

    # Check staging if configured
    if [ ! -z "$STAGING_IP" ]; then
        check_endpoint "https://staging.$DOMAIN" 200
    fi
fi

# ============================================================================
# Summary
# ============================================================================

print_header "Validation Summary"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  ✓ All DNS checks passed successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ✗ Some DNS checks failed. Please review the output above.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
fi

echo ""
echo "DNS Configuration Summary for $DOMAIN:"
echo "  Root Domain:   $ROOT_IP"
echo "  WWW Subdomain: $WWW_RESULT"
echo "  API Subdomain: $API_IP"
echo "  Staging:       ${STAGING_IP:-Not configured}"
echo ""

if [ "$USE_AZURE_NS" = true ]; then
    echo "Note: Tested against Azure nameserver directly ($AZURE_NS)"
    echo "      To test with public DNS, run without --azure-ns flag"
else
    echo "Note: Tested using system DNS resolver"
    echo "      To test Azure DNS directly, run with --azure-ns flag"
fi

echo ""

exit $EXIT_CODE
