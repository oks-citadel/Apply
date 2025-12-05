# Azure Key Vault Secrets Documentation

This document describes all secrets that need to be configured in Azure Key Vault for the JobPilot Platform.

## Overview

Secrets are automatically created by the Bicep infrastructure deployment, but many need to be updated with actual values. This document provides guidance on generating and managing these secrets.

## Secret Naming Convention

Secrets use dash-separated naming (e.g., `DATABASE-URL`) to comply with Key Vault naming requirements.

## Secrets by Category

### Database Secrets

#### `DATABASE-URL`

**Description:** PostgreSQL connection string for the application database

**Format:**
```
Server=tcp:{server-name}.database.windows.net,1433;Initial Catalog={database-name};Persist Security Info=False;User ID={username};Password={password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**Auto-populated:** Yes (by infrastructure deployment)

**Example:**
```
Server=tcp:jobpilot-prod-sql-abc123.database.windows.net,1433;Initial Catalog=jobpilot_prod;Persist Security Info=False;User ID=sqladmin;Password=YourSecurePassword123!;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
```

**How to Generate:**
- Created automatically by Bicep template
- Uses credentials from shared Key Vault

**Rotation:** Every 180 days

---

### Cache Secrets

#### `REDIS-URL`

**Description:** Redis connection string for caching and session storage

**Format:**
```
{hostname}:{port},password={password},ssl=True,abortConnect=False
```

**Auto-populated:** Yes (by infrastructure deployment)

**Example:**
```
jobpilot-prod-redis-abc123.redis.cache.windows.net:6380,password=YourRedisKey==,ssl=True,abortConnect=False
```

**How to Generate:**
- Created automatically by Bicep template
- Uses primary key from Azure Cache for Redis

**Rotation:** Every 90 days

---

### Authentication & Security Secrets

#### `JWT-SECRET`

**Description:** Secret key for signing JWT access tokens

**Format:** High-entropy random string (at least 64 characters)

**Auto-populated:** No (placeholder created)

**How to Generate:**
```bash
# Linux/Mac
openssl rand -base64 64

# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**Example:**
```
zK9mP2nQ5rS8tU1vW3xY6aB0cD4eF7gH9iJ2kL5mN8oP1qR4sT7uV0wX3yZ6aC9bE2dG5hI8jK1lM4nO7pQ0r
```

**Rotation:** Every 90 days

**⚠️ IMPORTANT:** Never commit this to source control!

---

#### `REFRESH-TOKEN-SECRET`

**Description:** Secret key for signing refresh tokens (should be different from JWT_SECRET)

**Format:** High-entropy random string (at least 64 characters)

**Auto-populated:** No (needs manual creation)

**How to Generate:** Same as JWT-SECRET (use a different value)

**Rotation:** Every 90 days

---

#### `SESSION-SECRET`

**Description:** Secret for encrypting session data

**Format:** Random string (at least 32 characters)

**Auto-populated:** No (placeholder created)

**How to Generate:**
```bash
openssl rand -hex 32
```

**Example:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Rotation:** Every 90 days

---

#### `ENCRYPTION-KEY`

**Description:** Key for encrypting sensitive data at rest (e.g., user PII)

**Format:** 256-bit key encoded as base64

**Auto-populated:** No (placeholder created)

**How to Generate:**
```bash
# Generate 256-bit key
openssl rand -base64 32
```

**Example:**
```
XrUv8x/A%D*G-KaPdSgVkYp3s6v9y$B&E(H+MbQeThW
```

**Rotation:** Every 180 days (requires data re-encryption)

**⚠️ CRITICAL:** Backup old key before rotation - needed to decrypt existing data!

---

### API Keys

#### `OPENAI-API-KEY`

**Description:** OpenAI API key for AI features (resume parsing, cover letter generation)

**Format:** OpenAI API key format (starts with `sk-`)

**Auto-populated:** No (placeholder created)

**How to Obtain:**
1. Visit https://platform.openai.com/account/api-keys
2. Create new secret key
3. Copy immediately (won't be shown again)

**Example:**
```
sk-proj-1234567890abcdefghijklmnopqrstuvwxyz1234567890
```

**Rotation:** Every 90 days or immediately if compromised

**Cost Monitoring:** Set up billing alerts in OpenAI dashboard

---

### Azure Service Integration

#### `SERVICE-BUS-CONNECTION-STRING`

**Description:** Azure Service Bus connection string for message queuing

**Auto-populated:** Yes (by infrastructure deployment)

**Format:**
```
Endpoint=sb://{namespace}.servicebus.windows.net/;SharedAccessKeyName={policy-name};SharedAccessKey={key}
```

**Example:**
```
Endpoint=sb://jobpilot-prod-sb-abc123.servicebus.windows.net/;SharedAccessKeyName=SendListenPolicy;SharedAccessKey=YourServiceBusKey=
```

**Rotation:** Every 90 days

---

#### `APPINSIGHTS-INSTRUMENTATION-KEY`

**Description:** Application Insights instrumentation key for monitoring

**Auto-populated:** Yes (by infrastructure deployment)

**Format:** GUID

**Example:**
```
12345678-1234-1234-1234-123456789abc
```

**Note:** Modern apps should use connection string instead, but key is kept for backward compatibility.

---

#### `ACR-USERNAME`

**Description:** Azure Container Registry admin username

**Auto-populated:** Yes (by infrastructure deployment)

**Example:**
```
jobpilotprodacr123456
```

---

#### `ACR-PASSWORD`

**Description:** Azure Container Registry admin password

**Auto-populated:** Yes (by infrastructure deployment)

**Security Note:** Consider using managed identity instead of admin credentials in production.

---

### Email & Communication (Optional)

#### `SENDGRID-API-KEY`

**Description:** SendGrid API key for transactional emails

**Auto-populated:** No (optional)

**How to Obtain:**
1. Create SendGrid account
2. Navigate to Settings > API Keys
3. Create new API key with appropriate permissions

**Format:**
```
SG.{random-string}
```

**Rotation:** Every 90 days

---

#### `SLACK-WEBHOOK-URL`

**Description:** Slack webhook URL for notifications and alerts

**Auto-populated:** No (optional)

**How to Obtain:**
1. Create Slack app
2. Enable Incoming Webhooks
3. Add webhook to workspace

**Format:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

---

## Secret Management

### Adding Secrets to Key Vault

#### Via Azure Portal

1. Navigate to Key Vault in Azure Portal
2. Select "Secrets" from the left menu
3. Click "+ Generate/Import"
4. Enter name and value
5. Click "Create"

#### Via Azure CLI

```bash
# Set secret
az keyvault secret set \
  --vault-name jobpilot-prod-kv-abc123 \
  --name JWT-SECRET \
  --value "your-secret-value"

# Verify secret
az keyvault secret show \
  --vault-name jobpilot-prod-kv-abc123 \
  --name JWT-SECRET \
  --query value -o tsv
```

#### Via PowerShell

```powershell
# Set secret
$secretValue = ConvertTo-SecureString "your-secret-value" -AsPlainText -Force
Set-AzKeyVaultSecret `
  -VaultName "jobpilot-prod-kv-abc123" `
  -Name "JWT-SECRET" `
  -SecretValue $secretValue

# Verify secret
Get-AzKeyVaultSecret `
  -VaultName "jobpilot-prod-kv-abc123" `
  -Name "JWT-SECRET" `
  -AsPlainText
```

### Secret Rotation Procedure

1. **Generate new secret** using appropriate method
2. **Add as new version** in Key Vault (don't delete old one yet)
3. **Update Application Settings** to reference new version
4. **Restart applications** to pick up new secret
5. **Monitor** for 24 hours to ensure no issues
6. **Disable old version** (don't delete - keep for emergency rollback)
7. **After 30 days**, delete old version if no issues

### Automated Secret Rotation

Consider implementing automated rotation for:
- Database passwords (using Azure SQL managed identity)
- Service Bus keys (using managed identity)
- Storage account keys (using managed identity)

### Emergency Secret Rotation

If a secret is compromised:

1. **Immediately** generate and deploy new secret
2. **Revoke** old secret/key
3. **Audit** access logs to determine extent of compromise
4. **Notify** security team and stakeholders
5. **Update** incident response documentation

## Access Control

### Key Vault Access Policies

**App Services** (Managed Identity):
- Permissions: Get, List secrets
- Purpose: Read secrets at runtime

**DevOps Service Principal**:
- Permissions: Get, List secrets
- Purpose: Deploy applications with secret references

**Administrators**:
- Permissions: All secret operations
- Purpose: Manage secrets

**Developers** (Dev/Staging only):
- Permissions: Get, List secrets
- Purpose: Debug and test

### Best Practices

1. **Never commit secrets to Git**
   - Use .gitignore for .env files
   - Scan commits for accidentally committed secrets

2. **Use different secrets per environment**
   - Dev secrets should never work in production
   - Generate unique secrets for each environment

3. **Implement least privilege**
   - Grant minimum required permissions
   - Use managed identities when possible

4. **Enable audit logging**
   - Monitor all secret access
   - Alert on unusual access patterns

5. **Regular rotation schedule**
   - Follow rotation intervals in this document
   - Automate where possible

6. **Backup and recovery**
   - Document secret generation procedures
   - Keep encrypted backups of critical secrets
   - Test recovery procedures

## Monitoring

### Key Vault Metrics to Monitor

- Secret access frequency
- Failed authentication attempts
- Latency of secret retrieval
- Number of active secret versions

### Alerts to Configure

1. **Suspicious Access Patterns**
   - Access from unexpected IP addresses
   - High volume of secret retrievals
   - Access to disabled secrets

2. **Approaching Expiration**
   - Alert 30 days before secret expiration
   - Alert 7 days before secret expiration

3. **Failed Access Attempts**
   - Multiple failed authentication attempts
   - Access denied due to policy violations

## Troubleshooting

### Issue: Application cannot access Key Vault

**Check:**
1. Managed identity is enabled on App Service
2. Access policy exists for the managed identity
3. Network firewall rules allow access
4. Secret name is correct (case-sensitive)

### Issue: Old secret version being used

**Solution:**
1. Update application configuration to reference new version
2. Restart application
3. Clear any caches

### Issue: Secret rotation causing downtime

**Solution:**
1. Implement zero-downtime rotation
2. Use multiple instances with rolling updates
3. Test rotation in staging first

## Compliance & Auditing

### SOC 2 Requirements

- Enable diagnostic logging
- Export logs to SIEM
- Implement access reviews (quarterly)
- Document secret rotation procedures

### GDPR Considerations

- Encrypt secrets containing PII
- Implement data retention policies
- Provide secret access audit trails
- Support right to erasure

## References

- [Azure Key Vault Best Practices](https://docs.microsoft.com/en-us/azure/key-vault/general/best-practices)
- [Managed Identities](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/overview)
- [Secret Rotation](https://docs.microsoft.com/en-us/azure/key-vault/secrets/tutorial-rotation)
