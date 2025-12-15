/* ============================================
   POLICY GENERATOR TYPE DEFINITIONS
   ============================================ */

/**
 * Supported regions for policy generation
 */
export type RegionCode =
  | 'US'      // United States (federal)
  | 'US_CA'   // California (CCPA/CPRA)
  | 'US_WA'   // Washington (My Health My Data)
  | 'US_VA'   // Virginia (VCDPA)
  | 'US_CO'   // Colorado (CPA)
  | 'US_CT'   // Connecticut (CTDPA)
  | 'UK'      // United Kingdom (UK GDPR)
  | 'EU'      // European Union (GDPR)
  | 'CA'      // Canada (PIPEDA)
  | 'AU'      // Australia (Privacy Act)
  | 'NG'      // Nigeria (NDPR)
  | 'BR'      // Brazil (LGPD)
  | 'MX'      // Mexico (LFPDPPP)
  | 'SG'      // Singapore (PDPA)
  | 'JP'      // Japan (APPI)
  | 'KR'      // South Korea (PIPA)
  | 'AE'      // UAE (PDPL)
  | 'SA'      // Saudi Arabia (PDPL)
  | 'GLOBAL'; // Global/Default policy

/**
 * Policy types supported by the generator
 */
export type PolicyType =
  | 'privacy'
  | 'terms'
  | 'cookies'
  | 'dpa'
  | 'ccpa_notice'
  | 'do_not_sell'
  | 'health_data'
  | 'ai_transparency'
  | 'modern_slavery'
  | 'accessibility'
  | 'subscription_terms'
  | 'ip_dmca';

/**
 * Output formats for generated policies
 */
export type OutputFormat = 'html' | 'markdown' | 'json' | 'react';

/**
 * Policy version metadata
 */
export interface PolicyVersion {
  version: string;
  effectiveDate: Date;
  lastUpdated: Date;
  changesSummary: string[];
  previousVersion?: string;
  author: string;
  approvedBy?: string;
  reviewDate?: Date;
}

/**
 * Region-specific configuration
 */
export interface RegionConfig {
  code: RegionCode;
  name: string;
  language: string;
  timezone: string;
  currency: string;
  regulations: string[];
  dataProtectionAuthority?: {
    name: string;
    website: string;
    email?: string;
  };
  requiredPolicies: PolicyType[];
  additionalRequirements?: string[];
}

/**
 * Policy section definition
 */
export interface PolicySection {
  id: string;
  title: string;
  content: string;
  order: number;
  required: boolean;
  regionSpecific: RegionCode[];
  lastModified: Date;
}

/**
 * Complete policy document
 */
export interface PolicyDocument {
  type: PolicyType;
  region: RegionCode;
  version: PolicyVersion;
  title: string;
  description: string;
  sections: PolicySection[];
  metadata: {
    companyName: string;
    companyAddress: string;
    contactEmail: string;
    dpoEmail?: string;
    websiteUrl: string;
    effectiveDate: Date;
    lastReviewDate: Date;
  };
  legalDisclaimer: string;
}

/**
 * Template variables for policy generation
 */
export interface PolicyVariables {
  // Company Information
  companyName: string;
  companyLegalName: string;
  companyAddress: string;
  companyCountry: string;
  companyWebsite: string;
  companyEmail: string;
  supportEmail: string;
  privacyEmail: string;
  dpoEmail?: string;
  dmcaEmail?: string;
  legalEmail: string;
  phone?: string;

  // Dates
  effectiveDate: string;
  lastUpdated: string;
  currentYear: number;

  // Region-specific
  region: RegionCode;
  regionName: string;
  regulationName?: string;
  dataProtectionAuthorityName?: string;
  dataProtectionAuthorityUrl?: string;

  // Feature flags
  hasAI: boolean;
  hasPayments: boolean;
  hasSubscriptions: boolean;
  hasAutoApply: boolean;
  hasAnalytics: boolean;
  hasThirdPartyIntegrations: boolean;

  // Data categories
  dataCategories: string[];
  sensitiveDataCategories?: string[];
  processingPurposes: string[];
  dataRetentionPeriods: Record<string, string>;
  thirdPartyRecipients: string[];
  subProcessors: SubProcessor[];

  // Custom sections
  customSections?: Record<string, string>;
}

/**
 * Sub-processor information
 */
export interface SubProcessor {
  name: string;
  purpose: string;
  location: string;
  dataTransferMechanism?: string;
}

/**
 * Policy change record
 */
export interface PolicyChange {
  id: string;
  policyType: PolicyType;
  region: RegionCode;
  previousVersion: string;
  newVersion: string;
  changeDate: Date;
  changeType: 'major' | 'minor' | 'patch';
  sections: {
    sectionId: string;
    changeType: 'added' | 'modified' | 'removed';
    previousContent?: string;
    newContent?: string;
    reason: string;
  }[];
  summary: string;
  notificationRequired: boolean;
  regulatoryTrigger?: string;
}

/**
 * Regulatory update tracking
 */
export interface RegulatoryUpdate {
  id: string;
  region: RegionCode;
  regulation: string;
  effectiveDate: Date;
  announcedDate: Date;
  description: string;
  impactedPolicies: PolicyType[];
  requiredChanges: string[];
  complianceDeadline?: Date;
  sourceUrl: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
}

/**
 * Policy generation options
 */
export interface GenerationOptions {
  format: OutputFormat;
  includeTableOfContents: boolean;
  includeVersionHistory: boolean;
  includeLastUpdated: boolean;
  minify: boolean;
  embedStyles: boolean;
  reactComponentName?: string;
}

/**
 * Changelog entry
 */
export interface ChangelogEntry {
  version: string;
  date: Date;
  region: RegionCode;
  policyType: PolicyType;
  changes: {
    type: 'added' | 'changed' | 'removed' | 'fixed';
    description: string;
  }[];
  regulatoryReference?: string;
}
