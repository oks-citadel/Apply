/**
 * Form submission handler
 * Validates and submits application forms
 */

import { FormField, FormSubmissionResult, FieldValidationResult } from './types';

export class FormSubmitter {
  /**
   * Validate form before submission
   */
  public validateForm(fields: FormField[]): FormField[] {
    const missingRequired: FormField[] = [];

    for (const field of fields) {
      if (field.required) {
        const result = this.validateField(field);
        if (!result.valid) {
          missingRequired.push(field);
        }
      }
    }

    return missingRequired;
  }

  /**
   * Validate a single field
   */
  public validateField(field: FormField): FieldValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if field has value
    const value = this.getFieldValue(field.element);
    if (!value || value.trim() === '') {
      if (field.required) {
        errors.push(`${field.label} is required`);
      } else {
        warnings.push(`${field.label} is empty`);
      }
      return { valid: false, errors, warnings };
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push(`${field.label} is not a valid email address`);
        }
        break;

      case 'phone':
        if (!this.isValidPhone(value)) {
          warnings.push(`${field.label} may not be a valid phone number`);
        }
        break;

      case 'url':
        if (!this.isValidUrl(value)) {
          warnings.push(`${field.label} may not be a valid URL`);
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          errors.push(`${field.label} is not a valid date`);
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get field value
   */
  private getFieldValue(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox') {
        return element.checked ? 'true' : '';
      }
      if (element.type === 'radio') {
        return element.checked ? element.value : '';
      }
    }

    return element.value;
  }

  /**
   * Highlight missing required fields
   */
  public highlightMissingFields(fields: FormField[]): void {
    fields.forEach((field) => {
      const element = field.element;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add visual highlight
      element.style.border = '2px solid #f87171';
      element.style.transition = 'border 0.3s ease';

      // Add error message if not present
      this.addErrorMessage(element, `${field.label} is required`);

      // Focus first missing field
      if (fields.indexOf(field) === 0) {
        element.focus();
      }
    });
  }

  /**
   * Add error message below field
   */
  private addErrorMessage(element: HTMLElement, message: string): void {
    // Check if error message already exists
    const existingError = element.parentElement?.querySelector('.autofill-error-message');
    if (existingError) {
      return;
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'autofill-error-message';
    errorDiv.style.cssText = `
      color: #f87171;
      font-size: 12px;
      margin-top: 4px;
      display: block;
    `;
    errorDiv.textContent = message;

    element.parentElement?.insertBefore(errorDiv, element.nextSibling);
  }

  /**
   * Submit the form
   */
  public async submitForm(): Promise<FormSubmissionResult> {
    try {
      // Find submit button
      const submitButton = this.findSubmitButton();

      if (!submitButton) {
        throw new Error('Submit button not found');
      }

      // Take screenshot before submission
      const screenshot = await this.captureScreenshot();

      // Click submit button
      submitButton.click();

      // Wait for submission to complete
      const result = await this.waitForSubmissionComplete();

      return {
        success: true,
        confirmationNumber: result.confirmationNumber,
        confirmationUrl: result.url,
        screenshot,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        timestamp: new Date(),
        errors: [error.message],
      };
    }
  }

  /**
   * Find submit button
   */
  private findSubmitButton(): HTMLButtonElement | HTMLInputElement | null {
    // Try common submit button selectors
    const selectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button.submit',
      'button[class*="submit"]',
      'button:contains("Submit")',
      'button:contains("Apply")',
      'button:contains("Send")',
      'a[class*="submit"]',
    ];

    for (const selector of selectors) {
      const button = document.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
      if (button && this.isVisible(button)) {
        return button;
      }
    }

    // Try to find by text content
    const buttons = document.querySelectorAll<HTMLButtonElement>('button');
    for (const button of Array.from(buttons)) {
      const text = button.textContent?.toLowerCase() || '';
      if (
        (text.includes('submit') ||
          text.includes('apply') ||
          text.includes('send application')) &&
        this.isVisible(button)
      ) {
        return button;
      }
    }

    return null;
  }

  /**
   * Check if element is visible
   */
  private isVisible(element: HTMLElement): boolean {
    return element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  /**
   * Wait for submission to complete
   */
  private async waitForSubmissionComplete(timeout: number = 10000): Promise<{
    confirmationNumber?: string;
    url: string;
  }> {
    const startTime = Date.now();
    const initialUrl = window.location.href;

    while (Date.now() - startTime < timeout) {
      // Check for URL change
      if (window.location.href !== initialUrl) {
        // Extract confirmation number from URL or page
        const confirmationNumber = this.extractConfirmationNumber();
        return {
          confirmationNumber,
          url: window.location.href,
        };
      }

      // Check for confirmation message on page
      const confirmationElement = this.findConfirmationMessage();
      if (confirmationElement) {
        const confirmationNumber = this.extractConfirmationNumber();
        return {
          confirmationNumber,
          url: window.location.href,
        };
      }

      // Check for success indicator
      const successIndicator = document.querySelector(
        '.success, .confirmation, [class*="success"], [class*="confirmation"]'
      );
      if (successIndicator) {
        const confirmationNumber = this.extractConfirmationNumber();
        return {
          confirmationNumber,
          url: window.location.href,
        };
      }

      await this.delay(500);
    }

    throw new Error('Submission timeout - unable to confirm submission');
  }

  /**
   * Find confirmation message
   */
  private findConfirmationMessage(): Element | null {
    const selectors = [
      '.confirmation',
      '.success-message',
      '[class*="confirmation"]',
      '[class*="success"]',
      '[role="alert"]',
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        const text = element.textContent.toLowerCase();
        if (
          text.includes('success') ||
          text.includes('submitted') ||
          text.includes('received') ||
          text.includes('thank you')
        ) {
          return element;
        }
      }
    }

    return null;
  }

  /**
   * Extract confirmation number from page
   */
  private extractConfirmationNumber(): string | undefined {
    // Look for confirmation number patterns
    const patterns = [
      /confirmation\s*(?:number|code|id)[\s:]*([A-Z0-9-]+)/i,
      /application\s*(?:number|code|id)[\s:]*([A-Z0-9-]+)/i,
      /reference\s*(?:number|code|id)[\s:]*([A-Z0-9-]+)/i,
      /tracking\s*(?:number|code|id)[\s:]*([A-Z0-9-]+)/i,
    ];

    const pageText = document.body.textContent || '';

    for (const pattern of patterns) {
      const match = pageText.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    // Check URL for confirmation parameter
    const urlParams = new URLSearchParams(window.location.search);
    return (
      urlParams.get('confirmation') ||
      urlParams.get('id') ||
      urlParams.get('ref') ||
      undefined
    );
  }

  /**
   * Capture screenshot of confirmation
   */
  private async captureScreenshot(): Promise<string | undefined> {
    try {
      // This would typically use chrome.tabs.captureVisibleTab
      // For now, return undefined as it requires background script
      return undefined;
    } catch (error) {
      console.warn('Failed to capture screenshot:', error);
      return undefined;
    }
  }

  /**
   * Validation helpers
   */
  private isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(date: string): boolean {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
