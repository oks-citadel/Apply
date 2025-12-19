import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  REQUIRES_TIER_KEY,
  REQUIRES_FEATURE_KEY,
  CHECK_USAGE_LIMIT_KEY,
  SubscriptionTier,
  FeatureType,
  UsageLimitType,
  hasRequiredTier,
} from './subscription.decorator';

/**
 * Subscription tier limits interface
 * Matches the structure from payment-service
 */
export interface SubscriptionTierLimits {
  jobApplicationsPerMonth: number;
  aiGeneratedCoverLetters: number;
  resumeTemplates: number;
  savedJobs: number;
  emailAlerts: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  virtualCoinsPerMonth: number;
  boostVisibilitySlots: number;
  autoApplyEnabled: boolean;
  interviewPrepAccess: boolean;
  salaryInsights: boolean;
  companyInsights: boolean;
  dedicatedAccountManager: boolean;
  apiAccess: boolean;
}

/**
 * Subscription tier limits (matches payment-service configuration)
 */
export const SUBSCRIPTION_TIER_LIMITS: Record<SubscriptionTier, SubscriptionTierLimits> = {
  [SubscriptionTier.FREEMIUM]: {
    jobApplicationsPerMonth: 5,
    aiGeneratedCoverLetters: 2,
    resumeTemplates: 2,
    savedJobs: 10,
    emailAlerts: false,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 25,
    boostVisibilitySlots: 0,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.STARTER]: {
    jobApplicationsPerMonth: 30,
    aiGeneratedCoverLetters: 15,
    resumeTemplates: 5,
    savedJobs: 50,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 300,
    boostVisibilitySlots: 2,
    autoApplyEnabled: false,
    interviewPrepAccess: false,
    salaryInsights: false,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.BASIC]: {
    jobApplicationsPerMonth: 75,
    aiGeneratedCoverLetters: 40,
    resumeTemplates: 10,
    savedJobs: 150,
    emailAlerts: true,
    prioritySupport: false,
    advancedAnalytics: false,
    customBranding: false,
    virtualCoinsPerMonth: 750,
    boostVisibilitySlots: 5,
    autoApplyEnabled: true,
    interviewPrepAccess: false,
    salaryInsights: true,
    companyInsights: false,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    jobApplicationsPerMonth: 200,
    aiGeneratedCoverLetters: 100,
    resumeTemplates: -1, // unlimited
    savedJobs: 500,
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: false,
    virtualCoinsPerMonth: 2000,
    boostVisibilitySlots: 15,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: false,
  },
  [SubscriptionTier.ADVANCED_CAREER]: {
    jobApplicationsPerMonth: 500,
    aiGeneratedCoverLetters: 300,
    resumeTemplates: -1, // unlimited
    savedJobs: -1, // unlimited
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    virtualCoinsPerMonth: 5000,
    boostVisibilitySlots: 30,
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: false,
    apiAccess: true,
  },
  [SubscriptionTier.EXECUTIVE_ELITE]: {
    jobApplicationsPerMonth: -1, // unlimited
    aiGeneratedCoverLetters: -1, // unlimited
    resumeTemplates: -1, // unlimited
    savedJobs: -1, // unlimited
    emailAlerts: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customBranding: true,
    virtualCoinsPerMonth: -1, // unlimited
    boostVisibilitySlots: -1, // unlimited
    autoApplyEnabled: true,
    interviewPrepAccess: true,
    salaryInsights: true,
    companyInsights: true,
    dedicatedAccountManager: true,
    apiAccess: true,
  },
};

/**
 * Extended request interface with user subscription information
 */
export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    subscriptionTier?: SubscriptionTier;
    subscription?: {
      tier: SubscriptionTier;
      status: string;
      hasAccess: boolean;
    };
    // Usage tracking (should be populated by a middleware or injected service)
    usage?: {
      jobApplications?: number;
      aiCoverLetters?: number;
      resumeTemplates?: number;
      savedJobs?: number;
      virtualCoins?: number;
      boostVisibility?: number;
    };
  };
}

/**
 * Subscription Guard for NestJS
 *
 * Validates subscription tiers, features, and usage limits based on decorators.
 *
 * Usage:
 * 1. Add to providers in your module or use as APP_GUARD for global protection
 * 2. Use decorators on controllers/endpoints:
 *    - @RequiresTier(SubscriptionTier.PROFESSIONAL)
 *    - @RequiresFeature(FeatureType.ADVANCED_ANALYTICS)
 *    - @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS)
 *
 * Prerequisites:
 * - Request must have authenticated user with subscription information
 * - User object should include: subscriptionTier or subscription.tier
 * - For usage limit checks, user.usage should be populated by middleware/service
 *
 * @example
 * ```typescript
 * // In your module
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: SubscriptionGuard,
 *     },
 *   ],
 * })
 *
 * // In your controller
 * @Controller('analytics')
 * export class AnalyticsController {
 *   @RequiresTier(SubscriptionTier.PROFESSIONAL)
 *   @RequiresFeature(FeatureType.ADVANCED_ANALYTICS)
 *   @Get('advanced')
 *   async getAdvancedAnalytics() {
 *     // Only PROFESSIONAL+ users with advanced analytics feature can access
 *   }
 * }
 * ```
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  private readonly logger = new Logger(SubscriptionGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get metadata from decorators
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(REQUIRES_TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredFeature = this.reflector.getAllAndOverride<FeatureType>(REQUIRES_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const usageLimitCheck = this.reflector.getAllAndOverride<{
      limitType: UsageLimitType;
      increment: boolean;
    }>(CHECK_USAGE_LIMIT_KEY, [context.getHandler(), context.getClass()]);

    // If no subscription checks are required, allow access
    if (!requiredTier && !requiredFeature && !usageLimitCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Ensure user is authenticated
    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required to access this resource');
    }

    // Get user's subscription tier
    const userTier = this.getUserTier(user);

    if (!userTier) {
      this.logger.warn(`User ${user.id} has no subscription tier, defaulting to FREEMIUM`);
      // Default to FREEMIUM if no tier is set
      user.subscriptionTier = SubscriptionTier.FREEMIUM;
    }

    // Check subscription tier requirement
    if (requiredTier) {
      this.checkTierRequirement(user, requiredTier);
    }

    // Check feature access requirement
    if (requiredFeature) {
      this.checkFeatureRequirement(user, requiredFeature);
    }

    // Check usage limits
    if (usageLimitCheck) {
      await this.checkUsageLimitRequirement(user, usageLimitCheck.limitType);
    }

    return true;
  }

  /**
   * Get user's subscription tier from various possible locations
   */
  private getUserTier(user: RequestWithUser['user']): SubscriptionTier | null {
    // Try to get tier from subscription object first
    if (user.subscription?.tier) {
      return user.subscription.tier;
    }

    // Fall back to subscriptionTier property
    if (user.subscriptionTier) {
      return user.subscriptionTier;
    }

    return null;
  }

  /**
   * Check if user meets tier requirement
   */
  private checkTierRequirement(user: RequestWithUser['user'], requiredTier: SubscriptionTier): void {
    const userTier = this.getUserTier(user) || SubscriptionTier.FREEMIUM;

    if (!hasRequiredTier(userTier, requiredTier)) {
      this.logger.warn(
        `User ${user.id} with tier ${userTier} attempted to access ${requiredTier} feature`
      );

      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `This feature requires ${requiredTier} subscription tier or higher`,
        error: 'Insufficient Subscription Tier',
        requiredTier,
        currentTier: userTier,
        upgradeUrl: '/billing/upgrade',
      });
    }
  }

  /**
   * Check if user has access to a specific feature
   */
  private checkFeatureRequirement(user: RequestWithUser['user'], feature: FeatureType): void {
    const userTier = this.getUserTier(user) || SubscriptionTier.FREEMIUM;
    const limits = SUBSCRIPTION_TIER_LIMITS[userTier];

    const hasFeature = this.checkFeatureAccess(limits, feature);

    if (!hasFeature) {
      this.logger.warn(`User ${user.id} with tier ${userTier} attempted to access ${feature} feature`);

      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: `This feature is not available in your current subscription plan`,
        error: 'Feature Not Available',
        feature,
        currentTier: userTier,
        upgradeUrl: '/billing/upgrade',
      });
    }
  }

  /**
   * Check if a specific feature is available for the given limits
   */
  private checkFeatureAccess(limits: SubscriptionTierLimits, feature: FeatureType): boolean {
    switch (feature) {
      case FeatureType.EMAIL_ALERTS:
        return limits.emailAlerts;
      case FeatureType.PRIORITY_SUPPORT:
        return limits.prioritySupport;
      case FeatureType.ADVANCED_ANALYTICS:
        return limits.advancedAnalytics;
      case FeatureType.CUSTOM_BRANDING:
        return limits.customBranding;
      case FeatureType.AUTO_APPLY_ENABLED:
        return limits.autoApplyEnabled;
      case FeatureType.INTERVIEW_PREP_ACCESS:
        return limits.interviewPrepAccess;
      case FeatureType.SALARY_INSIGHTS:
        return limits.salaryInsights;
      case FeatureType.COMPANY_INSIGHTS:
        return limits.companyInsights;
      case FeatureType.DEDICATED_ACCOUNT_MANAGER:
        return limits.dedicatedAccountManager;
      case FeatureType.API_ACCESS:
        return limits.apiAccess;
      default:
        return false;
    }
  }

  /**
   * Check if user has remaining usage for a specific limit type
   */
  private async checkUsageLimitRequirement(
    user: RequestWithUser['user'],
    limitType: UsageLimitType
  ): Promise<void> {
    const userTier = this.getUserTier(user) || SubscriptionTier.FREEMIUM;
    const limits = SUBSCRIPTION_TIER_LIMITS[userTier];

    const limitValue = this.getLimitValue(limits, limitType);

    // -1 means unlimited
    if (limitValue === -1) {
      return;
    }

    // Get current usage from user object
    const currentUsage = this.getCurrentUsage(user, limitType);

    if (currentUsage >= limitValue) {
      this.logger.warn(
        `User ${user.id} exceeded ${limitType} limit: ${currentUsage}/${limitValue}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `You have reached your monthly limit for ${this.getLimitTypeName(limitType)}`,
          error: 'Usage Limit Exceeded',
          limitType,
          currentUsage,
          limit: limitValue,
          currentTier: userTier,
          upgradeUrl: '/billing/upgrade',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }
  }

  /**
   * Get the limit value for a specific usage type
   */
  private getLimitValue(limits: SubscriptionTierLimits, limitType: UsageLimitType): number {
    switch (limitType) {
      case UsageLimitType.JOB_APPLICATIONS:
        return limits.jobApplicationsPerMonth;
      case UsageLimitType.AI_COVER_LETTERS:
        return limits.aiGeneratedCoverLetters;
      case UsageLimitType.RESUME_TEMPLATES:
        return limits.resumeTemplates;
      case UsageLimitType.SAVED_JOBS:
        return limits.savedJobs;
      case UsageLimitType.VIRTUAL_COINS:
        return limits.virtualCoinsPerMonth;
      case UsageLimitType.BOOST_VISIBILITY:
        return limits.boostVisibilitySlots;
      default:
        return 0;
    }
  }

  /**
   * Get current usage for a specific limit type
   */
  private getCurrentUsage(user: RequestWithUser['user'], limitType: UsageLimitType): number {
    if (!user.usage) {
      this.logger.warn(`User ${user.id} has no usage data, defaulting to 0`);
      return 0;
    }

    switch (limitType) {
      case UsageLimitType.JOB_APPLICATIONS:
        return user.usage.jobApplications || 0;
      case UsageLimitType.AI_COVER_LETTERS:
        return user.usage.aiCoverLetters || 0;
      case UsageLimitType.RESUME_TEMPLATES:
        return user.usage.resumeTemplates || 0;
      case UsageLimitType.SAVED_JOBS:
        return user.usage.savedJobs || 0;
      case UsageLimitType.VIRTUAL_COINS:
        return user.usage.virtualCoins || 0;
      case UsageLimitType.BOOST_VISIBILITY:
        return user.usage.boostVisibility || 0;
      default:
        return 0;
    }
  }

  /**
   * Get human-readable name for limit type
   */
  private getLimitTypeName(limitType: UsageLimitType): string {
    switch (limitType) {
      case UsageLimitType.JOB_APPLICATIONS:
        return 'job applications';
      case UsageLimitType.AI_COVER_LETTERS:
        return 'AI-generated cover letters';
      case UsageLimitType.RESUME_TEMPLATES:
        return 'resume templates';
      case UsageLimitType.SAVED_JOBS:
        return 'saved jobs';
      case UsageLimitType.VIRTUAL_COINS:
        return 'virtual coins';
      case UsageLimitType.BOOST_VISIBILITY:
        return 'visibility boost slots';
      default:
        return 'this resource';
    }
  }
}

/**
 * Helper service to get subscription limits programmatically
 * Use this in your services to check limits without using the guard
 */
@Injectable()
export class SubscriptionLimitsService {
  /**
   * Get subscription limits for a specific tier
   */
  getLimits(tier: SubscriptionTier): SubscriptionTierLimits {
    return SUBSCRIPTION_TIER_LIMITS[tier];
  }

  /**
   * Check if a tier has a specific feature
   */
  hasFeature(tier: SubscriptionTier, feature: FeatureType): boolean {
    const limits = this.getLimits(tier);
    const guard = new SubscriptionGuard(null as any);
    return (guard as any).checkFeatureAccess(limits, feature);
  }

  /**
   * Get remaining usage for a user
   */
  getRemainingUsage(
    tier: SubscriptionTier,
    limitType: UsageLimitType,
    currentUsage: number
  ): number {
    const limits = this.getLimits(tier);
    const guard = new SubscriptionGuard(null as any);
    const limit = (guard as any).getLimitValue(limits, limitType);

    if (limit === -1) {
      return -1; // unlimited
    }

    return Math.max(0, limit - currentUsage);
  }

  /**
   * Check if user can perform an action based on current usage
   */
  canPerformAction(
    tier: SubscriptionTier,
    limitType: UsageLimitType,
    currentUsage: number
  ): boolean {
    const limits = this.getLimits(tier);
    const guard = new SubscriptionGuard(null as any);
    const limit = (guard as any).getLimitValue(limits, limitType);

    if (limit === -1) {
      return true; // unlimited
    }

    return currentUsage < limit;
  }
}
