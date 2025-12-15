"""
Interview Probability Matching Engine.

Calculates the probability of getting an interview based on resume, cover letter,
and LinkedIn profile data matched against job requirements.
"""

import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from sklearn.preprocessing import StandardScaler
import structlog

from .profile_parser import ProfileParser
from .database_models import (
    MatchResult,
    MatchExplanation,
    MatchFeedback,
    TrainingDataPoint,
    SubscriptionTier,
    OutcomeType
)
from ..services.llm_service import LLMService

logger = structlog.get_logger()


class InterviewProbabilityMatcher:
    """
    ML-powered matching engine that calculates interview probability.

    Features:
    - Multi-source profile parsing (resume, cover letter, LinkedIn)
    - Deep skill analysis with proficiency levels
    - Experience relevance scoring
    - Seniority alignment detection
    - Industry fit analysis
    - Gap identification
    - Subscription tier-based thresholds
    - Continuous learning from outcomes
    """

    # Subscription tier thresholds (minimum probability %)
    TIER_THRESHOLDS = {
        SubscriptionTier.FREEMIUM: 0.80,      # 80%+ (preview only)
        SubscriptionTier.STARTER: 0.70,       # 70%+
        SubscriptionTier.BASIC: 0.65,         # 65%+
        SubscriptionTier.PROFESSIONAL: 0.60,  # 60%+
        SubscriptionTier.PREMIUM: 0.55,       # 55%+
        SubscriptionTier.ELITE: 0.55,         # 55%+ with human review
    }

    # Feature weights for scoring
    WEIGHTS = {
        "skill_depth": 0.30,
        "experience_relevance": 0.25,
        "seniority_match": 0.15,
        "industry_fit": 0.10,
        "education_match": 0.10,
        "keyword_density": 0.05,
        "recency": 0.05
    }

    def __init__(self, llm_service: Optional[LLMService] = None):
        """
        Initialize matcher.

        Args:
            llm_service: LLM service for generating explanations
        """
        self.parser = ProfileParser()
        self.llm_service = llm_service
        self.scaler = StandardScaler()

        # In-memory storage for demo (would use real database in production)
        self.match_results: Dict[str, MatchResult] = {}
        self.match_explanations: Dict[str, MatchExplanation] = {}
        self.training_data: List[TrainingDataPoint] = []

        logger.info("Interview Probability Matcher initialized")

    async def calculate_probability(
        self,
        user_id: str,
        job_id: str,
        job_requirements: Dict[str, Any],
        resume_text: Optional[str] = None,
        cover_letter: Optional[str] = None,
        linkedin_profile: Optional[Dict[str, Any]] = None,
        subscription_tier: str = "basic"
    ) -> MatchResult:
        """
        Calculate interview probability for a user-job pair.

        Args:
            user_id: User ID
            job_id: Job ID
            job_requirements: Job requirements and description
            resume_text: Resume text
            cover_letter: Cover letter text
            linkedin_profile: LinkedIn profile data
            subscription_tier: User's subscription tier

        Returns:
            Match result with probability scores
        """
        logger.info(
            "Calculating interview probability",
            user_id=user_id,
            job_id=job_id,
            tier=subscription_tier
        )

        # Parse candidate profile
        profile = self.parser.parse_profile(
            resume_text=resume_text,
            cover_letter=cover_letter,
            linkedin_profile=linkedin_profile
        )

        # Extract job requirements
        required_skills = job_requirements.get("required_skills", [])
        preferred_skills = job_requirements.get("preferred_skills", [])
        min_experience = job_requirements.get("min_experience_years", 0)
        max_experience = job_requirements.get("max_experience_years", 99)
        required_seniority = job_requirements.get("seniority_level", "mid")
        industry = job_requirements.get("industry", "")
        education_requirement = job_requirements.get("education_level", 0)
        job_description = job_requirements.get("description", "")

        # Calculate component scores
        skill_depth_score = self._calculate_skill_depth_score(
            profile, required_skills, preferred_skills
        )

        experience_relevance_score = self._calculate_experience_relevance(
            profile, job_description, min_experience, max_experience
        )

        seniority_match_score = self._calculate_seniority_match(
            profile.get("seniority_level", "mid"),
            required_seniority
        )

        industry_fit_score = self._calculate_industry_fit(
            profile.get("industries", []),
            industry
        )

        education_match_score = self._calculate_education_match(
            profile.get("highest_education_level", 0),
            education_requirement
        )

        keyword_density = self._calculate_keyword_density(
            profile, job_description
        )

        recency_score = self._calculate_recency_score(profile)

        # Calculate weighted overall score
        component_scores = {
            "skill_depth": skill_depth_score,
            "experience_relevance": experience_relevance_score,
            "seniority_match": seniority_match_score,
            "industry_fit": industry_fit_score,
            "education_match": education_match_score,
            "keyword_density": keyword_density,
            "recency": recency_score
        }

        overall_score = sum(
            score * self.WEIGHTS[component]
            for component, score in component_scores.items()
        )

        # Convert to percentage (0-100)
        overall_percentage = overall_score * 100

        # Calculate interview and offer probabilities
        interview_probability = self._calculate_interview_probability(
            overall_score, component_scores
        )

        offer_probability = self._calculate_offer_probability(
            interview_probability, component_scores
        )

        # Identify gaps and strengths
        critical_gaps, minor_gaps = self._identify_gaps(
            profile, required_skills, preferred_skills, job_requirements
        )

        strengths = self._identify_strengths(
            profile, component_scores, required_skills
        )

        # Check threshold
        tier_enum = SubscriptionTier(subscription_tier.lower())
        threshold = self.TIER_THRESHOLDS[tier_enum]
        threshold_met = interview_probability >= threshold

        # Check if human review is needed
        requires_human_review = (
            tier_enum in [SubscriptionTier.PREMIUM, SubscriptionTier.ELITE] and
            0.50 <= interview_probability < threshold
        )

        # Create match result
        match_id = str(uuid.uuid4())
        match_result = MatchResult(
            id=match_id,
            user_id=user_id,
            job_id=job_id,
            interview_probability=interview_probability,
            offer_probability=offer_probability,
            overall_score=overall_percentage,
            skill_depth_score=skill_depth_score,
            experience_relevance_score=experience_relevance_score,
            seniority_match_score=seniority_match_score,
            industry_fit_score=industry_fit_score,
            education_match_score=education_match_score,
            critical_gaps=critical_gaps,
            minor_gaps=minor_gaps,
            strengths=strengths,
            subscription_tier=subscription_tier,
            threshold_met=threshold_met,
            requires_human_review=requires_human_review,
            metadata={
                "profile_completeness": self._calculate_profile_completeness(profile),
                "component_scores": component_scores,
                "job_title": job_requirements.get("title", ""),
                "company": job_requirements.get("company", "")
            }
        )

        # Store result
        self.match_results[match_id] = match_result

        logger.info(
            "Interview probability calculated",
            match_id=match_id,
            probability=interview_probability,
            overall_score=overall_percentage,
            threshold_met=threshold_met
        )

        return match_result

    async def explain_match(self, match_id: str) -> MatchExplanation:
        """
        Generate detailed explanation for a match.

        Args:
            match_id: Match result ID

        Returns:
            Detailed match explanation
        """
        if match_id not in self.match_results:
            raise ValueError(f"Match {match_id} not found")

        match = self.match_results[match_id]

        # Generate AI-powered explanations
        summary = self._generate_summary(match)
        detailed_reasoning = await self._generate_detailed_reasoning(match)
        skill_analysis = self._generate_skill_analysis(match)
        experience_analysis = self._generate_experience_analysis(match)
        gap_analysis = self._generate_gap_analysis(match)
        strength_analysis = self._generate_strength_analysis(match)

        # Generate recommendations
        improvement_recommendations = self._generate_improvement_recommendations(match)
        application_tips = self._generate_application_tips(match)

        # Calculate confidence
        confidence_score = self._calculate_confidence(match)
        data_completeness = match.metadata.get("profile_completeness", 0.7)

        explanation_id = str(uuid.uuid4())
        explanation = MatchExplanation(
            id=explanation_id,
            match_id=match_id,
            summary=summary,
            detailed_reasoning=detailed_reasoning,
            skill_analysis=skill_analysis,
            experience_analysis=experience_analysis,
            gap_analysis=gap_analysis,
            strength_analysis=strength_analysis,
            improvement_recommendations=improvement_recommendations,
            application_tips=application_tips,
            confidence_score=confidence_score,
            data_completeness=data_completeness
        )

        self.match_explanations[explanation_id] = explanation

        logger.info("Match explanation generated", match_id=match_id, explanation_id=explanation_id)

        return explanation

    async def find_matches(
        self,
        user_id: str,
        jobs: List[Dict[str, Any]],
        resume_text: Optional[str] = None,
        cover_letter: Optional[str] = None,
        linkedin_profile: Optional[Dict[str, Any]] = None,
        subscription_tier: str = "basic",
        top_k: int = 20
    ) -> List[MatchResult]:
        """
        Find top matching jobs for a user.

        Args:
            user_id: User ID
            jobs: List of job postings
            resume_text: Resume text
            cover_letter: Cover letter text
            linkedin_profile: LinkedIn profile data
            subscription_tier: User's subscription tier
            top_k: Number of top matches to return

        Returns:
            List of match results sorted by probability
        """
        logger.info(
            "Finding top matches",
            user_id=user_id,
            total_jobs=len(jobs),
            top_k=top_k
        )

        matches = []

        for job in jobs:
            try:
                match = await self.calculate_probability(
                    user_id=user_id,
                    job_id=job.get("id", str(uuid.uuid4())),
                    job_requirements=job,
                    resume_text=resume_text,
                    cover_letter=cover_letter,
                    linkedin_profile=linkedin_profile,
                    subscription_tier=subscription_tier
                )

                # Only include matches that meet threshold
                if match.threshold_met or match.requires_human_review:
                    matches.append(match)

            except Exception as e:
                logger.warning(
                    "Failed to calculate match for job",
                    job_id=job.get("id"),
                    error=str(e)
                )

        # Sort by interview probability
        matches.sort(key=lambda x: x.interview_probability, reverse=True)

        # Return top K
        top_matches = matches[:top_k]

        logger.info(
            "Top matches found",
            user_id=user_id,
            matches_found=len(top_matches)
        )

        return top_matches

    def record_feedback(
        self,
        match_id: str,
        outcome: OutcomeType,
        user_id: str,
        job_id: str,
        applied_at: Optional[datetime] = None,
        response_received_at: Optional[datetime] = None,
        interview_rounds: Optional[int] = None,
        offer_received: bool = False,
        user_rating: Optional[float] = None,
        user_comments: Optional[str] = None
    ) -> MatchFeedback:
        """
        Record feedback on match outcome for training.

        Args:
            match_id: Match result ID
            outcome: Application outcome
            user_id: User ID
            job_id: Job ID
            applied_at: When application was submitted
            response_received_at: When response was received
            interview_rounds: Number of interview rounds
            offer_received: Whether offer was received
            user_rating: User rating (1-5)
            user_comments: User comments

        Returns:
            Feedback record
        """
        if match_id not in self.match_results:
            raise ValueError(f"Match {match_id} not found")

        match = self.match_results[match_id]

        # Calculate days to response
        days_to_response = None
        if applied_at and response_received_at:
            days_to_response = (response_received_at - applied_at).days

        feedback_id = str(uuid.uuid4())
        feedback = MatchFeedback(
            id=feedback_id,
            match_id=match_id,
            user_id=user_id,
            job_id=job_id,
            predicted_probability=match.interview_probability,
            actual_outcome=outcome,
            applied_at=applied_at,
            response_received_at=response_received_at,
            days_to_response=days_to_response,
            interview_rounds=interview_rounds,
            offer_received=offer_received,
            user_rating=user_rating,
            user_comments=user_comments
        )

        # Convert to training data point
        training_point = self._feedback_to_training_data(match, feedback)
        self.training_data.append(training_point)

        logger.info(
            "Feedback recorded",
            feedback_id=feedback_id,
            match_id=match_id,
            outcome=outcome.value,
            predicted=match.interview_probability
        )

        return feedback

    def _calculate_skill_depth_score(
        self,
        profile: Dict[str, Any],
        required_skills: List[str],
        preferred_skills: List[str]
    ) -> float:
        """Calculate skill depth score."""
        if not required_skills:
            return 0.8  # Neutral if no requirements

        # Get skill depths
        skill_depths = self.parser.calculate_skill_depth(profile, required_skills)

        # Calculate required skills match
        required_depth = [skill_depths.get(skill, 0.0) for skill in required_skills]
        required_score = np.mean(required_depth) if required_depth else 0.0

        # Calculate preferred skills match
        if preferred_skills:
            preferred_depth = [
                skill_depths.get(skill, 0.0)
                for skill in preferred_skills
            ]
            preferred_score = np.mean(preferred_depth) if preferred_depth else 0.0
        else:
            preferred_score = 0.0

        # Weight: 70% required, 30% preferred
        final_score = (required_score * 0.7) + (preferred_score * 0.3)

        return float(np.clip(final_score, 0.0, 1.0))

    def _calculate_experience_relevance(
        self,
        profile: Dict[str, Any],
        job_description: str,
        min_years: int,
        max_years: int
    ) -> float:
        """Calculate experience relevance score."""
        total_years = profile.get("total_experience_years", 0)

        # Check if within range
        if total_years < min_years:
            # Penalty for insufficient experience
            deficit = min_years - total_years
            return float(np.clip(1.0 - (deficit * 0.15), 0.0, 1.0))

        if total_years > max_years:
            # Slight penalty for over-qualification
            excess = total_years - max_years
            return float(np.clip(1.0 - (excess * 0.05), 0.6, 1.0))

        # Perfect match within range
        return 1.0

    def _calculate_seniority_match(
        self,
        candidate_level: str,
        required_level: str
    ) -> float:
        """Calculate seniority alignment score."""
        # Seniority hierarchy
        levels = ["entry", "mid", "senior", "lead", "executive"]

        try:
            candidate_idx = levels.index(candidate_level)
            required_idx = levels.index(required_level)

            gap = abs(candidate_idx - required_idx)

            if gap == 0:
                return 1.0  # Perfect match
            elif gap == 1:
                return 0.8  # One level off
            elif gap == 2:
                return 0.5  # Two levels off
            else:
                return 0.3  # Significant mismatch

        except ValueError:
            return 0.7  # Neutral if unknown

    def _calculate_industry_fit(
        self,
        candidate_industries: List[str],
        required_industry: str
    ) -> float:
        """Calculate industry fit score."""
        if not required_industry:
            return 0.7  # Neutral if not specified

        if not candidate_industries:
            return 0.5  # Lower if no industry experience

        # Check for match
        required_lower = required_industry.lower()
        for industry in candidate_industries:
            if industry.lower() == required_lower:
                return 1.0  # Exact match

        return 0.6  # No match but has some industry experience

    def _calculate_education_match(
        self,
        candidate_level: int,
        required_level: int
    ) -> float:
        """Calculate education match score."""
        if required_level == 0:
            return 0.8  # Neutral if not specified

        if candidate_level >= required_level:
            return 1.0  # Meets or exceeds
        else:
            gap = required_level - candidate_level
            return float(np.clip(1.0 - (gap * 0.2), 0.3, 1.0))

    def _calculate_keyword_density(
        self,
        profile: Dict[str, Any],
        job_description: str
    ) -> float:
        """Calculate keyword density match."""
        # Extract keywords from job description
        job_keywords = set(job_description.lower().split())

        # Get profile text
        profile_text = profile.get("summary", "")
        for exp in profile.get("experience", [])[:3]:
            profile_text += " " + exp.get("description", "")

        profile_keywords = set(profile_text.lower().split())

        # Calculate overlap
        if not job_keywords:
            return 0.5

        overlap = len(job_keywords & profile_keywords)
        density = overlap / len(job_keywords)

        return float(np.clip(density, 0.0, 1.0))

    def _calculate_recency_score(self, profile: Dict[str, Any]) -> float:
        """Calculate recency of experience score."""
        experience = profile.get("experience", [])

        if not experience:
            return 0.5

        # Check most recent role
        most_recent = experience[0]
        end_year = most_recent.get("end_year", datetime.now().year)
        current_year = datetime.now().year

        years_since = current_year - end_year

        if years_since == 0:
            return 1.0  # Currently employed
        elif years_since <= 1:
            return 0.9  # Recent
        elif years_since <= 2:
            return 0.7  # Somewhat recent
        else:
            return 0.5  # Older experience

    def _calculate_interview_probability(
        self,
        overall_score: float,
        component_scores: Dict[str, float]
    ) -> float:
        """
        Calculate probability of getting an interview.

        Uses a calibrated sigmoid function to convert scores to probabilities.
        """
        # Apply sigmoid transformation for better calibration
        # P(interview) = 1 / (1 + exp(-k * (score - threshold)))
        k = 10  # Steepness
        threshold = 0.6  # Midpoint

        probability = 1 / (1 + np.exp(-k * (overall_score - threshold)))

        # Adjust based on critical factors
        if component_scores["skill_depth"] < 0.5:
            probability *= 0.8  # Penalty for poor skill match

        if component_scores["experience_relevance"] < 0.5:
            probability *= 0.9  # Penalty for experience mismatch

        return float(np.clip(probability, 0.0, 1.0))

    def _calculate_offer_probability(
        self,
        interview_probability: float,
        component_scores: Dict[str, float]
    ) -> float:
        """Calculate probability of getting an offer given interview."""
        # Offer probability is conditional on getting interview
        # Typically 20-30% of interviewed candidates get offers

        base_offer_rate = 0.25

        # Adjust based on match strength
        strength_multiplier = 1 + (sum(component_scores.values()) / len(component_scores) - 0.7)

        offer_probability = interview_probability * base_offer_rate * strength_multiplier

        return float(np.clip(offer_probability, 0.0, 1.0))

    def _identify_gaps(
        self,
        profile: Dict[str, Any],
        required_skills: List[str],
        preferred_skills: List[str],
        job_requirements: Dict[str, Any]
    ) -> Tuple[List[str], List[str]]:
        """Identify critical and minor gaps."""
        profile_skills = set(s.lower() for s in profile.get("skills", []))

        critical_gaps = []
        minor_gaps = []

        # Check required skills
        for skill in required_skills:
            if skill.lower() not in profile_skills:
                critical_gaps.append(skill)

        # Check preferred skills
        for skill in preferred_skills:
            if skill.lower() not in profile_skills:
                minor_gaps.append(skill)

        # Check experience
        min_exp = job_requirements.get("min_experience_years", 0)
        if profile.get("total_experience_years", 0) < min_exp:
            critical_gaps.append(f"Need {min_exp - profile.get('total_experience_years', 0):.1f} more years of experience")

        return critical_gaps[:5], minor_gaps[:5]

    def _identify_strengths(
        self,
        profile: Dict[str, Any],
        component_scores: Dict[str, float],
        required_skills: List[str]
    ) -> List[str]:
        """Identify candidate strengths."""
        strengths = []

        if component_scores["skill_depth"] >= 0.85:
            strengths.append("Excellent skill match with deep expertise")

        if component_scores["experience_relevance"] >= 0.9:
            strengths.append("Experience level is ideal for this role")

        if component_scores["seniority_match"] == 1.0:
            strengths.append("Perfect seniority level alignment")

        if component_scores["industry_fit"] == 1.0:
            strengths.append("Direct industry experience")

        if component_scores["education_match"] == 1.0:
            strengths.append("Educational background exceeds requirements")

        if len(strengths) == 0:
            strengths.append("Profile shows potential for this role")

        return strengths[:5]

    def _calculate_profile_completeness(self, profile: Dict[str, Any]) -> float:
        """Calculate how complete the profile data is."""
        completeness = 0.0
        weights = {
            "skills": 0.25,
            "experience": 0.25,
            "education": 0.15,
            "summary": 0.20,
            "certifications": 0.15
        }

        if profile.get("skills"):
            completeness += weights["skills"]

        if profile.get("experience"):
            completeness += weights["experience"]

        if profile.get("education"):
            completeness += weights["education"]

        if profile.get("summary"):
            completeness += weights["summary"]

        if profile.get("certifications"):
            completeness += weights["certifications"]

        return completeness

    def _generate_summary(self, match: MatchResult) -> str:
        """Generate high-level match summary."""
        probability = match.interview_probability * 100

        if probability >= 80:
            rating = "Excellent"
        elif probability >= 70:
            rating = "Strong"
        elif probability >= 60:
            rating = "Good"
        elif probability >= 50:
            rating = "Moderate"
        else:
            rating = "Weak"

        return (
            f"{rating} match with {probability:.0f}% interview probability. "
            f"{'Meets' if match.threshold_met else 'Does not meet'} threshold for {match.subscription_tier} tier."
        )

    async def _generate_detailed_reasoning(self, match: MatchResult) -> str:
        """Generate AI-powered detailed reasoning."""
        if not self.llm_service:
            return self._generate_rule_based_reasoning(match)

        # Use LLM to generate detailed reasoning
        prompt = f"""
Analyze this job match and provide detailed reasoning for the {match.interview_probability*100:.0f}% interview probability score.

Scores:
- Skill Depth: {match.skill_depth_score*100:.0f}%
- Experience Relevance: {match.experience_relevance_score*100:.0f}%
- Seniority Match: {match.seniority_match_score*100:.0f}%
- Industry Fit: {match.industry_fit_score*100:.0f}%
- Education Match: {match.education_match_score*100:.0f}%

Strengths: {', '.join(match.strengths)}
Gaps: {', '.join(match.critical_gaps)}

Provide a 2-3 paragraph explanation of why this score was calculated, focusing on the most important factors.
"""

        try:
            reasoning = await self.llm_service.complete(prompt, temperature=0.3)
            return reasoning
        except Exception as e:
            logger.warning("Failed to generate LLM reasoning", error=str(e))
            return self._generate_rule_based_reasoning(match)

    def _generate_rule_based_reasoning(self, match: MatchResult) -> str:
        """Generate rule-based reasoning as fallback."""
        parts = []

        # Overall assessment
        if match.interview_probability >= 0.7:
            parts.append("This is a strong match with high interview probability.")
        elif match.interview_probability >= 0.5:
            parts.append("This is a moderate match with reasonable interview chances.")
        else:
            parts.append("This match has some challenges that may reduce interview likelihood.")

        # Skill analysis
        if match.skill_depth_score >= 0.8:
            parts.append("The candidate has excellent skill alignment with deep expertise in required areas.")
        elif match.skill_depth_score >= 0.6:
            parts.append("The candidate possesses most required skills with good proficiency.")
        else:
            parts.append("There are some skill gaps that may need to be addressed.")

        # Experience analysis
        if match.experience_relevance_score >= 0.9:
            parts.append("Experience level is ideal for this position.")
        elif match.experience_relevance_score >= 0.7:
            parts.append("Experience is generally appropriate, with minor alignment issues.")
        else:
            parts.append("Experience level may not fully align with requirements.")

        return " ".join(parts)

    def _generate_skill_analysis(self, match: MatchResult) -> str:
        """Generate skill analysis."""
        score = match.skill_depth_score * 100

        analysis = f"Skill match score: {score:.0f}%. "

        if score >= 85:
            analysis += "Candidate demonstrates exceptional skill alignment with deep expertise in required technologies."
        elif score >= 70:
            analysis += "Candidate has strong skill coverage with good proficiency levels."
        elif score >= 60:
            analysis += "Candidate possesses core skills but may have some gaps in depth or breadth."
        else:
            analysis += "Significant skill gaps exist that may impact interview chances."

        if match.critical_gaps:
            analysis += f" Missing critical skills: {', '.join(match.critical_gaps[:3])}."

        return analysis

    def _generate_experience_analysis(self, match: MatchResult) -> str:
        """Generate experience analysis."""
        score = match.experience_relevance_score * 100

        analysis = f"Experience relevance score: {score:.0f}%. "

        if score >= 90:
            analysis += "Experience level is perfectly aligned with job requirements."
        elif score >= 70:
            analysis += "Experience is generally relevant and appropriate."
        else:
            analysis += "Experience level may not fully meet requirements."

        # Add seniority context
        seniority_score = match.seniority_match_score * 100
        if seniority_score >= 90:
            analysis += " Seniority level is an excellent match."
        elif seniority_score < 60:
            analysis += " Seniority level shows some mismatch with the role."

        return analysis

    def _generate_gap_analysis(self, match: MatchResult) -> str:
        """Generate gap analysis."""
        if not match.critical_gaps and not match.minor_gaps:
            return "No significant gaps identified. Candidate meets all core requirements."

        analysis = ""

        if match.critical_gaps:
            analysis += f"Critical gaps: {', '.join(match.critical_gaps)}. "
            analysis += "These should be addressed to improve match strength. "

        if match.minor_gaps:
            analysis += f"Minor gaps: {', '.join(match.minor_gaps[:3])}. "
            analysis += "These are nice-to-have skills that could be learned on the job."

        return analysis

    def _generate_strength_analysis(self, match: MatchResult) -> str:
        """Generate strength analysis."""
        if not match.strengths:
            return "While there are some gaps, the candidate shows potential in several areas."

        return f"Key strengths: {', '.join(match.strengths)}. These factors significantly improve interview chances."

    def _generate_improvement_recommendations(self, match: MatchResult) -> List[str]:
        """Generate recommendations to improve match."""
        recommendations = []

        if match.skill_depth_score < 0.7 and match.critical_gaps:
            recommendations.append(
                f"Acquire or highlight experience with: {', '.join(match.critical_gaps[:3])}"
            )

        if match.experience_relevance_score < 0.7:
            recommendations.append(
                "Emphasize relevant experience and quantify achievements in your resume"
            )

        if match.industry_fit_score < 0.6:
            recommendations.append(
                "Research the industry and highlight transferable skills"
            )

        if len(recommendations) == 0:
            recommendations.append(
                "Profile is strong - focus on tailoring your application to this specific role"
            )

        return recommendations

    def _generate_application_tips(self, match: MatchResult) -> List[str]:
        """Generate application tips."""
        tips = []

        if match.interview_probability >= 0.7:
            tips.append("Apply with confidence - this is a strong match")
            tips.append("Highlight your relevant skills and experience in your cover letter")
        else:
            tips.append("Consider whether this role is the best fit for your background")
            tips.append("If applying, emphasize transferable skills and learning agility")

        if match.critical_gaps:
            tips.append("Address skill gaps in your cover letter by showing related experience")

        tips.append("Customize your resume to emphasize the most relevant experience")
        tips.append("Research the company culture and align your application accordingly")

        return tips[:5]

    def _calculate_confidence(self, match: MatchResult) -> float:
        """Calculate confidence in prediction."""
        # Confidence based on data completeness and score consistency
        completeness = match.metadata.get("profile_completeness", 0.7)

        # Check variance in component scores
        scores = [
            match.skill_depth_score,
            match.experience_relevance_score,
            match.seniority_match_score,
            match.industry_fit_score,
            match.education_match_score
        ]

        variance = np.var(scores)
        consistency = 1 - min(variance, 0.3) / 0.3  # Normalize

        confidence = (completeness * 0.6) + (consistency * 0.4)

        return float(np.clip(confidence, 0.0, 1.0))

    def _feedback_to_training_data(
        self,
        match: MatchResult,
        feedback: MatchFeedback
    ) -> TrainingDataPoint:
        """Convert feedback to training data point."""
        # Map outcome to score
        outcome_map = {
            OutcomeType.REJECTED: 0.0,
            OutcomeType.INTERVIEW: 0.5,
            OutcomeType.OFFER: 1.0,
            OutcomeType.ACCEPTED: 1.0,
            OutcomeType.DECLINED: 1.0
        }

        outcome_score = outcome_map.get(feedback.actual_outcome, 0.0)

        # Calculate weight (more recent = higher weight)
        days_old = (datetime.utcnow() - feedback.created_at).days
        weight = max(0.5, 1.0 - (days_old / 365))  # Decay over 1 year

        return TrainingDataPoint(
            skill_overlap=match.skill_depth_score,
            skill_depth=match.skill_depth_score,
            experience_years=int(match.metadata.get("profile_completeness", 0) * 10),  # Proxy
            seniority_gap=0,  # Would need to extract from metadata
            industry_match=match.industry_fit_score > 0.8,
            education_level=3,  # Would need to extract
            education_match=match.education_match_score > 0.8,
            keyword_density=match.metadata.get("component_scores", {}).get("keyword_density", 0.5),
            recent_experience_relevance=match.experience_relevance_score,
            company_size_match=True,  # Would need to extract
            location_match=True,  # Would need to extract
            outcome_score=outcome_score,
            weight=weight,
            source="user_feedback",
            created_at=datetime.utcnow()
        )
