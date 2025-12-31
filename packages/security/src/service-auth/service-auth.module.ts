import { Module, Global, DynamicModule, Provider } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { ServiceAuthService } from './service-auth.service';
import {
  ServiceAuthGuard,
  OptionalServiceAuthGuard,
  InternalOnlyGuard,
} from './service-auth.guard';
import {
  ServiceAuthInterceptor,
  ServiceRequestLoggingInterceptor,
} from './service-auth.interceptor';
import { createServiceClient } from './service-auth.client';
import { SERVICE_AUTH_ENV, SERVICE_AUTH_DEFAULTS, InternalService } from './service-auth.constants';
import { ServiceAuthModuleOptions, ServiceAuthModuleAsyncOptions } from './service-auth.types';

/**
 * Injection token for ServiceAuthModule options
 */
export const SERVICE_AUTH_OPTIONS = 'SERVICE_AUTH_OPTIONS';

/**
 * ServiceAuthModule provides service-to-service authentication
 *
 * This module can be configured in three ways:
 *
 * 1. Default configuration (uses environment variables):
 * ```typescript
 * @Module({
 *   imports: [ServiceAuthModule],
 * })
 * export class AppModule {}
 * ```
 *
 * 2. Static configuration:
 * ```typescript
 * @Module({
 *   imports: [
 *     ServiceAuthModule.forRoot({
 *       enableApiKeyAuth: true,
 *       enableJwtAuth: true,
 *       apiKey: 'your-api-key',
 *       jwtSecret: 'your-jwt-secret',
 *       serviceName: 'my-service',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * 3. Async configuration:
 * ```typescript
 * @Module({
 *   imports: [
 *     ServiceAuthModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (configService: ConfigService) => ({
 *         apiKey: configService.get('SERVICE_API_KEY'),
 *         jwtSecret: configService.get('SERVICE_JWT_SECRET'),
 *         serviceName: configService.get('SERVICE_NAME'),
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class ServiceAuthModule {
  /**
   * Register the module with default configuration
   * Uses environment variables for configuration
   */
  static forRoot(options?: ServiceAuthModuleOptions): DynamicModule {
    const jwtOptions: JwtModuleOptions = {
      secret: options?.jwtSecret ||
        process.env[SERVICE_AUTH_ENV.SERVICE_JWT_SECRET] ||
        'service-secret-change-in-production',
      signOptions: {
        expiresIn: options?.jwtExpiration || SERVICE_AUTH_DEFAULTS.JWT_EXPIRATION,
      },
    };

    return {
      module: ServiceAuthModule,
      imports: [
        JwtModule.register(jwtOptions),
      ],
      providers: [
        {
          provide: SERVICE_AUTH_OPTIONS,
          useValue: options || {},
        },
        {
          provide: ServiceAuthService,
          useFactory: (jwtService: unknown, opts: ServiceAuthModuleOptions) => {
            return new ServiceAuthService(jwtService as any, opts);
          },
          inject: ['JwtService', SERVICE_AUTH_OPTIONS],
        },
        ServiceAuthGuard,
        OptionalServiceAuthGuard,
        InternalOnlyGuard,
        ServiceAuthInterceptor,
        ServiceRequestLoggingInterceptor,
      ],
      exports: [
        ServiceAuthService,
        ServiceAuthGuard,
        OptionalServiceAuthGuard,
        InternalOnlyGuard,
        ServiceAuthInterceptor,
        ServiceRequestLoggingInterceptor,
        SERVICE_AUTH_OPTIONS,
      ],
    };
  }

  /**
   * Register the module with async configuration
   */
  static forRootAsync(options: ServiceAuthModuleAsyncOptions): DynamicModule {
    const asyncProviders = this.createAsyncProviders(options);

    return {
      module: ServiceAuthModule,
      imports: [
        ...(options.imports || []),
        JwtModule.registerAsync({
          imports: options.imports,
          useFactory: async (...args: unknown[]) => {
            const opts = await options.useFactory(...args);
            return {
              secret: opts.jwtSecret ||
                process.env[SERVICE_AUTH_ENV.SERVICE_JWT_SECRET] ||
                'service-secret-change-in-production',
              signOptions: {
                expiresIn: opts.jwtExpiration || SERVICE_AUTH_DEFAULTS.JWT_EXPIRATION,
              },
            };
          },
          inject: options.inject || [],
        }),
      ],
      providers: [
        ...asyncProviders,
        {
          provide: ServiceAuthService,
          useFactory: (jwtService: unknown, opts: ServiceAuthModuleOptions) => {
            return new ServiceAuthService(jwtService as any, opts);
          },
          inject: ['JwtService', SERVICE_AUTH_OPTIONS],
        },
        ServiceAuthGuard,
        OptionalServiceAuthGuard,
        InternalOnlyGuard,
        ServiceAuthInterceptor,
        ServiceRequestLoggingInterceptor,
      ],
      exports: [
        ServiceAuthService,
        ServiceAuthGuard,
        OptionalServiceAuthGuard,
        InternalOnlyGuard,
        ServiceAuthInterceptor,
        ServiceRequestLoggingInterceptor,
        SERVICE_AUTH_OPTIONS,
      ],
    };
  }

  /**
   * Register the module with global guards and interceptors
   * This will apply service auth to all routes
   */
  static forRootWithGlobalGuard(options?: ServiceAuthModuleOptions): DynamicModule {
    const module = this.forRoot(options);

    module.providers = [
      ...(module.providers || []),
      {
        provide: APP_GUARD,
        useClass: OptionalServiceAuthGuard,
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: ServiceRequestLoggingInterceptor,
      },
    ];

    return module;
  }

  /**
   * Create providers for a specific service client
   */
  static createServiceClientProvider(
    targetService: InternalService,
    providerToken?: string | symbol,
  ): Provider {
    const token = providerToken || `SERVICE_CLIENT_${targetService.toUpperCase().replace(/-/g, '_')}`;

    return {
      provide: token,
      useFactory: (serviceAuthService: ServiceAuthService) => {
        return createServiceClient(targetService, serviceAuthService);
      },
      inject: [ServiceAuthService],
    };
  }

  /**
   * Create async providers for configuration
   */
  private static createAsyncProviders(
    options: ServiceAuthModuleAsyncOptions,
  ): Provider[] {
    return [
      {
        provide: SERVICE_AUTH_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
    ];
  }
}

/**
 * Service client provider tokens for dependency injection
 */
export const SERVICE_CLIENTS = {
  API_GATEWAY: 'SERVICE_CLIENT_API_GATEWAY',
  AUTH_SERVICE: 'SERVICE_CLIENT_AUTH_SERVICE',
  USER_SERVICE: 'SERVICE_CLIENT_USER_SERVICE',
  JOB_SERVICE: 'SERVICE_CLIENT_JOB_SERVICE',
  RESUME_SERVICE: 'SERVICE_CLIENT_RESUME_SERVICE',
  AI_SERVICE: 'SERVICE_CLIENT_AI_SERVICE',
  NOTIFICATION_SERVICE: 'SERVICE_CLIENT_NOTIFICATION_SERVICE',
  PAYMENT_SERVICE: 'SERVICE_CLIENT_PAYMENT_SERVICE',
  ANALYTICS_SERVICE: 'SERVICE_CLIENT_ANALYTICS_SERVICE',
  AUTO_APPLY_SERVICE: 'SERVICE_CLIENT_AUTO_APPLY_SERVICE',
  ORCHESTRATOR_SERVICE: 'SERVICE_CLIENT_ORCHESTRATOR_SERVICE',
} as const;
