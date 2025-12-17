# Secret Rotation Guide

## Overview

This guide provides step-by-step procedures for rotating secrets in the ApplyForUs platform **without rebuilding Docker images or redeploying code**.

---

## Why Secret Rotation Matters

- **Security**: Reduces the impact of leaked secrets
- **Compliance**: Meets regulatory requirements (PCI-DSS, SOC 2, HIPAA)
- **Best Practice**: Industry standard is to rotate secrets every 30-90 days
- **Zero Downtime**: Rotation happens without service interruption

---

## Rotation Methods

### Method 1: Automatic Rotation (Recommended)

The Azure Key Vault CSI Driver automatically syncs secrets every **2 minutes**.

**Steps:**

1. Update secret in Azure Key Vault
2. Wait for CSI Driver to sync (2 minutes max)
3. Restart pods to reload secrets

### Method 2: Manual Rotation with Immediate Effect

For critical secrets requiring immediate rotation.

**Steps:**

1. Update secret in Azure Key Vault
2. Force pod restart to immediately load new secret

---

## General Rotation Procedure

### Prerequisites

```bash
# Set environment variables
VAULT_NAME="applyforus-kv"  # Your Key Vault name
NAMESPACE="applyforus"       # Kubernetes namespace
```

### Step-by-Step Rotation

#### 1. Update Secret in Azure Key Vault

```bash
# Using Azure CLI
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name <secret-name> \
  --value "<new-secret-value>"
```

**Example:**

```bash
# Rotate JWT secret
NEW_JWT_SECRET=$(openssl rand -base64 64)
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --value "$NEW_JWT_SECRET"
```

#### 2. Verify Secret Update

```bash
# Confirm new secret value is stored
az keyvault secret show \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --query "value" \
  -o tsv
```

#### 3. Restart Affected Services

```bash
# Option A: Restart specific deployment
kubectl rollout restart deployment/auth-service -n $NAMESPACE

# Option B: Restart all backend services
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE

# Option C: Restart all services
kubectl rollout restart deployment -n $NAMESPACE
```

#### 4. Monitor Rollout

```bash
# Watch rollout status
kubectl rollout status deployment/auth-service -n $NAMESPACE

# Check pod status
kubectl get pods -n $NAMESPACE -w

# Verify no errors
kubectl logs -l app=auth-service -n $NAMESPACE --tail=50
```

#### 5. Verify Secret Sync

```bash
# Check SecretProviderClass pod status
kubectl get secretproviderclasspodstatus -n $NAMESPACE

# Verify secret in pod
POD_NAME=$(kubectl get pods -l app=auth-service -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it $POD_NAME -n $NAMESPACE -- cat /mnt/secrets-store/jwt-secret
```

---

## Secret-Specific Rotation Procedures

### Database Passwords

**PostgreSQL Admin Password:**

```bash
# 1. Generate strong password
NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)

# 2. Update in Azure PostgreSQL
az postgres flexible-server update \
  --resource-group applyforus-prod-rg \
  --name applyforus-postgres \
  --admin-password "$NEW_PASSWORD"

# 3. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name postgres-password \
  --value "$NEW_PASSWORD"

# 4. Update connection string in Key Vault
NEW_CONN_STRING="postgresql://applyforusadmin:${NEW_PASSWORD}@applyforus-postgres.postgres.database.azure.com:5432/applyforus?sslmode=require"
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name postgres-connection-string \
  --value "$NEW_CONN_STRING"

# 5. Restart all database-dependent services
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE
```

**Important:** Database password rotation requires updating BOTH Azure PostgreSQL and Key Vault.

### Redis Password

```bash
# 1. Get new Redis access key from Azure
NEW_REDIS_KEY=$(az redis list-keys \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --query secondaryKey \
  -o tsv)

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name redis-password \
  --value "$NEW_REDIS_KEY"

# 3. Update connection string
NEW_REDIS_URL="rediss://:${NEW_REDIS_KEY}@applyforus-redis.redis.cache.windows.net:6380/0"
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name redis-connection-string \
  --value "$NEW_REDIS_URL"

# 4. Restart services
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE

# 5. Regenerate primary key (optional - for full rotation)
az redis regenerate-keys \
  --resource-group applyforus-prod-rg \
  --name applyforus-redis \
  --key-type Primary
```

### JWT Secrets

**JWT Signing Secret:**

```bash
# 1. Generate new secret
NEW_JWT_SECRET=$(openssl rand -base64 64)

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --value "$NEW_JWT_SECRET"

# 3. Restart auth service
kubectl rollout restart deployment/auth-service -n $NAMESPACE

# 4. Monitor for authentication errors
kubectl logs -l app=auth-service -n $NAMESPACE --follow
```

**Warning:** Rotating JWT secrets will invalidate all existing tokens. Users will need to re-authenticate.

**JWT Refresh Secret:**

```bash
# Same procedure as JWT secret
NEW_REFRESH_SECRET=$(openssl rand -base64 64)
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name jwt-refresh-secret \
  --value "$NEW_REFRESH_SECRET"

kubectl rollout restart deployment/auth-service -n $NAMESPACE
```

### Session Secret

```bash
# 1. Generate new session secret
NEW_SESSION_SECRET=$(openssl rand -base64 64)

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name session-secret \
  --value "$NEW_SESSION_SECRET"

# 3. Restart all services that use sessions
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE
```

**Warning:** Rotating session secrets will invalidate all active sessions. Users will need to log in again.

### Encryption Key

```bash
# 1. Generate new encryption key (256-bit)
NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name encryption-key \
  --value "$NEW_ENCRYPTION_KEY"

# 3. Restart services
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE
```

**Critical:** Rotating encryption keys may require re-encrypting existing encrypted data. Plan accordingly.

### API Keys

**OpenAI API Key:**

```bash
# 1. Generate new key from OpenAI dashboard
# Visit: https://platform.openai.com/api-keys

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name openai-api-key \
  --value "<new-api-key-from-openai>"

# 3. Restart AI service
kubectl rollout restart deployment/ai-service -n $NAMESPACE
```

**SendGrid API Key:**

```bash
# 1. Create new key in SendGrid dashboard
# Visit: https://app.sendgrid.com/settings/api_keys

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name sendgrid-api-key \
  --value "<new-sendgrid-key>"

# 3. Restart notification service
kubectl rollout restart deployment/notification-service -n $NAMESPACE

# 4. Test email sending
kubectl exec -it $(kubectl get pod -l app=notification-service -n $NAMESPACE -o jsonpath='{.items[0].metadata.name}') -n $NAMESPACE -- curl -X POST localhost:4006/api/v1/test-email
```

**Stripe Secret Key:**

```bash
# 1. Generate new key from Stripe dashboard
# Visit: https://dashboard.stripe.com/apikeys

# 2. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name stripe-secret-key \
  --value "<new-stripe-secret-key>"

# 3. Restart payment service
kubectl rollout restart deployment/payment-service -n $NAMESPACE

# 4. Update webhook secret if changed
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name stripe-webhook-secret \
  --value "<new-webhook-secret>"
```

### OAuth Secrets

**Google OAuth:**

```bash
# 1. Generate new credentials from Google Cloud Console
# Visit: https://console.cloud.google.com/apis/credentials

# 2. Update client ID
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name google-client-id \
  --value "<new-client-id>"

# 3. Update client secret
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name google-client-secret \
  --value "<new-client-secret>"

# 4. Restart auth service
kubectl rollout restart deployment/auth-service -n $NAMESPACE
```

**LinkedIn OAuth:**

```bash
# Similar to Google OAuth
az keyvault secret set --vault-name $VAULT_NAME --name linkedin-client-id --value "<new-id>"
az keyvault secret set --vault-name $VAULT_NAME --name linkedin-client-secret --value "<new-secret>"
kubectl rollout restart deployment/auth-service -n $NAMESPACE
```

---

## Rotation Schedule

### Recommended Rotation Frequencies

| Secret Type | Rotation Frequency | Priority |
|-------------|-------------------|----------|
| Database Passwords | 90 days | High |
| Redis Passwords | 90 days | High |
| JWT Secrets | 90 days | Critical |
| Session Secrets | 90 days | High |
| Encryption Keys | 180 days | Critical |
| OAuth Secrets | 180 days | Medium |
| API Keys (3rd party) | 90 days or as recommended by provider | Medium |
| Stripe Keys | 90 days | High |
| Service Bus Keys | 90 days | Medium |

### Compliance Requirements

- **PCI-DSS**: Rotate every 90 days
- **SOC 2**: Rotate every 90 days
- **HIPAA**: Rotate every 90 days minimum
- **ISO 27001**: Define rotation policy based on risk assessment

---

## Bulk Rotation

Rotate all secrets at once:

```bash
#!/bin/bash
# bulk-rotate-secrets.sh

VAULT_NAME="applyforus-kv"
NAMESPACE="applyforus"

echo "Starting bulk secret rotation..."

# Authentication secrets
echo "Rotating authentication secrets..."
az keyvault secret set --vault-name $VAULT_NAME --name jwt-secret --value "$(openssl rand -base64 64)"
az keyvault secret set --vault-name $VAULT_NAME --name jwt-refresh-secret --value "$(openssl rand -base64 64)"
az keyvault secret set --vault-name $VAULT_NAME --name session-secret --value "$(openssl rand -base64 64)"
az keyvault secret set --vault-name $VAULT_NAME --name encryption-key --value "$(openssl rand -hex 32)"

echo "Restarting all services..."
kubectl rollout restart deployment -l tier=backend -n $NAMESPACE

echo "Monitoring rollout..."
kubectl rollout status deployment -l tier=backend -n $NAMESPACE

echo "Bulk rotation complete!"
```

**Warning:** Bulk rotation will invalidate all active sessions and tokens.

---

## Emergency Rotation (Leaked Secret)

If a secret is compromised:

### Immediate Actions

```bash
# 1. Identify the leaked secret
LEAKED_SECRET="jwt-secret"

# 2. Generate new value immediately
NEW_VALUE=$(openssl rand -base64 64)

# 3. Update in Key Vault
az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name $LEAKED_SECRET \
  --value "$NEW_VALUE" \
  --tags "rotated-reason=security-incident" "rotated-date=$(date +%Y-%m-%d)"

# 4. Force immediate restart (no graceful shutdown)
kubectl delete pods -l tier=backend -n $NAMESPACE

# 5. Monitor for issues
kubectl get pods -n $NAMESPACE -w

# 6. Verify no errors
kubectl logs -l tier=backend -n $NAMESPACE --since=5m | grep -i error
```

### Post-Incident

1. **Investigate** how the secret was leaked
2. **Review audit logs** in Key Vault
3. **Update security procedures**
4. **Document incident** for compliance
5. **Rotate related secrets** as a precaution

---

## Rollback Procedure

If rotation causes issues:

```bash
# 1. Get previous secret version
PREVIOUS_VERSION=$(az keyvault secret list-versions \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --query "[1].id" \
  -o tsv)

# 2. Restore previous version as current
az keyvault secret set-attributes \
  --id $PREVIOUS_VERSION \
  --enabled true

# 3. Create new version with old value
OLD_VALUE=$(az keyvault secret show \
  --id $PREVIOUS_VERSION \
  --query "value" \
  -o tsv)

az keyvault secret set \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --value "$OLD_VALUE"

# 4. Restart services
kubectl rollout restart deployment/auth-service -n $NAMESPACE
```

---

## Automation

### Scheduled Rotation (Azure Automation)

Create an Azure Automation Runbook for scheduled rotation:

```powershell
# Example: Monthly JWT secret rotation
$VaultName = "applyforus-kv"
$SecretName = "jwt-secret"

# Generate new secret
$NewSecret = [Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Update in Key Vault
Set-AzKeyVaultSecret -VaultName $VaultName -Name $SecretName -SecretValue (ConvertTo-SecureString $NewSecret -AsPlainText -Force)

# Trigger service restart via webhook
Invoke-WebRequest -Uri "https://your-webhook-url.com/restart" -Method POST
```

### GitHub Actions Workflow

Create `.github/workflows/secret-rotation.yml`:

```yaml
name: Scheduled Secret Rotation

on:
  schedule:
    - cron: '0 0 1 * *'  # First day of each month
  workflow_dispatch:  # Manual trigger

jobs:
  rotate-secrets:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Rotate Secrets
        run: |
          # Rotate secrets script
          ./scripts/rotate-secrets.sh

      - name: Restart Services
        run: |
          az aks get-credentials --resource-group applyforus-prod-rg --name applyforus-prod-aks
          kubectl rollout restart deployment -l tier=backend -n applyforus
```

---

## Monitoring and Alerts

### Set Up Rotation Alerts

```bash
# Alert when secret is older than 80 days
az monitor metrics alert create \
  --name secret-rotation-alert \
  --resource-group applyforus-prod-rg \
  --scopes /subscriptions/<SUB_ID>/resourceGroups/applyforus-prod-rg/providers/Microsoft.KeyVault/vaults/applyforus-kv \
  --condition "count SecretNearExpiry > 0" \
  --window-size 1h \
  --evaluation-frequency 1h \
  --action-group-id <ACTION_GROUP_ID>
```

### Audit Rotation History

```bash
# List all versions of a secret
az keyvault secret list-versions \
  --vault-name $VAULT_NAME \
  --name jwt-secret \
  --query "[].{Created:attributes.created, Updated:attributes.updated, Enabled:attributes.enabled}" \
  -o table

# View rotation audit logs
az monitor activity-log list \
  --resource-group applyforus-prod-rg \
  --resource-type Microsoft.KeyVault/vaults \
  --query "[?operationName.localizedValue=='Set Secret'].{Time:eventTimestamp, Secret:resourceId, User:caller}" \
  -o table
```

---

## Best Practices

### ✅ DO

- Rotate secrets on a regular schedule
- Document rotation procedures
- Test rotation in staging first
- Monitor services after rotation
- Keep rotation audit logs
- Use strong random values
- Tag secrets with rotation metadata

### ❌ DON'T

- Rotate multiple critical secrets simultaneously
- Skip testing before production rotation
- Ignore service errors after rotation
- Use predictable secret patterns
- Rotate without proper monitoring
- Delete old secret versions immediately

---

## Quick Reference

```bash
# Generate strong secrets
openssl rand -base64 64          # 512-bit secret
openssl rand -hex 32             # 256-bit hex key
uuidgen                          # UUID v4

# Update secret in Key Vault
az keyvault secret set --vault-name $VAULT_NAME --name <name> --value "<value>"

# Restart service
kubectl rollout restart deployment/<service> -n applyforus

# Monitor rollout
kubectl rollout status deployment/<service> -n applyforus

# Check logs
kubectl logs -l app=<service> -n applyforus --tail=100 --follow

# Verify secret sync
kubectl get secretproviderclasspodstatus -n applyforus
```

---

## Support

For issues with secret rotation:

1. Check service logs: `kubectl logs -l app=<service> -n applyforus`
2. Verify Key Vault access: `az keyvault show --name applyforus-kv`
3. Review CSI Driver status: `kubectl get pods -n kube-system -l app=secrets-store-csi-driver`
4. Consult main documentation: `docs/SECRET_MANAGEMENT.md`
