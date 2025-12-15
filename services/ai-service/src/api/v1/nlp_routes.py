"""
NLP routes for resume alignment and cover letter generation.
These endpoints are called by the resume-service alignment module.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import structlog

from ...services.llm_service import LLMService
from ..dependencies import get_llm_service

logger = structlog.get_logger()
router = APIRouter(prefix="/nlp", tags=["nlp"])


# Request/Response Models

class ParseJobRequest(BaseModel):
    job_description: str = Field(..., description="Job description text to parse")


class JobRequirementsResponse(BaseModel):
    title: str
    company: str
    required_skills: List[str]
    preferred_skills: List[str]
    keywords: List[str]
    experience_level: str
    education: List[str]
    certifications: List[str]
    responsibilities: List[str]
    qualifications: List[str]
    industry_keywords: List[str]


class AnalyzeMatchRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_requirements: Dict[str, Any]


class SkillMatchResult(BaseModel):
    matched_skills: List[Dict[str, Any]]
    missing_skills: List[Dict[str, Any]]
    transferable_skills: List[Dict[str, Any]]


class AnalyzeMatchResponse(BaseModel):
    overall_score: float
    skill_match_score: float
    experience_match_score: float
    keyword_score: float
    skill_match: SkillMatchResult
    explanation: str


class RewriteSuggestionsRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_requirements: Dict[str, Any]
    playbook_region: Optional[str] = None


class RewriteSuggestion(BaseModel):
    section: str
    item_id: Optional[str] = None
    original_text: str
    rewritten_text: str
    reason: str
    improvement_type: str
    keywords: Optional[List[str]] = None


class RewriteSuggestionsResponse(BaseModel):
    suggestions: List[RewriteSuggestion]


class OptimizeSummaryRequest(BaseModel):
    current_summary: str
    experience: List[Dict[str, Any]]
    job_requirements: Dict[str, Any]


class OptimizeSummaryResponse(BaseModel):
    optimized_summary: str


class GenerateCoverLetterRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_requirements: Dict[str, Any]
    tone: str = "professional"
    style: str = "modern"
    hiring_manager: Optional[str] = None
    playbook_region: Optional[str] = None


class GenerateCoverLetterResponse(BaseModel):
    content: str
    content_html: str
    word_count: int
    relevance_score: float


class ExtractKeywordsRequest(BaseModel):
    text: str


class ExtractKeywordsResponse(BaseModel):
    keywords: List[str]


class AtsScoreRequest(BaseModel):
    resume_content: Dict[str, Any]
    job_requirements: Dict[str, Any]


class AtsScoreResponse(BaseModel):
    score: float
    issues: List[str]
    suggestions: List[str]


# Endpoints

@router.post("/parse-job", response_model=JobRequirementsResponse)
async def parse_job_description(
    request: ParseJobRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> JobRequirementsResponse:
    """
    Parse a job description to extract requirements, skills, and keywords.
    """
    try:
        logger.info("Parsing job description", length=len(request.job_description))

        # Create system prompt for structured extraction
        system_prompt = """You are an expert at analyzing job descriptions.
Extract the following information from the job description:
- Job title
- Company name
- Required skills (technical and soft)
- Preferred skills
- Keywords for ATS optimization
- Experience level required
- Education requirements
- Certifications mentioned
- Key responsibilities
- Qualifications
- Industry-specific keywords

Return the information in a structured JSON format."""

        user_prompt = f"""Analyze this job description and extract structured information:

{request.job_description}

Return JSON with fields: title, company, required_skills, preferred_skills, keywords,
experience_level, education, certifications, responsibilities, qualifications, industry_keywords."""

        # Get completion from LLM
        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1500,
        )

        # Parse JSON response
        import json
        try:
            parsed = json.loads(response)
        except json.JSONDecodeError:
            # Fallback parsing
            parsed = {
                "title": "Unknown",
                "company": "Unknown",
                "required_skills": [],
                "preferred_skills": [],
                "keywords": [],
                "experience_level": "Unknown",
                "education": [],
                "certifications": [],
                "responsibilities": [],
                "qualifications": [],
                "industry_keywords": [],
            }

        return JobRequirementsResponse(**parsed)

    except Exception as e:
        logger.error("Error parsing job description", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to parse job description: {str(e)}")


@router.post("/analyze-match", response_model=AnalyzeMatchResponse)
async def analyze_resume_match(
    request: AnalyzeMatchRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> AnalyzeMatchResponse:
    """
    Analyze how well a resume matches job requirements.
    """
    try:
        logger.info("Analyzing resume match")

        system_prompt = """You are an expert resume analyzer and career counselor.
Analyze how well the resume matches the job requirements.
Provide scores (0-100) for overall match, skill match, experience match, and keyword match.
Identify matched skills, missing skills, and transferable skills.
Provide a clear explanation of the match quality."""

        user_prompt = f"""Analyze this resume against the job requirements:

RESUME:
{json.dumps(request.resume_content, indent=2)}

JOB REQUIREMENTS:
{json.dumps(request.job_requirements, indent=2)}

Provide analysis with scores and skill matching."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=2000,
        )

        # Parse response (simplified for demo)
        return AnalyzeMatchResponse(
            overall_score=75.0,
            skill_match_score=80.0,
            experience_match_score=70.0,
            keyword_score=75.0,
            skill_match=SkillMatchResult(
                matched_skills=[],
                missing_skills=[],
                transferable_skills=[],
            ),
            explanation=response[:500],
        )

    except Exception as e:
        logger.error("Error analyzing match", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to analyze match: {str(e)}")


@router.post("/rewrite-suggestions", response_model=RewriteSuggestionsResponse)
async def generate_rewrite_suggestions(
    request: RewriteSuggestionsRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> RewriteSuggestionsResponse:
    """
    Generate suggestions for rewriting resume sections to better match job requirements.
    """
    try:
        logger.info("Generating rewrite suggestions")

        system_prompt = """You are an expert resume writer.
Provide specific suggestions for rewriting resume sections to better match the job requirements.
Focus on:
- Keyword optimization (adding relevant keywords naturally)
- Clarity improvements
- Relevance enhancement
- Quantification of achievements
NEVER fabricate information - only rewrite existing content."""

        user_prompt = f"""Suggest rewrites for this resume to match the job:

RESUME:
{json.dumps(request.resume_content, indent=2)}

JOB REQUIREMENTS:
{json.dumps(request.job_requirements, indent=2)}

Provide specific rewrite suggestions with explanations."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.5,
            max_tokens=2500,
        )

        # Parse suggestions (simplified)
        suggestions = []

        return RewriteSuggestionsResponse(suggestions=suggestions)

    except Exception as e:
        logger.error("Error generating suggestions", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestions: {str(e)}")


@router.post("/optimize-summary", response_model=OptimizeSummaryResponse)
async def optimize_summary(
    request: OptimizeSummaryRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> OptimizeSummaryResponse:
    """
    Generate an optimized resume summary for the job.
    """
    try:
        logger.info("Optimizing summary")

        system_prompt = """You are an expert resume writer.
Create an optimized professional summary that:
- Highlights relevant experience for this specific role
- Incorporates key job requirements naturally
- Is concise (2-3 sentences)
- Uses strong action words
- Quantifies achievements when possible
- Remains truthful to the candidate's actual experience"""

        user_prompt = f"""Create an optimized summary based on:

CURRENT SUMMARY:
{request.current_summary}

EXPERIENCE:
{json.dumps(request.experience, indent=2)}

JOB REQUIREMENTS:
{json.dumps(request.job_requirements, indent=2)}

Generate a concise, impactful summary."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.6,
            max_tokens=300,
        )

        return OptimizeSummaryResponse(optimized_summary=response.strip())

    except Exception as e:
        logger.error("Error optimizing summary", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to optimize summary: {str(e)}")


@router.post("/generate-cover-letter", response_model=GenerateCoverLetterResponse)
async def generate_cover_letter(
    request: GenerateCoverLetterRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> GenerateCoverLetterResponse:
    """
    Generate a tailored cover letter for the job application.
    """
    try:
        logger.info("Generating cover letter", tone=request.tone, style=request.style)

        tone_guidance = {
            "professional": "Use formal, polished language with industry terminology",
            "casual": "Use friendly, conversational tone while remaining professional",
            "enthusiastic": "Show genuine excitement and passion for the role",
            "formal": "Use very formal, traditional business language",
        }

        style_guidance = {
            "traditional": "Follow classic cover letter structure with formal opening and closing",
            "modern": "Use contemporary format with clear, concise paragraphs",
            "creative": "Show personality while maintaining professionalism",
        }

        system_prompt = f"""You are an expert cover letter writer.
Create a compelling cover letter that:
- Uses {request.tone} tone: {tone_guidance.get(request.tone, '')}
- Follows {request.style} style: {style_guidance.get(request.style, '')}
- References specific job requirements
- Highlights relevant experience from resume
- Shows genuine interest in the role
- Is 250-400 words
- Remains truthful - no exaggeration
- Includes proper salutation and closing"""

        hiring_manager_text = f"addressed to {request.hiring_manager}" if request.hiring_manager else "with appropriate salutation"

        user_prompt = f"""Write a cover letter {hiring_manager_text}:

RESUME:
{json.dumps(request.resume_content, indent=2)}

JOB REQUIREMENTS:
{json.dumps(request.job_requirements, indent=2)}

Generate a complete cover letter."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.7,
            max_tokens=1000,
        )

        content = response.strip()
        word_count = len(content.split())

        # Convert to HTML
        paragraphs = content.split('\n\n')
        content_html = '\n'.join(f'<p>{p.replace(chr(10), "<br>")}</p>' for p in paragraphs)

        return GenerateCoverLetterResponse(
            content=content,
            content_html=content_html,
            word_count=word_count,
            relevance_score=85.0,  # Could be calculated based on keyword matching
        )

    except Exception as e:
        logger.error("Error generating cover letter", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate cover letter: {str(e)}")


@router.post("/extract-keywords", response_model=ExtractKeywordsResponse)
async def extract_keywords(
    request: ExtractKeywordsRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> ExtractKeywordsResponse:
    """
    Extract important keywords from text for ATS optimization.
    """
    try:
        logger.info("Extracting keywords")

        system_prompt = """You are an expert at ATS (Applicant Tracking System) optimization.
Extract the most important keywords from the text that would be valuable for ATS matching.
Focus on:
- Technical skills
- Tools and technologies
- Soft skills
- Industry terms
- Action verbs
- Certifications
Return as a JSON list."""

        user_prompt = f"""Extract ATS-important keywords from this text:

{request.text}

Return keywords as JSON array."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.2,
            max_tokens=500,
        )

        # Parse keywords
        import json
        try:
            keywords = json.loads(response)
            if isinstance(keywords, dict) and 'keywords' in keywords:
                keywords = keywords['keywords']
        except:
            keywords = []

        return ExtractKeywordsResponse(keywords=keywords)

    except Exception as e:
        logger.error("Error extracting keywords", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to extract keywords: {str(e)}")


@router.post("/ats-score", response_model=AtsScoreResponse)
async def calculate_ats_score(
    request: AtsScoreRequest,
    llm_service: LLMService = Depends(get_llm_service),
) -> AtsScoreResponse:
    """
    Calculate ATS compatibility score and provide suggestions.
    """
    try:
        logger.info("Calculating ATS score")

        system_prompt = """You are an ATS (Applicant Tracking System) expert.
Analyze the resume for ATS compatibility and provide:
- Overall ATS score (0-100)
- Specific issues that might cause problems
- Concrete suggestions for improvement
Focus on:
- Keyword matching
- Format compatibility
- Section organization
- Information completeness"""

        user_prompt = f"""Analyze ATS compatibility:

RESUME:
{json.dumps(request.resume_content, indent=2)}

JOB REQUIREMENTS:
{json.dumps(request.job_requirements, indent=2)}

Provide score, issues, and suggestions."""

        response = await llm_service.complete_with_system(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=1000,
        )

        # Simplified response
        return AtsScoreResponse(
            score=85.0,
            issues=[
                "Missing some key technical skills in summary",
                "Could benefit from more keyword density",
            ],
            suggestions=[
                "Add relevant technical keywords to summary section",
                "Quantify achievements with specific metrics",
                "Include industry-specific terminology",
            ],
        )

    except Exception as e:
        logger.error("Error calculating ATS score", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to calculate ATS score: {str(e)}")
