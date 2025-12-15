// Load Test Configuration for ApplyForUs AI Platform

export const config = {
  // Base URLs for services
  baseUrls: {
    auth: __ENV.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: __ENV.USER_SERVICE_URL || 'http://localhost:8002',
    resume: __ENV.RESUME_SERVICE_URL || 'http://localhost:8003',
    job: __ENV.JOB_SERVICE_URL || 'http://localhost:8004',
    autoApply: __ENV.AUTO_APPLY_SERVICE_URL || 'http://localhost:8005',
    analytics: __ENV.ANALYTICS_SERVICE_URL || 'http://localhost:8006',
    notification: __ENV.NOTIFICATION_SERVICE_URL || 'http://localhost:8007',
  },

  // Test credentials
  testUsers: {
    regular: {
      email: 'loadtest@applyforus.com',
      password: 'LoadTest123!@#',
    },
    premium: {
      email: 'loadtest-premium@applyforus.com',
      password: 'LoadTest123!@#',
    },
  },

  // Performance thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    http_reqs: ['rate>10'], // At least 10 req/s
    iterations: ['count>100'], // At least 100 iterations
  },

  // Load test scenarios
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '5m', target: 0 },
      ],
    },
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '10s', target: 5 },
        { duration: '10s', target: 100 }, // Spike
        { duration: '1m', target: 100 },
        { duration: '10s', target: 5 },
        { duration: '1m', target: 5 },
        { duration: '10s', target: 0 },
      ],
    },
    soak: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2h',
    },
  },
};

// Helper function to get random item from array
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate random string
export function randomString(length = 10) {
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

// Helper function to sleep for random duration
export function randomSleep(min = 1, max = 5) {
  const duration = Math.random() * (max - min) + min;
  return duration;
}
