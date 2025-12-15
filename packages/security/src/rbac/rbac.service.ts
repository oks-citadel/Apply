/**
 * ApplyForUs AI - RBAC Service
 *
 * Main service for role-based access control operations.
 */

import { Permission } from './permissions';
import { roleManager, RoleName } from './roles';
import {
  Action,
  PolicyContext,
  policyEngine,
  ResourceOwnership,
  ResourceType,
} from './policies';

/**
 * User interface for RBAC operations
 */
export interface RBACUser {
  id: string;
  roles: string[];
  permissions?: Permission[]; // Direct permissions (optional)
  organizationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Resource interface for access control
 */
export interface Resource {
  type: ResourceType;
  id: string;
  ownership?: ResourceOwnership;
  metadata?: Record<string, any>;
}

/**
 * Access control result
 */
export interface AccessControlResult {
  allowed: boolean;
  reason: string;
  requiresPermissions?: Permission[];
  matchedPolicies?: string[];
}

/**
 * RBAC Service for access control operations
 */
export class RBACService {
  /**
   * Check if user has a specific permission
   */
  hasPermission(user: RBACUser, permission: Permission): boolean {
    // Check direct permissions first
    if (user.permissions?.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    for (const roleName of user.roles) {
      const rolePermissions = roleManager.getRolePermissions(roleName);

      // Super admin has all permissions
      if (rolePermissions.includes(Permission.SUPER_ADMIN)) {
        return true;
      }

      if (rolePermissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: RBACUser, permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(user, permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(user: RBACUser, permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(user, permission));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(user: RBACUser, role: string | RoleName): boolean {
    return user.roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(user: RBACUser, roles: (string | RoleName)[]): boolean {
    return roles.some((role) => this.hasRole(user, role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(user: RBACUser, roles: (string | RoleName)[]): boolean {
    return roles.every((role) => this.hasRole(user, role));
  }

  /**
   * Check if user can perform an action on a resource
   */
  canAccess(
    user: RBACUser,
    resource: Resource,
    action: Action,
    additionalContext?: Record<string, any>
  ): AccessControlResult {
    // Build policy context
    const context: PolicyContext = {
      userId: user.id,
      userRoles: user.roles,
      resourceType: resource.type,
      resourceId: resource.id,
      action,
      attributes: {
        ...user.metadata,
        ...resource.metadata,
        ...additionalContext,
        resourceOwnerId: resource.ownership?.ownerId,
        isPublic: resource.ownership?.isPublic,
        sharedWith: resource.ownership?.sharedWith,
        organizationId: resource.ownership?.organizationId,
        userOrganizationId: user.organizationId,
      },
    };

    // Evaluate policies
    const policyResult = policyEngine.evaluate(context);

    // Check permission-based access if policy evaluation doesn't explicitly allow
    if (!policyResult.allowed) {
      const requiredPermission = this.getRequiredPermission(resource.type, action);
      if (requiredPermission && this.hasPermission(user, requiredPermission)) {
        return {
          allowed: true,
          reason: `User has required permission: ${requiredPermission}`,
          requiresPermissions: [requiredPermission],
        };
      }
    }

    return {
      allowed: policyResult.allowed,
      reason: policyResult.reason || 'Access denied',
      matchedPolicies: policyResult.matchedPolicies.map((p) => p.id),
    };
  }

  /**
   * Get required permission for resource type and action
   */
  private getRequiredPermission(
    resourceType: ResourceType,
    action: Action
  ): Permission | null {
    const permissionMap: Record<string, Permission> = {
      [`${ResourceType.USER}:${Action.READ}`]: Permission.USER_READ,
      [`${ResourceType.USER}:${Action.UPDATE}`]: Permission.USER_WRITE,
      [`${ResourceType.USER}:${Action.DELETE}`]: Permission.USER_DELETE,

      [`${ResourceType.PROFILE}:${Action.READ}`]: Permission.PROFILE_READ,
      [`${ResourceType.PROFILE}:${Action.UPDATE}`]: Permission.PROFILE_WRITE,
      [`${ResourceType.PROFILE}:${Action.DELETE}`]: Permission.PROFILE_DELETE,

      [`${ResourceType.RESUME}:${Action.CREATE}`]: Permission.RESUME_CREATE,
      [`${ResourceType.RESUME}:${Action.READ}`]: Permission.RESUME_READ,
      [`${ResourceType.RESUME}:${Action.UPDATE}`]: Permission.RESUME_UPDATE,
      [`${ResourceType.RESUME}:${Action.DELETE}`]: Permission.RESUME_DELETE,
      [`${ResourceType.RESUME}:${Action.EXPORT}`]: Permission.RESUME_EXPORT,

      [`${ResourceType.JOB}:${Action.READ}`]: Permission.JOB_READ,
      [`${ResourceType.JOB}:${Action.CREATE}`]: Permission.JOB_CREATE,
      [`${ResourceType.JOB}:${Action.UPDATE}`]: Permission.JOB_UPDATE,
      [`${ResourceType.JOB}:${Action.DELETE}`]: Permission.JOB_DELETE,

      [`${ResourceType.APPLICATION}:${Action.READ}`]: Permission.APPLICATION_READ,
      [`${ResourceType.APPLICATION}:${Action.CREATE}`]: Permission.APPLICATION_CREATE,
      [`${ResourceType.APPLICATION}:${Action.UPDATE}`]: Permission.APPLICATION_UPDATE,
      [`${ResourceType.APPLICATION}:${Action.DELETE}`]: Permission.APPLICATION_DELETE,

      [`${ResourceType.COMPANY}:${Action.READ}`]: Permission.COMPANY_READ,
      [`${ResourceType.COMPANY}:${Action.CREATE}`]: Permission.COMPANY_CREATE,
      [`${ResourceType.COMPANY}:${Action.UPDATE}`]: Permission.COMPANY_UPDATE,
      [`${ResourceType.COMPANY}:${Action.DELETE}`]: Permission.COMPANY_DELETE,

      [`${ResourceType.DOCUMENT}:${Action.READ}`]: Permission.DOCUMENT_READ,
      [`${ResourceType.DOCUMENT}:${Action.CREATE}`]: Permission.DOCUMENT_UPLOAD,
      [`${ResourceType.DOCUMENT}:${Action.DELETE}`]: Permission.DOCUMENT_DELETE,
      [`${ResourceType.DOCUMENT}:${Action.SHARE}`]: Permission.DOCUMENT_SHARE,

      [`${ResourceType.ANALYTICS}:${Action.READ}`]: Permission.ANALYTICS_VIEW,
      [`${ResourceType.ANALYTICS}:${Action.EXPORT}`]: Permission.ANALYTICS_EXPORT,
    };

    const key = `${resourceType}:${action}`;
    return permissionMap[key] || null;
  }

  /**
   * Get all effective permissions for a user (from all roles)
   */
  getEffectivePermissions(user: RBACUser): Permission[] {
    const permissions = new Set<Permission>();

    // Add direct permissions
    if (user.permissions) {
      user.permissions.forEach((perm) => permissions.add(perm));
    }

    // Add role-based permissions
    for (const roleName of user.roles) {
      const rolePermissions = roleManager.getRolePermissions(roleName);
      rolePermissions.forEach((perm) => permissions.add(perm));
    }

    return Array.from(permissions);
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(user: RBACUser): boolean {
    return this.hasPermission(user, Permission.SUPER_ADMIN);
  }

  /**
   * Check if user is admin (any admin role)
   */
  isAdmin(user: RBACUser): boolean {
    return this.hasAnyRole(user, [RoleName.ADMIN, RoleName.SUPER_ADMIN]);
  }

  /**
   * Check resource ownership
   */
  isOwner(user: RBACUser, resource: Resource): boolean {
    return resource.ownership?.ownerId === user.id;
  }

  /**
   * Check if user is in the same organization as the resource
   */
  isSameOrganization(user: RBACUser, resource: Resource): boolean {
    return (
      !!user.organizationId &&
      user.organizationId === resource.ownership?.organizationId
    );
  }

  /**
   * Validate user has required permissions or throw error
   */
  requirePermission(user: RBACUser, permission: Permission): void {
    if (!this.hasPermission(user, permission)) {
      throw new UnauthorizedError(
        `Missing required permission: ${permission}`,
        permission
      );
    }
  }

  /**
   * Validate user has any of the required permissions or throw error
   */
  requireAnyPermission(user: RBACUser, permissions: Permission[]): void {
    if (!this.hasAnyPermission(user, permissions)) {
      throw new UnauthorizedError(
        `Missing required permissions: ${permissions.join(', ')}`,
        permissions
      );
    }
  }

  /**
   * Validate user has all required permissions or throw error
   */
  requireAllPermissions(user: RBACUser, permissions: Permission[]): void {
    if (!this.hasAllPermissions(user, permissions)) {
      throw new UnauthorizedError(
        `Missing required permissions: ${permissions.join(', ')}`,
        permissions
      );
    }
  }

  /**
   * Validate user has required role or throw error
   */
  requireRole(user: RBACUser, role: string | RoleName): void {
    if (!this.hasRole(user, role)) {
      throw new UnauthorizedError(`Missing required role: ${role}`);
    }
  }

  /**
   * Validate user can access resource or throw error
   */
  requireAccess(
    user: RBACUser,
    resource: Resource,
    action: Action,
    additionalContext?: Record<string, any>
  ): void {
    const result = this.canAccess(user, resource, action, additionalContext);
    if (!result.allowed) {
      throw new ForbiddenError(result.reason, resource.type, action);
    }
  }

  /**
   * Create a permission checker function bound to a user
   */
  createPermissionChecker(user: RBACUser) {
    return {
      has: (permission: Permission) => this.hasPermission(user, permission),
      hasAny: (permissions: Permission[]) =>
        this.hasAnyPermission(user, permissions),
      hasAll: (permissions: Permission[]) =>
        this.hasAllPermissions(user, permissions),
      canAccess: (resource: Resource, action: Action, context?: Record<string, any>) =>
        this.canAccess(user, resource, action, context),
      isSuperAdmin: () => this.isSuperAdmin(user),
      isAdmin: () => this.isAdmin(user),
    };
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends Error {
  constructor(
    message: string,
    public requiredPermissions?: Permission | Permission[]
  ) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends Error {
  constructor(
    message: string,
    public resourceType?: ResourceType,
    public action?: Action
  ) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// Export singleton instance
export const rbacService = new RBACService();
