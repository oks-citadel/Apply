# Load Testing Quick Start Guide

## Prerequisites

### 1. Install k6

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Verify installation
k6 version
```

### 2. Start Services

```bash
# From project root
cd C:/Users/kogun/OneDrive/Documents/Job-Apply-Platform

# Start all services via Docker Compose
docker-compose up -d

# Wait for services to be healthy (30-60 seconds)
docker-compose ps

# Verify services are running
curl http://localhost:3001/health  # Auth service
curl http://localhost:8002/health  # User service
curl http://localhost:8004/health  # Job service
```

### 3. Set Environment Variables (Optional)

```bash
# Windows
set AUTH_SERVICE_URL=http://localhost:3001
set USER_SERVICE_URL=http://localhost:8002
set JOB_SERVICE_URL=http://localhost:8004

# Linux/macOS
export AUTH_SERVICE_URL=http://localhost:3001
export USER_SERVICE_URL=http://localhost:8002
export JOB_SERVICE_URL=http://localhost:8004
```

---

## Running Load Tests

### 1. Smoke Test (1 minute) - ALWAYS RUN FIRST

```bash
cd tests/load

# Install dependencies
npm install

# Run smoke test
npm run test:smoke

# Or run directly with k6
k6 run scenarios/smoke-test.js
```

**What it validates**:
- All services are operational
- Health checks pass
- Basic login works
- Metrics endpoints accessible

**Expected output**:
```
✓ health checks pass
✓ metrics accessible
✓ login successful
✓ error rate < 1%

checks.........................: 100.00% ✓ 20       ✗ 0
http_req_duration..............: avg=120ms   p(95)=250ms
```

---

### 2. Load Test (15 minutes) - Standard Performance Validation

```bash
npm run test:load

# Or run directly
k6 run scenarios/load-test.js
```

**What it validates**:
- Performance under expected production load
- P95 latency < 2s
- Error rate < 5%
- All thresholds pass

**Load profile**:
- Ramp: 0→10→20 VUs
- Duration: 15 minutes
- Scenarios: Login, job search, profile views, applications

**Expected output**:
```
scenarios: (100.00%) 1 scenario, 20 max VUs, 15m30s max duration
iterations.....................: 1500
http_req_duration..............: avg=450ms   p(95)=1.2s   p(99)=2.8s
http_req_failed................: 2.1%
✓ All thresholds passed
```

---

### 3. Spike Test (5 minutes) - Traffic Surge Validation

```bash
npm run test:spike

# Or run directly
k6 run scenarios/spike-test.js
```

**What it validates**:
- System behavior during sudden traffic spikes
- Rate limiting activation
- Circuit breaker resilience
- System recovery after spike

**Load profile**:
- Baseline: 5 VUs
- Spike: 5→100 VUs in 10 seconds
- Sustain: 100 VUs for 1 minute
- Recovery: 100→5 VUs

**Expected behavior**:
- Rate limiting activates (429 responses)
- Circuit breakers may open briefly
- System remains stable
- Gateway degraded mode may activate temporarily

**Expected output**:
```
✓ Rate limiting activated
✓ System recovered after spike
✓ Error rate < 15% during spike
spike_phase_errors.............: 8.5%
http_req_duration (spike)......: p(95)=6.2s   p(99)=9.1s
```

---

### 4. Circuit Breaker Test (7 minutes) - Resilience Validation

```bash
npm run test:circuit-breaker

# Or run directly
k6 run scenarios/circuit-breaker-test.js
```

**What it validates**:
- Circuit breaker opens under high error rates
- Fallback execution
- System recovery
- State transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)

**Test phases**:
1. Normal (2 min): Establish baseline, circuit CLOSED
2. Error injection (3 min): Induce errors, circuit should OPEN
3. Recovery (2 min): Allow recovery, circuit should transition to HALF_OPEN then CLOSED

**Expected output**:
```
✓ Circuit breaker opened during error phase
✓ Fallback executed correctly
✓ Circuit recovered to CLOSED state
circuit_breaker_opened.........: Yes
fallback_executions............: 145
```

---

### 5. Soak Test (2 hours) - Long-term Stability

```bash
npm run test:soak

# Or run directly
k6 run scenarios/soak-test.js
```

**What it validates**:
- Memory leaks
- Connection pool leaks
- Long-term performance degradation
- Resource accumulation

**Load profile**:
- Constant 20 VUs for 2 hours

**Run overnight or during low-traffic periods**

**Expected output**:
```
✓ No memory leaks detected
✓ Stable performance over time
✓ No resource exhaustion
memory_usage (start)...........: 512MB
memory_usage (end).............: 518MB (stable)
```

---

## Monitoring During Tests

### 1. Prometheus Metrics

Access Prometheus at: http://localhost:9090

**Key queries during load tests**:

```promql
# Request rate
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[1m]) / rate(http_requests_total[1m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Gateway degraded mode
gateway_rate_limit_degraded_total

# Circuit breaker state
circuit_breaker_state

# Redis latency
histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[1m]))

# Database connection pool usage
db_connection_pool_used / db_connection_pool_size
```

### 2. Grafana Dashboards

Access Grafana at: http://localhost:3000

**Recommended dashboards to monitor**:
1. Service Overview Dashboard
   - Service availability
   - Request rate
   - Error rate
   - Response times

2. Database Metrics Dashboard
   - Connection pool usage
   - Query latency
   - Query error rate

3. Business Metrics Dashboard
   - Job applications
   - Resume generations
   - AI service usage

### 3. Real-time k6 Output

k6 provides real-time output during test execution:

```
     ✓ status is 200
     ✓ response time < 2s

     checks.........................: 98.5% ✓ 1970   ✗ 30
     data_received..................: 15 MB  250 kB/s
     data_sent......................: 1.2 MB 20 kB/s
     http_req_blocked...............: avg=1.2ms    p(95)=5ms
     http_req_connecting............: avg=800µs    p(95)=3ms
     http_req_duration..............: avg=450ms    p(95)=1.2s
     http_req_failed................: 1.5%   ✓ 30     ✗ 1970
     http_req_receiving.............: avg=150µs    p(95)=500µs
     http_req_sending...............: avg=80µs     p(95)=200µs
     http_req_tls_handshaking.......: avg=0s       p(95)=0s
     http_req_waiting...............: avg=449ms    p(95)=1.19s
     http_reqs......................: 2000   33.3/s
     iteration_duration.............: avg=2.1s     p(95)=4s
     iterations.....................: 500    8.3/s
     vus............................: 20     min=0    max=20
```

---

## Verifying Gateway Reliability Fixes

The load tests specifically validate the gateway reliability improvements:

### 1. Verify Fail-Open Behavior

```bash
# 1. Start load test
npm run test:load &

# 2. Stop Redis (simulate failure)
docker stop applyforus-redis

# 3. Monitor degraded mode metric
curl http://localhost:9090/api/v1/query?query=gateway_rate_limit_degraded_total

# 4. Verify requests still succeed (fail-open)
curl http://localhost:8004/api/v1/jobs

# 5. Check alert fires after 5 minutes
curl http://localhost:9090/api/v1/alerts | grep GatewayRateLimitDegradedMode

# 6. Restart Redis
docker start applyforus-redis

# 7. Verify degraded mode clears
```

**Expected behavior**:
- ✅ Requests continue to succeed when Redis is down
- ✅ `gateway_rate_limit_degraded_total` increments
- ✅ `redis_connection_state` = 0
- ✅ Alert fires after 5 minutes
- ✅ System recovers when Redis restarts

### 2. Verify Circuit Breaker Protection

```bash
# Run circuit breaker test
npm run test:circuit-breaker

# Monitor circuit breaker metrics
watch -n 1 'curl -s http://localhost:9090/api/v1/query?query=circuit_breaker_state | jq'

# Expected state transitions:
# CLOSED (0) → OPEN (1) → HALF_OPEN (2) → CLOSED (0)
```

**Expected behavior**:
- ✅ Circuit opens when error threshold exceeded
- ✅ Fallbacks execute when circuit is open
- ✅ Circuit attempts recovery via HALF_OPEN
- ✅ Circuit closes when errors subside
- ✅ No cascading failures

### 3. Verify Latency Improvements

```bash
# Run spike test
npm run test:spike

# Monitor P95 latency during spike
curl http://localhost:9090/api/v1/query?query=histogram_quantile\(0.95,rate\(http_request_duration_by_route_seconds_bucket[1m]\)\)

# Expected P95 latency:
# Normal: < 500ms
# During spike: < 10s (acceptable degradation)
# Recovery: Returns to < 500ms within 1 minute
```

---

## Troubleshooting

### Load Test Failures

#### 1. Connection Refused Errors

```bash
# Problem: Cannot connect to services
# Error: "http: connection refused"

# Solution:
# 1. Verify services are running
docker-compose ps

# 2. Check service health
curl http://localhost:3001/health
curl http://localhost:8002/health
curl http://localhost:8004/health

# 3. Check service logs
docker-compose logs auth-service
docker-compose logs user-service
docker-compose logs job-service
```

#### 2. High Error Rates

```bash
# Problem: Error rate > 5%
# Errors: 5xx responses, timeouts

# Diagnosis:
# 1. Check service logs for errors
docker-compose logs --tail=100 [service-name]

# 2. Check resource usage
docker stats

# 3. Check database connections
# Look for connection pool exhaustion

# Solutions:
# - Increase service resources
# - Scale up service replicas
# - Reduce VU count in test
# - Fix application errors
```

#### 3. Slow Response Times

```bash
# Problem: P95 latency > 2s
# Symptom: Tests timeout or fail thresholds

# Diagnosis:
# 1. Check database query performance
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))

# 2. Check Redis latency
histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[5m]))

# 3. Check CPU/memory usage
docker stats

# Solutions:
# - Optimize database queries
# - Add database indexes
# - Increase cache hit rate
# - Scale services horizontally
```

#### 4. Authentication Failures

```bash
# Problem: Login requests fail
# Error: "401 Unauthorized"

# Solution:
# 1. Verify test user exists
# Check config.js for test user credentials

# 2. Create test user manually
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@applyforus.com",
    "password": "LoadTest123!@#",
    "firstName": "Load",
    "lastName": "Test"
  }'

# 3. Update config.js with correct credentials
```

---

## Best Practices

### 1. Always Run Smoke Test First

```bash
# Run smoke test before any other test
npm run test:smoke

# Only proceed if smoke test passes
```

### 2. Monitor During Tests

- Keep Prometheus open: http://localhost:9090
- Keep Grafana open: http://localhost:3000
- Watch k6 real-time output
- Monitor Docker resource usage: `docker stats`

### 3. Run Tests in Order

1. Smoke test (quick validation)
2. Load test (baseline performance)
3. Spike test (surge handling)
4. Circuit breaker test (resilience)
5. Soak test (long-term stability)

### 4. Document Results

```bash
# Load test results are saved as JSON
ls -l tests/load/*.json

# Example files:
# - smoke-test-results.json
# - load-test-results.json
# - spike-test-results.json
# - circuit-breaker-test-results.json
# - soak-test-results.json

# Review and archive results
cat load-test-results.json | jq '.metrics'
```

### 5. Run Soak Tests Overnight

```bash
# Start soak test in background
nohup npm run test:soak > soak-test.log 2>&1 &

# Check progress
tail -f soak-test.log

# Stop if needed
pkill -f "k6 run"
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Start services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 30

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run smoke test
        run: |
          cd tests/load
          npm install
          npm run test:smoke

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: smoke-test-results
          path: tests/load/smoke-test-results.json
```

---

## Quick Reference

| Test | Duration | VUs | Purpose | Run Command |
|------|----------|-----|---------|-------------|
| Smoke | 1 min | 1 | Quick validation | `npm run test:smoke` |
| Load | 15 min | 10-20 | Performance baseline | `npm run test:load` |
| Spike | 5 min | 5-100 | Traffic surge | `npm run test:spike` |
| Circuit Breaker | 7 min | 5-10 | Resilience | `npm run test:circuit-breaker` |
| Soak | 2 hours | 20 | Long-term stability | `npm run test:soak` |

---

## Support

For questions or issues:
1. Check the main README: `tests/load/README.md`
2. Review troubleshooting section above
3. Check service logs: `docker-compose logs [service-name]`
4. Consult observability validation plan: `ops/docs/OBSERVABILITY_VALIDATION_PLAN.md`

---

**Last Updated**: 2025-12-15
**Maintained by**: Platform Engineering Team
