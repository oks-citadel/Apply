# ApplyForUs AI Platform - Observability Guide

## Table of Contents

1. [Overview](#overview)
2. [Metrics Reference](#metrics-reference)
3. [Alert Thresholds & Escalation](#alert-thresholds--escalation)
4. [Running Load Tests](#running-load-tests)
5. [Interpreting Results](#interpreting-results)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Overview

This guide provides comprehensive documentation for monitoring, observing, and validating the ApplyForUs AI Platform. Our observability stack includes:

- **Prometheus**: Metrics collection and storage
- **Grafana**: Visualization and dashboards
- **Azure Application Insights**: Distributed tracing and APM
- **AlertManager**: Alert routing and notifications
- **K6**: Load testing framework

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Microservices Layer                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ Auth │  │ User │  │ Job  │  │Resume│  │  AI  │    │
│  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘    │
│     │         │         │         │         │          │
│     └─────────┴─────────┴─────────┴─────────┘          │
│                       │                                  │
└───────────────────────┼──────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
   ┌────▼────┐                   ┌─────▼──────┐
   │Prometheus│                  │Azure App   │
   │  :9090  │                   │ Insights   │
   └────┬────┘                   └────────────┘
        │
   ┌────▼────┐
   │ Grafana │
   │  :3001  │
   └────┬────┘
        │
   ┌────▼─────┐
   │AlertMgr  │
   │  :9093   │
   └──────────┘
```

---

## Metrics Reference

### Gateway & Reliability Metrics

#### Rate Limiting Metrics

| Metric Name | Type | Description | Labels | Threshold |
|------------|------|-------------|--------|-----------|
| `gateway_rate_limit_total` | Counter | Total rate limit checks performed | `service`, `route`, `status` | N/A |
| `gateway_rate_limit_degraded_total` | Counter | Rate limit operations in degraded mode (Redis unavailable) | `service`, `route`, `reason` | Alert if > 1% for 5min |
| `gateway_rate_limit_errors_total` | Counter | Rate limiting errors encountered | `service`, `route`, `error_type` | Alert if > 0.5% |

**Status Label Values:**
- `allowed`: Request was within rate limit
- `rejected`: Request exceeded rate limit (429 response)
- `degraded`: Rate limiting bypassed due to Redis failure (fail-open mode)

**Example PromQL Queries:**
```promql
# Rate of degraded mode operations
rate(gateway_rate_limit_degraded_total[5m])

# Percentage of requests in degraded mode
(sum(rate(gateway_rate_limit_total{status="degraded"}[5m])) /
 sum(rate(gateway_rate_limit_total[5m]))) * 100

# Rate limit rejection rate
(sum(rate(gateway_rate_limit_total{status="rejected"}[5m])) /
 sum(rate(gateway_rate_limit_total[5m]))) * 100
```

#### Redis Dependency Metrics

| Metric Name | Type | Description | Labels | Threshold |
|------------|------|-------------|--------|-----------|
| `redis_operation_duration_seconds` | Histogram | Duration of Redis operations | `operation`, `service` | P95 < 100ms |
| `redis_connection_state` | Gauge | Redis connection state (1=connected, 0=disconnected) | `service`, `host` | Alert if 0 |
| `redis_errors_total` | Counter | Total Redis errors | `service`, `operation`, `error_type` | Alert if rate > 5% |
| `redis_operations_total` | Counter | Total Redis operations | `service`, `operation`, `status` | N/A |

**Example PromQL Queries:**
```promql
# P95 Redis latency
histogram_quantile(0.95,
  sum(rate(redis_operation_duration_seconds_bucket[5m])) by (le, service)
)

# Redis error rate
(sum(rate(redis_errors_total[5m])) by (service) /
 sum(rate(redis_operations_total[5m])) by (service)) * 100

# Redis connection status
redis_connection_state
```

#### Circuit Breaker Metrics

| Metric Name | Type | Description | Labels | Threshold |
|------------|------|-------------|--------|-----------|
| `circuit_breaker_state` | Gauge | Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN) | `service`, `circuit_name` | Alert if 1 (OPEN) |
| `circuit_breaker_state_changes_total` | Counter | Total state changes | `service`, `circuit_name`, `from_state`, `to_state` | Alert if flapping |
| `circuit_breaker_trips_total` | Counter | Total times breaker has tripped | `service`, `circuit_name`, `reason` | Alert if > 10/min |
| `circuit_breaker_fallbacks_total` | Counter | Total fallback executions | `service`, `circuit_name` | Monitor trends |

**State Values:**
- `0`: CLOSED - Normal operation
- `1`: OPEN - Circuit breaker tripped, failing fast
- `2`: HALF_OPEN - Testing if service recovered

**Example PromQL Queries:**
```promql
# Circuit breaker state
circuit_breaker_state

# Circuit breakers currently open
count(circuit_breaker_state == 1)

# Circuit breaker trip rate
rate(circuit_breaker_trips_total[5m])

# Frequent state changes (flapping)
rate(circuit_breaker_state_changes_total[5m]) > 0.5
```

### HTTP & Request Metrics

| Metric Name | Type | Description | Labels | Threshold |
|------------|------|-------------|--------|-----------|
| `http_request_duration_by_route_seconds` | Histogram | HTTP request duration per route | `method`, `route`, `status_code`, `service` | P95 < 2s |
| `http_requests_by_route_total` | Counter | Total HTTP requests per route | `method`, `route`, `status_code`, `service` | N/A |
| `http_request_duration_seconds` | Histogram | General HTTP request duration | `method`, `route`, `status_code` | P95 < 2s |
| `http_requests_total` | Counter | Total HTTP requests | `method`, `route`, `status_code` | N/A |

**Example PromQL Queries:**
```promql
# P95 latency by route
histogram_quantile(0.95,
  sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route, service)
)

# 5xx error rate
(sum(rate(http_requests_by_route_total{status_code=~"5.."}[5m])) by (service) /
 sum(rate(http_requests_by_route_total[5m])) by (service)) * 100

# Top 5 slowest endpoints
topk(5,
  histogram_quantile(0.95,
    sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route)
  )
)
```

### Database Metrics

| Metric Name | Type | Description | Labels | Threshold |
|------------|------|-------------|--------|-----------|
| `postgres_connection_pool_size` | Gauge | Total connection pool size | `service` | N/A |
| `postgres_connection_pool_used` | Gauge | Connections currently in use | `service` | Alert if > 90% |
| `postgres_connection_pool_idle` | Gauge | Idle connections | `service` | Monitor trends |
| `postgres_connection_pool_waiting` | Gauge | Requests waiting for connection | `service` | Alert if > 5 |
| `database_query_duration_seconds` | Histogram | Database query duration | `operation`, `table` | P95 < 1s |

**Example PromQL Queries:**
```promql
# Connection pool usage percentage
(postgres_connection_pool_used / postgres_connection_pool_size) * 100

# Queries waiting for connections
postgres_connection_pool_waiting

# P95 query duration
histogram_quantile(0.95,
  sum(rate(database_query_duration_seconds_bucket[5m])) by (le, service)
)
```

### Business Metrics

| Metric Name | Type | Description | Tracking |
|------------|------|-------------|----------|
| `job_applications_total` | Counter | Total job applications submitted | Business KPI |
| `resume_generations_total` | Counter | Total resumes generated | Business KPI |
| `ai_requests_total` | Counter | Total AI API requests | Cost & usage |
| `ai_request_duration_seconds` | Histogram | AI request duration | Performance |
| `user_active_total` | Gauge | Currently active users | Capacity |

---

## Alert Thresholds & Escalation

### Critical Alerts (PagerDuty + Slack #alerts-critical)

| Alert Name | Condition | Duration | Impact | Runbook |
|-----------|-----------|----------|--------|---------|
| **GatewayRateLimitDegradedMode** | Degraded mode > 1% | 5 minutes | Rate limiting disabled, security risk | [Link](#degraded-mode-runbook) |
| **High5xxSpikeGateway** | 5xx error rate > 10% | 2 minutes | Service degradation | [Link](#5xx-spike-runbook) |
| **CircuitBreakerOpen** | Circuit breaker open | 1 minute | Service dependency failed | [Link](#circuit-breaker-runbook) |
| **RedisConnectionDown** | Redis disconnected | 1 minute | Cache unavailable, degraded performance | [Link](#redis-down-runbook) |
| **PostgresConnectionPoolExhausted** | Pool usage > 90% | 2 minutes | Database bottleneck | [Link](#db-pool-runbook) |
| **ServiceDown** | Service unavailable | 1 minute | Complete service outage | [Link](#service-down-runbook) |

### Warning Alerts (Slack #alerts-warnings)

| Alert Name | Condition | Duration | Impact | Action |
|-----------|-----------|----------|--------|--------|
| **HighRedisLatency** | P95 > 100ms | 5 minutes | Slow cache responses | Monitor, consider scaling |
| **VerySlowResponseTime** | P95 > 5s | 3 minutes | Poor user experience | Investigate performance |
| **HighCircuitBreakerFailureRate** | > 10 failures/sec | 5 minutes | Unstable dependency | Monitor dependency health |
| **PostgresConnectionPoolHighWait** | > 5 waiting | 1 minute | Database contention | Consider pool size increase |

### Escalation Policy

1. **Immediate (0-5 minutes)**
   - PagerDuty alerts on-call engineer
   - Post to #alerts-critical Slack channel
   - Auto-create incident ticket

2. **Escalated (5-15 minutes)**
   - Page team lead if unacknowledged
   - Notify engineering manager
   - Update status page

3. **Critical (15+ minutes)**
   - Page CTO
   - Initiate incident response protocol
   - Customer communication plan

---

## Running Load Tests

### Prerequisites

1. Install K6:
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

2. Set environment variables:
```bash
export AUTH_SERVICE_URL="http://localhost:3001"
export USER_SERVICE_URL="http://localhost:8002"
export JOB_SERVICE_URL="http://localhost:8004"
# ... other services
```

### Available Load Tests

Navigate to `tests/load/` directory:

```bash
cd tests/load
```

#### 1. Smoke Test
Quick validation that the system works under minimal load.

```bash
npm run test:smoke
# or
k6 run scenarios/smoke-test.js
```

**Purpose:** Verify basic functionality
**Duration:** 1 minute
**Load:** 1 VU (Virtual User)
**Success Criteria:** All endpoints respond correctly

#### 2. Rate Limit Test
Validates rate limiting behavior and degraded mode.

```bash
npm run test:rate-limit
# or
k6 run scenarios/rate-limit-test.js
```

**Purpose:** Test rate limiter under various loads
**Duration:** ~7 minutes
**Phases:**
- Warmup: 2 VUs for 30s
- Heavy: Ramp 5→30 VUs over 6min
- Burst: Spike to 50 VUs for 30s

**Success Criteria:**
- Rate limit headers present in 90%+ responses
- Degraded mode < 1% (unless Redis intentionally down)
- P95 response time < 1s

**Metrics to Monitor:**
```bash
# While test is running, check Prometheus:
gateway_rate_limit_total{status="rejected"}
gateway_rate_limit_degraded_total
rate(gateway_rate_limit_total[1m])
```

#### 3. Redis Failure Test
Tests system resilience when Redis is unavailable.

```bash
npm run test:redis-failure
# or
k6 run scenarios/redis-failure-test.js
```

**Purpose:** Validate fail-open behavior and degraded mode
**Duration:** 7 minutes
**Phases:**
- Normal: 5 VUs with Redis healthy (2min)
- Degraded: 5 VUs simulating Redis failure (3min)
- Recovery: 5 VUs after Redis restored (2min)

**Success Criteria:**
- System availability > 95% during Redis failure
- No 5xx errors (fail-open mode active)
- Degraded mode properly detected
- Normal operation restored after recovery

**To Simulate Redis Failure (for testing):**
```bash
# Stop Redis temporarily
docker-compose stop redis
# Or using kubectl
kubectl scale deployment redis --replicas=0 -n applyforus

# Run the test
k6 run scenarios/redis-failure-test.js

# Restore Redis
docker-compose start redis
kubectl scale deployment redis --replicas=1 -n applyforus
```

#### 4. Circuit Breaker Test
Tests circuit breaker resilience patterns.

```bash
npm run test:circuit-breaker
# or
k6 run scenarios/circuit-breaker-test.js
```

**Purpose:** Validate circuit breakers open/close correctly
**Duration:** 7 minutes
**Phases:**
- Normal: 5 VUs baseline (2min)
- Error injection: 10 VUs with error-inducing requests (3min)
- Recovery: 5 VUs normal traffic (2min)

**Success Criteria:**
- Circuit breakers open when error threshold exceeded
- Fallback mechanisms execute
- Circuit breakers close after recovery period

#### 5. Standard Load Tests

**Load Test** - Sustained load:
```bash
npm run test:load
```
- Duration: 16 minutes
- Ramp: 0→10→20 VUs

**Stress Test** - High load:
```bash
npm run test:stress
```
- Duration: 26 minutes
- Ramp: 0→20→50→100 VUs

**Spike Test** - Sudden traffic spike:
```bash
npm run test:spike
```
- Duration: ~3 minutes
- Spike: 5→100 VUs in 10s

**Soak Test** - Long-duration stability:
```bash
npm run test:soak
```
- Duration: 2 hours
- Constant: 20 VUs

### Interpreting Load Test Results

#### K6 Output

```
     ✓ status is 200
     ✓ response time < 1s
     ✓ has rate limit headers

     checks.........................: 95.23% ✓ 2857  ✗ 143
     data_received..................: 1.2 MB 20 kB/s
     data_sent......................: 450 kB 7.5 kB/s
     http_req_duration..............: avg=245ms min=45ms med=198ms max=1.2s p(90)=412ms p(95)=567ms
     http_req_failed................: 2.45%  ✓ 73    ✗ 2927
     http_reqs......................: 3000   50/s
     iteration_duration.............: avg=1.25s min=1.05s med=1.21s max=2.3s
     iterations.....................: 3000   50/s
```

**Key Metrics to Check:**

1. **Checks Pass Rate**: Should be > 95%
2. **http_req_failed**: Should be < 5%
3. **http_req_duration P95**: Should be < 2s (varies by test)
4. **Custom Metrics**:
   - `rate_limit_allowed`
   - `rate_limit_rejected`
   - `degraded_mode_active`

#### Prometheus Queries During Tests

Open Prometheus (http://localhost:9090) and run:

```promql
# Current rate of requests
rate(http_requests_total[1m])

# Current error rate
rate(http_requests_total{status_code=~"5.."}[1m]) /
rate(http_requests_total[1m])

# Current P95 latency
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[1m])
)

# Rate limiting status
sum(rate(gateway_rate_limit_total[1m])) by (status)

# Circuit breaker states
circuit_breaker_state
```

#### Grafana Dashboards

Access Grafana (http://localhost:3001) and view:

1. **Service Overview Dashboard**
   - Real-time request rates
   - Error rates
   - Response time percentiles

2. **Load Test Dashboard** (if configured)
   - VU count over time
   - Request rate vs error rate
   - Response time distribution

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Degraded Mode Alert Firing

**Symptoms:**
- `gateway_rate_limit_degraded_total` increasing
- Alert: "Gateway rate limiting in degraded mode"

**Diagnosis:**
```bash
# Check Redis connection
redis-cli ping

# Check Redis metrics
curl http://localhost:3001/metrics | grep redis_connection_state

# Check circuit breaker state
curl http://localhost:3001/metrics | grep circuit_breaker_state
```

**Resolution:**
1. Verify Redis is running: `docker ps | grep redis`
2. Check Redis logs: `docker logs redis`
3. Check network connectivity
4. Verify Redis credentials in service config
5. If Redis is down, restart it: `docker-compose up -d redis`

**Prevention:**
- Set up Redis replication/clustering
- Monitor Redis memory usage
- Configure Redis persistence
- Set up Redis connection pooling

#### 2. Circuit Breaker Open

**Symptoms:**
- `circuit_breaker_state = 1` (OPEN)
- Requests failing fast
- Fallback responses returned

**Diagnosis:**
```promql
# Check which circuit is open
circuit_breaker_state == 1

# Check trip reason
rate(circuit_breaker_trips_total[5m])

# Check fallback executions
rate(circuit_breaker_fallbacks_total[5m])
```

**Resolution:**
1. Identify the failing dependency
2. Check dependency service health
3. Review recent deployments
4. Wait for circuit breaker to test recovery (HALF_OPEN state)
5. If dependency is healthy, circuit will close automatically

**Manual Override (emergency only):**
```bash
# Force circuit breaker reset (use with caution)
# This is application-specific and should be implemented
curl -X POST http://localhost:3001/admin/circuit-breaker/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"circuit": "redis-cache"}'
```

#### 3. High Response Times

**Symptoms:**
- P95 latency > 5s
- Alert: "VerySlowResponseTime"

**Diagnosis:**
```bash
# Identify slowest endpoints
curl http://localhost:9090/api/v1/query?query='topk(5, histogram_quantile(0.95, sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route)))'

# Check database query times
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))'

# Check Redis latency
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[5m]))'
```

**Resolution:**
1. Check database connection pool usage
2. Identify slow queries in database
3. Check for N+1 query problems
4. Review recent code changes
5. Consider adding caching
6. Scale horizontally if needed

#### 4. Database Connection Pool Exhausted

**Symptoms:**
- `postgres_connection_pool_waiting > 5`
- Alert: "PostgresConnectionPoolExhausted"
- Requests timing out

**Diagnosis:**
```bash
# Check pool metrics
curl http://localhost:3001/metrics | grep postgres_connection_pool

# Check active connections
psql -U postgres -d applyforus -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Check long-running queries
psql -U postgres -d applyforus -c "SELECT pid, now() - query_start as duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC;"
```

**Resolution:**
1. Increase connection pool size (temporary):
   ```typescript
   // In database config
   poolSize: 30, // Increase from 20
   ```
2. Identify and kill long-running queries
3. Check for connection leaks (connections not released)
4. Optimize queries
5. Consider read replicas for read-heavy workloads

### Validation Script

Use the validation script to check overall system health:

```bash
# Local environment
./scripts/validate-system.sh local

# Staging environment
./scripts/validate-system.sh staging

# Production environment
./scripts/validate-system.sh production
```

The script checks:
- ✓ All service health endpoints
- ✓ Metrics endpoints accessible
- ✓ Critical metrics present
- ✓ Authentication flow working
- ✓ Job search functionality
- ✓ Prometheus collecting metrics

Example output:
```
========================================
ApplyForUs AI Platform - System Validation
========================================

Environment: local
Base URL: http://localhost
Timeout: 10s

========================================
Phase 1: Service Health Checks
========================================

✓ Auth Service is healthy
  Status: ok
    database: ok
    redis: ok
✓ User Service is healthy
✓ Job Service is healthy
...

========================================
Validation Summary
========================================

Total Checks: 15
Failed Checks: 0
Success Rate: 100%

✓ All validation checks passed!
✓ System is ready for use.
```

---

## Best Practices

### 1. Metrics Collection

**DO:**
- Use appropriate metric types (Counter, Gauge, Histogram)
- Include relevant labels (but avoid high cardinality)
- Name metrics consistently: `<service>_<metric>_<unit>`
- Document what each metric measures

**DON'T:**
- Create metrics with unbounded label values (e.g., user IDs)
- Use too many labels (limit to 5-7 per metric)
- Create duplicate metrics with different names
- Include sensitive data in labels

### 2. Alert Configuration

**DO:**
- Set thresholds based on actual baseline performance
- Use `for` durations to avoid flapping alerts
- Include runbook links in annotations
- Test alerts before deploying
- Group related alerts

**DON'T:**
- Alert on everything (alert fatigue)
- Set thresholds too tight (false positives)
- Use generic alert messages
- Skip documentation of alerts
- Ignore warning alerts

### 3. Load Testing

**DO:**
- Run tests regularly (weekly minimum)
- Test during off-peak hours
- Gradually increase load
- Monitor all metrics during tests
- Document test results
- Test failure scenarios

**DON'T:**
- Run load tests in production
- Start with maximum load
- Ignore failed checks
- Skip baseline measurements
- Test only happy paths

### 4. Incident Response

**DO:**
- Acknowledge alerts immediately
- Follow runbooks
- Document actions taken
- Communicate status clearly
- Conduct post-incident reviews
- Update runbooks based on learnings

**DON'T:**
- Panic or make hasty changes
- Skip investigation steps
- Ignore related alerts
- Work alone on critical issues
- Skip documentation
- Blame individuals

### 5. Dashboard Design

**DO:**
- Group related metrics
- Use appropriate visualization types
- Set meaningful Y-axis ranges
- Add annotations for deployments
- Create dashboards for different audiences
- Keep dashboards up to date

**DON'T:**
- Overcrowd dashboards
- Use default colors for everything
- Skip labels and legends
- Create dashboards without purpose
- Ignore dashboard performance

---

## Quick Reference

### Essential URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Grafana | http://localhost:3001 | Dashboards & visualization |
| Prometheus | http://localhost:9090 | Metrics & queries |
| AlertManager | http://localhost:9093 | Alert management |
| Auth Service Metrics | http://localhost:3001/metrics | Service metrics |
| Auth Service Health | http://localhost:3001/health | Service health |

### Essential Commands

```bash
# Run validation
./scripts/validate-system.sh local

# Run smoke test
npm run test:smoke --prefix tests/load

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Get metrics from service
curl http://localhost:3001/metrics

# Check alert rules
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.type=="alerting")'

# Force Prometheus to reload config
curl -X POST http://localhost:9090/-/reload
```

### Essential PromQL Queries

```promql
# System availability
avg(up{job=~".*-service"})

# Overall error rate
sum(rate(http_requests_total{status_code=~"5.."}[5m])) /
sum(rate(http_requests_total[5m]))

# P95 latency across all services
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
)

# Active circuit breakers
count(circuit_breaker_state == 1)

# Degraded mode percentage
(sum(rate(gateway_rate_limit_total{status="degraded"}[5m])) /
 sum(rate(gateway_rate_limit_total[5m]))) * 100
```

---

## Appendix

### Runbook Links

#### Degraded Mode Runbook

1. **Verify Redis is down**
   ```bash
   redis-cli ping
   kubectl get pods -n applyforus | grep redis
   ```

2. **Check why Redis failed**
   ```bash
   kubectl logs -n applyforus redis-0 --tail=100
   ```

3. **Restart Redis if needed**
   ```bash
   kubectl delete pod redis-0 -n applyforus
   # Or
   docker-compose restart redis
   ```

4. **Monitor recovery**
   - Watch `redis_connection_state` return to 1
   - Watch `gateway_rate_limit_degraded_total` stop increasing

5. **Post-incident**
   - Review what caused Redis failure
   - Update alerts if needed
   - Document in incident log

#### Circuit Breaker Runbook

[Similar detailed runbooks would be created for each alert type]

---

**Last Updated:** 2025-12-15
**Version:** 2.0.0
**Maintained By:** Platform Engineering Team
