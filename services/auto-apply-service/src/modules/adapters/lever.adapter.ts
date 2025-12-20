import { Injectable } from '@nestjs/common';

import { BaseATSAdapter } from './base.adapter';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { BrowserService } from '../browser/browser.service';
import type { FormMappingService } from '../form-mapping/form-mapping.service';

@Injectable()
export class LeverAdapter extends BaseATSAdapter {
  protected readonly platformName = 'lever';

  constructor(
    browserService: BrowserService,
    formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('lever.co') || url.includes('jobs.lever.co');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    this.logger.log(`Starting Lever application for job: ${data.jobUrl}`);

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

      // Lever typically has inline application form
      await this.fillApplicationForm(page, data);
      await this.uploadDocuments(page, data);
      await this.handleCustomQuestions(page, data);
      await this.submitApplication(page);

      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        data.jobUrl.split('/').pop() || 'lever-job',
      );

      const applicationId = await this.extractApplicationId(page);

      this.logger.log(`Lever application completed successfully`);

      return {
        success: true,
        applicationId,
        screenshotPath,
      };
    } catch (error) {
      this.logger.error(`Lever application failed: ${error.message}`);

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

  private async fillApplicationForm(page: any, data: ApplicationData): Promise<void> {
    const { personalInfo } = data;

    await this.scrollThroughPage(page);

    // Full Name (Lever often uses full name field)
    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`;
    await this.tryFillField(
      page,
      ['input[name="name"]', 'input[placeholder*="Full name"]'],
      fullName,
    );

    // Email
    await this.tryFillField(
      page,
      ['input[name="email"]', 'input[type="email"]'],
      personalInfo.email,
    );

    // Phone
    await this.tryFillField(
      page,
      ['input[name="phone"]', 'input[type="tel"]'],
      personalInfo.phone,
    );

    // LinkedIn
    if (personalInfo.linkedinUrl) {
      await this.tryFillField(
        page,
        ['input[name*="linkedin"]', 'input[placeholder*="LinkedIn"]'],
        personalInfo.linkedinUrl,
      );
    }

    // Website/Portfolio
    if (personalInfo.portfolioUrl) {
      await this.tryFillField(
        page,
        ['input[name*="website"]', 'input[name*="portfolio"]', 'input[placeholder*="Website"]'],
        personalInfo.portfolioUrl,
      );
    }

    await this.browserService.humanLikeDelay(1000, 2000);
  }

  private async uploadDocuments(page: any, data: ApplicationData): Promise<void> {
    // Upload resume
    const resumeSelectors = [
      'input[type="file"][name="resume"]',
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

    // Cover letter
    if (data.coverLetterPath) {
      const coverLetterSelectors = [
        'input[type="file"][name="cover-letter"]',
        'input[type="file"][name="coverletter"]',
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
      'button[type="submit"]',
      'button.application-submit',
      'button:has-text("Submit application")',
      'input[type="submit"]',
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
