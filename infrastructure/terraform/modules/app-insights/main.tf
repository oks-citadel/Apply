# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"

  # Retention period based on environment
  retention_in_days = lookup(
    {
      dev     = 30
      staging = 60
      prod    = 90
    },
    var.environment,
    30
  )

  # Data ingestion controls
  daily_quota_gb = var.environment == "prod" ? -1 : 5

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "app-insights"
    }
  )
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "appi-${var.project_name}-${var.environment}"
  location            = var.location
  resource_group_name = var.resource_group_name
  application_type    = "web"
  workspace_id        = azurerm_log_analytics_workspace.main.id

  # Sampling configuration
  sampling_percentage = var.sampling_percentage

  # Disable local authentication (use Azure AD instead)
  disable_ip_masking = var.environment == "dev" ? true : false

  # Internet ingestion and query
  internet_ingestion_enabled = true
  internet_query_enabled     = true

  tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Module      = "app-insights"
    }
  )
}
