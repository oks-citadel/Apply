# Feature Flags Package

A comprehensive feature flag system for the JobPilot AI Platform that supports boolean flags, percentage rollouts, and user-specific flags.

## Features

- **Boolean Flags**: Simple on/off switches for features
- **Percentage Rollout**: Gradually roll out features to a percentage of users
- **User-Specific Flags**: Enable/disable features for specific users
- **Caching**: Redis-based caching for high performance
- **Real-time Updates**: Automatic cache refresh
- **NestJS Integration**: Decorators and guards for easy route protection
- **React Integration**: Hooks and components for conditional rendering
- **Admin API**: Complete API for managing flags

## Installation

```bash
# Install the package
pnpm add @jobpilot/feature-flags

# Or from workspace
pnpm add @jobpilot/feature-flags --workspace
```

## Quick Start

### NestJS Backend

#### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeatureFlagsModule } from '@jobpilot/feature-flags';
import Redis from 'ioredis';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // Your database config
    }),
    FeatureFlagsModule.forRoot({
      redis: new Redis({
        host: 'localhost',
        port: 6379,
      }),
      isGlobal: true, // Makes the module global
    }),
  ],
})
export class AppModule {}
```

#### 2. Use the Decorator

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';

@Controller('auto-apply')
@UseGuards(FeatureFlagGuard)
export class AutoApplyController {
  @Get()
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async getAutoApplySettings() {
    // This route is only accessible if FEATURE_AUTO_APPLY is enabled
    return { message: 'Auto-apply is enabled!' };
  }

  @Get('linkedin')
  @FeatureFlag(FEATURE_FLAGS.LINKEDIN_AUTO_APPLY)
  async getLinkedInSettings() {
    // Platform-specific feature flag
    return { message: 'LinkedIn auto-apply is enabled!' };
  }
}
```

#### 3. Use the Service

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlagService } from '@jobpilot/feature-flags';

@Injectable()
export class MyService {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async doSomething(userId: string) {
    // Check if feature is enabled
    const isEnabled = await this.featureFlagService.isEnabled(
      'FEATURE_AUTO_APPLY',
      { userId }
    );

    if (!isEnabled) {
      throw new Error('Feature not available');
    }

    // Your logic here
  }

  async checkForUser(userId: string) {
    // Shorthand for user-specific check
    const isEnabled = await this.featureFlagService.isEnabledForUser(
      'FEATURE_AUTO_APPLY',
      userId
    );

    return isEnabled;
  }
}
```

### React Frontend

#### 1. Use the Hook

```typescript
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

function MyComponent() {
  const { isEnabled, isLoading } = useFeatureFlag(FEATURE_FLAGS.AUTO_APPLY);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isEnabled) {
    return <div>Feature not available</div>;
  }

  return <div>Feature is enabled!</div>;
}
```

#### 2. Use the Component

```typescript
import { FeatureFlag, FEATURE_FLAGS } from '@/components/features/FeatureFlag';

function MyPage() {
  return (
    <div>
      <FeatureFlag
        flag={FEATURE_FLAGS.AUTO_APPLY}
        fallback={<div>Feature not available</div>}
        loading={<div>Loading...</div>}
      >
        <AutoApplyFeature />
      </FeatureFlag>
    </div>
  );
}
```

#### 3. Multiple Flags

```typescript
import { RequireAllFlags, RequireAnyFlag } from '@/components/features/FeatureFlag';

// Require ALL flags to be enabled
<RequireAllFlags flags={['FEATURE_AUTO_APPLY', 'LINKEDIN_AUTO_APPLY_ENABLED']}>
  <LinkedInAutoApply />
</RequireAllFlags>

// Require ANY flag to be enabled
<RequireAnyFlag flags={['FEATURE_AUTO_APPLY', 'FEATURE_AI_RESUME_BUILDER']}>
  <PremiumFeatures />
</RequireAnyFlag>
```

## Available Feature Flags

### Core Features
- `FEATURE_AUTO_APPLY` - Enable automated job application functionality
- `FEATURE_AI_RESUME_BUILDER` - Enable AI-powered resume building and optimization
- `FEATURE_ANALYTICS_DASHBOARD` - Enable analytics dashboard for job search insights
- `FEATURE_CHROME_EXTENSION` - Enable Chrome extension for quick-apply features

### AI Features
- `AI_SUGGESTIONS_ENABLED` - Enable AI-powered job suggestions and recommendations
- `RESUME_OPTIMIZATION_ENABLED` - Enable AI-powered resume optimization
- `SALARY_PREDICTION_ENABLED` - Enable AI-powered salary prediction for job listings

### Platform-Specific Auto-Apply
- `LINKEDIN_AUTO_APPLY_ENABLED` - Enable auto-apply for LinkedIn job postings
- `INDEED_AUTO_APPLY_ENABLED` - Enable auto-apply for Indeed job postings
- `GLASSDOOR_AUTO_APPLY_ENABLED` - Enable auto-apply for Glassdoor job postings

### Additional Features
- `EMAIL_NOTIFICATIONS_ENABLED` - Enable email notifications
- `PUSH_NOTIFICATIONS_ENABLED` - Enable push notifications
- `ENABLE_VERSION_CONTROL` - Enable version control for resumes
- `ENABLE_ANALYTICS` - Enable analytics tracking
- `VIRUS_SCAN_ENABLED` - Enable virus scanning for uploaded files
- `AUTO_BACKUP_ENABLED` - Enable automatic backup of user data

### Admin Features
- `ADMIN_DASHBOARD_ENABLED` - Enable admin dashboard
- `USER_IMPERSONATION_ENABLED` - Enable user impersonation for admin support

### Premium Features
- `PREMIUM_TEMPLATES_ENABLED` - Enable premium resume templates
- `ADVANCED_ANALYTICS_ENABLED` - Enable advanced analytics and insights
- `PRIORITY_SUPPORT_ENABLED` - Enable priority customer support

## Admin API

### Get All Features

```bash
GET /api/admin/features
```

### Create a Feature Flag

```bash
POST /api/admin/features
Content-Type: application/json

{
  "key": "NEW_FEATURE",
  "name": "New Feature",
  "description": "Description of the feature",
  "type": "boolean",
  "status": "enabled",
  "defaultValue": true
}
```

### Update a Feature Flag

```bash
PUT /api/admin/features/NEW_FEATURE
Content-Type: application/json

{
  "status": "enabled",
  "defaultValue": true
}
```

### Enable/Disable a Feature

```bash
POST /api/admin/features/NEW_FEATURE/enable
POST /api/admin/features/NEW_FEATURE/disable
```

### Set Percentage Rollout

```bash
POST /api/admin/features/NEW_FEATURE/rollout
Content-Type: application/json

{
  "percentage": 50
}
```

### Enable for Specific Users

```bash
POST /api/admin/features/NEW_FEATURE/users/enable
Content-Type: application/json

{
  "userIds": ["user-id-1", "user-id-2"]
}
```

### Disable for Specific Users

```bash
POST /api/admin/features/NEW_FEATURE/users/disable
Content-Type: application/json

{
  "userIds": ["user-id-1", "user-id-2"]
}
```

### Initialize Default Flags

```bash
POST /api/admin/features/initialize/defaults
```

## Public API

### Get Enabled Features for Current User

```bash
GET /api/features
```

### Check Specific Feature

```bash
GET /api/features/FEATURE_AUTO_APPLY
```

### Get Feature Evaluation Details

```bash
GET /api/features/FEATURE_AUTO_APPLY/evaluate
```

## Advanced Usage

### Multiple Flag Requirements

```typescript
import { RequireAllFlags, RequireAnyFlag } from '@jobpilot/feature-flags';

@Controller('premium')
@UseGuards(FeatureFlagGuard)
export class PremiumController {
  // Require ALL flags
  @Get()
  @RequireAllFlags(['PREMIUM_TEMPLATES_ENABLED', 'ADVANCED_ANALYTICS_ENABLED'])
  async getPremiumFeatures() {
    return { message: 'All premium features enabled' };
  }

  // Require ANY flag
  @Get('any')
  @RequireAnyFlag(['PREMIUM_TEMPLATES_ENABLED', 'ADVANCED_ANALYTICS_ENABLED'])
  async getAnyPremiumFeature() {
    return { message: 'At least one premium feature enabled' };
  }
}
```

### Percentage Rollout

```typescript
// Enable feature for 25% of users
const adminService = new FeatureFlagAdminService();
await adminService.setRolloutPercentage('NEW_FEATURE', 25, 'admin-id');

// The same user will always get the same result
// Uses consistent hashing based on userId + flagKey
```

### User-Specific Overrides

```typescript
const adminService = new FeatureFlagAdminService();

// Enable for specific beta testers
await adminService.enableForUsers(
  'NEW_FEATURE',
  ['user-1', 'user-2'],
  'admin-id'
);

// Disable for specific users (e.g., users with issues)
await adminService.disableForUsers(
  'PROBLEMATIC_FEATURE',
  ['user-3'],
  'admin-id'
);
```

## Database Schema

The package creates a `feature_flags` table with the following structure:

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('boolean', 'percentage', 'user_list'),
  status ENUM('enabled', 'disabled', 'deprecated'),
  defaultValue BOOLEAN DEFAULT FALSE,
  rolloutPercentage INTEGER,
  enabledUserIds JSONB DEFAULT '[]',
  disabledUserIds JSONB DEFAULT '[]',
  metadata JSONB,
  createdBy VARCHAR(255),
  updatedBy VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

## Performance Considerations

- **Caching**: Flags are cached in memory and Redis
- **Refresh Interval**: Cache refreshes every 1 minute by default
- **TTL**: Cache TTL is 5 minutes by default
- **Consistent Hashing**: Percentage rollouts use consistent hashing for deterministic results

## Environment Variables

```env
# Redis Configuration (optional, for distributed caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Migration

Run the migration to create the feature_flags table:

```bash
# Using TypeORM
npm run migration:run

# Or manually run the migration file
packages/feature-flags/src/migrations/1733500000000-CreateFeatureFlagsTable.ts
```

## Best Practices

1. **Use Constants**: Always use the `FEATURE_FLAGS` constant for flag keys
2. **Fail Closed**: If flag evaluation fails, deny access by default
3. **Cache Wisely**: Use appropriate cache TTL based on your needs
4. **Monitor**: Track feature flag usage and performance
5. **Cleanup**: Remove deprecated flags from code and database
6. **Document**: Keep flag descriptions up-to-date
7. **Test**: Test both enabled and disabled states

## Troubleshooting

### Flag Not Working

1. Check if flag exists in database
2. Verify flag status is 'enabled'
3. Check user-specific overrides
4. Clear cache and refresh

### Performance Issues

1. Increase cache TTL
2. Use Redis for distributed caching
3. Reduce refresh interval
4. Monitor database queries

## License

MIT
