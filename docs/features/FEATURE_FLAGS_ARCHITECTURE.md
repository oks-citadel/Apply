# Feature Flags System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Feature Flags System                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│   Database      │
│  (React/Next)   │     │   (NestJS)       │     │  (PostgreSQL)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Cache     │
                        │   (Redis)    │
                        └──────────────┘
```

## Component Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    @jobpilot/feature-flags                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Core Services                          │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • FeatureFlagService (Evaluation)                       │    │
│  │  • FeatureFlagAdminService (Management)                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    NestJS Integration                     │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • FeatureFlagGuard                                      │    │
│  │  • @FeatureFlag Decorator                                │    │
│  │  • @RequireAllFlags Decorator                            │    │
│  │  • @RequireAnyFlag Decorator                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    API Controllers                        │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • FeatureFlagsController (Public API)                   │    │
│  │  • FeatureFlagsAdminController (Admin API)               │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Data Layer                             │    │
│  ├──────────────────────────────────────────────────────────┤    │
│  │  • FeatureFlagEntity (TypeORM)                           │    │
│  │  • Database Repository                                    │    │
│  │  • Migrations                                             │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Request Flow

### Backend Request Flow

```
1. HTTP Request
   │
   ├─▶ Route with @FeatureFlag decorator
   │
   ├─▶ FeatureFlagGuard activated
   │
   ├─▶ Extract user context (userId from JWT/session)
   │
   ├─▶ FeatureFlagService.isEnabled(flagKey, { userId })
   │
   ├─▶ Check cache (in-memory → Redis)
   │   │
   │   ├─▶ Cache hit → Return cached result
   │   │
   │   └─▶ Cache miss
   │       │
   │       ├─▶ Query database
   │       │
   │       ├─▶ Evaluate flag rules
   │       │   ├─▶ Check user overrides (enabled/disabled lists)
   │       │   ├─▶ Check percentage rollout (consistent hashing)
   │       │   └─▶ Use default value
   │       │
   │       └─▶ Cache result
   │
   ├─▶ Return boolean result
   │
   ├─▶ If enabled: Continue to controller
   │
   └─▶ If disabled: Throw ForbiddenException (403)
```

### Frontend Request Flow

```
1. Component Render
   │
   ├─▶ useFeatureFlag(flagKey) hook
   │
   ├─▶ React Query fetches from API
   │   GET /api/features/{flagKey}
   │
   ├─▶ Backend evaluates flag
   │
   ├─▶ Response: { enabled: boolean }
   │
   ├─▶ React Query caches (5 min TTL)
   │
   ├─▶ Hook returns { isEnabled, isLoading }
   │
   └─▶ Component renders based on isEnabled
       │
       ├─▶ true: Render children
       │
       └─▶ false: Render fallback
```

## Flag Evaluation Logic

```
┌─────────────────────────────────────────────────────────────┐
│                   Flag Evaluation Decision Tree             │
└─────────────────────────────────────────────────────────────┘

Start: Evaluate Flag(flagKey, userId)
  │
  ├─▶ 1. Flag exists in database?
  │   ├─▶ No → Return defaultEnabled (false)
  │   └─▶ Yes → Continue
  │
  ├─▶ 2. Flag status = 'disabled'?
  │   ├─▶ Yes → Return false
  │   └─▶ No → Continue
  │
  ├─▶ 3. User in disabledUserIds?
  │   ├─▶ Yes → Return false
  │   └─▶ No → Continue
  │
  ├─▶ 4. User in enabledUserIds?
  │   ├─▶ Yes → Return true
  │   └─▶ No → Continue
  │
  ├─▶ 5. Check flag type:
  │   │
  │   ├─▶ BOOLEAN
  │   │   └─▶ Return defaultValue
  │   │
  │   ├─▶ PERCENTAGE
  │   │   ├─▶ hash = consistentHash(flagKey + userId)
  │   │   ├─▶ percentage = hash % 100
  │   │   └─▶ Return (percentage < rolloutPercentage)
  │   │
  │   └─▶ USER_LIST
  │       └─▶ Return (userId in enabledUserIds)
  │
  └─▶ End: Return result
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    feature_flags Table                      │
├─────────────────────────────────────────────────────────────┤
│ id                  UUID (PK)                               │
│ key                 VARCHAR(255) UNIQUE NOT NULL            │
│ name                VARCHAR(255) NOT NULL                   │
│ description         TEXT                                     │
│ type                ENUM('boolean','percentage','user_list')│
│ status              ENUM('enabled','disabled','deprecated') │
│ defaultValue        BOOLEAN DEFAULT false                   │
│ rolloutPercentage   INTEGER NULL                            │
│ enabledUserIds      JSONB DEFAULT '[]'                      │
│ disabledUserIds     JSONB DEFAULT '[]'                      │
│ metadata            JSONB                                    │
│ createdBy           VARCHAR(255)                            │
│ updatedBy           VARCHAR(255)                            │
│ createdAt           TIMESTAMP DEFAULT NOW()                 │
│ updatedAt           TIMESTAMP DEFAULT NOW()                 │
├─────────────────────────────────────────────────────────────┤
│ Indexes:                                                    │
│  • PRIMARY KEY (id)                                         │
│  • UNIQUE INDEX (key)                                       │
│  • INDEX (status)                                           │
└─────────────────────────────────────────────────────────────┘
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Layer Cache                        │
└─────────────────────────────────────────────────────────────┘

Layer 1: In-Memory Cache (Map)
├─▶ TTL: 5 minutes
├─▶ Refresh: Every 1 minute (background)
├─▶ Scope: Single process/instance
└─▶ Purpose: Ultra-fast access

Layer 2: Redis Cache (Optional)
├─▶ TTL: 5 minutes
├─▶ Scope: Distributed (all instances)
├─▶ Purpose: Shared cache across services
└─▶ Fallback: Database

Layer 3: Database (PostgreSQL)
├─▶ Source of truth
├─▶ Indexed queries
└─▶ Purpose: Persistent storage
```

## Service Integration Patterns

### Pattern 1: Route Protection

```typescript
@Controller('api')
@UseGuards(FeatureFlagGuard)
export class MyController {
  @Get('endpoint')
  @FeatureFlag('FEATURE_KEY')
  async handler() {
    // Auto-protected by guard
  }
}
```

### Pattern 2: Service-Level Check

```typescript
@Injectable()
export class MyService {
  constructor(
    private readonly featureFlagService: FeatureFlagService
  ) {}

  async process(userId: string) {
    if (!await this.featureFlagService.isEnabled('FEATURE_KEY', { userId })) {
      throw new Error('Feature not available');
    }
    // Process logic
  }
}
```

### Pattern 3: Conditional Logic

```typescript
async processJob(userId: string) {
  const hasAI = await this.featureFlagService.isEnabled(
    'AI_SUGGESTIONS_ENABLED',
    { userId }
  );

  if (hasAI) {
    return await this.processWithAI();
  } else {
    return await this.processBasic();
  }
}
```

## Frontend Integration Patterns

### Pattern 1: Component Wrapper

```typescript
<FeatureFlag flag="FEATURE_KEY" fallback={<Fallback />}>
  <Feature />
</FeatureFlag>
```

### Pattern 2: Hook-Based

```typescript
function Component() {
  const { isEnabled } = useFeatureFlag('FEATURE_KEY');

  if (!isEnabled) return null;
  return <Feature />;
}
```

### Pattern 3: Multiple Flags

```typescript
<RequireAllFlags flags={['FLAG_1', 'FLAG_2']}>
  <PremiumFeature />
</RequireAllFlags>
```

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Production Deployment                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Frontend   │     │  Frontend   │     │  Frontend   │
│  Instance 1 │     │  Instance 2 │     │  Instance 3 │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │ Load Balancer│
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  Backend    │     │  Backend    │     │  Backend    │
│  Instance 1 │     │  Instance 2 │     │  Instance 3 │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
     ┌──────▼──────┐  ┌────▼────┐  ┌────▼────┐
     │  PostgreSQL │  │  Redis  │  │  Redis  │
     │   Primary   │  │ Master  │  │ Replica │
     └─────────────┘  └─────────┘  └─────────┘
```

## Security Model

```
┌──────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└──────────────────────────────────────────────────────────────┘

1. Authentication
   ├─▶ User authenticated via JWT/session
   └─▶ User ID extracted for evaluation

2. Authorization
   ├─▶ Feature flags check feature access
   └─▶ NOT for permission/role checks

3. Admin Access
   ├─▶ Admin API requires admin role
   ├─▶ Audit trail (createdBy, updatedBy)
   └─▶ Change logging

4. Fail-Safe
   ├─▶ On error: Deny access (fail closed)
   ├─▶ On missing flag: Use safe default
   └─▶ On service down: Cached values
```

## Monitoring & Observability

```
┌──────────────────────────────────────────────────────────────┐
│                    Metrics to Monitor                        │
└──────────────────────────────────────────────────────────────┘

Performance Metrics:
├─▶ Flag evaluation latency (p50, p95, p99)
├─▶ Cache hit/miss ratio
├─▶ Database query time
└─▶ API response time

Usage Metrics:
├─▶ Flags evaluated per second
├─▶ Most frequently checked flags
├─▶ User-specific overrides count
└─▶ Percentage rollout distribution

Health Metrics:
├─▶ Service availability
├─▶ Database connection pool
├─▶ Redis connection status
└─▶ Error rate

Business Metrics:
├─▶ Feature adoption rate
├─▶ A/B test results
├─▶ Rollout progress
└─▶ Flag deprecation status
```

## Scalability Considerations

```
┌──────────────────────────────────────────────────────────────┐
│                    Scale Characteristics                     │
└──────────────────────────────────────────────────────────────┘

Horizontal Scaling:
├─▶ Stateless service design
├─▶ Shared Redis cache
├─▶ Database read replicas
└─▶ Load balanced API

Vertical Scaling:
├─▶ In-memory cache reduces DB load
├─▶ Efficient queries with indexes
├─▶ JSONB for flexible user lists
└─▶ Optimized consistent hashing

Performance:
├─▶ ~1ms cache hit latency
├─▶ ~10ms database query latency
├─▶ Support for 10K+ req/sec
└─▶ Sub-second flag updates
```

## Disaster Recovery

```
┌──────────────────────────────────────────────────────────────┐
│                    Recovery Strategies                       │
└──────────────────────────────────────────────────────────────┘

Database Failure:
├─▶ Use cached values (stale but functional)
├─▶ Failover to read replica
└─▶ Degrade gracefully with defaults

Redis Failure:
├─▶ Fallback to in-memory cache
├─▶ Direct database queries
└─▶ Performance impact only

Service Failure:
├─▶ Frontend fallback to local defaults
├─▶ Backend guard fails closed
└─▶ Auto-restart with health checks

Bad Flag Deployment:
├─▶ Quick disable via admin API
├─▶ No code deployment needed
└─▶ Rollback in seconds
```

## Best Practices Summary

1. **Naming**: Use UPPERCASE_SNAKE_CASE
2. **Defaults**: Safe defaults (usually false for new)
3. **Lifecycle**: Dev → Beta → Rollout → Release → Deprecate
4. **Testing**: Test both enabled/disabled states
5. **Documentation**: Keep flag purposes updated
6. **Cleanup**: Remove deprecated flags regularly
7. **Monitoring**: Track usage and performance
8. **Security**: Separate from authorization
9. **Caching**: Use appropriate TTLs
10. **Rollout**: Gradual percentage increases
