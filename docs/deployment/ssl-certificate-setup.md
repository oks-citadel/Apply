# SSL/TLS Certificate Setup with cert-manager and Let's Encrypt

This guide provides comprehensive instructions for setting up SSL/TLS certificates for the ApplyforUs platform using cert-manager and Let's Encrypt on Azure Kubernetes Service (AKS).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Part 1: cert-manager Installation](#part-1-cert-manager-installation)
- [Part 2: Let's Encrypt Configuration](#part-2-lets-encrypt-configuration)
- [Part 3: Certificate Issuers](#part-3-certificate-issuers)
- [Part 4: Ingress Configuration](#part-4-ingress-configuration)
- [Part 5: Certificate Verification](#part-5-certificate-verification)
- [Part 6: Certificate Renewal](#part-6-certificate-renewal)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

**cert-manager** is a Kubernetes controller that automates the management and issuance of TLS certificates. It integrates with Let's Encrypt to provide free, automated SSL/TLS certificates.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Internet (HTTPS Traffic)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Azure Load Balancer (Public IP)                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│           NGINX Ingress Controller (TLS Termination)         │
│              Certificate: applyforus-tls-cert                │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
   ┌──────────────┐              ┌──────────────┐
   │  cert-manager│              │   Backend    │
   │  Controller  │              │   Services   │
   └──────┬───────┘              └──────────────┘
          │
          ▼
   ┌──────────────┐
   │ Let's Encrypt│
   │ ACME Server  │
   └──────────────┘
```

### Key Components

1. **cert-manager**: Kubernetes controller for certificate management
2. **ClusterIssuer**: Defines how to obtain certificates from Let's Encrypt
3. **Certificate**: Kubernetes resource representing an SSL certificate
4. **Ingress**: Routes traffic and terminates TLS using certificates
5. **Secret**: Stores the actual certificate and private key

### Certificate Domains

| Domain | Purpose | Certificate |
|--------|---------|-------------|
| applyforus.com | Main website | applyforus-tls-cert |
| www.applyforus.com | WWW redirect | applyforus-tls-cert |
| api.applyforus.com | API endpoints | applyforus-tls-cert |
| staging.applyforus.com | Staging environment | staging-tls-cert |

## Prerequisites

### Required Tools

```bash
# Verify kubectl
kubectl version --client

# Verify Helm (for cert-manager installation)
helm version

# Verify cluster access
kubectl cluster-info
kubectl get nodes
```

### Required Access

- [x] AKS cluster admin access
- [x] DNS configured and propagated (see DNS Migration Guide)
- [x] NGINX Ingress Controller installed
- [x] Domain ownership verified

### Pre-Installation Checklist

```bash
# 1. Verify DNS is working
dig applyforus.com +short
dig api.applyforus.com +short

# 2. Verify ingress controller is running
kubectl get svc -n ingress-nginx

# 3. Get ingress public IP
INGRESS_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Ingress IP: $INGRESS_IP"

# 4. Verify DNS points to ingress IP
dig applyforus.com +short | grep $INGRESS_IP
```

## Part 1: cert-manager Installation

### Method 1: Using Helm (Recommended)

```bash
# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Create cert-manager namespace
kubectl create namespace cert-manager

# Install cert-manager CRDs
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.crds.yaml

# Install cert-manager using Helm
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.13.3 \
  --set installCRDs=false \
  --set global.leaderElection.namespace=cert-manager

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

### Method 2: Using kubectl (Manual)

```bash
# Create namespace
kubectl create namespace cert-manager

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml

# Verify installation
kubectl get all -n cert-manager
```

### Verify Installation

```bash
# Check cert-manager pods are running
kubectl get pods -n cert-manager

# Check cert-manager CRDs are installed
kubectl get crd | grep cert-manager

# Expected CRDs:
# - certificaterequests.cert-manager.io
# - certificates.cert-manager.io
# - challenges.acme.cert-manager.io
# - clusterissuers.cert-manager.io
# - issuers.cert-manager.io
# - orders.acme.cert-manager.io

# Test cert-manager is working
kubectl describe deployment cert-manager -n cert-manager
```

### Configure RBAC (if needed)

If using custom service accounts:

```yaml
# cert-manager-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cert-manager
  namespace: cert-manager
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cert-manager
rules:
- apiGroups: ["cert-manager.io"]
  resources: ["certificates", "certificaterequests", "orders", "challenges"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["create", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cert-manager
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cert-manager
subjects:
- kind: ServiceAccount
  name: cert-manager
  namespace: cert-manager
```

Apply RBAC configuration:
```bash
kubectl apply -f cert-manager-rbac.yaml
```

## Part 2: Let's Encrypt Configuration

### Understanding Let's Encrypt Environments

Let's Encrypt provides two environments:

| Environment | Purpose | Rate Limits | Use Case |
|-------------|---------|-------------|----------|
| **Staging** | Testing | Generous | Development, testing |
| **Production** | Real certificates | Strict (50/week) | Production use |

**Important**: Always test with staging first to avoid hitting rate limits!

### ACME Challenge Types

cert-manager supports two challenge types:

1. **HTTP-01 Challenge** (Recommended)
   - Uses HTTP endpoint: `http://domain/.well-known/acme-challenge/`
   - Works with NGINX Ingress
   - Simpler to configure
   - **Limitation**: Cannot issue wildcard certificates

2. **DNS-01 Challenge**
   - Uses TXT records in DNS
   - Supports wildcard certificates
   - Requires DNS provider API access
   - More complex setup

**We'll use HTTP-01 for this setup.**

## Part 3: Certificate Issuers

### ClusterIssuer vs Issuer

- **ClusterIssuer**: Cluster-wide, can issue certificates in any namespace
- **Issuer**: Namespace-specific

**We'll use ClusterIssuer for simplicity.**

### Create Let's Encrypt ClusterIssuers

The ClusterIssuers are already defined in the ingress configuration, but here's the standalone version:

Create: `infrastructure/kubernetes/cert-manager/cluster-issuers.yaml`

```yaml
---
# Let's Encrypt Production ClusterIssuer
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Let's Encrypt production server
    server: https://acme-v02.api.letsencrypt.org/directory

    # Email for certificate expiration notifications
    email: admin@applyforus.com

    # Secret to store ACME account private key
    privateKeySecretRef:
      name: letsencrypt-prod-account-key

    # HTTP-01 challenge solver
    solvers:
    - http01:
        ingress:
          class: nginx
          podTemplate:
            metadata:
              labels:
                app: cert-manager-acme-solver
            spec:
              # Run ACME solver on system node pool
              nodeSelector:
                kubernetes.io/os: linux
              # Security context
              securityContext:
                runAsNonRoot: true
                runAsUser: 1000
                fsGroup: 1000
---
# Let's Encrypt Staging ClusterIssuer (for testing)
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    # Let's Encrypt staging server
    server: https://acme-staging-v02.api.letsencrypt.org/directory

    # Email for certificate expiration notifications
    email: admin@applyforus.com

    # Secret to store ACME account private key
    privateKeySecretRef:
      name: letsencrypt-staging-account-key

    # HTTP-01 challenge solver
    solvers:
    - http01:
        ingress:
          class: nginx
```

Apply the ClusterIssuers:
```bash
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuers.yaml

# Verify ClusterIssuers are created
kubectl get clusterissuer

# Expected output:
# NAME                  READY   AGE
# letsencrypt-prod      True    10s
# letsencrypt-staging   True    10s

# Check ClusterIssuer status
kubectl describe clusterissuer letsencrypt-prod
```

### Configure Email Address

**Important**: Update the email address in ClusterIssuer configuration:

```yaml
spec:
  acme:
    email: admin@applyforus.com  # Change to your email
```

This email receives:
- Certificate expiration warnings
- Let's Encrypt service updates
- Rate limit notifications

## Part 4: Ingress Configuration

### Update Existing Ingress

The ingress configuration is already in place at:
`infrastructure/kubernetes/base/ingress.yaml`

Key annotations for cert-manager:

```yaml
metadata:
  annotations:
    # Use cert-manager for certificate management
    cert-manager.io/cluster-issuer: "letsencrypt-prod"

    # ACME challenge type
    cert-manager.io/acme-challenge-type: "http01"

    # Force SSL redirect
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
```

### Apply Ingress Configuration

```bash
# Apply the ingress
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml

# Verify ingress is created
kubectl get ingress -n jobpilot

# Check ingress details
kubectl describe ingress jobpilot-ingress -n jobpilot
```

### Certificate Resource (Auto-Created)

When you apply the ingress with cert-manager annotations, cert-manager automatically creates a Certificate resource:

```bash
# Check automatically created certificate
kubectl get certificate -n jobpilot

# Expected output:
# NAME                   READY   SECRET                AGE
# applyforus-tls-cert    True    applyforus-tls-cert   5m

# Describe certificate for details
kubectl describe certificate applyforus-tls-cert -n jobpilot
```

### Manual Certificate Creation (Optional)

If you want explicit control, create Certificate resource manually:

Create: `infrastructure/kubernetes/cert-manager/certificates.yaml`

```yaml
---
# Production Certificate for applyforus.com
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: applyforus-tls-cert
  namespace: jobpilot
spec:
  # Secret name to store the certificate
  secretName: applyforus-tls-cert

  # ClusterIssuer to use
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer

  # Common name (primary domain)
  commonName: applyforus.com

  # DNS names covered by certificate (SAN - Subject Alternative Names)
  dnsNames:
  - applyforus.com
  - www.applyforus.com
  - api.applyforus.com

  # Certificate renewal time (30 days before expiry)
  renewBefore: 720h  # 30 days

  # ACME configuration
  acme:
    config:
    - http01:
        ingressClass: nginx
      domains:
      - applyforus.com
      - www.applyforus.com
      - api.applyforus.com
---
# Staging Certificate (for testing)
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: staging-tls-cert
  namespace: jobpilot
spec:
  secretName: staging-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: staging.applyforus.com
  dnsNames:
  - staging.applyforus.com
  renewBefore: 720h
```

Apply certificates:
```bash
kubectl apply -f infrastructure/kubernetes/cert-manager/certificates.yaml

# Watch certificate issuance
kubectl get certificate -n jobpilot -w
```

## Part 5: Certificate Verification

### Check Certificate Status

```bash
# List all certificates
kubectl get certificate -n jobpilot

# Detailed certificate information
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Check certificate events
kubectl get events -n jobpilot --field-selector involvedObject.name=applyforus-tls-cert

# View certificate in secret
kubectl get secret applyforus-tls-cert -n jobpilot -o yaml
```

### Certificate Issuance Process

The certificate issuance follows these steps:

1. **Certificate Request Created**
   ```bash
   kubectl get certificaterequest -n jobpilot
   ```

2. **ACME Order Created**
   ```bash
   kubectl get order -n jobpilot
   ```

3. **ACME Challenge Created**
   ```bash
   kubectl get challenge -n jobpilot
   ```

4. **Challenge Validated** (Let's Encrypt checks `http://domain/.well-known/acme-challenge/`)

5. **Certificate Issued** and stored in Secret

### Monitor Certificate Issuance

```bash
# Watch certificate status
watch kubectl get certificate -n jobpilot

# Follow cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager -f

# Check for errors
kubectl logs -n cert-manager -l app=cert-manager | grep -i error
```

### Test SSL Certificate

```bash
# Test using openssl
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -text

# Check certificate issuer
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -issuer

# Expected output:
# issuer=C = US, O = Let's Encrypt, CN = R3

# Check expiration
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -dates

# Check SAN (Subject Alternative Names)
echo | openssl s_client -connect applyforus.com:443 -servername applyforus.com 2>/dev/null | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"

# Test with curl
curl -v https://applyforus.com 2>&1 | grep -i "SSL\|TLS\|certificate"
```

### Online SSL Testing

- **SSL Labs**: https://www.ssllabs.com/ssltest/analyze.html?d=applyforus.com
  - Comprehensive SSL/TLS analysis
  - Security rating (A+ is best)
  - Protocol and cipher suite analysis

- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
  - Quick certificate validation
  - Expiration date check
  - Chain verification

## Part 6: Certificate Renewal

### Automatic Renewal

cert-manager automatically renews certificates:

- **Renewal Window**: 30 days before expiration (configurable)
- **Check Interval**: Every hour
- **Retry Logic**: Exponential backoff on failures

### Monitor Renewal

```bash
# Check certificate renewal time
kubectl get certificate applyforus-tls-cert -n jobpilot -o jsonpath='{.status.renewalTime}'

# Check when certificate was last renewed
kubectl get certificate applyforus-tls-cert -n jobpilot -o jsonpath='{.status.notAfter}'

# View renewal events
kubectl get events -n jobpilot | grep -i renew
```

### Manual Certificate Renewal

Force renewal (for testing):

```bash
# Delete certificate to trigger re-issuance
kubectl delete certificate applyforus-tls-cert -n jobpilot

# Certificate will be automatically re-created by ingress annotation

# OR delete the secret
kubectl delete secret applyforus-tls-cert -n jobpilot

# cert-manager will automatically re-issue
```

### Renewal Notifications

Set up monitoring alerts for certificate expiration:

```yaml
# certificate-alert.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: certificate-expiry-alerts
  namespace: monitoring
spec:
  groups:
  - name: certificates
    interval: 30s
    rules:
    - alert: CertificateExpiringSoon
      expr: certmanager_certificate_expiration_timestamp_seconds - time() < 604800
      for: 1h
      labels:
        severity: warning
      annotations:
        summary: "Certificate {{ $labels.name }} expiring soon"
        description: "Certificate {{ $labels.name }} in namespace {{ $labels.namespace }} expires in less than 7 days"

    - alert: CertificateExpired
      expr: certmanager_certificate_expiration_timestamp_seconds - time() < 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Certificate {{ $labels.name }} expired"
        description: "Certificate {{ $labels.name }} in namespace {{ $labels.namespace }} has expired"
```

## Troubleshooting

### Issue: Certificate Not Issued

**Symptoms**: Certificate status shows "False" or "Pending"

**Diagnosis**:
```bash
# Check certificate status
kubectl describe certificate applyforus-tls-cert -n jobpilot

# Check certificate request
kubectl get certificaterequest -n jobpilot
kubectl describe certificaterequest <request-name> -n jobpilot

# Check ACME order
kubectl get order -n jobpilot
kubectl describe order <order-name> -n jobpilot

# Check ACME challenge
kubectl get challenge -n jobpilot
kubectl describe challenge <challenge-name> -n jobpilot

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager --tail=100
```

**Common Causes**:

1. **DNS Not Propagated**
   ```bash
   # Verify DNS resolves to ingress IP
   dig applyforus.com +short
   ```

2. **HTTP-01 Challenge Failed**
   ```bash
   # Test ACME challenge endpoint
   curl -v http://applyforus.com/.well-known/acme-challenge/test

   # Should return 404 (endpoint exists) not connection error
   ```

3. **Rate Limit Hit**
   - Let's Encrypt allows 50 certificates per week
   - Use staging environment for testing
   - Check: https://crt.sh/?q=applyforus.com

4. **Ingress Misconfiguration**
   ```bash
   # Verify ingress has correct annotations
   kubectl get ingress jobpilot-ingress -n jobpilot -o yaml | grep cert-manager
   ```

**Solutions**:

```bash
# 1. Switch to staging for testing
# Edit ingress annotation:
cert-manager.io/cluster-issuer: "letsencrypt-staging"

# 2. Delete and retry
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot

# 3. Check firewall rules
# Ensure port 80 is open for HTTP-01 challenge

# 4. Verify NGINX ingress
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Issue: Certificate Shows "Fake LE Intermediate X1"

**Symptoms**: Browser shows certificate from "Fake LE Intermediate"

**Cause**: Using Let's Encrypt staging environment

**Solution**:
```bash
# Switch to production ClusterIssuer
kubectl edit ingress jobpilot-ingress -n jobpilot

# Change annotation to:
# cert-manager.io/cluster-issuer: "letsencrypt-prod"

# Delete staging certificate
kubectl delete certificate applyforus-tls-cert -n jobpilot
kubectl delete secret applyforus-tls-cert -n jobpilot

# Wait for new certificate to be issued (2-5 minutes)
kubectl get certificate -n jobpilot -w
```

### Issue: Browser Shows "Not Secure"

**Diagnosis**:
```bash
# Check if certificate is issued
kubectl get certificate -n jobpilot

# Check ingress TLS configuration
kubectl get ingress jobpilot-ingress -n jobpilot -o yaml | grep -A5 tls

# Test SSL locally
curl -v https://applyforus.com
```

**Causes**:
1. Certificate not yet issued
2. Wrong secret name in ingress
3. Certificate expired
4. Mixed content (HTTP resources on HTTPS page)

### Issue: cert-manager Pods Not Running

```bash
# Check pod status
kubectl get pods -n cert-manager

# Check pod logs
kubectl logs -n cert-manager <pod-name>

# Check events
kubectl get events -n cert-manager

# Reinstall if necessary
helm uninstall cert-manager -n cert-manager
# Wait 30 seconds
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.13.3 \
  --set installCRDs=true
```

## Best Practices

### 1. Always Test with Staging First

```bash
# Use staging for initial testing
cert-manager.io/cluster-issuer: "letsencrypt-staging"

# Switch to production after verification
cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

### 2. Monitor Certificate Expiration

```bash
# Set up alerts for certificates expiring in < 30 days
# Use Prometheus metrics: certmanager_certificate_expiration_timestamp_seconds
```

### 3. Use Appropriate Renewal Windows

```yaml
spec:
  renewBefore: 720h  # 30 days - recommended
```

### 4. Centralize Certificate Management

- Use ClusterIssuer for cluster-wide configuration
- Store certificates in dedicated namespace if needed
- Document all certificates in version control

### 5. Enable Logging and Monitoring

```bash
# Enable cert-manager logging
kubectl logs -n cert-manager -l app=cert-manager -f

# Set up Prometheus monitoring
# Monitor metrics at: http://<cert-manager>:9402/metrics
```

### 6. Secure Private Keys

```yaml
# Certificate secrets are automatically secured
# Ensure RBAC prevents unauthorized access
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: cert-reader
  namespace: jobpilot
rules:
- apiGroups: [""]
  resources: ["secrets"]
  resourceNames: ["applyforus-tls-cert"]
  verbs: ["get"]
```

### 7. Regular Audits

```bash
# Monthly certificate audit
kubectl get certificate --all-namespaces
kubectl get secret --all-namespaces | grep tls

# Verify certificates are valid
for domain in applyforus.com www.applyforus.com api.applyforus.com; do
  echo "Checking $domain"
  echo | openssl s_client -connect $domain:443 -servername $domain 2>/dev/null | openssl x509 -noout -dates
done
```

### 8. Backup Certificates

```bash
# Backup TLS secrets
kubectl get secret applyforus-tls-cert -n jobpilot -o yaml > backup/applyforus-tls-cert-$(date +%Y%m%d).yaml

# Store backups securely (encrypted at rest)
```

## Certificate Lifecycle Summary

```
1. Ingress Created
   ↓
2. cert-manager detects ingress with annotation
   ↓
3. Certificate resource created
   ↓
4. CertificateRequest created
   ↓
5. ACME Order created
   ↓
6. ACME Challenge created
   ↓
7. Challenge pods deployed
   ↓
8. Let's Encrypt validates challenge
   ↓
9. Certificate issued
   ↓
10. Secret created with certificate
    ↓
11. Ingress uses certificate from secret
    ↓
12. Auto-renewal 30 days before expiry
    ↓
    (back to step 4)
```

## Additional Resources

### Documentation

- [cert-manager Official Docs](https://cert-manager.io/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Kubernetes TLS Secrets](https://kubernetes.io/docs/concepts/configuration/secret/#tls-secrets)

### Tools

- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL configuration testing
- [Certificate Transparency Log](https://crt.sh/) - View issued certificates
- [Let's Encrypt Status](https://letsencrypt.status.io/) - Service status

### Scripts

- `scripts/validate-ssl.sh` - SSL certificate validation
- `scripts/renew-certificates.sh` - Manual certificate renewal

## Support

For cert-manager issues:
- GitHub: https://github.com/cert-manager/cert-manager/issues
- Slack: https://cert-manager.io/docs/contributing/slack/

For Let's Encrypt issues:
- Community Forum: https://community.letsencrypt.org/
- Rate Limits: https://letsencrypt.org/docs/rate-limits/

---

**Document Version**: 1.0
**Last Updated**: 2024-01-20
**Maintained By**: DevOps Team
