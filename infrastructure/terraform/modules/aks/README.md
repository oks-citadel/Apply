# Azure Kubernetes Service (AKS) Module

This module provisions an enterprise-grade Azure Kubernetes Service cluster with advanced security features, monitoring, and multi-node pool support.

## Features

- **Multi-Node Pools**: System, user, and GPU node pools
- **Workload Identity**: OIDC issuer and workload identity federation
- **Security**: Private cluster option, Azure AD RBAC, Azure Policy
- **Monitoring**: Azure Monitor for containers, diagnostic logs
- **Auto-Scaling**: Cluster autoscaler for all node pools
- **High Availability**: Availability zones, zone redundancy
- **Secrets Management**: Key Vault Secrets Provider CSI driver
- **Threat Protection**: Microsoft Defender for Cloud integration
- **Maintenance Windows**: Configurable upgrade schedules

## Usage

```hcl
module "aks" {
  source = "./modules/aks"

  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  project_name        = "jobpilot"
  environment         = "prod"

  aks_cluster_name            = "jobpilot-prod-aks"
  kubernetes_version          = "1.28.3"
  subnet_id                   = module.networking.aks_subnet_id
  log_analytics_workspace_id  = module.app_insights.log_analytics_workspace_id
  kubelet_managed_identity_id = module.managed_identity.aks_kubelet_identity_id

  # Security
  enable_private_cluster = true
  enable_azure_ad_rbac   = true
  disable_local_accounts = true

  # Monitoring
  enable_monitoring         = true
  enable_microsoft_defender = true

  # Features
  enable_secret_store_csi = true
  enable_azure_policy     = true

  tags = local.common_tags
}
```

## Node Pools

### System Node Pool

The default node pool runs system workloads (CoreDNS, metrics-server, etc.)

**Default Configuration**:
- VM Size: Standard_D4s_v3 (4 vCPU, 16 GB RAM)
- Node Count: 3
- Auto-scaling: 3-10 nodes
- Availability Zones: 1, 2, 3

### User Node Pool

Dedicated node pool for application workloads

**Default Configuration**:
- VM Size: Standard_D8s_v3 (8 vCPU, 32 GB RAM)
- Node Count: 3
- Auto-scaling: 3-20 nodes
- Availability Zones: 1, 2, 3

### GPU Node Pool (Optional)

For AI/ML workloads requiring GPU acceleration

**Default Configuration**:
- VM Size: Standard_NC6s_v3 (6 vCPU, 112 GB RAM, 1x V100 GPU)
- Node Count: 0 (scale from zero)
- Auto-scaling: 0-5 nodes
- Node Taint: `nvidia.com/gpu=true:NoSchedule`

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| resource_group_name | Resource group name | string | - | yes |
| location | Azure region | string | - | yes |
| project_name | Project name prefix | string | - | yes |
| environment | Environment (dev/staging/prod) | string | - | yes |
| kubernetes_version | Kubernetes version | string | "1.28.3" | no |
| subnet_id | Subnet ID for AKS nodes | string | - | yes |
| log_analytics_workspace_id | Log Analytics workspace ID | string | - | yes |
| kubelet_managed_identity_id | Kubelet managed identity ID | string | - | yes |
| enable_private_cluster | Enable private cluster | bool | true | no |
| enable_azure_ad_rbac | Enable Azure AD RBAC | bool | true | no |
| enable_monitoring | Enable Azure Monitor | bool | true | no |
| aks_sku_tier | AKS SKU tier | string | "Standard" | no |

For complete list of variables, see [variables.tf](variables.tf)

## Outputs

| Name | Description |
|------|-------------|
| cluster_id | AKS cluster resource ID |
| cluster_name | AKS cluster name |
| cluster_fqdn | AKS cluster FQDN |
| oidc_issuer_url | OIDC issuer URL for workload identity |
| kube_config | Kubernetes configuration (sensitive) |
| kubelet_identity | Kubelet managed identity details |

For complete list of outputs, see [outputs.tf](outputs.tf)

## Network Configuration

The module uses Azure CNI networking with the following configuration:

- **Network Plugin**: Azure CNI
- **Network Policy**: Azure Network Policy
- **Service CIDR**: 10.0.0.0/16 (configurable)
- **DNS Service IP**: 10.0.0.10 (configurable)
- **Max Pods per Node**: 110 (configurable)
- **Outbound Type**: Load Balancer with 2 public IPs

## Security Features

### Workload Identity

Enable Azure AD Workload Identity for pod-level authentication:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: workload-identity-sa
  annotations:
    azure.workload.identity/client-id: <WORKLOAD_IDENTITY_CLIENT_ID>
---
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:
    azure.workload.identity/use: "true"
spec:
  serviceAccountName: workload-identity-sa
  containers:
  - name: app
    image: myapp:latest
```

### Key Vault Secrets Provider

Access Key Vault secrets as Kubernetes secrets:

```yaml
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-keyvault-secrets
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: <KUBELET_IDENTITY_CLIENT_ID>
    keyvaultName: <KEYVAULT_NAME>
    cloudName: ""
    objects: |
      array:
        - |
          objectName: database-password
          objectType: secret
          objectVersion: ""
    tenantId: <TENANT_ID>
```

### Azure Policy

Pre-configured policies enforce:
- Container image restrictions
- Resource limits
- Network policies
- Security contexts
- Privileged container restrictions

## Monitoring

### Azure Monitor for Containers

Automatic collection of:
- Container logs
- Performance metrics
- Node metrics
- Kubernetes events

Query logs in Log Analytics:

```kql
ContainerLog
| where TimeGenerated > ago(1h)
| where LogEntry contains "error"
| project TimeGenerated, Computer, ContainerID, LogEntry

KubePodInventory
| where TimeGenerated > ago(1h)
| summarize count() by Namespace, ControllerName
```

### Prometheus and Grafana (Optional)

Deploy monitoring stack:

```bash
# Add Helm repos
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

## Maintenance

### Upgrading Kubernetes Version

1. Check available versions:
```bash
az aks get-versions --location eastus --output table
```

2. Update the variable:
```hcl
kubernetes_version = "1.29.0"
```

3. Apply upgrade:
```bash
terraform plan
terraform apply
```

### Node Pool Scaling

Scale node pools manually:

```bash
# Scale user node pool
az aks nodepool scale \
  --cluster-name jobpilot-prod-aks \
  --resource-group jobpilot-prod-rg \
  --name user \
  --node-count 5
```

Or use cluster autoscaler (enabled by default).

### Maintenance Windows

Configure maintenance windows to control when upgrades occur:

```hcl
maintenance_window_enabled = true
maintenance_window_day     = "Sunday"
maintenance_window_hours   = [0, 1, 2, 3, 4, 5]
```

## Best Practices

1. **Use managed identities** instead of service principals
2. **Enable Azure AD RBAC** for fine-grained access control
3. **Use private clusters** for production workloads
4. **Separate system and user workloads** with node pools
5. **Enable Microsoft Defender** for threat protection
6. **Configure resource quotas** per namespace
7. **Use network policies** to restrict pod communication
8. **Enable auto-scaling** with appropriate limits
9. **Regular cluster upgrades** to stay current with security patches
10. **Monitor cluster health** with Azure Monitor and alerts

## Troubleshooting

### Issue: Pods can't pull images from ACR

**Solution**: Verify AcrPull role assignment

```bash
az role assignment list \
  --assignee <KUBELET_IDENTITY_CLIENT_ID> \
  --scope <ACR_RESOURCE_ID>
```

### Issue: Workload identity not working

**Solution**: Verify OIDC issuer and federated credential

```bash
# Get OIDC issuer URL
az aks show --name <cluster-name> --resource-group <rg-name> \
  --query "oidcIssuerProfile.issuerUrl" -o tsv

# Verify federated credential
az identity federated-credential list \
  --identity-name <identity-name> \
  --resource-group <rg-name>
```

### Issue: Cluster autoscaler not working

**Solution**: Check autoscaler logs

```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

## Cost Optimization

- **Use Spot Instances** for non-critical workloads
- **Right-size node pools** based on actual usage
- **Enable cluster autoscaler** to scale down during low usage
- **Use Reserved Instances** for predictable workloads
- **Stop dev/test clusters** when not in use

## Examples

See the [examples](./examples/) directory for:
- Basic cluster configuration
- Private cluster with workload identity
- Multi-region deployment
- GPU workload configuration

## References

- [AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)
- [Workload Identity](https://azure.github.io/azure-workload-identity/)
- [Key Vault Secrets Provider](https://docs.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)
- [Azure Policy for AKS](https://docs.microsoft.com/en-us/azure/aks/policy-reference)
