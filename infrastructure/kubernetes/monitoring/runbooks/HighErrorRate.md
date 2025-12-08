# Runbook: HighErrorRate Alert

## Alert Description
**Alert Name:** HighErrorRate
**Severity:** Warning
**Category:** Reliability

This alert fires when a service is experiencing more than 5% HTTP 5xx errors over a 5-minute period.

## Symptoms
- Increased 5xx error responses
- Users encountering server errors
- Failed API requests
- Degraded user experience

## Impact
**User Impact:** Medium to High - Some user requests are failing
**Business Impact:** Medium - Revenue and user satisfaction affected

## Diagnosis

### Step 1: Identify Error Patterns
```bash
# Check service logs for errors
kubectl logs -l app=<service-name> -n jobpilot --tail=500 | grep -i error

# Check error distribution in Grafana
# Navigate to: Service Health Overview dashboard
# Look at: "Error Rate by Service" panel
```

### Step 2: Analyze Error Types
Access Loki logs in Grafana:
```logql
{namespace="jobpilot", service="<service-name>"}
|= "error"
| json
| line_format "{{.level}} {{.message}}"
```

### Step 3: Check Recent Deployments
```bash
# Check recent deployment history
kubectl rollout history deployment/<service-name> -n jobpilot

# Check current image version
kubectl get deployment <service-name> -n jobpilot -o jsonpath='{.spec.template.spec.containers[0].image}'
```

### Step 4: Examine Dependencies
```bash
# Check database connectivity
kubectl exec -it <service-pod> -n jobpilot -- curl http://postgres-service:5432

# Check Redis connectivity
kubectl exec -it <service-pod> -n jobpilot -- redis-cli -h redis-service ping

# Check RabbitMQ status
kubectl exec -it <service-pod> -n jobpilot -- curl http://rabbitmq:15672/api/healthchecks/node
```

### Step 5: Review Metrics
Check in Grafana dashboards:
- Request rate changes
- Latency spikes
- Database query performance
- External API response times

## Resolution

### Common Error Scenarios

#### 1. Database Connection Errors
**Symptoms:** 502/503 errors, connection timeout messages

**Resolution:**
```bash
# Check database pod status
kubectl get pods -n jobpilot -l app=postgres

# Check connection pool metrics
# Go to Grafana -> Database Metrics dashboard
# Check "Connection Pool Usage" panel

# If pool is exhausted, temporarily increase pool size
# Update service ConfigMap with higher pool limits
kubectl edit configmap <service-name>-config -n jobpilot

# Restart service to apply changes
kubectl rollout restart deployment/<service-name> -n jobpilot
```

#### 2. External API Failures
**Symptoms:** 502/504 errors, timeout messages in logs

**Resolution:**
```bash
# Check external API status
curl -I https://external-api.com/health

# Enable circuit breaker if not already enabled
# Check service configuration for circuit breaker settings

# Implement fallback behavior
# Update application code to handle API failures gracefully
```

#### 3. Memory/Resource Issues
**Symptoms:** 503 errors, OOMKilled events

**Resolution:**
```bash
# Check resource usage
kubectl top pod <pod-name> -n jobpilot

# Check for OOMKilled events
kubectl get events -n jobpilot | grep OOMKilled

# Increase memory limits if needed
kubectl set resources deployment/<service-name> \
  --limits=memory=2Gi \
  --requests=memory=1Gi \
  -n jobpilot
```

#### 4. Invalid Request Data
**Symptoms:** 500 errors, validation errors in logs

**Resolution:**
```bash
# Check logs for validation errors
kubectl logs -l app=<service-name> -n jobpilot | grep -i validation

# Review recent API changes
# Check if input validation is properly implemented

# Add defensive programming
# Update code to handle edge cases
```

#### 5. Race Conditions/Concurrency Issues
**Symptoms:** Intermittent 500 errors, deadlock messages

**Resolution:**
```bash
# Check for deadlock messages in logs
kubectl logs -l app=<service-name> -n jobpilot | grep -i deadlock

# Review database transaction logs
# Check for long-running transactions

# Implement proper locking mechanisms
# Add transaction timeout settings
```

### Quick Mitigation

#### Rollback to Previous Version
```bash
# Rollback deployment
kubectl rollout undo deployment/<service-name> -n jobpilot

# Monitor error rate after rollback
# Check Grafana dashboard for improvement
```

#### Scale Up Service
```bash
# Increase replicas to distribute load
kubectl scale deployment/<service-name> --replicas=5 -n jobpilot
```

#### Enable Circuit Breaker
Update service configuration to enable circuit breaker for failing dependencies.

## Root Cause Analysis

### Investigation Steps

1. **Timeline Analysis**
   - When did errors start?
   - Any deployments around that time?
   - Any configuration changes?
   - Any infrastructure changes?

2. **Error Pattern Analysis**
   - What endpoints are affected?
   - What's the error distribution?
   - Are errors consistent or intermittent?
   - Any correlation with load?

3. **Dependency Analysis**
   - Which dependencies are involved?
   - Are there any cascade failures?
   - Are timeouts configured properly?

4. **Code Review**
   - Review recent code changes
   - Check for unhandled exceptions
   - Verify error handling logic

### Common Root Causes

1. **Unhandled Exceptions**
   - Missing try-catch blocks
   - Null pointer exceptions
   - Type conversion errors

2. **Database Issues**
   - Connection pool exhaustion
   - Slow queries
   - Lock contention
   - Schema changes

3. **External API Issues**
   - Rate limiting
   - Timeouts
   - Invalid responses
   - API changes

4. **Configuration Errors**
   - Wrong environment variables
   - Invalid credentials
   - Incorrect service URLs

5. **Resource Constraints**
   - Memory pressure
   - CPU throttling
   - Network bandwidth

## Prevention

### Code Quality
1. **Comprehensive Error Handling**
   ```typescript
   try {
     await externalAPI.call();
   } catch (error) {
     logger.error('API call failed', { error });
     // Return graceful fallback
     return fallbackResponse;
   }
   ```

2. **Input Validation**
   ```typescript
   @IsString()
   @IsNotEmpty()
   @MaxLength(255)
   fieldName: string;
   ```

3. **Timeout Configuration**
   ```typescript
   const response = await axios.get(url, {
     timeout: 5000, // 5 seconds
   });
   ```

### Infrastructure
1. **Circuit Breakers**
   - Implement circuit breaker pattern
   - Set appropriate thresholds
   - Define fallback behavior

2. **Retry Logic**
   - Add exponential backoff
   - Set maximum retry attempts
   - Log retry attempts

3. **Health Checks**
   - Comprehensive health endpoints
   - Include dependency checks
   - Return meaningful status

4. **Monitoring**
   - Set up alerts for error spikes
   - Monitor error patterns
   - Track error types

## Escalation

- **Level 1:** On-call engineer (immediate)
- **Level 2:** Service owner (if error rate > 10% or not improving in 15 minutes)
- **Level 3:** Engineering manager (if error rate > 20% or affecting multiple services)

## Related Alerts
- ServiceDown
- HighLatency
- DatabaseHighConnections
- ExternalAPIFailure

## Useful Queries

### Loki Queries
```logql
# All errors in the last hour
{namespace="jobpilot"} |= "error" | json | __error__=""

# Errors by service
sum by (service) (count_over_time({namespace="jobpilot"} |= "error" [5m]))

# Top error messages
{namespace="jobpilot"} |= "error" | json | line_format "{{.message}}" | count_over_time[1h]
```

### Prometheus Queries
```promql
# Error rate by service
rate(http_requests_total{status=~"5..", namespace="jobpilot"}[5m])

# Error percentage
(
  sum(rate(http_requests_total{status=~"5..", namespace="jobpilot"}[5m])) by (service)
  /
  sum(rate(http_requests_total{namespace="jobpilot"}[5m])) by (service)
) * 100
```

## Additional Resources
- [Error Handling Best Practices](../../docs/development/error-handling.md)
- [API Documentation](../../docs/api/README.md)
- [Logging Guidelines](../../LOGGING_IMPLEMENTATION_SUMMARY.md)

## Recent Incidents
<!-- Log incidents here for reference -->
- None
