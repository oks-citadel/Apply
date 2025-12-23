import { SetMetadata, applyDecorators } from '@nestjs/common';

/**
 * Metadata key for feature gating configuration
 */
export const FEATURE_GATED_KEY = 'feature_gated';

/**
 * Subscription tier enum for feature gating
 * These should match the tiers defined in the security package
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
 * Feature entitlement definition - maps features to minimum required tiers
 */
export interface FeatureEntitlement {
  /** Minimum subscription tier required for this feature */
  minimumTier?: SubscriptionTier;
  /** Feature flags that must be enabled (AND logic) */
  requiredFlags?: string[];
  /** Feature flags where at least one must be enabled (OR logic) */
  anyFlags?: string[];
  /** Specific user roles that can bypass tier requirements */
  bypassRoles?: string[];
  /** Whether to allow access for beta testers regardless of tier */
  allowBetaTesters?: boolean;
  /** Custom entitlement check function name (resolved at runtime) */
  customCheck?: string;
}

/**
 * Configuration for the @FeatureGated decorator
 */
export interface FeatureGatedConfig {
  /**
   * Name/identifier of the feature being gated
   * Used for logging and error messages
   */
  feature: string;

  /**
   * Description of the feature for logging purposes
   */
  description?: string;

  /**
   * Minimum subscription tier required to access this feature
   * If not specified, tier check is skipped
   */
  minimumTier?: SubscriptionTier;

  /**
   * Feature flag key that must be enabled
   * If not specified, flag check is skipped
   */
  flagKey?: string;

  /**
   * Multiple feature flags that must ALL be enabled (AND logic)
   */
  requiredFlags?: string[];

  /**
   * Multiple feature flags where at least ONE must be enabled (OR logic)
   */
  anyFlags?: string[];

  /**
   * Roles that can bypass all feature gating checks
   * e.g., ['admin', 'superuser']
   */
  bypassRoles?: string[];

  /**
   * Allow beta testers to access regardless of tier
   */
  allowBetaTesters?: boolean;

  /**
   * Fail silently (return empty data) instead of throwing 403
   */
  failSilently?: boolean;

  /**
   * Custom error message when access is denied
   */
  errorMessage?: string;

  /**
   * Whether to log access attempts (default: true)
   */
  logAccess?: boolean;

  /**
   * Whether to log denied attempts with WARNING level (default: true)
   */
  logDenied?: boolean;

  /**
   * Additional metadata for audit logging
   */
  auditMetadata?: Record<string, any>;
}

/**
 * Feature gating result for logging and responses
 */
export interface FeatureGatingResult {
  allowed: boolean;
  feature: string;
  reason: string;
  userId?: string;
  userTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  flagsChecked?: string[];
  flagsEnabled?: string[];
  timestamp: Date;
}

/**
 * Predefined feature entitlements for common features
 * Maps feature names to their entitlement requirements
 */
export const FEATURE_ENTITLEMENTS: Record<string, FeatureEntitlement> = {
  // AI Features
  'ai.resume-builder': {
    minimumTier: SubscriptionTier.STARTER,
    requiredFlags: ['FEATURE_AI_RESUME_BUILDER'],
  },
  'ai.cover-letter-generator': {
    minimumTier: SubscriptionTier.STARTER,
    requiredFlags: ['AI_SUGGESTIONS_ENABLED'],
  },
  'ai.salary-prediction': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['SALARY_PREDICTION_ENABLED'],
  },
  'ai.resume-optimization': {
    minimumTier: SubscriptionTier.BASIC,
    requiredFlags: ['RESUME_OPTIMIZATION_ENABLED'],
  },

  // Auto-Apply Features
  'auto-apply.basic': {
    minimumTier: SubscriptionTier.BASIC,
    requiredFlags: ['FEATURE_AUTO_APPLY'],
  },
  'auto-apply.linkedin': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['FEATURE_AUTO_APPLY', 'LINKEDIN_AUTO_APPLY_ENABLED'],
  },
  'auto-apply.indeed': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['FEATURE_AUTO_APPLY', 'INDEED_AUTO_APPLY_ENABLED'],
  },
  'auto-apply.glassdoor': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['FEATURE_AUTO_APPLY', 'GLASSDOOR_AUTO_APPLY_ENABLED'],
  },

  // Analytics Features
  'analytics.basic': {
    minimumTier: SubscriptionTier.STARTER,
    requiredFlags: ['ENABLE_ANALYTICS'],
  },
  'analytics.advanced': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['ADVANCED_ANALYTICS_ENABLED'],
  },
  'analytics.dashboard': {
    minimumTier: SubscriptionTier.BASIC,
    requiredFlags: ['FEATURE_ANALYTICS_DASHBOARD'],
  },

  // Premium Features
  'premium.templates': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['PREMIUM_TEMPLATES_ENABLED'],
  },
  'premium.priority-support': {
    minimumTier: SubscriptionTier.PROFESSIONAL,
    requiredFlags: ['PRIORITY_SUPPORT_ENABLED'],
  },

  // Admin Features
  'admin.dashboard': {
    minimumTier: SubscriptionTier.EXECUTIVE_ELITE,
    requiredFlags: ['ADMIN_DASHBOARD_ENABLED'],
    bypassRoles: ['admin', 'superuser'],
  },
  'admin.user-impersonation': {
    minimumTier: SubscriptionTier.EXECUTIVE_ELITE,
    requiredFlags: ['USER_IMPERSONATION_ENABLED'],
    bypassRoles: ['admin', 'superuser'],
  },

  // Extension Features
  'extension.chrome': {
    minimumTier: SubscriptionTier.BASIC,
    requiredFlags: ['FEATURE_CHROME_EXTENSION'],
  },

  // Notification Features
  'notifications.email': {
    minimumTier: SubscriptionTier.STARTER,
    requiredFlags: ['EMAIL_NOTIFICATIONS_ENABLED'],
  },
  'notifications.push': {
    minimumTier: SubscriptionTier.BASIC,
    requiredFlags: ['PUSH_NOTIFICATIONS_ENABLED'],
  },
};

/**
 * @FeatureGated() Decorator
 *
 * Comprehensive feature gating decorator that combines:
 * - Subscription tier verification
 * - Feature flag checking
 * - Role-based bypass
 * - Access logging
 *
 * @param config - Feature gating configuration
 *
 * @example
 * // Simple usage with feature name that maps to predefined entitlements
 * @FeatureGated({ feature: 'ai.resume-builder' })
 *
 * @example
 * // Full configuration
 * @FeatureGated({
 *   feature: 'advanced-analytics',
 *   description: 'Advanced analytics dashboard',
 *   minimumTier: SubscriptionTier.PROFESSIONAL,
 *   flagKey: 'ADVANCED_ANALYTICS_ENABLED',
 *   bypassRoles: ['admin'],
 *   logAccess: true
 * })
 *
 * @example
 * // With multiple flags (AND logic)
 * @FeatureGated({
 *   feature: 'linkedin-auto-apply',
 *   minimumTier: SubscriptionTier.PROFESSIONAL,
 *   requiredFlags: ['FEATURE_AUTO_APPLY', 'LINKEDIN_AUTO_APPLY_ENABLED']
 * })
 *
 * @example
 * // With multiple flags (OR logic)
 * @FeatureGated({
 *   feature: 'auto-apply',
 *   minimumTier: SubscriptionTier.BASIC,
 *   anyFlags: ['LINKEDIN_AUTO_APPLY_ENABLED', 'INDEED_AUTO_APPLY_ENABLED', 'GLASSDOOR_AUTO_APPLY_ENABLED']
 * })
 */
export const FeatureGated = (config: FeatureGatedConfig | string) => {
  // Allow simple string usage for predefined features
  const resolvedConfig: FeatureGatedConfig = typeof config === 'string'
    ? { feature: config, ...FEATURE_ENTITLEMENTS[config] }
    : config;

  // Merge with predefined entitlements if feature name matches
  if (typeof config !== 'string' && FEATURE_ENTITLEMENTS[config.feature]) {
    const entitlement = FEATURE_ENTITLEMENTS[config.feature];
    resolvedConfig.minimumTier = resolvedConfig.minimumTier ?? entitlement.minimumTier;
    resolvedConfig.requiredFlags = resolvedConfig.requiredFlags ?? entitlement.requiredFlags;
    resolvedConfig.anyFlags = resolvedConfig.anyFlags ?? entitlement.anyFlags;
    resolvedConfig.bypassRoles = resolvedConfig.bypassRoles ?? entitlement.bypassRoles;
    resolvedConfig.allowBetaTesters = resolvedConfig.allowBetaTesters ?? entitlement.allowBetaTesters;
  }

  // Apply defaults
  const finalConfig: FeatureGatedConfig = {
    logAccess: true,
    logDenied: true,
    failSilently: false,
    ...resolvedConfig,
  };

  return applyDecorators(
    SetMetadata(FEATURE_GATED_KEY, finalConfig),
  );
};

/**
 * Shorthand decorator for tier-only gating
 *
 * @example
 * @RequireTier(SubscriptionTier.PROFESSIONAL)
 * async getProfessionalFeature() { ... }
 */
export const RequireTier = (tier: SubscriptionTier, feature?: string) =>
  FeatureGated({
    feature: feature || `tier-${tier.toLowerCase()}`,
    minimumTier: tier,
  });

/**
 * Shorthand decorator for flag-only gating
 *
 * @example
 * @RequireFlag('FEATURE_AUTO_APPLY')
 * async autoApply() { ... }
 */
export const RequireFlag = (flagKey: string, feature?: string) =>
  FeatureGated({
    feature: feature || flagKey,
    flagKey,
  });

/**
 * Shorthand decorator for multiple flags (AND)
 *
 * @example
 * @RequireAllFlags(['FLAG_A', 'FLAG_B'])
 * async combinedFeature() { ... }
 */
export const RequireAllGatedFlags = (flags: string[], feature?: string) =>
  FeatureGated({
    feature: feature || flags.join('+'),
    requiredFlags: flags,
  });

/**
 * Shorthand decorator for multiple flags (OR)
 *
 * @example
 * @RequireAnyFlags(['FLAG_A', 'FLAG_B'])
 * async flexibleFeature() { ... }
 */
export const RequireAnyGatedFlag = (flags: string[], feature?: string) =>
  FeatureGated({
    feature: feature || flags.join('|'),
    anyFlags: flags,
  });

/**
 * Utility function to check if a user tier meets the minimum requirement
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
 * Get the display name for a subscription tier
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const displayNames: Record<SubscriptionTier, string> = {
    [SubscriptionTier.FREEMIUM]: 'Free',
    [SubscriptionTier.STARTER]: 'Starter',
    [SubscriptionTier.BASIC]: 'Basic',
    [SubscriptionTier.PROFESSIONAL]: 'Professional',
    [SubscriptionTier.ADVANCED_CAREER]: 'Advanced Career',
    [SubscriptionTier.EXECUTIVE_ELITE]: 'Executive Elite',
  };
  return displayNames[tier] || tier;
}
