"""
Security middleware for FastAPI AI Service.
"""

from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import Headers, MutableHeaders
import time
import structlog

logger = structlog.get_logger()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]

        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    For production, use Redis-based rate limiting.
    """

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = {}

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Get client identifier (IP address)
        client_ip = request.client.host if request.client else "unknown"

        # Skip rate limiting for health check endpoints
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        current_time = time.time()

        # Initialize or clean up request tracking
        if client_ip not in self.requests:
            self.requests[client_ip] = []

        # Remove old requests outside the window
        self.requests[client_ip] = [
            req_time
            for req_time in self.requests[client_ip]
            if current_time - req_time < self.window_seconds
        ]

        # Check rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            logger.warning(
                "Rate limit exceeded",
                client_ip=client_ip,
                requests=len(self.requests[client_ip]),
                window=self.window_seconds,
            )

            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Maximum {self.max_requests} requests per {self.window_seconds} seconds.",
                },
                headers={
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(current_time + self.window_seconds)),
                    "Retry-After": str(self.window_seconds),
                },
            )

        # Add current request
        self.requests[client_ip].append(current_time)

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        remaining = self.max_requests - len(self.requests[client_ip])
        response.headers["X-RateLimit-Limit"] = str(self.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(
            int(current_time + self.window_seconds)
        )

        return response


class InputSanitizationMiddleware(BaseHTTPMiddleware):
    """
    Sanitize input to prevent XSS and injection attacks.
    """

    DANGEROUS_PATTERNS = [
        "<script",
        "javascript:",
        "onerror=",
        "onclick=",
        "onload=",
        "<iframe",
        "eval(",
        "expression(",
    ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check for dangerous patterns in query parameters
        query_string = str(request.url.query).lower()
        for pattern in self.DANGEROUS_PATTERNS:
            if pattern in query_string:
                logger.warning(
                    "Dangerous pattern detected in query string",
                    pattern=pattern,
                    path=request.url.path,
                    client_ip=request.client.host if request.client else "unknown",
                )

                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": "INVALID_INPUT",
                        "message": "Request contains potentially dangerous content",
                    },
                )

        # Check for dangerous patterns in headers
        for header_name, header_value in request.headers.items():
            header_value_lower = str(header_value).lower()
            for pattern in self.DANGEROUS_PATTERNS:
                if pattern in header_value_lower:
                    logger.warning(
                        "Dangerous pattern detected in header",
                        header=header_name,
                        pattern=pattern,
                        path=request.url.path,
                        client_ip=request.client.host if request.client else "unknown",
                    )

                    return JSONResponse(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        content={
                            "error": "INVALID_INPUT",
                            "message": "Request contains potentially dangerous content",
                        },
                    )

        return await call_next(request)


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Limit request body size to prevent memory exhaustion attacks.
    """

    def __init__(self, app, max_size_mb: int = 10):
        super().__init__(app)
        self.max_size_bytes = max_size_mb * 1024 * 1024

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check Content-Length header
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
                if size > self.max_size_bytes:
                    logger.warning(
                        "Request size limit exceeded",
                        size=size,
                        max_size=self.max_size_bytes,
                        path=request.url.path,
                        client_ip=request.client.host if request.client else "unknown",
                    )

                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "error": "REQUEST_TOO_LARGE",
                            "message": f"Request body size exceeds maximum allowed size of {self.max_size_bytes / (1024*1024):.0f}MB",
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)
