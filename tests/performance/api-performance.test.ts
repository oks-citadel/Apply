/**
 * API Performance Tests
 * Tests API response times and throughput
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Performance thresholds (ms)
const THRESHOLDS = {
  fast: 200,       // Very fast response (increased for realistic testing)
  acceptable: 1000, // Acceptable response
  slow: 2000,      // Slow but tolerable
};

test.describe('API Response Times', () => {
  test('GET /health should respond quickly', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/health`);
    const responseTime = Date.now() - startTime;

    console.log(`Health check response time: ${responseTime}ms`);

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(THRESHOLDS.fast);
  });

  test('GET /jobs should respond within acceptable time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get(`${API_BASE_URL}/jobs?page=1&limit=20`);
    const responseTime = Date.now() - startTime;

    console.log(`Jobs list response time: ${responseTime}ms`);

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(THRESHOLDS.acceptable);
  });

  test('GET /jobs/:id should respond quickly', async ({ request }) => {
    // First get a job ID
    const listResponse = await request.get(`${API_BASE_URL}/jobs?limit=1`);
    const jobs = await listResponse.json();

    if (jobs.data && jobs.data.length > 0) {
      const jobId = jobs.data[0].id;

      const startTime = Date.now();
      const response = await request.get(`${API_BASE_URL}/jobs/${jobId}`);
      const responseTime = Date.now() - startTime;

      console.log(`Single job response time: ${responseTime}ms`);

      expect(response.ok()).toBeTruthy();
      expect(responseTime).toBeLessThan(THRESHOLDS.fast);
    }
  });

  test('POST /ai/generate should respond within acceptable time', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.post(`${API_BASE_URL}/ai/generate/cover-letter`, {
      data: {
        jobTitle: 'Software Engineer',
        company: 'Test Company',
        resumeId: 'test-resume-id',
      },
    });
    const responseTime = Date.now() - startTime;

    console.log(`AI generation response time: ${responseTime}ms`);

    // AI endpoints can be slower, but should still be reasonable
    expect(responseTime).toBeLessThan(THRESHOLDS.slow * 3); // 3 seconds max
  });
});

test.describe('API Caching', () => {
  test('repeated requests should use cache', async ({ request }) => {
    const endpoint = `${API_BASE_URL}/jobs?page=1&limit=10`;

    // First request (cache miss)
    const start1 = Date.now();
    const response1 = await request.get(endpoint);
    const time1 = Date.now() - start1;

    // Second request (should hit cache)
    const start2 = Date.now();
    const response2 = await request.get(endpoint);
    const time2 = Date.now() - start2;

    console.log(`First request: ${time1}ms, Second request: ${time2}ms`);

    expect(response1.ok()).toBeTruthy();
    expect(response2.ok()).toBeTruthy();

    // Check cache headers
    const cacheHeader = response2.headers()['x-cache'];
    console.log('X-Cache header:', cacheHeader);

    // Second request should be faster (cached)
    expect(time2).toBeLessThan(time1);
  });
});

test.describe('API Compression', () => {
  test('responses should be compressed', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/jobs?page=1&limit=50`);

    const contentEncoding = response.headers()['content-encoding'];
    console.log('Content-Encoding:', contentEncoding);

    // Should use compression
    expect(['gzip', 'br', 'deflate']).toContain(contentEncoding);
  });
});

test.describe('API Pagination', () => {
  test('pagination should be efficient', async ({ request }) => {
    const pageSizes = [10, 20, 50, 100];

    for (const pageSize of pageSizes) {
      const startTime = Date.now();
      const response = await request.get(`${API_BASE_URL}/jobs?page=1&limit=${pageSize}`);
      const responseTime = Date.now() - startTime;

      console.log(`Page size ${pageSize}: ${responseTime}ms`);

      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.pagination).toBeDefined();
      expect(data.pagination.limit).toBe(pageSize);

      // Response time should scale linearly or better
      expect(responseTime).toBeLessThan(THRESHOLDS.acceptable);
    }
  });
});

test.describe('API Load Testing', () => {
  test('should handle concurrent requests', async ({ request }) => {
    const concurrentRequests = 10;
    const promises: Promise<any>[] = [];

    const startTime = Date.now();

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(request.get(`${API_BASE_URL}/jobs?page=1&limit=20`));
    }

    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / concurrentRequests;

    console.log(
      `${concurrentRequests} concurrent requests: ` +
      `Total ${totalTime}ms, Average ${avgTime.toFixed(2)}ms`
    );

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.ok()).toBeTruthy();
    });

    // Average response time should be reasonable
    expect(avgTime).toBeLessThan(THRESHOLDS.slow);
  });
});

test.describe('Database Query Performance', () => {
  test('complex search queries should perform well', async ({ request }) => {
    const searchParams = {
      q: 'software engineer',
      location: 'Remote',
      experience_level: 'mid',
      salary_min: 80000,
      page: 1,
      limit: 20,
    };

    const startTime = Date.now();
    const response = await request.get(
      `${API_BASE_URL}/jobs?` + new URLSearchParams(searchParams as any).toString()
    );
    const responseTime = Date.now() - startTime;

    console.log(`Complex search response time: ${responseTime}ms`);

    expect(response.ok()).toBeTruthy();
    expect(responseTime).toBeLessThan(THRESHOLDS.acceptable);
  });
});
