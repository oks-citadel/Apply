import { Logger } from '@nestjs/common';
import { Page } from 'playwright';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

export interface ApplicationData {
  userId: string;
  jobUrl: string;
  resumePath: string;
  coverLetterPath?: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  workInfo?: {
    currentCompany?: string;
    currentTitle?: string;
    yearsOfExperience?: number;
  };
  preferences?: {
    salaryExpectation?: string;
    availability?: string;
    workAuthorization?: boolean;
    requiresSponsorship?: boolean;
  };
}

export interface ApplicationResult {
  success: boolean;
  applicationId?: string;
  screenshotPath?: string;
  error?: string;
  requiresManualIntervention?: boolean;
  captchaDetected?: boolean;
}

export abstract class BaseATSAdapter {
  protected readonly logger: Logger;
  protected abstract readonly platformName: string;

  constructor(
    protected readonly browserService: BrowserService,
    protected readonly formMappingService: FormMappingService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  abstract detectPlatform(url: string): boolean;
  abstract apply(data: ApplicationData): Promise<ApplicationResult>;

  protected async navigateToJob(page: Page, url: string): Promise<void> {
    await this.browserService.navigateTo(page, url);
    await this.browserService.humanLikeDelay(2000, 4000);
  }

  protected async checkForCaptcha(page: Page): Promise<boolean> {
    return await this.browserService.detectCaptcha(page);
  }

  protected async takeScreenshot(page: Page, userId: string, jobId: string): Promise<string> {
    const timestamp = Date.now();
    const path = `screenshots/${userId}/${jobId}-${timestamp}.png`;
    await this.browserService.takeScreenshot(page, path);
    return path;
  }

  protected async fillTextField(
    page: Page,
    selector: string,
    value: string,
  ): Promise<void> {
    await this.browserService.fillForm(page, selector, value);
  }

  protected async selectDropdown(
    page: Page,
    selector: string,
    value: string,
  ): Promise<void> {
    await this.browserService.selectOption(page, selector, value);
  }

  protected async uploadFile(
    page: Page,
    selector: string,
    filePath: string,
  ): Promise<void> {
    await this.browserService.uploadFile(page, selector, filePath);
  }

  protected async clickButton(page: Page, selector: string): Promise<void> {
    await this.browserService.clickElement(page, selector);
  }

  protected async waitForElement(page: Page, selector: string, timeout: number = 5000): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      this.logger.warn(`Element not found: ${selector}`);
      return false;
    }
  }

  protected async extractApplicationId(page: Page): Promise<string | null> {
    try {
      // Common patterns for application confirmation
      const patterns = [
        /application\s*(?:id|number|reference)?\s*:?\s*([A-Z0-9-]+)/i,
        /reference\s*(?:number|id)?\s*:?\s*([A-Z0-9-]+)/i,
        /confirmation\s*(?:number|id)?\s*:?\s*([A-Z0-9-]+)/i,
      ];

      const pageText = await page.textContent('body');

      for (const pattern of patterns) {
        const match = pageText?.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error extracting application ID: ${error.message}`);
      return null;
    }
  }

  protected async handleCustomQuestions(
    page: Page,
    data: ApplicationData,
  ): Promise<void> {
    this.logger.log('Handling custom questions');

    const fields = await this.formMappingService.detectFormFields(page);
    const customQuestions = fields.filter(f => f.semanticField === 'custom_question');

    for (const question of customQuestions) {
      if (question.label) {
        const answer = await this.formMappingService.generateAIAnswer(
          question.label,
          data,
        );
        await this.fillTextField(page, question.selector, answer);
        await this.browserService.humanLikeDelay(1000, 2000);
      }
    }
  }

  protected async scrollThroughPage(page: Page): Promise<void> {
    await this.browserService.scrollToBottom(page);
    await this.browserService.humanLikeDelay(500, 1000);
  }
}
