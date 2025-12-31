/**
 * Service-to-Service Authentication Types
 *
 * Type definitions for internal service authentication.
 */

import { InternalService } from './service-auth.constants';

/**
 * Service authentication payload stored in JWT
 */
export interface ServiceAuthPayload {
  /** Service identifier (subject) */
  sub: string;
  /** Token type - always 'service' for service tokens */
  type: 'service';
  /** Service name */
  serviceName: string;
  /** Issued at timestamp */
  iat: number;
  /** Expiration timestamp */
  exp?: number;
  /** Token ID for tracking */
  jti?: string;
  /** Additional claims */
  claims?: Record<string, unknown>;
}

/**
 * Service authentication context attached to requests
 */
export interface ServiceAuthContext {
  /** Whether the request is from an authenticated service */
  isServiceRequest: boolean;
  /** Name of the calling service */
  serviceName: string;
  /** Authentication method used */
  authMethod: 'api-key' | 'jwt';
  /** Full payload (for JWT auth) */
  payload?: ServiceAuthPayload;
  /** Timestamp of authentication */
  authenticatedAt: Date;
}

/**
 * Configuration options for ServiceAuthModule
 */
export interface ServiceAuthModuleOptions {
  /** Enable API key authentication */
  enableApiKeyAuth?: boolean;
  /** Enable JWT authentication */
  enableJwtAuth?: boolean;
  /** API key for service authentication */
  apiKey?: string;
  /** JWT secret for signing/verifying tokens */
  jwtSecret?: string;
  /** JWT expiration time */
  jwtExpiration?: string;
  /** Current service name */
  serviceName?: string;
  /** List of allowed service names (for API key auth) */
  allowedServices?: string[];
  /** Custom validation function */
  customValidator?: (context: ServiceAuthContext) => boolean | Promise<boolean>;
}

/**
 * Abstract class representing a NestJS module type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ModuleType = new (...args: unknown[]) => unknown;

/**
 * Injection token type for NestJS dependency injection
 */
type InjectionToken = string | symbol | ModuleType | (new (...args: unknown[]) => unknown);

/**
 * Async configuration options for ServiceAuthModule
 */
export interface ServiceAuthModuleAsyncOptions {
  imports?: ModuleType[];
  useFactory: (...args: unknown[]) => Promise<ServiceAuthModuleOptions> | ServiceAuthModuleOptions;
  inject?: InjectionToken[];
}

/**
 * Options for the ServiceAuthClient
 */
export interface ServiceAuthClientOptions {
  /** Base URL of the target service */
  baseUrl: string;
  /** Target service name */
  targetService: InternalService | string;
  /** Current service name */
  serviceName: string;
  /** API key for authentication (optional) */
  apiKey?: string;
  /** JWT secret for token generation (optional) */
  jwtSecret?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    maxAttempts?: number;
    delayMs?: number;
  };
}

/**
 * HTTP request options for ServiceAuthClient
 */
export interface ServiceRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, string | number | boolean>;
  /** Request timeout */
  timeout?: number;
  /** Whether to retry on failure */
  retry?: boolean;
}

/**
 * HTTP response from ServiceAuthClient
 */
export interface ServiceResponse<T = unknown> {
  /** Response status code */
  status: number;
  /** Response status text */
  statusText: string;
  /** Response data */
  data: T;
  /** Response headers */
  headers: Record<string, string>;
}

/**
 * Service health check response
 */
export interface ServiceHealthResponse {
  /** Service status */
  status: 'ok' | 'error' | 'degraded';
  /** Service name */
  service: string;
  /** Uptime in seconds */
  uptime?: number;
  /** Version information */
  version?: string;
  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Service discovery entry
 */
export interface ServiceDiscoveryEntry {
  /** Service name */
  name: InternalService | string;
  /** Service URL */
  url: string;
  /** Whether the service is healthy */
  healthy: boolean;
  /** Last health check timestamp */
  lastCheck?: Date;
  /** Service metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error response from service calls
 */
export interface ServiceErrorResponse {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: Record<string, unknown>;
}
