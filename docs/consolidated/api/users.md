# User Service API

The User Service handles user profiles, career information, skills, preferences, subscriptions, and analytics.

## Base Paths

```
/users      - User management
/profile    - User profile
/career     - Work experience and education
/skills     - User skills
/preferences - Job preferences
/subscription - Subscription management
/analytics  - User analytics
```

## User Management

### Get Current User

Get current authenticated user profile.

**Endpoint:** `GET /users/me`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "profilePicture": "https://cdn.jobpilot.com/profiles/...",
  "role": "user",
  "status": "active",
  "createdAt": "2025-01-15T08:00:00Z",
  "updatedAt": "2025-12-01T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X GET https://api.jobpilot.com/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Update Current User

Update current user profile.

**Endpoint:** `PATCH /users/me`

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "phoneNumber": "+1234567890",
  "profilePicture": "https://cdn.jobpilot.com/profiles/..."
}
```

**Note:** Cannot update `email`, `password`, `role`, `status` via this endpoint.

**Success Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

---

### Delete Current User

Delete current user account (soft delete).

**Endpoint:** `DELETE /users/me`

**Authentication:** Required

**Success Response (204 No Content)**

---

### Get User by ID (Admin Only)

Get any user by ID.

**Endpoint:** `GET /users/:id`

**Authentication:** Required (Admin/Moderator role)

**Success Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "username": "johndoe",
  "role": "user",
  "status": "active"
}
```

---

### Get All Users (Admin Only)

List all users in the system.

**Endpoint:** `GET /users`

**Authentication:** Required (Admin/Moderator role)

**Success Response (200 OK):**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "username": "johndoe",
    "role": "user",
    "status": "active"
  }
]
```

---

## Profile Management

### Get Profile

Get detailed user profile.

**Endpoint:** `GET /profile`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "bio": "Experienced software engineer...",
  "location": "San Francisco, CA",
  "website": "https://johndoe.com",
  "linkedIn": "https://linkedin.com/in/johndoe",
  "github": "https://github.com/johndoe",
  "twitter": "https://twitter.com/johndoe",
  "yearsOfExperience": 5,
  "currentJobTitle": "Senior Software Engineer",
  "currentCompany": "Tech Corp",
  "expectedSalary": 150000,
  "salaryCurrency": "USD",
  "willingToRelocate": true,
  "availability": "immediately",
  "profilePhoto": "https://cdn.jobpilot.com/profiles/...",
  "createdAt": "2025-01-15T08:00:00Z",
  "updatedAt": "2025-12-01T10:30:00Z"
}
```

---

### Update Profile

Update user profile information.

**Endpoint:** `PUT /profile`

**Authentication:** Required

**Request Body:**
```json
{
  "bio": "Experienced software engineer with focus on backend systems",
  "location": "San Francisco, CA",
  "website": "https://johndoe.com",
  "linkedIn": "https://linkedin.com/in/johndoe",
  "github": "https://github.com/johndoe",
  "yearsOfExperience": 5,
  "currentJobTitle": "Senior Software Engineer",
  "currentCompany": "Tech Corp",
  "expectedSalary": 150000,
  "salaryCurrency": "USD",
  "willingToRelocate": true,
  "availability": "immediately"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "profile": { /* updated profile */ }
}
```

---

### Upload Profile Photo

Upload or update profile photo.

**Endpoint:** `POST /profile/photo`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request:**
```
file: [image file]
```

**Accepted formats:** JPEG, PNG, WebP
**Max size:** 5MB

**Success Response (201 Created):**
```json
{
  "url": "https://cdn.jobpilot.com/profiles/123e4567.jpg",
  "message": "Photo uploaded successfully"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/profile/photo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@profile-photo.jpg"
```

---

### Delete Profile Photo

Remove profile photo.

**Endpoint:** `DELETE /profile/photo`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Profile photo deleted successfully"
}
```

---

### Get Profile Completeness

Get profile completion score and missing fields.

**Endpoint:** `GET /profile/completeness`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "score": 75,
  "completedFields": [
    "bio",
    "location",
    "experience",
    "skills"
  ],
  "missingFields": [
    "education",
    "certifications"
  ],
  "suggestions": [
    "Add education to improve profile visibility",
    "Add certifications to stand out"
  ]
}
```

---

## Career Management

### Get All Work Experiences

List all work experiences.

**Endpoint:** `GET /career/work-experience`

**Authentication:** Required

**Success Response (200 OK):**
```json
[
  {
    "id": "exp-123",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "company": "Tech Corp",
    "position": "Senior Software Engineer",
    "location": "San Francisco, CA",
    "startDate": "2020-01-15",
    "endDate": null,
    "isCurrent": true,
    "description": "Leading backend development...",
    "achievements": [
      "Reduced API latency by 40%",
      "Led team of 5 engineers"
    ],
    "technologies": ["Node.js", "PostgreSQL", "Redis"]
  }
]
```

---

### Create Work Experience

Add new work experience.

**Endpoint:** `POST /career/work-experience`

**Authentication:** Required

**Request Body:**
```json
{
  "company": "Tech Corp",
  "position": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "startDate": "2020-01-15",
  "endDate": null,
  "isCurrent": true,
  "description": "Leading backend development...",
  "achievements": [
    "Reduced API latency by 40%"
  ],
  "technologies": ["Node.js", "PostgreSQL"]
}
```

**Success Response (201 Created):**
```json
{
  "id": "exp-123",
  "company": "Tech Corp",
  "position": "Senior Software Engineer",
  "createdAt": "2025-12-04T10:30:00Z"
}
```

---

### Update Work Experience

Update existing work experience.

**Endpoint:** `PUT /career/work-experience/:id`

**Authentication:** Required

**Request Body:** (same as create)

**Success Response (200 OK):**
```json
{
  "id": "exp-123",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

---

### Delete Work Experience

Remove work experience.

**Endpoint:** `DELETE /career/work-experience/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Work experience deleted successfully"
}
```

---

### Get All Education

List all education entries.

**Endpoint:** `GET /career/education`

**Authentication:** Required

**Success Response (200 OK):**
```json
[
  {
    "id": "edu-123",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "institution": "Stanford University",
    "degree": "Bachelor of Science",
    "fieldOfStudy": "Computer Science",
    "startDate": "2015-09-01",
    "endDate": "2019-06-15",
    "grade": "3.8 GPA",
    "activities": ["ACM Club", "Hackathon Winner"],
    "description": "Focus on distributed systems and AI"
  }
]
```

---

### Create Education

Add new education entry.

**Endpoint:** `POST /career/education`

**Authentication:** Required

**Request Body:**
```json
{
  "institution": "Stanford University",
  "degree": "Bachelor of Science",
  "fieldOfStudy": "Computer Science",
  "startDate": "2015-09-01",
  "endDate": "2019-06-15",
  "grade": "3.8 GPA",
  "activities": ["ACM Club"],
  "description": "Focus on distributed systems"
}
```

**Success Response (201 Created):**
```json
{
  "id": "edu-123",
  "institution": "Stanford University",
  "createdAt": "2025-12-04T10:30:00Z"
}
```

---

### Update Education

Update education entry.

**Endpoint:** `PUT /career/education/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "edu-123",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

---

### Delete Education

Remove education entry.

**Endpoint:** `DELETE /career/education/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Education deleted successfully"
}
```

---

## Skills Management

### Get All Skills

List all user skills.

**Endpoint:** `GET /skills`

**Authentication:** Required

**Success Response (200 OK):**
```json
[
  {
    "id": "skill-123",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Node.js",
    "category": "Backend Development",
    "proficiency": "expert",
    "yearsOfExperience": 5,
    "isVerified": false,
    "endorsements": 12
  }
]
```

---

### Get Skills by Category

Get skills grouped by category.

**Endpoint:** `GET /skills/by-category`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "Backend Development": [
    {
      "id": "skill-123",
      "name": "Node.js",
      "proficiency": "expert"
    }
  ],
  "Frontend Development": [
    {
      "id": "skill-124",
      "name": "React",
      "proficiency": "advanced"
    }
  ]
}
```

---

### Get Skill Suggestions

Get AI-powered skill suggestions based on profile.

**Endpoint:** `GET /skills/suggestions`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "suggestions": [
    {
      "skill": "TypeScript",
      "reason": "Common in your industry and job preferences",
      "priority": "high"
    },
    {
      "skill": "Docker",
      "reason": "Mentioned in 80% of jobs you viewed",
      "priority": "medium"
    }
  ]
}
```

---

### Add Skill

Add new skill to profile.

**Endpoint:** `POST /skills`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Node.js",
  "category": "Backend Development",
  "proficiency": "expert",
  "yearsOfExperience": 5
}
```

**Proficiency levels:** `beginner`, `intermediate`, `advanced`, `expert`

**Success Response (201 Created):**
```json
{
  "id": "skill-123",
  "name": "Node.js",
  "category": "Backend Development",
  "proficiency": "expert"
}
```

---

### Update Skill

Update skill proficiency or details.

**Endpoint:** `PUT /skills/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "proficiency": "expert",
  "yearsOfExperience": 6
}
```

**Success Response (200 OK):**
```json
{
  "id": "skill-123",
  "updatedAt": "2025-12-04T10:30:00Z"
}
```

---

### Delete Skill

Remove skill from profile.

**Endpoint:** `DELETE /skills/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Skill deleted successfully"
}
```

---

## Job Preferences

### Get Preferences

Get job search preferences.

**Endpoint:** `GET /preferences`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "jobTitles": ["Software Engineer", "Backend Developer"],
  "locations": ["San Francisco, CA", "Remote"],
  "remoteType": "remote",
  "employmentTypes": ["full-time"],
  "experienceLevels": ["mid-level", "senior"],
  "salaryMin": 120000,
  "salaryMax": 180000,
  "salaryCurrency": "USD",
  "industries": ["Technology", "Finance"],
  "companySize": ["medium", "large"],
  "benefits": ["health-insurance", "401k"],
  "workSchedule": "flexible",
  "notificationFrequency": "daily",
  "autoApplyEnabled": false
}
```

---

### Update Preferences

Update job preferences.

**Endpoint:** `PUT /preferences`

**Authentication:** Required

**Request Body:**
```json
{
  "jobTitles": ["Software Engineer", "Backend Developer"],
  "locations": ["San Francisco, CA", "Remote"],
  "remoteType": "remote",
  "employmentTypes": ["full-time"],
  "salaryMin": 120000,
  "salaryMax": 180000,
  "autoApplyEnabled": true
}
```

**Success Response (200 OK):**
```json
{
  "message": "Preferences updated successfully",
  "preferences": { /* updated preferences */ }
}
```

---

## Subscription Management

### Get Current Subscription

Get user's subscription details.

**Endpoint:** `GET /subscription`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "plan": "pro",
  "status": "active",
  "currentPeriodStart": "2025-11-01T00:00:00Z",
  "currentPeriodEnd": "2025-12-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "stripeCustomerId": "cus_123",
  "stripeSubscriptionId": "sub_123",
  "features": {
    "maxResumes": 10,
    "autoApplyLimit": 100,
    "aiAssistance": true,
    "prioritySupport": true
  }
}
```

---

### Create Checkout Session

Create Stripe checkout session for subscription.

**Endpoint:** `POST /subscription/checkout`

**Authentication:** Required

**Request Body:**
```json
{
  "priceId": "price_123",
  "successUrl": "https://jobpilot.com/success",
  "cancelUrl": "https://jobpilot.com/cancel"
}
```

**Success Response (201 Created):**
```json
{
  "sessionId": "cs_123",
  "url": "https://checkout.stripe.com/pay/cs_123"
}
```

---

### Create Customer Portal Session

Create Stripe customer portal session.

**Endpoint:** `POST /subscription/portal`

**Authentication:** Required

**Success Response (201 Created):**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

---

### Get Usage Statistics

Get feature usage statistics.

**Endpoint:** `GET /subscription/usage`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "period": {
    "start": "2025-11-01T00:00:00Z",
    "end": "2025-12-01T00:00:00Z"
  },
  "usage": {
    "resumesCreated": 5,
    "resumesLimit": 10,
    "autoApplies": 45,
    "autoAppliesLimit": 100,
    "aiRequests": 120,
    "aiRequestsLimit": 500
  },
  "percentages": {
    "resumes": 50,
    "autoApplies": 45,
    "aiRequests": 24
  }
}
```

---

## Analytics

### Get Dashboard Stats

Get user dashboard statistics.

**Endpoint:** `GET /analytics/dashboard`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "applications": {
    "total": 150,
    "pending": 45,
    "interviewing": 12,
    "offered": 3,
    "rejected": 90
  },
  "recentActivity": {
    "jobsViewed": 89,
    "jobsApplied": 23,
    "profileViews": 156
  },
  "recommendations": {
    "newJobs": 45,
    "matchScore": 82
  },
  "resumeStats": {
    "totalResumes": 3,
    "avgAtsScore": 85
  }
}
```

---

### Get Application Funnel

Get application funnel data.

**Endpoint:** `GET /analytics/applications`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "funnel": [
    {
      "stage": "applied",
      "count": 150,
      "percentage": 100
    },
    {
      "stage": "screening",
      "count": 60,
      "percentage": 40
    },
    {
      "stage": "interviewing",
      "count": 12,
      "percentage": 8
    },
    {
      "stage": "offered",
      "count": 3,
      "percentage": 2
    }
  ],
  "conversionRates": {
    "appliedToScreening": 40,
    "screeningToInterview": 20,
    "interviewToOffer": 25
  }
}
```

---

### Get Recent Activity

Get recent user activity.

**Endpoint:** `GET /analytics/activity`

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "activities": [
    {
      "id": "act-123",
      "type": "job_application",
      "description": "Applied to Senior Software Engineer at Tech Corp",
      "timestamp": "2025-12-04T10:30:00Z",
      "metadata": {
        "jobId": "job-123",
        "jobTitle": "Senior Software Engineer"
      }
    },
    {
      "id": "act-124",
      "type": "resume_updated",
      "description": "Updated resume 'Software Engineer Resume'",
      "timestamp": "2025-12-03T15:20:00Z"
    }
  ]
}
```

---

### Get Profile Strength

Get profile strength analysis.

**Endpoint:** `GET /analytics/profile-strength`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "overall": 85,
  "categories": {
    "basicInfo": {
      "score": 100,
      "status": "complete"
    },
    "experience": {
      "score": 90,
      "status": "strong",
      "suggestions": ["Add more achievements"]
    },
    "education": {
      "score": 80,
      "status": "good"
    },
    "skills": {
      "score": 70,
      "status": "moderate",
      "suggestions": ["Add more technical skills", "Get skill endorsements"]
    }
  },
  "recommendations": [
    "Add certifications to stand out",
    "Complete missing profile sections"
  ]
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| USER001 | User not found |
| USER002 | Unauthorized to access user data |
| USER003 | Invalid profile data |
| USER004 | Profile photo upload failed |
| USER005 | Skill already exists |
| USER006 | Work experience not found |
| USER007 | Education entry not found |
| USER008 | Subscription not found |
| USER009 | Usage limit exceeded |
| USER010 | Invalid subscription plan |

See [Error Codes](./errors.md) for complete error documentation.
