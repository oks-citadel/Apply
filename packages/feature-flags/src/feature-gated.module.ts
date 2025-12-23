import { Module, DynamicModule, Global, Provider, Type } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  FeatureGatedGuard,
  FeatureAccessLogger,
  FEATURE_ACCESS_LOGGER,
  InMemoryFeatureAccessLogger,
} from './guards/feature-gated.guard';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagEntity } from './entities/feature-flag.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

/**
 * Configuration options for the FeatureGatedModule
 */
export interface FeatureGatedModuleOptions {
  /**
   * Whether to register the guard globally
   * If true, all routes will be subject to feature gating checks
   * Default: false
   */
  isGlobal?: boolean;

  /**
   * Whether to use this module as a global provider
   * Default: true
   */
  global?: boolean;

  /**
   * Custom feature access logger implementation
   * If not provided, uses InMemoryFeatureAccessLogger
   */
  accessLogger?: Type<FeatureAccessLogger>;

  /**
   * Whether to include the FeatureFlagService dependency
   * Set to false if you're providing it separately
   * Default: true
   */
  includeFeatureFlagService?: boolean;

  /**
   * Whether to include TypeORM entity imports
   * Set to false if entities are imported elsewhere
   * Default: true
   */
  includeTypeOrmEntities?: boolean;
}

/**
 * Async configuration options for the FeatureGatedModule
 */
export interface FeatureGatedModuleAsyncOptions {
  /**
   * Whether to register the guard globally
   */
  isGlobal?: boolean;

  /**
   * Whether to use this module as a global provider
   */
  global?: boolean;

  /**
   * Modules to import
   */
  imports?: any[];

  /**
   * Factory function to create configuration
   */
  useFactory?: (...args: any[]) => Promise<FeatureGatedModuleOptions> | FeatureGatedModuleOptions;

  /**
   * Dependencies to inject into the factory
   */
  inject?: any[];

  /**
   * Whether to include TypeORM entity imports
   */
  includeTypeOrmEntities?: boolean;
}

/**
 * FeatureGatedModule
 *
 * NestJS module that provides comprehensive feature gating functionality.
 *
 * Features:
 * - Subscription tier verification
 * - Feature flag checking
 * - Role-based and beta tester bypass
 * - Access logging and auditing
 * - Configurable global or route-specific usage
 *
 * @example
 * // Basic usage - import in your module
 * @Module({
 *   imports: [
 *     FeatureGatedModule.forRoot({
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * @example
 * // With custom access logger
 * @Module({
 *   imports: [
 *     FeatureGatedModule.forRoot({
 *       isGlobal: false,
 *       accessLogger: CustomAuditLogger,
 *     }),
 *   ],
 * })
 * export class FeatureModule {}
 *
 * @example
 * // Async configuration
 * @Module({
 *   imports: [
 *     FeatureGatedModule.forRootAsync({
 *       imports: [ConfigModule],
 *       useFactory: (config: ConfigService) => ({
 *         isGlobal: config.get('FEATURE_GATING_GLOBAL') === 'true',
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Module({})
export class FeatureGatedModule {
  /**
   * Register the module with static configuration
   */
  static forRoot(options: FeatureGatedModuleOptions = {}): DynamicModule {
    const {
      isGlobal = false,
      global = true,
      accessLogger,
      includeFeatureFlagService = true,
      includeTypeOrmEntities = true,
    } = options;

    const providers: Provider[] = [
      FeatureGatedGuard,
    ];

    // Add access logger provider
    if (accessLogger) {
      providers.push({
        provide: FEATURE_ACCESS_LOGGER,
        useClass: accessLogger,
      });
    } else {
      providers.push({
        provide: FEATURE_ACCESS_LOGGER,
        useClass: InMemoryFeatureAccessLogger,
      });
    }

    // Add feature flag service if requested
    if (includeFeatureFlagService) {
      providers.push(FeatureFlagService);
    }

    // Add global guard if requested
    if (isGlobal) {
      providers.push({
        provide: APP_GUARD,
        useClass: FeatureGatedGuard,
      });
    }

    const imports: any[] = [];
    if (includeTypeOrmEntities) {
      imports.push(TypeOrmModule.forFeature([FeatureFlagEntity]));
    }

    return {
      module: FeatureGatedModule,
      imports,
      providers,
      exports: [
        FeatureGatedGuard,
        FEATURE_ACCESS_LOGGER,
        ...(includeFeatureFlagService ? [FeatureFlagService] : []),
      ],
      global,
    };
  }

  /**
   * Register the module with async configuration
   */
  static forRootAsync(options: FeatureGatedModuleAsyncOptions): DynamicModule {
    const {
      isGlobal = false,
      global = true,
      imports = [],
      useFactory,
      inject = [],
      includeTypeOrmEntities = true,
    } = options;

    const providers: Provider[] = [
      FeatureGatedGuard,
    ];

    // Async configuration provider
    if (useFactory) {
      providers.push({
        provide: 'FEATURE_GATED_OPTIONS',
        useFactory,
        inject,
      });

      // Dynamic access logger provider based on options
      providers.push({
        provide: FEATURE_ACCESS_LOGGER,
        useFactory: (opts: FeatureGatedModuleOptions) => {
          if (opts.accessLogger) {
            return new opts.accessLogger();
          }
          return new InMemoryFeatureAccessLogger();
        },
        inject: ['FEATURE_GATED_OPTIONS'],
      });

      // Dynamic feature flag service provider
      providers.push({
        provide: FeatureFlagService,
        useFactory: (opts: FeatureGatedModuleOptions, ...deps: any[]) => {
          if (opts.includeFeatureFlagService !== false) {
            // This would need proper dependency injection in a real implementation
            return null; // Placeholder - actual service would be injected
          }
          return null;
        },
        inject: ['FEATURE_GATED_OPTIONS'],
      });
    } else {
      providers.push({
        provide: FEATURE_ACCESS_LOGGER,
        useClass: InMemoryFeatureAccessLogger,
      });
    }

    // Add global guard if requested
    if (isGlobal) {
      providers.push({
        provide: APP_GUARD,
        useClass: FeatureGatedGuard,
      });
    }

    const moduleImports: any[] = [...imports];
    if (includeTypeOrmEntities) {
      moduleImports.push(TypeOrmModule.forFeature([FeatureFlagEntity]));
    }

    return {
      module: FeatureGatedModule,
      imports: moduleImports,
      providers,
      exports: [FeatureGatedGuard, FEATURE_ACCESS_LOGGER, FeatureFlagService],
      global,
    };
  }

  /**
   * Register for feature modules (non-global)
   */
  static forFeature(): DynamicModule {
    return {
      module: FeatureGatedModule,
      imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
      providers: [
        FeatureGatedGuard,
        {
          provide: FEATURE_ACCESS_LOGGER,
          useClass: InMemoryFeatureAccessLogger,
        },
      ],
      exports: [FeatureGatedGuard, FEATURE_ACCESS_LOGGER],
    };
  }
}
