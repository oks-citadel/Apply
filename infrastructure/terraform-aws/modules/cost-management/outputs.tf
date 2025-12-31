# Cost Management Module Outputs

output "monthly_budget_id" {
  description = "Monthly budget ID"
  value       = aws_budgets_budget.monthly_total.id
}

output "compute_budget_id" {
  description = "Compute budget ID"
  value       = aws_budgets_budget.compute.id
}

output "database_budget_id" {
  description = "Database budget ID"
  value       = aws_budgets_budget.database.id
}

output "anomaly_monitor_arns" {
  description = "Cost anomaly monitor ARNs"
  value = {
    service = aws_ce_anomaly_monitor.service_monitor.arn
    custom  = aws_ce_anomaly_monitor.custom_monitor.arn
  }
}

output "anomaly_subscription_arn" {
  description = "Cost anomaly subscription ARN"
  value       = aws_ce_anomaly_subscription.alerts.arn
}

output "auto_shutdown_lambda_arn" {
  description = "Auto-shutdown Lambda function ARN"
  value       = var.enable_auto_shutdown ? aws_lambda_function.auto_shutdown[0].arn : null
}

# Note: Cost data should be retrieved via AWS Cost Explorer API or console
# output "last_month_cost_by_service" removed - data source not supported
