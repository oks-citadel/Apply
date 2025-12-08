# Feature Flags Documentation

## Overview

The JobPilot AI Platform uses a comprehensive feature flag system to control the availability of features across the platform. This allows for:

- Gradual rollout of new features
- A/B testing
- Quick feature toggles without deployment
- User-specific feature access
- Platform-specific controls

## Architecture

### Components

1. **Feature Flags Package** (`packages/feature-flags/`)
   - Core service for flag evaluation
   - Admin service for flag management
   - NestJS decorators and guards
   - Database entity and migrations
   - DTOs and types

2. **Backend Integration**
   - NestJS decorators for route protection
   - Service-level feature checks
   - Admin API for flag management

3. **Frontend Integration**
   - React hooks for feature checking
   - React components for conditional rendering
   - TypeScript types for type safety

4. **Database**
   - PostgreSQL table for flag storage
   - JSONB for user lists
   - Enum types for flag types and status

5. **Caching**
   - In-memory cache for performance
   - Redis support for distributed caching
   - Automatic refresh mechanism

## Feature Flag Types

### 1. Boolean Flags

Simple on/off switches for features.

```typescript
{
  type: FeatureFlagType.BOOLEAN,
  defaultValue: true
}
```

**Use Case**: Basic feature toggles

### 2. Percentage Rollout

Gradually roll out features to a percentage of users using consistent hashing.

```typescript
{
  type: FeatureFlagType.PERCENTAGE,
  rolloutPercentage: 50 // 50% of users
}
```

**Use Case**:
- Canary releases
- A/B testing
- Gradual feature rollout

### 3. User List

Enable/disable features for specific users.

```typescript
{
  type: FeatureFlagType.USER_LIST,
  enabledUserIds: ['user-1', 'user-2'],
  disabledUserIds: ['user-3']
}
```

**Use Case**:
- Beta testing with specific users
- VIP features
- Troubleshooting (disable for problematic users)

## All Feature Flags

### Core Features

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `FEATURE_AUTO_APPLY` | Auto Apply Feature | Enable automated job application functionality | `true` | Enabled |
| `FEATURE_AI_RESUME_BUILDER` | AI Resume Builder | Enable AI-powered resume building and optimization | `true` | Enabled |
| `FEATURE_ANALYTICS_DASHBOARD` | Analytics Dashboard | Enable analytics dashboard for job search insights | `true` | Enabled |
| `FEATURE_CHROME_EXTENSION` | Chrome Extension | Enable Chrome extension for quick-apply features | `false` | Enabled |

### AI Features

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `AI_SUGGESTIONS_ENABLED` | AI Suggestions | Enable AI-powered job suggestions and recommendations | `true` | Enabled |
| `RESUME_OPTIMIZATION_ENABLED` | Resume Optimization | Enable AI-powered resume optimization | `true` | Enabled |
| `SALARY_PREDICTION_ENABLED` | Salary Prediction | Enable AI-powered salary prediction for job listings | `true` | Enabled |

### Platform-Specific Auto-Apply

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `LINKEDIN_AUTO_APPLY_ENABLED` | LinkedIn Auto Apply | Enable auto-apply for LinkedIn job postings | `true` | Enabled |
| `INDEED_AUTO_APPLY_ENABLED` | Indeed Auto Apply | Enable auto-apply for Indeed job postings | `true` | Enabled |
| `GLASSDOOR_AUTO_APPLY_ENABLED` | Glassdoor Auto Apply | Enable auto-apply for Glassdoor job postings | `false` | Enabled |

### System Features

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `EMAIL_NOTIFICATIONS_ENABLED` | Email Notifications | Enable email notifications for application updates | `true` | Enabled |
| `PUSH_NOTIFICATIONS_ENABLED` | Push Notifications | Enable push notifications for real-time updates | `true` | Enabled |
| `ENABLE_VERSION_CONTROL` | Version Control | Enable version control for resumes | `true` | Enabled |
| `ENABLE_ANALYTICS` | Analytics | Enable analytics tracking and reporting | `true` | Enabled |
| `VIRUS_SCAN_ENABLED` | Virus Scanning | Enable virus scanning for uploaded files | `false` | Enabled |
| `AUTO_BACKUP_ENABLED` | Auto Backup | Enable automatic backup of user data | `false` | Enabled |

### Admin Features

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `ADMIN_DASHBOARD_ENABLED` | Admin Dashboard | Enable admin dashboard for platform management | `true` | Enabled |
| `USER_IMPERSONATION_ENABLED` | User Impersonation | Enable user impersonation for admin support | `false` | Disabled |

### Premium Features

| Flag Key | Name | Description | Default | Status |
|----------|------|-------------|---------|--------|
| `PREMIUM_TEMPLATES_ENABLED` | Premium Templates | Enable premium resume templates | `false` | Enabled |
| `ADVANCED_ANALYTICS_ENABLED` | Advanced Analytics | Enable advanced analytics and insights | `false` | Enabled |
| `PRIORITY_SUPPORT_ENABLED` | Priority Support | Enable priority customer support | `false` | Enabled |

## Usage Examples

### Backend (NestJS)

#### Route Protection

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';

@Controller('auto-apply')
@UseGuards(FeatureFlagGuard)
export class AutoApplyController {
  @Get()
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async getSettings() {
    return { message: 'Auto-apply enabled' };
  }

  @Get('linkedin')
  @FeatureFlag(FEATURE_FLAGS.LINKEDIN_AUTO_APPLY)
  async getLinkedInSettings() {
    return { message: 'LinkedIn auto-apply enabled' };
  }
}
```

#### Service-Level Checks

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlagService } from '@jobpilot/feature-flags';

@Injectable()
export class MyService {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async processJob(userId: string, jobId: string) {
    // Check if auto-apply is enabled for this user
    const isEnabled = await this.featureFlagService.isEnabledForUser(
      'FEATURE_AUTO_APPLY',
      userId
    );

    if (!isEnabled) {
      throw new Error('Auto-apply not available for this user');
    }

    // Process job application
  }
}
```

### Frontend (React/Next.js)

#### Using Hooks

```typescript
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

function AutoApplyButton() {
  const { isEnabled, isLoading } = useFeatureFlag(FEATURE_FLAGS.AUTO_APPLY);

  if (isLoading) return <Spinner />;
  if (!isEnabled) return null;

  return <button>Enable Auto Apply</button>;
}
```

#### Using Components

```typescript
import { FeatureFlag } from '@/components/features/FeatureFlag';
import { FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

function Dashboard() {
  return (
    <div>
      <FeatureFlag
        flag={FEATURE_FLAGS.ANALYTICS_DASHBOARD}
        fallback={<div>Analytics coming soon!</div>}
      >
        <AnalyticsDashboard />
      </FeatureFlag>
    </div>
  );
}
```

#### Multiple Flags

```typescript
import { RequireAllFlags } from '@/components/features/FeatureFlag';
import { FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

function PremiumFeatures() {
  return (
    <RequireAllFlags
      flags={[
        FEATURE_FLAGS.PREMIUM_TEMPLATES,
        FEATURE_FLAGS.ADVANCED_ANALYTICS
      ]}
      fallback={<div>Upgrade to access premium features</div>}
    >
      <PremiumDashboard />
    </RequireAllFlags>
  );
}
```

### Python (FastAPI)

```python
from fastapi import Depends, HTTPException
import httpx

async def check_feature_flag(flag_key: str, user_id: str = None):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"http://auth-service:8001/api/features/{flag_key}",
            headers={'X-User-Id': user_id} if user_id else {}
        )
        if response.status_code == 200:
            return response.json().get('enabled', False)
        return False

@router.post("/resume/optimize")
async def optimize_resume(
    resume_data: dict,
    user_id: str = None
):
    if not await check_feature_flag("RESUME_OPTIMIZATION_ENABLED", user_id):
        raise HTTPException(status_code=403, detail="Feature not available")

    # Optimize resume
    return {"status": "optimized"}
```

## Admin Operations

### Creating a New Feature Flag

```bash
POST /api/admin/features
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "key": "NEW_FEATURE_XYZ",
  "name": "New Feature XYZ",
  "description": "Description of the new feature",
  "type": "boolean",
  "status": "enabled",
  "defaultValue": false
}
```

### Enabling a Feature Gradually

```bash
# Start with 10% rollout
POST /api/admin/features/NEW_FEATURE_XYZ/rollout
Content-Type: application/json

{
  "percentage": 10
}

# Increase to 25%
POST /api/admin/features/NEW_FEATURE_XYZ/rollout
{
  "percentage": 25
}

# Increase to 50%
POST /api/admin/features/NEW_FEATURE_XYZ/rollout
{
  "percentage": 50
}

# Full rollout
POST /api/admin/features/NEW_FEATURE_XYZ/rollout
{
  "percentage": 100
}
```

### Beta Testing with Specific Users

```bash
# Add beta testers
POST /api/admin/features/NEW_FEATURE_XYZ/users/enable
Content-Type: application/json

{
  "userIds": [
    "beta-tester-1",
    "beta-tester-2",
    "beta-tester-3"
  ]
}
```

### Handling Issues

```bash
# Disable feature for users experiencing issues
POST /api/admin/features/PROBLEMATIC_FEATURE/users/disable
Content-Type: application/json

{
  "userIds": ["user-with-issue-1", "user-with-issue-2"]
}

# Or disable the feature entirely
POST /api/admin/features/PROBLEMATIC_FEATURE/disable
```

## Best Practices

### 1. Naming Conventions

- Use UPPERCASE_SNAKE_CASE for flag keys
- Use descriptive names
- Add `_ENABLED` suffix for clarity
- Group related flags with prefixes (e.g., `AI_`, `FEATURE_`)

### 2. Default Values

- Set safe defaults (usually `false` for new features)
- Consider impact if flag service is down
- Production features should default to `true`

### 3. Lifecycle Management

1. **Development**: Create flag, set to `false`
2. **Beta**: Enable for specific users
3. **Gradual Rollout**: Use percentage rollout (10% → 25% → 50% → 100%)
4. **Full Release**: Set default to `true`, remove percentage rollout
5. **Deprecation**: Mark as deprecated
6. **Removal**: Remove from code, then database

### 4. Testing

Always test both states:
```typescript
describe('AutoApply', () => {
  it('should work when feature is enabled', async () => {
    // Mock feature flag to return true
  });

  it('should handle when feature is disabled', async () => {
    // Mock feature flag to return false
  });
});
```

### 5. Documentation

- Document each flag's purpose
- Note dependencies between flags
- Track flag creation/removal dates
- Maintain changelog for flag changes

### 6. Monitoring

- Track flag evaluation performance
- Monitor flag usage
- Alert on flag service failures
- Log flag state changes

### 7. Security

- Restrict admin API access
- Audit flag changes
- Don't use flags for security controls
- Validate user permissions separately

## Troubleshooting

### Flag Not Taking Effect

1. **Check Database**: Verify flag exists and has correct status
   ```sql
   SELECT * FROM feature_flags WHERE key = 'FLAG_KEY';
   ```

2. **Check Cache**: Clear cache and refresh
   ```bash
   POST /api/admin/features/refresh/all
   ```

3. **Check User Overrides**: Verify user isn't in disabled list
   ```sql
   SELECT * FROM feature_flags
   WHERE key = 'FLAG_KEY'
   AND disabledUserIds @> '["user-id"]'::jsonb;
   ```

### Performance Issues

1. **Increase Cache TTL**: Reduce database queries
2. **Use Redis**: Enable distributed caching
3. **Reduce Refresh Interval**: Balance freshness vs performance
4. **Index Optimization**: Ensure proper database indexes

### Inconsistent Behavior

1. **Clear All Caches**: Both application and Redis
2. **Check Percentage Rollout**: Same user should get same result
3. **Verify User ID**: Ensure consistent user identification
4. **Check Multiple Servers**: Ensure all instances are synced

## API Reference

### Public Endpoints

```
GET /api/features                          # Get all enabled features for user
GET /api/features/:flagKey                 # Check specific feature
GET /api/features/:flagKey/evaluate        # Get detailed evaluation
```

### Admin Endpoints

```
GET    /api/admin/features                 # Get all flags with stats
GET    /api/admin/features/:flagKey        # Get specific flag
POST   /api/admin/features                 # Create new flag
PUT    /api/admin/features/:flagKey        # Update flag
DELETE /api/admin/features/:flagKey        # Delete flag
POST   /api/admin/features/:flagKey/enable # Enable flag
POST   /api/admin/features/:flagKey/disable # Disable flag
POST   /api/admin/features/:flagKey/rollout # Set percentage
POST   /api/admin/features/:flagKey/users/enable  # Enable for users
POST   /api/admin/features/:flagKey/users/disable # Disable for users
DELETE /api/admin/features/:flagKey/users  # Remove users
POST   /api/admin/features/initialize/defaults # Initialize defaults
POST   /api/admin/features/refresh/all     # Refresh cache
```

## Migration Guide

### Adding Feature Flags to Existing Code

1. **Install Package**
   ```bash
   pnpm add @jobpilot/feature-flags
   ```

2. **Import Module** (Backend)
   ```typescript
   import { FeatureFlagsModule } from '@jobpilot/feature-flags';
   ```

3. **Add Decorator** (Routes)
   ```typescript
   @FeatureFlag('YOUR_FEATURE_FLAG')
   ```

4. **Add Component** (Frontend)
   ```typescript
   <FeatureFlag flag="YOUR_FEATURE_FLAG">
     <YourComponent />
   </FeatureFlag>
   ```

5. **Run Migration**
   ```bash
   npm run migration:run
   ```

6. **Initialize Flags**
   ```bash
   POST /api/admin/features/initialize/defaults
   ```

## Support

For issues or questions:
- Check this documentation
- Review the package README
- Check example files
- Contact the platform team

## Changelog

- **v1.0.0** (2024-12-06)
  - Initial release
  - Boolean, percentage, and user list flags
  - NestJS and React integration
  - Admin API
  - Default flags for all features
