import {
  generateSearchCacheKey,
  generateJobDetailCacheKey,
  generateRecommendedCacheKey,
  generateSimilarJobsCacheKey,
  generateSavedJobsCacheKey,
  getSearchCachePattern,
  getJobRelatedCachePatterns,
  getUserRelatedCachePatterns,
  CacheKeyPrefixes,
  CacheTTL,
} from '../cache-keys.util';

describe('CacheKeyUtils', () => {
  describe('generateSearchCacheKey', () => {
    it('should generate consistent hash for same parameters', () => {
      const params1 = { keywords: 'software', location: 'New York', page: 1 };
      const params2 = { keywords: 'software', location: 'New York', page: 1 };

      const key1 = generateSearchCacheKey(params1);
      const key2 = generateSearchCacheKey(params2);

      expect(key1).toBe(key2);
      expect(key1).toMatch(new RegExp(`^${CacheKeyPrefixes.JOB_SEARCH}`));
    });

    it('should generate same hash regardless of parameter order', () => {
      const params1 = { keywords: 'software', location: 'New York' };
      const params2 = { location: 'New York', keywords: 'software' };

      expect(generateSearchCacheKey(params1)).toBe(generateSearchCacheKey(params2));
    });

    it('should generate different hash for different parameters', () => {
      const params1 = { keywords: 'software' };
      const params2 = { keywords: 'engineer' };

      expect(generateSearchCacheKey(params1)).not.toBe(generateSearchCacheKey(params2));
    });

    it('should exclude undefined and null values', () => {
      const params1 = { keywords: 'software', location: undefined };
      const params2 = { keywords: 'software' };

      expect(generateSearchCacheKey(params1)).toBe(generateSearchCacheKey(params2));
    });

    it('should exclude empty strings', () => {
      const params1 = { keywords: 'software', location: '' };
      const params2 = { keywords: 'software' };

      expect(generateSearchCacheKey(params1)).toBe(generateSearchCacheKey(params2));
    });
  });

  describe('generateJobDetailCacheKey', () => {
    it('should generate correct key for job ID', () => {
      const jobId = '123e4567-e89b-12d3-a456-426614174000';
      const key = generateJobDetailCacheKey(jobId);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_DETAIL}${jobId}`);
    });
  });

  describe('generateRecommendedCacheKey', () => {
    it('should generate correct key with user ID, page, and limit', () => {
      const userId = 'user-123';
      const key = generateRecommendedCacheKey(userId, 2, 10);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_RECOMMENDED}${userId}:2:10`);
    });

    it('should use default page and limit', () => {
      const userId = 'user-123';
      const key = generateRecommendedCacheKey(userId);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_RECOMMENDED}${userId}:1:20`);
    });
  });

  describe('generateSimilarJobsCacheKey', () => {
    it('should generate correct key with job ID and limit', () => {
      const jobId = 'job-123';
      const key = generateSimilarJobsCacheKey(jobId, 5);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_SIMILAR}${jobId}:5`);
    });

    it('should use default limit of 10', () => {
      const jobId = 'job-123';
      const key = generateSimilarJobsCacheKey(jobId);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_SIMILAR}${jobId}:10`);
    });
  });

  describe('generateSavedJobsCacheKey', () => {
    it('should generate correct key with user ID, page, and limit', () => {
      const userId = 'user-123';
      const key = generateSavedJobsCacheKey(userId, 3, 25);

      expect(key).toBe(`${CacheKeyPrefixes.JOB_SAVED}${userId}:3:25`);
    });
  });

  describe('getSearchCachePattern', () => {
    it('should return wildcard pattern for search cache', () => {
      expect(getSearchCachePattern()).toBe(`${CacheKeyPrefixes.JOB_SEARCH}*`);
    });
  });

  describe('getJobRelatedCachePatterns', () => {
    it('should return all patterns related to a job', () => {
      const jobId = 'job-123';
      const patterns = getJobRelatedCachePatterns(jobId);

      expect(patterns).toContain(`${CacheKeyPrefixes.JOB_DETAIL}${jobId}`);
      expect(patterns).toContain(`${CacheKeyPrefixes.JOB_SIMILAR}${jobId}:*`);
      expect(patterns).toContain(`${CacheKeyPrefixes.JOB_SEARCH}*`);
    });
  });

  describe('getUserRelatedCachePatterns', () => {
    it('should return all patterns related to a user', () => {
      const userId = 'user-123';
      const patterns = getUserRelatedCachePatterns(userId);

      expect(patterns).toContain(`${CacheKeyPrefixes.JOB_RECOMMENDED}${userId}:*`);
      expect(patterns).toContain(`${CacheKeyPrefixes.JOB_SAVED}${userId}:*`);
    });
  });

  describe('CacheTTL', () => {
    it('should have correct TTL values', () => {
      expect(CacheTTL.SEARCH_RESULTS).toBe(300); // 5 minutes
      expect(CacheTTL.JOB_DETAIL).toBe(3600); // 1 hour
      expect(CacheTTL.RECOMMENDED_JOBS).toBe(120); // 2 minutes
      expect(CacheTTL.SIMILAR_JOBS).toBe(600); // 10 minutes
      expect(CacheTTL.SAVED_JOBS).toBe(300); // 5 minutes
    });
  });
});
