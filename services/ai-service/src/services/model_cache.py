"""
Model caching service for AI models
Implements lazy loading and memory-efficient model management
"""

import logging
import threading
from typing import Optional, Dict, Any
from functools import lru_cache
import gc

import torch
from transformers import AutoModel, AutoTokenizer

logger = logging.getLogger(__name__)


class ModelCache:
    """
    Singleton class for managing AI model loading and caching
    Implements lazy loading and memory management
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self._models: Dict[str, Any] = {}
        self._tokenizers: Dict[str, Any] = {}
        self._model_configs: Dict[str, Dict[str, Any]] = {
            'embedding': {
                'model_name': 'sentence-transformers/all-MiniLM-L6-v2',
                'device': 'cuda' if torch.cuda.is_available() else 'cpu',
                'max_seq_length': 256,
            },
            'large_embedding': {
                'model_name': 'sentence-transformers/all-mpnet-base-v2',
                'device': 'cuda' if torch.cuda.is_available() else 'cpu',
                'max_seq_length': 384,
            },
        }
        self._initialized = True
        logger.info("ModelCache initialized")

    def get_model(self, model_type: str) -> tuple[Any, Any]:
        """
        Get or load a model and its tokenizer
        Implements lazy loading - models are only loaded when first requested

        Args:
            model_type: Type of model to load ('embedding', 'large_embedding', etc.)

        Returns:
            Tuple of (model, tokenizer)
        """
        if model_type not in self._model_configs:
            raise ValueError(f"Unknown model type: {model_type}")

        # Check if model is already loaded
        if model_type in self._models:
            logger.debug(f"Using cached {model_type} model")
            return self._models[model_type], self._tokenizers[model_type]

        # Load model lazily
        with self._lock:
            # Double-check after acquiring lock
            if model_type in self._models:
                return self._models[model_type], self._tokenizers[model_type]

            logger.info(f"Loading {model_type} model for the first time...")
            config = self._model_configs[model_type]

            try:
                # Load tokenizer
                tokenizer = AutoTokenizer.from_pretrained(
                    config['model_name'],
                    model_max_length=config.get('max_seq_length', 512),
                )

                # Load model
                model = AutoModel.from_pretrained(
                    config['model_name'],
                    torch_dtype=torch.float16 if config['device'] == 'cuda' else torch.float32,
                )

                # Move to device
                model = model.to(config['device'])

                # Set to eval mode
                model.eval()

                # Enable inference optimizations
                if config['device'] == 'cuda':
                    model = model.half()  # Use FP16 for faster inference
                    torch.backends.cudnn.benchmark = True

                # Cache the model
                self._models[model_type] = model
                self._tokenizers[model_type] = tokenizer

                logger.info(
                    f"Successfully loaded {model_type} model "
                    f"on device: {config['device']}"
                )

                return model, tokenizer

            except Exception as e:
                logger.error(f"Failed to load {model_type} model: {e}")
                raise

    def unload_model(self, model_type: str) -> None:
        """
        Unload a model from memory to free up resources

        Args:
            model_type: Type of model to unload
        """
        with self._lock:
            if model_type in self._models:
                del self._models[model_type]
                del self._tokenizers[model_type]

                # Force garbage collection
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()

                logger.info(f"Unloaded {model_type} model from memory")

    def unload_all_models(self) -> None:
        """Unload all models from memory"""
        with self._lock:
            model_types = list(self._models.keys())
            for model_type in model_types:
                self.unload_model(model_type)

            logger.info("Unloaded all models from memory")

    def get_model_info(self) -> Dict[str, Any]:
        """Get information about loaded models"""
        return {
            'loaded_models': list(self._models.keys()),
            'available_models': list(self._model_configs.keys()),
            'device': 'cuda' if torch.cuda.is_available() else 'cpu',
            'cuda_available': torch.cuda.is_available(),
            'cuda_device_count': torch.cuda.device_count() if torch.cuda.is_available() else 0,
        }


# Global model cache instance
_model_cache = ModelCache()


def get_model_cache() -> ModelCache:
    """Get the global model cache instance"""
    return _model_cache


@lru_cache(maxsize=1000)
def get_cached_embedding(text: str, model_type: str = 'embedding') -> tuple:
    """
    Get cached embedding for a text
    Uses LRU cache to store computed embeddings

    Args:
        text: Input text
        model_type: Type of model to use

    Returns:
        Embedding vector as tuple (for hashability)
    """
    cache = get_model_cache()
    model, tokenizer = cache.get_model(model_type)

    # Tokenize
    inputs = tokenizer(
        text,
        padding=True,
        truncation=True,
        return_tensors='pt',
        max_length=512,
    )

    # Move to same device as model
    device = next(model.parameters()).device
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Generate embedding
    with torch.no_grad():
        outputs = model(**inputs)
        # Use mean pooling
        embeddings = outputs.last_hidden_state.mean(dim=1)

    # Convert to tuple for caching
    return tuple(embeddings.cpu().numpy().flatten().tolist())


def clear_embedding_cache():
    """Clear the embedding cache"""
    get_cached_embedding.cache_clear()
    logger.info("Cleared embedding cache")


def get_cache_stats():
    """Get embedding cache statistics"""
    cache_info = get_cached_embedding.cache_info()
    return {
        'hits': cache_info.hits,
        'misses': cache_info.misses,
        'size': cache_info.currsize,
        'maxsize': cache_info.maxsize,
        'hit_rate': cache_info.hits / (cache_info.hits + cache_info.misses)
        if (cache_info.hits + cache_info.misses) > 0
        else 0,
    }
