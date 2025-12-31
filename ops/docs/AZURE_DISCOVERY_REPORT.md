# Azure to AWS Migration Discovery Report

**Generated:** 2025-12-30
**Organization:** ApplyForUs Platform
**Target AWS Organization:** o-14wy6xb785

---

## Executive Summary

This report documents the complete Azure infrastructure inventory for the ApplyForUs job application platform. The platform consists of **10 microservices**, **3 frontend applications**, and supporting infrastructure deployed on Azure Kubernetes Service (AKS) with Azure PaaS services.

### Migration Complexity Assessment

| Category | Complexity | Effort |
|----------|------------|--------|
| Compute (AKS → EKS) | Medium | 40-60 hours |
| Database (PostgreSQL) | Low | 20-30 hours |
| Caching (Redis) | Low | 10-15 hours |
| Messaging (RabbitMQ) | Medium | 15-20 hours |
| Search (Elasticsearch) | Low | 10-15 hours |
| Monitoring (App Insights → CloudWatch) | High | 30-40 hours |
| CI/CD (Azure DevOps → GitHub Actions) | Medium | 25-35 hours |
| Container Registry (ACR → ECR) | Low | 10-15 hours |
| **Total Estimated Effort** | - | **160-230 hours** |

---

## 1. Azure Resource Inventory

### 1.1 Compute Resources

#### Azure Kubernetes Service (AKS)
| Environment | Node Pool | VM Size | Node Count | Cost Impact |
|-------------|-----------|---------|------------|-------------|
| Dev | System | Standard_D2s_v3 | 1-3 | Low |
| Staging | System | Standard_D4s_v3 | 2-5 | Medium |
| Prod | System | Standard_D8s_v3 | 3-10 | High |

**Features Enabled:**
- OIDC and Workload Identity
- Azure Policy integration
- Microsoft Defender for Cloud
- Auto-shutdown schedules (Dev/Staging only)
  - Weeknight shutdown: 8 PM UTC
  - Weekend shutdown (Dev): Friday 8 PM
  - Estimated savings: $400/month (dev), $200/month (staging)

#### App Service Plans
| Environment | SKU | Capacity | Autoscaling |
|-------------|-----|----------|-------------|
| Dev | B1 (Basic) | 1 | No |
| Staging | S1 (Standard) | 2 | 2-5 replicas |
| Prod | P1v3 (PremiumV3) | 3 | 3-10 replicas |

### 1.2 Database Resources

#### Azure Database for PostgreSQL Flexible Server
| Environment | SKU | Storage | HA | Backup |
|-------------|-----|---------|-----|--------|
| Dev | B_Standard_B1ms | 32 GB | No | 7 days |
| Staging | GP_Standard_D2s_v3 | 64 GB | No | 14 days |
| Prod | GP_Standard_D4s_v3 | 128 GB | Zone Redundant | 35 days + geo |

**Databases (8 total):**
1. `auth_service_db`
2. `user_service_db`
3. `job_service_db`
4. `resume_service_db`
5. `notification_service_db`
6. `analytics_service_db`
7. `auto_apply_service_db`
8. `payment_service_db`

### 1.3 Caching Layer

#### Azure Cache for Redis
| Environment | SKU | Capacity | Features |
|-------------|-----|----------|----------|
| Dev | Basic C0 | 250 MB | No persistence |
| Staging | Standard C1 | 1 GB | Partitioning |
| Prod | Premium P1 | 6 GB | Persistence, sharding, zone redundancy |

**Services Using Redis:**
- api-gateway (rate limiting, session cache)
- auth-service (token blacklisting)
- job-service (search caching)
- notification-service (Bull queues)
- ai-service (response caching)
- auto-apply-service (session state)

### 1.4 Messaging & Events

#### Azure Service Bus / RabbitMQ
| Environment | Provider | SKU | Purpose |
|-------------|----------|-----|---------|
| Dev | RabbitMQ | Local | Development |
| Staging | Azure Service Bus | Standard | Testing |
| Prod | Azure Service Bus | Premium | Production (zone redundant) |

**Queues:**
- `job-applications` (14-day TTL)
- `resume-processing` (7-day TTL)
- `notifications` (1-day TTL)
- `analytics-events` (30-day TTL)
- `payment_events`
- `subscription_events`

### 1.5 Search & Indexing

#### Elasticsearch (Azure-hosted)
- **Endpoint:** `https://applyforus-elasticsearch.azurewebsites.net:9200`
- **Service:** job-service
- **Purpose:** Job search, skill extraction, taxonomy

### 1.6 Container Registry

#### Azure Container Registry (ACR)
| Environment | SKU | Retention | Geo-Replication |
|-------------|-----|-----------|-----------------|
| Dev | Basic | None | No |
| Staging | Standard | 7 days | No |
| Prod | Premium | 30 days | East US 2, West Europe |

**Images (11 services):**
- `applyforusacr.azurecr.io/applyai-web`
- `applyforusacr.azurecr.io/applyai-auth-service`
- `applyforusacr.azurecr.io/applyai-user-service`
- `applyforusacr.azurecr.io/applyai-job-service`
- `applyforusacr.azurecr.io/applyai-resume-service`
- `applyforusacr.azurecr.io/applyai-notification-service`
- `applyforusacr.azurecr.io/applyai-auto-apply-service`
- `applyforusacr.azurecr.io/applyai-analytics-service`
- `applyforusacr.azurecr.io/applyai-ai-service`
- `applyforusacr.azurecr.io/applyai-orchestrator-service`
- `applyforusacr.azurecr.io/applyai-payment-service`

### 1.7 Secrets & Key Management

#### Azure Key Vault
- **SKU:** Standard
- **Soft Delete:** 90 days
- **Purge Protection:** Prod only

**Secrets Stored:**
- Database connection strings (8 services)
- Redis connection string + password
- Service Bus connection string
- JWT signing + refresh secrets
- Session and encryption keys
- App Insights credentials

### 1.8 Monitoring & Logging

#### Application Insights + Log Analytics
| Environment | Retention | Daily Quota |
|-------------|-----------|-------------|
| Dev | 30 days | 5 GB |
| Staging | 60 days | 5 GB |
| Prod | 90 days | Unlimited |

### 1.9 Networking

#### Virtual Networks
| Environment | CIDR | Subnets |
|-------------|------|---------|
| Dev | 10.0.0.0/16 | 5 |
| Staging | 10.1.0.0/16 | 5 |
| Prod | 10.2.0.0/16 | 5 |

**Subnets per VNet:**
1. App Services (/24)
2. Database (/24)
3. Cache (/24)
4. Private Endpoints (/24)
5. AKS (/23)

---

## 2. Kubernetes Workload Inventory

### 2.1 Service Resource Requirements

| Service | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit | Port |
|---------|----------|-------------|-----------|----------------|--------------|------|
| web-app | 3 | 250m | 1000m | 256Mi | 1Gi | 3000 |
| admin-app | 2 | 100m | 500m | 256Mi | 512Mi | 3001 |
| employer-app | 2 | 100m | 500m | 256Mi | 512Mi | 3002 |
| auth-service | 2 | 100m | 300m | 128Mi | 256Mi | 4000 |
| user-service | 2 | 100m | 300m | 128Mi | 256Mi | 4004 |
| job-service | 2 | 100m | 300m | 128Mi | 256Mi | 4002 |
| resume-service | 2 | 100m | 300m | 128Mi | 256Mi | 4001 |
| notification-service | 2 | 100m | 300m | 128Mi | 256Mi | 4005 |
| auto-apply-service | 2 | 200m | 500m | 256Mi | 512Mi | 4003 |
| analytics-service | 2 | 100m | 300m | 128Mi | 256Mi | 3007 |
| orchestrator-service | 2 | 200m | 500m | 256Mi | 512Mi | 3009 |
| payment-service | 2 | 100m | 300m | 128Mi | 256Mi | 8009 |
| ai-service | 2 | 250m | 1000m | 512Mi | 1Gi | 5000 |
| kong-gateway | 2 | 500m | 1000m | 512Mi | 1Gi | 8000 |

**Total Production Baseline:**
- Minimum Pods: ~32
- CPU Requests: ~15.45 cores
- Memory Requests: ~34 GiB

### 2.2 Horizontal Pod Autoscaling

| Service | Min | Max | CPU Target | Memory Target |
|---------|-----|-----|------------|---------------|
| web-app | 3 | 15 | 70% | 80% |
| auth-service | 2 | 10 | 70% | 80% |
| job-service | 2 | 10 | 70% | 80% |
| ai-service | 2 | 6 | 75% | 85% |
| Others | 2 | 8 | 70% | 80% |

### 2.3 Storage Requirements

| Component | Size | Storage Class |
|-----------|------|---------------|
| Prometheus | 50Gi | managed-premium |
| Grafana | 10Gi | managed-premium |

### 2.4 Namespace Resource Quotas

| Namespace | CPU Requests | CPU Limits | Memory Requests | Memory Limits | Max Pods |
|-----------|--------------|------------|-----------------|---------------|----------|
| applyforus (prod) | 50 cores | 100 cores | 100Gi | 200Gi | 100 |
| applyforus-staging | 25 cores | 50 cores | 50Gi | 100Gi | 50 |
| applyforus-dev | 10 cores | 20 cores | 20Gi | 40Gi | 30 |

---

## 3. CI/CD Pipeline Inventory

### 3.1 Azure DevOps Pipelines (DEPRECATED)

| Pipeline | Status | Stages | Complexity |
|----------|--------|--------|------------|
| azure-pipelines.yml | DEPRECATED | 10 | High |
| azure-pipelines-terraform.yml | DEPRECATED | 7 | Medium |
| monitoring/pipeline-monitor.yml | ACTIVE | 4 | Medium |
| self-healing/agent-config.yml | ACTIVE | 4 | High |

### 3.2 GitHub Actions Workflows (Current)

| Workflow | Status | Purpose | AWS Integration |
|----------|--------|---------|-----------------|
| ci.yml | ENABLED | CI Pipeline | None |
| ci-cd.yml | ENABLED | Full CI/CD | None (Azure) |
| docker-build.yml | ENABLED | Container builds | None (ACR) |
| terraform.yml | ENABLED | IaC deployment | None (Azure backend) |
| rollback.yml | ENABLED | Deployment rollback | None |
| sbom-validation.yml | ENABLED | Security scanning | None |

### 3.3 Migration Requirements

**Azure DevOps → GitHub Actions:**
- 21 reusable templates to convert
- 4 variable groups to migrate to GitHub Secrets
- OIDC authentication reconfiguration for AWS

---

## 4. Service Dependencies

### 4.1 Azure-Specific Dependencies

| Component | Current Azure Service | AWS Equivalent | Migration Effort |
|-----------|----------------------|----------------|------------------|
| Database | Azure PostgreSQL Flexible | Amazon RDS PostgreSQL | Low |
| Caching | Azure Cache for Redis | Amazon ElastiCache | Low |
| Search | Elasticsearch (Azure) | Amazon OpenSearch | Low |
| Messaging | Azure Service Bus | Amazon MQ or SQS | Medium |
| Registry | Azure Container Registry | Amazon ECR | Low |
| Secrets | Azure Key Vault | AWS Secrets Manager | Medium |
| Monitoring | Application Insights | CloudWatch + X-Ray | High |
| Identity | Azure AD (OAuth) | Amazon Cognito | Optional |

### 4.2 Cloud-Agnostic Components (No Changes Needed)

- OAuth providers (Google, GitHub, LinkedIn)
- Payment providers (Stripe, Paystack, Flutterwave)
- AI providers (OpenAI, Anthropic, Pinecone)
- Push notifications (Firebase FCM, APNs)
- Email (SMTP, SendGrid)
- **AWS S3** (already in use for user-service uploads)

### 4.3 Inter-Service Communication

All services communicate via Kubernetes DNS:
```
http://{service-name}.applyforus.svc.cluster.local:{port}
```

This pattern is unchanged in EKS migration.

---

## 5. Azure Cost Baseline

### 5.1 Current Budget Configuration

| Environment | Monthly Budget | Alert Thresholds |
|-------------|---------------|------------------|
| Dev | $500 | 50%, 75%, 90%, 100% |
| Staging | $1,000 | 50%, 75%, 90%, 100% |
| Prod | $5,000 | 50%, 75%, 90%, 100%, 110% |
| **Total** | **$10,000** | - |

### 5.2 Estimated Monthly Spend by Service Category

| Category | Dev | Staging | Prod | Total |
|----------|-----|---------|------|-------|
| AKS Compute | $150 | $400 | $2,000 | $2,550 |
| PostgreSQL | $50 | $150 | $800 | $1,000 |
| Redis Cache | $20 | $100 | $500 | $620 |
| Container Registry | $10 | $50 | $200 | $260 |
| Key Vault | $5 | $10 | $20 | $35 |
| Log Analytics | $30 | $60 | $300 | $390 |
| Networking | $20 | $50 | $200 | $270 |
| Service Bus | $25 | $80 | $400 | $505 |
| Other | $40 | $100 | $380 | $520 |
| **Total** | **~$350** | **~$1,000** | **~$4,800** | **~$6,150** |

### 5.3 Cost Optimization Already Implemented

- AKS auto-shutdown (Dev/Staging): ~$600/month savings
- Resource quotas per namespace
- Tiered retention policies
- App Insights sampling

---

## 6. AWS Migration Mapping

### 6.1 Service Mapping with Cost Projection

| Azure Service | AWS Service | Azure Monthly | AWS Projected | Savings |
|---------------|-------------|---------------|---------------|---------|
| AKS (D8s_v3 × 3) | EKS (m6g.2xlarge × 3) | $2,000 | $1,600 | 20% |
| PostgreSQL GP D4s | RDS db.r6g.xlarge (RI) | $800 | $500 | 37% |
| Redis Premium P1 | ElastiCache r6g.large (RI) | $500 | $350 | 30% |
| ACR Premium | ECR | $200 | $100 | 50% |
| App Insights | CloudWatch | $300 | $200 | 33% |
| Service Bus | Amazon MQ | $400 | $300 | 25% |
| Key Vault | Secrets Manager | $20 | $30 | -50% |
| **Total** | - | **$4,220** | **$3,080** | **27%** |

### 6.2 Additional AWS Cost Optimization Opportunities

| Strategy | Potential Savings |
|----------|-------------------|
| Graviton instances (ARM64) | 20% on compute |
| Spot instances for dev/staging | 70% on non-prod compute |
| 1-year Savings Plans | 30% on steady-state |
| 3-year Reserved Instances | 50% on databases |
| S3 Intelligent-Tiering | 30% on storage |
| CloudWatch Infrequent Access logs | 50% on log storage |

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | AWS DMS, parallel running |
| Service downtime | Medium | High | Blue-green deployment, DNS failover |
| Cost overrun during parallel running | Medium | Medium | Set budget alerts, 2-week max |
| Authentication disruption | Low | High | OAuth unchanged, test thoroughly |
| Performance degradation | Low | Medium | Load testing before cutover |
| CI/CD pipeline failures | Medium | Medium | Run both systems initially |

---

## 8. Next Steps

### Phase 2: AWS Foundation Validation
1. Validate AWS Organization structure (`o-14wy6xb785`)
2. Verify SCPs are attached to all OUs
3. Confirm IAM roles and permissions
4. Set up AWS Budgets and Cost Anomaly Detection

### Phase 3: AWS Infrastructure Preparation
1. Create EKS cluster with Karpenter
2. Provision RDS PostgreSQL (Multi-AZ)
3. Create ElastiCache Redis cluster
4. Set up Amazon OpenSearch domain
5. Configure ECR repositories
6. Set up Secrets Manager

### Phase 4: Migration Execution
1. Database migration via AWS DMS
2. Container image migration to ECR
3. Kubernetes manifest updates
4. CI/CD pipeline migration
5. DNS cutover planning

---

## Appendix A: Configuration Files Reference

| Category | Path |
|----------|------|
| Terraform | `infrastructure/terraform/` |
| Kubernetes | `infrastructure/kubernetes/` |
| Azure Pipelines | `.azuredevops/pipelines/` |
| GitHub Actions | `.github/workflows/` |
| Services | `services/` |

## Appendix B: Environment Variables to Update

```bash
# Database
DB_HOST=applyforus-postgres.postgres.database.azure.com → RDS endpoint

# Redis
REDIS_HOST=applyforus-redis.redis.cache.windows.net → ElastiCache endpoint

# Elasticsearch
ELASTICSEARCH_NODE=https://applyforus-elasticsearch.azurewebsites.net → OpenSearch endpoint

# Monitoring
APPLICATIONINSIGHTS_CONNECTION_STRING → CloudWatch configuration

# Message Queue
RABBITMQ_URL=amqp://... → Amazon MQ endpoint
```

---

**Report Generated By:** Claude Migration Agent
**Status:** Phase 1 Discovery Complete
