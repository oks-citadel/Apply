import { Test, TestingModule } from '@nestjs/testing';
import { BrowserService } from './browser.service';
import { chromium, Browser, BrowserContext, Page } from 'playwright';

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}));

describe('BrowserService', () => {
  let service: BrowserService;
  let mockBrowser: jest.Mocked<Browser>;
  let mockContext: jest.Mocked<BrowserContext>;
  let mockPage: jest.Mocked<Page>;

  beforeEach(async () => {
    // Create mock objects
    mockPage = {
      goto: jest.fn(),
      close: jest.fn(),
      isClosed: jest.fn().mockReturnValue(false),
      waitForLoadState: jest.fn(),
      screenshot: jest.fn(),
      $: jest.fn(),
      setExtraHTTPHeaders: jest.fn(),
      waitForSelector: jest.fn(),
      fill: jest.fn(),
      type: jest.fn(),
      click: jest.fn(),
      waitForTimeout: jest.fn(),
      selectOption: jest.fn(),
      setInputFiles: jest.fn(),
      evaluate: jest.fn(),
    } as any;

    mockContext = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
      addInitScript: jest.fn(),
    } as any;

    mockBrowser = {
      isConnected: jest.fn().mockReturnValue(true),
      newContext: jest.fn().mockResolvedValue(mockContext),
      close: jest.fn(),
    } as any;

    (chromium.launch as jest.Mock).mockResolvedValue(mockBrowser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [BrowserService],
    }).compile();

    service = module.get<BrowserService>(BrowserService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBrowser', () => {
    it('should launch a new browser instance', async () => {
      const browser = await service.getBrowser();

      expect(browser).toBe(mockBrowser);
      expect(chromium.launch).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should reuse existing connected browser', async () => {
      await service.getBrowser();
      await service.getBrowser();

      expect(chromium.launch).toHaveBeenCalledTimes(1);
    });

    it('should launch new browser if previous is not connected', async () => {
      await service.getBrowser();
      mockBrowser.isConnected.mockReturnValue(false);
      await service.getBrowser();

      expect(chromium.launch).toHaveBeenCalledTimes(2);
    });
  });

  describe('createContext', () => {
    it('should create a new browser context', async () => {
      const userId = 'test-user-id';

      const context = await service.createContext(userId);

      expect(context).toBe(mockContext);
      expect(mockBrowser.newContext).toHaveBeenCalledWith(expect.any(Object));
      expect(mockContext.addInitScript).toHaveBeenCalled();
    });

    it('should add anti-detection measures to context', async () => {
      const userId = 'test-user-id';

      await service.createContext(userId);

      expect(mockContext.addInitScript).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should store context in contexts map', async () => {
      const userId = 'test-user-id';

      await service.createContext(userId);
      const retrievedContext = await service.getContext(userId);

      expect(retrievedContext).toBe(mockContext);
    });
  });

  describe('getContext', () => {
    it('should return existing context for user', async () => {
      const userId = 'test-user-id';

      await service.createContext(userId);
      const context = await service.getContext(userId);

      expect(context).toBe(mockContext);
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(1);
    });

    it('should create new context if none exists', async () => {
      const userId = 'new-user-id';

      const context = await service.getContext(userId);

      expect(context).toBe(mockContext);
      expect(mockBrowser.newContext).toHaveBeenCalled();
    });
  });

  describe('createPage', () => {
    it('should create a new page', async () => {
      const userId = 'test-user-id';

      const page = await service.createPage(userId);

      expect(page).toBe(mockPage);
      expect(mockContext.newPage).toHaveBeenCalled();
    });

    it('should set extra HTTP headers on page', async () => {
      const userId = 'test-user-id';

      await service.createPage(userId);

      expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalledWith({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });
    });
  });

  describe('navigateTo', () => {
    it('should navigate to URL', async () => {
      const url = 'https://example.com';

      mockPage.goto.mockResolvedValue(null);

      await service.navigateTo(mockPage, url);

      expect(mockPage.goto).toHaveBeenCalledWith(url, expect.any(Object));
    });
  });

  describe('waitForNavigation', () => {
    it('should wait for DOM content loaded', async () => {
      await service.waitForNavigation(mockPage);

      expect(mockPage.waitForLoadState).toHaveBeenCalledWith('domcontentloaded');
    });
  });

  describe('takeScreenshot', () => {
    it('should take a full page screenshot', async () => {
      const path = 'test-screenshot.png';
      const buffer = Buffer.from('test');

      mockPage.screenshot.mockResolvedValue(buffer);

      const result = await service.takeScreenshot(mockPage, path);

      expect(result).toBe(buffer);
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path,
        fullPage: true,
      });
    });
  });

  describe('detectCaptcha', () => {
    it('should return true if CAPTCHA is detected', async () => {
      const mockElement = {} as any;
      mockPage.$.mockResolvedValue(mockElement);

      const result = await service.detectCaptcha(mockPage);

      expect(result).toBe(true);
    });

    it('should return false if no CAPTCHA is detected', async () => {
      mockPage.$.mockResolvedValue(null);

      const result = await service.detectCaptcha(mockPage);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockPage.$.mockRejectedValue(new Error('Element not found'));

      const result = await service.detectCaptcha(mockPage);

      expect(result).toBe(false);
    });

    it('should check multiple CAPTCHA selectors', async () => {
      mockPage.$.mockResolvedValue(null);

      await service.detectCaptcha(mockPage);

      expect(mockPage.$).toHaveBeenCalledWith('iframe[src*="recaptcha"]');
      expect(mockPage.$).toHaveBeenCalledWith('iframe[src*="hcaptcha"]');
      expect(mockPage.$).toHaveBeenCalledWith('.g-recaptcha');
    });
  });

  describe('closeContext', () => {
    it('should close context and remove from map', async () => {
      const userId = 'test-user-id';

      await service.createContext(userId);
      await service.closeContext(userId);

      expect(mockContext.close).toHaveBeenCalled();
    });

    it('should do nothing if context does not exist', async () => {
      await service.closeContext('non-existent-user');

      expect(mockContext.close).not.toHaveBeenCalled();
    });
  });

  describe('closePage', () => {
    it('should close page if not already closed', async () => {
      mockPage.isClosed.mockReturnValue(false);

      await service.closePage(mockPage);

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should not close page if already closed', async () => {
      mockPage.isClosed.mockReturnValue(true);

      await service.closePage(mockPage);

      expect(mockPage.close).not.toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all contexts and browser', async () => {
      await service.createContext('user1');
      await service.createContext('user2');

      await service.onModuleDestroy();

      expect(mockContext.close).toHaveBeenCalledTimes(2);
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle module destroy with no browser', async () => {
      const newService = new BrowserService();

      await expect(newService.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('fillForm', () => {
    it('should fill form field with value', async () => {
      const selector = '#name';
      const value = 'John Doe';

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.fillForm(mockPage, selector, value);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector, { timeout: 5000 });
      expect(mockPage.fill).toHaveBeenCalledWith(selector, '');
      expect(mockPage.type).toHaveBeenCalledWith(selector, value, { delay: 50 });
    });

    it('should use custom delay when provided', async () => {
      const selector = '#name';
      const value = 'John Doe';
      const delay = 100;

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.fillForm(mockPage, selector, value, delay);

      expect(mockPage.type).toHaveBeenCalledWith(selector, value, { delay: 100 });
    });

    it('should throw error if selector not found', async () => {
      const selector = '#invalid';
      const value = 'Test';

      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

      await expect(service.fillForm(mockPage, selector, value)).rejects.toThrow();
    });
  });

  describe('clickElement', () => {
    it('should click element with default delay', async () => {
      const selector = '#submit-button';

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.clickElement(mockPage, selector);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector, { timeout: 5000 });
      expect(mockPage.click).toHaveBeenCalledWith(selector);
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(100);
    });

    it('should use custom delay when provided', async () => {
      const selector = '#submit-button';
      const delay = 500;

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.clickElement(mockPage, selector, delay);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
    });

    it('should throw error if selector not found', async () => {
      const selector = '#invalid';

      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

      await expect(service.clickElement(mockPage, selector)).rejects.toThrow();
    });
  });

  describe('selectOption', () => {
    it('should select option from dropdown', async () => {
      const selector = '#country';
      const value = 'USA';

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.selectOption(mockPage, selector, value);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector, { timeout: 5000 });
      expect(mockPage.selectOption).toHaveBeenCalledWith(selector, value);
    });

    it('should throw error if selector not found', async () => {
      const selector = '#invalid';
      const value = 'Test';

      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

      await expect(service.selectOption(mockPage, selector, value)).rejects.toThrow();
    });
  });

  describe('uploadFile', () => {
    it('should upload file to input', async () => {
      const selector = '#resume-upload';
      const filePath = '/path/to/resume.pdf';

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.uploadFile(mockPage, selector, filePath);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector, { timeout: 5000 });
      expect(mockPage.setInputFiles).toHaveBeenCalledWith(selector, filePath);
    });

    it('should throw error if selector not found', async () => {
      const selector = '#invalid';
      const filePath = '/path/to/file.pdf';

      mockPage.waitForSelector.mockRejectedValue(new Error('Selector not found'));

      await expect(service.uploadFile(mockPage, selector, filePath)).rejects.toThrow();
    });
  });

  describe('scrollToBottom', () => {
    it('should scroll to bottom of page', async () => {
      mockPage.evaluate.mockResolvedValue(undefined);
      mockPage.waitForTimeout.mockResolvedValue(undefined);

      await service.scrollToBottom(mockPage);

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function));
      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(500);
    });
  });

  describe('humanLikeDelay', () => {
    it('should delay for random time within range', async () => {
      jest.useFakeTimers();

      const promise = service.humanLikeDelay(1000, 2000);

      jest.advanceTimersByTime(1500);
      await promise;

      jest.useRealTimers();
    });

    it('should use default min and max values', async () => {
      jest.useFakeTimers();

      const promise = service.humanLikeDelay();

      jest.advanceTimersByTime(2000);
      await promise;

      jest.useRealTimers();
    });
  });

  describe('browser lifecycle', () => {
    it('should handle multiple users with separate contexts', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      const context1 = await service.createContext(user1);
      const context2 = await service.createContext(user2);

      expect(context1).toBe(mockContext);
      expect(context2).toBe(mockContext);
      expect(mockBrowser.newContext).toHaveBeenCalledTimes(2);
    });

    it('should create pages for different users', async () => {
      const user1 = 'user1';
      const user2 = 'user2';

      await service.createPage(user1);
      await service.createPage(user2);

      expect(mockContext.newPage).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('should handle navigation errors', async () => {
      const url = 'https://invalid-url.com';
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'));

      await expect(service.navigateTo(mockPage, url)).rejects.toThrow('Navigation failed');
    });

    it('should handle screenshot errors', async () => {
      mockPage.screenshot.mockRejectedValue(new Error('Screenshot failed'));

      await expect(service.takeScreenshot(mockPage, 'test.png')).rejects.toThrow('Screenshot failed');
    });

    it('should handle browser launch errors', async () => {
      (chromium.launch as jest.Mock).mockRejectedValue(new Error('Failed to launch browser'));

      await expect(service.getBrowser()).rejects.toThrow('Failed to launch browser');
    });
  });

  describe('form interaction edge cases', () => {
    it('should handle timeout when waiting for selector', async () => {
      const selector = '#slow-element';
      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(service.fillForm(mockPage, selector, 'value')).rejects.toThrow('Timeout');
    });

    it('should clear field before typing', async () => {
      const selector = '#name';
      const value = 'John';

      mockPage.waitForSelector.mockResolvedValue(null);

      await service.fillForm(mockPage, selector, value);

      expect(mockPage.fill).toHaveBeenCalledWith(selector, '');
      expect(mockPage.type).toHaveBeenCalledWith(selector, value, expect.any(Object));
    });
  });
});
