# DNS and SSL/TLS Documentation Index

This index provides quick access to all DNS and SSL/TLS configuration documentation for the ApplyforUs platform.

## Quick Navigation

### 🚀 Getting Started
**Start here if you're new to the DNS/SSL setup**

1. **[DNS_SSL_SETUP_README.md](../../infrastructure/DNS_SSL_SETUP_README.md)** - Master setup guide with 5-step quick start
2. **[DNS_SSL_DEPLOYMENT_CHECKLIST.md](./DNS_SSL_DEPLOYMENT_CHECKLIST.md)** - Detailed deployment checklist with 150+ checkpoints

### 📚 Detailed Guides
**In-depth guides for specific tasks**

3. **[dns-migration-guide.md](./dns-migration-guide.md)** - Complete GoDaddy to Azure DNS migration (62 pages)
4. **[ssl-certificate-setup.md](./ssl-certificate-setup.md)** - Comprehensive cert-manager and Let's Encrypt setup (45 pages)

### 📋 Quick Reference
**Quick lookup for commands and configurations**

5. **[DNS_SSL_SUMMARY.md](./DNS_SSL_SUMMARY.md)** - Quick reference guide with common commands and troubleshooting

### 📊 Implementation Summary
**Overview of what was implemented**

6. **[IMPLEMENTATION_SUMMARY_DNS_SSL.md](../../IMPLEMENTATION_SUMMARY_DNS_SSL.md)** - Complete implementation summary and file inventory

## Documentation by Use Case

### Use Case 1: First Time DNS and SSL Setup

**Goal**: Deploy DNS and SSL for the first time

**Follow this path**:
1. Read: [DNS_SSL_SETUP_README.md](../../infrastructure/DNS_SSL_SETUP_README.md) - Overview and architecture
2. Execute: [DNS_SSL_DEPLOYMENT_CHECKLIST.md](./DNS_SSL_DEPLOYMENT_CHECKLIST.md) - Step-by-step deployment
3. Reference: [DNS_SSL_SUMMARY.md](./DNS_SSL_SUMMARY.md) - Quick command lookup

**Estimated Time**: 2-4 days (including DNS propagation)

### Use Case 2: DNS Migration from GoDaddy

**Goal**: Migrate existing domain from GoDaddy to Azure DNS

**Follow this path**:
1. Read: [dns-migration-guide.md](./dns-migration-guide.md) - Complete migration guide
2. Prepare: Document current GoDaddy DNS records
3. Execute: Follow Phase 1-6 in the migration guide
4. Monitor: Use `scripts/monitor-dns-propagation.sh`
5. Verify: Use `scripts/validate-dns.sh`

**Estimated Time**: 24-48 hours (mostly DNS propagation)

### Use Case 3: SSL Certificate Setup Only

**Goal**: Configure SSL/TLS certificates (DNS already configured)

**Follow this path**:
1. Read: [ssl-certificate-setup.md](./ssl-certificate-setup.md) - Complete cert-manager guide
2. Install: cert-manager via Helm (Part 1)
3. Configure: ClusterIssuers (Part 2-3)
4. Deploy: Ingress with TLS (Part 4)
5. Verify: Use `scripts/validate-ssl.sh`

**Estimated Time**: 1-2 hours

### Use Case 4: Troubleshooting DNS Issues

**Goal**: Fix DNS resolution problems

**Follow this path**:
1. Quick Reference: [DNS_SSL_SUMMARY.md](./DNS_SSL_SUMMARY.md) - Common issues section
2. Detailed Troubleshooting: [dns-migration-guide.md](./dns-migration-guide.md#troubleshooting) - DNS-specific issues
3. Run Diagnostics: `scripts/validate-dns.sh applyforus.com --verbose`
4. Check Propagation: `scripts/monitor-dns-propagation.sh applyforus.com`

### Use Case 5: Troubleshooting SSL Certificate Issues

**Goal**: Fix SSL certificate problems

**Follow this path**:
1. Quick Reference: [DNS_SSL_SUMMARY.md](./DNS_SSL_SUMMARY.md) - SSL troubleshooting
2. Detailed Troubleshooting: [ssl-certificate-setup.md](./ssl-certificate-setup.md#troubleshooting) - cert-manager issues
3. Run Diagnostics: `scripts/validate-ssl.sh applyforus.com --check-k8s --verbose`
4. Check cert-manager: `kubectl logs -n cert-manager -l app=cert-manager`

### Use Case 6: Staging Environment Setup

**Goal**: Configure staging environment DNS and SSL

**Follow this path**:
1. DNS: Configure `staging.applyforus.com` A record in Terraform
2. Ingress: Apply `infrastructure/kubernetes/overlays/staging/ingress-patch.yaml`
3. Certificate: Uses staging Let's Encrypt issuer automatically
4. Verify: Test `https://staging.applyforus.com`

**Estimated Time**: 30 minutes

### Use Case 7: Routine Maintenance

**Goal**: Regular DNS and SSL maintenance tasks

**Weekly Tasks**:
- Run: `scripts/validate-dns.sh applyforus.com --check-ssl`
- Check: Certificate expiration dates
- Review: cert-manager logs for errors

**Monthly Tasks**:
- Test: SSL Labs (https://www.ssllabs.com/ssltest/)
- Review: Azure DNS query logs
- Update: cert-manager version if needed

**Reference**: [DNS_SSL_SETUP_README.md - Maintenance](../../infrastructure/DNS_SSL_SETUP_README.md#maintenance)

## Documentation Structure

### By Component

#### DNS Configuration
- **Terraform Module**: `infrastructure/terraform/modules/dns/README.md`
- **Migration Guide**: [dns-migration-guide.md](./dns-migration-guide.md)
- **Validation Script**: `scripts/validate-dns.sh`
- **Monitoring Script**: `scripts/monitor-dns-propagation.sh`

#### SSL/TLS Configuration
- **cert-manager Setup**: [ssl-certificate-setup.md](./ssl-certificate-setup.md)
- **ClusterIssuers**: `infrastructure/kubernetes/cert-manager/cluster-issuers.yaml`
- **Certificates**: `infrastructure/kubernetes/cert-manager/certificates.yaml`
- **Validation Script**: `scripts/validate-ssl.sh`

#### Ingress Configuration
- **Production Ingress**: `infrastructure/kubernetes/base/ingress.yaml`
- **Staging Ingress**: `infrastructure/kubernetes/overlays/staging/ingress-patch.yaml`

### By Phase

#### Phase 1: Planning
- **Implementation Summary**: [IMPLEMENTATION_SUMMARY_DNS_SSL.md](../../IMPLEMENTATION_SUMMARY_DNS_SSL.md)
- **Setup README**: [DNS_SSL_SETUP_README.md](../../infrastructure/DNS_SSL_SETUP_README.md)

#### Phase 2: Preparation
- **Deployment Checklist**: [DNS_SSL_DEPLOYMENT_CHECKLIST.md](./DNS_SSL_DEPLOYMENT_CHECKLIST.md) - Pre-deployment section
- **Migration Guide**: [dns-migration-guide.md](./dns-migration-guide.md) - Phase 1: Preparation

#### Phase 3: Deployment
- **Deployment Checklist**: [DNS_SSL_DEPLOYMENT_CHECKLIST.md](./DNS_SSL_DEPLOYMENT_CHECKLIST.md) - Phases 1-6
- **Setup README**: [DNS_SSL_SETUP_README.md](../../infrastructure/DNS_SSL_SETUP_README.md) - Step-by-step setup

#### Phase 4: Validation
- **Quick Reference**: [DNS_SSL_SUMMARY.md](./DNS_SSL_SUMMARY.md) - Verification section
- **Validation Scripts**: All scripts in `scripts/` directory

#### Phase 5: Maintenance
- **Setup README**: [DNS_SSL_SETUP_README.md](../../infrastructure/DNS_SSL_SETUP_README.md) - Maintenance section
- **SSL Setup**: [ssl-certificate-setup.md](./ssl-certificate-setup.md) - Part 6: Certificate Renewal

## File Locations

### Documentation Files

```
docs/deployment/
├── INDEX.md                          # This file
├── dns-migration-guide.md            # 62 pages - GoDaddy migration
├── ssl-certificate-setup.md          # 45 pages - cert-manager setup
├── DNS_SSL_SUMMARY.md                # 18 pages - Quick reference
└── DNS_SSL_DEPLOYMENT_CHECKLIST.md   # 25 pages - Deployment checklist
```

### Infrastructure Files

```
infrastructure/
├── DNS_SSL_SETUP_README.md           # 35 pages - Master setup guide
├── terraform/
│   └── modules/
│       └── dns/
│           ├── main.tf               # DNS resources
│           ├── variables.tf          # Input variables
│           ├── outputs.tf            # Nameservers output
│           └── README.md             # Module documentation
│
└── kubernetes/
    ├── base/
    │   └── ingress.yaml             # Main ingress with TLS
    ├── overlays/
    │   └── staging/
    │       └── ingress-patch.yaml   # Staging ingress
    └── cert-manager/
        ├── cluster-issuers.yaml     # Let's Encrypt config
        └── certificates.yaml        # Certificate resources
```

### Scripts

```
scripts/
├── validate-dns.sh                   # DNS validation
├── monitor-dns-propagation.sh        # Propagation monitoring
└── validate-ssl.sh                   # SSL validation
```

## Document Summaries

### 1. DNS_SSL_SETUP_README.md
**Length**: 35 pages
**Purpose**: Master setup guide
**Audience**: DevOps engineers, Platform engineers
**Contents**:
- Quick start (5 steps)
- Architecture overview
- Component descriptions
- Phase-by-phase setup instructions
- Validation procedures
- Troubleshooting guide
- Maintenance procedures

**When to use**: First-time setup or comprehensive reference

### 2. dns-migration-guide.md
**Length**: 62 pages
**Purpose**: Complete DNS migration from GoDaddy to Azure
**Audience**: Network engineers, DevOps engineers
**Contents**:
- Migration strategy (zero-downtime)
- 6-phase migration process
- GoDaddy nameserver update
- DNS propagation monitoring (24-48 hours)
- Verification and testing
- Rollback procedures
- Troubleshooting

**When to use**: DNS migration from GoDaddy (or any registrar)

### 3. ssl-certificate-setup.md
**Length**: 45 pages
**Purpose**: Comprehensive cert-manager and SSL setup
**Audience**: Kubernetes administrators, DevOps engineers
**Contents**:
- cert-manager installation (Helm)
- ClusterIssuer configuration
- Certificate management
- ACME HTTP-01 challenges
- Certificate renewal automation
- Troubleshooting
- Best practices

**When to use**: Initial SSL setup or cert-manager configuration

### 4. DNS_SSL_SUMMARY.md
**Length**: 18 pages
**Purpose**: Quick reference guide
**Audience**: All technical staff
**Contents**:
- DNS record table
- SSL certificate summary
- Common commands
- Quick validation steps
- Troubleshooting quick fixes
- Maintenance tasks

**When to use**: Daily operations, quick lookups, troubleshooting

### 5. DNS_SSL_DEPLOYMENT_CHECKLIST.md
**Length**: 25 pages
**Purpose**: Detailed deployment checklist
**Audience**: Deployment engineers, Release managers
**Contents**:
- 9 deployment phases
- 150+ verification checkpoints
- Timeline estimates
- Pre/post-deployment tasks
- Sign-off documentation
- Rollback procedures

**When to use**: Actual deployment execution, auditing, documentation

### 6. IMPLEMENTATION_SUMMARY_DNS_SSL.md
**Length**: 20 pages
**Purpose**: Implementation overview and inventory
**Audience**: Management, Technical leads, Auditors
**Contents**:
- Executive summary
- Deliverables overview
- Component details
- Deployment timeline
- Success criteria
- File inventory
- Support resources

**When to use**: Understanding what was implemented, file inventory, management reporting

## Quick Command Reference

### DNS Commands

```bash
# Validate DNS
./scripts/validate-dns.sh applyforus.com --verbose

# Monitor propagation
./scripts/monitor-dns-propagation.sh applyforus.com 60

# Check specific record
dig applyforus.com +short
dig api.applyforus.com +short

# Check nameservers
dig NS applyforus.com +short
```

### SSL Commands

```bash
# Validate SSL
./scripts/validate-ssl.sh applyforus.com --check-k8s

# Check certificate in Kubernetes
kubectl get certificate -n jobpilot
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Test SSL certificate
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -text
```

### Terraform Commands

```bash
# Deploy DNS module
cd infrastructure/terraform
terraform apply -target=module.dns -var-file="terraform.tfvars"

# Get nameservers
terraform output dns_nameservers

# View DNS configuration
terraform show module.dns
```

### Kubernetes Commands

```bash
# Apply cert-manager resources
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml
kubectl apply -f infrastructure/kubernetes/cert-manager/certificates.yaml

# Check cert-manager
kubectl get pods -n cert-manager
kubectl logs -n cert-manager -l app=cert-manager

# Check ingress
kubectl get ingress -n jobpilot
kubectl describe ingress jobpilot-ingress -n jobpilot
```

## Common Workflows

### Workflow 1: Complete First-Time Setup

1. **Preparation** (30 min)
   - Read: DNS_SSL_SETUP_README.md
   - Configure: terraform.tfvars
   - Get: Ingress IP addresses

2. **DNS Deployment** (30 min)
   - Deploy: Terraform DNS module
   - Verify: Test with Azure nameservers
   - Document: Save nameservers

3. **DNS Migration** (15 min active + 24-48 hours propagation)
   - Update: GoDaddy nameservers
   - Monitor: DNS propagation
   - Verify: Global resolution

4. **cert-manager Setup** (15 min)
   - Install: cert-manager via Helm
   - Deploy: ClusterIssuers
   - Verify: Installation

5. **SSL Certificates** (20 min)
   - Test: Staging issuer
   - Deploy: Production certificates
   - Verify: SSL works

6. **Validation** (30 min)
   - Run: All validation scripts
   - Test: SSL Labs
   - Document: Results

**Total**: ~2 hours active + 24-48 hours DNS propagation

### Workflow 2: Update DNS Records

1. Edit: `infrastructure/terraform/terraform.tfvars`
2. Plan: `terraform plan -target=module.dns`
3. Apply: `terraform apply -target=module.dns`
4. Verify: `./scripts/validate-dns.sh applyforus.com`

**Total**: 10-15 minutes

### Workflow 3: Renew SSL Certificate Manually

1. Delete: `kubectl delete certificate applyforus-tls-cert -n jobpilot`
2. Watch: `kubectl get certificate -n jobpilot -w`
3. Verify: `./scripts/validate-ssl.sh applyforus.com`

**Total**: 5-10 minutes

## Support Resources

### Internal Documentation
- All guides in `docs/deployment/`
- Terraform module: `infrastructure/terraform/modules/dns/README.md`
- Setup guide: `infrastructure/DNS_SSL_SETUP_README.md`

### External Documentation
- [Azure DNS Documentation](https://docs.microsoft.com/en-us/azure/dns/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [NGINX Ingress Documentation](https://kubernetes.github.io/ingress-nginx/)

### Tools
- [DNS Propagation Checker](https://www.whatsmydns.net/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [Certificate Transparency](https://crt.sh/)

### Support Contacts
- **Platform Team**: devops@applyforus.com
- **Infrastructure**: infrastructure@applyforus.com

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-01-20 | Initial creation | DevOps Team |

---

**Last Updated**: January 20, 2024
**Maintained By**: DevOps Team
**Next Review**: February 20, 2024
