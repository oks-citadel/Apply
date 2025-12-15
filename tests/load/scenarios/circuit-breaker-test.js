/**
 * Circuit Breaker Test - Validate resilience patterns
 *
 * Purpose: Test circuit breaker behavior under high error rates
 * Load: Gradually increase error-inducing requests
 * Success Criteria: Circuit breakers open appropriately, system remains stable
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config } from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const circuitBreakerOpen = new Gauge('circuit_breaker_open');
const fallbackExecuted = new Counter('fallback_executed');
const requestDuration = new Trend('request_duration');

export const options = {
  scenarios: {
    // Phase 1: Normal load to establish baseline
    normal_load: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      startTime: '0s',
    },
    // Phase 2: Introduce errors to trip circuit breaker
    error_load: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
      startTime: '2m',
      exec: 'errorPhase',
    },
    // Phase 3: Recovery phase
    recovery: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      startTime: '5m',
    },
  },
  thresholds: {
    'errors': ['rate<0.50'], // Allow higher error rate during error phase
    'http_req_duration': ['p(95)<5000'], // More lenient during circuit breaker testing
    'circuit_breaker_open': ['value>=0'], // Just track, don't fail
  },
};

let authToken = null;

export function setup() {
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
    } catch (e) {
      console.error('Failed to parse login response');
    }
  }

  return { authToken };
}

export default function (data) {
  authToken = data.authToken;

  group('Normal Requests', function () {
    // Make normal requests to job service
    const start = Date.now();
    const res = http.get(
      `${config.baseUrls.job}/api/v1/jobs?page=1&limit=10`,
      {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { name: 'NormalJobSearch', phase: 'normal' },
      }
    );

    requestDuration.add(Date.now() - start);

    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (!success) {
      errorRate.add(1);
    }

    // Check for circuit breaker state in response headers
    if (res.headers['X-Circuit-Breaker-State']) {
      const state = res.headers['X-Circuit-Breaker-State'];
      circuitBreakerOpen.add(state === 'OPEN' ? 1 : 0);

      if (state === 'OPEN') {
        console.log('⚠️  Circuit breaker is OPEN');
        fallbackExecuted.add(1);
      }
    }
  });

  sleep(1);
}

export function errorPhase(data) {
  authToken = data.authToken;

  group('Error-Inducing Requests', function () {
    // Make requests that might fail or cause timeouts
    const start = Date.now();

    // Try to access non-existent resources or trigger errors
    const errorRequests = [
      // Invalid job ID
      http.get(`${config.baseUrls.job}/api/v1/jobs/invalid-id-${Math.random()}`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { name: 'ErrorRequest', phase: 'error' },
      }),

      // Request with very high timeout potential
      http.get(`${config.baseUrls.job}/api/v1/jobs?page=9999&limit=1000`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        timeout: '500ms', // Short timeout to induce failures
        tags: { name: 'TimeoutRequest', phase: 'error' },
      }),
    ];

    errorRequests.forEach((res) => {
      requestDuration.add(Date.now() - start);

      const success = check(res, {
        'request completed': (r) => r.status !== 0,
      });

      if (!success || res.status >= 500) {
        errorRate.add(1);
      }

      // Monitor circuit breaker state
      if (res.headers['X-Circuit-Breaker-State'] === 'OPEN') {
        circuitBreakerOpen.add(1);
        fallbackExecuted.add(1);
        console.log('🔴 Circuit breaker OPENED due to high error rate');
      } else if (res.headers['X-Circuit-Breaker-State'] === 'HALF_OPEN') {
        console.log('🟡 Circuit breaker in HALF_OPEN state - testing recovery');
      }
    });
  });

  sleep(0.5);
}

export function teardown(data) {
  console.log('\n📊 Circuit Breaker Test Summary:');
  console.log('================================');
  console.log('Test completed. Check metrics for circuit breaker behavior.');
  console.log('Expected behavior:');
  console.log('  - Normal phase: All requests succeed');
  console.log('  - Error phase: Circuit breaker should open after threshold');
  console.log('  - Recovery phase: Circuit breaker should gradually close');
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'circuit-breaker-test-results.json': JSON.stringify(data),
  };

  // Analyze circuit breaker metrics
  console.log('\n🔍 Circuit Breaker Analysis:');

  const errorMetric = data.metrics['errors'];
  if (errorMetric) {
    console.log(`  Error Rate: ${(errorMetric.values.rate * 100).toFixed(2)}%`);
  }

  const cbMetric = data.metrics['circuit_breaker_open'];
  if (cbMetric) {
    console.log(`  Circuit Breaker Opened: ${cbMetric.values.value > 0 ? 'Yes' : 'No'}`);
  }

  const fallbackMetric = data.metrics['fallback_executed'];
  if (fallbackMetric) {
    console.log(`  Fallback Executions: ${fallbackMetric.values.count}`);
  }

  return summary;
}
