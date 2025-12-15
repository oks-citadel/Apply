"""
Database models for interview probability matching.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum


class OutcomeType(str, Enum):
    """Application outcome types for training data."""
    REJECTED = "rejected"
    INTERVIEW = "interview"
    OFFER = "offer"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class SubscriptionTier(str, Enum):
    """Subscription tier levels."""
    FREEMIUM = "freemium"
    STARTER = "starter"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    PREMIUM = "premium"
    ELITE = "elite"


# Since this is a Python-only service without database ORM,
# we'll use Pydantic models for data validation and structure
from pydantic import BaseModel, Field


class MatchResult(BaseModel):
    """Interview probability match result stored in database."""

    id: str = Field(description="Unique match ID")
    user_id: str = Field(description="User ID")
    job_id: str = Field(description="Job ID")

    # Probability scores
    interview_probability: float = Field(ge=0.0, le=1.0, description="Probability of getting interview")
    offer_probability: float = Field(ge=0.0, le=1.0, description="Probability of getting offer")
    overall_score: float = Field(ge=0.0, le=100.0, description="Overall match score (0-100%)")

    # Component scores
    skill_depth_score: float = Field(ge=0.0, le=1.0, description="Skill depth match score")
    experience_relevance_score: float = Field(ge=0.0, le=1.0, description="Experience relevance score")
    seniority_match_score: float = Field(ge=0.0, le=1.0, description="Seniority level match score")
    industry_fit_score: float = Field(ge=0.0, le=1.0, description="Industry fit score")
    education_match_score: float = Field(ge=0.0, le=1.0, description="Education match score")

    # Gap analysis
    critical_gaps: List[str] = Field(default_factory=list, description="Critical skill gaps")
    minor_gaps: List[str] = Field(default_factory=list, description="Minor skill gaps")
    strengths: List[str] = Field(default_factory=list, description="Key strengths")

    # Metadata
    subscription_tier: str = Field(description="User's subscription tier")
    threshold_met: bool = Field(description="Whether threshold was met for auto-apply")
    requires_human_review: bool = Field(default=False, description="Requires human review")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Additional data
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class MatchExplanation(BaseModel):
    """Detailed explanation for a match result."""

    id: str = Field(description="Unique explanation ID")
    match_id: str = Field(description="Associated match ID")

    # Overall explanation
    summary: str = Field(description="High-level match summary")
    detailed_reasoning: str = Field(description="Detailed explanation of match score")

    # Component explanations
    skill_analysis: str = Field(description="Analysis of skill match")
    experience_analysis: str = Field(description="Analysis of experience match")
    gap_analysis: str = Field(description="Analysis of identified gaps")
    strength_analysis: str = Field(description="Analysis of key strengths")

    # Recommendations
    improvement_recommendations: List[str] = Field(default_factory=list, description="How to improve match")
    application_tips: List[str] = Field(default_factory=list, description="Tips for application")

    # Confidence indicators
    confidence_score: float = Field(ge=0.0, le=1.0, description="Confidence in prediction")
    data_completeness: float = Field(ge=0.0, le=1.0, description="Completeness of input data")

    created_at: datetime = Field(default_factory=datetime.utcnow)


class MatchFeedback(BaseModel):
    """Feedback on match outcome for retraining."""

    id: str = Field(description="Unique feedback ID")
    match_id: str = Field(description="Associated match ID")
    user_id: str = Field(description="User ID")
    job_id: str = Field(description="Job ID")

    # Predicted vs actual
    predicted_probability: float = Field(description="Predicted interview probability")
    actual_outcome: OutcomeType = Field(description="Actual outcome")

    # Timing data
    applied_at: Optional[datetime] = Field(None, description="When application was submitted")
    response_received_at: Optional[datetime] = Field(None, description="When response was received")
    days_to_response: Optional[int] = Field(None, description="Days until response")

    # Outcome details
    interview_rounds: Optional[int] = Field(None, description="Number of interview rounds")
    offer_received: bool = Field(default=False, description="Whether offer was received")
    offer_accepted: Optional[bool] = Field(None, description="Whether offer was accepted")

    # User feedback
    user_rating: Optional[float] = Field(None, ge=1.0, le=5.0, description="User rating of match quality")
    user_comments: Optional[str] = Field(None, description="User comments on match")

    # Training flags
    use_for_training: bool = Field(default=True, description="Use this feedback for retraining")
    verified: bool = Field(default=False, description="Feedback has been verified")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class TrainingDataPoint(BaseModel):
    """Single training data point for model retraining."""

    # Input features
    skill_overlap: float = Field(description="Percentage of required skills possessed")
    skill_depth: float = Field(description="Depth of skill expertise")
    experience_years: int = Field(description="Years of relevant experience")
    seniority_gap: int = Field(description="Gap in seniority level (-2 to +2)")
    industry_match: bool = Field(description="Industry experience match")
    education_level: int = Field(description="Education level (1-5)")
    education_match: bool = Field(description="Education requirement match")

    # Advanced features
    keyword_density: float = Field(description="Relevant keyword density in resume")
    recent_experience_relevance: float = Field(description="Relevance of recent experience")
    company_size_match: bool = Field(description="Similar company size experience")
    location_match: bool = Field(description="Location compatibility")

    # Target variable
    outcome_score: float = Field(description="Outcome score: 0=rejected, 0.5=interview, 1.0=offer")

    # Metadata
    weight: float = Field(default=1.0, description="Weight for training (recent = higher)")
    source: str = Field(description="Source of training data")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ModelMetrics(BaseModel):
    """Model performance metrics."""

    model_version: str = Field(description="Model version")
    trained_at: datetime = Field(description="When model was trained")

    # Performance metrics
    accuracy: float = Field(description="Overall accuracy")
    precision: float = Field(description="Precision score")
    recall: float = Field(description="Recall score")
    f1_score: float = Field(description="F1 score")
    auc_roc: float = Field(description="AUC-ROC score")

    # Calibration metrics
    calibration_error: float = Field(description="Calibration error")
    brier_score: float = Field(description="Brier score for probability accuracy")

    # Training data stats
    training_samples: int = Field(description="Number of training samples")
    validation_samples: int = Field(description="Number of validation samples")
    test_samples: int = Field(description="Number of test samples")

    # Feature importance
    top_features: List[Dict[str, float]] = Field(description="Top important features")

    metadata: Dict[str, Any] = Field(default_factory=dict)
