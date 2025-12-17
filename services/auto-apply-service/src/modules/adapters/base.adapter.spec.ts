import { BaseATSAdapter, ApplicationData, ApplicationResult } from './base.adapter';
import { BrowserService } from '../browser/browser.service';
import { FormMappingService } from '../form-mapping/form-mapping.service';
import { Logger } from '@nestjs/common';

// Create a concrete implementation for testing
class TestAdapter extends BaseATSAdapter {
  protected readonly platformName = 'test-platform';

  detectPlatform(url: string): boolean {
    return url.includes('test.com');
  }

  async apply(data: ApplicationData): Promise<ApplicationResult> {
    return {
      success: true,
      applicationId: 'test-123',
    };
  }
}

describe('BaseATSAdapter', () => {
  let adapter: TestAdapter;
  let browserService: jest.Mocked<BrowserService>;
  let formMappingService: jest.Mocked<FormMappingService>;
  let mockPage: any;

  const mockApplicationData: ApplicationData = {
    userId: 'test-user',
    jobUrl: 'https://test.com/jobs/123',
    resumePath: '/path/to/resume.pdf',
    personalInfo: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '555-0100',
    },
  };

  beforeEach(() => {
    mockPage = {
      goto: jest.fn(),
      waitForSelector: jest.fn(),
      textContent: jest.fn(),
      evaluate: jest.fn(),
      $: jest.fn(),
    };

    browserService = {
      navigateTo: jest.fn(),
      humanLikeDelay: jest.fn().mockResolvedValue(undefined),
      detectCaptcha: jest.fn().mockResolvedValue(false),
      takeScreenshot: jest.fn().mockResolvedValue(Buffer.from('screenshot')),
      fillForm: jest.fn(),
      selectOption: jest.fn(),
      uploadFile: jest.fn(),
      clickElement: jest.fn(),
      scrollToBottom: jest.fn(),
    } as any;

    formMappingService = {
      detectFormFields: jest.fn().mockResolvedValue([]),
      generateAIAnswer: jest.fn().mockResolvedValue('Test answer'),
      mapUserDataToField: jest.fn(),
    } as any;

    adapter = new TestAdapter(browserService, formMappingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create logger instance', () => {
      expect(adapter['logger']).toBeDefined();
      expect(adapter['logger']).toBeInstanceOf(Logger);
    });

    it('should store browserService reference', () => {
      expect(adapter['browserService']).toBe(browserService);
    });

    it('should store formMappingService reference', () => {
      expect(adapter['formMappingService']).toBe(formMappingService);
    });
  });

  describe('navigateToJob', () => {
    it('should navigate to job URL', async () => {
      await adapter['navigateToJob'](mockPage, 'https://test.com/job/123');

      expect(browserService.navigateTo).toHaveBeenCalledWith(
        mockPage,
        'https://test.com/job/123',
      );
    });

    it('should add human-like delay after navigation', async () => {
      await adapter['navigateToJob'](mockPage, 'https://test.com/job/123');

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(2000, 4000);
    });

    it('should handle navigation errors', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Navigation failed'));

      await expect(
        adapter['navigateToJob'](mockPage, 'https://test.com/job/123'),
      ).rejects.toThrow('Navigation failed');
    });
  });

  describe('checkForCaptcha', () => {
    it('should detect CAPTCHA when present', async () => {
      browserService.detectCaptcha.mockResolvedValue(true);

      const result = await adapter['checkForCaptcha'](mockPage);

      expect(result).toBe(true);
      expect(browserService.detectCaptcha).toHaveBeenCalledWith(mockPage);
    });

    it('should return false when no CAPTCHA detected', async () => {
      browserService.detectCaptcha.mockResolvedValue(false);

      const result = await adapter['checkForCaptcha'](mockPage);

      expect(result).toBe(false);
    });

    it('should handle detection errors', async () => {
      browserService.detectCaptcha.mockRejectedValue(new Error('Detection failed'));

      await expect(adapter['checkForCaptcha'](mockPage)).rejects.toThrow('Detection failed');
    });
  });

  describe('takeScreenshot', () => {
    it('should take screenshot with correct path format', async () => {
      const result = await adapter['takeScreenshot'](mockPage, 'user-123', 'job-456');

      expect(result).toMatch(/screenshots\/user-123\/job-456-\d+\.png/);
      expect(browserService.takeScreenshot).toHaveBeenCalled();
    });

    it('should include timestamp in screenshot path', async () => {
      const beforeTime = Date.now();
      const path = await adapter['takeScreenshot'](mockPage, 'user-123', 'job-456');
      const afterTime = Date.now();

      const timestamp = parseInt(path.split('-').pop()?.replace('.png', '') || '0');
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle screenshot errors', async () => {
      browserService.takeScreenshot.mockRejectedValue(new Error('Screenshot failed'));

      await expect(
        adapter['takeScreenshot'](mockPage, 'user-123', 'job-456'),
      ).rejects.toThrow('Screenshot failed');
    });
  });

  describe('fillTextField', () => {
    it('should fill text field with value', async () => {
      await adapter['fillTextField'](mockPage, '#name', 'John Doe');

      expect(browserService.fillForm).toHaveBeenCalledWith(mockPage, '#name', 'John Doe');
    });

    it('should handle fill errors', async () => {
      browserService.fillForm.mockRejectedValue(new Error('Field not found'));

      await expect(
        adapter['fillTextField'](mockPage, '#invalid', 'value'),
      ).rejects.toThrow('Field not found');
    });
  });

  describe('selectDropdown', () => {
    it('should select dropdown option', async () => {
      await adapter['selectDropdown'](mockPage, '#country', 'USA');

      expect(browserService.selectOption).toHaveBeenCalledWith(mockPage, '#country', 'USA');
    });

    it('should handle selection errors', async () => {
      browserService.selectOption.mockRejectedValue(new Error('Option not found'));

      await expect(
        adapter['selectDropdown'](mockPage, '#country', 'Invalid'),
      ).rejects.toThrow('Option not found');
    });
  });

  describe('uploadFile', () => {
    it('should upload file to selector', async () => {
      await adapter['uploadFile'](mockPage, '#resume', '/path/to/resume.pdf');

      expect(browserService.uploadFile).toHaveBeenCalledWith(
        mockPage,
        '#resume',
        '/path/to/resume.pdf',
      );
    });

    it('should handle upload errors', async () => {
      browserService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      await expect(
        adapter['uploadFile'](mockPage, '#resume', '/invalid/path.pdf'),
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('clickButton', () => {
    it('should click button element', async () => {
      await adapter['clickButton'](mockPage, '#submit');

      expect(browserService.clickElement).toHaveBeenCalledWith(mockPage, '#submit');
    });

    it('should handle click errors', async () => {
      browserService.clickElement.mockRejectedValue(new Error('Element not clickable'));

      await expect(
        adapter['clickButton'](mockPage, '#invalid'),
      ).rejects.toThrow('Element not clickable');
    });
  });

  describe('waitForElement', () => {
    it('should wait for element and return true when found', async () => {
      mockPage.waitForSelector.mockResolvedValue({});

      const result = await adapter['waitForElement'](mockPage, '#element');

      expect(result).toBe(true);
      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#element', { timeout: 5000 });
    });

    it('should return false when element not found within timeout', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      const result = await adapter['waitForElement'](mockPage, '#missing');

      expect(result).toBe(false);
    });

    it('should use custom timeout when provided', async () => {
      mockPage.waitForSelector.mockResolvedValue({});

      await adapter['waitForElement'](mockPage, '#element', 10000);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith('#element', { timeout: 10000 });
    });

    it('should log warning when element not found', async () => {
      const warnSpy = jest.spyOn(adapter['logger'], 'warn');
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await adapter['waitForElement'](mockPage, '#missing');

      expect(warnSpy).toHaveBeenCalledWith('Element not found: #missing');
    });
  });

  describe('extractApplicationId', () => {
    it('should extract application ID from text', async () => {
      mockPage.textContent.mockResolvedValue(
        'Your application has been submitted. Application ID: APP-123456',
      );

      const result = await adapter['extractApplicationId'](mockPage);

      expect(result).toBe('APP-123456');
    });

    it('should extract reference number', async () => {
      mockPage.textContent.mockResolvedValue(
        'Reference Number: REF-789012',
      );

      const result = await adapter['extractApplicationId'](mockPage);

      expect(result).toBe('REF-789012');
    });

    it('should extract confirmation number', async () => {
      mockPage.textContent.mockResolvedValue(
        'Confirmation Number: CONF-456789',
      );

      const result = await adapter['extractApplicationId'](mockPage);

      expect(result).toBe('CONF-456789');
    });

    it('should return null when no ID pattern found', async () => {
      mockPage.textContent.mockResolvedValue('Application submitted successfully');

      const result = await adapter['extractApplicationId'](mockPage);

      expect(result).toBeNull();
    });

    it('should handle extraction errors', async () => {
      mockPage.textContent.mockRejectedValue(new Error('Page error'));

      const result = await adapter['extractApplicationId'](mockPage);

      expect(result).toBeNull();
    });

    it('should extract ID with various formats', async () => {
      const testCases = [
        { text: 'Application number: AB123CD', expected: 'AB123CD' },
        { text: 'Reference: 123-456-789', expected: '123-456-789' },
        { text: 'Confirmation id 9876543', expected: '9876543' },
      ];

      for (const testCase of testCases) {
        mockPage.textContent.mockResolvedValue(testCase.text);
        const result = await adapter['extractApplicationId'](mockPage);
        expect(result).toBe(testCase.expected);
      }
    });
  });

  describe('handleCustomQuestions', () => {
    it('should detect and answer custom questions', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'Why do you want this job?',
          semanticField: 'custom_question',
        },
        {
          selector: '#question-2',
          label: 'What are your strengths?',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter['handleCustomQuestions'](mockPage, mockApplicationData);

      expect(formMappingService.detectFormFields).toHaveBeenCalledWith(mockPage);
      expect(formMappingService.generateAIAnswer).toHaveBeenCalledTimes(2);
      expect(browserService.fillForm).toHaveBeenCalledTimes(2);
    });

    it('should skip questions without labels', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: null,
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter['handleCustomQuestions'](mockPage, mockApplicationData);

      expect(formMappingService.generateAIAnswer).not.toHaveBeenCalled();
    });

    it('should only process custom_question fields', async () => {
      const mockFields = [
        {
          selector: '#email',
          label: 'Email',
          semanticField: 'email',
        },
        {
          selector: '#question',
          label: 'Custom question',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter['handleCustomQuestions'](mockPage, mockApplicationData);

      expect(formMappingService.generateAIAnswer).toHaveBeenCalledTimes(1);
    });

    it('should add delay between answering questions', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'Question 1',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);

      await adapter['handleCustomQuestions'](mockPage, mockApplicationData);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(1000, 2000);
    });

    it('should handle errors during question processing', async () => {
      const mockFields = [
        {
          selector: '#question-1',
          label: 'Question 1',
          semanticField: 'custom_question',
        },
      ];
      formMappingService.detectFormFields.mockResolvedValue(mockFields);
      browserService.fillForm.mockRejectedValue(new Error('Fill failed'));

      await expect(
        adapter['handleCustomQuestions'](mockPage, mockApplicationData),
      ).rejects.toThrow('Fill failed');
    });
  });

  describe('scrollThroughPage', () => {
    it('should scroll to bottom of page', async () => {
      await adapter['scrollThroughPage'](mockPage);

      expect(browserService.scrollToBottom).toHaveBeenCalledWith(mockPage);
    });

    it('should add delay after scrolling', async () => {
      await adapter['scrollThroughPage'](mockPage);

      expect(browserService.humanLikeDelay).toHaveBeenCalledWith(500, 1000);
    });

    it('should handle scroll errors', async () => {
      browserService.scrollToBottom.mockRejectedValue(new Error('Scroll failed'));

      await expect(adapter['scrollThroughPage'](mockPage)).rejects.toThrow('Scroll failed');
    });
  });

  describe('abstract methods', () => {
    it('should implement detectPlatform', () => {
      expect(adapter.detectPlatform('https://test.com/job')).toBe(true);
      expect(adapter.detectPlatform('https://other.com/job')).toBe(false);
    });

    it('should implement apply', async () => {
      const result = await adapter.apply(mockApplicationData);

      expect(result.success).toBe(true);
      expect(result.applicationId).toBe('test-123');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete application flow', async () => {
      mockPage.textContent.mockResolvedValue('Application ID: TEST-999');

      await adapter['navigateToJob'](mockPage, 'https://test.com/job/123');
      await adapter['fillTextField'](mockPage, '#email', 'test@example.com');
      await adapter['uploadFile'](mockPage, '#resume', '/resume.pdf');
      await adapter['clickButton'](mockPage, '#submit');
      const appId = await adapter['extractApplicationId'](mockPage);
      const screenshot = await adapter['takeScreenshot'](mockPage, 'user-1', 'job-1');

      expect(appId).toBe('TEST-999');
      expect(screenshot).toBeDefined();
    });

    it('should handle errors gracefully throughout flow', async () => {
      browserService.navigateTo.mockRejectedValue(new Error('Network error'));

      await expect(
        adapter['navigateToJob'](mockPage, 'https://test.com/job'),
      ).rejects.toThrow('Network error');
    });
  });
});
