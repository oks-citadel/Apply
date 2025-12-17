# Kubernetes Security Policies for ApplyForUs Platform

This directory contains comprehensive security policies and admission control configurations for the ApplyForUs AKS cluster.

## Overview

The security framework implements multiple layers of defense:

1. **CI Security Gates** - Pre-deployment validation
2. **OPA/Gatekeeper Policies** - Runtime admission control
3. **Azure Policies** - Azure-native governance
4. **Image Signing** - Supply chain security with Cosign
5. **SBOM Management** - Software bill of materials tracking

## Table of Contents

- [Directory Structure](#directory-structure)
- [Security Policies](#security-policies)
- [CI Security Gates](#ci-security-gates)
- [Quick Start](#quick-start)
- [Deployment Guide](#deployment-guide)
- [Policy Testing](#policy-testing)
- [Troubleshooting](#troubleshooting)

## Directory Structure

```
policies/
├── azure-policy/              # Azure Policy definitions
│   ├── acr-allowlist-policy.json
│   ├── no-latest-tags-policy.json
│   ├── non-root-containers-policy.json
│   ├── no-privileged-pods-policy.json
│   └── resource-limits-policy.json
├── gatekeeper/
│   ├── constraint-templates/  # OPA Gatekeeper templates
│   │   ├── allowed-repos-template.yaml
│   │   ├── block-latest-tag-template.yaml
│   │   ├── psp-no-privileged-template.yaml
│   │   ├── require-run-as-nonroot-template.yaml
│   │   ├── require-resources-template.yaml
│   │   └── verify-image-signature-template.yaml
│   └── constraints/           # Policy instances
│       ├── acr-allowlist-constraint.yaml
│       ├── block-latest-tag-constraint.yaml
│       ├── no-privileged-constraint.yaml
│       ├── run-as-nonroot-constraint.yaml
│       ├── require-resources-constraint.yaml
│       └── verify-signature-constraint.yaml
├── scripts/                   # Deployment and verification scripts
│   ├── install-gatekeeper.sh
│   ├── deploy-constraint-templates.sh
│   ├── deploy-constraints.sh
│   ├── verify-policies.sh
│   └── deploy-azure-policies.sh
├── ratify-config.yaml        # Image signature verification
└── README.md                 # This file
```

## Security Policies

### 1. ACR Allowlist Policy

**Purpose**: Ensures all container images come from approved registries only.

**Enforcement**:
- Only `applyforusacr.azurecr.io` is allowed
- Blocks images from Docker Hub, Quay, etc.
- Prevents supply chain attacks via unauthorized registries

**Applies to**: All namespaces (applyforus, applyforus-staging, applyforus-dev)

**Example violation**:
```yaml
# This will be DENIED
spec:
  containers:
  - image: docker.io/nginx:latest  # ❌ Not from approved ACR
```

**Compliant example**:
```yaml
# This will be ALLOWED
spec:
  containers:
  - image: applyforusacr.azurecr.io/applyai-web:1.0.0-abc123  # ✅ From approved ACR
```

### 2. No Latest Tags Policy

**Purpose**: Prevents use of `latest` or unversioned image tags for version traceability.

**Enforcement**:
- Blocks `:latest` tag
- Blocks images without any tag
- Requires explicit version tags

**Applies to**: Production and Staging (dev exempted for faster iteration)

**Example violation**:
```yaml
# These will be DENIED
spec:
  containers:
  - image: applyforusacr.azurecr.io/myapp:latest        # ❌ Latest tag
  - image: applyforusacr.azurecr.io/myapp              # ❌ No tag
```

**Compliant example**:
```yaml
# This will be ALLOWED
spec:
  containers:
  - image: applyforusacr.azurecr.io/myapp:1.0.0-abc123  # ✅ Versioned tag
```

### 3. No Privileged Containers Policy

**Purpose**: Prevents containers from running with elevated privileges.

**Enforcement**:
- Blocks `privileged: true` in securityContext
- Prevents host resource access
- Reduces attack surface

**Applies to**: All namespaces

**Example violation**:
```yaml
# This will be DENIED
spec:
  containers:
  - name: app
    securityContext:
      privileged: true  # ❌ Privileged mode
```

**Compliant example**:
```yaml
# This will be ALLOWED
spec:
  containers:
  - name: app
    securityContext:
      allowPrivilegeEscalation: false  # ✅ Not privileged
```

### 4. Require Non-Root Containers Policy

**Purpose**: Enforces that containers run as non-root users.

**Enforcement**:
- Requires `runAsNonRoot: true` OR `runAsUser > 0`
- Blocks containers running as UID 0
- Limits potential damage from container escape

**Applies to**: All namespaces

**Example violation**:
```yaml
# This will be DENIED
spec:
  containers:
  - name: app
    securityContext:
      runAsUser: 0  # ❌ Running as root
```

**Compliant example**:
```yaml
# This will be ALLOWED
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000  # ✅ Non-root user
  containers:
  - name: app
```

### 5. Require Resource Limits Policy

**Purpose**: Ensures all containers have CPU and memory resource requests/limits.

**Enforcement**:
- Requires `resources.requests.cpu`
- Requires `resources.requests.memory`
- Requires `resources.limits.cpu`
- Requires `resources.limits.memory`
- Prevents resource exhaustion and ensures proper scheduling

**Applies to**: All namespaces

**Example violation**:
```yaml
# This will be DENIED
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
    # ❌ No resources defined
```

**Compliant example**:
```yaml
# This will be ALLOWED
spec:
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi  # ✅ Resources defined
```

### 6. Image Signature Verification Policy

**Purpose**: Verifies container images are cryptographically signed.

**Enforcement**:
- Uses Cosign for keyless signature verification
- Integrates with Ratify framework
- Validates signatures via OIDC (GitHub Actions)

**Applies to**: Production namespace only

**Status**: Currently in `dryrun` mode (validation only, no blocking)

## CI Security Gates

### Gate 1: Vulnerability Scanning

**Tools**: Trivy, Grype
**Action**: Fail build on HIGH/CRITICAL vulnerabilities
**Output**: SARIF reports to GitHub Security tab

**Workflow**: `.github/workflows/container-build-sign-scan.yml`

```yaml
- name: Run Trivy scan - FAIL on HIGH/CRITICAL
  uses: aquasecurity/trivy-action@master
  with:
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

### Gate 2: SBOM Generation

**Formats**: SPDX-JSON and CycloneDX-JSON
**Tools**: Trivy, Syft
**Validation**: NTIA compliance checker

**Workflow**: `.github/workflows/sbom-validation.yml`

**Generated artifacts**:
- `sbom-<service>.spdx.json` - SPDX format
- `sbom-<service>.cyclonedx.json` - CycloneDX format

### Gate 3: Image Signing

**Method**: Cosign keyless signing (OIDC)
**Verification**: Certificate-based validation
**Storage**: Signatures stored in ACR alongside images

**Workflow**: `.github/workflows/container-build-sign-scan.yml`

```bash
# Sign image
cosign sign --yes \
  --oidc-issuer=https://token.actions.githubusercontent.com \
  "${IMAGE_REF}"

# Verify signature
cosign verify \
  --certificate-identity-regexp="https://github.com/your-org/Job-Apply-Platform/*" \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \
  "${IMAGE_REF}"
```

## Quick Start

### Prerequisites

- `kubectl` configured for AKS cluster
- `az` CLI logged in to Azure
- Cluster admin permissions

### 1. Install Gatekeeper

```bash
cd infrastructure/kubernetes/policies/scripts
chmod +x *.sh
./install-gatekeeper.sh
```

### 2. Deploy Constraint Templates

```bash
./deploy-constraint-templates.sh
```

### 3. Deploy Constraints (Start with Dry-Run)

```bash
# First, test in dry-run mode
DRY_RUN=true ./deploy-constraints.sh

# After validation, deploy for real
./deploy-constraints.sh
```

### 4. Verify Policies

```bash
./verify-policies.sh
```

### 5. Deploy Azure Policies (Optional)

```bash
export RESOURCE_GROUP=applyforus-rg
export CLUSTER_NAME=applyforus-aks
./deploy-azure-policies.sh
```

## Deployment Guide

### Step-by-Step Deployment

#### 1. Install OPA Gatekeeper

```bash
# Install Gatekeeper v3.15.0
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v3.15.0/deploy/gatekeeper.yaml

# Wait for readiness
kubectl wait --for=condition=available --timeout=300s \
    deployment/gatekeeper-controller-manager -n gatekeeper-system
```

#### 2. Deploy Constraint Templates

Templates define the policy logic using Rego language.

```bash
# Deploy all templates
kubectl apply -f gatekeeper/constraint-templates/

# Verify templates
kubectl get constrainttemplates
```

Expected output:
```
NAME                          AGE
k8sallowedrepos               1m
k8sblocklatesttag             1m
k8spspnoprivileged           1m
k8spsprequirerunasnonroot    1m
k8srequireresources          1m
k8sverifyimagesignature      1m
```

#### 3. Deploy Constraints

Constraints are instances of templates with specific parameters.

```bash
# Deploy constraints
kubectl apply -f gatekeeper/constraints/

# Verify constraints
kubectl get constraints --all-namespaces
```

#### 4. Test Policies

```bash
# Run automated tests
./scripts/verify-policies.sh

# Manual test: Try to deploy invalid pod
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-invalid
  namespace: applyforus
spec:
  containers:
  - name: nginx
    image: nginx:latest  # Should be blocked
EOF
```

Expected: Admission denied

#### 5. Deploy Image Signature Verification (Optional)

```bash
# Deploy Ratify for signature verification
kubectl apply -f ratify-config.yaml

# Verify Ratify is running
kubectl get pods -n ratify-system
```

### Gradual Rollout Strategy

**Phase 1: Audit Mode (Week 1)**
- Deploy all policies with `enforcementAction: dryrun`
- Monitor violations without blocking
- Fix existing non-compliant workloads

**Phase 2: Enforce in Dev (Week 2)**
- Change enforcement to `deny` for dev namespace
- Test policy enforcement with active development
- Refine exemptions if needed

**Phase 3: Enforce in Staging (Week 3)**
- Enable enforcement in staging namespace
- Validate with production-like workloads

**Phase 4: Enforce in Production (Week 4)**
- Enable enforcement in production namespace
- Full policy enforcement active

### Updating Policies

To update an existing constraint:

```bash
# Edit the constraint file
vim gatekeeper/constraints/acr-allowlist-constraint.yaml

# Apply changes
kubectl apply -f gatekeeper/constraints/acr-allowlist-constraint.yaml

# Verify update
kubectl get constraint acr-allowlist -o yaml
```

## Policy Testing

### Automated Testing

The `verify-policies.sh` script runs 6 automated tests:

1. ✅ ACR Allowlist - Blocks invalid registries
2. ✅ Block Latest Tag - Blocks :latest tags
3. ✅ No Privileged - Blocks privileged containers
4. ✅ Non-Root Required - Blocks root users
5. ✅ Resources Required - Blocks missing resource limits
6. ✅ Valid Pod Allowed - Allows compliant pods

```bash
./scripts/verify-policies.sh
```

### Manual Testing

#### Test ACR Allowlist:
```bash
kubectl apply --dry-run=server -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test
  namespace: applyforus
spec:
  containers:
  - name: nginx
    image: docker.io/nginx:1.21
EOF
```
Expected: Denied

#### Test Compliant Pod:
```bash
kubectl apply --dry-run=server -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: test-valid
  namespace: applyforus
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
  - name: app
    image: applyforusacr.azurecr.io/myapp:1.0.0
    securityContext:
      allowPrivilegeEscalation: false
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
EOF
```
Expected: Allowed

### Viewing Violations

```bash
# Check all constraint violations
kubectl get constraints --all-namespaces -o json | \
  jq -r '.items[] | select(.status.totalViolations > 0) |
    "\(.kind)/\(.metadata.name): \(.status.totalViolations) violations"'

# View specific constraint details
kubectl describe constraint acr-allowlist
```

## Troubleshooting

### Policy Not Blocking Resources

**Symptom**: Invalid resources are being accepted

**Check**:
```bash
# 1. Verify Gatekeeper is running
kubectl get pods -n gatekeeper-system

# 2. Check constraint status
kubectl get constraints --all-namespaces

# 3. Verify enforcement action
kubectl get constraint <name> -o jsonpath='{.spec.enforcementAction}'
```

**Solution**:
- Ensure `enforcementAction: deny` (not `dryrun`)
- Check namespace matching in constraint spec
- Review Gatekeeper logs: `kubectl logs -n gatekeeper-system deployment/gatekeeper-controller-manager`

### Valid Resources Being Blocked

**Symptom**: Compliant pods are denied admission

**Check**:
```bash
# View detailed error message
kubectl apply -f pod.yaml 2>&1

# Check constraint template logic
kubectl get constrainttemplate <name> -o yaml
```

**Solution**:
- Add exemption to `parameters.exemptImages` if needed
- Adjust namespace exclusions
- Review Rego logic in constraint template

### Gatekeeper Not Installed

**Error**: `error: the server doesn't have a resource type "constrainttemplates"`

**Solution**:
```bash
./scripts/install-gatekeeper.sh
```

### Constraint Template Not Found

**Error**: `unable to recognize "constraint.yaml": no matches for kind "K8sAllowedRepos"`

**Solution**:
```bash
# Deploy constraint templates first
./scripts/deploy-constraint-templates.sh

# Wait for CRDs to be established
sleep 10

# Then deploy constraints
./scripts/deploy-constraints.sh
```

### Image Signature Verification Failing

**Check**:
```bash
# Verify Ratify is running
kubectl get pods -n ratify-system

# Check Ratify logs
kubectl logs -n ratify-system deployment/ratify

# Verify signature manually
cosign verify --certificate-identity-regexp="..." <image>
```

**Solution**:
- Ensure image is signed: `cosign sign <image>`
- Verify OIDC configuration in Ratify
- Check certificate identity matches

## CI/CD Integration

### GitHub Actions Workflows

**Primary Workflow**: `.github/workflows/container-build-sign-scan.yml`

**Security Gates**:
1. Vulnerability scanning (Trivy + Grype)
2. SBOM generation (SPDX + CycloneDX)
3. Image signing (Cosign keyless)

**Usage**:
```yaml
# Triggered on push to main/develop
on:
  push:
    branches: [main, develop]
    paths:
      - 'apps/**'
      - 'services/**'
```

**Artifacts Generated**:
- SARIF vulnerability reports
- SBOM files (2 formats per service)
- Signature attestations
- Security compliance reports

### Required Secrets

```bash
# Azure credentials (OIDC)
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID

# Optional: Storage for SBOM archive
STORAGE_ACCOUNT_NAME
```

## Monitoring and Compliance

### View Policy Compliance Dashboard

```bash
# Azure Portal
# Navigate to: Policy > Compliance
# Filter by: Resource Type = Microsoft.ContainerService/managedClusters
```

### Export Compliance Reports

```bash
# Get policy state
az policy state list --resource "<cluster-id>" --output json > compliance-report.json

# View non-compliant resources
az policy state list --resource "<cluster-id>" --filter "complianceState eq 'NonCompliant'"
```

### Gatekeeper Audit

```bash
# View audit results
kubectl logs -n gatekeeper-system deployment/gatekeeper-audit

# Export violations
kubectl get constraints --all-namespaces -o json > constraint-violations.json
```

## Best Practices

1. **Start with Audit Mode**: Deploy policies in `dryrun` mode first
2. **Gradual Rollout**: Enable enforcement environment by environment
3. **Monitor Violations**: Review audit logs before enforcing
4. **Document Exemptions**: Clearly document why exemptions are needed
5. **Regular Testing**: Run `verify-policies.sh` after any changes
6. **Keep Updated**: Regularly update Gatekeeper and policy definitions
7. **Backup Configurations**: Version control all policy definitions
8. **Security Reviews**: Review policies quarterly for effectiveness

## Support and Resources

- **OPA Gatekeeper**: https://open-policy-agent.github.io/gatekeeper/
- **Azure Policy for AKS**: https://learn.microsoft.com/azure/aks/policy-reference
- **Cosign**: https://docs.sigstore.dev/cosign/overview/
- **Ratify**: https://github.com/deislabs/ratify
- **NTIA SBOM**: https://www.ntia.gov/sbom

## License

Internal use only - ApplyForUs Platform Security Team
