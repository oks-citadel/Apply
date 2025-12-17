# Azure OIDC Authentication Setup for GitHub Actions

This document provides step-by-step instructions to configure Azure Workload Identity Federation (OIDC) for GitHub Actions, eliminating the need for static Azure credentials.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Step 1: Create Azure AD Application](#step-1-create-azure-ad-application)
- [Step 2: Configure Federated Credentials](#step-2-configure-federated-credentials)
- [Step 3: Assign Azure Permissions](#step-3-assign-azure-permissions)
- [Step 4: Configure GitHub Secrets](#step-4-configure-github-secrets)
- [Step 5: Update GitHub Environments](#step-5-update-github-environments)
- [Step 6: Validate OIDC Authentication](#step-6-validate-oidc-authentication)
- [Troubleshooting](#troubleshooting)

## Overview

**Benefits of OIDC Authentication:**
- ✅ No static credentials stored in GitHub
- ✅ Automatic credential rotation
- ✅ Fine-grained access control per environment
- ✅ Audit trail via Azure AD sign-in logs
- ✅ Reduced security risk from credential leakage

**What we're replacing:**
- ❌ `ACR_USERNAME` and `ACR_PASSWORD` secrets
- ❌ `AZURE_CREDENTIALS` JSON with service principal password
- ✅ Replaced with: OIDC token exchange using GitHub's OIDC provider

## Prerequisites

- Azure subscription with Owner or User Access Administrator role
- GitHub repository: `oks-citadel/Apply`
- Azure CLI installed: `az --version`
- GitHub CLI (optional): `gh --version`

## Step 1: Create Azure AD Application

### 1.1 Login to Azure

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 1.2 Create Azure AD Application

```bash
# Set variables
APP_NAME="applyforus-github-actions"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create Azure AD application
az ad app create --display-name "$APP_NAME"

# Get Application (client) ID
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)
echo "Application (Client) ID: $APP_ID"

# Create service principal
az ad sp create --id "$APP_ID"

# Get Object ID
OBJECT_ID=$(az ad sp list --display-name "$APP_NAME" --query "[0].id" -o tsv)
echo "Service Principal Object ID: $OBJECT_ID"

# Get Tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Tenant ID: $TENANT_ID"
```

**Save these values - you'll need them later:**
- `AZURE_CLIENT_ID`: Application (Client) ID
- `AZURE_TENANT_ID`: Tenant ID
- `AZURE_SUBSCRIPTION_ID`: Subscription ID

## Step 2: Configure Federated Credentials

Federated credentials establish trust between GitHub and Azure AD.

### 2.1 Create Federated Credential for Main Branch (Production)

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-prod-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:oks-citadel/Apply:ref:refs/heads/main",
    "description": "GitHub Actions - Production (main branch)",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2.2 Create Federated Credential for Develop Branch (Dev)

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-dev-develop",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:oks-citadel/Apply:ref:refs/heads/develop",
    "description": "GitHub Actions - Development (develop branch)",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2.3 Create Federated Credential for Production Environment

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-env-prod",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:oks-citadel/Apply:environment:prod",
    "description": "GitHub Actions - Production Environment",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2.4 Create Federated Credential for Staging Environment

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-env-staging",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:oks-citadel/Apply:environment:staging",
    "description": "GitHub Actions - Staging Environment",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2.5 Create Federated Credential for Dev Environment

```bash
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters '{
    "name": "github-env-dev",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:oks-citadel/Apply:environment:dev",
    "description": "GitHub Actions - Dev Environment",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

### 2.6 Verify Federated Credentials

```bash
az ad app federated-credential list --id "$APP_ID" --query "[].{Name:name, Subject:subject}" -o table
```

Expected output:
```
Name                Subject
------------------  ----------------------------------------------------------
github-prod-main    repo:oks-citadel/Apply:ref:refs/heads/main
github-dev-develop  repo:oks-citadel/Apply:ref:refs/heads/develop
github-env-prod     repo:oks-citadel/Apply:environment:prod
github-env-staging  repo:oks-citadel/Apply:environment:staging
github-env-dev      repo:oks-citadel/Apply:environment:dev
```

## Step 3: Assign Azure Permissions

### 3.1 Assign Subscription-Level Permissions

```bash
# Get Service Principal Object ID
SP_OBJECT_ID=$(az ad sp list --display-name "$APP_NAME" --query "[0].id" -o tsv)

# Assign Contributor role at subscription level
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --role "Contributor" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --assignee-principal-type "ServicePrincipal"

# Assign User Access Administrator (for managing AKS)
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --role "User Access Administrator" \
  --scope "/subscriptions/$SUBSCRIPTION_ID" \
  --assignee-principal-type "ServicePrincipal"
```

### 3.2 Assign ACR Permissions

```bash
# Get ACR resource ID
ACR_ID=$(az acr show --name applyforusacr --query id -o tsv)

# Assign AcrPush role (allows push/pull)
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --role "AcrPush" \
  --scope "$ACR_ID" \
  --assignee-principal-type "ServicePrincipal"

# Assign AcrPull role (redundant but explicit)
az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --role "AcrPull" \
  --scope "$ACR_ID" \
  --assignee-principal-type "ServicePrincipal"
```

### 3.3 Assign AKS Permissions

```bash
# Production AKS
AKS_PROD_ID=$(az aks show --resource-group applyforus-prod-rg --name applyforus-prod-aks --query id -o tsv 2>/dev/null || echo "")

if [ -n "$AKS_PROD_ID" ]; then
  az role assignment create \
    --assignee-object-id "$SP_OBJECT_ID" \
    --role "Azure Kubernetes Service Cluster Admin Role" \
    --scope "$AKS_PROD_ID" \
    --assignee-principal-type "ServicePrincipal"
fi

# Staging AKS
AKS_STAGING_ID=$(az aks show --resource-group applyforus-staging-rg --name applyforus-staging-aks --query id -o tsv 2>/dev/null || echo "")

if [ -n "$AKS_STAGING_ID" ]; then
  az role assignment create \
    --assignee-object-id "$SP_OBJECT_ID" \
    --role "Azure Kubernetes Service Cluster Admin Role" \
    --scope "$AKS_STAGING_ID" \
    --assignee-principal-type "ServicePrincipal"
fi
```

### 3.4 Assign Key Vault Permissions

```bash
# Get Key Vault resource ID
KV_ID=$(az keyvault show --name applyforus-kv --query id -o tsv 2>/dev/null || echo "")

if [ -n "$KV_ID" ]; then
  # Assign Key Vault Secrets User role
  az role assignment create \
    --assignee-object-id "$SP_OBJECT_ID" \
    --role "Key Vault Secrets User" \
    --scope "$KV_ID" \
    --assignee-principal-type "ServicePrincipal"
fi
```

### 3.5 Verify Role Assignments

```bash
az role assignment list --assignee "$SP_OBJECT_ID" --query "[].{Role:roleDefinitionName, Scope:scope}" -o table
```

## Step 4: Configure GitHub Secrets

### 4.1 Set Required GitHub Secrets

Add these secrets to your GitHub repository: `oks-citadel/Apply` → Settings → Secrets and variables → Actions

**Repository Secrets (required for all environments):**

```bash
AZURE_CLIENT_ID="<Application (Client) ID from Step 1.2>"
AZURE_TENANT_ID="<Tenant ID from Step 1.2>"
AZURE_SUBSCRIPTION_ID="<Subscription ID from Step 1.2>"
```

### 4.2 Using GitHub CLI

```bash
# Set repository secrets
gh secret set AZURE_CLIENT_ID --body "$APP_ID"
gh secret set AZURE_TENANT_ID --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUBSCRIPTION_ID"
```

### 4.3 Remove Old Credentials

**Once OIDC is working, remove these deprecated secrets:**

```bash
# Delete old credentials
gh secret delete ACR_USERNAME
gh secret delete ACR_PASSWORD
gh secret delete AZURE_CREDENTIALS
```

**⚠️ Only delete old secrets after validating OIDC works!**

## Step 5: Update GitHub Environments

Configure GitHub Environments with approval requirements.

### 5.1 Create/Update Dev Environment

1. Go to: `oks-citadel/Apply` → Settings → Environments
2. Create environment: `dev`
3. Configure:
   - ✅ **No approval required** (auto-deploy on develop branch)
   - Environment secrets: (inherit from repository)

### 5.2 Create/Update Staging Environment

1. Create environment: `staging`
2. Configure:
   - ✅ **Required reviewers**: Add 1-2 team members
   - ✅ **Wait timer**: 0 minutes
   - Environment secrets: (inherit from repository)

### 5.3 Create/Update Production Environment

1. Create environment: `prod`
2. Configure:
   - ✅ **Required reviewers**: Add 2+ senior team members
   - ✅ **Wait timer**: 5 minutes (cooling-off period)
   - ✅ **Prevent self-review**: Enable
   - Environment secrets: (inherit from repository)

### 5.4 Environment Protection Rules Summary

| Environment | Approvals Required | Wait Timer | Self-Review |
|-------------|-------------------|------------|-------------|
| `dev`       | 0                 | 0 min      | N/A         |
| `staging`   | 1-2               | 0 min      | Allowed     |
| `prod`      | 2+                | 5 min      | Blocked     |

## Step 6: Validate OIDC Authentication

### 6.1 Test Build Workflow

1. Push to `develop` branch
2. Monitor workflow: `Build and Security Scan`
3. Check logs for successful OIDC authentication:

```
Run Azure Login with OIDC
Logging in to Azure...
✅ Login successful
```

### 6.2 Test Dev Deployment

1. After build completes, check: `CD - Deploy to Development`
2. Verify OIDC authentication in deployment logs
3. Check ACR login succeeds without static credentials

### 6.3 Test Staging Deployment

1. Trigger workflow: `CD - Deploy to Staging`
2. Provide image tag from successful build
3. Approve deployment (if reviewers configured)
4. Verify digest-based promotion works

### 6.4 Test Production Deployment

1. Trigger workflow: `CD - Deploy to Production`
2. Provide image tag from staging
3. Wait for approval from 2+ reviewers
4. Verify digest-only deployment to prod

## Troubleshooting

### Issue: "AADSTS70021: No matching federated identity record found"

**Cause:** Federated credential subject doesn't match GitHub claim.

**Solution:**
```bash
# Verify federated credentials
az ad app federated-credential list --id "$APP_ID" --query "[].subject" -o table

# Ensure subject matches exactly:
# - For branch: repo:oks-citadel/Apply:ref:refs/heads/BRANCH_NAME
# - For environment: repo:oks-citadel/Apply:environment:ENV_NAME
```

### Issue: "The subscription is disabled"

**Cause:** Azure subscription is not active.

**Solution:**
```bash
az account show --query state -o tsv
# Should return "Enabled"
```

### Issue: "Login failed: AADSTS50105"

**Cause:** User/SP not assigned to application.

**Solution:**
```bash
# Verify service principal exists
az ad sp show --id "$APP_ID"

# Recreate if needed
az ad sp create --id "$APP_ID"
```

### Issue: "Authorization failed for ACR"

**Cause:** Missing AcrPush/AcrPull role assignments.

**Solution:**
```bash
# Re-assign ACR roles
ACR_ID=$(az acr show --name applyforusacr --query id -o tsv)
SP_OBJECT_ID=$(az ad sp list --display-name "$APP_NAME" --query "[0].id" -o tsv)

az role assignment create \
  --assignee-object-id "$SP_OBJECT_ID" \
  --role "AcrPush" \
  --scope "$ACR_ID" \
  --assignee-principal-type "ServicePrincipal"
```

### Issue: "Failed to get ACR token"

**Cause:** Service principal doesn't have ACR access.

**Solution:**
```bash
# Verify role assignments
az role assignment list --assignee "$SP_OBJECT_ID" --scope "$ACR_ID" -o table

# Test ACR login manually
az acr login --name applyforusacr
```

### Issue: "Environment protection rules failed"

**Cause:** Required reviewers not configured or self-review attempted.

**Solution:**
1. Go to GitHub → Settings → Environments → `prod`
2. Add required reviewers
3. Enable "Prevent self-review"
4. Ensure 2+ reviewers are available

## Verification Commands

### Verify Azure AD Application

```bash
APP_ID="<your-app-id>"

# Check application exists
az ad app show --id "$APP_ID" --query "{Name:displayName, AppId:appId}" -o table

# Check service principal
az ad sp show --id "$APP_ID" --query "{Name:displayName, Id:id}" -o table
```

### Verify Federated Credentials

```bash
az ad app federated-credential list --id "$APP_ID" \
  --query "[].{Name:name, Subject:subject, Issuer:issuer}" -o table
```

### Verify Role Assignments

```bash
SP_OBJECT_ID=$(az ad sp list --display-name "applyforus-github-actions" --query "[0].id" -o tsv)

az role assignment list --assignee "$SP_OBJECT_ID" \
  --query "[].{Role:roleDefinitionName, Scope:scope}" -o table
```

### Test ACR Authentication

```bash
# Get token using service principal
az acr login --name applyforusacr

# List repositories
az acr repository list --name applyforusacr -o table
```

## Security Best Practices

1. ✅ **Least Privilege**: Only grant necessary roles
2. ✅ **Environment Isolation**: Use separate federated credentials per environment
3. ✅ **Approval Gates**: Require multiple approvals for production
4. ✅ **Audit Logs**: Monitor Azure AD sign-in logs for suspicious activity
5. ✅ **Rotation**: OIDC tokens auto-rotate (no manual rotation needed)
6. ✅ **Monitoring**: Set up alerts for unauthorized access attempts

## Additional Resources

- [Azure Workload Identity Federation](https://docs.microsoft.com/en-us/azure/active-directory/develop/workload-identity-federation)
- [GitHub OIDC with Azure](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-azure)
- [Azure RBAC Best Practices](https://docs.microsoft.com/en-us/azure/role-based-access-control/best-practices)

## Summary

After completing this setup:

- ✅ All workflows use OIDC instead of static credentials
- ✅ Images are built once and promoted by digest
- ✅ Security scans fail pipelines on HIGH/CRITICAL vulnerabilities
- ✅ Dev deploys automatically (no approval)
- ✅ Staging requires 1-2 approvals
- ✅ Production requires 2+ approvals + 5-minute wait
- ✅ All deployments use immutable image digests

**Your CI/CD pipeline is now hardened and production-ready!**
