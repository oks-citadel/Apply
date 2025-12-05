/**
 * Adapter factory - Detects ATS platform and returns appropriate adapter
 */

import { ATSPlatform, PlatformDetectionResult, AutofillConfig } from './types';
import { BaseAdapter } from './base-adapter';
import { WorkdayAdapter } from './adapters/workday.adapter';
import { GreenhouseAdapter } from './adapters/greenhouse.adapter';
import { LeverAdapter } from './adapters/lever.adapter';
import { IcimsAdapter } from './adapters/icims.adapter';
import { TaleoAdapter } from './adapters/taleo.adapter';
import { SmartRecruitersAdapter } from './adapters/smartrecruiters.adapter';
import { LinkedInAdapter } from './adapters/linkedin.adapter';
import { IndeedAdapter } from './adapters/indeed.adapter';
import { GenericAdapter } from './adapters/generic.adapter';

export class AdapterFactory {
  private static platformPatterns: Array<{
    platform: ATSPlatform;
    urlPatterns: RegExp[];
    domPatterns: Array<{ selector: string; weight: number }>;
  }> = [
    {
      platform: 'workday',
      urlPatterns: [
        /myworkdayjobs\.com/i,
        /workday\.com.*jobs/i,
        /wd5\.myworkdayjobs\.com/i,
        /wd1\.myworkdayjobs\.com/i,
      ],
      domPatterns: [
        { selector: '[data-automation-id]', weight: 10 },
        { selector: '.workday', weight: 8 },
        { selector: '#wd-', weight: 8 },
      ],
    },
    {
      platform: 'greenhouse',
      urlPatterns: [
        /greenhouse\.io/i,
        /boards\.greenhouse\.io/i,
        /grnh\.se/i,
      ],
      domPatterns: [
        { selector: '#application_form', weight: 10 },
        { selector: '.application-form', weight: 9 },
        { selector: '[name*="job_application"]', weight: 8 },
      ],
    },
    {
      platform: 'lever',
      urlPatterns: [
        /lever\.co/i,
        /jobs\.lever\.co/i,
      ],
      domPatterns: [
        { selector: '.application-form', weight: 10 },
        { selector: '[class*="lever"]', weight: 7 },
        { selector: '.application', weight: 6 },
      ],
    },
    {
      platform: 'icims',
      urlPatterns: [
        /icims\.com/i,
        /\.icims\.com\/jobs/i,
      ],
      domPatterns: [
        { selector: '.iCIMS', weight: 10 },
        { selector: '[class*="icims"]', weight: 9 },
        { selector: '#currentOpenings', weight: 7 },
      ],
    },
    {
      platform: 'taleo',
      urlPatterns: [
        /taleo\.net/i,
        /tbe\.taleo\.net/i,
      ],
      domPatterns: [
        { selector: '#requisitionDescriptionInterface', weight: 10 },
        { selector: '.taleo', weight: 9 },
        { selector: '[id*="taleo"]', weight: 8 },
      ],
    },
    {
      platform: 'smartrecruiters',
      urlPatterns: [
        /smartrecruiters\.com/i,
        /jobs\.smartrecruiters\.com/i,
      ],
      domPatterns: [
        { selector: '.st-apply-modal', weight: 10 },
        { selector: '[class*="smartrecruiters"]', weight: 9 },
        { selector: '.application-form', weight: 7 },
      ],
    },
    {
      platform: 'linkedin',
      urlPatterns: [
        /linkedin\.com\/jobs/i,
      ],
      domPatterns: [
        { selector: '.jobs-apply-button', weight: 10 },
        { selector: '[data-job-id]', weight: 9 },
        { selector: '.jobs-easy-apply', weight: 10 },
      ],
    },
    {
      platform: 'indeed',
      urlPatterns: [
        /indeed\.com/i,
        /indeed\.co\./i,
      ],
      domPatterns: [
        { selector: '#indeedApplyButton', weight: 10 },
        { selector: '.indeed-apply-button', weight: 10 },
        { selector: '[data-indeed-apply-jobtitle]', weight: 9 },
      ],
    },
  ];

  /**
   * Detect platform from current page
   */
  public static detectPlatform(): PlatformDetectionResult {
    const url = window.location.href;
    const indicators: string[] = [];
    let bestMatch: { platform: ATSPlatform; confidence: number } | null = null;

    for (const platformPattern of this.platformPatterns) {
      let confidence = 0;

      // Check URL patterns
      for (const urlPattern of platformPattern.urlPatterns) {
        if (urlPattern.test(url)) {
          confidence += 0.5;
          indicators.push(`URL matches ${platformPattern.platform}`);
          break;
        }
      }

      // Check DOM patterns
      let domScore = 0;
      for (const domPattern of platformPattern.domPatterns) {
        const elements = document.querySelectorAll(domPattern.selector);
        if (elements.length > 0) {
          domScore += domPattern.weight * 0.05;
          indicators.push(`Found ${domPattern.selector}`);
        }
      }
      confidence += Math.min(domScore, 0.5);

      // Update best match
      if (confidence > 0.5 && (!bestMatch || confidence > bestMatch.confidence)) {
        bestMatch = {
          platform: platformPattern.platform,
          confidence: Math.min(confidence, 1.0),
        };
      }
    }

    if (bestMatch) {
      return {
        platform: bestMatch.platform,
        confidence: bestMatch.confidence,
        url,
        indicators,
      };
    }

    // Default to generic adapter
    return {
      platform: 'generic',
      confidence: 0.3,
      url,
      indicators: ['No specific platform detected'],
    };
  }

  /**
   * Get adapter for platform
   */
  public static getAdapter(
    platform: ATSPlatform,
    config?: AutofillConfig
  ): BaseAdapter {
    switch (platform) {
      case 'workday':
        return new WorkdayAdapter(config);
      case 'greenhouse':
        return new GreenhouseAdapter(config);
      case 'lever':
        return new LeverAdapter(config);
      case 'icims':
        return new IcimsAdapter(config);
      case 'taleo':
        return new TaleoAdapter(config);
      case 'smartrecruiters':
        return new SmartRecruitersAdapter(config);
      case 'linkedin':
        return new LinkedInAdapter(config);
      case 'indeed':
        return new IndeedAdapter(config);
      case 'generic':
      default:
        return new GenericAdapter(config);
    }
  }

  /**
   * Get adapter for current page
   */
  public static getAdapterForCurrentPage(config?: AutofillConfig): {
    adapter: BaseAdapter;
    detection: PlatformDetectionResult;
  } {
    const detection = this.detectPlatform();
    const adapter = this.getAdapter(detection.platform, config);

    return { adapter, detection };
  }

  /**
   * Check if current page is a supported application form
   */
  public static isApplicationForm(): boolean {
    const detection = this.detectPlatform();

    if (detection.platform === 'generic' && detection.confidence < 0.5) {
      // Check for generic form indicators
      const forms = document.querySelectorAll('form');
      const hasResumeUpload = document.querySelector('input[type="file"]');
      const hasApplicationKeywords = document.body.textContent?.toLowerCase().includes('application') ||
                                       document.body.textContent?.toLowerCase().includes('apply');

      return forms.length > 0 && (hasResumeUpload !== null || hasApplicationKeywords);
    }

    return detection.confidence > 0.5;
  }

  /**
   * Get all supported platforms
   */
  public static getSupportedPlatforms(): ATSPlatform[] {
    return this.platformPatterns.map((p) => p.platform);
  }
}
