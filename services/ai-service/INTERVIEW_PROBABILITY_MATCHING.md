# Interview Probability Matching Engine

## Overview

The Interview Probability Matching Engine is a sophisticated ML-powered system that calculates the probability of getting an interview based on a candidate's resume, cover letter, and LinkedIn profile matched against job requirements.

Unlike traditional keyword matching, this system performs deep analysis of:
- Skill depth and proficiency levels
- Experience relevance and recency
- Seniority alignment
- Industry fit
- Education match
- Gap identification

## Key Features

### 1. Multi-Source Profile Parsing
- **Resume Analysis**: Extracts skills, experience, education, and certifications
- **Cover Letter**: Identifies additional context and highlighted skills
- **LinkedIn Profile**: Pulls structured professional data

### 2. Intelligent Scoring
The engine calculates interview probability using weighted components:
- **Skill Depth (30%)**: Not just skill presence, but proficiency level
- **Experience Relevance (25%)**: Years and relevance to job requirements
- **Seniority Match (15%)**: Alignment between candidate and role level
- **Industry Fit (10%)**: Industry experience match
- **Education Match (10%)**: Educational requirements alignment
- **Keyword Density (5%)**: Resume keyword alignment with job description
- **Recency (5%)**: How recent is the relevant experience

### 3. Subscription Tier-Based Thresholds
Only matches exceeding tier-specific thresholds are shown:

| Tier | Threshold | Features |
|------|-----------|----------|
| Freemium | 80%+ | Preview only, limited applications |
| Starter | 70%+ | 100 applications/month |
| Basic | 65%+ | 300 applications/month |
| Professional | 60%+ | Unlimited applications, analytics |
| Premium | 55%+ | Human review available |
| Elite | 55%+ | Human review, dedicated support |

### 4. Explainable AI
Each match includes:
- Overall probability score (0-100%)
- Component score breakdown
- Identified strengths
- Critical and minor gaps
- Improvement recommendations
- Application tips

### 5. Continuous Learning
The system improves over time by:
- Recording actual application outcomes
- Retraining models with feedback data
- Calibrating probability scores
- Tracking model performance metrics

## API Endpoints

### POST /api/v1/matching/calculate-probability
Calculate interview probability for a specific job.

**Request:**
```json
{
  "user_id": "user_123",
  "job_id": "job_456",
  "job_requirements": {
    "title": "Senior Software Engineer",
    "company": "Tech Corp",
    "description": "Looking for a senior engineer...",
    "required_skills": ["Python", "AWS", "Docker"],
    "preferred_skills": ["Kubernetes", "React"],
    "min_experience_years": 5,
    "max_experience_years": 10,
    "seniority_level": "senior",
    "industry": "Technology",
    "education_level": 3
  },
  "resume_text": "John Doe\nSenior Software Engineer...",
  "cover_letter": "Dear Hiring Manager...",
  "linkedin_profile": {...},
  "subscription_tier": "professional"
}
```

**Response:**
```json
{
  "match_id": "match_abc123",
  "user_id": "user_123",
  "job_id": "job_456",
  "interview_probability": 0.75,
  "interview_probability_percentage": 75.0,
  "offer_probability": 0.19,
  "overall_score": 73.5,
  "component_scores": {
    "skill_depth": 0.85,
    "experience_relevance": 0.90,
    "seniority_match": 0.80,
    "industry_fit": 0.60,
    "education_match": 1.0
  },
  "threshold_met": true,
  "requires_human_review": false,
  "subscription_tier": "professional",
  "strengths": [
    "Excellent skill match",
    "Experience level is ideal"
  ],
  "critical_gaps": [],
  "minor_gaps": ["Kubernetes"],
  "job_title": "Senior Software Engineer",
  "company": "Tech Corp"
}
```

### POST /api/v1/matching/find-matches
Find top matching jobs for a user.

**Request:**
```json
{
  "user_id": "user_123",
  "jobs": [
    {
      "id": "job_1",
      "title": "Senior Python Developer",
      "required_skills": ["Python", "AWS"],
      ...
    },
    ...
  ],
  "resume_text": "...",
  "subscription_tier": "professional",
  "top_k": 20
}
```

**Response:**
```json
{
  "user_id": "user_123",
  "matches": [...],
  "total_evaluated": 50,
  "total_matches": 12,
  "subscription_tier": "professional",
  "tier_threshold": 0.60,
  "search_metadata": {
    "top_k": 20,
    "processing_time_ms": 1250
  }
}
```

### GET /api/v1/matching/explain/{match_id}
Get detailed explanation for a match.

**Response:**
```json
{
  "explanation_id": "exp_xyz789",
  "match_id": "match_abc123",
  "summary": "Strong match with 75% interview probability",
  "detailed_reasoning": "This is a strong match because...",
  "skill_analysis": "Candidate demonstrates excellent skill alignment...",
  "experience_analysis": "Experience level is ideal for this position...",
  "gap_analysis": "Minor gaps in Kubernetes experience...",
  "strength_analysis": "Key strengths include deep Python expertise...",
  "improvement_recommendations": [
    "Highlight AWS experience in cover letter",
    "Quantify achievements in recent roles"
  ],
  "application_tips": [
    "Apply with confidence - this is a strong match",
    "Customize resume to emphasize cloud experience"
  ],
  "confidence_score": 0.85,
  "data_completeness": 0.90
}
```

### POST /api/v1/matching/feedback
Record application outcome for continuous learning.

**Request:**
```json
{
  "match_id": "match_abc123",
  "user_id": "user_123",
  "job_id": "job_456",
  "outcome": "interview",
  "applied_at": "2024-01-15T10:00:00Z",
  "response_received_at": "2024-01-20T14:30:00Z",
  "interview_rounds": 3,
  "offer_received": true,
  "user_rating": 4.5,
  "user_comments": "Great match, got the offer!"
}
```

### GET /api/v1/matching/thresholds
Get all subscription tier thresholds.

### GET /api/v1/matching/thresholds/{tier}
Get threshold for specific tier.

## Architecture

### Components

1. **ProfileParser** (`src/models/profile_parser.py`)
   - Parses resumes, cover letters, and LinkedIn profiles
   - Extracts skills with categorization
   - Identifies work experience and calculates tenure
   - Determines seniority level
   - Extracts education and certifications

2. **InterviewProbabilityMatcher** (`src/models/interview_probability_matcher.py`)
   - Core matching engine
   - Calculates component scores
   - Computes interview and offer probabilities
   - Generates explanations
   - Manages match results

3. **FeedbackLearningSystem** (`src/models/feedback_learning.py`)
   - Continuous learning from outcomes
   - Ensemble ML models (Gradient Boosting, Random Forest, Logistic Regression)
   - Model training and evaluation
   - Feature importance analysis
   - Probability calibration

4. **Database Models** (`src/models/database_models.py`)
   - MatchResult: Stores match scores and metadata
   - MatchExplanation: Detailed explanations
   - MatchFeedback: Outcome feedback for training
   - TrainingDataPoint: ML training samples
   - ModelMetrics: Performance tracking

## Matching Algorithm

### Step 1: Profile Parsing
```python
profile = parser.parse_profile(
    resume_text=resume,
    cover_letter=cover_letter,
    linkedin_profile=linkedin
)
```

### Step 2: Component Scoring
Each component is scored 0.0-1.0:

- **Skill Depth**: Analyzes not just presence but proficiency
  - Recent mention in experience = higher depth
  - Years of experience factor in
  - Required skills weighted 70%, preferred 30%

- **Experience Relevance**:
  - Perfect match if within min-max range
  - Penalty for under-qualification (15% per year short)
  - Minor penalty for over-qualification (5% per year over)

- **Seniority Match**:
  - Exact match = 1.0
  - One level off = 0.8
  - Two levels off = 0.5
  - Significant mismatch = 0.3

- **Industry Fit**:
  - Direct industry experience = 1.0
  - Related experience = 0.6
  - No industry experience = 0.5

### Step 3: Weighted Scoring
```python
overall_score = (
    skill_depth * 0.30 +
    experience_relevance * 0.25 +
    seniority_match * 0.15 +
    industry_fit * 0.10 +
    education_match * 0.10 +
    keyword_density * 0.05 +
    recency * 0.05
)
```

### Step 4: Probability Calibration
Uses sigmoid function for calibrated probabilities:
```python
P(interview) = 1 / (1 + exp(-k * (score - threshold)))
```

Adjusted based on critical factors like skill match.

### Step 5: Threshold Filtering
Only matches meeting tier threshold are returned.

## Machine Learning Pipeline

### Training Data Collection
- Every application outcome creates a training data point
- Features: skill overlap, experience years, seniority gap, etc.
- Target: outcome score (0=rejected, 0.5=interview, 1.0=offer)
- Weighted by recency (recent data = higher weight)

### Model Training
Three models in ensemble:
1. **Gradient Boosting**: Captures complex non-linear relationships
2. **Random Forest**: Robust to outliers, feature importance
3. **Logistic Regression**: Baseline, interpretable

### Prediction
- Average predictions from all three models
- Provides confidence score based on ensemble variance

### Continuous Improvement
- Periodic retraining (e.g., monthly)
- Performance monitoring (accuracy, AUC-ROC, calibration)
- Feature importance tracking

## Usage Examples

### Calculate Probability for Single Job
```python
from src.models.interview_probability_matcher import InterviewProbabilityMatcher

matcher = InterviewProbabilityMatcher()

result = await matcher.calculate_probability(
    user_id="user_123",
    job_id="job_456",
    job_requirements={
        "title": "Senior Engineer",
        "required_skills": ["Python", "AWS"],
        "min_experience_years": 5,
        "seniority_level": "senior"
    },
    resume_text=resume,
    subscription_tier="professional"
)

print(f"Interview Probability: {result.interview_probability * 100:.1f}%")
print(f"Threshold Met: {result.threshold_met}")
```

### Find Top Matches
```python
matches = await matcher.find_matches(
    user_id="user_123",
    jobs=job_list,
    resume_text=resume,
    subscription_tier="professional",
    top_k=20
)

for match in matches:
    print(f"{match.metadata['job_title']}: {match.interview_probability*100:.1f}%")
```

### Record Feedback
```python
feedback = matcher.record_feedback(
    match_id=result.id,
    outcome=OutcomeType.INTERVIEW,
    user_id="user_123",
    job_id="job_456",
    interview_rounds=3,
    offer_received=True
)
```

## Performance Metrics

The system tracks:
- **Accuracy**: Overall prediction correctness
- **Precision**: Of predicted interviews, how many actually happened
- **Recall**: Of actual interviews, how many were predicted
- **AUC-ROC**: Model's ability to distinguish outcomes
- **Calibration Error**: How well probabilities match actual rates
- **Brier Score**: Probability prediction accuracy

## Testing

Run comprehensive tests:
```bash
cd services/ai-service
pytest tests/test_probability_matching.py -v
```

Tests cover:
- Profile parsing accuracy
- Probability calculation correctness
- Match explanation generation
- Feedback recording
- ML model training and prediction

## Deployment Considerations

### Scaling
- Stateless design allows horizontal scaling
- Cache parsed profiles to reduce computation
- Batch process jobs for efficiency

### Storage
- Store match results in database for retrieval
- Keep training data for model updates
- Archive old predictions for analysis

### Monitoring
- Track average probability scores
- Monitor threshold vs. actual outcome alignment
- Alert on model degradation

### Privacy
- Hash or encrypt sensitive profile data
- Limit data retention period
- Provide user data deletion capability

## Future Enhancements

1. **Deep Learning Models**: BERT-based semantic matching
2. **Contextual Factors**: Job market conditions, company hiring patterns
3. **Competitive Analysis**: Account for likely competition level
4. **Time-to-Response Prediction**: Estimate when to expect replies
5. **Salary Negotiation**: Integrate with offer probability
6. **A/B Testing**: Test different matching algorithms
7. **Explainability Dashboard**: Visualize component contributions

## Support

For questions or issues:
- API Documentation: `/docs` endpoint
- GitHub Issues: [repository]
- Email: support@applyforus.com
