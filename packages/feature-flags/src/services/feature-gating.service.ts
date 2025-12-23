import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import {
  SubscriptionTier,
  TIER_HIERARCHY,
  FeatureGatedConfig,
  FeatureGatingResult,
  FEATURE_ENTITLEMENTS,
  hasRequiredTier,
  getTierDisplayName,
} from '../decorators/feature-gated.decorator';
import {
  FeatureAccessLogger,
  FEATURE_ACCESS_LOGGER,
} from '../guards/feature-gated.guard';

/**
 * User context for feature gating checks
 */
export interface FeatureGatingUserContext {
  id: string;
  email?: string;
  roles?: string[];
  subscriptionTier?: SubscriptionTier;
  subscription?: {
    tier: SubscriptionTier;
    status: string;
    hasAccess: boolean;
  };
  isBetaTester?: boolean;
  features?: string[];
}

/**
 * Result of a feature availability check
 */
export interface FeatureAvailabilityResult {
  available: boolean;
  reason: string;
  feature: string;
  userTier: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  missingFlags?: string[];
  upgradeRequired?: boolean;
  upgradeUrl?: string;
}

/**
 * FeatureGatingService
 *
 * Injectable service for programmatic feature gating checks.
 * Use this service when you need to check feature access outside of
 * route guards, such as in business logic, conditional rendering, etc.
 *
 * @example
 * // In a service
 * @Injectable()
 * export class MyService {
 *   constructor(private readonly featureGating: FeatureGatingService) {}
 *
 *   async doSomething(userId: string, userTier: SubscriptionTier) {
 *     const canAccess = await this.featureGating.canAccessFeature(
 *       'ai.resume-builder',
 *       { id: userId, subscriptionTier: userTier }
 *     );
 *
 *     if (!canAccess.available) {
 *       return { error: canAccess.reason, upgradeUrl: canAccess.upgradeUrl };
 *     }
 *
 *     // Proceed with feature...
 *   }
 * }
 */
@Injectable()
export class FeatureGatingService {
  private readonly logger = new Logger(FeatureGatingService.name);

  constructor(
    @Optional()
    private readonly featureFlagService?: FeatureFlagService,
    @Optional()
    @Inject(FEATURE_ACCESS_LOGGER)
    private readonly accessLogger?: FeatureAccessLogger,
  ) {}

  /**
   * Check if a user can access a specific feature
   *
   * @param feature - Feature name or FeatureGatedConfig
   * @param user - User context for the check
   * @returns FeatureAvailabilityResult with access status and details
   */
  async canAccessFeature(
    feature: string | FeatureGatedConfig,
    user: FeatureGatingUserContext,
  ): Promise<FeatureAvailabilityResult> {
    // Resolve configuration
    const config: FeatureGatedConfig = typeof feature === 'string'
      ? { feature, ...FEATURE_ENTITLEMENTS[feature] }
      : feature;

    const userTier = this.getUserTier(user);

    const result: FeatureAvailabilityResult = {
      available: false,
      reason: '',
      feature: config.feature,
      userTier,
      requiredTier: config.minimumTier,
    };

    try {
      // Check role bypass
      if (this.checkRoleBypass(user, config)) {
        result.available = true;
        result.reason = 'Access granted via role bypass';
        await this.logCheck(config, user, result);
        return result;
      }

      // Check beta tester bypass
      if (this.checkBetaTesterBypass(user, config)) {
        result.available = true;
        result.reason = 'Access granted as beta tester';
        await this.logCheck(config, user, result);
        return result;
      }

      // Check tier requirement
      if (config.minimumTier) {
        if (!hasRequiredTier(userTier, config.minimumTier)) {
          result.available = false;
          result.reason = `Requires ${getTierDisplayName(config.minimumTier)} tier or higher`;
          result.upgradeRequired = true;
          result.upgradeUrl = '/billing/upgrade';
          await this.logCheck(config, user, result);
          return result;
        }
      }

      // Check feature flags
      const flagResult = await this.checkFeatureFlags(user, config);
      if (!flagResult.passed) {
        result.available = false;
        result.reason = flagResult.reason;
        result.missingFlags = flagResult.missingFlags;
        await this.logCheck(config, user, result);
        return result;
      }

      // All checks passed
      result.available = true;
      result.reason = 'Feature is available';
      await this.logCheck(config, user, result);
      return result;

    } catch (error) {
      this.logger.error(
        `Error checking feature access for ${config.feature}`,
        error instanceof Error ? error.stack : error,
      );
      result.reason = 'Error checking feature access';
      return result;
    }
  }

  /**
   * Check if a user has a specific subscription tier or higher
   */
  hasMinimumTier(user: FeatureGatingUserContext, requiredTier: SubscriptionTier): boolean {
    const userTier = this.getUserTier(user);
    return hasRequiredTier(userTier, requiredTier);
  }

  /**
   * Check if a feature flag is enabled for a user
   */
  async isFeatureFlagEnabled(flagKey: string, user: FeatureGatingUserContext): Promise<boolean> {
    if (!this.featureFlagService) {
      this.logger.warn('FeatureFlagService not available');
      return false;
    }

    return this.featureFlagService.isEnabled(flagKey, {
      userId: user.id,
      userEmail: user.email,
    });
  }

  /**
   * Get all features available for a user based on their tier
   */
  getAvailableFeatures(user: FeatureGatingUserContext): string[] {
    const userTier = this.getUserTier(user);
    const availableFeatures: string[] = [];

    for (const [feature, entitlement] of Object.entries(FEATURE_ENTITLEMENTS)) {
      if (!entitlement.minimumTier || hasRequiredTier(userTier, entitlement.minimumTier)) {
        availableFeatures.push(feature);
      }
    }

    return availableFeatures;
  }

  /**
   * Get features that require upgrade for a user
   */
  getUpgradeRequiredFeatures(user: FeatureGatingUserContext): Array<{
    feature: string;
    requiredTier: SubscriptionTier;
  }> {
    const userTier = this.getUserTier(user);
    const upgradeRequired: Array<{ feature: string; requiredTier: SubscriptionTier }> = [];

    for (const [feature, entitlement] of Object.entries(FEATURE_ENTITLEMENTS)) {
      if (entitlement.minimumTier && !hasRequiredTier(userTier, entitlement.minimumTier)) {
        upgradeRequired.push({
          feature,
          requiredTier: entitlement.minimumTier,
        });
      }
    }

    return upgradeRequired;
  }

  /**
   * Get the next tier that unlocks more features
   */
  getNextTierWithNewFeatures(currentTier: SubscriptionTier): {
    tier: SubscriptionTier | null;
    newFeatures: string[];
  } {
    const currentLevel = TIER_HIERARCHY[currentTier];
    let nextTier: SubscriptionTier | null = null;
    let minLevel = Infinity;

    // Find the next tier level
    for (const [tier, level] of Object.entries(TIER_HIERARCHY)) {
      if (level > currentLevel && level < minLevel) {
        minLevel = level;
        nextTier = tier as SubscriptionTier;
      }
    }

    if (!nextTier) {
      return { tier: null, newFeatures: [] };
    }

    // Find features unlocked by the next tier
    const newFeatures: string[] = [];
    for (const [feature, entitlement] of Object.entries(FEATURE_ENTITLEMENTS)) {
      if (entitlement.minimumTier) {
        const requiredLevel = TIER_HIERARCHY[entitlement.minimumTier];
        if (requiredLevel > currentLevel && requiredLevel <= minLevel) {
          newFeatures.push(feature);
        }
      }
    }

    return { tier: nextTier, newFeatures };
  }

  /**
   * Batch check multiple features for a user
   */
  async checkMultipleFeatures(
    features: string[],
    user: FeatureGatingUserContext,
  ): Promise<Map<string, FeatureAvailabilityResult>> {
    const results = new Map<string, FeatureAvailabilityResult>();

    await Promise.all(
      features.map(async (feature) => {
        const result = await this.canAccessFeature(feature, user);
        results.set(feature, result);
      }),
    );

    return results;
  }

  /**
   * Get user's subscription tier
   */
  private getUserTier(user: FeatureGatingUserContext): SubscriptionTier {
    if (user.subscription?.tier) {
      return user.subscription.tier;
    }
    if (user.subscriptionTier) {
      return user.subscriptionTier;
    }
    return SubscriptionTier.FREEMIUM;
  }

  /**
   * Check role bypass
   */
  private checkRoleBypass(
    user: FeatureGatingUserContext,
    config: FeatureGatedConfig,
  ): boolean {
    if (!config.bypassRoles || config.bypassRoles.length === 0) {
      return false;
    }
    if (!user.roles || user.roles.length === 0) {
      return false;
    }
    return config.bypassRoles.some((role) => user.roles?.includes(role));
  }

  /**
   * Check beta tester bypass
   */
  private checkBetaTesterBypass(
    user: FeatureGatingUserContext,
    config: FeatureGatedConfig,
  ): boolean {
    return !!config.allowBetaTesters && !!user.isBetaTester;
  }

  /**
   * Check feature flags
   */
  private async checkFeatureFlags(
    user: FeatureGatingUserContext,
    config: FeatureGatedConfig,
  ): Promise<{
    passed: boolean;
    reason: string;
    missingFlags?: string[];
  }> {
    const allFlags: string[] = [];
    if (config.flagKey) {
      allFlags.push(config.flagKey);
    }
    if (config.requiredFlags) {
      allFlags.push(...config.requiredFlags);
    }
    if (config.anyFlags) {
      allFlags.push(...config.anyFlags);
    }

    if (allFlags.length === 0) {
      return { passed: true, reason: 'No flags required' };
    }

    if (!this.featureFlagService) {
      return { passed: true, reason: 'Flag service not available' };
    }

    const enabledFlags: string[] = [];
    const missingFlags: string[] = [];

    await Promise.all(
      allFlags.map(async (flag) => {
        const enabled = await this.featureFlagService!.isEnabled(flag, {
          userId: user.id,
          userEmail: user.email,
        });
        if (enabled) {
          enabledFlags.push(flag);
        } else {
          missingFlags.push(flag);
        }
      }),
    );

    // Single flag check
    if (config.flagKey && !enabledFlags.includes(config.flagKey)) {
      return {
        passed: false,
        reason: `Feature flag ${config.flagKey} is not enabled`,
        missingFlags: [config.flagKey],
      };
    }

    // Required flags (AND)
    if (config.requiredFlags) {
      const missing = config.requiredFlags.filter((f) => !enabledFlags.includes(f));
      if (missing.length > 0) {
        return {
          passed: false,
          reason: `Required flags not enabled: ${missing.join(', ')}`,
          missingFlags: missing,
        };
      }
    }

    // Any flags (OR)
    if (config.anyFlags) {
      const anyEnabled = config.anyFlags.some((f) => enabledFlags.includes(f));
      if (!anyEnabled) {
        return {
          passed: false,
          reason: `None of the feature flags are enabled`,
          missingFlags: config.anyFlags,
        };
      }
    }

    return { passed: true, reason: 'All flags enabled' };
  }

  /**
   * Log feature check
   */
  private async logCheck(
    config: FeatureGatedConfig,
    user: FeatureGatingUserContext,
    result: FeatureAvailabilityResult,
  ): Promise<void> {
    const gatingResult: FeatureGatingResult = {
      allowed: result.available,
      feature: result.feature,
      reason: result.reason,
      userId: user.id,
      userTier: result.userTier,
      requiredTier: result.requiredTier,
      timestamp: new Date(),
    };

    if (this.accessLogger) {
      try {
        await this.accessLogger.logFeatureAccess(gatingResult);
      } catch (error) {
        this.logger.error('Failed to log feature check', error);
      }
    }
  }
}
