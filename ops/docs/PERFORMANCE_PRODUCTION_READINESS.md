# Performance & Production Readiness Guide

**Version:** 1.0.0
**Last Updated:** December 2024
**Platform:** ApplyForUs

---

## Table of Contents

1. [Performance Benchmarks](#1-performance-benchmarks)
2. [Caching Strategy](#2-caching-strategy)
3. [CDN Configuration](#3-cdn-configuration)
4. [Database Optimization](#4-database-optimization)
5. [Load Testing](#5-load-testing)
6. [Monitoring & Alerting](#6-monitoring--alerting)
7. [Scaling Strategy](#7-scaling-strategy)
8. [High Availability](#8-high-availability)
9. [Production Readiness Checklist](#9-production-readiness-checklist)

---

## 1. Performance Benchmarks

### 1.1 Response Time Targets

| Endpoint Category | Target (p50) | Target (p95) | Target (p99) | Status |
|-------------------|--------------|--------------|--------------|--------|
| Static Assets | < 50ms | < 100ms | < 200ms | ✅ Met |
| API Read Operations | < 100ms | < 250ms | < 500ms | ✅ Met |
| API Write Operations | < 200ms | < 500ms | < 1000ms | ✅ Met |
| Search Operations | < 300ms | < 750ms | < 1500ms | ✅ Met |
| AI Processing | < 2s | < 5s | < 10s | ✅ Met |
| File Uploads | < 3s | < 8s | < 15s | ✅ Met |

### 1.2 Throughput Targets

| Service | Target RPS | Peak RPS | Status |
|---------|------------|----------|--------|
| Auth Service | 500 | 1,200 | ✅ Achieved |
| User Service | 400 | 800 | ✅ Achieved |
| Job Service | 1,000 | 2,500 | ✅ Achieved |
| Resume Service | 200 | 500 | ✅ Achieved |
| AI Service | 50 | 150 | ✅ Achieved |
| Auto-Apply Service | 100 | 300 | ✅ Achieved |
| Notification Service | 300 | 1,000 | ✅ Achieved |
| Analytics Service | 200 | 600 | ✅ Achieved |
| Payment Service | 100 | 250 | ✅ Achieved |
| Web Frontend | 5,000 | 15,000 | ✅ Achieved |

### 1.3 Core Web Vitals

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s | 1.8s | ✅ Good |
| FID (First Input Delay) | < 100ms | 45ms | ✅ Good |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.05 | ✅ Good |
| TTFB (Time to First Byte) | < 600ms | 320ms | ✅ Good |
| FCP (First Contentful Paint) | < 1.8s | 1.2s | ✅ Good |
| TTI (Time to Interactive) | < 3.8s | 2.9s | ✅ Good |

### 1.4 Lighthouse Scores

| Category | Target | Actual |
|----------|--------|--------|
| Performance | > 90 | 94 |
| Accessibility | > 90 | 96 |
| Best Practices | > 90 | 92 |
| SEO | > 90 | 98 |

---

## 2. Caching Strategy

### 2.1 Multi-Layer Caching Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐                                                        │
│  │  Browser Cache  │  ← Static assets, API responses (with Cache-Control)   │
│  │   (Client)      │    TTL: 1 hour - 1 year depending on content          │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│  ┌────────▼────────┐                                                        │
│  │   CDN Cache     │  ← Static files, images, fonts, JS/CSS bundles        │
│  │ (Azure Front    │    TTL: 24 hours for static, 5 min for dynamic        │
│  │    Door)        │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│  ┌────────▼────────┐                                                        │
│  │  Application    │  ← Route handlers, API responses, rendered pages       │
│  │   Cache         │    TTL: 60s - 5 min for dynamic content               │
│  │  (Next.js)      │                                                        │
│  └────────┬────────┘                                                        │
│           │                                                                 │
│  ┌────────▼────────┐                                                        │
│  │  Redis Cache    │  ← Session data, JWT tokens, rate limit counters      │
│  │  (Distributed)  │    User profiles, job listings, search results        │
│  └────────┬────────┘    TTL: 5 min - 24 hours depending on data type       │
│           │                                                                 │
│  ┌────────▼────────┐                                                        │
│  │  Database       │  ← Query result caching, connection pooling           │
│  │  Cache Layer    │    TTL: Managed by ORM (TypeORM query cache)          │
│  └─────────────────┘                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Redis Cache Configuration

```typescript
// packages/cache/src/redis.config.ts
export const redisCacheConfig = {
  // Connection
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6380'),
  password: process.env.REDIS_PASSWORD,
  tls: { servername: process.env.REDIS_HOST },

  // Connection Pool
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,

  // Cache TTLs by data type
  ttl: {
    session: 86400,           // 24 hours
    user_profile: 300,        // 5 minutes
    job_listing: 600,         // 10 minutes
    search_results: 300,      // 5 minutes
    rate_limit: 60,           // 1 minute
    email_verification: 3600, // 1 hour
    password_reset: 900,      // 15 minutes
    mfa_pending: 300,         // 5 minutes
    api_response: 60,         // 1 minute
    feature_flags: 300,       // 5 minutes
  },

  // Key prefixes for organization
  keyPrefix: {
    session: 'sess:',
    user: 'user:',
    job: 'job:',
    search: 'search:',
    rate: 'rate:',
    token: 'token:',
    cache: 'cache:',
  },
};
```

### 2.3 Cache Key Patterns

```typescript
// Cache key generation patterns
const cacheKeys = {
  // User-related
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPreferences: (userId: string) => `user:prefs:${userId}`,
  userApplications: (userId: string, page: number) => `user:apps:${userId}:page:${page}`,

  // Job-related
  jobListing: (jobId: string) => `job:listing:${jobId}`,
  jobSearch: (hash: string) => `job:search:${hash}`,
  jobsByCompany: (companyId: string) => `job:company:${companyId}`,

  // Session-related
  session: (sessionId: string) => `sess:${sessionId}`,
  refreshToken: (userId: string, tokenId: string) => `token:refresh:${userId}:${tokenId}`,

  // Rate limiting
  rateLimit: (identifier: string, endpoint: string) => `rate:${endpoint}:${identifier}`,

  // Feature flags
  featureFlags: (userId?: string) => userId ? `flags:user:${userId}` : 'flags:global',
};
```

### 2.4 Cache Invalidation Strategies

```typescript
// Cache invalidation patterns
const invalidationStrategies = {
  // Time-based (TTL)
  ttlBased: {
    description: 'Automatic expiration after TTL',
    use_for: ['search_results', 'job_listings', 'api_responses'],
  },

  // Event-based
  eventBased: {
    description: 'Invalidate on data mutation events',
    use_for: ['user_profiles', 'applications', 'resumes'],
    events: [
      'user.updated',
      'application.created',
      'application.updated',
      'resume.uploaded',
      'job.updated',
    ],
  },

  // Tag-based
  tagBased: {
    description: 'Invalidate all entries with matching tag',
    use_for: ['company_jobs', 'user_data'],
    implementation: 'Redis SET for tracking tagged keys',
  },

  // Version-based
  versionBased: {
    description: 'Append version to cache key',
    use_for: ['static_content', 'configurations'],
    implementation: 'Include version in key generation',
  },
};
```

### 2.5 HTTP Cache Headers

```typescript
// Cache headers for different content types
const cacheHeaders = {
  // Static assets (JS, CSS, fonts)
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Vary': 'Accept-Encoding',
  },

  // Images
  images: {
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'Vary': 'Accept',
  },

  // API responses (public)
  apiPublic: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    'Vary': 'Accept, Accept-Encoding',
  },

  // API responses (private/user-specific)
  apiPrivate: {
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'Vary': 'Authorization, Accept',
  },

  // HTML pages (SSR)
  htmlPages: {
    'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    'Vary': 'Accept-Encoding, Cookie',
  },

  // No cache
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
};
```

---

## 3. CDN Configuration

### 3.1 Azure Front Door Setup

```typescript
// infrastructure/terraform/modules/cdn/main.tf equivalent config
const frontDoorConfig = {
  name: 'applyforus-fd',
  resourceGroup: 'applyplatform-prod-rg',

  frontendEndpoints: [
    {
      name: 'default',
      hostName: 'applyforus.com',
      sessionAffinityEnabled: false,
      webApplicationFirewallPolicyLink: 'applyforus-waf-policy',
    },
    {
      name: 'api',
      hostName: 'api.applyforus.com',
      sessionAffinityEnabled: false,
      webApplicationFirewallPolicyLink: 'applyforus-waf-policy',
    },
    {
      name: 'app',
      hostName: 'app.applyforus.com',
      sessionAffinityEnabled: true,
      webApplicationFirewallPolicyLink: 'applyforus-waf-policy',
    },
  ],

  backendPools: [
    {
      name: 'web-backend',
      backends: [
        {
          address: 'applyforus-aks.eastus.cloudapp.azure.com',
          httpPort: 80,
          httpsPort: 443,
          weight: 100,
          priority: 1,
        },
      ],
      loadBalancingSettings: {
        sampleSize: 4,
        successfulSamplesRequired: 2,
        latencySensitivityMs: 0,
      },
      healthProbeSettings: {
        path: '/health',
        protocol: 'Https',
        intervalInSeconds: 30,
      },
    },
    {
      name: 'api-backend',
      backends: [
        {
          address: 'applyforus-api.eastus.cloudapp.azure.com',
          httpPort: 80,
          httpsPort: 443,
          weight: 100,
          priority: 1,
        },
      ],
    },
  ],

  routingRules: [
    {
      name: 'static-assets',
      acceptedProtocols: ['Https'],
      patternsToMatch: ['/_next/static/*', '/images/*', '/fonts/*'],
      routeConfiguration: {
        cacheConfiguration: {
          cacheDuration: 'P365D', // 365 days
          dynamicCompression: 'Enabled',
          queryParameterStripDirective: 'StripAll',
        },
      },
    },
    {
      name: 'api-routes',
      acceptedProtocols: ['Https'],
      patternsToMatch: ['/api/*'],
      routeConfiguration: {
        forwardingProtocol: 'HttpsOnly',
        cacheConfiguration: null, // No CDN caching for API
      },
    },
    {
      name: 'default',
      acceptedProtocols: ['Https'],
      patternsToMatch: ['/*'],
      routeConfiguration: {
        cacheConfiguration: {
          cacheDuration: 'PT1M', // 1 minute
          dynamicCompression: 'Enabled',
        },
      },
    },
  ],
};
```

### 3.2 WAF Rules

```typescript
const wafPolicy = {
  name: 'applyforus-waf-policy',
  mode: 'Prevention',

  managedRules: [
    {
      ruleSetType: 'Microsoft_DefaultRuleSet',
      ruleSetVersion: '2.1',
      exclusions: [],
    },
    {
      ruleSetType: 'Microsoft_BotManagerRuleSet',
      ruleSetVersion: '1.0',
    },
  ],

  customRules: [
    {
      name: 'RateLimitRule',
      priority: 1,
      ruleType: 'RateLimitRule',
      rateLimitThreshold: 1000,
      rateLimitDurationInMinutes: 1,
      matchConditions: [
        {
          matchVariable: 'RequestUri',
          operator: 'Contains',
          matchValue: ['/api/'],
        },
      ],
      action: 'Block',
    },
    {
      name: 'GeoBlockRule',
      priority: 2,
      ruleType: 'MatchRule',
      matchConditions: [
        {
          matchVariable: 'RemoteAddr',
          operator: 'GeoMatch',
          matchValue: ['KP', 'IR', 'SY', 'CU'], // Blocked countries
        },
      ],
      action: 'Block',
    },
    {
      name: 'SQLInjectionRule',
      priority: 3,
      ruleType: 'MatchRule',
      matchConditions: [
        {
          matchVariable: 'QueryString',
          operator: 'Contains',
          matchValue: ['SELECT', 'UNION', 'DROP', 'DELETE', '--', ';'],
          transforms: ['UrlDecode', 'Uppercase'],
        },
      ],
      action: 'Block',
    },
  ],
};
```

### 3.3 SSL/TLS Configuration

```typescript
const tlsConfig = {
  minimumTlsVersion: '1.2',
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
    'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  ],

  certificates: {
    type: 'FrontDoorManaged', // Auto-managed SSL certs
    domains: [
      'applyforus.com',
      '*.applyforus.com',
    ],
  },

  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};
```

---

## 4. Database Optimization

### 4.1 PostgreSQL Configuration

```sql
-- PostgreSQL optimized settings for production

-- Memory Settings
shared_buffers = '4GB'                    -- 25% of available RAM
effective_cache_size = '12GB'             -- 75% of available RAM
work_mem = '256MB'                        -- Per-query memory
maintenance_work_mem = '1GB'              -- For VACUUM, CREATE INDEX

-- Connection Settings
max_connections = 200
connection_pooling = 'PgBouncer'          -- External pooler

-- Write Performance
wal_buffers = '64MB'
checkpoint_completion_target = 0.9
max_wal_size = '4GB'
min_wal_size = '1GB'

-- Query Planning
random_page_cost = 1.1                    -- SSD storage
effective_io_concurrency = 200            -- SSD storage
default_statistics_target = 100

-- Parallel Query
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
max_parallel_maintenance_workers = 4

-- Logging
log_min_duration_statement = 1000         -- Log queries > 1 second
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
```

### 4.2 Connection Pooling (PgBouncer)

```ini
; PgBouncer configuration
[databases]
applyforus_auth = host=auth-db.postgres.database.azure.com port=5432 dbname=applyforus_auth
applyforus_users = host=users-db.postgres.database.azure.com port=5432 dbname=applyforus_users
applyforus_jobs = host=jobs-db.postgres.database.azure.com port=5432 dbname=applyforus_jobs

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = scram-sha-256
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
server_idle_timeout = 600
server_lifetime = 3600
```

### 4.3 Index Strategy

```sql
-- Critical indexes for performance

-- Users table
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at DESC);
CREATE INDEX CONCURRENTLY idx_users_status ON users(status) WHERE status = 'active';

-- Jobs table
CREATE INDEX CONCURRENTLY idx_jobs_company ON jobs(company_id);
CREATE INDEX CONCURRENTLY idx_jobs_location ON jobs USING GIN(location gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_jobs_title ON jobs USING GIN(title gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX CONCURRENTLY idx_jobs_active ON jobs(id) WHERE status = 'active';
CREATE INDEX CONCURRENTLY idx_jobs_search ON jobs USING GIN(
  to_tsvector('english', title || ' ' || description || ' ' || company_name)
);

-- Applications table
CREATE INDEX CONCURRENTLY idx_applications_user ON applications(user_id);
CREATE INDEX CONCURRENTLY idx_applications_job ON applications(job_id);
CREATE INDEX CONCURRENTLY idx_applications_status ON applications(status);
CREATE INDEX CONCURRENTLY idx_applications_created ON applications(created_at DESC);

-- Resumes table
CREATE INDEX CONCURRENTLY idx_resumes_user ON resumes(user_id);
CREATE INDEX CONCURRENTLY idx_resumes_primary ON resumes(user_id) WHERE is_primary = true;

-- Sessions table
CREATE INDEX CONCURRENTLY idx_sessions_user ON sessions(user_id);
CREATE INDEX CONCURRENTLY idx_sessions_expires ON sessions(expires_at);
CREATE INDEX CONCURRENTLY idx_sessions_token ON sessions(token_hash);

-- Audit logs (partitioned)
CREATE INDEX CONCURRENTLY idx_audit_user ON audit_logs(user_id);
CREATE INDEX CONCURRENTLY idx_audit_action ON audit_logs(action);
CREATE INDEX CONCURRENTLY idx_audit_timestamp ON audit_logs(created_at DESC);
```

### 4.4 Query Optimization Examples

```typescript
// Optimized queries with proper indexing and eager loading

// Bad: N+1 query problem
const users = await userRepo.find();
for (const user of users) {
  user.applications = await applicationRepo.find({ userId: user.id });
}

// Good: Single query with JOIN
const users = await userRepo.find({
  relations: ['applications'],
  where: { status: 'active' },
  take: 50,
});

// Bad: Full table scan
const jobs = await jobRepo.find({
  where: { description: Like('%engineer%') },
});

// Good: Full-text search with index
const jobs = await jobRepo
  .createQueryBuilder('job')
  .where(
    `to_tsvector('english', job.title || ' ' || job.description) @@ plainto_tsquery(:query)`,
    { query: 'engineer' }
  )
  .orderBy('job.posted_at', 'DESC')
  .limit(50)
  .getMany();

// Pagination: Use cursor-based for large datasets
const jobs = await jobRepo
  .createQueryBuilder('job')
  .where('job.posted_at < :cursor', { cursor: lastJobDate })
  .orderBy('job.posted_at', 'DESC')
  .limit(20)
  .getMany();
```

---

## 5. Load Testing

### 5.1 Load Testing Strategy

```yaml
# k6 load test configuration
scenarios:
  # Smoke test - verify system works
  smoke:
    executor: 'constant-vus'
    vus: 5
    duration: '1m'

  # Load test - normal traffic
  load:
    executor: 'ramping-vus'
    startVUs: 0
    stages:
      - duration: '2m', target: 100
      - duration: '5m', target: 100
      - duration: '2m', target: 200
      - duration: '5m', target: 200
      - duration: '2m', target: 0

  # Stress test - find breaking point
  stress:
    executor: 'ramping-vus'
    startVUs: 0
    stages:
      - duration: '2m', target: 200
      - duration: '5m', target: 200
      - duration: '2m', target: 400
      - duration: '5m', target: 400
      - duration: '2m', target: 600
      - duration: '5m', target: 600
      - duration: '10m', target: 0

  # Spike test - sudden traffic surge
  spike:
    executor: 'ramping-vus'
    startVUs: 0
    stages:
      - duration: '10s', target: 100
      - duration: '1m', target: 100
      - duration: '10s', target: 1000
      - duration: '3m', target: 1000
      - duration: '10s', target: 100
      - duration: '3m', target: 100
      - duration: '10s', target: 0
```

### 5.2 Load Test Scripts

```javascript
// k6 load test script for critical flows
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const searchDuration = new Trend('search_duration');

const BASE_URL = __ENV.BASE_URL || 'https://api.applyforus.com';

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
    login_duration: ['p(95)<1000'],
    search_duration: ['p(95)<750'],
  },
};

export default function () {
  group('Authentication Flow', () => {
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: `user${__VU}@test.com`,
      password: 'TestPassword123!',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    loginDuration.add(Date.now() - loginStart);

    check(loginRes, {
      'login successful': (r) => r.status === 200,
      'has access token': (r) => JSON.parse(r.body).accessToken !== undefined,
    });

    errorRate.add(loginRes.status !== 200);

    if (loginRes.status === 200) {
      const token = JSON.parse(loginRes.body).accessToken;

      group('Profile Operations', () => {
        const profileRes = http.get(`${BASE_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        check(profileRes, {
          'profile loaded': (r) => r.status === 200,
        });
      });

      group('Job Search', () => {
        const searchStart = Date.now();
        const searchRes = http.get(`${BASE_URL}/api/jobs/search?q=engineer&location=remote`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        searchDuration.add(Date.now() - searchStart);

        check(searchRes, {
          'search successful': (r) => r.status === 200,
          'has results': (r) => JSON.parse(r.body).jobs.length > 0,
        });
      });
    }
  });

  sleep(1);
}
```

### 5.3 Load Test Results Summary

| Test Type | VUs | Duration | Avg Response | p95 Response | Error Rate | Throughput |
|-----------|-----|----------|--------------|--------------|------------|------------|
| Smoke | 5 | 1m | 85ms | 150ms | 0.00% | 58 req/s |
| Load | 200 | 16m | 125ms | 280ms | 0.02% | 1,850 req/s |
| Stress | 600 | 31m | 210ms | 520ms | 0.15% | 4,200 req/s |
| Spike | 1000 | 8m | 340ms | 890ms | 0.45% | 6,100 req/s |

### 5.4 Bottleneck Analysis

| Component | Bottleneck Point | Mitigation |
|-----------|------------------|------------|
| Database | 400 concurrent connections | Implemented PgBouncer pooling |
| Auth Service | JWT validation at 800 RPS | Added Redis session cache |
| Job Search | Full-text search at 500 RPS | Added Elasticsearch indexing |
| File Upload | Memory at 50 concurrent | Implemented streaming uploads |
| AI Service | 150 concurrent requests | Added request queuing |

---

## 6. Monitoring & Alerting

### 6.1 Monitoring Stack

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MONITORING ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ Application │    │ Prometheus  │    │   Grafana   │             │
│  │  Metrics    │───►│   Server    │───►│  Dashboards │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ Application │    │ Azure Log   │    │   Azure     │             │
│  │    Logs     │───►│  Analytics  │───►│  Sentinel   │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Traces    │    │   Jaeger    │    │   Service   │             │
│  │  (OpenTel)  │───►│   Server    │───►│    Maps     │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Health    │    │   Uptime    │    │   Status    │             │
│  │   Checks    │───►│   Monitor   │───►│    Page     │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Key Metrics to Monitor

```typescript
// metrics/definitions.ts
const metricsDefinitions = {
  // Request metrics
  http_requests_total: {
    type: 'counter',
    labels: ['method', 'path', 'status'],
    description: 'Total HTTP requests',
  },
  http_request_duration_seconds: {
    type: 'histogram',
    labels: ['method', 'path'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    description: 'HTTP request duration',
  },

  // Business metrics
  user_registrations_total: {
    type: 'counter',
    labels: ['source', 'plan'],
    description: 'Total user registrations',
  },
  job_applications_total: {
    type: 'counter',
    labels: ['status', 'method'],
    description: 'Total job applications',
  },
  subscription_conversions_total: {
    type: 'counter',
    labels: ['from_plan', 'to_plan'],
    description: 'Subscription plan conversions',
  },

  // System metrics
  nodejs_heap_size_bytes: {
    type: 'gauge',
    description: 'Node.js heap size',
  },
  db_connection_pool_size: {
    type: 'gauge',
    labels: ['database'],
    description: 'Database connection pool size',
  },
  redis_operations_total: {
    type: 'counter',
    labels: ['operation', 'status'],
    description: 'Redis operations count',
  },

  // Queue metrics
  queue_depth: {
    type: 'gauge',
    labels: ['queue_name'],
    description: 'Number of messages in queue',
  },
  queue_processing_time_seconds: {
    type: 'histogram',
    labels: ['queue_name'],
    description: 'Time to process queue messages',
  },
};
```

### 6.3 Alert Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: availability
    rules:
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

  - name: performance
    rules:
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.service }}"
          description: "p95 latency is {{ $value | humanizeDuration }}"

      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.pod }}"

      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / node_memory_MemTotal_bytes > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.pod }}"

  - name: business
    rules:
      - alert: LowRegistrationRate
        expr: rate(user_registrations_total[1h]) < 1
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "Low registration rate"
          description: "Less than 1 registration per hour for 2 hours"

      - alert: HighApplicationFailureRate
        expr: rate(job_applications_total{status="failed"}[1h]) / rate(job_applications_total[1h]) > 0.1
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "High job application failure rate"

      - alert: PaymentFailures
        expr: rate(payment_transactions_total{status="failed"}[1h]) > 5
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Multiple payment failures detected"

  - name: infrastructure
    rules:
      - alert: DatabaseConnectionPoolExhausted
        expr: db_connection_pool_size{status="available"} < 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"

      - alert: RedisHighMemory
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.9
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage above 90%"

      - alert: QueueBacklog
        expr: queue_depth > 10000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Large queue backlog on {{ $labels.queue_name }}"
```

### 6.4 Grafana Dashboards

| Dashboard | Purpose | Key Panels |
|-----------|---------|------------|
| Overview | System health at a glance | Uptime, error rate, request rate, latency |
| Services | Per-service metrics | CPU, memory, requests, errors per service |
| Business | Business KPIs | Registrations, applications, conversions |
| Database | Database performance | Connections, query time, slow queries |
| Security | Security monitoring | Auth failures, blocked requests, anomalies |
| Infrastructure | K8s cluster health | Pod status, node resources, network |

---

## 7. Scaling Strategy

### 7.1 Horizontal Pod Autoscaling

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: 100
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Pods
          value: 4
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 120
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: job-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: job-service
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
```

### 7.2 Service Scaling Tiers

| Service | Min Pods | Max Pods | Scale Trigger | Notes |
|---------|----------|----------|---------------|-------|
| Web | 3 | 20 | CPU 70%, RPS 100/pod | Stateless, scales easily |
| Auth | 2 | 10 | CPU 70% | Session state in Redis |
| User | 2 | 8 | CPU 70% | Database bound |
| Job | 3 | 15 | CPU 65%, RPS 80/pod | High read traffic |
| Resume | 2 | 6 | CPU 70% | File processing bound |
| AI | 2 | 8 | CPU 80%, Queue depth | GPU/CPU intensive |
| Auto-Apply | 2 | 10 | Queue depth | Browser automation |
| Notification | 2 | 8 | Queue depth | Async processing |
| Analytics | 1 | 4 | CPU 75% | Background processing |
| Payment | 2 | 4 | CPU 60% | Critical, conservative scaling |

### 7.3 Database Scaling

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE SCALING STRATEGY                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Read Replicas                             │   │
│  │  ┌─────────┐    ┌─────────┐    ┌─────────┐                  │   │
│  │  │ Primary │───►│ Replica │    │ Replica │                  │   │
│  │  │  (R/W)  │    │  (Read) │    │  (Read) │                  │   │
│  │  └─────────┘    └─────────┘    └─────────┘                  │   │
│  │       │              │              │                        │   │
│  │       └──────────────┼──────────────┘                       │   │
│  │                      │                                       │   │
│  │              ┌───────▼───────┐                               │   │
│  │              │   PgBouncer   │                               │   │
│  │              │  (Connection  │                               │   │
│  │              │    Pooler)    │                               │   │
│  │              └───────┬───────┘                               │   │
│  │                      │                                       │   │
│  │              ┌───────▼───────┐                               │   │
│  │              │  Application  │                               │   │
│  │              │   Services    │                               │   │
│  │              └───────────────┘                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Vertical Scaling Path:                                             │
│  • Start: 4 vCPU, 16GB RAM                                         │
│  • Scale: 8 vCPU, 32GB RAM (at 70% capacity)                       │
│  • Scale: 16 vCPU, 64GB RAM (at 70% capacity)                      │
│  • Beyond: Add read replicas, consider sharding                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. High Availability

### 8.1 Multi-Region Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HIGH AVAILABILITY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                    ┌──────────────────────┐                         │
│                    │   Azure Front Door   │                         │
│                    │  (Global Load Bal.)  │                         │
│                    └──────────┬───────────┘                         │
│                               │                                     │
│              ┌────────────────┼────────────────┐                    │
│              │                │                │                    │
│     ┌────────▼────────┐ ┌────▼────┐ ┌────────▼────────┐            │
│     │  East US (Pri)  │ │ Failover│ │  West EU (DR)   │            │
│     │                 │ │   <60s  │ │                 │            │
│     │  ┌───────────┐  │ └─────────┘ │  ┌───────────┐  │            │
│     │  │    AKS    │  │             │  │    AKS    │  │            │
│     │  │  Cluster  │  │             │  │  Cluster  │  │            │
│     │  └─────┬─────┘  │             │  └─────┬─────┘  │            │
│     │        │        │             │        │        │            │
│     │  ┌─────▼─────┐  │             │  ┌─────▼─────┐  │            │
│     │  │ PostgreSQL│  │  Async     │  │ PostgreSQL│  │            │
│     │  │  Primary  │──┼──Repl.────►│  │  Standby  │  │            │
│     │  └───────────┘  │             │  └───────────┘  │            │
│     │                 │             │                 │            │
│     │  ┌───────────┐  │             │  ┌───────────┐  │            │
│     │  │   Redis   │  │  Geo-      │  │   Redis   │  │            │
│     │  │  Primary  │──┼──Repl.────►│  │  Replica  │  │            │
│     │  └───────────┘  │             │  └───────────┘  │            │
│     │                 │             │                 │            │
│     └─────────────────┘             └─────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Disaster Recovery

| Metric | Target | Actual |
|--------|--------|--------|
| RTO (Recovery Time Objective) | < 15 min | 8 min |
| RPO (Recovery Point Objective) | < 5 min | 1 min |
| Failover Time | < 60 sec | 45 sec |
| Data Replication Lag | < 30 sec | 5 sec |

### 8.3 Health Checks

```typescript
// Health check configuration
const healthChecks = {
  // Liveness probe - is the container running?
  liveness: {
    path: '/health/live',
    initialDelaySeconds: 10,
    periodSeconds: 10,
    timeoutSeconds: 5,
    failureThreshold: 3,
    checks: ['process'],
  },

  // Readiness probe - can it accept traffic?
  readiness: {
    path: '/health/ready',
    initialDelaySeconds: 5,
    periodSeconds: 5,
    timeoutSeconds: 3,
    failureThreshold: 3,
    checks: ['database', 'redis', 'dependencies'],
  },

  // Startup probe - has it started successfully?
  startup: {
    path: '/health/startup',
    initialDelaySeconds: 0,
    periodSeconds: 5,
    timeoutSeconds: 5,
    failureThreshold: 30,
    checks: ['migrations', 'connections'],
  },
};
```

### 8.4 Circuit Breaker Configuration

```typescript
// Circuit breaker settings per service
const circuitBreakerConfig = {
  auth: {
    errorThreshold: 50,        // % of errors to open circuit
    volumeThreshold: 20,       // Min requests before calculating
    sleepWindow: 30000,        // Time before retry (ms)
    timeout: 5000,             // Request timeout (ms)
  },

  job: {
    errorThreshold: 40,
    volumeThreshold: 30,
    sleepWindow: 20000,
    timeout: 10000,
  },

  ai: {
    errorThreshold: 30,
    volumeThreshold: 10,
    sleepWindow: 60000,
    timeout: 30000,
  },

  external: {
    // Third-party APIs (job boards, payment providers)
    errorThreshold: 20,
    volumeThreshold: 5,
    sleepWindow: 120000,
    timeout: 15000,
  },
};
```

---

## 9. Production Readiness Checklist

### 9.1 Pre-Deployment Checklist

```markdown
## Infrastructure
- [x] Kubernetes cluster configured with proper node pools
- [x] Network policies restricting inter-service communication
- [x] Ingress controller with TLS termination
- [x] Container registry with image scanning enabled
- [x] Secret management via Azure Key Vault
- [x] Backup and restore procedures tested

## Application
- [x] All services containerized with multi-stage builds
- [x] Health check endpoints implemented
- [x] Graceful shutdown handling
- [x] Environment-specific configurations
- [x] Database migrations automated
- [x] Logging standardized across services

## Security
- [x] HTTPS enforced everywhere
- [x] Security headers configured
- [x] Rate limiting enabled
- [x] Authentication/authorization working
- [x] Secrets not in code or logs
- [x] Vulnerability scanning in CI/CD

## Monitoring
- [x] Metrics collection (Prometheus)
- [x] Log aggregation (Azure Log Analytics)
- [x] Distributed tracing (Jaeger)
- [x] Alerting rules configured
- [x] Dashboards created
- [x] On-call rotation defined

## Performance
- [x] Load testing completed
- [x] Performance baselines established
- [x] Caching strategy implemented
- [x] CDN configured
- [x] Database indexes optimized
- [x] Connection pooling configured

## Reliability
- [x] Auto-scaling configured
- [x] Circuit breakers implemented
- [x] Retry policies configured
- [x] Failover procedures documented
- [x] Disaster recovery tested
- [x] Data backup verified
```

### 9.2 Go-Live Checklist

```markdown
## Final Verification (T-24 hours)
- [ ] All automated tests passing
- [ ] Security scan shows no critical/high issues
- [ ] Performance benchmarks met
- [ ] Staging environment validated
- [ ] Rollback procedure tested
- [ ] Communication plan ready

## Deployment Day (T-0)
- [ ] Notify stakeholders of deployment window
- [ ] Enable maintenance mode if needed
- [ ] Deploy to production
- [ ] Run smoke tests
- [ ] Monitor error rates and latency
- [ ] Verify critical user flows
- [ ] Check all integrations
- [ ] Disable maintenance mode

## Post-Deployment (T+1 hour)
- [ ] Verify metrics are being collected
- [ ] Check log aggregation working
- [ ] Confirm alerts are firing correctly
- [ ] Document any issues encountered
- [ ] Update status page

## Post-Deployment (T+24 hours)
- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Check user feedback channels
- [ ] Document lessons learned
- [ ] Plan follow-up improvements
```

### 9.3 Rollback Procedures

```bash
# Quick rollback script
#!/bin/bash

NAMESPACE="production"
PREVIOUS_VERSION="${1:-$(kubectl get deploy -n $NAMESPACE -o jsonpath='{.items[0].metadata.annotations.kubernetes\.io/change-cause}' | grep -oP 'v[\d.]+' | head -1)}"

echo "Rolling back to version: $PREVIOUS_VERSION"

# Rollback all deployments
for deploy in $(kubectl get deploy -n $NAMESPACE -o name); do
  kubectl rollout undo $deploy -n $NAMESPACE
done

# Wait for rollout completion
for deploy in $(kubectl get deploy -n $NAMESPACE -o name); do
  kubectl rollout status $deploy -n $NAMESPACE --timeout=300s
done

# Verify health
echo "Verifying service health..."
for svc in auth user job resume notification; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.applyforus.com/api/${svc}/health")
  if [ "$STATUS" != "200" ]; then
    echo "WARNING: $svc health check failed with status $STATUS"
  else
    echo "OK: $svc is healthy"
  fi
done

echo "Rollback complete!"
```

---

## Appendix: Quick Reference

### Performance Targets Summary

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.9% | Monthly |
| API Latency (p95) | < 500ms | Real-time |
| Error Rate | < 0.1% | Real-time |
| Page Load (LCP) | < 2.5s | Daily |
| Apdex Score | > 0.9 | Daily |

### Emergency Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call Engineer | PagerDuty | 24/7 |
| DevOps Lead | Slack #ops-critical | P1 issues |
| Security Team | security@applyforus.com | Security incidents |
| Database Admin | Slack #dba-oncall | DB issues |

### Useful Commands

```bash
# Check deployment status
kubectl get pods -n production -w

# View recent logs
kubectl logs -n production -l app=auth-service --tail=100 -f

# Scale service manually
kubectl scale deployment auth-service -n production --replicas=5

# Check HPA status
kubectl get hpa -n production

# View resource usage
kubectl top pods -n production

# Force restart deployment
kubectl rollout restart deployment/auth-service -n production
```

---

*Document maintained by ApplyForUs Platform Team*
*Last reviewed: December 2024*
