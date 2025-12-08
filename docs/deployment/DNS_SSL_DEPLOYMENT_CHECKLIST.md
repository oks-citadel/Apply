# DNS and SSL/TLS Deployment Checklist

Use this checklist to ensure successful DNS migration and SSL/TLS certificate deployment for the ApplyforUs platform.

## Pre-Deployment Checklist

### Infrastructure Readiness

- [ ] Azure subscription active with sufficient permissions
- [ ] AKS cluster deployed and accessible
- [ ] NGINX Ingress Controller installed and running
- [ ] Ingress has public IP address assigned
- [ ] kubectl configured with cluster access
- [ ] Terraform >= 1.5.0 installed
- [ ] Helm >= 3.0 installed
- [ ] Azure CLI >= 2.50.0 installed

### Domain and DNS

- [ ] Domain `applyforus.com` registered with GoDaddy
- [ ] GoDaddy account credentials available
- [ ] Current DNS records documented
- [ ] No active email services on domain (or MX records documented)
- [ ] Expected downtime window scheduled (if any)

### Tools and Scripts

- [ ] All scripts have execute permissions: `chmod +x scripts/*.sh`
- [ ] `dig` command available for DNS testing
- [ ] `openssl` command available for SSL testing
- [ ] `curl` command available for endpoint testing

## Phase 1: Azure DNS Setup

### Terraform Configuration

- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars`
- [ ] Set `enable_dns_zone = true`
- [ ] Set `domain_name = "applyforus.com"`
- [ ] Get ingress public IP: `kubectl get svc -n ingress-nginx`
- [ ] Set `ingress_public_ip` in terraform.tfvars
- [ ] Set `staging_public_ip` if using separate staging (or set to same as production)
- [ ] Set `enable_staging = true/false` based on requirements
- [ ] Configure `verification_records` if any third-party verifications needed

### Terraform Deployment

- [ ] Navigate to `infrastructure/terraform`
- [ ] Run `terraform init` (if not already initialized)
- [ ] Run `terraform plan -target=module.dns`
- [ ] Review plan carefully - ensure correct IPs and domain
- [ ] Run `terraform apply -target=module.dns`
- [ ] Save nameservers output: `terraform output dns_nameservers > nameservers.txt`
- [ ] Verify nameservers were created (should have 4 Azure DNS nameservers)

### Pre-Migration DNS Verification

- [ ] Get first Azure nameserver: `AZURE_NS=$(cat nameservers.txt | jq -r '.[0]')`
- [ ] Test root domain: `dig @$AZURE_NS applyforus.com +short`
- [ ] Test www: `dig @$AZURE_NS www.applyforus.com +short`
- [ ] Test api: `dig @$AZURE_NS api.applyforus.com +short`
- [ ] Test staging: `dig @$AZURE_NS staging.applyforus.com +short` (if enabled)
- [ ] Verify CAA records: `dig @$AZURE_NS applyforus.com CAA +short`
- [ ] Run validation against Azure NS: `./scripts/validate-dns.sh applyforus.com --azure-ns --verbose`
- [ ] All tests pass ✓

## Phase 2: DNS Migration at GoDaddy

### Pre-Migration Tasks

- [ ] **Optional but Recommended**: Reduce TTL values in GoDaddy to 300 seconds
- [ ] If TTL reduced, wait for old TTL duration before proceeding
- [ ] Document current GoDaddy nameservers: `dig NS applyforus.com +short`
- [ ] Take screenshot of current GoDaddy DNS settings
- [ ] Export DNS zone file from GoDaddy (if available)
- [ ] Notify team about upcoming DNS migration
- [ ] Schedule during low-traffic period if possible

### Nameserver Update

- [ ] Login to GoDaddy: https://dnsmanagement.godaddy.com/
- [ ] Select domain: `applyforus.com`
- [ ] Navigate to Nameservers section
- [ ] Click "Change" → "Custom Nameservers"
- [ ] Enter all 4 Azure DNS nameservers from nameservers.txt
- [ ] Double-check nameservers are correct
- [ ] Save changes
- [ ] **Record timestamp**: _______________
- [ ] Take screenshot of updated nameservers
- [ ] GoDaddy shows confirmation message

### Initial Verification

- [ ] Wait 5-10 minutes for GoDaddy to update
- [ ] Check NS records: `dig NS applyforus.com +short`
- [ ] NS records show Azure DNS nameservers (may take time)
- [ ] Start monitoring: `./scripts/monitor-dns-propagation.sh applyforus.com 60`

### DNS Propagation Monitoring

**Timeline**: 24-48 hours for complete propagation

- [ ] **After 30 minutes**: Check major DNS resolvers
  - [ ] Google (8.8.8.8): `dig @8.8.8.8 applyforus.com +short`
  - [ ] Cloudflare (1.1.1.1): `dig @1.1.1.1 applyforus.com +short`
- [ ] **After 2 hours**: Verify from whatsmydns.net
- [ ] **After 4 hours**: Most resolvers should be updated
- [ ] **After 24 hours**: Check from multiple geographic locations
- [ ] **After 48 hours**: Full global propagation expected

### Post-Migration Verification

- [ ] Run full DNS validation: `./scripts/validate-dns.sh applyforus.com --verbose`
- [ ] Test website: `curl -I http://applyforus.com`
- [ ] Test API: `curl http://api.applyforus.com/api/health`
- [ ] Verify from multiple locations (use whatsmydns.net)
- [ ] All DNS checks pass ✓

## Phase 3: cert-manager Installation

### Installation

- [ ] Add Jetstack Helm repo: `helm repo add jetstack https://charts.jetstack.io`
- [ ] Update Helm repos: `helm repo update`
- [ ] Install cert-manager CRDs:
  ```bash
  kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml
  ```
- [ ] Install cert-manager via Helm:
  ```bash
  helm install cert-manager jetstack/cert-manager \
    --namespace cert-manager \
    --create-namespace \
    --version v1.13.3 \
    --set installCRDs=false
  ```
- [ ] Verify pods: `kubectl get pods -n cert-manager`
- [ ] All 3 pods running (cert-manager, cainjector, webhook)

### Verification

- [ ] Check cert-manager deployment: `kubectl get deployment -n cert-manager`
- [ ] Check CRDs installed: `kubectl get crd | grep cert-manager`
- [ ] View cert-manager logs: `kubectl logs -n cert-manager -l app=cert-manager --tail=50`
- [ ] No errors in logs

## Phase 4: ClusterIssuer Configuration

### Email Configuration

- [ ] Edit `infrastructure/kubernetes/cert-manager/cluster-issuers.yaml`
- [ ] Update email address to your actual email: `admin@applyforus.com`
- [ ] Save changes

### Deployment

- [ ] Apply ClusterIssuers: `kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml`
- [ ] Verify creation: `kubectl get clusterissuer`
- [ ] Expected output: `letsencrypt-prod` and `letsencrypt-staging` both showing `READY: True`
- [ ] Describe production issuer: `kubectl describe clusterissuer letsencrypt-prod`
- [ ] No errors in status

## Phase 5: SSL Certificate - Staging Test

**Important**: Always test with staging first to avoid rate limits!

### Configure for Staging

- [ ] Edit `infrastructure/kubernetes/base/ingress.yaml`
- [ ] Set annotation: `cert-manager.io/cluster-issuer: "letsencrypt-staging"`
- [ ] Verify `secretName: applyforus-tls-cert` is set under `tls` section
- [ ] Ensure all domains listed in `tls.hosts` array

### Deploy Ingress

- [ ] Apply ingress: `kubectl apply -f infrastructure/kubernetes/base/ingress.yaml`
- [ ] Verify ingress created: `kubectl get ingress -n jobpilot`
- [ ] Check ingress has IP address assigned
- [ ] Watch certificate creation: `kubectl get certificate -n jobpilot -w`

### Monitor Certificate Issuance

Timeline: 2-10 minutes

- [ ] **Within 1 minute**: Certificate resource created
- [ ] **Within 2 minutes**: CertificateRequest created
- [ ] **Within 3 minutes**: ACME Order created
- [ ] **Within 5 minutes**: ACME Challenge created and validated
- [ ] **Within 10 minutes**: Certificate issued (READY: True)

### Troubleshooting (if certificate not issued)

- [ ] Check certificate: `kubectl describe certificate applyforus-tls-cert -n jobpilot`
- [ ] Check challenge: `kubectl get challenge -n jobpilot`
- [ ] If challenge exists: `kubectl describe challenge <challenge-name> -n jobpilot`
- [ ] Check cert-manager logs: `kubectl logs -n cert-manager -l app=cert-manager --tail=100`
- [ ] Verify DNS propagated: `dig applyforus.com +short`
- [ ] Test ACME challenge endpoint: `curl http://applyforus.com/.well-known/acme-challenge/test`
- [ ] Port 80 accessible through ingress

### Verify Staging Certificate

- [ ] Certificate shows READY: True: `kubectl get certificate -n jobpilot`
- [ ] Secret created: `kubectl get secret applyforus-tls-cert -n jobpilot`
- [ ] Test in browser (expect security warning - this is normal for staging)
- [ ] Check issuer: `echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer`
- [ ] Issuer shows "Fake LE Intermediate" (correct for staging)

## Phase 6: SSL Certificate - Production

### Switch to Production

- [ ] Edit `infrastructure/kubernetes/base/ingress.yaml`
- [ ] Change annotation: `cert-manager.io/cluster-issuer: "letsencrypt-prod"`
- [ ] Apply changes: `kubectl apply -f infrastructure/kubernetes/base/ingress.yaml`

### Force Certificate Re-issuance

- [ ] Delete staging certificate: `kubectl delete certificate applyforus-tls-cert -n jobpilot`
- [ ] Delete staging secret: `kubectl delete secret applyforus-tls-cert -n jobpilot`
- [ ] Watch new certificate: `kubectl get certificate -n jobpilot -w`
- [ ] Wait for READY: True (2-10 minutes)

### Verify Production Certificate

- [ ] Certificate issued: `kubectl get certificate -n jobpilot`
- [ ] Secret created: `kubectl get secret applyforus-tls-cert -n jobpilot`
- [ ] Check issuer: `echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer`
- [ ] Issuer shows "Let's Encrypt" (not "Fake")
- [ ] Check expiration: `echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -dates`
- [ ] Certificate valid for 90 days

### Browser Testing

- [ ] Open https://applyforus.com in browser
- [ ] Certificate shows as secure (lock icon)
- [ ] No security warnings
- [ ] Certificate details show Let's Encrypt issuer
- [ ] All domains in SAN: applyforus.com, www.applyforus.com, api.applyforus.com

## Phase 7: Comprehensive Validation

### DNS Validation

- [ ] Run DNS validation: `./scripts/validate-dns.sh applyforus.com --verbose`
- [ ] All DNS checks pass
- [ ] Root domain resolves correctly
- [ ] WWW subdomain resolves
- [ ] API subdomain resolves
- [ ] Staging subdomain resolves (if configured)
- [ ] CAA records permit Let's Encrypt

### SSL Validation

- [ ] Run SSL validation: `./scripts/validate-ssl.sh applyforus.com --check-k8s --verbose`
- [ ] All SSL checks pass
- [ ] Certificate valid and trusted
- [ ] TLS 1.2 and 1.3 supported
- [ ] Insecure protocols disabled (SSLv3, TLS 1.0, TLS 1.1)
- [ ] HTTP redirects to HTTPS
- [ ] Security headers configured

### Application Testing

- [ ] Test main website: `curl -I https://applyforus.com`
- [ ] Test WWW: `curl -I https://www.applyforus.com`
- [ ] Test API health: `curl https://api.applyforus.com/api/health`
- [ ] Test staging (if configured): `curl https://staging.applyforus.com`
- [ ] All endpoints return expected responses
- [ ] No SSL errors

### External Validation

- [ ] SSL Labs test: https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
- [ ] Grade A or A+ achieved
- [ ] DNS propagation: https://www.whatsmydns.net/?d=applyforus.com&t=A
- [ ] Global DNS propagation confirmed
- [ ] Certificate transparency: https://crt.sh/?q=applyforus.com
- [ ] Certificate logged in CT logs

## Phase 8: Monitoring and Alerts

### Certificate Monitoring

- [ ] Set up certificate expiration alerts (see SSL setup guide)
- [ ] Configure Prometheus monitoring (if available)
- [ ] Set alert threshold: 30 days before expiration
- [ ] Test alert notification
- [ ] Document renewal procedures

### DNS Monitoring

- [ ] Enable Azure DNS query logging (configured in Terraform)
- [ ] Set up alerts for DNS query failures (if needed)
- [ ] Document DNS update procedures

## Phase 9: Documentation and Handoff

### Documentation

- [ ] Update runbook with actual IP addresses
- [ ] Document nameserver change timestamp
- [ ] Record certificate issuance dates
- [ ] Note any issues encountered and solutions
- [ ] Update team wiki/documentation

### Team Communication

- [ ] Notify team of successful deployment
- [ ] Share validation results
- [ ] Provide links to monitoring dashboards
- [ ] Schedule knowledge transfer session (if needed)

### Cleanup

- [ ] Keep GoDaddy DNS settings for 7 days (rollback safety)
- [ ] After 7 days, can safely ignore GoDaddy DNS
- [ ] Remove any temporary hosts file entries used for testing
- [ ] Clean up old screenshots and temporary files

## Post-Deployment Monitoring (First 30 Days)

### Daily (First Week)

- [ ] Check certificate status: `kubectl get certificate -n jobpilot`
- [ ] Verify HTTPS endpoints accessible
- [ ] Monitor cert-manager logs for errors
- [ ] Check DNS resolution from different locations

### Weekly (First Month)

- [ ] Run full validation: `./scripts/validate-dns.sh applyforus.com --check-ssl --check-app`
- [ ] Review certificate expiration dates
- [ ] Check for any DNS-related issues
- [ ] Verify auto-renewal configuration

### Monthly (Ongoing)

- [ ] SSL Labs test for any security degradation
- [ ] Review DNS query logs in Azure
- [ ] Update cert-manager if new version available
- [ ] Review and update documentation as needed

## Rollback Procedure (If Needed)

### DNS Rollback

If critical issues occur within 48 hours:

- [ ] Login to GoDaddy DNS Management
- [ ] Change nameservers back to GoDaddy defaults
- [ ] Wait 5-30 minutes for propagation
- [ ] Verify DNS resolves to old configuration
- [ ] Monitor application availability

### Certificate Rollback

If certificate issues occur:

- [ ] Switch back to staging issuer temporarily
- [ ] Investigate root cause
- [ ] Fix issues
- [ ] Re-test with staging
- [ ] Switch back to production

## Completion Checklist

- [ ] All DNS records configured and propagated
- [ ] All SSL certificates issued and valid
- [ ] All endpoints accessible via HTTPS
- [ ] Monitoring and alerts configured
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan documented
- [ ] GoDaddy account updated (nameservers)

## Sign-Off

**Deployment Completed By**: _______________
**Date**: _______________
**Time**: _______________

**Verified By**: _______________
**Date**: _______________

**DNS Migration Timestamp**: _______________
**Certificate Issued**: _______________
**All Checks Passed**: [ ] Yes [ ] No

**Notes**:
```
[Record any important observations, issues, or deviations from the plan]
```

---

**Document Version**: 1.0
**Last Updated**: 2024-01-20
**Next Review**: 2024-02-20
