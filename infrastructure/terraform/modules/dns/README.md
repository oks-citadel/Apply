# Azure DNS Module

This Terraform module manages Azure DNS zones and records for the ApplyforUs (applyforus.com) domain.

## Features

- Azure DNS Zone creation and management
- A records for root domain, API, and staging subdomains
- CNAME records for www subdomain
- TXT records for domain verification and ACME challenges
- CAA records for certificate authority authorization
- MX records for email (optional)
- SPF and DMARC records for email security (optional)
- Custom A and CNAME records support
- DNS query logging and diagnostics

## Usage

```hcl
module "dns" {
  source = "./modules/dns"

  resource_group_name = azurerm_resource_group.main.name
  domain_name         = "applyforus.com"
  ingress_public_ip   = azurerm_public_ip.ingress.ip_address

  enable_staging     = true
  staging_public_ip  = azurerm_public_ip.staging.ip_address

  verification_records = [
    "google-site-verification=abc123",
    "MS=ms12345678"
  ]

  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}
```

## DNS Records Created

| Record Type | Name | Value | Purpose |
|-------------|------|-------|---------|
| A | @ | Ingress IP | Root domain (applyforus.com) |
| A | api | Ingress IP | API endpoint (api.applyforus.com) |
| A | staging | Staging IP | Staging environment (staging.applyforus.com) |
| CNAME | www | applyforus.com | WWW subdomain redirect |
| CAA | @ | letsencrypt.org | Certificate authority authorization |
| TXT | @ | Verification | Domain ownership verification |
| TXT | _acme-challenge | ACME | SSL certificate validation |

## Requirements

- Terraform >= 1.5.0
- Azure Provider >= 3.85.0
- Azure subscription with DNS zone capability

## Inputs

| Variable | Type | Description | Required |
|----------|------|-------------|----------|
| resource_group_name | string | Name of the resource group | Yes |
| domain_name | string | Domain name (e.g., applyforus.com) | Yes |
| ingress_public_ip | string | Public IP of ingress controller | No |
| staging_public_ip | string | Public IP for staging environment | No |
| enable_staging | bool | Enable staging subdomain | No |
| verification_records | list(string) | Domain verification TXT records | No |
| enable_mx_records | bool | Enable email MX records | No |
| mx_records | list(object) | MX record configurations | No |
| enable_diagnostics | bool | Enable DNS diagnostics | No |
| log_analytics_workspace_id | string | Log Analytics workspace ID | No |
| tags | map(string) | Resource tags | No |

## Outputs

| Output | Description |
|--------|-------------|
| dns_zone_id | Azure DNS Zone resource ID |
| dns_zone_name | DNS Zone name |
| nameservers | Nameservers to configure at registrar |
| root_domain_ip | IP address for root domain |
| api_subdomain_ip | IP address for API subdomain |
| dns_configuration_summary | Complete DNS configuration summary |

## Post-Deployment Steps

After applying this module:

1. **Update Nameservers at Domain Registrar**: Configure the nameservers output from this module at your domain registrar (GoDaddy, Namecheap, etc.)

2. **Verify DNS Propagation**: Wait 24-48 hours for DNS propagation worldwide

3. **Test DNS Resolution**: Use the validation script in `scripts/validate-dns.sh`

4. **Deploy cert-manager**: Install cert-manager in Kubernetes for SSL certificates

5. **Verify SSL Certificates**: Ensure Let's Encrypt certificates are issued successfully

## Examples

### Basic Configuration

```hcl
module "dns" {
  source = "./modules/dns"

  resource_group_name = "jobpilot-prod-rg"
  domain_name         = "applyforus.com"
  ingress_public_ip   = "20.123.45.67"

  tags = {
    Environment = "Production"
  }
}
```

### With Email Configuration

```hcl
module "dns" {
  source = "./modules/dns"

  resource_group_name = "jobpilot-prod-rg"
  domain_name         = "applyforus.com"
  ingress_public_ip   = "20.123.45.67"

  enable_mx_records = true
  mx_records = [
    {
      preference = 10
      exchange   = "mail.applyforus.com"
    }
  ]

  spf_record   = "v=spf1 include:_spf.google.com ~all"
  dmarc_record = "v=DMARC1; p=quarantine; rua=mailto:dmarc@applyforus.com"

  tags = {
    Environment = "Production"
  }
}
```

### With Custom Records

```hcl
module "dns" {
  source = "./modules/dns"

  resource_group_name = "jobpilot-prod-rg"
  domain_name         = "applyforus.com"
  ingress_public_ip   = "20.123.45.67"

  custom_a_records = {
    "dev"     = ["20.123.45.68"]
    "test"    = ["20.123.45.69"]
  }

  custom_cname_records = {
    "docs"    = "documentation.applyforus.com"
    "status"  = "status.applyforus.com"
  }

  tags = {
    Environment = "Production"
  }
}
```

## Troubleshooting

### DNS Not Resolving

```bash
# Check nameservers at registrar
dig NS applyforus.com

# Query Azure nameservers directly
dig @ns1-01.azure-dns.com applyforus.com

# Check specific record
dig A applyforus.com
dig CNAME www.applyforus.com
```

### Certificate Issues

```bash
# Verify CAA records
dig CAA applyforus.com

# Check ACME challenge record
dig TXT _acme-challenge.applyforus.com
```

## Related Documentation

- [DNS Migration Guide](../../../docs/deployment/dns-migration-guide.md)
- [SSL Certificate Setup](../../../docs/deployment/ssl-certificate-setup.md)
- [DNS Validation Script](../../../scripts/validate-dns.sh)
