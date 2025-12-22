import { Injectable, Logger } from '@nestjs/common';

import { BaseATSAdapter } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { Page } from 'playwright';

interface IndeedJobData {
  jobId: string;
  companyName: string;
  jobTitle: string;
  isIndeedApply: boolean;
  applicationUrl?: string;
}

@Injectable()
export class IndeedAdapter extends BaseATSAdapter {
  protected readonly platformName = 'Indeed';
  protected readonly logger = new Logger(IndeedAdapter.name);

  private readonly SELECTORS = {
    // Login selectors
    loginEmail: '#ifl-InputFormField-3',
    loginPassword: '#ifl-InputFormField-5',
    loginButton: 'button[type="submit"]',
    continueButton: '#emailform button[type="submit"]',

    // Job page selectors
    applyButton: 'button.jobsearch-IndeedApplyButton-newDesign',
    applyButtonAlt: '#indeedApplyButton',
    applyButtonLegacy: '.indeed-apply-button',
    jobTitle: '.jobsearch-JobInfoHeader-title',
    companyName: '[data-company-name="true"]',

    // Application iframe/modal selectors
    applyModal: '#indeed-ia-modal',
    applyIframe: '#indeed-ia-1',

    // Form field selectors (inside iframe)
    phoneInput: 'input[id*="phone"], input[name*="phone"]',
    emailInput: 'input[id*="email"], input[name*="email"]',
    nameInput: 'input[id*="name"], input[name*="name"]',
    resumeUpload: 'input[type="file"]',
    resumeSelect: '.ia-Resume-select',
    textField: 'input[type="text"]',
    textAreaField: 'textarea',
    dropdownField: 'select',
    radioButton: 'input[type="radio"]',
    checkbox: 'input[type="checkbox"]',

    // Navigation buttons
    continueBtn: 'button[id*="continue"], button:has-text("Continue")',
    submitBtn: 'button[id*="submit"], button:has-text("Submit")',
    nextBtn: 'button:has-text("Next")',
    applyNowBtn: 'button:has-text("Apply now")',

    // Question selectors
    questionLabel: '.ia-Questions-item label, .ia-BasePage-heading',
    requiredField: '.required, [aria-required="true"]',

    // Success/Error indicators
    successMessage: '.ia-PostApply-header, .ia-PostApply-content',
    errorMessage: '.ia-InputError, .error-message',
    applicationComplete: '.ia-PostApply',
  };

  constructor(
    protected readonly browserService: BrowserService,
    protected readonly formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('indeed.com') || url.includes('indeedjobs.com');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    const page = await this.browserService.getPage();
    let screenshotPath: string | null = null;

    try {
      this.logger.log(`Starting Indeed Apply for: ${data.jobUrl}`);

      // Navigate to job posting
      await this.navigateToJob(page, data.jobUrl);

      // Check if it's an Indeed Apply job
      const isIndeedApply = await this.isIndeedApplyJob(page);
      if (!isIndeedApply) {
        return {
          success: false,
          error: 'Not an Indeed Apply job - requires external application',
          requiresManualIntervention: true,
        };
      }

      // Check for login requirement
      const needsLogin = await this.checkLoginRequired(page);
      if (needsLogin) {
        return {
          success: false,
          error: 'Indeed login required',
          requiresManualIntervention: true,
        };
      }

      // Click Apply button
      await this.clickApplyButton(page);

      // Wait for application modal/iframe
      await this.browserService.humanLikeDelay(2000, 3000);

      // Check if we need to switch to iframe
      const iframe = await this.getApplicationIframe(page);
      const applicationPage = iframe || page;

      // Process all application steps
      let stepCount = 0;
      const maxSteps = 15;

      while (stepCount < maxSteps) {
        stepCount++;
        this.logger.log(`Processing application step ${stepCount}`);

        // Check for CAPTCHA
        const hasCaptcha = await this.checkForCaptcha(applicationPage);
        if (hasCaptcha) {
          screenshotPath = await this.takeScreenshot(page, data.userId, 'indeed-captcha');
          return {
            success: false,
            screenshotPath,
            error: 'CAPTCHA detected',
            captchaDetected: true,
            requiresManualIntervention: true,
          };
        }

        // Check for success state first
        const isComplete = await this.checkApplicationComplete(applicationPage);
        if (isComplete) {
          this.logger.log('Application completed successfully');
          break;
        }

        // Fill current step's form fields
        await this.fillCurrentStep(applicationPage, data);

        // Look for navigation buttons
        const clicked = await this.clickNextButton(applicationPage);
        if (!clicked) {
          // Try submit button
          const submitted = await this.clickSubmitButton(applicationPage);
          if (submitted) {
            this.logger.log('Clicked submit button');
            await this.browserService.humanLikeDelay(2000, 3000);
            break;
          }
          // No buttons found - might be stuck
          this.logger.warn('No navigation buttons found');
          break;
        }

        await this.browserService.humanLikeDelay(1500, 2500);
      }

      // Wait for success confirmation
      await this.browserService.humanLikeDelay(2000, 3000);

      // Check for success
      const success = await this.checkApplicationSuccess(page, iframe);
      screenshotPath = await this.takeScreenshot(page, data.userId, 'indeed-complete');

      // Extract application ID if available
      const applicationId = await this.extractApplicationId(page);

      return {
        success,
        applicationId: applicationId || `indeed-${Date.now()}`,
        screenshotPath,
        error: success ? undefined : 'Application may not have been submitted successfully',
      };

    } catch (error) {
      this.logger.error(`Indeed Apply failed: ${error.message}`);
      screenshotPath = await this.takeScreenshot(page, data.userId, 'indeed-error');

      return {
        success: false,
        screenshotPath,
        error: error.message,
      };
    }
  }

  private async isIndeedApplyJob(page: Page): Promise<boolean> {
    try {
      const applyButton = await page.$(this.SELECTORS.applyButton) ||
        await page.$(this.SELECTORS.applyButtonAlt) ||
        await page.$(this.SELECTORS.applyButtonLegacy);
      return !!applyButton;
    } catch {
      return false;
    }
  }

  private async checkLoginRequired(page: Page): Promise<boolean> {
    try {
      const loginForm = await page.$('#loginForm, #login-email-input');
      return !!loginForm;
    } catch {
      return false;
    }
  }

  private async clickApplyButton(page: Page): Promise<void> {
    const applyButton = await page.$(this.SELECTORS.applyButton) ||
      await page.$(this.SELECTORS.applyButtonAlt) ||
      await page.$(this.SELECTORS.applyButtonLegacy);

    if (applyButton) {
      await this.browserService.humanLikeDelay(500, 1000);
      await applyButton.click();
    } else {
      throw new Error('Apply button not found');
    }
  }

  private async getApplicationIframe(page: Page): Promise<Page | null> {
    try {
      const iframeElement = await page.waitForSelector(this.SELECTORS.applyIframe, { timeout: 5000 });
      if (iframeElement) {
        const frame = await iframeElement.contentFrame();
        return frame as unknown as Page;
      }
    } catch {
      // No iframe, application might be inline
    }
    return null;
  }

  private async fillCurrentStep(page: Page, data: ApplicationData): Promise<void> {
    await this.browserService.humanLikeDelay(1000, 2000);

    // Handle name fields
    await this.fillNameFields(page, data);

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

    // Check for resume selection (Indeed stores resumes)
    const resumeSelect = await page.$(this.SELECTORS.resumeSelect);
    if (resumeSelect) {
      // Click to select first/default resume
      await resumeSelect.click();
      await this.browserService.humanLikeDelay(500, 1000);
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

    // Handle regular text inputs (custom questions)
    const textInputs = await page.$$(this.SELECTORS.textField);
    for (const input of textInputs) {
      await this.handleTextInput(page, input, data);
    }

    // Handle radio buttons
    const radioGroups = await this.getRadioGroups(page);
    for (const group of radioGroups) {
      await this.handleRadioGroup(page, group, data);
    }

    // Handle checkboxes
    await this.handleCheckboxes(page, data);
  }

  private async fillNameFields(page: Page, data: ApplicationData): Promise<void> {
    // First name
    const firstNameInput = await page.$('input[id*="firstName"], input[name*="firstName"]');
    if (firstNameInput) {
      const currentValue = await firstNameInput.inputValue();
      if (!currentValue) {
        await firstNameInput.fill(data.personalInfo.firstName);
        await this.browserService.humanLikeDelay(300, 600);
      }
    }

    // Last name
    const lastNameInput = await page.$('input[id*="lastName"], input[name*="lastName"]');
    if (lastNameInput) {
      const currentValue = await lastNameInput.inputValue();
      if (!currentValue) {
        await lastNameInput.fill(data.personalInfo.lastName);
        await this.browserService.humanLikeDelay(300, 600);
      }
    }

    // Full name (combined field)
    const fullNameInput = await page.$('input[id*="fullName"], input[name*="fullName"]');
    if (fullNameInput) {
      const currentValue = await fullNameInput.inputValue();
      if (!currentValue) {
        await fullNameInput.fill(`${data.personalInfo.firstName} ${data.personalInfo.lastName}`);
        await this.browserService.humanLikeDelay(300, 600);
      }
    }
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
      } else if (options.length > 1) {
        // Select first non-empty option as fallback
        const firstValid = options.find(o => o.value && o.value !== '');
        if (firstValid) {
          await dropdown.selectOption(firstValid.value);
        }
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

  private async handleTextInput(
    page: Page,
    input: any,
    data: ApplicationData,
  ): Promise<void> {
    try {
      // Skip known fields
      const inputId = await input.getAttribute('id') || '';
      const inputName = await input.getAttribute('name') || '';
      const identifier = (inputId + inputName).toLowerCase();

      if (identifier.includes('email') || identifier.includes('phone') ||
          identifier.includes('name') || identifier.includes('search')) {
        return;
      }

      const currentValue = await input.inputValue();
      if (currentValue) {return;}

      const label = await this.getFieldLabel(page, input);
      if (!label) {return;}

      const answer = await this.formMappingService.generateAIAnswer(label, data);
      await input.fill(answer);
      await this.browserService.humanLikeDelay(300, 600);
    } catch (error) {
      this.logger.warn(`Error handling text input: ${error.message}`);
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

      // Check if already selected
      for (const radio of radios) {
        if (await radio.isChecked()) {return;}
      }

      const label = await this.getFieldLabel(page, radios[0]);
      if (!label) {return;}

      const answer = await this.formMappingService.generateAIAnswer(label, data);

      // Find best matching radio option
      for (const radio of radios) {
        const radioLabel = await radio.evaluate((el: HTMLInputElement) => {
          const parent = el.closest('.ia-Questions-item, .form-group');
          const label = parent?.querySelector('label, .radio-label')?.textContent?.trim();
          if (label) {return label;}
          // Try sibling label
          const sibling = el.nextElementSibling;
          return sibling?.textContent?.trim() || '';
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
          lowerLabel.includes('privacy') ||
          lowerLabel.includes('acknowledge') ||
          lowerLabel.includes('certify')
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
        const parent = el.closest('.ia-Questions-item, .form-group, .ia-BasePage-component');
        const label = parent?.querySelector('label, .ia-Questions-itemLabel, legend');
        return label?.textContent?.trim() || null;
      });

      return parentLabel;
    } catch {
      return null;
    }
  }

  private async clickNextButton(page: Page): Promise<boolean> {
    try {
      const continueBtn = await page.$(this.SELECTORS.continueBtn);
      if (continueBtn && await continueBtn.isVisible()) {
        await continueBtn.click();
        return true;
      }

      const nextBtn = await page.$(this.SELECTORS.nextBtn);
      if (nextBtn && await nextBtn.isVisible()) {
        await nextBtn.click();
        return true;
      }

      const applyNowBtn = await page.$(this.SELECTORS.applyNowBtn);
      if (applyNowBtn && await applyNowBtn.isVisible()) {
        await applyNowBtn.click();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private async clickSubmitButton(page: Page): Promise<boolean> {
    try {
      const submitBtn = await page.$(this.SELECTORS.submitBtn);
      if (submitBtn && await submitBtn.isVisible()) {
        await submitBtn.click();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async checkApplicationComplete(page: Page): Promise<boolean> {
    try {
      const complete = await page.$(this.SELECTORS.applicationComplete);
      return !!complete;
    } catch {
      return false;
    }
  }

  private async checkApplicationSuccess(page: Page, iframe: Page | null): Promise<boolean> {
    try {
      const checkPage = iframe || page;

      // Check for success indicators in iframe/modal
      const successIndicators = [
        '.ia-PostApply-header',
        '.ia-PostApply-content',
        'h1:has-text("Application submitted")',
        'h1:has-text("Your application has been submitted")',
        ':has-text("Thank you for applying")',
      ];

      for (const selector of successIndicators) {
        const element = await checkPage.$(selector);
        if (element) {
          return true;
        }
      }

      // Check page content for success indicators
      const pageContent = await checkPage.content();
      const successPhrases = [
        'application submitted',
        'successfully applied',
        'thank you for applying',
        'application received',
        'application sent',
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

  /**
   * Extract job information from an Indeed job posting
   */
  async extractJobInfo(page: Page): Promise<IndeedJobData | null> {
    try {
      const jobId = await page.evaluate(() => {
        const url = window.location.href;
        const match = url.match(/jk=([a-f0-9]+)/i) || url.match(/vjk=([a-f0-9]+)/i);
        return match ? match[1] : null;
      });

      const jobTitle = await page.$eval(
        this.SELECTORS.jobTitle,
        el => el.textContent?.trim() || ''
      ).catch(() => '');

      const companyName = await page.$eval(
        this.SELECTORS.companyName,
        el => el.textContent?.trim() || ''
      ).catch(() => '');

      const isIndeedApply = await this.isIndeedApplyJob(page);

      return {
        jobId: jobId || '',
        jobTitle,
        companyName,
        isIndeedApply,
      };
    } catch (error) {
      this.logger.error(`Error extracting job info: ${error.message}`);
      return null;
    }
  }
}
