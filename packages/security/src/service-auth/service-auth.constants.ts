/**
 * Service-to-Service Authentication Constants
 *
 * This file contains constants and configuration for internal service authentication.
 */

/**
 * HTTP Headers used for service authentication
 */
export const SERVICE_AUTH_HEADERS = {
  /** The name of the calling service */
  SERVICE_NAME: 'X-Service-Name',
  /** API key for service authentication */
  SERVICE_KEY: 'X-Service-Key',
  /** JWT token for service authentication (alternative to API key) */
  SERVICE_AUTH: 'X-Service-Auth',
  /** Request ID for tracing */
  REQUEST_ID: 'X-Request-ID',
  /** Correlation ID for distributed tracing */
  CORRELATION_ID: 'X-Correlation-ID',
} as const;

/**
 * Registered internal services
 */
export enum InternalService {
  API_GATEWAY = 'api-gateway',
  AUTH_SERVICE = 'auth-service',
  USER_SERVICE = 'user-service',
  JOB_SERVICE = 'job-service',
  RESUME_SERVICE = 'resume-service',
  AI_SERVICE = 'ai-service',
  NOTIFICATION_SERVICE = 'notification-service',
  PAYMENT_SERVICE = 'payment-service',
  ANALYTICS_SERVICE = 'analytics-service',
  AUTO_APPLY_SERVICE = 'auto-apply-service',
  ORCHESTRATOR_SERVICE = 'orchestrator-service',
}

/**
 * Environment variable names for service authentication
 */
export const SERVICE_AUTH_ENV = {
  /** Shared secret for API key authentication */
  SERVICE_API_KEY: 'SERVICE_API_KEY',
  /** JWT secret for JWT-based service authentication */
  SERVICE_JWT_SECRET: 'SERVICE_JWT_SECRET',
  /** Current service name */
  SERVICE_NAME: 'SERVICE_NAME',
  /** Comma-separated list of allowed service names */
  ALLOWED_SERVICES: 'ALLOWED_SERVICES',
  /** Enable/disable API key authentication */
  ENABLE_API_KEY_AUTH: 'ENABLE_API_KEY_AUTH',
  /** Enable/disable JWT authentication */
  ENABLE_JWT_AUTH: 'ENABLE_JWT_AUTH',
} as const;

/**
 * Default configuration values
 */
export const SERVICE_AUTH_DEFAULTS = {
  /** Default JWT expiration time */
  JWT_EXPIRATION: '5m',
  /** Default token refresh threshold (in seconds) */
  TOKEN_REFRESH_THRESHOLD: 60,
  /** Maximum retry attempts for token refresh */
  MAX_RETRY_ATTEMPTS: 3,
  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000,
  /** Request timeout for internal calls (in milliseconds) */
  REQUEST_TIMEOUT_MS: 10000,
} as const;

/**
 * Metadata keys for decorators
 */
export const SERVICE_AUTH_METADATA = {
  /** Key for marking endpoints as internal-only */
  INTERNAL_ONLY: 'service_auth:internal_only',
  /** Key for specifying allowed services */
  ALLOWED_SERVICES: 'service_auth:allowed_services',
  /** Key for bypassing service authentication */
  BYPASS_SERVICE_AUTH: 'service_auth:bypass',
} as const;

/**
 * Service URLs for Kubernetes cluster internal communication
 * These are used as defaults and should be overridden via environment variables
 */
export const DEFAULT_SERVICE_URLS: Record<InternalService, string> = {
  [InternalService.API_GATEWAY]: 'http://api-gateway.applyforus.svc.cluster.local:8000',
  [InternalService.AUTH_SERVICE]: 'http://auth-service.applyforus.svc.cluster.local:8001',
  [InternalService.USER_SERVICE]: 'http://user-service.applyforus.svc.cluster.local:8002',
  [InternalService.JOB_SERVICE]: 'http://job-service.applyforus.svc.cluster.local:8003',
  [InternalService.RESUME_SERVICE]: 'http://resume-service.applyforus.svc.cluster.local:8004',
  [InternalService.AI_SERVICE]: 'http://ai-service.applyforus.svc.cluster.local:8006',
  [InternalService.NOTIFICATION_SERVICE]: 'http://notification-service.applyforus.svc.cluster.local:8005',
  [InternalService.PAYMENT_SERVICE]: 'http://payment-service.applyforus.svc.cluster.local:8007',
  [InternalService.ANALYTICS_SERVICE]: 'http://analytics-service.applyforus.svc.cluster.local:8008',
  [InternalService.AUTO_APPLY_SERVICE]: 'http://auto-apply-service.applyforus.svc.cluster.local:8009',
  [InternalService.ORCHESTRATOR_SERVICE]: 'http://orchestrator-service.applyforus.svc.cluster.local:8010',
};
