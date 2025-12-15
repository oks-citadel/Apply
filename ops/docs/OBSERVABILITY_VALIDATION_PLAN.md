# Observability & Load Validation Plan

## Overview

This document provides a comprehensive plan for validating the observability infrastructure, monitoring dashboards, metrics collection, alerting rules, and load testing procedures for the ApplyForUs AI Platform.

## Table of Contents

1. [Metrics Validation](#metrics-validation)
2. [Alert Configuration Validation](#alert-configuration-validation)
3. [Dashboard Verification](#dashboard-verification)
4. [Load Testing Procedures](#load-testing-procedures)
5. [Expected Results](#expected-results)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## Metrics Validation

### 1. Gateway Metrics

#### 1.1 Gateway Rate Limit Degraded Mode Metric

**Metric**: `gateway_rate_limit_degraded_total`

**Purpose**: Track when rate limiting falls back to fail-open mode due to Redis unavailability

**Labels**:
- `service`: Service name
- `route`: API route
- `reason`: Degradation reason (e.g., `redis_unavailable`, `timeout`)

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep gateway_rate_limit_degraded_total

# 2. Query current degraded operations in Prometheus
gateway_rate_limit_degraded_total

# 3. Calculate degradation rate (should be < 1%)
(
  sum(rate(gateway_rate_limit_degraded_total[5m])) by (service)
  /
  sum(rate(gateway_rate_limit_total[5m])) by (service)
) * 100

# 4. Verify alert fires when degradation > 1% for 5 minutes
```

**Expected Baseline**: 0 degraded operations under normal conditions

**Alert Threshold**: > 1% degradation rate for 5 minutes

---

#### 1.2 Redis Dependency Latency Histogram

**Metric**: `redis_operation_duration_seconds`

**Purpose**: Track Redis operation latency to identify performance degradation

**Labels**:
- `operation`: Redis operation type (`get`, `set`, `incr`, `del`, etc.)
- `service`: Service name

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep redis_operation_duration_seconds

# 2. Query P95 latency
histogram_quantile(0.95,
  sum(rate(redis_operation_duration_seconds_bucket[5m])) by (le, service)
)

# 3. Query P99 latency
histogram_quantile(0.99,
  sum(rate(redis_operation_duration_seconds_bucket[5m])) by (le, service)
)

# 4. Verify alert fires when P95 > 100ms for 5 minutes
```

**Expected Baseline**:
- P50: < 5ms
- P95: < 20ms
- P99: < 50ms

**Alert Threshold**: P95 > 100ms for 5 minutes

---

#### 1.3 Redis Connection State

**Metric**: `redis_connection_state`

**Purpose**: Track Redis connection health (1 = connected, 0 = disconnected)

**Labels**:
- `service`: Service name
- `host`: Redis hostname

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep redis_connection_state

# 2. Verify connection state in Prometheus
redis_connection_state

# 3. Test Redis disconnect scenario
# - Temporarily stop Redis
# - Verify metric changes to 0
# - Verify alert fires after 1 minute

# 4. Test recovery
# - Restart Redis
# - Verify metric returns to 1
# - Verify alert resolves
```

**Expected Baseline**: 1 (connected)

**Alert Threshold**: 0 (disconnected) for 1 minute

---

### 2. Circuit Breaker Metrics

#### 2.1 Circuit Breaker State

**Metric**: `circuit_breaker_state`

**Purpose**: Track circuit breaker state (0 = CLOSED, 1 = OPEN, 2 = HALF_OPEN)

**Labels**:
- `service`: Service name
- `circuit_name`: Circuit identifier

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep circuit_breaker_state

# 2. Query current state
circuit_breaker_state

# 3. Identify open circuits
circuit_breaker_state{state="OPEN"}

# 4. Run circuit breaker load test
cd tests/load
npm run test:circuit-breaker

# 5. Verify state transitions during test
circuit_breaker_state_changes_total
```

**Expected Baseline**: 0 (CLOSED) for all circuits

**Alert Threshold**: 1 (OPEN) for 1 minute

---

#### 2.2 Circuit Breaker State Changes

**Metric**: `circuit_breaker_state_changes_total`

**Purpose**: Track frequency of circuit breaker state transitions

**Labels**:
- `service`: Service name
- `circuit_name`: Circuit identifier
- `from_state`: Previous state
- `to_state`: New state

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep circuit_breaker_state_changes_total

# 2. Query state change rate
rate(circuit_breaker_state_changes_total[5m])

# 3. Identify flapping circuits (frequent state changes)
rate(circuit_breaker_state_changes_total[5m]) > 0.5

# 4. Verify alert fires for flapping circuits
```

**Expected Baseline**: < 0.1 changes/sec

**Alert Threshold**: > 0.5 changes/sec for 10 minutes

---

### 3. HTTP Request Metrics

#### 3.1 Request Duration by Route

**Metric**: `http_request_duration_by_route_seconds`

**Purpose**: Track request latency per route for granular performance monitoring

**Labels**:
- `method`: HTTP method
- `route`: API route
- `status_code`: HTTP status code
- `service`: Service name

**Validation Steps**:

```bash
# 1. Check metric is exposed
curl http://localhost:8001/metrics | grep http_request_duration_by_route_seconds

# 2. Query P95 latency by route
histogram_quantile(0.95,
  sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route, service)
)

# 3. Identify slow routes
histogram_quantile(0.95,
  sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route, service)
) > 2

# 4. Detect latency regressions
(
  histogram_quantile(0.95,
    sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le, route)
  )
  /
  histogram_quantile(0.95,
    sum(rate(http_request_duration_by_route_seconds_bucket[1h])) by (le, route)
  )
) > 1.5
```

**Expected Baseline**:
- P95: < 500ms for most routes
- P99: < 2s for most routes

**Alert Threshold**: P95 > 2s and 50% increase from baseline

---

### 4. Database Connection Pool Metrics

**Metric**: `db_connection_pool_used` / `db_connection_pool_size`

**Purpose**: Monitor PostgreSQL connection pool usage

**Validation Steps**:

```bash
# 1. Check metrics are exposed
curl http://localhost:8001/metrics | grep db_connection_pool

# 2. Query pool usage percentage
db_connection_pool_used / db_connection_pool_size

# 3. Identify services nearing pool exhaustion
(db_connection_pool_used / db_connection_pool_size) > 0.9

# 4. Verify alert fires when usage > 90% for 2 minutes
```

**Expected Baseline**: < 70% usage

**Alert Threshold**: > 90% usage for 2 minutes

---

## Alert Configuration Validation

### 1. Gateway Reliability Alerts

| Alert Name | Severity | Threshold | Duration | Status |
|------------|----------|-----------|----------|--------|
| GatewayRateLimitDegradedMode | Critical | > 1% degraded | 5 min | ✅ Configured |
| HighRedisLatency | Warning | P95 > 100ms | 5 min | ✅ Configured |
| RedisConnectionDown | Critical | State = 0 | 1 min | ✅ Configured |
| HighRedisErrorRate | Warning | > 5% errors | 5 min | ✅ Configured |
| GatewayP95LatencyRegression | Warning | +50% from baseline | 10 min | ✅ Configured |
| High5xxSpikeGateway | Critical | > 10% 5xx rate | 2 min | ✅ Configured |

**Validation Steps**:

```bash
# 1. Verify alert rules are loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | select(.name=="gateway_reliability")'

# 2. Check alert status
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.category=="gateway")'

# 3. Simulate degraded mode scenario
# - Stop Redis container
# - Wait 5 minutes
# - Verify GatewayRateLimitDegradedMode alert fires
# - Restart Redis
# - Verify alert resolves

# 4. Test latency regression alert
# - Run spike test to increase latency
# - Verify GatewayP95LatencyRegression alert fires
```

---

### 2. Circuit Breaker Alerts

| Alert Name | Severity | Threshold | Duration | Status |
|------------|----------|-----------|----------|--------|
| CircuitBreakerOpen | Critical | State = OPEN | 1 min | ✅ Configured |
| HighCircuitBreakerFailureRate | Warning | > 0.1 trips/sec | 5 min | ✅ Configured |
| FrequentCircuitBreakerStateChanges | Warning | > 0.5 changes/sec | 10 min | ✅ Configured |

**Validation Steps**:

```bash
# 1. Verify circuit breaker alert rules
curl http://localhost:9090/api/v1/rules | jq '.data.groups[] | select(.name=="circuit_breakers")'

# 2. Run circuit breaker test
cd tests/load
npm run test:circuit-breaker

# 3. Monitor alert firing
curl http://localhost:9090/api/v1/alerts | jq '.data.alerts[] | select(.labels.category=="resilience")'

# 4. Verify alerts resolve when circuit closes
```

---

### 3. Service Health Alerts

| Alert Name | Severity | Threshold | Duration | Status |
|------------|----------|-----------|----------|--------|
| ServiceDown | Critical | up = 0 | 1 min | ✅ Configured |
| HighErrorRate | Critical | > 5% errors | 5 min | ✅ Configured |
| SlowResponseTime | Warning | P95 > 2s | 5 min | ✅ Configured |
| VerySlowResponseTime | Critical | P95 > 5s | 2 min | ✅ Configured |

---

## Dashboard Verification

### 1. Service Overview Dashboard

**Location**: `infrastructure/monitoring/dashboards/service-overview.json`

**Panels to Verify**:

1. **Service Availability**
   - Metric: `up{job=~".*-service"}`
   - Expected: All services show "UP" (1)
   - Alert: Red background if service is down

2. **Request Rate**
   - Metric: `rate(http_requests_total[5m])`
   - Expected: Graph showing request volume per service
   - Baseline: 10-100 req/s depending on traffic

3. **Error Rate**
   - Metric: `rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])`
   - Expected: < 5% error rate
   - Alert: Visual indicator when > 5%

4. **P95 Response Time**
   - Metric: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Expected: < 2s for most services
   - Alert: Warning when > 2s

5. **CPU Usage**
   - Metric: `rate(process_cpu_seconds_total[5m])`
   - Expected: < 80% utilization
   - Alert: Warning when > 80%

6. **Memory Usage**
   - Metric: `process_resident_memory_bytes`
   - Expected: Stable over time, no memory leaks
   - Alert: Warning when approaching limits

**Access**: http://localhost:3000/d/service-overview

---

### 2. Database Metrics Dashboard

**Location**: `infrastructure/monitoring/dashboards/database-metrics.json`

**Key Panels**:
- Connection pool usage
- Query duration P95/P99
- Query error rate
- Active connections

---

### 3. Business Metrics Dashboard

**Location**: `infrastructure/monitoring/dashboards/business-metrics.json`

**Key Panels**:
- Job application rate
- Resume generation success rate
- AI service utilization
- Payment transaction volume

---

## Load Testing Procedures

### 1. Smoke Test (1 minute)

**Purpose**: Quick validation that all services are operational

```bash
cd tests/load
npm run test:smoke

# Expected results:
# - All health checks pass
# - Error rate < 1%
# - All services responsive
```

**Success Criteria**:
- ✅ All services return 200 on health endpoints
- ✅ Metrics endpoints accessible
- ✅ Basic login flow works
- ✅ Error rate < 1%

---

### 2. Load Test (15 minutes)

**Purpose**: Validate performance under expected production load

```bash
cd tests/load
npm run test:load

# Monitor in Prometheus:
# - Request rate: rate(http_requests_total[5m])
# - Error rate: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m])
# - P95 latency: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Load Profile**:
- Ramp up: 0 → 20 VUs over 2 minutes
- Sustain: 20 VUs for 5 minutes
- Increase: 20 → 40 VUs over 2 minutes
- Sustain: 40 VUs for 5 minutes
- Ramp down: 40 → 0 VUs over 2 minutes

**Success Criteria**:
- ✅ P95 latency < 2s
- ✅ P99 latency < 5s
- ✅ Error rate < 5%
- ✅ All thresholds pass
- ✅ No alerts fire

---

### 3. Spike Test (5 minutes)

**Purpose**: Validate behavior during sudden traffic surges

```bash
cd tests/load
npm run test:spike

# This test validates the gateway reliability fixes:
# - Rate limiting should activate (429 responses)
# - Circuit breakers may open briefly
# - System should remain stable
# - Degraded mode should activate if Redis overwhelmed
```

**Load Profile**:
- Baseline: 5 VUs for 20 seconds
- Spike: 5 → 100 VUs in 10 seconds
- Sustain spike: 100 VUs for 1 minute
- Recovery: 100 → 5 VUs in 10 seconds
- Cool down: 5 VUs for 1 minute

**Success Criteria**:
- ✅ System remains stable during spike
- ✅ Rate limiting activates (429 responses acceptable)
- ✅ Error rate < 15% during spike
- ✅ P95 latency < 10s during spike
- ✅ System recovers after spike
- ✅ Autoscaling triggers (if enabled)
- ✅ Circuit breakers work correctly

**Metrics to Monitor**:

```promql
# Rate limit degraded operations
gateway_rate_limit_degraded_total

# Circuit breaker state
circuit_breaker_state

# Request latency
histogram_quantile(0.95, rate(http_request_duration_by_route_seconds_bucket[1m]))

# Error rate
rate(http_requests_total{status_code=~"5.."}[1m]) / rate(http_requests_total[1m])

# Redis latency
histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[1m]))
```

---

### 4. Circuit Breaker Test (7 minutes)

**Purpose**: Validate resilience patterns and failure handling

```bash
cd tests/load
npm run test:circuit-breaker

# This test specifically validates circuit breaker behavior:
# Phase 1 (2 min): Normal load, circuit CLOSED
# Phase 2 (3 min): Error injection, circuit should OPEN
# Phase 3 (2 min): Recovery, circuit should close via HALF_OPEN
```

**Success Criteria**:
- ✅ Circuit breakers open under high error rates
- ✅ Fallbacks execute correctly
- ✅ System recovers when errors subside
- ✅ No cascading failures
- ✅ `circuit_breaker_state` metric transitions correctly
- ✅ `circuit_breaker_state_changes_total` increments appropriately

**Validation Queries**:

```promql
# Circuit breaker state transitions
circuit_breaker_state_changes_total

# Current circuit breaker state
circuit_breaker_state

# Fallback execution count
circuit_breaker_fallbacks_total

# Circuit breaker trip count
circuit_breaker_trips_total
```

---

### 5. Soak Test (2 hours)

**Purpose**: Identify memory leaks and long-term stability issues

```bash
cd tests/load
npm run test:soak

# Run overnight or during low-traffic periods
# Monitor for:
# - Memory growth over time
# - Connection pool leaks
# - Gradual performance degradation
```

**Success Criteria**:
- ✅ No memory leaks (stable memory usage)
- ✅ No performance degradation over time
- ✅ Stable error rate
- ✅ All services remain healthy

---

## Expected Results

### 1. Gateway Reliability Validation

| Test Scenario | Expected Metric Behavior | Expected Alert Behavior |
|---------------|-------------------------|------------------------|
| Normal operation | `gateway_rate_limit_degraded_total` = 0 | No alerts |
| Redis unavailable | `gateway_rate_limit_degraded_total` > 0<br>`redis_connection_state` = 0 | GatewayRateLimitDegradedMode fires after 5 min<br>RedisConnectionDown fires after 1 min |
| High Redis latency | `redis_operation_duration_seconds` P95 > 100ms | HighRedisLatency fires after 5 min |
| Traffic spike | Rate limiting activates (429s)<br>Possible temporary degradation | May briefly fire, should resolve |
| 5xx spike | `http_requests_by_route_total{status_code=~"5.."}` increases | High5xxSpikeGateway fires after 2 min |

---

### 2. Circuit Breaker Validation

| Test Scenario | Expected Metric Behavior | Expected Alert Behavior |
|---------------|-------------------------|------------------------|
| Normal operation | `circuit_breaker_state` = 0 (CLOSED) | No alerts |
| High error rate | `circuit_breaker_state` = 1 (OPEN)<br>`circuit_breaker_trips_total` increments | CircuitBreakerOpen fires after 1 min |
| Recovery attempt | `circuit_breaker_state` = 2 (HALF_OPEN) | Alert may remain active |
| Successful recovery | `circuit_breaker_state` = 0 (CLOSED) | Alert resolves |
| Flapping | `circuit_breaker_state_changes_total` high rate | FrequentCircuitBreakerStateChanges fires |

---

### 3. Performance Baselines

| Metric | Normal Load | Spike Load | Acceptable Degradation |
|--------|-------------|------------|----------------------|
| Request Rate | 10-100 req/s | 500-1000 req/s | N/A |
| P95 Latency | < 500ms | < 2s | < 10s during spike |
| P99 Latency | < 2s | < 5s | < 20s during spike |
| Error Rate | < 1% | < 5% | < 15% during spike |
| Redis Latency P95 | < 20ms | < 50ms | < 100ms |
| DB Pool Usage | < 70% | < 85% | < 90% |
| Circuit Breaker State | CLOSED | May open briefly | Should recover |

---

## Troubleshooting Guide

### Metrics Not Appearing

**Problem**: Metrics endpoint returns empty or missing metrics

**Diagnosis**:

```bash
# 1. Check if metrics endpoint is accessible
curl http://localhost:8001/metrics

# 2. Verify Prometheus scrape configuration
curl http://localhost:9090/api/v1/targets | jq

# 3. Check service logs for errors
docker-compose logs [service-name]

# 4. Verify metrics service is initialized
# Check service startup logs for: "[Telemetry] Initialized for service: ..."
```

**Solution**:
1. Ensure `GatewayMetricsService` is properly injected in service constructors
2. Verify metrics are being recorded in code
3. Check network connectivity between Prometheus and services
4. Restart services to reinitialize metrics

---

### Alerts Not Firing

**Problem**: Alerts should fire but don't appear in Alertmanager

**Diagnosis**:

```bash
# 1. Check alert rules are loaded
curl http://localhost:9090/api/v1/rules | jq '.data.groups[].rules[] | select(.type=="alerting")'

# 2. Verify alert condition is met
# Copy alert expression and run in Prometheus UI
# Should return result > 0

# 3. Check alert evaluation
curl http://localhost:9090/api/v1/alerts | jq

# 4. Verify Alertmanager connectivity
curl http://localhost:9093/api/v1/status
```

**Solution**:
1. Reload Prometheus configuration
2. Check alert rule syntax for errors
3. Verify `for` duration hasn't been exceeded
4. Check Alertmanager configuration

---

### Load Test Failures

**Problem**: Load tests fail with high error rates or timeouts

**Diagnosis**:

```bash
# 1. Check service health
for service in auth user job; do
  curl http://localhost:${PORT}/health
done

# 2. Check resource usage
docker stats

# 3. Verify database connections
# Check connection pool metrics

# 4. Check logs for errors
docker-compose logs --tail=100 [service-name]
```

**Solution**:
1. Increase resource limits if containers are hitting CPU/memory caps
2. Scale up service replicas
3. Adjust load test VU count downward
4. Investigate and fix application errors

---

### High Degraded Mode Percentage

**Problem**: `gateway_rate_limit_degraded_total` consistently high

**Diagnosis**:

```bash
# 1. Check Redis connection
redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls ping

# 2. Check Redis latency
histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[5m]))

# 3. Check Redis error rate
rate(redis_errors_total[5m])

# 4. Review Redis logs
az redis list-logs --name applyforus-redis --resource-group applyforus-rg
```

**Solution**:
1. Scale Redis cache (increase tier/capacity)
2. Optimize Redis operations (reduce key size, use pipelining)
3. Implement connection pooling
4. Add Redis read replicas for scaling reads

---

### Circuit Breaker Flapping

**Problem**: Circuit breaker constantly opening and closing

**Diagnosis**:

```bash
# 1. Check state change frequency
rate(circuit_breaker_state_changes_total[5m])

# 2. Identify cause of errors
# Check downstream service health
# Review error logs

# 3. Check circuit breaker configuration
# volumeThreshold, errorThresholdPercentage, resetTimeout
```

**Solution**:
1. Increase `volumeThreshold` (requires more requests before evaluating)
2. Increase `resetTimeout` (wait longer before attempting recovery)
3. Adjust `errorThresholdPercentage` if too sensitive
4. Fix underlying service issues causing errors

---

## Validation Checklist

### Pre-Deployment

- [ ] All metrics are exposed on `/metrics` endpoints
- [ ] Prometheus successfully scrapes all services
- [ ] Grafana dashboards load without errors
- [ ] All alert rules pass syntax validation
- [ ] Load test environment is configured
- [ ] Test user accounts exist and are valid

### During Deployment

- [ ] Run smoke test after deployment
- [ ] Verify all services are UP in Service Overview dashboard
- [ ] Check Prometheus targets are healthy
- [ ] Verify no unexpected alerts firing
- [ ] Run load test in staging environment

### Post-Deployment

- [ ] Monitor metrics for 24 hours
- [ ] Validate alerts fire correctly for known issues
- [ ] Review dashboard metrics align with expectations
- [ ] Run full load test suite during low-traffic period
- [ ] Document any anomalies or deviations from baseline

---

## Integration with CI/CD

### GitHub Actions Workflow

```yaml
name: Observability Validation
on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Wait for services
        run: sleep 30
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

  load-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v3
      - name: Start services
        run: docker-compose up -d
      - name: Run load test
        run: |
          cd tests/load
          npm install
          npm run test:load
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: tests/load/load-test-results.json
```

---

## Summary

This observability validation plan provides comprehensive coverage of:

1. **Metrics**: All required metrics for gateway reliability, Redis dependencies, and circuit breakers
2. **Alerts**: Properly configured alerts for degraded mode, latency regression, and 5xx spikes
3. **Dashboards**: Visual monitoring of all critical system metrics
4. **Load Tests**: Scenarios to validate fixes and system resilience
5. **Validation**: Step-by-step procedures to verify observability infrastructure

**Next Steps**:

1. Implement `GatewayMetricsService` in all services
2. Update service code to record metrics
3. Deploy updated alert rules to Prometheus
4. Run validation tests in staging environment
5. Schedule regular load tests
6. Monitor production metrics and tune thresholds as needed

---

**Document Version**: 1.0
**Last Updated**: 2025-12-15
**Owner**: Platform Engineering Team
**Review Cycle**: Monthly
