# Load Testing Guide for ApplyForUs AI Platform

## Overview

This directory contains comprehensive load tests for the ApplyForUs AI Platform using [k6](https://k6.io/), a modern load testing tool.

## Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6

   # Windows (using Chocolatey)
   choco install k6

   # Linux
   sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Ensure all services are running**:
   ```bash
   # From project root
   docker-compose up -d
   # Or start services individually
   ```

3. **Set environment variables** (optional):
   ```bash
   export AUTH_SERVICE_URL=http://localhost:3001
   export USER_SERVICE_URL=http://localhost:8002
   export JOB_SERVICE_URL=http://localhost:8004
   # ... other services
   ```

## Test Scenarios

### 1. Smoke Test (1 minute)
**Purpose**: Quick validation that all services are operational.
**Load**: 1 VU for 1 minute
**Use When**: After deployments, before other tests

```bash
npm run test:smoke
# or
k6 run --vus 1 --duration 1m scenarios/smoke-test.js
```

**Expected Results**:
- All health checks pass
- Metrics endpoints accessible
- Basic login works
- Error rate < 1%

### 2. Load Test (15 minutes)
**Purpose**: Validate performance under expected production load.
**Load**: Ramps from 0 to 20 VUs
**Use When**: Regular performance validation

```bash
npm run test:load
# or
k6 run scenarios/load-test.js
```

**Expected Results**:
- P95 latency < 2s
- P99 latency < 5s
- Error rate < 5%
- All thresholds pass

**Scenarios Tested**:
- User login (30%)
- Job search (50%)
- Profile viewing (20%)
- Job applications (10%)

### 3. Stress Test (25 minutes)
**Purpose**: Find breaking points and capacity limits.
**Load**: Ramps up to 100 VUs
**Use When**: Capacity planning, before major events

```bash
npm run test:stress
# or
k6 run scenarios/stress-test.js
```

**Expected Results**:
- Identify maximum sustainable load
- Rate limiting activates appropriately
- Graceful degradation under pressure
- No cascading failures

### 4. Spike Test (5 minutes)
**Purpose**: Validate behavior during sudden traffic surges.
**Load**: Sudden jump from 5 to 100 VUs
**Use When**: Before Black Friday, Product Hunt launches

```bash
npm run test:spike
# or
k6 run scenarios/spike-test.js
```

**Expected Results**:
- System recovers after spike
- Autoscaling triggers
- Circuit breakers work correctly
- Error rate < 15% during spike

### 5. Soak Test (2 hours)
**Purpose**: Identify memory leaks and long-term stability issues.
**Load**: Constant 20 VUs for 2 hours
**Use When**: Before major releases, monthly validation

```bash
npm run test:soak
# or
k6 run scenarios/soak-test.js
```

**Expected Results**:
- No performance degradation over time
- No memory leaks
- Stable error rate
- All services remain healthy

### 6. Circuit Breaker Test (7 minutes)
**Purpose**: Validate resilience patterns and failure handling.
**Load**: Gradually introduce errors
**Use When**: Testing circuit breaker configuration

```bash
npm run test:circuit-breaker
# or
k6 run scenarios/circuit-breaker-test.js
```

**Expected Results**:
- Circuit breakers open under high error rates
- Fallbacks execute correctly
- System recovers when errors subside
- No cascading failures

## Test Results

Results are saved in JSON format:
- `smoke-test-results.json`
- `load-test-results.json`
- `stress-test-results.json`
- `spike-test-results.json`
- `soak-test-results.json`
- `circuit-breaker-test-results.json`

## Monitoring During Tests

### 1. Prometheus Metrics
Monitor real-time metrics at: http://localhost:9090

Key queries during tests:
```promql
# Request rate
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status_code=~"5.."}[1m]) / rate(http_requests_total[1m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Active connections
http_requests_in_progress

# Database pool
db_connection_pool_used / db_connection_pool_size
```

### 2. Grafana Dashboards
Access dashboards at: http://localhost:3001

- Service Overview Dashboard
- Database Metrics Dashboard
- Business Metrics Dashboard

### 3. k6 Cloud (Optional)
Stream results to k6 Cloud for advanced analysis:
```bash
k6 run --out cloud scenarios/load-test.js
```

## Performance Thresholds

### HTTP Performance
- **P95 Response Time**: < 2 seconds (normal load)
- **P99 Response Time**: < 5 seconds (normal load)
- **Error Rate**: < 5% (normal load)
- **Request Rate**: > 10 req/s

### Database Performance
- **Connection Pool Usage**: < 90%
- **P95 Query Time**: < 1 second
- **DB Error Rate**: < 1%

### Business Metrics
- **Job Applications**: Tracked and validated
- **Resume Generations**: Success rate > 95%
- **AI Service**: P95 < 30 seconds

## Troubleshooting

### High Error Rates
1. Check service logs: `docker-compose logs [service-name]`
2. Check Prometheus alerts: http://localhost:9090/alerts
3. Verify database connections
4. Check rate limiting configuration

### Slow Response Times
1. Check database query performance
2. Verify Redis cache hit rate
3. Check for N+1 queries
4. Monitor CPU and memory usage

### Test Failures
1. Ensure all services are running: `docker-compose ps`
2. Verify test user exists in database
3. Check service health endpoints
4. Review test configuration in `config.js`

## Best Practices

1. **Always run smoke test first** before longer tests
2. **Monitor during tests** using Grafana dashboards
3. **Run tests in isolated environment** (not production)
4. **Document baseline performance** for comparison
5. **Run soak tests overnight** when possible
6. **Review all test results** before deployments

## CI/CD Integration

### GitHub Actions
```yaml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start services
        run: docker-compose up -d
      - name: Install k6
        run: |
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run smoke test
        run: k6 run tests/load/scenarios/smoke-test.js
      - name: Run load test
        run: k6 run tests/load/scenarios/load-test.js
```

## Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Test Examples](https://k6.io/docs/examples/)
- [Grafana k6 Dashboard](https://grafana.com/grafana/dashboards/2587)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/test-types/)
