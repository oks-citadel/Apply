import { Injectable } from '@nestjs/common';
import { BaseATSAdapter, ApplicationData, ApplicationResult } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

@Injectable()
export class TaleoAdapter extends BaseATSAdapter {
  protected readonly platformName = 'taleo';

  constructor(
    browserService: BrowserService,
    formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    return url.includes('taleo.net') || url.includes('tbe.taleo.net');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    this.logger.log(`Starting Taleo application for job: ${data.jobUrl}`);

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

      // Handle account creation or login
      await this.handleAccountStep(page, data);

      // Fill application form
      await this.fillApplicationForm(page, data);

      // Upload resume
      await this.uploadResume(page, data.resumePath);

      // Handle questions
      await this.handleCustomQuestions(page, data);

      // Navigate through steps
      await this.navigateThroughSteps(page);

      // Submit application
      await this.submitApplication(page);

      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        data.jobUrl.split('/').pop() || 'taleo-job',
      );

      const applicationId = await this.extractApplicationId(page);

      this.logger.log(`Taleo application completed successfully`);

      return {
        success: true,
        applicationId,
        screenshotPath,
      };
    } catch (error) {
      this.logger.error(`Taleo application failed: ${error.message}`);

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
      'a[id*="apply"]',
      'a:has-text("Apply")',
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

  private async handleAccountStep(page: any, data: ApplicationData): Promise<void> {
    // Taleo often requires account creation
    // Try to find "Apply without account" or similar option
    const skipAccountSelectors = [
      'a:has-text("without an account")',
      'a:has-text("Continue as guest")',
      'button:has-text("Continue without")',
    ];

    for (const selector of skipAccountSelectors) {
      try {
        await page.click(selector, { timeout: 2000 });
        await this.browserService.humanLikeDelay(1000, 2000);
        return;
      } catch (e) {
        continue;
      }
    }

    // If no skip option, might need to create minimal account
    this.logger.log('Continuing with account creation if required');
  }

  private async fillApplicationForm(page: any, data: ApplicationData): Promise<void> {
    const { personalInfo } = data;

    // Taleo uses specific field naming
    await this.tryFillField(
      page,
      ['input[id*="firstName"]', 'input[name*="firstName"]'],
      personalInfo.firstName,
    );

    await this.tryFillField(
      page,
      ['input[id*="lastName"]', 'input[name*="lastName"]'],
      personalInfo.lastName,
    );

    await this.tryFillField(
      page,
      ['input[type="email"]', 'input[id*="email"]'],
      personalInfo.email,
    );

    await this.tryFillField(
      page,
      ['input[type="tel"]', 'input[id*="phone"]'],
      personalInfo.phone,
    );

    // Address fields
    if (personalInfo.address) {
      if (personalInfo.address.line1) {
        await this.tryFillField(
          page,
          ['input[id*="address"]', 'textarea[id*="address"]'],
          personalInfo.address.line1,
        );
      }

      if (personalInfo.address.city) {
        await this.tryFillField(
          page,
          ['input[id*="city"]'],
          personalInfo.address.city,
        );
      }

      if (personalInfo.address.state) {
        await this.trySelectField(
          page,
          ['select[id*="state"]', 'select[id*="province"]'],
          personalInfo.address.state,
        );
      }

      if (personalInfo.address.postalCode) {
        await this.tryFillField(
          page,
          ['input[id*="zip"]', 'input[id*="postal"]'],
          personalInfo.address.postalCode,
        );
      }
    }

    await this.browserService.humanLikeDelay(1000, 2000);
  }

  private async uploadResume(page: any, resumePath: string): Promise<void> {
    const resumeSelectors = [
      'input[type="file"][id*="resume"]',
      'input[type="file"][id*="Resume"]',
      'input[type="file"]',
    ];

    for (const selector of resumeSelectors) {
      try {
        await page.setInputFiles(selector, resumePath, { timeout: 3000 });
        this.logger.log('Resume uploaded successfully');
        await this.browserService.humanLikeDelay(3000, 4000);

        // Wait for upload to complete
        await page.waitForTimeout(2000);
        return;
      } catch (e) {
        continue;
      }
    }

    this.logger.warn('Could not find resume upload field');
  }

  private async navigateThroughSteps(page: any): Promise<void> {
    const nextSelectors = [
      'input[value="Save and Continue"]',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'a:has-text("Continue")',
    ];

    let attempts = 0;
    while (attempts < 5) {
      let clicked = false;

      for (const selector of nextSelectors) {
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
      'button:has-text("Submit")',
      'input[type="submit"]',
      'button[type="submit"]',
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
