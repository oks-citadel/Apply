# Deployment Guide - Quick Reference

## Quick Links

- [CI/CD Pipeline Documentation](./cicd-pipeline.md)
- [GitHub Actions](https://github.com/yourorg/Job-Apply-Platform/actions)
- [Azure Portal](https://portal.azure.com)

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing in CI
- [ ] Code reviewed and approved
- [ ] No critical security vulnerabilities
- [ ] Database migrations tested
- [ ] Secrets and configs updated
- [ ] Rollback plan documented
- [ ] Team notified of deployment window

### Staging Deployment

1. **Merge to `main` branch**
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

2. **Automatic Deployment**
   - Triggers automatically on push to `main`
   - Deploys to staging environment
   - Runs smoke tests

3. **Verify Deployment**
   - Check https://staging.jobpilot.ai
   - Review deployment logs
   - Test critical features

### Production Deployment

1. **Create Release Tag**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.2.3 -m "Release v1.2.3: Description"
   git push origin v1.2.3
   ```

2. **Approve Deployment**
   - Go to GitHub Actions
   - Find "Deploy to Production" workflow
   - Review changes
   - Click "Approve" button

3. **Monitor Deployment**
   - Watch workflow progress
   - Check Slack notifications
   - Monitor https://jobpilot.ai
   - Review Azure metrics

4. **Post-Deployment Verification**
   - [ ] Health checks passing
   - [ ] Smoke tests passed
   - [ ] Critical features working
   - [ ] No error spikes in logs
   - [ ] Performance metrics normal

## Emergency Rollback

### Quick Rollback (Production)

1. **Go to GitHub Actions**
   - Navigate to "Rollback Deployment" workflow
   - Click "Run workflow"

2. **Fill Form**
   - Environment: `production`
   - Service: `all` (or specific service)
   - Target SHA: Leave empty for previous
   - Reason: Describe the issue

3. **Approve and Execute**
   - Click "Run workflow"
   - Approve in production-rollback environment
   - Monitor execution

4. **Verify Rollback**
   - Check application health
   - Verify smoke tests pass
   - Create incident report

### Manual Kubernetes Rollback

If workflow fails, use kubectl:

```bash
# Login to Azure
az login
az aks get-credentials --resource-group jobpilot-prod-rg --name jobpilot-prod-aks

# Rollback specific service
kubectl rollout undo deployment/<service-name> -n jobpilot

# Verify rollback
kubectl rollout status deployment/<service-name> -n jobpilot

# Check pod status
kubectl get pods -n jobpilot
```

## Common Commands

### GitHub Actions

```bash
# Trigger workflow manually
gh workflow run ci.yml

# View workflow runs
gh run list --workflow=ci.yml

# View specific run
gh run view <run-id>

# Download artifacts
gh run download <run-id>
```

### Azure CLI

```bash
# Login
az login

# Set subscription
az account set --subscription "JobPilot-Azure-Subscription"

# Get AKS credentials
az aks get-credentials --resource-group jobpilot-prod-rg --name jobpilot-prod-aks

# View ACR images
az acr repository list --name jobpilotacr

# View image tags
az acr repository show-tags --name jobpilotacr --repository web
```

### Kubernetes

```bash
# Get all resources
kubectl get all -n jobpilot

# Get deployments
kubectl get deployments -n jobpilot

# Get pods
kubectl get pods -n jobpilot

# View logs
kubectl logs -f <pod-name> -n jobpilot

# Describe resource
kubectl describe deployment/<service> -n jobpilot

# Get events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Scale deployment
kubectl scale deployment/<service> --replicas=3 -n jobpilot

# Restart deployment
kubectl rollout restart deployment/<service> -n jobpilot
```

## Environment URLs

| Environment | Web App | API |
|------------|---------|-----|
| Staging | https://staging.jobpilot.ai | https://staging-api.jobpilot.ai |
| Production | https://jobpilot.ai | https://api.jobpilot.ai |

## Service Ports

| Service | Port |
|---------|------|
| Web | 3000 |
| Auth Service | 3001 |
| User Service | 3002 |
| Job Service | 3003 |
| Resume Service | 3004 |
| Notification Service | 3005 |
| Auto-apply Service | 3006 |
| AI Service | 8000 |

## Troubleshooting Quick Fixes

### Pod CrashLoopBackOff

```bash
# View pod logs
kubectl logs <pod-name> -n jobpilot --previous

# Describe pod
kubectl describe pod <pod-name> -n jobpilot

# Common fixes:
# 1. Check environment variables
# 2. Verify secrets exist
# 3. Check resource limits
# 4. Review application logs
```

### ImagePullBackOff

```bash
# Check if image exists in ACR
az acr repository show-tags --name jobpilotacr --repository <service-name>

# Verify image pull secret
kubectl get secret acr-secret -n jobpilot

# Recreate secret if needed
kubectl delete secret acr-secret -n jobpilot
kubectl create secret docker-registry acr-secret \
  --docker-server=jobpilotacr.azurecr.io \
  --docker-username=<username> \
  --docker-password=<password> \
  -n jobpilot
```

### Service Not Responding

```bash
# Check service
kubectl get svc -n jobpilot

# Check endpoints
kubectl get endpoints <service> -n jobpilot

# Test from within cluster
kubectl run -it --rm debug --image=alpine --restart=Never -- sh
# Inside pod:
wget -O- http://<service-name>:3000/health
```

### High Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n jobpilot

# Check resource limits
kubectl describe pod <pod-name> -n jobpilot | grep -A 5 Limits

# Scale if needed
kubectl scale deployment/<service> --replicas=5 -n jobpilot
```

## Monitoring Dashboards

- **Azure Monitor**: [Link to Azure Monitor](https://portal.azure.com/#blade/Microsoft_Azure_Monitoring/AzureMonitoringBrowseBlade)
- **AKS Dashboard**: `az aks browse --resource-group jobpilot-prod-rg --name jobpilot-prod-aks`
- **GitHub Actions**: [Workflows Page](https://github.com/yourorg/Job-Apply-Platform/actions)

## Contact Information

| Role | Contact | Availability |
|------|---------|-------------|
| DevOps Lead | devops-lead@company.com | 24/7 for production issues |
| Backend Team | backend-team@company.com | Business hours |
| Frontend Team | frontend-team@company.com | Business hours |
| On-Call Engineer | Use PagerDuty | 24/7 |

## Escalation Path

1. **Level 1**: Team Lead
2. **Level 2**: Engineering Manager
3. **Level 3**: CTO

## Incident Response

For production incidents:

1. **Alert Team**: Post in #incidents Slack channel
2. **Assess Impact**: Determine severity and user impact
3. **Immediate Action**:
   - If critical: Execute rollback
   - If degraded: Monitor and prepare fix
4. **Communicate**: Update status page
5. **Fix or Rollback**: Choose appropriate action
6. **Post-Incident**: Create incident report
7. **Retrospective**: Schedule team review

## Deployment Schedule

| Day | Environment | Time (UTC) | Notes |
|-----|-------------|-----------|-------|
| Monday-Thursday | Staging | Anytime | Automated |
| Friday | Production | 10:00-14:00 | Avoid late Friday |
| Saturday-Sunday | Production | Emergency only | On-call required |

## Release Notes Template

```markdown
# Release v1.2.3

## Features
- Feature 1 description
- Feature 2 description

## Bug Fixes
- Bug fix 1
- Bug fix 2

## Infrastructure Changes
- Infrastructure change 1

## Database Migrations
- Migration description (if any)

## Breaking Changes
- Breaking change description (if any)

## Rollback Plan
- How to rollback if needed

## Testing Performed
- Unit tests: ✅
- Integration tests: ✅
- E2E tests: ✅
- Manual testing: ✅
```

## Useful Links

- [Kubernetes Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
