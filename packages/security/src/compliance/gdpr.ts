/**
 * JobPilot AI - GDPR Compliance Service
 *
 * Implements GDPR (General Data Protection Regulation) compliance features.
 */

import { auditLogger } from '../audit/audit-logger';
import { AuditEventType } from '../audit/audit-events';

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
 */
export class GDPRService {
  private consentStorage: Map<string, ConsentRecord[]> = new Map();
  private processingRecords: Map<string, ProcessingRecord[]> = new Map();

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
    const records = this.getProcessingRecords(userId);
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
        name: 'JobPilot AI',
        contact: 'privacy@jobpilot.ai',
        dpo: 'dpo@jobpilot.ai',
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

  // Helper methods (stubs for demonstration)
  private async fetchUserProfile(userId: string): Promise<any> {
    // Stub - fetch from profile service
    return { userId, name: 'User Profile Data' };
  }

  private async fetchUserResumes(userId: string): Promise<any[]> {
    // Stub - fetch from resume service
    return [];
  }

  private async fetchUserApplications(userId: string): Promise<any[]> {
    // Stub - fetch from application service
    return [];
  }

  private async fetchUserPreferences(userId: string): Promise<any> {
    // Stub - fetch from preference service
    return {};
  }

  private async fetchUserCommunications(userId: string): Promise<any[]> {
    // Stub - fetch from communication service
    return [];
  }

  private async fetchUserAnalytics(userId: string): Promise<any> {
    // Stub - fetch from analytics service
    return {};
  }

  private async fetchUserActivityLog(userId: string): Promise<any[]> {
    // Stub - fetch from audit log
    return [];
  }

  private async deleteUserResumes(userId: string): Promise<number> {
    // Stub - delete from resume service
    return 0;
  }

  private async deleteUserApplications(userId: string): Promise<number> {
    // Stub - delete from application service
    return 0;
  }

  private async deleteUserDocuments(userId: string): Promise<number> {
    // Stub - delete from document service
    return 0;
  }

  private async deleteUserCommunications(userId: string): Promise<number> {
    // Stub - delete from communication service
    return 0;
  }

  private deleteUserConsents(userId: string): number {
    const consents = this.consentStorage.get(userId) || [];
    this.consentStorage.delete(userId);
    return consents.length;
  }

  private generateConsentId(): string {
    return `consent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateProcessingRecordId(): string {
    return `proc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDeletionVerificationHash(userId: string): string {
    // In production, use proper cryptographic hash
    return `hash-${userId}-${Date.now()}`;
  }
}

// Export singleton instance
export const gdprService = new GDPRService();
