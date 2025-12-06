# Service Connections Guide

Complete guide for configuring and managing Azure DevOps Service Connections for Terraform infrastructure deployment.

## Table of Contents

- [Overview](#overview)
- [Types of Service Connections](#types-of-service-connections)
- [Creating Service Connections](#creating-service-connections)
- [Authentication Methods](#authentication-methods)
- [Environment-Specific Connections](#environment-specific-connections)
- [Permissions and RBAC](#permissions-and-rbac)
- [Security Configuration](#security-configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

Service Connections in Azure DevOps enable pipelines to securely authenticate with external services. For Terraform deployments, they provide:

- **Secure Authentication**: Encrypted credential storage
- **Access Control**: Pipeline-level permissions
- **Audit Trail**: Usage logging and monitoring
- **Scope Management**: Subscription and resource-level access
- **Multi-Environment**: Separate connections per environment

### Connection Architecture

```
Azure DevOps Pipeline
    ↓
Service Connection (Authentication Layer)
    ↓
Azure Service Principal
    ↓
Azure Subscription (RBAC)
    ↓
Azure Resources
```

## Types of Service Connections

### 1. Azure Resource Manager (ARM)

**Purpose**: Deploy and manage Azure resources

**Use Cases:**
- Terraform infrastructure deployment
- ARM template deployment
- Azure CLI commands
- Resource management operations

### 2. Docker Registry (Azure Container Registry)

**Purpose**: Push/pull container images

**Use Cases:**
- Build and push Docker images
- Deploy containers to AKS
- Image vulnerability scanning

### 3. Kubernetes

**Purpose**: Deploy to AKS clusters

**Use Cases:**
- Helm deployments
- Kubectl operations
- Application deployments

### 4. Generic Service Connection

**Purpose**: Custom integrations

**Use Cases:**
- External API calls
- Third-party service integration
- Webhook triggers

## Creating Service Connections

### Method 1: Service Principal (Automated - Recommended)

Azure DevOps automatically creates and manages the Service Principal.

#### Steps:

1. **Navigate to Service Connections**
   - Go to: `https://dev.azure.com/{organization}/{project}/_settings/adminservices`

2. **Create New Connection**
   - Click **New service connection**
   - Select **Azure Resource Manager**
   - Click **Next**

3. **Select Authentication Method**
   - Choose **Service principal (automatic)**
   - Click **Next**

4. **Configure Connection**
   - **Subscription**: Select your Azure subscription
   - **Resource Group**: Leave empty for subscription-level access, or select specific RG
   - **Service connection name**: `azure-terraform-connection`
   - **Description**: `Automated service principal for Terraform deployments`
   - **Security**:
     - ☑ Grant access permission to all pipelines (or leave unchecked for manual approval)
   - Click **Save**

5. **Verify Connection**
   - Connection appears in list
   - Status shows green checkmark
   - Test in a simple pipeline

#### Advantages:
- Quick setup (2 minutes)
- Automatic credential management
- Azure DevOps manages renewal
- No manual Service Principal creation

#### Disadvantages:
- Less control over Service Principal configuration
- Default role assignments may be too broad
- Service Principal name auto-generated

### Method 2: Service Principal (Manual - Production Recommended)

Create and configure Service Principal manually for full control.

#### Prerequisites:

```bash
# Install Azure CLI
az --version

# Login to Azure
az login

# Set subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

#### Step 1: Create Service Principal

```bash
# Define variables
SP_NAME="jobpilot-terraform-sp"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
SUBSCRIPTION_NAME=$(az account show --query name -o tsv)

# Create Service Principal with Contributor role
az ad sp create-for-rbac \
  --name ${SP_NAME} \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID} \
  --sdk-auth

# Output (SAVE THIS SECURELY):
# {
#   "clientId": "00000000-0000-0000-0000-000000000000",
#   "clientSecret": "your-client-secret",
#   "subscriptionId": "00000000-0000-0000-0000-000000000000",
#   "tenantId": "00000000-0000-0000-0000-000000000000"
# }
```

#### Step 2: Grant Additional Permissions

```bash
# Get Service Principal Object ID
SP_OBJECT_ID=$(az ad sp list --display-name ${SP_NAME} --query "[0].id" -o tsv)

# Grant User Access Administrator (for managing RBAC)
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "User Access Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}

# Grant Key Vault Administrator (for Key Vault management)
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "Key Vault Administrator" \
  --scope /subscriptions/${SUBSCRIPTION_ID}

# Verify assignments
az role assignment list --assignee ${SP_OBJECT_ID} --output table
```

#### Step 3: Create Service Connection in Azure DevOps

1. **Navigate to Service Connections**
   - Go to: `https://dev.azure.com/{organization}/{project}/_settings/adminservices`

2. **Create New Connection**
   - Click **New service connection**
   - Select **Azure Resource Manager**
   - Click **Next**

3. **Select Manual Authentication**
   - Choose **Service principal (manual)**
   - Click **Next**

4. **Enter Service Principal Details**
   - **Environment**: Azure Cloud
   - **Scope Level**: Subscription
   - **Subscription Id**: `{your-subscription-id}`
   - **Subscription Name**: `{your-subscription-name}`
   - **Service Principal Id**: `{clientId from Step 1}`
   - **Service principal key**: `{clientSecret from Step 1}`
   - **Tenant ID**: `{tenantId from Step 1}`

5. **Configure Connection Details**
   - **Service connection name**: `azure-terraform-connection`
   - **Description**: `Manual service principal for Terraform - full subscription access`
   - **Security**:
     - ☐ Grant access permission to all pipelines (recommended: unchecked)
   - Click **Verify** to test connection

6. **Save Connection**
   - Click **Verify and save**
   - Confirm connection appears with green checkmark

#### Advantages:
- Full control over Service Principal
- Custom role assignments
- Better security posture
- Explicit permission management

#### Disadvantages:
- More setup time (15 minutes)
- Manual credential rotation
- Requires Azure AD permissions

### Method 3: Workload Identity Federation (Future)

**Status**: Available in Azure DevOps (Modern authentication)

**Benefits:**
- No secrets/passwords
- OpenID Connect (OIDC) based
- Automatic token exchange
- Enhanced security

**Setup**: See Azure DevOps documentation for workload identity configuration.

## Authentication Methods

### Comparison Matrix

| Feature | Automatic SP | Manual SP | Managed Identity | Workload Identity |
|---------|-------------|-----------|------------------|-------------------|
| Setup Time | 2 min | 15 min | 10 min | 20 min |
| Control Level | Low | High | Medium | High |
| Secret Management | Automatic | Manual | None | None |
| Security | Good | Better | Best | Best |
| Credential Rotation | Automatic | Manual | N/A | N/A |
| Production Ready | Yes | Yes | Limited | Yes |

### Recommended by Environment

| Environment | Method | Reason |
|-------------|--------|--------|
| Development | Automatic SP | Quick setup, less critical |
| Staging | Manual SP | Better control, test production config |
| Production | Manual SP or Workload Identity | Maximum security and control |

## Environment-Specific Connections

### Strategy 1: Single Connection (Simple)

**One service connection for all environments**

**Setup:**
```yaml
# Single connection with subscription-level access
Name: azure-terraform-connection
Scope: Subscription
Access: All environments
```

**Pros:**
- Simple management
- Single set of credentials
- Easy pipeline configuration

**Cons:**
- Less security isolation
- Can't scope to specific environments
- Broader access than needed

**Use Case:** Small teams, development projects

### Strategy 2: Environment-Specific Connections (Recommended)

**Separate connections per environment**

#### Development Connection

```bash
# Create dev-specific Service Principal
az ad sp create-for-rbac \
  --name "jobpilot-terraform-dev-sp" \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jobpilot-dev-rg
```

**Azure DevOps Configuration:**
- Name: `azure-terraform-dev`
- Scope: Resource Group `jobpilot-dev-rg`
- Access: Development pipelines only

#### Staging Connection

```bash
# Create staging-specific Service Principal
az ad sp create-for-rbac \
  --name "jobpilot-terraform-staging-sp" \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jobpilot-staging-rg
```

**Azure DevOps Configuration:**
- Name: `azure-terraform-staging`
- Scope: Resource Group `jobpilot-staging-rg`
- Access: Staging pipelines only

#### Production Connection

```bash
# Create production-specific Service Principal with minimal permissions
az ad sp create-for-rbac \
  --name "jobpilot-terraform-prod-sp" \
  --role Contributor \
  --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jobpilot-prod-rg

# Additional role for specific needs
SP_ID=$(az ad sp list --display-name "jobpilot-terraform-prod-sp" --query "[0].id" -o tsv)
az role assignment create \
  --assignee ${SP_ID} \
  --role "Network Contributor" \
  --scope /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/jobpilot-prod-network-rg
```

**Azure DevOps Configuration:**
- Name: `azure-terraform-prod`
- Scope: Resource Group `jobpilot-prod-rg`
- Access: Production pipelines only (with approval)

**Pros:**
- Environment isolation
- Least privilege access
- Independent credential rotation
- Better audit trail

**Cons:**
- More complex setup
- Multiple credentials to manage
- More Service Principals to maintain

### Strategy 3: Hybrid Approach

**Different levels of access per environment**

```yaml
Development:
  Connection: azure-terraform-dev
  Scope: Subscription (dev subscription)
  Access: Broad for experimentation

Staging:
  Connection: azure-terraform-staging
  Scope: Resource Group
  Access: Limited to staging RG

Production:
  Connection: azure-terraform-prod
  Scope: Multiple specific resource groups
  Access: Minimal required permissions
```

## Permissions and RBAC

### Required Azure Roles

#### Minimum for Infrastructure Deployment

```bash
# Core role for resource management
Role: Contributor
Scope: Subscription or Resource Group
Permissions: Create, update, delete resources (no RBAC changes)
```

#### Full Infrastructure Management

```bash
# Role 1: Resource management
Role: Contributor
Scope: /subscriptions/${SUBSCRIPTION_ID}

# Role 2: RBAC management
Role: User Access Administrator
Scope: /subscriptions/${SUBSCRIPTION_ID}

# Role 3: Key Vault management
Role: Key Vault Administrator
Scope: /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/*/providers/Microsoft.KeyVault/vaults/*
```

#### Custom Role (Recommended for Production)

```bash
# Create custom role definition
cat > terraform-deployer-role.json <<EOF
{
  "Name": "Terraform Infrastructure Deployer",
  "Description": "Custom role for Terraform infrastructure deployment",
  "Actions": [
    "Microsoft.Resources/*",
    "Microsoft.Network/*",
    "Microsoft.Compute/*",
    "Microsoft.Storage/*",
    "Microsoft.ContainerRegistry/*",
    "Microsoft.ContainerService/*",
    "Microsoft.KeyVault/vaults/*",
    "Microsoft.Insights/*",
    "Microsoft.OperationalInsights/*",
    "Microsoft.Authorization/roleAssignments/read",
    "Microsoft.Authorization/roleDefinitions/read"
  ],
  "NotActions": [
    "Microsoft.Authorization/*/Delete",
    "Microsoft.Authorization/*/Write",
    "Microsoft.Authorization/elevateAccess/Action"
  ],
  "AssignableScopes": [
    "/subscriptions/${SUBSCRIPTION_ID}"
  ]
}
EOF

# Create role
az role definition create --role-definition terraform-deployer-role.json

# Assign to Service Principal
az role assignment create \
  --assignee ${SP_OBJECT_ID} \
  --role "Terraform Infrastructure Deployer" \
  --scope /subscriptions/${SUBSCRIPTION_ID}
```

### Service Connection Permissions in Azure DevOps

#### Pipeline Access Control

**Option 1: Grant to All Pipelines**
- All pipelines can use connection automatically
- Quick for small teams
- Less secure

**Option 2: Manual Approval Per Pipeline**
- Each pipeline must be explicitly authorized
- First pipeline run prompts for approval
- More secure

**Option 3: Specific Pipeline Access**

```yaml
# In Service Connection settings
Security → User permissions
Add specific pipelines:
  - terraform-infrastructure-pipeline
  - terraform-destroy-pipeline (restricted users)
```

#### User Permissions

```yaml
# Service Connection permissions
Administrator:
  - DevOps Team
  - Infrastructure Lead

User (can use in builds):
  - All Build Service accounts
  - CI/CD service accounts

Creator:
  - No additional users (prevent unauthorized connections)
```

## Security Configuration

### 1. Secure Service Principal Credentials

**Store in Azure Key Vault:**

```bash
# Create Key Vault for credentials
az keyvault create \
  --name jobpilot-devops-kv \
  --resource-group jobpilot-shared-rg \
  --location eastus

# Store Service Principal credentials
az keyvault secret set \
  --vault-name jobpilot-devops-kv \
  --name "terraform-sp-client-id" \
  --value "${CLIENT_ID}"

az keyvault secret set \
  --vault-name jobpilot-devops-kv \
  --name "terraform-sp-client-secret" \
  --value "${CLIENT_SECRET}"
```

### 2. Enable Connection Auditing

**In Azure DevOps:**
- Settings → Auditing → Enable
- Monitor service connection usage
- Alert on unauthorized access

**In Azure:**
```bash
# Enable diagnostic logs for Service Principal activity
az monitor diagnostic-settings create \
  --name sp-audit-logs \
  --resource ${SP_RESOURCE_ID} \
  --logs '[{"category": "AuditLogs","enabled": true}]' \
  --workspace ${LOG_ANALYTICS_WORKSPACE_ID}
```

### 3. Implement Connection Expiration

```bash
# Set Service Principal credential expiration
az ad sp credential reset \
  --name ${SP_NAME} \
  --years 1  # Expire after 1 year

# Add calendar reminder for rotation before expiration
```

### 4. Network Restrictions

**Restrict Service Principal to specific IP ranges:**

```bash
# Create Conditional Access Policy (requires Azure AD Premium)
# Limit Service Principal sign-ins to Azure DevOps IP ranges
```

### 5. Monitor Connection Usage

**Create alert for suspicious activity:**

```bash
# Azure Monitor alert for unusual deployment patterns
az monitor metrics alert create \
  --name unusual-deployment-activity \
  --resource-group jobpilot-shared-rg \
  --scopes ${SUBSCRIPTION_ID} \
  --condition "count deployments > 50" \
  --window-size 1h \
  --evaluation-frequency 15m \
  --action email-ops-team
```

## Troubleshooting

### Issue 1: "Failed to authorize the service connection"

**Symptoms:**
```
ERROR: Failed to authorize the service connection to use the selected Azure subscription.
```

**Solutions:**

1. **Verify Service Principal exists:**
```bash
az ad sp list --display-name "jobpilot-terraform-sp" --output table
```

2. **Check credentials are valid:**
```bash
az login --service-principal \
  -u ${CLIENT_ID} \
  -p ${CLIENT_SECRET} \
  --tenant ${TENANT_ID}
```

3. **Verify subscription access:**
```bash
az account show
az group list
```

4. **Recreate connection with correct details**

### Issue 2: "Insufficient permissions to complete the operation"

**Symptoms:**
```
ERROR: The client 'xxx' does not have authorization to perform action 'Microsoft.Resources/deployments/write'
```

**Solutions:**

1. **Check current role assignments:**
```bash
SP_ID=$(az ad sp list --display-name "jobpilot-terraform-sp" --query "[0].id" -o tsv)
az role assignment list --assignee ${SP_ID} --output table
```

2. **Grant required role:**
```bash
az role assignment create \
  --assignee ${SP_ID} \
  --role Contributor \
  --scope /subscriptions/${SUBSCRIPTION_ID}
```

3. **Wait for permissions to propagate (up to 5 minutes)**

### Issue 3: "Service connection not found in pipeline"

**Symptoms:**
```yaml
# Pipeline YAML
- task: AzureCLI@2
  inputs:
    azureSubscription: 'azure-terraform-connection'  # Not found
```

**Solutions:**

1. **Verify exact connection name:**
   - Go to Service Connections page
   - Copy exact name (case-sensitive)

2. **Grant pipeline access:**
   - Service Connection → Security
   - Add pipeline to allowed list

3. **Use connection in pipeline:**
```yaml
# Correct reference
- task: AzureCLI@2
  inputs:
    azureSubscription: 'azure-terraform-connection'  # Must match exactly
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      az account show
```

### Issue 4: "Connection verification failed"

**Symptoms:**
- Green checkmark doesn't appear
- "Verify" button fails

**Solutions:**

1. **Check network connectivity:**
   - Ensure Azure DevOps can reach Azure endpoints
   - Check firewall rules

2. **Verify Service Principal hasn't expired:**
```bash
az ad sp credential list --id ${SP_ID}
```

3. **Check Azure service health:**
   - Visit: https://status.azure.com

4. **Try re-entering credentials:**
   - Edit service connection
   - Re-enter Service Principal key
   - Click Verify

### Issue 5: "Service Principal expired"

**Symptoms:**
```
ERROR: The provided client secret expired.
```

**Solutions:**

1. **Reset Service Principal credentials:**
```bash
NEW_SECRET=$(az ad sp credential reset \
  --name "jobpilot-terraform-sp" \
  --query password -o tsv)

echo "New Secret: ${NEW_SECRET}"
```

2. **Update Service Connection:**
   - Edit connection in Azure DevOps
   - Update "Service principal key" with new secret
   - Click "Verify and save"

3. **Update Key Vault if applicable:**
```bash
az keyvault secret set \
  --vault-name jobpilot-devops-kv \
  --name "terraform-sp-client-secret" \
  --value "${NEW_SECRET}"
```

## Best Practices

### 1. Naming Conventions

```yaml
Pattern: {project}-{purpose}-{environment}-{type}

Examples:
  - jobpilot-terraform-prod-connection
  - jobpilot-terraform-dev-connection
  - jobpilot-acr-shared-connection
  - jobpilot-aks-prod-connection
```

### 2. Documentation

Maintain connection inventory:

```markdown
# Service Connections Inventory

## azure-terraform-connection
- **Purpose**: Terraform infrastructure deployment
- **Scope**: Subscription-level
- **Service Principal**: jobpilot-terraform-sp
- **Client ID**: 00000000-0000-0000-0000-000000000000
- **Created**: 2025-01-15
- **Expires**: 2026-01-15
- **Owner**: DevOps Team
- **Last Rotated**: 2025-01-15
```

### 3. Regular Audits

**Monthly Checklist:**
- [ ] Review connection usage logs
- [ ] Verify all connections are still needed
- [ ] Check for expiring credentials
- [ ] Validate permission scopes
- [ ] Update documentation

### 4. Credential Rotation

**Rotation Schedule:**

```bash
# Development: Annually
# Staging: Semi-annually
# Production: Quarterly

# Create rotation script
cat > rotate-sp-secret.sh <<'EOF'
#!/bin/bash
SP_NAME=$1
KV_NAME=$2

# Reset credential
NEW_SECRET=$(az ad sp credential reset --name ${SP_NAME} --query password -o tsv)

# Update Key Vault
az keyvault secret set \
  --vault-name ${KV_NAME} \
  --name "terraform-sp-client-secret" \
  --value "${NEW_SECRET}"

echo "Credential rotated successfully"
echo "Update Service Connection in Azure DevOps manually"
EOF

chmod +x rotate-sp-secret.sh
```

### 5. Least Privilege

```bash
# Start with minimal permissions
# Add only what's needed
# Review quarterly

# Example: Restrict to specific resource groups
az role assignment create \
  --assignee ${SP_ID} \
  --role Contributor \
  --scope /subscriptions/${SUB_ID}/resourceGroups/jobpilot-prod-app-rg

# Not subscription-wide unless necessary
```

### 6. Emergency Access

**Prepare break-glass procedure:**

1. Document emergency Service Principal credentials in secure vault
2. Store in physical safe accessible to senior leadership
3. Create process for emergency access approval
4. Test quarterly

### 7. Monitoring and Alerting

```bash
# Alert on Service Principal usage anomalies
# Set up Azure Monitor alerts for:
- Failed authentication attempts
- Unusual deployment times (after hours)
- High volume of API calls
- Permission elevation attempts
```

## Additional Resources

- [Azure Service Principal Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
- [Azure DevOps Service Connections](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints)
- [Main Setup Guide](./AZURE-DEVOPS-SETUP.md)
- [Security Best Practices](./SECURITY-BEST-PRACTICES.md)
- [Variable Groups Guide](./VARIABLE-GROUPS.md)

---

**Last Updated:** 2025-12-04
**Version:** 1.0.0
**Maintained By:** DevOps Team
