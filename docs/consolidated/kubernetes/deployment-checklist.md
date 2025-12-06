# JobPilot Kubernetes Deployment Checklist

Use this checklist to ensure a successful deployment to Azure Kubernetes Service (AKS).

## Pre-Deployment Checklist

### Azure Resources
- [ ] AKS cluster created and running
- [ ] Azure Container Registry (ACR) created
- [ ] Azure Database for PostgreSQL created
- [ ] Azure Cache for Redis created
- [ ] Azure Key Vault created and populated with secrets
- [ ] Azure Storage Account created
- [ ] Azure OpenAI Service created
- [ ] Managed Identity created and configured
- [ ] ACR attached to AKS cluster

### Required Secrets in Azure Key Vault
- [ ] `postgres-user`
- [ ] `postgres-password`
- [ ] `redis-password`
- [ ] `jwt-secret`
- [ ] `jwt-refresh-secret`
- [ ] `azure-storage-connection-string`
- [ ] `azure-openai-api-key`
- [ ] `smtp-username`
- [ ] `smtp-password`
- [ ] `google-client-id`
- [ ] `google-client-secret`
- [ ] `linkedin-client-id`
- [ ] `linkedin-client-secret`
- [ ] `encryption-key`
- [ ] `sendgrid-api-key`

### Container Images Built and Pushed to ACR
- [ ] `jobpilotacr.azurecr.io/auth-service:latest`
- [ ] `jobpilotacr.azurecr.io/user-service:latest`
- [ ] `jobpilotacr.azurecr.io/job-service:latest`
- [ ] `jobpilotacr.azurecr.io/ai-service:latest`
- [ ] `jobpilotacr.azurecr.io/resume-service:latest`
- [ ] `jobpilotacr.azurecr.io/analytics-service:latest`
- [ ] `jobpilotacr.azurecr.io/notification-service:latest`
- [ ] `jobpilotacr.azurecr.io/auto-apply-service:latest`
- [ ] `jobpilotacr.azurecr.io/web-app:latest`

### Local Tools Installed
- [ ] kubectl installed
- [ ] Azure CLI installed
- [ ] helm installed (for add-ons)
- [ ] Logged in to Azure (`az login`)
- [ ] AKS credentials configured (`az aks get-credentials`)

### Kubernetes Add-ons
- [ ] NGINX Ingress Controller installed
- [ ] cert-manager installed
- [ ] Azure Key Vault Provider for Secrets Store CSI Driver installed
- [ ] Metrics Server installed (for HPA)

## Configuration Checklist

### base/configmap.yaml
- [ ] Updated `POSTGRES_HOST` with your PostgreSQL hostname
- [ ] Updated `REDIS_HOST` with your Redis hostname
- [ ] Updated `AZURE_STORAGE_ACCOUNT_NAME`
- [ ] Updated `AZURE_OPENAI_ENDPOINT`
- [ ] Updated `CORS_ORIGIN` with your domains
- [ ] Updated `EMAIL_FROM` address

### base/secrets.yaml
- [ ] Updated `<AZURE_MANAGED_IDENTITY_CLIENT_ID>`
- [ ] Updated `<AZURE_TENANT_ID>`
- [ ] Updated `keyvaultName`
- [ ] Verified all secret names match Key Vault secret names

### base/ingress.yaml
- [ ] Updated domain names (jobpilot.com, www.jobpilot.com, api.jobpilot.com)
- [ ] Updated Let's Encrypt email address
- [ ] Updated CORS origins

### base/serviceaccount.yaml
- [ ] Updated `<AZURE_MANAGED_IDENTITY_CLIENT_ID>`
- [ ] Updated `<AZURE_TENANT_ID>`

### kustomization.yaml
- [ ] Image tags updated (if not using `latest`)

## Deployment Steps

### Step 1: Install Add-ons
```bash
./deploy.sh  # This will install add-ons automatically
```
Or manually:
- [ ] NGINX Ingress Controller deployed
- [ ] cert-manager deployed
- [ ] Azure Key Vault CSI driver deployed

### Step 2: Deploy Base Resources
- [ ] Namespace created (`kubectl apply -f base/namespace.yaml`)
- [ ] ServiceAccount created (`kubectl apply -f base/serviceaccount.yaml`)
- [ ] ResourceQuota created (`kubectl apply -f base/resourcequota.yaml`)
- [ ] ConfigMap created (`kubectl apply -f base/configmap.yaml`)
- [ ] Secrets created (`kubectl apply -f base/secrets.yaml`)

### Step 3: Deploy Services
- [ ] Auth service deployed
- [ ] User service deployed
- [ ] Job service deployed
- [ ] AI service deployed
- [ ] Resume service deployed
- [ ] Analytics service deployed
- [ ] Notification service deployed
- [ ] Auto-apply service deployed
- [ ] Web app deployed

### Step 4: Deploy Network Policies
- [ ] Network policies created (`kubectl apply -f base/networkpolicy.yaml`)
- [ ] Pod disruption budgets created (`kubectl apply -f base/poddisruptionbudget.yaml`)

### Step 5: Deploy Ingress
- [ ] Ingress created (`kubectl apply -f base/ingress.yaml`)
- [ ] TLS certificate requested
- [ ] TLS certificate issued

## Post-Deployment Verification

### Pods
- [ ] All pods are running
  ```bash
  kubectl get pods -n jobpilot
  ```
- [ ] No pods in CrashLoopBackOff or Error state
- [ ] All pods have passed readiness probes

### Services
- [ ] All services created
  ```bash
  kubectl get svc -n jobpilot
  ```
- [ ] Services have endpoints
  ```bash
  kubectl get endpoints -n jobpilot
  ```

### Deployments
- [ ] All deployments are available
  ```bash
  kubectl get deployments -n jobpilot
  ```
- [ ] Desired replicas match available replicas

### HPA
- [ ] All HPAs created
  ```bash
  kubectl get hpa -n jobpilot
  ```
- [ ] HPAs showing metrics (may take a few minutes)

### Ingress
- [ ] Ingress created
  ```bash
  kubectl get ingress -n jobpilot
  ```
- [ ] Ingress has external IP assigned
- [ ] TLS certificate is ready
  ```bash
  kubectl describe certificate jobpilot-tls-cert -n jobpilot
  ```

### Network Policies
- [ ] Network policies created
  ```bash
  kubectl get networkpolicies -n jobpilot
  ```

### Secrets
- [ ] Secrets synced from Key Vault
  ```bash
  kubectl get secrets -n jobpilot
  ```
- [ ] jobpilot-secrets contains all required keys

## DNS Configuration

- [ ] DNS A record: `jobpilot.com` → Ingress IP
- [ ] DNS A record: `www.jobpilot.com` → Ingress IP
- [ ] DNS A record: `api.jobpilot.com` → Ingress IP
- [ ] DNS propagation verified
  ```bash
  nslookup jobpilot.com
  nslookup api.jobpilot.com
  ```

## Health Checks

### Service Health Endpoints
- [ ] Auth service: `https://api.jobpilot.com/api/auth/health`
- [ ] User service: `https://api.jobpilot.com/api/users/health`
- [ ] Job service: `https://api.jobpilot.com/api/jobs/health`
- [ ] AI service: `https://api.jobpilot.com/api/ai/health`
- [ ] Resume service: `https://api.jobpilot.com/api/resumes/health`
- [ ] Analytics service: `https://api.jobpilot.com/api/analytics/health`
- [ ] Notification service: `https://api.jobpilot.com/api/notifications/health`
- [ ] Auto-apply service: `https://api.jobpilot.com/api/auto-apply/health`
- [ ] Web app: `https://jobpilot.com`

### Database Connectivity
- [ ] Services can connect to PostgreSQL
  ```bash
  kubectl logs -n jobpilot -l app=auth-service --tail=20
  ```
- [ ] Services can connect to Redis
- [ ] No database connection errors in logs

### External Services
- [ ] Azure Storage connectivity verified
- [ ] Azure OpenAI connectivity verified
- [ ] Email service connectivity verified
- [ ] OAuth providers accessible

## Security Verification

### TLS/SSL
- [ ] HTTPS working on all domains
- [ ] Certificate valid and trusted
- [ ] HTTP to HTTPS redirect working
- [ ] Security headers present in responses

### Network Security
- [ ] Network policies enforcing traffic rules
- [ ] Services only accessible through ingress
- [ ] Inter-service communication working

### Pod Security
- [ ] Pods running as non-root
- [ ] Read-only root filesystem enabled
- [ ] Security contexts configured
- [ ] Capabilities dropped

### Secrets
- [ ] Secrets not visible in logs
- [ ] Secrets synced from Key Vault
- [ ] No hardcoded secrets in manifests

## Performance Verification

### Resource Usage
- [ ] CPU usage within limits
  ```bash
  kubectl top pods -n jobpilot
  ```
- [ ] Memory usage within limits
- [ ] No pods hitting resource limits

### Auto-scaling
- [ ] HPA responding to load
- [ ] Pods scaling up under load
- [ ] Pods scaling down when idle

### Response Times
- [ ] API endpoints responding quickly (<500ms)
- [ ] Web app loading quickly
- [ ] No timeouts or slow responses

## Monitoring Setup

- [ ] Prometheus scraping metrics (if configured)
- [ ] Logs being collected (if log aggregation configured)
- [ ] Alerts configured (if alerting configured)
- [ ] Dashboards created (if monitoring dashboard configured)

## Backup Verification

- [ ] Database backups configured
- [ ] Kubernetes manifests backed up
  ```bash
  kubectl get all,configmaps,secrets,ingress,networkpolicies,pdb -n jobpilot -o yaml > backup.yaml
  ```

## Rollback Plan

- [ ] Previous version images tagged and available
- [ ] Rollback procedure tested
  ```bash
  ./rollback.sh rollback auth-service
  ```
- [ ] Database migration rollback plan ready (if applicable)

## Documentation

- [ ] Deployment documented
- [ ] Team notified of deployment
- [ ] Runbook updated
- [ ] Known issues documented

## Final Checks

- [ ] All checklist items completed
- [ ] No errors in any pod logs
- [ ] All health checks passing
- [ ] DNS configured and propagated
- [ ] TLS certificates valid
- [ ] Monitoring and alerts working
- [ ] Backup procedures tested
- [ ] Rollback procedure tested
- [ ] Team trained on operations

## Sign-off

- [ ] Deployment Lead: _________________ Date: _______
- [ ] DevOps Engineer: _________________ Date: _______
- [ ] Security Review: _________________ Date: _______
- [ ] QA Verification: _________________ Date: _______

## Notes

```
Add any deployment notes, issues encountered, or special considerations here:




```

## Post-Deployment Tasks

After successful deployment:

1. Monitor for 24 hours for any issues
2. Verify auto-scaling under real load
3. Test disaster recovery procedures
4. Update documentation with any changes
5. Schedule regular security reviews
6. Set up performance baselines
7. Configure automated backups
8. Test rollback procedures
9. Train support team on troubleshooting
10. Schedule post-deployment review meeting

## Emergency Contacts

- DevOps Team: __________________
- Security Team: __________________
- Database Team: __________________
- On-call Engineer: __________________
