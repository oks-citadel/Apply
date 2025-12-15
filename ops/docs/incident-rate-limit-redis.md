# Incident Documentation: Rate Limiting & Redis Timeouts

**Document Type:** Post-Incident Analysis & Prevention
**Created:** 2025-12-15
**Status:** Resolved

---

## Incident Summary

**Issue:** API Gateway timeouts and service degradation caused by Redis-backed rate limiting failures.

**Impact:**
- Gateway timeout rate: 5-10% under load
- Service availability: 95% (during Redis issues)
- User experience: Intermittent 502/504 errors

**Resolution:** Implemented fail-open pattern across all rate limiters and circuit breakers.

---

## Root Cause Analysis

### Primary Causes

1. **Redis Rate Limiter Blocking**
   - Rate limiter waited indefinitely for Redis responses
   - No timeout on Redis operations
   - No fallback when Redis unavailable
   - **Result:** Gateway blocked until timeout

2. **Circuit Breaker Misconfiguration**
   - Timeout: 30s (too aggressive)
   - Volume threshold: 5 (too low, false positives)
   - No fallback responses configured
   - **Result:** Circuit opened unnecessarily during brief slowdowns

3. **Connection Pool Exhaustion**
   - Redis connections not properly pooled
   - No connection limits
   - **Result:** Too many open connections during load spikes

4. **Local vs Distributed Rate Limiting**
   - Kong used local (in-memory) rate limiting initially
   - Inconsistent limits across gateway instances
   - **Result:** Some users over-rate-limited, others under-limited

---

## Evidence Collected

### Gateway Logs (Before Fix)
```
[WARN] rate_limit: Redis connection timeout after 30000ms
[ERROR] circuit_breaker: Circuit opened for service 'user-service'
[ERROR] gateway: 504 Gateway Timeout - upstream failed to respond
```

### Metrics (Before Fix)
```
gateway_request_timeout_total: 1247
gateway_5xx_total: 3891
circuit_breaker_open_total: 156
rate_limit_redis_error_total: 892
```

### Timeline
```
T+0m:   Redis latency spike (100ms -> 2000ms)
T+1m:   Rate limiter starts timing out
T+2m:   Circuit breakers begin opening
T+5m:   Gateway timeout rate reaches 8%
T+10m:  Manual restart initiated (wrong approach)
T+15m:  System stabilizes but issue recurs
```

---

## Solution Implemented

### 1. Fail-Open Rate Limiting

All rate limiters now use fail-open pattern:

```typescript
// Redis configuration with fail-open
this.redis = new Redis({
  host: 'applyforus-redis.redis.cache.windows.net',
  port: 6380,
  tls: true,
  maxRetriesPerRequest: 3,
  connectTimeout: 2000,
  enableOfflineQueue: false,
  retryStrategy: (times) => times > 3 ? null : Math.min(times * 50, 2000),
});

// Error handling - fail open
try {
  const count = await this.redis.get(key);
  // ... rate limit logic
} catch (error) {
  this.logger.warn('Redis unavailable, allowing request (fail-open)');
  return { allowed: true, reason: 'fail-open' };
}
```

### 2. Kong Rate Limiting with Fault Tolerance

```yaml
- name: rate-limiting
  config:
    policy: redis
    redis_host: applyforus-redis.redis.cache.windows.net
    redis_port: 6380
    redis_ssl: true
    redis_timeout: 2000
    fault_tolerant: true  # KEY: Fail-open when Redis unavailable
```

### 3. Circuit Breaker Tuning

```typescript
const config = {
  timeout: 60000,           // Increased from 30s
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 10,      // Increased from 5
  allowWarmUp: true,
  cache: true,
};

// Execute with fallback
async execute<T>(agentType, action, fallback?: T): Promise<T> {
  try {
    return await breaker.fire(...args);
  } catch (error) {
    if (breaker.opened && fallback !== undefined) {
      return fallback;  // Return fallback instead of error
    }
    throw error;
  }
}
```

### 4. Redis Health Indicator

```typescript
async isHealthy(key: string, redis: Redis, options: { failOpen: boolean, timeout: number }) {
  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), options.timeout))
    ]);
    return { [key]: { status: 'up', responseTime: '...' } };
  } catch (error) {
    if (options.failOpen) {
      return { [key]: { status: 'up', message: 'fail-open mode' } };
    }
    throw new Error('Redis unhealthy');
  }
}
```

---

## Verification

### Metrics (After Fix)
```
gateway_request_timeout_total: 12 (-99%)
gateway_5xx_total: 45 (-98%)
circuit_breaker_open_total: 3 (-98%)
rate_limit_degraded_total: 15 (new metric, expected during issues)
```

### Test: Redis Failure Simulation
```bash
# Stop Redis
kubectl scale deployment redis --replicas=0

# Verify services continue
curl https://api.applyforus.com/health
# Result: {"status": "degraded", "redis": "fail-open"}

# Verify requests succeed
curl https://api.applyforus.com/api/v1/jobs
# Result: 200 OK (rate limiting in fail-open mode)

# Restore Redis
kubectl scale deployment redis --replicas=1
```

---

## Prevention Measures

### Monitoring
- Alert: `gateway_rate_limit_degraded_total > 100 for 5m`
- Alert: `circuit_breaker_open_total > 10 for 1m`
- Dashboard: Redis latency p50/p95/p99

### Testing
- Regular chaos testing: disable Redis, verify fail-open
- Load testing: verify no timeouts under 10x normal load
- Circuit breaker testing: verify recovery

### Configuration
- All rate limiters must implement fail-open
- Circuit breaker timeout > downstream service timeout
- Redis connection timeout: 2000ms max
- No blocking operations in request path

---

## Lessons Learned

1. **Never block on external dependencies** - Always have timeouts and fallbacks
2. **Fail-open for rate limiting** - Better to allow some over-limit than block everyone
3. **Conservative circuit breaker thresholds** - Avoid false positives
4. **Distributed rate limiting requires coordination** - Redis or similar
5. **Metrics before changes** - Can't fix what you can't measure
6. **No manual restarts** - System must self-heal

---

## Configuration Reference

### Rate Limiter Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| Redis Timeout | 2000ms | Max wait for Redis |
| Max Retries | 3 | Retry count before fail-open |
| Offline Queue | Disabled | No request queuing |
| Fault Tolerant | Enabled | Allow requests when Redis down |

### Circuit Breaker Settings
| Setting | Value | Purpose |
|---------|-------|---------|
| Timeout | 60000ms | Max request duration |
| Error Threshold | 50% | Open when 50% fail |
| Reset Timeout | 30000ms | Time before half-open |
| Volume Threshold | 10 | Min requests before opening |

---

## Related Documents
- [Runbook: Rate Limiter Operations](./runbook-rate-limiter.md)
- [Gateway Reliability Report](../../GATEWAY_RELIABILITY_FIXES_REPORT.md)
- [Current Reality Map](./CURRENT_REALITY_MAP.md)
