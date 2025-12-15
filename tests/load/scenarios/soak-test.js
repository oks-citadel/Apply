/**
 * Soak Test - Long-duration stability test
 *
 * Purpose: Identify memory leaks, resource exhaustion, and degradation over time
 * Load: Constant 20 VUs for 2 hours
 * Success Criteria: No performance degradation, no memory leaks, stable error rate
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { config, randomSleep, randomItem } from '../config.js';

// Custom metrics to track degradation over time
const errorRate = new Rate('errors');
const memoryGrowth = new Trend('memory_growth');
const degradation = new Trend('response_time_degradation');
const totalOperations = new Counter('total_operations');

export const options = {
  scenarios: {
    soak: config.scenarios.soak,
  },
  thresholds: {
    'errors': ['rate<0.05'], // Consistent error rate
    'http_req_duration': [
      'p(95)<2000', // Should not degrade
      'p(99)<5000',
    ],
    'http_req_failed': ['rate<0.05'],
  },
};

let authToken = null;
let baselineResponseTime = null;

export function setup() {
  console.log('🕐 Starting Soak Test - 2 hour duration');
  console.log('Monitoring for:');
  console.log('  - Memory leaks');
  console.log('  - Performance degradation');
  console.log('  - Resource exhaustion');
  console.log('  - Database connection pool issues');
  console.log('');

  return {
    startTime: Date.now(),
    checkpoints: [],
  };
}

export default function (data) {
  const iterationStart = Date.now();
  const elapsedMinutes = (Date.now() - data.startTime) / 1000 / 60;

  // Login periodically to test token refresh
  if (!authToken || __ITER % 100 === 0) {
    group('Authentication', function () {
      const res = http.post(
        `${config.baseUrls.auth}/api/v1/auth/login`,
        JSON.stringify(config.testUsers.regular),
        {
          headers: { 'Content-Type': 'application/json' },
          tags: { name: 'Login', phase: getPhase(elapsedMinutes) },
        }
      );

      if (res.status === 200 || res.status === 201) {
        try {
          const body = JSON.parse(res.body);
          authToken = body.accessToken || body.access_token;
        } catch (e) {}
      }

      check(res, {
        'login successful': (r) => r.status === 200 || r.status === 201,
      }) || errorRate.add(1);
    });

    sleep(1);
  }

  // Realistic user workflow
  group('User Journey', function () {
    totalOperations.add(1);

    // 1. Search for jobs
    const searchStart = Date.now();
    const keywords = ['engineer', 'developer', 'manager', 'designer', 'analyst'];
    const searchRes = http.get(
      `${config.baseUrls.job}/api/v1/jobs?keyword=${randomItem(keywords)}&page=1&limit=20`,
      {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        tags: { name: 'JobSearch', phase: getPhase(elapsedMinutes) },
      }
    );

    const searchDuration = Date.now() - searchStart;

    // Track response time degradation
    if (!baselineResponseTime) {
      baselineResponseTime = searchDuration;
    } else {
      const degradationPercent = ((searchDuration - baselineResponseTime) / baselineResponseTime) * 100;
      degradation.add(degradationPercent);
    }

    check(searchRes, {
      'search successful': (r) => r.status === 200,
      'reasonable response time': (r) => r.timings.duration < 5000,
    }) || errorRate.add(1);

    sleep(randomSleep(2, 4));

    // 2. View job details
    if (Math.random() < 0.7) {
      const jobId = Math.floor(Math.random() * 100);
      const detailRes = http.get(
        `${config.baseUrls.job}/api/v1/jobs/${jobId}`,
        {
          headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
          tags: { name: 'JobDetails', phase: getPhase(elapsedMinutes) },
        }
      );

      check(detailRes, {
        'detail fetch ok': (r) => r.status === 200 || r.status === 404,
      }) || errorRate.add(1);

      sleep(randomSleep(3, 6));
    }

    // 3. Check user profile
    if (authToken && Math.random() < 0.4) {
      const profileRes = http.get(
        `${config.baseUrls.user}/api/v1/profile`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          tags: { name: 'Profile', phase: getPhase(elapsedMinutes) },
        }
      );

      check(profileRes, {
        'profile loaded': (r) => r.status === 200,
      }) || errorRate.add(1);

      sleep(randomSleep(1, 3));
    }

    // 4. List resumes (occasionally)
    if (authToken && Math.random() < 0.2) {
      const resumeRes = http.get(
        `${config.baseUrls.resume}/api/v1/resumes`,
        {
          headers: { 'Authorization': `Bearer ${authToken}` },
          tags: { name: 'ResumeList', phase: getPhase(elapsedMinutes) },
        }
      );

      check(resumeRes, {
        'resumes loaded': (r) => r.status === 200,
      }) || errorRate.add(1);

      sleep(randomSleep(1, 2));
    }

    // 5. Submit application (rare)
    if (authToken && Math.random() < 0.05) {
      const appRes = http.post(
        `${config.baseUrls.autoApply}/api/v1/applications`,
        JSON.stringify({
          jobId: 'test-job-' + Math.floor(Math.random() * 1000),
          resumeId: 'test-resume-1',
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          tags: { name: 'Application', phase: getPhase(elapsedMinutes) },
        }
      );

      check(appRes, {
        'application submitted': (r) => r.status === 200 || r.status === 201 || r.status === 404,
      }) || errorRate.add(1);

      sleep(randomSleep(2, 4));
    }
  });

  // Periodic health checks
  if (__ITER % 50 === 0) {
    group('Health Checks', function () {
      const healthRes = http.get(`${config.baseUrls.job}/api/v1/health`, {
        tags: { name: 'HealthCheck', phase: getPhase(elapsedMinutes) },
      });

      check(healthRes, {
        'service healthy': (r) => r.status === 200,
      });
    });
  }

  // Monitor metrics endpoint for memory usage
  if (__ITER % 100 === 0) {
    const metricsRes = http.get(`${config.baseUrls.job}/metrics`, {
      tags: { name: 'Metrics', phase: getPhase(elapsedMinutes) },
    });

    if (metricsRes.status === 200) {
      // Try to extract memory metrics
      const match = metricsRes.body.match(/process_resident_memory_bytes\s+(\d+)/);
      if (match) {
        const memoryBytes = parseInt(match[1]);
        memoryGrowth.add(memoryBytes);
      }
    }
  }

  // Random think time
  sleep(randomSleep(2, 5));
}

function getPhase(elapsedMinutes) {
  if (elapsedMinutes < 30) return 'early';
  if (elapsedMinutes < 60) return 'mid';
  if (elapsedMinutes < 90) return 'late';
  return 'final';
}

export function teardown(data) {
  const durationHours = (Date.now() - data.startTime) / 1000 / 60 / 60;
  console.log(`\n✅ Soak Test completed after ${durationHours.toFixed(2)} hours`);
}

export function handleSummary(data) {
  const summary = {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'soak-test-results.json': JSON.stringify(data),
  };

  console.log('\n📊 Soak Test Analysis:');
  console.log('=====================');

  // Check for performance degradation
  if (data.metrics['response_time_degradation']) {
    const avgDegradation = data.metrics['response_time_degradation'].values.avg;
    console.log(`  Average Response Time Degradation: ${avgDegradation.toFixed(2)}%`);

    if (avgDegradation > 20) {
      console.log('  ⚠️  WARNING: Significant performance degradation detected!');
    } else if (avgDegradation > 10) {
      console.log('  ⚡ NOTICE: Minor performance degradation observed');
    } else {
      console.log('  ✅ Performance remained stable');
    }
  }

  // Check error rate stability
  if (data.metrics['errors']) {
    const errorRate = data.metrics['errors'].values.rate * 100;
    console.log(`  Error Rate: ${errorRate.toFixed(2)}%`);

    if (errorRate < 1) {
      console.log('  ✅ Excellent error rate stability');
    } else if (errorRate < 5) {
      console.log('  ✓ Acceptable error rate');
    } else {
      console.log('  ⚠️  WARNING: High error rate');
    }
  }

  console.log(`  Total Operations: ${data.metrics['total_operations']?.values.count || 'N/A'}`);

  return summary;
}
