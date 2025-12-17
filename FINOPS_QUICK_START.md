# FinOps Quick Start Guide

## Immediate Actions Required

This guide provides step-by-step instructions to implement cost controls on the ApplyForUs platform.

---

## Prerequisites

- Azure CLI installed and authenticated
- kubectl configured for AKS cluster
- Terraform installed (v1.5.0+)
- Appropriate Azure permissions (Owner or Contributor)

---

## Step 1: Deploy Cost Management Infrastructure (10 minutes)

### 1.1 Apply Terraform Cost Management

```bash
cd infrastructure/terraform

# Initialize if not already done
terraform init

# Plan with cost management enabled
terraform plan -out=tfplan

# Apply cost management configurations
terraform apply tfplan
```

This creates:
- Monthly budgets for each environment
- Cost anomaly alerts
- Budget threshold notifications

### 1.2 Verify Budget Creation

```bash
# Check budgets
az consumption budget list --resource-group jobpilot-dev-rg
az consumption budget list --resource-group jobpilot-staging-rg
az consumption budget list --resource-group jobpilot-prod-rg
```

---

## Step 2: Enable ACR Retention Policies (5 minutes)

### 2.1 Apply ACR Retention Configuration

The retention policies are defined in Terraform. After Step 1, verify:

```bash
# Check ACR task
az acr task list --registry applyforusacr -o table

# Manually run cleanup (dry-run first)
./scripts/acr-cleanup.sh --acr-name applyforusacr --dry-run

# Execute cleanup
./scripts/acr-cleanup.sh --acr-name applyforusacr --execute --keep-tags 10
```

**Expected Result:**
- ACR cleanup task scheduled daily at 2 AM UTC
- Untagged images deleted after 30 days
- Only last 10 tags kept per repository

---

## Step 3: Apply Kubernetes Resource Quotas (5 minutes)

### 3.1 Create Namespace Cost Attribution

```bash
# Apply cost attribution and quotas
kubectl apply -f infrastructure/kubernetes/base/cost-attribution.yaml

# Verify quotas
kubectl get resourcequota -n applyforus-dev
kubectl get resourcequota -n applyforus-staging
kubectl get resourcequota -n applyforus
```

### 3.2 Verify Quota Application

```bash
# Check quota usage
kubectl describe resourcequota applyforus-dev-quota -n applyforus-dev
kubectl describe resourcequota applyforus-staging-quota -n applyforus-staging
kubectl describe resourcequota applyforus-prod-quota -n applyforus
```

---

## Step 4: Enable Scale-to-Zero Schedules (5 minutes)

### 4.1 Apply Scaling CronJobs

```bash
# Deploy scale schedules for dev and staging
kubectl apply -f infrastructure/kubernetes/automation/scale-schedules.yaml

# Verify CronJobs created
kubectl get cronjobs -n applyforus-dev
kubectl get cronjobs -n applyforus-staging
```

**Expected CronJobs:**
- `scale-down-weeknight` (8 PM UTC Mon-Fri)
- `scale-up-morning` (6 AM UTC Mon-Fri)
- `scale-down-weekend` (Friday 8 PM)
- `scale-up-monday` (Monday 6 AM)

### 4.2 Test Manual Scale (Optional)

```bash
# Manually trigger scale-down for testing
kubectl create job --from=cronjob/scale-down-weeknight manual-scale-test -n applyforus-dev

# Check job status
kubectl get jobs -n applyforus-dev

# View logs
kubectl logs -n applyforus-dev job/manual-scale-test
```

---

## Step 5: Configure CI/CD Cost Gates (2 minutes)

### 5.1 Add Infracost Secret

1. Sign up at https://www.infracost.io/ (free for public repos)
2. Get API key
3. Add to GitHub Secrets:

```bash
# Go to: https://github.com/YOUR_ORG/Job-Apply-Platform/settings/secrets/actions
# Add new secret:
Name: INFRACOST_API_KEY
Value: <your-infracost-api-key>
```

### 5.2 Verify Workflow

The workflow is already committed: `.github/workflows/cost-validation.yml`

It will run automatically on PRs that modify:
- `infrastructure/terraform/**`
- `infrastructure/kubernetes/**`
- `.github/workflows/build-images.yml`

---

## Step 6: Set Up Cost Monitoring (5 minutes)

### 6.1 Run Initial Cost Report

```bash
# Make script executable
chmod +x scripts/cost-monitoring.sh

# Run summary report
./scripts/cost-monitoring.sh --environment all --report-type summary
```

### 6.2 Schedule Weekly Reports (Optional)

Add to crontab or Azure Automation:

```bash
# Run every Monday at 9 AM
0 9 * * 1 /path/to/scripts/cost-monitoring.sh --environment all --report-type summary
```

---

## Step 7: Verification Checklist

Verify all components are working:

### 7.1 Budgets
```bash
# Check budget alerts configured
az monitor action-group list --resource-group jobpilot-prod-rg
```
- [ ] Dev budget: $500/month
- [ ] Staging budget: $1,000/month
- [ ] Prod budget: $5,000/month
- [ ] Alert thresholds: 50%, 75%, 90%, 100%

### 7.2 ACR Retention
```bash
# Verify ACR task exists
az acr task show --name jobpilot-dev-acr-cleanup --registry applyforusacr
```
- [ ] Cleanup task scheduled
- [ ] Keep last 10 tags policy
- [ ] 30-day retention for untagged
- [ ] 90-day retention for non-prod

### 7.3 Resource Quotas
```bash
kubectl get resourcequota --all-namespaces
```
- [ ] Dev namespace quota: 10 CPU, 20Gi memory
- [ ] Staging namespace quota: 25 CPU, 50Gi memory
- [ ] Prod namespace quota: 50 CPU, 100Gi memory

### 7.4 Scale Schedules
```bash
kubectl get cronjobs -n applyforus-dev
kubectl get cronjobs -n applyforus-staging
```
- [ ] Dev scale-down: 8 PM UTC weeknights
- [ ] Dev scale-up: 6 AM UTC weekdays
- [ ] Staging scale-down: 10 PM UTC weeknights
- [ ] Staging scale-up: 5 AM UTC weekdays

### 7.5 Cost Gates
- [ ] Infracost API key configured in GitHub Secrets
- [ ] Cost validation workflow enabled
- [ ] 20% cost increase threshold enforced

---

## Expected Cost Savings

| Optimization | Monthly Savings | Annual Savings |
|--------------|-----------------|----------------|
| ACR Cleanup | $50-100 | $600-1,200 |
| Dev Scale-to-Zero | $350 | $4,200 |
| Staging Scale-Down | $300 | $3,600 |
| Right-Sizing | $100-200 | $1,200-2,400 |
| **Total** | **$800-950** | **$9,600-11,400** |

---

## Monitoring and Maintenance

### Daily
- Check scale-up completed successfully (6 AM UTC)
- Review any budget alert emails
- Monitor cost anomalies

### Weekly
- Run cost report: `./scripts/cost-monitoring.sh`
- Review top 5 expensive resources
- Verify scale schedules working

### Monthly
- Budget reconciliation (1st of month)
- ACR cleanup review (15th of month)
- Cost optimization review

### Quarterly
- Comprehensive FinOps review
- Reserved instance analysis
- Budget planning for next quarter

---

## Troubleshooting

### Issue: Budget Not Created
```bash
# Check Terraform state
terraform state list | grep budget

# Re-apply if missing
terraform apply -target=azurerm_consumption_budget_resource_group.environment_budget
```

### Issue: Scale Schedule Not Running
```bash
# Check CronJob
kubectl describe cronjob scale-down-weeknight -n applyforus-dev

# Check recent jobs
kubectl get jobs -n applyforus-dev

# View job logs
kubectl logs -n applyforus-dev job/<job-name>
```

### Issue: ACR Cleanup Failing
```bash
# Check ACR task
az acr task show --name jobpilot-dev-acr-cleanup --registry applyforusacr

# Run manual cleanup
./scripts/acr-cleanup.sh --acr-name applyforusacr --dry-run
```

### Issue: Cost Gate Not Working
1. Verify Infracost API key in GitHub Secrets
2. Check workflow runs: https://github.com/YOUR_ORG/Job-Apply-Platform/actions
3. Review workflow logs for errors

---

## Getting Help

- **Documentation:** `docs/FINOPS_GUIDE.md`
- **Scripts:** `scripts/cost-monitoring.sh`, `scripts/acr-cleanup.sh`
- **Support:** citadelcloudmanagement@gmail.com
- **Azure Portal:** Cost Management + Billing

---

## Next Steps

After completing this quick start:

1. **Review** the full FinOps Guide: `docs/FINOPS_GUIDE.md`
2. **Monitor** costs for 1 week to establish baseline
3. **Optimize** based on cost monitoring reports
4. **Plan** reserved instance purchases after 3 months
5. **Train** team on cost awareness best practices

---

## Summary

You have successfully implemented:

✅ Monthly budgets with automated alerts
✅ ACR image retention and cleanup policies
✅ Namespace-based resource quotas
✅ Scale-to-zero schedules for non-prod
✅ CI/CD cost validation gates
✅ Cost monitoring and reporting

**Expected outcome:** Predictable costs with automated controls preventing budget overruns.

**Status:** Production ready. All costs are now controlled and monitored.

---

**Last Updated:** 2025-12-15
**Version:** 1.0
