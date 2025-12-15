# Rate Limiter Emergency Runbook (Enhanced)

**Purpose:** Comprehensive emergency procedures for rate limiting issues
**Last Updated:** 2025-12-15
**Owner:** Platform Engineering Team
**Version:** 2.0.0

---

## Quick Reference

### Emergency Toggles

| Toggle | Command | Effect | Recovery Time |
|--------|---------|--------|---------------|
| Disable Rate Limiting | `kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=off` | All requests allowed, **NO** rate limiting | Immediate |
| Local Only Mode | `kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=local` | In-memory token bucket fallback | Immediate |
| Redis Mode (Default) | `kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=redis` | Full distributed rate limiting | 30s (reconnect) |

### Critical Metrics

```promql
# Degraded mode activation rate
rate(gateway_rate_limit_degraded_total[1m])

# Degraded mode percentage (ALERT if > 1%)
100 * (rate(gateway_rate_limit_degraded_total[5m]) / rate(gateway_rate_limit_total[5m]))

# Redis connectivity (0 = down, 1 = up)
redis_connection_state{service="auto-apply-service"}

# Circuit breaker states (0=CLOSED, 1=OPEN, 2=HALF_OPEN)
circuit_breaker_state

# P99 Redis latency (ALERT if > 100ms)
histogram_quantile(0.99, rate(redis_operation_duration_seconds_bucket[5m]))
```

---

## Architecture Overview

### Timeout Hierarchy (CRITICAL!)

```
┌──────────────────────────────────────────────┐
│  Kong Gateway Timeout: 60s                   │
│  ┌────────────────────────────────────────┐  │
│  │  Service HTTP Timeout: 60s             │  │
│  │  ┌──────────────────────────────────┐  │  │
│  │  │  Redis Operation: 2s (FAIL-OPEN)│  │  │
│  │  │  ┌────────────────────────────┐  │  │  │
│  │  │  │  Actual Processing        │  │  │  │
│  │  │  └────────────────────────────┘  │  │  │
│  │  └──────────────────────────────────┘  │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Rule**: Inner timeouts MUST be shorter than outer timeouts to prevent cascade failures.

### Fail-Open Pattern

All rate limiters implement fail-open:
1. **Redis timeout** (2s): Switch to token bucket fallback
2. **Redis error**: Log degraded mode, allow request
3. **Tenant service timeout** (2s): Allow request
4. **Circuit breaker open**: Return fallback value or allow

**Result**: Gateway NEVER times out due to rate limiting failures.

---

## Scenario 1: Redis Completely Down

### Symptoms
- `redis_connection_state = 0` for all services
- Logs show `error_type=redis_connection`
- `gateway_rate_limit_degraded_total` spiking
- Services still processing requests (fail-open working!)

### Diagnosis

```bash
# 1. Check Redis status in Azure
az redis show --name applyforus-redis --resource-group applyforus-prod --query "provisioningState"

# 2. Verify services are in degraded mode but functional
kubectl logs -n default deployment/auto-apply-service --tail=50 | jq 'select(.rate_limit_degraded == true)'

# 3. Check if requests are being processed
kubectl logs -n default deployment/auto-apply-service --tail=50 | grep "allowed.*true"
```

### Resolution

**Option A: Switch to Local Mode (Recommended)**
```bash
# Switch all services to token bucket fallback
kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=local -n default
kubectl rollout status deployment/auto-apply-service -n default

# Verify mode change
kubectl logs -n default deployment/auto-apply-service --tail=10 | grep "Rate limiting mode"
# Expected: "Rate limiting mode: local"
```

**Option B: Disable Rate Limiting (Emergency Only)**
```bash
# ONLY use if local mode is also failing
kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=off -n default
kubectl rollout status deployment/auto-apply-service -n default
```

**Option C: Fix Redis**
```bash
# Check Redis diagnostics
az redis show --name applyforus-redis --resource-group applyforus-prod

# Restart Redis if unhealthy (causes 1-2 min downtime)
az redis force-reboot --name applyforus-redis --resource-group applyforus-prod --reboot-type PrimaryNode

# Wait for Redis to be healthy
az redis show --name applyforus-redis --resource-group applyforus-prod --query "provisioningState"
```

**Recovery:**
```bash
# Once Redis is healthy, switch back
kubectl set env deployment/auto-apply-service RATE_LIMIT_MODE=redis -n default

# Monitor degraded mode percentage
kubectl logs -n default deployment/auto-apply-service -f | jq 'select(.rate_limit_degraded == true)'

# Should drop to < 1% within 5 minutes
```

---

## Scenario 2: Redis Timeout Spike

### Symptoms
- `redis_operation_duration_seconds` > 1s
- Logs show `error_type=redis_timeout`
- Degraded mode percentage 10-50%
- Intermittent slow responses

### Diagnosis

```bash
# 1. Check Redis latency
kubectl exec -it <auto-apply-pod> -n default -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 -a $REDIS_PASSWORD --tls \
  --latency

# 2. Check Redis connection count
kubectl exec -it <auto-apply-pod> -n default -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 -a $REDIS_PASSWORD --tls \
  INFO clients

# 3. Check Redis memory
kubectl exec -it <auto-apply-pod> -n default -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 -a $REDIS_PASSWORD --tls \
  INFO memory
```

### Resolution

**Option A: Scale Up Redis (if overloaded)**
```bash
# Check current SKU
az redis show --name applyforus-redis --resource-group applyforus-prod --query "sku"

# Upgrade to higher tier (causes brief downtime)
az redis update --name applyforus-redis --resource-group applyforus-prod \
  --sku Premium --vm-size P2
```

**Option B: Reduce Redis Load**
```bash
# Check key count
kubectl exec -it <auto-apply-pod> -- \
  redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --tls DBSIZE

# If > 100,000 keys, consider cleanup
kubectl exec -it <auto-apply-pod> -- \
  redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --tls \
  --scan --pattern "ratelimit:*" | head -1000 | xargs redis-cli ... DEL
```

**Option C: Add Connection Pooling**
```bash
# Increase max connections in Redis config
az redis update --name applyforus-redis --resource-group applyforus-prod \
  --set redisConfiguration.maxclients=10000
```

---

## Scenario 3: Gateway Timeouts (504)

### Symptoms
- 504 Gateway Timeout errors
- Kong logs show timeout errors
- Requests taking > 60s

### Diagnosis

```bash
# 1. Check timeout configuration
kubectl get configmap kong-config -n kong -o yaml | grep timeout

# Expected values:
#   connect_timeout: 60000
#   write_timeout: 60000
#   read_timeout: 60000

# 2. Check if timeouts are aligned
echo "Redis: 2s, Service: 60s, Gateway: 60s"

# 3. Look for timeout misalignment
kubectl logs -n default deployment/auto-apply-service | grep -i timeout | tail -20
```

### Resolution

**Fix Timeout Hierarchy**:

1. Verify Redis timeout is 2s:
```typescript
// services/auto-apply-service/src/modules/rate-limiter/rate-limiter.service.ts
private readonly OPERATION_TIMEOUT_MS = 2000; // ✓ Correct
```

2. Verify service timeout is 60s:
```typescript
// services/auto-apply-service/src/modules/engine/service-client.service.ts
timeout: config?.timeout || 60000, // ✓ Correct
```

3. Verify Kong timeout is 60s:
```yaml
# infrastructure/kubernetes/api-gateway/kong-config.yaml
connect_timeout: 60000  # ✓ Correct
write_timeout: 60000    # ✓ Correct
read_timeout: 60000     # ✓ Correct
```

---

## Scenario 4: Circuit Breakers Stuck Open

### Symptoms
- "Circuit OPEN" in logs
- Requests failing immediately
- Service health shows UNHEALTHY
- Issues persist after fixing downstream service

### Diagnosis

```bash
# Check circuit breaker states
kubectl logs -n default deployment/orchestrator-service | grep "Circuit" | tail -20

# Check circuit breaker stats
kubectl exec -it <orchestrator-pod> -- curl localhost:8080/metrics | grep circuit_breaker
```

### Resolution

**Option A: Wait for Reset** (30 seconds default)
```bash
# Circuit breakers auto-reset after reset timeout
# Wait 30s and check if half-open
kubectl logs -n default deployment/orchestrator-service | grep "HALF-OPEN"
```

**Option B: Restart Service**
```bash
# Force circuit breaker reset
kubectl rollout restart deployment/orchestrator-service -n default
kubectl rollout status deployment/orchestrator-service -n default

# Verify circuits are closed
kubectl logs -n default deployment/orchestrator-service | grep "Circuit CLOSED"
```

**Option C: Adjust Circuit Breaker Settings** (if too sensitive)
```bash
# Increase error threshold from 50% to 75%
kubectl set env deployment/orchestrator-service CIRCUIT_BREAKER_ERROR_THRESHOLD=75

# Increase volume threshold from 10 to 20 requests
kubectl set env deployment/orchestrator-service CIRCUIT_BREAKER_VOLUME_THRESHOLD=20
```

---

## Token Bucket Fallback (Local Mode)

### Overview

When `RATE_LIMIT_MODE=local` or Redis is unavailable, services use an in-memory token bucket algorithm:

```
Token Bucket for user "alice" on platform "linkedin":
┌─────────────────────┐
│ Tokens: 7/10        │  ← Current tokens / Max tokens
│ Refill: 0.0028/sec  │  ← 10 tokens / 3600 seconds
│ Last refill: 10:45s │  ← Last token refill time
└─────────────────────┘

Request arrives → Consume 1 token → 6/10 remaining
After 360s     → Refill 1 token  → 7/10 remaining
```

### Characteristics

| Aspect | Value | Notes |
|--------|-------|-------|
| Max tokens | Platform limit (e.g., 10 for LinkedIn) | Same as hourly Redis limit |
| Refill rate | `max_tokens / 3600` tokens/sec | Continuous refill |
| Memory per bucket | ~64 bytes | Includes all metadata |
| Cleanup interval | 2 hours | Removes inactive buckets |
| Persistence | None | Lost on pod restart |
| Distribution | Per-pod | NOT shared across pods |

### Monitoring

```bash
# Check token bucket count
kubectl exec -it <auto-apply-pod> -- curl localhost:3005/metrics | jq '.tokenBucketCount'

# Memory impact: buckets × 64 bytes
# Example: 10,000 buckets = ~640 KB (negligible)

# Check degraded mode percentage
kubectl exec -it <auto-apply-pod> -- curl localhost:3005/metrics | jq '.degradedModePercentage'
```

### Limitations

**1. Not Distributed**
- Each pod has independent buckets
- User can make N requests to EACH pod
- Mitigation: Use session affinity or accept looser limits

**2. Lost on Restart**
- All counters reset when pod restarts
- Mitigation: Minimize pod churn

**3. Memory Growth**
- Grows with unique user/platform combinations
- 10,000 users × 6 platforms = 60,000 buckets = ~4 MB
- Cleanup runs every 2 hours

### When to Use Local Mode

**Use when:**
- Redis is completely down
- Redis latency > 2s consistently
- Redis maintenance window
- Development/testing without Redis

**Return to Redis when:**
- Redis healthy and responding < 100ms
- Degraded mode percentage < 1% for 10+ minutes
- No Redis errors for 5+ minutes

---

## Configuration Reference

### Environment Variables

```bash
# ============================================================
# Rate Limiter Mode
# ============================================================
RATE_LIMIT_MODE=redis          # Options: redis | local | off

# ============================================================
# Redis Configuration
# ============================================================
REDIS_HOST=applyforus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=<from-azure-keyvault>
REDIS_TLS=true

# ============================================================
# Timeouts (milliseconds) - HIERARCHY MATTERS!
# ============================================================
REDIS_CONNECT_TIMEOUT=2000            # Redis connection establishment
REDIS_OPERATION_TIMEOUT=2000          # Individual Redis commands (CRITICAL!)
TENANT_SERVICE_TIMEOUT=2000           # Tenant service HTTP calls
SERVICE_HTTP_TIMEOUT=60000            # Service-to-service HTTP
CIRCUIT_BREAKER_TIMEOUT=60000         # Circuit breaker timeout
GATEWAY_CONNECT_TIMEOUT=60000         # Kong connect timeout
GATEWAY_WRITE_TIMEOUT=60000           # Kong write timeout
GATEWAY_READ_TIMEOUT=60000            # Kong read timeout

# ============================================================
# Fail-Open Configuration (DO NOT CHANGE!)
# ============================================================
RATE_LIMIT_FAIL_OPEN=true             # Allow requests on Redis failure
RATE_LIMIT_FALLBACK=local             # Fallback to token bucket

# ============================================================
# Circuit Breaker Settings
# ============================================================
CIRCUIT_BREAKER_ERROR_THRESHOLD=50    # % of errors before opening
CIRCUIT_BREAKER_VOLUME_THRESHOLD=10   # Min requests before opening
CIRCUIT_BREAKER_RESET_TIMEOUT=30000   # Time before half-open attempt
```

### Platform-Specific Rate Limits

| Platform | Per Hour | Per Day | Cooldown | Location |
|----------|----------|---------|----------|----------|
| LinkedIn | 10 | 50 | 5 min | `rate-limiter.service.ts:144-148` |
| Indeed | 15 | 75 | 3 min | `rate-limiter.service.ts:150-154` |
| Glassdoor | 12 | 60 | 4 min | `rate-limiter.service.ts:156-160` |
| Workday | 8 | 40 | 6 min | `rate-limiter.service.ts:162-166` |
| Greenhouse | 15 | 80 | 3 min | `rate-limiter.service.ts:168-172` |
| Lever | 15 | 80 | 3 min | `rate-limiter.service.ts:174-178` |
| Default | 10 | 50 | 5 min | `rate-limiter.service.ts:180-184` |

---

## Degraded Mode Monitoring

### Structured Logging

All degraded mode events include these fields:

```json
{
  "level": "warn",
  "message": "Rate limit degraded mode activated",
  "rate_limit_degraded": true,
  "gateway_rate_limit_degraded_total": 42,
  "redis_connected": false,
  "error_type": "redis_timeout",
  "user_id": "user-123",
  "platform": "linkedin",
  "timestamp": "2025-12-15T10:30:45.123Z"
}
```

### Query Examples

```bash
# Find all degraded mode events
kubectl logs -n default deployment/auto-apply-service --tail=1000 | \
  jq 'select(.rate_limit_degraded == true)'

# Count by error type
kubectl logs -n default deployment/auto-apply-service --tail=1000 | \
  jq -r 'select(.rate_limit_degraded == true) | .error_type' | \
  sort | uniq -c | sort -nr

# Find for specific user
kubectl logs -n default deployment/auto-apply-service --tail=1000 | \
  jq 'select(.rate_limit_degraded == true and .user_id == "user-123")'
```

### Prometheus Alerts

```yaml
groups:
  - name: rate_limiting
    interval: 30s
    rules:
      - alert: RateLimitDegradedMode
        expr: rate(gateway_rate_limit_degraded_total[1m]) > 1
        for: 2m
        labels:
          severity: warning
          component: rate-limiter
        annotations:
          summary: "Rate limiting in degraded mode"
          description: "{{ $value }} degraded activations/sec for 2+ minutes"
          runbook: "https://docs.applyforus.io/runbooks/rate-limiter"

      - alert: RateLimitDegradedModeCritical
        expr: rate(gateway_rate_limit_degraded_total[1m]) > 10
        for: 5m
        labels:
          severity: critical
          component: rate-limiter
          escalate: platform-lead
        annotations:
          summary: "Rate limiting heavily degraded"
          description: "{{ $value }} degraded activations/sec - Redis likely down"
          action: "Check Redis health and switch to local mode if needed"

      - alert: RedisConnectionDown
        expr: redis_connection_state{service="auto-apply-service"} == 0
        for: 5m
        labels:
          severity: critical
          component: redis
          escalate: azure-support
        annotations:
          summary: "Redis connection down for {{ $labels.service }}"
          description: "Switch to local mode: kubectl set env deployment/{{ $labels.service }} RATE_LIMIT_MODE=local"

      - alert: HighRedisLatency
        expr: histogram_quantile(0.99, rate(redis_operation_duration_seconds_bucket[5m])) > 0.1
        for: 10m
        labels:
          severity: warning
          component: redis
        annotations:
          summary: "High Redis latency"
          description: "P99 latency {{ $value }}s (> 100ms threshold)"
```

---

## Health Check Endpoints

### Auto-Apply Service

```bash
# Basic health
curl http://localhost:3005/health

# Expected response:
{
  "status": "ok",
  "service": "auto-apply-service",
  "version": "2.0.0",
  "timestamp": "2025-12-15T10:30:45.123Z",
  "uptime": 3600
}

# Detailed health with rate limiter metrics
curl http://localhost:3005/health/detailed | jq

# Expected response:
{
  "status": "ok",
  "service": "auto-apply-service",
  "rateLimiter": {
    "mode": "redis",
    "redisConnected": true,
    "totalChecks": 12345,
    "allowedRequests": 12300,
    "rejectedRequests": 40,
    "degradedModeActivations": 5,
    "degradedModePercentage": 0.04,
    "redisErrors": 5,
    "tokenBucketCount": 0,
    "lastDegradedAt": "2025-12-15T09:15:30.456Z"
  },
  "circuitBreakers": {
    "job-service": "CLOSED",
    "user-service": "CLOSED",
    "resume-service": "CLOSED",
    "ai-service": "CLOSED"
  }
}
```

### User Service

```bash
# Rate limit middleware metrics
curl http://localhost:3002/health | jq '.checks.rateLimit'

# Expected response:
{
  "totalChecks": 5678,
  "degradedModeActivations": 0,
  "degradedModePercentage": 0,
  "activeRateLimitEntries": 42
}
```

---

## Recovery Procedures

### Full System Recovery

Use when multiple services are impacted:

```bash
# 1. Stop all traffic (if needed)
kubectl scale deployment/kong-gateway --replicas=0 -n kong

# 2. Verify Redis is healthy
az redis show --name applyforus-redis --resource-group applyforus-prod

# 3. Clear rate limit state (if corrupted)
kubectl run -it --rm redis-cli --image=redis:7 --restart=Never -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 -a $REDIS_PASSWORD --tls \
  --scan --pattern "ratelimit:*" | xargs redis-cli -h ... -p ... -a ... --tls DEL

# 4. Reset all circuit breakers
for svc in orchestrator-service auto-apply-service; do
  kubectl rollout restart deployment/$svc -n default
done

# 5. Restart services in dependency order
kubectl rollout restart deployment/auth-service -n default
kubectl rollout status deployment/auth-service -n default

kubectl rollout restart deployment/user-service -n default
kubectl rollout status deployment/user-service -n default

kubectl rollout restart deployment/auto-apply-service -n default
kubectl rollout status deployment/auto-apply-service -n default

# 6. Gradually restore traffic
kubectl scale deployment/kong-gateway --replicas=1 -n kong
sleep 60  # Monitor for 1 minute

kubectl scale deployment/kong-gateway --replicas=3 -n kong

# 7. Monitor degraded mode percentage
watch -n 5 'kubectl logs -n default deployment/auto-apply-service --tail=100 | jq "select(.rate_limit_degraded == true)" | wc -l'
```

### Verification Commands

```bash
# 1. All pods healthy
kubectl get pods -n default -l tier=backend

# 2. Rate limiter responding
curl -I https://api.applyforus.io/health

# 3. Redis connected
kubectl logs -n default deployment/auto-apply-service --tail=50 | grep "Redis connected"

# 4. No degraded mode events
kubectl logs -n default deployment/auto-apply-service --tail=100 | \
  jq 'select(.rate_limit_degraded == true)' | wc -l
# Expected: 0

# 5. Metrics healthy
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Query: rate(gateway_rate_limit_degraded_total[5m])
# Expected: 0
```

---

## Escalation Path

| Level | Time | Contact | Action |
|-------|------|---------|--------|
| **L1** | 0-15 min | On-call Engineer | Investigate, check runbook |
| **L2** | 15-30 min | Platform Lead | Execute emergency toggles |
| **L3** | 30-60 min | Azure Support | Create P1 ticket |
| **L4** | 60+ min | VP Engineering | External communication |

### Communication Templates

**Incident Start:**
```
[INCIDENT] Rate limiting degraded - Sev 2

Status: INVESTIGATING
Impact: No user impact - fail-open working
Metrics: Degraded mode @ 15%, Redis latency 500ms
Action: Monitoring Redis, prepared to switch to local mode
ETA: Update in 15 minutes

Incident Commander: @engineer
War Room: #incident-rate-limiter
```

**Incident Mitigation:**
```
[UPDATE] Rate limiting - Mitigation applied

Status: MITIGATED
Action Taken: Switched to local mode (token bucket)
Impact: Services functional, rate limits slightly looser
Next Steps: Investigating Redis root cause
ETA: Resolution in 2 hours
```

**Incident Resolved:**
```
[RESOLVED] Rate limiting restored - Sev 2

Duration: 45 minutes
Root Cause: Redis connection pool exhaustion
Resolution: Scaled Redis to Premium P2, increased maxclients
Impact: Zero user-facing errors (fail-open successful)
Follow-up: Post-mortem scheduled for tomorrow 2pm

Post-mortem: https://docs.applyforus.io/postmortems/2025-12-15-rate-limiter
```

---

## Performance Benchmarks

### Redis Mode (Healthy)

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Rate limit check (p50) | < 10ms | > 50ms | > 100ms |
| Rate limit check (p99) | < 50ms | > 200ms | > 500ms |
| Redis operation (p50) | < 5ms | > 20ms | > 50ms |
| Redis operation (p99) | < 20ms | > 100ms | > 500ms |
| Degraded mode rate | < 0.1% | > 1% | > 10% |

### Local Mode (Fallback)

| Metric | Target | Notes |
|--------|--------|-------|
| Rate limit check (p50) | < 1ms | In-memory, extremely fast |
| Rate limit check (p99) | < 5ms | Even under high load |
| Memory per bucket | 64 bytes | Negligible |
| Max buckets | 10,000 | ~640 KB total |
| Cleanup overhead | < 10ms | Every 2 hours |

---

## Additional Resources

- [Redis Troubleshooting Guide](https://learn.microsoft.com/en-us/azure/azure-cache-for-redis/cache-troubleshoot)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Kong Gateway Timeouts](https://docs.konghq.com/gateway/latest/reference/configuration/#upstream_keepalive_idle_timeout)
- [Fail-Open Design Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/bulkhead)

---

**Document Version**: 2.0.0
**Last Updated**: 2025-12-15
**Next Review**: 2026-01-15
**Owner**: Platform Engineering Team
**Contributors**: Gateway Reliability Agent, SRE Team
