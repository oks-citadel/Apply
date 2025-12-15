"""
API routes for interview probability matching.
"""

import time
from typing import Dict, Any
import structlog
from fastapi import APIRouter, HTTPException, status, Depends, Request

from ...schemas.probability_matching_schemas import (
    CalculateProbabilityRequest,
    FindMatchesRequest,
    ExplainMatchRequest,
    RecordFeedbackRequest,
    ProbabilityScoreResponse,
    MatchExplanationResponse,
    TopMatchesResponse,
    FeedbackRecordedResponse,
    ThresholdInfoResponse,
    AllThresholdsResponse
)
from ...models.database_models import SubscriptionTier, OutcomeType
from ...models.interview_probability_matcher import InterviewProbabilityMatcher
from ...api.dependencies import CurrentUserDep, standard_rate_limiter

logger = structlog.get_logger()

router = APIRouter()


def get_matcher(request: Request) -> InterviewProbabilityMatcher:
    """Dependency to get matcher instance."""
    # Check if matcher is in app state
    if not hasattr(request.app.state, "probability_matcher"):
        # Initialize matcher if not exists
        llm_service = getattr(request.app.state, "llm_service", None)
        request.app.state.probability_matcher = InterviewProbabilityMatcher(
            llm_service=llm_service
        )

    return request.app.state.probability_matcher


@router.post(
    "/calculate-probability",
    response_model=ProbabilityScoreResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate interview probability for a job match",
    description="""
    Calculate the probability of getting an interview for a specific job based on:
    - Resume, cover letter, and LinkedIn profile
    - Job requirements and description
    - User's subscription tier

    Returns detailed probability scores, component breakdown, and gap analysis.
    """,
    dependencies=[Depends(standard_rate_limiter)]
)
async def calculate_probability(
    request: CalculateProbabilityRequest,
    matcher: InterviewProbabilityMatcher = Depends(get_matcher),
    current_user: CurrentUserDep = None
) -> ProbabilityScoreResponse:
    """
    Calculate interview probability for user-job match.

    Args:
        request: Probability calculation request
        matcher: Probability matcher instance
        current_user: Current authenticated user (optional)

    Returns:
        Probability scores and match analysis
    """
    logger.info(
        "Calculating interview probability",
        user_id=request.user_id,
        job_id=request.job_id,
        tier=request.subscription_tier
    )

    start_time = time.time()

    try:
        # Validate subscription tier
        try:
            tier_enum = SubscriptionTier(request.subscription_tier.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subscription tier: {request.subscription_tier}"
            )

        # Calculate probability
        match_result = await matcher.calculate_probability(
            user_id=request.user_id,
            job_id=request.job_id,
            job_requirements=request.job_requirements,
            resume_text=request.resume_text,
            cover_letter=request.cover_letter,
            linkedin_profile=request.linkedin_profile,
            subscription_tier=request.subscription_tier.lower()
        )

        # Build response
        response = ProbabilityScoreResponse(
            match_id=match_result.id,
            user_id=match_result.user_id,
            job_id=match_result.job_id,
            interview_probability=match_result.interview_probability,
            interview_probability_percentage=match_result.interview_probability * 100,
            offer_probability=match_result.offer_probability,
            overall_score=match_result.overall_score,
            component_scores={
                "skill_depth": match_result.skill_depth_score,
                "experience_relevance": match_result.experience_relevance_score,
                "seniority_match": match_result.seniority_match_score,
                "industry_fit": match_result.industry_fit_score,
                "education_match": match_result.education_match_score
            },
            threshold_met=match_result.threshold_met,
            requires_human_review=match_result.requires_human_review,
            subscription_tier=match_result.subscription_tier,
            strengths=match_result.strengths,
            critical_gaps=match_result.critical_gaps,
            minor_gaps=match_result.minor_gaps,
            job_title=match_result.metadata.get("job_title"),
            company=match_result.metadata.get("company")
        )

        elapsed_ms = (time.time() - start_time) * 1000

        logger.info(
            "Interview probability calculated",
            match_id=match_result.id,
            probability=match_result.interview_probability,
            threshold_met=match_result.threshold_met,
            elapsed_ms=elapsed_ms
        )

        return response

    except ValueError as e:
        logger.warning(
            "Validation error in probability calculation",
            user_id=request.user_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            "Failed to calculate interview probability",
            user_id=request.user_id,
            job_id=request.job_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate probability: {str(e)}"
        )


@router.post(
    "/find-matches",
    response_model=TopMatchesResponse,
    status_code=status.HTTP_200_OK,
    summary="Find top matching jobs for a user",
    description="""
    Evaluate multiple jobs and return the top matches that meet the user's subscription tier threshold.

    Only jobs exceeding the tier's probability threshold will be returned.
    Results are sorted by interview probability (highest first).
    """,
    dependencies=[Depends(standard_rate_limiter)]
)
async def find_matches(
    request: FindMatchesRequest,
    matcher: InterviewProbabilityMatcher = Depends(get_matcher),
    current_user: CurrentUserDep = None
) -> TopMatchesResponse:
    """
    Find top matching jobs for user.

    Args:
        request: Find matches request
        matcher: Probability matcher instance
        current_user: Current authenticated user (optional)

    Returns:
        Top matching jobs with probability scores
    """
    logger.info(
        "Finding top matches",
        user_id=request.user_id,
        total_jobs=len(request.jobs),
        tier=request.subscription_tier,
        top_k=request.top_k
    )

    start_time = time.time()

    try:
        # Validate subscription tier
        try:
            tier_enum = SubscriptionTier(request.subscription_tier.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid subscription tier: {request.subscription_tier}"
            )

        # Find matches
        matches = await matcher.find_matches(
            user_id=request.user_id,
            jobs=request.jobs,
            resume_text=request.resume_text,
            cover_letter=request.cover_letter,
            linkedin_profile=request.linkedin_profile,
            subscription_tier=request.subscription_tier.lower(),
            top_k=request.top_k
        )

        # Apply additional probability filter if specified
        if request.min_probability is not None:
            matches = [
                m for m in matches
                if m.interview_probability >= request.min_probability
            ]

        # Convert to response format
        match_responses = [
            ProbabilityScoreResponse(
                match_id=m.id,
                user_id=m.user_id,
                job_id=m.job_id,
                interview_probability=m.interview_probability,
                interview_probability_percentage=m.interview_probability * 100,
                offer_probability=m.offer_probability,
                overall_score=m.overall_score,
                component_scores={
                    "skill_depth": m.skill_depth_score,
                    "experience_relevance": m.experience_relevance_score,
                    "seniority_match": m.seniority_match_score,
                    "industry_fit": m.industry_fit_score,
                    "education_match": m.education_match_score
                },
                threshold_met=m.threshold_met,
                requires_human_review=m.requires_human_review,
                subscription_tier=m.subscription_tier,
                strengths=m.strengths,
                critical_gaps=m.critical_gaps,
                minor_gaps=m.minor_gaps,
                job_title=m.metadata.get("job_title"),
                company=m.metadata.get("company")
            )
            for m in matches
        ]

        elapsed_ms = (time.time() - start_time) * 1000

        response = TopMatchesResponse(
            user_id=request.user_id,
            matches=match_responses,
            total_evaluated=len(request.jobs),
            total_matches=len(matches),
            subscription_tier=request.subscription_tier,
            tier_threshold=matcher.TIER_THRESHOLDS[tier_enum],
            search_metadata={
                "top_k": request.top_k,
                "processing_time_ms": round(elapsed_ms, 2),
                "min_probability_filter": request.min_probability
            }
        )

        logger.info(
            "Top matches found",
            user_id=request.user_id,
            total_matches=len(matches),
            elapsed_ms=elapsed_ms
        )

        return response

    except ValueError as e:
        logger.warning(
            "Validation error in find matches",
            user_id=request.user_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            "Failed to find matches",
            user_id=request.user_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find matches: {str(e)}"
        )


@router.get(
    "/explain/{match_id}",
    response_model=MatchExplanationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get detailed explanation for a match",
    description="""
    Get a detailed, AI-powered explanation of why a job matched and how to improve the match.

    Includes:
    - Detailed reasoning
    - Component analysis (skills, experience, etc.)
    - Gap analysis
    - Improvement recommendations
    - Application tips
    """
)
async def explain_match(
    match_id: str,
    matcher: InterviewProbabilityMatcher = Depends(get_matcher),
    current_user: CurrentUserDep = None
) -> MatchExplanationResponse:
    """
    Get detailed explanation for match.

    Args:
        match_id: Match result ID
        matcher: Probability matcher instance
        current_user: Current authenticated user (optional)

    Returns:
        Detailed match explanation
    """
    logger.info("Generating match explanation", match_id=match_id)

    try:
        # Generate explanation
        explanation = await matcher.explain_match(match_id)

        response = MatchExplanationResponse(
            explanation_id=explanation.id,
            match_id=explanation.match_id,
            summary=explanation.summary,
            detailed_reasoning=explanation.detailed_reasoning,
            skill_analysis=explanation.skill_analysis,
            experience_analysis=explanation.experience_analysis,
            gap_analysis=explanation.gap_analysis,
            strength_analysis=explanation.strength_analysis,
            improvement_recommendations=explanation.improvement_recommendations,
            application_tips=explanation.application_tips,
            confidence_score=explanation.confidence_score,
            data_completeness=explanation.data_completeness
        )

        logger.info(
            "Match explanation generated",
            match_id=match_id,
            explanation_id=explanation.id
        )

        return response

    except ValueError as e:
        logger.warning(
            "Match not found",
            match_id=match_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Match {match_id} not found"
        )

    except Exception as e:
        logger.error(
            "Failed to generate explanation",
            match_id=match_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate explanation: {str(e)}"
        )


@router.post(
    "/feedback",
    response_model=FeedbackRecordedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record match outcome feedback",
    description="""
    Record the actual outcome of a job application for continuous learning.

    This feedback is used to:
    - Retrain the matching model
    - Improve prediction accuracy
    - Calibrate probability scores

    Outcomes: rejected, interview, offer, accepted, declined
    """,
    dependencies=[Depends(standard_rate_limiter)]
)
async def record_feedback(
    request: RecordFeedbackRequest,
    matcher: InterviewProbabilityMatcher = Depends(get_matcher),
    current_user: CurrentUserDep = None
) -> FeedbackRecordedResponse:
    """
    Record match outcome feedback.

    Args:
        request: Feedback request
        matcher: Probability matcher instance
        current_user: Current authenticated user (optional)

    Returns:
        Feedback confirmation
    """
    logger.info(
        "Recording match feedback",
        match_id=request.match_id,
        outcome=request.outcome
    )

    try:
        # Validate outcome
        try:
            outcome_enum = OutcomeType(request.outcome.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid outcome: {request.outcome}. Must be one of: rejected, interview, offer, accepted, declined"
            )

        # Record feedback
        feedback = matcher.record_feedback(
            match_id=request.match_id,
            outcome=outcome_enum,
            user_id=request.user_id,
            job_id=request.job_id,
            applied_at=request.applied_at,
            response_received_at=request.response_received_at,
            interview_rounds=request.interview_rounds,
            offer_received=request.offer_received,
            user_rating=request.user_rating,
            user_comments=request.user_comments
        )

        response = FeedbackRecordedResponse(
            feedback_id=feedback.id,
            match_id=feedback.match_id,
            outcome=feedback.actual_outcome.value,
            predicted_probability=feedback.predicted_probability,
            use_for_training=feedback.use_for_training,
            message="Feedback recorded successfully and will be used to improve future predictions"
        )

        logger.info(
            "Feedback recorded",
            feedback_id=feedback.id,
            match_id=request.match_id,
            outcome=request.outcome
        )

        return response

    except ValueError as e:
        logger.warning(
            "Validation error in feedback recording",
            match_id=request.match_id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        logger.error(
            "Failed to record feedback",
            match_id=request.match_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record feedback: {str(e)}"
        )


@router.get(
    "/thresholds",
    response_model=AllThresholdsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get all subscription tier thresholds",
    description="""
    Get interview probability thresholds for all subscription tiers.

    Shows what minimum probability is required for each tier to auto-apply.
    """
)
async def get_all_thresholds(
    matcher: InterviewProbabilityMatcher = Depends(get_matcher)
) -> AllThresholdsResponse:
    """
    Get all tier thresholds.

    Args:
        matcher: Probability matcher instance

    Returns:
        All tier thresholds
    """
    tier_features = {
        "freemium": ["Preview only", "80%+ matches", "Limited applications"],
        "starter": ["70%+ matches", "100 applications/month", "Email support"],
        "basic": ["65%+ matches", "300 applications/month", "Priority support"],
        "professional": ["60%+ matches", "Unlimited applications", "Priority support", "Analytics"],
        "premium": ["55%+ matches", "Human review", "Unlimited applications", "Premium support"],
        "elite": ["55%+ matches", "Human review", "Dedicated account manager", "Custom features"]
    }

    thresholds = {}
    for tier, threshold in matcher.TIER_THRESHOLDS.items():
        thresholds[tier.value] = ThresholdInfoResponse(
            tier=tier.value,
            threshold=threshold,
            threshold_percentage=threshold * 100,
            features=tier_features.get(tier.value, [])
        )

    return AllThresholdsResponse(thresholds=thresholds)


@router.get(
    "/thresholds/{tier}",
    response_model=ThresholdInfoResponse,
    status_code=status.HTTP_200_OK,
    summary="Get threshold for specific tier",
    description="""
    Get interview probability threshold for a specific subscription tier.
    """
)
async def get_tier_threshold(
    tier: str,
    matcher: InterviewProbabilityMatcher = Depends(get_matcher)
) -> ThresholdInfoResponse:
    """
    Get threshold for specific tier.

    Args:
        tier: Subscription tier name
        matcher: Probability matcher instance

    Returns:
        Tier threshold info
    """
    try:
        tier_enum = SubscriptionTier(tier.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invalid tier: {tier}"
        )

    tier_features = {
        "freemium": ["Preview only", "80%+ matches", "Limited applications"],
        "starter": ["70%+ matches", "100 applications/month", "Email support"],
        "basic": ["65%+ matches", "300 applications/month", "Priority support"],
        "professional": ["60%+ matches", "Unlimited applications", "Priority support", "Analytics"],
        "premium": ["55%+ matches", "Human review", "Unlimited applications", "Premium support"],
        "elite": ["55%+ matches", "Human review", "Dedicated account manager", "Custom features"]
    }

    threshold = matcher.TIER_THRESHOLDS[tier_enum]

    return ThresholdInfoResponse(
        tier=tier_enum.value,
        threshold=threshold,
        threshold_percentage=threshold * 100,
        features=tier_features.get(tier_enum.value, [])
    )
