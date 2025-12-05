import { LaunchOptions } from 'playwright';

export const browserConfig: LaunchOptions = {
  headless: process.env.BROWSER_HEADLESS !== 'false',
  slowMo: parseInt(process.env.BROWSER_SLOW_MO || '0'),
  timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
  ],
};

export const contextConfig = {
  viewport: { width: 1920, height: 1080 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  locale: 'en-US',
  timezoneId: 'America/New_York',
  ignoreHTTPSErrors: true,
};

export const navigationConfig = {
  waitUntil: 'domcontentloaded' as const,
  timeout: 60000,
};

export const formFillingConfig = {
  typingDelay: 50, // Delay between keystrokes in ms
  clickDelay: 100, // Delay after clicking in ms
  scrollDelay: 500, // Delay after scrolling in ms
};
