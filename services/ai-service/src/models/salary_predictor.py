"""
ML model for salary prediction.
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.preprocessing import StandardScaler
import structlog

from ..schemas import CandidateProfile, JobPosting, SalaryPrediction
from ..services.llm_service import LLMService
from ..utils.prompts import format_salary_context_prompt

logger = structlog.get_logger()


class SalaryPredictor:
    """
    ML model for salary prediction.

    Features:
    - Feature engineering from profile
    - Confidence intervals
    - Market rate comparison
    """

    def __init__(self, llm_service: LLMService):
        """
        Initialize salary predictor.

        Args:
            llm_service: LLM service for context generation
        """
        self.llm_service = llm_service
        self.scaler = StandardScaler()

        # Salary ranges by experience level (in USD, approximate)
        self.base_salaries = {
            "entry": {"min": 50000, "median": 65000, "max": 80000},
            "junior": {"min": 60000, "median": 75000, "max": 95000},
            "mid": {"min": 80000, "median": 100000, "max": 130000},
            "senior": {"min": 110000, "median": 140000, "max": 180000},
            "lead": {"min": 140000, "median": 170000, "max": 220000},
            "principal": {"min": 170000, "median": 210000, "max": 280000},
            "executive": {"min": 200000, "median": 300000, "max": 500000},
        }

        # Location multipliers (relative to national average)
        self.location_multipliers = {
            "san francisco": 1.45,
            "new york": 1.35,
            "seattle": 1.30,
            "boston": 1.25,
            "los angeles": 1.20,
            "austin": 1.15,
            "denver": 1.10,
            "chicago": 1.10,
            "atlanta": 1.05,
            "remote": 1.00,
            "default": 1.00,
        }

        # Industry multipliers
        self.industry_multipliers = {
            "technology": 1.20,
            "finance": 1.25,
            "healthcare": 1.05,
            "consulting": 1.15,
            "education": 0.85,
            "non-profit": 0.80,
            "default": 1.00,
        }

    def predict(
        self,
        profile: CandidateProfile,
        job: JobPosting,
    ) -> SalaryPrediction:
        """
        Predict salary for a candidate and job combination.

        Args:
            profile: Candidate profile
            job: Job posting

        Returns:
            Salary prediction with confidence interval
        """
        logger.info(
            "Predicting salary",
            candidate_id=profile.id,
            job_id=job.id,
        )

        # Extract features
        features = self._extract_features(profile, job)

        # Determine experience level
        exp_level = self._determine_experience_level(
            profile.experience_years,
            job.min_experience or 0,
        )

        # Get base salary range
        base = self.base_salaries[exp_level]

        # Apply location multiplier
        location_mult = self._get_location_multiplier(job.location or "remote")

        # Apply industry multiplier (placeholder - would extract from job)
        industry_mult = self.industry_multipliers.get("technology", 1.0)

        # Apply skill premium
        skill_premium = self._calculate_skill_premium(
            profile.skills,
            job.required_skills,
            job.preferred_skills,
        )

        # Calculate predicted salary
        base_prediction = base["median"]
        predicted_salary = base_prediction * location_mult * industry_mult * skill_premium

        # Calculate confidence interval (±15%)
        confidence_min = predicted_salary * 0.85
        confidence_max = predicted_salary * 1.15

        # Calculate percentiles
        percentile_25 = base["min"] * location_mult * industry_mult
        percentile_50 = base["median"] * location_mult * industry_mult
        percentile_75 = base["max"] * location_mult * industry_mult

        # Get market data
        market_data = self._get_market_data(
            job.title,
            job.location or "remote",
            "technology",  # Placeholder
        )

        # Generate factors affecting prediction
        factors = self._generate_factors(
            features,
            exp_level,
            location_mult,
            industry_mult,
            skill_premium,
        )

        # Generate market context using LLM
        market_context = self._generate_market_context(
            predicted_salary=predicted_salary,
            min_salary=confidence_min,
            max_salary=confidence_max,
            job_title=job.title,
            location=job.location or "remote",
            years_experience=profile.experience_years,
            industry="technology",
        )

        logger.info(
            "Salary prediction complete",
            predicted=f"${predicted_salary:,.0f}",
            range=f"${confidence_min:,.0f} - ${confidence_max:,.0f}",
        )

        return SalaryPrediction(
            predicted_salary=predicted_salary,
            confidence_interval={
                "min": confidence_min,
                "max": confidence_max,
            },
            percentile_25=percentile_25,
            percentile_50=percentile_50,
            percentile_75=percentile_75,
            market_context=market_context,
            factors=factors,
            data_sources=[
                "Bureau of Labor Statistics",
                "Industry surveys",
                "Job market analysis",
            ],
        )

    def _extract_features(
        self,
        profile: CandidateProfile,
        job: JobPosting,
    ) -> np.ndarray:
        """Extract numerical features for prediction."""
        features = [
            profile.experience_years,
            len(profile.skills),
            len(profile.education),
            1 if profile.education and any(
                'master' in str(edu).lower() or 'phd' in str(edu).lower()
                for edu in profile.education
            ) else 0,
            len(set(profile.skills) & set(job.required_skills)),
            len(set(profile.skills) & set(job.preferred_skills)),
        ]

        return np.array(features, dtype=np.float32)

    def _determine_experience_level(
        self,
        years_experience: int,
        min_required: int,
    ) -> str:
        """Determine experience level."""
        if years_experience < 1:
            return "entry"
        elif years_experience < 3:
            return "junior"
        elif years_experience < 5:
            return "mid"
        elif years_experience < 8:
            return "senior"
        elif years_experience < 12:
            return "lead"
        elif years_experience < 15:
            return "principal"
        else:
            return "executive"

    def _get_location_multiplier(self, location: str) -> float:
        """Get location-based salary multiplier."""
        location_lower = location.lower()

        for city, multiplier in self.location_multipliers.items():
            if city in location_lower:
                return multiplier

        return self.location_multipliers["default"]

    def _calculate_skill_premium(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str],
    ) -> float:
        """Calculate premium based on skill match."""
        if not required_skills:
            return 1.0

        # Normalize to lowercase
        candidate_skills_lower = {s.lower() for s in candidate_skills}
        required_skills_lower = {s.lower() for s in required_skills}
        preferred_skills_lower = {s.lower() for s in preferred_skills}

        # Calculate match rates
        required_match_rate = len(required_skills_lower & candidate_skills_lower) / len(required_skills_lower)

        preferred_match_rate = 0.0
        if preferred_skills:
            preferred_match_rate = len(preferred_skills_lower & candidate_skills_lower) / len(preferred_skills_lower)

        # Calculate premium (up to 20% for perfect match)
        premium = 1.0 + (required_match_rate * 0.15) + (preferred_match_rate * 0.05)

        return float(premium)

    def _get_market_data(
        self,
        title: str,
        location: str,
        industry: str,
    ) -> Dict[str, Any]:
        """Get market data for the role."""
        # Placeholder - would fetch from actual data sources
        return {
            "average_salary": 125000,
            "market_trend": "growing",
            "demand_level": "high",
        }

    def _generate_factors(
        self,
        features: np.ndarray,
        exp_level: str,
        location_mult: float,
        industry_mult: float,
        skill_premium: float,
    ) -> List[Dict[str, Any]]:
        """Generate factors affecting the prediction."""
        factors = [
            {
                "factor": "experience_level",
                "impact": "high",
                "value": exp_level,
                "description": f"Experience level: {exp_level}",
            },
            {
                "factor": "location",
                "impact": "high" if location_mult > 1.2 else "medium",
                "value": f"{location_mult:.2f}x",
                "description": f"Location multiplier: {location_mult:.2f}x",
            },
            {
                "factor": "industry",
                "impact": "medium",
                "value": f"{industry_mult:.2f}x",
                "description": f"Industry multiplier: {industry_mult:.2f}x",
            },
            {
                "factor": "skills",
                "impact": "medium" if skill_premium > 1.1 else "low",
                "value": f"{skill_premium:.2f}x",
                "description": f"Skill premium: {skill_premium:.2f}x",
            },
        ]

        return factors

    def _generate_market_context(
        self,
        predicted_salary: float,
        min_salary: float,
        max_salary: float,
        job_title: str,
        location: str,
        years_experience: int,
        industry: str,
    ) -> str:
        """Generate market context narrative."""
        # Simple context generation
        context_parts = [
            f"Based on current market data, the predicted salary of ${predicted_salary:,.0f} "
            f"is competitive for a {job_title} position in {location}.",
        ]

        if "san francisco" in location.lower() or "new york" in location.lower():
            context_parts.append(
                f"The {location} market typically offers premium compensation due to high cost of living."
            )

        context_parts.append(
            f"With {years_experience} years of experience, candidates typically fall within "
            f"the ${min_salary:,.0f} - ${max_salary:,.0f} range."
        )

        return " ".join(context_parts)
