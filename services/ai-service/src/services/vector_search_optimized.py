"""
Optimized vector search service
Implements efficient nearest neighbor search with caching
"""

import logging
from typing import List, Dict, Any, Optional
import numpy as np
from functools import lru_cache
import faiss
import pickle
import os

logger = logging.getLogger(__name__)


class OptimizedVectorStore:
    """
    Optimized vector store with FAISS for fast similarity search
    Implements indexing strategies for different use cases
    """

    def __init__(self, dimension: int = 384, index_type: str = 'IVF'):
        """
        Initialize vector store

        Args:
            dimension: Dimension of embedding vectors
            index_type: Type of FAISS index ('Flat', 'IVF', 'HNSW')
        """
        self.dimension = dimension
        self.index_type = index_type
        self.index: Optional[faiss.Index] = None
        self.metadata: List[Dict[str, Any]] = []
        self.is_trained = False

        # Initialize index based on type
        self._initialize_index()

    def _initialize_index(self):
        """Initialize FAISS index based on type"""
        if self.index_type == 'Flat':
            # Exact search (slower but accurate)
            self.index = faiss.IndexFlatL2(self.dimension)
            self.is_trained = True
            logger.info(f"Initialized Flat index with dimension {self.dimension}")

        elif self.index_type == 'IVF':
            # Inverted file index (good balance of speed and accuracy)
            nlist = 100  # Number of clusters
            quantizer = faiss.IndexFlatL2(self.dimension)
            self.index = faiss.IndexIVFFlat(quantizer, self.dimension, nlist)
            logger.info(f"Initialized IVF index with {nlist} clusters")

        elif self.index_type == 'HNSW':
            # Hierarchical Navigable Small World (fastest, approximate)
            self.index = faiss.IndexHNSWFlat(self.dimension, 32)
            self.index.hnsw.efConstruction = 40
            self.index.hnsw.efSearch = 16
            self.is_trained = True
            logger.info("Initialized HNSW index")

        else:
            raise ValueError(f"Unknown index type: {self.index_type}")

        # Use GPU if available
        if faiss.get_num_gpus() > 0:
            logger.info(f"GPU available: {faiss.get_num_gpus()} GPUs")
            # Convert to GPU index for faster search
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)
            logger.info("Moved index to GPU")

    def add_vectors(
        self,
        vectors: np.ndarray,
        metadata: List[Dict[str, Any]],
        train: bool = False,
    ):
        """
        Add vectors to the index

        Args:
            vectors: Array of vectors to add (n_vectors, dimension)
            metadata: List of metadata dicts for each vector
            train: Whether to train the index (required for IVF)
        """
        if vectors.shape[1] != self.dimension:
            raise ValueError(
                f"Vector dimension {vectors.shape[1]} does not match "
                f"index dimension {self.dimension}"
            )

        # Ensure float32 format
        vectors = vectors.astype('float32')

        # Train index if needed
        if not self.is_trained and train:
            logger.info(f"Training index with {len(vectors)} vectors...")
            self.index.train(vectors)
            self.is_trained = True
            logger.info("Index training complete")

        # Add vectors
        self.index.add(vectors)
        self.metadata.extend(metadata)

        logger.info(
            f"Added {len(vectors)} vectors. "
            f"Total vectors in index: {self.index.ntotal}"
        )

    @lru_cache(maxsize=1000)
    def _cached_search(
        self,
        query_vector_tuple: tuple,
        k: int,
    ) -> tuple:
        """
        Cached search implementation
        Uses tuple for hashability in LRU cache

        Args:
            query_vector_tuple: Query vector as tuple
            k: Number of nearest neighbors

        Returns:
            Tuple of (distances, indices)
        """
        # Convert tuple back to numpy array
        query_vector = np.array([list(query_vector_tuple)], dtype='float32')

        # Search
        distances, indices = self.index.search(query_vector, k)

        # Convert to tuples for caching
        return (tuple(distances[0].tolist()), tuple(indices[0].tolist()))

    def search(
        self,
        query_vector: np.ndarray,
        k: int = 10,
        use_cache: bool = True,
    ) -> List[Dict[str, Any]]:
        """
        Search for k nearest neighbors

        Args:
            query_vector: Query vector (dimension,)
            k: Number of nearest neighbors to return
            use_cache: Whether to use cached results

        Returns:
            List of results with metadata and distances
        """
        # Normalize k to index size
        k = min(k, self.index.ntotal)

        if k == 0:
            return []

        # Use cache if enabled
        if use_cache:
            query_tuple = tuple(query_vector.tolist())
            distances_tuple, indices_tuple = self._cached_search(query_tuple, k)
            distances = np.array([list(distances_tuple)])
            indices = np.array([list(indices_tuple)])
        else:
            # Direct search without cache
            query_vector = query_vector.reshape(1, -1).astype('float32')
            distances, indices = self.index.search(query_vector, k)

        # Build results
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(self.metadata):
                continue

            result = {
                'rank': i + 1,
                'distance': float(distance),
                'similarity': float(1 / (1 + distance)),  # Convert distance to similarity
                'metadata': self.metadata[int(idx)],
            }
            results.append(result)

        return results

    def batch_search(
        self,
        query_vectors: np.ndarray,
        k: int = 10,
    ) -> List[List[Dict[str, Any]]]:
        """
        Batch search for multiple queries (more efficient)

        Args:
            query_vectors: Array of query vectors (n_queries, dimension)
            k: Number of nearest neighbors per query

        Returns:
            List of result lists
        """
        k = min(k, self.index.ntotal)
        if k == 0:
            return [[]] * len(query_vectors)

        # Ensure float32 format
        query_vectors = query_vectors.astype('float32')

        # Batch search
        distances, indices = self.index.search(query_vectors, k)

        # Build results for each query
        all_results = []
        for query_distances, query_indices in zip(distances, indices):
            results = []
            for i, (distance, idx) in enumerate(zip(query_distances, query_indices)):
                if idx < 0 or idx >= len(self.metadata):
                    continue

                result = {
                    'rank': i + 1,
                    'distance': float(distance),
                    'similarity': float(1 / (1 + distance)),
                    'metadata': self.metadata[int(idx)],
                }
                results.append(result)

            all_results.append(results)

        return all_results

    def save(self, filepath: str):
        """Save index and metadata to disk"""
        # Save FAISS index
        index_path = f"{filepath}.index"
        faiss.write_index(faiss.index_gpu_to_cpu(self.index), index_path)

        # Save metadata
        metadata_path = f"{filepath}.metadata"
        with open(metadata_path, 'wb') as f:
            pickle.dump(
                {
                    'metadata': self.metadata,
                    'dimension': self.dimension,
                    'index_type': self.index_type,
                    'is_trained': self.is_trained,
                },
                f,
            )

        logger.info(f"Saved index to {filepath}")

    def load(self, filepath: str):
        """Load index and metadata from disk"""
        # Load FAISS index
        index_path = f"{filepath}.index"
        if not os.path.exists(index_path):
            raise FileNotFoundError(f"Index file not found: {index_path}")

        self.index = faiss.read_index(index_path)

        # Move to GPU if available
        if faiss.get_num_gpus() > 0:
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, self.index)

        # Load metadata
        metadata_path = f"{filepath}.metadata"
        with open(metadata_path, 'rb') as f:
            data = pickle.load(f)
            self.metadata = data['metadata']
            self.dimension = data['dimension']
            self.index_type = data['index_type']
            self.is_trained = data['is_trained']

        logger.info(
            f"Loaded index from {filepath}. "
            f"Total vectors: {self.index.ntotal}"
        )

    def clear_cache(self):
        """Clear search cache"""
        self._cached_search.cache_clear()
        logger.info("Cleared search cache")

    def get_cache_stats(self):
        """Get cache statistics"""
        cache_info = self._cached_search.cache_info()
        return {
            'hits': cache_info.hits,
            'misses': cache_info.misses,
            'size': cache_info.currsize,
            'maxsize': cache_info.maxsize,
            'hit_rate': cache_info.hits / (cache_info.hits + cache_info.misses)
            if (cache_info.hits + cache_info.misses) > 0
            else 0,
        }

    def get_stats(self):
        """Get index statistics"""
        return {
            'total_vectors': self.index.ntotal,
            'dimension': self.dimension,
            'index_type': self.index_type,
            'is_trained': self.is_trained,
            'cache_stats': self.get_cache_stats(),
        }
