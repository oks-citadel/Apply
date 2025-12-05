"""
OpenTelemetry telemetry module for AI Service (Python FastAPI)

This module provides distributed tracing capabilities using OpenTelemetry
with Azure Application Insights integration for the Python-based AI service.
"""

import os
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps
from contextlib import contextmanager

from opentelemetry import trace, context, propagate
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION, DEPLOYMENT_ENVIRONMENT
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.trace import Status, StatusCode, Span
from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
from azure.monitor.opentelemetry.exporter import AzureMonitorTraceExporter

logger = logging.getLogger(__name__)

# Global tracer instance
_tracer: Optional[trace.Tracer] = None
_is_initialized = False


class TelemetryConfig:
    """Configuration for telemetry initialization."""

    def __init__(
        self,
        service_name: str,
        service_version: str = "1.0.0",
        environment: Optional[str] = None,
        azure_monitor_connection_string: Optional[str] = None,
        enable_console_export: bool = False,
        sample_rate: float = 1.0,
        custom_attributes: Optional[Dict[str, Any]] = None,
    ):
        self.service_name = service_name
        self.service_version = service_version
        self.environment = environment or os.getenv("ENVIRONMENT", "development")
        self.azure_monitor_connection_string = (
            azure_monitor_connection_string
            or os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
        )
        self.enable_console_export = enable_console_export
        self.sample_rate = sample_rate
        self.custom_attributes = custom_attributes or {}


def init_telemetry(config: TelemetryConfig) -> None:
    """
    Initialize OpenTelemetry with Azure Monitor exporter.

    This function should be called BEFORE creating the FastAPI application
    to ensure proper instrumentation.

    Args:
        config: Telemetry configuration

    Example:
        >>> from app.telemetry import init_telemetry, TelemetryConfig
        >>> config = TelemetryConfig(
        ...     service_name="ai-service",
        ...     service_version="1.0.0",
        ...     environment="production"
        ... )
        >>> init_telemetry(config)
    """
    global _tracer, _is_initialized

    if _is_initialized:
        logger.warning("[Telemetry] Already initialized, skipping...")
        return

    try:
        # Create resource with service information
        resource_attributes = {
            SERVICE_NAME: config.service_name,
            SERVICE_VERSION: config.service_version,
            DEPLOYMENT_ENVIRONMENT: config.environment,
            **config.custom_attributes,
        }
        resource = Resource.create(resource_attributes)

        # Create tracer provider
        tracer_provider = TracerProvider(resource=resource)

        # Add Azure Monitor exporter if connection string is provided
        if config.azure_monitor_connection_string:
            azure_exporter = AzureMonitorTraceExporter(
                connection_string=config.azure_monitor_connection_string
            )
            tracer_provider.add_span_processor(BatchSpanProcessor(azure_exporter))
            logger.info("[Telemetry] Azure Monitor exporter configured")
        else:
            logger.warning(
                "[Telemetry] Azure Monitor connection string not provided, "
                "skipping Azure exporter"
            )

        # Set global tracer provider
        trace.set_tracer_provider(tracer_provider)

        # Configure trace context propagation (W3C Trace Context)
        propagate.set_global_textmap(TraceContextTextMapPropagator())

        # Get tracer instance
        _tracer = trace.get_tracer(config.service_name, config.service_version)

        # Instrument common libraries
        HTTPXClientInstrumentor().instrument()
        LoggingInstrumentor().instrument(set_logging_format=True)

        _is_initialized = True

        logger.info(
            f"[Telemetry] Initialized for service: {config.service_name} "
            f"({config.environment})"
        )
        logger.info(f"[Telemetry] Tracing enabled with sample rate: {config.sample_rate}")

    except Exception as e:
        logger.error(f"[Telemetry] Failed to initialize: {e}", exc_info=True)
        raise


def instrument_fastapi(app) -> None:
    """
    Instrument FastAPI application with OpenTelemetry.

    Args:
        app: FastAPI application instance

    Example:
        >>> from fastapi import FastAPI
        >>> from app.telemetry import instrument_fastapi
        >>> app = FastAPI()
        >>> instrument_fastapi(app)
    """
    try:
        FastAPIInstrumentor.instrument_app(app)
        logger.info("[Telemetry] FastAPI instrumented successfully")
    except Exception as e:
        logger.error(f"[Telemetry] Failed to instrument FastAPI: {e}", exc_info=True)


def get_tracer() -> trace.Tracer:
    """
    Get the current tracer instance.

    Returns:
        Tracer instance

    Raises:
        RuntimeError: If telemetry is not initialized
    """
    global _tracer

    if not _is_initialized or _tracer is None:
        raise RuntimeError("Telemetry not initialized. Call init_telemetry() first.")

    return _tracer


def get_current_span() -> Optional[Span]:
    """
    Get the current active span.

    Returns:
        Current active span or None
    """
    return trace.get_current_span()


@contextmanager
def create_span(
    name: str,
    kind: trace.SpanKind = trace.SpanKind.INTERNAL,
    attributes: Optional[Dict[str, Any]] = None,
):
    """
    Context manager to create and manage a span.

    Args:
        name: Span name
        kind: Span kind (INTERNAL, CLIENT, SERVER, PRODUCER, CONSUMER)
        attributes: Initial span attributes

    Example:
        >>> with create_span("process_resume", attributes={"user.id": "123"}):
        ...     # Your code here
        ...     pass
    """
    tracer = get_tracer()
    with tracer.start_as_current_span(name, kind=kind, attributes=attributes or {}) as span:
        try:
            yield span
            span.set_status(Status(StatusCode.OK))
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise


def trace_function(
    name: Optional[str] = None,
    kind: trace.SpanKind = trace.SpanKind.INTERNAL,
    attributes: Optional[Dict[str, Any]] = None,
    record_args: bool = False,
    record_result: bool = False,
):
    """
    Decorator to automatically trace function execution.

    Args:
        name: Custom span name (defaults to function name)
        kind: Span kind
        attributes: Static attributes to add to the span
        record_args: Whether to record function arguments
        record_result: Whether to record return value

    Example:
        >>> @trace_function(name="analyze_resume", attributes={"service": "ai"})
        ... async def analyze_resume(resume_text: str):
        ...     # Analysis logic
        ...     return analysis_result
    """

    def decorator(func: Callable) -> Callable:
        span_name = name or f"{func.__module__}.{func.__name__}"

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            tracer = get_tracer()
            span_attributes = attributes.copy() if attributes else {}

            # Record arguments if enabled
            if record_args:
                try:
                    span_attributes["function.args"] = str(args)
                    span_attributes["function.kwargs"] = str(kwargs)
                except Exception:
                    pass

            with tracer.start_as_current_span(
                span_name, kind=kind, attributes=span_attributes
            ) as span:
                try:
                    result = await func(*args, **kwargs)

                    # Record result if enabled
                    if record_result and result is not None:
                        try:
                            span.set_attribute("function.result", str(result))
                        except Exception:
                            pass

                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            tracer = get_tracer()
            span_attributes = attributes.copy() if attributes else {}

            if record_args:
                try:
                    span_attributes["function.args"] = str(args)
                    span_attributes["function.kwargs"] = str(kwargs)
                except Exception:
                    pass

            with tracer.start_as_current_span(
                span_name, kind=kind, attributes=span_attributes
            ) as span:
                try:
                    result = func(*args, **kwargs)

                    if record_result and result is not None:
                        try:
                            span.set_attribute("function.result", str(result))
                        except Exception:
                            pass

                    span.set_status(Status(StatusCode.OK))
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(Status(StatusCode.ERROR, str(e)))
                    raise

        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


def add_span_attributes(attributes: Dict[str, Any]) -> None:
    """
    Add attributes to the current active span.

    Args:
        attributes: Key-value pairs to add as attributes

    Example:
        >>> add_span_attributes({
        ...     "user.id": "123",
        ...     "tenant.id": "456"
        ... })
    """
    span = get_current_span()
    if span and span.is_recording():
        for key, value in attributes.items():
            span.set_attribute(key, value)


def add_user_context(user_id: str, email: Optional[str] = None, role: Optional[str] = None) -> None:
    """
    Add user context to the current span.

    Args:
        user_id: User ID
        email: User email (optional)
        role: User role (optional)

    Example:
        >>> add_user_context("user-123", "user@example.com", "admin")
    """
    attributes = {"user.id": user_id}

    if email:
        attributes["user.email"] = email

    if role:
        attributes["user.role"] = role

    add_span_attributes(attributes)


def add_tenant_context(tenant_id: str, organization_id: Optional[str] = None) -> None:
    """
    Add tenant context to the current span.

    Args:
        tenant_id: Tenant ID
        organization_id: Organization ID (optional)

    Example:
        >>> add_tenant_context("tenant-456", "org-789")
    """
    attributes = {"tenant.id": tenant_id}

    if organization_id:
        attributes["organization.id"] = organization_id

    add_span_attributes(attributes)


def record_event(name: str, attributes: Optional[Dict[str, Any]] = None) -> None:
    """
    Record a custom event in the current span.

    Args:
        name: Event name
        attributes: Event attributes

    Example:
        >>> record_event("resume_analyzed", {
        ...     "resume.sections": 5,
        ...     "resume.score": 85
        ... })
    """
    span = get_current_span()
    if span and span.is_recording():
        span.add_event(name, attributes or {})


def record_exception(exception: Exception, attributes: Optional[Dict[str, Any]] = None) -> None:
    """
    Record an exception in the current span.

    Args:
        exception: Exception to record
        attributes: Additional attributes

    Example:
        >>> try:
        ...     # Some code
        ...     pass
        ... except Exception as e:
        ...     record_exception(e, {"operation": "resume_parsing"})
        ...     raise
    """
    span = get_current_span()
    if span and span.is_recording():
        span.record_exception(exception, attributes or {})
        span.set_status(Status(StatusCode.ERROR, str(exception)))


def propagate_trace_context(headers: Dict[str, str]) -> Dict[str, str]:
    """
    Inject trace context into HTTP headers for outgoing requests.

    Args:
        headers: HTTP headers dictionary

    Returns:
        Headers with trace context injected

    Example:
        >>> headers = {"Content-Type": "application/json"}
        >>> headers = propagate_trace_context(headers)
        >>> response = await client.post(url, headers=headers)
    """
    carrier = headers.copy()
    propagate.inject(carrier)
    return carrier


def extract_trace_context(headers: Dict[str, str]) -> context.Context:
    """
    Extract trace context from incoming request headers.

    Args:
        headers: HTTP headers dictionary

    Returns:
        Extracted context

    Example:
        >>> ctx = extract_trace_context(request.headers)
        >>> with context.attach(ctx):
        ...     # Process request within trace context
        ...     pass
    """
    return propagate.extract(headers)


# Specialized span creators for common operations

def create_llm_span(
    model: str,
    prompt_tokens: Optional[int] = None,
    completion_tokens: Optional[int] = None,
    **attributes,
):
    """
    Create a span for LLM operations.

    Args:
        model: LLM model name
        prompt_tokens: Number of prompt tokens
        completion_tokens: Number of completion tokens
        **attributes: Additional attributes

    Example:
        >>> with create_llm_span("gpt-4", prompt_tokens=100, completion_tokens=50):
        ...     response = await llm.complete(prompt)
    """
    span_attributes = {
        "llm.model": model,
        "llm.provider": "openai",
        **attributes,
    }

    if prompt_tokens is not None:
        span_attributes["llm.prompt_tokens"] = prompt_tokens

    if completion_tokens is not None:
        span_attributes["llm.completion_tokens"] = completion_tokens

    return create_span("llm.completion", kind=trace.SpanKind.CLIENT, attributes=span_attributes)


def create_embedding_span(model: str, input_tokens: Optional[int] = None, **attributes):
    """
    Create a span for embedding operations.

    Args:
        model: Embedding model name
        input_tokens: Number of input tokens
        **attributes: Additional attributes

    Example:
        >>> with create_embedding_span("text-embedding-ada-002", input_tokens=50):
        ...     embeddings = await embedding_service.embed(text)
    """
    span_attributes = {
        "embedding.model": model,
        "embedding.provider": "openai",
        **attributes,
    }

    if input_tokens is not None:
        span_attributes["embedding.input_tokens"] = input_tokens

    return create_span("embedding.create", kind=trace.SpanKind.CLIENT, attributes=span_attributes)


def create_vector_search_span(index_name: str, k: int = 10, **attributes):
    """
    Create a span for vector search operations.

    Args:
        index_name: Vector index name
        k: Number of results to retrieve
        **attributes: Additional attributes

    Example:
        >>> with create_vector_search_span("jobs_index", k=10):
        ...     results = await vector_store.search(query_embedding, k=10)
    """
    span_attributes = {
        "vector.index": index_name,
        "vector.k": k,
        "vector.system": "qdrant",
        **attributes,
    }

    return create_span("vector.search", kind=trace.SpanKind.CLIENT, attributes=span_attributes)


def is_tracing_enabled() -> bool:
    """
    Check if telemetry is initialized and enabled.

    Returns:
        True if telemetry is enabled, False otherwise
    """
    return _is_initialized


__all__ = [
    "TelemetryConfig",
    "init_telemetry",
    "instrument_fastapi",
    "get_tracer",
    "get_current_span",
    "create_span",
    "trace_function",
    "add_span_attributes",
    "add_user_context",
    "add_tenant_context",
    "record_event",
    "record_exception",
    "propagate_trace_context",
    "extract_trace_context",
    "create_llm_span",
    "create_embedding_span",
    "create_vector_search_span",
    "is_tracing_enabled",
]
