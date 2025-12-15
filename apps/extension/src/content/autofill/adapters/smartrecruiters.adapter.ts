/**
 * SmartRecruiters ATS Adapter
 * Handles SmartRecruiters modern application forms
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class SmartRecruitersAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'SmartRecruiters',
      platform: 'smartrecruiters',
      version: '1.0.0',
      features: {
        multiPage: true,
        dynamicForms: true,
        fileUpload: true,
        customQuestions: true,
        profileImport: true,
        autoSave: true,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      '.application-form',
      'form[data-test-id="application-form"]',
      '[class*="smartrecruiters"]',
    ];
  }

  public isValidForm(): boolean {
    const hasSmartRecruitersElements =
      document.querySelector('[data-test-id*="application"]') !== null;
    const hasSmartRecruitersUrl =
      /smartrecruiters\.com/i.test(window.location.href);

    return hasSmartRecruitersElements || hasSmartRecruitersUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'firstName',
        selectors: [
          'input[data-test-id="first-name"]',
          'input[name*="firstName"]',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          'input[data-test-id="last-name"]',
          'input[name*="lastName"]',
        ],
        getValue: (resume) => resume.personalInfo.lastName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[data-test-id="email"]',
          'input[type="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[data-test-id="phone"]',
          'input[type="tel"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'location',
        selectors: [
          'input[data-test-id="location"]',
          'input[name*="location"]',
        ],
        getValue: (resume) => {
          const addr = resume.personalInfo.address;
          if (addr) {
            return addr.full || `${addr.city}, ${addr.state}`;
          }
          return '';
        },
      },
      {
        fieldType: 'linkedin',
        selectors: [
          'input[data-test-id="linkedin"]',
          'input[placeholder*="linkedin"]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[data-test-id="resume-upload"]',
          'input[type="file"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'coverLetter',
        selectors: [
          'textarea[data-test-id="cover-letter"]',
          'textarea[name*="coverLetter"]',
        ],
        getValue: (resume) => resume.summary,
      },
    ];
  }

  protected async initialize(): Promise<void> {
    await this.waitForElement('[data-test-id*="application"]', {
      timeout: 5000
    });
    await this.delay(300);
  }
}
