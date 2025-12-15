# Recruiter Marketplace Implementation Summary

## Overview
A comprehensive human recruiter marketplace layer has been built for the ApplyForUs platform, enabling users to escalate to professional recruiters when automation alone is insufficient.

## Implementation Location
**Service**: `services/user-service`
**Module Path**: `services/user-service/src/modules/recruiter/`

## Architecture

### Database Entities (5 Total)

#### 1. RecruiterProfile
Primary recruiter profile entity with comprehensive tracking:
- **Core Info**: Company name, website, bio, experience, certifications
- **Specializations**: Industries (16 types), Roles (15 types), Regions, Languages
- **Performance Metrics**:
  - Total/successful placements
  - Success rate (auto-calculated)
  - Average time to placement
  - Quality score (0-100, algorithm-based)
  - Average rating and review count
- **Availability**: Max concurrent assignments, available hours, timezone
- **Monetization**: Fee percentage, revenue tracking, Stripe integration
- **Verification**: Verification status, documents, admin approval
- **Tier System**: STANDARD, PREMIUM, ELITE (auto-upgraded based on performance)

**Key Methods**:
- `calculateQualityScore()`: 5-factor scoring algorithm
- `updateSuccessRate()`: Auto-calculates success percentage
- `canAcceptAssignment()`: Validates availability

#### 2. RecruiterAssignment
Tracks user-recruiter engagements:
- **Assignment Types**:
  - FULL_SERVICE (end-to-end recruitment)
  - RESUME_REVIEW (resume optimization)
  - INTERVIEW_PREP (coaching)
  - APPLICATION_SUPPORT (specific help)
  - CAREER_CONSULTING (strategy)
- **Priority Levels**: LOW, NORMAL, HIGH, URGENT
- **Status Flow**: REQUESTED → ACCEPTED → IN_PROGRESS → COMPLETED/CANCELLED
- **Progress Tracking**: Applications submitted, interviews scheduled, offers received
- **Target Criteria**: Industries, roles, locations, salary range
- **Monetization**: Agreed fee, platform commission percentage
- **Escalation Support**: Links to escalated applications with reason tracking

**Key Methods**:
- `calculateDuration()`: Time from start to completion
- `isOverdue()`: Checks against deadline
- `updateProgress()`: Auto-calculates progress percentage

#### 3. PlacementOutcome
Records placement details and outcomes:
- **Interview Tracking**:
  - Stages (SCREENING, PHONE, TECHNICAL, ONSITE, FINAL, CULTURAL_FIT)
  - Dates, notes, calendar links
  - Interview count
- **Offer Details**: Salary, benefits, start date, deadlines
- **Revenue Calculation**:
  - Placement fee (percentage-based)
  - Recruiter payout
  - Platform commission
- **Guarantee Period**: 90-day default with claim tracking
- **Success Metrics**: Days to hire, total interview rounds

**Key Methods**:
- `isSuccessfulPlacement()`: Checks if HIRED/OFFER_ACCEPTED
- `calculatePlacementFee()`: Fee based on salary and percentage
- `calculateRevenueSplit()`: Splits fee between recruiter and platform
- `setGuaranteeEndDate()`: Calculates guarantee expiry
- `isWithinGuaranteePeriod()`: Validates guarantee window

#### 4. RecruiterReview
User feedback and ratings system:
- **Rating System**:
  - Overall rating (1-5)
  - Category ratings: Communication, Professionalism, Expertise, Responsiveness
- **Content**: Title, text, pros/cons lists
- **Social Proof**: Recommendation flag, helpfulness votes
- **Verification**: Verified placement badge
- **Moderation**: Flag system, admin review, status management
- **Recruiter Response**: Ability to respond to reviews

**Key Methods**:
- `getOverallRating()`: Averages all category ratings
- `getHelpfulnessRatio()`: Calculates helpful vote percentage
- `shouldBeFlagged()`: Auto-flag when threshold reached (3+ flags)

#### 5. RecruiterRevenue
Financial transaction tracking:
- **Revenue Types**: Placement fee, subscription, premium listing, bonus, refund, adjustment
- **Status Flow**: PENDING → PROCESSING → COMPLETED/FAILED/REFUNDED
- **Amount Breakdown**: Gross, platform commission, net, tax withheld
- **Payment Details**: Method, transaction IDs, Stripe transfer IDs
- **Tax Compliance**: Tax forms (1099, W9), withholding
- **Dispute Management**: Reason, resolution, timestamps
- **Invoice Generation**: Number, URL tracking

**Key Methods**:
- `calculateNetAmount()`: Gross - commission - tax
- `isPending()`, `isCompleted()`: Status checks
- `canBeRefunded()`: Validates 90-day refund window

### DTOs (6 Total)

1. **RegisterRecruiterDto**: Complete onboarding with validation
2. **AssignRecruiterDto**: Assignment creation with job criteria
3. **EscalateApplicationDto**: Application escalation with auto-matching
4. **SearchRecruitersDto**: Advanced search with filters and pagination
5. **CreateReviewDto**: Review submission with category ratings
6. **UpdateAssignmentDto**: Progress tracking by recruiters

### Service Layer

**RecruiterService** - Comprehensive business logic:

#### Core Methods

**Registration & Onboarding**
- `registerRecruiter()`: Creates profile with PENDING status
- Validates no duplicate profiles per user
- Initializes with base quality score of 50

**Search & Discovery**
- `searchRecruiters()`: Advanced filtering by:
  - Industries and roles (array overlap matching)
  - Regions
  - Tier level
  - Minimum quality score
  - Minimum rating
  - Availability status
  - Verification status
- Pagination and custom sorting
- Returns metadata for UI pagination

**Assignment Management**
- `assignRecruiter()`: Creates user-recruiter pairing
  - Validates recruiter availability
  - Checks for duplicate active assignments
  - Calculates fees based on assignment type
  - Auto-updates recruiter stats
- `escalateApplication()`: Smart escalation
  - Auto-finds best recruiter if not specified
  - Links to original application
  - Prioritizes based on urgency
- `updateAssignment()`: Recruiter progress updates
  - Status transitions with timestamps
  - Auto-calculates progress percentage
  - Activity tracking

**Placement Tracking**
- `trackPlacement()`: Records new placement
- `updatePlacementStatus()`: Status management
  - Auto-calculates fees on OFFER_ACCEPTED
  - Creates revenue records
  - Sets guarantee periods
  - Updates performance metrics

**Reviews & Ratings**
- `createReview()`: User feedback submission
  - Validates assignment completion
  - Prevents duplicate reviews
  - Auto-publishes verified placements
  - Triggers rating recalculation

**Performance & Quality**
- `updateRecruiterPerformance()`: Called on placement completion
  - Increments placement counters
  - Recalculates success rate
  - Updates average time to placement
  - Recalculates quality score
  - Auto-upgrades tier if thresholds met
- `updateRecruiterRatings()`: Aggregates review ratings
  - Calculates average rating
  - Updates total review count
  - Triggers quality score update
- `calculateRecruiterTier()`: Tier assignment logic
  - ELITE: 80+ score, 50+ placements
  - PREMIUM: 65+ score, 20+ placements
  - STANDARD: Default

**Revenue Management**
- `createRevenueRecord()`: Financial transaction creation
  - Links placement to revenue
  - Calculates all splits
  - Updates recruiter revenue totals
  - Sets to PENDING status
- `getRecruiterPerformance()`: Comprehensive stats dashboard
  - Performance metrics
  - Rating breakdowns
  - Revenue summary
  - Active assignments

**Helper Methods**
- `calculateAssignmentFee()`: Type-based fee multipliers
  - FULL_SERVICE: 1.0x
  - APPLICATION_SUPPORT: 0.5x
  - INTERVIEW_PREP: 0.3x
  - CAREER_CONSULTING: 0.4x
  - RESUME_REVIEW: 0.2x
- `getPlatformFeePercentage()`: Tier-based platform cut
  - STANDARD: 25%
  - PREMIUM: 20%
  - ELITE: 15%
- `findBestRecruiterForEscalation()`: Smart matching
  - Filters by active/verified status
  - Sorts by quality score
  - Validates capacity

### Controller Layer

**RecruiterController** - RESTful API endpoints:

#### Endpoints (16 Total)

1. **POST /api/v1/recruiters/register** - Recruiter registration
2. **GET /api/v1/recruiters** - Search recruiters
3. **GET /api/v1/recruiters/:id** - Get recruiter profile
4. **POST /api/v1/recruiters/assign** - Assign recruiter
5. **POST /api/v1/recruiters/escalate** - Escalate application
6. **GET /api/v1/recruiters/assignments/my** - Get user's assignments
7. **GET /api/v1/recruiters/assignments/:id** - Get assignment details
8. **PUT /api/v1/recruiters/assignments/:id** - Update assignment
9. **GET /api/v1/recruiters/:id/performance** - Performance stats
10. **GET /api/v1/recruiters/:id/reviews** - Recruiter reviews
11. **POST /api/v1/recruiters/reviews** - Create review
12. **POST /api/v1/recruiters/placements** - Track placement
13. **PUT /api/v1/recruiters/placements/:id/status** - Update placement
14. **GET /api/v1/recruiters/revenue/my** - Recruiter revenue
15. **GET /api/v1/recruiters/revenue/transactions** - Transaction history
16. **GET /api/v1/recruiters/subscription/check** - Tier access check

All endpoints include:
- Swagger/OpenAPI documentation
- JWT authentication where needed
- Comprehensive error responses
- Request validation

## Quality Scoring Algorithm

### 5-Factor Scoring System (0-100 Scale)

**Base Score**: 50 points (starting point for all recruiters)

**Factor 1: Success Rate** (up to 30 points)
- Formula: `(successful_placements / total_placements) × 30`
- Example: 80% success rate = 24 points

**Factor 2: Average Rating** (up to 25 points)
- Formula: `(average_rating / 5) × 25`
- Example: 4.5 rating = 22.5 points

**Factor 3: Years of Experience** (up to 15 points)
- Formula: `min(years_of_experience, 15)`
- Capped at 15 years

**Factor 4: Placement Volume** (up to 15 points)
- Formula: `min(total_placements × 0.5, 15)`
- Example: 30 placements = 15 points (maxed)

**Factor 5: Time Efficiency** (up to 15 points)
- Formula: `min((30 - average_days_to_placement) / 2, 15)`
- Rewards faster placements
- Example: 20 days average = 5 points

### Tier Thresholds
- **ELITE**: Quality Score ≥ 80 AND Total Placements ≥ 50
- **PREMIUM**: Quality Score ≥ 65 AND Total Placements ≥ 20
- **STANDARD**: Default tier

### Auto-Upgrade Triggers
- Quality score recalculated after each:
  - Placement completion
  - Review submission
  - Performance update
- Tier automatically upgraded if thresholds met
- Platform commission rate adjusts with tier

## Monetization Model

### Revenue Sharing Structure

**Placement Fee Calculation**:
```
Base Fee = Candidate Salary × Fee Percentage
Assignment Multiplier (based on type):
  - FULL_SERVICE: 1.0×
  - APPLICATION_SUPPORT: 0.5×
  - INTERVIEW_PREP: 0.3×
  - CAREER_CONSULTING: 0.4×
  - RESUME_REVIEW: 0.2×

Gross Fee = Base Fee × Multiplier
```

**Platform Commission** (tier-based):
- STANDARD: 25% of gross fee
- PREMIUM: 20% of gross fee
- ELITE: 15% of gross fee

**Recruiter Payout**:
```
Net Payout = Gross Fee - Platform Commission - Tax Withheld
```

### Revenue Protection

**90-Day Guarantee**:
- If candidate leaves within 90 days, fee may be refunded
- Guarantee period tracked per placement
- `isWithinGuaranteePeriod()` method for validation

**Payment Flow**:
1. Offer accepted → Revenue record created (PENDING)
2. Candidate starts → Begin 90-day guarantee period
3. 90 days pass → Revenue transitions to PROCESSING
4. Payout executed → Revenue marked COMPLETED

## Subscription Tier Integration

### Access Matrix

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Marketplace Access | ✗ | ✓ | ✓ | ✓ |
| Assignments/Month | 0 | 1 | Unlimited | Unlimited |
| Concurrent Assignments | 0 | 1 | 3 | Unlimited |
| Recruiter Tiers | - | STANDARD | STANDARD, PREMIUM | ALL |
| Priority Matching | ✗ | ✗ | ✓ | ✓ |
| Resume Review Included | ✗ | ✗ | ✓ | ✓ |
| Interview Prep | ✗ | Add-on | ✓ | ✓ |
| Dedicated Manager | ✗ | ✗ | ✗ | ✓ |

### Premium Features
- Priority recruiter matching
- Access to higher-tier recruiters
- Included interview preparation
- Salary negotiation support
- Custom contracts and agreements
- Dedicated account management (Enterprise)

## File Structure

```
services/user-service/src/modules/recruiter/
├── entities/
│   ├── recruiter-profile.entity.ts        (Main profile)
│   ├── recruiter-assignment.entity.ts     (Engagements)
│   ├── placement-outcome.entity.ts        (Placements)
│   ├── recruiter-review.entity.ts         (Reviews)
│   └── recruiter-revenue.entity.ts        (Finances)
├── dto/
│   ├── register-recruiter.dto.ts
│   ├── assign-recruiter.dto.ts
│   ├── escalate-application.dto.ts
│   ├── search-recruiters.dto.ts
│   ├── create-review.dto.ts
│   └── update-assignment.dto.ts
├── recruiter.service.ts                   (Business logic)
├── recruiter.controller.ts                (API endpoints)
├── recruiter.module.ts                    (Module definition)
├── index.ts                               (Exports)
├── README.md                              (Documentation)
└── EXAMPLES.md                            (Usage examples)
```

## Integration Points

### 1. User Service
- Links to user_id from auth-service
- Profile enrichment with recruiter data
- Subscription tier checking

### 2. Auto-Apply Service
- Application escalation flow
- Links to application.entity.ts
- Status synchronization

### 3. Payment Service
- Stripe integration for payouts
- Invoice generation
- Tax form management
- Dispute handling

### 4. Notification Service
- Assignment status updates
- Interview reminders
- Offer notifications
- Review requests
- Payout confirmations

### 5. Analytics Service
- Recruiter performance dashboards
- Revenue reporting
- Success rate tracking
- Platform commission analytics

## Database Schema Highlights

### Indexes Created
- `recruiter_profiles`: user_id (unique), status+tier, quality_score
- `recruiter_assignments`: user_id+status, recruiter_id+status, status+created_at
- `placement_outcomes`: assignment_id+status, user_id+status, status+created_at
- `recruiter_reviews`: recruiter_id+status, user_id, rating+created_at
- `recruiter_revenue`: recruiter_id+status, placement_id, created_at

### Key Relationships
- RecruiterProfile → RecruiterAssignment (One-to-Many)
- RecruiterProfile → RecruiterReview (One-to-Many)
- RecruiterAssignment → PlacementOutcome (One-to-Many)

### Data Types
- UUIDs for all IDs
- ENUMs for status fields
- JSONB for flexible metadata
- Decimal(10,2) for currency
- Simple arrays for tags

## Security Features

1. **JWT Authentication**: All protected endpoints require valid tokens
2. **Role Validation**: Recruiter-specific actions validated
3. **Rate Limiting**: ThrottlerGuard applied globally
4. **Input Validation**: class-validator on all DTOs
5. **SQL Injection Protection**: TypeORM parameterized queries
6. **Access Control**: Users can only access their own assignments

## Testing Recommendations

### Unit Tests
- Service methods (quality scoring, fee calculation, tier assignment)
- Entity helper methods
- DTO validation

### Integration Tests
- Full assignment flow
- Escalation workflow
- Revenue calculation
- Review submission

### E2E Tests
- Recruiter registration → verification → assignment → placement → payout
- User search → assign → review flow
- Escalation from failed application

## Deployment Checklist

- [ ] Run database migrations
- [ ] Configure Stripe Connect for recruiter payouts
- [ ] Set up admin verification workflow
- [ ] Configure notification templates
- [ ] Set subscription tier permissions
- [ ] Enable monitoring and analytics
- [ ] Create recruiter onboarding documentation
- [ ] Set up tax compliance workflow
- [ ] Configure dispute resolution process
- [ ] Launch recruiter portal frontend

## Next Steps

1. **Admin Dashboard**: Build verification and management interface
2. **Recruiter Portal**: Dedicated UI for recruiter workflows
3. **AI Matching**: ML-based recruiter-user matching
4. **Video Integration**: Built-in video consultation
5. **Payment Automation**: Stripe Connect for instant payouts
6. **Mobile Apps**: Native apps for recruiters
7. **Analytics Dashboard**: Performance insights
8. **Certification Program**: ApplyForUs certified recruiters
9. **White-label**: Enterprise custom branding
10. **API for Recruiters**: Third-party integrations

## Performance Considerations

- Indexed queries for fast searches
- Pagination on all list endpoints
- Caching for frequently accessed recruiter profiles
- Async processing for quality score calculations
- Batch updates for performance metrics
- Connection pooling configured (max: 20, min: 5)

## Success Metrics

Track these KPIs:
- Recruiter registration rate
- Assignment creation rate
- Placement success rate
- Average time to placement
- User satisfaction (review ratings)
- Revenue per recruiter
- Platform commission earned
- Tier distribution
- Escalation conversion rate

---

**Implementation Status**: ✅ COMPLETE
**Production Ready**: ⚠️ Pending migration and testing
**Documentation**: ✅ Comprehensive
**API Coverage**: 100% (16/16 endpoints)

Built with NestJS, TypeORM, PostgreSQL
