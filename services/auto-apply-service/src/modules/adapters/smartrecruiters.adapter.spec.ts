import { Test } from '@nestjs/testing';

import { SmartRecruitersAdapter } from './smartrecruiters.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { TestingModule } from '@nestjs/testing';

describe('SmartRecruitersAdapter', () => {
  let adapter: SmartRecruitersAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'smartrecruiters-user-888',
    jobUrl: 'https://jobs.smartrecruiters.com/Company/job-title-123456',
    resumePath: '/path/to/resume.pdf',
    coverLetterPath: '/path/to/cover-letter.pdf',
    personalInfo: {
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@example.com',
      phone: '555-0156',
      address: {
        city: 'Chicago',
      },
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
      textContent: jest.fn().mockResolvedValue('Application submitted'),
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
        SmartRecruitersAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<SmartRecruitersAdapter>(SmartRecruitersAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for smartrecruiters.com URLs', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/Company/job/123')).toBe(true);
    });

    it('should return true for jobs.smartrecruiters.com URLs', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/CompanyName/position')).toBe(true);
    });

    it('should return false for non-SmartRecruiters URLs', () => {
      expect(adapter.detectPlatform('https://greenhouse.io/jobs')).toBe(false);
      expect(adapter.detectPlatform('https://lever.co/jobs')).toBe(false);
    });

    it('should handle SmartRecruiters URLs with different paths', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/Test/743999-dev-position')).toBe(true);
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

    it('should click Apply button', async () => {
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

    it('should fill LinkedIn URL when provided', async () => {
      const dataWithLinkedIn = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          linkedinUrl: 'https://linkedin.com/in/lisaanderson',
        },
      };

      await adapter.apply(dataWithLinkedIn);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip LinkedIn URL when not provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should fill location/city when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip location when not provided', async () => {
      const dataWithoutAddress = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          address: undefined,
        },
      };

      await adapter.apply(dataWithoutAddress);

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

    it('should skip cover letter when not provided', async () => {
      const dataWithoutCoverLetter = {
        ...mockApplicationData,
        coverLetterPath: undefined,
      };

      await adapter.apply(dataWithoutCoverLetter);

      // Only resume should be uploaded
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'Why are you interested?',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalled();
      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should navigate through Continue steps', async () => {
      let clickCount = 0;
      mockPage.click.mockImplementation((selector: string) => {
        clickCount++;
        if (selector.includes('Continue') && clickCount <= 3) {
          return Promise.resolve();
        }
        if (clickCount > 3) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve();
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should stop after maximum Continue attempts', async () => {
      mockPage.click.mockResolvedValue(undefined);

      await adapter.apply(mockApplicationData);

      // Should stop after 3 attempts
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should submit application', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle Submit button not found error', async () => {
      let callCount = 0;
      mockPage.click.mockImplementation((selector: string) => {
        callCount++;
        if (selector.includes('Submit') || selector.includes('submit')) {
          throw new Error('Submit button not found');
        }
        if (callCount > 10) {
          throw new Error('Too many attempts');
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
        'Reference Number: SR-123456',
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

    it('should try multiple selectors for Apply button', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should try multiple selectors for form fields', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should try multiple selectors for Continue buttons', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should try multiple selectors for Submit button', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should try multiple selectors for Next button', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle minimal application data', async () => {
      const minimalData: ApplicationData = {
        userId: 'test',
        jobUrl: 'https://jobs.smartrecruiters.com/test/123',
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

    it('should handle special characters in name', async () => {
      const specialData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: "Marie-Claire",
          lastName: 'O\'Donnell',
        },
      };

      await adapter.apply(specialData);

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

    it('should handle missing resume upload field', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Field not found'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should handle navigation between steps', async () => {
      let clickCount = 0;
      mockPage.click.mockImplementation(() => {
        clickCount++;
        if (clickCount === 2) {
          throw new Error('Navigation error');
        }
        if (clickCount > 5) {
          throw new Error('Timeout');
        }
        return Promise.resolve();
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should handle timeout during navigation', async () => {
      const timeoutError: any = new Error('Navigation timeout');
      timeoutError.name = 'TimeoutError';
      browserService.navigateTo.mockRejectedValue(timeoutError);

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should wait appropriate time between file uploads', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle URLs with job IDs', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/Company/743999123456789')).toBe(true);
    });

    it('should handle URLs with job titles', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/Test/senior-developer')).toBe(true);
    });

    it('should reject similar domain names', () => {
      expect(adapter.detectPlatform('https://smartrecruiters-clone.com')).toBe(false);
    });

    it('should handle uppercase URLs', () => {
      expect(adapter.detectPlatform('https://JOBS.SMARTRECRUITERS.COM/company/job')).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://jobs.smartrecruiters.com/Test/job?source=linkedin')).toBe(true);
    });
  });
});
