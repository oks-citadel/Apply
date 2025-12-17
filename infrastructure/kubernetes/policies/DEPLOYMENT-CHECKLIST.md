# Kubernetes Security Policies - Deployment Checklist

## Pre-Deployment Checklist

### Environment Validation
- [ ] Connected to correct AKS cluster
  ```bash
  kubectl config current-context
  kubectl cluster-info
  ```
- [ ] Cluster admin permissions verified
  ```bash
  kubectl auth can-i create constrainttemplate
  ```
- [ ] Required namespaces exist
  ```bash
  kubectl get namespace applyforus applyforus-staging applyforus-dev
  ```

### Prerequisites Installation
- [ ] kubectl installed (v1.24+)
  ```bash
  kubectl version --client
  ```
- [ ] Azure CLI installed and logged in
  ```bash
  az account show
  ```
- [ ] Scripts are executable
  ```bash
  chmod +x infrastructure/kubernetes/policies/scripts/*.sh
  ```

## Phase 1: Install Gatekeeper (Day 1)

### 1.1 Install OPA Gatekeeper
- [ ] Run installation script
  ```bash
  cd infrastructure/kubernetes/policies/scripts
  ./install-gatekeeper.sh
  ```
- [ ] Verify Gatekeeper pods are running
  ```bash
  kubectl get pods -n gatekeeper-system
  ```
  Expected: 3-5 pods in `Running` state
- [ ] Check Gatekeeper logs for errors
  ```bash
  kubectl logs -n gatekeeper-system deployment/gatekeeper-controller-manager --tail=50
  ```

### 1.2 Verify Installation
- [ ] Gatekeeper CRDs created
  ```bash
  kubectl get crd | grep gatekeeper
  ```
  Expected: ~10 CRDs including `constrainttemplates` and various constraint types
- [ ] Webhook configurations active
  ```bash
  kubectl get validatingwebhookconfigurations | grep gatekeeper
  ```

**Sign-off**: _________________ Date: _______

## Phase 2: Deploy Constraint Templates (Day 1)

### 2.1 Deploy Templates
- [ ] Deploy constraint templates
  ```bash
  ./deploy-constraint-templates.sh
  ```
- [ ] Verify all templates deployed successfully
  ```bash
  kubectl get constrainttemplates
  ```
  Expected: 6 templates
  - k8sallowedrepos
  - k8sblocklatesttag
  - k8spspnoprivileged
  - k8spsprequirerunasnonroot
  - k8srequireresources
  - k8sverifyimagesignature

### 2.2 Validate Templates
- [ ] Check template status
  ```bash
  kubectl get constrainttemplate -o json | jq -r '.items[] | "\(.metadata.name): \(.status.created)"'
  ```
  All should show `true`
- [ ] Review template Rego logic (spot check)
  ```bash
  kubectl get constrainttemplate k8sallowedrepos -o yaml
  ```

**Sign-off**: _________________ Date: _______

## Phase 3: Audit Mode Deployment (Week 1)

### 3.1 Deploy Constraints in Audit Mode
- [ ] Modify constraints to use `dryrun` mode
  ```bash
  # Edit each constraint file
  for f in ../gatekeeper/constraints/*.yaml; do
    sed -i 's/enforcementAction: deny/enforcementAction: dryrun/g' "$f"
  done
  ```
- [ ] Deploy constraints
  ```bash
  ./deploy-constraints.sh
  ```
- [ ] Verify constraints deployed
  ```bash
  kubectl get constraints --all-namespaces
  ```
  Expected: 6 constraints in `dryrun` mode

### 3.2 Monitor Violations (Week 1)
- [ ] Check for violations daily
  ```bash
  kubectl get constraints --all-namespaces -o json | \
    jq -r '.items[] | select(.status.totalViolations > 0) |
      "\(.kind)/\(.metadata.name): \(.status.totalViolations) violations"'
  ```
- [ ] Document all violations
  ```bash
  kubectl get constraints --all-namespaces -o json > violations-week1.json
  ```
- [ ] Create remediation plan for violations
- [ ] Fix non-compliant workloads

**Violations Found**: _______ **Violations Fixed**: _______

**Sign-off**: _________________ Date: _______

## Phase 4: Dev Environment Enforcement (Week 2)

### 4.1 Enable Enforcement in Dev
- [ ] Update constraints for dev namespace
  ```bash
  # Only enforce in applyforus-dev
  kubectl patch constraint acr-allowlist --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  kubectl patch constraint no-privileged-containers --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  kubectl patch constraint require-run-as-nonroot --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  kubectl patch constraint require-resource-limits --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  # Keep block-latest-tag in dryrun for dev
  ```
- [ ] Test with sample deployment
  ```bash
  ./verify-policies.sh
  ```
- [ ] Verify dev team can still deploy compliant workloads
- [ ] Monitor for unexpected blocks

### 4.2 Developer Communication
- [ ] Send notification to dev team about enforcement
- [ ] Provide compliant pod template
- [ ] Schedule knowledge sharing session
- [ ] Create Slack/Teams channel for policy questions

**Issues Encountered**: _______________________________________

**Sign-off**: _________________ Date: _______

## Phase 5: Staging Environment Enforcement (Week 3)

### 5.1 Enable Enforcement in Staging
- [ ] Enable all policies in staging (including latest tag)
  ```bash
  kubectl patch constraint block-latest-tag --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  ```
- [ ] Update staging deployments to use versioned tags
- [ ] Test full deployment pipeline
  ```bash
  # Verify staging deployments comply
  kubectl get pods -n applyforus-staging
  ```
- [ ] Monitor for 48 hours

### 5.2 Validation
- [ ] All staging services running
- [ ] No policy violations
- [ ] CI/CD pipeline working
- [ ] Rollback tested

**Sign-off**: _________________ Date: _______

## Phase 6: Production Enforcement (Week 4)

### 6.1 Pre-Production Validation
- [ ] All production images scanned (no HIGH/CRITICAL vulns)
- [ ] All production images have SBOMs
- [ ] Production images signed (if using signature verification)
- [ ] Production deployments updated with:
  - Versioned tags
  - Non-root users
  - Resource limits
  - Security contexts
- [ ] Dry-run test in production
  ```bash
  kubectl apply --dry-run=server -f infrastructure/kubernetes/production/
  ```

### 6.2 Enable Production Enforcement
- [ ] Maintenance window scheduled
- [ ] Rollback plan documented
- [ ] Enable enforcement
  ```bash
  # Enable all constraints for production
  for constraint in $(kubectl get constraints -o name); do
    kubectl patch $constraint --type=merge -p '{"spec":{"enforcementAction":"deny"}}'
  done
  ```
- [ ] Verify all production pods still running
  ```bash
  kubectl get pods -n applyforus
  ```
- [ ] Monitor metrics and logs for 2 hours
- [ ] Test new deployment
  ```bash
  # Deploy a service and verify it works
  kubectl rollout restart deployment/auth-service -n applyforus
  kubectl rollout status deployment/auth-service -n applyforus
  ```

### 6.3 Post-Deployment Validation
- [ ] No production incidents
- [ ] All services healthy
- [ ] Policy violations = 0
  ```bash
  kubectl get constraints --all-namespaces -o json | \
    jq '.items[] | select(.status.totalViolations > 0) | .metadata.name'
  ```
- [ ] Monitoring and alerting configured

**Sign-off**: _________________ Date: _______

## Phase 7: CI/CD Integration (Week 4-5)

### 7.1 Enable Security Workflows
- [ ] Container build and scan workflow active
  ```bash
  gh workflow enable container-build-sign-scan.yml
  ```
- [ ] SBOM validation workflow active
  ```bash
  gh workflow enable sbom-validation.yml
  ```
- [ ] Verify workflows run successfully
  ```bash
  gh run list --workflow=container-build-sign-scan.yml --limit 5
  ```

### 7.2 Image Signing Setup
- [ ] Cosign installed in CI
- [ ] OIDC authentication configured
- [ ] Test image signing
  ```bash
  # Verify a recent image is signed
  cosign verify --certificate-identity-regexp="..." <image>
  ```
- [ ] Deploy Ratify (signature verification)
  ```bash
  kubectl apply -f ../ratify-config.yaml
  kubectl get pods -n ratify-system
  ```
- [ ] Enable signature verification constraint (audit mode first)
  ```bash
  kubectl patch constraint verify-image-signatures --type=merge \
    -p '{"spec":{"enforcementAction":"dryrun"}}'
  ```

**Sign-off**: _________________ Date: _______

## Phase 8: Azure Policy Integration (Optional - Week 5)

### 8.1 Deploy Azure Policies
- [ ] Azure Policy add-on enabled on AKS
  ```bash
  az aks show --resource-group applyforus-rg --name applyforus-aks \
    --query addonProfiles.azurepolicy.enabled
  ```
- [ ] Deploy custom Azure policies
  ```bash
  export RESOURCE_GROUP=applyforus-rg
  export CLUSTER_NAME=applyforus-aks
  ./deploy-azure-policies.sh
  ```
- [ ] Verify policy assignments
  ```bash
  az policy assignment list --scope "<cluster-resource-id>"
  ```

### 8.2 Validate Azure Policies
- [ ] Policy compliance visible in Azure Portal
- [ ] No conflicts with Gatekeeper policies
- [ ] Compliance reports generated

**Sign-off**: _________________ Date: _______

## Post-Deployment Monitoring (Ongoing)

### Daily Checks
- [ ] Monitor policy violations
  ```bash
  kubectl get constraints --all-namespaces -o json | \
    jq -r '.items[] | select(.status.totalViolations > 0) |
      "\(.kind)/\(.metadata.name): \(.status.totalViolations)"'
  ```
- [ ] Review Gatekeeper audit logs
  ```bash
  kubectl logs -n gatekeeper-system deployment/gatekeeper-audit --tail=100
  ```

### Weekly Checks
- [ ] Review security scan results in GitHub Security tab
- [ ] Audit SBOM compliance reports
- [ ] Check for policy updates
- [ ] Review exemptions (ensure still needed)

### Monthly Checks
- [ ] Update Gatekeeper to latest version
- [ ] Review and update constraint templates
- [ ] Audit policy effectiveness
- [ ] Security team review

## Rollback Procedures

### Emergency: Disable All Policies
```bash
# EMERGENCY ONLY - Disable enforcement
for constraint in $(kubectl get constraints -o name); do
  kubectl patch $constraint --type=merge -p '{"spec":{"enforcementAction":"dryrun"}}'
done

# Verify
kubectl get constraints --all-namespaces -o jsonpath='{.items[*].spec.enforcementAction}'
```

### Disable Specific Policy
```bash
# Disable specific constraint
kubectl patch constraint <constraint-name> --type=merge \
  -p '{"spec":{"enforcementAction":"dryrun"}}'
```

### Uninstall Gatekeeper (Last Resort)
```bash
# WARNING: This removes all policies
kubectl delete -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/v3.15.0/deploy/gatekeeper.yaml
```

## Sign-off Summary

| Phase | Status | Date | Sign-off |
|-------|--------|------|----------|
| 1. Install Gatekeeper | ⬜ | _____ | _________ |
| 2. Deploy Templates | ⬜ | _____ | _________ |
| 3. Audit Mode | ⬜ | _____ | _________ |
| 4. Dev Enforcement | ⬜ | _____ | _________ |
| 5. Staging Enforcement | ⬜ | _____ | _________ |
| 6. Production Enforcement | ⬜ | _____ | _________ |
| 7. CI/CD Integration | ⬜ | _____ | _________ |
| 8. Azure Policy (Optional) | ⬜ | _____ | _________ |

**Final Approval**: ___________________________ Date: __________

**Security Team Lead**: _______________________ Date: __________

**DevOps Lead**: _____________________________ Date: __________

## Notes

Use this section for deployment notes, issues encountered, and resolutions:

```
_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________
```
