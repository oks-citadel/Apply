# AI Service Test Suite

Comprehensive pytest test suite for the AI Service Python backend.

## Test Coverage

### 1. API Endpoints (`test_api_endpoints.py`)
- Health check endpoints
- Content generation endpoints (summary, cover letter, bullets, skills)
- Resume optimization endpoints (optimize, ATS score, keywords)
- Job matching endpoints (match score, find jobs, batch scoring)
- Error handling and validation
- Rate limiting
- Streaming endpoints

### 2. LLM Service (`test_llm_service.py`)
- OpenAI integration with mocking
- Anthropic Claude integration with mocking
- Provider fallback mechanism
- Retry logic
- Prompt templates
- Response parsing
- Concurrent requests
- Configuration settings

### 3. Matching Service (`test_matching_service.py`)
- Job matching algorithms
- Skill matching (exact, partial, case-insensitive)
- Experience matching (perfect, insufficient, overqualified)
- Location matching (remote, hybrid, preferences)
- Culture fit calculation
- Score calculation and weighting
- Vector similarity
- Match explanations

## Setup

### Install Dependencies

```bash
# Install production dependencies
pip install -r requirements.txt

# Install test dependencies
pip install -r tests/requirements-test.txt
```

### Environment Variables

Create a `.env` file in the service root directory:

```env
# Required for tests
JWT_SECRET=test_secret_key_for_testing
OPENAI_API_KEY=test_openai_key
ANTHROPIC_API_KEY=test_anthropic_key
PINECONE_API_KEY=test_pinecone_key

# Optional test configuration
DEBUG=True
ENVIRONMENT=test
LOG_LEVEL=INFO
```

## Running Tests

### Run All Tests

```bash
# From the ai-service directory
pytest tests/

# With verbose output
pytest tests/ -v

# With coverage report
pytest tests/ --cov=src --cov-report=html --cov-report=term
```

### Run Specific Test Files

```bash
# Test API endpoints only
pytest tests/test_api_endpoints.py -v

# Test LLM service only
pytest tests/test_llm_service.py -v

# Test matching service only
pytest tests/test_matching_service.py -v
```

### Run Specific Test Classes or Functions

```bash
# Run a specific test class
pytest tests/test_api_endpoints.py::TestGenerateEndpoints -v

# Run a specific test function
pytest tests/test_llm_service.py::TestOpenAIProvider::test_openai_complete_success -v
```

### Run with Markers

```bash
# Run only async tests
pytest tests/ -v -m asyncio

# Skip slow tests
pytest tests/ -v -m "not slow"
```

## Test Structure

### Fixtures (`conftest.py`)

The `conftest.py` file provides:

- **Mock External Services**: OpenAI, Anthropic, Pinecone, Redis
- **Service Fixtures**: LLM, Embedding, Vector Store, Job Matcher, Resume Optimizer
- **Authentication Fixtures**: Valid/expired JWT tokens, mock users
- **Test Data Fixtures**: Sample candidate profiles, job postings, resumes
- **Test Client**: FastAPI test client with mocked dependencies

### Test Patterns

#### 1. Mocking External APIs

```python
@pytest.mark.asyncio
async def test_with_mocked_openai(mock_openai_client):
    """Test with mocked OpenAI API."""
    mock_response = Mock()
    mock_response.choices = [Mock(message=Mock(content="Response"))]
    mock_openai_client.chat.completions.create.return_value = mock_response

    # Your test code here
```

#### 2. Testing API Endpoints

```python
def test_endpoint(client, auth_headers, mock_current_user):
    """Test API endpoint with authentication."""
    client.app.dependency_overrides[get_current_user] = lambda: mock_current_user

    response = client.post("/api/endpoint", json=data, headers=auth_headers)

    assert response.status_code == 200
    assert "expected_key" in response.json()
```

#### 3. Testing Async Services

```python
@pytest.mark.asyncio
async def test_async_service(mock_llm_service):
    """Test async service method."""
    result = await mock_llm_service.complete("test prompt")

    assert result is not None
    mock_llm_service.complete.assert_called_once()
```

## Coverage Goals

- **Overall Coverage**: > 80%
- **Critical Paths**: > 90%
  - Authentication and authorization
  - Score calculations
  - API endpoints
- **Error Handling**: 100%

### Generate Coverage Report

```bash
# Generate HTML coverage report
pytest tests/ --cov=src --cov-report=html

# Open report in browser
open htmlcov/index.html  # macOS
start htmlcov/index.html  # Windows
xdg-open htmlcov/index.html  # Linux
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r tests/requirements-test.txt
      - name: Run tests
        run: pytest tests/ --cov=src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use fixtures for setup and teardown
- Mock external dependencies

### 2. Test Naming
```python
def test_<function>_<scenario>_<expected_result>():
    """Clear docstring explaining what is tested."""
    pass
```

### 3. Arrange-Act-Assert Pattern
```python
def test_example():
    # Arrange: Set up test data
    data = {"key": "value"}

    # Act: Execute the function
    result = function_under_test(data)

    # Assert: Verify the result
    assert result == expected_value
```

### 4. Mock External Services
- Always mock external API calls (OpenAI, Anthropic, Pinecone)
- Use fixtures for consistent mocking
- Verify mock calls when important

### 5. Test Both Success and Failure
```python
def test_success_scenario():
    """Test successful execution."""
    pass

def test_failure_scenario():
    """Test error handling."""
    pass

def test_edge_case():
    """Test boundary conditions."""
    pass
```

## Troubleshooting

### Common Issues

#### 1. Import Errors
```bash
# Make sure you're running from the correct directory
cd services/ai-service
pytest tests/
```

#### 2. Async Test Failures
```python
# Make sure to mark async tests
@pytest.mark.asyncio
async def test_async_function():
    pass
```

#### 3. JWT Secret Not Found
```bash
# Set environment variable
export JWT_SECRET=test_secret_key
# Or create .env file
```

#### 4. Mock Not Working
```python
# Use patch context manager
with patch('module.function') as mock:
    mock.return_value = "expected"
    # test code
```

## Adding New Tests

### 1. Create Test File
```python
# tests/test_new_feature.py
"""Tests for new feature."""

import pytest

class TestNewFeature:
    """Test class for new feature."""

    def test_new_functionality(self):
        """Test new functionality."""
        assert True
```

### 2. Add Fixtures (if needed)
```python
# In conftest.py or test file
@pytest.fixture
def new_fixture():
    """Fixture for new tests."""
    return MockObject()
```

### 3. Run New Tests
```bash
pytest tests/test_new_feature.py -v
```

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio](https://github.com/pytest-dev/pytest-asyncio)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
