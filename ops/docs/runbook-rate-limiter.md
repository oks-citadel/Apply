# Runbook: Rate Limiter Operations

**Document Type:** Operational Runbook
**Version:** 1.0
**Last Updated:** 2025-12-15

---

## Overview

This runbook covers emergency operations for the rate limiting system, including how to toggle modes, handle degraded states, and recover from failures.

---

## Quick Reference

### Environment Variables
```bash
# Rate limiter mode
RATE_LIMIT_MODE=redis|local|off

# Redis connection
REDIS_HOST=applyforus-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_TLS=true
REDIS_PASSWORD=<from-key-vault>

# Timeouts
REDIS_TIMEOUT=2000
RATE_LIMIT_TIMEOUT=2000
```

### Emergency Toggle Commands
```bash
# Disable rate limiting entirely (EMERGENCY ONLY)
kubectl set env deployment/kong RATE_LIMIT_MODE=off -n kong

# Switch to local (in-memory) rate limiting
kubectl set env deployment/kong RATE_LIMIT_MODE=local -n kong

# Restore Redis rate limiting
kubectl set env deployment/kong RATE_LIMIT_MODE=redis -n kong
```

---

## Scenarios

### Scenario 1: Redis Unavailable

**Symptoms:**
- Logs: `Redis connection timeout` or `Redis connection refused`
- Metrics: `rate_limit_degraded_total` increasing
- Status: Requests succeeding (fail-open active)

**Actions:**
1. **Verify fail-open is working:**
   ```bash
   # Check service health
   curl https://api.applyforus.com/health/ready
   # Should show: {"redis": {"status": "down", "mode": "fail-open"}}
   ```

2. **Check Redis status:**
   ```bash
   # Azure Redis Cache status
   az redis show --name applyforus-redis --resource-group applyforus-prod-rg

   # Or via kubectl if using Redis in AKS
   kubectl get pods -l app=redis -n default
   kubectl logs -l app=redis -n default --tail=100
   ```

3. **If Redis is truly down:**
   - System is already in fail-open mode (no action needed)
   - Monitor `rate_limit_degraded_total` metric
   - Investigate Redis failure separately

4. **If Redis needs restart:**
   ```bash
   # Azure Redis Cache - force reboot
   az redis force-reboot --name applyforus-redis --resource-group applyforus-prod-rg --reboot-type AllNodes
   ```

---

### Scenario 2: Rate Limit Flood (DoS Attack)

**Symptoms:**
- Sudden spike in `rate_limit_hit_total` metric
- Same IP(s) making thousands of requests
- Legitimate users affected

**Actions:**
1. **Identify attacking IPs:**
   ```bash
   # Kong logs
   kubectl logs -l app=kong -n kong | grep "rate-limiting" | awk '{print $NF}' | sort | uniq -c | sort -rn | head -20
   ```

2. **Block specific IPs (temporary):**
   ```yaml
   # Apply IP restriction plugin
   kubectl apply -f - <<EOF
   apiVersion: configuration.konghq.com/v1
   kind: KongPlugin
   metadata:
     name: ip-restriction-emergency
     namespace: kong
   config:
     deny:
       - 1.2.3.4  # Attacking IP
   plugin: ip-restriction
   EOF
   ```

3. **Increase rate limits temporarily:**
   ```bash
   # Double the limits for legitimate traffic
   kubectl edit configmap kong-config -n kong
   # Change: minute: 100 -> minute: 200

   # Restart Kong to apply
   kubectl rollout restart deployment/kong -n kong
   ```

4. **Enable additional protection:**
   - Enable Azure WAF rules
   - Enable CDN rate limiting (Azure Front Door)

---

### Scenario 3: Gateway Timeouts

**Symptoms:**
- 502/504 errors from gateway
- Logs: `upstream timeout`
- Metrics: `gateway_request_timeout_total` increasing

**Diagnosis:**
```bash
# Check which service is slow
kubectl top pods -n applyforus

# Check service logs
for svc in auth-service user-service job-service; do
  echo "=== $svc ==="
  kubectl logs deployment/$svc -n applyforus --tail=50
done

# Check circuit breaker status
curl https://api.applyforus.com/api/v1/orchestrator/health/circuits
```

**Actions:**
1. **If Redis is the bottleneck:**
   - Check Redis metrics in Azure Portal
   - Consider scaling Redis (change SKU)
   - Switch to local rate limiting temporarily

2. **If downstream service is slow:**
   - Check that service's health
   - Circuit breaker should be handling this automatically
   - Consider scaling the slow service

3. **If Kong itself is overloaded:**
   ```bash
   # Scale Kong
   kubectl scale deployment/kong --replicas=5 -n kong
   ```

---

### Scenario 4: Circuit Breaker Stuck Open

**Symptoms:**
- Specific service returning errors
- Circuit breaker state: OPEN or UNHEALTHY
- Service is actually healthy but circuit won't close

**Actions:**
1. **Verify service is healthy:**
   ```bash
   # Direct health check (bypass gateway)
   kubectl port-forward service/user-service 3002:3002 -n applyforus
   curl http://localhost:3002/health
   ```

2. **Reset circuit breaker:**
   ```bash
   # Via orchestrator API
   curl -X POST https://api.applyforus.com/api/v1/orchestrator/circuits/reset/user-service

   # Or restart the calling service
   kubectl rollout restart deployment/orchestrator-service -n applyforus
   ```

3. **Check circuit breaker configuration:**
   - Volume threshold should be 10 (not too low)
   - Timeout should be 60s (not too aggressive)
   - Error threshold should be 50%

---

## Monitoring Commands

### Check Rate Limit Status
```bash
# Get rate limit metrics
curl -s https://api.applyforus.com/metrics | grep rate_limit

# Expected output:
# gateway_rate_limit_hit_total 1234
# gateway_rate_limit_degraded_total 5
```

### Check Redis Health
```bash
# Via health endpoint
curl https://api.applyforus.com/health/redis

# Via Azure CLI
az redis show --name applyforus-redis --resource-group applyforus-prod-rg --query "provisioningState"
```

### Check Circuit Breaker Status
```bash
# All circuits
curl https://api.applyforus.com/api/v1/orchestrator/health/circuits

# Specific circuit
curl https://api.applyforus.com/api/v1/orchestrator/health/circuits/user-service
```

---

## Recovery Procedures

### Full Rate Limiter Reset
```bash
# 1. Disable rate limiting
kubectl set env deployment/kong RATE_LIMIT_MODE=off -n kong
kubectl rollout restart deployment/kong -n kong
kubectl rollout status deployment/kong -n kong

# 2. Clear Redis rate limit keys
kubectl exec -it deployment/redis -n default -- redis-cli
> KEYS ratelimit:*
> DEL ratelimit:* (or FLUSHDB if safe)

# 3. Re-enable rate limiting
kubectl set env deployment/kong RATE_LIMIT_MODE=redis -n kong
kubectl rollout restart deployment/kong -n kong
```

### Full Circuit Breaker Reset
```bash
# Reset all circuits via API
curl -X POST https://api.applyforus.com/api/v1/orchestrator/circuits/reset-all

# Or restart services that have circuit breakers
kubectl rollout restart deployment/orchestrator-service -n applyforus
kubectl rollout restart deployment/auto-apply-service -n applyforus
```

---

## Escalation

### Level 1: On-Call Engineer
- Toggle rate limiting mode
- Reset circuit breakers
- Scale services
- Monitor metrics

### Level 2: Platform Team
- Redis infrastructure issues
- Kong configuration changes
- Circuit breaker tuning
- New rate limit policies

### Level 3: Security Team
- DoS attack response
- IP blocking decisions
- WAF rule changes
- Incident investigation

---

## Contacts

| Role | Contact |
|------|---------|
| On-Call | PagerDuty rotation |
| Platform Team | #platform-team Slack |
| Security Team | #security-incidents Slack |

---

## Related Documents
- [Incident Documentation](./incident-rate-limit-redis.md)
- [Gateway Reliability Report](../../GATEWAY_RELIABILITY_FIXES_REPORT.md)
- [Kong Configuration](../../infrastructure/kubernetes/api-gateway/kong-config.yaml)
