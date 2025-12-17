# ApplyForUs Platform - Comprehensive Audit Report
**Date:** 2025-12-16
**Auditor:** System Analysis
**Status:** Complete

---

## Executive Summary

This audit identifies all missing Docker images, environment variables, external service integrations, and incomplete features across the ApplyForUs platform. The platform consists of 10 backend services, 3 web applications, 1 mobile app, and 1 browser extension.

### Key Findings:
- **4 services missing from ACR** (auto-apply, resume, payment, orchestrator)
- **2 frontend apps missing from ACR** (admin, employer)
- **15+ critical environment variables missing from Azure Key Vault**
- **Multiple external service integrations not configured**
- **Mobile app needs EAS configuration**
- **Browser extension missing icons**

---

## 1. MISSING ACR DOCKER IMAGES

### Currently in ACR (7 images):
- applyai-web
- applyai-auth-service
- applyai-user-service
- applyai-job-service
- applyai-analytics-service
- applyai-notification-service
- applyai-ai-service

### MISSING from ACR (6 images):

#### Backend Services (4):
1. **applyai-resume-service**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\resume-service\Dockerfile`
   - K8s Deployment: EXISTS at `infrastructure/kubernetes/production/resume-service-deployment.yaml`
   - Build Config: INCLUDED in `.github/workflows/build-images.yml`
   - Status: READY TO BUILD
   - Action: Run build workflow

2. **applyai-auto-apply-service**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\auto-apply-service\Dockerfile`
   - K8s Deployment: EXISTS at `infrastructure/kubernetes/production/auto-apply-service-deployment.yaml`
   - Build Config: INCLUDED in `.github/workflows/build-images.yml`
   - Status: READY TO BUILD
   - Action: Run build workflow

3. **applyai-payment-service**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\payment-service\Dockerfile`
   - K8s Deployment: EXISTS at `infrastructure/kubernetes/production/payment-service-deployment.yaml`
   - Build Config: INCLUDED in `.github/workflows/build-images.yml`
   - Status: READY TO BUILD
   - Action: Run build workflow

4. **applyai-orchestrator-service**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\services\orchestrator-service\Dockerfile`
   - K8s Deployment: EXISTS at `infrastructure/kubernetes/production/orchestrator-service-deployment.yaml`
   - Build Config: INCLUDED in `.github/workflows/build-images.yml`
   - Status: READY TO BUILD
   - Action: Run build workflow

#### Frontend Apps (2):
5. **applyai-admin**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\admin\Dockerfile`
   - K8s Deployment: MISSING
   - Build Config: NOT included in build workflow
   - Status: NEEDS K8S MANIFEST & BUILD CONFIG
   - Action: Create K8s deployment + add to build workflow

6. **applyai-employer**
   - Dockerfile: EXISTS at `C:\Users\kogun\OneDrive\Documents\Job-Apply-Platform\apps\employer\Dockerfile`
   - K8s Deployment: MISSING
   - Build Config: NOT included in build workflow
   - Status: NEEDS K8S MANIFEST & BUILD CONFIG
   - Action: Create K8s deployment + add to build workflow

---

## 2. MOBILE APP STATUS

### apps/mobile - React Native (Expo)
- **Build System:** Expo Application Services (EAS)
- **Configuration:** eas.json EXISTS
- **App Config:** app.json EXISTS
- **Source Code:** COMPLETE (screens, navigation, services)
- **Assets:** PLACEHOLDER images (70 bytes each - need real assets)

#### Missing/Incomplete:
1. **EAS Project ID** - Set in app.json: `YOUR_EAS_PROJECT_ID`
2. **Real Assets:**
   - icon.png (currently 70 bytes placeholder)
   - splash.png (currently 70 bytes placeholder)
   - adaptive-icon.png (currently 70 bytes placeholder)
   - notification-icon.png (MISSING)
   - notification-sound.wav (MISSING)
3. **Google Services:**
   - `android/google-services.json` (MISSING)
   - Firebase configuration for push notifications
4. **iOS Configuration:**
   - Push notification certificates/provisioning profiles (via EAS)

#### Action Items:
- [ ] Create EAS account and initialize project: `eas init`
- [ ] Design and add real app icons and splash screens
- [ ] Configure Firebase for push notifications
- [ ] Add google-services.json for Android
- [ ] Configure iOS push notification certificates
- [ ] Test builds: `eas build --profile development`

---

## 3. BROWSER EXTENSION STATUS

### apps/extension - Chrome Extension (Manifest V3)
- **Build System:** Vite
- **Manifest:** EXISTS at `apps/extension/public/manifest.json`
- **Source Code:** COMPLETE (adapters for 9 job boards)
- **Popup UI:** EXISTS

#### Job Board Adapters (9):
1. LinkedIn - COMPLETE
2. Indeed - COMPLETE
3. Greenhouse - COMPLETE
4. Lever - COMPLETE
5. Workday - COMPLETE
6. iCIMS - COMPLETE
7. Taleo - COMPLETE
8. SmartRecruiters - COMPLETE
9. Generic (fallback) - COMPLETE

#### Missing/Incomplete:
1. **Extension Icons** - Directory exists but EMPTY: `apps/extension/public/icons/`
   - Need: icon16.png, icon32.png, icon48.png, icon128.png
2. **Assets** - Directory exists but EMPTY: `apps/extension/public/assets/`

#### Action Items:
- [ ] Design and add extension icons (16x16, 32x32, 48x48, 128x128)
- [ ] Add any required assets
- [ ] Build extension: `cd apps/extension && pnpm build`
- [ ] Test in Chrome/Edge
- [ ] Prepare for Chrome Web Store submission

---

## 4. MISSING AZURE KEY VAULT SECRETS

### Currently in Key Vault (13 secrets):
- DB-CONNECTION-STRING
- DB-DATABASE
- DB-HOST
- DB-PASSWORD
- DB-PORT
- DB-USERNAME
- ENCRYPTION-KEY
- JWT-SECRET
- OPENAI-API-KEY
- REDIS-PASSWORD
- SENDGRID-API-KEY
- SESSION-SECRET
- STRIPE-SECRET-KEY

### MISSING from Key Vault (20+ secrets):

#### OAuth Credentials (6):
1. **GOOGLE-CLIENT-ID** - Required by: auth-service
2. **GOOGLE-CLIENT-SECRET** - Required by: auth-service
3. **LINKEDIN-CLIENT-ID** - Required by: auth-service, mobile
4. **LINKEDIN-CLIENT-SECRET** - Required by: auth-service
5. **GITHUB-CLIENT-ID** - Required by: auth-service
6. **GITHUB-CLIENT-SECRET** - Required by: auth-service

#### Payment Gateway Credentials (6):
7. **STRIPE-PUBLISHABLE-KEY** - Required by: user-service, employer, web
8. **STRIPE-WEBHOOK-SECRET** - Required by: payment-service, user-service
9. **PAYSTACK-SECRET-KEY** - Required by: payment-service
10. **PAYSTACK-PUBLIC-KEY** - Required by: payment-service
11. **FLUTTERWAVE-SECRET-KEY** - Required by: payment-service
12. **FLUTTERWAVE-PUBLIC-KEY** - Required by: payment-service
13. **FLUTTERWAVE-ENCRYPTION-KEY** - Required by: payment-service
14. **FLUTTERWAVE-WEBHOOK-SECRET** - Required by: payment-service

#### AI/ML Services (2):
15. **ANTHROPIC-API-KEY** - Required by: ai-service
16. **PINECONE-API-KEY** - Required by: ai-service

#### Push Notifications (4):
17. **FCM-SERVICE-ACCOUNT** - Required by: notification-service (JSON)
18. **APNS-KEY-ID** - Required by: notification-service
19. **APNS-TEAM-ID** - Required by: notification-service
20. **APNS-KEY** - Required by: notification-service (P8 file content)

#### Firebase (7):
21. **FIREBASE-API-KEY** - Required by: web, mobile
22. **FIREBASE-AUTH-DOMAIN** - Required by: web, mobile
23. **FIREBASE-PROJECT-ID** - Required by: web, mobile
24. **FIREBASE-STORAGE-BUCKET** - Required by: web, mobile
25. **FIREBASE-MESSAGING-SENDER-ID** - Required by: web, mobile
26. **FIREBASE-APP-ID** - Required by: web, mobile
27. **FIREBASE-VAPID-KEY** - Required by: web

#### Azure Storage (3):
28. **AZURE-STORAGE-ACCOUNT-NAME** - Required by: resume-service, user-service
29. **AZURE-STORAGE-ACCOUNT-KEY** - Required by: resume-service, user-service
30. **AZURE-STORAGE-CONNECTION-STRING** - Required by: resume-service, user-service

#### Optional/Future (6):
31. **AWS-ACCESS-KEY-ID** - Fallback for resume-service (optional)
32. **AWS-SECRET-ACCESS-KEY** - Fallback for resume-service (optional)
33. **ELASTICSEARCH-PASSWORD** - Required by: job-service
34. **RABBITMQ-URL** - Required by: payment-service
35. **CSRF-SECRET** - Required by: auth-service
36. **API-KEY-SECRET** - Required by: payment-service

---

## 5. EXTERNAL SERVICE INTEGRATIONS

### Configured Services:
1. **PostgreSQL** - Azure Database for PostgreSQL
2. **Redis** - Azure Cache for Redis
3. **OpenAI** - API key in Key Vault
4. **Stripe** - Secret key in Key Vault (publishable key missing)
5. **SendGrid** - API key in Key Vault

### MISSING Integrations:

#### Critical (Must Configure):
1. **Google OAuth** - For social login
   - Console: https://console.cloud.google.com/apis/credentials
   - Need: Client ID, Client Secret, Callback URLs

2. **LinkedIn OAuth** - For social login & job data
   - Console: https://www.linkedin.com/developers/apps
   - Need: Client ID, Client Secret, Callback URLs

3. **GitHub OAuth** - For social login
   - Console: https://github.com/settings/developers
   - Need: Client ID, Client Secret, Callback URLs

4. **Firebase** - For push notifications
   - Console: https://console.firebase.google.com
   - Need: Project setup, service account, web app credentials

5. **Azure Blob Storage** - For resume/file storage
   - Portal: https://portal.azure.com
   - Need: Storage account, access keys, container creation

#### Payment Gateways:
6. **Paystack** - African payment processing
   - Console: https://dashboard.paystack.com
   - Need: Secret key, public key
   - Used by: payment-service (code exists)

7. **Flutterwave** - African payment processing
   - Console: https://dashboard.flutterwave.com
   - Need: Secret key, public key, encryption key
   - Used by: payment-service (code exists)

#### AI/ML Services:
8. **Anthropic Claude** - Alternative LLM provider
   - Console: https://console.anthropic.com
   - Need: API key
   - Used by: ai-service (code exists)

9. **Pinecone** - Vector database for semantic search
   - Console: https://app.pinecone.io
   - Need: API key, environment, index name
   - Used by: ai-service (code exists)

#### Search & Analytics:
10. **Elasticsearch** - Job search indexing
    - Azure: Managed Elasticsearch
    - Need: Node URL, credentials
    - Used by: job-service (code exists)

#### Message Queue:
11. **RabbitMQ** - Event-driven messaging
    - Azure: Third-party or self-hosted
    - Need: Connection URL
    - Used by: payment-service (code exists)

#### Optional/Future:
12. **Indeed API** - Job aggregation
13. **LinkedIn API** - Job aggregation
14. **Glassdoor API** - Job aggregation
15. **Google Analytics** - Web analytics
16. **Sentry** - Error monitoring

---

## 6. SHARED PACKAGES STATUS

### Complete Packages (6):
1. **@applyforus/types** - TypeScript types
   - Status: COMPLETE
   - Build: Working
   - Files: analytics.ts, api.ts, application.ts, billing.ts, job.ts, resume.ts, user.ts

2. **@applyforus/shared** - Utilities, logging, metrics
   - Status: COMPLETE
   - Build: Working
   - Features: Pino logger, Prometheus metrics, health checks

3. **@applyforus/logging** - Azure App Insights logging
   - Status: COMPLETE
   - Build: Working
   - Integration: Azure Application Insights

4. **@applyforus/telemetry** - OpenTelemetry tracing
   - Status: COMPLETE
   - Build: Working
   - Features: Distributed tracing, Azure Monitor exporter

5. **@applyforus/security** - Security utilities
   - Status: COMPLETE
   - Build: Working
   - Features: RBAC, encryption, validation, audit logging

6. **@applyforus/feature-flags** - Feature flag system
   - Status: COMPLETE
   - Build: Working
   - Features: Redis-backed, TypeORM entities

### Incomplete Packages (1):
7. **@applyforus/ui** - Shared UI components
   - Status: SKELETON ONLY
   - Build: No-op (`echo 'No build required'`)
   - Files: Empty except package.json
   - Action: Either populate with shared components or remove if unused

---

## 7. SERVICE-SPECIFIC GAPS

### auth-service
- Missing OAuth provider setup
- Missing CSRF secret
- Missing email service integration (uses SMTP, but not configured)

### user-service
- Missing Stripe publishable key
- Missing Azure Storage configuration

### job-service
- Missing Elasticsearch configuration
- Missing job aggregation API keys (Indeed, LinkedIn, Glassdoor)

### payment-service
- Missing RabbitMQ configuration
- Missing Paystack credentials
- Missing Flutterwave credentials
- Missing Stripe webhook secret

### notification-service
- Missing Firebase FCM credentials
- Missing Apple APNs credentials
- Missing SMTP configuration for emails

### resume-service
- Missing Azure Storage configuration
- Missing AI service integration for resume optimization

### ai-service
- Missing Anthropic API key
- Missing Pinecone API key and configuration

### auto-apply-service
- All dependencies configured (uses Redis, PostgreSQL)
- Browser automation ready (Playwright)

### analytics-service
- Basic configuration complete
- Could use enhanced monitoring

### orchestrator-service
- No .env.example file (uses defaults from code)
- Bull queue configured via Redis

---

## 8. KUBERNETES DEPLOYMENT STATUS

### Services with K8s Deployments (10):
1. web - production/web-deployment.yaml
2. auth-service - production/auth-service-deployment.yaml
3. user-service - production/user-service-deployment.yaml
4. job-service - production/job-service-deployment.yaml
5. analytics-service - production/analytics-service-deployment.yaml
6. notification-service - production/notification-service-deployment.yaml
7. ai-service - production/ai-service-deployment.yaml
8. resume-service - production/resume-service-deployment.yaml
9. auto-apply-service - production/auto-apply-service-deployment.yaml
10. payment-service - production/payment-service-deployment.yaml
11. orchestrator-service - production/orchestrator-service-deployment.yaml

### MISSING K8s Deployments (2):
1. **admin** - Need to create deployment manifest
2. **employer** - Need to create deployment manifest

---

## 9. CI/CD STATUS

### Build Workflow (.github/workflows/build-images.yml)
- **Configured Services (11):**
  - web, auth-service, user-service, job-service, resume-service
  - notification-service, auto-apply-service, analytics-service
  - ai-service, orchestrator-service, payment-service

- **MISSING from Workflow (2):**
  - admin
  - employer

### Deployment Workflows
- **CD Dev** - cd-dev.yml (exists)
- **CD Staging** - cd-staging-hardened.yml (exists)
- **CD Production** - cd-prod.yml, cd-prod-hardened.yml (exist)

---

## 10. ACTIONABLE CHECKLIST

### IMMEDIATE (Critical Path):

#### Docker Images - Build Missing Services:
- [ ] Trigger GitHub Actions workflow: "Build Docker Images"
- [ ] Verify these 4 images are created in ACR:
  - [ ] applyai-resume-service
  - [ ] applyai-auto-apply-service
  - [ ] applyai-payment-service
  - [ ] applyai-orchestrator-service

#### Admin & Employer Apps:
- [ ] Add `admin` to build-images.yml matrix
- [ ] Add `employer` to build-images.yml matrix
- [ ] Create `infrastructure/kubernetes/production/admin-deployment.yaml`
- [ ] Create `infrastructure/kubernetes/production/employer-deployment.yaml`
- [ ] Create admin and employer K8s services
- [ ] Trigger build workflow

#### Azure Key Vault - Add Critical Secrets:
- [ ] **OAuth Credentials:**
  - [ ] Create Google OAuth app → Add GOOGLE-CLIENT-ID, GOOGLE-CLIENT-SECRET
  - [ ] Create LinkedIn OAuth app → Add LINKEDIN-CLIENT-ID, LINKEDIN-CLIENT-SECRET
  - [ ] Create GitHub OAuth app → Add GITHUB-CLIENT-ID, GITHUB-CLIENT-SECRET

- [ ] **Payment Providers:**
  - [ ] Get Stripe publishable key → Add STRIPE-PUBLISHABLE-KEY
  - [ ] Get Stripe webhook secret → Add STRIPE-WEBHOOK-SECRET
  - [ ] (Optional) Paystack credentials
  - [ ] (Optional) Flutterwave credentials

- [ ] **Azure Storage:**
  - [ ] Create Azure Storage Account
  - [ ] Add AZURE-STORAGE-ACCOUNT-NAME
  - [ ] Add AZURE-STORAGE-ACCOUNT-KEY
  - [ ] Add AZURE-STORAGE-CONNECTION-STRING
  - [ ] Create blob containers: resumes, parsed-resumes, generated-resumes, user-uploads, profile-photos

- [ ] **Push Notifications:**
  - [ ] Create Firebase project
  - [ ] Add FCM-SERVICE-ACCOUNT (service account JSON)
  - [ ] Add Firebase web config (7 values)
  - [ ] Get Apple APNs credentials → Add APNS-KEY-ID, APNS-TEAM-ID, APNS-KEY

- [ ] **AI Services:**
  - [ ] Get Anthropic API key → Add ANTHROPIC-API-KEY
  - [ ] Create Pinecone index → Add PINECONE-API-KEY

### MEDIUM PRIORITY:

#### Mobile App:
- [ ] Create EAS account: https://expo.dev
- [ ] Run `eas init` in apps/mobile
- [ ] Update app.json with real EAS project ID
- [ ] Design app icons (1024x1024, 512x512, 192x192)
- [ ] Design splash screen
- [ ] Add notification icon and sound
- [ ] Configure Firebase for mobile
- [ ] Add google-services.json for Android
- [ ] Configure iOS certificates
- [ ] Test development builds

#### Browser Extension:
- [ ] Design extension icons (128x128, 48x48, 32x32, 16x16)
- [ ] Add icons to apps/extension/public/icons/
- [ ] Build extension: `pnpm build`
- [ ] Test in Chrome/Edge
- [ ] Prepare Chrome Web Store listing

#### Search & Messaging:
- [ ] Set up Elasticsearch (Azure or Elastic Cloud)
- [ ] Add ELASTICSEARCH-PASSWORD to Key Vault
- [ ] Configure RabbitMQ (Azure Service Bus alternative?)
- [ ] Add RABBITMQ-URL to Key Vault

### LOW PRIORITY (Future):

- [ ] Job aggregation API keys (Indeed, LinkedIn, Glassdoor)
- [ ] Google Analytics setup
- [ ] Sentry error monitoring
- [ ] Complete @applyforus/ui package or remove
- [ ] Create orchestrator-service .env.example
- [ ] AWS credentials (if needed as fallback)

---

## 11. DEPLOYMENT BLOCKERS

### Cannot Deploy Until These Are Fixed:

#### High Severity:
1. **4 service images missing from ACR** - Will cause pod failures
2. **OAuth not configured** - Login will fail
3. **Azure Storage not configured** - Resume/file uploads will fail
4. **Firebase not configured** - Push notifications will fail

#### Medium Severity:
5. **Stripe publishable key missing** - Payment UI will fail
6. **Elasticsearch not configured** - Job search degraded
7. **Admin/Employer apps not built** - Cannot access admin features

#### Low Severity:
8. **Job aggregation APIs** - Limited job listings
9. **Paystack/Flutterwave** - Limited payment options
10. **Mobile app not published** - No mobile access

---

## 12. INFRASTRUCTURE DEPENDENCIES

### Required Azure Resources:

#### Already Provisioned (Assumed):
- Azure Kubernetes Service (AKS)
- Azure Container Registry (ACR)
- Azure Database for PostgreSQL
- Azure Cache for Redis
- Azure Key Vault

#### NEED to Provision:
1. **Azure Blob Storage**
   - For: Resume storage, user uploads, profile photos
   - Containers needed: 5
   - Service connections: resume-service, user-service

2. **Elasticsearch** (Azure-hosted or Elastic Cloud)
   - For: Job search indexing
   - Service connections: job-service

3. **RabbitMQ or Azure Service Bus**
   - For: Event-driven messaging
   - Service connections: payment-service
   - Alternative: Use Redis Pub/Sub (already have Redis)

4. **Application Insights** (Optional but recommended)
   - For: Enhanced logging and monitoring
   - Already integrated in code via @applyforus/logging

### External Services (SaaS):

#### MUST Configure:
1. Google Cloud Platform - OAuth
2. LinkedIn Developers - OAuth
3. GitHub Developers - OAuth
4. Firebase - Push notifications
5. Stripe - Payments

#### SHOULD Configure:
6. Anthropic - AI features
7. Pinecone - Vector search
8. Paystack - African payments
9. Flutterwave - African payments

#### NICE to Have:
10. Indeed Publisher API
11. LinkedIn Jobs API
12. Glassdoor API
13. Google Analytics
14. Sentry

---

## 13. COST ESTIMATES

### Additional Azure Resources Needed:

1. **Azure Blob Storage**
   - ~$20-50/month (depending on usage)
   - 5 containers, redundancy

2. **Elasticsearch**
   - Azure-hosted: $100-300/month
   - Elastic Cloud: $95-500/month
   - Self-hosted on AKS: Infrastructure costs only

3. **RabbitMQ**
   - Self-hosted on AKS: Infrastructure costs only
   - Azure Service Bus: $10-100/month
   - Alternative: Use existing Redis (free)

### External Services:

1. **Firebase** - Free tier available, ~$25-100/month at scale
2. **Pinecone** - Free tier available, $70/month for production
3. **Anthropic** - Usage-based, ~$15-100/month
4. **Elasticsearch Cloud** - $95-500/month
5. **Stripe** - Transaction fees only (2.9% + 30¢)

**Total Estimated Monthly Cost:** $200-600 (conservative), $500-1500 (production scale)

---

## 14. SECURITY CONSIDERATIONS

### Secrets Management:
- [ ] Rotate all placeholder secrets before production
- [ ] Use Azure Key Vault for ALL secrets (not .env files)
- [ ] Enable Key Vault access policies for AKS
- [ ] Set up secret rotation policies

### OAuth Security:
- [ ] Configure proper callback URLs (HTTPS only)
- [ ] Restrict OAuth scopes to minimum needed
- [ ] Implement PKCE for mobile OAuth

### Payment Security:
- [ ] Stripe webhook signature verification
- [ ] PCI compliance review
- [ ] Secure storage of payment methods (use Stripe Customer IDs, not raw data)

### Data Protection:
- [ ] Enable Azure Blob Storage encryption at rest
- [ ] Use SAS tokens with expiration for blob access
- [ ] Implement file upload virus scanning (ClamAV integration exists but disabled)

---

## 15. TESTING RECOMMENDATIONS

### Before Deployment:
1. **Integration Testing:**
   - [ ] Test OAuth flows (Google, LinkedIn, GitHub)
   - [ ] Test payment flows (Stripe)
   - [ ] Test file uploads (Azure Blob)
   - [ ] Test push notifications (FCM, APNs)

2. **Load Testing:**
   - [ ] Redis connection pooling
   - [ ] PostgreSQL connection limits
   - [ ] API rate limiting
   - [ ] Elasticsearch query performance

3. **Security Testing:**
   - [ ] OWASP Top 10 vulnerabilities
   - [ ] Secrets not exposed in logs
   - [ ] HTTPS enforcement
   - [ ] CORS configuration

---

## SUMMARY

### Ready to Deploy (7):
- web, auth-service, user-service, job-service, analytics-service, notification-service, ai-service

### Need Docker Images (4):
- resume-service, auto-apply-service, payment-service, orchestrator-service

### Need Full Setup (2):
- admin, employer (images + K8s + CI/CD)

### Need Configuration (15+ secrets):
- OAuth providers, payment gateways, Azure storage, Firebase, AI services

### Total Action Items: 60+ tasks across critical, medium, and low priority

**Recommendation:** Focus on critical path first (build missing images, configure OAuth, set up Azure Storage, configure Firebase) before attempting production deployment.
