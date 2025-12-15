# Gateway Reliability Fixes - Deployment Guide

**Objective:** Deploy all gateway reliability fixes to eliminate timeouts while maintaining zero downtime.

---

## Pre-Deployment Checklist

### Environment Verification
- [ ] Azure Redis Cache is running and accessible
  ```bash
  # Test Redis connectivity
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls PING
  # Expected: PONG
  ```

- [ ] Redis password is in Key Vault
  ```bash
  # Verify secret exists
  az keyvault secret show --name redis-password --vault-name applyforus-keyvault
  ```

- [ ] Current Kong version supports Redis rate limiting
  ```bash
  kubectl exec -it deployment/kong -n kong -- kong version
  # Should be 3.0+
  ```

### Backup Current Configuration
```bash
# Backup Kong config
kubectl get configmap kong-config -n kong -o yaml > kong-config-backup.yaml

# Backup circuit breaker configs
git stash push -m "Pre-reliability-fixes backup"
```

---

## Deployment Order

### Phase 1: Infrastructure (Kong Gateway)
**Duration:** 5 minutes
**Rollback time:** 2 minutes

1. **Update Kong ConfigMap**
   ```bash
   # Apply updated Kong configuration
   kubectl apply -f infrastructure/kubernetes/api-gateway/kong-config.yaml
   ```

2. **Reload Kong**
   ```bash
   # Graceful reload (zero downtime)
   kubectl exec -it deployment/kong -n kong -- kong reload
   ```

3. **Verify Rate Limiting**
   ```bash
   # Test rate limiting is working
   for i in {1..5}; do
     curl -w "%{http_code}\n" https://api.applyforus.com/health
   done

   # Check for rate limit headers
   curl -I https://api.applyforus.com/api/v1/jobs | grep X-RateLimit
   ```

4. **Check Kong Logs**
   ```bash
   kubectl logs deployment/kong -n kong --tail=50
   # Look for Redis connection messages
   # Should NOT see errors
   ```

### Phase 2: Shared Packages
**Duration:** 10 minutes
**Rollback time:** 5 minutes

1. **Build Shared Package**
   ```bash
   cd packages/shared
   pnpm build
   ```

2. **Verify Exports**
   ```bash
   # Check RedisHealthIndicator is exported
   cat dist/index.d.ts | grep RedisHealthIndicator
   ```

### Phase 3: Service Updates
**Duration:** 15 minutes per service
**Rollback time:** 10 minutes per service

Deploy services in this order (least critical first):

1. Analytics Service
2. Notification Service
3. Resume Service
4. Job Service
5. User Service
6. Auth Service
7. Auto-Apply Service
8. Orchestrator Service

**For each service:**

```bash
# Example for auto-apply-service
cd services/auto-apply-service

# Build
pnpm build

# Build Docker image
docker build -t applyforus.azurecr.io/auto-apply-service:v2.1-reliability .

# Push to registry
docker push applyforus.azurecr.io/auto-apply-service:v2.1-reliability

# Update Kubernetes deployment
kubectl set image deployment/auto-apply-service \
  auto-apply-service=applyforus.azurecr.io/auto-apply-service:v2.1-reliability

# Wait for rollout
kubectl rollout status deployment/auto-apply-service

# Verify health
curl https://api.applyforus.com/health/auto-apply
```

---

## Deployment Commands (Copy-Paste Ready)

### Deploy All at Once (Staging Only)
```bash
#!/bin/bash
set -e

echo "🚀 Deploying Gateway Reliability Fixes..."

# Phase 1: Kong
echo "📡 Updating Kong API Gateway..."
kubectl apply -f infrastructure/kubernetes/api-gateway/kong-config.yaml
kubectl exec -it deployment/kong -n kong -- kong reload
sleep 5

# Phase 2: Shared Package
echo "📦 Building shared package..."
cd packages/shared && pnpm build && cd ../..

# Phase 3: Services
SERVICES=(
  "analytics-service"
  "notification-service"
  "resume-service"
  "job-service"
  "user-service"
  "auth-service"
  "auto-apply-service"
  "orchestrator-service"
)

for service in "${SERVICES[@]}"; do
  echo "🔧 Deploying $service..."
  cd services/$service
  pnpm build
  docker build -t applyforus.azurecr.io/$service:v2.1-reliability .
  docker push applyforus.azurecr.io/$service:v2.1-reliability
  kubectl set image deployment/$service \
    $service=applyforus.azurecr.io/$service:v2.1-reliability
  kubectl rollout status deployment/$service
  cd ../..
  echo "✅ $service deployed"
done

echo "🎉 All services deployed successfully!"
```

### Deploy Production (Blue-Green)
```bash
#!/bin/bash
set -e

echo "🚀 Production Deployment (Blue-Green)..."

# 1. Deploy to green environment
kubectl apply -f infrastructure/kubernetes/api-gateway/kong-config.yaml \
  --namespace=production-green

# 2. Wait for services to be healthy
for service in auto-apply auth user job; do
  kubectl wait --for=condition=ready pod \
    -l app=$service-service \
    -n production-green \
    --timeout=300s
done

# 3. Run smoke tests
./scripts/smoke-tests.sh production-green

# 4. Switch traffic
kubectl patch service kong-proxy -n production \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 5. Monitor for 10 minutes
echo "⏳ Monitoring green environment for 10 minutes..."
sleep 600

# 6. Verify metrics
curl https://api.applyforus.com/metrics | grep gateway_timeout_total
# Should be 0

echo "✅ Production deployment complete!"
```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# All services should report healthy
curl https://api.applyforus.com/health/readiness

# Redis should show as connected
curl https://api.applyforus.com/health/redis
```

### 2. Rate Limiting
```bash
# Test distributed rate limiting
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://api.applyforus.com/api/v1/jobs
done

# Should see consistent rate limits across requests
```

### 3. Circuit Breakers
```bash
# Check circuit breaker status
curl https://api.applyforus.com/orchestrator/circuit-breaker/status

# All should be CLOSED
```

### 4. Fail-Open Test (Staging Only)
```bash
# Temporarily stop Redis
kubectl scale statefulset redis --replicas=0 -n default

# Services should continue working
curl https://api.applyforus.com/health/readiness
# Expected: "degraded" status but operational

# Verify logs show fail-open activation
kubectl logs deployment/auto-apply-service | grep "fail-open"

# Restart Redis
kubectl scale statefulset redis --replicas=1 -n default
```

### 5. Load Test
```bash
# Run load test
ab -n 10000 -c 100 https://api.applyforus.com/api/v1/jobs

# Check results
# - 0% failed requests
# - 0 timeouts
# - Requests/sec should be consistent
```

---

## Monitoring During Deployment

### Grafana Dashboards to Watch
1. **Gateway Overview**
   - Request rate
   - Error rate
   - Timeout rate (should be 0)

2. **Redis Metrics**
   - Connection count
   - Command latency
   - Memory usage

3. **Circuit Breaker Status**
   - Open/closed states per service
   - Trip rate
   - Fallback activations

4. **Service Health**
   - Response times (p50, p95, p99)
   - Error rates
   - Availability

### Key Metrics
```bash
# Gateway timeouts (should be 0)
curl -s https://api.applyforus.com/metrics | grep gateway_timeout_total

# Redis connection status
curl -s https://api.applyforus.com/metrics | grep redis_connected_clients

# Circuit breaker trips
curl -s https://api.applyforus.com/metrics | grep circuit_breaker_open_total

# Rate limit hits
curl -s https://api.applyforus.com/metrics | grep rate_limit_exceeded_total
```

---

## Rollback Procedures

### Quick Rollback (Kong Only)
```bash
# Restore previous Kong config
kubectl apply -f kong-config-backup.yaml

# Reload Kong
kubectl exec -it deployment/kong -n kong -- kong reload

# Verify
curl -I https://api.applyforus.com/api/v1/jobs
```

### Service Rollback
```bash
# Rollback individual service
kubectl rollout undo deployment/auto-apply-service

# Rollback all services
for service in auto-apply auth user job orchestrator; do
  kubectl rollout undo deployment/$service-service
done
```

### Full Rollback (Blue-Green)
```bash
# Switch traffic back to blue
kubectl patch service kong-proxy -n production \
  -p '{"spec":{"selector":{"version":"blue"}}}'

# Verify
curl https://api.applyforus.com/health
```

---

## Troubleshooting

### Issue: Kong not connecting to Redis
**Symptoms:** Rate limiting not working, Kong logs show Redis errors

**Solution:**
```bash
# Check Redis connectivity from Kong pod
kubectl exec -it deployment/kong -n kong -- \
  redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls PING

# Verify Redis password secret
kubectl get secret redis-secret -o jsonpath='{.data.password}' | base64 -d

# Check Kong config
kubectl describe configmap kong-config -n kong
```

### Issue: Services not using fail-open
**Symptoms:** Services crash when Redis unavailable

**Solution:**
```bash
# Check service logs for fail-open messages
kubectl logs deployment/auto-apply-service | grep "fail-open"

# Verify Redis error handling
kubectl logs deployment/auto-apply-service | grep "Redis.*error"

# Should see warnings, not errors
```

### Issue: Circuit breakers tripping
**Symptoms:** Services returning 503, circuit breaker open

**Solution:**
```bash
# Check circuit breaker status
curl https://api.applyforus.com/orchestrator/circuit-breaker/status

# Reset if needed
curl -X POST https://api.applyforus.com/orchestrator/circuit-breaker/reset

# Verify timeout settings (should be 60s)
kubectl logs deployment/orchestrator-service | grep timeout
```

### Issue: High latency after deployment
**Symptoms:** Response times increased

**Solution:**
```bash
# Check Redis latency
redis-cli -h applyforus-redis.redis.cache.windows.net -p 6380 --tls \
  --latency

# Verify circuit breaker settings
# Timeout should be 60s, not causing premature trips

# Check connection pool
kubectl logs deployment/auto-apply-service | grep "connection pool"
```

---

## Success Criteria

Before marking deployment as complete:

- [ ] All services reporting healthy
- [ ] Redis connected and responding
- [ ] Gateway timeout rate = 0%
- [ ] Circuit breakers in CLOSED state
- [ ] Rate limiting working consistently
- [ ] Fail-open tested and working
- [ ] Load test passed (10k requests, 0 timeouts)
- [ ] Metrics dashboard showing green
- [ ] No errors in service logs
- [ ] Rollback plan tested

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor gateway timeout metrics every hour
- [ ] Check Redis connection status every 2 hours
- [ ] Review service logs for fail-open activations
- [ ] Verify circuit breaker trip rates < 1%

### Week 1
- [ ] Run daily load tests
- [ ] Monitor Redis memory usage
- [ ] Review circuit breaker statistics
- [ ] Analyze rate limit hit patterns

### Month 1
- [ ] Full performance audit
- [ ] Review fail-open activation frequency
- [ ] Optimize Redis connection pools
- [ ] Update documentation with learnings

---

## Emergency Contacts

| Issue | Team | Contact |
|-------|------|---------|
| Gateway timeouts | Platform Team | platform@applyforus.com |
| Redis connectivity | Infrastructure | infra@applyforus.com |
| Service failures | On-call Engineer | oncall@applyforus.com |
| Performance issues | SRE Team | sre@applyforus.com |

---

## Final Checklist

- [ ] All pre-deployment checks completed
- [ ] Kong configuration deployed
- [ ] All services updated
- [ ] Post-deployment verification passed
- [ ] Monitoring dashboards configured
- [ ] Rollback plan documented and tested
- [ ] Team notified of deployment
- [ ] Documentation updated

---

**Status:** Ready for deployment
**Estimated Time:** 2 hours (staging), 4 hours (production)
**Risk Level:** Low (fail-open patterns ensure safety)

**Next:** Deploy to staging environment
