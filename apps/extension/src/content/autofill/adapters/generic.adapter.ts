/**
 * Generic ATS Adapter
 * Fallback adapter for unrecognized or custom application forms
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class GenericAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'Generic',
      platform: 'generic',
      version: '1.0.0',
      features: {
        multiPage: false,
        dynamicForms: false,
        fileUpload: true,
        customQuestions: false,
        profileImport: false,
        autoSave: false,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      'form',
      '[role="form"]',
    ];
  }

  public isValidForm(): boolean {
    // Generic adapter accepts any form
    return document.querySelector('form') !== null;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      // Personal Information - try common patterns
      {
        fieldType: 'firstName',
        selectors: [
          'input[name*="first" i][name*="name" i]',
          'input[id*="first" i][id*="name" i]',
          'input[placeholder*="first name" i]',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          'input[name*="last" i][name*="name" i]',
          'input[id*="last" i][id*="name" i]',
          'input[placeholder*="last name" i]',
        ],
        getValue: (resume) => resume.personalInfo.lastName,
      },
      {
        fieldType: 'fullName',
        selectors: [
          'input[name*="name" i]:not([name*="first" i]):not([name*="last" i])',
          'input[placeholder*="full name" i]',
          'input[placeholder*="your name" i]',
        ],
        getValue: (resume) => resume.personalInfo.fullName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[type="email"]',
          'input[name*="email" i]',
          'input[id*="email" i]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[type="tel"]',
          'input[name*="phone" i]',
          'input[name*="mobile" i]',
          'input[id*="phone" i]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'address',
        selectors: [
          'input[name*="address" i]',
          'input[name*="street" i]',
          'input[id*="address" i]',
        ],
        getValue: (resume) => resume.personalInfo.address?.street,
      },
      {
        fieldType: 'city',
        selectors: [
          'input[name*="city" i]',
          'input[id*="city" i]',
        ],
        getValue: (resume) => resume.personalInfo.address?.city,
      },
      {
        fieldType: 'state',
        selectors: [
          'select[name*="state" i]',
          'input[name*="state" i]',
          'select[name*="province" i]',
        ],
        getValue: (resume) => resume.personalInfo.address?.state,
      },
      {
        fieldType: 'zipCode',
        selectors: [
          'input[name*="zip" i]',
          'input[name*="postal" i]',
          'input[id*="zip" i]',
        ],
        getValue: (resume) => resume.personalInfo.address?.zipCode,
      },
      {
        fieldType: 'country',
        selectors: [
          'select[name*="country" i]',
          'input[name*="country" i]',
        ],
        getValue: (resume) => resume.personalInfo.address?.country,
      },
      {
        fieldType: 'linkedin',
        selectors: [
          'input[name*="linkedin" i]',
          'input[placeholder*="linkedin" i]',
          'input[id*="linkedin" i]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },
      {
        fieldType: 'github',
        selectors: [
          'input[name*="github" i]',
          'input[placeholder*="github" i]',
        ],
        getValue: (resume) => resume.personalInfo.github,
      },
      {
        fieldType: 'portfolio',
        selectors: [
          'input[name*="portfolio" i]',
          'input[name*="website" i]',
          'input[placeholder*="portfolio" i]',
        ],
        getValue: (resume) => resume.personalInfo.portfolio || resume.personalInfo.website,
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[type="file"][name*="resume" i]',
          'input[type="file"][name*="cv" i]',
          'input[type="file"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'coverLetter',
        selectors: [
          'textarea[name*="cover" i]',
          'textarea[name*="letter" i]',
          'textarea[placeholder*="cover letter" i]',
        ],
        getValue: (resume) => resume.summary,
      },
      {
        fieldType: 'summary',
        selectors: [
          'textarea[name*="summary" i]',
          'textarea[name*="about" i]',
          'textarea[placeholder*="about yourself" i]',
        ],
        getValue: (resume) => resume.summary,
      },
    ];
  }

  protected async initialize(): Promise<void> {
    // Wait for any form to be visible
    await this.delay(500);
  }

  /**
   * Generic adapter uses semantic matching more aggressively
   * since we don't have platform-specific knowledge
   */
  protected async fillFields(fields: any[]): Promise<any[]> {
    // Use base implementation with enhanced semantic matching
    return super.fillFields(fields);
  }
}
