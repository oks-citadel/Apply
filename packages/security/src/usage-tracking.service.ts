import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Usage data structure for tracking user consumption
 */
export interface UsageData {
  userId: string;
  jobApplications: number;
  aiCoverLetters: number;
  resumeTemplates: number;
  savedJobs: number;
  virtualCoins: number;
  boostVisibility: number;
  periodStart: Date;
  periodEnd: Date;
  lastUpdated: Date;
}

/**
 * Usage increment event for event sourcing
 */
export interface UsageIncrementEvent {
  userId: string;
  usageType: string;
  amount: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Usage types for tracking
 */
export enum UsageType {
  JOB_APPLICATIONS = 'jobApplications',
  AI_COVER_LETTERS = 'aiCoverLetters',
  RESUME_TEMPLATES = 'resumeTemplates',
  SAVED_JOBS = 'savedJobs',
  VIRTUAL_COINS = 'virtualCoins',
  BOOST_VISIBILITY = 'boostVisibility',
}

/**
 * Interface for usage repository (to be implemented by each service)
 */
export interface UsageRepository {
  findByUserId(userId: string): Promise<UsageData | null>;
  save(usage: UsageData): Promise<UsageData>;
  incrementField(userId: string, field: string, amount: number): Promise<UsageData>;
  resetMonthlyUsage(userId: string): Promise<UsageData>;
}

/**
 * Usage Tracking Service
 *
 * Provides centralized usage tracking functionality for subscription limits.
 * This service should be used by other services to track and validate usage.
 *
 * @example
 * ```typescript
 * // In your service
 * @Injectable()
 * export class JobApplicationService {
 *   constructor(private usageTrackingService: UsageTrackingService) {}
 *
 *   async applyToJob(userId: string, jobId: string) {
 *     // Check if user can apply
 *     const canApply = await this.usageTrackingService.canIncrement(
 *       userId,
 *       UsageType.JOB_APPLICATIONS,
 *       userTier
 *     );
 *
 *     if (!canApply) {
 *       throw new ForbiddenException('Monthly application limit reached');
 *     }
 *
 *     // Perform application
 *     await this.createApplication(userId, jobId);
 *
 *     // Increment usage
 *     await this.usageTrackingService.incrementUsage(
 *       userId,
 *       UsageType.JOB_APPLICATIONS
 *     );
 *   }
 * }
 * ```
 */
@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);
  private readonly CACHE_PREFIX = 'usage:';
  private readonly CACHE_TTL = 300; // 5 minutes

  // In-memory fallback when no cache manager is available
  private memoryCache: Map<string, { data: UsageData; expiry: number }> = new Map();

  constructor(
    @Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache,
    @Optional() @Inject('USAGE_REPOSITORY') private usageRepository?: UsageRepository,
  ) {}

  /**
   * Get current usage for a user
   */
  async getUserUsage(userId: string): Promise<UsageData> {
    // Try cache first
    const cached = await this.getFromCache(userId);
    if (cached) {
      return cached;
    }

    // Fetch from repository
    let usage = await this.fetchFromRepository(userId);

    if (!usage) {
      // Initialize usage for new user
      usage = this.initializeUsage(userId);
    }

    // Check if we need to reset for new period
    if (this.isNewPeriod(usage)) {
      usage = await this.resetForNewPeriod(userId, usage);
    }

    // Cache the result
    await this.setCache(userId, usage);

    return usage;
  }

  /**
   * Increment usage for a specific type
   */
  async incrementUsage(
    userId: string,
    usageType: UsageType | string,
    amount: number = 1,
    metadata?: Record<string, any>,
  ): Promise<UsageData> {
    this.logger.log(`Incrementing ${usageType} by ${amount} for user ${userId}`);

    // Get current usage
    let usage = await this.getUserUsage(userId);

    // Increment the appropriate field
    const field = this.getFieldName(usageType);
    if (field && field in usage) {
      (usage as any)[field] += amount;
      usage.lastUpdated = new Date();

      // Persist if repository is available
      if (this.usageRepository) {
        usage = await this.usageRepository.save(usage);
      }

      // Update cache
      await this.setCache(userId, usage);

      // Emit event for analytics
      this.emitUsageEvent({
        userId,
        usageType: field,
        amount,
        timestamp: new Date(),
        metadata,
      });
    }

    return usage;
  }

  /**
   * Check if user can increment usage (has remaining quota)
   */
  async canIncrement(
    userId: string,
    usageType: UsageType | string,
    tier: string,
    amount: number = 1,
  ): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    const usage = await this.getUserUsage(userId);
    const field = this.getFieldName(usageType);
    const currentUsage = (usage as any)[field] || 0;

    // Get limit for tier (imported from subscription guard)
    const limit = this.getLimitForTier(tier, field);

    // -1 means unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1, limit: -1 };
    }

    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage + amount <= limit;

    return { allowed, remaining, limit };
  }

  /**
   * Reset monthly usage for a user
   */
  async resetMonthlyUsage(userId: string): Promise<UsageData> {
    this.logger.log(`Resetting monthly usage for user ${userId}`);

    let usage = await this.getUserUsage(userId);
    usage = this.initializeUsage(userId);

    if (this.usageRepository) {
      usage = await this.usageRepository.save(usage);
    }

    await this.setCache(userId, usage);

    return usage;
  }

  /**
   * Get usage summary for a user
   */
  async getUsageSummary(userId: string, tier: string): Promise<Record<string, { used: number; limit: number; remaining: number }>> {
    const usage = await this.getUserUsage(userId);

    const summary: Record<string, { used: number; limit: number; remaining: number }> = {};

    for (const usageType of Object.values(UsageType)) {
      const used = (usage as any)[usageType] || 0;
      const limit = this.getLimitForTier(tier, usageType);
      const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

      summary[usageType] = { used, limit, remaining };
    }

    return summary;
  }

  /**
   * Clear cache for a user
   */
  async clearUserCache(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);

    if (this.cacheManager) {
      await this.cacheManager.del(cacheKey);
    }

    this.memoryCache.delete(cacheKey);
  }

  // ==================== Private Methods ====================

  private getCacheKey(userId: string): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  private async getFromCache(userId: string): Promise<UsageData | null> {
    const cacheKey = this.getCacheKey(userId);

    // Try cache manager first
    if (this.cacheManager) {
      const cached = await this.cacheManager.get<UsageData>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Fall back to memory cache
    const memoryCached = this.memoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return memoryCached.data;
    }

    return null;
  }

  private async setCache(userId: string, usage: UsageData): Promise<void> {
    const cacheKey = this.getCacheKey(userId);

    if (this.cacheManager) {
      await this.cacheManager.set(cacheKey, usage, this.CACHE_TTL * 1000);
    }

    // Also set in memory cache as fallback
    this.memoryCache.set(cacheKey, {
      data: usage,
      expiry: Date.now() + this.CACHE_TTL * 1000,
    });
  }

  private async fetchFromRepository(userId: string): Promise<UsageData | null> {
    if (!this.usageRepository) {
      return null;
    }

    return this.usageRepository.findByUserId(userId);
  }

  private initializeUsage(userId: string): UsageData {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return {
      userId,
      jobApplications: 0,
      aiCoverLetters: 0,
      resumeTemplates: 0,
      savedJobs: 0,
      virtualCoins: 0,
      boostVisibility: 0,
      periodStart,
      periodEnd,
      lastUpdated: now,
    };
  }

  private isNewPeriod(usage: UsageData): boolean {
    const now = new Date();
    return now > usage.periodEnd;
  }

  private async resetForNewPeriod(userId: string, oldUsage: UsageData): Promise<UsageData> {
    this.logger.log(`Resetting usage for new period for user ${userId}`);
    return this.initializeUsage(userId);
  }

  private getFieldName(usageType: UsageType | string): string {
    if (typeof usageType === 'string') {
      // Handle string usage types
      const mapping: Record<string, string> = {
        jobApplications: 'jobApplications',
        aiCoverLetters: 'aiCoverLetters',
        resumeTemplates: 'resumeTemplates',
        savedJobs: 'savedJobs',
        virtualCoins: 'virtualCoins',
        boostVisibility: 'boostVisibility',
        job_applications: 'jobApplications',
        ai_cover_letters: 'aiCoverLetters',
        resume_templates: 'resumeTemplates',
        saved_jobs: 'savedJobs',
        virtual_coins: 'virtualCoins',
        boost_visibility: 'boostVisibility',
      };
      return mapping[usageType] || usageType;
    }
    return usageType;
  }

  private getLimitForTier(tier: string, field: string): number {
    // Tier limits (matching subscription.guard.ts)
    const limits: Record<string, Record<string, number>> = {
      freemium: {
        jobApplications: 5,
        aiCoverLetters: 2,
        resumeTemplates: 2,
        savedJobs: 10,
        virtualCoins: 25,
        boostVisibility: 0,
      },
      starter: {
        jobApplications: 30,
        aiCoverLetters: 15,
        resumeTemplates: 5,
        savedJobs: 50,
        virtualCoins: 300,
        boostVisibility: 2,
      },
      basic: {
        jobApplications: 75,
        aiCoverLetters: 40,
        resumeTemplates: 10,
        savedJobs: 150,
        virtualCoins: 750,
        boostVisibility: 5,
      },
      professional: {
        jobApplications: 200,
        aiCoverLetters: 100,
        resumeTemplates: -1,
        savedJobs: 500,
        virtualCoins: 2000,
        boostVisibility: 15,
      },
      advanced_career: {
        jobApplications: 500,
        aiCoverLetters: 300,
        resumeTemplates: -1,
        savedJobs: -1,
        virtualCoins: 5000,
        boostVisibility: 30,
      },
      executive_elite: {
        jobApplications: -1,
        aiCoverLetters: -1,
        resumeTemplates: -1,
        savedJobs: -1,
        virtualCoins: -1,
        boostVisibility: -1,
      },
    };

    const tierLimits = limits[tier.toLowerCase()];
    if (!tierLimits) {
      return limits.freemium[field] || 0;
    }

    return tierLimits[field] ?? 0;
  }

  private emitUsageEvent(event: UsageIncrementEvent): void {
    // This could emit to a message queue for analytics
    this.logger.debug(`Usage event: ${JSON.stringify(event)}`);
  }
}
