# Interview Probability Matching - API Examples

## Quick Start

### 1. Calculate Interview Probability

```bash
curl -X POST "http://localhost:8000/api/v1/matching/calculate-probability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user_123",
    "job_id": "job_456",
    "job_requirements": {
      "title": "Senior Software Engineer",
      "company": "Tech Corp",
      "description": "We are looking for a senior engineer with Python and cloud experience...",
      "required_skills": ["Python", "AWS", "Docker"],
      "preferred_skills": ["Kubernetes", "React"],
      "min_experience_years": 5,
      "max_experience_years": 10,
      "seniority_level": "senior",
      "industry": "Technology",
      "education_level": 3
    },
    "resume_text": "John Doe\nSenior Software Engineer\n...",
    "subscription_tier": "professional"
  }'
```

**Response:**
```json
{
  "match_id": "match_abc123",
  "interview_probability": 0.75,
  "interview_probability_percentage": 75.0,
  "overall_score": 73.5,
  "threshold_met": true,
  "strengths": ["Excellent skill match", "Experience level is ideal"],
  "critical_gaps": [],
  "minor_gaps": ["Kubernetes"]
}
```

### 2. Find Top Matches

```bash
curl -X POST "http://localhost:8000/api/v1/matching/find-matches" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "user_id": "user_123",
    "jobs": [
      {
        "id": "job_1",
        "title": "Senior Python Developer",
        "required_skills": ["Python", "AWS"],
        "min_experience_years": 5,
        "seniority_level": "senior",
        "description": "Python backend development"
      },
      {
        "id": "job_2",
        "title": "DevOps Engineer",
        "required_skills": ["Docker", "Kubernetes", "AWS"],
        "min_experience_years": 4,
        "seniority_level": "senior",
        "description": "DevOps automation"
      }
    ],
    "resume_text": "...",
    "subscription_tier": "professional",
    "top_k": 10
  }'
```

### 3. Get Match Explanation

```bash
curl -X GET "http://localhost:8000/api/v1/matching/explain/match_abc123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "summary": "Strong match with 75% interview probability",
  "detailed_reasoning": "This is a strong match because your skills align very well...",
  "improvement_recommendations": [
    "Highlight AWS experience in cover letter",
    "Quantify achievements"
  ],
  "application_tips": [
    "Apply with confidence",
    "Customize your resume"
  ]
}
```

### 4. Record Feedback

```bash
curl -X POST "http://localhost:8000/api/v1/matching/feedback" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "match_id": "match_abc123",
    "user_id": "user_123",
    "job_id": "job_456",
    "outcome": "interview",
    "applied_at": "2024-01-15T10:00:00Z",
    "response_received_at": "2024-01-20T14:30:00Z",
    "interview_rounds": 3,
    "offer_received": true,
    "user_rating": 4.5
  }'
```

### 5. Get Tier Thresholds

```bash
curl -X GET "http://localhost:8000/api/v1/matching/thresholds" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Python SDK Examples

### Setup
```python
import httpx
from typing import Dict, Any, List

class MatchingClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def calculate_probability(
        self,
        user_id: str,
        job_id: str,
        job_requirements: Dict[str, Any],
        resume_text: str,
        subscription_tier: str = "basic"
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/matching/calculate-probability",
                headers=self.headers,
                json={
                    "user_id": user_id,
                    "job_id": job_id,
                    "job_requirements": job_requirements,
                    "resume_text": resume_text,
                    "subscription_tier": subscription_tier
                }
            )
            response.raise_for_status()
            return response.json()

    async def find_matches(
        self,
        user_id: str,
        jobs: List[Dict[str, Any]],
        resume_text: str,
        subscription_tier: str = "basic",
        top_k: int = 20
    ) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/v1/matching/find-matches",
                headers=self.headers,
                json={
                    "user_id": user_id,
                    "jobs": jobs,
                    "resume_text": resume_text,
                    "subscription_tier": subscription_tier,
                    "top_k": top_k
                }
            )
            response.raise_for_status()
            return response.json()
```

### Usage
```python
import asyncio

async def main():
    client = MatchingClient(
        base_url="http://localhost:8000",
        api_key="your_api_key"
    )

    # Calculate probability for single job
    result = await client.calculate_probability(
        user_id="user_123",
        job_id="job_456",
        job_requirements={
            "title": "Senior Engineer",
            "required_skills": ["Python", "AWS"],
            "min_experience_years": 5,
            "seniority_level": "senior",
            "description": "Backend engineering role"
        },
        resume_text=open("resume.txt").read(),
        subscription_tier="professional"
    )

    print(f"Interview Probability: {result['interview_probability_percentage']:.1f}%")
    print(f"Threshold Met: {result['threshold_met']}")
    print(f"Strengths: {', '.join(result['strengths'])}")

    if result['critical_gaps']:
        print(f"Critical Gaps: {', '.join(result['critical_gaps'])}")

asyncio.run(main())
```

## JavaScript/TypeScript Examples

### Setup
```typescript
interface MatchingRequest {
  user_id: string;
  job_id: string;
  job_requirements: JobRequirements;
  resume_text: string;
  subscription_tier?: string;
}

interface JobRequirements {
  title: string;
  company?: string;
  description: string;
  required_skills: string[];
  preferred_skills?: string[];
  min_experience_years: number;
  max_experience_years?: number;
  seniority_level: string;
  industry?: string;
  education_level?: number;
}

interface MatchingResponse {
  match_id: string;
  interview_probability: number;
  interview_probability_percentage: number;
  overall_score: number;
  threshold_met: boolean;
  strengths: string[];
  critical_gaps: string[];
  minor_gaps: string[];
}

class MatchingClient {
  constructor(
    private baseUrl: string,
    private apiKey: string
  ) {}

  async calculateProbability(
    request: MatchingRequest
  ): Promise<MatchingResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/matching/calculate-probability`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  async findMatches(
    userId: string,
    jobs: JobRequirements[],
    resumeText: string,
    subscriptionTier: string = 'basic',
    topK: number = 20
  ): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/matching/find-matches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          jobs,
          resume_text: resumeText,
          subscription_tier: subscriptionTier,
          top_k: topK
        })
      }
    );

    return await response.json();
  }
}
```

### Usage
```typescript
const client = new MatchingClient(
  'http://localhost:8000',
  'your_api_key'
);

// Calculate probability
const result = await client.calculateProbability({
  user_id: 'user_123',
  job_id: 'job_456',
  job_requirements: {
    title: 'Senior Software Engineer',
    description: 'Backend engineering role...',
    required_skills: ['Python', 'AWS', 'Docker'],
    min_experience_years: 5,
    seniority_level: 'senior'
  },
  resume_text: resumeText,
  subscription_tier: 'professional'
});

console.log(`Interview Probability: ${result.interview_probability_percentage}%`);
console.log(`Threshold Met: ${result.threshold_met}`);
```

## React Integration Example

```tsx
import React, { useState } from 'react';
import { MatchingClient } from './matching-client';

const JobMatchCalculator: React.FC = () => {
  const [probability, setProbability] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateMatch = async (jobId: string, resumeText: string) => {
    setLoading(true);
    try {
      const client = new MatchingClient(
        process.env.REACT_APP_API_URL!,
        process.env.REACT_APP_API_KEY!
      );

      const result = await client.calculateProbability({
        user_id: 'current_user_id',
        job_id: jobId,
        job_requirements: {
          // ... job data
        },
        resume_text: resumeText,
        subscription_tier: 'professional'
      });

      setProbability(result.interview_probability_percentage);
    } catch (error) {
      console.error('Failed to calculate probability:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Calculating match probability...</p>}
      {probability !== null && (
        <div>
          <h3>Interview Probability: {probability.toFixed(1)}%</h3>
          <ProgressBar value={probability} />
        </div>
      )}
    </div>
  );
};
```

## Common Use Cases

### 1. Auto-Apply System
```python
async def auto_apply_to_jobs(user_id: str, jobs: List[Dict], resume: str, tier: str):
    client = MatchingClient(base_url, api_key)

    # Find top matches
    result = await client.find_matches(
        user_id=user_id,
        jobs=jobs,
        resume_text=resume,
        subscription_tier=tier,
        top_k=50
    )

    # Filter by threshold
    qualifying_matches = [
        m for m in result['matches']
        if m['threshold_met']
    ]

    # Apply to top matches
    for match in qualifying_matches[:20]:  # Apply to top 20
        await apply_to_job(match['job_id'], user_id)
        print(f"Applied to {match['job_title']} ({match['interview_probability_percentage']:.1f}%)")
```

### 2. Job Search Ranking
```python
async def rank_job_listings(user_id: str, job_listings: List[Dict], resume: str):
    client = MatchingClient(base_url, api_key)

    result = await client.find_matches(
        user_id=user_id,
        jobs=job_listings,
        resume_text=resume,
        subscription_tier="professional"
    )

    # Sort by probability
    ranked_jobs = sorted(
        result['matches'],
        key=lambda x: x['interview_probability'],
        reverse=True
    )

    return ranked_jobs
```

### 3. Application Insights
```python
async def get_application_insights(match_id: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{base_url}/api/v1/matching/explain/{match_id}",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        explanation = response.json()

        print("=" * 50)
        print(f"Summary: {explanation['summary']}")
        print(f"\nStrengths:")
        for strength in explanation['strength_analysis']:
            print(f"  • {strength}")

        print(f"\nImprovement Tips:")
        for tip in explanation['improvement_recommendations']:
            print(f"  • {tip}")
```

## Error Handling

```python
try:
    result = await client.calculate_probability(...)
except httpx.HTTPStatusError as e:
    if e.response.status_code == 400:
        print("Invalid request:", e.response.json())
    elif e.response.status_code == 404:
        print("Match not found")
    elif e.response.status_code == 429:
        print("Rate limit exceeded")
    else:
        print(f"Server error: {e.response.status_code}")
except httpx.RequestError as e:
    print(f"Network error: {e}")
```

## Rate Limiting

The API has rate limits per subscription tier:
- Freemium: 10 requests/minute
- Starter: 30 requests/minute
- Basic: 60 requests/minute
- Professional: 120 requests/minute
- Premium/Elite: 300 requests/minute

## Best Practices

1. **Cache Results**: Store match results to avoid recalculation
2. **Batch Processing**: Use find-matches for multiple jobs
3. **Provide Feedback**: Always record outcomes for better predictions
4. **Handle Errors**: Implement retry logic with exponential backoff
5. **Monitor Usage**: Track API usage to stay within rate limits
6. **Validate Input**: Ensure job requirements are complete and accurate
7. **Privacy**: Don't log or store sensitive resume data unnecessarily
