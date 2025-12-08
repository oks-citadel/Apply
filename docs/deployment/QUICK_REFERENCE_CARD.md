# DNS & SSL Quick Reference Card
**ApplyforUs Platform - applyforus.com**

---

## 🌐 DNS Configuration

### DNS Records
| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | @ | [INGRESS_IP] | applyforus.com |
| A | api | [INGRESS_IP] | api.applyforus.com |
| A | staging | [STAGING_IP] | staging.applyforus.com |
| CNAME | www | applyforus.com | www redirect |

### Azure DNS Nameservers
```
ns1-01.azure-dns.com
ns2-01.azure-dns.net
ns3-01.azure-dns.org
ns4-01.azure-dns.info
```

### DNS Commands
```bash
# Validate DNS
./scripts/validate-dns.sh applyforus.com

# Monitor propagation
./scripts/monitor-dns-propagation.sh applyforus.com

# Check resolution
dig applyforus.com +short
dig api.applyforus.com +short

# Check nameservers
dig NS applyforus.com +short
```

---

## 🔒 SSL/TLS Certificates

### Certificates
| Name | Domains | Issuer | Renewal |
|------|---------|--------|---------|
| applyforus-tls-cert | applyforus.com, www, api | Let's Encrypt | Auto (60 days) |
| staging-tls-cert | staging.applyforus.com | LE Staging | Auto (60 days) |

### SSL Commands
```bash
# Validate SSL
./scripts/validate-ssl.sh applyforus.com --check-k8s

# Check certificate
kubectl get certificate -n jobpilot

# Test SSL
echo | openssl s_client -connect applyforus.com:443 \
  -servername applyforus.com 2>/dev/null | \
  openssl x509 -noout -issuer -dates

# Force renewal
kubectl delete certificate applyforus-tls-cert -n jobpilot
```

---

## 🚀 Deployment Quick Start

### 1. Deploy DNS (30 min)
```bash
cd infrastructure/terraform
terraform apply -target=module.dns
terraform output dns_nameservers
```

### 2. Update GoDaddy (15 min)
1. Go to https://dnsmanagement.godaddy.com/
2. Update nameservers to Azure DNS
3. Monitor: `./scripts/monitor-dns-propagation.sh applyforus.com`

### 3. Install cert-manager (15 min)
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --create-namespace --version v1.13.3
```

### 4. Deploy SSL (20 min)
```bash
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml
kubectl get certificate -n jobpilot -w
```

### 5. Verify (10 min)
```bash
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app
```

---

## 🔧 Troubleshooting

### DNS Issues

**Problem**: DNS not resolving
```bash
# Check propagation
./scripts/monitor-dns-propagation.sh applyforus.com

# Query Azure DNS directly
dig @ns1-01.azure-dns.com applyforus.com

# Clear cache
sudo systemd-resolve --flush-caches  # Linux
ipconfig /flushdns                   # Windows
```

### SSL Issues

**Problem**: Certificate not issued
```bash
# Check status
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Check challenge
kubectl get challenge -n jobpilot

# Check logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100

# Delete and retry
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot
```

**Problem**: "Fake LE" certificate
```bash
# Switch to production issuer
kubectl edit ingress jobpilot-ingress -n jobpilot
# Change: cert-manager.io/cluster-issuer: "letsencrypt-prod"

# Delete staging cert
kubectl delete certificate applyforus-tls-cert -n jobpilot
```

---

## 📊 Monitoring

### Daily Checks
```bash
# Certificate status
kubectl get certificate -n jobpilot

# HTTPS endpoints
curl -I https://applyforus.com
curl -I https://api.applyforus.com/api/health
```

### Weekly Checks
```bash
# Full validation
./scripts/validate-dns.sh applyforus.com --check-ssl --check-app

# Certificate expiration
kubectl get certificate -n jobpilot \
  -o custom-columns=NAME:.metadata.name,EXPIRATION:.status.notAfter
```

### Monthly Checks
```bash
# SSL Labs test
# https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com

# Update cert-manager
helm upgrade cert-manager jetstack/cert-manager \
  --namespace cert-manager --version v1.13.3
```

---

## 📁 File Locations

### Documentation
```
docs/deployment/
├── INDEX.md                          # Documentation index
├── dns-migration-guide.md            # GoDaddy migration (62 pages)
├── ssl-certificate-setup.md          # cert-manager setup (45 pages)
├── DNS_SSL_SUMMARY.md                # Quick reference (18 pages)
└── DNS_SSL_DEPLOYMENT_CHECKLIST.md   # Deployment checklist (25 pages)
```

### Infrastructure
```
infrastructure/
├── terraform/modules/dns/            # Terraform DNS module
├── kubernetes/cert-manager/          # cert-manager configs
└── DNS_SSL_SETUP_README.md           # Master setup guide (35 pages)
```

### Scripts
```
scripts/
├── validate-dns.sh                   # DNS validation
├── monitor-dns-propagation.sh        # Propagation monitoring
└── validate-ssl.sh                   # SSL validation
```

---

## 🔗 Important Links

### Tools
- **DNS Propagation**: https://www.whatsmydns.net/?d=applyforus.com
- **SSL Test**: https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
- **Cert Transparency**: https://crt.sh/?q=applyforus.com
- **GoDaddy DNS**: https://dnsmanagement.godaddy.com/

### Documentation
- **Azure DNS**: https://docs.microsoft.com/en-us/azure/dns/
- **cert-manager**: https://cert-manager.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/docs/
- **NGINX Ingress**: https://kubernetes.github.io/ingress-nginx/

---

## 🆘 Support

**Internal**: devops@applyforus.com
**Documentation**: `docs/deployment/INDEX.md`
**Emergency**: See rollback procedures in deployment checklist

---

## 📋 Pre-Flight Checklist

Before DNS Migration:
- [ ] Terraform DNS module deployed
- [ ] DNS tested with Azure nameservers
- [ ] Nameservers documented
- [ ] Team notified

Before SSL Setup:
- [ ] DNS propagated globally
- [ ] cert-manager installed
- [ ] ClusterIssuers created
- [ ] Tested with staging first

---

## ⚠️ Important Notes

- **Always test with staging issuer first** (avoid rate limits)
- **DNS propagation takes 24-48 hours** (be patient)
- **Certificate auto-renews 30 days before expiry** (monitor)
- **Keep GoDaddy DNS for 7 days** (rollback safety)
- **Rate limit: 50 certs/week** (use staging for testing)

---

**Last Updated**: January 20, 2024 | **Version**: 1.0 | **Platform**: Azure AKS
