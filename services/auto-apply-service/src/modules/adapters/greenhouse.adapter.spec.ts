import { Test, TestingModule } from '@nestjs/testing';
import { GreenhouseAdapter } from './greenhouse.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';
import { ApplicationData, ApplicationResult } from './base.adapter';

describe('GreenhouseAdapter', () => {
  let adapter: GreenhouseAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'test-user-123',
    jobUrl: 'https://boards.greenhouse.io/company/jobs/12345',
    resumePath: '/path/to/resume.pdf',
    coverLetterPath: '/path/to/cover-letter.pdf',
    personalInfo: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      address: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      },
    },
    workInfo: {
      currentCompany: 'Tech Corp',
      currentTitle: 'Senior Developer',
      yearsOfExperience: 5,
    },
    preferences: {
      workAuthorization: true,
      requiresSponsorship: false,
    },
  };

  beforeEach(async () => {
    // Create mock page object
    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      $: jest.fn().mockResolvedValue(null),
      textContent: jest.fn().mockResolvedValue('Application submitted successfully'),
      close: jest.fn(),
    };

    // Create mock browser service
    const mockBrowserService = {
      createPage: jest.fn().mockResolvedValue(mockPage),
      closePage: jest.fn(),
      navigateTo: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue(undefined),
      detectCaptcha: jest.fn().mockResolvedValue(false),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
      fillForm: jest.fn(),
      clickElement: jest.fn(),
      uploadFile: jest.fn(),
    };

    // Create mock form mapping service
    const mockFormMappingService = {
      detectFormFields: jest.fn().mockResolvedValue([]),
      generateAIAnswer: jest.fn().mockResolvedValue('Yes'),
      mapUserDataToField: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GreenhouseAdapter,
        {
          provide: BrowserService,
          useValue: mockBrowserService,
        },
        {
          provide: FormMappingService,
          useValue: mockFormMappingService,
        },
      ],
    }).compile();

    adapter = module.get<GreenhouseAdapter>(GreenhouseAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for greenhouse.io URLs', () => {
      expect(adapter.detectPlatform('https://boards.greenhouse.io/company/jobs/123')).toBe(true);
    });

    it('should return true for greenhouse.io domain variations', () => {
      expect(adapter.detectPlatform('https://company.greenhouse.io/jobs/123')).toBe(true);
    });

    it('should return false for non-Greenhouse URLs', () => {
      expect(adapter.detectPlatform('https://jobs.lever.co/company/123')).toBe(false);
      expect(adapter.detectPlatform('https://linkedin.com/jobs/123')).toBe(false);
      expect(adapter.detectPlatform('https://example.com')).toBe(false);
    });

    it('should handle URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://boards.greenhouse.io/company/jobs/123?source=linkedin')).toBe(true);
    });
  });

  describe('apply', () => {
    it('should successfully submit an application', async () => {
      mockPage.$.mockResolvedValue(null);

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
      expect(result.applicationId).toBeDefined();
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

    it('should handle navigation to job page', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.navigateTo).toHaveBeenCalledWith(mockPage, mockApplicationData.jobUrl);
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should fill all personal information fields', async () => {
      await adapter.apply(mockApplicationData);

      // Check that fill was called multiple times for different fields
      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should upload resume', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalled();
    });

    it('should upload cover letter if provided', async () => {
      await adapter.apply(mockApplicationData);

      expect(mockPage.setInputFiles).toHaveBeenCalledWith(
        expect.any(String),
        mockApplicationData.coverLetterPath,
        expect.any(Object),
      );
    });

    it('should not upload cover letter if not provided', async () => {
      const dataWithoutCoverLetter = { ...mockApplicationData, coverLetterPath: undefined };
      await adapter.apply(dataWithoutCoverLetter);

      // setInputFiles should only be called once for resume
      const calls = (mockPage.setInputFiles as jest.Mock).mock.calls;
      expect(calls.every(call => call[1] !== undefined)).toBe(true);
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#custom-question-1',
          label: 'Why do you want to work here?',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalledWith(mockPage);
      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should take screenshot on success', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        expect.any(String),
      );
    });

    it('should take screenshot on error', async () => {
      mockPage.click.mockRejectedValue(new Error('Apply button not found'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.screenshotPath).toBeDefined();
      expect(browserService.takeScreenshot).toHaveBeenCalled();
    });

    it('should handle error when Apply button is not found', async () => {
      mockPage.click.mockRejectedValue(new Error('Timeout'));

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout');
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should handle error when submit button is not found', async () => {
      mockPage.click
        .mockResolvedValueOnce(undefined) // Apply button
        .mockRejectedValueOnce(new Error('Submit button not found')); // Submit button

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should extract application ID from confirmation page', async () => {
      mockPage.textContent.mockResolvedValue(
        'Your application has been submitted. Application ID: GH-123456',
      );

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

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

    it('should handle missing optional fields gracefully', async () => {
      const minimalData: ApplicationData = {
        userId: 'test-user',
        jobUrl: 'https://boards.greenhouse.io/test/jobs/123',
        resumePath: '/resume.pdf',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '123456789',
        },
      };

      const result = await adapter.apply(minimalData);

      // Should not throw error and should attempt to apply
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should try multiple selectors for form fields', async () => {
      // The adapter tries multiple selectors for each field
      await adapter.apply(mockApplicationData);

      // Should have tried to fill fields
      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle LinkedIn URL field when provided', async () => {
      const dataWithLinkedIn = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          linkedinUrl: 'https://linkedin.com/in/johndoe',
        },
      };

      await adapter.apply(dataWithLinkedIn);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should skip LinkedIn URL field when not provided', async () => {
      const dataWithoutLinkedIn = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          linkedinUrl: undefined,
        },
      };

      await adapter.apply(dataWithoutLinkedIn);

      // Should complete without error
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle timeout errors gracefully', async () => {
      mockPage.click.mockImplementation(() => {
        const error: any = new Error('Timeout waiting for selector');
        error.name = 'TimeoutError';
        throw error;
      });

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should generate proper screenshot filename', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        expect.stringContaining(mockApplicationData.userId),
      );
    });

    it('should handle network errors during navigation', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network error'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle file upload errors', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('File not found'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should continue if optional elements are not found', async () => {
      // Mock some selectors not found, but application should continue
      mockPage.fill.mockRejectedValueOnce(new Error('Element not found'));

      // Should not fail completely
      const result = await adapter.apply(mockApplicationData);

      // The application might fail or succeed depending on which field failed
      expect(browserService.closePage).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty job URL', async () => {
      const invalidData = { ...mockApplicationData, jobUrl: '' };

      await expect(adapter.apply(invalidData)).resolves.toBeDefined();
    });

    it('should handle very long text values', async () => {
      const longText = 'a'.repeat(10000);
      const dataWithLongText = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: longText,
        },
      };

      await adapter.apply(dataWithLongText);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle special characters in form data', async () => {
      const specialData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          firstName: "John O'Brien",
          email: 'test+alias@example.com',
        },
      };

      await adapter.apply(specialData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle concurrent field fills', async () => {
      // Multiple fill operations should be handled
      await adapter.apply(mockApplicationData);

      expect(mockPage.fill).toHaveBeenCalled();
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle case-insensitive URLs', () => {
      expect(adapter.detectPlatform('https://BOARDS.GREENHOUSE.IO/company/jobs/123')).toBe(true);
    });

    it('should handle URLs with fragments', () => {
      expect(adapter.detectPlatform('https://boards.greenhouse.io/company/jobs/123#apply')).toBe(true);
    });

    it('should reject malformed URLs gracefully', () => {
      expect(adapter.detectPlatform('not-a-url')).toBe(false);
      expect(adapter.detectPlatform('')).toBe(false);
    });
  });
});
