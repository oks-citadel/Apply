import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import {
  FeatureFlagConfig,
  FeatureFlagEvaluationContext,
  FeatureFlagEvaluationResult,
  FeatureFlagServiceOptions,
  FeatureFlagStatus,
  FeatureFlagType,
} from '../types';
import { FeatureFlagEntity } from '../entities/feature-flag.entity';
import { DEFAULT_CACHE_TTL, DEFAULT_REFRESH_INTERVAL } from '../constants';

/**
 * Feature Flag Service
 * Handles feature flag evaluation with caching and percentage rollouts
 */
@Injectable()
export class FeatureFlagService implements OnModuleInit {
  private readonly logger = new Logger(FeatureFlagService.name);
  private readonly cache = new Map<string, FeatureFlagConfig>();
  private refreshTimer?: NodeJS.Timeout;
  private readonly options: Required<FeatureFlagServiceOptions>;

  constructor(
    @InjectRepository(FeatureFlagEntity)
    private readonly featureFlagRepository: Repository<FeatureFlagEntity>,
    private readonly redis?: Redis,
  ) {
    this.options = {
      cacheEnabled: true,
      cacheTTL: DEFAULT_CACHE_TTL,
      refreshInterval: DEFAULT_REFRESH_INTERVAL,
      defaultEnabled: false,
    };
  }

  async onModuleInit() {
    await this.loadFlags();
    this.startRefreshTimer();
  }

  /**
   * Load all feature flags from database into cache
   */
  private async loadFlags(): Promise<void> {
    try {
      const flags = await this.featureFlagRepository.find({
        where: { status: FeatureFlagStatus.ENABLED },
      });

      this.cache.clear();
      flags.forEach((flag) => {
        this.cache.set(flag.key, flag.toConfig());
      });

      this.logger.log(`Loaded ${flags.length} feature flags into cache`);
    } catch (error) {
      this.logger.error('Failed to load feature flags', error);
    }
  }

  /**
   * Start periodic refresh of feature flags
   */
  private startRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(async () => {
      await this.loadFlags();
    }, this.options.refreshInterval);
  }

  /**
   * Check if a feature flag is enabled
   */
  async isEnabled(
    flagKey: string,
    context?: FeatureFlagEvaluationContext,
  ): Promise<boolean> {
    const result = await this.evaluate(flagKey, context);
    return result.enabled;
  }

  /**
   * Check if a feature flag is enabled for a specific user
   */
  async isEnabledForUser(flagKey: string, userId: string): Promise<boolean> {
    return this.isEnabled(flagKey, { userId });
  }

  /**
   * Evaluate a feature flag with full context
   */
  async evaluate(
    flagKey: string,
    context?: FeatureFlagEvaluationContext,
  ): Promise<FeatureFlagEvaluationResult> {
    try {
      // Try to get from cache first
      let flag = this.cache.get(flagKey);

      // If not in cache, try database
      if (!flag && this.options.cacheEnabled) {
        const entity = await this.featureFlagRepository.findOne({
          where: { key: flagKey },
        });

        if (entity) {
          flag = entity.toConfig();
          this.cache.set(flagKey, flag);
        }
      }

      // If flag doesn't exist, return default
      if (!flag) {
        return {
          enabled: this.options.defaultEnabled,
          flagKey,
          reason: 'Flag not found, using default value',
          context,
        };
      }

      // Check if flag is disabled
      if (flag.status === FeatureFlagStatus.DISABLED) {
        return {
          enabled: false,
          flagKey,
          reason: 'Flag is disabled',
          context,
        };
      }

      // Evaluate based on flag type
      const enabled = await this.evaluateFlag(flag, context);

      return {
        enabled,
        flagKey,
        reason: enabled ? 'Flag is enabled' : 'Flag is disabled by rules',
        context,
      };
    } catch (error) {
      this.logger.error(`Error evaluating flag ${flagKey}`, error);
      return {
        enabled: this.options.defaultEnabled,
        flagKey,
        reason: `Error evaluating flag: ${error.message}`,
        context,
      };
    }
  }

  /**
   * Evaluate flag based on type and context
   */
  private async evaluateFlag(
    flag: FeatureFlagConfig,
    context?: FeatureFlagEvaluationContext,
  ): Promise<boolean> {
    // Check user-specific overrides first
    if (context?.userId) {
      // Explicitly disabled users
      if (flag.disabledUserIds?.includes(context.userId)) {
        return false;
      }

      // Explicitly enabled users
      if (flag.enabledUserIds?.includes(context.userId)) {
        return true;
      }
    }

    // Evaluate based on flag type
    switch (flag.type) {
      case FeatureFlagType.BOOLEAN:
        return flag.defaultValue;

      case FeatureFlagType.PERCENTAGE:
        return this.evaluatePercentageRollout(
          flag,
          context?.userId || context?.userEmail || '',
        );

      case FeatureFlagType.USER_LIST:
        return (
          !!context?.userId && (flag.enabledUserIds?.includes(context.userId) ?? false)
        );

      default:
        return flag.defaultValue;
    }
  }

  /**
   * Evaluate percentage rollout
   * Uses consistent hashing to ensure same user always gets same result
   */
  private evaluatePercentageRollout(flag: FeatureFlagConfig, identifier: string): boolean {
    if (!flag.rolloutPercentage || flag.rolloutPercentage === 0) {
      return false;
    }

    if (flag.rolloutPercentage >= 100) {
      return true;
    }

    // Simple hash function for consistent rollout
    const hash = this.hashString(`${flag.key}:${identifier}`);
    const percentage = hash % 100;

    return percentage < flag.rolloutPercentage;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<FeatureFlagConfig[]> {
    const flags = await this.featureFlagRepository.find();
    return flags.map((flag) => flag.toConfig());
  }

  /**
   * Get all enabled flags for a user
   */
  async getEnabledFlagsForUser(userId: string): Promise<string[]> {
    const allFlags = Array.from(this.cache.values());
    const enabledFlags: string[] = [];

    for (const flag of allFlags) {
      const isEnabled = await this.isEnabledForUser(flag.key, userId);
      if (isEnabled) {
        enabledFlags.push(flag.key);
      }
    }

    return enabledFlags;
  }

  /**
   * Get a specific flag configuration
   */
  async getFlag(flagKey: string): Promise<FeatureFlagConfig | null> {
    const flag = this.cache.get(flagKey);
    if (flag) {
      return flag;
    }

    const entity = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    return entity ? entity.toConfig() : null;
  }

  /**
   * Refresh cache for a specific flag
   */
  async refreshFlag(flagKey: string): Promise<void> {
    const entity = await this.featureFlagRepository.findOne({
      where: { key: flagKey },
    });

    if (entity) {
      this.cache.set(flagKey, entity.toConfig());
    } else {
      this.cache.delete(flagKey);
    }
  }

  /**
   * Clear all cached flags and reload from database
   */
  async refreshAll(): Promise<void> {
    await this.loadFlags();
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }
}
