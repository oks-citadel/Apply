"""
Content generation endpoints for AI Service.
"""

from typing import Dict, Any, List
import structlog
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ...api.dependencies import (
    LLMServiceDep,
    CurrentUserDep,
    standard_rate_limiter,
)
from ...schemas.response_schemas import GeneratedSection
from ...utils.prompts import (
    format_summary_generation_prompt,
    format_skill_extraction_prompt,
)

logger = structlog.get_logger()

router = APIRouter()


# Request Models
class GenerateSummaryRequest(BaseModel):
    """Request schema for generating resume summary."""

    title: str = Field(..., description="Job title")
    years_experience: int = Field(..., ge=0, description="Years of experience")
    skills: List[str] = Field(..., min_items=1, description="Key skills")
    industry: str = Field(default="Technology", description="Industry")
    job_description: str = Field(default="", description="Target job description for tailoring")
    num_alternatives: int = Field(default=2, ge=0, le=5, description="Number of alternative versions")


class GenerateBulletsRequest(BaseModel):
    """Request schema for generating achievement bullets."""

    role: str = Field(..., description="Job role/title")
    company: str = Field(..., description="Company name")
    responsibilities: str = Field(..., description="Job responsibilities")
    achievements: str = Field(default="", description="Existing achievements (optional)")
    num_bullets: int = Field(default=5, ge=3, le=10, description="Number of bullets to generate")
    style: str = Field(default="impact", description="Style: impact, concise, detailed")


class ExtractSkillsRequest(BaseModel):
    """Request schema for extracting/suggesting skills."""

    text: str = Field(..., description="Text to extract skills from (resume, job description, etc.)")
    context: str = Field(default="resume", description="Context: resume, job_description, general")
    include_suggestions: bool = Field(default=True, description="Include skill suggestions")


class GenerateCoverLetterRequest(BaseModel):
    """Request schema for generating cover letter."""

    candidate_name: str = Field(..., description="Candidate name")
    job_title: str = Field(..., description="Target job title")
    company_name: str = Field(..., description="Target company name")
    resume_summary: str = Field(..., description="Resume summary/highlights")
    job_description: str = Field(..., description="Job description")
    tone: str = Field(default="professional", description="Tone: professional, enthusiastic, formal")
    max_words: int = Field(default=300, ge=100, le=500, description="Maximum word count")


# Response Models
class GenerateBulletsResponse(BaseModel):
    """Response for generated bullets."""

    bullets: List[str] = Field(description="Generated achievement bullets")
    word_count: int = Field(description="Total word count")
    style_applied: str = Field(description="Style that was applied")


class ExtractSkillsResponse(BaseModel):
    """Response for skill extraction."""

    extracted_skills: List[Dict[str, Any]] = Field(description="Extracted skills with categories")
    suggested_skills: List[str] = Field(default_factory=list, description="Suggested related skills")
    total_count: int = Field(description="Total number of skills")


class GenerateCoverLetterResponse(BaseModel):
    """Response for cover letter generation."""

    content: str = Field(description="Generated cover letter content")
    word_count: int = Field(description="Word count")
    tone: str = Field(description="Applied tone")


# Endpoints
@router.post(
    "/summary",
    response_model=GeneratedSection,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def generate_summary(
    request: GenerateSummaryRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> GeneratedSection:
    """
    Generate professional resume summary.

    Args:
        request: Summary generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Generated summary with alternatives
    """
    logger.info(
        "Generating resume summary",
        user_id=current_user.user_id,
        title=request.title,
        experience_years=request.years_experience,
    )

    try:
        # Generate summary prompt
        prompt = format_summary_generation_prompt(
            title=request.title,
            years_experience=request.years_experience,
            skills=request.skills,
            industry=request.industry,
            job_description=request.job_description,
        )

        # Generate content
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.7,
            max_tokens=500,
        )

        # Parse alternatives (expecting multiple versions in response)
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        alternatives = lines[1 : request.num_alternatives + 1] if len(lines) > 1 else []
        main_content = lines[0] if lines else content

        # Count words
        word_count = len(main_content.split())

        logger.info(
            "Resume summary generated successfully",
            user_id=current_user.user_id,
            word_count=word_count,
        )

        return GeneratedSection(
            section_type="summary",
            content=main_content,
            alternatives=alternatives,
            word_count=word_count,
        )

    except Exception as e:
        logger.error(
            "Failed to generate summary",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}",
        )


@router.post(
    "/bullets",
    response_model=GenerateBulletsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def generate_bullets(
    request: GenerateBulletsRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> GenerateBulletsResponse:
    """
    Generate achievement bullet points.

    Args:
        request: Bullet generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Generated bullet points
    """
    logger.info(
        "Generating achievement bullets",
        user_id=current_user.user_id,
        role=request.role,
        num_bullets=request.num_bullets,
    )

    try:
        # Build prompt
        prompt = f"""
Generate {request.num_bullets} impactful achievement bullet points for a resume.

ROLE: {request.role}
COMPANY: {request.company}
RESPONSIBILITIES: {request.responsibilities}
{f"EXISTING ACHIEVEMENTS: {request.achievements}" if request.achievements else ""}

Style: {request.style}

Instructions:
1. Use strong action verbs
2. Include quantifiable metrics where possible
3. Focus on results and impact
4. Keep each bullet to 1-2 lines
5. Follow the {request.style} style

Generate exactly {request.num_bullets} bullet points, one per line, starting with •
"""

        # Generate content
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.7,
            max_tokens=800,
        )

        # Parse bullets
        bullets = [
            line.strip().lstrip("•-*").strip()
            for line in content.split("\n")
            if line.strip() and (line.strip().startswith("•") or line.strip().startswith("-"))
        ]

        # Ensure we have the requested number
        bullets = bullets[: request.num_bullets]

        # Calculate total word count
        total_words = sum(len(bullet.split()) for bullet in bullets)

        logger.info(
            "Achievement bullets generated successfully",
            user_id=current_user.user_id,
            bullets_generated=len(bullets),
            total_words=total_words,
        )

        return GenerateBulletsResponse(
            bullets=bullets,
            word_count=total_words,
            style_applied=request.style,
        )

    except Exception as e:
        logger.error(
            "Failed to generate bullets",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate bullets: {str(e)}",
        )


@router.post(
    "/skills",
    response_model=ExtractSkillsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def extract_skills(
    request: ExtractSkillsRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> ExtractSkillsResponse:
    """
    Extract and suggest skills from text.

    Args:
        request: Skill extraction request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Extracted and suggested skills
    """
    logger.info(
        "Extracting skills",
        user_id=current_user.user_id,
        context=request.context,
        text_length=len(request.text),
    )

    try:
        # Generate extraction prompt
        prompt = format_skill_extraction_prompt(request.text)

        # Extract skills
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.3,
            max_tokens=1000,
        )

        # Parse skills (simplified parsing - production should use structured output)
        extracted_skills = []
        suggested_skills = []

        # Simple parsing logic
        lines = content.split("\n")
        current_category = "general"

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for category headers
            if "technical" in line.lower():
                current_category = "technical"
            elif "soft" in line.lower():
                current_category = "soft"
            elif "domain" in line.lower():
                current_category = "domain"
            elif line.startswith("-") or line.startswith("•"):
                # Extract skill
                skill_text = line.lstrip("-•").strip()
                extracted_skills.append({
                    "skill": skill_text,
                    "category": current_category,
                })

        # Generate suggestions if requested
        if request.include_suggestions and extracted_skills:
            suggestion_prompt = f"""
Based on these skills: {', '.join([s['skill'] for s in extracted_skills[:10]])},
suggest 5 related or complementary skills that would be valuable to add.

List only the skill names, one per line.
"""
            suggestions_content = await llm_service.complete(
                prompt=suggestion_prompt,
                temperature=0.5,
                max_tokens=200,
            )

            suggested_skills = [
                line.strip().lstrip("-•").strip()
                for line in suggestions_content.split("\n")
                if line.strip()
            ][:5]

        logger.info(
            "Skills extracted successfully",
            user_id=current_user.user_id,
            skills_count=len(extracted_skills),
            suggestions_count=len(suggested_skills),
        )

        return ExtractSkillsResponse(
            extracted_skills=extracted_skills,
            suggested_skills=suggested_skills,
            total_count=len(extracted_skills),
        )

    except Exception as e:
        logger.error(
            "Failed to extract skills",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract skills: {str(e)}",
        )


@router.post(
    "/cover-letter",
    response_model=GenerateCoverLetterResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def generate_cover_letter(
    request: GenerateCoverLetterRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> GenerateCoverLetterResponse:
    """
    Generate cover letter for job application.

    Args:
        request: Cover letter generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Generated cover letter
    """
    logger.info(
        "Generating cover letter",
        user_id=current_user.user_id,
        job_title=request.job_title,
        company=request.company_name,
    )

    try:
        # Build prompt
        prompt = f"""
Write a {request.tone} cover letter for a job application.

CANDIDATE: {request.candidate_name}
TARGET JOB: {request.job_title} at {request.company_name}
CANDIDATE BACKGROUND:
{request.resume_summary}

JOB DESCRIPTION:
{request.job_description}

Instructions:
1. Maximum {request.max_words} words
2. Tone: {request.tone}
3. Include:
   - Strong opening paragraph expressing interest
   - 2-3 paragraphs highlighting relevant experience and skills
   - Closing paragraph with call to action
4. Personalize for the company and role
5. Be authentic and compelling

Write the complete cover letter:
"""

        # Generate cover letter
        content = await llm_service.complete(
            prompt=prompt,
            temperature=0.75,
            max_tokens=1500,
        )

        # Count words
        word_count = len(content.split())

        logger.info(
            "Cover letter generated successfully",
            user_id=current_user.user_id,
            word_count=word_count,
        )

        return GenerateCoverLetterResponse(
            content=content.strip(),
            word_count=word_count,
            tone=request.tone,
        )

    except Exception as e:
        logger.error(
            "Failed to generate cover letter",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate cover letter: {str(e)}",
        )


@router.post(
    "/stream-summary",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def stream_summary(
    request: GenerateSummaryRequest,
    llm_service: LLMServiceDep,
    current_user: CurrentUserDep,
) -> StreamingResponse:
    """
    Generate resume summary with streaming response.

    Args:
        request: Summary generation request
        llm_service: LLM service instance
        current_user: Current authenticated user

    Returns:
        Streaming response with generated content
    """
    logger.info(
        "Streaming resume summary generation",
        user_id=current_user.user_id,
    )

    async def generate():
        """Generate content stream."""
        try:
            prompt = format_summary_generation_prompt(
                title=request.title,
                years_experience=request.years_experience,
                skills=request.skills,
                industry=request.industry,
                job_description=request.job_description,
            )

            # For streaming, we'd need to use the streaming API of the LLM provider
            # This is a simplified version - production should implement proper streaming
            content = await llm_service.complete(
                prompt=prompt,
                temperature=0.7,
                max_tokens=500,
            )

            # Simulate streaming by yielding chunks
            words = content.split()
            for i, word in enumerate(words):
                yield f"{word} "
                if i % 10 == 0:  # Simulate network delay
                    import asyncio
                    await asyncio.sleep(0.05)

        except Exception as e:
            logger.error(f"Streaming failed: {e}", exc_info=True)
            yield f"Error: {str(e)}"

    return StreamingResponse(generate(), media_type="text/plain")
