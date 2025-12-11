# ApplyForUs Cost Optimization Analysis

**Version**: 1.0.0
**Last Updated**: 2025-12-10

---

## 1. CURRENT COST BASELINE

### 1.1 Azure Resource Costs (Estimated)

| Resource | Current SKU | Monthly Cost | Notes |
|----------|-------------|--------------|-------|
| AKS Cluster | 3x Standard_D4s_v3 | $438 | System + User nodes |
| PostgreSQL | GP_Standard_D4s_v3, 256GB | $350 | Primary database |
| PostgreSQL Replica | GP_Standard_D4s_v3 | $280 | Read replica |
| Redis Cache | Premium P1 (6GB) | $500 | 3 shards |
| Container Registry | Standard | $20 | ACR |
| Key Vault | Standard | $5 | Secrets |
| Service Bus | Standard | $50 | Messaging |
| Application Insights | Pay-as-you-go | $100 | Monitoring |
| Storage | 100GB | $5 | Blobs |
| Bandwidth | ~1TB/month | $50 | Egress |
| **Subtotal Azure** | | **~$1,798** | |

### 1.2 Third-Party Services

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| Stripe | Standard | 2.9% + $0.30/txn | Payment processing |
| OpenAI API | Pay-per-use | ~$200 | GPT-4 for cover letters |
| Anthropic API | Pay-per-use | ~$100 | Claude for analysis |
| Pinecone | Starter | $70 | Vector database |
| SendGrid/Email | Pro | $50 | Transactional email |
| Twilio | Pay-per-use | $30 | SMS notifications |
| **Subtotal Third-Party** | | **~$450** | |

### 1.3 Total Monthly Cost

```
Azure Infrastructure:     $1,798
Third-Party Services:     $450
Buffer (10%):             $225
--------------------------------
Total Estimated:          $2,473/month
```

---

## 2. COST OPTIMIZATION STRATEGIES

### 2.1 Compute Optimizations

#### A. Reserved Instances (30-40% savings)

```hcl
# 1-Year Reserved VM Instances
resource "azurerm_reservation" "aks_nodes" {
  name                  = "aks-reserved"
  scope                 = "shared"
  reservation_order_id  = azurerm_reservation_order.main.id

  sku {
    name = "Standard_D4s_v3"
  }

  applied_scope_type = "ResourceGroup"
  applied_scopes     = [azurerm_resource_group.main.id]

  term                = "P1Y"  # 1 year
  billing_plan        = "Monthly"
  quantity            = 3

  # Savings: ~30% = $131/month on 3 nodes
}
```

**Savings**: $438 → $307/month = **$131/month saved**

#### B. Spot Instances for Non-Critical Workloads (60-80% savings)

```yaml
# Spot node pool for batch jobs
apiVersion: v1
kind: Pod
metadata:
  name: batch-job
spec:
  nodeSelector:
    kubernetes.azure.com/scalesetpriority: spot
  tolerations:
    - key: kubernetes.azure.com/scalesetpriority
      operator: Equal
      value: spot
      effect: NoSchedule
```

Use for:
- Analytics processing
- Resume PDF generation
- Non-critical background jobs
- Auto-apply batch runs

**Savings**: ~$100/month for batch workloads

#### C. Autoscaling with Scale-to-Zero

```yaml
# KEDA ScaledObject for queue-based scaling
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: notification-scaler
spec:
  scaleTargetRef:
    name: notification-service
  minReplicaCount: 0  # Scale to zero when idle
  maxReplicaCount: 10
  triggers:
    - type: azure-servicebus-queue
      metadata:
        queueName: notifications
        messageCount: "5"
```

**Savings**: ~$50/month during off-peak hours

### 2.2 Database Optimizations

#### A. Right-Sizing PostgreSQL

```hcl
# Development environment
resource "azurerm_postgresql_flexible_server" "dev" {
  sku_name = "B_Standard_B2s"  # Burstable, much cheaper
  storage_mb = 32768  # 32GB
}

# Production - consider usage patterns
resource "azurerm_postgresql_flexible_server" "prod" {
  sku_name = "GP_Standard_D2s_v3"  # Smaller if CPU < 30%
  storage_mb = 131072  # 128GB with autogrow
}
```

Current: GP_Standard_D4s_v3 ($350)
Optimized: GP_Standard_D2s_v3 ($175)
**Savings**: ~$175/month

#### B. Read Replica Strategy

Only enable read replica during peak hours:
```bash
# Enable replica during business hours (8 AM - 8 PM)
# Disable during off-peak
az postgres flexible-server replica create \
  --schedule "0 8 * * 1-5"  # Create at 8 AM weekdays

az postgres flexible-server replica delete \
  --schedule "0 20 * * 1-5"  # Delete at 8 PM weekdays
```

**Savings**: ~$140/month (50% of replica cost)

#### C. Connection Pooling with PgBouncer

```yaml
# PgBouncer sidecar reduces connection overhead
- name: pgbouncer
  image: bitnami/pgbouncer:latest
  env:
    - name: PGBOUNCER_POOL_MODE
      value: "transaction"
    - name: PGBOUNCER_MAX_CLIENT_CONN
      value: "100"
    - name: PGBOUNCER_DEFAULT_POOL_SIZE
      value: "20"
```

Benefit: Allows smaller database SKU due to fewer connections.

### 2.3 Redis Optimizations

#### A. Downgrade from Premium to Standard (where possible)

```hcl
# If < 6GB needed and no geo-replication required
resource "azurerm_redis_cache" "main" {
  sku_name = "Standard"  # Instead of Premium
  family   = "C"
  capacity = 2  # 2.5GB cache
}
```

Current Premium P1: $500/month
Standard C2: $81/month
**Savings**: ~$419/month (if Premium features not needed)

#### B. Cache Efficiency Improvements

```typescript
// Implement cache-aside pattern with shorter TTLs
const cacheConfig = {
  session: { ttl: '30m', prefix: 'sess:' },
  user: { ttl: '5m', prefix: 'user:' },      // Reduced from 10m
  subscription: { ttl: '10m', prefix: 'sub:' },
  jobSearch: { ttl: '30s', prefix: 'jobs:' }, // Reduced from 1m
};
```

### 2.4 AI API Cost Optimizations

#### A. Model Selection Strategy

```typescript
// Use cheaper models for simpler tasks
const AI_MODEL_STRATEGY = {
  // Complex tasks - use GPT-4 / Claude
  coverLetterGeneration: 'gpt-4-turbo',
  interviewPrep: 'claude-3-opus',

  // Simple tasks - use cheaper models
  textSummarization: 'gpt-3.5-turbo',
  keywordExtraction: 'gpt-3.5-turbo',
  basicQuestions: 'claude-3-haiku',
};

// Cost comparison:
// GPT-4-turbo: $0.01/1K tokens input, $0.03/1K output
// GPT-3.5-turbo: $0.0005/1K tokens input, $0.0015/1K output
// Savings: 95% on simple tasks
```

**Savings**: ~$100/month by using appropriate models

#### B. Caching AI Responses

```typescript
// Cache similar queries
async function generateCoverLetter(jobDesc: string, resume: string) {
  const cacheKey = `cover:${hash(jobDesc + resume)}`;

  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const result = await openai.generate(jobDesc, resume);
  await redis.setex(cacheKey, 86400, result); // Cache 24h

  return result;
}
```

**Savings**: ~$50/month from reduced API calls

#### C. Implement Token Budgets per Tier

```typescript
const TOKEN_BUDGETS = {
  [SubscriptionTier.FREEMIUM]: 5000,      // ~$0.05/user/month
  [SubscriptionTier.STARTER]: 25000,      // ~$0.25/user/month
  [SubscriptionTier.BASIC]: 75000,        // ~$0.75/user/month
  [SubscriptionTier.PROFESSIONAL]: 200000, // ~$2.00/user/month
  [SubscriptionTier.ADVANCED_CAREER]: 500000,
  [SubscriptionTier.EXECUTIVE_ELITE]: -1,  // Unlimited
};
```

### 2.5 Storage Optimizations

#### A. Lifecycle Management

```hcl
resource "azurerm_storage_management_policy" "lifecycle" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-to-cool"
    enabled = true
    filters {
      prefix_match = ["resumes/", "exports/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }
}
```

**Savings**: ~$10/month on storage costs

### 2.6 Network Optimizations

#### A. Use Private Endpoints (Avoid Egress)

```hcl
resource "azurerm_private_endpoint" "postgres" {
  name                = "postgres-pe"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subnet_id           = azurerm_subnet.db.id

  private_service_connection {
    name                           = "postgres-psc"
    private_connection_resource_id = azurerm_postgresql_flexible_server.main.id
    is_manual_connection           = false
    subresource_names              = ["postgresqlServer"]
  }
}
```

**Savings**: ~$20/month on data transfer

---

## 3. PAY-PER-USE ANALYSIS

### 3.1 Cost Per User Calculation

```
Fixed Infrastructure Costs: $1,500/month
Variable Costs: $500/month (scales with users)

Break-even Analysis:
- 100 users: $20/user/month
- 500 users: $4/user/month
- 1,000 users: $2/user/month
- 5,000 users: $0.50/user/month
```

### 3.2 Cost Per Feature

| Feature | Est. Cost/Use | Tier Allocation |
|---------|---------------|-----------------|
| Job Application | $0.001 | Included in tier |
| AI Cover Letter | $0.05 | Token budget |
| Resume Export (PDF) | $0.002 | Included in tier |
| Auto-Apply (per job) | $0.01 | Included in tier |
| Visibility Boost | Coins | Virtual currency |
| Interview Prep | $0.10 | Token budget |

### 3.3 Subscription Revenue vs. Cost

| Tier | Monthly Price | Est. Cost/User | Margin |
|------|---------------|----------------|--------|
| Freemium | $0 | $0.50 | -$0.50 |
| Starter | $23.99 | $2.00 | $21.99 (92%) |
| Basic | $49.99 | $4.00 | $45.99 (92%) |
| Professional | $89.99 | $8.00 | $81.99 (91%) |
| Advanced Career | $149.99 | $15.00 | $134.99 (90%) |
| Executive Elite | $299.99 | $50.00 | $249.99 (83%) |

---

## 4. OPTIMIZATION ROADMAP

### Phase 1: Quick Wins (Week 1-2)
- [ ] Enable Reserved Instances for AKS nodes
- [ ] Implement AI model selection strategy
- [ ] Configure storage lifecycle policies
- [ ] Set up autoscaling policies

**Expected Savings**: ~$300/month

### Phase 2: Infrastructure Right-Sizing (Week 3-4)
- [ ] Downgrade dev PostgreSQL to Burstable
- [ ] Evaluate Redis tier (Premium vs Standard)
- [ ] Implement spot instances for batch jobs
- [ ] Configure KEDA for queue-based scaling

**Expected Savings**: ~$400/month

### Phase 3: Application Optimizations (Week 5-6)
- [ ] Deploy PgBouncer for connection pooling
- [ ] Implement AI response caching
- [ ] Add token budgets per subscription tier
- [ ] Optimize database queries

**Expected Savings**: ~$200/month

### Phase 4: Monitoring & Continuous Optimization
- [ ] Set up cost alerts
- [ ] Create FinOps dashboard
- [ ] Monthly cost review process
- [ ] Implement showback/chargeback

---

## 5. COST MONITORING

### 5.1 Azure Cost Alerts

```hcl
resource "azurerm_consumption_budget_subscription" "main" {
  name            = "applyforus-monthly-budget"
  subscription_id = data.azurerm_subscription.current.id

  amount     = 2500
  time_grain = "Monthly"
  time_period {
    start_date = "2025-01-01T00:00:00Z"
  }

  notification {
    enabled        = true
    threshold      = 80
    operator       = "GreaterThanOrEqualTo"
    contact_emails = ["ops@applyforus.com"]
  }

  notification {
    enabled        = true
    threshold      = 100
    operator       = "GreaterThanOrEqualTo"
    contact_emails = ["ops@applyforus.com", "cto@applyforus.com"]
  }
}
```

### 5.2 Cost Dashboard Metrics

```sql
-- Daily cost by service
SELECT
  date_trunc('day', timestamp) as day,
  service_name,
  SUM(cost) as daily_cost
FROM azure_cost_data
WHERE timestamp >= current_date - interval '30 days'
GROUP BY 1, 2
ORDER BY 1, 3 DESC;

-- Cost per user trend
SELECT
  date_trunc('month', timestamp) as month,
  SUM(cost) / COUNT(DISTINCT user_id) as cost_per_user
FROM cost_allocation
GROUP BY 1
ORDER BY 1;
```

---

## 6. SUMMARY

### Total Potential Savings

| Category | Current | Optimized | Savings |
|----------|---------|-----------|---------|
| Compute (AKS) | $438 | $257 | $181 |
| Database | $630 | $315 | $315 |
| Redis | $500 | $150 | $350 |
| AI APIs | $300 | $150 | $150 |
| Storage/Network | $55 | $25 | $30 |
| **Total** | **$1,923** | **$897** | **$1,026** |

**Savings: 53% reduction in infrastructure costs**

### Key Recommendations

1. **Immediate**: Enable Reserved Instances (30% savings)
2. **Short-term**: Right-size database and cache
3. **Medium-term**: Implement spot instances and KEDA
4. **Long-term**: AI cost optimization and caching

---

*This analysis should be reviewed quarterly and updated based on actual usage patterns.*
