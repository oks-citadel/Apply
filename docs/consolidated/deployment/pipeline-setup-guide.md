# Azure DevOps CI/CD Pipeline - Quick Setup Guide

## Prerequisites

- Azure DevOps account with access to the ApplyPlatform project
- Docker Hub account (citadelplatforms)
- Kubernetes clusters for dev, staging, and production
- kubectl configured locally

## Setup Checklist

### 1. Service Connections (30 minutes)

#### Docker Hub Connection
1. Navigate to: Project Settings → Service connections
2. Click "New service connection" → "Docker Registry"
3. Select "Docker Hub"
4. Fill in:
   - Docker Registry: `https://index.docker.io/v1/`
   - Docker ID: `citadelplatforms` (or your organization)
   - Docker Password: `<your-docker-hub-token>`
   - Service connection name: `DockerHub-ServiceConnection`
   - ✅ Grant access permission to all pipelines
5. Click "Verify and save"

#### Kubernetes Service Connections

**Development:**
1. Click "New service connection" → "Kubernetes"
2. Select authentication method:
   - Option A: Service Account
   - Option B: Kubeconfig
3. Fill in:
   - Service connection name: `K8s-Dev-ServiceConnection`
   - Server URL: Your dev cluster URL
   - Configuration method: Choose your method
4. ✅ Grant access permission to all pipelines
5. Click "Verify and save"

**Staging:**
- Repeat above steps with name: `K8s-Staging-ServiceConnection`

**Production:**
- Repeat above steps with name: `K8s-Prod-ServiceConnection`

### 2. Variable Groups (45 minutes)

Navigate to: Pipelines → Library → + Variable group

#### A. common-secrets
```yaml
Name: common-secrets
Description: Common secrets shared across all environments

Variables:
- Name: NPM_TOKEN
  Value: <your-npm-token>
  Secret: Yes

- Name: SENTRY_DSN
  Value: <your-sentry-dsn>
  Secret: No
```

#### B. dev-secrets
```yaml
Name: dev-secrets
Description: Development environment secrets

Variables:
- Name: DATABASE_URL
  Value: postgresql://user:pass@dev-db:5432/jobpilot_dev
  Secret: Yes

- Name: REDIS_URL
  Value: redis://dev-redis:6379
  Secret: No

- Name: JWT_SECRET
  Value: <generate-secret>
  Secret: Yes

- Name: OPENAI_API_KEY
  Value: <your-openai-key>
  Secret: Yes

- Name: SENDGRID_API_KEY
  Value: <your-sendgrid-key>
  Secret: Yes

- Name: ELASTICSEARCH_URL
  Value: http://dev-elasticsearch:9200
  Secret: No

- Name: RABBITMQ_URL
  Value: amqp://guest:guest@dev-rabbitmq:5672
  Secret: No
```

#### C. staging-secrets
```yaml
Name: staging-secrets
Description: Staging environment secrets

Variables:
(Same as dev-secrets but with staging values)
```

#### D. prod-secrets
```yaml
Name: prod-secrets
Description: Production environment secrets

Variables:
(Same as dev-secrets but with production values)
- Use strong, unique passwords
- Use production database URLs
- Use production API keys
```

### 3. Environments (20 minutes)

Navigate to: Pipelines → Environments

#### A. Development Environment
1. Click "Create environment"
2. Name: `development`
3. Resource: None (leave empty)
4. Description: "Development environment - auto-deploy"
5. Click "Create"

**No approvals needed**

#### B. Staging Environment
1. Click "Create environment"
2. Name: `staging`
3. Resource: None
4. Description: "Staging environment - auto-deploy from main"
5. Click "Create"

**Optional: Add approvals**
- Click on environment → "Approvals and checks"
- Add "Approvals"
- Add team leads as approvers

#### C. Production Environment
1. Click "Create environment"
2. Name: `production`
3. Resource: None
4. Description: "Production environment - requires approval"
5. Click "Create"

**Configure Approvals (REQUIRED):**
1. Click on `production` environment
2. Click "Approvals and checks"
3. Click "Approvals"
4. Add approvers:
   - Engineering Manager
   - Product Owner
   - DevOps Lead
5. Set:
   - Minimum approvers required: 2
   - Timeout: 30 days
   - ✅ Approvers can approve their own runs: No
6. Click "Save"

**Additional Checks:**
1. Click "Add check" → "Business hours"
   - Configure to only deploy during business hours
2. Click "Add check" → "Required template"
   - Ensure all required checks pass

### 4. Create the Pipeline (10 minutes)

1. Navigate to: Pipelines → Pipelines
2. Click "New pipeline"
3. Select "Azure Repos Git" (or your repository source)
4. Select your repository: `ApplyPlatform`
5. Choose "Existing Azure Pipelines YAML file"
6. Branch: `develop`
7. Path: `/azure-pipelines.yml`
8. Click "Continue"
9. Review the pipeline
10. Click "Run"

### 5. Configure Branch Policies (15 minutes)

#### For `develop` branch:
1. Go to Repos → Branches
2. Click "..." next to `develop` → "Branch policies"
3. Configure:
   - ✅ Require a minimum number of reviewers: 1
   - ✅ Build validation: Add build policy
     - Build pipeline: Select your pipeline
     - Path filter: Leave empty
     - Trigger: Automatic
     - Policy requirement: Required
     - Build expiration: 12 hours
     - Display name: "PR Build Validation"

#### For `main` branch:
1. Click "..." next to `main` → "Branch policies"
2. Configure:
   - ✅ Require a minimum number of reviewers: 2
   - ✅ Build validation: Same as develop
   - ✅ Status checks: Add any required checks
   - ✅ Limit merge types: Squash merge only (recommended)

### 6. Test the Pipeline (30 minutes)

#### Test 1: Develop Branch Deployment
1. Create a test branch from `develop`
2. Make a small change (e.g., update README)
3. Commit and push
4. Create PR to `develop`
5. Watch pipeline run:
   - ✅ Build stage
   - ✅ Test stages
   - ✅ Build Docker images
   - ✅ Deploy to dev

#### Test 2: Main Branch Deployment
1. Merge PR to `develop`
2. Create PR from `develop` to `main`
3. Merge after approvals
4. Watch pipeline run:
   - ✅ All stages
   - ✅ Deploy to staging
   - ⏸️ Wait at production approval
   - Approve production deployment
   - ✅ Deploy to production

### 7. Verify Deployments

#### Development
```bash
# Check pods
kubectl get pods -n jobpilot-dev

# Check services
kubectl get svc -n jobpilot-dev

# Check ingress
kubectl get ingress -n jobpilot-dev

# Test endpoint
curl https://dev.jobpilot.ai/health
```

#### Staging
```bash
kubectl get pods -n jobpilot-staging
curl https://staging.jobpilot.ai/health
```

#### Production
```bash
kubectl get pods -n jobpilot-prod
curl https://jobpilot.ai/health
```

## Common Issues and Solutions

### Issue 1: Docker Hub Push Fails
```
Error: unauthorized: authentication required
```

**Solution:**
1. Verify DockerHub-ServiceConnection credentials
2. Check Docker Hub token hasn't expired
3. Ensure organization name is correct (`citadelplatforms`)

### Issue 2: Kubernetes Deployment Fails
```
Error: error: You must be logged in to the server (Unauthorized)
```

**Solution:**
1. Verify K8s service connection
2. Check cluster credentials
3. Ensure service account has correct permissions

### Issue 3: Tests Fail
```
Error: Cannot connect to database
```

**Solution:**
1. Check service containers are running
2. Verify DATABASE_URL format
3. Check PostgreSQL container health

### Issue 4: Cache Issues
```
Warning: Cache restoration failed
```

**Solution:**
1. Clear cache in pipeline settings
2. Run pipeline again
3. Check pnpm-lock.yaml exists

## Security Checklist

- [ ] All secrets stored in Variable Groups (not in code)
- [ ] Variable Groups marked as "Secret" where appropriate
- [ ] Production environment has approval gates
- [ ] Branch policies enabled on main branch
- [ ] Service connections limited to specific pipelines
- [ ] Docker images scanned for vulnerabilities
- [ ] Kubernetes RBAC properly configured
- [ ] API keys rotated regularly

## Performance Tips

1. **Enable parallel jobs:**
   - Go to Project Settings → Parallel jobs
   - Purchase additional parallel jobs if needed

2. **Use self-hosted agents for faster builds:**
   - Set up self-hosted agents
   - Update pool in pipeline to use self-hosted

3. **Optimize Docker builds:**
   - Use multi-stage builds
   - Leverage Docker layer caching
   - Keep images small

## Monitoring Setup

### 1. Enable Pipeline Analytics
1. Go to Pipelines → Analytics
2. Review:
   - Pass rate
   - Duration
   - Test results

### 2. Set Up Alerts
1. Go to Project Settings → Notifications
2. Configure alerts for:
   - Build failures
   - Deployment failures
   - Test failures

### 3. Application Insights
1. Configure Application Insights for each environment
2. Set up alerts for:
   - Error rate
   - Response time
   - Availability

## Next Steps

After successful setup:

1. ✅ Monitor first few deployments closely
2. ✅ Review and adjust timeout values if needed
3. ✅ Add additional smoke tests
4. ✅ Configure monitoring dashboards
5. ✅ Document rollback procedures
6. ✅ Train team on pipeline usage
7. ✅ Schedule regular pipeline reviews

## Support Contacts

- **DevOps Team**: devops@jobpilot.ai
- **Azure DevOps Admin**: admin@citadelplatforms.com
- **On-call Engineer**: oncall@jobpilot.ai

## Additional Configuration

### Optional: Add Slack Notifications

1. Install Slack app in Azure DevOps
2. Add to pipeline:
```yaml
- task: SlackNotification@1
  inputs:
    SlackApiToken: $(SLACK_TOKEN)
    MessageAuthor: 'Azure DevOps'
    Channel: '#deployments'
    Message: 'Deployment to production completed!'
```

### Optional: Add Security Scanning

Add to pipeline after Docker build:
```yaml
- script: |
    docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
      aquasec/trivy image $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_PREFIX)-web:$(Build.BuildId)
  displayName: 'Security scan with Trivy'
```

## Resources

- [Azure DevOps Documentation](https://docs.microsoft.com/en-us/azure/devops/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Pipeline Configuration Guide](./PIPELINE_CONFIGURATION.md)

---

**Last Updated**: 2025-12-06
**Version**: 1.0.0
