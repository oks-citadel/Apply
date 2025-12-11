# ApplyForUs Infrastructure Unification Design

**Version**: 1.0.0
**Last Updated**: 2025-12-10

---

## 1. CURRENT STATE

### 1.1 Resource Group
- **Name**: `applyforus-prod-rg`
- **Location**: East US
- **Subscription**: Azure (citadelcloudmanagement)

### 1.2 Existing Resources
| Resource | Type | SKU/Tier |
|----------|------|----------|
| applyforus-aks | AKS | Standard_D4s_v3 (3 nodes) |
| applyforusacr | Container Registry | Standard |
| applyforus-keyvault | Key Vault | Standard |
| applyforus-sql | PostgreSQL Flexible | Burstable B2s |
| applyforus-redis | Redis Cache | Basic C1 |
| applyforus-servicebus | Service Bus | Standard |
| applyforus-appinsights | Application Insights | - |

---

## 2. UNIFIED ARCHITECTURE

### 2.1 Resource Hierarchy

```
Azure Subscription (citadelcloudmanagement)
└── applyforus-prod-rg
    ├── Networking
    │   ├── applyforus-vnet (10.0.0.0/16)
    │   │   ├── aks-subnet (10.0.0.0/22)
    │   │   ├── db-subnet (10.0.4.0/24)
    │   │   ├── cache-subnet (10.0.5.0/24)
    │   │   └── appgw-subnet (10.0.6.0/24)
    │   ├── applyforus-nsg
    │   └── applyforus-nat-gateway
    │
    ├── Compute
    │   ├── applyforus-aks (Kubernetes)
    │   │   ├── System Node Pool (3x Standard_D2s_v3)
    │   │   └── User Node Pool (3-10x Standard_D4s_v3, autoscale)
    │   └── applyforus-acr (Container Registry)
    │
    ├── Data
    │   ├── applyforus-postgres (Flexible Server)
    │   │   ├── applyforus-db (main database)
    │   │   └── applyforus-db-replica (read replica)
    │   ├── applyforus-redis (Premium P1)
    │   └── applyforus-storage (Blob Storage)
    │
    ├── Messaging
    │   ├── applyforus-servicebus (Standard)
    │   │   ├── payment-events-queue
    │   │   ├── subscription-events-queue
    │   │   └── notification-events-queue
    │   └── applyforus-eventhub (for streaming)
    │
    ├── Security
    │   ├── applyforus-keyvault
    │   ├── applyforus-msi (Managed Identities)
    │   └── applyforus-waf (Application Gateway WAF)
    │
    └── Monitoring
        ├── applyforus-appinsights
        ├── applyforus-loganalytics
        └── applyforus-dashboards
```

### 2.2 Network Design

```
┌─────────────────────────────────────────────────────────────┐
│                    VNet: 10.0.0.0/16                        │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  AKS Subnet     │  │  Database       │                  │
│  │  10.0.0.0/22    │  │  10.0.4.0/24    │                  │
│  │                 │  │                 │                  │
│  │  ┌───────────┐  │  │  ┌───────────┐  │                  │
│  │  │ Pod CIDR  │  │  │  │PostgreSQL │  │                  │
│  │  │10.244.0.0 │  │  │  │Private EP │  │                  │
│  │  │   /16     │  │  │  └───────────┘  │                  │
│  │  └───────────┘  │  │                 │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  Cache Subnet   │  │  AppGW Subnet   │                  │
│  │  10.0.5.0/24    │  │  10.0.6.0/24    │                  │
│  │                 │  │                 │                  │
│  │  ┌───────────┐  │  │  ┌───────────┐  │                  │
│  │  │  Redis    │  │  │  │   WAF     │  │                  │
│  │  │Private EP │  │  │  │   v2      │  │                  │
│  │  └───────────┘  │  │  └───────────┘  │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Internet
                              ▼
                    ┌─────────────────┐
                    │   Front Door    │
                    │   (Global CDN)  │
                    └─────────────────┘
```

---

## 3. AKS CLUSTER CONFIGURATION

### 3.1 Node Pools

| Pool | Purpose | VM Size | Count | Autoscale |
|------|---------|---------|-------|-----------|
| system | System pods | Standard_D2s_v3 | 3 | No |
| general | Web + Services | Standard_D4s_v3 | 3-10 | Yes |
| ai | AI Service | Standard_D8s_v3 | 1-5 | Yes |
| spot | Batch Jobs | Standard_D4s_v3 (Spot) | 0-10 | Yes |

### 3.2 Namespaces

```yaml
namespaces:
  - name: applyforus
    labels:
      environment: production
      billing: platform
  - name: applyforus-monitoring
    labels:
      environment: production
      purpose: observability
  - name: cert-manager
    labels:
      purpose: certificates
```

### 3.3 Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: applyforus-quota
  namespace: applyforus
spec:
  hard:
    requests.cpu: "50"
    requests.memory: 100Gi
    limits.cpu: "100"
    limits.memory: 200Gi
    persistentvolumeclaims: "20"
    services.loadbalancers: "5"
```

---

## 4. DATABASE ARCHITECTURE

### 4.1 PostgreSQL Flexible Server

| Setting | Development | Production |
|---------|-------------|------------|
| SKU | Burstable B2s | General Purpose D4s_v3 |
| Storage | 32 GB | 256 GB (autogrow) |
| Backup Retention | 7 days | 35 days |
| Geo-Redundancy | No | Yes |
| Read Replica | No | 1 (East US 2) |
| High Availability | No | Zone Redundant |

### 4.2 Connection Pooling

```
                    ┌─────────────────┐
                    │   PgBouncer     │
                    │   (Sidecar)     │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐        ┌────▼────┐        ┌────▼────┐
    │ Primary │        │ Primary │        │ Read    │
    │ (Write) │        │ (Write) │        │ Replica │
    └─────────┘        └─────────┘        └─────────┘
                             │                   │
                    ┌────────▼────────┐          │
                    │   Zone 1        │◄─────────┘
                    │   (Primary)     │   Async Replication
                    └─────────────────┘
```

### 4.3 Database Schema per Service

```
applyforus-db/
├── auth_schema/        # auth-service tables
├── user_schema/        # user-service tables
├── job_schema/         # job-service tables
├── resume_schema/      # resume-service tables
├── notification_schema/# notification-service tables
├── payment_schema/     # payment-service tables
├── analytics_schema/   # analytics-service tables
└── auto_apply_schema/  # auto-apply-service tables
```

---

## 5. REDIS CACHING STRATEGY

### 5.1 Redis Configuration

| Setting | Value |
|---------|-------|
| SKU | Premium P1 (6GB) |
| Cluster | Enabled (3 shards) |
| Persistence | AOF |
| TLS | Required |
| Private Endpoint | Yes |

### 5.2 Cache Key Patterns

```
session:{userId}              # User sessions (TTL: 30min)
user:{userId}                 # User profile cache (TTL: 5min)
job:search:{hash}             # Search results (TTL: 1min)
subscription:{userId}         # Subscription details (TTL: 10min)
rate_limit:{ip}:{endpoint}    # Rate limiting (TTL: 1min)
feature_flag:{key}            # Feature flags (TTL: 30s)
```

---

## 6. TERRAFORM MODULE STRUCTURE

```hcl
# main.tf
module "networking" {
  source = "./modules/networking"
  ...
}

module "aks" {
  source = "./modules/aks"
  depends_on = [module.networking]
  ...
}

module "database" {
  source = "./modules/database"
  depends_on = [module.networking]
  ...
}

module "redis" {
  source = "./modules/redis"
  depends_on = [module.networking]
  ...
}

module "keyvault" {
  source = "./modules/keyvault"
  ...
}

module "monitoring" {
  source = "./modules/monitoring"
  depends_on = [module.aks]
  ...
}
```

---

## 7. COST ESTIMATES

### 7.1 Monthly Costs (Production)

| Resource | SKU | Monthly Cost |
|----------|-----|--------------|
| AKS (3 system + 5 user nodes) | D2s_v3 + D4s_v3 | ~$800 |
| PostgreSQL Flexible | D4s_v3, 256GB | ~$350 |
| PostgreSQL Read Replica | D4s_v3 | ~$280 |
| Redis Premium | P1 (6GB), 3 shards | ~$500 |
| ACR | Standard | ~$20 |
| Key Vault | Standard | ~$5 |
| Service Bus | Standard | ~$50 |
| Application Insights | Pay-as-you-go | ~$100 |
| Bandwidth | 1TB/month | ~$50 |
| Storage | 100GB | ~$5 |
| **Total Estimated** | | **~$2,160/month** |

### 7.2 Cost Optimization

1. **Reserved Instances**: 1-year commitment = 30% savings on VMs
2. **Spot Instances**: For batch/non-critical workloads = 60-80% savings
3. **Autoscaling**: Scale down during off-peak hours
4. **Right-sizing**: Monitor and adjust based on actual usage

---

## 8. IMPLEMENTATION STEPS

### Phase 1: Network Foundation
1. Create VNet with subnets
2. Configure NSGs and route tables
3. Set up NAT Gateway
4. Deploy Application Gateway with WAF

### Phase 2: Data Tier
1. Deploy PostgreSQL Flexible Server
2. Configure private endpoints
3. Set up read replica
4. Deploy Redis Premium cluster

### Phase 3: Compute Tier
1. Create AKS cluster with node pools
2. Configure cluster autoscaler
3. Deploy ACR with geo-replication
4. Set up workload identities

### Phase 4: Security
1. Deploy Key Vault
2. Configure managed identities
3. Set up RBAC policies
4. Enable Azure Defender

### Phase 5: Observability
1. Deploy Log Analytics workspace
2. Configure Application Insights
3. Set up Azure Monitor dashboards
4. Create alert rules

---

## 9. TERRAFORM COMMANDS

```bash
# Initialize
cd infrastructure/terraform
terraform init

# Plan
terraform plan -var-file="environments/prod.tfvars" -out=tfplan

# Apply
terraform apply tfplan

# Validate
terraform validate

# Destroy (caution!)
terraform destroy -var-file="environments/prod.tfvars"
```

---

*This document is the source of truth for ApplyForUs infrastructure architecture.*
