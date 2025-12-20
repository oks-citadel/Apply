import { Test } from '@nestjs/testing';

import { LeverAdapter } from './lever.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { TestingModule } from '@nestjs/testing';

describe('LeverAdapter', () => {
  let adapter: LeverAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'test-user-456',
    jobUrl: 'https://jobs.lever.co/company/position-id',
    resumePath: '/path/to/resume.pdf',
    coverLetterPath: '/path/to/cover.pdf',
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567890',
      linkedinUrl: 'https://linkedin.com/in/janesmith',
      portfolioUrl: 'https://janesmith.dev',
    },
  };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      $: jest.fn().mockResolvedValue(null),
      textContent: jest.fn().mockResolvedValue('Thank you for your application'),
      close: jest.fn(),
      evaluate: jest.fn(),
    };

    const mockBrowserService = {
      createPage: jest.fn().mockResolvedValue(mockPage),
      closePage: jest.fn(),
      navigateTo: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue(undefined),
      detectCaptcha: jest.fn().mockResolvedValue(false),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
      scrollToBottom: jest.fn(),
    };

    const mockFormMappingService = {
      detectFormFields: jest.fn().mockResolvedValue([]),
      generateAIAnswer: jest.fn().mockResolvedValue('Yes'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeverAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<LeverAdapter>(LeverAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for lever.co URLs', () => {
      expect(adapter.detectPlatform('https://jobs.lever.co/company/position')).toBe(true);
    });

    it('should return true for lever.co domain variations', () => {
      expect(adapter.detectPlatform('https://apply.lever.co/company/job/123')).toBe(true);
    });

    it('should return false for non-Lever URLs', () => {
      expect(adapter.detectPlatform('https://boards.greenhouse.io/company')).toBe(false);
      expect(adapter.detectPlatform('https://linkedin.com/jobs/123')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://jobs.lever.co/company/pos?source=linkedin')).toBe(true);
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

    it('should scroll through page before filling form', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.scrollToBottom).toHaveBeenCalledWith(mockPage);
    });

    it('should fill full name field (combined first and last name)', async () => {
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

    it('should fill LinkedIn URL when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip LinkedIn URL when not provided', async () => {
      const dataWithoutLinkedIn = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          linkedinUrl: undefined,
        },
      };

      const result = await adapter.apply(dataWithoutLinkedIn);

      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should fill portfolio URL when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip portfolio URL when not provided', async () => {
      const dataWithoutPortfolio = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          portfolioUrl: undefined,
        },
      };

      const result = await adapter.apply(dataWithoutPortfolio);

      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should upload resume', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalledWith(
        expect.any(String),
        mockApplicationData.resumePath,
        expect.any(Object),
      );
    });

    it('should upload cover letter when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalled();
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'What interests you about this role?',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalled();
      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should take screenshot on success', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalled();
    });

    it('should take screenshot on error', async () => {
      mockPage.fill.mockRejectedValue(new Error('Field not found'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.screenshotPath).toBeDefined();
    });

    it('should extract application ID from confirmation page', async () => {
      mockPage.textContent.mockResolvedValue(
        'Application submitted. Reference: LVR-98765',
      );

      const result = await adapter.apply(mockApplicationData);

      expect(result.applicationId).toBeDefined();
    });

    it('should close page even if application fails', async () => {
      mockPage.click.mockRejectedValue(new Error('Submit failed'));

      await adapter.apply(mockApplicationData);

      expect(browserService.closePage).toHaveBeenCalledWith(mockPage);
    });

    it('should use human-like delays between actions', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should handle submit button not found error', async () => {
      mockPage.click.mockRejectedValue(new Error('Could not find Submit button'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Submit button');
    });

    it('should try multiple selectors for form fields', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle network errors gracefully', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle file upload errors', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Upload failed'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should continue with minimal data', async () => {
      const minimalData: ApplicationData = {
        userId: 'test',
        jobUrl: 'https://jobs.lever.co/test/123',
        resumePath: '/resume.pdf',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '123',
        },
      };

      await adapter.apply(minimalData);

      expect(browserService.createPage).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in name', async () => {
      const specialData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: "Mary-Ann O'Brien",
        },
      };

      await adapter.apply(specialData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle international phone numbers', async () => {
      const intlData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          phone: '+44 20 1234 5678',
        },
      };

      await adapter.apply(intlData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle very long URLs', async () => {
      const longUrl = `https://jobs.lever.co/company/${  'a'.repeat(1000)}`;
      const dataWithLongUrl = { ...mockApplicationData, jobUrl: longUrl };

      await adapter.apply(dataWithLongUrl);

      expect(browserService.navigateTo).toHaveBeenCalledWith(mockPage, longUrl);
    });

    it('should handle timeout during navigation', async () => {
      const timeoutError: any = new Error('Navigation timeout');
      timeoutError.name = 'TimeoutError';
      browserService.navigateTo.mockRejectedValue(timeoutError);

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should handle missing resume file', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('File not found'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle uppercase URLs', () => {
      expect(adapter.detectPlatform('https://JOBS.LEVER.CO/company/job')).toBe(true);
    });

    it('should handle URLs with ports', () => {
      expect(adapter.detectPlatform('https://jobs.lever.co:443/company')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(adapter.detectPlatform('')).toBe(false);
    });

    it('should reject null-like values gracefully', () => {
      expect(adapter.detectPlatform('null')).toBe(false);
      expect(adapter.detectPlatform('undefined')).toBe(false);
    });
  });
});
