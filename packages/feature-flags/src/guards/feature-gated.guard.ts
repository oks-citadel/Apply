import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
  Inject,
  Optional,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  FEATURE_GATED_KEY,
  FeatureGatedConfig,
  FeatureGatingResult,
  SubscriptionTier,
  TIER_HIERARCHY,
  hasRequiredTier,
  getTierDisplayName,
} from '../decorators/feature-gated.decorator';
import { FeatureFlagService } from '../services/feature-flag.service';

/**
 * Feature access logger interface for audit logging
 */
export interface FeatureAccessLogger {
  logFeatureAccess(result: FeatureGatingResult): Promise<void>;
}

/**
 * Token for injecting custom feature access logger
 */
export const FEATURE_ACCESS_LOGGER = 'FEATURE_ACCESS_LOGGER';

/**
 * Extended request interface with user subscription information
 */
export interface RequestWithUser extends Request {
  user: {
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
  };
}

/**
 * Feature gating denied error response structure
 */
export interface FeatureGatingDeniedResponse {
  statusCode: number;
  message: string;
  error: string;
  feature: string;
  reason: string;
  currentTier?: string;
  requiredTier?: string;
  missingFlags?: string[];
  upgradeUrl?: string;
  timestamp: string;
}

/**
 * FeatureGatedGuard
 *
 * Comprehensive guard for feature gating that:
 * - Checks user's subscription tier against minimum requirements
 * - Verifies feature flag enablement
 * - Supports role-based bypass
 * - Supports beta tester bypass
 * - Logs all access attempts for audit purposes
 * - Returns detailed 403 Forbidden responses when access is denied
 *
 * This guard works with the @FeatureGated() decorator to provide
 * a complete feature gating solution for NestJS services.
 *
 * @example
 * // Register globally in your module
 * @Module({
 *   providers: [
 *     {
 *       provide: APP_GUARD,
 *       useClass: FeatureGatedGuard,
 *     },
 *   ],
 * })
 *
 * @example
 * // Or use with specific routes
 * @UseGuards(FeatureGatedGuard)
 * @FeatureGated({ feature: 'ai.resume-builder' })
 * @Get('resume/generate')
 * async generateResume() { ... }
 */
@Injectable()
export class FeatureGatedGuard implements CanActivate {
  private readonly logger = new Logger(FeatureGatedGuard.name);

  constructor(
    private readonly reflector: Reflector,
    @Optional()
    private readonly featureFlagService?: FeatureFlagService,
    @Optional()
    @Inject(FEATURE_ACCESS_LOGGER)
    private readonly accessLogger?: FeatureAccessLogger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get feature gating configuration from decorator
    const config = this.reflector.getAllAndOverride<FeatureGatedConfig>(
      FEATURE_GATED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No feature gating required, allow access
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    // Initialize gating result for logging
    const result: FeatureGatingResult = {
      allowed: false,
      feature: config.feature,
      reason: '',
      timestamp: new Date(),
    };

    try {
      // Check authentication
      if (!user || !user.id) {
        result.reason = 'User not authenticated';
        await this.logAccess(config, result);
        throw new UnauthorizedException('Authentication required to access this feature');
      }

      result.userId = user.id;
      result.userTier = this.getUserTier(user);
      result.requiredTier = config.minimumTier;

      // Check role-based bypass
      if (this.checkRoleBypass(user, config)) {
        result.allowed = true;
        result.reason = 'Access granted via role bypass';
        await this.logAccess(config, result);
        return true;
      }

      // Check beta tester bypass
      if (this.checkBetaTesterBypass(user, config)) {
        result.allowed = true;
        result.reason = 'Access granted via beta tester bypass';
        await this.logAccess(config, result);
        return true;
      }

      // Check subscription tier requirement
      if (config.minimumTier) {
        const tierCheckResult = this.checkTierRequirement(user, config);
        if (!tierCheckResult.passed) {
          result.reason = tierCheckResult.reason;
          await this.logAccess(config, result);

          if (config.failSilently) {
            return true; // Allow but with empty data handling in controller
          }

          throw this.createForbiddenException(config, result);
        }
      }

      // Check feature flag requirements
      const flagCheckResult = await this.checkFeatureFlags(user, config);
      result.flagsChecked = flagCheckResult.flagsChecked;
      result.flagsEnabled = flagCheckResult.flagsEnabled;

      if (!flagCheckResult.passed) {
        result.reason = flagCheckResult.reason;
        await this.logAccess(config, result);

        if (config.failSilently) {
          return true;
        }

        throw this.createForbiddenException(config, result, flagCheckResult.missingFlags);
      }

      // All checks passed
      result.allowed = true;
      result.reason = 'Access granted - all requirements met';
      await this.logAccess(config, result);

      return true;
    } catch (error) {
      // Re-throw HTTP exceptions
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Unexpected error in FeatureGatedGuard for feature ${config.feature}`,
        error instanceof Error ? error.stack : error,
      );

      result.reason = `Error during feature gating check: ${error instanceof Error ? error.message : 'Unknown error'}`;
      await this.logAccess(config, result);

      // Fail closed for security
      throw new ForbiddenException('Unable to verify feature access');
    }
  }

  /**
   * Get user's subscription tier from various possible locations
   */
  private getUserTier(user: RequestWithUser['user']): SubscriptionTier {
    // Try subscription object first
    if (user.subscription?.tier) {
      return user.subscription.tier;
    }

    // Fall back to subscriptionTier property
    if (user.subscriptionTier) {
      return user.subscriptionTier;
    }

    // Default to FREEMIUM
    return SubscriptionTier.FREEMIUM;
  }

  /**
   * Check if user has a role that bypasses feature gating
   */
  private checkRoleBypass(user: RequestWithUser['user'], config: FeatureGatedConfig): boolean {
    if (!config.bypassRoles || config.bypassRoles.length === 0) {
      return false;
    }

    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    const hasBypassRole = config.bypassRoles.some((role) =>
      user.roles?.includes(role),
    );

    if (hasBypassRole) {
      this.logger.debug(
        `User ${user.id} bypassing feature gating for ${config.feature} via role`,
      );
    }

    return hasBypassRole;
  }

  /**
   * Check if user is a beta tester and config allows beta tester bypass
   */
  private checkBetaTesterBypass(user: RequestWithUser['user'], config: FeatureGatedConfig): boolean {
    if (!config.allowBetaTesters) {
      return false;
    }

    if (user.isBetaTester) {
      this.logger.debug(
        `User ${user.id} bypassing feature gating for ${config.feature} as beta tester`,
      );
      return true;
    }

    return false;
  }

  /**
   * Check subscription tier requirement
   */
  private checkTierRequirement(
    user: RequestWithUser['user'],
    config: FeatureGatedConfig,
  ): { passed: boolean; reason: string } {
    const userTier = this.getUserTier(user);
    const requiredTier = config.minimumTier!;

    if (!hasRequiredTier(userTier, requiredTier)) {
      this.logger.warn(
        `User ${user.id} with tier ${userTier} denied access to ${config.feature} (requires ${requiredTier})`,
      );

      return {
        passed: false,
        reason: `Insufficient subscription tier. Current: ${getTierDisplayName(userTier)}, Required: ${getTierDisplayName(requiredTier)}`,
      };
    }

    return {
      passed: true,
      reason: 'Tier requirement met',
    };
  }

  /**
   * Check feature flag requirements
   */
  private async checkFeatureFlags(
    user: RequestWithUser['user'],
    config: FeatureGatedConfig,
  ): Promise<{
    passed: boolean;
    reason: string;
    flagsChecked: string[];
    flagsEnabled: string[];
    missingFlags?: string[];
  }> {
    const flagsChecked: string[] = [];
    const flagsEnabled: string[] = [];
    const missingFlags: string[] = [];

    // Collect all flags to check
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

    // No flag requirements
    if (allFlags.length === 0) {
      return {
        passed: true,
        reason: 'No feature flag requirements',
        flagsChecked: [],
        flagsEnabled: [],
      };
    }

    // Check if feature flag service is available
    if (!this.featureFlagService) {
      this.logger.warn(
        `FeatureFlagService not available, skipping flag checks for ${config.feature}`,
      );
      return {
        passed: true,
        reason: 'Feature flag service not available, skipping flag checks',
        flagsChecked: allFlags,
        flagsEnabled: [],
      };
    }

    // Evaluate all flags
    const flagResults = await Promise.all(
      allFlags.map(async (flag) => {
        const enabled = await this.featureFlagService!.isEnabled(flag, {
          userId: user.id,
          userEmail: user.email,
        });
        return { flag, enabled };
      }),
    );

    flagResults.forEach(({ flag, enabled }) => {
      flagsChecked.push(flag);
      if (enabled) {
        flagsEnabled.push(flag);
      } else {
        missingFlags.push(flag);
      }
    });

    // Check single flag requirement
    if (config.flagKey) {
      const enabled = flagsEnabled.includes(config.flagKey);
      if (!enabled) {
        return {
          passed: false,
          reason: `Feature flag ${config.flagKey} is not enabled`,
          flagsChecked,
          flagsEnabled,
          missingFlags: [config.flagKey],
        };
      }
    }

    // Check required flags (AND logic)
    if (config.requiredFlags && config.requiredFlags.length > 0) {
      const allRequired = config.requiredFlags.every((flag) =>
        flagsEnabled.includes(flag),
      );
      if (!allRequired) {
        const missing = config.requiredFlags.filter(
          (flag) => !flagsEnabled.includes(flag),
        );
        return {
          passed: false,
          reason: `Required feature flags not enabled: ${missing.join(', ')}`,
          flagsChecked,
          flagsEnabled,
          missingFlags: missing,
        };
      }
    }

    // Check any flags (OR logic)
    if (config.anyFlags && config.anyFlags.length > 0) {
      const anyEnabled = config.anyFlags.some((flag) =>
        flagsEnabled.includes(flag),
      );
      if (!anyEnabled) {
        return {
          passed: false,
          reason: `None of the required feature flags are enabled: ${config.anyFlags.join(', ')}`,
          flagsChecked,
          flagsEnabled,
          missingFlags: config.anyFlags,
        };
      }
    }

    return {
      passed: true,
      reason: 'All feature flag requirements met',
      flagsChecked,
      flagsEnabled,
    };
  }

  /**
   * Log feature access attempt
   */
  private async logAccess(
    config: FeatureGatedConfig,
    result: FeatureGatingResult,
  ): Promise<void> {
    // Skip logging if disabled
    if (!config.logAccess && result.allowed) {
      return;
    }
    if (!config.logDenied && !result.allowed) {
      return;
    }

    // Log to NestJS logger
    const logMessage = `Feature access ${result.allowed ? 'GRANTED' : 'DENIED'}: ${result.feature} | User: ${result.userId || 'anonymous'} | Tier: ${result.userTier || 'unknown'} | Reason: ${result.reason}`;

    if (result.allowed) {
      this.logger.log(logMessage);
    } else {
      this.logger.warn(logMessage);
    }

    // Log to custom access logger if available
    if (this.accessLogger) {
      try {
        await this.accessLogger.logFeatureAccess({
          ...result,
          ...config.auditMetadata,
        });
      } catch (error) {
        this.logger.error(
          'Failed to log feature access to custom logger',
          error instanceof Error ? error.stack : error,
        );
      }
    }
  }

  /**
   * Create a detailed ForbiddenException
   */
  private createForbiddenException(
    config: FeatureGatedConfig,
    result: FeatureGatingResult,
    missingFlags?: string[],
  ): ForbiddenException {
    const response: FeatureGatingDeniedResponse = {
      statusCode: HttpStatus.FORBIDDEN,
      message: config.errorMessage || `Access to ${config.feature} is not available in your current plan`,
      error: 'Feature Not Available',
      feature: config.feature,
      reason: result.reason,
      timestamp: new Date().toISOString(),
    };

    if (result.userTier) {
      response.currentTier = getTierDisplayName(result.userTier);
    }

    if (result.requiredTier) {
      response.requiredTier = getTierDisplayName(result.requiredTier);
    }

    if (missingFlags && missingFlags.length > 0) {
      response.missingFlags = missingFlags;
    }

    response.upgradeUrl = '/billing/upgrade';

    return new ForbiddenException(response);
  }
}

/**
 * Default in-memory feature access logger for development/testing
 */
@Injectable()
export class InMemoryFeatureAccessLogger implements FeatureAccessLogger {
  private readonly logger = new Logger(InMemoryFeatureAccessLogger.name);
  private readonly logs: FeatureGatingResult[] = [];
  private readonly maxLogs = 1000;

  async logFeatureAccess(result: FeatureGatingResult): Promise<void> {
    this.logs.push(result);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs);
    }

    this.logger.debug(
      `Feature access logged: ${result.feature} - ${result.allowed ? 'ALLOWED' : 'DENIED'}`,
    );
  }

  /**
   * Get all logged access attempts
   */
  getLogs(): FeatureGatingResult[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific user
   */
  getLogsForUser(userId: string): FeatureGatingResult[] {
    return this.logs.filter((log) => log.userId === userId);
  }

  /**
   * Get logs for a specific feature
   */
  getLogsForFeature(feature: string): FeatureGatingResult[] {
    return this.logs.filter((log) => log.feature === feature);
  }

  /**
   * Get denied access attempts
   */
  getDeniedLogs(): FeatureGatingResult[] {
    return this.logs.filter((log) => !log.allowed);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs.length = 0;
  }
}
