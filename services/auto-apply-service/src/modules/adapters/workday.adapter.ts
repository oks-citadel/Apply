import { Injectable } from '@nestjs/common';
import { BaseATSAdapter, ApplicationData, ApplicationResult } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

@Injectable()
export class WorkdayAdapter extends BaseATSAdapter {
  protected readonly platformName = 'workday';

  constructor(
    browserService: BrowserService,
    formMappingService: FormMappingService,
  ) {
    super(browserService, formMappingService);
  }

  detectPlatform(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('myworkdayjobs.com') || lowerUrl.includes('wd5.myworkdayjobs.com');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    this.logger.log(`Starting Workday application for job: ${data.jobUrl}`);

    const page = await this.browserService.createPage(data.userId);

    try {
      // Navigate to job posting
      await this.navigateToJob(page, data.jobUrl);

      // Check for CAPTCHA
      if (await this.checkForCaptcha(page)) {
        return {
          success: false,
          captchaDetected: true,
          requiresManualIntervention: true,
          error: 'CAPTCHA detected',
        };
      }

      // Click "Apply" button
      const applyButtonSelectors = [
        '[data-automation-id="apply"]',
        'button:has-text("Apply")',
        'a:has-text("Apply")',
      ];

      let clicked = false;
      for (const selector of applyButtonSelectors) {
        try {
          await page.click(selector, { timeout: 3000 });
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        throw new Error('Could not find Apply button');
      }

      await this.browserService.humanLikeDelay(2000, 3000);

      // Fill basic information
      await this.fillBasicInfo(page, data);

      // Upload resume
      await this.uploadResume(page, data.resumePath);

      // Handle custom questions
      await this.handleWorkdayQuestions(page, data);

      // Upload cover letter if provided
      if (data.coverLetterPath) {
        await this.uploadCoverLetter(page, data.coverLetterPath);
      }

      // Review and submit
      await this.reviewAndSubmit(page);

      // Take screenshot
      const screenshotPath = await this.takeScreenshot(
        page,
        data.userId,
        data.jobUrl.split('/').pop() || 'workday-job',
      );

      // Extract application ID
      const applicationId = await this.extractApplicationId(page);

      this.logger.log(`Workday application completed successfully`);

      return {
        success: true,
        applicationId,
        screenshotPath,
      };
    } catch (error) {
      this.logger.error(`Workday application failed: ${error.message}`);

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

  private async fillBasicInfo(page: any, data: ApplicationData): Promise<void> {
    const { personalInfo } = data;

    // First Name
    const firstNameSelectors = [
      'input[name*="firstName"]',
      'input[data-automation-id*="legalNameSection_firstName"]',
      'input[placeholder*="First Name"]',
    ];
    await this.tryFillField(page, firstNameSelectors, personalInfo.firstName);

    // Last Name
    const lastNameSelectors = [
      'input[name*="lastName"]',
      'input[data-automation-id*="legalNameSection_lastName"]',
      'input[placeholder*="Last Name"]',
    ];
    await this.tryFillField(page, lastNameSelectors, personalInfo.lastName);

    // Email
    const emailSelectors = [
      'input[type="email"]',
      'input[name*="email"]',
      'input[data-automation-id*="email"]',
    ];
    await this.tryFillField(page, emailSelectors, personalInfo.email);

    // Phone
    const phoneSelectors = [
      'input[type="tel"]',
      'input[name*="phone"]',
      'input[data-automation-id*="phone"]',
    ];
    await this.tryFillField(page, phoneSelectors, personalInfo.phone);

    await this.browserService.humanLikeDelay(1000, 2000);
  }

  private async uploadResume(page: any, resumePath: string): Promise<void> {
    const resumeSelectors = [
      'input[type="file"][data-automation-id*="resume"]',
      'input[type="file"][accept*="pdf"]',
      'input[type="file"]',
    ];

    for (const selector of resumeSelectors) {
      try {
        await page.setInputFiles(selector, resumePath, { timeout: 3000 });
        this.logger.log('Resume uploaded successfully');
        await this.browserService.humanLikeDelay(2000, 3000);
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error('Could not find resume upload field');
  }

  private async uploadCoverLetter(page: any, coverLetterPath: string): Promise<void> {
    const coverLetterSelectors = [
      'input[type="file"][data-automation-id*="coverLetter"]',
      'input[type="file"][data-automation-id*="cover"]',
    ];

    for (const selector of coverLetterSelectors) {
      try {
        await page.setInputFiles(selector, coverLetterPath, { timeout: 3000 });
        this.logger.log('Cover letter uploaded successfully');
        await this.browserService.humanLikeDelay(2000, 3000);
        return;
      } catch (e) {
        continue;
      }
    }

    this.logger.warn('Could not find cover letter upload field');
  }

  private async handleWorkdayQuestions(page: any, data: ApplicationData): Promise<void> {
    // Workday-specific question handling
    await this.handleCustomQuestions(page, data);

    // Handle work authorization
    if (data.preferences?.workAuthorization !== undefined) {
      const authSelectors = [
        'input[data-automation-id*="legally"][value="Yes"]',
        'input[value="yes"][name*="authorized"]',
      ];

      for (const selector of authSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          break;
        } catch (e) {
          continue;
        }
      }
    }

    // Handle sponsorship
    if (data.preferences?.requiresSponsorship !== undefined) {
      const sponsorValue = data.preferences.requiresSponsorship ? 'Yes' : 'No';
      const sponsorSelectors = [
        `input[data-automation-id*="sponsorship"][value="${sponsorValue}"]`,
        `input[value="${sponsorValue.toLowerCase()}"][name*="sponsor"]`,
      ];

      for (const selector of sponsorSelectors) {
        try {
          await page.click(selector, { timeout: 2000 });
          break;
        } catch (e) {
          continue;
        }
      }
    }
  }

  private async reviewAndSubmit(page: any): Promise<void> {
    // Click through to review page
    const nextButtonSelectors = [
      'button[data-automation-id="bottom-navigation-next-button"]',
      'button:has-text("Next")',
      'button:has-text("Continue")',
    ];

    let attempts = 0;
    while (attempts < 5) {
      let clicked = false;
      for (const selector of nextButtonSelectors) {
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

    // Submit application
    const submitSelectors = [
      'button[data-automation-id="bottom-navigation-submit-button"]',
      'button:has-text("Submit")',
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
