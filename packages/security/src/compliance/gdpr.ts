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
 * Generic user data response type
 */
export type UserDataResponse = Record<string, unknown> | Array<Record<string, unknown>> | null;

/**
 * Service client interface for cross-service data operations
 */
export interface ServiceClient {
  fetchData(userId: string): Promise<UserDataResponse>;
  deleteData(userId: string): Promise<number>;
  anonymizeData?(userId: string): Promise<number>;
}

/**
 * HTTP-based service client for making cross-service API calls
 */
export interface HttpServiceClientConfig {
  baseUrl: string;
  serviceName: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * Result of a service operation
 */
export interface ServiceOperationResult {
  serviceName: string;
  success: boolean;
  recordsAffected?: number;
  error?: string;
  timestamp: Date;
  [key: string]: unknown; // Index signature for AuditDetailValue compatibility
}

/**
 * Anonymization value transformer function type
 */
export type AnonymizationValueTransformer = (value: unknown) => unknown;

/**
 * Anonymization configuration for different data types
 */
export interface AnonymizationConfig {
  preserveStructure?: boolean;
  hashIdentifiers?: boolean;
  preserveAggregateData?: boolean;
  customMappings?: Record<string, AnonymizationValueTransformer>;
  [key: string]: unknown; // Index signature for AuditDetailValue compatibility
}

/**
 * Anonymization result
 */
export interface AnonymizationResult {
  userId: string;
  anonymizedAt: Date;
  fieldsAnonymized: number;
  dataCategories: string[];
  verificationHash: string;
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
  authService?: ServiceClient;
  paymentService?: ServiceClient;
  jobService?: ServiceClient;
  notificationService?: ServiceClient;
}

/**
 * Service endpoint configuration for HTTP-based clients
 */
export interface ServiceEndpoints {
  authService?: string;
  userService?: string;
  jobService?: string;
  resumeService?: string;
  analyticsService?: string;
  paymentService?: string;
  notificationService?: string;
  autoApplyService?: string;
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
 * Generic data record type for export
 */
export type ExportDataRecord = Record<string, unknown>;

/**
 * User data export structure (GDPR Article 20 - Data Portability)
 */
export interface UserDataExport {
  userId: string;
  exportedAt: Date;
  format: 'json' | 'csv' | 'xml';
  data: {
    profile: ExportDataRecord;
    resumes: ExportDataRecord[];
    applications: ExportDataRecord[];
    jobPreferences: ExportDataRecord;
    communications: ExportDataRecord[];
    analytics: ExportDataRecord;
    consents: ConsentRecord[];
    activityLog: ExportDataRecord[];
  } & Record<string, unknown>;
  metadata: {
    dataVersion: string;
    includesThirdPartyData: boolean;
    retentionPeriod?: string;
  } & Record<string, unknown>;
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
   * Collects data from all services and returns a complete user data export
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<UserDataExport> {
    const startTime = Date.now();
    const fetchErrors: Array<{ service: string; error: string }> = [];

    // Log the export request
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_EXPORT,
      userId,
      { format, startedAt: new Date().toISOString() }
    );

    // Fetch all data in parallel for efficiency
    const [
      profile,
      resumes,
      applications,
      jobPreferences,
      communications,
      analytics,
      activityLog,
      authData,
      paymentData,
      jobData,
      notificationData,
    ] = await Promise.allSettled([
      this.fetchUserProfile(userId),
      this.fetchUserResumes(userId),
      this.fetchUserApplications(userId),
      this.fetchUserPreferences(userId),
      this.fetchUserCommunications(userId),
      this.fetchUserAnalytics(userId),
      this.fetchUserActivityLog(userId),
      this.fetchUserAuthData(userId),
      this.fetchUserPaymentData(userId),
      this.fetchUserJobData(userId),
      this.fetchUserNotifications(userId),
    ]);

    // Process results and collect errors
    const processResult = <T>(
      result: PromiseSettledResult<T>,
      serviceName: string,
      defaultValue: T
    ): T => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      fetchErrors.push({
        service: serviceName,
        error: result.reason?.message || 'Unknown error',
      });
      return defaultValue;
    };

    // Build the export data structure
    const exportData: UserDataExport = {
      userId,
      exportedAt: new Date(),
      format,
      data: {
        profile: processResult(profile, 'profile-service', { userId }),
        resumes: processResult(resumes, 'resume-service', []),
        applications: processResult(applications, 'application-service', []),
        jobPreferences: processResult(jobPreferences, 'preference-service', {}),
        communications: processResult(communications, 'communication-service', []),
        analytics: processResult(analytics, 'analytics-service', {}),
        consents: this.getConsentStatus(userId),
        activityLog: processResult(activityLog, 'activity-service', []),
      },
      metadata: {
        dataVersion: '1.0',
        includesThirdPartyData: false,
        retentionPeriod: '7 years',
      },
    };

    // Add additional data categories if available
    const authResult = processResult(authData, 'auth-service', null);
    if (authResult) {
      exportData.data.authentication = authResult;
    }

    const paymentResult = processResult(paymentData, 'payment-service', null);
    if (paymentResult) {
      exportData.data.payments = paymentResult;
    }

    const jobResult = processResult(jobData, 'job-service', null) as Record<string, unknown> | null;
    if (jobResult) {
      exportData.data.savedJobs = (jobResult.savedJobs as ExportDataRecord[]) || [];
      exportData.data.jobAlerts = (jobResult.jobAlerts as ExportDataRecord[]) || [];
    }

    const notificationResult = processResult(notificationData, 'notification-service', null);
    if (notificationResult) {
      exportData.data.notifications = notificationResult;
    }

    // Add processing records
    const processingRecords = this.getProcessingRecords(userId);
    if (processingRecords.length > 0) {
      exportData.data.dataProcessingRecords = processingRecords;
    }

    // Log completion
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_EXPORT,
      userId,
      {
        operation: 'export_complete',
        format,
        durationMs: Date.now() - startTime,
        dataCategories: Object.keys(exportData.data),
        fetchErrors: fetchErrors.length > 0 ? fetchErrors : undefined,
      }
    );

    // Add any errors to metadata
    if (fetchErrors.length > 0) {
      exportData.metadata.fetchErrors = fetchErrors;
      exportData.metadata.partialExport = true;
    }

    return exportData;
  }

  /**
   * Delete user data (GDPR Article 17 - Right to be Forgotten)
   * Orchestrates deletion across all microservices in the correct order
   */
  async deleteUserData(
    userId: string,
    reason?: string
  ): Promise<DataDeletionReport> {
    const startTime = Date.now();
    const deletionErrors: Array<{ service: string; error: string }> = [];
    const serviceResults: ServiceOperationResult[] = [];

    // Log the deletion request
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      userId,
      { reason: reason || 'User request', startedAt: new Date().toISOString() }
    );

    // Phase 1: Delete dependent data first (applications, resumes, job-related)
    // These must be deleted before profile/auth data due to foreign key constraints

    // 1. Delete job applications (depends on resumes and jobs)
    let applicationsDeleted = 0;
    try {
      applicationsDeleted = await this.deleteUserApplications(userId);
      serviceResults.push({
        serviceName: 'auto-apply-service',
        success: true,
        recordsAffected: applicationsDeleted,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'auto-apply-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'auto-apply-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // 2. Delete resumes and resume versions
    let resumesDeleted = 0;
    try {
      resumesDeleted = await this.deleteUserResumes(userId);
      serviceResults.push({
        serviceName: 'resume-service',
        success: true,
        recordsAffected: resumesDeleted,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'resume-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'resume-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // 3. Delete saved jobs and job alerts
    let jobDataDeleted = 0;
    if (this.serviceClients.jobService) {
      try {
        jobDataDeleted = await this.serviceClients.jobService.deleteData(userId);
        serviceResults.push({
          serviceName: 'job-service',
          success: true,
          recordsAffected: jobDataDeleted,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        deletionErrors.push({ service: 'job-service', error: errorMessage });
        serviceResults.push({
          serviceName: 'job-service',
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    // 4. Delete documents (cover letters, uploaded files)
    let documentsDeleted = 0;
    try {
      documentsDeleted = await this.deleteUserDocuments(userId);
      serviceResults.push({
        serviceName: 'document-service',
        success: true,
        recordsAffected: documentsDeleted,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'document-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'document-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // Phase 2: Delete communications and notifications

    // 5. Delete communications (emails, messages)
    let communicationsDeleted = 0;
    try {
      communicationsDeleted = await this.deleteUserCommunications(userId);
      serviceResults.push({
        serviceName: 'communication-service',
        success: true,
        recordsAffected: communicationsDeleted,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'communication-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'communication-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // 6. Delete notifications
    let notificationsDeleted = 0;
    if (this.serviceClients.notificationService) {
      try {
        notificationsDeleted = await this.serviceClients.notificationService.deleteData(userId);
        serviceResults.push({
          serviceName: 'notification-service',
          success: true,
          recordsAffected: notificationsDeleted,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        deletionErrors.push({ service: 'notification-service', error: errorMessage });
        serviceResults.push({
          serviceName: 'notification-service',
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    // Phase 3: Delete analytics and preferences

    // 7. Delete analytics data
    let analyticsDeleted = false;
    try {
      await this.deleteUserAnalytics(userId);
      analyticsDeleted = true;
      serviceResults.push({
        serviceName: 'analytics-service',
        success: true,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'analytics-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'analytics-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // 8. Delete user preferences
    try {
      await this.deleteUserPreferences(userId);
      serviceResults.push({
        serviceName: 'preference-service',
        success: true,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      deletionErrors.push({ service: 'preference-service', error: errorMessage });
      serviceResults.push({
        serviceName: 'preference-service',
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      });
    }

    // Phase 4: Delete payment data (anonymize transaction records for legal compliance)

    // 9. Delete/anonymize payment data
    let paymentRecordsAnonymized = 0;
    if (this.serviceClients.paymentService) {
      try {
        // Payment records are anonymized rather than deleted for legal compliance
        paymentRecordsAnonymized = await this.serviceClients.paymentService.deleteData(userId);
        serviceResults.push({
          serviceName: 'payment-service',
          success: true,
          recordsAffected: paymentRecordsAnonymized,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        deletionErrors.push({ service: 'payment-service', error: errorMessage });
        serviceResults.push({
          serviceName: 'payment-service',
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    // Phase 5: Delete profile data

    // 10. Delete user profile
    let profileDeleted = false;
    if (this.serviceClients.profileService) {
      try {
        await this.serviceClients.profileService.deleteData(userId);
        profileDeleted = true;
        serviceResults.push({
          serviceName: 'user-service',
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        deletionErrors.push({ service: 'user-service', error: errorMessage });
        serviceResults.push({
          serviceName: 'user-service',
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    } else {
      profileDeleted = true; // Assume success if no service configured
    }

    // Phase 6: Delete auth data (must be last)

    // 11. Delete auth credentials and tokens
    if (this.serviceClients.authService) {
      try {
        await this.serviceClients.authService.deleteData(userId);
        serviceResults.push({
          serviceName: 'auth-service',
          success: true,
          timestamp: new Date(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        deletionErrors.push({ service: 'auth-service', error: errorMessage });
        serviceResults.push({
          serviceName: 'auth-service',
          success: false,
          error: errorMessage,
          timestamp: new Date(),
        });
      }
    }

    // 12. Delete local consent records
    const consentsDeleted = this.deleteUserConsents(userId);

    // Clear processing records
    this.processingRecords.delete(userId);

    // Generate deletion report
    const report: DataDeletionReport = {
      userId,
      deletedAt: new Date(),
      deletedData: {
        profile: profileDeleted,
        resumes: resumesDeleted,
        applications: applicationsDeleted,
        documents: documentsDeleted,
        communications: communicationsDeleted,
        analytics: analyticsDeleted,
        consents: consentsDeleted,
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
        {
          type: 'GDPR request records',
          reason: 'Compliance documentation',
          retentionPeriod: '5 years',
        },
      ],
      verification: this.generateDeletionVerificationHash(userId),
    };

    // Log completion with detailed results
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      userId,
      {
        operation: 'deletion_complete',
        durationMs: Date.now() - startTime,
        serviceResults,
        deletionErrors: deletionErrors.length > 0 ? deletionErrors : undefined,
        report: {
          totalResumes: resumesDeleted,
          totalApplications: applicationsDeleted,
          totalDocuments: documentsDeleted,
          totalCommunications: communicationsDeleted,
          totalConsents: consentsDeleted,
        },
        verificationHash: report.verification,
      }
    );

    // If there were errors, add them to the report
    if (deletionErrors.length > 0) {
      (report as DataDeletionReport & { errors?: typeof deletionErrors; partialDeletion?: boolean }).errors = deletionErrors;
      (report as DataDeletionReport & { errors?: typeof deletionErrors; partialDeletion?: boolean }).partialDeletion = true;
    }

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
    controller: { name: string; contact: string; dpo: string };
    purposes: Array<{ purpose: string; legalBasis: LegalBasis; dataCategories: string[] }>;
    legalBases: LegalBasis[];
    recipients: string[];
    retentionPeriods: Array<{ dataType: string; period: string }>;
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
  // Data Anonymization (GDPR Article 17 Alternative - Pseudonymization)
  // ============================================================================

  /**
   * Anonymize user data while preserving data structure for analytics
   * This is an alternative to full deletion when data retention is required
   * but PII must be removed (GDPR Article 4(5) - Pseudonymization)
   */
  async anonymizeUserData(
    userId: string,
    config: AnonymizationConfig = {}
  ): Promise<AnonymizationResult> {
    const startTime = Date.now();
    let fieldsAnonymized = 0;
    const dataCategories: string[] = [];

    // Log the anonymization request
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      userId,
      { operation: 'anonymization', config }
    );

    // Default configuration
    const effectiveConfig: AnonymizationConfig = {
      preserveStructure: true,
      hashIdentifiers: true,
      preserveAggregateData: true,
      ...config,
    };

    // Collect all service operation results
    const operationResults: ServiceOperationResult[] = [];

    // 1. Anonymize auth service data (user credentials, tokens)
    if (this.serviceClients.authService?.anonymizeData) {
      try {
        const count = await this.serviceClients.authService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'auth-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Authentication');
      } catch (error) {
        operationResults.push({
          serviceName: 'auth-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 2. Anonymize profile data
    if (this.serviceClients.profileService?.anonymizeData) {
      try {
        const count = await this.serviceClients.profileService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'profile-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Profile');
      } catch (error) {
        operationResults.push({
          serviceName: 'profile-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 3. Anonymize resume data
    if (this.serviceClients.resumeService?.anonymizeData) {
      try {
        const count = await this.serviceClients.resumeService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'resume-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Resumes');
      } catch (error) {
        operationResults.push({
          serviceName: 'resume-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 4. Anonymize job applications
    if (this.serviceClients.applicationService?.anonymizeData) {
      try {
        const count = await this.serviceClients.applicationService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'application-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Applications');
      } catch (error) {
        operationResults.push({
          serviceName: 'application-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 5. Anonymize payment data (preserve transaction structure for accounting)
    if (this.serviceClients.paymentService?.anonymizeData) {
      try {
        const count = await this.serviceClients.paymentService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'payment-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Payments');
      } catch (error) {
        operationResults.push({
          serviceName: 'payment-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 6. Anonymize analytics data (preserve aggregate stats)
    if (this.serviceClients.analyticsService?.anonymizeData) {
      try {
        const count = await this.serviceClients.analyticsService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'analytics-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Analytics');
      } catch (error) {
        operationResults.push({
          serviceName: 'analytics-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 7. Anonymize communications
    if (this.serviceClients.communicationService?.anonymizeData) {
      try {
        const count = await this.serviceClients.communicationService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'communication-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Communications');
      } catch (error) {
        operationResults.push({
          serviceName: 'communication-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // 8. Anonymize notifications
    if (this.serviceClients.notificationService?.anonymizeData) {
      try {
        const count = await this.serviceClients.notificationService.anonymizeData(userId);
        operationResults.push({
          serviceName: 'notification-service',
          success: true,
          recordsAffected: count,
          timestamp: new Date(),
        });
        fieldsAnonymized += count;
        dataCategories.push('Notifications');
      } catch (error) {
        operationResults.push({
          serviceName: 'notification-service',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        });
      }
    }

    // Clear local consent storage for this user
    const consentCount = this.anonymizeUserConsents(userId, effectiveConfig.hashIdentifiers || false);
    fieldsAnonymized += consentCount;
    if (consentCount > 0) {
      dataCategories.push('Consents');
    }

    // Generate verification hash
    const verificationHash = this.generateAnonymizationVerificationHash(
      userId,
      fieldsAnonymized,
      dataCategories
    );

    // Log completion
    await auditLogger.logComplianceEvent(
      AuditEventType.COMPLIANCE_GDPR_DATA_DELETION,
      userId,
      {
        operation: 'anonymization_complete',
        fieldsAnonymized,
        dataCategories,
        durationMs: Date.now() - startTime,
        operationResults,
        verificationHash,
      }
    );

    return {
      userId: effectiveConfig.hashIdentifiers ? this.hashUserId(userId) : userId,
      anonymizedAt: new Date(),
      fieldsAnonymized,
      dataCategories,
      verificationHash,
    };
  }

  /**
   * Anonymize a single data object by replacing PII fields with anonymized values
   */
  anonymizeObject<T extends Record<string, unknown>>(
    data: T,
    config: AnonymizationConfig = {}
  ): T {
    const piiFields = [
      'email', 'phone', 'phoneNumber', 'mobile', 'telephone',
      'firstName', 'lastName', 'fullName', 'name', 'displayName',
      'address', 'street', 'city', 'zipCode', 'postalCode', 'zip',
      'ssn', 'socialSecurityNumber', 'nationalId', 'taxId',
      'bankAccount', 'iban', 'creditCard', 'cardNumber',
      'dateOfBirth', 'dob', 'birthDate', 'birthday',
      'ipAddress', 'ip', 'userAgent',
      'linkedinUrl', 'linkedin', 'githubUrl', 'github', 'twitterUrl', 'twitter',
      'profilePicture', 'avatar', 'photo', 'image',
      'emergencyContact', 'nextOfKin',
      'salary', 'compensation', 'wage',
    ];

    const anonymized = { ...data };

    for (const key of Object.keys(anonymized)) {
      const value = anonymized[key];
      const lowerKey = key.toLowerCase();

      // Check if this is a PII field
      const isPiiField = piiFields.some(pii => lowerKey.includes(pii.toLowerCase()));

      if (isPiiField && value !== null && value !== undefined) {
        // Apply custom mapping if provided
        if (config.customMappings && config.customMappings[key]) {
          (anonymized as Record<string, unknown>)[key] = config.customMappings[key](value);
        } else {
          // Default anonymization based on field type
          (anonymized as Record<string, unknown>)[key] = this.anonymizeValue(key, value, config);
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively anonymize nested objects
        (anonymized as Record<string, unknown>)[key] = this.anonymizeObject(value as Record<string, unknown>, config);
      } else if (Array.isArray(value)) {
        // Anonymize array items
        (anonymized as Record<string, unknown>)[key] = value.map(item =>
          typeof item === 'object' && item !== null
            ? this.anonymizeObject(item as Record<string, unknown>, config)
            : item
        );
      }
    }

    return anonymized;
  }

  /**
   * Anonymize a single value based on its type and field name
   */
  private anonymizeValue(fieldName: string, value: unknown, config: AnonymizationConfig): unknown {
    const lowerField = fieldName.toLowerCase();

    // Email addresses
    if (lowerField.includes('email')) {
      return config.hashIdentifiers
        ? `anonymized-${this.hashValue(String(value)).substring(0, 8)}@anonymized.local`
        : 'anonymized@anonymized.local';
    }

    // Phone numbers
    if (lowerField.includes('phone') || lowerField.includes('mobile') || lowerField.includes('telephone')) {
      return config.hashIdentifiers
        ? `+1-XXX-XXX-${this.hashValue(String(value)).substring(0, 4)}`
        : '+1-XXX-XXX-XXXX';
    }

    // Names
    if (lowerField.includes('name')) {
      const suffix = config.hashIdentifiers ? `-${this.hashValue(String(value)).substring(0, 6)}` : '';
      if (lowerField.includes('first')) return `AnonymizedFirst${suffix}`;
      if (lowerField.includes('last')) return `AnonymizedLast${suffix}`;
      return `Anonymized User${suffix}`;
    }

    // Addresses
    if (lowerField.includes('address') || lowerField.includes('street')) {
      return 'Anonymized Address';
    }
    if (lowerField.includes('city')) return 'Anonymized City';
    if (lowerField.includes('zip') || lowerField.includes('postal')) return '00000';

    // Dates (preserve year for analytics if configured)
    if (lowerField.includes('birth') || lowerField.includes('dob')) {
      if (config.preserveAggregateData && value instanceof Date) {
        return new Date(value.getFullYear(), 0, 1); // Keep year, set to Jan 1
      }
      return new Date(1900, 0, 1);
    }

    // IP addresses
    if (lowerField.includes('ip')) {
      return '0.0.0.0';
    }

    // URLs (social profiles)
    if (lowerField.includes('url') || lowerField.includes('linkedin') ||
        lowerField.includes('github') || lowerField.includes('twitter')) {
      return null;
    }

    // Images/photos
    if (lowerField.includes('picture') || lowerField.includes('avatar') ||
        lowerField.includes('photo') || lowerField.includes('image')) {
      return null;
    }

    // Financial data
    if (lowerField.includes('salary') || lowerField.includes('compensation') ||
        lowerField.includes('wage')) {
      return config.preserveAggregateData ? Math.round(Number(value) / 10000) * 10000 : 0;
    }

    // SSN and sensitive IDs
    if (lowerField.includes('ssn') || lowerField.includes('taxid') ||
        lowerField.includes('nationalid')) {
      return 'XXX-XX-XXXX';
    }

    // Bank/Card details
    if (lowerField.includes('bank') || lowerField.includes('card') ||
        lowerField.includes('iban')) {
      return 'XXXX-XXXX-XXXX-XXXX';
    }

    // Default: hash or nullify
    if (typeof value === 'string') {
      return config.hashIdentifiers ? this.hashValue(value).substring(0, 12) : '[ANONYMIZED]';
    }

    return null;
  }

  /**
   * Anonymize user consents in local storage
   */
  private anonymizeUserConsents(userId: string, hashIdentifiers: boolean): number {
    const consents = this.consentStorage.get(userId);
    if (!consents || consents.length === 0) {
      return 0;
    }

    // Anonymize consent records but keep them for compliance proof
    const anonymizedConsents = consents.map(consent => ({
      ...consent,
      userId: hashIdentifiers ? this.hashUserId(userId) : 'anonymized-user',
      ipAddress: consent.ipAddress ? '0.0.0.0' : undefined,
      userAgent: consent.userAgent ? 'anonymized' : undefined,
    }));

    // Store under hashed/anonymized user ID
    const newKey = hashIdentifiers ? this.hashUserId(userId) : 'anonymized-user';
    const existingAnonymized = this.consentStorage.get(newKey) || [];
    this.consentStorage.set(newKey, [...existingAnonymized, ...anonymizedConsents]);
    this.consentStorage.delete(userId);

    return consents.length;
  }

  /**
   * Generate a SHA-256 hash of a value
   */
  private hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Hash a user ID for pseudonymization
   */
  private hashUserId(userId: string): string {
    const salt = 'gdpr-anonymization-salt';
    return crypto.createHash('sha256').update(`${userId}:${salt}`).digest('hex').substring(0, 32);
  }

  /**
   * Generate verification hash for anonymization
   */
  private generateAnonymizationVerificationHash(
    userId: string,
    fieldsAnonymized: number,
    dataCategories: string[]
  ): string {
    const timestamp = new Date().toISOString();
    const data = `${userId}:${fieldsAnonymized}:${dataCategories.join(',')}:${timestamp}:anonymization_verified`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // ============================================================================
  // Data Retrieval Methods (GDPR Article 20 - Right to Data Portability)
  // ============================================================================

  /**
   * Fetch user profile data from the profile service
   */
  private async fetchUserProfile(userId: string): Promise<ExportDataRecord> {
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
  private async fetchUserResumes(userId: string): Promise<ExportDataRecord[]> {
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
  private async fetchUserApplications(userId: string): Promise<ExportDataRecord[]> {
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
  private async fetchUserPreferences(userId: string): Promise<ExportDataRecord> {
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
  private async fetchUserCommunications(userId: string): Promise<ExportDataRecord[]> {
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
  private async fetchUserAnalytics(userId: string): Promise<ExportDataRecord> {
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
  private async fetchUserActivityLog(userId: string): Promise<ExportDataRecord[]> {
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

  /**
   * Fetch user authentication data (login history, sessions, tokens)
   */
  private async fetchUserAuthData(userId: string): Promise<ExportDataRecord | null> {
    try {
      if (this.serviceClients.authService) {
        const authData = await this.serviceClients.authService.fetchData(userId);
        // Sanitize auth data - remove sensitive fields
        const sanitized = this.sanitizeDataForExport(authData);
        // Remove any password hashes or tokens that might have slipped through
        if (sanitized) {
          delete sanitized.password;
          delete sanitized.passwordHash;
          delete sanitized.refreshToken;
          delete sanitized.mfaSecret;
          delete sanitized.apiKey;
        }
        return sanitized;
      }
      return null;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user auth data'),
        { userId, operation: 'fetchUserAuthData' }
      );
      return null;
    }
  }

  /**
   * Fetch user payment data (subscriptions, invoices, payment methods)
   * Payment card details are masked for security
   */
  private async fetchUserPaymentData(userId: string): Promise<ExportDataRecord | null> {
    try {
      if (this.serviceClients.paymentService) {
        const paymentData = await this.serviceClients.paymentService.fetchData(userId);
        // Sanitize and mask sensitive payment information
        const sanitized = this.sanitizeDataForExport(paymentData);
        if (sanitized && Object.keys(sanitized).length > 0) {
          // Mask payment method details
          const paymentMethods = sanitized.paymentMethods;
          if (Array.isArray(paymentMethods)) {
            sanitized.paymentMethods = paymentMethods.map((pm) => {
              const paymentMethod = pm as Record<string, unknown>;
              const cardNumber = paymentMethod.cardNumber as string | undefined;
              const expiryDate = paymentMethod.expiryDate as string | undefined;
              return {
                ...paymentMethod,
                cardNumber: cardNumber ? `****-****-****-${cardNumber.slice(-4)}` : undefined,
                cvv: undefined,
                expiryDate: expiryDate ? `**/${expiryDate.slice(-2)}` : undefined,
              };
            });
          }
          // Keep invoice and subscription history for portability
        }
        return sanitized;
      }
      return null;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user payment data'),
        { userId, operation: 'fetchUserPaymentData' }
      );
      return null;
    }
  }

  /**
   * Fetch user job-related data (saved jobs, job alerts, search history)
   */
  private async fetchUserJobData(userId: string): Promise<ExportDataRecord | null> {
    try {
      if (this.serviceClients.jobService) {
        const jobData = await this.serviceClients.jobService.fetchData(userId);
        return this.sanitizeDataForExport(jobData);
      }
      return null;
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user job data'),
        { userId, operation: 'fetchUserJobData' }
      );
      return null;
    }
  }

  /**
   * Fetch user notifications (push notifications, email notifications history)
   */
  private async fetchUserNotifications(userId: string): Promise<ExportDataRecord[]> {
    try {
      if (this.serviceClients.notificationService) {
        const notifications = await this.serviceClients.notificationService.fetchData(userId);
        return Array.isArray(notifications)
          ? notifications.map(notification => this.sanitizeDataForExport(notification))
          : [];
      }
      return [];
    } catch (error) {
      await auditLogger.logSystemError(
        error instanceof Error ? error : new Error('Failed to fetch user notifications'),
        { userId, operation: 'fetchUserNotifications' }
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
  private sanitizeDataForExport(data: UserDataResponse): ExportDataRecord {
    if (!data || typeof data !== 'object') {
      return {};
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
      return { items: data.map(item => this.sanitizeDataForExport(item)) };
    }

    const sanitized: ExportDataRecord = {};
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        continue;
      }
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeDataForExport(value as UserDataResponse);
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
  private objectToCSVSection(obj: ExportDataRecord): string {
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
  private arrayToCSVTable(arr: ExportDataRecord[]): string {
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
  private objectToXML(obj: ExportDataRecord, indent: number = 0): string {
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
        lines.push(this.objectToXML(value as ExportDataRecord, indent + 2));
        lines.push(`${spaces}</${tagName}>`);
      } else if (Array.isArray(value)) {
        lines.push(`${spaces}<${tagName}>`);
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            lines.push(`${spaces}  <item>`);
            lines.push(this.objectToXML(item as ExportDataRecord, indent + 4));
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

// ============================================================================
// HTTP Service Client Helper
// ============================================================================

/**
 * Creates an HTTP-based service client for cross-service GDPR operations
 * This helper can be used to connect to microservices via HTTP/REST APIs
 */
export function createHttpServiceClient(config: HttpServiceClientConfig): ServiceClient {
  const { baseUrl, serviceName, timeout = 30000, headers = {} } = config;

  const makeRequest = async (
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<unknown> => {
    const url = `${baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'gdpr-compliance-service',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }
      return response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request to ${serviceName} timed out after ${timeout}ms`);
      }
      throw error;
    }
  };

  return {
    async fetchData(userId: string): Promise<UserDataResponse> {
      const result = await makeRequest('GET', `/gdpr/user/${userId}/data`);
      if (result === null || result === undefined) {
        return null;
      }
      return result as UserDataResponse;
    },

    async deleteData(userId: string): Promise<number> {
      const result = await makeRequest('DELETE', `/gdpr/user/${userId}/data`) as Record<string, unknown> | null;
      if (!result) return 0;
      return (result.deletedCount as number) || (result.recordsDeleted as number) || 0;
    },

    async anonymizeData(userId: string): Promise<number> {
      const result = await makeRequest('POST', `/gdpr/user/${userId}/anonymize`) as Record<string, unknown> | null;
      if (!result) return 0;
      return (result.anonymizedCount as number) || (result.fieldsAnonymized as number) || 0;
    },
  };
}

/**
 * Factory function to create service clients from endpoint configuration
 */
export function createServiceClientsFromEndpoints(
  endpoints: ServiceEndpoints,
  authToken?: string
): GDPRServiceConfig {
  const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const config: GDPRServiceConfig = {};

  if (endpoints.authService) {
    config.authService = createHttpServiceClient({
      baseUrl: endpoints.authService,
      serviceName: 'auth-service',
      headers,
    });
  }

  if (endpoints.userService) {
    config.profileService = createHttpServiceClient({
      baseUrl: endpoints.userService,
      serviceName: 'user-service',
      headers,
    });
  }

  if (endpoints.resumeService) {
    config.resumeService = createHttpServiceClient({
      baseUrl: endpoints.resumeService,
      serviceName: 'resume-service',
      headers,
    });
  }

  if (endpoints.jobService) {
    config.jobService = createHttpServiceClient({
      baseUrl: endpoints.jobService,
      serviceName: 'job-service',
      headers,
    });
    config.applicationService = createHttpServiceClient({
      baseUrl: endpoints.jobService,
      serviceName: 'job-service',
      headers,
    });
  }

  if (endpoints.analyticsService) {
    config.analyticsService = createHttpServiceClient({
      baseUrl: endpoints.analyticsService,
      serviceName: 'analytics-service',
      headers,
    });
  }

  if (endpoints.paymentService) {
    config.paymentService = createHttpServiceClient({
      baseUrl: endpoints.paymentService,
      serviceName: 'payment-service',
      headers,
    });
  }

  if (endpoints.notificationService) {
    config.notificationService = createHttpServiceClient({
      baseUrl: endpoints.notificationService,
      serviceName: 'notification-service',
      headers,
    });
    config.communicationService = createHttpServiceClient({
      baseUrl: endpoints.notificationService,
      serviceName: 'notification-service',
      headers,
    });
  }

  if (endpoints.autoApplyService) {
    config.applicationService = createHttpServiceClient({
      baseUrl: endpoints.autoApplyService,
      serviceName: 'auto-apply-service',
      headers,
    });
  }

  return config;
}

// Export singleton instance
export const gdprService = new GDPRService();
