import { SetMetadata } from '@nestjs/common';

/**
 * Metadata keys for subscription decorators
 */
export const REQUIRES_TIER_KEY = 'requiresTier';
export const REQUIRES_FEATURE_KEY = 'requiresFeature';
export const CHECK_USAGE_LIMIT_KEY = 'checkUsageLimit';

/**
 * Subscription tier enum (matches payment-service enum)
 */
export enum SubscriptionTier {
  FREEMIUM = 'FREEMIUM',
  STARTER = 'STARTER',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ADVANCED_CAREER = 'ADVANCED_CAREER',
  EXECUTIVE_ELITE = 'EXECUTIVE_ELITE',
}

/**
 * Tier hierarchy for comparison (lower number = lower tier)
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  [SubscriptionTier.FREEMIUM]: 0,
  [SubscriptionTier.STARTER]: 1,
  [SubscriptionTier.BASIC]: 2,
  [SubscriptionTier.PROFESSIONAL]: 3,
  [SubscriptionTier.ADVANCED_CAREER]: 4,
  [SubscriptionTier.EXECUTIVE_ELITE]: 5,
};

/**
 * Usage limit types that can be checked
 */
export enum UsageLimitType {
  JOB_APPLICATIONS = 'jobApplications',
  AI_COVER_LETTERS = 'aiCoverLetters',
  RESUME_TEMPLATES = 'resumeTemplates',
  SAVED_JOBS = 'savedJobs',
  VIRTUAL_COINS = 'virtualCoins',
  BOOST_VISIBILITY = 'boostVisibility',
}

/**
 * Feature types that can be checked
 */
export enum FeatureType {
  EMAIL_ALERTS = 'emailAlerts',
  PRIORITY_SUPPORT = 'prioritySupport',
  ADVANCED_ANALYTICS = 'advancedAnalytics',
  CUSTOM_BRANDING = 'customBranding',
  AUTO_APPLY_ENABLED = 'autoApplyEnabled',
  INTERVIEW_PREP_ACCESS = 'interviewPrepAccess',
  SALARY_INSIGHTS = 'salaryInsights',
  COMPANY_INSIGHTS = 'companyInsights',
  DEDICATED_ACCOUNT_MANAGER = 'dedicatedAccountManager',
  API_ACCESS = 'apiAccess',
}

/**
 * Decorator to require a minimum subscription tier for an endpoint
 *
 * @param tier - Minimum subscription tier required
 *
 * @example
 * ```typescript
 * @RequiresTier(SubscriptionTier.PROFESSIONAL)
 * @Get('advanced-analytics')
 * async getAdvancedAnalytics() {
 *   // Only users with PROFESSIONAL tier or higher can access this
 * }
 * ```
 */
export const RequiresTier = (tier: SubscriptionTier) => SetMetadata(REQUIRES_TIER_KEY, tier);

/**
 * Decorator to require a specific feature to be enabled for the user's subscription
 *
 * @param feature - Feature that must be enabled
 *
 * @example
 * ```typescript
 * @RequiresFeature(FeatureType.ADVANCED_ANALYTICS)
 * @Get('analytics/advanced')
 * async getAdvancedAnalytics() {
 *   // Only users with advanced analytics feature can access this
 * }
 * ```
 */
export const RequiresFeature = (feature: FeatureType) => SetMetadata(REQUIRES_FEATURE_KEY, feature);

/**
 * Decorator to check usage limits before allowing access
 *
 * @param limitType - Type of usage limit to check
 * @param increment - Whether to increment the usage count (default: false)
 *
 * @example
 * ```typescript
 * @CheckUsageLimit(UsageLimitType.JOB_APPLICATIONS, true)
 * @Post('applications')
 * async submitApplication(@Body() dto: CreateApplicationDto) {
 *   // Check if user has remaining job applications for the month
 *   // If increment is true, the usage will be incremented after successful execution
 * }
 * ```
 */
export const CheckUsageLimit = (limitType: UsageLimitType, increment: boolean = false) =>
  SetMetadata(CHECK_USAGE_LIMIT_KEY, { limitType, increment });

/**
 * Utility function to compare subscription tiers
 *
 * @param userTier - User's current subscription tier
 * @param requiredTier - Required subscription tier
 * @returns true if user's tier is equal to or higher than required tier
 */
export function hasRequiredTier(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  const userLevel = TIER_HIERARCHY[userTier];
  const requiredLevel = TIER_HIERARCHY[requiredTier];

  if (userLevel === undefined || requiredLevel === undefined) {
    return false;
  }

  return userLevel >= requiredLevel;
}

/**
 * Combine multiple decorators for comprehensive subscription checking
 *
 * @example
 * ```typescript
 * @RequiresTier(SubscriptionTier.PROFESSIONAL)
 * @RequiresFeature(FeatureType.ADVANCED_ANALYTICS)
 * @CheckUsageLimit(UsageLimitType.AI_COVER_LETTERS)
 * @Post('generate-cover-letter')
 * async generateCoverLetter(@Body() dto: GenerateCoverLetterDto) {
 *   // Checks tier, feature access, and usage limits
 * }
 * ```
 */
