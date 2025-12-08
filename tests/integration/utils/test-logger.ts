/**
 * Test logger utility
 * Simple console-based logger for test output
 */

export class TestLogger {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.TEST_DEBUG === 'true';
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(`[TEST INFO] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error(`[TEST ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(`[TEST WARN] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(`[TEST DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new TestLogger();
