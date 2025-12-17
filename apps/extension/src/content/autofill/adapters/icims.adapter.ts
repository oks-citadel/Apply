/**
 * iCIMS ATS Adapter
 * Handles iCIMS multi-step wizard and account creation
 */

import { BaseAdapter } from '../base-adapter';
import { AdapterMetadata, FieldMapping } from '../types';

export class IcimsAdapter extends BaseAdapter {
  public getMetadata(): AdapterMetadata {
    return {
      name: 'iCIMS',
      platform: 'icims',
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
      '.iCIMS_MainTable',
      'form[name="frmApplication"]',
      '[class*="icims"]',
    ];
  }

  public isValidForm(): boolean {
    const hasIcimsElements = document.querySelector('.iCIMS') !== null;
    const hasIcimsUrl = /icims\.com/i.test(window.location.href);

    return hasIcimsElements || hasIcimsUrl;
  }

  public getFieldMappings(): FieldMapping[] {
    return [
      {
        fieldType: 'firstName',
        selectors: [
          'input[name*="firstname"]',
          'input[id*="firstname"]',
        ],
        getValue: (resume) => resume.personalInfo.firstName,
      },
      {
        fieldType: 'lastName',
        selectors: [
          'input[name*="lastname"]',
          'input[id*="lastname"]',
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
          'input[name*="address1"]',
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
    ];
  }

  protected async initialize(): Promise<void> {
    // Wait for iCIMS page to load
    await this.delay(1000);

    // Check if account creation is required
    await this.handleAccountCreation();
  }

  /**
   * Handle account creation if required
   */
  private async handleAccountCreation(): Promise<void> {
    const createAccountForm = document.querySelector('[name="frmCreateAccount"]');

    if (!createAccountForm) {
      return;
    }

    // Fill account creation fields
    const usernameField = document.querySelector<HTMLInputElement>('input[name*="username"]');
    const passwordField = document.querySelector<HTMLInputElement>('input[name*="password"]');
    const confirmPasswordField = document.querySelector<HTMLInputElement>('input[name*="confirm"]');

    if (usernameField && passwordField && confirmPasswordField) {
      // Generate username from email
      const username = this.resumeData.personalInfo.email;
      const password = this.generateSecurePassword();

      usernameField.value = username;
      passwordField.value = password;
      confirmPasswordField.value = password;

      this.triggerEvents(usernameField);
      this.triggerEvents(passwordField);
      this.triggerEvents(confirmPasswordField);

      // Store credentials for user reference
      console.log('Account credentials:', { username, password });

      await this.delay(300);
    }
  }

  /**
   * Generate secure password
   */
  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }


  /**
   * Handle multi-step wizard navigation
   */
  protected async fillFields(fields: any[]): Promise<any[]> {
    const allFilledFields: any[] = [];

    // Fill current step
    const filledFields = await super.fillFields(fields);
    allFilledFields.push(...filledFields);

    // Look for "Next" or "Continue" button
    let hasNextStep = true;

    while (hasNextStep) {
      const nextButton = document.querySelector<HTMLButtonElement>(
        'input[value="Next"], button:contains("Next"), input[value="Continue"], button:contains("Continue")'
      );

      if (!nextButton || nextButton.disabled) {
        hasNextStep = false;
        break;
      }

      // Click next
      nextButton.click();
      await this.delay(1000);

      // Detect new fields
      const newFields = await this.detectFields();

      if (newFields.length === 0) {
        hasNextStep = false;
        break;
      }

      // Fill new fields
      const newFilledFields = await super.fillFields(newFields);
      allFilledFields.push(...newFilledFields);
    }

    return allFilledFields;
  }

  /**
   * Handle iCIMS specific date fields
   */
  protected async fillField(field: any, value: string): Promise<void> {
    // iCIMS sometimes uses separate fields for date parts
    if (field.name?.includes('date') && value) {
      const container = field.element.closest('[class*="date"]');

      if (container) {
        const monthField = container.querySelector('select[name*="month"]') as HTMLSelectElement | null;
        const dayField = container.querySelector('input[name*="day"]') as HTMLInputElement | null;
        const yearField = container.querySelector('input[name*="year"]') as HTMLInputElement | null;

        if (monthField && dayField && yearField) {
          const date = new Date(value);
          monthField.value = (date.getMonth() + 1).toString();
          dayField.value = date.getDate().toString();
          yearField.value = date.getFullYear().toString();

          this.triggerEvents(monthField);
          this.triggerEvents(dayField);
          this.triggerEvents(yearField);

          return;
        }
      }
    }

    await super.fillField(field, value);
  }
}
