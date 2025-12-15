# Regional Job Playbooks Module

## Overview

The Regional Job Playbooks module provides automated, region-specific application strategies that adapt based on geographic location. Each playbook contains detailed configurations for resume formatting, cover letter styles, salary norms, ATS systems, hiring timelines, visa requirements, and cultural preferences specific to different regions.

## Features

- **6 Regional Playbooks**: United States, Canada, United Kingdom, European Union, Australia, and Global Remote
- **Automatic Playbook Recommendation**: Based on job location and characteristics
- **Application Tracking**: Monitor application progress and success rates
- **ATS Optimization**: Region-specific guidance for common ATS systems
- **Cultural Adaptation**: Tailored advice for different hiring cultures
- **Statistics and Analytics**: Track success rates by region and playbook

## Regions Supported

### 1. United States
- **Resume Format**: Chronological, 2 pages max
- **Cover Letter**: Formal, 250-400 words
- **Currency**: USD
- **Common ATS**: Workday, Greenhouse, Lever, Taleo
- **Visa**: Work permit required (H-1B, L-1, TN, Green Card)
- **Cultural Notes**: Direct communication, achievement-focused

### 2. Canada
- **Resume Format**: Chronological, 2 pages max
- **Cover Letter**: Formal, 250-400 words
- **Currency**: CAD
- **Common ATS**: Workday, Greenhouse, Taleo, BambooHR
- **Visa**: Work permit required (Express Entry, LMIA, PGWP)
- **Cultural Notes**: Bilingual skills valued (English/French), polite communication

### 3. United Kingdom
- **Resume Format**: Chronological CV, 2 pages max
- **Cover Letter**: Very formal, 250-400 words
- **Currency**: GBP
- **Common ATS**: Workday, Taleo, Bullhorn
- **Visa**: Work permit required (Skilled Worker, Graduate Visa)
- **Cultural Notes**: Formal communication, references required

### 4. European Union
- **Resume Format**: Europass compatible, 2-3 pages
- **Cover Letter**: Formal, 200-400 words
- **Currency**: EUR
- **Common ATS**: SAP SuccessFactors, Workday, Personio
- **Visa**: EU Blue Card or national permits
- **Cultural Notes**: GDPR compliance mandatory, multilingual skills valued

### 5. Australia
- **Resume Format**: Chronological, 3 pages max
- **Cover Letter**: Semi-formal, 250-400 words
- **Currency**: AUD
- **Common ATS**: SEEK, Workday, PageUp
- **Visa**: Work permit required (subclass 482, 186, 189)
- **Cultural Notes**: Direct communication, references required

### 6. Global Remote
- **Resume Format**: Combination, 2 pages max
- **Cover Letter**: Semi-formal, 200-350 words
- **Currency**: USD (typically)
- **Common ATS**: Greenhouse, Lever, Ashby
- **Visa**: Varies by company (contractor or EOR arrangements)
- **Cultural Notes**: Emphasize remote work experience, timezone flexibility

## API Endpoints

### Get All Playbooks
```http
GET /api/v1/playbooks
```

**Response:**
```json
[
  {
    "id": "uuid",
    "region": "united_states",
    "name": "United States Professional",
    "country": "United States",
    "description": "Standard playbook for job applications in the United States...",
    "preferred_resume_format": "chronological",
    "resume_max_pages": 2,
    "cover_letter_required": true,
    "salary_norms": {
      "currency": "USD",
      "typical_range_min": 50000,
      "typical_range_max": 150000,
      "negotiation_culture": "moderate"
    },
    "common_ats_systems": ["Workday", "Greenhouse", "Lever"],
    "usage_count": 1523,
    "success_rate": 67.5
  }
]
```

### Get Playbook by Region
```http
GET /api/v1/playbooks/region/:region
```

**Parameters:**
- `region`: One of `united_states`, `canada`, `united_kingdom`, `european_union`, `australia`, `global_remote`

### Recommend Playbook for Job
```http
POST /api/v1/playbooks/recommend
```

**Request Body:**
```json
{
  "job_id": "uuid",
  "user_id": "uuid" // optional
}
```

**Response:**
```json
{
  "recommended_playbook": { /* full playbook object */ },
  "match_score": 85,
  "match_reasons": [
    "ATS system Workday is commonly used in United States Professional",
    "Location matches United States Professional standards"
  ],
  "alternative_playbooks": [
    { /* playbook summary */ }
  ]
}
```

### Apply Playbook to Job Application
```http
POST /api/v1/playbooks/apply
```

**Request Body:**
```json
{
  "job_id": "uuid",
  "playbook_id": "uuid",
  "user_id": "uuid",
  "resume_id": "uuid",
  "cover_letter_id": "uuid",
  "auto_format_resume": true,
  "auto_generate_cover_letter": true,
  "optimize_for_ats": true,
  "salary_min": 80000,
  "salary_max": 120000,
  "user_notes": "Interested in this role"
}
```

**Response:**
```json
{
  "application_id": "uuid",
  "playbook_id": "uuid",
  "job_id": "uuid",
  "status": "pending",
  "resume_formatted": true,
  "cover_letter_generated": true,
  "ats_optimized": true,
  "ats_compatibility_score": 85,
  "playbook_match_score": 90,
  "recommendations": [
    "Follow United States Professional resume format standards (chronological)",
    "Keep resume to 2 page(s) maximum",
    "Include cover letter (250-400 words)",
    "Optimize for Workday ATS system"
  ],
  "warnings": [
    "Work authorization required: work_permit_required"
  ],
  "next_steps": [
    "Resume will be auto-formatted according to playbook standards",
    "Cover letter will be auto-generated",
    "Application will be optimized for ATS compatibility",
    "Review application before submitting",
    "Submit application through provided URL or platform",
    "Follow up after 7 days if no response"
  ],
  "estimated_application_time": 300,
  "created_at": "2025-12-15T10:30:00Z"
}
```

### Get User Applications
```http
GET /api/v1/playbooks/applications/user/:userId
```

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "job_id": "uuid",
    "playbook_id": "uuid",
    "status": "applied",
    "resume_auto_formatted": true,
    "ats_optimized": true,
    "applied_at": "2025-12-15T10:30:00Z",
    "playbook": { /* full playbook object */ }
  }
]
```

### Update Application Status
```http
PUT /api/v1/playbooks/applications/:id/status
```

**Request Body:**
```json
{
  "status": "interview",
  "user_rating": 5,
  "user_feedback": "Great playbook, got interview!"
}
```

### Get User Statistics
```http
GET /api/v1/playbooks/stats/user/:userId
```

**Response:**
```json
{
  "total_applications": 15,
  "applications_by_status": {
    "pending": 2,
    "applied": 8,
    "interview": 3,
    "accepted": 1,
    "rejected": 1
  },
  "applications_by_region": {
    "united_states": 10,
    "canada": 3,
    "global_remote": 2
  },
  "average_response_time_hours": 96,
  "interview_rate": 26.67,
  "offer_rate": 6.67,
  "success_rate_by_playbook": [
    {
      "playbook_id": "uuid",
      "playbook_name": "United States Professional",
      "region": "united_states",
      "total_applications": 10,
      "interview_rate": 30,
      "offer_rate": 10,
      "average_rating": 4.2
    }
  ],
  "most_successful_playbook": {
    "playbook_id": "uuid",
    "playbook_name": "United States Professional",
    "region": "united_states",
    "success_rate": 20
  }
}
```

## Database Entities

### Playbook Entity

Stores regional playbook configurations.

**Key Fields:**
- `region`: Enum (united_states, canada, united_kingdom, european_union, australia, global_remote)
- `preferred_resume_format`: Chronological, functional, combination, targeted
- `resume_max_pages`: Page limit (1-3)
- `cover_letter_style`: Formal, casual, semi-formal, creative
- `salary_norms`: Currency, ranges, negotiation culture
- `common_ats_systems`: Array of ATS platforms
- `hiring_timeline`: Response days, interview rounds, total process days
- `visa_requirements`: Work authorization requirements
- `cultural_preferences`: Formality, communication style, etc.

### PlaybookApplication Entity

Tracks individual job applications using playbooks.

**Key Fields:**
- `user_id`: User applying
- `job_id`: Job being applied to
- `playbook_id`: Playbook being used
- `status`: pending, in_progress, applied, under_review, interview, rejected, accepted
- `resume_auto_formatted`: Whether resume was auto-formatted
- `ats_optimized`: Whether application was ATS-optimized
- `application_metrics`: Scores and metrics
- `got_interview`: Boolean flag
- `got_offer`: Boolean flag
- `response_time_hours`: Time to get employer response

## Integration with Resume Service

The playbooks module is designed to integrate with the resume-service for automatic formatting:

```typescript
// Example integration flow
const playbook = await playbooksService.findByRegion(Region.UNITED_STATES);

// Send to resume-service for formatting
const formattedResume = await resumeService.formatResume(resumeId, {
  format: playbook.preferred_resume_format,
  maxPages: playbook.resume_max_pages,
  sectionOrder: playbook.resume_section_order,
  includePhoto: playbook.include_photo,
  fontSize: playbook.recommended_font_size,
  fonts: playbook.preferred_fonts,
});
```

## Usage Examples

### Basic Usage

```typescript
// Get recommended playbook for a job
const recommendation = await playbooksService.recommendPlaybook('job-id');
console.log(`Recommended: ${recommendation.recommended_playbook.name}`);
console.log(`Match Score: ${recommendation.match_score}%`);

// Apply playbook to application
const application = await playbooksService.applyPlaybook({
  job_id: 'job-id',
  playbook_id: recommendation.recommended_playbook.id,
  user_id: 'user-id',
  auto_format_resume: true,
  auto_generate_cover_letter: true,
  optimize_for_ats: true,
});

console.log(`Application created: ${application.application_id}`);
console.log(`Next steps: ${application.next_steps.join(', ')}`);
```

### Track Application Progress

```typescript
// Update application status
await playbooksService.updateApplicationStatus(applicationId, {
  status: ApplicationStatus.INTERVIEW,
  user_notes: 'Interview scheduled for next week',
});

// Get user statistics
const stats = await playbooksService.getUserApplicationStats('user-id');
console.log(`Interview rate: ${stats.interview_rate}%`);
console.log(`Best playbook: ${stats.most_successful_playbook.playbook_name}`);
```

## Best Practices

1. **Always Get Recommendations**: Use the recommendation endpoint to get the best playbook for a job
2. **Enable ATS Optimization**: Most jobs use ATS systems, so optimize when possible
3. **Track Application Status**: Update status as you progress through hiring stages
4. **Provide Feedback**: Rate playbooks and provide feedback to improve recommendations
5. **Review Before Applying**: Always review auto-formatted resumes and generated cover letters
6. **Follow Regional Guidelines**: Respect cultural and legal requirements for each region

## Testing

Run the unit tests:

```bash
npm test -- playbooks.service.spec.ts
```

## Future Enhancements

- [ ] Machine learning-based playbook recommendations
- [ ] A/B testing of different playbook strategies
- [ ] Integration with resume-service for automatic formatting
- [ ] Cover letter generation using AI
- [ ] Real-time ATS compatibility scoring
- [ ] More regional variations (Asia-Pacific, Middle East, Latin America)
- [ ] Company-specific playbook customizations
- [ ] Automated follow-up reminders based on hiring timelines

## Support

For questions or issues with the playbooks module, please contact the ApplyForUs development team.
