# Example Usage - Monitoring Module
# JobPilot AI Platform

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# ============================================================================
# Example: Basic Monitoring Setup
# ============================================================================

module "monitoring_basic" {
  source = "../"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  app_insights_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/microsoft.insights/components/jobpilot-prod-appinsights"

  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend"
    backend  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-backend"
  }

  web_app_urls = {
    frontend = "https://app.jobpilot.ai"
    backend  = "https://api.jobpilot.ai/health"
  }

  alert_email_addresses = [
    "ops@jobpilot.ai"
  ]

  tags = {
    Project     = "JobPilot"
    Environment = "Production"
    CostCenter  = "Engineering"
  }
}

# ============================================================================
# Example: Full Monitoring with All Features
# ============================================================================

module "monitoring_full" {
  source = "../"

  resource_group_name = "jobpilot-prod-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "prod"

  # Application Insights and Log Analytics
  app_insights_id            = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/microsoft.insights/components/jobpilot-prod-appinsights"
  log_analytics_workspace_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.OperationalInsights/workspaces/jobpilot-prod-logs"

  # Database and Cache
  sql_server_id  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Sql/servers/jobpilot-prod-sql/databases/jobpilot-db"
  redis_cache_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Cache/Redis/jobpilot-prod-redis"

  # AKS Cluster
  aks_cluster_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.ContainerService/managedClusters/jobpilot-prod-aks"

  # Web Applications
  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-frontend"
    backend  = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-backend"
    auth     = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-auth"
    ai       = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-prod-rg/providers/Microsoft.Web/sites/jobpilot-prod-ai"
  }

  web_app_urls = {
    frontend = "https://app.jobpilot.ai"
    backend  = "https://api.jobpilot.ai/health"
    auth     = "https://auth.jobpilot.ai/health"
    ai       = "https://ai.jobpilot.ai/health"
  }

  # Alert Recipients
  alert_email_addresses = [
    "ops@jobpilot.ai",
    "devops@jobpilot.ai",
    "engineering-leads@jobpilot.ai"
  ]

  # Slack webhook for real-time notifications
  webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

  # Custom Thresholds
  cpu_threshold_percent               = 85
  memory_threshold_percent            = 85
  http_5xx_threshold                  = 5
  response_time_threshold_seconds     = 3
  failed_requests_threshold           = 100
  database_dtu_threshold_percent      = 75
  redis_memory_threshold_percent      = 75
  redis_server_load_threshold_percent = 75
  aks_cpu_threshold_percent           = 80
  aks_memory_threshold_percent        = 80
  error_spike_threshold               = 50
  failed_auth_threshold               = 10

  # Availability Test Locations
  availability_test_locations = [
    "us-east-1",
    "us-west-1",
    "eu-west-1",
    "apac-southeast",
    "us-central-1"
  ]

  tags = {
    Project     = "JobPilot"
    Environment = "Production"
    CostCenter  = "Engineering"
    ManagedBy   = "Terraform"
  }
}

# ============================================================================
# Example: Development Environment with Relaxed Thresholds
# ============================================================================

module "monitoring_dev" {
  source = "../"

  resource_group_name = "jobpilot-dev-rg"
  location            = "eastus"
  project_name        = "jobpilot"
  environment         = "dev"

  app_insights_id = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-dev-rg/providers/microsoft.insights/components/jobpilot-dev-appinsights"

  web_app_ids = {
    frontend = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/jobpilot-dev-rg/providers/Microsoft.Web/sites/jobpilot-dev-frontend"
  }

  web_app_urls = {
    frontend = "https://dev.jobpilot.ai"
  }

  alert_email_addresses = [
    "dev-team@jobpilot.ai"
  ]

  # Relaxed thresholds for development
  cpu_threshold_percent           = 95
  memory_threshold_percent        = 95
  http_5xx_threshold              = 50
  response_time_threshold_seconds = 10

  tags = {
    Project     = "JobPilot"
    Environment = "Development"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "monitoring_full_summary" {
  description = "Summary of the full monitoring configuration"
  value       = module.monitoring_full.monitoring_summary
}

output "action_group_id" {
  description = "Action group ID for the full monitoring setup"
  value       = module.monitoring_full.action_group_id
}

output "all_alert_ids" {
  description = "All alert rule IDs"
  value       = module.monitoring_full.alert_rule_ids
}
