# Azure DNS Zone
resource "azurerm_dns_zone" "main" {
  name                = var.dns_zone_name
  resource_group_name = var.resource_group_name
  tags                = var.tags
}

# A record for root domain pointing to Application Gateway
resource "azurerm_dns_a_record" "root" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.app_gateway_public_ip]
  tags                = var.tags
}

# A record for www subdomain
resource "azurerm_dns_a_record" "www" {
  name                = "www"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.app_gateway_public_ip]
  tags                = var.tags
}

# A record for api subdomain
resource "azurerm_dns_a_record" "api" {
  name                = "api"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [var.app_gateway_public_ip]
  tags                = var.tags
}

# CNAME record for wildcard (optional)
# resource "azurerm_dns_cname_record" "wildcard" {
#   name                = "*"
#   zone_name           = azurerm_dns_zone.main.name
#   resource_group_name = var.resource_group_name
#   ttl                 = 300
#   record              = var.dns_zone_name
#   tags                = var.tags
# }

# TXT record for domain verification
resource "azurerm_dns_txt_record" "verification" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  record {
    value = "v=spf1 include:_spf.google.com ~all"
  }

  tags = var.tags
}

# CAA records for SSL certificate issuance
resource "azurerm_dns_caa_record" "letsencrypt" {
  name                = "@"
  zone_name           = azurerm_dns_zone.main.name
  resource_group_name = var.resource_group_name
  ttl                 = 300

  record {
    flags = 0
    tag   = "issue"
    value = "letsencrypt.org"
  }

  record {
    flags = 0
    tag   = "issuewild"
    value = "letsencrypt.org"
  }

  tags = var.tags
}

# MX records for email (if needed)
# resource "azurerm_dns_mx_record" "main" {
#   name                = "@"
#   zone_name           = azurerm_dns_zone.main.name
#   resource_group_name = var.resource_group_name
#   ttl                 = 300
#
#   record {
#     preference = 10
#     exchange   = "mail.applyforus.com"
#   }
#
#   tags = var.tags
# }
