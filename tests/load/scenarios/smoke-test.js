/**
 * Smoke Test - Basic functionality validation
 *
 * Purpose: Verify that all services are running and responding correctly
 * Load: 1 VU for 1 minute
 * Success Criteria: All requests succeed, response times under threshold
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { config } from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const jobSearchDuration = new Trend('job_search_duration');

export const options = {
  vus: 1,
  duration: '1m',
  thresholds: {
    'errors': ['rate<0.01'], // Error rate must be less than 1%
    'http_req_duration': ['p(95)<1000'], // 95% of requests under 1s
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  // Test 1: Auth Service Health Check
  let res = http.get(`${config.baseUrls.auth}/api/v1/health`);
  check(res, {
    'auth service is up': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: User Service Health Check
  res = http.get(`${config.baseUrls.user}/api/v1/health`);
  check(res, {
    'user service is up': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Job Service Health Check
  res = http.get(`${config.baseUrls.job}/api/v1/health`);
  check(res, {
    'job service is up': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 4: Resume Service Health Check
  res = http.get(`${config.baseUrls.resume}/api/v1/health`);
  check(res, {
    'resume service is up': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 5: Metrics Endpoints
  res = http.get(`${config.baseUrls.auth}/metrics`);
  check(res, {
    'auth metrics available': (r) => r.status === 200,
    'metrics in prometheus format': (r) => r.body.includes('http_requests_total'),
  }) || errorRate.add(1);

  sleep(1);

  // Test 6: Login Flow
  const loginStart = Date.now();
  res = http.post(`${config.baseUrls.auth}/api/v1/auth/login`, JSON.stringify({
    email: config.testUsers.regular.email,
    password: config.testUsers.regular.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(res, {
    'login successful': (r) => r.status === 200 || r.status === 201,
    'received access token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.accessToken !== undefined || body.access_token !== undefined;
      } catch (e) {
        return false;
      }
    },
  });

  if (!loginSuccess) {
    errorRate.add(1);
  }

  authDuration.add(Date.now() - loginStart);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'smoke-test-results.json': JSON.stringify(data),
  };
}
