import { Injectable, Logger } from '@nestjs/common';

import { BaseATSAdapter } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { Page } from 'playwright';

interface LinkedInJobData {
  jobId: string;
  companyName: string;
  jobTitle: string;
  isEasyApply: boolean;
  applicationUrl?: string;
}

@Injectable()
export class LinkedInAdapter extends BaseATSAdapter {
  protected readonly platformName = 'LinkedIn';
  protected readonly logger = new Logger(LinkedInAdapter.name);

  private readonly SELECTORS = {
    // Login selectors
    loginEmail: '#username',
    loginPassword: '#password',
    loginButton: 'button[type="submit"]',

    // Job page selectors
    easyApplyButton: 'button.jobs-apply-button',
    easyApplyBadge: '.jobs-apply-button--top-card',
    jobTitle: '.job-details-jobs-unified-top-card__job-title',
    companyName: '.job-details-jobs-unified-top-card__company-name',

    // Application modal selectors
    applicationModal: '.jobs-easy-apply-modal',
    nextButton: 'button[aria-label="Continue to next step"]',
    reviewButton: 'button[aria-label="Review your application"]',
    submitButton: 'button[aria-label="Submit application"]',
    closeButton: 'button[aria-label="Dismiss"]',

    // Form field selectors
    phoneInput: 'input[id*="phone"]',
    emailInput: 'input[id*="email"]',
    resumeUpload: 'input[type="file"]',
    textAreaField: 'textarea',
    dropdownField: 'select',
    radioButton: 'input[type="radio"]',
    checkbox: 'input[type="checkbox"]',

    // Question selectors
    questionLabel: 'label.fb-form-element-label',
    questionRequired: '.fb-form-element-label--is-required',

    // Success/Error indicators
    successMessage: '.artdeco-inline-feedback--success',
    errorMessage: '.artdeco-inline-feedback--error',
    applicationSent: '.jpac-modal-header',
  };

  constructor(
    protected readonly browserService: BrowserService,
    protected readonly formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('linkedin.com/jobs') || url.includes('linkedin.com/in/');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    const page = await this.browserService.getPage();
    let screenshotPath: string | null = null;

    try {
      this.logger.log(`Starting LinkedIn Easy Apply for: ${data.jobUrl}`);

      // Navigate to job posting
      await this.navigateToJob(page, data.jobUrl);

      // Check if it's an Easy Apply job
      const isEasyApply = await this.isEasyApplyJob(page);
      if (!isEasyApply) {
        return {
          success: false,
          error: 'Not an Easy Apply job - requires external application',
          requiresManualIntervention: true,
        };
      }

      // Check for login requirement
      const needsLogin = await this.checkLoginRequired(page);
      if (needsLogin) {
        return {
          success: false,
          error: 'LinkedIn login required',
          requiresManualIntervention: true,
        };
      }

      // Click Easy Apply button
      await this.clickEasyApply(page);

      // Wait for modal to open
      await page.waitForSelector(this.SELECTORS.applicationModal, { timeout: 10000 });

      // Process all application steps
      let stepCount = 0;
      const maxSteps = 10;

      while (stepCount < maxSteps) {
        stepCount++;
        this.logger.log(`Processing application step ${stepCount}`);

        // Check for CAPTCHA
        const hasCaptcha = await this.checkForCaptcha(page);
        if (hasCaptcha) {
          screenshotPath = await this.takeScreenshot(page, data.userId, 'linkedin-captcha');
          return {
            success: false,
            screenshotPath,
            error: 'CAPTCHA detected',
            captchaDetected: true,
            requiresManualIntervention: true,
          };
        }

        // Fill current step's form fields
        await this.fillCurrentStep(page, data);

        // Check if we're on the review/submit step
        const submitButton = await page.$(this.SELECTORS.submitButton);
        if (submitButton) {
          this.logger.log('Reached submit step');
          await this.browserService.humanLikeDelay(1000, 2000);
          await submitButton.click();
          break;
        }

        // Check for review button
        const reviewButton = await page.$(this.SELECTORS.reviewButton);
        if (reviewButton) {
          await reviewButton.click();
          await this.browserService.humanLikeDelay(1500, 2500);
          continue;
        }

        // Click next button
        const nextButton = await page.$(this.SELECTORS.nextButton);
        if (nextButton) {
          await nextButton.click();
          await this.browserService.humanLikeDelay(1500, 2500);
          continue;
        }

        // No navigation buttons found - might be stuck
        this.logger.warn('No navigation buttons found');
        break;
      }

      // Wait for success confirmation
      await this.browserService.humanLikeDelay(2000, 3000);

      // Check for success
      const success = await this.checkApplicationSuccess(page);
      screenshotPath = await this.takeScreenshot(page, data.userId, 'linkedin-complete');

      // Close modal
      await this.closeApplicationModal(page);

      // Extract application ID if available
      const applicationId = await this.extractApplicationId(page);

      return {
        success,
        applicationId: applicationId || `linkedin-${Date.now()}`,
        screenshotPath,
        error: success ? undefined : 'Application may not have been submitted successfully',
      };

    } catch (error) {
      this.logger.error(`LinkedIn Easy Apply failed: ${error.message}`);
      screenshotPath = await this.takeScreenshot(page, data.userId, 'linkedin-error');

      return {
        success: false,
        screenshotPath,
        error: error.message,
      };
    }
  }

  private async isEasyApplyJob(page: Page): Promise<boolean> {
    try {
      const easyApplyButton = await page.$(this.SELECTORS.easyApplyButton);
      const buttonText = await easyApplyButton?.textContent();
      return buttonText?.toLowerCase().includes('easy apply') || false;
    } catch {
      return false;
    }
  }

  private async checkLoginRequired(page: Page): Promise<boolean> {
    try {
      const loginForm = await page.$('#username');
      return !!loginForm;
    } catch {
      return false;
    }
  }

  private async clickEasyApply(page: Page): Promise<void> {
    const easyApplyButton = await page.waitForSelector(this.SELECTORS.easyApplyButton, {
      timeout: 5000,
    });
    await this.browserService.humanLikeDelay(500, 1000);
    await easyApplyButton?.click();
  }

  private async fillCurrentStep(page: Page, data: ApplicationData): Promise<void> {
    await this.browserService.humanLikeDelay(1000, 2000);

    // Handle phone number field
    const phoneInput = await page.$(this.SELECTORS.phoneInput);
    if (phoneInput) {
      const currentValue = await phoneInput.inputValue();
      if (!currentValue) {
        await this.fillTextField(page, this.SELECTORS.phoneInput, data.personalInfo.phone);
      }
    }

    // Handle email field
    const emailInput = await page.$(this.SELECTORS.emailInput);
    if (emailInput) {
      const currentValue = await emailInput.inputValue();
      if (!currentValue) {
        await this.fillTextField(page, this.SELECTORS.emailInput, data.personalInfo.email);
      }
    }

    // Handle resume upload
    const resumeInput = await page.$(this.SELECTORS.resumeUpload);
    if (resumeInput && data.resumePath) {
      await this.uploadFile(page, this.SELECTORS.resumeUpload, data.resumePath);
    }

    // Handle dropdown questions
    const dropdowns = await page.$$(this.SELECTORS.dropdownField);
    for (const dropdown of dropdowns) {
      await this.handleDropdown(page, dropdown, data);
    }

    // Handle text questions
    const textAreas = await page.$$(this.SELECTORS.textAreaField);
    for (const textArea of textAreas) {
      await this.handleTextQuestion(page, textArea, data);
    }

    // Handle radio buttons
    const radioGroups = await this.getRadioGroups(page);
    for (const group of radioGroups) {
      await this.handleRadioGroup(page, group, data);
    }

    // Handle checkboxes
    await this.handleCheckboxes(page, data);
  }

  private async handleDropdown(
    page: Page,
    dropdown: any,
    data: ApplicationData,
  ): Promise<void> {
    try {
      const label = await this.getFieldLabel(page, dropdown);
      if (!label) {return;}

      // Get available options
      const options = await dropdown.$$eval('option', (opts: HTMLOptionElement[]) =>
        opts.map(o => ({ value: o.value, text: o.textContent?.trim() || '' }))
      );

      // Determine best answer based on question
      const answer = await this.formMappingService.generateAIAnswer(label, data);

      // Find matching option
      const matchingOption = options.find(
        o => o.text.toLowerCase().includes(answer.toLowerCase()) ||
             answer.toLowerCase().includes(o.text.toLowerCase())
      );

      if (matchingOption) {
        await dropdown.selectOption(matchingOption.value);
        await this.browserService.humanLikeDelay(500, 1000);
      }
    } catch (error) {
      this.logger.warn(`Error handling dropdown: ${error.message}`);
    }
  }

  private async handleTextQuestion(
    page: Page,
    textArea: any,
    data: ApplicationData,
  ): Promise<void> {
    try {
      const currentValue = await textArea.inputValue();
      if (currentValue) {return;} // Already filled

      const label = await this.getFieldLabel(page, textArea);
      if (!label) {return;}

      const answer = await this.formMappingService.generateAIAnswer(label, data);
      await textArea.fill(answer);
      await this.browserService.humanLikeDelay(500, 1000);
    } catch (error) {
      this.logger.warn(`Error handling text question: ${error.message}`);
    }
  }

  private async handleRadioGroup(
    page: Page,
    groupSelector: string,
    data: ApplicationData,
  ): Promise<void> {
    try {
      const radios = await page.$$(groupSelector);
      if (radios.length === 0) {return;}

      const label = await this.getFieldLabel(page, radios[0]);
      if (!label) {return;}

      const answer = await this.formMappingService.generateAIAnswer(label, data);

      // Find best matching radio option
      for (const radio of radios) {
        const radioLabel = await radio.evaluate((el: HTMLInputElement) => {
          const parent = el.closest('.fb-form-element');
          return parent?.querySelector('label')?.textContent?.trim() || '';
        });

        if (
          radioLabel.toLowerCase().includes(answer.toLowerCase()) ||
          (answer.toLowerCase() === 'yes' && radioLabel.toLowerCase().includes('yes')) ||
          (answer.toLowerCase() === 'no' && radioLabel.toLowerCase().includes('no'))
        ) {
          await radio.click();
          await this.browserService.humanLikeDelay(300, 600);
          break;
        }
      }
    } catch (error) {
      this.logger.warn(`Error handling radio group: ${error.message}`);
    }
  }

  private async handleCheckboxes(page: Page, data: ApplicationData): Promise<void> {
    try {
      const checkboxes = await page.$$(this.SELECTORS.checkbox);

      for (const checkbox of checkboxes) {
        const isChecked = await checkbox.isChecked();
        if (isChecked) {continue;}

        const label = await this.getFieldLabel(page, checkbox);
        if (!label) {continue;}

        // Check agreement/terms checkboxes automatically
        const lowerLabel = label.toLowerCase();
        if (
          lowerLabel.includes('agree') ||
          lowerLabel.includes('consent') ||
          lowerLabel.includes('terms') ||
          lowerLabel.includes('privacy')
        ) {
          await checkbox.check();
          await this.browserService.humanLikeDelay(300, 500);
        }
      }
    } catch (error) {
      this.logger.warn(`Error handling checkboxes: ${error.message}`);
    }
  }

  private async getRadioGroups(page: Page): Promise<string[]> {
    try {
      const radioNames = await page.$$eval(
        'input[type="radio"]',
        (radios: HTMLInputElement[]) => {
          const names = new Set(radios.map(r => r.name).filter(Boolean));
          return Array.from(names);
        },
      );
      return radioNames.map(name => `input[type="radio"][name="${name}"]`);
    } catch {
      return [];
    }
  }

  private async getFieldLabel(page: Page, element: any): Promise<string | null> {
    try {
      // Try to find associated label
      const id = await element.getAttribute('id');
      if (id) {
        const label = await page.$(`label[for="${id}"]`);
        if (label) {
          return await label.textContent();
        }
      }

      // Try to find parent form element label
      const parentLabel = await element.evaluate((el: HTMLElement) => {
        const parent = el.closest('.fb-form-element, .jobs-easy-apply-form-section');
        const label = parent?.querySelector('label, .fb-form-element-label');
        return label?.textContent?.trim() || null;
      });

      return parentLabel;
    } catch {
      return null;
    }
  }

  private async checkApplicationSuccess(page: Page): Promise<boolean> {
    try {
      // Check for success message
      const successIndicators = [
        '.artdeco-inline-feedback--success',
        '[data-test-modal-id="post-apply-modal"]',
        'h2:has-text("Application sent")',
        'h2:has-text("Your application was sent")',
      ];

      for (const selector of successIndicators) {
        const element = await page.$(selector);
        if (element) {
          return true;
        }
      }

      // Check page content for success indicators
      const pageContent = await page.content();
      const successPhrases = [
        'application sent',
        'application submitted',
        'successfully applied',
        'thank you for applying',
      ];

      for (const phrase of successPhrases) {
        if (pageContent.toLowerCase().includes(phrase)) {
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private async closeApplicationModal(page: Page): Promise<void> {
    try {
      const closeButton = await page.$(this.SELECTORS.closeButton);
      if (closeButton) {
        await closeButton.click();
        await this.browserService.humanLikeDelay(500, 1000);
      }
    } catch (error) {
      this.logger.warn(`Error closing modal: ${error.message}`);
    }
  }

  /**
   * Extract job information from a LinkedIn job posting
   */
  async extractJobInfo(page: Page): Promise<LinkedInJobData | null> {
    try {
      const jobId = await page.evaluate(() => {
        const url = window.location.href;
        const match = url.match(/view\/(\d+)/);
        return match ? match[1] : null;
      });

      const jobTitle = await page.$eval(
        this.SELECTORS.jobTitle,
        el => el.textContent?.trim() || ''
      );

      const companyName = await page.$eval(
        this.SELECTORS.companyName,
        el => el.textContent?.trim() || ''
      );

      const isEasyApply = await this.isEasyApplyJob(page);

      return {
        jobId: jobId || '',
        jobTitle,
        companyName,
        isEasyApply,
      };
    } catch (error) {
      this.logger.error(`Error extracting job info: ${error.message}`);
      return null;
    }
  }
}
