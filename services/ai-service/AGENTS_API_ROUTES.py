"""
API Routes for AI Agents
Copy this file to: services/ai-service/src/api/routes/agents.py
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, status, Request
import structlog

from ...agents import (
    CompetitiveAnalysisAgent,
    FraudDetectionAgent,
    EmotionalIntelligenceAgent,
    MultiLanguageAgent
)
from ...agents.competitive_analysis import (
    CompetitiveAnalysisRequest,
    CompetitiveAnalysisResponse,
    AnalysisDepth
)
from ...agents.fraud_detection import (
    FraudDetectionRequest,
    FraudDetectionResponse
)
from ...agents.emotional_intelligence import (
    EmotionalIntelligenceRequest,
    EmotionalIntelligenceResponse
)
from ...agents.multi_language import (
    MultiLanguageRequest,
    MultiLanguageResponse
)

logger = structlog.get_logger()

router = APIRouter()


# Dependency to get agents from app state
def get_competitive_analysis_agent(request: Request) -> CompetitiveAnalysisAgent:
    """Get Competitive Analysis Agent from app state."""
    return request.app.state.competitive_analysis_agent


def get_fraud_detection_agent(request: Request) -> FraudDetectionAgent:
    """Get Fraud Detection Agent from app state."""
    return request.app.state.fraud_detection_agent


def get_emotional_intelligence_agent(request: Request) -> EmotionalIntelligenceAgent:
    """Get Emotional Intelligence Agent from app state."""
    return request.app.state.emotional_intelligence_agent


def get_multi_language_agent(request: Request) -> MultiLanguageAgent:
    """Get Multi-Language Agent from app state."""
    return request.app.state.multi_language_agent


@router.post(
    "/competitive-analysis",
    response_model=CompetitiveAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze job application competition",
    description="""
    Analyze the competitive landscape for a job application.

    Provides:
    - Estimated applicant pool size and distribution
    - User's competitive positioning
    - Success factors and recommendations
    - Strategic insights for improving application success
    """,
)
async def analyze_competition(
    request: CompetitiveAnalysisRequest,
    agent: CompetitiveAnalysisAgent = Depends(get_competitive_analysis_agent),
) -> CompetitiveAnalysisResponse:
    """
    Perform competitive analysis for a job application.

    Args:
        request: Competitive analysis request with job ID and user profile
        agent: Competitive Analysis Agent (injected)

    Returns:
        Competitive analysis results with recommendations
    """
    try:
        logger.info(
            "Competitive analysis requested",
            job_id=request.job_id,
            analysis_depth=request.analysis_depth
        )

        # In a real implementation, you would fetch job details from job-service
        # For now, we'll use mock data
        job_details = {
            "id": request.job_id,
            "title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "location": "San Francisco, CA",
            "description": "We are looking for an experienced software engineer...",
            "required_skills": ["Python", "AWS", "Docker"],
            "required_experience": "5+ years",
            "salary_range": "$120k-$180k",
            "company_size": "1000+",
            "industry": "Technology",
            "remote": True
        }

        result = await agent.analyze_competition(
            job_id=request.job_id,
            user_profile=request.user_profile,
            job_details=job_details,
            analysis_depth=request.analysis_depth
        )

        logger.info(
            "Competitive analysis completed",
            job_id=request.job_id,
            competition_level=result.competition_level
        )

        return result

    except Exception as e:
        logger.error(
            "Competitive analysis failed",
            job_id=request.job_id,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Competitive analysis failed: {str(e)}"
        )


@router.post(
    "/fraud-detection",
    response_model=FraudDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect fraudulent job postings",
    description="""
    Analyze a job posting for fraud indicators and authenticity.

    Provides:
    - Authenticity score (0-100)
    - Risk level classification
    - Identified red flags
    - Company verification results
    - Actionable recommendations
    """,
)
async def detect_fraud(
    request: FraudDetectionRequest,
    agent: FraudDetectionAgent = Depends(get_fraud_detection_agent),
) -> FraudDetectionResponse:
    """
    Perform fraud detection analysis on a job posting.

    Args:
        request: Fraud detection request with job details
        agent: Fraud Detection Agent (injected)

    Returns:
        Fraud detection results with risk assessment
    """
    try:
        logger.info(
            "Fraud detection requested",
            company=request.company_name,
            title=request.job_title
        )

        result = await agent.detect_fraud(
            job_title=request.job_title,
            company_name=request.company_name,
            description=request.description,
            source=request.source,
            url=str(request.url) if request.url else None,
            contact_email=request.contact_email,
            salary_range=request.salary_range,
            location=request.location,
            company_website=str(request.company_website) if request.company_website else None
        )

        logger.info(
            "Fraud detection completed",
            company=request.company_name,
            risk_level=result.risk_level,
            authenticity_score=result.authenticity_score
        )

        return result

    except Exception as e:
        logger.error(
            "Fraud detection failed",
            company=request.company_name,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fraud detection failed: {str(e)}"
        )


@router.post(
    "/emotional-intelligence",
    response_model=EmotionalIntelligenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Optimize communication with emotional intelligence",
    description="""
    Analyze and optimize professional communication for tone, sentiment, and cultural appropriateness.

    Provides:
    - Sentiment and tone analysis
    - Optimized content
    - Cultural sensitivity assessment
    - Communication coaching recommendations
    """,
)
async def analyze_emotional_intelligence(
    request: EmotionalIntelligenceRequest,
    agent: EmotionalIntelligenceAgent = Depends(get_emotional_intelligence_agent),
) -> EmotionalIntelligenceResponse:
    """
    Analyze and optimize communication content.

    Args:
        request: Emotional intelligence request with content to optimize
        agent: Emotional Intelligence Agent (injected)

    Returns:
        Analysis results with optimized content
    """
    try:
        logger.info(
            "Emotional intelligence analysis requested",
            context=request.context,
            content_length=len(request.content)
        )

        result = await agent.analyze_and_optimize(
            content=request.content,
            context=request.context,
            recipient_info=request.recipient_info,
            desired_tone=request.desired_tone,
            cultural_context=request.cultural_context
        )

        logger.info(
            "Emotional intelligence analysis completed",
            context=request.context,
            alignment_score=result.alignment_score
        )

        return result

    except Exception as e:
        logger.error(
            "Emotional intelligence analysis failed",
            context=request.context,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Emotional intelligence analysis failed: {str(e)}"
        )


@router.post(
    "/translate",
    response_model=MultiLanguageResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate and localize content",
    description="""
    Translate and localize professional content for target language and market.

    Provides:
    - Professional translation
    - Cultural adaptation
    - Local format compliance
    - Keyword optimization for target market
    - Quality metrics and alternatives
    """,
)
async def translate_content(
    request: MultiLanguageRequest,
    agent: MultiLanguageAgent = Depends(get_multi_language_agent),
) -> MultiLanguageResponse:
    """
    Translate and localize content.

    Args:
        request: Multi-language request with content to translate
        agent: Multi-Language Agent (injected)

    Returns:
        Translated and localized content with quality metrics
    """
    try:
        logger.info(
            "Translation requested",
            content_type=request.content_type,
            source_language=request.source_language,
            target_language=request.target_language
        )

        result = await agent.translate_and_localize(
            content=request.content,
            content_type=request.content_type,
            source_language=request.source_language,
            target_language=request.target_language,
            target_country=request.target_country,
            localization_level=request.localization_level,
            preserve_formatting=request.preserve_formatting,
            optimize_keywords=request.optimize_keywords,
            industry=request.industry
        )

        logger.info(
            "Translation completed",
            source_language=request.source_language,
            target_language=request.target_language,
            quality_score=result.quality_metrics.overall_quality
        )

        return result

    except Exception as e:
        logger.error(
            "Translation failed",
            source_language=request.source_language,
            target_language=request.target_language,
            error=str(e),
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )


# Health check endpoint for agents
@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Agent health check",
    description="Check if all AI agents are operational",
)
async def agents_health_check(
    request: Request,
) -> Dict[str, Any]:
    """
    Health check for AI agents.

    Returns:
        Health status of all agents
    """
    try:
        agents_status = {
            "competitive_analysis": hasattr(request.app.state, "competitive_analysis_agent"),
            "fraud_detection": hasattr(request.app.state, "fraud_detection_agent"),
            "emotional_intelligence": hasattr(request.app.state, "emotional_intelligence_agent"),
            "multi_language": hasattr(request.app.state, "multi_language_agent"),
        }

        all_healthy = all(agents_status.values())

        return {
            "status": "healthy" if all_healthy else "degraded",
            "agents": agents_status,
            "message": "All agents operational" if all_healthy else "Some agents unavailable"
        }

    except Exception as e:
        logger.error(f"Health check failed: {e}", exc_info=True)
        return {
            "status": "unhealthy",
            "agents": {},
            "message": f"Health check failed: {str(e)}"
        }
