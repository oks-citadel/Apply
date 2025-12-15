# Rollback Procedures - Quick Reference Guide

**Platform:** ApplyForUs Job Application Platform
**Last Updated:** 2025-12-15
**Status:** Production Ready

---

## Table of Contents
1. [Quick Decision Tree](#quick-decision-tree)
2. [Automated Rollback via GitHub Actions](#automated-rollback)
3. [Manual Kubernetes Rollback](#manual-kubernetes-rollback)
4. [Emergency Procedures](#emergency-procedures)
5. [Post-Rollback Verification](#post-rollback-verification)
6. [Incident Documentation](#incident-documentation)

---

## Quick Decision Tree

```
Is there a production incident?
│
├─ YES: Is it affecting users?
│   │
│   ├─ YES: Use EMERGENCY procedure (Section 4)
│   │       ↓
│   │       Manual kubectl rollback (fastest: 2-5 minutes)
│   │
│   └─ NO: Use GitHub Actions rollback (Section 2)
│          ↓
│          Automated workflow (safe: 10-15 minutes)
│
└─ NO: Is this a planned rollback?
    │
    └─ Use GitHub Actions rollback (Section 2)
       Document reason and plan
```

---

## Automated Rollback

### Prerequisites
- GitHub account with write access
- VPN connected (if required)
- Reason for rollback documented

### Steps

#### 1. Navigate to GitHub Actions
```
https://github.com/YOUR-ORG/Job-Apply-Platform/actions/workflows/rollback.yml
```

#### 2. Click "Run workflow"

#### 3. Fill in the form:

| Field | Options | Example |
|-------|---------|---------|
| **Environment** | staging, production | `production` |
| **Target SHA** | Git commit hash (optional) | `a1b2c3d4` or leave empty |
| **Service** | all, web, auth-service, etc. | `all` |
| **Reason** | Text description (required) | `High error rate on login endpoint` |

**Notes:**
- If you leave **Target SHA** empty, it will roll back to the previous commit
- Use **all** services unless you know exactly which service needs rollback
- The **Reason** field is mandatory and will be logged

#### 4. Monitor the Rollback

The workflow will:
1. ✅ Validate the rollback request (1 min)
2. ✅ Create a backup of current state (2 min)
3. ✅ Perform the rollback (5-10 min)
4. ✅ Verify the rollback (3-5 min)
5. ✅ Notify via Slack

**Total Time:** 10-15 minutes

#### 5. Watch for Slack Notifications

You'll receive notifications at these stages:
- ⚠️ Rollback initiated
- ✅ Rollback successful / ❌ Rollback failed
- 📊 Post-rollback status

### Rollback Artifacts

After rollback completes, download the backup:
1. Go to the workflow run
2. Scroll to "Artifacts" section
3. Download `rollback-backup-production-{run-id}`
4. Store in incident documentation

---

## Manual Kubernetes Rollback

### When to Use Manual Rollback
- **Emergency:** Users are actively affected
- **Speed Critical:** Every second counts
- **Automated rollback failed:** Need direct intervention

### Prerequisites
```bash
# 1. Verify you have kubectl installed
kubectl version --client

# 2. Verify Azure CLI is installed
az --version

# 3. Login to Azure
az login

# 4. Set the correct subscription
az account set --subscription "YOUR-SUBSCRIPTION-ID"

# 5. Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks \
  --overwrite-existing

# 6. Verify connection
kubectl get nodes
```

### Quick Rollback Commands

#### Check Current Status
```bash
# See all deployments and their current status
kubectl get deployments -n applyforus

# See rollout history for a specific service
kubectl rollout history deployment/auth-service -n applyforus

# See current image version
kubectl get deployment auth-service -n applyforus -o jsonpath='{.spec.template.spec.containers[0].image}'
```

#### Rollback to Previous Version
```bash
# Rollback auth-service to previous version
kubectl rollout undo deployment/auth-service -n applyforus

# Monitor the rollback
kubectl rollout status deployment/auth-service -n applyforus

# Verify it's working
kubectl get pods -n applyforus -l app=auth-service
```

#### Rollback to Specific Version
```bash
# View revision history
kubectl rollout history deployment/auth-service -n applyforus

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=3 -n applyforus

# Verify
kubectl rollout status deployment/auth-service -n applyforus
```

#### Rollback ALL Services
```bash
#!/bin/bash
# Save this as rollback-all.sh

SERVICES="auth-service user-service job-service resume-service notification-service auto-apply-service analytics-service ai-service orchestrator-service payment-service web"

for service in $SERVICES; do
  echo "Rolling back $service..."

  # Rollback
  kubectl rollout undo deployment/$service -n applyforus

  # Wait for it to complete
  kubectl rollout status deployment/$service -n applyforus --timeout=300s

  echo "✅ $service rolled back"
  sleep 5
done

echo "🎉 All services rolled back"
```

**Run it:**
```bash
chmod +x rollback-all.sh
./rollback-all.sh
```

### Blue-Green Rollback (Frontend Only)

The web frontend uses blue-green deployment. To rollback:

```bash
# 1. Check which deployment is currently active
CURRENT=$(kubectl get service web -n applyforus -o jsonpath='{.spec.selector.version}')
echo "Current active: $CURRENT"

# 2. Determine the other deployment
if [ "$CURRENT" = "blue" ]; then
  ROLLBACK_TO="green"
else
  ROLLBACK_TO="blue"
fi

echo "Rolling back to: $ROLLBACK_TO"

# 3. Switch traffic to the other deployment
kubectl patch service web -n applyforus \
  -p "{\"spec\":{\"selector\":{\"version\":\"$ROLLBACK_TO\"}}}"

# 4. Verify
kubectl get service web -n applyforus -o jsonpath='{.spec.selector.version}'
echo "Rollback complete. Traffic now pointing to: $ROLLBACK_TO"
```

**Time:** 30 seconds (instant traffic switch)

---

## Emergency Procedures

### Level 1: Total Outage (All services down)

**Immediate Actions (0-5 minutes):**

1. **Alert the team**
```bash
# Send emergency alert (use your alerting system)
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🚨 EMERGENCY: Production outage - Rollback initiated by '"$USER"'"}'
```

2. **Quick health check**
```bash
# Check if pods are running
kubectl get pods -n applyforus

# Check for CrashLoopBackOff
kubectl get pods -n applyforus | grep -i crash

# Get recent events
kubectl get events -n applyforus --sort-by='.lastTimestamp' | tail -20
```

3. **Immediate rollback of ALL services**
```bash
# Use the rollback-all.sh script from above
./rollback-all.sh
```

4. **Verify recovery**
```bash
# Check health endpoints
curl -f https://applyforus.com/health
curl -f https://api.applyforus.com/health
```

**Expected Recovery Time:** 5-10 minutes

### Level 2: Partial Outage (Some services failing)

**Immediate Actions (0-3 minutes):**

1. **Identify failing service**
```bash
# Check pod status
kubectl get pods -n applyforus -o wide

# Check which pods are not ready
kubectl get pods -n applyforus | grep -v "Running\|Completed"

# Get logs from failing pod
kubectl logs deployment/[FAILING-SERVICE] -n applyforus --tail=100
```

2. **Rollback specific service**
```bash
# Rollback the failing service
kubectl rollout undo deployment/[FAILING-SERVICE] -n applyforus

# Monitor
kubectl rollout status deployment/[FAILING-SERVICE] -n applyforus
```

3. **Verify recovery**
```bash
# Check if pods are healthy
kubectl get pods -n applyforus -l app=[FAILING-SERVICE]

# Test the endpoint
curl -f https://api.applyforus.com/[service]/health
```

**Expected Recovery Time:** 2-5 minutes

### Level 3: Performance Degradation

**Actions (0-10 minutes):**

1. **Check metrics**
```bash
# Check resource usage
kubectl top pods -n applyforus

# Check node resources
kubectl top nodes

# Check for high restart counts
kubectl get pods -n applyforus -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}' | sort -k2 -rn | head -10
```

2. **Identify problematic deployment**
```bash
# Check recent deployments
kubectl rollout history deployment/[SERVICE] -n applyforus

# Compare with previous version
kubectl diff -f infrastructure/kubernetes/production/[service]-deployment.yaml
```

3. **Rollback if deployment is the cause**
```bash
kubectl rollout undo deployment/[SERVICE] -n applyforus
```

4. **Monitor improvement**
```bash
# Watch pod metrics
watch kubectl top pods -n applyforus

# Check error rates (if you have Prometheus)
# Access your Grafana dashboard
```

---

## Post-Rollback Verification

### Automated Checks
```bash
#!/bin/bash
# Save as verify-rollback.sh

echo "🔍 Verifying rollback..."

# 1. Check all pods are running
NOT_RUNNING=$(kubectl get pods -n applyforus --field-selector=status.phase!=Running --no-headers | wc -l)
if [ $NOT_RUNNING -gt 0 ]; then
  echo "❌ $NOT_RUNNING pods are not running"
  kubectl get pods -n applyforus --field-selector=status.phase!=Running
  exit 1
fi
echo "✅ All pods running"

# 2. Check health endpoints
ENDPOINTS=(
  "https://applyforus.com/health"
  "https://api.applyforus.com/health"
  "https://api.applyforus.com/auth/health"
  "https://api.applyforus.com/jobs/health"
  "https://api.applyforus.com/users/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
  if curl -sf --max-time 10 "$endpoint" > /dev/null; then
    echo "✅ $endpoint is healthy"
  else
    echo "❌ $endpoint is unhealthy"
    exit 1
  fi
done

# 3. Check for high restart counts
HIGH_RESTARTS=$(kubectl get pods -n applyforus -o jsonpath='{range .items[*]}{.status.containerStatuses[0].restartCount}{"\n"}{end}' | awk '$1 > 5' | wc -l)
if [ $HIGH_RESTARTS -gt 0 ]; then
  echo "⚠️ Some pods have high restart counts"
  kubectl get pods -n applyforus -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.containerStatuses[0].restartCount}{"\n"}{end}' | awk '$2 > 5'
fi

# 4. Check recent events for errors
ERRORS=$(kubectl get events -n applyforus --field-selector type=Warning | wc -l)
if [ $ERRORS -gt 5 ]; then
  echo "⚠️ Multiple warning events detected"
  kubectl get events -n applyforus --field-selector type=Warning | tail -5
fi

echo "🎉 Rollback verification complete"
```

### Manual Verification Checklist

- [ ] All pods are in "Running" state
- [ ] All health endpoints return 200 OK
- [ ] No CrashLoopBackOff or ImagePullBackOff errors
- [ ] No excessive restart counts (>3 in last 10 minutes)
- [ ] Error rates are normal in logs
- [ ] Response times are acceptable
- [ ] Critical user flows work (login, job search, apply)
- [ ] Database connections are stable
- [ ] Redis connections are stable
- [ ] External API integrations work (Stripe, OpenAI, SendGrid)

### Smoke Tests

```bash
# Run automated smoke tests
npm run test:smoke -- --environment=production

# Or manually test critical flows
curl -X POST https://api.applyforus.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test123"}'

curl https://api.applyforus.com/jobs?limit=10

curl https://applyforus.com/ | grep -i "ApplyForUs"
```

---

## Incident Documentation

### Immediate Documentation (During Incident)

Create a new file: `incidents/YYYY-MM-DD-incident-brief.md`

```markdown
# Incident Brief: [Date] - [Brief Title]

**Status:** ONGOING / RESOLVED
**Severity:** P0 / P1 / P2
**Started:** [Time]
**Resolved:** [Time]

## Current Situation
[1-2 sentences describing what's happening]

## Impact
- Services affected: [list]
- Users affected: [estimated %]
- Features unavailable: [list]

## Actions Taken
1. [Time] - [Action]
2. [Time] - [Action]

## Rollback Details
- Environment: [staging/production]
- Services rolled back: [list]
- Target version: [SHA or version]
- Initiated by: [name]
- Reason: [brief reason]

## Current Status
[What's the current state?]
```

### Post-Incident Report (Within 24 hours)

Template: `incidents/YYYY-MM-DD-incident-postmortem.md`

```markdown
# Incident Postmortem: [Date] - [Title]

## Summary
[Brief summary of what happened]

## Timeline
| Time | Event |
|------|-------|
| 14:00 | Deployment initiated |
| 14:15 | Error rate spike detected |
| 14:18 | Alert triggered |
| 14:20 | Rollback initiated |
| 14:30 | Services stabilized |
| 14:35 | Incident resolved |

## Impact
- **Duration:** 35 minutes
- **Severity:** P1
- **Services Affected:** auth-service, user-service
- **Users Affected:** ~1,000 users (5% of active users)
- **Revenue Impact:** Estimated $XXX

## Root Cause
[Detailed explanation of what caused the issue]

## Detection
- **How detected:** Automated alert / User report / Monitoring
- **Time to detect:** [minutes]
- **Alert effectiveness:** [Good / Could be improved]

## Resolution
[Detailed steps taken to resolve]

## Rollback Details
- **Method used:** Automated / Manual kubectl
- **Time to rollback:** [minutes]
- **Rollback success:** [Yes / Partial / No]
- **Complications:** [Any issues during rollback]

## What Went Well
1. [Positive point 1]
2. [Positive point 2]

## What Went Wrong
1. [Issue 1]
2. [Issue 2]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | [Name] | [Date] | [ ] |
| [Action 2] | [Name] | [Date] | [ ] |

## Lessons Learned
[Key takeaways]

## Prevention
[How to prevent this in the future]
```

---

## Rollback Success Metrics

Track these metrics to improve rollback procedures:

| Metric | Target | Current |
|--------|--------|---------|
| Time to detect issue | < 5 min | ? |
| Time to decision (rollback/fix forward) | < 2 min | ? |
| Time to complete rollback | < 10 min | ? |
| Rollback success rate | > 95% | ? |
| Post-rollback incidents | 0 | ? |

---

## Contact Information

### Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| DevOps Lead | [Name] | [Phone] | @devops-lead |
| Platform Engineer | [Name] | [Phone] | @platform-eng |
| Engineering Manager | [Name] | [Phone] | @eng-manager |
| On-Call Engineer | [Rotation] | [Pager] | @on-call |

### Communication Channels

- **Slack:** #incidents, #devops-alerts
- **PagerDuty:** [link]
- **Zoom:** [emergency meeting link]

---

## Appendix: Common Rollback Scenarios

### Scenario 1: Database Migration Failure

**Symptoms:**
- Pods crash with database errors
- Logs show "relation does not exist" or schema errors

**Rollback:**
```bash
# 1. Rollback the application
kubectl rollout undo deployment/[SERVICE] -n applyforus

# 2. Rollback the database migration
kubectl exec -it deployment/auth-service -n applyforus -- npm run db:rollback

# 3. Verify
kubectl logs deployment/[SERVICE] -n applyforus --tail=50
```

### Scenario 2: Configuration Error

**Symptoms:**
- Services start but fail health checks
- Logs show configuration errors

**Rollback:**
```bash
# 1. Identify the bad ConfigMap/Secret
kubectl get configmaps -n applyforus
kubectl get secrets -n applyforus

# 2. Rollback to previous version
kubectl rollout undo deployment/[SERVICE] -n applyforus

# 3. Or fix the config directly
kubectl edit configmap applyforus-config -n applyforus
# Make changes, save

# 4. Restart pods to pick up new config
kubectl rollout restart deployment/[SERVICE] -n applyforus
```

### Scenario 3: Resource Exhaustion

**Symptoms:**
- Pods in "Pending" state
- Errors: "Insufficient cpu" or "Insufficient memory"

**Immediate Action:**
```bash
# 1. Scale down new deployment
kubectl scale deployment/[SERVICE] --replicas=1 -n applyforus

# 2. Rollback
kubectl rollout undo deployment/[SERVICE] -n applyforus

# 3. Investigate node resources
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### Scenario 4: Dependency Failure

**Symptoms:**
- Service starts but can't connect to database/redis/external API
- Logs show connection timeout errors

**Rollback:**
```bash
# 1. Quick rollback
kubectl rollout undo deployment/[SERVICE] -n applyforus

# 2. Check dependencies
kubectl get pods -n applyforus  # Check if DB/Redis pods are running

# 3. Test connectivity
kubectl exec -it deployment/[SERVICE] -n applyforus -- curl redis:6379
kubectl exec -it deployment/[SERVICE] -n applyforus -- curl postgres:5432
```

---

## Quick Command Reference Card

**Print this for easy access during incidents:**

```
┌────────────────────────────────────────────────────────────┐
│ EMERGENCY ROLLBACK COMMANDS                                │
├────────────────────────────────────────────────────────────┤
│ Check Status:                                              │
│ kubectl get pods -n applyforus                             │
│                                                            │
│ Rollback Single Service:                                   │
│ kubectl rollout undo deployment/SERVICE -n applyforus      │
│                                                            │
│ Rollback All Services:                                     │
│ ./rollback-all.sh                                          │
│                                                            │
│ Blue-Green Switch (Frontend):                              │
│ kubectl patch service web -n applyforus \                  │
│   -p '{"spec":{"selector":{"version":"green"}}}'           │
│                                                            │
│ Check Health:                                              │
│ curl https://applyforus.com/health                         │
│ curl https://api.applyforus.com/health                     │
│                                                            │
│ Get Logs:                                                  │
│ kubectl logs deployment/SERVICE -n applyforus --tail=100   │
└────────────────────────────────────────────────────────────┘
```

---

**Document Maintained By:** DevOps Team
**Review Frequency:** Monthly
**Last Tested:** [Date of last drill]
**Next Drill:** [Scheduled date]

**Approval:** DevOps Lead, Engineering Manager, SRE Team
