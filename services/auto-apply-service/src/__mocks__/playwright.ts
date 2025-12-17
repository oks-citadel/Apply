// Mock playwright module to avoid localStorage initialization issues in tests
export interface Page {}
export interface Browser {}
export interface BrowserContext {}

export const chromium = {
  launch: jest.fn(),
};
