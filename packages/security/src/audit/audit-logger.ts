/**
 * ApplyForUs AI - Audit Logger
 *
 * Comprehensive audit logging system for security, compliance, and monitoring.
 */

import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  AuditEvent,
  AuditEventType,
  AuditEventSeverity,
  AuditEventOutcome,
  AuditActor,
  AuditResource,
  DataChangeRecord,
  AuditEventFactory,
  AuditDetailValue,
} from './audit-events';

/**
 * Audit log storage interface
 */
export interface AuditLogStorage {
  save(event: AuditEvent): Promise<void>;
  query(filters: AuditLogQuery): Promise<AuditEvent[]>;
  count(filters: AuditLogQuery): Promise<number>;
}

/**
 * Audit log query filters
 */
export interface AuditLogQuery {
  startDate?: Date;
  endDate?: Date;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  eventTypes?: AuditEventType[];
  severities?: AuditEventSeverity[];
  outcomes?: AuditEventOutcome[];
  limit?: number;
  offset?: number;
}

/**
 * Audit logger configuration
 */
export interface AuditLoggerConfig {
  storage: AuditLogStorage;
  enabled: boolean;
  includeStackTrace?: boolean;
  redactSensitiveData?: boolean;
  sensitiveFields?: string[];
  emitEvents?: boolean;
}

/**
 * In-memory audit log storage (for development/testing)
 */
export class InMemoryAuditStorage implements AuditLogStorage {
  private logs: AuditEvent[] = [];
  private maxSize: number = 10000;

  async save(event: AuditEvent): Promise<void> {
    this.logs.push(event);

    // Keep only the most recent logs
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(-this.maxSize);
    }
  }

  async query(filters: AuditLogQuery): Promise<AuditEvent[]> {
    let results = [...this.logs];

    // Apply filters
    if (filters.startDate) {
      results = results.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter((e) => e.timestamp <= filters.endDate!);
    }
    if (filters.actorId) {
      results = results.filter((e) => e.actor.id === filters.actorId);
    }
    if (filters.resourceType) {
      results = results.filter((e) => e.resource?.type === filters.resourceType);
    }
    if (filters.resourceId) {
      results = results.filter((e) => e.resource?.id === filters.resourceId);
    }
    if (filters.eventTypes && filters.eventTypes.length > 0) {
      results = results.filter((e) => filters.eventTypes!.includes(e.type));
    }
    if (filters.severities && filters.severities.length > 0) {
      results = results.filter((e) => filters.severities!.includes(e.severity));
    }
    if (filters.outcomes && filters.outcomes.length > 0) {
      results = results.filter((e) => filters.outcomes!.includes(e.outcome));
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;
    return results.slice(offset, offset + limit);
  }

  async count(filters: AuditLogQuery): Promise<number> {
    const results = await this.query({ ...filters, limit: undefined, offset: undefined });
    return results.length;
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Main Audit Logger class
 */
export class AuditLogger extends EventEmitter {
  private config: AuditLoggerConfig;
  private sensitiveFieldPatterns: RegExp[];

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    super();

    this.config = {
      storage: new InMemoryAuditStorage(),
      enabled: true,
      includeStackTrace: false,
      redactSensitiveData: true,
      sensitiveFields: [
        'password',
        'token',
        'secret',
        'apiKey',
        'creditCard',
        'ssn',
        'bankAccount',
      ],
      emitEvents: true,
      ...config,
    };

    this.sensitiveFieldPatterns = this.config.sensitiveFields!.map(
      (field) => new RegExp(field, 'i')
    );
  }

  /**
   * Log an audit event
   */
  async log(
    eventData: Omit<AuditEvent, 'id' | 'timestamp'>,
    metadata?: AuditEvent['metadata']
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...eventData,
      metadata,
    };

    // Redact sensitive data if enabled
    if (this.config.redactSensitiveData) {
      event.details = this.redactSensitiveData(event.details) as Record<string, AuditDetailValue>;
    }

    try {
      await this.config.storage.save(event);

      // Emit event for real-time monitoring
      if (this.config.emitEvents) {
        this.emit('audit-event', event);
        this.emit(`audit-event:${event.type}`, event);
      }
    } catch (error) {
      console.error('Failed to save audit log:', error);
      this.emit('error', error);
    }
  }

  /**
   * Log access event (read, create, update, delete)
   */
  async logAccess(
    userId: string,
    resource: AuditResource,
    action: 'read' | 'create' | 'update' | 'delete',
    details: Record<string, AuditDetailValue> = {},
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const actor: AuditActor = {
      id: userId,
      type: 'user',
      ...actorInfo,
    };

    const eventData = AuditEventFactory.createDataAccess(actor, resource, action);
    eventData.details = { ...eventData.details, ...details };

    await this.log(eventData);
  }

  /**
   * Log data change with before/after values
   */
  async logDataChange(
    userId: string,
    resource: AuditResource,
    before: Record<string, AuditDetailValue>,
    after: Record<string, AuditDetailValue>,
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const changes = this.detectChanges(before, after);

    if (changes.length === 0) {
      return; // No changes detected
    }

    const actor: AuditActor = {
      id: userId,
      type: 'user',
      ...actorInfo,
    };

    const eventData = AuditEventFactory.createDataChange(actor, resource, changes);
    await this.log(eventData);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: AuditEventType,
    details: Record<string, AuditDetailValue>,
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const actor: AuditActor = {
      id: actorInfo?.id || 'system',
      type: actorInfo?.type || 'system',
      ...actorInfo,
    };

    const eventData = AuditEventFactory.createSecurityEvent(eventType, actor, details);
    await this.log(eventData);
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    userId: string,
    success: boolean,
    details: Record<string, AuditDetailValue> & { reason?: string } = {},
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const actor: AuditActor = {
      id: userId,
      type: 'user',
      ...actorInfo,
    };

    const eventData = success
      ? AuditEventFactory.createLoginSuccess(actor)
      : AuditEventFactory.createLoginFailure(actor, details.reason || 'Unknown');

    eventData.details = { ...eventData.details, ...details };

    await this.log(eventData);
  }

  /**
   * Log access denied event
   */
  async logAccessDenied(
    userId: string,
    resource: AuditResource,
    reason: string,
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const actor: AuditActor = {
      id: userId,
      type: 'user',
      ...actorInfo,
    };

    const eventData = AuditEventFactory.createAccessDenied(actor, resource, reason);
    await this.log(eventData);
  }

  /**
   * Log compliance event
   */
  async logComplianceEvent(
    eventType: AuditEventType,
    userId: string,
    details: Record<string, AuditDetailValue>,
    actorInfo?: Partial<AuditActor>
  ): Promise<void> {
    const actor: AuditActor = {
      id: userId,
      type: 'user',
      ...actorInfo,
    };

    const eventData = AuditEventFactory.createComplianceEvent(eventType, actor, details);
    await this.log(eventData);
  }

  /**
   * Log system error
   */
  async logSystemError(error: Error, context?: Record<string, AuditDetailValue>): Promise<void> {
    const eventData = AuditEventFactory.createSystemError(error, context);
    await this.log(eventData);
  }

  /**
   * Query audit logs
   */
  async query(filters: AuditLogQuery): Promise<AuditEvent[]> {
    return this.config.storage.query(filters);
  }

  /**
   * Count audit logs matching filters
   */
  async count(filters: AuditLogQuery): Promise<number> {
    return this.config.storage.count(filters);
  }

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(
    resourceType: string,
    resourceId: string,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    return this.query({
      resourceType,
      resourceId,
      limit,
    });
  }

  /**
   * Get audit trail for a specific user
   */
  async getUserAuditTrail(
    userId: string,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    return this.query({
      actorId: userId,
      limit,
    });
  }

  /**
   * Get security events within a time range
   */
  async getSecurityEvents(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    const securityEventTypes = Object.values(AuditEventType).filter(
      (type) => type.startsWith('security.') || type.startsWith('auth.')
    );

    return this.query({
      startDate,
      endDate,
      eventTypes: securityEventTypes,
      limit,
    });
  }

  /**
   * Get compliance events within a time range
   */
  async getComplianceEvents(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<AuditEvent[]> {
    const complianceEventTypes = Object.values(AuditEventType).filter((type) =>
      type.startsWith('compliance.')
    );

    return this.query({
      startDate,
      endDate,
      eventTypes: complianceEventTypes,
      limit,
    });
  }

  /**
   * Detect changes between two objects
   */
  private detectChanges(
    before: Record<string, AuditDetailValue>,
    after: Record<string, AuditDetailValue>
  ): DataChangeRecord[] {
    const changes: DataChangeRecord[] = [];
    const timestamp = new Date();

    // Check for changed and removed fields
    for (const [key, oldValue] of Object.entries(before)) {
      const newValue = after[key];

      if (!this.areValuesEqual(oldValue, newValue)) {
        changes.push({
          field: key,
          oldValue: this.sanitizeValue(oldValue),
          newValue: this.sanitizeValue(newValue),
          timestamp,
        });
      }
    }

    // Check for added fields
    for (const [key, newValue] of Object.entries(after)) {
      if (!(key in before)) {
        changes.push({
          field: key,
          oldValue: undefined,
          newValue: this.sanitizeValue(newValue),
          timestamp,
        });
      }
    }

    return changes;
  }

  /**
   * Compare two values for equality
   */
  private areValuesEqual(a: AuditDetailValue, b: AuditDetailValue): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  /**
   * Sanitize value for logging
   */
  private sanitizeValue(value: AuditDetailValue): AuditDetailValue {
    if (value === undefined) return undefined;
    if (value === null) return null;

    // Truncate large strings
    if (typeof value === 'string' && value.length > 1000) {
      return value.substring(0, 1000) + '... (truncated)';
    }

    return value;
  }

  /**
   * Redact sensitive data from object
   */
  private redactSensitiveData(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveData(item));
    }

    if (typeof obj === 'object') {
      const redacted: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveField(key)) {
          redacted[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          redacted[key] = this.redactSensitiveData(value);
        } else {
          redacted[key] = value;
        }
      }

      return redacted;
    }

    return obj;
  }

  /**
   * Check if a field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    return this.sensitiveFieldPatterns.some((pattern) => pattern.test(fieldName));
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Set storage backend
   */
  setStorage(storage: AuditLogStorage): void {
    this.config.storage = storage;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Get configuration
   */
  getConfig(): AuditLoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();
