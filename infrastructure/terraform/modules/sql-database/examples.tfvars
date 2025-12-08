# SQL Database Module - Example Configurations
# ============================================
# NOTE: This file contains EXAMPLE configurations for reference only.
# Do NOT use this file directly in terraform init/plan/apply.
# Copy the appropriate section to your environment-specific tfvars file.
# ============================================

# ============================================
# DEVELOPMENT ENVIRONMENT EXAMPLE
# ============================================
# Minimal configuration for development
# - Basic SKU (low cost)
# - 7-day retention
# - No advanced security features
# - Public access with IP restrictions
#
# resource_group_name = "rg-jobpilot-dev"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "dev"
# unique_suffix       = "abc123"
#
# sql_admin_username = "sqladmin"
# # sql_admin_password should be passed via environment variable or secure method
#
# azuread_admin_login     = "admin@yourdomain.com"
# azuread_admin_object_id = "00000000-0000-0000-0000-000000000000"
#
# database_sku = "Basic"
# max_size_gb  = 2
#
# allowed_ip_addresses = [
#   "203.0.113.10",  # Developer workstation
#   "203.0.113.20"   # Office IP
# ]
# allow_azure_services = true
#
# enable_defender = false
# subnet_id       = null
# enable_private_endpoint = false
#
# tags = {
#   Environment = "dev"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Engineering"
# }

# ============================================
# STAGING ENVIRONMENT EXAMPLE
# ============================================
# Mid-tier configuration for staging/testing
# - Standard S1 SKU
# - 7-day retention
# - VNet integration
# - Basic security features
#
# resource_group_name = "rg-jobpilot-staging"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "staging"
# unique_suffix       = "def456"
#
# sql_admin_username = "sqladmin"
# # sql_admin_password should be passed via environment variable
#
# azuread_admin_login     = "admin@yourdomain.com"
# azuread_admin_object_id = "00000000-0000-0000-0000-000000000000"
#
# database_sku = "S1"
# max_size_gb  = 10
#
# allowed_ip_addresses = [
#   "203.0.113.0"  # Testing environment
# ]
# allow_azure_services = true
#
# enable_defender = false
# subnet_id       = "/subscriptions/{subscription-id}/resourceGroups/rg-jobpilot-staging/providers/Microsoft.Network/virtualNetworks/vnet-staging/subnets/subnet-database"
# enable_private_endpoint = false
#
# tags = {
#   Environment = "staging"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Engineering"
# }

# ============================================
# PRODUCTION ENVIRONMENT EXAMPLE
# ============================================
# Enterprise-grade configuration
# - Premium SKU (S3 or higher)
# - 35-day short-term retention
# - Long-term retention (weekly, monthly, yearly)
# - Zone redundancy
# - Private endpoint
# - Microsoft Defender enabled
# - Vulnerability assessment
# - Audit logging
#
# resource_group_name = "rg-jobpilot-prod"
# location            = "eastus"
# project_name        = "jobpilot"
# environment         = "prod"
# unique_suffix       = "xyz789"
#
# sql_admin_username = "sqladmin"
# # sql_admin_password should be stored in Azure Key Vault
#
# azuread_admin_login     = "sql-admin@yourdomain.com"
# azuread_admin_object_id = "00000000-0000-0000-0000-000000000000"
#
# database_sku = "S3"  # Or "P1" for Premium
# max_size_gb  = 100
#
# # No public IP access - use private endpoint
# allowed_ip_addresses = []
# allow_azure_services = true
#
# # Security Configuration
# enable_defender = true
# security_alert_emails = [
#   "security@yourdomain.com",
#   "dba@yourdomain.com"
# ]
# # security_storage_endpoint and security_storage_account_key
# # should reference a dedicated storage account for security logs
#
# # Network Configuration
# subnet_id = "/subscriptions/{subscription-id}/resourceGroups/rg-jobpilot-prod/providers/Microsoft.Network/virtualNetworks/vnet-prod/subnets/subnet-database"
# enable_private_endpoint = true
# private_endpoint_subnet_id = "/subscriptions/{subscription-id}/resourceGroups/rg-jobpilot-prod/providers/Microsoft.Network/virtualNetworks/vnet-prod/subnets/subnet-private-endpoints"
#
# tags = {
#   Environment = "prod"
#   Project     = "JobPilot"
#   ManagedBy   = "Terraform"
#   CostCenter  = "Production"
#   Criticality = "High"
#   Compliance  = "Required"
#   BackupPolicy = "Daily"
# }

# ============================================
# NOTES
# ============================================
# 1. Never commit passwords to version control
# 2. Use Azure Key Vault for secrets management
# 3. Use separate storage accounts for security and audit logs
# 4. Configure diagnostic settings to send logs to Log Analytics
# 5. Review and adjust retention policies based on compliance requirements
# 6. Enable geo-replication for production databases if required
# 7. Set up alerts for CPU, DTU, storage, and connection failures
# 8. Implement backup testing procedures
# 9. Document disaster recovery procedures
# 10. Review and update firewall rules regularly
