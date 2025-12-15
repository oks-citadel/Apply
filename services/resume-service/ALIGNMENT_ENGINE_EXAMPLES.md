# Resume & Cover Letter Alignment Engine - Examples

## Table of Contents
1. [Basic Resume Analysis](#basic-resume-analysis)
2. [Generate Aligned Resume](#generate-aligned-resume)
3. [Generate Cover Letter](#generate-cover-letter)
4. [Get Alignment Explanation](#get-alignment-explanation)
5. [Get Improvement Suggestions](#get-improvement-suggestions)
6. [Complete Application Flow](#complete-application-flow)

---

## Basic Resume Analysis

Analyze how well a resume matches a job before applying.

### Request
```bash
POST /api/v1/alignment/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "jobTitle": "Senior Full Stack Developer",
  "companyName": "TechCorp Inc."
}
```

### Response
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "userId": "440e8400-e29b-41d4-a716-446655440003",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "baseResumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobTitle": "Senior Full Stack Developer",
  "companyName": "TechCorp Inc.",
  "overallMatchScore": 85.5,

  "skillGapAnalysis": {
    "matchedSkills": [
      {
        "skill": "React",
        "source": "resume",
        "proficiency": "Expert",
        "yearsClaimed": 5
      },
      {
        "skill": "Node.js",
        "source": "resume",
        "proficiency": "Advanced",
        "yearsClaimed": 4
      },
      {
        "skill": "TypeScript",
        "source": "resume",
        "proficiency": "Advanced",
        "yearsClaimed": 3
      }
    ],
    "missingSkills": [
      {
        "skill": "AWS Lambda",
        "importance": "required",
        "category": "cloud",
        "learnability": "moderate"
      },
      {
        "skill": "GraphQL",
        "importance": "preferred",
        "category": "technical",
        "learnability": "easy"
      }
    ],
    "transferableSkills": [
      {
        "skill": "REST API Design",
        "relatedTo": ["GraphQL", "API Development"],
        "explanation": "Experience with REST APIs transfers well to GraphQL"
      }
    ]
  },

  "experienceAlignment": {
    "relevantExperiences": [
      {
        "experienceId": "exp-001",
        "company": "StartupXYZ",
        "position": "Lead Developer",
        "relevanceScore": 92,
        "matchingResponsibilities": [
          "Built and maintained React applications",
          "Led team of 5 developers",
          "Designed scalable architectures"
        ],
        "matchingAchievements": [
          "Reduced load time by 40%",
          "Implemented CI/CD pipeline"
        ]
      }
    ],
    "yearsOfRelevantExperience": 6,
    "seniority": "senior",
    "industryMatch": true,
    "roleTypeMatch": true
  },

  "keywordAnalysis": {
    "presentKeywords": [
      {
        "keyword": "React",
        "frequency": 8,
        "context": ["experience", "skills", "projects"],
        "importance": "high"
      },
      {
        "keyword": "microservices",
        "frequency": 3,
        "context": ["experience"],
        "importance": "high"
      }
    ],
    "missingKeywords": [
      {
        "keyword": "serverless",
        "importance": "important",
        "suggestedPlacement": ["summary", "experience"]
      },
      {
        "keyword": "containerization",
        "importance": "critical",
        "suggestedPlacement": ["skills", "experience"]
      }
    ],
    "atsCompatibility": {
      "score": 88,
      "issues": [
        "Missing some required keywords in summary",
        "Could benefit from more quantified achievements"
      ],
      "suggestions": [
        "Add 'AWS', 'Docker', 'Kubernetes' to skills section",
        "Quantify achievements with metrics (e.g., '40% improvement')",
        "Include years of experience with key technologies"
      ]
    }
  },

  "improvementSuggestions": {
    "skillGaps": [
      {
        "skill": "AWS Lambda",
        "priority": "high",
        "learningResources": [
          "AWS Lambda Developer Guide",
          "Serverless Framework Tutorial"
        ],
        "estimatedTimeToLearn": "2-3 weeks"
      },
      {
        "skill": "GraphQL",
        "priority": "medium",
        "learningResources": [
          "How to GraphQL",
          "Apollo GraphQL Tutorial"
        ],
        "estimatedTimeToLearn": "1-2 weeks"
      }
    ],
    "experienceGaps": [],
    "certificationSuggestions": [
      {
        "certification": "AWS Certified Developer",
        "relevance": 95,
        "provider": "Amazon Web Services",
        "estimatedCost": "$150"
      }
    ],
    "resumeImprovements": [
      {
        "improvement": "Add AWS Lambda experience if you have it",
        "impact": "high",
        "effort": "easy"
      },
      {
        "improvement": "Quantify all achievements with metrics",
        "impact": "high",
        "effort": "moderate"
      },
      {
        "improvement": "Add Docker/Kubernetes to skills section",
        "impact": "medium",
        "effort": "easy"
      }
    ]
  },

  "skillMatchPercentage": 88.0,
  "experienceMatchPercentage": 92.0,
  "educationMatchPercentage": 100.0,
  "certificationMatchPercentage": 70.0,

  "matchExplanation": "You are a strong fit for this Senior Full Stack Developer role. Your extensive React and Node.js experience aligns perfectly with the requirements, and your leadership experience at StartupXYZ demonstrates the seniority level they're seeking. Your main gap is in serverless technologies (AWS Lambda), but your strong foundation in cloud architecture makes this easily learnable. Consider getting AWS certification to strengthen your profile.",

  "strengths": [
    "5+ years of React experience",
    "Strong Node.js and TypeScript background",
    "Proven leadership experience",
    "Track record of performance optimization",
    "Experience with CI/CD pipelines"
  ],

  "weaknesses": [
    "No AWS Lambda experience mentioned",
    "Missing GraphQL exposure",
    "Limited serverless architecture examples"
  ],

  "recommendation": "strong-fit",
  "createdAt": "2024-12-15T10:30:00Z"
}
```

### Analysis Interpretation

**Overall Score: 85.5/100** - Strong Fit
- ✅ Skill Match: 88% - Excellent technical alignment
- ✅ Experience Match: 92% - Very relevant experience
- ⚠️ Missing Skills: AWS Lambda, GraphQL (learnable)
- ✅ Seniority: Senior level matches requirement

**Recommendation**: Apply! You're a strong candidate.

**Action Items**:
1. Take a quick AWS Lambda tutorial (2-3 hours)
2. Mention any serverless exposure in experience
3. Get AWS Developer certification ($150, 2-3 weeks study)

---

## Generate Aligned Resume

Create a job-specific optimized resume.

### Request
```bash
POST /api/v1/alignment/resume
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "jobTitle": "Senior Full Stack Developer",
  "companyName": "TechCorp Inc.",
  "playbookRegion": "united-states",
  "applyAtsOptimization": true,
  "title": "Resume for Senior Full Stack Developer at TechCorp"
}
```

### Response
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440004",
  "userId": "440e8400-e29b-41d4-a716-446655440003",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "baseResumeId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Resume for Senior Full Stack Developer at TechCorp",

  "content": {
    "personalInfo": {
      "fullName": "John Developer",
      "email": "john@example.com",
      "phone": "+1-555-0123",
      "linkedin": "linkedin.com/in/johndeveloper",
      "github": "github.com/johndev"
    },

    "summary": "Senior Full Stack Developer with 6+ years of experience building scalable web applications using React, Node.js, and cloud technologies. Proven track record of leading development teams and delivering high-performance solutions. Expertise in microservices architecture, CI/CD implementation, and agile methodologies. Seeking to leverage technical leadership and full-stack expertise to drive innovation at TechCorp.",

    "experience": [
      {
        "id": "exp-001",
        "company": "StartupXYZ",
        "position": "Lead Full Stack Developer",
        "location": "San Francisco, CA",
        "startDate": "2020-01",
        "current": true,
        "description": "Lead development of React-based customer portal serving 50K+ users, utilizing Node.js microservices architecture and AWS cloud infrastructure. Implemented CI/CD pipelines reducing deployment time by 60%. Mentor team of 5 developers in modern JavaScript frameworks and cloud-native development practices.",
        "achievements": [
          "Architected and deployed microservices platform reducing API response time by 40%",
          "Led migration to React 18 and TypeScript, improving code maintainability",
          "Implemented Docker containerization and Kubernetes orchestration for 99.9% uptime",
          "Established code review processes and testing standards increasing code quality by 35%"
        ],
        "highlighted": true,
        "relevanceScore": 95
      },
      {
        "id": "exp-002",
        "company": "WebAgency Inc",
        "position": "Full Stack Developer",
        "location": "Austin, TX",
        "startDate": "2018-06",
        "endDate": "2019-12",
        "description": "Developed and maintained full-stack web applications using React, Node.js, and MongoDB. Collaborated with designers and product managers in agile environment to deliver customer-focused solutions.",
        "achievements": [
          "Built e-commerce platform processing $2M+ annual revenue using React and Stripe",
          "Optimized database queries reducing page load times by 50%",
          "Implemented RESTful APIs serving 10K+ daily active users"
        ],
        "highlighted": true,
        "relevanceScore": 88
      }
    ],

    "skills": {
      "technical": [
        "React",
        "Node.js",
        "TypeScript",
        "JavaScript (ES6+)",
        "HTML5/CSS3",
        "Redux",
        "Next.js"
      ],
      "tools": [
        "Git",
        "Docker",
        "Kubernetes",
        "AWS (EC2, S3, Lambda)",
        "Jenkins",
        "Jest",
        "MongoDB",
        "PostgreSQL"
      ],
      "soft": [
        "Team Leadership",
        "Agile/Scrum",
        "Code Review",
        "Technical Mentoring",
        "Problem Solving"
      ],
      "matched": [
        "React",
        "Node.js",
        "TypeScript",
        "Docker",
        "Kubernetes",
        "Microservices",
        "AWS"
      ],
      "missing": [
        "GraphQL",
        "AWS Lambda (serverless)"
      ]
    },

    "education": [
      {
        "institution": "University of California",
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "endDate": "2018-05",
        "gpa": "3.8"
      }
    ],

    "certifications": [
      {
        "name": "AWS Certified Developer - Associate",
        "issuer": "Amazon Web Services",
        "date": "2023-06"
      }
    ],

    "projects": [
      {
        "name": "Open Source Contribution - React Testing Library",
        "description": "Core contributor to popular testing library with 15M+ weekly downloads",
        "technologies": ["React", "JavaScript", "Jest"],
        "github": "github.com/testing-library/react-testing-library"
      }
    ]
  },

  "alignmentMetadata": {
    "targetJobTitle": "Senior Full Stack Developer",
    "targetCompany": "TechCorp Inc.",
    "requiredSkills": [
      "React",
      "Node.js",
      "TypeScript",
      "AWS",
      "Docker",
      "Microservices"
    ],
    "preferredSkills": [
      "GraphQL",
      "Kubernetes",
      "CI/CD"
    ],
    "keywords": [
      "full-stack",
      "React",
      "Node.js",
      "microservices",
      "cloud",
      "leadership",
      "agile"
    ],
    "atsOptimizationApplied": true,
    "playbookRegion": "united-states",
    "playbookApplied": true
  },

  "matchScore": 88.5,
  "atsScore": 92.0,
  "skillMatchScore": 90.0,
  "experienceMatchScore": 95.0,
  "keywordDensity": 85.0,
  "isActive": true,
  "createdAt": "2024-12-15T10:35:00Z",
  "updatedAt": "2024-12-15T10:35:00Z"
}
```

### Changes Made

**Summary**:
- ✏️ Added "cloud technologies" (keyword optimization)
- ✏️ Mentioned "TechCorp" to show specific interest
- ✏️ Emphasized "microservices" and "CI/CD" (job requirements)

**Experience Section**:
- 🔄 Reordered to prioritize most relevant role first
- ✏️ Rewrote descriptions to include AWS, Docker, Kubernetes (keywords)
- ➕ Added quantified metrics (40% improvement, 99.9% uptime)
- ⭐ Marked top 2 experiences as "highlighted"

**Skills Section**:
- ➕ Added "matched" skills list showing alignment
- ➕ Added "missing" skills list for transparency
- 🔄 Reordered to show most relevant skills first

---

## Generate Cover Letter

Create a tailored cover letter for the application.

### Request
```bash
POST /api/v1/alignment/cover-letter
Authorization: Bearer <token>
Content-Type: application/json

{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "alignedResumeId": "880e8400-e29b-41d4-a716-446655440004",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "jobTitle": "Senior Full Stack Developer",
  "companyName": "TechCorp Inc.",
  "hiringManager": "Sarah Johnson",
  "tone": "professional",
  "style": "modern",
  "playbookRegion": "united-states",
  "title": "Cover Letter for Senior Full Stack Developer at TechCorp"
}
```

### Response
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440005",
  "userId": "440e8400-e29b-41d4-a716-446655440003",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "alignedResumeId": "880e8400-e29b-41d4-a716-446655440004",
  "baseResumeId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Cover Letter for Senior Full Stack Developer at TechCorp",

  "content": "Dear Sarah Johnson,\n\nI am writing to express my strong interest in the Senior Full Stack Developer position at TechCorp Inc. With over 6 years of experience building scalable web applications using React and Node.js, combined with proven leadership in cloud-native development, I am excited about the opportunity to contribute to your innovative engineering team.\n\nIn my current role as Lead Full Stack Developer at StartupXYZ, I have architected and deployed microservices platforms that reduced API response times by 40% while serving over 50,000 users. My expertise in React, TypeScript, and AWS cloud infrastructure directly aligns with TechCorp's technology stack. I successfully led our migration to containerized deployments using Docker and Kubernetes, achieving 99.9% uptime and reducing deployment cycles by 60%. These accomplishments demonstrate my ability to deliver high-performance solutions at scale—a core requirement for this role.\n\nWhat particularly excites me about TechCorp is your commitment to technical excellence and innovation in [industry]. I am impressed by [specific project or achievement from research], and I see tremendous potential to apply my experience in microservices architecture and team leadership to help achieve your ambitious goals. My track record of mentoring development teams and establishing engineering best practices would enable me to make immediate contributions while continuing to grow as a technical leader.\n\nI am eager to discuss how my skills and experience align with TechCorp's needs. Thank you for considering my application. I look forward to the opportunity to speak with you.\n\nSincerely,\nJohn Developer",

  "contentHtml": "<p>Dear Sarah Johnson,</p>\n<p>I am writing to express my strong interest in the Senior Full Stack Developer position at TechCorp Inc. With over 6 years of experience building scalable web applications using React and Node.js, combined with proven leadership in cloud-native development, I am excited about the opportunity to contribute to your innovative engineering team.</p>\n<p>In my current role as Lead Full Stack Developer at StartupXYZ, I have architected and deployed microservices platforms that reduced API response times by 40% while serving over 50,000 users. My expertise in React, TypeScript, and AWS cloud infrastructure directly aligns with TechCorp's technology stack. I successfully led our migration to containerized deployments using Docker and Kubernetes, achieving 99.9% uptime and reducing deployment cycles by 60%. These accomplishments demonstrate my ability to deliver high-performance solutions at scale—a core requirement for this role.</p>\n<p>What particularly excites me about TechCorp is your commitment to technical excellence and innovation in [industry]. I am impressed by [specific project or achievement from research], and I see tremendous potential to apply my experience in microservices architecture and team leadership to help achieve your ambitious goals. My track record of mentoring development teams and establishing engineering best practices would enable me to make immediate contributions while continuing to grow as a technical leader.</p>\n<p>I am eager to discuss how my skills and experience align with TechCorp's needs. Thank you for considering my application. I look forward to the opportunity to speak with you.</p>\n<p>Sincerely,<br>John Developer</p>",

  "metadata": {
    "targetJobTitle": "Senior Full Stack Developer",
    "targetCompany": "TechCorp Inc.",
    "targetHiringManager": "Sarah Johnson",
    "tone": "professional",
    "style": "modern",
    "playbookRegion": "united-states",
    "keyPointsHighlighted": [
      "6 years of React and Node.js experience",
      "Reduced API response time by 40%",
      "Led migration to containerized deployments",
      "Achieved 99.9% uptime",
      "Track record of mentoring teams"
    ],
    "skillsEmphasized": [
      "React",
      "Node.js",
      "TypeScript",
      "AWS",
      "Docker",
      "Kubernetes",
      "Microservices",
      "Team Leadership"
    ]
  },

  "relevanceScore": 92.0,
  "toneAppropriateness": 95.0,
  "wordCount": 287,
  "isActive": true,
  "createdAt": "2024-12-15T10:40:00Z",
  "updatedAt": "2024-12-15T10:40:00Z"
}
```

### Cover Letter Analysis

**Strengths**:
- ✅ Personalized to hiring manager
- ✅ References specific achievements with metrics
- ✅ Connects experience to job requirements
- ✅ Shows company research
- ✅ Professional tone throughout
- ✅ Optimal length (287 words)

**Key Points**:
1. Opens with relevant experience summary
2. Provides specific examples with quantified results
3. Demonstrates company knowledge
4. Shows enthusiasm for role
5. Clear call to action

---

## Get Alignment Explanation

Understand what changes were made and why.

### Request
```bash
GET /api/v1/alignment/explain/770e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <token>
```

### Response
```json
{
  "analysis": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "overallMatchScore": 85.5,
    "recommendation": "strong-fit"
  },

  "alignmentChanges": {
    "sectionsReordered": [
      {
        "section": "experience",
        "oldPosition": 2,
        "newPosition": 1,
        "reason": "StartupXYZ experience most relevant to Senior Full Stack role"
      }
    ],

    "contentRewritten": [
      {
        "section": "summary",
        "originalText": "Experienced Full Stack Developer with strong React and Node.js skills",
        "rewrittenText": "Senior Full Stack Developer with 6+ years of experience building scalable web applications using React, Node.js, and cloud technologies",
        "reason": "Added seniority level, years of experience, and cloud technologies to match job requirements",
        "improvementType": "keyword-optimization"
      },
      {
        "section": "experience",
        "itemId": "exp-001",
        "originalText": "Lead development of customer portal using React and Node.js",
        "rewrittenText": "Lead development of React-based customer portal serving 50K+ users, utilizing Node.js microservices architecture and AWS cloud infrastructure",
        "reason": "Added quantified metrics and emphasized microservices/AWS keywords",
        "improvementType": "quantification"
      }
    ],

    "itemsHighlighted": [
      {
        "section": "experience",
        "itemId": "exp-001",
        "reason": "Highest relevance score (95%) for Senior Full Stack Developer role"
      },
      {
        "section": "experience",
        "itemId": "exp-002",
        "reason": "Strong relevance (88%) and demonstrates full-stack breadth"
      }
    ],

    "keywordsAdded": [
      {
        "keyword": "microservices",
        "location": "experience[0].description",
        "natural": true
      },
      {
        "keyword": "cloud technologies",
        "location": "summary",
        "natural": true
      },
      {
        "keyword": "AWS",
        "location": "experience[0].description",
        "natural": true
      }
    ]
  },

  "beforeAfter": {
    "original": {
      "summary": "Experienced Full Stack Developer with strong React and Node.js skills. Proven track record in building web applications.",
      "experience": [
        {
          "company": "WebAgency Inc",
          "description": "Developed web applications using React and Node.js"
        },
        {
          "company": "StartupXYZ",
          "description": "Lead development of customer portal using React and Node.js"
        }
      ]
    },
    "aligned": {
      "summary": "Senior Full Stack Developer with 6+ years of experience building scalable web applications using React, Node.js, and cloud technologies. Proven track record of leading development teams and delivering high-performance solutions.",
      "experience": [
        {
          "company": "StartupXYZ",
          "description": "Lead development of React-based customer portal serving 50K+ users, utilizing Node.js microservices architecture and AWS cloud infrastructure",
          "highlighted": true,
          "relevanceScore": 95
        },
        {
          "company": "WebAgency Inc",
          "description": "Developed and maintained full-stack web applications using React, Node.js, and MongoDB",
          "highlighted": true,
          "relevanceScore": 88
        }
      ]
    }
  },

  "changeExplanations": [
    {
      "change": "Reordered experience section to prioritize StartupXYZ role",
      "impact": "Increased relevance score by 12% - this role best demonstrates senior-level full-stack capabilities required"
    },
    {
      "change": "Enhanced summary with 'cloud technologies' and '6+ years'",
      "impact": "Better ATS keyword matching and explicit seniority indication"
    },
    {
      "change": "Added quantified metrics (50K+ users, 40% improvement)",
      "impact": "Provides concrete evidence of impact and scale of work"
    },
    {
      "change": "Incorporated 'microservices' and 'AWS' into experience descriptions",
      "impact": "Aligns with job's required technical stack while remaining truthful"
    },
    {
      "change": "Highlighted top 2 most relevant experiences",
      "impact": "Draws recruiter attention to strongest qualifications first"
    }
  ]
}
```

---

## Get Improvement Suggestions

Get personalized career development recommendations.

### Request
```bash
GET /api/v1/alignment/suggestions/440e8400-e29b-41d4-a716-446655440003
Authorization: Bearer <token>
```

### Response
```json
[
  {
    "skill": "AWS Lambda",
    "occurrences": 8,
    "priority": "high",
    "context": "Required or preferred in 8 recent job applications",
    "recommendation": "This skill appears frequently in jobs you're targeting. Consider taking AWS Lambda course and building a sample serverless project.",
    "resources": [
      {
        "title": "AWS Lambda Developer Guide",
        "type": "documentation",
        "url": "https://docs.aws.amazon.com/lambda/"
      },
      {
        "title": "Build a Serverless App with AWS Lambda",
        "type": "tutorial",
        "provider": "AWS Training",
        "duration": "4 hours"
      }
    ],
    "estimatedImpact": "Would increase match score by 5-10% for serverless roles"
  },
  {
    "skill": "GraphQL",
    "occurrences": 5,
    "priority": "high",
    "context": "Preferred skill in 5 recent applications",
    "recommendation": "GraphQL is becoming standard for API development. Your REST API experience transfers well - quick to learn.",
    "resources": [
      {
        "title": "How to GraphQL",
        "type": "tutorial",
        "url": "https://www.howtographql.com/"
      },
      {
        "title": "GraphQL with React and Apollo",
        "type": "course",
        "provider": "Frontend Masters",
        "duration": "6 hours"
      }
    ],
    "estimatedImpact": "Would increase match score by 3-7% and open more opportunities"
  },
  {
    "skill": "Kubernetes",
    "occurrences": 4,
    "priority": "medium",
    "context": "Required in 4 senior-level positions",
    "recommendation": "You have Docker experience. Kubernetes is the natural next step for container orchestration at scale.",
    "resources": [
      {
        "title": "Certified Kubernetes Administrator (CKA)",
        "type": "certification",
        "provider": "CNCF",
        "cost": "$300",
        "duration": "3-4 weeks study"
      }
    ],
    "estimatedImpact": "Certification would significantly strengthen DevOps capabilities"
  },
  {
    "skill": "TypeScript",
    "occurrences": 7,
    "priority": "completed",
    "context": "You already have this skill! Keep emphasizing it.",
    "recommendation": "TypeScript appears in most jobs you're targeting and you already have 3 years experience. Make sure it's prominent in your summary."
  }
]
```

---

## Complete Application Flow

End-to-end example of using the alignment engine for a job application.

### Step 1: Analyze Fit
```bash
# First, check if it's worth applying
POST /api/v1/alignment/analyze
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "660e8400-e29b-41d4-a716-446655440001"
}

# Response: overallMatchScore: 85.5, recommendation: "strong-fit"
# Decision: Yes, apply!
```

### Step 2: Generate Aligned Resume
```bash
# Create job-specific resume
POST /api/v1/alignment/resume
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "playbookRegion": "united-states",
  "applyAtsOptimization": true
}

# Response: alignedResumeId: "880e8400-e29b-41d4-a716-446655440004"
```

### Step 3: Generate Cover Letter
```bash
# Create tailored cover letter
POST /api/v1/alignment/cover-letter
{
  "resumeId": "550e8400-e29b-41d4-a716-446655440000",
  "alignedResumeId": "880e8400-e29b-41d4-a716-446655440004",
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "tone": "professional",
  "style": "modern"
}

# Response: coverLetterId: "990e8400-e29b-41d4-a716-446655440005"
```

### Step 4: Review Changes
```bash
# Understand what was optimized
GET /api/v1/alignment/explain/770e8400-e29b-41d4-a716-446655440002

# Review before/after comparison
# Verify all changes are truthful
# Make any manual adjustments if needed
```

### Step 5: Download Documents
```bash
# Export aligned resume as PDF
GET /api/v1/export/resume/880e8400-e29b-41d4-a716-446655440004?format=pdf

# Export cover letter as PDF
GET /api/v1/export/cover-letter/990e8400-e29b-41d4-a716-446655440005?format=pdf
```

### Step 6: Submit Application
```bash
# Use the exported documents to apply
# Track application in the system
POST /api/v1/applications
{
  "jobId": "660e8400-e29b-41d4-a716-446655440001",
  "resumeId": "880e8400-e29b-41d4-a716-446655440004",
  "coverLetterId": "990e8400-e29b-41d4-a716-446655440005",
  "status": "submitted"
}
```

### Step 7: Track & Improve
```bash
# After several applications, check improvement suggestions
GET /api/v1/alignment/suggestions/440e8400-e29b-41d4-a716-446655440003

# See patterns in skill gaps
# Plan learning roadmap
# Build missing skills
```

---

## Best Practices

1. **Always Analyze First**: Run analysis before generating aligned resume to understand fit
2. **Review All Changes**: Never submit without reviewing what was changed
3. **Verify Truthfulness**: Ensure no fabricated information
4. **Customize Further**: Use alignment as starting point, add personal touches
5. **Track Results**: Monitor which aligned resumes get responses
6. **Learn & Improve**: Use suggestions to develop missing skills
7. **Regional Awareness**: Always use appropriate playbook for job location
8. **ATS Optimization**: Enable for large companies, consider disabling for startups
9. **Save Variations**: Keep multiple aligned versions for different job types
10. **Iterate**: Based on results, refine base resume for better future alignments
