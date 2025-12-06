import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/beevent/k6-reporter/master/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * JobPilot AI Platform - Stress Testing Suite
 *
 * This test identifies the breaking point of the system by gradually
 * increasing load until the system starts to fail.
 *
 * Objectives:
 * 1. Find maximum concurrent users the system can handle
 * 2. Identify resource bottlenecks (CPU, Memory, Database connections)
 * 3. Test auto-scaling capabilities
 * 4. Validate error handling under extreme load
 * 5. Measure recovery time after stress
 */

// Custom Metrics
const breakingPoint = new Gauge('breaking_point_users');
const systemDegradation = new Rate('system_degradation');
const resourceExhaustion = new Rate('resource_exhaustion');
const errorsByType = new Counter('errors_by_type');
const responseTimeP99 = new Trend('response_time_p99');
const connectionErrors = new Counter('connection_errors');
const timeoutErrors = new Counter('timeout_errors');
const serverErrors = new Counter('server_errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const MAX_VUS = parseInt(__ENV.MAX_VUS || '2000');

// Stress test scenarios
export const options = {
  scenarios: {
    // Scenario 1: Gradual stress increase to find breaking point
    breaking_point_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Warm up
        { duration: '2m', target: 300 },   // Comfortable load
        { duration: '2m', target: 500 },   // Moderate stress
        { duration: '2m', target: 800 },   // High stress
        { duration: '2m', target: 1200 },  // Very high stress
        { duration: '2m', target: 1600 },  // Extreme stress
        { duration: '2m', target: 2000 },  // Maximum stress
        { duration: '3m', target: 2000 },  // Hold at max
        { duration: '5m', target: 0 },     // Recovery period
      ],
      gracefulRampDown: '2m',
      exec: 'stressTest',
    },

    // Scenario 2: Database connection pool stress
    database_stress: {
      executor: 'ramping-arrival-rate',
      startRate: 50,
      timeUnit: '1s',
      preAllocatedVUs: 100,
      maxVUs: 500,
      stages: [
        { duration: '2m', target: 100 },   // 100 req/s
        { duration: '2m', target: 300 },   // 300 req/s
        { duration: '2m', target: 500 },   // 500 req/s
        { duration: '2m', target: 800 },   // 800 req/s
        { duration: '2m', target: 1000 },  // 1000 req/s
        { duration: '2m', target: 0 },     // Ramp down
      ],
      exec: 'databaseStressTest',
      startTime: '25m',
    },

    // Scenario 3: Memory leak detection
    memory_stress: {
      executor: 'constant-vus',
      vus: 200,
      duration: '15m',
      exec: 'memoryStressTest',
      startTime: '37m',
    },
  },

  thresholds: {
    // Allow higher failure rates for stress testing
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.2'], // Allow up to 20% failures
    'system_degradation': ['rate<0.3'],
    'resource_exhaustion': ['rate<0.1'],

    // Different thresholds for different endpoints
    'http_req_duration{endpoint:health}': ['p(95)<100'],
    'http_req_duration{endpoint:jobs}': ['p(95)<1000'],
    'http_req_duration{endpoint:applications}': ['p(95)<1000'],

    // Connection and timeout tracking
    'connection_errors': ['count<100'],
    'timeout_errors': ['count<50'],
  },

  // Stress test specific settings
  noConnectionReuse: false,
  maxRedirects: 4,
  batch: 10,
  batchPerHost: 5,
  httpDebug: 'full',
  insecureSkipTLSVerify: true,
  discardResponseBodies: false,
};

// Authentication
let authToken = null;

function authenticate() {
  if (authToken) return authToken;

  try {
    const loginPayload = JSON.stringify({
      email: __ENV.TEST_USER_EMAIL || 'test@jobpilot.ai',
      password: __ENV.TEST_USER_PASSWORD || 'Test123!@#',
    });

    const loginRes = http.post(`${API_BASE}/auth/login`, loginPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
      tags: { endpoint: 'auth' },
    });

    if (loginRes.status === 200 && loginRes.json('access_token')) {
      authToken = loginRes.json('access_token');
    }
  } catch (error) {
    console.error('Authentication failed:', error);
    connectionErrors.add(1);
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

// Main stress test function
export function stressTest() {
  const currentVUs = __VU;

  group('Stress Test - System Breaking Point', () => {
    // Track when system starts degrading
    const startTime = Date.now();

    // Test 1: API Health under stress
    group('Health Check Stress', () => {
      const healthRes = http.get(`${API_BASE}/health`, {
        timeout: '5s',
        tags: { endpoint: 'health', stress_level: getStressLevel(currentVUs) },
      });

      const responseTime = healthRes.timings.duration;
      const success = healthRes.status === 200;

      check(healthRes, {
        'health endpoint responsive': (r) => r.status === 200,
        'health check under 1s': (r) => r.timings.duration < 1000,
      });

      // Track degradation
      if (!success || responseTime > 1000) {
        systemDegradation.add(1);
        if (currentVUs > 1500) {
          breakingPoint.add(currentVUs);
        }
      }

      trackErrors(healthRes);
      responseTimeP99.add(responseTime);
    });

    sleep(0.5);

    // Test 2: Database-intensive operations
    group('Database Stress', () => {
      const queries = [
        `${API_BASE}/jobs?page=1&limit=50`,
        `${API_BASE}/jobs/search?query=engineer&location=remote`,
        `${API_BASE}/applications?status=pending&sort=createdAt`,
      ];

      queries.forEach((url, index) => {
        const res = http.get(url, {
          headers: getAuthHeaders(),
          timeout: '10s',
          tags: {
            endpoint: 'jobs',
            query_type: `query_${index}`,
            stress_level: getStressLevel(currentVUs),
          },
        });

        const responseTime = res.timings.duration;

        check(res, {
          'database query successful': (r) => r.status === 200,
          'query response time acceptable': (r) => r.timings.duration < 2000,
          'no connection pool exhaustion': (r) => r.status !== 503,
        });

        // Detect resource exhaustion
        if (res.status === 503 || res.status === 429) {
          resourceExhaustion.add(1);
          errorsByType.add(1, { error_type: 'resource_exhausted' });
        }

        trackErrors(res);
        responseTimeP99.add(responseTime);

        sleep(0.2);
      });
    });

    sleep(1);

    // Test 3: Write operations stress
    group('Write Operations Stress', () => {
      const writePayload = JSON.stringify({
        jobId: `job-${Date.now()}-${currentVUs}`,
        status: 'pending',
        notes: 'Stress test application',
      });

      const writeRes = http.post(`${API_BASE}/applications`, writePayload, {
        headers: getAuthHeaders(),
        timeout: '10s',
        tags: {
          endpoint: 'applications',
          operation: 'write',
          stress_level: getStressLevel(currentVUs),
        },
      });

      check(writeRes, {
        'write operation successful': (r) => r.status === 201 || r.status === 200,
        'write locks not blocking': (r) => r.timings.duration < 3000,
      });

      trackErrors(writeRes);
      responseTimeP99.add(writeRes.timings.duration);
    });

    sleep(2);
  });
}

// Database connection pool stress test
export function databaseStressTest() {
  group('Database Connection Pool Stress', () => {
    // Rapid database queries to exhaust connection pool
    const parallelQueries = Array.from({ length: 5 }, (_, i) => ({
      method: 'GET',
      url: `${API_BASE}/jobs?page=${i + 1}&limit=20`,
      params: {
        headers: getAuthHeaders(),
        timeout: '8s',
        tags: { endpoint: 'jobs', test: 'db_pool_stress' },
      },
    }));

    const responses = http.batch(parallelQueries);

    responses.forEach((res, index) => {
      check(res, {
        [`query ${index} - connection available`]: (r) => r.status !== 503,
        [`query ${index} - no timeout`]: (r) => r.status !== 504,
        [`query ${index} - reasonable response time`]: (r) => r.timings.duration < 5000,
      });

      trackErrors(res);

      if (res.status === 503) {
        resourceExhaustion.add(1);
        errorsByType.add(1, { error_type: 'connection_pool_exhausted' });
      }
    });

    sleep(0.1);
  });
}

// Memory stress test - detect memory leaks
export function memoryStressTest() {
  group('Memory Leak Detection', () => {
    // Create large payloads to stress memory
    const largePayload = JSON.stringify({
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        content: 'x'.repeat(1000), // 1KB per item
        timestamp: Date.now(),
      })),
    });

    // Test 1: Large response handling
    const jobsRes = http.get(`${API_BASE}/jobs?page=1&limit=100`, {
      headers: getAuthHeaders(),
      timeout: '10s',
      tags: { test: 'memory_stress', endpoint: 'jobs' },
    });

    check(jobsRes, {
      'large response handled': (r) => r.status === 200,
      'memory not exhausted': (r) => r.status !== 500,
      'consistent response time': (r) => r.timings.duration < 3000,
    });

    trackErrors(jobsRes);
    responseTimeP99.add(jobsRes.timings.duration);

    sleep(1);

    // Test 2: Repeated allocations
    for (let i = 0; i < 10; i++) {
      const res = http.get(`${API_BASE}/health`, {
        tags: { test: 'memory_stress', iteration: i },
      });

      // Response time should remain consistent if no memory leak
      check(res, {
        'no memory leak degradation': (r) => r.timings.duration < 200,
      });

      if (res.timings.duration > 500) {
        systemDegradation.add(1);
      }
    }

    sleep(2);
  });
}

// Helper Functions

function getStressLevel(vus) {
  if (vus < 300) return 'low';
  if (vus < 800) return 'medium';
  if (vus < 1200) return 'high';
  if (vus < 1600) return 'very_high';
  return 'extreme';
}

function trackErrors(response) {
  if (response.error) {
    connectionErrors.add(1);
    errorsByType.add(1, { error_type: response.error });
  }

  if (response.status === 0) {
    connectionErrors.add(1);
    errorsByType.add(1, { error_type: 'connection_refused' });
  }

  if (response.status >= 500) {
    serverErrors.add(1);
    errorsByType.add(1, { error_type: `http_${response.status}` });
  }

  if (response.timings.duration > 10000) {
    timeoutErrors.add(1);
    errorsByType.add(1, { error_type: 'timeout' });
  }
}

// Setup
export function setup() {
  console.log('🔥 Starting JobPilot AI Stress Testing Suite');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👥 Maximum VUs: ${MAX_VUS}`);
  console.log('⚠️  This test will push the system to its limits');

  // Verify API is accessible
  const healthCheck = http.get(`${API_BASE}/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ API health check failed - aborting tests');
    throw new Error('API is not accessible');
  }

  console.log('✅ API health check passed - beginning stress test');

  return {
    startTime: new Date().toISOString(),
    initialHealthCheck: healthCheck.timings.duration,
  };
}

// Teardown
export function teardown(data) {
  console.log('📊 Stress Testing Complete');
  console.log(`Started at: ${data.startTime}`);
  console.log(`Ended at: ${new Date().toISOString()}`);

  // Final health check to verify recovery
  sleep(30); // Wait for system to stabilize

  console.log('🔍 Checking system recovery...');
  const recoveryCheck = http.get(`${API_BASE}/health`);

  if (recoveryCheck.status === 200) {
    console.log('✅ System recovered successfully');
    console.log(`Recovery time: ${recoveryCheck.timings.duration}ms (Initial: ${data.initialHealthCheck}ms)`);
  } else {
    console.log('⚠️  System still recovering or degraded');
  }
}

// Generate reports
export function handleSummary(data) {
  // Calculate breaking point
  const breakingPointVUs = data.metrics.breaking_point_users?.values?.value || 'Not reached';

  const summary = {
    ...data,
    breakingPoint: breakingPointVUs,
    maxVUs: MAX_VUS,
    systemHealth: {
      degradationRate: data.metrics.system_degradation?.values?.rate || 0,
      resourceExhaustionRate: data.metrics.resource_exhaustion?.values?.rate || 0,
      connectionErrors: data.metrics.connection_errors?.values?.count || 0,
      serverErrors: data.metrics.server_errors?.values?.count || 0,
    },
  };

  return {
    'stress-test-results.html': htmlReport(summary),
    'stress-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }) +
      `\n\n🎯 Breaking Point: ${breakingPointVUs} concurrent users\n`,
  };
}
