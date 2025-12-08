# DNS and SSL/TLS Configuration for ApplyforUs Platform

## Overview

This directory contains comprehensive documentation and configuration files for setting up DNS and SSL/TLS certificates for the ApplyforUs (applyforus.com) platform on Azure Kubernetes Service (AKS).

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [File Structure](#file-structure)
6. [Validation](#validation)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

## Quick Start

### Prerequisites

- Azure subscription with AKS cluster deployed
- Domain: applyforus.com registered with GoDaddy
- kubectl configured with cluster access
- Terraform >= 1.5.0
- Helm >= 3.0

### Setup in 5 Steps

```bash
# 1. Deploy Azure DNS zone
cd infrastructure/terraform
terraform apply -target=module.dns -var-file="terraform.tfvars"

# 2. Update nameservers at GoDaddy (use output from step 1)
# Go to GoDaddy DNS Management and update nameservers

# 3. Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3

# 4. Deploy ClusterIssuers and Ingress
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# 5. Verify
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GoDaddy (Domain Registrar)                    │
│                    Nameservers → Azure DNS                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Azure DNS Zone                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  DNS Records (managed by Terraform)                    │     │
│  │  • A: @ → 20.x.x.x (applyforus.com)                   │     │
│  │  • A: api → 20.x.x.x (api.applyforus.com)            │     │
│  │  • CNAME: www → applyforus.com                         │     │
│  │  • CAA: @ → letsencrypt.org                           │     │
│  │  • TXT: _acme-challenge → [validation]                │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Azure Kubernetes Service (AKS)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NGINX Ingress Controller                                │   │
│  │  • Public IP: 20.x.x.x                                  │   │
│  │  • TLS Termination                                       │   │
│  │  • Routes: /, /api/*                                     │   │
│  └───────────────────┬──────────────────────────────────────┘   │
│                      │                                           │
│  ┌───────────────────▼──────────────────────────────────────┐   │
│  │  cert-manager                                            │   │
│  │  • ClusterIssuer: letsencrypt-prod                      │   │
│  │  • Certificate: applyforus-tls-cert                     │   │
│  │  • Auto-renewal: 30 days before expiration              │   │
│  └───────────────────┬──────────────────────────────────────┘   │
│                      │                                           │
│                      ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Let's Encrypt                                           │   │
│  │  • ACME HTTP-01 Challenge                               │   │
│  │  • Issues 90-day certificates                            │   │
│  │  • Rate limit: 50 certs/week                            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Backend Services                                         │   │
│  │  • web-app (Next.js)                                     │   │
│  │  • auth-service (NestJS)                                 │   │
│  │  • job-service, user-service, etc.                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Terraform DNS Module

**Location**: `infrastructure/terraform/modules/dns/`

**Purpose**: Manages Azure DNS zone and all DNS records

**Resources Created**:
- Azure DNS Zone
- A records (root, api, staging)
- CNAME records (www)
- TXT records (verification, ACME)
- CAA records (certificate authority authorization)
- MX records (optional, for email)

**Key Files**:
- `main.tf` - DNS resources
- `variables.tf` - Input parameters
- `outputs.tf` - Nameservers and IPs
- `README.md` - Module documentation

### 2. cert-manager

**Location**: `infrastructure/kubernetes/cert-manager/`

**Purpose**: Automates SSL/TLS certificate management

**Components**:
- ClusterIssuers (Let's Encrypt production and staging)
- Certificate resources (production and staging)
- ACME HTTP-01 challenge solver

**Key Files**:
- `cluster-issuers.yaml` - Let's Encrypt configuration
- `certificates.yaml` - Certificate definitions

### 3. NGINX Ingress

**Location**: `infrastructure/kubernetes/base/ingress.yaml`

**Purpose**: Routes HTTP/HTTPS traffic and terminates TLS

**Features**:
- SSL/TLS termination
- Path-based routing
- Rate limiting
- CORS configuration
- Security headers
- WebSocket support

### 4. Documentation

**Location**: `docs/deployment/`

**Guides**:
- `dns-migration-guide.md` - Comprehensive DNS migration from GoDaddy
- `ssl-certificate-setup.md` - cert-manager installation and configuration
- `DNS_SSL_SUMMARY.md` - Quick reference guide

### 5. Validation Scripts

**Location**: `scripts/`

**Scripts**:
- `validate-dns.sh` - DNS configuration validation
- `monitor-dns-propagation.sh` - DNS propagation monitoring

## Step-by-Step Setup

### Phase 1: Azure DNS Setup (30 minutes)

#### 1.1. Configure Terraform Variables

Edit `infrastructure/terraform/terraform.tfvars`:

```hcl
# Enable DNS module
enable_dns_zone = true

# Domain configuration
domain_name = "applyforus.com"

# Get these IPs from your AKS ingress
ingress_public_ip = "20.123.45.67"    # Production ingress IP
staging_public_ip = "20.123.45.68"    # Staging ingress IP
enable_staging = true

# Email for Let's Encrypt notifications
verification_records = []

# Optional: Email configuration
enable_mx_records = false
```

#### 1.2. Get Ingress Public IPs

```bash
# Get production ingress IP
kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Get staging ingress IP (if separate)
kubectl get svc -n staging-ingress ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

#### 1.3. Deploy Azure DNS

```bash
cd infrastructure/terraform

# Initialize Terraform (if not done)
terraform init

# Plan DNS deployment
terraform plan -target=module.dns -var-file="terraform.tfvars"

# Apply DNS configuration
terraform apply -target=module.dns -var-file="terraform.tfvars"

# Save nameservers (you'll need these!)
terraform output dns_nameservers > nameservers.txt
cat nameservers.txt
```

**Output Example**:
```
[
  "ns1-01.azure-dns.com.",
  "ns2-01.azure-dns.net.",
  "ns3-01.azure-dns.org.",
  "ns4-01.azure-dns.info."
]
```

#### 1.4. Verify DNS Configuration (Before Nameserver Change)

```bash
# Test DNS using Azure nameservers directly
AZURE_NS="ns1-01.azure-dns.com"

dig @$AZURE_NS applyforus.com +short
dig @$AZURE_NS www.applyforus.com +short
dig @$AZURE_NS api.applyforus.com +short

# Run validation script against Azure DNS
cd ../..
./scripts/validate-dns.sh applyforus.com --azure-ns --verbose
```

### Phase 2: DNS Migration at GoDaddy (15 minutes + 24-48 hours propagation)

#### 2.1. Reduce TTL (Optional but Recommended)

1. Login to GoDaddy: https://dnsmanagement.godaddy.com/
2. Select domain: applyforus.com
3. Set all DNS record TTLs to 300 seconds (5 minutes)
4. Wait for old TTL to expire before proceeding

#### 2.2. Update Nameservers

1. Go to GoDaddy DNS Management
2. Click "Nameservers" section
3. Select "Change" → "Custom Nameservers"
4. Enter all 4 Azure DNS nameservers:
   ```
   ns1-01.azure-dns.com
   ns2-01.azure-dns.net
   ns3-01.azure-dns.org
   ns4-01.azure-dns.info
   ```
5. Save changes
6. **Record timestamp** for documentation

#### 2.3. Monitor DNS Propagation

```bash
# Start monitoring script (runs continuously)
./scripts/monitor-dns-propagation.sh applyforus.com 60

# This will check DNS propagation every 60 seconds
# Press Ctrl+C to stop when fully propagated
```

**Propagation Timeline**:
- 5-10 minutes: GoDaddy updates NS records
- 30-60 minutes: Major DNS resolvers start using Azure
- 2-4 hours: Most DNS resolvers updated
- 24-48 hours: Complete global propagation

### Phase 3: cert-manager Installation (15 minutes)

#### 3.1. Install cert-manager

```bash
# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.3 \
  --set installCRDs=false

# Verify installation
kubectl get pods -n cert-manager
```

**Expected Output**:
```
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-7d4b5d746d-xxxxx             1/1     Running   0          1m
cert-manager-cainjector-6d59c8d4f7-xxxxx  1/1     Running   0          1m
cert-manager-webhook-7f9f8648f9-xxxxx     1/1     Running   0          1m
```

#### 3.2. Deploy ClusterIssuers

**IMPORTANT**: Update email address first!

Edit `infrastructure/kubernetes/cert-manager/cluster-issuers.yaml`:

```yaml
spec:
  acme:
    email: admin@applyforus.com  # Change to your email
```

Then apply:

```bash
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml

# Verify ClusterIssuers
kubectl get clusterissuer

# Should show:
# NAME                  READY   AGE
# letsencrypt-prod      True    10s
# letsencrypt-staging   True    10s
```

### Phase 4: SSL Certificate Configuration (10 minutes)

#### 4.1. Test with Staging First (Recommended)

Edit `infrastructure/kubernetes/base/ingress.yaml`:

```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-staging"  # Use staging first
```

Apply ingress:

```bash
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# Watch certificate issuance
kubectl get certificate -n jobpilot -w

# Wait for READY = True (2-5 minutes)
```

#### 4.2. Verify Staging Certificate

```bash
# Check certificate status
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Test in browser (will show security warning - this is expected for staging)
curl -k https://applyforus.com

# Check certificate issuer (should be "Fake LE")
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer
```

#### 4.3. Switch to Production

Once staging works, switch to production:

Edit `infrastructure/kubernetes/base/ingress.yaml`:

```yaml
metadata:
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # Switch to production
```

Apply and delete existing certificate:

```bash
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# Delete staging certificate to trigger production cert
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot

# Watch new certificate issuance
kubectl get certificate -n jobpilot -w
```

#### 4.4. Verify Production Certificate

```bash
# Check certificate issuer (should be "Let's Encrypt")
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer

# Expected: issuer=C = US, O = Let's Encrypt, CN = R3

# Test in browser (should show secure connection)
curl https://applyforus.com

# Run SSL Labs test (Grade A expected)
# https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
```

### Phase 5: Verification and Testing (30 minutes)

#### 5.1. Run Validation Script

```bash
# Comprehensive validation
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app --verbose

# This checks:
# - DNS records
# - DNS propagation
# - SSL certificates
# - Application endpoints
```

#### 5.2. Test All Endpoints

```bash
# Test website
curl -I https://applyforus.com
curl -I https://www.applyforus.com

# Test API
curl https://api.applyforus.com/api/health

# Test staging
curl https://staging.applyforus.com/api/health

# Test SSL redirect (HTTP → HTTPS)
curl -I http://applyforus.com
# Should return 301/308 redirect to HTTPS
```

#### 5.3. Verify from Multiple Locations

**Online Tools**:
- DNS Propagation: https://www.whatsmydns.net/?d=applyforus.com&t=A
- SSL Test: https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
- Certificate Transparency: https://crt.sh/?q=applyforus.com

## File Structure

```
infrastructure/
├── terraform/
│   ├── modules/
│   │   └── dns/
│   │       ├── main.tf              # Azure DNS zone and records
│   │       ├── variables.tf         # Module input variables
│   │       ├── outputs.tf           # Nameservers output
│   │       └── README.md            # Module documentation
│   ├── main.tf                      # Main Terraform config (add dns module)
│   ├── variables.tf                 # Root variables (add dns vars)
│   ├── terraform.tfvars.example     # Example configuration
│   └── terraform.tfvars             # Your configuration (gitignored)
│
├── kubernetes/
│   ├── base/
│   │   └── ingress.yaml            # Main ingress with TLS config
│   │
│   ├── overlays/
│   │   ├── production/
│   │   │   └── kustomization.yaml
│   │   └── staging/
│   │       ├── kustomization.yaml
│   │       └── ingress-patch.yaml  # Staging ingress modifications
│   │
│   └── cert-manager/
│       ├── cluster-issuers.yaml    # Let's Encrypt issuers
│       └── certificates.yaml       # Certificate resources
│
└── DNS_SSL_SETUP_README.md        # This file

docs/
└── deployment/
    ├── dns-migration-guide.md      # Complete GoDaddy → Azure DNS migration
    ├── ssl-certificate-setup.md    # Detailed cert-manager setup
    └── DNS_SSL_SUMMARY.md          # Quick reference

scripts/
├── validate-dns.sh                 # DNS validation script
└── monitor-dns-propagation.sh      # DNS propagation monitoring
```

## Validation

### DNS Validation Checklist

- [ ] Azure DNS zone created
- [ ] All DNS records configured (A, CNAME, CAA, TXT)
- [ ] Nameservers updated at GoDaddy
- [ ] DNS resolves correctly: `dig applyforus.com +short`
- [ ] WWW subdomain works: `dig www.applyforus.com +short`
- [ ] API subdomain works: `dig api.applyforus.com +short`
- [ ] Staging subdomain works: `dig staging.applyforus.com +short`
- [ ] CAA records permit Let's Encrypt: `dig CAA applyforus.com +short`
- [ ] DNS propagated globally (check whatsmydns.net)

### SSL Certificate Checklist

- [ ] cert-manager installed and running
- [ ] ClusterIssuers created (staging and production)
- [ ] Ingress configured with TLS annotations
- [ ] Certificate issued: `kubectl get certificate -n jobpilot`
- [ ] Certificate is valid (Let's Encrypt issuer)
- [ ] HTTPS works on all domains
- [ ] HTTP redirects to HTTPS
- [ ] SSL Labs grade A or A+
- [ ] Certificate auto-renewal configured
- [ ] Certificate expiration monitoring set up

## Troubleshooting

### Common Issues and Solutions

#### Issue: DNS Not Resolving

**Symptoms**: `dig applyforus.com` returns no results

**Solutions**:
```bash
# 1. Check if DNS has propagated
./scripts/monitor-dns-propagation.sh applyforus.com

# 2. Query Azure DNS directly
dig @ns1-01.azure-dns.com applyforus.com +short

# 3. Clear local DNS cache
sudo systemd-resolve --flush-caches  # Linux
sudo dscacheutil -flushcache         # Mac
ipconfig /flushdns                   # Windows

# 4. Verify nameservers at GoDaddy
dig NS applyforus.com +short
```

#### Issue: Certificate Not Issued

**Symptoms**: `kubectl get certificate` shows READY=False

**Solutions**:
```bash
# 1. Check certificate status
kubectl describe certificate applyforus-tls-cert -n jobpilot

# 2. Check ACME challenge
kubectl get challenge -n jobpilot
kubectl describe challenge <challenge-name> -n jobpilot

# 3. Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100

# 4. Ensure DNS is propagated
dig applyforus.com +short

# 5. Test ACME challenge endpoint
curl http://applyforus.com/.well-known/acme-challenge/test

# 6. Delete and retry
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot
```

#### Issue: "Fake LE Intermediate" Certificate

**Cause**: Using Let's Encrypt staging

**Solution**:
```bash
# Switch to production ClusterIssuer
kubectl edit ingress jobpilot-ingress -n jobpilot
# Change: cert-manager.io/cluster-issuer: "letsencrypt-prod"

# Delete existing certificate
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot
```

#### Issue: Rate Limit Exceeded

**Symptoms**: cert-manager logs show "too many certificates already issued"

**Solution**:
```bash
# Let's Encrypt rate limit: 50 certificates per week
# 1. Wait for rate limit to reset (1 week)
# 2. Use staging for testing
# 3. Check issued certificates: https://crt.sh/?q=applyforus.com
```

### Debug Commands

```bash
# DNS debugging
dig applyforus.com +trace            # Trace DNS resolution
dig applyforus.com ANY +noall +answer # All DNS records
nslookup applyforus.com              # Simple lookup

# Certificate debugging
kubectl get certificate -n jobpilot -o yaml
kubectl get certificaterequest -n jobpilot
kubectl get order -n jobpilot
kubectl get challenge -n jobpilot
kubectl logs -n cert-manager -l app=cert-manager

# Ingress debugging
kubectl describe ingress jobpilot-ingress -n jobpilot
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# SSL testing
openssl s_client -connect applyforus.com:443 -servername applyforus.com
curl -v https://applyforus.com
```

## Maintenance

### Regular Tasks

#### Weekly

```bash
# Check certificate status
kubectl get certificate -n jobpilot

# Verify SSL endpoints
curl -I https://applyforus.com
curl -I https://api.applyforus.com
```

#### Monthly

```bash
# Review DNS records
az network dns record-set list -g jobpilot-prod-rg -z applyforus.com

# Check certificate expiration
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -dates

# Audit cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=1000 | grep -i error
```

#### Quarterly

```bash
# Update cert-manager
helm repo update
helm upgrade cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.13.3

# Review DNS TTL values
# Increase TTL to 3600 if changes are infrequent

# Run full validation
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app
```

### Certificate Renewal

Certificates auto-renew 30 days before expiration. To manually renew:

```bash
# Force renewal
kubectl delete certificate applyforus-tls-cert -n jobpilot

# Or delete secret
kubectl delete secret applyforus-tls-cert -n jobpilot

# cert-manager will automatically re-issue
kubectl get certificate -n jobpilot -w
```

### DNS Updates

```bash
# Update DNS records via Terraform
cd infrastructure/terraform

# Edit terraform.tfvars with new IP addresses
vim terraform.tfvars

# Apply changes
terraform apply -target=module.dns

# Verify
./scripts/validate-dns.sh applyforus.com
```

## Support

### Documentation

- [DNS Migration Guide](./docs/deployment/dns-migration-guide.md) - Detailed GoDaddy migration
- [SSL Certificate Setup](./docs/deployment/ssl-certificate-setup.md) - Complete cert-manager guide
- [DNS/SSL Summary](./docs/deployment/DNS_SSL_SUMMARY.md) - Quick reference

### External Resources

- [Azure DNS Documentation](https://docs.microsoft.com/en-us/azure/dns/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)

### Community Support

- **cert-manager**: https://cert-manager.io/docs/contributing/slack/
- **Let's Encrypt**: https://community.letsencrypt.org/
- **Azure DNS**: https://docs.microsoft.com/en-us/answers/topics/azure-dns.html

### Internal Support

- **DevOps Team**: devops@applyforus.com
- **Platform Issues**: platform@applyforus.com

---

**Version**: 1.0
**Last Updated**: 2024-01-20
**Maintained By**: DevOps Team
**Review Date**: 2024-04-20

## License

Copyright © 2024 ApplyforUs. All rights reserved.
