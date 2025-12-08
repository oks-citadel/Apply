# SSL/TLS Certificate Configuration

This guide provides comprehensive instructions for configuring SSL/TLS certificates for the ApplyforUs platform using Let's Encrypt with cert-manager on AKS.

## Overview

The ApplyforUs platform uses:
- **Let's Encrypt**: Free, automated SSL certificates
- **cert-manager**: Kubernetes certificate management
- **Application Gateway**: SSL termination
- **ACME Protocol**: Automated certificate issuance and renewal

## Prerequisites

- Terraform infrastructure deployed
- AKS cluster running
- DNS nameservers configured and propagated
- kubectl configured to access AKS cluster
- Helm installed (version 3.x)

## Architecture

```
Internet → Application Gateway (SSL Termination) → AKS Ingress Controller → Services
           [Let's Encrypt Cert]                    [Optional TLS]
```

## Option 1: Let's Encrypt with cert-manager (Recommended)

### Step 1: Install cert-manager

```bash
# Add Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Create namespace for cert-manager
kubectl create namespace cert-manager

# Install cert-manager
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --version v1.13.0 \
  --set installCRDs=true \
  --set global.leaderElection.namespace=cert-manager

# Verify installation
kubectl get pods --namespace cert-manager
```

### Step 2: Create ClusterIssuer for Let's Encrypt

Create a file `letsencrypt-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    # Production Let's Encrypt server
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@applyforus.com  # Replace with your email
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    # HTTP-01 challenge
    - http01:
        ingress:
          class: nginx
    # DNS-01 challenge (recommended for wildcards)
    - dns01:
        azureDNS:
          subscriptionID: YOUR_SUBSCRIPTION_ID
          resourceGroupName: applyforus-prod-rg
          hostedZoneName: applyforus.com
          # Use managed identity for authentication
          managedIdentity:
            clientID: YOUR_WORKLOAD_IDENTITY_CLIENT_ID
---
# Staging issuer for testing
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: admin@applyforus.com
    privateKeySecretRef:
      name: letsencrypt-staging
    solvers:
    - http01:
        ingress:
          class: nginx
    - dns01:
        azureDNS:
          subscriptionID: YOUR_SUBSCRIPTION_ID
          resourceGroupName: applyforus-prod-rg
          hostedZoneName: applyforus.com
          managedIdentity:
            clientID: YOUR_WORKLOAD_IDENTITY_CLIENT_ID
```

Apply the issuer:
```bash
kubectl apply -f letsencrypt-issuer.yaml
```

### Step 3: Configure Workload Identity for Azure DNS

```bash
# Get AKS OIDC issuer URL
OIDC_ISSUER=$(az aks show --name applyforus-prod-aks \
  --resource-group applyforus-prod-rg \
  --query "oidcIssuerProfile.issuerUrl" -o tsv)

# Create managed identity for cert-manager
az identity create \
  --name certmanager-identity \
  --resource-group applyforus-prod-rg \
  --location eastus

# Get identity details
IDENTITY_CLIENT_ID=$(az identity show \
  --name certmanager-identity \
  --resource-group applyforus-prod-rg \
  --query clientId -o tsv)

IDENTITY_OBJECT_ID=$(az identity show \
  --name certmanager-identity \
  --resource-group applyforus-prod-rg \
  --query principalId -o tsv)

# Assign DNS Zone Contributor role
DNS_ZONE_ID=$(az network dns zone show \
  --name applyforus.com \
  --resource-group applyforus-prod-rg \
  --query id -o tsv)

az role assignment create \
  --role "DNS Zone Contributor" \
  --assignee-object-id $IDENTITY_OBJECT_ID \
  --assignee-principal-type ServicePrincipal \
  --scope $DNS_ZONE_ID

# Create federated identity credential
az identity federated-credential create \
  --name certmanager-federated-identity \
  --identity-name certmanager-identity \
  --resource-group applyforus-prod-rg \
  --issuer $OIDC_ISSUER \
  --subject system:serviceaccount:cert-manager:cert-manager

# Update cert-manager service account
kubectl annotate serviceaccount cert-manager \
  azure.workload.identity/client-id=$IDENTITY_CLIENT_ID \
  --namespace cert-manager

# Restart cert-manager
kubectl rollout restart deployment cert-manager -n cert-manager
```

### Step 4: Request Certificate

Create `certificate.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: applyforus-tls
  namespace: jobpilot
spec:
  secretName: applyforus-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: applyforus.com
  dnsNames:
  - applyforus.com
  - www.applyforus.com
  - api.applyforus.com
  - admin.applyforus.com
```

Apply:
```bash
kubectl apply -f certificate.yaml
```

### Step 5: Verify Certificate

```bash
# Check certificate status
kubectl get certificate -n jobpilot
kubectl describe certificate applyforus-tls -n jobpilot

# Check certificate secret
kubectl get secret applyforus-tls-secret -n jobpilot

# View certificate details
kubectl get secret applyforus-tls-secret -n jobpilot -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -text -noout
```

## Option 2: Azure Managed Certificates

### Using Azure Application Gateway Managed Certificates

Application Gateway can automatically manage SSL certificates:

```hcl
# Add to app-gateway module
resource "azurerm_application_gateway_ssl_certificate" "managed" {
  name                = "${var.resource_prefix}-ssl-cert"
  application_gateway_id = azurerm_application_gateway.main.id

  # Managed certificate (preview feature)
  managed_certificate_name = "applyforus-com"
}
```

**Note**: This feature may require Azure CLI or Portal configuration.

## Option 3: Upload Custom Certificate

### If You Have Existing Certificate

```bash
# Create Kubernetes secret from certificate files
kubectl create secret tls applyforus-tls-secret \
  --cert=path/to/applyforus.com.crt \
  --key=path/to/applyforus.com.key \
  --namespace=jobpilot
```

### Upload to Application Gateway

```bash
# Get resource group and gateway name
RG_NAME="applyforus-prod-rg"
APPGW_NAME="applyforus-prod-appgw"

# Upload certificate
az network application-gateway ssl-cert create \
  --resource-group $RG_NAME \
  --gateway-name $APPGW_NAME \
  --name applyforus-ssl-cert \
  --cert-file path/to/applyforus.com.pfx \
  --cert-password "YourCertPassword"
```

## Configuring Application Gateway SSL

### Update Application Gateway Listener

```bash
# Update HTTPS listener to use SSL certificate
az network application-gateway http-listener update \
  --resource-group applyforus-prod-rg \
  --gateway-name applyforus-prod-appgw \
  --name applyforus-prod-https-listener \
  --frontend-port applyforus-prod-appgw-https-port \
  --ssl-cert applyforus-ssl-cert
```

### Or via Terraform

Update `modules/app-gateway/main.tf`:

```hcl
resource "azurerm_application_gateway" "main" {
  # ... existing configuration ...

  ssl_certificate {
    name     = "${var.resource_prefix}-ssl-cert"
    data     = filebase64("path/to/certificate.pfx")
    password = var.ssl_cert_password
  }

  http_listener {
    name                           = "${var.resource_prefix}-https-listener"
    frontend_ip_configuration_name = "${var.resource_prefix}-appgw-frontend-ip"
    frontend_port_name             = "${var.resource_prefix}-appgw-https-port"
    protocol                       = "Https"
    ssl_certificate_name           = "${var.resource_prefix}-ssl-cert"
    require_sni                    = true
  }
}
```

## Ingress Configuration with TLS

Create or update `ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: applyforus-ingress
  namespace: jobpilot
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - applyforus.com
    - www.applyforus.com
    - api.applyforus.com
    secretName: applyforus-tls-secret
  rules:
  - host: applyforus.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 3000
  - host: api.applyforus.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway
            port:
              number: 4000
```

Apply:
```bash
kubectl apply -f ingress.yaml
```

## Certificate Renewal

### Automatic Renewal with cert-manager

cert-manager automatically renews certificates 30 days before expiration.

Monitor renewal:
```bash
# Watch certificate events
kubectl get events --namespace jobpilot --watch

# Check certificate status
kubectl describe certificate applyforus-tls -n jobpilot
```

### Manual Renewal

```bash
# Force certificate renewal
kubectl delete certificate applyforus-tls -n jobpilot
kubectl apply -f certificate.yaml
```

## Security Best Practices

### 1. TLS Version

Enforce TLS 1.2 or higher:

```yaml
# In Application Gateway
ssl_policy {
  policy_type = "Predefined"
  policy_name = "AppGwSslPolicy20220101"  # TLS 1.2 minimum
}
```

### 2. Cipher Suites

Use strong cipher suites:
- ECDHE-RSA-AES256-GCM-SHA384
- ECDHE-RSA-AES128-GCM-SHA256
- DHE-RSA-AES256-GCM-SHA384

### 3. HSTS (HTTP Strict Transport Security)

Add HSTS header:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/configuration-snippet: |
      more_set_headers "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload";
```

### 4. Certificate Monitoring

Set up alerts for:
- Certificate expiration (< 30 days)
- Certificate validation failures
- Renewal errors

## Troubleshooting

### Issue: Certificate Request Pending

```bash
# Check certificate order status
kubectl describe certificaterequest -n jobpilot

# Check challenge status
kubectl describe challenge -n jobpilot

# View cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager --tail=100
```

**Common Causes**:
- DNS not propagated
- Firewall blocking ACME challenge
- Incorrect Azure DNS permissions

### Issue: DNS-01 Challenge Failing

```bash
# Verify DNS record was created
nslookup -type=TXT _acme-challenge.applyforus.com

# Check Azure DNS records
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output table

# Verify managed identity permissions
az role assignment list \
  --assignee $IDENTITY_OBJECT_ID \
  --scope $DNS_ZONE_ID
```

### Issue: HTTP-01 Challenge Failing

```bash
# Test challenge URL accessibility
curl http://applyforus.com/.well-known/acme-challenge/test

# Check ingress configuration
kubectl get ingress -n jobpilot
kubectl describe ingress applyforus-ingress -n jobpilot

# Verify Application Gateway routes traffic to AKS
```

### Issue: Certificate Renewal Failed

```bash
# Check certificate age
kubectl get certificate applyforus-tls -n jobpilot -o jsonpath='{.status.renewalTime}'

# Force renewal
kubectl delete certificaterequest -n jobpilot --all
kubectl delete challenge -n jobpilot --all

# Delete and recreate certificate
kubectl delete certificate applyforus-tls -n jobpilot
kubectl apply -f certificate.yaml
```

## Testing SSL Configuration

### Command Line Tests

```bash
# Test SSL handshake
openssl s_client -connect applyforus.com:443 -servername applyforus.com

# Check certificate details
echo | openssl s_client -connect applyforus.com:443 2>/dev/null | openssl x509 -noout -text

# Verify certificate chain
openssl s_client -connect applyforus.com:443 -showcerts
```

### Online Tools

- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **SSL Checker**: https://www.sslshopper.com/ssl-checker.html
- **Certificate Decoder**: https://www.sslshopper.com/certificate-decoder.html

### Expected Results

- **Grade**: A or A+ on SSL Labs
- **TLS Version**: 1.2 or 1.3
- **Certificate Chain**: Complete and valid
- **HSTS**: Enabled
- **Forward Secrecy**: Supported

## Wildcard Certificates

To issue wildcard certificates:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: applyforus-wildcard-tls
  namespace: jobpilot
spec:
  secretName: applyforus-wildcard-tls-secret
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  commonName: "*.applyforus.com"
  dnsNames:
  - "*.applyforus.com"
  - applyforus.com
```

**Note**: Wildcard certificates require DNS-01 challenge (HTTP-01 not supported).

## Cost Considerations

- **Let's Encrypt**: Free
- **cert-manager**: Free (open source)
- **Azure DNS**: ~$0.50/zone/month + $0.40/million queries
- **Application Gateway**: Included in gateway costs

## Maintenance Tasks

### Monthly

- Review certificate expiration dates
- Check cert-manager logs for errors
- Verify automatic renewal is working

### Quarterly

- Review SSL/TLS security policies
- Update cert-manager and dependencies
- Test certificate renewal process

### Annually

- Review and update security best practices
- Audit certificate issuance and renewal logs
- Update documentation

## Next Steps

After SSL configuration:
1. Test HTTPS access to all domains
2. Verify HTTP to HTTPS redirect works
3. Check SSL Labs grade
4. Configure Application Insights for SSL monitoring
5. Set up alerts for certificate expiration
6. Update application configuration to use HTTPS URLs
7. Deploy applications to AKS cluster

## References

- **cert-manager Documentation**: https://cert-manager.io/docs/
- **Let's Encrypt**: https://letsencrypt.org/
- **Azure Application Gateway SSL**: https://docs.microsoft.com/en-us/azure/application-gateway/ssl-overview
- **Kubernetes TLS**: https://kubernetes.io/docs/concepts/services-networking/ingress/#tls
