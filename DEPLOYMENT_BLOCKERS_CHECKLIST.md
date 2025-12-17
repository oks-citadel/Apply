# Deployment Blockers - Critical Action Checklist

**Last Updated:** 2025-12-16
**Priority:** CRITICAL - Must complete before production deployment

---

## PHASE 1: BUILD MISSING DOCKER IMAGES (30 minutes)

### Status: 4/11 services missing from ACR

### Action:
```bash
# Trigger the GitHub Actions workflow
# Go to: https://github.com/YOUR_ORG/Job-Apply-Platform/actions/workflows/build-images.yml
# Click "Run workflow" → "Run workflow"
```

### Expected Results:
- [ ] applyai-resume-service:sha-XXXXXXXX
- [ ] applyai-auto-apply-service:sha-XXXXXXXX
- [ ] applyai-payment-service:sha-XXXXXXXX
- [ ] applyai-orchestrator-service:sha-XXXXXXXX

### Verification:
```bash
# Check ACR for new images
az acr repository list --name applyforusacr --output table
az acr repository show-tags --name applyforusacr --repository applyai-resume-service
az acr repository show-tags --name applyforusacr --repository applyai-auto-apply-service
az acr repository show-tags --name applyforusacr --repository applyai-payment-service
az acr repository show-tags --name applyforusacr --repository applyai-orchestrator-service
```

---

## PHASE 2: CONFIGURE OAUTH PROVIDERS (2-3 hours)

### 2.1 Google OAuth (Required for Google Sign-In)

1. **Create OAuth App:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Create Project: "ApplyForUs"
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - Development: `http://localhost:8001/api/v1/auth/google/callback`
     - Production: `https://api.applyforus.com/api/v1/auth/google/callback`

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name GOOGLE-CLIENT-ID --value "YOUR_CLIENT_ID"
   az keyvault secret set --vault-name applyforus-keyvault --name GOOGLE-CLIENT-SECRET --value "YOUR_CLIENT_SECRET"
   ```

3. **Update K8s Secrets:**
   - [ ] Restart auth-service pods to pick up new secrets

### 2.2 LinkedIn OAuth (Required for LinkedIn Sign-In + Job Data)

1. **Create OAuth App:**
   - Go to: https://www.linkedin.com/developers/apps
   - Create App: "ApplyForUs"
   - Products: Sign In with LinkedIn, Marketing Developer Platform
   - Authorized redirect URLs:
     - Development: `http://localhost:8001/api/v1/auth/linkedin/callback`
     - Production: `https://api.applyforus.com/api/v1/auth/linkedin/callback`

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name LINKEDIN-CLIENT-ID --value "YOUR_CLIENT_ID"
   az keyvault secret set --vault-name applyforus-keyvault --name LINKEDIN-CLIENT-SECRET --value "YOUR_CLIENT_SECRET"
   ```

### 2.3 GitHub OAuth (Required for GitHub Sign-In)

1. **Create OAuth App:**
   - Go to: https://github.com/settings/developers
   - New OAuth App
   - Authorization callback URL:
     - Development: `http://localhost:8001/api/v1/auth/github/callback`
     - Production: `https://api.applyforus.com/api/v1/auth/github/callback`

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name GITHUB-CLIENT-ID --value "YOUR_CLIENT_ID"
   az keyvault secret set --vault-name applyforus-keyvault --name GITHUB-CLIENT-SECRET --value "YOUR_CLIENT_SECRET"
   ```

### Checklist:
- [ ] Google OAuth configured
- [ ] LinkedIn OAuth configured
- [ ] GitHub OAuth configured
- [ ] All secrets in Azure Key Vault
- [ ] Callback URLs registered
- [ ] Scopes configured correctly

---

## PHASE 3: AZURE BLOB STORAGE (1 hour)

### Required for: Resume uploads, profile photos, document storage

### 3.1 Create Storage Account

```bash
# Create storage account
az storage account create \
  --name applyforusstorage \
  --resource-group applyforus-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --encryption-services blob \
  --https-only true

# Get connection string
az storage account show-connection-string \
  --name applyforusstorage \
  --resource-group applyforus-rg \
  --output tsv

# Get account key
az storage account keys list \
  --account-name applyforusstorage \
  --resource-group applyforus-rg \
  --query '[0].value' \
  --output tsv
```

### 3.2 Create Blob Containers

```bash
# Set environment variable
STORAGE_CONNECTION_STRING="<connection-string-from-above>"

# Create containers
az storage container create --name resumes --connection-string "$STORAGE_CONNECTION_STRING"
az storage container create --name parsed-resumes --connection-string "$STORAGE_CONNECTION_STRING"
az storage container create --name generated-resumes --connection-string "$STORAGE_CONNECTION_STRING"
az storage container create --name user-uploads --connection-string "$STORAGE_CONNECTION_STRING"
az storage container create --name profile-photos --connection-string "$STORAGE_CONNECTION_STRING"

# Set CORS rules (for web uploads)
az storage cors add \
  --services b \
  --methods GET POST PUT \
  --origins "https://applyforus.com" "http://localhost:3000" \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --connection-string "$STORAGE_CONNECTION_STRING"
```

### 3.3 Add to Azure Key Vault

```bash
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-ACCOUNT-NAME --value "applyforusstorage"
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-ACCOUNT-KEY --value "<account-key>"
az keyvault secret set --vault-name applyforus-keyvault --name AZURE-STORAGE-CONNECTION-STRING --value "<connection-string>"
```

### Checklist:
- [ ] Storage account created
- [ ] 5 blob containers created
- [ ] CORS rules configured
- [ ] Secrets in Azure Key Vault
- [ ] Verify access from resume-service
- [ ] Verify access from user-service

---

## PHASE 4: FIREBASE PUSH NOTIFICATIONS (2 hours)

### Required for: Mobile app notifications, web push notifications

### 4.1 Create Firebase Project

1. **Create Project:**
   - Go to: https://console.firebase.google.com
   - Create project: "ApplyForUs"
   - Enable Google Analytics (optional)

2. **Add Web App:**
   - Project Settings → Your apps → Add app → Web
   - Register app: "ApplyForUs Web"
   - Copy configuration (7 values)

3. **Add Android App:**
   - Project Settings → Your apps → Add app → Android
   - Package name: `com.applyforus.app`
   - Download `google-services.json` → Place in `apps/mobile/android/`

4. **Add iOS App:**
   - Project Settings → Your apps → Add app → iOS
   - Bundle ID: `com.applyforus.app`
   - Download `GoogleService-Info.plist` → Place in `apps/mobile/ios/`

### 4.2 Enable Cloud Messaging

1. **Generate Server Key:**
   - Project Settings → Cloud Messaging
   - Generate Server Key (Legacy) - Copy this

2. **Generate Service Account:**
   - Project Settings → Service Accounts
   - Generate New Private Key → Download JSON

3. **Get VAPID Key (for web):**
   - Project Settings → Cloud Messaging → Web configuration
   - Generate Key Pair → Copy VAPID key

### 4.3 Add to Azure Key Vault

```bash
# FCM Service Account (entire JSON as string)
az keyvault secret set --vault-name applyforus-keyvault --name FCM-SERVICE-ACCOUNT --value '{"type":"service_account","project_id":"..."}'

# Firebase Web Config
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-API-KEY --value "AIzaSy..."
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-AUTH-DOMAIN --value "applyforus.firebaseapp.com"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-PROJECT-ID --value "applyforus"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-STORAGE-BUCKET --value "applyforus.appspot.com"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-MESSAGING-SENDER-ID --value "123456789"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-APP-ID --value "1:123456789:web:abc"
az keyvault secret set --vault-name applyforus-keyvault --name FIREBASE-VAPID-KEY --value "BNe..."
```

### 4.4 Configure APNs (Apple Push Notification Service)

1. **Apple Developer Portal:**
   - Go to: https://developer.apple.com/account
   - Certificates, Identifiers & Profiles
   - Keys → Create new key
   - Enable: Apple Push Notifications service (APNs)
   - Download .p8 file
   - Note: Key ID, Team ID

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name APNS-KEY-ID --value "YOUR_KEY_ID"
   az keyvault secret set --vault-name applyforus-keyvault --name APNS-TEAM-ID --value "YOUR_TEAM_ID"
   az keyvault secret set --vault-name applyforus-keyvault --name APNS-KEY --value "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### Checklist:
- [ ] Firebase project created
- [ ] Web app configured
- [ ] Android app configured (google-services.json downloaded)
- [ ] iOS app configured (GoogleService-Info.plist downloaded)
- [ ] FCM service account in Key Vault
- [ ] Firebase web config (7 values) in Key Vault
- [ ] APNs credentials in Key Vault
- [ ] Test push notification from Firebase console

---

## PHASE 5: PAYMENT CONFIGURATION (1 hour)

### 5.1 Stripe (Already partially configured)

1. **Get Missing Keys:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy Publishable Key: `pk_test_...` or `pk_live_...`
   - Already have Secret Key in Key Vault

2. **Configure Webhooks:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://api.applyforus.com/api/v1/payments/stripe/webhook`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy webhook signing secret

3. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name STRIPE-PUBLISHABLE-KEY --value "pk_test_..."
   az keyvault secret set --vault-name applyforus-keyvault --name STRIPE-WEBHOOK-SECRET --value "whsec_..."
   ```

### 5.2 Paystack (Optional - African Markets)

1. **Create Account:**
   - Go to: https://dashboard.paystack.com
   - Settings → API Keys & Webhooks
   - Copy Secret Key and Public Key

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name PAYSTACK-SECRET-KEY --value "sk_test_..."
   az keyvault secret set --vault-name applyforus-keyvault --name PAYSTACK-PUBLIC-KEY --value "pk_test_..."
   ```

### 5.3 Flutterwave (Optional - African Markets)

1. **Create Account:**
   - Go to: https://dashboard.flutterwave.com
   - Settings → API
   - Copy Secret Key, Public Key, Encryption Key

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-SECRET-KEY --value "FLWSECK_TEST-..."
   az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-PUBLIC-KEY --value "FLWPUBK_TEST-..."
   az keyvault secret set --vault-name applyforus-keyvault --name FLUTTERWAVE-ENCRYPTION-KEY --value "FLWSECK_TEST..."
   ```

### Checklist:
- [ ] Stripe publishable key in Key Vault
- [ ] Stripe webhook configured and secret in Key Vault
- [ ] (Optional) Paystack configured
- [ ] (Optional) Flutterwave configured
- [ ] Test payment flow in development

---

## PHASE 6: AI SERVICES (1 hour)

### 6.1 Anthropic Claude (Optional but recommended)

1. **Create Account:**
   - Go to: https://console.anthropic.com
   - Get API key

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name ANTHROPIC-API-KEY --value "sk-ant-..."
   ```

### 6.2 Pinecone Vector Database (Optional - for semantic search)

1. **Create Account:**
   - Go to: https://app.pinecone.io
   - Create index: `applyforus-vectors`
   - Dimensions: 1536 (for OpenAI embeddings)
   - Metric: cosine
   - Copy API key and environment

2. **Add to Azure Key Vault:**
   ```bash
   az keyvault secret set --vault-name applyforus-keyvault --name PINECONE-API-KEY --value "YOUR_API_KEY"
   ```

3. **Update ai-service config:**
   - PINECONE_ENVIRONMENT: `us-west1-gcp` (or your region)
   - PINECONE_INDEX_NAME: `applyforus-vectors`

### Checklist:
- [ ] Anthropic API key in Key Vault
- [ ] Pinecone index created
- [ ] Pinecone API key in Key Vault
- [ ] Verify ai-service can connect

---

## PHASE 7: VERIFICATION & TESTING (1 hour)

### 7.1 Verify All Services Can Start

```bash
# Check pod status
kubectl get pods -n applyforus

# Check logs for errors
kubectl logs -n applyforus -l app=auth-service --tail=100
kubectl logs -n applyforus -l app=resume-service --tail=100
kubectl logs -n applyforus -l app=notification-service --tail=100
kubectl logs -n applyforus -l app=payment-service --tail=100
```

### 7.2 Test Critical Paths

1. **OAuth Login:**
   - [ ] Test Google login
   - [ ] Test LinkedIn login
   - [ ] Test GitHub login

2. **File Upload:**
   - [ ] Test resume upload
   - [ ] Test profile photo upload
   - [ ] Verify files in Azure Blob Storage

3. **Push Notifications:**
   - [ ] Test web push notification
   - [ ] Test mobile push notification (if app built)

4. **Payments:**
   - [ ] Test Stripe checkout
   - [ ] Test webhook delivery
   - [ ] Verify subscription creation

### 7.3 Check Environment Variables

```bash
# Verify secrets are loaded in pods
kubectl exec -it -n applyforus <pod-name> -- env | grep -E "GOOGLE|LINKEDIN|GITHUB|AZURE|FIREBASE|STRIPE"
```

### Checklist:
- [ ] All pods running (0 CrashLoopBackOff)
- [ ] OAuth flows working
- [ ] File uploads working
- [ ] Push notifications working
- [ ] Payment flows working
- [ ] No errors in logs

---

## PHASE 8: ADMIN & EMPLOYER APPS (2 hours)

### 8.1 Update Build Workflow

Edit `.github/workflows/build-images.yml`:

```yaml
strategy:
  matrix:
    service:
      - web
      - admin          # ADD THIS
      - employer       # ADD THIS
      - auth-service
      # ... rest of services
```

### 8.2 Determine Dockerfile Paths

Update the "Determine Dockerfile path" step:

```yaml
- name: Determine Dockerfile path
  id: dockerfile
  run: |
    if [ "${{ matrix.service }}" = "web" ] || [ "${{ matrix.service }}" = "admin" ] || [ "${{ matrix.service }}" = "employer" ]; then
      echo "path=apps/${{ matrix.service }}/Dockerfile" >> $GITHUB_OUTPUT
    else
      echo "path=services/${{ matrix.service }}/Dockerfile" >> $GITHUB_OUTPUT
    fi
```

### 8.3 Create Kubernetes Deployments

Create `infrastructure/kubernetes/production/admin-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: admin
  namespace: applyforus
spec:
  replicas: 2
  selector:
    matchLabels:
      app: admin
  template:
    metadata:
      labels:
        app: admin
    spec:
      containers:
      - name: admin
        image: applyforusacr.azurecr.io/applyai-admin:sha-REPLACE_WITH_GIT_SHA
        ports:
        - containerPort: 3001
        env:
        - name: NEXT_PUBLIC_API_URL
          value: "https://api.applyforus.com"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: admin
  namespace: applyforus
spec:
  selector:
    app: admin
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

Create `infrastructure/kubernetes/production/employer-deployment.yaml` (similar to admin)

### 8.4 Build Images

```bash
# Trigger build workflow
# Should now build 13 images total (was 11)
```

### Checklist:
- [ ] Build workflow updated
- [ ] Admin K8s deployment created
- [ ] Employer K8s deployment created
- [ ] Admin K8s service created
- [ ] Employer K8s service created
- [ ] Images built and pushed to ACR
- [ ] Deployments applied to cluster

---

## FINAL VERIFICATION CHECKLIST

### Docker Images (13/13):
- [ ] applyai-web
- [ ] applyai-admin
- [ ] applyai-employer
- [ ] applyai-auth-service
- [ ] applyai-user-service
- [ ] applyai-job-service
- [ ] applyai-analytics-service
- [ ] applyai-notification-service
- [ ] applyai-ai-service
- [ ] applyai-resume-service
- [ ] applyai-auto-apply-service
- [ ] applyai-payment-service
- [ ] applyai-orchestrator-service

### Azure Key Vault Secrets (30+):
- [ ] DB credentials (6)
- [ ] JWT secrets (3)
- [ ] OAuth credentials (6)
- [ ] Payment gateway keys (8)
- [ ] Azure Storage (3)
- [ ] Firebase (8)
- [ ] AI services (2)
- [ ] SendGrid (1)
- [ ] OpenAI (1)

### External Services:
- [ ] Google OAuth
- [ ] LinkedIn OAuth
- [ ] GitHub OAuth
- [ ] Stripe
- [ ] Firebase
- [ ] Azure Blob Storage
- [ ] (Optional) Anthropic
- [ ] (Optional) Pinecone
- [ ] (Optional) Paystack
- [ ] (Optional) Flutterwave

### Kubernetes:
- [ ] All 13 services deployed
- [ ] All pods running
- [ ] Services accessible via ingress
- [ ] Secrets mounted correctly

---

## ESTIMATED TOTAL TIME: 8-12 hours

### Breakdown:
- Phase 1 (Build Images): 30 min
- Phase 2 (OAuth): 2-3 hours
- Phase 3 (Storage): 1 hour
- Phase 4 (Firebase): 2 hours
- Phase 5 (Payments): 1 hour
- Phase 6 (AI): 1 hour
- Phase 7 (Testing): 1 hour
- Phase 8 (Admin/Employer): 2 hours

### Dependencies:
- Azure subscription with appropriate permissions
- Access to GitHub repository and Actions
- Access to external service provider accounts (Google, LinkedIn, etc.)
- Domain name configured (applyforus.com)
- SSL certificates in place

---

## SUPPORT CONTACTS

If you encounter issues:

1. **Azure Issues:** Azure Support Portal
2. **OAuth Issues:** Provider-specific developer forums
3. **Payment Issues:** Stripe Support, Paystack Support
4. **Firebase Issues:** Firebase Support
5. **Kubernetes Issues:** AKS documentation

---

## SUCCESS CRITERIA

Deployment is ready when:
- [ ] All 13 images in ACR
- [ ] All critical secrets in Key Vault
- [ ] All pods running without CrashLoopBackOff
- [ ] OAuth login works (Google, LinkedIn, GitHub)
- [ ] File uploads work (resumes, photos)
- [ ] Push notifications work
- [ ] Payment flow works (at least Stripe)
- [ ] No errors in application logs
- [ ] Health checks passing

**YOU ARE NOW READY FOR PRODUCTION DEPLOYMENT!**
