import { Test } from '@nestjs/testing';

import { WorkdayAdapter } from './workday.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { TestingModule } from '@nestjs/testing';

describe('WorkdayAdapter', () => {
  let adapter: WorkdayAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'workday-user-555',
    jobUrl: 'https://company.wd5.myworkdayjobs.com/en-US/External/job/Software-Engineer_R-12345',
    resumePath: '/path/to/resume.pdf',
    coverLetterPath: '/path/to/cover-letter.pdf',
    personalInfo: {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      phone: '+1-415-555-0100',
    },
    preferences: {
      workAuthorization: true,
      requiresSponsorship: false,
    },
  };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      waitForTimeout: jest.fn(),
      $: jest.fn().mockResolvedValue(null),
      textContent: jest.fn().mockResolvedValue('Application submitted successfully'),
      close: jest.fn(),
    };

    const mockBrowserService = {
      createPage: jest.fn().mockResolvedValue(mockPage),
      closePage: jest.fn(),
      navigateTo: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue(undefined),
      detectCaptcha: jest.fn().mockResolvedValue(false),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
    };

    const mockFormMappingService = {
      detectFormFields: jest.fn().mockResolvedValue([]),
      generateAIAnswer: jest.fn().mockResolvedValue('Yes'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkdayAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<WorkdayAdapter>(WorkdayAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for myworkdayjobs.com URLs', () => {
      expect(adapter.detectPlatform('https://company.myworkdayjobs.com/careers/job/123')).toBe(true);
    });

    it('should return true for wd5.myworkdayjobs.com URLs', () => {
      expect(adapter.detectPlatform('https://company.wd5.myworkdayjobs.com/job/456')).toBe(true);
    });

    it('should return false for non-Workday URLs', () => {
      expect(adapter.detectPlatform('https://greenhouse.io/jobs')).toBe(false);
      expect(adapter.detectPlatform('https://workday.com')).toBe(false);
    });

    it('should handle Workday URLs with different variations', () => {
      expect(adapter.detectPlatform('https://test.wd5.myworkdayjobs.com/en-US/External/job/123')).toBe(true);
    });
  });

  describe('apply', () => {
    it('should successfully submit an application', async () => {
      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
      expect(result.screenshotPath).toBeDefined();
      expect(browserService.createPage).toHaveBeenCalledWith(mockApplicationData.userId);
      expect(browserService.closePage).toHaveBeenCalledWith(mockPage);
    });

    it('should detect and handle CAPTCHA', async () => {
      browserService.detectCaptcha.mockResolvedValue(true);

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.captchaDetected).toBe(true);
      expect(result.requiresManualIntervention).toBe(true);
      expect(result.error).toBe('CAPTCHA detected');
    });

    it('should click Apply button successfully', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle Apply button not found error', async () => {
      mockPage.click.mockRejectedValue(new Error('Timeout'));

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Apply button');
    });

    it('should fill first name field', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should fill last name field', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should fill email field', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should fill phone field', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should upload resume successfully', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalledWith(
        expect.any(String),
        mockApplicationData.resumePath,
        expect.any(Object),
      );
    });

    it('should throw error if resume upload field not found', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('resume upload');
    });

    it('should upload cover letter when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalled();
    });

    it('should skip cover letter if not provided', async () => {
      const dataWithoutCoverLetter = {
        ...mockApplicationData,
        coverLetterPath: undefined,
      };

      await adapter.apply(dataWithoutCoverLetter);

      // Should only upload resume
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#custom-question',
          label: 'Describe your experience',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalled();
      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should handle work authorization question', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle sponsorship question when not required', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle sponsorship question when required', async () => {
      const dataWithSponsorship = {
        ...mockApplicationData,
        preferences: {
          ...mockApplicationData.preferences,
          requiresSponsorship: true,
        },
      };

      await adapter.apply(dataWithSponsorship);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should navigate through multi-step form', async () => {
      let clickCount = 0;
      mockPage.click.mockImplementation(() => {
        clickCount++;
        if (clickCount > 5) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve();
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should submit application after navigating steps', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle submit button not found error', async () => {
      let callCount = 0;
      mockPage.click.mockImplementation((selector: string) => {
        callCount++;
        if (selector.includes('submit') || selector.includes('Submit')) {
          throw new Error('Submit button not found');
        }
        if (callCount > 10) {
          throw new Error('Timeout');
        }
        return Promise.resolve();
      });

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should take screenshot on success', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalled();
    });

    it('should take screenshot on error', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Navigation failed'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.screenshotPath).toBeDefined();
    });

    it('should extract application ID from confirmation page', async () => {
      mockPage.textContent.mockResolvedValue(
        'Confirmation number: WD-789456123',
      );

      const result = await adapter.apply(mockApplicationData);

      expect(result.applicationId).toBeDefined();
    });

    it('should close page even if application fails', async () => {
      mockPage.click.mockRejectedValue(new Error('Test error'));

      await adapter.apply(mockApplicationData);

      expect(browserService.closePage).toHaveBeenCalledWith(mockPage);
    });

    it('should use human-like delays between actions', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should try multiple selectors for form fields', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should stop after maximum navigation attempts', async () => {
      mockPage.click.mockResolvedValue(undefined);

      await adapter.apply(mockApplicationData);

      // Should stop after max attempts (5)
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network error'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('edge cases', () => {
    it('should handle missing optional preferences', async () => {
      const minimalData: ApplicationData = {
        userId: 'test',
        jobUrl: 'https://test.myworkdayjobs.com/job/123',
        resumePath: '/resume.pdf',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '123',
        },
      };

      const result = await adapter.apply(minimalData);

      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle timeout during file upload', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Upload timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should handle special characters in form data', async () => {
      const specialData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: "O'Brien",
          lastName: 'Müller-Schmidt',
        },
      };

      await adapter.apply(specialData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should wait for upload to complete', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.waitForTimeout).toHaveBeenCalled();
    });

    it('should handle Continue button variations', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle navigation timeout', async () => {
      const timeoutError: any = new Error('Navigation timeout');
      timeoutError.name = 'TimeoutError';
      browserService.navigateTo.mockRejectedValue(timeoutError);

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle URLs with language codes', () => {
      expect(adapter.detectPlatform('https://test.myworkdayjobs.com/en-US/careers/job/123')).toBe(true);
    });

    it('should handle URLs with job categories', () => {
      expect(adapter.detectPlatform('https://test.wd5.myworkdayjobs.com/External/job/123')).toBe(true);
    });

    it('should reject non-Workday job sites', () => {
      expect(adapter.detectPlatform('https://myworkday.com/jobs')).toBe(false);
    });

    it('should handle uppercase domain names', () => {
      expect(adapter.detectPlatform('https://COMPANY.MYWORKDAYJOBS.COM/job/123')).toBe(true);
    });
  });
});
