/**
 * ApplyForUs AI - Data Classification System
 *
 * Classifies data based on sensitivity level and defines handling requirements.
 */

/**
 * Data classification levels
 */
export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  SENSITIVE = 'sensitive',
  HIGHLY_SENSITIVE = 'highly_sensitive',
}

/**
 * Handling requirements for each classification level
 */
export interface HandlingRequirements {
  classification: DataClassification;
  encryptionRequired: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  accessLogging: boolean;
  retentionPeriodDays?: number;
  backupRequired: boolean;
  deletionMethod: 'standard' | 'secure' | 'cryptographic';
  accessControl: 'public' | 'authenticated' | 'authorized' | 'restricted';
  auditTrailRequired: boolean;
  dataMinimization: boolean;
  anonymizationRequired: boolean;
  geographicRestrictions?: string[];
  regulatoryCompliance: string[];
}

/**
 * Field classification mapping
 */
export const FIELD_CLASSIFICATIONS: Record<string, DataClassification> = {
  // PUBLIC - Can be freely shared
  jobTitle: DataClassification.PUBLIC,
  jobDescription: DataClassification.PUBLIC,
  companyName: DataClassification.PUBLIC,
  industry: DataClassification.PUBLIC,
  jobLocation: DataClassification.PUBLIC,
  skillsRequired: DataClassification.PUBLIC,

  // INTERNAL - Company/user internal use
  userId: DataClassification.INTERNAL,
  companyId: DataClassification.INTERNAL,
  applicationStatus: DataClassification.INTERNAL,
  preferences: DataClassification.INTERNAL,
  settings: DataClassification.INTERNAL,
  metadata: DataClassification.INTERNAL,

  // SENSITIVE - PII and personal data
  email: DataClassification.SENSITIVE,
  firstName: DataClassification.SENSITIVE,
  lastName: DataClassification.SENSITIVE,
  fullName: DataClassification.SENSITIVE,
  phoneNumber: DataClassification.SENSITIVE,
  address: DataClassification.SENSITIVE,
  city: DataClassification.SENSITIVE,
  state: DataClassification.SENSITIVE,
  zipCode: DataClassification.SENSITIVE,
  country: DataClassification.SENSITIVE,
  dateOfBirth: DataClassification.SENSITIVE,
  education: DataClassification.SENSITIVE,
  workHistory: DataClassification.SENSITIVE,
  resume: DataClassification.SENSITIVE,
  coverLetter: DataClassification.SENSITIVE,
  linkedinUrl: DataClassification.SENSITIVE,
  githubUrl: DataClassification.SENSITIVE,
  portfolioUrl: DataClassification.SENSITIVE,
  references: DataClassification.SENSITIVE,

  // HIGHLY_SENSITIVE - Requires highest protection
  password: DataClassification.HIGHLY_SENSITIVE,
  passwordHash: DataClassification.HIGHLY_SENSITIVE,
  ssn: DataClassification.HIGHLY_SENSITIVE,
  socialSecurityNumber: DataClassification.HIGHLY_SENSITIVE,
  taxId: DataClassification.HIGHLY_SENSITIVE,
  bankAccount: DataClassification.HIGHLY_SENSITIVE,
  creditCard: DataClassification.HIGHLY_SENSITIVE,
  paymentInfo: DataClassification.HIGHLY_SENSITIVE,
  apiKey: DataClassification.HIGHLY_SENSITIVE,
  apiSecret: DataClassification.HIGHLY_SENSITIVE,
  accessToken: DataClassification.HIGHLY_SENSITIVE,
  refreshToken: DataClassification.HIGHLY_SENSITIVE,
  privateKey: DataClassification.HIGHLY_SENSITIVE,
  encryptionKey: DataClassification.HIGHLY_SENSITIVE,
  backgroundCheck: DataClassification.HIGHLY_SENSITIVE,
  medicalInfo: DataClassification.HIGHLY_SENSITIVE,
  healthData: DataClassification.HIGHLY_SENSITIVE,
  biometric: DataClassification.HIGHLY_SENSITIVE,
  criminalRecord: DataClassification.HIGHLY_SENSITIVE,
  salary: DataClassification.HIGHLY_SENSITIVE,
  compensation: DataClassification.HIGHLY_SENSITIVE,
  salaryExpectation: DataClassification.HIGHLY_SENSITIVE,
};

/**
 * Handling requirements by classification level
 */
export const HANDLING_REQUIREMENTS: Record<DataClassification, HandlingRequirements> = {
  [DataClassification.PUBLIC]: {
    classification: DataClassification.PUBLIC,
    encryptionRequired: false,
    encryptionAtRest: false,
    encryptionInTransit: true,
    accessLogging: false,
    backupRequired: true,
    deletionMethod: 'standard',
    accessControl: 'public',
    auditTrailRequired: false,
    dataMinimization: false,
    anonymizationRequired: false,
    regulatoryCompliance: [],
  },

  [DataClassification.INTERNAL]: {
    classification: DataClassification.INTERNAL,
    encryptionRequired: false,
    encryptionAtRest: false,
    encryptionInTransit: true,
    accessLogging: true,
    retentionPeriodDays: 2555, // 7 years
    backupRequired: true,
    deletionMethod: 'standard',
    accessControl: 'authenticated',
    auditTrailRequired: true,
    dataMinimization: true,
    anonymizationRequired: false,
    regulatoryCompliance: [],
  },

  [DataClassification.SENSITIVE]: {
    classification: DataClassification.SENSITIVE,
    encryptionRequired: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessLogging: true,
    retentionPeriodDays: 2555, // 7 years (can be adjusted per regulation)
    backupRequired: true,
    deletionMethod: 'secure',
    accessControl: 'authorized',
    auditTrailRequired: true,
    dataMinimization: true,
    anonymizationRequired: false,
    regulatoryCompliance: ['GDPR', 'CCPA', 'EEOC'],
  },

  [DataClassification.HIGHLY_SENSITIVE]: {
    classification: DataClassification.HIGHLY_SENSITIVE,
    encryptionRequired: true,
    encryptionAtRest: true,
    encryptionInTransit: true,
    accessLogging: true,
    retentionPeriodDays: 90, // Minimize retention
    backupRequired: true,
    deletionMethod: 'cryptographic',
    accessControl: 'restricted',
    auditTrailRequired: true,
    dataMinimization: true,
    anonymizationRequired: true,
    regulatoryCompliance: ['GDPR', 'CCPA', 'PCI-DSS', 'HIPAA', 'SOX'],
  },
};

/**
 * Data Classification Service
 */
export class DataClassificationService {
  private customClassifications: Map<string, DataClassification> = new Map();

  /**
   * Get classification for a field
   */
  getClassification(fieldName: string): DataClassification {
    // Check custom classifications first
    if (this.customClassifications.has(fieldName)) {
      return this.customClassifications.get(fieldName)!;
    }

    // Check built-in classifications
    const normalizedFieldName = this.normalizeFieldName(fieldName);
    if (normalizedFieldName in FIELD_CLASSIFICATIONS) {
      return FIELD_CLASSIFICATIONS[normalizedFieldName];
    }

    // Default to INTERNAL for unknown fields
    return DataClassification.INTERNAL;
  }

  /**
   * Get handling requirements for a classification level
   */
  getHandlingRequirements(classification: DataClassification): HandlingRequirements {
    return HANDLING_REQUIREMENTS[classification];
  }

  /**
   * Get handling requirements for a field
   */
  getFieldHandlingRequirements(fieldName: string): HandlingRequirements {
    const classification = this.getClassification(fieldName);
    return this.getHandlingRequirements(classification);
  }

  /**
   * Register custom field classification
   */
  registerFieldClassification(fieldName: string, classification: DataClassification): void {
    this.customClassifications.set(fieldName, classification);
  }

  /**
   * Classify an object's fields
   */
  classifyObject(obj: Record<string, any>): Record<string, DataClassification> {
    const classifications: Record<string, DataClassification> = {};

    for (const key of Object.keys(obj)) {
      classifications[key] = this.getClassification(key);
    }

    return classifications;
  }

  /**
   * Get fields by classification level
   */
  getFieldsByClassification(
    obj: Record<string, any>,
    classification: DataClassification
  ): string[] {
    const fields: string[] = [];

    for (const key of Object.keys(obj)) {
      if (this.getClassification(key) === classification) {
        fields.push(key);
      }
    }

    return fields;
  }

  /**
   * Check if field requires encryption
   */
  requiresEncryption(fieldName: string): boolean {
    const requirements = this.getFieldHandlingRequirements(fieldName);
    return requirements.encryptionRequired;
  }

  /**
   * Check if field requires audit logging
   */
  requiresAuditLogging(fieldName: string): boolean {
    const requirements = this.getFieldHandlingRequirements(fieldName);
    return requirements.accessLogging;
  }

  /**
   * Get retention period for field
   */
  getRetentionPeriod(fieldName: string): number | undefined {
    const requirements = this.getFieldHandlingRequirements(fieldName);
    return requirements.retentionPeriodDays;
  }

  /**
   * Check if field is PII (Personally Identifiable Information)
   */
  isPII(fieldName: string): boolean {
    const classification = this.getClassification(fieldName);
    return (
      classification === DataClassification.SENSITIVE ||
      classification === DataClassification.HIGHLY_SENSITIVE
    );
  }

  /**
   * Check if field is highly sensitive
   */
  isHighlySensitive(fieldName: string): boolean {
    return this.getClassification(fieldName) === DataClassification.HIGHLY_SENSITIVE;
  }

  /**
   * Get all sensitive fields from an object
   */
  getSensitiveFields(obj: Record<string, any>): string[] {
    return Object.keys(obj).filter((key) => this.isPII(key));
  }

  /**
   * Get all highly sensitive fields from an object
   */
  getHighlySensitiveFields(obj: Record<string, any>): string[] {
    return Object.keys(obj).filter((key) => this.isHighlySensitive(key));
  }

  /**
   * Get regulatory compliance requirements for field
   */
  getComplianceRequirements(fieldName: string): string[] {
    const requirements = this.getFieldHandlingRequirements(fieldName);
    return requirements.regulatoryCompliance;
  }

  /**
   * Normalize field name for classification lookup
   */
  private normalizeFieldName(fieldName: string): string {
    // Convert camelCase and snake_case to standard format
    return fieldName
      .replace(/([A-Z])/g, (match) => match.toLowerCase())
      .replace(/_/g, '');
  }

  /**
   * Create classification report for an object
   */
  createClassificationReport(obj: Record<string, any>): {
    totalFields: number;
    classifications: Record<DataClassification, string[]>;
    encryptionRequired: string[];
    auditLoggingRequired: string[];
    piiFields: string[];
    highlySensitiveFields: string[];
  } {
    const fields = Object.keys(obj);
    const classifications: Record<DataClassification, string[]> = {
      [DataClassification.PUBLIC]: [],
      [DataClassification.INTERNAL]: [],
      [DataClassification.SENSITIVE]: [],
      [DataClassification.HIGHLY_SENSITIVE]: [],
    };

    const encryptionRequired: string[] = [];
    const auditLoggingRequired: string[] = [];
    const piiFields: string[] = [];
    const highlySensitiveFields: string[] = [];

    for (const field of fields) {
      const classification = this.getClassification(field);
      classifications[classification].push(field);

      if (this.requiresEncryption(field)) {
        encryptionRequired.push(field);
      }

      if (this.requiresAuditLogging(field)) {
        auditLoggingRequired.push(field);
      }

      if (this.isPII(field)) {
        piiFields.push(field);
      }

      if (this.isHighlySensitive(field)) {
        highlySensitiveFields.push(field);
      }
    }

    return {
      totalFields: fields.length,
      classifications,
      encryptionRequired,
      auditLoggingRequired,
      piiFields,
      highlySensitiveFields,
    };
  }
}

// Export singleton instance
export const dataClassificationService = new DataClassificationService();
