"""
Request schemas for AI Service API endpoints.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


# Resume Request Schemas
class ResumeParseRequest(BaseModel):
    """Request schema for resume parsing."""

    content: Optional[str] = Field(None, description="Resume text content")
    file_url: Optional[HttpUrl] = Field(None, description="URL to resume file")
    format: str = Field(default="auto", description="Resume format: auto, pdf, docx, txt")

    class Config:
        json_schema_extra = {
            "example": {
                "content": "John Doe\nSoftware Engineer\n...",
                "format": "auto",
            }
        }


class ResumeOptimizeRequest(BaseModel):
    """Request schema for resume optimization."""

    resume_id: str = Field(..., description="Resume ID to optimize")
    job_id: str = Field(..., description="Target job ID")
    optimization_level: str = Field(
        default="moderate", description="Optimization level: light, moderate, aggressive"
    )
    preserve_formatting: bool = Field(default=True, description="Preserve original formatting")

    class Config:
        json_schema_extra = {
            "example": {
                "resume_id": "resume_123",
                "job_id": "job_456",
                "optimization_level": "moderate",
                "preserve_formatting": True,
            }
        }


class ATSScoreRequest(BaseModel):
    """Request schema for ATS score calculation."""

    resume_content: str = Field(..., description="Resume text content")
    job_description: str = Field(..., description="Job description")
    required_keywords: Optional[List[str]] = Field(None, description="Required keywords")

    class Config:
        json_schema_extra = {
            "example": {
                "resume_content": "Experienced software engineer...",
                "job_description": "Looking for a senior developer...",
                "required_keywords": ["Python", "AWS", "Docker"],
            }
        }


class GenerateSectionRequest(BaseModel):
    """Request schema for generating resume section."""

    section_type: str = Field(..., description="Section type: summary, experience, skills")
    context: Dict[str, Any] = Field(..., description="Context for generation")
    job_description: Optional[str] = Field(None, description="Target job description")
    style: str = Field(default="professional", description="Writing style")

    class Config:
        json_schema_extra = {
            "example": {
                "section_type": "summary",
                "context": {"title": "Software Engineer", "years_experience": 5},
                "job_description": "Senior backend developer position...",
                "style": "professional",
            }
        }


class EnhanceResumeRequest(BaseModel):
    """Request schema for resume content enhancement."""

    content: str = Field(..., description="Content to enhance")
    enhancement_type: str = Field(
        default="all", description="Enhancement type: all, achievements, keywords, clarity"
    )
    target_role: Optional[str] = Field(None, description="Target role for tailoring")


# Matching Request Schemas
class MatchJobsRequest(BaseModel):
    """Request schema for job matching."""

    candidate_id: str = Field(..., description="Candidate ID")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Search filters")
    top_k: int = Field(default=20, ge=1, le=100, description="Number of results to return")
    min_score: float = Field(default=0.6, ge=0.0, le=1.0, description="Minimum match score")
    include_explanation: bool = Field(default=True, description="Include match explanations")

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "candidate_123",
                "filters": {"location": "San Francisco", "remote": True},
                "top_k": 20,
                "min_score": 0.7,
                "include_explanation": True,
            }
        }


class MatchCandidatesRequest(BaseModel):
    """Request schema for candidate matching."""

    job_id: str = Field(..., description="Job ID")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Search filters")
    top_k: int = Field(default=50, ge=1, le=200, description="Number of results to return")
    min_score: float = Field(default=0.6, ge=0.0, le=1.0, description="Minimum match score")
    diversity_boost: bool = Field(
        default=False, description="Boost diversity in results"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_456",
                "filters": {"min_experience": 3, "skills": ["Python", "AWS"]},
                "top_k": 50,
                "min_score": 0.7,
                "diversity_boost": True,
            }
        }


class MatchScoreRequest(BaseModel):
    """Request schema for match score calculation."""

    candidate_data: Dict[str, Any] = Field(..., description="Candidate profile data")
    job_data: Dict[str, Any] = Field(..., description="Job posting data")
    include_breakdown: bool = Field(default=True, description="Include score breakdown")

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_data": {
                    "skills": ["Python", "AWS"],
                    "experience_years": 5,
                    "location": "San Francisco",
                },
                "job_data": {
                    "required_skills": ["Python", "Docker"],
                    "min_experience": 3,
                    "location": "Remote",
                },
                "include_breakdown": True,
            }
        }


# Prediction Request Schemas
class SalaryPredictRequest(BaseModel):
    """Request schema for salary prediction."""

    job_title: str = Field(..., description="Job title")
    location: str = Field(..., description="Job location")
    experience_years: int = Field(..., ge=0, description="Years of experience")
    skills: List[str] = Field(..., description="Required skills")
    education_level: Optional[str] = Field(None, description="Education level")
    company_size: Optional[str] = Field(None, description="Company size")
    industry: Optional[str] = Field(None, description="Industry")

    class Config:
        json_schema_extra = {
            "example": {
                "job_title": "Senior Software Engineer",
                "location": "San Francisco, CA",
                "experience_years": 5,
                "skills": ["Python", "AWS", "Docker"],
                "education_level": "Bachelor's",
                "company_size": "500-1000",
                "industry": "Technology",
            }
        }


class SuccessPredictRequest(BaseModel):
    """Request schema for application success prediction."""

    candidate_id: str = Field(..., description="Candidate ID")
    job_id: str = Field(..., description="Job ID")
    application_data: Optional[Dict[str, Any]] = Field(
        None, description="Additional application data"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "candidate_id": "candidate_123",
                "job_id": "job_456",
                "application_data": {"referral": True, "cover_letter": True},
            }
        }


class TimeToHirePredictRequest(BaseModel):
    """Request schema for time-to-hire prediction."""

    job_id: str = Field(..., description="Job ID")
    company_id: str = Field(..., description="Company ID")
    job_level: str = Field(..., description="Job level: entry, mid, senior, executive")
    department: Optional[str] = Field(None, description="Department")
    historical_context: Optional[Dict[str, Any]] = Field(
        None, description="Historical hiring data"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_456",
                "company_id": "company_789",
                "job_level": "senior",
                "department": "Engineering",
            }
        }


# Common Schemas
class CandidateProfile(BaseModel):
    """Candidate profile for matching."""

    id: str
    name: str
    title: Optional[str] = None
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_years: int = 0
    education: List[Dict[str, Any]] = Field(default_factory=list)
    work_history: List[Dict[str, Any]] = Field(default_factory=list)
    location: Optional[str] = None
    location_preferences: Optional[List[str]] = Field(default_factory=list)
    remote_preference: Optional[str] = None
    salary_expectation: Optional[Dict[str, Any]] = None
    culture_preferences: Optional[Dict[str, Any]] = None


class JobPosting(BaseModel):
    """Job posting for matching."""

    id: str
    title: str
    company_id: str
    company_name: str
    description: str
    required_skills: List[str] = Field(default_factory=list)
    preferred_skills: List[str] = Field(default_factory=list)
    min_experience: Optional[int] = None
    max_experience: Optional[int] = None
    education_required: Optional[str] = None
    location: Optional[str] = None
    remote_policy: Optional[str] = None
    salary_range: Optional[Dict[str, Any]] = None
    company_culture: Optional[Dict[str, Any]] = None
    posted_date: Optional[datetime] = None


class Resume(BaseModel):
    """Resume data structure."""

    id: Optional[str] = None
    candidate_id: Optional[str] = None
    content: str
    contact_info: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    certifications: List[Dict[str, Any]] = Field(default_factory=list)
    parsed_at: Optional[datetime] = None
