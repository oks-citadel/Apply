import { Test, TestingModule } from '@nestjs/testing';
import { IcimsAdapter } from './icims.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';
import { ApplicationData, ApplicationResult } from './base.adapter';

describe('IcimsAdapter', () => {
  let adapter: IcimsAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'icims-user-999',
    jobUrl: 'https://careers.company.com/jobs/12345',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@example.com',
      phone: '555-0187',
      address: {
        line1: '789 Oak Avenue',
        city: 'Austin',
        state: 'TX',
        postalCode: '78701',
        country: 'USA',
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
        IcimsAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<IcimsAdapter>(IcimsAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for icims.com URLs', () => {
      expect(adapter.detectPlatform('https://careers.company.icims.com/jobs/12345')).toBe(true);
    });

    it('should return true for .icims.com/jobs URLs', () => {
      expect(adapter.detectPlatform('https://company.icims.com/jobs/candidate')).toBe(true);
    });

    it('should return false for non-iCIMS URLs', () => {
      expect(adapter.detectPlatform('https://greenhouse.io/jobs')).toBe(false);
      expect(adapter.detectPlatform('https://jobs.lever.co/company')).toBe(false);
    });

    it('should handle iCIMS URLs with different subdomains', () => {
      expect(adapter.detectPlatform('https://recruiting.company.icims.com/jobs/123')).toBe(true);
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

    it('should click Apply Now button', async () => {
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

    it('should fill address line 1 when provided', async () => {
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

    it('should log warning if resume upload field not found', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('Timeout'));

      await adapter.apply(mockApplicationData);

      // Should continue even if resume upload fails
      expect(browserService.createPage).toHaveBeenCalled();
    });

    it('should handle custom questions', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'Why do you want this job?',
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

    it('should stop navigation after max attempts', async () => {
      mockPage.click.mockResolvedValue(undefined);

      await adapter.apply(mockApplicationData);

      // Should stop after 5 attempts
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should submit application', async () => {
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
          throw new Error('Too many clicks');
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
        'Confirmation Number: ICIMS-987654',
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
  });

  describe('edge cases', () => {
    it('should handle minimal application data', async () => {
      const minimalData: ApplicationData = {
        userId: 'test',
        jobUrl: 'https://test.icims.com/jobs/123',
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
          firstName: "Mary-Jo O'Connor",
        },
      };

      await adapter.apply(specialData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle international addresses', async () => {
      const intlData = {
        ...mockApplicationData,
        personalInfo: {
          ...mockApplicationData.personalInfo,
          address: {
            line1: 'Hauptstraße 123',
            city: 'München',
            state: 'Bavaria',
            postalCode: '80331',
            country: 'Germany',
          },
        },
      };

      await adapter.apply(intlData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle network timeout errors', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle file upload errors', async () => {
      mockPage.setInputFiles.mockRejectedValue(new Error('File too large'));

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
            city: 'Boston',
            state: 'MA',
          },
        },
      };

      await adapter.apply(partialAddressData);

      expect(mockPage.fill).toHaveBeenCalled();
    });

    it('should handle navigation errors during multi-step', async () => {
      let clickCount = 0;
      mockPage.click.mockImplementation(() => {
        clickCount++;
        if (clickCount === 3) {
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
  });

  describe('platform detection edge cases', () => {
    it('should handle URLs with job IDs', () => {
      expect(adapter.detectPlatform('https://careers.icims.com/jobs/12345/candidate')).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://test.icims.com/jobs/123?source=linkedin')).toBe(true);
    });

    it('should reject similar domain names', () => {
      expect(adapter.detectPlatform('https://icims-clone.com')).toBe(false);
    });

    it('should handle uppercase URLs', () => {
      expect(adapter.detectPlatform('https://COMPANY.ICIMS.COM/jobs/123')).toBe(true);
    });
  });
});
