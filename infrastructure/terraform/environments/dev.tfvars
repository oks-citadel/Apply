# ============================================================================
# Terraform Variables - Development Environment
# ============================================================================
# This file contains variable values specific to the development environment.
# Development is optimized for cost and rapid iteration.
#
# Key Characteristics:
# - Basic/Free SKUs where possible
# - No private endpoints (simplified networking)
# - No AKS cluster (use App Services only)
# - No Application Gateway/WAF
# - Reduced auto-scaling limits
# - Development-grade database and cache
# ============================================================================

# ============================================================================
# Core Configuration
# ============================================================================

environment  = "dev"
location     = "eastus"
project_name = "jobpilot"

# ============================================================================
# Resource Tagging
# ============================================================================

tags = {
  Environment = "Development"
  Project     = "JobPilot"
  ManagedBy   = "Terraform"
  CostCenter  = "Engineering"
  Owner       = "DevOps Team"
  Purpose     = "Development and Testing"
}

# ============================================================================
# Security and Compliance
# ============================================================================

# Defender disabled in dev to reduce costs
enable_defender = false

# Diagnostics enabled for debugging
enable_diagnostics = true

# Private endpoints disabled for simplified networking
enable_private_endpoints = false

# Allow access from office/VPN IP ranges
# Replace with your actual IP addresses
allowed_ip_addresses = [
  # "1.2.3.4/32",      # Office IP
  # "5.6.7.8/32",      # VPN IP
  # "0.0.0.0/0",       # Allow all (NOT recommended, use specific IPs)
]

# ============================================================================
# Load Balancing and WAF
# ============================================================================

# Application Gateway disabled in dev
enable_application_gateway = false

# Front Door disabled in dev
enable_front_door = false

# WAF mode set to detection (not prevention)
waf_mode = "Detection"

# ============================================================================
# Kubernetes Configuration
# ============================================================================

# AKS disabled in dev to reduce costs
# Use App Services for hosting instead
enable_aks = false

# Kubernetes version (if AKS is enabled)
aks_kubernetes_version = "1.28.3"

# ============================================================================
# Monitoring and Observability
# ============================================================================

# Full sampling in dev for complete telemetry
app_insights_sampling_percentage = 100

# ============================================================================
# Networking Configuration
# ============================================================================

# Virtual network address space for dev
vnet_address_space = ["10.0.0.0/16"]

# ============================================================================
# Auto-scaling Configuration
# ============================================================================

# Auto-scaling disabled in dev (single instance)
enable_auto_scaling = false

# Minimum replicas for dev
min_replicas = 1

# Maximum replicas for dev
max_replicas = 2

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
# - SQL_ADMIN_PASSWORD_DEV
# ============================================================================

# sql_admin_username is set via pipeline variable
# sql_admin_password is set via pipeline variable

# ============================================================================
# Environment-Specific Notes
# ============================================================================
#
# Development Environment Guidelines:
# 1. Focus on rapid iteration and testing
# 2. Minimize costs by using basic SKUs
# 3. Simplified networking without private endpoints
# 4. Use App Services instead of AKS
# 5. Enable comprehensive logging for debugging
# 6. Use single instances (no auto-scaling)
# 7. Short retention periods for logs and backups
#
# Cost Optimization:
# - Basic App Service Plan (B1)
# - Basic SQL Database (S0)
# - Basic Redis Cache (C0)
# - No Application Gateway
# - No AKS cluster
# - No private endpoints
#
# Expected Monthly Cost: ~$150-200 USD
# ============================================================================
