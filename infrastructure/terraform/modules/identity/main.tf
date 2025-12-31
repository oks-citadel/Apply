# ============================================================================
# IDENTITY MODULE - ApplyForUs SaaS Platform
# Microsoft Entra ID B2C Configuration
# ============================================================================
# This module manages:
# - App Registrations (Web, API, Automation)
# - Security Groups for Subscription Tiers
# - OAuth 2.0 Scopes and Permissions
# - Graph API Configuration
# ============================================================================

terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

# Get current Azure AD client configuration
data "azuread_client_config" "current" {}

# Microsoft Graph Service Principal (for API permissions)
data "azuread_service_principal" "msgraph" {
  count        = var.enable_graph_permissions ? 1 : 0
  client_id    = "00000003-0000-0000-c000-000000000000" # Microsoft Graph
}

# ============================================================================
# RANDOM UUIDs FOR OAUTH2 SCOPES
# ============================================================================

resource "random_uuid" "user_impersonation" {}
resource "random_uuid" "profile_read" {}
resource "random_uuid" "profile_write" {}
resource "random_uuid" "jobs_read" {}
resource "random_uuid" "jobs_apply" {}
resource "random_uuid" "resume_manage" {}
resource "random_uuid" "subscription_manage" {}

# Random UUIDs for app roles
resource "random_uuid" "role_user" {}
resource "random_uuid" "role_verified" {}
resource "random_uuid" "role_support" {}
resource "random_uuid" "role_admin" {}
resource "random_uuid" "role_super_admin" {}

# Random UUIDs for subscription tier roles
resource "random_uuid" "tier_roles" {
  count = length(var.subscription_tiers)
}

# ============================================================================
# APP REGISTRATION: WEB/MOBILE CLIENT
# ============================================================================

resource "azuread_application" "web" {
  display_name     = "${var.project_name}-web-${var.environment}"
  sign_in_audience = var.sign_in_audience

  # Application identifier
  identifier_uris = var.environment == "prod" ? ["https://${var.domain_name}"] : []

  # Web application configuration
  web {
    homepage_url  = var.web_homepage_url
    logout_url    = var.web_logout_url
    redirect_uris = var.web_redirect_uris

    implicit_grant {
      access_token_issuance_enabled = false
      id_token_issuance_enabled     = true
    }
  }

  # Single Page Application (SPA) configuration
  single_page_application {
    redirect_uris = var.spa_redirect_uris
  }

  # Mobile/Native application configuration
  public_client {
    redirect_uris = var.mobile_redirect_uris
  }

  # API configuration
  api {
    requested_access_token_version = 2
  }

  # Required API access - to our own API
  required_resource_access {
    resource_app_id = azuread_application.api.client_id

    resource_access {
      id   = random_uuid.user_impersonation.result
      type = "Scope"
    }
    resource_access {
      id   = random_uuid.profile_read.result
      type = "Scope"
    }
    resource_access {
      id   = random_uuid.jobs_read.result
      type = "Scope"
    }
  }

  # Optional claims for tokens
  optional_claims {
    id_token {
      name                  = "email"
      essential             = true
    }
    id_token {
      name                  = "given_name"
      essential             = false
    }
    id_token {
      name                  = "family_name"
      essential             = false
    }

    access_token {
      name                  = "email"
      essential             = true
    }
  }

  tags = concat(
    [var.environment, var.project_name, "consumer-app", "web-client"],
    var.additional_tags
  )

  lifecycle {
    ignore_changes = [
      # Ignore changes to redirect URIs that may be managed outside Terraform
      web[0].redirect_uris,
      single_page_application[0].redirect_uris,
    ]
  }
}

resource "azuread_application_password" "web" {
  count                 = var.create_client_secrets ? 1 : 0
  application_id        = azuread_application.web.id
  display_name          = "web-client-secret-${var.environment}"
  end_date_relative     = var.client_secret_expiry
}

# ============================================================================
# APP REGISTRATION: BACKEND API
# ============================================================================

resource "azuread_application" "api" {
  display_name     = "${var.project_name}-api-${var.environment}"
  identifier_uris  = [var.api_identifier_uri]
  sign_in_audience = var.sign_in_audience

  # API configuration with OAuth2 scopes
  api {
    requested_access_token_version = 2

    # Main user impersonation scope
    oauth2_permission_scope {
      admin_consent_description  = "Allow the application to access ${var.project_display_name} API on behalf of the signed-in user"
      admin_consent_display_name = "Access ${var.project_display_name} API"
      enabled                    = true
      id                         = random_uuid.user_impersonation.result
      type                       = "User"
      user_consent_description   = "Allow access to ${var.project_display_name}"
      user_consent_display_name  = "Access ${var.project_display_name}"
      value                      = "user_impersonation"
    }

    # Profile read scope
    oauth2_permission_scope {
      admin_consent_description  = "Read user profile information"
      admin_consent_display_name = "Read Profile"
      enabled                    = true
      id                         = random_uuid.profile_read.result
      type                       = "User"
      user_consent_description   = "Read your profile"
      user_consent_display_name  = "Read Profile"
      value                      = "profile.read"
    }

    # Profile write scope
    oauth2_permission_scope {
      admin_consent_description  = "Update user profile information"
      admin_consent_display_name = "Write Profile"
      enabled                    = true
      id                         = random_uuid.profile_write.result
      type                       = "User"
      user_consent_description   = "Update your profile"
      user_consent_display_name  = "Update Profile"
      value                      = "profile.write"
    }

    # Jobs read scope
    oauth2_permission_scope {
      admin_consent_description  = "Read job listings and saved jobs"
      admin_consent_display_name = "Read Jobs"
      enabled                    = true
      id                         = random_uuid.jobs_read.result
      type                       = "User"
      user_consent_description   = "View job listings"
      user_consent_display_name  = "View Jobs"
      value                      = "jobs.read"
    }

    # Jobs apply scope
    oauth2_permission_scope {
      admin_consent_description  = "Apply to jobs on behalf of user"
      admin_consent_display_name = "Apply to Jobs"
      enabled                    = true
      id                         = random_uuid.jobs_apply.result
      type                       = "User"
      user_consent_description   = "Apply to jobs for you"
      user_consent_display_name  = "Apply to Jobs"
      value                      = "jobs.apply"
    }

    # Resume management scope
    oauth2_permission_scope {
      admin_consent_description  = "Manage user resumes and cover letters"
      admin_consent_display_name = "Manage Resumes"
      enabled                    = true
      id                         = random_uuid.resume_manage.result
      type                       = "User"
      user_consent_description   = "Manage your resumes"
      user_consent_display_name  = "Manage Resumes"
      value                      = "resume.manage"
    }

    # Subscription management scope
    oauth2_permission_scope {
      admin_consent_description  = "Manage user subscription and billing"
      admin_consent_display_name = "Manage Subscription"
      enabled                    = true
      id                         = random_uuid.subscription_manage.result
      type                       = "User"
      user_consent_description   = "Manage your subscription"
      user_consent_display_name  = "Manage Subscription"
      value                      = "subscription.manage"
    }
  }

  # App roles for authorization
  app_role {
    allowed_member_types = ["User"]
    description          = "Standard user with basic access"
    display_name         = "User"
    enabled              = true
    id                   = random_uuid.role_user.result
    value                = "User"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Verified user with enhanced trust"
    display_name         = "Verified User"
    enabled              = true
    id                   = random_uuid.role_verified.result
    value                = "User.Verified"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Customer support staff"
    display_name         = "Support"
    enabled              = true
    id                   = random_uuid.role_support.result
    value                = "Support"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Platform administrator"
    display_name         = "Administrator"
    enabled              = true
    id                   = random_uuid.role_admin.result
    value                = "Admin"
  }

  app_role {
    allowed_member_types = ["User"]
    description          = "Super administrator with full access"
    display_name         = "Super Administrator"
    enabled              = true
    id                   = random_uuid.role_super_admin.result
    value                = "SuperAdmin"
  }

  # Dynamic app roles for subscription tiers
  dynamic "app_role" {
    for_each = { for idx, tier in var.subscription_tiers : tier => idx }
    content {
      allowed_member_types = ["User"]
      description          = "${title(app_role.key)} subscription tier user"
      display_name         = "${title(app_role.key)} Tier"
      enabled              = true
      id                   = random_uuid.tier_roles[app_role.value].result
      value                = "Tier.${title(app_role.key)}"
    }
  }

  # Group membership claims
  group_membership_claims = var.enable_group_claims ? ["SecurityGroup"] : null

  # Optional claims for tokens
  optional_claims {
    access_token {
      name                  = "groups"
      essential             = var.enable_group_claims
      additional_properties = var.enable_group_claims ? ["emit_as_roles"] : []
    }

    access_token {
      name                  = "email"
      essential             = true
    }

    id_token {
      name                  = "groups"
      essential             = var.enable_group_claims
      additional_properties = var.enable_group_claims ? ["emit_as_roles"] : []
    }

    id_token {
      name                  = "email"
      essential             = true
    }
  }

  tags = concat(
    [var.environment, var.project_name, "api", "backend"],
    var.additional_tags
  )
}

resource "azuread_service_principal" "api" {
  client_id                    = azuread_application.api.client_id
  app_role_assignment_required = false

  tags = [var.environment, var.project_name, "api"]
}

# ============================================================================
# APP REGISTRATION: AUTOMATION (Graph API Access)
# ============================================================================

resource "azuread_application" "automation" {
  display_name = "${var.project_name}-automation-${var.environment}"

  # Only allow organization accounts for automation app
  sign_in_audience = "AzureADMyOrg"

  # Required Graph API permissions
  dynamic "required_resource_access" {
    for_each = var.enable_graph_permissions ? [1] : []
    content {
      resource_app_id = "00000003-0000-0000-c000-000000000000" # Microsoft Graph

      # User.Read.All - Read all users' full profiles
      resource_access {
        id   = "df021288-bdef-4463-88db-98f22de89214"
        type = "Role"
      }

      # Group.ReadWrite.All - Read and write all groups
      resource_access {
        id   = "62a82d76-70ea-41e2-9197-370581804d09"
        type = "Role"
      }

      # GroupMember.ReadWrite.All - Read and write group memberships
      resource_access {
        id   = "dbaae8cf-10b5-4b86-a4a1-f871c94c6695"
        type = "Role"
      }

      # Directory.ReadWrite.All - Read and write directory data
      resource_access {
        id   = "19dbc75e-c2e2-444c-a770-ec69d8559fc7"
        type = "Role"
      }

      # AuditLog.Read.All - Read audit log data
      resource_access {
        id   = "b0afded3-3588-46d8-8b3d-9842eff778da"
        type = "Role"
      }
    }
  }

  tags = concat(
    [var.environment, var.project_name, "automation", "internal-only", "graph-api"],
    var.additional_tags
  )
}

resource "azuread_service_principal" "automation" {
  client_id                    = azuread_application.automation.client_id
  app_role_assignment_required = false

  tags = [var.environment, var.project_name, "automation"]
}

resource "azuread_application_password" "automation" {
  application_id    = azuread_application.automation.id
  display_name      = "automation-secret-${var.environment}"
  end_date_relative = var.automation_secret_expiry
}

# ============================================================================
# SECURITY GROUPS - SUBSCRIPTION TIERS
# ============================================================================

resource "azuread_group" "subscription_tiers" {
  for_each = var.create_security_groups ? toset(var.subscription_tiers) : []

  display_name     = "${var.project_name}-${lower(each.key)}-${var.environment}"
  description      = "${var.project_display_name} ${title(each.key)} tier users"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  # Dynamic membership rules (optional - for Azure AD P1/P2)
  # Uncomment if you have Azure AD P1/P2 license
  # dynamic "dynamic_membership" {
  #   for_each = var.enable_dynamic_membership ? [1] : []
  #   content {
  #     enabled = true
  #     rule    = "(user.extension_subscriptionTier -eq \"${upper(each.key)}\")"
  #   }
  # }

  lifecycle {
    ignore_changes = [
      members, # Members managed by automation
    ]
  }
}

# ============================================================================
# SECURITY GROUPS - SPECIAL GROUPS
# ============================================================================

# Verified users group
resource "azuread_group" "verified" {
  count = var.create_security_groups ? 1 : 0

  display_name     = "${var.project_name}-verified-${var.environment}"
  description      = "${var.project_display_name} Verified users with enhanced trust"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# Support staff group
resource "azuread_group" "support" {
  count = var.create_security_groups ? 1 : 0

  display_name     = "${var.project_name}-support-${var.environment}"
  description      = "${var.project_display_name} Customer support staff (internal only)"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# Admin group
resource "azuread_group" "admin" {
  count = var.create_security_groups ? 1 : 0

  display_name     = "${var.project_name}-admin-${var.environment}"
  description      = "${var.project_display_name} Platform administrators (internal only)"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# Super admin group
resource "azuread_group" "super_admin" {
  count = var.create_security_groups ? 1 : 0

  display_name     = "${var.project_name}-super-admin-${var.environment}"
  description      = "${var.project_display_name} Super administrators with full access"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# Suspended users group
resource "azuread_group" "suspended" {
  count = var.create_security_groups ? 1 : 0

  display_name     = "${var.project_name}-suspended-${var.environment}"
  description      = "${var.project_display_name} Suspended users with revoked access"
  security_enabled = true
  mail_enabled     = false

  prevent_duplicate_names = true

  lifecycle {
    ignore_changes = [members]
  }
}

# ============================================================================
# ADMIN CONSENT FOR GRAPH PERMISSIONS (Optional)
# ============================================================================

# Grant admin consent for automation app Graph permissions
resource "azuread_app_role_assignment" "automation_user_read" {
  count               = var.enable_graph_permissions && var.grant_admin_consent ? 1 : 0
  app_role_id         = "df021288-bdef-4463-88db-98f22de89214" # User.Read.All
  principal_object_id = azuread_service_principal.automation.object_id
  resource_object_id  = data.azuread_service_principal.msgraph[0].object_id
}

resource "azuread_app_role_assignment" "automation_group_readwrite" {
  count               = var.enable_graph_permissions && var.grant_admin_consent ? 1 : 0
  app_role_id         = "62a82d76-70ea-41e2-9197-370581804d09" # Group.ReadWrite.All
  principal_object_id = azuread_service_principal.automation.object_id
  resource_object_id  = data.azuread_service_principal.msgraph[0].object_id
}

resource "azuread_app_role_assignment" "automation_groupmember_readwrite" {
  count               = var.enable_graph_permissions && var.grant_admin_consent ? 1 : 0
  app_role_id         = "dbaae8cf-10b5-4b86-a4a1-f871c94c6695" # GroupMember.ReadWrite.All
  principal_object_id = azuread_service_principal.automation.object_id
  resource_object_id  = data.azuread_service_principal.msgraph[0].object_id
}

resource "azuread_app_role_assignment" "automation_directory_readwrite" {
  count               = var.enable_graph_permissions && var.grant_admin_consent ? 1 : 0
  app_role_id         = "19dbc75e-c2e2-444c-a770-ec69d8559fc7" # Directory.ReadWrite.All
  principal_object_id = azuread_service_principal.automation.object_id
  resource_object_id  = data.azuread_service_principal.msgraph[0].object_id
}

# ============================================================================
# PRE-AUTHORIZED CLIENT APPLICATIONS
# ============================================================================

# Pre-authorize web app to access API without consent prompt
resource "azuread_application_pre_authorized" "web_to_api" {
  application_id       = azuread_application.api.id
  authorized_client_id = azuread_application.web.client_id

  permission_ids = [
    random_uuid.user_impersonation.result,
    random_uuid.profile_read.result,
    random_uuid.jobs_read.result,
  ]
}
