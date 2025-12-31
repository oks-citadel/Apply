import { SetMetadata, createParamDecorator, ExecutionContext, applyDecorators, UseGuards } from '@nestjs/common';

import { SERVICE_AUTH_METADATA, InternalService } from './service-auth.constants';
import { ServiceAuthContext } from './service-auth.types';
import { ServiceAuthGuard, InternalOnlyGuard, OptionalServiceAuthGuard } from './service-auth.guard';

/**
 * Mark an endpoint as internal-only (requires service authentication)
 *
 * @example
 * ```typescript
 * @InternalOnly()
 * @Get('sync')
 * syncData() {}
 * ```
 */
export const InternalOnly = () =>
  SetMetadata(SERVICE_AUTH_METADATA.INTERNAL_ONLY, true);

/**
 * Specify which services are allowed to access an endpoint
 *
 * @param services - List of allowed service names
 *
 * @example
 * ```typescript
 * @AllowedServices(InternalService.AUTH_SERVICE, InternalService.USER_SERVICE)
 * @Get('sensitive-data')
 * getSensitiveData() {}
 * ```
 */
export const AllowedServices = (...services: (InternalService | string)[]) =>
  SetMetadata(SERVICE_AUTH_METADATA.ALLOWED_SERVICES, services);

/**
 * Bypass service authentication for a specific endpoint
 * Use sparingly - typically for health checks or public endpoints
 *
 * @example
 * ```typescript
 * @BypassServiceAuth()
 * @Get('health')
 * healthCheck() {}
 * ```
 */
export const BypassServiceAuth = () =>
  SetMetadata(SERVICE_AUTH_METADATA.BYPASS_SERVICE_AUTH, true);

/**
 * Extract service auth context from the request
 *
 * @example
 * ```typescript
 * @Get('data')
 * getData(@ServiceAuth() serviceAuth: ServiceAuthContext) {
 *   console.log(`Request from: ${serviceAuth.serviceName}`);
 * }
 * ```
 */
export const ServiceAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ServiceAuthContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.serviceAuth;
  },
);

/**
 * Extract the calling service name from the request
 *
 * @example
 * ```typescript
 * @Get('data')
 * getData(@CallingService() serviceName: string) {
 *   console.log(`Request from: ${serviceName}`);
 * }
 * ```
 */
export const CallingService = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.serviceAuth?.serviceName;
  },
);

/**
 * Check if the request is from a specific service
 *
 * @example
 * ```typescript
 * @Get('data')
 * getData(@IsFromService(InternalService.AUTH_SERVICE) isFromAuth: boolean) {
 *   if (isFromAuth) {
 *     // Special handling for auth service
 *   }
 * }
 * ```
 */
export const IsFromService = createParamDecorator(
  (serviceName: string, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest();
    return request.serviceAuth?.serviceName === serviceName;
  },
);

/**
 * Check if the current request is a service-to-service request
 *
 * @example
 * ```typescript
 * @Get('data')
 * getData(@IsServiceRequest() isService: boolean) {
 *   if (isService) {
 *     // Different behavior for service calls
 *   }
 * }
 * ```
 */
export const IsServiceRequest = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): boolean => {
    const request = ctx.switchToHttp().getRequest();
    return !!request.serviceAuth?.isServiceRequest;
  },
);

/**
 * Composite decorator that applies ServiceAuthGuard
 * and marks the endpoint as internal-only
 *
 * @example
 * ```typescript
 * @InternalEndpoint()
 * @Get('sync')
 * syncData() {}
 * ```
 */
export const InternalEndpoint = () =>
  applyDecorators(
    InternalOnly(),
    UseGuards(InternalOnlyGuard),
  );

/**
 * Composite decorator for endpoints accessible by specific services
 *
 * @param services - List of allowed service names
 *
 * @example
 * ```typescript
 * @ServiceEndpoint(InternalService.AUTH_SERVICE, InternalService.USER_SERVICE)
 * @Get('user-data')
 * getUserData() {}
 * ```
 */
export const ServiceEndpoint = (...services: (InternalService | string)[]) =>
  applyDecorators(
    AllowedServices(...services),
    UseGuards(ServiceAuthGuard),
  );

/**
 * Composite decorator for endpoints that can be called by both
 * services and users. Service auth is optional.
 *
 * @example
 * ```typescript
 * @OptionalServiceEndpoint()
 * @Get('data')
 * getData(@ServiceAuth() serviceAuth?: ServiceAuthContext) {
 *   if (serviceAuth) {
 *     // Called by a service
 *   } else {
 *     // Called by a user
 *   }
 * }
 * ```
 */
export const OptionalServiceEndpoint = () =>
  applyDecorators(
    UseGuards(OptionalServiceAuthGuard),
  );
