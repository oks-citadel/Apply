# ApplyForUs Autoscaling, Failover & Disaster Recovery Design

**Version**: 1.0.0
**Last Updated**: 2025-12-10

---

## 1. AUTOSCALING STRATEGY

### 1.1 Horizontal Pod Autoscaler (HPA)

```yaml
# Example HPA for web service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
  namespace: applyforus
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

### 1.2 Service-Specific Scaling Rules

| Service | Min | Max | CPU Target | Memory Target | Scale Up | Scale Down |
|---------|-----|-----|------------|---------------|----------|------------|
| web | 3 | 20 | 70% | 80% | 15s | 5min |
| auth-service | 3 | 15 | 60% | 70% | 15s | 5min |
| job-service | 3 | 20 | 70% | 80% | 15s | 5min |
| ai-service | 2 | 10 | 50% | 70% | 30s | 10min |
| orchestrator | 2 | 10 | 60% | 70% | 15s | 5min |
| payment-service | 2 | 10 | 50% | 60% | 15s | 5min |
| user-service | 2 | 15 | 60% | 70% | 15s | 5min |
| resume-service | 2 | 15 | 60% | 70% | 15s | 5min |
| notification | 2 | 10 | 50% | 60% | 15s | 5min |
| auto-apply | 2 | 20 | 70% | 80% | 15s | 5min |
| analytics | 2 | 10 | 50% | 60% | 15s | 5min |

### 1.3 Vertical Pod Autoscaler (VPA)

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: ai-service-vpa
  namespace: applyforus
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
      - containerName: ai-service
        minAllowed:
          cpu: 500m
          memory: 1Gi
        maxAllowed:
          cpu: 4000m
          memory: 8Gi
        controlledResources: ["cpu", "memory"]
```

### 1.4 Cluster Autoscaler

```yaml
# AKS Cluster Autoscaler Configuration
autoscaler:
  enabled: true
  minNodes: 3
  maxNodes: 20
  scaleDownDelayAfterAdd: 10m
  scaleDownDelayAfterDelete: 10s
  scaleDownUtilizationThreshold: 0.5
  skipNodesWithSystemPods: true
  skipNodesWithLocalStorage: false
  expendablePodsPriorityThreshold: -10
  balance-similar-node-groups: true
  expander: least-waste
```

### 1.5 Node Pool Configuration

```hcl
# Terraform - Node Pool Autoscaling
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "userpool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4s_v3"

  enable_auto_scaling = true
  min_count           = 3
  max_count           = 20

  node_labels = {
    "workload" = "general"
  }

  node_taints = []

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "ai" {
  name                  = "aipool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D8s_v3"

  enable_auto_scaling = true
  min_count           = 1
  max_count           = 5

  node_labels = {
    "workload" = "ai-intensive"
  }

  node_taints = [
    "ai-workload=true:NoSchedule"
  ]

  tags = local.common_tags
}

resource "azurerm_kubernetes_cluster_node_pool" "spot" {
  name                  = "spotpool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4s_v3"
  priority              = "Spot"
  eviction_policy       = "Delete"
  spot_max_price        = -1  # Use current spot price

  enable_auto_scaling = true
  min_count           = 0
  max_count           = 10

  node_labels = {
    "kubernetes.azure.com/scalesetpriority" = "spot"
  }

  node_taints = [
    "kubernetes.azure.com/scalesetpriority=spot:NoSchedule"
  ]

  tags = local.common_tags
}
```

---

## 2. FAILOVER STRATEGY

### 2.1 Architecture Overview

```
                     ┌─────────────────────────────────────┐
                     │         Azure Front Door            │
                     │      (Global Load Balancer)         │
                     └──────────────┬──────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   East US       │   │   East US 2     │   │   West Europe   │
    │   (Primary)     │   │   (Secondary)   │   │   (DR)          │
    │                 │   │                 │   │                 │
    │  ┌───────────┐  │   │  ┌───────────┐  │   │  ┌───────────┐  │
    │  │    AKS    │  │   │  │    AKS    │  │   │  │    AKS    │  │
    │  │  Cluster  │  │   │  │  Cluster  │  │   │  │  Cluster  │  │
    │  └───────────┘  │   │  └───────────┘  │   │  └───────────┘  │
    │                 │   │                 │   │                 │
    │  ┌───────────┐  │   │  ┌───────────┐  │   │  ┌───────────┐  │
    │  │PostgreSQL │  │   │  │ Read      │  │   │  │ Geo       │  │
    │  │ Primary   │◀─┼───┼──│ Replica   │  │   │  │ Replica   │  │
    │  └───────────┘  │   │  └───────────┘  │   │  └───────────┘  │
    │                 │   │                 │   │                 │
    │  ┌───────────┐  │   │  ┌───────────┐  │   │  ┌───────────┐  │
    │  │   Redis   │  │   │  │   Redis   │  │   │  │   Redis   │  │
    │  │  Primary  │◀─┼───┼──│  Replica  │  │   │  │  Replica  │  │
    │  └───────────┘  │   │  └───────────┘  │   │  └───────────┘  │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
```

### 2.2 Database Failover

#### PostgreSQL Geo-Replication

```hcl
# Terraform - PostgreSQL with Read Replicas
resource "azurerm_postgresql_flexible_server" "primary" {
  name                   = "applyforus-postgres"
  resource_group_name    = azurerm_resource_group.main.name
  location               = "eastus"
  version                = "15"
  administrator_login    = var.db_admin_username
  administrator_password = var.db_admin_password

  storage_mb             = 262144
  sku_name               = "GP_Standard_D4s_v3"

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  backup_retention_days = 35
  geo_redundant_backup_enabled = true

  tags = local.common_tags
}

resource "azurerm_postgresql_flexible_server" "replica" {
  name                   = "applyforus-postgres-replica"
  resource_group_name    = azurerm_resource_group.main.name
  location               = "eastus2"
  version                = "15"

  create_mode            = "Replica"
  source_server_id       = azurerm_postgresql_flexible_server.primary.id

  storage_mb             = 262144
  sku_name               = "GP_Standard_D4s_v3"

  tags = local.common_tags
}
```

#### Automatic Failover Script

```bash
#!/bin/bash
# failover-database.sh

PRIMARY_SERVER="applyforus-postgres"
REPLICA_SERVER="applyforus-postgres-replica"
RESOURCE_GROUP="applyforus-prod-rg"

# Promote replica to primary
az postgres flexible-server replica promote \
  --resource-group $RESOURCE_GROUP \
  --name $REPLICA_SERVER \
  --promote-mode standalone

# Update DNS/connection strings
az postgres flexible-server update \
  --resource-group $RESOURCE_GROUP \
  --name $REPLICA_SERVER \
  --public-access enabled

echo "Failover complete. Update application connection strings."
```

### 2.3 Redis Failover

```hcl
# Premium Redis with Geo-Replication
resource "azurerm_redis_cache" "primary" {
  name                = "applyforus-redis"
  location            = "eastus"
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "P"
  sku_name            = "Premium"

  redis_configuration {
    enable_authentication = true
    maxmemory_policy      = "volatile-lru"
  }

  zones = ["1", "2", "3"]

  tags = local.common_tags
}

resource "azurerm_redis_linked_server" "geo" {
  target_redis_cache_name     = azurerm_redis_cache.primary.name
  resource_group_name         = azurerm_resource_group.main.name
  linked_redis_cache_id       = azurerm_redis_cache.secondary.id
  linked_redis_cache_location = "eastus2"
  server_role                 = "Secondary"
}
```

### 2.4 AKS Multi-Region Deployment

```yaml
# GitOps - Multi-Region Configuration
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: applyforus-multiregion
spec:
  generators:
    - list:
        elements:
          - region: eastus
            priority: primary
            replicas: 3
          - region: eastus2
            priority: secondary
            replicas: 2
          - region: westeurope
            priority: dr
            replicas: 1
  template:
    metadata:
      name: 'applyforus-{{region}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/oks-citadel/Apply.git
        targetRevision: main
        path: infrastructure/kubernetes/overlays/{{region}}
      destination:
        server: https://{{region}}-aks.azmk8s.io
        namespace: applyforus
```

---

## 3. DISASTER RECOVERY (DR)

### 3.1 Recovery Objectives

| Metric | Target | Description |
|--------|--------|-------------|
| **RPO** (Recovery Point Objective) | 15 minutes | Maximum data loss tolerance |
| **RTO** (Recovery Time Objective) | 30 minutes | Maximum downtime tolerance |
| **MTTR** (Mean Time to Recovery) | 20 minutes | Target recovery time |

### 3.2 Backup Strategy

```yaml
# Velero Backup Configuration
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: applyforus-daily-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  template:
    includedNamespaces:
      - applyforus
    excludedResources:
      - events
    storageLocation: azure-backup
    ttl: 720h  # 30 days retention
    includeClusterResources: true
    snapshotVolumes: true
---
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: applyforus-hourly-backup
  namespace: velero
spec:
  schedule: "0 * * * *"  # Every hour
  template:
    includedNamespaces:
      - applyforus
    storageLocation: azure-backup
    ttl: 168h  # 7 days retention
    snapshotVolumes: false
```

### 3.3 DR Runbook

```markdown
## DR Activation Procedure

### Step 1: Assess Incident (5 minutes)
- [ ] Confirm primary region failure
- [ ] Verify incident scope (full/partial)
- [ ] Notify incident commander

### Step 2: Activate DR (10 minutes)
- [ ] Update Front Door routing to DR region
- [ ] Promote database replica
- [ ] Scale up DR AKS cluster
- [ ] Verify service health

### Step 3: Validate (10 minutes)
- [ ] Run smoke tests
- [ ] Check critical user journeys
- [ ] Verify payment processing
- [ ] Confirm monitoring

### Step 4: Communication (5 minutes)
- [ ] Update status page
- [ ] Notify stakeholders
- [ ] Document incident timeline
```

### 3.4 Terraform DR Infrastructure

```hcl
# DR Region Resources
module "dr_region" {
  source = "./modules/dr-region"

  providers = {
    azurerm = azurerm.dr
  }

  resource_group_name = "applyforus-dr-rg"
  location            = "westeurope"

  # Scale configuration for DR (smaller by default)
  aks_node_count = 1
  db_sku        = "GP_Standard_D2s_v3"
  redis_sku     = "Premium"
  redis_capacity = 1

  # Replication sources
  primary_db_id    = module.primary.db_id
  primary_redis_id = module.primary.redis_id
  primary_acr_id   = module.primary.acr_id

  tags = local.common_tags
}
```

---

## 4. HEALTH CHECKS & MONITORING

### 4.1 Kubernetes Probes

```yaml
# Standard health probe configuration
livenessProbe:
  httpGet:
    path: /health/live
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30
```

### 4.2 Azure Monitor Alerts

```hcl
# Critical Alerts
resource "azurerm_monitor_metric_alert" "aks_node_not_ready" {
  name                = "aks-node-not-ready"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  severity            = 0  # Critical

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "kube_node_status_condition"
    aggregation      = "Average"
    operator         = "LessThan"
    threshold        = 1

    dimension {
      name     = "condition"
      operator = "Include"
      values   = ["Ready"]
    }
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }
}
```

### 4.3 Service Health Dashboard

```json
{
  "dashboard": {
    "title": "ApplyForUs Service Health",
    "panels": [
      {
        "title": "Pod Status by Service",
        "type": "stat",
        "query": "kube_deployment_status_replicas_ready"
      },
      {
        "title": "Request Latency P99",
        "type": "timeseries",
        "query": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))"
      },
      {
        "title": "Error Rate",
        "type": "gauge",
        "query": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
      }
    ]
  }
}
```

---

## 5. TESTING DR PROCEDURES

### 5.1 Quarterly DR Drill Schedule

| Quarter | Test Type | Scope |
|---------|-----------|-------|
| Q1 | Database Failover | Promote read replica |
| Q2 | Full Region Failover | Activate DR region |
| Q3 | Backup Restore | Restore from Velero |
| Q4 | Chaos Engineering | Random pod failures |

### 5.2 Chaos Engineering Tests

```yaml
# Chaos Mesh - Pod Kill Experiment
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-kill-test
  namespace: chaos-testing
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - applyforus
    labelSelectors:
      "app": "auth-service"
  scheduler:
    cron: "@every 4h"
  duration: "60s"
```

---

*This document defines the scaling and disaster recovery strategy for the ApplyForUs platform.*
