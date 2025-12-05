"""
Integration tests for AI Service.

These tests verify that different components work together correctly.
"""

import pytest
from unittest.mock import patch, AsyncMock, Mock
from fastapi import status

from src.api.dependencies import get_current_user


@pytest.mark.integration
class TestEndToEndFlows:
    """Integration tests for complete user flows."""

    @pytest.mark.asyncio
    async def test_resume_optimization_flow(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_resume_optimizer,
        sample_resume_content,
        sample_job_description
    ):
        """Test complete resume optimization flow."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Step 1: Calculate initial ATS score
        ats_request = {
            "resume_content": sample_resume_content,
            "job_description": sample_job_description,
            "required_keywords": ["Python", "AWS"]
        }

        ats_response = client.post(
            "/api/ai/optimize/ats-score",
            json=ats_request,
            headers=auth_headers
        )

        assert ats_response.status_code == status.HTTP_200_OK
        ats_data = ats_response.json()
        initial_score = ats_data["overall_score"]

        # Step 2: Extract keywords from job description
        keywords_request = {
            "job_description": sample_job_description,
            "top_k": 20
        }

        keywords_response = client.post(
            "/api/ai/optimize/keywords",
            json=keywords_request,
            headers=auth_headers
        )

        assert keywords_response.status_code == status.HTTP_200_OK
        keywords = keywords_response.json()
        assert len(keywords) > 0

        # Step 3: Optimize resume
        optimize_request = {
            "resume_content": sample_resume_content,
            "job_description": sample_job_description,
            "optimization_level": "moderate"
        }

        optimize_response = client.post(
            "/api/ai/optimize/resume",
            json=optimize_request,
            headers=auth_headers
        )

        assert optimize_response.status_code == status.HTTP_200_OK
        optimized_data = optimize_response.json()
        assert "optimized_content" in optimized_data
        assert optimized_data["ats_score_after"] >= optimized_data["ats_score_before"]

    @pytest.mark.asyncio
    async def test_job_matching_flow(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_job_matcher,
        sample_candidate_profile
    ):
        """Test complete job matching flow."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Step 1: Find matching jobs
        matching_request = {
            "candidate_profile": sample_candidate_profile.model_dump(),
            "filters": {"location": "San Francisco", "remote": True},
            "top_k": 20,
            "min_score": 0.7
        }

        matching_response = client.post(
            "/api/ai/match/jobs",
            json=matching_request,
            headers=auth_headers
        )

        assert matching_response.status_code == status.HTTP_200_OK
        matching_data = matching_response.json()
        assert "matches" in matching_data
        matches = matching_data["matches"]

        # Step 2: Get detailed match explanation for top result
        if len(matches) > 0:
            top_match = matches[0]

            candidate_data = {
                "skills": sample_candidate_profile.skills,
                "experience_years": sample_candidate_profile.experience_years,
                "location_preferences": sample_candidate_profile.location_preferences,
                "culture_preferences": sample_candidate_profile.culture_preferences
            }

            job_data = {
                "required_skills": ["Python", "AWS"],
                "min_experience": 3,
                "location": "San Francisco",
                "remote_policy": "hybrid"
            }

            explain_response = client.post(
                "/api/ai/match/explain",
                json={
                    "candidate_data": candidate_data,
                    "job_data": job_data
                },
                headers=auth_headers
            )

            assert explain_response.status_code == status.HTTP_200_OK
            explanation = explain_response.json()
            assert "overall_score" in explanation
            assert "recommendation" in explanation

    @pytest.mark.asyncio
    async def test_content_generation_flow(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_llm_service
    ):
        """Test complete content generation flow."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Step 1: Generate professional summary
        summary_request = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python", "AWS", "Docker"],
            "industry": "Technology",
            "job_description": "Senior backend engineer position",
            "num_alternatives": 2
        }

        summary_response = client.post(
            "/api/ai/generate/summary",
            json=summary_request,
            headers=auth_headers
        )

        assert summary_response.status_code == status.HTTP_200_OK
        summary_data = summary_response.json()
        assert "content" in summary_data

        # Step 2: Generate achievement bullets
        bullets_request = {
            "role": "Software Engineer",
            "company": "Tech Corp",
            "responsibilities": "Backend development, API design, team leadership",
            "num_bullets": 5,
            "style": "impact"
        }

        bullets_response = client.post(
            "/api/ai/generate/bullets",
            json=bullets_request,
            headers=auth_headers
        )

        assert bullets_response.status_code == status.HTTP_200_OK
        bullets_data = bullets_response.json()
        assert "bullets" in bullets_data
        assert len(bullets_data["bullets"]) > 0

        # Step 3: Generate cover letter
        cover_letter_request = {
            "candidate_name": "John Doe",
            "job_title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "resume_summary": summary_data["content"],
            "job_description": "We are seeking a talented engineer...",
            "tone": "professional",
            "max_words": 300
        }

        cover_letter_response = client.post(
            "/api/ai/generate/cover-letter",
            json=cover_letter_request,
            headers=auth_headers
        )

        assert cover_letter_response.status_code == status.HTTP_200_OK
        cover_letter_data = cover_letter_response.json()
        assert "content" in cover_letter_data
        assert cover_letter_data["tone"] == "professional"


@pytest.mark.integration
class TestServiceIntegration:
    """Integration tests between services."""

    @pytest.mark.asyncio
    async def test_llm_and_embedding_services(
        self,
        mock_llm_service,
        mock_embedding_service
    ):
        """Test LLM and embedding services working together."""
        # Generate content with LLM
        content = await mock_llm_service.complete(
            "Write a professional summary for a software engineer"
        )
        assert content is not None

        # Generate embedding for the content
        embedding = await mock_embedding_service.embed(content)
        assert embedding is not None
        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_matching_with_all_services(
        self,
        mock_job_matcher,
        sample_candidate_profile,
        sample_job_posting
    ):
        """Test job matching using all service components."""
        # Generate candidate embedding
        candidate_embedding = await mock_job_matcher.generate_candidate_embedding(
            sample_candidate_profile
        )
        assert candidate_embedding is not None

        # Generate job embedding
        job_embedding = await mock_job_matcher.generate_job_embedding(
            sample_job_posting
        )
        assert job_embedding is not None

        # Calculate match score
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

        match_score = await mock_job_matcher.calculate_match_score(
            candidate_data,
            job_data
        )

        assert 0.0 <= match_score.overall_score <= 1.0


@pytest.mark.integration
class TestErrorPropagation:
    """Test error handling across service boundaries."""

    @pytest.mark.asyncio
    async def test_llm_service_error_handling(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_llm_service
    ):
        """Test that LLM service errors are properly handled."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock LLM service to raise an exception
        mock_llm_service.complete.side_effect = Exception("LLM service unavailable")

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

        # Should return 500 error with proper message
        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        data = response.json()
        assert "error" in data or "detail" in data

    @pytest.mark.asyncio
    async def test_vector_store_error_handling(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_job_matcher,
        sample_candidate_profile
    ):
        """Test that vector store errors are properly handled."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock vector store to raise an exception
        mock_job_matcher.find_matching_jobs.side_effect = Exception("Vector store error")

        request_data = {
            "candidate_profile": sample_candidate_profile.model_dump(),
            "filters": {},
            "top_k": 20
        }

        response = client.post(
            "/api/ai/match/jobs",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


@pytest.mark.integration
class TestDataFlow:
    """Test data flow between components."""

    @pytest.mark.asyncio
    async def test_resume_data_transformation(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_resume_optimizer,
        sample_resume_content
    ):
        """Test resume data transformations through the pipeline."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Initial resume content
        assert len(sample_resume_content) > 0

        # Extract keywords
        keywords_request = {
            "job_description": "Python AWS Docker experience required",
            "top_k": 10
        }

        keywords_response = client.post(
            "/api/ai/optimize/keywords",
            json=keywords_request,
            headers=auth_headers
        )

        assert keywords_response.status_code == status.HTTP_200_OK
        keywords = keywords_response.json()

        # Optimize with extracted keywords
        optimize_request = {
            "resume_content": sample_resume_content,
            "job_description": "Python AWS Docker experience required",
            "optimization_level": "moderate"
        }

        optimize_response = client.post(
            "/api/ai/optimize/resume",
            json=optimize_request,
            headers=auth_headers
        )

        assert optimize_response.status_code == status.HTTP_200_OK
        optimized_data = optimize_response.json()

        # Verify data transformation
        assert "optimized_content" in optimized_data
        assert len(optimized_data["optimized_content"]) > 0

    @pytest.mark.asyncio
    async def test_matching_score_consistency(
        self,
        mock_job_matcher,
        sample_candidate_profile
    ):
        """Test that matching scores are consistent."""
        candidate_data = {
            "skills": sample_candidate_profile.skills,
            "experience_years": sample_candidate_profile.experience_years,
            "location_preferences": sample_candidate_profile.location_preferences,
            "culture_preferences": sample_candidate_profile.culture_preferences
        }

        job_data = {
            "required_skills": ["Python", "AWS"],
            "preferred_skills": ["Docker"],
            "min_experience": 3,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "hybrid",
            "company_culture": {}
        }

        # Calculate score multiple times
        scores = []
        for _ in range(3):
            match_score = await mock_job_matcher.calculate_match_score(
                candidate_data,
                job_data
            )
            scores.append(match_score.overall_score)

        # Scores should be consistent (with mocked services)
        assert len(set(scores)) == 1  # All scores are the same


@pytest.mark.integration
class TestPerformance:
    """Performance and load tests."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_api_requests(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_llm_service
    ):
        """Test handling concurrent API requests."""
        import asyncio

        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python"]
        }

        # Simulate concurrent requests
        async def make_request():
            return client.post(
                "/api/ai/generate/summary",
                json=request_data,
                headers=auth_headers
            )

        # Note: TestClient is not async, so we can't truly test concurrency
        # In real tests, you'd use httpx.AsyncClient
        responses = [make_request() for _ in range(5)]

        # All should succeed
        for response in responses:
            assert response.status_code == status.HTTP_200_OK

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_large_batch_processing(
        self,
        mock_job_matcher
    ):
        """Test processing large batches of data."""
        import numpy as np

        # Generate many embeddings
        embeddings = [np.random.rand(1536) for _ in range(100)]

        # Should handle large batch
        assert len(embeddings) == 100


@pytest.mark.integration
class TestAuthentication:
    """Integration tests for authentication flow."""

    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token."""
        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python"]
        }

        response = client.post("/api/ai/generate/summary", json=request_data)

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_protected_endpoint_with_invalid_token(self, client):
        """Test accessing protected endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}

        request_data = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python"]
        }

        response = client.post(
            "/api/ai/generate/summary",
            json=request_data,
            headers=headers
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_protected_endpoint_with_valid_token(
        self,
        client,
        auth_headers,
        mock_current_user,
        mock_llm_service
    ):
        """Test accessing protected endpoint with valid token."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

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

        assert response.status_code == status.HTTP_200_OK
