import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import * as crypto from 'crypto';

import {
  SERVICE_AUTH_ENV,
  InternalService,
} from './service-auth.constants';
import {
  ServiceAuthPayload,
  ServiceAuthContext,
  ServiceAuthModuleOptions,
} from './service-auth.types';

/**
 * ServiceAuthService handles service-to-service authentication
 *
 * Supports two authentication methods:
 * 1. API Key: Simple shared secret validation
 * 2. JWT: Token-based authentication with expiration
 *
 * @example
 * ```typescript
 * // Generating a service token
 * const token = serviceAuthService.generateServiceToken('user-service');
 *
 * // Verifying a service token
 * const payload = serviceAuthService.verifyServiceToken(token);
 *
 * // Validating an API key
 * const isValid = serviceAuthService.validateApiKey('service-name', 'api-key');
 * ```
 */
@Injectable()
export class ServiceAuthService {
  private readonly logger = new Logger(ServiceAuthService.name);
  private readonly apiKey: string;
  private readonly serviceName: string;
  private readonly allowedServices: Set<string>;
  private readonly enableApiKeyAuth: boolean;
  private readonly enableJwtAuth: boolean;
  private readonly jwtService: JwtService | null;

  constructor(
    @Optional() @Inject('JwtService') jwtService?: JwtService,
    @Optional() @Inject('SERVICE_AUTH_OPTIONS') options?: ServiceAuthModuleOptions,
  ) {
    this.jwtService = jwtService || null;

    // Load configuration from options or environment variables
    this.apiKey = options?.apiKey || process.env[SERVICE_AUTH_ENV.SERVICE_API_KEY] || '';
    this.serviceName = options?.serviceName || process.env[SERVICE_AUTH_ENV.SERVICE_NAME] || 'unknown-service';

    // Parse allowed services
    const allowedServicesStr = process.env[SERVICE_AUTH_ENV.ALLOWED_SERVICES] || '';
    const allowedServicesList = options?.allowedServices ||
      (allowedServicesStr ? allowedServicesStr.split(',').map(s => s.trim()) : Object.values(InternalService));
    this.allowedServices = new Set(allowedServicesList);

    // Authentication method flags
    this.enableApiKeyAuth = options?.enableApiKeyAuth ??
      (process.env[SERVICE_AUTH_ENV.ENABLE_API_KEY_AUTH] !== 'false');
    this.enableJwtAuth = options?.enableJwtAuth ??
      (process.env[SERVICE_AUTH_ENV.ENABLE_JWT_AUTH] !== 'false');

    this.logger.log(`ServiceAuthService initialized for service: ${this.serviceName}`);
  }

  /**
   * Generate a JWT token for service-to-service authentication
   *
   * @param serviceName - Name of the calling service
   * @param claims - Additional claims to include in the token
   * @returns Signed JWT token
   */
  generateServiceToken(serviceName: string, claims?: Record<string, unknown>): string {
    if (!this.jwtService) {
      throw new Error('JwtService is not available. Ensure JwtModule is imported.');
    }

    const payload: ServiceAuthPayload = {
      sub: serviceName,
      type: 'service',
      serviceName,
      iat: Math.floor(Date.now() / 1000),
      jti: randomUUID(),
      claims,
    };

    const token = this.jwtService.sign(payload);
    this.logger.debug(`Generated service token for: ${serviceName}`);

    return token;
  }

  /**
   * Verify a JWT service token
   *
   * @param token - JWT token to verify
   * @returns Verified payload or null if invalid
   */
  verifyServiceToken(token: string): ServiceAuthPayload | null {
    if (!this.jwtService) {
      this.logger.warn('JwtService is not available. JWT verification skipped.');
      return null;
    }

    try {
      const payload = this.jwtService.verify<ServiceAuthPayload>(token);

      // Ensure it's a service token
      if (payload.type !== 'service') {
        this.logger.warn(`Invalid token type: ${payload.type}`);
        return null;
      }

      // Verify the service is allowed
      if (!this.isServiceAllowed(payload.serviceName || payload.sub)) {
        this.logger.warn(`Service not allowed: ${payload.serviceName || payload.sub}`);
        return null;
      }

      return payload;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.debug(`Token verification failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Validate an API key for service authentication
   *
   * @param serviceName - Name of the calling service
   * @param apiKey - API key to validate
   * @returns True if the API key is valid
   */
  validateApiKey(serviceName: string, apiKey: string): boolean {
    if (!this.enableApiKeyAuth) {
      this.logger.debug('API key authentication is disabled');
      return false;
    }

    if (!this.apiKey) {
      this.logger.warn('No API key configured. Validation failed.');
      return false;
    }

    // Verify the service is allowed
    if (!this.isServiceAllowed(serviceName)) {
      this.logger.warn(`Service not allowed: ${serviceName}`);
      return false;
    }

    // Use timing-safe comparison to prevent timing attacks
    const isValid = this.timingSafeEqual(apiKey, this.apiKey);

    if (isValid) {
      this.logger.debug(`API key validated for service: ${serviceName}`);
    } else {
      this.logger.warn(`Invalid API key for service: ${serviceName}`);
    }

    return isValid;
  }

  /**
   * Create authentication headers for outgoing service requests
   *
   * @param useJwt - Whether to use JWT (default: true if available)
   * @returns Headers object with authentication credentials
   */
  createAuthHeaders(useJwt: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'X-Service-Name': this.serviceName,
      'X-Request-ID': randomUUID(),
    };

    if (useJwt && this.jwtService && this.enableJwtAuth) {
      headers['X-Service-Auth'] = this.generateServiceToken(this.serviceName);
    } else if (this.enableApiKeyAuth && this.apiKey) {
      headers['X-Service-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Authenticate a request and create an auth context
   *
   * @param headers - Request headers
   * @returns Service auth context or null if not authenticated
   */
  authenticateRequest(headers: Record<string, string>): ServiceAuthContext | null {
    const serviceName = headers['x-service-name'] || headers['X-Service-Name'];

    if (!serviceName) {
      return null;
    }

    // Try JWT authentication first
    const jwtToken = headers['x-service-auth'] || headers['X-Service-Auth'];
    if (jwtToken && this.enableJwtAuth) {
      const payload = this.verifyServiceToken(jwtToken);
      if (payload) {
        return {
          isServiceRequest: true,
          serviceName: payload.serviceName || payload.sub,
          authMethod: 'jwt',
          payload,
          authenticatedAt: new Date(),
        };
      }
    }

    // Fall back to API key authentication
    const apiKey = headers['x-service-key'] || headers['X-Service-Key'];
    if (apiKey && this.enableApiKeyAuth) {
      if (this.validateApiKey(serviceName, apiKey)) {
        return {
          isServiceRequest: true,
          serviceName,
          authMethod: 'api-key',
          authenticatedAt: new Date(),
        };
      }
    }

    return null;
  }

  /**
   * Check if a service is allowed to make authenticated requests
   *
   * @param serviceName - Service name to check
   * @returns True if the service is allowed
   */
  isServiceAllowed(serviceName: string): boolean {
    // If no restrictions are configured, allow all internal services
    if (this.allowedServices.size === 0) {
      return Object.values(InternalService).includes(serviceName as InternalService);
    }

    return this.allowedServices.has(serviceName);
  }

  /**
   * Get the current service name
   */
  getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Get the list of allowed services
   */
  getAllowedServices(): string[] {
    return Array.from(this.allowedServices);
  }

  /**
   * Check if JWT authentication is enabled
   */
  isJwtAuthEnabled(): boolean {
    return this.enableJwtAuth && !!this.jwtService;
  }

  /**
   * Check if API key authentication is enabled
   */
  isApiKeyAuthEnabled(): boolean {
    return this.enableApiKeyAuth && !!this.apiKey;
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      // Still perform comparison to avoid timing leak on length
      crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}
