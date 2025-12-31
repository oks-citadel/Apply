/**
 * ApplyForUs AI - Audit Event Definitions
 *
 * Defines audit event types and structures for compliance and security monitoring.
 */

/**
 * Audit event types
 */
export enum AuditEventType {
  // Authentication Events
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_PASSWORD_CHANGE = 'auth.password.change',
  AUTH_PASSWORD_RESET = 'auth.password.reset',
  AUTH_MFA_ENABLED = 'auth.mfa.enabled',
  AUTH_MFA_DISABLED = 'auth.mfa.disabled',
  AUTH_TOKEN_ISSUED = 'auth.token.issued',
  AUTH_TOKEN_REVOKED = 'auth.token.revoked',

  // User Management Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_SUSPENDED = 'user.suspended',
  USER_ACTIVATED = 'user.activated',
  USER_ROLE_CHANGED = 'user.role.changed',
  USER_PERMISSION_CHANGED = 'user.permission.changed',
  USER_IMPERSONATION_START = 'user.impersonation.start',
  USER_IMPERSONATION_END = 'user.impersonation.end',

  // Data Access Events
  DATA_READ = 'data.read',
  DATA_CREATE = 'data.create',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_SHARE = 'data.share',
  DATA_UNSHARE = 'data.unshare',

  // Resume Events
  RESUME_CREATED = 'resume.created',
  RESUME_UPDATED = 'resume.updated',
  RESUME_DELETED = 'resume.deleted',
  RESUME_EXPORTED = 'resume.exported',
  RESUME_PARSED = 'resume.parsed',
  RESUME_OPTIMIZED = 'resume.optimized',

  // Application Events
  APPLICATION_SUBMITTED = 'application.submitted',
  APPLICATION_UPDATED = 'application.updated',
  APPLICATION_WITHDRAWN = 'application.withdrawn',
  APPLICATION_REVIEWED = 'application.reviewed',
  APPLICATION_STATUS_CHANGED = 'application.status.changed',

  // Auto-Apply Events
  AUTO_APPLY_ENABLED = 'auto_apply.enabled',
  AUTO_APPLY_DISABLED = 'auto_apply.disabled',
  AUTO_APPLY_EXECUTED = 'auto_apply.executed',
  AUTO_APPLY_FAILED = 'auto_apply.failed',

  // Job Events
  JOB_CREATED = 'job.created',
  JOB_UPDATED = 'job.updated',
  JOB_DELETED = 'job.deleted',
  JOB_PUBLISHED = 'job.published',
  JOB_ARCHIVED = 'job.archived',

  // Security Events
  SECURITY_ACCESS_DENIED = 'security.access.denied',
  SECURITY_PERMISSION_VIOLATION = 'security.permission.violation',
  SECURITY_SUSPICIOUS_ACTIVITY = 'security.suspicious.activity',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.rate_limit.exceeded',
  SECURITY_IP_BLOCKED = 'security.ip.blocked',
  SECURITY_ENCRYPTION_KEY_ROTATED = 'security.encryption.key.rotated',

  // Compliance Events
  COMPLIANCE_GDPR_DATA_EXPORT = 'compliance.gdpr.data.export',
  COMPLIANCE_GDPR_DATA_DELETION = 'compliance.gdpr.data.deletion',
  COMPLIANCE_GDPR_CONSENT_GRANTED = 'compliance.gdpr.consent.granted',
  COMPLIANCE_GDPR_CONSENT_REVOKED = 'compliance.gdpr.consent.revoked',
  COMPLIANCE_CCPA_OPT_OUT = 'compliance.ccpa.opt_out',
  COMPLIANCE_CCPA_DATA_REQUEST = 'compliance.ccpa.data.request',

  // Admin Events
  ADMIN_SETTINGS_CHANGED = 'admin.settings.changed',
  ADMIN_USER_MANAGED = 'admin.user.managed',
  ADMIN_SYSTEM_CONFIGURED = 'admin.system.configured',

  // Billing Events
  BILLING_SUBSCRIPTION_CREATED = 'billing.subscription.created',
  BILLING_SUBSCRIPTION_UPDATED = 'billing.subscription.updated',
  BILLING_SUBSCRIPTION_CANCELLED = 'billing.subscription.cancelled',
  BILLING_PAYMENT_SUCCESS = 'billing.payment.success',
  BILLING_PAYMENT_FAILED = 'billing.payment.failed',

  // System Events
  SYSTEM_STARTUP = 'system.startup',
  SYSTEM_SHUTDOWN = 'system.shutdown',
  SYSTEM_ERROR = 'system.error',
  SYSTEM_MAINTENANCE_START = 'system.maintenance.start',
  SYSTEM_MAINTENANCE_END = 'system.maintenance.end',
}

/**
 * Audit event severity
 */
export enum AuditEventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Audit event outcome
 */
export enum AuditEventOutcome {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL = 'partial',
}

/**
 * Actor information
 */
export interface AuditActor {
  id: string;
  type: 'user' | 'system' | 'api' | 'service';
  name?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  impersonatedBy?: string; // If acting on behalf of another user
}

/**
 * Audit resource attribute value types
 */
export type AuditAttributeValue = string | number | boolean | Date | null | undefined | AuditAttributeValue[] | { [key: string]: AuditAttributeValue };

/**
 * Resource information
 */
export interface AuditResource {
  type: string;
  id: string;
  name?: string;
  attributes?: Record<string, AuditAttributeValue>;
}

/**
 * Audit event detail value types
 * Note: Using a broader type to accommodate various data structures from services
 */
export type AuditDetailValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | AuditDetailValue[]
  | Record<string, unknown>;

/**
 * Audit event structure
 */
export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditEventSeverity;
  outcome: AuditEventOutcome;
  actor: AuditActor;
  resource?: AuditResource;
  action: string;
  details: Record<string, AuditDetailValue>;
  metadata?: {
    correlationId?: string; // For tracking related events
    requestId?: string;
    duration?: number; // Duration in milliseconds
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };
  };
}

/**
 * Data change record
 */
export interface DataChangeRecord {
  field: string;
  oldValue: AuditDetailValue;
  newValue: AuditDetailValue;
  timestamp: Date;
}

/**
 * Audit event factory functions
 */
export class AuditEventFactory {
  /**
   * Create authentication success event
   */
  static createLoginSuccess(actor: AuditActor): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.AUTH_LOGIN_SUCCESS,
      severity: AuditEventSeverity.INFO,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      action: 'login',
      details: {
        method: 'password',
      },
    };
  }

  /**
   * Create authentication failure event
   */
  static createLoginFailure(
    actor: AuditActor,
    reason: string
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.AUTH_LOGIN_FAILURE,
      severity: AuditEventSeverity.WARNING,
      outcome: AuditEventOutcome.FAILURE,
      actor,
      action: 'login',
      details: {
        reason,
      },
    };
  }

  /**
   * Create data access event
   */
  static createDataAccess(
    actor: AuditActor,
    resource: AuditResource,
    action: 'read' | 'create' | 'update' | 'delete'
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    const typeMap = {
      read: AuditEventType.DATA_READ,
      create: AuditEventType.DATA_CREATE,
      update: AuditEventType.DATA_UPDATE,
      delete: AuditEventType.DATA_DELETE,
    };

    return {
      type: typeMap[action],
      severity: AuditEventSeverity.INFO,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      resource,
      action,
      details: {},
    };
  }

  /**
   * Create data change event
   */
  static createDataChange(
    actor: AuditActor,
    resource: AuditResource,
    changes: DataChangeRecord[]
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.DATA_UPDATE,
      severity: AuditEventSeverity.INFO,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      resource,
      action: 'update',
      details: {
        changes: changes.map((c) => ({
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
        })),
      },
    };
  }

  /**
   * Create security event
   */
  static createSecurityEvent(
    type: AuditEventType,
    actor: AuditActor,
    details: Record<string, AuditDetailValue>
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type,
      severity: AuditEventSeverity.WARNING,
      outcome: AuditEventOutcome.FAILURE,
      actor,
      action: 'security_check',
      details,
    };
  }

  /**
   * Create access denied event
   */
  static createAccessDenied(
    actor: AuditActor,
    resource: AuditResource,
    reason: string
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.SECURITY_ACCESS_DENIED,
      severity: AuditEventSeverity.WARNING,
      outcome: AuditEventOutcome.FAILURE,
      actor,
      resource,
      action: 'access',
      details: {
        reason,
      },
    };
  }

  /**
   * Create compliance event
   */
  static createComplianceEvent(
    type: AuditEventType,
    actor: AuditActor,
    details: Record<string, AuditDetailValue>
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type,
      severity: AuditEventSeverity.INFO,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      action: 'compliance_action',
      details,
    };
  }

  /**
   * Create GDPR data export event
   */
  static createGDPRDataExport(
    actor: AuditActor,
    userId: string
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.COMPLIANCE_GDPR_DATA_EXPORT,
      severity: AuditEventSeverity.INFO,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      resource: {
        type: 'user',
        id: userId,
      },
      action: 'export',
      details: {
        regulation: 'GDPR',
        right: 'data_portability',
      },
    };
  }

  /**
   * Create GDPR data deletion event
   */
  static createGDPRDataDeletion(
    actor: AuditActor,
    userId: string
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      severity: AuditEventSeverity.WARNING,
      outcome: AuditEventOutcome.SUCCESS,
      actor,
      resource: {
        type: 'user',
        id: userId,
      },
      action: 'delete',
      details: {
        regulation: 'GDPR',
        right: 'right_to_be_forgotten',
      },
    };
  }

  /**
   * Create system error event
   */
  static createSystemError(
    error: Error,
    context?: Record<string, AuditDetailValue>
  ): Omit<AuditEvent, 'id' | 'timestamp'> {
    return {
      type: AuditEventType.SYSTEM_ERROR,
      severity: AuditEventSeverity.ERROR,
      outcome: AuditEventOutcome.FAILURE,
      actor: {
        id: 'system',
        type: 'system',
      },
      action: 'system_operation',
      details: {
        error: error.message,
        stack: error.stack,
        ...context,
      },
    };
  }
}

/**
 * Event severity helpers
 */
export function getEventSeverityLevel(severity: AuditEventSeverity): number {
  const levels = {
    [AuditEventSeverity.INFO]: 0,
    [AuditEventSeverity.WARNING]: 1,
    [AuditEventSeverity.ERROR]: 2,
    [AuditEventSeverity.CRITICAL]: 3,
  };
  return levels[severity];
}

/**
 * Check if event type is security-related
 */
export function isSecurityEvent(type: AuditEventType): boolean {
  return type.startsWith('security.') || type.includes('auth.');
}

/**
 * Check if event type is compliance-related
 */
export function isComplianceEvent(type: AuditEventType): boolean {
  return type.startsWith('compliance.');
}
