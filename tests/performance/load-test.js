import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/beevent/k6-reporter/master/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * JobPilot AI Platform - Load Testing Suite
 *
 * This test suite validates system performance under various load conditions:
 * - Normal load: 100 concurrent users
 * - Peak load: 500 concurrent users
 * - Sustained load: 30-minute endurance test
 *
 * Target: All API endpoints should respond within 200ms under normal load
 */

// Custom Metrics
const apiResponseTime = new Trend('api_response_time');
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const concurrentUsers = new Gauge('concurrent_users');
const requestsPerSecond = new Counter('requests_per_second');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Normal Load - 100 concurrent users
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      exec: 'normalLoadTest',
      startTime: '0s',
    },

    // Scenario 2: Peak Load - 500 concurrent users
    peak_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },  // Ramp up to 100 users
        { duration: '3m', target: 300 },  // Ramp up to 300 users
        { duration: '3m', target: 500 },  // Ramp up to 500 users
        { duration: '5m', target: 500 },  // Stay at 500 users
        { duration: '3m', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '1m',
      exec: 'peakLoadTest',
      startTime: '15m', // Start after normal load test
    },

    // Scenario 3: Spike Test - Sudden burst of traffic
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },   // Normal load
        { duration: '10s', target: 1000 }, // Sudden spike to 1000 users
        { duration: '1m', target: 1000 },  // Hold spike
        { duration: '30s', target: 50 },   // Return to normal
        { duration: '30s', target: 0 },    // Ramp down
      ],
      gracefulRampDown: '30s',
      exec: 'spikeTest',
      startTime: '32m', // Start after peak load test
    },

    // Scenario 4: Endurance Test - Sustained load over 30 minutes
    endurance_test: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30m',
      exec: 'enduranceTest',
      startTime: '35m', // Start after spike test
    },
  },

  thresholds: {
    // API Response Time - 95% of requests should be under 200ms
    'http_req_duration': ['p(95)<200', 'p(99)<500'],

    // Error rate should be less than 1%
    'error_rate': ['rate<0.01'],

    // Success rate should be greater than 99%
    'success_rate': ['rate>0.99'],

    // Request duration by endpoint
    'http_req_duration{endpoint:health}': ['p(95)<50'],
    'http_req_duration{endpoint:jobs}': ['p(95)<200'],
    'http_req_duration{endpoint:applications}': ['p(95)<200'],
    'http_req_duration{endpoint:resumes}': ['p(95)<250'],
    'http_req_duration{endpoint:ai}': ['p(95)<500'],

    // Check failures should be less than 1%
    'checks': ['rate>0.99'],
  },

  // Global configuration
  noConnectionReuse: false,
  userAgent: 'K6LoadTest/1.0',
  insecureSkipTLSVerify: true, // For development/testing only
};

// Authentication helper
let authToken = null;

function authenticate() {
  if (authToken) return authToken;

  const loginPayload = JSON.stringify({
    email: __ENV.TEST_USER_EMAIL || 'test@jobpilot.ai',
    password: __ENV.TEST_USER_PASSWORD || 'Test123!@#',
  });

  const loginRes = http.post(`${API_BASE}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'auth' },
  });

  if (loginRes.status === 200 && loginRes.json('access_token')) {
    authToken = loginRes.json('access_token');
  }

  return authToken;
}

function getAuthHeaders() {
  const token = authenticate();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Test functions for different scenarios

export function normalLoadTest() {
  group('Normal Load - Core APIs', () => {
    concurrentUsers.add(__VU);

    // Health check
    group('Health Checks', () => {
      const healthRes = http.get(`${API_BASE}/health`, {
        tags: { endpoint: 'health' },
      });

      check(healthRes, {
        'health check status is 200': (r) => r.status === 200,
        'health check response time < 50ms': (r) => r.timings.duration < 50,
      });

      apiResponseTime.add(healthRes.timings.duration);
      successRate.add(healthRes.status === 200);
      errorRate.add(healthRes.status !== 200);
    });

    sleep(1);

    // Jobs API
    group('Jobs API', () => {
      const jobsRes = http.get(`${API_BASE}/jobs?page=1&limit=20`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'jobs' },
      });

      check(jobsRes, {
        'jobs list status is 200': (r) => r.status === 200,
        'jobs list response time < 200ms': (r) => r.timings.duration < 200,
        'jobs list returns data': (r) => r.json('data') !== null,
      });

      apiResponseTime.add(jobsRes.timings.duration);
      successRate.add(jobsRes.status === 200);
      errorRate.add(jobsRes.status !== 200);
      requestsPerSecond.add(1);
    });

    sleep(1);

    // Applications API
    group('Applications API', () => {
      const appsRes = http.get(`${API_BASE}/applications?page=1&limit=20`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'applications' },
      });

      check(appsRes, {
        'applications list status is 200': (r) => r.status === 200,
        'applications list response time < 200ms': (r) => r.timings.duration < 200,
      });

      apiResponseTime.add(appsRes.timings.duration);
      successRate.add(appsRes.status === 200);
      errorRate.add(appsRes.status !== 200);
      requestsPerSecond.add(1);
    });

    sleep(2);
  });
}

export function peakLoadTest() {
  group('Peak Load - Heavy Traffic', () => {
    concurrentUsers.add(__VU);

    // Simulate user browsing multiple pages
    const endpoints = [
      { url: `${API_BASE}/jobs?page=1&limit=20`, endpoint: 'jobs' },
      { url: `${API_BASE}/jobs/search?query=developer`, endpoint: 'jobs' },
      { url: `${API_BASE}/applications?status=pending`, endpoint: 'applications' },
      { url: `${API_BASE}/resumes`, endpoint: 'resumes' },
      { url: `${API_BASE}/user/profile`, endpoint: 'user' },
    ];

    endpoints.forEach(({ url, endpoint }) => {
      const res = http.get(url, {
        headers: getAuthHeaders(),
        tags: { endpoint },
      });

      check(res, {
        [`${endpoint} status is 200`]: (r) => r.status === 200,
        [`${endpoint} response time < 500ms`]: (r) => r.timings.duration < 500,
      });

      apiResponseTime.add(res.timings.duration);
      successRate.add(res.status === 200);
      errorRate.add(res.status !== 200);
      requestsPerSecond.add(1);

      sleep(0.5);
    });

    sleep(1);
  });
}

export function spikeTest() {
  group('Spike Test - Sudden Traffic Burst', () => {
    concurrentUsers.add(__VU);

    // Rapid-fire requests to test system resilience
    const quickEndpoints = [
      `${API_BASE}/health`,
      `${API_BASE}/ready`,
      `${API_BASE}/jobs?page=1&limit=10`,
    ];

    quickEndpoints.forEach(url => {
      const res = http.get(url, {
        headers: url.includes('health') || url.includes('ready')
          ? {}
          : getAuthHeaders(),
        tags: { test: 'spike' },
      });

      check(res, {
        'spike test - system responsive': (r) => r.status === 200 || r.status === 429,
        'spike test - no 5xx errors': (r) => r.status < 500,
      });

      apiResponseTime.add(res.timings.duration);
      successRate.add(res.status === 200);
      errorRate.add(res.status >= 500);
      requestsPerSecond.add(1);
    });

    sleep(0.1); // Minimal sleep during spike
  });
}

export function enduranceTest() {
  group('Endurance Test - Sustained Load', () => {
    concurrentUsers.add(__VU);

    // Simulate realistic user behavior over extended period
    group('Browse Jobs', () => {
      const jobsRes = http.get(`${API_BASE}/jobs?page=${Math.floor(Math.random() * 10) + 1}&limit=20`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'jobs', test: 'endurance' },
      });

      check(jobsRes, {
        'endurance - jobs status is 200': (r) => r.status === 200,
        'endurance - no memory leaks (consistent response time)': (r) => r.timings.duration < 300,
      });

      apiResponseTime.add(jobsRes.timings.duration);
      successRate.add(jobsRes.status === 200);
      errorRate.add(jobsRes.status !== 200);
    });

    sleep(2);

    group('View Job Details', () => {
      // Random job ID between 1-100
      const jobId = Math.floor(Math.random() * 100) + 1;
      const jobDetailRes = http.get(`${API_BASE}/jobs/${jobId}`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'jobs', test: 'endurance' },
      });

      check(jobDetailRes, {
        'endurance - job detail accessible': (r) => r.status === 200 || r.status === 404,
      });

      if (jobDetailRes.status === 200) {
        apiResponseTime.add(jobDetailRes.timings.duration);
        successRate.add(true);
      }
    });

    sleep(3);

    group('Check Applications', () => {
      const appsRes = http.get(`${API_BASE}/applications?page=1&limit=10`, {
        headers: getAuthHeaders(),
        tags: { endpoint: 'applications', test: 'endurance' },
      });

      check(appsRes, {
        'endurance - applications accessible': (r) => r.status === 200,
      });

      apiResponseTime.add(appsRes.timings.duration);
      successRate.add(appsRes.status === 200);
      errorRate.add(appsRes.status !== 200);
    });

    sleep(5);
  });
}

// Setup function - runs once at the beginning
export function setup() {
  console.log('🚀 Starting JobPilot AI Load Testing Suite');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👥 Test User: ${__ENV.TEST_USER_EMAIL || 'test@jobpilot.ai'}`);

  // Verify API is accessible
  const healthCheck = http.get(`${API_BASE}/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ API health check failed - aborting tests');
    throw new Error('API is not accessible');
  }

  console.log('✅ API health check passed');

  return {
    startTime: new Date().toISOString(),
  };
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('📊 Load Testing Complete');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);
}

// Generate HTML report
export function handleSummary(data) {
  return {
    'load-test-results.html': htmlReport(data),
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
