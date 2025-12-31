#-------------------------------------------------------------------------------
# RDS Module Outputs
#-------------------------------------------------------------------------------

output "endpoint" {
  description = "Database endpoint"
  value       = var.create_aurora_cluster ? aws_rds_cluster.aurora[0].endpoint : aws_db_instance.main[0].endpoint
}

output "reader_endpoint" {
  description = "Aurora reader endpoint (if Aurora)"
  value       = var.create_aurora_cluster ? aws_rds_cluster.aurora[0].reader_endpoint : null
}

output "port" {
  description = "Database port"
  value       = 5432
}

output "database_name" {
  description = "Database name"
  value       = var.database_name
}

output "master_username" {
  description = "Master username"
  value       = var.master_username
  sensitive   = true
}

output "security_group_id" {
  description = "RDS security group ID"
  value       = aws_security_group.rds.id
}

output "db_instance_identifier" {
  description = "Database instance identifier"
  value       = var.create_aurora_cluster ? aws_rds_cluster.aurora[0].cluster_identifier : aws_db_instance.main[0].identifier
}

output "db_instance_arn" {
  description = "Database instance ARN"
  value       = var.create_aurora_cluster ? aws_rds_cluster.aurora[0].arn : aws_db_instance.main[0].arn
}

output "connection_string" {
  description = "PostgreSQL connection string format"
  value       = "postgresql://${var.master_username}:<password>@${var.create_aurora_cluster ? aws_rds_cluster.aurora[0].endpoint : aws_db_instance.main[0].endpoint}:5432/${var.database_name}"
  sensitive   = true
}

# Cost-relevant outputs
output "instance_class" {
  description = "Instance class being used"
  value       = var.create_aurora_cluster ? (var.aurora_serverless_v2 ? "serverless" : var.instance_class) : var.instance_class
}

output "is_multi_az" {
  description = "Whether Multi-AZ is enabled"
  value       = var.create_aurora_cluster ? true : var.multi_az
}

output "storage_type" {
  description = "Storage type"
  value       = var.create_aurora_cluster ? "aurora" : var.storage_type
}
