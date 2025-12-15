/**
 * LinkedIn Jobs Adapter
 * Handles LinkedIn's Easy Apply and standard application forms
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class LinkedInAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'LinkedIn',
      platform: 'linkedin',
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
      'form.jobs-easy-apply-modal',
      '.jobs-easy-apply-content',
      '[data-test-modal-id="easy-apply-modal"]',
    ];
  }

  public isValidForm(): boolean {
    const hasLinkedInForm =
      document.querySelector('.jobs-easy-apply-modal') !== null;
    const hasLinkedInUrl = /linkedin\.com\/jobs/i.test(window.location.href);

    return hasLinkedInForm || hasLinkedInUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'phone',
        selectors: [
          'input[id*="phone"]',
          'input[type="tel"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'email',
        selectors: [
          'input[id*="email"]',
          'input[type="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'resume',
        selectors: [
          'input[type="file"][id*="resume"]',
          'input[type="file"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },
      {
        fieldType: 'coverLetter',
        selectors: [
          'textarea[id*="cover-letter"]',
          'textarea[name*="coverLetter"]',
        ],
        getValue: (resume) => resume.summary,
      },
      {
        fieldType: 'location',
        selectors: [
          'input[id*="location"]',
          'input[placeholder*="location"]',
        ],
        getValue: (resume) => {
          const addr = resume.personalInfo.address;
          if (addr) {
            return addr.full || `${addr.city}, ${addr.state}`;
          }
          return '';
        },
      },
    ];
  }

  protected async initialize(): Promise<void> {
    // Wait for Easy Apply modal to load
    await this.waitForElement('.jobs-easy-apply-modal', {
      timeout: 5000
    });
    await this.delay(500);
  }

  /**
   * Handle LinkedIn's multi-step Easy Apply flow
   */
  protected async fillFields(fields: any[]): Promise<any[]> {
    const allFilledFields: any[] = [];

    // Fill current step
    const filledFields = await super.fillFields(fields);
    allFilledFields.push(...filledFields);

    // Look for "Next" button to handle multi-step forms
    const nextButton = document.querySelector<HTMLButtonElement>(
      'button[aria-label*="Continue"], button[aria-label*="Next"]'
    );

    if (nextButton && !nextButton.disabled) {
      nextButton.click();
      await this.delay(1000);

      // Detect new fields on next step
      const newFields = await this.detectFields();
      if (newFields.length > 0) {
        const newFilledFields = await this.fillFields(newFields);
        allFilledFields.push(...newFilledFields);
      }
    }

    return allFilledFields;
  }

  /**
   * Handle LinkedIn's custom dropdowns
   */
  protected async fillSelect(element: HTMLSelectElement, value: string): Promise<void> {
    // LinkedIn uses custom dropdowns, try to find the actual select
    const container = element.closest('[class*="dropdown"]');

    if (container) {
      const trigger = container.querySelector<HTMLElement>('button, [role="button"]');
      if (trigger) {
        trigger.click();
        await this.delay(300);

        // Find and click option
        const options = document.querySelectorAll('[role="option"]');
        for (const option of Array.from(options)) {
          const text = option.textContent?.toLowerCase() || '';
          if (text.includes(value.toLowerCase())) {
            (option as HTMLElement).click();
            await this.delay(200);
            return;
          }
        }
      }
    }

    // Fallback to standard select handling
    await super.fillSelect(element, value);
  }
}
