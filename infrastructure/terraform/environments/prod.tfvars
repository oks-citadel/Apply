# ============================================================================
# Terraform Variables - Production Environment
# ============================================================================
# This file contains variable values specific to the production environment.
# Production is optimized for performance, reliability, and security.
#
# Key Characteristics:
# - Premium/Standard SKUs for production workloads
# - AKS cluster enabled with multi-zone deployment
# - Private endpoints for all supported services
# - Application Gateway with WAF in prevention mode
# - Aggressive auto-scaling configuration
# - High availability and disaster recovery
# - Comprehensive security and compliance
# ============================================================================

# ============================================================================
# Core Configuration
# ============================================================================

environment  = "prod"
location     = "eastus"
project_name = "jobpilot"

# ============================================================================
# Resource Tagging
# ============================================================================

tags = {
  Environment        = "Production"
  Project            = "JobPilot"
  ManagedBy          = "Terraform"
  CostCenter         = "Engineering"
  Owner              = "Platform Team"
  Purpose            = "Production Workloads"
  CriticalityLevel   = "High"
  DataClassification = "Confidential"
  DisasterRecovery   = "Required"
  Compliance         = "Required"
}

# ============================================================================
# Security and Compliance
# ============================================================================

# Defender enabled for advanced threat protection
enable_defender = true

# Diagnostics enabled for compliance and monitoring
enable_diagnostics = true

# Private endpoints enabled for secure networking
enable_private_endpoints = true

# Restricted access from approved IP ranges only
# Replace with your actual production IP addresses
allowed_ip_addresses = [
  # "1.2.3.4/32",      # Corporate Office
  # "5.6.7.8/32",      # VPN Gateway
  # "9.10.11.12/32",   # CI/CD System
  # "13.14.15.16/32",  # Monitoring System
]

# ============================================================================
# Load Balancing and WAF
# ============================================================================

# Application Gateway enabled with WAF
enable_application_gateway = true

# Front Door disabled (using App Gateway)
enable_front_door = false

# WAF mode set to prevention for active protection
waf_mode = "Prevention"

# ============================================================================
# Kubernetes Configuration
# ============================================================================

# AKS enabled in production for container orchestration
enable_aks = true

# Kubernetes version (stable production release)
aks_kubernetes_version = "1.28.3"

# ============================================================================
# Monitoring and Observability
# ============================================================================

# Adaptive sampling in production to balance cost and visibility
# 10% sampling for high-volume production traffic
app_insights_sampling_percentage = 10

# ============================================================================
# Networking Configuration
# ============================================================================

# Virtual network address space for production
# Using /16 for large address space
vnet_address_space = ["10.2.0.0/16"]

# ============================================================================
# Auto-scaling Configuration
# ============================================================================

# Auto-scaling enabled in production
enable_auto_scaling = true

# Minimum replicas for high availability
min_replicas = 3

# Maximum replicas for peak load handling
max_replicas = 10

# ============================================================================
# Database Configuration
# ============================================================================
# Note: SQL admin credentials should be provided via:
# - Azure DevOps pipeline variables (recommended)
# - Environment variables (TF_VAR_sql_admin_username, TF_VAR_sql_admin_password)
# - Azure Key Vault (for runtime access)
# - NEVER commit credentials to source control
#
# Example pipeline variable names:
# - SQL_ADMIN_USERNAME
# - SQL_ADMIN_PASSWORD_PROD
#
# Security Requirements:
# - Use strong passwords (min 16 characters)
# - Rotate passwords regularly (quarterly)
# - Store in Azure Key Vault
# - Enable Azure AD authentication
# - Audit all access
# ============================================================================

# sql_admin_username is set via pipeline variable
# sql_admin_password is set via pipeline variable

# ============================================================================
# PostgreSQL Private Endpoint Configuration (PRODUCTION)
# ============================================================================
# Enable private endpoints for PostgreSQL to meet security requirements
# Public network access is DISABLED to enforce private connectivity only
# This is a critical security control for production environments

# Enable PostgreSQL private endpoint (REQUIRED for production)
postgresql_enable_private_endpoint = true

# Disable public network access (SECURITY REQUIREMENT)
postgresql_public_network_access_enabled = false

# ============================================================================
# Environment-Specific Notes
# ============================================================================
#
# Production Environment Guidelines:
# 1. Maximize availability and performance
# 2. Implement comprehensive security controls
# 3. Use premium SKUs for production workloads
# 4. Enable all security features (private endpoints, WAF, Defender)
# 5. Configure aggressive auto-scaling for peak loads
# 6. Implement multi-region disaster recovery (future)
# 7. Enable comprehensive monitoring and alerting
# 8. Maintain compliance with security standards
#
# Infrastructure Features:
# - Premium App Service Plan (P1v3 or higher)
# - Premium/Business Critical SQL Database
# - Premium Redis Cache (P1 or higher)
# - Application Gateway v2 with WAF (Premium)
# - AKS cluster with 3+ nodes (multi-zone)
# - Private endpoints for all services
# - Azure Defender for all services
# - Geo-redundant backups
# - Zone redundancy where available
#
# High Availability:
# - Multi-instance deployment (min 3 replicas)
# - Auto-scaling from 3 to 10 instances
# - Zone-redundant services
# - Health probes and auto-recovery
# - Load balancing across availability zones
#
# Security Features:
# - Private endpoints (no public access)
# - WAF in prevention mode
# - Azure Defender enabled
# - Network security groups
# - DDoS protection
# - SSL/TLS everywhere
# - Managed identities for authentication
# - Key Vault for secrets
# - Audit logging enabled
#
# Disaster Recovery:
# - Geo-redundant backups
# - Point-in-time restore
# - Cross-region replication (future)
# - Automated backup retention (35+ days)
# - Disaster recovery plan documented
#
# Compliance:
# - SOC 2 Type II compliance
# - GDPR compliance
# - HIPAA compliance (if required)
# - PCI DSS compliance (if required)
# - Audit trails enabled
# - Data encryption at rest and in transit
#
# Monitoring and Alerting:
# - Application Insights with adaptive sampling
# - Azure Monitor dashboards
# - Alert rules for critical metrics
# - On-call rotation configured
# - Incident response procedures
# - Performance baselines established
#
# Change Management:
# - Manual approval required for all changes
# - Blue-green deployment strategy
# - Canary releases for gradual rollout
# - Automated rollback capabilities
# - Change windows scheduled during low traffic
#
# Cost Management:
# - Reserved instances for cost savings
# - Right-sizing based on usage patterns
# - Regular cost optimization reviews
# - Budget alerts configured
# - Cost allocation tags
#
# Expected Monthly Cost: ~$2,000-3,500 USD
# (Varies based on traffic, storage, and feature usage)
# ============================================================================
