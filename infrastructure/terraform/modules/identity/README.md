# Identity Module - ApplyForUs SaaS Platform

This Terraform module manages Microsoft Entra ID (Azure AD) / B2C identity configuration for the ApplyForUs platform.

## Features

- **App Registrations**
  - Web/Mobile Client Application
  - Backend API Application with OAuth2 scopes
  - Automation Application for Graph API access

- **Security Groups**
  - Subscription tier groups (Freemium, Starter, Basic, Pro, Advanced, Executive)
  - Special groups (Verified, Support, Admin, Super Admin, Suspended)

- **OAuth2 Scopes**
  - User impersonation
  - Profile read/write
  - Jobs read/apply
  - Resume management
  - Subscription management

- **App Roles**
  - User, Verified, Support, Admin, Super Admin
  - Dynamic tier-based roles

## Usage

```hcl
module "identity" {
  source = "./modules/identity"

  project_name         = "applyforus"
  project_display_name = "ApplyForUs"
  environment          = "prod"
  domain_name          = "applyforus.com"

  # API configuration
  api_identifier_uri = "api://applyforus-api"

  # Redirect URIs
  web_redirect_uris = [
    "https://applyforus.com/auth/callback",
  ]
  spa_redirect_uris = [
    "https://applyforus.com",
    "http://localhost:3000",
  ]
  mobile_redirect_uris = [
    "applyforus://auth/callback",
  ]

  # Subscription tiers
  subscription_tiers = [
    "freemium",
    "starter",
    "basic",
    "professional",
    "advanced_career",
    "executive_elite"
  ]

  # Security groups
  create_security_groups = true

  # Graph API permissions
  enable_graph_permissions = true
  grant_admin_consent      = false  # Set to true to auto-grant

  # B2C configuration (optional)
  b2c_tenant_name = "applyforusb2c"
  b2c_tenant_id   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

## Outputs

| Output | Description |
|--------|-------------|
| `web_app_client_id` | Client ID for web/mobile app |
| `api_app_client_id` | Client ID for API |
| `automation_app_client_id` | Client ID for automation |
| `automation_app_secret` | Secret for automation app (sensitive) |
| `subscription_tier_group_ids` | Map of tier name to group ID |
| `special_group_ids` | Map of special group IDs |
| `backend_config` | Configuration for backend services |
| `environment_variables` | Environment variables template |

## Security Groups

### Subscription Tiers (Mutually Exclusive)

| Group | Description |
|-------|-------------|
| `applyforus-freemium-{env}` | Free tier users (default) |
| `applyforus-starter-{env}` | Starter tier users |
| `applyforus-basic-{env}` | Basic tier users |
| `applyforus-professional-{env}` | Professional tier users |
| `applyforus-advanced_career-{env}` | Advanced Career tier users |
| `applyforus-executive_elite-{env}` | Executive Elite tier users |

### Special Groups

| Group | Description |
|-------|-------------|
| `applyforus-verified-{env}` | Verified users (additive) |
| `applyforus-support-{env}` | Support staff (internal) |
| `applyforus-admin-{env}` | Platform admins (internal) |
| `applyforus-super-admin-{env}` | Super admins (internal) |
| `applyforus-suspended-{env}` | Suspended users (no access) |

## Group Assignment Rules

| Event | Action |
|-------|--------|
| User Signup | Add to `freemium` |
| Pro Purchase | Remove from current tier, add to `professional` |
| Subscription Cancel | Remove from paid tier, add to `freemium` |
| Verification Approved | Add to `verified` |
| Account Suspended | Remove from all groups, add to `suspended` |

## Backend Integration

The module outputs configuration that can be used in your NestJS services:

```typescript
// Environment variables from Terraform outputs
const config = {
  authority: process.env.AZURE_AD_AUTHORITY,
  clientId: process.env.AZURE_AD_CLIENT_ID,
  audience: process.env.AZURE_AD_AUDIENCE,

  groups: {
    freemium: process.env.GROUP_ID_FREEMIUM,
    professional: process.env.GROUP_ID_PROFESSIONAL,
    suspended: process.env.GROUP_ID_SUSPENDED,
    // ...
  }
};
```

## Requirements

| Name | Version |
|------|---------|
| terraform | >= 1.5.0 |
| azuread | ~> 2.47 |
| random | ~> 3.0 |

## Providers

| Name | Version |
|------|---------|
| azuread | ~> 2.47 |
| random | ~> 3.0 |

## Notes

1. **Admin Consent**: Set `grant_admin_consent = true` only after reviewing the permissions. This requires Global Administrator privileges.

2. **B2C vs Azure AD**: For consumer-facing apps, configure B2C tenant. For internal apps, use standard Azure AD.

3. **Secret Management**: Client secrets are created with expiry dates. Store them in Azure Key Vault.

4. **Group Membership**: Groups are created empty. Use the automation app and Graph API to manage membership.
