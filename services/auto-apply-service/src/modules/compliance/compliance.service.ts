import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Compliance Regions
 */
export enum ComplianceRegion {
  US = 'US',
  EU = 'EU',
  UK = 'UK',
  CANADA = 'CANADA',
  AUSTRALIA = 'AUSTRALIA',
  APAC = 'APAC',
  LATAM = 'LATAM',
  MEA = 'MEA',
  GLOBAL = 'GLOBAL',
}

/**
 * Data Processing Purpose
 */
export enum DataPurpose {
  JOB_MATCHING = 'job_matching',
  AUTO_APPLY = 'auto_apply',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  PROFILE_ENHANCEMENT = 'profile_enhancement',
  AI_TRAINING = 'ai_training',
}

/**
 * Consent Status
 */
export enum ConsentStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  PENDING = 'pending',
  NOT_REQUIRED = 'not_required',
}

/**
 * Data Subject Request Type (GDPR Article 15-22)
 */
export enum DataSubjectRequestType {
  ACCESS = 'access',           // Article 15 - Right of access
  RECTIFICATION = 'rectification', // Article 16 - Right to rectification
  ERASURE = 'erasure',         // Article 17 - Right to erasure (right to be forgotten)
  RESTRICTION = 'restriction', // Article 18 - Right to restriction of processing
  PORTABILITY = 'portability', // Article 20 - Right to data portability
  OBJECTION = 'objection',     // Article 21 - Right to object
  AUTOMATED_DECISION = 'automated_decision', // Article 22 - Automated individual decision-making
}

/**
 * Protected Attributes (EEOC/ADA compliance - never infer or store)
 */
export const PROTECTED_ATTRIBUTES = [
  'race',
  'color',
  'religion',
  'sex',
  'sexual_orientation',
  'gender_identity',
  'national_origin',
  'age',
  'disability',
  'genetic_information',
  'pregnancy',
  'veteran_status',
  'citizenship_status',
  'marital_status',
  'political_affiliation',
] as const;

/**
 * User Consent Record
 */
interface UserConsent {
  userId: string;
  purpose: DataPurpose;
  status: ConsentStatus;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Data Subject Request
 */
interface DataSubjectRequest {
  id: string;
  userId: string;
  type: DataSubjectRequestType;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  responseData?: any;
  rejectionReason?: string;
}

/**
 * Compliance Audit Log
 */
interface ComplianceAuditLog {
  id: string;
  userId: string;
  action: string;
  region: ComplianceRegion;
  dataCategory: string;
  purpose: DataPurpose;
  legalBasis: string;
  timestamp: Date;
  details: Record<string, any>;
}

/**
 * Region-specific Policy Configuration
 */
interface RegionPolicy {
  region: ComplianceRegion;
  regulations: string[];
  consentRequired: DataPurpose[];
  retentionPeriodDays: number;
  dataMinimization: boolean;
  purposeLimitation: boolean;
  allowedDataCategories: string[];
  restrictedDataCategories: string[];
  dataSubjectRights: DataSubjectRequestType[];
  dsrResponseDays: number;
  breachNotificationHours: number;
  dpoRequired: boolean;
  crossBorderTransferRules: 'sccs' | 'adequacy' | 'binding_corporate_rules' | 'consent' | 'none';
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  // In-memory stores (in production, use database entities)
  private userConsents: Map<string, UserConsent[]> = new Map();
  private dataSubjectRequests: Map<string, DataSubjectRequest[]> = new Map();
  private auditLogs: ComplianceAuditLog[] = [];

  /**
   * Region-specific compliance policies
   */
  private readonly regionPolicies: Map<ComplianceRegion, RegionPolicy> = new Map([
    [ComplianceRegion.EU, {
      region: ComplianceRegion.EU,
      regulations: ['GDPR'],
      consentRequired: [
        DataPurpose.MARKETING,
        DataPurpose.THIRD_PARTY_SHARING,
        DataPurpose.AI_TRAINING,
        DataPurpose.ANALYTICS,
      ],
      retentionPeriodDays: 365 * 3, // 3 years max
      dataMinimization: true,
      purposeLimitation: true,
      allowedDataCategories: ['contact', 'professional', 'application_history'],
      restrictedDataCategories: ['health', 'biometric', 'genetic', 'political', 'religious', 'ethnic'],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.RECTIFICATION,
        DataSubjectRequestType.ERASURE,
        DataSubjectRequestType.RESTRICTION,
        DataSubjectRequestType.PORTABILITY,
        DataSubjectRequestType.OBJECTION,
        DataSubjectRequestType.AUTOMATED_DECISION,
      ],
      dsrResponseDays: 30,
      breachNotificationHours: 72,
      dpoRequired: true,
      crossBorderTransferRules: 'sccs',
    }],

    [ComplianceRegion.UK, {
      region: ComplianceRegion.UK,
      regulations: ['UK_GDPR', 'DPA_2018'],
      consentRequired: [
        DataPurpose.MARKETING,
        DataPurpose.THIRD_PARTY_SHARING,
        DataPurpose.AI_TRAINING,
        DataPurpose.ANALYTICS,
      ],
      retentionPeriodDays: 365 * 3,
      dataMinimization: true,
      purposeLimitation: true,
      allowedDataCategories: ['contact', 'professional', 'application_history'],
      restrictedDataCategories: ['health', 'biometric', 'genetic', 'political', 'religious', 'ethnic'],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.RECTIFICATION,
        DataSubjectRequestType.ERASURE,
        DataSubjectRequestType.RESTRICTION,
        DataSubjectRequestType.PORTABILITY,
        DataSubjectRequestType.OBJECTION,
        DataSubjectRequestType.AUTOMATED_DECISION,
      ],
      dsrResponseDays: 30,
      breachNotificationHours: 72,
      dpoRequired: true,
      crossBorderTransferRules: 'adequacy',
    }],

    [ComplianceRegion.US, {
      region: ComplianceRegion.US,
      regulations: ['EEOC', 'ADA', 'CCPA', 'FCRA'],
      consentRequired: [
        DataPurpose.THIRD_PARTY_SHARING,
        DataPurpose.AI_TRAINING,
      ],
      retentionPeriodDays: 365 * 7, // EEOC requires retention for certain records
      dataMinimization: false,
      purposeLimitation: false,
      allowedDataCategories: ['contact', 'professional', 'application_history', 'background_check'],
      restrictedDataCategories: PROTECTED_ATTRIBUTES as unknown as string[],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.ERASURE, // CCPA
        DataSubjectRequestType.PORTABILITY, // CCPA
        DataSubjectRequestType.OBJECTION, // CCPA opt-out
      ],
      dsrResponseDays: 45, // CCPA allows 45 days
      breachNotificationHours: 0, // State-specific requirements
      dpoRequired: false,
      crossBorderTransferRules: 'none',
    }],

    [ComplianceRegion.CANADA, {
      region: ComplianceRegion.CANADA,
      regulations: ['PIPEDA', 'CASL'],
      consentRequired: [
        DataPurpose.MARKETING,
        DataPurpose.THIRD_PARTY_SHARING,
        DataPurpose.AI_TRAINING,
        DataPurpose.ANALYTICS,
        DataPurpose.AUTO_APPLY,
      ],
      retentionPeriodDays: 365 * 2, // Reasonable retention
      dataMinimization: true,
      purposeLimitation: true,
      allowedDataCategories: ['contact', 'professional', 'application_history'],
      restrictedDataCategories: ['health', 'financial', 'biometric'],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.RECTIFICATION,
        DataSubjectRequestType.OBJECTION,
      ],
      dsrResponseDays: 30,
      breachNotificationHours: 0, // "As soon as feasible"
      dpoRequired: false,
      crossBorderTransferRules: 'consent',
    }],

    [ComplianceRegion.AUSTRALIA, {
      region: ComplianceRegion.AUSTRALIA,
      regulations: ['Privacy_Act_1988', 'APPs'],
      consentRequired: [
        DataPurpose.MARKETING,
        DataPurpose.THIRD_PARTY_SHARING,
      ],
      retentionPeriodDays: 365 * 5,
      dataMinimization: true,
      purposeLimitation: true,
      allowedDataCategories: ['contact', 'professional', 'application_history'],
      restrictedDataCategories: ['health', 'biometric', 'genetic', 'political', 'religious'],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.RECTIFICATION,
      ],
      dsrResponseDays: 30,
      breachNotificationHours: 72,
      dpoRequired: false,
      crossBorderTransferRules: 'consent',
    }],

    [ComplianceRegion.GLOBAL, {
      region: ComplianceRegion.GLOBAL,
      regulations: ['GDPR', 'CCPA', 'PIPEDA'], // Apply most restrictive
      consentRequired: [
        DataPurpose.MARKETING,
        DataPurpose.THIRD_PARTY_SHARING,
        DataPurpose.AI_TRAINING,
        DataPurpose.ANALYTICS,
      ],
      retentionPeriodDays: 365 * 2,
      dataMinimization: true,
      purposeLimitation: true,
      allowedDataCategories: ['contact', 'professional', 'application_history'],
      restrictedDataCategories: [...PROTECTED_ATTRIBUTES, 'health', 'biometric', 'genetic'],
      dataSubjectRights: [
        DataSubjectRequestType.ACCESS,
        DataSubjectRequestType.RECTIFICATION,
        DataSubjectRequestType.ERASURE,
        DataSubjectRequestType.PORTABILITY,
        DataSubjectRequestType.OBJECTION,
      ],
      dsrResponseDays: 30,
      breachNotificationHours: 72,
      dpoRequired: true,
      crossBorderTransferRules: 'sccs',
    }],
  ]);

  /**
   * Determine user's compliance region from country code
   */
  getComplianceRegion(countryCode: string): ComplianceRegion {
    const euCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
      // EEA
      'IS', 'LI', 'NO',
    ];

    if (countryCode === 'US') return ComplianceRegion.US;
    if (countryCode === 'GB') return ComplianceRegion.UK;
    if (countryCode === 'CA') return ComplianceRegion.CANADA;
    if (countryCode === 'AU') return ComplianceRegion.AUSTRALIA;
    if (euCountries.includes(countryCode)) return ComplianceRegion.EU;

    return ComplianceRegion.GLOBAL;
  }

  /**
   * Get policy for a specific region
   */
  getRegionPolicy(region: ComplianceRegion): RegionPolicy {
    return this.regionPolicies.get(region) || this.regionPolicies.get(ComplianceRegion.GLOBAL)!;
  }

  /**
   * Check if consent is required for a specific purpose in a region
   */
  isConsentRequired(region: ComplianceRegion, purpose: DataPurpose): boolean {
    const policy = this.getRegionPolicy(region);
    return policy.consentRequired.includes(purpose);
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: DataPurpose,
    granted: boolean,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<UserConsent> {
    const consent: UserConsent = {
      userId,
      purpose,
      status: granted ? ConsentStatus.GRANTED : ConsentStatus.DENIED,
      grantedAt: granted ? new Date() : undefined,
      version: '1.0',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    };

    const userConsents = this.userConsents.get(userId) || [];

    // Remove previous consent for same purpose
    const filtered = userConsents.filter(c => c.purpose !== purpose);
    filtered.push(consent);
    this.userConsents.set(userId, filtered);

    this.logAudit({
      userId,
      action: granted ? 'CONSENT_GRANTED' : 'CONSENT_DENIED',
      region: ComplianceRegion.GLOBAL,
      dataCategory: 'consent',
      purpose,
      legalBasis: 'consent',
      details: { consent },
    });

    this.logger.log(`Consent ${granted ? 'granted' : 'denied'} for user ${userId}, purpose: ${purpose}`);
    return consent;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(userId: string, purpose: DataPurpose): Promise<void> {
    const userConsents = this.userConsents.get(userId) || [];
    const consent = userConsents.find(c => c.purpose === purpose);

    if (consent) {
      consent.status = ConsentStatus.WITHDRAWN;
      consent.withdrawnAt = new Date();
    }

    this.logAudit({
      userId,
      action: 'CONSENT_WITHDRAWN',
      region: ComplianceRegion.GLOBAL,
      dataCategory: 'consent',
      purpose,
      legalBasis: 'consent',
      details: { purpose },
    });

    this.logger.log(`Consent withdrawn for user ${userId}, purpose: ${purpose}`);
  }

  /**
   * Check if user has valid consent for a purpose
   */
  hasValidConsent(userId: string, purpose: DataPurpose): boolean {
    const userConsents = this.userConsents.get(userId) || [];
    const consent = userConsents.find(c => c.purpose === purpose);

    if (!consent) return false;
    if (consent.status !== ConsentStatus.GRANTED) return false;
    if (consent.expiresAt && consent.expiresAt < new Date()) return false;

    return true;
  }

  /**
   * Verify user can perform action based on consent and region
   */
  async verifyDataProcessingAllowed(
    userId: string,
    purpose: DataPurpose,
    region: ComplianceRegion,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const policy = this.getRegionPolicy(region);

    // Check if consent is required for this purpose
    if (policy.consentRequired.includes(purpose)) {
      if (!this.hasValidConsent(userId, purpose)) {
        return {
          allowed: false,
          reason: `Consent required for ${purpose} in ${region}. Please grant consent to continue.`,
        };
      }
    }

    this.logAudit({
      userId,
      action: 'DATA_PROCESSING_VERIFIED',
      region,
      dataCategory: 'processing',
      purpose,
      legalBasis: policy.consentRequired.includes(purpose) ? 'consent' : 'legitimate_interest',
      details: { allowed: true },
    });

    return { allowed: true };
  }

  /**
   * EEOC/ADA Safe Screening - Remove protected attributes from data
   */
  sanitizeForEEOCCompliance(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };

    // Remove any fields that might contain protected attributes
    const fieldsToRemove = [
      'age', 'birthdate', 'date_of_birth', 'dob',
      'gender', 'sex',
      'race', 'ethnicity',
      'religion', 'religious_affiliation',
      'national_origin', 'nationality', 'citizenship',
      'disability', 'handicap', 'medical_condition',
      'genetic_information',
      'pregnancy_status', 'pregnant',
      'marital_status', 'married',
      'veteran_status', 'military_service',
      'sexual_orientation',
      'political_affiliation', 'political_views',
      'photo', 'picture', 'image', 'headshot', // Can reveal protected attributes
    ];

    for (const field of fieldsToRemove) {
      delete sanitized[field];
      // Also check nested objects
      for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          delete sanitized[key][field];
        }
      }
    }

    // Redact any text fields that might contain protected info
    const textFields = ['bio', 'summary', 'about', 'description', 'notes'];
    for (const field of textFields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = this.redactProtectedInfo(sanitized[field]);
      }
    }

    return sanitized;
  }

  /**
   * Redact protected information from text
   */
  private redactProtectedInfo(text: string): string {
    // Patterns that might reveal protected attributes
    const patterns = [
      /\b\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/g, // Dates (could reveal age)
      /\b(male|female|transgender|non-binary)\b/gi, // Gender
      /\b(christian|muslim|jewish|hindu|buddhist|atheist)\b/gi, // Religion
      /\b(pregnant|disability|disabled|handicapped)\b/gi, // Protected conditions
      /\b(veteran|military service)\b/gi, // Veteran status
    ];

    let redacted = text;
    for (const pattern of patterns) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
  }

  /**
   * Apply data minimization for GDPR/PIPEDA compliance
   */
  applyDataMinimization(
    data: Record<string, any>,
    purpose: DataPurpose,
    region: ComplianceRegion,
  ): Record<string, any> {
    const policy = this.getRegionPolicy(region);

    if (!policy.dataMinimization) {
      return data;
    }

    // Define minimum required fields per purpose
    const requiredFieldsByPurpose: Record<DataPurpose, string[]> = {
      [DataPurpose.JOB_MATCHING]: [
        'skills', 'experience', 'education', 'location', 'job_preferences',
      ],
      [DataPurpose.AUTO_APPLY]: [
        'name', 'email', 'phone', 'resume', 'cover_letter', 'work_authorization',
      ],
      [DataPurpose.ANALYTICS]: [
        'user_id', 'action_type', 'timestamp', // Anonymized data only
      ],
      [DataPurpose.MARKETING]: [
        'email', 'preferences',
      ],
      [DataPurpose.THIRD_PARTY_SHARING]: [
        'name', 'email', 'resume', // Explicit sharing only
      ],
      [DataPurpose.PROFILE_ENHANCEMENT]: [
        'skills', 'experience', 'education', 'certifications',
      ],
      [DataPurpose.AI_TRAINING]: [
        // Anonymized/aggregated only
      ],
    };

    const allowedFields = requiredFieldsByPurpose[purpose] || [];
    const minimized: Record<string, any> = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        minimized[field] = data[field];
      }
    }

    this.logger.debug(`Data minimized for ${purpose}: ${Object.keys(minimized).length} fields retained`);
    return minimized;
  }

  /**
   * Handle Data Subject Request (GDPR Articles 15-22)
   */
  async createDataSubjectRequest(
    userId: string,
    type: DataSubjectRequestType,
    region: ComplianceRegion,
  ): Promise<DataSubjectRequest> {
    const policy = this.getRegionPolicy(region);

    // Verify the right is available in this region
    if (!policy.dataSubjectRights.includes(type)) {
      throw new BadRequestException(
        `Right to ${type} is not available in ${region}`,
      );
    }

    const request: DataSubjectRequest = {
      id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      status: 'pending',
      requestedAt: new Date(),
    };

    const userRequests = this.dataSubjectRequests.get(userId) || [];
    userRequests.push(request);
    this.dataSubjectRequests.set(userId, userRequests);

    this.logAudit({
      userId,
      action: 'DSR_CREATED',
      region,
      dataCategory: 'data_subject_rights',
      purpose: DataPurpose.JOB_MATCHING, // N/A for DSR
      legalBasis: 'legal_obligation',
      details: { requestType: type, requestId: request.id },
    });

    this.logger.log(`DSR created: ${type} for user ${userId} in ${region}`);
    return request;
  }

  /**
   * Process Data Subject Request - Access (Article 15)
   */
  async processAccessRequest(userId: string): Promise<Record<string, any>> {
    // Collect all user data from all services
    const userData = {
      profile: await this.collectProfileData(userId),
      applications: await this.collectApplicationData(userId),
      consents: this.userConsents.get(userId) || [],
      activityLog: await this.collectActivityLog(userId),
      thirdPartySharing: await this.collectThirdPartySharing(userId),
    };

    this.logAudit({
      userId,
      action: 'DSR_ACCESS_PROCESSED',
      region: ComplianceRegion.GLOBAL,
      dataCategory: 'all',
      purpose: DataPurpose.JOB_MATCHING,
      legalBasis: 'legal_obligation',
      details: { dataCategories: Object.keys(userData) },
    });

    return userData;
  }

  /**
   * Process Data Subject Request - Erasure (Article 17)
   */
  async processErasureRequest(userId: string): Promise<{ erasedCategories: string[] }> {
    const erasedCategories: string[] = [];

    // In production, delete from actual databases
    // Here we simulate the process

    // 1. Delete profile data
    erasedCategories.push('profile');

    // 2. Delete application history
    erasedCategories.push('applications');

    // 3. Delete saved jobs
    erasedCategories.push('saved_jobs');

    // 4. Delete resume files
    erasedCategories.push('resumes');

    // 5. Delete analytics data
    erasedCategories.push('analytics');

    // 6. Anonymize audit logs (required for legal compliance)
    erasedCategories.push('audit_logs_anonymized');

    // 7. Request deletion from third parties
    erasedCategories.push('third_party_deletion_requested');

    this.logAudit({
      userId: 'ANONYMIZED',
      action: 'DSR_ERASURE_PROCESSED',
      region: ComplianceRegion.GLOBAL,
      dataCategory: 'all',
      purpose: DataPurpose.JOB_MATCHING,
      legalBasis: 'legal_obligation',
      details: { erasedCategories },
    });

    return { erasedCategories };
  }

  /**
   * Process Data Subject Request - Portability (Article 20)
   */
  async processPortabilityRequest(userId: string): Promise<{ format: string; data: any }> {
    const data = await this.processAccessRequest(userId);

    // Convert to machine-readable format (JSON)
    return {
      format: 'application/json',
      data: {
        exportedAt: new Date().toISOString(),
        userId,
        schema: 'ApplyForUs-Export-v1.0',
        ...data,
      },
    };
  }

  /**
   * Check data retention compliance
   */
  async checkRetentionCompliance(userId: string, region: ComplianceRegion): Promise<{
    compliant: boolean;
    dataToDelete: string[];
  }> {
    const policy = this.getRegionPolicy(region);
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - policy.retentionPeriodDays);

    const dataToDelete: string[] = [];

    // Check various data categories
    // In production, query actual databases

    return {
      compliant: dataToDelete.length === 0,
      dataToDelete,
    };
  }

  /**
   * Cross-border data transfer check
   */
  canTransferDataToPloaded(
    sourceRegion: ComplianceRegion,
    targetRegion: ComplianceRegion,
    userId: string,
  ): { allowed: boolean; mechanism?: string; requirements?: string[] } {
    const sourcePolicy = this.getRegionPolicy(sourceRegion);

    // Same region - always allowed
    if (sourceRegion === targetRegion) {
      return { allowed: true };
    }

    // Check transfer rules
    switch (sourcePolicy.crossBorderTransferRules) {
      case 'none':
        return { allowed: true };

      case 'adequacy':
        // Check if target region has adequacy decision
        const adequateRegions = [
          ComplianceRegion.EU, ComplianceRegion.UK, ComplianceRegion.CANADA,
        ];
        if (adequateRegions.includes(targetRegion)) {
          return { allowed: true, mechanism: 'adequacy_decision' };
        }
        return {
          allowed: false,
          requirements: ['Standard Contractual Clauses (SCCs) required'],
        };

      case 'sccs':
        return {
          allowed: true,
          mechanism: 'standard_contractual_clauses',
          requirements: ['SCCs must be signed', 'Transfer Impact Assessment required'],
        };

      case 'consent':
        const hasConsent = this.hasValidConsent(userId, DataPurpose.THIRD_PARTY_SHARING);
        return {
          allowed: hasConsent,
          mechanism: hasConsent ? 'explicit_consent' : undefined,
          requirements: hasConsent ? [] : ['User consent required for cross-border transfer'],
        };

      case 'binding_corporate_rules':
        return {
          allowed: true,
          mechanism: 'binding_corporate_rules',
          requirements: ['BCRs must be approved by supervisory authority'],
        };

      default:
        return { allowed: false, requirements: ['Unknown transfer mechanism'] };
    }
  }

  /**
   * Log compliance audit event
   */
  private logAudit(log: Omit<ComplianceAuditLog, 'id' | 'timestamp'>): void {
    const auditLog: ComplianceAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...log,
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 logs in memory (in production, persist to database)
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Get audit logs for a user
   */
  getAuditLogs(userId: string, limit: number = 100): ComplianceAuditLog[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Scheduled: Check for pending DSRs nearing deadline
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkDSRDeadlines(): Promise<void> {
    for (const [userId, requests] of this.dataSubjectRequests) {
      for (const request of requests) {
        if (request.status !== 'pending' && request.status !== 'in_progress') continue;

        const daysSinceRequest = (Date.now() - request.requestedAt.getTime()) / (1000 * 60 * 60 * 24);

        // Alert if approaching 30-day deadline
        if (daysSinceRequest >= 25 && daysSinceRequest < 30) {
          this.logger.warn(`DSR ${request.id} approaching deadline: ${30 - Math.floor(daysSinceRequest)} days remaining`);
        } else if (daysSinceRequest >= 30) {
          this.logger.error(`DSR ${request.id} OVERDUE! Request made ${Math.floor(daysSinceRequest)} days ago`);
        }
      }
    }
  }

  /**
   * Scheduled: Data retention cleanup
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runRetentionCleanup(): Promise<void> {
    this.logger.log('Running scheduled data retention cleanup...');

    // In production, implement actual data deletion based on retention policies
    // This would query users, check their region, and delete data exceeding retention

    this.logger.log('Data retention cleanup completed');
  }

  // Helper methods for data collection (simulated)
  private async collectProfileData(userId: string): Promise<any> {
    return { message: 'Profile data would be collected from user-service' };
  }

  private async collectApplicationData(userId: string): Promise<any> {
    return { message: 'Application data would be collected from auto-apply-service' };
  }

  private async collectActivityLog(userId: string): Promise<any> {
    return this.auditLogs.filter(log => log.userId === userId);
  }

  private async collectThirdPartySharing(userId: string): Promise<any> {
    return { message: 'Third-party sharing log would be collected' };
  }

  /**
   * Generate compliance report for a user
   */
  async generateComplianceReport(userId: string, region: ComplianceRegion): Promise<{
    region: ComplianceRegion;
    policy: RegionPolicy;
    consents: UserConsent[];
    pendingDSRs: DataSubjectRequest[];
    retentionStatus: any;
    auditLogSample: ComplianceAuditLog[];
  }> {
    const policy = this.getRegionPolicy(region);
    const consents = this.userConsents.get(userId) || [];
    const allRequests = this.dataSubjectRequests.get(userId) || [];
    const pendingDSRs = allRequests.filter(r => r.status === 'pending' || r.status === 'in_progress');
    const retentionStatus = await this.checkRetentionCompliance(userId, region);
    const auditLogSample = this.getAuditLogs(userId, 10);

    return {
      region,
      policy,
      consents,
      pendingDSRs,
      retentionStatus,
      auditLogSample,
    };
  }
}
