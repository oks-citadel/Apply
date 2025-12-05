# Resume Service API

The Resume Service handles resume creation, management, import/export, versioning, and ATS optimization.

## Base Paths

```
/resumes                    - Resume CRUD operations
/resumes/:id/sections      - Resume sections management
```

## Resume Management

### Create Resume

Create a new resume.

**Endpoint:** `POST /resumes`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Senior Software Engineer Resume",
  "templateId": "123e4567-e89b-12d3-a456-426614174000",
  "content": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe",
      "website": "https://johndoe.com"
    },
    "summary": "Experienced software engineer with 5+ years...",
    "experience": [],
    "education": [],
    "skills": [],
    "certifications": [],
    "projects": []
  },
  "isPrimary": false
}
```

**Success Response (201 Created):**
```json
{
  "id": "resume-123",
  "userId": "user-456",
  "title": "Senior Software Engineer Resume",
  "templateId": "template-789",
  "isPrimary": false,
  "atsScore": 0,
  "version": 1,
  "created_at": "2025-12-04T10:30:00Z",
  "updated_at": "2025-12-04T10:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/resumes \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior Software Engineer Resume",
    "isPrimary": true
  }'
```

---

### Get All Resumes

List all resumes for current user.

**Endpoint:** `GET /resumes`

**Authentication:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Success Response (200 OK):**
```json
{
  "resumes": [
    {
      "id": "resume-123",
      "userId": "user-456",
      "title": "Senior Software Engineer Resume",
      "templateId": "template-789",
      "isPrimary": true,
      "atsScore": 85,
      "version": 3,
      "lastModified": "2025-12-04T10:30:00Z",
      "created_at": "2025-11-01T08:00:00Z",
      "updated_at": "2025-12-04T10:30:00Z"
    },
    {
      "id": "resume-124",
      "title": "Frontend Developer Resume",
      "isPrimary": false,
      "atsScore": 78,
      "version": 1,
      "created_at": "2025-11-15T10:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

---

### Get Resume by ID

Get detailed resume information.

**Endpoint:** `GET /resumes/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "resume-123",
  "userId": "user-456",
  "title": "Senior Software Engineer Resume",
  "templateId": "template-789",
  "content": {
    "personalInfo": {
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/johndoe",
      "github": "https://github.com/johndoe",
      "website": "https://johndoe.com"
    },
    "summary": "Experienced software engineer with 5+ years in backend development...",
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "startDate": "2020-01-15",
        "endDate": null,
        "current": true,
        "description": "Leading backend development team...",
        "achievements": [
          "Reduced API latency by 40%",
          "Led team of 5 engineers"
        ]
      }
    ],
    "education": [
      {
        "institution": "Stanford University",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "startDate": "2015-09-01",
        "endDate": "2019-06-15",
        "gpa": "3.8"
      }
    ],
    "skills": [
      {
        "category": "Backend Development",
        "items": ["Node.js", "PostgreSQL", "Redis", "AWS"]
      },
      {
        "category": "Frontend Development",
        "items": ["React", "TypeScript"]
      }
    ],
    "certifications": [
      {
        "name": "AWS Certified Solutions Architect",
        "issuer": "Amazon Web Services",
        "date": "2023-05-15",
        "expiryDate": "2026-05-15",
        "credentialId": "AWS-123456"
      }
    ],
    "projects": [
      {
        "name": "Job Application Platform",
        "description": "Built scalable job application automation platform",
        "technologies": ["Node.js", "PostgreSQL", "Redis"],
        "url": "https://github.com/johndoe/project"
      }
    ]
  },
  "isPrimary": true,
  "atsScore": 85,
  "version": 3,
  "created_at": "2025-11-01T08:00:00Z",
  "updated_at": "2025-12-04T10:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Resume not found or doesn't belong to user

---

### Update Resume

Update resume content.

**Endpoint:** `PUT /resumes/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Updated Resume Title",
  "content": {
    "summary": "Updated professional summary...",
    "experience": []
  }
}
```

**Success Response (200 OK):**
```json
{
  "id": "resume-123",
  "title": "Updated Resume Title",
  "version": 4,
  "updated_at": "2025-12-04T11:00:00Z"
}
```

---

### Delete Resume

Delete a resume.

**Endpoint:** `DELETE /resumes/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Resume deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Resume not found
- `400 Bad Request` - Cannot delete primary resume (set another as primary first)

---

### Duplicate Resume

Create a copy of an existing resume.

**Endpoint:** `POST /resumes/:id/duplicate`

**Authentication:** Required

**Success Response (201 Created):**
```json
{
  "id": "resume-125",
  "title": "Senior Software Engineer Resume (Copy)",
  "version": 1,
  "created_at": "2025-12-04T11:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/resumes/resume-123/duplicate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Set Primary Resume

Set a resume as the primary/default resume.

**Endpoint:** `POST /resumes/:id/set-primary`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "resume-123",
  "title": "Senior Software Engineer Resume",
  "isPrimary": true,
  "updated_at": "2025-12-04T11:00:00Z"
}
```

---

## Resume Import/Export

### Import Resume

Import resume from PDF or DOCX file.

**Endpoint:** `POST /resumes/import`

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request:**
```
file: [PDF or DOCX file]
title: "Imported Resume" (optional)
```

**Accepted formats:** PDF, DOCX, DOC
**Max file size:** 10MB

**Success Response (201 Created):**
```json
{
  "id": "resume-126",
  "title": "Imported Resume",
  "content": {
    "personalInfo": { /* extracted info */ },
    "summary": "Extracted summary...",
    "experience": [ /* extracted experience */ ],
    "education": [ /* extracted education */ ],
    "skills": [ /* extracted skills */ ]
  },
  "atsScore": 72,
  "created_at": "2025-12-04T11:00:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/resumes/import \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@resume.pdf" \
  -F "title=My Imported Resume"
```

**Error Responses:**
- `400 Bad Request` - Invalid file format or file too large
- `422 Unprocessable Entity` - Failed to parse resume content

---

### Export Resume

Export resume in specified format.

**Endpoint:** `GET /resumes/:id/export/:format`

**Authentication:** Required

**Path Parameters:**
- `format`: Export format (`pdf`, `docx`, `json`)

**Success Response (200 OK):**

Returns file download with appropriate content type:
- PDF: `application/pdf`
- DOCX: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- JSON: `application/json`

**cURL Example:**
```bash
# Export as PDF
curl -X GET https://api.jobpilot.com/resumes/resume-123/export/pdf \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o resume.pdf

# Export as DOCX
curl -X GET https://api.jobpilot.com/resumes/resume-123/export/docx \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o resume.docx

# Export as JSON
curl -X GET https://api.jobpilot.com/resumes/resume-123/export/json \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o resume.json
```

**Error Responses:**
- `400 Bad Request` - Invalid export format
- `404 Not Found` - Resume not found

---

## Resume Versioning

### Get Version History

Get resume version history.

**Endpoint:** `GET /resumes/:id/versions`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "versions": [
    {
      "version": 3,
      "created_at": "2025-12-04T10:30:00Z",
      "changes": "Updated work experience",
      "atsScore": 85
    },
    {
      "version": 2,
      "created_at": "2025-12-01T15:00:00Z",
      "changes": "Added new skills",
      "atsScore": 82
    },
    {
      "version": 1,
      "created_at": "2025-11-01T08:00:00Z",
      "changes": "Initial version",
      "atsScore": 78
    }
  ],
  "currentVersion": 3
}
```

---

### Restore Version

Restore resume to a specific version.

**Endpoint:** `POST /resumes/:id/versions/:version/restore`

**Authentication:** Required

**Path Parameters:**
- `version`: Version number to restore

**Success Response (200 OK):**
```json
{
  "id": "resume-123",
  "version": 4,
  "restoredFrom": 2,
  "message": "Resume restored to version 2",
  "updated_at": "2025-12-04T11:30:00Z"
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/resumes/resume-123/versions/2/restore \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## ATS Optimization

### Calculate ATS Score

Calculate Applicant Tracking System (ATS) compatibility score.

**Endpoint:** `POST /resumes/:id/ats-score`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "atsScore": 85,
  "breakdown": {
    "formatting": {
      "score": 90,
      "issues": []
    },
    "keywords": {
      "score": 85,
      "matched": ["Node.js", "PostgreSQL", "AWS"],
      "missing": ["Kubernetes", "Docker"]
    },
    "structure": {
      "score": 88,
      "issues": ["Consider adding a skills section"]
    },
    "contact_info": {
      "score": 100,
      "issues": []
    },
    "length": {
      "score": 80,
      "wordCount": 650,
      "recommendation": "Optimal length is 500-600 words"
    }
  },
  "recommendations": [
    "Add keywords: Kubernetes, Docker",
    "Optimize resume length to 500-600 words",
    "Use more action verbs in experience descriptions",
    "Add quantifiable achievements"
  ],
  "strengths": [
    "Clear contact information",
    "Well-structured sections",
    "Good use of keywords"
  ],
  "weaknesses": [
    "Missing some industry-standard keywords",
    "Could be more concise"
  ]
}
```

---

## Resume Sections

Resume sections allow for modular management of resume components.

### Create Section

Add a new section to resume.

**Endpoint:** `POST /resumes/:resumeId/sections`

**Authentication:** Required

**Request Body:**
```json
{
  "type": "experience",
  "title": "Work Experience",
  "order": 2,
  "visible": true,
  "content": {
    "company": "Tech Corp",
    "position": "Senior Engineer",
    "startDate": "2020-01-15",
    "current": true,
    "description": "Leading backend development..."
  }
}
```

**Section types:** `experience`, `education`, `skills`, `certifications`, `projects`, `custom`

**Success Response (201 Created):**
```json
{
  "id": "section-123",
  "resumeId": "resume-123",
  "type": "experience",
  "title": "Work Experience",
  "order": 2,
  "visible": true,
  "created_at": "2025-12-04T11:00:00Z"
}
```

---

### Get All Sections

Get all sections for a resume.

**Endpoint:** `GET /resumes/:resumeId/sections`

**Authentication:** Required

**Success Response (200 OK):**
```json
[
  {
    "id": "section-123",
    "type": "experience",
    "title": "Work Experience",
    "order": 2,
    "visible": true,
    "content": { /* section content */ }
  },
  {
    "id": "section-124",
    "type": "education",
    "title": "Education",
    "order": 3,
    "visible": true,
    "content": { /* section content */ }
  }
]
```

---

### Get Section by ID

Get specific section details.

**Endpoint:** `GET /resumes/:resumeId/sections/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "id": "section-123",
  "resumeId": "resume-123",
  "type": "experience",
  "title": "Work Experience",
  "order": 2,
  "visible": true,
  "content": {
    "company": "Tech Corp",
    "position": "Senior Engineer",
    "startDate": "2020-01-15",
    "current": true,
    "description": "Leading backend development..."
  },
  "created_at": "2025-11-01T08:00:00Z",
  "updated_at": "2025-12-04T11:00:00Z"
}
```

---

### Update Section

Update section content or properties.

**Endpoint:** `PUT /resumes/:resumeId/sections/:id`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Professional Experience",
  "visible": true,
  "content": {
    "description": "Updated description..."
  }
}
```

**Success Response (200 OK):**
```json
{
  "id": "section-123",
  "message": "Section updated successfully",
  "updated_at": "2025-12-04T11:30:00Z"
}
```

---

### Delete Section

Remove section from resume.

**Endpoint:** `DELETE /resumes/:resumeId/sections/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "message": "Section deleted successfully"
}
```

---

### Reorder Sections

Change the order of resume sections.

**Endpoint:** `POST /resumes/:resumeId/sections/reorder`

**Authentication:** Required

**Request Body:**
```json
[
  { "id": "section-123", "order": 1 },
  { "id": "section-124", "order": 2 },
  { "id": "section-125", "order": 3 }
]
```

**Success Response (200 OK):**
```json
{
  "message": "Sections reordered successfully"
}
```

---

## Resume Templates

Resume templates define the layout and styling of exported resumes.

### Available Templates

- `modern` - Clean, modern design
- `professional` - Traditional professional layout
- `creative` - Creative design with color accents
- `minimal` - Minimalist single-column layout
- `compact` - Compact two-column layout
- `ats-optimized` - ATS-friendly simple format

Templates are specified during resume creation or export.

---

## Rate Limiting

Resume service endpoints have the following rate limits:

| Endpoint | Free Tier | Pro Tier |
|----------|-----------|----------|
| Create Resume | 10/day | Unlimited |
| Update Resume | 50/day | Unlimited |
| Import Resume | 5/day | 50/day |
| Export Resume | 20/day | 200/day |
| ATS Score | 10/day | 100/day |

---

## Best Practices

1. **Version Control:**
   - Versions are automatically created on updates
   - Keep important versions by using meaningful update messages

2. **ATS Optimization:**
   - Run ATS score check before exporting
   - Follow recommendations to improve score
   - Aim for 80+ score for best results

3. **File Formats:**
   - Use PDF for final submissions
   - Use DOCX for editable versions
   - Use JSON for programmatic access

4. **Import Quality:**
   - Use high-quality PDF/DOCX files
   - Ensure text is selectable (not scanned images)
   - Review imported content for accuracy

5. **Resume Length:**
   - Keep resume to 1-2 pages
   - Optimize for 500-600 words
   - Focus on relevant experience

---

## Error Codes

| Code | Description |
|------|-------------|
| RES001 | Resume not found |
| RES002 | Invalid resume format |
| RES003 | Resume limit reached for tier |
| RES004 | Cannot delete primary resume |
| RES005 | Import failed - unsupported format |
| RES006 | Import failed - file too large |
| RES007 | Import failed - parsing error |
| RES008 | Export failed |
| RES009 | Invalid template ID |
| RES010 | Section not found |
| RES011 | Invalid section type |
| RES012 | Version not found |

See [Error Codes](./errors.md) for complete error documentation.
