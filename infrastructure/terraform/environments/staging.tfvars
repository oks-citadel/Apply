# ============================================================================
# Terraform Variables - Staging Environment
# ============================================================================
# This file contains variable values specific to the staging environment.
# Staging mirrors production configuration for realistic testing.
#
# Key Characteristics:
# - Standard SKUs (production-like)
# - AKS cluster enabled for container orchestration
# - Private endpoints for enhanced security
# - Application Gateway with WAF (optional)
# - Moderate auto-scaling configuration
# - Production-grade database and cache
# ============================================================================

# ============================================================================
# Core Configuration
# ============================================================================

environment  = "staging"
location     = "eastus"
project_name = "jobpilot"

# ============================================================================
# Resource Tagging
# ============================================================================

tags = {
  Environment = "Staging"
  Project     = "JobPilot"
  ManagedBy   = "Terraform"
  CostCenter  = "Engineering"
  Owner       = "DevOps Team"
  Purpose     = "Pre-Production Testing"
}

# ============================================================================
# Security and Compliance
# ============================================================================

# Defender enabled for security monitoring
enable_defender = true

# Diagnostics enabled for monitoring
enable_diagnostics = true

# Private endpoints enabled for secure networking
enable_private_endpoints = false

# Allow access from office/VPN IP ranges
allowed_ip_addresses = [
  # "1.2.3.4/32",      # Office IP
  # "5.6.7.8/32",      # VPN IP
]

# ============================================================================
# Load Balancing and WAF
# ============================================================================

# Application Gateway enabled for WAF testing
enable_application_gateway = true

# Front Door disabled (use App Gateway instead)
enable_front_door = false

# WAF mode set to detection for testing
waf_mode = "Detection"

# ============================================================================
# Kubernetes Configuration
# ============================================================================

# AKS enabled in staging for production-like testing
enable_aks = true

# Kubernetes version (stable release)
aks_kubernetes_version = "1.28.3"

# ============================================================================
# Monitoring and Observability
# ============================================================================

# High sampling in staging for comprehensive monitoring
app_insights_sampling_percentage = 100

# ============================================================================
# Networking Configuration
# ============================================================================

# Virtual network address space for staging
vnet_address_space = ["10.1.0.0/16"]

# ============================================================================
# Auto-scaling Configuration
# ============================================================================

# Auto-scaling enabled in staging
enable_auto_scaling = true

# Minimum replicas for staging
min_replicas = 2

# Maximum replicas for staging
max_replicas = 5

# ============================================================================
# Database Configuration
# ============================================================================
# Note: SQL admin credentials should be provided via:
# - Azure DevOps pipeline variables (recommended)
# - Environment variables (TF_VAR_sql_admin_username, TF_VAR_sql_admin_password)
# - NEVER commit credentials to source control
#
# Example pipeline variable names:
# - SQL_ADMIN_USERNAME
# - SQL_ADMIN_PASSWORD_STAGING
# ============================================================================

# sql_admin_username is set via pipeline variable
# sql_admin_password is set via pipeline variable

# ============================================================================
# PostgreSQL Private Endpoint Configuration (STAGING)
# ============================================================================
# Enable private endpoints for PostgreSQL to enhance security
# Public network access is disabled to enforce private connectivity only

# Enable PostgreSQL private endpoint
postgresql_enable_private_endpoint = true

# Disable public network access (security best practice)
postgresql_public_network_access_enabled = false

# ============================================================================
# Environment-Specific Notes
# ============================================================================
#
# Staging Environment Guidelines:
# 1. Mirror production configuration as closely as possible
# 2. Test all production features (AKS, WAF, private endpoints)
# 3. Use standard SKUs for realistic performance
# 4. Moderate auto-scaling for load testing
# 5. Enable comprehensive monitoring and alerting
# 6. Test deployment processes and disaster recovery
# 7. Validate security configurations
#
# Infrastructure Features:
# - Standard App Service Plan (S1 or S2)
# - Standard SQL Database (S2 or S3)
# - Standard Redis Cache (C1 or C2)
# - Application Gateway with WAF v2
# - AKS cluster with 2-4 nodes
# - Private endpoints for key services
# - Azure Defender enabled
#
# Use Cases:
# - Integration testing
# - Performance testing
# - Security testing
# - UAT (User Acceptance Testing)
# - Pre-production validation
# - Deployment rehearsal
#
# Expected Monthly Cost: ~$600-800 USD
# ============================================================================
