import * as dotenv from 'dotenv';
import { getEnvironment, Environment } from './environment';

export interface ConfigOptions {
  envPath?: string;
  required?: string[];
}

/**
 * Configuration service for managing environment variables
 */
export class ConfigService {
  private config: Map<string, string> = new Map();
  private readonly environment: Environment;

  constructor(options: ConfigOptions = {}) {
    // Load .env file
    if (options.envPath) {
      dotenv.config({ path: options.envPath });
    } else {
      dotenv.config();
    }

    this.environment = getEnvironment();

    // Load all environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        this.config.set(key, value);
      }
    }

    // Validate required variables
    if (options.required) {
      this.validateRequired(options.required);
    }
  }

  /**
   * Get a configuration value
   */
  get<T = string>(key: string, defaultValue?: T): T {
    const value = this.config.get(key);
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value as unknown as T;
  }

  /**
   * Get a string configuration value
   */
  getString(key: string, defaultValue?: string): string {
    return this.get<string>(key, defaultValue);
  }

  /**
   * Get a number configuration value
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = this.config.get(key);
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Configuration key "${key}" not found`);
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new Error(`Configuration key "${key}" is not a valid number`);
    }
    return parsed;
  }

  /**
   * Get a boolean configuration value
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.config.get(key);
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value.toLowerCase() === 'true' || value === '1';
  }

  /**
   * Check if a configuration key exists
   */
  has(key: string): boolean {
    return this.config.has(key);
  }

  /**
   * Get the current environment
   */
  getEnvironment(): Environment {
    return this.environment;
  }

  /**
   * Validate that required keys are present
   */
  private validateRequired(keys: string[]): void {
    const missing = keys.filter(key => !this.config.has(key));
    if (missing.length > 0) {
      throw new Error(`Missing required configuration keys: ${missing.join(', ')}`);
    }
  }
}
