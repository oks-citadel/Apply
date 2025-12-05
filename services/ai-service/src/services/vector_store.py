"""
Vector store service using Pinecone.
"""

from typing import List, Dict, Any, Optional
import numpy as np
from pinecone import Pinecone, ServerlessSpec
import structlog

from ..config import settings

logger = structlog.get_logger()


class VectorStore:
    """Vector store for similarity search using Pinecone."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        environment: Optional[str] = None,
        index_name: Optional[str] = None,
    ):
        """
        Initialize vector store.

        Args:
            api_key: Pinecone API key
            environment: Pinecone environment
            index_name: Index name
        """
        self.api_key = api_key or settings.pinecone_api_key
        self.environment = environment or settings.pinecone_environment
        self.index_name = index_name or settings.pinecone_index_name
        self.dimension = settings.embedding_dimension

        self.pc: Optional[Pinecone] = None
        self.index: Optional[Any] = None

    async def initialize(self) -> None:
        """Initialize Pinecone connection and index."""
        try:
            # Initialize Pinecone
            self.pc = Pinecone(api_key=self.api_key)

            # Check if index exists
            existing_indexes = self.pc.list_indexes()
            index_names = [idx.name for idx in existing_indexes]

            if self.index_name not in index_names:
                logger.info(f"Creating Pinecone index: {self.index_name}")

                # Create index with serverless spec
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.dimension,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region=self.environment,
                    ),
                )

            # Connect to index
            self.index = self.pc.Index(self.index_name)

            logger.info(
                "Pinecone initialized",
                index_name=self.index_name,
                dimension=self.dimension,
            )

        except Exception as e:
            logger.error(f"Pinecone initialization failed: {e}", exc_info=True)
            raise

    async def close(self) -> None:
        """Close Pinecone connection."""
        # Pinecone doesn't require explicit closing
        logger.info("Vector store closed")

    async def upsert(
        self,
        id: str,
        vector: np.ndarray,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Upsert a vector into the store.

        Args:
            id: Unique identifier
            vector: Embedding vector
            metadata: Optional metadata
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            # Convert numpy array to list
            vector_list = vector.tolist() if isinstance(vector, np.ndarray) else vector

            # Upsert to Pinecone
            self.index.upsert(
                vectors=[
                    {
                        "id": id,
                        "values": vector_list,
                        "metadata": metadata or {},
                    }
                ]
            )

            logger.debug(f"Upserted vector: {id}")

        except Exception as e:
            logger.error(f"Vector upsert failed: {e}", id=id, exc_info=True)
            raise

    async def upsert_batch(
        self,
        vectors: List[tuple[str, np.ndarray, Optional[Dict[str, Any]]]],
        batch_size: int = 100,
    ) -> None:
        """
        Upsert multiple vectors in batches.

        Args:
            vectors: List of (id, vector, metadata) tuples
            batch_size: Batch size for upserts
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            # Process in batches
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i : i + batch_size]

                # Prepare batch data
                batch_data = [
                    {
                        "id": id,
                        "values": (
                            vector.tolist() if isinstance(vector, np.ndarray) else vector
                        ),
                        "metadata": metadata or {},
                    }
                    for id, vector, metadata in batch
                ]

                # Upsert batch
                self.index.upsert(vectors=batch_data)

                logger.info(f"Upserted batch of {len(batch)} vectors")

        except Exception as e:
            logger.error(f"Batch upsert failed: {e}", exc_info=True)
            raise

    async def query(
        self,
        vector: np.ndarray,
        top_k: int = 10,
        filter: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True,
        include_values: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Query for similar vectors.

        Args:
            vector: Query vector
            top_k: Number of results to return
            filter: Metadata filter
            include_metadata: Include metadata in results
            include_values: Include vector values in results

        Returns:
            List of matching results
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            # Convert numpy array to list
            vector_list = vector.tolist() if isinstance(vector, np.ndarray) else vector

            # Query Pinecone
            results = self.index.query(
                vector=vector_list,
                top_k=top_k,
                filter=filter,
                include_metadata=include_metadata,
                include_values=include_values,
            )

            # Format results
            matches = []
            for match in results.matches:
                result = {
                    "id": match.id,
                    "score": match.score,
                }

                if include_metadata and match.metadata:
                    result["metadata"] = match.metadata

                if include_values and match.values:
                    result["values"] = match.values

                matches.append(result)

            logger.info(
                f"Query returned {len(matches)} results",
                top_k=top_k,
                has_filter=filter is not None,
            )

            return matches

        except Exception as e:
            logger.error(f"Vector query failed: {e}", exc_info=True)
            raise

    async def delete(self, ids: List[str]) -> None:
        """
        Delete vectors by IDs.

        Args:
            ids: List of vector IDs to delete
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            self.index.delete(ids=ids)
            logger.info(f"Deleted {len(ids)} vectors")

        except Exception as e:
            logger.error(f"Vector deletion failed: {e}", exc_info=True)
            raise

    async def delete_by_filter(self, filter: Dict[str, Any]) -> None:
        """
        Delete vectors by metadata filter.

        Args:
            filter: Metadata filter
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            self.index.delete(filter=filter)
            logger.info(f"Deleted vectors by filter: {filter}")

        except Exception as e:
            logger.error(f"Vector deletion by filter failed: {e}", exc_info=True)
            raise

    async def fetch(self, ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Fetch vectors by IDs.

        Args:
            ids: List of vector IDs to fetch

        Returns:
            Dictionary of id -> vector data
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            results = self.index.fetch(ids=ids)

            vectors = {}
            for id, vector_data in results.vectors.items():
                vectors[id] = {
                    "id": id,
                    "values": vector_data.values,
                    "metadata": vector_data.metadata,
                }

            logger.debug(f"Fetched {len(vectors)} vectors")

            return vectors

        except Exception as e:
            logger.error(f"Vector fetch failed: {e}", exc_info=True)
            raise

    async def get_stats(self) -> Dict[str, Any]:
        """
        Get index statistics.

        Returns:
            Index statistics
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            stats = self.index.describe_index_stats()

            return {
                "total_vector_count": stats.total_vector_count,
                "dimension": stats.dimension,
                "index_fullness": stats.index_fullness,
                "namespaces": stats.namespaces,
            }

        except Exception as e:
            logger.error(f"Failed to get stats: {e}", exc_info=True)
            raise

    async def update_metadata(
        self,
        id: str,
        metadata: Dict[str, Any],
    ) -> None:
        """
        Update metadata for a vector.

        Args:
            id: Vector ID
            metadata: New metadata
        """
        if not self.index:
            raise RuntimeError("Vector store not initialized")

        try:
            self.index.update(
                id=id,
                set_metadata=metadata,
            )

            logger.debug(f"Updated metadata for vector: {id}")

        except Exception as e:
            logger.error(f"Metadata update failed: {e}", id=id, exc_info=True)
            raise
