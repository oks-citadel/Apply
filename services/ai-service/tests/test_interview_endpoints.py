"""
Tests for interview preparation endpoints.
"""

import pytest
from fastapi import status
from unittest.mock import AsyncMock, Mock
from src.api.dependencies import get_current_user


class TestInterviewQuestionGeneration:
    """Tests for interview question generation endpoint."""

    def test_generate_questions_success(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test successful interview question generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock LLM to return formatted questions
        mock_llm_service.complete.return_value = """
Q1: Tell me about a challenging project you worked on.
Type: behavioral
Difficulty: medium
Tips:
- Use the STAR method
- Focus on specific examples
Example Structure: Situation, Task, Action, Result

Q2: How do you handle technical disagreements?
Type: behavioral
Difficulty: medium
Tips:
- Show collaboration skills
- Demonstrate problem-solving
Example Structure: Describe the disagreement, your approach, and the outcome
"""

        request_data = {
            "job_title": "Senior Software Engineer",
            "job_description": "Looking for experienced backend developer",
            "company_name": "Tech Corp",
            "question_types": ["behavioral", "technical"],
            "num_questions": 2,
            "difficulty": "medium"
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # Verify question structure
        question = data[0]
        assert "question" in question
        assert "type" in question
        assert "difficulty" in question
        assert "tips" in question
        assert isinstance(question["tips"], list)

    def test_generate_questions_with_different_types(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test generating different types of questions."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Data Scientist",
            "job_description": "Machine learning focused role",
            "question_types": ["technical", "situational"],
            "num_questions": 5,
            "difficulty": "hard"
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)

    def test_generate_questions_invalid_difficulty(self, client, auth_headers, mock_current_user):
        """Test validation of difficulty parameter."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Full stack developer",
            "num_questions": -5  # Invalid number
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_generate_questions_unauthorized(self, client):
        """Test question generation without authentication."""
        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Backend developer"
        }

        response = client.post("/api/ai/interview/questions", json=request_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_generate_questions_llm_failure(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test handling of LLM service failure."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user
        mock_llm_service.complete.side_effect = Exception("LLM service error")

        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Backend developer",
            "num_questions": 3
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR

    def test_generate_questions_max_limit(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test generating maximum number of questions."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Full stack developer",
            "num_questions": 30  # Maximum allowed
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK


class TestInterviewFeedback:
    """Tests for interview response feedback endpoint."""

    def test_analyze_response_success(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test successful interview response analysis."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Mock LLM to return formatted feedback
        mock_llm_service.complete.return_value = """
Score: 7.5/10

Strengths:
- Clear structure using STAR method
- Specific examples with quantifiable results
- Demonstrated problem-solving skills

Weaknesses:
- Could provide more technical depth
- Missing discussion of lessons learned

Suggestions:
- Add more details about technical implementation
- Explain what you would do differently

Improved Version:
In my previous role, I led the migration of our monolithic application to microservices...

Detailed Feedback:
Your response demonstrates good understanding of the STAR method and provides concrete examples.
However, adding more technical depth would strengthen your answer.
"""

        request_data = {
            "question": "Tell me about a time you solved a complex technical problem",
            "answer": "I worked on migrating our system to microservices...",
            "question_type": "behavioral",
            "job_context": "Senior Software Engineer role"
        }

        response = client.post(
            "/api/ai/interview/feedback",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "overall_score" in data
        assert 0.0 <= data["overall_score"] <= 10.0
        assert "strengths" in data
        assert "weaknesses" in data
        assert "suggestions" in data
        assert "improved_version" in data
        assert "detailed_feedback" in data
        assert isinstance(data["strengths"], list)
        assert isinstance(data["weaknesses"], list)
        assert isinstance(data["suggestions"], list)

    def test_analyze_response_technical_question(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test analysis of technical question response."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "question": "Explain how a hash table works",
            "answer": "A hash table uses a hash function to compute an index...",
            "question_type": "technical"
        }

        response = client.post(
            "/api/ai/interview/feedback",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["overall_score"] >= 0.0

    def test_analyze_response_poor_answer(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test analysis of a poor response."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        mock_llm_service.complete.return_value = """
Score: 3/10

Strengths:
- Attempted to answer the question

Weaknesses:
- Lacks specific examples
- No measurable outcomes
- Too vague and generic
- Missing key details

Suggestions:
- Use the STAR method
- Provide specific examples
- Include quantifiable results
- Add more technical depth

Improved Version:
Focus on a specific situation with clear context, actions taken, and measurable results.

Detailed Feedback:
The response needs significant improvement. It lacks specificity and concrete examples.
"""

        request_data = {
            "question": "Describe your leadership experience",
            "answer": "I am a good leader.",
            "question_type": "behavioral"
        }

        response = client.post(
            "/api/ai/interview/feedback",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["overall_score"] <= 5.0
        assert len(data["weaknesses"]) > 0

    def test_analyze_response_unauthorized(self, client):
        """Test feedback endpoint without authentication."""
        request_data = {
            "question": "Test question",
            "answer": "Test answer"
        }

        response = client.post("/api/ai/interview/feedback", json=request_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_analyze_response_empty_answer(self, client, auth_headers, mock_current_user):
        """Test validation with empty answer."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "question": "Tell me about yourself",
            "answer": ""  # Empty answer
        }

        response = client.post(
            "/api/ai/interview/feedback",
            json=request_data,
            headers=auth_headers
        )

        # Should either reject or provide feedback about empty answer
        assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_200_OK]


class TestPrepareTopics:
    """Tests for interview preparation topics endpoint."""

    def test_prepare_topics_success(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test successful preparation topics generation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        mock_llm_service.complete.return_value = """
Key Topics:
- Topic: System Design Principles
  Why: Essential for senior role
  How to prepare: Review scalability patterns

- Topic: Python Advanced Features
  Why: Primary language for role
  How to prepare: Study decorators, generators, async

Company Research:
- Company mission and values
- Recent product launches
- Engineering blog posts

Questions to Ask:
- What does success look like in this role?
- How does the team approach technical debt?
- What are the biggest technical challenges?
"""

        request_data = {
            "job_title": "Senior Software Engineer",
            "job_description": "Looking for experienced Python developer",
            "resume_summary": "5 years of backend development experience"
        }

        response = client.post(
            "/api/ai/interview/prepare-topics",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        assert "topics" in data
        assert "company_research" in data
        assert "questions_to_ask" in data
        assert isinstance(data["topics"], list)
        assert isinstance(data["company_research"], list)
        assert isinstance(data["questions_to_ask"], list)

        if len(data["topics"]) > 0:
            topic = data["topics"][0]
            assert "name" in topic

    def test_prepare_topics_without_resume(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test preparation topics without resume summary."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Data Scientist",
            "job_description": "Machine learning focused role"
        }

        response = client.post(
            "/api/ai/interview/prepare-topics",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["topics"]) > 0

    def test_prepare_topics_entry_level(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test preparation topics for entry-level position."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Junior Developer",
            "job_description": "Entry-level position for recent graduates",
            "resume_summary": "Recent CS graduate"
        }

        response = client.post(
            "/api/ai/interview/prepare-topics",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "topics" in data

    def test_prepare_topics_unauthorized(self, client):
        """Test preparation topics without authentication."""
        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Backend developer"
        }

        response = client.post("/api/ai/interview/prepare-topics", json=request_data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_prepare_topics_llm_failure(self, client, auth_headers, mock_current_user, mock_llm_service):
        """Test handling of LLM failure."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user
        mock_llm_service.complete.side_effect = Exception("Service error")

        request_data = {
            "job_title": "Software Engineer",
            "job_description": "Backend developer"
        }

        response = client.post(
            "/api/ai/interview/prepare-topics",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR


class TestInterviewEndpointsValidation:
    """Tests for input validation across interview endpoints."""

    def test_question_generation_missing_fields(self, client, auth_headers, mock_current_user):
        """Test validation with missing required fields."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "job_title": "Software Engineer"
            # Missing job_description
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_feedback_missing_fields(self, client, auth_headers, mock_current_user):
        """Test feedback validation with missing fields."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        request_data = {
            "question": "Test question"
            # Missing answer
        }

        response = client.post(
            "/api/ai/interview/feedback",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_question_num_bounds(self, client, auth_headers, mock_current_user):
        """Test num_questions boundary validation."""
        client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

        # Test below minimum
        request_data = {
            "job_title": "Engineer",
            "job_description": "Test",
            "num_questions": 2  # Below minimum of 3
        }

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

        # Test above maximum
        request_data["num_questions"] = 31  # Above maximum of 30

        response = client.post(
            "/api/ai/interview/questions",
            json=request_data,
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
