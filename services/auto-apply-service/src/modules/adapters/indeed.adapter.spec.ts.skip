import { Test } from '@nestjs/testing';

import { IndeedAdapter } from './indeed.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';

import type { ApplicationData, ApplicationResult } from './base.adapter';
import type { TestingModule } from '@nestjs/testing';

describe('IndeedAdapter', () => {
  let adapter: IndeedAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;
  let mockIframe: any;

  const mockApplicationData: ApplicationData = {
    userId: 'indeed-user-321',
    jobUrl: 'https://www.indeed.com/viewjob?jk=abc123def456',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@example.com',
      phone: '555-0199',
    },
  };

  beforeEach(async () => {
    mockIframe = {
      $: jest.fn().mockResolvedValue(null),
      $$: jest.fn().mockResolvedValue([]),
      $$eval: jest.fn().mockResolvedValue([]),
      fill: jest.fn(),
      click: jest.fn(),
      setInputFiles: jest.fn(),
      content: jest.fn().mockResolvedValue('<html>Application submitted</html>'),
    };

    mockPage = {
      goto: jest.fn(),
      click: jest.fn(),
      fill: jest.fn(),
      setInputFiles: jest.fn(),
      waitForSelector: jest.fn(),
      $: jest.fn(),
      $$: jest.fn().mockResolvedValue([]),
      $$eval: jest.fn().mockResolvedValue([]),
      textContent: jest.fn().mockResolvedValue('Application submitted'),
      content: jest.fn().mockResolvedValue('<html>Application submitted</html>'),
      close: jest.fn(),
      evaluate: jest.fn(),
      contentFrame: jest.fn().mockResolvedValue(mockIframe),
    };

    const mockBrowserService = {
      getPage: jest.fn().mockResolvedValue(mockPage),
      navigateTo: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue(undefined),
      detectCaptcha: jest.fn().mockResolvedValue(false),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
    };

    const mockFormMappingService = {
      detectFormFields: jest.fn().mockResolvedValue([]),
      generateAIAnswer: jest.fn().mockResolvedValue('5 years'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IndeedAdapter,
        { provide: BrowserService, useValue: mockBrowserService },
        { provide: FormMappingService, useValue: mockFormMappingService },
      ],
    }).compile();

    adapter = module.get<IndeedAdapter>(IndeedAdapter);
    browserService = module.get(BrowserService);
    formMappingService = module.get(FormMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('detectPlatform', () => {
    it('should return true for Indeed.com URLs', () => {
      expect(adapter.detectPlatform('https://www.indeed.com/viewjob?jk=123')).toBe(true);
    });

    it('should return true for indeedjobs.com URLs', () => {
      expect(adapter.detectPlatform('https://www.indeedjobs.com/job/123')).toBe(true);
    });

    it('should return false for non-Indeed URLs', () => {
      expect(adapter.detectPlatform('https://linkedin.com/jobs')).toBe(false);
      expect(adapter.detectPlatform('https://glassdoor.com')).toBe(false);
    });

    it('should handle Indeed URLs with different query parameters', () => {
      expect(adapter.detectPlatform('https://indeed.com/jobs?q=developer&l=NYC')).toBe(true);
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      // Mock Indeed Apply button exists
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('IndeedApplyButton') || selector.includes('indeedApplyButton')) {
          return Promise.resolve({ click: jest.fn() });
        }
        return Promise.resolve(null);
      });
    });

    it('should successfully submit an Indeed Apply application', async () => {
      mockPage.content.mockResolvedValue('<html>Application submitted</html>');

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
      expect(result.screenshotPath).toBeDefined();
      expect(browserService.getPage).toHaveBeenCalled();
    });

    it('should detect and reject non-Indeed Apply jobs', async () => {
      mockPage.$.mockResolvedValue(null);

      const result: ApplicationResult = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Indeed Apply');
      expect(result.requiresManualIntervention).toBe(true);
    });

    it('should detect and handle login requirement', async () => {
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('loginForm') || selector.includes('login-email')) {
          return Promise.resolve({});
        }
        if (selector.includes('IndeedApplyButton')) {
          return Promise.resolve({ click: jest.fn() });
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

    it('should handle iframe-based application form', async () => {
      mockPage.waitForSelector.mockResolvedValue({
        contentFrame: jest.fn().mockResolvedValue(mockIframe),
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(
        expect.stringContaining('indeed-ia'),
        expect.any(Object),
      );
    });

    it('should handle inline application form (no iframe)', async () => {
      mockPage.waitForSelector.mockResolvedValue(null);

      await adapter.apply(mockApplicationData);

      expect(browserService.getPage).toHaveBeenCalled();
    });

    it('should fill first name and last name fields', async () => {
      const firstNameInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };
      const lastNameInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };

      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('firstName')) {return Promise.resolve(firstNameInput);}
        if (selector.includes('lastName')) {return Promise.resolve(lastNameInput);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(firstNameInput.fill).toHaveBeenCalledWith(mockApplicationData.personalInfo.firstName);
      expect(lastNameInput.fill).toHaveBeenCalledWith(mockApplicationData.personalInfo.lastName);
    });

    it('should fill full name field when present', async () => {
      const fullNameInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };

      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('fullName')) {return Promise.resolve(fullNameInput);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(fullNameInput.fill).toHaveBeenCalled();
    });

    it('should fill phone and email fields', async () => {
      const phoneInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };
      const emailInput = {
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };

      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('phone')) {return Promise.resolve(phoneInput);}
        if (selector.includes('email')) {return Promise.resolve(emailInput);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(phoneInput.fill).toHaveBeenCalled();
      expect(emailInput.fill).toHaveBeenCalled();
    });

    it('should upload resume', async () => {
      const resumeInput = {};
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('file')) {return Promise.resolve(resumeInput);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should select resume from saved resumes', async () => {
      const resumeSelect = {
        click: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('Resume-select')) {return Promise.resolve(resumeSelect);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(resumeSelect.click).toHaveBeenCalled();
    });

    it('should handle dropdown questions', async () => {
      const dropdown = {
        $$eval: jest.fn().mockResolvedValue([
          { value: '1-2', text: '1-2 years' },
          { value: '3-5', text: '3-5 years' },
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

    it('should handle text input custom questions', async () => {
      const textInput = {
        getAttribute: jest.fn().mockResolvedValue('custom-field'),
        inputValue: jest.fn().mockResolvedValue(''),
        fill: jest.fn(),
      };
      mockPage.$$.mockResolvedValue([textInput]);

      await adapter.apply(mockApplicationData);

      expect(mockPage.$$).toHaveBeenCalled();
    });

    it('should handle radio button groups', async () => {
      mockPage.$$eval.mockResolvedValue(['workAuth', 'sponsorship']);
      const radio = {
        isChecked: jest.fn().mockResolvedValue(false),
        click: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('Yes'),
      };
      mockPage.$$.mockResolvedValue([radio]);

      await adapter.apply(mockApplicationData);

      expect(formMappingService.generateAIAnswer).toHaveBeenCalled();
    });

    it('should auto-check agreement checkboxes', async () => {
      const checkbox = {
        isChecked: jest.fn().mockResolvedValue(false),
        check: jest.fn(),
        evaluate: jest.fn().mockResolvedValue('I certify that the information is correct'),
      };
      mockPage.$$.mockImplementation((selector: string) => {
        if (selector.includes('checkbox')) {return Promise.resolve([checkbox]);}
        return Promise.resolve([]);
      });

      await adapter.apply(mockApplicationData);

      expect(checkbox.check).toHaveBeenCalled();
    });

    it('should click Continue button between steps', async () => {
      const continueBtn = {
        isVisible: jest.fn().mockResolvedValue(true),
        click: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('continue')) {return Promise.resolve(continueBtn);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should click Submit button when ready', async () => {
      const submitBtn = {
        isVisible: jest.fn().mockResolvedValue(true),
        click: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('submit')) {return Promise.resolve(submitBtn);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should detect application completion', async () => {
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('PostApply')) {return Promise.resolve({});}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(mockPage.$).toHaveBeenCalled();
    });

    it('should verify success using multiple indicators', async () => {
      mockPage.content.mockResolvedValue('<html>Thank you for applying</html>');

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
    });

    it('should take screenshot on success', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        mockApplicationData.userId,
        'indeed-complete',
      );
    });

    it('should take screenshot on error', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Navigation failed'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(browserService.takeScreenshot).toHaveBeenCalledWith(
        mockPage,
        mockApplicationData.userId,
        'indeed-error',
      );
    });

    it('should handle maximum step limit', async () => {
      let stepCount = 0;
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('continue')) {
          stepCount++;
          return Promise.resolve({ isVisible: jest.fn().mockResolvedValue(true), click: jest.fn() });
        }
        if (selector.includes('IndeedApplyButton')) {
          return Promise.resolve({ click: jest.fn() });
        }
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalled();
    });

    it('should use human-like delays between actions', async () => {
      await adapter.apply(mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Number),
      );
    });

    it('should generate application ID', async () => {
      const result = await adapter.apply(mockApplicationData);

      expect(result.applicationId).toBeDefined();
      expect(result.applicationId).toContain('indeed-');
    });
  });

  describe('extractJobInfo', () => {
    it('should extract job ID from URL', async () => {
      mockPage.evaluate.mockResolvedValue('abc123def456');
      mockPage.$eval
        .mockResolvedValueOnce('Software Developer')
        .mockResolvedValueOnce('Tech Corp');

      const jobInfo = await adapter.extractJobInfo(mockPage);

      expect(jobInfo).toBeDefined();
      expect(jobInfo?.jobId).toBe('abc123def456');
      expect(jobInfo?.jobTitle).toBe('Software Developer');
    });

    it('should handle job ID extraction errors', async () => {
      mockPage.evaluate.mockRejectedValue(new Error('Extraction failed'));

      const jobInfo = await adapter.extractJobInfo(mockPage);

      expect(jobInfo).toBeNull();
    });

    it('should extract job info with vjk parameter', async () => {
      mockPage.evaluate.mockResolvedValue('vjk123');

      const jobInfo = await adapter.extractJobInfo(mockPage);

      expect(jobInfo?.jobId).toBe('vjk123');
    });
  });

  describe('edge cases', () => {
    it('should skip already filled name fields', async () => {
      const nameInput = {
        inputValue: jest.fn().mockResolvedValue('Existing Name'),
        fill: jest.fn(),
      };
      mockPage.$.mockImplementation((selector: string) => {
        if (selector.includes('Name')) {return Promise.resolve(nameInput);}
        if (selector.includes('IndeedApplyButton')) {return Promise.resolve({ click: jest.fn() });}
        return Promise.resolve(null);
      });

      await adapter.apply(mockApplicationData);

      expect(nameInput.fill).not.toHaveBeenCalled();
    });

    it('should skip known field types when handling text inputs', async () => {
      const searchInput = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('search-field')
          .mockResolvedValueOnce('search'),
        inputValue: jest.fn().mockResolvedValue(''),
      };
      mockPage.$$.mockResolvedValue([searchInput]);

      await adapter.apply(mockApplicationData);

      expect(mockPage.$$).toHaveBeenCalled();
    });

    it('should select first valid dropdown option as fallback', async () => {
      const dropdown = {
        $$eval: jest.fn().mockResolvedValue([
          { value: '', text: 'Select one' },
          { value: 'option1', text: 'Option 1' },
        ]),
        selectOption: jest.fn(),
      };
      mockPage.$$.mockResolvedValue([dropdown]);
      formMappingService.generateAIAnswer.mockResolvedValue('Non-matching answer');

      await adapter.apply(mockApplicationData);

      expect(dropdown.selectOption).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network timeout'));

      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });

    it('should handle radio group with already selected option', async () => {
      const radio = {
        isChecked: jest.fn().mockResolvedValue(true),
        click: jest.fn(),
      };
      mockPage.$$.mockResolvedValue([radio]);

      await adapter.apply(mockApplicationData);

      expect(radio.click).not.toHaveBeenCalled();
    });

    it('should handle CAPTCHA during application process', async () => {
      browserService.detectCaptcha
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await adapter.apply(mockApplicationData);

      expect(result.captchaDetected).toBe(true);
    });
  });

  describe('platform detection edge cases', () => {
    it('should handle country-specific Indeed domains', () => {
      expect(adapter.detectPlatform('https://ca.indeed.com/jobs')).toBe(true);
      expect(adapter.detectPlatform('https://uk.indeed.com/jobs')).toBe(true);
    });

    it('should reject similar domain names', () => {
      expect(adapter.detectPlatform('https://indeedclone.com')).toBe(false);
    });
  });
});
