# Kubernetes Security Policies - Quick Reference

## One-Command Deployment

```bash
# Complete deployment (recommended for first-time setup)
cd infrastructure/kubernetes/policies/scripts && \
chmod +x *.sh && \
./install-gatekeeper.sh && \
sleep 10 && \
./deploy-constraint-templates.sh && \
sleep 5 && \
./deploy-constraints.sh && \
./verify-policies.sh
```

## Common Commands

### Check Policy Status
```bash
# View all constraints
kubectl get constraints --all-namespaces

# View all constraint templates
kubectl get constrainttemplates

# Check Gatekeeper health
kubectl get pods -n gatekeeper-system
```

### View Violations
```bash
# Show all violations
kubectl get constraints --all-namespaces -o json | \
  jq -r '.items[] | select(.status.totalViolations > 0) |
    "\(.kind)/\(.metadata.name): \(.status.totalViolations) violations"'

# View specific constraint violations
kubectl describe constraint <constraint-name>
```

### Test Policies
```bash
# Quick validation
kubectl apply --dry-run=server -f your-pod.yaml

# Full test suite
./scripts/verify-policies.sh
```

### Emergency: Disable Policy
```bash
# Temporarily disable a constraint (use with caution!)
kubectl patch constraint <constraint-name> \
  --type=merge \
  -p '{"spec":{"enforcementAction":"dryrun"}}'

# Re-enable
kubectl patch constraint <constraint-name> \
  --type=merge \
  -p '{"spec":{"enforcementAction":"deny"}}'
```

## Policy Enforcement Matrix

| Policy | Dev | Staging | Production | Action |
|--------|-----|---------|------------|--------|
| ACR Allowlist | ✅ | ✅ | ✅ | deny |
| No Latest Tags | ⏭️ | ✅ | ✅ | deny |
| No Privileged | ✅ | ✅ | ✅ | deny |
| Non-Root Required | ✅ | ✅ | ✅ | deny |
| Resource Limits | ✅ | ✅ | ✅ | deny |
| Image Signatures | ⏭️ | ⏭️ | 🔍 | dryrun |

Legend: ✅ Enforced | ⏭️ Exempted | 🔍 Audit Only

## Compliant Pod Template

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: compliant-pod
  namespace: applyforus
spec:
  # Pod-level security context
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000

  containers:
  - name: app
    # Use versioned image from approved ACR
    image: applyforusacr.azurecr.io/applyai-service:1.0.0-abc123

    # Container security context
    securityContext:
      allowPrivilegeEscalation: false
      runAsNonRoot: true
      runAsUser: 1000
      capabilities:
        drop:
        - ALL
      readOnlyRootFilesystem: true

    # Required resource limits
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi

    # Health checks
    livenessProbe:
      httpGet:
        path: /health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10

    readinessProbe:
      httpGet:
        path: /ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

## CI/CD Quick Commands

### Build with Security Gates
```bash
# Trigger secure build workflow
gh workflow run container-build-sign-scan.yml

# Check workflow status
gh run list --workflow=container-build-sign-scan.yml
```

### Verify Image Signature
```bash
# Install cosign
curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
chmod +x cosign-linux-amd64
sudo mv cosign-linux-amd64 /usr/local/bin/cosign

# Verify signed image
cosign verify \
  --certificate-identity-regexp="https://github.com/your-org/Job-Apply-Platform/*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  applyforusacr.azurecr.io/applyai-service@sha256:abc123...
```

### Download SBOM
```bash
# From GitHub Actions artifacts
gh run download <run-id> -n sbom-auth-service

# Inspect SBOM
jq . sbom-auth-service.spdx.json | less
```

## Troubleshooting Cheat Sheet

### Problem: Pod rejected by policy
```bash
# 1. Check which policy rejected it
kubectl apply -f pod.yaml 2>&1 | grep "denied by"

# 2. View policy details
kubectl describe constraint <constraint-name>

# 3. Test in dry-run mode
kubectl apply --dry-run=server -f pod.yaml
```

### Problem: Gatekeeper not working
```bash
# Check status
kubectl get pods -n gatekeeper-system
kubectl logs -n gatekeeper-system deployment/gatekeeper-controller-manager

# Restart if needed
kubectl rollout restart deployment/gatekeeper-controller-manager -n gatekeeper-system
```

### Problem: Policy too strict
```bash
# Add exemption
kubectl edit constraint <constraint-name>

# Add to spec.parameters.exemptImages:
spec:
  parameters:
    exemptImages:
    - "applyforusacr.azurecr.io/legacy-app:*"
```

## Security Checklist

### Before Deployment
- [ ] All images from `applyforusacr.azurecr.io`
- [ ] Images have version tags (not `:latest`)
- [ ] Containers run as non-root (`runAsUser: 1000`)
- [ ] No privileged containers
- [ ] Resource requests/limits defined
- [ ] Security contexts configured
- [ ] Images scanned for vulnerabilities
- [ ] SBOMs generated

### Post-Deployment
- [ ] Pods running successfully
- [ ] No policy violations
- [ ] Health checks passing
- [ ] Logs show no security warnings
- [ ] Monitoring alerts configured

## Resource Requirements

### Minimum Resources for Compliant Pods

| Service Type | CPU Request | Memory Request | CPU Limit | Memory Limit |
|--------------|-------------|----------------|-----------|--------------|
| Web Frontend | 100m | 128Mi | 500m | 512Mi |
| API Service | 200m | 256Mi | 1000m | 1Gi |
| Background Worker | 100m | 128Mi | 500m | 512Mi |
| Database Sidecar | 50m | 64Mi | 200m | 256Mi |

## Policy Exemptions

### When to Use Exemptions

**Valid reasons**:
- Legacy applications being migrated
- Third-party components (monitoring agents)
- Temporary debugging scenarios

**How to add**:
```yaml
spec:
  parameters:
    exemptImages:
    - "applyforusacr.azurecr.io/debug-*"  # Prefix matching
    - "mcr.microsoft.com/oss/kubernetes/pause:*"  # External image
```

**Never exempt**:
- Production application containers
- User-facing services
- Services handling sensitive data

## Monitoring URLs

### Azure Portal
- Policy Compliance: https://portal.azure.com/#blade/Microsoft_Azure_Policy/PolicyMenuBlade/Compliance
- AKS Insights: https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.ContainerService%2FmanagedClusters

### GitHub
- Security Tab: https://github.com/your-org/Job-Apply-Platform/security
- Actions: https://github.com/your-org/Job-Apply-Platform/actions

## Support Contacts

- **Security Team**: security@applyforus.com
- **DevOps Team**: devops@applyforus.com
- **On-call Engineer**: Check PagerDuty rotation

## Additional Resources

- [Full Documentation](README.md)
- [Policy Testing Guide](README.md#policy-testing)
- [Troubleshooting Guide](README.md#troubleshooting)
- [CI/CD Integration](README.md#cicd-integration)
