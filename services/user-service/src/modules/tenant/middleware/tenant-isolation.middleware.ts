import { Injectable, Logger, ForbiddenException, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

import { TenantService } from '../tenant.service';

// Extend Express Request to include user from JWT auth
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    sub: string;
    email?: string;
    role?: string;
  };
  tenant?: any;
}

/**
 * Middleware to ensure tenant isolation and data security
 * Verifies that authenticated users have access to the requested tenant
 */
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantIsolationMiddleware.name);

  constructor(private readonly tenantService: TenantService) {}

  async use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

      // Verify user has access to this tenant (if user is authenticated)
      // Skip for service-to-service calls using API keys
      const isServiceCall = req.headers['x-api-key'] || req.headers['x-service-auth'];

      if (!isServiceCall && req.user) {
        const userId = req.user.id || req.user.sub;

        if (userId) {
          const hasAccess = await this.tenantService.userHasAccessToTenant(userId, tenantId as string);

          if (!hasAccess) {
            this.logger.warn(`Access denied: User ${userId} attempted to access tenant ${tenantId}`);
            throw new ForbiddenException('You do not have access to this tenant');
          }

          // Attach user's tenant role to request for authorization
          const userRole = await this.tenantService.getUserTenantRole(userId, tenantId as string);
          req['tenantRole'] = userRole;
        }
      }

      // Attach tenant to request for downstream use
      req.tenant = tenant;

      next();
    } catch (error) {
      this.logger.error(`Tenant isolation check failed: ${error.message}`);
      throw error;
    }
  }
}
