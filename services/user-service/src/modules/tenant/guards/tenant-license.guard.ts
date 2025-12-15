import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantService } from '../tenant.service';

export const REQUIRED_FEATURE = 'required_feature';
export const REQUIRED_LICENSE = 'required_license';

/**
 * Guard to enforce tenant license limits and feature access
 */
@Injectable()
export class TenantLicenseGuard implements CanActivate {
  private readonly logger = new Logger(TenantLicenseGuard.name);

  constructor(
    private readonly tenantService: TenantService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.params.id || request.body.tenant_id || request.headers['x-tenant-id'];

    if (!tenantId) {
      this.logger.warn('No tenant ID provided in request');
      throw new ForbiddenException('Tenant ID is required');
    }

    try {
      // Get tenant license
      const license = await this.tenantService.getTenantLicense(tenantId);

      // Check if license is active
      if (license.status !== 'active') {
        throw new ForbiddenException(`Tenant license is ${license.status}`);
      }

      // Check if trial has expired
      if (license.is_trial && license.trial_end_date < new Date()) {
        throw new ForbiddenException('Trial period has expired');
      }

      // Check for required feature from metadata
      const requiredFeature = this.reflector.get<string>(REQUIRED_FEATURE, context.getHandler());
      if (requiredFeature && !this.hasFeature(license, requiredFeature)) {
        throw new ForbiddenException(
          `Feature '${requiredFeature}' is not available in your current license`,
        );
      }

      // Check usage limits based on route
      const path = request.route.path;
      await this.checkUsageLimits(tenantId, license, path);

      // Attach license to request for downstream use
      request.tenantLicense = license;

      return true;
    } catch (error) {
      this.logger.error(`License check failed for tenant ${tenantId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if license has a specific feature
   */
  private hasFeature(license: any, featureName: string): boolean {
    return license.features && license.features[featureName] === true;
  }

  /**
   * Check usage limits based on route/operation
   */
  private async checkUsageLimits(tenantId: string, license: any, path: string) {
    // Check API rate limits
    if (path.includes('/api/')) {
      if (license.max_api_calls_per_day !== null) {
        if (license.api_calls_today >= license.max_api_calls_per_day) {
          throw new ForbiddenException(
            `Daily API call limit (${license.max_api_calls_per_day}) exceeded`,
          );
        }
      }
    }

    // Check bulk import limits
    if (path.includes('/bulk')) {
      if (!this.hasFeature(license, 'bulkImport')) {
        throw new ForbiddenException('Bulk import is not available in your current license');
      }
    }

    // Check analytics limits
    if (path.includes('/analytics')) {
      if (!this.hasFeature(license, 'advancedAnalytics') && path.includes('/export/')) {
        throw new ForbiddenException('Data export is not available in your current license');
      }
    }

    // Check white-labeling
    if (path.includes('/branding')) {
      if (!this.hasFeature(license, 'whiteLabeling')) {
        throw new ForbiddenException('White-labeling is not available in your current license');
      }
    }
  }
}

/**
 * Decorator to mark required features
 */
export const RequireFeature = (feature: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(REQUIRED_FEATURE, feature, descriptor.value);
    return descriptor;
  };
};
