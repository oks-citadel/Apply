# Architecture Design for 50 AI Job Search Features

## Executive Summary

This document outlines the architecture to support all 50 AI-powered job search and application features for the JobPilot platform. The design leverages the existing microservices architecture while introducing new capabilities through modular extensions.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile App (React Native)  │  Chrome Extension       │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                         API GATEWAY / INGRESS                                │
│  • Rate Limiting • Auth • Routing • Load Balancing • SSL Termination        │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    Orchestrator Service                               │   │
│  │  • Workflow Engine • Saga Pattern • Circuit Breaker • Task Queue     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                        CORE SERVICES LAYER                                   │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ Auth Service │ User Service │ Job Service  │Resume Service│ Notification   │
│              │              │              │              │ Service        │
├──────────────┼──────────────┼──────────────┼──────────────┼────────────────┤
│ Auto-Apply   │ Analytics    │ AI Service   │ Employer     │ Interview      │
│ Service      │ Service      │ (Python)     │ Service (NEW)│ Service (NEW)  │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                        AI/ML LAYER                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ LLM Gateway │ │ Embedding   │ │ Vector Store│ │ ML Model Registry   │   │
│  │ (Multi-     │ │ Service     │ │ (Pinecone)  │ │ (MLflow)            │   │
│  │ Provider)   │ │ (OpenAI)    │ │             │ │                     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │ RAG Engine  │ │ Prompt      │ │ Fine-Tuning │ │ Model Cache         │   │
│  │             │ │ Management  │ │ Pipeline    │ │ (Redis)             │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────────────┐
│                        DATA LAYER                                            │
├──────────────┬──────────────┬──────────────┬──────────────┬────────────────┤
│ PostgreSQL   │ Redis        │ Elasticsearch│ Pinecone     │ Azure Blob     │
│ (Primary DB) │ (Cache)      │ (Search)     │ (Vectors)    │ (Files)        │
└──────────────┴──────────────┴──────────────┴──────────────┴────────────────┘
```

---

## 2. Feature Mapping to Services

### 2.1 AI Service Extensions (Core AI Features)

| # | Feature | New Module | Endpoints |
|---|---------|------------|-----------|
| 1 | AI Job Match Score | `match/` (existing) | Enhanced scoring algorithm |
| 2 | Auto Skill Gap Analysis | `skills/gap_analyzer.py` | `POST /ai/skills/gap` |
| 3 | AI Portfolio Builder | `portfolio/builder.py` | `POST /ai/portfolio/generate` |
| 4 | Auto Follow-Up Email Generator | `email/followup.py` | `POST /ai/email/followup` |
| 5 | Salary Insights & Negotiation | `salary/` (existing) | Enhanced with market data |
| 6 | Interview Simulation with Scoring | `interview/simulator.py` | `POST /ai/interview/simulate` |
| 7 | Multi-Resume Personalities | `resume/personalities.py` | `POST /ai/resume/personality` |
| 8 | ATS Visibility Checker | `ats/checker.py` | `POST /ai/ats/analyze` |
| 9 | Intelligent AI Job Alerts | `alerts/smart_alerts.py` | `POST /ai/alerts/configure` |
| 10 | Recruiter Outreach Message | `outreach/recruiter.py` | `POST /ai/outreach/message` |
| 11 | Company Culture Analyzer | `company/culture.py` | `POST /ai/company/culture` |
| 12 | Predictive Job Fit Forecasting | `prediction/job_fit.py` | `POST /ai/predict/fit` |
| 13 | AI Company Background Insight | `company/insight.py` | `POST /ai/company/insight` |
| 14 | Multi-Language Translation | `translation/service.py` | `POST /ai/translate` |
| 15 | LinkedIn Profile Optimizer | `linkedin/optimizer.py` | `POST /ai/linkedin/optimize` |
| 16 | Career Path Projection | `career/path.py` | `POST /ai/career/path` |
| 17 | Certification Roadmap Engine | `career/certifications.py` | `POST /ai/career/certs` |
| 18 | Application Success Predictor | `prediction/success.py` | `POST /ai/predict/success` |
| 19 | AI Career Coach Chatbot | `chat/coach.py` | `WS /ai/chat/coach` |
| 20 | AI Career Personality Mapping | `personality/mapper.py` | `POST /ai/personality/map` |
| 21 | AI Role Transition Engine | `career/transition.py` | `POST /ai/career/transition` |
| 22 | Real-Time Skill Tagging | `skills/tagger.py` | `POST /ai/skills/tag` |
| 23 | Strengths & Weaknesses Analyzer | `personality/swot.py` | `POST /ai/personality/swot` |
| 24 | Emotional Tone Matching | `content/tone.py` | `POST /ai/content/tone` |
| 25 | Multi-Version Cover Letters | `coverletter/versions.py` | `POST /ai/coverletter/versions` |
| 26 | Resume Version Timeline | `resume/timeline.py` | `GET /ai/resume/timeline` |
| 27 | AI Company Email Finder | `outreach/email_finder.py` | `POST /ai/outreach/find-email` |
| 28 | Market Demand Indicator | `market/demand.py` | `GET /ai/market/demand` |
| 29 | Resume Heatmap Viewer | `analytics/heatmap.py` | `POST /ai/analytics/heatmap` |
| 30 | Competition Insights | `market/competition.py` | `GET /ai/market/competition` |
| 31 | Job Posting Scam Scanner | `security/scam_detector.py` | `POST /ai/security/scan` |
| 32 | One-Click Project Generator | `portfolio/projects.py` | `POST /ai/portfolio/project` |
| 33 | Soft-Skills Builder | `skills/soft_skills.py` | `POST /ai/skills/soft` |
| 34 | Certification Exam Prep | `education/exam_prep.py` | `POST /ai/education/prep` |
| 35 | Experience Gap Fill-In Projects | `career/gap_projects.py` | `POST /ai/career/gap-fill` |
| 36 | Professional Writing Refinement | `content/writing.py` | `POST /ai/content/refine` |
| 37 | AI Technical Interview Evaluator | `interview/technical.py` | `POST /ai/interview/technical` |
| 38 | Behavioral Interview Story Builder | `interview/star.py` | `POST /ai/interview/star` |
| 39 | Interviewer Mood Analyzer | `interview/mood.py` | `POST /ai/interview/mood` |
| 40 | AI Onboarding Guide | `onboarding/guide.py` | `POST /ai/onboarding/plan` |

### 2.2 New Employer Service (Employer Features)

| # | Feature | Module | Endpoints |
|---|---------|--------|-----------|
| 41 | Auto-Apply With Customization | Auto-Apply Service | Enhanced rules engine |
| 42 | AI Candidate Pre-Screening | `screening/prescreener.py` | `POST /employer/screen` |
| 43 | Automated Shortlisting | `screening/shortlist.py` | `POST /employer/shortlist` |
| 44 | D&I Job Post Analyzer | `compliance/diversity.py` | `POST /employer/analyze-di` |
| 45 | Employer Branding Page Builder | `branding/builder.py` | `POST /employer/brand` |
| 46 | Job Description Rewriter | `jobs/rewriter.py` | `POST /employer/rewrite-jd` |
| 47 | Recruiter Engagement Score | `analytics/engagement.py` | `GET /employer/engagement` |

### 2.3 Integration & Utility Features

| # | Feature | Service | Implementation |
|---|---------|---------|----------------|
| 48 | Auto Calendar Sync | Notification Service | Google/Outlook API integration |
| 49 | Visa & Work Authorization Guide | AI Service | `POST /ai/visa/guide` |
| 50 | Multi-Currency Salary Translator | AI Service | `POST /ai/salary/convert` |

---

## 3. Data Model Extensions

### 3.1 New Entities

```typescript
// Career Path Entity
interface CareerPath {
  id: string;
  userId: string;
  currentRole: string;
  targetRole: string;
  milestones: Milestone[];
  estimatedTimeYears: number;
  requiredSkills: string[];
  recommendedCertifications: string[];
  createdAt: Date;
}

// Interview Session Entity
interface InterviewSession {
  id: string;
  userId: string;
  jobId: string;
  type: 'behavioral' | 'technical' | 'mock';
  questions: InterviewQuestion[];
  responses: InterviewResponse[];
  overallScore: number;
  feedback: string;
  recordingUrl?: string;
  createdAt: Date;
}

// Portfolio Project Entity
interface PortfolioProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  technologies: string[];
  generatedCode?: string;
  deploymentUrl?: string;
  githubUrl?: string;
  createdAt: Date;
}

// Employer Profile Entity
interface EmployerProfile {
  id: string;
  companyId: string;
  brandingPageContent: object;
  diversityMetrics: DiversityMetrics;
  hiringPreferences: HiringPreferences;
  createdAt: Date;
}

// Resume Version Entity (Enhanced)
interface ResumeVersion {
  id: string;
  resumeId: string;
  version: number;
  personality: 'professional' | 'creative' | 'technical' | 'executive';
  content: ResumeContent;
  atsScore: number;
  performanceMetrics: PerformanceMetrics;
  createdAt: Date;
}
```

### 3.2 Database Schema Additions

```sql
-- Career Path Tables
CREATE TABLE career_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  current_role VARCHAR(255),
  target_role VARCHAR(255),
  milestones JSONB,
  estimated_years DECIMAL(3,1),
  required_skills TEXT[],
  recommended_certs TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interview Sessions
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  job_id UUID REFERENCES jobs(id),
  type VARCHAR(50),
  questions JSONB,
  responses JSONB,
  overall_score DECIMAL(3,1),
  feedback TEXT,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio Projects
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  technologies TEXT[],
  generated_code TEXT,
  deployment_url TEXT,
  github_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Employer Profiles
CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  branding_content JSONB,
  diversity_metrics JSONB,
  hiring_preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resume Versions (Enhanced)
ALTER TABLE resume_versions
ADD COLUMN personality VARCHAR(50) DEFAULT 'professional',
ADD COLUMN performance_metrics JSONB;

-- AI Generation Logs (for audit and improvement)
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  feature_name VARCHAR(100),
  prompt_template VARCHAR(100),
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  model_provider VARCHAR(50),
  model_name VARCHAR(100),
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_career_paths_user ON career_paths(user_id);
CREATE INDEX idx_interview_sessions_user ON interview_sessions(user_id);
CREATE INDEX idx_portfolio_projects_user ON portfolio_projects(user_id);
CREATE INDEX idx_ai_logs_feature ON ai_generation_logs(feature_name, created_at);
```

---

## 4. AI Integration Layer

### 4.1 LLM Gateway Architecture

```python
# src/services/llm_gateway.py

class LLMGateway:
    """
    Unified gateway for all LLM operations with:
    - Multi-provider support (OpenAI, Anthropic, Azure OpenAI, Cohere)
    - Automatic failover
    - Cost optimization
    - Rate limiting per feature
    - Prompt versioning
    - Response caching
    """

    providers = {
        'openai': OpenAIProvider(),
        'anthropic': AnthropicProvider(),
        'azure_openai': AzureOpenAIProvider(),
        'cohere': CohereProvider(),
    }

    feature_routing = {
        'cover_letter': {'provider': 'openai', 'model': 'gpt-4'},
        'job_matching': {'provider': 'openai', 'model': 'gpt-3.5-turbo'},
        'translation': {'provider': 'azure_openai', 'model': 'gpt-4'},
        'code_generation': {'provider': 'anthropic', 'model': 'claude-3-opus'},
    }

    async def complete(
        self,
        feature: str,
        prompt: str,
        **kwargs
    ) -> LLMResponse:
        routing = self.feature_routing.get(feature, self.default_routing)
        provider = self.providers[routing['provider']]

        # Check cache
        cache_key = self._generate_cache_key(feature, prompt)
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # Execute with retry and failover
        try:
            response = await provider.complete(prompt, model=routing['model'], **kwargs)
        except ProviderError:
            response = await self._failover(feature, prompt, **kwargs)

        # Cache and log
        await self.cache.set(cache_key, response, ttl=self._get_ttl(feature))
        await self._log_generation(feature, prompt, response)

        return response
```

### 4.2 Prompt Management System

```python
# src/services/prompt_manager.py

class PromptManager:
    """
    Centralized prompt template management with:
    - Version control
    - A/B testing
    - Performance tracking
    - Dynamic variable injection
    """

    def __init__(self):
        self.templates = {}
        self.versions = {}
        self.metrics = {}

    def register_template(
        self,
        name: str,
        template: str,
        version: str,
        metadata: dict
    ):
        self.templates[name] = {
            'template': template,
            'version': version,
            'metadata': metadata,
            'created_at': datetime.now()
        }

    def get_template(
        self,
        name: str,
        variables: dict,
        experiment_id: Optional[str] = None
    ) -> str:
        template_data = self.templates[name]

        # A/B test variant selection
        if experiment_id:
            variant = self._select_variant(name, experiment_id)
            template_data = self.versions[f"{name}:{variant}"]

        return template_data['template'].format(**variables)

    def track_performance(
        self,
        template_name: str,
        success: bool,
        user_rating: Optional[int] = None
    ):
        if template_name not in self.metrics:
            self.metrics[template_name] = {'success': 0, 'total': 0, 'ratings': []}

        self.metrics[template_name]['total'] += 1
        if success:
            self.metrics[template_name]['success'] += 1
        if user_rating:
            self.metrics[template_name]['ratings'].append(user_rating)
```

### 4.3 RAG Pipeline for Enhanced Features

```python
# src/services/rag_engine.py

class RAGEngine:
    """
    Retrieval-Augmented Generation engine for:
    - Company research
    - Market insights
    - Career advice
    - Interview preparation
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
        llm_gateway: LLMGateway
    ):
        self.embeddings = embedding_service
        self.vectors = vector_store
        self.llm = llm_gateway

    async def query(
        self,
        query: str,
        context_type: str,  # 'company', 'job', 'career', 'market'
        top_k: int = 5,
        rerank: bool = True
    ) -> RAGResponse:
        # 1. Embed query
        query_embedding = await self.embeddings.embed(query)

        # 2. Retrieve relevant documents
        docs = await self.vectors.query(
            embedding=query_embedding,
            namespace=context_type,
            top_k=top_k * 2 if rerank else top_k
        )

        # 3. Rerank if enabled
        if rerank:
            docs = await self._rerank(query, docs, top_k)

        # 4. Build context
        context = self._build_context(docs)

        # 5. Generate response
        prompt = self._build_rag_prompt(query, context)
        response = await self.llm.complete('rag', prompt)

        return RAGResponse(
            answer=response.text,
            sources=docs,
            confidence=self._calculate_confidence(docs)
        )

    async def _rerank(
        self,
        query: str,
        docs: List[Document],
        top_k: int
    ) -> List[Document]:
        # Use cross-encoder for reranking
        scores = await self.cross_encoder.score(query, [d.text for d in docs])
        ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
        return [d for d, _ in ranked[:top_k]]
```

---

## 5. Frontend Architecture Extensions

### 5.1 New Pages Structure

```
src/app/(dashboard)/
├── ai-tools/
│   ├── page.tsx                    # AI Tools Hub
│   ├── resume-optimizer/
│   ├── cover-letter-generator/
│   ├── interview-prep/
│   │   ├── page.tsx               # Interview Prep Hub
│   │   ├── simulator/page.tsx     # Mock Interview
│   │   ├── technical/page.tsx     # Technical Practice
│   │   └── behavioral/page.tsx    # STAR Stories
│   ├── salary-assistant/
│   ├── skills-gap/
│   ├── career-coach/
│   │   ├── page.tsx               # Career Coach Chat
│   │   └── path/page.tsx          # Career Path Planner
│   ├── portfolio-builder/
│   ├── linkedin-optimizer/
│   └── certification-roadmap/
├── employer/                        # NEW: Employer Portal
│   ├── page.tsx                    # Employer Dashboard
│   ├── candidates/page.tsx         # Candidate Search
│   ├── screening/page.tsx          # AI Pre-Screening
│   ├── job-posts/page.tsx          # Job Post Manager
│   ├── branding/page.tsx           # Employer Branding
│   └── analytics/page.tsx          # Hiring Analytics
└── analytics/
    ├── page.tsx                    # Analytics Dashboard
    ├── applications/page.tsx       # Application Analytics
    ├── resume-performance/page.tsx # Resume Heatmaps
    └── market-insights/page.tsx    # Market Demand
```

### 5.2 New Components

```typescript
// AI Feature Components
src/components/features/ai/
├── CareerCoachChat.tsx          # WebSocket chat interface
├── InterviewSimulator.tsx        # Video/audio recording
├── ResumeHeatmap.tsx            # Visual resume analysis
├── SkillGapAnalyzer.tsx         # Interactive skill gap view
├── SalaryNegotiator.tsx         # Negotiation wizard
├── CertificationRoadmap.tsx     # Visual roadmap
├── CareerPathVisualizer.tsx     # Interactive career path
└── PortfolioProjectCard.tsx     # Generated project display

// Employer Components
src/components/features/employer/
├── CandidateCard.tsx            # Candidate summary
├── ScreeningResults.tsx         # AI screening output
├── DiversityAnalyzer.tsx        # D&I analysis display
├── BrandingEditor.tsx           # WYSIWYG branding page
└── HiringFunnel.tsx             # Hiring pipeline view
```

### 5.3 New API Hooks

```typescript
// src/hooks/useAIFeatures.ts

// Career Features
export const useCareerPath = (userId: string) =>
  useQuery(['career-path', userId], () => aiApi.getCareerPath(userId));

export const useSkillGap = (resumeId: string, jobId: string) =>
  useMutation((data) => aiApi.analyzeSkillGap(data));

export const useCareerCoach = () => {
  const ws = useWebSocket('/ai/chat/coach');
  return { sendMessage: ws.send, messages: ws.messages };
};

// Interview Features
export const useInterviewSimulator = () =>
  useMutation((session) => aiApi.simulateInterview(session));

export const useInterviewFeedback = () =>
  useMutation((response) => aiApi.getInterviewFeedback(response));

// Portfolio Features
export const usePortfolioGenerator = () =>
  useMutation((skills) => aiApi.generatePortfolioProject(skills));

// Employer Features
export const useCandidateScreening = () =>
  useMutation((candidates) => employerApi.screenCandidates(candidates));

export const useShortlist = () =>
  useMutation((jobId) => employerApi.generateShortlist(jobId));
```

---

## 6. Background Jobs Architecture

### 6.1 Job Queue Design

```typescript
// Queue Definitions
const queues = {
  // High Priority - User-facing
  'ai-generation': { concurrency: 10, timeout: 60000 },
  'interview-analysis': { concurrency: 5, timeout: 120000 },

  // Medium Priority - Background
  'resume-parsing': { concurrency: 5, timeout: 30000 },
  'job-matching': { concurrency: 20, timeout: 45000 },
  'email-generation': { concurrency: 10, timeout: 30000 },

  // Low Priority - Analytics
  'analytics-aggregation': { concurrency: 3, timeout: 300000 },
  'market-data-sync': { concurrency: 1, timeout: 600000 },

  // Scheduled Jobs
  'job-alerts': { cron: '0 */6 * * *' },  // Every 6 hours
  'skill-trends': { cron: '0 0 * * *' },   // Daily
  'market-refresh': { cron: '0 0 * * 0' }, // Weekly
};
```

### 6.2 Job Processors

```typescript
// AI Generation Processor
@Processor('ai-generation')
export class AIGenerationProcessor {
  @Process('generate-cover-letter')
  async handleCoverLetter(job: Job<CoverLetterJobData>) {
    const { userId, jobId, resumeId, tone } = job.data;

    const [resume, jobPosting] = await Promise.all([
      this.resumeService.findById(resumeId),
      this.jobService.findById(jobId),
    ]);

    const coverLetter = await this.aiService.generateCoverLetter({
      resume,
      jobPosting,
      tone,
    });

    await this.notificationService.notify(userId, {
      type: 'cover-letter-ready',
      data: { coverLetterId: coverLetter.id },
    });

    return coverLetter;
  }

  @Process('analyze-skill-gap')
  async handleSkillGap(job: Job<SkillGapJobData>) {
    // Implementation
  }

  @Process('generate-interview-questions')
  async handleInterviewQuestions(job: Job<InterviewJobData>) {
    // Implementation
  }
}
```

---

## 7. Security Architecture

### 7.1 Role-Based Access Control Matrix

```typescript
const permissionMatrix = {
  // Candidate Permissions
  candidate: {
    resume: ['create', 'read', 'update', 'delete', 'export'],
    job: ['read', 'save', 'apply'],
    application: ['read', 'update', 'withdraw'],
    ai_features: ['use_basic', 'use_premium'],
    analytics: ['read_own'],
  },

  // Employer Permissions
  employer: {
    job_posting: ['create', 'read', 'update', 'delete', 'publish'],
    candidate: ['search', 'view', 'shortlist', 'contact'],
    screening: ['run', 'configure'],
    analytics: ['read_company', 'export'],
    branding: ['create', 'update'],
  },

  // Admin Permissions
  admin: {
    users: ['read', 'update', 'delete', 'impersonate'],
    system: ['configure', 'monitor', 'audit'],
    ai: ['manage_prompts', 'view_logs', 'adjust_models'],
    billing: ['view', 'refund', 'adjust'],
  },
};
```

### 7.2 AI Safety Guardrails

```python
# src/services/ai_safety.py

class AISafetyGuard:
    """
    AI output safety controls:
    - Content filtering
    - Bias detection
    - PII detection and redaction
    - Factuality checking
    """

    async def validate_output(
        self,
        output: str,
        context: str,
        feature: str
    ) -> SafetyResult:
        checks = await asyncio.gather(
            self._check_content_policy(output),
            self._check_bias(output, context),
            self._check_pii(output),
            self._check_factuality(output, context),
        )

        return SafetyResult(
            passed=all(c.passed for c in checks),
            violations=[c for c in checks if not c.passed],
            sanitized_output=self._sanitize(output, checks)
        )

    async def _check_bias(self, output: str, context: str) -> CheckResult:
        # Use bias detection model
        prompt = DETECT_BIAS_PROMPT.format(text=output)
        result = await self.llm.complete('safety', prompt)
        return self._parse_bias_result(result)

    async def _check_pii(self, output: str) -> CheckResult:
        # Regex + NER for PII detection
        pii_patterns = self._find_pii_patterns(output)
        return CheckResult(
            passed=len(pii_patterns) == 0,
            details=pii_patterns
        )
```

---

## 8. Observability & Monitoring

### 8.1 AI Feature Metrics

```yaml
# Prometheus metrics for AI features
metrics:
  # Latency
  - name: ai_feature_latency_seconds
    type: histogram
    labels: [feature, model, provider]
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30]

  # Token Usage
  - name: ai_tokens_used_total
    type: counter
    labels: [feature, model, direction]  # input/output

  # Success Rate
  - name: ai_feature_requests_total
    type: counter
    labels: [feature, status]  # success/error

  # Quality Scores
  - name: ai_output_quality_score
    type: gauge
    labels: [feature]

  # Cost Tracking
  - name: ai_cost_dollars
    type: counter
    labels: [feature, model, provider]
```

### 8.2 Grafana Dashboards

```json
{
  "dashboards": [
    {
      "name": "AI Features Overview",
      "panels": [
        "Total AI Requests (24h)",
        "Average Latency by Feature",
        "Token Usage by Model",
        "Cost by Feature",
        "Error Rate by Provider",
        "Top 10 Most Used Features"
      ]
    },
    {
      "name": "AI Quality Metrics",
      "panels": [
        "User Satisfaction Scores",
        "Output Quality Distribution",
        "Bias Detection Rate",
        "PII Detection Events",
        "Prompt Performance A/B Tests"
      ]
    }
  ]
}
```

---

## 9. Deployment Considerations

### 9.1 Resource Requirements

| Service | CPU | Memory | GPU | Replicas |
|---------|-----|--------|-----|----------|
| AI Service | 2 cores | 4Gi | Optional | 3-10 (HPA) |
| Interview Service | 1 core | 2Gi | - | 2-5 |
| Employer Service | 1 core | 1Gi | - | 2-5 |
| Vector Store (Pinecone) | Managed | Managed | - | N/A |
| Redis (Embeddings Cache) | 1 core | 8Gi | - | 3 (Sentinel) |

### 9.2 Scaling Strategy

```yaml
# HPA Configuration for AI Service
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: ai_requests_per_second
        target:
          type: AverageValue
          averageValue: "50"
```

---

*Architecture Document - JobPilot AI Platform*
*Version 1.0 - December 2024*
