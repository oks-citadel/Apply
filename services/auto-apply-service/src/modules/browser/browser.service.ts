import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';

import { browserConfig, contextConfig, navigationConfig } from '../../config/browser.config';

import type { OnModuleDestroy } from '@nestjs/common';
import type { Browser, BrowserContext, Page } from 'playwright';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;
  private contexts: Map<string, BrowserContext> = new Map();

  async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.logger.log('Launching new browser instance');
      this.browser = await chromium.launch(browserConfig);
    }
    return this.browser;
  }

  async createContext(userId: string): Promise<BrowserContext> {
    const browser = await this.getBrowser();
    const context = await browser.newContext(contextConfig);

    // Add anti-detection measures
    await context.addInitScript(() => {
      // Override navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
    });

    this.contexts.set(userId, context);
    this.logger.log(`Created browser context for user: ${userId}`);

    return context;
  }

  async getContext(userId: string): Promise<BrowserContext> {
    let context = this.contexts.get(userId);

    if (!context) {
      context = await this.createContext(userId);
    }

    return context;
  }

  async createPage(userId: string): Promise<Page> {
    const context = await this.getContext(userId);
    const page = await context.newPage();

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    });

    return page;
  }

  // Alias for backward compatibility
  async getPage(userId: string = 'default'): Promise<Page> {
    return this.createPage(userId);
  }

  async navigateTo(page: Page, url: string): Promise<void> {
    this.logger.log(`Navigating to: ${url}`);
    await page.goto(url, navigationConfig);
  }

  async waitForNavigation(page: Page): Promise<void> {
    await page.waitForLoadState('domcontentloaded');
  }

  async takeScreenshot(page: Page, path: string): Promise<Buffer> {
    this.logger.log(`Taking screenshot: ${path}`);
    return await page.screenshot({ path, fullPage: true });
  }

  async detectCaptcha(page: Page): Promise<boolean> {
    try {
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]',
        '.g-recaptcha',
        '#recaptcha',
        '.h-captcha',
        '[class*="captcha"]',
      ];

      for (const selector of captchaSelectors) {
        const element = await page.$(selector);
        if (element) {
          this.logger.warn(`CAPTCHA detected with selector: ${selector}`);
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error detecting CAPTCHA: ${error.message}`);
      return false;
    }
  }

  async closeContext(userId: string): Promise<void> {
    const context = this.contexts.get(userId);
    if (context) {
      await context.close();
      this.contexts.delete(userId);
      this.logger.log(`Closed browser context for user: ${userId}`);
    }
  }

  async closePage(page: Page): Promise<void> {
    if (page && !page.isClosed()) {
      await page.close();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing all browser contexts');

    for (const [userId, context] of this.contexts.entries()) {
      await context.close();
      this.logger.log(`Closed context for user: ${userId}`);
    }

    if (this.browser) {
      await this.browser.close();
      this.logger.log('Browser closed');
    }
  }

  async fillForm(page: Page, selector: string, value: string, delay: number = 50): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });

      // Clear existing value first
      await page.fill(selector, '');
      await page.waitForTimeout(100);

      // Type with human-like delay
      await page.type(selector, value, { delay });

      // Verify the value was set
      const actualValue = await page.inputValue(selector);
      if (actualValue !== value) {
        this.logger.warn(`Value mismatch for ${selector}. Expected: ${value}, Actual: ${actualValue}`);
      }

      this.logger.debug(`Filled form field ${selector} with value`);
    } catch (error) {
      this.logger.error(`Error filling form field ${selector}: ${error.message}`);
      throw new Error(`Failed to fill field ${selector}: ${error.message}`);
    }
  }

  async clickElement(page: Page, selector: string, delay: number = 100): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'visible' });

      // Scroll element into view
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, selector);

      await page.waitForTimeout(300);

      // Click the element
      await page.click(selector, { force: false });
      await page.waitForTimeout(delay);

      this.logger.debug(`Clicked element: ${selector}`);
    } catch (error) {
      this.logger.error(`Error clicking element ${selector}: ${error.message}`);
      throw new Error(`Failed to click element ${selector}: ${error.message}`);
    }
  }

  async selectOption(page: Page, selector: string, value: string): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.selectOption(selector, value);
      this.logger.debug(`Selected option ${value} in ${selector}`);
    } catch (error) {
      this.logger.error(`Error selecting option in ${selector}: ${error.message}`);
      throw error;
    }
  }

  async uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
    try {
      await page.waitForSelector(selector, { timeout: 5000, state: 'attached' });

      // Check if file exists (this would need to be implemented based on your file storage)
      this.logger.log(`Uploading file ${filePath} to ${selector}`);

      await page.setInputFiles(selector, filePath);

      // Wait for upload to complete
      await page.waitForTimeout(1000);

      this.logger.debug(`Uploaded file to ${selector}`);
    } catch (error) {
      this.logger.error(`Error uploading file to ${selector}: ${error.message}`);
      throw new Error(`Failed to upload file to ${selector}: ${error.message}`);
    }
  }

  async scrollToBottom(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
  }

  async humanLikeDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
