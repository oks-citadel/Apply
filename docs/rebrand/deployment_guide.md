# ApplyforUs Rebrand Deployment Guide

Version 1.0 | Last Updated: December 2025

## Table of Contents

1. [Overview](#overview)
2. [Pre-Deployment](#pre-deployment)
3. [Development Environment](#development-environment)
4. [Testing Environment](#testing-environment)
5. [Staging Environment](#staging-environment)
6. [Production Environment](#production-environment)
7. [Rollback Procedures](#rollback-procedures)
8. [Health Check Verification](#health-check-verification)
9. [Post-Deployment](#post-deployment)

---

## Overview

### Deployment Strategy

**Approach:** Blue-Green Deployment with Progressive Rollout

**Timeline:**
- Development: Day 1
- Testing: Day 2-3
- Staging: Day 4-5
- Production: Day 6-7 (progressive rollout)

**Risk Level:** Low (cosmetic changes only, no API/DB changes)

### Prerequisites

- [ ] All code changes merged to develop branch
- [ ] CI/CD pipeline green
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Team availability confirmed
- [ ] Rollback plan documented

---

## Pre-Deployment

### Step 1: Code Freeze

```bash
# Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0-rebrand

# Tag the release
git tag -a v1.0.0-rebrand -m "ApplyforUs rebrand release"
git push origin v1.0.0-rebrand
git push origin --tags
```

### Step 2: Build Verification

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Run all tests
pnpm test
pnpm test:integration
pnpm test:e2e

# Security scan
pnpm audit
npm audit fix

# Performance check
pnpm lighthouse
```

### Step 3: Docker Images

```bash
# Build images
docker build -t applyforus-web:1.0.0 -f apps/web/Dockerfile .
docker build -t applyforus-admin:1.0.0 -f apps/admin/Dockerfile .

# Tag for all environments
docker tag applyforus-web:1.0.0 registry.applyforus.com/web:1.0.0
docker tag applyforus-web:1.0.0 registry.applyforus.com/web:latest

docker tag applyforus-admin:1.0.0 registry.applyforus.com/admin:1.0.0
docker tag applyforus-admin:1.0.0 registry.applyforus.com/admin:latest

# Push to registry
docker push registry.applyforus.com/web:1.0.0
docker push registry.applyforus.com/web:latest

docker push registry.applyforus.com/admin:1.0.0
docker push registry.applyforus.com/admin:latest
```

### Step 4: Backend Services

```bash
# Build backend services
cd services/auth-service && docker build -t applyforus-auth:1.0.0 .
cd services/user-service && docker build -t applyforus-user:1.0.0 .
cd services/resume-service && docker build -t applyforus-resume:1.0.0 .
cd services/job-service && docker build -t applyforus-job:1.0.0 .
cd services/auto-apply-service && docker build -t applyforus-auto-apply:1.0.0 .
cd services/analytics-service && docker build -t applyforus-analytics:1.0.0 .
cd services/notification-service && docker build -t applyforus-notification:1.0.0 .
cd services/ai-service && docker build -t applyforus-ai:1.0.0 .

# Tag and push all services
# (repeat for each service)
```

### Step 5: Configuration Preparation

```bash
# Update ConfigMaps
kubectl create configmap app-config \
  --from-literal=APP_NAME=ApplyforUs \
  --from-literal=BRAND_COLOR=#3B82F6 \
  --dry-run=client -o yaml > configs/app-config.yaml

# Verify configuration
cat configs/app-config.yaml
```

---

## Development Environment

### Deploy to Development

```bash
# Set context
kubectl config use-context development

# Apply configurations
kubectl apply -f infrastructure/kubernetes/configmaps/ -n development
kubectl apply -f infrastructure/kubernetes/secrets/ -n development

# Deploy services
kubectl apply -f infrastructure/kubernetes/services/ -n development

# Wait for rollout
kubectl rollout status deployment/web-app -n development
kubectl rollout status deployment/auth-service -n development
kubectl rollout status deployment/user-service -n development
kubectl rollout status deployment/resume-service -n development
kubectl rollout status deployment/job-service -n development
kubectl rollout status deployment/auto-apply-service -n development
kubectl rollout status deployment/analytics-service -n development
kubectl rollout status deployment/notification-service -n development
kubectl rollout status deployment/ai-service -n development

# Verify pods
kubectl get pods -n development
kubectl get services -n development
```

### Verify Development Deployment

```bash
# Check pod status
kubectl get pods -n development

# Expected output:
# NAME                           READY   STATUS    RESTARTS   AGE
# web-app-xxx                    1/1     Running   0          2m
# auth-service-xxx               1/1     Running   0          2m
# user-service-xxx               1/1     Running   0          2m
# ...

# Check logs
kubectl logs -f deployment/web-app -n development

# Test endpoints
curl https://dev.applyforus.com/api/health
curl https://api-dev.applyforus.com/health
```

### Smoke Tests (Development)

```bash
# Run automated smoke tests
pnpm test:smoke --env=development

# Manual verification
# 1. Visit https://dev.applyforus.com
# 2. Verify logo displays correctly
# 3. Check color scheme
# 4. Test login flow
# 5. Test resume upload
# 6. Test job application
```

---

## Testing Environment

### Deploy to Testing

```bash
# Set context
kubectl config use-context testing

# Apply configurations
kubectl apply -f infrastructure/kubernetes/configmaps/ -n testing
kubectl apply -f infrastructure/kubernetes/secrets/ -n testing

# Deploy services
kubectl apply -f infrastructure/kubernetes/services/ -n testing

# Wait for rollout
kubectl rollout status deployment/web-app -n testing

# Verify deployment
kubectl get pods -n testing
```

### QA Testing Checklist

**Visual Testing:**
- [ ] Logo displays correctly
- [ ] Colors match brand guidelines
- [ ] Typography is consistent
- [ ] Dark mode works
- [ ] Responsive design intact

**Functional Testing:**
- [ ] Login/logout works
- [ ] Registration works
- [ ] Resume upload works
- [ ] Job search works
- [ ] Application submission works
- [ ] Profile editing works

**Cross-Browser Testing:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Performance Testing:**
```bash
# Run Lighthouse
pnpm lighthouse https://test.applyforus.com

# Load testing
artillery run load-tests/rebrand-test.yml
```

---

## Staging Environment

### Deploy to Staging

```bash
# Set context
kubectl config use-context staging

# Create backup
kubectl get all -n staging -o yaml > backup/staging-pre-rebrand.yaml

# Apply configurations
kubectl apply -f infrastructure/kubernetes/configmaps/ -n staging
kubectl apply -f infrastructure/kubernetes/secrets/ -n staging

# Deploy services
kubectl apply -f infrastructure/kubernetes/services/ -n staging

# Progressive rollout (10% of pods first)
kubectl patch deployment web-app -n staging -p '{"spec":{"strategy":{"type":"RollingUpdate","rollingUpdate":{"maxSurge":1,"maxUnavailable":0}}}}'

# Wait and monitor
kubectl rollout status deployment/web-app -n staging

# If successful, continue with remaining pods
kubectl rollout resume deployment/web-app -n staging

# Verify all services
kubectl get pods -n staging
```

### Staging Verification

```bash
# Health checks
curl https://staging.applyforus.com/api/health
curl https://api-staging.applyforus.com/health

# Integration tests
pnpm test:integration --env=staging

# E2E tests
pnpm test:e2e --env=staging

# Performance baseline
pnpm test:performance --env=staging
```

### Staging Approval

**Stakeholder Review:**
- [ ] Product Manager approval
- [ ] Design team approval
- [ ] QA team sign-off
- [ ] Security team approval
- [ ] DevOps readiness confirmed

---

## Production Environment

### Pre-Production Checklist

- [ ] All staging tests passed
- [ ] Stakeholder approvals obtained
- [ ] Monitoring dashboards ready
- [ ] Alert rules configured
- [ ] On-call team notified
- [ ] Communication plan ready
- [ ] Rollback plan confirmed

### Production Deployment Strategy

**Approach:** Canary deployment with gradual rollout

**Phases:**
1. Deploy to 10% of pods (30 minutes observation)
2. Increase to 25% (30 minutes observation)
3. Increase to 50% (1 hour observation)
4. Increase to 100% (complete rollout)

### Phase 1: Deploy to 10% (Canary)

```bash
# Set context
kubectl config use-context production

# Create backup
kubectl get all -n production -o yaml > backup/production-pre-rebrand.yaml

# Create canary deployment
kubectl apply -f infrastructure/kubernetes/canary/web-app-canary.yaml -n production

# Monitor canary
kubectl get pods -l version=canary -n production

# Check metrics
# - Error rate < 0.1%
# - Response time < 500ms p95
# - CPU/Memory normal

# Wait 30 minutes and monitor
```

**Canary Configuration:**

```yaml
# infrastructure/kubernetes/canary/web-app-canary.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app-canary
  namespace: production
spec:
  replicas: 2  # 10% of total pods
  selector:
    matchLabels:
      app: web-app
      version: canary
  template:
    metadata:
      labels:
        app: web-app
        version: canary
    spec:
      containers:
      - name: web-app
        image: registry.applyforus.com/web:1.0.0
        # ... rest of configuration
```

### Phase 2: Increase to 25%

```bash
# If canary looks good, increase replicas
kubectl scale deployment web-app-canary --replicas=5 -n production

# Monitor for 30 minutes
kubectl top pods -l version=canary -n production
kubectl logs -f deployment/web-app-canary -n production
```

### Phase 3: Increase to 50%

```bash
# Increase to 50%
kubectl scale deployment web-app-canary --replicas=10 -n production

# Monitor for 1 hour
# Check dashboards
# Verify metrics
# Monitor user feedback
```

### Phase 4: Complete Rollout (100%)

```bash
# Update main deployment
kubectl set image deployment/web-app web-app=registry.applyforus.com/web:1.0.0 -n production

# Wait for rollout
kubectl rollout status deployment/web-app -n production

# Remove canary
kubectl delete deployment web-app-canary -n production

# Verify all pods
kubectl get pods -n production
```

### Deploy Backend Services

```bash
# Deploy services one by one
kubectl set image deployment/auth-service auth-service=registry.applyforus.com/auth:1.0.0 -n production
kubectl rollout status deployment/auth-service -n production

kubectl set image deployment/user-service user-service=registry.applyforus.com/user:1.0.0 -n production
kubectl rollout status deployment/user-service -n production

# Repeat for all services
# Monitor each service before proceeding to next
```

---

## Rollback Procedures

### Emergency Rollback (Immediate)

```bash
# Rollback web app
kubectl rollout undo deployment/web-app -n production

# Rollback services
kubectl rollout undo deployment/auth-service -n production
kubectl rollout undo deployment/user-service -n production
# ... repeat for all services

# Verify rollback
kubectl rollout status deployment/web-app -n production
```

### Planned Rollback (Complete Reversion)

```bash
# Restore from backup
kubectl apply -f backup/production-pre-rebrand.yaml -n production

# Wait for restoration
kubectl rollout status deployment/web-app -n production

# Verify services
kubectl get pods -n production
kubectl get services -n production

# Test endpoints
curl https://applyforus.com/api/health
```

### Partial Rollback

```bash
# Rollback just frontend
kubectl rollout undo deployment/web-app -n production

# Or rollback specific service
kubectl rollout undo deployment/notification-service -n production
```

---

## Health Check Verification

### Automated Health Checks

```bash
#!/bin/bash
# health-check.sh

SERVICES=(
  "https://applyforus.com/api/health"
  "https://api.applyforus.com/auth/health"
  "https://api.applyforus.com/users/health"
  "https://api.applyforus.com/resumes/health"
  "https://api.applyforus.com/jobs/health"
  "https://api.applyforus.com/applications/health"
  "https://api.applyforus.com/analytics/health"
  "https://api.applyforus.com/notifications/health"
  "https://api.applyforus.com/ai/health"
)

for service in "${SERVICES[@]}"; do
  echo "Checking $service"
  response=$(curl -s -o /dev/null -w "%{http_code}" $service)
  if [ $response -eq 200 ]; then
    echo "✓ $service is healthy"
  else
    echo "✗ $service returned $response"
    exit 1
  fi
done

echo "All services healthy!"
```

### Manual Verification Checklist

**Web Application:**
- [ ] Homepage loads
- [ ] Logo displays correctly
- [ ] Navigation works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Dark mode works
- [ ] No console errors

**API Services:**
- [ ] Authentication endpoint responds
- [ ] User service responds
- [ ] Resume service responds
- [ ] Job service responds
- [ ] Application service responds
- [ ] All health checks return 200

**Performance:**
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks
- [ ] No CPU spikes

---

## Post-Deployment

### Monitoring (First 24 Hours)

```bash
# Monitor metrics
# - Error rate
# - Response times
# - CPU/Memory usage
# - Pod restarts
# - User feedback

# Watch logs
kubectl logs -f deployment/web-app -n production

# Check metrics
kubectl top pods -n production
kubectl top nodes
```

### Communication

**Internal:**
- [ ] Notify team of successful deployment
- [ ] Update status page
- [ ] Post in Slack #general

**External:**
- [ ] Publish blog post
- [ ] Send email to users
- [ ] Post on social media
- [ ] Update status page

### Documentation Updates

- [ ] Update deployment documentation
- [ ] Document any issues encountered
- [ ] Update runbooks
- [ ] Update monitoring dashboards

### Post-Deployment Review

**Schedule:** 1 week after deployment

**Agenda:**
- Review deployment process
- Discuss issues encountered
- Identify improvements
- Update procedures

---

## Deployment Checklist

### Pre-Deployment

- [ ] Code freeze initiated
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] Docker images built and pushed
- [ ] ConfigMaps prepared
- [ ] Secrets updated
- [ ] Backup created
- [ ] Team notified
- [ ] Rollback plan documented

### Development Deployment

- [ ] Deployed to development
- [ ] Smoke tests passed
- [ ] Visual verification completed
- [ ] Functional tests passed

### Testing Deployment

- [ ] Deployed to testing
- [ ] QA testing completed
- [ ] Cross-browser testing completed
- [ ] Performance testing completed

### Staging Deployment

- [ ] Deployed to staging
- [ ] Integration tests passed
- [ ] E2E tests passed
- [ ] Stakeholder approval obtained

### Production Deployment

- [ ] Canary deployment successful (10%)
- [ ] Increased to 25%
- [ ] Increased to 50%
- [ ] Complete rollout (100%)
- [ ] Backend services deployed
- [ ] Health checks verified
- [ ] Monitoring confirmed
- [ ] Communication completed

### Post-Deployment

- [ ] Monitoring active
- [ ] No critical issues
- [ ] User feedback positive
- [ ] Documentation updated
- [ ] Team debriefed

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Contact:** devops@applyforus.com
