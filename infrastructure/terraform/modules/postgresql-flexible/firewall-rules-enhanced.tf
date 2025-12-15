# ============================================================================
# Enhanced Firewall Rules for Azure PostgreSQL Flexible Server
# ============================================================================
# This file contains additional firewall rule configurations for IP ranges
# and provides placeholders for common access patterns.
# ============================================================================

# ============================================================================
# Firewall Rules - Allow IP Ranges (Optional)
# ============================================================================
# This resource allows defining IP ranges for more flexible access control.
# Common use cases:
# - AKS node pool IP ranges
# - Office network ranges
# - Data center IP ranges
# - VPN gateway ranges
# ============================================================================

resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ip_ranges" {
  for_each = var.allowed_ip_ranges

  name             = each.key
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = each.value.start_ip
  end_ip_address   = each.value.end_ip
}

# ============================================================================
# PLACEHOLDER: AKS Cluster Egress IPs
# ============================================================================
# Uncomment and configure after deploying AKS cluster
# To get AKS egress IPs:
#   1. Deploy AKS cluster with Standard Load Balancer
#   2. Run: kubectl get svc -n kube-system
#   3. Note the EXTERNAL-IP of the service
#   4. Add to terraform.tfvars:
#      allowed_ip_ranges = {
#        aks_egress = {
#          start_ip = "52.x.x.x"
#          end_ip   = "52.x.x.x"
#        }
#      }
# ============================================================================

# ============================================================================
# PLACEHOLDER: Admin/Monitoring IPs
# ============================================================================
# Example configuration for admin and monitoring access:
#
# In terraform.tfvars, add:
#   allowed_ip_addresses = [
#     "YOUR_ADMIN_IP_1",      # Admin workstation 1
#     "YOUR_ADMIN_IP_2",      # Admin workstation 2
#   ]
#
#   allowed_ip_ranges = {
#     office_network = {
#       start_ip = "YOUR_OFFICE_START_IP"
#       end_ip   = "YOUR_OFFICE_END_IP"
#     }
#     monitoring_tools = {
#       start_ip = "YOUR_MONITORING_START_IP"
#       end_ip   = "YOUR_MONITORING_END_IP"
#     }
#   }
# ============================================================================

# ============================================================================
# PLACEHOLDER: CI/CD Pipeline IPs
# ============================================================================
# For GitHub Actions, Azure DevOps, or other CI/CD tools that need
# database access (e.g., for running migrations):
#
# GitHub Actions IP ranges:
#   https://api.github.com/meta -> "actions" key
#
# Azure DevOps IP ranges:
#   Varies by region, check:
#   https://learn.microsoft.com/en-us/azure/devops/organizations/security/allow-list-ip-url
# ============================================================================
