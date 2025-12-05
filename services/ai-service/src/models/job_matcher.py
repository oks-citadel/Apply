"""
AI-powered job matching engine.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
import structlog

from ..schemas import CandidateProfile, JobPosting, JobMatch, MatchScore
from ..services.embedding_service import EmbeddingService
from ..services.vector_store import VectorStore
from ..services.llm_service import LLMService
from ..utils.prompts import format_match_explanation_prompt, format_culture_fit_prompt
from ..config import settings

logger = structlog.get_logger()


class JobMatcher:
    """
    AI-powered job matching engine.

    Features:
    - Vector embedding generation
    - Multi-factor scoring (skills, experience, location, culture)
    - Explainable match scores
    """

    def __init__(
        self,
        embedding_service: EmbeddingService,
        vector_store: VectorStore,
        llm_service: LLMService,
    ):
        """
        Initialize job matcher.

        Args:
            embedding_service: Service for generating embeddings
            vector_store: Vector store for similarity search
            llm_service: LLM service for explanations
        """
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.llm_service = llm_service

    async def generate_candidate_embedding(
        self, profile: CandidateProfile
    ) -> np.ndarray:
        """
        Generate embedding for candidate profile.

        Args:
            profile: Candidate profile

        Returns:
            Embedding vector
        """
        # Construct text representation of candidate
        text_parts = []

        if profile.title:
            text_parts.append(f"Title: {profile.title}")

        if profile.summary:
            text_parts.append(f"Summary: {profile.summary}")

        if profile.skills:
            text_parts.append(f"Skills: {', '.join(profile.skills)}")

        if profile.experience_years:
            text_parts.append(f"Experience: {profile.experience_years} years")

        # Add work history
        for job in profile.work_history[:3]:  # Top 3 recent jobs
            job_text = f"Previous role: {job.get('title', '')} at {job.get('company', '')}"
            if job.get("description"):
                job_text += f" - {job['description']}"
            text_parts.append(job_text)

        candidate_text = "\n".join(text_parts)

        # Generate embedding
        embedding = await self.embedding_service.embed(candidate_text)

        logger.info(
            "Generated candidate embedding",
            candidate_id=profile.id,
            text_length=len(candidate_text),
        )

        return embedding

    async def generate_job_embedding(self, job: JobPosting) -> np.ndarray:
        """
        Generate embedding for job posting.

        Args:
            job: Job posting

        Returns:
            Embedding vector
        """
        # Construct text representation of job
        text_parts = [
            f"Title: {job.title}",
            f"Company: {job.company_name}",
            f"Description: {job.description}",
        ]

        if job.required_skills:
            text_parts.append(f"Required Skills: {', '.join(job.required_skills)}")

        if job.preferred_skills:
            text_parts.append(f"Preferred Skills: {', '.join(job.preferred_skills)}")

        if job.min_experience:
            text_parts.append(f"Minimum Experience: {job.min_experience} years")

        job_text = "\n".join(text_parts)

        # Generate embedding
        embedding = await self.embedding_service.embed(job_text)

        logger.info(
            "Generated job embedding",
            job_id=job.id,
            text_length=len(job_text),
        )

        return embedding

    async def find_matching_jobs(
        self,
        embedding: np.ndarray,
        filters: Dict[str, Any],
        top_k: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Find matching jobs using vector similarity.

        Args:
            embedding: Candidate embedding
            filters: Search filters
            top_k: Number of results to return

        Returns:
            List of matching jobs
        """
        # Build Pinecone filter from search filters
        pinecone_filter = {}

        if "location" in filters:
            pinecone_filter["location"] = filters["location"]

        if "remote" in filters:
            pinecone_filter["remote_policy"] = {"$in": ["remote", "hybrid"]}

        if "min_salary" in filters:
            pinecone_filter["salary_min"] = {"$gte": filters["min_salary"]}

        # Query vector store
        results = await self.vector_store.query(
            vector=embedding,
            top_k=top_k,
            filter=pinecone_filter if pinecone_filter else None,
            include_metadata=True,
        )

        logger.info(
            f"Found {len(results)} matching jobs",
            filters=filters,
            top_k=top_k,
        )

        return results

    async def calculate_match_score(
        self,
        candidate: Dict[str, Any],
        job: Dict[str, Any],
    ) -> MatchScore:
        """
        Calculate detailed match score between candidate and job.

        Args:
            candidate: Candidate data
            job: Job data

        Returns:
            Match score with breakdown
        """
        # Calculate individual component scores
        skill_score = self._calculate_skill_match(
            candidate.get("skills", []),
            job.get("required_skills", []),
            job.get("preferred_skills", []),
        )

        experience_score = self._calculate_experience_match(
            candidate.get("experience_years", 0),
            job.get("min_experience", 0),
            job.get("max_experience", 99),
        )

        location_score = self._calculate_location_match(
            candidate.get("location_preferences", []),
            job.get("location", ""),
            job.get("remote_policy", ""),
        )

        culture_score = await self._calculate_culture_match(
            candidate.get("culture_preferences", {}),
            job.get("company_culture", {}),
        )

        # Calculate weighted overall score
        overall_score = (
            skill_score * settings.skill_match_weight
            + experience_score * settings.experience_match_weight
            + location_score * settings.location_match_weight
            + culture_score * settings.culture_match_weight
        )

        # Generate explanation
        explanation = self._generate_explanation(
            {
                "overall": overall_score,
                "skills": skill_score,
                "experience": experience_score,
                "location": location_score,
                "culture": culture_score,
            },
            candidate,
            job,
        )

        # Identify strengths and gaps
        strengths = []
        gaps = []

        if skill_score >= 0.8:
            strengths.append("Excellent skill match")
        elif skill_score < 0.6:
            gaps.append("Some key skills missing")

        if experience_score >= 0.9:
            strengths.append("Experience level is ideal")
        elif experience_score < 0.5:
            gaps.append("Experience level mismatch")

        if location_score == 1.0:
            strengths.append("Perfect location match")
        elif location_score < 0.5:
            gaps.append("Location may be a concern")

        return MatchScore(
            overall_score=overall_score,
            skill_match_score=skill_score,
            experience_match_score=experience_score,
            location_match_score=location_score,
            culture_match_score=culture_score,
            explanation=explanation,
            strengths=strengths,
            gaps=gaps,
        )

    def _calculate_skill_match(
        self,
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str],
    ) -> float:
        """Calculate skill match score."""
        if not required_skills and not preferred_skills:
            return 1.0

        # Normalize skills to lowercase
        candidate_skills_lower = {s.lower() for s in candidate_skills}
        required_skills_lower = {s.lower() for s in required_skills}
        preferred_skills_lower = {s.lower() for s in preferred_skills}

        # Calculate required skills match
        if required_skills:
            required_matched = len(required_skills_lower & candidate_skills_lower)
            required_score = required_matched / len(required_skills)
        else:
            required_score = 1.0

        # Calculate preferred skills match
        if preferred_skills:
            preferred_matched = len(preferred_skills_lower & candidate_skills_lower)
            preferred_score = preferred_matched / len(preferred_skills)
        else:
            preferred_score = 1.0

        # Weighted combination (required skills are more important)
        skill_score = (required_score * 0.7) + (preferred_score * 0.3)

        return float(np.clip(skill_score, 0.0, 1.0))

    def _calculate_experience_match(
        self,
        years: int,
        min_required: int,
        max_preferred: int,
    ) -> float:
        """Calculate experience match score."""
        if years < min_required:
            # Penalize insufficient experience
            deficit = min_required - years
            return float(np.clip(1.0 - (deficit * 0.15), 0.0, 1.0))

        if years > max_preferred:
            # Slight penalty for over-qualification
            excess = years - max_preferred
            return float(np.clip(1.0 - (excess * 0.05), 0.6, 1.0))

        # Perfect match within range
        return 1.0

    def _calculate_location_match(
        self,
        preferences: List[str],
        job_location: str,
        remote_policy: str,
    ) -> float:
        """Calculate location match score."""
        # Remote jobs match everyone
        if remote_policy and remote_policy.lower() in ["remote", "fully remote"]:
            return 1.0

        # Hybrid is acceptable to most
        if remote_policy and remote_policy.lower() == "hybrid":
            return 0.85

        # Check location preferences
        if not preferences or not job_location:
            return 0.5  # Neutral if no data

        # Normalize locations
        job_location_lower = job_location.lower()
        preferences_lower = [p.lower() for p in preferences]

        # Check for match
        for pref in preferences_lower:
            if pref in job_location_lower or job_location_lower in pref:
                return 1.0

        # No match
        return 0.3

    async def _calculate_culture_match(
        self,
        preferences: Dict[str, Any],
        company_culture: Dict[str, Any],
    ) -> float:
        """Calculate culture fit score using LLM."""
        if not preferences or not company_culture:
            return 0.7  # Neutral score if no data

        try:
            # Use LLM to assess culture fit
            prompt = format_culture_fit_prompt(preferences, company_culture)
            response = await self.llm_service.complete(prompt, temperature=0.3)

            # Extract score from response (looking for a number between 0 and 1)
            # This is a simplified extraction - production should use structured output
            import re

            score_match = re.search(r"(\d+\.?\d*)", response)
            if score_match:
                score = float(score_match.group(1))
                # Normalize if score is given as percentage
                if score > 1:
                    score = score / 100
                return float(np.clip(score, 0.0, 1.0))

        except Exception as e:
            logger.warning(f"Culture fit calculation failed: {e}")

        return 0.7  # Default neutral score

    def _generate_explanation(
        self,
        scores: Dict[str, float],
        candidate: Dict[str, Any],
        job: Dict[str, Any],
    ) -> str:
        """Generate human-readable explanation of match."""
        overall = scores["overall"]

        if overall >= 0.85:
            intro = "Excellent match!"
        elif overall >= 0.7:
            intro = "Strong match."
        elif overall >= 0.5:
            intro = "Moderate match."
        else:
            intro = "Weak match."

        # Build explanation
        parts = [intro]

        # Skill match
        if scores["skills"] >= 0.8:
            parts.append("Skills align very well with requirements.")
        elif scores["skills"] >= 0.6:
            parts.append("Most required skills are present.")
        else:
            parts.append("Several key skills are missing.")

        # Experience match
        if scores["experience"] >= 0.9:
            parts.append("Experience level is ideal for this role.")
        elif scores["experience"] >= 0.7:
            parts.append("Experience is adequate.")
        else:
            parts.append("Experience level may not align perfectly.")

        # Location match
        if scores["location"] >= 0.9:
            parts.append("Location is a perfect fit.")
        elif scores["location"] >= 0.7:
            parts.append("Location is workable.")

        return " ".join(parts)
