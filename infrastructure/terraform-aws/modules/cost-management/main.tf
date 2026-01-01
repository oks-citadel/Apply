# AWS Cost Management Module
# Implements budgets, anomaly detection, and cost optimization controls

#-------------------------------------------------------------------------------
# AWS Budgets
#-------------------------------------------------------------------------------

resource "aws_budgets_budget" "monthly_total" {
  name         = "${var.environment}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Environment$${var.environment}"]
  }

  # Alert at 50% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert at 75% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 75
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert at 90% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 90
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Alert at 100% threshold
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }

  # Forecasted alert at 100%
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.budget_alert_emails
  }
}

# Service-specific budgets for visibility
resource "aws_budgets_budget" "compute" {
  name         = "${var.environment}-compute-budget"
  budget_type  = "COST"
  limit_amount = var.compute_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Elastic Compute Cloud - Compute", "Amazon Elastic Container Service for Kubernetes"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }
}

resource "aws_budgets_budget" "database" {
  name         = "${var.environment}-database-budget"
  budget_type  = "COST"
  limit_amount = var.database_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Relational Database Service", "Amazon ElastiCache"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.budget_alert_emails
  }
}

#-------------------------------------------------------------------------------
# Cost Anomaly Detection
#-------------------------------------------------------------------------------

# Note: AWS Cost Anomaly Detection has limits on dimensional monitors per account
# Using only the service monitor to stay within limits
# Set create_anomaly_monitor = false if account limit is reached
resource "aws_ce_anomaly_monitor" "service_monitor" {
  count = var.create_anomaly_monitor ? 1 : 0

  name              = "applyforus-${var.environment}-service-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

resource "aws_ce_anomaly_subscription" "alerts" {
  count = var.create_anomaly_monitor ? 1 : 0

  name      = "${var.environment}-cost-anomaly-alerts"
  frequency = "IMMEDIATE"

  monitor_arn_list = [
    aws_ce_anomaly_monitor.service_monitor[0].arn
  ]

  subscriber {
    type    = "EMAIL"
    address = var.finops_email
  }

  # Alert on anomalies over threshold impact
  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      match_options = ["GREATER_THAN_OR_EQUAL"]
      values        = [tostring(var.anomaly_threshold)]
    }
  }
}

#-------------------------------------------------------------------------------
# Cost Allocation Tags Activation
#-------------------------------------------------------------------------------

# Note: Cost allocation tags must be activated in the AWS Billing console
# This resource serves as documentation

resource "null_resource" "cost_allocation_tags_reminder" {
  triggers = {
    always_run = timestamp()
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "IMPORTANT: Ensure the following cost allocation tags are activated in AWS Billing Console:"
      echo "  - Environment"
      echo "  - Owner"
      echo "  - CostCenter"
      echo "  - Application"
      echo "  - ManagedBy"
      echo "  - AutoShutdown"
      echo "  - ExpirationDate"
    EOT
  }
}

#-------------------------------------------------------------------------------
# Savings Plans Recommendations
# Note: Cost and usage data should be retrieved via AWS Cost Explorer API
# or through the AWS Console, not via Terraform data sources
#-------------------------------------------------------------------------------

#-------------------------------------------------------------------------------
# Auto-Shutdown for Non-Production (Lambda + EventBridge)
#-------------------------------------------------------------------------------

resource "aws_lambda_function" "auto_shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  filename         = data.archive_file.auto_shutdown[0].output_path
  function_name    = "${var.environment}-auto-shutdown"
  role             = aws_iam_role.lambda_shutdown[0].arn
  handler          = "index.handler"
  runtime          = "python3.11"
  timeout          = 300
  source_code_hash = data.archive_file.auto_shutdown[0].output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = {
    Purpose = "cost-optimization"
  }
}

data "archive_file" "auto_shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  type        = "zip"
  output_path = "${path.module}/files/auto_shutdown.zip"

  source {
    content  = <<-PYTHON
import boto3
import os

def handler(event, context):
    """Stop non-essential dev/staging resources outside business hours."""

    environment = os.environ.get('ENVIRONMENT', 'dev')
    action = event.get('action', 'stop')

    ec2 = boto3.client('ec2')
    rds = boto3.client('rds')

    # Stop/Start EC2 instances with AutoShutdown=true
    instances = ec2.describe_instances(
        Filters=[
            {'Name': 'tag:AutoShutdown', 'Values': ['true']},
            {'Name': 'tag:Environment', 'Values': [environment]},
            {'Name': 'instance-state-name', 'Values': ['running' if action == 'stop' else 'stopped']}
        ]
    )

    instance_ids = [
        i['InstanceId']
        for r in instances['Reservations']
        for i in r['Instances']
    ]

    if instance_ids:
        if action == 'stop':
            ec2.stop_instances(InstanceIds=instance_ids)
            print(f"Stopped {len(instance_ids)} EC2 instances")
        else:
            ec2.start_instances(InstanceIds=instance_ids)
            print(f"Started {len(instance_ids)} EC2 instances")

    # Stop/Start RDS instances
    dbs = rds.describe_db_instances()
    for db in dbs['DBInstances']:
        try:
            tags = {t['Key']: t['Value'] for t in rds.list_tags_for_resource(
                ResourceName=db['DBInstanceArn'])['TagList']}

            if tags.get('AutoShutdown') == 'true' and tags.get('Environment') == environment:
                if action == 'stop' and db['DBInstanceStatus'] == 'available':
                    rds.stop_db_instance(DBInstanceIdentifier=db['DBInstanceIdentifier'])
                    print(f"Stopped RDS: {db['DBInstanceIdentifier']}")
                elif action == 'start' and db['DBInstanceStatus'] == 'stopped':
                    rds.start_db_instance(DBInstanceIdentifier=db['DBInstanceIdentifier'])
                    print(f"Started RDS: {db['DBInstanceIdentifier']}")
        except Exception as e:
            print(f"Error processing RDS {db['DBInstanceIdentifier']}: {e}")

    return {
        'statusCode': 200,
        'body': f"Completed {action} action for {environment}"
    }
PYTHON
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  name = "${var.environment}-auto-shutdown-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  name = "${var.environment}-auto-shutdown-policy"
  role = aws_iam_role.lambda_shutdown[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:DescribeInstances",
          "ec2:StopInstances",
          "ec2:StartInstances",
          "rds:DescribeDBInstances",
          "rds:StopDBInstance",
          "rds:StartDBInstance",
          "rds:ListTagsForResource",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      }
    ]
  })
}

# Shutdown schedule (7 PM weekdays)
resource "aws_cloudwatch_event_rule" "shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  name                = "${var.environment}-auto-shutdown"
  description         = "Trigger auto-shutdown for non-prod resources"
  schedule_expression = var.shutdown_schedule
}

resource "aws_cloudwatch_event_target" "shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  rule      = aws_cloudwatch_event_rule.shutdown[0].name
  target_id = "AutoShutdown"
  arn       = aws_lambda_function.auto_shutdown[0].arn

  input = jsonencode({
    action = "stop"
  })
}

resource "aws_lambda_permission" "shutdown" {
  count = var.enable_auto_shutdown ? 1 : 0

  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_shutdown[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.shutdown[0].arn
}

# Startup schedule (7 AM weekdays)
resource "aws_cloudwatch_event_rule" "startup" {
  count = var.enable_auto_shutdown ? 1 : 0

  name                = "${var.environment}-auto-startup"
  description         = "Trigger auto-startup for non-prod resources"
  schedule_expression = var.startup_schedule
}

resource "aws_cloudwatch_event_target" "startup" {
  count = var.enable_auto_shutdown ? 1 : 0

  rule      = aws_cloudwatch_event_rule.startup[0].name
  target_id = "AutoStartup"
  arn       = aws_lambda_function.auto_shutdown[0].arn

  input = jsonencode({
    action = "start"
  })
}

resource "aws_lambda_permission" "startup" {
  count = var.enable_auto_shutdown ? 1 : 0

  statement_id  = "AllowEventBridgeInvokeStartup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_shutdown[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.startup[0].arn
}
