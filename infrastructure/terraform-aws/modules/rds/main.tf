#-------------------------------------------------------------------------------
# RDS PostgreSQL Module - Cost-Optimized Database Layer
# Migrates from Azure Database for PostgreSQL Flexible Server
#-------------------------------------------------------------------------------

locals {
  common_tags = {
    Module      = "rds"
    ManagedBy   = "terraform"
    Application = var.application_name
  }
}

#-------------------------------------------------------------------------------
# DB Subnet Group
#-------------------------------------------------------------------------------

resource "aws_db_subnet_group" "main" {
  name        = "${var.environment}-${var.application_name}-db"
  description = "Database subnet group for ${var.application_name}"
  subnet_ids  = var.database_subnet_ids

  tags = merge(local.common_tags, var.tags, {
    Name = "${var.environment}-${var.application_name}-db-subnet-group"
  })
}

#-------------------------------------------------------------------------------
# Security Group
#-------------------------------------------------------------------------------

resource "aws_security_group" "rds" {
  name        = "${var.environment}-${var.application_name}-rds"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS"
    from_port       = 5432
    to_port         = 5432
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
    Name = "${var.environment}-${var.application_name}-rds-sg"
  })

  lifecycle {
    create_before_destroy = true
  }
}

#-------------------------------------------------------------------------------
# Parameter Group - PostgreSQL 15 optimized settings
#-------------------------------------------------------------------------------

resource "aws_db_parameter_group" "main" {
  name        = "${var.environment}-${var.application_name}-pg15"
  family      = "postgres15"
  description = "Custom parameter group for ${var.application_name}"

  # Performance settings
  parameter {
    name  = "shared_buffers"
    value = "{DBInstanceClassMemory/4096}" # 25% of memory
  }

  parameter {
    name  = "effective_cache_size"
    value = "{DBInstanceClassMemory*3/4096}" # 75% of memory
  }

  parameter {
    name  = "work_mem"
    value = "65536" # 64MB
  }

  parameter {
    name  = "maintenance_work_mem"
    value = "524288" # 512MB
  }

  # Connection settings
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }

  # Logging
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log queries over 1 second
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  # Security
  parameter {
    name  = "ssl"
    value = "1"
  }

  tags = merge(local.common_tags, var.tags)

  lifecycle {
    create_before_destroy = true
  }
}

#-------------------------------------------------------------------------------
# RDS Instance (Single DB for cost optimization in dev/staging)
#-------------------------------------------------------------------------------

resource "aws_db_instance" "main" {
  count = var.create_aurora_cluster ? 0 : 1

  identifier = "${var.environment}-${var.application_name}"

  # Engine
  engine               = "postgres"
  engine_version       = var.postgres_version
  parameter_group_name = aws_db_parameter_group.main.name

  # Instance
  instance_class        = var.instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = var.storage_type
  storage_encrypted     = true
  kms_key_id            = var.kms_key_arn

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  port                   = 5432

  # Credentials
  db_name  = var.database_name
  username = var.master_username
  password = var.master_password

  # Maintenance & Backup
  backup_retention_period   = var.backup_retention_days
  backup_window             = var.backup_window
  maintenance_window        = var.maintenance_window
  copy_tags_to_snapshot     = true
  delete_automated_backups  = var.environment != "prod"
  deletion_protection       = var.environment == "prod"
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.environment}-${var.application_name}-final" : null

  # Monitoring
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null
  performance_insights_kms_key_id       = var.enable_performance_insights ? var.kms_key_arn : null
  enabled_cloudwatch_logs_exports       = ["postgresql", "upgrade"]
  monitoring_interval                   = var.enhanced_monitoring_interval
  monitoring_role_arn                   = var.enhanced_monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  # High Availability
  multi_az = var.multi_az

  # Updates
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false
  apply_immediately           = var.environment != "prod"

  tags = merge(local.common_tags, var.tags, {
    Name        = "${var.environment}-${var.application_name}-rds"
    Environment = var.environment
    CostCenter  = var.cost_center
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes  = [password]
  }
}

#-------------------------------------------------------------------------------
# Aurora PostgreSQL Cluster (for production with read replicas)
#-------------------------------------------------------------------------------

resource "aws_rds_cluster" "aurora" {
  count = var.create_aurora_cluster ? 1 : 0

  cluster_identifier = "${var.environment}-${var.application_name}"

  # Engine
  engine         = "aurora-postgresql"
  engine_mode    = var.aurora_serverless_v2 ? "provisioned" : "provisioned"
  engine_version = var.postgres_version

  # Credentials
  database_name   = var.database_name
  master_username = var.master_username
  master_password = var.master_password

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  port                   = 5432

  # Storage
  storage_encrypted = true
  kms_key_id        = var.kms_key_arn

  # Backup
  backup_retention_period      = var.backup_retention_days
  preferred_backup_window      = var.backup_window
  preferred_maintenance_window = var.maintenance_window
  copy_tags_to_snapshot        = true
  deletion_protection          = var.environment == "prod"
  skip_final_snapshot          = var.environment != "prod"
  final_snapshot_identifier    = var.environment == "prod" ? "${var.environment}-${var.application_name}-final" : null

  # Logs
  enabled_cloudwatch_logs_exports = ["postgresql"]

  # Serverless v2 scaling (cost optimization)
  dynamic "serverlessv2_scaling_configuration" {
    for_each = var.aurora_serverless_v2 ? [1] : []
    content {
      min_capacity = var.aurora_min_capacity
      max_capacity = var.aurora_max_capacity
    }
  }

  tags = merge(local.common_tags, var.tags, {
    Name        = "${var.environment}-${var.application_name}-aurora"
    Environment = var.environment
    CostCenter  = var.cost_center
  })

  lifecycle {
    prevent_destroy = false
    ignore_changes  = [master_password]
  }
}

resource "aws_rds_cluster_instance" "aurora" {
  count = var.create_aurora_cluster ? var.aurora_instance_count : 0

  identifier         = "${var.environment}-${var.application_name}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.aurora[0].id

  engine         = aws_rds_cluster.aurora[0].engine
  engine_version = aws_rds_cluster.aurora[0].engine_version

  instance_class = var.aurora_serverless_v2 ? "db.serverless" : var.instance_class

  publicly_accessible = false

  # Monitoring
  performance_insights_enabled          = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null
  performance_insights_kms_key_id       = var.enable_performance_insights ? var.kms_key_arn : null
  monitoring_interval                   = var.enhanced_monitoring_interval
  monitoring_role_arn                   = var.enhanced_monitoring_interval > 0 ? aws_iam_role.rds_monitoring[0].arn : null

  auto_minor_version_upgrade = true

  tags = merge(local.common_tags, var.tags, {
    Name = "${var.environment}-${var.application_name}-aurora-${count.index + 1}"
  })
}

#-------------------------------------------------------------------------------
# Enhanced Monitoring IAM Role
#-------------------------------------------------------------------------------

resource "aws_iam_role" "rds_monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  name = "${var.environment}-${var.application_name}-rds-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "rds_monitoring" {
  count = var.enhanced_monitoring_interval > 0 ? 1 : 0

  role       = aws_iam_role.rds_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

#-------------------------------------------------------------------------------
# CloudWatch Alarms
#-------------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "cpu_utilization" {
  alarm_name          = "${var.environment}-${var.application_name}-rds-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    DBInstanceIdentifier = var.create_aurora_cluster ? aws_rds_cluster_instance.aurora[0].identifier : aws_db_instance.main[0].identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "free_storage" {
  count = var.create_aurora_cluster ? 0 : 1

  alarm_name          = "${var.environment}-${var.application_name}-rds-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.allocated_storage * 1024 * 1024 * 1024 * 0.1 # 10% of allocated
  alarm_description   = "RDS free storage space is low"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main[0].identifier
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "database_connections" {
  alarm_name          = "${var.environment}-${var.application_name}-rds-connections"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = var.max_connections * 0.8
  alarm_description   = "RDS connection count is high"
  alarm_actions       = var.alarm_sns_topic_arns

  dimensions = {
    DBInstanceIdentifier = var.create_aurora_cluster ? aws_rds_cluster_instance.aurora[0].identifier : aws_db_instance.main[0].identifier
  }

  tags = local.common_tags
}
