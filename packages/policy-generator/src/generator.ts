/* ============================================
   POLICY GENERATOR CORE

   Main generator class that orchestrates
   policy generation across all regions and types.
   ============================================ */

import {
  PolicyType,
  RegionCode,
  PolicyVariables,
  GenerationOptions,
} from './types';
import { getRegionConfig, REGION_CONFIGS } from './regions';
import { compileTemplate } from './templates';
import { format } from 'date-fns';

/**
 * Default company variables for ApplyForUs
 */
export const DEFAULT_COMPANY_VARIABLES: Partial<PolicyVariables> = {
  companyName: 'ApplyForUs',
  companyLegalName: 'ApplyForUs Inc.',
  companyAddress: '123 Innovation Drive, Suite 500, San Francisco, CA 94105, USA',
  companyCountry: 'United States',
  companyWebsite: 'https://applyforus.com',
  companyEmail: 'hello@applyforus.com',
  supportEmail: 'support@applyforus.com',
  privacyEmail: 'privacy@applyforus.com',
  dpoEmail: 'dpo@applyforus.com',
  dmcaEmail: 'dmca@applyforus.com',
  legalEmail: 'legal@applyforus.com',
  phone: '1-800-APPLY-US',

  hasAI: true,
  hasPayments: true,
  hasSubscriptions: true,
  hasAutoApply: true,
  hasAnalytics: true,
  hasThirdPartyIntegrations: true,

  dataCategories: [
    'Contact information (name, email, phone)',
    'Professional information (work history, education, skills)',
    'Resume and cover letter content',
    'Job preferences and search criteria',
    'Application history and status',
    'Account credentials',
    'Payment information (processed by third-party providers)',
  ],

  sensitiveDataCategories: [
    'Precise geolocation (with consent)',
    'Account login credentials',
  ],

  processingPurposes: [
    'Providing and improving our job application automation services',
    'Creating and optimizing your resume and cover letters',
    'Matching you with relevant job opportunities',
    'Submitting job applications on your behalf',
    'Communicating with you about your account and applications',
    'Processing payments and managing subscriptions',
    'Analyzing usage to improve our AI models',
    'Ensuring platform security and preventing fraud',
    'Complying with legal obligations',
  ],

  dataRetentionPeriods: {
    'Account data': 'Duration of account plus 30 days after deletion',
    'Application history': '3 years or until account deletion',
    'Payment records': '7 years (legal requirement)',
    'Analytics data': '2 years (anonymized)',
    'Support tickets': '3 years',
  },

  thirdPartyRecipients: [
    'Employers (when you apply for jobs)',
    'Job boards and platforms (for job matching)',
    'Cloud service providers (hosting and storage)',
    'Payment processors (Stripe, Paystack, Flutterwave)',
    'Analytics providers (Mixpanel)',
    'Email service providers (SendGrid)',
    'AI/ML providers (for content generation)',
  ],

  subProcessors: [
    { name: 'Microsoft Azure', purpose: 'Cloud hosting infrastructure', location: 'EU/US (configurable)' },
    { name: 'OpenAI', purpose: 'AI model processing', location: 'United States' },
    { name: 'Stripe', purpose: 'Payment processing', location: 'United States' },
    { name: 'Paystack', purpose: 'Payment processing (Africa)', location: 'Nigeria' },
    { name: 'Flutterwave', purpose: 'Payment processing (Africa)', location: 'United States' },
    { name: 'SendGrid', purpose: 'Email delivery', location: 'United States' },
    { name: 'Mixpanel', purpose: 'Product analytics', location: 'United States' },
  ],
};

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  format: 'markdown',
  includeTableOfContents: true,
  includeVersionHistory: false,
  includeLastUpdated: true,
  minify: false,
  embedStyles: false,
};

/**
 * Policy Generator Class
 */
export class PolicyGenerator {
  private variables: PolicyVariables;
  private options: GenerationOptions;
  private generatedPolicies: Map<string, string> = new Map();

  constructor(
    variables?: Partial<PolicyVariables>,
    options?: Partial<GenerationOptions>
  ) {
    const now = new Date();
    this.variables = {
      ...DEFAULT_COMPANY_VARIABLES,
      effectiveDate: format(now, 'MMMM d, yyyy'),
      lastUpdated: format(now, 'MMMM d, yyyy'),
      currentYear: now.getFullYear(),
      region: 'GLOBAL',
      regionName: 'Global',
      ...variables,
    } as PolicyVariables;

    this.options = {
      ...DEFAULT_GENERATION_OPTIONS,
      ...options,
    };
  }

  /**
   * Generate a single policy for a specific region
   */
  generatePolicy(policyType: PolicyType, regionCode: RegionCode): string {
    const regionConfig = getRegionConfig(regionCode);

    // Prepare region-specific variables
    const regionVariables: PolicyVariables = {
      ...this.variables,
      region: regionCode,
      regionName: regionConfig.name,
      dataProtectionAuthorityName: regionConfig.dataProtectionAuthority?.name,
      dataProtectionAuthorityUrl: regionConfig.dataProtectionAuthority?.website,
      regulationName: regionConfig.regulations[0],
    };

    // Compile the template
    const content = compileTemplate(policyType, regionVariables);

    // Post-process based on format
    const formatted = this.formatOutput(content);

    // Cache the result
    const cacheKey = `${policyType}_${regionCode}`;
    this.generatedPolicies.set(cacheKey, formatted);

    return formatted;
  }

  /**
   * Generate all policies for a specific region
   */
  generateAllPoliciesForRegion(regionCode: RegionCode): Map<PolicyType, string> {
    const regionConfig = getRegionConfig(regionCode);
    const results = new Map<PolicyType, string>();

    for (const policyType of regionConfig.requiredPolicies) {
      try {
        const content = this.generatePolicy(policyType, regionCode);
        results.set(policyType, content);
      } catch (error) {
        console.warn(`Failed to generate ${policyType} for ${regionCode}:`, error);
      }
    }

    return results;
  }

  /**
   * Generate a specific policy for all regions that require it
   */
  generatePolicyForAllRegions(policyType: PolicyType): Map<RegionCode, string> {
    const results = new Map<RegionCode, string>();

    for (const [regionCode, config] of Object.entries(REGION_CONFIGS)) {
      if (config.requiredPolicies.includes(policyType)) {
        try {
          const content = this.generatePolicy(policyType, regionCode as RegionCode);
          results.set(regionCode as RegionCode, content);
        } catch (error) {
          console.warn(`Failed to generate ${policyType} for ${regionCode}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Generate all policies for all regions
   */
  generateAllPolicies(): Map<string, string> {
    const results = new Map<string, string>();

    for (const [regionCode, config] of Object.entries(REGION_CONFIGS)) {
      for (const policyType of config.requiredPolicies) {
        try {
          const content = this.generatePolicy(policyType, regionCode as RegionCode);
          const key = `${regionCode}/${policyType}`;
          results.set(key, content);
        } catch (error) {
          console.warn(`Failed to generate ${policyType} for ${regionCode}:`, error);
        }
      }
    }

    return results;
  }

  /**
   * Format output based on options
   */
  private formatOutput(content: string): string {
    let output = content.trim();

    // Add table of contents if requested
    if (this.options.includeTableOfContents) {
      output = this.addTableOfContents(output);
    }

    // Convert format if needed
    switch (this.options.format) {
      case 'html':
        output = this.convertToHtml(output);
        break;
      case 'json':
        output = this.convertToJson(output);
        break;
      case 'react':
        output = this.convertToReactComponent(output);
        break;
      case 'markdown':
      default:
        // Already in markdown format
        break;
    }

    // Minify if requested
    if (this.options.minify) {
      output = this.minifyOutput(output);
    }

    return output;
  }

  /**
   * Add table of contents to markdown
   */
  private addTableOfContents(content: string): string {
    const headings: { level: number; text: string; slug: string }[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
        headings.push({ level, text, slug });
      }
    }

    if (headings.length === 0) return content;

    let toc = '## Table of Contents\n\n';
    for (const heading of headings) {
      if (heading.level <= 3) {
        const indent = '  '.repeat(heading.level - 1);
        toc += `${indent}- [${heading.text}](#${heading.slug})\n`;
      }
    }

    // Insert after the first heading
    const firstHeadingIndex = lines.findIndex(line => line.match(/^#\s+/));
    if (firstHeadingIndex !== -1) {
      lines.splice(firstHeadingIndex + 1, 0, '', toc);
    }

    return lines.join('\n');
  }

  /**
   * Convert markdown to HTML
   */
  private convertToHtml(markdown: string): string {
    // Basic markdown to HTML conversion
    let html = markdown
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // Wrap in basic HTML structure
    if (this.options.embedStyles) {
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Policy Document</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    h1, h2, h3 { margin-top: 2rem; }
    p { line-height: 1.6; }
    ul { padding-left: 2rem; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
<p>${html}</p>
</body>
</html>`;
    }

    return html;
  }

  /**
   * Convert to JSON format
   */
  private convertToJson(markdown: string): string {
    const sections: { title: string; content: string }[] = [];
    const lines = markdown.split('\n');
    let currentSection: { title: string; content: string[] } | null = null;

    for (const line of lines) {
      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        if (currentSection) {
          sections.push({
            title: currentSection.title,
            content: currentSection.content.join('\n').trim(),
          });
        }
        currentSection = { title: headingMatch[2], content: [] };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      sections.push({
        title: currentSection.title,
        content: currentSection.content.join('\n').trim(),
      });
    }

    return JSON.stringify({ sections }, null, 2);
  }

  /**
   * Convert to React component
   */
  private convertToReactComponent(markdown: string): string {
    const componentName = this.options.reactComponentName || 'PolicyDocument';
    const html = this.convertToHtml(markdown);

    return `import React from 'react';

export function ${componentName}() {
  return (
    <div className="policy-document">
      ${html}
    </div>
  );
}

export default ${componentName};
`;
  }

  /**
   * Minify output
   */
  private minifyOutput(content: string): string {
    return content
      .replace(/\n\s*\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Get cached policy
   */
  getCachedPolicy(policyType: PolicyType, regionCode: RegionCode): string | undefined {
    const cacheKey = `${policyType}_${regionCode}`;
    return this.generatedPolicies.get(cacheKey);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.generatedPolicies.clear();
  }

  /**
   * Update variables
   */
  updateVariables(variables: Partial<PolicyVariables>): void {
    this.variables = {
      ...this.variables,
      ...variables,
    };
    this.clearCache();
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<GenerationOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
    this.clearCache();
  }

  /**
   * Get current variables
   */
  getVariables(): PolicyVariables {
    return { ...this.variables };
  }

  /**
   * Get current options
   */
  getOptions(): GenerationOptions {
    return { ...this.options };
  }

  /**
   * Export all generated policies to files (for use with file system)
   */
  exportPolicies(): Array<{ path: string; content: string }> {
    const exports: Array<{ path: string; content: string }> = [];

    for (const [key, content] of this.generatedPolicies.entries()) {
      const [region, policyType] = key.split('_');
      const extension = this.getFileExtension();
      const path = `policies/${region}/${policyType}.${extension}`;
      exports.push({ path, content });
    }

    return exports;
  }

  /**
   * Get file extension for current format
   */
  private getFileExtension(): string {
    switch (this.options.format) {
      case 'html': return 'html';
      case 'json': return 'json';
      case 'react': return 'tsx';
      case 'markdown':
      default: return 'md';
    }
  }
}

/**
 * Create a new policy generator instance
 */
export function createPolicyGenerator(
  variables?: Partial<PolicyVariables>,
  options?: Partial<GenerationOptions>
): PolicyGenerator {
  return new PolicyGenerator(variables, options);
}
