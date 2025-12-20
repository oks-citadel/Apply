import { Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import type { JobSource } from '../entities/job-source.entity';
import type {
  IJobAdapter,
  FetchOptions,
  FetchResult,
  NormalizedJob,
  HealthCheckResult,
} from '../interfaces/job-adapter.interface';
import type { HttpService } from '@nestjs/axios';
import type { AxiosRequestConfig } from 'axios';

/**
 * Base adapter class with common functionality for all job source adapters
 */
export abstract class BaseJobAdapter implements IJobAdapter {
  protected readonly logger: Logger;
  protected source: JobSource;
  protected httpService: HttpService;

  constructor(httpService: HttpService) {
    this.httpService = httpService;
    this.logger = new Logger(this.constructor.name);
  }

  abstract getName(): string;
  abstract getProvider(): string;
  abstract fetchJobs(options?: FetchOptions): Promise<FetchResult>;
  abstract normalizeJob(rawJob: any): NormalizedJob;

  async initialize(source: JobSource): Promise<void> {
    this.source = source;
    this.logger.log(`Initialized adapter for ${this.getName()}`);

    // Validate credentials if required
    const isValid = await this.validateCredentials();
    if (!isValid) {
      throw new Error(`Invalid credentials for ${this.getName()}`);
    }
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.isHealthy;
    } catch (error) {
      this.logger.error(`Credential validation failed: ${error.message}`);
      return false;
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      // Default implementation - subclasses should override
      const testFetch = await this.fetchJobs({ pageSize: 1 });
      const latency = Date.now() - start;

      return {
        isHealthy: testFetch.jobs.length >= 0,
        latencyMs: latency,
        message: 'Health check passed',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - start,
        message: error.message,
        details: { error: error.stack },
        timestamp: new Date(),
      };
    }
  }

  async getRateLimitInfo(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    // Default implementation - subclasses should override with actual rate limit info
    const config = this.source.config || {};
    const requestsPerMinute = config.requests_per_minute || 60;

    return {
      limit: requestsPerMinute,
      remaining: requestsPerMinute - (this.source.requests_this_minute || 0),
      reset: new Date(Date.now() + 60000), // 1 minute from now
    };
  }

  /**
   * Make an HTTP request with rate limiting and retry logic
   */
  protected async makeRequest<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    await this.checkRateLimit();

    const requestConfig: AxiosRequestConfig = {
      ...config,
      timeout: this.source.config?.timeout_ms || 30000,
      headers: {
        'User-Agent':
          this.source.config?.user_agent ||
          'ApplyForUs Job Aggregator/1.0',
        ...this.source.config?.headers,
        ...config?.headers,
      },
    };

    const maxRetries = this.source.config?.retry_attempts || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.debug(`Making request to ${url} (attempt ${attempt})`);
        const response = await firstValueFrom(
          this.httpService.request<T>({ ...requestConfig, url }),
        );

        // Update rate limit tracking
        await this.updateRateLimitTracking();

        return response.data;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Request failed (attempt ${attempt}/${maxRetries}): ${error.message}`,
        );

        if (attempt < maxRetries) {
          const delay =
            (this.source.config?.retry_delay_ms || 1000) * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Request failed after ${maxRetries} attempts: ${lastError.message}`,
    );
  }

  /**
   * Check if we're within rate limits
   */
  protected async checkRateLimit(): Promise<void> {
    const config = this.source.config || {};

    // Check per-minute limit
    if (config.requests_per_minute) {
      if (this.source.requests_this_minute >= config.requests_per_minute) {
        const waitTime = 60000; // Wait 1 minute
        this.logger.warn(
          `Rate limit reached (${config.requests_per_minute}/min). Waiting ${waitTime}ms`,
        );
        await this.sleep(waitTime);
      }
    }

    // Check per-hour limit
    if (config.requests_per_hour) {
      if (this.source.requests_this_hour >= config.requests_per_hour) {
        const waitTime = 3600000; // Wait 1 hour
        this.logger.warn(
          `Hourly rate limit reached (${config.requests_per_hour}/hour). Waiting ${waitTime}ms`,
        );
        await this.sleep(waitTime);
      }
    }

    // Check per-day limit
    if (config.requests_per_day) {
      if (this.source.requests_today >= config.requests_per_day) {
        throw new Error(
          `Daily rate limit reached (${config.requests_per_day}/day). Please try tomorrow.`,
        );
      }
    }
  }

  /**
   * Update rate limit tracking (should be called by the service)
   */
  protected async updateRateLimitTracking(): Promise<void> {
    // This is a placeholder - the actual tracking should be done by the service
    // that manages the JobSource entity
    this.logger.debug('Rate limit tracking updated');
  }

  /**
   * Extract authentication headers based on credentials
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    const credentials = this.source.credentials || {};

    if (credentials.api_key) {
      headers['Authorization'] = `Bearer ${credentials.api_key}`;
    } else if (credentials.access_token) {
      headers['Authorization'] = `Bearer ${credentials.access_token}`;
    } else if (credentials.username && credentials.password) {
      const auth = Buffer.from(
        `${credentials.username}:${credentials.password}`,
      ).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    return headers;
  }

  /**
   * Build query parameters from fetch options
   */
  protected buildQueryParams(options?: FetchOptions): Record<string, any> {
    const params: Record<string, any> = {};

    if (options?.page) {params.page = options.page;}
    if (options?.pageSize) {params.limit = options.pageSize;}
    if (options?.pageToken) {params.pageToken = options.pageToken;}
    if (options?.location) {params.location = options.location;}
    if (options?.keywords?.length) {params.q = options.keywords.join(' ');}
    if (options?.startDate) {params.fromDate = options.startDate.toISOString();}
    if (options?.endDate) {params.toDate = options.endDate.toISOString();}

    return params;
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean location string
   */
  protected cleanLocation(location: string): {
    city?: string;
    state?: string;
    country?: string;
  } {
    if (!location) {return {};}

    const parts = location.split(',').map((p) => p.trim());

    if (parts.length === 1) {
      return { city: parts[0] };
    } else if (parts.length === 2) {
      return { city: parts[0], state: parts[1] };
    } else if (parts.length >= 3) {
      return { city: parts[0], state: parts[1], country: parts[2] };
    }

    return {};
  }

  /**
   * Extract salary range from text
   */
  protected extractSalary(salaryText: string): {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  } {
    if (!salaryText) {return {};}

    const result: any = {};

    // Extract currency
    const currencyMatch = salaryText.match(/\$|USD|EUR|GBP|CAD|AUD/i);
    if (currencyMatch) {
      result.currency = currencyMatch[0].toUpperCase().replace('$', 'USD');
    }

    // Extract period
    if (/year|annually|annual|yr|pa/i.test(salaryText)) {
      result.period = 'yearly';
    } else if (/month|monthly/i.test(salaryText)) {
      result.period = 'monthly';
    } else if (/hour|hourly|hr/i.test(salaryText)) {
      result.period = 'hourly';
    }

    // Extract numbers
    const numbers = salaryText.match(/\d+[,\d]*/g);
    if (numbers && numbers.length > 0) {
      const values = numbers.map((n) => parseInt(n.replace(/,/g, '')));
      result.min = Math.min(...values);
      if (values.length > 1) {
        result.max = Math.max(...values);
      }
    }

    return result;
  }

  /**
   * Detect remote type from text
   */
  protected detectRemoteType(text: string): 'onsite' | 'remote' | 'hybrid' {
    if (!text) {return 'onsite';}

    const lowerText = text.toLowerCase();

    if (
      lowerText.includes('remote') &&
      (lowerText.includes('hybrid') || lowerText.includes('flexible'))
    ) {
      return 'hybrid';
    }

    if (
      lowerText.includes('remote') ||
      lowerText.includes('work from home') ||
      lowerText.includes('wfh')
    ) {
      return 'remote';
    }

    return 'onsite';
  }

  async cleanup?(): Promise<void> {
    this.logger.log(`Cleaning up adapter for ${this.getName()}`);
  }
}
