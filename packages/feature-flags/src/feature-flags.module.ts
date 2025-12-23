import { Module, DynamicModule, Global, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import Redis from 'ioredis';
import { FeatureFlagEntity } from './entities/feature-flag.entity';
import { FeatureFlagService } from './services/feature-flag.service';
import { FeatureFlagAdminService } from './services/feature-flag-admin.service';
import { FeatureGatingService } from './services/feature-gating.service';
import { FeatureFlagGuard } from './guards/feature-flag.guard';
import {
  FeatureGatedGuard,
  FeatureAccessLogger,
  FEATURE_ACCESS_LOGGER,
  InMemoryFeatureAccessLogger,
} from './guards/feature-gated.guard';

export interface FeatureFlagsModuleOptions {
  redis?: Redis;
  isGlobal?: boolean;
  /**
   * Enable feature gating guard (combines feature flags with subscription tiers)
   */
  enableFeatureGating?: boolean;
  /**
   * Register FeatureGatedGuard as global guard
   */
  featureGatingGlobal?: boolean;
  /**
   * Custom feature access logger for audit logging
   */
  accessLogger?: Type<FeatureAccessLogger>;
}

@Module({})
export class FeatureFlagsModule {
  static forRoot(options: FeatureFlagsModuleOptions = {}): DynamicModule {
    const providers: any[] = [
      FeatureFlagService,
      FeatureFlagAdminService,
      FeatureFlagGuard,
    ];

    const exports: any[] = [
      FeatureFlagService,
      FeatureFlagAdminService,
      FeatureFlagGuard,
    ];

    // Add Redis provider if instance is provided
    if (options.redis) {
      providers.push({
        provide: Redis,
        useValue: options.redis,
      });
    }

    // Add feature gating if enabled
    if (options.enableFeatureGating) {
      providers.push(
        FeatureGatedGuard,
        FeatureGatingService,
      );

      // Add access logger
      if (options.accessLogger) {
        providers.push({
          provide: FEATURE_ACCESS_LOGGER,
          useClass: options.accessLogger,
        });
      } else {
        providers.push({
          provide: FEATURE_ACCESS_LOGGER,
          useClass: InMemoryFeatureAccessLogger,
        });
      }

      exports.push(
        FeatureGatedGuard,
        FeatureGatingService,
        FEATURE_ACCESS_LOGGER,
      );

      // Register as global guard if requested
      if (options.featureGatingGlobal) {
        providers.push({
          provide: APP_GUARD,
          useClass: FeatureGatedGuard,
        });
      }
    }

    return {
      module: FeatureFlagsModule,
      imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
      providers,
      exports,
      global: options.isGlobal ?? true,
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: FeatureFlagsModule,
      imports: [TypeOrmModule.forFeature([FeatureFlagEntity])],
      providers: [FeatureFlagService, FeatureFlagAdminService, FeatureFlagGuard],
      exports: [FeatureFlagService, FeatureFlagAdminService, FeatureFlagGuard],
    };
  }

  /**
   * Register with full feature gating support
   * Includes subscription tier checking, feature flags, and audit logging
   */
  static forRootWithGating(options: FeatureFlagsModuleOptions = {}): DynamicModule {
    return this.forRoot({
      ...options,
      enableFeatureGating: true,
    });
  }
}
