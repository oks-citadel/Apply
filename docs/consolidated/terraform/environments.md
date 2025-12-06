# Environments Configuration Guide

Complete guide for configuring and managing Azure DevOps Environments for Terraform deployments with approval gates and deployment controls.

## Table of Contents

- [Overview](#overview)
- [Environment Strategy](#environment-strategy)
- [Creating Environments](#creating-environments)
- [Approval Gates](#approval-gates)
- [Checks and Controls](#checks-and-controls)
- [Deployment Protection](#deployment-protection)
- [Environment Variables](#environment-variables)
- [Monitoring and History](#monitoring-and-history)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Azure DevOps Environments provide deployment targeting, approval workflows, and deployment history tracking. They are essential for:

- **Controlled Deployments**: Multi-stage approval workflows
- **Audit Trail**: Complete deployment history
- **Security Gates**: Automated and manual checks
- **Environment Isolation**: Separate configurations per environment
- **Compliance**: Meet regulatory requirements

### Environment Architecture

```
Pipeline Execution
    ↓
Environment: dev (auto-deploy)
    ↓
Environment: staging (1 approval)
    ↓
Environment: prod (2 approvals + business hours)
    ↓
Deployed Infrastructure
```

## Environment Strategy

### Standard Three-Tier Strategy

```yaml
Development (dev)
├── Purpose: Active development and testing
├── Approval: None (auto-deploy)
├── Hours: 24/7 deployment
├── Rollback: Automatic on failure
└── Monitoring: Basic

Staging (staging)
├── Purpose: Pre-production validation
├── Approval: 1 technical reviewer
├── Hours: Business hours + weekends
├── Rollback: Manual decision
└── Monitoring: Enhanced

Production (prod)
├── Purpose: Live customer environment
├── Approval: 2 approvals (tech + business)
├── Hours: Business hours only
├── Rollback: Immediate on detection
└── Monitoring: Comprehensive + alerting
```

### Multi-Region Strategy (Advanced)

```yaml
Environments:
├── dev
├── staging
├── prod-eastus (primary)
├── prod-westus (secondary)
└── prod-europe (compliance/DR)
```

### Feature Environment Strategy

```yaml
Long-lived:
├── dev
├── staging
├── prod

Ephemeral (per-feature):
├── feature-abc123
├── feature-xyz789
└── (auto-destroyed after merge)
```

## Creating Environments

### Development Environment

**Purpose**: Rapid development and testing with minimal gates

#### Step-by-Step Creation

1. **Navigate to Environments**
   ```
   https://dev.azure.com/{organization}/{project}/_environments
   ```

2. **Create Environment**
   - Click **New environment**
   - Name: `dev`
   - Description: `Development environment - automated deployments for testing`
   - Resource: None (for now)
   - Click **Create**

3. **No Approval Gates Required**
   - Dev environment should auto-deploy
   - Skip approval configuration

4. **Optional: Add Branch Control**
   - Approvals and checks → **+ Add** → **Branch control**
   - Allowed branches: `develop`, `feature/*`
   - This prevents accidental main branch deploys to dev

#### Configuration YAML

```yaml
# In azure-pipelines-terraform.yml
stages:
  - stage: DeployDev
    displayName: 'Deploy to Development'
    jobs:
      - deployment: DeployDevInfra
        displayName: 'Deploy Dev Infrastructure'
        environment: dev  # Reference to environment
        strategy:
          runOnce:
            deploy:
              steps:
                - script: terraform apply -auto-approve
```

### Staging Environment

**Purpose**: Pre-production validation with moderate controls

#### Step-by-Step Creation

1. **Create Environment**
   - Name: `staging`
   - Description: `Staging environment - requires technical approval`
   - Click **Create**

2. **Configure Approvals**
   - Click environment → **Approvals and checks** → **+** → **Approvals**

   **Settings:**
   ```yaml
   Approvers:
     - Tech Lead
     - Senior Developer
     - DevOps Engineer

   Approval type: Any one user
   Timeout: 24 hours

   Instructions for approvers:
     "Review Terraform plan output and validate:
     1. No unexpected resource deletions
     2. Configuration matches requirements
     3. Security configurations are correct
     4. Cost estimate is acceptable

     Approve if all checks pass."
   ```

3. **Advanced Approver Options**
   - ☑ Approvers can approve their own runs: NO
   - ☑ Reassign to approver identity: YES
   - ☑ Minimum approvers required: 1
   - Click **Create**

4. **Add Business Hours Check (Optional for Staging)**
   - **+ Add** → **Business hours**
   ```yaml
   Time zone: (UTC-05:00) Eastern Time (US & Canada)
   Days: Monday - Friday
   Start time: 08:00
   End time: 20:00
   Message: "Staging deployments preferred during extended business hours"
   ```

#### Configuration YAML

```yaml
stages:
  - stage: DeployStaging
    displayName: 'Deploy to Staging'
    dependsOn: DeployDev
    condition: succeeded()
    jobs:
      - deployment: DeployStagingInfra
        displayName: 'Deploy Staging Infrastructure'
        environment: staging  # Requires approval
        strategy:
          runOnce:
            deploy:
              steps:
                - script: terraform apply -auto-approve
```

### Production Environment

**Purpose**: Live environment with maximum protection

#### Step-by-Step Creation

1. **Create Environment**
   - Name: `prod`
   - Description: `Production environment - requires multiple approvals and compliance checks`
   - Click **Create**

2. **Configure Multi-Level Approvals**
   - **Approvals and checks** → **+** → **Approvals**

   **Primary Approval:**
   ```yaml
   Approvers:
     - Infrastructure Team Lead
     - DevOps Manager

   Approval type: All users must approve
   Timeout: 72 hours

   Instructions:
     "PRODUCTION DEPLOYMENT

     Technical Review Required:
     ☐ Terraform plan reviewed and approved
     ☐ No unexpected resource deletions
     ☐ Security scan passed
     ☐ Performance testing completed
     ☐ Rollback plan documented
     ☐ Stakeholders notified
     ☐ Maintenance window confirmed

     Only approve if ALL items are verified."
   ```

3. **Add Business Stakeholder Approval**
   - **+ Add** → **Approvals** (second approval)

   ```yaml
   Approvers:
     - Product Manager
     - Engineering Director

   Approval type: Any one user
   Timeout: 72 hours

   Instructions:
     "Business approval for production deployment.
     Verify business readiness and customer impact."
   ```

4. **Add Business Hours Restriction**
   - **+ Add** → **Business hours**

   ```yaml
   Time zone: (UTC-05:00) Eastern Time (US & Canada)
   Days: Monday - Friday
   Start time: 09:00
   End time: 17:00

   Message: "Production deployments only during business hours (9 AM - 5 PM EST, Mon-Fri)"

   Notes: Ensures support team availability
   ```

5. **Add Invoke Azure Function (Optional)**
   - **+ Add** → **Invoke Azure Function**
   - Automatically run checks before deployment

   ```yaml
   Function URL: https://jobpilot-checks.azurewebsites.net/api/pre-deploy
   Method: POST
   Headers: {"Authorization": "Bearer ${TOKEN}"}
   Body: {"environment": "prod", "pipeline": "$(Build.DefinitionName)"}
   Success criteria: Function returns 200 OK
   Timeout: 5 minutes
   ```

6. **Add Required Template (Optional)**
   - **+ Add** → **Required template**
   - Ensures consistent deployment patterns

   ```yaml
   Template repository: infrastructure-templates
   Template path: /deployment-templates/production.yml
   ```

#### Configuration YAML

```yaml
stages:
  - stage: DeployProduction
    displayName: 'Deploy to Production'
    dependsOn: DeployStaging
    condition: succeeded()
    jobs:
      - deployment: DeployProdInfra
        displayName: 'Deploy Production Infrastructure'
        environment: prod  # Multiple checks required
        strategy:
          runOnce:
            deploy:
              steps:
                - script: terraform apply -auto-approve
```

## Approval Gates

### Types of Approvals

#### 1. Individual Approvals

**Best for**: Small teams, clear ownership

```yaml
Approvers: [user1@company.com, user2@company.com]
Approval type: Any one user
```

**Use Case**: Any team member can approve dev/staging

#### 2. All Must Approve

**Best for**: Critical production changes

```yaml
Approvers: [tech-lead@company.com, manager@company.com]
Approval type: All users must approve
Minimum approvers: 2
```

**Use Case**: Production requires both technical and managerial approval

#### 3. Group-Based Approvals

**Best for**: Team-based approvals

```yaml
Approvers: [Infrastructure-Team, DevOps-Team]
Approval type: Any one user from each group
```

**Use Case**: Requires at least one person from each team

### Approval Configuration Examples

#### Example 1: Standard Production Approval

```yaml
# First approval gate: Technical review
Approvers:
  - Senior DevOps Engineer
  - Infrastructure Architect
Type: Any one user
Timeout: 48 hours

# Second approval gate: Business approval
Approvers:
  - Engineering Manager
  - Product Owner
Type: Any one user
Timeout: 24 hours
```

#### Example 2: Emergency Hotfix Process

```yaml
# Relaxed approval for urgent fixes
Approvers:
  - On-call Engineer
  - DevOps Manager
Type: Any one user
Timeout: 2 hours
Instructions: "EMERGENCY HOTFIX - Expedited approval for critical issues"
```

#### Example 3: Scheduled Maintenance

```yaml
# Stricter approval for scheduled work
Approvers:
  - Infrastructure Team (all members)
Type: All users must approve
Timeout: 1 week
Instructions: "Scheduled maintenance - all team members must review"
```

### Approval Workflow

```
Pipeline Starts
    ↓
Terraform Plan Generated
    ↓
Plan Output Attached to Approval
    ↓
Approvers Notified (Email + Portal)
    ↓
Approvers Review:
  - Plan output
  - Cost estimate
  - Security scan results
  - Test results
    ↓
Decision: Approve / Reject / Reassign
    ↓
If Approved: Continue to deployment
If Rejected: Stop pipeline, notify team
If Timeout: Pipeline fails
```

## Checks and Controls

### Available Check Types

#### 1. Approvals

- Manual human approval
- Most common check
- See [Approval Gates](#approval-gates)

#### 2. Branch Control

**Purpose**: Restrict deployments from specific branches

```yaml
Configuration:
  Allowed branches: main, release/*
  Verify branch protection: Yes
```

**Use Case**: Production only from main branch

**Setup:**
1. Approvals and checks → **+ Add** → **Branch control**
2. Allowed branches: `main`
3. Click **Create**

#### 3. Business Hours

**Purpose**: Time-based deployment restrictions

```yaml
Configuration:
  Time zone: (UTC-05:00) Eastern Time
  Days: Monday - Friday
  Hours: 09:00 - 17:00
```

**Use Case**: Ensure support team availability

#### 4. Invoke Azure Function

**Purpose**: Custom validation logic

**Example Function:**

```javascript
// Azure Function: Pre-deployment validation
module.exports = async function (context, req) {
    const environment = req.body.environment;
    const pipeline = req.body.pipeline;

    // Check 1: No active incidents
    const incidents = await checkIncidents();
    if (incidents.length > 0) {
        context.res = {
            status: 400,
            body: "Active incidents detected. Deployment blocked."
        };
        return;
    }

    // Check 2: Backup completed
    const backupStatus = await checkBackupStatus(environment);
    if (!backupStatus.completed) {
        context.res = {
            status: 400,
            body: "Backup not completed. Deployment blocked."
        };
        return;
    }

    // Check 3: Cost estimate within budget
    const costEstimate = await getTerraformCost(pipeline);
    if (costEstimate > getBudget(environment)) {
        context.res = {
            status: 400,
            body: "Cost exceeds budget. Approval required."
        };
        return;
    }

    // All checks passed
    context.res = {
        status: 200,
        body: "Pre-deployment checks passed"
    };
};
```

**Setup:**
1. Deploy Azure Function
2. Approvals and checks → **+ Add** → **Invoke Azure Function**
3. Function URL: `https://your-function.azurewebsites.net/api/validate`
4. Method: POST
5. Headers: Authentication token
6. Success criteria: 200 status code

#### 5. Invoke REST API

**Purpose**: Call external validation services

**Example: Check PagerDuty for Incidents**

```yaml
URL: https://api.pagerduty.com/incidents
Method: GET
Headers:
  Authorization: Token token=${PAGERDUTY_TOKEN}
  Accept: application/vnd.pagerduty+json;version=2
Success criteria: $.incidents.length == 0
Timeout: 30 seconds
```

#### 6. Query Azure Monitor Alerts

**Purpose**: Check for active alerts before deploying

```yaml
Workspace: Log Analytics Workspace ID
Query: |
  AzureActivity
  | where TimeGenerated > ago(1h)
  | where Level == "Error"
  | summarize count() by ResourceGroup
Success criteria: count == 0
```

#### 7. Required Template

**Purpose**: Enforce deployment patterns

**Setup:**
1. Create template repository with approved patterns
2. Add check referencing template
3. Pipeline must extend template

```yaml
# Required template: deployment-templates/prod.yml
parameters:
  - name: environment
    type: string
  - name: approvalRequired
    type: boolean
    default: true

stages:
  - stage: ValidateTemplate
    jobs:
      - job: Validate
        steps:
          - script: echo "Template validation"

  # Enforced stages
  - template: security-scan.yml
  - template: cost-analysis.yml
```

### Check Configuration Examples

#### Example 1: Production Environment Full Protection

```yaml
Environment: prod

Checks:
  1. Branch Control:
     - Allowed: main
     - Protected: Yes

  2. Business Hours:
     - Days: Mon-Fri
     - Hours: 9AM-5PM EST

  3. Primary Approval:
     - Approvers: Tech Lead, DevOps Lead
     - Type: All must approve

  4. Business Approval:
     - Approvers: Engineering Manager
     - Type: Any one user

  5. Azure Function Check:
     - Function: Pre-deployment validation
     - Checks: Incidents, backups, costs

  6. Query Azure Monitor:
     - Check for active alerts
     - Block if errors in last hour
```

#### Example 2: Staging Environment Moderate Protection

```yaml
Environment: staging

Checks:
  1. Branch Control:
     - Allowed: main, develop

  2. Approval:
     - Approvers: Senior Developers
     - Type: Any one user
     - Timeout: 24 hours
```

#### Example 3: Development Environment Minimal Gates

```yaml
Environment: dev

Checks:
  1. Branch Control:
     - Allowed: develop, feature/*

  # No approvals - auto-deploy
```

## Deployment Protection

### Pre-Deployment Validations

**In Pipeline YAML:**

```yaml
- deployment: DeployProd
  environment: prod
  strategy:
    runOnce:
      preDeploy:
        steps:
          # Validation 1: Check for breaking changes
          - script: |
              terraform plan -detailed-exitcode
              if [ $? -eq 2 ]; then
                echo "Breaking changes detected - review required"
              fi
            displayName: 'Detect Breaking Changes'

          # Validation 2: Cost estimation
          - script: |
              terraform-cost-estimation plan.json
            displayName: 'Estimate Costs'

          # Validation 3: Security scan
          - script: |
              tfsec . --format json --out tfsec-results.json
            displayName: 'Security Scan'

          # Validation 4: Compliance check
          - script: |
              checkov -d . --framework terraform --output json
            displayName: 'Compliance Check'
```

### Deployment Strategies

#### 1. RunOnce (Default)

**Simple deployment, no rollback**

```yaml
strategy:
  runOnce:
    preDeploy:
      steps: []
    deploy:
      steps:
        - script: terraform apply -auto-approve
    routeTraffic:
      steps: []
    postRouteTraffic:
      steps: []
    on:
      failure:
        steps:
          - script: echo "Deployment failed"
      success:
        steps:
          - script: echo "Deployment succeeded"
```

#### 2. Blue-Green (Zero Downtime)

**Deploy to new environment, switch traffic**

```yaml
strategy:
  blueGreen:
    deploy:
      steps:
        - script: |
            # Deploy to green environment
            terraform workspace select green
            terraform apply -auto-approve
    routeTraffic:
      steps:
        - script: |
            # Switch traffic to green
            az network traffic-manager endpoint update \
              --resource-group $RG \
              --profile-name $PROFILE \
              --name green \
              --type azureEndpoints \
              --endpoint-status Enabled
    postRouteTraffic:
      steps:
        - script: |
            # Verify green health
            curl https://green.jobpilot.ai/health
    on:
      failure:
        steps:
          - script: |
            # Rollback to blue
            az network traffic-manager endpoint update \
              --name blue \
              --endpoint-status Enabled
```

#### 3. Canary (Gradual Rollout)

**Deploy to subset, gradually increase**

```yaml
strategy:
  canary:
    increments: [10, 25, 50, 100]
    preDeploy:
      steps:
        - script: terraform plan
    deploy:
      steps:
        - script: |
            # Deploy canary
            terraform apply -auto-approve
    routeTraffic:
      steps:
        - script: |
            # Route $(strategy.increment)% traffic
            az network traffic-manager update \
              --weight $(strategy.increment)
    postRouteTraffic:
      steps:
        - script: |
            # Monitor for 5 minutes
            sleep 300
            # Check error rate
            errors=$(az monitor metrics list --metric ErrorRate)
            if [ $errors -gt 1 ]; then exit 1; fi
    on:
      failure:
        steps:
          - script: |
            # Immediate rollback
            az network traffic-manager update --weight 0
```

### Post-Deployment Verification

```yaml
postRouteTraffic:
  steps:
    # Health checks
    - script: |
        for i in {1..10}; do
          curl -f https://api.jobpilot.ai/health || exit 1
          sleep 10
        done
      displayName: 'Health Check'

    # Smoke tests
    - script: |
        npm run test:smoke
      displayName: 'Smoke Tests'

    # Performance baseline
    - script: |
        artillery quick --count 100 --num 10 https://api.jobpilot.ai
      displayName: 'Performance Test'

    # Notify stakeholders
    - task: SendEmail@1
      inputs:
        to: 'team@jobpilot.ai'
        subject: 'Production Deployment Complete'
        body: 'Deployment to production completed successfully'
```

## Environment Variables

### Environment-Specific Variables

**In Environment Settings:**

1. Navigate to environment → **Variables**
2. Add environment-specific overrides

**Example: prod environment variables**

```yaml
Variables:
  AZURE_LOCATION: eastus
  ENABLE_MONITORING: true
  LOG_LEVEL: info
  RETENTION_DAYS: 90
  BACKUP_ENABLED: true
```

### Using Environment Variables in Pipeline

```yaml
- deployment: DeployProd
  environment: prod
  variables:
    # These automatically include environment variables
  strategy:
    runOnce:
      deploy:
        steps:
          - script: |
              echo "Deploying to: $(AZURE_LOCATION)"
              echo "Monitoring: $(ENABLE_MONITORING)"
            displayName: 'Show Environment Config'
```

## Monitoring and History

### Deployment History

**View deployment history:**
1. Navigate to environment
2. Click **Deployments** tab
3. View:
   - Deployment timestamp
   - Pipeline run
   - Approvers
   - Duration
   - Status

### Tracking and Compliance

**Audit information available:**
- Who initiated deployment
- Who approved (each gate)
- When approvals were given
- Deployment duration
- Success/failure status
- Rollback events

### Exporting History

```bash
# Using Azure DevOps CLI
az pipelines runs list \
  --org https://dev.azure.com/your-org \
  --project your-project \
  --pipeline-ids 123 \
  --status completed \
  --query-order FinishTimeDesc \
  --top 100 \
  --output json > deployment-history.json
```

## Best Practices

### 1. Progressive Complexity

```
Dev → Staging → Prod
No gates → 1 approval → 2 approvals + checks
Auto-deploy → Manual gate → Strict controls
```

### 2. Clear Approval Instructions

**Bad:**
```
"Approve if looks good"
```

**Good:**
```
"Review and verify:
☐ Terraform plan shows expected changes only
☐ No resource deletions unless documented
☐ Security scan passed (see artifacts)
☐ Cost increase < 10% (see cost estimate)
☐ Changelog updated
☐ Rollback plan documented in ticket #123

Approve only if ALL items verified."
```

### 3. Timeout Management

```yaml
Development: No timeout (or 24 hours)
Staging: 24-48 hours
Production: 48-72 hours
Emergency: 2-4 hours
```

### 4. Notification Strategy

**Who to notify:**
- Approvers: Immediate notification
- Team: On approval request
- Stakeholders: On production deployment
- All: On failure

**Notification methods:**
- Email
- Microsoft Teams channel
- PagerDuty (for failures)
- Dashboard updates

### 5. Emergency Procedures

**Create emergency environment:**

```yaml
Environment: prod-emergency

Checks:
  - Approval:
      Approvers: [On-call Engineer, CTO]
      Type: Any one user
      Timeout: 1 hour

  - Branch Control:
      Allowed: main, hotfix/*

Instructions:
  "EMERGENCY DEPLOYMENT

  Use ONLY for critical production issues.
  Normal approval process bypassed.
  Document incident ticket number below.
  Post-deployment review required within 24 hours."
```

### 6. Regular Review

**Quarterly review checklist:**
- [ ] Are approvers still appropriate?
- [ ] Are timeouts reasonable?
- [ ] Are checks still relevant?
- [ ] Any new checks needed?
- [ ] Update documentation

## Troubleshooting

### Issue: Approval Stuck/Not Received

**Solutions:**
1. Check approver email/notifications settings
2. Verify approver has environment permissions
3. Resend approval request manually
4. Check timeout hasn't been reached

### Issue: Business Hours Check Blocking

**Solutions:**
1. Verify timezone configured correctly
2. Check system clock
3. For emergencies, use emergency environment
4. Override (if authorized)

### Issue: Azure Function Check Failing

**Solutions:**
1. Check function logs in Azure Portal
2. Verify function authentication
3. Test function URL manually
4. Review function timeout settings

### Issue: Cannot Edit Environment

**Solutions:**
1. Check user permissions (need Administrator role)
2. Verify in correct project
3. Check organization policies

## Additional Resources

- [Main Setup Guide](./AZURE-DEVOPS-SETUP.md)
- [Variable Groups Guide](./VARIABLE-GROUPS.md)
- [Service Connections Guide](./SERVICE-CONNECTIONS.md)
- [Security Best Practices](./SECURITY-BEST-PRACTICES.md)
- [Azure DevOps Environments Documentation](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/environments)

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** DevOps Team
