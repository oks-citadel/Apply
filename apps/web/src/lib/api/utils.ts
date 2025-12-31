/**
 * API Utility Functions
 * Common patterns and helpers for API interactions
 */

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if still valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL (time-to-live in milliseconds)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    const keysToDelete: string[] = [];

    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

/**
 * Cached API call wrapper
 * Implements stale-while-revalidate pattern
 */
export async function cachedApiCall<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number; // Time-to-live in milliseconds (default: 5 minutes)
    forceRefresh?: boolean; // Force refresh even if cached
    onError?: (error: Error) => void; // Error callback
  } = {}
): Promise<T> {
  const { ttl = 5 * 60 * 1000, forceRefresh = false, onError } = options;

  // Return cached data if available and not forcing refresh
  if (!forceRefresh) {
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  try {
    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    apiCache.set(key, data, ttl);

    return data;
  } catch (error) {
    // Call error handler if provided
    if (onError && error instanceof Error) {
      onError(error);
    }

    // If we have stale data, return it
    const staleData = apiCache.get<T>(key);
    if (staleData !== null) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[API Cache] Returning stale data for key: ${key}`);
      }
      return staleData;
    }

    // Otherwise, rethrow the error
    throw error;
  }
}

/**
 * Debounce function for search/filter operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate-limited operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Build query string from object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString: string): Record<string, any> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, any> = {};

  params.forEach((value, key) => {
    if (result[key]) {
      // Convert to array if multiple values
      if (Array.isArray(result[key])) {
        result[key].push(value);
      } else {
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, acceptedTypes: string[]): boolean {
  return acceptedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Create cache key from URL and params
 */
export function createCacheKey(url: string, params?: Record<string, any>): string {
  if (!params) return url;

  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {} as Record<string, any>);

  return `${url}:${JSON.stringify(sortedParams)}`;
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Batch multiple API calls with Promise.all
 */
export async function batchApiCalls<T>(
  calls: Array<() => Promise<T>>,
  options: {
    concurrency?: number; // Max concurrent requests
    continueOnError?: boolean; // Continue even if one fails
  } = {}
): Promise<Array<T | Error>> {
  const { concurrency = 5, continueOnError = false } = options;

  if (!continueOnError) {
    // Fail fast - if any request fails, reject all
    return Promise.all(calls.map(call => call()));
  }

  // Process in batches with concurrency limit
  const results: Array<T | Error> = [];
  for (let i = 0; i < calls.length; i += concurrency) {
    const batch = calls.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch.map(call => call()));

    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push(result.reason);
      }
    });
  }

  return results;
}

/**
 * Retry a failed API call with exponential backoff
 */
export async function retryApiCall<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts or shouldn't retry this error
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed. Retrying in ${delay}ms...`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Poll an endpoint until a condition is met
 */
export async function pollUntil<T>(
  fetcher: () => Promise<T>,
  condition: (data: T) => boolean,
  options: {
    interval?: number; // Polling interval in ms
    timeout?: number; // Max time to poll in ms
    onUpdate?: (data: T) => void; // Callback on each update
  } = {}
): Promise<T> {
  const { interval = 2000, timeout = 60000, onUpdate } = options;

  const startTime = Date.now();

  while (true) {
    const data = await fetcher();

    if (onUpdate) {
      onUpdate(data);
    }

    if (condition(data)) {
      return data;
    }

    if (Date.now() - startTime > timeout) {
      throw new Error('Polling timeout exceeded');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Create an abort controller with timeout
 */
export function createAbortController(timeout: number): AbortController {
  const controller = new AbortController();

  setTimeout(() => {
    controller.abort();
  }, timeout);

  return controller;
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Remove empty values from object
 */
export function removeEmpty<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (!isEmpty(value)) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}
