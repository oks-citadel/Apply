# DNS Migration Guide: GoDaddy to Azure DNS

This guide provides step-by-step instructions for migrating the `applyforus.com` domain from GoDaddy DNS to Azure DNS for the JobPilot platform deployment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Migration Strategy](#migration-strategy)
- [Phase 1: Preparation](#phase-1-preparation)
- [Phase 2: Azure DNS Setup](#phase-2-azure-dns-setup)
- [Phase 3: Record Migration](#phase-3-record-migration)
- [Phase 4: Testing](#phase-4-testing)
- [Phase 5: Nameserver Update](#phase-5-nameserver-update)
- [Phase 6: Verification](#phase-6-verification)
- [Rollback Procedure](#rollback-procedure)
- [Troubleshooting](#troubleshooting)

## Overview

**Domain**: applyforus.com
**Current DNS Provider**: GoDaddy
**Target DNS Provider**: Azure DNS
**Estimated Migration Time**: 24-48 hours (including DNS propagation)
**Downtime**: Zero (if properly executed)

### Why Migrate to Azure DNS?

1. **Integration**: Native integration with Azure resources
2. **Automation**: Infrastructure as Code with Terraform
3. **Performance**: Global anycast network with low latency
4. **Security**: DDoS protection and Azure security features
5. **Management**: Centralized management with Azure Portal/CLI
6. **Cost**: Competitive pricing with Azure ecosystem benefits

## Prerequisites

### Required Access

- [x] **GoDaddy Account**: Admin access to applyforus.com domain
- [x] **Azure Subscription**: Contributor or Owner role
- [x] **Terraform**: Version 1.5.0 or higher
- [x] **Azure CLI**: Version 2.50.0 or higher
- [x] **Domain Tools**: dig, nslookup, or online DNS checkers

### Required Information

Before starting, gather:

1. **Current DNS Records**: Export all existing DNS records from GoDaddy
2. **Public IP Addresses**: AKS Ingress Controller or Application Gateway IPs
3. **Email Configuration**: Current MX records if using email
4. **Verification Codes**: Domain verification records for third-party services

### Pre-Migration Checklist

```bash
# 1. Document current DNS records
dig applyforus.com ANY +noall +answer
dig www.applyforus.com ANY +noall +answer

# 2. Test current DNS resolution
nslookup applyforus.com
nslookup www.applyforus.com

# 3. Verify Azure authentication
az login
az account show

# 4. Check Terraform installation
terraform version

# 5. Validate infrastructure is ready
kubectl get svc -n jobpilot
```

## Migration Strategy

### Migration Approach: Parallel DNS (Zero Downtime)

We'll use a parallel migration approach:

1. **Setup**: Create Azure DNS zone with all records
2. **Test**: Verify DNS resolution using Azure nameservers directly
3. **Switch**: Update nameservers at GoDaddy to point to Azure DNS
4. **Monitor**: Watch DNS propagation worldwide
5. **Cleanup**: Keep GoDaddy DNS for rollback period (7 days)

### Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Preparation | 1-2 hours | Document current setup, gather requirements |
| Azure DNS Setup | 30 minutes | Deploy Terraform DNS module |
| Record Migration | 1 hour | Configure all DNS records in Azure |
| Testing | 1 hour | Verify records using Azure nameservers |
| Nameserver Update | 15 minutes | Change nameservers at GoDaddy |
| DNS Propagation | 24-48 hours | Wait for global propagation |
| Verification | 1 hour | Test from multiple locations |
| **Total** | **2-4 days** | Including propagation time |

## Phase 1: Preparation

### Step 1.1: Export Current DNS Records from GoDaddy

1. **Login to GoDaddy**:
   - Navigate to https://dnsmanagement.godaddy.com/
   - Select domain: `applyforus.com`

2. **Document All Records**:

   Create a file: `current-dns-records.txt`

   ```
   # Current DNS Records for applyforus.com (from GoDaddy)
   # Exported: [DATE]

   # A Records
   @           A       [CURRENT_IP]    TTL: 600
   www         A       [CURRENT_IP]    TTL: 600
   api         A       [CURRENT_IP]    TTL: 600

   # CNAME Records
   (document any existing CNAMEs)

   # MX Records
   (document any mail server records)

   # TXT Records
   (document SPF, DMARC, verification records)

   # Other Records
   (document NS, SRV, etc.)
   ```

3. **Export from GoDaddy** (if available):
   - Go to DNS Management
   - Look for "Export" or "Download Zone File" option
   - Save as `godaddy-zone-file.txt`

### Step 1.2: Get Azure Infrastructure IPs

```bash
# Get AKS Ingress Controller Public IP
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# OR Get Application Gateway Public IP (if using App Gateway)
az network public-ip show \
  --resource-group jobpilot-prod-rg \
  --name appgw-public-ip \
  --query ipAddress \
  --output tsv

# Get Staging Environment IP (if applicable)
kubectl get svc -n staging-ingress ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

**Document the IPs**:
```bash
# Save these values for Terraform variables
PRODUCTION_IP="[YOUR_PRODUCTION_IP]"
STAGING_IP="[YOUR_STAGING_IP]"
```

### Step 1.3: Reduce DNS TTL Values (Optional but Recommended)

**Why**: Lower TTL allows faster propagation during migration.

1. Login to GoDaddy DNS Management
2. Set all record TTL values to **300 seconds (5 minutes)**
3. Wait for old TTL to expire before proceeding (wait current TTL duration)

**Example**: If current TTL is 3600 (1 hour), wait 1 hour after reducing TTL.

## Phase 2: Azure DNS Setup

### Step 2.1: Configure Terraform Variables

Create or update: `infrastructure/terraform/terraform.tfvars`

```hcl
# DNS Configuration
domain_name        = "applyforus.com"
ingress_public_ip  = "[PRODUCTION_IP_FROM_STEP_1.2]"
staging_public_ip  = "[STAGING_IP_FROM_STEP_1.2]"
enable_staging     = true

# Enable DNS module
enable_dns_zone = true

# Domain verification records (if any)
verification_records = [
  # Add any existing verification records from GoDaddy
  # "google-site-verification=abc123",
  # "MS=ms12345678"
]

# Email configuration (if applicable)
enable_mx_records = false  # Set to true if using email
mx_records = [
  # Configure if using email
  # {
  #   preference = 10
  #   exchange   = "mail.applyforus.com"
  # }
]
```

### Step 2.2: Add DNS Module to Terraform Configuration

Edit: `infrastructure/terraform/main.tf`

Add after the existing modules:

```hcl
# ============================================================================
# Module: Azure DNS
# ============================================================================

module "dns" {
  count  = var.enable_dns_zone ? 1 : 0
  source = "./modules/dns"

  resource_group_name = azurerm_resource_group.main.name
  domain_name         = var.domain_name
  ingress_public_ip   = var.ingress_public_ip

  enable_staging    = var.enable_staging
  staging_public_ip = var.staging_public_ip

  verification_records = var.verification_records

  enable_mx_records = var.enable_mx_records
  mx_records        = var.mx_records

  enable_diagnostics         = var.enable_diagnostics
  log_analytics_workspace_id = module.app_insights.log_analytics_workspace_id

  tags = local.common_tags

  depends_on = [
    module.app_insights
  ]
}
```

### Step 2.3: Add DNS Variables

Edit: `infrastructure/terraform/variables.tf`

Add these variables:

```hcl
# ============================================================================
# DNS Configuration Variables
# ============================================================================

variable "enable_dns_zone" {
  description = "Enable Azure DNS zone management"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name (e.g., applyforus.com)"
  type        = string
  default     = "applyforus.com"
}

variable "ingress_public_ip" {
  description = "Public IP address for ingress controller"
  type        = string
  default     = null
}

variable "staging_public_ip" {
  description = "Public IP address for staging environment"
  type        = string
  default     = null
}

variable "verification_records" {
  description = "Domain verification TXT records"
  type        = list(string)
  default     = []
}

variable "mx_records" {
  description = "MX records for email"
  type = list(object({
    preference = number
    exchange   = string
  }))
  default = []
}
```

### Step 2.4: Deploy Azure DNS Zone

```bash
# Navigate to Terraform directory
cd infrastructure/terraform

# Initialize Terraform (if not already done)
terraform init

# Plan the DNS module deployment
terraform plan -var-file="terraform.tfvars" -target=module.dns

# Review the plan carefully
# Verify all DNS records are correct

# Apply the DNS configuration
terraform apply -var-file="terraform.tfvars" -target=module.dns

# Save the nameservers output
terraform output -json | jq '.dns_configuration_summary'
```

**Expected Output**:
```json
{
  "domain": "applyforus.com",
  "nameservers": [
    "ns1-01.azure-dns.com.",
    "ns2-01.azure-dns.net.",
    "ns3-01.azure-dns.org.",
    "ns4-01.azure-dns.info."
  ],
  "root_domain": "20.123.45.67",
  "api_subdomain": "20.123.45.67",
  "staging_subdomain": "20.123.45.68"
}
```

**IMPORTANT**: Save these nameservers! You'll need them in Phase 5.

## Phase 3: Record Migration

### Step 3.1: Verify All Records Created

```bash
# Get Azure DNS nameservers
NAMESERVER=$(terraform output -raw dns_nameservers | jq -r '.[0]')

# Query Azure DNS directly (before nameserver change)
dig @$NAMESERVER applyforus.com
dig @$NAMESERVER www.applyforus.com
dig @$NAMESERVER api.applyforus.com
dig @$NAMESERVER staging.applyforus.com

# Verify TXT records
dig @$NAMESERVER applyforus.com TXT

# Verify CAA records
dig @$NAMESERVER applyforus.com CAA
```

### Step 3.2: Compare Records

Create a comparison script: `scripts/compare-dns.sh`

```bash
#!/bin/bash

DOMAIN="applyforus.com"
AZURE_NS="ns1-01.azure-dns.com"
GODADDY_NS=$(dig NS $DOMAIN +short | head -1)

echo "=== DNS Record Comparison ==="
echo "Domain: $DOMAIN"
echo "GoDaddy NS: $GODADDY_NS"
echo "Azure NS: $AZURE_NS"
echo ""

# Compare A records
echo "--- A Records (Root) ---"
echo "GoDaddy: $(dig @$GODADDY_NS $DOMAIN A +short)"
echo "Azure:   $(dig @$AZURE_NS $DOMAIN A +short)"
echo ""

echo "--- A Records (www) ---"
echo "GoDaddy: $(dig @$GODADDY_NS www.$DOMAIN A +short)"
echo "Azure:   $(dig @$AZURE_NS www.$DOMAIN A +short)"
echo ""

echo "--- A Records (api) ---"
echo "GoDaddy: $(dig @$GODADDY_NS api.$DOMAIN A +short)"
echo "Azure:   $(dig @$AZURE_NS api.$DOMAIN A +short)"
echo ""

# Compare TXT records
echo "--- TXT Records ---"
echo "GoDaddy:"
dig @$GODADDY_NS $DOMAIN TXT +short
echo "Azure:"
dig @$AZURE_NS $DOMAIN TXT +short
echo ""
```

Run the comparison:
```bash
chmod +x scripts/compare-dns.sh
./scripts/compare-dns.sh
```

### Step 3.3: Add Missing Records

If the comparison shows missing records:

```bash
# Edit terraform.tfvars to add missing records
# Then re-apply

terraform apply -var-file="terraform.tfvars" -target=module.dns
```

## Phase 4: Testing

### Step 4.1: Test DNS Resolution (Azure Nameservers)

```bash
# Test using Azure nameservers directly
AZURE_NS="ns1-01.azure-dns.com"

# Test root domain
dig @$AZURE_NS applyforus.com +short

# Test www subdomain
dig @$AZURE_NS www.applyforus.com +short

# Test API subdomain
dig @$AZURE_NS api.applyforus.com +short

# Test staging subdomain
dig @$AZURE_NS staging.applyforus.com +short

# Test CAA records (certificate authority)
dig @$AZURE_NS applyforus.com CAA +short
```

### Step 4.2: Test with Local Hosts File (Optional)

Test your application with the new IPs before DNS switch:

**Linux/Mac** (`/etc/hosts`):
```
20.123.45.67  applyforus.com
20.123.45.67  www.applyforus.com
20.123.45.67  api.applyforus.com
20.123.45.68  staging.applyforus.com
```

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):
```
20.123.45.67  applyforus.com
20.123.45.67  www.applyforus.com
20.123.45.67  api.applyforus.com
20.123.45.68  staging.applyforus.com
```

Test in browser:
- https://applyforus.com
- https://www.applyforus.com
- https://api.applyforus.com/api/health

**Remember to remove these entries after testing!**

### Step 4.3: Run Validation Script

```bash
# Run the DNS validation script
./scripts/validate-dns.sh applyforus.com

# Expected output: All checks should pass with Azure nameservers
```

## Phase 5: Nameserver Update

**WARNING**: This is the critical step. Double-check everything before proceeding!

### Step 5.1: Pre-Switch Checklist

- [ ] All DNS records verified in Azure DNS
- [ ] Application working with new IPs (tested via hosts file)
- [ ] SSL certificates ready (cert-manager deployed)
- [ ] Monitoring and alerts configured
- [ ] Team notified of migration
- [ ] Rollback plan documented
- [ ] TTL values reduced (from Step 1.3)

### Step 5.2: Update Nameservers at GoDaddy

**Timing**: Best done during low-traffic hours (e.g., 2-4 AM local time)

1. **Login to GoDaddy**:
   - Go to https://dnsmanagement.godaddy.com/
   - Select domain: `applyforus.com`

2. **Navigate to Nameservers**:
   - Click on "Nameservers" section
   - Click "Change" or "Manage"
   - Select "Custom Nameservers"

3. **Enter Azure DNS Nameservers**:

   From Terraform output, enter all 4 nameservers:
   ```
   ns1-01.azure-dns.com
   ns2-01.azure-dns.net
   ns3-01.azure-dns.org
   ns4-01.azure-dns.info
   ```

4. **Save Changes**:
   - Click "Save" or "Submit"
   - GoDaddy will show a warning about losing DNS management
   - Confirm the change

5. **Document the Change**:
   ```bash
   # Record the timestamp
   echo "Nameservers updated at: $(date)" >> migration-log.txt

   # Verify the change at GoDaddy
   # (May take 5-10 minutes to reflect in GoDaddy UI)
   ```

### Step 5.3: Monitor Initial Propagation

```bash
# Check if GoDaddy has propagated the NS change
dig NS applyforus.com +short

# Monitor DNS propagation globally
# Use online tools:
# - https://www.whatsmydns.net/
# - https://dnschecker.org/

# Local monitoring script
watch -n 30 'dig applyforus.com +short'
```

## Phase 6: Verification

### Step 6.1: DNS Propagation Monitoring (First 24 Hours)

```bash
# Run continuous monitoring
./scripts/monitor-dns-propagation.sh applyforus.com

# Expected timeline:
# - 5-10 minutes: GoDaddy updates NS records
# - 30-60 minutes: Major DNS resolvers start using Azure NS
# - 2-4 hours: Most DNS resolvers updated
# - 24-48 hours: Complete global propagation
```

### Step 6.2: Application Health Checks

```bash
# Test website
curl -I https://applyforus.com
curl -I https://www.applyforus.com

# Test API
curl https://api.applyforus.com/api/health

# Test staging
curl https://staging.applyforus.com/api/health

# Verify SSL certificates
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -dates

# Check certificate issuer (should be Let's Encrypt)
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer
```

### Step 6.3: Monitor Application Metrics

```bash
# Check Azure Application Insights
az monitor app-insights metrics show \
  --app jobpilot-prod-appinsights \
  --resource-group jobpilot-prod-rg \
  --metric requests/count \
  --aggregation count

# Check for increased error rates
kubectl logs -n jobpilot -l app=auth-service --tail=100

# Monitor DNS query logs in Azure
az monitor activity-log list \
  --resource-group jobpilot-prod-rg \
  --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')
```

### Step 6.4: Verify from Multiple Locations

**Online Tools**:
- https://www.whatsmydns.net/ - Check from 20+ locations worldwide
- https://dnschecker.org/ - DNS propagation checker
- https://www.dnswatch.info/ - Real-time DNS monitoring

**Manual Checks**:
```bash
# Check from different DNS servers
dig @8.8.8.8 applyforus.com +short        # Google DNS
dig @1.1.1.1 applyforus.com +short        # Cloudflare DNS
dig @208.67.222.222 applyforus.com +short # OpenDNS

# All should return the new IP address
```

### Step 6.5: SSL Certificate Verification

```bash
# Check cert-manager certificate status
kubectl get certificate -n jobpilot

# Expected output:
# NAME                   READY   SECRET                AGE
# applyforus-tls-cert    True    applyforus-tls-cert   5m

# Check certificate details
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Verify Let's Encrypt issued the certificate
kubectl get secret applyforus-tls-cert -n jobpilot -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -text | grep Issuer
```

## Rollback Procedure

If issues occur during migration, you can rollback:

### Immediate Rollback (Within 48 Hours)

1. **Revert Nameservers at GoDaddy**:
   - Login to GoDaddy DNS Management
   - Change nameservers back to GoDaddy defaults:
     ```
     ns01.domaincontrol.com
     ns02.domaincontrol.com
     ```
   - Wait for propagation (5-30 minutes)

2. **Verify Rollback**:
   ```bash
   dig NS applyforus.com +short
   # Should show GoDaddy nameservers

   dig applyforus.com +short
   # Should show old IP address
   ```

3. **Monitor Application**:
   - Check application availability
   - Monitor error logs
   - Verify SSL certificates

### Delayed Rollback (After 48 Hours)

If you kept GoDaddy DNS records:

1. **Re-sync GoDaddy DNS Records**:
   - Ensure GoDaddy has all current records
   - Update any IPs that changed

2. **Switch Nameservers**:
   - Follow immediate rollback procedure above

3. **Clean Up Azure DNS**:
   ```bash
   # Disable DNS module in Terraform
   terraform apply -var="enable_dns_zone=false"
   ```

## Troubleshooting

### Issue: DNS Not Resolving After Nameserver Change

**Symptoms**: Domain not resolving or resolving to old IP

**Diagnosis**:
```bash
# Check what nameservers are being reported
dig NS applyforus.com +trace

# Check DNS cache
sudo systemd-resolve --flush-caches  # Linux
sudo dscacheutil -flushcache         # Mac
ipconfig /flushdns                   # Windows

# Query Azure nameservers directly
dig @ns1-01.azure-dns.com applyforus.com
```

**Solutions**:
1. Wait for DNS propagation (can take 24-48 hours)
2. Clear local DNS cache
3. Try different DNS servers (Google: 8.8.8.8, Cloudflare: 1.1.1.1)
4. Verify nameservers are correctly configured at GoDaddy

### Issue: SSL Certificate Not Working

**Symptoms**: Browser shows "Not Secure" or certificate errors

**Diagnosis**:
```bash
# Check certificate status
kubectl get certificate -n jobpilot

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager

# Describe certificate
kubectl describe certificate applyforus-tls-cert -n jobpilot
```

**Solutions**:
1. Wait for cert-manager to issue certificate (5-10 minutes)
2. Check ACME challenge can be completed:
   ```bash
   curl http://applyforus.com/.well-known/acme-challenge/test
   ```
3. Verify ingress is properly configured
4. Check ClusterIssuer configuration:
   ```bash
   kubectl describe clusterissuer letsencrypt-prod
   ```

### Issue: Some Users Still See Old IP

**Symptoms**: Different users report different IPs

**Cause**: DNS caching at ISP level

**Solutions**:
1. This is normal during propagation
2. Wait for full propagation (24-48 hours)
3. Users can flush their local DNS cache
4. Users can temporarily use public DNS (8.8.8.8, 1.1.1.1)

### Issue: Email Stopped Working

**Symptoms**: Emails not being received

**Diagnosis**:
```bash
# Check MX records
dig MX applyforus.com +short

# Verify MX records in Azure DNS
az network dns record-set mx show \
  --resource-group jobpilot-prod-rg \
  --zone-name applyforus.com \
  --name @
```

**Solutions**:
1. Ensure MX records were migrated from GoDaddy
2. Update Terraform configuration with MX records
3. Re-apply DNS module:
   ```bash
   terraform apply -target=module.dns
   ```

### Issue: Terraform Apply Fails

**Error**: `Error creating DNS Zone: zones.Client#CreateOrUpdate`

**Solutions**:
```bash
# Check if DNS zone already exists
az network dns zone show \
  --resource-group jobpilot-prod-rg \
  --name applyforus.com

# If exists, import into Terraform state
terraform import 'module.dns[0].azurerm_dns_zone.main' \
  /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Network/dnszones/applyforus.com

# Then re-apply
terraform apply -target=module.dns
```

## Post-Migration Tasks

### Week 1: Monitoring

- [ ] Monitor DNS query logs daily
- [ ] Check SSL certificate renewal
- [ ] Monitor application error rates
- [ ] Verify email delivery (if applicable)
- [ ] Check from multiple geographic locations

### Week 2-4: Stabilization

- [ ] Increase DNS TTL values back to normal (3600 seconds)
- [ ] Remove hosts file entries from test machines
- [ ] Document any issues encountered
- [ ] Update DNS documentation

### Month 1: Optimization

- [ ] Review DNS query patterns in Azure Monitor
- [ ] Optimize TTL values based on change frequency
- [ ] Consider Azure Traffic Manager for multi-region
- [ ] Set up DNS health checks and alerts

### Ongoing: Maintenance

- [ ] Regular SSL certificate renewal monitoring
- [ ] DNS record audits quarterly
- [ ] Keep Terraform DNS module updated
- [ ] Document all DNS changes in version control

## DNS Record Reference

### Production Records (applyforus.com)

| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | @ | 20.123.45.67 | 300 | Root domain |
| A | api | 20.123.45.67 | 300 | API endpoint |
| CNAME | www | applyforus.com | 300 | WWW redirect |
| CAA | @ | 0 issue "letsencrypt.org" | 3600 | SSL authorization |
| CAA | @ | 0 issuewild "letsencrypt.org" | 3600 | Wildcard SSL |
| TXT | @ | Domain verification records | 300 | Verification |
| TXT | _acme-challenge | ACME validation | 300 | SSL validation |

### Staging Records (staging.applyforus.com)

| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| A | staging | 20.123.45.68 | 300 | Staging environment |

## Additional Resources

### Azure Documentation

- [Azure DNS Overview](https://docs.microsoft.com/en-us/azure/dns/dns-overview)
- [Azure DNS Zones and Records](https://docs.microsoft.com/en-us/azure/dns/dns-zones-records)
- [Delegate Domain to Azure DNS](https://docs.microsoft.com/en-us/azure/dns/dns-delegate-domain-azure-dns)

### Tools

- [WhatsMyDNS](https://www.whatsmydns.net/) - Global DNS propagation checker
- [DNSChecker](https://dnschecker.org/) - DNS record lookup tool
- [MXToolbox](https://mxtoolbox.com/) - DNS and email testing
- [SSLLabs](https://www.ssllabs.com/ssltest/) - SSL certificate testing

### Scripts

- `scripts/validate-dns.sh` - DNS validation script
- `scripts/monitor-dns-propagation.sh` - Propagation monitoring
- `scripts/compare-dns.sh` - Record comparison

## Support

If you encounter issues during migration:

1. **Check Troubleshooting section** above
2. **Review Azure DNS logs**: Azure Portal > DNS Zone > Logs
3. **Run validation script**: `./scripts/validate-dns.sh`
4. **Contact team**: devops@applyforus.com

## Migration Sign-Off

**Migration Completed By**: _______________
**Date**: _______________
**Verified By**: _______________
**Date**: _______________

**Nameserver Change Timestamp**: _______________
**DNS Fully Propagated**: _______________
**Application Verified**: _______________

**Notes**:
```
[Record any issues, solutions, or important observations here]
```

---

**Document Version**: 1.0
**Last Updated**: 2024-01-20
**Author**: DevOps Team
