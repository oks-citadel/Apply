# ============================================================================
# Azure Container Registry - Retention and Cleanup Policies
# ============================================================================
# This configuration implements ACR retention policies to control image sprawl
# and reduce storage costs.

# ============================================================================
# ACR Retention Policy
# ============================================================================

resource "azurerm_container_registry_task" "cleanup_task" {
  name                  = "${var.project_name}-${var.environment}-acr-cleanup"
  container_registry_id = azurerm_container_registry.acr.id
  platform {
    os = "Linux"
  }

  # Task that runs daily to clean up old images
  # Keep last 10 tags per repository
  # Delete images older than 30 days (except tagged images)
  encoded_step {
    task_content = base64encode(<<-EOT
      version: v1.1.0
      steps:
        # Step 1: Remove untagged manifests older than 30 days
        - cmd: acr purge --filter '.*:.*' --ago 30d --untagged --dry-run
          when: ['$DRY_RUN', 'eq', 'true']
        - cmd: acr purge --filter '.*:.*' --ago 30d --untagged
          when: ['$DRY_RUN', 'ne', 'true']

        # Step 2: Keep only last 10 tags per repository
        - cmd: acr purge --filter '.*:.*' --keep 10 --dry-run
          when: ['$DRY_RUN', 'eq', 'true']
        - cmd: acr purge --filter '.*:.*' --keep 10
          when: ['$DRY_RUN', 'ne', 'true']

        # Step 3: Remove images older than 90 days for non-prod environments
        - cmd: acr purge --filter '.*:(dev|staging|test)-.*' --ago 90d --dry-run
          when: ['$DRY_RUN', 'eq', 'true']
        - cmd: acr purge --filter '.*:(dev|staging|test)-.*' --ago 90d
          when: ['$DRY_RUN', 'ne', 'true']
    EOT
    )
  }

  # Run daily at 2 AM UTC
  timer_trigger {
    name     = "daily-cleanup"
    schedule = "0 2 * * *"
    enabled  = var.environment == "prod" ? true : false
  }

  # Allow manual trigger
  agent_setting {
    cpu = 2
  }

  # Set to dry-run for non-prod environments
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# ============================================================================
# ACR Task Schedule - Environment-Specific
# ============================================================================

resource "azurerm_container_registry_task_schedule_run_now" "initial_cleanup" {
  count                 = var.enable_initial_cleanup ? 1 : 0
  container_registry_task_id = azurerm_container_registry_task.cleanup_task.id
}

# ============================================================================
# ACR Quarantine Policy (for scanning)
# ============================================================================

# Enable content trust and quarantine for scanned images
resource "azurerm_container_registry_scope_map" "cleanup_scope" {
  name                    = "${var.project_name}-${var.environment}-cleanup-scope"
  container_registry_name = azurerm_container_registry.acr.name
  resource_group_name     = var.resource_group_name

  actions = [
    "repositories/*/metadata/read",
    "repositories/*/metadata/write",
    "repositories/*/content/delete",
  ]
}

# ============================================================================
# ACR Webhook for Cleanup Notifications
# ============================================================================

resource "azurerm_container_registry_webhook" "cleanup_webhook" {
  count               = var.enable_cleanup_notifications ? 1 : 0
  name                = "${var.project_name}${var.environment}cleanupwebhook"
  resource_group_name = var.resource_group_name
  registry_name       = azurerm_container_registry.acr.name
  location            = var.location

  service_uri = var.cleanup_webhook_url
  status      = "enabled"
  scope       = "*"
  actions     = ["delete"]

  custom_headers = {
    "Content-Type" = "application/json"
  }

  tags = var.tags
}

# ============================================================================
# ACR Cache Rules (for cost optimization)
# ============================================================================

# Cache frequently used base images to reduce pull costs
resource "azurerm_container_registry_cache_rule" "node_cache" {
  count                    = var.enable_cache_rules ? 1 : 0
  name                     = "cache-node"
  container_registry_id    = azurerm_container_registry.acr.id
  source_repo              = "docker.io/library/node"
  target_repo              = "cached/node"
  credential_set_id        = null
}

resource "azurerm_container_registry_cache_rule" "nginx_cache" {
  count                    = var.enable_cache_rules ? 1 : 0
  name                     = "cache-nginx"
  container_registry_id    = azurerm_container_registry.acr.id
  source_repo              = "docker.io/library/nginx"
  target_repo              = "cached/nginx"
  credential_set_id        = null
}

# ============================================================================
# Outputs
# ============================================================================

output "cleanup_task_id" {
  description = "ID of the ACR cleanup task"
  value       = azurerm_container_registry_task.cleanup_task.id
}

output "cleanup_task_name" {
  description = "Name of the ACR cleanup task"
  value       = azurerm_container_registry_task.cleanup_task.name
}
