# Observability Quick Start Guide

## 30-Second Setup

```bash
# 1. Make validation script executable
chmod +x scripts/validate-system.sh

# 2. Validate system
./scripts/validate-system.sh local

# 3. Run reliability tests
cd tests/load
npm run test:rate-limit
```

## Essential URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | None |
| **AlertManager** | http://localhost:9093 | None |
| **Auth Metrics** | http://localhost:3001/metrics | None |
| **Auth Health** | http://localhost:3001/health | None |

## Key Metrics to Monitor

```promql
# Degraded mode percentage
(sum(rate(gateway_rate_limit_total{status="degraded"}[5m])) /
 sum(rate(gateway_rate_limit_total[5m]))) * 100

# 5xx error rate
(sum(rate(http_requests_by_route_total{status_code=~"5.."}[5m])) /
 sum(rate(http_requests_by_route_total[5m]))) * 100

# Circuit breaker status
circuit_breaker_state

# Redis connection
redis_connection_state

# P95 latency
histogram_quantile(0.95,
  sum(rate(http_request_duration_by_route_seconds_bucket[5m])) by (le)
)
```

## Load Test Commands

```bash
cd tests/load

# Quick smoke test (1 min)
npm run test:smoke

# Rate limit test (7 min)
npm run test:rate-limit

# Redis failure test (7 min)
npm run test:redis-failure

# Circuit breaker test (7 min)
npm run test:circuit-breaker

# All reliability tests (21 min)
npm run test:reliability
```

## Validation Commands

```bash
# Validate local environment
./scripts/validate-system.sh local

# Check specific service health
curl http://localhost:3001/health | jq

# Check metrics endpoint
curl http://localhost:3001/metrics | grep gateway_rate_limit

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# Check active alerts
curl http://localhost:9090/api/v1/alerts | jq
```

## Critical Alerts

| Alert | Threshold | Action |
|-------|-----------|--------|
| **GatewayRateLimitDegradedMode** | > 1% for 5min | Check Redis |
| **CircuitBreakerOpen** | State = 1 for 1min | Check dependency |
| **RedisConnectionDown** | Connection = 0 for 1min | Restart Redis |
| **High5xxSpikeGateway** | > 10% for 2min | Check service logs |

## Quick Troubleshooting

### Redis Down
```bash
# Check Redis
docker ps | grep redis
redis-cli ping

# Restart Redis
docker-compose restart redis

# Verify recovery
curl http://localhost:3001/metrics | grep redis_connection_state
```

### Circuit Breaker Open
```bash
# Check which circuit
curl http://localhost:3001/metrics | grep "circuit_breaker_state 1"

# Check dependency health
./scripts/validate-system.sh local
```

### High Latency
```bash
# Find slowest endpoints
curl 'http://localhost:9090/api/v1/query?query=topk(5,%20histogram_quantile(0.95,%20sum(rate(http_request_duration_by_route_seconds_bucket[5m]))%20by%20(le,%20route)))'

# Check DB pool
curl http://localhost:3001/metrics | grep postgres_connection_pool
```

## Documentation

- **Full Guide:** `docs/OBSERVABILITY_GUIDE.md`
- **Test Guide:** `tests/load/RELIABILITY_TESTS.md`
- **Summary:** `OBSERVABILITY_IMPLEMENTATION_SUMMARY.md`

## File Locations

```
C:/Users/kogun/OneDrive/Documents/Job-Apply-Platform/
├── scripts/
│   └── validate-system.sh                    # System validation
├── tests/load/scenarios/
│   ├── rate-limit-test.js                    # Rate limit test
│   ├── redis-failure-test.js                 # Redis failure test
│   └── circuit-breaker-test.js               # Circuit breaker test
├── packages/telemetry/src/
│   ├── gateway-metrics.ts                    # Gateway metrics
│   └── metrics.ts                            # Standard metrics
├── infrastructure/monitoring/prometheus/alerts/
│   └── service-alerts.yml                    # Alert rules
└── docs/
    ├── OBSERVABILITY_GUIDE.md                # Full documentation
    └── RELIABILITY_TESTS.md                  # Test documentation
```

---

**Last Updated:** 2025-12-15
**Need Help?** See `docs/OBSERVABILITY_GUIDE.md` for detailed documentation
