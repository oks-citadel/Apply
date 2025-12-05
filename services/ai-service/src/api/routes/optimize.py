"""
Resume optimization endpoints for AI Service.
"""

import structlog
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from ...api.dependencies import (
    ResumeOptimizerDep,
    CurrentUserDep,
    standard_rate_limiter,
)
from ...schemas.request_schemas import ATSScoreRequest
from ...schemas.response_schemas import ATSScore, OptimizedResume, Keyword
from ...schemas import Resume, JobPosting

logger = structlog.get_logger()

router = APIRouter()


# Request Models
class OptimizeResumeRequest(BaseModel):
    """Request schema for resume optimization."""

    resume_content: str = Field(..., description="Resume text content")
    job_description: str = Field(..., description="Job description to optimize for")
    optimization_level: str = Field(
        default="moderate",
        description="Optimization level: light, moderate, aggressive",
    )


class ExtractKeywordsRequest(BaseModel):
    """Request schema for keyword extraction."""

    job_description: str = Field(..., description="Job description")
    top_k: int = Field(default=20, ge=5, le=50, description="Number of keywords to extract")


# Endpoints
@router.post(
    "/keywords",
    response_model=list[Keyword],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def extract_keywords(
    request: ExtractKeywordsRequest,
    optimizer: ResumeOptimizerDep,
    current_user: CurrentUserDep,
) -> list[Keyword]:
    """
    Extract keywords from job description for resume optimization.

    Args:
        request: Keyword extraction request
        optimizer: Resume optimizer instance
        current_user: Current authenticated user

    Returns:
        List of extracted keywords with metadata
    """
    logger.info(
        "Extracting keywords from job description",
        user_id=current_user.user_id,
        text_length=len(request.job_description),
    )

    try:
        # Extract keywords
        keywords = await optimizer.extract_keywords(request.job_description)

        # Limit to top_k
        keywords = keywords[: request.top_k]

        logger.info(
            "Keywords extracted successfully",
            user_id=current_user.user_id,
            keywords_count=len(keywords),
        )

        return keywords

    except Exception as e:
        logger.error(
            "Failed to extract keywords",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to extract keywords: {str(e)}",
        )


@router.post(
    "/ats-score",
    response_model=ATSScore,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def calculate_ats_score(
    request: ATSScoreRequest,
    optimizer: ResumeOptimizerDep,
    current_user: CurrentUserDep,
) -> ATSScore:
    """
    Calculate ATS compatibility score for resume.

    Args:
        request: ATS score calculation request
        optimizer: Resume optimizer instance
        current_user: Current authenticated user

    Returns:
        Detailed ATS score with recommendations
    """
    logger.info(
        "Calculating ATS score",
        user_id=current_user.user_id,
        resume_length=len(request.resume_content),
        job_desc_length=len(request.job_description),
    )

    try:
        # Create Resume and JobPosting objects
        resume = Resume(
            content=request.resume_content,
            skills=request.required_keywords or [],
        )

        job = JobPosting(
            id="temp_job",
            title="Job Position",
            company_id="temp_company",
            company_name="Company",
            description=request.job_description,
            required_skills=request.required_keywords or [],
        )

        # Calculate ATS score
        ats_score = await optimizer.calculate_ats_score(resume, job)

        logger.info(
            "ATS score calculated successfully",
            user_id=current_user.user_id,
            overall_score=ats_score.overall_score,
            ranking=ats_score.estimated_ranking,
        )

        return ats_score

    except Exception as e:
        logger.error(
            "Failed to calculate ATS score",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate ATS score: {str(e)}",
        )


@router.post(
    "/resume",
    response_model=OptimizedResume,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def optimize_resume(
    request: OptimizeResumeRequest,
    optimizer: ResumeOptimizerDep,
    current_user: CurrentUserDep,
) -> OptimizedResume:
    """
    Optimize resume for specific job posting.

    Args:
        request: Resume optimization request
        optimizer: Resume optimizer instance
        current_user: Current authenticated user

    Returns:
        Optimized resume with change tracking and scores
    """
    logger.info(
        "Optimizing resume",
        user_id=current_user.user_id,
        optimization_level=request.optimization_level,
    )

    try:
        # Validate optimization level
        valid_levels = ["light", "moderate", "aggressive"]
        if request.optimization_level not in valid_levels:
            raise ValueError(
                f"Invalid optimization level. Must be one of: {', '.join(valid_levels)}"
            )

        # Create Resume and JobPosting objects
        resume = Resume(
            id="temp_resume",
            content=request.resume_content,
        )

        job = JobPosting(
            id="temp_job",
            title="Job Position",
            company_id="temp_company",
            company_name="Company",
            description=request.job_description,
        )

        # Optimize resume
        optimized = await optimizer.optimize_for_job(
            resume=resume,
            job=job,
            optimization_level=request.optimization_level,
        )

        logger.info(
            "Resume optimized successfully",
            user_id=current_user.user_id,
            score_before=optimized.ats_score_before,
            score_after=optimized.ats_score_after,
            improvement=f"{optimized.improvement_percentage:.1f}%",
        )

        return optimized

    except ValueError as e:
        logger.warning(
            "Invalid optimization request",
            user_id=current_user.user_id,
            error=str(e),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error(
            "Failed to optimize resume",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to optimize resume: {str(e)}",
        )


@router.post(
    "/tailor-summary",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def tailor_summary(
    summary: str,
    job_description: str,
    optimizer: ResumeOptimizerDep,
    current_user: CurrentUserDep,
) -> dict:
    """
    Tailor professional summary for specific job.

    Args:
        summary: Original professional summary
        job_description: Target job description
        optimizer: Resume optimizer instance
        current_user: Current authenticated user

    Returns:
        Tailored summary
    """
    logger.info(
        "Tailoring professional summary",
        user_id=current_user.user_id,
    )

    try:
        # Create JobPosting object
        job = JobPosting(
            id="temp_job",
            title="Job Position",
            company_id="temp_company",
            company_name="Company",
            description=job_description,
        )

        # Tailor summary
        tailored = await optimizer.tailor_summary(summary, job)

        logger.info(
            "Summary tailored successfully",
            user_id=current_user.user_id,
        )

        return {
            "original_summary": summary,
            "tailored_summary": tailored,
            "word_count": len(tailored.split()),
        }

    except Exception as e:
        logger.error(
            "Failed to tailor summary",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to tailor summary: {str(e)}",
        )


@router.post(
    "/enhance-achievements",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def enhance_achievements(
    achievements: list[str],
    role: str,
    company: str,
    industry: str,
    optimizer: ResumeOptimizerDep,
    current_user: CurrentUserDep,
) -> dict:
    """
    Enhance achievement statements with metrics and impact.

    Args:
        achievements: List of achievement statements
        role: Job role
        company: Company name
        industry: Industry
        optimizer: Resume optimizer instance
        current_user: Current authenticated user

    Returns:
        Enhanced achievements
    """
    logger.info(
        "Enhancing achievements",
        user_id=current_user.user_id,
        achievements_count=len(achievements),
    )

    try:
        # Enhance achievements
        enhanced = await optimizer.enhance_achievements(
            achievements=achievements,
            role=role,
            company=company,
            industry=industry,
        )

        logger.info(
            "Achievements enhanced successfully",
            user_id=current_user.user_id,
            enhanced_count=len(enhanced),
        )

        return {
            "original_achievements": achievements,
            "enhanced_achievements": enhanced,
            "count": len(enhanced),
        }

    except Exception as e:
        logger.error(
            "Failed to enhance achievements",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enhance achievements: {str(e)}",
        )
