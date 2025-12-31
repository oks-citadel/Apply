import { SetMetadata } from '@nestjs/common';

export const SUBSCRIPTION_KEY = 'subscription_tier';
export const FEATURE_KEY = 'required_feature';
export const USAGE_KEY = 'usage_limit';

/**
 * Subscription tiers for ApplyForUs platform
 */
export enum SubscriptionTier {
  FREEMIUM = 'freemium',
  STARTER = 'starter',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ADVANCED_CAREER = 'advanced_career',
  EXECUTIVE_ELITE = 'executive_elite',
}

export const RequiresTier = (tier: string | SubscriptionTier) => SetMetadata(SUBSCRIPTION_KEY, tier);
export const RequiresFeature = (feature: string) => SetMetadata(FEATURE_KEY, feature);
export const CheckUsageLimit = (feature: string, limit: number) => SetMetadata(USAGE_KEY, { feature, limit });
