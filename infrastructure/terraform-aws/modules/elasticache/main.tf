#-------------------------------------------------------------------------------
# ElastiCache Redis Module - Cost-Optimized Caching Layer
# Migrates from Azure Cache for Redis
#-------------------------------------------------------------------------------

locals {
  common_tags = {
    Module      = "elasticache"
    ManagedBy   = "terraform"
    Application = var.application_name
  }
}

#-------------------------------------------------------------------------------
# Subnet Group
#-------------------------------------------------------------------------------

resource "aws_elasticache_subnet_group" "main" {
  name        = "${var.environment}-${var.application_name}-redis"
  description = "ElastiCache subnet group for ${var.application_name}"
  subnet_ids  = var.private_subnet_ids

  tags = merge(local.common_tags, var.tags, {
    Name = "${var.environment}-${var.application_name}-redis-subnet-group"
  })
}

#-------------------------------------------------------------------------------
# Security Group
#-------------------------------------------------------------------------------

resource "aws_security_group" "redis" {
  name        = "${var.environment}-${var.application_name}-redis"
  description = "Security group for ElastiCache Redis"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Redis from EKS"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = var.allowed_security_groups
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, var.tags, {
    Name = "${var.environment}-${var.application_name}-redis-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

#-------------------------------------------------------------------------------
# Parameter Group
#-------------------------------------------------------------------------------

resource "aws_elasticache_parameter_group" "main" {
  name        = "${var.environment}-${var.application_name}-redis7"
  family      = "redis7"
  description = "Custom parameter group for ${var.application_name}"

  # Memory management
  parameter {
    name  = "maxmemory-policy"
    value = var.maxmemory_policy
  }

  # Connection settings
  parameter {
    name  = "timeout"
    value = "300"
  }

  # Persistence (disabled for cache-only use case, saves costs)
  parameter {
    name  = "appendonly"
    value = var.enable_persistence ? "yes" : "no"
  }

  tags = merge(local.common_tags, var.tags)
}

#-------------------------------------------------------------------------------
# ElastiCache Serverless (Cost-optimized for variable workloads)
#-------------------------------------------------------------------------------

resource "aws_elasticache_serverless_cache" "main" {
  count = var.use_serverless ? 1 : 0

  engine = "redis"
  name   = "${var.environment}-${var.application_name}"

  cache_usage_limits {
    data_storage {
      maximum = var.serverless_max_data_storage_gb
      unit    = "GB"
    }
    ecpu_per_second {
      maximum = var.serverless_max_ecpu
    }
  }

  daily_snapshot_time      = var.snapshot_window
  description              = "ElastiCache Serverless for ${var.application_name}"
  kms_key_id               = var.kms_key_arn
  major_engine_version     = "7"
  snapshot_retention_limit = var.snapshot_retention_days
  security_group_ids       = [aws_security_group.redis.id]
  subnet_ids               = var.private_subnet_ids

  tags = merge(local.common_tags, var.tags, {
    Name        = "${var.environment}-${var.application_name}-redis-serverless"
    Environment = var.environment
    CostCenter  = var.cost_center
  })
}

#-------------------------------------------------------------------------------
# ElastiCache Replication Group (Traditional - for predictable workloads)
#-------------------------------------------------------------------------------

resource "aws_elasticache_replication_group" "main" {
  count = var.use_serverless ? 0 : 1

  replication_group_id = "${var.environment}-${var.application_name}"
  description          = "ElastiCache Redis for ${var.application_name}"

  # Engine
  engine               = "redis"
  engine_version       = var.redis_version
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379

  # Instance Configuration
  node_type = var.node_type

  # Cluster Mode (disabled = single shard with replicas)
  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.num_cache_clusters > 1

  # Network
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = var.transit_encryption_enabled
  kms_key_id                 = var.kms_key_arn
  auth_token                 = var.transit_encryption_enabled ? var.auth_token : null

  # Maintenance & Backup
  maintenance_window         = var.maintenance_window
  snapshot_window            = var.snapshot_window
  snapshot_retention_limit   = var.snapshot_retention_days
  final_snapshot_identifier  = var.environment == "prod" ? "${var.environment}-${var.application_name}-final" : null
  auto_minor_version_upgrade = true
  apply_immediately          = var.environment != "prod"

  # Notifications
  notification_topic_arn = var.notification_topic_arn

  tags = merge(local.common_tags, var.tags, {
    Name        = "${var.environment}-${var.application_name}-redis"
    Environment = var.environment
    CostCenter  = var.cost_center
  })

  lifecycle {
    ignore_changes = [auth_token]
  }
}

#-------------------------------------------------------------------------------
# CloudWatch Alarms
#-------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  count = var.use_serverless ? 0 : 1

  alarm_name          = "${var.environment}-${var.application_name}-redis-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "ElastiCache CPU utilization is too high"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    CacheClusterId = element(tolist(aws_elasticache_replication_group.main[0].member_clusters), 0)
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "memory_usage" {
  count = var.use_serverless ? 0 : 1

  alarm_name          = "${var.environment}-${var.application_name}-redis-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ElastiCache memory usage is high"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    CacheClusterId = element(tolist(aws_elasticache_replication_group.main[0].member_clusters), 0)
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "evictions" {
  count = var.use_serverless ? 0 : 1

  alarm_name          = "${var.environment}-${var.application_name}-redis-evictions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Evictions"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "ElastiCache evictions are high - consider scaling up"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    CacheClusterId = element(tolist(aws_elasticache_replication_group.main[0].member_clusters), 0)
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "replication_lag" {
  count = var.use_serverless ? 0 : (var.num_cache_clusters > 1 ? 1 : 0)

  alarm_name          = "${var.environment}-${var.application_name}-redis-replication-lag"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ReplicationLag"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "ElastiCache replication lag is high"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    CacheClusterId = element(tolist(aws_elasticache_replication_group.main[0].member_clusters), 1)
  }

  tags = local.common_tags
}
