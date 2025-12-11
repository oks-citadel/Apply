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

            return JSONResponse(
                status_code=400,
                content={
                    "error": "VALIDATION_ERROR",
                    "message": str(e),
                },
            )

        except PermissionError as e:
            logger.warning(
                "Permission denied",
                error=str(e),
                path=request.url.path,
            )

            from fastapi.responses import JSONResponse

            return JSONResponse(
                status_code=403,
                content={
                    "error": "PERMISSION_DENIED",
                    "message": str(e),
                },
            )

        except Exception as e:
            logger.error(
                "Unhandled error in middleware",
                error=str(e),
                path=request.url.path,
                exc_info=True,
            )
            raise
