# Interview Probability Matching Engine - Quick Start

## What It Does

The Interview Probability Matching Engine calculates the likelihood of getting an interview for a job based on deep analysis of your resume, cover letter, and LinkedIn profile matched against job requirements.

**Key Features:**
- 📊 **Probability-Based Matching** - Not just keywords, actual interview likelihood (0-100%)
- 🎯 **Subscription Tier Thresholds** - Different tiers get different match quality levels
- 🧠 **ML-Powered** - Learns from actual application outcomes
- 📈 **Explainable AI** - Detailed explanations of why jobs match
- ⚡ **Fast** - Results in < 500ms per job

## Installation

```bash
cd services/ai-service

# Install dependencies
pip install -e ".[dev]"

# Install ML dependencies (if not already installed)
pip install scikit-learn numpy
```

## Quick Start

### 1. Start the Service

```bash
# Development mode
uvicorn src.main:app --reload --port 8000

# Production mode
gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 2. Test the API

```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs
```

### 3. Calculate Interview Probability

```python
import httpx
import asyncio

async def test_matching():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/v1/matching/calculate-probability",
            json={
                "user_id": "user_123",
                "job_id": "job_456",
                "job_requirements": {
                    "title": "Senior Software Engineer",
                    "description": "Looking for a Python developer with AWS experience...",
                    "required_skills": ["Python", "AWS", "Docker"],
                    "min_experience_years": 5,
                    "seniority_level": "senior"
                },
                "resume_text": "John Doe\nSenior Engineer with 7 years Python and AWS experience...",
                "subscription_tier": "professional"
            }
        )
        result = response.json()
        print(f"Interview Probability: {result['interview_probability_percentage']:.1f}%")
        print(f"Threshold Met: {result['threshold_met']}")
        print(f"Strengths: {result['strengths']}")

asyncio.run(test_matching())
```

## API Endpoints

### POST /api/v1/matching/calculate-probability
Calculate interview probability for a single job.

### POST /api/v1/matching/find-matches
Find top matching jobs from a list.

### GET /api/v1/matching/explain/{match_id}
Get detailed explanation for a match.

### POST /api/v1/matching/feedback
Record application outcome for learning.

### GET /api/v1/matching/thresholds
Get all subscription tier thresholds.

See [MATCHING_API_EXAMPLES.md](./MATCHING_API_EXAMPLES.md) for detailed examples.

## Subscription Tiers

| Tier | Threshold | What It Means |
|------|-----------|---------------|
| **Freemium** | 80%+ | Only shows excellent matches (preview) |
| **Starter** | 70%+ | Shows strong matches |
| **Basic** | 65%+ | Shows good matches |
| **Professional** | 60%+ | Shows moderate-to-good matches |
| **Premium** | 55%+ | Shows broader matches with human review |
| **Elite** | 55%+ | Same as Premium with dedicated support |

**Example**: A job with 72% probability would be shown to Starter+ users but not Freemium users.

## How It Works

### 1. Profile Parsing
```
Resume + Cover Letter + LinkedIn → Structured Profile
- Skills (categorized)
- Experience (years + relevance)
- Seniority level
- Industry experience
- Education
```

### 2. Intelligent Scoring
```
7 Weighted Components:
├── Skill Depth (30%) - Proficiency, not just presence
├── Experience Relevance (25%) - Years + relevance
├── Seniority Match (15%) - Level alignment
├── Industry Fit (10%) - Industry experience
├── Education Match (10%) - Educational requirements
├── Keyword Density (5%) - Resume-job alignment
└── Recency (5%) - Recent experience relevance

Overall Score = Weighted Sum → Calibrated Probability
```

### 3. Threshold Filtering
```
If probability ≥ tier_threshold:
  ✓ Show match
  ✓ Enable auto-apply
Else:
  ✗ Hide match
```

### 4. Continuous Learning
```
Application → Outcome (rejected/interview/offer)
           ↓
    Training Data
           ↓
    Model Retraining
           ↓
  Better Predictions
```

## Usage Examples

### Example 1: Auto-Apply System
```python
from src.models.interview_probability_matcher import InterviewProbabilityMatcher

matcher = InterviewProbabilityMatcher()

# Find qualifying matches
matches = await matcher.find_matches(
    user_id="user_123",
    jobs=job_listings,
    resume_text=resume,
    subscription_tier="professional",
    top_k=50
)

# Auto-apply to matches above threshold
for match in matches:
    if match.threshold_met:
        await apply_to_job(match.job_id)
```

### Example 2: Job Search Ranking
```python
# Rank jobs by interview probability
matches = await matcher.find_matches(
    user_id="user_123",
    jobs=search_results,
    resume_text=resume,
    subscription_tier="basic"
)

# Display ranked results
for i, match in enumerate(matches, 1):
    print(f"{i}. {match.metadata['job_title']}")
    print(f"   Probability: {match.interview_probability*100:.1f}%")
    print(f"   Strengths: {', '.join(match.strengths[:2])}")
```

### Example 3: Application Insights
```python
# Calculate probability
result = await matcher.calculate_probability(...)

# Get detailed explanation
explanation = await matcher.explain_match(result.id)

print(explanation.summary)
print("\nRecommendations:")
for rec in explanation.improvement_recommendations:
    print(f"  • {rec}")
```

## Testing

Run the comprehensive test suite:

```bash
# All matching tests
pytest tests/test_probability_matching.py -v

# Specific test
pytest tests/test_probability_matching.py::TestInterviewProbabilityMatcher::test_calculate_probability -v

# With coverage
pytest tests/test_probability_matching.py --cov=src/models --cov-report=html
```

## Performance

Expected performance:
- Single probability calculation: **< 500ms**
- Batch matching (50 jobs): **< 5s**
- Match explanation: **< 1s**

Throughput:
- 1000+ requests/minute per instance
- Horizontally scalable (stateless)

## Configuration

Key environment variables:

```bash
# Optional: LLM for enhanced explanations
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Matching configuration
SKILL_MATCH_WEIGHT=0.30
EXPERIENCE_MATCH_WEIGHT=0.25
MIN_MATCH_SCORE=0.6
```

## Monitoring

Key metrics to track:
```python
# API metrics
- request_rate (req/sec)
- response_time_p95 (ms)
- error_rate (%)

# Matching metrics
- average_probability
- threshold_pass_rate_by_tier
- prediction_accuracy (weekly)

# ML metrics
- training_samples_count
- model_accuracy
- calibration_error
```

## Troubleshooting

### Low Probability Scores
**Issue**: All matches showing low probabilities
**Solution**:
- Check if resume has required skills
- Verify experience years are extracted correctly
- Review job requirements for completeness

### Slow Performance
**Issue**: API taking > 2s per request
**Solution**:
- Enable caching for parsed profiles
- Use batch processing for multiple jobs
- Check LLM API latency (if used for explanations)

### No Matches Found
**Issue**: No jobs meeting threshold
**Solution**:
- Lower subscription tier threshold
- Improve profile completeness
- Add more skills to resume
- Check if job requirements are too strict

## Documentation

- **Main Guide**: [INTERVIEW_PROBABILITY_MATCHING.md](./INTERVIEW_PROBABILITY_MATCHING.md)
- **API Examples**: [MATCHING_API_EXAMPLES.md](./MATCHING_API_EXAMPLES.md)
- **Summary**: [INTERVIEW_PROBABILITY_MATCHING_SUMMARY.md](../INTERVIEW_PROBABILITY_MATCHING_SUMMARY.md)
- **Deployment**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     FastAPI Application             │
│  /api/v1/matching/*                 │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  InterviewProbabilityMatcher        │
│  - Profile parsing                  │
│  - Component scoring                │
│  - Probability calculation          │
│  - Threshold filtering              │
└──────┬──────────────────────────────┘
       │
       ├─────────────┬──────────────┬────────────┐
       ▼             ▼              ▼            ▼
┌────────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
│  Profile   │ │  Skill   │ │  Feedback  │ │   LLM    │
│  Parser    │ │  Analyzer│ │  Learning  │ │  Service │
└────────────┘ └──────────┘ └────────────┘ └──────────┘
```

## Contributing

When adding features:
1. Update profile parser for new data sources
2. Add new scoring components if needed
3. Update ML model features
4. Add tests for new functionality
5. Update documentation

## License

Proprietary - ApplyForUs Platform

## Support

- Issues: GitHub Issues
- Email: dev-team@applyforus.com
- Docs: https://docs.applyforus.com/matching
