import http from 'k6/http';
import { check, group } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/beevent/k6-reporter/master/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

/**
 * JobPilot AI Platform - API Response Time Benchmark
 *
 * This suite benchmarks all API endpoints to ensure they meet
 * the <200ms response time target under normal load.
 *
 * Benchmarked Categories:
 * 1. Health & Readiness Endpoints
 * 2. Authentication Endpoints
 * 3. Jobs Service Endpoints
 * 4. Applications Service Endpoints
 * 5. Resume Service Endpoints
 * 6. User Service Endpoints
 * 7. AI Service Endpoints
 * 8. Notification Service Endpoints
 */

// Custom Metrics - Per Endpoint
const healthCheckTime = new Trend('health_check_response_time');
const readinessCheckTime = new Trend('readiness_check_response_time');
const authLoginTime = new Trend('auth_login_response_time');
const authRegisterTime = new Trend('auth_register_response_time');
const jobsListTime = new Trend('jobs_list_response_time');
const jobsSearchTime = new Trend('jobs_search_response_time');
const jobDetailTime = new Trend('job_detail_response_time');
const applicationsListTime = new Trend('applications_list_response_time');
const applicationCreateTime = new Trend('application_create_response_time');
const resumesListTime = new Trend('resumes_list_response_time');
const resumeUploadTime = new Trend('resume_upload_response_time');
const userProfileTime = new Trend('user_profile_response_time');
const aiResumeOptimizeTime = new Trend('ai_resume_optimize_response_time');
const aiInterviewPrepTime = new Trend('ai_interview_prep_response_time');
const notificationsListTime = new Trend('notifications_list_response_time');

// Performance counters
const endpointsBelowTarget = new Counter('endpoints_below_200ms');
const endpointsAboveTarget = new Counter('endpoints_above_200ms');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;
const TARGET_RESPONSE_TIME = 200; // milliseconds

// Benchmark configuration
export const options = {
  scenarios: {
    benchmark: {
      executor: 'constant-vus',
      vus: 50, // Moderate load for benchmarking
      duration: '10m',
    },
  },
  thresholds: {
    // Global thresholds
    'http_req_duration': ['p(95)<200', 'p(99)<500', 'avg<150'],

    // Per-endpoint thresholds - Health checks (fastest)
    'health_check_response_time': ['p(95)<50', 'p(99)<100'],
    'readiness_check_response_time': ['p(95)<50', 'p(99)<100'],

    // Authentication (fast)
    'auth_login_response_time': ['p(95)<200', 'p(99)<400'],
    'auth_register_response_time': ['p(95)<300', 'p(99)<600'],

    // Jobs Service (fast)
    'jobs_list_response_time': ['p(95)<200', 'p(99)<400'],
    'jobs_search_response_time': ['p(95)<250', 'p(99)<500'],
    'job_detail_response_time': ['p(95)<150', 'p(99)<300'],

    // Applications Service (fast)
    'applications_list_response_time': ['p(95)<200', 'p(99)<400'],
    'application_create_response_time': ['p(95)<300', 'p(99)<600'],

    // Resume Service (moderate - file operations)
    'resumes_list_response_time': ['p(95)<250', 'p(99)<500'],
    'resume_upload_response_time': ['p(95)<1000', 'p(99)<2000'],

    // User Service (fast)
    'user_profile_response_time': ['p(95)<150', 'p(99)<300'],

    // AI Service (slower - ML operations)
    'ai_resume_optimize_response_time': ['p(95)<1000', 'p(99)<2000'],
    'ai_interview_prep_response_time': ['p(95)<800', 'p(99)<1500'],

    // Notification Service (fast)
    'notifications_list_response_time': ['p(95)<200', 'p(99)<400'],

    // Overall performance
    'checks': ['rate>0.95'],
    'http_req_failed': ['rate<0.05'],
  },
};

// Authentication token
let authToken = null;

function authenticate() {
  if (authToken) return authToken;

  const loginPayload = JSON.stringify({
    email: __ENV.TEST_USER_EMAIL || 'benchmark@jobpilot.ai',
    password: __ENV.TEST_USER_PASSWORD || 'Benchmark123!@#',
  });

  const loginRes = http.post(`${API_BASE}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
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

// Main benchmark function
export default function () {
  // 1. Health & Readiness Endpoints
  group('Health & Readiness Endpoints', () => {
    benchmarkEndpoint(
      'Health Check',
      'GET',
      `${API_BASE}/health`,
      null,
      {},
      50,
      healthCheckTime
    );

    benchmarkEndpoint(
      'Readiness Check',
      'GET',
      `${API_BASE}/ready`,
      null,
      {},
      50,
      readinessCheckTime
    );
  });

  // 2. Authentication Endpoints
  group('Authentication Endpoints', () => {
    const loginPayload = {
      email: 'benchmark@jobpilot.ai',
      password: 'Benchmark123!@#',
    };

    benchmarkEndpoint(
      'Login',
      'POST',
      `${API_BASE}/auth/login`,
      loginPayload,
      { 'Content-Type': 'application/json' },
      200,
      authLoginTime
    );

    const registerPayload = {
      email: `user-${Date.now()}@jobpilot.ai`,
      password: 'Test123!@#',
      firstName: 'Benchmark',
      lastName: 'User',
    };

    benchmarkEndpoint(
      'Register',
      'POST',
      `${API_BASE}/auth/register`,
      registerPayload,
      { 'Content-Type': 'application/json' },
      300,
      authRegisterTime
    );
  });

  // 3. Jobs Service Endpoints
  group('Jobs Service Endpoints', () => {
    benchmarkEndpoint(
      'List Jobs',
      'GET',
      `${API_BASE}/jobs?page=1&limit=20`,
      null,
      getAuthHeaders(),
      200,
      jobsListTime
    );

    benchmarkEndpoint(
      'Search Jobs',
      'GET',
      `${API_BASE}/jobs/search?query=software+engineer&location=remote`,
      null,
      getAuthHeaders(),
      250,
      jobsSearchTime
    );

    benchmarkEndpoint(
      'Get Job Detail',
      'GET',
      `${API_BASE}/jobs/1`,
      null,
      getAuthHeaders(),
      150,
      jobDetailTime
    );

    const jobMatchPayload = {
      resumeId: 'resume-123',
      jobId: 'job-456',
    };

    benchmarkEndpoint(
      'Job Match Score',
      'POST',
      `${API_BASE}/jobs/match-score`,
      jobMatchPayload,
      getAuthHeaders(),
      500,
      new Trend('job_match_score_response_time')
    );
  });

  // 4. Applications Service Endpoints
  group('Applications Service Endpoints', () => {
    benchmarkEndpoint(
      'List Applications',
      'GET',
      `${API_BASE}/applications?page=1&limit=20`,
      null,
      getAuthHeaders(),
      200,
      applicationsListTime
    );

    benchmarkEndpoint(
      'Filter Applications',
      'GET',
      `${API_BASE}/applications?status=pending&sort=createdAt`,
      null,
      getAuthHeaders(),
      200,
      new Trend('applications_filter_response_time')
    );

    const applicationPayload = {
      jobId: `job-${Date.now()}`,
      resumeId: 'resume-123',
      coverLetter: 'Sample cover letter',
    };

    benchmarkEndpoint(
      'Create Application',
      'POST',
      `${API_BASE}/applications`,
      applicationPayload,
      getAuthHeaders(),
      300,
      applicationCreateTime
    );
  });

  // 5. Resume Service Endpoints
  group('Resume Service Endpoints', () => {
    benchmarkEndpoint(
      'List Resumes',
      'GET',
      `${API_BASE}/resumes`,
      null,
      getAuthHeaders(),
      250,
      resumesListTime
    );

    benchmarkEndpoint(
      'Get Resume',
      'GET',
      `${API_BASE}/resumes/1`,
      null,
      getAuthHeaders(),
      200,
      new Trend('resume_detail_response_time')
    );

    // Note: Actual file upload would be slower, this is a placeholder
    const resumeMetadata = {
      title: 'Software Engineer Resume',
      format: 'pdf',
      size: 1024,
    };

    benchmarkEndpoint(
      'Resume Upload Metadata',
      'POST',
      `${API_BASE}/resumes/upload`,
      resumeMetadata,
      getAuthHeaders(),
      1000,
      resumeUploadTime
    );
  });

  // 6. User Service Endpoints
  group('User Service Endpoints', () => {
    benchmarkEndpoint(
      'Get User Profile',
      'GET',
      `${API_BASE}/user/profile`,
      null,
      getAuthHeaders(),
      150,
      userProfileTime
    );

    const profileUpdatePayload = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    benchmarkEndpoint(
      'Update Profile',
      'PATCH',
      `${API_BASE}/user/profile`,
      profileUpdatePayload,
      getAuthHeaders(),
      250,
      new Trend('user_update_response_time')
    );

    benchmarkEndpoint(
      'Get User Settings',
      'GET',
      `${API_BASE}/user/settings`,
      null,
      getAuthHeaders(),
      150,
      new Trend('user_settings_response_time')
    );
  });

  // 7. AI Service Endpoints
  group('AI Service Endpoints', () => {
    const resumeOptimizePayload = {
      resumeId: 'resume-123',
      jobDescription: 'Software Engineer position requiring React and Node.js',
    };

    benchmarkEndpoint(
      'AI Resume Optimization',
      'POST',
      `${API_BASE}/ai/resume-optimize`,
      resumeOptimizePayload,
      getAuthHeaders(),
      1000,
      aiResumeOptimizeTime
    );

    const interviewPrepPayload = {
      jobId: 'job-456',
      position: 'Senior Software Engineer',
    };

    benchmarkEndpoint(
      'AI Interview Preparation',
      'POST',
      `${API_BASE}/ai/interview-prep`,
      interviewPrepPayload,
      getAuthHeaders(),
      800,
      aiInterviewPrepTime
    );

    const salaryPredictPayload = {
      title: 'Software Engineer',
      location: 'San Francisco, CA',
      experience: 5,
    };

    benchmarkEndpoint(
      'AI Salary Prediction',
      'POST',
      `${API_BASE}/ai/salary-predict`,
      salaryPredictPayload,
      getAuthHeaders(),
      600,
      new Trend('ai_salary_predict_response_time')
    );
  });

  // 8. Notification Service Endpoints
  group('Notification Service Endpoints', () => {
    benchmarkEndpoint(
      'List Notifications',
      'GET',
      `${API_BASE}/notifications?page=1&limit=20`,
      null,
      getAuthHeaders(),
      200,
      notificationsListTime
    );

    benchmarkEndpoint(
      'Unread Notifications Count',
      'GET',
      `${API_BASE}/notifications/unread/count`,
      null,
      getAuthHeaders(),
      100,
      new Trend('notifications_unread_response_time')
    );

    benchmarkEndpoint(
      'Mark Notification Read',
      'PATCH',
      `${API_BASE}/notifications/1/read`,
      {},
      getAuthHeaders(),
      150,
      new Trend('notification_mark_read_response_time')
    );
  });
}

// Helper function to benchmark an endpoint
function benchmarkEndpoint(name, method, url, payload, headers, targetTime, metric) {
  const params = {
    headers,
    tags: { endpoint: name, target: targetTime },
  };

  let response;

  try {
    if (method === 'GET') {
      response = http.get(url, params);
    } else if (method === 'POST') {
      response = http.post(url, JSON.stringify(payload), params);
    } else if (method === 'PATCH') {
      response = http.patch(url, JSON.stringify(payload), params);
    } else if (method === 'PUT') {
      response = http.put(url, JSON.stringify(payload), params);
    } else if (method === 'DELETE') {
      response = http.del(url, null, params);
    }

    const responseTime = response.timings.duration;

    // Record metric
    metric.add(responseTime);

    // Check if meets target
    const meetsTarget = responseTime < targetTime;
    if (meetsTarget) {
      endpointsBelowTarget.add(1);
    } else {
      endpointsAboveTarget.add(1);
    }

    // Validate response
    check(response, {
      [`${name} - status is 2xx or 3xx`]: (r) => r.status >= 200 && r.status < 400,
      [`${name} - response time < ${targetTime}ms`]: (r) => r.timings.duration < targetTime,
      [`${name} - no server errors`]: (r) => r.status < 500,
    }, { endpoint: name });

    // Log slow responses
    if (responseTime > targetTime) {
      console.warn(
        `⚠️  ${name}: ${responseTime.toFixed(2)}ms (target: ${targetTime}ms)`
      );
    }
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
  }
}

// Setup
export function setup() {
  console.log('📊 Starting API Response Time Benchmark');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🎯 Target Response Time: ${TARGET_RESPONSE_TIME}ms`);
  console.log('');

  // Verify API is accessible
  const healthCheck = http.get(`${API_BASE}/health`);
  if (healthCheck.status !== 200) {
    throw new Error('API is not accessible');
  }

  console.log('✅ API accessible - beginning benchmark');
  console.log('');

  return {
    startTime: new Date().toISOString(),
    baselineHealth: healthCheck.timings.duration,
  };
}

// Teardown
export function teardown(data) {
  console.log('');
  console.log('📊 Benchmark Complete');
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);
  console.log(`Baseline Health Check: ${data.baselineHealth.toFixed(2)}ms`);
}

// Generate comprehensive report
export function handleSummary(data) {
  const endpointMetrics = {};

  // Extract all endpoint metrics
  Object.keys(data.metrics).forEach(key => {
    if (key.endsWith('_response_time')) {
      const metric = data.metrics[key];
      const endpointName = key.replace('_response_time', '');

      endpointMetrics[endpointName] = {
        avg: metric.values.avg?.toFixed(2) || 0,
        min: metric.values.min?.toFixed(2) || 0,
        max: metric.values.max?.toFixed(2) || 0,
        p50: metric.values['p(50)']?.toFixed(2) || 0,
        p95: metric.values['p(95)']?.toFixed(2) || 0,
        p99: metric.values['p(99)']?.toFixed(2) || 0,
      };
    }
  });

  const summary = {
    ...data,
    targetResponseTime: TARGET_RESPONSE_TIME,
    endpointMetrics,
    performance: {
      endpointsBelowTarget: data.metrics.endpoints_below_200ms?.values?.count || 0,
      endpointsAboveTarget: data.metrics.endpoints_above_200ms?.values?.count || 0,
    },
  };

  // Generate detailed console output
  let consoleOutput = textSummary(data, { indent: ' ', enableColors: true });

  consoleOutput += '\n\n📈 Endpoint Performance Summary:\n';
  consoleOutput += '─'.repeat(80) + '\n';

  Object.entries(endpointMetrics).forEach(([name, metrics]) => {
    const target = name.includes('health') ? 50 : name.includes('ai') ? 1000 : 200;
    const meetsTarget = parseFloat(metrics.p95) < target;
    const icon = meetsTarget ? '✅' : '⚠️';

    consoleOutput += `${icon} ${name.replace(/_/g, ' ').toUpperCase()}\n`;
    consoleOutput += `   Avg: ${metrics.avg}ms | P95: ${metrics.p95}ms | P99: ${metrics.p99}ms (Target: ${target}ms)\n`;
  });

  consoleOutput += '─'.repeat(80) + '\n';

  return {
    'api-benchmark-results.html': htmlReport(summary),
    'api-benchmark-summary.json': JSON.stringify(summary, null, 2),
    stdout: consoleOutput,
  };
}
