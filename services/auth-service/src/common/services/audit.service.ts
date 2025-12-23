import { Injectable, Logger } from '@nestjs/common';

/**
 * Audit event types for authentication-related actions
 */
export enum AuthAuditEventType {
  // Authentication Events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGOUT = 'auth.logout',
  TOKEN_REFRESH = 'auth.token.refresh',

  // Password Events
  PASSWORD_CHANGE = 'auth.password.change',
  PASSWORD_RESET_REQUEST = 'auth.password.reset.request',
  PASSWORD_RESET_COMPLETE = 'auth.password.reset.complete',

  // MFA Events
  MFA_SETUP = 'auth.mfa.setup',
  MFA_ENABLED = 'auth.mfa.enabled',
  MFA_DISABLED = 'auth.mfa.disabled',
  MFA_VERIFICATION_FAILED = 'auth.mfa.verification.failed',

  // OAuth Events
  OAUTH_LOGIN = 'auth.oauth.login',
  OAUTH_LINK = 'auth.oauth.link',
  OAUTH_DISCONNECT = 'auth.oauth.disconnect',

  // Registration Events
  REGISTRATION = 'auth.registration',
  EMAIL_VERIFIED = 'auth.email.verified',

  // Security Events
  ACCOUNT_LOCKED = 'auth.account.locked',
  SUSPICIOUS_ACTIVITY = 'auth.suspicious.activity',
  RATE_LIMIT_EXCEEDED = 'auth.rate_limit.exceeded',
}

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  eventType: AuthAuditEventType;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
}

/**
 * Authentication Audit Service
 * Logs security-relevant events for compliance and security monitoring
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('SecurityAudit');

  /**
   * Log a successful login attempt
   */
  logLoginSuccess(userId: string, email: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      eventType: AuthAuditEventType.LOGIN_SUCCESS,
      userId,
      email,
      ipAddress,
      userAgent,
      success: true,
      details: { method: 'password' },
      timestamp: new Date(),
    });
  }

  /**
   * Log a failed login attempt
   */
  logLoginFailure(email: string, reason: string, ipAddress?: string, userAgent?: string): void {
    this.log({
      eventType: AuthAuditEventType.LOGIN_FAILURE,
      email,
      ipAddress,
      userAgent,
      success: false,
      details: { reason },
      timestamp: new Date(),
    });
  }

  /**
   * Log a logout event
   */
  logLogout(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.LOGOUT,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log a token refresh
   */
  logTokenRefresh(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.TOKEN_REFRESH,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log a password change
   */
  logPasswordChange(userId: string, email: string): void {
    this.log({
      eventType: AuthAuditEventType.PASSWORD_CHANGE,
      userId,
      email,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log a password reset request
   */
  logPasswordResetRequest(email: string, ipAddress?: string): void {
    this.log({
      eventType: AuthAuditEventType.PASSWORD_RESET_REQUEST,
      email,
      ipAddress,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log a password reset completion
   */
  logPasswordResetComplete(userId: string, email: string): void {
    this.log({
      eventType: AuthAuditEventType.PASSWORD_RESET_COMPLETE,
      userId,
      email,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log MFA setup initiation
   */
  logMfaSetup(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.MFA_SETUP,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log MFA enabled
   */
  logMfaEnabled(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.MFA_ENABLED,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log MFA disabled
   */
  logMfaDisabled(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.MFA_DISABLED,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log MFA verification failure
   */
  logMfaVerificationFailed(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.MFA_VERIFICATION_FAILED,
      userId,
      success: false,
      timestamp: new Date(),
    });
  }

  /**
   * Log OAuth login
   */
  logOAuthLogin(userId: string, email: string, provider: string): void {
    this.log({
      eventType: AuthAuditEventType.OAUTH_LOGIN,
      userId,
      email,
      success: true,
      details: { provider },
      timestamp: new Date(),
    });
  }

  /**
   * Log OAuth account linking
   */
  logOAuthLink(userId: string, provider: string): void {
    this.log({
      eventType: AuthAuditEventType.OAUTH_LINK,
      userId,
      success: true,
      details: { provider },
      timestamp: new Date(),
    });
  }

  /**
   * Log OAuth disconnect
   */
  logOAuthDisconnect(userId: string): void {
    this.log({
      eventType: AuthAuditEventType.OAUTH_DISCONNECT,
      userId,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log user registration
   */
  logRegistration(userId: string, email: string, ipAddress?: string): void {
    this.log({
      eventType: AuthAuditEventType.REGISTRATION,
      userId,
      email,
      ipAddress,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log email verification
   */
  logEmailVerified(userId: string, email: string): void {
    this.log({
      eventType: AuthAuditEventType.EMAIL_VERIFIED,
      userId,
      email,
      success: true,
      timestamp: new Date(),
    });
  }

  /**
   * Log account lockout
   */
  logAccountLocked(userId: string, email: string, reason: string): void {
    this.log({
      eventType: AuthAuditEventType.ACCOUNT_LOCKED,
      userId,
      email,
      success: false,
      details: { reason },
      timestamp: new Date(),
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    email: string,
    activity: string,
    ipAddress?: string,
    userAgent?: string,
  ): void {
    this.log({
      eventType: AuthAuditEventType.SUSPICIOUS_ACTIVITY,
      email,
      ipAddress,
      userAgent,
      success: false,
      details: { activity },
      timestamp: new Date(),
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(
    ipAddress: string,
    endpoint: string,
  ): void {
    this.log({
      eventType: AuthAuditEventType.RATE_LIMIT_EXCEEDED,
      ipAddress,
      success: false,
      details: { endpoint },
      timestamp: new Date(),
    });
  }

  /**
   * Core logging method
   * In production, this would also send to a centralized logging system
   * (e.g., Azure Application Insights, ELK stack, etc.)
   */
  private log(entry: AuditLogEntry): void {
    const logMessage = {
      type: 'SECURITY_AUDIT',
      ...entry,
      // Mask sensitive data
      email: entry.email ? this.maskEmail(entry.email) : undefined,
    };

    // Log based on success/failure
    if (entry.success) {
      this.logger.log(JSON.stringify(logMessage));
    } else {
      this.logger.warn(JSON.stringify(logMessage));
    }
  }

  /**
   * Mask email for logging (show first 2 chars and domain)
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `**@${domain}`;
    }
    return `${local.substring(0, 2)}***@${domain}`;
  }
}
