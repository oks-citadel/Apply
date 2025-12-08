import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagService } from '../services/feature-flag.service';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';

/**
 * Guard to check feature flags on routes
 * Works with @FeatureFlag() decorator
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  private readonly logger = new Logger(FeatureFlagGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagConfig = this.reflector.get<string | { all?: string[]; any?: string[] }>(
      FEATURE_FLAG_KEY,
      context.getHandler(),
    );

    // No feature flag requirement, allow access
    if (!flagConfig) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.sub;

    try {
      // Handle single flag
      if (typeof flagConfig === 'string') {
        const isEnabled = await this.featureFlagService.isEnabled(flagConfig, {
          userId,
        });

        if (!isEnabled) {
          this.logger.warn(
            `Feature flag ${flagConfig} is disabled for user ${userId || 'anonymous'}`,
          );
          throw new ForbiddenException(
            `Feature ${flagConfig} is not available`,
          );
        }

        return true;
      }

      // Handle multiple flags with "all" requirement
      if (flagConfig.all) {
        const results = await Promise.all(
          flagConfig.all.map((flag) =>
            this.featureFlagService.isEnabled(flag, { userId }),
          ),
        );

        const allEnabled = results.every((result) => result);

        if (!allEnabled) {
          this.logger.warn(
            `Not all required feature flags are enabled for user ${userId || 'anonymous'}`,
          );
          throw new ForbiddenException(
            'Required features are not available',
          );
        }

        return true;
      }

      // Handle multiple flags with "any" requirement
      if (flagConfig.any) {
        const results = await Promise.all(
          flagConfig.any.map((flag) =>
            this.featureFlagService.isEnabled(flag, { userId }),
          ),
        );

        const anyEnabled = results.some((result) => result);

        if (!anyEnabled) {
          this.logger.warn(
            `None of the required feature flags are enabled for user ${userId || 'anonymous'}`,
          );
          throw new ForbiddenException(
            'Required features are not available',
          );
        }

        return true;
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Error checking feature flag', error);
      // In case of error, fail closed (deny access)
      throw new ForbiddenException('Unable to verify feature access');
    }
  }
}
