# ApplyForUs End-to-End Test Matrix

**Version**: 1.0.0
**Last Updated**: 2025-12-10

---

## 1. USER JOURNEY TEST CASES

### 1.1 Authentication Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AUTH-001 | New User Registration | 1. Navigate to /register 2. Fill email/password 3. Submit 4. Verify email | User created, verification email sent | P0 |
| AUTH-002 | Email Verification | 1. Click verification link 2. Redirect to login | Account verified, can login | P0 |
| AUTH-003 | User Login | 1. Navigate to /login 2. Enter credentials 3. Submit | JWT returned, redirected to dashboard | P0 |
| AUTH-004 | Password Reset | 1. Click forgot password 2. Enter email 3. Receive reset email 4. Set new password | Password updated, can login | P1 |
| AUTH-005 | Google OAuth | 1. Click "Sign in with Google" 2. Authorize 3. Callback | Account linked, logged in | P1 |
| AUTH-006 | LinkedIn OAuth | 1. Click "Sign in with LinkedIn" 2. Authorize 3. Callback | Account linked, logged in | P1 |
| AUTH-007 | GitHub OAuth | 1. Click "Sign in with GitHub" 2. Authorize 3. Callback | Account linked, logged in | P2 |
| AUTH-008 | Enable 2FA | 1. Go to security settings 2. Enable 2FA 3. Scan QR 4. Enter code | 2FA enabled | P1 |
| AUTH-009 | 2FA Login | 1. Login with password 2. Enter 2FA code | Login successful | P1 |
| AUTH-010 | Session Timeout | 1. Login 2. Wait 30min idle | Session expired, redirect to login | P2 |
| AUTH-011 | Logout | 1. Click logout | Token invalidated, redirect to home | P0 |

### 1.2 User Profile Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PROF-001 | Complete Profile | 1. Navigate to profile 2. Fill all fields 3. Save | Profile saved, progress 100% | P0 |
| PROF-002 | Upload Avatar | 1. Go to profile 2. Upload image | Image uploaded to S3 | P1 |
| PROF-003 | Add Work Experience | 1. Click add experience 2. Fill details 3. Save | Experience added to profile | P0 |
| PROF-004 | Add Education | 1. Click add education 2. Fill details 3. Save | Education added to profile | P0 |
| PROF-005 | Add Skills | 1. Search/select skills 2. Set proficiency | Skills added with levels | P0 |
| PROF-006 | Update Preferences | 1. Set job preferences 2. Set salary range 3. Save | Preferences stored | P1 |
| PROF-007 | Export Profile | 1. Click export 2. Choose format | PDF/JSON downloaded | P2 |

### 1.3 Job Search & Application Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| JOB-001 | Search Jobs | 1. Enter keywords 2. Set filters 3. Search | Matching jobs returned | P0 |
| JOB-002 | Filter by Location | 1. Search 2. Filter by city 3. Apply filter | Jobs filtered by location | P0 |
| JOB-003 | Filter by Salary | 1. Set salary range 2. Apply | Jobs within range shown | P1 |
| JOB-004 | View Job Details | 1. Click job card 2. View details page | Full job description shown | P0 |
| JOB-005 | Save Job | 1. Click save icon 2. Check saved jobs | Job added to saved list | P0 |
| JOB-006 | Unsave Job | 1. Click unsave 2. Check saved jobs | Job removed from saved | P1 |
| JOB-007 | Create Job Alert | 1. Set criteria 2. Enable alert | Alert created, emails configured | P1 |
| JOB-008 | Apply to Job | 1. Click apply 2. Select resume 3. Submit | Application submitted | P0 |
| JOB-009 | View Application History | 1. Navigate to applications | All applications listed | P0 |
| JOB-010 | Company Profile | 1. Click company name 2. View profile | Company details, reviews shown | P1 |

### 1.4 Resume Builder Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| RES-001 | Create Resume | 1. Click new resume 2. Choose template 3. Name it | Empty resume created | P0 |
| RES-002 | Select Template | 1. Browse templates 2. Select one 3. Apply | Template applied to resume | P0 |
| RES-003 | Edit Resume Section | 1. Click section 2. Edit content 3. Save | Section updated | P0 |
| RES-004 | Reorder Sections | 1. Drag section 2. Drop in new position | Order persisted | P1 |
| RES-005 | Import LinkedIn | 1. Connect LinkedIn 2. Import data | Profile data populated | P2 |
| RES-006 | AI Optimize Resume | 1. Click optimize 2. Select job posting 3. Apply | Resume tailored to job | P1 |
| RES-007 | Export PDF | 1. Click export 2. Select PDF 3. Download | PDF generated correctly | P0 |
| RES-008 | Version Control | 1. Save changes 2. View version history 3. Restore | Previous version restored | P2 |
| RES-009 | Duplicate Resume | 1. Click duplicate 2. Rename | Copy created | P1 |
| RES-010 | Delete Resume | 1. Click delete 2. Confirm | Resume soft deleted | P1 |

### 1.5 AI Features Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AI-001 | Generate Cover Letter | 1. Select job 2. Click generate 3. Wait | Cover letter generated | P0 |
| AI-002 | Edit AI Content | 1. Generate content 2. Edit 3. Save | Custom edits preserved | P1 |
| AI-003 | Interview Prep | 1. Select job 2. Start prep 3. Answer questions | Feedback provided | P1 |
| AI-004 | Salary Insights | 1. Enter job title 2. Select location 3. View | Salary range shown | P2 |
| AI-005 | Company Research | 1. Search company 2. View insights | Company info displayed | P2 |

### 1.6 Auto-Apply Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| AUTO-001 | Configure Settings | 1. Set job criteria 2. Set limits 3. Save | Settings stored | P0 |
| AUTO-002 | Add Answer Library | 1. Add common Q&A 2. Save | Answers available for auto-fill | P1 |
| AUTO-003 | Run Auto-Apply | 1. Start auto-apply 2. Monitor progress | Applications submitted | P0 |
| AUTO-004 | View Auto-Apply Results | 1. Check results page | Success/failure stats shown | P0 |
| AUTO-005 | Pause Auto-Apply | 1. Click pause 2. Verify stopped | Auto-apply halted | P1 |
| AUTO-006 | Resume Auto-Apply | 1. Click resume 2. Verify running | Auto-apply continues | P1 |

### 1.7 Subscription & Payment Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| PAY-001 | View Plans | 1. Navigate to pricing | All 6 tiers displayed | P0 |
| PAY-002 | Subscribe Stripe | 1. Select plan 2. Enter card 3. Complete | Subscription active | P0 |
| PAY-003 | Subscribe Flutterwave | 1. Select NGN 2. Pay via bank | Subscription active | P1 |
| PAY-004 | Subscribe Paystack | 1. Select NGN 2. Pay via card | Subscription active | P1 |
| PAY-005 | Upgrade Plan | 1. Click upgrade 2. Select higher tier 3. Pay | Tier upgraded, prorated | P0 |
| PAY-006 | Downgrade Plan | 1. Click downgrade 2. Confirm | Tier changed at period end | P1 |
| PAY-007 | Cancel Subscription | 1. Click cancel 2. Confirm | Cancelled at period end | P0 |
| PAY-008 | Reactivate Subscription | 1. Click reactivate 2. Confirm | Subscription restored | P1 |
| PAY-009 | Purchase Coins | 1. Select package 2. Pay | Coins credited | P1 |
| PAY-010 | Boost Visibility | 1. Select resume 2. Choose boost 3. Pay coins | Boost activated | P2 |
| PAY-011 | View Invoices | 1. Navigate to billing | Invoice history shown | P1 |
| PAY-012 | Download Invoice | 1. Click download | PDF invoice downloaded | P2 |
| PAY-013 | Update Payment Method | 1. Go to billing 2. Update card | New card saved | P1 |

### 1.8 Notification Flow

| ID | Test Case | Steps | Expected Result | Priority |
|----|-----------|-------|-----------------|----------|
| NOTIF-001 | Receive Job Alert | 1. Create alert 2. New job matches | Email/push received | P0 |
| NOTIF-002 | Application Status | 1. Apply to job 2. Status changes | Notification received | P0 |
| NOTIF-003 | Configure Preferences | 1. Go to settings 2. Toggle notifications | Preferences saved | P1 |
| NOTIF-004 | Mark as Read | 1. View notification 2. Mark read | Unread count decremented | P1 |
| NOTIF-005 | Push Registration | 1. Enable push 2. Register device | Device token stored | P2 |

---

## 2. API ENDPOINT TEST CASES

### 2.1 Auth Service (8001)

| Endpoint | Method | Test Cases |
|----------|--------|------------|
| /auth/register | POST | Valid registration, duplicate email, invalid password |
| /auth/login | POST | Valid login, invalid credentials, account locked |
| /auth/refresh | POST | Valid token, expired token, invalid token |
| /auth/logout | POST | Valid logout, already logged out |
| /auth/oauth/google | GET | Valid OAuth flow, cancelled OAuth |
| /auth/2fa/enable | POST | Enable 2FA, already enabled |
| /auth/2fa/verify | POST | Valid code, invalid code, expired code |

### 2.2 User Service (8002)

| Endpoint | Method | Test Cases |
|----------|--------|------------|
| /users/:id/profile | GET | Own profile, other user (403) |
| /users/:id/profile | PUT | Valid update, invalid data |
| /users/:id/preferences | GET/PUT | Get preferences, update preferences |
| /users/:id/work-experience | GET/POST | List, add new |
| /users/:id/education | GET/POST | List, add new |
| /users/:id/skills | GET/POST | List, add skills |

### 2.3 Job Service (8003)

| Endpoint | Method | Test Cases |
|----------|--------|------------|
| /jobs | GET | No filters, with filters, pagination |
| /jobs/:id | GET | Exists, not found |
| /jobs/saved | GET/POST | List saved, save job, already saved |
| /jobs/alerts | GET/POST | List alerts, create alert |
| /companies/:id | GET | Exists, not found |

### 2.4 Resume Service (8004)

| Endpoint | Method | Test Cases |
|----------|--------|------------|
| /resumes | GET/POST | List user resumes, create new |
| /resumes/:id | GET/PUT/DELETE | Get, update, delete |
| /resumes/:id/export | POST | Export PDF, export DOCX |
| /templates | GET | List available templates |

### 2.5 Payment Service (8009)

| Endpoint | Method | Test Cases |
|----------|--------|------------|
| /subscriptions | POST | Create free, create paid |
| /subscriptions/user/:userId | GET | Get user subscription |
| /subscriptions/checkout-session | POST | Stripe checkout |
| /stripe/webhook | POST | All webhook events (30+) |
| /coins/purchase | POST | Valid purchase, insufficient funds |
| /coins/boost-visibility | POST | Valid boost, no coins |

---

## 3. INTEGRATION TEST SCENARIOS

### 3.1 Cross-Service Flows

| ID | Scenario | Services Involved | Test Steps |
|----|----------|------------------|------------|
| INT-001 | Full Registration to First Application | auth, user, job, resume | Register → Complete profile → Create resume → Apply to job |
| INT-002 | Subscription Upgrade Flow | auth, payment, user | Login → View limits → Upgrade → Verify new limits |
| INT-003 | AI Cover Letter Generation | auth, ai, job, resume | Login → Select job → Generate cover letter → Save to resume |
| INT-004 | Auto-Apply End-to-End | auth, auto-apply, job, notification | Configure → Run → Verify applications → Check notifications |
| INT-005 | Payment Webhook Flow | payment, notification, analytics | Stripe webhook → Update subscription → Send email → Track event |

### 3.2 Failure Scenarios

| ID | Scenario | Expected Behavior |
|----|----------|-------------------|
| FAIL-001 | Database unavailable | Health check fails, graceful degradation |
| FAIL-002 | Redis unavailable | Fallback to DB sessions |
| FAIL-003 | AI service timeout | User-friendly error, retry option |
| FAIL-004 | Stripe webhook retry | Idempotent processing |
| FAIL-005 | Message queue down | Events queued in fallback |

---

## 4. PERFORMANCE TEST CASES

| Metric | Target | Test |
|--------|--------|------|
| Job Search Response | < 500ms | 1000 concurrent searches |
| Resume Export (PDF) | < 3s | 100 concurrent exports |
| AI Generation | < 10s | 50 concurrent requests |
| Login Response | < 200ms | 500 concurrent logins |
| Database Queries | < 100ms | Most common queries |

---

## 5. SECURITY TEST CASES

| ID | Test | Expected |
|----|------|----------|
| SEC-001 | SQL Injection | Sanitized, no injection |
| SEC-002 | XSS Attack | Content escaped |
| SEC-003 | CSRF Token | Valid token required |
| SEC-004 | Rate Limiting | 429 after limit exceeded |
| SEC-005 | JWT Expiry | Expired tokens rejected |
| SEC-006 | Authorization | Users can't access others' data |
| SEC-007 | Webhook Signature | Invalid signatures rejected |

---

## 6. TEST ENVIRONMENT

### 6.1 Environments

| Environment | URL | Database | Purpose |
|-------------|-----|----------|---------|
| Development | dev.applyforus.com | applyforus-dev | Feature testing |
| Staging | staging.applyforus.com | applyforus-staging | Pre-release testing |
| Production | app.applyforus.com | applyforus-prod | Live |

### 6.2 Test Data

- Seed users with all subscription tiers
- Sample job postings from multiple sources
- Pre-built resume templates
- Test Stripe/payment credentials

---

## 7. AUTOMATION COVERAGE

| Category | Manual | Automated | Target |
|----------|--------|-----------|--------|
| Unit Tests | 0% | 85% | 90% |
| API Tests | 10% | 70% | 85% |
| E2E Tests | 60% | 40% | 70% |
| Performance | 80% | 20% | 50% |
| Security | 50% | 50% | 80% |

---

*This test matrix is maintained by the QA team and updated with each release.*
