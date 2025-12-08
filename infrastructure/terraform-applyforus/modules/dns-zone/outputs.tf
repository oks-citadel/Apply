output "dns_zone_id" {
  description = "ID of the DNS zone"
  value       = azurerm_dns_zone.main.id
}

output "dns_zone_name" {
  description = "Name of the DNS zone"
  value       = azurerm_dns_zone.main.name
}

output "dns_zone_nameservers" {
  description = "Nameservers for the DNS zone"
  value       = azurerm_dns_zone.main.name_servers
}
