# ApplyForUs Platform - Identity & Authorization Model

**Generated:** 2025-12-25
**Version:** 1.0.0
**Platform:** ApplyForUs SaaS Platform

---

## Overview

This document describes the identity and authorization model for the ApplyForUs platform. The platform uses Microsoft Entra ID (formerly Azure AD) for identity management, with security groups for tier-based access control.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IDENTITY ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │   Web Client    │     │  Mobile Client  │     │   Admin Portal  │       │
│   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│            │                       │                       │                 │
│            └───────────────────────┼───────────────────────┘                 │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Microsoft Entra ID / B2C                          │   │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │   │
│   │  │  Web App    │  │   API App   │  │ Automation  │                  │   │
│   │  │ Registration│  │ Registration│  │    App      │                  │   │
│   │  └─────────────┘  └─────────────┘  └─────────────┘                  │   │
│   │                                                                      │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │                    Security Groups                            │   │   │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │   │
│   │  │  │Freemium │ │ Starter │ │  Basic  │ │   Pro   │ │Executive│ │   │   │
│   │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │   │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │   │   │
│   │  │  │Verified │ │ Support │ │  Admin  │ │Suspended│             │   │   │
│   │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ JWT + Group Claims                      │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Backend Services                              │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │   Auth    │  │   User    │  │    Job    │  │  Payment  │        │   │
│   │  │  Service  │  │  Service  │  │  Service  │  │  Service  │        │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│   │                                                                      │   │
│   │  Guards: JwtAuthGuard → B2CGroupsGuard → SubscriptionGuard          │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### 1. OAuth 2.0 Authorization Code Flow with PKCE

```
┌──────────┐                              ┌─────────────┐                    ┌──────────┐
│  Client  │                              │  Entra ID   │                    │ Backend  │
└────┬─────┘                              └──────┬──────┘                    └────┬─────┘
     │                                           │                                │
     │ 1. Authorization Request + PKCE           │                                │
     │ ─────────────────────────────────────────>│                                │
     │                                           │                                │
     │ 2. Login Page                             │                                │
     │ <─────────────────────────────────────────│                                │
     │                                           │                                │
     │ 3. User Credentials                       │                                │
     │ ─────────────────────────────────────────>│                                │
     │                                           │                                │
     │ 4. Authorization Code                     │                                │
     │ <─────────────────────────────────────────│                                │
     │                                           │                                │
     │ 5. Token Request (code + verifier)        │                                │
     │ ─────────────────────────────────────────>│                                │
     │                                           │                                │
     │ 6. Access Token + ID Token + Refresh      │                                │
     │ <─────────────────────────────────────────│                                │
     │                                           │                                │
     │ 7. API Request + Access Token             │                                │
     │ ──────────────────────────────────────────────────────────────────────────>│
     │                                           │                                │
     │                                           │    8. Validate Token           │
     │                                           │ <──────────────────────────────│
     │                                           │                                │
     │                                           │    9. Token Valid + Claims     │
     │                                           │ ──────────────────────────────>│
     │                                           │                                │
     │ 10. API Response                          │                                │
     │ <──────────────────────────────────────────────────────────────────────────│
     │                                           │                                │
```

---

## Security Groups

### Subscription Tier Groups (Mutually Exclusive)

| Group Name | Purpose | Members |
|------------|---------|---------|
| `applyforus-freemium-{env}` | Free tier users | All users start here |
| `applyforus-starter-{env}` | Starter tier subscribers | Paid users ($23.99/mo) |
| `applyforus-basic-{env}` | Basic tier subscribers | Paid users ($49.99/mo) |
| `applyforus-professional-{env}` | Professional tier subscribers | Paid users ($89.99/mo) |
| `applyforus-advanced_career-{env}` | Advanced Career tier | Paid users ($149.99/mo) |
| `applyforus-executive_elite-{env}` | Executive Elite tier | Paid users ($299.99/mo) |

### Special Groups (Additive)

| Group Name | Purpose | Behavior |
|------------|---------|----------|
| `applyforus-verified-{env}` | Verified users | Can be in ANY tier + verified |
| `applyforus-support-{env}` | Support staff | Internal employees |
| `applyforus-admin-{env}` | Platform admins | Internal employees |
| `applyforus-super_admin-{env}` | Super admins | Highest privilege |
| `applyforus-suspended-{env}` | Suspended accounts | Removes all access |

---

## Group Membership Rules

### State Transitions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      USER LIFECYCLE STATE MACHINE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│     ┌───────────────┐                                                       │
│     │   New User    │                                                       │
│     │  (No Groups)  │                                                       │
│     └───────┬───────┘                                                       │
│             │ Signup Complete                                               │
│             ▼                                                               │
│     ┌───────────────┐           Purchase           ┌───────────────┐       │
│     │   FREEMIUM    │────────────────────────────▶│    STARTER    │       │
│     │   (Default)   │                              │   ($23.99)    │       │
│     └───────┬───────┘◀───────────────────────────┘└───────┬───────┘       │
│             │         Cancel/Expire                        │                │
│             │                                              │ Upgrade        │
│             │                              ┌───────────────┘                │
│             │                              ▼                                │
│             │                      ┌───────────────┐                       │
│             │ Direct Purchase      │     BASIC     │                       │
│             ├─────────────────────▶│   ($49.99)    │                       │
│             │                      └───────┬───────┘                       │
│             │                              │ Upgrade                        │
│             │                              ▼                                │
│             │                      ┌───────────────┐                       │
│             ├─────────────────────▶│ PROFESSIONAL  │                       │
│             │                      │   ($89.99)    │                       │
│             │                      └───────┬───────┘                       │
│             │                              │ Upgrade                        │
│             │                              ▼                                │
│             │                      ┌───────────────┐                       │
│             ├─────────────────────▶│   ADVANCED    │                       │
│             │                      │   ($149.99)   │                       │
│             │                      └───────┬───────┘                       │
│             │                              │ Upgrade                        │
│             │                              ▼                                │
│             │                      ┌───────────────┐                       │
│             └─────────────────────▶│  EXECUTIVE    │                       │
│                                    │   ($299.99)   │                       │
│                                    └───────────────┘                       │
│                                                                              │
│     ANY STATE                              ▼                                │
│        │              Account Violation    │                                │
│        └──────────────────────────────────▶│                                │
│                                    ┌───────────────┐                       │
│                                    │   SUSPENDED   │                       │
│                                    │  (No Access)  │                       │
│                                    └───────┬───────┘                       │
│                                            │ Restored                       │
│                                            ▼                                │
│                                    ┌───────────────┐                       │
│                                    │Previous Tier  │                       │
│                                    │ or FREEMIUM   │                       │
│                                    └───────────────┘                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Group Sync Actions

| Event | Action |
|-------|--------|
| User Signup | Add to `freemium` |
| Subscription Created | Remove from current tier → Add to new tier |
| Subscription Upgraded | Remove from old tier → Add to new tier |
| Subscription Downgraded | Remove from old tier → Add to new tier |
| Subscription Cancelled | Remove from paid tier → Add to `freemium` |
| Subscription Expired | Remove from paid tier → Add to `freemium` |
| Verification Approved | Add to `verified` (additive) |
| Verification Revoked | Remove from `verified` |
| Account Suspended | Remove from ALL groups → Add to `suspended` |
| Account Restored | Remove from `suspended` → Add to tier group |
| Admin Promotion | Add to `admin` or `super_admin` |
| Admin Demotion | Remove from `admin` and `super_admin` |

---

## Token Claims

### Access Token Claims

```json
{
  "aud": "api://applyforus-api",
  "iss": "https://login.microsoftonline.com/{tenant}/v2.0",
  "iat": 1735123456,
  "exp": 1735127056,
  "oid": "user-object-id",
  "sub": "user-subject-id",
  "email": "user@example.com",
  "name": "John Doe",
  "groups": [
    "group-id-professional",
    "group-id-verified"
  ],
  "roles": [
    "User"
  ],
  "scp": "profile.read profile.write jobs.read jobs.apply"
}
```

### Required Claims for Authorization

| Claim | Type | Purpose |
|-------|------|---------|
| `oid` | string | Azure AD Object ID for Graph API |
| `groups` | string[] | Security group IDs for tier checking |
| `roles` | string[] | App roles for role-based access |
| `scp` | string | OAuth scopes for permission checks |

---

## Authorization Guards

### Guard Execution Order

```
Request
    │
    ▼
┌───────────────────┐
│   JwtAuthGuard    │  Validates JWT signature & expiry
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  B2CGroupsGuard   │  Checks groups, enriches user, checks suspended
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│SubscriptionGuard  │  Checks tier requirements, features, usage limits
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│    Controller     │  Endpoint logic
└───────────────────┘
```

### Guard Usage Examples

```typescript
// Require specific subscription tier
@RequiresTier(SubscriptionTier.PROFESSIONAL)
@Get('analytics/advanced')
async getAdvancedAnalytics() { ... }

// Require specific feature (tier-implied)
@RequiresFeature(FeatureType.AUTO_APPLY_ENABLED)
@Post('applications/auto-apply')
async startAutoApply() { ... }

// Check usage limits
@CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
@Post('applications')
async submitApplication() { ... }

// Require B2C group membership
@RequiresAdmin()
@Get('admin/users')
async getAllUsers() { ... }

// Require verified status
@RequiresVerified()
@Get('verified/perks')
async getVerifiedPerks() { ... }
```

---

## Environment Variables

### Required for Identity

```bash
# Azure AD / B2C Configuration
AZURE_AD_CLIENT_ID=<api-app-client-id>
AZURE_AD_AUDIENCE=api://applyforus-api
AZURE_AD_AUTHORITY=https://login.microsoftonline.com/<tenant-id>/v2.0
AZURE_AD_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0/

# Automation App (for Graph API)
AUTOMATION_CLIENT_ID=<automation-app-client-id>
AUTOMATION_TENANT_ID=<tenant-id>
AUTOMATION_CLIENT_SECRET=<stored-in-keyvault>

# Security Group IDs
GROUP_ID_FREEMIUM=<group-object-id>
GROUP_ID_STARTER=<group-object-id>
GROUP_ID_BASIC=<group-object-id>
GROUP_ID_PROFESSIONAL=<group-object-id>
GROUP_ID_ADVANCED_CAREER=<group-object-id>
GROUP_ID_EXECUTIVE_ELITE=<group-object-id>
GROUP_ID_VERIFIED=<group-object-id>
GROUP_ID_SUPPORT=<group-object-id>
GROUP_ID_ADMIN=<group-object-id>
GROUP_ID_SUPER_ADMIN=<group-object-id>
GROUP_ID_SUSPENDED=<group-object-id>

# Group Sync
ENABLE_GROUP_SYNC=true
```

---

## Group Sync Integration

### Event Flow

```
Payment Service                      Group Sync Service                   Graph API
      │                                      │                                │
      │  subscription.created                │                                │
      │ ────────────────────────────────────>│                                │
      │                                      │                                │
      │                                      │  Get Access Token              │
      │                                      │ ──────────────────────────────>│
      │                                      │                                │
      │                                      │  Token                         │
      │                                      │ <──────────────────────────────│
      │                                      │                                │
      │                                      │  Remove from old tier group    │
      │                                      │ ──────────────────────────────>│
      │                                      │                                │
      │                                      │  Add to new tier group         │
      │                                      │ ──────────────────────────────>│
      │                                      │                                │
      │  success                             │                                │
      │ <────────────────────────────────────│                                │
      │                                      │                                │
```

---

## Troubleshooting

### Common Issues

1. **User not in expected group**
   - Run reconciliation script: `npx ts-node scripts/self-healing/reconcile-groups.ts --user <oid>`
   - Check payment service subscription status
   - Verify Graph API permissions

2. **Groups not appearing in token**
   - Ensure B2C user flow includes group claims
   - Check `groupMembershipClaims` in app manifest
   - Verify user is actually in the group

3. **Suspended user still has access**
   - Check if suspended group check is enabled
   - Verify `GROUP_ID_SUSPENDED` environment variable
   - Run group reconciliation

4. **Graph API permission errors**
   - Verify admin consent granted
   - Check automation app credentials
   - Verify tenant ID is correct

---

## Security Best Practices

1. **Never trust client-provided tier information** - Always derive from group claims
2. **Check suspended status first** - Before any other authorization checks
3. **Use short-lived access tokens** - Default 1 hour, no longer than 2 hours
4. **Rotate automation secrets regularly** - Use Key Vault with auto-rotation
5. **Audit group membership changes** - Log all group sync operations
6. **Monitor for anomalies** - Alert on unusual group membership patterns

---

*Generated by Claude Code for ApplyForUs Platform*
