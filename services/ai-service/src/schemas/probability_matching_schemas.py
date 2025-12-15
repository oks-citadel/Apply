"""
Request and response schemas for interview probability matching endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# Request Schemas
class CalculateProbabilityRequest(BaseModel):
    """Request for calculating interview probability."""

    user_id: str = Field(..., description="User ID")
    job_id: str = Field(..., description="Job ID")

    # Job requirements
    job_requirements: Dict[str, Any] = Field(
        ...,
        description="Job requirements including skills, experience, etc."
    )

    # Candidate data
    resume_text: Optional[str] = Field(None, description="Resume text content")
    cover_letter: Optional[str] = Field(None, description="Cover letter text")
    linkedin_profile: Optional[Dict[str, Any]] = Field(None, description="LinkedIn profile data")

    # User metadata
    subscription_tier: str = Field(
        default="basic",
        description="User's subscription tier: freemium, starter, basic, professional, premium, elite"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "job_id": "job_456",
                "job_requirements": {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "description": "We are looking for a senior engineer...",
                    "required_skills": ["Python", "AWS", "Docker"],
                    "preferred_skills": ["Kubernetes", "React"],
                    "min_experience_years": 5,
                    "max_experience_years": 10,
                    "seniority_level": "senior",
                    "industry": "Technology",
                    "education_level": 3
                },
                "resume_text": "John Doe\nSenior Software Engineer\n...",
                "subscription_tier": "professional"
            }
        }


class FindMatchesRequest(BaseModel):
    """Request for finding top matching jobs."""

    user_id: str = Field(..., description="User ID")
    jobs: List[Dict[str, Any]] = Field(..., description="List of job postings to evaluate")

    # Candidate data
    resume_text: Optional[str] = Field(None, description="Resume text content")
    cover_letter: Optional[str] = Field(None, description="Cover letter text")
    linkedin_profile: Optional[Dict[str, Any]] = Field(None, description="LinkedIn profile data")

    # Filter options
    subscription_tier: str = Field(default="basic", description="User's subscription tier")
    top_k: int = Field(default=20, ge=1, le=100, description="Number of top matches to return")
    min_probability: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Minimum interview probability filter"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "jobs": [
                    {
                        "id": "job_1",
                        "title": "Software Engineer",
                        "company": "Tech Corp",
                        "required_skills": ["Python", "AWS"],
                        "min_experience_years": 3
                    }
                ],
                "resume_text": "John Doe\nSoftware Engineer...",
                "subscription_tier": "professional",
                "top_k": 20
            }
        }


class ExplainMatchRequest(BaseModel):
    """Request for match explanation."""

    match_id: str = Field(..., description="Match result ID to explain")

    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "match_123abc"
            }
        }


class RecordFeedbackRequest(BaseModel):
    """Request for recording match outcome feedback."""

    match_id: str = Field(..., description="Match result ID")
    user_id: str = Field(..., description="User ID")
    job_id: str = Field(..., description="Job ID")

    # Outcome
    outcome: str = Field(
        ...,
        description="Outcome: rejected, interview, offer, accepted, declined"
    )

    # Timing
    applied_at: Optional[datetime] = Field(None, description="When application was submitted")
    response_received_at: Optional[datetime] = Field(None, description="When response was received")

    # Interview details
    interview_rounds: Optional[int] = Field(None, ge=0, description="Number of interview rounds")
    offer_received: bool = Field(default=False, description="Whether offer was received")
    offer_accepted: Optional[bool] = Field(None, description="Whether offer was accepted")

    # User feedback
    user_rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="User rating (1-5)")
    user_comments: Optional[str] = Field(None, description="User comments")

    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "match_123abc",
                "user_id": "user_123",
                "job_id": "job_456",
                "outcome": "interview",
                "applied_at": "2024-01-15T10:00:00Z",
                "response_received_at": "2024-01-20T14:30:00Z",
                "interview_rounds": 3,
                "offer_received": True,
                "user_rating": 4.5,
                "user_comments": "Great match, got the offer!"
            }
        }


# Response Schemas
class ProbabilityScoreResponse(BaseModel):
    """Response with probability scores."""

    match_id: str = Field(description="Unique match ID")
    user_id: str = Field(description="User ID")
    job_id: str = Field(description="Job ID")

    # Probability scores
    interview_probability: float = Field(
        ge=0.0,
        le=1.0,
        description="Probability of getting interview (0-1)"
    )
    interview_probability_percentage: float = Field(
        ge=0.0,
        le=100.0,
        description="Interview probability as percentage"
    )
    offer_probability: float = Field(
        ge=0.0,
        le=1.0,
        description="Probability of getting offer (0-1)"
    )
    overall_score: float = Field(
        ge=0.0,
        le=100.0,
        description="Overall match score (0-100%)"
    )

    # Component scores
    component_scores: Dict[str, float] = Field(
        description="Breakdown of component scores"
    )

    # Match status
    threshold_met: bool = Field(description="Whether match meets tier threshold")
    requires_human_review: bool = Field(description="Whether human review is recommended")
    subscription_tier: str = Field(description="User's subscription tier")

    # Analysis
    strengths: List[str] = Field(description="Identified strengths")
    critical_gaps: List[str] = Field(description="Critical gaps")
    minor_gaps: List[str] = Field(description="Minor gaps")

    # Metadata
    job_title: Optional[str] = Field(None, description="Job title")
    company: Optional[str] = Field(None, description="Company name")
    calculated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "match_id": "match_123abc",
                "user_id": "user_123",
                "job_id": "job_456",
                "interview_probability": 0.75,
                "interview_probability_percentage": 75.0,
                "offer_probability": 0.19,
                "overall_score": 73.5,
                "component_scores": {
                    "skill_depth": 0.85,
                    "experience_relevance": 0.90,
                    "seniority_match": 0.80,
                    "industry_fit": 0.60,
                    "education_match": 1.0
                },
                "threshold_met": True,
                "requires_human_review": False,
                "subscription_tier": "professional",
                "strengths": [
                    "Excellent skill match",
                    "Experience level is ideal"
                ],
                "critical_gaps": [],
                "minor_gaps": ["Kubernetes"],
                "job_title": "Senior Software Engineer",
                "company": "Tech Corp"
            }
        }


class MatchExplanationResponse(BaseModel):
    """Detailed explanation of match result."""

    explanation_id: str = Field(description="Unique explanation ID")
    match_id: str = Field(description="Associated match ID")

    # Summary
    summary: str = Field(description="High-level match summary")
    detailed_reasoning: str = Field(description="Detailed reasoning")

    # Component analysis
    skill_analysis: str = Field(description="Skill match analysis")
    experience_analysis: str = Field(description="Experience analysis")
    gap_analysis: str = Field(description="Gap analysis")
    strength_analysis: str = Field(description="Strength analysis")

    # Recommendations
    improvement_recommendations: List[str] = Field(
        description="How to improve match score"
    )
    application_tips: List[str] = Field(
        description="Tips for applying to this job"
    )

    # Confidence
    confidence_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence in prediction"
    )
    data_completeness: float = Field(
        ge=0.0,
        le=1.0,
        description="Completeness of input data"
    )

    generated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_schema_extra = {
            "example": {
                "explanation_id": "exp_789xyz",
                "match_id": "match_123abc",
                "summary": "Strong match with 75% interview probability",
                "detailed_reasoning": "This is a strong match because...",
                "skill_analysis": "Candidate demonstrates excellent skill alignment...",
                "experience_analysis": "Experience level is ideal for this position...",
                "gap_analysis": "Minor gaps in Kubernetes experience...",
                "strength_analysis": "Key strengths include deep Python expertise...",
                "improvement_recommendations": [
                    "Highlight AWS experience in cover letter",
                    "Quantify achievements in recent roles"
                ],
                "application_tips": [
                    "Apply with confidence - this is a strong match",
                    "Customize resume to emphasize cloud experience"
                ],
                "confidence_score": 0.85,
                "data_completeness": 0.90
            }
        }


class TopMatchesResponse(BaseModel):
    """Response with top matching jobs."""

    user_id: str = Field(description="User ID")
    matches: List[ProbabilityScoreResponse] = Field(description="Top matching jobs")
    total_evaluated: int = Field(description="Total jobs evaluated")
    total_matches: int = Field(description="Number of matches meeting threshold")
    subscription_tier: str = Field(description="User's subscription tier")
    tier_threshold: float = Field(description="Threshold for this tier")

    search_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Search metadata"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "user_123",
                "matches": [],
                "total_evaluated": 50,
                "total_matches": 12,
                "subscription_tier": "professional",
                "tier_threshold": 0.60,
                "search_metadata": {
                    "top_k": 20,
                    "processing_time_ms": 1250
                }
            }
        }


class FeedbackRecordedResponse(BaseModel):
    """Response for recorded feedback."""

    feedback_id: str = Field(description="Unique feedback ID")
    match_id: str = Field(description="Associated match ID")
    outcome: str = Field(description="Recorded outcome")
    predicted_probability: float = Field(description="Originally predicted probability")
    use_for_training: bool = Field(description="Will be used for training")

    message: str = Field(
        default="Feedback recorded successfully",
        description="Status message"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "feedback_id": "feedback_123",
                "match_id": "match_123abc",
                "outcome": "interview",
                "predicted_probability": 0.75,
                "use_for_training": True,
                "message": "Feedback recorded successfully"
            }
        }


class ThresholdInfoResponse(BaseModel):
    """Response with tier threshold information."""

    tier: str = Field(description="Subscription tier")
    threshold: float = Field(description="Interview probability threshold")
    threshold_percentage: float = Field(description="Threshold as percentage")
    features: List[str] = Field(description="Features for this tier")

    class Config:
        json_schema_extra = {
            "example": {
                "tier": "professional",
                "threshold": 0.60,
                "threshold_percentage": 60.0,
                "features": [
                    "60%+ match threshold",
                    "Unlimited applications",
                    "Priority support"
                ]
            }
        }


class AllThresholdsResponse(BaseModel):
    """Response with all tier thresholds."""

    thresholds: Dict[str, ThresholdInfoResponse] = Field(
        description="Thresholds by tier"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "thresholds": {
                    "freemium": {
                        "tier": "freemium",
                        "threshold": 0.80,
                        "threshold_percentage": 80.0,
                        "features": ["Preview only", "80%+ matches"]
                    }
                }
            }
        }
