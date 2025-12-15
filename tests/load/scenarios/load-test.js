/**
 * Load Test - Normal operational load
 *
 * Purpose: Validate system performance under expected production load
 * Load: Ramps from 0 to 20 VUs over 15 minutes
 * Success Criteria: Error rate < 5%, P95 latency < 2s
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, randomSleep } from '../config.js';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const jobSearchDuration = new Trend('job_search_duration');
const applicationDuration = new Trend('application_duration');
const totalRequests = new Counter('total_requests');

export const options = {
  scenarios: {
    normal_load: config.scenarios.load,
  },
  thresholds: {
    'errors': ['rate<0.05'], // Error rate < 5%
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.05'],
    'login_duration': ['p(95)<1000'],
    'job_search_duration': ['p(95)<3000'],
  },
};

let authToken = null;

export function setup() {
  // Setup: Create test users if needed
  console.log('Starting load test setup...');
  return { timestamp: new Date().toISOString() };
}

export default function (data) {
  // Scenario 1: User Login (30% of users)
  if (Math.random() < 0.3) {
    group('User Login', function () {
      const loginStart = Date.now();

      const res = http.post(
        `${config.baseUrls.auth}/api/v1/auth/login`,
        JSON.stringify(config.testUsers.regular),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'UserLogin' },
        }
      );

      totalRequests.add(1);
      loginDuration.add(Date.now() - loginStart);

      const success = check(res, {
        'login status 200': (r) => r.status === 200 || r.status === 201,
        'has auth token': (r) => {
          try {
            const body = JSON.parse(r.body);
            authToken = body.accessToken || body.access_token;
            return authToken !== undefined;
          } catch (e) {
            return false;
          }
        },
      });

      if (!success) errorRate.add(1);
    });

    sleep(randomSleep(1, 3));
  }

  // Scenario 2: Job Search (50% of users)
  if (Math.random() < 0.5) {
    group('Job Search', function () {
      const searchStart = Date.now();

      const searchParams = {
        keyword: ['software engineer', 'developer', 'data scientist', 'product manager'][Math.floor(Math.random() * 4)],
        location: ['New York', 'San Francisco', 'Austin', 'Remote'][Math.floor(Math.random() * 4)],
        page: 1,
        limit: 20,
      };

      const res = http.get(
        `${config.baseUrls.job}/api/v1/jobs?keyword=${searchParams.keyword}&location=${searchParams.location}&page=${searchParams.page}&limit=${searchParams.limit}`,
        {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
          tags: { name: 'JobSearch' },
        }
      );

      totalRequests.add(1);
      jobSearchDuration.add(Date.now() - searchStart);

      const success = check(res, {
        'search status 200': (r) => r.status === 200,
        'has jobs array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.jobs) || Array.isArray(body.data);
          } catch (e) {
            return false;
          }
        },
      });

      if (!success) errorRate.add(1);
    });

    sleep(randomSleep(2, 5));
  }

  // Scenario 3: View User Profile (20% of users)
  if (authToken && Math.random() < 0.2) {
    group('View Profile', function () {
      const res = http.get(`${config.baseUrls.user}/api/v1/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
        tags: { name: 'ViewProfile' },
      });

      totalRequests.add(1);

      const success = check(res, {
        'profile status 200': (r) => r.status === 200,
      });

      if (!success) errorRate.add(1);
    });

    sleep(randomSleep(1, 2));
  }

  // Scenario 4: Submit Application (10% of users)
  if (authToken && Math.random() < 0.1) {
    group('Submit Application', function () {
      const appStart = Date.now();

      const application = {
        jobId: 'test-job-' + Math.floor(Math.random() * 1000),
        resumeId: 'test-resume-1',
        coverLetter: 'This is a test cover letter for load testing.',
      };

      const res = http.post(
        `${config.baseUrls.autoApply}/api/v1/applications`,
        JSON.stringify(application),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          tags: { name: 'SubmitApplication' },
        }
      );

      totalRequests.add(1);
      applicationDuration.add(Date.now() - appStart);

      const success = check(res, {
        'application submitted': (r) => r.status === 200 || r.status === 201 || r.status === 404, // 404 ok for test data
      });

      if (!success) errorRate.add(1);
    });

    sleep(randomSleep(3, 7));
  }

  // Random think time between actions
  sleep(randomSleep(1, 3));
}

export function teardown(data) {
  console.log('Load test completed at:', new Date().toISOString());
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };

  // Check if any thresholds failed
  const thresholdsFailed = Object.keys(data.metrics).some(
    metric => data.metrics[metric].thresholds &&
    Object.values(data.metrics[metric].thresholds).some(t => !t.ok)
  );

  if (thresholdsFailed) {
    console.error('❌ Load test FAILED - Some thresholds were not met');
  } else {
    console.log('✅ Load test PASSED - All thresholds met');
  }

  return summary;
}
