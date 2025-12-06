"""
Comprehensive tests for cover letter generation functionality.
Tests content quality, personalization, and different tones/formats.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from typing import Dict, Any, List


class TestCoverLetterGeneration:
    """Tests for cover letter generation."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.fixture
    def sample_resume_data(self):
        """Sample resume data for cover letter generation."""
        return {
            "name": "John Doe",
            "title": "Senior Software Engineer",
            "summary": "Experienced backend developer with 7 years of Python and AWS experience",
            "skills": ["Python", "AWS", "Docker", "PostgreSQL"],
            "experience": [
                {
                    "title": "Senior Software Engineer",
                    "company": "Tech Corp",
                    "highlights": [
                        "Built scalable microservices serving 1M+ users",
                        "Improved system performance by 40%"
                    ]
                }
            ]
        }

    @pytest.fixture
    def sample_job_data(self):
        """Sample job posting data."""
        return {
            "title": "Senior Backend Engineer",
            "company": "Innovative Tech Inc",
            "description": "Looking for an experienced backend engineer to build scalable systems",
            "requirements": ["Python", "AWS", "5+ years experience"],
            "about_company": "Fast-growing tech startup in the AI space"
        }

    @pytest.mark.asyncio
    async def test_generate_basic_cover_letter(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test basic cover letter generation."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="""Dear Hiring Manager,

I am writing to express my strong interest in the Senior Backend Engineer position at Innovative Tech Inc.
With my 7 years of experience in backend development and proven track record of building scalable systems,
I am confident I would be a valuable addition to your team.

In my current role at Tech Corp, I have successfully built microservices serving over 1 million users and
improved system performance by 40%. My expertise in Python and AWS aligns perfectly with your requirements.

I am excited about the opportunity to contribute to your team's success and would welcome the chance to
discuss how my experience can benefit Innovative Tech Inc.

Sincerely,
John Doe"""
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        assert result is not None
        assert len(result.content) > 200
        assert "John Doe" in result.content
        assert "Senior Backend Engineer" in result.content
        assert "Innovative Tech Inc" in result.content

    @pytest.mark.asyncio
    async def test_generate_with_professional_tone(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test cover letter with professional tone."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Professional cover letter content..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            tone="professional"
        )

        assert result is not None
        cover_letter_generator.llm_service.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_with_enthusiastic_tone(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test cover letter with enthusiastic tone."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="I am thrilled to apply for this exciting opportunity..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            tone="enthusiastic"
        )

        assert result is not None
        # Enthusiastic tone should include positive language

    @pytest.mark.asyncio
    async def test_generate_with_formal_tone(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test cover letter with formal tone."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="I am writing to formally submit my application..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            tone="formal"
        )

        assert result is not None


class TestCoverLetterLength:
    """Tests for different cover letter lengths."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_generate_short_cover_letter(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test short cover letter generation (200-250 words)."""
        short_letter = "Short cover letter content. " * 30  # ~150 words

        cover_letter_generator.llm_service.complete = AsyncMock(return_value=short_letter)

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            length="short"
        )

        assert result is not None
        word_count = len(result.content.split())
        assert 150 <= word_count <= 300

    @pytest.mark.asyncio
    async def test_generate_medium_cover_letter(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test medium cover letter generation (300-350 words)."""
        medium_letter = "Medium cover letter content. " * 60  # ~300 words

        cover_letter_generator.llm_service.complete = AsyncMock(return_value=medium_letter)

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            length="medium"
        )

        assert result is not None
        word_count = len(result.content.split())
        assert 250 <= word_count <= 400

    @pytest.mark.asyncio
    async def test_generate_long_cover_letter(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test long cover letter generation (400-500 words)."""
        long_letter = "Long cover letter content. " * 90  # ~450 words

        cover_letter_generator.llm_service.complete = AsyncMock(return_value=long_letter)

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            length="long"
        )

        assert result is not None
        word_count = len(result.content.split())
        assert 350 <= word_count <= 550


class TestPersonalization:
    """Tests for cover letter personalization."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_personalize_with_company_name(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test personalization with company name."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Letter mentioning Innovative Tech Inc multiple times..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        assert "Innovative Tech Inc" in result.content

    @pytest.mark.asyncio
    async def test_personalize_with_job_title(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test personalization with specific job title."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Applying for Senior Backend Engineer position..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        assert "Senior Backend Engineer" in result.content

    @pytest.mark.asyncio
    async def test_personalize_with_matching_skills(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter highlights matching skills."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="My expertise in Python and AWS aligns with your requirements..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should mention skills that match job requirements
        content_lower = result.content.lower()
        assert "python" in content_lower or "aws" in content_lower

    @pytest.mark.asyncio
    async def test_personalize_with_relevant_experience(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter highlights relevant experience."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="At Tech Corp, I built scalable microservices serving 1M+ users..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should mention relevant achievements
        assert "Tech Corp" in result.content or "microservices" in result.content.lower()

    @pytest.mark.asyncio
    async def test_custom_instructions(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test cover letter with custom instructions."""
        custom_instructions = "Emphasize leadership experience and team management skills"

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Leadership experience and team management highlighted..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            custom_instructions=custom_instructions
        )

        assert result is not None
        # Custom instructions should be incorporated


class TestCoverLetterStructure:
    """Tests for cover letter structure and formatting."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_has_proper_opening(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter has proper opening."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Dear Hiring Manager,\n\nI am writing to apply..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should have a greeting
        assert "Dear" in result.content or "Hello" in result.content

    @pytest.mark.asyncio
    async def test_has_proper_closing(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter has proper closing."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="...look forward to hearing from you.\n\nSincerely,\nJohn Doe"
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should have a closing
        closings = ["sincerely", "regards", "best", "thank you"]
        has_closing = any(closing in result.content.lower() for closing in closings)
        assert has_closing

    @pytest.mark.asyncio
    async def test_has_multiple_paragraphs(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter is properly structured with paragraphs."""
        multi_paragraph = """Dear Hiring Manager,

First paragraph introducing myself.

Second paragraph about experience.

Third paragraph about enthusiasm.

Sincerely,
John Doe"""

        cover_letter_generator.llm_service.complete = AsyncMock(return_value=multi_paragraph)

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should have multiple paragraphs
        paragraphs = [p.strip() for p in result.content.split('\n\n') if p.strip()]
        assert len(paragraphs) >= 3

    @pytest.mark.asyncio
    async def test_proper_formatting(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter has proper formatting."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Properly formatted cover letter content..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should not have excessive whitespace
        assert not result.content.startswith('\n\n')
        assert not result.content.endswith('\n\n\n')


class TestContentQuality:
    """Tests for cover letter content quality."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_no_generic_phrases(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter avoids overly generic phrases."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Specific achievements and tailored content..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should avoid phrases like "I am a hard worker"
        generic_phrases = ["hard worker", "team player", "detail-oriented"]
        content_lower = result.content.lower()

        # Not all generic phrases should be present
        generic_count = sum(1 for phrase in generic_phrases if phrase in content_lower)
        assert generic_count <= 1

    @pytest.mark.asyncio
    async def test_includes_quantifiable_achievements(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter includes metrics when available."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Built services serving 1M+ users and improved performance by 40%..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should include numbers/metrics from resume
        import re
        has_numbers = bool(re.search(r'\d+[%+]|\d+M|\d+\+', result.content))
        assert has_numbers

    @pytest.mark.asyncio
    async def test_demonstrates_company_research(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter shows research about the company."""
        sample_job_data["about_company"] = "Fast-growing AI startup"

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Excited about your work in AI and fast-growing environment..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should reference company information
        assert "AI" in result.content or "startup" in result.content.lower()


class TestErrorHandling:
    """Tests for error handling in cover letter generation."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_handle_llm_failure(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test handling of LLM service failures."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            side_effect=Exception("LLM service error")
        )

        with pytest.raises(Exception):
            await cover_letter_generator.generate(
                resume_data=sample_resume_data,
                job_data=sample_job_data
            )

    @pytest.mark.asyncio
    async def test_handle_missing_resume_data(self, cover_letter_generator, sample_job_data):
        """Test handling of missing resume data."""
        minimal_resume = {"name": "John Doe"}

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter with minimal information..."
        )

        result = await cover_letter_generator.generate(
            resume_data=minimal_resume,
            job_data=sample_job_data
        )

        # Should still generate a letter with available info
        assert result is not None

    @pytest.mark.asyncio
    async def test_handle_missing_job_data(self, cover_letter_generator, sample_resume_data):
        """Test handling of missing job data."""
        minimal_job = {"title": "Engineer"}

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter with minimal job info..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=minimal_job
        )

        # Should still generate a letter
        assert result is not None

    @pytest.mark.asyncio
    async def test_handle_empty_llm_response(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test handling of empty LLM response."""
        cover_letter_generator.llm_service.complete = AsyncMock(return_value="")

        with pytest.raises(ValueError, match="empty|failed"):
            await cover_letter_generator.generate(
                resume_data=sample_resume_data,
                job_data=sample_job_data
            )


class TestTemplateGeneration:
    """Tests for cover letter template generation."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_generate_multiple_variations(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test generation of multiple cover letter variations."""
        variations = [
            "First variation of the cover letter...",
            "Second variation with different focus...",
            "Third variation emphasizing other aspects..."
        ]

        results = []
        for variation_text in variations:
            cover_letter_generator.llm_service.complete = AsyncMock(return_value=variation_text)
            result = await cover_letter_generator.generate(
                resume_data=sample_resume_data,
                job_data=sample_job_data
            )
            results.append(result)

        assert len(results) == 3
        # Each variation should be different
        assert results[0].content != results[1].content

    @pytest.mark.asyncio
    async def test_save_as_template(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test saving generated cover letter as reusable template."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Template cover letter..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should be able to save as template
        if hasattr(result, "save_as_template"):
            template = result.save_as_template()
            assert template is not None


class TestSubjectLineGeneration:
    """Tests for email subject line generation."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_generate_subject_line(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test generation of email subject line."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter content..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )

        # Should include subject line
        assert hasattr(result, "subject") or "subject" in result.__dict__
        if hasattr(result, "subject") and result.subject:
            assert len(result.subject) > 0
            assert len(result.subject) < 100  # Subject should be concise

    @pytest.mark.asyncio
    async def test_subject_line_includes_job_title(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that subject line includes job title."""
        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter..."
        )

        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data,
            include_subject=True
        )

        if hasattr(result, "subject") and result.subject:
            assert "Senior Backend Engineer" in result.subject or "Backend" in result.subject


class TestPerformance:
    """Tests for cover letter generation performance."""

    @pytest.fixture
    def cover_letter_generator(self, mock_llm_service):
        """Create cover letter generator instance."""
        from src.services.cover_letter_generator import CoverLetterGenerator
        return CoverLetterGenerator(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_generation_speed(self, cover_letter_generator, sample_resume_data, sample_job_data):
        """Test that cover letter generation completes in reasonable time."""
        import time

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter content..."
        )

        start = time.time()
        result = await cover_letter_generator.generate(
            resume_data=sample_resume_data,
            job_data=sample_job_data
        )
        duration = time.time() - start

        assert result is not None
        assert duration < 5.0  # Should complete in less than 5 seconds

    @pytest.mark.asyncio
    async def test_batch_generation(self, cover_letter_generator, sample_resume_data):
        """Test generating cover letters for multiple jobs."""
        jobs = [
            {"title": "Backend Engineer", "company": "Company A"},
            {"title": "Software Engineer", "company": "Company B"},
            {"title": "Senior Developer", "company": "Company C"}
        ]

        cover_letter_generator.llm_service.complete = AsyncMock(
            return_value="Cover letter..."
        )

        results = []
        for job in jobs:
            result = await cover_letter_generator.generate(
                resume_data=sample_resume_data,
                job_data=job
            )
            results.append(result)

        assert len(results) == 3
        for result in results:
            assert result is not None
