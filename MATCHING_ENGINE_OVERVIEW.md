# Interview Probability Matching Engine - Visual Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ApplyForUs Platform                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐      ┌──────────────┐       ┌──────────────┐            │
│  │  User Service│      │  Job Service │       │Resume Service│            │
│  │              │      │              │       │              │            │
│  │ • Profile    │      │ • Job Reqs   │       │ • Resume Text│            │
│  │ • Tier       │      │ • Skills     │       │ • Cover Letter│           │
│  └──────┬───────┘      └──────┬───────┘       └──────┬───────┘            │
│         │                     │                      │                     │
│         └─────────────────────┼──────────────────────┘                     │
│                               │                                            │
│                               ▼                                            │
│         ┌──────────────────────────────────────────────┐                   │
│         │    Interview Probability Matching Engine     │                   │
│         │                                              │                   │
│         │  ┌────────────────────────────────────────┐  │                   │
│         │  │    Profile Parser                      │  │                   │
│         │  │                                        │  │                   │
│         │  │  Resume → Skills, Experience, Edu...   │  │                   │
│         │  │  Cover Letter → Context                │  │                   │
│         │  │  LinkedIn → Structured Data            │  │                   │
│         │  └───────────────┬────────────────────────┘  │                   │
│         │                  │                           │                   │
│         │                  ▼                           │                   │
│         │  ┌────────────────────────────────────────┐  │                   │
│         │  │    Component Scoring (7 components)    │  │                   │
│         │  │                                        │  │                   │
│         │  │  • Skill Depth (30%)                   │  │                   │
│         │  │  • Experience Relevance (25%)          │  │                   │
│         │  │  • Seniority Match (15%)               │  │                   │
│         │  │  • Industry Fit (10%)                  │  │                   │
│         │  │  • Education Match (10%)               │  │                   │
│         │  │  • Keyword Density (5%)                │  │                   │
│         │  │  • Recency (5%)                        │  │                   │
│         │  └───────────────┬────────────────────────┘  │                   │
│         │                  │                           │                   │
│         │                  ▼                           │                   │
│         │  ┌────────────────────────────────────────┐  │                   │
│         │  │    Probability Calculation             │  │                   │
│         │  │                                        │  │                   │
│         │  │  Weighted Sum → Sigmoid → Calibration  │  │                   │
│         │  │                                        │  │                   │
│         │  │  Result: 0-100% Interview Probability  │  │                   │
│         │  └───────────────┬────────────────────────┘  │                   │
│         │                  │                           │                   │
│         │                  ▼                           │                   │
│         │  ┌────────────────────────────────────────┐  │                   │
│         │  │    Threshold Filtering                 │  │                   │
│         │  │                                        │  │                   │
│         │  │  Freemium:     ≥ 80%                   │  │                   │
│         │  │  Starter:      ≥ 70%                   │  │                   │
│         │  │  Basic:        ≥ 65%                   │  │                   │
│         │  │  Professional: ≥ 60%                   │  │                   │
│         │  │  Premium/Elite: ≥ 55% (+ human review) │  │                   │
│         │  └───────────────┬────────────────────────┘  │                   │
│         │                  │                           │                   │
│         │                  ▼                           │                   │
│         │  ┌────────────────────────────────────────┐  │                   │
│         │  │    Match Result + Explanation          │  │                   │
│         │  │                                        │  │                   │
│         │  │  • Probability score                   │  │                   │
│         │  │  • Component breakdown                 │  │                   │
│         │  │  • Strengths & gaps                    │  │                   │
│         │  │  • Recommendations                     │  │                   │
│         │  └────────────────────────────────────────┘  │                   │
│         │                                              │                   │
│         └──────────────────────────────────────────────┘                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────┐
│ User Applies │
│  to 50 Jobs  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 1: Profile Parsing                        │
│                                                  │
│  Input: Resume + Cover Letter + LinkedIn        │
│  Output: Structured Profile                     │
│  ├─ Skills: ["Python", "AWS", "Docker"]         │
│  ├─ Experience: 7 years                         │
│  ├─ Seniority: "senior"                         │
│  ├─ Education: Bachelor's (level 3)             │
│  └─ Industries: ["Technology"]                  │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 2: Score Each Job (Parallel)              │
│                                                  │
│  For each of 50 jobs:                           │
│  ┌───────────────────────────────────────────┐  │
│  │ Job 1: "Senior Python Developer"          │  │
│  │ ├─ Skill Depth: 0.90 (excellent match)    │  │
│  │ ├─ Experience: 0.95 (ideal 7 years)       │  │
│  │ ├─ Seniority: 1.00 (perfect senior→senior)│  │
│  │ ├─ Industry: 1.00 (tech→tech)             │  │
│  │ ├─ Education: 1.00 (meets req)            │  │
│  │ ├─ Keywords: 0.75                         │  │
│  │ └─ Recency: 1.00 (currently employed)     │  │
│  │                                           │  │
│  │ Weighted Score: 0.92                      │  │
│  │ → Interview Probability: 87%              │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  [Repeat for remaining 49 jobs...]              │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 3: Threshold Filtering                    │
│                                                  │
│  User Tier: Professional (60% threshold)        │
│                                                  │
│  ✓ Job 1: 87% → PASS (show + auto-apply)        │
│  ✓ Job 5: 75% → PASS                            │
│  ✓ Job 12: 68% → PASS                           │
│  ✗ Job 23: 55% → FAIL (hide)                    │
│  ✗ Job 31: 42% → FAIL                           │
│                                                  │
│  Result: 23 jobs meet threshold                 │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 4: Rank & Return Top Matches             │
│                                                  │
│  Ranked by probability (highest first):         │
│  1. Job 1: 87% - Senior Python Developer        │
│  2. Job 7: 82% - Backend Engineer               │
│  3. Job 5: 75% - DevOps Engineer                │
│  ...                                            │
│  20. Job 42: 61% - Software Engineer            │
│                                                  │
│  Return top 20 to user                          │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 5: Auto-Apply (Async)                    │
│                                                  │
│  For top 20 matches:                            │
│  - Submit application                           │
│  - Track application ID                         │
│  - Store match result                           │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 6: Track Outcomes (Over Time)            │
│                                                  │
│  Job 1 (87% predicted):                         │
│  ├─ Day 5: Interview invitation → CORRECT!      │
│  └─ Feedback: outcome=interview                 │
│                                                  │
│  Job 5 (75% predicted):                         │
│  ├─ Day 10: Rejection → INCORRECT               │
│  └─ Feedback: outcome=rejected                  │
│                                                  │
│  → Add to training data                         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Step 7: Model Retraining (Monthly)            │
│                                                  │
│  Collected 100+ feedback samples                │
│  ├─ Train ensemble models                       │
│  ├─ Evaluate: 82% accuracy ✓                    │
│  └─ Deploy improved model                       │
│                                                  │
│  → Better predictions for future matches!       │
└──────────────────────────────────────────────────┘
```

## Component Scoring Breakdown

```
┌─────────────────────────────────────────────────────────────────┐
│                    Component Scoring                            │
│                                                                 │
│  Candidate Profile          Job Requirements                   │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │ Skills:      │   VS     │ Required:    │                    │
│  │ - Python ✓   │   ════>  │ - Python     │  → Skill Depth     │
│  │ - AWS ✓      │          │ - AWS        │     Score: 0.85    │
│  │ - Docker ✓   │          │ - Docker     │     (30% weight)   │
│  │ - React      │          │              │                    │
│  └──────────────┘          └──────────────┘                    │
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │ Experience:  │   VS     │ Required:    │                    │
│  │ 7 years      │   ════>  │ 5-10 years   │  → Experience      │
│  │              │          │              │     Score: 0.95    │
│  └──────────────┘          └──────────────┘     (25% weight)   │
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │ Seniority:   │   VS     │ Level:       │                    │
│  │ Senior       │   ════>  │ Senior       │  → Seniority       │
│  │              │          │              │     Score: 1.00    │
│  └──────────────┘          └──────────────┘     (15% weight)   │
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │ Industry:    │   VS     │ Industry:    │                    │
│  │ Technology   │   ════>  │ Technology   │  → Industry Fit    │
│  │              │          │              │     Score: 1.00    │
│  └──────────────┘          └──────────────┘     (10% weight)   │
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │ Education:   │   VS     │ Required:    │                    │
│  │ Bachelor's   │   ════>  │ Bachelor's   │  → Education       │
│  │              │          │              │     Score: 1.00    │
│  └──────────────┘          └──────────────┘     (10% weight)   │
│                                                                 │
│                          ┌──────────────┐                       │
│  Resume Keywords  VS     │ Job Desc     │  → Keyword Density   │
│  Match: 45/60           │ Keywords     │     Score: 0.75      │
│                          └──────────────┘     (5% weight)      │
│                                                                 │
│  Last Role: 2020-Present                   → Recency           │
│  (Currently employed)                         Score: 1.00      │
│                                               (5% weight)      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Final Calculation:                                            │
│                                                                 │
│  Overall = (0.85×0.30) + (0.95×0.25) + (1.00×0.15) +          │
│            (1.00×0.10) + (1.00×0.10) + (0.75×0.05) +          │
│            (1.00×0.05)                                         │
│          = 0.255 + 0.238 + 0.150 + 0.100 + 0.100 +            │
│            0.038 + 0.050                                       │
│          = 0.931                                               │
│                                                                 │
│  Calibrated Probability = sigmoid(0.931) = 87%                │
│                                                                 │
│  ✓ Exceeds Professional tier threshold (60%)                  │
│  → APPROVED for auto-apply                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Subscription Tier Visual

```
┌────────────────────────────────────────────────────────────┐
│            Subscription Tier Thresholds                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  0%                                              100%      │
│  └────┬────┬────┬────┬────┬────┬────┬────┬────┬────┘      │
│       │    │    │    │    │    │    │    │    │           │
│       50   55   60   65   70   75   80   85   90          │
│       │    │    │    │    │    │    │    │                │
│       │    └─────┴────┘    │    │    └────┘               │
│       │     Premium/Elite  │    │    Freemium             │
│       │         (55%)      │    │     (80%)               │
│       │                    │    └─ Starter (70%)          │
│       │                    └─ Basic (65%)                 │
│       └─ Professional (60%)                               │
│                                                            │
│  Example: Job with 72% probability                        │
│  ┌──────────────────────────────────────────────────┐     │
│  │  0%        55  60  65  70 [72] 80         100%   │     │
│  │  └─────────┬───┬───┬───┬───●───┬───────────┘     │     │
│  │            │   │   │   │   │   │                 │     │
│  │            │   │   │   │   ✓   ✓                 │     │
│  │            │   │   │   ✓                         │     │
│  │            │   │   ✓                             │     │
│  │            │   ✓                                 │     │
│  │            ✓                                     │     │
│  │                                                  │     │
│  │  Who sees it:                                    │     │
│  │  ✓ Premium/Elite (55%+)                         │     │
│  │  ✓ Professional (60%+)                          │     │
│  │  ✓ Basic (65%+)                                 │     │
│  │  ✓ Starter (70%+)                               │     │
│  │  ✗ Freemium (80%+) - Hidden                     │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────┘
```

## Machine Learning Pipeline

```
┌────────────────────────────────────────────────────────────────┐
│                    ML Training Pipeline                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  1. Data Collection                                           │
│  ┌──────────────────────────────────────────────┐             │
│  │  Application Outcomes                        │             │
│  │  ├─ Match ID                                 │             │
│  │  ├─ Predicted Probability: 72%               │             │
│  │  ├─ Actual Outcome: INTERVIEW ✓              │             │
│  │  ├─ Features:                                │             │
│  │  │  • skill_overlap: 0.85                    │             │
│  │  │  • experience_years: 7                    │             │
│  │  │  • seniority_gap: 0                       │             │
│  │  │  • industry_match: true                   │             │
│  │  │  • ... (11 total features)                │             │
│  │  └─ Weight: 1.0 (recent = higher)            │             │
│  └──────────────────────────────────────────────┘             │
│                          │                                     │
│                          ▼                                     │
│  2. Feature Engineering                                       │
│  ┌──────────────────────────────────────────────┐             │
│  │  Convert to ML Features                      │             │
│  │  ├─ Normalize: experience_years / 20         │             │
│  │  ├─ Encode: boolean → 0/1                    │             │
│  │  ├─ Scale: StandardScaler                    │             │
│  │  └─ Target: rejected=0, interview=0.5,       │             │
│  │             offer=1.0                         │             │
│  └──────────────────────────────────────────────┘             │
│                          │                                     │
│                          ▼                                     │
│  3. Model Training (Ensemble)                                 │
│  ┌──────────────────────────────────────────────┐             │
│  │  Train 3 Models:                             │             │
│  │  ┌────────────────────────────────────────┐  │             │
│  │  │ Gradient Boosting                      │  │             │
│  │  │ • Captures complex patterns            │  │             │
│  │  │ • High accuracy                        │  │             │
│  │  └────────────────────────────────────────┘  │             │
│  │  ┌────────────────────────────────────────┐  │             │
│  │  │ Random Forest                          │  │             │
│  │  │ • Robust to outliers                   │  │             │
│  │  │ • Feature importance                   │  │             │
│  │  └────────────────────────────────────────┘  │             │
│  │  ┌────────────────────────────────────────┐  │             │
│  │  │ Logistic Regression                    │  │             │
│  │  │ • Baseline model                       │  │             │
│  │  │ • Interpretable                        │  │             │
│  │  └────────────────────────────────────────┘  │             │
│  └──────────────────────────────────────────────┘             │
│                          │                                     │
│                          ▼                                     │
│  4. Evaluation                                                │
│  ┌──────────────────────────────────────────────┐             │
│  │  Performance Metrics:                        │             │
│  │  ├─ Accuracy: 82%                            │             │
│  │  ├─ AUC-ROC: 0.78                            │             │
│  │  ├─ Calibration Error: 0.08                  │             │
│  │  └─ Brier Score: 0.15                        │             │
│  │                                              │             │
│  │  Feature Importance:                         │             │
│  │  1. skill_overlap (0.35)                     │             │
│  │  2. experience_years (0.28)                  │             │
│  │  3. seniority_gap (0.15)                     │             │
│  └──────────────────────────────────────────────┘             │
│                          │                                     │
│                          ▼                                     │
│  5. Deployment                                                │
│  ┌──────────────────────────────────────────────┐             │
│  │  Use Ensemble Prediction:                    │             │
│  │  P(interview) = avg(GB, RF, LR)              │             │
│  │               = (0.75 + 0.72 + 0.70) / 3     │             │
│  │               = 0.72 (72%)                   │             │
│  └──────────────────────────────────────────────┘             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Real Example: Senior Engineer Job

```
┌──────────────────────────────────────────────────────────────────┐
│  Real-World Example: Matching a Senior Engineer                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Candidate Profile:                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ John Doe                                                   │  │
│  │ Senior Software Engineer                                   │  │
│  │                                                            │  │
│  │ Skills: Python, JavaScript, AWS, Docker, PostgreSQL,       │  │
│  │         React, Redis, Kubernetes                           │  │
│  │ Experience: 7 years (2017-2024)                           │  │
│  │ Current: Senior Engineer at Tech Startup                   │  │
│  │ Previous: Engineer at Enterprise Corp (3 years)            │  │
│  │ Education: BS Computer Science, MIT (2017)                 │  │
│  │ Industry: Technology, SaaS                                 │  │
│  │ Certifications: AWS Certified Solutions Architect          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Job Posting:                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Senior Backend Engineer                                    │  │
│  │ TechCo - San Francisco, CA (Remote OK)                    │  │
│  │                                                            │  │
│  │ Requirements:                                              │  │
│  │ • 5-10 years backend development                          │  │
│  │ • Expert in Python                                        │  │
│  │ • AWS cloud experience                                    │  │
│  │ • Docker & containerization                               │  │
│  │ • PostgreSQL or similar SQL database                      │  │
│  │ • BS in Computer Science or equivalent                    │  │
│  │                                                            │  │
│  │ Nice to have:                                              │  │
│  │ • Kubernetes                                              │  │
│  │ • React or frontend experience                            │  │
│  │ • SaaS industry background                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Matching Analysis:                                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ Component Scores:                                          │  │
│  │                                                            │  │
│  │ 1. Skill Depth (30%)                        Score: 0.90   │  │
│  │    Required: Python ✓, AWS ✓, Docker ✓, SQL ✓            │  │
│  │    Match: 4/4 required (100%)                             │  │
│  │    Preferred: Kubernetes ✓, React ✓                       │  │
│  │    Match: 2/2 preferred (100%)                            │  │
│  │    Depth: Recent mentions in experience = HIGH            │  │
│  │                                                            │  │
│  │ 2. Experience Relevance (25%)               Score: 0.95   │  │
│  │    Candidate: 7 years                                     │  │
│  │    Required: 5-10 years                                   │  │
│  │    Perfect fit within range ✓                             │  │
│  │                                                            │  │
│  │ 3. Seniority Match (15%)                    Score: 1.00   │  │
│  │    Candidate: Senior                                      │  │
│  │    Job: Senior                                            │  │
│  │    Exact match ✓                                          │  │
│  │                                                            │  │
│  │ 4. Industry Fit (10%)                       Score: 1.00   │  │
│  │    Candidate: Technology, SaaS                            │  │
│  │    Job: Technology                                        │  │
│  │    Direct match ✓                                         │  │
│  │                                                            │  │
│  │ 5. Education Match (10%)                    Score: 1.00   │  │
│  │    Candidate: BS Computer Science (MIT)                   │  │
│  │    Required: BS Computer Science                          │  │
│  │    Perfect match + prestigious school ✓                   │  │
│  │                                                            │  │
│  │ 6. Keyword Density (5%)                     Score: 0.82   │  │
│  │    Resume keywords match 82% of job description           │  │
│  │                                                            │  │
│  │ 7. Recency (5%)                             Score: 1.00   │  │
│  │    Currently employed in relevant role ✓                  │  │
│  │                                                            │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Overall Score Calculation:                                │  │
│  │                                                            │  │
│  │ (0.90 × 0.30) + (0.95 × 0.25) + (1.00 × 0.15) +          │  │
│  │ (1.00 × 0.10) + (1.00 × 0.10) + (0.82 × 0.05) +          │  │
│  │ (1.00 × 0.05)                                             │  │
│  │                                                            │  │
│  │ = 0.270 + 0.238 + 0.150 + 0.100 + 0.100 + 0.041 + 0.050  │  │
│  │ = 0.949                                                   │  │
│  │                                                            │  │
│  │ Interview Probability: 91%                                │  │
│  │ Offer Probability: 23%                                    │  │
│  │                                                            │  │
│  ├────────────────────────────────────────────────────────────┤  │
│  │ Result:                                                   │  │
│  │                                                            │  │
│  │ ✓ APPROVED for all tiers (exceeds 80% Freemium threshold)│  │
│  │ ✓ AUTO-APPLY enabled                                      │  │
│  │                                                            │  │
│  │ Strengths:                                                │  │
│  │  • Excellent skill match with deep expertise              │  │
│  │  • Experience level is ideal for this role                │  │
│  │  • Perfect seniority level alignment                      │  │
│  │  • Direct industry experience                             │  │
│  │                                                            │  │
│  │ Gaps: None identified                                     │  │
│  │                                                            │  │
│  │ Recommendations:                                          │  │
│  │  • Apply immediately - this is an excellent match         │  │
│  │  • Highlight your AWS and Docker expertise               │  │
│  │  • Mention your SaaS industry background                  │  │
│  │  • Emphasize leadership and mentoring experience          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

This visual overview provides a complete picture of how the Interview Probability Matching Engine works, from data input through scoring, filtering, and continuous learning.
