# Recruiter Marketplace Module

## Overview

The Recruiter Marketplace is a comprehensive human-in-the-loop escalation layer for the ApplyForUs platform. When automation alone is insufficient, users can escalate to professional recruiters for personalized assistance with their job search.

## Features

### 1. Recruiter Management
- **Recruiter Onboarding**: Complete registration with verification workflow
- **Specialization Tracking**: Industry and role specializations, geographic regions
- **Tier System**: STANDARD, PREMIUM, and ELITE tiers based on performance
- **Availability Management**: Capacity limits and scheduling

### 2. Quality Scoring Algorithm
Recruiters are scored on a 0-100 scale based on:
- **Success Rate** (30 points): Percentage of successful placements
- **Average Rating** (25 points): User review ratings (1-5 stars)
- **Experience** (15 points): Years of recruiting experience
- **Volume** (15 points): Total number of placements
- **Time Efficiency** (15 points): Average time to placement

### 3. Assignment Types
- **FULL_SERVICE**: End-to-end recruitment assistance
- **RESUME_REVIEW**: Resume optimization only
- **INTERVIEW_PREP**: Interview coaching and preparation
- **APPLICATION_SUPPORT**: Help with specific applications
- **CAREER_CONSULTING**: Strategic career advice

### 4. Placement Tracking
- Interview coordination and scheduling
- Offer tracking and negotiation support
- Success metrics and outcome reporting
- 90-day guarantee period for placements

### 5. Revenue Model

#### Platform Fee Structure
- **STANDARD Tier**: 25% platform commission
- **PREMIUM Tier**: 20% platform commission
- **ELITE Tier**: 15% platform commission

#### Assignment Fees
Based on recruiter's base percentage multiplied by assignment type:
- FULL_SERVICE: 1.0x (e.g., 15% of salary)
- APPLICATION_SUPPORT: 0.5x
- INTERVIEW_PREP: 0.3x
- CAREER_CONSULTING: 0.4x
- RESUME_REVIEW: 0.2x

#### Example Calculation
```
Recruiter Base Fee: 15% of salary
Assignment Type: FULL_SERVICE (1.0x multiplier)
Candidate Salary: $100,000
Recruiter Tier: PREMIUM (20% platform fee)

Gross Placement Fee: $15,000
Platform Commission (20%): $3,000
Recruiter Payout: $12,000
```

## Database Schema

### RecruiterProfile
Core profile information for recruiters including:
- Company and certification details
- Specializations (industries, roles, regions)
- Performance metrics (success rate, ratings, placements)
- Availability and capacity settings
- Revenue tracking
- Verification status

### RecruiterAssignment
Tracks user-recruiter engagements:
- Assignment type and priority
- Target job criteria (industries, roles, salary range)
- Progress tracking (applications, interviews, offers)
- Timeline and deadlines
- Fee structure
- Escalation metadata

### PlacementOutcome
Records successful placements:
- Interview stages and dates
- Offer details (salary, benefits, start date)
- Revenue calculations
- Guarantee period tracking
- Success metrics

### RecruiterReview
User feedback and ratings:
- Overall rating (1-5)
- Category ratings (communication, professionalism, expertise, responsiveness)
- Detailed review text
- Verification status
- Helpfulness votes

### RecruiterRevenue
Financial transaction records:
- Revenue type and amount
- Platform commission
- Payment status
- Tax withholding
- Invoice tracking
- Dispute management

## API Endpoints

### Recruiter Registration
```
POST /api/v1/recruiters/register
Authorization: Bearer <token>

Request Body:
{
  "company_name": "TechRecruit Inc",
  "company_website": "https://techrecruit.com",
  "bio": "Specializing in tech placements...",
  "years_of_experience": 5,
  "linkedin_url": "https://linkedin.com/in/recruiter",
  "industries": ["technology", "finance"],
  "roles": ["software_engineering", "data_science"],
  "regions": ["US-CA", "US-NY"],
  "max_concurrent_assignments": 5,
  "placement_fee_percentage": 15
}
```

### Search Recruiters
```
GET /api/v1/recruiters?industries=technology&roles=software_engineering&min_quality_score=70&verified_only=true&page=1&limit=20

Response:
{
  "data": [
    {
      "id": "uuid",
      "company_name": "TechRecruit Inc",
      "quality_score": 85,
      "average_rating": 4.5,
      "total_placements": 50,
      "success_rate": 75,
      "tier": "premium",
      "industries": ["technology"],
      "roles": ["software_engineering"],
      ...
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Assign Recruiter
```
POST /api/v1/recruiters/assign
Authorization: Bearer <token>

Request Body:
{
  "recruiter_id": "uuid",
  "assignment_type": "full_service",
  "priority": "normal",
  "user_requirements": "Looking for senior engineering roles...",
  "target_industries": ["technology"],
  "target_roles": ["software_engineering"],
  "target_locations": ["San Francisco", "New York"],
  "target_salary_min": 150000,
  "target_salary_max": 200000,
  "salary_currency": "USD"
}
```

### Escalate Application
```
POST /api/v1/recruiters/escalate
Authorization: Bearer <token>

Request Body:
{
  "application_id": "uuid",
  "recruiter_id": "uuid",  // Optional - system will find best match
  "escalation_reason": "Application rejected, need interview prep",
  "assignment_type": "interview_prep",
  "priority": "high",
  "notes": "Struggling with technical interviews..."
}
```

### Get Recruiter Performance
```
GET /api/v1/recruiters/:id/performance

Response:
{
  "recruiter": {
    "id": "uuid",
    "company_name": "TechRecruit Inc",
    "quality_score": 85,
    "tier": "premium",
    "status": "active"
  },
  "performance": {
    "total_assignments": 100,
    "active_assignments": 5,
    "completed_assignments": 95,
    "total_placements": 75,
    "successful_placements": 70,
    "success_rate": 93.3,
    "average_time_to_placement": 45
  },
  "ratings": {
    "average_rating": 4.5,
    "total_reviews": 50,
    "reviews_breakdown": {
      "5": 30,
      "4": 15,
      "3": 4,
      "2": 1,
      "1": 0
    }
  },
  "revenue": {
    "total": 250000,
    "pending": 50000,
    "paid": 200000,
    "currency": "USD"
  }
}
```

### Create Review
```
POST /api/v1/recruiters/reviews
Authorization: Bearer <token>

Request Body:
{
  "assignment_id": "uuid",
  "rating": 5,
  "communication_rating": 5,
  "professionalism_rating": 5,
  "expertise_rating": 4,
  "responsiveness_rating": 5,
  "review_title": "Excellent experience!",
  "review_text": "Very professional and helpful...",
  "pros": ["Great communication", "Fast response time"],
  "cons": [],
  "would_recommend": true
}
```

## Subscription Tier Integration

### Access Requirements
- **FREE**: No recruiter marketplace access
- **BASIC**: 1 assignment per month, STANDARD tier recruiters only
- **PRO**: 3 concurrent assignments, access to PREMIUM tier
- **ENTERPRISE**: Unlimited assignments, priority access to ELITE tier

### Premium Features
- Priority matching with top recruiters
- Dedicated account management
- Resume optimization included
- Interview prep sessions
- Salary negotiation support

## Quality Assurance

### Recruiter Verification
1. Identity verification (government ID)
2. Professional certification validation
3. Background check
4. Reference verification
5. Sample work review

### Performance Monitoring
- Automated quality score updates
- Review sentiment analysis
- Success rate tracking
- Response time monitoring
- User satisfaction surveys

### Tier Progression
Recruiters are automatically promoted/demoted based on:
- Quality score thresholds
- Minimum placement volumes
- User rating averages
- Success rate consistency

## Implementation Notes

### Database Migrations
Run the following to create all tables:
```bash
cd services/user-service
npm run migration:generate -- RecruiterMarketplace
npm run migration:run
```

### Environment Variables
No additional environment variables required. Uses existing database configuration.

### Dependencies
All dependencies are already in user-service package.json:
- TypeORM
- class-validator
- class-transformer
- @nestjs/swagger

### Testing
```bash
# Unit tests
npm test -- recruiter

# Integration tests
npm run test:e2e
```

## Future Enhancements

1. **AI-Powered Matching**: ML algorithm to match users with ideal recruiters
2. **Video Interviews**: Built-in video consultation scheduling
3. **Contract Templates**: Automated service agreements
4. **Dispute Resolution**: Formal dispute and refund process
5. **Recruiter Analytics Dashboard**: Detailed performance insights
6. **White-label Options**: Enterprise clients can use their own recruiters
7. **Team Accounts**: Multi-recruiter agencies
8. **API for Recruiters**: Mobile app and integrations
9. **Automated Payouts**: Stripe Connect for instant payments
10. **Certification Programs**: ApplyForUs certified recruiter program

## Support

For questions or issues:
- Documentation: `/docs/recruiter-marketplace`
- Support Email: support@applyforus.com
- Recruiter Portal: https://recruiters.applyforus.com

---

**Built with**: NestJS, TypeORM, PostgreSQL
**Version**: 1.0.0
**Last Updated**: December 2025
