# AI Service API Documentation

The AI Service provides AI-powered features including resume optimization, job matching, cover letter generation, interview preparation, and salary prediction.

## Base URL

```
http://localhost:8000/ai
```

## Authentication

Most endpoints are public but some may require API keys in production. Currently operates in open mode for development.

## Endpoints

### Content Generation

#### 1. Generate Cover Letter

Generate a tailored cover letter for a specific job application.

```http
POST /ai/generate/cover-letter
```

**Request Body:**

```json
{
  "jobDescription": "We are seeking a Senior Software Engineer...",
  "resumeText": "John Doe - Senior Software Engineer with 5 years experience...",
  "companyName": "Tech Corp Inc.",
  "jobTitle": "Senior Software Engineer",
  "tone": "professional",
  "length": "medium"
}
```

**Response (200 OK):**

```json
{
  "coverLetter": "Dear Hiring Manager,\n\nI am writing to express my strong interest...",
  "metadata": {
    "wordCount": 350,
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "model": "gpt-4",
    "tone": "professional"
  }
}
```

**Rate Limit:** 30 requests/minute

---

#### 2. Generate Resume Summary

Generate a professional resume summary/objective.

```http
POST /ai/generate/summary
```

**Request Body:**

```json
{
  "experience": "5 years of full-stack development",
  "skills": ["Python", "React", "AWS", "Docker"],
  "careerGoals": "Seeking senior engineering role",
  "industry": "Technology",
  "tone": "professional"
}
```

**Response (200 OK):**

```json
{
  "summary": "Results-driven Full-Stack Developer with 5 years of experience...",
  "alternatives": [
    "Experienced Software Engineer specializing in...",
    "Innovative technologist with proven track record..."
  ],
  "keywords": ["Full-Stack", "Cloud Architecture", "Leadership"]
}
```

---

#### 3. Generate Interview Questions

Generate potential interview questions for a job.

```http
POST /ai/interview/questions
```

**Request Body:**

```json
{
  "jobTitle": "Senior Software Engineer",
  "jobDescription": "We are seeking...",
  "companyName": "Tech Corp Inc.",
  "industry": "Technology",
  "difficulty": "advanced"
}
```

**Response (200 OK):**

```json
{
  "questions": [
    {
      "category": "Technical",
      "question": "How would you design a scalable microservices architecture?",
      "difficulty": "Hard",
      "tips": "Focus on service boundaries, communication patterns, and data consistency"
    },
    {
      "category": "Behavioral",
      "question": "Tell me about a time you led a complex technical project",
      "difficulty": "Medium",
      "tips": "Use STAR method (Situation, Task, Action, Result)"
    }
  ],
  "totalQuestions": 15,
  "categories": {
    "technical": 8,
    "behavioral": 5,
    "situational": 2
  }
}
```

---

### Resume Optimization

#### 1. Optimize Resume

Optimize a resume for ATS systems and specific job.

```http
POST /ai/optimize/resume
```

**Request Body:**

```json
{
  "resumeText": "Current resume content...",
  "jobDescription": "Job description text...",
  "targetKeywords": ["Python", "AWS", "Microservices"],
  "optimizationLevel": "aggressive"
}
```

**Response (200 OK):**

```json
{
  "optimizedResume": {
    "summary": "Optimized professional summary...",
    "experience": [...],
    "skills": [...],
    "achievements": [...]
  },
  "improvements": [
    {
      "section": "Experience",
      "original": "Worked on backend systems",
      "improved": "Architected and implemented scalable microservices backend processing 1M+ requests daily",
      "reason": "Added quantifiable metrics and technical keywords"
    }
  ],
  "atsScore": {
    "before": 65,
    "after": 92,
    "improvement": 27
  },
  "keywordMatches": {
    "matched": ["Python", "AWS", "Docker", "Kubernetes"],
    "missing": ["GraphQL"],
    "suggestions": ["Add GraphQL experience from Project X"]
  }
}
```

**Rate Limit:** 20 requests/minute

---

#### 2. Calculate ATS Score

Calculate ATS compatibility score for a resume.

```http
POST /ai/optimize/ats-score
```

**Request Body:**

```json
{
  "resumeText": "Resume content...",
  "jobDescription": "Job description..."
}
```

**Response (200 OK):**

```json
{
  "score": 85,
  "breakdown": {
    "formatting": 90,
    "keywords": 82,
    "experience": 88,
    "skills": 85,
    "education": 90
  },
  "recommendations": [
    "Add more quantifiable achievements",
    "Include missing keywords: GraphQL, CI/CD",
    "Improve formatting: Use standard section headers"
  ]
}
```

---

### Job Matching

#### 1. Match Jobs to Resume

Find best matching jobs for a resume.

```http
POST /ai/match/jobs
```

**Request Body:**

```json
{
  "resumeText": "Resume content...",
  "preferences": {
    "locations": ["Remote", "San Francisco"],
    "jobTypes": ["Full-time"],
    "industries": ["Technology", "FinTech"],
    "salaryMin": 120000
  },
  "topK": 10
}
```

**Response (200 OK):**

```json
{
  "matches": [
    {
      "jobId": "550e8400-e29b-41d4-a716-446655440001",
      "matchScore": 92.5,
      "title": "Senior Software Engineer",
      "company": "Tech Corp Inc.",
      "location": "Remote",
      "salary": "$140,000 - $180,000",
      "matchReasons": [
        "Strong alignment with Python and AWS skills (95% match)",
        "5 years experience meets requirement",
        "Remote position matches preference"
      ],
      "missingSkills": ["GraphQL"],
      "confidence": 0.95
    }
  ],
  "totalMatches": 10,
  "averageScore": 78.3
}
```

**Rate Limit:** 30 requests/minute

---

#### 2. Calculate Match Score

Calculate match score between resume and specific job.

```http
POST /ai/match/score
```

**Request Body:**

```json
{
  "resumeText": "Resume content...",
  "jobDescription": "Job description...",
  "jobTitle": "Senior Software Engineer"
}
```

**Response (200 OK):**

```json
{
  "matchScore": 87.5,
  "breakdown": {
    "skills": 92,
    "experience": 88,
    "education": 90,
    "location": 85,
    "salary": 80
  },
  "strengths": [
    "Excellent technical skills match (92%)",
    "Experience level perfectly aligned",
    "Strong educational background"
  ],
  "gaps": [
    "Missing GraphQL experience (mentioned in job description)",
    "Limited cloud architecture experience"
  ],
  "recommendations": [
    "Highlight your microservices experience more prominently",
    "Add any GraphQL projects you've worked on",
    "Emphasize leadership and mentoring experience"
  ],
  "applicationPriority": "high"
}
```

---

### Salary Prediction

#### 1. Predict Salary Range

Predict salary range for a position based on various factors.

```http
POST /ai/predict/salary
```

**Request Body:**

```json
{
  "jobTitle": "Senior Software Engineer",
  "location": "San Francisco, CA",
  "yearsOfExperience": 5,
  "skills": ["Python", "React", "AWS", "Docker"],
  "education": "Bachelor's",
  "industry": "Technology",
  "companySize": "500-1000"
}
```

**Response (200 OK):**

```json
{
  "prediction": {
    "min": 140000,
    "max": 180000,
    "median": 160000,
    "currency": "USD",
    "period": "annual"
  },
  "confidence": 0.87,
  "factors": {
    "location": {
      "impact": 25,
      "description": "San Francisco is a high-paying market"
    },
    "experience": {
      "impact": 20,
      "description": "5 years is mid-senior level"
    },
    "skills": {
      "impact": 30,
      "description": "Strong demand for your skill set"
    },
    "industry": {
      "impact": 15,
      "description": "Technology sector pays well"
    },
    "education": {
      "impact": 10,
      "description": "Bachelor's degree is standard"
    }
  },
  "comparison": {
    "nationalAverage": 130000,
    "industryAverage": 155000,
    "percentile": 75
  },
  "recommendations": [
    "Consider negotiating toward $165,000-$175,000 range",
    "Adding Kubernetes skill could increase range by $10-15k",
    "Remote positions in this range: $120-150k typically"
  ]
}
```

**Rate Limit:** 30 requests/minute

---

### Resume Parsing

#### 1. Parse Resume

Extract structured data from resume file or text.

```http
POST /ai/parse/resume
```

**Request:**
- Content-Type: multipart/form-data
- Body: file (PDF/DOCX) or resumeText (string)

**Response (200 OK):**

```json
{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe"
  },
  "summary": "Experienced software engineer...",
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Software Engineer",
      "startDate": "2020-01",
      "endDate": "present",
      "location": "San Francisco, CA",
      "description": "Led development of...",
      "achievements": [...]
    }
  ],
  "education": [
    {
      "institution": "Stanford University",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationDate": "2018",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "technical": ["Python", "JavaScript", "AWS"],
    "soft": ["Leadership", "Communication"],
    "languages": ["English (Native)", "Spanish (Intermediate)"]
  },
  "certifications": [
    {
      "name": "AWS Solutions Architect",
      "issuer": "Amazon",
      "date": "2022"
    }
  ],
  "confidence": 0.92
}
```

---

### Embedding & Semantic Search

#### 1. Generate Embedding

Generate vector embedding for text.

```http
POST /ai/embeddings/generate
```

**Request Body:**

```json
{
  "text": "Senior Software Engineer with 5 years experience in Python and AWS",
  "model": "text-embedding-ada-002"
}
```

**Response (200 OK):**

```json
{
  "embedding": [0.002345, -0.012456, ...],
  "dimensions": 1536,
  "model": "text-embedding-ada-002"
}
```

---

#### 2. Semantic Search

Perform semantic search across stored documents.

```http
POST /ai/embeddings/search
```

**Request Body:**

```json
{
  "query": "Python AWS microservices",
  "topK": 10,
  "filter": {
    "type": "job",
    "location": "remote"
  }
}
```

**Response (200 OK):**

```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "score": 0.92,
      "text": "Senior Backend Engineer...",
      "metadata": {
        "title": "Senior Backend Engineer",
        "company": "Tech Corp"
      }
    }
  ]
}
```

---

## Health Check

```http
GET /health
```

**Response (200 OK):**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "dependencies": {
    "llm_service": "healthy",
    "embedding_service": "healthy",
    "vector_store": "healthy"
  }
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

### Common Error Codes

- `INVALID_INPUT` - Invalid request parameters
- `MODEL_ERROR` - AI model error
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Internal server error

## Rate Limits

| Endpoint Category | Limit |
|------------------|-------|
| Generation | 30 requests/minute |
| Optimization | 20 requests/minute |
| Matching | 30 requests/minute |
| Parsing | 10 requests/minute |

## Best Practices

1. **Cache responses** when possible to reduce API calls
2. **Batch requests** for multiple operations
3. **Use specific parameters** for better results
4. **Monitor token usage** for cost optimization
5. **Implement retry logic** with exponential backoff

## Examples

### Complete Job Application Flow

```python
import requests

base_url = "http://localhost:8000/ai"

# 1. Parse resume
resume_data = requests.post(
    f"{base_url}/parse/resume",
    files={"file": open("resume.pdf", "rb")}
).json()

# 2. Find matching jobs
matches = requests.post(
    f"{base_url}/match/jobs",
    json={
        "resumeText": resume_data["raw_text"],
        "topK": 10
    }
).json()

# 3. Generate cover letter for top match
cover_letter = requests.post(
    f"{base_url}/generate/cover-letter",
    json={
        "jobDescription": matches["matches"][0]["description"],
        "resumeText": resume_data["raw_text"],
        "companyName": matches["matches"][0]["company"]
    }
).json()

# 4. Optimize resume for the job
optimized = requests.post(
    f"{base_url}/optimize/resume",
    json={
        "resumeText": resume_data["raw_text"],
        "jobDescription": matches["matches"][0]["description"]
    }
).json()

print(f"Match Score: {matches['matches'][0]['matchScore']}")
print(f"ATS Score Improvement: {optimized['atsScore']['improvement']}%")
```

## SDK Support

Official SDKs are available for:
- Python: `pip install jobpilot-ai-sdk`
- JavaScript/TypeScript: `npm install @jobpilot/ai-sdk`
- Go: `go get github.com/jobpilot/ai-sdk-go`
