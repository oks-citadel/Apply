/**
 * Spike Test - Sudden traffic surge handling
 *
 * Purpose: Validate system behavior during sudden traffic spikes
 * Load: Sudden jump from 5 to 100 VUs
 * Success Criteria: System remains stable, autoscaling works, no cascading failures
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config, randomSleep } from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const spikePhaseErrors = new Rate('spike_phase_errors');
const requestDuration = new Trend('request_duration');

export const options = {
  scenarios: {
    spike_test: config.scenarios.spike,
  },
  thresholds: {
    'errors': ['rate<0.10'], // Allow 10% errors during spike
    'spike_phase_errors': ['rate<0.15'], // 15% errors during peak spike
    'http_req_duration': ['p(95)<10000'], // More lenient during spike
    'http_req_failed': ['rate<0.10'],
  },
};

let authToken = null;

export function setup() {
  console.log('🚀 Starting Spike Test - Simulating Black Friday/Product Hunt launch traffic');
  return { startTime: Date.now() };
}

export default function (data) {
  const currentVUs = __VU;
  const isSpike = __ITER > 2 && __ITER < 8; // During spike phase

  // Quick login if needed
  if (!authToken) {
    const res = http.post(
      `${config.baseUrls.auth}/api/v1/auth/login`,
      JSON.stringify(config.testUsers.regular),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Login', spike: isSpike },
      }
    );

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        authToken = body.accessToken || body.access_token;
      } catch (e) {}
    }
  }

  // Simulated user journey during spike
  group('Spike Traffic Pattern', function () {
    // 1. Homepage/Job Search (Most common action)
    const start1 = Date.now();
    const searchRes = http.get(
      `${config.baseUrls.job}/api/v1/jobs?keyword=engineer&page=1&limit=20`,
      {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { name: 'JobSearch', spike: isSpike },
      }
    );
    requestDuration.add(Date.now() - start1);

    const searchSuccess = check(searchRes, {
      'search status ok': (r) => r.status === 200 || r.status === 429, // Accept rate limiting
      'search response time acceptable': (r) => r.timings.duration < 10000,
    });

    if (!searchSuccess) {
      errorRate.add(1);
      if (isSpike) spikePhaseErrors.add(1);
    }

    sleep(randomSleep(0.5, 2));

    // 2. View Job Details (60% of users)
    if (Math.random() < 0.6) {
      const jobId = Math.floor(Math.random() * 100);
      const detailRes = http.get(
        `${config.baseUrls.job}/api/v1/jobs/${jobId}`,
        {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
          tags: { name: 'JobDetails', spike: isSpike },
        }
      );

      const detailSuccess = check(detailRes, {
        'detail status ok': (r) => r.status === 200 || r.status === 404 || r.status === 429,
      });

      if (!detailSuccess) {
        errorRate.add(1);
        if (isSpike) spikePhaseErrors.add(1);
      }

      sleep(randomSleep(0.5, 1.5));
    }

    // 3. Check Profile (30% of users, if authenticated)
    if (authToken && Math.random() < 0.3) {
      const profileRes = http.get(
        `${config.baseUrls.user}/api/v1/profile`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          tags: { name: 'Profile', spike: isSpike },
        }
      );

      check(profileRes, {
        'profile accessible': (r) => r.status === 200 || r.status === 429,
      });

      sleep(randomSleep(0.3, 1));
    }

    // 4. Analytics tracking (passive, should always work)
    const analyticsRes = http.post(
      `${config.baseUrls.analytics}/api/v1/events`,
      JSON.stringify({
        event: 'page_view',
        page: '/jobs',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Analytics', spike: isSpike },
      }
    );

    check(analyticsRes, {
      'analytics captured': (r) => r.status === 200 || r.status === 201 || r.status === 202 || r.status === 429,
    });
  });

  // Minimal sleep during spike to maximize load
  sleep(isSpike ? randomSleep(0.1, 0.5) : randomSleep(1, 3));
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`\n⚡ Spike Test completed in ${duration.toFixed(2)}s`);
  console.log('Expected observations:');
  console.log('  ✓ Rate limiting should activate (429 responses)');
  console.log('  ✓ Autoscaling should trigger');
  console.log('  ✓ Circuit breakers may open briefly');
  console.log('  ✓ System should recover after spike');
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'spike-test-results.json': JSON.stringify(data),
  };

  console.log('\n📈 Spike Test Analysis:');
  console.log('======================');

  // Analyze error rates
  if (data.metrics['errors']) {
    const overallErrors = data.metrics['errors'].values.rate * 100;
    console.log(`  Overall Error Rate: ${overallErrors.toFixed(2)}%`);
  }

  if (data.metrics['spike_phase_errors']) {
    const spikeErrors = data.metrics['spike_phase_errors'].values.rate * 100;
    console.log(`  Spike Phase Error Rate: ${spikeErrors.toFixed(2)}%`);
  }

  // Analyze response times
  if (data.metrics['http_req_duration']) {
    const p95 = data.metrics['http_req_duration'].values['p(95)'];
    const p99 = data.metrics['http_req_duration'].values['p(99)'];
    console.log(`  P95 Response Time: ${p95.toFixed(2)}ms`);
    console.log(`  P99 Response Time: ${p99.toFixed(2)}ms`);
  }

  return summary;
}
