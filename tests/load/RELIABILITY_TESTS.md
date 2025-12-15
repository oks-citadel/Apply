# Gateway Reliability & Observability Load Tests

This directory contains load tests specifically designed to validate gateway reliability patterns, including rate limiting, circuit breakers, and Redis failure scenarios.

## New Reliability Tests

### 1. Rate Limit Test (`rate-limit-test.js`)

**Purpose:** Validate rate limiting behavior and degraded mode functionality.

**Duration:** ~7 minutes

**Phases:**
- **Warmup** (30s): 2 VUs - Establish baseline
- **Heavy Traffic** (6m): Ramp 5→30 VUs - Trigger rate limits
- **Burst** (50s): Spike to 50 VUs - Test extreme load

**Run:**
```bash
npm run test:rate-limit
# or
k6 run scenarios/rate-limit-test.js
```

**Success Criteria:**
- ✓ Rate limit headers present in 90%+ responses
- ✓ Some requests rejected with 429 during heavy/burst phases
- ✓ Degraded mode < 1% (unless Redis intentionally unavailable)
- ✓ P95 response time < 1s

**Metrics Tracked:**
- `rate_limit_allowed` - Requests within limit
- `rate_limit_rejections` - Requests rejected (429)
- `rate_limit_degraded` - Degraded mode events
- `rate_limit_header_present` - Header presence rate
- `response_time` - Response time distribution

**What to Monitor in Prometheus:**
```promql
# Rate limit status breakdown
sum(rate(gateway_rate_limit_total[1m])) by (status)

# Degraded mode percentage
(sum(rate(gateway_rate_limit_total{status="degraded"}[1m])) /
 sum(rate(gateway_rate_limit_total[1m]))) * 100

# Rejection rate
(sum(rate(gateway_rate_limit_total{status="rejected"}[1m])) /
 sum(rate(gateway_rate_limit_total[1m]))) * 100
```

---

### 2. Redis Failure Test (`redis-failure-test.js`)

**Purpose:** Validate system continues operating when Redis is unavailable (fail-open mode).

**Duration:** 7 minutes

**Phases:**
- **Normal** (2m): 5 VUs with Redis healthy
- **Degraded** (3m): 5 VUs with Redis down/unavailable
- **Recovery** (2m): 5 VUs after Redis restored

**Run:**
```bash
npm run test:redis-failure
# or
k6 run scenarios/redis-failure-test.js
```

**To Simulate Redis Failure (for realistic testing):**
```bash
# Before running the test, stop Redis
docker-compose stop redis
# OR
kubectl scale deployment redis --replicas=0 -n applyforus

# Run the test
k6 run scenarios/redis-failure-test.js

# After the test, restore Redis
docker-compose start redis
# OR
kubectl scale deployment redis --replicas=1 -n applyforus
```

**Success Criteria:**
- ✓ System availability > 95% during Redis failure
- ✓ NO 500 errors (fail-open active)
- ✓ Degraded mode properly activated
- ✓ Requests succeed with fallback mechanisms
- ✓ Normal operation restored after recovery

**Metrics Tracked:**
- `system_availability` - Overall system availability rate
- `degraded_mode_active` - Degraded mode activation count
- `redis_errors` - Redis error count
- `request_success` - Functional success rate
- `fallback_executions` - Fallback mechanism activations

**What to Monitor in Prometheus:**
```promql
# Redis connection state
redis_connection_state

# Degraded mode activations
rate(gateway_rate_limit_degraded_total[1m])

# Circuit breaker state for Redis
circuit_breaker_state{circuit_name="redis"}

# System continues operating
avg(up{job=~".*-service"})
```

---

### 3. Circuit Breaker Test (`circuit-breaker-test.js`)

**Purpose:** Validate circuit breaker patterns under high error rates.

**Duration:** 7 minutes

**Phases:**
- **Normal** (2m): 5 VUs - Normal operation
- **Error Injection** (3m): 10 VUs - Error-inducing requests
- **Recovery** (2m): 5 VUs - Normal traffic

**Run:**
```bash
npm run test:circuit-breaker
# or
k6 run scenarios/circuit-breaker-test.js
```

**Success Criteria:**
- ✓ Circuit breakers open when error threshold exceeded
- ✓ Error rate < 50% (circuit breaker should limit damage)
- ✓ P95 latency < 5s (more lenient during testing)
- ✓ Fallback mechanisms execute

**Metrics Tracked:**
- `errors` - Error rate
- `circuit_breaker_open` - Circuit breaker state
- `fallback_executed` - Fallback execution count
- `request_duration` - Request duration

---

## Running All Reliability Tests

Run all three reliability tests in sequence:

```bash
npm run test:reliability
```

This will execute:
1. Rate limit test
2. Redis failure test
3. Circuit breaker test

**Total Duration:** ~21 minutes

---

## Interpreting Results

### Rate Limit Test Results

Example output:
```
📊 Burst batch complete: 8 allowed, 42 rejected

🔍 Rate Limit Analysis:
  ✅ Allowed Requests: 1847
  🛑 Rejected Requests: 653
  📈 Rejection Rate: 26.12%
  ✅ No degraded mode events (Redis healthy)
  📋 Rate Limit Headers: 98.50% of responses
  ⏱️  Avg Response Time: 245.34ms
  ⏱️  P95 Response Time: 567.89ms
```

**Good Results:**
- Rejection rate between 20-40% during heavy/burst phases ✓
- No degraded mode events (unless testing Redis failure) ✓
- Rate limit headers in 90%+ responses ✓
- P95 < 1s ✓

**Bad Results:**
- 0% rejection rate (rate limiting not working) ✗
- High degraded mode percentage (Redis issues) ⚠️
- Missing rate limit headers (implementation issue) ✗
- P95 > 2s (performance problem) ✗

### Redis Failure Test Results

Example output:
```
🔍 Redis Failure Resilience Analysis:
  📊 System Availability: 97.45%
  ✅ PASS: System maintained >95% availability during Redis failure
  📊 Request Success Rate: 96.30%
  🟡 Degraded Mode Activations: 1247
  ✅ System correctly entered degraded mode when Redis unavailable
  🔴 Redis Errors Detected: 89
  🔄 Fallback Executions: 1247
  ✅ Fallback mechanisms working correctly

🎯 Overall Resilience Score:
  ✅ EXCELLENT: System demonstrated strong resilience (97.5%)
```

**Good Results:**
- System availability > 95% ✓
- Degraded mode activated during Redis failure ✓
- Fallbacks executed successfully ✓
- No 5xx errors ✓

**Bad Results:**
- System availability < 90% ✗
- 500 errors during Redis failure (no fail-open) ✗
- No degraded mode activation (detection issue) ✗

### Circuit Breaker Test Results

Example output:
```
🔍 Circuit Breaker Analysis:
  Error Rate: 35.67%
  Circuit Breaker Opened: Yes
  Fallback Executions: 543
```

**Good Results:**
- Circuit breaker opens during error phase ✓
- Error rate < 50% (breaker limiting damage) ✓
- Circuit breaker closes during recovery ✓

**Bad Results:**
- Circuit breaker doesn't open (misconfigured) ✗
- Error rate > 75% (breaker not helping) ✗
- Circuit breaker stays open (recovery issue) ✗

---

## Prometheus Dashboards

Create custom dashboards to visualize test results:

### Rate Limiting Dashboard

```promql
# Rate limit status over time
sum(rate(gateway_rate_limit_total[1m])) by (status)

# Degraded mode percentage
(sum(rate(gateway_rate_limit_total{status="degraded"}[1m])) /
 sum(rate(gateway_rate_limit_total[1m]))) * 100
```

### Redis Resilience Dashboard

```promql
# Redis connection state
redis_connection_state

# Degraded operations rate
rate(gateway_rate_limit_degraded_total[1m])

# Redis error rate
(sum(rate(redis_errors_total[1m])) /
 sum(rate(redis_operations_total[1m]))) * 100
```

### Circuit Breaker Dashboard

```promql
# Circuit breaker states
sum(circuit_breaker_state) by (circuit_name)

# Circuit breaker trips
rate(circuit_breaker_trips_total[1m])

# Fallback execution rate
rate(circuit_breaker_fallbacks_total[1m])
```

---

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
# .github/workflows/reliability-tests.yml
name: Reliability Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  reliability-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install K6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run Rate Limit Test
        run: k6 run tests/load/scenarios/rate-limit-test.js
        env:
          AUTH_SERVICE_URL: ${{ secrets.STAGING_AUTH_URL }}
          JOB_SERVICE_URL: ${{ secrets.STAGING_JOB_URL }}

      - name: Run Redis Failure Test
        run: k6 run tests/load/scenarios/redis-failure-test.js

      - name: Run Circuit Breaker Test
        run: k6 run tests/load/scenarios/circuit-breaker-test.js

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: |
            rate-limit-test-results.json
            redis-failure-test-results.json
            circuit-breaker-test-results.json
```

---

## Troubleshooting

### "Login failed" errors

The test uses `config.testUsers.regular` credentials. Ensure test user exists:

```bash
# Create test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@applyforus.com",
    "password": "LoadTest123!@#",
    "firstName": "Load",
    "lastName": "Test"
  }'
```

Or update `tests/load/config.js` with valid credentials.

### "Connection refused" errors

Ensure services are running:

```bash
docker-compose ps
# or
kubectl get pods -n applyforus
```

Update service URLs in environment variables:

```bash
export AUTH_SERVICE_URL="http://localhost:3001"
export JOB_SERVICE_URL="http://localhost:8004"
# etc.
```

### No degraded mode detected in Redis failure test

This is expected if:
1. Redis remains healthy (test is monitoring, not forcing failure)
2. To actually test Redis failure, manually stop Redis before the degraded phase

To force Redis failure testing:
```bash
# Stop Redis at 2-minute mark
sleep 120 && docker-compose stop redis &

# Run test
k6 run scenarios/redis-failure-test.js

# Restore Redis
docker-compose start redis
```

---

## Best Practices

1. **Run tests in non-production environments first**
2. **Monitor Prometheus/Grafana during tests**
3. **Establish baseline before making changes**
4. **Document test results for comparison**
5. **Automate tests in CI/CD pipeline**
6. **Review and update tests regularly**

---

**Last Updated:** 2025-12-15
**Test Coverage:**
- ✓ Rate limiting and degraded mode
- ✓ Redis failure resilience
- ✓ Circuit breaker patterns
- ✓ Gateway reliability metrics
- ✓ System health validation
