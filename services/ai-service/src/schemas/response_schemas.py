"""
Response schemas for AI Service API endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# Resume Response Schemas
class ParsedResume(BaseModel):
    """Response schema for parsed resume."""

    id: str
    contact_info: Dict[str, Any] = Field(description="Extracted contact information")
    summary: Optional[str] = Field(None, description="Professional summary")
    experience: List[Dict[str, Any]] = Field(description="Work experience")
    education: List[Dict[str, Any]] = Field(description="Education history")
    skills: List[str] = Field(description="Extracted skills")
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    languages: List[Dict[str, str]] = Field(default_factory=list)
    parsed_at: datetime = Field(default_factory=datetime.utcnow)
    confidence_score: float = Field(description="Parsing confidence score")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "resume_123",
                "contact_info": {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890",
                },
                "summary": "Experienced software engineer...",
                "experience": [
                    {
                        "title": "Senior Developer",
                        "company": "Tech Corp",
                        "duration": "2020-2024",
                    }
                ],
                "education": [{"degree": "BS Computer Science", "school": "MIT"}],
                "skills": ["Python", "AWS", "Docker"],
                "confidence_score": 0.95,
            }
        }


class OptimizedResume(BaseModel):
    """Response schema for optimized resume."""

    original_resume_id: str
    optimized_content: str = Field(description="Optimized resume content")
    changes: List[Dict[str, Any]] = Field(description="List of changes made")
    ats_score_before: float = Field(description="ATS score before optimization")
    ats_score_after: float = Field(description="ATS score after optimization")
    improvement_percentage: float = Field(description="Percentage improvement")
    recommendations: List[str] = Field(description="Additional recommendations")

    class Config:
        json_schema_extra = {
            "example": {
                "original_resume_id": "resume_123",
                "optimized_content": "Optimized resume text...",
                "changes": [
                    {
                        "type": "keyword_addition",
                        "section": "skills",
                        "description": "Added 'Docker'",
                    }
                ],
                "ats_score_before": 65.0,
                "ats_score_after": 85.0,
                "improvement_percentage": 30.77,
                "recommendations": ["Add more quantified achievements"],
            }
        }


class ATSScore(BaseModel):
    """Response schema for ATS score."""

    overall_score: float = Field(ge=0.0, le=100.0, description="Overall ATS score")
    keyword_match_score: float = Field(description="Keyword matching score")
    formatting_score: float = Field(description="Formatting score")
    completeness_score: float = Field(description="Section completeness score")
    matched_keywords: List[str] = Field(description="Matched keywords")
    missing_keywords: List[str] = Field(description="Missing important keywords")
    recommendations: List[str] = Field(description="Improvement recommendations")
    estimated_ranking: str = Field(description="Estimated ranking: excellent, good, fair, poor")

    class Config:
        json_schema_extra = {
            "example": {
                "overall_score": 75.5,
                "keyword_match_score": 80.0,
                "formatting_score": 70.0,
                "completeness_score": 75.0,
                "matched_keywords": ["Python", "AWS", "Docker"],
                "missing_keywords": ["Kubernetes", "CI/CD"],
                "recommendations": ["Add missing keywords", "Quantify achievements"],
                "estimated_ranking": "good",
            }
        }


class GeneratedSection(BaseModel):
    """Response schema for generated resume section."""

    section_type: str
    content: str = Field(description="Generated content")
    alternatives: List[str] = Field(description="Alternative versions")
    word_count: int = Field(description="Word count")

    class Config:
        json_schema_extra = {
            "example": {
                "section_type": "summary",
                "content": "Results-driven software engineer with 5+ years...",
                "alternatives": ["Innovative developer...", "Experienced technologist..."],
                "word_count": 45,
            }
        }


class EnhancedResume(BaseModel):
    """Response schema for enhanced resume."""

    enhanced_content: str = Field(description="Enhanced resume content")
    enhancements: List[Dict[str, Any]] = Field(description="List of enhancements made")
    quality_score: float = Field(ge=0.0, le=100.0, description="Quality score")


# Matching Response Schemas
class MatchScore(BaseModel):
    """Match score breakdown."""

    overall_score: float = Field(ge=0.0, le=1.0, description="Overall match score")
    skill_match_score: float = Field(description="Skills match score")
    experience_match_score: float = Field(description="Experience match score")
    location_match_score: float = Field(description="Location match score")
    culture_match_score: float = Field(description="Culture fit score")
    explanation: str = Field(description="Human-readable explanation")
    strengths: List[str] = Field(description="Match strengths")
    gaps: List[str] = Field(description="Identified gaps")

    class Config:
        json_schema_extra = {
            "example": {
                "overall_score": 0.82,
                "skill_match_score": 0.85,
                "experience_match_score": 0.90,
                "location_match_score": 1.0,
                "culture_match_score": 0.70,
                "explanation": "Strong match based on skills and experience...",
                "strengths": ["Exact skill match", "Experience exceeds requirement"],
                "gaps": ["Some cultural fit concerns"],
            }
        }


class JobMatch(BaseModel):
    """Job match result."""

    job_id: str
    job_title: str
    company_name: str
    match_score: float = Field(ge=0.0, le=1.0)
    score_breakdown: MatchScore
    location: Optional[str] = None
    salary_range: Optional[Dict[str, Any]] = None
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    relevance_explanation: str

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_456",
                "job_title": "Senior Software Engineer",
                "company_name": "Tech Corp",
                "match_score": 0.85,
                "location": "San Francisco, CA",
                "matched_skills": ["Python", "AWS", "Docker"],
                "missing_skills": ["Kubernetes"],
                "relevance_explanation": "Excellent match for your background...",
            }
        }


class CandidateMatch(BaseModel):
    """Candidate match result."""

    candidate_id: str
    candidate_name: str
    current_title: Optional[str] = None
    match_score: float = Field(ge=0.0, le=1.0)
    score_breakdown: MatchScore
    experience_years: int
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    availability: Optional[str] = None
    relevance_explanation: str

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "candidate_123",
                "candidate_name": "John Doe",
                "current_title": "Software Engineer",
                "match_score": 0.88,
                "experience_years": 5,
                "matched_skills": ["Python", "AWS"],
                "missing_skills": ["Go"],
                "relevance_explanation": "Strong candidate with relevant experience...",
            }
        }


class MatchJobsResponse(BaseModel):
    """Response schema for job matching."""

    candidate_id: str
    matches: List[JobMatch]
    total_matches: int
    filters_applied: Dict[str, Any]
    search_metadata: Dict[str, Any] = Field(default_factory=dict)


class MatchCandidatesResponse(BaseModel):
    """Response schema for candidate matching."""

    job_id: str
    matches: List[CandidateMatch]
    total_matches: int
    filters_applied: Dict[str, Any]
    search_metadata: Dict[str, Any] = Field(default_factory=dict)


class MatchExplanation(BaseModel):
    """Detailed match explanation."""

    match_id: str
    candidate_id: str
    job_id: str
    overall_score: float
    detailed_breakdown: Dict[str, Any]
    reasoning: str = Field(description="Detailed reasoning for the match")
    improvement_suggestions: List[str] = Field(description="How to improve the match")


# Prediction Response Schemas
class SalaryPrediction(BaseModel):
    """Response schema for salary prediction."""

    predicted_salary: float = Field(description="Predicted salary")
    confidence_interval: Dict[str, float] = Field(
        description="95% confidence interval: min and max"
    )
    percentile_25: float = Field(description="25th percentile salary")
    percentile_50: float = Field(description="Median salary")
    percentile_75: float = Field(description="75th percentile salary")
    market_context: str = Field(description="Market context explanation")
    factors: List[Dict[str, Any]] = Field(description="Factors affecting prediction")
    data_sources: List[str] = Field(description="Data sources used")

    class Config:
        json_schema_extra = {
            "example": {
                "predicted_salary": 150000,
                "confidence_interval": {"min": 135000, "max": 165000},
                "percentile_25": 140000,
                "percentile_50": 150000,
                "percentile_75": 160000,
                "market_context": "Above average for San Francisco market...",
                "factors": [
                    {"factor": "experience", "impact": "high", "value": "5 years"}
                ],
                "data_sources": ["Bureau of Labor Statistics", "Industry surveys"],
            }
        }


class SuccessPrediction(BaseModel):
    """Response schema for application success prediction."""

    success_probability: float = Field(ge=0.0, le=1.0, description="Success probability")
    confidence_score: float = Field(ge=0.0, le=1.0, description="Prediction confidence")
    risk_level: str = Field(description="Risk level: low, medium, high")
    positive_factors: List[str] = Field(description="Factors increasing success")
    negative_factors: List[str] = Field(description="Factors decreasing success")
    recommendations: List[str] = Field(description="Recommendations to improve chances")
    estimated_competition: Dict[str, Any] = Field(description="Competition analysis")

    class Config:
        json_schema_extra = {
            "example": {
                "success_probability": 0.75,
                "confidence_score": 0.85,
                "risk_level": "low",
                "positive_factors": ["Strong skill match", "Relevant experience"],
                "negative_factors": ["Location mismatch"],
                "recommendations": ["Emphasize remote work capability"],
                "estimated_competition": {"level": "medium", "applicants": "50-100"},
            }
        }


class TimeToHirePrediction(BaseModel):
    """Response schema for time-to-hire prediction."""

    predicted_days: int = Field(description="Predicted days to hire")
    confidence_interval: Dict[str, int] = Field(description="Confidence interval")
    breakdown_by_stage: List[Dict[str, Any]] = Field(description="Time breakdown by hiring stage")
    factors: List[str] = Field(description="Factors affecting timeline")
    comparison_to_average: str = Field(description="Comparison to industry average")

    class Config:
        json_schema_extra = {
            "example": {
                "predicted_days": 45,
                "confidence_interval": {"min": 35, "max": 55},
                "breakdown_by_stage": [
                    {"stage": "screening", "days": 7},
                    {"stage": "interviews", "days": 21},
                    {"stage": "offer", "days": 14},
                ],
                "factors": ["Senior level position", "Multiple interview rounds"],
                "comparison_to_average": "15% faster than industry average",
            }
        }


# Common Response Schemas
class ErrorResponse(BaseModel):
    """Error response schema."""

    error: str = Field(description="Error type")
    message: str = Field(description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(description="Service status: healthy, degraded, unhealthy")
    version: str = Field(description="Service version")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dependencies: Dict[str, str] = Field(description="Dependency status")


class Keyword(BaseModel):
    """Keyword with metadata."""

    keyword: str
    relevance: float = Field(ge=0.0, le=1.0)
    category: str
    frequency: int = 0


class BiasReport(BaseModel):
    """Bias detection report."""

    has_bias: bool
    bias_score: float = Field(ge=0.0, le=1.0, description="Overall bias score")
    detected_biases: List[Dict[str, Any]] = Field(description="Detected bias instances")
    recommendations: List[str] = Field(description="Bias mitigation recommendations")


class AuditResult(BaseModel):
    """Fairness audit result."""

    audit_id: str
    passed: bool
    score: float = Field(ge=0.0, le=100.0)
    issues: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    audited_at: datetime = Field(default_factory=datetime.utcnow)
