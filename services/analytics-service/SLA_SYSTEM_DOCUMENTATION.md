# Interview-Guarantee SLA System Documentation

## Overview

The Interview-Guarantee SLA (Service Level Agreement) System is a comprehensive, production-ready module that provides trackable, enforceable interview guarantees for ApplyForUs platform users. This system manages contracts, tracks progress, detects violations, and automatically issues remedies.

## Table of Contents

1. [Architecture](#architecture)
2. [SLA Tiers](#sla-tiers)
3. [Eligibility Requirements](#eligibility-requirements)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Business Logic](#business-logic)
7. [Violation Handling](#violation-handling)
8. [Remedies](#remedies)
9. [Integration Guide](#integration-guide)
10. [Testing](#testing)

---

## Architecture

### Module Structure

```
src/modules/sla/
├── entities/
│   ├── sla-contract.entity.ts       # Main SLA contract
│   ├── sla-progress.entity.ts       # Progress tracking events
│   ├── sla-violation.entity.ts      # Violation records
│   └── sla-remedy.entity.ts         # Remedies issued
├── services/
│   ├── sla.service.ts               # Main business logic
│   ├── eligibility-checker.service.ts  # Eligibility validation
│   └── violation-handler.service.ts # Violation detection & remedies
├── dto/
│   ├── create-sla-contract.dto.ts
│   ├── track-progress.dto.ts
│   └── sla-response.dto.ts
├── enums/
│   └── sla.enums.ts                 # All enums and configurations
├── sla.controller.ts                # REST API endpoints
└── sla.module.ts                    # NestJS module
```

### Key Components

1. **SLA Contract**: Formal agreement between user and platform
2. **Progress Tracking**: Records applications, responses, and interviews
3. **Violation Detection**: Automated daily checks for SLA violations
4. **Remedy System**: Automatic issuance of service extensions, credits, and refunds

---

## SLA Tiers

### Professional Tier ($89.99)

- **Guarantee**: 3 interviews in 60 days
- **Confidence Threshold**: 65%
- **Features**:
  - AI-powered job matching
  - Auto-apply to jobs
  - Resume optimization
  - Email support

### Premium Tier ($149.99)

- **Guarantee**: 5 interviews in 45 days
- **Confidence Threshold**: 70%
- **Features**:
  - All Professional features
  - Priority application processing
  - Advanced analytics
  - Interview preparation resources
  - Priority support

### Elite Tier ($299.99)

- **Guarantee**: 10 interviews in 30 days
- **Confidence Threshold**: 75%
- **Features**:
  - All Premium features
  - Dedicated recruiter support
  - Custom job search strategy
  - Direct employer connections
  - Salary negotiation assistance
  - 24/7 priority support

---

## Eligibility Requirements

### Professional Tier

- **Required Fields**:
  - Basic info (name, email)
  - Contact info (phone, location)
  - Work experience (at least one entry)
  - Resume uploaded
- **Resume Score**: Minimum 70%
- **Work Experience**: No minimum
- **Approved Resume**: Required

### Premium Tier

- **Required Fields**:
  - All Professional fields
  - Education history
  - Skills (at least 3)
  - Job preferences
- **Resume Score**: Minimum 75%
- **Work Experience**: 6 months minimum
- **Approved Resume**: Required

### Elite Tier

- **Required Fields**: All Premium fields
- **Resume Score**: Minimum 80%
- **Work Experience**: 12 months minimum
- **Approved Resume**: Required

---

## Database Schema

### sla_contracts

Primary table storing SLA contract details.

```typescript
{
  id: UUID (PK)
  userId: UUID (indexed)
  tier: ENUM (professional, premium, elite)
  status: ENUM (active, paused, completed, violated, cancelled)

  // Guarantee Terms
  guaranteedInterviews: INTEGER
  deadlineDays: INTEGER
  minConfidenceThreshold: DECIMAL(3,2)
  contractPrice: DECIMAL(10,2)

  // Dates
  startDate: TIMESTAMP
  endDate: TIMESTAMP
  extendedEndDate: TIMESTAMP (nullable)

  // Progress Counters (denormalized)
  totalApplicationsSent: INTEGER
  totalEmployerResponses: INTEGER
  totalInterviewsScheduled: INTEGER
  totalInterviewsCompleted: INTEGER
  totalOffersReceived: INTEGER

  // Payment
  stripePaymentIntentId: VARCHAR(255)
  stripeSubscriptionId: VARCHAR(255)
  isPaid: BOOLEAN

  // Eligibility
  isEligible: BOOLEAN
  eligibilityCheckResult: JSONB

  // Metadata
  metadata: JSONB
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### sla_progress

Tracks all progress events (applications, responses, interviews).

```typescript
{
  id: UUID (PK)
  contractId: UUID (FK -> sla_contracts)
  userId: UUID (indexed)
  eventType: ENUM (application_sent, employer_response, interview_scheduled, interview_completed, offer_received)

  // Application Details
  applicationId: UUID
  jobId: UUID
  jobTitle: VARCHAR(500)
  companyName: VARCHAR(500)
  confidenceScore: DECIMAL(3,2)
  meetsConfidenceThreshold: BOOLEAN

  // Interview Details
  interviewScheduledAt: TIMESTAMP
  interviewType: VARCHAR(100)
  interviewLocation: VARCHAR(255)

  // Response Details
  responseType: VARCHAR(100)
  responseContent: TEXT

  // Verification
  isVerified: BOOLEAN
  verifiedAt: TIMESTAMP
  verifiedBy: VARCHAR(255)

  // Metadata
  source: VARCHAR(100)
  sourceReference: VARCHAR(255)
  metadata: JSONB
  createdAt: TIMESTAMP
}
```

### sla_violations

Records when SLA contracts are violated.

```typescript
{
  id: UUID (PK)
  contractId: UUID (FK -> sla_contracts)
  userId: UUID (indexed)
  violationType: ENUM (interview_guarantee_not_met, deadline_exceeded, eligibility_lost)

  // Violation Details
  detectedAt: TIMESTAMP
  guaranteedInterviews: INTEGER
  actualInterviews: INTEGER
  interviewsShortfall: INTEGER
  daysOverDeadline: INTEGER

  // Contract State
  totalApplicationsSent: INTEGER
  totalEmployerResponses: INTEGER
  responseRate: DECIMAL(5,2)
  interviewRate: DECIMAL(5,2)

  // Analysis
  rootCauseFactors: JSONB
  analysisNotes: TEXT

  // Escalation
  isEscalated: BOOLEAN
  escalatedAt: TIMESTAMP
  escalatedTo: VARCHAR(255)
  escalationTicketId: VARCHAR(255)

  // Resolution
  isResolved: BOOLEAN
  resolvedAt: TIMESTAMP
  resolutionNotes: TEXT

  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

### sla_remedies

Tracks remedies issued for SLA violations.

```typescript
{
  id: UUID (PK)
  violationId: UUID (FK -> sla_violations)
  userId: UUID (indexed)
  contractId: UUID
  remedyType: ENUM (service_extension, human_recruiter_escalation, service_credit, partial_refund, full_refund)
  status: ENUM (pending, in_progress, completed, failed)

  // Remedy Details
  description: TEXT
  remedyDetails: JSONB {
    extensionDays?: number
    newEndDate?: Date
    creditAmount?: number
    creditCode?: string
    refundAmount?: number
    refundPercentage?: number
    recruiterId?: string
    ticketId?: string
  }

  // Execution
  issuedAt: TIMESTAMP
  issuedBy: VARCHAR(255)
  executedAt: TIMESTAMP
  executedBy: VARCHAR(255)
  completedAt: TIMESTAMP

  // Approval
  requiresApproval: BOOLEAN
  isApproved: BOOLEAN
  approvedAt: TIMESTAMP
  approvedBy: VARCHAR(255)

  // Financial
  financialImpact: DECIMAL(10,2)
  currency: VARCHAR(10)

  // Tracking
  executionLog: JSONB[]
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
```

---

## API Endpoints

### Contract Management

#### Create SLA Contract

```http
POST /api/v1/sla/contracts
Content-Type: application/json

{
  "userId": "uuid",
  "tier": "professional" | "premium" | "elite",
  "stripePaymentIntentId": "pi_xxx",
  "metadata": {
    "referralCode": "FRIEND20",
    "campaignId": "summer2024"
  }
}

Response 201:
{
  "success": true,
  "contract": { SLAStatusResponseDto },
  "message": "SLA contract created successfully"
}
```

#### Get SLA Status

```http
GET /api/v1/sla/status/:userId

Response 200:
{
  "id": "uuid",
  "userId": "uuid",
  "tier": "professional",
  "status": "active",
  "guaranteedInterviews": 3,
  "deadlineDays": 60,
  "daysRemaining": 45,
  "totalApplicationsSent": 25,
  "totalInterviewsScheduled": 2,
  "progressPercentage": 66.67,
  "responseRate": 12.5,
  "interviewRate": 8.0,
  "isGuaranteeMet": false,
  "isActive": true
}
```

#### Get Dashboard Data

```http
GET /api/v1/sla/dashboard/:userId

Response 200:
{
  "contract": { SLAStatusResponseDto },
  "recentProgress": [ ProgressEventSummaryDto ],
  "analytics": {
    "daysActive": 15,
    "daysRemaining": 45,
    "applicationsPerDay": 1.67,
    "responseRate": 12.5,
    "interviewRate": 8.0,
    "onTrackToMeetGuarantee": true,
    "projectedInterviews": 4
  },
  "milestones": [
    {
      "title": "Interview Guarantee",
      "target": 3,
      "current": 2,
      "isCompleted": false
    }
  ],
  "recommendations": [
    "Increase application volume to at least 2 applications per day"
  ]
}
```

### Eligibility

#### Check Eligibility

```http
GET /api/v1/sla/eligibility/:userId?tier=professional

Response 200:
{
  "userId": "uuid",
  "tier": "professional",
  "status": "eligible",
  "isEligible": true,
  "checkResult": {
    "passedFields": ["basic_info", "contact_info", "work_experience", "resume"],
    "failedFields": [],
    "profileCompleteness": 100,
    "resumeScore": 80,
    "workExperienceMonths": 24,
    "hasApprovedResume": true,
    "meetsMinimumRequirements": true
  },
  "recommendations": [
    "You meet all eligibility requirements!"
  ]
}
```

### Progress Tracking

#### Track Application

```http
POST /api/v1/sla/track-application
Content-Type: application/json

{
  "userId": "uuid",
  "applicationId": "uuid",
  "jobId": "uuid",
  "jobTitle": "Software Engineer",
  "companyName": "Tech Corp",
  "confidenceScore": 0.85
}

Response 201:
{
  "success": true,
  "progressEvent": { ProgressEventSummaryDto },
  "contractUpdated": true,
  "newMetrics": {
    "totalApplications": 26,
    "totalInterviews": 2,
    "progressPercentage": 66.67
  },
  "message": "Application tracked successfully"
}
```

#### Track Employer Response

```http
POST /api/v1/sla/track-response
Content-Type: application/json

{
  "userId": "uuid",
  "applicationId": "uuid",
  "responseType": "interview_request",
  "responseContent": "We'd like to schedule an interview",
  "source": "email",
  "metadata": {
    "emailSubject": "Interview Invitation",
    "emailFrom": "recruiter@techcorp.com"
  }
}
```

#### Track Interview

```http
POST /api/v1/sla/track-interview
Content-Type: application/json

{
  "userId": "uuid",
  "applicationId": "uuid",
  "interviewScheduledAt": "2024-01-15T14:00:00Z",
  "interviewType": "video",
  "interviewLocation": "Zoom",
  "metadata": {
    "calendarEventId": "cal_123",
    "interviewerName": "John Doe"
  }
}

Response 201:
{
  "success": true,
  "progressEvent": { ProgressEventSummaryDto },
  "contractUpdated": true,
  "newMetrics": {
    "totalApplications": 26,
    "totalInterviews": 3,
    "progressPercentage": 100
  },
  "message": "Interview tracked successfully (counts toward guarantee)"
}
```

#### Bulk Track Progress

```http
POST /api/v1/sla/track-bulk
Content-Type: application/json

{
  "applications": [ TrackApplicationDto[] ],
  "responses": [ TrackResponseDto[] ],
  "interviews": [ TrackInterviewDto[] ]
}

Response 201:
{
  "success": true,
  "processed": 15,
  "failed": 0,
  "results": {
    "applications": [],
    "responses": [],
    "interviews": []
  },
  "errors": []
}
```

### Contract Extensions

#### Extend Contract

```http
POST /api/v1/sla/extend/:userId
Content-Type: application/json

{
  "extensionDays": 14,
  "reason": "SLA violation remedy"
}

Response 200:
{
  "id": "uuid",
  "extendedEndDate": "2024-03-15T00:00:00Z",
  "daysRemaining": 59
}
```

### Violations & Remedies

#### Get Violations

```http
GET /api/v1/sla/violations/:userId

Response 200:
[
  {
    "id": "uuid",
    "violationType": "interview_guarantee_not_met",
    "detectedAt": "2024-01-01T00:00:00Z",
    "guaranteedInterviews": 3,
    "actualInterviews": 1,
    "interviewsShortfall": 2,
    "severity": "medium",
    "isResolved": false
  }
]
```

#### Get Remedies

```http
GET /api/v1/sla/remedies/:violationId

Response 200:
[
  {
    "id": "uuid",
    "remedyType": "service_extension",
    "status": "completed",
    "description": "Service extended by 14 days",
    "completedAt": "2024-01-02T00:00:00Z"
  }
]
```

#### Approve Remedy (Admin)

```http
POST /api/v1/sla/remedies/:remedyId/approve
Content-Type: application/json

{
  "approvedBy": "admin-uuid",
  "notes": "Approved for partial refund"
}
```

---

## Business Logic

### Contract Lifecycle

1. **Creation**
   - Eligibility check performed
   - Payment validated
   - Contract created with status: ACTIVE
   - Start/end dates calculated based on tier

2. **Active Period**
   - Applications tracked automatically
   - Responses and interviews recorded
   - Progress counters updated in real-time
   - Dashboard metrics calculated

3. **Completion**
   - User meets guarantee: Status → COMPLETED
   - Contract expires: Status → COMPLETED or VIOLATED

4. **Violation**
   - Daily cron job checks expired contracts
   - Violation detected if guarantee not met
   - Remedies automatically issued
   - Status → VIOLATED

### Progress Tracking Rules

1. **Application Tracking**
   - All applications tracked regardless of confidence
   - Only applications ≥ confidence threshold count toward quality metrics
   - Auto-verified for applications

2. **Interview Tracking**
   - Must be linked to tracked application
   - Inherits confidence score from application
   - Only interviews from qualifying applications count toward guarantee
   - Requires verification for manual entries

3. **Confidence Thresholds**
   - Professional: 65%
   - Premium: 70%
   - Elite: 75%
   - Only interviews from jobs meeting threshold count

### Violation Detection

**Daily Cron Job** (runs at midnight):

```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
async checkViolations()
```

**Violation Criteria**:
- Contract status = ACTIVE
- Current date > effective end date
- Total interviews < guaranteed interviews

**Root Cause Analysis**:
- Low application volume (< 50% expected)
- Low response rate (< 10%)
- Profile eligibility issues
- User inactivity
- System issues

---

## Violation Handling

### Automatic Remedies

When a violation is detected, the system automatically issues appropriate remedies:

#### Service Extension
- **Trigger**: Shortfall ≤ 2 interviews
- **Action**: Extend contract by 50% of original deadline (max 30 days)
- **Financial Impact**: $0
- **Approval Required**: No

#### Human Recruiter Escalation
- **Trigger**: Shortfall > 2 interviews OR days overdue > 7
- **Action**: Create support ticket, assign recruiter
- **Priority**: Based on violation severity
- **Approval Required**: No

#### Service Credit
- **Trigger**: Response rate < 5%
- **Amount**: 25% of contract price
- **Expiry**: 90 days
- **Approval Required**: Yes (if > $50)

#### Partial Refund
- **Trigger**: Shortfall ≥ 50% of guarantee
- **Amount**: Proportional to shortfall (max 50%)
- **Processing**: Via Stripe
- **Approval Required**: Yes

#### Full Refund
- **Trigger**: Manual admin decision
- **Amount**: 100% of contract price
- **Processing**: Via Stripe
- **Approval Required**: Yes

### Remedy Execution Flow

```
1. Violation Detected
   ↓
2. Root Cause Analysis
   ↓
3. Recommended Remedies Generated
   ↓
4. Remedies Created (status: PENDING)
   ↓
5. Approval Check
   ├─ No Approval Required → Auto-Execute
   └─ Approval Required → Wait for Admin
   ↓
6. Execute Remedy
   ├─ Service Extension → Update contract
   ├─ Escalation → Create ticket
   ├─ Credit → Issue credit code
   └─ Refund → Process via Stripe
   ↓
7. Update Status → COMPLETED / FAILED
   ↓
8. Notify User
```

---

## Remedies

### Service Extension

**Details**:
```typescript
{
  extensionDays: 14,
  newEndDate: Date,
  financialImpact: 0
}
```

**Implementation**:
- Updates contract.extensionDays
- Sets contract.extendedEndDate
- Adds notes to contract.metadata

### Human Recruiter Escalation

**Details**:
```typescript
{
  escalationLevel: 'high',
  ticketId: 'TICKET-123',
  recruiterId: 'recruiter-uuid',
  meetingScheduled: false
}
```

**Implementation**:
- Creates support ticket
- Assigns to recruiter based on tier priority
- Sends escalation notification

### Service Credit

**Details**:
```typescript
{
  creditAmount: 22.50,
  creditCurrency: 'USD',
  creditCode: 'CREDIT-123',
  creditExpiryDate: Date
}
```

**Implementation**:
- Generates unique credit code
- Stores in payment system
- User can apply to next purchase

### Partial Refund

**Details**:
```typescript
{
  refundAmount: 44.99,
  refundCurrency: 'USD',
  refundPercentage: 50,
  stripeRefundId: 're_xxx'
}
```

**Implementation**:
- Calculates refund based on shortfall
- Processes via Stripe API
- Updates payment records

---

## Integration Guide

### 1. Setup Database

Run migrations to create SLA tables:

```bash
npm run typeorm -- migration:generate -n CreateSLATables
npm run typeorm -- migration:run
```

### 2. Environment Variables

Add to `.env`:

```env
# SLA Configuration
SLA_ENABLED=true
SLA_VIOLATION_CHECK_CRON=0 0 * * *
SLA_AUTO_REMEDY=true
SLA_REQUIRE_PAYMENT=true
```

### 3. Module Integration

The SLA module is automatically imported in `app.module.ts`:

```typescript
import { SLAModule } from './modules/sla/sla.module';

@Module({
  imports: [
    // ...
    SLAModule,
  ],
})
```

### 4. External Service Integration

#### User Service Integration

Update `eligibility-checker.service.ts` to fetch real user data:

```typescript
private async fetchUserProfile(userId: string): Promise<any> {
  const response = await this.httpService.get(
    `${this.configService.get('USER_SERVICE_URL')}/api/v1/users/${userId}/profile`
  ).toPromise();
  return response.data;
}
```

#### Payment Service Integration

Update `violation-handler.service.ts` to process real refunds:

```typescript
private async executeRefund(remedy: SLARemedy, contract: SLAContract): Promise<boolean> {
  const response = await this.httpService.post(
    `${this.configService.get('PAYMENT_SERVICE_URL')}/api/v1/refunds`,
    {
      paymentIntentId: contract.stripePaymentIntentId,
      amount: remedy.remedyDetails.refundAmount,
      reason: 'sla_violation'
    }
  ).toPromise();

  remedy.remedyDetails.stripeRefundId = response.data.id;
  return response.data.status === 'succeeded';
}
```

### 5. Frontend Integration

#### Check Eligibility

```typescript
const checkEligibility = async (userId: string, tier: string) => {
  const response = await fetch(
    `/api/v1/sla/eligibility/${userId}?tier=${tier}`
  );
  return response.json();
};
```

#### Create Contract

```typescript
const createSLAContract = async (userId: string, tier: string, paymentIntentId: string) => {
  const response = await fetch('/api/v1/sla/contracts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, tier, stripePaymentIntentId: paymentIntentId })
  });
  return response.json();
};
```

#### Get Dashboard

```typescript
const getDashboard = async (userId: string) => {
  const response = await fetch(`/api/v1/sla/dashboard/${userId}`);
  return response.json();
};
```

---

## Testing

### Unit Tests

Run SLA service tests:

```bash
npm test -- sla.service.spec
```

Test coverage includes:
- Contract creation with eligibility checks
- Progress tracking (applications, responses, interviews)
- Violation detection
- Remedy issuance
- Dashboard analytics

### Integration Tests

```typescript
describe('SLA Integration', () => {
  it('should create contract, track progress, and meet guarantee', async () => {
    // 1. Create contract
    const contract = await createContract(userId, 'professional');

    // 2. Track 20 applications
    for (let i = 0; i < 20; i++) {
      await trackApplication({ userId, ... });
    }

    // 3. Track 3 interviews
    for (let i = 0; i < 3; i++) {
      await trackInterview({ userId, ... });
    }

    // 4. Verify guarantee met
    const status = await getStatus(userId);
    expect(status.isGuaranteeMet).toBe(true);
  });
});
```

### Manual Testing

Use the provided Swagger documentation:

```
http://localhost:8006/api-docs
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Contract Metrics**
   - Active contracts count
   - Average progress percentage
   - Guarantee met rate
   - Violation rate

2. **Violation Metrics**
   - Violations per day
   - Average shortfall
   - Escalation rate
   - Resolution time

3. **Remedy Metrics**
   - Remedies issued per type
   - Financial impact
   - Approval pending count
   - Execution success rate

### Recommended Alerts

1. **High Violation Rate**
   - Alert if > 20% of contracts violated in a week

2. **Pending Approvals**
   - Alert if > 10 remedies pending approval for > 24 hours

3. **Failed Remedy Execution**
   - Alert immediately on any remedy execution failure

4. **Low Application Volume**
   - Alert if user has SLA contract but < 1 app/day

---

## FAQ

### Q: What happens if a user becomes ineligible during active contract?

A: The contract continues but the user is notified to restore eligibility. Severe cases may result in contract pause.

### Q: Can users have multiple active contracts?

A: No, only one active contract per user. Previous contracts must complete before creating new ones.

### Q: What if a user disputes an interview not being counted?

A: Use the `/verify-progress` endpoint to manually verify the interview. Admins can override verification status.

### Q: How are partial interviews (cancelled/rescheduled) handled?

A: Only scheduled interviews count. If cancelled, the event can be marked as not verified.

### Q: Can contracts be cancelled?

A: Yes, but refund policy applies. Use contract update endpoint with status=CANCELLED.

---

## Support

For questions or issues:

1. Check this documentation
2. Review Swagger API docs
3. Check unit tests for examples
4. Contact development team

---

**Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained By**: ApplyForUs Platform Team
