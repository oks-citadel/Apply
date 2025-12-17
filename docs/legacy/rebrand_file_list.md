# ApplyforUs Rebranding - Complete File List

This document lists ALL files that need to be updated during the rebranding from "JobPilot" to "ApplyforUs".

## Summary Statistics

- Total files identified: 100+ files
- Package.json files: 13
- Kubernetes manifests: 45+
- Docker files: 11
- Configuration files: 30+
- Documentation files: 40+

---

## 1. Root Package Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\package.json
**Current:**
- Line 2: `"name": "jobpilot-platform"`

**Replacement:**
- `"name": "applyforus-platform"`

---

## 2. Application Package Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\web\package.json
**Current:**
- Line 2: `"name": "@jobpilot/web"`

**Replacement:**
- `"name": "@applyforus/web"`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\admin\package.json
**Current:**
- Line 2: `"name": "@jobpilot/admin"`
- Line 5: `"description": "JobPilot Admin Dashboard"`

**Replacement:**
- `"name": "@applyforus/admin"`
- `"description": "ApplyforUs Admin Dashboard"`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\mobile\package.json
**Current:**
- Line 2: `"name": "@jobpilot/mobile"`
- Line 4: `"description": "JobPilot AI Platform Mobile Application"`

**Replacement:**
- `"name": "@applyforus/mobile"`
- `"description": "ApplyforUs AI Platform Mobile Application"`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\extension\package.json
**Current:**
- Line 2: `"name": "@job-apply-platform/extension"`
- Line 4: `"description": "JobPilot AI - Chrome Extension for automated job applications"`

**Replacement:**
- `"name": "@applyforus/extension"`
- `"description": "ApplyforUs AI - Chrome Extension for automated job applications"`

---

## 3. Service Package Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auth-service\package.json
**Current:**
- Line 2: `"name": "jobpilot-auth-service"`
- Line 4: `"description": "Authentication and Authorization Service for JobPilot AI Platform"`
- Line 5: `"author": "JobPilot Team"`
- Line 27: `"@jobpilot/telemetry": "workspace:*"`
- Line 28: `"@jobpilot/logging": "workspace:*"`
- Line 29: `"@jobpilot/security": "workspace:*"`

**Replacement:**
- `"name": "applyforus-auth-service"`
- `"description": "Authentication and Authorization Service for ApplyforUs AI Platform"`
- `"author": "ApplyforUs Team"`
- `"@applyforus/telemetry": "workspace:*"`
- `"@applyforus/logging": "workspace:*"`
- `"@applyforus/security": "workspace:*"`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\user-service\package.json
**Current:**
- `"name": "jobpilot-user-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-user-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\job-service\package.json
**Current:**
- `"name": "jobpilot-job-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-job-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\resume-service\package.json
**Current:**
- `"name": "jobpilot-resume-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-resume-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auto-apply-service\package.json
**Current:**
- `"name": "jobpilot-auto-apply-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-auto-apply-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\analytics-service\package.json
**Current:**
- `"name": "jobpilot-analytics-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-analytics-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\notification-service\package.json
**Current:**
- `"name": "jobpilot-notification-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-notification-service"`
- @applyforus/* dependencies

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\orchestrator-service\package.json
**Current:**
- `"name": "jobpilot-orchestrator-service"`
- Similar @jobpilot/* dependencies

**Replacement:**
- `"name": "applyforus-orchestrator-service"`
- @applyforus/* dependencies

---

## 4. Docker Compose Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.yml
**Current:**
- Line 7: `container_name: jobpilot-postgres`
- Line 14: `POSTGRES_DB: jobpilot`
- Line 25: `- jobpilot-network`
- Line 30: `container_name: jobpilot-redis`
- Line 43: `- jobpilot-network`
- Line 48: `container_name: jobpilot-elasticsearch`
- Line 67: `- jobpilot-network`
- Line 72: `container_name: jobpilot-rabbitmq`
- Line 90: `- jobpilot-network`
- Line 95: `container_name: jobpilot-pgadmin`
- Line 100: `PGADMIN_DEFAULT_EMAIL: admin@jobpilot.ai`
- Line 108: `- jobpilot-network`
- Line 115: `container_name: jobpilot-mailhog`
- Line 121: `- jobpilot-network`
- Line 140: `jobpilot-network:`

**Replacement:**
- `container_name: applyforus-postgres`
- `POSTGRES_DB: applyforus`
- `- applyforus-network`
- `container_name: applyforus-redis`
- `container_name: applyforus-elasticsearch`
- `container_name: applyforus-rabbitmq`
- `container_name: applyforus-pgadmin`
- `PGADMIN_DEFAULT_EMAIL: admin@applyforus.com`
- `container_name: applyforus-mailhog`
- `applyforus-network:`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.dev.yml
**Updates:** Similar pattern - replace all `jobpilot` with `applyforus`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.local.yml
**Updates:**
- Container names
- Database name: `POSTGRES_DB: applyforus`
- Network names
- Database URLs: `postgresql://postgres:postgres123@postgres:5432/applyforus`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.prod.yml
**Updates:** Similar pattern - replace all `jobpilot` with `applyforus`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docker-compose.monitoring.yml
**Current:**
- Line 10: `container_name: jobpilot-prometheus`
- Line 26: `- jobpilot-network`
- Line 38: `container_name: jobpilot-grafana`
- Line 66: `container_name: jobpilot-node-exporter`
- Line 84: `container_name: jobpilot-redis-exporter`
- Line 92: `- jobpilot-network`
- Line 100: `container_name: jobpilot-postgres-exporter`
- Line 104: `DATA_SOURCE_NAME=postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-jobpilot}?sslmode=disable`
- Line 187: `name: jobpilot-monitoring`
- Line 188: `jobpilot-network:`
- Line 190: `name: jobpilot-network`
- Volume names (lines 195-203): All with `jobpilot-` prefix

**Replacement:** Replace all `jobpilot` with `applyforus`

---

## 5. Kubernetes Manifests

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\base\namespace.yaml
**Current:**
- Line 4: `name: jobpilot`
- Line 6: `name: jobpilot`
- Line 8: `app: jobpilot-platform`

**Replacement:**
- `name: applyforus`
- `name: applyforus`
- `app: applyforus-platform`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\base\configmap.yaml
**Current:**
- Line 4: `name: jobpilot-config`
- Line 5: `namespace: jobpilot`
- Line 7: `app: jobpilot-platform`
- Line 14: `POSTGRES_HOST: "jobpilot-postgres.postgres.database.azure.com"`
- Line 16: `POSTGRES_DB: "jobpilot"`
- Line 19: `REDIS_HOST: "jobpilot-redis.redis.cache.windows.net"`
- Line 24: `AUTH_SERVICE_URL: "http://auth-service.jobpilot.svc.cluster.local:3001"`
- Lines 24-31: All service URLs with `.jobpilot.svc.cluster.local`
- Line 34: `AZURE_STORAGE_ACCOUNT_NAME: "jobpilotstorage"`
- Line 39: `AZURE_OPENAI_ENDPOINT: "https://jobpilot-openai.openai.azure.com/"`
- Line 47: `EMAIL_FROM: "noreply@jobpilot.com"`
- Line 50: `CORS_ORIGIN: "https://jobpilot.com,https://www.jobpilot.com"`

**Replacement:**
- `name: applyforus-config`
- `namespace: applyforus`
- `app: applyforus-platform`
- `POSTGRES_HOST: "applyforus-postgres.postgres.database.azure.com"`
- `POSTGRES_DB: "applyforus"`
- `REDIS_HOST: "applyforus-redis.redis.cache.windows.net"`
- All service URLs: `.applyforus.svc.cluster.local`
- `AZURE_STORAGE_ACCOUNT_NAME: "applyforusstorage"`
- `AZURE_OPENAI_ENDPOINT: "https://applyforus-openai.openai.azure.com/"`
- `EMAIL_FROM: "noreply@applyforus.com"`
- `CORS_ORIGIN: "https://applyforus.com,https://www.applyforus.com"`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\services\auth-service.yaml
**Current:**
- Line 5: `namespace: jobpilot`
- Line 40: `serviceAccountName: jobpilot-service-account`
- Line 50: `image: ${ACR_LOGIN_SERVER}/auth-service:${VERSION:-v1.0.0}`
- Line 63: `name: jobpilot-config`
- Line 65: `name: jobpilot-secrets`
- Line 128: `namespace: jobpilot`
- Line 147: `namespace: jobpilot`

**Replacement:**
- `namespace: applyforus`
- `serviceAccountName: applyforus-service-account`
- Docker image will be updated in Docker section
- `name: applyforus-config`
- `name: applyforus-secrets`

**Similar updates for:**
- analytics-service.yaml
- auto-apply-service.yaml
- job-service.yaml
- notification-service.yaml
- orchestrator-service.yaml
- resume-service.yaml
- user-service.yaml
- ai-service.yaml
- web-app.yaml

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\base\secrets.yaml
**Updates:**
- `name: jobpilot-secrets` → `applyforus-secrets`
- `namespace: jobpilot` → `applyforus`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\base\ingress.yaml
**Updates:**
- `namespace: jobpilot` → `applyforus`
- Host names: `jobpilot.com` → `applyforus.com`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\base\serviceaccount.yaml
**Updates:**
- `name: jobpilot-service-account` → `applyforus-service-account`
- `namespace: jobpilot` → `applyforus`

---

## 6. Azure Pipeline Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\azure-pipelines.yml
**Current:**
- Line 2: `# Azure DevOps CI/CD Pipeline for JobPilot AI Platform`
- Line 206: `POSTGRES_DB: jobpilot_test`
- Line 237: `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/jobpilot_test`
- Line 671: `value: 'jobpilot-dev'`
- Line 748: `# curl -f https://dev.jobpilot.ai/health || exit 1`
- Line 763: `value: 'jobpilot-staging'`
- Line 853: `value: 'jobpilot-prod'`
- Line 949-950: `# curl -f https://jobpilot.ai/health || exit 1`

**Replacement:**
- `# Azure DevOps CI/CD Pipeline for ApplyforUs AI Platform`
- `POSTGRES_DB: applyforus_test`
- `DATABASE_URL: postgresql://postgres:postgres@localhost:5432/applyforus_test`
- `value: 'applyforus-dev'`
- `# curl -f https://dev.applyforus.com/health || exit 1`
- `value: 'applyforus-staging'`
- `value: 'applyforus-prod'`
- `# curl -f https://applyforus.com/health || exit 1`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\azure-pipelines-terraform.yml
**Current:**
- Line 2: `# Azure DevOps Terraform Pipeline for JobPilot AI Platform`
- Line 179: `environment: 'jobpilot-dev'`
- Line 302: `environment: 'jobpilot-staging'`
- Line 419: `environment: 'jobpilot-prod'`
- Line 478: `environment: 'jobpilot-destroy'`

**Replacement:**
- `# Azure DevOps Terraform Pipeline for ApplyforUs AI Platform`
- `environment: 'applyforus-dev'`
- `environment: 'applyforus-staging'`
- `environment: 'applyforus-prod'`
- `environment: 'applyforus-destroy'`

---

## 7. Documentation Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\README.md
**Current:**
- Line 1: `# JobPilot AI Platform`
- Line 11: `JobPilot AI is a full-stack...`
- Line 253: `- **Documentation**: [docs.jobpilot.ai]`
- Line 254: `- **API Status**: [status.jobpilot.ai]`
- Line 255: `- **Email Support**: support@jobpilot.ai`
- Line 257: `- **Developer Forum**: [community.jobpilot.com]`
- Line 270: `Made with care by the JobPilot team`

**Replacement:**
- `# ApplyforUs AI Platform`
- `ApplyforUs AI is a full-stack...`
- `- **Documentation**: [docs.applyforus.com]`
- `- **API Status**: [status.applyforus.com]`
- `- **Email Support**: support@applyforus.com`
- `- **Developer Forum**: [community.applyforus.com]`
- `Made with care by the ApplyforUs team`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\CONTRIBUTING.md
**Current:**
- Line 1: `# Contributing to JobPilot AI Platform`
- Line 3: `Thank you for your interest in contributing to JobPilot AI Platform!`
- Line 694: `4. Join our [Discord](https://discord.gg/jobpilot)`
- Line 695: `5. Email: dev@jobpilot.ai`
- Line 703: `Thank you for contributing to JobPilot AI Platform!`

**Replacement:**
- `# Contributing to ApplyforUs AI Platform`
- `Thank you for your interest in contributing to ApplyforUs AI Platform!`
- `4. Join our [Discord](https://discord.gg/applyforus)`
- `5. Email: dev@applyforus.com`
- `Thank you for contributing to ApplyforUs AI Platform!`

---

### Documentation Files (40+ files in docs/ directory)
All documentation files containing "JobPilot" need updates:
- docs/api/README.md
- docs/api/JobPilot-API.postman_collection.json → **Rename to:** ApplyforUs-API.postman_collection.json
- docs/architecture.md
- docs/getting-started.md
- docs/troubleshooting.md
- docs/monitoring/README.md
- docs/deployment/DEPLOYMENT_GUIDE.md
- docs/EXECUTIVE_SUMMARY.md
- docs/AZURE_DEVOPS_CICD_SETUP.md
- All ADR files in docs/adr/
- All consolidated docs in docs/consolidated/

---

## 8. Environment Files

### All .env and .env.example files
**Pattern to update:**
- Database names: `jobpilot` → `applyforus`
- Service URLs containing `jobpilot` → `applyforus`
- Email addresses: `@jobpilot.ai` → `@applyforus.com`
- Domain references

**Files:**
- .env.example
- .env.monitoring.example
- apps/web/.env.local
- apps/admin/.env.example
- apps/mobile/.env.example
- services/*/\.env
- services/*/\.env.example

---

## 9. Infrastructure Files

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\terraform\main.tf
**Updates:** All resource names, tags, and references from `jobpilot` to `applyforus`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\monitoring-stack.yaml
**Updates:** Namespace and service references

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\api-gateway\kong-config.yaml
**Updates:** Service references and routing

---

## 10. Test and Script Files

### All test files referencing JobPilot
- apps/web/src/**/__tests__/**
- services/*/test/**
- tests/**

---

### Python and JavaScript utility scripts
- fix_services.py
- fix_k8s_manifests.py
- Any other scripts with hardcoded paths or references

---

## 11. Configuration Files

### TypeScript Configuration Files
- tsconfig.base.json - Update paths if they reference `@jobpilot/*`
- All service-level tsconfig.json files

---

### Next.js Configuration Files
- apps/web/next.config.js
- apps/admin/next.config.js

---

### Tailwind Configuration Files
- apps/web/tailwind.config.ts
- apps/admin/tailwind.config.js
- apps/extension/tailwind.config.js

---

## 12. API Documentation

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\docs\api\JobPilot-API.postman_collection.json
**Action:** Rename file to `ApplyforUs-API.postman_collection.json`
**Content Updates:**
- Line 3: `"name": "JobPilot AI Platform API"` → `"name": "ApplyforUs AI Platform API"`
- Line 4: `"description": "Complete API collection for JobPilot AI Platform microservices"` → `"description": "Complete API collection for ApplyforUs AI Platform microservices"`
- All endpoint URLs containing `jobpilot` domains

---

## 13. Marketing and Summary Files

All summary and marketing documentation:
- CICD_IMPLEMENTATION_SUMMARY.md
- SECURITY_CHANGES_SUMMARY.md
- PERFORMANCE_SUMMARY.md
- LOGGING_IMPLEMENTATION_SUMMARY.md
- FEATURE_FLAGS_IMPLEMENTATION_SUMMARY.md
- ALERTING_IMPLEMENTATION_COMPLETE.md
- All README files in subdirectories

---

## 14. Monitoring and Alerting

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\monitoring\alertmanager-config.yaml
**Updates:**
- Email receivers: `@jobpilot.com` → `@applyforus.com`

---

### C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\infrastructure\kubernetes\monitoring\prometheus-rules.yaml
**Updates:**
- Alert labels and descriptions

---

## 15. Service README Files

- services/auth-service/README.md
- services/user-service/README.md
- services/job-service/README.md
- services/resume-service/README.md
- services/auto-apply-service/README.md
- services/analytics-service/README.md
- services/notification-service/README.md

---

## Files NOT to Update

The following files should NOT be updated as they are from external dependencies:
- node_modules/**/* (all files)
- .git/** (git internals)
- dist/** (build outputs - will be regenerated)
- build/** (build outputs - will be regenerated)
- coverage/** (test coverage - will be regenerated)

---

## Search Patterns for Verification

After running the migration script, verify all instances are updated:

```bash
# Case-sensitive searches
grep -r "JobPilot" --exclude-dir=node_modules .
grep -r "jobpilot" --exclude-dir=node_modules .
grep -r "JOBPILOT" --exclude-dir=node_modules .

# Case-insensitive comprehensive search
grep -ri "job-apply-platform" --exclude-dir=node_modules .
grep -ri "jobpilot" --exclude-dir=node_modules .

# Check for email addresses
grep -r "@jobpilot" --exclude-dir=node_modules .

# Check for domain names
grep -r "jobpilot.ai" --exclude-dir=node_modules .
grep -r "jobpilot.com" --exclude-dir=node_modules .
```

---

## Manual Review Required

After automated replacement, manually review:
1. All package.json files - ensure dependencies are correctly updated
2. Docker compose files - verify network and service names
3. Kubernetes manifests - verify namespace and service references
4. Environment files - verify all URLs and connection strings
5. CI/CD pipelines - verify environment names and deployment targets
6. Documentation - ensure context makes sense after replacement

---

## Total Estimated Files to Update

- **Configuration files:** ~50
- **Documentation files:** ~60
- **Code files with comments/strings:** ~30
- **Infrastructure files:** ~45
- **Total:** ~185 files

---

**Generated:** 2025-12-08
**Status:** Ready for migration script execution
