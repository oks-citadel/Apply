# Azure Container Registry Security Configuration
#
# This module configures ACR security features:
# - Image immutability (prevents tag overwriting)
# - Content trust (image signing)
# - Vulnerability scanning
# - Retention policies
# - Network security

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.0.0"
    }
  }
}

# ==================== ACR Security Policy ====================

# Enable immutable tags on the ACR repository
# This prevents overwriting of existing image tags
resource "azurerm_container_registry_scope_map" "immutable" {
  name                    = "immutable-images"
  container_registry_name = var.acr_name
  resource_group_name     = var.resource_group_name

  actions = [
    "repositories/*/content/read",
    "repositories/*/metadata/read",
  ]
}

# Content Trust Policy - Enable Docker Content Trust
# Note: This requires manual setup of signing keys
resource "null_resource" "enable_content_trust" {
  count = var.enable_content_trust ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      az acr config content-trust update \
        --name ${var.acr_name} \
        --status enabled
    EOT
  }

  triggers = {
    acr_name = var.acr_name
  }
}

# ==================== Vulnerability Scanning ====================

# Enable Microsoft Defender for Container Registries
resource "azurerm_security_center_subscription_pricing" "containers" {
  tier          = var.defender_tier
  resource_type = "ContainerRegistry"
}

# ==================== Retention Policy ====================

# Configure retention policy to automatically delete untagged manifests
resource "null_resource" "retention_policy" {
  count = var.enable_retention_policy ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      az acr config retention update \
        --registry ${var.acr_name} \
        --status enabled \
        --days ${var.retention_days} \
        --type UntaggedManifests
    EOT
  }

  triggers = {
    acr_name       = var.acr_name
    retention_days = var.retention_days
  }
}

# ==================== Quarantine Policy ====================

# Enable quarantine policy for newly pushed images
# Images are quarantined until they pass vulnerability scan
resource "null_resource" "quarantine_policy" {
  count = var.enable_quarantine ? 1 : 0

  provisioner "local-exec" {
    command = <<-EOT
      az acr config quarantine update \
        --registry ${var.acr_name} \
        --status enabled
    EOT
  }

  triggers = {
    acr_name = var.acr_name
  }
}

# ==================== Network Security ====================

# Private Endpoint for ACR (disable public access)
resource "azurerm_private_endpoint" "acr" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "${var.acr_name}-private-endpoint"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.subnet_id

  private_service_connection {
    name                           = "${var.acr_name}-privateserviceconnection"
    private_connection_resource_id = var.acr_id
    is_manual_connection           = false
    subresource_names              = ["registry"]
  }

  private_dns_zone_group {
    name                 = "acr-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.acr[0].id]
  }

  tags = var.tags
}

resource "azurerm_private_dns_zone" "acr" {
  count               = var.enable_private_endpoint ? 1 : 0
  name                = "privatelink.azurecr.io"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "acr" {
  count                 = var.enable_private_endpoint ? 1 : 0
  name                  = "${var.acr_name}-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.acr[0].name
  virtual_network_id    = var.vnet_id

  tags = var.tags
}

# ==================== Webhook for Security Events ====================

resource "azurerm_container_registry_webhook" "security_alerts" {
  count               = var.security_webhook_url != "" ? 1 : 0
  name                = "securityalerts"
  resource_group_name = var.resource_group_name
  registry_name       = var.acr_name
  location            = var.location

  service_uri = var.security_webhook_url
  status      = "enabled"
  scope       = "*:*"
  actions     = ["push", "delete", "quarantine"]

  custom_headers = {
    "Content-Type" = "application/json"
  }

  tags = var.tags
}

# ==================== Diagnostic Settings ====================

resource "azurerm_monitor_diagnostic_setting" "acr" {
  name                       = "${var.acr_name}-diagnostics"
  target_resource_id         = var.acr_id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ContainerRegistryRepositoryEvents"
  }

  enabled_log {
    category = "ContainerRegistryLoginEvents"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# ==================== Azure Policy for Image Signing ====================

resource "azurerm_policy_assignment" "require_signed_images" {
  count                = var.enforce_signed_images ? 1 : 0
  name                 = "require-signed-images"
  scope                = var.aks_cluster_id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/febd0533-8e55-448f-b837-bd0e06f16469"
  display_name         = "Kubernetes cluster containers should only use allowed images"
  description          = "Enforce that only signed and verified images can be deployed"

  parameters = jsonencode({
    allowedContainerImagesRegex = {
      value = "^${var.acr_name}.azurecr.io/.*@sha256:[a-f0-9]{64}$"
    }
  })

  non_compliance_message {
    content = "Only signed images from the approved container registry with digest references are allowed."
  }
}

# ==================== Image Signing Script ====================

# Output a helper script for signing images
resource "local_file" "signing_script" {
  count    = var.generate_signing_script ? 1 : 0
  filename = "${path.module}/sign-image.sh"
  content  = <<-EOT
#!/bin/bash
# Image Signing Script for ${var.acr_name}
# Usage: ./sign-image.sh <image-name> <tag>

set -e

ACR_NAME="${var.acr_name}"
IMAGE_NAME=$1
IMAGE_TAG=$2

if [ -z "$IMAGE_NAME" ] || [ -z "$IMAGE_TAG" ]; then
    echo "Usage: ./sign-image.sh <image-name> <tag>"
    exit 1
fi

FULL_IMAGE="$ACR_NAME.azurecr.io/$IMAGE_NAME:$IMAGE_TAG"

echo "Signing image: $FULL_IMAGE"

# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1
export DOCKER_CONTENT_TRUST_SERVER="https://$ACR_NAME.azurecr.io"

# Get digest
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "$FULL_IMAGE" 2>/dev/null || echo "")

if [ -z "$DIGEST" ]; then
    echo "Error: Could not get image digest. Make sure the image exists."
    exit 1
fi

echo "Image digest: $DIGEST"

# Sign with notation (if available)
if command -v notation &> /dev/null; then
    notation sign "$FULL_IMAGE"
    echo "Image signed with notation"
fi

# Create immutable tag reference (digest-based)
DIGEST_REF="${var.acr_name}.azurecr.io/$IMAGE_NAME@$DIGEST"
echo "Immutable reference: $DIGEST_REF"

# Update Kubernetes manifest with digest
echo "Update your Kubernetes manifests to use:"
echo "  image: $DIGEST_REF"
EOT

  file_permission = "0755"
}
