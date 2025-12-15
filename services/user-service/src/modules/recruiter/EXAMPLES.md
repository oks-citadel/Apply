# Recruiter Marketplace - Usage Examples

## Table of Contents
1. [Recruiter Registration Flow](#recruiter-registration-flow)
2. [User Assignment Flow](#user-assignment-flow)
3. [Application Escalation Flow](#application-escalation-flow)
4. [Placement Tracking Flow](#placement-tracking-flow)
5. [Review Submission Flow](#review-submission-flow)
6. [Revenue Calculation Examples](#revenue-calculation-examples)

---

## Recruiter Registration Flow

### Step 1: Recruiter Registration
A professional recruiter wants to join the marketplace:

```typescript
// POST /api/v1/recruiters/register
const registrationData = {
  company_name: "Elite Tech Recruiters",
  company_website: "https://elitetechrecruiters.com",
  bio: "We specialize in placing senior software engineers at top tech companies. 10+ years of experience with FAANG placements.",
  years_of_experience: 10,
  linkedin_url: "https://linkedin.com/in/john-recruiter",
  certification: "Certified Personnel Consultant (CPC)",
  certification_url: "https://verify-certification.com/abc123",
  industries: ["technology", "finance"],
  roles: ["software_engineering", "engineering_management", "data_science"],
  regions: ["US-CA", "US-NY", "US-WA"],
  languages: ["English", "Spanish"],
  max_concurrent_assignments: 10,
  available_hours: ["9-12", "14-18"],
  timezone: "America/Los_Angeles",
  placement_fee_percentage: 15
};

// Response: Recruiter profile created with PENDING status
{
  "id": "recruiter-uuid-123",
  "status": "pending",
  "quality_score": 50,
  "tier": "standard",
  "message": "Profile created. Verification pending."
}
```

### Step 2: Admin Verification
Admin reviews and approves the recruiter:

```typescript
// Internal admin endpoint
// PUT /api/v1/admin/recruiters/recruiter-uuid-123/verify
{
  "verified": true,
  "verification_notes": "Credentials verified. CPC certification confirmed.",
  "tier": "standard"
}

// Profile updated to ACTIVE status
```

---

## User Assignment Flow

### Step 1: User Searches for Recruiter
User looking for help with senior engineering roles:

```typescript
// GET /api/v1/recruiters?industries=technology&roles=software_engineering&min_quality_score=70&verified_only=true

// Response: List of qualified recruiters
{
  "data": [
    {
      "id": "recruiter-uuid-123",
      "company_name": "Elite Tech Recruiters",
      "quality_score": 85,
      "average_rating": 4.7,
      "total_placements": 75,
      "success_rate": 92,
      "tier": "premium",
      "placement_fee_percentage": 15,
      "accepting_new_assignments": true,
      "active_assignments": 5,
      "max_concurrent_assignments": 10
    }
  ],
  "meta": { "total": 15, "page": 1 }
}
```

### Step 2: User Creates Assignment
User selects recruiter and creates assignment:

```typescript
// POST /api/v1/recruiters/assign
const assignmentData = {
  recruiter_id: "recruiter-uuid-123",
  assignment_type: "full_service",
  priority: "high",
  user_requirements: "Looking for senior/staff software engineering roles at well-funded startups or established tech companies. Prefer remote or SF Bay Area. Strong background in distributed systems.",
  target_industries: ["technology"],
  target_roles: ["software_engineering"],
  target_locations: ["San Francisco", "Remote"],
  target_salary_min: 180000,
  target_salary_max: 250000,
  salary_currency: "USD"
};

// Response: Assignment created
{
  "id": "assignment-uuid-456",
  "status": "requested",
  "recruiter_id": "recruiter-uuid-123",
  "user_id": "user-uuid-789",
  "assignment_type": "full_service",
  "agreed_fee": 15.0,  // 15% placement fee
  "platform_fee_percentage": 20,  // 20% platform commission (PREMIUM tier)
  "created_at": "2025-12-15T10:00:00Z"
}
```

### Step 3: Recruiter Accepts Assignment
Recruiter reviews and accepts:

```typescript
// PUT /api/v1/recruiters/assignments/assignment-uuid-456
{
  "status": "accepted",
  "recruiter_notes": "Great profile! I have several companies in mind that would be a perfect fit. Will start outreach this week."
}

// Response: Assignment status updated to ACCEPTED
```

### Step 4: Recruiter Updates Progress
Recruiter provides regular updates:

```typescript
// PUT /api/v1/recruiters/assignments/assignment-uuid-456
{
  "status": "in_progress",
  "applications_submitted": 8,
  "interviews_scheduled": 3,
  "recruiter_notes": "Submitted to 8 companies. 3 interviews scheduled next week with TechCorp, DataCo, and StartupXYZ.",
  "progress_percentage": 60
}
```

---

## Application Escalation Flow

### Scenario: User Struggling with Specific Application

User applied to dream company but got rejected at interview stage:

```typescript
// POST /api/v1/recruiters/escalate
{
  "application_id": "app-uuid-999",
  "escalation_reason": "Rejected after technical interview. Need help improving interview performance.",
  "assignment_type": "interview_prep",
  "priority": "urgent",
  "notes": "This was my dream role. I think I struggled with system design questions. Would love coaching on that."
}

// System automatically finds best recruiter for interview prep
// Response:
{
  "id": "assignment-uuid-888",
  "recruiter_id": "recruiter-uuid-555",  // Different recruiter specializing in interview prep
  "is_escalation": true,
  "escalated_from_application_id": "app-uuid-999",
  "assignment_type": "interview_prep",
  "agreed_fee": 4.5,  // 15% * 0.3 (interview prep multiplier)
  "status": "requested"
}
```

---

## Placement Tracking Flow

### Step 1: Interview Scheduled
Recruiter records interview:

```typescript
// POST /api/v1/recruiters/placements
{
  "assignment_id": "assignment-uuid-456",
  "company_name": "TechCorp Inc",
  "position_title": "Senior Software Engineer",
  "job_location": "San Francisco, CA",
  "job_type": "Full-time",
  "status": "interview_scheduled",
  "interview_stage": "phone",
  "interview_date": "2025-12-20T14:00:00Z",
  "interview_notes": "Phone screen with hiring manager"
}

// Response: Placement outcome created
{
  "id": "placement-uuid-111",
  "status": "interview_scheduled",
  "interview_count": 1
}
```

### Step 2: Offer Received
Candidate receives offer:

```typescript
// PUT /api/v1/recruiters/placements/placement-uuid-111/status
{
  "status": "offer_received",
  "offered_salary": 200000,
  "salary_currency": "USD",
  "offer_benefits": "Stock options, 401k match, unlimited PTO, full remote",
  "offer_deadline": "2025-12-28T23:59:59Z",
  "fee_percentage": 15
}

// System automatically calculates fees:
// Placement Fee: $200,000 * 15% = $30,000
// Platform Commission (20%): $6,000
// Recruiter Payout: $24,000
```

### Step 3: Offer Accepted
Candidate accepts offer:

```typescript
// PUT /api/v1/recruiters/placements/placement-uuid-111/status
{
  "status": "offer_accepted",
  "start_date": "2026-01-15"
}

// System:
// - Creates revenue record
// - Updates recruiter performance metrics
// - Sets 90-day guarantee period
// - Marks assignment as completed
```

### Step 4: Candidate Starts
After 90 days, guarantee period ends and payout is released:

```typescript
// Automated system check after 90 days
// If candidate still employed:
// - Revenue status: PENDING → COMPLETED
// - Trigger payout to recruiter
// - Update recruiter success metrics
```

---

## Review Submission Flow

After successful placement:

```typescript
// POST /api/v1/recruiters/reviews
{
  "assignment_id": "assignment-uuid-456",
  "rating": 5,
  "communication_rating": 5,
  "professionalism_rating": 5,
  "expertise_rating": 5,
  "responsiveness_rating": 4,
  "review_title": "Outstanding service - landed dream job!",
  "review_text": "Working with this recruiter was incredible. They understood exactly what I was looking for and connected me with companies I never would have found on my own. The interview prep was invaluable. Highly recommend!",
  "pros": [
    "Excellent communication",
    "Great company connections",
    "Helpful interview coaching",
    "Responsive to questions"
  ],
  "cons": [
    "Wish they were available on weekends"
  ],
  "would_recommend": true
}

// Response: Review created
{
  "id": "review-uuid-222",
  "status": "published",
  "is_verified_placement": true
}

// System automatically:
// - Updates recruiter average_rating
// - Recalculates quality_score
// - May upgrade tier if thresholds met
```

---

## Revenue Calculation Examples

### Example 1: Full Service - Tech Role

**Scenario:**
- Assignment Type: Full Service
- Base Fee: 15%
- Recruiter Tier: PREMIUM (20% platform fee)
- Candidate Salary: $200,000

**Calculation:**
```
Gross Placement Fee = $200,000 × 15% × 1.0 (full service multiplier)
                    = $30,000

Platform Commission = $30,000 × 20%
                    = $6,000

Recruiter Payout = $30,000 - $6,000
                 = $24,000
```

### Example 2: Interview Prep Only

**Scenario:**
- Assignment Type: Interview Prep
- Base Fee: 15%
- Recruiter Tier: STANDARD (25% platform fee)
- Candidate Salary: $150,000

**Calculation:**
```
Gross Placement Fee = $150,000 × 15% × 0.3 (interview prep multiplier)
                    = $6,750

Platform Commission = $6,750 × 25%
                    = $1,687.50

Recruiter Payout = $6,750 - $1,687.50
                 = $5,062.50
```

### Example 3: Elite Tier - Executive Placement

**Scenario:**
- Assignment Type: Full Service
- Base Fee: 20% (higher for executive roles)
- Recruiter Tier: ELITE (15% platform fee)
- Candidate Salary: $500,000

**Calculation:**
```
Gross Placement Fee = $500,000 × 20% × 1.0
                    = $100,000

Platform Commission = $100,000 × 15%
                    = $15,000

Recruiter Payout = $100,000 - $15,000
                 = $85,000
```

---

## Quality Score Evolution Example

### Initial Score (New Recruiter)
```
Base Score: 50
Experience (5 years): +5
Total: 55 (STANDARD tier)
```

### After 10 Placements (8 successful)
```
Base Score: 50
Success Rate (80%): +24 (0.8 × 30)
Average Rating (4.5): +22.5 ((4.5/5) × 25)
Experience: +5
Placements (10): +5 (10 × 0.5)
Avg Time to Hire (35 days): +0
Total: 56.5 → rounds to 57 (STANDARD tier)
```

### After 50 Placements (45 successful)
```
Base Score: 50
Success Rate (90%): +27
Average Rating (4.7): +23.5
Experience (7 years now): +7
Placements (50): +15 (maxed at 15)
Avg Time to Hire (28 days): +1
Total: 73.5 → rounds to 74 (PREMIUM tier - upgraded!)
```

### Elite Recruiter (150+ placements)
```
Base Score: 50
Success Rate (95%): +28.5
Average Rating (4.9): +24.5
Experience (15 years): +15 (maxed)
Placements (150): +15 (maxed)
Avg Time to Hire (20 days): +5
Total: 88 (ELITE tier)
```

---

## Integration with Subscription Tiers

### Free Tier
```typescript
// User tries to assign recruiter
// Response: 403 Forbidden
{
  "error": "Subscription upgrade required",
  "message": "Recruiter marketplace requires BASIC tier or higher",
  "upgrade_url": "/subscription/upgrade"
}
```

### Basic Tier
```typescript
// Check current usage
{
  "subscription_tier": "basic",
  "recruiter_access": {
    "enabled": true,
    "max_assignments_per_month": 1,
    "current_month_assignments": 0,
    "available_tiers": ["standard"],
    "can_create_assignment": true
  }
}
```

### Pro Tier
```typescript
{
  "subscription_tier": "pro",
  "recruiter_access": {
    "enabled": true,
    "max_concurrent_assignments": 3,
    "current_assignments": 1,
    "available_tiers": ["standard", "premium"],
    "can_create_assignment": true,
    "premium_features": [
      "Priority matching",
      "Premium tier access",
      "Interview prep included"
    ]
  }
}
```

### Enterprise Tier
```typescript
{
  "subscription_tier": "enterprise",
  "recruiter_access": {
    "enabled": true,
    "max_concurrent_assignments": "unlimited",
    "current_assignments": 5,
    "available_tiers": ["standard", "premium", "elite"],
    "can_create_assignment": true,
    "premium_features": [
      "Priority matching",
      "All tier access",
      "Dedicated account manager",
      "Custom contracts",
      "Salary negotiation support"
    ]
  }
}
```

---

## Error Handling Examples

### Recruiter Not Available
```typescript
// POST /api/v1/recruiters/assign
// Response: 400 Bad Request
{
  "error": "Recruiter not available",
  "message": "Recruiter has reached maximum capacity (10/10 assignments)",
  "suggested_recruiters": [
    {
      "id": "recruiter-uuid-777",
      "company_name": "Alternative Recruiters",
      "quality_score": 82,
      "available_capacity": 5
    }
  ]
}
```

### Insufficient Subscription Tier
```typescript
// Trying to assign ELITE tier recruiter on BASIC plan
// Response: 403 Forbidden
{
  "error": "Insufficient subscription tier",
  "message": "ELITE tier recruiters require ENTERPRISE subscription",
  "current_tier": "basic",
  "required_tier": "enterprise",
  "upgrade_url": "/subscription/upgrade"
}
```

### Already Reviewed
```typescript
// POST /api/v1/recruiters/reviews
// Response: 409 Conflict
{
  "error": "Review already exists",
  "message": "You have already reviewed this assignment",
  "existing_review_id": "review-uuid-222"
}
```

---

This comprehensive example guide covers all major workflows in the recruiter marketplace system.
