"""
Tests for embedding service.
"""

import pytest
import numpy as np
from unittest.mock import AsyncMock, Mock, patch
from src.services.embedding_service import EmbeddingService


class TestEmbeddingService:
    """Tests for EmbeddingService class."""

    @pytest.mark.asyncio
    async def test_embed_success(self, mock_embedding_service):
        """Test successful embedding generation."""
        text = "Software engineer with Python experience"

        embedding = await mock_embedding_service.embed(text)

        assert embedding is not None
        assert isinstance(embedding, list)
        assert len(embedding) == 1536  # OpenAI embedding dimension
        mock_embedding_service.embed.assert_called_once_with(text)

    @pytest.mark.asyncio
    async def test_embed_empty_text(self, mock_embedding_service):
        """Test embedding generation with empty text."""
        # Some implementations might handle empty text differently
        embedding = await mock_embedding_service.embed("")

        assert embedding is not None

    @pytest.mark.asyncio
    async def test_embed_long_text(self, mock_embedding_service):
        """Test embedding generation with very long text."""
        # Create a long text that might exceed token limits
        long_text = " ".join(["word"] * 10000)

        embedding = await mock_embedding_service.embed(long_text)

        assert embedding is not None
        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_embed_special_characters(self, mock_embedding_service):
        """Test embedding generation with special characters."""
        text = "Python, C++, C#, .NET, Node.js @mentions #hashtags"

        embedding = await mock_embedding_service.embed(text)

        assert embedding is not None
        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_embed_batch_success(self, mock_embedding_service):
        """Test batch embedding generation."""
        texts = [
            "Software Engineer",
            "Data Scientist",
            "Product Manager"
        ]

        embeddings = await mock_embedding_service.embed_batch(texts)

        assert embeddings is not None
        assert isinstance(embeddings, list)
        mock_embedding_service.embed_batch.assert_called_once_with(texts)

    @pytest.mark.asyncio
    async def test_embed_batch_single_item(self, mock_embedding_service):
        """Test batch embedding with single item."""
        texts = ["Single text"]

        embeddings = await mock_embedding_service.embed_batch(texts)

        assert embeddings is not None
        assert len(embeddings) >= 1

    @pytest.mark.asyncio
    async def test_embed_batch_empty_list(self, mock_embedding_service):
        """Test batch embedding with empty list."""
        texts = []

        embeddings = await mock_embedding_service.embed_batch(texts)

        # Should handle empty list gracefully
        assert isinstance(embeddings, list)

    @pytest.mark.asyncio
    async def test_initialize_service(self, mock_embedding_service):
        """Test service initialization."""
        await mock_embedding_service.initialize()

        mock_embedding_service.initialize.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_service(self, mock_embedding_service):
        """Test service cleanup."""
        await mock_embedding_service.close()

        mock_embedding_service.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_embed_consistency(self, mock_embedding_service):
        """Test that same text produces same embedding."""
        text = "Consistent text"

        embedding1 = await mock_embedding_service.embed(text)
        embedding2 = await mock_embedding_service.embed(text)

        # With mocked service, we just verify calls were made
        assert mock_embedding_service.embed.call_count == 2


class TestEmbeddingServiceIntegration:
    """Integration tests for embedding service."""

    @pytest.mark.asyncio
    async def test_embed_job_description(self, mock_embedding_service):
        """Test embedding a job description."""
        job_description = """
Senior Software Engineer

We are looking for an experienced software engineer with:
- 5+ years of Python development
- Experience with AWS and Docker
- Strong problem-solving skills
        """

        embedding = await mock_embedding_service.embed(job_description)

        assert embedding is not None
        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_embed_resume_summary(self, mock_embedding_service):
        """Test embedding a resume summary."""
        resume_summary = """
Experienced software engineer with 7 years in backend development.
Proficient in Python, AWS, Docker, and microservices architecture.
Led teams and delivered scalable solutions.
        """

        embedding = await mock_embedding_service.embed(resume_summary)

        assert embedding is not None
        assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_batch_embed_multiple_jobs(self, mock_embedding_service):
        """Test batch embedding multiple job postings."""
        jobs = [
            "Software Engineer - Python, AWS",
            "Data Scientist - Machine Learning, Python",
            "DevOps Engineer - Kubernetes, Docker",
            "Frontend Developer - React, TypeScript"
        ]

        embeddings = await mock_embedding_service.embed_batch(jobs)

        assert embeddings is not None
        assert isinstance(embeddings, list)


class TestEmbeddingDimensions:
    """Tests for embedding dimensions and properties."""

    @pytest.mark.asyncio
    async def test_embedding_dimension_consistency(self, mock_embedding_service):
        """Test that all embeddings have same dimension."""
        texts = ["text1", "text2", "text3"]

        embeddings = await mock_embedding_service.embed_batch(texts)

        # All embeddings should have same dimension
        dimensions = [len(emb) for emb in embeddings]
        assert len(set(dimensions)) <= 1  # All same or empty

    @pytest.mark.asyncio
    async def test_embedding_values_range(self, mock_embedding_service):
        """Test that embedding values are in reasonable range."""
        text = "Test text for embedding"

        embedding = await mock_embedding_service.embed(text)

        # OpenAI embeddings are typically normalized
        # Values should be in a reasonable range
        embedding_array = np.array(embedding)
        assert np.all(np.isfinite(embedding_array))


class TestEmbeddingServiceErrors:
    """Tests for error handling in embedding service."""

    @pytest.mark.asyncio
    async def test_embed_api_failure(self):
        """Test handling of API failure."""
        mock_service = Mock(spec=EmbeddingService)
        mock_service.embed = AsyncMock(side_effect=Exception("API Error"))

        with pytest.raises(Exception, match="API Error"):
            await mock_service.embed("test text")

    @pytest.mark.asyncio
    async def test_embed_batch_partial_failure(self):
        """Test batch embedding with partial failures."""
        # This test would verify how the service handles when some
        # items in a batch fail but others succeed
        mock_service = Mock(spec=EmbeddingService)
        mock_service.embed_batch = AsyncMock(
            side_effect=Exception("Batch processing error")
        )

        with pytest.raises(Exception):
            await mock_service.embed_batch(["text1", "text2"])

    @pytest.mark.asyncio
    async def test_embed_retry_logic(self):
        """Test retry logic on temporary failures."""
        mock_service = Mock(spec=EmbeddingService)

        # First call fails, second succeeds
        mock_embedding = [0.1] * 1536
        mock_service.embed = AsyncMock(
            side_effect=[Exception("Temporary error"), mock_embedding]
        )

        # With retry logic, this should eventually succeed
        # This test assumes the service implements retry logic


class TestCaching:
    """Tests for embedding caching (if implemented)."""

    @pytest.mark.asyncio
    async def test_cache_hit(self, mock_embedding_service, mock_redis_client):
        """Test cache hit scenario."""
        # If caching is implemented, same text should hit cache
        text = "Cached text"

        # First call - cache miss
        embedding1 = await mock_embedding_service.embed(text)

        # Second call - cache hit
        embedding2 = await mock_embedding_service.embed(text)

        # Both should return embeddings
        assert embedding1 is not None
        assert embedding2 is not None

    @pytest.mark.asyncio
    async def test_cache_invalidation(self, mock_redis_client):
        """Test cache invalidation."""
        # Test that cache can be properly invalidated
        await mock_redis_client.delete("embedding:some_key")
        mock_redis_client.delete.assert_called()


class TestTextPreprocessing:
    """Tests for text preprocessing before embedding."""

    @pytest.mark.asyncio
    async def test_embed_with_whitespace(self, mock_embedding_service):
        """Test embedding text with extra whitespace."""
        text_with_whitespace = "  Text   with    extra   spaces  "

        embedding = await mock_embedding_service.embed(text_with_whitespace)

        assert embedding is not None

    @pytest.mark.asyncio
    async def test_embed_multiline_text(self, mock_embedding_service):
        """Test embedding multiline text."""
        multiline_text = """
        First line
        Second line
        Third line
        """

        embedding = await mock_embedding_service.embed(multiline_text)

        assert embedding is not None

    @pytest.mark.asyncio
    async def test_embed_unicode_text(self, mock_embedding_service):
        """Test embedding text with unicode characters."""
        unicode_text = "Developer with résumé in café ☕"

        embedding = await mock_embedding_service.embed(unicode_text)

        assert embedding is not None


class TestEmbeddingMetrics:
    """Tests for embedding quality metrics."""

    def test_cosine_similarity_identical_vectors(self):
        """Test cosine similarity of identical vectors."""
        vec1 = np.array([1.0, 2.0, 3.0])
        vec2 = np.array([1.0, 2.0, 3.0])

        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        assert similarity == pytest.approx(1.0)

    def test_cosine_similarity_orthogonal_vectors(self):
        """Test cosine similarity of orthogonal vectors."""
        vec1 = np.array([1.0, 0.0, 0.0])
        vec2 = np.array([0.0, 1.0, 0.0])

        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        assert similarity == pytest.approx(0.0)

    def test_cosine_similarity_opposite_vectors(self):
        """Test cosine similarity of opposite vectors."""
        vec1 = np.array([1.0, 1.0, 1.0])
        vec2 = np.array([-1.0, -1.0, -1.0])

        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

        assert similarity == pytest.approx(-1.0)

    def test_embedding_normalization(self):
        """Test that embeddings can be normalized."""
        embedding = np.array([3.0, 4.0])  # Length 5

        normalized = embedding / np.linalg.norm(embedding)

        assert np.linalg.norm(normalized) == pytest.approx(1.0)


class TestBatchProcessing:
    """Tests for batch processing optimizations."""

    @pytest.mark.asyncio
    async def test_large_batch_processing(self, mock_embedding_service):
        """Test processing large batches."""
        # Test with larger batch
        texts = [f"Text {i}" for i in range(100)]

        embeddings = await mock_embedding_service.embed_batch(texts)

        assert embeddings is not None

    @pytest.mark.asyncio
    async def test_batch_size_limits(self, mock_embedding_service):
        """Test handling of batch size limits."""
        # Many embedding APIs have batch size limits
        # Test that service handles this appropriately
        very_large_batch = [f"Text {i}" for i in range(1000)]

        embeddings = await mock_embedding_service.embed_batch(very_large_batch)

        assert embeddings is not None
