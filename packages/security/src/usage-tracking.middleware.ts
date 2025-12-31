import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * User usage data interface
 */
export interface UserUsageData {
  jobApplications: number;
  aiCoverLetters: number;
  resumeTemplates: number;
  savedJobs: number;
  virtualCoins: number;
  boostVisibility: number;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Extended request with user and usage data
 */
export interface RequestWithUsage extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionTier?: string;
    subscription?: {
      tier: string;
      status: string;
      hasAccess: boolean;
    };
    usage?: UserUsageData;
  };
}

/**
 * Interface for usage tracking service that can be injected
 */
export interface UsageTrackingService {
  getUserUsage(userId: string): Promise<UserUsageData>;
  incrementUsage(userId: string, usageType: string, amount?: number): Promise<void>;
  resetMonthlyUsage(userId: string): Promise<void>;
}

/**
 * Usage Tracking Middleware
 *
 * Fetches and attaches current user usage to the request object.
 * This enables the SubscriptionGuard to enforce usage limits.
 *
 * Prerequisites:
 * - Must run AFTER authentication middleware
 * - Requires a UsageTrackingService to be provided
 *
 * @example
 * ```typescript
 * // In your module
 * @Module({
 *   providers: [
 *     {
 *       provide: 'USAGE_TRACKING_SERVICE',
 *       useClass: YourUsageTrackingService,
 *     },
 *   ],
 * })
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(UsageTrackingMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class UsageTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(UsageTrackingMiddleware.name);
  private usageCache: Map<string, { data: UserUsageData; expiry: number }> = new Map();
  private readonly cacheTTL = 60000; // 1 minute cache

  constructor(
    private readonly usageTrackingService?: UsageTrackingService,
  ) {}

  async use(req: RequestWithUsage, res: Response, next: NextFunction) {
    // Skip if no user or no tracking service
    if (!req.user?.id) {
      return next();
    }

    try {
      const userId = req.user.id;

      // Check cache first
      const cached = this.usageCache.get(userId);
      if (cached && cached.expiry > Date.now()) {
        req.user.usage = cached.data;
        return next();
      }

      // Fetch fresh usage data
      if (this.usageTrackingService) {
        const usage = await this.usageTrackingService.getUserUsage(userId);
        req.user.usage = usage;

        // Update cache
        this.usageCache.set(userId, {
          data: usage,
          expiry: Date.now() + this.cacheTTL,
        });
      } else {
        // Default to zero usage if no service available
        req.user.usage = this.getDefaultUsage();
      }
    } catch (error) {
      this.logger.error(`Failed to fetch usage for user ${req.user.id}: ${error.message}`);
      // Default to zero usage on error to prevent blocking
      req.user.usage = this.getDefaultUsage();
    }

    next();
  }

  private getDefaultUsage(): UserUsageData {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      jobApplications: 0,
      aiCoverLetters: 0,
      resumeTemplates: 0,
      savedJobs: 0,
      virtualCoins: 0,
      boostVisibility: 0,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Clear cache for a specific user (call after incrementing usage)
   */
  clearCache(userId: string): void {
    this.usageCache.delete(userId);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.usageCache.clear();
  }
}
