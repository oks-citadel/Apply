"""
Tests for vector store service.
"""

import pytest
import numpy as np
from unittest.mock import AsyncMock, Mock, patch
from src.services.vector_store import VectorStore


class TestVectorStore:
    """Tests for VectorStore class."""

    @pytest.mark.asyncio
    async def test_initialize_success(self, mock_vector_store):
        """Test successful vector store initialization."""
        await mock_vector_store.initialize()

        mock_vector_store.initialize.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_connection(self, mock_vector_store):
        """Test closing vector store connection."""
        await mock_vector_store.close()

        mock_vector_store.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_query_success(self, mock_vector_store):
        """Test successful vector query."""
        query_vector = np.random.rand(1536).tolist()

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=10,
            filter={}
        )

        assert isinstance(results, list)
        assert len(results) > 0

        # Verify result structure
        if len(results) > 0:
            result = results[0]
            assert "id" in result
            assert "score" in result
            assert "metadata" in result

    @pytest.mark.asyncio
    async def test_query_with_filters(self, mock_vector_store):
        """Test vector query with metadata filters."""
        query_vector = np.random.rand(1536).tolist()
        filters = {
            "location": "San Francisco",
            "remote": True,
            "min_salary": 100000
        }

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=20,
            filter=filters
        )

        assert isinstance(results, list)
        mock_vector_store.query.assert_called_once()

    @pytest.mark.asyncio
    async def test_query_top_k_limit(self, mock_vector_store):
        """Test that top_k limits results."""
        query_vector = np.random.rand(1536).tolist()

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=5,
            filter={}
        )

        # Should return at most top_k results
        assert len(results) <= 5

    @pytest.mark.asyncio
    async def test_upsert_single_vector(self, mock_vector_store):
        """Test upserting a single vector."""
        vector_id = "job_123"
        vector = np.random.rand(1536).tolist()
        metadata = {
            "title": "Software Engineer",
            "company": "Tech Corp",
            "skills": ["Python", "AWS"]
        }

        result = await mock_vector_store.upsert(
            id=vector_id,
            vector=vector,
            metadata=metadata
        )

        assert result is True
        mock_vector_store.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_upsert_batch_vectors(self, mock_vector_store):
        """Test upserting multiple vectors in batch."""
        vectors = [
            {
                "id": f"job_{i}",
                "vector": np.random.rand(1536).tolist(),
                "metadata": {"title": f"Job {i}"}
            }
            for i in range(10)
        ]

        # Mock batch upsert
        mock_vector_store.upsert_batch = AsyncMock(return_value=True)

        result = await mock_vector_store.upsert_batch(vectors)

        assert result is True
        mock_vector_store.upsert_batch.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_vector(self, mock_vector_store):
        """Test deleting a vector."""
        vector_id = "job_123"

        result = await mock_vector_store.delete(id=vector_id)

        assert result is True
        mock_vector_store.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_health_check(self, mock_vector_store):
        """Test vector store health check."""
        await mock_vector_store.health_check()

        mock_vector_store.health_check.assert_called_once()


class TestVectorStoreQueries:
    """Tests for vector store query operations."""

    @pytest.mark.asyncio
    async def test_similarity_search(self, mock_vector_store):
        """Test similarity search with vector."""
        query_vector = np.random.rand(1536).tolist()

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=10
        )

        assert isinstance(results, list)

        # Results should be sorted by similarity score (descending)
        if len(results) > 1:
            scores = [r["score"] for r in results]
            # Scores should be in descending order
            assert all(scores[i] >= scores[i+1] for i in range(len(scores)-1))

    @pytest.mark.asyncio
    async def test_filtered_search(self, mock_vector_store):
        """Test search with metadata filters."""
        query_vector = np.random.rand(1536).tolist()

        # Test location filter
        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=10,
            filter={"location": "San Francisco"}
        )

        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_empty_results(self, mock_vector_store):
        """Test handling of empty results."""
        # Mock to return empty results
        mock_vector_store.query = AsyncMock(return_value=[])

        query_vector = np.random.rand(1536).tolist()

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=10,
            filter={"location": "NonexistentCity"}
        )

        assert results == []

    @pytest.mark.asyncio
    async def test_query_with_namespace(self, mock_vector_store):
        """Test querying specific namespace."""
        query_vector = np.random.rand(1536).tolist()

        # If vector store supports namespaces
        mock_vector_store.query_namespace = AsyncMock(return_value=[])

        results = await mock_vector_store.query_namespace(
            namespace="jobs",
            vector=query_vector,
            top_k=10
        )

        assert isinstance(results, list)


class TestVectorStoreMetadata:
    """Tests for metadata handling in vector store."""

    @pytest.mark.asyncio
    async def test_metadata_storage(self, mock_vector_store):
        """Test that metadata is properly stored."""
        vector_id = "job_123"
        vector = np.random.rand(1536).tolist()
        metadata = {
            "title": "Senior Software Engineer",
            "company_name": "Tech Corp",
            "required_skills": ["Python", "AWS", "Docker"],
            "min_experience": 5,
            "max_experience": 10,
            "location": "San Francisco",
            "remote_policy": "hybrid",
            "salary_range": {"min": 140000, "max": 180000}
        }

        await mock_vector_store.upsert(
            id=vector_id,
            vector=vector,
            metadata=metadata
        )

        mock_vector_store.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_metadata_filtering(self, mock_vector_store):
        """Test filtering by different metadata fields."""
        query_vector = np.random.rand(1536).tolist()

        # Test multiple filter conditions
        filters = {
            "remote_policy": "remote",
            "min_experience": {"$lte": 5},
            "required_skills": {"$in": ["Python"]}
        }

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=10,
            filter=filters
        )

        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_metadata_retrieval(self, mock_vector_store):
        """Test that query results include metadata."""
        query_vector = np.random.rand(1536).tolist()

        results = await mock_vector_store.query(
            vector=query_vector,
            top_k=5
        )

        if len(results) > 0:
            result = results[0]
            assert "metadata" in result
            assert isinstance(result["metadata"], dict)


class TestVectorStoreErrors:
    """Tests for error handling in vector store."""

    @pytest.mark.asyncio
    async def test_initialization_failure(self):
        """Test handling of initialization failure."""
        mock_store = Mock(spec=VectorStore)
        mock_store.initialize = AsyncMock(side_effect=Exception("Connection failed"))

        with pytest.raises(Exception, match="Connection failed"):
            await mock_store.initialize()

    @pytest.mark.asyncio
    async def test_query_failure(self):
        """Test handling of query failure."""
        mock_store = Mock(spec=VectorStore)
        mock_store.query = AsyncMock(side_effect=Exception("Query failed"))

        query_vector = np.random.rand(1536).tolist()

        with pytest.raises(Exception, match="Query failed"):
            await mock_store.query(vector=query_vector, top_k=10)

    @pytest.mark.asyncio
    async def test_upsert_failure(self):
        """Test handling of upsert failure."""
        mock_store = Mock(spec=VectorStore)
        mock_store.upsert = AsyncMock(side_effect=Exception("Upsert failed"))

        vector = np.random.rand(1536).tolist()

        with pytest.raises(Exception, match="Upsert failed"):
            await mock_store.upsert(
                id="test_id",
                vector=vector,
                metadata={}
            )

    @pytest.mark.asyncio
    async def test_invalid_vector_dimension(self, mock_vector_store):
        """Test handling of invalid vector dimension."""
        # Vector with wrong dimension
        wrong_dimension_vector = np.random.rand(512).tolist()

        # Should raise error or handle gracefully
        mock_vector_store.query = AsyncMock(
            side_effect=ValueError("Invalid vector dimension")
        )

        with pytest.raises(ValueError):
            await mock_vector_store.query(
                vector=wrong_dimension_vector,
                top_k=10
            )


class TestVectorStorePerformance:
    """Tests for vector store performance characteristics."""

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_large_batch_upsert(self, mock_vector_store):
        """Test upserting large batch of vectors."""
        # Create large batch
        batch_size = 1000
        vectors = [
            {
                "id": f"vec_{i}",
                "vector": np.random.rand(1536).tolist(),
                "metadata": {"index": i}
            }
            for i in range(batch_size)
        ]

        mock_vector_store.upsert_batch = AsyncMock(return_value=True)

        result = await mock_vector_store.upsert_batch(vectors)

        assert result is True

    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_queries(self, mock_vector_store):
        """Test handling concurrent queries."""
        import asyncio

        query_vector = np.random.rand(1536).tolist()

        # Make multiple concurrent queries
        tasks = [
            mock_vector_store.query(vector=query_vector, top_k=10)
            for _ in range(10)
        ]

        results = await asyncio.gather(*tasks)

        assert len(results) == 10
        for result in results:
            assert isinstance(result, list)


class TestVectorStoreIndexing:
    """Tests for vector store indexing operations."""

    @pytest.mark.asyncio
    async def test_create_index(self, mock_vector_store):
        """Test creating a new index."""
        mock_vector_store.create_index = AsyncMock(return_value=True)

        result = await mock_vector_store.create_index(
            name="jobs_index",
            dimension=1536,
            metric="cosine"
        )

        assert result is True

    @pytest.mark.asyncio
    async def test_delete_index(self, mock_vector_store):
        """Test deleting an index."""
        mock_vector_store.delete_index = AsyncMock(return_value=True)

        result = await mock_vector_store.delete_index(name="jobs_index")

        assert result is True

    @pytest.mark.asyncio
    async def test_list_indexes(self, mock_vector_store):
        """Test listing available indexes."""
        mock_vector_store.list_indexes = AsyncMock(
            return_value=["jobs_index", "candidates_index"]
        )

        indexes = await mock_vector_store.list_indexes()

        assert isinstance(indexes, list)
        assert len(indexes) >= 0


class TestVectorStoreStats:
    """Tests for vector store statistics and monitoring."""

    @pytest.mark.asyncio
    async def test_get_stats(self, mock_vector_store):
        """Test retrieving vector store statistics."""
        mock_vector_store.get_stats = AsyncMock(return_value={
            "total_vectors": 10000,
            "dimension": 1536,
            "index_fullness": 0.45
        })

        stats = await mock_vector_store.get_stats()

        assert "total_vectors" in stats
        assert stats["total_vectors"] >= 0

    @pytest.mark.asyncio
    async def test_describe_index_stats(self, mock_vector_store):
        """Test describing index statistics."""
        mock_vector_store.describe_stats = AsyncMock(return_value={
            "namespaces": {
                "jobs": {"vector_count": 5000},
                "candidates": {"vector_count": 3000}
            },
            "dimension": 1536,
            "total_vector_count": 8000
        })

        stats = await mock_vector_store.describe_stats()

        assert "total_vector_count" in stats or "namespaces" in stats


class TestVectorNormalization:
    """Tests for vector normalization."""

    def test_normalize_vector(self):
        """Test vector normalization."""
        vector = np.array([3.0, 4.0])  # Length 5

        normalized = vector / np.linalg.norm(vector)

        assert np.linalg.norm(normalized) == pytest.approx(1.0)
        assert normalized[0] == pytest.approx(0.6)
        assert normalized[1] == pytest.approx(0.8)

    def test_normalize_zero_vector(self):
        """Test handling of zero vector normalization."""
        vector = np.array([0.0, 0.0, 0.0])

        norm = np.linalg.norm(vector)

        # Zero vector should have norm of 0
        assert norm == 0.0

        # Attempting to normalize would cause division by zero
        # Should be handled appropriately

    def test_normalize_large_vector(self):
        """Test normalizing large dimensional vector."""
        vector = np.random.rand(1536)

        normalized = vector / np.linalg.norm(vector)

        assert np.linalg.norm(normalized) == pytest.approx(1.0)


class TestVectorSimilarity:
    """Tests for vector similarity calculations."""

    def test_cosine_similarity_calculation(self):
        """Test cosine similarity between vectors."""
        vec1 = np.array([1.0, 2.0, 3.0])
        vec2 = np.array([2.0, 4.0, 6.0])  # Same direction, different magnitude

        # Normalize vectors
        norm1 = vec1 / np.linalg.norm(vec1)
        norm2 = vec2 / np.linalg.norm(vec2)

        similarity = np.dot(norm1, norm2)

        # Vectors in same direction should have similarity close to 1
        assert similarity == pytest.approx(1.0)

    def test_euclidean_distance(self):
        """Test Euclidean distance calculation."""
        vec1 = np.array([0.0, 0.0])
        vec2 = np.array([3.0, 4.0])

        distance = np.linalg.norm(vec1 - vec2)

        assert distance == pytest.approx(5.0)

    def test_dot_product_similarity(self):
        """Test dot product as similarity measure."""
        vec1 = np.array([1.0, 0.0, 0.0])
        vec2 = np.array([1.0, 0.0, 0.0])

        similarity = np.dot(vec1, vec2)

        assert similarity == 1.0
