"""
Job matching endpoints for AI Service.
"""

from typing import Dict, Any
import structlog
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from ...api.dependencies import (
    JobMatcherDep,
    CurrentUserDep,
    standard_rate_limiter,
)
from ...schemas.request_schemas import (
    MatchJobsRequest,
    MatchScoreRequest,
    CandidateProfile,
    JobPosting,
)
from ...schemas.response_schemas import (
    MatchScore,
    JobMatch,
    MatchJobsResponse,
)

logger = structlog.get_logger()

router = APIRouter()


# Additional Request Models
class FindMatchingJobsRequest(BaseModel):
    """Request for finding matching jobs with candidate profile."""

    candidate_profile: CandidateProfile = Field(..., description="Candidate profile")
    filters: Dict[str, Any] = Field(default_factory=dict, description="Search filters")
    top_k: int = Field(default=20, ge=1, le=100, description="Number of results")
    min_score: float = Field(default=0.6, ge=0.0, le=1.0, description="Minimum match score")


# Endpoints
@router.post(
    "/job",
    response_model=MatchScore,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def match_job(
    request: MatchScoreRequest,
    matcher: JobMatcherDep,
    current_user: CurrentUserDep,
) -> MatchScore:
    """
    Calculate match score between candidate and job.

    Args:
        request: Match score calculation request
        matcher: Job matcher instance
        current_user: Current authenticated user

    Returns:
        Detailed match score with breakdown
    """
    logger.info(
        "Calculating job match score",
        user_id=current_user.user_id,
    )

    try:
        # Calculate match score
        match_score = await matcher.calculate_match_score(
            candidate=request.candidate_data,
            job=request.job_data,
        )

        logger.info(
            "Match score calculated successfully",
            user_id=current_user.user_id,
            overall_score=match_score.overall_score,
        )

        return match_score

    except Exception as e:
        logger.error(
            "Failed to calculate match score",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate match score: {str(e)}",
        )


@router.post(
    "/jobs",
    response_model=MatchJobsResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def find_matching_jobs(
    request: FindMatchingJobsRequest,
    matcher: JobMatcherDep,
    current_user: CurrentUserDep,
) -> MatchJobsResponse:
    """
    Find matching jobs for candidate profile.

    Args:
        request: Job matching request
        matcher: Job matcher instance
        current_user: Current authenticated user

    Returns:
        List of matching jobs with scores
    """
    logger.info(
        "Finding matching jobs",
        user_id=current_user.user_id,
        candidate_id=request.candidate_profile.id,
        filters=request.filters,
        top_k=request.top_k,
    )

    try:
        # Generate candidate embedding
        candidate_embedding = await matcher.generate_candidate_embedding(
            request.candidate_profile
        )

        # Find matching jobs
        matching_jobs = await matcher.find_matching_jobs(
            embedding=candidate_embedding,
            filters=request.filters,
            top_k=request.top_k,
        )

        # Process results and calculate detailed scores
        job_matches = []

        for job_data in matching_jobs:
            # Extract job metadata
            job_id = job_data.get("id", "unknown")
            job_metadata = job_data.get("metadata", {})

            # Calculate detailed match score
            match_score = await matcher.calculate_match_score(
                candidate={
                    "skills": request.candidate_profile.skills,
                    "experience_years": request.candidate_profile.experience_years,
                    "location_preferences": request.candidate_profile.location_preferences or [],
                    "culture_preferences": request.candidate_profile.culture_preferences or {},
                },
                job={
                    "required_skills": job_metadata.get("required_skills", []),
                    "preferred_skills": job_metadata.get("preferred_skills", []),
                    "min_experience": job_metadata.get("min_experience", 0),
                    "max_experience": job_metadata.get("max_experience", 99),
                    "location": job_metadata.get("location", ""),
                    "remote_policy": job_metadata.get("remote_policy", ""),
                    "company_culture": job_metadata.get("company_culture", {}),
                },
            )

            # Filter by minimum score
            if match_score.overall_score < request.min_score:
                continue

            # Determine matched and missing skills
            candidate_skills_set = set(
                s.lower() for s in request.candidate_profile.skills
            )
            required_skills_set = set(
                s.lower() for s in job_metadata.get("required_skills", [])
            )

            matched_skills = list(candidate_skills_set & required_skills_set)
            missing_skills = list(required_skills_set - candidate_skills_set)

            # Create JobMatch object
            job_match = JobMatch(
                job_id=job_id,
                job_title=job_metadata.get("title", "Unknown Position"),
                company_name=job_metadata.get("company_name", "Unknown Company"),
                match_score=match_score.overall_score,
                score_breakdown=match_score,
                location=job_metadata.get("location"),
                salary_range=job_metadata.get("salary_range"),
                matched_skills=matched_skills[:10],
                missing_skills=missing_skills[:5],
                relevance_explanation=match_score.explanation,
            )

            job_matches.append(job_match)

        # Sort by match score
        job_matches.sort(key=lambda x: x.match_score, reverse=True)

        logger.info(
            "Matching jobs found successfully",
            user_id=current_user.user_id,
            candidate_id=request.candidate_profile.id,
            matches_found=len(job_matches),
        )

        return MatchJobsResponse(
            candidate_id=request.candidate_profile.id,
            matches=job_matches,
            total_matches=len(job_matches),
            filters_applied=request.filters,
            search_metadata={
                "top_k": request.top_k,
                "min_score": request.min_score,
                "total_scanned": len(matching_jobs),
            },
        )

    except Exception as e:
        logger.error(
            "Failed to find matching jobs",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find matching jobs: {str(e)}",
        )


@router.post(
    "/batch-score",
    response_model=list[MatchScore],
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def batch_match_score(
    candidate_data: Dict[str, Any],
    job_data_list: list[Dict[str, Any]],
    matcher: JobMatcherDep,
    current_user: CurrentUserDep,
) -> list[MatchScore]:
    """
    Calculate match scores for one candidate against multiple jobs.

    Args:
        candidate_data: Candidate profile data
        job_data_list: List of job posting data
        matcher: Job matcher instance
        current_user: Current authenticated user

    Returns:
        List of match scores
    """
    logger.info(
        "Calculating batch match scores",
        user_id=current_user.user_id,
        jobs_count=len(job_data_list),
    )

    try:
        scores = []

        for job_data in job_data_list:
            try:
                score = await matcher.calculate_match_score(
                    candidate=candidate_data,
                    job=job_data,
                )
                scores.append(score)
            except Exception as e:
                logger.warning(
                    f"Failed to calculate score for job",
                    job_id=job_data.get("id"),
                    error=str(e),
                )
                # Continue with other jobs

        logger.info(
            "Batch match scores calculated successfully",
            user_id=current_user.user_id,
            scores_calculated=len(scores),
        )

        return scores

    except Exception as e:
        logger.error(
            "Failed to calculate batch match scores",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate batch match scores: {str(e)}",
        )


@router.post(
    "/explain",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def explain_match(
    candidate_data: Dict[str, Any],
    job_data: Dict[str, Any],
    matcher: JobMatcherDep,
    current_user: CurrentUserDep,
) -> dict:
    """
    Get detailed explanation for job match.

    Args:
        candidate_data: Candidate profile data
        job_data: Job posting data
        matcher: Job matcher instance
        current_user: Current authenticated user

    Returns:
        Detailed match explanation
    """
    logger.info(
        "Generating match explanation",
        user_id=current_user.user_id,
    )

    try:
        # Calculate match score
        match_score = await matcher.calculate_match_score(
            candidate=candidate_data,
            job=job_data,
        )

        # Generate detailed explanation
        explanation = {
            "overall_score": match_score.overall_score,
            "ranking": "excellent" if match_score.overall_score >= 0.85 else
                      "good" if match_score.overall_score >= 0.7 else
                      "fair" if match_score.overall_score >= 0.5 else "poor",
            "score_breakdown": {
                "skills": {
                    "score": match_score.skill_match_score,
                    "weight": "40%",
                    "description": "Skills alignment with job requirements",
                },
                "experience": {
                    "score": match_score.experience_match_score,
                    "weight": "30%",
                    "description": "Experience level match",
                },
                "location": {
                    "score": match_score.location_match_score,
                    "weight": "15%",
                    "description": "Location and remote work compatibility",
                },
                "culture": {
                    "score": match_score.culture_match_score,
                    "weight": "15%",
                    "description": "Cultural fit assessment",
                },
            },
            "strengths": match_score.strengths,
            "gaps": match_score.gaps,
            "explanation": match_score.explanation,
            "recommendation": (
                "Highly recommended - Apply immediately!"
                if match_score.overall_score >= 0.85
                else "Good fit - Worth applying"
                if match_score.overall_score >= 0.7
                else "Moderate fit - Consider applying if interested"
                if match_score.overall_score >= 0.5
                else "Weak fit - May not be the best match"
            ),
        }

        logger.info(
            "Match explanation generated successfully",
            user_id=current_user.user_id,
        )

        return explanation

    except Exception as e:
        logger.error(
            "Failed to generate match explanation",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate match explanation: {str(e)}",
        )
