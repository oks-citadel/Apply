/**
 * Indeed Jobs Adapter
 * Handles Indeed's standard and quick apply forms
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class IndeedAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'Indeed',
      platform: 'indeed',
      version: '1.0.0',
      features: {
        multiPage: false,
        dynamicForms: true,
        fileUpload: true,
        customQuestions: true,
        profileImport: true,
        autoSave: false,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      'form[id*="apply"]',
      '.ia-BasePage-content form',
      '[data-testid="application-form"]',
    ];
  }

  public isValidForm(): boolean {
    const hasIndeedForm =
      document.querySelector('[data-testid*="application"]') !== null ||
      document.querySelector('.ia-BasePage') !== null;
    const hasIndeedUrl = /indeed\.com/i.test(window.location.href);

    return hasIndeedForm || hasIndeedUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'fullName',
        selectors: [
          'input[name="applicant.name"]',
          'input[id*="name"]',
        ],
        getValue: (resume) => resume.personalInfo.fullName,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[name="applicant.emailAddress"]',
          'input[type="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          'input[name="applicant.phoneNumber"]',
          'input[type="tel"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'location',
        selectors: [
          'input[name="applicant.location"]',
          'input[id*="location"]',
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
        fieldType: 'resume',
        selectors: [
          'input[type="file"][id*="resume"]',
          'input[name*="resume"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'coverLetter',
        selectors: [
          'textarea[name="coverletter"]',
          'textarea[id*="cover"]',
        ],
        getValue: (resume) => resume.summary,
      },
      {
        fieldType: 'linkedin',
        selectors: [
          'input[name*="linkedin"]',
          'input[placeholder*="linkedin"]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },
    ];
  }

  protected async initialize(): Promise<void> {
    await this.waitForElement('.ia-BasePage-content, [data-testid="application-form"]', {
      timeout: 5000
    });
    await this.delay(300);
  }

  /**
   * Handle Indeed's resume upload options
   */
  protected async handleFileUploads(): Promise<void> {
    // Indeed has both file upload and resume selection from Indeed profile
    const fileInput = document.querySelector<HTMLInputElement>(
      'input[type="file"]'
    );
    const resumeSelector = document.querySelector<HTMLSelectElement>(
      'select[name*="resume"]'
    );

    if (resumeSelector) {
      // Try to select an existing Indeed resume first
      const options = Array.from(resumeSelector.options);
      if (options.length > 1) {
        // Select first non-empty option
        resumeSelector.selectedIndex = 1;
        this.triggerEvents(resumeSelector);
        return;
      }
    }

    // Fall back to file upload
    if (fileInput && this.resumeData.resumeFile) {
      try {
        await this.fileUploader.handleFileUpload(
          fileInput,
          this.resumeData.resumeFile
        );
      } catch (error) {
        console.warn('File upload failed:', error);
      }
    }
  }
}
