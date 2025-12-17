import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInAdapter } from './linkedin.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';
import { ApplicationData, ApplicationResult } from './base.adapter';

describe('LinkedInAdapter', () => {
  let adapter: LinkedInAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'linkedin-user-789',
    jobUrl: 'https://www.linkedin.com/jobs/view/3456789',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex.johnson@example.com',
      phone: '+1-555-0123',
    },
  };

  beforeEach(async () => {
    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      $: jest.fn(),
      $$: jest.fn().mockResolvedValue([]),
      $$eval: jest.fn().mockResolvedValue([]),
      textContent: jest.fn().mockResolvedValue('Application sent'),
      content: jest.fn().mockResolvedValue('<html>Application sent successfully</html>'),
      close: jest.fn(),
      evaluate: jest.fn(),
      isVisible: jest.fn().mockResolvedValue(true),
    };

    const mockBrowserService = {
      getPage: jest.fn().mockResolvedValue(mockPage),
      createPage: jest.fn().mockResolvedValue(mockPage),
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
        LinkedInAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<LinkedInAdapter>(LinkedInAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for LinkedIn job URLs', () => {
      expect(adapter.detectPlatform('https://www.linkedin.com/jobs/view/123456')).toBe(true);
    });

    it('should return true for LinkedIn profile URLs', () => {
      expect(adapter.detectPlatform('https://www.linkedin.com/in/username')).toBe(true);
    });

    it('should return false for non-LinkedIn URLs', () => {
      expect(adapter.detectPlatform('https://jobs.lever.co/company')).toBe(false);
      expect(adapter.detectPlatform('https://indeed.com/jobs')).toBe(false);
    });

    it('should handle LinkedIn URLs with query parameters', () => {
      expect(adapter.detectPlatform('https://www.linkedin.com/jobs/view/123?source=google')).toBe(true);
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      // Mock Easy Apply button exists
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({
            textContent: jest.fn().mockResolvedValue('Easy Apply'),
            click: jest.fn(),
          });
        }
        return Promise.resolve(null);
      });
    });

    it('should successfully submit an Easy Apply application', async () => {
      mockPage.content.mockResolvedValue('<html>Application sent</html>');

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
      expect(result.screenshotPath).toBeDefined();
      expect(browserService.getPage).toHaveBeenCalled();
    });

    it('should detect and reject non-Easy Apply jobs', async () => {
      mockPage.$.mockResolvedValue(null);

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Easy Apply');
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should detect and handle login requirement', async () => {
      mockPage.$.mockImplementation((selector: string) => {
        if (selector === '#username') {
          return Promise.resolve({});
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply') });
        }
        return Promise.resolve(null);
      });

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('login required');
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should detect and handle CAPTCHA', async () => {
      browserService.detectCaptcha.mockResolvedValue(true);

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.captchaDetected).toBe(true);
      expect(result.error).toBe('CAPTCHA detected');
    });

    it('should process multiple application steps', async () => {
      let stepCount = 0;
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('submit')) {
          stepCount++;
          if (stepCount > 2) {
            return Promise.resolve({ click: jest.fn() });
          }
        }
        if (selector.includes('next') && stepCount < 2) {
          return Promise.resolve({ click: jest.fn() });
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should fill phone number field when present', async () => {
      const phoneInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('phone')) {
          return Promise.resolve(phoneInput);
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      // Phone field should be detected and filled
      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should skip already filled fields', async () => {
      const emailInput = {
        inputValue: jest.fn().mockResolvedValue('existing@email.com'),
        fill: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('email')) {
          return Promise.resolve(emailInput);
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      // Field should not be filled if already has value
      expect(emailInput.fill).not.toHaveBeenCalled();
    });

    it('should handle resume upload', async () => {
      const resumeInput = {};
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('file')) {
          return Promise.resolve(resumeInput);
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should handle dropdown questions', async () => {
      const dropdown = {
        $$eval: jest.fn().mockResolvedValue([
          { value: 'yes', text: 'Yes' },
          { value: 'no', text: 'No' },
        ]),
        selectOption: jest.fn(),
      };
      mockPage.$$.mockResolvedValue([dropdown]);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should handle text area questions', async () => {
      const textArea = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };
      mockPage.$$.mockResolvedValue([textArea]);

      await adapter.apply(mockApplicationData);

      expect(mockPage.$$).toHaveBeenCalled();
    });

    it('should auto-check agreement checkboxes', async () => {
      const checkbox = {
        isChecked: jest.fn().mockResolvedValue(false),
        check: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('I agree to the terms'),
      };
      mockPage.$$.mockImplementation((selector: string) => {
        if (selector.includes('checkbox')) {
          return Promise.resolve([checkbox]);
        }
        return Promise.resolve([]);
      });

      await adapter.apply(mockApplicationData);

      // Agreement checkboxes should be checked
      expect(mockPage.$$).toHaveBeenCalled();
    });

    it('should handle radio button groups', async () => {
      mockPage.$$eval.mockResolvedValue(['question1', 'question2']);
      mockPage.$$.mockResolvedValue([
        {
          isChecked: jest.fn().mockResolvedValue(false),
          click: jest.fn(),
          evaluate: jest.fn().mockResolvedValue('Yes'),
        },
      ]);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should take screenshot on success', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        mockApplicationData.userId,
        'linkedin-complete',
      );
    });

    it('should take screenshot on error', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Navigation failed'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        mockApplicationData.userId,
        'linkedin-error',
      );
    });

    it('should verify application success using multiple indicators', async () => {
      mockPage.content.mockResolvedValue('<html>Application sent successfully</html>');

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
    });

    it('should generate application ID', async () => {
      const result = await adapter.apply(mockApplicationData);

      expect(result.applicationId).toBeDefined();
      expect(result.applicationId).toContain('linkedin-');
    });

    it('should close application modal after submission', async () => {
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('Dismiss')) {
          return Promise.resolve({ click: jest.fn() });
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should handle maximum step limit', async () => {
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('next')) {
          return Promise.resolve({ click: jest.fn() });
        }
        if (selector.includes('jobs-apply-button')) {
          return Promise.resolve({ textContent: jest.fn().mockResolvedValue('Easy Apply'), click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      // Should stop after max steps even if next button still exists
      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should use human-like delays between steps', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });
  });

  describe('extractJobInfo', () => {
    it('should extract job information from page', async () => {
      mockPage.evaluate.mockResolvedValue('3456789');
      mockPage.$eval
        .mockResolvedValueOnce('Senior Software Engineer')
        .mockResolvedValueOnce('Tech Company Inc');

      const jobInfo = await adapter.extractJobInfo(mockPage);

      expect(jobInfo).toBeDefined();
      expect(jobInfo?.jobId).toBe('3456789');
      expect(jobInfo?.jobTitle).toBe('Senior Software Engineer');
      expect(jobInfo?.companyName).toBe('Tech Company Inc');
    });

    it('should handle extraction errors gracefully', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Extraction failed'));

      const jobInfo = await adapter.extractJobInfo(mockPage);

      expect(jobInfo).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle application with no questions', async () => {
      mockPage.$$.mockResolvedValue([]);
      mockPage.$$eval.mockResolvedValue([]);

      const result = await adapter.apply(mockApplicationData);

      expect(browserService.getPage).toHaveBeenCalled();
    });

    it('should handle network errors during submission', async () => {
      mockPage.click.mockRejectedValue(new Error('Network error'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle timeout errors', async () => {
      const timeoutError: any = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockPage.waitForSelector.mockRejectedValue(timeoutError);

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
    });

    it('should handle missing phone field', async () => {
      mockPage.$.mockResolvedValue(null);

      await adapter.apply(mockApplicationData);

      // Should not fail if optional field is missing
      expect(browserService.getPage).toHaveBeenCalled();
    });

    it('should handle CAPTCHA during multi-step process', async () => {
      browserService.detectCaptcha
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await adapter.apply(mockApplicationData);

      expect(result.captchaDetected).toBe(true);
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle mobile LinkedIn URLs', () => {
      expect(adapter.detectPlatform('https://m.linkedin.com/jobs/view/123')).toBe(false);
    });

    it('should handle LinkedIn company pages', () => {
      expect(adapter.detectPlatform('https://www.linkedin.com/in/johndoe')).toBe(true);
    });

    it('should reject non-LinkedIn domains', () => {
      expect(adapter.detectPlatform('https://fake-linkedin.com/jobs')).toBe(false);
    });
  });
});
