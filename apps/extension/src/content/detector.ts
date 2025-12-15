/**
 * Job Detector
 * Detects job postings and application forms on job board pages
 */

import { DetectedJob, JobPlatform, FormField } from '@shared/types';

export class JobDetector {
  /**
   * Detect job posting on current page
   */
  async detectJob(): Promise<DetectedJob | null> {
    const platform = this.detectPlatform();

    if (!platform) {
      return null;
    }

    try {
      switch (platform) {
        case 'linkedin':
          return this.detectLinkedInJob();
        case 'indeed':
          return this.detectIndeedJob();
        case 'greenhouse':
          return this.detectGreenhouseJob();
        case 'lever':
          return this.detectLeverJob();
        case 'workday':
          return this.detectWorkdayJob();
        default:
          return this.detectGenericJob(platform);
      }
    } catch (error) {
      console.error('[JobDetector] Error detecting job:', error);
      return null;
    }
  }

  /**
   * Detect which job platform we're on
   */
  private detectPlatform(): JobPlatform | null {
    const hostname = window.location.hostname.toLowerCase();

    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.com')) return 'indeed';
    if (hostname.includes('greenhouse.io') || hostname.includes('grnh.se'))
      return 'greenhouse';
    if (hostname.includes('lever.co') || hostname.includes('jobs.lever.co'))
      return 'lever';
    if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com'))
      return 'workday';
    if (hostname.includes('icims.com')) return 'icims';
    if (hostname.includes('taleo.net')) return 'taleo';
    if (hostname.includes('smartrecruiters.com')) return 'smartrecruiters';
    if (hostname.includes('jobvite.com')) return 'jobvite';
    if (hostname.includes('bamboohr.com')) return 'unknown';
    if (hostname.includes('ashbyhq.com')) return 'unknown';

    // Check if page has job posting elements
    if (this.hasJobPostingElements()) {
      return 'unknown';
    }

    return null;
  }

  /**
   * Check if page has common job posting elements
   */
  private hasJobPostingElements(): boolean {
    const jobIndicators = [
      '[class*="job-title"]',
      '[class*="job-description"]',
      '[class*="apply"]',
      'button[class*="apply"]',
      'a[href*="apply"]',
    ];

    return jobIndicators.some((selector) => document.querySelector(selector) !== null);
  }

  /**
   * Detect LinkedIn job
   */
  private detectLinkedInJob(): DetectedJob | null {
    const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title');
    const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    const locationElement = document.querySelector('.job-details-jobs-unified-top-card__bullet');
    const descriptionElement = document.querySelector('.jobs-description__content');
    const applyButton = document.querySelector<HTMLElement>('.jobs-apply-button');

    if (!titleElement || !companyElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement.textContent?.trim() || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform: 'linkedin',
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect Indeed job
   */
  private detectIndeedJob(): DetectedJob | null {
    const titleElement = document.querySelector('[class*="jobTitle"]');
    const companyElement = document.querySelector('[data-testid="company-name"]');
    const locationElement = document.querySelector('[data-testid="job-location"]');
    const descriptionElement = document.querySelector('#jobDescriptionText');
    const applyButton = document.querySelector<HTMLElement>('#indeedApplyButton, [id*="apply"]');

    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement?.textContent?.trim() || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform: 'indeed',
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect Greenhouse job
   */
  private detectGreenhouseJob(): DetectedJob | null {
    const titleElement = document.querySelector('.app-title');
    const companyElement = document.querySelector('.company-name');
    const locationElement = document.querySelector('.location');
    const descriptionElement = document.querySelector('#content');
    const applyButton = document.querySelector<HTMLElement>('#apply_button, .application-form-button');

    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement?.textContent?.trim() || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform: 'greenhouse',
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect Lever job
   */
  private detectLeverJob(): DetectedJob | null {
    const titleElement = document.querySelector('.posting-headline h2');
    const companyElement = document.querySelector('.main-header-logo');
    const locationElement = document.querySelector('.sort-by-time.posting-category');
    const descriptionElement = document.querySelector('.section-wrapper .content');
    const applyButton = document.querySelector<HTMLElement>('.template-btn-submit');

    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement?.getAttribute('alt') || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform: 'lever',
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect Workday job
   */
  private detectWorkdayJob(): DetectedJob | null {
    const titleElement = document.querySelector('[data-automation-id="jobPostingHeader"]');
    const companyElement = document.querySelector('[data-automation-id="company"]');
    const locationElement = document.querySelector('[data-automation-id="locations"]');
    const descriptionElement = document.querySelector('[data-automation-id="jobPostingDescription"]');
    const applyButton = document.querySelector<HTMLElement>('[data-automation-id="applyButton"]');

    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement?.textContent?.trim() || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform: 'workday',
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect unknown job posting
   */
  private detectGenericJob(platform: JobPlatform): DetectedJob | null {
    // Try common selectors
    const titleElement =
      document.querySelector('h1') ||
      document.querySelector('[class*="job-title" i]') ||
      document.querySelector('[class*="title" i]');

    const companyElement = document.querySelector('[class*="company" i]');
    const locationElement = document.querySelector('[class*="location" i]');
    const descriptionElement = document.querySelector('[class*="description" i]');
    const applyButton = document.querySelector<HTMLElement>('button[class*="apply" i], a[href*="apply" i]');

    if (!titleElement) {
      return null;
    }

    return {
      title: titleElement.textContent?.trim() || '',
      company: companyElement?.textContent?.trim() || '',
      location: locationElement?.textContent?.trim() || '',
      description: descriptionElement?.textContent?.trim() || '',
      platform,
      url: window.location.href,
      applyButton: applyButton || undefined,
    };
  }

  /**
   * Detect form fields on the page
   */
  detectFormFields(): FormField[] {
    const fields: FormField[] = [];
    const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
    );

    inputs.forEach((element) => {
      const field: FormField = {
        id: element.id || '',
        name: element.name || '',
        type: element.type || element.tagName.toLowerCase(),
        label: this.getFieldLabel(element),
        required: element.required || element.hasAttribute('required'),
        element: element,
      };

      // Add options for select elements
      if (element.tagName === 'SELECT') {
        const selectElement = element as HTMLSelectElement;
        field.options = Array.from(selectElement.options).map((opt) => opt.text);
      }

      fields.push(field);
    });

    return fields;
  }

  /**
   * Get label for a form field
   */
  private getFieldLabel(element: HTMLElement): string {
    // Try associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label?.textContent) {
        return label.textContent.trim();
      }
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel?.textContent) {
      return parentLabel.textContent.trim();
    }

    // Try previous sibling label
    const prevLabel = element.previousElementSibling;
    if (prevLabel?.tagName === 'LABEL' && prevLabel.textContent) {
      return prevLabel.textContent.trim();
    }

    // Try placeholder
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      if (element.placeholder) {
        return element.placeholder;
      }
    }

    // Fallback to name or id
    return (element as HTMLInputElement).name || element.id || '';
  }
}
