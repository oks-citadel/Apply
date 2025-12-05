import { Injectable } from '@nestjs/common';
import { BaseATSAdapter, ApplicationData, ApplicationResult } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

@Injectable()
export class GreenhouseAdapter extends BaseATSAdapter {
  protected readonly platformName = 'greenhouse';

  constructor(
    browserService: BrowserService,
    formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('greenhouse.io') || url.includes('boards.greenhouse.io');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    this.logger.log(`Starting Greenhouse application for job: ${data.jobUrl}`);

    const page = await this.browserService.createPage(data.userId);

    try {
      await this.navigateToJob(page, data.jobUrl);

      if (await this.checkForCaptcha(page)) {
        return {
          success: false,
          captchaDetected: true,
          requiresManualIntervention: true,
          error: 'CAPTCHA detected',
        };
      }

      // Click Apply button
      await this.clickApplyButton(page);

      // Fill application form
      await this.fillApplicationForm(page, data);

      // Upload documents
      await this.uploadDocuments(page, data);

      // Handle additional questions
      await this.handleCustomQuestions(page, data);

      // Submit application
      await this.submitApplication(page);

      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        data.jobUrl.split('/').pop() || 'greenhouse-job',
      );

      const applicationId = await this.extractApplicationId(page);

      this.logger.log(`Greenhouse application completed successfully`);

      return {
        success: true,
        applicationId,
        screenshotPath,
      };
    } catch (error) {
      this.logger.error(`Greenhouse application failed: ${error.message}`);

      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        `error-${Date.now()}`,
      );

      return {
        success: false,
        error: error.message,
        screenshotPath,
        requiresManualIntervention: true,
      };
    } finally {
      await this.browserService.closePage(page);
    }
  }

  private async clickApplyButton(page: any): Promise<void> {
    const selectors = [
      '#submit_app',
      'a[href*="apply"]',
      'button:has-text("Apply")',
    ];

    for (const selector of selectors) {
      try {
        await page.click(selector, { timeout: 3000 });
        await this.browserService.humanLikeDelay(2000, 3000);
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error('Could not find Apply button');
  }

  private async fillApplicationForm(page: any, data: ApplicationData): Promise<void> {
    const { personalInfo } = data;

    // First Name
    await this.tryFillField(page, ['#first_name', 'input[name="first_name"]'], personalInfo.firstName);

    // Last Name
    await this.tryFillField(page, ['#last_name', 'input[name="last_name"]'], personalInfo.lastName);

    // Email
    await this.tryFillField(page, ['#email', 'input[name="email"]', 'input[type="email"]'], personalInfo.email);

    // Phone
    await this.tryFillField(page, ['#phone', 'input[name="phone"]', 'input[type="tel"]'], personalInfo.phone);

    // LinkedIn (if present)
    if (personalInfo.linkedinUrl) {
      await this.tryFillField(
        page,
        ['input[name*="linkedin"]', 'input[placeholder*="LinkedIn"]'],
        personalInfo.linkedinUrl,
      );
    }

    await this.browserService.humanLikeDelay(1000, 2000);
  }

  private async uploadDocuments(page: any, data: ApplicationData): Promise<void> {
    // Upload resume
    const resumeSelectors = [
      'input[type="file"][name="resume"]',
      'input[type="file"]#resume',
      'input[type="file"]',
    ];

    for (const selector of resumeSelectors) {
      try {
        await page.setInputFiles(selector, data.resumePath, { timeout: 3000 });
        this.logger.log('Resume uploaded successfully');
        await this.browserService.humanLikeDelay(2000, 3000);
        break;
      } catch (e) {
        continue;
      }
    }

    // Upload cover letter if provided
    if (data.coverLetterPath) {
      const coverLetterSelectors = [
        'input[type="file"][name="cover_letter"]',
        'input[type="file"]#cover_letter',
      ];

      for (const selector of coverLetterSelectors) {
        try {
          await page.setInputFiles(selector, data.coverLetterPath, { timeout: 3000 });
          this.logger.log('Cover letter uploaded successfully');
          await this.browserService.humanLikeDelay(2000, 3000);
          break;
        } catch (e) {
          continue;
        }
      }
    }
  }

  private async submitApplication(page: any): Promise<void> {
    const submitSelectors = [
      '#submit_app',
      'input[type="submit"]',
      'button[type="submit"]',
      'button:has-text("Submit Application")',
    ];

    for (const selector of submitSelectors) {
      try {
        await page.click(selector, { timeout: 3000 });
        this.logger.log('Application submitted');
        await this.browserService.humanLikeDelay(3000, 5000);
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error('Could not find Submit button');
  }

  private async tryFillField(page: any, selectors: string[], value: string): Promise<void> {
    for (const selector of selectors) {
      try {
        await page.fill(selector, value, { timeout: 2000 });
        return;
      } catch (e) {
        continue;
      }
    }
    this.logger.warn(`Could not fill field with selectors: ${selectors.join(', ')}`);
  }
}
