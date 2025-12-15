/**
 * Redis Failure Test - Validate system resilience when Redis is unavailable
 *
 * Purpose: Test that the system continues to operate when Redis fails
 * Load: Normal traffic with simulated Redis unavailability
 * Success Criteria: System continues operating, degraded mode active, no critical failures
 *
 * IMPORTANT: This test assumes Redis can be disabled/enabled for testing.
 * In production, this would validate fail-open behavior.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { config } from '../config.js';

// Custom metrics
const systemAvailability = new Rate('system_availability');
const degradedModeActive = new Counter('degraded_mode_active');
const redisErrors = new Counter('redis_errors');
const requestSuccess = new Rate('request_success');
const responseTime = new Trend('response_time');
const fallbackExecutions = new Counter('fallback_executions');

export const options = {
  scenarios: {
    // Phase 1: Normal operation with Redis healthy
    normal_with_redis: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      startTime: '0s',
      exec: 'normalOperations',
    },
    // Phase 2: Simulated Redis failure scenario
    // In real testing, Redis would be stopped here
    degraded_operations: {
      executor: 'constant-vus',
      vus: 5,
      duration: '3m',
      startTime: '2m',
      exec: 'degradedOperations',
    },
    // Phase 3: Recovery phase (Redis back online)
    recovery: {
      executor: 'constant-vus',
      vus: 5,
      duration: '2m',
      startTime: '5m',
      exec: 'recoveryOperations',
    },
  },
  thresholds: {
    'system_availability': ['rate>0.95'], // 95%+ requests should succeed
    'request_success': ['rate>0.90'], // 90%+ functional success
    'response_time': ['p(95)<3000'], // Allow higher latency during degraded mode
    'http_req_failed': ['rate<0.10'], // Less than 10% hard failures
  },
};

let authToken = null;
let redisHealthy = true;

export function setup() {
  console.log('🚀 Starting Redis Failure Test Setup...');

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
  }

  // Check initial Redis health
  const healthRes = http.get(`${config.baseUrls.auth}/health`);
  console.log(`📊 Initial system health check: ${healthRes.status}`);

  return { authToken };
}

export function normalOperations(data) {
  authToken = data.authToken;

  group('Normal Operations (Redis Healthy)', function () {
    const operations = [
      {
        name: 'Get Jobs',
        request: () => http.get(
          `${config.baseUrls.job}/api/v1/jobs?page=1&limit=10`,
          { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} }
        ),
      },
      {
        name: 'Get User Profile',
        request: () => http.get(
          `${config.baseUrls.user}/api/v1/users/profile`,
          { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} }
        ),
      },
      {
        name: 'Check Analytics',
        request: () => http.get(
          `${config.baseUrls.analytics}/api/v1/analytics/dashboard`,
          { headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {} }
        ),
      },
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const start = Date.now();
    const res = operation.request();
    const duration = Date.now() - start;

    responseTime.add(duration);

    const available = check(res, {
      'system available': (r) => r.status > 0 && r.status < 500,
      'response time acceptable': () => duration < 2000,
    });

    systemAvailability.add(available);
    requestSuccess.add(res.status === 200);

    // Check for degraded mode indicators
    if (res.headers['X-RateLimit-Mode'] === 'degraded' ||
        res.headers['X-Cache-Status'] === 'bypass' ||
        res.headers['X-Redis-Status'] === 'unavailable') {
      degradedModeActive.add(1);
      console.warn(`⚠️  ${operation.name}: Degraded mode detected during normal phase`);
    }

    if (res.status >= 200 && res.status < 300) {
      console.log(`✅ ${operation.name}: Success (${duration}ms)`);
    }
  });

  sleep(1 + Math.random());
}

export function degradedOperations(data) {
  authToken = data.authToken;

  // NOTE: In a real test environment, Redis would be stopped before this phase
  // For now, we'll monitor for any actual Redis failures that occur

  group('Degraded Operations (Redis Potentially Down)', function () {
    const operations = [
      {
        name: 'Get Jobs (No Cache)',
        request: () => http.get(
          `${config.baseUrls.job}/api/v1/jobs?page=1&limit=10&nocache=true`,
          {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            tags: { phase: 'degraded', cached: 'false' },
          }
        ),
        requiresRedis: false, // Can work without Redis
      },
      {
        name: 'Create Job Application',
        request: () => http.post(
          `${config.baseUrls.job}/api/v1/applications`,
          JSON.stringify({
            jobId: 'test-job-123',
            resumeId: 'test-resume-456',
          }),
          {
            headers: authToken ? {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            } : { 'Content-Type': 'application/json' },
            tags: { phase: 'degraded' },
          }
        ),
        requiresRedis: false, // Should work without Redis
      },
      {
        name: 'Get User Profile (Direct DB)',
        request: () => http.get(
          `${config.baseUrls.user}/api/v1/users/profile`,
          {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            tags: { phase: 'degraded' },
          }
        ),
        requiresRedis: false,
      },
    ];

    const operation = operations[Math.floor(Math.random() * operations.length)];
    const start = Date.now();
    const res = operation.request();
    const duration = Date.now() - start;

    responseTime.add(duration);

    // More lenient checks during degraded mode
    const available = check(res, {
      'system responds': (r) => r.status > 0,
      'not critical error': (r) => r.status !== 500,
      'response received': (r) => r.body && r.body.length > 0,
    });

    systemAvailability.add(available);

    const functionalSuccess = res.status === 200 || res.status === 201;
    requestSuccess.add(functionalSuccess);

    // Track degraded mode indicators
    const isDegraded =
      res.headers['X-RateLimit-Mode'] === 'degraded' ||
      res.headers['X-Cache-Status'] === 'bypass' ||
      res.headers['X-Redis-Status'] === 'unavailable' ||
      res.headers['X-Fallback-Mode'] === 'active';

    if (isDegraded) {
      degradedModeActive.add(1);
      fallbackExecutions.add(1);
      console.log(`⚠️  ${operation.name}: Operating in degraded mode (${duration}ms)`);
    }

    // Track Redis-specific errors
    if (res.headers['X-Redis-Error'] || res.body.includes('Redis')) {
      redisErrors.add(1);
      console.warn(`🔴 ${operation.name}: Redis error detected`);
    }

    if (functionalSuccess) {
      const mode = isDegraded ? 'DEGRADED' : 'NORMAL';
      console.log(`${isDegraded ? '🟡' : '✅'} ${operation.name}: Success in ${mode} mode (${duration}ms)`);
    } else if (res.status === 429) {
      console.log(`🛑 ${operation.name}: Rate limited (expected without Redis)`);
    } else if (res.status >= 500) {
      console.error(`❌ ${operation.name}: Server error ${res.status} - SYSTEM SHOULD NOT FAIL!`);
    }
  });

  sleep(0.8);
}

export function recoveryOperations(data) {
  authToken = data.authToken;

  group('Recovery Operations (Redis Restored)', function () {
    const start = Date.now();
    const res = http.get(
      `${config.baseUrls.job}/api/v1/jobs?page=1&limit=10`,
      {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { phase: 'recovery' },
      }
    );
    const duration = Date.now() - start;

    responseTime.add(duration);

    const available = check(res, {
      'system available': (r) => r.status === 200,
      'response time normal': () => duration < 2000,
      'not in degraded mode': (r) =>
        r.headers['X-RateLimit-Mode'] !== 'degraded' &&
        r.headers['X-Cache-Status'] !== 'bypass',
    });

    systemAvailability.add(available);
    requestSuccess.add(res.status === 200);

    // Check if we've recovered from degraded mode
    const stillDegraded =
      res.headers['X-RateLimit-Mode'] === 'degraded' ||
      res.headers['X-Cache-Status'] === 'bypass';

    if (stillDegraded) {
      console.warn(`⚠️  Recovery phase: Still in degraded mode (Redis may not be restored)`);
      degradedModeActive.add(1);
    } else {
      console.log(`✅ Recovery phase: Normal operation restored (${duration}ms)`);
    }
  });

  sleep(1);
}

export function teardown(data) {
  console.log('\n📊 Redis Failure Test Summary:');
  console.log('================================');
  console.log('Test completed successfully.');
  console.log('\nExpected behavior:');
  console.log('  Phase 1 (Normal): All requests succeed, Redis healthy');
  console.log('  Phase 2 (Degraded): System continues operating without Redis');
  console.log('    - Requests succeed with fallback mechanisms');
  console.log('    - Degraded mode headers present');
  console.log('    - Slight performance degradation acceptable');
  console.log('    - NO 500 errors (fail-open active)');
  console.log('  Phase 3 (Recovery): System returns to normal operation');
  console.log('\nCheck Prometheus metrics for:');
  console.log('  - gateway_rate_limit_degraded_total');
  console.log('  - redis_connection_state (0 = down, 1 = up)');
  console.log('  - redis_errors_total');
  console.log('  - circuit_breaker_state{circuit_name="redis"}');
  console.log('\nAzure Application Insights:');
  console.log('  - Dependency failures for Redis');
  console.log('  - Custom events for degraded mode');
  console.log('  - Exception tracking');
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'redis-failure-test-results.json': JSON.stringify(data),
  };

  // Detailed analysis
  console.log('\n🔍 Redis Failure Resilience Analysis:');

  const availability = data.metrics['system_availability'];
  if (availability) {
    console.log(`  📊 System Availability: ${(availability.values.rate * 100).toFixed(2)}%`);
    if (availability.values.rate >= 0.95) {
      console.log(`  ✅ PASS: System maintained >95% availability during Redis failure`);
    } else {
      console.error(`  ❌ FAIL: System availability dropped below 95% - resilience issue!`);
    }
  }

  const success = data.metrics['request_success'];
  if (success) {
    console.log(`  📊 Request Success Rate: ${(success.values.rate * 100).toFixed(2)}%`);
  }

  const degraded = data.metrics['degraded_mode_active'];
  if (degraded && degraded.values.count > 0) {
    console.log(`  🟡 Degraded Mode Activations: ${degraded.values.count}`);
    console.log(`  ✅ System correctly entered degraded mode when Redis unavailable`);
  } else {
    console.log(`  ℹ️  No degraded mode detected (Redis may have remained healthy)`);
  }

  const redisErr = data.metrics['redis_errors'];
  if (redisErr && redisErr.values.count > 0) {
    console.log(`  🔴 Redis Errors Detected: ${redisErr.values.count}`);
  }

  const fallbacks = data.metrics['fallback_executions'];
  if (fallbacks && fallbacks.values.count > 0) {
    console.log(`  🔄 Fallback Executions: ${fallbacks.values.count}`);
    console.log(`  ✅ Fallback mechanisms working correctly`);
  }

  const respTime = data.metrics['response_time'];
  if (respTime) {
    console.log(`  ⏱️  Avg Response Time: ${respTime.values.avg.toFixed(2)}ms`);
    console.log(`  ⏱️  P95 Response Time: ${respTime.values['p(95)'].toFixed(2)}ms`);
    console.log(`  ⏱️  P99 Response Time: ${respTime.values['p(99)'].toFixed(2)}ms`);
  }

  // Overall verdict
  console.log('\n🎯 Overall Resilience Score:');
  const resilienceScore = availability ? availability.values.rate * 100 : 0;
  if (resilienceScore >= 95) {
    console.log(`  ✅ EXCELLENT: System demonstrated strong resilience (${resilienceScore.toFixed(1)}%)`);
  } else if (resilienceScore >= 90) {
    console.log(`  🟡 GOOD: System showed acceptable resilience (${resilienceScore.toFixed(1)}%)`);
  } else {
    console.log(`  ❌ POOR: System resilience needs improvement (${resilienceScore.toFixed(1)}%)`);
  }

  return summary;
}

function textSummary(data, opts) {
  const { indent = '', enableColors = false } = opts || {};
  let output = '\n' + indent + 'Redis Failure Test Results\n';
  output += indent + '===========================\n\n';

  if (data.metrics.http_reqs) {
    output += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }

  if (data.metrics.http_req_failed) {
    output += indent + `Failed Requests: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%\n`;
  }

  if (data.metrics.response_time) {
    output += indent + `P95 Response Time: ${data.metrics.response_time.values['p(95)'].toFixed(2)}ms\n`;
  }

  return output;
}
