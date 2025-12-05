# Azure Redis Cache Terraform Module

This module provisions an Azure Redis Cache with environment-specific configurations for the JobPilot AI Platform.

## Features

- **Environment-specific SKUs**:
  - **Dev**: Basic C0 (250 MB, £12/month)
  - **Staging**: Standard C1 (1 GB, £47/month)
  - **Production**: Premium P1 (6 GB, £438/month) with clustering and persistence
- **Security**:
  - TLS 1.2 minimum
  - SSL-only connections (non-SSL port disabled)
  - Firewall rules for IP restrictions
  - Private endpoint support
  - VNet injection (Premium only)
- **High Availability** (Premium):
  - Clustering with configurable shards
  - Availability zones support
  - Data persistence (RDB and AOF)
- **Maintenance**:
  - Configurable patch schedules for production
  - Automatic failover (Standard/Premium)
- **Monitoring**:
  - Diagnostic settings integration
  - Log Analytics integration

## Usage

### Basic Example (Development)

```hcl
module "redis_cache" {
  source = "./modules/redis-cache"

  resource_group_name = "rg-jobpilot-dev"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"
  unique_suffix       = "abc123"

  cache_sku = "Basic_C0"

  tags = {
    Environment = "dev"
    Project     = "JobPilot"
  }
}
```

### Standard Example (Staging)

```hcl
module "redis_cache" {
  source = "./modules/redis-cache"

  resource_group_name = "rg-jobpilot-staging"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "staging"
  unique_suffix       = "def456"

  cache_sku = "Standard_C1"

  # Firewall
  allowed_ip_ranges = {
    office = {
      start_ip = "203.0.113.0"
      end_ip   = "203.0.113.255"
    }
  }

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Environment = "staging"
    Project     = "JobPilot"
  }
}
```

### Production Example with Premium Features

```hcl
module "redis_cache" {
  source = "./modules/redis-cache"

  resource_group_name = "rg-jobpilot-prod"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "xyz789"

  cache_sku   = "Premium_P1"
  shard_count = 2
  zones       = ["1", "2", "3"]

  # Network
  enable_private_endpoint    = true
  private_endpoint_subnet_id = azurerm_subnet.private_endpoints.id

  # Redis Configuration
  maxmemory_policy   = "allkeys-lru"
  maxmemory_reserved = 50
  maxmemory_delta    = 50

  # Persistence
  enable_persistence            = true
  rdb_backup_frequency          = 60
  rdb_backup_max_snapshot_count = 3
  rdb_storage_connection_string = azurerm_storage_account.backup.primary_connection_string

  # Patch Schedule
  patch_day_of_week        = "Sunday"
  patch_start_hour_utc     = 2
  patch_maintenance_window = "PT5H"

  # Monitoring
  enable_diagnostics         = true
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  # Identity
  enable_managed_identity = true

  tags = {
    Environment = "prod"
    Project     = "JobPilot"
    Criticality = "High"
  }
}
```

### VNet Injection Example (Premium)

```hcl
module "redis_cache" {
  source = "./modules/redis-cache"

  resource_group_name = "rg-jobpilot-prod"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"
  unique_suffix       = "xyz789"

  cache_sku                 = "Premium_P1"
  subnet_id                 = azurerm_subnet.redis.id
  private_static_ip_address = "10.0.1.10"

  tags = {
    Environment = "prod"
    Project     = "JobPilot"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Name of the resource group | `string` | - | yes |
| location | Azure region for resources | `string` | - | yes |
| project_name | Project name for resource naming | `string` | - | yes |
| environment | Environment (dev, staging, prod) | `string` | - | yes |
| unique_suffix | Unique suffix for globally unique names | `string` | - | yes |
| cache_sku | Redis Cache SKU | `string` | `null` | no |
| tags | Tags to apply to resources | `map(string)` | `{}` | no |
| subnet_id | Subnet ID for VNet injection (Premium) | `string` | `null` | no |
| enable_private_endpoint | Enable private endpoint | `bool` | `false` | no |
| private_endpoint_subnet_id | Subnet ID for private endpoint | `string` | `null` | no |
| shard_count | Number of shards (Premium, 1-10) | `number` | `1` | no |
| zones | Availability zones (Premium) | `list(string)` | `null` | no |
| maxmemory_policy | Eviction policy | `string` | `"volatile-lru"` | no |
| enable_persistence | Enable RDB persistence (Premium) | `bool` | `false` | no |
| rdb_backup_frequency | Backup frequency in minutes | `number` | `60` | no |
| enable_diagnostics | Enable diagnostic settings | `bool` | `false` | no |

## Outputs

| Name | Description | Sensitive |
|------|-------------|-----------|
| cache_id | ID of the Redis Cache | no |
| cache_name | Name of the Redis Cache | no |
| cache_hostname | Hostname of the Redis Cache | no |
| cache_fqdn | FQDN with SSL port | no |
| primary_connection_string | Primary connection string | yes |
| secondary_connection_string | Secondary connection string | yes |
| primary_access_key | Primary access key | yes |
| secondary_access_key | Secondary access key | yes |
| ssl_port | SSL port (6380) | no |
| private_endpoint_id | Private endpoint ID | no |

## SKU Selection Guide

### Basic Tier
- **Use case**: Development and testing
- **Features**: Single node, no SLA
- **Sizes**: C0 (250 MB) - C6 (6 GB)
- **Cost**: £12 - £225/month

### Standard Tier
- **Use case**: Production workloads without clustering
- **Features**: Two nodes, 99.9% SLA, automatic failover
- **Sizes**: C0 (250 MB) - C6 (6 GB)
- **Cost**: £23 - £450/month

### Premium Tier
- **Use case**: Enterprise production workloads
- **Features**: Clustering, persistence, VNet injection, zones
- **Sizes**: P1 (6 GB) - P5 (120 GB)
- **Cost**: £438 - £5,460/month

## Data Persistence Options

### RDB (Redis Database Backup)
- **Point-in-time snapshots**
- Frequencies: 15, 30, 60, 360, 720, 1440 minutes
- Lower overhead, periodic backups
- Best for: Most production scenarios

### AOF (Append Only File)
- **Continuous backup**
- Every write operation logged
- Higher overhead, better durability
- Best for: Critical data that cannot afford data loss

## Best Practices

1. **Use SSL connections only** (non-SSL port is disabled by default)
2. **Enable firewall rules** in Standard/Premium tiers
3. **Use private endpoints** for production environments
4. **Configure clustering** for high-traffic applications (Premium)
5. **Enable persistence** for critical cached data (Premium)
6. **Set up availability zones** for disaster recovery (Premium)
7. **Schedule maintenance windows** during low-traffic periods
8. **Monitor metrics** using diagnostic settings
9. **Use managed identities** for authentication where possible
10. **Implement retry logic** in applications for connection resilience

## Connection String Format

```
rediss://:PRIMARY_ACCESS_KEY@cache-hostname:6380/0?ssl=True
```

Or using the full connection string output:
```
cache-hostname:6380,password=PRIMARY_ACCESS_KEY,ssl=True,abortConnect=False
```

## Memory Management

### Eviction Policies

- **volatile-lru**: Evict least recently used keys with TTL
- **allkeys-lru**: Evict any least recently used keys
- **volatile-lfu**: Evict least frequently used keys with TTL
- **allkeys-lfu**: Evict any least frequently used keys
- **volatile-random**: Evict random keys with TTL
- **allkeys-random**: Evict any random keys
- **volatile-ttl**: Evict keys with shortest TTL
- **noeviction**: Return errors when memory limit reached

Recommendation: Use `allkeys-lru` for cache scenarios, `noeviction` for persistent data.

## Notes

- Redis Cache names must be globally unique (3-63 characters)
- Non-SSL port (6379) is disabled by default for security
- Firewall rules only available for Standard and Premium tiers
- VNet injection only available for Premium tier
- Patch schedules only available for Standard and Premium tiers
- Clustering (sharding) only available for Premium tier
- Zone redundancy only available for Premium tier
- Maximum of 10 shards per Premium cache
