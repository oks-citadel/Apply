# ApplyForUs Disaster Recovery Plan

## Document Information

| Property | Value |
|----------|-------|
| Version | 1.0 |
| Last Updated | 2024-12-24 |
| Owner | Platform Engineering |
| Review Frequency | Quarterly |

## Recovery Objectives

### Service Level Targets

| Service Tier | RTO | RPO | Services |
|-------------|-----|-----|----------|
| Tier 1 (Critical) | 5 min | 1 min | auth-service, payment-service |
| Tier 2 (High) | 15 min | 5 min | web, job-service, user-service |
| Tier 3 (Medium) | 1 hour | 15 min | resume-service, notification-service |
| Tier 4 (Low) | 4 hours | 1 hour | analytics-service, auto-apply-service |

### Definitions

- **RTO (Recovery Time Objective)**: Maximum acceptable downtime
- **RPO (Recovery Point Objective)**: Maximum acceptable data loss

## Disaster Scenarios

### Scenario 1: Single Service Failure

**Symptoms**: Single service unavailable, other services operational

**Recovery Steps**:
1. Identify failing service
   ```bash
   kubectl get pods -n applyforus | grep -v Running
   ```

2. Check pod logs
   ```bash
   kubectl logs -l app.kubernetes.io/name=<service> -n applyforus --tail=100
   ```

3. Restart service
   ```bash
   kubectl rollout restart deployment/<service> -n applyforus
   ```

4. If restart fails, rollback
   ```bash
   kubectl rollout undo deployment/<service> -n applyforus
   ```

**Estimated Recovery Time**: 5-15 minutes

### Scenario 2: Database Failure

**Symptoms**: Database connection errors across multiple services

**PostgreSQL Recovery**:

1. Check PostgreSQL status
   ```bash
   kubectl get pods -n applyforus | grep postgresql
   kubectl describe pod postgresql-0 -n applyforus
   ```

2. If primary is down, Bitnami will auto-failover. Verify:
   ```bash
   kubectl exec postgresql-0 -n applyforus -- \
     psql -c "SELECT pg_is_in_recovery();"
   ```

3. If both replicas are down:
   ```bash
   # Delete PVCs and let them recreate from backup
   kubectl delete pvc data-postgresql-0 -n applyforus
   kubectl delete pvc data-postgresql-1 -n applyforus

   # Restore from Azure backup
   az postgres flexible-server restore \
     --source-server applyforus-postgres \
     --name applyforus-postgres-restored \
     --restore-point-in-time "2024-01-01T00:00:00Z"
   ```

**Redis Recovery**:

1. Check Redis Sentinel
   ```bash
   kubectl exec redis-node-0 -n applyforus -- \
     redis-cli -p 26379 SENTINEL masters
   ```

2. If all nodes down, recreate:
   ```bash
   helm uninstall redis -n applyforus
   helm install redis bitnami/redis -n applyforus \
     --values infrastructure/helm/redis/values.yaml
   ```

**Estimated Recovery Time**: 15-60 minutes

### Scenario 3: Complete Cluster Failure

**Symptoms**: Entire AKS cluster unavailable

**Recovery Steps**:

1. **Assess the situation**
   ```bash
   az aks show --name applyforus-aks --resource-group applyforus-prod-rg
   ```

2. **If cluster recoverable**, wait for Azure auto-heal

3. **If cluster unrecoverable**, deploy to DR region:
   ```bash
   # Switch to DR region configuration
   export TF_VAR_location="westus2"
   export TF_VAR_resource_group_name="applyforus-dr-rg"

   # Deploy infrastructure
   cd infrastructure/terraform
   terraform workspace select dr
   terraform apply -auto-approve

   # Deploy applications
   ./scripts/deploy/aks-deploy.sh -e prod all
   ```

4. **Update DNS** to point to new cluster IP
   ```bash
   # Get new ingress IP
   INGRESS_IP=$(kubectl get svc ingress-nginx-controller -n ingress-nginx \
     -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

   # Update Azure DNS
   az network dns record-set a update \
     --resource-group dns-rg \
     --zone-name applyforus.com \
     --name "@" \
     --set aRecords[0].ipv4Address=$INGRESS_IP
   ```

**Estimated Recovery Time**: 1-4 hours

### Scenario 4: Data Corruption

**Symptoms**: Application returning incorrect/corrupted data

**Recovery Steps**:

1. **Identify corruption scope**
   ```bash
   # Check recent database changes
   kubectl exec postgresql-0 -n applyforus -- \
     psql -c "SELECT * FROM pg_stat_user_tables;"
   ```

2. **Stop affected services** to prevent further corruption
   ```bash
   kubectl scale deployment <affected-service> --replicas=0 -n applyforus
   ```

3. **Point-in-time restore**
   ```bash
   # Identify restore point (before corruption)
   RESTORE_TIME="2024-01-01T12:00:00Z"

   # Create new database from backup
   az postgres flexible-server restore \
     --source-server applyforus-postgres \
     --name applyforus-postgres-pit \
     --restore-point-in-time $RESTORE_TIME

   # Export corrected data
   pg_dump -h applyforus-postgres-pit.postgres.database.azure.com \
     -U applyforusadmin -d applyforus > corrected-data.sql

   # Import to production (after verification)
   psql -h applyforus-postgres.postgres.database.azure.com \
     -U applyforusadmin -d applyforus < corrected-data.sql
   ```

4. **Restart services**
   ```bash
   kubectl scale deployment <affected-service> --replicas=3 -n applyforus
   ```

**Estimated Recovery Time**: 2-6 hours

### Scenario 5: Security Breach

**Symptoms**: Suspected unauthorized access or data breach

**Immediate Actions**:

1. **Isolate affected components**
   ```bash
   # Apply emergency network policy
   kubectl apply -f - <<EOF
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: emergency-lockdown
     namespace: applyforus
   spec:
     podSelector: {}
     policyTypes:
     - Ingress
     - Egress
   EOF
   ```

2. **Rotate all secrets**
   ```bash
   # Rotate Key Vault secrets
   az keyvault secret set --vault-name applyforus-kv \
     --name database-password --value "$(openssl rand -base64 32)"

   # Force secret sync
   kubectl annotate externalsecrets --all \
     force-sync=$(date +%s) -n applyforus

   # Restart all pods
   kubectl rollout restart deployment -n applyforus
   ```

3. **Enable enhanced logging**
   ```bash
   # Enable audit logging
   az aks update --name applyforus-aks \
     --resource-group applyforus-prod-rg \
     --enable-azure-monitor-metrics
   ```

4. **Preserve evidence**
   ```bash
   # Export all logs
   kubectl logs --all-containers -n applyforus > forensics-logs.txt
   kubectl get events -n applyforus > forensics-events.txt

   # Export network flows (if enabled)
   az network watcher flow-log show \
     --name aks-flow-logs \
     --resource-group applyforus-prod-rg
   ```

**Estimated Recovery Time**: Depends on breach scope

## Backup Procedures

### Automated Backups

| Component | Backup Type | Frequency | Retention |
|-----------|-------------|-----------|-----------|
| PostgreSQL | WAL + Full | Continuous + Daily | 35 days |
| Redis | RDB Snapshot | Every 15 min | 7 days |
| CosmosDB | Automatic | Continuous | 30 days |
| AKS Config | Velero | Daily | 30 days |
| Terraform State | Azure Blob | On change | 90 days |

### Manual Backup Procedure

```bash
# PostgreSQL backup
kubectl exec postgresql-0 -n applyforus -- \
  pg_dumpall -U applyforusadmin > full-backup-$(date +%Y%m%d).sql

# Upload to Azure Blob
az storage blob upload \
  --account-name applyforusbackups \
  --container-name postgres-backups \
  --file full-backup-$(date +%Y%m%d).sql \
  --name full-backup-$(date +%Y%m%d).sql

# Kubernetes resources backup
velero backup create manual-backup-$(date +%Y%m%d) \
  --include-namespaces applyforus
```

### Backup Verification

Run monthly:

```bash
# Create test namespace
kubectl create namespace backup-test

# Restore from backup
velero restore create test-restore \
  --from-backup latest-daily \
  --namespace-mappings applyforus:backup-test

# Verify data integrity
kubectl exec postgresql-0 -n backup-test -- \
  psql -c "SELECT COUNT(*) FROM users;"

# Cleanup
kubectl delete namespace backup-test
```

## Recovery Runbooks

### Application Rollback

```bash
# Option 1: Helm rollback
helm rollback applyforus -n applyforus

# Option 2: Rollback to specific revision
helm history applyforus -n applyforus
helm rollback applyforus <revision> -n applyforus

# Option 3: Deploy specific version
helm upgrade applyforus ./infrastructure/helm/app \
  --set global.image.tag=v1.2.3 \
  -n applyforus
```

### Region Failover

```bash
# 1. Verify DR region is ready
az aks show --name applyforus-dr-aks --resource-group applyforus-dr-rg

# 2. Update Traffic Manager priority
az network traffic-manager endpoint update \
  --resource-group traffic-rg \
  --profile-name applyforus-tm \
  --name primary \
  --priority 2

az network traffic-manager endpoint update \
  --resource-group traffic-rg \
  --profile-name applyforus-tm \
  --name secondary \
  --priority 1

# 3. Verify DNS propagation
dig applyforus.com

# 4. Monitor DR region
kubectl get pods -n applyforus --context=dr-cluster
```

## Testing Schedule

| Test Type | Frequency | Last Tested | Next Test |
|-----------|-----------|-------------|-----------|
| Backup Restoration | Monthly | - | - |
| Service Failover | Quarterly | - | - |
| Full DR Drill | Annually | - | - |
| Runbook Review | Quarterly | - | - |

## Communication Plan

### Escalation Matrix

| Severity | Response Time | Notification |
|----------|---------------|--------------|
| P1 | Immediate | Phone + Slack + Email |
| P2 | 15 minutes | Slack + Email |
| P3 | 1 hour | Email |

### Status Page Updates

Update status.applyforus.com with:
1. Incident detected
2. Investigation in progress
3. Fix identified
4. Fix deployed
5. Monitoring
6. Resolved

### Communication Templates

**Initial Notification**:
```
[INCIDENT] ApplyForUs experiencing [ISSUE SUMMARY]

We are aware of issues affecting [SERVICES].
Our team is actively investigating.

Started: [TIME]
Impact: [DESCRIPTION]
Updates: status.applyforus.com
```

**Resolution Notification**:
```
[RESOLVED] ApplyForUs [ISSUE] resolved

The issue affecting [SERVICES] has been resolved.

Duration: [TIME]
Root Cause: [SUMMARY]
Prevention: [ACTIONS]
```

## Post-Incident Review

After every P1/P2 incident:

1. **Timeline**: Document what happened when
2. **Root Cause**: Identify the underlying cause
3. **Impact**: Quantify the business impact
4. **Response**: Evaluate response effectiveness
5. **Prevention**: Define preventive measures
6. **Action Items**: Create tickets for improvements
