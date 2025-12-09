# Redis Cache Module - Example Configurations
#
# NOTE: This is a REFERENCE file with example configurations.
# To use these examples, copy the relevant section to your environment's
# .tfvars file (e.g., dev.tfvars, staging.tfvars, prod.tfvars)
#
# DO NOT use this file directly with terraform plan/apply as it contains
# multiple environment examples that would conflict.

# ============================================
# DEVELOPMENT ENVIRONMENT EXAMPLE
# ============================================
# Minimal configuration for development
# - Basic C0 SKU (250 MB, ~£12/month)
# - No clustering or persistence
# - No firewall rules (Basic tier limitation)
# - Public access only
#
# resource_group_name = "rg-jobpilot-dev"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "dev"
# unique_suffix       = "abc123"
#
# cache_sku = "Basic_C0"
#
# # Memory Configuration
# maxmemory_policy = "volatile-lru"
#
# tags = {
#   Environment = "dev"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Engineering"
# }

# ============================================
# STAGING ENVIRONMENT EXAMPLE
# ============================================
# Mid-tier configuration for staging
# - Standard C1 SKU (1 GB, ~£47/month)
# - High availability with automatic failover
# - Firewall rules enabled
# - Patch scheduling
# - Monitoring enabled
#
# resource_group_name = "rg-jobpilot-staging"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "staging"
# unique_suffix       = "def456"
#
# cache_sku = "Standard_C1"
#
# # Memory Configuration
# maxmemory_policy   = "allkeys-lru"
# maxmemory_reserved = 10
# maxmemory_delta    = 10
#
# # Firewall Rules (Standard tier supports this)
# allowed_ip_ranges = {
#   office = {
#     start_ip = "203.0.113.0"
#     end_ip   = "203.0.113.255"
#   }
#   testing_server = {
#     start_ip = "198.51.100.10"
#     end_ip   = "198.51.100.10"
#   }
# }
#
# # Monitoring
# enable_diagnostics = true
# # log_analytics_workspace_id should be set to your workspace ID
#
# tags = {
#   Environment = "staging"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Engineering"
# }

# ============================================
# PRODUCTION ENVIRONMENT - Basic Premium Example
# ============================================
# Enterprise configuration with basic Premium features
# - Premium P1 SKU (6 GB, ~£438/month)
# - Clustering enabled
# - Data persistence (RDB)
# - Private endpoint
# - Zone redundancy
# - Managed identity
#
# resource_group_name = "rg-jobpilot-prod"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "prod"
# unique_suffix       = "xyz789"
#
# cache_sku   = "Premium_P1"
# shard_count = 1
# zones       = ["1", "2", "3"]
#
# # Memory Configuration
# maxmemory_policy   = "allkeys-lru"
# maxmemory_reserved = 50
# maxmemory_delta    = 50
#
# # Network Configuration
# enable_private_endpoint    = true
# # private_endpoint_subnet_id should be set to your private endpoint subnet
#
# # Persistence Configuration
# enable_persistence            = true
# rdb_backup_frequency          = 60  # 1 hour
# rdb_backup_max_snapshot_count = 3
# # rdb_storage_connection_string should reference backup storage account
#
# # Patch Schedule
# patch_day_of_week        = "Sunday"
# patch_start_hour_utc     = 2
# patch_maintenance_window = "PT5H"
#
# # Monitoring
# enable_diagnostics = true
# # log_analytics_workspace_id should be set to your workspace ID
#
# # Identity
# enable_managed_identity = true
#
# tags = {
#   Environment = "prod"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Production"
#   Criticality = "High"
#   BackupPolicy = "Hourly"
# }

# ============================================
# PRODUCTION ENVIRONMENT - Advanced Premium Example
# ============================================
# Advanced enterprise configuration
# - Premium P2 SKU (13 GB, ~£877/month)
# - Multiple shards for clustering
# - Both RDB and AOF persistence
# - VNet injection (alternative to private endpoint)
# - Zone redundancy
# - Advanced monitoring
#
# resource_group_name = "rg-jobpilot-prod-advanced"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "prod"
# unique_suffix       = "adv999"
#
# cache_sku   = "Premium_P2"
# shard_count = 3  # Distribute load across multiple shards
# zones       = ["1", "2", "3"]
#
# # VNet Injection (Alternative to Private Endpoint)
# # Use either VNet injection OR private endpoint, not both
# subnet_id                 = "/subscriptions/{subscription-id}/resourceGroups/rg-jobpilot-prod/providers/Microsoft.Network/virtualNetworks/vnet-prod/subnets/subnet-redis"
# private_static_ip_address = "10.0.3.10"
#
# # Memory Configuration
# maxmemory_policy   = "allkeys-lfu"  # Least Frequently Used for better cache hit rates
# maxmemory_reserved = 100
# maxmemory_delta    = 100
#
# # RDB Persistence
# enable_persistence            = true
# rdb_backup_frequency          = 60
# rdb_backup_max_snapshot_count = 5
# # rdb_storage_connection_string should reference primary backup storage
#
# # AOF Persistence (Premium only, for critical data)
# enable_aof_backup = true
# # aof_storage_connection_string_0 should reference primary AOF storage
# # aof_storage_connection_string_1 should reference secondary AOF storage
#
# # Keyspace Notifications
# notify_keyspace_events = "AKE"  # All events for all keys
#
# # Patch Schedule
# patch_day_of_week        = "Saturday"
# patch_start_hour_utc     = 3
# patch_maintenance_window = "PT8H"
#
# # Monitoring
# enable_diagnostics = true
# # log_analytics_workspace_id should be set to your workspace ID
#
# # Identity
# enable_managed_identity = true
#
# tags = {
#   Environment = "prod"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Production"
#   Criticality = "Critical"
#   BackupPolicy = "Continuous"
#   DR          = "Multi-Zone"
# }

# ============================================
# PRODUCTION ENVIRONMENT - High Throughput Example
# ============================================
# Maximum performance configuration
# - Premium P5 SKU (120 GB, ~£5,460/month)
# - Maximum sharding
# - Full persistence
# - Multi-zone deployment
#
# resource_group_name = "rg-jobpilot-prod-enterprise"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "prod"
# unique_suffix       = "ent001"
#
# cache_sku   = "Premium_P5"
# shard_count = 10  # Maximum shards for highest throughput
# zones       = ["1", "2", "3"]
#
# # Network
# enable_private_endpoint    = true
# # private_endpoint_subnet_id should be set
#
# # Memory Configuration
# maxmemory_policy   = "allkeys-lfu"
# maxmemory_reserved = 500
# maxmemory_delta    = 500
#
# # Full Persistence
# enable_persistence            = true
# rdb_backup_frequency          = 15  # 15 minutes for critical data
# rdb_backup_max_snapshot_count = 10
#
# enable_aof_backup = true
# # Both AOF storage connection strings should be set
#
# # Monitoring
# enable_diagnostics = true
# # log_analytics_workspace_id should be set
#
# enable_managed_identity = true
#
# tags = {
#   Environment = "prod"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Production"
#   Criticality = "Critical"
#   Performance = "Maximum"
#   BackupPolicy = "Continuous-15min"
#   DR          = "Multi-Zone"
#   Compliance  = "SOC2"
# }

# ============================================
# EVICTION POLICY GUIDE
# ============================================
# volatile-lru: Recommended for session storage (expire old sessions)
# allkeys-lru:  Recommended for general caching (expire any old data)
# volatile-lfu: For session storage with access patterns (expire unused sessions)
# allkeys-lfu:  For general caching with access patterns (expire unused data)
# noeviction:   For persistent data stores (error when full)
# volatile-ttl: Expire keys with shortest TTL first
# volatile-random: Random eviction of keys with TTL
# allkeys-random: Random eviction of any keys

# ============================================
# PERSISTENCE GUIDE
# ============================================
# RDB (Snapshot):
#   - Frequencies: 15, 30, 60, 360 (6h), 720 (12h), 1440 (24h) minutes
#   - Lower overhead, periodic backups
#   - Suitable for most production scenarios
#   - Potential data loss: Up to backup frequency duration

# AOF (Append Only File):
#   - Continuous backup of every write operation
#   - Higher overhead but minimal data loss
#   - Suitable for critical data scenarios
#   - Requires two storage accounts for redundancy

# ============================================
# NOTES
# ============================================
# 1. Basic tier: No SLA, single node, no persistence, no firewall
# 2. Standard tier: 99.9% SLA, two nodes, automatic failover
# 3. Premium tier: 99.95% SLA, clustering, persistence, VNet, zones
# 4. VNet injection and private endpoint are mutually exclusive
# 5. Non-SSL port is disabled by default for security
# 6. Always use connection pooling in your application
# 7. Monitor memory usage and adjust maxmemory settings
# 8. Test failover scenarios in staging before production
# 9. Document your eviction policy choice based on use case
# 10. Enable monitoring and set up alerts for high memory usage
