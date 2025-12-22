import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

import type { Page } from 'playwright';


export enum CaptchaType {
  RECAPTCHA_V2 = 'recaptcha_v2',
  RECAPTCHA_V3 = 'recaptcha_v3',
  HCAPTCHA = 'hcaptcha',
  CLOUDFLARE_TURNSTILE = 'cloudflare_turnstile',
  TEXT_CAPTCHA = 'text_captcha',
  IMAGE_CAPTCHA = 'image_captcha',
  UNKNOWN = 'unknown',
}

export interface CaptchaDetectionResult {
  detected: boolean;
  type: CaptchaType | null;
  siteKey?: string;
  selector?: string;
  pageUrl?: string;
  dataAction?: string;
}

export interface CaptchaSolveResult {
  success: boolean;
  token?: string;
  error?: string;
  timeMs?: number;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly twoCaptchaApiKey: string;
  private readonly antiCaptchaApiKey: string;
  private readonly capsolverApiKey: string;

  // CAPTCHA detection patterns
  private readonly CAPTCHA_PATTERNS = {
    recaptchaV2: [
      'iframe[src*="recaptcha"]',
      '.g-recaptcha',
      '[data-sitekey]',
      '#g-recaptcha',
      'iframe[title*="reCAPTCHA"]',
    ],
    recaptchaV3: [
      'script[src*="recaptcha/api.js?render="]',
      'script[src*="recaptcha/enterprise.js"]',
    ],
    hcaptcha: [
      'iframe[src*="hcaptcha.com"]',
      '.h-captcha',
      '[data-hcaptcha-widget-id]',
    ],
    cloudflareTurnstile: [
      'iframe[src*="challenges.cloudflare.com"]',
      '.cf-turnstile',
      'div[class*="turnstile"]',
    ],
    textCaptcha: [
      'input[name*="captcha"]',
      'img[src*="captcha"]',
      '.captcha-image',
    ],
  };

  constructor(private readonly configService: ConfigService) {
    this.twoCaptchaApiKey = this.configService.get('TWOCAPTCHA_API_KEY', '');
    this.antiCaptchaApiKey = this.configService.get('ANTICAPTCHA_API_KEY', '');
    this.capsolverApiKey = this.configService.get('CAPSOLVER_API_KEY', '');
  }

  /**
   * Detect CAPTCHA presence and type on page
   */
  async detectCaptcha(page: Page): Promise<CaptchaDetectionResult> {
    const pageUrl = page.url();

    try {
      // Check for reCAPTCHA v2
      for (const selector of this.CAPTCHA_PATTERNS.recaptchaV2) {
        const element = await page.$(selector);
        if (element) {
          const siteKey = await this.extractRecaptchaSiteKey(page);
          return {
            detected: true,
            type: CaptchaType.RECAPTCHA_V2,
            siteKey,
            selector,
            pageUrl,
          };
        }
      }

      // Check for reCAPTCHA v3
      for (const selector of this.CAPTCHA_PATTERNS.recaptchaV3) {
        const element = await page.$(selector);
        if (element) {
          const siteKey = await this.extractRecaptchaV3SiteKey(page);
          const dataAction = await this.extractRecaptchaAction(page);
          return {
            detected: true,
            type: CaptchaType.RECAPTCHA_V3,
            siteKey,
            selector,
            pageUrl,
            dataAction,
          };
        }
      }

      // Check for hCaptcha
      for (const selector of this.CAPTCHA_PATTERNS.hcaptcha) {
        const element = await page.$(selector);
        if (element) {
          const siteKey = await this.extractHcaptchaSiteKey(page);
          return {
            detected: true,
            type: CaptchaType.HCAPTCHA,
            siteKey,
            selector,
            pageUrl,
          };
        }
      }

      // Check for Cloudflare Turnstile
      for (const selector of this.CAPTCHA_PATTERNS.cloudflareTurnstile) {
        const element = await page.$(selector);
        if (element) {
          const siteKey = await this.extractTurnstileSiteKey(page);
          return {
            detected: true,
            type: CaptchaType.CLOUDFLARE_TURNSTILE,
            siteKey,
            selector,
            pageUrl,
          };
        }
      }

      // Check for text/image CAPTCHA
      for (const selector of this.CAPTCHA_PATTERNS.textCaptcha) {
        const element = await page.$(selector);
        if (element) {
          return {
            detected: true,
            type: CaptchaType.TEXT_CAPTCHA,
            selector,
            pageUrl,
          };
        }
      }

      // Check page content for CAPTCHA indicators
      const pageContent = await page.content();
      const captchaIndicators = [
        'challenge-form',
        'captcha-bypass',
        'human verification',
        'prove you\'re not a robot',
        'verify you are human',
        'security check',
      ];

      for (const indicator of captchaIndicators) {
        if (pageContent.toLowerCase().includes(indicator)) {
          return {
            detected: true,
            type: CaptchaType.UNKNOWN,
            pageUrl,
          };
        }
      }

      return {
        detected: false,
        type: null,
      };
    } catch (error) {
      this.logger.error(`CAPTCHA detection error: ${error.message}`);
      return {
        detected: false,
        type: null,
      };
    }
  }

  /**
   * Solve detected CAPTCHA using third-party services
   */
  async solveCaptcha(
    detection: CaptchaDetectionResult,
  ): Promise<CaptchaSolveResult> {
    const startTime = Date.now();

    if (!detection.detected || !detection.type) {
      return { success: false, error: 'No CAPTCHA detected' };
    }

    try {
      let result: CaptchaSolveResult;

      switch (detection.type) {
        case CaptchaType.RECAPTCHA_V2:
          result = await this.solveRecaptchaV2(detection);
          break;
        case CaptchaType.RECAPTCHA_V3:
          result = await this.solveRecaptchaV3(detection);
          break;
        case CaptchaType.HCAPTCHA:
          result = await this.solveHcaptcha(detection);
          break;
        case CaptchaType.CLOUDFLARE_TURNSTILE:
          result = await this.solveTurnstile(detection);
          break;
        default:
          result = { success: false, error: `Unsupported CAPTCHA type: ${detection.type}` };
      }

      result.timeMs = Date.now() - startTime;
      return result;
    } catch (error) {
      this.logger.error(`CAPTCHA solving error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Apply solved CAPTCHA token to page
   */
  async applyCaptchaToken(
    page: Page,
    detection: CaptchaDetectionResult,
    token: string,
  ): Promise<boolean> {
    try {
      switch (detection.type) {
        case CaptchaType.RECAPTCHA_V2:
        case CaptchaType.RECAPTCHA_V3:
          await page.evaluate((t) => {
            const textarea = document.getElementById('g-recaptcha-response') as HTMLTextAreaElement;
            if (textarea) {
              textarea.innerHTML = t;
              textarea.value = t;
            }
            // Also try to set via callback
            if (typeof (window as any).grecaptcha !== 'undefined') {
              const callback = (document.querySelector('.g-recaptcha') as any)?.dataset?.callback;
              if (callback && typeof (window as any)[callback] === 'function') {
                (window as any)[callback](t);
              }
            }
          }, token);
          break;

        case CaptchaType.HCAPTCHA:
          await page.evaluate((t) => {
            const textarea = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement;
            if (textarea) {
              textarea.innerHTML = t;
              textarea.value = t;
            }
            // Also try iframe response
            const iframe = document.querySelector('iframe[data-hcaptcha-response]') as any;
            if (iframe) {
              iframe.setAttribute('data-hcaptcha-response', t);
            }
          }, token);
          break;

        case CaptchaType.CLOUDFLARE_TURNSTILE:
          await page.evaluate((t) => {
            const input = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
            if (input) {
              input.value = t;
            }
          }, token);
          break;

        default:
          this.logger.warn(`Token application not implemented for ${detection.type}`);
          return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error applying CAPTCHA token: ${error.message}`);
      return false;
    }
  }

  /**
   * Extract reCAPTCHA v2 site key
   */
  private async extractRecaptchaSiteKey(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const element = document.querySelector('.g-recaptcha, [data-sitekey]');
        return element?.getAttribute('data-sitekey') || undefined;
      });
    } catch {
      return undefined;
    }
  }

  /**
   * Extract reCAPTCHA v3 site key
   */
  private async extractRecaptchaV3SiteKey(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        for (const script of scripts) {
          const src = script.getAttribute('src') || '';
          const match = src.match(/render=([A-Za-z0-9_-]+)/);
          if (match) {return match[1];}
        }
        return undefined;
      });
    } catch {
      return undefined;
    }
  }

  /**
   * Extract reCAPTCHA action
   */
  private async extractRecaptchaAction(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const element = document.querySelector('[data-action]');
        return element?.getAttribute('data-action') || 'verify';
      });
    } catch {
      return 'verify';
    }
  }

  /**
   * Extract hCaptcha site key
   */
  private async extractHcaptchaSiteKey(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const element = document.querySelector('.h-captcha, [data-sitekey]');
        return element?.getAttribute('data-sitekey') || undefined;
      });
    } catch {
      return undefined;
    }
  }

  /**
   * Extract Cloudflare Turnstile site key
   */
  private async extractTurnstileSiteKey(page: Page): Promise<string | undefined> {
    try {
      return await page.evaluate(() => {
        const element = document.querySelector('.cf-turnstile, [data-sitekey]');
        return element?.getAttribute('data-sitekey') || undefined;
      });
    } catch {
      return undefined;
    }
  }

  /**
   * Solve reCAPTCHA v2 via 2Captcha/CapSolver
   */
  private async solveRecaptchaV2(
    detection: CaptchaDetectionResult,
  ): Promise<CaptchaSolveResult> {
    if (!detection.siteKey || !detection.pageUrl) {
      return { success: false, error: 'Missing site key or page URL' };
    }

    // Try CapSolver first (usually faster)
    if (this.capsolverApiKey) {
      try {
        return await this.solveWithCapSolver('ReCaptchaV2TaskProxyLess', {
          websiteURL: detection.pageUrl,
          websiteKey: detection.siteKey,
        });
      } catch (error) {
        this.logger.warn(`CapSolver failed, trying 2Captcha: ${error.message}`);
      }
    }

    // Fallback to 2Captcha
    if (this.twoCaptchaApiKey) {
      return await this.solveWith2Captcha('recaptcha', {
        googlekey: detection.siteKey,
        pageurl: detection.pageUrl,
      });
    }

    return { success: false, error: 'No CAPTCHA solving service configured' };
  }

  /**
   * Solve reCAPTCHA v3 via 2Captcha/CapSolver
   */
  private async solveRecaptchaV3(
    detection: CaptchaDetectionResult,
  ): Promise<CaptchaSolveResult> {
    if (!detection.siteKey || !detection.pageUrl) {
      return { success: false, error: 'Missing site key or page URL' };
    }

    if (this.capsolverApiKey) {
      try {
        return await this.solveWithCapSolver('ReCaptchaV3TaskProxyLess', {
          websiteURL: detection.pageUrl,
          websiteKey: detection.siteKey,
          pageAction: detection.dataAction || 'verify',
        });
      } catch (error) {
        this.logger.warn(`CapSolver failed, trying 2Captcha: ${error.message}`);
      }
    }

    if (this.twoCaptchaApiKey) {
      return await this.solveWith2Captcha('recaptcha', {
        googlekey: detection.siteKey,
        pageurl: detection.pageUrl,
        version: 'v3',
        action: detection.dataAction || 'verify',
        min_score: '0.5',
      });
    }

    return { success: false, error: 'No CAPTCHA solving service configured' };
  }

  /**
   * Solve hCaptcha via 2Captcha/CapSolver
   */
  private async solveHcaptcha(
    detection: CaptchaDetectionResult,
  ): Promise<CaptchaSolveResult> {
    if (!detection.siteKey || !detection.pageUrl) {
      return { success: false, error: 'Missing site key or page URL' };
    }

    if (this.capsolverApiKey) {
      try {
        return await this.solveWithCapSolver('HCaptchaTaskProxyLess', {
          websiteURL: detection.pageUrl,
          websiteKey: detection.siteKey,
        });
      } catch (error) {
        this.logger.warn(`CapSolver failed, trying 2Captcha: ${error.message}`);
      }
    }

    if (this.twoCaptchaApiKey) {
      return await this.solveWith2Captcha('hcaptcha', {
        sitekey: detection.siteKey,
        pageurl: detection.pageUrl,
      });
    }

    return { success: false, error: 'No CAPTCHA solving service configured' };
  }

  /**
   * Solve Cloudflare Turnstile via CapSolver
   */
  private async solveTurnstile(
    detection: CaptchaDetectionResult,
  ): Promise<CaptchaSolveResult> {
    if (!detection.siteKey || !detection.pageUrl) {
      return { success: false, error: 'Missing site key or page URL' };
    }

    if (this.capsolverApiKey) {
      return await this.solveWithCapSolver('AntiTurnstileTaskProxyLess', {
        websiteURL: detection.pageUrl,
        websiteKey: detection.siteKey,
      });
    }

    return { success: false, error: 'Turnstile requires CapSolver API key' };
  }

  /**
   * Solve CAPTCHA via CapSolver API
   */
  private async solveWithCapSolver(
    taskType: string,
    taskData: Record<string, any>,
  ): Promise<CaptchaSolveResult> {
    try {
      // Create task
      const createResponse = await axios.post('https://api.capsolver.com/createTask', {
        clientKey: this.capsolverApiKey,
        task: {
          type: taskType,
          ...taskData,
        },
      });

      if (createResponse.data.errorId !== 0) {
        return { success: false, error: createResponse.data.errorDescription };
      }

      const taskId = createResponse.data.taskId;

      // Poll for result
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));

        const resultResponse = await axios.post('https://api.capsolver.com/getTaskResult', {
          clientKey: this.capsolverApiKey,
          taskId,
        });

        if (resultResponse.data.status === 'ready') {
          return {
            success: true,
            token: resultResponse.data.solution?.gRecaptchaResponse ||
                   resultResponse.data.solution?.token,
          };
        }

        if (resultResponse.data.errorId !== 0) {
          return { success: false, error: resultResponse.data.errorDescription };
        }
      }

      return { success: false, error: 'CAPTCHA solving timeout' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Solve CAPTCHA via 2Captcha API
   */
  private async solveWith2Captcha(
    method: string,
    params: Record<string, any>,
  ): Promise<CaptchaSolveResult> {
    try {
      // Submit task
      const submitResponse = await axios.get('https://2captcha.com/in.php', {
        params: {
          key: this.twoCaptchaApiKey,
          method,
          json: 1,
          ...params,
        },
      });

      if (submitResponse.data.status !== 1) {
        return { success: false, error: submitResponse.data.request };
      }

      const requestId = submitResponse.data.request;

      // Poll for result
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 5000));

        const resultResponse = await axios.get('https://2captcha.com/res.php', {
          params: {
            key: this.twoCaptchaApiKey,
            action: 'get',
            id: requestId,
            json: 1,
          },
        });

        if (resultResponse.data.status === 1) {
          return {
            success: true,
            token: resultResponse.data.request,
          };
        }

        if (resultResponse.data.request !== 'CAPCHA_NOT_READY') {
          return { success: false, error: resultResponse.data.request };
        }
      }

      return { success: false, error: 'CAPTCHA solving timeout' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if any CAPTCHA solving service is configured
   */
  isServiceConfigured(): boolean {
    return !!(this.twoCaptchaApiKey || this.antiCaptchaApiKey || this.capsolverApiKey);
  }

  /**
   * Get configured service names
   */
  getConfiguredServices(): string[] {
    const services: string[] = [];
    if (this.twoCaptchaApiKey) {services.push('2Captcha');}
    if (this.antiCaptchaApiKey) {services.push('AntiCaptcha');}
    if (this.capsolverApiKey) {services.push('CapSolver');}
    return services;
  }
}
