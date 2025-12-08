# Service Connections Configuration - ApplyforUs Platform

This document describes all the service connections required for the Azure DevOps pipelines.

## Overview

Service connections provide a secure way to connect Azure DevOps pipelines to external and remote services. You need to create these connections before running the pipelines.

---

## Required Service Connections

### 1. Azure Resource Manager Connection

**Name:** `ApplyforUs-Azure-ServiceConnection`

**Purpose:** Deploy and manage Azure resources via Terraform and Azure CLI tasks

**Type:** Azure Resource Manager (Service Principal)

#### Setup Instructions

1. Navigate to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **Azure Resource Manager**
4. Choose authentication method:

##### Option A: Service Principal (Automatic - Recommended)
- Select **Service principal (automatic)**
- Choose your Azure subscription
- Select resource group scope or subscription scope
- Enter service connection name: `ApplyforUs-Azure-ServiceConnection`
- Check "Grant access permission to all pipelines"
- Click **Save**

##### Option B: Service Principal (Manual)
- Select **Service principal (manual)**
- Enter the following details:
  - **Subscription ID:** Your Azure subscription ID
  - **Subscription Name:** Your Azure subscription name
  - **Service Principal ID:** Application (client) ID
  - **Service Principal Key:** Client secret
  - **Tenant ID:** Directory (tenant) ID
- Click **Verify** to test the connection
- Enter service connection name: `ApplyforUs-Azure-ServiceConnection`
- Click **Save**

#### Required Permissions

The service principal needs the following roles:
- **Contributor** on the subscription or resource groups
- **User Access Administrator** (if managing role assignments)
- **Key Vault Administrator** (for Key Vault access)

#### Creating Service Principal (Azure CLI)

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac \
  --name "applyforus-devops-sp" \
  --role Contributor \
  --scopes /subscriptions/{subscription-id}

# Output will include:
# - appId (Service Principal ID)
# - password (Service Principal Key)
# - tenant (Tenant ID)
```

---

### 2. Container Registry Connections

#### 2.1 ApplyforUs-ACR (Shared)

**Name:** `ApplyforUs-ACR`

**Purpose:** Push and pull Docker images to/from Azure Container Registry

**Type:** Docker Registry

##### Setup Instructions

1. Navigate to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **Docker Registry**
4. Choose **Azure Container Registry**
5. Enter the following:
   - **Azure subscription:** Select your subscription
   - **Azure container registry:** `applyforusacr`
   - **Service connection name:** `ApplyforUs-ACR`
6. Check "Grant access permission to all pipelines"
7. Click **Save**

##### Alternative: Using credentials

If you prefer credential-based authentication:
- **Registry type:** Azure Container Registry
- **Docker Registry:** `https://applyforusacr.azurecr.io`
- **Docker ID:** ACR admin username
- **Password:** ACR admin password

**Note:** Enable admin user in ACR settings first:
```bash
az acr update --name applyforusacr --admin-enabled true
az acr credential show --name applyforusacr
```

---

### 3. Kubernetes (AKS) Connections

#### 3.1 ApplyforUs-AKS-dev

**Name:** `ApplyforUs-AKS-dev`

**Purpose:** Deploy applications to development AKS cluster

**Type:** Kubernetes

##### Setup Instructions

1. Navigate to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **Kubernetes**
4. Choose **Azure Subscription**
5. Enter the following:
   - **Azure subscription:** Select your subscription
   - **Cluster:** `applyforus-dev-aks`
   - **Namespace:** `applyforus-dev`
   - **Service connection name:** `ApplyforUs-AKS-dev`
6. Check "Grant access permission to all pipelines"
7. Click **Save**

#### 3.2 ApplyforUs-AKS-test

**Name:** `ApplyforUs-AKS-test`

**Purpose:** Deploy applications to test AKS cluster

**Type:** Kubernetes

##### Setup Instructions
Same as dev, but use:
- **Cluster:** `applyforus-test-aks`
- **Namespace:** `applyforus-test`
- **Service connection name:** `ApplyforUs-AKS-test`

#### 3.3 ApplyforUs-AKS-prod

**Name:** `ApplyforUs-AKS-prod`

**Purpose:** Deploy applications to production AKS cluster

**Type:** Kubernetes

##### Setup Instructions
Same as dev, but use:
- **Cluster:** `applyforus-prod-aks`
- **Namespace:** `applyforus-prod`
- **Service connection name:** `ApplyforUs-AKS-prod`

**Important:** For production, consider:
- Using separate service principal with limited permissions
- Enabling approval checks
- Restricting pipeline access

##### Alternative: Using KubeConfig

If you prefer kubeconfig-based authentication:
```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group applyforus-dev-rg \
  --name applyforus-dev-aks \
  --file kubeconfig-dev.yaml

# Use the kubeconfig content in the service connection
cat kubeconfig-dev.yaml
```

---

### 4. Optional Service Connections

#### 4.1 SonarQube (Optional)

**Name:** `ApplyforUs-SonarQube`

**Purpose:** Code quality and security analysis

**Type:** SonarQube

##### Setup Instructions

1. Navigate to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **SonarQube**
4. Enter the following:
   - **Server URL:** Your SonarQube server URL
   - **Token:** SonarQube authentication token
   - **Service connection name:** `ApplyforUs-SonarQube`
5. Click **Verify and save**

##### Generate SonarQube Token
1. Login to SonarQube
2. Navigate to **My Account** > **Security**
3. Generate a new token
4. Copy the token and use it in the service connection

#### 4.2 Snyk (Optional)

**Name:** `ApplyforUs-Snyk`

**Purpose:** Dependency vulnerability scanning

**Type:** Generic (Service endpoint)

##### Setup Instructions

1. Navigate to **Project Settings** > **Service connections**
2. Click **New service connection**
3. Select **Generic**
4. Enter the following:
   - **Server URL:** `https://snyk.io/api`
   - **Username:** (leave empty)
   - **Password/Token Key:** Your Snyk API token
   - **Service connection name:** `ApplyforUs-Snyk`
5. Click **Save**

---

## Service Connection Security

### Best Practices

1. **Principle of Least Privilege**
   - Grant only necessary permissions
   - Use separate service principals per environment
   - Limit scope to specific resource groups

2. **Enable Approval Checks**
   For production service connections:
   - Go to service connection settings
   - Add **Approvals and checks**
   - Configure:
     - Required approvers
     - Timeout policies
     - Branch control

3. **Audit and Monitor**
   - Enable audit logging
   - Review connection usage regularly
   - Rotate credentials periodically

4. **Restrict Pipeline Access**
   - Uncheck "Grant access permission to all pipelines"
   - Explicitly authorize specific pipelines
   - Use project-level permissions

### Setting Up Approval Checks (Production)

For `ApplyforUs-AKS-prod` and production ARM connection:

1. Navigate to the service connection
2. Click **...** > **Approvals and checks**
3. Add check: **Approvals**
4. Configure:
   - **Approvers:** Select users/groups
   - **Minimum number of approvers:** 2
   - **Instructions:** "Approve production deployment"
   - **Timeout:** 48 hours
5. Add check: **Branch control**
6. Configure:
   - **Allowed branches:** `refs/heads/main`
7. Save

---

## Verification

### Test Azure Connection
```bash
# Using Azure CLI in pipeline
az account show
az group list --output table
```

### Test ACR Connection
```bash
# Using Docker in pipeline
docker login applyforusacr.azurecr.io
docker pull applyforusacr.azurecr.io/applyforus-web:latest
```

### Test AKS Connection
```bash
# Using kubectl in pipeline
kubectl cluster-info
kubectl get nodes
kubectl get namespaces
```

---

## Troubleshooting

### Issue: Service connection authentication fails

**Solution:**
1. Verify service principal credentials are correct
2. Check service principal hasn't expired
3. Ensure required permissions are granted
4. Try creating a new service principal

### Issue: Cannot access AKS cluster

**Solution:**
1. Verify AKS cluster is running
2. Check network security groups allow access
3. Ensure service principal has access to AKS
4. Verify namespace exists

### Issue: Cannot push to ACR

**Solution:**
1. Enable ACR admin user if using credentials
2. Verify service principal has AcrPush role
3. Check ACR firewall rules
4. Ensure correct registry URL

### Issue: Service connection not available in pipeline

**Solution:**
1. Verify service connection name matches pipeline reference
2. Check pipeline has access to the service connection
3. Ensure service connection is not disabled

---

## Managing Service Principals

### View Service Principal Details
```bash
# List service principals
az ad sp list --display-name "applyforus-devops-sp"

# Show service principal details
az ad sp show --id {service-principal-id}

# List role assignments
az role assignment list --assignee {service-principal-id}
```

### Rotate Service Principal Secret
```bash
# Create new credential
az ad sp credential reset \
  --id {service-principal-id} \
  --append

# Update service connection with new secret
```

### Delete Service Principal (Cleanup)
```bash
# Remove role assignments first
az role assignment delete --assignee {service-principal-id}

# Delete service principal
az ad sp delete --id {service-principal-id}
```

---

## Quick Setup Script

Create all service connections using Azure CLI:

```bash
#!/bin/bash

# Variables
SUBSCRIPTION_ID="your-subscription-id"
RESOURCE_GROUP_PREFIX="applyforus"
ACR_NAME="applyforusacr"
SP_NAME="applyforus-devops-sp"

# Create service principal
echo "Creating service principal..."
SP_JSON=$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role Contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID")

APP_ID=$(echo $SP_JSON | jq -r '.appId')
SP_PASSWORD=$(echo $SP_JSON | jq -r '.password')
TENANT_ID=$(echo $SP_JSON | jq -r '.tenant')

echo "Service Principal created:"
echo "  App ID: $APP_ID"
echo "  Password: $SP_PASSWORD"
echo "  Tenant ID: $TENANT_ID"

# Grant ACR access
echo "Granting ACR access..."
az role assignment create \
  --assignee $APP_ID \
  --role AcrPush \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/${RESOURCE_GROUP_PREFIX}-common-rg/providers/Microsoft.ContainerRegistry/registries/$ACR_NAME"

# Grant AKS access for each environment
for ENV in dev test prod; do
  echo "Granting AKS access for $ENV..."
  az role assignment create \
    --assignee $APP_ID \
    --role "Azure Kubernetes Service Cluster User Role" \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/${RESOURCE_GROUP_PREFIX}-${ENV}-rg/providers/Microsoft.ContainerService/managedClusters/${RESOURCE_GROUP_PREFIX}-${ENV}-aks"
done

echo ""
echo "Setup complete!"
echo "Use these values to create service connections in Azure DevOps"
```

---

## Service Connection Naming Convention

Follow this naming pattern for consistency:

```
ApplyforUs-{ServiceType}-{Environment}
```

Examples:
- `ApplyforUs-Azure-ServiceConnection` (shared)
- `ApplyforUs-ACR` (shared)
- `ApplyforUs-AKS-dev`
- `ApplyforUs-AKS-test`
- `ApplyforUs-AKS-prod`

---

## Support

For questions about service connections:
- Contact: DevOps Team
- Azure DevOps Documentation: [Service connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- Azure RBAC Documentation: [Azure role-based access control](https://docs.microsoft.com/en-us/azure/role-based-access-control/)
