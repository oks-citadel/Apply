"""
Pytest configuration and fixtures for AI Service tests.
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from fastapi import FastAPI
import numpy as np

from src.main import app
from src.config import settings
from src.services.llm_service import LLMService, OpenAIProvider, AnthropicProvider
from src.services.embedding_service import EmbeddingService
from src.services.vector_store import VectorStore
from src.models.job_matcher import JobMatcher
from src.models.resume_optimizer import ResumeOptimizer
from src.models.salary_predictor import SalaryPredictor
from src.api.dependencies import CurrentUser
from src.schemas.request_schemas import CandidateProfile, JobPosting
from src.schemas.response_schemas import MatchScore


# Configure pytest-asyncio
@pytest.fixture(scope="session")
def event_loop_policy():
    """Set event loop policy for async tests."""
    return asyncio.get_event_loop_policy()


@pytest.fixture(scope="function")
def event_loop():
    """Create an event loop for each test."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# Mock External Services
@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client."""
    mock_client = AsyncMock()
    mock_response = Mock()
    mock_response.choices = [
        Mock(message=Mock(content="Generated test content"))
    ]
    mock_response.usage = Mock(total_tokens=100)
    mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
    return mock_client


@pytest.fixture
def mock_anthropic_client():
    """Mock Anthropic client."""
    mock_client = AsyncMock()
    mock_response = Mock()
    mock_response.content = [Mock(text="Generated test content")]
    mock_client.messages.create = AsyncMock(return_value=mock_response)
    return mock_client


@pytest.fixture
def mock_pinecone_index():
    """Mock Pinecone index."""
    mock_index = Mock()

    # Mock query response
    mock_match = {
        "id": "job_123",
        "score": 0.85,
        "metadata": {
            "title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "required_skills": ["Python", "AWS", "Docker"],
            "min_experience": 5,
            "location": "San Francisco",
            "remote_policy": "hybrid"
        }
    }

    mock_query_response = {
        "matches": [mock_match],
        "namespace": ""
    }

    mock_index.query = Mock(return_value=mock_query_response)
    mock_index.upsert = Mock(return_value={"upserted_count": 1})
    mock_index.delete = Mock(return_value={})
    mock_index.describe_index_stats = Mock(return_value={"total_vector_count": 100})

    return mock_index


@pytest.fixture
def mock_redis_client():
    """Mock Redis client."""
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.set = AsyncMock(return_value=True)
    mock_redis.delete = AsyncMock(return_value=1)
    mock_redis.close = AsyncMock()
    return mock_redis


# Service Fixtures
@pytest.fixture
def mock_llm_service(mock_openai_client):
    """Mock LLM service."""
    service = Mock(spec=LLMService)
    service.complete = AsyncMock(return_value="Generated test content")
    service.complete_with_system = AsyncMock(return_value="Generated test content with system")
    service.generate_resume_content = AsyncMock(return_value="Generated resume content")
    service.optimize_for_ats = AsyncMock(return_value="Optimized resume content")
    return service


@pytest.fixture
def mock_embedding_service():
    """Mock embedding service."""
    service = Mock(spec=EmbeddingService)
    # Return a consistent embedding vector
    embedding = np.random.rand(1536).tolist()
    service.embed = AsyncMock(return_value=embedding)
    service.embed_batch = AsyncMock(return_value=[embedding, embedding])
    service.initialize = AsyncMock()
    service.close = AsyncMock()
    return service


@pytest.fixture
def mock_vector_store(mock_pinecone_index):
    """Mock vector store."""
    store = Mock(spec=VectorStore)
    store.query = AsyncMock(return_value=[{
        "id": "job_123",
        "score": 0.85,
        "metadata": {
            "title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "required_skills": ["Python", "AWS", "Docker"],
            "min_experience": 5
        }
    }])
    store.upsert = AsyncMock(return_value=True)
    store.delete = AsyncMock(return_value=True)
    store.initialize = AsyncMock()
    store.close = AsyncMock()
    store.health_check = AsyncMock()
    return store


@pytest.fixture
def mock_job_matcher(mock_embedding_service, mock_vector_store, mock_llm_service):
    """Mock job matcher."""
    matcher = Mock(spec=JobMatcher)

    # Mock match score
    match_score = MatchScore(
        overall_score=0.85,
        skill_match_score=0.90,
        experience_match_score=0.85,
        location_match_score=1.0,
        culture_match_score=0.75,
        explanation="Excellent match based on skills and experience.",
        strengths=["Excellent skill match", "Experience level is ideal"],
        gaps=[]
    )

    matcher.calculate_match_score = AsyncMock(return_value=match_score)
    matcher.generate_candidate_embedding = AsyncMock(
        return_value=np.random.rand(1536)
    )
    matcher.find_matching_jobs = AsyncMock(return_value=[{
        "id": "job_123",
        "metadata": {
            "title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "required_skills": ["Python", "AWS"],
            "min_experience": 5
        }
    }])

    return matcher


@pytest.fixture
def mock_resume_optimizer(mock_llm_service):
    """Mock resume optimizer."""
    from src.schemas.response_schemas import ATSScore, OptimizedResume, Keyword

    optimizer = Mock(spec=ResumeOptimizer)

    # Mock ATS score
    ats_score = ATSScore(
        overall_score=75.0,
        keyword_match_score=80.0,
        formatting_score=70.0,
        completeness_score=75.0,
        matched_keywords=["Python", "AWS", "Docker"],
        missing_keywords=["Kubernetes"],
        recommendations=["Add more quantified achievements"],
        estimated_ranking="good"
    )

    optimizer.calculate_ats_score = AsyncMock(return_value=ats_score)

    # Mock optimized resume
    optimized = OptimizedResume(
        original_resume_id="resume_123",
        optimized_content="Optimized resume content",
        changes=[{"type": "keyword_addition", "description": "Added Docker"}],
        ats_score_before=65.0,
        ats_score_after=85.0,
        improvement_percentage=30.77,
        recommendations=["Add more quantified achievements"]
    )

    optimizer.optimize_for_job = AsyncMock(return_value=optimized)

    # Mock keyword extraction
    keywords = [
        Keyword(keyword="Python", relevance=0.95, category="technical", frequency=5),
        Keyword(keyword="AWS", relevance=0.90, category="technical", frequency=3),
    ]

    optimizer.extract_keywords = AsyncMock(return_value=keywords)
    optimizer.tailor_summary = AsyncMock(return_value="Tailored summary content")
    optimizer.enhance_achievements = AsyncMock(return_value=[
        "Enhanced achievement 1",
        "Enhanced achievement 2"
    ])

    return optimizer


@pytest.fixture
def mock_salary_predictor(mock_llm_service):
    """Mock salary predictor."""
    from src.schemas.response_schemas import SalaryPrediction

    predictor = Mock(spec=SalaryPredictor)

    # Mock salary prediction
    prediction = SalaryPrediction(
        predicted_salary=150000.0,
        confidence_interval={"min": 135000.0, "max": 165000.0},
        percentile_25=140000.0,
        percentile_50=150000.0,
        percentile_75=160000.0,
        market_context="Above average for San Francisco market",
        factors=[
            {"factor": "experience", "impact": "high", "value": "5 years"},
            {"factor": "skills", "impact": "high", "value": "Python, AWS, Docker"}
        ],
        data_sources=["Bureau of Labor Statistics", "Industry surveys"]
    )

    predictor.predict_salary = AsyncMock(return_value=prediction)

    return predictor


# Authentication Fixtures
@pytest.fixture
def mock_current_user():
    """Mock authenticated user."""
    return CurrentUser(
        user_id="user_123",
        email="test@example.com",
        roles=["user"]
    )


@pytest.fixture
def mock_admin_user():
    """Mock admin user."""
    return CurrentUser(
        user_id="admin_123",
        email="admin@example.com",
        roles=["admin", "user"]
    )


@pytest.fixture
def valid_jwt_token():
    """Generate valid JWT token for testing."""
    import jwt
    from datetime import datetime, timedelta

    payload = {
        "sub": "user_123",
        "email": "test@example.com",
        "roles": ["user"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


@pytest.fixture
def expired_jwt_token():
    """Generate expired JWT token for testing."""
    import jwt
    from datetime import datetime, timedelta

    payload = {
        "sub": "user_123",
        "email": "test@example.com",
        "roles": ["user"],
        "exp": datetime.utcnow() - timedelta(hours=1)
    }

    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


# Test Data Fixtures
@pytest.fixture
def sample_candidate_profile():
    """Sample candidate profile."""
    return CandidateProfile(
        id="candidate_123",
        name="John Doe",
        title="Software Engineer",
        summary="Experienced software engineer with 5 years of experience",
        skills=["Python", "AWS", "Docker", "FastAPI"],
        experience_years=5,
        work_history=[
            {
                "title": "Software Engineer",
                "company": "Tech Corp",
                "description": "Developed backend services"
            }
        ],
        location="San Francisco, CA",
        location_preferences=["San Francisco", "Remote"],
        remote_preference="hybrid",
        culture_preferences={"work_life_balance": "high", "innovation": "high"}
    )


@pytest.fixture
def sample_job_posting():
    """Sample job posting."""
    return JobPosting(
        id="job_123",
        title="Senior Software Engineer",
        company_id="company_456",
        company_name="Tech Corp",
        description="We are looking for a senior software engineer...",
        required_skills=["Python", "AWS", "Docker"],
        preferred_skills=["Kubernetes", "GraphQL"],
        min_experience=5,
        max_experience=10,
        location="San Francisco, CA",
        remote_policy="hybrid",
        salary_range={"min": 140000, "max": 180000},
        company_culture={"work_life_balance": "high", "innovation": "high"}
    )


@pytest.fixture
def sample_resume_content():
    """Sample resume content."""
    return """
    John Doe
    Software Engineer
    john@example.com | (555) 123-4567

    PROFESSIONAL SUMMARY
    Experienced software engineer with 5 years of experience in backend development.

    SKILLS
    Python, AWS, Docker, FastAPI, PostgreSQL

    WORK EXPERIENCE
    Software Engineer - Tech Corp (2020-Present)
    - Developed RESTful APIs using FastAPI
    - Managed AWS infrastructure
    - Implemented CI/CD pipelines
    """


@pytest.fixture
def sample_job_description():
    """Sample job description."""
    return """
    Senior Software Engineer

    We are seeking a talented Senior Software Engineer to join our team.

    Requirements:
    - 5+ years of experience in software development
    - Strong proficiency in Python and AWS
    - Experience with Docker and containerization
    - Knowledge of RESTful API design

    Preferred:
    - Kubernetes experience
    - GraphQL knowledge
    - Experience with microservices architecture
    """


# FastAPI Test Client
@pytest.fixture
def test_app(
    mock_llm_service,
    mock_embedding_service,
    mock_vector_store,
    mock_job_matcher,
    mock_resume_optimizer,
    mock_salary_predictor
):
    """FastAPI test application with mocked dependencies."""
    # Create a test app instance
    test_app = FastAPI()

    # Inject mocked services
    test_app.state.llm_service = mock_llm_service
    test_app.state.embedding_service = mock_embedding_service
    test_app.state.vector_store = mock_vector_store
    test_app.state.job_matcher = mock_job_matcher
    test_app.state.resume_optimizer = mock_resume_optimizer
    test_app.state.salary_predictor = mock_salary_predictor

    # Include routers from main app
    from src.api.routes import generate, optimize, match, interview, salary

    test_app.include_router(generate.router, prefix="/api/ai/generate")
    test_app.include_router(optimize.router, prefix="/api/ai/optimize")
    test_app.include_router(match.router, prefix="/api/ai/match")
    test_app.include_router(interview.router, prefix="/api/ai/interview")
    test_app.include_router(salary.router, prefix="/api/ai/predict")

    return test_app


@pytest.fixture
def client(test_app):
    """Test client for FastAPI application."""
    return TestClient(test_app)


@pytest.fixture
def auth_headers(valid_jwt_token):
    """Authentication headers with valid token."""
    return {"Authorization": f"Bearer {valid_jwt_token}"}


# Utility Functions
@pytest.fixture
def mock_dependency_override(test_app):
    """Helper to override FastAPI dependencies."""
    def _override(dependency, mock):
        test_app.dependency_overrides[dependency] = lambda: mock
    return _override
