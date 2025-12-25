# ============================================================================
# CosmosDB Module Configuration
# ============================================================================
# This file configures the CosmosDB module for NoSQL data storage
# Used for: job catalogs, user activity feeds, analytics events, audit logs
# ============================================================================

module "cosmosdb" {
  count  = var.enable_cosmosdb ? 1 : 0
  source = "./modules/cosmosdb"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = var.project_name
  environment         = var.environment
  tags                = local.common_tags

  unique_suffix = local.unique_suffix

  # Consistency and distribution
  consistency_level = var.cosmosdb_consistency_level
  zone_redundant    = var.environment == "prod" ? true : false
  geo_locations     = var.cosmosdb_geo_locations

  # Security settings - Zero Trust
  public_network_access_enabled = var.environment == "dev" ? true : false
  enable_vnet_filter           = var.enable_private_endpoints
  virtual_network_subnet_ids   = var.enable_private_endpoints ? [module.networking.app_service_subnet_id] : []
  disable_local_auth           = false # Enable for key-based auth initially
  enable_rbac_data_plane       = true
  workload_identity_principal_id = module.managed_identity.workload_identity_principal_id

  # Private endpoint (production)
  enable_private_endpoint      = var.enable_private_endpoints
  private_endpoint_subnet_id   = var.enable_private_endpoints ? module.networking.private_endpoints_subnet_id : null
  private_endpoint_vnet_id     = var.enable_private_endpoints ? module.networking.vnet_id : null

  # Backup configuration - more frequent for production
  backup_type              = "Periodic"
  backup_interval_minutes  = var.environment == "prod" ? 60 : 240
  backup_retention_hours   = var.environment == "prod" ? 24 : 8
  backup_storage_redundancy = var.environment == "prod" ? "Geo" : "Local"

  # Throughput settings based on environment
  enable_autoscale       = var.environment == "prod" ? true : false
  max_throughput         = var.environment == "prod" ? 10000 : 4000
  manual_throughput      = 400
  enable_container_autoscale = var.environment == "prod" ? true : false
  container_max_throughput   = var.environment == "prod" ? 4000 : 1000
  container_throughput       = 400

  # TTL settings for data lifecycle
  jobs_ttl_seconds      = 7776000  # 90 days
  activity_ttl_seconds  = 2592000  # 30 days
  analytics_ttl_seconds = 7776000  # 90 days
  audit_ttl_seconds     = 31536000 # 365 days

  # Diagnostics
  enable_diagnostics         = var.enable_diagnostics
  log_analytics_workspace_id = module.app_insights.workspace_id

  depends_on = [
    module.networking,
    module.app_insights,
    module.managed_identity
  ]
}

# ============================================================================
# CosmosDB Outputs
# ============================================================================

output "cosmosdb_endpoint" {
  description = "CosmosDB endpoint URL"
  value       = var.enable_cosmosdb ? module.cosmosdb[0].endpoint : null
}

output "cosmosdb_account_name" {
  description = "CosmosDB account name"
  value       = var.enable_cosmosdb ? module.cosmosdb[0].account_name : null
}

output "cosmosdb_database_name" {
  description = "CosmosDB database name"
  value       = var.enable_cosmosdb ? module.cosmosdb[0].database_name : null
}

output "cosmosdb_primary_key" {
  description = "CosmosDB primary access key"
  value       = var.enable_cosmosdb ? module.cosmosdb[0].primary_key : null
  sensitive   = true
}

output "cosmosdb_connection_string" {
  description = "CosmosDB primary SQL connection string"
  value       = var.enable_cosmosdb ? module.cosmosdb[0].primary_sql_connection_string : null
  sensitive   = true
}
