# Runbook: Rate Limiter Operations

## Document Version: 1.0
## Last Updated: 2025-12-15

---

## Overview

This runbook provides step-by-step procedures for operating and troubleshooting the rate limiting system.

## Environment Variables

| Variable | Values | Description |
|----------|--------|-------------|
| `RATE_LIMIT_MODE` | `redis`, `local`, `off` | Rate limiting mode |
| `REDIS_HOST` | hostname | Redis server address |
| `REDIS_PORT` | 6380 | Redis port (SSL) |
| `REDIS_TLS` | true/false | Enable TLS |
| `RATE_LIMIT_TTL` | 60 | Window duration in seconds |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |

## Normal Operations

### Check Rate Limiting Status

```bash
# Kong metrics
kubectl exec -n kong deploy/kong -- curl -s localhost:8001/metrics | grep rate_limit

# Gateway metrics
kubectl exec deploy/gateway -- curl -s localhost:3000/metrics | grep gateway_rate_limit

# Check Redis connection
kubectl exec deploy/auto-apply-service -- redis-cli -h $REDIS_HOST -p 6380 --tls ping
```

### View Current Limits

```bash
# Kong rate limit config
kubectl get configmap -n kong kong-config -o yaml | grep -A 20 "rate-limiting"
```

### Monitor Degraded Mode

```bash
# Watch degraded mode counter
watch -n 5 'kubectl exec deploy/gateway -- curl -s localhost:3000/metrics | grep gateway_rate_limit_degraded_total'
```

## Emergency Procedures

### EP-1: Switch to Local Rate Limiting

**When:** Redis is unavailable and degraded mode is causing issues

```bash
# 1. Switch Kong to local mode
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=local

# 2. Verify change
kubectl rollout status deployment/kong -n kong

# 3. Monitor
kubectl logs -n kong -l app=kong --tail=50 -f | grep rate

# 4. After Redis recovers, switch back
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=redis
```

### EP-2: Disable Rate Limiting Entirely

**When:** Emergency situation requiring all traffic to pass

```bash
# 1. Disable rate limiting (USE WITH CAUTION)
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=off

# 2. Set up monitoring for abuse
# Watch request counts manually

# 3. Re-enable ASAP
kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=redis
```

### EP-3: Increase Rate Limits Temporarily

**When:** Expected high traffic (marketing campaign, launch)

```bash
# 1. Update ConfigMap
kubectl edit configmap kong-config -n kong
# Change: minute: 100 -> minute: 500

# 2. Reload Kong
kubectl rollout restart deployment/kong -n kong

# 3. Revert after event
```

## Troubleshooting

### TS-1: High Degraded Mode Percentage

**Symptoms:** `gateway_rate_limit_degraded_total` increasing rapidly

**Steps:**
1. Check Redis health
   ```bash
   # Azure CLI
   az redis show --name applyforus-redis --resource-group applyforus-prod-rg --query "provisioningState"
   ```

2. Check Redis latency
   ```bash
   kubectl exec deploy/auto-apply-service -- redis-cli -h $REDIS_HOST -p 6380 --tls --latency
   ```

3. Check connection count
   ```bash
   kubectl exec deploy/auto-apply-service -- redis-cli -h $REDIS_HOST -p 6380 --tls INFO clients
   ```

4. If Redis is overloaded:
   - Scale up Redis tier
   - Switch to local mode temporarily

### TS-2: 429 Too Many Requests Errors

**Symptoms:** Users getting rate limited unexpectedly

**Steps:**
1. Check if single IP is hitting limits (NAT situation)
   ```bash
   kubectl logs -n kong -l app=kong | grep "429" | awk '{print $1}' | sort | uniq -c | sort -rn | head
   ```

2. Consider switching limit_by:
   - `ip` (default) - May hit NAT issues
   - `consumer` - Requires authentication
   - `header` - Custom header like X-User-ID

3. Temporarily increase limits for affected route

### TS-3: Circuit Breaker Keeps Opening

**Symptoms:** `circuit_breaker_state` = 1 (OPEN)

**Steps:**
1. Check which circuit is open
   ```bash
   kubectl exec deploy/orchestrator-service -- curl -s localhost:8008/api/v1/admin/circuits/status
   ```

2. Check downstream service health
   ```bash
   kubectl get pods -l app=<downstream-service>
   kubectl logs -l app=<downstream-service> --tail=100
   ```

3. If downstream is healthy, reset circuit
   ```bash
   kubectl exec deploy/orchestrator-service -- curl -X POST localhost:8008/api/v1/admin/circuits/reset/<circuit-name>
   ```

4. If issue persists, increase thresholds temporarily:
   - `failureThreshold`: 10 -> 20
   - `timeout`: 60000 -> 90000

## Monitoring Dashboards

### Grafana Queries

**Degraded Mode Rate:**
```promql
rate(gateway_rate_limit_degraded_total[5m]) / rate(gateway_rate_limit_total[5m]) * 100
```

**Redis Latency P95:**
```promql
histogram_quantile(0.95, rate(redis_operation_duration_seconds_bucket[5m]))
```

**Circuit Breaker State:**
```promql
circuit_breaker_state{service="orchestrator"}
```

### Alerting Rules

```yaml
groups:
  - name: rate-limiting
    rules:
      - alert: RateLimitDegradedModeHigh
        expr: |
          (rate(gateway_rate_limit_degraded_total[5m]) /
           rate(gateway_rate_limit_total[5m])) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Rate limiting operating in degraded mode"

      - alert: RedisConnectionDown
        expr: redis_connection_state == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection lost"

      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 1
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Circuit breaker is open"
```

## Recovery Procedures

### After Redis Recovery

1. Verify Redis is healthy
   ```bash
   az redis show --name applyforus-redis --resource-group applyforus-prod-rg
   ```

2. Switch back to Redis mode
   ```bash
   kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=redis
   ```

3. Monitor degraded counter returns to 0
   ```bash
   kubectl exec deploy/gateway -- curl -s localhost:3000/metrics | grep gateway_rate_limit_degraded_total
   ```

4. Post-incident review

### After Emergency Disable

1. Re-enable rate limiting
   ```bash
   kubectl set env deployment/kong -n kong RATE_LIMIT_MODE=redis
   ```

2. Check for abuse during disabled period
   - Review logs for suspicious traffic
   - Check for data anomalies

3. Document incident

## Contacts

| Role | Contact |
|------|---------|
| Platform Team | platform@applyforus.com |
| On-Call | PagerDuty rotation |
| Security | security@applyforus.com (if abuse detected) |

## Related Documents

- [Incident Response: Redis Rate Limiting](./incident-rate-limit-redis.md)
- [Postgres Public Connectivity](./postgres-public-connectivity.md)
- [Gateway Reliability Quick Reference](../GATEWAY_RELIABILITY_QUICK_REFERENCE.md)
