/**
 * Rate Limiter Test - Validate rate limiting behavior and degraded mode
 *
 * Purpose: Test rate limiting functionality including Redis availability and fail-open mode
 * Load: Progressive increase to trigger rate limits
 * Success Criteria: Rate limits enforced correctly, graceful degradation when Redis unavailable
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config } from '../config.js';

// Custom metrics
const rateLimitRejections = new Counter('rate_limit_rejections');
const rateLimitAllowed = new Counter('rate_limit_allowed');
const rateLimitDegraded = new Counter('rate_limit_degraded');
const responseTime = new Trend('response_time');
const rateLimitHeaderPresent = new Rate('rate_limit_header_present');

export const options = {
  scenarios: {
    // Phase 1: Warm-up - Low traffic to establish baseline
    warmup: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      startTime: '0s',
      exec: 'normalTraffic',
    },
    // Phase 2: Rate limit testing - Increase load to trigger rate limits
    rateLimit: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 5 },
      ],
      startTime: '30s',
      exec: 'heavyTraffic',
    },
    // Phase 3: Burst testing - Rapid spike to test limits
    burst: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '10s', target: 50 }, // Spike
        { duration: '30s', target: 50 },
        { duration: '10s', target: 1 },
      ],
      startTime: '6m30s',
      exec: 'burstTraffic',
    },
  },
  thresholds: {
    'rate_limit_rejections': ['count>=0'], // Just track, don't fail
    'rate_limit_allowed': ['count>=10'], // Should allow some requests
    'response_time': ['p(95)<1000'], // 95% under 1s
    'http_req_failed': ['rate<0.25'], // Allow higher failure rate (rate limits)
    'rate_limit_header_present': ['rate>0.9'], // 90%+ responses should have rate limit headers
  },
};

let authToken = null;

export function setup() {
  console.log('🚀 Starting Rate Limit Test Setup...');

  // Login to get auth token
  const res = http.post(
    `${config.baseUrls.auth}/api/v1/auth/login`,
    JSON.stringify(config.testUsers.regular),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (res.status === 200 || res.status === 201) {
    try {
      const body = JSON.parse(res.body);
      authToken = body.accessToken || body.access_token;
      console.log('✅ Authentication successful');
    } catch (e) {
      console.error('❌ Failed to parse login response');
    }
  } else {
    console.warn(`⚠️  Login failed with status ${res.status}`);
  }

  return { authToken };
}

export function normalTraffic(data) {
  authToken = data.authToken;

  group('Normal Rate Limit Check', function () {
    const start = Date.now();
    const res = http.get(
      `${config.baseUrls.job}/api/v1/jobs?page=1&limit=10`,
      {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { name: 'NormalRateLimit', phase: 'warmup' },
      }
    );

    const duration = Date.now() - start;
    responseTime.add(duration);

    // Check for rate limit headers
    const hasRateLimitHeaders =
      res.headers['X-RateLimit-Limit'] !== undefined ||
      res.headers['x-ratelimit-limit'] !== undefined ||
      res.headers['RateLimit-Limit'] !== undefined;

    rateLimitHeaderPresent.add(hasRateLimitHeaders);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 1s': (r) => duration < 1000,
      'has rate limit headers': () => hasRateLimitHeaders,
    });

    if (res.status === 200) {
      rateLimitAllowed.add(1);
    } else if (res.status === 429) {
      rateLimitRejections.add(1);
      console.log(`🛑 Rate limit hit at normal traffic level`);
    }

    // Check if degraded mode header is present
    if (res.headers['X-RateLimit-Mode'] === 'degraded' ||
        res.headers['x-ratelimit-mode'] === 'degraded') {
      rateLimitDegraded.add(1);
      console.warn('⚠️  Rate limiting in degraded mode (Redis unavailable)');
    }
  });

  sleep(1 + Math.random()); // Random sleep 1-2s
}

export function heavyTraffic(data) {
  authToken = data.authToken;

  group('Heavy Rate Limit Testing', function () {
    // Make multiple rapid requests to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      const res = http.get(
        `${config.baseUrls.job}/api/v1/jobs?page=${i + 1}&limit=10`,
        {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
          tags: { name: 'HeavyRateLimit', phase: 'heavy', iteration: i },
        }
      );

      const duration = Date.now() - start;
      responseTime.add(duration);

      const hasRateLimitHeaders =
        res.headers['X-RateLimit-Limit'] !== undefined ||
        res.headers['x-ratelimit-limit'] !== undefined;

      rateLimitHeaderPresent.add(hasRateLimitHeaders);

      check(res, {
        'has response': (r) => r.status !== 0,
        'has rate limit headers': () => hasRateLimitHeaders,
      });

      if (res.status === 200) {
        rateLimitAllowed.add(1);
      } else if (res.status === 429) {
        rateLimitRejections.add(1);

        // Check for Retry-After header
        const retryAfter = res.headers['Retry-After'] || res.headers['retry-after'];
        if (retryAfter) {
          console.log(`🛑 Rate limited. Retry after: ${retryAfter}s`);
        } else {
          console.log(`🛑 Rate limited (no retry-after header)`);
        }
      }

      // Check for degraded mode
      if (res.headers['X-RateLimit-Mode'] === 'degraded') {
        rateLimitDegraded.add(1);
        console.warn('⚠️  Degraded mode active');
      }

      sleep(0.1); // Small delay between rapid requests
    }
  });

  sleep(0.5);
}

export function burstTraffic(data) {
  authToken = data.authToken;

  group('Burst Rate Limit Testing', function () {
    // Rapid-fire requests to definitely trigger rate limits
    const batchSize = 10;
    let allowed = 0;
    let rejected = 0;

    for (let i = 0; i < batchSize; i++) {
      const start = Date.now();
      const res = http.get(
        `${config.baseUrls.user}/api/v1/users/profile`,
        {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
          tags: { name: 'BurstRateLimit', phase: 'burst', request: i },
        }
      );

      const duration = Date.now() - start;
      responseTime.add(duration);

      const hasRateLimitHeaders =
        res.headers['X-RateLimit-Limit'] !== undefined ||
        res.headers['x-ratelimit-limit'] !== undefined;

      rateLimitHeaderPresent.add(hasRateLimitHeaders);

      if (res.status === 200) {
        allowed++;
        rateLimitAllowed.add(1);
      } else if (res.status === 429) {
        rejected++;
        rateLimitRejections.add(1);
      }

      // No sleep - truly burst testing
    }

    console.log(`📊 Burst batch complete: ${allowed} allowed, ${rejected} rejected`);
  });

  sleep(1);
}

export function teardown(data) {
  console.log('\n📊 Rate Limit Test Summary:');
  console.log('================================');
  console.log('Test completed successfully.');
  console.log('Expected behavior:');
  console.log('  - Warmup phase: Most requests allowed');
  console.log('  - Heavy phase: Some rate limit rejections (429)');
  console.log('  - Burst phase: Significant rate limit rejections');
  console.log('  - All phases: Rate limit headers present');
  console.log('  - Degraded mode: Only if Redis is unavailable');
  console.log('\nCheck Prometheus metrics for:');
  console.log('  - gateway_rate_limit_total{status="allowed|rejected|degraded"}');
  console.log('  - gateway_rate_limit_degraded_total');
  console.log('  - redis_operation_duration_seconds');
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'rate-limit-test-results.json': JSON.stringify(data),
  };

  // Analyze rate limiting behavior
  console.log('\n🔍 Rate Limit Analysis:');

  const allowed = data.metrics['rate_limit_allowed'];
  const rejected = data.metrics['rate_limit_rejections'];
  const degraded = data.metrics['rate_limit_degraded'];

  if (allowed) {
    console.log(`  ✅ Allowed Requests: ${allowed.values.count}`);
  }

  if (rejected) {
    console.log(`  🛑 Rejected Requests: ${rejected.values.count}`);
    const rejectionRate = rejected.values.count / (allowed.values.count + rejected.values.count) * 100;
    console.log(`  📈 Rejection Rate: ${rejectionRate.toFixed(2)}%`);
  }

  if (degraded && degraded.values.count > 0) {
    console.warn(`  ⚠️  Degraded Mode Events: ${degraded.values.count}`);
    console.warn(`  ⚠️  WARNING: Redis may be unavailable or experiencing issues`);
  } else {
    console.log(`  ✅ No degraded mode events (Redis healthy)`);
  }

  const headerPresence = data.metrics['rate_limit_header_present'];
  if (headerPresence) {
    console.log(`  📋 Rate Limit Headers: ${(headerPresence.values.rate * 100).toFixed(2)}% of responses`);
  }

  const avgResponseTime = data.metrics['response_time'];
  if (avgResponseTime) {
    console.log(`  ⏱️  Avg Response Time: ${avgResponseTime.values.avg.toFixed(2)}ms`);
    console.log(`  ⏱️  P95 Response Time: ${avgResponseTime.values['p(95)'].toFixed(2)}ms`);
  }

  return summary;
}

// Helper for text summary
function textSummary(data, opts) {
  const { indent = '', enableColors = false } = opts || {};
  let output = '\n' + indent + 'Rate Limit Test Results\n';
  output += indent + '========================\n\n';

  if (data.metrics.http_reqs) {
    output += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }

  if (data.metrics.http_req_duration) {
    output += indent + `Avg Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    output += indent + `P95 Duration: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  }

  return output;
}
