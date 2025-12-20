import { Injectable, Logger } from '@nestjs/common';


import type { MouseMovementService } from './mouse-movement.service';
import type { RateLimiterService } from './rate-limiter.service';
import type { TimingService } from './timing.service';
import type { TypingSimulationService } from './typing-simulation.service';
import type { Page } from 'playwright';

interface FormField {
  selector: string;
  value: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
}

interface HumanBehaviorConfig {
  enableTypingSimulation: boolean;
  enableMouseSimulation: boolean;
  enableRateLimiting: boolean;
  speedFactor: number; // 0.5 = slower, 1.0 = normal, 2.0 = faster
}

@Injectable()
export class HumanBehaviorService {
  private readonly logger = new Logger(HumanBehaviorService.name);

  private defaultConfig: HumanBehaviorConfig = {
    enableTypingSimulation: true,
    enableMouseSimulation: true,
    enableRateLimiting: true,
    speedFactor: 1.0,
  };

  constructor(
    private readonly timingService: TimingService,
    private readonly typingService: TypingSimulationService,
    private readonly mouseService: MouseMovementService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  /**
   * Fill a form with human-like behavior
   */
  async fillFormHumanLike(
    page: Page,
    fields: FormField[],
    config: Partial<HumanBehaviorConfig> = {},
  ): Promise<void> {
    const finalConfig = { ...this.defaultConfig, ...config };

    this.logger.log(`Filling ${fields.length} form fields with human-like behavior`);

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      // Wait before interacting with field
      if (i > 0) {
        const transitionTime = this.timingService.getFieldTransitionTime() / finalConfig.speedFactor;
        await new Promise((resolve) => setTimeout(resolve, transitionTime));
      }

      // Scroll field into view if needed
      await this.scrollToElement(page, field.selector);

      // Move mouse to field (if enabled)
      if (finalConfig.enableMouseSimulation) {
        await this.mouseService.moveToElement(page, field.selector, {
          speed: 400 * finalConfig.speedFactor,
        });
      }

      // Fill field based on type
      await this.fillField(page, field, finalConfig);

      // Small pause after filling (simulates verification)
      const verifyPause = (200 + Math.random() * 300) / finalConfig.speedFactor;
      await new Promise((resolve) => setTimeout(resolve, verifyPause));
    }

    this.logger.log('Form filling complete');
  }

  /**
   * Fill a single field with appropriate behavior based on type
   */
  private async fillField(
    page: Page,
    field: FormField,
    config: HumanBehaviorConfig,
  ): Promise<void> {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        if (config.enableTypingSimulation) {
          await this.typingService.fillField(page, field.selector, field.value);
        } else {
          await page.fill(field.selector, field.value);
        }
        break;

      case 'textarea':
        if (config.enableTypingSimulation) {
          await this.typingService.fillField(page, field.selector, field.value);
        } else {
          await page.fill(field.selector, field.value);
        }
        break;

      case 'select':
        await this.selectOption(page, field.selector, field.value, config);
        break;

      case 'checkbox':
        await this.toggleCheckbox(page, field.selector, field.value === 'true', config);
        break;

      case 'radio':
        await this.selectRadio(page, field.selector, config);
        break;

      case 'file':
        await this.uploadFile(page, field.selector, field.value);
        break;

      default:
        await page.fill(field.selector, field.value);
    }
  }

  /**
   * Select an option from dropdown with human-like behavior
   */
  private async selectOption(
    page: Page,
    selector: string,
    value: string,
    config: HumanBehaviorConfig,
  ): Promise<void> {
    // Click to open dropdown
    if (config.enableMouseSimulation) {
      await this.mouseService.humanClick(page, selector);
    } else {
      await page.click(selector);
    }

    // Wait for dropdown to open
    await this.timingService.wait(200, 400);

    // Select the option
    await page.selectOption(selector, value);

    // Small pause after selection
    await this.timingService.wait(100, 300);
  }

  /**
   * Toggle checkbox with human-like behavior
   */
  private async toggleCheckbox(
    page: Page,
    selector: string,
    shouldCheck: boolean,
    config: HumanBehaviorConfig,
  ): Promise<void> {
    const element = await page.$(selector);
    if (!element) {return;}

    const isChecked = await element.isChecked();
    if (isChecked !== shouldCheck) {
      if (config.enableMouseSimulation) {
        await this.mouseService.humanClick(page, selector);
      } else {
        await page.click(selector);
      }
    }
  }

  /**
   * Select radio button with human-like behavior
   */
  private async selectRadio(
    page: Page,
    selector: string,
    config: HumanBehaviorConfig,
  ): Promise<void> {
    if (config.enableMouseSimulation) {
      await this.mouseService.humanClick(page, selector);
    } else {
      await page.click(selector);
    }
  }

  /**
   * Upload file with human-like behavior
   */
  private async uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
    // File inputs don't need mouse simulation
    const fileInput = await page.$(selector);
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
      // Wait for upload indication
      await this.timingService.wait(500, 1000);
    }
  }

  /**
   * Scroll element into view with human-like scroll
   */
  private async scrollToElement(page: Page, selector: string): Promise<void> {
    const element = await page.$(selector);
    if (!element) {return;}

    const isInViewport = await element.isVisible();
    if (!isInViewport) {
      await element.scrollIntoViewIfNeeded();
      // Pause after scroll
      const scrollPause = this.timingService.getScrollPauseDuration();
      await new Promise((resolve) => setTimeout(resolve, scrollPause));
    }
  }

  /**
   * Navigate to URL with human-like behavior
   */
  async navigateHumanLike(page: Page, url: string): Promise<void> {
    this.logger.log(`Navigating to: ${url}`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Simulate page load reaction time
    const pageLoadWait = this.timingService.getPageLoadWait();
    await new Promise((resolve) => setTimeout(resolve, pageLoadWait));

    // Random scroll to simulate reading/scanning the page
    if (Math.random() < 0.7) {
      const scrollAmount = 200 + Math.random() * 400;
      await this.mouseService.humanScroll(page, scrollAmount);
    }
  }

  /**
   * Click element with human-like behavior
   */
  async clickHumanLike(page: Page, selector: string): Promise<void> {
    await this.scrollToElement(page, selector);
    await this.mouseService.humanClick(page, selector);
  }

  /**
   * Check rate limits before performing action
   */
  async checkRateLimits(
    userId: string,
    platform: string,
  ): Promise<{ allowed: boolean; waitTime?: number; reason?: string }> {
    return this.rateLimiter.canApply(userId, platform);
  }

  /**
   * Record application for rate limiting
   */
  async recordApplication(userId: string, platform: string, jobId: string): Promise<void> {
    await this.rateLimiter.recordApplication(userId, platform, jobId);
  }

  /**
   * Get wait time before next application
   */
  getRecommendedWaitTime(userId: string, platform: string): number {
    return this.rateLimiter.getRecommendedWaitTime(userId, platform);
  }

  /**
   * Simulate a break if needed (fatigue simulation)
   */
  async checkAndTakeBreak(
    page: Page,
    actionsCompleted: number,
    sessionDurationMinutes: number,
  ): Promise<boolean> {
    if (this.timingService.shouldTakeBreak(actionsCompleted, sessionDurationMinutes)) {
      const breakDuration = this.timingService.getBreakDuration();
      this.logger.log(`Taking a ${Math.round(breakDuration / 1000)}s break (fatigue simulation)`);

      // During break, simulate minimal activity
      await new Promise((resolve) => setTimeout(resolve, breakDuration));

      return true;
    }
    return false;
  }

  /**
   * Simulate reading content on page
   */
  async simulateReading(page: Page, contentSelector: string): Promise<void> {
    const element = await page.$(contentSelector);
    if (!element) {return;}

    const content = await element.textContent();
    if (!content) {return;}

    const readingTime = this.timingService.getReadingTime(content.length);
    this.logger.debug(`Simulating reading for ${Math.round(readingTime / 1000)}s`);

    // Scroll through content while reading
    const scrollSteps = Math.ceil(readingTime / 2000);
    for (let i = 0; i < scrollSteps; i++) {
      await this.mouseService.humanScroll(page, 100 + Math.random() * 200);
      await new Promise((resolve) => setTimeout(resolve, readingTime / scrollSteps));
    }
  }
}
