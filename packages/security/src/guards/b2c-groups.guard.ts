import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SubscriptionTier } from '../decorators/subscription.decorator';

/**
 * B2C Group IDs - These should match the group IDs from Terraform identity module
 * In production, these should be loaded from environment variables
 */
export interface B2CGroupConfig {
  // Subscription tier groups (mutually exclusive)
  freemium: string;
  starter: string;
  basic: string;
  professional: string;
  advanced_career: string;
  executive_elite: string;

  // Special groups
  verified: string;
  support: string;
  admin: string;
  super_admin: string;
  suspended: string;
}

/**
 * Decorator key for requiring B2C groups
 */
export const REQUIRES_B2C_GROUP_KEY = 'requiresB2CGroup';
export const CHECK_SUSPENDED_KEY = 'checkSuspended';

/**
 * Extended request interface with B2C claims
 */
export interface B2CRequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    oid?: string; // Azure AD Object ID
    groups?: string[]; // B2C Group IDs from token claims
    roles?: string[]; // App roles from token claims
    subscriptionTier?: SubscriptionTier;
    subscription?: {
      tier: SubscriptionTier;
      status: string;
      hasAccess: boolean;
    };
    isVerified?: boolean;
    isSuspended?: boolean;
  };
}

/**
 * B2C Groups Guard
 *
 * Validates that a user belongs to required B2C security groups.
 * This guard should be used in combination with the SubscriptionGuard.
 *
 * B2C Token Requirements:
 * - Token must include 'groups' claim with group IDs
 * - Configure B2C user flows to include group claims
 *
 * Usage:
 * ```typescript
 * @RequiresB2CGroup(['admin', 'super_admin'])
 * @Get('admin/users')
 * async getAllUsers() { ... }
 * ```
 */
@Injectable()
export class B2CGroupsGuard implements CanActivate {
  private readonly logger = new Logger(B2CGroupsGuard.name);
  private readonly groupConfig: B2CGroupConfig;

  constructor(private reflector: Reflector) {
    // Load group IDs from environment variables
    this.groupConfig = {
      freemium: process.env.GROUP_ID_FREEMIUM || '',
      starter: process.env.GROUP_ID_STARTER || '',
      basic: process.env.GROUP_ID_BASIC || '',
      professional: process.env.GROUP_ID_PROFESSIONAL || '',
      advanced_career: process.env.GROUP_ID_ADVANCED_CAREER || '',
      executive_elite: process.env.GROUP_ID_EXECUTIVE_ELITE || '',
      verified: process.env.GROUP_ID_VERIFIED || '',
      support: process.env.GROUP_ID_SUPPORT || '',
      admin: process.env.GROUP_ID_ADMIN || '',
      super_admin: process.env.GROUP_ID_SUPER_ADMIN || '',
      suspended: process.env.GROUP_ID_SUSPENDED || '',
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredGroups = this.reflector.getAllAndOverride<string[]>(
      REQUIRES_B2C_GROUP_KEY,
      [context.getHandler(), context.getClass()],
    );

    const checkSuspended = this.reflector.getAllAndOverride<boolean>(
      CHECK_SUSPENDED_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no B2C group checks required, pass through
    if (!requiredGroups && !checkSuspended) {
      return true;
    }

    const request = context.switchToHttp().getRequest<B2CRequestWithUser>();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('Authentication required');
    }

    // Always check for suspended status if enabled
    if (checkSuspended !== false) {
      this.checkSuspendedStatus(user);
    }

    // Check required groups
    if (requiredGroups && requiredGroups.length > 0) {
      this.checkRequiredGroups(user, requiredGroups);
    }

    // Enrich user with subscription tier from groups
    this.enrichUserWithTier(user);

    return true;
  }

  /**
   * Check if user is in the suspended group
   */
  private checkSuspendedStatus(user: B2CRequestWithUser['user']): void {
    const userGroups = user.groups || [];
    const suspendedGroupId = this.groupConfig.suspended;

    if (suspendedGroupId && userGroups.includes(suspendedGroupId)) {
      this.logger.warn(`Suspended user ${user.id} attempted to access resource`);
      user.isSuspended = true;
      throw new ForbiddenException({
        statusCode: 403,
        message: 'Your account has been suspended. Please contact support.',
        error: 'Account Suspended',
        supportUrl: '/support/contact',
      });
    }

    user.isSuspended = false;
  }

  /**
   * Check if user belongs to any of the required groups
   */
  private checkRequiredGroups(
    user: B2CRequestWithUser['user'],
    requiredGroups: string[],
  ): void {
    const userGroups = user.groups || [];

    // Convert group names to IDs
    const requiredGroupIds = requiredGroups
      .map((groupName) => this.groupConfig[groupName as keyof B2CGroupConfig])
      .filter((id) => id); // Filter out empty IDs

    // Check if user has ANY of the required groups
    const hasRequiredGroup = requiredGroupIds.some((groupId) =>
      userGroups.includes(groupId),
    );

    if (!hasRequiredGroup) {
      this.logger.warn(
        `User ${user.id} lacks required groups: ${requiredGroups.join(', ')}`,
      );
      throw new ForbiddenException({
        statusCode: 403,
        message: 'You do not have permission to access this resource',
        error: 'Insufficient Permissions',
        requiredGroups,
      });
    }
  }

  /**
   * Enrich user object with subscription tier based on B2C groups
   */
  private enrichUserWithTier(user: B2CRequestWithUser['user']): void {
    const userGroups = user.groups || [];

    // Check tier groups in order of priority (highest to lowest)
    const tierOrder: Array<{ key: keyof B2CGroupConfig; tier: SubscriptionTier }> = [
      { key: 'executive_elite', tier: SubscriptionTier.EXECUTIVE_ELITE },
      { key: 'advanced_career', tier: SubscriptionTier.ADVANCED_CAREER },
      { key: 'professional', tier: SubscriptionTier.PROFESSIONAL },
      { key: 'basic', tier: SubscriptionTier.BASIC },
      { key: 'starter', tier: SubscriptionTier.STARTER },
      { key: 'freemium', tier: SubscriptionTier.FREEMIUM },
    ];

    for (const { key, tier } of tierOrder) {
      const groupId = this.groupConfig[key];
      if (groupId && userGroups.includes(groupId)) {
        // Only set if not already set (prefer existing value)
        if (!user.subscriptionTier) {
          user.subscriptionTier = tier;
        }
        break;
      }
    }

    // Check verified status
    const verifiedGroupId = this.groupConfig.verified;
    if (verifiedGroupId && userGroups.includes(verifiedGroupId)) {
      user.isVerified = true;
    }

    // Default to FREEMIUM if no tier group found
    if (!user.subscriptionTier) {
      user.subscriptionTier = SubscriptionTier.FREEMIUM;
    }
  }

  /**
   * Get the group ID for a given group name
   */
  getGroupId(groupName: keyof B2CGroupConfig): string {
    return this.groupConfig[groupName] || '';
  }

  /**
   * Get all group IDs
   */
  getAllGroupIds(): B2CGroupConfig {
    return { ...this.groupConfig };
  }
}

/**
 * Decorator: Require user to be in one of the specified B2C groups
 */
export function RequiresB2CGroup(groups: (keyof B2CGroupConfig)[]) {
  return (
    target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    Reflect.defineMetadata(REQUIRES_B2C_GROUP_KEY, groups, descriptor?.value || target);
    return descriptor || target;
  };
}

/**
 * Decorator: Skip suspended check for this endpoint
 */
export function SkipSuspendedCheck() {
  return (
    target: any,
    _key?: string | symbol,
    descriptor?: TypedPropertyDescriptor<any>,
  ) => {
    Reflect.defineMetadata(CHECK_SUSPENDED_KEY, false, descriptor?.value || target);
    return descriptor || target;
  };
}

/**
 * Decorator: Require verified user
 */
export function RequiresVerified() {
  return RequiresB2CGroup(['verified']);
}

/**
 * Decorator: Require admin access
 */
export function RequiresAdmin() {
  return RequiresB2CGroup(['admin', 'super_admin']);
}

/**
 * Decorator: Require super admin access
 */
export function RequiresSuperAdmin() {
  return RequiresB2CGroup(['super_admin']);
}

/**
 * Decorator: Require support staff access
 */
export function RequiresSupport() {
  return RequiresB2CGroup(['support', 'admin', 'super_admin']);
}
