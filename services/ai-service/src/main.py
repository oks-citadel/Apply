"""
FastAPI application entry point for AI Service.
"""

import time
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Initialize telemetry BEFORE importing application modules
from .telemetry import init_telemetry, instrument_fastapi, TelemetryConfig

# Initialize distributed tracing
telemetry_config = TelemetryConfig(
    service_name="ai-service",
    service_version="1.0.0",
    environment=os.getenv("ENVIRONMENT", "development"),
    azure_monitor_connection_string=os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING"),
)
init_telemetry(telemetry_config)

from .config import settings
from .api.routes import generate, optimize, match, interview, salary, ai_endpoints
from .api.middleware import RequestLoggingMiddleware, TimingMiddleware
from .api.middleware.security import (
    SecurityHeadersMiddleware,
    RateLimitMiddleware,
    InputSanitizationMiddleware,
    RequestSizeLimitMiddleware,
)
from .schemas.response_schemas import HealthResponse, ErrorResponse
from .services.llm_service import LLMService
from .services.embedding_service import EmbeddingService
from .services.vector_store import VectorStore
from .models.job_matcher import JobMatcher
from .models.resume_optimizer import ResumeOptimizer
from .models.salary_predictor import SalaryPredictor

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


# Global service instances
class ServiceState:
    """Container for global service instances."""

    llm_service: LLMService
    embedding_service: EmbeddingService
    vector_store: VectorStore
    job_matcher: JobMatcher
    resume_optimizer: ResumeOptimizer
    salary_predictor: SalaryPredictor


state = ServiceState()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan manager for startup and shutdown events.

    Args:
        app: FastAPI application instance

    Yields:
        None
    """
    # Startup
    logger.info(
        "Starting AI Service",
        app_name=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )

    try:
        # Initialize services
        logger.info("Initializing services...")

        # Initialize LLM Service
        state.llm_service = LLMService()
        logger.info("LLM Service initialized")

        # Initialize Embedding Service
        state.embedding_service = EmbeddingService()
        await state.embedding_service.initialize()
        logger.info("Embedding Service initialized")

        # Initialize Vector Store
        state.vector_store = VectorStore()
        await state.vector_store.initialize()
        logger.info("Vector Store initialized")

        # Initialize AI Models
        state.job_matcher = JobMatcher(
            embedding_service=state.embedding_service,
            vector_store=state.vector_store,
            llm_service=state.llm_service,
        )
        logger.info("Job Matcher initialized")

        state.resume_optimizer = ResumeOptimizer(llm_service=state.llm_service)
        logger.info("Resume Optimizer initialized")

        state.salary_predictor = SalaryPredictor(llm_service=state.llm_service)
        logger.info("Salary Predictor initialized")

        # Store in app state for access in routes
        app.state.llm_service = state.llm_service
        app.state.embedding_service = state.embedding_service
        app.state.vector_store = state.vector_store
        app.state.job_matcher = state.job_matcher
        app.state.resume_optimizer = state.resume_optimizer
        app.state.salary_predictor = state.salary_predictor

        logger.info("All services initialized successfully")

    except Exception as e:
        logger.error(f"Failed to initialize services: {e}", exc_info=True)
        raise

    yield

    # Shutdown
    logger.info("Shutting down AI Service")

    try:
        # Close connections
        await state.embedding_service.close()
        await state.vector_store.close()
        logger.info("All connections closed successfully")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}", exc_info=True)


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="AI-powered service for job matching, resume optimization, and career insights",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID", "X-CSRF-Token"],
    expose_headers=["X-Request-ID", "X-Process-Time", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
)


# Instrument FastAPI with OpenTelemetry
instrument_fastapi(app)

# Add security middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)
app.add_middleware(InputSanitizationMiddleware)
app.add_middleware(RequestSizeLimitMiddleware, max_size_mb=10)

# Add custom middleware
app.add_middleware(TimingMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    logger.warning(
        "HTTP exception occurred",
        status_code=exc.status_code,
        detail=exc.detail,
        path=request.url.path,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
        ).model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors."""
    logger.warning(
        "Validation error occurred",
        errors=exc.errors(),
        path=request.url.path,
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="VALIDATION_ERROR",
            message="Request validation failed",
            details={"errors": exc.errors()},
        ).model_dump(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle uncaught exceptions."""
    logger.error(
        "Unhandled exception occurred",
        error=str(exc),
        path=request.url.path,
        exc_info=True,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred" if not settings.debug else str(exc),
        ).model_dump(),
    )


# Health Check Endpoints
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns:
        Health status of the service and its dependencies
    """
    dependencies = {}

    # Check LLM Service
    try:
        dependencies["llm_service"] = "healthy"
    except Exception:
        dependencies["llm_service"] = "unhealthy"

    # Check Embedding Service
    try:
        dependencies["embedding_service"] = "healthy"
    except Exception:
        dependencies["embedding_service"] = "unhealthy"

    # Check Vector Store
    try:
        await state.vector_store.health_check()
        dependencies["vector_store"] = "healthy"
    except Exception:
        dependencies["vector_store"] = "unhealthy"

    # Determine overall status
    all_healthy = all(status == "healthy" for status in dependencies.values())
    overall_status = "healthy" if all_healthy else "degraded"

    return HealthResponse(
        status=overall_status,
        version=settings.app_version,
        dependencies=dependencies,
    )


@app.get("/", tags=["Root"])
async def root() -> dict:
    """
    Root endpoint.

    Returns:
        Welcome message and service information
    """
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs" if settings.debug else "disabled",
    }


# Include routers
app.include_router(
    generate.router,
    prefix="/api/ai/generate",
    tags=["Content Generation"],
)

app.include_router(
    optimize.router,
    prefix="/api/ai/optimize",
    tags=["Resume Optimization"],
)

app.include_router(
    match.router,
    prefix="/api/ai/match",
    tags=["Job Matching"],
)

app.include_router(
    interview.router,
    prefix="/api/ai/interview",
    tags=["Interview Preparation"],
)

app.include_router(
    salary.router,
    prefix="/api/ai/predict",
    tags=["Salary Prediction"],
)

app.include_router(
    ai_endpoints.router,
    prefix="/ai",
    tags=["AI Services"],
)

# Main entry point
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
