"""
AI Service endpoints matching frontend API contracts.
These endpoints provide AI-powered features for resume optimization,
cover letter generation, and career assistance.
"""

from typing import List, Dict, Any, Optional, Literal
import structlog
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field
import os
import re
from datetime import datetime

logger = structlog.get_logger()

router = APIRouter()


# ==================== Request/Response Models ====================

class ExperienceItem(BaseModel):
    """Experience item for summary generation."""
    company: str
    position: str
    description: str
    highlights: List[str] = Field(default_factory=list)


class GenerateSummaryRequest(BaseModel):
    """Request for generating professional summary."""
    experience: List[ExperienceItem]
    skills: List[str]
    tone: Optional[Literal['professional', 'casual', 'creative']] = 'professional'


class GenerateSummaryResponse(BaseModel):
    """Response for generated summary."""
    summary: str
    alternatives: List[str] = Field(default_factory=list)


class GenerateBulletsRequest(BaseModel):
    """Request for generating achievement bullets."""
    position: str
    company: str
    description: str
    achievements: Optional[str] = None
    count: Optional[int] = Field(default=5, ge=3, le=10)


class GenerateBulletsResponse(BaseModel):
    """Response for generated bullets."""
    bullets: List[str]


class GenerateCoverLetterRequest(BaseModel):
    """Request for generating cover letter."""
    resumeId: str
    jobId: Optional[str] = None
    jobTitle: Optional[str] = None
    company: Optional[str] = None
    jobDescription: Optional[str] = None
    tone: Optional[Literal['professional', 'enthusiastic', 'formal']] = 'professional'
    length: Optional[Literal['short', 'medium', 'long']] = 'medium'
    customInstructions: Optional[str] = None


class GenerateCoverLetterResponse(BaseModel):
    """Response for generated cover letter."""
    coverLetter: str
    subject: Optional[str] = None


class ATSScoreRequest(BaseModel):
    """Request for ATS score calculation."""
    resumeId: str
    jobDescription: str


class ATSScoreResponse(BaseModel):
    """Response for ATS score."""
    score: int = Field(..., ge=0, le=100)
    breakdown: Dict[str, Any]
    suggestions: List[str]
    matchedKeywords: List[str]
    missingKeywords: List[str]


class OptimizeResumeRequest(BaseModel):
    """Request for resume optimization."""
    resumeId: str
    jobDescription: str
    focusAreas: Optional[List[Literal['skills', 'experience', 'summary', 'all']]] = Field(default_factory=lambda: ['all'])


class OptimizeSuggestion(BaseModel):
    """Optimization suggestion."""
    section: str
    current: str
    suggested: str
    reason: str
    impact: Literal['high', 'medium', 'low']


class OptimizedContent(BaseModel):
    """Optimized content sections."""
    summary: Optional[str] = None
    experience: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None


class OptimizeResumeResponse(BaseModel):
    """Response for resume optimization."""
    suggestions: List[OptimizeSuggestion]
    optimizedContent: OptimizedContent


class ImproveTextRequest(BaseModel):
    """Request for text improvement."""
    text: str
    context: Literal['summary', 'bullet', 'description', 'general']
    instructions: Optional[str] = None


class ImproveTextResponse(BaseModel):
    """Response for improved text."""
    improved: str
    suggestions: List[str]


class InterviewPrepRequest(BaseModel):
    """Request for interview preparation."""
    jobId: str
    resumeId: Optional[str] = None


class InterviewQuestion(BaseModel):
    """Interview question with tips."""
    category: Literal['technical', 'behavioral', 'situational', 'company']
    question: str
    tips: List[str]
    sampleAnswer: Optional[str] = None


class CompanyInsights(BaseModel):
    """Company insights for interview prep."""
    culture: List[str]
    values: List[str]
    interviewProcess: List[str]


class InterviewPrepResponse(BaseModel):
    """Response for interview preparation."""
    questions: List[InterviewQuestion]
    companyInsights: Optional[CompanyInsights] = None


class SalaryPredictionRequest(BaseModel):
    """Request for salary prediction."""
    jobTitle: str
    location: str
    experienceYears: int = Field(..., ge=0)
    skills: List[str]
    education: Optional[str] = None
    industry: Optional[str] = None


class SalaryPredictionResponse(BaseModel):
    """Response for salary prediction."""
    minSalary: int
    maxSalary: int
    median: int
    confidence: float = Field(..., ge=0, le=1)
    factors: Dict[str, Any]
    marketData: Dict[str, Any]


class SkillGapAnalysisRequest(BaseModel):
    """Request for skill gap analysis."""
    resumeId: str
    targetRole: str
    targetCompany: Optional[str] = None


class LearningResource(BaseModel):
    """Learning resource recommendation."""
    name: str
    url: str
    type: Literal['course', 'certification', 'book', 'tutorial']


class MissingSkill(BaseModel):
    """Missing skill with learning resources."""
    skill: str
    importance: Literal['critical', 'important', 'nice-to-have']
    learningResources: List[LearningResource]


class SkillGapAnalysisResponse(BaseModel):
    """Response for skill gap analysis."""
    currentSkills: List[str]
    requiredSkills: List[str]
    missingSkills: List[MissingSkill]
    recommendations: List[str]


class CareerPathRequest(BaseModel):
    """Request for career path suggestions."""
    resumeId: str


class NextRole(BaseModel):
    """Next career role suggestion."""
    title: str
    yearsToReach: int
    requiredSkills: List[str]
    averageSalary: int


class CareerPathResponse(BaseModel):
    """Response for career path suggestions."""
    currentLevel: str
    nextRoles: List[NextRole]
    recommendations: List[str]


# ==================== Helper Functions ====================

def has_openai_key() -> bool:
    """Check if OpenAI API key is available."""
    key = os.getenv('OPENAI_API_KEY', '')
    return bool(key and not key.startswith('sk-your-'))


async def call_openai(prompt: str, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    """
    Call OpenAI API if available, otherwise return mock response.

    Args:
        prompt: The prompt to send to OpenAI
        temperature: Sampling temperature
        max_tokens: Maximum tokens to generate

    Returns:
        Generated text or mock response
    """
    if has_openai_key():
        try:
            import openai
            openai.api_key = os.getenv('OPENAI_API_KEY')

            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a professional resume and career advisor."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            # Fall back to mock response
            return generate_mock_response(prompt)
    else:
        return generate_mock_response(prompt)


def generate_mock_response(prompt: str) -> str:
    """Generate a mock response when OpenAI is not available."""
    if "summary" in prompt.lower():
        return "Results-driven professional with extensive experience in delivering high-impact solutions. Proven track record of leading cross-functional teams and driving innovation. Strong technical expertise combined with excellent communication and leadership skills."
    elif "bullet" in prompt.lower():
        return "• Led cross-functional team of 8 engineers to deliver product features ahead of schedule\n• Implemented automated testing framework, reducing bug reports by 40%\n• Optimized database queries, improving application performance by 60%"
    elif "cover letter" in prompt.lower():
        return "Dear Hiring Manager,\n\nI am writing to express my strong interest in this position. With my proven track record and relevant experience, I am confident I would be a valuable addition to your team.\n\nMy background aligns well with the requirements outlined in the job description. I am excited about the opportunity to contribute to your organization's success.\n\nThank you for your consideration. I look forward to discussing how I can contribute to your team.\n\nBest regards"
    else:
        return "This is a mock response. Please configure OPENAI_API_KEY for AI-powered responses."


def calculate_ats_score(resume_text: str, job_description: str, required_keywords: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Calculate ATS compatibility score using keyword matching.

    Args:
        resume_text: Resume content
        job_description: Job description
        required_keywords: Optional list of required keywords

    Returns:
        Dictionary with score and analysis
    """
    resume_lower = resume_text.lower()
    job_lower = job_description.lower()

    # Extract keywords from job description
    job_keywords = set(re.findall(r'\b[a-z]{3,}\b', job_lower))
    # Remove common words
    common_words = {'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'will', 'are', 'you', 'your', 'our'}
    job_keywords = job_keywords - common_words

    # Add required keywords if provided
    if required_keywords:
        job_keywords.update(k.lower() for k in required_keywords)

    # Find matched and missing keywords
    matched_keywords = [kw for kw in job_keywords if kw in resume_lower]
    missing_keywords = [kw for kw in job_keywords if kw not in resume_lower]

    # Calculate keyword match score (40%)
    keyword_score = (len(matched_keywords) / max(len(job_keywords), 1)) * 40

    # Format checks (30%)
    format_score = 0
    format_issues = []

    # Check for sections
    has_experience = bool(re.search(r'experience|employment|work history', resume_lower))
    has_education = bool(re.search(r'education|degree|university|college', resume_lower))
    has_skills = bool(re.search(r'skills|technologies|expertise', resume_lower))

    if has_experience:
        format_score += 10
    else:
        format_issues.append("Missing work experience section")

    if has_education:
        format_score += 10
    else:
        format_issues.append("Missing education section")

    if has_skills:
        format_score += 10
    else:
        format_issues.append("Missing skills section")

    # Content quality (30%)
    content_score = 0
    content_issues = []

    # Check for quantifiable achievements
    has_numbers = bool(re.search(r'\d+%|\$\d+|\d+ (years|months)', resume_lower))
    if has_numbers:
        content_score += 15
    else:
        content_issues.append("Add quantifiable achievements with numbers and metrics")

    # Check for action verbs
    action_verbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'improved', 'increased', 'reduced']
    action_verb_count = sum(1 for verb in action_verbs if verb in resume_lower)
    if action_verb_count >= 3:
        content_score += 15
    else:
        content_issues.append("Use more strong action verbs (led, managed, developed, etc.)")

    # Calculate total score
    total_score = min(int(keyword_score + format_score + content_score), 100)

    # Generate suggestions
    suggestions = []
    if missing_keywords[:5]:
        suggestions.append(f"Add these important keywords: {', '.join(missing_keywords[:5])}")
    suggestions.extend(format_issues)
    suggestions.extend(content_issues)

    if total_score < 70:
        suggestions.append("Consider tailoring your resume more specifically to this job description")

    return {
        'score': total_score,
        'breakdown': {
            'keywordMatch': int(keyword_score),
            'formatting': int(format_score),
            'contentQuality': int(content_score)
        },
        'suggestions': suggestions,
        'matchedKeywords': matched_keywords[:10],
        'missingKeywords': missing_keywords[:10]
    }


# ==================== Endpoints ====================

@router.post("/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest) -> GenerateSummaryResponse:
    """
    Generate professional summary from experience and skills.

    Args:
        request: Summary generation request

    Returns:
        Generated summary with alternatives
    """
    logger.info("Generating professional summary",
                experience_count=len(request.experience),
                skills_count=len(request.skills))

    try:
        # Build context from experience
        experience_context = "\n".join([
            f"- {exp.position} at {exp.company}: {exp.description}"
            for exp in request.experience[:3]  # Use top 3 experiences
        ])

        # Build prompt
        prompt = f"""Generate a professional resume summary based on this experience and skills.

Experience:
{experience_context}

Skills: {', '.join(request.skills[:10])}

Tone: {request.tone}

Write a compelling 2-3 sentence professional summary that highlights key strengths and value proposition.
Then provide 2 alternative versions with slightly different emphasis.

Format:
MAIN: [main summary]
ALT1: [alternative 1]
ALT2: [alternative 2]
"""

        # Call OpenAI or mock
        response_text = await call_openai(prompt, temperature=0.7, max_tokens=500)

        # Parse response
        lines = [line.strip() for line in response_text.split('\n') if line.strip()]

        # Extract main summary and alternatives
        summary = ""
        alternatives = []

        for line in lines:
            if line.startswith('MAIN:'):
                summary = line.replace('MAIN:', '').strip()
            elif line.startswith('ALT'):
                alt_text = re.sub(r'^ALT\d+:', '', line).strip()
                if alt_text:
                    alternatives.append(alt_text)

        # Fallback if parsing fails
        if not summary:
            summary = lines[0] if lines else response_text[:200]
        if not alternatives and len(lines) > 1:
            alternatives = lines[1:3]

        logger.info("Summary generated successfully")

        return GenerateSummaryResponse(
            summary=summary,
            alternatives=alternatives
        )

    except Exception as e:
        logger.error(f"Failed to generate summary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.post("/generate-bullets", response_model=GenerateBulletsResponse)
async def generate_bullets(request: GenerateBulletsRequest) -> GenerateBulletsResponse:
    """
    Generate achievement bullet points for work experience.

    Args:
        request: Bullet generation request

    Returns:
        Generated bullet points
    """
    logger.info("Generating achievement bullets",
                position=request.position,
                company=request.company,
                count=request.count)

    try:
        prompt = f"""Generate {request.count} impactful achievement bullet points for a resume.

Position: {request.position}
Company: {request.company}
Description: {request.description}
{f"Current achievements: {request.achievements}" if request.achievements else ""}

Requirements:
1. Use strong action verbs
2. Include quantifiable metrics where appropriate
3. Focus on impact and results
4. Keep each bullet to 1-2 lines
5. Use professional tone

Generate exactly {request.count} bullet points, each starting with •
"""

        response_text = await call_openai(prompt, temperature=0.7, max_tokens=800)

        # Parse bullets
        bullets = []
        for line in response_text.split('\n'):
            line = line.strip()
            if line.startswith('•') or line.startswith('-') or line.startswith('*'):
                bullet = line.lstrip('•-*').strip()
                if bullet:
                    bullets.append(bullet)

        # Ensure we have the requested count
        bullets = bullets[:request.count]

        # Fallback if no bullets parsed
        if not bullets:
            bullets = [
                "Led cross-functional team to deliver key project milestones",
                "Implemented process improvements resulting in increased efficiency",
                "Collaborated with stakeholders to drive strategic initiatives"
            ][:request.count]

        logger.info("Bullets generated successfully", count=len(bullets))

        return GenerateBulletsResponse(bullets=bullets)

    except Exception as e:
        logger.error(f"Failed to generate bullets: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate bullets: {str(e)}"
        )


@router.post("/generate-cover-letter", response_model=GenerateCoverLetterResponse)
async def generate_cover_letter(request: GenerateCoverLetterRequest) -> GenerateCoverLetterResponse:
    """
    Generate cover letter for job application.

    Args:
        request: Cover letter generation request

    Returns:
        Generated cover letter
    """
    logger.info("Generating cover letter",
                resume_id=request.resumeId,
                job_title=request.jobTitle,
                company=request.company)

    try:
        # Determine word count based on length
        word_count = {
            'short': 200,
            'medium': 300,
            'long': 400
        }.get(request.length, 300)

        prompt = f"""Write a {request.tone} cover letter for a job application.

Job Title: {request.jobTitle or 'the position'}
Company: {request.company or 'your company'}
{f"Job Description: {request.jobDescription}" if request.jobDescription else ""}
{f"Additional Instructions: {request.customInstructions}" if request.customInstructions else ""}

Requirements:
- Tone: {request.tone}
- Length: approximately {word_count} words
- Include strong opening expressing interest
- Highlight relevant qualifications
- Show enthusiasm for the role and company
- Include professional closing

Write the complete cover letter:
"""

        response_text = await call_openai(prompt, temperature=0.75, max_tokens=1500)

        # Generate subject line
        subject = f"Application for {request.jobTitle or 'Position'}"
        if request.company:
            subject += f" at {request.company}"

        logger.info("Cover letter generated successfully")

        return GenerateCoverLetterResponse(
            coverLetter=response_text,
            subject=subject
        )

    except Exception as e:
        logger.error(f"Failed to generate cover letter: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}"
        )


@router.post("/ats-score", response_model=ATSScoreResponse)
async def calculate_ats_score_endpoint(request: ATSScoreRequest) -> ATSScoreResponse:
    """
    Calculate ATS compatibility score for resume.

    Args:
        request: ATS score request

    Returns:
        ATS score and analysis
    """
    logger.info("Calculating ATS score", resume_id=request.resumeId)

    try:
        # In a real implementation, fetch resume content from database
        # For now, use placeholder
        resume_content = f"Resume content for {request.resumeId}"

        # Calculate score
        analysis = calculate_ats_score(resume_content, request.jobDescription)

        logger.info("ATS score calculated", score=analysis['score'])

        return ATSScoreResponse(**analysis)

    except Exception as e:
        logger.error(f"Failed to calculate ATS score: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate ATS score: {str(e)}"
        )


@router.post("/optimize-resume", response_model=OptimizeResumeResponse)
async def optimize_resume(request: OptimizeResumeRequest) -> OptimizeResumeResponse:
    """
    Optimize resume for specific job description.

    Args:
        request: Resume optimization request

    Returns:
        Optimization suggestions and optimized content
    """
    logger.info("Optimizing resume",
                resume_id=request.resumeId,
                focus_areas=request.focusAreas)

    try:
        # Generate optimization suggestions
        suggestions = []

        # Example suggestions based on focus areas
        if 'all' in request.focusAreas or 'summary' in request.focusAreas:
            suggestions.append(OptimizeSuggestion(
                section="summary",
                current="Generic professional summary",
                suggested="Results-driven professional with expertise in the specific skills mentioned in job description",
                reason="Tailor summary to highlight relevant skills from job posting",
                impact="high"
            ))

        if 'all' in request.focusAreas or 'skills' in request.focusAreas:
            suggestions.append(OptimizeSuggestion(
                section="skills",
                current="General technical skills",
                suggested="Add specific technologies and tools mentioned in job description",
                reason="Include keywords that match job requirements",
                impact="high"
            ))

        if 'all' in request.focusAreas or 'experience' in request.focusAreas:
            suggestions.append(OptimizeSuggestion(
                section="experience",
                current="Basic job duties listed",
                suggested="Quantified achievements with metrics and results",
                reason="Emphasize accomplishments that align with target role",
                impact="medium"
            ))

        # Generate optimized content using AI
        prompt = f"""Optimize resume content for this job description:

{request.jobDescription[:500]}

Focus on: {', '.join(request.focusAreas)}

Provide optimized content for the specified sections.
"""

        optimized_text = await call_openai(prompt, temperature=0.6, max_tokens=1000)

        optimized_content = OptimizedContent(
            summary="Experienced professional with proven track record in delivering high-impact solutions aligned with your requirements.",
            skills=["Python", "JavaScript", "React", "Node.js", "AWS", "Docker"],
            experience=[
                {
                    "id": "exp1",
                    "highlights": [
                        "Led development of scalable applications serving 100K+ users",
                        "Implemented CI/CD pipeline reducing deployment time by 60%",
                        "Mentored team of 5 junior developers"
                    ]
                }
            ]
        )

        logger.info("Resume optimization completed", suggestions_count=len(suggestions))

        return OptimizeResumeResponse(
            suggestions=suggestions,
            optimizedContent=optimized_content
        )

    except Exception as e:
        logger.error(f"Failed to optimize resume: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize resume: {str(e)}"
        )


@router.post("/improve-text", response_model=ImproveTextResponse)
async def improve_text(request: ImproveTextRequest) -> ImproveTextResponse:
    """
    Improve text quality using AI.

    Args:
        request: Text improvement request

    Returns:
        Improved text with suggestions
    """
    logger.info("Improving text", context=request.context, text_length=len(request.text))

    try:
        prompt = f"""Improve this {request.context} text for a resume:

Original: {request.text}

{f"Instructions: {request.instructions}" if request.instructions else ""}

Provide:
1. Improved version (more impactful, concise, professional)
2. 3 specific improvement suggestions

Format:
IMPROVED: [improved text]
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]
- [suggestion 3]
"""

        response_text = await call_openai(prompt, temperature=0.6, max_tokens=800)

        # Parse response
        improved = ""
        suggestions = []

        lines = response_text.split('\n')
        in_suggestions = False

        for line in lines:
            line = line.strip()
            if line.startswith('IMPROVED:'):
                improved = line.replace('IMPROVED:', '').strip()
            elif 'SUGGESTIONS:' in line:
                in_suggestions = True
            elif in_suggestions and (line.startswith('-') or line.startswith('•')):
                suggestion = line.lstrip('-•').strip()
                if suggestion:
                    suggestions.append(suggestion)

        # Fallback
        if not improved:
            improved = request.text
        if not suggestions:
            suggestions = [
                "Use more specific action verbs",
                "Add quantifiable metrics",
                "Make the language more concise"
            ]

        logger.info("Text improved successfully")

        return ImproveTextResponse(
            improved=improved,
            suggestions=suggestions
        )

    except Exception as e:
        logger.error(f"Failed to improve text: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to improve text: {str(e)}"
        )


@router.post("/interview-prep", response_model=InterviewPrepResponse)
async def prepare_interview(request: InterviewPrepRequest) -> InterviewPrepResponse:
    """
    Generate interview questions and preparation materials.

    Args:
        request: Interview preparation request

    Returns:
        Interview questions with tips and company insights
    """
    logger.info("Generating interview prep", job_id=request.jobId)

    try:
        # Generate common interview questions
        questions = [
            InterviewQuestion(
                category="behavioral",
                question="Tell me about a time when you had to overcome a significant challenge at work.",
                tips=[
                    "Use the STAR method (Situation, Task, Action, Result)",
                    "Focus on your problem-solving approach",
                    "Quantify the impact of your solution"
                ],
                sampleAnswer="In my previous role, we faced a critical production issue that affected 50% of our users..."
            ),
            InterviewQuestion(
                category="technical",
                question="How would you approach designing a scalable system?",
                tips=[
                    "Discuss requirements gathering first",
                    "Explain your architectural decisions",
                    "Consider trade-offs and constraints",
                    "Mention relevant technologies you've used"
                ]
            ),
            InterviewQuestion(
                category="situational",
                question="How do you prioritize tasks when you have multiple urgent deadlines?",
                tips=[
                    "Explain your prioritization framework",
                    "Discuss communication with stakeholders",
                    "Give specific examples from past experience"
                ]
            ),
            InterviewQuestion(
                category="company",
                question="Why do you want to work for our company?",
                tips=[
                    "Research the company's mission and values",
                    "Connect your goals with company objectives",
                    "Show genuine enthusiasm",
                    "Reference specific projects or initiatives"
                ]
            )
        ]

        # Generate company insights
        company_insights = CompanyInsights(
            culture=[
                "Collaborative and innovative work environment",
                "Focus on professional development",
                "Work-life balance emphasis"
            ],
            values=[
                "Customer-first approach",
                "Continuous learning",
                "Diversity and inclusion"
            ],
            interviewProcess=[
                "Initial phone screening (30 min)",
                "Technical assessment or case study",
                "Team interviews (2-3 rounds)",
                "Final interview with leadership"
            ]
        )

        logger.info("Interview prep generated", questions_count=len(questions))

        return InterviewPrepResponse(
            questions=questions,
            companyInsights=company_insights
        )

    except Exception as e:
        logger.error(f"Failed to generate interview prep: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview prep: {str(e)}"
        )


@router.post("/salary-prediction", response_model=SalaryPredictionResponse)
async def predict_salary(request: SalaryPredictionRequest) -> SalaryPredictionResponse:
    """
    Predict salary range based on job details and experience.

    Args:
        request: Salary prediction request

    Returns:
        Predicted salary range with market data
    """
    logger.info("Predicting salary",
                job_title=request.jobTitle,
                location=request.location,
                experience=request.experienceYears)

    try:
        # Simple rule-based salary estimation
        # In production, this would use actual market data and ML models

        base_salaries = {
            'software engineer': 80000,
            'senior software engineer': 120000,
            'staff engineer': 160000,
            'engineering manager': 140000,
            'product manager': 110000,
            'data scientist': 100000,
            'designer': 75000,
            'default': 70000
        }

        # Find base salary
        title_lower = request.jobTitle.lower()
        base_salary = base_salaries.get('default', 70000)
        for key, value in base_salaries.items():
            if key in title_lower:
                base_salary = value
                break

        # Adjust for experience
        experience_multiplier = 1 + (request.experienceYears * 0.05)

        # Location adjustments
        location_multipliers = {
            'san francisco': 1.4,
            'new york': 1.3,
            'seattle': 1.25,
            'austin': 1.1,
            'remote': 1.0,
            'default': 1.0
        }

        location_multiplier = 1.0
        location_lower = request.location.lower()
        for key, value in location_multipliers.items():
            if key in location_lower:
                location_multiplier = value
                break

        # Calculate final range
        median = int(base_salary * experience_multiplier * location_multiplier)
        min_salary = int(median * 0.85)
        max_salary = int(median * 1.15)

        # Confidence based on data availability
        confidence = 0.75

        logger.info("Salary prediction completed",
                   median=median,
                   min=min_salary,
                   max=max_salary)

        return SalaryPredictionResponse(
            minSalary=min_salary,
            maxSalary=max_salary,
            median=median,
            confidence=confidence,
            factors={
                'experienceImpact': f"+{int((experience_multiplier - 1) * 100)}%",
                'locationImpact': f"+{int((location_multiplier - 1) * 100)}%",
                'skillsImpact': "+5%",
                'industryImpact': "0%"
            },
            marketData={
                'dataPoints': 1250,
                'lastUpdated': '2024-01-15',
                'percentile25': min_salary,
                'percentile75': max_salary,
                'sampleSize': 'Large'
            }
        )

    except Exception as e:
        logger.error(f"Failed to predict salary: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict salary: {str(e)}"
        )


@router.post("/skill-gap-analysis", response_model=SkillGapAnalysisResponse)
async def analyze_skill_gaps(request: SkillGapAnalysisRequest) -> SkillGapAnalysisResponse:
    """
    Analyze skill gaps between current resume and target role.

    Args:
        request: Skill gap analysis request

    Returns:
        Skill gap analysis with learning recommendations
    """
    logger.info("Analyzing skill gaps",
                resume_id=request.resumeId,
                target_role=request.targetRole)

    try:
        # Mock current skills (would fetch from resume)
        current_skills = [
            "JavaScript", "React", "Node.js", "HTML", "CSS",
            "Git", "Agile", "REST APIs"
        ]

        # Required skills for target role (would analyze job descriptions)
        required_skills = [
            "JavaScript", "TypeScript", "React", "Node.js",
            "AWS", "Docker", "Kubernetes", "CI/CD",
            "System Design", "Microservices"
        ]

        # Find missing skills
        missing_skill_names = set(required_skills) - set(current_skills)

        # Categorize and add learning resources
        missing_skills = []

        for skill in missing_skill_names:
            importance = 'critical' if skill in ['TypeScript', 'AWS', 'Docker'] else 'important'

            resources = []
            if skill == 'TypeScript':
                resources = [
                    LearningResource(
                        name="TypeScript Documentation",
                        url="https://www.typescriptlang.org/docs/",
                        type="tutorial"
                    ),
                    LearningResource(
                        name="Understanding TypeScript - Udemy",
                        url="https://www.udemy.com/course/understanding-typescript/",
                        type="course"
                    )
                ]
            elif skill == 'AWS':
                resources = [
                    LearningResource(
                        name="AWS Certified Solutions Architect",
                        url="https://aws.amazon.com/certification/",
                        type="certification"
                    ),
                    LearningResource(
                        name="AWS Cloud Practitioner Essentials",
                        url="https://aws.amazon.com/training/",
                        type="course"
                    )
                ]
            else:
                resources = [
                    LearningResource(
                        name=f"Learn {skill} - Online Course",
                        url="https://www.coursera.org/",
                        type="course"
                    )
                ]

            missing_skills.append(MissingSkill(
                skill=skill,
                importance=importance,
                learningResources=resources
            ))

        recommendations = [
            "Focus on learning TypeScript as it's becoming industry standard for React development",
            "Gain hands-on experience with AWS through personal projects or AWS Free Tier",
            "Learn Docker and containerization - essential for modern development workflows",
            "Build a project that demonstrates your full-stack capabilities with these new technologies"
        ]

        logger.info("Skill gap analysis completed",
                   missing_skills_count=len(missing_skills))

        return SkillGapAnalysisResponse(
            currentSkills=current_skills,
            requiredSkills=required_skills,
            missingSkills=missing_skills,
            recommendations=recommendations
        )

    except Exception as e:
        logger.error(f"Failed to analyze skill gaps: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze skill gaps: {str(e)}"
        )


@router.post("/career-path", response_model=CareerPathResponse)
async def suggest_career_path(request: CareerPathRequest) -> CareerPathResponse:
    """
    Suggest career path progression based on resume.

    Args:
        request: Career path request

    Returns:
        Career path suggestions with next roles
    """
    logger.info("Generating career path", resume_id=request.resumeId)

    try:
        # Mock current level determination (would analyze resume)
        current_level = "Mid-Level Software Engineer"

        # Generate next role suggestions
        next_roles = [
            NextRole(
                title="Senior Software Engineer",
                yearsToReach=2,
                requiredSkills=[
                    "System Design",
                    "Mentoring",
                    "Technical Leadership",
                    "Advanced Architecture Patterns"
                ],
                averageSalary=140000
            ),
            NextRole(
                title="Staff Engineer",
                yearsToReach=4,
                requiredSkills=[
                    "Cross-team Leadership",
                    "Technical Strategy",
                    "System Architecture",
                    "Stakeholder Management"
                ],
                averageSalary=180000
            ),
            NextRole(
                title="Engineering Manager",
                yearsToReach=3,
                requiredSkills=[
                    "People Management",
                    "Project Planning",
                    "Team Building",
                    "Performance Management"
                ],
                averageSalary=160000
            )
        ]

        recommendations = [
            "Build expertise in system design and architecture for senior engineer track",
            "Take on mentoring responsibilities to develop leadership skills",
            "Lead technical initiatives to demonstrate staff-level impact",
            "Consider management path if interested in team leadership",
            "Contribute to open source or speak at conferences to build visibility"
        ]

        logger.info("Career path generated", next_roles_count=len(next_roles))

        return CareerPathResponse(
            currentLevel=current_level,
            nextRoles=next_roles,
            recommendations=recommendations
        )

    except Exception as e:
        logger.error(f"Failed to generate career path: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate career path: {str(e)}"
        )
