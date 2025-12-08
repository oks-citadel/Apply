import { Page, expect } from '@playwright/test';

/**
 * Test Helper Utilities
 *
 * Collection of reusable utility functions for E2E tests
 */

/**
 * Wait for a specific amount of time
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}.${timestamp}.${random}@example.com`;
}

/**
 * Generate a unique username
 */
export function generateUniqueUsername(prefix: string = 'user'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Generate a random string
 */
export function generateRandomString(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Wait for element to be visible with custom timeout
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for element to be hidden
 */
export async function waitForElementToHide(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await page.locator(selector).waitFor({ state: 'hidden', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for URL to match pattern
 */
export async function waitForUrl(
  page: Page,
  pattern: string | RegExp,
  timeout: number = 10000
): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
}

/**
 * Take a screenshot with custom name
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  path?: string
): Promise<void> {
  const screenshotPath = path || `screenshots/${name}-${Date.now()}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: true });
}

/**
 * Scroll to element
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * Scroll to bottom of page
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}

/**
 * Scroll to top of page
 */
export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, 0));
}

/**
 * Get element count
 */
export async function getElementCount(page: Page, selector: string): Promise<number> {
  return await page.locator(selector).count();
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await getElementCount(page, selector);
  return count > 0;
}

/**
 * Get element text
 */
export async function getElementText(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector);
  return (await element.textContent()) || '';
}

/**
 * Get element attribute
 */
export async function getElementAttribute(
  page: Page,
  selector: string,
  attribute: string
): Promise<string | null> {
  const element = page.locator(selector);
  return await element.getAttribute(attribute);
}

/**
 * Click element and wait for navigation
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string
): Promise<void> {
  await Promise.all([
    page.waitForNavigation(),
    page.locator(selector).click(),
  ]);
}

/**
 * Fill form field
 */
export async function fillField(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.locator(selector).fill(value);
}

/**
 * Clear form field
 */
export async function clearField(page: Page, selector: string): Promise<void> {
  await page.locator(selector).clear();
}

/**
 * Select dropdown option by value
 */
export async function selectOption(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  await page.locator(selector).selectOption(value);
}

/**
 * Check checkbox
 */
export async function checkCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
}

/**
 * Uncheck checkbox
 */
export async function uncheckCheckbox(page: Page, selector: string): Promise<void> {
  const checkbox = page.locator(selector);
  if (await checkbox.isChecked()) {
    await checkbox.uncheck();
  }
}

/**
 * Upload file
 */
export async function uploadFile(
  page: Page,
  selector: string,
  filePath: string
): Promise<void> {
  await page.locator(selector).setInputFiles(filePath);
}

/**
 * Press keyboard key
 */
export async function pressKey(page: Page, key: string): Promise<void> {
  await page.keyboard.press(key);
}

/**
 * Type text with delay
 */
export async function typeText(
  page: Page,
  selector: string,
  text: string,
  delayMs: number = 50
): Promise<void> {
  await page.locator(selector).pressSequentially(text, { delay: delayMs });
}

/**
 * Hover over element
 */
export async function hoverElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).hover();
}

/**
 * Double click element
 */
export async function doubleClick(page: Page, selector: string): Promise<void> {
  await page.locator(selector).dblclick();
}

/**
 * Right click element
 */
export async function rightClick(page: Page, selector: string): Promise<void> {
  await page.locator(selector).click({ button: 'right' });
}

/**
 * Wait for element to be enabled
 */
export async function waitForEnabled(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await page.locator(selector).waitFor({ state: 'visible', timeout });
  await expect(page.locator(selector)).toBeEnabled({ timeout });
}

/**
 * Wait for element to be disabled
 */
export async function waitForDisabled(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toBeDisabled({ timeout });
}

/**
 * Get current URL
 */
export function getCurrentUrl(page: Page): string {
  return page.url();
}

/**
 * Reload page
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
  await waitForNetworkIdle(page);
}

/**
 * Go back in browser history
 */
export async function goBack(page: Page): Promise<void> {
  await page.goBack();
  await waitForNetworkIdle(page);
}

/**
 * Go forward in browser history
 */
export async function goForward(page: Page): Promise<void> {
  await page.goForward();
  await waitForNetworkIdle(page);
}

/**
 * Set viewport size
 */
export async function setViewport(
  page: Page,
  width: number,
  height: number
): Promise<void> {
  await page.setViewportSize({ width, height });
}

/**
 * Get local storage item
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => localStorage.getItem(k), key);
}

/**
 * Set local storage item
 */
export async function setLocalStorage(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.evaluate(
    ({ k, v }) => localStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Get session storage item
 */
export async function getSessionStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => sessionStorage.getItem(k), key);
}

/**
 * Set session storage item
 */
export async function setSessionStorage(
  page: Page,
  key: string,
  value: string
): Promise<void> {
  await page.evaluate(
    ({ k, v }) => sessionStorage.setItem(k, v),
    { k: key, v: value }
  );
}

/**
 * Clear session storage
 */
export async function clearSessionStorage(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.clear());
}

/**
 * Execute custom JavaScript
 */
export async function executeScript<T>(page: Page, script: string): Promise<T> {
  return await page.evaluate(script);
}

/**
 * Wait for condition
 */
export async function waitForCondition(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await delay(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Retry operation
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await delay(delayMs);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Log test step
 */
export function logStep(message: string): void {
  console.log(`[TEST STEP] ${message}`);
}

/**
 * Log test info
 */
export function logInfo(message: string): void {
  console.log(`[INFO] ${message}`);
}

/**
 * Log test warning
 */
export function logWarning(message: string): void {
  console.warn(`[WARNING] ${message}`);
}

/**
 * Log test error
 */
export function logError(message: string): void {
  console.error(`[ERROR] ${message}`);
}

/**
 * Format date for input fields
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format month for input fields (YYYY-MM)
 */
export function formatMonthForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}

/**
 * Generate test data ID
 */
export function generateTestDataId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${generateRandomString(6)}`;
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

/**
 * Check if running in CI
 */
export function isCI(): boolean {
  return process.env.CI === 'true';
}

/**
 * Check if running in debug mode
 */
export function isDebug(): boolean {
  return process.env.DEBUG === 'true';
}

/**
 * Get base URL
 */
export function getBaseUrl(): string {
  return process.env.BASE_URL || 'http://localhost:3000';
}

/**
 * Get API URL
 */
export function getApiUrl(): string {
  return process.env.TEST_API_URL || 'http://localhost:4000';
}
