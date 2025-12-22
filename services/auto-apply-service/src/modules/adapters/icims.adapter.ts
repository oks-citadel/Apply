import { Injectable } from '@nestjs/common';

import { BaseATSAdapter } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';

@Injectable()
export class IcimsAdapter extends BaseATSAdapter {
  protected readonly platformName = 'icims';

  constructor(
    browserService: BrowserService,
    formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('icims.com') || url.includes('.icims.com/jobs');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    this.logger.log(`Starting iCIMS application for job: ${data.jobUrl}`);

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

      // Click Apply Now
      await this.clickApplyButton(page);

      // Fill personal information
      await this.fillPersonalInfo(page, data);

      // Upload resume
      await this.uploadResume(page, data.resumePath);

      // Handle additional questions
      await this.handleCustomQuestions(page, data);

      // Navigate through multi-step form
      await this.navigateMultiStepForm(page);

      // Submit application
      await this.submitApplication(page);

      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        data.jobUrl.split('/').pop() || 'icims-job',
      );

      const applicationId = await this.extractApplicationId(page);

      this.logger.log(`iCIMS application completed successfully`);

      return {
        success: true,
        applicationId,
        screenshotPath,
      };
    } catch (error) {
      this.logger.error(`iCIMS application failed: ${error.message}`);

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
      'a.iCIMS_JobApply',
      'a[title*="Apply"]',
      'button:has-text("Apply Now")',
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

  private async fillPersonalInfo(page: any, data: ApplicationData): Promise<void> {
    const { personalInfo } = data;

    // First Name
    await this.tryFillField(
      page,
      ['input[id*="firstname"]', 'input[name*="firstname"]'],
      personalInfo.firstName,
    );

    // Last Name
    await this.tryFillField(
      page,
      ['input[id*="lastname"]', 'input[name*="lastname"]'],
      personalInfo.lastName,
    );

    // Email
    await this.tryFillField(
      page,
      ['input[type="email"]', 'input[id*="email"]', 'input[name*="email"]'],
      personalInfo.email,
    );

    // Phone
    await this.tryFillField(
      page,
      ['input[type="tel"]', 'input[id*="phone"]', 'input[name*="phone"]'],
      personalInfo.phone,
    );

    // Address fields if present
    if (personalInfo.address) {
      if (personalInfo.address.line1) {
        await this.tryFillField(
          page,
          ['input[id*="address"]', 'input[name*="address"]'],
          personalInfo.address.line1,
        );
      }

      if (personalInfo.address.city) {
        await this.tryFillField(
          page,
          ['input[id*="city"]', 'input[name*="city"]'],
          personalInfo.address.city,
        );
      }

      if (personalInfo.address.state) {
        await this.trySelectField(
          page,
          ['select[id*="state"]', 'select[name*="state"]'],
          personalInfo.address.state,
        );
      }

      if (personalInfo.address.postalCode) {
        await this.tryFillField(
          page,
          ['input[id*="zip"]', 'input[id*="postal"]', 'input[name*="zip"]'],
          personalInfo.address.postalCode,
        );
      }
    }

    await this.browserService.humanLikeDelay(1000, 2000);
  }

  private async uploadResume(page: any, resumePath: string): Promise<void> {
    const resumeSelectors = [
      'input[type="file"][id*="resume"]',
      'input[type="file"][name*="resume"]',
      'input[type="file"]',
    ];

    for (const selector of resumeSelectors) {
      try {
        await page.setInputFiles(selector, resumePath, { timeout: 3000 });
        this.logger.log('Resume uploaded successfully');
        await this.browserService.humanLikeDelay(3000, 4000);
        return;
      } catch (e) {
        continue;
      }
    }

    this.logger.warn('Could not find resume upload field');
  }

  private async navigateMultiStepForm(page: any): Promise<void> {
    // iCIMS often has multi-step forms
    const continueSelectors = [
      'input[value="Continue"]',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'a:has-text("Continue")',
    ];

    let attempts = 0;
    while (attempts < 5) {
      let clicked = false;

      for (const selector of continueSelectors) {
        try {
          await page.click(selector, { timeout: 3000 });
          clicked = true;
          await this.browserService.humanLikeDelay(2000, 3000);
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        break;
      }

      attempts++;
    }
  }

  private async submitApplication(page: any): Promise<void> {
    const submitSelectors = [
      'input[value="Submit"]',
      'button[type="submit"]',
      'button:has-text("Submit")',
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

  private async trySelectField(page: any, selectors: string[], value: string): Promise<void> {
    for (const selector of selectors) {
      try {
        await page.selectOption(selector, value, { timeout: 2000 });
        return;
      } catch (e) {
        continue;
      }
    }
    this.logger.warn(`Could not select field with selectors: ${selectors.join(', ')}`);
  }
}
