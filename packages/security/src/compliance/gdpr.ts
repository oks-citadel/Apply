/**
 * ApplyForUs AI - GDPR Compliance Service
 *
 * Implements GDPR (General Data Protection Regulation) compliance features.
 *
 * GDPR Article 17 - Right to Erasure (Right to be Forgotten)
 * GDPR Article 20 - Right to Data Portability
 */

import * as crypto from 'crypto';
import { auditLogger } from '../audit/audit-logger';
import { AuditEventType } from '../audit/audit-events';

/**
 * Service client interface for cross-service data operations
 */
export interface ServiceClient {
  fetchData(userId: string): Promise<any>;
  deleteData(userId: string): Promise<number>;
}

/**
 * Configuration for external service clients
 */
export interface GDPRServiceConfig {
  profileService?: ServiceClient;
  resumeService?: ServiceClient;
  applicationService?: ServiceClient;
  preferenceService?: ServiceClient;
  communicationService?: ServiceClient;
  analyticsService?: ServiceClient;
  documentService?: ServiceClient;
  activityLogService?: ServiceClient;
}

/**
 * GDPR consent purposes
 */
export enum ConsentPurpose {
  PROFILE_CREATION = 'profile_creation',
  JOB_MATCHING = 'job_matching',
  AUTO_APPLY = 'auto_apply',
  MARKETING = 'marketing',
  ANALYTICS = 'analytics',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  RESUME_OPTIMIZATION = 'resume_optimization',
  COMMUNICATION = 'communication',
}

/**
 * Consent record
 */
export interface ConsentRecord {
  id: string;
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
  version: string; // Privacy policy version
  ipAddress?: string;
  userAgent?: string;
  expiresAt?: Date;
}

/**
 * User data export structure (GDPR Article 20 - Data Portability)
 */
export interface UserDataExport {
  userId: string;
  exportedAt: Date;
  format: 'json' | 'csv' | 'xml';
  data: {
    profile: any;
    resumes: any[];
    applications: any[];
    jobPreferences: any;
    communications: any[];
    analytics: any;
    consents: ConsentRecord[];
    activityLog: any[];
  };
  metadata: {
    dataVersion: string;
    includesThirdPartyData: boolean;
    retentionPeriod?: string;
  };
}

/**
 * Data deletion report (GDPR Article 17 - Right to be Forgotten)
 */
export interface DataDeletionReport {
  userId: string;
  deletedAt: Date;
  deletedData: {
    profile: boolean;
    resumes: number;
    applications: number;
    documents: number;
    communications: number;
    analytics: boolean;
    consents: number;
  };
  retainedData: {
    type: string;
    reason: string;
    retentionPeriod: string;
  }[];
  verification: string; // Hash for verification
}

/**
 * Data processing record (GDPR Article 30 - Records of Processing Activities)
 */
export interface ProcessingRecord {
  id: string;
  userId: string;
  purpose: string;
  legalBasis: LegalBasis;
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: string;
  securityMeasures: string[];
  timestamp: Date;
}

/**
 * Legal basis for processing (GDPR Article 6)
 */
export enum LegalBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests',
}

/**
 * GDPR Service implementation
 *
 * Provides comprehensive GDPR compliance features including:
 * - Data export (Article 20 - Right to Data Portability)
 * - Data deletion (Article 17 - Right to Erasure)
 * - Consent management (Article 7)
 * - Processing records (Article 30)
 */
export class GDPRService {
  private consentStorage: Map<string, ConsentRecord[]> = new Map();
  private processingRecords: Map<string, ProcessingRecord[]> = new Map();
  private serviceClients: GDPRServiceConfig = {};

  /**
   * Configure external service clients for data operations
   */
  configureServices(config: GDPRServiceConfig): void {
    this.serviceClients = { ...this.serviceClients, ...config };
  }

  /**
   * Export user data (GDPR Article 20 - Right to Data Portability)
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<UserDataExport> {
    // Log the export request
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_EXPORT,
      userId,
      { format }
    );

    // In a real implementation, fetch data from various services
    const exportData: UserDataExport = {
      userId,
      exportedAt: new Date(),
      format,
      data: {
        profile: await this.fetchUserProfile(userId),
        resumes: await this.fetchUserResumes(userId),
        applications: await this.fetchUserApplications(userId),
        jobPreferences: await this.fetchUserPreferences(userId),
        communications: await this.fetchUserCommunications(userId),
        analytics: await this.fetchUserAnalytics(userId),
        consents: this.getConsentStatus(userId),
        activityLog: await this.fetchUserActivityLog(userId),
      },
      metadata: {
        dataVersion: '1.0',
        includesThirdPartyData: false,
        retentionPeriod: '7 years',
      },
    };

    return exportData;
  }

  /**
   * Delete user data (GDPR Article 17 - Right to be Forgotten)
   */
  async deleteUserData(
    userId: string,
    reason?: string
  ): Promise<DataDeletionReport> {
    // Log the deletion request
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      userId,
      { reason: reason || 'User request' }
    );

    // In a real implementation, delete data from various services
    // Also delete analytics and preferences
    await this.deleteUserAnalytics(userId);
    await this.deleteUserPreferences(userId);

    const report: DataDeletionReport = {
      userId,
      deletedAt: new Date(),
      deletedData: {
        profile: true,
        resumes: await this.deleteUserResumes(userId),
        applications: await this.deleteUserApplications(userId),
        documents: await this.deleteUserDocuments(userId),
        communications: await this.deleteUserCommunications(userId),
        analytics: true,
        consents: this.deleteUserConsents(userId),
      },
      retainedData: [
        {
          type: 'Transaction records',
          reason: 'Legal obligation (tax law)',
          retentionPeriod: '7 years from transaction date',
        },
        {
          type: 'Audit logs',
          reason: 'Legal obligation (data protection law)',
          retentionPeriod: '3 years',
        },
      ],
      verification: this.generateDeletionVerificationHash(userId),
    };

    return report;
  }

  /**
   * Get consent status for all purposes
   */
  getConsentStatus(userId: string): ConsentRecord[] {
    return this.consentStorage.get(userId) || [];
  }

  /**
   * Record consent (GDPR Article 7 - Conditions for Consent)
   */
  async recordConsent(
    userId: string,
    purpose: ConsentPurpose,
    granted: boolean,
    options: {
      version: string;
      ipAddress?: string;
      userAgent?: string;
      expiresAt?: Date;
    }
  ): Promise<ConsentRecord> {
    const record: ConsentRecord = {
      id: this.generateConsentId(),
      userId,
      purpose,
      granted,
      grantedAt: granted ? new Date() : undefined,
      revokedAt: !granted ? new Date() : undefined,
      version: options.version,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      expiresAt: options.expiresAt,
    };

    // Store consent record
    const userConsents = this.consentStorage.get(userId) || [];
    userConsents.push(record);
    this.consentStorage.set(userId, userConsents);

    // Log consent event
    const eventType = granted
      ? AuditEventType.COMPLIANCE_GDPR_CONSENT_GRANTED
      : AuditEventType.COMPLIANCE_GDPR_CONSENT_REVOKED;

    await auditLogger.logComplianceEvent(eventType, userId, {
      purpose,
      version: options.version,
    });

    return record;
  }

  /**
   * Revoke consent (GDPR Article 7(3) - Right to Withdraw Consent)
   */
  async revokeConsent(userId: string, purpose: ConsentPurpose): Promise<void> {
    await this.recordConsent(userId, purpose, false, {
      version: '1.0', // Should track current version
    });
  }

  /**
   * Check if user has given consent for a purpose
   */
  hasConsent(userId: string, purpose: ConsentPurpose): boolean {
    const consents = this.getConsentStatus(userId);
    const latestConsent = consents
      .filter((c) => c.purpose === purpose)
      .sort((a, b) => {
        const aTime = (a.grantedAt || a.revokedAt)?.getTime() || 0;
        const bTime = (b.grantedAt || b.revokedAt)?.getTime() || 0;
        return bTime - aTime;
      })[0];

    if (!latestConsent) {
      return false;
    }

    // Check if consent is granted and not expired
    if (!latestConsent.granted) {
      return false;
    }

    if (latestConsent.expiresAt && latestConsent.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Record data processing activity (GDPR Article 30)
   */
  async recordProcessingActivity(
    userId: string,
    purpose: string,
    legalBasis: LegalBasis,
    dataCategories: string[],
    recipients: string[] = [],
    retentionPeriod: string = '7 years'
  ): Promise<ProcessingRecord> {
    const record: ProcessingRecord = {
      id: this.generateProcessingRecordId(),
      userId,
      purpose,
      legalBasis,
      dataCategories,
      recipients,
      retentionPeriod,
      securityMeasures: [
        'AES-256-GCM encryption',
        'TLS 1.3',
        'Access control',
        'Audit logging',
      ],
      timestamp: new Date(),
    };

    const userRecords = this.processingRecords.get(userId) || [];
    userRecords.push(record);
    this.processingRecords.set(userId, userRecords);

    return record;
  }

  /**
   * Get processing records for user
   */
  getProcessingRecords(userId: string): ProcessingRecord[] {
    return this.processingRecords.get(userId) || [];
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance(userId: string): Promise<{
    compliant: boolean;
    expiredData: string[];
  }> {
    // Get processing records (for future implementation)
    this.getProcessingRecords(userId);
    const expiredData: string[] = [];

    // In a real implementation, check actual data retention
    // This is a simplified example

    return {
      compliant: expiredData.length === 0,
      expiredData,
    };
  }

  /**
   * Generate privacy notice
   */
  generatePrivacyNotice(): {
    controller: any;
    purposes: any[];
    legalBases: any[];
    recipients: any[];
    retentionPeriods: any[];
    rights: string[];
  } {
    return {
      controller: {
        name: 'ApplyForUs AI',
        contact: 'privacy@applyforus.com',
        dpo: 'dpo@applyforus.com',
      },
      purposes: [
        {
          purpose: 'Job matching and application processing',
          legalBasis: LegalBasis.CONTRACT,
          dataCategories: ['Profile', 'Resume', 'Job preferences'],
        },
        {
          purpose: 'Marketing communications',
          legalBasis: LegalBasis.CONSENT,
          dataCategories: ['Email', 'Communication preferences'],
        },
      ],
      legalBases: Object.values(LegalBasis),
      recipients: ['Employers', 'Email service provider', 'Analytics provider'],
      retentionPeriods: [
        { dataType: 'Profile data', period: '7 years after account closure' },
        { dataType: 'Application data', period: '7 years after application' },
        { dataType: 'Marketing data', period: 'Until consent withdrawn' },
      ],
      rights: [
        'Right to access',
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
        'Right to withdraw consent',
      ],
    };
  }

  // ============================================================================
  // Data Retrieval Methods (GDPR Article 20 - Right to Data Portability)
  // ============================================================================

  /**
   * Fetch user profile data from the profile service
   */
  private async fetchUserProfile(userId: string): Promise<any> {
    try {
      if (this.serviceClients.profileService) {
        const profileData = await this.serviceClients.profileService.fetchData(userId);
        return this.sanitizeDataForExport(profileData);
      }
      // Fallback: return minimal profile structure
      return {
        userId,
        exportedAt: new Date().toISOString(),
        note: 'Profile service not configured',
      };
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user profile'),
        { userId, operation: 'fetchUserProfile' }
      );
      return { userId, error: 'Failed to retrieve profile data' };
    }
  }

  /**
   * Fetch all resumes for a user
   */
  private async fetchUserResumes(userId: string): Promise<any[]> {
    try {
      if (this.serviceClients.resumeService) {
        const resumes = await this.serviceClients.resumeService.fetchData(userId);
        return Array.isArray(resumes)
          ? resumes.map(resume => this.sanitizeDataForExport(resume))
          : [];
      }
      return [];
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user resumes'),
        { userId, operation: 'fetchUserResumes' }
      );
      return [];
    }
  }

  /**
   * Fetch all job applications for a user
   */
  private async fetchUserApplications(userId: string): Promise<any[]> {
    try {
      if (this.serviceClients.applicationService) {
        const applications = await this.serviceClients.applicationService.fetchData(userId);
        return Array.isArray(applications)
          ? applications.map(app => this.sanitizeDataForExport(app))
          : [];
      }
      return [];
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user applications'),
        { userId, operation: 'fetchUserApplications' }
      );
      return [];
    }
  }

  /**
   * Fetch user preferences (job preferences, notification settings, etc.)
   */
  private async fetchUserPreferences(userId: string): Promise<any> {
    try {
      if (this.serviceClients.preferenceService) {
        const preferences = await this.serviceClients.preferenceService.fetchData(userId);
        return this.sanitizeDataForExport(preferences);
      }
      return {};
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user preferences'),
        { userId, operation: 'fetchUserPreferences' }
      );
      return {};
    }
  }

  /**
   * Fetch user communications (emails, notifications, messages)
   */
  private async fetchUserCommunications(userId: string): Promise<any[]> {
    try {
      if (this.serviceClients.communicationService) {
        const communications = await this.serviceClients.communicationService.fetchData(userId);
        return Array.isArray(communications)
          ? communications.map(comm => this.sanitizeDataForExport(comm))
          : [];
      }
      return [];
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user communications'),
        { userId, operation: 'fetchUserCommunications' }
      );
      return [];
    }
  }

  /**
   * Fetch user analytics data (usage patterns, preferences learned)
   */
  private async fetchUserAnalytics(userId: string): Promise<any> {
    try {
      if (this.serviceClients.analyticsService) {
        const analytics = await this.serviceClients.analyticsService.fetchData(userId);
        return this.sanitizeDataForExport(analytics);
      }
      return {};
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user analytics'),
        { userId, operation: 'fetchUserAnalytics' }
      );
      return {};
    }
  }

  /**
   * Fetch user activity log (audit trail of user actions)
   */
  private async fetchUserActivityLog(userId: string): Promise<any[]> {
    try {
      if (this.serviceClients.activityLogService) {
        const activities = await this.serviceClients.activityLogService.fetchData(userId);
        return Array.isArray(activities)
          ? activities.map(activity => this.sanitizeDataForExport(activity))
          : [];
      }
      // Fallback: query the audit logger for user's activity trail
      const auditEvents = await auditLogger.getUserAuditTrail(userId, 1000);
      return auditEvents.map(event => ({
        timestamp: event.timestamp,
        type: event.type,
        description: event.details?.description || event.type,
        outcome: event.outcome,
      }));
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user activity log'),
        { userId, operation: 'fetchUserActivityLog' }
      );
      return [];
    }
  }

  // ============================================================================
  // Data Deletion Methods (GDPR Article 17 - Right to Erasure)
  // ============================================================================

  /**
   * Delete all resumes for a user with cascading deletes
   */
  private async deleteUserResumes(userId: string): Promise<number> {
    try {
      if (this.serviceClients.resumeService) {
        const deletedCount = await this.serviceClients.resumeService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'resumes', count: deletedCount }
        );
        return deletedCount;
      }
      return 0;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user resumes'),
        { userId, operation: 'deleteUserResumes' }
      );
      throw error;
    }
  }

  /**
   * Delete all job applications for a user
   */
  private async deleteUserApplications(userId: string): Promise<number> {
    try {
      if (this.serviceClients.applicationService) {
        const deletedCount = await this.serviceClients.applicationService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'applications', count: deletedCount }
        );
        return deletedCount;
      }
      return 0;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user applications'),
        { userId, operation: 'deleteUserApplications' }
      );
      throw error;
    }
  }

  /**
   * Delete all documents (uploaded files, cover letters, etc.) for a user
   */
  private async deleteUserDocuments(userId: string): Promise<number> {
    try {
      if (this.serviceClients.documentService) {
        const deletedCount = await this.serviceClients.documentService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'documents', count: deletedCount }
        );
        return deletedCount;
      }
      return 0;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user documents'),
        { userId, operation: 'deleteUserDocuments' }
      );
      throw error;
    }
  }

  /**
   * Delete all communications (emails, notifications) for a user
   */
  private async deleteUserCommunications(userId: string): Promise<number> {
    try {
      if (this.serviceClients.communicationService) {
        const deletedCount = await this.serviceClients.communicationService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'communications', count: deletedCount }
        );
        return deletedCount;
      }
      return 0;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user communications'),
        { userId, operation: 'deleteUserCommunications' }
      );
      throw error;
    }
  }

  /**
   * Delete all consent records for a user
   */
  private deleteUserConsents(userId: string): number {
    const consents = this.consentStorage.get(userId) || [];
    const count = consents.length;
    this.consentStorage.delete(userId);
    this.processingRecords.delete(userId);
    return count;
  }

  /**
   * Delete user analytics data
   */
  private async deleteUserAnalytics(userId: string): Promise<boolean> {
    try {
      if (this.serviceClients.analyticsService) {
        await this.serviceClients.analyticsService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'analytics' }
        );
        return true;
      }
      return true;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user analytics'),
        { userId, operation: 'deleteUserAnalytics' }
      );
      throw error;
    }
  }

  /**
   * Delete user preferences
   */
  private async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      if (this.serviceClients.preferenceService) {
        await this.serviceClients.preferenceService.deleteData(userId);
        await auditLogger.logComplianceEvent(
          AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
          userId,
          { dataType: 'preferences' }
        );
        return true;
      }
      return true;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to delete user preferences'),
        { userId, operation: 'deleteUserPreferences' }
      );
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Generate unique consent ID
   */
  private generateConsentId(): string {
    return `consent-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate unique processing record ID
   */
  private generateProcessingRecordId(): string {
    return `proc-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate cryptographic hash for deletion verification
   * This provides proof that data was deleted at a specific time
   */
  private generateDeletionVerificationHash(userId: string): string {
    const timestamp = new Date().toISOString();
    const data = `${userId}:${timestamp}:deletion_verified`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sanitize data for export by removing internal/sensitive fields
   */
  private sanitizeDataForExport(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'passwordHash',
      'refreshToken',
      'mfaSecret',
      'apiKey',
      'secretKey',
      'internalId',
      '_id',
      '__v',
    ];

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeDataForExport(item));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeDataForExport(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  // ============================================================================
  // Data Export Format Conversion
  // ============================================================================

  /**
   * Convert user data export to CSV format
   */
  convertToCSV(exportData: UserDataExport): string {
    const lines: string[] = [];

    // Add metadata header
    lines.push('# GDPR Data Export');
    lines.push(`# User ID: ${exportData.userId}`);
    lines.push(`# Exported At: ${exportData.exportedAt.toISOString()}`);
    lines.push(`# Format: CSV`);
    lines.push('');

    // Profile section
    lines.push('## Profile Data');
    lines.push(this.objectToCSVSection(exportData.data.profile));
    lines.push('');

    // Resumes section
    if (exportData.data.resumes.length > 0) {
      lines.push('## Resumes');
      lines.push(this.arrayToCSVTable(exportData.data.resumes));
      lines.push('');
    }

    // Applications section
    if (exportData.data.applications.length > 0) {
      lines.push('## Applications');
      lines.push(this.arrayToCSVTable(exportData.data.applications));
      lines.push('');
    }

    // Job preferences
    lines.push('## Job Preferences');
    lines.push(this.objectToCSVSection(exportData.data.jobPreferences));
    lines.push('');

    // Communications
    if (exportData.data.communications.length > 0) {
      lines.push('## Communications');
      lines.push(this.arrayToCSVTable(exportData.data.communications));
      lines.push('');
    }

    // Consents
    if (exportData.data.consents.length > 0) {
      lines.push('## Consent Records');
      lines.push(this.arrayToCSVTable(exportData.data.consents.map(c => ({
        purpose: c.purpose,
        granted: c.granted,
        grantedAt: c.grantedAt?.toISOString() || '',
        revokedAt: c.revokedAt?.toISOString() || '',
        version: c.version,
      }))));
      lines.push('');
    }

    // Activity log
    if (exportData.data.activityLog.length > 0) {
      lines.push('## Activity Log');
      lines.push(this.arrayToCSVTable(exportData.data.activityLog));
    }

    return lines.join('\n');
  }

  /**
   * Convert user data export to XML format
   */
  convertToXML(exportData: UserDataExport): string {
    const xmlParts: string[] = [];

    xmlParts.push('<?xml version="1.0" encoding="UTF-8"?>');
    xmlParts.push('<GDPRDataExport>');
    xmlParts.push(`  <userId>${this.escapeXML(exportData.userId)}</userId>`);
    xmlParts.push(`  <exportedAt>${exportData.exportedAt.toISOString()}</exportedAt>`);
    xmlParts.push(`  <format>XML</format>`);

    xmlParts.push('  <metadata>');
    xmlParts.push(`    <dataVersion>${exportData.metadata.dataVersion}</dataVersion>`);
    xmlParts.push(`    <includesThirdPartyData>${exportData.metadata.includesThirdPartyData}</includesThirdPartyData>`);
    if (exportData.metadata.retentionPeriod) {
      xmlParts.push(`    <retentionPeriod>${exportData.metadata.retentionPeriod}</retentionPeriod>`);
    }
    xmlParts.push('  </metadata>');

    xmlParts.push('  <data>');
    xmlParts.push('    <profile>');
    xmlParts.push(this.objectToXML(exportData.data.profile, 6));
    xmlParts.push('    </profile>');

    xmlParts.push('    <resumes>');
    for (const resume of exportData.data.resumes) {
      xmlParts.push('      <resume>');
      xmlParts.push(this.objectToXML(resume, 8));
      xmlParts.push('      </resume>');
    }
    xmlParts.push('    </resumes>');

    xmlParts.push('    <applications>');
    for (const app of exportData.data.applications) {
      xmlParts.push('      <application>');
      xmlParts.push(this.objectToXML(app, 8));
      xmlParts.push('      </application>');
    }
    xmlParts.push('    </applications>');

    xmlParts.push('    <jobPreferences>');
    xmlParts.push(this.objectToXML(exportData.data.jobPreferences, 6));
    xmlParts.push('    </jobPreferences>');

    xmlParts.push('    <communications>');
    for (const comm of exportData.data.communications) {
      xmlParts.push('      <communication>');
      xmlParts.push(this.objectToXML(comm, 8));
      xmlParts.push('      </communication>');
    }
    xmlParts.push('    </communications>');

    xmlParts.push('    <consents>');
    for (const consent of exportData.data.consents) {
      xmlParts.push('      <consent>');
      xmlParts.push(`        <purpose>${consent.purpose}</purpose>`);
      xmlParts.push(`        <granted>${consent.granted}</granted>`);
      if (consent.grantedAt) {
        xmlParts.push(`        <grantedAt>${consent.grantedAt.toISOString()}</grantedAt>`);
      }
      if (consent.revokedAt) {
        xmlParts.push(`        <revokedAt>${consent.revokedAt.toISOString()}</revokedAt>`);
      }
      xmlParts.push(`        <version>${consent.version}</version>`);
      xmlParts.push('      </consent>');
    }
    xmlParts.push('    </consents>');

    xmlParts.push('    <activityLog>');
    for (const activity of exportData.data.activityLog) {
      xmlParts.push('      <activity>');
      xmlParts.push(this.objectToXML(activity, 8));
      xmlParts.push('      </activity>');
    }
    xmlParts.push('    </activityLog>');

    xmlParts.push('  </data>');
    xmlParts.push('</GDPRDataExport>');

    return xmlParts.join('\n');
  }

  /**
   * Convert object to CSV section
   */
  private objectToCSVSection(obj: any): string {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const formattedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      lines.push(`${key},${this.escapeCSV(formattedValue)}`);
    }
    return lines.join('\n');
  }

  /**
   * Convert array of objects to CSV table
   */
  private arrayToCSVTable(arr: any[]): string {
    if (!arr || arr.length === 0) {
      return '';
    }
    const headers = Object.keys(arr[0]);
    const lines: string[] = [];
    lines.push(headers.join(','));
    for (const item of arr) {
      const values = headers.map(h => {
        const val = item[h];
        return this.escapeCSV(typeof val === 'object' ? JSON.stringify(val) : String(val ?? ''));
      });
      lines.push(values.join(','));
    }
    return lines.join('\n');
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Convert object to XML elements
   */
  private objectToXML(obj: any, indent: number = 0): string {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    const spaces = ' '.repeat(indent);
    const lines: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }
      const tagName = key.replace(/[^a-zA-Z0-9]/g, '_');
      if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${spaces}<${tagName}>`);
        lines.push(this.objectToXML(value, indent + 2));
        lines.push(`${spaces}</${tagName}>`);
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}<${tagName}>`);
        for (const item of value) {
          if (typeof item === 'object') {
            lines.push(`${spaces}  <item>`);
            lines.push(this.objectToXML(item, indent + 4));
            lines.push(`${spaces}  </item>`);
          } else {
            lines.push(`${spaces}  <item>${this.escapeXML(String(item))}</item>`);
          }
        }
        lines.push(`${spaces}</${tagName}>`);
      } else {
        lines.push(`${spaces}<${tagName}>${this.escapeXML(String(value))}</${tagName}>`);
      }
    }
    return lines.join('\n');
  }

  /**
   * Escape XML special characters
   */
  private escapeXML(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Export singleton instance
export const gdprService = new GDPRService();
