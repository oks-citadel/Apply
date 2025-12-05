"""
Salary prediction endpoints for AI Service.
"""

import structlog
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field

from ...api.dependencies import (
    SalaryPredictorDep,
    CurrentUserDep,
    standard_rate_limiter,
)
from ...schemas.request_schemas import CandidateProfile, JobPosting
from ...schemas.response_schemas import SalaryPrediction

logger = structlog.get_logger()

router = APIRouter()


# Request Models
class PredictSalaryRequest(BaseModel):
    """Request schema for salary prediction."""

    job_title: str = Field(..., description="Job title")
    location: str = Field(..., description="Job location")
    experience_years: int = Field(..., ge=0, description="Years of experience")
    skills: list[str] = Field(..., min_items=1, description="Required skills")
    education_level: str = Field(default="Bachelor's", description="Education level")
    company_size: str = Field(default="medium", description="Company size")
    industry: str = Field(default="Technology", description="Industry")


class CompareSalariesRequest(BaseModel):
    """Request for comparing salaries across locations."""

    job_title: str = Field(..., description="Job title")
    locations: list[str] = Field(..., min_items=2, description="Locations to compare")
    experience_years: int = Field(..., ge=0, description="Years of experience")
    skills: list[str] = Field(..., description="Skills")


# Response Models
class SalaryComparison(BaseModel):
    """Salary comparison across locations."""

    comparisons: list[dict] = Field(description="Salary predictions per location")
    highest_location: str = Field(description="Location with highest salary")
    lowest_location: str = Field(description="Location with lowest salary")
    variance: float = Field(description="Salary variance across locations")


# Endpoints
@router.post(
    "/salary",
    response_model=SalaryPrediction,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def predict_salary(
    request: PredictSalaryRequest,
    predictor: SalaryPredictorDep,
    current_user: CurrentUserDep,
) -> SalaryPrediction:
    """
    Predict salary for given job and candidate profile.

    Args:
        request: Salary prediction request
        predictor: Salary predictor instance
        current_user: Current authenticated user

    Returns:
        Salary prediction with confidence intervals and market context
    """
    logger.info(
        "Predicting salary",
        user_id=current_user.user_id,
        job_title=request.job_title,
        location=request.location,
        experience_years=request.experience_years,
    )

    try:
        # Create CandidateProfile
        profile = CandidateProfile(
            id=current_user.user_id,
            name="Candidate",
            skills=request.skills,
            experience_years=request.experience_years,
            education=[{"level": request.education_level}],
        )

        # Create JobPosting
        job = JobPosting(
            id="temp_job",
            title=request.job_title,
            company_id="temp_company",
            company_name="Company",
            description=f"{request.job_title} position",
            location=request.location,
            required_skills=request.skills,
        )

        # Predict salary
        prediction = predictor.predict(profile=profile, job=job)

        logger.info(
            "Salary predicted successfully",
            user_id=current_user.user_id,
            predicted_salary=f"${prediction.predicted_salary:,.0f}",
            confidence_range=f"${prediction.confidence_interval['min']:,.0f} - ${prediction.confidence_interval['max']:,.0f}",
        )

        return prediction

    except Exception as e:
        logger.error(
            "Failed to predict salary",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict salary: {str(e)}",
        )


@router.post(
    "/compare-locations",
    response_model=SalaryComparison,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def compare_salaries(
    request: CompareSalariesRequest,
    predictor: SalaryPredictorDep,
    current_user: CurrentUserDep,
) -> SalaryComparison:
    """
    Compare salary predictions across multiple locations.

    Args:
        request: Salary comparison request
        predictor: Salary predictor instance
        current_user: Current authenticated user

    Returns:
        Salary comparison data across locations
    """
    logger.info(
        "Comparing salaries across locations",
        user_id=current_user.user_id,
        job_title=request.job_title,
        locations=request.locations,
    )

    try:
        comparisons = []
        salaries = []

        # Create candidate profile
        profile = CandidateProfile(
            id=current_user.user_id,
            name="Candidate",
            skills=request.skills,
            experience_years=request.experience_years,
        )

        # Predict for each location
        for location in request.locations:
            job = JobPosting(
                id=f"job_{location}",
                title=request.job_title,
                company_id="temp_company",
                company_name="Company",
                description=f"{request.job_title} position",
                location=location,
                required_skills=request.skills,
            )

            prediction = predictor.predict(profile=profile, job=job)
            salaries.append(prediction.predicted_salary)

            comparisons.append({
                "location": location,
                "predicted_salary": prediction.predicted_salary,
                "confidence_interval": prediction.confidence_interval,
                "percentile_50": prediction.percentile_50,
                "cost_of_living_adjusted": prediction.predicted_salary,  # Simplified
            })

        # Calculate stats
        highest_location = max(comparisons, key=lambda x: x["predicted_salary"])["location"]
        lowest_location = min(comparisons, key=lambda x: x["predicted_salary"])["location"]

        # Calculate variance
        mean_salary = sum(salaries) / len(salaries)
        variance = sum((s - mean_salary) ** 2 for s in salaries) / len(salaries)

        logger.info(
            "Salary comparison completed successfully",
            user_id=current_user.user_id,
            locations_compared=len(comparisons),
        )

        return SalaryComparison(
            comparisons=comparisons,
            highest_location=highest_location,
            lowest_location=lowest_location,
            variance=variance,
        )

    except Exception as e:
        logger.error(
            "Failed to compare salaries",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare salaries: {str(e)}",
        )


@router.get(
    "/market-data/{job_title}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def get_market_data(
    job_title: str,
    location: str = "United States",
    current_user: CurrentUserDep = None,
) -> dict:
    """
    Get general market data for a job title and location.

    Args:
        job_title: Job title to query
        location: Location for market data
        current_user: Current authenticated user

    Returns:
        Market data and salary trends
    """
    logger.info(
        "Fetching market data",
        user_id=current_user.user_id if current_user else "anonymous",
        job_title=job_title,
        location=location,
    )

    try:
        # This would typically fetch from a database or external API
        # For now, returning mock data
        market_data = {
            "job_title": job_title,
            "location": location,
            "average_salary": 125000,
            "salary_range": {
                "min": 90000,
                "max": 180000,
            },
            "market_trend": "growing",
            "demand_level": "high",
            "growth_rate": 15.5,
            "common_skills": [
                "Python",
                "AWS",
                "Docker",
                "Kubernetes",
                "CI/CD",
            ],
            "top_industries": [
                "Technology",
                "Finance",
                "Healthcare",
            ],
            "data_sources": [
                "Bureau of Labor Statistics",
                "Industry surveys",
                "Job postings analysis",
            ],
            "last_updated": "2024-12-01",
        }

        logger.info(
            "Market data retrieved successfully",
            job_title=job_title,
            location=location,
        )

        return market_data

    except Exception as e:
        logger.error(
            "Failed to fetch market data",
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch market data: {str(e)}",
        )


@router.post(
    "/negotiation-tips",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(standard_rate_limiter)],
)
async def get_negotiation_tips(
    offered_salary: float,
    predicted_salary: float,
    location: str,
    job_title: str,
    current_user: CurrentUserDep,
) -> dict:
    """
    Get salary negotiation tips based on offer and market data.

    Args:
        offered_salary: Offered salary amount
        predicted_salary: Predicted market salary
        location: Job location
        job_title: Job title
        current_user: Current authenticated user

    Returns:
        Negotiation strategy and tips
    """
    logger.info(
        "Generating negotiation tips",
        user_id=current_user.user_id,
        offered_salary=offered_salary,
        predicted_salary=predicted_salary,
    )

    try:
        # Calculate difference
        difference = predicted_salary - offered_salary
        difference_percentage = (difference / predicted_salary) * 100

        # Determine strategy
        if difference_percentage > 15:
            strategy = "aggressive"
            recommendation = "The offer is significantly below market rate. Strong negotiation recommended."
        elif difference_percentage > 5:
            strategy = "moderate"
            recommendation = "The offer is somewhat below market rate. Moderate negotiation advised."
        elif difference_percentage > -5:
            strategy = "light"
            recommendation = "The offer is close to market rate. Light negotiation may be appropriate."
        else:
            strategy = "accept"
            recommendation = "The offer is above market rate. Consider accepting or negotiating other benefits."

        # Generate tips
        tips = [
            "Research comparable salaries in your area",
            "Highlight your unique skills and experience",
            "Be prepared to justify your counter-offer",
            "Consider the full compensation package (benefits, equity, etc.)",
            "Maintain a positive and professional tone",
        ]

        if difference > 0:
            tips.append(
                f"Consider counter-offering around ${offered_salary + (difference * 0.7):,.0f}"
            )

        negotiation_data = {
            "offered_salary": offered_salary,
            "market_salary": predicted_salary,
            "difference": difference,
            "difference_percentage": difference_percentage,
            "strategy": strategy,
            "recommendation": recommendation,
            "tips": tips,
            "counter_offer_range": {
                "min": offered_salary + (difference * 0.5) if difference > 0 else offered_salary,
                "max": offered_salary + (difference * 0.8) if difference > 0 else offered_salary * 1.05,
            },
            "talking_points": [
                f"Market research shows {job_title} positions in {location} typically earn ${predicted_salary:,.0f}",
                "My experience and skills align well with the role requirements",
                "I'm excited about the opportunity and believe my contributions will add significant value",
            ],
        }

        logger.info(
            "Negotiation tips generated successfully",
            user_id=current_user.user_id,
            strategy=strategy,
        )

        return negotiation_data

    except Exception as e:
        logger.error(
            "Failed to generate negotiation tips",
            user_id=current_user.user_id,
            error=str(e),
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate negotiation tips: {str(e)}",
        )
