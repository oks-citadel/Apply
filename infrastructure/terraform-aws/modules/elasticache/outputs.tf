#-------------------------------------------------------------------------------
# ElastiCache Module Outputs
#-------------------------------------------------------------------------------

output "primary_endpoint" {
  description = "Primary endpoint for Redis"
  value       = var.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].address : aws_elasticache_replication_group.main[0].primary_endpoint_address
}

output "reader_endpoint" {
  description = "Reader endpoint for Redis (for read replicas)"
  value       = var.use_serverless ? null : aws_elasticache_replication_group.main[0].reader_endpoint_address
}

output "port" {
  description = "Redis port"
  value       = var.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].port : 6379
}

output "security_group_id" {
  description = "ElastiCache security group ID"
  value       = aws_security_group.redis.id
}

output "replication_group_id" {
  description = "Replication group ID (for traditional mode)"
  value       = var.use_serverless ? null : aws_elasticache_replication_group.main[0].id
}

output "serverless_cache_name" {
  description = "Serverless cache name"
  value       = var.use_serverless ? aws_elasticache_serverless_cache.main[0].name : null
}

output "connection_url" {
  description = "Redis connection URL format"
  value       = var.transit_encryption_enabled ? "rediss://${var.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].address : aws_elasticache_replication_group.main[0].primary_endpoint_address}:${var.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].port : 6379}" : "redis://${var.use_serverless ? aws_elasticache_serverless_cache.main[0].endpoint[0].address : aws_elasticache_replication_group.main[0].primary_endpoint_address}:6379"
}

# Cost-relevant outputs
output "node_type" {
  description = "Node type (or serverless)"
  value       = var.use_serverless ? "serverless" : var.node_type
}

output "num_cache_clusters" {
  description = "Number of cache clusters"
  value       = var.use_serverless ? "auto" : var.num_cache_clusters
}

output "is_serverless" {
  description = "Whether using serverless mode"
  value       = var.use_serverless
}
