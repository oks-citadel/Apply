# AI Service Backend Implementation

## Overview

This document describes the implementation of the AI service backend with FastAPI, providing AI/ML endpoints for the Job-Apply-Platform frontend.

## Implementation Summary

### Files Created/Modified

1. **`src/api/routes/ai_endpoints.py`** (NEW)
   - Complete implementation of all 10 AI endpoints matching frontend API contracts
   - Includes Pydantic models for request/response validation
   - OpenAI integration with fallback to mock responses

2. **`src/main.py`** (MODIFIED)
   - Added import for `ai_endpoints` router
   - Registered new router with prefix `/ai`

3. **`src/config.py`** (MODIFIED)
   - Made API keys optional (default to empty string)
   - Made JWT secret optional for development

4. **`src/api/routes/__init__.py`** (MODIFIED)
   - Added `ai_endpoints` to exports

5. **`test_ai_endpoints.py`** (NEW)
   - Comprehensive test script for all endpoints

## Implemented Endpoints

All endpoints are available at `/ai/*` prefix:

### 1. POST /ai/generate-summary
Generate professional summary from experience and skills.

**Request:**
```json
{
  "experience": [
    {
      "company": "Tech Corp",
      "position": "Software Engineer",
      "description": "Built web applications",
      "highlights": ["Led team of 5"]
    }
  ],
  "skills": ["Python", "JavaScript", "React"],
  "tone": "professional" // optional: professional, casual, creative
}
```

**Response:**
```json
{
  "summary": "Results-driven professional with...",
  "alternatives": ["Alternative version 1", "Alternative version 2"]
}
```

### 2. POST /ai/generate-bullets
Generate achievement bullet points for work experience.

**Request:**
```json
{
  "position": "Senior Developer",
  "company": "Tech Startup",
  "description": "Full-stack development",
  "achievements": "Built microservices", // optional
  "count": 5 // optional: 3-10
}
```

**Response:**
```json
{
  "bullets": [
    "Led cross-functional team to deliver...",
    "Implemented automated testing framework..."
  ]
}
```

### 3. POST /ai/generate-cover-letter
Generate cover letter for job application.

**Request:**
```json
{
  "resumeId": "resume123",
  "jobId": "job456", // optional
  "jobTitle": "Software Engineer",
  "company": "Big Tech Co",
  "jobDescription": "Looking for talented engineers",
  "tone": "professional", // optional: professional, enthusiastic, formal
  "length": "medium", // optional: short, medium, long
  "customInstructions": "Emphasize leadership" // optional
}
```

**Response:**
```json
{
  "coverLetter": "Dear Hiring Manager...",
  "subject": "Application for Software Engineer at Big Tech Co"
}
```

### 4. POST /ai/ats-score
Calculate ATS compatibility score using keyword matching.

**Request:**
```json
{
  "resumeId": "resume123",
  "jobDescription": "Looking for Python developer with AWS and Docker experience"
}
```

**Response:**
```json
{
  "score": 75,
  "breakdown": {
    "keywordMatch": 35,
    "formatting": 25,
    "contentQuality": 15
  },
  "suggestions": [
    "Add these important keywords: aws, docker, kubernetes",
    "Use more strong action verbs"
  ],
  "matchedKeywords": ["python", "developer", "experience"],
  "missingKeywords": ["aws", "docker", "kubernetes"]
}
```

**ATS Scoring Algorithm:**
- **Keyword Match (40%)**: Percentage of job description keywords found in resume
- **Formatting (30%)**: Checks for experience, education, and skills sections
- **Content Quality (30%)**: Checks for quantifiable achievements and action verbs

### 5. POST /ai/optimize-resume
Optimize resume for specific job description.

**Request:**
```json
{
  "resumeId": "resume123",
  "jobDescription": "Senior software engineer position...",
  "focusAreas": ["summary", "skills"] // optional: skills, experience, summary, all
}
```

**Response:**
```json
{
  "suggestions": [
    {
      "section": "summary",
      "current": "Generic professional summary",
      "suggested": "Results-driven professional with...",
      "reason": "Tailor summary to highlight relevant skills",
      "impact": "high"
    }
  ],
  "optimizedContent": {
    "summary": "Experienced professional with...",
    "skills": ["Python", "JavaScript", "React"],
    "experience": [
      {
        "id": "exp1",
        "highlights": ["Led development of...", "Implemented CI/CD..."]
      }
    ]
  }
}
```

### 6. POST /ai/improve-text
Improve text quality using AI.

**Request:**
```json
{
  "text": "I did coding at my job",
  "context": "bullet", // summary, bullet, description, general
  "instructions": "Make it more impactful" // optional
}
```

**Response:**
```json
{
  "improved": "Developed scalable software solutions for enterprise clients",
  "suggestions": [
    "Use more specific action verbs",
    "Add quantifiable metrics",
    "Make the language more concise"
  ]
}
```

### 7. POST /ai/interview-prep
Generate interview questions and preparation materials.

**Request:**
```json
{
  "jobId": "job123",
  "resumeId": "resume123" // optional
}
```

**Response:**
```json
{
  "questions": [
    {
      "category": "behavioral",
      "question": "Tell me about a time when...",
      "tips": [
        "Use the STAR method",
        "Focus on your problem-solving approach"
      ],
      "sampleAnswer": "In my previous role..." // optional
    }
  ],
  "companyInsights": {
    "culture": ["Collaborative environment", "Innovation focus"],
    "values": ["Customer-first approach", "Continuous learning"],
    "interviewProcess": ["Phone screening", "Technical assessment"]
  }
}
```

### 8. POST /ai/salary-prediction
Predict salary range based on job details and experience.

**Request:**
```json
{
  "jobTitle": "Senior Software Engineer",
  "location": "San Francisco",
  "experienceYears": 5,
  "skills": ["Python", "AWS", "Docker"],
  "education": "Bachelor's", // optional
  "industry": "Technology" // optional
}
```

**Response:**
```json
{
  "minSalary": 145000,
  "maxSalary": 195000,
  "median": 170000,
  "confidence": 0.75,
  "factors": {
    "experienceImpact": "+25%",
    "locationImpact": "+40%",
    "skillsImpact": "+5%",
    "industryImpact": "0%"
  },
  "marketData": {
    "dataPoints": 1250,
    "lastUpdated": "2024-01-15",
    "percentile25": 145000,
    "percentile75": 195000,
    "sampleSize": "Large"
  }
}
```

**Salary Calculation Algorithm:**
- Base salary from job title lookup
- Experience multiplier: 1 + (years * 0.05)
- Location multipliers: SF (1.4x), NYC (1.3x), Seattle (1.25x), etc.
- Final range: median ± 15%

### 9. POST /ai/skill-gap-analysis
Analyze skill gaps between current resume and target role.

**Request:**
```json
{
  "resumeId": "resume123",
  "targetRole": "Senior Full-Stack Engineer",
  "targetCompany": "Tech Corp" // optional
}
```

**Response:**
```json
{
  "currentSkills": ["JavaScript", "React", "Node.js"],
  "requiredSkills": ["JavaScript", "TypeScript", "React", "AWS"],
  "missingSkills": [
    {
      "skill": "TypeScript",
      "importance": "critical",
      "learningResources": [
        {
          "name": "TypeScript Documentation",
          "url": "https://www.typescriptlang.org/docs/",
          "type": "tutorial"
        },
        {
          "name": "Understanding TypeScript - Udemy",
          "url": "https://www.udemy.com/course/understanding-typescript/",
          "type": "course"
        }
      ]
    }
  ],
  "recommendations": [
    "Focus on learning TypeScript as it's becoming industry standard",
    "Gain hands-on experience with AWS through personal projects"
  ]
}
```

### 10. POST /ai/career-path
Suggest career path progression based on resume.

**Request:**
```json
{
  "resumeId": "resume123"
}
```

**Response:**
```json
{
  "currentLevel": "Mid-Level Software Engineer",
  "nextRoles": [
    {
      "title": "Senior Software Engineer",
      "yearsToReach": 2,
      "requiredSkills": ["System Design", "Mentoring", "Technical Leadership"],
      "averageSalary": 140000
    },
    {
      "title": "Staff Engineer",
      "yearsToReach": 4,
      "requiredSkills": ["Cross-team Leadership", "Technical Strategy"],
      "averageSalary": 180000
    }
  ],
  "recommendations": [
    "Build expertise in system design and architecture",
    "Take on mentoring responsibilities to develop leadership skills"
  ]
}
```

## OpenAI Integration

The service integrates with OpenAI's GPT-3.5-turbo for text generation:

### Configuration
Set the `OPENAI_API_KEY` environment variable:
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Fallback Behavior
If no API key is configured or the key is invalid:
- All endpoints will return **mock/template responses**
- The service will log that it's using fallback mode
- No errors will be thrown - seamless degradation

### API Call Function
```python
async def call_openai(prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    if has_openai_key():
        # Call OpenAI API
        response = await openai.ChatCompletion.acreate(...)
        return response.choices[0].message.content
    else:
        # Return mock response
        return generate_mock_response(prompt)
```

## CORS Configuration

The service is configured to accept requests from the frontend:

```python
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

All AI endpoints support CORS and are accessible from the web frontend.

## Error Handling

All endpoints include proper error handling:

- **422 Unprocessable Entity**: Invalid request data (Pydantic validation)
- **500 Internal Server Error**: Unexpected errors (with details in debug mode)
- All errors return structured JSON responses

Example error response:
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "details": {
    "errors": [...]
  }
}
```

## Running the Service

### Development Mode
```bash
cd services/ai-service

# Set environment variables
export OPENAI_API_KEY=sk-your-key-here  # Optional
export DEBUG=true
export LOG_LEVEL=INFO

# Run the service
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Testing Endpoints

Use the provided test script:
```bash
python test_ai_endpoints.py
```

Or use curl:
```bash
# Test summary generation
curl -X POST http://localhost:8000/ai/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "experience": [
      {
        "company": "Tech Corp",
        "position": "Software Engineer",
        "description": "Built web applications",
        "highlights": ["Led team"]
      }
    ],
    "skills": ["Python", "JavaScript"],
    "tone": "professional"
  }'
```

## API Documentation

When running in development mode, interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Dependencies

All required dependencies are in `requirements.txt`:

```
fastapi==0.109.0
uvicorn[standard]==0.27.0
pydantic==2.5.3
openai==1.10.0
structlog==24.1.0
python-multipart==0.0.6
httpx==0.26.0
```

## Architecture

```
services/ai-service/
├── src/
│   ├── api/
│   │   └── routes/
│   │       ├── ai_endpoints.py    # NEW: Frontend-facing AI endpoints
│   │       ├── generate.py        # Existing: Advanced generation endpoints
│   │       ├── optimize.py        # Existing: Resume optimization
│   │       └── ...
│   ├── main.py                    # FastAPI app with all routers
│   ├── config.py                  # Settings and configuration
│   └── services/
│       └── llm_service.py         # LLM service abstraction
├── test_ai_endpoints.py           # Test script
└── requirements.txt
```

## Future Enhancements

1. **Database Integration**: Fetch actual resume/job data from database
2. **Advanced ML Models**: Use fine-tuned models for better predictions
3. **Caching**: Implement Redis caching for common requests
4. **Rate Limiting**: Add per-user rate limiting
5. **Authentication**: Integrate with auth service for user context
6. **Streaming Responses**: Support streaming for real-time text generation
7. **A/B Testing**: Test different prompt strategies
8. **Analytics**: Track endpoint usage and performance metrics

## Notes

- All endpoints work without OpenAI API key (mock responses)
- ATS scoring uses rule-based algorithm (keyword matching)
- Salary prediction uses simplified location/experience multipliers
- Skill gap analysis uses hardcoded skill mappings (would use ML in production)
- Career path suggestions are template-based (would use career data in production)

## Testing

The implementation includes:

1. **Request/Response Validation**: Pydantic models ensure data integrity
2. **Error Handling**: Comprehensive try-catch blocks with logging
3. **Fallback Mechanisms**: Mock responses when AI services unavailable
4. **CORS Support**: Configured for frontend access
5. **Structured Logging**: All operations logged with context

## Support

For issues or questions:
- Check the logs in debug mode
- Review the API documentation at `/docs`
- Ensure environment variables are set correctly
- Verify CORS origins include your frontend URL
