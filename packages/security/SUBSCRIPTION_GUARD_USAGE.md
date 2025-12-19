# Subscription Guard Usage Guide

## Overview

The Subscription Guard provides feature gating middleware for NestJS applications based on user subscription tiers. It supports:

- **Tier-based access control** - Restrict endpoints to specific subscription tiers
- **Feature gating** - Control access to specific features
- **Usage limit enforcement** - Track and limit resource usage per subscription tier

## Installation

The subscription guard is part of the `@applyforus/security` package:

```typescript
import {
  SubscriptionGuard,
  SubscriptionLimitsService,
  RequiresTier,
  RequiresFeature,
  CheckUsageLimit,
  SubscriptionTier,
  FeatureType,
  UsageLimitType,
} from '@applyforus/security';
```

## Subscription Tiers

The platform supports 6 subscription tiers (from lowest to highest):

1. **FREEMIUM** - Free tier with limited functionality
2. **STARTER** - Entry paid tier ($23.99/month)
3. **BASIC** - Basic paid tier ($49.99/month)
4. **PROFESSIONAL** - Professional tier ($89.99/month)
5. **ADVANCED_CAREER** - Advanced Career tier ($149.99/month)
6. **EXECUTIVE_ELITE** - Executive Elite tier ($299.99/month)

## Setup

### 1. Global Guard Setup (Recommended)

Register the guard globally in your application module:

```typescript
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { SubscriptionGuard } from '@applyforus/security';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
  ],
})
export class AppModule {}
```

### 2. Controller-Level Setup

Alternatively, apply the guard to specific controllers:

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from '@applyforus/security';

@Controller('premium-features')
@UseGuards(SubscriptionGuard)
export class PremiumFeaturesController {
  // All routes in this controller will be protected
}
```

### 3. Prerequisites

The guard requires the request to have an authenticated user with subscription information:

```typescript
// Expected user object structure on request
interface RequestUser {
  id: string;
  email: string;
  subscriptionTier?: SubscriptionTier;
  subscription?: {
    tier: SubscriptionTier;
    status: string;
    hasAccess: boolean;
  };
  usage?: {
    jobApplications?: number;
    aiCoverLetters?: number;
    resumeTemplates?: number;
    savedJobs?: number;
    virtualCoins?: number;
    boostVisibility?: number;
  };
}
```

## Decorators

### @RequiresTier

Restricts endpoint access to users with a minimum subscription tier.

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequiresTier, SubscriptionTier } from '@applyforus/security';

@Controller('analytics')
export class AnalyticsController {
  @Get('basic')
  @RequiresTier(SubscriptionTier.BASIC)
  async getBasicAnalytics() {
    // Only BASIC tier or higher can access
    return { data: 'basic analytics' };
  }

  @Get('advanced')
  @RequiresTier(SubscriptionTier.PROFESSIONAL)
  async getAdvancedAnalytics() {
    // Only PROFESSIONAL tier or higher can access
    return { data: 'advanced analytics' };
  }
}
```

**Response on insufficient tier:**

```json
{
  "statusCode": 403,
  "message": "This feature requires PROFESSIONAL subscription tier or higher",
  "error": "Insufficient Subscription Tier",
  "requiredTier": "PROFESSIONAL",
  "currentTier": "BASIC",
  "upgradeUrl": "/billing/upgrade"
}
```

### @RequiresFeature

Restricts access based on specific feature availability.

```typescript
import { Controller, Get } from '@nestjs/common';
import { RequiresFeature, FeatureType } from '@applyforus/security';

@Controller('support')
export class SupportController {
  @Get('priority')
  @RequiresFeature(FeatureType.PRIORITY_SUPPORT)
  async getPrioritySupport() {
    // Only users with priority support feature can access
    return { message: 'Priority support ticket created' };
  }

  @Get('account-manager')
  @RequiresFeature(FeatureType.DEDICATED_ACCOUNT_MANAGER)
  async getAccountManager() {
    // Only EXECUTIVE_ELITE tier has this feature
    return { accountManager: 'John Doe' };
  }
}
```

**Available Features:**

- `EMAIL_ALERTS`
- `PRIORITY_SUPPORT`
- `ADVANCED_ANALYTICS`
- `CUSTOM_BRANDING`
- `AUTO_APPLY_ENABLED`
- `INTERVIEW_PREP_ACCESS`
- `SALARY_INSIGHTS`
- `COMPANY_INSIGHTS`
- `DEDICATED_ACCOUNT_MANAGER`
- `API_ACCESS`

**Response on feature not available:**

```json
{
  "statusCode": 403,
  "message": "This feature is not available in your current subscription plan",
  "error": "Feature Not Available",
  "feature": "ADVANCED_ANALYTICS",
  "currentTier": "STARTER",
  "upgradeUrl": "/billing/upgrade"
}
```

### @CheckUsageLimit

Enforces monthly usage limits based on subscription tier.

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { CheckUsageLimit, UsageLimitType } from '@applyforus/security';

@Controller('applications')
export class ApplicationsController {
  @Post()
  @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
  async submitApplication(@Body() dto: CreateApplicationDto) {
    // Guard checks if user has remaining job applications for the month
    // Note: You still need to increment the usage counter in your service
    return { message: 'Application submitted' };
  }

  @Post('cover-letter/generate')
  @CheckUsageLimit(UsageLimitType.AI_COVER_LETTERS)
  async generateCoverLetter(@Body() dto: GenerateCoverLetterDto) {
    // Guard checks if user has remaining AI cover letter generations
    return { coverLetter: 'Generated cover letter...' };
  }
}
```

**Available Usage Limit Types:**

- `JOB_APPLICATIONS` - Monthly job application limit
- `AI_COVER_LETTERS` - AI-generated cover letters
- `RESUME_TEMPLATES` - Resume templates access
- `SAVED_JOBS` - Saved jobs limit
- `VIRTUAL_COINS` - Virtual coins per month
- `BOOST_VISIBILITY` - Visibility boost slots

**Response on limit exceeded:**

```json
{
  "statusCode": 429,
  "message": "You have reached your monthly limit for job applications",
  "error": "Usage Limit Exceeded",
  "limitType": "JOB_APPLICATIONS",
  "currentUsage": 5,
  "limit": 5,
  "currentTier": "FREEMIUM",
  "upgradeUrl": "/billing/upgrade"
}
```

## Combining Decorators

You can combine multiple decorators for comprehensive protection:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import {
  RequiresTier,
  RequiresFeature,
  CheckUsageLimit,
  SubscriptionTier,
  FeatureType,
  UsageLimitType,
} from '@applyforus/security';

@Controller('auto-apply')
export class AutoApplyController {
  @Post('enable')
  @RequiresTier(SubscriptionTier.BASIC)
  @RequiresFeature(FeatureType.AUTO_APPLY_ENABLED)
  async enableAutoApply() {
    // Must have BASIC tier or higher AND auto-apply feature
    return { message: 'Auto-apply enabled' };
  }

  @Post('submit')
  @RequiresTier(SubscriptionTier.BASIC)
  @RequiresFeature(FeatureType.AUTO_APPLY_ENABLED)
  @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
  async submitAutoApplication(@Body() dto: AutoApplyDto) {
    // Checks tier, feature access, AND usage limits
    return { message: 'Auto-application submitted' };
  }
}
```

## Subscription Tier Limits

Here's a quick reference of limits per tier:

| Feature | FREEMIUM | STARTER | BASIC | PROFESSIONAL | ADVANCED_CAREER | EXECUTIVE_ELITE |
|---------|----------|---------|-------|--------------|-----------------|-----------------|
| Job Applications/Month | 5 | 30 | 75 | 200 | 500 | Unlimited |
| AI Cover Letters | 2 | 15 | 40 | 100 | 300 | Unlimited |
| Resume Templates | 2 | 5 | 10 | Unlimited | Unlimited | Unlimited |
| Saved Jobs | 10 | 50 | 150 | 500 | Unlimited | Unlimited |
| Email Alerts | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Auto-Apply | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Salary Insights | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Company Insights | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Dedicated Manager | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Using SubscriptionLimitsService

For programmatic access to subscription limits without using guards:

```typescript
import { Injectable } from '@nestjs/common';
import {
  SubscriptionLimitsService,
  SubscriptionTier,
  FeatureType,
  UsageLimitType,
} from '@applyforus/security';

@Injectable()
export class MyService {
  constructor(private subscriptionLimits: SubscriptionLimitsService) {}

  async checkUserLimits(userTier: SubscriptionTier, currentUsage: number) {
    // Get subscription limits
    const limits = this.subscriptionLimits.getLimits(userTier);
    console.log('User limits:', limits);

    // Check feature availability
    const hasAnalytics = this.subscriptionLimits.hasFeature(
      userTier,
      FeatureType.ADVANCED_ANALYTICS
    );

    // Get remaining usage
    const remaining = this.subscriptionLimits.getRemainingUsage(
      userTier,
      UsageLimitType.JOB_APPLICATIONS,
      currentUsage
    );

    // Check if action is allowed
    const canApply = this.subscriptionLimits.canPerformAction(
      userTier,
      UsageLimitType.JOB_APPLICATIONS,
      currentUsage
    );

    return { hasAnalytics, remaining, canApply };
  }
}
```

## Usage Tracking

**Important:** The guard only **checks** usage limits. Your application must track and increment usage separately.

### Example: Tracking Job Applications

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsageTrackingService {
  constructor(
    @InjectRepository(UsageRecord)
    private usageRepository: Repository<UsageRecord>,
  ) {}

  async incrementUsage(userId: string, limitType: UsageLimitType) {
    const currentPeriod = this.getCurrentPeriod(); // e.g., '2025-12'

    let usage = await this.usageRepository.findOne({
      where: { userId, period: currentPeriod },
    });

    if (!usage) {
      usage = this.usageRepository.create({
        userId,
        period: currentPeriod,
        [limitType]: 0,
      });
    }

    usage[limitType] = (usage[limitType] || 0) + 1;
    await this.usageRepository.save(usage);
  }

  async getCurrentUsage(userId: string, limitType: UsageLimitType): Promise<number> {
    const currentPeriod = this.getCurrentPeriod();
    const usage = await this.usageRepository.findOne({
      where: { userId, period: currentPeriod },
    });

    return usage?.[limitType] || 0;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
```

### Example: Middleware to Populate Usage Data

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class UsageMiddleware implements NestMiddleware {
  constructor(private usageService: UsageTrackingService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user) {
      // Populate usage data for the current period
      req.user.usage = {
        jobApplications: await this.usageService.getCurrentUsage(
          req.user.id,
          UsageLimitType.JOB_APPLICATIONS
        ),
        aiCoverLetters: await this.usageService.getCurrentUsage(
          req.user.id,
          UsageLimitType.AI_COVER_LETTERS
        ),
        // ... other usage types
      };
    }
    next();
  }
}
```

## Error Handling

Handle subscription errors in your frontend:

```typescript
try {
  await api.post('/applications', applicationData);
} catch (error) {
  if (error.response?.status === 403) {
    // Insufficient tier or feature not available
    const { requiredTier, currentTier, upgradeUrl } = error.response.data;
    showUpgradePrompt(requiredTier, currentTier, upgradeUrl);
  } else if (error.response?.status === 429) {
    // Usage limit exceeded
    const { limitType, limit, currentTier } = error.response.data;
    showLimitExceededModal(limitType, limit, currentTier);
  }
}
```

## Testing

### Example Unit Test

```typescript
import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionGuard } from '@applyforus/security';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no subscription decorators are present', async () => {
    const context = createMockExecutionContext({
      user: { id: '1', email: 'test@example.com' },
    });

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should deny access when user tier is insufficient', async () => {
    const context = createMockExecutionContext({
      user: {
        id: '1',
        email: 'test@example.com',
        subscriptionTier: SubscriptionTier.FREEMIUM,
      },
    });

    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValueOnce(SubscriptionTier.PROFESSIONAL)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
```

## Best Practices

1. **Always validate on the backend** - Never rely solely on frontend checks
2. **Provide clear upgrade paths** - Include upgrade URLs in error responses
3. **Track usage accurately** - Implement proper usage tracking middleware
4. **Cache user subscription data** - Reduce database queries for subscription info
5. **Test edge cases** - Test tier boundaries, expired subscriptions, etc.
6. **Monitor usage patterns** - Track which features drive upgrades
7. **Graceful degradation** - Default to FREEMIUM tier if subscription data is missing

## Troubleshooting

### Guard not enforcing restrictions

- Ensure the guard is registered globally or on the controller
- Verify the user object has subscription information
- Check that decorators are applied to the correct methods

### Usage limits not working

- Verify `user.usage` is populated by middleware
- Ensure usage is tracked and incremented in your service
- Check that the current period calculation is correct

### Tier comparisons failing

- Ensure tier values match the `SubscriptionTier` enum exactly
- Check for case sensitivity issues
- Verify tier is coming from the correct location (user.subscriptionTier or user.subscription.tier)

## Support

For issues or questions about the subscription guard, contact the platform team or check the internal documentation.
