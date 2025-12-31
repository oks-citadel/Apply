import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ServiceAuthService } from './service-auth.service';
import { SERVICE_AUTH_METADATA } from './service-auth.constants';

/**
 * ServiceAuthGuard validates internal service-to-service requests
 *
 * This guard supports two authentication methods:
 * 1. JWT-based authentication (recommended)
 * 2. API key-based authentication (fallback)
 *
 * @example
 * ```typescript
 * // Protect an entire controller
 * @UseGuards(ServiceAuthGuard)
 * @Controller('internal')
 * export class InternalController {}
 *
 * // Protect a specific endpoint
 * @UseGuards(ServiceAuthGuard)
 * @Get('data')
 * getData() {}
 *
 * // Restrict to specific services
 * @UseGuards(ServiceAuthGuard)
 * @AllowedServices(InternalService.AUTH_SERVICE, InternalService.USER_SERVICE)
 * @Get('restricted')
 * getRestrictedData() {}
 * ```
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);

  constructor(
    private readonly serviceAuthService: ServiceAuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Check if this endpoint should bypass service auth
    const bypass = this.reflector.getAllAndOverride<boolean>(
      SERVICE_AUTH_METADATA.BYPASS_SERVICE_AUTH,
      [context.getHandler(), context.getClass()],
    );

    if (bypass) {
      this.logger.debug('Service auth bypassed for this endpoint');
      return true;
    }

    // Extract headers (normalize to lowercase for consistency)
    const headers = this.normalizeHeaders(request.headers);

    // Authenticate the request
    const authContext = this.serviceAuthService.authenticateRequest(headers);

    if (!authContext) {
      this.logger.warn('Service authentication failed: No valid credentials');
      throw new UnauthorizedException('Service authentication required');
    }

    // Check if the service is in the allowed list for this endpoint
    const allowedServices = this.reflector.getAllAndOverride<string[]>(
      SERVICE_AUTH_METADATA.ALLOWED_SERVICES,
      [context.getHandler(), context.getClass()],
    );

    if (allowedServices && allowedServices.length > 0) {
      if (!allowedServices.includes(authContext.serviceName)) {
        this.logger.warn(
          `Service ${authContext.serviceName} not allowed for this endpoint. ` +
          `Allowed: ${allowedServices.join(', ')}`,
        );
        throw new ForbiddenException(
          `Service '${authContext.serviceName}' is not authorized for this endpoint`,
        );
      }
    }

    // Attach the auth context to the request
    request.serviceAuth = authContext;

    this.logger.debug(
      `Service authenticated: ${authContext.serviceName} via ${authContext.authMethod}`,
    );

    return true;
  }

  /**
   * Normalize headers to lowercase keys for consistent access
   */
  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
      normalized[key] = value; // Keep original for compatibility
    }
    return normalized;
  }
}

/**
 * OptionalServiceAuthGuard allows both authenticated service requests
 * and regular user requests to pass through.
 *
 * Use this when an endpoint can be called by both services and users.
 * The serviceAuth context will be attached if the request is from a service.
 */
@Injectable()
export class OptionalServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalServiceAuthGuard.name);

  constructor(private readonly serviceAuthService: ServiceAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = this.normalizeHeaders(request.headers);

    // Try to authenticate, but don't fail if authentication fails
    const authContext = this.serviceAuthService.authenticateRequest(headers);

    if (authContext) {
      request.serviceAuth = authContext;
      this.logger.debug(
        `Optional service auth: ${authContext.serviceName} authenticated`,
      );
    }

    return true;
  }

  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
      normalized[key] = value;
    }
    return normalized;
  }
}

/**
 * InternalOnlyGuard ensures the endpoint is only accessible
 * from internal services, not from external requests.
 *
 * This is stricter than ServiceAuthGuard as it explicitly
 * rejects any request without valid service authentication.
 */
@Injectable()
export class InternalOnlyGuard implements CanActivate {
  private readonly logger = new Logger(InternalOnlyGuard.name);

  constructor(private readonly serviceAuthService: ServiceAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headers = this.normalizeHeaders(request.headers);

    // Check for service authentication
    const authContext = this.serviceAuthService.authenticateRequest(headers);

    if (!authContext) {
      this.logger.warn('Internal-only endpoint accessed without service auth');
      throw new ForbiddenException('This endpoint is for internal service use only');
    }

    request.serviceAuth = authContext;
    this.logger.debug(`Internal endpoint accessed by: ${authContext.serviceName}`);

    return true;
  }

  private normalizeHeaders(headers: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      normalized[key.toLowerCase()] = value;
      normalized[key] = value;
    }
    return normalized;
  }
}
