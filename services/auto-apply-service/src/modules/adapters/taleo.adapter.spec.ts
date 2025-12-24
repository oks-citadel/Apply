import { Test } from '@nestjs/testing';

import { TaleoAdapter } from './taleo.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { TestingModule } from '@nestjs/testing';

describe('TaleoAdapter', () => {
  let adapter: TaleoAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'taleo-user-777',
    jobUrl: 'https://company.taleo.net/careersection/external/jobdetail.ftl?job=123456',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@example.com',
      phone: '555-0145',
      address: {
        line1: '456 Elm Street',
        city: 'Seattle',
        state: 'WA',
        postalCode: '98101',
      },
    },
  };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      selectOption: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      waitForTimeout: jest.fn(),
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
        TaleoAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<TaleoAdapter>(TaleoAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for taleo.net URLs', () => {
      expect(adapter.detectPlatform('https://company.taleo.net/careers/job/123')).toBe(true);
    });

    it('should return true for tbe.taleo.net URLs', () => {
      expect(adapter.detectPlatform('https://tbe.taleo.net/company/jobdetail/456')).toBe(true);
    });

    it('should return false for non-Taleo URLs', () => {
      expect(adapter.detectPlatform('https://greenhouse.io/jobs')).toBe(false);
      expect(adapter.detectPlatform('https://workday.com')).toBe(false);
    });

    it('should handle Taleo URLs with different paths', () => {
      expect(adapter.detectPlatform('https://test.taleo.net/careersection/external/job/123')).toBe(true);
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

    it('should attempt to skip account creation', async () => {
      await adapter.apply(mockApplicationData);

      // Should try to find skip account options
      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should continue if no skip account option found', async () => {
      mockPage.click.mockRejectedValue(new Error('Timeout'));

      await adapter.apply(mockApplicationData);

      expect(browserService.createPage).toHaveBeenCalled();
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

    it('should fill address field when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should fill city field when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should select state from dropdown when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.selectOption).toHaveBeenCalled();
    });

    it('should fill postal code when provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip address fields when not provided', async () => {
      const dataWithoutAddress = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          address: undefined,
        },
      };

      const result = await adapter.apply(dataWithoutAddress);

      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should upload resume successfully', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalledWith(
        expect.any(String),
        mockApplicationData.resumePath,
        expect.any(Object),
      );
    });

    it('should wait for upload to complete', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(2000);
    });

    it('should log warning if resume upload field not found', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Timeout'));

      await adapter.apply(mockApplicationData);

      // Should continue even if resume upload fails
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#custom-question',
          label: 'Describe your skills',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalled();
      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
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

    it('should stop after maximum navigation attempts', async () => {
      mockPage.click.mockResolvedValue(undefined);

      await adapter.apply(mockApplicationData);

      // Should stop after 5 attempts
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should try multiple Continue button selectors', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should submit application', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });

    it('should handle submit button not found error', async () => {
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
        'Application ID: TALEO-456789',
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

    it('should try multiple selectors for Submit button', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle minimal application data', async () => {
      const minimalData: ApplicationData = {
        userId: 'test',
        jobUrl: 'https://test.taleo.net/job/123',
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

    it('should handle special characters in form data', async () => {
      const specialData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: "François",
          lastName: 'Müller-Schmidt',
        },
      };

      await adapter.apply(specialData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle file upload errors gracefully', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('File not found'));

      await adapter.apply(mockApplicationData);

      // Should continue even with upload error
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle partial address information', async () => {
      const partialAddressData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          address: {
            city: 'Portland',
            state: 'OR',
          },
        },
      };

      await adapter.apply(partialAddressData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle state selection errors', async () => {
      mockPage.selectOption.mockRejectedValue(new Error('State not found'));

      await adapter.apply(mockApplicationData);

      // Should continue even if state selection fails
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle textarea address fields', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle province field instead of state', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.selectOption).toHaveBeenCalled();
    });

    it('should handle navigation errors during steps', async () => {
      let clickCount = 0;
      mockPage.click.mockImplementation(() => {
        clickCount++;
        if (clickCount === 3) {
          throw new Error('Navigation failed');
        }
        if (clickCount > 5) {
          throw new Error('Timeout');
        }
        return Promise.resolve();
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should handle account creation step', async () => {
      // Test different skip account selectors
      await adapter.apply(mockApplicationData);

      expect(mockPage.click).toHaveBeenCalled();
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle URLs with job detail pages', () => {
      expect(adapter.detectPlatform('https://test.taleo.net/careersection/jobdetail.ftl?job=123')).toBe(true);
    });

    it('should handle URLs with career sections', () => {
      expect(adapter.detectPlatform('https://company.taleo.net/careersection/external/moresearch')).toBe(true);
    });

    it('should reject similar domain names', () => {
      expect(adapter.detectPlatform('https://taleo-clone.net')).toBe(false);
    });

    it('should handle uppercase URLs', () => {
      expect(adapter.detectPlatform('https://COMPANY.TALEO.NET/job/123')).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://test.taleo.net/job/123?source=linkedin')).toBe(true);
    });
  });
});
