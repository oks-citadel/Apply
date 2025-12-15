/**
 * Workday ATS Adapter
 * Handles Workday's multi-page application flow with dynamic form loading
 */

import { BaseAdapter } from '../base-adapter';
import {
  AdapterMetadata,
  FieldMapping,
  ResumeData,
  AutofillConfig,
} from '../types';

export class WorkdayAdapter extends BaseAdapter {
  private currentPage: number = 0;
  private totalPages: number = 0;

  constructor(config?: AutofillConfig) {
    super(config);
  }

  public getMetadata(): AdapterMetadata {
    return {
      name: 'Workday',
      platform: 'workday',
      version: '1.0.0',
      features: {
        multiPage: true,
        dynamicForms: true,
        fileUpload: true,
        customQuestions: true,
        profileImport: false,
        autoSave: true,
      },
    };
  }

  public getFormSelectors(): string[] {
    return [
      '[data-automation-id="formContainer"]',
      '[data-automation-id="jobApplication"]',
      'form[name="job-application"]',
      '.css-job-application-form',
    ];
  }

  public isValidForm(): boolean {
    // Check for Workday-specific elements
    const hasWorkdayElements = document.querySelector('[data-automation-id]') !== null;
    const hasWorkdayUrl = /myworkdayjobs\.com|workday\.com/i.test(window.location.href);

    return hasWorkdayElements || hasWorkdayUrl;
  }

  protected async initialize(): Promise<void> {
    // Wait for Workday's dynamic loading
    await this.waitForWorkdayLoad();

    // Detect total pages
    this.detectPageCount();
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      // Personal Information
      {
        fieldType: 'firstName',
        selectors: [
          '[data-automation-id="legalNameSection_firstName"]',
          'input[name*="firstName"]',
          'input[name*="first_name"]',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          '[data-automation-id="legalNameSection_lastName"]',
          'input[name*="lastName"]',
          'input[name*="last_name"]',
        ],
        getValue: (resume) => resume.personalInfo.lastName,
      },
      {
        fieldType: 'email',
        selectors: [
          '[data-automation-id="email"]',
          'input[type="email"]',
          'input[name*="email"]',
        ],
        getValue: (resume) => resume.personalInfo.email,
      },
      {
        fieldType: 'phone',
        selectors: [
          '[data-automation-id="phone-number"]',
          '[data-automation-id="phoneNumber"]',
          'input[type="tel"]',
          'input[name*="phone"]',
        ],
        getValue: (resume) => resume.personalInfo.phone,
      },
      {
        fieldType: 'address',
        selectors: [
          '[data-automation-id="addressSection_addressLine1"]',
          'input[name*="address"]',
          'input[name*="street"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.street,
      },
      {
        fieldType: 'city',
        selectors: [
          '[data-automation-id="addressSection_city"]',
          'input[name*="city"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.city,
      },
      {
        fieldType: 'state',
        selectors: [
          '[data-automation-id="addressSection_state"]',
          'select[name*="state"]',
          'input[name*="state"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.state,
      },
      {
        fieldType: 'zipCode',
        selectors: [
          '[data-automation-id="addressSection_postalCode"]',
          'input[name*="zip"]',
          'input[name*="postal"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.zipCode,
      },
      {
        fieldType: 'country',
        selectors: [
          '[data-automation-id="addressSection_countryRegion"]',
          'select[name*="country"]',
        ],
        getValue: (resume) => resume.personalInfo.address?.country,
      },
      {
        fieldType: 'linkedin',
        selectors: [
          '[data-automation-id="linkedIn"]',
          'input[name*="linkedin"]',
        ],
        getValue: (resume) => resume.personalInfo.linkedin,
      },

      // Resume Upload
      {
        fieldType: 'resume',
        selectors: [
          '[data-automation-id="file-upload-input-ref"]',
          'input[type="file"][data-automation-id*="resume"]',
        ],
        getValue: (resume) => resume.resumeUrl || '',
      },

      // Work Experience
      {
        fieldType: 'currentCompany',
        selectors: [
          '[data-automation-id="organizationName"]',
          'input[name*="company"]',
        ],
        getValue: (resume) => resume.experience[0]?.company,
      },
      {
        fieldType: 'currentTitle',
        selectors: [
          '[data-automation-id="jobTitle"]',
          'input[name*="title"]',
          'input[name*="position"]',
        ],
        getValue: (resume) => resume.experience[0]?.position,
      },

      // Education
      {
        fieldType: 'university',
        selectors: [
          '[data-automation-id="school"]',
          'input[name*="school"]',
          'input[name*="university"]',
        ],
        getValue: (resume) => resume.education[0]?.institution,
      },
      {
        fieldType: 'degree',
        selectors: [
          '[data-automation-id="degree"]',
          'select[name*="degree"]',
        ],
        getValue: (resume) => resume.education[0]?.degree,
      },
      {
        fieldType: 'fieldOfStudy',
        selectors: [
          '[data-automation-id="fieldOfStudy"]',
          'input[name*="major"]',
          'input[name*="field"]',
        ],
        getValue: (resume) => resume.education[0]?.field,
      },
    ];
  }

  /**
   * Wait for Workday's application to fully load
   */
  private async waitForWorkdayLoad(): Promise<void> {
    // Wait for main application container
    await this.waitForElement('[data-automation-id="formContainer"]', {
      timeout: 15000,
    });

    // Wait for any loading spinners to disappear
    const maxWait = 10000;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const spinner = document.querySelector('[data-automation-id="loadingSpinner"]');
      if (!spinner || spinner.getAttribute('aria-hidden') === 'true') {
        break;
      }
      await this.delay(200);
    }

    // Extra delay for any animations
    await this.delay(500);
  }

  /**
   * Detect number of pages in application
   */
  private detectPageCount(): void {
    // Look for page indicator
    const pageIndicator = document.querySelector('[data-automation-id="pageIndicator"]');
    if (pageIndicator) {
      const text = pageIndicator.textContent || '';
      const match = text.match(/of\s+(\d+)/i);
      if (match) {
        this.totalPages = parseInt(match[1], 10);
      }
    }

    // Look for step indicators
    const steps = document.querySelectorAll('[role="tab"]');
    if (steps.length > 0) {
      this.totalPages = steps.length;
    }
  }

  /**
   * Navigate to next page
   */
  private async navigateToNextPage(): Promise<boolean> {
    // Find "Next" button
    const nextButton = document.querySelector<HTMLButtonElement>(
      '[data-automation-id="bottom-navigation-next-button"], ' +
      'button[aria-label*="Next"], ' +
      'button:contains("Next")'
    );

    if (!nextButton) {
      return false;
    }

    // Check if button is disabled
    if (nextButton.disabled || nextButton.getAttribute('aria-disabled') === 'true') {
      return false;
    }

    // Click next button
    nextButton.click();
    this.currentPage++;

    // Wait for page transition
    await this.waitForWorkdayLoad();

    return true;
  }

  /**
   * Handle multi-page flow
   */
  protected async fillFields(fields: any[]): Promise<any[]> {
    const allFilledFields: any[] = [];

    // Fill current page
    const filledFields = await super.fillFields(fields);
    allFilledFields.push(...filledFields);

    // Check for additional pages
    while (this.currentPage < this.totalPages) {
      const hasNextPage = await this.navigateToNextPage();

      if (!hasNextPage) {
        break;
      }

      // Detect fields on new page
      const newFields = await this.detectFields();

      // Fill new page fields
      const newFilledFields = await super.fillFields(newFields);
      allFilledFields.push(...newFilledFields);
    }

    return allFilledFields;
  }

  /**
   * Handle Workday's custom dropdowns
   */
  protected async fillSelect(element: HTMLSelectElement, value: string): Promise<void> {
    // Workday uses custom dropdowns that look like selects but are actually divs
    const parent = element.closest('[data-automation-id*="dropdown"]');

    if (parent) {
      await this.fillWorkdayDropdown(parent as HTMLElement, value);
    } else {
      await super.fillSelect(element, value);
    }
  }

  /**
   * Fill Workday custom dropdown
   */
  private async fillWorkdayDropdown(container: HTMLElement, value: string): Promise<void> {
    // Click to open dropdown
    const trigger = container.querySelector('[role="combobox"], button');
    if (trigger instanceof HTMLElement) {
      trigger.click();
      await this.delay(300);

      // Wait for options to appear
      const listbox = document.querySelector('[role="listbox"]');
      if (listbox) {
        const options = listbox.querySelectorAll('[role="option"]');

        for (const option of Array.from(options)) {
          const text = option.textContent?.toLowerCase() || '';
          if (text.includes(value.toLowerCase())) {
            (option as HTMLElement).click();
            await this.delay(200);
            return;
          }
        }
      }

      // Close dropdown if no match found
      trigger.click();
    }
  }

  /**
   * Handle work experience section
   */
  private async fillWorkExperience(resume: ResumeData): Promise<void> {
    const experienceSection = document.querySelector('[data-automation-id="workExperienceSection"]');

    if (!experienceSection) {
      return;
    }

    for (let i = 0; i < Math.min(resume.experience.length, 3); i++) {
      const experience = resume.experience[i];

      // Click "Add" button if not first entry
      if (i > 0) {
        const addButton = experienceSection.querySelector<HTMLButtonElement>(
          '[data-automation-id="Add"]'
        );
        if (addButton) {
          addButton.click();
          await this.delay(500);
        }
      }

      // Fill experience fields
      const fields = [
        { selector: '[data-automation-id="organizationName"]', value: experience.company },
        { selector: '[data-automation-id="jobTitle"]', value: experience.position },
        { selector: '[data-automation-id="startDate"]', value: experience.startDate.toISOString().split('T')[0] },
      ];

      if (!experience.current && experience.endDate) {
        fields.push({
          selector: '[data-automation-id="endDate"]',
          value: experience.endDate.toISOString().split('T')[0],
        });
      }

      for (const field of fields) {
        const input = experienceSection.querySelector<HTMLInputElement>(field.selector);
        if (input) {
          await this.fillTextInput(input, field.value);
        }
      }
    }
  }

  /**
   * Handle education section
   */
  private async fillEducation(resume: ResumeData): Promise<void> {
    const educationSection = document.querySelector('[data-automation-id="educationSection"]');

    if (!educationSection || !resume.education || resume.education.length === 0) {
      return;
    }

    const education = resume.education[0];

    const fields = [
      { selector: '[data-automation-id="school"]', value: education.institution },
      { selector: '[data-automation-id="degree"]', value: education.degree },
      { selector: '[data-automation-id="fieldOfStudy"]', value: education.field },
    ];

    if (education.endDate) {
      fields.push({
        selector: '[data-automation-id="graduationDate"]',
        value: education.endDate.toISOString().split('T')[0],
      });
    }

    for (const field of fields) {
      const input = educationSection.querySelector<HTMLInputElement>(field.selector);
      if (input) {
        if (input.tagName === 'SELECT') {
          await this.fillSelect(input as unknown as HTMLSelectElement, field.value);
        } else {
          await this.fillTextInput(input, field.value);
        }
      }
    }
  }

  /**
   * Override autofill to handle Workday-specific sections
   */
  public async autofill(resumeData: ResumeData): Promise<any> {
    // Call base autofill
    const result = await super.autofill(resumeData);

    // Handle additional Workday-specific sections
    try {
      await this.fillWorkExperience(resumeData);
      await this.fillEducation(resumeData);
    } catch (error) {
      console.warn('Error filling Workday-specific sections:', error);
    }

    return result;
  }
}
