# Post-Migration Verification Checklist

This comprehensive checklist ensures the ApplyforUs rebranding migration was successful.

---

## 1. Pre-Verification Setup

### Environment Preparation
- [ ] Backup created successfully
- [ ] Migration script executed without errors
- [ ] Migration log reviewed
- [ ] Git status checked: `git status`
- [ ] All changes staged: `git diff --staged`

---

## 2. Package and Dependencies

### NPM/pnpm Verification
- [ ] Clear old dependencies
  ```bash
  rm -rf node_modules
  rm pnpm-lock.yaml
  ```

- [ ] Reinstall dependencies
  ```bash
  pnpm install
  ```

- [ ] Check for installation errors
  ```bash
  echo $?  # Should return 0
  ```

- [ ] Verify workspace packages resolve correctly
  ```bash
  pnpm list --depth 0
  pnpm list @applyforus/telemetry
  pnpm list @applyforus/logging
  pnpm list @applyforus/security
  ```

- [ ] No references to old packages
  ```bash
  grep -r "@jobpilot/" . --exclude-dir=node_modules
  # Should return no results
  ```

---

## 3. Build Verification

### Root Build
- [ ] Build all packages
  ```bash
  pnpm build
  ```

- [ ] Build completes without errors
- [ ] Review build output for warnings

### Individual Service Builds
- [ ] Auth Service builds: `pnpm --filter applyforus-auth-service build`
- [ ] User Service builds: `pnpm --filter applyforus-user-service build`
- [ ] Job Service builds: `pnpm --filter applyforus-job-service build`
- [ ] Resume Service builds: `pnpm --filter applyforus-resume-service build`
- [ ] Auto-Apply Service builds: `pnpm --filter applyforus-auto-apply-service build`
- [ ] Analytics Service builds: `pnpm --filter applyforus-analytics-service build`
- [ ] Notification Service builds: `pnpm --filter applyforus-notification-service build`
- [ ] Orchestrator Service builds: `pnpm --filter applyforus-orchestrator-service build`

### Application Builds
- [ ] Web app builds: `pnpm --filter @applyforus/web build`
- [ ] Admin app builds: `pnpm --filter @applyforus/admin build`
- [ ] Mobile app builds: `pnpm --filter @applyforus/mobile build`
- [ ] Extension builds: `pnpm --filter @applyforus/extension build`

---

## 4. Type Checking

### TypeScript Verification
- [ ] Root type check: `pnpm type-check`
- [ ] No type errors in services
- [ ] No type errors in applications
- [ ] Path aliases resolve correctly
  ```bash
  # Check imports from @applyforus/* resolve
  pnpm type-check 2>&1 | grep "Cannot find module '@applyforus"
  # Should return empty
  ```

---

## 5. Linting

### Code Quality
- [ ] Lint all code: `pnpm lint`
- [ ] No linting errors
- [ ] Fix auto-fixable issues: `pnpm lint --fix`
- [ ] Review remaining warnings

---

## 6. Test Execution

### Unit Tests
- [ ] Run all tests: `pnpm test`
- [ ] All tests pass
- [ ] No test failures related to naming

### Integration Tests
- [ ] Run integration tests: `pnpm test:integration`
- [ ] All integration tests pass

### E2E Tests
- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] All E2E tests pass

### Test Coverage
- [ ] Generate coverage: `pnpm test:coverage`
- [ ] Review coverage report
- [ ] No regression in coverage

---

## 7. Docker Verification

### Docker Compose
- [ ] Stop old containers
  ```bash
  docker-compose down
  ```

- [ ] Build new images
  ```bash
  docker-compose build
  ```

- [ ] Start new containers
  ```bash
  docker-compose up -d
  ```

- [ ] Check container status
  ```bash
  docker ps
  # All containers should show 'applyforus-*' names
  ```

- [ ] Check container logs
  ```bash
  docker-compose logs
  # Look for errors
  ```

- [ ] Verify database name
  ```bash
  docker exec applyforus-postgres psql -U postgres -l
  # Should show 'applyforus' database
  ```

- [ ] Verify network names
  ```bash
  docker network ls | grep applyforus
  # Should show 'applyforus-network'
  ```

- [ ] Verify volume names
  ```bash
  docker volume ls | grep applyforus
  # Should show 'applyforus-*' volumes
  ```

---

## 8. Service Health Checks

### Local Development
Start services and check health endpoints:

- [ ] Auth Service: `curl http://localhost:4001/health`
- [ ] User Service: `curl http://localhost:4002/health`
- [ ] Job Service: `curl http://localhost:4003/health`
- [ ] AI Service: `curl http://localhost:4004/health`
- [ ] Resume Service: `curl http://localhost:4005/health`
- [ ] Analytics Service: `curl http://localhost:4006/health`
- [ ] Notification Service: `curl http://localhost:4007/health`
- [ ] Auto-Apply Service: `curl http://localhost:4008/health`
- [ ] Web App: `curl http://localhost:3000`
- [ ] Admin App: `curl http://localhost:3001`

All should return healthy status.

---

## 9. Database Verification

### Connection and Schema
- [ ] Connect to database
  ```bash
  psql postgresql://postgres:postgres@localhost:5432/applyforus
  ```

- [ ] List databases
  ```sql
  \l
  -- Should show 'applyforus'
  ```

- [ ] Check tables exist
  ```sql
  \dt
  -- Should show all tables
  ```

- [ ] Run test query
  ```sql
  SELECT 1;
  -- Should return 1
  ```

- [ ] Check migrations ran
  ```sql
  SELECT * FROM migrations ORDER BY id DESC LIMIT 5;
  ```

---

## 10. Kubernetes Verification (if applicable)

### Local Kubernetes
- [ ] Switch to local context
  ```bash
  kubectl config use-context docker-desktop
  ```

- [ ] Create namespace
  ```bash
  kubectl create namespace applyforus
  ```

- [ ] Apply manifests (dry-run first)
  ```bash
  kubectl apply -f infrastructure/kubernetes/ --dry-run=client -n applyforus
  ```

- [ ] Apply manifests
  ```bash
  kubectl apply -f infrastructure/kubernetes/ -n applyforus
  ```

- [ ] Check pods
  ```bash
  kubectl get pods -n applyforus
  # All should be Running
  ```

- [ ] Check services
  ```bash
  kubectl get services -n applyforus
  ```

- [ ] Check configmap
  ```bash
  kubectl describe configmap applyforus-config -n applyforus
  ```

- [ ] Check secrets exist
  ```bash
  kubectl get secrets -n applyforus
  ```

- [ ] Check logs
  ```bash
  kubectl logs -l app=auth-service -n applyforus --tail=50
  ```

---

## 11. Configuration Verification

### Environment Variables
- [ ] Check .env files updated
- [ ] Database URLs reference 'applyforus'
- [ ] Service names updated
- [ ] Domain names updated
- [ ] Email addresses updated

### Config Files
- [ ] TypeScript configs reference @applyforus/*
- [ ] Next.js configs updated
- [ ] Jest configs updated
- [ ] Docker configs updated
- [ ] Kubernetes configs updated

---

## 12. Visual Inspection

### Web Application
- [ ] Start web app: `pnpm --filter @applyforus/web dev`
- [ ] Open browser: http://localhost:3000
- [ ] Check page title shows "ApplyforUs"
- [ ] Check meta tags reference applyforus.com
- [ ] Check console for errors
- [ ] Check network tab for failed requests
- [ ] Test navigation
- [ ] Test authentication flow
- [ ] Check all pages load

### Admin Dashboard
- [ ] Start admin app: `pnpm --filter @applyforus/admin dev`
- [ ] Open browser: http://localhost:3001
- [ ] Check branding displays "ApplyforUs"
- [ ] Test admin functions
- [ ] Check for errors

---

## 13. API Testing

### Manual API Tests
- [ ] Test auth endpoints
  ```bash
  curl -X POST http://localhost:4001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@applyforus.com","password":"Test123!"}'
  ```

- [ ] Test user endpoints
- [ ] Test job endpoints
- [ ] Test resume endpoints
- [ ] All endpoints return expected responses

### Swagger Documentation
- [ ] Open: http://localhost:4001/api/docs
- [ ] Title shows "ApplyforUs API"
- [ ] All endpoints documented
- [ ] Try executing test requests

---

## 14. Git Verification

### Repository Check
- [ ] Review all changes
  ```bash
  git diff
  ```

- [ ] No unintended changes
- [ ] No sensitive data exposed
- [ ] All binaries excluded
- [ ] Check for remaining old references
  ```bash
  git diff | grep -i jobpilot
  # Should only show removals (- lines), no additions
  ```

### Commit Preparation
- [ ] Stage all changes
  ```bash
  git add .
  ```

- [ ] Review staged changes
  ```bash
  git diff --staged --stat
  ```

- [ ] Create commit message
  ```bash
  git commit -m "Rebrand from JobPilot to ApplyforUs

  - Updated all package names and dependencies
  - Updated Docker and Kubernetes configurations
  - Updated documentation and branding
  - Updated environment configurations
  - Updated CI/CD pipelines

  See rebrand_file_list.md for complete list of changes"
  ```

---

## 15. Documentation Review

### File Content
- [ ] README.md shows "ApplyforUs"
- [ ] CONTRIBUTING.md updated
- [ ] API docs updated
- [ ] Architecture docs updated
- [ ] Deployment docs updated
- [ ] All links work
- [ ] No broken references

### File Names
- [ ] Postman collection renamed
- [ ] No files with "JobPilot" in name
  ```bash
  find . -name "*jobpilot*" -o -name "*JobPilot*" | grep -v node_modules
  # Should return empty or only backup files
  ```

---

## 16. Search for Remaining References

### Comprehensive Search
- [ ] Search for "JobPilot"
  ```bash
  grep -r "JobPilot" . --exclude-dir=node_modules --exclude-dir=backups
  ```

- [ ] Search for "jobpilot"
  ```bash
  grep -r "jobpilot" . --exclude-dir=node_modules --exclude-dir=backups
  ```

- [ ] Search for "job-apply-platform"
  ```bash
  grep -r "job-apply-platform" . --exclude-dir=node_modules --exclude-dir=backups
  ```

- [ ] Search for "@jobpilot"
  ```bash
  grep -r "@jobpilot" . --exclude-dir=node_modules --exclude-dir=backups
  ```

All searches should return no results (or only in backup files).

---

## 17. Third-Party Services (Manual)

### Services to Update
- [ ] Azure Container Registry renamed or new one created
- [ ] Azure resources renamed/recreated
- [ ] Domain names updated
- [ ] SSL certificates requested
- [ ] CDN configurations updated
- [ ] Email service configurations updated
- [ ] Monitoring service configurations updated
- [ ] Analytics service configurations updated
- [ ] Error tracking service configurations updated

---

## 18. CI/CD Pipeline Testing

### GitHub Actions
- [ ] Push to test branch
- [ ] CI workflow triggers
- [ ] All jobs pass
- [ ] Images built with new names
- [ ] No errors in logs

### Azure Pipelines
- [ ] Trigger pipeline
- [ ] All stages pass
- [ ] Deployments use new resources
- [ ] No errors

---

## 19. Deployment Testing

### Development Environment
- [ ] Deploy to dev cluster
  ```bash
  kubectl apply -f infrastructure/kubernetes/ -n applyforus
  ```

- [ ] All pods running
- [ ] Services accessible
- [ ] Health checks pass
- [ ] Monitor logs for errors
- [ ] Test critical flows

### Staging Environment
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Test full user journeys
- [ ] Performance testing
- [ ] Load testing

---

## 20. Rollback Preparation

### Rollback Plan
- [ ] Backup verified and accessible
- [ ] Rollback script prepared
- [ ] Team notified of migration
- [ ] Monitoring alerts configured
- [ ] Rollback procedure documented

### Rollback Test (Optional)
- [ ] Test rollback in dev environment
- [ ] Verify rollback works
- [ ] Document any issues

---

## 21. Team Communication

### Notifications
- [ ] Notify development team
- [ ] Update team documentation
- [ ] Update onboarding docs
- [ ] Update runbooks
- [ ] Update incident response procedures

### Training
- [ ] Brief team on new naming conventions
- [ ] Update development setup guide
- [ ] Update deployment guide
- [ ] Answer team questions

---

## 22. Final Verification

### Production Readiness
- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] No critical issues found
- [ ] Performance is acceptable
- [ ] Security scan passes
- [ ] Dependencies up to date
- [ ] Documentation complete
- [ ] Team trained

### Sign-off
- [ ] Technical lead approval
- [ ] Product owner approval
- [ ] DevOps approval
- [ ] Security approval (if required)

---

## 23. Post-Migration Monitoring

### First 24 Hours
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor resource usage
- [ ] Check log aggregation
- [ ] Check metrics collection
- [ ] Respond to alerts promptly

### First Week
- [ ] Daily health checks
- [ ] Review incident reports
- [ ] Gather team feedback
- [ ] Document issues and resolutions
- [ ] Update procedures as needed

---

## 24. Cleanup Tasks (After Stable)

### After 1 Week
- [ ] Remove old Docker images
- [ ] Remove old Docker volumes (if safe)
- [ ] Archive old Kubernetes namespace

### After 1 Month
- [ ] Delete old Azure dev resources
- [ ] Delete old backups (keep minimum required)
- [ ] Update external documentation

### After 3 Months
- [ ] Delete old Azure staging resources
- [ ] Delete old Azure prod resources (after full verification)
- [ ] Cancel old services

---

## Issues Log

Use this section to track any issues found during verification:

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| Example: Import path error | High | Resolved | Updated tsconfig.json |
|       |          |        |            |
|       |          |        |            |

---

## Verification Sign-off

**Migration Completed By:** _________________
**Date:** _________________
**Verified By:** _________________
**Date:** _________________

**Overall Status:**
- [ ] ✅ All checks passed - Ready for production
- [ ] ⚠️ Minor issues found - Acceptable with mitigations
- [ ] ❌ Critical issues found - Requires fixes before deployment

**Notes:**
```
Add any additional notes here...
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Official Post-Migration Checklist
**Estimated Time:** 4-6 hours for complete verification
