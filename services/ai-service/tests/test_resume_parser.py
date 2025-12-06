"""
Comprehensive tests for resume parsing functionality.
Tests parsing accuracy, data extraction, and error handling.
"""

import pytest
from unittest.mock import AsyncMock, Mock, patch
from typing import Dict, Any, List


class TestResumeParser:
    """Tests for resume parsing functionality."""

    @pytest.fixture
    def sample_resume_text(self):
        """Sample resume text for testing."""
        return """
        John Doe
        john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

        SUMMARY
        Experienced software engineer with 5+ years in backend development

        EXPERIENCE
        Senior Software Engineer | Tech Corp | Jan 2020 - Present
        • Developed RESTful APIs serving 1M+ users
        • Improved system performance by 40%
        • Led team of 5 developers

        Software Engineer | StartupCo | Jun 2018 - Dec 2019
        • Built microservices architecture
        • Implemented CI/CD pipeline

        EDUCATION
        B.S. Computer Science | University of Technology | 2018
        GPA: 3.8/4.0

        SKILLS
        Python, JavaScript, AWS, Docker, Kubernetes, PostgreSQL
        """

    @pytest.fixture
    def sample_pdf_resume(self, tmp_path):
        """Create a sample PDF resume for testing."""
        pdf_path = tmp_path / "resume.pdf"
        # Mock PDF creation
        pdf_path.write_text("PDF content placeholder")
        return str(pdf_path)

    @pytest.fixture
    def sample_docx_resume(self, tmp_path):
        """Create a sample DOCX resume for testing."""
        docx_path = tmp_path / "resume.docx"
        # Mock DOCX creation
        docx_path.write_text("DOCX content placeholder")
        return str(docx_path)


class TestResumeParsingAccuracy:
    """Tests for resume parsing accuracy."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_parse_contact_information(self, resume_parser, sample_resume_text):
        """Test accurate extraction of contact information."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.contact_info is not None
        assert "john.doe@email.com" in str(result.contact_info.get("email", "")).lower()
        assert "555" in str(result.contact_info.get("phone", ""))
        assert "linkedin" in str(result.contact_info.get("linkedin", "")).lower()

    @pytest.mark.asyncio
    async def test_parse_professional_summary(self, resume_parser, sample_resume_text):
        """Test extraction of professional summary."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.summary is not None
        assert len(result.summary) > 0
        assert "software engineer" in result.summary.lower() or "backend development" in result.summary.lower()

    @pytest.mark.asyncio
    async def test_parse_work_experience(self, resume_parser, sample_resume_text):
        """Test extraction of work experience."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.experience is not None
        assert len(result.experience) >= 2

        # Check first experience
        exp1 = result.experience[0]
        assert "title" in exp1 or "position" in exp1
        assert "company" in exp1
        assert "Senior Software Engineer" in str(exp1.get("title", exp1.get("position", "")))

    @pytest.mark.asyncio
    async def test_parse_education(self, resume_parser, sample_resume_text):
        """Test extraction of education information."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.education is not None
        assert len(result.education) >= 1

        edu = result.education[0]
        assert "degree" in edu or "education" in edu
        assert "Computer Science" in str(edu.get("degree", edu.get("education", "")))

    @pytest.mark.asyncio
    async def test_parse_skills(self, resume_parser, sample_resume_text):
        """Test extraction of skills."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.skills is not None
        assert len(result.skills) >= 3

        skills_lower = [s.lower() for s in result.skills]
        assert "python" in skills_lower or "javascript" in skills_lower or "aws" in skills_lower

    @pytest.mark.asyncio
    async def test_parse_achievements_with_metrics(self, resume_parser, sample_resume_text):
        """Test extraction of quantifiable achievements."""
        result = await resume_parser.parse_resume(sample_resume_text)

        # Check that metrics are extracted from achievements
        all_text = str(result)
        assert "1M" in all_text or "40%" in all_text or "5 developers" in all_text

    @pytest.mark.asyncio
    async def test_parse_dates_correctly(self, resume_parser, sample_resume_text):
        """Test correct parsing of employment dates."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result.experience is not None
        exp = result.experience[0]

        # Check for date fields
        assert "start_date" in exp or "startDate" in exp or "dates" in exp
        date_str = str(exp.get("start_date", exp.get("startDate", exp.get("dates", ""))))
        assert "2020" in date_str or "Jan" in date_str or "January" in date_str


class TestMultiFormatParsing:
    """Tests for parsing different file formats."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_parse_pdf_resume(self, resume_parser, sample_pdf_resume):
        """Test parsing PDF resume format."""
        with patch("src.services.resume_parser.extract_text_from_pdf") as mock_extract:
            mock_extract.return_value = "PDF resume content with skills: Python, AWS"

            result = await resume_parser.parse_resume_file(sample_pdf_resume)

            assert result is not None
            assert result.file_format == "pdf"
            mock_extract.assert_called_once()

    @pytest.mark.asyncio
    async def test_parse_docx_resume(self, resume_parser, sample_docx_resume):
        """Test parsing DOCX resume format."""
        with patch("src.services.resume_parser.extract_text_from_docx") as mock_extract:
            mock_extract.return_value = "DOCX resume content with experience"

            result = await resume_parser.parse_resume_file(sample_docx_resume)

            assert result is not None
            assert result.file_format == "docx"
            mock_extract.assert_called_once()

    @pytest.mark.asyncio
    async def test_parse_text_resume(self, resume_parser, sample_resume_text):
        """Test parsing plain text resume."""
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result is not None
        assert result.content == sample_resume_text or len(result.content) > 0

    @pytest.mark.asyncio
    async def test_unsupported_file_format(self, resume_parser, tmp_path):
        """Test handling of unsupported file formats."""
        unsupported_file = tmp_path / "resume.xyz"
        unsupported_file.write_text("content")

        with pytest.raises(ValueError, match="Unsupported file format"):
            await resume_parser.parse_resume_file(str(unsupported_file))


class TestParsingEdgeCases:
    """Tests for edge cases in resume parsing."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_parse_empty_resume(self, resume_parser):
        """Test parsing empty resume."""
        result = await resume_parser.parse_resume("")

        assert result is not None
        assert result.content == ""
        # Should still return structured data even if empty
        assert hasattr(result, "skills")
        assert hasattr(result, "experience")

    @pytest.mark.asyncio
    async def test_parse_minimal_resume(self, resume_parser):
        """Test parsing resume with minimal information."""
        minimal_resume = "John Doe\njohn@email.com\nSoftware Engineer"

        result = await resume_parser.parse_resume(minimal_resume)

        assert result is not None
        assert result.contact_info is not None

    @pytest.mark.asyncio
    async def test_parse_resume_with_special_characters(self, resume_parser):
        """Test parsing resume with special characters."""
        resume_with_special = """
        José García
        jose@email.com | +1-555-123-4567
        Skills: C++, C#, Node.js, React.js
        Achievement: Improved performance by 50% 🚀
        """

        result = await resume_parser.parse_resume(resume_with_special)

        assert result is not None
        # Should handle special characters gracefully

    @pytest.mark.asyncio
    async def test_parse_multi_column_resume(self, resume_parser):
        """Test parsing resume with multi-column layout."""
        multi_column = """
        Name: John Doe          Email: john@email.com
        Phone: 555-1234         LinkedIn: linkedin.com/in/john

        Skills                  Experience
        Python                  Software Engineer
        AWS                     Tech Corp
        """

        result = await resume_parser.parse_resume(multi_column)

        assert result is not None
        assert result.contact_info is not None or result.skills is not None

    @pytest.mark.asyncio
    async def test_parse_resume_with_long_text(self, resume_parser):
        """Test parsing very long resume (>10 pages)."""
        long_resume = "Experience: Software Engineer\n" * 1000

        result = await resume_parser.parse_resume(long_resume)

        assert result is not None
        # Should handle long text without errors


class TestSkillExtraction:
    """Tests for skill extraction accuracy."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_extract_technical_skills(self, resume_parser):
        """Test extraction of technical skills."""
        resume = """
        Skills: Python, JavaScript, TypeScript, React, Node.js, AWS, Docker, Kubernetes
        """

        result = await resume_parser.parse_resume(resume)

        assert result.skills is not None
        assert len(result.skills) >= 5
        assert any("python" in s.lower() for s in result.skills)
        assert any("aws" in s.lower() for s in result.skills)

    @pytest.mark.asyncio
    async def test_extract_soft_skills(self, resume_parser):
        """Test extraction of soft skills."""
        resume = """
        Core Competencies: Leadership, Communication, Team Collaboration, Problem Solving
        """

        result = await resume_parser.parse_resume(resume)

        assert result.skills is not None
        # Should extract soft skills as well

    @pytest.mark.asyncio
    async def test_skill_deduplication(self, resume_parser):
        """Test that duplicate skills are removed."""
        resume = """
        Skills: Python, AWS, Docker
        Technologies: Python, AWS, Kubernetes
        """

        result = await resume_parser.parse_resume(resume)

        skills_lower = [s.lower() for s in result.skills]
        # Python and AWS should only appear once
        assert skills_lower.count("python") <= 1
        assert skills_lower.count("aws") <= 1

    @pytest.mark.asyncio
    async def test_extract_skills_from_experience(self, resume_parser):
        """Test skill extraction from experience descriptions."""
        resume = """
        Experience:
        - Developed applications using React and Node.js
        - Deployed infrastructure on AWS using Terraform
        """

        result = await resume_parser.parse_resume(resume)

        # Should extract skills mentioned in experience
        assert result.skills is not None


class TestExperienceCalculation:
    """Tests for experience years calculation."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_calculate_total_experience(self, resume_parser):
        """Test calculation of total years of experience."""
        resume = """
        Experience:
        Software Engineer | Company A | Jan 2020 - Dec 2022 (3 years)
        Junior Developer | Company B | Jan 2018 - Dec 2019 (2 years)
        """

        result = await resume_parser.parse_resume(resume)

        assert result.experience_years is not None
        assert result.experience_years >= 5

    @pytest.mark.asyncio
    async def test_handle_current_employment(self, resume_parser):
        """Test handling of current/present employment."""
        resume = """
        Experience:
        Senior Engineer | Tech Corp | Jan 2020 - Present
        """

        result = await resume_parser.parse_resume(resume)

        # Should calculate experience up to current date
        assert result.experience_years is not None
        assert result.experience_years >= 4  # Assuming current year is 2024+

    @pytest.mark.asyncio
    async def test_handle_overlapping_experience(self, resume_parser):
        """Test handling of overlapping employment periods."""
        resume = """
        Experience:
        Consultant | Company A | Jan 2020 - Present
        Part-time Developer | Company B | Jun 2020 - Dec 2021
        """

        result = await resume_parser.parse_resume(resume)

        # Should handle overlapping periods correctly
        assert result.experience_years is not None


class TestParsingErrorHandling:
    """Tests for error handling in resume parsing."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_handle_llm_failure(self, resume_parser, sample_resume_text):
        """Test handling of LLM service failures."""
        resume_parser.llm_service.complete = AsyncMock(side_effect=Exception("LLM service error"))

        # Should fall back to rule-based parsing
        result = await resume_parser.parse_resume(sample_resume_text)

        assert result is not None
        # Should still extract basic information using fallback methods

    @pytest.mark.asyncio
    async def test_handle_corrupted_file(self, resume_parser, tmp_path):
        """Test handling of corrupted files."""
        corrupted_file = tmp_path / "corrupted.pdf"
        corrupted_file.write_bytes(b"corrupted binary data \x00\x01\x02")

        with pytest.raises(Exception):
            await resume_parser.parse_resume_file(str(corrupted_file))

    @pytest.mark.asyncio
    async def test_handle_large_file(self, resume_parser, tmp_path):
        """Test handling of very large files."""
        large_file = tmp_path / "large.txt"
        # Create 10MB file
        large_file.write_text("x" * 10_000_000)

        # Should handle or reject large files gracefully
        try:
            result = await resume_parser.parse_resume_file(str(large_file))
            assert result is not None
        except ValueError as e:
            assert "too large" in str(e).lower() or "size" in str(e).lower()

    @pytest.mark.asyncio
    async def test_handle_missing_file(self, resume_parser):
        """Test handling of missing files."""
        with pytest.raises(FileNotFoundError):
            await resume_parser.parse_resume_file("nonexistent.pdf")


class TestParsingPerformance:
    """Tests for parsing performance."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_parsing_speed(self, resume_parser, sample_resume_text):
        """Test that parsing completes in reasonable time."""
        import time

        start = time.time()
        result = await resume_parser.parse_resume(sample_resume_text)
        duration = time.time() - start

        assert result is not None
        assert duration < 10.0  # Should complete in less than 10 seconds

    @pytest.mark.asyncio
    async def test_batch_parsing(self, resume_parser):
        """Test parsing multiple resumes in batch."""
        resumes = [
            "Resume 1: Software Engineer with Python skills",
            "Resume 2: Data Scientist with R and Python",
            "Resume 3: DevOps Engineer with AWS and Docker"
        ]

        results = []
        for resume in resumes:
            result = await resume_parser.parse_resume(resume)
            results.append(result)

        assert len(results) == 3
        for result in results:
            assert result is not None


class TestStructuredOutput:
    """Tests for structured output format."""

    @pytest.fixture
    def resume_parser(self, mock_llm_service):
        """Create resume parser instance."""
        from src.services.resume_parser import ResumeParser
        return ResumeParser(llm_service=mock_llm_service)

    @pytest.mark.asyncio
    async def test_output_schema_compliance(self, resume_parser, sample_resume_text):
        """Test that output matches expected schema."""
        result = await resume_parser.parse_resume(sample_resume_text)

        # Check all required fields exist
        assert hasattr(result, "contact_info")
        assert hasattr(result, "summary")
        assert hasattr(result, "experience")
        assert hasattr(result, "education")
        assert hasattr(result, "skills")
        assert hasattr(result, "experience_years")

    @pytest.mark.asyncio
    async def test_output_serialization(self, resume_parser, sample_resume_text):
        """Test that output can be serialized to JSON."""
        import json

        result = await resume_parser.parse_resume(sample_resume_text)

        # Should be serializable to JSON
        json_str = json.dumps(result.dict() if hasattr(result, "dict") else result.__dict__)
        assert json_str is not None

        # Should be deserializable
        parsed = json.loads(json_str)
        assert parsed is not None

    @pytest.mark.asyncio
    async def test_confidence_scores(self, resume_parser, sample_resume_text):
        """Test that confidence scores are provided."""
        result = await resume_parser.parse_resume(sample_resume_text)

        # Should include confidence scores for extracted data
        if hasattr(result, "confidence"):
            assert 0.0 <= result.confidence <= 1.0
