# DNS Records Configuration for Production

This document details all DNS records required for the ApplyforUs platform in production.

## Overview

All DNS records are managed through Azure DNS and configured via Terraform. This document serves as a reference for the complete DNS configuration.

## A Records (IPv4 Addresses)

All A records point to the Application Gateway public IP address.

| Name | Type | TTL | Value | Purpose |
|------|------|-----|-------|---------|
| @ | A | 300 | [App Gateway IP] | Root domain (applyforus.com) |
| www | A | 300 | [App Gateway IP] | WWW subdomain |
| api | A | 300 | [App Gateway IP] | API endpoint |

### Terraform Configuration

These records are automatically created by the `dns-zone` module:

```hcl
resource "azurerm_dns_a_record" "root" {
  name    = "@"
  records = [var.app_gateway_public_ip]
  ttl     = 300
}
```

## CNAME Records (Aliases)

CNAME records create aliases to other domain names.

| Name | Type | TTL | Value | Purpose |
|------|------|-----|-------|---------|
| www | CNAME | 300 | applyforus.com | Alternate WWW configuration |

**Note**: Use either A record OR CNAME for www subdomain, not both.

## TXT Records (Text/Verification)

### SPF Record (Email Authentication)

Sender Policy Framework to prevent email spoofing.

| Name | Type | TTL | Value | Purpose |
|------|------|-----|-------|---------|
| @ | TXT | 300 | v=spf1 include:_spf.google.com ~all | Gmail SPF if using Google Workspace |
| @ | TXT | 300 | v=spf1 include:spf.protection.outlook.com ~all | Office 365 SPF if using Microsoft |

### DKIM Record (Email Signing)

DomainKeys Identified Mail for email authentication.

**Google Workspace Example**:
```
Name: google._domainkey
Type: TXT
TTL: 300
Value: v=DKIM1; k=rsa; p=[your-public-key]
```

**Office 365 Example**:
```
Name: selector1._domainkey
Type: TXT
TTL: 300
Value: v=DKIM1; k=rsa; p=[your-public-key]

Name: selector2._domainkey
Type: TXT
TTL: 300
Value: v=DKIM1; k=rsa; p=[your-public-key]
```

### DMARC Record (Email Policy)

Domain-based Message Authentication, Reporting, and Conformance.

| Name | Type | TTL | Value | Purpose |
|------|------|-----|-------|---------|
| _dmarc | TXT | 300 | v=DMARC1; p=quarantine; rua=mailto:dmarc@applyforus.com | DMARC policy |

### Domain Verification Records

For various service verifications (add as needed):

| Name | Type | TTL | Value | Purpose |
|------|------|-----|-------|---------|
| @ | TXT | 300 | google-site-verification=... | Google Search Console |
| @ | TXT | 300 | MS=... | Microsoft verification |
| _github-challenge-applyforus | TXT | 300 | [challenge-code] | GitHub Pages verification |

## CAA Records (Certificate Authority Authorization)

CAA records specify which Certificate Authorities can issue SSL certificates.

| Name | Type | TTL | Flags | Tag | Value | Purpose |
|------|------|-----|-------|-----|-------|---------|
| @ | CAA | 300 | 0 | issue | letsencrypt.org | Allow Let's Encrypt |
| @ | CAA | 300 | 0 | issuewild | letsencrypt.org | Allow wildcard certs |
| @ | CAA | 300 | 0 | iodef | mailto:security@applyforus.com | Report violations |

### Terraform Configuration

```hcl
resource "azurerm_dns_caa_record" "letsencrypt" {
  name = "@"
  ttl  = 300

  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  record {
    flags = 0
    tag   = "issuewild"
    value = "letsencrypt.org"
  }
}
```

## MX Records (Mail Exchange)

Configure MX records if using email services.

### Google Workspace

| Name | Type | TTL | Priority | Value | Purpose |
|------|------|-----|----------|-------|---------|
| @ | MX | 300 | 1 | aspmx.l.google.com | Primary mail server |
| @ | MX | 300 | 5 | alt1.aspmx.l.google.com | Backup mail server |
| @ | MX | 300 | 5 | alt2.aspmx.l.google.com | Backup mail server |
| @ | MX | 300 | 10 | alt3.aspmx.l.google.com | Backup mail server |
| @ | MX | 300 | 10 | alt4.aspmx.l.google.com | Backup mail server |

### Microsoft 365

| Name | Type | TTL | Priority | Value | Purpose |
|------|------|-----|----------|-------|---------|
| @ | MX | 300 | 0 | applyforus-com.mail.protection.outlook.com | Office 365 mail |

### Custom Email Server

| Name | Type | TTL | Priority | Value | Purpose |
|------|------|-----|----------|-------|---------|
| @ | MX | 300 | 10 | mail.applyforus.com | Primary mail server |

## SRV Records (Service Records)

For specific service discovery (if needed).

**Example - Microsoft Teams**:
```
Name: _sip._tls
Type: SRV
TTL: 300
Priority: 100
Weight: 1
Port: 443
Target: sipdir.online.lync.com
```

## Subdomain Strategy

### Production Subdomains

| Subdomain | Purpose | Points To |
|-----------|---------|-----------|
| www.applyforus.com | Main website | Application Gateway |
| api.applyforus.com | API endpoints | Application Gateway |
| admin.applyforus.com | Admin portal | Application Gateway |
| docs.applyforus.com | Documentation | Application Gateway or CDN |
| status.applyforus.com | Status page | External service (optional) |
| blog.applyforus.com | Blog/content | Application Gateway or CMS |

### Internal/Development Subdomains

| Subdomain | Purpose | Points To |
|-----------|---------|-----------|
| dev.applyforus.com | Development environment | Dev App Gateway |
| test.applyforus.com | Testing environment | Test App Gateway |
| staging.applyforus.com | Staging environment | Test App Gateway |

## Wildcard Records

**Not Recommended for Production**: Wildcard records can pose security risks.

If needed for development:
```hcl
resource "azurerm_dns_cname_record" "wildcard" {
  name   = "*"
  record = "applyforus.com"
  ttl    = 300
}
```

## TTL (Time To Live) Recommendations

| Record Type | Recommended TTL | Reasoning |
|-------------|----------------|-----------|
| A Records | 300 (5 min) | Quick updates during deployment |
| CNAME Records | 3600 (1 hour) | Less frequent changes |
| MX Records | 3600 (1 hour) | Email routing is critical |
| TXT Records | 300 (5 min) | Verification/changes needed |
| CAA Records | 3600 (1 hour) | Rarely changed |

**Before Major Changes**: Reduce TTL to 60-300 seconds 24-48 hours in advance.

**After Stable**: Increase TTL to 3600-86400 seconds to reduce DNS query load.

## Creating Records via Azure CLI

### Add A Record

```bash
az network dns record-set a add-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name admin \
  --ipv4-address [App-Gateway-IP]
```

### Add CNAME Record

```bash
az network dns record-set cname set-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name blog \
  --cname applyforus.com
```

### Add TXT Record

```bash
az network dns record-set txt add-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name @ \
  --value "v=spf1 include:_spf.google.com ~all"
```

### Add MX Record

```bash
az network dns record-set mx add-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name @ \
  --exchange aspmx.l.google.com \
  --preference 1
```

### Add CAA Record

```bash
az network dns record-set caa add-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name @ \
  --flags 0 \
  --tag "issue" \
  --value "letsencrypt.org"
```

## Verifying DNS Records

### Using nslookup

```bash
# Check A record
nslookup applyforus.com

# Check MX records
nslookup -type=MX applyforus.com

# Check TXT records
nslookup -type=TXT applyforus.com

# Check CAA records
nslookup -type=CAA applyforus.com
```

### Using dig (Linux/Mac)

```bash
# Check all records
dig applyforus.com ANY

# Check specific type
dig applyforus.com A
dig applyforus.com MX
dig applyforus.com TXT
dig applyforus.com CAA
```

### Using Azure CLI

```bash
# List all record sets
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output table

# Show specific record
az network dns record-set a show \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --name @ \
  --output json
```

## DNS Monitoring and Testing

### Online Tools

- **DNS Checker**: https://dnschecker.org/
- **MXToolbox**: https://mxtoolbox.com/
- **DNS Propagation**: https://www.whatsmydns.net/
- **SPF Validator**: https://www.kitterman.com/spf/validate.html
- **DMARC Validator**: https://dmarc.org/resources/

### Automated Monitoring

Set up monitoring alerts for:
1. DNS resolution failures
2. Record changes (audit logs)
3. SSL certificate expiration
4. Email deliverability issues

## Security Best Practices

1. **DNSSEC**: Consider enabling DNSSEC for zone signing (Azure DNS supports this)
2. **CAA Records**: Always specify allowed CAs to prevent unauthorized certificates
3. **Regular Audits**: Review DNS records monthly
4. **Access Control**: Limit who can modify DNS records
5. **Change Logs**: Document all DNS changes
6. **Backup Records**: Export and backup DNS configuration regularly

## Export DNS Configuration

```bash
# Export as JSON
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output json > dns-records-backup.json

# Export as table
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output table > dns-records-backup.txt
```

## Terraform Module Updates

To add new DNS records, update the `dns-zone` module:

```hcl
# Add to modules/dns-zone/main.tf
resource "azurerm_dns_a_record" "admin" {
  name                = "admin"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.app_gateway_public_ip]
  tags                = var.tags
}
```

Then apply:
```bash
terraform plan
terraform apply
```

## Troubleshooting

### Record Not Resolving

1. Check record exists in Azure DNS
2. Verify nameservers are propagated
3. Clear DNS cache
4. Check TTL hasn't expired
5. Test from multiple locations

### Email Delivery Issues

1. Verify MX records are correct
2. Check SPF record syntax
3. Validate DKIM configuration
4. Review DMARC policy
5. Test using mail-tester.com

### SSL Certificate Validation Fails

1. Ensure CAA records allow your CA
2. Verify A records point to correct IP
3. Check Application Gateway is running
4. Validate domain ownership

## Next Steps

After configuring DNS records:
1. Wait for DNS propagation (24-48 hours)
2. Verify all records resolve correctly
3. Proceed to SSL certificate installation
4. See `ssl_configuration.md` for next steps
5. Configure Application Gateway SSL bindings
6. Test all application endpoints
