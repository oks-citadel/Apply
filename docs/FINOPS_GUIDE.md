# ApplyForUs Platform - FinOps Guide

## Overview

This guide provides comprehensive documentation for cost management and financial operations (FinOps) on the ApplyForUs platform. Our FinOps implementation ensures predictable costs, prevents budget overruns, and optimizes resource utilization across all environments.

**Document Status:** Production Ready
**Last Updated:** 2025-12-15
**Owner:** Platform Engineering Team

---

## Table of Contents

1. [Cost Control Architecture](#cost-control-architecture)
2. [Budget Configuration](#budget-configuration)
3. [ACR Image Retention](#acr-image-retention)
4. [Resource Quotas](#resource-quotas)
5. [Scale-to-Zero Schedules](#scale-to-zero-schedules)
6. [Cost Monitoring](#cost-monitoring)
7. [CI/CD Cost Gates](#cicd-cost-gates)
8. [Operational Procedures](#operational-procedures)
9. [Cost Optimization Best Practices](#cost-optimization-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Cost Control Architecture

### Design Principles

1. **Predictability:** Monthly budgets with hard limits
2. **Visibility:** Real-time cost tracking and attribution
3. **Automation:** Automated cleanup and scaling schedules
4. **Prevention:** CI/CD gates to prevent uncontrolled cost increases
5. **Optimization:** Continuous cost optimization recommendations

### Cost Components

| Component | Dev | Staging | Production | Cost Driver |
|-----------|-----|---------|------------|-------------|
| AKS Cluster | $100-200 | $300-500 | $1,500-2,000 | Node count, SKU |
| PostgreSQL | $50-100 | $200-300 | $800-1,000 | SKU, storage, HA |
| Redis Cache | $20-40 | $100-150 | $400-500 | SKU, replication |
| ACR Storage | $20-50 | $50-100 | $100-200 | Image count, size |
| Networking | $50-100 | $100-200 | $300-500 | Load balancers, bandwidth |
| **Total** | **$500** | **$1,000** | **$5,000** | **Monthly budget** |

---

## Budget Configuration

### Monthly Budget Limits

Budgets are enforced via Azure Cost Management with automated alerts:

```yaml
Environments:
  dev:
    monthly_budget: $500 USD
    alert_thresholds: [50%, 75%, 90%, 100%]

  staging:
    monthly_budget: $1,000 USD
    alert_thresholds: [50%, 75%, 90%, 100%]

  prod:
    monthly_budget: $5,000 USD
    alert_thresholds: [50%, 75%, 90%, 100%, 110%]

Subscription:
  total_budget: $10,000 USD
  critical_alerts: [90%, 100%]
```

### Alert Actions

When budget thresholds are reached:

1. **50%** - Information email to team
2. **75%** - Warning email to team and management
3. **90%** - Critical alert, review required
4. **100%** - Budget exceeded, immediate action needed
5. **110%** (prod only) - Emergency cost review

### Budget Configuration Files

- **Terraform:** `infrastructure/terraform/cost-management.tf`
- **Monitoring:** Alerts sent via Azure Monitor Action Groups
- **Recipients:** citadelcloudmanagement@gmail.com

---

## ACR Image Retention

### Retention Policies

Automated cleanup policies prevent ACR storage bloat:

#### Policy 1: Keep Last N Tags
```yaml
Repository: All
Action: Keep last 10 tags
Older tags: Deleted automatically
Frequency: Daily at 2 AM UTC
```

#### Policy 2: Untagged Manifests
```yaml
Target: Untagged manifests
Retention: 30 days
Action: Delete after retention period
Frequency: Daily
```

#### Policy 3: Non-Production Images
```yaml
Target: Images tagged with dev/staging/test
Retention: 90 days
Action: Delete after 90 days
Frequency: Daily
```

### Manual Cleanup

Use the ACR cleanup script for on-demand cleanup:

```bash
# Dry run (preview only)
./scripts/acr-cleanup.sh --acr-name applyforusacr --dry-run

# Execute cleanup, keep last 10 tags
./scripts/acr-cleanup.sh --acr-name applyforusacr --execute --keep-tags 10

# Delete images older than 60 days
./scripts/acr-cleanup.sh --acr-name applyforusacr --execute --older-than 60
```

### Expected Savings

- **Baseline:** ~200GB storage without cleanup = $200/month
- **With policies:** ~50GB storage = $50/month
- **Monthly savings:** $150

---

## Resource Quotas

### Namespace-Level Quotas

Resource quotas prevent runaway resource consumption:

#### Development Environment
```yaml
Namespace: applyforus-dev
CPU Requests: 10 cores max
Memory Requests: 20Gi max
CPU Limits: 20 cores max
Memory Limits: 40Gi max
Pods: 30 max
Storage: 100Gi max
```

#### Staging Environment
```yaml
Namespace: applyforus-staging
CPU Requests: 25 cores max
Memory Requests: 50Gi max
CPU Limits: 50 cores max
Memory Limits: 100Gi max
Pods: 50 max
Storage: 250Gi max
```

#### Production Environment
```yaml
Namespace: applyforus
CPU Requests: 50 cores max
Memory Requests: 100Gi max
CPU Limits: 100 cores max
Memory Limits: 200Gi max
Pods: 100 max
Storage: 500Gi max
LoadBalancers: 5 max  # Expensive resource
```

### Cost Attribution Labels

All resources are tagged for cost tracking:

```yaml
cost-center: "engineering"
business-unit: "product"
cost-owner: "platform-team"
budget-code: "PLATFORM-{ENV}"
criticality: "high|medium|low"
```

### Configuration Files

- **Quotas:** `infrastructure/kubernetes/base/cost-attribution.yaml`
- **Apply:** `kubectl apply -f infrastructure/kubernetes/base/cost-attribution.yaml`

---

## Scale-to-Zero Schedules

### Non-Production Scaling

Automated schedules reduce costs during off-hours:

#### Development Environment

| Schedule | Action | Time (UTC) | Days |
|----------|--------|------------|------|
| Morning Scale-Up | Scale to original replicas | 6:00 AM | Mon-Fri |
| Evening Scale-Down | Scale to 0 replicas | 8:00 PM | Mon-Fri |
| Weekend Scale-Down | Scale to 0 replicas | 8:00 PM | Friday |
| Weekend Scale-Up | Scale to original replicas | 6:00 AM | Monday |

**Downtime:** 14 hours/day weekdays + 48 hours/weekend = 70% downtime
**Monthly savings:** ~$350 (70% of $500 budget)

#### Staging Environment

| Schedule | Action | Time (UTC) | Days |
|----------|--------|------------|------|
| Morning Scale-Up | Scale to original replicas | 5:00 AM | Mon-Fri |
| Evening Scale-Down | Scale to 1 replica | 10:00 PM | Mon-Fri |

**Cost reduction:** ~30% (minimal replicas maintained)
**Monthly savings:** ~$300 (30% of $1,000 budget)

### AKS Node Pool Schedules

For AKS clusters in non-production:

```yaml
Development:
  Stop: 8 PM UTC Mon-Fri + 8 PM Friday (weekend)
  Start: 6 AM UTC Mon-Fri
  System Pool: Scale to 1 node minimum
  User Pools: Scale to 0 nodes

Staging:
  Stop: 10 PM UTC Mon-Fri
  Start: 5 AM UTC Mon-Fri
  System Pool: Scale to 2 nodes
  User Pools: Scale to 1 node
```

### Configuration Files

- **K8s Schedules:** `infrastructure/kubernetes/automation/scale-schedules.yaml`
- **AKS Automation:** `infrastructure/terraform/aks-shutdown-schedule.tf`

### Total Expected Savings

- **Dev scale-to-zero:** $350/month
- **Staging scale-down:** $300/month
- **Total:** $650/month ($7,800/year)

---

## Cost Monitoring

### Real-Time Monitoring

#### Azure Cost Management

Access cost dashboards:
1. Navigate to Azure Portal → Cost Management
2. Select subscription or resource group
3. View cost analysis by:
   - Resource type
   - Environment (tag: Environment)
   - Service
   - Time period

#### Cost Monitoring Script

Run automated cost reports:

```bash
# Summary report for all environments
./scripts/cost-monitoring.sh --report-type summary

# Detailed report for production
./scripts/cost-monitoring.sh --environment prod --report-type detailed

# Generate recommendations
./scripts/cost-monitoring.sh --environment all --report-type summary
```

### Cost Alerts

Configured alerts for anomalies:

1. **ACR Storage Alert**
   - Trigger: Storage > threshold (100GB dev, 500GB staging, 1TB prod)
   - Frequency: Every 6 hours
   - Action: Email notification

2. **AKS Node Count Alert**
   - Trigger: Node count exceeds expected (5 dev, 10 staging, 20 prod)
   - Frequency: Every 15 minutes
   - Action: Email notification

3. **Redis Memory Alert**
   - Trigger: Memory usage > 85%
   - Frequency: Every 5 minutes
   - Action: Email notification (may trigger expensive scale-up)

4. **PostgreSQL Storage Alert**
   - Trigger: Storage > 80%
   - Frequency: Every 30 minutes
   - Action: Email notification

### Monitoring Files

- **Alerts:** `infrastructure/terraform/cost-management.tf`
- **Script:** `scripts/cost-monitoring.sh`

---

## CI/CD Cost Gates

### Cost Validation Workflow

Every PR that modifies infrastructure is automatically validated:

```yaml
Workflow: .github/workflows/cost-validation.yml

Checks:
  1. Terraform Cost Estimation (Infracost)
     - Compare against baseline
     - Reject if >20% increase

  2. Kubernetes Resource Validation
     - Verify resource requests set
     - Check against quotas

  3. ACR Storage Impact
     - Estimate new image storage
     - Verify retention policies active
```

### Cost Threshold

**Maximum allowed cost increase:** 20% per deployment

If exceeded:
- PR check fails
- Review required by Platform Team
- Justification needed for approval

### Cost Estimation Tools

1. **Infracost:** Terraform cost estimation
   - Setup: Requires `INFRACOST_API_KEY` secret
   - Reports: Posted as PR comments

2. **Resource Calculator:** Manual estimation
   - Use Azure Pricing Calculator
   - Document in PR description

### Bypass Procedure (Emergency Only)

To override cost gate:
1. Add label: `override-cost-gate`
2. Require approval from 2 reviewers
3. Document justification in PR
4. Plan for cost reduction in next sprint

---

## Operational Procedures

### Daily Operations

1. **Morning Check (9 AM)**
   - Verify scale-up completed successfully
   - Check for cost anomaly alerts
   - Review overnight budget consumption

2. **Scaling Verification**
   - Dev scales up: 6 AM UTC Mon-Fri
   - Staging scales up: 5 AM UTC Mon-Fri
   - Monitor for failed scaling jobs

### Weekly Operations

1. **Monday Morning**
   - Verify weekend scale-down saved costs
   - Check for any weekend incidents
   - Review cost trend for past week

2. **Friday Afternoon**
   - Review weekly cost consumption
   - Verify scale-down schedules for weekend
   - Plan for next week's budget

### Monthly Operations

1. **Budget Review (1st of month)**
   - Compare actual vs. budget
   - Analyze variances
   - Generate cost attribution report
   - Update forecasts

2. **ACR Cleanup (15th of month)**
   - Run manual ACR cleanup
   - Verify retention policies working
   - Review storage trends

3. **Cost Optimization Review**
   - Identify optimization opportunities
   - Right-size over/under-provisioned resources
   - Review reserved instance opportunities

### Quarterly Operations

1. **FinOps Review**
   - Comprehensive cost analysis
   - ROI assessment
   - Budget planning for next quarter
   - Reserved instance purchases

---

## Cost Optimization Best Practices

### 1. Right-Sizing Resources

**AKS Node Pools:**
- Monitor CPU/memory utilization
- Target: 60-70% average utilization
- Scale down if consistently <50%
- Use Burstable VMs for variable workloads

**PostgreSQL:**
- Dev/Staging: Use Burstable (B-series)
- Production: Use General Purpose with appropriate size
- Monitor IOPS and connection count
- Enable auto-growth for storage

**Redis:**
- Start with smaller SKU
- Monitor memory usage
- Scale up only when needed
- Use Basic tier for non-prod

### 2. Storage Optimization

**ACR:**
- Enable retention policies (automated)
- Delete untagged images regularly
- Use cache rules for base images
- Monitor image sizes

**PostgreSQL:**
- Enable automatic backups only where needed
- Geo-redundant backups only for prod
- Archive old data
- Optimize database indexes

**Kubernetes PVs:**
- Use appropriate storage classes
- Delete orphaned PVCs
- Monitor storage utilization
- Use ephemeral volumes where possible

### 3. Networking Cost Reduction

**Load Balancers:**
- Minimize number of public IPs
- Use Internal Load Balancers where possible
- Consolidate services behind single LB
- Limit to 5 LoadBalancers per environment

**Data Transfer:**
- Use Azure CDN for static content
- Keep traffic within same region
- Minimize cross-region replication
- Use Azure Private Link for internal traffic

### 4. Reserved Instances

For production stable resources:

| Resource | Commitment | Savings |
|----------|-----------|---------|
| AKS Nodes | 1-year reserved VMs | 30-40% |
| PostgreSQL | 1-year reserved | 30-40% |
| Redis Premium | 1-year reserved | 30-40% |

**Recommendation:** Purchase reserved instances after 3 months of stable usage

### 5. Tagging Strategy

Ensure all resources have cost allocation tags:

```yaml
Required Tags:
  - Environment: dev|staging|prod
  - CostCenter: engineering
  - BusinessUnit: product
  - CostOwner: platform-team
  - BudgetCode: PLATFORM-{ENV}
  - Criticality: high|medium|low
```

### 6. Automation

**Automated Actions:**
- Scale-to-zero schedules (enabled)
- ACR image cleanup (enabled)
- Budget alerts (enabled)
- Cost anomaly detection (enabled)

**Manual Review:**
- Monthly budget reconciliation
- Quarterly optimization review
- Annual reserved instance planning

---

## Troubleshooting

### Issue: Budget Exceeded

**Symptoms:**
- Budget alert at 100%+ consumption
- Unexpected cost spike

**Investigation:**
1. Check Azure Cost Analysis for anomalies
2. Review resource changes in last 24-48 hours
3. Check for accidental resource scaling
4. Verify no resources left running after testing

**Resolution:**
1. Identify cost driver (top resource)
2. Scale down or delete unnecessary resources
3. Review and approve additional budget if justified
4. Implement preventive measures

### Issue: Scale-Down Not Working

**Symptoms:**
- Resources still running during off-hours
- Cost savings not realized

**Investigation:**
```bash
# Check CronJob status
kubectl get cronjobs -n applyforus-dev
kubectl get jobs -n applyforus-dev

# Check recent job logs
kubectl logs -n applyforus-dev job/scale-down-weeknight-<timestamp>
```

**Resolution:**
1. Verify ServiceAccount permissions
2. Check CronJob schedule syntax
3. Manually trigger scale-down for testing
4. Review job logs for errors

### Issue: ACR Storage Growing

**Symptoms:**
- ACR storage alert triggered
- Storage cost increasing

**Investigation:**
```bash
# Check ACR storage usage
az acr show-usage -n applyforusacr

# List repositories and tag counts
az acr repository list -n applyforusacr
```

**Resolution:**
1. Run manual ACR cleanup script
2. Verify retention policies active
3. Check for large or unnecessary images
4. Enable cache rules for base images

### Issue: Resource Quota Exceeded

**Symptoms:**
- Pods failing to schedule
- Error: "exceeded quota"

**Investigation:**
```bash
# Check current quota usage
kubectl describe resourcequota -n applyforus-dev

# List all pods and their resources
kubectl top pods -n applyforus-dev
```

**Resolution:**
1. Identify resource-heavy pods
2. Right-size pod resource requests
3. Delete unused deployments
4. Request quota increase if justified

### Issue: Cost Validation Gate Failing

**Symptoms:**
- PR blocked by cost validation
- Infrastructure changes rejected

**Investigation:**
1. Review Infracost report in PR comments
2. Check which resources are driving cost increase
3. Verify if increase is expected

**Resolution:**
1. Optimize resource specifications
2. Use smaller SKUs where appropriate
3. Document justification if increase necessary
4. Request override if critical (2 approvals needed)

---

## Cost Optimization Checklist

### Monthly Review Checklist

- [ ] Review actual vs. budgeted costs for each environment
- [ ] Analyze top 10 most expensive resources
- [ ] Verify ACR retention policies executed
- [ ] Check scale-to-zero schedules ran successfully
- [ ] Identify unused or orphaned resources
- [ ] Review and update resource quotas
- [ ] Generate cost attribution report
- [ ] Document cost optimization opportunities
- [ ] Update budget forecasts

### Quarterly Review Checklist

- [ ] Comprehensive cost trend analysis
- [ ] ROI assessment for all environments
- [ ] Reserved instance opportunity analysis
- [ ] Right-sizing recommendations
- [ ] Storage optimization opportunities
- [ ] Network cost optimization
- [ ] Budget planning for next quarter
- [ ] FinOps strategy review
- [ ] Cost optimization training for team

---

## Additional Resources

### Documentation
- [Azure Cost Management Docs](https://docs.microsoft.com/en-us/azure/cost-management-billing/)
- [Kubernetes Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- [ACR Best Practices](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices)

### Tools
- **Infracost:** https://www.infracost.io/
- **Azure Pricing Calculator:** https://azure.microsoft.com/en-us/pricing/calculator/
- **ACR Purge:** https://aka.ms/acr/purge

### Scripts
- Cost monitoring: `scripts/cost-monitoring.sh`
- ACR cleanup: `scripts/acr-cleanup.sh`

### Support
- Platform Team: citadelcloudmanagement@gmail.com
- Budget Alerts: Sent to registered emails
- Emergency: Follow incident response procedures

---

## Summary

This FinOps implementation provides:

1. **Cost Control:** Monthly budgets with hard limits ($500 dev, $1000 staging, $5000 prod)
2. **ACR Optimization:** Automated cleanup (keep last 10 tags, 30-day retention)
3. **Resource Quotas:** Namespace-level limits prevent overprovisioning
4. **Scale Schedules:** 70% cost reduction in dev, 30% in staging
5. **Cost Gates:** 20% maximum cost increase per deployment
6. **Monitoring:** Real-time alerts and monthly reports
7. **Expected Savings:** $650-950/month ($7,800-11,400/year)

**Status:** All FinOps controls are production-ready and should be applied immediately.

---

**Document Version:** 1.0
**Last Review:** 2025-12-15
**Next Review:** 2026-01-15
