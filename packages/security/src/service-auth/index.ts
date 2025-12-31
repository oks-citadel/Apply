/**
 * Service-to-Service Authentication Module
 *
 * This module provides comprehensive service-to-service authentication
 * for internal microservice communication.
 *
 * @module service-auth
 *
 * ## Features
 *
 * - JWT-based authentication with automatic token generation and validation
 * - API key-based authentication as fallback
 * - Guards for protecting internal endpoints
 * - HTTP client with automatic authentication header injection
 * - Interceptors for logging and header propagation
 * - Decorators for declarative endpoint protection
 *
 * ## Quick Start
 *
 * ### 1. Import the module in your service:
 *
 * ```typescript
 * import { ServiceAuthModule } from '@applyforus/security';
 *
 * @Module({
 *   imports: [
 *     ServiceAuthModule.forRoot({
 *       serviceName: 'my-service',
 *       jwtSecret: process.env.SERVICE_JWT_SECRET,
 *       apiKey: process.env.SERVICE_API_KEY,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * ### 2. Protect internal endpoints:
 *
 * ```typescript
 * import { ServiceAuthGuard, InternalEndpoint, AllowedServices } from '@applyforus/security';
 *
 * @Controller('internal')
 * export class InternalController {
 *   // Require service authentication
 *   @InternalEndpoint()
 *   @Get('sync')
 *   syncData() {}
 *
 *   // Allow only specific services
 *   @UseGuards(ServiceAuthGuard)
 *   @AllowedServices(InternalService.AUTH_SERVICE)
 *   @Get('users')
 *   getUsers() {}
 * }
 * ```
 *
 * ### 3. Make authenticated requests to other services:
 *
 * ```typescript
 * import { ServiceAuthClient, createServiceClient, InternalService } from '@applyforus/security';
 *
 * @Injectable()
 * export class MyService {
 *   private readonly userClient: ServiceAuthClient;
 *
 *   constructor(private readonly serviceAuthService: ServiceAuthService) {
 *     this.userClient = createServiceClient(
 *       InternalService.USER_SERVICE,
 *       serviceAuthService,
 *     );
 *   }
 *
 *   async getUser(userId: string) {
 *     const response = await this.userClient.get(`/api/v1/users/${userId}`);
 *     return response.data;
 *   }
 * }
 * ```
 *
 * ## Environment Variables
 *
 * | Variable | Description | Required |
 * |----------|-------------|----------|
 * | SERVICE_NAME | Name of the current service | Yes |
 * | SERVICE_JWT_SECRET | Shared secret for JWT signing | Yes (for JWT auth) |
 * | SERVICE_API_KEY | Shared API key for authentication | Yes (for API key auth) |
 * | ALLOWED_SERVICES | Comma-separated list of allowed service names | No |
 * | ENABLE_API_KEY_AUTH | Enable/disable API key auth (default: true) | No |
 * | ENABLE_JWT_AUTH | Enable/disable JWT auth (default: true) | No |
 */

// Module
export { ServiceAuthModule, SERVICE_AUTH_OPTIONS, SERVICE_CLIENTS } from './service-auth.module';

// Service
export { ServiceAuthService } from './service-auth.service';

// Guards
export {
  ServiceAuthGuard,
  OptionalServiceAuthGuard,
  InternalOnlyGuard,
} from './service-auth.guard';

// Client
export {
  ServiceAuthClient,
  ServiceRequestError,
  createServiceClient,
} from './service-auth.client';

// Interceptors
export {
  ServiceAuthInterceptor,
  ServiceRequestLoggingInterceptor,
  createAxiosInterceptor,
} from './service-auth.interceptor';

// Decorators
export {
  InternalOnly,
  AllowedServices,
  BypassServiceAuth,
  ServiceAuth,
  CallingService,
  IsFromService,
  IsServiceRequest,
  InternalEndpoint,
  ServiceEndpoint,
  OptionalServiceEndpoint,
} from './service-auth.decorators';

// Constants
export {
  SERVICE_AUTH_HEADERS,
  SERVICE_AUTH_ENV,
  SERVICE_AUTH_DEFAULTS,
  SERVICE_AUTH_METADATA,
  InternalService,
  DEFAULT_SERVICE_URLS,
} from './service-auth.constants';

// Types
export type {
  ServiceAuthPayload,
  ServiceAuthContext,
  ServiceAuthModuleOptions,
  ServiceAuthModuleAsyncOptions,
  ServiceAuthClientOptions,
  ServiceRequestOptions,
  ServiceResponse,
  ServiceHealthResponse,
  ServiceDiscoveryEntry,
  ServiceErrorResponse,
} from './service-auth.types';
