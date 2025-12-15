# Operations Documentation

This directory contains comprehensive operational documentation for the ApplyForUs platform CI/CD pipelines, deployment procedures, and incident response protocols.

## Documents

### 1. [CICD_HARDENING_REPORT.md](./CICD_HARDENING_REPORT.md)
**Comprehensive CI/CD Security & Reliability Audit**

A detailed analysis of the entire CI/CD pipeline infrastructure covering:
- Security scanning (SAST, SCA, container, secrets, IaC)
- Deployment gates and safety checks
- Test coverage and quality gates
- Infrastructure-as-Code validation
- Rollback capabilities
- Secrets management
- Compliance and audit trails

**Key Findings:**
- Overall Security Rating: 7.5/10
- Deployment Safety Rating: 8/10
- IaC Security Rating: 8.5/10

**Audience:** DevOps Engineers, Security Team, Platform Engineers, Engineering Leadership

---

### 2. [CICD_QUICK_FIXES.md](./CICD_QUICK_FIXES.md)
**Immediate Action Items - Critical Fixes**

A focused, actionable guide for implementing the most critical fixes identified in the hardening report.

**Priority:** CRITICAL
**Time Required:** 1-2 hours
**Impact:** HIGH - Prevents broken/vulnerable code from reaching production

**Contains:**
1. Remove `continue-on-error` from tests (CRITICAL)
2. Make security scans blocking (CRITICAL)
3. Remove production staging bypass (CRITICAL)
4. Add integration tests as deployment gate
5. Harden Terraform security scanning
6. Verification commands and rollback plan

**Audience:** DevOps Engineers (Implementation Team)

---

### 3. [ROLLBACK_PROCEDURES.md](./ROLLBACK_PROCEDURES.md)
**Emergency Rollback & Incident Response Guide**

A comprehensive, easy-to-follow guide for rolling back deployments in any situation.

**Contains:**
- Quick decision tree for choosing rollback method
- Automated GitHub Actions rollback (10-15 min)
- Manual Kubernetes rollback (2-5 min)
- Emergency procedures for different severity levels
- Post-rollback verification checklist
- Incident documentation templates
- Common rollback scenarios with solutions

**Audience:** On-Call Engineers, DevOps Team, Platform Engineers

---

## Quick Links

### For Developers
- **Before merging a PR:** Review the test requirements in [CICD_HARDENING_REPORT.md - Section 6](./CICD_HARDENING_REPORT.md#6-integration--e2e-testing)
- **If your PR is blocked:** Check [CICD_QUICK_FIXES.md - Section 6](./CICD_QUICK_FIXES.md#6-verification-commands)

### For On-Call Engineers
- **Production incident?** Start with [ROLLBACK_PROCEDURES.md - Quick Decision Tree](./ROLLBACK_PROCEDURES.md#quick-decision-tree)
- **Need to rollback?** Use [ROLLBACK_PROCEDURES.md - Section 2 or 3](./ROLLBACK_PROCEDURES.md#automated-rollback)

### For DevOps Team
- **Implementing fixes?** Follow [CICD_QUICK_FIXES.md](./CICD_QUICK_FIXES.md) in order
- **Planning improvements?** Review [CICD_HARDENING_REPORT.md - Section 11](./CICD_HARDENING_REPORT.md#11-priority-recommendations)

### For Leadership
- **Security status?** See [CICD_HARDENING_REPORT.md - Executive Summary](./CICD_HARDENING_REPORT.md#executive-summary)
- **Risk assessment?** Review [CICD_HARDENING_REPORT.md - Section 2.2](./CICD_HARDENING_REPORT.md#22-️-areas-of-concern)

---

## CI/CD Pipeline Overview

### Environments & Deployment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Development │ --> │   Staging   │ --> │ Production  │
│   (auto)    │     │  (approved) │     │  (manual)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       │                    │                    │
    develop              main              v*.*.* tag
```

### Key Workflows

| Workflow | Trigger | Environment | Purpose |
|----------|---------|-------------|---------|
| `cd-dev.yml` | Push to `develop` | Development | Continuous deployment |
| `cd-staging.yml` | Push to `main` | Staging | Release candidate testing |
| `cd-prod.yml` | Version tag | Production | Production deployment |
| `terraform-*.yml` | PR/Push | All | Infrastructure changes |
| `security-scan.yml` | PR/Push/Daily | N/A | Security scanning |
| `integration-tests.yml` | PR/Push/Daily | Test | Integration testing |
| `rollback.yml` | Manual | Staging/Prod | Emergency rollback |

---

## Required Secrets

### Azure Infrastructure
```
AZURE_CREDENTIALS
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_SUBSCRIPTION_ID
AZURE_TENANT_ID
ACR_USERNAME
ACR_PASSWORD
```

### Application (per environment)
```
JWT_SECRET
JWT_REFRESH_SECRET
DATABASE_URL_DEV
DATABASE_URL_STAGING
DATABASE_URL_PROD
REDIS_URL_DEV
REDIS_URL_STAGING
REDIS_URL_PROD
```

### Third-Party Services
```
STRIPE_SECRET_KEY_DEV
STRIPE_SECRET_KEY_STAGING
STRIPE_SECRET_KEY_PROD
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
SENDGRID_API_KEY
APPLICATIONINSIGHTS_CONNECTION_STRING
```

See [CICD_HARDENING_REPORT.md - Section 8](./CICD_HARDENING_REPORT.md#8-required-secrets-audit) for complete list.

---

## Current Status

### ✅ What's Working Well

1. **Security Scanning**
   - Multiple scanners (Trivy, CodeQL, Semgrep, Checkov, tfsec)
   - Daily scheduled scans
   - SARIF reporting to GitHub Security

2. **Deployment Safety**
   - Rolling updates configured
   - Blue-green deployment for frontend
   - Health checks in all services
   - Backup before production deployments

3. **Rollback Capability**
   - Automated workflow available
   - Manual procedures documented
   - Quick recovery possible (2-15 minutes)

4. **IaC Security**
   - Terraform plan on PRs
   - Security scanning (tfsec, Checkov)
   - Drift detection capability
   - Separate state files per environment

### ⚠️ Critical Issues to Address

1. **Tests don't block deployment** (`continue-on-error: true`)
   - Risk: Broken code can reach production
   - Fix: [CICD_QUICK_FIXES.md - Section 1](./CICD_QUICK_FIXES.md#1-remove-continue-on-error-from-tests-critical)

2. **Security scans don't block** (in some pipelines)
   - Risk: Vulnerable code can be deployed
   - Fix: [CICD_QUICK_FIXES.md - Section 2](./CICD_QUICK_FIXES.md#2-make-security-scans-blocking-critical)

3. **Production staging bypass option**
   - Risk: Skipping critical safety check
   - Fix: [CICD_QUICK_FIXES.md - Section 3](./CICD_QUICK_FIXES.md#3-remove-production-staging-bypass-critical)

4. **Integration tests run after deployment**
   - Risk: Broken integrations deploy to staging
   - Fix: [CICD_QUICK_FIXES.md - Section 4](./CICD_QUICK_FIXES.md#4-add-integration-tests-as-deployment-gate)

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
**Owner:** DevOps Team
**Time:** 1-2 hours

- [ ] Remove `continue-on-error` from test jobs
- [ ] Make security scans blocking
- [ ] Remove production staging bypass
- [ ] Update branch protection rules

**Resources:** [CICD_QUICK_FIXES.md](./CICD_QUICK_FIXES.md)

### Phase 2: High Priority (Weeks 2-3)
**Owner:** DevOps + Platform Engineering
**Time:** 16-24 hours

- [ ] Implement image signature verification (Cosign)
- [ ] Add secret rotation workflow
- [ ] Add integration tests as pre-deployment gate
- [ ] Strengthen Terraform security scanning
- [ ] Add canary deployment for production

**Resources:** [CICD_HARDENING_REPORT.md - Section 11.2](./CICD_HARDENING_REPORT.md#112-high-priority-implement-within-2-weeks)

### Phase 3: Medium Priority (Month 2)
**Owner:** Platform Engineering
**Time:** 40-60 hours

- [ ] Add test coverage gates (80% threshold)
- [ ] Implement cost estimation (Infracost)
- [ ] Add performance baseline tests
- [ ] Expand container security scanning
- [ ] Add comprehensive deployment verification

**Resources:** [CICD_HARDENING_REPORT.md - Section 11.3](./CICD_HARDENING_REPORT.md#113-medium-priority-implement-within-1-month)

### Phase 4: Enhancements (Month 3)
**Owner:** Platform Engineering
**Time:** 60-80 hours

- [ ] Implement SBOM tracking
- [ ] Add DORA metrics dashboard
- [ ] Implement progressive delivery
- [ ] Add compliance automation

**Resources:** [CICD_HARDENING_REPORT.md - Section 11.4](./CICD_HARDENING_REPORT.md#114-low-priority-implement-within-3-months)

---

## Monitoring & Metrics

### Key Metrics to Track

| Metric | Target | Current | Trend |
|--------|--------|---------|-------|
| Deployment frequency | Daily | ? | - |
| Lead time to production | < 4 hours | ? | - |
| Deployment failure rate | < 5% | ? | - |
| Mean time to recovery (MTTR) | < 15 min | ? | - |
| Security vulnerabilities in prod | 0 CRITICAL | ? | - |
| Test coverage | > 80% | ? | - |

### Dashboards

- **GitHub Actions:** [Actions Tab](../../.github/workflows/)
- **Azure Portal:** [AKS Cluster Monitoring]
- **Application Insights:** [Performance Dashboard]
- **Security:** [GitHub Security Tab](../../security)

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Notification |
|-------|-------------|---------------|--------------|
| **P0** | Total outage | Immediate | Phone + Slack + PagerDuty |
| **P1** | Major service degradation | < 5 min | Slack + PagerDuty |
| **P2** | Minor service impact | < 15 min | Slack |
| **P3** | No user impact | < 1 hour | Ticket |

### Emergency Contacts

- **On-Call Engineer:** See PagerDuty rotation
- **DevOps Lead:** [Name] - Slack: @devops-lead
- **Platform Engineer:** [Name] - Slack: @platform-eng
- **Engineering Manager:** [Name] - Slack: @eng-manager

### Incident Channels

- **Slack:** #incidents (primary), #devops-alerts
- **PagerDuty:** [link]
- **Zoom:** [emergency meeting link]

---

## Training & Resources

### For New Team Members

1. **Read in order:**
   - This README (15 min)
   - [CICD_HARDENING_REPORT.md - Sections 1-2](./CICD_HARDENING_REPORT.md) (30 min)
   - [ROLLBACK_PROCEDURES.md - Sections 1-3](./ROLLBACK_PROCEDURES.md) (30 min)

2. **Practice:**
   - Deploy to development
   - Run a test rollback in staging
   - Review a recent incident report

3. **Shadow:**
   - Join an on-call engineer for a shift
   - Participate in a deployment to production

### Monthly Drills

**Schedule:** First Monday of each month

1. **Rollback Drill** (30 min)
   - Practice automated rollback in staging
   - Practice manual kubectl rollback
   - Document time taken

2. **Incident Response** (30 min)
   - Simulate a production incident
   - Practice communication protocols
   - Review and update procedures

3. **Review** (30 min)
   - Review metrics from last month
   - Discuss improvements
   - Update documentation

---

## Contributing

### Updating Documentation

1. **Make changes** in your branch
2. **Test procedures** if applicable
3. **Submit PR** with:
   - Clear description of changes
   - Reason for update
   - Screenshots/examples if relevant

4. **Get review** from:
   - DevOps Lead (required)
   - One other team member

### Documentation Standards

- **Use clear, actionable language**
- **Include examples and commands**
- **Keep procedures up-to-date with code**
- **Test procedures before publishing**
- **Include screenshots where helpful**
- **Version control all changes**

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-12-15 | Initial documentation creation | CI/CD Hardening Agent |
| 2025-12-15 | Added comprehensive hardening report | CI/CD Hardening Agent |
| 2025-12-15 | Added quick fixes guide | CI/CD Hardening Agent |
| 2025-12-15 | Added rollback procedures | CI/CD Hardening Agent |

---

## Review Schedule

| Document | Review Frequency | Next Review | Owner |
|----------|------------------|-------------|-------|
| CICD_HARDENING_REPORT.md | Monthly | 2026-01-15 | DevOps Lead |
| CICD_QUICK_FIXES.md | After implementation | TBD | DevOps Lead |
| ROLLBACK_PROCEDURES.md | Monthly | 2026-01-15 | On-Call Team |
| README.md | Quarterly | 2026-03-15 | DevOps Lead |

---

## Questions or Issues?

- **Slack:** #devops, #platform-engineering
- **Email:** devops@applyforus.com
- **GitHub Issues:** [Create an issue](../../issues/new)

---

**Maintained By:** DevOps Team
**Last Updated:** 2025-12-15
**Version:** 1.0.0
