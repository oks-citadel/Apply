# DNS and SSL Configuration Summary

## Overview

This document provides a quick reference for DNS and SSL/TLS configuration for the ApplyforUs (applyforus.com) platform deployed on Azure Kubernetes Service (AKS).

## Infrastructure Components

### DNS Configuration

- **DNS Provider**: Azure DNS
- **Domain Registrar**: GoDaddy (nameservers delegated to Azure DNS)
- **Domain**: applyforus.com
- **DNS Management**: Terraform module (`infrastructure/terraform/modules/dns`)

### SSL/TLS Configuration

- **Certificate Manager**: cert-manager v1.13.3
- **Certificate Authority**: Let's Encrypt
- **Challenge Type**: HTTP-01 (via NGINX Ingress)
- **Auto-Renewal**: 30 days before expiration

## DNS Records

### Production Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | `[INGRESS_IP]` | Root domain (applyforus.com) |
| A | api | `[INGRESS_IP]` | API endpoint (api.applyforus.com) |
| CNAME | www | applyforus.com | WWW subdomain |
| CAA | @ | 0 issue "letsencrypt.org" | Certificate authority authorization |
| CAA | @ | 0 issuewild "letsencrypt.org" | Wildcard certificate authorization |
| TXT | @ | [Verification records] | Domain verification |
| TXT | _acme-challenge | [ACME validation] | SSL certificate validation |

### Staging Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | staging | `[STAGING_IP]` | Staging environment |

### Nameservers (Azure DNS)

After DNS migration, the domain uses these Azure DNS nameservers:

```
ns1-01.azure-dns.com
ns2-01.azure-dns.net
ns3-01.azure-dns.org
ns4-01.azure-dns.info
```

## SSL Certificates

### Production Certificate

**Certificate Name**: `applyforus-tls-cert`
**ClusterIssuer**: `letsencrypt-prod`
**Domains Covered**:
- applyforus.com
- www.applyforus.com
- api.applyforus.com

**Validity**: 90 days (auto-renewed at 60 days)
**Secret**: `applyforus-tls-cert` (namespace: jobpilot)

### Staging Certificate

**Certificate Name**: `staging-tls-cert`
**ClusterIssuer**: `letsencrypt-staging`
**Domains Covered**:
- staging.applyforus.com

**Validity**: 90 days (auto-renewed at 60 days)
**Secret**: `staging-tls-cert` (namespace: jobpilot)

## File Structure

```
infrastructure/
├── terraform/
│   └── modules/
│       └── dns/
│           ├── main.tf          # DNS zone and records
│           ├── variables.tf     # Input variables
│           ├── outputs.tf       # DNS outputs
│           └── README.md        # Module documentation
│
├── kubernetes/
│   ├── base/
│   │   └── ingress.yaml        # Main ingress with TLS
│   │
│   ├── overlays/
│   │   └── staging/
│   │       └── ingress-patch.yaml  # Staging ingress
│   │
│   └── cert-manager/
│       ├── cluster-issuers.yaml    # Let's Encrypt issuers
│       └── certificates.yaml       # Certificate definitions
│
docs/
└── deployment/
    ├── dns-migration-guide.md      # GoDaddy to Azure DNS migration
    ├── ssl-certificate-setup.md    # cert-manager setup guide
    └── DNS_SSL_SUMMARY.md          # This file

scripts/
├── validate-dns.sh                 # DNS validation script
└── monitor-dns-propagation.sh      # DNS propagation monitor
```

## Quick Start Commands

### DNS Configuration

```bash
# Deploy Azure DNS zone via Terraform
cd infrastructure/terraform
terraform apply -target=module.dns -var-file="terraform.tfvars"

# Get Azure nameservers
terraform output dns_nameservers

# Validate DNS configuration
./scripts/validate-dns.sh applyforus.com --verbose

# Monitor DNS propagation (after nameserver change)
./scripts/monitor-dns-propagation.sh applyforus.com
```

### SSL Certificate Setup

```bash
# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update

kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3

# Deploy ClusterIssuers
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml

# Deploy Certificates (optional - can be auto-created by ingress)
kubectl apply -f infrastructure/kubernetes/cert-manager/certificates.yaml

# Deploy Ingress with TLS
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# Check certificate status
kubectl get certificate -n jobpilot
kubectl describe certificate applyforus-tls-cert -n jobpilot
```

## Verification

### DNS Verification

```bash
# Verify DNS records
dig applyforus.com +short
dig www.applyforus.com +short
dig api.applyforus.com +short
dig staging.applyforus.com +short

# Verify nameservers
dig NS applyforus.com +short

# Verify CAA records
dig CAA applyforus.com +short

# Run full validation
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app
```

### SSL Verification

```bash
# Check certificate status
kubectl get certificate -n jobpilot

# Test SSL certificate
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -text

# Verify certificate issuer (should be Let's Encrypt)
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer

# Check certificate expiration
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -dates

# Test HTTPS endpoints
curl -I https://applyforus.com
curl -I https://www.applyforus.com
curl -I https://api.applyforus.com/api/health
```

### Online Tools

- **DNS Propagation**: https://www.whatsmydns.net/
- **SSL Test**: https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
- **Certificate Transparency**: https://crt.sh/?q=applyforus.com

## Troubleshooting

### DNS Issues

```bash
# DNS not resolving
# 1. Check DNS propagation (can take 24-48 hours)
./scripts/monitor-dns-propagation.sh applyforus.com

# 2. Clear local DNS cache
sudo systemd-resolve --flush-caches  # Linux
sudo dscacheutil -flushcache         # Mac
ipconfig /flushdns                   # Windows

# 3. Query Azure DNS directly
dig @ns1-01.azure-dns.com applyforus.com
```

### SSL Certificate Issues

```bash
# Certificate not issued
# 1. Check certificate status
kubectl describe certificate applyforus-tls-cert -n jobpilot

# 2. Check ACME challenge
kubectl get challenge -n jobpilot
kubectl describe challenge <challenge-name> -n jobpilot

# 3. Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100

# 4. Test ACME challenge endpoint
curl http://applyforus.com/.well-known/acme-challenge/test

# 5. Delete and retry
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot
# Certificate will be automatically re-created
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| DNS not resolving | Nameservers not updated at GoDaddy | Update nameservers to Azure DNS |
| DNS resolving to old IP | DNS cache | Wait for TTL expiry or flush cache |
| Certificate shows "Fake LE" | Using staging issuer | Switch to `letsencrypt-prod` |
| Certificate not issued | DNS not propagated | Wait for DNS propagation |
| ACME challenge fails | Port 80 blocked | Ensure ingress accessible on port 80 |
| Rate limit exceeded | Too many cert requests | Use staging for testing |

## Maintenance

### DNS Updates

```bash
# Update DNS records via Terraform
cd infrastructure/terraform

# Edit terraform.tfvars with new IP addresses
vim terraform.tfvars

# Plan changes
terraform plan -target=module.dns

# Apply changes
terraform apply -target=module.dns

# Verify changes
./scripts/validate-dns.sh applyforus.com
```

### Certificate Renewal

Certificates are automatically renewed by cert-manager 30 days before expiration. Manual renewal:

```bash
# Force certificate renewal
kubectl delete certificate applyforus-tls-cert -n jobpilot

# Or delete the secret
kubectl delete secret applyforus-tls-cert -n jobpilot

# cert-manager will automatically re-issue within 2-5 minutes
kubectl get certificate -n jobpilot -w
```

### Monitoring

```bash
# Monitor certificate expiration
kubectl get certificate -n jobpilot -o custom-columns=NAME:.metadata.name,READY:.status.conditions[0].status,EXPIRATION:.status.notAfter

# Monitor cert-manager
kubectl logs -n cert-manager -l app=cert-manager -f

# Set up alerts for certificate expiration (see SSL setup guide)
```

## Migration Checklist

### DNS Migration (GoDaddy to Azure DNS)

- [ ] Document current DNS records from GoDaddy
- [ ] Deploy Azure DNS zone via Terraform
- [ ] Configure all DNS records in Azure DNS
- [ ] Test DNS resolution using Azure nameservers directly
- [ ] Reduce TTL values in GoDaddy (optional)
- [ ] Update nameservers at GoDaddy to Azure DNS nameservers
- [ ] Monitor DNS propagation (24-48 hours)
- [ ] Verify DNS from multiple global locations
- [ ] Test application endpoints
- [ ] Keep GoDaddy DNS for rollback (7 days)

### SSL Certificate Setup

- [ ] Install cert-manager in AKS cluster
- [ ] Deploy ClusterIssuers (staging and production)
- [ ] Test with staging issuer first
- [ ] Configure ingress with TLS annotations
- [ ] Wait for certificate issuance (2-5 minutes)
- [ ] Verify certificate using openssl
- [ ] Test HTTPS endpoints
- [ ] Switch to production issuer
- [ ] Configure certificate renewal monitoring
- [ ] Test auto-renewal (optional)

## Support Contacts

- **DNS Issues**: Azure Support, GoDaddy Support
- **SSL Issues**: cert-manager GitHub, Let's Encrypt Community
- **Platform Issues**: DevOps Team (devops@applyforus.com)

## References

- [DNS Migration Guide](./dns-migration-guide.md)
- [SSL Certificate Setup](./ssl-certificate-setup.md)
- [Terraform DNS Module](../../infrastructure/terraform/modules/dns/README.md)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

**Last Updated**: 2024-01-20
**Version**: 1.0
**Maintained By**: DevOps Team
