/* ============================================
   REGION CONFIGURATIONS

   Comprehensive configuration for each supported
   region including regulatory requirements,
   data protection authorities, and required policies.
   ============================================ */

import { RegionCode, RegionConfig, PolicyType } from './types';

/**
 * Complete region configurations
 */
export const REGION_CONFIGS: Record<RegionCode, RegionConfig> = {
  GLOBAL: {
    code: 'GLOBAL',
    name: 'Global (Default)',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    regulations: [],
    requiredPolicies: ['privacy', 'terms', 'cookies'],
  },

  US: {
    code: 'US',
    name: 'United States',
    language: 'en-US',
    timezone: 'America/New_York',
    currency: 'USD',
    regulations: ['FTC Act', 'CAN-SPAM', 'COPPA'],
    dataProtectionAuthority: {
      name: 'Federal Trade Commission (FTC)',
      website: 'https://www.ftc.gov',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
  },

  US_CA: {
    code: 'US_CA',
    name: 'California, USA',
    language: 'en-US',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    regulations: ['CCPA', 'CPRA', 'CalOPPA'],
    dataProtectionAuthority: {
      name: 'California Privacy Protection Agency (CPPA)',
      website: 'https://cppa.ca.gov',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ccpa_notice', 'do_not_sell', 'ai_transparency'],
    additionalRequirements: [
      'Right to know categories of personal information collected',
      'Right to delete personal information',
      'Right to opt-out of sale/sharing',
      'Right to correct inaccurate information',
      'Right to limit use of sensitive personal information',
      'Non-discrimination for exercising rights',
    ],
  },

  US_WA: {
    code: 'US_WA',
    name: 'Washington, USA',
    language: 'en-US',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    regulations: ['My Health My Data Act', 'Washington Privacy Act'],
    dataProtectionAuthority: {
      name: 'Washington State Attorney General',
      website: 'https://www.atg.wa.gov',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'health_data', 'ai_transparency'],
    additionalRequirements: [
      'Specific consent for health data collection',
      'Right to withdraw consent for health data',
      'Prohibition on geofencing near healthcare facilities',
      'Health data deletion requirements',
    ],
  },

  US_VA: {
    code: 'US_VA',
    name: 'Virginia, USA',
    language: 'en-US',
    timezone: 'America/New_York',
    currency: 'USD',
    regulations: ['VCDPA'],
    dataProtectionAuthority: {
      name: 'Virginia Office of the Attorney General',
      website: 'https://www.oag.state.va.us',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
  },

  US_CO: {
    code: 'US_CO',
    name: 'Colorado, USA',
    language: 'en-US',
    timezone: 'America/Denver',
    currency: 'USD',
    regulations: ['CPA'],
    dataProtectionAuthority: {
      name: 'Colorado Attorney General',
      website: 'https://coag.gov',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
  },

  US_CT: {
    code: 'US_CT',
    name: 'Connecticut, USA',
    language: 'en-US',
    timezone: 'America/New_York',
    currency: 'USD',
    regulations: ['CTDPA'],
    dataProtectionAuthority: {
      name: 'Connecticut Attorney General',
      website: 'https://portal.ct.gov/AG',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
  },

  UK: {
    code: 'UK',
    name: 'United Kingdom',
    language: 'en-GB',
    timezone: 'Europe/London',
    currency: 'GBP',
    regulations: ['UK GDPR', 'Data Protection Act 2018', 'PECR', 'Modern Slavery Act 2015'],
    dataProtectionAuthority: {
      name: "Information Commissioner's Office (ICO)",
      website: 'https://ico.org.uk',
      email: 'casework@ico.org.uk',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'dpa', 'modern_slavery', 'ai_transparency', 'accessibility'],
    additionalRequirements: [
      'Lawful basis for processing',
      'Data Protection Impact Assessments for high-risk processing',
      'Data Protection Officer appointment (if applicable)',
      'International transfer safeguards',
      'Modern Slavery Statement (if turnover > £36m)',
    ],
  },

  EU: {
    code: 'EU',
    name: 'European Union',
    language: 'en',
    timezone: 'Europe/Brussels',
    currency: 'EUR',
    regulations: ['GDPR', 'ePrivacy Directive', 'EU AI Act'],
    dataProtectionAuthority: {
      name: 'European Data Protection Board (EDPB)',
      website: 'https://edpb.europa.eu',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'dpa', 'ai_transparency', 'accessibility'],
    additionalRequirements: [
      'Article 13/14 information requirements',
      'Lawful basis documentation',
      'Records of processing activities',
      'Data Protection Impact Assessments',
      'International transfer mechanisms (SCCs, adequacy)',
      'Cookie consent (opt-in)',
      'AI Act compliance for high-risk AI systems',
    ],
  },

  CA: {
    code: 'CA',
    name: 'Canada',
    language: 'en-CA',
    timezone: 'America/Toronto',
    currency: 'CAD',
    regulations: ['PIPEDA', 'CASL', 'Provincial privacy laws'],
    dataProtectionAuthority: {
      name: 'Office of the Privacy Commissioner of Canada',
      website: 'https://www.priv.gc.ca',
      email: 'info@priv.gc.ca',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Meaningful consent requirement',
      'Accountability principle',
      'Breach notification to OPC',
      'CASL compliance for commercial electronic messages',
    ],
  },

  AU: {
    code: 'AU',
    name: 'Australia',
    language: 'en-AU',
    timezone: 'Australia/Sydney',
    currency: 'AUD',
    regulations: ['Privacy Act 1988', 'Australian Privacy Principles (APPs)', 'Spam Act 2003'],
    dataProtectionAuthority: {
      name: "Office of the Australian Information Commissioner (OAIC)",
      website: 'https://www.oaic.gov.au',
      email: 'enquiries@oaic.gov.au',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      '13 Australian Privacy Principles compliance',
      'Notifiable Data Breaches scheme',
      'Cross-border disclosure requirements',
    ],
  },

  NG: {
    code: 'NG',
    name: 'Nigeria',
    language: 'en-NG',
    timezone: 'Africa/Lagos',
    currency: 'NGN',
    regulations: ['NDPR', 'NDPR Implementation Framework'],
    dataProtectionAuthority: {
      name: 'Nigeria Data Protection Commission (NDPC)',
      website: 'https://ndpc.gov.ng',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'dpa', 'ai_transparency'],
    additionalRequirements: [
      'Data Protection Impact Assessment for high-risk processing',
      'Data Protection Officer appointment',
      'Annual audit filing with NDPC',
      'Consent requirements',
      'Local data storage considerations',
    ],
  },

  BR: {
    code: 'BR',
    name: 'Brazil',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    currency: 'BRL',
    regulations: ['LGPD'],
    dataProtectionAuthority: {
      name: 'Autoridade Nacional de Proteção de Dados (ANPD)',
      website: 'https://www.gov.br/anpd',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'dpa', 'ai_transparency'],
    additionalRequirements: [
      'Ten legal bases for processing',
      'Data Protection Officer (Encarregado)',
      'International transfer mechanisms',
      'Data subject rights similar to GDPR',
    ],
  },

  MX: {
    code: 'MX',
    name: 'Mexico',
    language: 'es-MX',
    timezone: 'America/Mexico_City',
    currency: 'MXN',
    regulations: ['LFPDPPP'],
    dataProtectionAuthority: {
      name: 'Instituto Nacional de Transparencia (INAI)',
      website: 'https://home.inai.org.mx',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Privacy notice (Aviso de Privacidad)',
      'ARCO rights (Access, Rectification, Cancellation, Opposition)',
      'Consent requirements',
    ],
  },

  SG: {
    code: 'SG',
    name: 'Singapore',
    language: 'en-SG',
    timezone: 'Asia/Singapore',
    currency: 'SGD',
    regulations: ['PDPA'],
    dataProtectionAuthority: {
      name: 'Personal Data Protection Commission (PDPC)',
      website: 'https://www.pdpc.gov.sg',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'dpa', 'ai_transparency'],
    additionalRequirements: [
      'Data Protection Officer appointment',
      'Do Not Call Registry compliance',
      'Breach notification to PDPC',
      'Cross-border transfer restrictions',
    ],
  },

  JP: {
    code: 'JP',
    name: 'Japan',
    language: 'ja',
    timezone: 'Asia/Tokyo',
    currency: 'JPY',
    regulations: ['APPI'],
    dataProtectionAuthority: {
      name: 'Personal Information Protection Commission (PPC)',
      website: 'https://www.ppc.go.jp',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Purpose of use specification and notification',
      'Consent for sensitive personal information',
      'Third-party provision records',
      'Cross-border transfer restrictions',
    ],
  },

  KR: {
    code: 'KR',
    name: 'South Korea',
    language: 'ko',
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    regulations: ['PIPA'],
    dataProtectionAuthority: {
      name: 'Personal Information Protection Commission (PIPC)',
      website: 'https://www.pipc.go.kr',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Strict consent requirements',
      'Data localization for certain data',
      'Chief Privacy Officer appointment',
      'Privacy impact assessment',
    ],
  },

  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    language: 'en',
    timezone: 'Asia/Dubai',
    currency: 'AED',
    regulations: ['Federal Decree-Law No. 45/2021 (PDPL)', 'DIFC Data Protection Law', 'ADGM Data Protection Regulations'],
    dataProtectionAuthority: {
      name: 'UAE Data Office',
      website: 'https://u.ae',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Lawful basis for processing',
      'Data subject rights',
      'Cross-border transfer restrictions',
      'Data Protection Officer (for certain controllers)',
    ],
  },

  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    language: 'ar',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    regulations: ['PDPL'],
    dataProtectionAuthority: {
      name: 'Saudi Data and AI Authority (SDAIA)',
      website: 'https://sdaia.gov.sa',
    },
    requiredPolicies: ['privacy', 'terms', 'cookies', 'ai_transparency'],
    additionalRequirements: [
      'Consent requirements',
      'Data localization requirements',
      'Data Protection Officer',
      'Cross-border transfer restrictions',
    ],
  },
};

/**
 * Get region configuration by code
 */
export function getRegionConfig(code: RegionCode): RegionConfig {
  return REGION_CONFIGS[code] || REGION_CONFIGS.GLOBAL;
}

/**
 * Get all regions requiring a specific policy type
 */
export function getRegionsRequiringPolicy(policyType: PolicyType): RegionCode[] {
  return Object.values(REGION_CONFIGS)
    .filter((config) => config.requiredPolicies.includes(policyType))
    .map((config) => config.code);
}

/**
 * Get required policies for a region
 */
export function getRequiredPolicies(regionCode: RegionCode): PolicyType[] {
  const config = getRegionConfig(regionCode);
  return config.requiredPolicies;
}

/**
 * Check if a policy is required for a region
 */
export function isPolicyRequired(regionCode: RegionCode, policyType: PolicyType): boolean {
  const config = getRegionConfig(regionCode);
  return config.requiredPolicies.includes(policyType);
}

/**
 * Get all supported regions
 */
export function getAllRegions(): RegionCode[] {
  return Object.keys(REGION_CONFIGS) as RegionCode[];
}

/**
 * Get regions by regulation
 */
export function getRegionsByRegulation(regulation: string): RegionCode[] {
  return Object.values(REGION_CONFIGS)
    .filter((config) => config.regulations.some(r => r.toLowerCase().includes(regulation.toLowerCase())))
    .map((config) => config.code);
}
