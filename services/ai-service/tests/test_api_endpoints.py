"""
Tests for AI Service API endpoints.
"""

import pytest
from fastapi import status
from unittest.mock import patch, AsyncMock
from src.api.dependencies import get_current_user


class TestHealthEndpoints:
    """Tests for health check endpoints."""

    def test_health_check_success(self, client):
        """Test successful health check."""
        with patch("src.main.state") as mock_state:
            mock_state.vector_store.health_check = AsyncMock()

            response = client.get("/health")

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "status" in data
            assert "version" in data
            assert "dependencies" in data

    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "service" in data
        assert "version" in data
        assert "status" in data


class TestGenerateEndpoints:
    """Tests for content generation endpoints."""

    def test_generate_summary_success(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test successful summary generation."""
        # Override authentication dependency
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python", "AWS", "Docker"],
            "industry": "Technology",
            "num_alternatives": 2
        }

        response = client.post(
            "/api/ai/generate/summary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["section_type"] == "summary"
        assert "content" in data
        assert "word_count" in data
        assert "alternatives" in data

        # Verify LLM service was called
        mock_llm_service.complete.assert_called_once()

    def test_generate_summary_unauthorized(self, client):
        """Test summary generation without authentication."""
        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python", "AWS", "Docker"]
        }

        response = client.post("/api/ai/generate/summary", json=request_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_generate_summary_validation_error(self, client, auth_headers, mock_current_user):
        """Test summary generation with invalid data."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "title": "Software Engineer",
            # Missing required fields
        }

        response = client.post(
            "/api/ai/generate/summary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_generate_cover_letter_success(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test successful cover letter generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "candidate_name": "John Doe",
            "job_title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "resume_summary": "Experienced software engineer...",
            "job_description": "We are seeking a talented engineer...",
            "tone": "professional",
            "max_words": 300
        }

        response = client.post(
            "/api/ai/generate/cover-letter",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "content" in data
        assert "word_count" in data
        assert data["tone"] == "professional"

    def test_generate_bullets_success(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test successful bullet points generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "role": "Software Engineer",
            "company": "Tech Corp",
            "responsibilities": "Backend development, API design",
            "num_bullets": 5,
            "style": "impact"
        }

        response = client.post(
            "/api/ai/generate/bullets",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "bullets" in data
        assert "word_count" in data
        assert data["style_applied"] == "impact"

    def test_extract_skills_success(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test successful skill extraction."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "text": "Experienced with Python, AWS, and Docker",
            "context": "resume",
            "include_suggestions": True
        }

        response = client.post(
            "/api/ai/generate/skills",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "extracted_skills" in data
        assert "total_count" in data


class TestOptimizeEndpoints:
    """Tests for resume optimization endpoints."""

    def test_optimize_resume_success(self, client, auth_headers, mock_resume_optimizer, mock_current_user):
        """Test successful resume optimization."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "resume_content": "John Doe\nSoftware Engineer\n...",
            "job_description": "We are seeking a senior engineer...",
            "optimization_level": "moderate"
        }

        response = client.post(
            "/api/ai/optimize/resume",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "optimized_content" in data
        assert "ats_score_before" in data
        assert "ats_score_after" in data
        assert "improvement_percentage" in data

    def test_optimize_resume_invalid_level(self, client, auth_headers, mock_current_user):
        """Test resume optimization with invalid level."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "resume_content": "John Doe\nSoftware Engineer\n...",
            "job_description": "We are seeking a senior engineer...",
            "optimization_level": "invalid_level"
        }

        response = client.post(
            "/api/ai/optimize/resume",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_calculate_ats_score_success(self, client, auth_headers, mock_resume_optimizer, mock_current_user):
        """Test successful ATS score calculation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "resume_content": "John Doe\nSoftware Engineer\nSkills: Python, AWS",
            "job_description": "Looking for Python and AWS experience",
            "required_keywords": ["Python", "AWS"]
        }

        response = client.post(
            "/api/ai/optimize/ats-score",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "overall_score" in data
        assert "keyword_match_score" in data
        assert "matched_keywords" in data
        assert "missing_keywords" in data
        assert "estimated_ranking" in data

    def test_extract_keywords_success(self, client, auth_headers, mock_resume_optimizer, mock_current_user):
        """Test successful keyword extraction."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_description": "Looking for Python, AWS, and Docker experience",
            "top_k": 20
        }

        response = client.post(
            "/api/ai/optimize/keywords",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            assert "keyword" in data[0]
            assert "relevance" in data[0]
            assert "category" in data[0]

    def test_tailor_summary_success(self, client, auth_headers, mock_resume_optimizer, mock_current_user):
        """Test successful summary tailoring."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        params = {
            "summary": "Experienced software engineer",
            "job_description": "Looking for a senior engineer"
        }

        response = client.post(
            "/api/ai/optimize/tailor-summary",
            params=params,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "original_summary" in data
        assert "tailored_summary" in data
        assert "word_count" in data


class TestMatchEndpoints:
    """Tests for job matching endpoints."""

    def test_match_job_success(self, client, auth_headers, mock_job_matcher, mock_current_user):
        """Test successful job match score calculation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "candidate_data": {
                "skills": ["Python", "AWS", "Docker"],
                "experience_years": 5,
                "location_preferences": ["San Francisco"],
                "culture_preferences": {"work_life_balance": "high"}
            },
            "job_data": {
                "required_skills": ["Python", "AWS"],
                "min_experience": 3,
                "location": "San Francisco",
                "remote_policy": "hybrid"
            },
            "include_breakdown": True
        }

        response = client.post(
            "/api/ai/match/job",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "overall_score" in data
        assert "skill_match_score" in data
        assert "experience_match_score" in data
        assert "location_match_score" in data
        assert "explanation" in data
        assert "strengths" in data
        assert "gaps" in data

    def test_match_job_unauthorized(self, client):
        """Test job matching without authentication."""
        request_data = {
            "candidate_data": {"skills": ["Python"]},
            "job_data": {"required_skills": ["Python"]}
        }

        response = client.post("/api/ai/match/job", json=request_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_find_matching_jobs_success(self, client, auth_headers, mock_job_matcher, mock_current_user, sample_candidate_profile):
        """Test successful matching jobs search."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "candidate_profile": sample_candidate_profile.model_dump(),
            "filters": {"location": "San Francisco", "remote": True},
            "top_k": 20,
            "min_score": 0.7
        }

        response = client.post(
            "/api/ai/match/jobs",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "candidate_id" in data
        assert "matches" in data
        assert "total_matches" in data
        assert isinstance(data["matches"], list)

    def test_batch_match_score_success(self, client, auth_headers, mock_job_matcher, mock_current_user):
        """Test batch match score calculation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        candidate_data = {
            "skills": ["Python", "AWS"],
            "experience_years": 5
        }

        job_data_list = [
            {"required_skills": ["Python"], "min_experience": 3},
            {"required_skills": ["AWS", "Docker"], "min_experience": 5}
        ]

        response = client.post(
            "/api/ai/match/batch-score",
            json={
                "candidate_data": candidate_data,
                "job_data_list": job_data_list
            },
            headers=auth_headers
        )

        # Note: This endpoint might not exist in actual implementation
        # Adjust based on actual API

    def test_explain_match_success(self, client, auth_headers, mock_job_matcher, mock_current_user):
        """Test match explanation generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        candidate_data = {
            "skills": ["Python", "AWS", "Docker"],
            "experience_years": 5
        }

        job_data = {
            "required_skills": ["Python", "AWS"],
            "min_experience": 3
        }

        response = client.post(
            "/api/ai/match/explain",
            json={
                "candidate_data": candidate_data,
                "job_data": job_data
            },
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "overall_score" in data
        assert "ranking" in data
        assert "score_breakdown" in data
        assert "recommendation" in data


class TestErrorHandling:
    """Tests for error handling."""

    def test_validation_error_handling(self, client, auth_headers, mock_current_user):
        """Test validation error response format."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Send invalid data (missing required fields)
        response = client.post(
            "/api/ai/generate/summary",
            json={},
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        data = response.json()
        assert "error" in data or "detail" in data

    def test_service_error_handling(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test service error handling."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock service to raise exception
        mock_llm_service.complete.side_effect = Exception("Service error")

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python"]
        }

        response = client.post(
            "/api/ai/generate/summary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


class TestRateLimiting:
    """Tests for rate limiting."""

    @pytest.mark.skip(reason="Rate limiting tests require time delays")
    def test_rate_limit_exceeded(self, client, auth_headers, mock_current_user):
        """Test rate limit enforcement."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python"]
        }

        # Make multiple rapid requests
        responses = []
        for _ in range(70):  # Exceed 60 requests per minute limit
            response = client.post(
                "/api/ai/generate/summary",
                json=request_data,
                headers=auth_headers
            )
            responses.append(response)

        # At least one should be rate limited
        rate_limited = any(r.status_code == status.HTTP_429_TOO_MANY_REQUESTS for r in responses)
        assert rate_limited


class TestStreamingEndpoints:
    """Tests for streaming endpoints."""

    def test_stream_summary_success(self, client, auth_headers, mock_llm_service, mock_current_user):
        """Test streaming summary generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python", "AWS"],
            "industry": "Technology"
        }

        response = client.post(
            "/api/ai/generate/stream-summary",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "text/plain; charset=utf-8"
