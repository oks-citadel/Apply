# JobPilot Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the JobPilot platform to Azure Kubernetes Service (AKS).

## Directory Structure

```
kubernetes/
├── base/
│   ├── namespace.yaml              # JobPilot namespace
│   ├── configmap.yaml              # Application configuration
│   ├── secrets.yaml                # Secret management with Azure Key Vault
│   ├── serviceaccount.yaml         # Service account and RBAC
│   ├── ingress.yaml                # NGINX Ingress with TLS
│   ├── networkpolicy.yaml          # Network security policies
│   ├── resourcequota.yaml          # Resource quotas and limits
│   └── poddisruptionbudget.yaml    # High availability policies
└── services/
    ├── auth-service.yaml           # Authentication service
    ├── user-service.yaml           # User management service
    ├── job-service.yaml            # Job management service
    ├── ai-service.yaml             # AI/ML service
    ├── resume-service.yaml         # Resume management service
    ├── analytics-service.yaml      # Analytics service
    ├── notification-service.yaml   # Notification service
    ├── auto-apply-service.yaml     # Auto-apply service
    └── web-app.yaml                # Frontend web application
```

## Prerequisites

1. **Azure Resources**
   - Azure Kubernetes Service (AKS) cluster
   - Azure Container Registry (ACR)
   - Azure Database for PostgreSQL
   - Azure Cache for Redis
   - Azure Key Vault
   - Azure Storage Account
   - Azure OpenAI Service

2. **kubectl and Azure CLI**
   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

   # Install kubectl
   az aks install-cli

   # Login to Azure
   az login

   # Get AKS credentials
   az aks get-credentials --resource-group jobpilot-rg --name jobpilot-aks
   ```

3. **Required Kubernetes Add-ons**
   - NGINX Ingress Controller
   - cert-manager (for TLS certificates)
   - Azure Key Vault Provider for Secrets Store CSI Driver
   - Metrics Server (for HPA)

## Installation

### Step 1: Install Required Add-ons

```bash
# Install NGINX Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Install Azure Key Vault Provider for Secrets Store CSI Driver
helm repo add csi-secrets-store-provider-azure https://azure.github.io/secrets-store-csi-driver-provider-azure/charts
helm install csi-secrets-store-provider-azure/csi-secrets-store-provider-azure --generate-name --namespace kube-system

# Install Metrics Server (if not already installed)
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Step 2: Configure Azure Key Vault Integration

1. Enable managed identity for AKS:
   ```bash
   az aks update --resource-group jobpilot-rg --name jobpilot-aks --enable-managed-identity
   ```

2. Grant AKS access to Key Vault:
   ```bash
   # Get AKS managed identity
   IDENTITY_CLIENT_ID=$(az aks show --resource-group jobpilot-rg --name jobpilot-aks --query identityProfile.kubeletidentity.clientId -o tsv)

   # Grant access to Key Vault
   az keyvault set-policy --name jobpilot-keyvault --object-id $IDENTITY_CLIENT_ID --secret-permissions get list
   ```

3. Update secrets.yaml with your Azure tenant ID and managed identity client ID

### Step 3: Configure ACR Integration

```bash
# Attach ACR to AKS
az aks update --resource-group jobpilot-rg --name jobpilot-aks --attach-acr jobpilotacr
```

### Step 4: Update Configuration

1. Edit `base/configmap.yaml`:
   - Update database hostnames
   - Update Redis hostnames
   - Update Azure resource names
   - Update domain names

2. Edit `base/secrets.yaml`:
   - Update Azure tenant ID
   - Update managed identity client ID
   - Update Key Vault name

3. Edit `base/ingress.yaml`:
   - Update domain names
   - Update email for Let's Encrypt

### Step 5: Deploy to AKS

```bash
# Create namespace
kubectl apply -f base/namespace.yaml

# Create service account and RBAC
kubectl apply -f base/serviceaccount.yaml

# Create resource quotas and limits
kubectl apply -f base/resourcequota.yaml

# Create ConfigMap
kubectl apply -f base/configmap.yaml

# Create secrets with Key Vault integration
kubectl apply -f base/secrets.yaml

# Deploy all services
kubectl apply -f services/

# Create network policies
kubectl apply -f base/networkpolicy.yaml

# Create pod disruption budgets
kubectl apply -f base/poddisruptionbudget.yaml

# Create ingress
kubectl apply -f base/ingress.yaml
```

### Step 6: Verify Deployment

```bash
# Check namespace
kubectl get namespace jobpilot

# Check pods
kubectl get pods -n jobpilot

# Check services
kubectl get svc -n jobpilot

# Check ingress
kubectl get ingress -n jobpilot

# Check HPA
kubectl get hpa -n jobpilot

# Check secrets
kubectl get secrets -n jobpilot

# Check logs
kubectl logs -n jobpilot -l app=auth-service --tail=50
```

## Service Endpoints

Once deployed, services are accessible via:

- **Web App**: https://jobpilot.com
- **API**: https://api.jobpilot.com
  - Auth: https://api.jobpilot.com/api/auth
  - Users: https://api.jobpilot.com/api/users
  - Jobs: https://api.jobpilot.com/api/jobs
  - AI: https://api.jobpilot.com/api/ai
  - Resumes: https://api.jobpilot.com/api/resumes
  - Analytics: https://api.jobpilot.com/api/analytics
  - Notifications: https://api.jobpilot.com/api/notifications
  - Auto-apply: https://api.jobpilot.com/api/auto-apply

## Scaling

### Manual Scaling

```bash
# Scale a specific service
kubectl scale deployment auth-service -n jobpilot --replicas=5

# Scale all services
kubectl scale deployment --all -n jobpilot --replicas=3
```

### Horizontal Pod Autoscaling (HPA)

HPA is automatically configured for all services based on CPU and memory utilization:

```bash
# View HPA status
kubectl get hpa -n jobpilot

# Describe HPA for a service
kubectl describe hpa auth-service-hpa -n jobpilot
```

## Security Features

1. **Network Policies**: Default deny-all with explicit allow rules
2. **RBAC**: Service accounts with minimal permissions
3. **Pod Security**:
   - Non-root containers
   - Read-only root filesystem
   - Dropped capabilities
   - Security context constraints
4. **TLS**: Automatic certificate management with Let's Encrypt
5. **Secrets Management**: Azure Key Vault integration
6. **Resource Limits**: CPU and memory limits enforced
7. **Pod Disruption Budgets**: High availability guarantees

## Monitoring

### View Logs

```bash
# View logs for a specific service
kubectl logs -n jobpilot -l app=auth-service --tail=100 -f

# View logs for a specific pod
kubectl logs -n jobpilot <pod-name> -f

# View logs from all pods of a service
kubectl logs -n jobpilot -l app=auth-service --all-containers=true
```

### Resource Usage

```bash
# View resource usage for nodes
kubectl top nodes

# View resource usage for pods
kubectl top pods -n jobpilot

# View resource usage for a specific service
kubectl top pods -n jobpilot -l app=auth-service
```

## Troubleshooting

### Pod Issues

```bash
# Describe a pod
kubectl describe pod <pod-name> -n jobpilot

# Get pod events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Check pod status
kubectl get pods -n jobpilot -o wide

# Execute commands in a pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/sh
```

### Service Issues

```bash
# Check service endpoints
kubectl get endpoints -n jobpilot

# Test service connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -n jobpilot -- wget -O- http://auth-service:3001/health
```

### Ingress Issues

```bash
# Check ingress status
kubectl describe ingress jobpilot-ingress -n jobpilot

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx

# Check certificate status
kubectl describe certificate jobpilot-tls-cert -n jobpilot
```

## Rolling Updates

```bash
# Update a deployment with a new image
kubectl set image deployment/auth-service auth-service=jobpilotacr.azurecr.io/auth-service:v1.1.0 -n jobpilot

# Check rollout status
kubectl rollout status deployment/auth-service -n jobpilot

# View rollout history
kubectl rollout history deployment/auth-service -n jobpilot

# Rollback to previous version
kubectl rollout undo deployment/auth-service -n jobpilot

# Rollback to specific revision
kubectl rollout undo deployment/auth-service -n jobpilot --to-revision=2
```

## Backup and Disaster Recovery

### Backup Configuration

```bash
# Backup all resources in jobpilot namespace
kubectl get all,configmaps,secrets,ingress,networkpolicies,pdb -n jobpilot -o yaml > jobpilot-backup.yaml

# Backup specific resources
kubectl get deployment,service,hpa -n jobpilot -o yaml > jobpilot-services-backup.yaml
```

### Restore Configuration

```bash
# Restore from backup
kubectl apply -f jobpilot-backup.yaml
```

## Cleanup

```bash
# Delete all resources in jobpilot namespace
kubectl delete namespace jobpilot

# Delete ingress controller
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Delete cert-manager
kubectl delete -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

## CI/CD Integration

This Kubernetes configuration is designed to work with Azure DevOps or GitHub Actions. See the CI/CD documentation for deployment pipelines.

### GitHub Actions Example

```yaml
- name: Deploy to AKS
  uses: azure/k8s-deploy@v4
  with:
    manifests: |
      infrastructure/kubernetes/base/
      infrastructure/kubernetes/services/
    images: |
      jobpilotacr.azurecr.io/auth-service:${{ github.sha }}
    imagepullsecrets: |
      acr-secret
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Kubernetes Service Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [Azure Key Vault Provider](https://azure.github.io/secrets-store-csi-driver-provider-azure/)

## Support

For issues and questions:
- Create an issue in the repository
- Contact the DevOps team
- Check the troubleshooting guide above
