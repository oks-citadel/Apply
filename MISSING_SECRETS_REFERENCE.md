# Missing Azure Key Vault Secrets - Quick Reference

**Generated:** 2025-12-16
**Key Vault:** applyforus-keyvault

---

## CRITICAL SECRETS (Must have before deployment)

### OAuth Providers (6 secrets)

```bash
# Google OAuth
az keyvault secret set --vault-name applyforus-keyvault --name GOOGLE-CLIENT-ID --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name GOOGLE-CLIENT-SECRET --value "YOUR_VALUE"

# LinkedIn OAuth
az keyvault secret set --vault-name applyforus-keyvault --name LINKEDIN-CLIENT-ID --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name LINKEDIN-CLIENT-SECRET --value "YOUR_VALUE"

# GitHub OAuth
az keyvault secret set --vault-name applyforus-keyvault --name GITHUB-CLIENT-ID --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name GITHUB-CLIENT-SECRET --value "YOUR_VALUE"
```

**Required by:** auth-service, mobile app
**Impact if missing:** Users cannot log in via social providers

---

### Azure Blob Storage (3 secrets)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-ACCOUNT-NAME --value "applyforusstorage"
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-ACCOUNT-KEY --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-CONNECTION-STRING --value "YOUR_VALUE"
```

**Required by:** resume-service, user-service
**Impact if missing:** Cannot upload resumes, profile photos, or documents

---

### Stripe Payment (2 secrets)

```bash
# Already have: STRIPE-SECRET-KEY
az keyvault secret set --vault-name applyforus-keyvault --name STRIPE-PUBLISHABLE-KEY --value "pk_test_..."
az keyvault secret set --vault-name applyforus-keyvault --name STRIPE-WEBHOOK-SECRET --value "whsec_..."
```

**Required by:** payment-service, user-service, web, employer
**Impact if missing:** Cannot process payments or subscriptions

---

### Firebase Push Notifications (8 secrets)

```bash
# Firebase Cloud Messaging
az keyvault secret set --vault-name applyforus-keyvault --name FCM-SERVICE-ACCOUNT --value '{"type":"service_account",...}'

# Firebase Web Config
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-API-KEY --value "AIzaSy..."
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-AUTH-DOMAIN --value "applyforus.firebaseapp.com"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-PROJECT-ID --value "applyforus"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-STORAGE-BUCKET --value "applyforus.appspot.com"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-MESSAGING-SENDER-ID --value "123456789"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-APP-ID --value "1:123456789:web:abc"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-VAPID-KEY --value "BNe..."
```

**Required by:** notification-service, web, mobile
**Impact if missing:** No push notifications

---

## HIGH PRIORITY SECRETS (Important features)

### Apple Push Notifications (3 secrets)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name APNS-KEY-ID --value "YOUR_KEY_ID"
az keyvault secret set --vault-name applyforus-keyvault --name APNS-TEAM-ID --value "YOUR_TEAM_ID"
az keyvault secret set --vault-name applyforus-keyvault --name APNS-KEY --value "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

**Required by:** notification-service
**Impact if missing:** No push notifications on iOS

---

### AI Services (2 secrets)

```bash
# Already have: OPENAI-API-KEY
az keyvault secret set --vault-name applyforus-keyvault --name ANTHROPIC-API-KEY --value "sk-ant-..."
az keyvault secret set --vault-name applyforus-keyvault --name PINECONE-API-KEY --value "YOUR_VALUE"
```

**Required by:** ai-service
**Impact if missing:** Limited AI features, no semantic search

---

### Additional Payment Providers (6 secrets)

```bash
# Paystack (African markets)
az keyvault secret set --vault-name applyforus-keyvault --name PAYSTACK-SECRET-KEY --value "sk_test_..."
az keyvault secret set --vault-name applyforus-keyvault --name PAYSTACK-PUBLIC-KEY --value "pk_test_..."

# Flutterwave (African markets)
az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-SECRET-KEY --value "FLWSECK_TEST-..."
az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-PUBLIC-KEY --value "FLWPUBK_TEST-..."
az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-ENCRYPTION-KEY --value "FLWSECK_TEST..."
az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-WEBHOOK-SECRET --value "YOUR_VALUE"
```

**Required by:** payment-service
**Impact if missing:** Limited payment options (Stripe only)

---

## MEDIUM PRIORITY SECRETS (Optional features)

### Elasticsearch (1 secret)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name ELASTICSEARCH-PASSWORD --value "YOUR_VALUE"
```

**Required by:** job-service
**Impact if missing:** Job search uses PostgreSQL instead (slower)

---

### RabbitMQ (1 secret)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name RABBITMQ-URL --value "amqp://user:pass@host:5672"
```

**Required by:** payment-service
**Impact if missing:** Payment events not published (but payment still works)

---

### Security (2 secrets)

```bash
# Already have: JWT-SECRET, SESSION-SECRET
az keyvault secret set --vault-name applyforus-keyvault --name CSRF-SECRET --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name API-KEY-SECRET --value "YOUR_VALUE"
```

**Required by:** auth-service, payment-service
**Impact if missing:** CSRF protection disabled, inter-service auth disabled

---

## LOW PRIORITY SECRETS (Nice to have)

### Job Aggregation APIs (3 secrets)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name INDEED-API-KEY --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name LINKEDIN-API-KEY --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name GLASSDOOR-API-KEY --value "YOUR_VALUE"
```

**Required by:** job-service
**Impact if missing:** Fewer job listings

---

### AWS S3 (Fallback - 2 secrets)

```bash
az keyvault secret set --vault-name applyforus-keyvault --name AWS-ACCESS-KEY-ID --value "YOUR_VALUE"
az keyvault secret set --vault-name applyforus-keyvault --name AWS-SECRET-ACCESS-KEY --value "YOUR_VALUE"
```

**Required by:** resume-service (fallback)
**Impact if missing:** None (using Azure Blob Storage)

---

## SECRETS ALREADY IN KEY VAULT (13)

These are already configured and do NOT need to be added:

```bash
# Database
DB-CONNECTION-STRING
DB-DATABASE
DB-HOST
DB-PASSWORD
DB-PORT
DB-USERNAME

# Security
ENCRYPTION-KEY
JWT-SECRET
SESSION-SECRET

# External Services
OPENAI-API-KEY
REDIS-PASSWORD
SENDGRID-API-KEY
STRIPE-SECRET-KEY
```

---

## QUICK ADD SCRIPT

Save this as `add-secrets.sh`:

```bash
#!/bin/bash

VAULT_NAME="applyforus-keyvault"

# Function to add secret with prompt
add_secret() {
  local SECRET_NAME=$1
  local PROMPT=$2

  echo "Enter value for $SECRET_NAME ($PROMPT):"
  read -r SECRET_VALUE

  if [ -n "$SECRET_VALUE" ]; then
    az keyvault secret set --vault-name "$VAULT_NAME" --name "$SECRET_NAME" --value "$SECRET_VALUE"
    echo "✓ Added $SECRET_NAME"
  else
    echo "✗ Skipped $SECRET_NAME (empty value)"
  fi
  echo ""
}

echo "=================================="
echo "Azure Key Vault Secret Setup"
echo "Vault: $VAULT_NAME"
echo "=================================="
echo ""

# OAuth
echo "--- OAuth Credentials ---"
add_secret "GOOGLE-CLIENT-ID" "from Google Cloud Console"
add_secret "GOOGLE-CLIENT-SECRET" "from Google Cloud Console"
add_secret "LINKEDIN-CLIENT-ID" "from LinkedIn Developers"
add_secret "LINKEDIN-CLIENT-SECRET" "from LinkedIn Developers"
add_secret "GITHUB-CLIENT-ID" "from GitHub Settings"
add_secret "GITHUB-CLIENT-SECRET" "from GitHub Settings"

# Azure Storage
echo "--- Azure Blob Storage ---"
add_secret "AZURE-STORAGE-ACCOUNT-NAME" "e.g., applyforusstorage"
add_secret "AZURE-STORAGE-ACCOUNT-KEY" "from Azure Portal"
add_secret "AZURE-STORAGE-CONNECTION-STRING" "from Azure Portal"

# Stripe
echo "--- Stripe Payment ---"
add_secret "STRIPE-PUBLISHABLE-KEY" "pk_test_... or pk_live_..."
add_secret "STRIPE-WEBHOOK-SECRET" "whsec_..."

# Firebase
echo "--- Firebase ---"
add_secret "FCM-SERVICE-ACCOUNT" "entire JSON from Firebase"
add_secret "FIREBASE-API-KEY" "from Firebase project settings"
add_secret "FIREBASE-AUTH-DOMAIN" "from Firebase project settings"
add_secret "FIREBASE-PROJECT-ID" "from Firebase project settings"
add_secret "FIREBASE-STORAGE-BUCKET" "from Firebase project settings"
add_secret "FIREBASE-MESSAGING-SENDER-ID" "from Firebase project settings"
add_secret "FIREBASE-APP-ID" "from Firebase project settings"
add_secret "FIREBASE-VAPID-KEY" "from Firebase Cloud Messaging"

echo "=================================="
echo "Secret setup complete!"
echo "=================================="
```

Make executable and run:
```bash
chmod +x add-secrets.sh
./add-secrets.sh
```

---

## VERIFICATION

Check all secrets:

```bash
# List all secrets
az keyvault secret list --vault-name applyforus-keyvault --query "[].name" -o table

# Count secrets
az keyvault secret list --vault-name applyforus-keyvault --query "length([])

# Check specific secret (without showing value)
az keyvault secret show --vault-name applyforus-keyvault --name GOOGLE-CLIENT-ID --query "name"
```

---

## SECRET USAGE MATRIX

| Secret | auth-service | user-service | job-service | payment-service | notification-service | ai-service | resume-service | web | mobile |
|--------|--------------|--------------|-------------|-----------------|---------------------|------------|----------------|-----|--------|
| GOOGLE-CLIENT-ID | ✓ | | | | | | | | ✓ |
| GOOGLE-CLIENT-SECRET | ✓ | | | | | | | | |
| LINKEDIN-CLIENT-ID | ✓ | | | | | | | | ✓ |
| LINKEDIN-CLIENT-SECRET | ✓ | | | | | | | | |
| GITHUB-CLIENT-ID | ✓ | | | | | | | | |
| GITHUB-CLIENT-SECRET | ✓ | | | | | | | | |
| STRIPE-PUBLISHABLE-KEY | | ✓ | | | | | | ✓ | |
| STRIPE-WEBHOOK-SECRET | | ✓ | | ✓ | | | | | |
| PAYSTACK-SECRET-KEY | | | | ✓ | | | | | |
| PAYSTACK-PUBLIC-KEY | | | | ✓ | | | | | |
| FLUTTERWAVE-SECRET-KEY | | | | ✓ | | | | | |
| FLUTTERWAVE-PUBLIC-KEY | | | | ✓ | | | | | |
| FLUTTERWAVE-ENCRYPTION-KEY | | | | ✓ | | | | | |
| AZURE-STORAGE-ACCOUNT-NAME | | ✓ | | | | | ✓ | | |
| AZURE-STORAGE-ACCOUNT-KEY | | ✓ | | | | | ✓ | | |
| AZURE-STORAGE-CONNECTION-STRING | | ✓ | | | | | ✓ | | |
| FCM-SERVICE-ACCOUNT | | | | | ✓ | | | | |
| FIREBASE-API-KEY | | | | | | | | ✓ | ✓ |
| FIREBASE-* (all 7) | | | | | | | | ✓ | ✓ |
| APNS-KEY-ID | | | | | ✓ | | | | |
| APNS-TEAM-ID | | | | | ✓ | | | | |
| APNS-KEY | | | | | ✓ | | | | |
| ANTHROPIC-API-KEY | | | | | | ✓ | | | |
| PINECONE-API-KEY | | | | | | ✓ | | | |
| ELASTICSEARCH-PASSWORD | | | ✓ | | | | | | |
| RABBITMQ-URL | | | | ✓ | | | | | |

---

## PRIORITY ORDER FOR ADDING SECRETS

1. **Phase 1 - Critical (Can't deploy without):**
   - OAuth credentials (6 secrets)
   - Azure Blob Storage (3 secrets)
   - Stripe keys (2 secrets)

2. **Phase 2 - High Priority (Core features):**
   - Firebase (8 secrets)
   - APNs (3 secrets)

3. **Phase 3 - Medium Priority (Enhanced features):**
   - AI services (2 secrets)
   - Alternative payments (6 secrets)

4. **Phase 4 - Low Priority (Optional):**
   - Elasticsearch (1 secret)
   - RabbitMQ (1 secret)
   - Job APIs (3 secrets)

---

## NOTES

- All secrets should use production values in production environments
- Test/sandbox values should be used in development/staging
- Secrets are automatically mounted to pods via Azure Key Vault integration
- After adding secrets, restart affected pods: `kubectl rollout restart deployment/<name> -n applyforus`
- Some secrets (like Firebase service account) are JSON strings - ensure proper escaping
- For P8 files (APNs), include the entire file content with actual `\n` for newlines

---

## GETTING HELP

- **OAuth setup guides:** See `DEPLOYMENT_BLOCKERS_CHECKLIST.md` Phase 2
- **Azure Storage setup:** See `DEPLOYMENT_BLOCKERS_CHECKLIST.md` Phase 3
- **Firebase setup:** See `DEPLOYMENT_BLOCKERS_CHECKLIST.md` Phase 4
- **Payment setup:** See `DEPLOYMENT_BLOCKERS_CHECKLIST.md` Phase 5
