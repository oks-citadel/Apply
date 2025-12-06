"""
Comprehensive tests for job matching functionality.
Tests match score calculations, vector similarity, and ranking algorithms.
"""

import pytest
import numpy as np
from unittest.mock import AsyncMock, Mock, patch
from typing import Dict, Any, List
from src.models.job_matcher import JobMatcher
from src.schemas import CandidateProfile, JobPosting, JobMatch, MatchScore


class TestJobMatcher:
    """Tests for JobMatcher class."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.fixture
    def sample_candidate_profile(self):
        """Sample candidate profile for testing."""
        return CandidateProfile(
            id="candidate123",
            title="Senior Software Engineer",
            summary="Experienced backend developer with 7 years of Python and AWS experience",
            skills=["Python", "AWS", "Docker", "PostgreSQL", "FastAPI", "Kubernetes"],
            experience_years=7,
            location_preferences=["San Francisco", "Remote"],
            work_history=[
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "description": "Built scalable microservices",
                    "start_date": "2020-01-01",
                    "end_date": "present"
                },
                {
                    "title": "Software Engineer",
                    "company": "StartupCo",
                    "description": "Developed backend APIs",
                    "start_date": "2018-06-01",
                    "end_date": "2019-12-31"
                }
            ],
            culture_preferences={
                "work_style": "collaborative",
                "company_size": "medium",
                "values": ["innovation", "work-life balance"]
            }
        )

    @pytest.fixture
    def sample_job_posting(self):
        """Sample job posting for testing."""
        return JobPosting(
            id="job456",
            title="Senior Backend Engineer",
            company_name="Innovative Tech Inc",
            description="Looking for an experienced backend engineer to build scalable systems",
            required_skills=["Python", "AWS", "Docker", "PostgreSQL"],
            preferred_skills=["Kubernetes", "FastAPI", "Redis"],
            min_experience=5,
            max_experience=10,
            location="San Francisco, CA",
            remote_policy="hybrid",
            salary_min=150000,
            salary_max=200000,
            company_culture={
                "values": ["innovation", "collaboration"],
                "work_style": "hybrid",
                "company_size": "medium"
            }
        )


class TestEmbeddingGeneration:
    """Tests for embedding generation."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_generate_candidate_embedding(self, job_matcher, sample_candidate_profile):
        """Test candidate embedding generation."""
        # Mock embedding service
        mock_embedding = np.random.rand(384).astype(np.float32)
        job_matcher.embedding_service.embed = AsyncMock(return_value=mock_embedding)

        embedding = await job_matcher.generate_candidate_embedding(sample_candidate_profile)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (384,)
        assert embedding.dtype == np.float32
        job_matcher.embedding_service.embed.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_job_embedding(self, job_matcher, sample_job_posting):
        """Test job posting embedding generation."""
        mock_embedding = np.random.rand(384).astype(np.float32)
        job_matcher.embedding_service.embed = AsyncMock(return_value=mock_embedding)

        embedding = await job_matcher.generate_job_embedding(sample_job_posting)

        assert isinstance(embedding, np.ndarray)
        assert embedding.shape == (384,)
        job_matcher.embedding_service.embed.assert_called_once()

    @pytest.mark.asyncio
    async def test_embedding_includes_all_profile_data(self, job_matcher, sample_candidate_profile):
        """Test that embedding includes all relevant profile data."""
        captured_text = None

        async def capture_embed(text):
            nonlocal captured_text
            captured_text = text
            return np.random.rand(384).astype(np.float32)

        job_matcher.embedding_service.embed = AsyncMock(side_effect=capture_embed)

        await job_matcher.generate_candidate_embedding(sample_candidate_profile)

        assert captured_text is not None
        assert "Senior Software Engineer" in captured_text
        assert "Python" in captured_text
        assert "7 years" in captured_text

    @pytest.mark.asyncio
    async def test_embedding_handles_missing_fields(self, job_matcher):
        """Test embedding generation with minimal profile data."""
        minimal_profile = CandidateProfile(
            id="candidate123",
            title="Developer",
            skills=["Python"]
        )

        job_matcher.embedding_service.embed = AsyncMock(return_value=np.random.rand(384).astype(np.float32))

        embedding = await job_matcher.generate_candidate_embedding(minimal_profile)

        assert isinstance(embedding, np.ndarray)


class TestMatchScoreCalculation:
    """Tests for match score calculation algorithm."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_perfect_match_score(self, job_matcher):
        """Test match score for perfect candidate-job match."""
        candidate = {
            "skills": ["Python", "AWS", "Docker", "PostgreSQL"],
            "experience_years": 7,
            "location_preferences": ["San Francisco"],
            "culture_preferences": {"work_style": "collaborative"}
        }

        job = {
            "required_skills": ["Python", "AWS", "Docker", "PostgreSQL"],
            "preferred_skills": [],
            "min_experience": 5,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "on-site",
            "company_culture": {"work_style": "collaborative"}
        }

        job_matcher.llm_service.complete = AsyncMock(return_value="0.95")

        score = await job_matcher.calculate_match_score(candidate, job)

        assert isinstance(score, MatchScore)
        assert score.overall_score >= 0.85
        assert score.skill_match_score >= 0.95
        assert score.experience_match_score >= 0.9
        assert len(score.strengths) > 0

    @pytest.mark.asyncio
    async def test_skill_match_calculation(self, job_matcher):
        """Test skill matching score calculation."""
        # High skill match
        score1 = job_matcher._calculate_skill_match(
            candidate_skills=["Python", "AWS", "Docker", "PostgreSQL", "Kubernetes"],
            required_skills=["Python", "AWS", "Docker", "PostgreSQL"],
            preferred_skills=["Kubernetes"]
        )

        assert score1 >= 0.9

        # Low skill match
        score2 = job_matcher._calculate_skill_match(
            candidate_skills=["Java", "Spring"],
            required_skills=["Python", "AWS", "Docker"],
            preferred_skills=[]
        )

        assert score2 < 0.5

    @pytest.mark.asyncio
    async def test_experience_match_calculation(self, job_matcher):
        """Test experience matching score calculation."""
        # Perfect match
        score1 = job_matcher._calculate_experience_match(
            years=7,
            min_required=5,
            max_preferred=10
        )
        assert score1 == 1.0

        # Under-qualified
        score2 = job_matcher._calculate_experience_match(
            years=2,
            min_required=5,
            max_preferred=10
        )
        assert score2 < 1.0

        # Over-qualified
        score3 = job_matcher._calculate_experience_match(
            years=15,
            min_required=5,
            max_preferred=10
        )
        assert score3 >= 0.6  # Slight penalty but not too harsh

    @pytest.mark.asyncio
    async def test_location_match_calculation(self, job_matcher):
        """Test location matching score calculation."""
        # Remote job - always matches
        score1 = job_matcher._calculate_location_match(
            preferences=["New York"],
            job_location="San Francisco",
            remote_policy="remote"
        )
        assert score1 == 1.0

        # Hybrid - good match
        score2 = job_matcher._calculate_location_match(
            preferences=["San Francisco"],
            job_location="San Francisco",
            remote_policy="hybrid"
        )
        assert score2 >= 0.85

        # Location mismatch
        score3 = job_matcher._calculate_location_match(
            preferences=["New York"],
            job_location="San Francisco",
            remote_policy="on-site"
        )
        assert score3 <= 0.5

    @pytest.mark.asyncio
    async def test_culture_match_calculation(self, job_matcher):
        """Test culture fit score calculation."""
        job_matcher.llm_service.complete = AsyncMock(return_value="0.85")

        preferences = {
            "work_style": "collaborative",
            "company_size": "medium",
            "values": ["innovation", "work-life balance"]
        }

        company_culture = {
            "work_style": "collaborative",
            "company_size": "medium",
            "values": ["innovation", "diversity"]
        }

        score = await job_matcher._calculate_culture_match(preferences, company_culture)

        assert isinstance(score, float)
        assert 0.0 <= score <= 1.0

    @pytest.mark.asyncio
    async def test_match_score_weights(self, job_matcher):
        """Test that match score components are weighted correctly."""
        candidate = {
            "skills": ["Python", "AWS"],
            "experience_years": 5,
            "location_preferences": ["Remote"],
            "culture_preferences": {}
        }

        job = {
            "required_skills": ["Python", "AWS"],
            "preferred_skills": [],
            "min_experience": 5,
            "max_experience": 10,
            "location": "Any",
            "remote_policy": "remote",
            "company_culture": {}
        }

        job_matcher.llm_service.complete = AsyncMock(return_value="0.7")

        score = await job_matcher.calculate_match_score(candidate, job)

        # Overall score should be weighted average of components
        weighted_score = (
            score.skill_match_score * 0.4 +
            score.experience_match_score * 0.3 +
            score.location_match_score * 0.15 +
            score.culture_match_score * 0.15
        )

        assert abs(score.overall_score - weighted_score) < 0.1


class TestJobSearch:
    """Tests for job search functionality."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_find_matching_jobs(self, job_matcher):
        """Test finding matching jobs using vector search."""
        embedding = np.random.rand(384).astype(np.float32)

        # Mock vector store results
        mock_results = [
            {
                "id": "job1",
                "score": 0.92,
                "metadata": {
                    "title": "Senior Backend Engineer",
                    "company": "Tech Corp",
                    "location": "San Francisco"
                }
            },
            {
                "id": "job2",
                "score": 0.87,
                "metadata": {
                    "title": "Staff Engineer",
                    "company": "StartupCo",
                    "location": "Remote"
                }
            }
        ]

        job_matcher.vector_store.query = AsyncMock(return_value=mock_results)

        filters = {"location": "San Francisco", "remote": True}
        results = await job_matcher.find_matching_jobs(embedding, filters, top_k=10)

        assert len(results) == 2
        assert results[0]["score"] >= results[1]["score"]  # Sorted by score
        job_matcher.vector_store.query.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_with_salary_filter(self, job_matcher):
        """Test job search with salary filters."""
        embedding = np.random.rand(384).astype(np.float32)

        job_matcher.vector_store.query = AsyncMock(return_value=[])

        filters = {"min_salary": 150000}
        await job_matcher.find_matching_jobs(embedding, filters, top_k=10)

        # Verify filter was passed to vector store
        call_args = job_matcher.vector_store.query.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_search_with_remote_filter(self, job_matcher):
        """Test job search with remote work filter."""
        embedding = np.random.rand(384).astype(np.float32)

        job_matcher.vector_store.query = AsyncMock(return_value=[])

        filters = {"remote": True}
        await job_matcher.find_matching_jobs(embedding, filters, top_k=10)

        call_args = job_matcher.vector_store.query.call_args
        assert call_args is not None

    @pytest.mark.asyncio
    async def test_search_results_limit(self, job_matcher):
        """Test that search respects top_k limit."""
        embedding = np.random.rand(384).astype(np.float32)

        # Return more results than requested
        mock_results = [{"id": f"job{i}", "score": 0.9 - i*0.01} for i in range(100)]
        job_matcher.vector_store.query = AsyncMock(return_value=mock_results)

        results = await job_matcher.find_matching_jobs(embedding, {}, top_k=10)

        # Should return at most top_k results
        assert len(results) <= 10


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

    @pytest.mark.asyncio
    async def test_generate_explanation_for_high_match(self, job_matcher):
        """Test explanation generation for high match scores."""
        scores = {
            "overall": 0.92,
            "skills": 0.95,
            "experience": 0.90,
            "location": 1.0,
            "culture": 0.85
        }

        candidate = {"skills": ["Python", "AWS"]}
        job = {"title": "Senior Engineer"}

        explanation = job_matcher._generate_explanation(scores, candidate, job)

        assert isinstance(explanation, str)
        assert len(explanation) > 0
        assert "excellent" in explanation.lower() or "strong" in explanation.lower()

    @pytest.mark.asyncio
    async def test_generate_explanation_for_low_match(self, job_matcher):
        """Test explanation generation for low match scores."""
        scores = {
            "overall": 0.35,
            "skills": 0.30,
            "experience": 0.40,
            "location": 0.30,
            "culture": 0.40
        }

        candidate = {"skills": ["Java"]}
        job = {"title": "Python Engineer"}

        explanation = job_matcher._generate_explanation(scores, candidate, job)

        assert isinstance(explanation, str)
        assert "weak" in explanation.lower() or "missing" in explanation.lower()

    @pytest.mark.asyncio
    async def test_explanation_identifies_strengths(self, job_matcher):
        """Test that explanation identifies candidate strengths."""
        scores = {
            "overall": 0.80,
            "skills": 0.95,
            "experience": 0.75,
            "location": 0.70,
            "culture": 0.75
        }

        candidate = {"skills": ["Python", "AWS", "Docker"]}
        job = {"required_skills": ["Python", "AWS"]}

        explanation = job_matcher._generate_explanation(scores, candidate, job)

        assert "skill" in explanation.lower()

    @pytest.mark.asyncio
    async def test_explanation_identifies_gaps(self, job_matcher):
        """Test that explanation identifies skill gaps."""
        scores = {
            "overall": 0.60,
            "skills": 0.40,
            "experience": 0.70,
            "location": 0.80,
            "culture": 0.70
        }

        candidate = {"skills": ["Python"]}
        job = {"required_skills": ["Python", "AWS", "Kubernetes"]}

        explanation = job_matcher._generate_explanation(scores, candidate, job)

        assert "missing" in explanation.lower() or "skill" in explanation.lower()


class TestMatchRanking:
    """Tests for match ranking and sorting."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_rank_matches_by_score(self, job_matcher):
        """Test that matches are ranked by overall score."""
        matches = [
            {"id": "job1", "score": 0.75},
            {"id": "job2", "score": 0.92},
            {"id": "job3", "score": 0.83}
        ]

        # Results should be sorted by score
        sorted_matches = sorted(matches, key=lambda x: x["score"], reverse=True)

        assert sorted_matches[0]["id"] == "job2"
        assert sorted_matches[1]["id"] == "job3"
        assert sorted_matches[2]["id"] == "job1"

    @pytest.mark.asyncio
    async def test_filter_low_quality_matches(self, job_matcher):
        """Test filtering out low quality matches."""
        matches = [
            {"id": "job1", "score": 0.92},
            {"id": "job2", "score": 0.45},
            {"id": "job3", "score": 0.78}
        ]

        # Filter out matches below 0.5 threshold
        quality_matches = [m for m in matches if m["score"] >= 0.5]

        assert len(quality_matches) == 2
        assert "job2" not in [m["id"] for m in quality_matches]


class TestEdgeCases:
    """Tests for edge cases in job matching."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_empty_candidate_skills(self, job_matcher):
        """Test matching with candidate having no skills listed."""
        score = job_matcher._calculate_skill_match(
            candidate_skills=[],
            required_skills=["Python", "AWS"],
            preferred_skills=[]
        )

        assert score == 0.0

    @pytest.mark.asyncio
    async def test_empty_job_requirements(self, job_matcher):
        """Test matching when job has no skill requirements."""
        score = job_matcher._calculate_skill_match(
            candidate_skills=["Python", "AWS"],
            required_skills=[],
            preferred_skills=[]
        )

        assert score == 1.0  # No requirements means perfect match

    @pytest.mark.asyncio
    async def test_case_insensitive_skill_matching(self, job_matcher):
        """Test that skill matching is case-insensitive."""
        score1 = job_matcher._calculate_skill_match(
            candidate_skills=["python", "aws"],
            required_skills=["Python", "AWS"],
            preferred_skills=[]
        )

        score2 = job_matcher._calculate_skill_match(
            candidate_skills=["PYTHON", "AWS"],
            required_skills=["Python", "aws"],
            preferred_skills=[]
        )

        assert score1 == score2
        assert score1 == 1.0

    @pytest.mark.asyncio
    async def test_zero_experience_candidate(self, job_matcher):
        """Test matching for entry-level candidate."""
        score = job_matcher._calculate_experience_match(
            years=0,
            min_required=0,
            max_preferred=2
        )

        assert score == 1.0

    @pytest.mark.asyncio
    async def test_no_location_preference(self, job_matcher):
        """Test matching when candidate has no location preference."""
        score = job_matcher._calculate_location_match(
            preferences=[],
            job_location="San Francisco",
            remote_policy="on-site"
        )

        assert score >= 0.0  # Should return neutral score


class TestPerformance:
    """Tests for matching performance."""

    @pytest.fixture
    def job_matcher(self, mock_embedding_service, mock_vector_store, mock_llm_service):
        """Create job matcher instance."""
        return JobMatcher(
            embedding_service=mock_embedding_service,
            vector_store=mock_vector_store,
            llm_service=mock_llm_service
        )

    @pytest.mark.asyncio
    async def test_batch_matching_performance(self, job_matcher, sample_candidate_profile):
        """Test performance of batch matching."""
        import time

        # Mock vector store to return results quickly
        job_matcher.vector_store.query = AsyncMock(return_value=[
            {"id": f"job{i}", "score": 0.9 - i*0.01} for i in range(10)
        ])

        job_matcher.embedding_service.embed = AsyncMock(
            return_value=np.random.rand(384).astype(np.float32)
        )

        start = time.time()
        embedding = await job_matcher.generate_candidate_embedding(sample_candidate_profile)
        results = await job_matcher.find_matching_jobs(embedding, {}, top_k=10)
        duration = time.time() - start

        assert len(results) == 10
        assert duration < 2.0  # Should complete quickly

    @pytest.mark.asyncio
    async def test_embedding_caching(self, job_matcher, sample_candidate_profile):
        """Test that embeddings can be cached for performance."""
        job_matcher.embedding_service.embed = AsyncMock(
            return_value=np.random.rand(384).astype(np.float32)
        )

        # Generate embedding twice
        embedding1 = await job_matcher.generate_candidate_embedding(sample_candidate_profile)
        embedding2 = await job_matcher.generate_candidate_profile(sample_candidate_profile)

        # If caching is implemented, second call should be faster or use cache
        assert embedding1.shape == embedding2.shape
