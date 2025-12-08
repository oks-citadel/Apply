# Runbook: PostgresDown Alert

## Alert Description
**Alert Name:** PostgresDown
**Severity:** Critical
**Category:** Database

PostgreSQL database is down or unreachable.

## Symptoms
- Services cannot connect to database
- Application errors mentioning database connection
- User-facing features unavailable

## Impact
**User Impact:** Critical - Most platform features unavailable
**Business Impact:** Critical - Complete platform outage

## Diagnosis

```bash
# Check PostgreSQL pod status
kubectl get pods -n jobpilot -l app=postgres

# Check logs
kubectl logs <postgres-pod> -n jobpilot --tail=100

# Check events
kubectl get events -n jobpilot | grep postgres
```

## Resolution

### Restart PostgreSQL
```bash
kubectl rollout restart statefulset/postgres -n jobpilot
```

### Check Persistent Volume
```bash
# Verify PVC
kubectl get pvc -n jobpilot | grep postgres

# Check disk space
kubectl exec -it <postgres-pod> -n jobpilot -- df -h
```

### Restore from Backup (if needed)
```bash
# List available backups
# Restore from latest backup following backup/restore procedures
```

## Prevention
- Regular backups
- Monitoring disk space
- Database replication
- Failover configuration

## Escalation
- **Critical:** Immediate escalation to database team
- **P0 Incident:** Engage incident response team
