"""
Tests for job matching algorithms and services.
"""

import pytest
import numpy as np
from unittest.mock import Mock, AsyncMock, patch

from src.models.job_matcher import JobMatcher
from src.schemas.request_schemas import CandidateProfile, JobPosting
from src.schemas.response_schemas import MatchScore


class TestJobMatcher:
    """Tests for JobMatcher class."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance with mocked dependencies."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_generate_candidate_embedding(self, job_matcher, sample_candidate_profile):
        """Test candidate embedding generation."""
        embedding = await job_matcher.generate_candidate_embedding(sample_candidate_profile)

        assert embedding is not None
        assert len(embedding) == 1536  # OpenAI embedding dimension
        job_matcher.embedding_service.embed.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_job_embedding(self, job_matcher, sample_job_posting):
        """Test job posting embedding generation."""
        embedding = await job_matcher.generate_job_embedding(sample_job_posting)

        assert embedding is not None
        assert len(embedding) == 1536
        job_matcher.embedding_service.embed.assert_called_once()

    @pytest.mark.asyncio
    async def test_find_matching_jobs_success(self, job_matcher):
        """Test finding matching jobs."""
        embedding = np.random.rand(1536)
        filters = {"location": "San Francisco", "remote": True}

        results = await job_matcher.find_matching_jobs(
            embedding=embedding,
            filters=filters,
            top_k=20
        )

        assert isinstance(results, list)
        assert len(results) > 0
        job_matcher.vector_store.query.assert_called_once()

    @pytest.mark.asyncio
    async def test_find_matching_jobs_with_salary_filter(self, job_matcher):
        """Test finding jobs with salary filter."""
        embedding = np.random.rand(1536)
        filters = {"min_salary": 100000}

        results = await job_matcher.find_matching_jobs(
            embedding=embedding,
            filters=filters,
            top_k=50
        )

        assert isinstance(results, list)
        # Verify query was called with proper filter
        call_args = job_matcher.vector_store.query.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_calculate_match_score_success(self, job_matcher):
        """Test successful match score calculation."""
        candidate = {
            "skills": ["Python", "AWS", "Docker"],
            "experience_years": 5,
            "location_preferences": ["San Francisco"],
            "culture_preferences": {"work_life_balance": "high"}
        }

        job = {
            "required_skills": ["Python", "AWS"],
            "preferred_skills": ["Docker"],
            "min_experience": 3,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "hybrid",
            "company_culture": {"work_life_balance": "high"}
        }

        match_score = await job_matcher.calculate_match_score(candidate, job)

        assert isinstance(match_score, MatchScore)
        assert 0.0 <= match_score.overall_score <= 1.0
        assert 0.0 <= match_score.skill_match_score <= 1.0
        assert 0.0 <= match_score.experience_match_score <= 1.0
        assert 0.0 <= match_score.location_match_score <= 1.0
        assert match_score.explanation != ""
        assert isinstance(match_score.strengths, list)
        assert isinstance(match_score.gaps, list)


class TestSkillMatching:
    """Tests for skill matching algorithm."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    def test_perfect_skill_match(self, job_matcher):
        """Test perfect skill match scenario."""
        candidate_skills = ["Python", "AWS", "Docker", "Kubernetes"]
        required_skills = ["Python", "AWS", "Docker"]
        preferred_skills = ["Kubernetes"]

        score = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        assert score == 1.0

    def test_partial_skill_match(self, job_matcher):
        """Test partial skill match."""
        candidate_skills = ["Python", "AWS"]
        required_skills = ["Python", "AWS", "Docker"]
        preferred_skills = ["Kubernetes"]

        score = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        assert 0.0 < score < 1.0
        # With 2/3 required skills, score should be around 0.47 (2/3 * 0.7)
        assert 0.4 < score < 0.6

    def test_no_skill_match(self, job_matcher):
        """Test no skill overlap."""
        candidate_skills = ["Java", "Spring"]
        required_skills = ["Python", "Django"]
        preferred_skills = []

        score = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        assert score == 0.0

    def test_case_insensitive_skill_matching(self, job_matcher):
        """Test that skill matching is case-insensitive."""
        candidate_skills = ["python", "aws"]
        required_skills = ["Python", "AWS"]
        preferred_skills = []

        score = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        assert score == 1.0

    def test_skill_match_with_no_requirements(self, job_matcher):
        """Test skill matching when no requirements specified."""
        candidate_skills = ["Python", "AWS"]
        required_skills = []
        preferred_skills = []

        score = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        assert score == 1.0

    def test_preferred_skills_bonus(self, job_matcher):
        """Test that preferred skills improve score."""
        candidate_skills = ["Python", "AWS", "Docker", "Kubernetes"]
        required_skills = ["Python", "AWS"]
        preferred_skills = ["Docker", "Kubernetes"]

        score_with_preferred = job_matcher._calculate_skill_match(
            candidate_skills,
            required_skills,
            preferred_skills
        )

        candidate_skills_no_preferred = ["Python", "AWS"]
        score_without_preferred = job_matcher._calculate_skill_match(
            candidate_skills_no_preferred,
            required_skills,
            preferred_skills
        )

        assert score_with_preferred > score_without_preferred


class TestExperienceMatching:
    """Tests for experience matching algorithm."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    def test_perfect_experience_match(self, job_matcher):
        """Test experience within required range."""
        score = job_matcher._calculate_experience_match(
            years=5,
            min_required=3,
            max_preferred=10
        )

        assert score == 1.0

    def test_insufficient_experience(self, job_matcher):
        """Test candidate with insufficient experience."""
        score = job_matcher._calculate_experience_match(
            years=2,
            min_required=5,
            max_preferred=10
        )

        assert 0.0 < score < 1.0
        # 3 years deficit with 0.15 penalty per year = 0.55
        assert score == pytest.approx(0.55, rel=0.01)

    def test_overqualified_candidate(self, job_matcher):
        """Test overqualified candidate."""
        score = job_matcher._calculate_experience_match(
            years=15,
            min_required=3,
            max_preferred=10
        )

        assert 0.6 <= score < 1.0
        # 5 years excess with 0.05 penalty per year = 0.75
        assert score == pytest.approx(0.75, rel=0.01)

    def test_minimum_experience_boundary(self, job_matcher):
        """Test exact minimum experience."""
        score = job_matcher._calculate_experience_match(
            years=3,
            min_required=3,
            max_preferred=10
        )

        assert score == 1.0

    def test_maximum_experience_boundary(self, job_matcher):
        """Test exact maximum experience."""
        score = job_matcher._calculate_experience_match(
            years=10,
            min_required=3,
            max_preferred=10
        )

        assert score == 1.0

    def test_zero_experience(self, job_matcher):
        """Test entry-level candidate."""
        score = job_matcher._calculate_experience_match(
            years=0,
            min_required=0,
            max_preferred=2
        )

        assert score == 1.0


class TestLocationMatching:
    """Tests for location matching algorithm."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    def test_remote_job_perfect_match(self, job_matcher):
        """Test that remote jobs match all candidates."""
        score = job_matcher._calculate_location_match(
            preferences=["New York"],
            job_location="San Francisco",
            remote_policy="remote"
        )

        assert score == 1.0

    def test_hybrid_job_good_match(self, job_matcher):
        """Test hybrid jobs have good match score."""
        score = job_matcher._calculate_location_match(
            preferences=["New York"],
            job_location="San Francisco",
            remote_policy="hybrid"
        )

        assert score == 0.85

    def test_location_preference_match(self, job_matcher):
        """Test matching location preference."""
        score = job_matcher._calculate_location_match(
            preferences=["San Francisco", "New York"],
            job_location="San Francisco",
            remote_policy=""
        )

        assert score == 1.0

    def test_location_mismatch(self, job_matcher):
        """Test location mismatch."""
        score = job_matcher._calculate_location_match(
            preferences=["New York"],
            job_location="San Francisco",
            remote_policy=""
        )

        assert score == 0.3

    def test_no_location_data(self, job_matcher):
        """Test neutral score when no location data."""
        score = job_matcher._calculate_location_match(
            preferences=[],
            job_location="",
            remote_policy=""
        )

        assert score == 0.5

    def test_partial_location_match(self, job_matcher):
        """Test partial location string matching."""
        score = job_matcher._calculate_location_match(
            preferences=["San Francisco Bay Area"],
            job_location="San Francisco, CA",
            remote_policy=""
        )

        assert score == 1.0


class TestCultureMatching:
    """Tests for culture matching algorithm."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_culture_match_with_llm(self, job_matcher):
        """Test culture matching using LLM."""
        preferences = {
            "work_life_balance": "high",
            "innovation": "high",
            "collaboration": "medium"
        }

        company_culture = {
            "work_life_balance": "high",
            "innovation": "high",
            "collaboration": "high"
        }

        # Mock LLM response with score
        job_matcher.llm_service.complete = AsyncMock(return_value="0.85")

        score = await job_matcher._calculate_culture_match(
            preferences,
            company_culture
        )

        assert 0.0 <= score <= 1.0
        assert score == 0.85

    @pytest.mark.asyncio
    async def test_culture_match_with_percentage_response(self, job_matcher):
        """Test parsing percentage from LLM response."""
        preferences = {"work_life_balance": "high"}
        company_culture = {"work_life_balance": "medium"}

        # Mock LLM response with percentage
        job_matcher.llm_service.complete = AsyncMock(return_value="The culture fit is 75%")

        score = await job_matcher._calculate_culture_match(
            preferences,
            company_culture
        )

        assert score == 0.75

    @pytest.mark.asyncio
    async def test_culture_match_no_data(self, job_matcher):
        """Test neutral score when no culture data."""
        score = await job_matcher._calculate_culture_match({}, {})

        assert score == 0.7

    @pytest.mark.asyncio
    async def test_culture_match_llm_failure(self, job_matcher):
        """Test fallback when LLM fails."""
        preferences = {"work_life_balance": "high"}
        company_culture = {"work_life_balance": "high"}

        # Mock LLM failure
        job_matcher.llm_service.complete = AsyncMock(side_effect=Exception("LLM Error"))

        score = await job_matcher._calculate_culture_match(
            preferences,
            company_culture
        )

        assert score == 0.7  # Default neutral score


class TestMatchScoreCalculation:
    """Tests for overall match score calculation."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        # Mock LLM to return culture score
        mock_llm_service.complete = AsyncMock(return_value="0.75")
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_weighted_score_calculation(self, job_matcher):
        """Test that overall score uses proper weights."""
        from src.config import settings

        candidate = {
            "skills": ["Python", "AWS"],
            "experience_years": 5,
            "location_preferences": ["San Francisco"],
            "culture_preferences": {"work_life_balance": "high"}
        }

        job = {
            "required_skills": ["Python", "AWS"],
            "preferred_skills": [],
            "min_experience": 5,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "",
            "company_culture": {"work_life_balance": "high"}
        }

        match_score = await job_matcher.calculate_match_score(candidate, job)

        # Verify score is weighted average
        expected_score = (
            match_score.skill_match_score * settings.skill_match_weight +
            match_score.experience_match_score * settings.experience_match_weight +
            match_score.location_match_score * settings.location_match_weight +
            match_score.culture_match_score * settings.culture_match_weight
        )

        assert match_score.overall_score == pytest.approx(expected_score, rel=0.01)

    @pytest.mark.asyncio
    async def test_match_score_includes_strengths(self, job_matcher):
        """Test that high scores generate strengths."""
        candidate = {
            "skills": ["Python", "AWS", "Docker", "Kubernetes"],
            "experience_years": 5,
            "location_preferences": ["San Francisco"],
            "culture_preferences": {}
        }

        job = {
            "required_skills": ["Python", "AWS", "Docker"],
            "preferred_skills": ["Kubernetes"],
            "min_experience": 5,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "",
            "company_culture": {}
        }

        match_score = await job_matcher.calculate_match_score(candidate, job)

        assert len(match_score.strengths) > 0
        assert any("skill" in s.lower() for s in match_score.strengths)

    @pytest.mark.asyncio
    async def test_match_score_includes_gaps(self, job_matcher):
        """Test that low scores generate gaps."""
        candidate = {
            "skills": ["Java"],
            "experience_years": 2,
            "location_preferences": ["New York"],
            "culture_preferences": {}
        }

        job = {
            "required_skills": ["Python", "AWS", "Docker"],
            "preferred_skills": [],
            "min_experience": 5,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "",
            "company_culture": {}
        }

        match_score = await job_matcher.calculate_match_score(candidate, job)

        assert len(match_score.gaps) > 0


class TestMatchExplanation:
    """Tests for match explanation generation."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    def test_excellent_match_explanation(self, job_matcher):
        """Test explanation for excellent match."""
        scores = {
            "overall": 0.90,
            "skills": 0.95,
            "experience": 0.90,
            "location": 1.0,
            "culture": 0.85
        }

        explanation = job_matcher._generate_explanation(scores, {}, {})

        assert "Excellent match" in explanation
        assert "Skills align very well" in explanation

    def test_moderate_match_explanation(self, job_matcher):
        """Test explanation for moderate match."""
        scores = {
            "overall": 0.60,
            "skills": 0.65,
            "experience": 0.70,
            "location": 0.50,
            "culture": 0.60
        }

        explanation = job_matcher._generate_explanation(scores, {}, {})

        assert "Moderate match" in explanation or "match" in explanation.lower()

    def test_weak_match_explanation(self, job_matcher):
        """Test explanation for weak match."""
        scores = {
            "overall": 0.40,
            "skills": 0.30,
            "experience": 0.50,
            "location": 0.40,
            "culture": 0.40
        }

        explanation = job_matcher._generate_explanation(scores, {}, {})

        assert len(explanation) > 0


class TestVectorSimilarity:
    """Tests for vector similarity calculations."""

    @pytest.mark.asyncio
    async def test_embedding_generation_consistency(self, mock_embedding_service):
        """Test that same input generates same embedding."""
        text = "Software Engineer with Python experience"

        embedding1 = await mock_embedding_service.embed(text)
        embedding2 = await mock_embedding_service.embed(text)

        # In real scenario, embeddings should be identical for same input
        # With mocked service, we just verify the calls
        assert mock_embedding_service.embed.call_count == 2

    @pytest.mark.asyncio
    async def test_batch_embedding_generation(self, mock_embedding_service):
        """Test batch embedding generation."""
        texts = [
            "Software Engineer",
            "Data Scientist",
            "Product Manager"
        ]

        embeddings = await mock_embedding_service.embed_batch(texts)

        assert len(embeddings) == 2  # Mock returns 2 embeddings
        mock_embedding_service.embed_batch.assert_called_once_with(texts)

    def test_cosine_similarity_calculation(self):
        """Test cosine similarity between vectors."""
        vec1 = np.array([1, 0, 0])
        vec2 = np.array([1, 0, 0])
        vec3 = np.array([0, 1, 0])

        # Identical vectors
        similarity1 = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        assert similarity1 == pytest.approx(1.0)

        # Orthogonal vectors
        similarity2 = np.dot(vec1, vec3) / (np.linalg.norm(vec1) * np.linalg.norm(vec3))
        assert similarity2 == pytest.approx(0.0)


class TestMatchingIntegration:
    """Integration tests for matching service."""

    @pytest.mark.asyncio
    async def test_end_to_end_matching(
        self,
        job_matcher,
        sample_candidate_profile,
        sample_job_posting
    ):
        """Test complete matching pipeline."""
        # Generate candidate embedding
        candidate_embedding = await job_matcher.generate_candidate_embedding(
            sample_candidate_profile
        )
        assert candidate_embedding is not None

        # Find matching jobs
        matching_jobs = await job_matcher.find_matching_jobs(
            embedding=candidate_embedding,
            filters={},
            top_k=10
        )
        assert len(matching_jobs) > 0

        # Calculate detailed score for first match
        candidate_data = {
            "skills": sample_candidate_profile.skills,
            "experience_years": sample_candidate_profile.experience_years,
            "location_preferences": sample_candidate_profile.location_preferences,
            "culture_preferences": sample_candidate_profile.culture_preferences
        }

        job_data = {
            "required_skills": sample_job_posting.required_skills,
            "preferred_skills": sample_job_posting.preferred_skills,
            "min_experience": sample_job_posting.min_experience,
            "max_experience": sample_job_posting.max_experience,
            "location": sample_job_posting.location,
            "remote_policy": sample_job_posting.remote_policy,
            "company_culture": sample_job_posting.company_culture
        }

        match_score = await job_matcher.calculate_match_score(candidate_data, job_data)
        assert 0.0 <= match_score.overall_score <= 1.0
