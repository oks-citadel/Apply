# AI Service API

The AI Service provides intelligent features including job matching, resume optimization, interview preparation, and career insights powered by advanced machine learning models.

## Overview

JobPilot's AI features leverage state-of-the-art natural language processing and machine learning to provide:

- Intelligent job-to-candidate matching
- Resume content optimization
- ATS compatibility analysis
- Interview question generation
- Career path recommendations
- Salary insights
- Skills gap analysis

## Authentication

All AI endpoints require authentication via JWT Bearer token.

## Rate Limiting

AI endpoints are rate-limited based on subscription tier:

| Feature | Free Tier | Pro Tier | Enterprise |
|---------|-----------|----------|------------|
| Job Matching | 10/day | 100/day | Unlimited |
| Resume Analysis | 5/day | 50/day | Unlimited |
| Interview Prep | 3/day | 30/day | Unlimited |
| Career Insights | 5/day | 50/day | Unlimited |

---

## Job Matching & Recommendations

### AI Job Match Analysis

Get detailed AI-powered match analysis for a specific job.

**Endpoint:** `POST /ai/jobs/:job_id/match`

**Authentication:** Required

**Request Body:**
```json
{
  "resume_id": "resume-123",
  "include_recommendations": true
}
```

**Success Response (200 OK):**
```json
{
  "job_id": "job-789",
  "job_title": "Senior Backend Engineer",
  "company": "Tech Corp",
  "overall_match_score": 92,
  "confidence": 0.95,
  "match_breakdown": {
    "skills": {
      "score": 95,
      "matched_skills": [
        {
          "skill": "Node.js",
          "proficiency_required": "expert",
          "your_proficiency": "expert",
          "match": 100
        },
        {
          "skill": "PostgreSQL",
          "proficiency_required": "advanced",
          "your_proficiency": "expert",
          "match": 100
        }
      ],
      "missing_skills": [
        {
          "skill": "Kubernetes",
          "importance": "preferred",
          "impact_on_score": -5
        }
      ]
    },
    "experience": {
      "score": 90,
      "required_years": "5-7",
      "your_years": 6,
      "relevant_experience": [
        {
          "position": "Senior Software Engineer at Previous Corp",
          "relevance": 95,
          "key_matches": ["Team leadership", "System architecture"]
        }
      ]
    },
    "education": {
      "score": 85,
      "required": "Bachelor's in Computer Science or related field",
      "your_education": "BS Computer Science, Stanford",
      "meets_requirements": true
    },
    "location": {
      "score": 100,
      "job_location": "San Francisco, CA",
      "your_preferences": ["San Francisco, CA", "Remote"],
      "match_type": "exact"
    },
    "salary": {
      "score": 88,
      "job_range": "150k-200k USD",
      "your_expectation": "160k-180k USD",
      "alignment": "good"
    },
    "culture_fit": {
      "score": 87,
      "factors": [
        {
          "aspect": "Work-life balance",
          "company_rating": 4.5,
          "your_importance": "high",
          "match": 90
        },
        {
          "aspect": "Innovation focus",
          "company_rating": 4.8,
          "your_importance": "high",
          "match": 95
        }
      ]
    }
  },
  "strengths": [
    "Perfect match for core technical skills (Node.js, PostgreSQL)",
    "Experience level aligns exactly with requirements",
    "Location preference matches",
    "Salary expectations within range",
    "Strong culture fit based on company values"
  ],
  "concerns": [
    "Missing preferred skill: Kubernetes (consider adding to profile)",
    "Limited experience with microservices architecture mentioned in description"
  ],
  "recommendations": {
    "resume_updates": [
      "Emphasize Node.js and PostgreSQL projects in experience section",
      "Highlight team leadership experience",
      "Add any Kubernetes or container orchestration experience"
    ],
    "cover_letter_points": [
      "Reference your 6 years of backend development experience",
      "Highlight scalability projects that match job requirements",
      "Mention your familiarity with the company's tech stack"
    ],
    "interview_prep": [
      "Review microservices architecture patterns",
      "Prepare examples of system design decisions",
      "Be ready to discuss team collaboration experiences"
    ]
  },
  "application_strategy": {
    "priority": "high",
    "recommended_action": "apply_immediately",
    "timing_advice": "Apply within 48 hours - fresh posting with strong match",
    "success_probability": 0.85
  },
  "similar_successful_candidates": {
    "profile_similarity": 88,
    "common_backgrounds": [
      "Backend development at SaaS companies",
      "Experience with distributed systems",
      "Team leadership roles"
    ]
  }
}
```

**cURL Example:**
```bash
curl -X POST https://api.jobpilot.com/ai/jobs/job-789/match \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": "resume-123",
    "include_recommendations": true
  }'
```

---

### Generate Personalized Job Recommendations

Get AI-curated job recommendations.

**Endpoint:** `POST /ai/recommendations/generate`

**Authentication:** Required

**Request Body:**
```json
{
  "limit": 20,
  "preferences": {
    "job_titles": ["Backend Engineer", "Software Engineer"],
    "locations": ["San Francisco", "Remote"],
    "min_salary": 150000,
    "remote_type": "hybrid"
  },
  "include_explanations": true
}
```

**Success Response (200 OK):**
```json
{
  "recommendations": [
    {
      "job_id": "job-789",
      "job_title": "Senior Backend Engineer",
      "company": "Tech Corp",
      "match_score": 92,
      "ranking_position": 1,
      "recommendation_reasons": [
        "Perfect skill match (95% alignment)",
        "Matches your experience level exactly",
        "Location preference match",
        "High cultural fit based on company reviews",
        "Competitive salary within your range"
      ],
      "why_recommended": "This position is an exceptional match for your profile. The role requires expertise in Node.js and PostgreSQL, which align perfectly with your strongest skills. The company culture emphasizes work-life balance and innovation, matching your stated preferences.",
      "application_deadline": "2025-12-15T23:59:59Z",
      "competition_level": "moderate",
      "estimated_applicants": 150
    }
  ],
  "insights": {
    "total_analyzed": 500,
    "match_criteria_met": 20,
    "avg_match_score": 78,
    "top_matching_skills": ["Node.js", "PostgreSQL", "AWS"],
    "trending_requirements": ["Kubernetes", "Docker", "Microservices"]
  },
  "suggestions": {
    "skill_improvements": [
      "Adding Kubernetes experience could increase matches by 15%",
      "AWS certification could boost match scores"
    ],
    "search_expansion": [
      "Consider 'Full Stack Engineer' roles - 12 high matches available",
      "Expanding location to include 'New York' adds 8 strong matches"
    ]
  }
}
```

---

## Resume Optimization

### AI Resume Analysis

Get comprehensive AI analysis of resume with improvement suggestions.

**Endpoint:** `POST /ai/resumes/:resume_id/analyze`

**Authentication:** Required

**Request Body:**
```json
{
  "target_role": "Senior Backend Engineer",
  "target_industry": "Technology",
  "include_rewrite_suggestions": true
}
```

**Success Response (200 OK):**
```json
{
  "resume_id": "resume-123",
  "overall_score": 85,
  "ats_compatibility": {
    "score": 88,
    "parsability": "excellent",
    "keyword_density": "optimal",
    "format_issues": []
  },
  "content_analysis": {
    "strength_score": 82,
    "clarity_score": 88,
    "impact_score": 79,
    "keyword_optimization": 85,
    "action_verb_usage": 90,
    "quantifiable_achievements": 75
  },
  "section_scores": {
    "summary": {
      "score": 85,
      "strengths": ["Clear value proposition", "Industry-relevant keywords"],
      "improvements": ["Could be more concise", "Add specific metrics"]
    },
    "experience": {
      "score": 88,
      "strengths": ["Strong action verbs", "Relevant experience highlighted"],
      "improvements": ["Add more quantifiable results", "Some descriptions too verbose"]
    },
    "skills": {
      "score": 90,
      "strengths": ["Comprehensive technical skills", "Well-organized"],
      "improvements": ["Consider removing outdated technologies"]
    },
    "education": {
      "score": 95,
      "strengths": ["Clear and complete"],
      "improvements": []
    }
  },
  "keyword_analysis": {
    "matched_keywords": ["Node.js", "PostgreSQL", "AWS", "microservices"],
    "missing_important_keywords": ["Kubernetes", "Docker", "CI/CD"],
    "keyword_frequency": {
      "Node.js": 5,
      "PostgreSQL": 3,
      "leadership": 2
    },
    "industry_trending_keywords": ["cloud-native", "serverless", "observability"]
  },
  "impact_analysis": {
    "strong_achievements": [
      "Reduced API latency by 40%",
      "Led team of 5 engineers"
    ],
    "achievements_needing_metrics": [
      "Improved system performance",
      "Enhanced code quality"
    ]
  },
  "recommendations": {
    "critical": [
      {
        "section": "experience",
        "issue": "Missing quantifiable metrics",
        "suggestion": "Add specific numbers to achievements (e.g., '40% improvement', '$2M cost savings')",
        "examples": [
          "Before: 'Improved system performance'",
          "After: 'Improved system performance by 40%, reducing average response time from 200ms to 120ms'"
        ]
      }
    ],
    "important": [
      {
        "section": "skills",
        "issue": "Missing trending technologies",
        "suggestion": "Add Kubernetes and Docker if you have experience",
        "impact": "Could increase match rate by 15%"
      }
    ],
    "optional": [
      {
        "section": "summary",
        "issue": "Could be more concise",
        "suggestion": "Reduce summary from 5 sentences to 3 for better impact"
      }
    ]
  },
  "rewrite_suggestions": [
    {
      "section": "experience",
      "original": "Worked on improving the API performance",
      "suggested": "Optimized API architecture, reducing average response time by 40% and handling 10K+ requests per second",
      "reasoning": "More specific, includes metrics, uses stronger action verb"
    },
    {
      "section": "summary",
      "original": "I am a software engineer with experience in backend development",
      "suggested": "Senior Backend Engineer with 6+ years building scalable distributed systems, specializing in Node.js and PostgreSQL",
      "reasoning": "More concise, removes first-person, adds specific technologies"
    }
  ],
  "competitive_analysis": {
    "compared_to_similar_resumes": "top 15%",
    "percentile_scores": {
      "technical_depth": 85,
      "achievement_impact": 75,
      "clarity": 88
    }
  },
  "estimated_improvement_impact": {
    "implementing_critical": "+8% match rate",
    "implementing_important": "+5% match rate",
    "implementing_all": "+15% match rate"
  }
}
```

---

### AI Resume Rewrite

Get AI-generated rewrite of resume sections.

**Endpoint:** `POST /ai/resumes/:resume_id/rewrite`

**Authentication:** Required

**Request Body:**
```json
{
  "section": "experience",
  "entry_id": "exp-123",
  "target_role": "Senior Backend Engineer",
  "tone": "professional",
  "focus": "achievements"
}
```

**Tone options:** `professional`, `conversational`, `technical`, `executive`
**Focus options:** `achievements`, `skills`, `responsibilities`, `impact`

**Success Response (200 OK):**
```json
{
  "original": "Worked on backend services using Node.js. Improved performance and fixed bugs. Led a small team.",
  "rewritten": "Architected and optimized high-performance backend services using Node.js, achieving 40% reduction in API latency and improving system throughput to 10,000+ requests per second. Led cross-functional team of 5 engineers in implementing microservices architecture, resulting in 99.9% uptime and enhanced scalability.",
  "improvements": [
    "Added specific metrics and quantifiable achievements",
    "Used stronger action verbs (Architected, Optimized)",
    "Highlighted technical skills and technologies",
    "Emphasized leadership and impact",
    "More concise while adding detail"
  ],
  "changes": {
    "metrics_added": 3,
    "action_verbs_improved": 2,
    "technical_terms_added": ["microservices architecture", "API latency", "throughput"],
    "impact_highlighted": true
  }
}
```

---

### Generate Cover Letter

Generate AI-powered cover letter tailored to specific job.

**Endpoint:** `POST /ai/cover-letter/generate`

**Authentication:** Required

**Request Body:**
```json
{
  "job_id": "job-789",
  "resume_id": "resume-123",
  "tone": "professional",
  "length": "medium",
  "highlights": [
    "leadership experience",
    "technical skills",
    "cultural fit"
  ]
}
```

**Length options:** `short` (150-200 words), `medium` (250-350 words), `long` (400-500 words)

**Success Response (200 OK):**
```json
{
  "cover_letter": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior Backend Engineer position at Tech Corp. With over 6 years of experience building scalable distributed systems and a proven track record of technical leadership, I am confident I would be a valuable addition to your engineering team.\n\nIn my current role at Previous Corp, I have led the architecture and development of high-performance backend services using Node.js and PostgreSQL, technologies I see are central to this position. My team and I reduced API latency by 40% and improved system throughput to handle over 10,000 requests per second, directly contributing to improved user experience and business growth.\n\nWhat excites me most about Tech Corp is your commitment to innovation and engineering excellence. Your recent work on [specific project mentioned in job description] aligns perfectly with my experience in distributed systems and my passion for solving complex technical challenges at scale.\n\nI am particularly drawn to your emphasis on work-life balance and collaborative culture, which I believe are essential for sustainable innovation. I would welcome the opportunity to discuss how my technical expertise and leadership experience can contribute to your team's success.\n\nThank you for your consideration.\n\nSincerely,\nJohn Doe",
  "key_points_highlighted": [
    "6+ years relevant experience",
    "Specific technical skills match (Node.js, PostgreSQL)",
    "Quantifiable achievements (40% latency reduction)",
    "Cultural fit (work-life balance, collaboration)",
    "Company-specific research"
  ],
  "personalization_elements": [
    "Referenced specific technologies from job description",
    "Mentioned company values and culture",
    "Aligned experience with role requirements"
  ],
  "suggestions": [
    "Replace [specific project mentioned in job description] with actual project name from research",
    "Consider adding a specific example of leadership if you have space",
    "Customize the opening to mention if you have a referral"
  ]
}
```

---

## Interview Preparation

### Generate Interview Questions

Get AI-generated interview questions based on job and resume.

**Endpoint:** `POST /ai/interview/questions`

**Authentication:** Required

**Request Body:**
```json
{
  "job_id": "job-789",
  "resume_id": "resume-123",
  "question_types": ["technical", "behavioral", "situational"],
  "difficulty": "medium-hard",
  "count": 10
}
```

**Question types:** `technical`, `behavioral`, `situational`, `company-specific`
**Difficulty:** `easy`, `medium`, `medium-hard`, `hard`

**Success Response (200 OK):**
```json
{
  "questions": [
    {
      "id": "q-1",
      "type": "technical",
      "difficulty": "medium-hard",
      "category": "System Design",
      "question": "How would you design a scalable job queue system that can handle 10,000+ jobs per second with guaranteed processing and retry logic?",
      "why_asked": "Based on your Node.js expertise and the job's focus on high-throughput systems",
      "key_points_to_cover": [
        "Message queue selection (RabbitMQ, Kafka, SQS)",
        "Worker pool management",
        "Retry and dead letter queue handling",
        "Monitoring and observability",
        "Horizontal scaling strategy"
      ],
      "sample_answer_outline": "I would approach this by...",
      "common_mistakes": [
        "Not considering failure scenarios",
        "Overlooking monitoring and alerting"
      ]
    },
    {
      "id": "q-2",
      "type": "behavioral",
      "difficulty": "medium",
      "category": "Leadership",
      "question": "Tell me about a time when you had to lead a team through a challenging technical problem. How did you approach it?",
      "why_asked": "Job requires team leadership, matches your experience leading 5 engineers",
      "star_framework": {
        "situation": "Describe the technical challenge and team context",
        "task": "What was your responsibility?",
        "action": "Steps you took to lead the team",
        "result": "Quantifiable outcomes"
      },
      "relevant_experience_from_resume": [
        "Led team of 5 engineers at Previous Corp",
        "Implemented microservices architecture"
      ],
      "tips": [
        "Emphasize collaborative problem-solving",
        "Highlight technical decision-making process",
        "Quantify the impact of your leadership"
      ]
    },
    {
      "id": "q-3",
      "type": "situational",
      "difficulty": "medium",
      "category": "Problem Solving",
      "question": "You've deployed a new feature and suddenly API latency has increased by 200%. How do you diagnose and resolve this?",
      "why_asked": "Tests problem-solving for production issues, relevant to your API optimization experience",
      "approach": [
        "Immediate actions to mitigate user impact",
        "Diagnostic steps and tools to use",
        "Root cause analysis methodology",
        "Prevention strategies for future"
      ],
      "relevant_skills": ["Monitoring", "Debugging", "Performance optimization"]
    }
  ],
  "preparation_tips": [
    "Review your API optimization project - likely to be discussed in detail",
    "Prepare to explain your architectural decisions on microservices",
    "Be ready with specific metrics from your achievements",
    "Research Tech Corp's tech stack and recent technical blog posts"
  ],
  "company_insights": {
    "interview_process": "Typically 4-5 rounds including system design and coding",
    "common_focus_areas": ["Scalability", "Team collaboration", "System design"],
    "interview_style": "Collaborative problem-solving approach"
  }
}
```

---

### Mock Interview Feedback

Get AI feedback on interview answer.

**Endpoint:** `POST /ai/interview/feedback`

**Authentication:** Required

**Request Body:**
```json
{
  "question": "How would you design a scalable job queue system?",
  "answer": "I would use Redis as a message queue with worker processes...",
  "question_type": "technical"
}
```

**Success Response (200 OK):**
```json
{
  "overall_score": 75,
  "strengths": [
    "Clear technology choice with justification",
    "Mentioned scalability considerations",
    "Discussed monitoring"
  ],
  "improvements": [
    "Could elaborate more on failure handling",
    "Missing discussion of retry logic",
    "Should quantify scalability targets"
  ],
  "detailed_feedback": {
    "technical_accuracy": {
      "score": 80,
      "comments": "Redis is a valid choice, but consider discussing trade-offs vs. dedicated message queues"
    },
    "completeness": {
      "score": 70,
      "comments": "Answer covers main points but lacks depth in error handling"
    },
    "communication": {
      "score": 75,
      "comments": "Clear explanation, could benefit from more structure"
    }
  },
  "suggested_improvements": "Consider restructuring your answer using this framework: 1) Requirements gathering, 2) Technology selection with trade-offs, 3) Architecture design, 4) Failure scenarios, 5) Monitoring and scaling",
  "example_enhanced_answer": "I would start by clarifying requirements..."
}
```

---

## Career Insights

### Skills Gap Analysis

Identify skills gap for career goals.

**Endpoint:** `POST /ai/career/skills-gap`

**Authentication:** Required

**Request Body:**
```json
{
  "target_role": "Engineering Manager",
  "target_companies": ["Tech Corp", "Another Corp"],
  "timeframe": "1-year"
}
```

**Success Response (200 OK):**
```json
{
  "current_skills": ["Node.js", "PostgreSQL", "Team Leadership"],
  "target_role_requirements": {
    "technical_skills": ["System Architecture", "Cloud Infrastructure", "DevOps"],
    "soft_skills": ["Strategic Planning", "Budget Management", "Hiring"],
    "certifications": ["PMP", "AWS Solutions Architect"]
  },
  "skills_gap": {
    "critical": [
      {
        "skill": "Budget Management",
        "importance": "high",
        "current_level": "none",
        "target_level": "intermediate",
        "learning_resources": [
          {
            "type": "course",
            "name": "Engineering Leadership Fundamentals",
            "provider": "Coursera",
            "duration": "4 weeks"
          }
        ]
      }
    ],
    "important": [
      {
        "skill": "System Architecture",
        "importance": "high",
        "current_level": "intermediate",
        "target_level": "expert",
        "learning_path": "Gain experience through leading larger projects"
      }
    ]
  },
  "development_plan": {
    "immediate": ["Take leadership course", "Seek mentorship"],
    "short_term": ["Lead cross-functional projects", "Learn budget basics"],
    "long_term": ["Pursue PMP certification", "Build hiring experience"]
  },
  "estimated_timeline": "12-18 months to develop required skills"
}
```

---

### Salary Insights

Get AI-powered salary insights and negotiation guidance.

**Endpoint:** `POST /ai/salary/insights`

**Authentication:** Required

**Request Body:**
```json
{
  "job_title": "Senior Backend Engineer",
  "location": "San Francisco, CA",
  "years_experience": 6,
  "skills": ["Node.js", "PostgreSQL", "AWS"],
  "education": "Bachelor's",
  "company_size": "500-1000"
}
```

**Success Response (200 OK):**
```json
{
  "market_data": {
    "median_salary": 165000,
    "percentile_25": 145000,
    "percentile_75": 185000,
    "percentile_90": 210000,
    "currency": "USD",
    "period": "yearly"
  },
  "your_position": {
    "estimated_market_value": 172000,
    "percentile": 62,
    "compared_to_market": "+4% above median"
  },
  "factors_analysis": {
    "location_impact": "+25% compared to national average",
    "experience_impact": "6 years puts you in senior range",
    "skills_premium": ["Node.js +8%", "AWS +5%"],
    "education_impact": "Standard for role"
  },
  "negotiation_guidance": {
    "reasonable_range": "165k-185k",
    "strong_position_range": "175k-195k",
    "negotiation_leverage": [
      "Your skills match high-demand technologies",
      "Experience level is competitive advantage",
      "Location market is favorable"
    ],
    "negotiation_tips": [
      "Emphasize Node.js and AWS expertise",
      "Reference market data for SF Bay Area",
      "Consider total compensation including equity"
    ]
  },
  "trends": {
    "market_direction": "growing",
    "yoy_change": "+8%",
    "demand_level": "high",
    "supply_level": "moderate"
  }
}
```

---

### Career Path Recommendations

Get personalized career path suggestions.

**Endpoint:** `POST /ai/career/paths`

**Authentication:** Required

**Request Body:**
```json
{
  "current_role": "Senior Backend Engineer",
  "interests": ["leadership", "architecture"],
  "timeframe": "3-5 years"
}
```

**Success Response (200 OK):**
```json
{
  "recommended_paths": [
    {
      "role": "Engineering Manager",
      "match_score": 88,
      "timeframe": "2-3 years",
      "rationale": "Your leadership experience and team management skills align well",
      "required_skills": ["People management", "Strategic planning"],
      "development_steps": [
        "Lead larger teams (8-10 engineers)",
        "Take leadership training",
        "Manage project budgets"
      ],
      "salary_potential": "+20-30%",
      "roles_available_now": 45
    },
    {
      "role": "Staff Engineer / Technical Architect",
      "match_score": 92,
      "timeframe": "1-2 years",
      "rationale": "Strong technical skills and system design experience",
      "required_skills": ["System architecture", "Technical leadership"],
      "development_steps": [
        "Lead architectural decisions",
        "Mentor junior engineers",
        "Design large-scale systems"
      ],
      "salary_potential": "+25-35%",
      "roles_available_now": 23
    }
  ]
}
```

---

## AI Model Information

### Available Models

- **Job Matching:** GPT-4-based custom model trained on job market data
- **Resume Analysis:** Fine-tuned BERT model for resume parsing and scoring
- **Interview Questions:** GPT-4-turbo for context-aware question generation
- **Salary Insights:** Ensemble model combining market data and ML predictions

### Data Privacy

- All AI processing respects user privacy
- Data is never shared with third parties
- Models are regularly updated with latest market trends
- User data can be excluded from training upon request

---

## Error Codes

| Code | Description |
|------|-------------|
| AI001 | AI service temporarily unavailable |
| AI002 | Rate limit exceeded for AI features |
| AI003 | Invalid input for AI processing |
| AI004 | Resume not found for analysis |
| AI005 | Job not found for matching |
| AI006 | Insufficient data for analysis |
| AI007 | AI processing timeout |
| AI008 | Model inference error |
| AI009 | Invalid parameters for AI request |
| AI010 | Subscription tier insufficient for feature |

See [Error Codes](./errors.md) for complete error documentation.
