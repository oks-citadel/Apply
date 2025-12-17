import * as crypto from 'crypto';

/**
 * Cache key prefixes for different cache types
 */
export const CacheKeyPrefixes = {
  JOB_SEARCH: 'job:search:',
  JOB_DETAIL: 'job:detail:',
  JOB_RECOMMENDED: 'job:recommended:',
  JOB_SIMILAR: 'job:similar:',
  JOB_SAVED: 'job:saved:',
} as const;

/**
 * Cache TTL values in seconds
 */
export const CacheTTL = {
  /** 5 minutes for search results */
  SEARCH_RESULTS: 300,
  /** 1 hour for individual job details */
  JOB_DETAIL: 3600,
  /** 2 minutes for recommended jobs (personalized, should be fresher) */
  RECOMMENDED_JOBS: 120,
  /** 10 minutes for similar jobs */
  SIMILAR_JOBS: 600,
  /** 5 minutes for saved jobs list */
  SAVED_JOBS: 300,
} as const;

/**
 * Generate a hash from search parameters for use as cache key
 * @param params - Object containing search parameters
 * @returns MD5 hash string of the parameters
 */
export function generateSearchCacheKey(params: Record<string, any>): string {
  // Sort keys to ensure consistent hashing regardless of parameter order
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      // Only include defined values
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        acc[key] = params[key];
      }
      return acc;
    }, {} as Record<string, any>);

  const paramsString = JSON.stringify(sortedParams);
  const hash = crypto.createHash('md5').update(paramsString).digest('hex');
  return `${CacheKeyPrefixes.JOB_SEARCH}${hash}`;
}

/**
 * Generate cache key for individual job lookup
 * @param jobId - The job ID
 * @returns Cache key string
 */
export function generateJobDetailCacheKey(jobId: string): string {
  return `${CacheKeyPrefixes.JOB_DETAIL}${jobId}`;
}

/**
 * Generate cache key for recommended jobs
 * @param userId - The user ID
 * @param page - Page number
 * @param limit - Items per page
 * @returns Cache key string
 */
export function generateRecommendedCacheKey(userId: string, page: number = 1, limit: number = 20): string {
  return `${CacheKeyPrefixes.JOB_RECOMMENDED}${userId}:${page}:${limit}`;
}

/**
 * Generate cache key for similar jobs
 * @param jobId - The job ID
 * @param limit - Number of similar jobs
 * @returns Cache key string
 */
export function generateSimilarJobsCacheKey(jobId: string, limit: number = 10): string {
  return `${CacheKeyPrefixes.JOB_SIMILAR}${jobId}:${limit}`;
}

/**
 * Generate cache key for user's saved jobs
 * @param userId - The user ID
 * @param page - Page number
 * @param limit - Items per page
 * @returns Cache key string
 */
export function generateSavedJobsCacheKey(userId: string, page: number = 1, limit: number = 20): string {
  return `${CacheKeyPrefixes.JOB_SAVED}${userId}:${page}:${limit}`;
}

/**
 * Generate pattern for invalidating all search caches
 * @returns Pattern string for Redis SCAN/KEYS
 */
export function getSearchCachePattern(): string {
  return `${CacheKeyPrefixes.JOB_SEARCH}*`;
}

/**
 * Generate pattern for invalidating all caches related to a specific job
 * @param jobId - The job ID
 * @returns Array of cache key patterns
 */
export function getJobRelatedCachePatterns(jobId: string): string[] {
  return [
    `${CacheKeyPrefixes.JOB_DETAIL}${jobId}`,
    `${CacheKeyPrefixes.JOB_SIMILAR}${jobId}:*`,
    `${CacheKeyPrefixes.JOB_SEARCH}*`, // All search results need invalidation
  ];
}

/**
 * Generate pattern for invalidating all caches related to a specific user
 * @param userId - The user ID
 * @returns Array of cache key patterns
 */
export function getUserRelatedCachePatterns(userId: string): string[] {
  return [
    `${CacheKeyPrefixes.JOB_RECOMMENDED}${userId}:*`,
    `${CacheKeyPrefixes.JOB_SAVED}${userId}:*`,
  ];
}
