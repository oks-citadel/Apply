import { Injectable, Logger } from '@nestjs/common';

interface BrowserFingerprint {
  userAgent: string;
  viewport: { width: number; height: number };
  language: string;
  timezone: string;
  platform: string;
  webglVendor: string;
  webglRenderer: string;
  screenResolution: { width: number; height: number };
  colorDepth: number;
  deviceMemory: number;
  hardwareConcurrency: number;
}

@Injectable()
export class FingerprintRotationService {
  private readonly logger = new Logger(FingerprintRotationService.name);

  // Common user agents pool
  private readonly userAgents: string[] = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  ];

  // Common viewport sizes
  private readonly viewports: { width: number; height: number }[] = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 2560, height: 1440 },
  ];

  // Timezones
  private readonly timezones: string[] = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Phoenix',
    'America/Seattle',
  ];

  // Languages
  private readonly languages: string[] = ['en-US', 'en-GB', 'en'];

  // WebGL renderers
  private readonly webglRenderers: { vendor: string; renderer: string }[] = [
    { vendor: 'Intel Inc.', renderer: 'Intel(R) UHD Graphics 630' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce GTX 1650' },
    { vendor: 'AMD', renderer: 'AMD Radeon RX 580' },
    { vendor: 'Intel Inc.', renderer: 'Intel(R) Iris(TM) Plus Graphics 655' },
    { vendor: 'NVIDIA Corporation', renderer: 'NVIDIA GeForce RTX 3060' },
  ];

  private currentFingerprint: BrowserFingerprint | null = null;
  private lastRotationTime: Date | null = null;
  private rotationCount: number = 0;

  /**
   * Generate a new random fingerprint
   */
  generateFingerprint(): BrowserFingerprint {
    const userAgent = this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    const viewport = this.viewports[Math.floor(Math.random() * this.viewports.length)];
    const timezone = this.timezones[Math.floor(Math.random() * this.timezones.length)];
    const language = this.languages[Math.floor(Math.random() * this.languages.length)];
    const webgl = this.webglRenderers[Math.floor(Math.random() * this.webglRenderers.length)];

    // Determine platform from user agent
    let platform = 'Win32';
    if (userAgent.includes('Macintosh')) {
      platform = 'MacIntel';
    } else if (userAgent.includes('Linux')) {
      platform = 'Linux x86_64';
    }

    // Random but realistic values
    const deviceMemory = [4, 8, 16, 32][Math.floor(Math.random() * 4)];
    const hardwareConcurrency = [4, 6, 8, 12, 16][Math.floor(Math.random() * 5)];

    const fingerprint: BrowserFingerprint = {
      userAgent,
      viewport,
      language,
      timezone,
      platform,
      webglVendor: webgl.vendor,
      webglRenderer: webgl.renderer,
      screenResolution: {
        width: viewport.width + Math.floor(Math.random() * 100),
        height: viewport.height + Math.floor(Math.random() * 50),
      },
      colorDepth: 24,
      deviceMemory,
      hardwareConcurrency,
    };

    this.currentFingerprint = fingerprint;
    this.lastRotationTime = new Date();
    this.rotationCount++;

    this.logger.log(`Generated new fingerprint #${this.rotationCount}`);
    return fingerprint;
  }

  /**
   * Get current fingerprint or generate new one
   */
  getCurrentFingerprint(): BrowserFingerprint {
    if (!this.currentFingerprint) {
      return this.generateFingerprint();
    }
    return this.currentFingerprint;
  }

  /**
   * Check if fingerprint should be rotated
   */
  shouldRotate(maxAgeMinutes: number = 60, maxActions: number = 50): boolean {
    if (!this.currentFingerprint || !this.lastRotationTime) {
      return true;
    }

    const ageMinutes = (Date.now() - this.lastRotationTime.getTime()) / (1000 * 60);
    return ageMinutes >= maxAgeMinutes;
  }

  /**
   * Rotate fingerprint if needed
   */
  rotateIfNeeded(maxAgeMinutes: number = 60, maxActions: number = 50): BrowserFingerprint {
    if (this.shouldRotate(maxAgeMinutes, maxActions)) {
      return this.generateFingerprint();
    }
    return this.getCurrentFingerprint();
  }

  /**
   * Get browser launch options with fingerprint
   */
  getBrowserLaunchOptions(): Record<string, any> {
    const fingerprint = this.getCurrentFingerprint();

    return {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: fingerprint.language,
      timezoneId: fingerprint.timezone,
    };
  }

  /**
   * Get page context options
   */
  getContextOptions(): Record<string, any> {
    const fingerprint = this.getCurrentFingerprint();

    return {
      userAgent: fingerprint.userAgent,
      viewport: fingerprint.viewport,
      locale: fingerprint.language,
      timezoneId: fingerprint.timezone,
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
    };
  }

  /**
   * Get fingerprint statistics
   */
  getStats(): { rotationCount: number; lastRotation: Date | null; currentFingerprint: BrowserFingerprint | null } {
    return {
      rotationCount: this.rotationCount,
      lastRotation: this.lastRotationTime,
      currentFingerprint: this.currentFingerprint,
    };
  }
}
