# Runbook: HighLatency Alert

## Alert Description
**Alert Name:** HighLatency
**Severity:** Warning
**Category:** Performance

This alert fires when a service's P95 latency exceeds 2 seconds over a 5-minute period.

## Symptoms
- Slow page loads
- API requests taking longer than expected
- User complaints about performance
- Timeouts on dependent services

## Impact
**User Impact:** Medium - Degraded user experience
**Business Impact:** Medium - User satisfaction and retention affected

## Diagnosis

### Step 1: Identify Slow Endpoints
```bash
# Check logs for slow requests
kubectl logs -l app=<service-name> -n jobpilot --tail=1000 | grep "slow"

# View latency metrics in Grafana
# Dashboard: Service Health Overview
# Panel: P95 Latency by Service
```

### Step 2: Check Resource Utilization
```bash
# CPU and memory usage
kubectl top pods -n jobpilot -l app=<service-name>

# Node resource usage
kubectl top nodes
```

### Step 3: Database Performance
```bash
# Check active database connections
# Go to Grafana -> Database Metrics dashboard

# Check for slow queries (if PostgreSQL)
kubectl exec -it <postgres-pod> -n jobpilot -- psql -U postgres -c "
  SELECT pid, now() - query_start as duration, query
  FROM pg_stat_activity
  WHERE state = 'active'
  ORDER BY duration DESC
  LIMIT 10;
"
```

### Step 4: External Dependencies
Check external API response times and timeouts.

## Resolution

### Quick Wins

#### 1. Scale Up Service
```bash
kubectl scale deployment/<service-name> --replicas=5 -n jobpilot
```

#### 2. Increase Resource Limits
```bash
kubectl set resources deployment/<service-name> \
  --limits=cpu=2000m,memory=2Gi \
  --requests=cpu=1000m,memory=1Gi \
  -n jobpilot
```

#### 3. Enable/Clear Cache
```bash
# Check Redis cache status
kubectl exec -it <redis-pod> -n jobpilot -- redis-cli INFO stats

# Clear cache if stale
kubectl exec -it <redis-pod> -n jobpilot -- redis-cli FLUSHDB
```

### Performance Optimization

#### Database Optimization
1. Add missing indexes
2. Optimize slow queries
3. Increase connection pool size
4. Enable query caching

#### Code Optimization
1. Reduce N+1 queries
2. Implement pagination
3. Add database query timeouts
4. Optimize data serialization

#### Caching Strategy
1. Cache frequently accessed data
2. Implement Redis caching
3. Use CDN for static assets
4. Enable HTTP caching headers

## Prevention

### Monitoring
- Set up latency alerts at different percentiles
- Monitor database query performance
- Track external API latencies

### Code Best Practices
- Implement connection pooling
- Use async/await properly
- Optimize database queries
- Add query result caching

### Load Testing
- Regular performance testing
- Stress testing before releases
- Capacity planning

## Escalation
- **Level 1:** On-call engineer
- **Level 2:** Performance team (if P95 > 5s)
- **Level 3:** Engineering manager (if P95 > 10s)

## Related Alerts
- HighErrorRate
- DatabaseHighConnections
- RedisHighMemory
