# Job Normalization & Trust Layer

A comprehensive module for normalizing job postings, detecting duplicates, identifying scams, and scoring employer credibility.

## Overview

The Normalization Module provides a unified schema for job data with quality scoring, deduplication, and fraud detection capabilities. It transforms raw job postings from various sources into a standardized format with trust indicators visible to users.

## Features

### 1. Job Normalization
- **Title Standardization**: Normalizes job titles to standard taxonomy (e.g., "Sr. SW Eng" → "Senior Software Engineer")
- **Seniority Detection**: Automatically detects seniority level (Intern, Junior, Mid, Senior, Lead, Principal, etc.)
- **Function Classification**: Categorizes jobs into functions (Engineering, Product, Design, Data, etc.)
- **Skill Extraction**: Extracts and categorizes skills as technical, soft, domain, or certifications
- **Location Normalization**: Standardizes location data with country codes, timezone, and remote status
- **Compensation Normalization**: Converts all salaries to USD for comparison
- **Application Complexity Analysis**: Scores how complex the application process is

### 2. Quality Scoring
- **Overall Quality Score (0-100)**: Combines multiple signals
  - Salary transparency (15 pts)
  - Detailed description (20 pts)
  - Clear requirements (15 pts)
  - Company information (15 pts)
  - Description length (10 pts)
  - Readability (10 pts)
  - Skills listed (10 pts)
  - Benefits listed (5 pts)
- **Freshness Score**: Decays over time (100 for <7 days, 10 for >90 days)
- **Confidence Score**: How confident the system is in the normalization

### 3. Duplicate Detection
- **Content Hashing**: Fast exact-match detection using SHA-256 hashes
- **Fuzzy Matching**: Detects similar jobs using multiple signals:
  - Title similarity (30% weight)
  - Company match (25% weight)
  - Location similarity (10% weight)
  - Description similarity (25% weight)
  - Salary overlap (10% weight)
- **Similarity Score**: 0-100 score indicating how similar jobs are
- **Duplicate Linking**: Links duplicates to the original posting

### 4. Fraud & Scam Detection
- **Scam Score (0-100)**: Multi-signal fraud detection
- **Fraud Signals**:
  - Suspicious salary (unrealistically high)
  - Fake company indicators
  - Poor grammar and spelling
  - Payment requirements (major red flag)
  - Unrealistic promises ("make money fast")
  - Phishing links
- **Risk Level**: Low, Medium, High, Critical
- **Scam Indicators**: Specific list of red flags detected

### 5. Employer Credibility
- **Credibility Score (0-100)**: Composite score from:
  - Company age (0-20 pts)
  - Online presence (0-15 pts)
  - Review quality (0-25 pts)
  - Job posting history (0-20 pts)
  - Response rate (0-10 pts)
  - Transparency (0-10 pts)
- **Verification Status**: Unverified, Pending, Verified, Suspicious, Blacklisted
- **Risk Level**: Low, Medium, High, Critical
- **Review Integration**: Glassdoor and Indeed ratings
- **Job History**: Fill rate, response time, ghosting rate

## Database Schema

### NormalizedJob
Main table storing normalized job data with quality and trust metrics.

Key fields:
- `standardized_title`, `seniority_level`, `function_category`
- `categorized_skills`, `required_skills`, `preferred_skills`
- `salary_min_usd`, `salary_max_usd`, `market_percentile`
- `quality_score`, `confidence_score`, `freshness_score`
- `is_duplicate`, `is_scam`, `scam_score`
- `application_complexity`, `estimated_application_time_minutes`

### EmployerProfile
Tracks employer credibility and verification status.

Key fields:
- `credibility_score`, `verification_status`, `risk_level`
- `glassdoor_rating`, `indeed_rating`, `review_breakdown`
- `total_jobs_posted`, `job_fill_rate`, `response_rate`
- `scam_reports_count`, `fake_job_reports`

### JobTaxonomy
Standard taxonomy for titles, skills, industries.

### JobReport
User-submitted reports of suspicious jobs.

## API Endpoints

### Normalization

#### POST /api/v1/normalize/job
Normalize a single job listing.

```json
{
  "job_id": "uuid",
  "force": false
}
```

Response:
```json
{
  "job_id": "uuid",
  "normalized_job_id": "uuid",
  "standardized_title": "Senior Software Engineer",
  "seniority_level": "senior",
  "function_category": "engineering",
  "quality_score": 85,
  "confidence_score": 90,
  "success": true
}
```

#### POST /api/v1/normalize/batch
Batch normalize multiple jobs.

```json
{
  "job_ids": ["uuid1", "uuid2", "uuid3"],
  "force": false,
  "async": true
}
```

### Quality Analysis

#### GET /api/v1/normalize/jobs/:id/quality-score
Get quality score and analysis for a job.

Response:
```json
{
  "quality_score": 85,
  "confidence_score": 90,
  "quality_signals": {
    "has_salary": true,
    "has_detailed_description": true,
    "has_clear_requirements": true,
    "has_company_info": true,
    "description_length": 1200,
    "readability_score": 78
  },
  "is_duplicate": false,
  "scam_score": 5,
  "scam_indicators": [],
  "freshness_score": 100,
  "age_days": 2
}
```

### Employer Credibility

#### GET /api/v1/normalize/employers/:id/credibility
Get employer credibility score.

Response:
```json
{
  "credibility_score": 78,
  "verification_status": "verified",
  "risk_level": "low",
  "credibility_breakdown": {
    "company_age": 20,
    "online_presence": 15,
    "review_quality": 18,
    "job_history": 16,
    "response_rate": 7,
    "transparency": 8
  },
  "review_data": {
    "glassdoor_rating": 4.2,
    "glassdoor_review_count": 1234,
    "indeed_rating": 4.1,
    "indeed_review_count": 567
  },
  "risk_factors": [],
  "scam_reports_count": 0
}
```

#### POST /api/v1/normalize/employers/:id/recalculate
Recalculate employer credibility score.

### Reporting

#### POST /api/v1/normalize/jobs/report
Report a suspicious job.

```json
{
  "job_id": "uuid",
  "report_type": "scam",
  "severity": "high",
  "description": "Requires payment for training materials",
  "evidence_urls": ["https://screenshot.com/img.png"],
  "reporter_id": "uuid"
}
```

#### GET /api/v1/normalize/reports
Get all job reports (Admin only).

Query params:
- `status`: pending, investigating, verified, dismissed, resolved
- `type`: scam, spam, fake_company, misleading, duplicate
- `limit`: number of results
- `offset`: pagination offset

## Automatic Pipeline

The normalization pipeline runs automatically after job ingestion:

1. Job is ingested from external source
2. Triggers `auto-normalize` queue job
3. Normalization service processes the job:
   - Normalizes title and extracts seniority
   - Extracts and categorizes skills
   - Detects duplicates
   - Checks for fraud signals
   - Calculates quality score
   - Normalizes location and compensation
   - Analyzes application complexity
4. Results saved to `normalized_jobs` table
5. Job is ready for display with trust indicators

## ML Model Integration

The system includes integration points for ML models:

### Title Normalization
- `TitleNormalizerService.normalizeTitle()` - Can be enhanced with ML model
- Stores model version in `normalization_model_version`
- Tracks confidence scores for feedback loop

### Skill Extraction
- `SkillExtractorService.extractSkills()` - Can use NER models
- Pattern matching + ML hybrid approach
- Categorizes skills into technical, soft, domain, certifications

### Fraud Detection
- `FraudDetectorService.detectFraud()` - ML model integration ready
- Multiple fraud signals combined with ML scoring
- Stores model version in `fraud_detection_model_version`

### Duplicate Detection
- `DuplicateDetectorService.detectDuplicate()` - Uses fuzzy matching
- Can be enhanced with embedding similarity (BERT, etc.)
- Content hashing for exact matches

## Employer Verification Workflow

1. **Initial Profile Creation**
   - Employer profile created on first job posting
   - Default credibility score: 50 (neutral)
   - Status: Unverified

2. **Automatic Credibility Calculation**
   - Runs on job posting, reports, reviews
   - Updates credibility score based on signals
   - Adjusts verification status based on thresholds

3. **Manual Verification** (Admin)
   - Review employer data and signals
   - Mark as Verified, Suspicious, or Blacklisted
   - Add verification notes

4. **Continuous Monitoring**
   - Scam reports trigger recalculation
   - Low credibility scores flag for review
   - Blacklisted employers blocked from posting

## Configuration

Environment variables:
```bash
# Enable normalization pipeline
ENABLE_AUTO_NORMALIZATION=true

# ML model endpoints (optional)
ML_TITLE_NORMALIZATION_ENDPOINT=http://ml-service/normalize-title
ML_SKILL_EXTRACTION_ENDPOINT=http://ml-service/extract-skills
ML_FRAUD_DETECTION_ENDPOINT=http://ml-service/detect-fraud

# Thresholds
DUPLICATE_SIMILARITY_THRESHOLD=0.70
SCAM_SCORE_THRESHOLD=70
CREDIBILITY_VERIFICATION_THRESHOLD=70

# External data sources
GLASSDOOR_API_KEY=your_key
INDEED_API_KEY=your_key
```

## Usage Examples

### Normalize a Job After Ingestion
```typescript
import { NormalizationService } from './modules/normalization/services/normalization.service';

// In your job ingestion service
async ingestJob(jobData: any) {
  // Save job to database
  const job = await this.jobRepository.save(jobData);

  // Trigger normalization
  await this.normalizationService.normalizeJob(job.id);

  return job;
}
```

### Check Job Quality Before Display
```typescript
// In your API response
const normalizedJob = await this.normalizedJobRepository.findOne({
  where: { job_id: jobId },
});

if (normalizedJob.is_scam || normalizedJob.scam_score > 70) {
  // Hide job or show warning
  return { ...job, warning: 'This job has been flagged as potentially fraudulent' };
}

if (normalizedJob.is_duplicate) {
  // Link to original
  return { ...job, duplicate_of: normalizedJob.duplicate_of_job_id };
}

// Add trust indicators
return {
  ...job,
  quality_score: normalizedJob.quality_score,
  freshness_score: normalizedJob.freshness_score,
  employer_credibility: employerProfile.credibility_score,
};
```

### Display Employer Credibility
```typescript
// In job details
const employerProfile = await this.employerProfileRepository.findOne({
  where: { company_id: job.company_id },
});

return {
  ...job,
  employer: {
    ...job.company,
    credibility_score: employerProfile.credibility_score,
    verification_status: employerProfile.verification_status,
    glassdoor_rating: employerProfile.glassdoor_rating,
    response_rate: employerProfile.response_rate,
  },
};
```

## Testing

```bash
# Run tests
npm test -- normalization

# Test normalization
curl -X POST http://localhost:3002/api/v1/normalize/job \
  -H "Content-Type: application/json" \
  -d '{"job_id": "uuid", "force": true}'

# Test quality score
curl http://localhost:3002/api/v1/normalize/jobs/uuid/quality-score

# Test employer credibility
curl http://localhost:3002/api/v1/normalize/employers/uuid/credibility

# Report a job
curl -X POST http://localhost:3002/api/v1/normalize/jobs/report \
  -H "Content-Type: application/json" \
  -d '{
    "job_id": "uuid",
    "report_type": "scam",
    "description": "Requires upfront payment",
    "severity": "high"
  }'
```

## Monitoring

Key metrics to track:
- Normalization success rate
- Average confidence score
- Duplicate detection rate
- Scam detection rate (and false positive rate)
- Employer credibility distribution
- Report volume and resolution time

## Future Enhancements

1. **Deep Learning Models**
   - BERT embeddings for semantic similarity
   - Transformer models for title/skill normalization
   - Anomaly detection for fraud

2. **External Data Integration**
   - Real-time Glassdoor/Indeed API integration
   - Company verification via LinkedIn API
   - Domain verification via WHOIS/DNS

3. **Advanced Features**
   - Salary market percentile calculation
   - Skill demand trends
   - Employer reputation trends
   - Automated verification workflows

4. **User Feedback Loop**
   - Collect user feedback on quality scores
   - Learn from report outcomes
   - Improve ML models over time

## License

MIT
