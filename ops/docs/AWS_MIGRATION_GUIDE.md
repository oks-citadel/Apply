# Azure to AWS Migration Guide

## ApplyForUs Platform - Cloud Migration Documentation

**Organization**: o-14wy6xb785
**Migration Type**: Zero-Downtime with DNS Weighted Routing
**Estimated Timeline**: 4-6 weeks

---

## 1. Executive Summary

This document outlines the migration strategy from Azure to AWS for the ApplyForUs job application platform. The migration prioritizes:

1. **Cost Optimization** - 30-40% cost reduction through Graviton instances, Spot instances, and Reserved Capacity
2. **Zero Downtime** - Route 53 weighted routing for seamless DNS cutover
3. **Security Compliance** - SCPs, encryption, and audit logging enforced at Organization level
4. **Operational Excellence** - Automated deployments via GitHub Actions

---

## 2. Service Mapping

| Azure Service | AWS Service | Migration Notes |
|---------------|-------------|-----------------|
| Azure Kubernetes Service (AKS) | Amazon EKS | Karpenter + Graviton (ARM64) |
| Azure Database for PostgreSQL | Amazon RDS PostgreSQL | gp3 storage, Graviton instances |
| Azure Cache for Redis | Amazon ElastiCache | Serverless option for dev |
| Azure Container Registry | Amazon ECR | Cross-region replication for prod |
| Azure Key Vault | AWS Secrets Manager | Secret rotation enabled |
| Azure Service Bus | Amazon SQS/SNS | Standard queues for most use cases |
| Azure Application Insights | CloudWatch + X-Ray | Container Insights for EKS |
| Azure DNS | Route 53 | Weighted routing for migration |
| Azure Blob Storage | Amazon S3 | Intelligent-Tiering for cost optimization |

---

## 3. Infrastructure Architecture

### 3.1 AWS Organization Structure

```
Root (o-14wy6xb785)
├── Security OU
│   └── Audit Account (CloudTrail, Config)
├── Shared-Services OU
│   └── Shared Services Account (ECR, Route 53)
└── Workloads OU
    ├── Development OU
    │   └── Dev Account
    ├── Staging OU
    │   └── Staging Account
    └── Production OU
        └── Production Account
```

### 3.2 Network Architecture

**VPC Design (per environment)**:
- CIDR: 10.x.0.0/16
- Public Subnets: 10.x.0.0/20, 10.x.16.0/20, 10.x.32.0/20
- Private Subnets: 10.x.48.0/20, 10.x.64.0/20, 10.x.80.0/20
- Database Subnets: 10.x.96.0/20, 10.x.112.0/20, 10.x.128.0/20

**Cost Optimizations**:
- Single NAT Gateway for dev/staging (~$64/month savings)
- HA NAT Gateways for production (3 AZs)
- VPC Endpoints for S3/DynamoDB (free) and ECR (production)

---

## 4. EKS Configuration

### 4.1 Node Groups

| Environment | Node Type | Instance Types | Capacity |
|-------------|-----------|----------------|----------|
| Dev | System | t4g.medium | ON_DEMAND |
| Dev | Application | t4g.medium, t4g.large | SPOT |
| Staging | System | m6g.medium, m6g.large | ON_DEMAND |
| Staging | Application | m6g.large, m6g.xlarge | SPOT |
| Prod | System | m6g.large, m6g.xlarge | ON_DEMAND (Savings Plan) |
| Prod | Application | m6g.xlarge, m6g.2xlarge | SPOT |
| Prod | Critical | m6g.large, m6g.xlarge | ON_DEMAND (Savings Plan) |

### 4.2 Karpenter Provisioner

Karpenter handles dynamic node provisioning with:
- Spot instance prioritization (70% cost savings)
- Graviton (ARM64) preference (20% additional savings)
- Consolidation for right-sizing
- Interruption handling via SQS

---

## 5. Database Migration

### 5.1 PostgreSQL Migration Strategy

**Source**: Azure Database for PostgreSQL Flexible Server
**Target**: Amazon RDS PostgreSQL (or Aurora for production)

**Migration Steps**:

1. **Preparation**
   ```bash
   # Create RDS instance
   terraform apply -target=module.rds

   # Get RDS endpoint
   terraform output rds_endpoint
   ```

2. **Schema Migration**
   ```bash
   # Export schema from Azure
   pg_dump -h azure-host -U admin -d applyforus --schema-only > schema.sql

   # Import to AWS
   psql -h aws-rds-endpoint -U admin -d applyforus < schema.sql
   ```

3. **Data Migration (DMS)**
   ```hcl
   # Use AWS DMS for continuous replication
   resource "aws_dms_replication_instance" "main" {
     replication_instance_class = "dms.t3.medium"
     allocated_storage          = 100
   }
   ```

4. **Cutover**
   - Stop writes to Azure
   - Wait for DMS to synchronize
   - Verify row counts match
   - Update application connection strings
   - Resume traffic

### 5.2 Redis Migration

**Source**: Azure Cache for Redis
**Target**: Amazon ElastiCache Redis

**Strategy**: Cache invalidation approach (no data migration required)

1. Deploy ElastiCache cluster
2. Update application connection strings
3. Allow cache to warm up naturally
4. Decommission Azure Redis

---

## 6. Application Deployment

### 6.1 Service List

| Service | Port | Database | Dependencies |
|---------|------|----------|--------------|
| web | 3000 | - | auth-service, job-service |
| auth-service | 8001 | auth_service_db | Redis |
| user-service | 8002 | user_service_db | Redis |
| job-service | 8003 | job_service_db | Redis, Elasticsearch |
| resume-service | 8004 | resume_service_db | Redis, AI-service |
| notification-service | 8005 | notification_service_db | Redis, RabbitMQ |
| auto-apply-service | 8006 | auto_apply_service_db | Chromium |
| analytics-service | 8007 | analytics_service_db | Redis |
| ai-service | 8008 | - | OpenAI API |
| orchestrator-service | 8010 | - | All services |
| payment-service | 8009 | payment_service_db | Stripe, Paystack |

### 6.2 Kubernetes Manifest Updates

Update image registries from ACR to ECR:

```yaml
# Before (Azure)
image: applyforusacr.azurecr.io/applyai-web:v1.0.0

# After (AWS)
image: ${ECR_REGISTRY}/applyai-web:v1.0.0
```

### 6.3 Environment Variables

Update service configurations:

```yaml
# Before (Azure)
- name: DATABASE_HOST
  value: applyforus-postgres.postgres.database.azure.com
- name: REDIS_HOST
  value: applyforus-redis.redis.cache.windows.net

# After (AWS)
- name: DATABASE_HOST
  valueFrom:
    secretKeyRef:
      name: rds-credentials
      key: endpoint
- name: REDIS_HOST
  valueFrom:
    secretKeyRef:
      name: elasticache-credentials
      key: endpoint
```

---

## 7. DNS Cutover Strategy

### 7.1 Route 53 Weighted Routing

```hcl
# Initial state: 100% Azure
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.applyforus.com"
  type    = "A"

  set_identifier = "azure"
  weight         = 100

  alias {
    name                   = azurerm_frontdoor.main.cname
    zone_id                = "Z2FDTNDATAQYW2"  # CloudFront zone
    evaluate_target_health = true
  }
}

# Phase 1: 90% Azure, 10% AWS
# Phase 2: 50% Azure, 50% AWS
# Phase 3: 10% Azure, 90% AWS
# Final:   0% Azure, 100% AWS
```

### 7.2 Rollback Plan

If issues detected:
1. Immediately set AWS weight to 0
2. Verify Azure is handling 100% traffic
3. Investigate and fix issues
4. Resume gradual migration

---

## 8. Cost Comparison

### 8.1 Current Azure Costs (~$6,150/month)

| Service | Monthly Cost |
|---------|-------------|
| AKS | $1,200 |
| PostgreSQL | $1,100 |
| Redis | $350 |
| Networking | $450 |
| Storage | $200 |
| Monitoring | $850 |
| Other | $2,000 |

### 8.2 Projected AWS Costs (~$4,000/month)

| Service | Monthly Cost | Savings |
|---------|-------------|---------|
| EKS (Spot + Graviton) | $750 | 37% |
| RDS (gp3 + Graviton) | $700 | 36% |
| ElastiCache | $200 | 43% |
| Networking (Single NAT) | $250 | 44% |
| S3 + ECR | $150 | 25% |
| CloudWatch | $350 | 59% |
| Other | $600 | 70% |

**Total Projected Savings: ~35% ($2,150/month)**

### 8.3 Additional Savings with Reserved Capacity

After 2 weeks of stable production (apply 1-year No Upfront):
- Compute Savings Plans: Additional 30-40% on committed capacity
- RDS Reserved Instances: Additional 30-40%
- ElastiCache Reserved Nodes: Additional 30-40%

---

## 9. Pre-Migration Checklist

### 9.1 AWS Prerequisites

- [ ] AWS Organization created (o-14wy6xb785)
- [ ] SCPs attached to Workloads OU
- [ ] IAM roles for Terraform and GitHub Actions
- [ ] S3 bucket for Terraform state
- [ ] DynamoDB table for state locking
- [ ] GitHub Actions OIDC provider configured

### 9.2 Infrastructure Deployment

```bash
# Initialize Terraform
cd infrastructure/terraform-aws
terraform init \
  -backend-config="bucket=applyforus-tfstate" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=us-east-1"

# Plan deployment
terraform plan -var-file="environments/dev/terraform.tfvars" -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### 9.3 Secrets Migration

```bash
# Export from Azure Key Vault
az keyvault secret list --vault-name applyforus-kv --query "[].name" -o tsv | \
while read secret; do
  value=$(az keyvault secret show --vault-name applyforus-kv --name $secret --query "value" -o tsv)
  aws secretsmanager create-secret --name "dev/applyforus/$secret" --secret-string "$value"
done
```

---

## 10. Post-Migration Tasks

### 10.1 Verification

- [ ] All services healthy in EKS
- [ ] Database connectivity verified
- [ ] Cache operations working
- [ ] SSL certificates valid
- [ ] Monitoring dashboards active
- [ ] Alerts configured and tested

### 10.2 Cost Monitoring

- [ ] AWS Budgets alerts active
- [ ] Cost Anomaly Detection enabled
- [ ] Infracost reports in PRs
- [ ] Weekly cost review scheduled

### 10.3 Azure Decommissioning

After 7 days of stable AWS operation:

1. Disable Azure CI/CD pipelines
2. Take final database backup
3. Archive Azure resource configuration
4. Delete non-production resources
5. Delete production resources (after 30-day data retention)
6. Cancel Azure subscription

---

## 11. Terraform Module Reference

### 11.1 Module Structure

```
infrastructure/terraform-aws/
├── main.tf                 # Root configuration
├── variables.tf            # Input variables
├── outputs.tf              # Output values
├── providers.tf            # Provider configuration
├── versions.tf             # Version constraints
├── environments/
│   ├── dev/
│   │   └── terraform.tfvars
│   ├── staging/
│   │   └── terraform.tfvars
│   └── prod/
│       └── terraform.tfvars
└── modules/
    ├── organization/       # AWS Organization + SCPs
    ├── vpc/                # VPC + Subnets + NAT
    ├── eks/                # EKS + Karpenter
    ├── ecr/                # Container Registry
    ├── rds/                # PostgreSQL Database
    ├── elasticache/        # Redis Cache
    └── cost-management/    # Budgets + Anomaly Detection
```

### 11.2 Module Usage

```hcl
module "rds" {
  source = "./modules/rds"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  database_subnet_ids = module.vpc.database_subnet_ids
  allowed_security_groups = [module.eks.node_security_group_id]

  instance_class = "db.t4g.medium"  # Graviton
  multi_az       = var.environment == "prod"
}
```

---

## 12. Support & Escalation

**Primary Contact**: platform-team@applyforus.com
**Cost Issues**: finance@applyforus.com
**Security Issues**: security@applyforus.com

**Runbooks Location**: `ops/runbooks/`
**Dashboards**: CloudWatch → ApplyForUs Dashboard

---

*Last Updated: December 2025*
*Document Version: 1.0*
