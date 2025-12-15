# PostgreSQL Flexible Server Deployment Guide

## Quick Start

This guide walks you through deploying Azure PostgreSQL Flexible Server with PUBLIC network access for the ApplyForUs platform.

## Prerequisites

- [ ] Azure subscription with appropriate permissions
- [ ] Terraform >= 1.0 installed
- [ ] Azure CLI installed and authenticated (`az login`)
- [ ] Access to Azure Key Vault for credentials storage

## Step-by-Step Deployment

### Step 1: Prepare Configuration

1. **Copy the example configuration**:
   ```bash
   cd infrastructure/terraform
   cp postgresql.tfvars.example postgresql.tfvars
   ```

2. **Generate a strong password**:
   ```bash
   # Generate a secure password
   openssl rand -base64 32
   ```

3. **Edit postgresql.tfvars**:
   ```bash
   # Update these values:
   postgres_admin_password = "<your-generated-password>"

   # Add your admin IP (get it with: curl ifconfig.me)
   allowed_ip_addresses = [
     "YOUR_PUBLIC_IP_HERE",
   ]
   ```

### Step 2: Initial Deployment (Without AKS)

Deploy PostgreSQL server first, before AKS:

```bash
# Initialize Terraform (if not already done)
terraform init

# Review the plan
terraform plan -var-file="postgresql.tfvars"

# Apply the configuration
terraform apply -var-file="postgresql.tfvars"
```

**Expected output**:
```
Apply complete! Resources: 15 added, 0 changed, 0 destroyed.

Outputs:
postgresql_server_fqdn = "psql-applyforus-prod-xxxxxx.postgres.database.azure.com"
postgresql_database_names = {
  auth_service = "auth_service_db"
  user_service = "user_service_db"
  ...
}
```

### Step 3: Verify Initial Deployment

Test connectivity from your admin workstation:

```bash
# Get the server FQDN
SERVER_FQDN=$(terraform output -raw postgresql_server_fqdn)

# Test connection
psql "postgresql://applyforusadmin:<password>@${SERVER_FQDN}:5432/postgres?sslmode=require"

# Or test with pg_isready
pg_isready -h $SERVER_FQDN -p 5432
```

### Step 4: Deploy AKS Cluster

Deploy your AKS cluster (if not already deployed):

```bash
terraform apply -var-file="postgresql.tfvars" -var="enable_aks=true"
```

### Step 5: Get AKS Egress IP

After AKS is deployed, get the egress IP:

**Option 1: Using kubectl**
```bash
# Get kubeconfig
az aks get-credentials --resource-group <rg-name> --name <aks-name>

# Check for load balancer service
kubectl get svc -n kube-system
```

**Option 2: Using Azure CLI**
```bash
# Get node resource group
NODE_RG=$(az aks show -g <rg-name> -n <aks-name> --query nodeResourceGroup -o tsv)

# Get public IPs
az network public-ip list --resource-group $NODE_RG --query "[].{Name:name, IP:ipAddress}" -o table
```

**Option 3: Deploy a test pod**
```bash
# Deploy a pod to check its egress IP
kubectl run test-pod --image=curlimages/curl --rm -it --restart=Never -- curl ifconfig.me
```

### Step 6: Add AKS IP to Allowlist

1. **Update postgresql.tfvars**:
   ```hcl
   allowed_ip_addresses = [
     "YOUR_ADMIN_IP",
     "52.x.x.x",  # AKS egress IP from Step 5
   ]
   ```

2. **Re-apply Terraform**:
   ```bash
   terraform apply -var-file="postgresql.tfvars"
   ```

### Step 7: Test Connectivity from AKS

Deploy a test pod to verify database connectivity:

```bash
# Create test pod manifest
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: postgres-test
spec:
  containers:
  - name: postgres-client
    image: postgres:16
    env:
    - name: PGHOST
      value: "$(terraform output -raw postgresql_server_fqdn)"
    - name: PGPORT
      value: "5432"
    - name: PGUSER
      value: "applyforusadmin"
    - name: PGPASSWORD
      value: "<your-password>"
    - name: PGDATABASE
      value: "postgres"
    - name: PGSSLMODE
      value: "require"
    command: ["sleep", "3600"]
EOF

# Wait for pod to be ready
kubectl wait --for=condition=ready pod/postgres-test

# Test connection
kubectl exec -it postgres-test -- psql -c "SELECT version();"

# Cleanup
kubectl delete pod postgres-test
```

**Expected output**:
```
                                                 version
----------------------------------------------------------------------------------------------------------
 PostgreSQL 16.x on x86_64-pc-linux-gnu, compiled by gcc (GCC) 11.2.0, 64-bit
(1 row)
```

### Step 8: Store Credentials in Key Vault

```bash
# Get Key Vault name
KV_NAME=$(terraform output -raw key_vault_name)

# Store PostgreSQL credentials
az keyvault secret set --vault-name $KV_NAME \
  --name "postgres-admin-password" \
  --value "<your-password>"

az keyvault secret set --vault-name $KV_NAME \
  --name "postgres-host" \
  --value "$(terraform output -raw postgresql_server_fqdn)"

# Store connection strings for each service
for service in auth user job resume notification analytics auto-apply payment; do
  az keyvault secret set --vault-name $KV_NAME \
    --name "postgres-${service}-connection-string" \
    --value "$(terraform output -raw postgresql_connection_strings | jq -r ".${service}_service")"
done
```

### Step 9: Update Kubernetes Secrets

Create Kubernetes secrets from Key Vault:

```bash
# Create namespace if not exists
kubectl create namespace applyforus --dry-run=client -o yaml | kubectl apply -f -

# Create secret for PostgreSQL credentials
kubectl create secret generic postgres-credentials -n applyforus \
  --from-literal=username=applyforusadmin \
  --from-literal=password="<your-password>" \
  --from-literal=host="$(terraform output -raw postgresql_server_fqdn)" \
  --from-literal=port=5432 \
  --from-literal=ssl=true \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Step 10: Deploy Services

Update service deployments to use the database configuration:

```yaml
# Example: auth-service deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  template:
    spec:
      containers:
      - name: auth-service
        env:
        - name: DB_HOST
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: DB_HOST
        - name: DB_PORT
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: DB_PORT
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-credentials
              key: password
        - name: DB_SSL
          valueFrom:
            configMapKeyRef:
              name: database-config
              key: DB_SSL
        - name: DB_DATABASE
          value: "auth_service_db"
```

### Step 11: Run Database Migrations

For each service, run migrations:

```bash
# Example: Run auth-service migrations
kubectl create job auth-migration-$(date +%s) \
  --from=cronjob/auth-service-migration \
  -n applyforus

# Or create a one-time job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: auth-service-migration
  namespace: applyforus
spec:
  template:
    spec:
      containers:
      - name: migration
        image: your-acr.azurecr.io/auth-service:latest
        command: ["npm", "run", "migration:run"]
        envFrom:
        - configMapRef:
            name: database-config
        - secretRef:
            name: postgres-credentials
        env:
        - name: DB_DATABASE
          value: "auth_service_db"
      restartPolicy: Never
  backoffLimit: 3
EOF

# Check job status
kubectl get jobs -n applyforus
kubectl logs job/auth-service-migration -n applyforus
```

### Step 12: Verify Deployment

1. **Check service logs**:
   ```bash
   kubectl logs -l app=auth-service -n applyforus --tail=50
   ```

2. **Verify database connections**:
   ```bash
   # Check active connections from AKS
   kubectl exec -it postgres-test -- psql -c "
   SELECT datname, usename, application_name, client_addr, state, query_start
   FROM pg_stat_activity
   WHERE datname != 'postgres'
   ORDER BY query_start DESC;
   "
   ```

3. **Test service endpoints**:
   ```bash
   # Get service URL
   SERVICE_URL=$(kubectl get svc auth-service -n applyforus -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

   # Test health endpoint
   curl http://$SERVICE_URL:8001/health
   ```

## Post-Deployment Tasks

### Security Hardening

1. **Create service-specific database users**:
   ```sql
   -- Connect to PostgreSQL
   psql "postgresql://applyforusadmin:<password>@<server>.postgres.database.azure.com:5432/postgres?sslmode=require"

   -- Create users for each service
   CREATE USER auth_service_user WITH PASSWORD '<strong-password>';
   GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO auth_service_user;

   CREATE USER user_service_user WITH PASSWORD '<strong-password>';
   GRANT ALL PRIVILEGES ON DATABASE user_service_db TO user_service_user;

   -- Repeat for other services...
   ```

2. **Update service configurations to use dedicated users**

3. **Enable Azure Monitor alerts**:
   - Failed login attempts
   - High CPU usage
   - Storage threshold warnings
   - Connection failures

4. **Review and minimize IP allowlist**:
   - Remove any temporary IPs
   - Document purpose of each allowed IP
   - Set up quarterly review process

### Backup Verification

```bash
# List available backups
az postgres flexible-server backup list \
  --resource-group <rg-name> \
  --name <server-name> \
  --output table

# Test restore (to a new server)
az postgres flexible-server restore \
  --resource-group <rg-name> \
  --name <new-server-name> \
  --source-server <source-server-id> \
  --restore-time "2024-01-01T00:00:00Z"
```

### Monitoring Setup

1. **Enable Log Analytics queries**:
   - Connection monitoring
   - Slow query detection
   - Error rate tracking

2. **Configure alerts in Azure Monitor**:
   - CPU > 80%
   - Storage > 85%
   - Failed connections > threshold
   - Backup failures

3. **Set up dashboards**:
   - Database performance metrics
   - Connection pool statistics
   - Query performance insights

## Troubleshooting

### Connection Issues

**Problem**: Pods can't connect to PostgreSQL

**Solutions**:
1. Check firewall rules: `az postgres flexible-server firewall-rule list`
2. Verify AKS egress IP is in allowlist
3. Check pod logs for connection errors
4. Verify SSL is enabled in connection string
5. Test with temporary pod: `kubectl run test-pod --image=postgres:16 --rm -it`

### Migration Failures

**Problem**: Migrations fail to run

**Solutions**:
1. Check job logs: `kubectl logs job/<migration-job>`
2. Verify database credentials in secrets
3. Ensure target database exists
4. Check network connectivity from pods
5. Verify migration scripts are valid

### Performance Issues

**Problem**: Slow queries or high latency

**Solutions**:
1. Check Query Store for slow queries
2. Review connection pool settings
3. Monitor CPU and memory usage
4. Check for missing indexes
5. Consider scaling up SKU if needed

## Rollback Procedure

If you need to rollback:

1. **Restore from backup**:
   ```bash
   az postgres flexible-server restore \
     --resource-group <rg-name> \
     --name <server-name>-restored \
     --source-server <server-id> \
     --restore-time "<timestamp-before-issue>"
   ```

2. **Update connection strings** to point to restored server

3. **Re-run migrations** if needed

4. **Verify data integrity**

## Next Steps

- [ ] Set up automated backups verification
- [ ] Configure disaster recovery plan
- [ ] Implement database user rotation
- [ ] Set up performance baselines
- [ ] Document operational procedures
- [ ] Train team on PostgreSQL management
- [ ] Schedule regular security reviews

## Reference

- Documentation: `/docs/postgres-public-connectivity.md`
- Terraform Module: `/infrastructure/terraform/modules/postgresql-flexible/`
- Kubernetes Configs: `/infrastructure/kubernetes/base/database-config.yaml`
- Example Config: `/infrastructure/terraform/postgresql.tfvars.example`

---

**Last Updated**: 2025-12-15
