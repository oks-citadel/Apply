"""
Tests for LLM Service with multiple provider support.
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from src.services.llm_service import (
    LLMService,
    OpenAIProvider,
    AnthropicProvider,
    LLMProvider
)
from src.config import settings


class TestOpenAIProvider:
    """Tests for OpenAI provider."""

    @pytest.fixture
    def mock_openai_response(self):
        """Mock OpenAI API response."""
        mock_response = Mock()
        mock_response.choices = [
            Mock(message=Mock(content="Test completion from OpenAI"))
        ]
        mock_response.usage = Mock(total_tokens=50)
        return mock_response

    @pytest.mark.asyncio
    async def test_openai_complete_success(self, mock_openai_client, mock_openai_response):
        """Test successful completion with OpenAI."""
        mock_openai_client.chat.completions.create.return_value = mock_openai_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            provider = OpenAIProvider(api_key="test_key", model="gpt-3.5-turbo")
            result = await provider.complete(
                prompt="Test prompt",
                max_tokens=100,
                temperature=0.7
            )

            assert result == "Test completion from OpenAI"
            mock_openai_client.chat.completions.create.assert_called_once()
            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args.kwargs["model"] == "gpt-3.5-turbo"
            assert call_args.kwargs["max_tokens"] == 100
            assert call_args.kwargs["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_openai_complete_with_system_success(self, mock_openai_client, mock_openai_response):
        """Test successful completion with system prompt."""
        mock_openai_client.chat.completions.create.return_value = mock_openai_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            provider = OpenAIProvider(api_key="test_key")
            result = await provider.complete_with_system(
                system_prompt="You are a helpful assistant",
                user_prompt="Test prompt",
                max_tokens=100
            )

            assert result == "Test completion from OpenAI"
            call_args = mock_openai_client.chat.completions.create.call_args
            messages = call_args.kwargs["messages"]
            assert len(messages) == 2
            assert messages[0]["role"] == "system"
            assert messages[1]["role"] == "user"

    @pytest.mark.asyncio
    async def test_openai_complete_with_empty_response(self, mock_openai_client):
        """Test handling of empty response."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content=None))]
        mock_response.usage = Mock(total_tokens=0)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            provider = OpenAIProvider(api_key="test_key")
            result = await provider.complete(prompt="Test")

            assert result == ""

    @pytest.mark.asyncio
    async def test_openai_complete_retry_on_failure(self, mock_openai_client):
        """Test retry mechanism on failure."""
        # First call fails, second succeeds
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Success"))]
        mock_response.usage = Mock(total_tokens=50)

        mock_openai_client.chat.completions.create.side_effect = [
            Exception("API Error"),
            mock_response
        ]

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            provider = OpenAIProvider(api_key="test_key")
            result = await provider.complete(prompt="Test")

            assert result == "Success"
            assert mock_openai_client.chat.completions.create.call_count == 2

    @pytest.mark.asyncio
    async def test_openai_complete_max_retries_exceeded(self, mock_openai_client):
        """Test failure after max retries."""
        mock_openai_client.chat.completions.create.side_effect = Exception("Persistent API Error")

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            provider = OpenAIProvider(api_key="test_key")

            with pytest.raises(Exception, match="Persistent API Error"):
                await provider.complete(prompt="Test")

            assert mock_openai_client.chat.completions.create.call_count == 3  # Default retry attempts


class TestAnthropicProvider:
    """Tests for Anthropic Claude provider."""

    @pytest.fixture
    def mock_anthropic_response(self):
        """Mock Anthropic API response."""
        mock_response = Mock()
        mock_response.content = [Mock(text="Test completion from Claude")]
        return mock_response

    @pytest.mark.asyncio
    async def test_anthropic_complete_success(self, mock_anthropic_client, mock_anthropic_response):
        """Test successful completion with Anthropic."""
        mock_anthropic_client.messages.create.return_value = mock_anthropic_response

        with patch('src.services.llm_service.AsyncAnthropic', return_value=mock_anthropic_client):
            provider = AnthropicProvider(api_key="test_key", model="claude-3-sonnet-20240229")
            result = await provider.complete(
                prompt="Test prompt",
                max_tokens=100,
                temperature=0.7
            )

            assert result == "Test completion from Claude"
            mock_anthropic_client.messages.create.assert_called_once()
            call_args = mock_anthropic_client.messages.create.call_args
            assert call_args.kwargs["model"] == "claude-3-sonnet-20240229"
            assert call_args.kwargs["max_tokens"] == 100
            assert call_args.kwargs["temperature"] == 0.7

    @pytest.mark.asyncio
    async def test_anthropic_complete_with_system_success(self, mock_anthropic_client, mock_anthropic_response):
        """Test successful completion with system prompt."""
        mock_anthropic_client.messages.create.return_value = mock_anthropic_response

        with patch('src.services.llm_service.AsyncAnthropic', return_value=mock_anthropic_client):
            provider = AnthropicProvider(api_key="test_key")
            result = await provider.complete_with_system(
                system_prompt="You are a helpful assistant",
                user_prompt="Test prompt",
                max_tokens=100
            )

            assert result == "Test completion from Claude"
            call_args = mock_anthropic_client.messages.create.call_args
            assert call_args.kwargs["system"] == "You are a helpful assistant"
            messages = call_args.kwargs["messages"]
            assert len(messages) == 1
            assert messages[0]["role"] == "user"

    @pytest.mark.asyncio
    async def test_anthropic_complete_with_empty_response(self, mock_anthropic_client):
        """Test handling of empty response."""
        mock_response = Mock()
        mock_response.content = []
        mock_anthropic_client.messages.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncAnthropic', return_value=mock_anthropic_client):
            provider = AnthropicProvider(api_key="test_key")
            result = await provider.complete(prompt="Test")

            assert result == ""

    @pytest.mark.asyncio
    async def test_anthropic_complete_retry_on_failure(self, mock_anthropic_client):
        """Test retry mechanism on failure."""
        mock_response = Mock()
        mock_response.content = [Mock(text="Success")]

        mock_anthropic_client.messages.create.side_effect = [
            Exception("API Error"),
            mock_response
        ]

        with patch('src.services.llm_service.AsyncAnthropic', return_value=mock_anthropic_client):
            provider = AnthropicProvider(api_key="test_key")
            result = await provider.complete(prompt="Test")

            assert result == "Success"
            assert mock_anthropic_client.messages.create.call_count == 2


class TestLLMService:
    """Tests for LLM service with provider fallback."""

    @pytest.mark.asyncio
    async def test_llm_service_primary_provider_success(self, mock_openai_client):
        """Test successful completion with primary provider."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Test response"))]
        mock_response.usage = Mock(total_tokens=50)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            service = LLMService()
            result = await service.complete(prompt="Test prompt")

            assert result == "Test response"

    @pytest.mark.asyncio
    async def test_llm_service_fallback_on_primary_failure(self):
        """Test fallback to secondary provider on primary failure."""
        # Create mock providers
        mock_primary = Mock(spec=OpenAIProvider)
        mock_primary.complete = AsyncMock(side_effect=Exception("Primary failed"))

        mock_fallback = Mock(spec=AnthropicProvider)
        mock_fallback.complete = AsyncMock(return_value="Fallback response")

        # Create service with both providers
        service = LLMService(
            primary_provider=mock_primary,
            fallback_provider=mock_fallback
        )

        result = await service.complete(prompt="Test prompt")

        assert result == "Fallback response"
        mock_primary.complete.assert_called_once()
        mock_fallback.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_llm_service_no_fallback_when_disabled(self):
        """Test that fallback is not used when disabled."""
        mock_primary = Mock(spec=OpenAIProvider)
        mock_primary.complete = AsyncMock(side_effect=Exception("Primary failed"))

        mock_fallback = Mock(spec=AnthropicProvider)
        mock_fallback.complete = AsyncMock(return_value="Fallback response")

        service = LLMService(
            primary_provider=mock_primary,
            fallback_provider=mock_fallback
        )

        with pytest.raises(Exception, match="Primary failed"):
            await service.complete(prompt="Test prompt", use_fallback=False)

        mock_primary.complete.assert_called_once()
        mock_fallback.complete.assert_not_called()

    @pytest.mark.asyncio
    async def test_llm_service_both_providers_fail(self):
        """Test error when both providers fail."""
        mock_primary = Mock(spec=OpenAIProvider)
        mock_primary.complete = AsyncMock(side_effect=Exception("Primary failed"))

        mock_fallback = Mock(spec=AnthropicProvider)
        mock_fallback.complete = AsyncMock(side_effect=Exception("Fallback failed"))

        service = LLMService(
            primary_provider=mock_primary,
            fallback_provider=mock_fallback
        )

        with pytest.raises(Exception, match="Fallback failed"):
            await service.complete(prompt="Test prompt")

    @pytest.mark.asyncio
    async def test_llm_service_complete_with_system(self):
        """Test completion with system prompt."""
        mock_primary = Mock(spec=OpenAIProvider)
        mock_primary.complete_with_system = AsyncMock(return_value="System response")

        service = LLMService(primary_provider=mock_primary)
        result = await service.complete_with_system(
            system_prompt="You are helpful",
            user_prompt="Test"
        )

        assert result == "System response"
        mock_primary.complete_with_system.assert_called_once()

    @pytest.mark.asyncio
    async def test_llm_service_uses_config_settings(self, mock_openai_client):
        """Test that service uses configuration settings."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        mock_response.usage = Mock(total_tokens=50)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            service = LLMService()
            await service.complete(prompt="Test")

            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args.kwargs["temperature"] == settings.llm_temperature
            assert call_args.kwargs["max_tokens"] == settings.llm_max_tokens

    @pytest.mark.asyncio
    async def test_llm_service_custom_parameters_override_defaults(self, mock_openai_client):
        """Test that custom parameters override defaults."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        mock_response.usage = Mock(total_tokens=50)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            service = LLMService()
            await service.complete(
                prompt="Test",
                temperature=0.9,
                max_tokens=500
            )

            call_args = mock_openai_client.chat.completions.create.call_args
            assert call_args.kwargs["temperature"] == 0.9
            assert call_args.kwargs["max_tokens"] == 500


class TestPromptTemplates:
    """Tests for prompt template functions."""

    @pytest.mark.asyncio
    async def test_generate_resume_content_summary(self, mock_llm_service):
        """Test resume summary generation."""
        context = {
            "title": "Software Engineer",
            "years_experience": 5,
            "skills": ["Python", "AWS", "Docker"],
            "industry": "Technology"
        }

        mock_llm_service.complete.return_value = "Generated summary"

        result = await mock_llm_service.generate_resume_content(
            section_type="summary",
            context=context,
            job_description="Senior backend developer"
        )

        assert result == "Generated summary"
        mock_llm_service.complete.assert_called_once()

    @pytest.mark.asyncio
    async def test_optimize_for_ats(self, mock_llm_service):
        """Test ATS optimization."""
        resume_content = "John Doe\nSoftware Engineer"
        job_description = "Looking for Python developer"

        mock_llm_service.optimize_for_ats.return_value = "Optimized content"

        result = await mock_llm_service.optimize_for_ats(
            resume_content=resume_content,
            job_description=job_description,
            optimization_level="moderate"
        )

        assert result == "Optimized content"


class TestResponseParsing:
    """Tests for response parsing."""

    def test_parse_multi_line_response(self):
        """Test parsing multi-line LLM responses."""
        response = """
        Line 1: First summary
        Line 2: Second summary
        Line 3: Third summary
        """

        lines = [line.strip() for line in response.split("\n") if line.strip()]
        assert len(lines) == 3
        assert lines[0].startswith("Line 1")

    def test_parse_structured_response(self):
        """Test parsing structured responses."""
        response = """
        Skills:
        - Python
        - AWS
        - Docker

        Suggestions:
        - Kubernetes
        - GraphQL
        """

        lines = response.split("\n")
        assert "Skills:" in response
        assert "Suggestions:" in response

    def test_extract_score_from_response(self):
        """Test extracting numeric scores from responses."""
        import re

        response = "The culture fit score is 0.85 based on the analysis."

        score_match = re.search(r"(\d+\.?\d*)", response)
        assert score_match is not None
        score = float(score_match.group(1))
        assert score == 0.85

    def test_extract_percentage_score(self):
        """Test extracting percentage scores."""
        import re

        response = "The match score is 85% based on skills."

        score_match = re.search(r"(\d+)%", response)
        assert score_match is not None
        score = float(score_match.group(1)) / 100
        assert score == 0.85


class TestLLMServiceIntegration:
    """Integration tests for LLM service."""

    @pytest.mark.asyncio
    async def test_end_to_end_openai_completion(self, mock_openai_client):
        """Test end-to-end OpenAI completion."""
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Complete response"))]
        mock_response.usage = Mock(total_tokens=100)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            service = LLMService()

            # Test basic completion
            result1 = await service.complete("Test prompt 1")
            assert result1 == "Complete response"

            # Test with system prompt
            result2 = await service.complete_with_system(
                "You are helpful",
                "Test prompt 2"
            )
            assert result2 == "Complete response"

    @pytest.mark.asyncio
    async def test_provider_initialization_based_on_config(self):
        """Test that providers are initialized based on config."""
        with patch('src.services.llm_service.settings.default_llm_provider', 'openai'):
            with patch('src.services.llm_service.AsyncOpenAI'):
                service = LLMService()
                assert isinstance(service.primary_provider, OpenAIProvider)

    @pytest.mark.asyncio
    async def test_concurrent_requests(self, mock_openai_client):
        """Test handling concurrent requests."""
        import asyncio

        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Response"))]
        mock_response.usage = Mock(total_tokens=50)
        mock_openai_client.chat.completions.create.return_value = mock_response

        with patch('src.services.llm_service.AsyncOpenAI', return_value=mock_openai_client):
            service = LLMService()

            # Make concurrent requests
            tasks = [
                service.complete(f"Prompt {i}")
                for i in range(5)
            ]

            results = await asyncio.gather(*tasks)

            assert len(results) == 5
            assert all(r == "Response" for r in results)
            assert mock_openai_client.chat.completions.create.call_count == 5
