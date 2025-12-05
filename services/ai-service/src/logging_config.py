"""
Logging configuration for AI Service with Azure Application Insights integration.
"""

import os
import sys
import json
import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
from contextvars import ContextVar
from logging import LogRecord

from opencensus.ext.azure.log_exporter import AzureLogHandler
from opencensus.ext.azure.trace_exporter import AzureExporter
from opencensus.trace import config_integration
from opencensus.trace.samplers import ProbabilitySampler
from opencensus.trace.tracer import Tracer
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

# Context variables for correlation tracking
correlation_id_var: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)
operation_id_var: ContextVar[Optional[str]] = ContextVar('operation_id', default=None)
user_id_var: ContextVar[Optional[str]] = ContextVar('user_id', default=None)


class CorrelationIdFilter(logging.Filter):
    """
    Logging filter that adds correlation ID, operation ID, and user ID to log records.
    """

    def filter(self, record: LogRecord) -> bool:
        record.correlation_id = correlation_id_var.get() or 'N/A'
        record.operation_id = operation_id_var.get() or 'N/A'
        record.user_id = user_id_var.get() or 'N/A'
        return True


class StructuredFormatter(logging.Formatter):
    """
    Custom formatter that outputs logs in structured JSON format.
    """

    def __init__(
        self,
        service_name: str,
        environment: str,
        version: str,
        include_trace: bool = True,
    ):
        super().__init__()
        self.service_name = service_name
        self.environment = environment
        self.version = version
        self.include_trace = include_trace

    def format(self, record: LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'serviceName': self.service_name,
            'environment': self.environment,
            'version': self.version,
            'correlationId': getattr(record, 'correlation_id', 'N/A'),
            'operationId': getattr(record, 'operation_id', 'N/A'),
        }

        # Add user ID if present
        user_id = getattr(record, 'user_id', None)
        if user_id and user_id != 'N/A':
            log_data['userId'] = user_id

        # Add extra fields
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        # Add exception information
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'stackTrace': self.formatException(record.exc_info) if self.include_trace else None,
            }

        # Add file and line information in development
        if self.environment in ['development', 'local']:
            log_data['source'] = {
                'file': record.pathname,
                'line': record.lineno,
                'function': record.funcName,
            }

        return json.dumps(log_data, ensure_ascii=False)


class SensitiveDataFilter(logging.Filter):
    """
    Filter that redacts sensitive data from log records.
    """

    SENSITIVE_PATTERNS = [
        'password',
        'secret',
        'token',
        'api_key',
        'apikey',
        'authorization',
        'credential',
        'private_key',
        'access_key',
        'session',
        'cookie',
        'ssn',
        'credit_card',
        'cvv',
    ]

    def filter(self, record: LogRecord) -> bool:
        if hasattr(record, 'extra_fields'):
            record.extra_fields = self._sanitize_dict(record.extra_fields)
        return True

    def _sanitize_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Recursively sanitize dictionary data."""
        if not isinstance(data, dict):
            return data

        sanitized = {}
        for key, value in data.items():
            if self._is_sensitive_key(key):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_dict(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value

        return sanitized

    def _is_sensitive_key(self, key: str) -> bool:
        """Check if key contains sensitive information."""
        key_lower = key.lower()
        return any(pattern in key_lower for pattern in self.SENSITIVE_PATTERNS)


class ApplicationInsightsLogger:
    """
    Wrapper class for Azure Application Insights logging.
    """

    def __init__(
        self,
        instrumentation_key: Optional[str] = None,
        service_name: str = 'ai-service',
        environment: str = 'development',
        version: str = '1.0.0',
        enable_console: bool = True,
        log_level: str = 'INFO',
    ):
        self.instrumentation_key = instrumentation_key
        self.service_name = service_name
        self.environment = environment
        self.version = version
        self.enable_console = enable_console
        self.log_level = log_level
        self.logger = self._configure_logging()
        self.tracer = self._configure_tracing() if instrumentation_key else None

    def _configure_logging(self) -> logging.Logger:
        """Configure Python logging with Application Insights."""
        logger = logging.getLogger(self.service_name)
        logger.setLevel(getattr(logging, self.log_level.upper()))

        # Remove existing handlers
        logger.handlers = []

        # Add correlation ID filter
        correlation_filter = CorrelationIdFilter()
        logger.addFilter(correlation_filter)

        # Add sensitive data filter
        sensitive_filter = SensitiveDataFilter()
        logger.addFilter(sensitive_filter)

        # Console handler
        if self.enable_console:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(getattr(logging, self.log_level.upper()))
            console_formatter = StructuredFormatter(
                service_name=self.service_name,
                environment=self.environment,
                version=self.version,
                include_trace=True,
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)

        # Azure Application Insights handler
        if self.instrumentation_key:
            azure_handler = AzureLogHandler(
                connection_string=f'InstrumentationKey={self.instrumentation_key}'
            )
            azure_handler.setLevel(logging.INFO)

            # Add custom properties
            azure_handler.add_telemetry_processor(
                self._create_telemetry_processor()
            )
            logger.addHandler(azure_handler)

        return logger

    def _configure_tracing(self) -> Optional[Tracer]:
        """Configure distributed tracing with Application Insights."""
        if not self.instrumentation_key:
            return None

        # Configure integrations
        config_integration.trace_integrations(['requests', 'httplib'])

        # Create Azure exporter
        exporter = AzureExporter(
            connection_string=f'InstrumentationKey={self.instrumentation_key}'
        )

        # Create tracer with sampling
        tracer = Tracer(
            exporter=exporter,
            sampler=ProbabilitySampler(rate=1.0),
        )

        return tracer

    def _create_telemetry_processor(self):
        """Create telemetry processor to add custom properties."""
        def callback_function(envelope):
            envelope.tags['ai.cloud.role'] = self.service_name
            envelope.tags['ai.cloud.roleInstance'] = f"{self.service_name}-{os.getenv('HOSTNAME', 'local')}"

            # Add custom properties
            if not hasattr(envelope.data, 'properties'):
                envelope.data.properties = {}

            envelope.data.properties['serviceName'] = self.service_name
            envelope.data.properties['environment'] = self.environment
            envelope.data.properties['version'] = self.version

            # Add correlation IDs
            correlation_id = correlation_id_var.get()
            if correlation_id:
                envelope.data.properties['correlationId'] = correlation_id

            operation_id = operation_id_var.get()
            if operation_id:
                envelope.data.properties['operationId'] = operation_id

            return True

        return callback_function

    def info(self, message: str, **kwargs):
        """Log info level message."""
        self._log(logging.INFO, message, kwargs)

    def warning(self, message: str, **kwargs):
        """Log warning level message."""
        self._log(logging.WARNING, message, kwargs)

    def error(self, message: str, exc_info=None, **kwargs):
        """Log error level message."""
        self._log(logging.ERROR, message, kwargs, exc_info=exc_info)

    def debug(self, message: str, **kwargs):
        """Log debug level message."""
        self._log(logging.DEBUG, message, kwargs)

    def critical(self, message: str, **kwargs):
        """Log critical level message."""
        self._log(logging.CRITICAL, message, kwargs)

    def _log(self, level: int, message: str, extra_fields: Dict[str, Any], exc_info=None):
        """Internal logging method."""
        extra = {'extra_fields': extra_fields}
        self.logger.log(level, message, extra=extra, exc_info=exc_info)


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for correlation ID propagation and request logging.
    """

    def __init__(
        self,
        app: ASGIApp,
        logger: ApplicationInsightsLogger,
        exclude_paths: list = None,
    ):
        super().__init__(app)
        self.logger = logger
        self.exclude_paths = exclude_paths or ['/health', '/metrics', '/docs', '/redoc']

    async def dispatch(self, request: Request, call_next):
        # Skip logging for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)

        # Extract or generate correlation ID
        correlation_id = request.headers.get('X-Correlation-ID') or str(uuid.uuid4())
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())

        # Set context variables
        correlation_id_var.set(correlation_id)
        operation_id_var.set(request_id)

        # Extract user ID if available (from JWT token or auth)
        user_id = getattr(request.state, 'user_id', None)
        if user_id:
            user_id_var.set(user_id)

        # Log incoming request
        start_time = datetime.utcnow()
        self.logger.info(
            f"Incoming request: {request.method} {request.url.path}",
            method=request.method,
            path=request.url.path,
            correlationId=correlation_id,
            requestId=request_id,
            userAgent=request.headers.get('user-agent'),
            ip=request.client.host if request.client else None,
        )

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = (datetime.utcnow() - start_time).total_seconds() * 1000

        # Add correlation headers to response
        response.headers['X-Correlation-ID'] = correlation_id
        response.headers['X-Request-ID'] = request_id
        response.headers['X-Response-Time'] = f"{duration:.2f}ms"

        # Log response
        log_method = self.logger.error if response.status_code >= 500 else (
            self.logger.warning if response.status_code >= 400 else self.logger.info
        )

        log_method(
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            method=request.method,
            path=request.url.path,
            statusCode=response.status_code,
            duration=duration,
            correlationId=correlation_id,
            requestId=request_id,
        )

        return response


def configure_logging(
    service_name: str = 'ai-service',
    environment: str = None,
    version: str = '1.0.0',
    instrumentation_key: str = None,
) -> ApplicationInsightsLogger:
    """
    Configure logging for the AI service.

    Args:
        service_name: Name of the service
        environment: Environment (development, staging, production)
        version: Service version
        instrumentation_key: Azure Application Insights instrumentation key

    Returns:
        Configured ApplicationInsightsLogger instance
    """
    # Get environment from env var if not provided
    if environment is None:
        environment = os.getenv('ENVIRONMENT', 'development')

    # Get instrumentation key from env var if not provided
    if instrumentation_key is None:
        instrumentation_key = os.getenv('APPLICATIONINSIGHTS_INSTRUMENTATION_KEY')

    # Determine log level based on environment
    log_level_map = {
        'production': 'INFO',
        'staging': 'INFO',
        'development': 'DEBUG',
        'local': 'DEBUG',
        'test': 'WARNING',
    }
    log_level = log_level_map.get(environment.lower(), 'INFO')

    # Enable console logging in all environments
    enable_console = True

    return ApplicationInsightsLogger(
        instrumentation_key=instrumentation_key,
        service_name=service_name,
        environment=environment,
        version=version,
        enable_console=enable_console,
        log_level=log_level,
    )


# Global logger instance (initialized in application startup)
logger: Optional[ApplicationInsightsLogger] = None


def get_logger() -> ApplicationInsightsLogger:
    """Get the global logger instance."""
    global logger
    if logger is None:
        logger = configure_logging()
    return logger
