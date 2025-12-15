# Resume & Cover Letter Alignment Engine

## Overview

The Alignment Engine is an intelligent system that automatically tailors resumes and cover letters to specific job descriptions while maintaining truthfulness and never fabricating experience.

## Features

### 1. Resume Alignment
- **Job Requirement Parsing**: Extracts skills, keywords, and requirements from job descriptions
- **Resume Analysis**: Analyzes resume content against job requirements
- **Content Optimization**: Reorders and emphasizes relevant experience without fabrication
- **ATS Optimization**: Optimizes keyword placement and formatting for Applicant Tracking Systems
- **Regional Playbook Support**: Applies region-specific formatting and conventions
- **Skill Gap Analysis**: Identifies matched skills, missing skills, and transferable skills

### 2. Cover Letter Generation
- **Tailored Content**: Generates job-specific cover letters
- **Tone & Style Control**: Professional, casual, enthusiastic, or formal tones
- **Regional Formatting**: Applies cultural norms from regional playbooks
- **Experience Highlighting**: References specific relevant experience
- **Truthful**: No exaggeration or fabrication of qualifications

### 3. Analysis & Insights
- **Match Scoring**: Overall, skill, experience, and keyword match scores
- **Skill Gap Identification**: Shows what skills are missing
- **Improvement Suggestions**: Actionable recommendations for skill development
- **Before/After Comparison**: Shows exactly what changed and why
- **Match Explanation**: Human-readable explanation of job fit

## Architecture

### Entities

#### AlignedResume
Stores job-specific resume versions with:
- Optimized content with relevance scores
- Match scores (overall, ATS, skill, experience)
- Alignment metadata (target job, keywords, playbook)
- Highlighted and reordered sections

#### GeneratedCoverLetter
Stores tailored cover letters with:
- Plain text and HTML versions
- Tone and style metadata
- Relevance and appropriateness scores
- Key points highlighted

#### AlignmentAnalysis
Stores comprehensive analysis with:
- Skill gap analysis (matched, missing, transferable)
- Experience alignment (relevant roles, seniority)
- Keyword analysis (present, missing, ATS compatibility)
- Improvement suggestions (skills, certifications, resume tips)
- Match breakdown and explanation

### Services

#### ResumeAlignmentService
Core service for resume alignment:
- `analyzeResumeFit()` - Analyze resume vs job match
- `generateAlignedResume()` - Create optimized resume
- `getAnalysis()` - Retrieve analysis results
- `getImprovementSuggestions()` - Get aggregated suggestions

#### CoverLetterService
Cover letter generation:
- `generateCoverLetter()` - Create tailored cover letter
- `getCoverLetter()` - Retrieve cover letter
- `listCoverLetters()` - List user's cover letters
- `updateCoverLetter()` - Modify cover letter content

#### AIServiceClient
Integration with AI service for NLP:
- Job description parsing
- Resume-job matching analysis
- Content rewrite suggestions
- Summary optimization
- Cover letter generation
- Keyword extraction
- ATS score calculation

## API Endpoints

### POST /api/v1/alignment/analyze
Analyze how well a resume matches a job.

**Request:**
```json
{
  "resumeId": "uuid",
  "jobId": "uuid",  // OR jobDescription
  "jobDescription": "string",
  "jobTitle": "Senior Full Stack Developer",
  "companyName": "TechCorp Inc."
}
```

**Response:**
```json
{
  "id": "uuid",
  "overallMatchScore": 85.5,
  "skillMatchPercentage": 88.0,
  "experienceMatchPercentage": 92.0,
  "skillGapAnalysis": {
    "matchedSkills": [...],
    "missingSkills": [...],
    "transferableSkills": [...]
  },
  "keywordAnalysis": {
    "presentKeywords": [...],
    "missingKeywords": [...],
    "atsCompatibility": {...}
  },
  "improvementSuggestions": {...},
  "matchExplanation": "You are a strong fit...",
  "strengths": [...],
  "weaknesses": [...],
  "recommendation": "strong-fit"
}
```

### POST /api/v1/alignment/resume
Generate a job-specific aligned resume.

**Request:**
```json
{
  "resumeId": "uuid",
  "jobId": "uuid",
  "playbookRegion": "united-states",
  "applyAtsOptimization": true,
  "title": "Resume for Senior Developer at TechCorp"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Resume for Senior Developer at TechCorp",
  "content": {...},
  "matchScore": 85.5,
  "atsScore": 92.0,
  "skillMatchScore": 88.0,
  "experienceMatchScore": 90.0,
  "keywordDensity": 75.0
}
```

### POST /api/v1/alignment/cover-letter
Generate a tailored cover letter.

**Request:**
```json
{
  "resumeId": "uuid",
  "alignedResumeId": "uuid",  // optional
  "jobId": "uuid",
  "tone": "professional",
  "style": "modern",
  "playbookRegion": "united-states",
  "hiringManager": "Jane Smith"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Cover Letter for...",
  "content": "Dear Jane Smith,...",
  "contentHtml": "<p>Dear Jane Smith,...</p>",
  "relevanceScore": 90.0,
  "toneAppropriateness": 95.0,
  "wordCount": 350
}
```

### GET /api/v1/alignment/explain/:id
Get detailed explanation of alignment decisions.

**Response:**
```json
{
  "analysis": {...},
  "alignmentChanges": {
    "sectionsReordered": [...],
    "contentRewritten": [...],
    "itemsHighlighted": [...],
    "keywordsAdded": [...]
  },
  "beforeAfter": {
    "original": {...},
    "aligned": {...}
  },
  "changeExplanations": [
    {
      "change": "Reordered experience section...",
      "impact": "Increased relevance by 15%"
    }
  ]
}
```

### GET /api/v1/alignment/suggestions/:userId
Get improvement suggestions for a user.

**Response:**
```json
[
  {
    "skill": "AWS",
    "occurrences": 5,
    "priority": "high"
  },
  {
    "skill": "Docker",
    "occurrences": 3,
    "priority": "medium"
  }
]
```

## How It Works

### Resume Alignment Process

1. **Job Analysis**
   - Parse job description using AI
   - Extract required/preferred skills
   - Identify key responsibilities
   - Extract ATS keywords

2. **Resume Analysis**
   - Match skills against requirements
   - Calculate experience relevance
   - Identify keyword presence
   - Determine overall fit

3. **Content Optimization**
   - Reorder experiences by relevance
   - Optimize summary for job
   - Emphasize matching skills
   - Improve keyword density
   - Apply regional formatting

4. **Quality Assurance**
   - Verify no fabrication
   - Ensure readability
   - Check ATS compatibility
   - Calculate final scores

### Cover Letter Generation Process

1. **Context Gathering**
   - Load resume content
   - Parse job requirements
   - Get regional playbook guidelines

2. **Content Generation**
   - AI generates tailored content
   - Apply tone and style preferences
   - Highlight relevant experience
   - Reference specific requirements

3. **Formatting**
   - Apply regional format
   - Add proper salutation/closing
   - Ensure word count limits
   - Generate HTML version

4. **Quality Scoring**
   - Calculate relevance score
   - Measure tone appropriateness
   - Verify completeness

## Truthfulness Guarantees

The alignment engine is designed to maintain truthfulness:

1. **No Fabrication**: Never adds fake experience, skills, or achievements
2. **Reordering Only**: Changes order of existing content for emphasis
3. **Rephrasing**: Rewords existing achievements for clarity/impact
4. **Highlighting**: Emphasizes relevant existing content
5. **Keyword Integration**: Adds keywords only where naturally appropriate
6. **Transparent Changes**: All changes are tracked and explainable

## Integration with AI Service

The alignment engine integrates with the AI service for:

- **NLP Operations**: Job parsing, text analysis, keyword extraction
- **Content Generation**: Summary optimization, cover letter writing
- **Scoring**: Match analysis, ATS scoring, relevance calculation
- **Suggestions**: Rewrite recommendations, improvement ideas

### Fallback Behavior

When AI service is unavailable:
- Basic keyword matching is used
- Simple reordering logic applies
- Template-based cover letters generated
- Graceful degradation ensures functionality

## Regional Playbook Support

The engine supports regional playbooks for:

- United States
- Canada
- United Kingdom
- European Union
- Australia
- Global Remote

Playbook features:
- Resume format preferences
- Cover letter style
- Cultural norms
- Keyword preferences
- Tone expectations

## Best Practices

### For Resume Alignment

1. **Always use base resume**: Start with user's most complete resume
2. **Enable ATS optimization**: Unless specifically targeting human review
3. **Apply regional playbook**: Match target job location
4. **Review before submission**: User should always review aligned content

### For Cover Letter Generation

1. **Provide hiring manager name**: When available for personalization
2. **Match tone to company culture**: Research company beforehand
3. **Use aligned resume**: For consistency between documents
4. **Keep concise**: Respect word count limits

### For Analysis

1. **Run before application**: Give users insights before applying
2. **Show improvement suggestions**: Help users develop missing skills
3. **Explain decisions**: Always provide rationale for recommendations
4. **Track over time**: Show progress across multiple applications

## Database Schema

### aligned_resumes
- Primary data: id, user_id, job_id, base_resume_id
- Content: content (jsonb), alignment_metadata (jsonb)
- Scores: match_score, ats_score, skill_match_score, experience_match_score
- Metadata: title, is_active, file_path
- Timestamps: created_at, updated_at, deleted_at

### generated_cover_letters
- Primary data: id, user_id, job_id, aligned_resume_id, base_resume_id
- Content: content (text), content_html (text), metadata (jsonb)
- Scores: relevance_score, tone_appropriateness, word_count
- Metadata: title, is_active, file_path
- Timestamps: created_at, updated_at, deleted_at

### alignment_analyses
- Primary data: id, user_id, job_id, base_resume_id, aligned_resume_id
- Job data: job_description, job_title, company_name
- Analysis: skill_gap_analysis, experience_alignment, keyword_analysis
- Changes: alignment_changes (jsonb)
- Suggestions: improvement_suggestions (jsonb)
- Scores: overall_match_score, various match percentages
- Results: match_explanation, strengths, weaknesses, recommendation
- Timestamps: created_at, updated_at, deleted_at

## Testing

Run tests:
```bash
npm test -- alignment
```

Test coverage includes:
- Resume alignment accuracy
- Cover letter generation quality
- Analysis correctness
- Truthfulness verification
- API endpoint functionality
- Error handling

## Monitoring

Key metrics to monitor:
- Alignment generation success rate
- Average match scores
- AI service integration health
- Response times
- User satisfaction (via feedback)

## Future Enhancements

Potential improvements:
1. Machine learning for better matching
2. Industry-specific playbooks
3. Multi-language support
4. A/B testing of variations
5. Success tracking (interview/offer rates)
6. Collaborative filtering recommendations
7. Video interview answer generation
8. LinkedIn profile optimization

## Support

For issues or questions:
- Check API documentation
- Review service logs
- Contact development team
- Submit bug reports via issue tracker
