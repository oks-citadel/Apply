# Feature Flags Quick Reference

Quick reference for using the feature flag system in the JobPilot AI Platform.

## Flag Keys Reference

```typescript
// Core Features
FEATURE_AUTO_APPLY
FEATURE_AI_RESUME_BUILDER
FEATURE_ANALYTICS_DASHBOARD
FEATURE_CHROME_EXTENSION

// AI Features
AI_SUGGESTIONS_ENABLED
RESUME_OPTIMIZATION_ENABLED
SALARY_PREDICTION_ENABLED

// Platform Auto-Apply
LINKEDIN_AUTO_APPLY_ENABLED
INDEED_AUTO_APPLY_ENABLED
GLASSDOOR_AUTO_APPLY_ENABLED

// System
EMAIL_NOTIFICATIONS_ENABLED
PUSH_NOTIFICATIONS_ENABLED
ENABLE_VERSION_CONTROL
ENABLE_ANALYTICS

// Admin
ADMIN_DASHBOARD_ENABLED
USER_IMPERSONATION_ENABLED

// Premium
PREMIUM_TEMPLATES_ENABLED
ADVANCED_ANALYTICS_ENABLED
PRIORITY_SUPPORT_ENABLED
```

## Backend (NestJS)

### Import

```typescript
import {
  FeatureFlag,
  FeatureFlagGuard,
  FeatureFlagService,
  FEATURE_FLAGS,
} from '@jobpilot/feature-flags';
```

### Route Protection

```typescript
@Controller('api')
@UseGuards(FeatureFlagGuard)
export class MyController {
  @Get('feature')
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async myRoute() {
    // Protected by feature flag
  }
}
```

### Service Usage

```typescript
@Injectable()
export class MyService {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  async check(userId: string) {
    const isEnabled = await this.featureFlagService.isEnabledForUser(
      FEATURE_FLAGS.AUTO_APPLY,
      userId
    );
  }
}
```

## Frontend (React)

### Import

```typescript
import { FeatureFlag } from '@/components/features/FeatureFlag';
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';
```

### Component

```typescript
<FeatureFlag
  flag={FEATURE_FLAGS.AUTO_APPLY}
  fallback={<NotAvailable />}
>
  <MyFeature />
</FeatureFlag>
```

### Hook

```typescript
function MyComponent() {
  const { isEnabled } = useFeatureFlag(FEATURE_FLAGS.AUTO_APPLY);

  if (!isEnabled) return null;
  return <div>Feature enabled</div>;
}
```

## Python (FastAPI)

### Client

```python
from utils.feature_flags import feature_flags

is_enabled = await feature_flags.is_enabled('FEATURE_FLAG', user_id)
```

### Dependency

```python
from dependencies.feature_flags import require_feature_flag

@router.post("/endpoint")
async def my_endpoint(
    _: bool = Depends(require_feature_flag("FEATURE_FLAG"))
):
    # Protected by feature flag
    pass
```

## Admin API

### Get All Flags

```bash
GET /api/admin/features
```

### Enable/Disable

```bash
POST /api/admin/features/FLAG_KEY/enable
POST /api/admin/features/FLAG_KEY/disable
```

### Percentage Rollout

```bash
POST /api/admin/features/FLAG_KEY/rollout
Content-Type: application/json

{
  "percentage": 50
}
```

### User Management

```bash
# Enable for users
POST /api/admin/features/FLAG_KEY/users/enable
{"userIds": ["user1", "user2"]}

# Disable for users
POST /api/admin/features/FLAG_KEY/users/disable
{"userIds": ["user3"]}
```

## Common Patterns

### Gradual Rollout

```bash
# 10% of users
POST /api/admin/features/NEW_FEATURE/rollout {"percentage": 10}

# 25% of users
POST /api/admin/features/NEW_FEATURE/rollout {"percentage": 25}

# 50% of users
POST /api/admin/features/NEW_FEATURE/rollout {"percentage": 50}

# 100% of users
POST /api/admin/features/NEW_FEATURE/rollout {"percentage": 100}
```

### Beta Testing

```bash
POST /api/admin/features/NEW_FEATURE/users/enable
{
  "userIds": ["beta-tester-1", "beta-tester-2"]
}
```

### Kill Switch

```bash
# Immediately disable feature
POST /api/admin/features/PROBLEMATIC_FEATURE/disable
```

## Debugging

### Check Flag Status

```bash
GET /api/features/FLAG_KEY
```

### Check for User

```bash
GET /api/features/FLAG_KEY
Headers: X-User-Id: user-123
```

### Refresh Cache

```bash
POST /api/admin/features/refresh/all
```

## Environment Setup

```env
# .env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
AUTH_SERVICE_URL=http://localhost:8001
```

## Testing

```typescript
// Mock in tests
jest.spyOn(featureFlagService, 'isEnabled').mockResolvedValue(true);
```

## Migration

```bash
# Run migration
npm run migration:run

# Initialize defaults
POST /api/admin/features/initialize/defaults
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Flag not working | Check database, clear cache |
| 403 Forbidden | Feature is disabled |
| Performance slow | Enable Redis caching |
| Inconsistent results | Clear cache on all servers |

## Support

- **Documentation**: `FEATURE_FLAGS_DOCUMENTATION.md`
- **Integration Guide**: `FEATURE_FLAGS_INTEGRATION_GUIDE.md`
- **Package README**: `packages/feature-flags/README.md`
