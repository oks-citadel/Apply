import { Injectable, Logger } from '@nestjs/common';

import type { Page } from 'playwright';

interface WarmupConfig {
  browseDuration: number; // milliseconds
  minPageVisits: number;
  maxPageVisits: number;
  scrollBehavior: boolean;
  clickBehavior: boolean;
}

interface WarmupSession {
  userId: string;
  platform: string;
  startTime: Date;
  pageVisits: number;
  totalDuration: number;
  completed: boolean;
}

@Injectable()
export class WarmupService {
  private readonly logger = new Logger(WarmupService.name);

  // Platform-specific warmup URLs
  private readonly platformWarmupUrls: Map<string, string[]> = new Map([
    [
      'linkedin',
      [
        'https://www.linkedin.com/feed/',
        'https://www.linkedin.com/mynetwork/',
        'https://www.linkedin.com/notifications/',
      ],
    ],
    [
      'indeed',
      [
        'https://www.indeed.com/',
        'https://www.indeed.com/companies',
        'https://www.indeed.com/career-advice',
      ],
    ],
    [
      'glassdoor',
      [
        'https://www.glassdoor.com/',
        'https://www.glassdoor.com/Salaries/index.htm',
        'https://www.glassdoor.com/blog/',
      ],
    ],
  ]);

  // Default warmup config per platform
  private readonly defaultConfigs: Map<string, WarmupConfig> = new Map([
    [
      'linkedin',
      {
        browseDuration: 120000, // 2 minutes
        minPageVisits: 3,
        maxPageVisits: 5,
        scrollBehavior: true,
        clickBehavior: true,
      },
    ],
    [
      'indeed',
      {
        browseDuration: 90000, // 1.5 minutes
        minPageVisits: 2,
        maxPageVisits: 4,
        scrollBehavior: true,
        clickBehavior: false,
      },
    ],
    [
      'default',
      {
        browseDuration: 60000, // 1 minute
        minPageVisits: 2,
        maxPageVisits: 3,
        scrollBehavior: true,
        clickBehavior: false,
      },
    ],
  ]);

  private activeSessions: Map<string, WarmupSession> = new Map();

  /**
   * Execute warmup routine for a platform
   */
  async warmup(
    page: Page,
    platform: string,
    userId: string,
    config?: Partial<WarmupConfig>,
  ): Promise<WarmupSession> {
    const normalizedPlatform = platform.toLowerCase();
    const finalConfig = {
      ...(this.defaultConfigs.get(normalizedPlatform) || this.defaultConfigs.get('default')!),
      ...config,
    };

    this.logger.log(`Starting warmup for ${normalizedPlatform} (user: ${userId})`);

    const session: WarmupSession = {
      userId,
      platform: normalizedPlatform,
      startTime: new Date(),
      pageVisits: 0,
      totalDuration: 0,
      completed: false,
    };

    const sessionKey = `${userId}:${normalizedPlatform}`;
    this.activeSessions.set(sessionKey, session);

    try {
      const warmupUrls = this.platformWarmupUrls.get(normalizedPlatform) || [];
      const numPages =
        finalConfig.minPageVisits +
        Math.floor(Math.random() * (finalConfig.maxPageVisits - finalConfig.minPageVisits + 1));

      const startTime = Date.now();
      const endTime = startTime + finalConfig.browseDuration;

      for (let i = 0; i < numPages && Date.now() < endTime; i++) {
        const url = warmupUrls[i % warmupUrls.length];
        if (!url) {continue;}

        this.logger.debug(`Warmup visit ${i + 1}/${numPages}: ${url}`);

        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          session.pageVisits++;

          // Wait for page to load
          await this.randomDelay(2000, 4000);

          // Perform scroll behavior
          if (finalConfig.scrollBehavior) {
            await this.simulateReading(page);
          }

          // Perform click behavior (only on safe elements)
          if (finalConfig.clickBehavior) {
            await this.simulateBrowsing(page);
          }

          // Random time on page
          await this.randomDelay(5000, 15000);
        } catch (error) {
          this.logger.warn(`Warmup page visit failed: ${error.message}`);
        }
      }

      session.totalDuration = Date.now() - startTime;
      session.completed = true;

      this.logger.log(
        `Warmup completed for ${normalizedPlatform}: ${session.pageVisits} pages, ${Math.round(session.totalDuration / 1000)}s`,
      );
    } catch (error) {
      this.logger.error(`Warmup failed for ${normalizedPlatform}: ${error.message}`);
      session.completed = false;
    }

    return session;
  }

  /**
   * Check if warmup is needed
   */
  needsWarmup(userId: string, platform: string, maxAgeHours: number = 4): boolean {
    const sessionKey = `${userId}:${platform.toLowerCase()}`;
    const session = this.activeSessions.get(sessionKey);

    if (!session || !session.completed) {
      return true;
    }

    const ageHours = (Date.now() - session.startTime.getTime()) / (1000 * 60 * 60);
    return ageHours >= maxAgeHours;
  }

  /**
   * Get last warmup session
   */
  getLastSession(userId: string, platform: string): WarmupSession | null {
    const sessionKey = `${userId}:${platform.toLowerCase()}`;
    return this.activeSessions.get(sessionKey) || null;
  }

  /**
   * Simulate reading behavior (scrolling)
   */
  private async simulateReading(page: Page): Promise<void> {
    try {
      // Get page height
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);

      // Scroll down in increments
      const scrollSteps = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < scrollSteps; i++) {
        const scrollAmount = Math.floor((pageHeight / scrollSteps) * (0.8 + Math.random() * 0.4));
        await page.mouse.wheel(0, scrollAmount);
        await this.randomDelay(800, 2000);
      }

      // Scroll back up partially
      if (Math.random() > 0.5) {
        await page.mouse.wheel(0, -Math.floor(pageHeight * 0.3));
        await this.randomDelay(500, 1000);
      }
    } catch (error) {
      this.logger.debug(`Scroll simulation error: ${error.message}`);
    }
  }

  /**
   * Simulate browsing behavior (safe clicks)
   */
  private async simulateBrowsing(page: Page): Promise<void> {
    try {
      // Find safe elements to interact with (navigation links, non-submit buttons)
      const safeSelectors = [
        'a[href^="/"]',
        'button:not([type="submit"])',
        '.nav-link',
        '.menu-item',
      ];

      for (const selector of safeSelectors) {
        const elements = await page.$$(selector);
        if (elements.length > 0 && Math.random() > 0.7) {
          // Only hover, don't click to avoid accidental navigation
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          try {
            await randomElement.hover();
            await this.randomDelay(500, 1500);
          } catch {
            // Element may have been removed, ignore
          }
          break;
        }
      }
    } catch (error) {
      this.logger.debug(`Browse simulation error: ${error.message}`);
    }
  }

  /**
   * Random delay helper
   */
  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Get warmup statistics
   */
  getStats(): { activeSessions: number; sessions: WarmupSession[] } {
    return {
      activeSessions: this.activeSessions.size,
      sessions: Array.from(this.activeSessions.values()),
    };
  }
}
