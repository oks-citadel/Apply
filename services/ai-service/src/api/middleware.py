"""
Custom middleware for AI Service API.
"""

import time
import uuid
from typing import Callable

import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = structlog.get_logger()


class TimingMiddleware(BaseHTTPMiddleware):
    """Middleware to measure and log request processing time."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and measure timing.

        Args:
            request: Incoming request
            call_next: Next middleware or route handler

        Returns:
            Response with timing header
        """
        start_time = time.time()

        # Process request
        response = await call_next(request)

        # Calculate processing time
        process_time = time.time() - start_time

        # Add timing header
        response.headers["X-Process-Time"] = f"{process_time:.4f}"

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all incoming requests and responses."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request and response information.

        Args:
            request: Incoming request
            call_next: Next middleware or route handler

        Returns:
            Response from handler
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())

        # Store request ID in request state
        request.state.request_id = request_id

        # Log incoming request
        logger.info(
            "Incoming request",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_host=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )

        start_time = time.time()

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Log response
            logger.info(
                "Request completed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                process_time=f"{process_time:.4f}s",
            )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            return response

        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            logger.error(
                "Request failed",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                process_time=f"{process_time:.4f}s",
                exc_info=True,
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware for rate limiting requests.

    Note: This is a basic implementation. For production, consider using
    redis-based rate limiting or a dedicated rate limiting service.
    """

    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        """
        Initialize rate limit middleware.

        Args:
            app: ASGI application
            requests_per_minute: Maximum requests per minute per client
        """
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.client_requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Check rate limit and process request.

        Args:
            request: Incoming request
            call_next: Next middleware or route handler

        Returns:
            Response from handler or rate limit error
        """
        # Get client identifier (IP address)
        client_host = request.client.host if request.client else "unknown"

        # Get current time
        current_time = time.time()

        # Initialize client request list if not exists
        if client_host not in self.client_requests:
            self.client_requests[client_host] = []

        # Clean old requests (older than 1 minute)
        self.client_requests[client_host] = [
            req_time
            for req_time in self.client_requests[client_host]
            if current_time - req_time < 60
        ]

        # Check rate limit
        if len(self.client_requests[client_host]) >= self.requests_per_minute:
            logger.warning(
                "Rate limit exceeded",
                client_host=client_host,
                requests=len(self.client_requests[client_host]),
            )

            from fastapi.responses import JSONResponse
            from ..schemas.response_schemas import ErrorResponse

            return JSONResponse(
                status_code=429,
                content=ErrorResponse(
                    error="RATE_LIMIT_EXCEEDED",
                    message=f"Rate limit exceeded. Maximum {self.requests_per_minute} requests per minute.",
                ).model_dump(),
            )

        # Add current request to list
        self.client_requests[client_host].append(current_time)

        # Process request
        return await call_next(request)


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware for consistent error handling."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Handle errors consistently across all endpoints.

        Args:
            request: Incoming request
            call_next: Next middleware or route handler

        Returns:
            Response from handler or error response
        """
        try:
            return await call_next(request)

        except ValueError as e:
            logger.warning(
                "Validation error",
                error=str(e),
                path=request.url.path,
            )

            from fastapi.responses import JSONResponse
            from ..schemas.response_schemas import ErrorResponse

            return JSONResponse(
                status_code=400,
                content=ErrorResponse(
                    error="VALIDATION_ERROR",
                    message=str(e),
                ).model_dump(),
            )

        except PermissionError as e:
            logger.warning(
                "Permission denied",
                error=str(e),
                path=request.url.path,
            )

            from fastapi.responses import JSONResponse
            from ..schemas.response_schemas import ErrorResponse

            return JSONResponse(
                status_code=403,
                content=ErrorResponse(
                    error="PERMISSION_DENIED",
                    message=str(e),
                ).model_dump(),
            )

        except Exception as e:
            logger.error(
                "Unhandled error in middleware",
                error=str(e),
                path=request.url.path,
                exc_info=True,
            )
            raise
