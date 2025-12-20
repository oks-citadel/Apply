import { Injectable, Logger, ForbiddenException } from '@nestjs/common';

import type { TenantService } from '../tenant.service';
import type { NestMiddleware} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to ensure tenant isolation and data security
 */
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantIsolationMiddleware.name);

  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant ID from various sources
    const tenantId =
      req.params.id ||
      req.params.tenantId ||
      req.body.tenant_id ||
      req.headers['x-tenant-id'] ||
      req.query.tenant_id;

    if (!tenantId) {
      // Allow requests without tenant ID (e.g., creating a new tenant)
      return next();
    }

    try {
      // Verify tenant exists and is active
      const tenant = await this.tenantService.getTenantById(tenantId as string);

      if (tenant.status === 'suspended') {
        throw new ForbiddenException('Tenant account is suspended');
      }

      if (tenant.status === 'expired') {
        throw new ForbiddenException('Tenant license has expired');
      }

      // TODO: Verify user has access to this tenant
      // This would check if the authenticated user is a member of the tenant
      // const userId = req.user?.id;
      // const hasAccess = await this.tenantService.userHasAccessToTenant(userId, tenantId);
      // if (!hasAccess) {
      //   throw new ForbiddenException('You do not have access to this tenant');
      // }

      // Attach tenant to request for downstream use
      req['tenant'] = tenant;

      next();
    } catch (error) {
      this.logger.error(`Tenant isolation check failed: ${error.message}`);
      throw error;
    }
  }
}
