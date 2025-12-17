# Feature Flags Integration Guide

This guide provides step-by-step instructions for integrating the feature flag system into each service of the JobPilot AI Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Backend Services Integration](#backend-services-integration)
3. [Frontend Integration](#frontend-integration)
4. [Python Services Integration](#python-services-integration)
5. [Testing](#testing)
6. [Deployment](#deployment)

## Prerequisites

1. PostgreSQL database with feature_flags table (run migration)
2. Redis (optional, for distributed caching)
3. Feature flags package installed

```bash
pnpm add @jobpilot/feature-flags
```

## Backend Services Integration

### Step 1: Auth Service (Primary Service)

The auth service should be the primary service that hosts the feature flags module and API.

#### 1.1 Update `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FeatureFlagsModule } from '@jobpilot/feature-flags';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    // Add Feature Flags Module
    FeatureFlagsModule.forRoot({
      redis: new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
      }),
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

#### 1.2 Add Controllers

Create a new file `src/modules/features/features.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import {
  FeatureFlagsController,
  FeatureFlagsAdminController,
} from '@jobpilot/feature-flags';

@Module({
  controllers: [FeatureFlagsController, FeatureFlagsAdminController],
})
export class FeaturesModule {}
```

Add to `app.module.ts`:

```typescript
import { FeaturesModule } from './modules/features/features.module';

@Module({
  imports: [
    // ... other imports
    FeaturesModule,
  ],
})
export class AppModule {}
```

#### 1.3 Run Migration

```bash
cd services/auth-service
npm run migration:run
```

#### 1.4 Initialize Default Flags

```bash
curl -X POST http://localhost:8001/api/admin/features/initialize/defaults \
  -H "Authorization: Bearer <admin-token>"
```

### Step 2: Other Backend Services

Other services can use the feature flag system by importing the module.

#### 2.1 Update Service Module

```typescript
import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from '@jobpilot/feature-flags';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // Your database config
      // Must connect to same database as auth service
    }),
    FeatureFlagsModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
```

#### 2.2 Use in Controllers

**Auto-Apply Service Example** (`services/auto-apply-service/src/modules/applications/applications.controller.ts`):

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';
import { AutoApplyService } from './services/auto-apply.service';

@Controller('auto-apply')
@UseGuards(FeatureFlagGuard)
export class ApplicationsController {
  constructor(private readonly autoApplyService: AutoApplyService) {}

  @Get('settings/:userId')
  @FeatureFlag(FEATURE_FLAGS.AUTO_APPLY)
  async getSettings(@Param('userId') userId: string) {
    return this.autoApplyService.getSettings(userId);
  }

  @Post('start/:userId/linkedin')
  @FeatureFlag(FEATURE_FLAGS.LINKEDIN_AUTO_APPLY)
  async startLinkedIn(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }

  @Post('start/:userId/indeed')
  @FeatureFlag(FEATURE_FLAGS.INDEED_AUTO_APPLY)
  async startIndeed(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }

  @Post('start/:userId/glassdoor')
  @FeatureFlag(FEATURE_FLAGS.GLASSDOOR_AUTO_APPLY)
  async startGlassdoor(@Param('userId') userId: string) {
    return this.autoApplyService.startAutoApply(userId);
  }
}
```

#### 2.3 Use in Services

```typescript
import { Injectable } from '@nestjs/common';
import { FeatureFlagService } from '@jobpilot/feature-flags';

@Injectable()
export class AutoApplyService {
  constructor(
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async processApplication(userId: string, jobId: string, platform: string) {
    // Check platform-specific flag
    const platformFlag = `${platform.toUpperCase()}_AUTO_APPLY_ENABLED`;
    const isEnabled = await this.featureFlagService.isEnabledForUser(
      platformFlag,
      userId,
    );

    if (!isEnabled) {
      throw new Error(`Auto-apply not available for ${platform}`);
    }

    // Process application
  }
}
```

### Step 3: Resume Service

**Controller** (`services/resume-service/src/modules/resumes/resumes.controller.ts`):

```typescript
import { Controller, Post, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';

@Controller('resumes')
@UseGuards(FeatureFlagGuard)
export class ResumesController {
  @Post('optimize')
  @FeatureFlag(FEATURE_FLAGS.RESUME_OPTIMIZATION)
  async optimizeResume(@Body() data: any) {
    // Optimize resume logic
  }

  @Post('versions')
  @FeatureFlag(FEATURE_FLAGS.VERSION_CONTROL)
  async createVersion(@Body() data: any) {
    // Version control logic
  }
}
```

### Step 4: Analytics Service

**Controller** (`services/analytics-service/src/modules/analytics/analytics.controller.ts`):

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { FeatureFlag, FeatureFlagGuard, FEATURE_FLAGS } from '@jobpilot/feature-flags';

@Controller('analytics')
@UseGuards(FeatureFlagGuard)
export class AnalyticsController {
  @Get('dashboard')
  @FeatureFlag(FEATURE_FLAGS.ANALYTICS_DASHBOARD)
  async getDashboard() {
    // Dashboard logic
  }

  @Get('advanced')
  @FeatureFlag(FEATURE_FLAGS.ADVANCED_ANALYTICS)
  async getAdvancedAnalytics() {
    // Advanced analytics logic
  }
}
```

## Frontend Integration

### Step 1: Install Dependencies

Already done - package is in workspace.

### Step 2: Configure API URL

Update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Step 3: Use in Pages

**Auto-Apply Page** (`apps/web/src/app/(dashboard)/auto-apply/page.tsx`):

```typescript
'use client';

import { FeatureFlag } from '@/components/features/FeatureFlag';
import { FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

export default function AutoApplyPage() {
  return (
    <FeatureFlag
      flag={FEATURE_FLAGS.AUTO_APPLY}
      fallback={<FeatureNotAvailable />}
    >
      <div>
        <h1>Auto Apply</h1>

        <FeatureFlag flag={FEATURE_FLAGS.LINKEDIN_AUTO_APPLY}>
          <LinkedInAutoApply />
        </FeatureFlag>

        <FeatureFlag flag={FEATURE_FLAGS.INDEED_AUTO_APPLY}>
          <IndeedAutoApply />
        </FeatureFlag>

        <FeatureFlag
          flag={FEATURE_FLAGS.GLASSDOOR_AUTO_APPLY}
          fallback={<ComingSoon platform="Glassdoor" />}
        >
          <GlassdoorAutoApply />
        </FeatureFlag>
      </div>
    </FeatureFlag>
  );
}
```

**Dashboard Page** (`apps/web/src/app/(dashboard)/dashboard/page.tsx`):

```typescript
'use client';

import { FeatureFlag } from '@/components/features/FeatureFlag';
import { useFeatureFlags, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

export default function DashboardPage() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Show analytics if enabled */}
      <FeatureFlag flag={FEATURE_FLAGS.ANALYTICS_DASHBOARD}>
        <AnalyticsWidget />
      </FeatureFlag>

      {/* Feature summary */}
      <div>
        <h2>Available Features</h2>
        <ul>
          {isEnabled(FEATURE_FLAGS.AUTO_APPLY) && (
            <li>✓ Auto Apply</li>
          )}
          {isEnabled(FEATURE_FLAGS.AI_RESUME_BUILDER) && (
            <li>✓ AI Resume Builder</li>
          )}
          {isEnabled(FEATURE_FLAGS.ANALYTICS_DASHBOARD) && (
            <li>✓ Analytics Dashboard</li>
          )}
        </ul>
      </div>
    </div>
  );
}
```

### Step 4: Use in Components

```typescript
import { useFeatureFlag, FEATURE_FLAGS } from '@/hooks/useFeatureFlags';

export function JobCard({ job }) {
  const { isEnabled } = useFeatureFlag(FEATURE_FLAGS.SALARY_PREDICTION);

  return (
    <div className="job-card">
      <h3>{job.title}</h3>
      <p>{job.company}</p>

      {isEnabled && job.salaryPrediction && (
        <div className="salary-prediction">
          <p>Estimated Salary: {job.salaryPrediction}</p>
        </div>
      )}
    </div>
  );
}
```

## Python Services Integration

### Step 1: Create Feature Flag Client

Create `services/ai-service/src/utils/feature_flags.py`:

```python
import httpx
import os
from typing import Optional
from functools import lru_cache

AUTH_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')


class FeatureFlagClient:
    def __init__(self, base_url: str = AUTH_SERVICE_URL):
        self.base_url = base_url

    async def is_enabled(
        self,
        flag_key: str,
        user_id: Optional[str] = None
    ) -> bool:
        """Check if a feature flag is enabled"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/features/{flag_key}"
                headers = {'X-User-Id': user_id} if user_id else {}

                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    return data.get('enabled', False)
                return False
        except Exception as e:
            print(f"Error checking feature flag {flag_key}: {e}")
            return False

    async def get_enabled_features(
        self,
        user_id: Optional[str] = None
    ) -> list:
        """Get all enabled features for a user"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/api/features"
                headers = {'X-User-Id': user_id} if user_id else {}

                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                return []
        except Exception as e:
            print(f"Error getting enabled features: {e}")
            return []


# Singleton instance
feature_flags = FeatureFlagClient()
```

### Step 2: Create Dependencies

Create `services/ai-service/src/dependencies/feature_flags.py`:

```python
from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from ..utils.feature_flags import feature_flags


async def require_feature_flag(flag_key: str):
    """Dependency to require a feature flag"""
    async def check(x_user_id: Optional[str] = Header(None)):
        is_enabled = await feature_flags.is_enabled(flag_key, x_user_id)
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature {flag_key} is not available"
            )
        return True
    return check
```

### Step 3: Use in Routes

Update `services/ai-service/src/api/routes/ai_endpoints.py`:

```python
from fastapi import APIRouter, Depends, HTTPException
from ...dependencies.feature_flags import require_feature_flag

router = APIRouter()


@router.post("/resume/optimize")
async def optimize_resume(
    resume_data: dict,
    _: bool = Depends(require_feature_flag("RESUME_OPTIMIZATION_ENABLED"))
):
    """Optimize resume using AI"""
    # Your logic here
    return {"status": "optimized"}


@router.post("/salary/predict")
async def predict_salary(
    job_data: dict,
    _: bool = Depends(require_feature_flag("SALARY_PREDICTION_ENABLED"))
):
    """Predict salary for a job"""
    # Your logic here
    return {"prediction": {"min": 0, "max": 0}}


@router.post("/jobs/match")
async def match_jobs(
    profile_data: dict,
    _: bool = Depends(require_feature_flag("AI_SUGGESTIONS_ENABLED"))
):
    """Match jobs using AI"""
    # Your logic here
    return {"matches": []}
```

## Testing

### Backend Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagService } from '@jobpilot/feature-flags';

describe('AutoApplyController', () => {
  let controller: AutoApplyController;
  let featureFlagService: FeatureFlagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutoApplyController],
      providers: [
        {
          provide: FeatureFlagService,
          useValue: {
            isEnabled: jest.fn(),
            isEnabledForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AutoApplyController>(AutoApplyController);
    featureFlagService = module.get<FeatureFlagService>(FeatureFlagService);
  });

  it('should allow access when feature is enabled', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockResolvedValue(true);

    const result = await controller.getSettings('user-123');
    expect(result).toBeDefined();
  });

  it('should deny access when feature is disabled', async () => {
    jest.spyOn(featureFlagService, 'isEnabled').mockResolvedValue(false);

    await expect(
      controller.getSettings('user-123')
    ).rejects.toThrow();
  });
});
```

### Frontend Tests

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeatureFlag } from '@/components/features/FeatureFlag';

jest.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlag: jest.fn(),
}));

describe('FeatureFlag Component', () => {
  it('should render children when feature is enabled', () => {
    const { useFeatureFlag } = require('@/hooks/useFeatureFlags');
    useFeatureFlag.mockReturnValue({
      isEnabled: true,
      isLoading: false,
    });

    render(
      <FeatureFlag flag="TEST_FEATURE">
        <div>Feature Content</div>
      </FeatureFlag>
    );

    expect(screen.getByText('Feature Content')).toBeInTheDocument();
  });

  it('should render fallback when feature is disabled', () => {
    const { useFeatureFlag } = require('@/hooks/useFeatureFlags');
    useFeatureFlag.mockReturnValue({
      isEnabled: false,
      isLoading: false,
    });

    render(
      <FeatureFlag
        flag="TEST_FEATURE"
        fallback={<div>Not Available</div>}
      >
        <div>Feature Content</div>
      </FeatureFlag>
    );

    expect(screen.getByText('Not Available')).toBeInTheDocument();
  });
});
```

## Deployment

### Step 1: Database Migration

```bash
# Production database
npm run migration:run
```

### Step 2: Environment Variables

Ensure all services have:

```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_HOST=redis-host
REDIS_PORT=6379
AUTH_SERVICE_URL=http://auth-service:8001
```

### Step 3: Initialize Flags

```bash
# Call from auth service
curl -X POST https://api.yourdomain.com/api/admin/features/initialize/defaults \
  -H "Authorization: Bearer <admin-token>"
```

### Step 4: Verify

```bash
# Check all flags
curl https://api.yourdomain.com/api/admin/features \
  -H "Authorization: Bearer <admin-token>"
```

## Rollback Plan

If issues occur:

1. **Disable Problematic Flag**
   ```bash
   POST /api/admin/features/PROBLEMATIC_FEATURE/disable
   ```

2. **Remove Feature Flag Check** (Quick fix)
   - Comment out `@FeatureFlag()` decorator
   - Remove `<FeatureFlag>` component wrapper

3. **Database Rollback**
   ```bash
   npm run migration:revert
   ```

## Support Checklist

Before deploying:

- [ ] Database migration completed
- [ ] Default flags initialized
- [ ] All services can connect to database
- [ ] Redis is configured (if using)
- [ ] Feature flag decorators added to new features
- [ ] Frontend components use FeatureFlag wrapper
- [ ] Tests updated to handle both enabled/disabled states
- [ ] Documentation updated
- [ ] Team trained on using feature flags
- [ ] Monitoring/alerts configured

## Next Steps

1. Review all existing features
2. Add feature flag checks incrementally
3. Test each feature in both states
4. Deploy to staging
5. Verify functionality
6. Deploy to production
7. Monitor and adjust rollout percentages
