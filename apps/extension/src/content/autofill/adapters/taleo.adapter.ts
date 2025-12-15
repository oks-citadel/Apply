/**
 * Taleo ATS Adapter
 * Handles Taleo's legacy multi-step application system
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class TaleoAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'Taleo',
      platform: 'taleo',
      version: '1.0.0',
      features: {
        multiPage: true,
        dynamicForms: false,
        fileUpload: true,
        customQuestions: true,
        profileImport: false,
        autoSave: true,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      '#requisitionDescriptionInterface',
      'form[name="taleoForm"]',
      '.requisitionPage',
      '[class*="taleo"]',
    ];
  }

  public isValidForm(): boolean {
    const hasTaleoElements = document.querySelector('[class*="taleo"]') !== null;
    const hasTaleoUrl = /taleo\.net|tbe\.taleo\.net/i.test(window.location.href);

    return hasTaleoElements || hasTaleoUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'firstName',
        selectors: [
          'input[name*="firstName"]',
          'input[id*="firstName"]',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          'input[name*="lastName"]',
          'input[id*="lastName"]',
        ],
        getValue: (resume) => resume.personalInfo.lastName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[name*="email"]',
          'input[type="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[name*="phone"]',
          'input[name*="mobile"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'address',
        selectors: [
          'input[name*="address"]',
          'input[name*="street"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.street,
      },
      {
        fieldType: 'city',
        selectors: [
          'input[name*="city"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.city,
      },
      {
        fieldType: 'state',
        selectors: [
          'select[name*="state"]',
          'input[name*="state"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.state,
      },
      {
        fieldType: 'zipCode',
        selectors: [
          'input[name*="zip"]',
          'input[name*="postal"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.zipCode,
      },
      {
        fieldType: 'country',
        selectors: [
          'select[name*="country"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.country,
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[type="file"][name*="resume"]',
          'input[type="file"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
    ];
  }

  protected async initialize(): Promise<void> {
    // Wait for Taleo's page to load
    await this.delay(1000);
  }
}
