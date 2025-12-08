"""
Prometheus Metrics Middleware for AI Service
Provides automatic HTTP metrics collection and custom business metrics
"""

import time
from typing import Callable
from functools import wraps
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
)
from fastapi import Request, Response
from fastapi.responses import Response as FastAPIResponse
import os

# Create a custom registry
REGISTRY = CollectorRegistry()

# Service information
SERVICE_NAME = os.getenv('SERVICE_NAME', 'ai-service')
SERVICE_VERSION = os.getenv('SERVICE_VERSION', '1.0.0')
ENVIRONMENT = os.getenv('ENVIRONMENT', 'production')

# Service info metric
service_info = Info(
    'service',
    'Service information',
    registry=REGISTRY,
)
service_info.info({
    'name': SERVICE_NAME,
    'version': SERVICE_VERSION,
    'environment': ENVIRONMENT,
})

# HTTP Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status', 'service'],
    registry=REGISTRY,
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency in seconds',
    ['method', 'endpoint', 'status', 'service'],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registry=REGISTRY,
)

http_requests_in_flight = Gauge(
    'http_requests_in_flight',
    'Number of HTTP requests currently being processed',
    ['method', 'endpoint', 'service'],
    registry=REGISTRY,
)

http_request_size_bytes = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint', 'service'],
    buckets=[100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    registry=REGISTRY,
)

http_response_size_bytes = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint', 'status', 'service'],
    buckets=[100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
    registry=REGISTRY,
)

# AI Service Specific Metrics
ai_model_inference_duration_seconds = Histogram(
    'ai_model_inference_duration_seconds',
    'AI model inference duration in seconds',
    ['model_name', 'model_type', 'service'],
    buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60],
    registry=REGISTRY,
)

ai_model_inference_total = Counter(
    'ai_model_inference_total',
    'Total AI model inferences',
    ['model_name', 'model_type', 'status', 'service'],
    registry=REGISTRY,
)

ai_token_usage_total = Counter(
    'ai_token_usage_total',
    'Total AI tokens used',
    ['model_name', 'token_type', 'service'],
    registry=REGISTRY,
)

ai_cache_hits_total = Counter(
    'ai_cache_hits_total',
    'Total AI cache hits',
    ['cache_type', 'service'],
    registry=REGISTRY,
)

ai_cache_misses_total = Counter(
    'ai_cache_misses_total',
    'Total AI cache misses',
    ['cache_type', 'service'],
    registry=REGISTRY,
)

ai_rate_limit_exceeded_total = Counter(
    'ai_service_rate_limited_total',
    'Total rate limit exceeded events',
    ['service'],
    registry=REGISTRY,
)

ai_vector_search_duration_seconds = Histogram(
    'ai_vector_search_duration_seconds',
    'Vector search duration in seconds',
    ['index_name', 'service'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registry=REGISTRY,
)

ai_vector_search_results = Histogram(
    'ai_vector_search_results',
    'Number of results returned by vector search',
    ['index_name', 'service'],
    buckets=[1, 5, 10, 25, 50, 100, 200],
    registry=REGISTRY,
)

resume_generation_total = Counter(
    'resume_generation_total',
    'Total resume generations',
    ['status', 'service'],
    registry=REGISTRY,
)

resume_generation_duration_seconds = Histogram(
    'resume_generation_duration_seconds',
    'Resume generation duration in seconds',
    ['service'],
    buckets=[1, 2, 5, 10, 20, 30, 60],
    registry=REGISTRY,
)

cover_letter_generation_total = Counter(
    'cover_letter_generation_total',
    'Total cover letter generations',
    ['status', 'service'],
    registry=REGISTRY,
)

cover_letter_generation_duration_seconds = Histogram(
    'cover_letter_generation_duration_seconds',
    'Cover letter generation duration in seconds',
    ['service'],
    buckets=[1, 2, 5, 10, 20, 30],
    registry=REGISTRY,
)


class PrometheusMiddleware:
    """
    FastAPI middleware for Prometheus metrics collection
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            await self.app(scope, receive, send)
            return

        method = scope['method']
        path = scope['path']

        # Skip metrics endpoint itself
        if path == '/metrics':
            await self.app(scope, receive, send)
            return

        # Normalize path (remove IDs and query params)
        endpoint = self._normalize_path(path)

        # Increment in-flight requests
        http_requests_in_flight.labels(
            method=method,
            endpoint=endpoint,
            service=SERVICE_NAME,
        ).inc()

        start_time = time.time()
        status_code = 500  # Default to 500 in case of errors

        async def send_wrapper(message):
            nonlocal status_code
            if message['type'] == 'http.response.start':
                status_code = message['status']
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration = time.time() - start_time

            # Record metrics
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status=status_code,
                service=SERVICE_NAME,
            ).inc()

            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint,
                status=status_code,
                service=SERVICE_NAME,
            ).observe(duration)

            # Decrement in-flight requests
            http_requests_in_flight.labels(
                method=method,
                endpoint=endpoint,
                service=SERVICE_NAME,
            ).dec()

    def _normalize_path(self, path: str) -> str:
        """
        Normalize path to prevent high cardinality
        Remove UUIDs, IDs, and other dynamic parts
        """
        parts = path.split('/')
        normalized = []

        for part in parts:
            if not part:
                continue

            # Replace UUIDs with placeholder
            if len(part) == 36 and part.count('-') == 4:
                normalized.append('{uuid}')
            # Replace numeric IDs with placeholder
            elif part.isdigit():
                normalized.append('{id}')
            else:
                normalized.append(part)

        return '/' + '/'.join(normalized) if normalized else '/'


def track_inference(model_name: str, model_type: str = 'openai'):
    """
    Decorator to track AI model inference metrics
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'

            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'failed'
                raise e
            finally:
                duration = time.time() - start_time

                ai_model_inference_duration_seconds.labels(
                    model_name=model_name,
                    model_type=model_type,
                    service=SERVICE_NAME,
                ).observe(duration)

                ai_model_inference_total.labels(
                    model_name=model_name,
                    model_type=model_type,
                    status=status,
                    service=SERVICE_NAME,
                ).inc()

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            status = 'success'

            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                status = 'failed'
                raise e
            finally:
                duration = time.time() - start_time

                ai_model_inference_duration_seconds.labels(
                    model_name=model_name,
                    model_type=model_type,
                    service=SERVICE_NAME,
                ).observe(duration)

                ai_model_inference_total.labels(
                    model_name=model_name,
                    model_type=model_type,
                    status=status,
                    service=SERVICE_NAME,
                ).inc()

        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def track_vector_search(index_name: str):
    """
    Decorator to track vector search metrics
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = await func(*args, **kwargs)

                # Track number of results
                if isinstance(result, list):
                    ai_vector_search_results.labels(
                        index_name=index_name,
                        service=SERVICE_NAME,
                    ).observe(len(result))

                return result
            finally:
                duration = time.time() - start_time

                ai_vector_search_duration_seconds.labels(
                    index_name=index_name,
                    service=SERVICE_NAME,
                ).observe(duration)

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)

                # Track number of results
                if isinstance(result, list):
                    ai_vector_search_results.labels(
                        index_name=index_name,
                        service=SERVICE_NAME,
                    ).observe(len(result))

                return result
            finally:
                duration = time.time() - start_time

                ai_vector_search_duration_seconds.labels(
                    index_name=index_name,
                    service=SERVICE_NAME,
                ).observe(duration)

        # Return appropriate wrapper based on function type
        import inspect
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def record_token_usage(model_name: str, prompt_tokens: int, completion_tokens: int):
    """
    Record token usage for AI models
    """
    ai_token_usage_total.labels(
        model_name=model_name,
        token_type='prompt',
        service=SERVICE_NAME,
    ).inc(prompt_tokens)

    ai_token_usage_total.labels(
        model_name=model_name,
        token_type='completion',
        service=SERVICE_NAME,
    ).inc(completion_tokens)


def record_cache_hit(cache_type: str):
    """
    Record cache hit
    """
    ai_cache_hits_total.labels(
        cache_type=cache_type,
        service=SERVICE_NAME,
    ).inc()


def record_cache_miss(cache_type: str):
    """
    Record cache miss
    """
    ai_cache_misses_total.labels(
        cache_type=cache_type,
        service=SERVICE_NAME,
    ).inc()


def record_rate_limit():
    """
    Record rate limit exceeded event
    """
    ai_rate_limit_exceeded_total.labels(
        service=SERVICE_NAME,
    ).inc()


def record_resume_generation(status: str, duration: float):
    """
    Record resume generation metrics
    """
    resume_generation_total.labels(
        status=status,
        service=SERVICE_NAME,
    ).inc()

    resume_generation_duration_seconds.labels(
        service=SERVICE_NAME,
    ).observe(duration)


def record_cover_letter_generation(status: str, duration: float):
    """
    Record cover letter generation metrics
    """
    cover_letter_generation_total.labels(
        status=status,
        service=SERVICE_NAME,
    ).inc()

    cover_letter_generation_duration_seconds.labels(
        service=SERVICE_NAME,
    ).observe(duration)


def get_metrics() -> bytes:
    """
    Get Prometheus metrics in text format
    """
    return generate_latest(REGISTRY)


def get_metrics_content_type() -> str:
    """
    Get Prometheus metrics content type
    """
    return CONTENT_TYPE_LATEST
