# ApplyforUs Infrastructure - Quick Reference Guide

Quick commands and references for managing the ApplyforUs infrastructure on Azure.

## Table of Contents

- [Terraform Commands](#terraform-commands)
- [Azure CLI Commands](#azure-cli-commands)
- [Kubernetes Commands](#kubernetes-commands)
- [DNS Commands](#dns-commands)
- [Monitoring Commands](#monitoring-commands)
- [Common Workflows](#common-workflows)

## Terraform Commands

### Initialization

```bash
# Initialize Terraform
terraform init

# Reinitialize with new backend
terraform init -reconfigure

# Upgrade providers
terraform init -upgrade
```

### Planning and Applying

```bash
# Plan for specific environment
terraform plan -var-file="environments/dev.tfvars"
terraform plan -var-file="environments/test.tfvars"
terraform plan -var-file="environments/prod.tfvars"

# Plan with output file
terraform plan -var-file="environments/prod.tfvars" -out=prod.tfplan

# Apply plan
terraform apply prod.tfplan

# Apply directly (not recommended for prod)
terraform apply -var-file="environments/prod.tfvars"

# Apply with auto-approve
terraform apply -var-file="environments/dev.tfvars" -auto-approve
```

### Outputs

```bash
# Show all outputs
terraform output

# Show specific output
terraform output dns_zone_nameservers
terraform output aks_cluster_name
terraform output acr_login_server
terraform output app_gateway_public_ip

# Show sensitive outputs
terraform output -json | jq '.aks_kube_config.value'
```

### State Management

```bash
# List resources in state
terraform state list

# Show resource details
terraform state show module.aks.azurerm_kubernetes_cluster.main

# Remove resource from state
terraform state rm module.storage.azurerm_storage_account.main

# Move resource in state
terraform state mv module.old.resource module.new.resource

# Pull current state
terraform state pull > state-backup.json

# Push state (use with caution!)
terraform state push state-backup.json

# Refresh state
terraform refresh -var-file="environments/prod.tfvars"
```

### Destruction

```bash
# Destroy specific resource
terraform destroy -target=module.storage

# Destroy entire environment
terraform destroy -var-file="environments/dev.tfvars"

# Destroy with auto-approve (dangerous!)
terraform destroy -var-file="environments/dev.tfvars" -auto-approve
```

### Workspaces

```bash
# List workspaces
terraform workspace list

# Create workspace
terraform workspace new prod

# Switch workspace
terraform workspace select prod

# Show current workspace
terraform workspace show

# Delete workspace
terraform workspace delete dev
```

### Validation and Formatting

```bash
# Format Terraform files
terraform fmt -recursive

# Validate configuration
terraform validate

# Check for security issues (requires tfsec)
tfsec .
```

## Azure CLI Commands

### Authentication

```bash
# Login to Azure
az login

# Login with service principal
az login --service-principal \
  --username $ARM_CLIENT_ID \
  --password $ARM_CLIENT_SECRET \
  --tenant $ARM_TENANT_ID

# Show current account
az account show

# List subscriptions
az account list --output table

# Set subscription
az account set --subscription "Your-Subscription-ID"

# Logout
az logout
```

### Resource Groups

```bash
# List resource groups
az group list --output table

# Show resource group
az group show --name applyforus-prod-rg

# List resources in group
az resource list \
  --resource-group applyforus-prod-rg \
  --output table

# Delete resource group (dangerous!)
az group delete --name applyforus-dev-rg --yes
```

### AKS Operations

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Get AKS credentials (overwrite existing)
az aks get-credentials \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks \
  --overwrite-existing

# Show AKS cluster
az aks show \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# List AKS versions
az aks get-versions --location eastus --output table

# Upgrade AKS
az aks upgrade \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks \
  --kubernetes-version 1.28.3

# Scale node pool
az aks nodepool scale \
  --resource-group applyforus-prod-rg \
  --cluster-name applyforus-prod-aks \
  --name user \
  --node-count 5

# Start stopped AKS cluster
az aks start \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks

# Stop AKS cluster (save costs)
az aks stop \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-aks
```

### ACR Operations

```bash
# Login to ACR
az acr login --name applyforusacr123456

# List repositories
az acr repository list --name applyforusacr123456

# List tags for repository
az acr repository show-tags \
  --name applyforusacr123456 \
  --repository web-app

# Build and push image
az acr build \
  --registry applyforusacr123456 \
  --image web-app:v1.0.0 \
  --file Dockerfile .

# Import image
az acr import \
  --name applyforusacr123456 \
  --source docker.io/library/nginx:latest \
  --image nginx:latest
```

### DNS Operations

```bash
# Show DNS zone
az network dns zone show \
  --resource-group applyforus-prod-rg \
  --name applyforus.com

# List DNS record sets
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output table

# Add A record
az network dns record-set a add-record \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --record-set-name blog \
  --ipv4-address 20.10.20.30

# Delete record set
az network dns record-set a delete \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --name blog
```

### Key Vault Operations

```bash
# List secrets
az keyvault secret list \
  --vault-name applyforus-prod-kv \
  --output table

# Show secret value
az keyvault secret show \
  --vault-name applyforus-prod-kv \
  --name db-admin-password \
  --query value -o tsv

# Set secret
az keyvault secret set \
  --vault-name applyforus-prod-kv \
  --name api-key \
  --value "your-secret-value"

# Delete secret
az keyvault secret delete \
  --vault-name applyforus-prod-kv \
  --name old-secret
```

### Application Gateway

```bash
# Show Application Gateway
az network application-gateway show \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-appgw

# Check backend health
az network application-gateway show-backend-health \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-appgw

# Start Application Gateway
az network application-gateway start \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-appgw

# Stop Application Gateway
az network application-gateway stop \
  --resource-group applyforus-prod-rg \
  --name applyforus-prod-appgw
```

### Monitoring

```bash
# Query Log Analytics
az monitor log-analytics query \
  --workspace applyforus-prod-law \
  --analytics-query "AzureDiagnostics | take 10"

# List activity logs
az monitor activity-log list \
  --resource-group applyforus-prod-rg \
  --offset 24h

# Show metrics
az monitor metrics list \
  --resource /subscriptions/{sub-id}/resourceGroups/applyforus-prod-rg/providers/Microsoft.ContainerService/managedClusters/applyforus-prod-aks \
  --metric "node_cpu_usage_percentage"
```

## Kubernetes Commands

### Cluster Information

```bash
# Get cluster info
kubectl cluster-info

# Get nodes
kubectl get nodes
kubectl get nodes -o wide

# Get node details
kubectl describe node <node-name>

# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods --all-namespaces
```

### Namespace Operations

```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace jobpilot

# Set default namespace
kubectl config set-context --current --namespace=jobpilot

# Delete namespace
kubectl delete namespace old-namespace
```

### Pod Operations

```bash
# List all pods
kubectl get pods --all-namespaces

# List pods in namespace
kubectl get pods -n jobpilot

# Get pod details
kubectl describe pod <pod-name> -n jobpilot

# View pod logs
kubectl logs <pod-name> -n jobpilot

# Follow logs
kubectl logs -f <pod-name> -n jobpilot

# View logs from previous container
kubectl logs <pod-name> -n jobpilot --previous

# Execute command in pod
kubectl exec -it <pod-name> -n jobpilot -- /bin/bash

# Port forward to pod
kubectl port-forward <pod-name> 8080:80 -n jobpilot
```

### Deployment Operations

```bash
# List deployments
kubectl get deployments -n jobpilot

# Scale deployment
kubectl scale deployment web-app --replicas=5 -n jobpilot

# Update image
kubectl set image deployment/web-app \
  web-app=applyforusacr123456.azurecr.io/web-app:v2.0.0 \
  -n jobpilot

# Rollout status
kubectl rollout status deployment/web-app -n jobpilot

# Rollout history
kubectl rollout history deployment/web-app -n jobpilot

# Rollback deployment
kubectl rollout undo deployment/web-app -n jobpilot

# Restart deployment
kubectl rollout restart deployment/web-app -n jobpilot
```

### Service Operations

```bash
# List services
kubectl get services -n jobpilot

# Get service details
kubectl describe service web-app -n jobpilot

# Get service endpoints
kubectl get endpoints web-app -n jobpilot
```

### ConfigMap and Secrets

```bash
# List configmaps
kubectl get configmaps -n jobpilot

# Show configmap
kubectl describe configmap jobpilot-config -n jobpilot

# Edit configmap
kubectl edit configmap jobpilot-config -n jobpilot

# List secrets
kubectl get secrets -n jobpilot

# Show secret (base64 encoded)
kubectl get secret jobpilot-secrets -n jobpilot -o yaml

# Decode secret
kubectl get secret jobpilot-secrets -n jobpilot \
  -o jsonpath='{.data.password}' | base64 -d
```

### Ingress Operations

```bash
# List ingresses
kubectl get ingress -n jobpilot

# Describe ingress
kubectl describe ingress applyforus-ingress -n jobpilot

# Get ingress IP
kubectl get ingress applyforus-ingress -n jobpilot \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### Certificate Management

```bash
# List certificates
kubectl get certificates -n jobpilot

# Describe certificate
kubectl describe certificate applyforus-tls -n jobpilot

# List certificate requests
kubectl get certificaterequest -n jobpilot

# List challenges
kubectl get challenge -n jobpilot

# View cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager --tail=100
```

### Troubleshooting

```bash
# Get events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# Describe all resources
kubectl describe all -n jobpilot

# Check pod status
kubectl get pods -n jobpilot --field-selector=status.phase!=Running

# Debug pod
kubectl debug <pod-name> -n jobpilot --image=busybox

# Run temporary pod for debugging
kubectl run debug-pod --image=busybox --rm -it -- /bin/sh
```

## DNS Commands

### Check DNS Resolution

```bash
# Using nslookup
nslookup applyforus.com
nslookup -type=NS applyforus.com
nslookup -type=A applyforus.com
nslookup -type=MX applyforus.com
nslookup -type=TXT applyforus.com
nslookup -type=CAA applyforus.com

# Using dig (Linux/Mac)
dig applyforus.com
dig applyforus.com NS
dig applyforus.com MX
dig applyforus.com TXT
dig applyforus.com ANY

# Using host
host applyforus.com
host -t NS applyforus.com
host -t MX applyforus.com
```

### Clear DNS Cache

```bash
# Windows
ipconfig /flushdns

# Mac
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches
sudo service network-manager restart
```

## Monitoring Commands

### Application Insights

```bash
# Query Application Insights (using Azure CLI)
az monitor app-insights query \
  --app applyforus-prod-ai \
  --resource-group applyforus-prod-rg \
  --analytics-query "requests | take 10"

# Failed requests
az monitor app-insights query \
  --app applyforus-prod-ai \
  --resource-group applyforus-prod-rg \
  --analytics-query "requests | where success == false | take 20"

# Performance metrics
az monitor app-insights query \
  --app applyforus-prod-ai \
  --resource-group applyforus-prod-rg \
  --analytics-query "performanceCounters | summarize avg(value) by name"
```

### Log Analytics

```bash
# Query logs
az monitor log-analytics query \
  --workspace applyforus-prod-law \
  --analytics-query "ContainerLog | where LogEntry contains 'error' | take 20"

# AKS logs
az monitor log-analytics query \
  --workspace applyforus-prod-law \
  --analytics-query "KubePodInventory | where Namespace == 'jobpilot' | take 10"
```

## Common Workflows

### Deploy New Version

```bash
# 1. Build and push image
docker build -t applyforusacr123456.azurecr.io/web-app:v2.0.0 .
docker push applyforusacr123456.azurecr.io/web-app:v2.0.0

# 2. Update deployment
kubectl set image deployment/web-app \
  web-app=applyforusacr123456.azurecr.io/web-app:v2.0.0 \
  -n jobpilot

# 3. Monitor rollout
kubectl rollout status deployment/web-app -n jobpilot

# 4. Verify pods
kubectl get pods -n jobpilot -l app=web-app
```

### Update Infrastructure

```bash
# 1. Pull latest code
git pull origin main

# 2. Review changes
terraform plan -var-file="environments/prod.tfvars"

# 3. Apply changes
terraform apply -var-file="environments/prod.tfvars"

# 4. Verify changes
terraform output
kubectl get nodes
```

### Troubleshoot Application Issue

```bash
# 1. Check pod status
kubectl get pods -n jobpilot

# 2. View logs
kubectl logs <pod-name> -n jobpilot --tail=50

# 3. Check events
kubectl get events -n jobpilot --sort-by='.lastTimestamp'

# 4. Describe pod
kubectl describe pod <pod-name> -n jobpilot

# 5. Check service
kubectl describe service web-app -n jobpilot

# 6. Test connectivity
kubectl run test-pod --image=busybox --rm -it -- wget -O- http://web-app:3000
```

### Scale Application

```bash
# Manual scaling
kubectl scale deployment web-app --replicas=5 -n jobpilot

# Update HPA
kubectl edit hpa web-app-hpa -n jobpilot

# Check autoscaling status
kubectl get hpa -n jobpilot
kubectl describe hpa web-app-hpa -n jobpilot
```

### Backup and Restore

```bash
# Backup Kubernetes resources
kubectl get all --all-namespaces -o yaml > k8s-backup-$(date +%Y%m%d).yaml

# Backup Terraform state
terraform state pull > state-backup-$(date +%Y%m%d).json

# Backup DNS records
az network dns record-set list \
  --resource-group applyforus-prod-rg \
  --zone-name applyforus.com \
  --output json > dns-backup-$(date +%Y%m%d).json

# Restore from backup
kubectl apply -f k8s-backup-20240101.yaml
```

### Certificate Renewal

```bash
# Check certificate status
kubectl get certificate applyforus-tls -n jobpilot

# Force renewal
kubectl delete certificaterequest -n jobpilot --all
kubectl delete challenge -n jobpilot --all

# Recreate certificate
kubectl delete certificate applyforus-tls -n jobpilot
kubectl apply -f certificate.yaml

# Monitor renewal
kubectl describe certificate applyforus-tls -n jobpilot
```

### Cost Analysis

```bash
# View current costs
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31

# Show budget
az consumption budget list \
  --resource-group applyforus-prod-rg

# Cost by resource type
az consumption usage list \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --query "[].{Type:instanceName, Cost:pretaxCost}" \
  --output table
```

## Environment Variables

### Terraform

```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform.log
export ARM_SUBSCRIPTION_ID="your-subscription-id"
export ARM_CLIENT_ID="your-client-id"
export ARM_CLIENT_SECRET="your-client-secret"
export ARM_TENANT_ID="your-tenant-id"
```

### Azure CLI

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

### Kubernetes

```bash
export KUBECONFIG=~/.kube/config
export NAMESPACE=jobpilot
```

## Quick Links

- **Azure Portal**: https://portal.azure.com
- **Terraform Registry**: https://registry.terraform.io
- **Kubernetes Dashboard**: `kubectl proxy` then http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
- **DNS Checker**: https://www.whatsmydns.net/
- **SSL Labs**: https://www.ssllabs.com/ssltest/

---

**Last Updated**: 2024-12-08
