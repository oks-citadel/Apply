// Mock playwright module before any tests run to avoid localStorage initialization issues
const mockPage = {};
const mockContext = {};
const mockBrowser = {};

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue(mockBrowser),
  },
  Browser: jest.fn(),
  BrowserContext: jest.fn(),
  Page: jest.fn(),
}), { virtual: true });
