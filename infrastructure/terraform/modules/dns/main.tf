# ============================================================================
# Azure DNS Zone Module - JobPilot AI Platform
# ============================================================================
# This module manages Azure DNS zones and records for the ApplyforUs domain.
# It creates the DNS zone, A records, CNAME records, TXT records for
# verification, and MX records for email if needed.
#
# Prerequisites:
# - Domain registered with GoDaddy (or any registrar)
# - Azure subscription with DNS zone capability
# - Ability to update nameservers at domain registrar

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = ">= 3.85.0"
    }
  }
}

# ============================================================================
# Azure DNS Zone
# ============================================================================

resource "azurerm_dns_zone" "main" {
  name                = var.domain_name
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# ============================================================================
# Root Domain A Record (@ -> AKS Ingress or Application Gateway)
# ============================================================================

resource "azurerm_dns_a_record" "root" {
  count               = var.ingress_public_ip != null ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.ingress_public_ip]
  tags                = var.tags
}

# ============================================================================
# WWW CNAME Record (www -> root domain)
# ============================================================================

resource "azurerm_dns_cname_record" "www" {
  name                = "www"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = var.domain_name
  tags                = var.tags
}

# ============================================================================
# API Subdomain A Record (api -> AKS Ingress or Application Gateway)
# ============================================================================

resource "azurerm_dns_a_record" "api" {
  count               = var.ingress_public_ip != null ? 1 : 0
  name                = "api"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.ingress_public_ip]
  tags                = var.tags
}

# ============================================================================
# Staging Subdomain A Record (staging -> AKS Ingress or Application Gateway)
# ============================================================================

resource "azurerm_dns_a_record" "staging" {
  count               = var.enable_staging && var.staging_public_ip != null ? 1 : 0
  name                = "staging"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.staging_public_ip]
  tags                = var.tags
}

# ============================================================================
# ACR Subdomain CNAME (acr -> Azure Container Registry)
# Optional: For custom domain on ACR
# ============================================================================

resource "azurerm_dns_cname_record" "acr" {
  count               = var.enable_acr_subdomain && var.acr_login_server != null ? 1 : 0
  name                = "acr"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = var.acr_login_server
  tags                = var.tags
}

# ============================================================================
# TXT Record for Domain Verification
# ============================================================================

resource "azurerm_dns_txt_record" "verification" {
  count               = length(var.verification_records) > 0 ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  dynamic "record" {
    for_each = var.verification_records
    content {
      value = record.value
    }
  }

  tags = var.tags
}

# ============================================================================
# TXT Record for cert-manager ACME DNS Challenge (if using DNS validation)
# ============================================================================

resource "azurerm_dns_txt_record" "acme_challenge" {
  count               = var.enable_acme_dns_validation ? 1 : 0
  name                = "_acme-challenge"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  record {
    value = "acme-validation-placeholder"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [record]
  }
}

# ============================================================================
# MX Records for Email (Optional)
# ============================================================================

resource "azurerm_dns_mx_record" "email" {
  count               = var.enable_mx_records && length(var.mx_records) > 0 ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  dynamic "record" {
    for_each = var.mx_records
    content {
      preference = record.value.preference
      exchange   = record.value.exchange
    }
  }

  tags = var.tags
}

# ============================================================================
# SPF Record for Email Authentication (Optional)
# ============================================================================

resource "azurerm_dns_txt_record" "spf" {
  count               = var.enable_mx_records && var.spf_record != null ? 1 : 0
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  record {
    value = var.spf_record
  }

  tags = var.tags
}

# ============================================================================
# DMARC Record for Email Security (Optional)
# ============================================================================

resource "azurerm_dns_txt_record" "dmarc" {
  count               = var.enable_mx_records && var.dmarc_record != null ? 1 : 0
  name                = "_dmarc"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  record {
    value = var.dmarc_record
  }

  tags = var.tags
}

# ============================================================================
# CAA Record for Certificate Authority Authorization
# ============================================================================

resource "azurerm_dns_caa_record" "main" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 3600

  # Allow Let's Encrypt to issue certificates
  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  # Allow wildcard certificates
  record {
    flags = 0
    tag   = "issuewild"
    value = "letsencrypt.org"
  }

  # Email for CAA violation reports
  record {
    flags = 0
    tag   = "iodef"
    value = "mailto:admin@${var.domain_name}"
  }

  tags = var.tags
}

# ============================================================================
# Custom DNS Records
# ============================================================================

resource "azurerm_dns_a_record" "custom" {
  for_each            = var.custom_a_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = each.value
  tags                = var.tags
}

resource "azurerm_dns_cname_record" "custom" {
  for_each            = var.custom_cname_records
  name                = each.key
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  record              = each.value
  tags                = var.tags
}

# ============================================================================
# DNS Zone Diagnostic Settings
# ============================================================================

resource "azurerm_monitor_diagnostic_setting" "dns_zone" {
  count                      = var.enable_diagnostics && var.log_analytics_workspace_id != null ? 1 : 0
  name                       = "dns-diagnostics"
  target_resource_id         = azurerm_dns_zone.main.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "QueryLog"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
