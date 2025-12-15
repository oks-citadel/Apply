# Incident Response: Redis Rate Limiting Issues

## Document Version: 1.0
## Last Updated: 2025-12-15

---

## Overview

This document describes the rate limiting architecture, known failure modes, and response procedures for Redis-backed rate limiting issues in the ApplyForUs platform.

## Architecture

### Rate Limiting Components

1. **Kong API Gateway** - Primary rate limiter
   - Redis-backed distributed rate limiting
   - `fault_tolerant: true` (fail-open)
   - Default: 100 req/min, 5000 req/hour
   - AI Service: 50 req/min (more expensive operations)

2. **Service-Level Rate Limiters**
   - Auto-Apply Service: Platform-specific rate limits
   - User Service: Tenant-based rate limiting
   - Both implement fail-open patterns

3. **Redis Cache** - Azure Cache for Redis
   - Host: `applyforus-redis.redis.cache.windows.net`
   - Port: 6380 (SSL)
   - Used for distributed rate limit counters

## Fail-Open Pattern

All rate limiters are configured with **fail-open** behavior:

```yaml
# Kong Configuration
plugins:
  - name: rate-limiting
    config:
      fault_tolerant: true  # CRITICAL: Enables fail-open
      redis_timeout: 2000   # 2 second timeout
```

When Redis is unavailable:
- Rate limit checks **ALLOW** the request
- Metric `gateway_rate_limit_degraded_total` is incremented
- Structured log: `rate_limit_degraded=true`

## Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `gateway_rate_limit_degraded_total` | Rate limit operations in degraded mode | > 1% for 5 minutes |
| `redis_connection_state` | Redis connection status (1=up, 0=down) | == 0 for 1 minute |
| `redis_operation_duration_seconds` | Redis latency histogram | p95 > 100ms |
| `circuit_breaker_state` | Circuit breaker state (0=closed, 1=open) | == 1 (OPEN) |

## Common Failure Scenarios

### Scenario 1: Redis Latency Spikes

**Symptoms:**
- Gateway response times increase
- `redis_operation_duration_seconds` p95 > 100ms
- Occasional 504 Gateway Timeout

**Response:**
1. Check Azure Redis metrics (CPU, memory, connections)
2. Scale Redis tier if needed
3. Verify no network issues between AKS and Redis

**Short-term mitigation:**
```bash
# Temporarily reduce Redis dependency
kubectl set env deployment/kong RATE_LIMIT_MODE=local
```

### Scenario 2: Redis Connection Exhaustion

**Symptoms:**
- `redis_connection_state` = 0
- Redis errors in logs: "connection refused" or "max clients reached"
- `gateway_rate_limit_degraded_total` increasing

**Response:**
1. Check Redis `maxclients` setting vs current connections
2. Restart services with connection leaks
3. Increase Redis connection pool limits

### Scenario 3: Circuit Breaker Tripping

**Symptoms:**
- `circuit_breaker_state` = 1 (OPEN)
- `circuit_breaker_trips_total` increasing
- Service unavailable errors

**Response:**
1. Check downstream service health
2. Review recent deployments
3. Manually reset circuit breaker if safe:
```bash
# Access orchestrator service
kubectl exec -it deploy/orchestrator-service -- curl -X POST localhost:8008/api/v1/admin/circuits/reset
```

## Emergency Toggles

### Rate Limit Mode Toggle

Environment variable: `RATE_LIMIT_MODE`

| Value | Behavior |
|-------|----------|
| `redis` | Normal: Use Redis for distributed rate limiting |
| `local` | In-memory only: No Redis dependency |
| `off` | Disabled: No rate limiting (use with caution) |

### How to Toggle

```bash
# For Kong API Gateway
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=local

# For individual services
kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=local
```

### Rollback

```bash
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=redis
```

## Runbook: Complete Redis Outage

1. **Immediate (0-5 minutes):**
   - Verify fail-open is working (requests are passing)
   - Monitor `gateway_rate_limit_degraded_total`
   - Check Azure Redis health in portal

2. **Short-term (5-30 minutes):**
   - If Redis is down, switch to local mode:
     ```bash
     kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=local
     ```
   - Monitor for abuse without distributed rate limiting

3. **Investigation (parallel):**
   - Check Azure Service Health for Redis incidents
   - Review Redis metrics: CPU, memory, connections
   - Check AKS network policies

4. **Resolution:**
   - Once Redis is healthy, restore redis mode
   - Monitor `gateway_rate_limit_degraded_total` returns to 0
   - Post-incident review

## Timeout Ordering

Correct timeout hierarchy (prevents cascading failures):

```
Gateway timeout (60s) > Service timeout (30s) > Redis timeout (2s)
```

| Component | Timeout Value |
|-----------|---------------|
| Kong connect_timeout | 60000ms |
| Kong read_timeout | 60000ms |
| Service HTTP client | 30000ms |
| Redis timeout | 2000ms |
| Rate limit check | 2000ms |

## Escalation

| Level | Contact | Trigger |
|-------|---------|---------|
| L1 | On-call engineer | Alert fires |
| L2 | Platform team | > 15 min unresolved |
| L3 | Architecture team | Circuit breaker patterns failing |

## Related Documents

- [Postgres Public Connectivity](./postgres-public-connectivity.md)
- [Runbook: Rate Limiter](./runbook-rate-limiter.md)
- [Gateway Reliability Quick Reference](../GATEWAY_RELIABILITY_QUICK_REFERENCE.md)
