# Alert Runbooks - JobPilot AI Platform

This directory contains runbooks for responding to alerts from the JobPilot monitoring system. Each runbook provides step-by-step guidance for diagnosing and resolving specific alert conditions.

## Quick Reference

All runbooks follow a standard format:
1. **Alert Description** - What triggered the alert
2. **Impact** - How this affects users and the system
3. **Diagnosis** - How to investigate the issue
4. **Resolution** - Steps to fix the problem
5. **Prevention** - How to prevent recurrence

## Runbook Index

### Service Health Alerts

#### [ServiceDown](./ServiceDown.md)
**Severity:** Critical
**Description:** A microservice is completely unavailable
**Impact:** Users cannot access affected functionality
**First Steps:**
- Check pod status: `kubectl get pods -n jobpilot -l app=<service-name>`
- View pod logs: `kubectl logs -n jobpilot <pod-name> --tail=100`
- Check recent events: `kubectl get events -n jobpilot --sort-by='.lastTimestamp'`

#### [HighErrorRate](./HighErrorRate.md)
**Severity:** Warning
**Description:** Service is returning >5% 5xx errors
**Impact:** Degraded user experience, failed requests
**First Steps:**
- Check error logs in Grafana dashboard
- Identify error patterns in Loki
- Review recent deployments or changes
- Check dependency service health

#### [HighLatency](./HighLatency.md)
**Severity:** Warning
**Description:** Service P95 latency exceeds 2 seconds
**Impact:** Slow response times, poor user experience
**First Steps:**
- Check service resource usage (CPU, memory)
- Review database query performance
- Check external API latency
- Investigate recent traffic patterns

#### [ServiceHighMemory](./ServiceHighMemory.md)
**Severity:** Warning
**Description:** Container using >85% of memory limit
**Impact:** Risk of OOM kills, service instability
**First Steps:**
- Check for memory leaks in application logs
- Review recent traffic increases
- Analyze heap dumps if available
- Consider increasing memory limits

#### [ServiceHighCPU](./ServiceHighCPU.md)
**Severity:** Warning
**Description:** Container using >85% of CPU limit
**Impact:** Slow response times, request queuing
**First Steps:**
- Check recent traffic patterns
- Review CPU-intensive operations in code
- Look for inefficient algorithms or loops
- Consider horizontal scaling

---

### Infrastructure Alerts

#### [PodCrashLooping](./PodCrashLooping.md)
**Severity:** Warning
**Description:** Pod is repeatedly crashing and restarting
**Impact:** Service unavailability or degraded performance
**First Steps:**
- Check pod logs: `kubectl logs -n jobpilot <pod-name> --previous`
- Describe pod: `kubectl describe pod -n jobpilot <pod-name>`
- Check image pull status
- Verify configuration and secrets

#### [PodNotReady](./PodNotReady.md)
**Severity:** Warning
**Description:** Pod has been in non-ready state for 5+ minutes
**Impact:** Reduced service capacity
**First Steps:**
- Check readiness probe configuration
- Review pod logs for startup errors
- Verify dependencies (database, cache) are available
- Check resource constraints

#### [DeploymentReplicaMismatch](./DeploymentReplicaMismatch.md)
**Severity:** Warning
**Description:** Deployment has fewer available replicas than desired
**Impact:** Reduced redundancy and capacity
**First Steps:**
- Check deployment status: `kubectl get deployment -n jobpilot <deployment-name>`
- Review ReplicaSet events
- Check node capacity
- Verify image availability

#### [PVCNearlyFull](./PVCNearlyFull.md)
**Severity:** Warning
**Description:** Persistent volume is >90% full
**Impact:** Risk of disk full errors, data loss
**First Steps:**
- Identify what's consuming space
- Clean up old logs or temporary files
- Consider expanding PVC
- Implement retention policies

#### [NodeNotReady](./NodeNotReady.md)
**Severity:** Critical
**Description:** Kubernetes node is not ready
**Impact:** Reduced cluster capacity, pod evictions
**First Steps:**
- Check node conditions: `kubectl describe node <node-name>`
- SSH to node and check system logs
- Verify kubelet is running
- Check disk, memory, and CPU pressure

---

### Database Alerts

#### [PostgresDown](./PostgresDown.md)
**Severity:** Critical
**Description:** PostgreSQL database is unreachable
**Impact:** Complete service outage for data-dependent services
**First Steps:**
- Check pod status: `kubectl get pods -n jobpilot -l app=postgres`
- Review PostgreSQL logs
- Verify network connectivity
- Check storage availability

#### [PostgresHighConnections](./PostgresHighConnections.md)
**Severity:** Warning
**Description:** PostgreSQL using >80% of max connections
**Impact:** Risk of connection exhaustion, new connection failures
**First Steps:**
- Identify connection sources: `SELECT * FROM pg_stat_activity`
- Look for connection leaks in applications
- Review connection pool configuration
- Consider increasing max_connections

#### [PostgresReplicationLag](./PostgresReplicationLag.md)
**Severity:** Warning
**Description:** Replication lag exceeds 30 seconds
**Impact:** Stale data on replicas, potential data loss on failover
**First Steps:**
- Check replication status
- Review WAL shipping logs
- Verify network between primary and replicas
- Check disk I/O on replica

#### [RedisDown](./RedisDown.md)
**Severity:** Critical
**Description:** Redis cache is unavailable
**Impact:** Degraded performance, increased database load
**First Steps:**
- Check Redis pod status
- Review Redis logs for errors
- Verify storage availability
- Check memory limits

#### [RedisHighMemory](./RedisHighMemory.md)
**Severity:** Warning
**Description:** Redis using >90% of maximum memory
**Impact:** Key evictions, cache misses, potential OOM
**First Steps:**
- Check keyspace size and patterns
- Review eviction policy
- Identify large keys
- Consider increasing memory or adding nodes

---

### Message Queue Alerts

#### [RabbitMQDown](./RabbitMQDown.md)
**Severity:** Critical
**Description:** RabbitMQ message broker is unavailable
**Impact:** Message processing stopped, notifications delayed
**First Steps:**
- Check RabbitMQ pod status
- Review RabbitMQ logs
- Verify Erlang VM is running
- Check cluster status if applicable

#### [RabbitMQHighQueue](./RabbitMQHighQueue.md)
**Severity:** Warning
**Description:** Queue has >10,000 messages pending
**Impact:** Message processing delays, memory pressure
**First Steps:**
- Check consumer health and count
- Review consumer processing rate
- Look for errors in consumer logs
- Consider scaling consumers

#### [RabbitMQConsumerDown](./RabbitMQConsumerDown.md)
**Severity:** Critical
**Description:** Queue has no active consumers
**Impact:** Messages not being processed
**First Steps:**
- Check consumer service status
- Review consumer application logs
- Verify queue bindings
- Restart consumer service if needed

---

### Business Metrics Alerts

#### [LowApplicationSuccessRate](./LowApplicationSuccessRate.md)
**Severity:** Warning
**Description:** Job application success rate below 70%
**Impact:** Poor user experience, platform reputation
**First Steps:**
- Review auto-apply service logs
- Check third-party job board API status
- Analyze failure reasons
- Review rate limiting issues

#### [AIServiceRateLimited](./AIServiceRateLimited.md)
**Severity:** Warning
**Description:** AI service experiencing >10 rate-limited requests/min
**Impact:** Degraded AI features, user frustration
**First Steps:**
- Check OpenAI/AI provider API status
- Review API quota usage
- Implement request queuing
- Consider upgrading API tier

#### [HighUserChurnRate](./HighUserChurnRate.md)
**Severity:** Warning
**Description:** Daily user churn exceeds 10%
**Impact:** Revenue loss, growth concerns
**First Steps:**
- Analyze churn cohorts and patterns
- Review recent product changes
- Check for service issues affecting UX
- Gather user feedback

#### [PaymentFailureRate](./PaymentFailureRate.md)
**Severity:** Critical
**Description:** Payment failures exceed 5%
**Impact:** Direct revenue loss, user frustration
**First Steps:**
- Check payment gateway status
- Review payment processor logs
- Verify API credentials are valid
- Check for card validation issues

---

## Runbook Template

When creating a new runbook, use this template:

```markdown
# Alert Name

## Overview
**Severity:** [Critical/Warning]
**Category:** [Service Health/Infrastructure/Database/etc.]
**Team:** [Platform/Product/etc.]

## Description
Brief description of what triggers this alert and what it means.

## Impact
Description of how this alert affects users, services, and the business.

## Symptoms
- What users might experience
- What metrics show the problem
- Related alerts that might fire

## Diagnosis

### Quick Checks
1. First thing to check
2. Second thing to check
3. Third thing to check

### Detailed Investigation
Step-by-step guide to diagnose the root cause:

1. **Check service health**
   ```bash
   kubectl get pods -n jobpilot -l app=<service>
   ```

2. **Review logs**
   ```bash
   kubectl logs -n jobpilot <pod-name> --tail=100
   ```

3. **Check metrics**
   - Link to relevant Grafana dashboard
   - Key metrics to examine

## Resolution

### Immediate Actions
Steps to mitigate the immediate impact:

1. Action 1
2. Action 2
3. Action 3

### Long-term Fix
Steps to permanently resolve the issue:

1. Fix 1
2. Fix 2
3. Fix 3

## Prevention

### Configuration Changes
- Settings to adjust
- Limits to increase
- Policies to implement

### Code Changes
- Bugs to fix
- Improvements to make
- Tests to add

### Monitoring Improvements
- Additional alerts to create
- Dashboard enhancements
- SLIs/SLOs to define

## Related Alerts
- Related Alert 1
- Related Alert 2

## References
- [Grafana Dashboard](https://grafana.jobpilot.com/d/dashboard-id)
- [Service Documentation](../../../docs/services/service-name.md)
- [Architecture Diagram](../../../docs/architecture.md)

## Contact
**Primary:** Platform Team (#platform-team)
**Secondary:** On-call Engineer (PagerDuty)
**Escalation:** VP Engineering
```

---

## Contributing

When adding or updating runbooks:

1. **Use the template above** for consistency
2. **Include real examples** from actual incidents
3. **Add kubectl commands** with actual namespaces and labels
4. **Link to dashboards** and relevant documentation
5. **Keep it actionable** - focus on what to do, not just theory
6. **Update regularly** based on postmortem learnings

## Incident Response Process

### 1. Acknowledge
- Acknowledge the alert in PagerDuty
- Post in #incidents Slack channel
- Assign an incident commander if critical

### 2. Investigate
- Follow the relevant runbook
- Gather diagnostic information
- Identify root cause

### 3. Mitigate
- Apply immediate fixes to restore service
- Document actions taken
- Monitor for resolution

### 4. Resolve
- Verify the issue is resolved
- Clear the alert
- Update stakeholders

### 5. Follow Up
- Conduct postmortem for critical incidents
- Update runbooks with learnings
- Implement preventive measures
- Track action items

## Escalation Paths

### L1 - On-call Engineer
First responder, follows runbooks, handles common issues

### L2 - Senior Engineer
Complex issues, requires deep system knowledge

### L3 - Service Owner
Service-specific expertise, architectural decisions

### L4 - Engineering Leadership
Critical incidents, business impact, executive escalation

## Useful Commands

### Kubernetes
```bash
# Get pod status
kubectl get pods -n jobpilot

# View pod logs
kubectl logs -n jobpilot <pod-name> --tail=100 --follow

# Get pod details
kubectl describe pod -n jobpilot <pod-name>

# Check events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Execute command in pod
kubectl exec -it -n jobpilot <pod-name> -- /bin/bash

# Port forward for debugging
kubectl port-forward -n jobpilot <pod-name> 8080:8080
```

### Prometheus
```bash
# Query Prometheus
curl -G 'http://prometheus:9090/api/v1/query' --data-urlencode 'query=up{namespace="jobpilot"}'

# Check alert status
curl http://prometheus:9090/api/v1/alerts
```

### Database
```bash
# Connect to PostgreSQL
kubectl exec -it -n jobpilot <postgres-pod> -- psql -U postgres

# Check connections
SELECT * FROM pg_stat_activity;

# Check database size
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) AS size FROM pg_database;
```

### Redis
```bash
# Connect to Redis
kubectl exec -it -n jobpilot <redis-pod> -- redis-cli

# Check memory usage
INFO memory

# Get keyspace info
INFO keyspace
```

## Additional Resources

- [JobPilot Architecture](../../../docs/architecture.md)
- [Monitoring Dashboard](https://grafana.jobpilot.com)
- [AlertManager UI](https://alertmanager.jobpilot.com)
- [Incident Response Guide](../../../docs/incident-response.md)
- [Postmortem Template](../../../docs/postmortem-template.md)

---

**Last Updated:** 2025-12-07
**Maintained By:** Platform Team
**Review Cycle:** Quarterly
