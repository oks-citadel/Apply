# ApplyForUs Platform - Production Readiness Checklist

**Generated:** 2025-12-25
**Version:** 1.0.0
**Platform:** ApplyForUs SaaS Platform

---

## Pre-Deployment Checklist

### 1. Infrastructure Foundation

#### 1.1 Azure Resources
- [ ] Resource Group created: `applyforus-prod-rg`
- [ ] Virtual Network configured with proper subnets
- [ ] AKS cluster provisioned and healthy
- [ ] Container Registry (ACR) accessible from AKS
- [ ] PostgreSQL Flexible Server provisioned
- [ ] Redis Cache provisioned
- [ ] Key Vault created with secrets
- [ ] Application Insights configured
- [ ] Log Analytics Workspace created

#### 1.2 DNS Configuration
- [ ] Azure DNS Zone created for `applyforus.com`
- [ ] A record pointing to Front Door
- [ ] CNAME for `www` subdomain
- [ ] CNAME for `api` subdomain
- [ ] CAA records configured
- [ ] SPF/DKIM/DMARC for email (if applicable)

#### 1.3 TLS/SSL
- [ ] Azure-managed certificates enabled
- [ ] Front Door custom domain with HTTPS
- [ ] Minimum TLS version set to 1.2
- [ ] Certificate auto-renewal verified

#### 1.4 Front Door / WAF
- [ ] Front Door profile created
- [ ] WAF policy attached
- [ ] OWASP ruleset enabled
- [ ] Rate limiting configured
- [ ] Health probes configured for all origins

---

### 2. Identity & Authentication

#### 2.1 Entra ID / B2C Configuration
- [ ] B2C tenant created (if using B2C) or Azure AD configured
- [ ] App registration: `applyforus-prod-web`
- [ ] App registration: `applyforus-prod-api`
- [ ] App registration: `applyforus-prod-automation`
- [ ] Service principals created
- [ ] Client secrets stored in Key Vault (not expired)

#### 2.2 OAuth2 Scopes & Permissions
- [ ] User impersonation scope defined
- [ ] Profile read/write scopes defined
- [ ] Jobs read/apply scopes defined
- [ ] Resume manage scope defined
- [ ] Subscription manage scope defined

#### 2.3 Security Groups (B2C)
- [ ] Subscription tier groups created:
  - [ ] `applyforus-freemium-prod`
  - [ ] `applyforus-starter-prod`
  - [ ] `applyforus-basic-prod`
  - [ ] `applyforus-professional-prod`
  - [ ] `applyforus-advanced_career-prod`
  - [ ] `applyforus-executive_elite-prod`
- [ ] Special groups created:
  - [ ] `applyforus-verified-prod`
  - [ ] `applyforus-support-prod`
  - [ ] `applyforus-admin-prod`
  - [ ] `applyforus-super_admin-prod`
  - [ ] `applyforus-suspended-prod`

#### 2.4 Graph API Permissions
- [ ] `Group.ReadWrite.All` granted to automation app
- [ ] `User.Read.All` granted to automation app
- [ ] Admin consent obtained

---

### 3. Kubernetes Deployment

#### 3.1 Namespace & RBAC
- [ ] Namespace `applyforus` created
- [ ] Service accounts configured
- [ ] RBAC roles and bindings applied
- [ ] Pod security policies/standards configured

#### 3.2 Core Services
- [ ] `web-app` deployment healthy
- [ ] `auth-service` deployment healthy
- [ ] `user-service` deployment healthy
- [ ] `job-service` deployment healthy
- [ ] `resume-service` deployment healthy
- [ ] `ai-service` deployment healthy
- [ ] `notification-service` deployment healthy
- [ ] `payment-service` deployment healthy
- [ ] `analytics-service` deployment healthy
- [ ] `orchestrator-service` deployment healthy
- [ ] `auto-apply-service` deployment healthy

#### 3.3 Supporting Infrastructure
- [ ] Ingress controller installed (nginx-ingress)
- [ ] Cert-manager configured (if using)
- [ ] External-DNS configured (if using)
- [ ] Redis connected and healthy
- [ ] RabbitMQ/Service Bus connected

#### 3.4 Network Policies
- [ ] Default deny policy applied
- [ ] Inter-service communication allowed
- [ ] Ingress traffic restricted
- [ ] Egress rules configured

---

### 4. Database & Storage

#### 4.1 PostgreSQL
- [ ] Database server running
- [ ] Required databases created:
  - [ ] `applyforus_auth`
  - [ ] `job_service_db`
  - [ ] `user_service_db`
  - [ ] `notification_service`
  - [ ] `analytics_db`
  - [ ] `payment_db`
- [ ] Connection pooling configured
- [ ] Backup policy enabled (daily)
- [ ] Point-in-time recovery enabled
- [ ] Read replica configured (optional)

#### 4.2 Redis Cache
- [ ] Cache accessible from AKS
- [ ] Persistence configured
- [ ] Memory policies set
- [ ] Connection limits configured

#### 4.3 Blob Storage
- [ ] Storage account created
- [ ] Containers for resumes/documents
- [ ] Private endpoint configured
- [ ] Soft delete enabled

---

### 5. Secrets & Configuration

#### 5.1 Key Vault Secrets
- [ ] Database connection strings
- [ ] Redis connection string
- [ ] JWT signing keys
- [ ] OAuth client secrets
- [ ] Stripe/Flutterwave/Paystack API keys
- [ ] SendGrid/SMTP credentials
- [ ] AI service API keys

#### 5.2 Environment Variables
- [ ] All services have required env vars
- [ ] Secrets mounted from Key Vault
- [ ] ConfigMaps for non-secret config
- [ ] Feature flags configured

---

### 6. Monitoring & Alerting

#### 6.1 Application Insights
- [ ] SDK integrated in all services
- [ ] Custom events tracking
- [ ] Dependency tracking enabled
- [ ] Sampling rate configured

#### 6.2 Alerts
- [ ] CPU/Memory alerts configured
- [ ] Error rate alerts
- [ ] Latency alerts
- [ ] Availability alerts
- [ ] Certificate expiry alerts
- [ ] Database connection alerts

#### 6.3 Dashboards
- [ ] Overview dashboard created
- [ ] Per-service dashboards
- [ ] Business metrics dashboard

---

### 7. Security

#### 7.1 Network Security
- [ ] Private endpoints for PaaS services
- [ ] NSG rules configured
- [ ] DDoS protection enabled
- [ ] WAF blocking suspicious traffic

#### 7.2 Application Security
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation in place
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CSRF tokens implemented

#### 7.3 Data Protection
- [ ] Encryption at rest enabled
- [ ] Encryption in transit (TLS)
- [ ] PII data handling compliant
- [ ] GDPR compliance (if applicable)

#### 7.4 Access Control
- [ ] MFA enabled for admin accounts
- [ ] Service-to-service auth working
- [ ] API key management in place
- [ ] Audit logging enabled

---

### 8. Payment Integration

#### 8.1 Payment Providers
- [ ] Stripe integration tested
- [ ] Flutterwave integration tested (if applicable)
- [ ] Paystack integration tested (if applicable)
- [ ] Webhook endpoints configured
- [ ] Webhook signature validation

#### 8.2 Subscription Management
- [ ] Tier upgrade flow tested
- [ ] Tier downgrade flow tested
- [ ] Cancellation flow tested
- [ ] Payment failure handling
- [ ] Dunning emails configured

---

### 9. CI/CD Pipeline

#### 9.1 Build Pipeline
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Security scans pass
- [ ] Docker images build successfully

#### 9.2 Deployment Pipeline
- [ ] Staging deployment successful
- [ ] Production deployment tested
- [ ] Rollback procedure documented
- [ ] Blue-green or canary strategy

---

### 10. Self-Healing & Validation

#### 10.1 Validation Scripts
- [ ] `validate-infrastructure.sh` runs clean
- [ ] `validate-identity.sh` runs clean
- [ ] Group reconciliation tested

#### 10.2 Automated Recovery
- [ ] Pod restart policies configured
- [ ] HPA (Horizontal Pod Autoscaler) configured
- [ ] Liveness probes configured
- [ ] Readiness probes configured

---

## Post-Deployment Verification

### Smoke Tests
- [ ] Homepage loads (`https://applyforus.com`)
- [ ] Login flow works
- [ ] Registration flow works
- [ ] Job search returns results
- [ ] Profile update works
- [ ] Payment flow works (test mode)

### Integration Tests
- [ ] Auth service ↔ User service
- [ ] Job service ↔ AI service
- [ ] Payment service ↔ Group sync
- [ ] Notification service ↔ Email provider

### Load Testing
- [ ] Expected load handled
- [ ] Auto-scaling triggers correctly
- [ ] No memory leaks under load

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Platform Engineer | | | |
| Security Engineer | | | |
| QA Lead | | | |
| DevOps Lead | | | |
| Product Owner | | | |

---

## Rollback Procedure

### Quick Rollback (< 5 minutes)
```bash
# Rollback to previous deployment
kubectl rollout undo deployment/<service-name> -n applyforus

# Or rollback all services
for svc in web-app auth-service user-service job-service; do
  kubectl rollout undo deployment/$svc -n applyforus
done
```

### Database Rollback
1. Identify last known good backup
2. Restore to staging first
3. Verify data integrity
4. Promote to production

### DNS Failover
1. Update Front Door origin to maintenance page
2. Investigate and fix issues
3. Restore Front Door origin

---

## Emergency Contacts

| Role | Contact | Phone | Escalation Time |
|------|---------|-------|-----------------|
| On-Call Engineer | | | Immediate |
| Platform Lead | | | 15 minutes |
| Security Team | | | 30 minutes |
| Executive Sponsor | | | 1 hour |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-12-25 | Claude Code | Initial version |

---

*Generated by Claude Code for ApplyForUs Platform*
