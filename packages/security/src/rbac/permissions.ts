/**
 * ApplyForUs AI - RBAC Permissions System
 *
 * Defines all platform permissions for granular access control.
 */

export enum Permission {
  // User Management Permissions
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_IMPERSONATE = 'user:impersonate',

  // Profile Permissions
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',
  PROFILE_DELETE = 'profile:delete',

  // Resume Permissions
  RESUME_CREATE = 'resume:create',
  RESUME_READ = 'resume:read',
  RESUME_UPDATE = 'resume:update',
  RESUME_DELETE = 'resume:delete',
  RESUME_EXPORT = 'resume:export',
  RESUME_PARSE = 'resume:parse',
  RESUME_OPTIMIZE = 'resume:optimize',

  // Job Permissions
  JOB_READ = 'job:read',
  JOB_SEARCH = 'job:search',
  JOB_APPLY = 'job:apply',
  JOB_CREATE = 'job:create',
  JOB_UPDATE = 'job:update',
  JOB_DELETE = 'job:delete',
  JOB_PUBLISH = 'job:publish',
  JOB_ARCHIVE = 'job:archive',

  // Application Permissions
  APPLICATION_READ = 'application:read',
  APPLICATION_CREATE = 'application:create',
  APPLICATION_UPDATE = 'application:update',
  APPLICATION_DELETE = 'application:delete',
  APPLICATION_REVIEW = 'application:review',
  APPLICATION_TRACK = 'application:track',
  APPLICATION_BULK = 'application:bulk',

  // Auto-Apply Permissions
  AUTO_APPLY_ENABLE = 'auto_apply:enable',
  AUTO_APPLY_CONFIGURE = 'auto_apply:configure',
  AUTO_APPLY_MONITOR = 'auto_apply:monitor',

  // Analytics Permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_PERSONAL = 'analytics:personal',
  ANALYTICS_TEAM = 'analytics:team',
  ANALYTICS_PLATFORM = 'analytics:platform',

  // Interview Permissions
  INTERVIEW_SCHEDULE = 'interview:schedule',
  INTERVIEW_CONDUCT = 'interview:conduct',
  INTERVIEW_VIEW = 'interview:view',
  INTERVIEW_FEEDBACK = 'interview:feedback',

  // Communication Permissions
  MESSAGE_SEND = 'message:send',
  MESSAGE_READ = 'message:read',
  MESSAGE_DELETE = 'message:delete',
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_MANAGE = 'notification:manage',

  // Document Permissions
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_READ = 'document:read',
  DOCUMENT_DELETE = 'document:delete',
  DOCUMENT_SHARE = 'document:share',

  // Company Permissions
  COMPANY_CREATE = 'company:create',
  COMPANY_READ = 'company:read',
  COMPANY_UPDATE = 'company:update',
  COMPANY_DELETE = 'company:delete',
  COMPANY_MANAGE_USERS = 'company:manage_users',

  // Billing Permissions
  BILLING_VIEW = 'billing:view',
  BILLING_MANAGE = 'billing:manage',
  BILLING_HISTORY = 'billing:history',

  // Admin Permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_ANALYTICS = 'admin:analytics',
  ADMIN_SETTINGS = 'admin:settings',
  ADMIN_BILLING = 'admin:billing',
  ADMIN_AUDIT_LOGS = 'admin:audit_logs',
  ADMIN_SECURITY = 'admin:security',
  ADMIN_CONTENT = 'admin:content',

  // Super Admin Permission (all access)
  SUPER_ADMIN = 'super_admin:all',
}

/**
 * Permission categories for easier management
 */
export enum PermissionCategory {
  USER = 'user',
  RESUME = 'resume',
  JOB = 'job',
  APPLICATION = 'application',
  ANALYTICS = 'analytics',
  INTERVIEW = 'interview',
  COMMUNICATION = 'communication',
  DOCUMENT = 'document',
  COMPANY = 'company',
  BILLING = 'billing',
  ADMIN = 'admin',
}

/**
 * Maps permissions to their categories
 */
export const PERMISSION_CATEGORIES: Record<Permission, PermissionCategory> = {
  [Permission.USER_READ]: PermissionCategory.USER,
  [Permission.USER_WRITE]: PermissionCategory.USER,
  [Permission.USER_DELETE]: PermissionCategory.USER,
  [Permission.USER_IMPERSONATE]: PermissionCategory.USER,
  [Permission.PROFILE_READ]: PermissionCategory.USER,
  [Permission.PROFILE_WRITE]: PermissionCategory.USER,
  [Permission.PROFILE_DELETE]: PermissionCategory.USER,

  [Permission.RESUME_CREATE]: PermissionCategory.RESUME,
  [Permission.RESUME_READ]: PermissionCategory.RESUME,
  [Permission.RESUME_UPDATE]: PermissionCategory.RESUME,
  [Permission.RESUME_DELETE]: PermissionCategory.RESUME,
  [Permission.RESUME_EXPORT]: PermissionCategory.RESUME,
  [Permission.RESUME_PARSE]: PermissionCategory.RESUME,
  [Permission.RESUME_OPTIMIZE]: PermissionCategory.RESUME,

  [Permission.JOB_READ]: PermissionCategory.JOB,
  [Permission.JOB_SEARCH]: PermissionCategory.JOB,
  [Permission.JOB_APPLY]: PermissionCategory.JOB,
  [Permission.JOB_CREATE]: PermissionCategory.JOB,
  [Permission.JOB_UPDATE]: PermissionCategory.JOB,
  [Permission.JOB_DELETE]: PermissionCategory.JOB,
  [Permission.JOB_PUBLISH]: PermissionCategory.JOB,
  [Permission.JOB_ARCHIVE]: PermissionCategory.JOB,

  [Permission.APPLICATION_READ]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_CREATE]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_UPDATE]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_DELETE]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_REVIEW]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_TRACK]: PermissionCategory.APPLICATION,
  [Permission.APPLICATION_BULK]: PermissionCategory.APPLICATION,

  [Permission.AUTO_APPLY_ENABLE]: PermissionCategory.APPLICATION,
  [Permission.AUTO_APPLY_CONFIGURE]: PermissionCategory.APPLICATION,
  [Permission.AUTO_APPLY_MONITOR]: PermissionCategory.APPLICATION,

  [Permission.ANALYTICS_VIEW]: PermissionCategory.ANALYTICS,
  [Permission.ANALYTICS_EXPORT]: PermissionCategory.ANALYTICS,
  [Permission.ANALYTICS_PERSONAL]: PermissionCategory.ANALYTICS,
  [Permission.ANALYTICS_TEAM]: PermissionCategory.ANALYTICS,
  [Permission.ANALYTICS_PLATFORM]: PermissionCategory.ANALYTICS,

  [Permission.INTERVIEW_SCHEDULE]: PermissionCategory.INTERVIEW,
  [Permission.INTERVIEW_CONDUCT]: PermissionCategory.INTERVIEW,
  [Permission.INTERVIEW_VIEW]: PermissionCategory.INTERVIEW,
  [Permission.INTERVIEW_FEEDBACK]: PermissionCategory.INTERVIEW,

  [Permission.MESSAGE_SEND]: PermissionCategory.COMMUNICATION,
  [Permission.MESSAGE_READ]: PermissionCategory.COMMUNICATION,
  [Permission.MESSAGE_DELETE]: PermissionCategory.COMMUNICATION,
  [Permission.NOTIFICATION_SEND]: PermissionCategory.COMMUNICATION,
  [Permission.NOTIFICATION_MANAGE]: PermissionCategory.COMMUNICATION,

  [Permission.DOCUMENT_UPLOAD]: PermissionCategory.DOCUMENT,
  [Permission.DOCUMENT_READ]: PermissionCategory.DOCUMENT,
  [Permission.DOCUMENT_DELETE]: PermissionCategory.DOCUMENT,
  [Permission.DOCUMENT_SHARE]: PermissionCategory.DOCUMENT,

  [Permission.COMPANY_CREATE]: PermissionCategory.COMPANY,
  [Permission.COMPANY_READ]: PermissionCategory.COMPANY,
  [Permission.COMPANY_UPDATE]: PermissionCategory.COMPANY,
  [Permission.COMPANY_DELETE]: PermissionCategory.COMPANY,
  [Permission.COMPANY_MANAGE_USERS]: PermissionCategory.COMPANY,

  [Permission.BILLING_VIEW]: PermissionCategory.BILLING,
  [Permission.BILLING_MANAGE]: PermissionCategory.BILLING,
  [Permission.BILLING_HISTORY]: PermissionCategory.BILLING,

  [Permission.ADMIN_USERS]: PermissionCategory.ADMIN,
  [Permission.ADMIN_ANALYTICS]: PermissionCategory.ADMIN,
  [Permission.ADMIN_SETTINGS]: PermissionCategory.ADMIN,
  [Permission.ADMIN_BILLING]: PermissionCategory.ADMIN,
  [Permission.ADMIN_AUDIT_LOGS]: PermissionCategory.ADMIN,
  [Permission.ADMIN_SECURITY]: PermissionCategory.ADMIN,
  [Permission.ADMIN_CONTENT]: PermissionCategory.ADMIN,

  [Permission.SUPER_ADMIN]: PermissionCategory.ADMIN,
};

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.USER_READ]: 'View user information',
  [Permission.USER_WRITE]: 'Create and update user information',
  [Permission.USER_DELETE]: 'Delete user accounts',
  [Permission.USER_IMPERSONATE]: 'Impersonate other users',
  [Permission.PROFILE_READ]: 'View user profiles',
  [Permission.PROFILE_WRITE]: 'Update user profiles',
  [Permission.PROFILE_DELETE]: 'Delete user profiles',

  [Permission.RESUME_CREATE]: 'Create new resumes',
  [Permission.RESUME_READ]: 'View resumes',
  [Permission.RESUME_UPDATE]: 'Update existing resumes',
  [Permission.RESUME_DELETE]: 'Delete resumes',
  [Permission.RESUME_EXPORT]: 'Export resumes to various formats',
  [Permission.RESUME_PARSE]: 'Parse uploaded resume documents',
  [Permission.RESUME_OPTIMIZE]: 'Use AI to optimize resumes',

  [Permission.JOB_READ]: 'View job listings',
  [Permission.JOB_SEARCH]: 'Search for jobs',
  [Permission.JOB_APPLY]: 'Apply to job postings',
  [Permission.JOB_CREATE]: 'Create job postings',
  [Permission.JOB_UPDATE]: 'Update job postings',
  [Permission.JOB_DELETE]: 'Delete job postings',
  [Permission.JOB_PUBLISH]: 'Publish job postings',
  [Permission.JOB_ARCHIVE]: 'Archive job postings',

  [Permission.APPLICATION_READ]: 'View job applications',
  [Permission.APPLICATION_CREATE]: 'Submit job applications',
  [Permission.APPLICATION_UPDATE]: 'Update application status',
  [Permission.APPLICATION_DELETE]: 'Delete applications',
  [Permission.APPLICATION_REVIEW]: 'Review and evaluate applications',
  [Permission.APPLICATION_TRACK]: 'Track application progress',
  [Permission.APPLICATION_BULK]: 'Perform bulk application operations',

  [Permission.AUTO_APPLY_ENABLE]: 'Enable auto-apply feature',
  [Permission.AUTO_APPLY_CONFIGURE]: 'Configure auto-apply settings',
  [Permission.AUTO_APPLY_MONITOR]: 'Monitor auto-apply activities',

  [Permission.ANALYTICS_VIEW]: 'View analytics dashboards',
  [Permission.ANALYTICS_EXPORT]: 'Export analytics data',
  [Permission.ANALYTICS_PERSONAL]: 'View personal analytics',
  [Permission.ANALYTICS_TEAM]: 'View team analytics',
  [Permission.ANALYTICS_PLATFORM]: 'View platform-wide analytics',

  [Permission.INTERVIEW_SCHEDULE]: 'Schedule interviews',
  [Permission.INTERVIEW_CONDUCT]: 'Conduct interviews',
  [Permission.INTERVIEW_VIEW]: 'View interview details',
  [Permission.INTERVIEW_FEEDBACK]: 'Provide interview feedback',

  [Permission.MESSAGE_SEND]: 'Send messages',
  [Permission.MESSAGE_READ]: 'Read messages',
  [Permission.MESSAGE_DELETE]: 'Delete messages',
  [Permission.NOTIFICATION_SEND]: 'Send notifications',
  [Permission.NOTIFICATION_MANAGE]: 'Manage notification settings',

  [Permission.DOCUMENT_UPLOAD]: 'Upload documents',
  [Permission.DOCUMENT_READ]: 'View documents',
  [Permission.DOCUMENT_DELETE]: 'Delete documents',
  [Permission.DOCUMENT_SHARE]: 'Share documents',

  [Permission.COMPANY_CREATE]: 'Create company profiles',
  [Permission.COMPANY_READ]: 'View company information',
  [Permission.COMPANY_UPDATE]: 'Update company information',
  [Permission.COMPANY_DELETE]: 'Delete company profiles',
  [Permission.COMPANY_MANAGE_USERS]: 'Manage company users',

  [Permission.BILLING_VIEW]: 'View billing information',
  [Permission.BILLING_MANAGE]: 'Manage billing and subscriptions',
  [Permission.BILLING_HISTORY]: 'View billing history',

  [Permission.ADMIN_USERS]: 'Administer user accounts',
  [Permission.ADMIN_ANALYTICS]: 'Access admin analytics',
  [Permission.ADMIN_SETTINGS]: 'Manage platform settings',
  [Permission.ADMIN_BILLING]: 'Manage platform billing',
  [Permission.ADMIN_AUDIT_LOGS]: 'View audit logs',
  [Permission.ADMIN_SECURITY]: 'Manage security settings',
  [Permission.ADMIN_CONTENT]: 'Manage platform content',

  [Permission.SUPER_ADMIN]: 'Full system access',
};

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: PermissionCategory): Permission[] {
  return Object.entries(PERMISSION_CATEGORIES)
    .filter(([_, cat]) => cat === category)
    .map(([perm]) => perm as Permission);
}

/**
 * Check if a permission exists
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}
