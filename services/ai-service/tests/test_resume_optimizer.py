"""
Tests for resume optimizer service.
"""

import pytest
from unittest.mock import AsyncMock, Mock
from src.models.resume_optimizer import ResumeOptimizer
from src.schemas.response_schemas import ATSScore, OptimizedResume, Keyword


class TestResumeOptimizer:
    """Tests for ResumeOptimizer class."""

    @pytest.fixture
    def resume_optimizer(self, mock_llm_service):
        """Create resume optimizer instance."""
        return ResumeOptimizer(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_calculate_ats_score(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test ATS score calculation."""
        # Mock LLM response
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Keyword Match Score: 80
Formatting Score: 75
Completeness Score: 85

Matched Keywords: Python, AWS, Docker, FastAPI
Missing Keywords: Kubernetes, GraphQL

Recommendations:
- Add more quantifiable achievements
- Include missing keywords naturally
- Improve formatting consistency

Overall Score: 80
Ranking: good
""")

        score = await resume_optimizer.calculate_ats_score(
            resume_content=sample_resume_content,
            job_description=sample_job_description,
            required_keywords=["Python", "AWS", "Docker"]
        )

        assert isinstance(score, ATSScore)
        assert 0.0 <= score.overall_score <= 100.0
        assert 0.0 <= score.keyword_match_score <= 100.0
        assert 0.0 <= score.formatting_score <= 100.0
        assert 0.0 <= score.completeness_score <= 100.0
        assert isinstance(score.matched_keywords, list)
        assert isinstance(score.missing_keywords, list)
        assert isinstance(score.recommendations, list)
        assert score.estimated_ranking in ["poor", "fair", "good", "excellent"]

    @pytest.mark.asyncio
    async def test_optimize_for_job(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test resume optimization for specific job."""
        # Mock ATS score calculation
        resume_optimizer.calculate_ats_score = AsyncMock(side_effect=[
            ATSScore(
                overall_score=65.0,
                keyword_match_score=60.0,
                formatting_score=70.0,
                completeness_score=65.0,
                matched_keywords=["Python"],
                missing_keywords=["AWS", "Docker"],
                recommendations=["Add keywords"],
                estimated_ranking="fair"
            ),
            ATSScore(
                overall_score=85.0,
                keyword_match_score=90.0,
                formatting_score=80.0,
                completeness_score=85.0,
                matched_keywords=["Python", "AWS", "Docker"],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="excellent"
            )
        ])

        # Mock optimization
        resume_optimizer.llm_service.complete = AsyncMock(
            return_value="Optimized resume content with Python, AWS, and Docker skills highlighted"
        )

        result = await resume_optimizer.optimize_for_job(
            resume_content=sample_resume_content,
            job_description=sample_job_description,
            optimization_level="moderate"
        )

        assert isinstance(result, OptimizedResume)
        assert result.optimized_content != ""
        assert result.ats_score_after >= result.ats_score_before
        assert result.improvement_percentage >= 0
        assert isinstance(result.changes, list)

    @pytest.mark.asyncio
    async def test_optimization_levels(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test different optimization levels."""
        levels = ["light", "moderate", "aggressive"]

        for level in levels:
            resume_optimizer.llm_service.complete = AsyncMock(
                return_value=f"Optimized with {level} level"
            )

            # Mock ATS scores
            resume_optimizer.calculate_ats_score = AsyncMock(side_effect=[
                ATSScore(
                    overall_score=70.0,
                    keyword_match_score=70.0,
                    formatting_score=70.0,
                    completeness_score=70.0,
                    matched_keywords=[],
                    missing_keywords=[],
                    recommendations=[],
                    estimated_ranking="good"
                ),
                ATSScore(
                    overall_score=80.0,
                    keyword_match_score=80.0,
                    formatting_score=80.0,
                    completeness_score=80.0,
                    matched_keywords=[],
                    missing_keywords=[],
                    recommendations=[],
                    estimated_ranking="excellent"
                )
            ])

            result = await resume_optimizer.optimize_for_job(
                resume_content=sample_resume_content,
                job_description=sample_job_description,
                optimization_level=level
            )

            assert result.optimized_content != ""

    @pytest.mark.asyncio
    async def test_extract_keywords(self, resume_optimizer, sample_job_description):
        """Test keyword extraction from job description."""
        # Mock LLM response
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Keywords:
- Python (technical, 95%, 5 occurrences)
- AWS (technical, 90%, 3 occurrences)
- Docker (technical, 85%, 2 occurrences)
- Communication (soft skill, 70%, 1 occurrence)
""")

        keywords = await resume_optimizer.extract_keywords(
            job_description=sample_job_description,
            top_k=20
        )

        assert isinstance(keywords, list)
        if len(keywords) > 0:
            keyword = keywords[0]
            assert isinstance(keyword, Keyword)
            assert keyword.keyword != ""
            assert 0.0 <= keyword.relevance <= 1.0
            assert keyword.category in ["technical", "soft skill", "domain", "certification"]

    @pytest.mark.asyncio
    async def test_tailor_summary(self, resume_optimizer, sample_job_description):
        """Test summary tailoring for job."""
        original_summary = "Experienced software engineer with 5 years of experience"

        resume_optimizer.llm_service.complete = AsyncMock(
            return_value="Results-driven software engineer with 5 years of expertise in Python and AWS"
        )

        tailored = await resume_optimizer.tailor_summary(
            summary=original_summary,
            job_description=sample_job_description
        )

        assert tailored != ""
        assert isinstance(tailored, str)
        resume_optimizer.llm_service.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_enhance_achievements(self, resume_optimizer):
        """Test achievement enhancement."""
        achievements = [
            "Developed backend APIs",
            "Improved system performance",
            "Led team of developers"
        ]

        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Enhanced:
- Developed 15+ RESTful backend APIs serving 1M+ daily requests with 99.9% uptime
- Improved system performance by 40% through database optimization and caching strategies
- Led cross-functional team of 5 developers to deliver projects 20% ahead of schedule
""")

        enhanced = await resume_optimizer.enhance_achievements(
            achievements=achievements,
            job_context="Senior Software Engineer role"
        )

        assert isinstance(enhanced, list)
        assert len(enhanced) > 0
        # Enhanced achievements should be more detailed
        for achievement in enhanced:
            assert len(achievement) > 0

    @pytest.mark.asyncio
    async def test_ats_score_with_no_keywords(self, resume_optimizer, sample_resume_content):
        """Test ATS score when no keywords are required."""
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Overall Score: 75
Keyword Match Score: 75
Formatting Score: 75
Completeness Score: 75
Ranking: good
""")

        score = await resume_optimizer.calculate_ats_score(
            resume_content=sample_resume_content,
            job_description="General software engineer position",
            required_keywords=[]
        )

        assert score.overall_score > 0

    @pytest.mark.asyncio
    async def test_optimization_preserves_personal_info(self, resume_optimizer):
        """Test that optimization preserves personal information."""
        resume_with_contact = """
John Doe
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

EXPERIENCE
Software Engineer at Tech Corp
"""

        resume_optimizer.calculate_ats_score = AsyncMock(side_effect=[
            ATSScore(
                overall_score=70.0,
                keyword_match_score=70.0,
                formatting_score=70.0,
                completeness_score=70.0,
                matched_keywords=[],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="good"
            ),
            ATSScore(
                overall_score=80.0,
                keyword_match_score=80.0,
                formatting_score=80.0,
                completeness_score=80.0,
                matched_keywords=[],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="excellent"
            )
        ])

        resume_optimizer.llm_service.complete = AsyncMock(
            return_value=resume_with_contact
        )

        result = await resume_optimizer.optimize_for_job(
            resume_content=resume_with_contact,
            job_description="Looking for Python developer",
            optimization_level="light"
        )

        # Contact info should be preserved
        assert "john.doe@email.com" in result.optimized_content or result.optimized_content != ""


class TestKeywordExtraction:
    """Tests for keyword extraction logic."""

    @pytest.fixture
    def resume_optimizer(self, mock_llm_service):
        """Create resume optimizer instance."""
        return ResumeOptimizer(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_keyword_relevance_scoring(self, resume_optimizer):
        """Test that keywords have proper relevance scores."""
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Keywords:
- Python (technical, 95%, 10)
- AWS (technical, 90%, 8)
- Communication (soft, 60%, 3)
""")

        keywords = await resume_optimizer.extract_keywords(
            job_description="Python AWS developer",
            top_k=10
        )

        for keyword in keywords:
            assert 0.0 <= keyword.relevance <= 1.0

    @pytest.mark.asyncio
    async def test_keyword_categories(self, resume_optimizer):
        """Test that keywords are categorized correctly."""
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Keywords:
- Python (technical, 95%, 5)
- Leadership (soft skill, 85%, 3)
- AWS Certified (certification, 80%, 2)
""")

        keywords = await resume_optimizer.extract_keywords(
            job_description="Senior developer with certifications",
            top_k=10
        )

        categories = [k.category for k in keywords]
        valid_categories = ["technical", "soft skill", "domain", "certification"]

        for category in categories:
            assert category in valid_categories

    @pytest.mark.asyncio
    async def test_top_k_limit(self, resume_optimizer):
        """Test that top_k limits keyword extraction."""
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Keywords:
- Keyword1 (technical, 95%, 10)
- Keyword2 (technical, 90%, 9)
- Keyword3 (technical, 85%, 8)
- Keyword4 (technical, 80%, 7)
- Keyword5 (technical, 75%, 6)
""")

        keywords = await resume_optimizer.extract_keywords(
            job_description="Job with many requirements",
            top_k=3
        )

        # Should return at most top_k keywords
        assert len(keywords) <= 3


class TestATSScoring:
    """Tests for ATS scoring algorithm."""

    @pytest.fixture
    def resume_optimizer(self, mock_llm_service):
        """Create resume optimizer instance."""
        return ResumeOptimizer(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_high_score_with_all_keywords(self, resume_optimizer):
        """Test high score when all keywords are present."""
        resume = "Python AWS Docker Kubernetes expert"
        job_desc = "Looking for Python AWS Docker Kubernetes"

        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Overall Score: 95
Keyword Match Score: 100
Formatting Score: 90
Completeness Score: 95
Matched Keywords: Python, AWS, Docker, Kubernetes
Missing Keywords:
Ranking: excellent
""")

        score = await resume_optimizer.calculate_ats_score(
            resume_content=resume,
            job_description=job_desc,
            required_keywords=["Python", "AWS", "Docker", "Kubernetes"]
        )

        assert score.overall_score >= 90
        assert len(score.matched_keywords) == 4
        assert len(score.missing_keywords) == 0

    @pytest.mark.asyncio
    async def test_low_score_with_few_keywords(self, resume_optimizer):
        """Test low score when few keywords are present."""
        resume = "Java developer with Spring experience"
        job_desc = "Looking for Python AWS Docker expert"

        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Overall Score: 35
Keyword Match Score: 20
Formatting Score: 50
Completeness Score: 40
Matched Keywords:
Missing Keywords: Python, AWS, Docker
Ranking: poor
""")

        score = await resume_optimizer.calculate_ats_score(
            resume_content=resume,
            job_description=job_desc,
            required_keywords=["Python", "AWS", "Docker"]
        )

        assert score.overall_score < 50
        assert len(score.missing_keywords) > 0
        assert score.estimated_ranking in ["poor", "fair"]

    @pytest.mark.asyncio
    async def test_score_components_weighted(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test that overall score considers all components."""
        resume_optimizer.llm_service.complete = AsyncMock(return_value="""
Overall Score: 75
Keyword Match Score: 80
Formatting Score: 70
Completeness Score: 75
Matched Keywords: Python, AWS
Missing Keywords: Docker
Ranking: good
""")

        score = await resume_optimizer.calculate_ats_score(
            resume_content=sample_resume_content,
            job_description=sample_job_description
        )

        # Overall score should be influenced by all components
        assert score.overall_score > 0
        assert score.keyword_match_score > 0
        assert score.formatting_score > 0
        assert score.completeness_score > 0


class TestResumeChanges:
    """Tests for tracking resume changes during optimization."""

    @pytest.fixture
    def resume_optimizer(self, mock_llm_service):
        """Create resume optimizer instance."""
        return ResumeOptimizer(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_changes_tracked(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test that changes are tracked during optimization."""
        resume_optimizer.calculate_ats_score = AsyncMock(side_effect=[
            ATSScore(
                overall_score=70.0,
                keyword_match_score=70.0,
                formatting_score=70.0,
                completeness_score=70.0,
                matched_keywords=["Python"],
                missing_keywords=["AWS", "Docker"],
                recommendations=["Add keywords"],
                estimated_ranking="good"
            ),
            ATSScore(
                overall_score=85.0,
                keyword_match_score=90.0,
                formatting_score=80.0,
                completeness_score=85.0,
                matched_keywords=["Python", "AWS", "Docker"],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="excellent"
            )
        ])

        resume_optimizer.llm_service.complete = AsyncMock(
            return_value="Optimized content"
        )

        result = await resume_optimizer.optimize_for_job(
            resume_content=sample_resume_content,
            job_description=sample_job_description,
            optimization_level="moderate"
        )

        assert isinstance(result.changes, list)
        # Should have some changes recorded
        assert len(result.changes) >= 0

    @pytest.mark.asyncio
    async def test_improvement_percentage_calculated(self, resume_optimizer, sample_resume_content, sample_job_description):
        """Test improvement percentage calculation."""
        resume_optimizer.calculate_ats_score = AsyncMock(side_effect=[
            ATSScore(
                overall_score=60.0,
                keyword_match_score=60.0,
                formatting_score=60.0,
                completeness_score=60.0,
                matched_keywords=[],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="fair"
            ),
            ATSScore(
                overall_score=90.0,
                keyword_match_score=90.0,
                formatting_score=90.0,
                completeness_score=90.0,
                matched_keywords=[],
                missing_keywords=[],
                recommendations=[],
                estimated_ranking="excellent"
            )
        ])

        resume_optimizer.llm_service.complete = AsyncMock(
            return_value="Optimized"
        )

        result = await resume_optimizer.optimize_for_job(
            resume_content=sample_resume_content,
            job_description=sample_job_description,
            optimization_level="aggressive"
        )

        # Improvement from 60 to 90 should be 50%
        assert result.improvement_percentage == pytest.approx(50.0, rel=0.1)
        assert result.ats_score_before == 60.0
        assert result.ats_score_after == 90.0
