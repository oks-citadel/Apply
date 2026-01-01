# Cost Management Module Variables

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 5000
}

variable "compute_budget_limit" {
  description = "Monthly compute budget limit in USD"
  type        = number
  default     = 2500
}

variable "database_budget_limit" {
  description = "Monthly database budget limit in USD"
  type        = number
  default     = 1000
}

variable "budget_alert_emails" {
  description = "Email addresses for budget alerts"
  type        = list(string)
  default     = []
}

variable "finops_email" {
  description = "FinOps team email for cost anomaly alerts"
  type        = string
}

variable "monitored_regions" {
  description = "Regions to monitor for cost anomalies"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "anomaly_threshold" {
  description = "Cost anomaly threshold in USD"
  type        = number
  default     = 100
}

variable "create_anomaly_monitor" {
  description = "Create cost anomaly monitor (set false if account limit reached)"
  type        = bool
  default     = true
}

variable "enable_auto_shutdown" {
  description = "Enable auto-shutdown for non-production resources"
  type        = bool
  default     = false
}

variable "shutdown_schedule" {
  description = "Cron expression for auto-shutdown (UTC)"
  type        = string
  default     = "cron(0 19 ? * MON-FRI *)" # 7 PM weekdays
}

variable "startup_schedule" {
  description = "Cron expression for auto-startup (UTC)"
  type        = string
  default     = "cron(0 7 ? * MON-FRI *)" # 7 AM weekdays
}
