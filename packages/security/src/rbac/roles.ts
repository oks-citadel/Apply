/**
 * ApplyForUs AI - RBAC Roles System
 *
 * Defines platform roles and their associated permissions.
 */

import { Permission } from './permissions';

/**
 * Role definition interface
 */
export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be modified
  inheritsFrom?: string[]; // Role inheritance
}

/**
 * Role names enum for type safety
 */
export enum RoleName {
  JOB_SEEKER = 'job_seeker',
  PREMIUM_SEEKER = 'premium_seeker',
  EMPLOYER = 'employer',
  HIRING_MANAGER = 'hiring_manager',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Base permission sets for reuse (avoids self-reference issues)
 */
const JOB_SEEKER_PERMISSIONS: Permission[] = [
  // Profile management
  Permission.PROFILE_READ,
  Permission.PROFILE_WRITE,

  // Resume management
  Permission.RESUME_CREATE,
  Permission.RESUME_READ,
  Permission.RESUME_UPDATE,
  Permission.RESUME_DELETE,
  Permission.RESUME_EXPORT,
  Permission.RESUME_PARSE,

  // Job search and application
  Permission.JOB_READ,
  Permission.JOB_SEARCH,
  Permission.JOB_APPLY,

  // Application tracking
  Permission.APPLICATION_READ,
  Permission.APPLICATION_CREATE,
  Permission.APPLICATION_UPDATE,
  Permission.APPLICATION_TRACK,

  // Personal analytics
  Permission.ANALYTICS_VIEW,
  Permission.ANALYTICS_PERSONAL,

  // Documents
  Permission.DOCUMENT_UPLOAD,
  Permission.DOCUMENT_READ,
  Permission.DOCUMENT_DELETE,

  // Communication
  Permission.MESSAGE_SEND,
  Permission.MESSAGE_READ,
  Permission.MESSAGE_DELETE,

  // Interviews
  Permission.INTERVIEW_VIEW,
];

const EMPLOYER_PERMISSIONS: Permission[] = [
  // Profile management
  Permission.PROFILE_READ,
  Permission.PROFILE_WRITE,

  // Company management
  Permission.COMPANY_READ,
  Permission.COMPANY_UPDATE,

  // Job management
  Permission.JOB_READ,
  Permission.JOB_CREATE,
  Permission.JOB_UPDATE,
  Permission.JOB_DELETE,
  Permission.JOB_PUBLISH,
  Permission.JOB_ARCHIVE,

  // Application review
  Permission.APPLICATION_READ,
  Permission.APPLICATION_UPDATE,
  Permission.APPLICATION_REVIEW,

  // Resume viewing
  Permission.RESUME_READ,

  // Interview management
  Permission.INTERVIEW_SCHEDULE,
  Permission.INTERVIEW_CONDUCT,
  Permission.INTERVIEW_VIEW,
  Permission.INTERVIEW_FEEDBACK,

  // Communication
  Permission.MESSAGE_SEND,
  Permission.MESSAGE_READ,
  Permission.MESSAGE_DELETE,
  Permission.NOTIFICATION_SEND,

  // Documents
  Permission.DOCUMENT_UPLOAD,
  Permission.DOCUMENT_READ,
  Permission.DOCUMENT_DELETE,
  Permission.DOCUMENT_SHARE,

  // Analytics
  Permission.ANALYTICS_VIEW,
  Permission.ANALYTICS_EXPORT,
  Permission.ANALYTICS_PERSONAL,

  // Billing
  Permission.BILLING_VIEW,
];

const HIRING_MANAGER_PERMISSIONS: Permission[] = [
  ...EMPLOYER_PERMISSIONS,
  // Company management
  Permission.COMPANY_MANAGE_USERS,
  // Advanced application features
  Permission.APPLICATION_BULK,
  // Team analytics
  Permission.ANALYTICS_TEAM,
  // Billing management
  Permission.BILLING_MANAGE,
  Permission.BILLING_HISTORY,
  // Notification management
  Permission.NOTIFICATION_MANAGE,
];

const RECRUITER_PERMISSIONS: Permission[] = [
  ...HIRING_MANAGER_PERMISSIONS,
  // Extended user access
  Permission.USER_READ,
  // Company creation
  Permission.COMPANY_CREATE,
  // Advanced search and bulk operations
  Permission.APPLICATION_BULK,
];

/**
 * Built-in role definitions
 */
export const BUILT_IN_ROLES: Record<RoleName, Role> = {
  [RoleName.JOB_SEEKER]: {
    name: RoleName.JOB_SEEKER,
    description: 'Basic job seeker with standard features',
    isSystem: true,
    permissions: JOB_SEEKER_PERMISSIONS,
  },

  [RoleName.PREMIUM_SEEKER]: {
    name: RoleName.PREMIUM_SEEKER,
    description: 'Premium job seeker with advanced features including auto-apply',
    isSystem: true,
    inheritsFrom: [RoleName.JOB_SEEKER],
    permissions: [
      ...JOB_SEEKER_PERMISSIONS,
      // Resume optimization
      Permission.RESUME_OPTIMIZE,
      // Auto-apply feature
      Permission.AUTO_APPLY_ENABLE,
      Permission.AUTO_APPLY_CONFIGURE,
      Permission.AUTO_APPLY_MONITOR,
      // Bulk operations
      Permission.APPLICATION_BULK,
      // Advanced analytics
      Permission.ANALYTICS_EXPORT,
      // Document sharing
      Permission.DOCUMENT_SHARE,
    ],
  },

  [RoleName.EMPLOYER]: {
    name: RoleName.EMPLOYER,
    description: 'Employer/recruiter with job posting and application review capabilities',
    isSystem: true,
    permissions: EMPLOYER_PERMISSIONS,
  },

  [RoleName.HIRING_MANAGER]: {
    name: RoleName.HIRING_MANAGER,
    description: 'Hiring manager with extended employer permissions and team analytics',
    isSystem: true,
    inheritsFrom: [RoleName.EMPLOYER],
    permissions: HIRING_MANAGER_PERMISSIONS,
  },

  [RoleName.RECRUITER]: {
    name: RoleName.RECRUITER,
    description: 'Professional recruiter with advanced candidate management',
    isSystem: true,
    inheritsFrom: [RoleName.HIRING_MANAGER],
    permissions: RECRUITER_PERMISSIONS,
  },

  [RoleName.ADMIN]: {
    name: RoleName.ADMIN,
    description: 'Platform administrator with user and content management capabilities',
    isSystem: true,
    permissions: [
      // All read permissions
      Permission.USER_READ,
      Permission.PROFILE_READ,
      Permission.RESUME_READ,
      Permission.JOB_READ,
      Permission.APPLICATION_READ,
      Permission.COMPANY_READ,
      Permission.DOCUMENT_READ,

      // User administration
      Permission.ADMIN_USERS,
      Permission.USER_WRITE,
      Permission.USER_DELETE,

      // Analytics
      Permission.ADMIN_ANALYTICS,
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_EXPORT,
      Permission.ANALYTICS_PERSONAL,
      Permission.ANALYTICS_TEAM,
      Permission.ANALYTICS_PLATFORM,

      // Settings
      Permission.ADMIN_SETTINGS,

      // Billing administration
      Permission.ADMIN_BILLING,
      Permission.BILLING_VIEW,
      Permission.BILLING_MANAGE,
      Permission.BILLING_HISTORY,

      // Audit logs
      Permission.ADMIN_AUDIT_LOGS,

      // Content management
      Permission.ADMIN_CONTENT,
      Permission.JOB_CREATE,
      Permission.JOB_UPDATE,
      Permission.JOB_DELETE,
      Permission.JOB_PUBLISH,
      Permission.JOB_ARCHIVE,

      // Company management
      Permission.COMPANY_CREATE,
      Permission.COMPANY_UPDATE,
      Permission.COMPANY_DELETE,
      Permission.COMPANY_MANAGE_USERS,

      // Communication
      Permission.MESSAGE_SEND,
      Permission.MESSAGE_READ,
      Permission.MESSAGE_DELETE,
      Permission.NOTIFICATION_SEND,
      Permission.NOTIFICATION_MANAGE,

      // Application management
      Permission.APPLICATION_UPDATE,
      Permission.APPLICATION_DELETE,
      Permission.APPLICATION_REVIEW,
      Permission.APPLICATION_BULK,
    ],
  },

  [RoleName.SUPER_ADMIN]: {
    name: RoleName.SUPER_ADMIN,
    description: 'Super administrator with full system access',
    isSystem: true,
    permissions: [
      // Super admin has all permissions
      Permission.SUPER_ADMIN,
      ...Object.values(Permission),
    ],
  },
};

/**
 * Role utility class
 */
export class RoleManager {
  private customRoles: Map<string, Role> = new Map();

  /**
   * Get a role by name (checks both built-in and custom roles)
   */
  getRole(roleName: string): Role | undefined {
    // Check built-in roles first
    if (roleName in BUILT_IN_ROLES) {
      return BUILT_IN_ROLES[roleName as RoleName];
    }
    // Check custom roles
    return this.customRoles.get(roleName);
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getRolePermissions(roleName: string): Permission[] {
    const role = this.getRole(roleName);
    if (!role) {
      return [];
    }

    const permissions = new Set<Permission>(role.permissions);

    // Add inherited permissions
    if (role.inheritsFrom) {
      for (const parentRoleName of role.inheritsFrom) {
        const parentPermissions = this.getRolePermissions(parentRoleName);
        parentPermissions.forEach((perm) => permissions.add(perm));
      }
    }

    return Array.from(permissions);
  }

  /**
   * Check if a role has a specific permission
   */
  roleHasPermission(roleName: string, permission: Permission): boolean {
    const permissions = this.getRolePermissions(roleName);

    // Super admin always has all permissions
    if (permissions.includes(Permission.SUPER_ADMIN)) {
      return true;
    }

    return permissions.includes(permission);
  }

  /**
   * Register a custom role
   */
  registerCustomRole(role: Role): void {
    if (role.isSystem) {
      throw new Error('Cannot register a system role as custom role');
    }
    if (role.name in BUILT_IN_ROLES) {
      throw new Error(`Role name '${role.name}' conflicts with built-in role`);
    }
    this.customRoles.set(role.name, role);
  }

  /**
   * Update a custom role
   */
  updateCustomRole(roleName: string, updates: Partial<Role>): void {
    const role = this.customRoles.get(roleName);
    if (!role) {
      throw new Error(`Custom role '${roleName}' not found`);
    }
    if (role.isSystem) {
      throw new Error('Cannot update system role');
    }

    this.customRoles.set(roleName, {
      ...role,
      ...updates,
      name: roleName, // Name cannot be changed
      isSystem: false, // Custom roles are never system roles
    });
  }

  /**
   * Delete a custom role
   */
  deleteCustomRole(roleName: string): boolean {
    const role = this.customRoles.get(roleName);
    if (!role) {
      return false;
    }
    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }
    return this.customRoles.delete(roleName);
  }

  /**
   * Get all roles (built-in and custom)
   */
  getAllRoles(): Role[] {
    const builtInRoles = Object.values(BUILT_IN_ROLES);
    const customRoles = Array.from(this.customRoles.values());
    return [...builtInRoles, ...customRoles];
  }

  /**
   * Check if a role exists
   */
  roleExists(roleName: string): boolean {
    return roleName in BUILT_IN_ROLES || this.customRoles.has(roleName);
  }

  /**
   * Get role hierarchy (parent roles)
   */
  getRoleHierarchy(roleName: string): string[] {
    const role = this.getRole(roleName);
    if (!role || !role.inheritsFrom) {
      return [];
    }

    const hierarchy: string[] = [...role.inheritsFrom];
    for (const parentRoleName of role.inheritsFrom) {
      hierarchy.push(...this.getRoleHierarchy(parentRoleName));
    }

    return Array.from(new Set(hierarchy)); // Remove duplicates
  }
}

// Export singleton instance
export const roleManager = new RoleManager();
