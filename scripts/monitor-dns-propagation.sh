#!/bin/bash

# ============================================================================
# DNS Propagation Monitoring Script
# ============================================================================
# Monitors DNS propagation across multiple global DNS servers
# Useful during DNS migration to track propagation status
#
# Usage:
#   ./monitor-dns-propagation.sh <domain> [interval]
#
# Arguments:
#   domain   - Domain name to monitor (e.g., applyforus.com)
#   interval - Check interval in seconds (default: 60)
#
# Example:
#   ./monitor-dns-propagation.sh applyforus.com 30
# ============================================================================

set -e

# Configuration
DOMAIN="${1:-applyforus.com}"
INTERVAL="${2:-60}"
LOG_FILE="dns-propagation-$(date +%Y%m%d-%H%M%S).log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# DNS Servers to check (global coverage)
declare -A DNS_SERVERS=(
    # Major Public DNS Providers
    ["Google-1"]="8.8.8.8"
    ["Google-2"]="8.8.4.4"
    ["Cloudflare-1"]="1.1.1.1"
    ["Cloudflare-2"]="1.0.0.1"
    ["Quad9"]="9.9.9.9"
    ["OpenDNS-1"]="208.67.222.222"
    ["OpenDNS-2"]="208.67.220.220"

    # Regional DNS Servers
    ["Comodo"]="8.26.56.26"
    ["Level3"]="4.2.2.1"
    ["Verisign"]="64.6.64.6"
)

# ============================================================================
# Helper Functions
# ============================================================================

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

print_header() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}  $1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

check_dns() {
    local server=$1
    local server_ip=$2

    # Query with timeout
    local result=$(timeout 5 dig @$server_ip $DOMAIN +short A 2>/dev/null | head -1)

    if [ -z "$result" ]; then
        echo "TIMEOUT"
    else
        echo "$result"
    fi
}

# ============================================================================
# Main Monitoring Loop
# ============================================================================

print_header "DNS Propagation Monitor - $DOMAIN"

log "Starting DNS propagation monitoring"
log "Domain: $DOMAIN"
log "Check interval: ${INTERVAL}s"
log "Log file: $LOG_FILE"
log ""

# Get expected IP (from Azure nameserver)
EXPECTED_IP=""
if command -v az &> /dev/null; then
    # Try to get from Azure DNS
    AZURE_NS=$(az network dns zone show \
        --name $DOMAIN \
        --resource-group $(az network dns zone list --query "[?name=='$DOMAIN'].resourceGroup" -o tsv 2>/dev/null) \
        --query "nameServers[0]" -o tsv 2>/dev/null)

    if [ ! -z "$AZURE_NS" ]; then
        EXPECTED_IP=$(dig @$AZURE_NS $DOMAIN +short A 2>/dev/null | head -1)
        log "Expected IP (from Azure DNS): $EXPECTED_IP"
    fi
fi

if [ -z "$EXPECTED_IP" ]; then
    log "Warning: Could not determine expected IP from Azure DNS"
    log "Will show all results without comparison"
fi

# Statistics tracking
declare -A IP_COUNTS
declare -A LAST_SEEN
ITERATION=0

# Continuous monitoring
while true; do
    ITERATION=$((ITERATION + 1))
    CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

    echo "" | tee -a "$LOG_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
    echo "Iteration #$ITERATION - $CURRENT_TIME" | tee -a "$LOG_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"

    # Reset counts for this iteration
    for ip in "${IP_COUNTS[@]}"; do
        IP_COUNTS[$ip]=0
    done

    # Check each DNS server
    TOTAL_SERVERS=0
    PROPAGATED_SERVERS=0
    TIMEOUT_SERVERS=0

    for name in "${!DNS_SERVERS[@]}"; do
        server_ip=${DNS_SERVERS[$name]}
        TOTAL_SERVERS=$((TOTAL_SERVERS + 1))

        result=$(check_dns "$name" "$server_ip")

        if [ "$result" = "TIMEOUT" ]; then
            printf "%-20s %-16s %s\n" "$name" "$server_ip" "TIMEOUT" | tee -a "$LOG_FILE"
            TIMEOUT_SERVERS=$((TIMEOUT_SERVERS + 1))
        else
            # Track IP counts
            IP_COUNTS[$result]=$((${IP_COUNTS[$result]:-0} + 1))
            LAST_SEEN[$result]="$CURRENT_TIME"

            # Color code based on expected IP
            if [ ! -z "$EXPECTED_IP" ] && [ "$result" = "$EXPECTED_IP" ]; then
                printf "${GREEN}%-20s %-16s → %-16s ✓${NC}\n" "$name" "$server_ip" "$result" | tee -a "$LOG_FILE"
                PROPAGATED_SERVERS=$((PROPAGATED_SERVERS + 1))
            elif [ ! -z "$EXPECTED_IP" ]; then
                printf "${YELLOW}%-20s %-16s → %-16s ⚠${NC}\n" "$name" "$server_ip" "$result" | tee -a "$LOG_FILE"
            else
                printf "%-20s %-16s → %-16s\n" "$name" "$server_ip" "$result" | tee -a "$LOG_FILE"
            fi
        fi
    done

    # Print summary
    echo "" | tee -a "$LOG_FILE"
    echo "Summary:" | tee -a "$LOG_FILE"
    echo "  Total DNS servers checked: $TOTAL_SERVERS" | tee -a "$LOG_FILE"

    if [ ! -z "$EXPECTED_IP" ]; then
        PERCENTAGE=$((PROPAGATED_SERVERS * 100 / TOTAL_SERVERS))
        echo "  Propagated to expected IP: $PROPAGATED_SERVERS ($PERCENTAGE%)" | tee -a "$LOG_FILE"

        if [ $PERCENTAGE -eq 100 ]; then
            echo -e "${GREEN}  ✓ DNS fully propagated!${NC}" | tee -a "$LOG_FILE"
        elif [ $PERCENTAGE -ge 80 ]; then
            echo -e "${GREEN}  Nearly complete propagation${NC}" | tee -a "$LOG_FILE"
        elif [ $PERCENTAGE -ge 50 ]; then
            echo -e "${YELLOW}  Propagation in progress (50%+)${NC}" | tee -a "$LOG_FILE"
        else
            echo -e "${YELLOW}  Early stage propagation${NC}" | tee -a "$LOG_FILE"
        fi
    fi

    if [ $TIMEOUT_SERVERS -gt 0 ]; then
        echo "  Timeouts: $TIMEOUT_SERVERS" | tee -a "$LOG_FILE"
    fi

    # Show unique IPs seen
    echo "" | tee -a "$LOG_FILE"
    echo "Unique IP addresses reported:" | tee -a "$LOG_FILE"
    for ip in "${!IP_COUNTS[@]}"; do
        count=${IP_COUNTS[$ip]}
        last_seen=${LAST_SEEN[$ip]}
        if [ $count -gt 0 ]; then
            printf "  %-16s reported by %2d servers (last: %s)\n" "$ip" "$count" "$last_seen" | tee -a "$LOG_FILE"
        fi
    done

    # Check if fully propagated
    if [ ! -z "$EXPECTED_IP" ] && [ $PROPAGATED_SERVERS -eq $TOTAL_SERVERS ]; then
        echo "" | tee -a "$LOG_FILE"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
        echo -e "${GREEN}  ✓ DNS FULLY PROPAGATED!${NC}" | tee -a "$LOG_FILE"
        echo -e "${GREEN}  All checked DNS servers now resolve to $EXPECTED_IP${NC}" | tee -a "$LOG_FILE"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}" | tee -a "$LOG_FILE"
        log ""
        log "Monitoring complete after $ITERATION iterations"
        log "Full propagation achieved at: $CURRENT_TIME"
        exit 0
    fi

    # Wait before next check
    echo "" | tee -a "$LOG_FILE"
    echo "Next check in ${INTERVAL}s... (Press Ctrl+C to stop)" | tee -a "$LOG_FILE"
    sleep $INTERVAL
done
