"""
Embedding service for generating vector embeddings.
"""

from typing import List, Optional
import numpy as np
import hashlib
import json
from openai import AsyncOpenAI
import redis.asyncio as redis
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

from ..config import settings

logger = structlog.get_logger()


class EmbeddingService:
    """Service for generating and caching text embeddings."""

    def __init__(
        self,
        openai_client: Optional[AsyncOpenAI] = None,
        redis_client: Optional[redis.Redis] = None,
    ):
        """
        Initialize embedding service.

        Args:
            openai_client: OpenAI client instance
            redis_client: Redis client for caching
        """
        self._disabled = False

        # Check if API key is valid (not placeholder or empty)
        api_key = settings.openai_api_key
        if not api_key or api_key in ("", "placeholder", "placeholder-configure-in-secrets"):
            logger.warning(
                "OpenAI API key not configured - Embedding Service running in disabled mode. "
                "Set OPENAI_API_KEY environment variable to enable embedding features."
            )
            self._disabled = True
            self.openai_client = None
        else:
            self.openai_client = openai_client or AsyncOpenAI(api_key=api_key)

        self.redis_client = redis_client
        self.model = settings.embedding_model
        self.dimension = settings.embedding_dimension
        self.cache_ttl = settings.cache_ttl

    async def initialize(self) -> None:
        """Initialize Redis connection."""
        if not self.redis_client:
            try:
                self.redis_client = await redis.from_url(
                    settings.redis_url,
                    encoding="utf-8",
                    decode_responses=False,
                )
                logger.info("Redis connected for embedding cache")
            except Exception as e:
                logger.warning(f"Redis connection failed, caching disabled: {e}")
                self.redis_client = None

    async def close(self) -> None:
        """Close Redis connection."""
        if self.redis_client:
            await self.redis_client.close()

    def _generate_cache_key(self, text: str) -> str:
        """
        Generate cache key for text.

        Args:
            text: Input text

        Returns:
            Cache key
        """
        # Use hash of text and model as cache key
        text_hash = hashlib.sha256(text.encode()).hexdigest()
        return f"embedding:{self.model}:{text_hash}"

    async def _get_from_cache(self, text: str) -> Optional[np.ndarray]:
        """
        Get embedding from cache.

        Args:
            text: Input text

        Returns:
            Cached embedding or None
        """
        if not self.redis_client:
            return None

        try:
            cache_key = self._generate_cache_key(text)
            cached = await self.redis_client.get(cache_key)

            if cached:
                # Deserialize numpy array
                embedding_list = json.loads(cached)
                logger.debug(f"Cache hit for embedding: {cache_key}")
                return np.array(embedding_list, dtype=np.float32)

        except Exception as e:
            logger.warning(f"Cache get failed: {e}")

        return None

    async def _save_to_cache(self, text: str, embedding: np.ndarray) -> None:
        """
        Save embedding to cache.

        Args:
            text: Input text
            embedding: Generated embedding
        """
        if not self.redis_client:
            return

        try:
            cache_key = self._generate_cache_key(text)
            # Serialize numpy array
            embedding_json = json.dumps(embedding.tolist())
            await self.redis_client.setex(cache_key, self.cache_ttl, embedding_json)
            logger.debug(f"Cached embedding: {cache_key}")

        except Exception as e:
            logger.warning(f"Cache save failed: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def _generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding using OpenAI API.

        Args:
            text: Input text

        Returns:
            Embedding vector

        Raises:
            Exception: If API call fails after retries
        """
        if self._disabled or not self.openai_client:
            raise RuntimeError("Embedding service is disabled - no valid OpenAI API key configured")

        try:
            # Clean and truncate text
            text = text.strip()
            if not text:
                raise ValueError("Empty text provided for embedding")

            # Generate embedding
            response = await self.openai_client.embeddings.create(
                model=self.model,
                input=text,
            )

            embedding = np.array(response.data[0].embedding, dtype=np.float32)

            logger.info(
                "Embedding generated",
                model=self.model,
                text_length=len(text),
                dimension=len(embedding),
            )

            return embedding

        except Exception as e:
            logger.error(f"Embedding generation failed: {e}", exc_info=True)
            raise

    async def embed(self, text: str, use_cache: bool = True) -> np.ndarray:
        """
        Generate embedding for text.

        Args:
            text: Input text
            use_cache: Whether to use caching

        Returns:
            Embedding vector
        """
        if self._disabled:
            raise RuntimeError("Embedding service is disabled - no valid OpenAI API key configured")

        # Check cache first
        if use_cache:
            cached_embedding = await self._get_from_cache(text)
            if cached_embedding is not None:
                return cached_embedding

        # Generate new embedding
        embedding = await self._generate_embedding(text)

        # Save to cache
        if use_cache:
            await self._save_to_cache(text, embedding)

        return embedding

    async def embed_batch(
        self,
        texts: List[str],
        use_cache: bool = True,
        batch_size: int = 100,
    ) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of input texts
            use_cache: Whether to use caching
            batch_size: Maximum batch size for API calls

        Returns:
            List of embedding vectors
        """
        if self._disabled or not self.openai_client:
            raise RuntimeError("Embedding service is disabled - no valid OpenAI API key configured")

        embeddings: List[np.ndarray] = []

        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            # Check cache for each text
            batch_embeddings: List[Optional[np.ndarray]] = []
            texts_to_generate: List[tuple[int, str]] = []

            if use_cache:
                for idx, text in enumerate(batch):
                    cached = await self._get_from_cache(text)
                    if cached is not None:
                        batch_embeddings.append(cached)
                    else:
                        batch_embeddings.append(None)
                        texts_to_generate.append((idx, text))
            else:
                batch_embeddings = [None] * len(batch)
                texts_to_generate = list(enumerate(batch))

            # Generate embeddings for uncached texts
            if texts_to_generate:
                try:
                    # Call OpenAI API with batch
                    response = await self.openai_client.embeddings.create(
                        model=self.model,
                        input=[text for _, text in texts_to_generate],
                    )

                    # Update batch with generated embeddings
                    for (idx, text), embedding_data in zip(texts_to_generate, response.data):
                        embedding = np.array(embedding_data.embedding, dtype=np.float32)
                        batch_embeddings[idx] = embedding

                        # Cache the embedding
                        if use_cache:
                            await self._save_to_cache(text, embedding)

                    logger.info(
                        f"Generated {len(texts_to_generate)} embeddings in batch",
                        batch_size=len(texts_to_generate),
                    )

                except Exception as e:
                    logger.error(f"Batch embedding generation failed: {e}")
                    # Fallback to individual generation
                    for idx, text in texts_to_generate:
                        try:
                            embedding = await self.embed(text, use_cache)
                            batch_embeddings[idx] = embedding
                        except Exception as individual_error:
                            logger.error(
                                f"Individual embedding failed: {individual_error}",
                                text_preview=text[:100],
                            )
                            # Use zero vector as fallback
                            batch_embeddings[idx] = np.zeros(self.dimension, dtype=np.float32)

            # Add to results (filter out None values)
            embeddings.extend([e for e in batch_embeddings if e is not None])

        return embeddings

    async def compute_similarity(
        self,
        embedding1: np.ndarray,
        embedding2: np.ndarray,
    ) -> float:
        """
        Compute cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector

        Returns:
            Cosine similarity score (0-1)
        """
        # Normalize vectors
        norm1 = np.linalg.norm(embedding1)
        norm2 = np.linalg.norm(embedding2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        # Compute cosine similarity
        similarity = np.dot(embedding1, embedding2) / (norm1 * norm2)

        # Clamp to [0, 1] range
        similarity = float(np.clip(similarity, 0.0, 1.0))

        return similarity

    async def find_similar(
        self,
        query_embedding: np.ndarray,
        candidate_embeddings: List[np.ndarray],
        top_k: int = 10,
    ) -> List[tuple[int, float]]:
        """
        Find most similar embeddings to query.

        Args:
            query_embedding: Query embedding vector
            candidate_embeddings: List of candidate embeddings
            top_k: Number of results to return

        Returns:
            List of (index, similarity_score) tuples, sorted by similarity
        """
        similarities: List[tuple[int, float]] = []

        for idx, candidate in enumerate(candidate_embeddings):
            similarity = await self.compute_similarity(query_embedding, candidate)
            similarities.append((idx, similarity))

        # Sort by similarity (descending) and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)

        return similarities[:top_k]
