# ApplyForUs Platform - Environment Setup Guide

This guide provides step-by-step instructions for configuring all external services required by the ApplyForUs platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OAuth Provider Setup](#oauth-provider-setup)
   - [Google OAuth](#google-oauth)
   - [GitHub OAuth](#github-oauth)
   - [LinkedIn OAuth](#linkedin-oauth)
3. [Payment Provider Setup](#payment-provider-setup)
   - [Stripe](#stripe)
   - [Paystack](#paystack-optional)
   - [Flutterwave](#flutterwave-optional)
4. [AI API Configuration](#ai-api-configuration)
   - [OpenAI](#openai)
   - [Anthropic Claude](#anthropic-claude)
   - [Azure OpenAI](#azure-openai-optional)
   - [Pinecone Vector Database](#pinecone-vector-database)
5. [Push Notification Setup](#push-notification-setup)
   - [Firebase Cloud Messaging (FCM)](#firebase-cloud-messaging-fcm)
   - [Apple Push Notification Service (APNs)](#apple-push-notification-service-apns)
6. [Email Provider Setup](#email-provider-setup)
   - [SendGrid](#sendgrid)
   - [Gmail App Password](#gmail-app-password)
   - [Local Development with MailHog](#local-development-with-mailhog)
7. [Azure Key Vault Integration](#azure-key-vault-integration)
8. [Local Development Setup](#local-development-setup)
9. [Production Deployment Checklist](#production-deployment-checklist)

---

## Prerequisites

Before starting, ensure you have:

- Node.js 18+ installed
- Docker and Docker Compose installed (for local development)
- Git configured with SSH keys
- Access to the following accounts (create if needed):
  - Google Cloud Console
  - GitHub Developer Settings
  - LinkedIn Developer Portal
  - Stripe Dashboard
  - OpenAI Platform
  - Firebase Console
  - Azure Portal (for production)

---

## OAuth Provider Setup

### Google OAuth

Google OAuth allows users to sign in with their Google accounts.

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" dropdown at the top
3. Click "New Project"
4. Enter project name: `ApplyForUs` (or your preferred name)
5. Click "Create"

#### Step 2: Enable APIs

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for and enable:
   - Google+ API
   - Google People API

#### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required fields:
   - **App name**: ApplyForUs
   - **User support email**: your-email@example.com
   - **Developer contact email**: your-email@example.com
5. Click "Save and Continue"
6. Add scopes:
   - `email`
   - `profile`
   - `openid`
7. Add test users (for development)
8. Complete the wizard

#### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure:
   - **Name**: ApplyForUs Auth Service
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://applyforus.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:8001/api/v1/auth/google/callback` (development)
     - `https://api.applyforus.com/api/v1/auth/google/callback` (production)
5. Click "Create"
6. Copy the **Client ID** and **Client Secret**

#### Step 5: Configure Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8001/api/v1/auth/google/callback
```

---

### GitHub OAuth

GitHub OAuth allows users to sign in with their GitHub accounts.

#### Step 1: Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" in the sidebar
3. Click "New OAuth App"
4. Fill in the form:
   - **Application name**: ApplyForUs
   - **Homepage URL**: `http://localhost:3000` (dev) or `https://applyforus.com` (prod)
   - **Application description**: AI-powered job application platform
   - **Authorization callback URL**: `http://localhost:8001/api/v1/auth/github/callback`
5. Click "Register application"

#### Step 2: Get Credentials

1. On the app page, copy the **Client ID**
2. Click "Generate a new client secret"
3. Copy the **Client Secret** immediately (it won't be shown again)

#### Step 3: Configure Environment Variables

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8001/api/v1/auth/github/callback
```

#### Production Setup

For production, create a separate OAuth App with:
- **Homepage URL**: `https://applyforus.com`
- **Authorization callback URL**: `https://api.applyforus.com/api/v1/auth/github/callback`

---

### LinkedIn OAuth

LinkedIn OAuth allows users to sign in and import professional profile data.

#### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click "Create app"
3. Fill in the form:
   - **App name**: ApplyForUs
   - **LinkedIn Page**: Create or select a company page
   - **Privacy policy URL**: `https://applyforus.com/privacy`
   - **App logo**: Upload your logo
4. Accept the terms and click "Create app"

#### Step 2: Configure OAuth 2.0 Settings

1. Go to the "Auth" tab
2. Add **Authorized redirect URLs**:
   - `http://localhost:8001/api/v1/auth/linkedin/callback` (development)
   - `https://api.applyforus.com/api/v1/auth/linkedin/callback` (production)
3. Copy the **Client ID** and **Client Secret**

#### Step 3: Request Products (Permissions)

1. Go to the "Products" tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (required)
   - **Share on LinkedIn** (optional)
   - **Marketing Developer Platform** (optional, for job posting)

> **Note**: Some products require LinkedIn review and approval, which may take several days.

#### Step 4: Configure Environment Variables

```env
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_CALLBACK_URL=http://localhost:8001/api/v1/auth/linkedin/callback
```

---

## Payment Provider Setup

### Stripe

Stripe handles payment processing for subscriptions.

#### Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Sign up or log in
3. Complete account verification (required for live payments)

#### Step 2: Get API Keys

1. Go to "Developers" > "API keys"
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

#### Step 3: Create Subscription Products

1. Go to "Products" > "Add product"
2. Create three products:

**Basic Plan**:
- Name: Basic
- Price: $9.99/month (or your price)
- Billing period: Monthly
- Copy the **Price ID** (starts with `price_`)

**Pro Plan**:
- Name: Pro
- Price: $29.99/month
- Billing period: Monthly
- Copy the **Price ID**

**Enterprise Plan**:
- Name: Enterprise
- Price: $99.99/month
- Billing period: Monthly
- Copy the **Price ID**

#### Step 4: Set Up Webhooks

1. Go to "Developers" > "Webhooks"
2. Click "Add endpoint"
3. Configure:
   - **Endpoint URL**: `https://api.applyforus.com/webhooks/stripe`
   - **Events to listen to**:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
4. Click "Add endpoint"
5. Copy the **Signing secret** (starts with `whsec_`)

#### Step 5: Configure Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx
```

#### Local Webhook Testing

Use the Stripe CLI for local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# Or download from https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/webhooks/stripe

# This will output a webhook signing secret for local testing
```

---

### Paystack (Optional)

Paystack provides payment processing for African markets.

#### Step 1: Create Account

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Sign up and verify your account

#### Step 2: Get API Keys

1. Go to "Settings" > "API Keys & Webhooks"
2. Copy:
   - **Public Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

#### Step 3: Configure Webhooks

1. Go to "Settings" > "API Keys & Webhooks"
2. Set webhook URL: `https://api.applyforus.com/webhooks/paystack`
3. Copy the webhook secret

#### Step 4: Configure Environment Variables

```env
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
```

---

### Flutterwave (Optional)

Flutterwave provides payment processing across Africa.

#### Step 1: Create Account

1. Go to [Flutterwave Dashboard](https://dashboard.flutterwave.com/)
2. Sign up and complete verification

#### Step 2: Get API Keys

1. Go to "Settings" > "APIs"
2. Copy:
   - **Public Key**
   - **Secret Key**
   - **Encryption Key**

#### Step 3: Configure Webhooks

1. Go to "Settings" > "Webhooks"
2. Set webhook URL: `https://api.applyforus.com/webhooks/flutterwave`
3. Create a webhook secret hash

#### Step 4: Configure Environment Variables

```env
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your_secret_key
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your_public_key
FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TEST-your_encryption_key
FLUTTERWAVE_WEBHOOK_SECRET=your_webhook_secret_hash
```

---

## AI API Configuration

### OpenAI

OpenAI powers resume optimization and job matching.

#### Step 1: Create Account

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Add payment method (required for API usage)

#### Step 2: Generate API Key

1. Go to "API Keys" in the sidebar
2. Click "Create new secret key"
3. Name it: `ApplyForUs Production` (or similar)
4. Copy the key immediately (it won't be shown again)

#### Step 3: Set Usage Limits (Recommended)

1. Go to "Settings" > "Limits"
2. Set monthly usage limit to prevent unexpected charges
3. Configure usage alerts

#### Step 4: Configure Environment Variables

```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
```

#### Model Recommendations

| Use Case | Recommended Model | Cost |
|----------|------------------|------|
| Resume analysis | gpt-4-turbo-preview | Higher |
| Quick suggestions | gpt-3.5-turbo | Lower |
| Embeddings | text-embedding-ada-002 | Lowest |

---

### Anthropic Claude

Anthropic Claude provides alternative AI capabilities.

#### Step 1: Create Account

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up and add payment method

#### Step 2: Generate API Key

1. Go to "Settings" > "API Keys"
2. Click "Create Key"
3. Name it and copy the key (starts with `sk-ant-`)

#### Step 3: Configure Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
ANTHROPIC_MODEL=claude-3-opus-20240229
```

#### Model Options

| Model | Use Case | Speed | Quality |
|-------|----------|-------|---------|
| claude-3-opus | Complex analysis | Slower | Highest |
| claude-3-sonnet | Balanced tasks | Medium | High |
| claude-3-haiku | Quick responses | Fastest | Good |

---

### Azure OpenAI (Optional)

Azure OpenAI provides enterprise-grade AI with compliance features.

#### Step 1: Request Access

1. Go to [Azure OpenAI Access Form](https://aka.ms/oai/access)
2. Fill out the form and wait for approval

#### Step 2: Create Resource

1. In Azure Portal, create "Azure OpenAI" resource
2. Select region and pricing tier
3. Create the resource

#### Step 3: Deploy Model

1. Go to "Azure OpenAI Studio"
2. Click "Deployments" > "Create new deployment"
3. Select model (e.g., gpt-4) and deploy

#### Step 4: Get Credentials

1. In Azure Portal, go to your OpenAI resource
2. Go to "Keys and Endpoint"
3. Copy endpoint URL and key

#### Step 5: Configure Environment Variables

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

---

### Pinecone Vector Database

Pinecone stores vector embeddings for semantic search.

#### Step 1: Create Account

1. Go to [Pinecone](https://app.pinecone.io/)
2. Sign up (free tier available)

#### Step 2: Create Index

1. Click "Create Index"
2. Configure:
   - **Name**: `applyforus-vectors`
   - **Dimensions**: `1536` (for OpenAI embeddings)
   - **Metric**: `cosine`
   - **Pod Type**: `p1.x1` (starter) or `s1.x1` (standard)
3. Click "Create Index"

#### Step 3: Get API Key

1. Go to "API Keys"
2. Copy your API key

#### Step 4: Get Environment

1. On the index page, note the **Environment** (e.g., `us-west1-gcp`)

#### Step 5: Configure Environment Variables

```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=applyforus-vectors
```

---

## Push Notification Setup

### Firebase Cloud Messaging (FCM)

FCM handles push notifications for Android and web browsers.

#### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `ApplyForUs`
4. Enable/disable Google Analytics as needed
5. Click "Create project"

#### Step 2: Add Web App

1. In project overview, click the web icon (`</>`)
2. Register app:
   - **App nickname**: ApplyForUs Web
3. Copy the Firebase config object

#### Step 3: Generate Service Account Key

1. Go to Project Settings (gear icon)
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Store securely (never commit to git)

#### Step 4: Enable Cloud Messaging

1. Go to "Cloud Messaging" tab
2. Note the **Sender ID**
3. Generate a **Web Push certificate** (VAPID key) if using web push

#### Step 5: Configure Environment Variables

For the backend (notification-service):
```env
# Option 1: Inline JSON (escape special characters)
FCM_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com",...}'

# Option 2: Path to JSON file (local development)
FCM_SERVICE_ACCOUNT_PATH=/path/to/firebase-service-account.json
```

For the frontend (web app):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

---

### Apple Push Notification Service (APNs)

APNs handles push notifications for iOS devices.

#### Step 1: Create APNs Key

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Click the + button to create a new key
3. Enter a name: `ApplyForUs Push Key`
4. Check "Apple Push Notifications service (APNs)"
5. Click "Continue" then "Register"
6. **Download the .p8 file** (you can only download once!)
7. Note the **Key ID** (10 characters)

#### Step 2: Get Team ID

1. Go to [Apple Developer Account](https://developer.apple.com/account/)
2. In the top right, note your **Team ID** (10 characters)

#### Step 3: Configure App ID

1. Go to "Identifiers" > "App IDs"
2. Create or edit your app identifier
3. Enable "Push Notifications" capability

#### Step 4: Configure Environment Variables

```env
# APNs Key ID from step 1
APNS_KEY_ID=ABC123XYZ1

# Team ID from step 2
APNS_TEAM_ID=XYZ789ABC0

# Contents of .p8 file (replace newlines with \n)
APNS_KEY='-----BEGIN PRIVATE KEY-----\nMIGTAgEAMBMGByqGSM49AgEGCC...\n-----END PRIVATE KEY-----'

# Environment: false for development, true for production
APNS_PRODUCTION=false
```

#### Converting .p8 File to Environment Variable

```bash
# Read .p8 file and convert to single line
cat AuthKey_ABC123XYZ1.p8 | sed ':a;N;$!ba;s/\n/\\n/g'
```

---

## Email Provider Setup

### SendGrid

SendGrid provides reliable email delivery.

#### Step 1: Create Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for an account
3. Complete sender authentication (verify email/domain)

#### Step 2: Create API Key

1. Go to "Settings" > "API Keys"
2. Click "Create API Key"
3. Select "Full Access" or "Restricted Access" with Mail Send permission
4. Copy the API key

#### Step 3: Verify Sender Domain (Recommended)

1. Go to "Settings" > "Sender Authentication"
2. Add your domain
3. Add DNS records as instructed
4. Verify the domain

#### Step 4: Configure Environment Variables

```env
SENDGRID_API_KEY=SG.xxx

# For SMTP:
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxx  # Same as API key
EMAIL_FROM=noreply@applyforus.com
EMAIL_FROM_NAME=ApplyForUs
```

---

### Gmail App Password

For development or small-scale use, you can use Gmail.

#### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

#### Step 2: Create App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter name: "ApplyForUs"
5. Click "Generate"
6. Copy the 16-character password

#### Step 3: Configure Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

> **Note**: Gmail has sending limits (500/day for personal, 2000/day for Workspace).

---

### Local Development with MailHog

MailHog catches all outgoing emails for testing.

#### Start MailHog

```bash
# Using Docker
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog

# Or install locally
brew install mailhog  # macOS
mailhog
```

#### Configure Environment Variables

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
```

#### Access Web UI

Open http://localhost:8025 to view captured emails.

---

## Azure Key Vault Integration

Azure Key Vault provides secure secret management for production.

### Step 1: Create Key Vault

```bash
# Create resource group
az group create --name applyforus-rg --location eastus

# Create Key Vault
az keyvault create \
  --name applyforus-vault \
  --resource-group applyforus-rg \
  --location eastus
```

### Step 2: Add Secrets

```bash
# Add each secret
az keyvault secret set --vault-name applyforus-vault --name "jwt-secret" --value "your-jwt-secret"
az keyvault secret set --vault-name applyforus-vault --name "db-password" --value "your-db-password"
az keyvault secret set --vault-name applyforus-vault --name "openai-api-key" --value "sk-xxx"
# ... add all secrets
```

### Step 3: Configure Kubernetes Access

```yaml
# Create managed identity and bind to Key Vault
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: azure-kvname-secrets
  namespace: applyforus
spec:
  provider: azure
  parameters:
    usePodIdentity: "false"
    useVMManagedIdentity: "true"
    userAssignedIdentityID: "<client-id>"
    keyvaultName: "applyforus-vault"
    objects: |
      array:
        - |
          objectName: jwt-secret
          objectType: secret
        - |
          objectName: db-password
          objectType: secret
    tenantId: "<tenant-id>"
```

### Step 4: Reference in Deployments

```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: auth-service
          volumeMounts:
            - name: secrets-store
              mountPath: "/mnt/secrets-store"
              readOnly: true
      volumes:
        - name: secrets-store
          csi:
            driver: secrets-store.csi.k8s.io
            readOnly: true
            volumeAttributes:
              secretProviderClass: "azure-kvname-secrets"
```

---

## Local Development Setup

### Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/your-org/job-apply-platform.git
cd job-apply-platform
```

2. **Copy environment files**:
```bash
# Root
cp .env.example .env

# Each service
cp services/auth-service/.env.example services/auth-service/.env
cp services/payment-service/.env.example services/payment-service/.env
cp services/ai-service/.env.example services/ai-service/.env
cp services/notification-service/.env.example services/notification-service/.env
```

3. **Start infrastructure with Docker Compose**:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (localhost:5432)
- Redis (localhost:6379)
- RabbitMQ (localhost:5672, UI at localhost:15672)
- MailHog (SMTP at localhost:1025, UI at localhost:8025)
- Elasticsearch (localhost:9200)

4. **Update environment files** with local values:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Email (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
```

5. **Install dependencies**:
```bash
npm install  # or pnpm install
```

6. **Run migrations**:
```bash
npm run db:migrate
```

7. **Start services**:
```bash
npm run dev
```

---

## Production Deployment Checklist

Before deploying to production, verify:

### Security

- [ ] All secrets are stored in Azure Key Vault
- [ ] No secrets in environment files or code
- [ ] SSL/TLS enabled for all connections
- [ ] Strong passwords/secrets (64+ characters)
- [ ] CORS restricted to production domains
- [ ] Rate limiting configured
- [ ] CSRF protection enabled

### OAuth

- [ ] Production OAuth apps created (separate from development)
- [ ] Redirect URLs point to production domain
- [ ] OAuth apps verified (Google, LinkedIn)

### Payments

- [ ] Stripe live keys configured
- [ ] Webhook endpoints set to production URL
- [ ] Webhook signature verification enabled
- [ ] Products and prices created in live mode

### Email

- [ ] Domain verified with email provider
- [ ] SPF, DKIM, DMARC records configured
- [ ] Production sender email configured

### Push Notifications

- [ ] Firebase production project configured
- [ ] APNs production certificate/key
- [ ] APNS_PRODUCTION=true for iOS

### Monitoring

- [ ] Application Insights configured
- [ ] Sentry error tracking enabled
- [ ] Log aggregation configured
- [ ] Alerts set up for critical errors

### Database

- [ ] Azure Database for PostgreSQL configured
- [ ] Connection pooling enabled
- [ ] Backups configured
- [ ] SSL required for all connections

---

## Troubleshooting

### OAuth Issues

**Error: "redirect_uri_mismatch"**
- Verify callback URL matches exactly (including trailing slash)
- Check protocol (http vs https)

**Error: "access_denied"**
- Check OAuth consent screen is published
- Verify scopes are correctly configured

### Payment Issues

**Webhook not receiving events**
- Verify webhook URL is publicly accessible
- Check webhook signing secret is correct
- Ensure events are selected in dashboard

### AI API Issues

**Error: "Rate limit exceeded"**
- Implement exponential backoff
- Check usage limits in dashboard
- Consider using different models for different tasks

### Push Notification Issues

**FCM tokens not registering**
- Verify Firebase configuration
- Check browser permissions
- Ensure service worker is registered

**APNs notifications not delivered**
- Verify bundle ID matches
- Check APNs environment (sandbox vs production)
- Ensure device token is valid

---

## Support

For issues with this setup guide:
- Create an issue in the repository
- Contact the DevOps team at devops@applyforus.com
