"""
Example: AI Endpoints with Feature Flags
This file demonstrates how to integrate feature flags into the AI service endpoints

To use feature flags in Python/FastAPI:
1. Create a feature flag client/service
2. Use dependency injection to check flags
3. Return 403 Forbidden if feature is disabled
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import httpx
import os

router = APIRouter()

# Feature flag service URL
FEATURE_FLAG_SERVICE_URL = os.getenv('AUTH_SERVICE_URL', 'http://localhost:8001')


async def check_feature_flag(flag_key: str, user_id: str = None) -> bool:
    """
    Check if a feature flag is enabled
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"{FEATURE_FLAG_SERVICE_URL}/api/features/{flag_key}"
            headers = {}
            if user_id:
                headers['X-User-Id'] = user_id

            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                return data.get('enabled', False)
            return False
    except Exception as e:
        print(f"Error checking feature flag {flag_key}: {e}")
        return False


async def require_feature_flag(flag_key: str):
    """
    Dependency to require a feature flag
    """
    async def check(user_id: str = None):
        is_enabled = await check_feature_flag(flag_key, user_id)
        if not is_enabled:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature {flag_key} is not available"
            )
    return check


@router.post("/resume/optimize")
async def optimize_resume(
    resume_data: Dict[str, Any],
    _: None = Depends(require_feature_flag("RESUME_OPTIMIZATION_ENABLED"))
):
    """
    Optimize resume using AI
    Requires RESUME_OPTIMIZATION_ENABLED feature flag
    """
    # Your resume optimization logic here
    return {"status": "optimized", "data": resume_data}


@router.post("/jobs/match")
async def match_jobs(
    profile_data: Dict[str, Any],
    _: None = Depends(require_feature_flag("AI_SUGGESTIONS_ENABLED"))
):
    """
    Match jobs using AI
    Requires AI_SUGGESTIONS_ENABLED feature flag
    """
    # Your job matching logic here
    return {"matches": [], "score": 0}


@router.post("/salary/predict")
async def predict_salary(
    job_data: Dict[str, Any],
    _: None = Depends(require_feature_flag("SALARY_PREDICTION_ENABLED"))
):
    """
    Predict salary for a job
    Requires SALARY_PREDICTION_ENABLED feature flag
    """
    # Your salary prediction logic here
    return {"predicted_salary": {"min": 0, "max": 0, "median": 0}}


@router.post("/cover-letter/generate")
async def generate_cover_letter(
    data: Dict[str, Any],
    _: None = Depends(require_feature_flag("FEATURE_AI_RESUME_BUILDER"))
):
    """
    Generate cover letter using AI
    Requires FEATURE_AI_RESUME_BUILDER feature flag
    """
    # Your cover letter generation logic here
    return {"cover_letter": "Generated cover letter..."}


@router.post("/interview/prep")
async def prepare_interview(
    job_data: Dict[str, Any],
    _: None = Depends(require_feature_flag("AI_SUGGESTIONS_ENABLED"))
):
    """
    Get interview preparation tips
    Requires AI_SUGGESTIONS_ENABLED feature flag
    """
    # Your interview prep logic here
    return {
        "questions": [],
        "tips": [],
        "company_insights": {}
    }
